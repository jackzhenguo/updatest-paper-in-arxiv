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
  const doi = (body.doi as string | undefined)?.trim();

  if (!doi) {
    return NextResponse.json({ message: 'Paper DOI is required.' }, { status: 400 });
  }

  const result = db
    .prepare('DELETE FROM user_paper_todo WHERE user_id = ? AND doi = ?')
    .run(sessionUserId, doi);

  if (result.changes === 0) {
    return NextResponse.json({ message: 'Paper not found or not owned by user.' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Paper removed successfully!' });
}
