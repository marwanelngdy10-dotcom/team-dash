const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL غير موجود في متغيرات البيئة. أضفه في .env محليًا، أو في إعدادات الاستضافة (Render/Railway) بقيمة رابط الاتصال من Supabase.'
  );
}

// SSL مطلوب للاتصال بقاعدة بيانات Supabase من خارج شبكتها
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL CHECK (role IN ('admin','member')) DEFAULT 'member',
      avatar        TEXT,
      status        TEXT NOT NULL CHECK (status IN ('active','pending','disabled')) DEFAULT 'pending',
      created_at    DATE NOT NULL DEFAULT CURRENT_DATE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id           SERIAL PRIMARY KEY,
      title        TEXT NOT NULL,
      description  TEXT DEFAULT '',
      assigned_to  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
      priority     TEXT NOT NULL CHECK (priority IN ('عالية','متوسطة','منخفضة')) DEFAULT 'متوسطة',
      status       TEXT NOT NULL CHECK (status IN ('قيد التنفيذ','مكتملة')) DEFAULT 'قيد التنفيذ',
      due_date     DATE NOT NULL,
      created_at   DATE NOT NULL DEFAULT CURRENT_DATE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      task_id     INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
      status      TEXT NOT NULL CHECK (status IN ('تم التعلم','يتم التعلم','لن يتم التعلم')),
      description TEXT NOT NULL,
      date        DATE NOT NULL DEFAULT CURRENT_DATE
    );
  `);
}

module.exports = { pool, initSchema };
