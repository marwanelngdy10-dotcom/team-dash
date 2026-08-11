-- ============================================================
-- IT-qan — تحديث v24: إلغاء يوم تقصير معيّن لعضو معيّن (بيد السوبر أدمن بس)
--
--   الفرق عن "استثناء التقصير" (negligenceExempt من v15):
--   - negligenceExempt = استثناء دائم لكل شهر (الحساب مايتحسبش عليه
--     تقصير أصلًا خالص).
--   - الميزة الجديدة هنا = عكس ذلك تمامًا: الحساب لسه خاضع للتقصير
--     زي أي حد، لكن السوبر أدمن يقدر يلغي "يوم واحد بعينه" اتحسب
--     تقصير (أو تأخير) على شخص معيّن، فيرجع العدّ الإجمالي زي ما كان
--     قبل ما اليوم ده يُحتسب (لو كان عند 6 مثلاً يرجع 5) — نفس فكرة
--     يوم الجمعة (إجازة) بالظبط بس على مستوى يوم واحد محدد بدل كل
--     الجمعات.
--
--   ملحوظة مهمة: لو الحساب كان اتوقف تلقائيًا (suspendedAuto) بسبب
--   وصوله لـ 6 أيام، إلغاء يوم مايرجّعش الحساب "نشط" تلقائيًا — لسه
--   محتاج المدير/السوبر أدمن يرجّعه يدويًا من صفحة "الأعضاء" زي ما هو
--   معمول أصلًا (الملف ده بس بيصحّح العدّاد قبل أي قرار).
--
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد باقي ملفات supabase_migration_*.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- 1) جدول الأيام الملغاة يدويًا
-- ------------------------------------------------------------

create table if not exists public.negligence_forgiven_days (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  date date not null,
  "forgivenBy" integer references public.users(id) on delete set null,
  "createdAt" timestamptz not null default now(),
  unique ("userId", date)
);

create index if not exists idx_negligence_forgiven_days_userId on public.negligence_forgiven_days("userId");

alter table public.negligence_forgiven_days enable row level security;

-- القراءة: السوبر أدمن/المدير (زي باقي بيانات التقصير) أو العضو نفسه
-- يقدر يشوف الأيام الملغاة بتاعته (شفافية — يعرف مثلاً ليه عدّه اتغيّر)
drop policy if exists "negligence_forgiven_days_select" on public.negligence_forgiven_days;
create policy "negligence_forgiven_days_select" on public.negligence_forgiven_days
  for select using (public.is_admin() or "userId" = public.current_app_user_id());

-- الإضافة/الحذف: السوبر أدمن بس — حتى المدير العادي مش مسموح له
drop policy if exists "negligence_forgiven_days_insert" on public.negligence_forgiven_days;
create policy "negligence_forgiven_days_insert" on public.negligence_forgiven_days
  for insert with check (public.is_super_admin());

drop policy if exists "negligence_forgiven_days_delete" on public.negligence_forgiven_days;
create policy "negligence_forgiven_days_delete" on public.negligence_forgiven_days
  for delete using (public.is_super_admin());

grant select, insert, delete on public.negligence_forgiven_days to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ------------------------------------------------------------
-- 2) recalc_negligence: نفس الدالة الحالية بالظبط (اللي فيها إجازة
--    الجمعة) + إضافة واحدة بس — أي يوم موجود في الجدول أعلاه بيتخطّاه
--    الحساب بالكامل (زي الجمعة تمامًا: لا تقصير ولا تأخير عليه خالص،
--    بغض النظر عن وجود تقرير فيه أو لأ)
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
  v_final_cutoff time := time '16:00';
  v_late_start time := time '13:00';
  v_month_start timestamptz := date_trunc('month', current_date);
begin
  select "createdAt", status, "isSuperAdmin", "negligenceExempt", "reactivatedAt"::date
    into v_created, v_status, v_is_super, v_exempt, v_reactivated
    from public.users where id = p_user_id;

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

  if current_time >= v_final_cutoff then
    v_last_final := current_date - 1;
  else
    v_last_final := current_date - 2;
  end if;

  v_day := v_start;
  while v_day <= v_last_final loop
    -- يوم الجمعة: إجازة كاملة — تخطّاه بالكامل
    if extract(dow from v_day) = 5 then
      v_day := v_day + 1;
      continue;
    end if;

    -- يوم اتلغى يدويًا بمعرفة السوبر أدمن (جديد في v24) — تخطّاه بالكامل
    -- بنفس منطق الجمعة تمامًا، بغض النظر عن postpone أو وجود تقرير فيه
    if exists (
      select 1 from public.negligence_forgiven_days
      where "userId" = p_user_id and date = v_day
    ) then
      v_day := v_day + 1;
      continue;
    end if;

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
-- 3) دالتين يقدر السوبر أدمن يناديهم من الواجهة: إلغاء يوم / التراجع
--    عن الإلغاء — كل واحدة بترفض أي حد غير سوبر أدمن من جوه الدالة
--    نفسها (دفاع مزدوج فوق RLS)، وبتعيد حساب أيام التقصير فورًا
--    وترجّع العدّ الجديد عشان الواجهة تحدّثه على طول
-- ------------------------------------------------------------

create or replace function public.forgive_negligence_day(p_user_id integer, p_date date)
returns integer
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يلغي يوم تقصير';
  end if;

  insert into public.negligence_forgiven_days ("userId", date, "forgivenBy")
  values (p_user_id, p_date, public.current_app_user_id())
  on conflict ("userId", date) do nothing;

  return public.recalc_negligence(p_user_id);
end;
$$;

create or replace function public.unforgive_negligence_day(p_user_id integer, p_date date)
returns integer
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يتراجع عن إلغاء يوم تقصير';
  end if;

  delete from public.negligence_forgiven_days where "userId" = p_user_id and date = p_date;

  return public.recalc_negligence(p_user_id);
end;
$$;

grant execute on function public.forgive_negligence_day(integer, date) to authenticated;
grant execute on function public.unforgive_negligence_day(integer, date) to authenticated;

-- ============================================================
-- انتهى. ملاحظات:
--
-- 1) هذا الملف مايغيّرش أي منطق تاني في recalc_negligence (الاستثناء
--    الكامل، التأخير، موعد القفل 4/1، الإنذارات) — الإضافة الوحيدة هي
--    خطوة "تخطّي اليوم الملغى" جوه الحلقة، بنفس أسلوب تخطّي الجمعة
--    بالظبط.
--
-- 2) لو عضو عنده تأخيرة واحدة "معلّقة" (مش متزوّجة) في يوم معيّن وألغيت
--    اليوم ده، التأخيرة المعلّقة بتروح معاه طبيعي (لأنه بيتخطّى بالكامل).
--
-- 3) إلغاء يوم بعد ما إشعار إنذار (4/5 أيام) أو إشعار الإيقاف اتبعت
--    بالفعل — الإشعار القديم في جرس الإشعارات مش بيتسحب تلقائيًا
--    (ده إشعار تاريخي بيوثّق إن الحدث حصل وقتها)، لكن العدّ نفسه
--    (اللي بيتحكم في أي قرار جديد) بيتحدّث فورًا.
--
-- 4) لازم تشغّل تحديث index.html المرفق كمان — هو اللي بيضيف زرار
--    "إلغاء يوم التقصير" جنب كل يوم "تقصير"/"تأخير" في تفاصيل العضو
--    بصفحة "التقارير" (يظهر للسوبر أدمن بس، زي أي إجراء حساس تاني).
-- ============================================================
