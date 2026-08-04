const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authRequired, JWT_SECRET } = require('../middleware/auth');
const { publicUser } = require('../utils/serialize');

const router = express.Router();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// POST /api/auth/register  -> إنشاء حساب عضو جديد بحالة "pending"
router.post('/register', (req, res) => {
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
  const exists = db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(normalizedEmail);
  if (exists) {
    return res.status(409).json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, status)
    VALUES (?, ?, ?, 'member', 'pending')
  `).run(name.trim(), normalizedEmail, passwordHash);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  return res.status(201).json({
    message: 'تم إرسال طلبك بنجاح! سيتم إشعارك بعد موافقة المدير.',
    user: publicUser(user)
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(normalizedEmail);

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
});

// GET /api/auth/me
router.get('/me', authRequired, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// PUT /api/auth/change-password
router.put('/change-password', authRequired, (req, res) => {
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
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);
  res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
});

// PUT /api/auth/avatar  -> body: { avatar: "data:image/...;base64,..." }
router.put('/avatar', authRequired, (req, res) => {
  const { avatar } = req.body || {};
  if (!avatar || !String(avatar).startsWith('data:image/')) {
    return res.status(400).json({ error: 'يرجى اختيار ملف صورة صالح' });
  }
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ message: 'تم تحديث الصورة الشخصية', user: publicUser(user) });
});

module.exports = router;
