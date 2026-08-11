-- ============================================================
-- IT-qan — تحديث v27: تصحيح جدول "الكورسات" (السبب الحقيقي وراء
--   رسالة "تعذّر إضافة الكورس" — وكمان وراء ظهور رسائل خطأ بعد أي
--   إجراء تاني في الموقع زي الموافقة على عضو أو زيادة/إنقاص التقصير)
--
--   المشكلة:
--   supabase_migration_v25_courses_page.sql عمل جدول public.courses
--   بشكل عام (عمود data من نوع jsonb، زي "مصادر التعلم").
--   بعدين supabase_migration_v26.sql حاول يعمل الجدول بشكل تاني
--   تمامًا (title / url / order) عن طريق "create table if not exists"
--   — لكن بما إن الجدول كان موجود بالفعل من v25، السطر ده معملش حاجة
--   خالص، وفضلت الأعمدة الحقيقية للجدول هي أعمدة v25 (+ categoryId
--   وbranch بس اللي اتضافوا فعليًا من v26).
--
--   النتيجة: index.html (اللي مكتوب بالكامل على أساس title/url/order)
--   كان بيحاول يقرأ ويكتب في أعمدة مش موجودة أصلًا في القاعدة —
--   فأي تحميل أو إضافة كورس كانت بتفشل، وبالتبعية أي refreshData()
--   بعد كده (تسجيل دخول، تنقّل بين الصفحات، موافقة على عضو، زيادة/
--   إنقاص يوم تقصير...) كانت بتفشل هي كمان لأن /courses جزء أساسي
--   من نفس الحمولة.
--
--   هذا الملف بيضيف الأعمدة الناقصة فعليًا لنفس الجدول الموجود (من
--   غير ما يحذف أي بيانات مفيدة)، ويشيل الأعمدة القديمة غير المستخدمة
--   (data / updatedAt) اللي جاية من نموذج v25 القديم ومالهاش أي
--   استخدام في index.html الحالي.
--
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد supabase_migration_v26.sql)
-- ============================================================

-- ------------------------------------------------------------
-- 1) إضافة الأعمدة اللي index.html فعليًا محتاجها ومش موجودة
-- ------------------------------------------------------------

alter table public.courses add column if not exists title text;
alter table public.courses add column if not exists url text;
alter table public.courses add column if not exists "order" integer not null default 0;

-- ------------------------------------------------------------
-- 2) لو فيه صفوف قديمة (من نموذج v25 بـ data jsonb) من غير title/url،
--    امسحها — مفيش أي طريقة تانية تتعرض في الواجهة الحالية أصلًا،
--    وهي بيانات مش قابلة للعرض في الشكل الجديد (data jsonb مالوش أي
--    عمود ثابت زي title/url نقدر نحوّله منه تلقائيًا بأمان)
-- ------------------------------------------------------------

delete from public.courses where title is null or url is null;

-- ------------------------------------------------------------
-- 3) دلوقتي بعد التنضيف، فرض NOT NULL + check زي ما index.html متوقّع
--    بالظبط (نفس قيود الإدراج/التعديل في courseCreate/courseUpdate)
-- ------------------------------------------------------------

alter table public.courses alter column title set not null;
alter table public.courses alter column url set not null;

alter table public.courses drop constraint if exists chk_courses_title_not_blank;
alter table public.courses add constraint chk_courses_title_not_blank
  check (char_length(trim(title)) > 0);

alter table public.courses drop constraint if exists chk_courses_url_not_blank;
alter table public.courses add constraint chk_courses_url_not_blank
  check (char_length(trim(url)) > 0);

-- ------------------------------------------------------------
-- 4) تنظيف الأعمدة القديمة غير المستخدمة من نموذج v25 (data/updatedAt)
--    — آمن الحذف لأنها مش مستخدمة في أي كود حالي في index.html
-- ------------------------------------------------------------

alter table public.courses drop column if exists data;
alter table public.courses drop column if exists "updatedAt";

-- ============================================================
-- انتهى. ملاحظات:
--
-- 1) بعد تشغيل هذا الملف، صفحة "الكورسات" المفروض تشتغل عادي —
--    تحميل الكورسات، إضافة كورس جديد، تعديل، حذف، كله هيرجع يشتغل.
--
-- 2) رسايل الخطأ اللي كانت بتظهر بعد أي إجراء تاني في الموقع (موافقة
--    على عضو، تعطيل/تفعيل، تغيير صلاحية، زيادة/إنقاص التقصير...)
--    كانت أعراض جانبية لنفس المشكلة (فشل تحميل /courses جوه
--    refreshData بعد كل إجراء) — المفروض تختفي هي كمان تلقائيًا.
--
-- 3) لو عايز حماية إضافية عشان مشكلة زي دي متأثرش على باقي الموقع في
--    المستقبل (حتى لو حصل خطأ حقيقي تاني في تحميل الكورسات)، في
--    index.html داخل دالة refreshData()، غيّر السطر:
--
--      apiFetch('/courses').then(d => { state.courses = d.courses || []; }),
--      apiFetch('/course-categories').then(d => { state.courseCategories = d.categories || []; }),
--
--    لـ:
--
--      apiFetch('/courses').then(d => { state.courses = d.courses || []; }).catch(() => {}),
--      apiFetch('/course-categories').then(d => { state.courseCategories = d.categories || []; }).catch(() => {}),
--
--    زي ما هو متبع بالفعل مع /notifications و/negligence-forgiven-days
--    — بحيث فشل تحميل الكورسات (لو حصل تاني لأي سبب) يفضل محصور في
--    صفحة الكورسات نفسها، ومايكسرش باقي الموقع.
-- ============================================================
