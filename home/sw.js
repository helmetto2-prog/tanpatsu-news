// みどりのホームの入口（みんな用）：入口のページだけを手元に写す（アプリ本体＝script.google.com は写さない）
const CACHE = "home-v01";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "../icons/midori-senmu-192.png", "../icons/midori-senmu-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  // 同じサイトのほかのアプリ（人工計算・KY絵本・人類創世）の写しは消さない＝home- で始まる古い物だけ
  e.waitUntil(caches.keys().then((ks) => Promise.all(
    ks.filter((k) => k.startsWith("home-") && k !== CACHE).map((k) => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== self.location.origin) return;
  // 新しい物を先に取りに行き、電波が無い時だけ写しを出す
  e.respondWith(
    fetch(e.request).then((r) => {
      const c = r.clone();
      caches.open(CACHE).then((ca) => ca.put(e.request, c)).catch(() => {});
      return r;
    }).catch(() => caches.match(e.request))
  );
});
