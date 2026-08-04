const express = require('express');
const db = require('../db');
const { authRequired, adminOnly } = require('../middleware/auth');
const { publicTask } = require('../utils/serialize');

const router = express.Router();
router.use(authRequired);

// GET /api/tasks -> المدير يرى الكل، العضو يرى مهامه فقط
router.get('/', (req, res) => {
  const rows = req.user.role === 'admin'
    ? db.prepare('SELECT * FROM tasks ORDER BY due_date ASC').all()
    : db.prepare('SELECT * FROM tasks WHERE assigned_to = ? ORDER BY due_date ASC').all(req.user.id);
  res.json({ tasks: rows.map(publicTask) });
});

// POST /api/tasks -> إنشاء مهمة جديدة (مدير فقط)
router.post('/', adminOnly, (req, res) => {
  const { title, description, assignedTo, priority, dueDate } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'عنوان المهمة مطلوب' });
  if (!assignedTo) return res.status(400).json({ error: 'يجب إسناد المهمة لعضو' });
  if (!dueDate) return res.status(400).json({ error: 'تاريخ الاستحقاق مطلوب' });

  const assignee = db.prepare('SELECT id FROM users WHERE id = ?').get(assignedTo);
  if (!assignee) return res.status(400).json({ error: 'العضو المحدد غير موجود' });

  const info = db.prepare(`
    INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, status, due_date)
    VALUES (?, ?, ?, ?, ?, 'قيد التنفيذ', ?)
  `).run(title.trim(), (description || '').trim(), assignedTo, req.user.id, priority || 'متوسطة', dueDate);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ message: 'تمت إضافة المهمة بنجاح', task: publicTask(task) });
});

// PUT /api/tasks/:id -> تعديل مهمة (مدير فقط)
router.put('/:id', adminOnly, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'المهمة غير موجودة' });

  const { title, description, assignedTo, priority, dueDate } = req.body || {};
  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      assigned_to = COALESCE(?, assigned_to),
      priority = COALESCE(?, priority),
      due_date = COALESCE(?, due_date)
    WHERE id = ?
  `).run(title, description, assignedTo, priority, dueDate, task.id);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
  res.json({ message: 'تم تحديث المهمة', task: publicTask(updated) });
});

// PUT /api/tasks/:id/status -> العضو يحدّث حالة مهمته الخاصة فقط
router.put('/:id/status', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'المهمة غير موجودة' });

  if (req.user.role !== 'admin' && task.assigned_to !== req.user.id) {
    return res.status(403).json({ error: 'لا يمكنك تعديل حالة مهمة غير مسندة لك' });
  }

  const { status } = req.body || {};
  if (!['قيد التنفيذ', 'مكتملة'].includes(status)) {
    return res.status(400).json({ error: 'حالة غير صالحة' });
  }

  db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, task.id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
  res.json({ message: 'تم تحديث حالة المهمة', task: publicTask(updated) });
});

// DELETE /api/tasks/:id -> حذف مهمة (مدير فقط)
router.delete('/:id', adminOnly, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'المهمة غير موجودة' });
  db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  res.json({ message: 'تم حذف المهمة بنجاح' });
});

module.exports = router;
