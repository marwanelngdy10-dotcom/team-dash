// supabase/functions/send-push/index.ts
//
// وظيفة هذا الـ Edge Function: كل ما يتسجّل صف جديد في جدول public.notifications
// (رسالة شات جديدة، إسناد مهمة، إنذار تقصير، إيقاف عضوية...)، Supabase Database
// Webhook بينادي هذا الملف تلقائيًا، وهو بيبعت إشعار Push حقيقي (إشعار نظام،
// حتى لو الموقع/التطبيق مقفول تمامًا) لكل الأجهزة اللي صاحب الإشعار مسجّل
// دخوله منها (من جدول push_subscriptions).
//
// ============================================================
// خطوات النشر (مرة واحدة فقط):
// ------------------------------------------------------------
// 1) لو لسه Supabase CLI مش مثبت:
//      npm install -g supabase
//      supabase login
//      supabase link --project-ref pkpeglpoyeeiaobfoqnv
//
// 2) حط هذا الملف في:  supabase/functions/send-push/index.ts
//    (نفس مكان admin-reset-password بالظبط، جنبه مش جواه)
//
// 3) سجّل مفاتيح VAPID كـ Secrets (خاصة بمشروعك، تم توليدها جاهزة):
//    شغّل من جهازك (Terminal):
//      supabase secrets set VAPID_PUBLIC_KEY="BJnET486fibBjhXA4Vm9hea7QrldJ0P-gr6OOTs51o5p-ZgCWNEexiaNixP7zrFE7ybZ9pzh2is3cpDzH51g0c4"
//      supabase secrets set VAPID_PRIVATE_KEY="apSQ1O6Ppr80tya2XIOlEC0IGtLM-exRFzD0H3HnDxo"
//      supabase secrets set VAPID_SUBJECT="mailto:admin@itqan.com"
//    (المفتاح الخاص VAPID_PRIVATE_KEY ده سرّي — منه فقط سيرفر Supabase
//    يقدر يوقّع إشعارات باسم موقعك؛ متبعتوش لحد، ومتحطوش في index.html)
//
// 4) انشر الفنكشن (لازم --no-verify-jwt عشان الـ Database Webhook يقدر
//    ينادي عليه من غير Authorization توكن مستخدم حقيقي):
//      supabase functions deploy send-push --no-verify-jwt
//
// 5) اعمل Database Webhook من الداشبورد:
//    Database → Webhooks → Create a new hook
//      - Table: notifications
//      - Events: Insert
//      - Type: Supabase Edge Functions
//      - Edge Function: send-push
//    (التفاصيل الكاملة خطوة بخطوة في PWA_SETUP_GUIDE.md المرفق)
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload?.record;
    if (!record || !record.userId) {
      return json({ skipped: true }, 200);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: subs, error: subsErr } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("userId", record.userId);

    if (subsErr) return json({ error: subsErr.message }, 500);
    if (!subs || subs.length === 0) return json({ skipped: true, reason: "no subscriptions" }, 200);

    const notifPayload = JSON.stringify({
      title: record.title || "IT_qan",
      body: record.body || "",
      tag: `itqan-${record.type || "notif"}`,
      url: "./index.html",
    });

    const results = await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          notifPayload
        )
      )
    );

    // نظافة: أي اشتراك بقى منتهي/ملغي (410 Gone أو 404) نشيله من الجدول
    // عشان محاولات الإرسال الجاية متتأخرش أو تفشل عليه تاني
    const toDelete: number[] = [];
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        const statusCode = (r.reason && (r.reason.statusCode || r.reason.status)) || null;
        if (statusCode === 410 || statusCode === 404) toDelete.push(subs[i].id);
      }
    });
    if (toDelete.length) {
      await admin.from("push_subscriptions").delete().in("id", toDelete);
    }

    return json({ sent: results.filter((r) => r.status === "fulfilled").length, total: subs.length }, 200);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
