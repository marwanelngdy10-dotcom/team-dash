/*
  يقوم هذا السكربت بتعبئة قاعدة البيانات بنفس بيانات العرض التوضيحي
  الموجودة في الواجهة الأمامية (team-platform.html) حتى تعمل الحسابات
  التجريبية بنفس الشكل بعد ربط الباك إند.

  التشغيل: npm run seed
*/
const bcrypt = require('bcryptjs');
const db = require('./index');

const hash = (pwd) => bcrypt.hashSync(pwd, 10);

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount > 0) {
    console.log('قاعدة البيانات تحتوي على بيانات بالفعل، تم تخطي التعبئة.');
    return;
  }

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, avatar, status, created_at)
    VALUES (@name, @email, @password_hash, @role, @avatar, @status, @created_at)
  `);

  const users = [
    { name: 'أحمد المدير', email: 'admin@company.com', password: 'Admin@123', role: 'admin', avatar: null, status: 'active', created_at: '2026-01-05' },
    { name: 'سارة عبدالله', email: 'sara@company.com', password: 'Member@123', role: 'member', avatar: null, status: 'active', created_at: '2026-01-10' },
    { name: 'خالد يوسف', email: 'khaled@company.com', password: 'Member@123', role: 'member', avatar: null, status: 'active', created_at: '2026-01-12' },
    { name: 'منى سعيد', email: 'mona@company.com', password: 'Member@123', role: 'member', avatar: null, status: 'pending', created_at: '2026-07-30' }
  ];

  const userIds = {};
  for (const u of users) {
    const info = insertUser.run({
      name: u.name,
      email: u.email,
      password_hash: hash(u.password),
      role: u.role,
      avatar: u.avatar,
      status: u.status,
      created_at: u.created_at
    });
    userIds[u.email] = info.lastInsertRowid;
  }

  const insertTask = db.prepare(`
    INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, status, due_date, created_at)
    VALUES (@title, @description, @assigned_to, @assigned_by, @priority, @status, @due_date, @created_at)
  `);

  const tasks = [
    { title: 'إعداد تقرير المبيعات الشهري', description: 'تجميع بيانات المبيعات وتحليلها لشهر يوليو', assigned_to: userIds['sara@company.com'], assigned_by: userIds['admin@company.com'], priority: 'عالية', status: 'قيد التنفيذ', due_date: '2026-08-12', created_at: '2026-08-01' },
    { title: 'مراجعة كود واجهة الإعدادات', description: 'مراجعة الـ Pull Request الخاص بصفحة الإعدادات', assigned_to: userIds['khaled@company.com'], assigned_by: userIds['admin@company.com'], priority: 'متوسطة', status: 'مكتملة', due_date: '2026-08-02', created_at: '2026-07-28' },
    { title: 'دورة أساسيات React', description: 'إنهاء الدورة التمهيدية ومشاركة ملخص عنها', assigned_to: userIds['sara@company.com'], assigned_by: userIds['admin@company.com'], priority: 'منخفضة', status: 'قيد التنفيذ', due_date: '2026-07-25', created_at: '2026-07-15' }
  ];

  const taskIds = [];
  for (const t of tasks) {
    const info = insertTask.run(t);
    taskIds.push(info.lastInsertRowid);
  }

  const insertReport = db.prepare(`
    INSERT INTO reports (user_id, task_id, status, description, date)
    VALUES (@user_id, @task_id, @status, @description, @date)
  `);

  const reports = [
    { user_id: userIds['sara@company.com'], task_id: taskIds[0], status: 'يتم التعلم', description: 'بدأت بتجميع بيانات الربع الثاني وجاري تحليل الفروقات الشهرية بين المناطق.', date: '2026-08-01' },
    { user_id: userIds['khaled@company.com'], task_id: taskIds[1], status: 'تم التعلم', description: 'انتهيت من مراجعة الكود واقترحت تحسينات على تجاوب الصفحة مع الشاشات الصغيرة.', date: '2026-07-30' },
    { user_id: userIds['sara@company.com'], task_id: taskIds[2], status: 'لن يتم التعلم', description: 'لم أتمكن من إكمال الدورة هذا الأسبوع بسبب ضغط المهام الأخرى.', date: '2026-07-24' },
    { user_id: userIds['khaled@company.com'], task_id: null, status: 'يتم التعلم', description: 'أتابع دورة عن أنماط التصميم البرمجي (Design Patterns).', date: '2026-08-03' }
  ];

  for (const r of reports) insertReport.run(r);

  console.log('تمت تعبئة قاعدة البيانات ببيانات العرض التوضيحي بنجاح.');
}

seed();
