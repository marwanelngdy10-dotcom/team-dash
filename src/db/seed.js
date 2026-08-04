/*
  تعبئة قاعدة بيانات Supabase ببيانات عرض توضيحي (حسابات تجريبية).
  - تشغيل يدوي: npm run seed
  - تشغيل تلقائي عند بدء السيرفر: ضع AUTO_SEED=true في متغيرات البيئة
    (مفيد للباقات المجانية اللي مالهاش Shell/SSH access زي Render Free)
*/
const bcrypt = require('bcryptjs');
const { pool, initSchema } = require('./index');

const hash = (pwd) => bcrypt.hashSync(pwd, 10);

async function seedDemoData() {
  const { rows: countRows } = await pool.query('SELECT COUNT(*)::int AS c FROM users');
  if (countRows[0].c > 0) {
    console.log('قاعدة البيانات تحتوي على بيانات بالفعل، تم تخطي التعبئة.');
    return;
  }

  const users = [
    { name: 'أحمد المدير', email: 'admin@company.com', password: 'Admin@123', role: 'admin', status: 'active', created_at: '2026-01-05' },
    { name: 'سارة عبدالله', email: 'sara@company.com', password: 'Member@123', role: 'member', status: 'active', created_at: '2026-01-10' },
    { name: 'خالد يوسف', email: 'khaled@company.com', password: 'Member@123', role: 'member', status: 'active', created_at: '2026-01-12' },
    { name: 'منى سعيد', email: 'mona@company.com', password: 'Member@123', role: 'member', status: 'pending', created_at: '2026-07-30' }
  ];

  const userIds = {};
  for (const u of users) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [u.name, u.email, hash(u.password), u.role, u.status, u.created_at]
    );
    userIds[u.email] = rows[0].id;
  }

  const tasks = [
    { title: 'إعداد تقرير المبيعات الشهري', description: 'تجميع بيانات المبيعات وتحليلها لشهر يوليو', assigned_to: userIds['sara@company.com'], assigned_by: userIds['admin@company.com'], priority: 'عالية', status: 'قيد التنفيذ', due_date: '2026-08-12', created_at: '2026-08-01' },
    { title: 'مراجعة كود واجهة الإعدادات', description: 'مراجعة الـ Pull Request الخاص بصفحة الإعدادات', assigned_to: userIds['khaled@company.com'], assigned_by: userIds['admin@company.com'], priority: 'متوسطة', status: 'مكتملة', due_date: '2026-08-02', created_at: '2026-07-28' },
    { title: 'دورة أساسيات React', description: 'إنهاء الدورة التمهيدية ومشاركة ملخص عنها', assigned_to: userIds['sara@company.com'], assigned_by: userIds['admin@company.com'], priority: 'منخفضة', status: 'قيد التنفيذ', due_date: '2026-07-25', created_at: '2026-07-15' }
  ];

  const taskIds = [];
  for (const t of tasks) {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, status, due_date, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [t.title, t.description, t.assigned_to, t.assigned_by, t.priority, t.status, t.due_date, t.created_at]
    );
    taskIds.push(rows[0].id);
  }

  const reports = [
    { user_id: userIds['sara@company.com'], task_id: taskIds[0], status: 'يتم التعلم', description: 'بدأت بتجميع بيانات الربع الثاني وجاري تحليل الفروقات الشهرية بين المناطق.', date: '2026-08-01' },
    { user_id: userIds['khaled@company.com'], task_id: taskIds[1], status: 'تم التعلم', description: 'انتهيت من مراجعة الكود واقترحت تحسينات على تجاوب الصفحة مع الشاشات الصغيرة.', date: '2026-07-30' },
    { user_id: userIds['sara@company.com'], task_id: taskIds[2], status: 'لن يتم التعلم', description: 'لم أتمكن من إكمال الدورة هذا الأسبوع بسبب ضغط المهام الأخرى.', date: '2026-07-24' },
    { user_id: userIds['khaled@company.com'], task_id: null, status: 'يتم التعلم', description: 'أتابع دورة عن أنماط التصميم البرمجي (Design Patterns).', date: '2026-08-03' }
  ];

  for (const r of reports) {
    await pool.query(
      `INSERT INTO reports (user_id, task_id, status, description, date) VALUES ($1,$2,$3,$4,$5)`,
      [r.user_id, r.task_id, r.status, r.description, r.date]
    );
  }

  console.log('تمت تعبئة قاعدة البيانات ببيانات العرض التوضيحي بنجاح.');
}

// تشغيل مباشر عبر: npm run seed
if (require.main === module) {
  initSchema()
    .then(() => seedDemoData())
    .catch(err => { console.error(err); process.exitCode = 1; })
    .finally(() => pool.end());
}

module.exports = { seedDemoData };
