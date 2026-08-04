const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { authRequired, adminOnly } = require('../middleware/auth');
const { publicUser } = require('../utils/serialize');

const router = express.Router();
router.use(authRequired, adminOnly); // كل مسارات الأعضاء متاحة للمدير فقط

// GET /api/users
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at DESC, id DESC');
    res.json({ users: rows.map(publicUser) });
  } catch (err) { next(err); }
});

// POST /api/users
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const exists = await pool.query('SELECT id FROM users WHERE lower(email) = $1', [normalizedEmail]);
    if (exists.rows.length) {
      return res.status(409).json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل' });
    }
    const passwordHash = bcrypt.hashSync(password, 10);
    const finalRole = role === 'admin' ? 'admin' : 'member';
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, $4, 'active') RETURNING *`,
      [name.trim(), normalizedEmail, passwordHash, finalRole]
    );
    res.status(201).json({ message: 'تمت إضافة العضو بنجاح', user: publicUser(rows[0]) });
  } catch (err) { next(err); }
});

// PUT /api/users/:id/approve
router.put('/:id/approve', async (req, res, next) => {
  try {
    const { rows: existing } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    const user = existing[0];
    if (!user) return res.status(404).json({ error: 'العضو غير موجود' });
    const { rows } = await pool.query("UPDATE users SET status = 'active' WHERE id = $1 RETURNING *", [user.id]);
    res.json({ message: `تمت الموافقة على ${user.name}`, user: publicUser(rows[0]) });
  } catch (err) { next(err); }
});

// PUT /api/users/:id/toggle-status
router.put('/:id/toggle-status', async (req, res, next) => {
  try {
    const { rows: existing } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    const user = existing[0];
    if (!user) return res.status(404).json({ error: 'العضو غير موجود' });
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    const { rows } = await pool.query('UPDATE users SET status = $1 WHERE id = $2 RETURNING *', [newStatus, user.id]);
    res.json({
      message: newStatus === 'active' ? `تم تفعيل ${user.name}` : `تم تعطيل ${user.name}`,
      user: publicUser(rows[0])
    });
  } catch (err) { next(err); }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows: existing } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    const target = existing[0];
    if (!target) return res.status(404).json({ error: 'العضو غير موجود' });

    if (target.role === 'admin') {
      const { rows: adminCountRows } = await pool.query("SELECT COUNT(*)::int AS c FROM users WHERE role = 'admin'");
      if (adminCountRows[0].c <= 1) {
        return res.status(400).json({ error: 'لا يمكن حذف آخر مدير في النظام' });
      }
    }

    await pool.query('DELETE FROM users WHERE id = $1', [target.id]);
    res.json({ message: target.status === 'pending' ? 'تم رفض الطلب' : 'تم حذف العضو' });
  } catch (err) { next(err); }
});

module.exports = router;
