const CACHE = 'jct-v112';
const BASE  = '/CTAPTracker';

// The app holds no server-side anything (ADR-0015), so a cached copy is a
// complete, working app — not a degraded one. Worth precaching properly: an
// engineer's first offline use is often in a plant room on day one.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([
      BASE + '/',
      BASE + '/index.html',
      BASE + '/app.js',
      BASE + '/data.cjs',
      BASE + '/pixel-engineer.js',
      BASE + '/style.css',
      BASE + '/fonts.css',
      // Self-hosted font (ADR-0016). DM Sans is a variable font, so one file
      // per subset carries every weight the app uses.
      BASE + '/fonts/DMSans-latin.woff2',
      BASE + '/manifest.json',
      BASE + '/icons/icon-192.png',
      BASE + '/icons/icon-512.png',
    ])).catch(() => {})   // one 404 must not fail the whole install
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      // Drop superseded caches only — the previous code deleted every key
      // including CACHE itself, wiping the precache seconds after install and
      // leaving a fresh install with nothing to fall back on offline.
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first, so a deploy reaches testers on their next online load; cache
// is the offline fallback.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      // `ignoreSearch` because assets are requested with a ?v= cache-buster:
      // a strict match would miss app.js?v=167 when asked for app.js?v=168 and
      // leave the engineer with nothing. Offline, a slightly stale app beats a
      // blank screen — the next online load corrects it.
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
