import Database from "@tauri-apps/plugin-sql";

// Single shared SQLite connection for the whole app. The schema is created by
// the Rust-side migrations (src-tauri/migrations/, registered in lib.rs); this
// module just opens the connection and hands it to the data layer.
//
// This is the ONLY module that knows the database name. Everything above it
// (the data layer, then the UI) works through typed functions, never raw SQL
// scattered around the app.

const DB_NAME = "sqlite:plannea.db";

let connection: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (!connection) {
    connection = Database.load(DB_NAME);
  }
  return connection;
}
