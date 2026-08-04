-- ============================================================
-- IT-qan — تحديث v2: ملاحظة نصية عند إكمال المهمة + موافقة المدير
-- على "عذر" تأجيل احتساب التقصير عند اختيار "لن يتم التعلم"
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد supabase_schema.sql و supabase_migration_negligence.sql،
--  ولا يحذف أي بيانات موجودة)
-- ============================================================

-- ------------------------------------------------------------
-- 1) ملاحظة نصية عند إكمال المهمة (بديل/بالإضافة لرفع ملف)
-- ------------------------------------------------------------

alter table public.tasks add column if not exists "completionNote" text;

-- ------------------------------------------------------------
-- 2) موافقة المدير على "عذر" التأجيل (postponeUntil)
--    قبل كده: العضو كان يقدر يحدد تاريخ تأجيل بنفسه وكان يُحتسب فورًا
--    من غير مراجعة. دلوقتي: التأجيل بيفضل "بانتظار المراجعة" لحد ما
--    المدير يوافق عليه صراحة، وإلا مابيتحسبش ضد التقصير.
--    القيم: null = بانتظار المراجعة، true = تمت الموافقة، false = مرفوض
-- ------------------------------------------------------------

alter table public.reports add column if not exists "postponeApproved" boolean;

-- سياسة تحديث للتقارير: المدير فقط يقدر يعدّل تقرير (للموافقة/الرفض على العذر)
drop policy if exists "reports_update" on public.reports;
create policy "reports_update" on public.reports
  for update using (public.is_admin())
  with check (public.is_admin());

-- تحديث دالة حساب أيام التقصير: تجاهل أي "تأجيل" لسه مش موافق عليه من المدير
create or replace function public.recalc_negligence(p_user_id integer)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_created date;
  v_status text;
  v_postpone date;
  v_reactivated date;
  v_start date;
  v_negligent integer := 0;
  v_day date;
  v_report record;
  v_cutoff time := time '13:00';
begin
  select "createdAt", status, "reactivatedAt"::date
    into v_created, v_status, v_reactivated
    from public.users where id = p_user_id;

  if v_created is null or v_status <> 'active' then
    return 0;
  end if;

  -- بس التأجيلات اللي المدير وافق عليها فعلًا (postponeApproved = true) بتُحتسب
  select max("postponeUntil") into v_postpone
    from public.reports where "userId" = p_user_id and "postponeApproved" = true;

  v_start := greatest(date_trunc('month', current_date)::date, v_created);
  if v_reactivated is not null and v_reactivated > v_start then
    v_start := v_reactivated;
  end if;

  v_day := v_start;
  while v_day <= current_date loop
    if v_postpone is null or v_day > v_postpone then
      select * into v_report from public.reports
        where "userId" = p_user_id and date = v_day
        order by "createdAt" asc limit 1;

      if v_day < current_date then
        if not found or v_report."createdAt"::time > v_cutoff then
          v_negligent := v_negligent + 1;
        end if;
      else
        if found and v_report."createdAt"::time > v_cutoff then
          v_negligent := v_negligent + 1;
        end if;
      end if;
    end if;
    v_day := v_day + 1;
  end loop;

  if v_negligent >= 6 then
    update public.users set status = 'disabled', "suspendedAuto" = true
      where id = p_user_id and status = 'active';
  end if;

  return v_negligent;
end;
$$;

-- ============================================================
-- انتهى. ملاحظة:
-- التأجيلات القديمة (اللي اتسجلت قبل تشغيل هذا الملف) هتبقى قيمتها
-- postponeApproved = null (بانتظار المراجعة) ومش هتُحتسب تلقائيًا،
-- لحد ما المدير يوافق عليها من واجهة "التقارير".
-- ============================================================
