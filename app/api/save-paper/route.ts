import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserIdFromToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const userId = getUserIdFromToken(token);

  if (!userId) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const paperTitle = body.paper_title as string | undefined;
  const doiRaw = body.doi as string | undefined;
  const paperLink = body.paper_link as string | undefined;
  const published = body.published as string | undefined;

  if (!paperTitle || !paperLink) {
    return NextResponse.json({ message: 'Paper title and link are required.' }, { status: 400 });
  }

  const doi = (doiRaw ?? '').trim();

  const existing = db
    .prepare('SELECT id FROM user_paper_todo WHERE user_id = ? AND doi = ?')
    .get(userId, doi);

  if (existing) {
    return NextResponse.json({ message: 'Paper already saved for this user.' }, { status: 400 });
  }

  db.prepare(
    `INSERT INTO user_paper_todo (user_id, paper_title, doi, paper_link, published)
     VALUES (?, ?, ?, ?, ?)`
  ).run(userId, paperTitle.trim(), doi, paperLink, published ?? null);

  return NextResponse.json({ message: 'Paper saved successfully!' });
}
