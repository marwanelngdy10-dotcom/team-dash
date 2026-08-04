const express = require('express');
const { pool } = require('../db');
const { authRequired, adminOnly } = require('../middleware/auth');
const { publicTask } = require('../utils/serialize');

const router = express.Router();
router.use(authRequired);

// GET /api/tasks
router.get('/', async (req, res, next) => {
  try {
    const { rows } = req.user.role === 'admin'
      ? await pool.query('SELECT * FROM tasks ORDER BY due_date ASC')
      : await pool.query('SELECT * FROM tasks WHERE assigned_to = $1 ORDER BY due_date ASC', [req.user.id]);
    res.json({ tasks: rows.map(publicTask) });
  } catch (err) { next(err); }
});

// POST /api/tasks (مدير فقط)
router.post('/', adminOnly, async (req, res, next) => {
  try {
    const { title, description, assignedTo, priority, dueDate } = req.body || {};
    if (!title || !String(title).trim()) return res.status(400).json({ error: 'عنوان المهمة مطلوب' });
    if (!assignedTo) return res.status(400).json({ error: 'يجب إسناد المهمة لعضو' });
    if (!dueDate) return res.status(400).json({ error: 'تاريخ الاستحقاق مطلوب' });

    const assignee = await pool.query('SELECT id FROM users WHERE id = $1', [assignedTo]);
    if (!assignee.rows.length) return res.status(400).json({ error: 'العضو المحدد غير موجود' });

    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, status, due_date)
       VALUES ($1, $2, $3, $4, $5, 'قيد التنفيذ', $6) RETURNING *`,
      [title.trim(), (description || '').trim(), assignedTo, req.user.id, priority || 'متوسطة', dueDate]
    );
    res.status(201).json({ message: 'تمت إضافة المهمة بنجاح', task: publicTask(rows[0]) });
  } catch (err) { next(err); }
});

// PUT /api/tasks/:id (مدير فقط)
router.put('/:id', adminOnly, async (req, res, next) => {
  try {
    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    const task = existing.rows[0];
    if (!task) return res.status(404).json({ error: 'المهمة غير موجودة' });

    const { title, description, assignedTo, priority, dueDate } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        assigned_to = COALESCE($3, assigned_to),
        priority = COALESCE($4, priority),
        due_date = COALESCE($5, due_date)
      WHERE id = $6 RETURNING *`,
      [title, description, assignedTo, priority, dueDate, task.id]
    );
    res.json({ message: 'تم تحديث المهمة', task: publicTask(rows[0]) });
  } catch (err) { next(err); }
});

// PUT /api/tasks/:id/status (صاحب المهمة أو مدير)
router.put('/:id/status', async (req, res, next) => {
  try {
    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    const task = existing.rows[0];
    if (!task) return res.status(404).json({ error: 'المهمة غير موجودة' });

    if (req.user.role !== 'admin' && task.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'لا يمكنك تعديل حالة مهمة غير مسندة لك' });
    }

    const { status } = req.body || {};
    if (!['قيد التنفيذ', 'مكتملة'].includes(status)) {
      return res.status(400).json({ error: 'حالة غير صالحة' });
    }

    const { rows } = await pool.query('UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *', [status, task.id]);
    res.json({ message: 'تم تحديث حالة المهمة', task: publicTask(rows[0]) });
  } catch (err) { next(err); }
});

// DELETE /api/tasks/:id (مدير فقط)
router.delete('/:id', adminOnly, async (req, res, next) => {
  try {
    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    const task = existing.rows[0];
    if (!task) return res.status(404).json({ error: 'المهمة غير موجودة' });
    await pool.query('DELETE FROM tasks WHERE id = $1', [task.id]);
    res.json({ message: 'تم حذف المهمة بنجاح' });
  } catch (err) { next(err); }
});

module.exports = router;
