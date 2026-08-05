-- ============================================================
-- IT-qan — تحديث v7:
--   1) "سوبر أدمن": الحساب admin@itqan.com (لو موجود) ميقدرش يحذفه أو
--      يعطّله أو ينزّل صلاحيته أي حد، حتى لو مدير تاني (فوق حماية
--      "آخر مدير نشط" الموجودة أصلًا — دي حماية بالاسم/الحساب ذات نفسه،
--      حتى لو فيه مدراء تانيين كتير في نفس الوقت)
--   2) إشعار فوري داخل المنصة لما توصل رسالة شات لأي عضو (خاصة أو في
--      قناة "الفريق كله") — بيظهر في جرس الإشعارات وفي علامة جنب زرار
--      "الشات" في الواجهة
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- (يُشغَّل بعد باقي ملفات supabase_migration_*.sql، ولا يحذف أي بيانات)
-- ============================================================

-- ------------------------------------------------------------
-- 1) عمود "سوبر أدمن" + تفعيله لحساب admin@itqan.com لو موجود بالفعل
-- ------------------------------------------------------------

alter table public.users add column if not exists "isSuperAdmin" boolean not null default false;

update public.users set "isSuperAdmin" = true where email = 'admin@itqan.com';

-- ------------------------------------------------------------
-- 2) منع حذف السوبر أدمن نهائيًا (تحديث guard_users_delete الموجودة)
-- ------------------------------------------------------------

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
  if old."isSuperAdmin" then
    raise exception 'لا يمكن حذف حساب السوبر أدمن';
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

-- ------------------------------------------------------------
-- 3) منع تنزيل صلاحية السوبر أدمن أو تعطيله أو تعديل علامة السوبر أدمن
--    نفسها من الواجهة (تحديث guard_users_update الموجودة)
-- ------------------------------------------------------------

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

  if new."isSuperAdmin" is distinct from old."isSuperAdmin" then
    raise exception 'لا يمكن تعديل صلاحية السوبر أدمن من الواجهة';
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
-- 4) إشعار فوري عند وصول رسالة شات جديدة
--    - رسالة خاصة (recipientId موجود) → إشعار للمُستقبِل بس
--    - رسالة قناة "الفريق كله" (recipientId = null) → إشعار لكل الأعضاء
--      النشطين ما عدا المُرسِل نفسه
-- ------------------------------------------------------------

create or replace function public.notify_message_received()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_sender_name text;
  v_preview text;
  v_recipient record;
begin
  select name into v_sender_name from public.users where id = new."senderId";
  v_preview := left(new.content, 80);

  if new."recipientId" is not null then
    perform public.notify_user(
      new."recipientId", 'message_received',
      coalesce(v_sender_name, 'عضو') || ' أرسل لك رسالة',
      v_preview, new.id
    );
  else
    for v_recipient in
      select id from public.users
      where status = 'active' and id <> new."senderId"
    loop
      perform public.notify_user(
        v_recipient.id, 'message_received',
        coalesce(v_sender_name, 'عضو') || ' في الفريق كله',
        v_preview, new.id
      );
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_messages_notify_received on public.messages;
create trigger trg_messages_notify_received
after insert on public.messages
for each row execute function public.notify_message_received();

-- ============================================================
-- انتهى. ملاحظات:
-- 1) لو عايز حساب سوبر أدمن تاني غير admin@itqan.com، شغّل يدويًا:
--       update public.users set "isSuperAdmin" = true where email = '...';
--    (السطر ده لازم يتنفذ من SQL Editor مباشرة — مفيش زرار في الواجهة
--    لتفعيل/إلغاء السوبر أدمن، وده مقصود لحماية الحساب).
-- 2) إشعارات الرسائل بتتحذف تلقائيًا لو الرسالة الأصلية اتحذفت؟ لأ —
--    الإشعار مستقل عن الرسالة (on delete لسه موجود في notifications
--    مربوط بالعضو نفسه مش بالرسالة)، وده طبيعي زي أي نظام إشعارات.
-- ============================================================
