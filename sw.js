// Network-first: always serve fresh files when online, fall back to cache offline.
// The app shell is precached at install, so the app works offline from the second
// visit even though the first visit loaded its modules before this worker controlled the page.

// Bump CACHE whenever APP_SHELL or any shell file changes so old caches are cleaned up.
const CACHE = 'app-v5';

// ---- APP_SHELL ------------------------------------------------------------
// Every file the app needs offline. `node scripts/check-shell.mjs` fails CI if a
// file under src/ (or index.html, manifest, icons/, mock/activities.json) is
// missing here, or if an entry here does not exist. Paths are relative to sw.js.
const APP_SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon.svg',
  'mock/activities.json',
  'src/app.js',
  'src/battery.js',
  'src/share/codec.js',
  'src/share/qr.js',
  'src/share/scan.js',
  'src/store/crypto.js',
  'src/store/idb.js',
  'src/store/index.js',
  'src/store/record.js',
  'src/store/store.js',
  'src/styles.css',
  'src/ui/dates.js',
  'src/ui/dom.js',
  'src/ui/screens/home.js',
  'src/ui/screens/log.js',
  'src/ui/screens/recent.js',
  'src/ui/screens/settings.js',
  'src/ui/screens/unlock.js',
  'src/ui/strings/en.js',
  'src/ui/view.js',
  'src/vendor/jsQR.js',
  'src/vendor/qrcodegen.js',
];
// ---------------------------------------------------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // cache: 'reload' bypasses the HTTP cache so we never precache a stale copy.
      .then((cache) => cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only same-origin GETs are handled; everything else goes straight to the network, uncached.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache only complete, successful same-origin responses (no errors, opaque or partial).
        if (response.ok && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
        }
        return response;
      })
      .catch(() =>
        caches.match(request, { ignoreSearch: request.mode === 'navigate' }).then((cached) => {
          if (cached) return cached;
          if (request.mode === 'navigate') return caches.match('index.html');
          return Response.error();
        }),
      ),
  );
});
