import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserIdFromToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionUserId = getUserIdFromToken(token);

  if (!sessionUserId) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const requestedUserId = body.userId ? Number(body.userId) : sessionUserId;
  const doi = (body.doi as string | undefined)?.trim();
  const ratingValue = Number(body.rating);

  if (!doi || Number.isNaN(ratingValue)) {
    return NextResponse.json({ message: 'Paper DOI and rating are required.' }, { status: 400 });
  }

  if (requestedUserId !== sessionUserId) {
    return NextResponse.json({ message: 'Not authorized to modify this paper.' }, { status: 403 });
  }

  const clampedRating = Math.max(0, Math.min(5, ratingValue));

  const result = db
    .prepare('UPDATE user_paper_todo SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND doi = ?')
    .run(clampedRating, sessionUserId, doi);

  if (result.changes === 0) {
    return NextResponse.json({ message: 'Paper not found.' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Rating updated successfully!' });
}
