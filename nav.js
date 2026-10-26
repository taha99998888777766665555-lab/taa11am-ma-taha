/* =========================================================
   🧭 nav.js — ربط التنقل بسجل المتصفح (زر الرجوع وإيماءة الهاتف)

   المشكلة: showScreen كان يبدّل الشاشات دون أن يلمس سجل المتصفح، فكان
   زر الرجوع يُخرج من التطبيق كله.

   الحل (بلا أي سجل وهمي):
   - كل انتقال حقيقي بين شاشتين = إدخال واحد في السجل (pushState).
   - العودة إلى شاشة موجودة أصلًا في المسار (الرئيسية، قائمة القسم، «رجوع» لعبة)
     تطوي المسار بـ history.go(-n) بدل أن تكدّس إدخالات.
   - زر الرجوع: إن كان داخل الشاشة خطوة رجوع (مستوى/حرف/سورة/نشاط) يضغط الزر
     الموجود أصلًا في التطبيق (فلا يختلف عن ضغط الطفل عليه)، وإلا يعود للشاشة السابقة.
   - على الرئيسية لا نضيف شيئًا: الرجوع يغادر الموقع كالمعتاد.
   - لا يلمس التخزين ولا النجوم ولا التقدم ولا الصوت: لا يستدعي إلا showScreen
     وأزرار الرجوع الموجودة.
   - يُحمَّل بعد كل ملفات التطبيق ويغلّف showScreen آخر مغلِّف.
   ========================================================= */
(function () {
    "use strict";
    if (window.__taNavInstalled) return;
    window.__taNavInstalled = true;
    if (typeof window.showScreen !== "function" || !window.history || !history.pushState) return;

    var orig = window.showScreen;
    var SID = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    var S = ["home"];          /* شاشة كل إدخال في السجل */
    var idx = 0;               /* موضع الإدخال الحالي */
    var popping = false;       /* نحن نعالج popstate: لا نضيف إدخالات */
    var busy = false;          /* طيّ المسار جارٍ (history.go) وننتظر popstate */
    var busyTimer = 0;
    var DEBUG = { log: [] };

    function cur() {
        var a = document.querySelector(".screen.active");
        return a ? a.id : "home";
    }
    function mk(i, screen) { return { taNav: 1, sid: SID, idx: i, screen: screen }; }
    function sync() {
        try { document.body.classList.toggle("ta-inner", cur() !== "home"); } catch (e) { /* لا شيء */ }
    }
    function log(x) { if (DEBUG.log.length < 200) DEBUG.log.push(x); }

    function push(to) {
        idx += 1;
        S.length = idx;
        S[idx] = to;
        try { history.pushState(mk(idx, to), ""); } catch (e) { /* لا شيء */ }
        log("push " + to + "@" + idx);
    }
    function setHere(screen) {
        S.length = idx + 1;
        S[idx] = screen;
        try { history.replaceState(mk(idx, screen), ""); } catch (e) { /* لا شيء */ }
    }
    function collapse(n) {
        busy = true;
        clearTimeout(busyTimer);
        busyTimer = setTimeout(function () { if (busy) finishBusy(history.state); }, 900);
        log("collapse " + n);
        try { history.go(-n); } catch (e) { busy = false; }
    }
    function finishBusy(st) {
        busy = false;
        clearTimeout(busyTimer);
        if (st && st.taNav && st.sid === SID) { idx = st.idx; S.length = idx + 1; }
        /* انتقال جرى أثناء الطيّ: نسجّله الآن */
        if (cur() !== S[idx]) push(cur());
        sync();
    }

    /* ---------- أزرار الرجوع الموجودة داخل التطبيق ---------- */
    function visible(n) {
        if (!n || n.hidden || n.disabled) return false;
        if (!n.getClientRects().length) return false;
        var cs = getComputedStyle(n);
        return cs.visibility !== "hidden" && cs.display !== "none";
    }
    function isHomeBtn(n) {
        var oc = n.getAttribute("onclick") || "", t = (n.textContent || "").replace(/\s+/g, " ").trim(), al = n.getAttribute("aria-label") || "";
        return /showScreen\(\s*['"]home['"]\s*\)/.test(oc) || n.id === "wrBackHome" || /الرئيسية/.test(t) || /الرئيسية/.test(al);
    }
    function isBackBtn(n) {
        var t = (n.textContent || "").replace(/\s+/g, " ").trim(), al = n.getAttribute("aria-label") || "", oc = n.getAttribute("onclick") || "";
        if (n.id === "wb2Back" || n.id === "wb3Back") return true;
        if (n.getAttribute("data-a") === "back") return true;
        if (/(^|\W)(backTo\w+|ltrBackFrom\w+|raceBackFrom\w+|ajBackTo\w+|showQuranSurahList)\(/.test(oc)) return true;
        if (/^⬅/.test(t) || /رجوع/.test(t) || /^(العودة|الخروج|خروج)/.test(t)) return true;
        if (/^(رجوع|العودة|الخروج|خروج)/.test(al)) return true;
        return false;
    }
    function findBack(screenId) {
        var root = document.getElementById(screenId);
        if (!root) return null;
        var nodes = root.querySelectorAll("button,[role=button],a");
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (!visible(n)) continue;
            /* زر الدرس يتغيّر نصّه إلى «الرئيسية» (= رئيسية الدرس) وهو خطوة رجوع لا الرئيسية العامة */
            if (n.id === "wb2Back" || n.id === "wb3Back") return n;
            if (isHomeBtn(n)) continue;
            if (isBackBtn(n)) return n;
        }
        return null;
    }
    /* نافذة مفتوحة فيها زر إغلاق/رجوع صريح (اختيار الطالب، بوابة المعلم…) */
    function closeOverlay() {
        var dl = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
        for (var i = dl.length - 1; i >= 0; i--) {
            var d = dl[i];
            if (!visible(d)) continue;
            var bs = d.querySelectorAll("button");
            for (var j = 0; j < bs.length; j++) {
                var b = bs[j], t = (b.textContent || "").replace(/\s+/g, " ").trim();
                if (!visible(b)) continue;
                if (/^(إغلاق|إلغاء|لا، رجوع|رجوع|✕|×)$/.test(t) || b.getAttribute("data-a") === "back" || b.getAttribute("data-a") === "close" || b.getAttribute("data-a") === "cancel") {
                    b.click();
                    return true;
                }
            }
        }
        return false;
    }

    /* ---------- تغليف showScreen ---------- */
    window.showScreen = function (id) {
        var from = cur();
        var r = orig.apply(this, arguments);
        var to = cur();
        sync();
        if (popping || to === from) return r;
        if (busy) return r;                       /* يُسجَّل في finishBusy */
        for (var k = idx - 1; k >= 0; k--) {
            if (S[k] === to) { collapse(idx - k); return r; }
        }
        push(to);
        return r;
    };
    try { showScreen = window.showScreen; } catch (e) { /* لا شيء */ }

    /* ---------- زر الرجوع / إيماءة الهاتف ---------- */
    function onPop(ev) {
        var st = ev.state;
        if (busy) { finishBusy(st); return; }
        if (!st || !st.taNav) return;
        if (st.sid !== SID) { try { history.back(); } catch (e) { /* لا شيء */ } return; }   /* إدخال قديم من قبل إعادة تحميل الصفحة */
        var step = idx - st.idx;
        if (step === 0) return;
        var C = cur();
        popping = true;
        try {
            if (step === 1) {
                var consumed = closeOverlay();
                if (!consumed) {
                    var b = findBack(C);
                    if (b) { b.click(); consumed = true; }
                }
                if (consumed) {
                    var N = cur();
                    if (N === C) {                 /* بقينا في الشاشة: نستعيد الإدخال الذي غادرناه */
                        idx = st.idx; S.length = idx + 1;
                        push(C);
                        log("inner-back on " + C);
                    } else {                       /* الزر نقلنا إلى شاشة أخرى */
                        idx = st.idx;
                        setHere(N);
                        log("back-button moved " + C + "→" + N);
                    }
                    return;
                }
            }
            /* رجوع عادي (أو قفز عدة خطوات): نعرض الشاشة المقصودة */
            var T = st.screen;
            idx = st.idx; S.length = idx + 1;
            orig(T);
            setHere(cur());
            log("pop " + C + "→" + cur());
        } finally {
            popping = false;
            sync();
        }
    }
    window.addEventListener("popstate", onPop);

    /* حالة البداية: الرئيسية. يستبدل أي إدخال قديم بعد إعادة التحميل أو تبديل الطالب */
    try { history.scrollRestoration = "manual"; } catch (e) { /* لا شيء */ }
    try { history.replaceState(mk(0, "home"), ""); } catch (e) { /* لا شيء */ }
    sync();

    window.taNav = { stack: function () { return S.slice(0, idx + 1); }, idx: function () { return idx; }, busy: function () { return busy; }, log: DEBUG.log };
})();
