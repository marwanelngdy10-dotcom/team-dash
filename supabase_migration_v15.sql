-- ============================================================
-- IT-qan — تحديث v15: تعديل مين المستثنى من احتساب التقصير
--
--   قبل كده (v3 وما بعدها): أي حساب role='admin' (مدير عادي أو سوبر
--   أدمن) كان مستثنى بالكامل من احتساب/عدّ أيام التقصير والتسجيل.
--
--   دلوقتي:
--   1) السوبر أدمن (isSuperAdmin = true) بس هو المستثنى تلقائيًا.
--   2) المدير العادي (admin بدون isSuperAdmin) بقى خاضع لنفس نظام
--      التسجيل اليومي واحتساب التقصير والإنذارات والإيقاف التلقائي
--      زي أي عضو بالظبط.
--   3) السوبر أدمن يقدر يستثني أي حساب معيّن (مدير أو عضو) يدويًا عن
--      طريق عمود جديد "negligenceExempt" — التعديل عليه مقصور على
--      السوبر أدمن فقط (مش حتى المدير العادي نفسه، ولا مدير تاني).
--
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد supabase_migration_v14.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- 1) عمود الاستثناء اليدوي من احتساب التقصير
-- ------------------------------------------------------------

alter table public.users add column if not exists "negligenceExempt" boolean not null default false;

-- ------------------------------------------------------------
-- 2) guard_users_update: إضافة حماية عمود negligenceExempt —
--    لا يقدر يعدّله إلا السوبر أدمن (باقي القيود زي ما هي من v8)
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

  -- تعديل الاستثناء اليدوي من التقصير: للسوبر أدمن بس (جديد في v15)
  if new."negligenceExempt" is distinct from old."negligenceExempt" and not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يستثني حسابًا من احتساب التقصير';
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
-- 3) recalc_negligence: السوبر أدمن (أو أي حساب معلّم negligenceExempt)
--    بس هو المستثنى — المدير العادي بقى خاضع للحساب زي أي عضو
-- ------------------------------------------------------------

create or replace function public.recalc_negligence(p_user_id integer)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_created date;
  v_status text;
  v_is_super boolean;
  v_exempt boolean;
  v_postpone date;
  v_reactivated date;
  v_start date;
  v_last_final date;
  v_missed integer := 0;
  v_late integer := 0;
  v_negligent integer := 0;
  v_day date;
  v_report record;
  v_final_cutoff time := time '16:00';  -- موعد القفل النهائي لليوم (زي v10/v11)
  v_late_start time := time '13:00';    -- بداية نافذة "التأخير" (زي v11)
  v_month_start timestamptz := date_trunc('month', current_date);
begin
  select "createdAt", status, "isSuperAdmin", "negligenceExempt", "reactivatedAt"::date
    into v_created, v_status, v_is_super, v_exempt, v_reactivated
    from public.users where id = p_user_id;

  -- السوبر أدمن مستثنى دايمًا، وأي حساب تاني (مدير أو عضو) مستثنى لو
  -- السوبر أدمن حدد له negligenceExempt = true يدويًا
  if v_is_super or v_exempt then
    return 0;
  end if;

  if v_created is null or v_status <> 'active' then
    return 0;
  end if;

  select max("postponeUntil") into v_postpone
    from public.reports where "userId" = p_user_id and "postponeApproved" = true;

  v_start := greatest(date_trunc('month', current_date)::date, v_created);
  if v_reactivated is not null and v_reactivated > v_start then
    v_start := v_reactivated;
  end if;

  -- آخر يوم "اتقفل" فعليًا (فات موعده النهائي: الساعة 4 عصرًا اليوم التالي له)
  if current_time >= v_final_cutoff then
    v_last_final := current_date - 1;
  else
    v_last_final := current_date - 2;
  end if;

  v_day := v_start;
  while v_day <= v_last_final loop
    if v_postpone is null or v_day > v_postpone then
      select * into v_report from public.reports
        where "userId" = p_user_id and date = v_day
        order by "createdAt" asc limit 1;

      if not found then
        v_missed := v_missed + 1;
      elsif v_report."createdAt"::date > v_day then
        if v_report."createdAt"::time >= v_late_start then
          v_late := v_late + 1;
        end if;
      end if;
    end if;
    v_day := v_day + 1;
  end loop;

  v_negligent := v_missed + (v_late / 2);

  if v_negligent >= 4 and not exists (
    select 1 from public.notifications
    where "userId" = p_user_id and type = 'negligence_warning_4' and "createdAt" >= v_month_start
  ) then
    perform public.notify_user(
      p_user_id, 'negligence_warning_4', 'إنذار: 4 أيام تقصير هذا الشهر',
      'وصلت إلى 4 أيام تقصير في تسجيل تقاريرك هذا الشهر. الوصول إلى 6 أيام يؤدي لإيقاف عضويتك تلقائيًا — برجاء الانتباه.'
    );
  end if;

  if v_negligent >= 5 and not exists (
    select 1 from public.notifications
    where "userId" = p_user_id and type = 'negligence_warning_5' and "createdAt" >= v_month_start
  ) then
    perform public.notify_user(
      p_user_id, 'negligence_warning_5', 'إنذار أخير: 5 أيام تقصير هذا الشهر',
      'وصلت إلى 5 أيام تقصير هذا الشهر. يوم تقصير واحد إضافي (6 أيام) سيؤدي لإيقاف عضويتك تلقائيًا من الفريق.'
    );
  end if;

  if v_negligent >= 6 then
    if v_status = 'active' and not exists (
      select 1 from public.notifications
      where "userId" = p_user_id and type = 'negligence_removed' and "createdAt" >= v_month_start
    ) then
      perform public.notify_user(
        p_user_id, 'negligence_removed', 'تم إيقاف عضويتك في الفريق',
        'تم إيقاف عضويتك تلقائيًا بسبب الوصول إلى 6 أيام تقصير في تسجيل التقارير هذا الشهر. تواصل مع السوبر أدمن لمزيد من التفاصيل.'
      );
    end if;
    -- محاطة بـ begin/exception عشان لو المستخدم اللي شغّل الحساب (مثلاً مدير
    -- عادي فتح صفحة التقارير) مالوش صلاحية يعطّل الحساب ده (زي مدير تاني —
    -- ده مقصور على السوبر أدمن حسب guard_users_update)، العملية تتجاهل
    -- الإيقاف بهدوء بدل ما توقف إعادة الحساب لباقي الأعضاء في نفس الدفعة
    begin
      update public.users set status = 'disabled', "suspendedAuto" = true
        where id = p_user_id and status = 'active';
    exception when others then
      null;
    end;
  end if;

  return v_negligent;
end;
$$;

-- ------------------------------------------------------------
-- 4) recalc_negligence_all: يشمل كل الحسابات النشطة ما عدا السوبر أدمن
--    (المدراء العاديين بقوا داخلين في الحساب زي الأعضاء تمامًا؛
--    recalc_negligence نفسها بترجع 0 فورًا لأي حساب negligenceExempt)
-- ------------------------------------------------------------

create or replace function public.recalc_negligence_all()
returns void
language plpgsql security definer set search_path = public
as $$
declare v_user record;
begin
  if not public.is_admin() then
    raise exception 'غير مصرح لك بتنفيذ هذه العملية';
  end if;
  for v_user in
    select id from public.users
    where status = 'active' and "isSuperAdmin" = false
  loop
    perform public.recalc_negligence(v_user.id);
  end loop;
end;
$$;

-- ============================================================
-- انتهى. ملاحظات:
--
-- 1) بعد تشغيل هذا الملف، أي مدير عادي (role='admin' بدون isSuperAdmin)
--    هيبقى محتاج يسجّل تقرير يومي زي أي عضو بالظبط، وهيدخل في نفس حساب
--    أيام التقصير والإنذارات (4/5/6 أيام) والإيقاف التلقائي — إلا لو
--    السوبر أدمن استثناه يدويًا (negligenceExempt = true).
--
-- 2) السوبر أدمن يقدر يستثني (أو يلغي استثناء) أي حساب في أي وقت من
--    واجهة "الأعضاء"، أو يدويًا من هنا:
--       update public.users set "negligenceExempt" = true  where email = '...';
--       update public.users set "negligenceExempt" = false where email = '...';
--
-- 3) صلاحية insert على جدول reports كانت أصلًا مفتوحة لأي مستخدم يسجّل
--    باسمه هو ("userId" = current_app_user_id())، فمدير عادي كان يقدر
--    يسجّل تقرير أصلًا من ناحية قاعدة البيانات — التغيير هنا في الحساب
--    والاستثناء بس، مش في صلاحية التسجيل نفسها.
--
-- 4) لازم تشغّل تحديث index.html المرفق كمان، لأنه اللي بيظهر للمدير
--    العادي نموذج "تقرير جديد" الخاص بيه (كان مخفي عنه قبل كده لأنه
--    كان بيشوف واجهة المراجعة الإدارية بس)، وبيضيف زرار "استثناء من
--    التقصير" في صفحة الأعضاء (يظهر للسوبر أدمن بس).
-- ============================================================
