/* =========================================================
   🛡️ knight-app.js — تشغيل لعبة «مغامرة الفارس – تعلّم العد» داخل التطبيق
   - اللعبة مستقلة في knight-counting/ وتُعرض داخل إطار iframe يملأ الشاشة.
   - لا تقرأ ولا تكتب أي بيانات (لا نجوم ولا تقدّم ولا بيانات طلاب) ولا تمسّ بقية الألعاب.
   - تحميل كسول: لا يُطلب أي ملف ثلاثي الأبعاد أو صوت إلا عند فتح الشاشة؛
     ويُفرَّغ الإطار عند مغادرتها فيتوقف الرسم والصوت وتتحرر الذاكرة.
   ========================================================= */
(function () {
    "use strict";
    var sec = document.getElementById("knightGame");
    var fr = document.getElementById("knightFrame");
    if (!sec || !fr) return;

    /* location.replace لا يضيف إدخالًا إلى سجل المتصفح، فيبقى زر الرجوع متسقًا مع nav.js */
    var loaded = false;
    function go(url) { try { fr.contentWindow.location.replace(url); } catch (e) { fr.setAttribute("src", url); } }
    function sync() {
        var on = sec.classList.contains("active");
        if (on && !loaded) { loaded = true; go(fr.getAttribute("data-src")); }
        if (!on && loaded) { loaded = false; go("about:blank"); }
    }
    /* لوحة المفاتيح تعمل داخل اللعبة فور فتحها */
    fr.addEventListener("load", function () { if (loaded) { try { fr.contentWindow.focus(); } catch (e) { /* لا شيء */ } } });
    /* العمل دون إنترنت: بعد أن تُفتح اللعبة متصلة وتستقر (٨ ثوانٍ كي لا نزاحم تحميلها)
       نطلب من service worker تخزين بقية ملفاتها (بيئات المستويات الأخرى والأصوات). بأفضل جهد:
       لا يؤثر فشله على اللعبة ولا على التطبيق، وبعد اكتماله يصبح الطلب فحصًا سريعًا فقط. */
    var warmTimer = 0;
    function warm() {
        try {
            if (!loaded || !navigator.onLine || !navigator.serviceWorker || !navigator.serviceWorker.controller) return;
            var ch = new MessageChannel();
            ch.port1.onmessage = function (ev) { window.__knightCache = ev.data; };
            navigator.serviceWorker.controller.postMessage({ type: "CACHE_KNIGHT_GAME" }, [ch.port2]);
        } catch (e) { /* بصمت */ }
    }
    fr.addEventListener("load", function () {
        if (!loaded) return;
        clearTimeout(warmTimer);
        warmTimer = setTimeout(warm, 8000);
    });
    new MutationObserver(sync).observe(sec, { attributes: true, attributeFilter: ["class"] });
    sync();

    window.startKnightGame = function () { showScreen("knightGame"); };
    window.exitKnightGame = function () { showScreen("games"); };
})();
