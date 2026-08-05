-- ============================================================
-- IT-qan — تحديث v13: السماح للسوبر أدمن بحذف حسابه هو بنفسه
--
--   قبل كده: أي حساب (حتى السوبر أدمن) كان ممنوع يحذف حسابه هو نفسه
--   نهائيًا (guard_users_delete كانت بترفض أي محاولة self-delete من
--   الأساس، وكمان كانت فيه حماية إضافية مانعة حذف أي حساب isSuperAdmin
--   خالص أيًا كان مين اللي بيحاول).
--
--   دلوقتي: السوبر أدمن يقدر يحذف حسابه هو بنفسه بشكل طبيعي، بس مع
--   حماية واحدة بسيطة: لو هو آخر "مدير" (admin) موجود في النظام كله،
--   الحذف هيترفض — عشان محدش يقفل النظام على نفسه بحيث محدش يقدر يوافق
--   على أعضاء جداد أو يدير الفريق تاني. لو فيه مدير تاني (سوبر أو عادي)،
--   الحذف هيتم عادي من غير أي عوائق.
--
--   ملحوظة: حذف صف العضو من public.users مايحذفش حساب الدخول (auth.users)
--   بتاعه تلقائيًا، فالحساب هيفضل موجود في نظام تسجيل الدخول بس بدون أي
--   بيانات ملف شخصي (زي أي عضو تاني اتحذف من قبل — نفس السلوك الموجود
--   أصلًا). لو عايز حذف حساب الدخول نفسه كمان (auth.users) محتاج Edge
--   Function بصلاحية service_role زي admin-reset-password، قولّي لو
--   عايزها.
--
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد supabase_migration_v12.sql، ولا يحذف أي بيانات)
-- ============================================================

create or replace function public.guard_users_delete()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  admin_count integer;
  is_self boolean;
begin
  is_self := (old."authId" = auth.uid());

  -- السوبر أدمن يقدر يحذف حسابه هو بنفسه — الاستثناء الوحيد على قاعدة
  -- "متقدرش تحذف حسابك"، وبشرط إنه مش آخر مدير في النظام كله
  if is_self and old."isSuperAdmin" then
    select count(*) into admin_count from public.users where role = 'admin';
    if admin_count <= 1 then
      raise exception 'لا يمكنك حذف حسابك لأنك آخر مدير في النظام — رقّي حساب آخر لمدير أولًا';
    end if;
    return old;
  end if;

  if is_self then
    raise exception 'لا يمكنك حذف حسابك الخاص';
  end if;

  if old."isSuperAdmin" then
    raise exception 'لا يمكن حذف حساب السوبر أدمن';
  end if;

  if old.role = 'admin' and not public.is_super_admin() then
    raise exception 'فقط السوبر أدمن يقدر يحذف حساب مدير';
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

-- ============================================================
-- انتهى. لازم تشغّل تحديث index.html المرفق كمان (اللي بيظهر زرار "حذف
-- حسابي" لحساب السوبر أدمن على صف نفسه في صفحة "الأعضاء") عشان
-- الميزة تظهر فعليًا في الواجهة.
-- ============================================================
