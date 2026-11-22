// 竹中さんのアプリ（asobi-t4）：入口の画面を手元に置いておく。ゲーム本体は別の場所なので扱わない
// 手元の写しの名前は "asobi-t4-app-" で始める。同じサイトのほかのアプリの写しは消さない
const CACHE = "asobi-t4-app-v03";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("asobi-t4-app-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// まずネット、だめなら手元の写し
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.registration.scope)) return;
  const key = e.request.url.split("?")[0];
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
        return res;
      })
      .catch(() => caches.match(key).then(hit => hit || caches.match("index.html")))
  );
});
