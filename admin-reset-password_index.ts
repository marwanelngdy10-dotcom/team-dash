// supabase/functions/admin-reset-password/index.ts
//
// وظيفة هذا الـ Edge Function: تسمح للسوبر أدمن (وبس السوبر أدمن — مش أي
// مدير عادي) بتعيين كلمة مرور جديدة لأي عضو في الفريق، من غير ما حد
// (حتى السوبر أدمن نفسه) يقدر "يشوف" كلمة المرور الحالية — لأن Supabase
// أصلًا بيخزّن كلمات المرور مشفّرة بتشفير أحادي الاتجاه (one-way hash)،
// ومفيش أي طريقة فك تشفير ليها حتى من طرف Supabase نفسها. ده معيار أمان
// أساسي، ومش قابل للتغيير.
//
// ملحوظة: المدير العادي (role='admin' بدون isSuperAdmin) مش مسموح له
// بتغيير كلمة مرور أي حد، حتى لو حاول يبعت الطلب مباشرة للـ Edge Function
// (مش بس مخفي في الواجهة) — التحقق تحت بيرفض أي حد غير سوبر أدمن.
//
// البديل العملي: المدير "يعيد تعيين" كلمة مرور جديدة للعضو (زي ما بيحصل
// في أي نظام حقيقي — GitHub, Gmail, إلخ) بدل ما "يشوف" القديمة.
//
// ============================================================
// خطوات النشر (مرة واحدة فقط):
// ------------------------------------------------------------
// 1) ثبّت Supabase CLI (لو مش مثبت):
//      npm install -g supabase
// 2) من مجلد المشروع:
//      supabase login
//      supabase link --project-ref <project-ref-بتاعك>   (تلاقيه في رابط الداشبورد)
// 3) حط هذا الملف في:  supabase/functions/admin-reset-password/index.ts
// 4) انشره:
//      supabase functions deploy admin-reset-password
//    (المتغيرات SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY بتكون متاحة
//     تلقائيًا جوه الـ Edge Function من غير ما تحتاج تضيفها بنفسك —
//     محدش هيشوفها غير Supabase على السيرفر، ومش هتتبعت للمتصفح خالص)
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return json({ error: "غير مسجل الدخول" }, 401);

  // عميل بصلاحية service_role — يشتغل جوه السيرفر بس، وميوصلش للمتصفح أبدًا
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 1) تأكد إن التوكن المرسل فعلًا بتاع مستخدم حقيقي مسجّل دخوله
  const { data: authData, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !authData?.user) return json({ error: "جلسة غير صالحة" }, 401);

  // 2) تأكد إن صاحب التوكن ده "سوبر أدمن" فعليًا من جدول users (مش من كلامه هو)
  //    — مدير عادي (role='admin' بدون isSuperAdmin) مش كفاية هنا
  const { data: caller, error: callerErr } = await admin
    .from("users")
    .select("role, status, isSuperAdmin")
    .eq("authId", authData.user.id)
    .single();

  if (
    callerErr ||
    !caller ||
    caller.role !== "admin" ||
    caller.status !== "active" ||
    !caller.isSuperAdmin
  ) {
    return json({ error: "غير مصرح لك بتنفيذ هذه العملية — تغيير كلمة المرور مقصور على السوبر أدمن" }, 403);
  }

  // 3) اقرأ بيانات الطلب
  const body = await req.json().catch(() => ({}));
  const userId = body.userId;
  const newPassword = String(body.newPassword || "");
  if (!userId || newPassword.length < 6) {
    return json({ error: "بيانات غير صحيحة (كلمة المرور لازم تكون 6 أحرف على الأقل)" }, 400);
  }

  // 4) هات authId بتاع العضو المستهدف
  const { data: target, error: targetErr } = await admin
    .from("users")
    .select("authId, name")
    .eq("id", userId)
    .single();

  if (targetErr || !target || !target.authId) {
    return json({ error: "العضو غير موجود" }, 404);
  }

  // 5) عيّن كلمة المرور الجديدة عبر Admin API (يحتاج service_role، متاح هنا بس)
  const { error: updErr } = await admin.auth.admin.updateUserById(target.authId, {
    password: newPassword,
  });

  if (updErr) return json({ error: "تعذّر تغيير كلمة المرور: " + updErr.message }, 500);

  return json({ message: `تم تعيين كلمة مرور جديدة لـ ${target.name}` }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}
