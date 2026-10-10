/* =========================================================
   🌟 تعلم مع أ/ طه محمد 🌟
   service-worker.js — دعم العمل دون إنترنت والتثبيت
========================================================= */

const CACHE_VERSION = "taha-app-v10";
const CACHE_NAME = CACHE_VERSION;

const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/icon-maskable-512.png",
    "./icons/apple-touch-icon.png"
];

/* =========================================================
   📦 التثبيت: تخزين ملفات التطبيق الأساسية
========================================================= */

self.addEventListener("install", event => {

    /* cache: "reload" يتجاوز كاش المتصفح (HTTP) فلا تُخزَّن نسخة قديمة من
       script.js أو style.css بجانب index.html جديد عند التحديث */
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(cache =>
                Promise.all(
                    APP_SHELL.map(url =>
                        fetch(new Request(url, { cache: "reload" })).then(response => {
                            if (!response || !response.ok) {
                                throw new Error("bad response for " + url);
                            }
                            return cache.put(url, response);
                        })
                    )
                )
            )
            .catch(() => {})
    );

    self.skipWaiting();
});

/* =========================================================
   🧹 التفعيل: حذف النسخ القديمة من الكاش
========================================================= */

self.addEventListener("activate", event => {

    event.waitUntil(
        caches
            .keys()
            .then(keys =>
                Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                )
            )
    );

    self.clients.claim();
});

/* =========================================================
   🌐 الطلبات: كاش أولًا ثم الشبكة (Cache First)
   مع تحديث الكاش في الخلفية عند توفر الاتصال
========================================================= */

self.addEventListener("fetch", event => {

    const request = event.request;

    if (request.method !== "GET") return;

    /* تجاهل طلبات المصادر الخارجية (مثل أصوات النطق) */
    if (!request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(request).then(cachedResponse => {

            const networkFetch = fetch(request)
                .then(networkResponse => {

                    if (
                        networkResponse &&
                        networkResponse.status === 200
                    ) {
                        const clone = networkResponse.clone();

                        caches
                            .open(CACHE_NAME)
                            .then(cache =>
                                cache.put(request, clone)
                            )
                            .catch(() => {});
                    }

                    return networkResponse;
                })
                .catch(() => {

                    /* لا يوجد اتصال: أعد صفحة index كحل بديل للتنقل */
                    if (request.mode === "navigate") {
                        return caches.match("./index.html");
                    }

                    return cachedResponse;
                });

            return cachedResponse || networkFetch;
        })
    );
});
