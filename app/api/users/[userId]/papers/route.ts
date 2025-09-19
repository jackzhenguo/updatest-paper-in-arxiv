import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserIdFromToken, SESSION_COOKIE_NAME } from '@/lib/auth';

interface Params {
  params: {
    userId: string;
  };
}

interface PaperRow {
  id: number;
  paper_title: string;
  paper_link: string | null;
  doi: string | null;
  published: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  rating: number | null;
}

export async function GET(req: NextRequest, { params }: Params) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionUserId = getUserIdFromToken(token);
  const requestedUserId = Number(params.userId);

  if (!sessionUserId) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  if (requestedUserId !== sessionUserId) {
    return NextResponse.json({ message: 'Not authorized to access these papers.' }, { status: 403 });
  }

  const rows = db
    .prepare(
      `SELECT id, paper_title, paper_link, doi, published, status, created_at, updated_at, rating
       FROM user_paper_todo
       WHERE user_id = ?
       ORDER BY created_at DESC`
    )
    .all(requestedUserId) as PaperRow[];

  const papers = rows.map((row) => ({
    id: row.id,
    title: row.paper_title,
    link: row.paper_link,
    doi: row.doi,
    published: row.published,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    rating: row.rating,
  }));

  return NextResponse.json({ papers });
}
