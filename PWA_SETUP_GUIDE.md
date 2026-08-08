# تحويل IT_qan إلى تطبيق (PWA) + إشعارات حقيقية — دليل التفعيل

هذا الدليل بيوصّلك من الوضع الحالي (موقع فيه إشعارات داخلية بس، بتتحدّث
كل 20 ثانية لما الموقع مفتوح) لوضع تطبيق قابل للتثبيت على الموبايل/
الكمبيوتر، بيوصله إشعار نظام حقيقي حتى لو التطبيق مقفول تمامًا.

## الملفات الجديدة/المعدّلة في هذا التسليم

| الملف | الغرض |
|---|---|
| `index.html` | نفس ملفك + إضافة تسجيل PWA + اشتراك Push |
| `manifest.json` | **جديد** — يخلي المتصفح يعرض "تثبيت التطبيق" |
| `service-worker.js` | **جديد** — يستقبل Push ويعرض إشعار نظام + كاش بسيط للعمل شبه أوفلاين |
| `icons/icon-192.png`, `icons/icon-512.png`, `icons/apple-touch-icon.png` | **جديد** — أيقونة التطبيق (مأخوذة من أيقونة موقعك الحالية، لو عندك شعار أعلى جودة ابعتهولي وأستبدلها) |
| `supabase_migration_v20_push.sql` | **جديد** — جدول `push_subscriptions` |
| `supabase/functions/send-push/index.ts` | **جديد** — Edge Function بترسل Push الفعلي |

---

## الخطوة 1 — ارفع الملفات على GitHub

في نفس الريبو بتاع `team-dash`، حط الملفات دي **بجانب** `index.html` (في
نفس المجلد الجذري بالظبط):

```
team-dash/
├── index.html          (استبدل بالنسخة الجديدة)
├── manifest.json        (جديد)
├── service-worker.js     (جديد)
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    └── apple-touch-icon.png
```

بعد الرفع، الموقع هيبقى فيه زرار/إشعار "تثبيت التطبيق" يظهر تلقائيًا في
Chrome/Edge (على الموبايل والكمبيوتر)، وعلى آيفون بيتم عن طريق: مشاركة ←
"إضافة إلى الشاشة الرئيسية".

## الخطوة 2 — شغّل ملف SQL الجديد

Supabase Dashboard → SQL Editor → New query → الصق `supabase_migration_v20_push.sql`
كامل → Run.

## الخطوة 3 — انشر Edge Function الخاصة بإرسال Push

محتاج Supabase CLI مثبت عندك (مرة واحدة فقط):

```bash
npm install -g supabase
supabase login
supabase link --project-ref pkpeglpoyeeiaobfoqnv
```

سجّل مفاتيح VAPID (تم توليدها جاهزة لموقعك، خاصة بيه وحده):

```bash
supabase secrets set VAPID_PUBLIC_KEY="BJnET486fibBjhXA4Vm9hea7QrldJ0P-gr6OOTs51o5p-ZgCWNEexiaNixP7zrFE7ybZ9pzh2is3cpDzH51g0c4"
supabase secrets set VAPID_PRIVATE_KEY="apSQ1O6Ppr80tya2XIOlEC0IGtLM-exRFzD0H3HnDxo"
supabase secrets set VAPID_SUBJECT="mailto:admin@itqan.com"
```

> ⚠️ `VAPID_PRIVATE_KEY` سرّي — متبعتوش لحد ومتحطوش في `index.html`. لو
> بعت حد غيرك الرابط ده اعتبره تسرّب وولّد مفاتيح جديدة (`npx web-push
> generate-vapid-keys`) وسجّلها من جديد.

انسخ مجلد `supabase/functions/send-push` جوه مجلد مشروعك المحلي (اللي
فيه ملف `supabase/config.toml`)، وانشر:

```bash
supabase functions deploy send-push --no-verify-jwt
```

## الخطوة 4 — اربط Database Webhook (السطر اللي بيوصل كل حاجة ببعض)

Supabase Dashboard → **Database → Webhooks** → **Create a new hook**:

- **Name**: `notify-on-new-notification` (أي اسم)
- **Table**: `notifications`
- **Events**: ✅ Insert فقط
- **Type**: `Supabase Edge Functions`
- **Edge Function**: `send-push`
- **HTTP Method**: `POST`
- **Timeout**: الافتراضي كفاية

احفظ. من هنا، أي صف جديد في `notifications` (رسالة شات، إسناد مهمة،
إنذار تقصير...) هيبعت تلقائيًا Push حقيقي لكل أجهزة صاحبه.

## الخطوة 5 — جرّب

1. افتح الموقع من موبايل (أو كمبيوتر) وسجّل دخول، ووافق على إذن
   الإشعارات لما المتصفح يسألك.
2. من جهاز/حساب تاني، ابعت رسالة شات لنفس العضو أو أسنِد له مهمة.
3. المفروض يوصله إشعار نظام فورًا — حتى لو قافل التاب أو التطبيق خالص.

---

## أسئلة متوقعة

**هل الملفات القديمة (`server.js`, `package.json`, `README.md`,
`supabase_migration_negligence.sql`) دخلت في التحديث ده؟**
لأ — دي كانت نسخة قديمة/بديلة (Express + Postgres مباشر) شكلها مش
مستخدمة فعليًا في موقعك الحالي، لأن `index.html` بيتكلم مع Supabase
مباشرة (`createClient` + Auth + RLS). سيبتهم زي ما هما، التحديث ده
مركّز بالكامل على نفس بنية Supabase الموجودة عندك فعلًا.

**هل الإشعارات هتشتغل على آيفون؟**
نعم من iOS 16.4+، بس بشرط إن المستخدم يضيف الموقع لشاشته الرئيسية
الأول (مش من التاب العادي في Safari) — قيد من آبل نفسها مش حاجة تقدر
تتحكم فيها.

**عايز أيقونة أعلى جودة من اللي اتحطت (64×64 مكبّرة)؟**
ابعتلي شعار بصيغة PNG/SVG مربّع وهبني بيه نسخ 192px و512px صح.
