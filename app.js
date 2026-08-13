import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

(function(){
"use strict";

/* ============================================================
   ICONS — مجموعة أيقونات SVG بسيطة (خطوط) بدون مكتبات خارجية
   ============================================================ */
const ICONS = {
  tasks:`<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>`,
  reports:`<svg class="icon" viewBox="0 0 24 24"><path d="M6 21V9"/><path d="M12 21V4"/><path d="M18 21v-6"/><line x1="3" y1="21" x2="21" y2="21"/></svg>`,
  members:`<svg class="icon" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6"/><circle cx="17.5" cy="8.5" r="2.3"/><path d="M15.6 14.3c2.6.3 4.4 2.4 4.4 5.7"/></svg>`,
  settings:`<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="8.2"/><line x1="12" y1="1.6" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22.4"/><line x1="3.6" y1="12" x2="1.2" y2="12"/><line x1="22.8" y1="12" x2="20.4" y2="12"/></svg>`,
  logout:`<svg class="icon" viewBox="0 0 24 24"><path d="M15 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9"/><line x1="21" y1="12" x2="10" y2="12"/><polyline points="16 7 21 12 16 17"/></svg>`,
  eye:`<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff:`<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c7 0 10.5 7 10.5 7a13.4 13.4 0 0 1-3.2 4.1M6.5 6.6C3.4 8.5 1.5 12 1.5 12S5 19 12 19a10.8 10.8 0 0 0 4-.75"/><path d="M9.5 9.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-1.05"/></svg>`,
  plus:`<svg class="icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  edit:`<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/></svg>`,
  trash:`<svg class="icon icon-sm" viewBox="0 0 24 24"><polyline points="4 7 20 7"/><path d="M6 7l1 14h10l1-14"/><path d="M9 7V4h6v3"/></svg>`,
  check:`<svg class="icon icon-sm" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  x:`<svg class="icon icon-sm" viewBox="0 0 24 24"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>`,
  camera:`<svg class="icon" viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13.5" r="3.4"/></svg>`,
  menu:`<svg class="icon" viewBox="0 0 24 24"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>`,
  share:`<svg class="icon icon-sm" viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.8"/><circle cx="6" cy="12" r="2.8"/><circle cx="18" cy="19" r="2.8"/><line x1="8.4" y1="10.6" x2="15.6" y2="6.4"/><line x1="8.4" y1="13.4" x2="15.6" y2="17.6"/></svg>`,
  close:`<svg class="icon" viewBox="0 0 24 24"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>`,
  ban:`<svg class="icon icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="5.5" y1="5.5" x2="18.5" y2="18.5"/></svg>`,
  bulb:`<svg class="icon" viewBox="0 0 24 24"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a6.5 6.5 0 0 0-3.8 11.8c.6.45 1.05 1.15 1.15 1.9h5.3c.1-.75.55-1.45 1.15-1.9A6.5 6.5 0 0 0 12 2Z"/></svg>`,
  chat:`<svg class="icon" viewBox="0 0 24 24"><path d="M4 4h16v12H8l-4 4V4Z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="13" y2="13"/></svg>`,
  book:`<svg class="icon" viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z"/><path d="M4 5.5v15A2.5 2.5 0 0 1 6.5 18H20"/></svg>`,
  bell:`<svg class="icon" viewBox="0 0 24 24"><path d="M6 9a6 6 0 0 1 12 0c0 4.5 1.5 6 2 6.5H4c.5-.5 2-2 2-6.5Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>`,
  grad:`<svg class="icon" viewBox="0 0 24 24"><path d="M2 9.5 12 5l10 4.5-10 4.5-10-4.5Z"/><path d="M6 11.5V17c0 1.4 2.7 3 6 3s6-1.6 6-3v-5.5"/><path d="M21 9.5V16"/></svg>`,
  trophy:`<svg class="icon" viewBox="0 0 24 24"><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 5H4a3 3 0 0 0 3 5"/><path d="M17 5h3a3 3 0 0 1-3 5"/><path d="M12 14v3"/><path d="M8 20h8"/><path d="M9.5 17h5l.7 3h-6.4l.7-3Z"/></svg>`,
  sun:`<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><line x1="12" y1="1.5" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22.5"/><line x1="4.2" y1="4.2" x2="6" y2="6"/><line x1="18" y1="18" x2="19.8" y2="19.8"/><line x1="1.5" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22.5" y2="12"/><line x1="4.2" y1="19.8" x2="6" y2="18"/><line x1="18" y1="6" x2="19.8" y2="4.2"/></svg>`,
  moon:`<svg class="icon" viewBox="0 0 24 24"><path d="M20.5 14.8A8.5 8.5 0 1 1 9.2 3.5a7 7 0 0 0 11.3 11.3Z"/></svg>`,
  download:`<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M12 3v13"/><polyline points="7 11 12 16 17 11"/><path d="M4 20h16"/></svg>`,
  printer:`<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M6 9V3h12v6"/><rect x="4" y="9" width="16" height="8" rx="1.5"/><path d="M6 17v4h12v-4"/></svg>`
};

/* ============================================================
   API — اتصال مباشر بـ Supabase (Auth + Postgres + Row Level Security)
   ============================================================
   عدّل القيمتين التاليتين ببيانات مشروعك على supabase.com
   (Project Settings → API → Project URL / anon public key)
   ============================================================ */
const SUPABASE_URL = 'https://pkpeglpoyeeiaobfoqnv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Bzr6eoNTg_P_LuFXB3BGJw_XcGlM9hc';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ============================================================
   PWA — تثبيت الموقع كتطبيق + إشعارات Push حقيقية (حتى لو الموقع مقفول)
   ============================================================ */
const VAPID_PUBLIC_KEY = 'BJnET486fibBjhXA4Vm9hea7QrldJ0P-gr6OOTs51o5p-ZgCWNEexiaNixP7zrFE7ybZ9pzh2is3cpDzH51g0c4';

function urlBase64ToUint8Array(base64String){
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

let swRegistration = null;

async function registerServiceWorker(){
  if(!('serviceWorker' in navigator)) return null;
  try {
    swRegistration = await navigator.serviceWorker.register('service-worker.js');
    return swRegistration;
  } catch (err) {
    console.warn('تعذّر تسجيل service worker:', err);
    return null;
  }
}

/* يُستدعى بعد تسجيل الدخول بنجاح: يطلب إذن الإشعارات ويسجّل الاشتراك
   في جدول push_subscriptions (لكل جهاز/متصفح اشتراك مستقل، مربوط بالعضو) */
async function initPushSubscription(){
  if(!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if(!state.currentUser) return;
  try {
    const reg = swRegistration || await registerServiceWorker();
    if(!reg) return;

    if(Notification.permission === 'denied') return;
    if(Notification.permission === 'default'){
      const perm = await Notification.requestPermission();
      if(perm !== 'granted') return;
    }

    let sub = await reg.pushManager.getSubscription();
    if(!sub){
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    const json = sub.toJSON();
    await sb.from('push_subscriptions').upsert({
      userId: state.currentUser.id,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      userAgent: navigator.userAgent
    }, { onConflict: 'endpoint' });
  } catch (err) {
    console.warn('تعذّر تفعيل إشعارات Push:', err);
  }
}

/* يُستدعى عند تسجيل الخروج: يشيل اشتراك الجهاز ده من قاعدة البيانات
   عشان ميوصلش إشعارات لصاحب حساب راح سجّل خروج على نفس الجهاز */
async function removePushSubscription(){
  try {
    if(!swRegistration) return;
    const sub = await swRegistration.pushManager.getSubscription();
    if(!sub) return;
    const endpoint = sub.toJSON().endpoint;
    await sb.from('push_subscriptions').delete().eq('endpoint', endpoint);
  } catch (err) { /* فشل هادئ */ }
}

registerServiceWorker();

/* "نسيت كلمة المرور" — لينك إعادة تعيين بالإيميل (مدمج في Supabase، مجاني
   بالكامل، مفيش أي خدمة خارجية أو بطاقة بنكية مطلوبة). لما العضو يدوس
   على اللينك اللي بيوصله بالإيميل، Supabase بيرجّعه لنفس الصفحة دي
   ومعاه جلسة مؤقتة خاصة بإعادة التعيين بس — الحدث ده بيوصلنا هنا: */
sb.auth.onAuthStateChange((event) => {
  if(event === 'PASSWORD_RECOVERY'){
    $('#authScreen').classList.add('hidden');
    $('#appScreen').classList.add('hidden');
    $('#profileCompleteOverlay').classList.add('hidden');
    $('#sessionCheckOverlay').classList.add('hidden');
    $('#recoverySetPwdMsg').innerHTML = '';
    $('#recoverySetPwdForm').reset();
    $('#recoverySetPwdOverlay').classList.remove('hidden');
  }
});

function getToken(){ return localStorage.getItem('teamflow_session_flag'); }
function setToken(token){
  if(token) localStorage.setItem('teamflow_session_flag', '1');
  else localStorage.removeItem('teamflow_session_flag');
}

async function fetchAppUser(){
  const { data: { session } } = await sb.auth.getSession();
  if(!session) return null;
  const { data, error } = await sb.from('users').select('*').eq('authId', session.user.id).single();
  if(error || !data) return null;
  return data;
}

/* الدخول يقدر يتم بالإيميل أو باليوزر نيم — لو النص المدخل مفيهوش @ بنعتبره
   يوزر نيم ونجيب الإيميل المرتبط بيه أولًا عن طريق get_email_by_username
   (دالة على قاعدة البيانات بترجع الإيميل بس، من غير أي بيانات تانية) */
async function resolveLoginEmail(identifier){
  const raw = String(identifier || '').trim();
  if(raw.includes('@')) return raw.toLowerCase();
  const { data, error } = await sb.rpc('get_email_by_username', { p_username: raw });
  if(error || !data) return null; // مش موجود — هنسيب signInWithPassword يفشل برسالة موحّدة
  return data;
}
async function authLogin({ email, password }){
  const resolvedEmail = await resolveLoginEmail(email);
  if(!resolvedEmail) throw new Error('بيانات الدخول غير صحيحة');
  const { error: signInErr } = await sb.auth.signInWithPassword({ email: resolvedEmail, password });
  if(signInErr) throw new Error('بيانات الدخول غير صحيحة');
  const appUser = await fetchAppUser();
  if(!appUser){ await sb.auth.signOut(); throw new Error('الحساب غير موجود في النظام'); }
  if(appUser.status === 'pending'){ await sb.auth.signOut(); throw new Error('حسابك بانتظار موافقة المدير'); }
  if(appUser.status === 'disabled'){ await sb.auth.signOut(); throw new Error('تم تعطيل حسابك، تواصل مع المدير'); }
  return { token: 'session', user: appUser };
}

async function authRegister({ name, email, username, phone, password }){
  const { error } = await sb.auth.signUp({
    email, password,
    options: { data: { name, username, phone } }
  });
  if(error){
    const msg = String(error.message || '').toLowerCase();
    if(msg.includes('already') || msg.includes('registered')) throw new Error('هذا البريد الإلكتروني مسجّل بالفعل');
    if(msg.includes('username') || msg.includes('idx_users_username')) throw new Error('اسم المستخدم ده مستخدم بالفعل، جرّب اسم تاني');
    if(msg.includes('chk_username_format')) throw new Error('اسم المستخدم لازم يكون حروف إنجليزية/أرقام فقط (3 لـ30 حرف)، من غير @ أو مسافات');
    throw new Error('تعذّر إنشاء الحساب، حاول مرة أخرى');
  }
  await sb.auth.signOut(); // الحساب Pending لحد موافقة المدير
  return {};
}

async function authMe(){
  const appUser = await fetchAppUser();
  if(!appUser) throw new Error('غير مسجل الدخول');
  if(appUser.status !== 'active'){ await sb.auth.signOut(); throw new Error('حسابك غير مفعّل'); }
  return { user: appUser };
}

async function authChangePassword({ currentPassword, newPassword }){
  const { data: { session } } = await sb.auth.getSession();
  if(!session) throw new Error('غير مسجل الدخول');
  const { error: verifyErr } = await sb.auth.signInWithPassword({ email: session.user.email, password: currentPassword });
  if(verifyErr) throw new Error('كلمة المرور الحالية غير صحيحة');
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if(error) throw new Error('تعذّر تغيير كلمة المرور');
  return {};
}

async function authUpdateAvatar({ avatar }){
  const { data: { session } } = await sb.auth.getSession();
  if(!session) throw new Error('غير مسجل الدخول');
  const { data, error } = await sb.from('users').update({ avatar }).eq('authId', session.user.id).select().single();
  if(error) throw new Error('تعذّر تحديث الصورة');
  return { user: data };
}
async function authUpdateName({ name }){
  const { data: { session } } = await sb.auth.getSession();
  if(!session) throw new Error('غير مسجل الدخول');
  const trimmed = String(name || '').trim();
  if(!trimmed) throw new Error('يرجى إدخال اسم صحيح');
  const { data, error } = await sb.from('users').update({ name: trimmed }).eq('authId', session.user.id).select().single();
  if(error) throw new Error('تعذّر تحديث الاسم');
  return { user: data };
}

/* نبضة حضور (heartbeat) — بتحدّث "آخر ظهور" بتاعت المستخدم الحالي فقط، بتفشل بهدوء لو حصل خطأ */
async function authHeartbeat(){
  const { data: { session } } = await sb.auth.getSession();
  if(!session) return;
  await sb.from('users').update({ lastSeenAt: new Date().toISOString() }).eq('authId', session.user.id);
}

async function tasksList(){
  const { data, error } = await sb.from('tasks').select('*').order('createdAt', { ascending: false });
  if(error) throw new Error('تعذّر تحميل المهام');
  return { tasks: data };
}
async function tasksCreate(p){
  const { data, error } = await sb.from('tasks').insert({
    title: p.title, description: p.description, assignedTo: p.assignedTo,
    priority: p.priority, dueDate: p.dueDate, status: 'قيد التنفيذ'
  }).select().single();
  if(error) throw new Error(error.message.includes('غير') ? error.message : 'تعذّر إنشاء المهمة');
  return { task: data };
}
async function tasksUpdate(id, p){
  const { data, error } = await sb.from('tasks')
    .update({ title: p.title, description: p.description, assignedTo: p.assignedTo, priority: p.priority, dueDate: p.dueDate })
    .eq('id', id).select().single();
  if(error) throw new Error('تعذّر تحديث المهمة');
  return { task: data };
}
async function tasksUpdateStatus(id, { status }){
  const { data, error } = await sb.from('tasks').update({ status }).eq('id', id).select().single();
  if(error) throw new Error('تعذّر تحديث حالة المهمة');
  return { task: data };
}
/* حفظ ملاحظة نصية عن إنجاز المهمة (بديل أو بالإضافة لرفع ملف) */
async function tasksSaveNote(id, note){
  const { data, error } = await sb.from('tasks').update({ completionNote: note || null }).eq('id', id).select().single();
  if(error) throw new Error('تعذّر حفظ الملاحظة');
  return { task: data };
}
async function tasksDelete(id){
  const { error } = await sb.from('tasks').delete().eq('id', id);
  if(error) throw new Error('تعذّر حذف المهمة');
  return { message: 'تم حذف المهمة' };
}

async function reportsList(){
  const { data, error } = await sb.from('reports').select('*').order('createdAt', { ascending: false });
  if(error) throw new Error('تعذّر تحميل التقارير');
  return { reports: data };
}
async function reportsCreate(p){
  const appUser = await fetchAppUser();
  const { data, error } = await sb.from('reports').insert({
    status: p.status, description: p.description, taskId: p.taskId || null, userId: appUser.id,
    postponeUntil: p.status === 'لن يتم التعلم' ? (p.postponeUntil || null) : null,
    postponeApproved: null // بانتظار مراجعة المدير — لا يُحتسب ضد التقصير قبل الموافقة
  }).select().single();
  if(error) throw new Error('تعذّر حفظ التقرير');
  return { report: data };
}
/* موافقة/رفض المدير على "عذر" تأجيل احتساب التقصير */
async function reportsSetPostponeApproval(id, approved){
  const { data, error } = await sb.from('reports').update({ postponeApproved: approved }).eq('id', id).select().single();
  if(error) throw new Error('تعذّر تحديث حالة العذر');
  return { report: data };
}
/* ملاحظة المدير على تقرير عضو — للمدير/السوبر أدمن بس (محمية على مستوى
   قاعدة البيانات كمان في guard_reports_update)، بتبعت إشعار للعضو صاحب
   التقرير تلقائيًا من تريجر على السيرفر */
async function reportsSetManagerNote(id, note){
  const { data, error } = await sb.from('reports').update({ managerNote: note || null }).eq('id', id).select().single();
  if(error) throw new Error('تعذّر حفظ الملاحظة');
  return { report: data };
}
/* تعديل تقرير — كل عضو يقدر يعدّل تقاريره هو بس (مفروض من RLS + guard على قاعدة
   البيانات، مش مجرد إخفاء في الواجهة). لا يشمل postponeApproved — ده بيفضل بيد المدير بس */
async function reportsUpdate(id, p){
  const { data, error } = await sb.from('reports').update({
    status: p.status, description: p.description, taskId: p.taskId || null,
    postponeUntil: p.status === 'لن يتم التعلم' ? (p.postponeUntil || null) : null
  }).eq('id', id).select().single();
  if(error) throw new Error('تعذّر تحديث التقرير');
  return { report: data };
}
/* حذف تقرير — كل عضو يقدر يحذف تقاريره هو بس (والمدير يقدر يحذف أي تقرير) */
async function reportsDelete(id){
  const { error } = await sb.from('reports').delete().eq('id', id);
  if(error) throw new Error(error.message || 'تعذّر حذف التقرير');
  return { message: 'تم حذف التقرير' };
}

async function usersList(){
  const { data, error } = await sb.from('users').select('*').order('createdAt', { ascending: false });
  if(error) throw new Error('تعذّر تحميل الأعضاء');
  return { users: data };
}
async function usersCreate(p){
  const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  const { data: signUpData, error } = await tempClient.auth.signUp({
    email: p.email, password: p.password, options: { data: { name: p.name } }
  });
  if(error){
    const msg = String(error.message || '').toLowerCase();
    if(msg.includes('already') || msg.includes('registered')) throw new Error('هذا البريد الإلكتروني مسجّل بالفعل');
    throw new Error('تعذّر إنشاء الحساب');
  }
  await new Promise(r => setTimeout(r, 500)); // انتظار تنفيذ الـ trigger اللي بينشئ صف users
  const authId = signUpData.user ? signUpData.user.id : null;
  if(!authId) throw new Error('تعذّر إنشاء الحساب');
  const isSuperAdmin = p.role === 'superadmin';
  const role = (p.role === 'admin' || isSuperAdmin) ? 'admin' : 'member';
  const { data, error: updErr } = await sb.from('users')
    .update({ status: 'active', role })
    .eq('authId', authId).select().single();
  if(updErr) throw new Error('تم إنشاء الحساب لكن يلزم تفعيله يدويًا من "الأعضاء"');
  if(isSuperAdmin){
    // خطوة إضافية محمية بصلاحية السوبر أدمن على قاعدة البيانات (RLS + guard) —
    // لو المُنشئ مش سوبر أدمن فعليًا، هترفض تلقائيًا حتى لو الواجهة عرضت الخيار
    const { data: superData, error: superErr } = await sb.from('users')
      .update({ isSuperAdmin: true })
      .eq('id', data.id).select().single();
    if(superErr) throw new Error('تم إنشاء الحساب كمدير، لكن تعذّر منحه صلاحية سوبر أدمن: ' + superErr.message);
    return { user: superData };
  }
  return { user: data };
}
async function usersApprove(id){
  const { data, error } = await sb.from('users').update({ status: 'active' }).eq('id', id).eq('status', 'pending').select().single();
  if(error || !data) throw new Error('تعذّر تنفيذ العملية');
  return { message: `تمت الموافقة على ${data.name}` };
}
async function usersToggleStatus(id){
  const { data: existing, error: exErr } = await sb.from('users').select('*').eq('id', id).single();
  if(exErr || !existing) throw new Error('العضو غير موجود');
  if(existing.status === 'pending') throw new Error('لا يمكن تفعيل/تعطيل طلب بانتظار الموافقة');
  const newStatus = existing.status === 'active' ? 'disabled' : 'active';
  const { data, error } = await sb.from('users').update({ status: newStatus }).eq('id', id).select().single();
  if(error) throw new Error(error.message || 'تعذّر تحديث حالة العضو');
  return { message: newStatus === 'active' ? `تم تفعيل ${data.name}` : `تم تعطيل ${data.name}` };
}
async function usersDelete(id){
  const { error } = await sb.from('users').delete().eq('id', id);
  if(error) throw new Error(error.message || 'تعذّر حذف العضو');
  return { message: 'تم حذف العضو' };
}
async function usersUpdateRole(id, role){
  const { data, error } = await sb.from('users').update({ role }).eq('id', id).select().single();
  if(error) throw new Error(error.message || 'تعذّر تحديث الصلاحية');
  return { message: `تم تحديث صلاحية ${data.name}`, user: data };
}
/* استثناء/إلغاء استثناء حساب من احتساب التقصير — مقصور على السوبر أدمن
   على مستوى قاعدة البيانات (guard_users_update من v15) */
async function usersUpdateNegligenceExempt(id, exempt){
  const { data, error } = await sb.from('users').update({ negligenceExempt: exempt }).eq('id', id).select().single();
  if(error) throw new Error(error.message || 'تعذّر تحديث حالة الاستثناء');
  return { message: exempt ? `تم استثناء ${data.name} من احتساب التقصير` : `تم إلغاء استثناء ${data.name} من احتساب التقصير`, user: data };
}
/* تحديد/تغيير قسم العضو (لفلترة صفحة "الكورسات" له) — مقصور على أي
   مدير نشط على مستوى قاعدة البيانات (guard_users_update من v30) */
async function usersUpdateDepartment(id, departmentId){
  const { data, error } = await sb.from('users').update({ departmentId: departmentId || null }).eq('id', id).select().single();
  if(error) throw new Error(error.message || 'تعذّر تحديث قسم العضو');
  return { message: `تم تحديث قسم ${data.name}`, user: data };
}
/* تعديل يدوي تراكمي لأيام التقصير (0 إلى 6) — مقصور على السوبر أدمن على
   مستوى قاعدة البيانات (increase_negligence/decrease_negligence من v26).
   بترجع العدّ الجديد فورًا من السيرفر عشان الواجهة تحدّثه على طول */
async function negligenceIncrease(userId){
  const { data, error } = await sb.rpc('increase_negligence', { p_user_id: userId });
  if(error) throw new Error(error.message || 'تعذّر زيادة يوم التقصير');
  return { message: 'تم إضافة يوم تقصير', negligentDays: data };
}
async function negligenceDecrease(userId){
  const { data, error } = await sb.rpc('decrease_negligence', { p_user_id: userId });
  if(error) throw new Error(error.message || 'تعذّر إنقاص يوم التقصير');
  return { message: 'تم إنقاص يوم تقصير', negligentDays: data };
}

/* أيام التقصير الملغاة يدويًا — قراءة (السوبر أدمن/المدير يشوف الكل، والعضو
   يشوف أيامه هو بس، حسب RLS)، تُحمَّل مع باقي البيانات في refreshData */
async function negligenceForgivenDaysList(){
  const { data, error } = await sb.from('negligence_forgiven_days').select('*');
  if(error) throw new Error('تعذّر تحميل الأيام الملغاة من التقصير');
  return { days: data };
}
/* إلغاء يوم تقصير/تأخير معيّن لعضو معيّن — مقصور على السوبر أدمن (RLS +
   الدالة نفسها من supabase_migration_v24). بتعيد حساب أيام التقصير فورًا
   على السيرفر وترجّع العدّ الجديد */
async function negligenceForgiveDay(userId, date){
  const { data, error } = await sb.rpc('forgive_negligence_day', { p_user_id: userId, p_date: date });
  if(error) throw new Error(error.message || 'تعذّر إلغاء يوم التقصير');
  return { message: 'تم إلغاء اليوم من التقصير', negligentDays: data };
}
/* التراجع عن إلغاء يوم — يرجّع اليوم يُحتسب تقصيرًا/تأخيرًا زي ما كان */
async function negligenceUnforgiveDay(userId, date){
  const { data, error } = await sb.rpc('unforgive_negligence_day', { p_user_id: userId, p_date: date });
  if(error) throw new Error(error.message || 'تعذّر التراجع عن إلغاء اليوم');
  return { message: 'رجع اليوم يُحتسب زي ما كان', negligentDays: data };
}

/* تعيين كلمة مرور جديدة لعضو (مدير فقط) — عبر Supabase Edge Function بصلاحية service_role،
   لأن كلمات المرور مشفّرة تشفير أحادي الاتجاه ومفيش طريقة "لعرض" القديمة أبدًا */
async function usersResetPassword(id, newPassword){
  const { data: { session } } = await sb.auth.getSession();
  if(!session) throw new Error('غير مسجل الدخول');
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/admin-reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ userId: id, newPassword })
    });
  } catch (err) {
    throw new Error('تعذّر الاتصال بخدمة إعادة تعيين كلمة المرور');
  }
  const data = await res.json().catch(() => ({}));
  if(!res.ok) throw new Error(data.error || 'تعذّر تغيير كلمة المرور');
  return data;
}

/* الشات — قناة "الفريق كله" + رسائل خاصة بين عضوين (RLS بتفرض الخصوصية من قاعدة البيانات) */
async function messagesList(){
  const { data, error } = await sb.from('messages').select('*').order('createdAt', { ascending: true });
  if(error) throw new Error('تعذّر تحميل الرسائل');
  return { messages: data };
}
async function messagesSend({ recipientId, content }){
  const { data, error } = await sb.from('messages').insert({
    senderId: state.currentUser.id, recipientId: recipientId || null, content
  }).select().single();
  if(error) throw new Error('تعذّر إرسال الرسالة');
  return { message: data };
}
async function messagesDelete(id){
  const { error } = await sb.from('messages').delete().eq('id', id);
  if(error) throw new Error(error.message || 'تعذّر حذف الرسالة');
  return { message: 'تم حذف الرسالة' };
}

/* إعادة حساب أيام التقصير لكل الأعضاء النشطين على السيرفر (يوقف تلقائيًا من وصل 6 أيام)
   ده استعلام تقيل (بيلف يوم بيوم على كل عضو نشط)، فمش لازم يتنفّذ بالكامل
   مع كل ضغطة تنقل بين الصفحات. نخليه ياخد فرصة كل دقيقتين بالكتير، إلا لو
   طلبنا تنفيذه فورًا (force) — زي لما المدير يفتح صفحة "التقارير" تحديدًا
   واللي محتاجة فعلًا الأرقام الأحدث */
let lastNegligenceRecalcAt = 0;
async function negligenceRecalcAll(force){
  const now = Date.now();
  if(!force && (now - lastNegligenceRecalcAt) < 120000) return;
  lastNegligenceRecalcAt = now;
  const { error } = await sb.rpc('recalc_negligence_all');
  if(error) console.warn('تعذّر إعادة حساب التقصير:', error.message);
}

/* رفع مرفق (ملف/صورة) على مهمة عبر Supabase Storage */
async function tasksUploadAttachment(taskId, file){
  const safeName = file.name.replace(/[^\w.\-\u0600-\u06FF]/g, '_');
  const path = `${taskId}/${Date.now()}_${safeName}`;
  const { error: upErr } = await sb.storage.from('task-files').upload(path, file, { upsert: true });
  if(upErr) throw new Error('تعذّر رفع الملف: ' + upErr.message);
  const { data: pub } = sb.storage.from('task-files').getPublicUrl(path);
  const { data, error } = await sb.from('tasks')
    .update({ attachment: pub.publicUrl, attachmentName: file.name })
    .eq('id', taskId).select().single();
  if(error) throw new Error('تعذّر حفظ المرفق على المهمة');
  return { task: data };
}

/* مواد التعلم — كل عضو يشوف اللي مخصص له بس (يتم فرضه من RLS في قاعدة البيانات) */
async function learningList(){
  const { data, error } = await sb.from('learning_items').select('*').order('createdAt', { ascending: false });
  if(error) throw new Error('تعذّر تحميل مواد التعلم');
  return { learning: data };
}
async function learningCreate(p){
  const { data, error } = await sb.from('learning_items').insert({
    title: p.title, description: p.description || null, link: p.link || null,
    trackTitle: p.trackTitle || null,
    assignedTo: p.assignedTo, createdBy: state.currentUser ? state.currentUser.id : null
  }).select().single();
  if(error) throw new Error(error.message && error.message.includes('غير') ? error.message : 'تعذّر إضافة مادة التعلم');
  return { item: data };
}
async function learningUpdateStatus(id, status){
  const { data, error } = await sb.from('learning_items').update({ status }).eq('id', id).select().single();
  if(error) throw new Error('تعذّر تحديث حالة مادة التعلم');
  return { item: data };
}
async function learningDelete(id){
  const { error } = await sb.from('learning_items').delete().eq('id', id);
  if(error) throw new Error(error.message || 'تعذّر حذف مادة التعلم');
  return { message: 'تم حذف مادة التعلم' };
}

/* مصادر التعلم — مصدر عام يفيد الفريق، المدير يبني له أعمدة بالشكل اللي يحتاجه */
async function resourceColumnsList(){
  const { data, error } = await sb.from('resource_columns').select('*').order('order', { ascending: true });
  if(error) throw new Error('تعذّر تحميل أعمدة مصادر التعلم');
  return { columns: data };
}
async function resourceColumnsCreate(p){
  const key = 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const { data: existing } = await sb.from('resource_columns').select('order').order('order', { ascending: false }).limit(1);
  const nextOrder = existing && existing.length ? (existing[0].order + 1) : 0;
  const { data, error } = await sb.from('resource_columns').insert({
    key, label: p.label, type: p.type || 'text', order: nextOrder
  }).select().single();
  if(error) throw new Error('تعذّر إضافة العمود');
  return { column: data };
}
async function resourceColumnsDelete(id){
  const { error } = await sb.from('resource_columns').delete().eq('id', id);
  if(error) throw new Error(error.message || 'تعذّر حذف العمود');
  return { message: 'تم حذف العمود' };
}
async function resourcesList(){
  const { data, error } = await sb.from('resources').select('*').order('createdAt', { ascending: false });
  if(error) throw new Error('تعذّر تحميل مصادر التعلم');
  return { resources: data };
}
async function resourcesCreate(p){
  const { data, error } = await sb.from('resources').insert({
    data: p.data || {}, createdBy: state.currentUser ? state.currentUser.id : null
  }).select().single();
  if(error) throw new Error('تعذّر إضافة المصدر');
  return { resource: data };
}
async function resourcesUpdate(id, p){
  const { data, error } = await sb.from('resources').update({ data: p.data || {} }).eq('id', id).select().single();
  if(error) throw new Error('تعذّر تحديث المصدر');
  return { resource: data };
}
async function resourcesDelete(id){
  const { error } = await sb.from('resources').delete().eq('id', id);
  if(error) throw new Error(error.message || 'تعذّر حذف المصدر');
  return { message: 'تم حذف المصدر' };
}

/* الكورسات — جدول بسيط (عنوان + رابط) يضيفه المدير على طول، من غير ما يحتاج
   يعرّف أعمدة الأول زي مصادر التعلم — كل الأعضاء النشطين يشوفوها قراءة فقط */
async function coursesList(){
  const { data, error } = await sb.from('courses').select('*').order('order', { ascending: true }).order('createdAt', { ascending: true });
  if(error) throw new Error('تعذّر تحميل الكورسات');
  return { courses: data };
}
async function courseCreate(p){
  const { data, error } = await sb.from('courses').insert({
    title: (p.title || '').trim(), url: (p.url || '').trim(),
    categoryId: p.categoryId || null, branch: (p.branch || '').trim() || null,
    createdBy: state.currentUser ? state.currentUser.id : null
  }).select().single();
  if(error) throw new Error(error.message && error.message.includes('check') ? 'برجاء إدخال العنوان والرابط' : 'تعذّر إضافة الكورس');
  return { course: data };
}
async function courseUpdate(id, p){
  const { data, error } = await sb.from('courses').update({
    title: (p.title || '').trim(), url: (p.url || '').trim(),
    categoryId: p.categoryId || null, branch: (p.branch || '').trim() || null
  }).eq('id', id).select().single();
  if(error) throw new Error(error.message && error.message.includes('check') ? 'برجاء إدخال العنوان والرابط' : 'تعذّر تحديث الكورس');
  return { course: data };
}
async function courseDelete(id){
  const { error } = await sb.from('courses').delete().eq('id', id);
  if(error) throw new Error(error.message || 'تعذّر حذف الكورس');
  return { message: 'تم حذف الكورس' };
}

/* أقسام الكورسات — قائمة يختارها المدير، ويقدر يضيف قسم جديد منها
   على طول من واجهة "الكورسات" (زي "SEO / التسويق الإلكتروني" فرع تحت
   قسم "التسويق") */
async function courseCategoriesList(){
  const { data, error } = await sb.from('course_categories').select('*').order('order', { ascending: true }).order('createdAt', { ascending: true });
  if(error) throw new Error('تعذّر تحميل أقسام الكورسات');
  return { categories: data };
}
async function courseCategoryCreate(title){
  const { data, error } = await sb.from('course_categories').insert({ title: (title || '').trim() }).select().single();
  if(error) throw new Error(error.message && error.message.includes('check') ? 'برجاء إدخال اسم القسم' : 'تعذّر إضافة القسم');
  return { category: data };
}
async function courseCategoryDelete(id){
  const { error } = await sb.from('course_categories').delete().eq('id', id);
  if(error) throw new Error(error.message || 'تعذّر حذف القسم');
  return { message: 'تم حذف القسم' };
}

/* الإشعارات — تُنشأ تلقائيًا من قاعدة البيانات (إسناد مهمة / إنذارات تقصير) */
async function notificationsList(){
  const { data, error } = await sb.from('notifications').select('*').order('createdAt', { ascending: false }).limit(50);
  if(error) throw new Error('تعذّر تحميل الإشعارات');
  return { notifications: data };
}
async function notificationsMarkRead(id){
  const { error } = await sb.from('notifications').update({ isRead: true }).eq('id', id);
  if(error) throw new Error('تعذّر تحديث الإشعار');
  return {};
}
async function notificationsMarkAllRead(){
  const { error } = await sb.from('notifications').update({ isRead: true }).eq('userId', state.currentUser.id).eq('isRead', false);
  if(error) throw new Error('تعذّر تحديث الإشعارات');
  return {};
}
async function notificationsDeleteAll(){
  const { error } = await sb.from('notifications').delete().eq('userId', state.currentUser.id);
  if(error) throw new Error('تعذّر حذف الإشعارات');
  return {};
}

/* موجّه بسيط يحافظ على نفس الشكل اللي بقية الكود بيستخدمه (apiFetch(path, options)) */
async function apiFetch(path, options = {}){
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  let m;

  if(path === '/auth/register' && method === 'POST') return authRegister(body);
  if(path === '/auth/login' && method === 'POST') return authLogin(body);
  if(path === '/auth/me' && method === 'GET') return authMe();
  if(path === '/auth/change-password' && method === 'PUT') return authChangePassword(body);
  if(path === '/auth/avatar' && method === 'PUT') return authUpdateAvatar(body);
  if(path === '/auth/name' && method === 'PUT') return authUpdateName(body);
  if(path === '/auth/heartbeat' && method === 'PUT') return authHeartbeat();

  if(path === '/tasks' && method === 'GET') return tasksList();
  if(path === '/tasks' && method === 'POST') return tasksCreate(body);
  if((m = path.match(/^\/tasks\/(\d+)\/status$/)) && method === 'PUT') return tasksUpdateStatus(Number(m[1]), body);
  if((m = path.match(/^\/tasks\/(\d+)\/note$/)) && method === 'PUT') return tasksSaveNote(Number(m[1]), body.note);
  if((m = path.match(/^\/tasks\/(\d+)$/)) && method === 'PUT') return tasksUpdate(Number(m[1]), body);
  if((m = path.match(/^\/tasks\/(\d+)$/)) && method === 'DELETE') return tasksDelete(Number(m[1]));

  if(path === '/reports' && method === 'GET') return reportsList();
  if(path === '/reports' && method === 'POST') return reportsCreate(body);
  if((m = path.match(/^\/reports\/(\d+)\/postpone-approval$/)) && method === 'PUT') return reportsSetPostponeApproval(Number(m[1]), body.approved);
  if((m = path.match(/^\/reports\/(\d+)\/manager-note$/)) && method === 'PUT') return reportsSetManagerNote(Number(m[1]), body.note);
  if((m = path.match(/^\/reports\/(\d+)$/)) && method === 'PUT') return reportsUpdate(Number(m[1]), body);
  if((m = path.match(/^\/reports\/(\d+)$/)) && method === 'DELETE') return reportsDelete(Number(m[1]));

  if(path === '/users' && method === 'GET') return usersList();
  if(path === '/users' && method === 'POST') return usersCreate(body);
  if((m = path.match(/^\/users\/(\d+)\/approve$/)) && method === 'PUT') return usersApprove(Number(m[1]));
  if((m = path.match(/^\/users\/(\d+)\/toggle-status$/)) && method === 'PUT') return usersToggleStatus(Number(m[1]));
  if((m = path.match(/^\/users\/(\d+)\/role$/)) && method === 'PUT') return usersUpdateRole(Number(m[1]), body.role);
  if((m = path.match(/^\/users\/(\d+)\/negligence-exempt$/)) && method === 'PUT') return usersUpdateNegligenceExempt(Number(m[1]), !!body.exempt);
  if((m = path.match(/^\/users\/(\d+)\/department$/)) && method === 'PUT') return usersUpdateDepartment(Number(m[1]), body.departmentId ? Number(body.departmentId) : null);
  if((m = path.match(/^\/users\/(\d+)\/negligence-increase$/)) && method === 'PUT') return negligenceIncrease(Number(m[1]));
  if((m = path.match(/^\/users\/(\d+)\/negligence-decrease$/)) && method === 'PUT') return negligenceDecrease(Number(m[1]));
  if(path === '/negligence-forgiven-days' && method === 'GET') return negligenceForgivenDaysList();
  if((m = path.match(/^\/negligence-forgiven-days\/(\d+)\/(\d{4}-\d{2}-\d{2})$/)) && method === 'POST') return negligenceForgiveDay(Number(m[1]), m[2]);
  if((m = path.match(/^\/negligence-forgiven-days\/(\d+)\/(\d{4}-\d{2}-\d{2})$/)) && method === 'DELETE') return negligenceUnforgiveDay(Number(m[1]), m[2]);
  if((m = path.match(/^\/users\/(\d+)\/reset-password$/)) && method === 'PUT') return usersResetPassword(Number(m[1]), body.newPassword);
  if((m = path.match(/^\/users\/(\d+)$/)) && method === 'DELETE') return usersDelete(Number(m[1]));

  if(path === '/learning' && method === 'GET') return learningList();
  if(path === '/learning' && method === 'POST') return learningCreate(body);
  if((m = path.match(/^\/learning\/(\d+)\/status$/)) && method === 'PUT') return learningUpdateStatus(Number(m[1]), body.status);
  if((m = path.match(/^\/learning\/(\d+)$/)) && method === 'DELETE') return learningDelete(Number(m[1]));

  if(path === '/messages' && method === 'GET') return messagesList();
  if(path === '/messages' && method === 'POST') return messagesSend(body);
  if((m = path.match(/^\/messages\/(\d+)$/)) && method === 'DELETE') return messagesDelete(Number(m[1]));

  if(path === '/resource-columns' && method === 'GET') return resourceColumnsList();
  if(path === '/resource-columns' && method === 'POST') return resourceColumnsCreate(body);
  if((m = path.match(/^\/resource-columns\/(\d+)$/)) && method === 'DELETE') return resourceColumnsDelete(Number(m[1]));

  if(path === '/resources' && method === 'GET') return resourcesList();
  if(path === '/resources' && method === 'POST') return resourcesCreate(body);
  if((m = path.match(/^\/resources\/(\d+)$/)) && method === 'PUT') return resourcesUpdate(Number(m[1]), body);
  if((m = path.match(/^\/resources\/(\d+)$/)) && method === 'DELETE') return resourcesDelete(Number(m[1]));

  if(path === '/courses' && method === 'GET') return coursesList();
  if(path === '/courses' && method === 'POST') return courseCreate(body);
  if((m = path.match(/^\/courses\/(\d+)$/)) && method === 'PUT') return courseUpdate(Number(m[1]), body);
  if((m = path.match(/^\/courses\/(\d+)$/)) && method === 'DELETE') return courseDelete(Number(m[1]));
  if(path === '/course-categories' && method === 'GET') return courseCategoriesList();
  if(path === '/course-categories' && method === 'POST') return courseCategoryCreate(body.title);
  if((m = path.match(/^\/course-categories\/(\d+)$/)) && method === 'DELETE') return courseCategoryDelete(Number(m[1]));

  if(path === '/notifications' && method === 'GET') return notificationsList();
  if((m = path.match(/^\/notifications\/(\d+)\/read$/)) && method === 'PUT') return notificationsMarkRead(Number(m[1]));
  if(path === '/notifications/read-all' && method === 'PUT') return notificationsMarkAllRead();
  if(path === '/notifications' && method === 'DELETE') return notificationsDeleteAll();

  throw new Error('مسار غير مدعوم: ' + path);
}

/* ============================================================
   DATA — تخزين محلي مؤقت (Cache) يُعبَّأ من الـ API
   ============================================================ */
const state = {
  currentUser: null,
  activePage: 'tasks',
  users: [],
  tasks: [],
  reports: [],
  learning: [],
  messages: [],
  resources: [],
  resourceColumns: [],
  courses: [],
  courseCategories: [],
  notifications: [],
  negligenceForgivenDays: [],
  dataLoaded: false
};

/* يجلب البيانات المطلوبة لعرض الصفحة الحالية من الباك إند */
async function refreshData(){
  const isAdmin = state.currentUser && state.currentUser.role === 'admin';
  // /users لازم تتجاب لكل الأعضاء مش المدير بس — العضو محتاجها عشان يشوف زمايله
  // في صفحة "الشات" (اختيار مين يبعتله رسالة خاصة) وحالة الاتصال، مش بس المدير
  const jobs = [
    apiFetch('/tasks').then(d => { state.tasks = d.tasks || []; }),
    apiFetch('/reports').then(d => { state.reports = d.reports || []; }),
    apiFetch('/learning').then(d => { state.learning = d.learning || []; }),
    apiFetch('/users').then(d => { state.users = d.users || []; }),
    apiFetch('/resource-columns').then(d => { state.resourceColumns = d.columns || []; }),
    apiFetch('/resources').then(d => { state.resources = d.resources || []; }),
    apiFetch('/courses').then(d => { state.courses = d.courses || []; }),
    apiFetch('/course-categories').then(d => { state.courseCategories = d.categories || []; }),
    apiFetch('/notifications').then(d => { state.notifications = d.notifications || []; }).catch(() => {}),
    apiFetch('/negligence-forgiven-days').then(d => { state.negligenceForgivenDays = d.days || []; }).catch(() => {})
  ];
  await Promise.all(jobs);
  // خلي بيانات المستخدم الحالي (النقاط/التقصير/إلخ) متزامنة مع آخر نسخة
  // من قائمة الأعضاء بعد أي تحديث (تسجيل تقرير، إكمال مادة تعلم...)
  if(state.currentUser){
    const fresh = state.users.find(u => u.id === state.currentUser.id);
    if(fresh) state.currentUser = { ...state.currentUser, ...fresh };
  }
  if(isAdmin){
    // إعادة تقييم التقصير على السيرفر (بيوقف تلقائيًا مين وصل 6 أيام تقصير في الشهر)
    // — تُفرض فورًا بس في صفحة "التقارير"، وباقي الصفحات بتاخد النسخة المؤجّلة (throttled)
    await negligenceRecalcAll(state.activePage === 'reports');
    const d = await apiFetch('/users');
    state.users = d.users || [];
  }
}

/* ============================================================
   HELPERS
   ============================================================ */
/* ============================================================
   حالة الاتصال (Presence) — نبضة كل 45 ثانية تحدّث "آخر ظهور" بتاعتنا،
   + تحديث دوري لقائمة الأعضاء كل 30 ثانية عشان نشوف حالة زمايلنا محدّثة
   ============================================================ */
let presenceHeartbeatTimer = null;
let presencePollTimer = null;
function startPresence(){
  stopPresence();
  authHeartbeat().catch(() => {});
  presenceHeartbeatTimer = setInterval(() => authHeartbeat().catch(() => {}), 45000);
  presencePollTimer = setInterval(async () => {
    try {
      const d = await apiFetch('/users');
      state.users = d.users || [];
      refreshPresenceUI();
    } catch (err) { /* فشل هادئ أثناء التحديث الدوري */ }
  }, 30000);
  document.addEventListener('visibilitychange', onVisibilityPingPresence);
}
function stopPresence(){
  if(presenceHeartbeatTimer){ clearInterval(presenceHeartbeatTimer); presenceHeartbeatTimer = null; }
  if(presencePollTimer){ clearInterval(presencePollTimer); presencePollTimer = null; }
  document.removeEventListener('visibilitychange', onVisibilityPingPresence);
}
function onVisibilityPingPresence(){
  if(document.visibilityState === 'visible') authHeartbeat().catch(() => {});
}

/* ============================================================
   الإشعارات — إسناد مهمة / إنذارات تقصير (4 و5 أيام) / إيقاف عند 6 أيام
   ============================================================ */
const NOTIF_META = {
  task_assigned:       { icon: 'tasks', cls: '' },
  negligence_warning_4:{ icon: 'reports', cls: 'warn' },
  negligence_warning_5:{ icon: 'reports', cls: 'danger' },
  negligence_removed:  { icon: 'ban', cls: 'danger' },
  message_received:    { icon: 'chat', cls: '' }
};
let notifPollTimer = null;
function initNotifications(){
  refreshNotifications();
  if(notifPollTimer) clearInterval(notifPollTimer);
  notifPollTimer = setInterval(refreshNotifications, 20000);
}
function stopNotifications(){
  if(notifPollTimer){ clearInterval(notifPollTimer); notifPollTimer = null; }
}
async function refreshNotifications(){
  try {
    const d = await apiFetch('/notifications');
    state.notifications = d.notifications || [];
    renderNotifBell();
    if($('#notifPanel')?.classList.contains('open')) renderNotifList();
    // المستخدم أصلًا فاتح صفحة الشات — اعتبر أي إشعار رسالة جديد وصل دلوقتي مقروء فورًا
    if(state.activePage === 'chat') markChatNotificationsRead();
  } catch (err) { /* فشل هادئ أثناء التحديث الدوري */ }
}
function renderNotifBell(){
  const btn = $('#notifBellBtn');
  if(btn){
    const unread = state.notifications.filter(n => !n.isRead).length;
    btn.innerHTML = ICONS.bell + (unread ? `<span class="notif-bell-dot">${unread > 9 ? '9+' : unread}</span>` : '');
  }
  renderChatNavBadge();
}
/* علامة عدد الرسائل غير المقروءة جنب زرار "الشات" في القائمة الجانبية —
   مبنية على إشعارات النوع message_received (تُنشأ تلقائيًا من قاعدة البيانات
   عند وصول أي رسالة، خاصة أو في قناة الفريق) */
function renderChatNavBadge(){
  const el = $('#navChatBadge');
  if(!el) return;
  const count = state.notifications.filter(n => !n.isRead && n.type === 'message_received').length;
  el.textContent = count > 9 ? '9+' : String(count);
  el.style.display = count ? 'flex' : 'none';
}
/* لما المستخدم يفتح صفحة الشات، اعتبر إشعارات الرسائل الحالية مقروءة
   (العلامة بتختفي، وأي رسالة جديدة تظهر من تاني بعدين) */
async function markChatNotificationsRead(){
  const unread = state.notifications.filter(n => !n.isRead && n.type === 'message_received');
  if(!unread.length) return;
  unread.forEach(n => n.isRead = true);
  renderNotifBell();
  if($('#notifPanel')?.classList.contains('open')) renderNotifList();
  try {
    await Promise.all(unread.map(n => apiFetch(`/notifications/${n.id}/read`, { method: 'PUT' })));
  } catch (err) { /* فشل هادئ */ }
}
function notifTimeAgo(iso){
  if(!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if(mins < 1) return 'الآن';
  if(mins < 60) return `منذ ${mins} د`;
  const hrs = Math.floor(mins / 60);
  if(hrs < 24) return `منذ ${hrs} س`;
  return formatDate((new Date(iso)).toISOString().slice(0,10));
}
function renderNotifList(){
  const wrap = $('#notifListWrap');
  if(!wrap) return;
  if(!state.notifications.length){
    wrap.innerHTML = '<div class="notif-empty">لا توجد إشعارات حتى الآن</div>';
    return;
  }
  wrap.innerHTML = state.notifications.map(n => {
    const meta = NOTIF_META[n.type] || { icon: 'bell', cls: '' };
    return `
      <div class="notif-item ${n.isRead ? '' : 'unread'}" data-id="${n.id}">
        <div class="notif-item-icon ${meta.cls}">${ICONS[meta.icon] || ICONS.bell}</div>
        <div class="notif-item-body">
          <div class="notif-item-title">${escapeHtml(n.title)}</div>
          ${n.body ? `<div class="notif-item-desc">${escapeHtml(n.body)}</div>` : ''}
          <div class="notif-item-time">${notifTimeAgo(n.createdAt)}</div>
        </div>
      </div>
    `;
  }).join('');
  $$('.notif-item', wrap).forEach(el => el.addEventListener('click', async () => {
    const n = state.notifications.find(x => String(x.id) === el.dataset.id);
    if(n && !n.isRead){
      n.isRead = true;
      renderNotifBell();
      el.classList.remove('unread');
      try { await apiFetch(`/notifications/${n.id}/read`, { method: 'PUT' }); } catch (err) { /* فشل هادئ */ }
    }
  }));
}
function toggleNotifPanel(force){
  const panel = $('#notifPanel');
  if(!panel) return;
  const willOpen = force !== undefined ? force : !panel.classList.contains('open');
  panel.classList.toggle('open', willOpen);
  if(willOpen) renderNotifList();
}
document.addEventListener('click', (e) => {
  const panel = $('#notifPanel');
  const bellWrap = e.target.closest('.notif-bell-wrap');
  if(panel && panel.classList.contains('open') && !bellWrap) toggleNotifPanel(false);
});

const $ = (sel, ctx) => (ctx||document).querySelector(sel);
const $$ = (sel, ctx) => Array.from((ctx||document).querySelectorAll(sel));
const escapeHtml = (str) => String(str==null?'':str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

/* ============================================================
   تصدير بيانات لملف Excel (CSV) — بيفتح مباشرة في Excel أو Google Sheets.
   rows: مصفوفة مصفوفات (كل مصفوفة داخلية = صف)، أول صف = عناوين الأعمدة.
   ============================================================ */
function exportToCSV(filename, rows){
  const csvEscape = (val) => {
    const s = String(val == null ? '' : val);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csvContent = rows.map(row => row.map(csvEscape).join(',')).join('\r\n');
  /* BOM في البداية عشان Excel يقرأ الحروف العربية صح */
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : filename + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function todayStr(){
  const d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function formatDate(iso){
  if(!iso) return '—';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
/* اسم اليوم بالعربي (الأحد، الاثنين، ...) لتاريخ من نوع YYYY-MM-DD */
function dayNameAr(dateStr){
  if(!dateStr) return '';
  const [y,m,d] = dateStr.split('-').map(Number);
  return new Date(y, m-1, d).toLocaleDateString('ar-EG', { weekday: 'long' });
}
function formatDateWithDay(dateStr){
  if(!dateStr) return '—';
  return `${dayNameAr(dateStr)} ${formatDate(dateStr)}`;
}
const GRACE_CUTOFF_HOUR = 16; // الموعد النهائي المطلق (قفل اليوم): بعده تقصير كامل مباشرة = الساعة 4 عصرًا من اليوم التالي
const GRACE_LATE_START_HOUR = 13; // بداية نافذة "التأخير": قبلها التسجيل يعتبر على الوقت تمامًا رغم إنه في اليوم التالي = الساعة 1 ظهرًا
/* بيرجّع كائن Date "بديل" بمكوّنات الوقت الفعلية بتوقيت القاهرة (Africa/Cairo)
   لأي لحظة زمنية، بغض النظر عن توقيت جهاز/متصفح العضو نفسه — عشان
   getFullYear()/getMonth()/getDate()/getHours() المستخدمة أصلًا في كل حسابات
   نافذة المهلة (1 ظهرًا / 4 عصرًا) في نظام التقارير والتقصير تدّي نفس النتيجة
   اللي السيرفر (الشغال بتوقيت القاهرة فعليًا) هيوصلها بالظبط، بدل ما تعتمد على
   ضبط ساعة جهاز العضو (اللي ممكن يكون غلط أو على توقيت تاني). */
function toCairoLocal(date){
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
  }).formatToParts(date);
  const get = (t) => Number(parts.find(p => p.type === t).value);
  return new Date(get('year'), get('month')-1, get('day'), get('hour')%24, get('minute'), get('second'));
}
function formatTime(isoDateTime){
  if(!isoDateTime) return '—';
  const d = new Date(isoDateTime);
  return d.toLocaleTimeString('ar-EG', { hour:'2-digit', minute:'2-digit', hour12:true });
}
function formatDateTime(isoDateTime){
  if(!isoDateTime) return '—';
  const d = new Date(isoDateTime);
  const dateStr = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  return `${formatDate(dateStr)} — ${formatTime(isoDateTime)}`;
}
/* تقرير "متأخر" = اتسجل في اليوم التالي بعد الساعة 1 ظهرًا (ولسه قبل موعد القفل
   النهائي 4 عصرًا). لو اتسجل في اليوم التالي لكن قبل الساعة 1 ظهرًا → على الوقت
   تمامًا، صفر احتساب (سماحية). أي إن تاريخ الإنشاء الفعلي جاي بعد تاريخ اليوم
   المنسوب له التقرير (عمود date، اللي بيتحدد تلقائيًا من السيرفر وقت الحفظ)
   — الحساب هنا بتوقيت القاهرة دايمًا (toCairoLocal)، مش توقيت جهاز العضو */
function isReportLate(r){
  if(!r || !r.date || !r.createdAt) return false;
  const created = toCairoLocal(new Date(r.createdAt));
  const createdDateStr = created.getFullYear()+'-'+String(created.getMonth()+1).padStart(2,'0')+'-'+String(created.getDate()).padStart(2,'0');
  if(createdDateStr <= r.date) return false;
  return created.getHours() >= GRACE_LATE_START_HOUR;
}
/* تفصيل يومي لحالة عضو خلال شهر معيّن: كل يوم بحالته (على الوقت / تأخير / تقصير / مؤجّل بعذر)
   ووقت التسجيل الفعلي لو موجود — يُستخدم في عرض التفاصيل للمدير وفي حساب الإجمالي الشهري */
function dailyBreakdownForUser(userId, monthDate){
  const user = findUser(userId);
  if(!user) return [];
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const created = new Date(user.createdAt);
  const postponeDates = state.reports
    .filter(r => r.userId === userId && r.postponeUntil && r.postponeApproved === true)
    .map(r => r.postponeUntil)
    .sort();
  const postponeUntil = postponeDates.length ? postponeDates[postponeDates.length-1] : null;

  const now = toCairoLocal(new Date());
  const cutoffPassed = now.getHours() >= GRACE_CUTOFF_HOUR;
  // آخر يوم "اتقفل" فعليًا (فات موعده النهائي: الساعة 4 عصرًا اليوم التالي له)
  const lastFinal = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (cutoffPassed ? 1 : 2));

  const isCurrentMonth = monthDate.getFullYear()===now.getFullYear() && monthDate.getMonth()===now.getMonth();
  const lastDay = isCurrentMonth ? lastFinal : new Date(monthDate.getFullYear(), monthDate.getMonth()+1, 0);

  const rows = [];
  for(let d = new Date(Math.max(monthStart, created)); d <= lastDay; d.setDate(d.getDate()+1)){
    const dStr = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    // يوم الجمعة: إجازة كاملة (زي recalc_negligence على السيرفر — v16) — مفيش
    // احتساب عليه خالص، حتى لو فيه تقرير فعلي مسجّل بتاريخه
    if(isFridayDate(dStr)){
      rows.push({ date: dStr, status: 'holiday', time: null });
      continue;
    }
    // يوم اتلغى يدويًا بمعرفة السوبر أدمن (v24) — يُعرض بحالة مستقلة
    // ومفيش أي احتساب عليه خالص، بغض النظر عن وجود تقرير فيه أو لأ
    if(isNegligenceDayForgiven(userId, dStr)){
      rows.push({ date: dStr, status: 'forgiven', time: null });
      continue;
    }
    if(postponeUntil && dStr <= postponeUntil){
      rows.push({ date: dStr, status: 'postponed', time: null });
      continue;
    }
    const dayReport = state.reports.find(r => r.userId === userId && r.date === dStr);
    if(!dayReport){
      rows.push({ date: dStr, status: 'missing', time: null });
    } else if(isReportLate(dayReport)){
      rows.push({ date: dStr, status: 'late', time: dayReport.createdAt });
    } else {
      rows.push({ date: dStr, status: 'ontime', time: dayReport.createdAt });
    }
  }
  return rows.reverse(); // أحدث يوم فوق
}
/* حساب أيام التقصير لعضو خلال شهر معيّن (لأغراض العرض فقط — الإيقاف الفعلي يتم على قاعدة البيانات)
   يوم بدون تقرير خالص (بعد ما يفوت موعده النهائي) = تقصير كامل.
   يوم اتسجل في نافذة المهلة (متأخر) = نصف تقصير، وكل تأخيرتين يتحولوا ليوم تقصير واحد. */
function monthlyNegligentDays(userId, monthDate){
  const rows = dailyBreakdownForUser(userId, monthDate);
  const missedDates = rows.filter(r => r.status === 'missing').map(r => r.date);
  const late = rows.filter(r => r.status === 'late').length;
  const negligentFromLate = Math.floor(late / 2);
  // التعديل اليدوي التراكمي بتاع السوبر أدمن (0-6) — نفس منطق recalc_negligence
  // على السيرفر (v26): بيتضاف على الناتج الأوتوماتيكي، والمجموع محصور بين 0 و6
  const user = findUser(userId);
  const manual = (user && Number(user.negligenceManualAdjustment)) || 0;
  const days = Math.min(6, Math.max(0, missedDates.length + negligentFromLate + manual));
  return { days, missed: missedDates.length, late, list: missedDates };
}
/* بيتنبأ باليوم اللي هيتنسب له تقرير جديد لو اتحفظ دلوقتي — بنفس منطق تريجر
   السيرفر set_report_date_for_grace_window بالظبط، عشان نعرضه للعضو قبل الحفظ.
   لو اتسجل تقرير تاني فورًا بعد الأول، الأول بياخد اليوم الأقدم (أمس لو متاح)
   والتاني بياخد اللي بعده (النهارده)، لأن أمس بقى بقى عنده تقرير فمش هيتكرر. */
/* يوم الجمعة إجازة كاملة من نظام التقصير (زي ما هو مطبّق فعليًا في recalc_negligence
   على قاعدة البيانات — شوف supabase_migration_v16.sql): مفيش تقرير مطلوب فيه، ولو
   حد سجّل فعلًا وهو منسوب ليوم الجمعة نفسه (مش لخميس سابق لسه ما اتسجلش) فمفيش أي
   احتساب عليه (لا تأخير ولا على الوقت ولا تقصير) — بنعلّمه هنا بعلامة holiday:true
   عشان الواجهة تعرضه صح بدل ما توهم العضو إنه بيتحسب "على الوقت" فعليًا. */
function isFridayDate(dateStr){
  if(!dateStr) return false;
  const [y,m,d] = dateStr.split('-').map(Number);
  return new Date(y, m-1, d).getDay() === 5;
}
/* "النهاردة" بتوقيت القاهرة الحقيقي (مش توقيت جهاز العضو) — تُستخدم فقط في
   حسابات نافذة المهلة (1 ظهرًا/4 عصرًا)؛ باقي استخدامات todayStr() العادية
   (زي تاريخ استحقاق مهمة) لم تتغيّر عمدًا لأنها خارج نطاق نظام التقصير. */
function cairoTodayStr(){
  const n = toCairoLocal(new Date());
  return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
}
/* هل السوبر أدمن ألغى يوم تقصير/تأخير معيّن لعضو معيّن؟ (v24) — لو نعم،
   اليوم بيتعامل معاه زي إجازة الجمعة بالظبط: مفيش أي احتساب عليه خالص */
function isNegligenceDayForgiven(userId, dateStr){
  return state.negligenceForgivenDays.some(f => f.userId === userId && f.date === dateStr);
}
function predictedReportTarget(userId){
  const user = findUser(userId);
  if(!user) return { date: cairoTodayStr(), late: false, holiday: isFridayDate(cairoTodayStr()) };
  const now = toCairoLocal(new Date());
  const cutoffPassed = now.getHours() >= GRACE_CUTOFF_HOUR;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yStr = yesterday.getFullYear()+'-'+String(yesterday.getMonth()+1).padStart(2,'0')+'-'+String(yesterday.getDate()).padStart(2,'0');
  const hasYesterdayReport = state.reports.some(r => r.userId === userId && r.date === yStr);
  if(!cutoffPassed && yStr >= user.createdAt && !hasYesterdayReport){
    return { date: yStr, late: now.getHours() >= GRACE_LATE_START_HOUR, holiday: isFridayDate(yStr) };
  }
  const t = cairoTodayStr();
  return { date: t, late: false, holiday: isFridayDate(t) };
}
/* الأيام "المفتوحة" حاليًا لتسجيل تقرير، حسب نفس نظام المواعيد بالظبط
   (نظام الظهور/الاختفاء): قبل الساعة 4 عصرًا يظهر يوم أمس + النهاردة،
   بعد الساعة 4 عصرًا يختفي أمس ويفضل النهاردة بس. يوم واحد منهم بس هو
   "الهدف الفعلي" اللي التقرير الجديد فعليًا هيتسجل عنه (زي ما السيرفر
   بيحدده تلقائيًا في set_report_date_for_grace_window) — ده مش اختيار
   حر من العضو، لكن العرض هنا بيوريه بوضوح قبل ما يحفظ.  */
function openReportDaysInfo(userId){
  const user = findUser(userId);
  const now = toCairoLocal(new Date());
  const cutoffPassed = now.getHours() >= GRACE_CUTOFF_HOUR;
  const predicted = predictedReportTarget(userId);
  const t = cairoTodayStr();
  const days = [];
  if(!cutoffPassed){
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yStr = y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');
    if(!user || yStr >= user.createdAt){
      days.push({
        date: yStr,
        target: predicted.date === yStr,
        reported: state.reports.some(r => r.userId === userId && r.date === yStr),
        holiday: isFridayDate(yStr)
      });
    }
  }
  days.push({
    date: t,
    target: predicted.date === t,
    reported: state.reports.some(r => r.userId === userId && r.date === t),
    holiday: isFridayDate(t)
  });
  return days;
}
function dayPillHtml(d, predicted){
  let cls = 'day-pill';
  let sub;
  if(d.holiday){
    cls += ' active pill-grey';
    sub = '🌴 إجازة';
  } else if(d.target){
    cls += predicted.late ? ' active pill-amber' : ' active pill-green';
    sub = predicted.late ? '⏰ الهدف الحالي — متأخر' : '📅 الهدف الحالي — على الوقت';
  } else if(d.reported){
    cls += ' pill-done';
    sub = '✅ تم التسجيل عنه بالفعل';
  } else {
    sub = '⏸️ غير مفتوح للتسجيل الآن';
  }
  return `<div class="${cls}">${formatDateWithDay(d.date)}<small>${sub}</small></div>`;
}
function initials(name){
  if(!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0]||'') + (parts[1]?parts[1][0]:'');
}
/* تسمية الدور الظاهرة في الواجهة — ثلاث مستويات: سوبر أدمن / مدير / عضو
   (السوبر أدمن يشوف كل بيانات الفريق، المدير العادي يشوف أعضاء الفريق
   بس، والعضو يشوف بياناته هو فقط — نفس التقسيم المطبَّق فعليًا في RLS) */
function roleLabel(u){
  if(!u) return '';
  if(u.role === 'admin') return u.isSuperAdmin ? 'سوبر أدمن' : 'مدير';
  return 'عضو';
}
function findUser(id){ return state.users.find(u => u.id === id); }
function userTasks(userId){ return state.tasks.filter(t => t.assignedTo === userId); }
function userReports(userId){ return state.reports.filter(r => r.userId === userId); }
function negligenceCount(userId){ return state.reports.filter(r => r.userId === userId && r.status === 'لن يتم التعلم').length; }

function statusBadgeClass(status){
  if(status === 'تم التعلم' || status === 'مكتملة') return 'badge-green';
  if(status === 'يتم التعلم' || status === 'قيد التنفيذ') return 'badge-amber';
  if(status === 'لن يتم التعلم' || status === 'متأخرة') return 'badge-red';
  return 'badge-grey';
}
function priorityBadgeClass(p){
  if(p === 'عالية') return 'badge-red';
  if(p === 'متوسطة') return 'badge-amber';
  return 'badge-grey';
}

function toast(msg, type){
  const box = document.createElement('div');
  box.className = 'toast' + (type ? ' '+type : '');
  box.textContent = msg;
  $('#toastContainer').appendChild(box);
  setTimeout(() => box.remove(), 3200);
}

function avatarHtml(user, size){
  const cls = size === 'lg' ? 'avatar-lg' : 'avatar';
  if(user && user.avatar){
    return `<div class="${cls}"><img src="${user.avatar}" alt="${escapeHtml(user.name)}"></div>`;
  }
  return `<div class="${cls}">${escapeHtml(initials(user ? user.name : '?'))}</div>`;
}

/* حالة الاتصال: "متصل الآن" لو آخر نبضة (heartbeat) خلال آخر 90 ثانية، وإلا "آخر ظهور ..." */
const PRESENCE_ONLINE_WINDOW_MS = 90 * 1000;
function isOnline(user){
  if(!user || !user.lastSeenAt) return false;
  return (Date.now() - new Date(user.lastSeenAt).getTime()) < PRESENCE_ONLINE_WINDOW_MS;
}
function presenceLabel(user){
  if(isOnline(user)) return 'متصل الآن';
  if(!user || !user.lastSeenAt) return 'لم يفتح المنصة بعد';
  const diffMin = Math.floor((Date.now() - new Date(user.lastSeenAt).getTime()) / 60000);
  if(diffMin < 1) return 'آخر ظهور: الآن';
  if(diffMin < 60) return `آخر ظهور: منذ ${diffMin} دقيقة`;
  const diffHr = Math.floor(diffMin / 60);
  if(diffHr < 24) return `آخر ظهور: منذ ${diffHr} ساعة`;
  const diffDay = Math.floor(diffHr / 24);
  return `آخر ظهور: منذ ${diffDay} يوم`;
}
/* دائرة صغيرة فوق الأفاتار بتلوّن حسب حالة الاتصال */
function avatarWithPresence(user, size){
  const online = isOnline(user);
  return `<span class="presence-wrap" data-presence-user="${user ? user.id : ''}" title="${presenceLabel(user)}">
    ${avatarHtml(user, size)}
    <span class="presence-dot ${online ? 'online' : ''}"></span>
  </span>`;
}
/* شارة نصية (نقطة + كلام) تُستخدم في القوائم اللي مش شايلة أفاتار كبيرة */
function presenceLabelHtml(user){
  const online = isOnline(user);
  return `<span class="presence-label ${online ? 'online' : ''}" data-presence-label-user="${user ? user.id : ''}">${presenceLabel(user)}</span>`;
}
/* تحدّث كل نقاط/تسميات حالة الاتصال المعروضة حاليًا في الصفحة من غير ما تعيد رسم الصفحة كلها
   (عشان ما نبوظش تركيز حقل إدخال أو حاجة المستخدم بيكتبها وقت التحديث الدوري) */
function refreshPresenceUI(){
  $$('[data-presence-user]').forEach(el => {
    const id = Number(el.dataset.presenceUser);
    const user = findUser(id);
    if(!user) return;
    const dot = el.querySelector('.presence-dot');
    if(dot) dot.classList.toggle('online', isOnline(user));
    el.title = presenceLabel(user);
  });
  $$('[data-presence-label-user]').forEach(el => {
    const id = Number(el.dataset.presenceLabelUser);
    const user = findUser(id);
    if(!user) return;
    el.textContent = presenceLabel(user);
    el.classList.toggle('online', isOnline(user));
  });
}

/* ============================================================
   AUTH — تسجيل الدخول / إنشاء حساب / تسجيل الخروج
   ============================================================ */
function initAuthTabs(){
  $('#tabLoginBtn').addEventListener('click', () => switchAuthTab('login'));
  $('#tabRegisterBtn').addEventListener('click', () => switchAuthTab('register'));
}
function switchAuthTab(which){
  const isLogin = which === 'login';
  $('#tabLoginBtn').classList.toggle('active', isLogin);
  $('#tabRegisterBtn').classList.toggle('active', !isLogin);
  $('#loginForm').classList.toggle('hidden', !isLogin);
  $('#registerForm').classList.toggle('hidden', isLogin);
  $('#loginMsg').innerHTML = '';
  $('#registerMsg').innerHTML = '';
}

function showFormMsg(target, text, type){
  $(target).innerHTML = `<div class="form-msg ${type}">${escapeHtml(text)}</div>`;
}

function setFormBusy(form, busy){
  const btn = form.querySelector('button[type="submit"]');
  if(!btn) return;
  btn.disabled = busy;
  if(busy){
    btn.dataset.originalHtml = btn.dataset.originalHtml || btn.innerHTML;
    btn.innerHTML = `<span class="btn-spinner"></span> يرجى الانتظار...`;
  } else if(btn.dataset.originalHtml){
    btn.innerHTML = btn.dataset.originalHtml;
  }
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const email = $('#loginEmail').value.trim().toLowerCase();
  const password = $('#loginPassword').value;

  setFormBusy(form, true);
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    state.currentUser = data.user;
    form.reset();
    await enterApp();
  } catch (err) {
    showFormMsg('#loginMsg', err.message, 'err');
  } finally {
    setFormBusy(form, false);
  }
});

$('#registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const name = $('#regName').value.trim();
  const email = $('#regEmail').value.trim().toLowerCase();
  const username = $('#regUsername').value.trim().toLowerCase();
  const phone = $('#regPhone').value.trim();
  const pass = $('#regPassword').value;
  const pass2 = $('#regPassword2').value;

  if(name.length < 3){ showFormMsg('#registerMsg','يرجى كتابة الاسم الكامل.', 'err'); return; }
  if(!/^[A-Za-z0-9_.]{3,30}$/.test(username)){ showFormMsg('#registerMsg','اسم المستخدم لازم يكون حروف إنجليزية/أرقام فقط (من غير @ أو مسافات)، من 3 لـ30 حرف.', 'err'); return; }
  if(!/^[0-9]{11}$/.test(phone)){ showFormMsg('#registerMsg','رقم الهاتف لازم يكون 11 رقم بالظبط.', 'err'); return; }
  if(!pass){ showFormMsg('#registerMsg','يرجى كتابة كلمة المرور.', 'err'); return; }
  if(pass.length < 8){ showFormMsg('#registerMsg','كلمة المرور لازم تكون 8 أحرف على الأقل.', 'err'); return; }
  if(pass !== pass2){ showFormMsg('#registerMsg','كلمتا المرور غير متطابقتين.', 'err'); return; }

  setFormBusy(form, true);
  try {
    await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, username, phone, password: pass })
    });
    form.reset();
    showFormMsg('#registerMsg', 'تم إرسال طلبك بنجاح! سيتم إشعارك بعد موافقة المدير.', 'ok');
  } catch (err) {
    showFormMsg('#registerMsg', err.message, 'err');
  } finally {
    setFormBusy(form, false);
  }
});

/* ============================================================
   نسيت كلمة المرور — لينك إعادة تعيين بالإيميل
   ============================================================ */
function openForgotPwdModal(){
  $('#forgotPwdForm').reset();
  $('#forgotPwdMsg').innerHTML = '';
  $('#forgotPwdModalOverlay').classList.remove('hidden');
}
function closeForgotPwdModal(){
  $('#forgotPwdModalOverlay').classList.add('hidden');
}
$('#forgotPwdLink').addEventListener('click', openForgotPwdModal);
$('#forgotPwdModalClose').addEventListener('click', closeForgotPwdModal);
$('#forgotPwdCancelBtn').addEventListener('click', closeForgotPwdModal);
$('#forgotPwdModalOverlay').addEventListener('click', (e) => { if(e.target.id === 'forgotPwdModalOverlay') closeForgotPwdModal(); });

$('#forgotPwdForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const email = $('#fpEmail').value.trim().toLowerCase();
  setFormBusy(form, true);
  try {
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });
    if(error) throw error;
    showFormMsg('#forgotPwdMsg', 'لو الإيميل ده مسجّل عندنا، هيوصلك لينك إعادة تعيين كلمة المرور خلال دقائق. راجع صندوق الوارد (وكمان مجلد الرسائل غير المرغوبة/Spam).', 'ok');
    form.reset();
  } catch (err) {
    showFormMsg('#forgotPwdMsg', 'تعذّر إرسال اللينك، حاول مرة أخرى.', 'err');
  } finally {
    setFormBusy(form, false);
  }
});

/* هذا الفورم بيظهر تلقائيًا (عبر onAuthStateChange فوق) لما العضو يدوس على
   لينك إعادة التعيين اللي وصله بالإيميل — مش من غير ما يمر بيها */
$('#recoverySetPwdForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const p1 = $('#recNewPass').value;
  const p2 = $('#recNewPass2').value;
  if(!p1){ showFormMsg('#recoverySetPwdMsg', 'يرجى كتابة كلمة المرور الجديدة.', 'err'); return; }
  if(p1.length < 8){ showFormMsg('#recoverySetPwdMsg', 'كلمة المرور لازم تكون 8 أحرف على الأقل.', 'err'); return; }
  if(p1 !== p2){ showFormMsg('#recoverySetPwdMsg', 'كلمتا المرور غير متطابقتين.', 'err'); return; }
  setFormBusy(form, true);
  try {
    const { error } = await sb.auth.updateUser({ password: p1 });
    if(error) throw new Error('تعذّر تغيير كلمة المرور، يمكن اللينك انتهت صلاحيته — اطلب لينك جديد.');
    await sb.auth.signOut();
    $('#recoverySetPwdOverlay').classList.add('hidden');
    $('#authScreen').classList.remove('hidden');
    switchAuthTab('login');
    toast('تم تغيير كلمة المرور بنجاح، سجّل الدخول بكلمة المرور الجديدة', 'ok');
  } catch (err) {
    showFormMsg('#recoverySetPwdMsg', err.message, 'err');
  } finally {
    setFormBusy(form, false);
  }
});
$('#recoverySetPwdLogoutBtn').addEventListener('click', async () => {
  await sb.auth.signOut();
  $('#recoverySetPwdOverlay').classList.add('hidden');
  $('#authScreen').classList.remove('hidden');
  switchAuthTab('login');
});

async function logout(){
  stopChatPolling();
  stopPresence();
  stopNotifications();
  await removePushSubscription();
  await sb.auth.signOut();
  setToken(null);
  state.currentUser = null;
  state.users = [];
  state.tasks = [];
  state.reports = [];
  state.learning = [];
  state.messages = [];
  state.resources = [];
  state.resourceColumns = [];
  state.courses = [];
  state.courseCategories = [];
  state.notifications = [];
  state.negligenceForgivenDays = [];
  state.dataLoaded = false;
  $('#appScreen').classList.add('hidden');
  $('#authScreen').classList.remove('hidden');
  switchAuthTab('login');
  toast('تم تسجيل الخروج بنجاح');
}

/* Password show/hide toggles (delegated) */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.pwd-toggle');
  if(!btn) return;
  const input = document.getElementById(btn.dataset.target);
  if(!input) return;
  const isPwd = input.type === 'password';
  input.type = isPwd ? 'text' : 'password';
  btn.innerHTML = isPwd ? ICONS.eyeOff : ICONS.eye;
  btn.setAttribute('aria-label', isPwd ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
});
$$('.pwd-toggle').forEach(btn => btn.innerHTML = ICONS.eye);

/* ============================================================
   مؤشر قوة كلمة المرور — بيشتغل تلقائيًا على أي حقل type="password"
   له عنصر مؤشر مجاور بـ id = <id-الحقل>+"Strength" (زي regPasswordStrength
   لحقل regPassword). مفيش داعي لربط يدوي في كل فورم — مفوّض (delegated)
   على مستوى المستند كله، فبيشتغل حتى مع الفورمات اللي بترندر ديناميكيًا.
   ============================================================ */
function passwordStrengthScore(pwd){
  if(!pwd) return 0;
  let score = 0;
  if(pwd.length >= 8) score++;
  if(pwd.length >= 12) score++;
  if(/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if(/[0-9]/.test(pwd)) score++;
  if(/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4);
}
const PASSWORD_STRENGTH_INFO = [
  { label:'ضعيفة جدًا', color:'var(--red-500)' },
  { label:'ضعيفة', color:'var(--red-500)' },
  { label:'متوسطة', color:'var(--amber-500)' },
  { label:'قوية', color:'var(--green-500)' },
  { label:'قوية جدًا', color:'#17b37e' }
];
document.addEventListener('input', (e) => {
  const input = e.target;
  if(!(input.tagName === 'INPUT' && input.type === 'password')) return;
  const meter = document.getElementById(input.id + 'Strength');
  if(!meter) return;
  const pwd = input.value;
  if(!pwd){ meter.innerHTML = ''; return; }
  const score = passwordStrengthScore(pwd);
  const info = PASSWORD_STRENGTH_INFO[score];
  meter.innerHTML = `
    <div class="pwd-strength-bar"><div class="pwd-strength-fill" style="width:${(score+1)*20}%; background:${info.color};"></div></div>
    <span class="pwd-strength-label" style="color:${info.color};">${info.label}${pwd.length < 8 ? ' — لازم 8 أحرف على الأقل' : ''}</span>
  `;
});

/* ============================================================
   APP SHELL — التنقل والقائمة الجانبية
   ============================================================ */
const NAV_ITEMS = [
  {key:'tasks', label:'المهام', icon:'tasks'},
  {key:'reports', label:'التقارير', icon:'reports'},
  {key:'team', label:'متابعة الفريق', icon:'trophy', adminOnly:true},
  {key:'learning', label:'التعليم', icon:'bulb'},
  {key:'resources', label:'مصادر التعلم', icon:'book'},
  {key:'courses', label:'الكورسات', icon:'grad'},
  {key:'chat', label:'الشات', icon:'chat'},
  {key:'members', label:'الأعضاء', icon:'members', adminOnly:true},
  {key:'settings', label:'الإعدادات', icon:'settings'}
];

async function enterApp(showWelcome){
  if(needsProfileCompletion(state.currentUser)){
    showProfileCompletionModal();
    return;
  }
  $('#profileCompleteOverlay').classList.add('hidden');
  $('#authScreen').classList.add('hidden');
  $('#appScreen').classList.remove('hidden');
  state.activePage = resolveActivePage();
  // نرسم الواجهة فورًا (حتى لو فاضية أول مرة) بدل ما ننتظر كل طلبات
  // البيانات تخلص الأول — كده المستخدم يشوف الموقع فتح فعلًا بسرعة.
  // أول مرة (لسه مفيش بيانات في الكاش) بنعرض هيكل تحميل (Skeleton)
  // بدل ما نعرض "لا توجد بيانات" وهمي لحد ما البيانات توصل فعلًا.
  renderSidebar();
  renderTopbar();
  renderPage();
  try {
    await refreshData();
  } catch (err) {
    toast(err.message, 'err');
  }
  state.dataLoaded = true;
  startPresence();
  initNotifications();
  initPushSubscription();
  if(state.activePage === 'chat') markChatNotificationsRead();
  renderSidebar();
  renderTopbar();
  renderPage();
  if(showWelcome !== false){
    toast(`أهلًا بك، ${state.currentUser.name.split(' ')[0]} 👋`, 'ok');
  }
}

/* حساب أنشأه المدير مباشرة (إيميل + اسم + كلمة سر بس) هيكون username/phone
   فاضيين — لازم يكملهم قبل ما يشوف أي حاجة تانية في النظام */
function needsProfileCompletion(u){
  return !!u && (!u.username || !u.phone);
}
function showProfileCompletionModal(){
  $('#authScreen').classList.add('hidden');
  $('#appScreen').classList.add('hidden');
  $('#profileCompleteMsg').innerHTML = '';
  $('#pcUsername').value = '';
  $('#pcPhone').value = '';
  $('#profileCompleteOverlay').classList.remove('hidden');
}
$('#profileCompleteLogoutBtn').addEventListener('click', async () => {
  $('#profileCompleteOverlay').classList.add('hidden');
  await logout();
});
$('#profileCompleteForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const username = $('#pcUsername').value.trim().toLowerCase();
  const phone = $('#pcPhone').value.trim();
  if(!/^[A-Za-z0-9_.]{3,30}$/.test(username)){
    showFormMsg('#profileCompleteMsg','اسم المستخدم لازم يكون حروف إنجليزية/أرقام فقط (من غير @ أو مسافات)، من 3 لـ30 حرف.', 'err');
    return;
  }
  if(!/^[0-9]{11}$/.test(phone)){
    showFormMsg('#profileCompleteMsg','رقم الهاتف لازم يكون 11 رقم بالظبط.', 'err');
    return;
  }
  setFormBusy(form, true);
  try {
    const { data: { session } } = await sb.auth.getSession();
    if(!session) throw new Error('غير مسجل الدخول');
    const { data, error } = await sb.from('users')
      .update({ username, phone })
      .eq('authId', session.user.id).select().single();
    if(error){
      const msg = String(error.message || '').toLowerCase();
      if(msg.includes('username') || msg.includes('idx_users_username')) throw new Error('اسم المستخدم ده مستخدم بالفعل، جرّب اسم تاني');
      throw new Error('تعذّر حفظ البيانات، حاول مرة أخرى');
    }
    state.currentUser = data;
    form.reset();
    await enterApp();
  } catch (err) {
    showFormMsg('#profileCompleteMsg', err.message, 'err');
  } finally {
    setFormBusy(form, false);
  }
});

/* حفظ آخر صفحة مفتوحة محليًا، عشان لو حصل تحديث (Refresh) للصفحة نرجع لنفس الصفحة
   المطلوبة بدل ما نرجع دايمًا لصفحة "المهام" */
const ACTIVE_PAGE_KEY = 'teamflow_active_page';
function resolveActivePage(){
  const isAdmin = state.currentUser && state.currentUser.role === 'admin';
  const saved = localStorage.getItem(ACTIVE_PAGE_KEY);
  const item = NAV_ITEMS.find(i => i.key === saved && (!i.adminOnly || isAdmin));
  return item ? item.key : 'tasks';
}

/* استعادة الجلسة تلقائيًا إذا كان هناك توكن محفوظ من زيارة سابقة */
async function tryRestoreSession(){
  const { data: { session } } = await sb.auth.getSession();
  if(!session){
    $('#sessionCheckOverlay').classList.add('hidden');
    return;
  }
  try {
    const data = await apiFetch('/auth/me');
    state.currentUser = data.user;
    // بمجرد ما نتأكد إن الجلسة صحيحة، نقفل شاشة "جاري التحقق من الجلسة"
    // فورًا — بدل ما نستنى تحميل كل بيانات الموقع (اللي ممكن تاخد ثواني)
    $('#sessionCheckOverlay').classList.add('hidden');
    await enterApp(false);
  } catch (err) {
    setToken(null);
    $('#sessionCheckOverlay').classList.add('hidden');
  }
}

function renderSidebar(){
  const isAdmin = state.currentUser.role === 'admin';
  $('#navList').innerHTML = NAV_ITEMS
    .filter(item => !item.adminOnly || isAdmin)
    .map(item => `
      <li>
        <button class="nav-item ${state.activePage===item.key?'active':''}" data-page="${item.key}">
          ${ICONS[item.icon]} <span>${item.label}</span>
          ${item.key==='chat' ? '<span class="nav-badge" id="navChatBadge"></span>' : ''}
        </button>
      </li>
    `).join('');
  renderChatNavBadge();

  $$('#navList .nav-item').forEach(btn => {
    btn.addEventListener('click', async () => {
      state.activePage = btn.dataset.page;
      localStorage.setItem(ACTIVE_PAGE_KEY, state.activePage);
      courseAddingRow = false;
      courseEditingId = null;
      if(state.activePage === 'chat') markChatNotificationsRead();
      closeSidebarMobile();
      renderSidebar();
      renderTopbar();
      // اعرض الصفحة فورًا بالبيانات المتاحة حاليًا في الكاش، بدل ما ننتظر
      // تحميل كل بيانات الموقع (7+ استعلامات) قبل ما نغيّر المحتوى — ده كان
      // السبب في إن الضغط على "الإعدادات" (مثلًا) يغيّر العنوان فورًا بس
      // يسيب محتوى الصفحة القديمة (الشات) شغال وظاهر لحد ما التحميل يخلص
      renderPage();
      try { await refreshData(); renderPage(); } catch (err) { toast(err.message, 'err'); }
    });
  });

  const shareBtnSide = $('#sidebarShareBtn');
  shareBtnSide.innerHTML = `${ICONS.share} <span>مشاركة التطبيق</span>`;
  shareBtnSide.onclick = shareApp;

  const logoutBtn = $('#logoutBtn');
  logoutBtn.innerHTML = `${ICONS.logout} <span>تسجيل الخروج</span>`;
  logoutBtn.onclick = logout;
}

/* مشاركة رابط التطبيق — يستخدم واجهة المشاركة الأصلية بالموبايل لو متاحة
   (يفتح قائمة "مشاركة" النظام: واتساب، رسائل، إلخ)، وإلا ينسخ الرابط */
async function shareApp(){
  const shareData = {
    title: 'IT_qan — منصة إدارة الفريق',
    text: 'انضم إلينا على منصة IT_qan لإدارة الفريق',
    url: window.location.href
  };
  if(navigator.share){
    try { await navigator.share(shareData); }
    catch (err) { /* المستخدم لغى المشاركة — تجاهل هادئ */ }
    return;
  }
  try {
    await navigator.clipboard.writeText(shareData.url);
    toast('تم نسخ رابط التطبيق', 'ok');
  } catch (err) {
    toast(shareData.url, 'ok');
  }
}

/* ===== الوضع الليلي (Dark Mode) ===== */
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  try{ localStorage.setItem('itqan_theme', theme); }catch(e){}
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content', theme === 'dark' ? '#0A0E1C' : '#F2F4FA');
  const btn = $('#themeToggleBtn');
  if(btn){
    btn.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
    btn.setAttribute('aria-label', theme === 'dark' ? 'تبديل إلى الوضع النهاري' : 'تبديل إلى الوضع الليلي');
    const icon = btn.querySelector('.icon');
    if(icon){
      icon.classList.remove('icon-spin');
      void icon.offsetWidth;
      icon.classList.add('icon-spin');
    }
  }
}
function currentTheme(){
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}
function initThemeToggle(){
  applyTheme(currentTheme());
  $('#themeToggleBtn').addEventListener('click', () => {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });
}

function renderTopbar(){
  const item = NAV_ITEMS.find(i => i.key === state.activePage);
  $('#pageTitleTop').textContent = item ? item.label : '';
  const u = state.currentUser;
  $('#userChip').innerHTML = `
    ${avatarHtml(u)}
    <div class="user-chip-info">
      <div class="user-chip-name">${escapeHtml(u.name)}</div>
      <div class="user-chip-role">${roleLabel(u)}</div>
    </div>
  `;
  $('#userMenuPanel').innerHTML = `
    <div class="user-menu-head">
      ${avatarHtml(u)}
      <div class="user-chip-info">
        <div class="user-chip-name">${escapeHtml(u.name)}</div>
        <div class="user-chip-role">${roleLabel(u)}</div>
      </div>
    </div>
    <button type="button" class="user-menu-item" id="userMenuSettingsBtn">${ICONS.settings} <span>الإعدادات</span></button>
    <button type="button" class="user-menu-item" id="userMenuShareBtn">${ICONS.share} <span>مشاركة التطبيق</span></button>
    <button type="button" class="user-menu-item danger" id="userMenuLogoutBtn">${ICONS.logout} <span>تسجيل الخروج</span></button>
  `;
  $('#userMenuSettingsBtn').onclick = async () => {
    toggleUserMenu(false);
    state.activePage = 'settings';
    localStorage.setItem(ACTIVE_PAGE_KEY, state.activePage);
    closeSidebarMobile();
    renderSidebar();
    renderTopbar();
    renderPage();
    try { await refreshData(); renderPage(); } catch (err) { toast(err.message, 'err'); }
  };
  $('#userMenuShareBtn').onclick = () => { toggleUserMenu(false); shareApp(); };
  $('#userMenuLogoutBtn').onclick = () => { toggleUserMenu(false); logout(); };
  $('#hamburgerBtn').innerHTML = ICONS.menu;
}

function toggleUserMenu(force){
  const panel = $('#userMenuPanel');
  if(!panel) return;
  const willOpen = force !== undefined ? force : !panel.classList.contains('open');
  panel.classList.toggle('open', willOpen);
}
$('#userChip').addEventListener('click', (e) => { e.stopPropagation(); toggleUserMenu(); });
document.addEventListener('click', (e) => {
  const panel = $('#userMenuPanel');
  const chipWrap = e.target.closest('#userChipWrap');
  if(panel && panel.classList.contains('open') && !chipWrap) toggleUserMenu(false);
});

$('#hamburgerBtn').addEventListener('click', () => {
  $('#sidebar').classList.toggle('open');
  $('#sidebarOverlay').classList.toggle('show');
});
$('#sidebarOverlay').addEventListener('click', closeSidebarMobile);

$('#notifBellBtn').addEventListener('click', (e) => { e.stopPropagation(); toggleNotifPanel(); });
$('#notifMarkAllBtn').addEventListener('click', async () => {
  if(!state.notifications.some(n => !n.isRead)) return;
  state.notifications.forEach(n => n.isRead = true);
  renderNotifBell();
  renderNotifList();
  try { await apiFetch('/notifications/read-all', { method: 'PUT' }); } catch (err) { toast(err.message, 'err'); }
});
$('#notifDeleteAllBtn').addEventListener('click', async () => {
  if(!state.notifications.length) return;
  if(!confirm('هل تريد حذف كل الإشعارات نهائيًا؟')) return;
  const prev = state.notifications;
  state.notifications = [];
  renderNotifBell();
  renderNotifList();
  try { await apiFetch('/notifications', { method: 'DELETE' }); }
  catch (err) { state.notifications = prev; renderNotifBell(); renderNotifList(); toast(err.message, 'err'); }
});
function closeSidebarMobile(){
  $('#sidebar').classList.remove('open');
  $('#sidebarOverlay').classList.remove('show');
}

function renderPage(){
  if(state.activePage !== 'chat') stopChatPolling();
  const content = $('#pageContent');
  content.classList.remove('page-content-fade');
  void content.offsetWidth;
  content.classList.add('page-content-fade');
  if(!state.dataLoaded){
    content.innerHTML = skeletonPageHtml(state.activePage);
    return;
  }
  if(state.activePage === 'tasks') content.innerHTML = pageTasks();
  else if(state.activePage === 'reports') content.innerHTML = pageReports();
  else if(state.activePage === 'team') content.innerHTML = pageTeamOverview();
  else if(state.activePage === 'learning') content.innerHTML = pageLearning();
  else if(state.activePage === 'resources') content.innerHTML = pageResources();
  else if(state.activePage === 'courses') content.innerHTML = pageCourses();
  else if(state.activePage === 'chat') content.innerHTML = pageChat();
  else if(state.activePage === 'members') content.innerHTML = pageMembers();
  else if(state.activePage === 'settings') content.innerHTML = pageSettings();
  bindPageEvents();
}

/* ============================================================
   Skeleton Loading — هيكل تحميل بسيط بدل شاشة فاضية أو "لا توجد
   بيانات" وهمية وقت أول تحميل للبيانات (قبل ما refreshData يخلص)
   ============================================================ */
function skeletonBar(width){
  return `<div class="skel-bar" style="width:${width}"></div>`;
}
function skeletonCard(){
  return `<div class="skel-card">${skeletonBar('40%')}${skeletonBar('70%')}${skeletonBar('55%')}</div>`;
}
function skeletonStatGrid(count){
  return `<div class="stat-grid">${Array.from({length:count}, () => `
    <div class="stat-card skel-stat"><div class="skel-bar" style="width:35%;height:22px;margin-bottom:8px;"></div><div class="skel-bar" style="width:60%;height:11px;"></div></div>
  `).join('')}</div>`;
}
function skeletonTable(rows){
  return `<div class="table-wrap"><table><tbody>${Array.from({length:rows}, () => `
    <tr><td colspan="4"><div class="skel-bar" style="width:100%;height:14px;"></div></td></tr>
  `).join('')}</tbody></table></div>`;
}
function skeletonPageHtml(page){
  const titleWidths = { tasks:'المهام', reports:'التقارير', team:'متابعة الفريق', learning:'التعليم', resources:'مصادر التعلم', courses:'الكورسات', chat:'الشات', members:'الأعضاء', settings:'الإعدادات' };
  const title = titleWidths[page] || '';
  if(page === 'team'){
    return `
      <div class="page-head"><div><h1>${title}</h1><div class="skel-bar" style="width:220px;margin-top:8px;"></div></div></div>
      ${skeletonStatGrid(6)}
      <div class="section-block">${skeletonCard()}${skeletonTable(4)}</div>
    `;
  }
  if(page === 'reports'){
    return `
      <div class="page-head"><div><h1>${title}</h1><div class="skel-bar" style="width:260px;margin-top:8px;"></div></div></div>
      ${skeletonStatGrid(4)}
      <div class="section-block">${skeletonCard()}</div>
      <div class="section-block">${skeletonTable(5)}</div>
    `;
  }
  if(page === 'chat'){
    return `
      <div class="page-head"><div><h1>${title}</h1></div></div>
      <div class="card" style="padding:20px;">${skeletonBar('30%')}${skeletonBar('55%')}${skeletonBar('40%')}${skeletonBar('60%')}</div>
    `;
  }
  return `
    <div class="page-head"><div><h1>${title}</h1><div class="skel-bar" style="width:200px;margin-top:8px;"></div></div></div>
    <div class="grid-cards">${skeletonCard()}${skeletonCard()}${skeletonCard()}</div>
  `;
}

/* ============================================================
   PAGE: المهام
   ============================================================ */
function pageTasks(){
  const isAdmin = state.currentUser.role === 'admin';
  const list = isAdmin ? state.tasks : userTasks(state.currentUser.id);

  const statsHtml = isAdmin ? `
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-num">${state.tasks.length}</div><div class="stat-label">إجمالي المهام</div></div>
      <div class="stat-card"><div class="stat-num">${state.tasks.filter(t=>t.status==='مكتملة').length}</div><div class="stat-label">مهام مكتملة</div></div>
      <div class="stat-card"><div class="stat-num">${state.users.filter(u=>u.status==='pending').length}</div><div class="stat-label">طلبات بانتظار الموافقة</div></div>
      <div class="stat-card"><div class="stat-num">${state.users.filter(u=>u.role==='member' && u.status==='active').length}</div><div class="stat-label">أعضاء نشطون</div></div>
    </div>` : '';

  const cardsHtml = list.length ? `<div class="grid-cards">${list.map(t => taskCard(t, isAdmin)).join('')}</div>` : emptyState('tasks', 'لا توجد مهام حاليًا', isAdmin ? 'ابدأ بإنشاء أول مهمة لفريقك' : 'لم يتم إسناد مهام لك بعد');

  return `
    <div class="page-head">
      <div>
        <h1>المهام</h1>
        <p>${isAdmin ? 'إدارة ومتابعة كل مهام الفريق' : `لديك ${userTasks(state.currentUser.id).filter(t=>t.status!=='مكتملة').length} مهمة قيد التنفيذ`}</p>
      </div>
      ${isAdmin ? `<button class="btn btn-amber" id="openTaskModalBtn">${ICONS.plus} مهمة جديدة</button>` : ''}
    </div>
    ${statsHtml}
    ${cardsHtml}
  `;
}

function taskCard(t, isAdmin){
  const assignee = findUser(t.assignedTo);
  const overdue = t.dueDate < todayStr() && t.status !== 'مكتملة';
  const isOwner = state.currentUser.id === t.assignedTo;
  return `
    <div class="task-card">
      <div class="task-top">
        <div class="task-title">${escapeHtml(t.title)}</div>
        <span class="badge ${priorityBadgeClass(t.priority)}">${t.priority}</span>
      </div>
      ${t.description ? `<div class="task-desc">${escapeHtml(t.description)}</div>` : ''}
      <div class="task-meta">
        ${isAdmin ? `<span class="cell-user">${avatarHtml(assignee)} ${escapeHtml(assignee ? assignee.name : '—')}</span>` : ''}
        <span class="${overdue ? 'overdue' : ''}">📅 ${formatDate(t.dueDate)}</span>
      </div>
      ${t.completedAt ? `<div class="task-meta"><span>✅ اكتملت في ${formatDateTime(t.completedAt)}</span></div>` : ''}
      ${t.attachment ? `<div class="task-meta"><a href="${t.attachment}" target="_blank" rel="noopener">📎 ${escapeHtml(t.attachmentName || 'مرفق')}</a></div>` : (isAdmin ? `<div class="task-meta" style="color:var(--text-400);">📎 لم يتم رفع أي ملف</div>` : '')}
      ${t.completionNote ? `<div class="task-desc" style="background:var(--bg); border-radius:8px; padding:8px 10px;">📝 ${escapeHtml(t.completionNote)}</div>` : ''}
      <div class="task-actions">
        <span class="badge ${statusBadgeClass(t.status)}">${overdue ? 'متأخرة' : t.status}</span>
        ${!isAdmin ? `
          <select class="task-status-select" data-task="${t.id}" aria-label="تحديث حالة المهمة">
            <option value="قيد التنفيذ" ${t.status==='قيد التنفيذ'?'selected':''}>قيد التنفيذ</option>
            <option value="مكتملة" ${t.status==='مكتملة'?'selected':''}>مكتملة</option>
          </select>` : ''}
        ${isOwner ? `
          <button type="button" class="btn btn-ghost btn-sm attach-task-btn" data-id="${t.id}">${ICONS.camera} إرفاق ملف</button>
          <input type="file" class="hidden attach-task-input" data-id="${t.id}">
        ` : ''}
        ${isAdmin ? `
          <button class="btn btn-ghost btn-sm btn-icon edit-task-btn" data-id="${t.id}" aria-label="تعديل">${ICONS.edit}</button>
          <button class="btn btn-danger btn-sm btn-icon delete-task-btn" data-id="${t.id}" aria-label="حذف">${ICONS.trash}</button>
        ` : ''}
      </div>
      ${isOwner ? `
        <div class="task-note-row" style="display:flex; gap:8px; align-items:flex-start; margin-top:2px;">
          <textarea class="task-note-input" data-id="${t.id}" placeholder="اكتب ملاحظة عن إنجاز المهمة (اختياري)..." style="flex:1; min-height:44px; resize:vertical; font-size:12.5px; border:1.5px solid var(--border); border-radius:8px; padding:8px 10px;">${escapeHtml(t.completionNote || '')}</textarea>
          <button type="button" class="btn btn-ghost btn-sm save-note-btn" data-id="${t.id}">حفظ الملاحظة</button>
        </div>
      ` : ''}
    </div>
  `;
}

function emptyState(icon, title, desc){
  return `<div class="empty-state card">${ICONS[icon]}<h3>${title}</h3><p>${desc}</p></div>`;
}

/* ============================================================
   PAGE: التقارير
   ============================================================ */
let reportPickedStatus = null;

function pageReports(){
  const isAdmin = state.currentUser.role === 'admin';
  return isAdmin ? reportsAdminView() : reportsMemberView();
}

function myReportSubmissionSection(){
  const myTasks = userTasks(state.currentUser.id);
  const myReports = userReports(state.currentUser.id).slice().sort((a,b) => b.date.localeCompare(a.date));
  const predicted = predictedReportTarget(state.currentUser.id);

  const openDays = openReportDaysInfo(state.currentUser.id);
  return `
    <div class="card" style="padding:22px; margin-bottom:26px;">
      <h3 class="section-title">${ICONS.bulb} تقرير جديد</h3>
      <div class="form-row">
        <label>يوم التسجيل (يتحدد تلقائيًا حسب نظام المواعيد — 1 ظهرًا / 4 عصرًا)</label>
        <div class="day-pills">${openDays.map(d => dayPillHtml(d, predicted)).join('')}</div>
        <div style="font-size:12px; color:var(--text-400); margin-top:2px;">
          ${predicted.holiday
            ? '🌴 يوم إجازة، مفيش تقرير مطلوب فيه، وتسجيلك (لو حبيت) مش هياخد ولا يفقّد أي نقطة'
            : (predicted.late ? '⏰ متأخر — آخر موعد لتسجيله الساعة 4 عصرًا النهارده' : '📅 على الوقت — في حدود سماحية اليوم التالي لحد الساعة 1 ظهرًا')}
        </div>
      </div>
      <form id="reportForm">
        <div class="form-row">
          <label for="reportTask">المهمة المرتبطة (اختياري)</label>
          <select id="reportTask">
            <option value="">بدون مهمة محددة</option>
            ${myTasks.map(t => `<option value="${t.id}">${escapeHtml(t.title)}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label>حالة التعلم</label>
          <div class="status-pills" id="statusPills">
            <button type="button" class="status-pill" data-status="تم التعلم" data-cls="picked-green">✅ تم التعلم</button>
            <button type="button" class="status-pill" data-status="يتم التعلم" data-cls="picked-amber">⏳ يتم التعلم</button>
            <button type="button" class="status-pill" data-status="لن يتم التعلم" data-cls="picked-red">✖️ لن يتم التعلم</button>
          </div>
        </div>
        <div class="form-row hidden" id="postponeRow">
          <label for="reportPostpone">مؤجّل لحد تاريخ (اختياري — لن يُحتسب تقصيرًا حتى هذا التاريخ)</label>
          <input type="date" id="reportPostpone" min="${todayStr()}">
        </div>
        <div class="form-row">
          <label for="reportDesc">وصف ما تم تعلمه</label>
          <textarea id="reportDesc" required placeholder="اكتب تفاصيل ما تعلمته أو ما واجهته اليوم..."></textarea>
        </div>
        <div style="font-size:12px; color:var(--text-400); margin-bottom:14px;">
          سيتم حفظ اسم المستخدم (${escapeHtml(state.currentUser.name)}) تلقائيًا مع التقرير.
        </div>
        <button type="submit" class="btn btn-primary">حفظ التقرير</button>
      </form>
    </div>

    <h3 class="section-title">سجل تقاريري (${myReports.length})</h3>
    ${myReports.length ? `<div class="timeline">${myReports.map(r => reportTimelineItem(r, false)).join('')}</div>` : emptyState('reports','لا توجد تقارير بعد','ابدأ بتسجيل أول تقرير تعلم لك أعلاه')}
  `;
}

function reportsMemberView(){
  return `
    <div class="page-head">
      <div><h1>التقارير</h1><p>سجّل حالة تعلمك اليومية وتابع تقاريرك السابقة</p></div>
    </div>
    ${myReportSubmissionSection()}
  `;
}


let editingReportId = null;
let editingNoteReportId = null;

function reportTimelineItem(r, isAdmin){
  if(editingReportId === r.id) return editReportForm(r);

  const cls = r.status === 'تم التعلم' ? 'tl-green' : r.status === 'يتم التعلم' ? 'tl-amber' : 'tl-red';
  const task = r.taskId ? state.tasks.find(t=>t.id===r.taskId) : null;
  const author = findUser(r.userId);
  const late = isReportLate(r);
  const isOwner = state.currentUser && r.userId === state.currentUser.id;
  const postponeBadge = !r.postponeUntil ? '' :
    r.postponeApproved === true ? `<span class="badge badge-green">✔️ عذر مقبول — لحد ${formatDate(r.postponeUntil)}</span>` :
    r.postponeApproved === false ? `<span class="badge badge-red">✖️ عذر مرفوض</span>` :
    `<span class="badge badge-amber">⏳ عذر بانتظار مراجعة المدير</span>`;
  const approvalActions = (isAdmin && r.postponeUntil && r.postponeApproved !== true) ? `
    <div class="row-actions" style="margin-top:8px;">
      ${r.postponeApproved !== true ? `<button class="btn btn-primary btn-sm postpone-approve-btn" data-id="${r.id}">قبول العذر</button>` : ''}
      ${r.postponeApproved !== false ? `<button class="btn btn-danger btn-sm postpone-reject-btn" data-id="${r.id}">رفض العذر</button>` : ''}
    </div>` : '';
  const ownerActions = isOwner ? `
    <div class="row-actions" style="margin-top:8px;">
      <button class="btn btn-ghost btn-sm edit-report-btn" data-id="${r.id}">${ICONS.edit || ''} تعديل</button>
      <button class="btn btn-danger btn-sm delete-report-btn" data-id="${r.id}">${ICONS.trash || ''} حذف</button>
    </div>` : '';
  const noteDisplay = r.managerNote ? `<div class="tl-task" style="background:var(--surface-2,rgba(0,0,0,.03)); padding:8px 10px; border-radius:8px;">💬 <b>ملاحظة المدير:</b> ${escapeHtml(r.managerNote)}</div>` : '';
  const managerNoteForm = (isAdmin && editingNoteReportId === r.id) ? `
    <form class="manager-note-form" data-id="${r.id}" style="margin-top:8px;">
      <textarea class="manager-note-input" placeholder="اكتب ملاحظتك على أداء العضو في هذا التقرير...">${escapeHtml(r.managerNote || '')}</textarea>
      <div class="row-actions" style="margin-top:6px;">
        <button type="submit" class="btn btn-primary btn-sm">حفظ الملاحظة</button>
        <button type="button" class="btn btn-ghost btn-sm cancel-manager-note-btn" data-id="${r.id}">إلغاء</button>
      </div>
    </form>` : '';
  const managerNoteToggle = (isAdmin && editingNoteReportId !== r.id) ? `
    <div class="row-actions" style="margin-top:8px;">
      <button type="button" class="btn btn-ghost btn-sm add-manager-note-btn" data-id="${r.id}">💬 ${r.managerNote ? 'تعديل الملاحظة' : 'إضافة ملاحظة'}</button>
    </div>` : '';
  return `
    <div class="timeline-item ${cls}">
      <div class="tl-head">
        <span class="badge ${statusBadgeClass(r.status)}">${r.status}</span>
        ${late ? `<span class="badge badge-red">⏰ متأخر (تأخيرتان = يوم تقصير)</span>` : ''}
        <span class="tl-date">${formatDateTime(r.createdAt)} — ${escapeHtml(author ? author.name : '')}</span>
      </div>
      <div class="tl-task">📅 هذا تقرير يوم: <b>${formatDateWithDay(r.date)}</b></div>
      <div class="tl-desc">${escapeHtml(r.description)}</div>
      ${task ? `<div class="tl-task">🔗 مرتبط بمهمة: ${escapeHtml(task.title)}</div>` : ''}
      ${r.postponeUntil ? `<div class="tl-task" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">⏸️ طلب تأجيل احتساب التقصير لحد ${formatDate(r.postponeUntil)} ${postponeBadge}</div>` : ''}
      ${noteDisplay}
      ${approvalActions}
      ${ownerActions}
      ${managerNoteToggle}
      ${managerNoteForm}
    </div>
  `;
}

function editReportForm(r){
  const showPostpone = r.status === 'لن يتم التعلم';
  return `
    <div class="timeline-item">
      <form class="edit-report-form" data-id="${r.id}">
        <div class="form-row">
          <label for="editReportStatus_${r.id}">حالة التعلم</label>
          <select id="editReportStatus_${r.id}" class="edit-report-status">
            <option value="تم التعلم" ${r.status==='تم التعلم'?'selected':''}>✅ تم التعلم</option>
            <option value="يتم التعلم" ${r.status==='يتم التعلم'?'selected':''}>⏳ يتم التعلم</option>
            <option value="لن يتم التعلم" ${r.status==='لن يتم التعلم'?'selected':''}>✖️ لن يتم التعلم</option>
          </select>
        </div>
        <div class="form-row edit-report-postpone-row ${showPostpone ? '' : 'hidden'}">
          <label for="editReportPostpone_${r.id}">مؤجّل لحد تاريخ (اختياري)</label>
          <input type="date" id="editReportPostpone_${r.id}" class="edit-report-postpone" value="${r.postponeUntil || ''}">
        </div>
        <div class="form-row">
          <label for="editReportDesc_${r.id}">وصف ما تم تعلمه</label>
          <textarea id="editReportDesc_${r.id}" class="edit-report-desc" required>${escapeHtml(r.description)}</textarea>
        </div>
        <div class="row-actions">
          <button type="submit" class="btn btn-primary btn-sm">حفظ التعديل</button>
          <button type="button" class="btn btn-ghost btn-sm cancel-edit-report-btn" data-id="${r.id}">إلغاء</button>
        </div>
      </form>
    </div>
  `;
}

/* offset بالأشهر عن الشهر الحالي (0 = الشهر الحالي، 1 = اللي قبله...) — يُستخدم لعرض
   سجل التسجيل/الانتظام لأي شهر سابق لكل عضو، مش الشهر الحالي بس */
let reportsMonthOffset = 0;
let expandedNegligenceUserId = null;
function monthOffsetDate(offset){
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offset);
  return d;
}
function monthOffsetLabel(offset){
  const d = monthOffsetDate(offset);
  const label = d.toLocaleDateString('ar-EG', { month:'long', year:'numeric' });
  return offset === 0 ? `${label} (الشهر الحالي)` : label;
}

function reportsAdminView(){
  const total = state.reports.length;
  const counts = {
    'تم التعلم': state.reports.filter(r=>r.status==='تم التعلم').length,
    'يتم التعلم': state.reports.filter(r=>r.status==='يتم التعلم').length,
    'لن يتم التعلم': state.reports.filter(r=>r.status==='لن يتم التعلم').length
  };
  const viewerIsSuper1 = !!state.currentUser.isSuperAdmin;
  const viewerIsManager1 = state.currentUser.role === 'admin' && !viewerIsSuper1;
  /* من v15: المدير العادي بقى خاضع لاحتساب التقصير زي أي عضو (إلا لو
     السوبر أدمن استثناه يدويًا) — فالسوبر أدمن يراجع أعضاء الفريق +
     المدراء العاديين معًا هنا، والمدير العادي لسه يراجع أعضاء فريقه بس
     (نفس تقييد الرؤية الموجود أصلًا في RLS) */
  const members = viewerIsSuper1
    ? state.users.filter(u => !u.isSuperAdmin)
    : state.users.filter(u => u.role === 'member');
  const negligenceRows = members
    .map(m => ({name:m.name, id:m.id, count: negligenceCount(m.id)}))
    .sort((a,b) => b.count - a.count);

  const selectedMonth = monthOffsetDate(reportsMonthOffset);
  const monthlyRows = members
    .map(m => ({ id:m.id, name:m.name, status:m.status, suspendedAuto: m.suspendedAuto, role:m.role, exempt: !!m.negligenceExempt, ...monthlyNegligentDays(m.id, selectedMonth) }))
    .sort((a,b) => b.days - a.days);

  const pendingPostpone = state.reports
    .filter(r => r.postponeUntil && r.postponeApproved !== true && r.postponeApproved !== false)
    .slice().sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));

  const myNeg = viewerIsManager1 ? monthlyNegligentDays(state.currentUser.id, new Date()) : null;
  const myExempt = !!state.currentUser.negligenceExempt;

  return `
    <div class="page-head">
      <div><h1>التقارير</h1><p>${viewerIsSuper1 ? 'مراجعة تقارير التعلم لجميع الأعضاء والمدراء' : 'مراجعة تقارير التعلم لأعضاء فريقك'} — السوبر أدمن بس هو المستثنى تلقائيًا من احتساب التقصير (وأي حساب استثناه السوبر أدمن يدويًا)</p></div>
    </div>

    ${viewerIsManager1 ? `
    <div class="section-block">
      <h3 class="section-title">تقاريري — أنت خاضع لاحتساب التقصير زي أي عضو${myExempt ? ' <span class="badge badge-green">مستثنى من الاحتساب بواسطة السوبر أدمن</span>' : ''}</h3>
      ${!myExempt ? `<div class="badge ${myNeg.days>=4?'badge-red':myNeg.days>=1?'badge-amber':'badge-green'}" style="display:inline-flex; padding:10px 14px; font-size:13px; margin-bottom:14px;">أيام التقصير هذا الشهر: <b style="margin-inline-start:4px;">${myNeg.days} / 6</b></div>` : ''}
      ${myReportSubmissionSection()}
    </div>` : ''}

    ${pendingPostpone.length ? `
    <div class="section-block">
      <h3 class="section-title">⏳ طلبات تأجيل بانتظار المراجعة (${pendingPostpone.length})</h3>
      <p style="color:var(--text-600); font-size:13px; margin-top:-8px;">
        عضو اختار "لن يتم التعلم" وطلب ألا تُحتسب الأيام تقصيرًا حتى تاريخ معيّن. لن يُستثنى أي يوم من التقصير إلا بعد موافقتك.
      </p>
      <div class="timeline">${pendingPostpone.map(r => reportTimelineItem(r, true)).join('')}</div>
    </div>` : ''}

    <div class="stat-grid">
      <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">إجمالي التقارير</div></div>
      <div class="stat-card"><div class="stat-num" style="color:var(--green-500)">${counts['تم التعلم']}</div><div class="stat-label">تم التعلم</div></div>
      <div class="stat-card"><div class="stat-num" style="color:var(--amber-600)">${counts['يتم التعلم']}</div><div class="stat-label">يتم التعلم</div></div>
      <div class="stat-card"><div class="stat-num" style="color:var(--red-500)">${counts['لن يتم التعلم']}</div><div class="stat-label">لن يتم التعلم</div></div>
    </div>

    <div class="section-block">
      <h3 class="section-title">توزيع الحالات</h3>
      <div class="card" style="padding:20px 22px;">
        ${barRow('تم التعلم', counts['تم التعلم'], total, 'var(--green-500)')}
        ${barRow('يتم التعلم', counts['يتم التعلم'], total, 'var(--amber-500)')}
        ${barRow('لن يتم التعلم', counts['لن يتم التعلم'], total, 'var(--red-500)')}
      </div>
    </div>

    <div class="section-block">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <h3 class="section-title" style="margin:0;">أيام التقصير والانتظام في التسجيل</h3>
        <div style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap;">
          <div class="form-row" style="max-width:220px; margin:0;">
            <label for="reportsMonthSelect">الشهر</label>
            <select id="reportsMonthSelect">
              ${Array.from({length:6}, (_,i) => `<option value="${i}" ${i===reportsMonthOffset?'selected':''}>${monthOffsetLabel(i)}</option>`).join('')}
            </select>
          </div>
          <button type="button" class="btn btn-ghost" id="exportNegligenceCsvBtn">${ICONS.download || ''} تصدير Excel</button>
          <button type="button" class="btn btn-ghost" id="printReportsBtn">${ICONS.printer || ''} طباعة / PDF</button>
        </div>
      </div>
      <p style="color:var(--text-600); font-size:13px; margin-top:8px;">
        كل يوم موعده النهائي هو الساعة 4 عصرًا من اليوم التالي له. لو العضو سجّل خلال اليوم نفسه فهو "على الوقت".
        لو سجّل بعد ما اليوم يخلص لكن قبل الساعة 4 عصرًا اليوم التالي (سواء قبل الساعة 1 ظهرًا أو بعدها)، يُحتسب "تأخير" — وكل تأخيرتين يتحولوا ليوم تقصير واحد.
        لو محدش سجّل خالص لغاية الساعة 4 عصرًا اليوم التالي، يُحتسب اليوم "تقصير" كامل مباشرة.
        يوم الجمعة إجازة كاملة: مفيش تقرير مطلوب فيه، ومحدش بياخد أو يفقّد أي نقطة بسببه (سواء سجّل أو مسجّلش).
        عند الوصول لـ 6 أيام تقصير في الشهر يتم إيقاف الحساب (عضو أو مدير عادي) تلقائيًا — السوبر أدمن بس مستثنى دايمًا، وأي حساب استثناه السوبر أدمن يدويًا. رجوع العضو الموقوف بيد أي مدير مسؤول من صفحة "الأعضاء"، أما المدير العادي الموقوف فرجوعه مقصور على السوبر أدمن بس.
        اختر أي شهر سابق من القائمة فوق عشان تراجع انتظام أي عضو خلال الشهور اللي فاتت، واضغط "التفاصيل" جنب أي عضو عشان تشوف حالة كل يوم بالظبط ووقت التسجيل.
      </p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>العضو</th><th>أيام التقصير خلال ${escapeHtml(monthOffsetLabel(reportsMonthOffset))}</th><th>الحالة</th><th>تفاصيل</th></tr></thead>
          <tbody>
            ${monthlyRows.map(row => `
              <tr>
                <td class="cell-user">${avatarHtml(findUser(row.id))} ${escapeHtml(row.name)}${row.role==='admin' ? ` <span class="badge badge-navy" style="margin-inline-start:6px;">مدير</span>` : ''}</td>
                <td>${row.exempt ? '<span class="badge badge-green">مستثنى من الاحتساب</span>' : `<b>${row.days}</b> / 6 ${row.late % 2 === 1 ? `<span class="badge badge-amber" style="margin-inline-start:6px;">+ تأخير معلّق</span>` : ''}`}</td>
                <td>${row.status==='disabled' && row.suspendedAuto
                  ? '<span class="badge badge-red">🚫 موقوف تلقائيًا (تقصير)</span>'
                  : row.status==='disabled'
                    ? '<span class="badge badge-red">معطّل يدويًا</span>'
                    : row.days>=6 ? '<span class="badge badge-red">سيتم إيقافه</span>'
                    : row.days>=3 ? '<span class="badge badge-amber">تحذير</span>'
                    : '<span class="badge badge-green">منتظم</span>'}</td>
                <td><button class="btn btn-ghost btn-sm neg-details-btn" data-id="${row.id}">${expandedNegligenceUserId === row.id ? 'إخفاء' : 'عرض'}</button></td>
              </tr>
              ${expandedNegligenceUserId === row.id ? `
              <tr class="neg-details-row">
                <td colspan="4" style="padding:0;">
                  <div style="padding:12px 16px; background:var(--bg); border-top:1px solid var(--border);">
                    <table style="width:100%;">
                      <thead><tr><th>اليوم</th><th>الحالة</th><th>وقت التسجيل</th>${viewerIsSuper1 ? '<th>إجراء</th>' : ''}</tr></thead>
                      <tbody>
                        ${dailyBreakdownForUser(row.id, selectedMonth).map(d => `
                          <tr>
                            <td>${formatDateWithDay(d.date)}</td>
                            <td>${
                              d.status==='ontime' ? '<span class="badge badge-green">✔️ على الوقت</span>'
                              : d.status==='late' ? '<span class="badge badge-amber">⏰ تأخير</span>'
                              : d.status==='postponed' ? '<span class="badge badge-green">⏸️ مؤجّل بعذر مقبول</span>'
                              : d.status==='holiday' ? '<span class="badge badge-grey">🌴 إجازة (الجمعة)</span>'
                              : d.status==='forgiven' ? '<span class="badge badge-grey">✋ ملغى من التقصير</span>'
                              : '<span class="badge badge-red">🚫 تقصير (لم يسجل)</span>'
                            }</td>
                            <td>${d.time ? formatDateTime(d.time) : '—'}</td>
                            ${viewerIsSuper1 ? `<td>${
                              (d.status==='missing' || d.status==='late')
                                ? `<button class="btn btn-ghost btn-sm forgive-negligence-day-btn" data-user="${row.id}" data-date="${d.date}" title="متاح للسوبر أدمن بس">إلغاء من التقصير</button>`
                                : d.status==='forgiven'
                                  ? `<button class="btn btn-ghost btn-sm unforgive-negligence-day-btn" data-user="${row.id}" data-date="${d.date}" title="متاح للسوبر أدمن بس">تراجع</button>`
                                  : '—'
                            }</td>` : ''}
                          </tr>
                        `).join('') || `<tr><td colspan="${viewerIsSuper1 ? 4 : 3}" style="text-align:center;color:var(--text-400);padding:16px;">لا توجد أيام بعد في هذا الشهر</td></tr>`}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>` : ''}
            `).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--text-400);padding:24px;">لا يوجد أعضاء بعد</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div class="section-block">
      <h3 class="section-title">عدد مرات اختيار "لن يتم التعلم"</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>العضو</th><th>عدد المرات</th><th>الحالة</th></tr></thead>
          <tbody>
            ${negligenceRows.map(row => `
              <tr>
                <td class="cell-user">${avatarHtml(findUser(row.id))} ${escapeHtml(row.name)}</td>
                <td><b>${row.count}</b></td>
                <td><span class="badge ${row.count>=3?'badge-red':row.count>=1?'badge-amber':'badge-green'}">${row.count>=3?'يحتاج متابعة':row.count>=1?'مقبول':'ممتاز'}</span></td>
              </tr>
            `).join('') || '<tr><td colspan="3" style="text-align:center;color:var(--text-400);padding:24px;">لا يوجد أعضاء بعد</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div class="section-block">
      <h3 class="section-title">كل التقارير</h3>
      <div style="display:flex; gap:14px; flex-wrap:wrap;">
        <div class="form-row" style="max-width:260px;">
          <label for="reportFilterMember">تصفية حسب العضو</label>
          <select id="reportFilterMember">
            <option value="all">كل الأعضاء</option>
            ${members.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-row" style="max-width:220px;">
          <label for="reportFilterDate">تصفية حسب يوم معيّن</label>
          <input type="date" id="reportFilterDate">
        </div>
        <div class="form-row" style="align-self:flex-end;">
          <button type="button" class="btn btn-ghost" id="reportFilterClear">إلغاء التصفية</button>
        </div>
        <div class="form-row" style="align-self:flex-end;">
          <button type="button" class="btn btn-ghost" id="exportReportsCsvBtn">${ICONS.download || ''} تصدير Excel</button>
        </div>
      </div>
      <div id="adminReportsList"></div>
    </div>
  `;
}

function barRow(label, val, total, color){
  const pct = total ? Math.round((val/total)*100) : 0;
  return `
    <div class="bar-row">
      <div class="bar-label">${label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%; background:${color};"></div></div>
      <div class="bar-val">${val}</div>
    </div>
  `;
}

function renderAdminReportsList(filterId, filterDate){
  let filtered = state.reports;
  if(filterId && filterId !== 'all') filtered = filtered.filter(r => String(r.userId) === String(filterId));
  if(filterDate) filtered = filtered.filter(r => r.date === filterDate);
  const sorted = filtered.slice().sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
  const el = $('#adminReportsList');
  if(!el) return;

  let missingHtml = '';
  if(filterDate){
    const viewerIsSuper2 = !!(state.currentUser && state.currentUser.isSuperAdmin);
    const trackedMembers = viewerIsSuper2
      ? state.users.filter(u => !u.isSuperAdmin && u.status !== 'pending')
      : state.users.filter(u => u.role === 'member' && u.status !== 'pending');
    const reportedIds = new Set(state.reports.filter(r => r.date === filterDate).map(r => r.userId));
    const missing = trackedMembers.filter(m => !reportedIds.has(m.id));
    if(missing.length){
      missingHtml = `
        <div class="card" style="padding:16px 18px; margin-bottom:16px; border-color:var(--red-500);">
          <b>لم يسجّلوا تقريرًا في هذا اليوم (${formatDateWithDay(filterDate)}):</b>
          <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
            ${missing.map(m => `<span class="badge badge-red">${escapeHtml(m.name)}</span>`).join('')}
          </div>
        </div>`;
    }
  }

  el.innerHTML = missingHtml + (sorted.length ? `<div class="timeline">${sorted.map(r => reportTimelineItem(r, true)).join('')}</div>` : emptyState('reports','لا توجد تقارير مطابقة','جرّب تغيير عامل التصفية'));
  bindPostponeApprovalEvents(el);
}

function bindPostponeApprovalEvents(container){
  Array.from(container.querySelectorAll('.postpone-approve-btn')).forEach(btn => btn.addEventListener('click', async () => {
    try {
      await reportsSetPostponeApproval(Number(btn.dataset.id), true);
      await refreshData();
      renderPage();
      toast('تم قبول العذر — لن يُحتسب تقصيرًا', 'ok');
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
  Array.from(container.querySelectorAll('.postpone-reject-btn')).forEach(btn => btn.addEventListener('click', async () => {
    try {
      await reportsSetPostponeApproval(Number(btn.dataset.id), false);
      await refreshData();
      renderPage();
      toast('تم رفض العذر', 'err');
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
  bindReportOwnerEvents(container);
  bindManagerNoteEvents(container);
}

/* إضافة/تعديل ملاحظة المدير على تقرير عضو — متاحة للمدير/السوبر أدمن بس */
function bindManagerNoteEvents(container){
  Array.from(container.querySelectorAll('.add-manager-note-btn')).forEach(btn => btn.addEventListener('click', () => {
    editingNoteReportId = Number(btn.dataset.id);
    renderPage();
  }));
  Array.from(container.querySelectorAll('.cancel-manager-note-btn')).forEach(btn => btn.addEventListener('click', () => {
    editingNoteReportId = null;
    renderPage();
  }));
  Array.from(container.querySelectorAll('.manager-note-form')).forEach(form => form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = Number(form.dataset.id);
    const note = form.querySelector('.manager-note-input').value.trim();
    try {
      await reportsSetManagerNote(id, note);
      editingNoteReportId = null;
      await refreshData();
      renderPage();
      toast('تم حفظ الملاحظة', 'ok');
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
}

/* تعديل/حذف تقرير من صاحبه — متاحة في عرض العضو لتقاريره وفي عرض المدير الإجمالي */
function bindReportOwnerEvents(container){
  Array.from(container.querySelectorAll('.edit-report-btn')).forEach(btn => btn.addEventListener('click', () => {
    editingReportId = Number(btn.dataset.id);
    renderPage();
  }));
  Array.from(container.querySelectorAll('.cancel-edit-report-btn')).forEach(btn => btn.addEventListener('click', () => {
    editingReportId = null;
    renderPage();
  }));
  Array.from(container.querySelectorAll('.delete-report-btn')).forEach(btn => btn.addEventListener('click', async () => {
    if(!confirm('هل تريد حذف هذا التقرير نهائيًا؟')) return;
    try {
      await reportsDelete(Number(btn.dataset.id));
      editingReportId = null;
      await refreshData();
      renderPage();
      toast('تم حذف التقرير', 'ok');
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
  Array.from(container.querySelectorAll('.edit-report-status')).forEach(sel => sel.addEventListener('change', () => {
    const form = sel.closest('.edit-report-form');
    const row = form.querySelector('.edit-report-postpone-row');
    if(row) row.classList.toggle('hidden', sel.value !== 'لن يتم التعلم');
  }));
  Array.from(container.querySelectorAll('.edit-report-form')).forEach(form => form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = Number(form.dataset.id);
    const status = form.querySelector('.edit-report-status').value;
    const desc = form.querySelector('.edit-report-desc').value.trim();
    if(!desc){ toast('يرجى كتابة وصف ما تعلمته', 'err'); return; }
    const postponeInput = form.querySelector('.edit-report-postpone');
    const postponeUntil = postponeInput && postponeInput.value ? postponeInput.value : null;
    try {
      await reportsUpdate(id, { status, description: desc, postponeUntil });
      editingReportId = null;
      await refreshData();
      renderPage();
      toast('تم حفظ التعديل', 'ok');
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
}

/* ============================================================
   PAGE: التعليم — المدير يحدد مواد تعلم لأعضاء معينين، وكل عضو
   يشوف مواده هو بس (مفروض من RLS في قاعدة البيانات، مش مجرد إخفاء
   في الواجهة)
   ============================================================ */
function pageLearning(){
  const isAdmin = state.currentUser.role === 'admin';
  const members = state.users.filter(u => u.role === 'member' && u.status !== 'pending');
  const items = state.learning.slice().sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));

  return `
    <div class="page-head">
      <div><h1>التعليم</h1><p>${isAdmin ? 'حدد مواد تعلم لأعضاء معينين — كل عضو يشوف مواده هو بس' : 'مواد التعلم المخصصة لك'}</p></div>
      ${isAdmin ? `<button class="btn btn-primary" id="openLearningModalBtn">${ICONS.plus} مادة تعلم جديدة</button>` : ''}
    </div>

    ${isAdmin ? `
    <div class="form-row" style="max-width:260px;">
      <label for="learningFilterMember">تصفية حسب العضو</label>
      <select id="learningFilterMember">
        <option value="all">كل الأعضاء</option>
        ${members.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('')}
      </select>
    </div>` : ''}

    <div id="learningListWrap">${renderLearningListHtml(items, isAdmin)}</div>
  `;
}

function renderLearningListHtml(items, isAdmin){
  if(!items.length) return emptyState('reports', isAdmin ? 'لا توجد مواد تعلم بعد' : 'لا توجد مواد تعلم مخصصة لك حاليًا', isAdmin ? 'ابدأ بإضافة أول مادة تعلم لعضو من الفريق' : 'هيظهر هنا أي مادة تعلم يحددها لك المدير');
  return `<div class="timeline">${items.map(it => learningItemHtml(it, isAdmin)).join('')}</div>`;
}

function learningItemHtml(it, isAdmin){
  const assignee = findUser(it.assignedTo);
  const done = it.status === 'تم التعلم';
  return `
    <div class="timeline-item ${done ? 'tl-green' : 'tl-amber'}">
      <div class="tl-head">
        <span class="badge ${statusBadgeClass(it.status)}">${escapeHtml(it.status)}</span>
        ${it.trackTitle ? `<span class="badge badge-amber">🧭 ${escapeHtml(it.trackTitle)}</span>` : ''}
        <span class="tl-date">${formatDateTime(it.createdAt)}${isAdmin ? ' — ' + escapeHtml(assignee ? assignee.name : 'عضو محذوف') : ''}</span>
      </div>
      <div class="tl-desc"><b>${escapeHtml(it.title)}</b>${it.description ? '<br>' + escapeHtml(it.description) : ''}</div>
      ${it.link ? `<div class="tl-task">🔗 <a href="${escapeHtml(it.link)}" target="_blank" rel="noopener">${escapeHtml(it.link)}</a></div>` : ''}
      <div class="row-actions" style="margin-top:8px;">
        ${!isAdmin ? `<button type="button" class="btn btn-primary btn-sm learning-toggle-btn" data-id="${it.id}" data-next="${done ? 'قيد التنفيذ' : 'تم التعلم'}">${done ? 'إعادة فتحها' : 'تحديد كمكتملة'}</button>` : ''}
        ${isAdmin ? `<button type="button" class="btn btn-danger btn-sm delete-learning-btn" data-id="${it.id}">${ICONS.trash} حذف</button>` : ''}
      </div>
    </div>
  `;
}

function populateLearningAssigneeSelect(){
  const members = state.users.filter(u => u.role === 'member' && u.status !== 'pending');
  $('#learningAssignee').innerHTML = members.map(u => `<option value="${u.id}">${escapeHtml(u.name)}</option>`).join('');
}

function openLearningModal(){
  populateLearningAssigneeSelect();
  $('#learningForm').reset();
  $('#learningModalOverlay').classList.remove('hidden');
}
function closeLearningModal(){ $('#learningModalOverlay').classList.add('hidden'); }

function bindLearningEvents(){
  const openBtn = $('#openLearningModalBtn');
  if(openBtn) openBtn.addEventListener('click', openLearningModal);

  const filterSel = $('#learningFilterMember');
  if(filterSel) filterSel.addEventListener('change', () => {
    const val = filterSel.value;
    const items = state.learning.slice()
      .filter(it => val === 'all' || String(it.assignedTo) === val)
      .sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
    $('#learningListWrap').innerHTML = renderLearningListHtml(items, true);
    bindLearningListActions();
  });

  bindLearningListActions();
}

function bindLearningListActions(){
  $$('.delete-learning-btn').forEach(btn => btn.addEventListener('click', async () => {
    if(!confirm('هل تريد حذف مادة التعلم هذه؟')) return;
    try {
      await apiFetch(`/learning/${btn.dataset.id}`, { method: 'DELETE' });
      await refreshData();
      renderPage();
      toast('تم حذف مادة التعلم', 'ok');
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
  $$('.learning-toggle-btn').forEach(btn => btn.addEventListener('click', async () => {
    try {
      await apiFetch(`/learning/${btn.dataset.id}/status`, { method: 'PUT', body: JSON.stringify({ status: btn.dataset.next }) });
      await refreshData();
      renderPage();
      toast('تم تحديث حالة مادة التعلم', 'ok');
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
}

$('#learningModalClose').addEventListener('click', closeLearningModal);
$('#learningCancelBtn').addEventListener('click', closeLearningModal);
$('#learningModalOverlay').addEventListener('click', (e) => { if(e.target.id === 'learningModalOverlay') closeLearningModal(); });

$('#learningForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const payload = {
    assignedTo: Number($('#learningAssignee').value),
    title: $('#learningTitle').value.trim(),
    description: $('#learningDesc').value.trim(),
    link: $('#learningLink').value.trim(),
    trackTitle: $('#learningTrack').value.trim()
  };
  setFormBusy(form, true);
  try {
    await apiFetch('/learning', { method: 'POST', body: JSON.stringify(payload) });
    toast('تمت إضافة مادة التعلم', 'ok');
    closeLearningModal();
    await refreshData();
    renderPage();
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    setFormBusy(form, false);
  }
});

/* ============================================================
   PAGE: مصادر التعلم — مصدر عام يفيد الفريق كله (جدول بأعمدة يبنيها
   المدير بالشكل اللي يحتاجه)، وكل الأعضاء يشوفوها بشكل قراءة فقط
   ============================================================ */
function resColTypeLabel(type){
  return { text: 'نص', link: 'رابط', date: 'تاريخ', note: 'ملاحظة' }[type] || 'نص';
}

function pageResources(){
  const isAdmin = state.currentUser.role === 'admin';
  const cols = state.resourceColumns.slice().sort((a,b) => a.order - b.order);
  const rows = state.resources.slice().sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));

  return `
    <div class="page-head">
      <div><h1>مصادر التعلم</h1><p>${isAdmin ? 'مصدر مشترك يفيد الفريق كله — ابنِ الأعمدة اللي تحتاجها وأضف البيانات المفيدة' : 'مصادر ومراجع مفيدة أضافها المدير للفريق كله'}</p></div>
      ${isAdmin ? `<button class="btn btn-primary" id="openResRowModalBtn" ${!cols.length ? 'disabled title="أضف عمودًا واحدًا على الأقل أولًا"' : ''}>${ICONS.plus} إضافة مصدر</button>` : ''}
    </div>

    ${isAdmin ? `
    <div class="res-toolbar">
      <button type="button" class="btn btn-ghost btn-sm" id="openResColModalBtn">${ICONS.plus} إضافة عمود</button>
    </div>
    ${cols.length ? `<div class="res-cols-list">${cols.map(c => `
      <span class="res-col-tag">${escapeHtml(c.label)} <small style="opacity:.6">(${resColTypeLabel(c.type)})</small>
        <button type="button" class="del-res-col-btn" data-id="${c.id}" title="حذف العمود">${ICONS.x}</button>
      </span>`).join('')}</div>` : ''}
    ` : ''}

    <div id="resourcesTableWrap">${renderResourcesTableHtml(cols, rows, isAdmin)}</div>
  `;
}

function resCellHtml(col, value){
  if(value == null || value === '') return '<span style="color:var(--text-400)">—</span>';
  if(col.type === 'link') return `<a href="${escapeHtml(value)}" target="_blank" rel="noopener">${escapeHtml(value)}</a>`;
  if(col.type === 'date') return escapeHtml(formatDate(value));
  return escapeHtml(value);
}

function renderResourcesTableHtml(cols, rows, isAdmin){
  if(!cols.length){
    return emptyState('book', 'لا توجد أعمدة بعد', isAdmin ? 'ابدأ بإضافة أول عمود (مثال: اسم الأداة، رابط، ملاحظات) عشان تقدر تضيف مصادر' : 'لسه المدير مابناش هذا الجدول');
  }
  if(!rows.length){
    return emptyState('book', 'لا توجد مصادر بعد', isAdmin ? 'أضف أول مصدر يفيد الفريق' : 'هيظهر هنا أي مصدر يضيفه المدير');
  }
  return `
    <div class="table-wrap">
      <table class="res-table">
        <thead><tr>
          ${cols.map(c => `<th>${escapeHtml(c.label)}</th>`).join('')}
          ${isAdmin ? '<th></th>' : ''}
        </tr></thead>
        <tbody>
          ${rows.map(r => {
            return `<tr>
              ${cols.map(c => `<td class="res-cell-${c.type === 'note' ? 'note' : 'text'}">${resCellHtml(c, r.data ? r.data[c.key] : null)}</td>`).join('')}
              ${isAdmin ? `<td>
                <div class="row-actions">
                  <button type="button" class="btn btn-ghost btn-sm edit-res-row-btn" data-id="${r.id}">${ICONS.edit} تعديل</button>
                  <button type="button" class="btn btn-danger btn-sm del-res-row-btn" data-id="${r.id}">${ICONS.trash} حذف</button>
                </div>
              </td>` : ''}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function openResourceColumnModal(){
  $('#resColForm').reset();
  $('#resColModalOverlay').classList.remove('hidden');
}
function closeResourceColumnModal(){ $('#resColModalOverlay').classList.add('hidden'); }

function buildResRowFields(existingData){
  const cols = state.resourceColumns.slice().sort((a,b) => a.order - b.order);
  return cols.map(c => {
    const val = existingData ? (existingData[c.key] ?? '') : '';
    const inputType = c.type === 'link' ? 'url' : (c.type === 'date' ? 'date' : 'text');
    if(c.type === 'note'){
      return `<div class="form-row">
        <label for="resField_${c.key}">${escapeHtml(c.label)}</label>
        <textarea id="resField_${c.key}" data-key="${c.key}" class="res-field">${escapeHtml(val)}</textarea>
      </div>`;
    }
    return `<div class="form-row">
      <label for="resField_${c.key}">${escapeHtml(c.label)}</label>
      <input type="${inputType}" id="resField_${c.key}" data-key="${c.key}" class="res-field" value="${escapeHtml(val)}">
    </div>`;
  }).join('');
}

function openResourceRowModal(id){
  const row = id ? state.resources.find(r => r.id === id) : null;
  $('#resRowModalTitle').textContent = row ? 'تعديل المصدر' : 'إضافة مصدر جديد';
  $('#resRowId').value = row ? row.id : '';
  $('#resRowFieldsWrap').innerHTML = buildResRowFields(row ? row.data : null);
  $('#resRowModalOverlay').classList.remove('hidden');
}
function closeResourceRowModal(){ $('#resRowModalOverlay').classList.add('hidden'); }

function bindResourcesEvents(){
  const openColBtn = $('#openResColModalBtn');
  if(openColBtn) openColBtn.addEventListener('click', openResourceColumnModal);

  const openRowBtn = $('#openResRowModalBtn');
  if(openRowBtn) openRowBtn.addEventListener('click', () => openResourceRowModal());

  $$('.del-res-col-btn').forEach(btn => btn.addEventListener('click', async () => {
    if(!confirm('حذف العمود هيشيل بياناته من كل الصفوف كمان. متأكد؟')) return;
    try {
      await apiFetch(`/resource-columns/${btn.dataset.id}`, { method: 'DELETE' });
      await refreshData();
      renderPage();
      toast('تم حذف العمود', 'ok');
    } catch (err) { toast(err.message, 'err'); }
  }));

  $$('.edit-res-row-btn').forEach(btn => btn.addEventListener('click', () => openResourceRowModal(Number(btn.dataset.id))));

  $$('.del-res-row-btn').forEach(btn => btn.addEventListener('click', async () => {
    if(!confirm('هل تريد حذف هذا المصدر؟')) return;
    try {
      await apiFetch(`/resources/${btn.dataset.id}`, { method: 'DELETE' });
      await refreshData();
      renderPage();
      toast('تم حذف المصدر', 'ok');
    } catch (err) { toast(err.message, 'err'); }
  }));
}

$('#resColModalClose').addEventListener('click', closeResourceColumnModal);
$('#resColCancelBtn').addEventListener('click', closeResourceColumnModal);
$('#resColModalOverlay').addEventListener('click', (e) => { if(e.target.id === 'resColModalOverlay') closeResourceColumnModal(); });

$('#resColForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const payload = { label: $('#resColLabel').value.trim(), type: $('#resColType').value };
  if(!payload.label) return;
  setFormBusy(form, true);
  try {
    await apiFetch('/resource-columns', { method: 'POST', body: JSON.stringify(payload) });
    toast('تمت إضافة العمود', 'ok');
    closeResourceColumnModal();
    await refreshData();
    renderPage();
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    setFormBusy(form, false);
  }
});

$('#resRowModalClose').addEventListener('click', closeResourceRowModal);
$('#resRowCancelBtn').addEventListener('click', closeResourceRowModal);
$('#resRowModalOverlay').addEventListener('click', (e) => { if(e.target.id === 'resRowModalOverlay') closeResourceRowModal(); });

$('#resRowForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {};
  $$('.res-field', form).forEach(f => { data[f.dataset.key] = f.value.trim(); });
  const id = $('#resRowId').value;
  setFormBusy(form, true);
  try {
    if(id) await apiFetch(`/resources/${id}`, { method: 'PUT', body: JSON.stringify({ data }) });
    else await apiFetch('/resources', { method: 'POST', body: JSON.stringify({ data }) });
    toast(id ? 'تم تحديث المصدر' : 'تمت إضافة المصدر', 'ok');
    closeResourceRowModal();
    await refreshData();
    renderPage();
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    setFormBusy(form, false);
  }
});

/* ============================================================
   PAGE: الكورسات — جدول بسيط (عنوان + رابط)، من غير تعريف أعمدة الأول.
   المدير يدوس "+ إضافة كورس" فينزل سطر جديد في الجدول على طول
   (بدون نافذة منبثقة) يكتب فيه العنوان ويلزق الرابط، وكل الأعضاء
   النشطين يشوفوا الجدول ده قراءة فقط.
   ============================================================ */
let courseAddingRow = false;
let courseEditingId = null;
/* فلترة صفحة الكورسات — حسب القسم (categoryId، أو 'none' لـ"بدون قسم")
   وحسب الفرع (مطابقة نصية تامة بنفس الحروف والطريقة بالظبط زي ما اتكتب
   بالضبط لكل كورس، من غير أي توحيد لحالة الأحرف أو تجاهل مسافات) */
let courseFilterCategory = '';
let courseFilterBranch = '';

function pageCourses(){
  const isAdmin = state.currentUser.role === 'admin';
  const myDept = !isAdmin ? courseCategoryLabelPlain(state.currentUser.departmentId) : null;
  const subtitle = isAdmin
    ? 'أضف روابط الكورسات هنا — كل عضو يشوف كورسات قسمه بس + الكورسات العامة'
    : (myDept
        ? `كورسات قسمك (${escapeHtml(myDept)}) + الكورسات العامة اللي أضافها المدير`
        : 'لسه معندكش قسم محدد — هتشوف الكورسات العامة بس حاليًا، تواصل مع المدير لتحديد قسمك');
  return `
    <div class="page-head">
      <div><h1>الكورسات</h1><p>${subtitle}</p></div>
    </div>
    <div id="coursesTableWrap">${renderCoursesPageInnerHtml(isAdmin)}</div>
  `;
}

/* زي courseCategoryLabel بس بترجع نص عادي (من غير HTML) أو null لو
   العضو لسه من غير قسم — مستخدمة في نص صفحة "الكورسات" بس */
function courseCategoryLabelPlain(categoryId){
  if(!categoryId) return null;
  const cat = state.courseCategories.find(c => String(c.id) === String(categoryId));
  return cat ? cat.title : null;
}

function renderCoursesPageInnerHtml(isAdmin){
  return `${courseFiltersHtml()}${renderCoursesTableHtml(courseFilteredRows(), isAdmin)}`;
}

/* الصفوف بعد تطبيق فلاتر القسم/الفرع الحاليين */
function courseFilteredRows(){
  return state.courses.filter(c => {
    if(courseFilterCategory === 'none'){
      if(c.categoryId) return false;
    } else if(courseFilterCategory){
      if(String(c.categoryId) !== String(courseFilterCategory)) return false;
    }
    if(courseFilterBranch && (c.branch || '') !== courseFilterBranch) return false;
    return true;
  });
}

/* قائمة "الفروع" الظاهرة في فلتر الفرع — بس الفروع الموجودة فعليًا (زي
   ما اتكتبت بالظبط، من غير أي توحيد) ضمن القسم المختار حاليًا في فلتر
   القسم (لو محددش قسم، بتظهر كل الفروع الموجودة في كل الكورسات) */
function courseBranchOptionsForFilter(){
  const pool = state.courses.filter(c => {
    if(courseFilterCategory === 'none') return !c.categoryId;
    if(courseFilterCategory) return String(c.categoryId) === String(courseFilterCategory);
    return true;
  });
  const set = new Set();
  pool.forEach(c => { if(c.branch && c.branch.trim()) set.add(c.branch); });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'));
}

function courseFiltersHtml(){
  if(!state.courses.length && !state.courseCategories.length) return '';
  const catOptions = state.courseCategories.map(cat =>
    `<option value="${cat.id}" ${courseFilterCategory === String(cat.id) ? 'selected' : ''}>${escapeHtml(cat.title)}</option>`
  ).join('');
  const branches = courseBranchOptionsForFilter();
  const branchOptions = branches.map(b =>
    `<option value="${escapeHtml(b)}" ${courseFilterBranch === b ? 'selected' : ''}>${escapeHtml(b)}</option>`
  ).join('');
  const hasActiveFilter = !!(courseFilterCategory || courseFilterBranch);
  return `
    <div class="course-filters-bar" style="display:flex; gap:14px; flex-wrap:wrap; align-items:flex-end; margin-bottom:16px;">
      <div class="form-row" style="max-width:220px;">
        <label for="courseFilterCategorySel">تصفية حسب القسم</label>
        <select id="courseFilterCategorySel">
          <option value="">كل الأقسام</option>
          <option value="none" ${courseFilterCategory === 'none' ? 'selected' : ''}>بدون قسم</option>
          ${catOptions}
        </select>
      </div>
      <div class="form-row" style="max-width:220px;">
        <label for="courseFilterBranchSel">تصفية حسب الفرع</label>
        <select id="courseFilterBranchSel" ${branches.length ? '' : 'disabled'}>
          <option value="">كل الفروع</option>
          ${branchOptions}
        </select>
      </div>
      ${hasActiveFilter ? `<div class="form-row"><button type="button" class="btn btn-ghost" id="clearCourseFiltersBtn">إلغاء التصفية</button></div>` : ''}
    </div>
  `;
}

/* قائمة اختيار "القسم" — من أقسام الكورسات المعرّفة، مع خيار إضافة
   قسم جديد على طول من غير ما يحتاج المدير يروح مكان تاني */
function courseCategoryOptionsHtml(selectedId){
  const opts = state.courseCategories.map(cat =>
    `<option value="${cat.id}" ${String(cat.id) === String(selectedId) ? 'selected' : ''}>${escapeHtml(cat.title)}</option>`
  ).join('');
  return `<option value="">بدون قسم</option>${opts}<option value="__new__">+ إضافة قسم جديد</option>`;
}

function courseCategoryLabel(categoryId){
  const cat = state.courseCategories.find(c => String(c.id) === String(categoryId));
  return cat ? cat.title : '<span style="color:var(--text-400);">—</span>';
}

/* قائمة اختيار "قسم العضو" في صفحة الأعضاء — نفس أقسام الكورسات، من
   غير خيار "+ إضافة قسم جديد" (ده بيتم من صفحة الكورسات بس) */
function courseCategoryOptionsForMemberHtml(selectedId){
  const opts = state.courseCategories.map(cat =>
    `<option value="${cat.id}" ${String(cat.id) === String(selectedId) ? 'selected' : ''}>${escapeHtml(cat.title)}</option>`
  ).join('');
  return `<option value="">بدون قسم</option>${opts}`;
}

function courseRowHtml(c, isAdmin){
  if(isAdmin && courseEditingId === c.id){
    return `<tr class="course-edit-row" data-id="${c.id}">
      <td><input type="text" class="course-input course-edit-title" value="${escapeHtml(c.title)}" placeholder="عنوان الكورس"></td>
      <td><input type="url" class="course-input course-edit-url" value="${escapeHtml(c.url)}" placeholder="رابط الكورس"></td>
      <td>
        <select class="course-input course-edit-category">${courseCategoryOptionsHtml(c.categoryId)}</select>
        <input type="text" class="course-input course-edit-category-new hidden" placeholder="اسم القسم الجديد">
      </td>
      <td><input type="text" class="course-input course-edit-branch" value="${escapeHtml(c.branch || '')}" placeholder="الفرع (مثال: SEO)"></td>
      <td>
        <div class="row-actions">
          <button type="button" class="btn btn-primary btn-sm save-course-edit-btn" data-id="${c.id}" title="حفظ">${ICONS.check}</button>
          <button type="button" class="btn btn-ghost btn-sm cancel-course-edit-btn" title="إلغاء">${ICONS.x}</button>
        </div>
      </td>
    </tr>`;
  }
  return `<tr>
    <td>${escapeHtml(c.title)}</td>
    <td><a href="${escapeHtml(c.url)}" target="_blank" rel="noopener">${escapeHtml(c.url)}</a></td>
    <td>${courseCategoryLabel(c.categoryId)}</td>
    <td>${c.branch ? escapeHtml(c.branch) : '<span style="color:var(--text-400);">—</span>'}</td>
    ${isAdmin ? `<td>
      <div class="row-actions">
        <button type="button" class="btn btn-ghost btn-sm edit-course-btn" data-id="${c.id}">${ICONS.edit} تعديل</button>
        <button type="button" class="btn btn-danger btn-sm del-course-btn" data-id="${c.id}">${ICONS.trash} حذف</button>
      </div>
    </td>` : ''}
  </tr>`;
}

function courseAddRowHtml(){
  if(!courseAddingRow){
    return `<tr class="course-add-trigger-row">
      <td colspan="5">
        <button type="button" class="btn btn-ghost btn-sm" id="addCourseRowBtn">${ICONS.plus} إضافة كورس</button>
      </td>
    </tr>`;
  }
  return `<tr class="course-add-row">
    <td><input type="text" class="course-input" id="newCourseTitle" placeholder="عنوان الكورس"></td>
    <td><input type="url" class="course-input" id="newCourseUrl" placeholder="رابط الكورس"></td>
    <td>
      <select class="course-input" id="newCourseCategory">${courseCategoryOptionsHtml('')}</select>
      <input type="text" class="course-input hidden" id="newCourseCategoryNew" placeholder="اسم القسم الجديد">
    </td>
    <td><input type="text" class="course-input" id="newCourseBranch" placeholder="الفرع (مثال: SEO)"></td>
    <td>
      <div class="row-actions">
        <button type="button" class="btn btn-primary btn-sm" id="saveNewCourseBtn" title="حفظ">${ICONS.check}</button>
        <button type="button" class="btn btn-ghost btn-sm" id="cancelNewCourseBtn" title="إلغاء">${ICONS.x}</button>
      </div>
    </td>
  </tr>`;
}

function renderCoursesTableHtml(rows, isAdmin){
  const totalCourses = state.courses.length;
  if(!totalCourses && !isAdmin){
    return emptyState('grad', 'لا توجد كورسات بعد', 'هيظهر هنا أي كورس يضيفه المدير');
  }
  // فيه كورسات فعليًا، لكن الفلترة الحالية (قسم/فرع) معندهاش أي نتيجة
  const noMatchRow = (!rows.length && totalCourses)
    ? `<tr><td colspan="5" style="text-align:center;color:var(--text-400);padding:24px;">لا توجد كورسات مطابقة لهذه الفلترة</td></tr>`
    : '';
  return `
    <div class="table-wrap">
      <table class="res-table courses-table">
        <thead><tr>
          <th>العنوان</th>
          <th>الرابط</th>
          <th>القسم</th>
          <th>الفرع</th>
          ${isAdmin ? '<th></th>' : ''}
        </tr></thead>
        <tbody>
          ${noMatchRow}
          ${rows.map(c => courseRowHtml(c, isAdmin)).join('')}
          ${isAdmin ? courseAddRowHtml() : ''}
        </tbody>
      </table>
    </div>
  `;
}

function rerenderCoursesTable(){
  const wrap = $('#coursesTableWrap');
  if(!wrap) return;
  wrap.innerHTML = renderCoursesPageInnerHtml(state.currentUser.role === 'admin');
  bindCoursesEvents();
}

function bindCoursesEvents(){
  /* فلترة حسب القسم — اختيار قسم بيصفّر فلتر الفرع لأن الفروع المتاحة
     بتتغيّر حسب القسم المختار */
  const catFilterSel = $('#courseFilterCategorySel');
  if(catFilterSel) catFilterSel.addEventListener('change', () => {
    courseFilterCategory = catFilterSel.value;
    courseFilterBranch = '';
    rerenderCoursesTable();
  });

  /* فلترة حسب الفرع — مطابقة نصية تامة (نفس الحروف والطريقة بالظبط) */
  const branchFilterSel = $('#courseFilterBranchSel');
  if(branchFilterSel) branchFilterSel.addEventListener('change', () => {
    courseFilterBranch = branchFilterSel.value;
    rerenderCoursesTable();
  });

  const clearFiltersBtn = $('#clearCourseFiltersBtn');
  if(clearFiltersBtn) clearFiltersBtn.addEventListener('click', () => {
    courseFilterCategory = '';
    courseFilterBranch = '';
    rerenderCoursesTable();
  });

  const addBtn = $('#addCourseRowBtn');
  if(addBtn) addBtn.addEventListener('click', () => {
    courseAddingRow = true;
    rerenderCoursesTable();
    const t = $('#newCourseTitle'); if(t) t.focus();
  });

  const cancelAddBtn = $('#cancelNewCourseBtn');
  if(cancelAddBtn) cancelAddBtn.addEventListener('click', () => {
    courseAddingRow = false;
    rerenderCoursesTable();
  });

  /* إظهار/إخفاء حقل "اسم القسم الجديد" لما يختار "+ إضافة قسم جديد" من القائمة */
  const newCatSelect = $('#newCourseCategory'), newCatInput = $('#newCourseCategoryNew');
  if(newCatSelect && newCatInput) newCatSelect.addEventListener('change', () => {
    newCatInput.classList.toggle('hidden', newCatSelect.value !== '__new__');
    if(newCatSelect.value === '__new__') newCatInput.focus();
  });
  $$('.course-edit-category').forEach(sel => {
    const input = sel.parentElement.querySelector('.course-edit-category-new');
    if(!input) return;
    sel.addEventListener('change', () => {
      input.classList.toggle('hidden', sel.value !== '__new__');
      if(sel.value === '__new__') input.focus();
    });
  });

  /* بترجع categoryId جاهز — لو المدير اختار "+ إضافة قسم جديد" وكتب اسم،
     بتنشئ القسم الأول وترجّع الـ id بتاعه */
  async function resolveCourseCategoryId(selectEl, newInputEl){
    if(!selectEl || selectEl.value !== '__new__') return selectEl ? (selectEl.value || null) : null;
    const title = (newInputEl && newInputEl.value || '').trim();
    if(!title) throw new Error('برجاء إدخال اسم القسم الجديد');
    const { category } = await courseCategoryCreate(title);
    state.courseCategories.push(category);
    return category.id;
  }

  const saveNewBtn = $('#saveNewCourseBtn');
  if(saveNewBtn) saveNewBtn.addEventListener('click', async () => {
    const titleEl = $('#newCourseTitle'), urlEl = $('#newCourseUrl'), branchEl = $('#newCourseBranch');
    const title = titleEl.value.trim(), url = urlEl.value.trim();
    if(!title || !url){ toast('برجاء إدخال العنوان والرابط', 'err'); return; }
    saveNewBtn.disabled = true;
    try {
      const categoryId = await resolveCourseCategoryId($('#newCourseCategory'), $('#newCourseCategoryNew'));
      await apiFetch('/courses', { method: 'POST', body: JSON.stringify({ title, url, categoryId, branch: branchEl.value }) });
      courseAddingRow = true; // سيب سطر الإضافة مفتوح عشان يضيف كورس كورس على طول
      await refreshData();
      renderPage();
      toast('تمت إضافة الكورس', 'ok');
      const t = $('#newCourseTitle'); if(t) t.focus();
    } catch (err) {
      toast(err.message, 'err');
      saveNewBtn.disabled = false;
    }
  });

  [$('#newCourseTitle'), $('#newCourseUrl'), $('#newCourseBranch')].forEach(el => {
    if(!el) return;
    el.addEventListener('keydown', (e) => {
      if(e.key === 'Enter'){ e.preventDefault(); const b = $('#saveNewCourseBtn'); if(b) b.click(); }
    });
  });

  $$('.edit-course-btn').forEach(btn => btn.addEventListener('click', () => {
    courseEditingId = Number(btn.dataset.id);
    rerenderCoursesTable();
  }));

  $$('.cancel-course-edit-btn').forEach(btn => btn.addEventListener('click', () => {
    courseEditingId = null;
    rerenderCoursesTable();
  }));

  $$('.save-course-edit-btn').forEach(btn => btn.addEventListener('click', async () => {
    const id = Number(btn.dataset.id);
    const row = btn.closest('tr');
    const title = row.querySelector('.course-edit-title').value.trim();
    const url = row.querySelector('.course-edit-url').value.trim();
    const branch = row.querySelector('.course-edit-branch').value;
    if(!title || !url){ toast('برجاء إدخال العنوان والرابط', 'err'); return; }
    btn.disabled = true;
    try {
      const categoryId = await resolveCourseCategoryId(row.querySelector('.course-edit-category'), row.querySelector('.course-edit-category-new'));
      await apiFetch(`/courses/${id}`, { method: 'PUT', body: JSON.stringify({ title, url, categoryId, branch }) });
      courseEditingId = null;
      await refreshData();
      renderPage();
      toast('تم تحديث الكورس', 'ok');
    } catch (err) {
      toast(err.message, 'err');
      btn.disabled = false;
    }
  }));

  $$('.del-course-btn').forEach(btn => btn.addEventListener('click', async () => {
    if(!confirm('هل تريد حذف هذا الكورس؟')) return;
    try {
      await apiFetch(`/courses/${btn.dataset.id}`, { method: 'DELETE' });
      await refreshData();
      renderPage();
      toast('تم حذف الكورس', 'ok');
    } catch (err) { toast(err.message, 'err'); }
  }));
}

/* ============================================================
   PAGE: الشات — قناة "الفريق كله" + رسائل خاصة بين عضوين
   ============================================================ */
let chatSelectedTarget = 'team'; // 'team' أو رقم (كنص) لعضو معيّن
let chatPollTimer = null;

function stopChatPolling(){
  if(chatPollTimer){ clearInterval(chatPollTimer); chatPollTimer = null; }
}

function pageChat(){
  const others = state.users.filter(u => u.id !== state.currentUser.id && u.status === 'active');
  let targetUser = chatSelectedTarget !== 'team' ? findUser(Number(chatSelectedTarget)) : null;
  // لو العضو المختار قبل كده بقى مش موجود/متاح، ارجع لقناة الفريق تلقائيًا
  if(chatSelectedTarget !== 'team' && !targetUser){ chatSelectedTarget = 'team'; targetUser = null; }

  return `
    <div class="page-head">
      <div><h1>الشات</h1><p>تواصل مع الفريق كله، أو ابعت رسالة خاصة لعضو معيّن يشوفها هو بس</p></div>
    </div>
    <div class="chat-shell">
      <div class="card chat-sidebar">
        <button type="button" class="chat-target-btn ${chatSelectedTarget==='team'?'active':''}" data-target="team">
          ${ICONS.chat} <span>الفريق كله</span>
        </button>
        ${others.map(u => `
          <button type="button" class="chat-target-btn ${String(chatSelectedTarget)===String(u.id)?'active':''}" data-target="${u.id}">
            ${avatarWithPresence(u)} <span>${escapeHtml(u.name)}${u.role==='admin'?` (${roleLabel(u)})`:''}</span>
          </button>
        `).join('') || '<p style="font-size:12.5px;color:var(--text-400);padding:8px;">لا يوجد أعضاء تانيين بعد</p>'}
      </div>
      <div class="card chat-main">
        <div class="chat-header">${chatSelectedTarget==='team' ? `${ICONS.chat} الفريق كله` : `🔒 ${escapeHtml(targetUser ? targetUser.name : '')} — رسالة خاصة ${targetUser ? `· ${presenceLabelHtml(targetUser)}` : ''}`}</div>
        <div class="chat-messages" id="chatMessagesWrap"><p class="chat-empty">جاري تحميل الرسائل...</p></div>
        <form id="chatSendForm" class="chat-send-form">
          <input type="text" id="chatInput" placeholder="اكتب رسالة..." autocomplete="off" required>
          <button type="submit" class="btn btn-primary">إرسال</button>
        </form>
      </div>
    </div>
  `;
}

function renderChatMessages(){
  const wrap = $('#chatMessagesWrap');
  if(!wrap) return;
  const meId = state.currentUser.id;
  let list;
  if(chatSelectedTarget === 'team'){
    list = state.messages.filter(m => m.recipientId === null);
  } else {
    const otherId = Number(chatSelectedTarget);
    list = state.messages.filter(m =>
      (m.senderId === meId && m.recipientId === otherId) ||
      (m.senderId === otherId && m.recipientId === meId)
    );
  }
  if(!list.length){
    wrap.innerHTML = '<p class="chat-empty">لا توجد رسائل بعد — ابدأ المحادثة!</p>';
    return;
  }
  const wasAtBottom = wrap.scrollTop + wrap.clientHeight >= wrap.scrollHeight - 40;
  wrap.innerHTML = list.map(m => {
    const isMe = m.senderId === meId;
    const author = findUser(m.senderId);
    return `
      <div class="chat-bubble ${isMe ? 'me' : 'other'}" data-id="${m.id}">
        ${isMe ? `<button type="button" class="chat-bubble-del" data-id="${m.id}" title="حذف الرسالة (تُحذف عند الطرفين)">${ICONS.trash}</button>` : ''}
        ${!isMe ? `<div class="chat-bubble-meta">${escapeHtml(author ? author.name : 'مستخدم محذوف')}</div>` : ''}
        <div>${escapeHtml(m.content)}</div>
      </div>
    `;
  }).join('');
  if(wasAtBottom) wrap.scrollTop = wrap.scrollHeight;
}

async function loadMessages(){
  try {
    const data = await apiFetch('/messages');
    state.messages = data.messages || [];
    renderChatMessages();
  } catch (err) {
    // فشل هادئ أثناء التحديث التلقائي (polling) عشان ما نزعجش المستخدم برسائل خطأ متكررة
  }
}

function bindChatEvents(){
  $$('.chat-target-btn').forEach(btn => btn.addEventListener('click', () => {
    chatSelectedTarget = btn.dataset.target === 'team' ? 'team' : btn.dataset.target;
    renderPage();
  }));

  loadMessages();
  stopChatPolling();
  chatPollTimer = setInterval(loadMessages, 4000);

  // حذف رسالة (بتحذفها من قاعدة البيانات فعليًا، فتختفي عند الطرفين مباشرة) — تفويض
  // للحدث على الحاوية عشان يفضل شغال حتى بعد إعادة رسم الرسائل كل 4 ثواني
  const wrap = $('#chatMessagesWrap');
  if(wrap) wrap.addEventListener('click', async (e) => {
    const btn = e.target.closest('.chat-bubble-del');
    if(!btn) return;
    if(!confirm('حذف الرسالة؟ هتتشال عند الطرفين.')) return;
    try {
      await apiFetch(`/messages/${btn.dataset.id}`, { method: 'DELETE' });
      state.messages = state.messages.filter(m => String(m.id) !== btn.dataset.id);
      renderChatMessages();
    } catch (err) {
      toast(err.message, 'err');
    }
  });

  const form = $('#chatSendForm');
  if(form) form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('#chatInput');
    const content = input.value.trim();
    if(!content) return;
    input.value = '';
    input.focus();
    try {
      await apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({ recipientId: chatSelectedTarget === 'team' ? null : Number(chatSelectedTarget), content })
      });
      await loadMessages();
    } catch (err) {
      toast(err.message, 'err');
    }
  });
}

/* ============================================================
   PAGE: الأعضاء (Admin فقط)
   ============================================================ */
/* ============================================================
   PAGE: متابعة الفريق — لوحة إحصائيات + لوحة صدارة النقاط
   كل الأرقام هنا محسوبة من نفس البيانات المحمّلة أصلًا (state)، بنفس
   منطق الحساب المستخدم في صفحة "التقارير" (monthlyNegligentDays) —
   مفيش استدعاء إضافي للسيرفر، الصفحة دي عرض بس.
   ============================================================ */
function userLearningItems(userId){ return state.learning.filter(l => l.assignedTo === userId); }

function pageTeamOverview(){
  const viewerIsSuper = !!state.currentUser.isSuperAdmin;
  const members = viewerIsSuper
    ? state.users.filter(u => !u.isSuperAdmin && u.status !== 'pending')
    : state.users.filter(u => u.role === 'member' && u.status !== 'pending');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartStr = monthStart.getFullYear()+'-'+String(monthStart.getMonth()+1).padStart(2,'0')+'-01';

  const totalPoints = members.reduce((s,u) => s + (Number(u.points) || 0), 0);
  const totalTasks = members.reduce((s,u) => s + userTasks(u.id).length, 0);
  const doneTasks = members.reduce((s,u) => s + userTasks(u.id).filter(t=>t.status==='مكتملة').length, 0);
  const totalLearning = members.reduce((s,u) => s + userLearningItems(u.id).length, 0);
  const doneLearning = members.reduce((s,u) => s + userLearningItems(u.id).filter(l=>l.status==='تم التعلم').length, 0);
  const reportsThisMonth = members.reduce((s,u) => s + userReports(u.id).filter(r => r.date >= monthStartStr).length, 0);
  const avgNegligence = members.length
    ? (members.reduce((s,u) => s + (u.negligenceExempt ? 0 : monthlyNegligentDays(u.id, now).days), 0) / members.length)
    : 0;

  const rows = members.map(u => {
    const tasks = userTasks(u.id);
    const learning = userLearningItems(u.id);
    return {
      user: u,
      points: Number(u.points) || 0,
      tasksDone: tasks.filter(t=>t.status==='مكتملة').length,
      tasksTotal: tasks.length,
      learningDone: learning.filter(l=>l.status==='تم التعلم').length,
      learningTotal: learning.length,
      reportsMonth: userReports(u.id).filter(r => r.date >= monthStartStr).length,
      negligence: u.negligenceExempt ? null : monthlyNegligentDays(u.id, now).days
    };
  });

  const leaderboard = rows.slice().sort((a,b) => b.points - a.points).slice(0, 5);
  const medals = ['🥇','🥈','🥉','🏅','🏅'];

  return `
    <div class="page-head">
      <div><h1>متابعة الفريق</h1><p>نظرة عامة على أداء الفريق: النقاط، المهام، التعلم، والانتظام في التقارير</p></div>
      <button type="button" class="btn btn-ghost" id="printTeamBtn">${ICONS.printer || ''} طباعة / PDF</button>
    </div>

    <div class="stat-grid cols-6">
      <div class="stat-card"><div class="stat-num">${members.length}</div><div class="stat-label">أعضاء نشطون</div></div>
      <div class="stat-card"><div class="stat-num">${totalPoints}</div><div class="stat-label">إجمالي نقاط الفريق</div></div>
      <div class="stat-card"><div class="stat-num">${totalTasks ? Math.round(doneTasks/totalTasks*100) : 0}%</div><div class="stat-label">نسبة إكمال المهام</div></div>
      <div class="stat-card"><div class="stat-num">${totalLearning ? Math.round(doneLearning/totalLearning*100) : 0}%</div><div class="stat-label">نسبة إكمال مواد التعلم</div></div>
      <div class="stat-card"><div class="stat-num">${reportsThisMonth}</div><div class="stat-label">تقارير هذا الشهر</div></div>
      <div class="stat-card"><div class="stat-num">${avgNegligence.toFixed(1)}</div><div class="stat-label">متوسط أيام التقصير</div></div>
    </div>

    <div class="section-block">
      <h3 class="section-title">${ICONS.trophy} لوحة الصدارة (الأعلى نقاطًا)</h3>
      ${leaderboard.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>الترتيب</th><th>العضو</th><th>النقاط</th></tr></thead>
            <tbody>
              ${leaderboard.map((r,i) => `
                <tr>
                  <td>${medals[i] || (i+1)}</td>
                  <td class="cell-user">${avatarWithPresence(r.user)} <div style="font-weight:700;">${escapeHtml(r.user.name)}</div></td>
                  <td><b>${r.points}</b></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : emptyState('reports','لا توجد بيانات بعد','النقاط بتتجمّع تلقائيًا من تسجيل التقارير على الوقت وإكمال مواد التعلم')}
    </div>

    <div class="section-block">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <h3 class="section-title" style="margin:0;">تفاصيل كل عضو</h3>
        <button type="button" class="btn btn-ghost" id="exportTeamCsvBtn">${ICONS.download || ''} تصدير Excel</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>العضو</th><th>النقاط</th><th>المهام</th><th>مواد التعلم</th><th>تقارير الشهر</th><th>التقصير</th></tr>
          </thead>
          <tbody>
            ${rows.sort((a,b) => b.points - a.points).map(r => `
              <tr>
                <td class="cell-user">${avatarWithPresence(r.user)} <div style="font-weight:700;">${escapeHtml(r.user.name)}</div></td>
                <td><b>${r.points}</b></td>
                <td>${r.tasksDone} / ${r.tasksTotal}</td>
                <td>${r.learningDone} / ${r.learningTotal}</td>
                <td>${r.reportsMonth}</td>
                <td>${r.negligence === null ? '<span class="badge badge-green">مستثنى</span>' : `<span class="neg-count">${r.negligence} / 6</span>`}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function pageMembers(){
  const viewerIsSuper0 = !!state.currentUser.isSuperAdmin;
  // المدير العادي (مسؤول مش سوبر) يشوف أعضاء الفريق (role='member') بس
  // + نفسه — مش قادر يشوف صفوف مدراء تانيين ولا السوبر أدمن. السوبر
  // أدمن يشوف الكل بلا استثناء (يطابق تقييد الصلاحيات على مستوى RLS).
  const visibleUsers = viewerIsSuper0
    ? state.users
    : state.users.filter(u => u.role === 'member' || u.id === state.currentUser.id);
  const pending = visibleUsers.filter(u => u.status === 'pending');
  const active = visibleUsers.filter(u => u.status !== 'pending');

  return `
    <div class="page-head">
      <div><h1>الأعضاء</h1><p>${viewerIsSuper0 ? 'إدارة كل حسابات الفريق وطلبات الانضمام' : 'إدارة أعضاء فريقك وطلبات الانضمام'}</p></div>
      <button class="btn btn-amber" id="openMemberModalBtn">${ICONS.plus} إضافة عضو</button>
    </div>

    ${pending.length ? `
      <div class="section-block">
        <h3 class="section-title">طلبات بانتظار الموافقة (${pending.length})</h3>
        ${pending.map(u => `
          <div class="approval-card">
            <div class="approval-info">
              ${avatarHtml(u)}
              <div>
                <div style="font-weight:700;">${escapeHtml(u.name)}</div>
                <div class="approval-meta">${escapeHtml(u.email)} · طلب بتاريخ ${formatDate(u.createdAt)}</div>
                ${viewerIsSuper0 ? `<div class="approval-meta">${u.username ? '@'+escapeHtml(u.username) : 'بدون يوزر نيم'} · ${u.phone ? escapeHtml(u.phone) : 'بدون رقم هاتف'}</div>` : ''}
              </div>
            </div>
            <div class="row-actions">
              <button class="btn btn-primary btn-sm approve-btn" data-id="${u.id}">${ICONS.check} موافقة</button>
              <button class="btn btn-danger btn-sm reject-btn" data-id="${u.id}">${ICONS.x} رفض</button>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div class="section-block">
      <h3 class="section-title">جميع الأعضاء (${active.length})</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>العضو</th><th>الصلاحية</th><th>القسم</th><th>المهام</th><th>آخر تسجيل تقرير</th><th>التقصير</th><th>الحالة</th><th>إجراءات</th></tr>
          </thead>
          <tbody>
            ${active.map(u => {
              const lastReport = userReports(u.id).slice().sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''))[0];
              const isSelf = u.id === state.currentUser.id;
              const isSuper = !!u.isSuperAdmin;
              const viewerIsSuper = !!state.currentUser.isSuperAdmin;
              /* المدير العادي (مش سوبر) يقدر يدير الأعضاء (role='member') بس —
                 مش قادر يغيّر صلاحية حد لمدير/سوبر، ولا يعطّل/يحذف مدير تاني */
              const canManageTarget = viewerIsSuper || u.role === 'member';
              return `
              <tr>
                <td class="cell-user">${avatarWithPresence(u)} <div><div style="font-weight:700;">${escapeHtml(u.name)} ${isSuper ? '<span class="badge badge-amber" title="سوبر أدمن — محمي من حذف أو تعطيل أي حد تاني، ويقدر يحذف حسابه هو بنفسه بس">⭐ سوبر أدمن</span>' : (Number(u.points) > 0 ? `<span class="badge badge-green" title="نقاط الفريق — تُحتسب من تسجيل التقارير على الوقت وإكمال مواد التعلم">${ICONS.trophy} ${Number(u.points)}</span>` : '')}</div><div style="font-size:12px;color:var(--text-400);">${escapeHtml(u.email)}</div>${viewerIsSuper ? `<div style="font-size:12px;color:var(--text-400);">${u.username ? '@'+escapeHtml(u.username) : '<span style=\"color:var(--red-500);\">بدون يوزر نيم</span>'} ${u.phone ? '· ' + escapeHtml(u.phone) : '· <span style=\"color:var(--red-500);\">بدون رقم هاتف</span>'}</div>` : ''}${presenceLabelHtml(u)}</div></td>
                <td>
                  ${viewerIsSuper ? `
                    <select class="role-select" data-id="${u.id}" ${(isSelf || isSuper) ? 'disabled' : ''} aria-label="صلاحية العضو">
                      <option value="member" ${u.role==='member'?'selected':''}>عضو</option>
                      <option value="admin" ${u.role==='admin'?'selected':''}>مدير</option>
                    </select>
                  ` : `<span style="font-size:12.5px;">${roleLabel(u)}</span>`}
                </td>
                <td>
                  ${canManageTarget ? `
                    <select class="dept-select" data-id="${u.id}" data-prev="${u.departmentId || ''}" aria-label="قسم العضو">${courseCategoryOptionsForMemberHtml(u.departmentId)}</select>
                  ` : `<span style="font-size:12.5px;">${courseCategoryLabel(u.departmentId)}</span>`}
                </td>
                <td>${userTasks(u.id).length}</td>
                <td>${lastReport ? `${formatDateTime(lastReport.createdAt)}${isReportLate(lastReport) ? ' <span class="badge badge-red">متأخر</span>' : ''}` : '<span style="color:var(--text-400);">لا يوجد</span>'}</td>
                <td>${isSuper
                    ? '<span style="color:var(--text-400);">—</span>'
                    : u.negligenceExempt
                      ? '<span class="badge badge-green">مستثنى</span>'
                      : `<span class="neg-count">${monthlyNegligentDays(u.id, new Date()).days} / 6</span>${(viewerIsSuper && !isSuper) ? `
                        <span class="row-actions" style="display:inline-flex;gap:4px;margin-inline-start:6px;">
                          <button type="button" class="btn btn-ghost btn-sm btn-icon negligence-decrease-btn" data-id="${u.id}" title="إنقاص يوم تقصير (متاح للسوبر أدمن بس)">−</button>
                          <button type="button" class="btn btn-ghost btn-sm btn-icon negligence-increase-btn" data-id="${u.id}" title="إضافة يوم تقصير (متاح للسوبر أدمن بس)">+</button>
                        </span>` : ''}`}</td>
                <td>${u.status==='active'
                    ? '<span class="badge badge-green">نشط</span>'
                    : u.suspendedAuto
                      ? '<span class="badge badge-red">موقوف تلقائيًا (تقصير)</span>'
                      : '<span class="badge badge-red">معطّل يدويًا</span>'}</td>
                <td class="row-actions">
                  ${!isSelf ? `
                    ${(!isSuper && canManageTarget) ? `<button class="btn btn-ghost btn-sm toggle-status-btn" data-id="${u.id}">${u.status==='active'?'تعطيل':'تفعيل'}</button>` : ''}
                    ${(viewerIsSuper && !isSuper) ? `<button class="btn btn-ghost btn-sm toggle-negligence-exempt-btn" data-id="${u.id}" title="متاح للسوبر أدمن بس">${u.negligenceExempt ? 'إلغاء استثناء التقصير' : 'استثناء من التقصير'}</button>` : ''}
                    ${viewerIsSuper ? `<button class="btn btn-ghost btn-sm reset-pwd-btn" data-id="${u.id}" data-name="${escapeHtml(u.name)}">${ICONS.eyeOff} كلمة المرور</button>` : ''}
                    ${(!isSuper && canManageTarget) ? `<button class="btn btn-danger btn-sm btn-icon delete-member-btn" data-id="${u.id}" aria-label="حذف">${ICONS.trash}</button>` : ''}
                  ` : (isSuper ? `<button class="btn btn-danger btn-sm delete-self-btn" data-id="${u.id}">${ICONS.trash || ''} حذف حسابي</button>` : `<span style="font-size:12px;color:var(--text-400);">أنت</span>`)}
                </td>
              </tr>
            `;}).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ============================================================
   PAGE: الإعدادات
   ============================================================ */
function pageSettings(){
  const u = state.currentUser;
  return `
    <div class="page-head">
      <div><h1>الإعدادات</h1><p>تحديث بياناتك الشخصية وكلمة المرور</p></div>
    </div>
    <div class="settings-grid">
      <div class="card settings-card">
        <h3 class="section-title">الصورة الشخصية</h3>
        <div class="avatar-edit">
          ${avatarHtml(u, 'lg')}
          <div style="font-weight:700; margin-bottom:2px;">${escapeHtml(u.name)}</div>
          <div style="font-size:12.5px; color:var(--text-600); margin-bottom:8px;">${escapeHtml(u.email)}</div>
          ${!u.isSuperAdmin ? `<div style="margin-bottom:16px;"><span class="badge badge-green" title="تُحتسب من تسجيل التقارير على الوقت وإكمال مواد التعلم">${ICONS.trophy} ${Number(u.points) || 0} نقطة</span></div>` : ''}
          <input type="file" id="avatarInput" accept="image/*" class="hidden">
          <button class="btn btn-ghost btn-sm" id="changeAvatarBtn" style="margin:0 auto;">${ICONS.camera} تغيير الصورة</button>
        </div>
      </div>
      <div class="card settings-card">
        <h3 class="section-title">الاسم الكامل</h3>
        <form id="changeNameForm">
          <div class="form-row">
            <label for="fullName">الاسم</label>
            <input type="text" id="fullName" required value="${escapeHtml(u.name)}">
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">حفظ الاسم</button>
        </form>
      </div>
      <div class="card settings-card">
        <h3 class="section-title">تغيير كلمة المرور</h3>
        <form id="changePasswordForm">
          <div class="form-row">
            <label for="curPass">كلمة المرور الحالية</label>
            <div class="pwd-field"><input type="password" id="curPass" required><button type="button" class="pwd-toggle" data-target="curPass"></button></div>
          </div>
          <div class="form-row">
            <label for="newPass">كلمة المرور الجديدة</label>
            <div class="pwd-field"><input type="password" id="newPass" required minlength="8" placeholder="8 أحرف على الأقل"><button type="button" class="pwd-toggle" data-target="newPass"></button></div>
            <div class="pwd-strength" id="newPassStrength"></div>
          </div>
          <div class="form-row">
            <label for="confirmPass">تأكيد كلمة المرور الجديدة</label>
            <div class="pwd-field"><input type="password" id="confirmPass" required><button type="button" class="pwd-toggle" data-target="confirmPass"></button></div>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">حفظ كلمة المرور</button>
        </form>
      </div>
      <div class="card settings-card">
        <h3 class="section-title">مشاركة التطبيق</h3>
        <p style="font-size:13px; color:var(--text-600); margin-bottom:14px;">شارك رابط IT_qan مع زملائك في الفريق</p>
        <button type="button" class="btn btn-ghost" id="settingsShareBtn" style="width:100%;">${ICONS.share} مشاركة</button>
      </div>
    </div>
  `;
}

/* ============================================================
   EVENT BINDING PER PAGE
   ============================================================ */
function bindPageEvents(){
  // password toggles inside newly rendered content
  $$('#pageContent .pwd-toggle').forEach(btn => btn.innerHTML = ICONS.eye);

  if(state.activePage === 'tasks') bindTasksEvents();
  if(state.activePage === 'reports') bindReportsEvents();
  if(state.activePage === 'learning') bindLearningEvents();
  if(state.activePage === 'resources') bindResourcesEvents();
  if(state.activePage === 'courses') bindCoursesEvents();
  if(state.activePage === 'chat') bindChatEvents();
  if(state.activePage === 'members') bindMembersEvents();
  if(state.activePage === 'settings') bindSettingsEvents();
  if(state.activePage === 'team') bindTeamEvents();
}

function bindTeamEvents(){
  const printBtn = $('#printTeamBtn');
  if(printBtn) printBtn.addEventListener('click', () => window.print());
  const exportBtn = $('#exportTeamCsvBtn');
  if(!exportBtn) return;
  exportBtn.addEventListener('click', () => {
    const now = new Date();
    const monthStartStr = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01';
    const viewerIsSuperT = !!(state.currentUser && state.currentUser.isSuperAdmin);
    const membersT = viewerIsSuperT
      ? state.users.filter(u => !u.isSuperAdmin && u.status === 'active')
      : state.users.filter(u => u.role === 'member' && u.status === 'active');
    const rowsT = membersT.map(u => {
      const tasks = userTasks(u.id);
      const learning = userLearningItems(u.id);
      return {
        name: u.name,
        points: Number(u.points) || 0,
        tasksDone: tasks.filter(t=>t.status==='مكتملة').length,
        tasksTotal: tasks.length,
        learningDone: learning.filter(l=>l.status==='تم التعلم').length,
        learningTotal: learning.length,
        reportsMonth: userReports(u.id).filter(r => r.date >= monthStartStr).length,
        negligence: u.negligenceExempt ? null : monthlyNegligentDays(u.id, now).days
      };
    }).sort((a,b) => b.points - a.points);
    const csvRows = [
      ['العضو', 'النقاط', 'المهام المكتملة', 'إجمالي المهام', 'مواد التعلم المكتملة', 'إجمالي مواد التعلم', 'تقارير هذا الشهر', 'أيام التقصير'],
      ...rowsT.map(r => [
        r.name, r.points, r.tasksDone, r.tasksTotal, r.learningDone, r.learningTotal, r.reportsMonth,
        r.negligence === null ? 'مستثنى' : r.negligence
      ])
    ];
    exportToCSV('متابعة-الفريق', csvRows);
    toast('تم تصدير الملف', 'ok');
  });
}

function bindTasksEvents(){
  const openBtn = $('#openTaskModalBtn');
  if(openBtn) openBtn.addEventListener('click', () => openTaskModal());

  $$('.edit-task-btn').forEach(btn => btn.addEventListener('click', () => openTaskModal(Number(btn.dataset.id))));
  $$('.delete-task-btn').forEach(btn => btn.addEventListener('click', async () => {
    if(!confirm('هل تريد حذف هذه المهمة؟')) return;
    try {
      await apiFetch(`/tasks/${btn.dataset.id}`, { method: 'DELETE' });
      await refreshData();
      renderPage();
      toast('تم حذف المهمة', 'ok');
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
  $$('.task-status-select').forEach(sel => sel.addEventListener('change', async () => {
    const taskId = sel.dataset.task;
    try {
      await apiFetch(`/tasks/${taskId}/status`, { method: 'PUT', body: JSON.stringify({ status: sel.value }) });
      await refreshData();
      renderPage();
      toast('تم تحديث حالة المهمة', 'ok');
    } catch (err) {
      toast(err.message, 'err');
      renderPage(); // إعادة الحالة كما كانت في حال فشل الطلب
    }
  }));
  $$('.attach-task-btn').forEach(btn => btn.addEventListener('click', () => {
    const input = document.querySelector(`.attach-task-input[data-id="${btn.dataset.id}"]`);
    if(input) input.click();
  }));
  $$('.attach-task-input').forEach(input => input.addEventListener('change', async () => {
    const file = input.files[0];
    if(!file) return;
    if(file.size > 10 * 1024 * 1024){ toast('حجم الملف كبير جدًا (الحد الأقصى 10 ميجا)', 'err'); return; }
    try {
      toast('جاري رفع الملف...', 'ok');
      await tasksUploadAttachment(Number(input.dataset.id), file);
      await refreshData();
      renderPage();
      toast('تم إرفاق الملف بنجاح', 'ok');
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
  $$('.save-note-btn').forEach(btn => btn.addEventListener('click', async () => {
    const input = document.querySelector(`.task-note-input[data-id="${btn.dataset.id}"]`);
    const note = input ? input.value.trim() : '';
    try {
      await tasksSaveNote(Number(btn.dataset.id), note);
      await refreshData();
      renderPage();
      toast('تم حفظ الملاحظة', 'ok');
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
}

function populateAssigneeSelect(){
  const members = state.users.filter(u => u.status === 'active');
  $('#taskAssignee').innerHTML = members.map(u => `<option value="${u.id}">${escapeHtml(u.name)} ${u.role==='admin'?`(${roleLabel(u)})`:''}</option>`).join('');
}

function openTaskModal(taskId){
  populateAssigneeSelect();
  const overlay = $('#taskModalOverlay');
  const form = $('#taskForm');
  form.reset();
  if(taskId){
    const t = state.tasks.find(x => x.id === taskId);
    $('#taskModalTitle').textContent = 'تعديل المهمة';
    $('#taskId').value = t.id;
    $('#taskTitle').value = t.title;
    $('#taskDesc').value = t.description || '';
    $('#taskAssignee').value = t.assignedTo;
    $('#taskPriority').value = t.priority;
    $('#taskDue').value = t.dueDate;
  } else {
    $('#taskModalTitle').textContent = 'مهمة جديدة';
    $('#taskId').value = '';
    $('#taskDue').value = todayStr();
  }
  overlay.classList.remove('hidden');
}
function closeTaskModal(){ $('#taskModalOverlay').classList.add('hidden'); }

$('#taskModalClose').addEventListener('click', closeTaskModal);
$('#taskCancelBtn').addEventListener('click', closeTaskModal);
$('#taskModalOverlay').addEventListener('click', (e) => { if(e.target.id === 'taskModalOverlay') closeTaskModal(); });

$('#taskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const id = $('#taskId').value;
  const payload = {
    title: $('#taskTitle').value.trim(),
    description: $('#taskDesc').value.trim(),
    assignedTo: Number($('#taskAssignee').value),
    priority: $('#taskPriority').value,
    dueDate: $('#taskDue').value
  };
  setFormBusy(form, true);
  try {
    if(id){
      await apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      toast('تم تحديث المهمة', 'ok');
    } else {
      await apiFetch('/tasks', { method: 'POST', body: JSON.stringify(payload) });
      toast('تمت إضافة المهمة بنجاح', 'ok');
    }
    closeTaskModal();
    await refreshData();
    renderPage();
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    setFormBusy(form, false);
  }
});

function bindReportsEvents(){
  const isAdmin = state.currentUser.role === 'admin';
  const isSuper = !!state.currentUser.isSuperAdmin;
  /* من v15: أي حد مش سوبر أدمن (عضو أو مدير عادي) بيشوف قسم "تقرير
     جديد" الخاص بيه، لأنه بقى خاضع لاحتساب التقصير زي أي عضو */
  const showsOwnReportForm = !isSuper;

  if(showsOwnReportForm){
    reportPickedStatus = null;
    $$('.status-pill').forEach(pill => pill.addEventListener('click', () => {
      reportPickedStatus = pill.dataset.status;
      $$('.status-pill').forEach(p => p.className = 'status-pill');
      pill.classList.add(pill.dataset.cls);
      const postponeRow = $('#postponeRow');
      if(postponeRow) postponeRow.classList.toggle('hidden', reportPickedStatus !== 'لن يتم التعلم');
    }));
    const reportForm = $('#reportForm');
    if(reportForm) reportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      if(!reportPickedStatus){ toast('يرجى اختيار حالة التعلم', 'err'); return; }
      const desc = $('#reportDesc').value.trim();
      if(!desc){ toast('يرجى كتابة وصف ما تعلمته', 'err'); return; }
      const taskId = $('#reportTask').value ? Number($('#reportTask').value) : null;
      const postponeUntil = $('#reportPostpone') && $('#reportPostpone').value ? $('#reportPostpone').value : null;
      setFormBusy(form, true);
      try {
        await apiFetch('/reports', {
          method: 'POST',
          body: JSON.stringify({ status: reportPickedStatus, description: desc, taskId, postponeUntil })
        });
        reportPickedStatus = null;
        toast('تم حفظ التقرير بنجاح', 'ok');
        await refreshData();
        renderPage();
      } catch (err) {
        toast(err.message, 'err');
      } finally {
        setFormBusy(form, false);
      }
    });
    /* لغير المدير (عضو عادي) — الصفحة كلها هي قسم التقرير الخاص بيه بس،
       فلازم نربط أزرار تعديل/حذف تقاريره هنا. المدير العادي بياخد نفس
       الأزرار تلقائيًا لاحقًا عبر bindPostponeApprovalEvents في فرع
       isAdmin تحت (اللي بيغطي المستند كله بما فيه قسم تقاريره هو). */
    if(!isAdmin) bindReportOwnerEvents(document);
  }

  if(isAdmin){
    bindPostponeApprovalEvents(document);
    const monthSel = $('#reportsMonthSelect');
    if(monthSel) monthSel.addEventListener('change', () => {
      reportsMonthOffset = Number(monthSel.value) || 0;
      renderPage();
    });
    const exportNegBtn = $('#exportNegligenceCsvBtn');
    if(exportNegBtn) exportNegBtn.addEventListener('click', () => {
      const viewerIsSuperExp = !!(state.currentUser && state.currentUser.isSuperAdmin);
      const membersExp = viewerIsSuperExp
        ? state.users.filter(u => !u.isSuperAdmin)
        : state.users.filter(u => u.role === 'member');
      const monthExp = monthOffsetDate(reportsMonthOffset);
      const rowsExp = membersExp
        .map(m => ({ id:m.id, name:m.name, role:m.role, exempt: !!m.negligenceExempt, ...monthlyNegligentDays(m.id, monthExp) }))
        .sort((a,b) => b.days - a.days);
      const csvRows = [
        ['العضو', 'الدور', 'أيام التقصير', 'الحالة'],
        ...rowsExp.map(r => [
          r.name,
          r.role === 'admin' ? 'مدير' : 'عضو',
          r.exempt ? 'مستثنى' : r.days,
          r.exempt ? 'مستثنى من الاحتساب' : (r.days>=6 ? 'سيتم إيقافه' : r.days>=3 ? 'تحذير' : 'منتظم')
        ])
      ];
      exportToCSV(`تقصير-${monthOffsetLabel(reportsMonthOffset)}`, csvRows);
      toast('تم تصدير الملف', 'ok');
    });
    const printBtn = $('#printReportsBtn');
    if(printBtn) printBtn.addEventListener('click', () => window.print());
    $$('.neg-details-btn').forEach(btn => btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      expandedNegligenceUserId = expandedNegligenceUserId === id ? null : id;
      renderPage();
    }));
    $$('.forgive-negligence-day-btn').forEach(btn => btn.addEventListener('click', async () => {
      if(!confirm('إلغاء هذا اليوم من احتساب التقصير لهذا العضو؟')) return;
      try {
        const data = await negligenceForgiveDay(Number(btn.dataset.user), btn.dataset.date);
        await refreshData();
        renderPage();
        toast(data.message, 'ok');
      } catch (err) {
        toast(err.message, 'err');
      }
    }));
    $$('.unforgive-negligence-day-btn').forEach(btn => btn.addEventListener('click', async () => {
      if(!confirm('التراجع عن الإلغاء — هذا اليوم هيرجع يُحتسب تقصيرًا/تأخيرًا زي ما كان؟')) return;
      try {
        const data = await negligenceUnforgiveDay(Number(btn.dataset.user), btn.dataset.date);
        await refreshData();
        renderPage();
        toast(data.message, 'ok');
      } catch (err) {
        toast(err.message, 'err');
      }
    }));
    const filterSel = $('#reportFilterMember');
    const dateInput = $('#reportFilterDate');
    const clearBtn = $('#reportFilterClear');
    const refresh = () => renderAdminReportsList(filterSel.value, dateInput.value || null);
    renderAdminReportsList('all');
    if(filterSel) filterSel.addEventListener('change', refresh);
    if(dateInput) dateInput.addEventListener('change', refresh);
    if(clearBtn) clearBtn.addEventListener('click', () => {
      filterSel.value = 'all'; dateInput.value = '';
      renderAdminReportsList('all');
    });
    const exportReportsBtn = $('#exportReportsCsvBtn');
    if(exportReportsBtn) exportReportsBtn.addEventListener('click', () => {
      let filtered = state.reports;
      if(filterSel && filterSel.value !== 'all') filtered = filtered.filter(r => String(r.userId) === String(filterSel.value));
      if(dateInput && dateInput.value) filtered = filtered.filter(r => r.date === dateInput.value);
      const sorted = filtered.slice().sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
      const csvRows = [
        ['العضو', 'يوم التقرير', 'الحالة', 'الوصف', 'وقت التسجيل', 'ملاحظة المدير'],
        ...sorted.map(r => {
          const author = findUser(r.userId);
          return [
            author ? author.name : '',
            formatDateWithDay(r.date),
            r.status,
            r.description || '',
            formatDateTime(r.createdAt),
            r.managerNote || ''
          ];
        })
      ];
      exportToCSV('تقارير-الفريق', csvRows);
      toast('تم تصدير الملف', 'ok');
    });
  }
}

function bindMembersEvents(){
  const openBtn = $('#openMemberModalBtn');
  if(openBtn) openBtn.addEventListener('click', () => {
    $('#memberForm').reset();
    /* السوبر أدمن بس يقدر يضيف عضو بصلاحية "مدير" أو "سوبر أدمن"،
       المدير العادي يقدر يضيف "عضو" بس */
    const viewerIsSuper = !!(state.currentUser && state.currentUser.isSuperAdmin);
    $('#memRole').innerHTML = viewerIsSuper
      ? `<option value="member" selected>عضو</option><option value="admin">مدير</option><option value="superadmin">سوبر أدمن</option>`
      : `<option value="member" selected>عضو</option>`;
    $('#memberModalOverlay').classList.remove('hidden');
  });

  $$('.approve-btn').forEach(btn => btn.addEventListener('click', async () => {
    const u = findUser(Number(btn.dataset.id));
    try {
      const data = await apiFetch(`/users/${btn.dataset.id}/approve`, { method: 'PUT' });
      await refreshData();
      renderPage();
      toast(data.message || `تمت الموافقة على ${u ? u.name : ''}`, 'ok');
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
  $$('.reject-btn').forEach(btn => btn.addEventListener('click', async () => {
    if(!confirm('هل تريد رفض هذا الطلب نهائيًا؟')) return;
    try {
      await apiFetch(`/users/${btn.dataset.id}`, { method: 'DELETE' });
      await refreshData();
      renderPage();
      toast('تم رفض الطلب', 'err');
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
  $$('.toggle-status-btn').forEach(btn => btn.addEventListener('click', async () => {
    try {
      const data = await apiFetch(`/users/${btn.dataset.id}/toggle-status`, { method: 'PUT' });
      await refreshData();
      renderPage();
      toast(data.message || 'تم تحديث حالة العضو', 'ok');
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
  $$('.reset-pwd-btn').forEach(btn => btn.addEventListener('click', () => openResetPwdModal(Number(btn.dataset.id), btn.dataset.name)));
  $$('.delete-member-btn').forEach(btn => btn.addEventListener('click', async () => {
    const target = findUser(Number(btn.dataset.id));
    if(!confirm(`هل تريد حذف ${target ? target.name : 'هذا العضو'} نهائيًا؟`)) return;
    try {
      await apiFetch(`/users/${btn.dataset.id}`, { method: 'DELETE' });
      await refreshData();
      renderPage();
      toast('تم حذف العضو', 'ok');
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
  $$('.delete-self-btn').forEach(btn => btn.addEventListener('click', async () => {
    if(!confirm('هل أنت متأكد إنك عايز تحذف حسابك أنت شخصيًا نهائيًا؟ الإجراء ده لا يمكن التراجع عنه، وهيتم تسجيل خروجك فورًا.')) return;
    if(!confirm('تأكيد أخير: حذف حسابك هيشيل ملفك الشخصي وكل صلاحياتك نهائيًا من النظام. متأكد فعلًا؟')) return;
    try {
      await apiFetch(`/users/${btn.dataset.id}`, { method: 'DELETE' });
      toast('تم حذف حسابك', 'ok');
      await logout();
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
  $$('.role-select').forEach(sel => sel.addEventListener('change', async () => {
    const prevValue = sel.value === 'admin' ? 'member' : 'admin';
    try {
      const data = await apiFetch(`/users/${sel.dataset.id}/role`, { method: 'PUT', body: JSON.stringify({ role: sel.value }) });
      await refreshData();
      renderPage();
      toast(data.message || 'تم تحديث الصلاحية', 'ok');
    } catch (err) {
      sel.value = prevValue;
      toast(err.message, 'err');
    }
  }));
  $$('.dept-select').forEach(sel => sel.addEventListener('change', async () => {
    const prevValue = sel.dataset.prev !== undefined ? sel.dataset.prev : '';
    sel.disabled = true;
    try {
      const data = await apiFetch(`/users/${sel.dataset.id}/department`, { method: 'PUT', body: JSON.stringify({ departmentId: sel.value || null }) });
      await refreshData();
      renderPage();
      toast(data.message || 'تم تحديث قسم العضو', 'ok');
    } catch (err) {
      sel.value = prevValue;
      sel.disabled = false;
      toast(err.message, 'err');
    }
  }));
  $$('.toggle-negligence-exempt-btn').forEach(btn => btn.addEventListener('click', async () => {
    const target = findUser(Number(btn.dataset.id));
    const newExempt = !(target && target.negligenceExempt);
    try {
      const data = await apiFetch(`/users/${btn.dataset.id}/negligence-exempt`, { method: 'PUT', body: JSON.stringify({ exempt: newExempt }) });
      await refreshData();
      renderPage();
      toast(data.message || 'تم تحديث حالة الاستثناء', 'ok');
    } catch (err) {
      toast(err.message, 'err');
    }
  }));
  /* تعديل يدوي تراكمي لأيام التقصير (0-6) — مقصور على السوبر أدمن، ومطبّق
     أيضًا على مستوى قاعدة البيانات (increase_negligence/decrease_negligence) */
  $$('.negligence-increase-btn').forEach(btn => btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      const data = await apiFetch(`/users/${btn.dataset.id}/negligence-increase`, { method: 'PUT' });
      await refreshData();
      renderPage();
      toast(data.message || 'تم إضافة يوم تقصير', 'ok');
    } catch (err) {
      toast(err.message, 'err');
      btn.disabled = false;
    }
  }));
  $$('.negligence-decrease-btn').forEach(btn => btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      const data = await apiFetch(`/users/${btn.dataset.id}/negligence-decrease`, { method: 'PUT' });
      await refreshData();
      renderPage();
      toast(data.message || 'تم إنقاص يوم تقصير', 'ok');
    } catch (err) {
      toast(err.message, 'err');
      btn.disabled = false;
    }
  }));
}

$('#memberModalClose').addEventListener('click', () => $('#memberModalOverlay').classList.add('hidden'));
$('#memberCancelBtn').addEventListener('click', () => $('#memberModalOverlay').classList.add('hidden'));
$('#memberModalOverlay').addEventListener('click', (e) => { if(e.target.id === 'memberModalOverlay') $('#memberModalOverlay').classList.add('hidden'); });

$('#memberForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const email = $('#memEmail').value.trim().toLowerCase();
  const memPass = $('#memPassword').value;
  if(memPass.length < 8){ toast('كلمة المرور لازم تكون 8 أحرف على الأقل', 'err'); return; }
  const payload = {
    name: $('#memName').value.trim(),
    email,
    password: memPass,
    role: $('#memRole').value
  };
  setFormBusy(form, true);
  try {
    await apiFetch('/users', { method: 'POST', body: JSON.stringify(payload) });
    $('#memberModalOverlay').classList.add('hidden');
    await refreshData();
    renderPage();
    toast('تمت إضافة العضو بنجاح', 'ok');
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    setFormBusy(form, false);
  }
});

/* تعيين كلمة مرور جديدة لعضو (مدير فقط) */
let resetPwdTargetId = null;
function openResetPwdModal(id, name){
  resetPwdTargetId = id;
  $('#resetPwdModalTitle').textContent = `تعيين كلمة مرور جديدة — ${name}`;
  $('#resetPwdForm').reset();
  $('#resetPwdModalOverlay').classList.remove('hidden');
}
function closeResetPwdModal(){ $('#resetPwdModalOverlay').classList.add('hidden'); resetPwdTargetId = null; }

$('#resetPwdModalClose').addEventListener('click', closeResetPwdModal);
$('#resetPwdCancelBtn').addEventListener('click', closeResetPwdModal);
$('#resetPwdModalOverlay').addEventListener('click', (e) => { if(e.target.id === 'resetPwdModalOverlay') closeResetPwdModal(); });

$('#resetPwdForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  if(!resetPwdTargetId) return;
  const newPassword = $('#resetPwdNew').value;
  if(newPassword.length < 8){ toast('كلمة المرور لازم تكون 8 أحرف على الأقل', 'err'); return; }
  setFormBusy(form, true);
  try {
    const data = await usersResetPassword(resetPwdTargetId, newPassword);
    toast(data.message || 'تم تعيين كلمة المرور الجديدة', 'ok');
    closeResetPwdModal();
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    setFormBusy(form, false);
  }
});

function bindSettingsEvents(){
  const settingsShareBtn = $('#settingsShareBtn');
  if(settingsShareBtn) settingsShareBtn.addEventListener('click', shareApp);

  const nameForm = $('#changeNameForm');
  if(nameForm) nameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = $('#fullName').value.trim();
    if(!name){ toast('يرجى إدخال اسم صحيح', 'err'); return; }
    setFormBusy(form, true);
    try {
      const data = await apiFetch('/auth/name', { method: 'PUT', body: JSON.stringify({ name }) });
      state.currentUser = data.user;
      renderTopbar();
      toast('تم تحديث الاسم بنجاح', 'ok');
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setFormBusy(form, false);
    }
  });

  const changeBtn = $('#changeAvatarBtn');
  const fileInput = $('#avatarInput');
  if(changeBtn) changeBtn.addEventListener('click', () => fileInput.click());
  if(fileInput) fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if(!file) return;
    if(!file.type.startsWith('image/')){ toast('يرجى اختيار ملف صورة', 'err'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = await apiFetch('/auth/avatar', {
          method: 'PUT',
          body: JSON.stringify({ avatar: reader.result })
        });
        state.currentUser = data.user;
        renderPage();
        renderTopbar();
        toast('تم تحديث الصورة الشخصية', 'ok');
      } catch (err) {
        toast(err.message, 'err');
      }
    };
    reader.readAsDataURL(file);
  });

  $('#changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const cur = $('#curPass').value, nw = $('#newPass').value, cf = $('#confirmPass').value;
    if(!nw){ toast('يرجى كتابة كلمة المرور الجديدة', 'err'); return; }
    if(nw.length < 8){ toast('كلمة المرور الجديدة لازم تكون 8 أحرف على الأقل', 'err'); return; }
    if(nw !== cf){ toast('كلمتا المرور الجديدتان غير متطابقتين', 'err'); return; }
    setFormBusy(form, true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: cur, newPassword: nw, confirmPassword: cf })
      });
      form.reset();
      toast('تم تغيير كلمة المرور بنجاح', 'ok');
    } catch (err) {
      toast(err.message, 'err');
    } finally {
      setFormBusy(form, false);
    }
  });
}

/* ============================================================
   INIT
   ============================================================ */
initAuthTabs();
initThemeToggle();
tryRestoreSession();

})();
