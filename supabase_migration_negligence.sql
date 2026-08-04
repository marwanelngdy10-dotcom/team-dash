-- ============================================================
-- IT-qan — تحديث قاعدة البيانات: تقصير الحضور، مرفقات المهام، الإيقاف التلقائي
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد supabase_schema.sql الأساسي، ولا يحذف أي بيانات موجودة)
-- ============================================================

-- ------------------------------------------------------------
-- 1) أعمدة جديدة
-- ------------------------------------------------------------

alter table public.reports add column if not exists "postponeUntil" date;
alter table public.tasks   add column if not exists "completedAt" timestamptz;
alter table public.tasks   add column if not exists "attachment" text;
alter table public.tasks   add column if not exists "attachmentName" text;
alter table public.users   add column if not exists "suspendedAuto" boolean not null default false;
alter table public.users   add column if not exists "reactivatedAt" timestamptz;

-- ------------------------------------------------------------
-- 2) تسجيل وقت إكمال المهمة تلقائيًا
-- ------------------------------------------------------------

create or replace function public.set_task_completed_at()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'مكتملة' and (old.status is distinct from new.status) then
    new."completedAt" := now();
  elsif new.status <> 'مكتملة' and old.status = 'مكتملة' then
    new."completedAt" := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tasks_completed_at on public.tasks;
create trigger trg_tasks_completed_at
before update on public.tasks
for each row execute function public.set_task_completed_at();

-- ------------------------------------------------------------
-- 3) تتبّع إعادة التفعيل اليدوي (عشان لما المدير يرجّع عضو موقوف،
--    ما يترجعش يتوقف فورًا بسبب أيام تقصير قديمة قبل ما يرجّعه)
-- ------------------------------------------------------------

create or replace function public.track_reactivation()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if old.status = 'disabled' and new.status = 'active' then
    new."reactivatedAt" := now();
    new."suspendedAuto" := false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_users_track_reactivation on public.users;
create trigger trg_users_track_reactivation
before update on public.users
for each row execute function public.track_reactivation();

-- ------------------------------------------------------------
-- 4) حساب أيام التقصير شهريًا + الإيقاف التلقائي عند الوصول لـ 6 أيام
--    - يوم بدون تقرير خالص = تقصير
--    - يوم فيه تقرير اتسجل بعد الساعة 1 الظهر = تقصير
--    - أي يوم <= تاريخ "مؤجّل لحد" في آخر تقرير من نوع "لن يتم التعلم" لا يُحتسب تقصيرًا
-- ------------------------------------------------------------

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

  select max("postponeUntil") into v_postpone
    from public.reports where "userId" = p_user_id;

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
        -- اليوم الحالي لسه ما خلصش: يُحتسب تقصير بس لو فعلاً سجّل متأخر
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

-- يشتغل تلقائيًا كل ما عضو يسجّل تقرير جديد
create or replace function public.trg_reports_after_insert_fn()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.recalc_negligence(new."userId");
  return new;
end;
$$;

drop trigger if exists trg_reports_after_insert on public.reports;
create trigger trg_reports_after_insert
after insert on public.reports
for each row execute function public.trg_reports_after_insert_fn();

-- دالة يستدعيها المدير من الواجهة (كل ما يفتح صفحة التقارير) عشان تلحق
-- حالة "محدش سجّل خالص من كذا يوم" حتى لو محدش عمل تقرير جديد
create or replace function public.recalc_negligence_all()
returns void
language plpgsql security definer set search_path = public
as $$
declare v_user record;
begin
  if not public.is_admin() then
    raise exception 'غير مصرح لك بتنفيذ هذه العملية';
  end if;
  for v_user in select id from public.users where status = 'active' loop
    perform public.recalc_negligence(v_user.id);
  end loop;
end;
$$;

grant execute on function public.recalc_negligence(integer) to authenticated;
grant execute on function public.recalc_negligence_all() to authenticated;

-- ------------------------------------------------------------
-- 5) تخزين سحابي لمرفقات المهام (صور/ملفات)
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('task-files', 'task-files', true)
on conflict (id) do nothing;

drop policy if exists "task_files_select" on storage.objects;
create policy "task_files_select" on storage.objects
  for select using (bucket_id = 'task-files');

drop policy if exists "task_files_insert" on storage.objects;
create policy "task_files_insert" on storage.objects
  for insert with check (bucket_id = 'task-files' and auth.role() = 'authenticated');

drop policy if exists "task_files_update" on storage.objects;
create policy "task_files_update" on storage.objects
  for update using (bucket_id = 'task-files' and auth.role() = 'authenticated');

drop policy if exists "task_files_delete" on storage.objects;
create policy "task_files_delete" on storage.objects
  for delete using (bucket_id = 'task-files' and auth.role() = 'authenticated');

-- ============================================================
-- انتهى. ملاحظات:
--
-- 1) "الساعة 1 الظهر" بتتحسب حسب توقيت السيرفر (UTC) داخل Postgres، مش توقيت
--    مصر. لو عايز الدقة الكاملة حسب توقيت القاهرة، غيّر كل سطر فيه:
--       v_report."createdAt"::time
--    إلى:
--       (v_report."createdAt" at time zone 'Africa/Cairo')::time
--    (وطبّق نفس التغيير في السطر الخاص باليوم الحالي).
--
-- 2) الإيقاف التلقائي يعتمد على: (أ) كل ما عضو يسجّل تقرير جديد، (ب) كل ما
--    المدير يفتح صفحة "التقارير" في الموقع (بينفّذ recalc_negligence_all
--    تلقائيًا). يعني لو عضو سايب التطبيق تمامًا ومحدش من المدراء فتح
--    الموقع لفترة طويلة، الإيقاف هيتأخر لحد أول مرة حد يفتح صفحة التقارير.
--    لو عايز إيقاف فوري 100% حتى لو محدش فاتح الموقع، محتاج جدولة يومية
--    عبر pg_cron (متاحة في Supabase من: Database → Extensions → pg_cron)
--    ثم:
--       select cron.schedule('recalc-negligence-daily', '5 0 * * *',
--         $$ select public.recalc_negligence_all_unsafe(); $$);
--    (تحتاج دالة إضافية بدون is_admin() تُستدعى من cron فقط — قولّي لو
--    عايزها وهضيفهالك).
-- ============================================================
