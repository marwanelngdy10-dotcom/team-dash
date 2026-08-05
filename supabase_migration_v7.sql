-- ============================================================
-- IT-qan — تحديث v7: إشعار داخل المنصة عند وصول رسالة جديدة في الشات
--   - رسالة خاصة: إشعار للمُستقبِل فقط، بعنوان فيه اسم المُرسِل ونص
--     الرسالة كاملاً في جسم الإشعار (بدون أي اقتصاص)
--   - رسالة في قناة "الفريق كله": إشعار لكل الأعضاء النشطين ما عدا
--     المُرسِل نفسه
--   الإشعار ده هو اللي بيغذّي جرس الإشعارات (وشارة العدّاد جنبه) في
--   الواجهة — والواجهة كمان بتعمل رنة صوتية + Toast فوري + إشعار متصفح
--   لحظي أول ما الرسالة توصل (تعديل من ملف index.html، مش من هنا).
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد باقي ملفات supabase_migration_*.sql، ولا يحذف أي بيانات)
-- ============================================================

create or replace function public.notify_new_message()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_sender_name text;
  v_recipient record;
begin
  select name into v_sender_name from public.users where id = new."senderId";

  if new."recipientId" is not null then
    -- رسالة خاصة: إشعار للمستقبل بس
    perform public.notify_user(
      new."recipientId", 'message_received',
      'رسالة خاصة جديدة من ' || coalesce(v_sender_name, 'عضو محذوف'),
      new.content, new."senderId"
    );
  else
    -- رسالة في قناة "الفريق كله": إشعار لكل الأعضاء النشطين ما عدا المرسل
    -- (ملحوظة: لو الفريق كبر جدًا وحسّيت إن ده بيعمل صفوف كتير في جدول
    --  notifications، ينفع تلغي الجزء ده وتسيب إشعارات الرسائل الخاصة بس)
    for v_recipient in
      select id from public.users
      where status = 'active' and id <> new."senderId"
    loop
      perform public.notify_user(
        v_recipient.id, 'message_received',
        coalesce(v_sender_name, 'عضو') || ' في الفريق كله',
        new.content, new."senderId"
      );
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_messages_notify on public.messages;
create trigger trg_messages_notify
after insert on public.messages
for each row execute function public.notify_new_message();

-- ============================================================
-- انتهى. ملاحظة: دالة notify_user وجدول notifications وسياسات RLS
-- بتاعتهم اتعملوا بالفعل في supabase_migration_v6.sql — الملف ده بيضيف
-- بس التريجر اللي بيولّد إشعار "رسالة جديدة" تلقائيًا عند أي INSERT
-- في جدول messages.
-- ============================================================
