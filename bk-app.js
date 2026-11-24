/* =========================================================
   📖 bk-app.js — «بيت الكلمات» داخل قسم «الكلمات»
   - الصفحة مستقلة في beit-al-kalimat/index.html وتُعرض داخل إطار يملأ الشاشة؛ تحميل كسول
     (لا يُطلب شيء منها عند فتح التطبيق) ويُفرَّغ الإطار عند مغادرة القسم فيتوقف صوته.
   - لا تقرأ ولا تكتب بيانات التطبيق؛ بيانات طلابها في مفاتيح wsb_* في المتصفح نفسه.
   ========================================================= */
(function () {
    "use strict";
    var sec = document.getElementById("words");
    var fr = document.getElementById("bkFrame");
    if (!sec || !fr) return;
    var loaded = false;
    function go(url) { try { fr.contentWindow.location.replace(url); } catch (e) { fr.setAttribute("src", url); } }
    function sync() {
        var on = sec.classList.contains("active");
        if (on && !loaded) { loaded = true; go(fr.getAttribute("data-src")); }
        if (!on && loaded) { loaded = false; go("about:blank"); }
    }
    new MutationObserver(sync).observe(sec, { attributes: true, attributeFilter: ["class"] });
    sync();
})();
