const express = require('express');
const { pool } = require('../db');
const { authRequired, adminOnly } = require('../middleware/auth');
const { publicReport } = require('../utils/serialize');

const router = express.Router();
router.use(authRequired);

// GET /api/reports
router.get('/', async (req, res, next) => {
  try {
    let rows;
    if (req.user.role === 'admin') {
      const { userId } = req.query;
      const result = userId
        ? await pool.query('SELECT * FROM reports WHERE user_id = $1 ORDER BY date DESC', [userId])
        : await pool.query('SELECT * FROM reports ORDER BY date DESC');
      rows = result.rows;
    } else {
      const result = await pool.query('SELECT * FROM reports WHERE user_id = $1 ORDER BY date DESC', [req.user.id]);
      rows = result.rows;
    }

    const userNames = {};
    const reports = [];
    for (const r of rows) {
      if (!(r.user_id in userNames)) {
        const { rows: uRows } = await pool.query('SELECT name FROM users WHERE id = $1', [r.user_id]);
        userNames[r.user_id] = uRows[0] ? uRows[0].name : 'مستخدم محذوف';
      }
      reports.push(publicReport(r, userNames[r.user_id]));
    }

    res.json({ reports });
  } catch (err) { next(err); }
});

// GET /api/reports/stats (مدير فقط)
router.get('/stats', adminOnly, async (req, res, next) => {
  try {
    const total = (await pool.query('SELECT COUNT(*)::int AS c FROM reports')).rows[0].c;
    const counts = {};
    for (const status of ['تم التعلم', 'يتم التعلم', 'لن يتم التعلم']) {
      counts[status] = (await pool.query('SELECT COUNT(*)::int AS c FROM reports WHERE status = $1', [status])).rows[0].c;
    }

    const { rows: members } = await pool.query("SELECT id, name FROM users WHERE role = 'member'");
    const negligence = [];
    for (const m of members) {
      const count = (await pool.query(
        "SELECT COUNT(*)::int AS c FROM reports WHERE user_id = $1 AND status = 'لن يتم التعلم'",
        [m.id]
      )).rows[0].c;
      negligence.push({ id: m.id, name: m.name, count });
    }
    negligence.sort((a, b) => b.count - a.count);

    res.json({ total, counts, negligence });
  } catch (err) { next(err); }
});

// POST /api/reports
router.post('/', async (req, res, next) => {
  try {
    const { status, description, taskId } = req.body || {};
    if (!['تم التعلم', 'يتم التعلم', 'لن يتم التعلم'].includes(status)) {
      return res.status(400).json({ error: 'يرجى اختيار حالة التعلم' });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ error: 'يرجى كتابة وصف ما تعلمته' });
    }

    let resolvedTaskId = null;
    if (taskId) {
      const { rows: taskRows } = await pool.query('SELECT id FROM tasks WHERE id = $1', [taskId]);
      if (taskRows.length) resolvedTaskId = taskRows[0].id;
    }

    const { rows } = await pool.query(
      `INSERT INTO reports (user_id, task_id, status, description, date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING *`,
      [req.user.id, resolvedTaskId, status, description.trim()]
    );
    res.status(201).json({ message: 'تم حفظ التقرير بنجاح', report: publicReport(rows[0], req.user.name) });
  } catch (err) { next(err); }
});

module.exports = router;
