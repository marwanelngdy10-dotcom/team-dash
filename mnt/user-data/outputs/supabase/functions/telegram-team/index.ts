// supabase/functions/telegram-team/index.ts
//
// بيتنادى من الموقع (من إعدادات الفريق) لعمليات تليجرام اللي محتاجة توكن البوت
// السري — اللي مايتحطش في المتصفح أبدًا. مسموح بيه لمدير الفريق بس، ودايمًا
// على جروب فريقه هو (مش فريق تاني).
//
//   action: "test"  → يبعت رسالة تجربة لجروب الفريق للتأكد إن الربط شغال
//
// النشر:   supabase functions deploy telegram-team

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
  if (!token) return json({ error: "غير مسجل الدخول" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: authData, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !authData?.user) return json({ error: "جلسة غير صالحة" }, 401);

  const { data: caller } = await admin
    .from("users")
    .select("role, status, teamId")
    .eq("authId", authData.user.id)
    .single();

  if (!caller || caller.role !== "admin" || caller.status !== "active" || !caller.teamId) {
    return json({ error: "غير مصرح لك — العملية دي لمديري الفريق فقط" }, 403);
  }

  const body = await req.json().catch(() => ({}));

  if (body.action === "test") {
    const { data: team } = await admin
      .from("teams")
      .select("name, telegramChatId")
      .eq("id", caller.teamId)
      .single();

    if (!team?.telegramChatId) return json({ error: "الفريق غير مربوط بجروب تليجرام" }, 400);

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: team.telegramChatId,
        text: `✅ رسالة تجربة من IT_qan — فريق «${team.name}»\nالربط شغال تمام.`,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) {
      return json({
        error: "تليجرام رفض الإرسال: تأكد إن البوت لسه موجود في الجروب وعنده صلاحية الإرسال",
      }, 502);
    }
    return json({ message: "تم إرسال رسالة التجربة للجروب" }, 200);
  }

  return json({ error: "إجراء غير معروف" }, 400);
});
