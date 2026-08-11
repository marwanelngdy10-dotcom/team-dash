-- ============================================================
-- IT-qan — تحديث v26:
--   1) أقسام وفروع للكورسات: قسم يُختار من قائمة (المدير يقدر يضيف
--      أقسام جديدة)، وفرع نص حر يكتبه المدير بنفسه لكل كورس
--      (مثال: التسويق ← SEO / التسويق الإلكتروني).
--   2) تعديل يدوي تراكمي لأيام التقصير (من 0 إلى 6) — مقصور على
--      السوبر أدمن بس، بزرار "+" و"-" بسيطين بجانب كل عضو.
--
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد باقي ملفات supabase_migration_*.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- 1) جدول "أقسام الكورسات" — قائمة يختار المدير منها، ويقدر يضيف
--    قسم جديد فيها من الواجهة على طول (بدون داعي لـ SQL Editor)
-- ------------------------------------------------------------

create table if not exists public.course_categories (
  id serial primary key,
  title text not null,
  "order" integer not null default 0,
  "createdAt" timestamptz not null default now()
);

-- تأكيد إن جدول courses موجود بنفس الشكل البسيط المستخدم فعليًا في
-- الواجهة الحالية (عنوان + رابط) — لو موجود بالفعل مش هيتأثر خالص
create table if not exists public.courses (
  id serial primary key,
  title text not null check (char_length(trim(title)) > 0),
  url text not null check (char_length(trim(url)) > 0),
  "order" integer not null default 0,
  "createdBy" integer references public.users(id) on delete set null,
  "createdAt" timestamptz not null default now()
);

-- الأعمدة الجديدة: القسم (رابط لجدول الأقسام) والفرع (نص حر)
alter table public.courses add column if not exists "categoryId" integer references public.course_categories(id) on delete set null;
alter table public.courses add column if not exists "branch" text;

create index if not exists idx_courses_categoryId on public.courses("categoryId");

-- تعبئة أولية للأقسام الشائعة (لو الجدول لسه فاضي بس) — المدير يقدر
-- يضيف/يمسح غيرها براحته من بعد كده من الواجهة
insert into public.course_categories (title, "order")
select v.title, v.ord
from (values
  ('E-Marketing', 1),
  ('UI/UX', 2),
  ('Montage', 3),
  ('Programming', 4),
  ('graphic', 5),
  ('English', 6)
) as v(title, ord)
where not exists (select 1 from public.course_categories);

alter table public.course_categories enable row level security;
alter table public.courses enable row level security;

-- القراءة: أي عضو نشط (زي باقي صفحة الكورسات تمامًا)
drop policy if exists "course_categories_select" on public.course_categories;
create policy "course_categories_select" on public.course_categories
  for select using (public.is_active_user());

-- الكتابة (إضافة/تعديل/حذف قسم): أي مدير نشط (سوبر أو عادي) — زي باقي
-- صلاحيات الكتابة على صفحة الكورسات بالظبط
drop policy if exists "course_categories_write" on public.course_categories;
create policy "course_categories_write" on public.course_categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "courses_select" on public.courses;
create policy "courses_select" on public.courses
  for select using (public.is_active_user());

drop policy if exists "courses_write" on public.courses;
create policy "courses_write" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.course_categories, public.courses to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ------------------------------------------------------------
-- 2) تعديل يدوي تراكمي لأيام التقصير — عمود جديد يضاف على نتيجة
--    الحساب الأوتوماتيكي (recalc_negligence)، مش بديل عنه
-- ------------------------------------------------------------

alter table public.users add column if not exists "negligenceManualAdjustment" integer not null default 0;

-- حماية العمود: ميتغيرش إلا عن طريق دالتي increase/decrease تحت، أو
-- مباشرة من السوبر أدمن — نفس أسلوب حماية negligenceExempt من v15
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

  if new.role = 'admin' and old.role is distinct from new.role and not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يمنح صلاحية مدير';
  end if;

  if new."isSuperAdmin" is distinct from old."isSuperAdmin" and not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يمنح/يسحب صلاحية سوبر أدمن';
  end if;

  if new."negligenceExempt" is distinct from old."negligenceExempt" and not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يستثني حسابًا من احتساب التقصير';
  end if;

  -- جديد في v26: تعديل التقصير اليدوي مقصور على السوبر أدمن بس
  if new."negligenceManualAdjustment" is distinct from old."negligenceManualAdjustment" and not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يعدّل أيام التقصير يدويًا';
  end if;

  if old."authId" = auth.uid() and new.status = 'disabled' then
    raise exception 'لا يمكنك تعطيل حسابك الخاص';
  end if;

  if old."isSuperAdmin" and new.role <> 'admin' then
    raise exception 'لا يمكن إزالة صلاحية مدير السوبر أدمن';
  end if;

  if old."isSuperAdmin" and new.status <> 'active' then
    raise exception 'لا يمكن تعطيل حساب السوبر أدمن';
  end if;

  if old.role = 'admin' and new.status is distinct from old.status and not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يعطّل/يفعّل حساب مدير';
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

-- ------------------------------------------------------------
-- 3) recalc_negligence: نفس آخر نسخة (v24: فيها إجازة الجمعة + الأيام
--    الملغاة يدويًا) + إضافة واحدة بس — إضافة "negligenceManualAdjustment"
--    على النتيجة النهائية، مع حصر الناتج بين 0 و6 دايمًا
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
  v_manual integer;
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
  select "createdAt", status, "isSuperAdmin", "negligenceExempt",
         coalesce("negligenceManualAdjustment", 0), "reactivatedAt"::date
    into v_created, v_status, v_is_super, v_exempt, v_manual, v_reactivated
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
    if extract(dow from v_day) = 5 then
      v_day := v_day + 1;
      continue;
    end if;

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

  -- جديد في v26: التعديل اليدوي بتاع السوبر أدمن يتضاف على الناتج
  -- الأوتوماتيكي، والنتيجة النهائية محصورة دايمًا بين 0 و6
  v_negligent := least(6, greatest(0, v_negligent + v_manual));

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
-- 4) دالتي الزيادة/النقصان — السوبر أدمن بس (دفاع مزدوج جوه الدالة
--    نفسها فوق RLS)، تراكمي (+1/-1 كل مرة)، وترجّع العدّ الجديد فورًا
-- ------------------------------------------------------------

create or replace function public.increase_negligence(p_user_id integer)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_current integer;
begin
  if not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يزوّد أيام التقصير يدويًا';
  end if;

  select coalesce("negligenceManualAdjustment", 0) into v_current
    from public.users where id = p_user_id;

  if v_current is null then
    raise exception 'العضو غير موجود';
  end if;

  update public.users
    set "negligenceManualAdjustment" = least(6, v_current + 1)
    where id = p_user_id;

  return public.recalc_negligence(p_user_id);
end;
$$;

create or replace function public.decrease_negligence(p_user_id integer)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_current integer;
begin
  if not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر ينقّص أيام التقصير يدويًا';
  end if;

  select coalesce("negligenceManualAdjustment", 0) into v_current
    from public.users where id = p_user_id;

  if v_current is null then
    raise exception 'العضو غير موجود';
  end if;

  update public.users
    set "negligenceManualAdjustment" = greatest(-6, v_current - 1)
    where id = p_user_id;

  return public.recalc_negligence(p_user_id);
end;
$$;

grant execute on function public.increase_negligence(integer) to authenticated;
grant execute on function public.decrease_negligence(integer) to authenticated;

-- ============================================================
-- انتهى. ملاحظات:
--
-- 1) التعديل اليدوي (negligenceManualAdjustment) طبقة إضافية فوق
--    الحساب الأوتوماتيكي، مش بديل عنه — يعني لو عضو عليه 3 أيام تقصير
--    فعلي والسوبر أدمن زوّد مرتين، العدّ الظاهر هيبقى 5 (لسه بيتحدّث
--    عادي لو العضو سجّل/فوّت تقارير بعد كده). لو السوبر أدمن استثنى
--    الحساب بالكامل (negligenceExempt) العدّ بيفضل صفر بغض النظر عن
--    أي تعديل يدوي.
--
-- 2) الحد الأقصى/الأدنى للعدّ النهائي دايمًا 0-6 (زي المطلوب)، حتى لو
--    التعديل اليدوي نفسه بلغ +6 أو -6.
--
-- 3) لازم تشغّل تحديث index.html المرفق كمان — هو اللي بيضيف:
--    - زرار "+" و"−" بجانب عمود "التقصير" في صفحة "الأعضاء" (يظهر
--      للسوبر أدمن بس، زي أي إجراء حساس تاني في الصفحة).
--    - اختيار "القسم" (من قائمة قابلة للإضافة) وحقل "الفرع" (نص حر)
--      عند إضافة/تعديل أي كورس في صفحة "الكورسات".
-- ============================================================
