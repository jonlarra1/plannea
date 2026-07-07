import { readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import type { DbClient } from "../../src/data/db";

// A DbClient backed by Node's built-in SQLite, for tests. It runs the REAL
// migration file, so the schema under test is exactly the schema the app ships.
const MIGRATION_URL = new URL("../../src-tauri/migrations/0001_init.sql", import.meta.url);

// The Tauri plugin uses $1/$2 placeholders with an array of values; node:sqlite
// wants ?. Rewrite the query and reorder the values to match.
function toPositional(query: string, bind: unknown[]): { sql: string; params: SQLInputValue[] } {
  const params: SQLInputValue[] = [];
  const sql = query.replace(/\$(\d+)/g, (_, n: string) => {
    params.push(bind[Number(n) - 1] as SQLInputValue);
    return "?";
  });
  return { sql, params };
}

export function openMemoryDb(): DbClient {
  const db = new DatabaseSync(":memory:");
  // The app side (sqlx via tauri-plugin-sql) runs with foreign keys enforced.
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(readFileSync(MIGRATION_URL, "utf8"));

  return {
    async select<T>(query: string, bind: unknown[] = []): Promise<T> {
      const { sql, params } = toPositional(query, bind);
      return db.prepare(sql).all(...params) as T;
    },
    async execute(query: string, bind: unknown[] = []): Promise<unknown> {
      const { sql, params } = toPositional(query, bind);
      return db.prepare(sql).run(...params);
    },
  };
}
