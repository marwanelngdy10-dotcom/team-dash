-- ============================================================
-- IT-qan — تحديث v9: نظام "مهلة اليوم التالي" + تحويل التأخير لتقصير
--
--   الفكرة:
--   - كل يوم (مثلاً الثلاثاء) له تقرير مطلوب، وموعده النهائي هو
--     الساعة 1 ظهرًا من اليوم التالي له (الأربعاء).
--   - لو العضو سجّل خلال يوم الثلاثاء نفسه (أي وقت فيه) → على الوقت،
--     مفيش أي احتساب ضده خالص.
--   - لو سجّل بعد ما الثلاثاء خلص لكن قبل الساعة 1 ظهرًا الأربعاء →
--     يتحسب "تأخير" (مش تقصير كامل مباشرة)، والتقرير ده بييُنسَب
--     تلقائيًا ليوم الثلاثاء نفسه (مش الأربعاء) في عمود date.
--   - لو محدش سجّل خالص لغاية الساعة 1 ظهرًا الأربعاء → يوم الثلاثاء
--     يتحول "تقصير" كامل (زي الأول بالظبط).
--   - كل "تأخيرتين" (زوج كامل من أيام التأخير) = يوم تقصير واحد
--     يتضاف لإجمالي أيام التقصير في الشهر. لو فاضل تأخير واحد لوحده
--     (مش متزوّج) فبيفضل معلّق كتأخير وميتحسبش تقصير لحد ما يتزوّج
--     بتأخيرة تانية.
--
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد باقي ملفات supabase_migration_*.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- 1) نسب تقرير المهلة (اللي بيتسجل يوم الأربعاء عن الثلاثاء) تلقائيًا
--    ليوم الثلاثاء نفسه — بغض النظر عن أي قيمة تبعتها الواجهة في date.
--    ده بيتحدد في السيرفر (مش في الواجهة) عشان محدش يقدر يلعب فيه.
-- ------------------------------------------------------------

create or replace function public.set_report_date_for_grace_window()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_yesterday date := current_date - 1;
  v_cutoff time := time '13:00';
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

  -- لسه في نافذة مهلة الأمس (النهارده قبل الساعة 1 ظهرًا) ويوم أمس أصلاً
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

drop trigger if exists trg_set_report_date on public.reports;
create trigger trg_set_report_date
before insert on public.reports
for each row execute function public.set_report_date_for_grace_window();

-- منع تعديل عمود date بعد الحفظ (غير المدير) — عشان نضمن إن نسبة التقرير
-- ليوم معيّن (على الوقت / متأخر) متحسبش غلط بعد ما تتحدد وقت الإنشاء
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
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 2) إعادة كتابة recalc_negligence: يوم مفقود = تقصير كامل، يوم متأخر
--    (اتسجل في نافذة المهلة) = نصف تقصير (يتراكم ويتحول لتقصير كامل
--    كل ما يتزوّج بتأخيرة تانية)
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
  v_cutoff time := time '13:00';
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

  -- آخر يوم "اتقفل" فعليًا (فات موعده النهائي: الساعة 1 ظهرًا اليوم التالي له)
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
        -- اتسجل في نافذة المهلة (اليوم التالي قبل الساعة 1) → تأخير
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
-- انتهى. ملاحظات مهمة:
--
-- 1) بعد تشغيل هذا الملف، أي تقرير جديد هيتحدد تاريخه (date) تلقائيًا
--    من السيرفر حسب القاعدة الجديدة — الواجهة (index.html) مش محتاجة
--    تتغيّر في جزء إرسال التقرير، لأنها أصلًا مبتبعتش date خالص.
--
-- 2) التقارير القديمة (اللي اتسجلت قبل هذا الملف) متأثرتش رجعيًا —
--    الدالة الجديدة بتشتغل على أي تقرير موجود بنفس المنطق وقت
--    recalc_negligence، لكن التقارير القديمة أصلًا كانت بتتسجل بـ
--    date = يوم الإنشاء نفسه (مفيش مهلة كانت مفعّلة وقتها)، فمفيش
--    تعارض.
--
-- 3) لو عضو عنده تأخير واحد فاضي (مش متزوّج) في آخر الشهر، ده مش
--    بيتحول تقصير ولا بيتنقل للشهر اللي بعده — بيتصفر تلقائيًا لأن
--    الحساب شهري (v_start = أول الشهر الحالي).
--
-- 4) القيمة اللي بترجع من recalc_negligence دلوقتي = (أيام التقصير
--    الكاملة + نص عدد أيام التأخير مقربة لأسفل)، وهي نفسها المستخدمة
--    في كل إشعارات 4/5/6 أيام والإيقاف التلقائي.
-- ============================================================
