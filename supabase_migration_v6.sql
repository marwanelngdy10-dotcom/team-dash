-- ============================================================
-- IT-qan — تحديث v6:
--   1) صفحة "مصادر التعلم": مصدر عام يفيد الفريق كله، المدير يقدر يبني
--      لها أعمدة بالشكل اللي يحتاجه (نص/رابط/تاريخ/ملاحظة) ويضيف
--      صفوف بيانات، وكل الأعضاء النشطين يشوفوها (قراءة فقط)
--   2) نظام إشعارات داخل المنصة:
--      - إشعار فوري لما تُسنَد مهمة لعضو
--      - إنذار أول لما يوصل "4" أيام تقصير في الشهر
--      - إنذار تاني لما يوصل "5" أيام تقصير في الشهر
--      - إشعار إيقاف لما يوصل "6" أيام تقصير (ويترتب عليه تعطيل الحساب،
--        زي ما هو مطبّق أصلًا في supabase_migration_negligence.sql)
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد باقي ملفات supabase_migration_*.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- 0) دالة مساعدة: هل المستخدم الحالي عضو نشط (أيًا كان دوره)؟
--    مستخدمة في صلاحيات القراءة المشتركة (مصادر التعلم مثلًا)
-- ------------------------------------------------------------

create or replace function public.is_active_user()
returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from public.users where "authId" = auth.uid() and status = 'active'
  );
$$;

-- ------------------------------------------------------------
-- 1) مصادر التعلم — جدول أعمدة قابل للتخصيص من المدير + جدول صفوف
-- ------------------------------------------------------------

create table if not exists public.resource_columns (
  id serial primary key,
  key text not null unique,                 -- مفتاح ثابت (يُستخدم كمفتاح داخل data jsonb)
  label text not null,                       -- الاسم الظاهر في رأس العمود
  type text not null default 'text' check (type in ('text','link','date','note')),
  "order" integer not null default 0,
  "createdAt" timestamptz not null default now()
);

create table if not exists public.resources (
  id serial primary key,
  data jsonb not null default '{}'::jsonb,   -- { "<column-key>": "value", ... }
  "createdBy" integer references public.users(id) on delete set null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_resources_createdAt on public.resources("createdAt");

create or replace function public.set_resource_updated_at()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  new."updatedAt" := now();
  return new;
end;
$$;

drop trigger if exists trg_resources_updated_at on public.resources;
create trigger trg_resources_updated_at
before update on public.resources
for each row execute function public.set_resource_updated_at();

alter table public.resource_columns enable row level security;
alter table public.resources enable row level security;

-- أي عضو نشط (مدير أو عضو عادي) يقدر يشوف تعريف الأعمدة والصفوف
drop policy if exists "resource_columns_select" on public.resource_columns;
create policy "resource_columns_select" on public.resource_columns
  for select using (public.is_active_user());

-- المدير فقط يضيف/يعدّل/يحذف تعريف الأعمدة (شكل الجدول)
drop policy if exists "resource_columns_write" on public.resource_columns;
create policy "resource_columns_write" on public.resource_columns
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "resources_select" on public.resources;
create policy "resources_select" on public.resources
  for select using (public.is_active_user());

-- المدير فقط يضيف/يعدّل/يحذف صفوف البيانات
drop policy if exists "resources_write" on public.resources;
create policy "resources_write" on public.resources
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.resource_columns, public.resources to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ------------------------------------------------------------
-- 2) نظام الإشعارات
-- ------------------------------------------------------------

create table if not exists public.notifications (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  type text not null,                        -- 'task_assigned' | 'negligence_warning_4' | 'negligence_warning_5' | 'negligence_removed' | ...
  title text not null,
  body text,
  "relatedId" integer,                       -- رقم المهمة أو أي مرجع مرتبط (اختياري)
  "isRead" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

create index if not exists idx_notifications_userId on public.notifications("userId");
create index if not exists idx_notifications_userId_isRead on public.notifications("userId", "isRead");

alter table public.notifications enable row level security;

-- كل عضو يشوف إشعاراته هو بس
drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications
  for select using ("userId" = public.current_app_user_id());

-- كل عضو يقدر يحدّث حالة القراءة لإشعاراته هو بس (مفيش سماح بتعديل باقي الأعمدة عمليًا لأن الواجهة بتبعت isRead بس)
drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications
  for update using ("userId" = public.current_app_user_id())
  with check ("userId" = public.current_app_user_id());

-- كل عضو يقدر يحذف إشعاراته هو بس (تنظيف قائمته)
drop policy if exists "notifications_delete" on public.notifications;
create policy "notifications_delete" on public.notifications
  for delete using ("userId" = public.current_app_user_id());

-- ملحوظة: عمدًا لا توجد سياسة INSERT للمستخدمين — الإشعارات تُنشأ فقط عبر
-- دوال داخلية (security definer) تتجاوز RLS، عشان محدش يقدر يبعت إشعارات وهمية لنفسه أو لغيره
grant select, update, delete on public.notifications to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create or replace function public.notify_user(
  p_user_id integer, p_type text, p_title text, p_body text default null, p_related_id integer default null
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.notifications ("userId", type, title, body, "relatedId")
  values (p_user_id, p_type, p_title, p_body, p_related_id);
end;
$$;

-- ------------------------------------------------------------
-- 3) إشعار فوري عند إسناد مهمة لعضو (عند الإنشاء، أو عند تغيير المسؤول)
-- ------------------------------------------------------------

create or replace function public.notify_task_assigned()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new."assignedTo" is distinct from old."assignedTo") then
    perform public.notify_user(
      new."assignedTo", 'task_assigned', 'تم إسناد مهمة جديدة إليك',
      new.title, new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tasks_notify_assigned on public.tasks;
create trigger trg_tasks_notify_assigned
after insert or update of "assignedTo" on public.tasks
for each row execute function public.notify_task_assigned();

-- ------------------------------------------------------------
-- 4) إنذارات التقصير (4 أيام / 5 أيام) + إشعار الإيقاف عند 6 أيام
--    تُبنى فوق دالة recalc_negligence الموجودة (من supabase_migration_v3.sql)
--    كل نوع إشعار يُرسَل مرة واحدة فقط لكل عضو خلال الشهر الحالي
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

grant execute on function public.notify_user(integer, text, text, text, integer) to authenticated;

-- ============================================================
-- انتهى. ملاحظات:
-- 1) صفحة "مصادر التعلم" في الواجهة تعتمد على resource_columns + resources —
--    لازم تشغّل هذا الملف قبل استخدام الصفحة.
-- 2) قيم "postponeApproved" وغيرها من منطق التقصير لم تتغيّر — فقط أُضيفت
--    إشعارات جانبية عند عبور عتبات 4/5/6 أيام.
-- 3) زي باقي حسابات التقصير، دالة recalc_negligence بتتنفذ: (أ) كل ما عضو
--    يسجّل تقرير جديد، (ب) كل ما المدير يفتح صفحة "التقارير" في الموقع.
-- ============================================================
