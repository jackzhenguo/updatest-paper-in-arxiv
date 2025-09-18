import crypto from 'crypto';
import db from './db';

export const SESSION_COOKIE_NAME = 'session_token';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const createSession = (userId: number) => {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
  return token;
};

export const getUserIdFromToken = (token?: string | null): number | null => {
  if (!token) {
    return null;
  }
  const row = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token);
  if (!row) {
    return null;
  }
  return row.user_id as number;
};

export const deleteSession = (token?: string | null) => {
  if (!token) {
    return;
  }
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
};
