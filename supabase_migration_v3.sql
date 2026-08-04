-- ============================================================
-- IT-qan — تحديث v3:
--   1) استثناء المدير (role = 'admin') نهائيًا من حساب/عدّ أيام التقصير
--      (كان ممكن يتحسب عليه تقصير ويوصل لـ 6 أيام زي أي عضو عادي)
--   2) صفحة "التعليم": المدير يقدر يحدد لعضو معيّن مادة/مهمة تعلم،
--      وكل عضو ميشوفش إلا مواد التعلم المخصصة له هو بس (عبر RLS
--      على مستوى قاعدة البيانات، مش مجرد إخفاء في الواجهة)
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد باقي ملفات supabase_migration_*.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- 1) استثناء المدير من حساب التقصير
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
  v_negligent integer := 0;
  v_day date;
  v_report record;
  v_cutoff time := time '13:00';
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

-- إعادة الحساب الجماعي: يقتصر على الأعضاء (role = 'member') فقط من الأساس
create or replace function public.recalc_negligence_all()
returns void
language plpgsql security definer set search_path = public
as $$
declare v_user record;
begin
  if not public.is_admin() then
    raise exception 'غير مصرح لك بتنفيذ هذه العملية';
  end if;
  for v_user in select id from public.users where status = 'active' and role = 'member' loop
    perform public.recalc_negligence(v_user.id);
  end loop;
end;
$$;

-- ------------------------------------------------------------
-- 2) جدول "مواد التعلم" المخصصة لكل عضو
-- ------------------------------------------------------------

create table if not exists public.learning_items (
  id serial primary key,
  title text not null,
  description text,
  link text,
  "assignedTo" integer not null references public.users(id) on delete cascade,
  "createdBy" integer references public.users(id) on delete set null,
  status text not null default 'قيد التنفيذ' check (status in ('قيد التنفيذ','تم التعلم')),
  "createdAt" timestamptz not null default now(),
  "completedAt" timestamptz
);

create index if not exists idx_learning_items_assignedTo on public.learning_items("assignedTo");

-- تسجيل وقت الإكمال تلقائيًا
create or replace function public.set_learning_completed_at()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'تم التعلم' and (old.status is distinct from new.status) then
    new."completedAt" := now();
  elsif new.status <> 'تم التعلم' and old.status = 'تم التعلم' then
    new."completedAt" := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_learning_completed_at on public.learning_items;
create trigger trg_learning_completed_at
before update on public.learning_items
for each row execute function public.set_learning_completed_at();

-- العضو (غير المدير) يقدر يعدّل حالة المادة المخصصة له بس، مش بياناتها
create or replace function public.guard_learning_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    if new."assignedTo" <> old."assignedTo"
       or new.title is distinct from old.title
       or new.description is distinct from old.description
       or new.link is distinct from old.link then
      raise exception 'يمكنك فقط تحديث حالة مادة التعلم';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_learning_update on public.learning_items;
create trigger trg_guard_learning_update
before update on public.learning_items
for each row execute function public.guard_learning_update();

alter table public.learning_items enable row level security;

-- كل عضو يشوف مواد التعلم المخصصة له هو بس، والمدير يشوف الكل
drop policy if exists "learning_select" on public.learning_items;
create policy "learning_select" on public.learning_items
  for select using (public.is_admin() or "assignedTo" = public.current_app_user_id());

-- المدير فقط يقدر يضيف مادة تعلم ويحددها لعضو
drop policy if exists "learning_insert" on public.learning_items;
create policy "learning_insert" on public.learning_items
  for insert with check (public.is_admin());

-- المدير يعدّل/يحذف أي مادة، والعضو صاحب المادة يقدر يحدّث حالتها فقط (الـ trigger فوق بيمنع تعديل باقي الأعمدة)
drop policy if exists "learning_update" on public.learning_items;
create policy "learning_update" on public.learning_items
  for update using (public.is_admin() or "assignedTo" = public.current_app_user_id())
  with check (public.is_admin() or "assignedTo" = public.current_app_user_id());

drop policy if exists "learning_delete" on public.learning_items;
create policy "learning_delete" on public.learning_items
  for delete using (public.is_admin());

grant select, insert, update, delete on public.learning_items to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ============================================================
-- انتهى.
-- ملاحظة 1: بعد تشغيل هذا الملف، أي مدير موجود بالفعل عليه أيام تقصير
--           محسوبة من قبل هتتصفر تلقائيًا في أول recalc_negligence_all
--           (بعد أول فتح لصفحة "التقارير").
-- ملاحظة 2: صفحة "التعليم" في الواجهة (index.html) تعتمد على هذا الجدول
--           — لازم تشغّل هذا الملف قبل استخدام الصفحة الجديدة.
-- ============================================================
