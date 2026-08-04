const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', '..', 'data.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK(role IN ('admin','member')) DEFAULT 'member',
  avatar        TEXT,
  status        TEXT NOT NULL CHECK(status IN ('active','pending','disabled')) DEFAULT 'pending',
  created_at    TEXT NOT NULL DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  description  TEXT DEFAULT '',
  assigned_to  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by  INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  priority     TEXT NOT NULL CHECK(priority IN ('عالية','متوسطة','منخفضة')) DEFAULT 'متوسطة',
  status       TEXT NOT NULL CHECK(status IN ('قيد التنفيذ','مكتملة')) DEFAULT 'قيد التنفيذ',
  due_date     TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (date('now'))
);

CREATE TABLE IF NOT EXISTS reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id     INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  status      TEXT NOT NULL CHECK(status IN ('تم التعلم','يتم التعلم','لن يتم التعلم')),
  description TEXT NOT NULL,
  date        TEXT NOT NULL DEFAULT (date('now'))
);
`);

module.exports = db;
