import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import db from '@/lib/db';
import { createSession, deleteSession, getUserIdFromToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const emailRaw = body.email as string | undefined;
  const password = body.password as string | undefined;

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const existingSessionUser = getUserIdFromToken(token);

  if (!emailRaw || !password) {
    if (existingSessionUser) {
      return NextResponse.json({ message: 'Already logged in.', userId: existingSessionUser });
    }
    return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
  }

  const email = emailRaw.trim().toLowerCase();
  const user = db.prepare('SELECT id, password FROM users WHERE email = ?').get(email);

  if (!user) {
    return NextResponse.json({ message: 'Invalid credentials, please try again.' }, { status: 401 });
  }

  const passwordMatches = await compare(password, user.password);
  if (!passwordMatches) {
    return NextResponse.json({ message: 'Invalid credentials, please try again.' }, { status: 401 });
  }

  deleteSession(token);

  const sessionToken = createSession(user.id);
  const response = NextResponse.json({ message: 'Login successful.', userId: user.id });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
