const express = require('express');
const db = require('../db');
const { authRequired, adminOnly } = require('../middleware/auth');
const { publicReport } = require('../utils/serialize');

const router = express.Router();
router.use(authRequired);

// GET /api/reports
// - المدير: كل التقارير، مع فلترة اختيارية ?userId=
// - العضو: تقاريره فقط
router.get('/', (req, res) => {
  let rows;
  if (req.user.role === 'admin') {
    const { userId } = req.query;
    rows = userId
      ? db.prepare('SELECT * FROM reports WHERE user_id = ? ORDER BY date DESC').all(userId)
      : db.prepare('SELECT * FROM reports ORDER BY date DESC').all();
  } else {
    rows = db.prepare('SELECT * FROM reports WHERE user_id = ? ORDER BY date DESC').all(req.user.id);
  }

  const userNames = {};
  const reports = rows.map(r => {
    if (!(r.user_id in userNames)) {
      const u = db.prepare('SELECT name FROM users WHERE id = ?').get(r.user_id);
      userNames[r.user_id] = u ? u.name : 'مستخدم محذوف';
    }
    return publicReport(r, userNames[r.user_id]);
  });

  res.json({ reports });
});

// GET /api/reports/stats -> إحصاءات وتوزيع الحالات وعدد مرات التقصير لكل عضو (مدير فقط)
router.get('/stats', adminOnly, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS c FROM reports').get().c;
  const counts = {};
  for (const status of ['تم التعلم', 'يتم التعلم', 'لن يتم التعلم']) {
    counts[status] = db.prepare('SELECT COUNT(*) AS c FROM reports WHERE status = ?').get(status).c;
  }

  const members = db.prepare("SELECT id, name FROM users WHERE role = 'member'").all();
  const negligence = members.map(m => {
    const count = db.prepare(`
      SELECT COUNT(*) AS c FROM reports WHERE user_id = ? AND status = 'لن يتم التعلم'
    `).get(m.id).c;
    return { id: m.id, name: m.name, count };
  }).sort((a, b) => b.count - a.count);

  res.json({ total, counts, negligence });
});

// POST /api/reports -> إضافة تقرير جديد
router.post('/', (req, res) => {
  const { status, description, taskId } = req.body || {};
  if (!['تم التعلم', 'يتم التعلم', 'لن يتم التعلم'].includes(status)) {
    return res.status(400).json({ error: 'يرجى اختيار حالة التعلم' });
  }
  if (!description || !String(description).trim()) {
    return res.status(400).json({ error: 'يرجى كتابة وصف ما تعلمته' });
  }

  let resolvedTaskId = null;
  if (taskId) {
    const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
    if (task) resolvedTaskId = task.id;
  }

  const info = db.prepare(`
    INSERT INTO reports (user_id, task_id, status, description, date)
    VALUES (?, ?, ?, ?, date('now'))
  `).run(req.user.id, resolvedTaskId, status, description.trim());

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ message: 'تم حفظ التقرير بنجاح', report: publicReport(report, req.user.name) });
});

module.exports = router;
