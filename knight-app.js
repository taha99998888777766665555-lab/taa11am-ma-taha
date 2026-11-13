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
    new MutationObserver(sync).observe(sec, { attributes: true, attributeFilter: ["class"] });
    sync();

    window.startKnightGame = function () { showScreen("knightGame"); };
    window.exitKnightGame = function () { showScreen("games"); };
})();
