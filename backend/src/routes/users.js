const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authRequired, adminOnly } = require('../middleware/auth');
const { publicUser } = require('../utils/serialize');

const router = express.Router();
router.use(authRequired, adminOnly); // كل مسارات الأعضاء متاحة للمدير فقط

// GET /api/users
router.get('/', (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  res.json({ users: users.map(publicUser) });
});

// POST /api/users  -> المدير يضيف عضوًا مفعّلًا مباشرة
router.post('/', (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const exists = db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(normalizedEmail);
  if (exists) {
    return res.status(409).json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل' });
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const finalRole = role === 'admin' ? 'admin' : 'member';
  const info = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, status)
    VALUES (?, ?, ?, ?, 'active')
  `).run(name.trim(), normalizedEmail, passwordHash, finalRole);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ message: 'تمت إضافة العضو بنجاح', user: publicUser(user) });
});

// PUT /api/users/:id/approve  -> الموافقة على طلب انضمام (pending -> active)
router.put('/:id/approve', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'العضو غير موجود' });
  db.prepare("UPDATE users SET status = 'active' WHERE id = ?").run(user.id);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  res.json({ message: `تمت الموافقة على ${user.name}`, user: publicUser(updated) });
});

// PUT /api/users/:id/toggle-status  -> تفعيل/تعطيل عضو نشط
router.put('/:id/toggle-status', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'العضو غير موجود' });
  const newStatus = user.status === 'active' ? 'disabled' : 'active';
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(newStatus, user.id);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  res.json({
    message: newStatus === 'active' ? `تم تفعيل ${user.name}` : `تم تعطيل ${user.name}`,
    user: publicUser(updated)
  });
});

// DELETE /api/users/:id  -> يغطي حالة "رفض الطلب" و"حذف العضو"
router.delete('/:id', (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'العضو غير موجود' });

  if (target.role === 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'").get().c;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'لا يمكن حذف آخر مدير في النظام' });
    }
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(target.id);
  res.json({ message: target.status === 'pending' ? 'تم رفض الطلب' : 'تم حذف العضو' });
});

module.exports = router;
