/* =========================================================
   🎨 ui2.js — نموذج المرحلة الثانية (عرض فقط)
   - يختار الوضع من ?ui=calm|play (الافتراضي calm) و?ui=off لعرض التصميم القديم للمقارنة.
   - لا يقرأ ولا يكتب أي تخزين، ولا يغيّر إعدادات الطلاب ولا أي منطق.
   - يبدّل رموز الإيموجي في مدخل الكلمات برموز SVG، ويصحّح تسمية زر رجوع الدرس.
   - للتراجع: احذف هذا الملف وui2.css وسطرَي تحميلهما.
   ========================================================= */
(function () {
    "use strict";
    var qs = new URLSearchParams(location.search);
    var mode = qs.get("ui");
    if (mode !== "play" && mode !== "off") mode = "calm";
    var body = document.body;
    if (qs.get("shots") === "1") body.classList.add("u2-shots");

    function apply(m) {
        mode = m;
        if (m === "off") body.removeAttribute("data-ui"); else body.setAttribute("data-ui", m);
        document.querySelectorAll(".u2-switch button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-m") === m)); });
        try {
            var u = new URL(location.href);
            u.searchParams.set("ui", m);
            history.replaceState(history.state, "", u.toString());   /* نبقي حالة nav.js كما هي */
        } catch (e) { /* لا شيء */ }
        decorate();
    }

    var BOOK = '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z"/></svg>';
    var NUM = { wbkEntry: "١", wbk2Entry: "٢", wbk3Entry: "٣" };

    function decorate() {
        if (mode === "off") return;
        var h2 = document.querySelector("#wordsLevelsHub > h2");
        if (h2 && !h2.querySelector("svg")) { h2.innerHTML = BOOK + "<span>الكلمات</span>"; }
        var sub = document.querySelector("#wordsLevelsHub .words-hub-subtitle");
        if (sub && /🌟/.test(sub.textContent)) sub.textContent = sub.textContent.replace(/\s*🌟\s*/g, "").trim();
        Object.keys(NUM).forEach(function (id) {
            var ic = document.querySelector("#" + id + " .wbk-entry-ic");
            if (ic && !ic.querySelector("b")) ic.innerHTML = "<b>" + NUM[id] + "</b>";
        });
    }

    /* زر رجوع الدرس يسمّي نفسه «الرئيسية» داخل النشاط وهو يعيد لقائمة الدرس لا للرئيسية العامة */
    function relabel(btn) {
        if (mode === "off" || !btn) return;
        var s = btn.querySelector("span");
        if (s && s.textContent.trim() === "الرئيسية") {
            s.textContent = "قائمة الدرس";
            btn.setAttribute("aria-label", "قائمة الدرس");
        }
    }
    function watchBacks() {
        ["wb3Back", "wb2Back"].forEach(function (id) {
            var b = document.getElementById(id);
            if (!b || b.__u2) return;
            b.__u2 = 1;
            relabel(b);
            new MutationObserver(function () { relabel(b); }).observe(b, { childList: true, subtree: true, characterData: true });
        });
    }

    function buildSwitch() {
        var d = document.createElement("div");
        d.className = "u2-switch";
        d.setAttribute("role", "group");
        d.setAttribute("aria-label", "معاينة التصميم");
        [["calm", "هادئ"], ["play", "تفاعلي"], ["off", "الحالي"]].forEach(function (x) {
            var b = document.createElement("button");
            b.type = "button";
            b.setAttribute("data-m", x[0]);
            b.setAttribute("aria-pressed", String(x[0] === mode));
            b.textContent = x[1];
            b.addEventListener("click", function () { apply(x[0]); });
            d.appendChild(b);
        });
        body.appendChild(d);
    }

    /* ارتفاع الشريطين الثابتين أثناء «أبني الكلمة» على الجوال: يقرؤه wbk3.js ليترك البطاقة تحتهما بدل أن تُغطّى */
    try {
        Object.defineProperty(window, "__taStickyTop", {
            configurable: true,
            get: function () {
                if (mode === "off" || innerWidth > 599 || !document.querySelector("#wbkL3.active #wb3Q")) return 0;
                body.classList.add("u2-build");   /* تطبيق وضع التركيز الآن (قبل قياس الموضع) كي لا يتأخر إلى المراقِب */
                var hb = document.getElementById("hmHomeBtn");
                return (hb ? hb.offsetHeight : 56) + 10;   /* ارتفاع الشريط المتقلّص (زر الرئيسية + هامش): يُحسب مسبقًا لأن الصنف يُطبَّق بعد هذه اللحظة */
            }
        });
    } catch (e) { /* لا شيء */ }

    /* ارتفاع الشريط العلوي الفعلي لتثبيت شريط الدرس تحته مباشرة */
    try {
        var hdr = document.querySelector("header.hm-header");
        if (hdr && window.ResizeObserver) new ResizeObserver(function () {
            document.documentElement.style.setProperty("--u-hh", hdr.offsetHeight + "px");
            var hb = document.getElementById("hmHomeBtn");
            if (hb) document.documentElement.style.setProperty("--u-homew", hb.offsetWidth + "px");
        }).observe(hdr);
    } catch (e) { /* لا شيء */ }

    buildSwitch();
    apply(mode);
    /* أصناف حالة على body بدل محدّدات :has الثقيلة: u2-build أثناء «أبني الكلمة»، u2-run أثناء تشغيل نشاط الحروف */
    function syncState() {
        body.classList.toggle("u2-build", !!document.querySelector("#wbkL3.active #wb3Q"));
        body.classList.toggle("u2-run", !!document.querySelector('#letters.active #letterDetailCard[data-ltr-mode="run"]'));
    }
    /* مراقبة محصورة في حاويات الدروس والحروف فقط (لا مراقبة عامة للصفحة، حفاظًا على الأداء) */
    ["wbkL2", "wbkL3"].forEach(function (id) {
        var c = document.getElementById(id);
        if (c) new MutationObserver(function () { watchBacks(); syncState(); }).observe(c, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    });
    [["letters", { attributes: true, attributeFilter: ["class"] }], ["letterDetailCard", { attributes: true, attributeFilter: ["data-ltr-mode"] }]].forEach(function (x) {
        var c = document.getElementById(x[0]);
        if (c) new MutationObserver(syncState).observe(c, x[1]);
    });
    watchBacks();
    syncState();
})();
