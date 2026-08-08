// IT_qan — Service Worker
// وظيفته: (1) يخلي الموقع يتثبت كتطبيق (PWA) ويفتح بدون شريط متصفح،
// (2) يستقبل إشعارات Push حتى لو الموقع مقفول تمامًا، ويعرضها كإشعار نظام حقيقي.

const CACHE_NAME = 'itqan-shell-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// شبكة أولًا لملف الصفحة الرئيسية (عشان أي تحديث للموقع يوصل فورًا)،
// وكاش أولًا للباقي (أيقونات/مانيفست) — مع Fallback للكاش لو النت مقطوع
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).catch(() => cached))
  );
});

// ------------------------------------------------------------
// Push Notifications — بتوصل من السيرفر (Edge Function) لما يتسجل
// إشعار جديد في جدول notifications على Supabase
// ------------------------------------------------------------
self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) { payload = { title: 'IT_qan', body: event.data ? event.data.text() : '' }; }

  const title = payload.title || 'IT_qan';
  const options = {
    body: payload.body || '',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    dir: 'rtl',
    lang: 'ar',
    tag: payload.tag || 'itqan-notif',
    renotify: true,
    data: { url: payload.url || './index.html' },
    vibrate: [100, 50, 100]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// لما المستخدم يدوس على الإشعار: يفتح تاب موجود لو لقاه، وإلا يفتح تاب جديد
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './index.html';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(targetUrl).catch(() => {});
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
