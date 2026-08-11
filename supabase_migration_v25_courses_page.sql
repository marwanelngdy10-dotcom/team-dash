-- ============================================================
-- IT-qan — تحديث v25: صفحة "الكورسات" (جدول مستقل زي "مصادر التعلم"
--   بالظبط) + إخفاء اسم "أُضيف بواسطة" من صفحة "مصادر التعلم"
--
--   المطلوب:
--   1) صفحة جديدة كاملة اسمها "الكورسات" — جدول مستقل عن "مصادر التعلم"
--      (بيانات منفصلة تمامًا). المدير يقدر يحدد عناوين الأعمدة اللي
--      يحتاجها (زي: اسم الكورس، الرابط، الجهة المقدّمة، ملاحظات...)
--      مرة واحدة، وبعدين يضيف صفوف (كورسات) بسرعة — كل عضو نشط في
--      الفريق (مدير أو عضو عادي) يشوف الجدول ده بشكل قراءة فقط.
--   2) عمود "أُضيف بواسطة" (اسم اللي حط الصف) هيتشال من الظهور في
--      الواجهة لصفحة "مصادر التعلم" — التغيير ده في index.html بس،
--      البيانات نفسها (createdBy) لسه محفوظة في القاعدة زي ما هي.
--
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد باقي ملفات supabase_migration_*.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- 1) جدولي "الكورسات" — نفس فكرة resource_columns/resources من v6
--    بالظبط (أعمدة قابلة للتخصيص + صفوف بيانات jsonb)، لكن منفصلين
--    تمامًا عن مصادر التعلم
-- ------------------------------------------------------------

create table if not exists public.course_columns (
  id serial primary key,
  key text not null unique,
  label text not null,
  type text not null default 'text' check (type in ('text','link','date','note')),
  "order" integer not null default 0,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.courses (
  id serial primary key,
  data jsonb not null default '{}'::jsonb,
  "createdBy" integer references public.users(id) on delete set null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_courses_createdAt on public.courses("createdAt");

create or replace function public.set_course_updated_at()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  new."updatedAt" := now();
  return new;
end;
$$;

drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at
before update on public.courses
for each row execute function public.set_course_updated_at();

alter table public.course_columns enable row level security;
alter table public.courses enable row level security;

-- أي عضو نشط (مدير أو عضو عادي، سوبر أدمن أو مدير عادي) يشوف تعريف
-- الأعمدة والصفوف — بالضبط زي مصادر التعلم (public.is_active_user()
-- موجودة أصلًا من v6)
drop policy if exists "course_columns_select" on public.course_columns;
create policy "course_columns_select" on public.course_columns
  for select using (public.is_active_user());

drop policy if exists "course_columns_write" on public.course_columns;
create policy "course_columns_write" on public.course_columns
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "courses_select" on public.courses;
create policy "courses_select" on public.courses
  for select using (public.is_active_user());

drop policy if exists "courses_write" on public.courses;
create policy "courses_write" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.course_columns, public.courses to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ============================================================
-- انتهى. ملاحظات:
--
-- 1) هذا الجدول منفصل تمامًا عن resource_columns/resources (مصادر
--    التعلم) — تعديل أو حذف أي عمود/صف هنا مايأثرش على الصفحة التانية
--    خالص، والعكس صحيح.
--
-- 2) الكتابة (إضافة/تعديل/حذف أعمدة أو كورسات) مقصورة على أي حساب
--    role='admin' نشط (مدير عادي أو سوبر أدمن) — زي مصادر التعلم
--    بالظبط. لو عايز الإضافة تكون مقصورة على السوبر أدمن بس، قولّي
--    وأظبطها.
--
-- 3) لازم تشغّل تحديث index.html المرفق كمان — هو اللي بيضيف صفحة
--    "الكورسات" في القائمة الجانبية، وبيشيل عمود "أُضيف بواسطة" من
--    ظهور صفحة "مصادر التعلم".
-- ============================================================
