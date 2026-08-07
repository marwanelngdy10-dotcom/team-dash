// scripts/telegram-negligence-report.js
//
// بيجيب أيام التقصير لكل عضو نشط (باستخدام دالة recalc_negligence
// الموجودة أصلًا في قاعدة البيانات) وبيبعت تقرير يومي على جروب تليجرام.
//
// محتاج 3 متغيرات بيئة (Environment Variables):
//   DATABASE_URL        - نفس رابط Supabase اللي مستخدمه في الباك إند
//   TELEGRAM_BOT_TOKEN   - توكن البوت من BotFather
//   TELEGRAM_CHAT_ID     - آي دي الجروب (شوف تعليمات الإعداد تحت)
//
// تشغيل يدوي محلي (للتجربة):
//   DATABASE_URL=... TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... node telegram-negligence-report.js

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!DATABASE_URL || !BOT_TOKEN || !CHAT_ID) {
  console.error('❌ لازم تحط DATABASE_URL و TELEGRAM_BOT_TOKEN و TELEGRAM_CHAT_ID كمتغيرات بيئة');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  // recalc_negligence بترجع عدد أيام التقصير لكل عضو، وبتستثني تلقائيًا
  // السوبر أدمن وأي حساب معلّم negligenceExempt (نفس منطق التطبيق بالظبط)
  const { rows } = await pool.query(`
    select u.name, public.recalc_negligence(u.id) as days
    from public.users u
    where u.status = 'active'
    order by days desc, u.name asc;
  `);

  const negligent = rows
    .map(r => ({ name: r.name, days: Number(r.days) }))
    .filter(r => r.days > 0);

  const today = new Date().toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' });

  let message;
  if (negligent.length === 0) {
    message = `✅ تقرير التقصير اليومي — ${today}\n\nمفيش أي عضو مقصّر النهاردة، الحمد لله 🎉`;
  } else {
    const lines = negligent.map(r => `• ${r.name} — ${r.days} يوم تقصير`);
    message = `⚠️ تقرير التقصير اليومي — ${today} (${negligent.length} عضو)\n\n${lines.join('\n')}`;
  }

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error('❌ فشل إرسال الرسالة لتليجرام:', data);
    process.exit(1);
  }

  console.log('✅ اتبعت التقرير بنجاح');
  await pool.end();
}

main().catch(err => {
  console.error('❌ خطأ:', err);
  process.exit(1);
});
