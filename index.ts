// supabase/functions/task-followup-bot/index.ts
//
// بوت متابعة المهام على تليجرام. بيشتغل على جروب الفريق المربوط أصلًا
// (نفس ربط "تقارير تليجرام")، ومن غير أي توكن جديد.
//
// بيعمل 3 حاجات حسب إعدادات الفريق (الإعدادات ← بوت متابعة المهام):
//   1) إعلان فوري في الجروب لما مهمة تتوكّل لعضو (أو تتحوّل لعضو تاني)
//   2) تذكير يومي قبل موعد التسليم بعدد أيام يحددها المدير + تنبيه يوم الموعد
//   3) متابعة المهام المتأخرة كل X يوم لحد ما تتقفل
// الرسائل اليومية بتتجمّع في رسالة واحدة للفريق (مش رسالة لكل مهمة).
//
// طريقتين للنداء:
//   action: "cron"    → من pg_cron كل 15 دقيقة، بمفتاح service role (كل الفرق)
//   action: "run_now" → من زرار الإعدادات، بتوكن مدير الفريق (فريقه بس)
//
// النشر:   supabase functions deploy task-followup-bot --no-verify-jwt
//   (--no-verify-jwt لأن الدالة بتتحقق بنفسها: مفتاح service role للجدولة، أو
//    جلسة مدير فعلية لزرار "شغّل دلوقتي")
// بتستخدم نفس السر: TELEGRAM_BOT_TOKEN

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const TZ = "Africa/Cairo";

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

// تاريخ وساعة القاهرة الحاليين
function cairoNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

function dayDiff(fromYmd: string, toYmd: string) {
  const a = Date.parse(fromYmd + "T00:00:00Z");
  const b = Date.parse(toYmd + "T00:00:00Z");
  return Math.round((b - a) / 86400000);
}

async function sendTelegram(chatId: string, text: string) {
  // حد تليجرام 4096 حرف — نقسّم على أسطر
  const chunks: string[] = [];
  let cur = "";
  for (const line of text.split("\n")) {
    if ((cur + "\n" + line).length > 3800) { chunks.push(cur); cur = line; }
    else cur = cur ? cur + "\n" + line : line;
  }
  if (cur) chunks.push(cur);

  for (const chunk of chunks) {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: chunk }),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) return { ok: false, error: data.description || "telegram error" };
  }
  return { ok: true as const };
}

type Task = {
  id: number; title: string; dueDate: string | null; assignedTo: number;
  priority: string | null; createdAt: string;
};

async function runTeam(admin: any, team: any, force: boolean) {
  const now = cairoNow();
  const result = { teamId: team.id, announced: 0, digestItems: 0, skipped: "" as string, error: "" as string };

  const [{ data: tasksRaw }, { data: users }] = await Promise.all([
    admin.from("tasks")
      .select("id, title, dueDate, assignedTo, priority, createdAt")
      .eq("teamId", team.id).neq("status", "مكتملة"),
    admin.from("users").select("id, name, status").eq("teamId", team.id),
  ]);
  const nameOf = new Map<number, string>((users || []).filter((u: any) => u.status === "active").map((u: any) => [u.id, u.name]));
  const tasks: Task[] = (tasksRaw || []).filter((t: Task) => nameOf.has(t.assignedTo));
  if (tasks.length === 0) { result.skipped = "no open tasks"; return result; }

  const { data: logsRaw } = await admin
    .from("task_bot_log").select("taskId, kind, assignedTo, sentOn")
    .eq("teamId", team.id).in("taskId", tasks.map((t) => t.id));
  const logs = logsRaw || [];

  // أول تشغيل للفريق: نسجّل المهام الموجودة كـ "اتعلنت" من غير ما نبعت (عشان مانغرقش الجروب)
  if (logs.length === 0) {
    const cutoff = Date.now() - 60 * 60 * 1000;
    const baseline = tasks.filter((t) => Date.parse(t.createdAt) < cutoff)
      .map((t) => ({ teamId: team.id, taskId: t.id, kind: "assigned", assignedTo: t.assignedTo }));
    if (baseline.length) {
      await admin.from("task_bot_log").insert(baseline);
      for (const b of baseline) logs.push({ taskId: b.taskId, kind: "assigned", assignedTo: b.assignedTo, sentOn: now.date });
    }
  }

  // ---- 1) إعلان التوكيل ----
  if (team.taskBotAnnounceAssign) {
    for (const t of tasks) {
      const done = logs.some((l: any) => l.taskId === t.id && l.kind === "assigned" && l.assignedTo === t.assignedTo);
      if (done) continue;
      const due = t.dueDate ? t.dueDate : "غير محدد";
      const text =
        `📌 مهمة جديدة اتوكّلت\n` +
        `👤 ${nameOf.get(t.assignedTo)}\n` +
        `📝 ${t.title}\n` +
        `📅 الموعد: ${due}` + (t.priority ? `\n⚡ الأولوية: ${t.priority}` : "");
      const r = await sendTelegram(team.telegramChatId, text);
      if (!r.ok) { result.error = r.error!; return result; }
      await admin.from("task_bot_log").insert({ teamId: team.id, taskId: t.id, kind: "assigned", assignedTo: t.assignedTo });
      logs.push({ taskId: t.id, kind: "assigned", assignedTo: t.assignedTo, sentOn: now.date });
      result.announced++;
    }
  }

  // ---- 2 + 3) المتابعة اليومية (رسالة واحدة مجمّعة) ----
  if (!force && now.hour < team.taskBotHour) { result.skipped = "before daily hour"; return result; }

  const overdue: string[] = [], dueToday: string[] = [], soon: string[] = [];
  const toLog: { teamId: number; taskId: number; kind: string; assignedTo: number }[] = [];

  for (const t of tasks) {
    if (!t.dueDate) continue;
    const left = dayDiff(now.date, t.dueDate);
    const who = nameOf.get(t.assignedTo);
    const sentToday = (kind: string) => logs.some((l: any) => l.taskId === t.id && l.kind === kind && l.sentOn === now.date);

    if (left < 0) {
      const last = logs.filter((l: any) => l.taskId === t.id && l.kind === "overdue")
        .map((l: any) => l.sentOn).sort().pop();
      const gap = last ? dayDiff(last, now.date) : 999;
      if (force ? true : gap >= team.taskBotOverdueEvery) {
        overdue.push(`• ${who} — ${t.title} (متأخرة ${-left} يوم)`);
        toLog.push({ teamId: team.id, taskId: t.id, kind: "overdue", assignedTo: t.assignedTo });
      }
    } else if (left === 0) {
      if (force || !sentToday("due_today")) {
        dueToday.push(`• ${who} — ${t.title}`);
        toLog.push({ teamId: team.id, taskId: t.id, kind: "due_today", assignedTo: t.assignedTo });
      }
    } else if (left <= team.taskBotRemindDays) {
      if (force || !sentToday("reminder")) {
        soon.push(`• ${who} — ${t.title} (باقي ${left} يوم)`);
        toLog.push({ teamId: team.id, taskId: t.id, kind: "reminder", assignedTo: t.assignedTo });
      }
    }
  }

  if (toLog.length === 0) { result.skipped = result.skipped || "nothing to follow up"; return result; }

  const sections: string[] = [`📋 متابعة المهام — ${team.name}`];
  if (overdue.length) sections.push(`\n🔴 متأخرة (${overdue.length}):\n${overdue.join("\n")}`);
  if (dueToday.length) sections.push(`\n🟠 موعدها النهاردة (${dueToday.length}):\n${dueToday.join("\n")}`);
  if (soon.length) sections.push(`\n🔔 قربت (${soon.length}):\n${soon.join("\n")}`);
  sections.push(`\nلو خلصت مهمتك، علّمها «مكتملة» من الموقع عشان تتوقف المتابعة.`);

  const r = await sendTelegram(team.telegramChatId, sections.join("\n"));
  if (!r.ok) { result.error = r.error!; return result; }
  await admin.from("task_bot_log").insert(toLog);
  result.digestItems = toLog.length;
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
  if (!token) return json({ error: "غير مسجل الدخول" }, 401);

  const body = await req.json().catch(() => ({}));
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const teamCols =
    "id, name, telegramChatId, taskBotEnabled, taskBotAnnounceAssign, taskBotRemindDays, taskBotOverdueEvery, taskBotHour";

  // الجدولة: كل الفرق اللي مفعّلة البوت ومربوطة بجروب
  if (body.action === "cron") {
    if (token !== SERVICE_ROLE_KEY) return json({ error: "غير مصرح" }, 403);
    const { data: teams } = await admin.from("teams").select(teamCols)
      .eq("taskBotEnabled", true).not("telegramChatId", "is", null);
    const results = [];
    for (const team of teams || []) {
      try { results.push(await runTeam(admin, team, false)); }
      catch (err) { results.push({ teamId: team.id, error: String((err as Error).message || err) }); }
    }
    return json({ results }, 200);
  }

  // زرار "شغّل المتابعة دلوقتي" من الإعدادات: مدير الفريق ← فريقه هو بس
  if (body.action === "run_now") {
    const { data: authData, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !authData?.user) return json({ error: "جلسة غير صالحة" }, 401);

    const { data: caller } = await admin.from("users").select("role, status, teamId")
      .eq("authId", authData.user.id).single();
    if (!caller || caller.role !== "admin" || caller.status !== "active" || !caller.teamId) {
      return json({ error: "غير مصرح لك — العملية دي لمديري الفريق فقط" }, 403);
    }

    const { data: team } = await admin.from("teams").select(teamCols).eq("id", caller.teamId).single();
    if (!team?.telegramChatId) return json({ error: "اربط جروب تليجرام الأول" }, 400);
    if (!team.taskBotEnabled) return json({ error: "فعّل البوت الأول واحفظ الإعدادات" }, 400);

    const r = await runTeam(admin, team, true);
    if (r.error) return json({ error: "تليجرام رفض الإرسال: تأكد إن البوت لسه في الجروب وعنده صلاحية الإرسال" }, 502);
    const sent = r.announced + r.digestItems;
    return json({
      message: sent > 0
        ? `تم الإرسال (${r.announced} إعلان توكيل، ${r.digestItems} مهمة في المتابعة)`
        : "مفيش مهام محتاجة متابعة دلوقتي",
    }, 200);
  }

  return json({ error: "إجراء غير معروف" }, 400);
});
