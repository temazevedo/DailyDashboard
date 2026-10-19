import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

// Single SQLite file, created automatically on first start.
const db = new Database(path.join(dataDir, 'dashboard.db'));

db.exec(`
CREATE TABLE IF NOT EXISTS entries (
  date      TEXT PRIMARY KEY,   -- YYYY-MM-DD
  weight_kg REAL NULL,
  mood      INTEGER NULL,
  sleep     INTEGER NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  date TEXT NOT NULL,           -- creation date, YYYY-MM-DD
  done INTEGER NOT NULL DEFAULT 0
);
`);

export default db;
