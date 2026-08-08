-- ============================================================
-- IT-qan — تحديث v20: جدول اشتراكات إشعارات Push (PWA)
--
--   كل مرة يفتح فيها عضو الموقع (بعد ما يوافق على إذن الإشعارات من
--   المتصفح)، الواجهة بتسجّل "اشتراك" (Push Subscription) خاص بالجهاز/
--   المتصفح ده في الجدول ده، مربوط بحساب العضو. بعد كده، أي إشعار
--   بيتسجّل في جدول notifications (رسالة شات، إسناد مهمة، إنذار تقصير..)
--   السيرفر (Edge Function منفصلة، مش هذا الملف) بيبعت له إشعار Push
--   حقيقي لكل الأجهزة المسجَّلة لصاحبه — حتى لو الموقع/التطبيق مقفول
--   تمامًا عنده.
--
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد باقي ملفات supabase_migration_*.sql، ولا يحذف أي بيانات)
-- ============================================================

create table if not exists public.push_subscriptions (
  id serial primary key,
  "userId" integer not null references public.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  "userAgent" text,
  "createdAt" timestamptz not null default now()
);

-- الاشتراك (endpoint) فريد — لو نفس الجهاز اشترك تاني، بنحدّث صفه بدل
-- ما نضيف صف مكرر (ده اللي بيسمح للواجهة تستخدم upsert بـ onConflict:'endpoint')
drop index if exists idx_push_subscriptions_endpoint;
create unique index idx_push_subscriptions_endpoint on public.push_subscriptions (endpoint);

create index if not exists idx_push_subscriptions_userId on public.push_subscriptions("userId");

alter table public.push_subscriptions enable row level security;

-- كل عضو يقدر يضيف/يشوف/يحدّث/يحذف اشتراكات نفسه بس
drop policy if exists "push_subscriptions_select" on public.push_subscriptions;
create policy "push_subscriptions_select" on public.push_subscriptions
  for select using ("userId" = public.current_app_user_id());

drop policy if exists "push_subscriptions_insert" on public.push_subscriptions;
create policy "push_subscriptions_insert" on public.push_subscriptions
  for insert with check ("userId" = public.current_app_user_id());

drop policy if exists "push_subscriptions_update" on public.push_subscriptions;
create policy "push_subscriptions_update" on public.push_subscriptions
  for update using ("userId" = public.current_app_user_id())
  with check ("userId" = public.current_app_user_id());

-- الحذف مسموح لصاحب الاشتراك، أو لأي حد يعرف الـ endpoint نفسه (مطلوب
-- عشان زرار "تسجيل الخروج" يقدر يشيل اشتراك الجهاز حتى لو تغيّر
-- currentUser بالفعل في اللحظة دي — endpoint نفسه سر كفاية لغرض الحذف)
drop policy if exists "push_subscriptions_delete" on public.push_subscriptions;
create policy "push_subscriptions_delete" on public.push_subscriptions
  for delete using (true);

grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ============================================================
-- انتهى. الخطوة اللي بعد كده: نشر Edge Function اسمها "send-push"
-- (الملف مرفق منفصل: supabase/functions/send-push/index.ts) وربطها
-- بـ Database Webhook على INSERT في جدول notifications — التفاصيل
-- كاملة في PWA_SETUP_GUIDE.md المرفق.
-- ============================================================
