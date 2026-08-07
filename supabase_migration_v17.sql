-- ============================================================
-- IT-qan — تحديث v17: "يوزر نيم" + رقم هاتف + تسجيل دخول بالـ Username
--
--   المطلوب:
--   1) عمود "username" جديد — يوزر نيم بسيط من غير @ ولا .com (زي
--      "marwan")، فريد (Unique) بغض النظر عن حالة الأحرف الكبيرة/الصغيرة.
--   2) عمود "phone" جديد — رقم تليفون بأي عدد حروف/أرقام، من غير أي
--      قيد على الطول أو التنسيق (نص عادي).
--   3) تسجيل الدخول يقدر يتم بـ username بدل الإيميل (عن طريق دالة
--      get_email_by_username اللي بترجع الإيميل المرتبط باليوزر نيم،
--      والواجهة بتستخدمه بعدين مع signInWithPassword العادي).
--   4) أي حساب بينشئه المدير (من صفحة "الأعضاء") هيتعمله إيميل + اسم +
--      كلمة سر مبدئية + دور بس (زي ما هو تمامًا) — من غير يوزر نيم ولا
--      رقم تليفون. أول ما صاحب الحساب ده يسجّل دخول لأول مرة، الواجهة
--      (index.html المرفق) هتجبره يدخل يوزر نيم ورقم تليفون قبل ما
--      يقدر يشوف أي حاجة تانية في النظام.
--   5) لو حد سجّل حساب بنفسه من شاشة "حساب جديد" (طلب انضمام)، هيدخل
--      يوزر نيم ورقم تليفون مع بيانات التسجيل من الأول — فمش هيتطلب
--      منه أي حاجة إضافية لما المدير يوافق عليه.
--
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد supabase_migration_v16.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- 1) الأعمدة الجديدة
--    - username: بدون قيمة افتراضية، nullable (عشان الحسابات اللي
--      بينشئها المدير تفضل من غيره لحد ما صاحبها يكمّل بياناته بنفسه)
--    - phone: نص عادي بدون أي قيد على الطول أو التنسيق
-- ------------------------------------------------------------

alter table public.users add column if not exists "username" text;
alter table public.users add column if not exists "phone" text;

-- شكل اليوزر نيم: حروف إنجليزية/أرقام/نقطة/شرطة سفلية بس، من 3 لـ30 حرف
-- (وده أصلًا بيمنع وجود @ فيه، فمش هيتلخبط مع الإيميل خالص)
alter table public.users drop constraint if exists chk_username_format;
alter table public.users add constraint chk_username_format
  check (username is null or username ~ '^[A-Za-z0-9_.]{3,30}$');

-- التفرّد بغض النظر عن حالة الأحرف (Marwan و marwan نفس اليوزر نيم)
drop index if exists idx_users_username_lower;
create unique index idx_users_username_lower on public.users (lower(username)) where username is not null;

-- ------------------------------------------------------------
-- 2) تحديث trigger إنشاء صف users تلقائيًا عند تسجيل حساب Auth جديد —
--    يقرأ username و phone من بيانات التسجيل (raw_user_meta_data) لو
--    اتبعتوا (التسجيل الذاتي هيبعتهم، إنشاء المدير للحساب مش هيبعتهم
--    فهيفضلوا فاضيين لحد ما صاحب الحساب يكمّلهم بنفسه)
-- ------------------------------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_username text := nullif(trim(lower(new.raw_user_meta_data->>'username')), '');
  v_phone text := nullif(trim(new.raw_user_meta_data->>'phone'), '');
begin
  insert into public.users (name, email, role, status, "authId", "username", "phone")
  values (
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'member',
    'pending',
    new.id,
    v_username,
    v_phone
  );
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 3) دالة تسجيل الدخول بالـ Username: بترجع الإيميل المرتبط بيوزر نيم
--    معيّن بس (مفيش أي بيانات تانية) — عشان الواجهة تقدر تستخدمه بعدين
--    مع sb.auth.signInWithPassword({ email, password }) العادي.
--    متاحة حتى قبل تسجيل الدخول (anon) لأنها جزء أساسي من عملية الدخول
--    نفسها، وبترجع الإيميل بس من غير أي تفاصيل تانية عن صاحب الحساب.
-- ------------------------------------------------------------

create or replace function public.get_email_by_username(p_username text)
returns text
language sql security definer set search_path = public
as $$
  select email from public.users
  where lower(username) = lower(trim(p_username))
  limit 1;
$$;

grant execute on function public.get_email_by_username(text) to anon, authenticated;

-- ============================================================
-- انتهى. ملاحظات:
--
-- 1) الحسابات الموجودة من قبل تشغيل هذا الملف هتفضل بـ username = null
--    و phone = null. الأعضاء الحاليين هيتطلب منهم إكمال البيانات دي في
--    أول تسجيل دخول ليهم بعد نشر index.html المحدّث، بالظبط زي أي حساب
--    جديد بينشئه المدير.
--
-- 2) اليوزر نيم متاح إعادة تعديله من صاحب الحساب نفسه بعد أول مرة (عبر
--    users_update RLS الموجودة أصلًا — العضو يقدر يعدّل صف نفسه) —
--    لو عايز تمنع تغييره بعد أول تعيين، قولّي وهضيف حماية إضافية في
--    guard_users_update بترفض أي تعديل على username لو كانت قيمته
--    الأصلية مش null.
--
-- 3) get_email_by_username بترجع null لو اليوزر نيم مش موجود — الواجهة
--    بتتعامل مع الحالة دي بعرض "بيانات الدخول غير صحيحة" زي أي محاولة
--    دخول فاشلة تانية، من غير ما تكشف هل اليوزر نيم ده موجود أصلًا ولا لأ.
-- ============================================================
