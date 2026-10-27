/* =========================================================================
   📕 الدرس الرابع «أقرأ جملًا من كلمتين» — المنطق والواجهة (كتلة معزولة)
   المحتوى كله من wbk4-data.js (١٠ جمل من صفحة ٧ في الكتاب، بترتيبها حرفيًا).
   - لا يعدّل الدروس الثلاثة السابقة ولا قسم الكلمات القديم ولا script.js: يُحمَّل بعدها ويغلّف showScreen للتنظيف فقط.
   - الأنشطة الستة: أقرأ مع المعلم · أرتّب الجملة · أستمع وأختار · أكمل الجملة · أقرأ بنفسي · أختبر نفسي.
     كلها مفتوحة بلا أقفال ولا مؤقت ولا عقوبة عند الخطأ، والإعادة متاحة دائمًا.
   - الصوت: تسجيل الجملة الكاملة (ملف مستقل لكل جملة) بسرعة عادية أو بطيئة ٠٫٨٥ مع الحفاظ على طبقة الصوت
     (preservesPitch). تسجيل الكلمة المنفردة عند لمسها فقط. لا TTS ولا تركيب جملة من أصوات كلمات.
   - الترتيب: جلسات التدريب تمضي بترتيب الكتاب (٥ جمل متتالية من أول جملة تحتاج تدريبًا)، لا عشوائيًا؛
     الاختبار وحده يختار جملًا متنوعة. يُبدَّل فقط موضع الخيار الخاطئ داخل السؤال.
   - التخزين: taha_wbk4_progress_v1 (لكل طالب تلقائيًا عبر StudentStore). لا يمسّ بيانات الدروس الأخرى.
   - النجوم (قاعدة الدرس الثالث نفسها): نجمة لكل جملة فريدة بعد نجاحين مستقلين (من أول مرة، بلا نموذج ولا تلميح
     ولا كشف حل) في نشاطين مختلفين أحدهما «أرتّب الجملة» بلا نموذج، أو قراءة مستقلة يؤكدها المعلم؛
     ونجمة اختبار واحدة. لا تُسحب نجمة ولا تتكرر.
   ========================================================================= */
(function () {
    "use strict";

    var D = window.WBK4_DATA;
    if (!D) return;

    var KEY = "taha_wbk4_progress_v1";
    var SCREEN = "wbkL4";
    var SENT = D.SENTENCES, CFG = D.CONFIG, STAGES = D.STAGES;
    var BYID = {};
    SENT.forEach(function (s) { BYID[s.id] = s; });
    var PRAISE = ["أحسنت يا بطل", "أحسنت، عمل رائع", "صحيح"];
    var MAX_STARS = SENT.length + CFG.test.maxStars;
    var STAGE_BY = {};
    STAGES.forEach(function (s) { STAGE_BY[s.id] = s; });
    var ACT_KEYS = ["hear", "build", "buildm", "missing"];   /* buildm = ترتيب مع نموذج بصري (دعم لا دليل) */
    var SLOW = CFG.speeds.slow, NORMAL = CFG.speeds.normal;

    var S = { view: "home", session: 0, timers: [], root: null, built: false, gate: false, gateTimer: 0, run: null, live: null, start: 0, dragged: false };

    /* ---------- أدوات عامة ---------- */
    function el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }
    function ar(n) { return (typeof arabicNumber === "function") ? arabicNumber(n) : String(n); }
    function shuffle(a) {
        var r = a.slice();
        for (var i = r.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = r[i]; r[i] = r[j]; r[j] = t; }
        return r;
    }
    function reduced() { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }
    function later(fn, ms) {
        var tok = S.session;
        var id = setTimeout(function () { if (tok === S.session) fn(); }, ms);
        S.timers.push(id);
        return id;
    }
    function clearTimers() { S.timers.forEach(clearTimeout); S.timers = []; }
    function say(text) { var l = S.live; if (l) { l.textContent = ""; setTimeout(function () { l.textContent = text; }, 30); } }
    function body() { return document.getElementById("wb4Body"); }

    /* ---------- الصوت ---------- */
    var aud = null, audTok = 0;
    function stopAudio() {
        audTok++;
        if (aud) { try { aud.pause(); } catch (e) { /* لا شيء */ } aud.onended = aud.onerror = null; aud = null; }
        try { EduAudio.stop(); } catch (e) { /* لا شيء */ }
    }
    /* rate: ١ عادية أو ٠٫٨٥ بطيئة؛ طبقة الصوت تُحفظ (preservesPitch) */
    function playFile(file, done, rate) {
        stopAudio();
        var tok = ++audTok;
        var a = new Audio(file);
        aud = a;
        var r = rate || NORMAL;
        try { a.preservesPitch = true; a.mozPreservesPitch = true; a.webkitPreservesPitch = true; } catch (e) { /* لا شيء */ }
        try { a.defaultPlaybackRate = r; a.playbackRate = r; } catch (e) { /* لا شيء */ }
        window.__wbk4LastAudio = { file: file, rate: r };   /* للاختبار */
        a.onended = function () { if (tok === audTok) { aud = null; if (done) done(true); } };
        a.onerror = function () { if (tok === audTok) { aud = null; if (done) done(false); } };
        var pr = a.play();
        if (pr && pr.catch) pr.catch(function () { if (tok === audTok) { aud = null; if (done) done(false); } });
        return true;
    }
    /* تسجيل الجملة الكاملة (ملف مستقل). لا تركيب من كلمات */
    function playSentence(s, done, rate) {
        if (!s || !s.approved || !s.audio) { stopAudio(); if (done) done(false); return false; }
        return playFile(s.audio, done, rate);
    }
    /* تسجيل كلمة منفردة (عند لمسها فقط) */
    function playUnit(u, done) {
        if (!u || !u.audio) { stopAudio(); if (done) done(false); return false; }
        return playFile(u.audio, done, NORMAL);
    }
    function playKey(key, done) {
        if (typeof key !== "string") { if (done) done(false); return false; }
        stopAudio();
        try { EduAudio.play([key], { mode: "interrupt", done: function () { if (done) done(true); } }); return true; }
        catch (e) { if (done) done(false); return false; }
    }
    function praise(done) { playKey(PRAISE[Math.floor(Math.random() * PRAISE.length)], done); }

    /* ---------- التخزين لكل طالب ---------- */
    function newRec() {
        return {
            seen: 0, f: 0, s: 0, a: 0, r: 0, w: 0, hist: "", rp: 0, last: 0, ev: [],
            act: { hear: [0, 0], build: [0, 0], buildm: [0, 0], missing: [0, 0] },
            read: { att: 0, ok: 0, sup: 0, hp: 0, last: "", hint: 0 }
        };
    }
    function fixRec(r) {
        var b = newRec();
        Object.keys(b).forEach(function (k) { if (typeof r[k] !== typeof b[k]) r[k] = b[k]; });
        if (!r.act || typeof r.act !== "object") r.act = b.act;
        ACT_KEYS.forEach(function (k) {
            if (!Array.isArray(r.act[k]) || r.act[k].length !== 2) r.act[k] = [0, 0];
        });
        if (!Array.isArray(r.ev)) r.ev = [];
        if (!r.read || typeof r.read !== "object") r.read = b.read;
        Object.keys(b.read).forEach(function (k) { if (typeof r.read[k] !== typeof b.read[k]) r.read[k] = b.read[k]; });
        return r;
    }
    function blank() {
        return { v: 1, stars: 0, starred: {}, testStar: false, sessions: 0, syl: {}, lv: { hear: 1, build: 1, missing: 1 }, tests: [] };
    }
    function load() {
        try {
            var o = JSON.parse(localStorage.getItem(KEY));
            if (o && o.v === 1 && o.syl && typeof o.syl === "object") {
                if (typeof o.stars !== "number") o.stars = 0;
                if (!o.starred || typeof o.starred !== "object") o.starred = {};
                if (!o.lv || typeof o.lv !== "object") o.lv = { hear: 1, build: 1, missing: 1 };
                ["hear", "build", "missing"].forEach(function (k) { if (typeof o.lv[k] !== "number") o.lv[k] = 1; });
                if (!Array.isArray(o.tests)) o.tests = [];
                if (typeof o.sessions !== "number") o.sessions = 0;
                o.testStar = !!o.testStar;
                return o;
            }
        } catch (e) { /* لا شيء */ }
        return blank();
    }
    function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* لا شيء */ } }
    function rec(p, id) {
        var r = p.syl[id];
        if (!r) r = p.syl[id] = newRec();
        return fixRec(r);
    }

    /* ---------- الأدلة والحالات ---------- */
    function indep(r) { return r ? (r.f + r.s) : 0; }
    function touched(r) { return !!(r && (r.seen || r.f || r.s || r.a || r.r || r.hist || r.read.att || r.read.last)); }
    function needsReview(r) {
        if (!r) return false;
        if (r.read.last === "sup") return true;
        var h = r.hist || "";
        if (!h) return false;
        var l = h.slice(-1), pv = h.slice(-2, -1);
        if (l === "r" || l === "x") return true;
        return l === "a" && (pv === "a" || pv === "r" || pv === "x");
    }
    /* أتقنت ✔: قراءة مستقلة (بلا أي مساعدة) يؤكدها المعلم، وهي آخر قراءة، ولا حاجة لمراجعة */
    function mastered(r) { return !!(r && r.read.last === "ok" && !needsReview(r)); }
    function stateOf(p, id) {
        var r = p.syl[id];
        if (!touched(r)) return "new";
        if (needsReview(r)) return "review";
        if (mastered(r)) return "mastered";
        return "learning";
    }
    var STATE_LABEL = { "new": "جديدة", learning: "أتدرّب", review: "أراجع", mastered: "أتقنت" };
    var GLYPH = { "new": "○", learning: "◐", review: "↻", mastered: "✔" };
    var EVID_TYPES = { hear: "hear", build: "build", missing: "missing" };

    function giveStar(p, id) {
        if (p.starred[id] || p.stars >= MAX_STARS) return false;
        p.starred[id] = 1; p.stars++;
        try { if (typeof addStars === "function") addStars(1); } catch (e) { /* لا شيء */ }
        return true;
    }
    /* f صحيح من أول مرة · s بعد تصحيح ذاتي · a بتلميح · r بعد عرض الحل */
    function logResult(p, id, type, res, info) {
        var r = rec(p, id);
        r[res] = (r[res] || 0) + 1;
        r.hist = (r.hist + res).slice(-8);
        r.last = Date.now();
        var a = r.act[type] || (r.act[type] = [0, 0]);
        a[1]++;
        if (res === "f" || res === "s") a[0]++;
        if (info && info.wrongs) r.w += info.wrongs;
        if (info && info.replays) r.rp += info.replays;
        /* نجمة الجملة: لا تُمنح من إجابة واحدة ولا من السمع/الإكمال وحدهما (فيهما تخمين).
           الدليل = نجاح مستقل تمامًا (res=f) في نشاط مختلف لكل دليل، ويلزم دليل «أرتّب» بلا نموذج.
           التصحيح الذاتي (s) والترتيب مع نموذج (buildm) تقدّم لا دليل. القراءة المؤكدة تمنح النجمة في applyRead */
        var star = false;
        if (res === "f") {
            var et = EVID_TYPES[type];
            if (et && r.ev.indexOf(et) < 0) r.ev.push(et);
            if (r.ev.length >= CFG.star.independentActivities && r.ev.indexOf("build") >= 0) star = giveStar(p, id);
        }
        return star;
    }
    function approvedAll() { return SENT.filter(function (s) { return s.approved; }); }
    function ids(list) { return list.map(function (s) { return s.id; }); }

    /* ---------- ترتيب الجلسات: بترتيب الكتاب ---------- */
    function sessionIds(p, type, startIdx, n) {
        var start = startIdx;
        if (start == null) {
            start = 0;
            for (var i = 0; i < SENT.length; i++) {
                var r = p.syl[SENT[i].id];
                var done = r && r.act[type === "build" ? "build" : type] && r.act[type === "build" ? "build" : type][0] >= 1;
                if (!done) { start = i; break; }
            }
        }
        var out = [];
        for (var k = 0; k < Math.min(n, SENT.length); k++) out.push(SENT[(start + k) % SENT.length].id);
        return out;
    }
    function letterSim(a, b) {
        var m = 0, used = {};
        a.letters.forEach(function (c) { used[c] = (used[c] || 0) + 1; });
        b.letters.forEach(function (c) { if (used[c] > 0) { m++; used[c]--; } });
        return m;
    }
    /* بدائل مناسبة: المستوى ١ الأبعد شكلًا (أوضح)، والمستوى ٢ الأقرب شكلًا. الترتيب ثابت عند التساوي */
    function pickDistractors(id, n, lv) {
        var t = BYID[id];
        var others = SENT.filter(function (s) { return s.id !== id; }).map(function (s, i) { return { s: s, sc: letterSim(t, s), i: i }; });
        others.sort(function (x, y) { return (lv <= 1 ? x.sc - y.sc : y.sc - x.sc) || (x.i - y.i); });
        return others.slice(0, n).map(function (o) { return o.s.id; });
    }
    function arrangeOptions(target, distract) {
        var list = shuffle([target].concat(distract));
        /* الخيار الصحيح لا يكون دائمًا في المكان نفسه */
        return list;
    }

    /* ---------- عناصر الواجهة ---------- */
    function unitEl(u, cls) {
        var w = el("span", "wb3-syl wb4-unit" + (cls ? " " + cls : ""), u.text);
        w.setAttribute("dir", "rtl"); w.setAttribute("lang", "ar");
        return w;
    }
    /* الجملة كاملة: وحدتان بلونين، وبينهما فراغ واضح */
    function sentEl(s, cls) {
        var w = el("span", "wb3-syl wb4-sent" + (cls ? " " + cls : ""));
        w.setAttribute("dir", "rtl"); w.setAttribute("lang", "ar"); w.setAttribute("role", "img");
        w.setAttribute("aria-label", "الجملة " + s.key);
        w.appendChild(el("span", "wb4-u1", s.u1.text));
        w.appendChild(document.createTextNode(" "));
        w.appendChild(el("span", "wb4-u2", s.u2.text));
        return w;
    }
    function btn(cls, text, fn) {
        var b = el("button", "wb3-btn " + (cls || ""), text);
        b.type = "button";
        if (fn) b.addEventListener("click", fn);
        return b;
    }
    var ICONS = {
        speaker: "<svg viewBox='0 0 24 24' width='28' height='28' aria-hidden='true'><path d='M4 9v6h4l5 4V5L8 9H4z' fill='currentColor'/><path d='M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg>",
        slow: "<svg viewBox='0 0 24 24' width='28' height='28' aria-hidden='true'><path d='M4 9v6h4l5 4V5L8 9H4z' fill='currentColor'/><path d='M17 9.5a4 4 0 010 5' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg>",
        back: "<svg viewBox='0 0 24 24' width='24' height='24' aria-hidden='true'><path d='M9 5l7 7-7 7' fill='none' stroke='currentColor' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'/></svg>",
        star: "<svg viewBox='0 0 24 24' width='22' height='22' aria-hidden='true'><path d='M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2 6.3 20.3l1.2-6.4L2.8 9.5l6.4-.8z' fill='currentColor'/></svg>",
        lock: "<svg viewBox='0 0 24 24' width='20' height='20' aria-hidden='true'><rect x='5' y='11' width='14' height='9' rx='2' fill='currentColor'/><path d='M8 11V8a4 4 0 018 0v3' fill='none' stroke='currentColor' stroke-width='2'/></svg>"
    };
    function iconBtn(cls, icon, label, fn) {
        var b = el("button", "wb3-btn " + (cls || ""));
        b.type = "button"; b.innerHTML = icon + "<span>" + label + "</span>";
        if (fn) b.addEventListener("click", fn);
        return b;
    }
    /* زرّا الاستماع: عادي وبطيء ٠٫٨٥ */
    function listenRow(F, s, onPlay) {
        var row = el("div", "wb3-row center wb4-listen"); row.id = "wb4ListenRow";
        var n = iconBtn("listen xl", ICONS.speaker, "اسمع الجملة", function () { if (onPlay) onPlay(false); playSentence(s, null, NORMAL); });
        n.id = "wb4Listen"; n.setAttribute("aria-label", "اسمع الجملة بسرعة عادية");
        var sl = iconBtn("listen slow", ICONS.slow, "ببطء", function () { if (onPlay) onPlay(false); playSentence(s, null, SLOW); });
        sl.id = "wb4ListenSlow"; sl.setAttribute("aria-label", "اسمع الجملة ببطء");
        row.appendChild(n); row.appendChild(sl);
        return row;
    }

    /* ---------- الهيكل ---------- */
    function build() {
        var root = document.getElementById(SCREEN);
        if (!root) return false;
        if (S.built && root.querySelector("#wb4Body")) { S.root = root; return true; }
        root.innerHTML = "";
        root.classList.add("wb3", "wb4");
        var hd = el("header", "wb3-head");
        var back = el("button", "wb3-back"); back.type = "button"; back.id = "wb4Back";
        back.innerHTML = ICONS.back + "<span>رجوع</span>";
        back.addEventListener("click", onBack);
        hd.appendChild(back);
        var ttl = el("div", "wb3-title");
        ttl.appendChild(el("strong", "", "الدرس الرابع — أقرأ جملًا من كلمتين"));
        var sub = el("span", "wb3-sub", ""); sub.id = "wb4Sub"; ttl.appendChild(sub);
        hd.appendChild(ttl);
        var st = el("div", "wb3-starbox"); st.id = "wb4Stars"; hd.appendChild(st);
        var tb = el("button", "wb3-teach"); tb.type = "button"; tb.id = "wb4Teacher";
        tb.innerHTML = ICONS.lock + "<span>المعلم</span>";
        tb.addEventListener("click", function () { gate(renderTeacher); });
        hd.appendChild(tb);
        root.appendChild(hd);
        var b = el("main", "wb3-body"); b.id = "wb4Body"; root.appendChild(b);
        var live = el("div", "wb3-live"); live.id = "wb4Live";
        live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
        root.appendChild(live); S.live = live;
        S.root = root; S.built = true;
        return true;
    }
    function refreshHead(sub) {
        var p = load();
        var sb = document.getElementById("wb4Stars");
        if (sb) { sb.innerHTML = ICONS.star + "<b>" + ar(p.stars) + "</b><span>من " + ar(MAX_STARS) + "</span>"; sb.setAttribute("aria-label", "النجوم " + p.stars + " من " + MAX_STARS); }
        var s = document.getElementById("wb4Sub");
        if (s && sub != null) s.textContent = sub;
    }
    function setView(v, sub) {
        S.view = v; S.session++; clearTimers(); stopAudio();
        refreshHead(sub);
        var b = body(); if (b) { b.innerHTML = ""; b.scrollTop = 0; }
        var b2 = document.getElementById("wb4Back");
        if (b2) b2.querySelector("span").textContent = (v === "home") ? "الكلمات" : "الرحلة";
        try { window.scrollTo(0, 0); } catch (e) { /* لا شيء */ }
    }
    function onBack() { if (S.view === "home") exitToWords(); else renderHome(); }

    /* ---------- بوابة المعلم (رمز المعلم أو جمع عشوائي) ---------- */
    function teacherSession() { try { return (typeof teacherUnlockedSession !== "undefined") && !!teacherUnlockedSession; } catch (e) { return false; } }
    function relockSoon() { clearTimeout(S.gateTimer); S.gateTimer = setTimeout(function () { S.gate = false; }, 10 * 60 * 1000); }
    function gate(cb) {
        if (teacherSession() || S.gate) { S.gate = true; relockSoon(); cb(); return; }
        var pin = ""; try { pin = localStorage.getItem("taha_teacher_pin") || ""; } catch (e) { /* لا شيء */ }
        var x = 2 + Math.floor(Math.random() * 8), y = 2 + Math.floor(Math.random() * 8);
        var ov = el("div", "wb3-modal"); ov.id = "wb4Gate";
        ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
        var bx = el("div", "wb3-modal-box");
        bx.appendChild(el("h3", "", "للمعلم فقط"));
        bx.appendChild(el("p", "", pin ? "أدخل الرمز السري (٤ أرقام)" : ar(x) + " + " + ar(y) + " = ؟"));
        var inp = el("input", "wb3-input"); inp.type = "text"; inp.inputMode = "numeric"; inp.id = "wb4GateInput";
        inp.setAttribute("autocomplete", "off"); inp.setAttribute("aria-label", "إجابة المعلم");
        var err = el("div", "wb3-err");
        function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
        function tryIt() {
            var v = inp.value.trim().replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); });
            var good = pin ? v === pin : Number(v) === x + y;
            if (good) { S.gate = true; relockSoon(); close(); cb(); } else { err.textContent = "حاول مرة أخرى"; inp.value = ""; inp.focus(); }
        }
        var row = el("div", "wb3-row");
        row.appendChild(btn("main", "دخول", tryIt));
        row.appendChild(btn("ghost", "إلغاء", close));
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") tryIt(); if (e.key === "Escape") close(); });
        bx.appendChild(inp); bx.appendChild(err); bx.appendChild(row);
        ov.appendChild(bx); document.getElementById(SCREEN).appendChild(ov);
        setTimeout(function () { try { inp.focus(); } catch (e) { /* لا شيء */ } }, 50);
    }

    /* ---------- الاقتراح (توصية فقط، لا قفل) ---------- */
    function accuracy(p, k) {
        var tot = [0, 0];
        SENT.forEach(function (s) { var r = p.syl[s.id]; if (r && r.act[k]) { tot[0] += r.act[k][0]; tot[1] += r.act[k][1]; } });
        return tot;
    }
    function suggest(p) {
        var any = SENT.some(function (s) { return touched(p.syl[s.id]); });
        if (!any) return { stage: "teach", why: "ابدأ بقراءة الجمل مع المعلم." };
        var seenAll = SENT.filter(function (s) { var r = p.syl[s.id]; return r && r.seen; }).length;
        if (seenAll < 3) return { stage: "teach", why: "اقرأ المزيد من الجمل مع المعلم أولًا." };
        var order = ["build", "hear", "missing"];
        var untried = order.filter(function (k) { return accuracy(p, k)[1] + (k === "build" ? accuracy(p, "buildm")[1] : 0) < 3; });
        if (untried.length) return { stage: untried[0], why: "لم تتدرّب كفاية على هذه المرحلة." };
        var readDone = SENT.filter(function (s) { var r = p.syl[s.id]; return r && r.read.att > 0; }).length;
        if (readDone < 3) return { stage: "read", why: "حان وقت قراءة الجمل بصوتك." };
        if (!p.testStar) return { stage: "test", why: "جرّب «أختبر نفسي» عندما تشعر أنك جاهز." };
        return { stage: "teach", why: "راجع الجمل مع المعلم لتثبّتها." };
    }

    /* ---------- الشاشة الرئيسية ---------- */
    function ring(done, total) {
        var R = 44, C = 2 * Math.PI * R, off = C * (1 - (total ? done / total : 0));
        return "<svg viewBox='0 0 110 110' width='104' height='104' role='img' aria-label='أتقنت " + done + " من " + total + "'>" +
            "<circle cx='55' cy='55' r='" + R + "' fill='none' stroke='var(--wb3-line)' stroke-width='10'/>" +
            "<circle cx='55' cy='55' r='" + R + "' fill='none' stroke='var(--wb3-primary)' stroke-width='10' stroke-linecap='round' stroke-dasharray='" + C.toFixed(1) + "' stroke-dashoffset='" + off.toFixed(1) + "' transform='rotate(-90 55 55)'/>" +
            "<text x='55' y='60' text-anchor='middle' font-size='26' font-weight='700' fill='var(--wb3-ink)'>" + ar(done) + "</text>" +
            "<text x='55' y='80' text-anchor='middle' font-size='12' fill='var(--wb3-mute)'>من " + ar(total) + "</text></svg>";
    }
    function stageStatus(p, id) {
        if (id === "teach") {
            var seen = SENT.filter(function (s) { var r = p.syl[s.id]; return r && r.seen; }).length;
            return seen ? "قرأتَ " + ar(seen) + " من " + ar(SENT.length) : "لم تبدأ بعد";
        }
        if (id === "hear" || id === "build" || id === "missing") {
            var a = accuracy(p, id);
            if (id === "build") { var v = accuracy(p, "buildm"); a = [a[0] + v[0], a[1] + v[1]]; }
            return a[1] ? "نجاح مستقل " + ar(Math.round(a[0] * 100 / a[1])) + "٪" : "لم تبدأ بعد";
        }
        if (id === "read") {
            var n = SENT.filter(function (s) { var r = p.syl[s.id]; return r && r.read.last === "ok"; }).length;
            return n ? "قراءة مستقلة مؤكدة: " + ar(n) : "لم تبدأ بعد";
        }
        var t = p.tests[p.tests.length - 1];
        if (!t) return "لم تُجرِ اختبارًا بعد";
        return ({ pending: "بانتظار تأكيد المعلم", pass: "نجحتَ", fail: "أعد المحاولة", incomplete: "غير مكتمل" })[t.status];
    }
    function renderHome() {
        setView("home", "جملة من كلمتين بالفتحة");
        var p = load(), b = body();
        var sg = suggest(p);
        var masteredN = SENT.filter(function (s) { return stateOf(p, s.id) === "mastered"; }).length;
        var top = el("section", "wb3-top");
        var rg = el("div", "wb3-ring"); rg.innerHTML = ring(masteredN, SENT.length); top.appendChild(rg);
        var tx = el("div", "wb3-top-tx");
        tx.appendChild(el("h2", "", "رحلتي في قراءة الجمل"));
        tx.appendChild(el("p", "", "أتقنتُ " + ar(masteredN) + " من " + ar(SENT.length) + " جمل"));
        top.appendChild(tx);
        var lib = btn("ghost", "مكتبة الجمل", function () { renderLibrary(); }); lib.id = "wb4LibBtn";
        top.appendChild(lib);
        b.appendChild(top);

        var path = el("ol", "wb3-journey"); path.id = "wb4Path";
        STAGES.forEach(function (st) {
            var isSug = st.id === sg.stage;
            var li = el("li", "wb3-step" + (isSug ? " sug" : ""));
            li.appendChild(el("span", "wb3-num", ar(st.n)));
            var bt = el("button", "wb3-stepbtn"); bt.type = "button"; bt.setAttribute("data-stage", st.id);
            var t = el("span", "wb3-stx");
            var h = el("b", "", st.title); t.appendChild(h);
            t.appendChild(el("small", "", st.how));
            t.appendChild(el("em", "wb3-st", stageStatus(p, st.id)));
            bt.appendChild(t);
            if (isSug) {
                t.insertBefore(el("span", "wb3-tag", "الخطوة المقترحة"), h);
                var go = el("span", "wb3-gobtn", "ابدأ"); go.id = "wb4Go"; bt.appendChild(go);
            } else bt.appendChild(el("span", "wb3-chev", "‹"));
            bt.addEventListener("click", function () { S.start = null; openStage(st.id); });
            li.appendChild(bt); path.appendChild(li);
        });
        b.appendChild(path);
        b.appendChild(el("p", "wb3-note", "كل المراحل مفتوحة، ويمكنك الانتقال إلى أي واحدة. السرعة البطيئة ٠٫٨٥ متاحة في كل شاشة فيها صوت."));
    }

    /* ---------- مكتبة الجمل (١٠ بطاقات بترتيب الكتاب) ---------- */
    function renderLibrary() {
        setView("library", "مكتبة الجمل");
        var p = load(), b = body();
        var sel = (typeof S.start === "number") ? S.start : 0;
        var grid = el("div", "wb3-grid wb4-grid"); grid.id = "wb4Grid";
        SENT.forEach(function (s, i) {
            var st = stateOf(p, s.id);
            var c = el("button", "wb3-cell wb4-cell" + (i === sel ? " on" : "")); c.type = "button"; c.setAttribute("data-id", s.id);
            c.setAttribute("aria-label", "الجملة " + ar(s.n) + ": " + s.key + " — " + STATE_LABEL[st]);
            c.appendChild(el("span", "wb3-cn", ar(s.n)));
            c.appendChild(sentEl(s, "cellsyl"));
            c.appendChild(el("span", "wb3-cs " + st, GLYPH[st] + " " + STATE_LABEL[st] + (p.starred[s.id] ? " ★" : "")));
            c.addEventListener("click", function () { S.start = i; renderLibrary(); });
            grid.appendChild(c);
        });
        b.appendChild(grid);
        b.appendChild(el("p", "wb3-note", "اختر أي جملة ثم اختر النشاط: يبدأ من الجملة المختارة ويمضي بترتيب الكتاب."));
        var row = el("div", "wb3-row center wb4-stagerow"); row.id = "wb4StageRow";
        STAGES.forEach(function (st) {
            var x = btn("ghost", st.title, function () { openStage(st.id); }); x.setAttribute("data-stage", st.id);
            row.appendChild(x);
        });
        b.appendChild(row);
        var r2 = el("div", "wb3-row center"); r2.appendChild(btn("main", "الرئيسية", renderHome)); b.appendChild(r2);
    }
    function openStage(id) {
        if (id === "teach") return startTeach();
        if (id === "read") return startRead();
        if (id === "test") return startTest();
        startActivity(id);
    }

    /* ---------- هيكل شاشة نشاط واحد ---------- */
    function frame(R, subtitle, label) {
        var b = body(); b.innerHTML = "";
        var f = el("section", "wb3-q"); f.id = "wb4Q";
        var top = el("div", "wb3-qtop");
        var cnt = R.items.length;
        top.appendChild(el("span", "wb3-qn", (label || "السؤال") + " " + ar(R.i + 1) + " من " + ar(cnt)));
        var bar = el("div", "wb3-bar"); bar.setAttribute("role", "progressbar");
        bar.setAttribute("aria-valuemin", "0"); bar.setAttribute("aria-valuemax", String(cnt)); bar.setAttribute("aria-valuenow", String(R.i));
        var fl = el("i"); fl.style.width = Math.round(R.i * 100 / cnt) + "%"; bar.appendChild(fl);
        top.appendChild(bar);
        f.appendChild(top);
        var inst = el("h2", "wb3-inst", subtitle); inst.id = "wb4Inst"; f.appendChild(inst);
        var area = el("div", "wb3-area"); area.id = "wb4Area"; f.appendChild(area);
        var msg = el("p", "wb3-msg"); msg.id = "wb4Msg"; f.appendChild(msg);
        var acts = el("div", "wb3-row center wb3-qacts"); acts.id = "wb4QActs"; f.appendChild(acts);
        b.appendChild(f);
        return { box: f, area: area, msg: msg, acts: acts, inst: inst };
    }
    function setMsg(F, t) { F.msg.textContent = t; if (t) say(t); }
    function setViewKeep(sub) { S.session++; clearTimers(); stopAudio(); S.view = "q"; refreshHead(sub); var b2 = document.getElementById("wb4Back"); if (b2) b2.querySelector("span").textContent = "الرحلة"; try { window.scrollTo(0, 0); } catch (e) { /* لا شيء */ } }

    /* ---------- ١) أقرأ مع المعلم ---------- */
    function startTeach() {
        var from = (typeof S.start === "number") ? S.start : 0;
        S.run = { type: "teach", items: SENT.map(function (s) { return { id: s.id, type: "teach" }; }), i: from, tok: 0 };
        teachQ();
    }
    function teachQ() {
        var R = S.run;
        if (R.i >= R.items.length) return renderHome();
        var s = BYID[R.items[R.i].id];
        setViewKeep(STAGE_BY.teach.title);
        var p = load(); rec(p, s.id).seen++; save(p);
        var F = frame(R, "انظر إلى الجملة، ثم استمع واقرأ معي", "الجملة");
        var show = el("div", "wb3-readshow wb4-show"); show.id = "wb4TeachShow";
        show.appendChild(sentEl(s, "huge"));
        F.area.appendChild(show);
        F.area.appendChild(listenRow(F, s));
        var wl = el("div", "wb3-row center wb4-words"); wl.id = "wb4Words";
        [s.u1, s.u2].forEach(function (u, k) {
            var b2 = el("button", "wb3-btn ghost wb4-wordbtn"); b2.type = "button"; b2.setAttribute("data-unit", String(k + 1));
            b2.setAttribute("aria-label", "اسمع الكلمة " + (k ? "الثانية" : "الأولى") + " وحدها: " + u.word);
            b2.innerHTML = ICONS.speaker + "<span class='wb3-syl wb4-wordtxt' dir='rtl' lang='ar'>" + u.word + "</span>";
            b2.addEventListener("click", function () { playUnit(u); });
            wl.appendChild(b2);
        });
        F.area.appendChild(wl);
        setMsg(F, "ابدأ من اليمين: الكلمة الأولى، ثم «وَ» متصلة بالكلمة الثانية. المس الكلمة لتسمعها وحدها.");
        if (R.i > 0) F.acts.appendChild(btn("ghost", "السابقة", function () { R.i--; teachQ(); }));
        F.acts.appendChild(btn("main", R.i + 1 < R.items.length ? "التالية" : "إنهاء", function () { R.i++; teachQ(); }));
    }

    /* ---------- تشغيل جلسة تدريب (ترتيب / سمع / إكمال) ---------- */
    function startActivity(type) {
        var p = load();
        var idsList = sessionIds(p, type, (typeof S.start === "number") ? S.start : null, CFG.sessionLength);
        S.run = { type: type, items: idsList.map(function (id) { return { id: id, type: type }; }), i: 0, tally: { f: 0, s: 0, a: 0, r: 0, skip: 0 }, byType: {}, stars: 0, tok: 0 };
        nextQ();
    }
    function nextQ() {
        var R = S.run;
        if (R.i >= R.items.length) return summary();
        var it = R.items[R.i], p = load();
        R.tok++;
        var ctx = { test: false, tok: R.tok, done: function (res, info) { finishQ(it, res, info); } };
        setViewKeep(STAGE_BY[R.type] ? STAGE_BY[R.type].title : "تدريب");
        if (it.type === "build") buildQ(it, p, ctx); else if (it.type === "missing") missingQ(it, p, ctx); else chooseQ(it, p, ctx);
    }
    function finishQ(it, res, info) {
        var R = S.run, p = load();
        var key = it.type;
        if (key === "build" && it.model) key = "buildm";   /* ترتيب مع نموذج بصري: دعم لا دليل */
        var star = logResult(p, it.id, key, res, info);
        save(p);
        R.tally[res]++; if (star) R.stars++;
        R.byType[it.type] = R.byType[it.type] || { good: 0, n: 0 };
        R.byType[it.type].n++; if (res === "f" || res === "s") R.byType[it.type].good++;
        refreshHead();
        var F = { box: document.getElementById("wb4Q"), msg: document.getElementById("wb4Msg"), acts: document.getElementById("wb4QActs") };
        var tok = R.tok, adv = false;
        function go() { if (adv || tok !== R.tok) return; adv = true; R.i++; nextQ(); }
        var ok = (res === "f" || res === "s");
        if (F.box) F.box.classList.add(ok ? "good" : "soft");
        var supported = (key === "buildm");
        if (F.msg) setMsg(F, ok ? (res === "f" ? (supported ? "أحسنت! رتّبتَ الجملة بمساعدة النموذج." : "أحسنت! أصبتَ من أول مرة.") : "أحسنت! صحّحتَ بنفسك.") + (star ? " ★ نجمة إتقان جديدة!" : "") : "لا بأس، هذه هي الجملة. سنراها مرة أخرى.");
        if (res === "f") praise(); else if (res === "s") playKey("صحيح");
        if (F.acts) {
            F.acts.innerHTML = "";
            F.acts.appendChild(btn("main", R.i + 1 < R.items.length ? "التالي" : "النتيجة", go));
        }
        if (ok) later(go, reduced() ? 2400 : 2000);
    }

    /* ---------- ٢) أرتّب الجملة: وحدتان فقط (الكلمة الأولى، وَ+الكلمة الثانية) ---------- */
    function buildQ(it, p, ctx) {
        var R = S.run, s = BYID[it.id], test = ctx.test;
        var lv = test ? 2 : (p.lv.build || 1);
        /* المستوى ١: نموذج بصري للجملة (دعم). المستوى ٢: الصوت وحده بلا نموذج (نجاح مستقل) */
        var model = !test && lv <= 1;
        it.model = model;
        var F = frame(R, model ? "انظر إلى الجملة ثم رتّب الوحدتين" : "اسمع الجملة ثم رتّب الوحدتين", test ? "السؤال" : "السؤال");
        if (test) F.box.classList.add("test");
        var wrongs = 0, hinted = false, revealed = false, locked = false, replays = 0;
        var units = [s.u1, s.u2];
        var want = ["u1", "u2"];
        var tiles = shuffle([{ k: "u1", u: s.u1 }, { k: "u2", u: s.u2 }]);
        if (tiles[0].k === "u1") tiles = [tiles[1], tiles[0]];   /* لا تبدأ مرتبة جاهزة */
        tiles = tiles.map(function (t, i) { return { k: t.k, u: t.u, uid: "t" + i, slot: -1, el: null }; });
        var slots = [null, null];
        F.area.appendChild(listenRow(F, s, function () { replays++; }));
        later(function () { playSentence(s, null, NORMAL); }, reduced() ? 100 : 350);
        if (model) {
            var mdl = el("div", "wb3-model"); mdl.id = "wb4Model";
            mdl.appendChild(sentEl(s, "modelsyl"));
            F.area.appendChild(mdl);
        }
        var board = el("div", "wb3-board wb4-board"); board.id = "wb4Board";
        var NAMES = ["الأولى", "الثانية"];
        var slotEls = [0, 1].map(function (i) {
            var se = el("button", "wb3-slot wb4-slot"); se.type = "button"; se.setAttribute("data-slot", String(i));
            se.setAttribute("aria-label", "الخانة " + NAMES[i] + " (الوحدة " + NAMES[i] + ")");
            se.appendChild(el("span", "wb3-slotn", ar(i + 1) + " " + NAMES[i]));
            se.addEventListener("click", function () { if (!locked && slots[i]) release(i); });
            return se;
        });
        slotEls.forEach(function (x) { board.appendChild(x); });
        F.area.appendChild(board);
        var dn = el("p", "wb3-dirnote", "نبدأ من اليمين: الكلمة الأولى، ثم «وَ» مع الكلمة الثانية"); dn.id = "wb4DirNote"; F.area.appendChild(dn);
        var tray = el("div", "wb3-tray wb4-tray"); tray.id = "wb4Tray";
        tiles.forEach(function (t) {
            var te = el("button", "wb3-tile wb4-tile"); te.type = "button"; te.setAttribute("data-unit", t.k);
            te.setAttribute("aria-label", "الوحدة: " + t.u.text); te.textContent = t.u.text;
            te.setAttribute("dir", "rtl"); te.setAttribute("lang", "ar");
            t.el = te;
            te.addEventListener("click", function () {
                if (S.dragged) { S.dragged = false; return; }
                if (locked || t.slot >= 0) return;
                var k = slots.indexOf(null);
                if (k >= 0) place(t, k);
            });
            attachDrag(te, t);
            tray.appendChild(te);
        });
        F.area.appendChild(tray);

        function paint() {
            slotEls.forEach(function (se, i) {
                var t = slots[i];
                se.classList.toggle("filled", !!t);
                var old = se.querySelector(".wb3-slotl"); if (old) se.removeChild(old);
                if (t) { var l = el("span", "wb3-slotl wb4-slotl l" + (i + 1), t.u.text); l.setAttribute("dir", "rtl"); l.setAttribute("lang", "ar"); se.appendChild(l); }
            });
            tiles.forEach(function (t) { t.el.classList.toggle("used", t.slot >= 0); t.el.disabled = t.slot >= 0 || locked; });
        }
        function place(t, k) { if (slots[k]) release(k); slots[k] = t; t.slot = k; paint(); check(); }
        function release(k) { var t = slots[k]; if (!t) return; slots[k] = null; t.slot = -1; paint(); }
        function clearSlots() { release(0); release(1); }
        function check() {
            if (slots.indexOf(null) >= 0 || locked) return;
            var got = slots.map(function (t) { return t.k; });
            if (got.join("") === want.join("")) { good(); return; }
            wrongs++;
            if (test) { locked = true; ctx.done("no", {}); return; }
            slotEls.forEach(function (se) { se.classList.add("bad"); });
            setMsg(F, "ليس هذا الترتيب. نبدأ من اليمين: الكلمة الأولى في الخانة ١، ثم «وَ» مع الكلمة الثانية.");
            locked = true;
            later(function () {
                locked = false; slotEls.forEach(function (se) { se.classList.remove("bad"); }); clearSlots();
                if (wrongs >= 2 && !hinted) {
                    hinted = true;
                    var tile = tiles.filter(function (t) { return t.k === "u1"; })[0];
                    if (tile) tile.el.classList.add("hint");
                    setMsg(F, "تلميح: ابدأ بهذه الكلمة في الخانة ١.");
                    playUnit(s.u1);
                }
                paint();
            }, reduced() ? 1500 : 1200);
            if (!F.acts.querySelector("#wb4Help")) {
                var hb = btn("ghost", "ساعدني", reveal); hb.id = "wb4Help"; F.acts.appendChild(hb);
            }
        }
        function reveal() {
            if (revealed || (locked && !F.box.querySelector(".wb3-slot.bad"))) return;
            revealed = true; locked = true;
            clearSlots();
            slotEls.forEach(function (se) { se.classList.remove("bad"); });
            want.forEach(function (k, i) {
                var t = tiles.filter(function (x) { return x.k === k; })[0];
                slots[i] = t; t.slot = i;
            });
            paint();
            setMsg(F, "هكذا تُرتَّب الجملة: الكلمة الأولى ثم «وَ» مع الكلمة الثانية.");
            later(function () { good(); }, 700);
        }
        /* النجاح: تُعرض الجملة كاملة ويُشغَّل تسجيلها الكامل */
        function good() {
            locked = true; paint();
            if (test) { ctx.done("ok", {}); return; }
            var res = revealed ? "r" : (hinted ? "a" : (wrongs ? "s" : "f"));
            board.classList.add("joined");
            later(function () {
                var j = sentEl(s, "huge pop"); j.id = "wb4Joined";
                board.innerHTML = ""; board.classList.add("done"); board.appendChild(j);
                tray.classList.add("gone");
                F.msg.textContent = "الجملة كاملة.";
                playSentence(s, null, NORMAL);
            }, reduced() ? 150 : 450);
            later(function () { ctx.done(res, { wrongs: wrongs, replays: replays }); }, reduced() ? 1400 : 1900);
        }
        /* سحب بالمؤشر (يعمل باللمس والفأرة)؛ النقر بديل كامل */
        function attachDrag(te, t) {
            var sx = 0, sy = 0, active = false, ghost = null, id = null;
            te.addEventListener("pointerdown", function (e) {
                if (locked || t.slot >= 0 || (e.pointerType === "mouse" && e.button !== 0)) return;
                sx = e.clientX; sy = e.clientY; active = true; id = e.pointerId;
                try { te.setPointerCapture(id); } catch (x) { /* لا شيء */ }
            });
            te.addEventListener("pointermove", function (e) {
                if (!active) return;
                var dx = e.clientX - sx, dy = e.clientY - sy;
                if (!ghost) {
                    if (Math.abs(dx) + Math.abs(dy) < 12) return;
                    ghost = te.cloneNode(true); ghost.classList.add("wb3-ghost"); ghost.removeAttribute("id");
                    document.body.appendChild(ghost); te.classList.add("lifted");
                }
                ghost.style.left = e.clientX + "px"; ghost.style.top = e.clientY + "px";
                var under = document.elementFromPoint(e.clientX, e.clientY), sl = under && under.closest ? under.closest(".wb3-slot") : null;
                slotEls.forEach(function (se) { se.classList.toggle("over", se === sl); });
            });
            function end(e) {
                if (!active) return; active = false;
                try { te.releasePointerCapture(id); } catch (x) { /* لا شيء */ }
                if (ghost) {
                    S.dragged = true; setTimeout(function () { S.dragged = false; }, 50);
                    ghost.style.display = "none";
                    var under = document.elementFromPoint(e.clientX, e.clientY), sl = under && under.closest ? under.closest(".wb3-slot") : null;
                    if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
                    ghost = null; te.classList.remove("lifted");
                    slotEls.forEach(function (se) { se.classList.remove("over"); });
                    if (sl && !locked) place(t, +sl.getAttribute("data-slot"));
                }
            }
            te.addEventListener("pointerup", end);
            te.addEventListener("pointercancel", function () { if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost); ghost = null; te.classList.remove("lifted"); active = false; });
        }
        paint();
    }

    /* ---------- ٣) أستمع وأختار الجملة ---------- */
    function chooseQ(it, p, ctx) {
        var R = S.run, id = it.id, s = BYID[id], test = ctx.test;
        var lv = test ? 2 : (p.lv.hear || 1);
        var nOpt = lv <= 1 ? 2 : 3;
        var opts = arrangeOptions(id, pickDistractors(id, nOpt - 1, lv));
        var F = frame(R, "اسمع ثم اختر الجملة التي سمعتَها");
        if (test) F.box.classList.add("test");
        var wrongs = 0, hinted = false, revealed = false, replays = 0, locked = false;
        function noted() { replays++; }
        function skipBtn() {
            if (F.acts.querySelector(".skip")) return;
            var sk = btn("ghost skip", "تخطَّ هذا السؤال", function () { if (locked) return; locked = true; R.tally.skip++; if (test) ctx.done("skip", {}); else { R.i++; nextQ(); } });
            F.acts.appendChild(sk);
        }
        F.area.appendChild(listenRow(F, s, noted));
        later(function () {
            var started = playSentence(s, function (ok) { if (ok === false) { setMsg(F, "تعذّر تشغيل الصوت الآن."); skipBtn(); } }, NORMAL);
            if (!started) skipBtn();
        }, reduced() ? 100 : 350);
        var box = el("div", "wb3-opts wb4-opts n" + nOpt); box.id = "wb4Opts";
        var btns = {};
        opts.forEach(function (oid) {
            var o = BYID[oid];
            var ob = el("button", "wb3-opt wb4-opt"); ob.type = "button"; ob.setAttribute("data-id", oid);
            ob.appendChild(sentEl(o, "optsyl"));
            ob.addEventListener("click", function () { pick(oid, ob); });
            btns[oid] = ob; box.appendChild(ob);
        });
        F.area.appendChild(box);
        var helpB = null;
        function pick(oid, ob) {
            if (locked) return;
            if (oid === id) {
                locked = true; ob.classList.add("right");
                if (test) { ctx.done("ok", {}); return; }
                later(function () { playSentence(s, null, NORMAL); }, 150);
                var res = revealed ? "r" : (hinted ? "a" : (wrongs ? "s" : "f"));
                ctx.done(res, { wrongs: wrongs, replays: replays });
                return;
            }
            wrongs++;
            ob.classList.add("fade"); ob.disabled = true; ob.setAttribute("aria-disabled", "true");
            if (test) { locked = true; ctx.done("no", {}); return; }
            if (wrongs === 1) {
                setMsg(F, "اسمع مرة أخرى، وانظر إلى الكلمتين بالترتيب من اليمين.");
                later(function () { playSentence(s, null, SLOW); }, 250);
            } else if (!hinted) {
                hinted = true;
                setMsg(F, "تلميح: تبدأ الجملة بهذه الكلمة.");
                var hl = unitEl({ text: s.u1.word }, "hintl"); hl.id = "wb4Hint"; F.area.insertBefore(hl, box);
                playUnit(s.u1);
            }
            if (!helpB) {
                helpB = btn("ghost", "ساعدني", function () {
                    if (locked || revealed) return;
                    revealed = true;
                    Object.keys(btns).forEach(function (k) { if (k !== id) btns[k].classList.add("fade"); });
                    btns[id].classList.add("reveal");
                    setMsg(F, "هذه هي الجملة الصحيحة. اضغط عليها.");
                    playSentence(s, null, SLOW);
                });
                helpB.id = "wb4Help"; F.acts.appendChild(helpB);
            }
        }
    }

    /* ---------- ٤) أكمل الجملة: كلمة ناقصة من بديلين واضحين ---------- */
    function missingQ(it, p, ctx) {
        var R = S.run, s = BYID[it.id], test = ctx.test;
        var lv = test ? 2 : (p.lv.missing || 1);
        var hide = (s.n % 2 === 1) ? 1 : 0;           /* ١ = الوحدة الثانية، ٠ = الأولى (بالتناوب، ثابت لكل جملة) */
        var shownU = hide ? s.u1 : s.u2, hiddenU = hide ? s.u2 : s.u1;
        var key = hide ? "u2" : "u1";
        /* البديل من وحدة الموضع نفسه في جملة أخرى: الأبعد شكلًا في المستوى ١، والأقرب في ٢ */
        var dIds = pickDistractors(s.id, 1, lv), d = BYID[dIds[0]];
        var dUnit = hide ? d.u2 : d.u1;
        var F = frame(R, "أي كلمة تنقص من الجملة؟");
        if (test) F.box.classList.add("test");
        var wrongs = 0, hinted = false, revealed = false, locked = false;
        var board = el("div", "wb3-board wb4-board wb3-gap"); board.id = "wb4Board";
        var slotEl = el("div", "wb3-slot wb4-slot gap"); slotEl.id = "wb4Gap";
        slotEl.appendChild(el("span", "wb3-slotn", "؟"));
        var shownEl = unitEl(shownU, "given"); shownEl.id = "wb4Given";
        if (hide) { board.appendChild(shownEl); board.appendChild(slotEl); } else { board.appendChild(slotEl); board.appendChild(shownEl); }
        /* الجملة تُقرأ من اليمين: العنصر الأول في DOM هو الأيمن بسبب dir=rtl */
        F.area.appendChild(board);
        var opts = shuffle([{ k: "ok", u: hiddenU }, { k: "no", u: dUnit }]);
        var box = el("div", "wb3-opts wb4-opts n2"); box.id = "wb4Opts";
        var btns = {};
        opts.forEach(function (o) {
            var ob = el("button", "wb3-opt wb4-opt"); ob.type = "button"; ob.setAttribute("data-k", o.k);
            ob.appendChild(unitEl(o.u, "optsyl"));
            ob.addEventListener("click", function () { pick(o, ob); });
            btns[o.k] = ob; box.appendChild(ob);
        });
        F.area.appendChild(box);
        setMsg(F, "انظر إلى الكلمة الظاهرة ثم اختر الكلمة الناقصة. لا يبدأ الصوت وحده.");
        var helpB = null;
        function fill() {
            slotEl.classList.remove("gap"); slotEl.classList.add("filled-ok");
            var l = unitEl(hiddenU, "slotl"); slotEl.innerHTML = ""; slotEl.appendChild(l);
            box.classList.add("gone");
        }
        function pick(o, ob) {
            if (locked) return;
            if (o.k === "ok") {
                locked = true; ob.classList.add("right"); fill();
                if (test) { ctx.done("ok", {}); return; }
                later(function () { playSentence(s, null, NORMAL); }, 200);
                var res = revealed ? "r" : (hinted ? "a" : (wrongs ? "s" : "f"));
                ctx.done(res, { wrongs: wrongs });
                return;
            }
            wrongs++;
            ob.classList.add("fade"); ob.disabled = true; ob.setAttribute("aria-disabled", "true");
            if (test) { locked = true; ctx.done("no", {}); return; }
            if (wrongs === 1) {
                hinted = true;
                setMsg(F, "تلميح: اسمع الكلمة الظاهرة، ثم اختر الكلمة الأخرى.");
                playUnit(shownU);
            }
            if (!helpB) {
                helpB = btn("ghost", "ساعدني", function () {
                    if (locked || revealed) return;
                    revealed = true;
                    btns.no.classList.add("fade"); btns.ok.classList.add("reveal");
                    setMsg(F, "هذه هي الكلمة الناقصة. اضغط عليها.");
                });
                helpB.id = "wb4Help"; F.acts.appendChild(helpB);
            }
        }
        void key;
    }

    /* ---------- ملخص الجولة وتعديل المستوى ---------- */
    function summary() {
        var R = S.run, p = load();
        var t = R.tally, total = t.f + t.s + t.a + t.r;
        var lvKey = R.type;
        if (p.lv[lvKey] != null && total >= 3) {
            if (t.f / total >= 0.8 && p.lv[lvKey] < 2) p.lv[lvKey]++;
            else if ((t.a + t.r) / total >= 0.6 && p.lv[lvKey] > 1) p.lv[lvKey]--;
        }
        p.sessions++; save(p);
        setView("summary", STAGE_BY[R.type].title);
        var b = body(), bx = el("section", "wb3-end"); bx.id = "wb4Summary";
        bx.appendChild(el("h2", "", "أحسنت! انتهت الجولة"));
        var ul = el("ul", "wb3-stats");
        [["من أول مرة", t.f], ["بعد تصحيح ذاتي", t.s], ["بتلميح", t.a], ["بعد عرض الحل", t.r]].forEach(function (x) {
            var li = el("li"); li.appendChild(el("b", "", ar(x[1]))); li.appendChild(el("span", "", x[0])); ul.appendChild(li);
        });
        bx.appendChild(ul);
        if (R.stars) bx.appendChild(el("p", "wb3-note", "نجوم إتقان جديدة: " + ar(R.stars)));
        bx.appendChild(el("p", "wb3-note", "لا شيء يضيع: النجوم المكتسبة تبقى، والأخطاء لا تُنقص شيئًا."));
        var row = el("div", "wb3-row center");
        var next = (typeof S.start === "number") ? (S.start + CFG.sessionLength) % SENT.length : null;
        row.appendChild(btn("main", "جولة جديدة", function () { S.start = next; startActivity(R.type); }));
        row.appendChild(btn("ghost", "الرئيسية", renderHome));
        bx.appendChild(row); b.appendChild(bx);
    }

    /* ---------- ٥) أقرأ بنفسي ---------- */
    function applyRead(p, id, mode) {
        if (mode === true) mode = "ok"; else if (mode === false) mode = "no";
        var r = rec(p, id);
        r.read.att++; r.last = Date.now();
        if (mode === "ok") { r.read.ok++; r.read.last = "ok"; r.hist = (r.hist + "f").slice(-8); }
        else if (mode === "help") { r.read.hp++; r.read.last = "help"; r.hist = (r.hist + "a").slice(-8); }
        else { r.read.sup++; r.read.last = "sup"; r.hist = (r.hist + "x").slice(-8); }
        return mode === "ok" ? giveStar(p, id) : false;
    }
    function startRead() {
        var p = load();
        var idsList = sessionIds(p, "read", (typeof S.start === "number") ? S.start : null, CFG.sessionLength);
        S.run = { type: "read", items: idsList.map(function (id) { return { id: id, type: "read" }; }), i: 0, ok: 0, help: 0, sup: 0, nores: 0, stars: 0, tok: 0 };
        readQ();
    }
    function readQ() {
        var R = S.run;
        if (R.i >= R.items.length) return readEnd();
        var s = BYID[R.items[R.i].id];
        R.tok++; var tok = R.tok;
        setViewKeep(STAGE_BY.read.title);
        var F = frame(R, "اقرأ الجملة بصوتك", "الجملة");
        var show = el("div", "wb3-readshow wb4-show"); show.id = "wb4ReadShow";
        show.appendChild(sentEl(s, "huge"));
        F.area.appendChild(show);
        setMsg(F, "انظر إلى الكلمتين من اليمين ثم اقرأ الجملة متصلة. لا يبدأ الصوت وحده.");
        var helps = 0;
        var helpB = btn("ghost", "ساعدني", function () {
            if (helps >= 2) return;
            helps++;
            if (helps === 1) {
                show.innerHTML = "";
                var row = el("div", "wb4-steps");
                var a = unitEl({ text: s.u1.word }, "step1"); var plus = el("span", "wb3-plus", "+"); var bb = unitEl(s.u2, "step2");
                row.appendChild(a); row.appendChild(plus); row.appendChild(bb);
                show.appendChild(row);
                setMsg(F, "الكلمة الأولى، ثم «وَ» متصلة بالكلمة الثانية. اقرأهما معًا.");
            } else {
                show.innerHTML = ""; show.appendChild(sentEl(s, "huge"));
                setMsg(F, "اسمع الجملة ببطء ثم اقرأها معي.");
                playSentence(s, null, SLOW);
                helpB.disabled = true;
            }
            R.helped = true;
        });
        helpB.id = "wb4ReadHelp";
        var read = btn("main big", "قرأتُ", function () {
            read.disabled = true; helpB.disabled = true; F.acts.innerHTML = "";
            F.acts.appendChild(iconBtn("listen", ICONS.speaker, "اسمع التسجيل", function () { playSentence(s, null, NORMAL); }));
            F.acts.appendChild(iconBtn("listen slow", ICONS.slow, "ببطء", function () { playSentence(s, null, SLOW); }));
            var tc = el("div", "wb3-tconf"); tc.id = "wb4TConf";
            tc.appendChild(el("span", "wb3-tconf-l", "تأكيد المعلم"));
            var okb = btn("main", "قرأ بلا مساعدة", function () { gate(function () { rate("ok"); }); }); okb.id = "wb4ReadOk";
            if (helps > 0) { okb.disabled = true; okb.setAttribute("aria-disabled", "true"); okb.title = "استُخدمت مساعدة"; }
            var hpb = btn("ghost", "قرأ بمساعدة", function () { gate(function () { rate("help"); }); }); hpb.id = "wb4ReadHelped";
            var nob = btn("ghost", "يحتاج تدريبًا", function () { gate(function () { rate("no"); }); }); nob.id = "wb4ReadNo";
            var skb = btn("ghost", "بدون تقييم", function () { R.nores++; R.i++; readQ(); }); skb.id = "wb4ReadSkip";
            tc.appendChild(okb); tc.appendChild(hpb); tc.appendChild(nob); tc.appendChild(skb);
            F.acts.appendChild(tc);
            setMsg(F, "ضغط «قرأتُ» وحده لا يُحسب إتقانًا. المعلم يؤكد النطق." + (helps > 0 ? " استُخدمت مساعدة، فلا تُحسب قراءة مستقلة." : ""));
        });
        read.id = "wb4Read";
        F.acts.appendChild(helpB); F.acts.appendChild(read);
        function rate(mode) {
            if (tok !== R.tok) return; R.tok++;
            var pp = load();
            if (helps > 0) { rec(pp, s.id).read.hint += helps; }
            if (mode === "ok" && helps > 0) mode = "help";   /* سلامة: لا استقلال مع مساعدة */
            var star = applyRead(pp, s.id, mode); save(pp);
            if (mode === "ok") R.ok++; else if (mode === "help") R.help++; else R.sup++;
            if (star) R.stars++;
            refreshHead();
            R.i++; readQ();
        }
    }
    function readEnd() {
        var R = S.run;
        setView("summary", STAGE_BY.read.title);
        var b = body(), bx = el("section", "wb3-end"); bx.id = "wb4Summary";
        bx.appendChild(el("h2", "", "انتهت جولة القراءة"));
        var ul = el("ul", "wb3-stats");
        [["قرأ بلا مساعدة (بتأكيد المعلم)", R.ok], ["قرأ بمساعدة", R.help], ["يحتاج تدريبًا", R.sup], ["بدون تقييم", R.nores]].forEach(function (x) {
            var li = el("li"); li.appendChild(el("b", "", ar(x[1]))); li.appendChild(el("span", "", x[0])); ul.appendChild(li);
        });
        bx.appendChild(ul);
        if (R.stars) bx.appendChild(el("p", "wb3-note", "نجوم إتقان جديدة: " + ar(R.stars)));
        var row = el("div", "wb3-row center");
        var next = (typeof S.start === "number") ? (S.start + CFG.sessionLength) % SENT.length : null;
        row.appendChild(btn("main", "جولة جديدة", function () { S.start = next; startRead(); }));
        row.appendChild(btn("ghost", "الرئيسية", renderHome));
        bx.appendChild(row); b.appendChild(bx);
    }

    /* ---------- ٦) أختبر نفسي: ٥ أسئلة متنوعة من الجمل العشر، بلا مساعدة ---------- */
    function startTest() {
        var pick = shuffle(SENT.map(function (s) { return s.id; })).slice(0, CFG.test.total);
        var order = ["build", "hear", "missing", "build", "read"];
        var items = order.map(function (t, i) { return { id: pick[i], type: t }; });
        S.run = { type: "test", items: items, i: 0, auto: 0, autoTotal: 0, skipped: 0, reads: [], tok: 0 };
        testQ();
    }
    function testQ() {
        var R = S.run;
        if (R.i >= R.items.length) return testEnd();
        var it = R.items[R.i], p = load();
        R.tok++; var tok = R.tok;
        setViewKeep(STAGE_BY.test.title);
        function nxt() { if (tok !== R.tok) return; R.tok++; R.i++; later(testQ, 0); }
        var ctx = {
            test: true, tok: tok,
            done: function (res) {
                if (res === "skip") R.skipped++;
                else { R.autoTotal++; if (res === "ok") R.auto++; }
                nxt();
            }
        };
        if (it.type === "read") {
            var s = BYID[it.id], F = frame(R, "اقرأ الجملة بصوتك");
            F.box.classList.add("test");
            F.area.appendChild(sentEl(s, "huge"));
            setMsg(F, "اقرأ الجملة، ثم اضغط «قرأتُ». سيؤكد المعلم نطقك في النهاية.");
            var rb = btn("main big", "قرأتُ", function () { R.reads.push(it.id); nxt(); }); rb.id = "wb4Read";
            F.acts.appendChild(rb);
            return;
        }
        if (it.type === "build") buildQ(it, p, ctx); else if (it.type === "missing") missingQ(it, p, ctx); else chooseQ(it, p, ctx);
    }
    function evalTest(t) {
        if (t.status === "incomplete") return;
        var known = t.readOk.every(function (x) { return x === true || x === false; });
        if (!known) { t.status = "pending"; return; }
        t.status = (t.auto >= CFG.test.passAuto && t.readOk.every(function (x) { return x === true; })) ? "pass" : "fail";
    }
    function testEnd() {
        var R = S.run, p = load();
        var t = { t: Date.now(), auto: R.auto, autoTotal: CFG.test.autoTotal, reads: R.reads.slice(), readOk: R.reads.map(function () { return null; }), status: "pending" };
        if (R.skipped || R.autoTotal < CFG.test.autoTotal) t.status = "incomplete";
        p.tests.push(t); if (p.tests.length > 20) p.tests = p.tests.slice(-20);
        p.sessions++; save(p);
        renderTestResult(p.tests.length - 1, false);
    }
    function confirmTest(idx, k, ok) {
        var p = load(), t = p.tests[idx]; if (!t || t.readOk[k] === ok) return;
        if (t.readOk[k] === true || t.readOk[k] === false) return;   /* تأكيد واحد لكل قراءة */
        t.readOk[k] = ok;
        applyRead(p, t.reads[k], ok ? "ok" : "no");
        evalTest(t);
        if (t.status === "pass" && !p.testStar) {
            p.testStar = true; p.stars = Math.min(MAX_STARS, p.stars + 1);
            try { if (typeof addStars === "function") addStars(1); } catch (e) { /* لا شيء */ }
        }
        save(p);
    }
    function renderTestResult(idx, fromTeacher) {
        setView("test-result", "نتيجة الاختبار");
        var p = load(), t = p.tests[idx], b = body();
        var bx = el("section", "wb3-end"); bx.id = "wb4TestResult";
        var head = el("h2", "");
        bx.appendChild(head);
        bx.appendChild(el("p", "wb3-big", "الأسئلة الآلية: " + ar(t.auto) + " من " + ar(t.autoTotal) + " (المطلوب " + ar(CFG.test.passAuto) + " فأكثر)"));
        if (t.status === "incomplete") {
            head.textContent = "لم يكتمل الاختبار";
            bx.appendChild(el("p", "wb3-note", "تعذّر تشغيل صوت أحد الأسئلة، فلا يُحسب هذا الاختبار. أعده لاحقًا."));
        } else {
            var rl = el("div", "wb3-reads"); rl.id = "wb4Reads";
            t.reads.forEach(function (rid, k) {
                var row = el("div", "wb3-readrow");
                row.appendChild(sentEl(BYID[rid], "small"));
                var v = t.readOk[k];
                if (v === true || v === false) row.appendChild(el("span", "wb3-tag " + (v ? "ok" : "no"), v ? "قرأ صحيحًا" : "يحتاج تدريبًا"));
                else {
                    var a = btn("main", "قرأ صحيحًا", function () { gate(function () { confirmTest(idx, k, true); renderTestResult(idx, fromTeacher); }); });
                    var c = btn("ghost", "يحتاج تدريبًا", function () { gate(function () { confirmTest(idx, k, false); renderTestResult(idx, fromTeacher); }); });
                    a.setAttribute("data-k", String(k)); a.className += " rok"; c.className += " rno";
                    row.appendChild(a); row.appendChild(c);
                }
                rl.appendChild(row);
            });
            bx.appendChild(rl);
            if (t.status === "pending") {
                head.textContent = "بانتظار تأكيد المعلم";
                bx.appendChild(el("p", "wb3-note", "تُحسب القراءة بتأكيد المعلم فقط. لا نجمة قبل التأكيد."));
            } else if (t.status === "pass") {
                head.textContent = "نجحتَ في الاختبار";
                bx.appendChild(el("p", "wb3-note", "نجمة الاختبار محسوبة مرة واحدة فقط."));
            } else {
                head.textContent = "نحتاج مزيدًا من التدريب";
                bx.appendChild(el("p", "wb3-note", "راجع الجمل ثم أعد الاختبار متى شئت. لا يضيع شيء مما أنجزتَه."));
            }
        }
        var row2 = el("div", "wb3-row center");
        row2.appendChild(btn("main", "أعد الاختبار", startTest));
        row2.appendChild(btn("ghost", fromTeacher ? "لوحة المعلم" : "الرئيسية", fromTeacher ? function () { renderTeacher(); } : renderHome));
        bx.appendChild(row2); b.appendChild(bx);
    }

    /* ---------- لوحة المعلم ---------- */
    function pct(a) { return a[1] ? Math.round(a[0] * 100 / a[1]) + "٪" : "—"; }
    function renderTeacher() {
        setView("teacher", "لوحة المعلم");
        var p = load(), b = body();
        var sec = el("section", "wb3-end wb3-teacher"); sec.id = "wb4TeacherPanel";
        sec.appendChild(el("h2", "", "لوحة المعلم — الدرس الرابع"));
        sec.appendChild(el("p", "wb3-note", "النجوم: " + ar(p.stars) + " من " + ar(MAX_STARS) + " · جلسات: " + ar(p.sessions) + (D.AUDIO_CHECKED ? "" : " · مطابقة الأصوات بانتظار الاستماع (صفحة l4-audio-check.html)")));
        var tb = el("table", "wb3-tbl"); tb.id = "wb4Table";
        var th = el("tr"); ["الجملة", "الحالة", "ترتيب", "استماع", "إكمال", "القراءة"].forEach(function (h) { th.appendChild(el("th", "", h)); }); tb.appendChild(th);
        SENT.forEach(function (s) {
            var r = p.syl[s.id], tr = el("tr");
            tr.appendChild(el("td", "", ar(s.n) + ". " + s.key));
            tr.appendChild(el("td", "", STATE_LABEL[stateOf(p, s.id)] + (p.starred[s.id] ? " ★" : "")));
            var b1 = r ? [r.act.build[0] + r.act.buildm[0], r.act.build[1] + r.act.buildm[1]] : [0, 0];
            tr.appendChild(el("td", "", pct(b1)));
            tr.appendChild(el("td", "", pct(r ? r.act.hear : [0, 0])));
            tr.appendChild(el("td", "", pct(r ? r.act.missing : [0, 0])));
            tr.appendChild(el("td", "", r && r.read.att ? ({ ok: "مستقلة", help: "بمساعدة", sup: "تدريب" }[r.read.last] || "—") : "—"));
            tb.appendChild(tr);
        });
        sec.appendChild(tb);
        if (p.tests.length) {
            sec.appendChild(el("h3", "", "الاختبارات"));
            p.tests.slice().reverse().slice(0, 5).forEach(function (t) {
                var idx = p.tests.indexOf(t);
                var row = el("div", "wb3-row");
                row.appendChild(el("span", "", ({ pending: "بانتظار التأكيد", pass: "نجح", fail: "يحتاج تدريبًا", incomplete: "غير مكتمل" })[t.status] + " — " + ar(t.auto) + "/" + ar(t.autoTotal)));
                if (t.status === "pending") row.appendChild(btn("ghost", "تأكيد القراءة", function () { renderTestResult(idx, true); }));
                sec.appendChild(row);
            });
        }
        var row3 = el("div", "wb3-row center"); row3.appendChild(btn("main", "الرئيسية", renderHome));
        sec.appendChild(row3);
        b.appendChild(sec);
    }

    /* ---------- الدخول والخروج ---------- */
    function open() {
        if (!build()) return;
        try { if (window.taEnsureLessonAudio) window.taEnsureLessonAudio(); } catch (e) { /* بصمت */ }
        S.gate = false; S.start = null;
        try { showScreen(SCREEN); } catch (e) { /* لا شيء */ }
        renderHome();
    }
    function teardown() { S.session++; clearTimers(); stopAudio(); }
    function exitToWords() { teardown(); try { showScreen("words"); } catch (e) { /* لا شيء */ } }

    var prevShow = showScreen;
    showScreen = function (id) {
        if (id !== SCREEN) teardown();
        return prevShow.apply(this, arguments);
    };
    function bindEntry() {
        var bt = document.getElementById("wbk4Entry");
        if (bt && !bt.getAttribute("data-wbk4-bound")) { bt.setAttribute("data-wbk4-bound", "1"); bt.addEventListener("click", open); }
        var q = null; try { q = new URLSearchParams(location.search).get("wbk4"); } catch (e) { /* لا شيء */ }
        if (q === "open") setTimeout(open, 900);
    }
    document.addEventListener("DOMContentLoaded", function () { setTimeout(bindEntry, 0); });
    if (document.readyState !== "loading") setTimeout(bindEntry, 0);

    window.wbk4Open = open;
    window.wbk4State = S;   /* للاختبار */
    window.wbk4Internals = { load: load, save: save, rec: rec, logResult: logResult, stateOf: stateOf, giveStar: giveStar, applyRead: applyRead, startActivity: startActivity, startTeach: startTeach, startRead: startRead, startTest: startTest, confirmTest: confirmTest, playSentence: playSentence, renderHome: renderHome, renderLibrary: renderLibrary, renderTeacher: renderTeacher, BYID: BYID };
})();
