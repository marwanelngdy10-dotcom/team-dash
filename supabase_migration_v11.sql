-- ============================================================
-- IT-qan — تحديث v11: تقسيم "نافذة الغد" لجزئين بدل ما هي كلها "تأخير"
--
--   المشكلة اللي كانت موجودة (v9/v10):
--   أي تقرير بيتسجل يوم الخميس عن يوم الأربعاء — حتى لو الساعة 12:48
--   بالليل بالظبط بعد منتصف الليل بلحظة — كان بيتحسب "تأخير" فورًا.
--
--   المطلوب دلوقتي:
--   - تسجيل يوم الأربعاء نفسه (أي وقت فيه) → على الوقت تمامًا، صفر احتساب.
--   - تسجيل يوم الخميس من الساعة 12:00 صباحًا لحد الساعة 1:00 ظهرًا
--     → **لسه على الوقت تمامًا برضو**، صفر احتساب (ده الفرق عن v9/v10).
--   - تسجيل يوم الخميس من الساعة 1:00 ظهرًا لحد الساعة 4:00 عصرًا
--     → "تأخير" (نصف تقصير، زي ما كان معمول بالظبط، وكل تأخيرتين = يوم
--     تقصير واحد).
--   - محدش سجّل خالص لغاية الساعة 4:00 عصرًا يوم الخميس → يوم الأربعاء
--     "تقصير" كامل مباشرة (زي ما هو، مفيش تغيير هنا).
--
--   يعني الموعد النهائي لقفل اليوم لسه 4 عصرًا زي v10 بالظبط — الفرق
--   الوحيد إن نافذة "التأخير" بقت أضيق (1 ظهرًا → 4 عصرًا) بدل ما كانت
--   (منتصف الليل → 4 عصرًا).
--
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد supabase_migration_v10.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- ملحوظة: تريجر تحديد تاريخ التقرير (set_report_date_for_grace_window)
-- مش محتاج يتغيّر خالص — هو أصلًا شغله الوحيد إنه "ينسب" تقرير الخميس
-- الصبح/الضهر لتاريخ الأربعاء (طول ما لسه قبل موعد القفل النهائي 4 عصرًا)،
-- وده لسه صحيح 100% في الحالتين (سواء هيتحسب على الوقت أو تأخير).
-- الجزء اللي فعلًا محتاج يتغيّر هو recalc_negligence بس، وتحديدًا شرط
-- احتساب "تأخير".
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
  v_final_cutoff time := time '16:00';  -- موعد القفل النهائي لليوم (زي v10)
  v_late_start time := time '13:00';    -- بداية نافذة "التأخير" (جديد في v11)
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
        -- اتسجل يوم بعد اليوم المطلوب (يعني في نافذة الغد)
        if v_report."createdAt"::time >= v_late_start then
          -- بعد الساعة 1 ظهرًا (ولسه قبل موعد القفل النهائي 4 عصرًا) → تأخير
          v_late := v_late + 1;
        end if;
        -- قبل الساعة 1 ظهرًا → على الوقت تمامًا، صفر احتساب (مفيش else هنا عمدًا)
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
--
-- 1) لازم تشغّل supabase_migration_v10.sql الأول لو لسه ما شغلتهوش
--    (هذا الملف بيعتمد على نفس تريجر set_report_date_for_grace_window
--    وموعد القفل النهائي 4 عصرًا اللي v10 عرّفهم — ومفيش داعي لإعادة
--    تعريف التريجر لأنه لم يتغيّر).
--
-- 2) التغيير هنا محصور فقط في recalc_negligence: تقسيم نافذة "الغد"
--    لجزئين (قبل 1 ظهرًا = على الوقت، من 1 لـ4 عصرًا = تأخير) بدل ما
--    كانت النافذة كلها (من منتصف الليل لـ4 عصرًا) = تأخير.
--
-- 3) التقارير القديمة اللي كانت اتحسبت "تأخير" غلط (زي اللي في الصورة،
--    اتسجلت الساعة 12:48 بالليل) هتتصحح تلقائيًا لأول recalc_negligence
--    بعده — يعني أول ما: (أ) العضو ده يسجّل تقرير جديد، أو (ب) أي مدير
--    يفتح صفحة "التقارير" (اللي بتنفّذ recalc_negligence_all). لو عايز
--    تصحيح فوري دلوقتي من غير ما تستنى، افتح صفحة "التقارير" كمدير بعد
--    تشغيل هذا الملف.
-- ============================================================
