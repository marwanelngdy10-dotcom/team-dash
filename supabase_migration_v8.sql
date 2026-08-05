-- ============================================================
-- IT-qan — تحديث v8:
--   1) فصل صلاحيات "السوبر أدمن" عن "المدير العادي":
--      - السوبر أدمن بس يقدر يضيف/يرقّي حساب لـ "مدير" أو "سوبر أدمن".
--      - المدير العادي يقدر يضيف/يدير "أعضاء" (role='member') بس —
--        مايقدرش يرقّي حد لمدير أو سوبر، ولا يعطّل/يحذف مدير تاني.
--      - تغيير كلمة مرور أي عضو بقى مقصور على السوبر أدمن بس
--        (تفعيل السطر مربوط بتحديث admin-reset-password_index.ts كمان،
--        شوف الملف المرفق).
--   2) كل عضو يقدر يعدّل أو يحذف تقاريره (تسجيلاته) هو بس، من غير ما
--      يقدر يلمس عمود "postponeApproved" (ده لسه بيد المدير حصريًا).
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد باقي ملفات supabase_migration_*.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- 0) دالة مساعدة: هل المستخدم الحالي سوبر أدمن؟
-- ------------------------------------------------------------

create or replace function public.is_super_admin()
returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from public.users
    where "authId" = auth.uid() and "isSuperAdmin" = true and status = 'active'
  );
$$;

grant execute on function public.is_super_admin() to authenticated;

-- ------------------------------------------------------------
-- 1) guard_users_update: تحديث الحراسة —
--    - تعديل علامة "isSuperAdmin" نفسها بقى مسموح، لكن للسوبر أدمن بس
--      (بدل ما كان ممنوع تمامًا من الواجهة إلا عبر SQL Editor)
--    - ترقية أي حساب لـ role='admin' بقت مقصورة على السوبر أدمن بس
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

  -- ترقية عضو لـ "مدير" (أو الإبقاء على مدير موجود) لا يقدر يعملها إلا سوبر أدمن
  if new.role = 'admin' and old.role is distinct from new.role and not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يمنح صلاحية مدير';
  end if;

  -- تعديل علامة السوبر أدمن نفسها: للسوبر أدمن بس
  if new."isSuperAdmin" is distinct from old."isSuperAdmin" and not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يمنح/يسحب صلاحية سوبر أدمن';
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

  -- المدير العادي (مش سوبر) مايقدرش يعطّل مدير تاني — بس السوبر أدمن أو العضو نفسه (تفعيل/تعطيل نفسه ممنوع أصلًا فوق)
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
-- 2) guard_users_delete: حذف حساب "مدير" بقى مقصور على السوبر أدمن —
--    المدير العادي يقدر يحذف أعضاء (role='member') بس
-- ------------------------------------------------------------

create or replace function public.guard_users_delete()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  admin_count integer;
begin
  if old."authId" = auth.uid() then
    raise exception 'لا يمكنك حذف حسابك الخاص';
  end if;
  if old."isSuperAdmin" then
    raise exception 'لا يمكن حذف حساب السوبر أدمن';
  end if;
  if old.role = 'admin' and not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يحذف حساب مدير';
  end if;
  if old.role = 'admin' then
    select count(*) into admin_count from public.users where role = 'admin';
    if admin_count <= 1 then
      raise exception 'لا يمكن حذف آخر مدير';
    end if;
  end if;
  return old;
end;
$$;

-- ------------------------------------------------------------
-- 3) الأعضاء: صلاحية تعديل/حذف تقاريرهم (تسجيلاتهم) هم بس
--    - المدير لسه يقدر يعدّل أي تقرير (زي الموافقة على العذر)
--    - العضو (صاحب التقرير) يقدر يعدّل بياناته (الحالة/الوصف/المهمة/تاريخ
--      التأجيل)، لكن مايقدرش يلمس postponeApproved ولا يغيّر صاحب التقرير
-- ------------------------------------------------------------

create or replace function public.guard_reports_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    if new."userId" <> old."userId" then
      raise exception 'لا يمكنك نقل التقرير لعضو آخر';
    end if;
    if new."postponeApproved" is distinct from old."postponeApproved" then
      raise exception 'فقط المدير يقدر يوافق أو يرفض عذر التأجيل';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_reports_update on public.reports;
create trigger trg_guard_reports_update
before update on public.reports
for each row execute function public.guard_reports_update();

drop policy if exists "reports_update" on public.reports;
create policy "reports_update" on public.reports
  for update using (public.is_admin() or "userId" = public.current_app_user_id())
  with check (public.is_admin() or "userId" = public.current_app_user_id());

drop policy if exists "reports_delete" on public.reports;
create policy "reports_delete" on public.reports
  for delete using (public.is_admin() or "userId" = public.current_app_user_id());

-- إعادة حساب أيام التقصير تلقائيًا بعد أي تعديل على تقرير (زي ما بيحصل بعد الإضافة)،
-- لأن تعديل الحالة/التاريخ/التأجيل ممكن يأثر على الحساب
create or replace function public.trg_reports_after_update_fn()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.recalc_negligence(new."userId");
  return new;
end;
$$;

drop trigger if exists trg_reports_after_update on public.reports;
create trigger trg_reports_after_update
after update on public.reports
for each row execute function public.trg_reports_after_update_fn();

-- وكمان بعد حذف تقرير (لو عضو حذف تقرير كان بيغطي يوم معيّن، لازم يوم التقصير يتحسب من جديد)
create or replace function public.trg_reports_after_delete_fn()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.recalc_negligence(old."userId");
  return old;
end;
$$;

drop trigger if exists trg_reports_after_delete on public.reports;
create trigger trg_reports_after_delete
after delete on public.reports
for each row execute function public.trg_reports_after_delete_fn();

-- ============================================================
-- انتهى. ملاحظات:
-- 1) لازم تشغّل تحديث الـ Edge Function admin-reset-password (النسخة
--    المرفقة) وتعيد نشرها (supabase functions deploy admin-reset-password)
--    عشان تغيير كلمة المرور يبقى مقصور فعليًا على السوبر أدمن — تحديث
--    قاعدة البيانات وحده مايتحكمش في الـ Edge Function.
-- 2) إضافة/ترقية حساب لـ "سوبر أدمن" من واجهة "الأعضاء" بقت متاحة للسوبر
--    أدمن نفسه (مش محتاج SQL Editor بعد النهارده)، وبرضو ممكن يدوي زي
--    الأول لو حبيت:
--       update public.users set "isSuperAdmin" = true where email = '...';
-- ============================================================
