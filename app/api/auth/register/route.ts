import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import db from '@/lib/db';
import { isValidPassword } from '@/lib/password';

const isSqliteConstraintError = (error: unknown): error is { code: string } => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && code.startsWith('SQLITE_CONSTRAINT');
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const emailRaw = body.email as string | undefined;
  const password = body.password as string | undefined;

  if (!emailRaw || !password) {
    return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
  }

  if (!isValidPassword(password)) {
    return NextResponse.json(
      {
        message:
          'Password must be at least 8 characters long, contain at least one uppercase letter and one number.',
      },
      { status: 400 },
    );
  }

  const email = emailRaw.trim().toLowerCase();
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

  if (existingUser) {
    return NextResponse.json({ message: 'Email already registered.' }, { status: 400 });
  }

  const passwordHash = await hash(password, 12);

  try {
    db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, passwordHash);
  } catch (error) {
    if (isSqliteConstraintError(error)) {
      return NextResponse.json({ message: 'Email already registered.' }, { status: 400 });
    }

    console.error('Error registering user:', error);
    return NextResponse.json({ message: 'Failed to register user.' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Registration successful! Please log in.' });
}
