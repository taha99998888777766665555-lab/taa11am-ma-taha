/* =========================================================
   📲 pwa-install.js — زر «تثبيت التطبيق» في الصفحة الرئيسية
   - Android / الكمبيوتر (Chrome وEdge وSamsung Internet…): يظهر الزر فقط بعد أن يرسل المتصفح
     حدث beforeinstallprompt، ويفتح نافذة التثبيت الأصلية. لا حدث = لا زر ولا رسالة.
   - iPhone / iPad (لا يدعمان نافذة تلقائية): يظهر الزر ويعرض تعليمات «مشاركة ← إضافة إلى الشاشة الرئيسية».
   - يختفي الزر إن كان التطبيق مفتوحًا كتطبيق مثبّت (standalone) أو بعد حدث appinstalled.
   - لا يقرأ ولا يكتب أي تخزين (لا localStorage ولا كوكيز)، ولا يلمس بيانات الطلاب.
   - يشارك الحدث المحفوظ في script.js (deferredInstallPrompt) فيبقى زر الإعدادات يعمل كما كان.
   ========================================================= */
(function () {
    "use strict";
    var wrap = document.getElementById("hmInstall");
    var btn = document.getElementById("hmInstallBtn");
    var dlg = document.getElementById("hmInstallIos");
    if (!wrap || !btn) return;

    var ua = navigator.userAgent || "";
    var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    /* متصفحات داخل تطبيقات (فيسبوك/إنستغرام/واتساب…) لا تملك قائمة إضافة للشاشة الرئيسية */
    var inAppBrowser = /FBAN|FBAV|Instagram|Line\/|MicroMessenger|Snapchat|TikTok|Twitter/.test(ua);
    var ev = null;          /* حدث التثبيت المحفوظ (Android/الكمبيوتر) */
    var installed = false;

    function isStandalone() {
        try {
            if (window.navigator.standalone === true) return true;
            var q = ["standalone", "fullscreen", "minimal-ui", "window-controls-overlay"];
            for (var i = 0; i < q.length; i++) {
                if (window.matchMedia && window.matchMedia("(display-mode: " + q[i] + ")").matches) return true;
            }
        } catch (e) { /* لا شيء */ }
        return false;
    }

    function render() {
        var show = false;
        if (!installed && !isStandalone()) {
            if (ev) show = true;
            else if (isIOS && !inAppBrowser) show = true;
        }
        wrap.hidden = !show;
        if (!show) closeIos();
    }

    function openIos() {
        if (!dlg) return;
        dlg.hidden = false;
        var c = dlg.querySelector("button");
        if (c) try { c.focus(); } catch (e) { /* لا شيء */ }
    }
    function closeIos() { if (dlg) dlg.hidden = true; }

    btn.addEventListener("click", function () {
        if (ev) {
            var e = ev;
            ev = null;                       /* الحدث يُستعمل مرة واحدة */
            try { if (typeof deferredInstallPrompt !== "undefined") deferredInstallPrompt = null; } catch (x) { /* لا شيء */ }
            try { var sb = document.getElementById("settingsInstallBtn"); if (sb) sb.style.display = "none"; } catch (x) { /* لا شيء */ }
            wrap.hidden = true;
            try {
                e.prompt();
                if (e.userChoice && e.userChoice.then) {
                    e.userChoice.then(function (r) { if (r && r.outcome === "accepted") { installed = true; render(); } });
                }
            } catch (x) { /* لا شيء */ }
        } else if (isIOS) {
            openIos();
        }
    });
    if (dlg) {
        dlg.addEventListener("click", function (e) { if (e.target === dlg) closeIos(); });
        dlg.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", closeIos); });
        document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !dlg.hidden) closeIos(); });
    }

    window.addEventListener("beforeinstallprompt", function (e) {
        e.preventDefault();
        ev = e;
        render();
    });
    window.addEventListener("appinstalled", function () { installed = true; ev = null; render(); });
    try {
        var mq = window.matchMedia("(display-mode: standalone)");
        if (mq.addEventListener) mq.addEventListener("change", render);
    } catch (e) { /* لا شيء */ }

    render();
    /* اختبار/تشخيص فقط: لا يغيّر شيئًا */
    window.taInstallState = function () { return { ios: isIOS, inApp: inAppBrowser, standalone: isStandalone(), hasPrompt: !!ev, visible: !wrap.hidden }; };
})();
