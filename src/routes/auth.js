const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { authRequired, JWT_SECRET } = require('../middleware/auth');
const { publicUser } = require('../utils/serialize');

const router = express.Router();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || String(name).trim().length < 3) {
      return res.status(400).json({ error: 'يرجى كتابة الاسم الكامل.' });
    }
    if (!email || !password) {
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'كلمة المرور يجب ألا تقل عن 6 أحرف.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const exists = await pool.query('SELECT id FROM users WHERE lower(email) = $1', [normalizedEmail]);
    if (exists.rows.length) {
      return res.status(409).json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'member', 'pending') RETURNING *`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    return res.status(201).json({
      message: 'تم إرسال طلبك بنجاح! سيتم إشعارك بعد موافقة المدير.',
      user: publicUser(rows[0])
    });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const { rows } = await pool.query('SELECT * FROM users WHERE lower(email) = $1', [normalizedEmail]);
    const user = rows[0];

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
    }
    if (user.status === 'pending') {
      return res.status(403).json({ error: 'حسابك قيد المراجعة، سيتم تفعيله بعد موافقة المدير.' });
    }
    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'تم تعطيل هذا الحساب. تواصل مع المدير.' });
    }

    const token = signToken(user);
    return res.json({ token, user: publicUser(user) });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', authRequired, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// PUT /api/auth/change-password
router.put('/change-password', authRequired, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};
    if (!bcrypt.compareSync(currentPassword || '', req.user.password_hash)) {
      return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'كلمة المرور الجديدة قصيرة جدًا' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'كلمتا المرور الجديدتان غير متطابقتين' });
    }
    const newHash = bcrypt.hashSync(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);
    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) { next(err); }
});

// PUT /api/auth/avatar
router.put('/avatar', authRequired, async (req, res, next) => {
  try {
    const { avatar } = req.body || {};
    if (!avatar || !String(avatar).startsWith('data:image/')) {
      return res.status(400).json({ error: 'يرجى اختيار ملف صورة صالح' });
    }
    const { rows } = await pool.query('UPDATE users SET avatar = $1 WHERE id = $2 RETURNING *', [avatar, req.user.id]);
    res.json({ message: 'تم تحديث الصورة الشخصية', user: publicUser(rows[0]) });
  } catch (err) { next(err); }
});

module.exports = router;
