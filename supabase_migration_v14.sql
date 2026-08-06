-- ============================================================
-- IT-qan — تحديث v14: نظام صلاحيات ثلاثي (سوبر أدمن / مدير / عضو)
--   مطبَّق فعليًا على مستوى قاعدة البيانات (RLS) مش مجرد إخفاء في الواجهة
--
--   الفكرة:
--   - عمود role ('admin' | 'member') وعلامة isSuperAdmin موجودين أصلًا
--     (من supabase_schema.sql وv7/v8) — الملف ده بيستخدمهم عشان يفصل
--     صلاحيات "المدير العادي" (admin بدون isSuperAdmin) عن "السوبر أدمن"
--     (admin مع isSuperAdmin) في البيانات اللي كل واحد فيهم يقدر يشوفها.
--
--   - السوبر أدمن: يشوف بيانات كل الأعضاء بلا استثناء (تقارير/مهام/
--     مواد تعلم/لوحة التقصير) — زي ما هو الحال أصلًا.
--
--   - المدير العادي (مدير مسؤول، مش سوبر): يشوف وبيدير بيانات "أعضاء
--     الفريق" (role = 'member') بس — مش قادر يشوف تقارير/مهام/مواد
--     تعلم خاصة بمدير تاني ولا بالسوبر أدمن. وكمان لما يسند مهمة أو
--     مادة تعلم، لازم تكون لعضو (member) بس، مش لمدير تاني.
--     (باقي حمايات "المدير مايقدرش يلمس مدير تاني" — زي منع تغيير
--     صلاحيته أو تعطيله أو حذفه — موجودة أصلًا من v7/v8/v13).
--
--   - العضو: يشوف بياناته هو بس (زي ما هو الحال أصلًا).
--
--   - نظام التقصير: لسه مستثنى منه أي حساب role = 'admin' بالكامل —
--     يعني لا المدير المسؤول ولا السوبر أدمن يُحتسب عليهم تقصير أو
--     تأخير (ده مطبّق أصلًا من supabase_migration_v3.sql ولم يتغيّر،
--     الملف ده بس بيوثّقه ويتأكد إنه لسه سليم).
--
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد supabase_migration_v13.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- 0) دالة مساعدة: هل المستخدم الحالي "مدير عادي" (مسؤول لكن مش سوبر أدمن)؟
-- ------------------------------------------------------------

create or replace function public.is_manager()
returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from public.users
    where "authId" = auth.uid() and role = 'admin' and "isSuperAdmin" = false and status = 'active'
  );
$$;

grant execute on function public.is_manager() to authenticated;

-- ------------------------------------------------------------
-- 1) تقارير الأعضاء (reports): السوبر أدمن يشوف الكل، المدير العادي
--    يشوف تقارير الأعضاء (role='member') بس، والعضو يشوف تقاريره هو
-- ------------------------------------------------------------

drop policy if exists "reports_select" on public.reports;
create policy "reports_select" on public.reports
  for select using (
    public.is_super_admin()
    or (
      public.is_manager()
      and exists (
        select 1 from public.users tu
        where tu.id = reports."userId" and tu.role = 'member'
      )
    )
    or "userId" = public.current_app_user_id()
  );

-- ------------------------------------------------------------
-- 2) المهام (tasks): نفس المبدأ
-- ------------------------------------------------------------

drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks
  for select using (
    public.is_super_admin()
    or (
      public.is_manager()
      and exists (
        select 1 from public.users tu
        where tu.id = tasks."assignedTo" and tu.role = 'member'
      )
    )
    or "assignedTo" = public.current_app_user_id()
  );

-- المدير العادي يقدر يسند مهمة لعضو (member) بس — مش لمدير تاني ولا للسوبر أدمن.
-- السوبر أدمن وحده اللي يقدر يسند مهمة لأي حساب (بما فيه مدير آخر لو احتاج)
create or replace function public.validate_task_assignee()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role text;
  v_status text;
begin
  select role, status into v_role, v_status from public.users where id = new."assignedTo";

  if v_role is null or v_status <> 'active' then
    raise exception 'العضو المسؤول غير موجود أو غير نشط';
  end if;

  if v_role <> 'member' and not public.is_super_admin() then
    raise exception 'المدير يقدر يسند المهام لأعضاء الفريق فقط';
  end if;

  return new;
end;
$$;

-- ------------------------------------------------------------
-- 3) مواد التعلم (learning_items): نفس المبدأ بالظبط
-- ------------------------------------------------------------

drop policy if exists "learning_select" on public.learning_items;
create policy "learning_select" on public.learning_items
  for select using (
    public.is_super_admin()
    or (
      public.is_manager()
      and exists (
        select 1 from public.users tu
        where tu.id = learning_items."assignedTo" and tu.role = 'member'
      )
    )
    or "assignedTo" = public.current_app_user_id()
  );

create or replace function public.validate_learning_assignee()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role text;
  v_status text;
begin
  select role, status into v_role, v_status from public.users where id = new."assignedTo";

  if v_role is null or v_status <> 'active' then
    raise exception 'العضو المسؤول غير موجود أو غير نشط';
  end if;

  if v_role <> 'member' and not public.is_super_admin() then
    raise exception 'المدير يقدر يحدد مواد تعلم لأعضاء الفريق فقط';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_learning_assignee on public.learning_items;
create trigger trg_validate_learning_assignee
before insert or update of "assignedTo" on public.learning_items
for each row execute function public.validate_learning_assignee();

-- ------------------------------------------------------------
-- 4) تعديل صلاحية تحديث بيانات الأعضاء (users_update): دفاع إضافي
--    عشان المدير العادي (حتى لو حاول من غير الواجهة) ميقدرش يحدّث صف
--    مدير تاني أو السوبر أدمن — بيقدر يحدّث بيانات نفسه أو أعضاء الفريق
--    (role='member') بس. باقي القيود التفصيلية (منع ترقية لمدير، منع
--    تعطيل مدير، إلخ) لسه شغالة من guard_users_update (v7/v8) فوق كده.
-- ------------------------------------------------------------

drop policy if exists "users_update" on public.users;
create policy "users_update" on public.users
  for update using (
    "authId" = auth.uid()
    or public.is_super_admin()
    or (public.is_manager() and role = 'member')
  )
  with check (
    "authId" = auth.uid()
    or public.is_super_admin()
    or (public.is_manager() and role = 'member')
  );

-- ------------------------------------------------------------
-- 5) تأكيد: نظام التقصير لسه مستثنى منه أي role='admin' بالكامل
--    (مدير عادي أو سوبر أدمن) — هذا موجود أصلًا من v3 ولم يتغيّر هنا،
--    السطر ده مجرد توثيق. لو حابب تتأكد بنفسك، افتح recalc_negligence
--    (آخر نسخة منها في v11.sql) وهتلاقي في أولها:
--      if v_role = 'admin' then return 0; end if;
-- ------------------------------------------------------------

-- ============================================================
-- انتهى. ملاحظات مهمة:
--
-- 1) هذا الملف مايغيّرش صلاحية القراءة العامة لجدول users نفسه (الأسماء/
--    الصور الشخصية/الحالة العامة) — دي لسه ظاهرة لكل الأعضاء النشطين
--    زي ما هي من v5 (لازمة عشان الشات وقايمة إسناد المهام تشتغل عادي).
--    اللي اتقيّد فعليًا هنا هو "بيانات العمل" الحساسة: التقارير، المهام،
--    مواد التعلم، وبالتبعية لوحة التقصير — دي بقت مقصورة على: السوبر
--    أدمن (الكل) / المدير العادي (أعضاء الفريق بس) / العضو (نفسه بس).
--
-- 2) لازم تشغّل هذا الملف بعد كل ملفات supabase_migration_*.sql التانية
--    (وتحديدًا بعد v13.sql اللي فعّلت حذف السوبر أدمن لحسابه هو).
--
-- 3) الواجهة (index.html) المرفقة معدّلة عشان تعكس التقسيم ده: تسمية
--    "سوبر أدمن / مدير / عضو" في كل مكان بيظهر فيه الدور، وصفحة
--    "الأعضاء" بتعرض للمدير العادي أعضاء فريقه بس (السوبر أدمن يشوف
--    الكل زي ما هو).
-- ============================================================
