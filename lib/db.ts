import fs from 'fs';
import path from 'path';

type RunResult = { changes: number; lastInsertRowid: number };

interface StatementLike {
  all: (...params: unknown[]) => unknown[];
  get: (...params: unknown[]) => unknown;
  run: (...params: unknown[]) => RunResult;
}

interface DatabaseLike {
  exec: (sql: string) => unknown;
  pragma: (statement: string) => unknown;
  prepare: (sql: string) => StatementLike;
}

type BetterSqlite3Module = typeof import('better-sqlite3');

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });
const sqlitePath = path.join(dataDir, 'app.db');
const fallbackPath = path.join(dataDir, 'app.json');

let cachedDb: DatabaseLike | null = null;
let sqliteModule: BetterSqlite3Module | null = null;
let reportedSqliteFailure = false;

const loadBetterSqlite3 = () => {
  if (sqliteModule || reportedSqliteFailure) {
    return;
  }

  try {
    // eslint-disable-next-line global-require
    sqliteModule = require('better-sqlite3') as BetterSqlite3Module;
  } catch (error) {
    reportedSqliteFailure = true;
    console.warn('Failed to load better-sqlite3. Falling back to JSON storage.', error);
  }
};

const tryCreateSqliteDatabase = (): DatabaseLike | null => {
  loadBetterSqlite3();

  if (!sqliteModule) {
    return null;
  }

  try {
    const database = new sqliteModule(sqlitePath);
    database.pragma('journal_mode = WAL');
    database.pragma('foreign_keys = ON');

    database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_paper_todo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        paper_title TEXT NOT NULL,
        doi TEXT,
        paper_link TEXT,
        published TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        rating INTEGER DEFAULT 2,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, doi)
      );

      CREATE TRIGGER IF NOT EXISTS trigger_update_timestamp
      AFTER UPDATE ON user_paper_todo
      FOR EACH ROW
      BEGIN
        UPDATE user_paper_todo SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    return database as unknown as DatabaseLike;
  } catch (error) {
    if (!reportedSqliteFailure) {
      reportedSqliteFailure = true;
      console.warn('Failed to initialize better-sqlite3. Falling back to JSON storage.', error);
    }
    return null;
  }
};

const normalizeSql = (sql: string) => sql.replace(/\s+/g, ' ').trim().toUpperCase();

const SQL_SELECT_USER_ID_BY_EMAIL = normalizeSql('SELECT id FROM users WHERE email = ?');
const SQL_INSERT_USER = normalizeSql('INSERT INTO users (email, password) VALUES (?, ?)');
const SQL_SELECT_USER_WITH_PASSWORD = normalizeSql('SELECT id, password FROM users WHERE email = ?');
const SQL_INSERT_SESSION = normalizeSql('INSERT INTO sessions (token, user_id) VALUES (?, ?)');
const SQL_SELECT_SESSION = normalizeSql('SELECT user_id FROM sessions WHERE token = ?');
const SQL_DELETE_SESSION = normalizeSql('DELETE FROM sessions WHERE token = ?');
const SQL_SELECT_PAPER_BY_USER_AND_DOI = normalizeSql(
  'SELECT id FROM user_paper_todo WHERE user_id = ? AND doi = ?',
);
const SQL_INSERT_PAPER = normalizeSql(
  'INSERT INTO user_paper_todo (user_id, paper_title, doi, paper_link, published) VALUES (?, ?, ?, ?, ?)',
);
const SQL_SELECT_PAPERS_BY_USER = normalizeSql(`
  SELECT id, paper_title, paper_link, doi, published, status, created_at, updated_at, rating
  FROM user_paper_todo
  WHERE user_id = ?
  ORDER BY created_at DESC
`);
const SQL_UPDATE_PAPER_STATUS = normalizeSql(
  'UPDATE user_paper_todo SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND doi = ?',
);
const SQL_UPDATE_PAPER_RATING = normalizeSql(
  'UPDATE user_paper_todo SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND doi = ?',
);
const SQL_DELETE_PAPER = normalizeSql('DELETE FROM user_paper_todo WHERE user_id = ? AND doi = ?');

interface StoredUser {
  created_at: string;
  email: string;
  id: number;
  password: string;
}

interface StoredPaper {
  created_at: string;
  doi: string;
  id: number;
  paper_link: string | null;
  paper_title: string;
  published: string | null;
  rating: number | null;
  status: string;
  updated_at: string;
  user_id: number;
}

interface StoredSession {
  created_at: string;
  token: string;
  user_id: number;
}

interface StoredData {
  nextIds: {
    user_paper_todo: number;
    users: number;
  };
  sessions: StoredSession[];
  user_paper_todo: StoredPaper[];
  users: StoredUser[];
}

type StatementHandlers = Partial<StatementLike>;

const createConstraintError = (message: string) => {
  const error = new Error(message) as Error & { code: string };
  error.code = 'SQLITE_CONSTRAINT_UNIQUE';
  return error;
};

class JsonStatement implements StatementLike {
  constructor(private readonly handlers: StatementHandlers) {}

  get(...params: unknown[]) {
    if (!this.handlers.get) {
      throw new Error('GET is not supported for this statement in JSON fallback.');
    }
    return this.handlers.get(...params);
  }

  all(...params: unknown[]) {
    if (!this.handlers.all) {
      throw new Error('ALL is not supported for this statement in JSON fallback.');
    }
    return this.handlers.all(...params);
  }

  run(...params: unknown[]) {
    if (!this.handlers.run) {
      throw new Error('RUN is not supported for this statement in JSON fallback.');
    }
    return this.handlers.run(...params);
  }
}

class JsonDatabase implements DatabaseLike {
  private data: StoredData;

  constructor(private readonly filePath: string) {
    this.data = this.load();
    this.persist();
  }

  prepare(sql: string): StatementLike {
    const normalized = normalizeSql(sql);

    switch (normalized) {
      case SQL_SELECT_USER_ID_BY_EMAIL:
        return new JsonStatement({
          get: (email: unknown) => this.selectUserIdByEmail(email),
        });
      case SQL_INSERT_USER:
        return new JsonStatement({
          run: (email: unknown, password: unknown) => this.insertUser(email, password),
        });
      case SQL_SELECT_USER_WITH_PASSWORD:
        return new JsonStatement({
          get: (email: unknown) => this.selectUserWithPassword(email),
        });
      case SQL_INSERT_SESSION:
        return new JsonStatement({
          run: (token: unknown, userId: unknown) => this.insertSession(token, userId),
        });
      case SQL_SELECT_SESSION:
        return new JsonStatement({
          get: (token: unknown) => this.selectSession(token),
        });
      case SQL_DELETE_SESSION:
        return new JsonStatement({
          run: (token: unknown) => this.deleteSession(token),
        });
      case SQL_SELECT_PAPER_BY_USER_AND_DOI:
        return new JsonStatement({
          get: (userId: unknown, doi: unknown) => this.selectPaperByUserAndDoi(userId, doi),
        });
      case SQL_INSERT_PAPER:
        return new JsonStatement({
          run: (
            userId: unknown,
            title: unknown,
            doi: unknown,
            link: unknown,
            published: unknown,
          ) => this.insertPaper(userId, title, doi, link, published),
        });
      case SQL_SELECT_PAPERS_BY_USER:
        return new JsonStatement({
          all: (userId: unknown) => this.selectPapersByUser(userId),
        });
      case SQL_UPDATE_PAPER_STATUS:
        return new JsonStatement({
          run: (status: unknown, userId: unknown, doi: unknown) =>
            this.updatePaperStatus(status, userId, doi),
        });
      case SQL_UPDATE_PAPER_RATING:
        return new JsonStatement({
          run: (rating: unknown, userId: unknown, doi: unknown) =>
            this.updatePaperRating(rating, userId, doi),
        });
      case SQL_DELETE_PAPER:
        return new JsonStatement({
          run: (userId: unknown, doi: unknown) => this.deletePaper(userId, doi),
        });
      default:
        throw new Error(`Unsupported SQL in JSON fallback: ${sql}`);
    }
  }

  exec(_: string) {
    // No-op for schema creation in the JSON fallback.
    return undefined;
  }

  pragma(statement: string) {
    const normalized = normalizeSql(statement);
    if (normalized.startsWith('JOURNAL_MODE')) {
      return 'wal';
    }
    if (normalized.startsWith('FOREIGN_KEYS')) {
      return 'on';
    }
    return undefined;
  }

  private load(): StoredData {
    if (!fs.existsSync(this.filePath)) {
      return this.createDefaultData();
    }

    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      if (!raw) {
        return this.createDefaultData();
      }

      const parsed = JSON.parse(raw) as Partial<StoredData> | null;
      return this.withDefaults(parsed ?? {});
    } catch (error) {
      console.warn('Failed to read JSON database. Re-initializing.', error);
      return this.createDefaultData();
    }
  }

  private createDefaultData(): StoredData {
    return {
      nextIds: {
        users: 1,
        user_paper_todo: 1,
      },
      sessions: [],
      user_paper_todo: [],
      users: [],
    };
  }

  private withDefaults(data: Partial<StoredData>): StoredData {
    const users = Array.isArray(data.users) ? data.users : [];
    const papers = Array.isArray(data.user_paper_todo) ? data.user_paper_todo : [];
    const sessions = Array.isArray(data.sessions) ? data.sessions : [];

    const ensureNumber = (value: unknown, fallback: number) =>
      typeof value === 'number' && Number.isFinite(value) ? value : fallback;

    const nextUserId = ensureNumber(
      data.nextIds?.users,
      users.reduce((max, user) => Math.max(max, typeof user.id === 'number' ? user.id : 0), 0) + 1,
    );
    const nextPaperId = ensureNumber(
      data.nextIds?.user_paper_todo,
      papers.reduce((max, paper) => Math.max(max, typeof paper.id === 'number' ? paper.id : 0), 0) + 1,
    );

    return {
      nextIds: {
        users: nextUserId,
        user_paper_todo: nextPaperId,
      },
      sessions,
      user_paper_todo: papers,
      users,
    };
  }

  private persist() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  private allocateId(key: 'users' | 'user_paper_todo') {
    const id = this.data.nextIds[key];
    this.data.nextIds[key] += 1;
    return id;
  }

  private selectUserIdByEmail(email: unknown) {
    if (typeof email !== 'string') {
      return undefined;
    }
    const user = this.data.users.find((entry) => entry.email === email);
    return user ? { id: user.id } : undefined;
  }

  private insertUser(email: unknown, password: unknown): RunResult {
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new TypeError('Invalid parameters for inserting user');
    }

    if (this.data.users.some((entry) => entry.email === email)) {
      throw createConstraintError('UNIQUE constraint failed: users.email');
    }

    const now = new Date().toISOString();
    const newUser: StoredUser = {
      created_at: now,
      email,
      id: this.allocateId('users'),
      password,
    };

    this.data.users.push(newUser);
    this.persist();
    return { changes: 1, lastInsertRowid: newUser.id };
  }

  private selectUserWithPassword(email: unknown) {
    if (typeof email !== 'string') {
      return undefined;
    }
    const user = this.data.users.find((entry) => entry.email === email);
    if (!user) {
      return undefined;
    }
    return { id: user.id, password: user.password };
  }

  private insertSession(token: unknown, userId: unknown): RunResult {
    const normalizedUserId = this.normalizeUserId(userId);
    if (typeof token !== 'string' || normalizedUserId === null) {
      throw new TypeError('Invalid parameters for inserting session');
    }

    this.data.sessions = this.data.sessions.filter((session) => session.token !== token);

    this.data.sessions.push({
      created_at: new Date().toISOString(),
      token,
      user_id: normalizedUserId,
    });

    this.persist();
    return { changes: 1, lastInsertRowid: 0 };
  }

  private selectSession(token: unknown) {
    if (typeof token !== 'string') {
      return undefined;
    }
    const session = this.data.sessions.find((entry) => entry.token === token);
    return session ? { user_id: session.user_id } : undefined;
  }

  private deleteSession(token: unknown): RunResult {
    if (typeof token !== 'string') {
      return { changes: 0, lastInsertRowid: 0 };
    }

    const before = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter((entry) => entry.token !== token);
    const changes = before - this.data.sessions.length;

    if (changes > 0) {
      this.persist();
    }

    return { changes, lastInsertRowid: 0 };
  }

  private normalizeUserId(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'bigint') {
      return Number(value);
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private normalizeDoi(value: unknown) {
    if (typeof value === 'string') {
      return value;
    }
    if (value == null) {
      return '';
    }
    return String(value);
  }

  private selectPaperByUserAndDoi(userId: unknown, doi: unknown) {
    const normalizedUserId = this.normalizeUserId(userId);
    if (normalizedUserId === null) {
      return undefined;
    }
    const normalizedDoi = this.normalizeDoi(doi);
    const paper = this.data.user_paper_todo.find(
      (entry) => entry.user_id === normalizedUserId && entry.doi === normalizedDoi,
    );
    return paper ? { id: paper.id } : undefined;
  }

  private insertPaper(
    userId: unknown,
    title: unknown,
    doi: unknown,
    link: unknown,
    published: unknown,
  ): RunResult {
    const normalizedUserId = this.normalizeUserId(userId);
    if (normalizedUserId === null) {
      throw new TypeError('Invalid user ID for inserting paper');
    }

    const titleText = typeof title === 'string' ? title : '';
    const doiText = this.normalizeDoi(doi);
    const linkText = typeof link === 'string' ? link : null;
    const publishedText = typeof published === 'string' ? published : null;

    if (
      this.data.user_paper_todo.some(
        (entry) => entry.user_id === normalizedUserId && entry.doi === doiText,
      )
    ) {
      throw createConstraintError('UNIQUE constraint failed: user_paper_todo.user_id, user_paper_todo.doi');
    }

    const now = new Date().toISOString();
    const newPaper: StoredPaper = {
      created_at: now,
      doi: doiText,
      id: this.allocateId('user_paper_todo'),
      paper_link: linkText,
      paper_title: titleText,
      published: publishedText,
      rating: 2,
      status: 'pending',
      updated_at: now,
      user_id: normalizedUserId,
    };

    this.data.user_paper_todo.push(newPaper);
    this.persist();
    return { changes: 1, lastInsertRowid: newPaper.id };
  }

  private selectPapersByUser(userId: unknown) {
    const normalizedUserId = this.normalizeUserId(userId);
    if (normalizedUserId === null) {
      return [];
    }

    return this.data.user_paper_todo
      .filter((entry) => entry.user_id === normalizedUserId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((entry) => ({ ...entry }));
  }

  private updatePaperStatus(status: unknown, userId: unknown, doi: unknown): RunResult {
    if (typeof status !== 'string') {
      return { changes: 0, lastInsertRowid: 0 };
    }

    const normalizedUserId = this.normalizeUserId(userId);
    if (normalizedUserId === null) {
      return { changes: 0, lastInsertRowid: 0 };
    }

    const normalizedDoi = this.normalizeDoi(doi);
    const paper = this.data.user_paper_todo.find(
      (entry) => entry.user_id === normalizedUserId && entry.doi === normalizedDoi,
    );

    if (!paper) {
      return { changes: 0, lastInsertRowid: 0 };
    }

    paper.status = status;
    paper.updated_at = new Date().toISOString();
    this.persist();
    return { changes: 1, lastInsertRowid: paper.id };
  }

  private updatePaperRating(rating: unknown, userId: unknown, doi: unknown): RunResult {
    const ratingNumber = typeof rating === 'number' ? rating : Number(rating);
    if (!Number.isFinite(ratingNumber)) {
      return { changes: 0, lastInsertRowid: 0 };
    }

    const normalizedUserId = this.normalizeUserId(userId);
    if (normalizedUserId === null) {
      return { changes: 0, lastInsertRowid: 0 };
    }

    const normalizedDoi = this.normalizeDoi(doi);
    const paper = this.data.user_paper_todo.find(
      (entry) => entry.user_id === normalizedUserId && entry.doi === normalizedDoi,
    );

    if (!paper) {
      return { changes: 0, lastInsertRowid: 0 };
    }

    const clamped = Math.max(0, Math.min(5, ratingNumber));
    paper.rating = clamped;
    paper.updated_at = new Date().toISOString();
    this.persist();
    return { changes: 1, lastInsertRowid: paper.id };
  }

  private deletePaper(userId: unknown, doi: unknown): RunResult {
    const normalizedUserId = this.normalizeUserId(userId);
    if (normalizedUserId === null) {
      return { changes: 0, lastInsertRowid: 0 };
    }

    const normalizedDoi = this.normalizeDoi(doi);
    const before = this.data.user_paper_todo.length;
    this.data.user_paper_todo = this.data.user_paper_todo.filter(
      (entry) => !(entry.user_id === normalizedUserId && entry.doi === normalizedDoi),
    );
    const changes = before - this.data.user_paper_todo.length;

    if (changes > 0) {
      this.persist();
    }

    return { changes, lastInsertRowid: 0 };
  }
}

const initDatabase = (): DatabaseLike => {
  if (cachedDb) {
    return cachedDb;
  }

  const sqliteDb = tryCreateSqliteDatabase();
  if (sqliteDb) {
    cachedDb = sqliteDb;
    return sqliteDb;
  }

  const jsonDb = new JsonDatabase(fallbackPath);
  cachedDb = jsonDb;
  return jsonDb;
};

const getDb = () => initDatabase();

export default getDb();
