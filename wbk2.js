/* =========================================================================
   📘 الدرس الثاني «أقرأ حرفين مفتوحين» — المنطق والواجهة (كتلة معزولة)
   المحتوى كله من wbk2-data.js (٢٤ مقطعًا فريدًا في ٢٥ خلية من صفحة ٥ في الكتاب).
   - لا يعدّل الدرس الأول ولا قسم الكلمات ولا script.js: يُحمَّل بعده ويُغلّف showScreen للتنظيف فقط.
   - الصوت: تسجيلات المقاطع «المعتمدة» فقط (مشغّل خاص)، وأصوات الحروف والتشجيع المعتمدة من EduAudio.
     لا TTS، ولا تركيب مقطع من صوتَي حرفين (EduAudio نفسه يركّب «حرف+حرف» فلا يُمرَّر إليه نص مقطع أبدًا).
   - التخزين: taha_wbk2_progress_v1 (لكل طالب تلقائيًا عبر StudentStore). لا يمسّ بيانات الدرس الأول.
   - النجوم: نجمة واحدة لكل مقطع فريد (وَقَـ مرة واحدة) عند أول نجاح لا يكشف الحل + نجمة اختبار واحدة.
   - إتقان القراءة يؤكده المعلم فقط؛ ضغط «قرأت» لا يُحسب دليلًا.
   ========================================================================= */
(function () {
    "use strict";

    var D = window.WBK2_DATA;
    if (!D) return;

    var KEY = "taha_wbk2_progress_v1";
    var SCREEN = "wbkL2";
    var SYL = D.SYLLABLES, CFG = D.CONFIG, STAGES = D.STAGES, GROUPS = D.GROUPS, CELLS = D.CELLS;
    var BYID = {};
    SYL.forEach(function (s) { BYID[s.id] = s; });
    var PRAISE = ["أحسنت يا بطل", "أحسنت، عمل رائع", "صحيح"];
    var MAX_STARS = SYL.length + CFG.test.maxStars;
    var STAGE_BY = {};
    STAGES.forEach(function (s) { STAGE_BY[s.id] = s; });

    var S = {
        view: "home", scope: "current", session: 0, timers: [], root: null, built: false,
        gate: false, gateTimer: 0, run: null, live: null, lastPos: []
    };

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
        var ses = S.session;
        var t = setTimeout(function () {
            S.timers = S.timers.filter(function (x) { return x !== t; });
            if (ses === S.session) fn();
        }, ms);
        S.timers.push(t);
        return t;
    }
    function clearTimers() { S.timers.forEach(clearTimeout); S.timers = []; }
    function say(text) { var l = S.live; if (l) { l.textContent = ""; setTimeout(function () { l.textContent = text; }, 30); } }
    function body() { return document.getElementById("wb2Body"); }

    /* ---------- الصوت ---------- */
    var aud = null, audTok = 0;
    var TWO_PAIR = /^([ء-ي]َ){2}$/;
    function stopAudio() {
        audTok++;
        if (aud) { try { aud.pause(); } catch (e) { /* لا شيء */ } aud.onended = aud.onerror = null; aud = null; }
        try { EduAudio.stop(); } catch (e) { /* لا شيء */ }
    }
    /* تشغيل تسجيل المقطع الكامل: للمعتمد فقط. يعيد true إن بدأ التشغيل فعلًا */
    function playSyllable(s, done) {
        stopAudio();
        if (!s || !s.approved || !s.audio) { if (done) done(false); return false; }
        var tok = ++audTok;
        var a = new Audio(s.audio);
        aud = a;
        a.onended = function () { if (tok === audTok) { aud = null; if (done) done(true); } };
        a.onerror = function () { if (tok === audTok) { aud = null; if (done) done(false); } };
        var pr = a.play();
        if (pr && pr.catch) pr.catch(function () { if (tok === audTok) { aud = null; if (done) done(false); } });
        return true;
    }
    /* أصوات الحروف والتشجيع من EduAudio (مفاتيح مسجَّلة فقط). نص مقطع من حرفين بفتحة يُرفض دائمًا */
    function playKey(key, done) {
        if (typeof key !== "string" || TWO_PAIR.test(key.replace(/ـ/g, ""))) { if (done) done(false); return false; }
        stopAudio();
        try { EduAudio.play([key], { mode: "interrupt", done: function () { if (done) done(true); } }); return true; }
        catch (e) { if (done) done(false); return false; }
    }
    function praise(done) { playKey(PRAISE[Math.floor(Math.random() * PRAISE.length)], done); }
    function audioBusy() { return !!aud; }

    /* ---------- التخزين لكل طالب ---------- */
    function newRec() {
        return {
            seen: 0, f: 0, s: 0, a: 0, r: 0, w: 0, hist: "", rp: 0, last: 0,
            act: { hear: [0, 0], build: [0, 0], buildv: [0, 0], decode: [0, 0] },
            read: { att: 0, ok: 0, sup: 0, last: "", hint: 0 }
        };
    }
    function fixRec(r) {
        var b = newRec();
        Object.keys(b).forEach(function (k) { if (typeof r[k] !== typeof b[k]) r[k] = b[k]; });
        ["hear", "build", "buildv", "decode"].forEach(function (k) {
            if (!Array.isArray(r.act[k]) || r.act[k].length !== 2) r.act[k] = [0, 0];
        });
        if (!r.read || typeof r.read !== "object") r.read = b.read;
        Object.keys(b.read).forEach(function (k) { if (typeof r.read[k] !== typeof b.read[k]) r.read[k] = b.read[k]; });
        return r;
    }
    function blank() {
        return { v: 1, stars: 0, starred: {}, testStar: false, sessions: 0, syl: {}, lv: { hear: 1, build: 1, decode: 1 }, tests: [], prefs: { tap: false } };
    }
    function load() {
        try {
            var o = JSON.parse(localStorage.getItem(KEY));
            if (o && o.v === 1 && o.syl && typeof o.syl === "object") {
                if (typeof o.stars !== "number") o.stars = 0;
                if (!o.starred || typeof o.starred !== "object") o.starred = {};
                if (!o.lv || typeof o.lv !== "object") o.lv = { hear: 1, build: 1, decode: 1 };
                ["hear", "build", "decode"].forEach(function (k) { if (typeof o.lv[k] !== "number") o.lv[k] = 1; });
                if (!Array.isArray(o.tests)) o.tests = [];
                if (!o.prefs || typeof o.prefs !== "object") o.prefs = { tap: false };
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
    function mastered(r) { return !!(r && r.read.last === "ok" && indep(r) >= 2 && !needsReview(r)); }
    function stateOf(p, id) {
        var r = p.syl[id];
        if (!touched(r)) return "new";
        if (needsReview(r)) return "review";
        if (mastered(r)) return "mastered";
        return "learning";
    }
    var STATE_LABEL = { "new": "جديد", learning: "أتدرّب", review: "أراجع", mastered: "أتقنت" };

    /* النجمة: مرة لكل مقطع فريد عند أول نجاح لا يكشف الحل (أو تأكيد المعلم)؛ تُمرَّر لمجموع التطبيق */
    function giveStar(p, id) {
        if (p.starred[id] || p.stars >= MAX_STARS) return false;
        p.starred[id] = 1; p.stars++;
        try { if (typeof addStars === "function") addStars(1); } catch (e) { /* لا شيء */ }
        return true;
    }
    /* تسجيل نتيجة نشاط آلي: f صحيح من أول مرة، s بعد تصحيح ذاتي، a بتلميح، r بعد عرض الحل */
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
        var star = false;
        if (res !== "r") star = giveStar(p, id);
        return star;
    }
    function groupOf(id) { for (var g = 0; g < GROUPS.length; g++) if (GROUPS[g].indexOf(id) >= 0) return g; return 0; }
    function groupAdvanced(p, g) {
        var ids = GROUPS[g], need = Math.ceil(ids.length * CFG.groupAdvanceRatio), n = 0;
        ids.forEach(function (id) { if (indep(p.syl[id]) >= 1) n++; });
        return n >= need;
    }
    function activeGroup(p) {
        for (var g = 0; g < GROUPS.length; g++) if (!groupAdvanced(p, g)) return g;
        return GROUPS.length - 1;
    }
    function approvedAll() { return SYL.filter(function (s) { return s.approved; }); }
    function audioStagesOpen() { return approvedAll().length >= CFG.minApprovedForAudioStages; }
    function testOpen() { return approvedAll().length >= CFG.test.mix.hear + CFG.test.mix.build; }
    function ids(list) { return list.map(function (s) { return s.id; }); }

    /* نطاق التدريب: المجموعة الحالية (افتراضي) أو سطر من الكتاب أو كل المقاطع.
       الأنشطة السمعية تحتاج ٣ مقاطع معتمدة على الأقل في النطاق، وإلا يتوسع النطاق تلقائيًا مع إظهار السبب */
    function scopeIds(p, scope) {
        if (scope === "all") return SYL.map(function (s) { return s.id; });
        if (/^g[0-4]$/.test(scope)) return GROUPS[+scope.charAt(1)].slice();
        return GROUPS[activeGroup(p)].slice();
    }
    function poolFor(p, scope, needAudio) {
        var pool = scopeIds(p, scope), note = "";
        if (needAudio) {
            var ok = function (list) { return list.filter(function (id) { return BYID[id].approved; }); };
            if (ok(pool).length < CFG.minApprovedForAudioStages) {
                var order = [], g0 = (scope === "all" || /^g/.test(scope)) ? 0 : activeGroup(p);
                for (var k = 0; k < GROUPS.length; k++) order.push((g0 + k) % GROUPS.length);
                var grown = pool.slice();
                for (var j = 0; j < order.length && ok(grown).length < CFG.minApprovedForAudioStages; j++) {
                    GROUPS[order[j]].forEach(function (id) { if (grown.indexOf(id) < 0) grown.push(id); });
                }
                if (grown.length > pool.length) note = "وُسِّع نطاق التدريب لأن الأصوات المعتمدة في السطر الحالي قليلة.";
                pool = grown;
            }
            pool = ok(pool);
        }
        return { pool: pool, note: note };
    }

    /* ---------- التشابه والمشتّتات (من مقاطع الصفحة فقط) ---------- */
    function famIndex(c) {
        for (var i = 0; i < D.FAMILIES.length; i++) if (D.FAMILIES[i].indexOf(c) >= 0) return i;
        return -1;
    }
    function letterSim(x, y) {
        if (x === y) return 2;
        var f = famIndex(x);
        return (f >= 0 && f === famIndex(y)) ? 1 : 0;
    }
    function simScore(A, B) { return letterSim(A.a.base, B.a.base) + letterSim(A.b.base, B.b.base); }
    function pickDistractors(target, n, level) {
        var T = BYID[target];
        var others = SYL.filter(function (s) { return s.id !== target; }).map(function (s) { return { id: s.id, sc: simScore(T, s) }; });
        var want = level <= 1 ? 0 : (level === 2 ? 2 : 3);
        others = shuffle(others);
        others.sort(function (x, y) { return Math.abs(x.sc - want) - Math.abs(y.sc - want); });
        var out = [];
        for (var i = 0; i < others.length && out.length < n; i++) out.push(others[i].id);
        return out;
    }
    /* ترتيب الخيارات: عشوائي، ومكان الصحيح لا يتكرر في آخر مرتين لمنع حفظ الموضع */
    function arrangeOptions(target, distract) {
        var all = [target].concat(distract), n = all.length;
        for (var tries = 0; tries < 12; tries++) {
            var arr = shuffle(all), pos = arr.indexOf(target);
            var l = S.lastPos;
            if (n > 1 && l.length >= 2 && l[l.length - 1] === pos && l[l.length - 2] === pos) continue;
            S.lastPos.push(pos); if (S.lastPos.length > 4) S.lastPos.shift();
            return arr;
        }
        return shuffle(all);
    }
    /* اختيار أهداف الجولة: المقاطع التي تحتاج مراجعة أولًا ثم الأقل نجاحًا في النشاط، دون تكرار متتالٍ */
    function pickTargets(p, pool, n, actKey) {
        var list = pool.map(function (id) {
            var r = p.syl[id];
            return { id: id, k: (needsReview(r) ? 0 : 1) * 100 + (r && r.act[actKey] ? r.act[actKey][0] : 0) * 10 + Math.random() };
        });
        list.sort(function (a, b) { return a.k - b.k; });
        var out = [], q = list.map(function (x) { return x.id; });
        while (out.length < n && q.length) {
            var next = q.shift();
            if (out.length && out[out.length - 1] === next && q.length) { q.push(next); continue; }
            out.push(next);
            if (!q.length && out.length < n) q = shuffle(pool.slice());
        }
        return out;
    }

    /* ---------- عرض المقطع (الحرفان في نص واحد متصل؛ ألوان وخطوط فقط بلا حشو) ---------- */
    function synEl(s, cls, colored) {
        var w = el("span", "wb2-syl" + (cls ? " " + cls : ""));
        w.setAttribute("dir", "rtl");
        w.setAttribute("lang", "ar");
        w.setAttribute("aria-label", "المقطع " + s.key);
        if (colored) {
            var a = el("span", "wb2-l1", s.a.ch);
            var b = el("span", "wb2-l2", s.b.ch + (s.shown.slice(-1) === D.TATWEEL ? D.TATWEEL : ""));
            a.setAttribute("aria-hidden", "true"); b.setAttribute("aria-hidden", "true");
            w.appendChild(a); w.appendChild(b);
        } else {
            var t = el("span", "wb2-plain", s.shown);
            t.setAttribute("aria-hidden", "true");
            w.appendChild(t);
        }
        return w;
    }
    function letterEl(ch, which) {
        var e = el("span", "wb2-letter " + which, ch);
        e.setAttribute("dir", "rtl"); e.setAttribute("lang", "ar");
        return e;
    }
    function btn(cls, text, fn) {
        var b = el("button", "wb2-btn " + (cls || ""), text);
        b.type = "button";
        if (fn) b.addEventListener("click", fn);
        return b;
    }
    var ICONS = {
        speaker: "<svg viewBox='0 0 24 24' width='28' height='28' aria-hidden='true'><path d='M4 9v6h4l5 4V5L8 9H4z' fill='currentColor'/><path d='M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg>",
        back: "<svg viewBox='0 0 24 24' width='24' height='24' aria-hidden='true'><path d='M9 5l7 7-7 7' fill='none' stroke='currentColor' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'/></svg>",
        star: "<svg viewBox='0 0 24 24' width='22' height='22' aria-hidden='true'><path d='M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2 6.3 20.3l1.2-6.4L2.8 9.5l6.4-.8z' fill='currentColor'/></svg>",
        check: "<svg viewBox='0 0 24 24' width='20' height='20' aria-hidden='true'><path d='M5 12.5l4.5 4.5L19 7.5' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/></svg>",
        lock: "<svg viewBox='0 0 24 24' width='20' height='20' aria-hidden='true'><rect x='5' y='11' width='14' height='9' rx='2' fill='currentColor'/><path d='M8 11V8a4 4 0 018 0v3' fill='none' stroke='currentColor' stroke-width='2'/></svg>"
    };
    function iconBtn(cls, icon, label, fn) {
        var b = el("button", "wb2-btn " + (cls || ""));
        b.type = "button"; b.innerHTML = icon + "<span>" + label + "</span>";
        if (fn) b.addEventListener("click", fn);
        return b;
    }

    /* ---------- الهيكل ---------- */
    function build() {
        var root = document.getElementById(SCREEN);
        if (!root) return false;
        if (S.built && root.querySelector("#wb2Body")) { S.root = root; return true; }
        root.innerHTML = "";
        root.classList.add("wb2");
        var hd = el("header", "wb2-head");
        var back = el("button", "wb2-back"); back.type = "button"; back.id = "wb2Back";
        back.innerHTML = ICONS.back + "<span>رجوع</span>";
        back.addEventListener("click", onBack);
        hd.appendChild(back);
        var ttl = el("div", "wb2-title");
        ttl.appendChild(el("strong", "", "الدرس الثاني — أقرأ حرفين مفتوحين"));
        var sub = el("span", "wb2-sub", ""); sub.id = "wb2Sub"; ttl.appendChild(sub);
        hd.appendChild(ttl);
        var st = el("div", "wb2-starbox"); st.id = "wb2Stars"; hd.appendChild(st);
        var tb = el("button", "wb2-teach"); tb.type = "button"; tb.id = "wb2Teacher";
        tb.innerHTML = ICONS.lock + "<span>المعلم</span>";
        tb.addEventListener("click", function () { gate(renderTeacher); });
        hd.appendChild(tb);
        root.appendChild(hd);
        var b = el("main", "wb2-body"); b.id = "wb2Body"; root.appendChild(b);
        var live = el("div", "wb2-live"); live.id = "wb2Live";
        live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
        root.appendChild(live); S.live = live;
        S.root = root; S.built = true;
        return true;
    }
    function refreshHead(sub) {
        var p = load();
        var sb = document.getElementById("wb2Stars");
        if (sb) { sb.innerHTML = ICONS.star + "<b>" + ar(p.stars) + "</b><span>من " + ar(MAX_STARS) + "</span>"; sb.setAttribute("aria-label", "النجوم " + p.stars + " من " + MAX_STARS); }
        var s = document.getElementById("wb2Sub");
        if (s && sub != null) s.textContent = sub;
    }
    function setView(v, sub) {
        S.view = v; S.session++; clearTimers(); stopAudio();
        refreshHead(sub);
        var b = body(); if (b) { b.innerHTML = ""; b.scrollTop = 0; }
        var b2 = document.getElementById("wb2Back");
        if (b2) b2.querySelector("span").textContent = (v === "home") ? "الكلمات" : "الرئيسية";
        try { window.scrollTo(0, 0); } catch (e) { /* لا شيء */ }
    }
    function onBack() {
        if (S.view === "home") { exitToWords(); } else { renderHome(); }
    }

    /* ---------- بوابة المعلم (رمز المعلم أو جمع عشوائي) ---------- */
    function teacherSession() { try { return (typeof teacherUnlockedSession !== "undefined") && !!teacherUnlockedSession; } catch (e) { return false; } }
    function relockSoon() {
        clearTimeout(S.gateTimer);
        S.gateTimer = setTimeout(function () { S.gate = false; }, 10 * 60 * 1000);
    }
    function gate(cb) {
        if (teacherSession() || S.gate) { S.gate = true; relockSoon(); cb(); return; }
        var prev = S.view;
        var pin = ""; try { pin = localStorage.getItem("taha_teacher_pin") || ""; } catch (e) { /* لا شيء */ }
        var x = 2 + Math.floor(Math.random() * 8), y = 2 + Math.floor(Math.random() * 8);
        var ov = el("div", "wb2-modal"); ov.id = "wb2Gate";
        ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
        var bx = el("div", "wb2-modal-box");
        bx.appendChild(el("h3", "", "للمعلم فقط"));
        bx.appendChild(el("p", "", pin ? "أدخل الرمز السري (٤ أرقام)" : ar(x) + " + " + ar(y) + " = ؟"));
        var inp = el("input", "wb2-input"); inp.type = "text"; inp.inputMode = "numeric"; inp.id = "wb2GateInput";
        inp.setAttribute("autocomplete", "off"); inp.setAttribute("aria-label", "إجابة المعلم");
        var err = el("div", "wb2-err");
        function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
        function tryIt() {
            var v = inp.value.trim().replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); });
            var good = pin ? v === pin : Number(v) === x + y;
            if (good) { S.gate = true; relockSoon(); close(); cb(); } else { err.textContent = "حاول مرة أخرى"; inp.value = ""; inp.focus(); }
        }
        var row = el("div", "wb2-row");
        row.appendChild(btn("main", "دخول", tryIt));
        row.appendChild(btn("ghost", "إلغاء", close));
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") tryIt(); if (e.key === "Escape") close(); });
        bx.appendChild(inp); bx.appendChild(err); bx.appendChild(row);
        ov.appendChild(bx); document.getElementById(SCREEN).appendChild(ov);
        setTimeout(function () { try { inp.focus(); } catch (e) { /* لا شيء */ } }, 50);
        void prev;
    }

    /* ---------- الاقتراح (توصية فقط، لا قفل) ---------- */
    function accuracy(p, k) {
        var tot = [0, 0];
        SYL.forEach(function (s) { var r = p.syl[s.id]; if (r && r.act[k]) { tot[0] += r.act[k][0]; tot[1] += r.act[k][1]; } });
        return tot;
    }
    function suggest(p) {
        var anyTouched = SYL.some(function (s) { return touched(p.syl[s.id]); });
        var g = activeGroup(p), gids = GROUPS[g];
        if (!anyTouched) return { stage: "discover", why: "ابدأ بالتعرّف على مقاطع السطر الأول." };
        var unseen = gids.filter(function (id) { var r = p.syl[id]; return !r || !r.seen; });
        if (unseen.length >= 2) return { stage: "discover", why: "ما زالت في السطر الحالي مقاطع لم تُكتشف بعد." };
        var rev = SYL.filter(function (s) { return needsReview(p.syl[s.id]); });
        if (rev.length >= 2) return { stage: "review", why: "عندك " + ar(rev.length) + " مقاطع تحتاج مراجعة." };
        var order = ["hear", "build", "decode"].filter(function (k) { return k !== "hear" || audioStagesOpen(); });
        var untried = order.filter(function (k) { return accuracy(p, k)[1] < 3; });
        if (untried.length) return { stage: untried[0], why: "لم تتدرّب كفاية على هذه المرحلة." };
        var low = order.map(function (k) { var a = accuracy(p, k); return { k: k, r: a[0] / a[1] }; }).sort(function (x, y) { return x.r - y.r; })[0];
        if (low && low.r < 0.7) return { stage: low.k, why: "هذه المرحلة تحتاج تقوية أكثر من غيرها." };
        var readDone = gids.filter(function (id) { var r = p.syl[id]; return r && r.read.att > 0; }).length;
        if (readDone < Math.min(3, gids.length)) return { stage: "read", why: "حان وقت قراءة المقاطع بصوتك." };
        if (testOpen() && !p.testStar) return { stage: "test", why: "جرّب تقييم الإتقان عندما تشعر أنك جاهز." };
        return { stage: "review", why: "راجع ما تعلّمته لتثبّته." };
    }

    /* ---------- الشاشة الرئيسية ---------- */
    function ring(done, total) {
        var R = 44, C = 2 * Math.PI * R, off = C * (1 - (total ? done / total : 0));
        return "<svg viewBox='0 0 110 110' width='104' height='104' role='img' aria-label='أتقنت " + done + " من " + total + "'>" +
            "<circle cx='55' cy='55' r='" + R + "' fill='none' stroke='var(--wb2-line)' stroke-width='10'/>" +
            "<circle cx='55' cy='55' r='" + R + "' fill='none' stroke='var(--wb2-primary)' stroke-width='10' stroke-linecap='round' stroke-dasharray='" + C.toFixed(1) + "' stroke-dashoffset='" + off.toFixed(1) + "' transform='rotate(-90 55 55)'/>" +
            "<text x='55' y='60' text-anchor='middle' font-size='26' font-weight='700' fill='var(--wb2-ink)'>" + ar(done) + "</text>" +
            "<text x='55' y='80' text-anchor='middle' font-size='12' fill='var(--wb2-mute)'>من " + ar(total) + "</text></svg>";
    }
    var GLYPH = { "new": "○", learning: "◐", review: "↻", mastered: "✔" };

    function renderHome() {
        setView("home", "اقرأ المقطع من حرفين مفتوحين");
        var p = load(), b = body();
        var sg = suggest(p);
        var masteredN = SYL.filter(function (s) { return stateOf(p, s.id) === "mastered"; }).length;
        var nApproved = approvedAll().length;

        var hero = el("section", "wb2-hero");
        var rg = el("div", "wb2-ring"); rg.innerHTML = ring(masteredN, SYL.length); hero.appendChild(rg);
        var ht = el("div", "wb2-hero-tx");
        ht.appendChild(el("h2", "", "أتعلّم دمج حرفين"));
        ht.appendChild(el("p", "", "أرى الحرفين، أسمع المقطع، ثم أقرؤه وحدي."));
        var sug = el("div", "wb2-suggest"); sug.id = "wb2Suggest";
        var sgS = STAGE_BY[sg.stage];
        sug.appendChild(el("span", "wb2-tag", "مقترح"));
        sug.appendChild(el("b", "", " " + sgS.title));
        sug.appendChild(el("span", "wb2-why", " — " + sg.why));
        ht.appendChild(sug);
        var go = btn("main big", "ابدأ: " + sgS.title, function () { openStage(sg.stage); });
        go.id = "wb2Go";
        ht.appendChild(go);
        hero.appendChild(ht);
        b.appendChild(hero);

        /* نطاق التدريب */
        var sc = el("div", "wb2-scope"); sc.id = "wb2Scope";
        sc.appendChild(el("span", "wb2-scope-l", "أتدرّب على:"));
        var opts = [["current", "السطر الحالي"], ["g0", "السطر ١"], ["g1", "٢"], ["g2", "٣"], ["g3", "٤"], ["g4", "٥"], ["all", "كل المقاطع"]];
        opts.forEach(function (o) {
            var c = el("button", "wb2-chip" + (S.scope === o[0] ? " on" : ""), o[1]);
            c.type = "button"; c.setAttribute("aria-pressed", S.scope === o[0] ? "true" : "false");
            c.addEventListener("click", function () { S.scope = o[0]; renderHome(); });
            sc.appendChild(c);
        });
        b.appendChild(sc);

        /* مسار المراحل */
        var path = el("ol", "wb2-path"); path.id = "wb2Path";
        STAGES.forEach(function (st) {
            var li = el("li", "wb2-node");
            var bt = el("button", "wb2-nodebtn" + (st.id === sg.stage ? " sug" : ""));
            bt.type = "button"; bt.setAttribute("data-stage", st.id);
            var disabledNote = "";
            if (st.id === "hear" && !audioStagesOpen()) disabledNote = "يحتاج " + ar(CFG.minApprovedForAudioStages) + " تسجيلات معتمدة";
            if (st.id === "test" && !testOpen()) disabledNote = "يحتاج تسجيلات معتمدة أكثر";
            bt.appendChild(el("span", "wb2-num", ar(st.n)));
            var tx = el("span", "wb2-ntx");
            tx.appendChild(el("b", "", st.title));
            tx.appendChild(el("small", "", disabledNote || st.how));
            bt.appendChild(tx);
            if (st.id === sg.stage) bt.appendChild(el("span", "wb2-tag sm", "مقترح"));
            if (disabledNote) bt.setAttribute("data-pending", "1");
            bt.addEventListener("click", function () { openStage(st.id); });
            li.appendChild(bt); path.appendChild(li);
        });
        b.appendChild(path);

        /* خريطة المقاطع (٢٥ خلية كما في الكتاب) */
        var gw = el("section", "wb2-mapw");
        var gh = el("div", "wb2-maph");
        gh.appendChild(el("h3", "", "مقاطع الكتاب"));
        var lg = el("span", "wb2-legend", "○ جديد · ◐ أتدرّب · ↻ أراجع · ✔ أتقنت");
        gh.appendChild(lg);
        gw.appendChild(gh);
        var grid = el("div", "wb2-grid"); grid.id = "wb2Grid";
        CELLS.forEach(function (id, ci) {
            var s = BYID[id], stt = stateOf(p, id);
            var c = el("button", "wb2-cell st-" + stt);
            c.type = "button"; c.setAttribute("data-id", id); c.setAttribute("data-cell", String(ci + 1));
            var dup = (ci + 1) === 19;
            if (dup) c.classList.add("dup");
            c.setAttribute("aria-label", "الخلية " + (ci + 1) + ": المقطع " + s.key + "، " + STATE_LABEL[stt] + (p.starred[id] ? "، له نجمة" : "") + (dup ? "، تكرار لمقطع في الخلية ١٥" : "") + (s.approved ? "" : "، تسجيله قيد الإعداد"));
            c.appendChild(synEl(s, "cellsyl", false));
            var meta = el("span", "wb2-cellm");
            meta.appendChild(el("i", "g", GLYPH[stt]));
            if (p.starred[id]) { var si = el("i", "s"); si.innerHTML = ICONS.star; meta.appendChild(si); }
            if (dup) meta.appendChild(el("i", "d", "="));
            c.appendChild(meta);
            c.addEventListener("click", function () { startDiscover([id]); });
            grid.appendChild(c);
        });
        gw.appendChild(grid);
        gw.appendChild(el("p", "wb2-note", nApproved >= SYL.length ? "كل التسجيلات معتمدة." : "تسجيلات معتمدة: " + ar(nApproved) + " من " + ar(SYL.length) + " — باقي المقاطع تُعرض بصريًا حتى تُعتمد تسجيلاتها."));
        b.appendChild(gw);
    }

    function openStage(id) {
        if (id === "discover") return startDiscover(null);
        if (id === "hear" || id === "build" || id === "decode") return startActivity(id);
        if (id === "read") return startRead(false);
        if (id === "test") return startTest();
        if (id === "review") return startReview();
    }

    /* ---------- المرحلة ١: أكتشف المقطع ---------- */
    function startDiscover(forced) {
        var p = load(), list;
        if (forced) list = forced.slice();
        else {
            var pool = scopeIds(p, S.scope);
            var unseen = pool.filter(function (id) { var r = p.syl[id]; return !r || !r.seen; });
            list = (unseen.length ? unseen : pool).slice(0, 3);
        }
        S.run = { type: "discover", list: list, i: 0, done: 0 };
        discoverOne();
    }
    function discoverOne() {
        var R = S.run, id = R.list[R.i], s = BYID[id];
        setView("discover", "أكتشف المقطع " + ar(R.i + 1) + " من " + ar(R.list.length));
        var b = body();
        var steps = ["الحرف الأول", "الحرف الثاني", "نجمعهما", "أسمع المقطع", "شكله النهائي"];
        var st = { n: 0 };
        var wrap = el("section", "wb2-disc"); wrap.id = "wb2Disc";
        var dots = el("ol", "wb2-steps");
        steps.forEach(function (t, i) { var li = el("li", "", t); li.setAttribute("data-i", String(i)); dots.appendChild(li); });
        wrap.appendChild(dots);
        var stage = el("div", "wb2-stage"); stage.id = "wb2Stage";
        wrap.appendChild(stage);
        var cap = el("p", "wb2-cap"); cap.id = "wb2Cap"; wrap.appendChild(cap);
        var acts = el("div", "wb2-row center"); acts.id = "wb2Acts"; wrap.appendChild(acts);
        b.appendChild(wrap);

        function mark() {
            Array.prototype.forEach.call(dots.children, function (li, i) {
                li.classList.toggle("on", i === st.n); li.classList.toggle("done", i < st.n);
                if (i === st.n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
            });
        }
        function listenBtn(label, fn) {
            var l = iconBtn("listen", ICONS.speaker, label, fn); l.id = "wb2Listen"; return l;
        }
        function show() {
            stage.innerHTML = ""; acts.innerHTML = ""; mark();
            var last = (st.n === steps.length - 1);
            if (st.n === 0 || st.n === 1) {
                var L = st.n === 0 ? s.a : s.b;
                var le = letterEl(L.ch, st.n === 0 ? "l1 big" : "l2 big");
                stage.appendChild(le);
                stage.appendChild(el("span", "wb2-badge", ar(st.n + 1)));
                cap.textContent = (st.n === 0 ? "هذا الحرف الأول: " : "هذا الحرف الثاني: ") + L.base + " مفتوحة";
                acts.appendChild(listenBtn("اسمع الحرف", function () { playKey(L.ch); }));
                say(cap.textContent);
            } else if (st.n === 2) {
                var pair = el("div", "wb2-pair"); pair.id = "wb2Pair";
                pair.appendChild(letterEl(s.a.ch, "l1 mid"));
                pair.appendChild(letterEl(s.b.ch, "l2 mid"));
                stage.appendChild(pair);
                cap.textContent = "الحرفان يقتربان من بعضهما ويصبحان مقطعًا واحدًا.";
                acts.appendChild(btn("ghost", "اجمعهما", function () { merge(pair, stage, s); }));
                if (reduced()) merge(pair, stage, s);
                else later(function () { merge(pair, stage, s); }, 500);
            } else if (st.n === 3) {
                stage.appendChild(synEl(s, "huge", true));
                var ap = s.approved;
                cap.textContent = ap ? "اسمع المقطع كاملًا، ثم كرّره بصوتك." : "تسجيل هذا المقطع قيد الإعداد؛ انظر إليه وأشر إلى الحرفين بالترتيب.";
                var lb = listenBtn(ap ? "اسمع المقطع" : "التسجيل قيد الإعداد", function () { playSyllable(s); });
                if (!ap) { lb.disabled = true; lb.setAttribute("aria-disabled", "true"); }
                acts.appendChild(lb);
            } else {
                stage.appendChild(synEl(s, "huge", true));
                cap.textContent = "هذا هو المقطع: " + s.a.base + " ثم " + s.b.base + ".";
            }
            if (st.n > 0) acts.appendChild(btn("ghost", "السابق", function () { st.n--; show(); }));
            acts.appendChild(btn("main", last ? (R.i + 1 < R.list.length ? "المقطع التالي" : "انتهيت") : "التالي", function () {
                if (!last) { st.n++; show(); return; }
                var pp = load(); var r = rec(pp, id); r.seen++; r.last = Date.now(); save(pp);
                R.done++;
                if (R.i + 1 < R.list.length) { R.i++; discoverOne(); } else discoverEnd();
            }));
        }
        show();
    }
    function merge(pair, stage, s) {
        if (!pair.parentNode || pair.classList.contains("joined")) return;
        pair.classList.add("joined");
        var done = function () {
            if (!pair.parentNode) return;
            stage.innerHTML = "";
            var j = synEl(s, "huge pop", true); stage.appendChild(j);
        };
        if (reduced()) done(); else later(done, 650);
    }
    function discoverEnd() {
        setView("discover-end", "أحسنت");
        var b = body(), R = S.run;
        var box = el("section", "wb2-end"); box.id = "wb2End";
        box.appendChild(el("h2", "", "اكتشفتَ " + ar(R.done) + (R.done === 1 ? " مقطعًا" : " مقاطع")));
        box.appendChild(el("p", "", "الآن جرّب أن تسمع وتختار، أو تبني المقطع بنفسك."));
        var row = el("div", "wb2-row center");
        row.appendChild(btn("main", "أسمع وأختار", function () { openStage(audioStagesOpen() ? "hear" : "build"); }));
        row.appendChild(btn("main", "أبني المقطع", function () { openStage("build"); }));
        row.appendChild(btn("ghost", "مقاطع أخرى", function () { startDiscover(null); }));
        row.appendChild(btn("ghost", "الرئيسية", renderHome));
        box.appendChild(row); b.appendChild(box);
    }

    /* ---------- إطار السؤال المشترك ---------- */
    function frame(R, subtitle) {
        var b = body(); b.innerHTML = "";
        var f = el("section", "wb2-q"); f.id = "wb2Q";
        var top = el("div", "wb2-qtop");
        var cnt = R.items.length;
        top.appendChild(el("span", "wb2-qn", "السؤال " + ar(R.i + 1) + " من " + ar(cnt)));
        var bar = el("div", "wb2-bar"); bar.setAttribute("role", "progressbar");
        bar.setAttribute("aria-valuemin", "0"); bar.setAttribute("aria-valuemax", String(cnt)); bar.setAttribute("aria-valuenow", String(R.i));
        var fl = el("i"); fl.style.width = Math.round(R.i * 100 / cnt) + "%"; bar.appendChild(fl);
        top.appendChild(bar);
        f.appendChild(top);
        var inst = el("h2", "wb2-inst", subtitle); inst.id = "wb2Inst"; f.appendChild(inst);
        var area = el("div", "wb2-area"); area.id = "wb2Area"; f.appendChild(area);
        var msg = el("p", "wb2-msg"); msg.id = "wb2Msg"; f.appendChild(msg);
        var acts = el("div", "wb2-row center wb2-qacts"); acts.id = "wb2QActs"; f.appendChild(acts);
        b.appendChild(f);
        return { box: f, area: area, msg: msg, acts: acts, inst: inst };
    }
    function setMsg(F, t) { F.msg.textContent = t; if (t) say(t); }

    /* ---------- تشغيل جلسة تدريب ---------- */
    function startActivity(type, opts) {
        var p = load(), pf = poolFor(p, S.scope, type === "hear"), items;
        if (type === "hear" && pf.pool.length < CFG.minApprovedForAudioStages) return blocked(type, pf.pool.length);
        if (opts && opts.items) items = opts.items;
        else items = pickTargets(p, pf.pool, CFG.sessionLength, type).map(function (id) { return { id: id, type: type }; });
        S.run = { type: type, items: items, i: 0, tally: { f: 0, s: 0, a: 0, r: 0, skip: 0 }, byType: {}, stars: 0, note: pf.note, mix: !!(opts && opts.mix), tok: 0 };
        nextQ();
    }
    function blocked(type, have) {
        setView("blocked", STAGE_BY[type].title);
        var b = body(), bx = el("section", "wb2-end"); bx.id = "wb2Blocked";
        bx.appendChild(el("h2", "", "هذه المرحلة متوقفة مؤقتًا"));
        bx.appendChild(el("p", "", "تحتاج " + ar(CFG.minApprovedForAudioStages) + " تسجيلات معتمدة على الأقل لتعمل بشكل صحيح (المتاح الآن: " + ar(have) + ")."));
        bx.appendChild(el("p", "wb2-note", "لا نستخدم صوتًا غير معتمد ولا نركّب المقطع من أصوات الحروف. جرّب المراحل البصرية في الأثناء."));
        var row = el("div", "wb2-row center");
        row.appendChild(btn("main", "أبني المقطع", function () { openStage("build"); }));
        row.appendChild(btn("main", "أميّز وأقرأ", function () { openStage("decode"); }));
        row.appendChild(btn("ghost", "الرئيسية", renderHome));
        bx.appendChild(row); b.appendChild(bx);
    }
    function nextQ() {
        var R = S.run;
        if (R.i >= R.items.length) return summary();
        var it = R.items[R.i], p = load();
        R.tok++;
        var ctx = { test: false, tok: R.tok, done: function (res, info) { finishQ(it, res, info); } };
        setViewKeep();
        if (it.type === "build") buildQ(it, p, ctx); else chooseQ(it, p, ctx);
    }
    function setViewKeep() { S.session++; clearTimers(); stopAudio(); S.view = "q"; refreshHead(STAGE_BY[S.run.type] ? STAGE_BY[S.run.type].title : "تدريب"); var b2 = document.getElementById("wb2Back"); if (b2) b2.querySelector("span").textContent = "الرئيسية"; }

    function finishQ(it, res, info) {
        var R = S.run, p = load();
        var key = it.type;
        if (key === "build" && !BYID[it.id].approved) key = "buildv";
        var star = logResult(p, it.id, key, res, info);
        save(p);
        R.tally[res]++; if (star) R.stars++;
        R.byType[it.type] = R.byType[it.type] || { good: 0, n: 0 };
        R.byType[it.type].n++; if (res === "f" || res === "s") R.byType[it.type].good++;
        refreshHead();
        var F = { box: document.getElementById("wb2Q"), msg: document.getElementById("wb2Msg"), acts: document.getElementById("wb2QActs") };
        var tok = R.tok, adv = false;
        function go() { if (adv || tok !== R.tok) return; adv = true; R.i++; nextQ(); }
        var ok = (res === "f" || res === "s");
        if (F.box) F.box.classList.add(ok ? "good" : "soft");
        if (F.msg) setMsg(F, ok ? (res === "f" ? "أحسنت! قرأتَه من أول مرة." : "أحسنت! صحّحتَ بنفسك.") + (star ? " ★ نجمة جديدة" : "") : (res === "a" ? "جيد، أخذتَ تلميحًا. سنراه مرة أخرى." : "تعرّفنا على المقطع. سنراه مرة أخرى للتثبيت."));
        if (res === "f") praise(); else if (res === "s") playKey("صحيح");
        if (F.acts) {
            F.acts.innerHTML = "";
            F.acts.appendChild(btn("main", R.i + 1 < R.items.length ? "التالي" : "النتيجة", go));
        }
        if (ok) later(go, reduced() ? 2200 : 1700);
    }

    /* ---------- أسمع وأختار / أميّز وأقرأ ---------- */
    function chooseQ(it, p, ctx) {
        var R = S.run, id = it.id, s = BYID[id], kind = it.type, test = ctx.test;
        var lv = test ? 2 : (p.lv[kind] || 1);
        var nOpt = lv <= 1 ? 2 : 3;
        var opts = arrangeOptions(id, pickDistractors(id, nOpt - 1, lv));
        var F = frame(R, kind === "hear" ? "اسمع ثم اختر المقطع الذي سمعتَه" : "اقرأ الحرفين ثم اختر المقطع المتصل");
        if (test) F.box.classList.add("test");
        var wrongs = 0, hinted = false, revealed = false, replays = 0, locked = false, audioFail = false;
        function playIt(first) {
            if (!first) replays++;
            var started = playSyllable(s, function (ok) {
                if (ok === false) { audioFail = true; setMsg(F, "تعذّر تشغيل الصوت الآن."); skipBtn(); }
            });
            if (!started) { audioFail = true; skipBtn(); }
        }
        function skipBtn() {
            if (F.acts.querySelector(".skip")) return;
            var sk = btn("ghost skip", "تخطَّ هذا السؤال", function () { if (locked) return; locked = true; R.tally.skip++; if (test) ctx.done("skip", {}); else { R.i++; nextQ(); } });
            F.acts.appendChild(sk);
        }
        if (kind === "hear") {
            var sp = iconBtn("listen xl", ICONS.speaker, "اسمع المقطع", function () { playIt(false); });
            sp.id = "wb2Listen"; F.area.appendChild(sp);
            if (!reduced()) later(function () { playIt(true); }, 350); else later(function () { playIt(true); }, 100);
        } else {
            var pair = el("div", "wb2-pair static"); pair.id = "wb2Pair";
            pair.appendChild(letterEl(s.a.ch, "l1 mid"));
            pair.appendChild(el("span", "wb2-plus", "+"));
            pair.appendChild(letterEl(s.b.ch, "l2 mid"));
            F.area.appendChild(pair);
        }
        var box = el("div", "wb2-opts n" + nOpt); box.id = "wb2Opts";
        var btns = {};
        opts.forEach(function (oid) {
            var o = BYID[oid];
            var ob = el("button", "wb2-opt"); ob.type = "button"; ob.setAttribute("data-id", oid);
            ob.appendChild(synEl(o, "optsyl", false));
            ob.addEventListener("click", function () { pick(oid, ob); });
            btns[oid] = ob; box.appendChild(ob);
        });
        F.area.appendChild(box);
        var helpB = null;
        function pick(oid, ob) {
            if (locked) return;
            if (oid === id) {
                locked = true; ob.classList.add("right");
                if (test) { ctx.done("ok", { }); return; }
                if (s.approved) later(function () { playSyllable(s); }, 150);
                var res = revealed ? "r" : (hinted ? "a" : (wrongs ? "s" : "f"));
                ctx.done(res, { wrongs: wrongs, replays: replays });
                return;
            }
            wrongs++;
            ob.classList.add("fade"); ob.disabled = true; ob.setAttribute("aria-disabled", "true");
            if (test) { locked = true; ctx.done("no", {}); return; }
            if (wrongs === 1) {
                setMsg(F, kind === "hear" ? "اسمع مرة أخرى وجرّب." : "اقرأ الحرف الأول ثم الثاني، وجرّب.");
                if (kind === "hear") later(function () { playIt(false); }, 250);
            } else if (!hinted) {
                hinted = true;
                setMsg(F, "تلميح: يبدأ المقطع بهذا الحرف.");
                var hl = letterEl(s.a.ch, "l1 hintl"); hl.id = "wb2Hint"; F.area.insertBefore(hl, box);
                playKey(s.a.ch);
            }
            if (!helpB) {
                helpB = btn("ghost", "ساعدني", function () {
                    if (locked || revealed) return;
                    revealed = true;
                    Object.keys(btns).forEach(function (k) { if (k !== id) btns[k].classList.add("fade"); });
                    btns[id].classList.add("reveal");
                    setMsg(F, "هذا هو المقطع الصحيح. اضغط عليه.");
                    if (s.approved) playIt(false); else void 0;
                });
                helpB.id = "wb2Help"; F.acts.appendChild(helpB);
            }
        }
        if (test) return;
    }

    /* ---------- أبني المقطع ---------- */
    function distractLetters(s, n) {
        var all = {};
        SYL.forEach(function (x) { all[x.a.base] = 1; all[x.b.base] = 1; });
        var cands = Object.keys(all).filter(function (c) { return c !== s.a.base && c !== s.b.base; });
        cands = shuffle(cands);
        cands.sort(function (x, y) {
            var sx = Math.max(letterSim(x, s.a.base), letterSim(x, s.b.base));
            var sy = Math.max(letterSim(y, s.a.base), letterSim(y, s.b.base));
            return sy - sx;
        });
        return cands.slice(0, n);
    }
    function buildQ(it, p, ctx) {
        var R = S.run, s = BYID[it.id], test = ctx.test, withAudio = !!s.approved;
        var F = frame(R, withAudio ? "اسمع المقطع ثم رتّب حرفيه" : "انظر إلى المقطع ثم ركّب حرفيه بالترتيب");
        if (test) F.box.classList.add("test");
        var wrongs = 0, hinted = false, revealed = false, locked = false, replays = 0;
        var letters = [s.a.base, s.b.base].concat(distractLetters(s, test ? 1 : 2));
        var tiles = shuffle(letters).map(function (c, i) {
            return { base: c, ch: c + D.FATHA, uid: "t" + i, slot: -1, el: null };
        });
        var slots = [null, null];
        if (withAudio) {
            var sp = iconBtn("listen", ICONS.speaker, "اسمع المقطع", function () { replays++; playSyllable(s); });
            sp.id = "wb2Listen"; F.area.appendChild(sp);
            later(function () { playSyllable(s); }, 350);
        } else if (!test) {
            var mdl = el("div", "wb2-model"); mdl.id = "wb2Model";
            mdl.appendChild(synEl(s, "modelsyl", false));
            F.area.appendChild(mdl);
        }
        var board = el("div", "wb2-board"); board.id = "wb2Board";
        var slotEls = [0, 1].map(function (i) {
            var se = el("button", "wb2-slot"); se.type = "button"; se.setAttribute("data-slot", String(i));
            se.setAttribute("aria-label", i === 0 ? "الخانة الأولى (الحرف الأول)" : "الخانة الثانية (الحرف الثاني)");
            se.appendChild(el("span", "wb2-slotn", ar(i + 1)));
            se.addEventListener("click", function () { if (!locked && slots[i]) release(i); });
            return se;
        });
        board.appendChild(slotEls[0]); board.appendChild(slotEls[1]);
        F.area.appendChild(board);
        var tray = el("div", "wb2-tray"); tray.id = "wb2Tray";
        tiles.forEach(function (t) {
            var te = el("button", "wb2-tile"); te.type = "button"; te.setAttribute("data-letter", t.base);
            te.setAttribute("aria-label", "الحرف " + t.base); te.textContent = t.ch;
            te.setAttribute("dir", "rtl"); te.setAttribute("lang", "ar");
            t.el = te;
            te.addEventListener("click", function () {
                if (S.dragged) { S.dragged = false; return; }
                if (locked || t.slot >= 0) return;
                var k = slots[0] ? (slots[1] ? -1 : 1) : 0;
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
                var old = se.querySelector(".wb2-slotl"); if (old) se.removeChild(old);
                if (t) { var l = el("span", "wb2-slotl " + (i === 0 ? "l1" : "l2"), t.ch); l.setAttribute("dir", "rtl"); se.appendChild(l); }
            });
            tiles.forEach(function (t) { t.el.classList.toggle("used", t.slot >= 0); t.el.disabled = t.slot >= 0 || locked; });
        }
        function place(t, k) {
            if (slots[k]) release(k);
            slots[k] = t; t.slot = k; paint(); check();
        }
        function release(k) { var t = slots[k]; if (!t) return; slots[k] = null; t.slot = -1; paint(); }
        function clearSlots() { release(0); release(1); }
        function check() {
            if (!slots[0] || !slots[1] || locked) return;
            var a = slots[0].base, b = slots[1].base;
            if (a === s.a.base && b === s.b.base) { good(); return; }
            wrongs++;
            if (test) { locked = true; ctx.done("no", {}); return; }
            var swapped = (a === s.b.base && b === s.a.base);
            slotEls.forEach(function (se) { se.classList.add("bad"); });
            setMsg(F, swapped ? "الحرفان صحيحان لكن الترتيب معكوس: الأول يأتي أولًا في الخانة ١." : "ليس هذا الترتيب. جرّب حرفًا آخر.");
            locked = true;
            later(function () {
                locked = false; slotEls.forEach(function (se) { se.classList.remove("bad"); }); clearSlots();
                if (wrongs >= 2 && !hinted) {
                    hinted = true;
                    var want = tiles.filter(function (t) { return t.base === s.a.base; })[0];
                    if (want) want.el.classList.add("hint");
                    setMsg(F, "تلميح: ابدأ بهذا الحرف في الخانة ١.");
                    playKey(s.a.ch);
                }
                paint();
            }, reduced() ? 1400 : 1100);
            if (!F.acts.querySelector("#wb2Help")) {
                var hb = btn("ghost", "ساعدني", reveal); hb.id = "wb2Help"; F.acts.appendChild(hb);
            }
        }
        function reveal() {
            if (revealed || (locked && !F.box.querySelector(".wb2-slot.bad"))) return;
            revealed = true; locked = true;
            clearSlots();
            var ta = tiles.filter(function (t) { return t.base === s.a.base; })[0], tb = tiles.filter(function (t) { return t.base === s.b.base; })[0];
            slotEls.forEach(function (se) { se.classList.remove("bad"); });
            slots[0] = ta; ta.slot = 0; slots[1] = tb; tb.slot = 1; paint();
            setMsg(F, "هكذا يُبنى المقطع: الحرف الأول ثم الثاني.");
            later(function () { good(); }, 700);
        }
        function good() {
            locked = true; paint();
            if (test) { ctx.done("ok", {}); return; }
            board.classList.add("joined");
            var join = function () {
                var j = synEl(s, "huge pop", true); j.id = "wb2Joined";
                board.innerHTML = ""; board.classList.add("done"); board.appendChild(j);
                tray.classList.add("gone");
                if (s.approved) playSyllable(s);
            };
            if (reduced()) join(); else later(join, 450);
            var res = revealed ? "r" : (hinted ? "a" : (wrongs ? "s" : "f"));
            later(function () { ctx.done(res, { wrongs: wrongs, replays: replays }); }, reduced() ? 100 : 900);
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
                    ghost = te.cloneNode(true); ghost.classList.add("wb2-ghost"); ghost.removeAttribute("id");
                    document.body.appendChild(ghost); te.classList.add("lifted");
                }
                ghost.style.left = e.clientX + "px"; ghost.style.top = e.clientY + "px";
                var under = document.elementFromPoint(e.clientX, e.clientY), sl = under && under.closest ? under.closest(".wb2-slot") : null;
                slotEls.forEach(function (se) { se.classList.toggle("over", se === sl); });
            });
            function end(e) {
                if (!active) return; active = false;
                try { te.releasePointerCapture(id); } catch (x) { /* لا شيء */ }
                if (ghost) {
                    S.dragged = true; setTimeout(function () { S.dragged = false; }, 50);
                    ghost.style.display = "none";
                    var under = document.elementFromPoint(e.clientX, e.clientY), sl = under && under.closest ? under.closest(".wb2-slot") : null;
                    if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
                    ghost = null; te.classList.remove("lifted");
                    slotEls.forEach(function (se) { se.classList.remove("over"); });
                    if (sl && !locked) place(t, +sl.getAttribute("data-slot"));
                }
            }
            te.addEventListener("pointerup", end);
            te.addEventListener("pointercancel", function (e) { if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost); ghost = null; te.classList.remove("lifted"); active = false; });
        }
        paint();
    }

    /* ---------- ملخص الجولة وتعديل المستوى ---------- */
    function summary() {
        var R = S.run, p = load();
        Object.keys(R.byType).forEach(function (k) {
            if (!(k in p.lv)) return;
            var o = R.byType[k], r = o.good / o.n;
            if (o.n >= 3 && r >= 0.8 && p.lv[k] < 3) p.lv[k]++;
            else if (o.n >= 3 && r <= 0.4 && p.lv[k] > 1) p.lv[k]--;
        });
        p.sessions++; save(p);
        setView("summary", "نتيجة الجولة");
        var b = body(), T = R.tally, total = R.items.length - T.skip;
        var bx = el("section", "wb2-end"); bx.id = "wb2Summary";
        bx.appendChild(el("h2", "", T.f + T.s === total && total ? "ممتاز، أنهيتَ الجولة" : "أنهيتَ الجولة"));
        var ul = el("ul", "wb2-stats");
        [["من أول مرة", T.f], ["بعد تصحيح ذاتي", T.s], ["بتلميح", T.a], ["بعد عرض الحل", T.r]].forEach(function (x) {
            var li = el("li"); li.appendChild(el("b", "", ar(x[1]))); li.appendChild(el("span", "", x[0])); ul.appendChild(li);
        });
        bx.appendChild(ul);
        bx.appendChild(el("p", "wb2-note", R.stars ? "حصلتَ على " + ar(R.stars) + (R.stars === 1 ? " نجمة جديدة" : " نجوم جديدة") + " لمقاطع نجحت فيها دون كشف الحل." : "النجوم تُمنح لكل مقطع مرة واحدة عند أول نجاح دون كشف الحل."));
        if (R.note) bx.appendChild(el("p", "wb2-note", R.note));
        if (T.skip) bx.appendChild(el("p", "wb2-note", "تخطّيتَ " + ar(T.skip) + " بسبب تعذّر تشغيل الصوت."));
        var row = el("div", "wb2-row center");
        var again = btn("main", "جولة جديدة", function () { if (R.mix) startReview(); else startActivity(R.type); });
        again.id = "wb2Again"; row.appendChild(again);
        var sg = suggest(load());
        row.appendChild(btn("main", "المقترح: " + STAGE_BY[sg.stage].title, function () { openStage(sg.stage); }));
        row.appendChild(btn("ghost", "الرئيسية", renderHome));
        bx.appendChild(row); b.appendChild(bx);
    }

    /* ---------- المراجعة ---------- */
    function startReview() {
        var p = load();
        var need = SYL.filter(function (s) { return needsReview(p.syl[s.id]); }).map(function (s) { return s.id; });
        if (!need.length) {
            setView("review-empty", "مراجعة");
            var bx = el("section", "wb2-end"); bx.id = "wb2ReviewEmpty";
            bx.appendChild(el("h2", "", "لا توجد مقاطع تحتاج مراجعة الآن"));
            bx.appendChild(el("p", "", "تابع التدرّب على مرحلة أخرى."));
            var row = el("div", "wb2-row center");
            row.appendChild(btn("main", "الرئيسية", renderHome));
            bx.appendChild(row); body().appendChild(bx);
            return;
        }
        var kinds = ["decode", "build"].concat(audioStagesOpen() ? ["hear"] : []);
        var picks = shuffle(need).slice(0, CFG.sessionLength);
        var items = picks.map(function (id, i) {
            var k = kinds[i % kinds.length];
            if (k === "hear" && !BYID[id].approved) k = "decode";
            return { id: id, type: k };
        });
        startActivity("review", { items: items, mix: true });
        S.run.type = "review";
    }

    /* ---------- المرحلة ٥: تحدي القراءة (تأكيد المعلم هو الدليل الوحيد) ---------- */
    function applyRead(p, id, ok) {
        var r = rec(p, id);
        r.read.att++; r.last = Date.now();
        if (ok) { r.read.ok++; r.read.last = "ok"; r.hist = (r.hist + "f").slice(-8); }
        else { r.read.sup++; r.read.last = "sup"; r.hist = (r.hist + "x").slice(-8); }
        return ok ? giveStar(p, id) : false;
    }
    function startRead() {
        var p = load(), pool = scopeIds(p, S.scope);
        var ids2 = pickTargets(p, pool, 5, "decode");
        S.run = { type: "read", items: ids2.map(function (id) { return { id: id, type: "read" }; }), i: 0, ok: 0, sup: 0, nores: 0, stars: 0, tok: 0 };
        readQ();
    }
    function readQ() {
        var R = S.run;
        if (R.i >= R.items.length) return readEnd();
        var s = BYID[R.items[R.i].id];
        R.tok++; var tok = R.tok;
        setViewKeep(); refreshHead("تحدي القراءة");
        var F = frame(R, "اقرأ المقطع بصوتك");
        F.area.appendChild(synEl(s, "huge", true));
        setMsg(F, "انظر إلى الحرفين ثم انطق المقطع كاملًا. لا يبدأ الصوت وحده.");
        var read = btn("main big", "قرأتُ", function () {
            read.disabled = true; F.acts.innerHTML = "";
            if (s.approved) F.acts.appendChild(iconBtn("listen", ICONS.speaker, "اسمع التسجيل", function () { playSyllable(s); }));
            else F.acts.appendChild(el("p", "wb2-note", "تسجيل هذا المقطع قيد الإعداد."));
            var tc = el("div", "wb2-tconf"); tc.id = "wb2TConf";
            tc.appendChild(el("span", "wb2-tconf-l", "تأكيد المعلم"));
            var okb = btn("main", "قرأ صحيحًا", function () { gate(function () { rate(true); }); }); okb.id = "wb2ReadOk";
            var nob = btn("ghost", "يحتاج تدريبًا", function () { gate(function () { rate(false); }); }); nob.id = "wb2ReadNo";
            var skb = btn("ghost", "بدون تقييم", function () { R.nores++; R.i++; readQ(); }); skb.id = "wb2ReadSkip";
            tc.appendChild(okb); tc.appendChild(nob); tc.appendChild(skb);
            F.acts.appendChild(tc);
            setMsg(F, "ضغط «قرأتُ» وحده لا يُحسب إتقانًا. المعلم يؤكد النطق.");
        });
        read.id = "wb2Read"; F.acts.appendChild(read);
        function rate(ok) {
            if (tok !== R.tok) return; R.tok++;
            var pp = load(); var star = applyRead(pp, s.id, ok); save(pp);
            if (ok) R.ok++; else R.sup++; if (star) R.stars++;
            refreshHead();
            R.i++; readQ();
        }
    }
    function readEnd() {
        var R = S.run;
        setView("summary", "تحدي القراءة");
        var b = body(), bx = el("section", "wb2-end"); bx.id = "wb2Summary";
        bx.appendChild(el("h2", "", "انتهى تحدي القراءة"));
        var ul = el("ul", "wb2-stats");
        [["قرأ صحيحًا (بتأكيد المعلم)", R.ok], ["يحتاج تدريبًا", R.sup], ["بدون تقييم", R.nores]].forEach(function (x) {
            var li = el("li"); li.appendChild(el("b", "", ar(x[1]))); li.appendChild(el("span", "", x[0])); ul.appendChild(li);
        });
        bx.appendChild(ul);
        if (R.stars) bx.appendChild(el("p", "wb2-note", "نجوم جديدة: " + ar(R.stars)));
        var row = el("div", "wb2-row center");
        row.appendChild(btn("main", "جولة جديدة", function () { startRead(); }));
        row.appendChild(btn("ghost", "الرئيسية", renderHome));
        bx.appendChild(row); b.appendChild(bx);
    }

    /* ---------- المرحلة ٦: تقييم الإتقان (٨ أسئلة، بلا مساعدة) ---------- */
    function startTest() {
        var p = load();
        if (!testOpen()) {
            setView("blocked", "تقييم الإتقان");
            var bx = el("section", "wb2-end"); bx.id = "wb2Blocked";
            bx.appendChild(el("h2", "", "التقييم متوقف مؤقتًا"));
            bx.appendChild(el("p", "", "يحتاج أسئلة سمعية وبناءً من تسجيلات معتمدة، والمتاح الآن أقل من المطلوب."));
            var row = el("div", "wb2-row center"); row.appendChild(btn("main", "الرئيسية", renderHome));
            bx.appendChild(row); body().appendChild(bx);
            return;
        }
        var ap = shuffle(ids(approvedAll())), all = shuffle(SYL.map(function (s) { return s.id; })), used = {};
        function take(list, n) {
            var out = [];
            for (var i = 0; i < list.length && out.length < n; i++) if (!used[list[i]]) { used[list[i]] = 1; out.push(list[i]); }
            for (var j = 0; j < list.length && out.length < n; j++) if (out.indexOf(list[j]) < 0) out.push(list[j]);
            return out;
        }
        var M = CFG.test.mix;
        var hear = take(ap, M.hear), bld = take(ap, M.build), dec = take(all, M.decode), rd = take(all, M.read);
        var items = [];
        for (var k = 0; k < 2; k++) {
            items.push({ id: hear[k], type: "hear" }); items.push({ id: dec[k], type: "decode" });
            items.push({ id: bld[k], type: "build" }); items.push({ id: rd[k], type: "read" });
        }
        S.run = { type: "test", items: items, i: 0, auto: 0, autoTotal: 0, skipped: 0, reads: [], tok: 0 };
        testQ();
    }
    function testQ() {
        var R = S.run;
        if (R.i >= R.items.length) return testEnd();
        var it = R.items[R.i], p = load();
        R.tok++; var tok = R.tok;
        setViewKeep(); refreshHead("تقييم الإتقان");
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
            var s = BYID[it.id], F = frame(R, "اقرأ المقطع بصوتك");
            F.box.classList.add("test");
            F.area.appendChild(synEl(s, "huge", true));
            setMsg(F, "انطق المقطع، ثم اضغط «قرأتُ». سيؤكد المعلم نطقك في النهاية.");
            var rb = btn("main big", "قرأتُ", function () { R.reads.push(it.id); nxt(); }); rb.id = "wb2Read";
            F.acts.appendChild(rb);
            return;
        }
        if (it.type === "build") buildQ(it, p, ctx); else chooseQ(it, p, ctx);
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
        if (t.readOk[k] === true || t.readOk[k] === false) return; /* تأكيد واحد لكل قراءة */
        t.readOk[k] = ok;
        applyRead(p, t.reads[k], ok);
        evalTest(t);
        if (t.status === "pass" && !p.testStar) {
            p.testStar = true; p.stars = Math.min(MAX_STARS, p.stars + 1);
            try { if (typeof addStars === "function") addStars(1); } catch (e) { /* لا شيء */ }
        }
        save(p);
    }
    function renderTestResult(idx, fromTeacher) {
        setView("test-result", "نتيجة التقييم");
        var p = load(), t = p.tests[idx], b = body();
        var bx = el("section", "wb2-end"); bx.id = "wb2TestResult";
        var head = el("h2", "");
        bx.appendChild(head);
        var info = el("p", "wb2-big", "الأسئلة الآلية: " + ar(t.auto) + " من " + ar(t.autoTotal) + " (المطلوب " + ar(CFG.test.passAuto) + " فأكثر)");
        bx.appendChild(info);
        if (t.status === "incomplete") {
            head.textContent = "لم يكتمل التقييم";
            bx.appendChild(el("p", "wb2-note", "تعذّر تشغيل صوت أحد الأسئلة، فلا يُحسب هذا التقييم. أعده لاحقًا."));
        } else {
            var rl = el("div", "wb2-reads"); rl.id = "wb2Reads";
            t.reads.forEach(function (rid, k) {
                var row = el("div", "wb2-readrow");
                row.appendChild(synEl(BYID[rid], "small", true));
                var v = t.readOk[k];
                if (v === true || v === false) row.appendChild(el("span", "wb2-tag " + (v ? "ok" : "no"), v ? "قرأ صحيحًا" : "يحتاج تدريبًا"));
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
                bx.appendChild(el("p", "wb2-note", "تُحسب القراءة بتأكيد المعلم فقط. لا نجمة قبل التأكيد."));
            } else if (t.status === "pass") {
                head.textContent = "نجحتَ في التقييم";
                bx.appendChild(el("p", "wb2-note", "نجمة الاختبار محسوبة مرة واحدة فقط."));
            } else {
                head.textContent = "نحتاج مزيدًا من التدريب";
                bx.appendChild(el("p", "wb2-note", "راجع المقاطع الصعبة ثم أعد التقييم متى شئت. لا يضيع شيء مما أنجزتَه."));
            }
        }
        var row2 = el("div", "wb2-row center");
        row2.appendChild(btn("main", "أعد التقييم", startTest));
        row2.appendChild(btn("ghost", fromTeacher ? "لوحة المعلم" : "الرئيسية", fromTeacher ? function () { renderTeacher(); } : renderHome));
        bx.appendChild(row2); b.appendChild(bx);
    }

    /* ---------- لوحة المعلم ---------- */
    function pct(a) { return a[1] ? Math.round(a[0] * 100 / a[1]) + "٪" : "—"; }
    function renderTeacher() {
        setView("teacher", "لوحة المعلم");
        var p = load(), b = body();
        var sec = el("section", "wb2-tp"); sec.id = "wb2TeacherPanel";
        var cnt = { "new": 0, learning: 0, review: 0, mastered: 0 };
        SYL.forEach(function (s) { cnt[stateOf(p, s.id)]++; });
        var h = el("div", "wb2-tsum");
        h.innerHTML = "<span>أتقن: <b>" + ar(cnt.mastered) + "</b>/" + ar(SYL.length) + "</span><span>يتدرّب: <b>" + ar(cnt.learning) + "</b></span><span>يراجع: <b>" + ar(cnt.review) + "</b></span><span>جديد: <b>" + ar(cnt["new"]) + "</b></span><span>النجوم: <b>" + ar(p.stars) + "</b>/" + ar(MAX_STARS) + "</span><span>الجولات: <b>" + ar(p.sessions) + "</b></span>";
        sec.appendChild(h);

        var ap = approvedAll();
        var au = el("div", "wb2-tbox"); au.id = "wb2AudioStatus";
        au.appendChild(el("h3", "", "حالة الصوت"));
        au.appendChild(el("p", "", "التسجيلات المعتمدة: " + ar(ap.length) + " من " + ar(SYL.length) + "."));
        var miss = SYL.filter(function (s) { return !s.approved; });
        au.appendChild(el("p", "wb2-note", (audioStagesOpen() ? "«أسمع وأختار» والأسئلة السمعية تعمل على المقاطع المعتمدة فقط. " : "«أسمع وأختار» متوقفة: يلزم " + ar(CFG.minApprovedForAudioStages) + " تسجيلات معتمدة. ") + (testOpen() ? "" : "التقييم متوقف لقلة التسجيلات. ") + "المراحل البصرية تعمل على كل المقاطع ولا تدّعي قياس المهارة السمعية."));
        if (miss.length) {
            var ml = el("div", "wb2-miss");
            ml.appendChild(el("span", "", "قيد التسجيل/الاعتماد: "));
            miss.forEach(function (s) { ml.appendChild(synEl(s, "tiny", false)); });
            au.appendChild(ml);
        }
        sec.appendChild(au);

        var ac = el("div", "wb2-tbox"); ac.id = "wb2ActStats";
        ac.appendChild(el("h3", "", "الأداء حسب النشاط (نجاح مستقل)"));
        var ul = el("ul", "wb2-acts");
        [["hear", "أسمع وأختار"], ["build", "أبني (مع الصوت)"], ["buildv", "أبني (نموذج بصري)"], ["decode", "أميّز وأقرأ"]].forEach(function (x) {
            var a = accuracy(p, x[0]);
            var li = el("li"); li.appendChild(el("span", "", x[1])); li.appendChild(el("b", "", a[1] ? ar(a[0]) + "/" + ar(a[1]) + " (" + pct(a) + ")" : "لم يُجرَّب")); ul.appendChild(li);
        });
        ac.appendChild(ul); sec.appendChild(ac);

        var tb = el("div", "wb2-tbox");
        tb.appendChild(el("h3", "", "المقاطع"));
        var tbl = el("table", "wb2-table"); tbl.id = "wb2Table";
        tbl.innerHTML = "<thead><tr><th>المقطع</th><th>الحالة</th><th>أول مرة</th><th>تصحيح</th><th>تلميح</th><th>كشف</th><th>أخطاء</th><th>القراءة</th></tr></thead>";
        var tbody = el("tbody");
        SYL.forEach(function (s) {
            var r = p.syl[s.id] || newRec(), st = stateOf(p, s.id);
            var tr = el("tr"); tr.setAttribute("data-id", s.id);
            var td = el("td"); td.appendChild(synEl(s, "tiny", false)); tr.appendChild(td);
            [STATE_LABEL[st] + (p.starred[s.id] ? " ★" : ""), ar(r.f), ar(r.s), ar(r.a), ar(r.r), ar(r.w), r.read.att ? (r.read.last === "ok" ? "مؤكدة" : "تحتاج تدريبًا") + " (" + ar(r.read.ok) + "/" + ar(r.read.att) + ")" : "—"].forEach(function (t) { tr.appendChild(el("td", "", t)); });
            tbody.appendChild(tr);
        });
        tbl.appendChild(tbody);
        var tw = el("div", "wb2-tablew"); tw.appendChild(tbl); tb.appendChild(tw); sec.appendChild(tb);

        var tt = el("div", "wb2-tbox"); tt.id = "wb2Tests";
        tt.appendChild(el("h3", "", "نتائج التقييم"));
        if (!p.tests.length) tt.appendChild(el("p", "wb2-note", "لم يُجرَ تقييم بعد."));
        var LBL = { pending: "بانتظار تأكيد المعلم", pass: "نجاح", fail: "يحتاج تدريبًا", incomplete: "غير مكتمل" };
        p.tests.forEach(function (t, i) {
            var row = el("div", "wb2-testrow");
            row.appendChild(el("span", "", new Date(t.t).toLocaleDateString("ar") + " — آلي " + ar(t.auto) + "/" + ar(t.autoTotal) + " — " + LBL[t.status]));
            row.appendChild(btn("ghost sm", "فتح", function () { renderTestResult(i, true); }));
            tt.appendChild(row);
        });
        sec.appendChild(tt);

        var rs = el("div", "wb2-row center");
        var rb = btn("ghost", "إعادة التدريب من البداية", function () {
            if (!window.confirm("تُعاد حالة المقاطع والمستويات، وتبقى النجوم المكتسبة. متابعة؟")) return;
            var q = load(); q.syl = {}; q.lv = { hear: 1, build: 1, decode: 1 }; save(q); renderTeacher();
        });
        rb.id = "wb2Reset"; rs.appendChild(rb);
        rs.appendChild(btn("main", "الرئيسية", renderHome));
        sec.appendChild(rs);
        b.appendChild(sec);
    }

    /* ---------- الدخول والخروج ---------- */
    function open() {
        if (!build()) return;
        try { if (window.taEnsureLessonAudio) window.taEnsureLessonAudio(); } catch (e) { /* بصمت */ }
        S.gate = false;
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
        var bt = document.getElementById("wbk2Entry");
        if (bt && !bt.getAttribute("data-wbk2-bound")) { bt.setAttribute("data-wbk2-bound", "1"); bt.addEventListener("click", open); }
        var q = null; try { q = new URLSearchParams(location.search).get("wbk2"); } catch (e) { /* لا شيء */ }
        if (q === "open") setTimeout(open, 900);
    }
    document.addEventListener("DOMContentLoaded", function () { setTimeout(bindEntry, 0); });
    if (document.readyState !== "loading") setTimeout(bindEntry, 0);

    window.wbk2Open = open;
    window.wbk2State = S; /* للاختبار */
    window.wbk2Internals = { load: load, save: save, rec: rec, logResult: logResult, stateOf: stateOf, giveStar: giveStar, suggest: suggest, playSyllable: playSyllable, playKey: playKey, needsReview: needsReview, mastered: mastered, applyRead: applyRead, confirmTest: confirmTest, poolFor: poolFor, pickDistractors: pickDistractors, KEY: KEY, MAX_STARS: MAX_STARS, renderHome: renderHome, startTest: startTest };
})();
