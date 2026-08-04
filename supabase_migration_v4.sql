-- ============================================================
-- IT-qan — تحديث v4: نظام تواصل الفريق (شات جماعي + رسائل خاصة)
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد باقي ملفات supabase_migration_*.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- جدول الرسائل
--   "recipientId" = NULL  → رسالة في قناة "الفريق كله" (يشوفها الجميع)
--   "recipientId" = رقم عضو → رسالة خاصة، يشوفها المُرسِل والمُستقبِل بس
-- ------------------------------------------------------------

create table if not exists public.messages (
  id serial primary key,
  "senderId" integer not null references public.users(id) on delete cascade,
  "recipientId" integer references public.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  "createdAt" timestamptz not null default now()
);

create index if not exists idx_messages_recipientId on public.messages("recipientId");
create index if not exists idx_messages_senderId on public.messages("senderId");
create index if not exists idx_messages_createdAt on public.messages("createdAt");

alter table public.messages enable row level security;

-- كل عضو يشوف: رسائل قناة "الفريق كله" + أي رسالة هو طرف فيها (مرسل أو مستقبل)
-- ملحوظة: حتى المدير مايشوفش رسائل خاصة بين عضوين تانيين — خصوصية المحادثات الفردية محفوظة
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select using (
    "recipientId" is null
    or "senderId" = public.current_app_user_id()
    or "recipientId" = public.current_app_user_id()
  );

-- أي عضو نشط يقدر يرسل باسمه هو بس
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert with check ("senderId" = public.current_app_user_id());

-- صاحب الرسالة يقدر يحذفها، والمدير يقدر يحذف أي رسالة للمراقبة (بدون الحاجة لقراءتها مسبقًا)
drop policy if exists "messages_delete" on public.messages;
create policy "messages_delete" on public.messages
  for delete using ("senderId" = public.current_app_user_id() or public.is_admin());

grant select, insert, delete on public.messages to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ============================================================
-- انتهى. صفحة "الشات" في الواجهة (index.html) تعتمد على هذا الجدول
-- — لازم تشغّل هذا الملف قبل استخدام الصفحة.
-- ============================================================
