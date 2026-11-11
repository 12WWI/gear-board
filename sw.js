/* 離線用：有網路就拿最新版並存一份；沒網路（倉庫收訊差）就用存下來的那份。
   資料本身存在 IndexedDB，不經過這裡。 */
const CACHE = "gearboard-v2";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || req.url.endsWith("seed.json")) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const r = await fetch(req, { cache: "no-cache" });
      if (r.ok && (r.type === "basic" || r.type === "cors")) c.put(req, r.clone());
      return r;
    } catch (_) {
      return (await c.match(req, { ignoreSearch: req.mode === "navigate" })) || (await c.match("index.html")) || Response.error();
    }
  })());
});
