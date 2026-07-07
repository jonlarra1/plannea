// Single shared SQLite connection for the whole app. The schema is created by
// the Rust-side migrations (src-tauri/migrations/, registered in lib.rs); this
// module just opens the connection and hands it to the data layer.
//
// This is the ONLY module that knows the database name. Everything above it
// (the data layer, then the UI) works through typed functions, never raw SQL
// scattered around the app.

// The contract a database connection must fulfil. The running app plugs in the
// Tauri SQL plugin; tests plug in an in-memory SQLite (tests/helpers/memoryDb.ts)
// running the same migration, so the data layer is tested unchanged.
export interface DbClient {
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
  execute(query: string, bindValues?: unknown[]): Promise<unknown>;
}

const DB_NAME = "sqlite:plannea.db";

let connection: Promise<DbClient> | null = null;

export function getDb(): Promise<DbClient> {
  if (!connection) {
    // Imported lazily so that loading this module outside Tauri (e.g. in
    // tests) never pulls in the plugin.
    connection = import("@tauri-apps/plugin-sql").then((m) => m.default.load(DB_NAME));
  }
  return connection;
}

// Test seam: replaces the connection before any query runs.
export function setDbClient(client: DbClient): void {
  connection = Promise.resolve(client);
}
