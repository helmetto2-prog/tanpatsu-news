// KY絵本アプリ：電波が無い所でも開けるように、アプリのフォルダの物だけ手元に置いておく
// （Gemini は service worker の頼みで止まる＝人類創世アプリで4回とも。まとんが jinrui/app/sw.js と同じ形で書いた・2026-10-28）
// 手元の写しの名前は "ky-app-" で始める。同じサイトのほかのアプリ（ninku-…・jinrui-app-…）の写しは消さない
const CACHE = "ky-app-v01";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "kan.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("ky-app-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// アプリのフォルダ（ky-app/）の物だけ扱う。../ の巻のページ・絵はブラウザにそのまま任せる。
// 取り方は「まずネット、つながらない時だけ手元の写し」
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
