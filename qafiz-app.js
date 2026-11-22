/* =========================================================
   🦘 qafiz-app.js — تشغيل لعبة «قافز المنصات» داخل التطبيق
   - اللعبة مستقلة في qafiz-platformer/ (ملفات dist فقط) وتُعرض داخل إطار iframe يملأ الشاشة.
   - زر «رجوع للألعاب» في غلاف التطبيق خارج الإطار.
   - لا تقرأ ولا تكتب أي بيانات للطلاب ولا تمسّ بقية الألعاب.
   - تحميل كسول: لا يُطلب أي ملف منها عند فتح التطبيق؛ ويُفرَّغ الإطار (about:blank) عند مغادرة
     الشاشة بأي طريقة فيتوقف صوت اللعبة ورسمها فورًا وتتحرر الذاكرة.
   - صوت التطبيق يُوقَف عند فتح الشاشة (showScreen ← stopAllAudio) فلا يتداخل مع صوت اللعبة.
   ========================================================= */
(function () {
    "use strict";
    var sec = document.getElementById("qafizGame");
    var fr = document.getElementById("qafizFrame");
    if (!sec || !fr) return;

    var loaded = false;
    function go(url) { try { fr.contentWindow.location.replace(url); } catch (e) { fr.setAttribute("src", url); } }
    function sync() {
        var on = sec.classList.contains("active");
        if (on && !loaded) { loaded = true; go(fr.getAttribute("data-src")); }
        if (!on && loaded) { loaded = false; go("about:blank"); }
    }
    fr.addEventListener("load", function () { if (loaded) { try { fr.contentWindow.focus(); } catch (e) { /* لا شيء */ } } });

    /* العمل دون إنترنت: بعد أن تُفتح اللعبة متصلة وتستقر نطلب من service worker تخزين ملفاتها
       في كاشها المستقل (QAFIZ_CACHE). بأفضل جهد: لا يؤثر فشله على اللعبة ولا على التطبيق. */
    var warmTimer = 0;
    function warm() {
        try {
            if (!loaded || !navigator.onLine || !navigator.serviceWorker || !navigator.serviceWorker.controller) return;
            var ch = new MessageChannel();
            ch.port1.onmessage = function (ev) { window.__qafizCache = ev.data; };
            navigator.serviceWorker.controller.postMessage({ type: "CACHE_QAFIZ_GAME" }, [ch.port2]);
        } catch (e) { /* بصمت */ }
    }
    fr.addEventListener("load", function () {
        if (!loaded) return;
        clearTimeout(warmTimer);
        warmTimer = setTimeout(warm, 8000);
    });
    new MutationObserver(sync).observe(sec, { attributes: true, attributeFilter: ["class"] });
    sync();

    window.startQafizGame = function () { showScreen("qafizGame"); };
    window.exitQafizGame = function () { showScreen("games"); };
})();
