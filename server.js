require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { initSchema } = require('./src/db');
const { seedDemoData } = require('./src/db/seed');
const authRoutes = require('./src/routes/auth');
const usersRoutes = require('./src/routes/users');
const tasksRoutes = require('./src/routes/tasks');
const reportsRoutes = require('./src/routes/reports');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '6mb' })); // يسمح باستقبال الصورة الشخصية بصيغة base64

// حماية بسيطة من محاولات تسجيل الدخول المتكررة
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'محاولات كثيرة جدًا، حاول مرة أخرى بعد قليل' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/reports', reportsRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'المسار غير موجود' }));

// معالج أخطاء عام
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'حدث خطأ في الخادم' });
});

initSchema()
  .then(async () => {
    // تعبئة تلقائية ببيانات العرض التوضيحي عند أول تشغيل فقط،
    // مفيدة للباقات المجانية اللي مالهاش Shell (زي Render Free)
    if (process.env.AUTO_SEED === 'true') {
      await seedDemoData().catch(err => console.error('⚠️ فشل الـ auto-seed:', err.message));
    }
    app.listen(PORT, () => {
      console.log(`✅ TeamFlow API يعمل على http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ فشل الاتصال بقاعدة البيانات (Supabase):', err.message);
    process.exit(1);
  });
