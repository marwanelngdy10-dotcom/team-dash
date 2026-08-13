-- ============================================================
-- IT-qan — تحديث v30: تحديد "قسم" لكل عضو + فلترة صفحة الكورسات
--   تلقائيًا حسب قسم العضو (كل عضو يشوف كورسات قسمه بس + أي كورس عام
--   من غير قسم محدد)
--
--   الفكرة:
--   - نفس أقسام الكورسات الموجودة أصلًا (جدول course_categories من
--     v26: E-Marketing / UI/UX / Montage / Programming / graphic /
--     English...) بتُستخدم كمان كـ"قسم" لكل عضو — مفيش جدول جديد.
--   - كل عضو قسم واحد بس (departmentId)، قابل للتغيير في أي وقت من
--     أي مدير نشط (مسؤول عادي أو سوبر أدمن) من صفحة "الأعضاء" —
--     زي باقي إدارة بيانات الأعضاء بالظبط (مش مقصور على السوبر أدمن).
--   - العضو نفسه ميقدرش يغيّر قسمه — للمدير بس.
--   - تأثير القسم: صفحة "الكورسات" — العضو (مش مدير) يشوف بس:
--       (أ) كورسات قسمه المحدد له، و
--       (ب) أي كورس "عام" من غير قسم محدد (categoryId = null).
--     المدير (مسؤول عادي أو سوبر أدمن) يشوف كل الكورسات زي ما هو
--     دايمًا، بغض النظر عن قسمه هو شخصيًا.
--   - الفلترة دي مطبَّقة فعليًا على مستوى قاعدة البيانات (RLS)، مش
--     مجرد إخفاء في الواجهة — يعني حتى لو حد حاول يجيب بيانات الكورسات
--     مباشرة من غير الواجهة، هيرجعله بس الكورسات المسموح له يشوفها.
--
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد supabase_migration_v29_team_tracking.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- 1) عمود القسم لكل عضو — قسم واحد بس، رابط لجدول course_categories
--    الموجود أصلًا (nullable: العضو ممكن يفضل من غير قسم لحد ما
--    المدير يحدده)
-- ------------------------------------------------------------

alter table public.users
  add column if not exists "departmentId" integer references public.course_categories(id) on delete set null;

create index if not exists idx_users_departmentId on public.users("departmentId");

-- ------------------------------------------------------------
-- 2) حماية العمود: التعديل عليه مقصور على أي مدير نشط (is_admin —
--    مسؤول عادي أو سوبر أدمن)، مش العضو نفسه. آخر نسخة من
--    guard_users_update كانت من v29 (فيها حماية عمود points) —
--    الإضافة هنا بس شرط departmentId، وباقي الدالة زي ما هي بالظبط.
-- ------------------------------------------------------------

create or replace function public.guard_users_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  admin_count integer;
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and not public.is_admin() then
    raise exception 'غير مسموح بتغيير الصلاحية أو الحالة';
  end if;

  if new.role = 'admin' and old.role is distinct from new.role and not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يمنح صلاحية مدير';
  end if;

  if new."isSuperAdmin" is distinct from old."isSuperAdmin" and not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يمنح/يسحب صلاحية سوبر أدمن';
  end if;

  if new."negligenceExempt" is distinct from old."negligenceExempt" and not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يستثني حسابًا من احتساب التقصير';
  end if;

  if new."negligenceManualAdjustment" is distinct from old."negligenceManualAdjustment" and not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يعدّل أيام التقصير يدويًا';
  end if;

  -- جديد في v30: تحديد/تغيير قسم العضو مقصور على أي مدير نشط —
  -- العضو نفسه ميقدرش يغيّر قسمه، وباقي حماية users_update RLS
  -- (مدير عادي يدير أعضاء الفريق role='member' بس، السوبر أدمن يدير الكل)
  -- بتحدد كمان مين المدير المسموح له يلمس صف العضو ده أصلًا.
  if new."departmentId" is distinct from old."departmentId" and not public.is_admin() then
    raise exception 'فقط المدير يقدر يحدد قسم العضو';
  end if;

  if new."points" is distinct from old."points" and pg_trigger_depth() = 0 then
    raise exception 'النقاط تُحتسب تلقائيًا ولا يمكن تعديلها مباشرة';
  end if;

  if old."authId" = auth.uid() and new.status = 'disabled' then
    raise exception 'لا يمكنك تعطيل حسابك الخاص';
  end if;

  if old."isSuperAdmin" and new.role <> 'admin' then
    raise exception 'لا يمكن إزالة صلاحية مدير السوبر أدمن';
  end if;

  if old."isSuperAdmin" and new.status <> 'active' then
    raise exception 'لا يمكن تعطيل حساب السوبر أدمن';
  end if;

  if old.role = 'admin' and new.status is distinct from old.status and not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يعطّل/يفعّل حساب مدير';
  end if;

  if old.role = 'admin' and old.status = 'active' and new.status <> 'active' then
    select count(*) into admin_count from public.users where role = 'admin' and status = 'active';
    if admin_count <= 1 then
      raise exception 'لا يمكن تعطيل آخر مدير نشط';
    end if;
  end if;

  if old.role = 'admin' and new.role <> 'admin' then
    select count(*) into admin_count from public.users where role = 'admin';
    if admin_count <= 1 then
      raise exception 'لا يمكن إزالة صلاحية آخر مدير';
    end if;
  end if;

  return new;
end;
$$;

-- ------------------------------------------------------------
-- 3) فلترة صفحة الكورسات حسب قسم العضو — تعديل courses_select
--    (آخر نسخة كانت من v26: is_active_user() بس، أي عضو نشط يشوف كل
--    الكورسات). دلوقتي:
--    - أي مدير نشط (is_admin) يشوف كل الكورسات زي ما هو دايمًا.
--    - كورس "عام" (categoryId = null) يشوفه أي عضو نشط، بغض النظر عن قسمه.
--    - كورس له قسم محدد: يشوفه بس العضو اللي قسمه (departmentId)
--      نفس قسم الكورس ده.
-- ------------------------------------------------------------

drop policy if exists "courses_select" on public.courses;
create policy "courses_select" on public.courses
  for select using (
    public.is_admin()
    or (
      courses."categoryId" is null
      and public.is_active_user()
    )
    or exists (
      select 1 from public.users u
      where u."authId" = auth.uid()
        and u.status = 'active'
        and u."departmentId" is not null
        and u."departmentId" = courses."categoryId"
    )
  );

-- ملحوظة: course_categories_select و courses_write زي ما هم من v26 —
-- كل عضو نشط لسه يقدر يشوف *أسماء* الأقسام كلها (مطلوب عشان صفحة
-- "الأعضاء" تقدر تعرض قائمة الأقسام عند تحديد قسم عضو)، والكتابة على
-- الكورسات لسه مقصورة على أي مدير نشط.

-- ============================================================
-- انتهى. ملاحظات:
--
-- 1) الأعضاء الحاليين هيفضلوا من غير قسم محدد (departmentId = null)
--    لحد ما مدير يحددهم من صفحة "الأعضاء" — في الوقت ده هيشوفوا بس
--    الكورسات "العامة" (اللي من غير قسم)، زي أي عضو تاني من غير قسم.
--
-- 2) تغيير قسم عضو مايأثرش على أي حاجة تانية غير عرض صفحة "الكورسات"
--    له — مفيش أي علاقة بينه وبين نظام التقصير/النقاط/المهام.
--
-- 3) لازم تشغّل تحديث index.html المرفق كمان — هو اللي بيضيف:
--    - عمود "القسم" في صفحة "الأعضاء" (قائمة اختيار تظهر لأي مدير،
--      ونص عادي للعضو العادي).
--    - رسالة في صفحة "الكورسات" توضّح للعضو قسمه الحالي (أو تنبّهه
--      إنه لسه من غير قسم محدد).
-- ============================================================
