const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول أولًا' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'المستخدم غير موجود' });
    if (user.status === 'disabled') return res.status(403).json({ error: 'تم تعطيل هذا الحساب' });
    if (user.status === 'pending') return res.status(403).json({ error: 'حسابك قيد المراجعة' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'جلسة غير صالحة أو منتهية، يرجى تسجيل الدخول مجددًا' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'هذا الإجراء متاح للمدير فقط' });
  }
  next();
}

module.exports = { authRequired, adminOnly, JWT_SECRET };
