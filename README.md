# TeamFlow Backend — نسخة Supabase (Postgres) + استضافة سحابية

## 1) إنشاء مشروع Supabase
1. روح على https://supabase.com → New Project.
2. اختر باسورد لقاعدة البيانات واحفظه.
3. بعد إنشاء المشروع: Project Settings → Database → Connection string → **URI**
   (فعّل وضع "Connection pooling" لو موجود، وهيبقى الرابط شكله تقريبًا):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxx.supabase.co:5432/postgres
   ```

## 2) الإعداد محليًا (اختياري للتجربة قبل النشر)
```bash
cd backend
npm install
cp .env.example .env
# افتح .env وحط فيه:
#   DATABASE_URL = رابط Supabase اللي جبته فوق
#   JWT_SECRET   = قيمة عشوائية طويلة
npm run seed     # يعبّئ القاعدة بحسابات تجريبية (مرة واحدة فقط)
npm start        # يشغّل السيرفر على http://localhost:4000
```

## 3) النشر على استضافة حقيقية (مثال: Render)
1. ارفع مجلد `backend` كريبو منفصل على GitHub (أو استخدم نفس الريبو مع تحديد Root Directory).
2. على https://render.com → New → Web Service → اربط الريبو.
3. الإعدادات:
   - Root Directory: `backend` (لو الملف داخل ريبو فيه الفرونت إند كمان)
   - Build Command: `npm install`
   - Start Command: `npm start`
4. من تبويب Environment أضف المتغيرات:
   - `DATABASE_URL` = رابط Supabase
   - `JWT_SECRET` = قيمة عشوائية طويلة
   - `CORS_ORIGIN` = رابط موقعك على GitHub Pages بالظبط (مثال: `https://marwanelngdy55-ctrl.github.io`)
   - `JWT_EXPIRES_IN` = `7d`
5. بعد أول نشر (Deploy)، شغّل التعبئة مرة واحدة عبر تبويب **Shell** في Render:
   ```bash
   npm run seed
   ```
6. هتاخد رابط شكله: `https://your-service-name.onrender.com`

## 4) ربط الواجهة الأمامية
في ملف `index.html`، غيّر السطر:
```js
const API_BASE = localStorage.getItem('teamflow_api_base') || 'http://localhost:4000/api';
```
لرابط السيرفر الحقيقي:
```js
const API_BASE = localStorage.getItem('teamflow_api_base') || 'https://your-service-name.onrender.com/api';
```
ثم ارفع الملف على GitHub Pages.

## ملاحظات
- Render (النسخة المجانية) بينام السيرفر بعد فترة خمول، وأول طلب بعد النوم بياخد ثواني علشان يصحى — طبيعي.
- تأكد إن `CORS_ORIGIN` مطابق تمامًا لرابط GitHub Pages بتاعك (بدون `/` في الآخر)، وإلا هتظهر أخطاء CORS في الـ Console.
