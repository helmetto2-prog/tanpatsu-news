// 人類創世アプリ：電波が無い所でも開けるように、アプリのフォルダの物だけ手元に置いておく
// （この sw.js は Gemini が4回とも書けずに止まったので、まとんが人工計算アプリ（ninku/sw.js）と同じ形で書いた・2026-10-28）
const CACHE = "jinrui-app-v03"; // まとん直し（v03）：録音の声で読む（画面を消しても続く）・村の年表
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "nen.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("jinrui-app-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// アプリのフォルダ（jinrui/app/）の物だけ扱う。../ の絵・声・アニメ・物語のページはブラウザにそのまま任せる
// （動画の部分読み込みを壊さないため）。取り方は「まずネット、つながらない時だけ手元の写し」
// 読み上げの録音（yomi/*.mp3）も、部分読み込みを壊さないようにブラウザに任せる（まとん直し v03）
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.registration.scope)) return;
  if (/\.mp3(\?|#|$)/.test(e.request.url)) return;
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
