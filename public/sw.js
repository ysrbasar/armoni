/* Armoni service worker: çevrimdışı açılış, önbellek ve push bildirimleri */
const VERSION = "__VERSION__";
const CACHE = `armoni-${VERSION}`;
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/badge-96.png", ...__PRECACHE__];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("armoni-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.includes("/api/")) return;

  // Sayfa: önce ağ, çevrimdışıysa önbellekteki uygulama kabuğu
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put("./index.html", res.clone()));
          return res;
        })
        .catch(() => caches.match("./index.html")),
    );
    return;
  }

  // Derlenmiş dosyalar ve yazı tipleri: önce önbellek
  if (url.origin === location.origin || url.host.endsWith("fonts.gstatic.com") || url.host.endsWith("fonts.googleapis.com")) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok || res.type === "opaque") {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});

self.addEventListener("push", (e) => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch {
    data = { title: "Armoni", body: e.data ? e.data.text() : "" };
  }
  e.waitUntil(
    self.registration.showNotification(data.title || "Armoni", {
      body: data.body || "",
      icon: "./icons/icon-192.png",
      badge: "./icons/badge-96.png",
      tag: data.tag || undefined,
      data: { url: data.url || "./" },
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = new URL(e.notification.data?.url || "./", self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate(target).catch(() => {});
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
