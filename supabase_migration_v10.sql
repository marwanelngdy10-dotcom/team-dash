-- ============================================================
-- IT-qan — تحديث v10: تمديد "نافذة التأخير" لغاية الساعة 4 عصرًا
--   (بدل الساعة 1 ظهرًا في v9)
--
--   يعني: يوم الثلاثاء موعده النهائي كان الساعة 1 ظهرًا الأربعاء —
--   دلوقتي بقى الساعة 4 عصرًا الأربعاء. أي تسجيل يحصل من نهاية الثلاثاء
--   لغاية الساعة 4 عصرًا الأربعاء (سواء قبل الساعة 1 ظهرًا أو بعدها)
--   يُحتسب "تأخير" (نصف تقصير) مش تقصير كامل. بعد الساعة 4 عصرًا
--   الأربعاء من غير تسجيل → يوم الثلاثاء "تقصير" كامل مباشرة.
--   باقي القاعدة زي v9 بالظبط: كل تأخيرتين = يوم تقصير واحد.
--
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد supabase_migration_v9.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- 1) تريجر تحديد تاريخ التقرير: نفس منطق v9 لكن بموعد نهائي 4 عصرًا
--    بدل 1 ظهرًا
-- ------------------------------------------------------------

create or replace function public.set_report_date_for_grace_window()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_yesterday date := current_date - 1;
  v_cutoff time := time '16:00';
  v_created date;
  v_reactivated date;
  v_start date;
  v_has_yesterday boolean;
begin
  select "createdAt", "reactivatedAt"::date
    into v_created, v_reactivated
    from public.users where id = new."userId";

  v_start := v_created;
  if v_reactivated is not null and v_reactivated > v_start then
    v_start := v_reactivated;
  end if;

  -- لسه في نافذة مهلة الأمس (النهارده قبل الساعة 4 عصرًا) ويوم أمس أصلاً
  -- بعد ما العضو بدأ، ولسه محدش سجّل عن أمس؟ → التقرير ده يُنسَب لأمس (تأخير)
  if v_created is not null and current_time < v_cutoff and v_yesterday >= v_start then
    select exists(
      select 1 from public.reports where "userId" = new."userId" and date = v_yesterday
    ) into v_has_yesterday;

    if not v_has_yesterday then
      new.date := v_yesterday;
      return new;
    end if;
  end if;

  new.date := current_date;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 2) recalc_negligence: نفس منطق v9 بالظبط، الفرق الوحيد إن الموعد
--    النهائي (v_cutoff) بقى 4 عصرًا بدل 1 ظهرًا — وبالتالي "آخر يوم
--    اتقفل فعليًا" بيتغيّر تبعًا لذلك
-- ------------------------------------------------------------

create or replace function public.recalc_negligence(p_user_id integer)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_created date;
  v_status text;
  v_role text;
  v_postpone date;
  v_reactivated date;
  v_start date;
  v_last_final date;
  v_missed integer := 0;
  v_late integer := 0;
  v_negligent integer := 0;
  v_day date;
  v_report record;
  v_cutoff time := time '16:00';
  v_month_start timestamptz := date_trunc('month', current_date);
begin
  select "createdAt", status, role, "reactivatedAt"::date
    into v_created, v_status, v_role, v_reactivated
    from public.users where id = p_user_id;

  -- المدير مش خاضع لاحتساب/عدّ أيام التقصير خالص
  if v_role = 'admin' then
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
  if current_time >= v_cutoff then
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
        -- اتسجل في نافذة المهلة (اليوم التالي قبل الساعة 4 عصرًا) → تأخير
        v_late := v_late + 1;
      end if;
    end if;
    v_day := v_day + 1;
  end loop;

  -- كل تأخيرتين (زوج كامل) = يوم تقصير واحد. أي تأخير فردي فاضل معلّق.
  v_negligent := v_missed + (v_late / 2);

  -- إنذار أول: 4 أيام تقصير (مرة واحدة بالشهر)
  if v_negligent >= 4 and not exists (
    select 1 from public.notifications
    where "userId" = p_user_id and type = 'negligence_warning_4' and "createdAt" >= v_month_start
  ) then
    perform public.notify_user(
      p_user_id, 'negligence_warning_4', 'إنذار: 4 أيام تقصير هذا الشهر',
      'وصلت إلى 4 أيام تقصير في تسجيل تقاريرك هذا الشهر. الوصول إلى 6 أيام يؤدي لإيقاف عضويتك تلقائيًا — برجاء الانتباه.'
    );
  end if;

  -- إنذار ثانٍ: 5 أيام تقصير (مرة واحدة بالشهر)
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
        'تم إيقاف عضويتك تلقائيًا بسبب الوصول إلى 6 أيام تقصير في تسجيل التقارير هذا الشهر. تواصل مع المدير لمزيد من التفاصيل.'
      );
    end if;
    update public.users set status = 'disabled', "suspendedAuto" = true
      where id = p_user_id and status = 'active';
  end if;

  return v_negligent;
end;
$$;

-- ============================================================
-- انتهى. ملاحظات:
-- 1) لازم تشغّل supabase_migration_v9.sql الأول لو لسه ما شغلتهوش
--    (ده بيعتمد على التريجر والدالة اللي v9 عرّفهم).
-- 2) التغيير هنا بس في "قيمة" الموعد النهائي (v_cutoff) — باقي المنطق
--    (تحويل التأخير لتقصير، التاريخ التلقائي للتقرير، الإنذارات،
--    الإيقاف التلقائي) زي ما هو من v9.
-- 3) لو عضو سجّل بين الساعة 1 ظهرًا و4 عصرًا في نافذة كانت قبل هذا
--    الملف هتتحسب "تقصير كامل" (لأن الموعد النهائي كان وقتها 1 ظهرًا) —
--    بعد تشغيل هذا الملف، أي إعادة حساب لاحقة (recalc_negligence) هتراعي
--    الموعد الجديد فورًا لأي شهر لسه مفتوح (الشهر الحالي).
-- ============================================================
