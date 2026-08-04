function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    status: u.status,
    createdAt: u.created_at
  };
}

function publicTask(t) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    assignedTo: t.assigned_to,
    assignedBy: t.assigned_by,
    priority: t.priority,
    status: t.status,
    dueDate: t.due_date,
    createdAt: t.created_at
  };
}

function publicReport(r, userName) {
  return {
    id: r.id,
    userId: r.user_id,
    userName: userName || r.user_name,
    taskId: r.task_id,
    status: r.status,
    description: r.description,
    date: r.date
  };
}

module.exports = { publicUser, publicTask, publicReport };
