// 株の朝刊アプリ（asa-k7）：電波が無い所でも開けるように、アプリのフォルダの物だけ手元に置いておく
// 手元の写しの名前は "asa-k7-app-" で始める。同じサイトのほかのアプリの写し、
// それに画面が自分で取っておく号の写し（asa-k7-news）は消さない
const CACHE = "asa-k7-app-v01";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "top.jpg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("asa-k7-app-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// アプリのフォルダの物だけ扱う。朝刊（zoennews/kabu/）は画面が自分で「まずネット」で取りに行く
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.registration.scope)) return;
  const key = e.request.url.split("?")[0];
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(key, copy));
        }
        return res;
      })
      .catch(() => caches.match(key).then(hit => hit || caches.match("index.html")))
  );
});
