/* =========================================================
   🌟 تعلم مع أ/ طه محمد 🌟
   service-worker.js — دعم العمل دون إنترنت والتثبيت
========================================================= */

const CACHE_VERSION = "taha-app-v31";
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

/* رسومات قسم الحروف (SVG محلية) — تُخزَّن بأفضل جهد ومنفصلة عن الهيكل:
   فشل أحدها لا يُفشل تثبيت التطبيق */
const LETTER_ART = [
    "./assets/images/letters/1f463.svg",
    "./assets/images/letters/1f9ed.svg",
    "./assets/images/letters/1f501.svg",
    "./assets/images/letters/1f575.svg",
    "./assets/images/letters/1f648.svg",
    "./assets/images/letters/1f3b5.svg",
    "./assets/images/letters/1f9f1.svg",
    "./assets/images/letters/1f33d.svg",
    "./assets/images/letters/1f4fa.svg",
    "./assets/images/letters/1f682.svg",
    "./assets/images/letters/1f99d.svg",
    "./assets/images/letters/1f309.svg",
    "./assets/images/letters/1f30c.svg",
    "./assets/images/letters/1f311.svg",
    "./assets/images/letters/1f313.svg",
    "./assets/images/letters/1f319.svg",
    "./assets/images/letters/1f31f.svg",
    "./assets/images/letters/1f333.svg",
    "./assets/images/letters/1f334.svg",
    "./assets/images/letters/1f335.svg",
    "./assets/images/letters/1f338.svg",
    "./assets/images/letters/1f339.svg",
    "./assets/images/letters/1f347.svg",
    "./assets/images/letters/1f348.svg",
    "./assets/images/letters/1f349.svg",
    "./assets/images/letters/1f34a.svg",
    "./assets/images/letters/1f34b.svg",
    "./assets/images/letters/1f34c.svg",
    "./assets/images/letters/1f34d.svg",
    "./assets/images/letters/1f34e.svg",
    "./assets/images/letters/1f351.svg",
    "./assets/images/letters/1f352.svg",
    "./assets/images/letters/1f353.svg",
    "./assets/images/letters/1f35e.svg",
    "./assets/images/letters/1f36f.svg",
    "./assets/images/letters/1f374.svg",
    "./assets/images/letters/1f37d.svg",
    "./assets/images/letters/1f380.svg",
    "./assets/images/letters/1f381.svg",
    "./assets/images/letters/1f382.svg",
    "./assets/images/letters/1f392.svg",
    "./assets/images/letters/1f3a7.svg",
    "./assets/images/letters/1f3c6.svg",
    "./assets/images/letters/1f3ca.svg",
    "./assets/images/letters/1f3d6.svg",
    "./assets/images/letters/1f3e0.svg",
    "./assets/images/letters/1f3eb.svg",
    "./assets/images/letters/1f3ee.svg",
    "./assets/images/letters/1f3f0.svg",
    "./assets/images/letters/1f404.svg",
    "./assets/images/letters/1f40a.svg",
    "./assets/images/letters/1f40d.svg",
    "./assets/images/letters/1f40e.svg",
    "./assets/images/letters/1f411.svg",
    "./assets/images/letters/1f412.svg",
    "./assets/images/letters/1f413.svg",
    "./assets/images/letters/1f414.svg",
    "./assets/images/letters/1f418.svg",
    "./assets/images/letters/1f419.svg",
    "./assets/images/letters/1f41d.svg",
    "./assets/images/letters/1f41f.svg",
    "./assets/images/letters/1f426-200d-2b1b.svg",
    "./assets/images/letters/1f426.svg",
    "./assets/images/letters/1f42a.svg",
    "./assets/images/letters/1f42c.svg",
    "./assets/images/letters/1f42d.svg",
    "./assets/images/letters/1f42f.svg",
    "./assets/images/letters/1f430.svg",
    "./assets/images/letters/1f433.svg",
    "./assets/images/letters/1f436.svg",
    "./assets/images/letters/1f438.svg",
    "./assets/images/letters/1f43a.svg",
    "./assets/images/letters/1f43b.svg",
    "./assets/images/letters/1f441.svg",
    "./assets/images/letters/1f442.svg",
    "./assets/images/letters/1f445.svg",
    "./assets/images/letters/1f451.svg",
    "./assets/images/letters/1f455.svg",
    "./assets/images/letters/1f457.svg",
    "./assets/images/letters/1f45e.svg",
    "./assets/images/letters/1f466.svg",
    "./assets/images/letters/1f467.svg",
    "./assets/images/letters/1f468-200d-1f373.svg",
    "./assets/images/letters/1f468-200d-2695-fe0f.svg",
    "./assets/images/letters/1f469.svg",
    "./assets/images/letters/1f46e-200d-2642-fe0f.svg",
    "./assets/images/letters/1f476.svg",
    "./assets/images/letters/1f485.svg",
    "./assets/images/letters/1f487.svg",
    "./assets/images/letters/1f4a1.svg",
    "./assets/images/letters/1f4aa.svg",
    "./assets/images/letters/1f4d3.svg",
    "./assets/images/letters/1f4d6.svg",
    "./assets/images/letters/1f4d8.svg",
    "./assets/images/letters/1f4e6.svg",
    "./assets/images/letters/1f4ef.svg",
    "./assets/images/letters/1f4f1.svg",
    "./assets/images/letters/1f50d.svg",
    "./assets/images/letters/1f511.svg",
    "./assets/images/letters/1f514.svg",
    "./assets/images/letters/1f519.svg",
    "./assets/images/letters/1f524.svg",
    "./assets/images/letters/1f53a.svg",
    "./assets/images/letters/1f54c.svg",
    "./assets/images/letters/1f56f.svg",
    "./assets/images/letters/1f5bc.svg",
    "./assets/images/letters/1f5e3.svg",
    "./assets/images/letters/1f5fa.svg",
    "./assets/images/letters/1f60a.svg",
    "./assets/images/letters/1f680.svg",
    "./assets/images/letters/1f697.svg",
    "./assets/images/letters/1f6a2.svg",
    "./assets/images/letters/1f6a9.svg",
    "./assets/images/letters/1f6aa.svg",
    "./assets/images/letters/1f6b2.svg",
    "./assets/images/letters/1f6cb.svg",
    "./assets/images/letters/1f6cf.svg",
    "./assets/images/letters/1f6e5.svg",
    "./assets/images/letters/1f947.svg",
    "./assets/images/letters/1f952.svg",
    "./assets/images/letters/1f955.svg",
    "./assets/images/letters/1f95b.svg",
    "./assets/images/letters/1f969.svg",
    "./assets/images/letters/1f96c.svg",
    "./assets/images/letters/1f981.svg",
    "./assets/images/letters/1f985.svg",
    "./assets/images/letters/1f986.svg",
    "./assets/images/letters/1f98a.svg",
    "./assets/images/letters/1f98b.svg",
    "./assets/images/letters/1f98c.svg",
    "./assets/images/letters/1f98d.svg",
    "./assets/images/letters/1f992.svg",
    "./assets/images/letters/1f99a.svg",
    "./assets/images/letters/1f9a4.svg",
    "./assets/images/letters/1f9b7.svg",
    "./assets/images/letters/1f9c0.svg",
    "./assets/images/letters/1f9c3.svg",
    "./assets/images/letters/1f9c4.svg",
    "./assets/images/letters/1f9ca.svg",
    "./assets/images/letters/1f9cd.svg",
    "./assets/images/letters/1f9e4.svg",
    "./assets/images/letters/1f9e9.svg",
    "./assets/images/letters/1f9f8.svg",
    "./assets/images/letters/1f9fa.svg",
    "./assets/images/letters/1fa80.svg",
    "./assets/images/letters/1fa91.svg",
    "./assets/images/letters/1fa9f.svg",
    "./assets/images/letters/1fab0.svg",
    "./assets/images/letters/1fab6.svg",
    "./assets/images/letters/1fad0.svg",
    "./assets/images/letters/1fad2.svg",
    "./assets/images/letters/23f0.svg",
    "./assets/images/letters/2600.svg",
    "./assets/images/letters/2601.svg",
    "./assets/images/letters/26bd.svg",
    "./assets/images/letters/26f0.svg",
    "./assets/images/letters/26fa.svg",
    "./assets/images/letters/2702.svg",
    "./assets/images/letters/2708.svg",
    "./assets/images/letters/2709.svg",
    "./assets/images/letters/270b.svg",
    "./assets/images/letters/270f.svg",
    "./assets/images/letters/2744.svg",
    "./assets/images/letters/2764.svg",
    "./assets/images/letters/2b50.svg"
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
                ).then(() =>
                    Promise.allSettled(
                        LETTER_ART.map(url =>
                            fetch(url).then(response =>
                                response && response.ok ? cache.put(url, response) : null
                            )
                        )
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
