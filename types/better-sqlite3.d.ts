declare module 'better-sqlite3' {
  namespace BetterSqlite3 {
    interface RunResult {
      changes: number;
      lastInsertRowid: number | bigint;
    }

    interface Statement {
      run(...params: unknown[]): RunResult;
      get<T = unknown>(...params: unknown[]): T | undefined;
      all<T = unknown>(...params: unknown[]): T[];
    }

    interface Database {
      prepare(source: string): Statement;
      pragma(source: string): void;
      exec(source: string): Database;
      close(): void;
    }
  }

  interface BetterSqlite3Constructor {
    new (filename: string, options?: unknown): BetterSqlite3.Database;
    (filename: string, options?: unknown): BetterSqlite3.Database;
    prototype: BetterSqlite3.Database;
  }

  const BetterSqlite3: BetterSqlite3Constructor;
  export = BetterSqlite3;
}
