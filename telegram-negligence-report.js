// scripts/telegram-negligence-report.js
//
// بيبعت تقرير التقصير اليومي لكل فريق على جروب تليجرام الخاص بيه هو بس.
// كل فريق بيربط جروبه من الموقع (الإعدادات ← إعدادات الفريق ← تليجرام)،
// والسكريبت بيلف على الفرق المربوطة وبيحسب لكل فريق أعضاءه بس
// (باستخدام دالة recalc_negligence الموجودة أصلًا في قاعدة البيانات).
//
// متغيرات البيئة:
//   DATABASE_URL        - نفس رابط Supabase اللي مستخدمه في الباك إند
//   TELEGRAM_BOT_TOKEN  - توكن البوت (بوت واحد مشترك لكل الفرق)
//   TELEGRAM_CHAT_ID    - (اختياري، للترحيل فقط) رقم الجروب القديم: لو الفريق
//                         الأول لسه مش مربوط من الموقع، السكريبت هيربطه بيه مرة واحدة
//
// تشغيل يدوي للتجربة:
//   DATABASE_URL=... TELEGRAM_BOT_TOKEN=... node telegram-negligence-report.js

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const LEGACY_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!DATABASE_URL || !BOT_TOKEN) {
  console.error('❌ لازم تحط DATABASE_URL و TELEGRAM_BOT_TOKEN كمتغيرات بيئة');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function sendToTelegram(chatId, text) {
  // حد تليجرام 4096 حرف للرسالة — نقسّم على أسطر لو التقرير طويل
  const chunks = [];
  let current = '';
  for (const line of text.split('\n')) {
    if ((current + '\n' + line).length > 3800) { chunks.push(current); current = line; }
    else current = current ? current + '\n' + line : line;
  }
  if (current) chunks.push(current);

  for (const chunk of chunks) {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: chunk }),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) return data;
  }
  return { ok: true };
}

async function reportForTeam(team, today) {
  const { rows } = await pool.query(
    `select u.name, public.recalc_negligence(u.id) as days
       from public.users u
      where u.status = 'active' and u."teamId" = $1
      order by days desc, u.name asc`,
    [team.id]
  );

  const negligent = rows
    .map(r => ({ name: r.name, days: Number(r.days) }))
    .filter(r => r.days > 0);

  let message;
  if (negligent.length === 0) {
    message = `✅ تقرير التقصير اليومي — ${team.name} — ${today}\n\nمفيش أي عضو مقصّر النهاردة، الحمد لله 🎉`;
  } else {
    const lines = negligent.map(r => `• ${r.name} — ${r.days} يوم تقصير`);
    message = `⚠️ تقرير التقصير اليومي — ${team.name} — ${today} (${negligent.length} عضو)\n\n${lines.join('\n')}`;
  }

  const result = await sendToTelegram(team.telegramChatId, message);

  if (!result.ok) {
    console.error(`❌ فشل الإرسال لفريق "${team.name}" (#${team.id}):`, result.description || result);
    // البوت اتشال من الجروب أو الجروب اتمسح → نفصل الربط عشان المدير يعرف يعيده
    if ([400, 403].includes(result.error_code)) {
      await pool.query(
        `update public.teams
            set "telegramChatId" = null, "telegramChatTitle" = null, "telegramLinkedAt" = null
          where id = $1`,
        [team.id]
      );
      console.error(`   ↳ تم فصل ربط تليجرام للفريق #${team.id} (يحتاج إعادة ربط من الإعدادات)`);
    }
    return false;
  }

  console.log(`✅ اتبعت تقرير فريق "${team.name}" (#${team.id})`);
  return true;
}

async function main() {
  // ترحيل لمرة واحدة: ربط الجروب القديم بالفريق الأول لو لسه مش مربوط
  if (LEGACY_CHAT_ID) {
    await pool.query(
      `update public.teams
          set "telegramChatId" = $1, "telegramLinkedAt" = now()
        where id = (select min(id) from public.teams)
          and "telegramChatId" is null
          and not exists (select 1 from public.teams where "telegramChatId" = $1)`,
      [LEGACY_CHAT_ID]
    );
  }

  const { rows: teams } = await pool.query(
    `select id, name, "telegramChatId"
       from public.teams
      where "telegramChatId" is not null and "telegramReportsEnabled" = true
      order by id`
  );

  if (teams.length === 0) {
    console.log('مفيش أي فريق مربوط بجروب تليجرام ومفعّل عنده التقرير اليومي.');
    await pool.end();
    return;
  }

  const today = new Date().toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' });

  let failed = 0;
  for (const team of teams) {
    try {
      if (!(await reportForTeam(team, today))) failed++;
    } catch (err) {
      failed++;
      console.error(`❌ خطأ في فريق #${team.id}:`, err.message);
    }
  }

  await pool.end();
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('❌ خطأ:', err);
  process.exit(1);
});
