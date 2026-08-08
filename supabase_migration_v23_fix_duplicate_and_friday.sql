-- ============================================================
-- IT-qan — تحديث v23: توحيد الجدولة (رسالة واحدة بس يوميًا) + تغيير
--   الميعاد لـ 5 مساءً بدل 4 عصرًا + استثناء يوم الجمعة بالكامل
--
--   المشكلة اللي بيحلها الملف ده:
--   كان فيه جوبين شغالين مع بعض (v20 القديم اللي بيحسب بتوقيت UTC،
--   وv22 اللي بيحسب بتوقيت القاهرة الحقيقي) — عشان كده كانت بتوصل
--   رسالتين في نفس اليوم (4 و5). الملف ده بيلغي أي جوب قديم بأي اسم
--   محتمل، ويسيب جوب واحد بس.
--
-- الصق هذا الملف كامل في: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ------------------------------------------------------------
-- 1) إلغاء كل الجوبات القديمة المحتملة (v20 وv22) — عشان نضمن
--    مفيش أي تكرار أو رسالتين في اليوم
-- ------------------------------------------------------------

select cron.unschedule(jobid)
  from cron.job
 where jobname in (
   'telegram-negligence-daily',        -- اسم جوب v20
   'telegram-negligence-cairo-aware'   -- اسم جوب v22
 );

-- ------------------------------------------------------------
-- 2) تعديل دالة القرار: الميعاد بقى 5 مساءً (مش 4 عصرًا)، وبقت
--    كمان بترجع فورًا من غير إرسال لو اليوم اللي هيتقفل هو يوم جمعة
-- ------------------------------------------------------------

create or replace function public.maybe_send_daily_negligence_report()
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_cutoff time := time '17:00';   -- 5 مساءً بتوقيت القاهرة (بدل 4 عصرًا)
  v_day date;
  v_already boolean;
  v_dow int;   -- 0=أحد, 1=اتنين, ... 5=جمعة, 6=سبت
begin
  -- لسه ما وصلناش 5 مساءً بتوقيت مصر النهاردة؟ سيب المهمة، تعالى بعد 5 دقايق
  if current_time < v_cutoff then
    return;
  end if;

  v_day := current_date - 1;

  -- لو اليوم اللي هيتقفل (امبارح) كان يوم جمعة، منبعتش تقرير خالص عنه
  v_dow := extract(dow from v_day);
  if v_dow = 5 then
    return;
  end if;

  select exists(
    select 1 from public.telegram_negligence_reports_sent where report_date = v_day
  ) into v_already;

  -- اتبعت قبل كده النهاردة؟ ولا داعي نكلّف نفسنا بمناداة البوت تاني
  if v_already then
    return;
  end if;

  perform net.http_post(
    url := 'https://pkpeglpoyeeiaobfoqnv.supabase.co/functions/v1/telegram-negligence-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '123456789@Mm'
    ),
    body := '{}'::jsonb
  );
end;
$$;

revoke all on function public.maybe_send_daily_negligence_report() from public, authenticated, anon;

-- ------------------------------------------------------------
-- 3) جدولة واحدة بس: كل 5 دقايق طول اليوم (نفس فكرة v22 — الدالة
--    نفسها هي اللي بتقرر تبعت ولا لأ، مش الـ cron)
-- ------------------------------------------------------------

select cron.schedule(
  'telegram-negligence-cairo-aware',
  '*/5 * * * *',
  $$ select public.maybe_send_daily_negligence_report(); $$
);

-- ============================================================
-- بعد التشغيل تأكد إن عندك جوب واحد بس شغال، بالأمر ده:
--
--   select jobid, jobname, schedule from cron.job;
--
-- المفروض تشوف صف واحد بس باسم 'telegram-negligence-cairo-aware'.
-- لو شفت أي صف تاني باسم مختلف (زي telegram-negligence-daily أو أي
-- اسم قديم تاني)، ابعتلي اسمه وهنلغيه يدويًا.
--
-- اختبار فوري (بيتجاهل شرط الوقت لأنه بينفذ الدالة مباشرة، لكنه
-- برضه هيتجاهل يوم الجمعة ومنع التكرار):
--   select public.maybe_send_daily_negligence_report();
-- ============================================================
