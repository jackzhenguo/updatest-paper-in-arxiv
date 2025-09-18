import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const userId = getUserIdFromToken(token);

  if (!userId) {
    return NextResponse.json({ message: 'Not logged in.' });
  }

  return NextResponse.json({ message: 'Already logged in.', userId });
}
