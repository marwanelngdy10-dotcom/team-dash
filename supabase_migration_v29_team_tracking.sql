-- ============================================================
-- IT-qan — تحديث v29: نظام متابعة الفريق + تطوير الفريق
--
--   المطلوب:
--   1) نقاط تحفيزية (Points) — تُمنح تلقائيًا:
--      - تسجيل تقرير على الوقت: +3 نقاط
--      - تسجيل تقرير في نافذة التأخير: +1 نقطة (أقل، لكن لسه بتحفّز)
--      - إكمال مادة تعلم ("تم التعلم"): +5 نقاط (وتُخصم لو رجع العضو
--        فتح المادة تاني بعد ما كانت مكتملة)
--      النقاط دي أساس لوحة الصدارة في صفحة "متابعة الفريق" الجديدة
--      بالواجهة، ومحمية بحيث محدش يقدر يعدّلها مباشرة من غير مسارات
--      السيرفر (التريجرز) — أي محاولة تعديل مباشر من العميل تُرفض.
--
--   2) ملاحظة المدير على تقرير عضو (managerNote) — حقل نصي يقدر
--      المدير/السوبر أدمن يكتبه على أي تقرير، والعضو صاحب التقرير
--      يشوفه في تقاريره + يوصله إشعار فوري لما المدير يضيف/يعدّل الملاحظة.
--
--   3) "مسار" اختياري (trackTitle) لمواد التعلم — نص حر يكتبه المدير
--      عند إضافة مادة تعلم (مثال: "مسار SEO") عشان يجمع مواد متتابعة
--      تحت نفس الاسم، وتظهر كشارة على كل مادة في الواجهة.
--
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد supabase_migration_v28_seed_courses.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- 1) الأعمدة الجديدة
-- ------------------------------------------------------------

alter table public.users add column if not exists "points" integer not null default 0;
alter table public.reports add column if not exists "managerNote" text;
alter table public.learning_items add column if not exists "trackTitle" text;
alter table public.learning_items add column if not exists "order" integer not null default 0;

-- ------------------------------------------------------------
-- 2) حماية عمود points: أي تعديل مباشر عليه من العميل (حتى لو مدير أو
--    سوبر أدمن) مرفوض — النقاط تتغيّر بس من جوه تريجرز داخلية (تسجيل
--    تقرير / إكمال مادة تعلم). pg_trigger_depth() = 0 معناها إن التحديث
--    جاي مباشرة من الواجهة (مش من تريجر تاني شغّاله)، فده اللي بيتمنع.
--    (guard_users_update: نفس آخر نسخة من v26 + الشرط الجديد بس)
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

  -- جديد في v29: النقاط تتغيّر بس من جوه تريجرز داخلية (تسجيل تقرير/تعلم)
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
-- 3) نقاط تسجيل التقرير — تُمنح فور إضافة تقرير جديد، حسب كونه على
--    الوقت أو في نافذة التأخير (نفس منطق set_report_date_for_grace_window
--    الموجود أصلًا: date = يوم الاستحقاق، createdAt = وقت الحفظ الفعلي)
-- ------------------------------------------------------------

create or replace function public.award_points_on_report()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new."createdAt"::date > new.date then
    -- اتسجل في نافذة المهلة (تأخير) — نقطة واحدة بس
    update public.users set points = points + 1 where id = new."userId";
  else
    -- على الوقت تمامًا — 3 نقاط
    update public.users set points = points + 3 where id = new."userId";
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reports_award_points on public.reports;
create trigger trg_reports_award_points
after insert on public.reports
for each row execute function public.award_points_on_report();

-- ------------------------------------------------------------
-- 4) نقاط إكمال مادة تعلم — 5 نقاط عند "تم التعلم"، وتُخصم لو رجع
--    العضو غيّر حالتها من "تم التعلم" لأي حالة تانية (فتح المادة تاني)
-- ------------------------------------------------------------

create or replace function public.award_points_on_learning_complete()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'تم التعلم' and old.status is distinct from new.status then
    update public.users set points = points + 5 where id = new."assignedTo";
  elsif new.status <> 'تم التعلم' and old.status = 'تم التعلم' then
    update public.users set points = greatest(0, points - 5) where id = new."assignedTo";
  end if;
  return new;
end;
$$;

drop trigger if exists trg_learning_award_points on public.learning_items;
create trigger trg_learning_award_points
after update of status on public.learning_items
for each row execute function public.award_points_on_learning_complete();

-- ------------------------------------------------------------
-- 5) ملاحظة المدير على تقرير: حماية العمود (المدير/السوبر أدمن بس) —
--    تحديث guard_reports_update (آخر نسخة من v9) + الشرط الجديد
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
    if new.date is distinct from old.date then
      raise exception 'لا يمكن تعديل تاريخ التقرير';
    end if;
    if new."managerNote" is distinct from old."managerNote" then
      raise exception 'فقط المدير يقدر يضيف ملاحظة على التقرير';
    end if;
  end if;
  return new;
end;
$$;

-- إشعار فوري للعضو صاحب التقرير لما المدير يضيف/يعدّل ملاحظة عليه
create or replace function public.notify_manager_note()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new."managerNote" is distinct from old."managerNote" and new."managerNote" is not null then
    perform public.notify_user(
      new."userId", 'manager_note', 'المدير أضاف ملاحظة على تقريرك',
      left(new."managerNote", 80), new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reports_notify_manager_note on public.reports;
create trigger trg_reports_notify_manager_note
after update of "managerNote" on public.reports
for each row execute function public.notify_manager_note();

-- ============================================================
-- انتهى. ملاحظات:
--
-- 1) النقاط بتتحدث تلقائيًا فورًا مع كل تقرير جديد أو إكمال مادة تعلم —
--    لوحة "متابعة الفريق" ولوحة الصدارة في index.html بيقرأوا نفس عمود
--    points من جدول users (اللي أصلًا كل الأعضاء النشطين يشوفوه بعض
--    من صلاحية users_select من v5).
--
-- 2) لو عايز نقاط رجعية للتقارير/مواد التعلم القديمة (قبل هذا الملف)،
--    قولّي وأجهزّلك سكريبت "backfill" منفصل بيحسبها مرة واحدة بأثر
--    رجعي — الملف ده بيمنح نقاط للأحداث الجديدة بس من دلوقتي.
--
-- 3) "المسار" (trackTitle) نص حر بس دلوقتي (مش جدول منفصل) — لو حبيت
--    ترقية لمسارات منظمة بترتيب وتقدّم % لكل مسار، ده تحديث تاني منفصل
--    (v30) بيحتاج جدول جديد وتعديل أكبر في صفحة "التعليم".
--
-- 4) لازم تنشر تحديث index.html المرفق كمان (فيه صفحة "متابعة الفريق"
--    الجديدة، لوحة الصدارة، ملاحظة المدير على التقارير، وحقل "المسار"
--    عند إضافة مادة تعلم) — من غيره الأعمدة دي هتتحدث في القاعدة لكن
--    مش هتظهر في الواجهة.
-- ============================================================
