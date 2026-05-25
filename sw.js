// GuestBook Service Worker
// Caches static assets so the app shell loads offline

const CACHE = 'guestbook-v1';
const ASSETS = [
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never intercept Supabase API calls — let them fail naturally when offline
  if (url.includes('supabase.co')) return;

  // Cache-first for static assets (fonts, icons, CDN libraries)
  if (
    url.includes('fonts.googleapis') ||
    url.includes('fonts.gstatic') ||
    url.includes('jsdelivr')
  ) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  // Network-first for the app HTML itself — fall back to cache when offline
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
