-- ============================================================
-- TeamFlow — إعداد قاعدة بيانات Supabase بالكامل
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ------------------------------------------------------------
-- 1) الجداول
-- ------------------------------------------------------------

create table public.users (
  id serial primary key,
  "authId" uuid unique references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  role text not null default 'member' check (role in ('admin','member')),
  status text not null default 'pending' check (status in ('pending','active','disabled')),
  avatar text,
  "createdAt" date not null default current_date
);

create table public.tasks (
  id serial primary key,
  title text not null,
  description text,
  "assignedTo" integer not null references public.users(id) on delete cascade,
  priority text not null default 'متوسطة' check (priority in ('منخفضة','متوسطة','عالية')),
  "dueDate" date,
  status text not null default 'قيد التنفيذ' check (status in ('قيد التنفيذ','مكتملة')),
  "createdAt" timestamptz not null default now()
);

create table public.reports (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  "taskId" integer references public.tasks(id) on delete set null,
  status text not null check (status in ('تم التعلم','يتم التعلم','لن يتم التعلم')),
  description text not null,
  date date not null default current_date,
  "createdAt" timestamptz not null default now()
);

create index idx_tasks_assignedTo on public.tasks("assignedTo");
create index idx_reports_userId on public.reports("userId");
create index idx_reports_taskId on public.reports("taskId");

-- ------------------------------------------------------------
-- 2) دوال مساعدة (تُستخدم داخل سياسات RLS لتفادي أي تكرار لا نهائي)
-- ------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from public.users
    where "authId" = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.current_app_user_id()
returns integer
language sql security definer set search_path = public
as $$
  select id from public.users where "authId" = auth.uid();
$$;

-- ------------------------------------------------------------
-- 3) عند تسجيل أي حساب جديد في Supabase Auth، أنشئ له صفًا في users تلقائيًا
--    (يبدأ role='member' و status='pending' لحين موافقة المدير)
-- ------------------------------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (name, email, role, status, "authId")
  values (
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'member',
    'pending',
    new.id
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- ------------------------------------------------------------
-- 4) حراسة إضافية (Guards) داخل قاعدة البيانات
-- ------------------------------------------------------------

-- منع تعديل الدور/الحالة إلا من مدير، ومنع تعطيل/تنزيل آخر مدير أو تعطيل النفس
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

  if old."authId" = auth.uid() and new.status = 'disabled' then
    raise exception 'لا يمكنك تعطيل حسابك الخاص';
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

create trigger trg_guard_users_update
before update on public.users
for each row execute function public.guard_users_update();

-- منع حذف النفس أو حذف آخر مدير
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
  if old.role = 'admin' then
    select count(*) into admin_count from public.users where role = 'admin';
    if admin_count <= 1 then
      raise exception 'لا يمكن حذف آخر مدير';
    end if;
  end if;
  return old;
end;
$$;

create trigger trg_guard_users_delete
before delete on public.users
for each row execute function public.guard_users_delete();

-- الأعضاء (غير المدير) يقدروا يعدّلوا حالة مهمتهم فقط، مش بياناتها
create or replace function public.guard_tasks_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    if new."assignedTo" <> old."assignedTo"
       or new.title is distinct from old.title
       or new.description is distinct from old.description
       or new.priority is distinct from old.priority
       or new."dueDate" is distinct from old."dueDate" then
      raise exception 'يمكنك فقط تحديث حالة المهمة';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_guard_tasks_update
before update on public.tasks
for each row execute function public.guard_tasks_update();

-- التأكد إن العضو المسؤول عن المهمة موجود ونشط
create or replace function public.validate_task_assignee()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.users where id = new."assignedTo" and status = 'active') then
    raise exception 'العضو المسؤول غير موجود أو غير نشط';
  end if;
  return new;
end;
$$;

create trigger trg_validate_task_assignee
before insert or update of "assignedTo" on public.tasks
for each row execute function public.validate_task_assignee();

-- ------------------------------------------------------------
-- 5) تفعيل Row Level Security + السياسات
-- ------------------------------------------------------------

alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.reports enable row level security;

-- users
create policy "users_select" on public.users
  for select using ("authId" = auth.uid() or public.is_admin());

create policy "users_update" on public.users
  for update using ("authId" = auth.uid() or public.is_admin())
  with check ("authId" = auth.uid() or public.is_admin());

create policy "users_delete" on public.users
  for delete using (public.is_admin());

-- tasks
create policy "tasks_select" on public.tasks
  for select using (public.is_admin() or "assignedTo" = public.current_app_user_id());

create policy "tasks_insert" on public.tasks
  for insert with check (public.is_admin());

create policy "tasks_update" on public.tasks
  for update using (public.is_admin() or "assignedTo" = public.current_app_user_id())
  with check (public.is_admin() or "assignedTo" = public.current_app_user_id());

create policy "tasks_delete" on public.tasks
  for delete using (public.is_admin());

-- reports
create policy "reports_select" on public.reports
  for select using (public.is_admin() or "userId" = public.current_app_user_id());

create policy "reports_insert" on public.reports
  for insert with check ("userId" = public.current_app_user_id());

-- ------------------------------------------------------------
-- 6) صلاحيات الأدوار (Roles)
-- ------------------------------------------------------------

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.users, public.tasks, public.reports to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ============================================================
-- انتهى إعداد القاعدة. الخطوة التالية بعد تشغيل هذا الملف:
--
-- 1) روح لإعدادات المصادقة: Authentication → Providers → Email
--    وأطفئ "Confirm email" (عشان الموافقة على الأعضاء تبقى مسؤولية
--    المدير من داخل التطبيق، مش عبر إيميل تأكيد منفصل).
--
-- 2) سجّل حسابك كمدير من واجهة التطبيق نفسها (تسجيل عضو جديد).
--
-- 3) ارجع هنا لـ SQL Editor ونفّذ السطر ده (غيّر الإيميل بإيميلك):
--
--    update public.users set role = 'admin', status = 'active'
--    where email = 'your-email@example.com';
--
-- كده حسابك بقى مدير نشط ويقدر يوافق على باقي الأعضاء من واجهة "الأعضاء".
-- ============================================================
