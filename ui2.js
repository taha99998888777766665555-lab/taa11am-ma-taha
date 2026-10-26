/* =========================================================
   🎨 ui2.js — التصميم الموحّد المنقّح (عرض فقط)
   - ?ui=off يعرض التصميم الحالي للمقارنة؛ غير ذلك = التصميم المنقّح.
   - لا يقرأ ولا يكتب أي تخزين، ولا يغيّر إعدادات الطلاب ولا أي منطق.
   - يبدّل رموز الإيموجي في مدخل الكلمات وبطاقات المستويات برموز SVG، ويصحّح تسمية زر رجوع الدرس،
     ويضيف صنف عرض لنجمة الإتقان حين تظهر رسالتها فعلًا (لا يمنح نجومًا ولا يقرّر استحقاقها).
   - للتراجع: احذف هذا الملف وui2.css وسطرَي تحميلهما.
   ========================================================= */
(function () {
    "use strict";
    var qs = new URLSearchParams(location.search);
    var mode = qs.get("ui") === "off" ? "off" : "v2";
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
        decorateLevels();
        watchBacks();
    }

    var BOOK = '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z"/></svg>';
    var CHECK = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.4l2.7 2.7L16 9.6"/></svg>';
    var NUM = { wbkEntry: "١", wbk2Entry: "٢", wbk3Entry: "٣" };
    var EMOJI_ICON = /^[\u{1F300}-\u{1FAFF}☀-➿]/u;   /* الأيقونات الإيموجي فقط؛ رموز الحروف والمقاطع محتوى فلا تُمسّ */

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

    /* بطاقات المستويات التسعة: إيموجي ← SVG موحّد (الأيقونات الحرفية تبقى كما هي) */
    function decorateLevels() {
        if (mode === "off") return;
        document.querySelectorAll("#wordsLevelsGrid .words-level-icon").forEach(function (e) {
            if (!e.querySelector("svg") && EMOJI_ICON.test((e.textContent || "").trim())) e.innerHTML = BOOK;
        });
        document.querySelectorAll("#wordsLevelsGrid .words-level-lock-icon").forEach(function (e) {
            if (!e.querySelector("svg") && /✅/.test(e.textContent)) e.innerHTML = CHECK;
        });
    }

    /* زر رجوع الدرس يسمّي نفسه «الرئيسية» داخل النشاط وهو يعيد لقائمة الدرس لا للرئيسية العامة */
    function relabel(btn) {
        if (mode === "off" || !btn) return;
        var s = btn.querySelector("span");
        if (s && /^(الرئيسية|قائمة الدرس|القائمة)$/.test(s.textContent.trim())) {
            var t = innerWidth <= 420 ? "القائمة" : "قائمة الدرس";   /* الشاشة الضيقة تتّسع للنجوم بجانبه */
            if (s.textContent.trim() !== t) s.textContent = t;
            btn.setAttribute("aria-label", "قائمة الدرس");
        }
    }
    function watchBacks() {
        ["wb3Back", "wb2Back"].forEach(function (id) {
            var b = document.getElementById(id);
            if (!b) return;
            relabel(b);
            if (b.__u2) return;
            b.__u2 = 1;
            new MutationObserver(function () { relabel(b); }).observe(b, { childList: true, subtree: true, characterData: true });
        });
    }

    /* نجمة الإتقان: حين تظهر رسالة النجمة الفعلية من الدرس (★) نضيف صنفًا للعرض الهادئ فقط */
    function watchStar() {
        var m = document.getElementById("wb3Msg");
        var q = document.getElementById("wb3Q");
        if (!m || !q || m.__u2) return;
        m.__u2 = 1;
        new MutationObserver(function () {
            if (mode !== "off" && m.textContent.indexOf("★") >= 0) q.classList.add("u2-star");
        }).observe(m, { childList: true, subtree: true, characterData: true });
    }

    /* ارتفاع الشريط الثابت أثناء «أبني الكلمة» على الجوال: يقرؤه wbk3.js ليترك البطاقة تحته بدل أن تُغطّى */
    try {
        Object.defineProperty(window, "__taStickyTop", {
            configurable: true,
            get: function () {
                if (mode === "off" || innerWidth > 599 || !document.querySelector("#wbkL3.active #wb3Q")) return 0;
                body.classList.add("u2-build");   /* تطبيق وضع التركيز الآن (قبل قياس الموضع) كي لا يتأخر إلى المراقِب */
                var hb = document.getElementById("hmHomeBtn");
                return (hb ? hb.offsetHeight : 56) + 10;
            }
        });
    } catch (e) { /* لا شيء */ }

    /* ارتفاع الشريط العلوي الفعلي وعرض زر الرئيسية لتثبيت شريط الدرس بجانبه */
    try {
        var hdr = document.querySelector("header.hm-header");
        if (hdr && window.ResizeObserver) new ResizeObserver(function () {
            document.documentElement.style.setProperty("--u-hh", hdr.offsetHeight + "px");
            var hb = document.getElementById("hmHomeBtn");
            if (hb) document.documentElement.style.setProperty("--u-homew", hb.offsetWidth + "px");
        }).observe(hdr);
    } catch (e) { /* لا شيء */ }

    function buildSwitch() {
        var d = document.createElement("div");
        d.className = "u2-switch";
        d.setAttribute("role", "group");
        d.setAttribute("aria-label", "معاينة التصميم");
        [["v2", "المنقّح"], ["off", "الحالي"]].forEach(function (x) {
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

    /* أصناف حالة على body بدل محدّدات :has الثقيلة: u2-build أثناء «أبني الكلمة»، u2-run أثناء تشغيل نشاط الحروف */
    function syncState() {
        body.classList.toggle("u2-build", !!document.querySelector("#wbkL3.active #wb3Q"));
        body.classList.toggle("u2-run", !!document.querySelector('#letters.active #letterDetailCard[data-ltr-mode="run"]'));
    }

    buildSwitch();
    apply(mode);
    /* مراقبة محصورة في حاويات محددة فقط (لا مراقبة عامة للصفحة، حفاظًا على الأداء) */
    ["wbkL2", "wbkL3"].forEach(function (id) {
        var c = document.getElementById(id);
        if (c) new MutationObserver(function () { watchBacks(); watchStar(); syncState(); }).observe(c, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    });
    [["letters", { attributes: true, attributeFilter: ["class"] }], ["letterDetailCard", { attributes: true, attributeFilter: ["data-ltr-mode"] }]].forEach(function (x) {
        var c = document.getElementById(x[0]);
        if (c) new MutationObserver(syncState).observe(c, x[1]);
    });
    var grid = document.getElementById("wordsLevelsGrid");
    if (grid) new MutationObserver(decorateLevels).observe(grid, { childList: true });
    watchBacks();
    watchStar();
    syncState();
    window.addEventListener("resize", watchBacks);
})();
