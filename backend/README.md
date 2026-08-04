# TeamFlow — الباك إند (Backend API)

باك إند حقيقي لمنصة TeamFlow (الملف `team-platform.html`)، مبني بـ **Node.js + Express**
مع قاعدة بيانات **SQLite** (عبر `better-sqlite3`) وتوثيق بجلسات **JWT**.
يغطي كل ما تفعله الواجهة الأمامية حاليًا بشكل وهمي داخل المتصفح: تسجيل الدخول/التسجيل،
المهام، تقارير التعلم، وإدارة الأعضاء — لكن الآن بشكل حقيقي ودائم.

## 1) التثبيت والتشغيل

```bash
cd backend
npm install
cp .env.example .env      # ثم عدّل القيم عند الحاجة (خصوصًا JWT_SECRET)
npm run seed               # يعبّئ القاعدة بنفس بيانات العرض التجريبي (اختياري لأول مرة فقط)
npm start                  # يشغّل السيرفر على http://localhost:4000
```

للتطوير مع إعادة تشغيل تلقائية عند التعديل:
```bash
npm run dev
```

قاعدة البيانات عبارة عن ملف واحد `data.sqlite` يُنشأ تلقائيًا بجانب `server.js` — لا حاجة
لتثبيت أي سيرفر قاعدة بيانات منفصل.

### حسابات تجريبية (بعد `npm run seed`)
| البريد الإلكتروني | كلمة المرور | الدور |
|---|---|---|
| admin@company.com | Admin@123 | مدير |
| sara@company.com | Member@123 | عضو |
| khaled@company.com | Member@123 | عضو |
| mona@company.com | Member@123 | عضو (بانتظار الموافقة) |

## 2) ربط الواجهة الأمامية (team-platform.html)

الملف الحالي يخزّن كل شيء في متغيّر JavaScript وهمي (`state`) داخل المتصفح، فيضيع عند
تحديث الصفحة. لربطه بهذا الباك إند عمليًا، يلزم استبدال العمليات التي تُعدّل `state`
مباشرة باستدعاءات `fetch` لهذه الـ API، وتخزين الـ `token` بعد تسجيل الدخول (مثلاً في
`localStorage`) وإرساله في هيدر:
```
Authorization: Bearer <token>
```
هذا يحتاج تعديلًا في ملف الواجهة نفسه (دوال مثل `loginForm submit`, `renderPage`, إلخ) —
أخبرني إن أردت أن أقوم بهذا الربط لك مباشرة في نسخة معدّلة من `team-platform.html`.

## 3) هيكل المشروع

```
backend/
├── server.js              نقطة الدخول (Express app)
├── .env.example            متغيرات البيئة
├── src/
│   ├── db/
│   │   ├── index.js         الاتصال بقاعدة البيانات + إنشاء الجداول
│   │   └── seed.js           تعبئة بيانات تجريبية (npm run seed)
│   ├── middleware/
│   │   └── auth.js           التحقق من JWT + التحقق من صلاحية المدير
│   ├── routes/
│   │   ├── auth.js           تسجيل الدخول / التسجيل / الملف الشخصي
│   │   ├── users.js          إدارة الأعضاء (مدير فقط)
│   │   ├── tasks.js          المهام
│   │   └── reports.js        تقارير التعلم
│   └── utils/serialize.js    تحويل صفوف القاعدة إلى JSON نظيف للواجهة
```

## 4) توثيق الـ API

جميع المسارات بادئتها `/api`. الاستجابات JSON. المسارات المحمية تتطلب هيدر:
`Authorization: Bearer <token>`.

### المصادقة (Auth)

| Method | Path | الوصف | الصلاحية |
|---|---|---|---|
| POST | `/api/auth/register` | تسجيل عضو جديد (يدخل بحالة `pending`) | عام |
| POST | `/api/auth/login` | تسجيل الدخول، يُعيد `token` + بيانات المستخدم | عام |
| GET | `/api/auth/me` | بيانات المستخدم الحالي | مسجّل دخول |
| PUT | `/api/auth/change-password` | تغيير كلمة المرور | مسجّل دخول |
| PUT | `/api/auth/avatar` | تحديث الصورة الشخصية (`avatar` كـ base64 data URL) | مسجّل دخول |

مثال تسجيل دخول:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"Admin@123"}'
```

### الأعضاء (Users) — مدير فقط

| Method | Path | الوصف |
|---|---|---|
| GET | `/api/users` | كل الأعضاء (نشطون، معطّلون، بانتظار الموافقة) |
| POST | `/api/users` | إضافة عضو جديد مباشرة بحالة `active` |
| PUT | `/api/users/:id/approve` | الموافقة على طلب انضمام (`pending → active`) |
| PUT | `/api/users/:id/toggle-status` | تفعيل/تعطيل عضو |
| DELETE | `/api/users/:id` | حذف عضو أو رفض طلب انضمامه (يمنع حذف آخر مدير) |

### المهام (Tasks)

| Method | Path | الوصف | الصلاحية |
|---|---|---|---|
| GET | `/api/tasks` | المدير يرى الكل، العضو يرى مهامه فقط | مسجّل دخول |
| POST | `/api/tasks` | إنشاء مهمة `{title, description, assignedTo, priority, dueDate}` | مدير |
| PUT | `/api/tasks/:id` | تعديل بيانات مهمة | مدير |
| PUT | `/api/tasks/:id/status` | تحديث حالة المهمة (`قيد التنفيذ`/`مكتملة`) | صاحب المهمة أو مدير |
| DELETE | `/api/tasks/:id` | حذف مهمة | مدير |

### التقارير (Reports)

| Method | Path | الوصف | الصلاحية |
|---|---|---|---|
| GET | `/api/reports` | المدير: الكل (مع `?userId=` للفلترة)، العضو: تقاريره فقط | مسجّل دخول |
| GET | `/api/reports/stats` | إجماليات + توزيع الحالات + عدد مرات التقصير لكل عضو | مدير |
| POST | `/api/reports` | إضافة تقرير `{status, description, taskId?}` | مسجّل دخول |

## 5) ملاحظات أمنية مطبَّقة

- كلمات المرور مخزّنة بتشفير `bcrypt` (لا يوجد نص صريح في القاعدة).
- الجلسات عبر JWT موقّعة بمفتاح سرّي (`JWT_SECRET` في `.env`) — **غيّره قبل النشر الفعلي**.
- حد لعدد محاولات تسجيل الدخول/التسجيل (Rate Limiting) لمنع التخمين العشوائي لكلمات المرور.
- التحقق من الصلاحيات على مستوى كل مسار (مدير مقابل عضو، وصاحب المهمة مقابل غيره).
- قبل النشر على الإنترنت: فعّل HTTPS، اضبط `CORS_ORIGIN` على نطاق الواجهة الأمامية فقط
  بدلاً من `*`، وفكّر في نقل رفع الصور إلى تخزين ملفات حقيقي (مثل S3) بدل base64 لو زاد
  حجم الاستخدام.
