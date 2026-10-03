-- ============================================================
-- IT-qan — تحديث "الفرق المتعددة" (Multi-tenant):
--   كل فريق له لوحة متابعة خاصة بيه (أعضاء، مهام، تقارير، شات، كورسات...)
--   وأي فريق مايقدرش يشوف أو يعدّل بيانات فريق تاني — العزل بيتفرض من
--   قاعدة البيانات نفسها (RLS + Triggers)، مش مجرد إخفاء في الواجهة.
--   + ربط كل فريق بجروب تليجرام خاص بيه لاستقبال التقارير.
--
-- الصق الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد كل ملفات supabase_migration_*.sql الموجودة عندك.
--  آمن لإعادة التشغيل أكتر من مرة، ولا يحذف أي بيانات.)
--
-- فكرة العزل: بنضيف سياسة "RESTRICTIVE" واحدة على كل جدول بتتجمع (AND)
-- مع سياسات الصلاحيات الحالية بتاعتك من غير ما نغيّرها أو نعيد كتابتها:
-- الصلاحيات القديمة بتحدد "مين يقدر يعمل إيه"، والسياسة الجديدة بتضمن إن
-- ده كله جوه فريقه هو بس.
-- ============================================================

-- ------------------------------------------------------------
-- 1) جدول الفرق
-- ------------------------------------------------------------

create table if not exists public.teams (
  id serial primary key,
  name text not null check (char_length(trim(name)) between 2 and 60),
  "inviteCode" text not null unique
    default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  "telegramChatId" text,
  "telegramChatTitle" text,
  "telegramGroupLink" text,
  "telegramLinkedAt" timestamptz,
  "telegramConnectCode" text,
  "telegramConnectExpiresAt" timestamptz,
  "telegramReportsEnabled" boolean not null default true,
  "createdAt" timestamptz not null default now()
);

-- جروب تليجرام واحد مايتربطش بأكتر من فريق، وكود الربط مايتكررش
create unique index if not exists idx_teams_telegram_chat
  on public.teams("telegramChatId") where "telegramChatId" is not null;
create unique index if not exists idx_teams_telegram_connect_code
  on public.teams("telegramConnectCode") where "telegramConnectCode" is not null;

-- الجدول مقفول على المتصفح تمامًا: القراءة/الكتابة بتتم عبر الدوال تحت
-- (security definer) أو عبر Edge Functions بصلاحية service_role
alter table public.teams enable row level security;
revoke all on public.teams from anon, authenticated;

-- الفريق الحالي (البيانات الموجودة دلوقتي) بيبقى "الفريق رقم 1"
insert into public.teams (name)
select 'الفريق الأساسي'
where not exists (select 1 from public.teams);

-- ------------------------------------------------------------
-- 2) دوال مساعدة
-- ------------------------------------------------------------

-- فريق المستخدم الحالي (من توكن الجلسة)
create or replace function public.current_team_id()
returns integer
language sql stable security definer set search_path = public
as $$
  select "teamId" from public.users where "authId" = auth.uid() limit 1
$$;
grant execute on function public.current_team_id() to anon, authenticated;

-- تعبئة teamId تلقائيًا عند أي INSERT (من فريق المستخدم الحالي، وإلا من
-- صاحب السجل: userId / assignedTo / senderId...) — عشان الواجهة والتريجرات
-- الحالية تفضل شغالة من غير ما نعدّل أي استعلام فيها
create or replace function public.fill_team_id()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_team integer;
  v_json jsonb := to_jsonb(NEW);
  v_col text;
  v_uid text;
begin
  if NEW."teamId" is not null then
    return NEW;
  end if;

  v_team := public.current_team_id();

  if v_team is null then
    foreach v_col in array array['userId','assignedTo','senderId','recipientId','createdBy'] loop
      v_uid := v_json ->> v_col;
      if v_uid is not null then
        select "teamId" into v_team from public.users where id = v_uid::integer;
        exit when v_team is not null;
      end if;
    end loop;
  end if;

  NEW."teamId" := v_team;
  return NEW;
end;
$$;

-- حارس العزل: حتى لو فيه دالة security definer قديمة (زي increase_negligence
-- أو forgive_negligence_day) بتتخطى RLS، الحارس ده بيمنع أي مستخدم مسجّل
-- دخوله من تعديل/حذف/إضافة سجل بتاع فريق تاني.
-- (الطلبات اللي من غير مستخدم — زي التسجيل الجديد وسكريبت تليجرام اليومي —
--  بتعدّي عادي لأنها بتتم بصلاحيات السيرفر.)
create or replace function public.enforce_team_scope()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_me integer;
begin
  if auth.uid() is null then
    if TG_OP = 'DELETE' then return OLD; end if;
    return NEW;
  end if;

  v_me := public.current_team_id();

  if TG_OP in ('UPDATE','DELETE') and OLD."teamId" is distinct from v_me then
    raise exception 'غير مصرح: هذا السجل يخص فريقًا آخر';
  end if;
  if TG_OP in ('INSERT','UPDATE') and NEW."teamId" is distinct from v_me then
    raise exception 'غير مصرح: لا يمكنك الكتابة داخل فريق آخر';
  end if;

  if TG_OP = 'DELETE' then return OLD; end if;
  return NEW;
end;
$$;

-- ------------------------------------------------------------
-- 3) تطبيق العزل على كل جداول البيانات
--    (لو جدول مش موجود عندك بيتخطّاه بهدوء)
-- ------------------------------------------------------------

do $$
declare
  v_team1 integer := (select min(id) from public.teams);
  v_tables text[] := array[
    'users','tasks','reports','learning_items','messages',
    'resources','resource_columns','courses','course_categories',
    'notifications','negligence_forgiven_days'
  ];
  t text;
  v_rls boolean;
begin
  foreach t in array v_tables loop
    if to_regclass('public.' || t) is null then
      raise notice 'تخطّي جدول غير موجود: %', t;
      continue;
    end if;

    -- عمود الفريق
    execute format('alter table public.%I add column if not exists "teamId" integer references public.teams(id) on delete cascade', t);

    -- كل البيانات الحالية تتنسب للفريق الأساسي
    -- (بنوقف تريجرات المستخدم لحظيًا عشان الحراس القديمة ماترفضش التعبئة)
    execute format('alter table public.%I disable trigger user', t);
    execute format('update public.%I set "teamId" = %s where "teamId" is null', t, v_team1);
    execute format('alter table public.%I enable trigger user', t);

    execute format('create index if not exists %I on public.%I("teamId")', 'idx_' || t || '_teamId', t);

    -- القيمة الافتراضية = فريق المستخدم اللي بيضيف السجل
    execute format('alter table public.%I alter column "teamId" set default public.current_team_id()', t);

    -- تريجر التعبئة (للجداول غير users — users ليها تريجر خاص تحت)
    if t <> 'users' then
      execute format('drop trigger if exists aa_fill_team_id on public.%I', t);
      execute format('create trigger aa_fill_team_id before insert on public.%I for each row execute function public.fill_team_id()', t);
    end if;

    -- حارس العزل
    execute format('drop trigger if exists zz_enforce_team_scope on public.%I', t);
    execute format('create trigger zz_enforce_team_scope before insert or update or delete on public.%I for each row execute function public.enforce_team_scope()', t);

    -- RLS
    select relrowsecurity into v_rls from pg_class where oid = ('public.' || t)::regclass;
    if not v_rls then
      -- جدول كان مفتوح من غير RLS: نفعّل RLS ونسمح بالوصول داخل الفريق فقط
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists team_default_access on public.%I', t);
      execute format('create policy team_default_access on public.%I for all to authenticated using ("teamId" = (select public.current_team_id())) with check ("teamId" = (select public.current_team_id()))', t);
      raise notice 'تم تفعيل RLS على جدول % (كان مقفول)', t;
    end if;

    -- السياسة التقييدية (AND مع كل السياسات الحالية)
    execute format('drop policy if exists team_isolation on public.%I', t);
    execute format('create policy team_isolation on public.%I as restrictive for all using ("teamId" = (select public.current_team_id())) with check ("teamId" = (select public.current_team_id()))', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- 3-ب) مرفقات المهام (Storage): قبل كده أي مستخدم مسجّل كان يقدر يعدّل/يحذف
--      أي ملف في bucket "task-files". دلوقتي الرفع/التعديل/الحذف مسموح بس
--      لملفات مهمة ظاهرة للمستخدم (يعني من فريقه) — اسم المجلد = رقم المهمة.
--      (القراءة بالرابط العام زي ما هي، والروابط مش قابلة للتخمين عمليًا.)
-- ------------------------------------------------------------

drop policy if exists "task_files_team_insert" on storage.objects;
create policy "task_files_team_insert" on storage.objects
  as restrictive for insert
  with check (
    bucket_id <> 'task-files'
    or exists (select 1 from public.tasks t where t.id::text = (storage.foldername(name))[1])
  );

drop policy if exists "task_files_team_update" on storage.objects;
create policy "task_files_team_update" on storage.objects
  as restrictive for update
  using (
    bucket_id <> 'task-files'
    or exists (select 1 from public.tasks t where t.id::text = (storage.foldername(name))[1])
  );

drop policy if exists "task_files_team_delete" on storage.objects;
create policy "task_files_team_delete" on storage.objects
  as restrictive for delete
  using (
    bucket_id <> 'task-files'
    or exists (select 1 from public.tasks t where t.id::text = (storage.foldername(name))[1])
  );

-- ------------------------------------------------------------
-- 4) تسجيل الأعضاء الجدد: إنشاء فريق جديد أو الانضمام بكود دعوة
--    الواجهة بتبعت team_code (انضمام) أو new_team_name (فريق جديد) داخل
--    بيانات التسجيل. التريجر ده بيشتغل بعد تريجر إنشاء المستخدم الأصلي
--    عندك (من غير ما نلمسه) وبيحدد الفريق والصلاحية.
-- ------------------------------------------------------------

create or replace function public.assign_new_user_team()
returns trigger
language plpgsql security definer set search_path = public, auth
as $$
declare
  v_meta jsonb;
  v_code text;
  v_new_name text;
  v_team public.teams;
begin
  if NEW."teamId" is not null then
    return NEW;
  end if;

  select raw_user_meta_data into v_meta from auth.users where id = NEW."authId";
  v_code     := upper(trim(coalesce(v_meta ->> 'team_code', '')));
  v_new_name := trim(coalesce(v_meta ->> 'new_team_name', ''));

  if v_new_name <> '' then
    -- مؤسس فريق جديد: يبقى سوبر أدمن في فريقه هو بس ومفعّل فورًا
    insert into public.teams (name) values (v_new_name) returning * into v_team;
    NEW."teamId"       := v_team.id;
    NEW.role           := 'admin';
    NEW.status         := 'active';
    NEW."isSuperAdmin" := true;
  elsif v_code <> '' then
    select * into v_team from public.teams where "inviteCode" = v_code;
    if not found then
      raise exception 'invalid_team_code';
    end if;
    -- منضم بكود دعوة: عضو عادي بانتظار موافقة مدير الفريق ده
    NEW."teamId"       := v_team.id;
    NEW.role           := 'member';
    NEW.status         := 'pending';
    NEW."isSuperAdmin" := false;
  else
    raise exception 'team_required';
  end if;

  return NEW;
end;
$$;

drop trigger if exists zz_assign_new_user_team on public.users;
create trigger zz_assign_new_user_team
  before insert on public.users
  for each row execute function public.assign_new_user_team();

-- ------------------------------------------------------------
-- 5) دوال الواجهة (RPC)
-- ------------------------------------------------------------

-- التحقق من كود الدعوة قبل التسجيل (متاح قبل تسجيل الدخول) — بيرجّع اسم الفريق بس
create or replace function public.check_team_code(p_code text)
returns text
language sql stable security definer set search_path = public
as $$
  select name from public.teams where "inviteCode" = upper(trim(p_code)) limit 1
$$;
grant execute on function public.check_team_code(text) to anon, authenticated;

-- اسم فريقي (لأي عضو)
create or replace function public.get_my_team()
returns json
language sql stable security definer set search_path = public
as $$
  select json_build_object('id', t.id, 'name', t.name)
  from public.teams t where t.id = public.current_team_id()
$$;
grant execute on function public.get_my_team() to authenticated;

-- إعدادات الفريق الكاملة (للمدير فقط): كود الدعوة + حالة تليجرام
create or replace function public.get_team_settings()
returns json
language plpgsql security definer set search_path = public
as $$
declare t public.teams;
begin
  if not public.is_admin() then
    raise exception 'غير مصرح لك';
  end if;
  select * into t from public.teams where id = public.current_team_id();
  if not found then raise exception 'الفريق غير موجود'; end if;

  return json_build_object(
    'id', t.id,
    'name', t.name,
    'inviteCode', t."inviteCode",
    'telegram', json_build_object(
      'connected', t."telegramChatId" is not null,
      'chatTitle', t."telegramChatTitle",
      'groupLink', t."telegramGroupLink",
      'linkedAt', t."telegramLinkedAt",
      'reportsEnabled', t."telegramReportsEnabled",
      'pendingCode', case when t."telegramConnectCode" is not null
                           and t."telegramConnectExpiresAt" > now()
                          then t."telegramConnectCode" end,
      'codeExpiresAt', case when t."telegramConnectCode" is not null
                             and t."telegramConnectExpiresAt" > now()
                            then t."telegramConnectExpiresAt" end
    )
  );
end;
$$;
grant execute on function public.get_team_settings() to authenticated;

-- تعديل اسم الفريق / رابط الجروب (للعرض فقط) / تفعيل التقرير اليومي
create or replace function public.update_team_settings(
  p_name text default null,
  p_group_link text default null,
  p_reports_enabled boolean default null
)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_link text := nullif(trim(coalesce(p_group_link, '')), '');
begin
  if not public.is_admin() then
    raise exception 'غير مصرح لك';
  end if;
  if p_name is not null and char_length(trim(p_name)) not between 2 and 60 then
    raise exception 'اسم الفريق لازم يكون من 2 لـ60 حرف';
  end if;
  if p_group_link is not null and v_link is not null
     and v_link !~* '^https://(t\.me|telegram\.me)/[A-Za-z0-9_+/-]+$' then
    raise exception 'رابط الجروب لازم يكون رابط تليجرام صحيح (https://t.me/...)';
  end if;

  update public.teams set
    name = coalesce(nullif(trim(p_name), ''), name),
    "telegramGroupLink" = case when p_group_link is null then "telegramGroupLink" else v_link end,
    "telegramReportsEnabled" = coalesce(p_reports_enabled, "telegramReportsEnabled")
  where id = public.current_team_id();

  return public.get_team_settings();
end;
$$;
grant execute on function public.update_team_settings(text, text, boolean) to authenticated;

-- تغيير كود الدعوة (لو اتسرّب): الكود القديم بيبطل فورًا
create or replace function public.regenerate_invite_code()
returns text
language plpgsql security definer set search_path = public
as $$
declare v_code text;
begin
  if not public.is_admin() then
    raise exception 'غير مصرح لك';
  end if;
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  update public.teams set "inviteCode" = v_code where id = public.current_team_id();
  return v_code;
end;
$$;
grant execute on function public.regenerate_invite_code() to authenticated;

-- كود ربط تليجرام (صالح 30 دقيقة، استخدام واحد): المدير يبعته للبوت جوه الجروب
create or replace function public.create_telegram_connect_code()
returns json
language plpgsql security definer set search_path = public
as $$
declare v_code text;
begin
  if not public.is_admin() then
    raise exception 'غير مصرح لك';
  end if;
  v_code := 'ITQAN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  update public.teams
     set "telegramConnectCode" = v_code,
         "telegramConnectExpiresAt" = now() + interval '30 minutes'
   where id = public.current_team_id();
  return json_build_object('code', v_code, 'expiresAt', now() + interval '30 minutes');
end;
$$;
grant execute on function public.create_telegram_connect_code() to authenticated;

-- فصل الجروب
create or replace function public.disconnect_telegram()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'غير مصرح لك';
  end if;
  update public.teams
     set "telegramChatId" = null, "telegramChatTitle" = null, "telegramLinkedAt" = null,
         "telegramConnectCode" = null, "telegramConnectExpiresAt" = null
   where id = public.current_team_id();
end;
$$;
grant execute on function public.disconnect_telegram() to authenticated;

-- ------------------------------------------------------------
-- 6) فحص نهائي (بيطبع تنبيهات في تبويب Messages/Notices فقط، مفيش تعديل)
-- ------------------------------------------------------------

do $$
declare r record;
begin
  -- أي جدول في public مفيهوش teamId (ممكن يكون جدول إضافي من ملفات v6..v30 عندك)
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and c.relname not in ('teams','push_subscriptions')
      and not exists (
        select 1 from pg_attribute a
        where a.attrelid = c.oid and a.attname = 'teamId' and not a.attisdropped
      )
  loop
    raise notice '⚠️ جدول بدون عزل فريق: % — لو فيه بيانات خاصة بالفريق، ضيفه في قائمة v_tables فوق وأعد التشغيل', r.relname;
  end loop;

  -- فهرس فريد على isSuperAdmin كان ممكن يمنع كل فريق يبقى له سوبر أدمن
  for r in
    select indexname, indexdef from pg_indexes
    where schemaname = 'public' and tablename = 'users'
      and indexdef ilike '%unique%' and indexdef ilike '%isSuperAdmin%'
  loop
    raise notice '⚠️ فهرس فريد على isSuperAdmin: % — لو ظهر خطأ 23505 عند إنشاء فريق جديد، احذفه (drop index)', r.indexname;
  end loop;
end $$;

-- ============================================================
-- انتهى. الخطوات اللي بعده في TEAMS_SETUP_GUIDE.md
-- ============================================================
