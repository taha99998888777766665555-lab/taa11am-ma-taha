/* =========================================================
   🏎️ heroes-app.js — تشغيل لعبة «تحدي أبطال الجمع» داخل التطبيق
   - اللعبة مستقلة في addition-heroes/ وتُعرض داخل إطار iframe يملأ الشاشة.
   - لا تلمس بيانات الطلاب ولا النجوم ولا أي قسم آخر (لا تقرأ ولا تكتب في التخزين).
   - يُحمَّل الإطار عند فتح الشاشة ويُفرَّغ عند مغادرتها (تتوقف المؤقتات والصوت).
   ========================================================= */
(function () {
    "use strict";
    var sec = document.getElementById("additionHeroes");
    var fr = document.getElementById("heroesFrame");
    if (!sec || !fr) return;

    /* location.replace لا يضيف إدخالًا إلى سجل المتصفح، فيبقى زر الرجوع متسقًا مع nav.js */
    var loaded = false;
    function go(url) { try { fr.contentWindow.location.replace(url); } catch (e) { fr.setAttribute("src", url); } }
    function sync() {
        var on = sec.classList.contains("active");
        if (on && !loaded) { loaded = true; go(fr.getAttribute("data-src")); }
        if (!on && loaded) { loaded = false; go("about:blank"); }
    }
    new MutationObserver(sync).observe(sec, { attributes: true, attributeFilter: ["class"] });
    sync();

    window.startAdditionHeroes = function () { showScreen("additionHeroes"); };
    window.exitAdditionHeroes = function () { showScreen("games"); };
})();
