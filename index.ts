// supabase/functions/telegram-webhook/index.ts
//
// بيستقبل رسائل البوت من تليجرام (Webhook). وظيفته الوحيدة: ربط جروب تليجرام
// بفريق معيّن، لما مدير الفريق يبعت جوه الجروب:
//
//      /connect@اسم_البوت ITQAN-XXXXXXXX
//
// (بنستخدم الصيغة اللي فيها @اسم_البوت لأن تليجرام بيضمن توصيلها للبوت حتى
//  لو وضع الخصوصية (Privacy Mode) شغال في الجروب.)
//
// الكود ده بيتولّد من إعدادات الفريق في الموقع (صالح 30 دقيقة، استخدام واحد).
// بالطريقة دي البوت يعرف رقم الجروب (chat_id) الحقيقي، وبنتأكد إن اللي ربطه
// فعلًا معاه كود فريقه — مفيش حد يقدر يربط جروب بفريق مش بتاعه.
//
// النشر:   supabase functions deploy telegram-webhook --no-verify-jwt
// (--no-verify-jwt ضروري لأن تليجرام مابيبعتش توكن Supabase؛ الحماية بتتم
//  بالـ secret token تحت.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function reply(chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(() => {});
}

Deno.serve(async (req) => {
  // تليجرام بيبعت الـ secret ده في هيدر مخصوص لو سجّلناه وقت setWebhook
  if (req.headers.get("x-telegram-bot-api-secret-token") !== WEBHOOK_SECRET) {
    return new Response("forbidden", { status: 403 });
  }
  if (req.method !== "POST") return new Response("ok");

  const update = await req.json().catch(() => null);
  const msg = update?.message;
  if (!msg) return new Response("ok"); // أي تحديث تاني نتجاهله بهدوء

  const chatId = msg.chat?.id;
  if (chatId === undefined) return new Response("ok");

  // الجروب اتحوّل لـ supergroup → رقمه بيتغير، نحدّث الفريق المرتبط بيه
  if (msg.migrate_to_chat_id) {
    await admin
      .from("teams")
      .update({ telegramChatId: String(msg.migrate_to_chat_id) })
      .eq("telegramChatId", String(chatId));
    return new Response("ok");
  }

  const text: string = (msg.text || "").trim();

  // /start في محادثة خاصة: تعليمات سريعة
  if (/^\/start(@\w+)?(\s|$)/i.test(text) && msg.chat.type === "private") {
    await reply(
      chatId,
      "أهلًا 👋\nأنا بوت IT_qan لإرسال تقارير الفريق.\n\nللربط: ضيفني لجروب فريقك، وبعدها ابعت جوه الجروب:\n/connect@اسم_البوت كود-الربط\n(الكود بتجيبه من الموقع: الإعدادات ← إعدادات الفريق ← تليجرام)",
    );
    return new Response("ok");
  }

  const m = text.match(/^\/connect(?:@\w+)?\s+([A-Za-z0-9-]+)/i);
  if (!m) return new Response("ok");

  if (msg.chat.type === "private") {
    await reply(chatId, "⚠️ ابعت أمر الربط جوه جروب الفريق نفسه، مش هنا في المحادثة الخاصة.");
    return new Response("ok");
  }

  const code = m[1].toUpperCase();
  const { data: team } = await admin
    .from("teams")
    .select("id, name, telegramConnectExpiresAt")
    .eq("telegramConnectCode", code)
    .maybeSingle();

  if (!team || !team.telegramConnectExpiresAt || new Date(team.telegramConnectExpiresAt) < new Date()) {
    await reply(chatId, "❌ كود الربط غير صحيح أو منتهي. ولّد كود جديد من إعدادات الفريق في الموقع.");
    return new Response("ok");
  }

  const { error } = await admin
    .from("teams")
    .update({
      telegramChatId: String(chatId),
      telegramChatTitle: msg.chat.title || null,
      telegramLinkedAt: new Date().toISOString(),
      telegramConnectCode: null,
      telegramConnectExpiresAt: null,
    })
    .eq("id", team.id);

  if (error) {
    // غالبًا الجروب ده مربوط بفريق تاني (فهرس فريد على telegramChatId)
    await reply(chatId, "❌ تعذّر الربط: الجروب ده غالبًا مربوط بفريق آخر بالفعل.");
    return new Response("ok");
  }

  await reply(
    chatId,
    `✅ تم ربط الجروب بفريق «${team.name}».\nهتوصل هنا تقارير الفريق تلقائيًا. 🎉`,
  );
  return new Response("ok");
});
