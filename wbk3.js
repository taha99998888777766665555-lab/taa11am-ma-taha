/* =========================================================================
   📙 الدرس الثالث «أقرأ كلمات جميع حروفها مفتوحة» — المنطق والواجهة (كتلة معزولة)
   المحتوى كله من wbk3-data.js (٢٥ كلمة فريدة من صفحة ٦ في الكتاب).
   - لا يعدّل الدرسين الأول والثاني ولا قسم الكلمات ولا script.js: يُحمَّل بعدها ويغلّف showScreen للتنظيف فقط.
   - المهارة: دمج تدريجي — الحرف الأول ← الحرفان الأول والثاني ← إضافة الثالث وقراءة الكلمة كاملة؛
     ثم الانتقال من المساعدة (نموذج بصري، تلميح) إلى القراءة المستقلة.
   - الصوت: تسجيل الكلمة الكامل المعتمد (مشغّل خاص)، ومقطع أول حرفين من الدرس الثاني إن كان معتمدًا،
     وأصوات الحروف والتشجيع المعتمدة من EduAudio. لا TTS، ولا تركيب كلمة أو مقطع من أصوات متفرقة.
     المقطع غير المعتمد أو غير الموجود في الدرس الثاني يُعرض دمجه بصريًا بدعم المعلم دون صوت.
   - التخزين: taha_wbk3_progress_v1 (لكل طالب تلقائيًا عبر StudentStore). لا يمسّ بيانات الدرسين الآخرين.
   - النجوم: نجمة واحدة لكل كلمة فريدة بعد نجاحين مستقلين (من أول مرة، بلا نموذج بصري ولا تلميح ولا كشف حل)
     في نشاطين مختلفين يكون أحدهما «أبني الكلمة» دون نموذج، أو بقراءة مستقلة (بلا مساعدة) يؤكدها المعلم + نجمة اختبار واحدة.
   - علامة الإتقان ✔: قراءة مستقلة مؤكدة من المعلم فقط. النجوم المكتسبة لا تُسحب عند إعادة التدريب ولا بالأخطاء.
   - إتقان القراءة يؤكده المعلم فقط؛ ضغط «قرأتُ» لا يُحسب دليلًا.
   ========================================================================= */
(function () {
    "use strict";

    var D = window.WBK3_DATA;
    if (!D) return;

    var KEY = "taha_wbk3_progress_v1";
    var SCREEN = "wbkL3";
    var SYL = D.WORDS, CFG = D.CONFIG, STAGES = D.STAGES, GROUPS = D.GROUPS, CELLS = D.CELLS;
    var BYID = {};
    SYL.forEach(function (s) { BYID[s.id] = s; });
    var PRAISE = ["أحسنت يا بطل", "أحسنت، عمل رائع", "صحيح"];
    var MAX_STARS = SYL.length + CFG.test.maxStars;
    var STAGE_BY = {};
    STAGES.forEach(function (s) { STAGE_BY[s.id] = s; });
    var ACT_KEYS = ["hear", "build", "buildm", "missing"];   /* buildm = بناء مع نموذج بصري (دعم لا دليل) */

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
    function body() { return document.getElementById("wb3Body"); }

    /* ---------- الصوت ---------- */
    var aud = null, audTok = 0;
    var TWO_PAIR = /^([ء-ي]َ){2,}$/;
    function stopAudio() {
        audTok++;
        if (aud) { try { aud.pause(); } catch (e) { /* لا شيء */ } aud.onended = aud.onerror = null; aud = null; }
        try { EduAudio.stop(); } catch (e) { /* لا شيء */ }
    }
    function playFile(file, done) {
        stopAudio();
        var tok = ++audTok;
        var a = new Audio(file);
        aud = a;
        a.onended = function () { if (tok === audTok) { aud = null; if (done) done(true); } };
        a.onerror = function () { if (tok === audTok) { aud = null; if (done) done(false); } };
        var pr = a.play();
        if (pr && pr.catch) pr.catch(function () { if (tok === audTok) { aud = null; if (done) done(false); } });
        return true;
    }
    /* تسجيل الكلمة الكاملة: للمعتمد فقط. يعيد true إن بدأ التشغيل */
    function playWord(w, done) {
        if (!w || !w.approved || !w.audio) { stopAudio(); if (done) done(false); return false; }
        return playFile(w.audio, done);
    }
    /* مقطع أول حرفين: من الدرس الثاني وبحالة اعتماده فقط */
    function playSyl(w, done) {
        if (!w || !w.sylApproved || !w.sylAudio) { stopAudio(); if (done) done(false); return false; }
        return playFile(w.sylAudio, done);
    }
    /* أصوات الحروف والتشجيع من EduAudio (مفاتيح مسجَّلة فقط). نص من حرفين بفتحة فأكثر يُرفض دائمًا */
    function playKey(key, done) {
        if (typeof key !== "string" || TWO_PAIR.test(key.replace(/ـ/g, ""))) { if (done) done(false); return false; }
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
        return { v: 1, stars: 0, starred: {}, testStar: false, sessions: 0, syl: {}, lv: { hear: 1, build: 1, missing: 1 }, tests: [], prefs: { tap: false } };
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
    /* أتقنت ✔: لا تُمنح إلا بقراءة مستقلة (بلا أي مساعدة) يؤكدها المعلم، وآخر قراءة هي المستقلة، ولا حاجة لمراجعة */
    function mastered(r) { return !!(r && r.read.last === "ok" && !needsReview(r)); }
    function stateOf(p, id) {
        var r = p.syl[id];
        if (!touched(r)) return "new";
        if (needsReview(r)) return "review";
        if (mastered(r)) return "mastered";
        return "learning";
    }
    var STATE_LABEL = { "new": "جديدة", learning: "أتدرّب", review: "أراجع", mastered: "أتقنت" };

    /* الأدلة المستقلة للنجمة: السمع والبناء (بلا نموذج بصري) وإكمال الحرف الناقص. البناء مع نموذج دعم لا دليل */
    var EVID_TYPES = { hear: "hear", build: "build", missing: "missing" };
    /* النجمة: مرة لكل كلمة فريدة؛ تُمرَّر لمجموع التطبيق */
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
        /* نجمة الإتقان: لا تُمنح من إجابة واحدة. الدليل = نجاح مستقل تمامًا (من أول مرة، بلا نموذج بصري
           ولا تلميح ولا كشف حل) في نشاط مختلف لكل دليل؛ نجمة = نجاحان في نشاطين مختلفين أحدهما «أبني الكلمة» دون نموذج.
           السمع والحرف الناقص وحدهما (وفيهما تخمين) لا يكفيان مهما تكرّرا.
           التصحيح الذاتي (s) والبناء مع نموذج (buildm) تقدّم لا دليل. (القراءة المستقلة المؤكدة تمنح النجمة في applyRead) */
        var star = false;
        if (res === "f") {
            var et = EVID_TYPES[type];
            if (et && r.ev.indexOf(et) < 0) r.ev.push(et);
            if (r.ev.length >= CFG.star.independentActivities && r.ev.indexOf("build") >= 0) star = giveStar(p, id);
        }
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

    /* نطاق التدريب: السطر الحالي (افتراضي) أو سطر من الكتاب أو كل الكلمات */
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

    /* ---------- التشابه والمشتّتات (من كلمات الصفحة فقط) ---------- */
    function famIndex(c) {
        for (var i = 0; i < D.FAMILIES.length; i++) if (D.FAMILIES[i].indexOf(c) >= 0) return i;
        return -1;
    }
    function letterSim(x, y) {
        if (x === y) return 2;
        var f = famIndex(x);
        return (f >= 0 && f === famIndex(y)) ? 1 : 0;
    }
    /* التشابه الموضعي: حرف مطابق في الموضع نفسه = ٢، من العائلة البصرية نفسها = ١ (المدى ٠–٦) */
    function simScore(A, B) { return letterSim(A.a.base, B.a.base) + letterSim(A.b.base, B.b.base) + letterSim(A.c.base, B.c.base); }
    function pickDistractors(target, n, level) {
        var T = BYID[target];
        var others = SYL.filter(function (s) { return s.id !== target; }).map(function (s) { return { id: s.id, sc: simScore(T, s) }; });
        var want = level <= 1 ? 0 : (level === 2 ? 2 : 4);
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
    /* اختيار أهداف الجولة: الكلمات التي تحتاج مراجعة أولًا ثم الأقل نجاحًا في النشاط، دون تكرار متتالٍ */
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

    /* ---------- عرض الكلمة (نص واحد متصل بلون واحد؛ الألوان في الحروف المنفصلة فقط) ---------- */
    function wordEl(s, cls) {
        var w = el("span", "wb3-syl" + (cls ? " " + cls : ""), s.shown);
        w.setAttribute("dir", "rtl"); w.setAttribute("lang", "ar"); w.setAttribute("role", "img");
        w.setAttribute("aria-label", "الكلمة " + s.key);
        return w;
    }
    function sylEl(s, cls) {
        var w = el("span", "wb3-syl" + (cls ? " " + cls : ""), s.sylShown);
        w.setAttribute("dir", "rtl"); w.setAttribute("lang", "ar"); w.setAttribute("role", "img");
        w.setAttribute("aria-label", "أول حرفين " + s.sylKey);
        return w;
    }
    function letterEl(ch, which) {
        var e = el("span", "wb3-letter " + which, ch);
        e.setAttribute("dir", "rtl"); e.setAttribute("lang", "ar");
        return e;
    }
    function btn(cls, text, fn) {
        var b = el("button", "wb3-btn " + (cls || ""), text);
        b.type = "button";
        if (fn) b.addEventListener("click", fn);
        return b;
    }
    var ICONS = {
        speaker: "<svg viewBox='0 0 24 24' width='28' height='28' aria-hidden='true'><path d='M4 9v6h4l5 4V5L8 9H4z' fill='currentColor'/><path d='M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg>",
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

    /* ---------- الهيكل ---------- */
    function build() {
        var root = document.getElementById(SCREEN);
        if (!root) return false;
        if (S.built && root.querySelector("#wb3Body")) { S.root = root; return true; }
        root.innerHTML = "";
        root.classList.add("wb3");
        var hd = el("header", "wb3-head");
        var back = el("button", "wb3-back"); back.type = "button"; back.id = "wb3Back";
        back.innerHTML = ICONS.back + "<span>رجوع</span>";
        back.addEventListener("click", onBack);
        hd.appendChild(back);
        var ttl = el("div", "wb3-title");
        ttl.appendChild(el("strong", "", "الدرس الثالث — أقرأ كلمات جميع حروفها مفتوحة"));
        var sub = el("span", "wb3-sub", ""); sub.id = "wb3Sub"; ttl.appendChild(sub);
        hd.appendChild(ttl);
        var st = el("div", "wb3-starbox"); st.id = "wb3Stars"; hd.appendChild(st);
        var tb = el("button", "wb3-teach"); tb.type = "button"; tb.id = "wb3Teacher";
        tb.innerHTML = ICONS.lock + "<span>المعلم</span>";
        tb.addEventListener("click", function () { gate(renderTeacher); });
        hd.appendChild(tb);
        root.appendChild(hd);
        var b = el("main", "wb3-body"); b.id = "wb3Body"; root.appendChild(b);
        var live = el("div", "wb3-live"); live.id = "wb3Live";
        live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
        root.appendChild(live); S.live = live;
        S.root = root; S.built = true;
        return true;
    }
    function refreshHead(sub) {
        var p = load();
        var sb = document.getElementById("wb3Stars");
        if (sb) { sb.innerHTML = ICONS.star + "<b>" + ar(p.stars) + "</b><span>من " + ar(MAX_STARS) + "</span>"; sb.setAttribute("aria-label", "النجوم " + p.stars + " من " + MAX_STARS); }
        var s = document.getElementById("wb3Sub");
        if (s && sub != null) s.textContent = sub;
    }
    function setView(v, sub) {
        S.view = v; S.session++; clearTimers(); stopAudio();
        refreshHead(sub);
        var b = body(); if (b) { b.innerHTML = ""; b.scrollTop = 0; }
        var b2 = document.getElementById("wb3Back");
        if (b2) b2.querySelector("span").textContent = (v === "home") ? "الكلمات" : "الرحلة";
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
        var pin = ""; try { pin = localStorage.getItem("taha_teacher_pin") || ""; } catch (e) { /* لا شيء */ }
        var x = 2 + Math.floor(Math.random() * 8), y = 2 + Math.floor(Math.random() * 8);
        var ov = el("div", "wb3-modal"); ov.id = "wb3Gate";
        ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
        var bx = el("div", "wb3-modal-box");
        bx.appendChild(el("h3", "", "للمعلم فقط"));
        bx.appendChild(el("p", "", pin ? "أدخل الرمز السري (٤ أرقام)" : ar(x) + " + " + ar(y) + " = ؟"));
        var inp = el("input", "wb3-input"); inp.type = "text"; inp.inputMode = "numeric"; inp.id = "wb3GateInput";
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
        SYL.forEach(function (s) { var r = p.syl[s.id]; if (r && r.act[k]) { tot[0] += r.act[k][0]; tot[1] += r.act[k][1]; } });
        return tot;
    }
    function suggest(p) {
        var anyTouched = SYL.some(function (s) { return touched(p.syl[s.id]); });
        var g = activeGroup(p), gids = GROUPS[g];
        if (!anyTouched) return { stage: "discover", why: "ابدأ بتهجّي كلمات السطر الأول ودمجها." };
        var unseen = gids.filter(function (id) { var r = p.syl[id]; return !r || !r.seen; });
        if (unseen.length >= 2) return { stage: "discover", why: "ما زالت في السطر الحالي كلمات لم تُدمَج بعد." };
        var rev = SYL.filter(function (s) { return needsReview(p.syl[s.id]); });
        if (rev.length >= 2) return { stage: "review", why: "عندك " + ar(rev.length) + " كلمات تحتاج مراجعة." };
        var order = ["build", "hear", "missing"].filter(function (k) { return k !== "hear" || audioStagesOpen(); });
        var untried = order.filter(function (k) { return accuracy(p, k)[1] + (k === "build" ? accuracy(p, "buildm")[1] : 0) < 3; });
        if (untried.length) return { stage: untried[0], why: "لم تتدرّب كفاية على هذه المرحلة." };
        var low = order.map(function (k) { var a = accuracy(p, k); return { k: k, r: a[1] ? a[0] / a[1] : 0 }; }).sort(function (x, y) { return x.r - y.r; })[0];
        if (low && low.r < 0.7) return { stage: low.k, why: "هذه المرحلة تحتاج تقوية أكثر من غيرها." };
        var readDone = gids.filter(function (id) { var r = p.syl[id]; return r && r.read.att > 0; }).length;
        if (readDone < Math.min(3, gids.length)) return { stage: "read", why: "حان وقت قراءة الكلمات بصوتك." };
        if (testOpen() && !p.testStar) return { stage: "test", why: "جرّب اختبار الإتقان عندما تشعر أنك جاهز." };
        return { stage: "review", why: "راجع ما تعلّمته لتثبّته." };
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
    var GLYPH = { "new": "○", learning: "◐", review: "↻", mastered: "✔" };

    /* حالة كل مرحلة بكلمات قصيرة تخدم قرار الطفل/المعلم */
    function stageStatus(p, id) {
        var seen = SYL.filter(function (s) { var r = p.syl[s.id]; return r && r.seen; }).length;
        if (id === "discover") return seen ? "دمجتَ " + ar(seen) + " من " + ar(SYL.length) : "لم تبدأ بعد";
        if (id === "hear" || id === "build" || id === "missing") {
            var a = accuracy(p, id);
            if (id === "build") { var v = accuracy(p, "buildm"); a = [a[0] + v[0], a[1] + v[1]]; }
            return a[1] ? "نجاح مستقل " + ar(Math.round(a[0] * 100 / a[1])) + "٪" : "لم تبدأ بعد";
        }
        if (id === "read") {
            var n = SYL.filter(function (s) { var r = p.syl[s.id]; return r && r.read.last === "ok"; }).length;
            return n ? "قراءة مستقلة مؤكدة: " + ar(n) : "لم تبدأ بعد";
        }
        if (id === "test") {
            var t = p.tests[p.tests.length - 1];
            if (!t) return "لم تُجرِ اختبارًا بعد";
            return ({ pending: "بانتظار تأكيد المعلم", pass: "نجحتَ", fail: "أعد المحاولة", incomplete: "غير مكتمل" })[t.status];
        }
        var rv = SYL.filter(function (s) { return needsReview(p.syl[s.id]); }).length;
        return rv ? ar(rv) + " كلمات للمراجعة" : "لا شيء للمراجعة الآن";
    }
    function scopeLabel() {
        if (S.scope === "all") return "كل الكلمات";
        if (/^g[0-4]$/.test(S.scope)) return "السطر " + ar(+S.scope.charAt(1) + 1);
        return "السطر الحالي";
    }

    function renderHome() {
        setView("home", "أقرأ كلمة من ثلاثة أحرف مفتوحة");
        var p = load(), b = body();
        var sg = suggest(p);
        var masteredN = SYL.filter(function (s) { return stateOf(p, s.id) === "mastered"; }).length;

        var top = el("section", "wb3-top");
        var rg = el("div", "wb3-ring"); rg.innerHTML = ring(masteredN, SYL.length); top.appendChild(rg);
        var tx = el("div", "wb3-top-tx");
        tx.appendChild(el("h2", "", "رحلتي في قراءة الكلمات"));
        tx.appendChild(el("p", "", "أتقنتُ " + ar(masteredN) + " من " + ar(SYL.length) + " كلمة"));
        top.appendChild(tx);
        var lib = btn("ghost", "مكتبة الكلمات", function () { renderLibrary(); }); lib.id = "wb3LibBtn";
        top.appendChild(lib);
        b.appendChild(top);

        var path = el("ol", "wb3-journey"); path.id = "wb3Path";
        STAGES.forEach(function (st) {
            var isSug = st.id === sg.stage;
            var li = el("li", "wb3-step" + (isSug ? " sug" : ""));
            li.appendChild(el("span", "wb3-num", ar(st.n)));
            var bt = el("button", "wb3-stepbtn"); bt.type = "button"; bt.setAttribute("data-stage", st.id);
            var note = "";
            if (st.id === "hear" && !audioStagesOpen()) note = "يحتاج " + ar(CFG.minApprovedForAudioStages) + " تسجيلات معتمدة";
            if (st.id === "test" && !testOpen()) note = "يحتاج تسجيلات معتمدة أكثر";
            var t = el("span", "wb3-stx");
            var h = el("b", "", st.title); t.appendChild(h);
            t.appendChild(el("small", "", st.how));
            if (note) t.appendChild(el("em", "wb3-st", note));
            bt.appendChild(t);
            if (isSug) {
                t.insertBefore(el("span", "wb3-tag", "الخطوة المقترحة"), h);
                var go = el("span", "wb3-gobtn", "ابدأ"); go.id = "wb3Go"; bt.appendChild(go);
            } else bt.appendChild(el("span", "wb3-chev", "‹"));
            if (note) bt.setAttribute("data-pending", "1");
            bt.addEventListener("click", function () { openStage(st.id); });
            li.appendChild(bt); path.appendChild(li);
        });
        b.appendChild(path);

        var det = el("details", "wb3-scopebox"); det.id = "wb3ScopeBox";
        det.appendChild(el("summary", "", "نطاق التدريب: " + scopeLabel()));
        var sc = el("div", "wb3-scope"); sc.id = "wb3Scope";
        [["current", "السطر الحالي"], ["g0", "السطر ١"], ["g1", "٢"], ["g2", "٣"], ["g3", "٤"], ["g4", "٥"], ["all", "كل الكلمات"]].forEach(function (o) {
            var c = el("button", "wb3-chip" + (S.scope === o[0] ? " on" : ""), o[1]);
            c.type = "button"; c.setAttribute("aria-pressed", S.scope === o[0] ? "true" : "false");
            c.addEventListener("click", function () { S.scope = o[0]; renderHome(); });
            sc.appendChild(c);
        });
        det.appendChild(sc);
        b.appendChild(det);
        var nApproved = approvedAll().length;
        b.appendChild(el("p", "wb3-note", nApproved >= SYL.length ? "كل تسجيلات الكلمات معتمدة." : "تسجيلات معتمدة: " + ar(nApproved) + " من " + ar(SYL.length) + ". باقي الكلمات تُعرض بصريًا حتى تُعتمد تسجيلاتها."));
    }

    /* ---------- مكتبة الكلمات (٢٥ خانة كما في الكتاب) ---------- */
    function renderLibrary() {
        setView("library", "مكتبة الكلمات");
        var p = load(), b = body();
        var gw = el("section", "wb3-mapw");
        var gh = el("div", "wb3-maph");
        gh.appendChild(el("h2", "", "كلمات الكتاب"));
        gh.appendChild(el("span", "wb3-legend", "○ جديدة · ◐ أتدرّب · ↻ أراجع · ✔ أتقنت · اختر كلمة لتتهجّاها"));
        gw.appendChild(gh);
        var grid = el("div", "wb3-grid"); grid.id = "wb3Grid";
        CELLS.forEach(function (id, ci) {
            var s = BYID[id], stt = stateOf(p, id);
            var c = el("button", "wb3-cell st-" + stt);
            c.type = "button"; c.setAttribute("data-id", id); c.setAttribute("data-cell", String(ci + 1));
            c.setAttribute("aria-label", "الكلمة " + (ci + 1) + ": " + s.key + "، " + STATE_LABEL[stt] + (p.starred[id] ? "، لها نجمة إتقان" : ((p.syl[id] && p.syl[id].ev && p.syl[id].ev.length === 1) ? "، نجاح مستقل واحد" : "")));
            c.appendChild(wordEl(s, "cellsyl"));
            var meta = el("span", "wb3-cellm");
            meta.appendChild(el("i", "g", GLYPH[stt]));
            if (p.starred[id]) { var si = el("i", "s"); si.innerHTML = ICONS.star; meta.appendChild(si); }
            else if (p.syl[id] && p.syl[id].ev && p.syl[id].ev.length === 1) { var hi = el("i", "h", "☆"); hi.title = "نجاح مستقل واحد"; meta.appendChild(hi); }
            c.appendChild(meta);
            c.addEventListener("click", function () { startDiscover([id]); });
            grid.appendChild(c);
        });
        gw.appendChild(grid);
        gw.appendChild(el("p", "wb3-note", "الكلمات الخمس والعشرون بترتيب الكتاب من اليمين إلى اليسار." + (approvedAll().length >= SYL.length ? "" : " تسجيلات معتمدة: " + ar(approvedAll().length) + " من " + ar(SYL.length) + ".")));
        b.appendChild(gw);
    }

    function openStage(id) {
        if (id === "discover") return startDiscover(null);
        if (id === "hear" || id === "build" || id === "missing") return startActivity(id);
        if (id === "read") return startRead();
        if (id === "test") return startTest();
        if (id === "review") return startReview();
    }

    /* ---------- المرحلة ١: أتهجّى وأدمج (دمج تدريجي: حرف ← حرفان ← الكلمة) ---------- */
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
        setView("discover", "أتهجّى الكلمة " + ar(R.i + 1) + " من " + ar(R.list.length));
        var b = body();
        var steps = ["الحرف الأول", "الحرف الثاني", "ندمج الحرفين", "نضيف الثالث", "نقرأ الكلمة"];
        var st = { n: 0 };
        var wrap = el("section", "wb3-disc"); wrap.id = "wb3Disc";
        var dots = el("ol", "wb3-steps");
        steps.forEach(function (t, i) {
            var li = el("li", ""); li.setAttribute("data-i", String(i));
            var sb = el("button", "wb3-stepdot"); sb.type = "button"; sb.setAttribute("data-i", String(i));
            sb.setAttribute("aria-label", "الخطوة " + (i + 1) + ": " + t);
            sb.appendChild(el("span", "wb3-sdn", ar(i + 1)));
            sb.appendChild(el("span", "wb3-sdt", t));
            sb.addEventListener("click", function () { if (st.n !== i) { st.n = i; show(); } });
            li.appendChild(sb); dots.appendChild(li);
        });
        wrap.appendChild(dots);
        var stage = el("div", "wb3-stage"); stage.id = "wb3Stage";
        wrap.appendChild(stage);
        var cap = el("p", "wb3-cap"); cap.id = "wb3Cap"; wrap.appendChild(cap);
        var acts = el("div", "wb3-row center"); acts.id = "wb3Acts"; wrap.appendChild(acts);
        b.appendChild(wrap);

        function mark() {
            Array.prototype.forEach.call(dots.children, function (li, i) {
                li.classList.toggle("on", i === st.n); li.classList.toggle("done", i < st.n);
                if (i === st.n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
            });
        }
        function listenBtn(label, fn) {
            var l = iconBtn("listen", ICONS.speaker, label, fn); l.id = "wb3Listen"; return l;
        }
        function show() {
            stage.innerHTML = ""; acts.innerHTML = ""; mark();
            var last = (st.n === steps.length - 1);
            if (st.n === 0 || st.n === 1) {
                var L = st.n === 0 ? s.a : s.b;
                stage.appendChild(letterEl(L.ch, st.n === 0 ? "l1 big" : "l2 big"));
                stage.appendChild(el("span", "wb3-badge", ar(st.n + 1)));
                cap.textContent = (st.n === 0 ? "هذا الحرف الأول: " : "هذا الحرف الثاني: ") + L.base + " مفتوحة";
                acts.appendChild(listenBtn("اسمع الحرف", function () { playKey(L.ch); }));
                say(cap.textContent);
            } else if (st.n === 2) {
                /* دمج الحرفين الأول والثاني في مقطع */
                var pair = el("div", "wb3-pair"); pair.id = "wb3Pair";
                pair.appendChild(letterEl(s.a.ch, "l1 mid"));
                pair.appendChild(letterEl(s.b.ch, "l2 mid"));
                stage.appendChild(pair);
                var hs = s.sylApproved;
                cap.textContent = hs ? "الحرفان الأول والثاني يقتربان ويصبحان مقطعًا واحدًا. اسمعه ثم كرّره."
                    : "الحرفان الأول والثاني يقتربان ويصبحان مقطعًا واحدًا. المعلم يقرؤه معك (لا تسجيل معتمد لهذا المقطع).";
                acts.appendChild(btn("ghost", "ادمجهما", function () { merge(pair, stage, s); }));
                if (hs) { var lb2 = listenBtn("اسمع المقطع", function () { playSyl(s); }); lb2.id = "wb3ListenSyl"; acts.appendChild(lb2); }
                if (reduced()) merge(pair, stage, s);
                else later(function () { merge(pair, stage, s); }, 500);
            } else if (st.n === 3) {
                /* إضافة الحرف الثالث إلى المقطع */
                var row3 = el("div", "wb3-pair static"); row3.id = "wb3Add";
                row3.appendChild(letterEl(s.c.ch, "l3 mid"));
                row3.appendChild(el("span", "wb3-plus", "+"));
                row3.appendChild(sylEl(s, "pairsyl"));
                stage.appendChild(row3);
                cap.textContent = "نضيف الحرف الثالث: " + s.c.base + " مفتوحة، بعد المقطع.";
                acts.appendChild(listenBtn("اسمع الحرف الثالث", function () { playKey(s.c.ch); }));
            } else {
                stage.appendChild(wordEl(s, "huge"));
                var ap = s.approved;
                cap.textContent = ap ? "اقرأ الكلمة كاملة بصوتك، ثم اسمع التسجيل." : "تسجيل هذه الكلمة قيد الإعداد؛ اقرأها بالترتيب من اليمين.";
                var lb = listenBtn(ap ? "اسمع الكلمة" : "التسجيل قيد الإعداد", function () { playWord(s); });
                if (!ap) { lb.disabled = true; lb.setAttribute("aria-disabled", "true"); }
                acts.appendChild(lb);
            }
            if (st.n > 0) acts.appendChild(btn("ghost big", "السابق", function () { st.n--; show(); }));
            acts.appendChild(btn("main big", last ? (R.i + 1 < R.list.length ? "الكلمة التالية" : "انتهيت") : "التالي", function () {
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
            stage.appendChild(sylEl(s, "huge pop"));
        };
        if (reduced()) done(); else later(done, 650);
    }
    function discoverEnd() {
        setView("discover-end", "أحسنت");
        var b = body(), R = S.run;
        var box = el("section", "wb3-end"); box.id = "wb3End";
        box.appendChild(el("h2", "", "تهجّيتَ " + ar(R.done) + (R.done === 1 ? " كلمة" : " كلمات")));
        box.appendChild(el("p", "", "الآن جرّب أن تبني الكلمة بنفسك، أو تسمعها وتختار شكلها."));
        var row = el("div", "wb3-row center");
        row.appendChild(btn("main", "أبني الكلمة", function () { openStage("build"); }));
        row.appendChild(btn("main", "أسمع وأختار", function () { openStage(audioStagesOpen() ? "hear" : "missing"); }));
        row.appendChild(btn("ghost", "كلمات أخرى", function () { startDiscover(null); }));
        row.appendChild(btn("ghost", "الرئيسية", renderHome));
        box.appendChild(row); b.appendChild(box);
    }

    /* ---------- إطار السؤال المشترك ---------- */
    function frame(R, subtitle) {
        var b = body(); b.innerHTML = "";
        var f = el("section", "wb3-q"); f.id = "wb3Q";
        var top = el("div", "wb3-qtop");
        var cnt = R.items.length;
        top.appendChild(el("span", "wb3-qn", "السؤال " + ar(R.i + 1) + " من " + ar(cnt)));
        var bar = el("div", "wb3-bar"); bar.setAttribute("role", "progressbar");
        bar.setAttribute("aria-valuemin", "0"); bar.setAttribute("aria-valuemax", String(cnt)); bar.setAttribute("aria-valuenow", String(R.i));
        var fl = el("i"); fl.style.width = Math.round(R.i * 100 / cnt) + "%"; bar.appendChild(fl);
        top.appendChild(bar);
        f.appendChild(top);
        var inst = el("h2", "wb3-inst", subtitle); inst.id = "wb3Inst"; f.appendChild(inst);
        var area = el("div", "wb3-area"); area.id = "wb3Area"; f.appendChild(area);
        var msg = el("p", "wb3-msg"); msg.id = "wb3Msg"; f.appendChild(msg);
        var acts = el("div", "wb3-row center wb3-qacts"); acts.id = "wb3QActs"; f.appendChild(acts);
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
        var b = body(), bx = el("section", "wb3-end"); bx.id = "wb3Blocked";
        bx.appendChild(el("h2", "", "هذه المرحلة متوقفة مؤقتًا"));
        bx.appendChild(el("p", "", "تحتاج " + ar(CFG.minApprovedForAudioStages) + " تسجيلات معتمدة على الأقل لتعمل بشكل صحيح (المتاح الآن: " + ar(have) + ")."));
        bx.appendChild(el("p", "wb3-note", "لا نستخدم صوتًا غير معتمد ولا نركّب الكلمة من أصوات متفرقة. جرّب المراحل البصرية في الأثناء."));
        var row = el("div", "wb3-row center");
        row.appendChild(btn("main", "أبني الكلمة", function () { openStage("build"); }));
        row.appendChild(btn("main", "أي حرف ينقص؟", function () { openStage("missing"); }));
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
        if (it.type === "build") buildQ(it, p, ctx); else if (it.type === "missing") missingQ(it, p, ctx); else chooseQ(it, p, ctx);
    }
    function setViewKeep() { S.session++; clearTimers(); stopAudio(); S.view = "q"; refreshHead(STAGE_BY[S.run.type] ? STAGE_BY[S.run.type].title : "تدريب"); var b2 = document.getElementById("wb3Back"); if (b2) b2.querySelector("span").textContent = "الرئيسية"; }

    function finishQ(it, res, info) {
        var R = S.run, p = load();
        var key = it.type;
        if (key === "build" && it.model) key = "buildm";   /* بناء مع نموذج بصري: دعم لا دليل */
        var star = logResult(p, it.id, key, res, info);
        save(p);
        R.tally[res]++; if (star) R.stars++;
        R.byType[it.type] = R.byType[it.type] || { good: 0, n: 0 };
        R.byType[it.type].n++; if (res === "f" || res === "s") R.byType[it.type].good++;
        refreshHead();
        var F = { box: document.getElementById("wb3Q"), msg: document.getElementById("wb3Msg"), acts: document.getElementById("wb3QActs") };
        var tok = R.tok, adv = false;
        function go() { if (adv || tok !== R.tok) return; adv = true; R.i++; nextQ(); }
        var ok = (res === "f" || res === "s");
        if (F.box) F.box.classList.add(ok ? "good" : "soft");
        var supported = (key === "buildm");
        if (F.msg) setMsg(F, ok ? (res === "f" ? (supported ? "أحسنت! بنيتَ الكلمة بمساعدة النموذج." : "أحسنت! أصبتَ من أول مرة.") : "أحسنت! صحّحتَ بنفسك.") + (star ? " ★ نجمة إتقان لهذه الكلمة" : "") : (res === "a" ? "جيد، أخذتَ تلميحًا. سنراها مرة أخرى." : "تعرّفنا على الكلمة. سنراها مرة أخرى للتثبيت."));
        if (res === "f") praise(); else if (res === "s") playKey("صحيح");
        if (F.acts) {
            F.acts.innerHTML = "";
            F.acts.appendChild(btn("main", R.i + 1 < R.items.length ? "التالي" : "النتيجة", go));
        }
        if (ok) later(go, reduced() ? 2200 : 1700);
    }

    /* ---------- أسمع وأختار الكلمة ---------- */
    function chooseQ(it, p, ctx) {
        var R = S.run, id = it.id, s = BYID[id], test = ctx.test;
        var lv = test ? 2 : (p.lv.hear || 1);
        var nOpt = lv <= 1 ? 2 : 3;
        var opts = arrangeOptions(id, pickDistractors(id, nOpt - 1, lv));
        var F = frame(R, "اسمع ثم اختر الكلمة التي سمعتَها");
        if (test) F.box.classList.add("test");
        var wrongs = 0, hinted = false, revealed = false, replays = 0, locked = false;
        function playIt(first) {
            if (!first) replays++;
            var started = playWord(s, function (ok) {
                if (ok === false) { setMsg(F, "تعذّر تشغيل الصوت الآن."); skipBtn(); }
            });
            if (!started) skipBtn();
        }
        function skipBtn() {
            if (F.acts.querySelector(".skip")) return;
            var sk = btn("ghost skip", "تخطَّ هذا السؤال", function () { if (locked) return; locked = true; R.tally.skip++; if (test) ctx.done("skip", {}); else { R.i++; nextQ(); } });
            F.acts.appendChild(sk);
        }
        var sp = iconBtn("listen xl", ICONS.speaker, "اسمع", function () { playIt(false); }); sp.setAttribute("aria-label", "اسمع الكلمة");
        sp.id = "wb3Listen"; F.area.appendChild(sp);
        later(function () { playIt(true); }, reduced() ? 100 : 350);
        var box = el("div", "wb3-opts n" + nOpt); box.id = "wb3Opts";
        var btns = {};
        opts.forEach(function (oid) {
            var o = BYID[oid];
            var ob = el("button", "wb3-opt"); ob.type = "button"; ob.setAttribute("data-id", oid);
            ob.appendChild(wordEl(o, "optsyl"));
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
                later(function () { playWord(s); }, 150);
                var res = revealed ? "r" : (hinted ? "a" : (wrongs ? "s" : "f"));
                ctx.done(res, { wrongs: wrongs, replays: replays });
                return;
            }
            wrongs++;
            ob.classList.add("fade"); ob.disabled = true; ob.setAttribute("aria-disabled", "true");
            if (test) { locked = true; ctx.done("no", {}); return; }
            if (wrongs === 1) {
                setMsg(F, "اسمع مرة أخرى، وانظر إلى الحروف الثلاثة بالترتيب.");
                later(function () { playIt(false); }, 250);
            } else if (!hinted) {
                hinted = true;
                setMsg(F, "تلميح: تبدأ الكلمة بهذا الحرف.");
                var hl = letterEl(s.a.ch, "l1 hintl"); hl.id = "wb3Hint"; F.area.insertBefore(hl, box);
                playKey(s.a.ch);
            }
            if (!helpB) {
                helpB = btn("ghost", "ساعدني", function () {
                    if (locked || revealed) return;
                    revealed = true;
                    Object.keys(btns).forEach(function (k) { if (k !== id) btns[k].classList.add("fade"); });
                    btns[id].classList.add("reveal");
                    setMsg(F, "هذه هي الكلمة الصحيحة. اضغط عليها.");
                    playIt(false);
                });
                helpB.id = "wb3Help"; F.acts.appendChild(helpB);
            }
        }
    }

    /* ---------- أي حرف ينقص؟ (قراءة بصرية للحرفين الظاهرين، والصوت لا يبدأ وحده) ---------- */
    function letterChoices(s, missIdx, n, level) {
        var target = [s.a, s.b, s.c][missIdx].base;
        var inWord = { }; inWord[s.a.base] = 1; inWord[s.b.base] = 1; inWord[s.c.base] = 1;
        var all = {};
        SYL.forEach(function (x) { all[x.a.base] = 1; all[x.b.base] = 1; all[x.c.base] = 1; });
        var cands = shuffle(Object.keys(all).filter(function (c) { return !inWord[c]; }));
        if (level >= 3) cands.sort(function (x, y) { return letterSim(y, target) - letterSim(x, target); });
        else if (level <= 1) cands.sort(function (x, y) { return letterSim(x, target) - letterSim(y, target); });
        return shuffle([target].concat(cands.slice(0, n - 1)));
    }
    function missingQ(it, p, ctx) {
        var R = S.run, s = BYID[it.id], test = ctx.test;
        var lv = test ? 2 : (p.lv.missing || 1);
        var idxPool = lv <= 1 ? [2] : (lv === 2 ? [0, 2] : [0, 1, 2]);
        var mi = idxPool[Math.floor(Math.random() * idxPool.length)];
        var nOpt = lv <= 1 ? 2 : 3;
        var choices = letterChoices(s, mi, nOpt, lv);
        var parts = [s.a, s.b, s.c];
        var F = frame(R, "اقرأ الحرفين الظاهرين ثم اختر الحرف الناقص");
        if (test) F.box.classList.add("test");
        var wrongs = 0, hinted = false, revealed = false, locked = false, replays = 0;
        var board = el("div", "wb3-board wb3-gap"); board.id = "wb3Board";
        var boxes = parts.map(function (L, i) {
            var bx = el("div", "wb3-slot" + (i === mi ? " gap" : " given")); bx.setAttribute("data-slot", String(i));
            bx.appendChild(el("span", "wb3-slotn", ar(i + 1) + " " + ["الأول", "الثاني", "الثالث"][i]));
            if (i === mi) bx.appendChild(el("span", "wb3-q-mark", "؟"));
            else { var l = el("span", "wb3-slotl l" + (i + 1), L.ch); l.setAttribute("dir", "rtl"); l.setAttribute("lang", "ar"); bx.appendChild(l); }
            return bx;
        });
        boxes.forEach(function (x) { board.appendChild(x); });
        F.area.appendChild(board);
        F.area.appendChild(el("p", "wb3-dirnote", "نقرأ من اليمين: الحرف الأول ثم الثاني ثم الثالث"));
        var box = el("div", "wb3-opts letters n" + nOpt); box.id = "wb3Opts";
        var btns = {};
        choices.forEach(function (c) {
            var ob = el("button", "wb3-opt letter"); ob.type = "button"; ob.setAttribute("data-letter", c);
            ob.setAttribute("aria-label", "الحرف " + c);
            var le = el("span", "wb3-opt-l", c + D.FATHA); le.setAttribute("dir", "rtl"); le.setAttribute("lang", "ar");
            ob.appendChild(le);
            ob.addEventListener("click", function () { pick(c, ob); });
            btns[c] = ob; box.appendChild(ob);
        });
        F.area.appendChild(box);
        var target = parts[mi].base, helpB = null;
        function finishGood(res) {
            locked = true;
            var bxm = boxes[mi]; bxm.classList.remove("gap"); bxm.classList.add("filled-ok");
            bxm.innerHTML = ""; bxm.appendChild(el("span", "wb3-slotn", ar(mi + 1) + " " + ["الأول", "الثاني", "الثالث"][mi]));
            var l = el("span", "wb3-slotl l" + (mi + 1), parts[mi].ch); l.setAttribute("dir", "rtl"); bxm.appendChild(l);
            if (test) { ctx.done("ok", {}); return; }
            var join = function () {
                var j = wordEl(s, "huge pop"); j.id = "wb3Joined";
                board.innerHTML = ""; board.classList.add("done"); board.appendChild(j);
                box.classList.add("gone");
                playWord(s);
            };
            if (reduced()) join(); else later(join, 450);
            later(function () { ctx.done(res, { wrongs: wrongs, replays: replays }); }, reduced() ? 100 : 900);
        }
        function pick(c, ob) {
            if (locked) return;
            if (c === target) { finishGood(revealed ? "r" : (hinted ? "a" : (wrongs ? "s" : "f"))); return; }
            wrongs++;
            ob.classList.add("fade"); ob.disabled = true; ob.setAttribute("aria-disabled", "true");
            if (test) { locked = true; ctx.done("no", {}); return; }
            if (wrongs === 1) setMsg(F, "اقرأ الحرفين الظاهرين بالترتيب، ثم فكّر في الحرف الذي يكمل الكلمة.");
            else if (!hinted) {
                hinted = true; replays++;
                setMsg(F, "تلميح: اسمع الكلمة كاملة ثم اختر.");
                playWord(s);
            }
            if (!helpB) {
                helpB = btn("ghost", "ساعدني", function () {
                    if (locked || revealed) return;
                    revealed = true;
                    Object.keys(btns).forEach(function (k) { if (k !== target) btns[k].classList.add("fade"); });
                    btns[target].classList.add("reveal");
                    setMsg(F, "هذا هو الحرف الناقص. اضغط عليه.");
                });
                helpB.id = "wb3Help"; F.acts.appendChild(helpB);
            }
        }
    }

    /* ---------- أبني الكلمة (ثلاث خانات؛ دمج تدريجي عند النجاح) ---------- */
    function distractLetters(s, n, level) {
        var inWord = {}; inWord[s.a.base] = 1; inWord[s.b.base] = 1; inWord[s.c.base] = 1;
        var all = {};
        SYL.forEach(function (x) { all[x.a.base] = 1; all[x.b.base] = 1; all[x.c.base] = 1; });
        var cands = shuffle(Object.keys(all).filter(function (c) { return !inWord[c]; }));
        if (level >= 3) {
            cands.sort(function (x, y) {
                var sx = Math.max(letterSim(x, s.a.base), letterSim(x, s.b.base), letterSim(x, s.c.base));
                var sy = Math.max(letterSim(y, s.a.base), letterSim(y, s.b.base), letterSim(y, s.c.base));
                return sy - sx;
            });
        }
        return cands.slice(0, n);
    }
    /* الشكل الإملائي لحرف في موضع من كلمة ثلاثية: وصل من اليمين إن كان السابق يتصل بما بعده، ووصل من اليسار إن كان الحرف نفسه يتصل (وليس الأخير) */
    function formOf(c, pos, word) {
        var conn = D.CONNECTS || "";
        var joinPrev = pos > 0 && conn.indexOf(word[pos - 1]) >= 0;
        var joinNext = pos < 2 && conn.indexOf(c) >= 0;
        return (joinPrev ? D.TATWEEL : "") + c + D.FATHA + (joinNext ? D.TATWEEL : "");
    }
    function buildQ(it, p, ctx) {
        var R = S.run, s = BYID[it.id], test = ctx.test;
        var lv = test ? 2 : (p.lv.build || 1);
        /* المستوى ١: نموذج بصري للكلمة (دعم). المستويان ٢ و٣: الصوت وحده بلا نموذج (نجاح مستقل) */
        var model = !test && (lv <= 1 || !s.approved);
        it.model = model;
        var withAudio = !!s.approved;
        var F = frame(R, model ? "انظر إلى الكلمة ثم ركّب حروفها بالترتيب" : "اسمع الكلمة ثم رتّب حروفها الثلاثة");
        if (test) F.box.classList.add("test");
        var wrongs = 0, hinted = false, revealed = false, locked = false, replays = 0;
        var letters = [s.a.base, s.b.base, s.c.base].concat(distractLetters(s, lv <= 1 ? 1 : 2, lv));
        var want = [s.a.base, s.b.base, s.c.base];
        /* بطاقات الحروف بشكلها الإملائي حسب موضعها في الكلمة: أول (كَـ) · وسط (ـتَـ) · آخر (ـبَ).
           الحرف الذي لا يتصل بما بعده (ا أ د ذ ر ز و) لا يُوصَل من يساره، ولا يُوصَل بعد حرف لا يتصل. المشتّت يأخذ شكل موضع عشوائي */
        var posOf = {};
        want.forEach(function (c, i) { posOf[c] = i; });
        var tiles = shuffle(letters).map(function (c, i) {
            var pos = posOf.hasOwnProperty(c) ? posOf[c] : Math.floor(Math.random() * 3);
            return { base: c, pos: pos, ch: formOf(c, pos, want), uid: "t" + i, slot: -1, el: null };
        });
        var slots = [null, null, null];
        if (withAudio) {
            var sp = iconBtn("listen", ICONS.speaker, "اسمع الكلمة", function () { replays++; playWord(s); });
            sp.id = "wb3Listen"; F.area.appendChild(sp);
            later(function () { playWord(s); }, 350);
        }
        if (model) {
            var mdl = el("div", "wb3-model"); mdl.id = "wb3Model";
            mdl.appendChild(wordEl(s, "modelsyl"));
            F.area.appendChild(mdl);
        }
        var board = el("div", "wb3-board"); board.id = "wb3Board";
        var NAMES = ["الأول", "الثاني", "الثالث"];
        var slotEls = [0, 1, 2].map(function (i) {
            var se = el("button", "wb3-slot"); se.type = "button"; se.setAttribute("data-slot", String(i));
            se.setAttribute("aria-label", "الخانة " + NAMES[i] + " (الحرف " + NAMES[i] + ")");
            se.appendChild(el("span", "wb3-slotn", ar(i + 1) + " " + NAMES[i]));
            se.addEventListener("click", function () { if (!locked && slots[i]) release(i); });
            return se;
        });
        slotEls.forEach(function (x) { board.appendChild(x); });
        F.area.appendChild(board);
        var dn = el("p", "wb3-dirnote", "نبدأ من اليمين: الحرف الأول ثم الثاني ثم الثالث"); dn.id = "wb3DirNote"; F.area.appendChild(dn);
        var tray = el("div", "wb3-tray"); tray.id = "wb3Tray";
        tiles.forEach(function (t) {
            var te = el("button", "wb3-tile"); te.type = "button"; te.setAttribute("data-letter", t.base);
            te.setAttribute("aria-label", "الحرف " + t.base); te.textContent = t.ch;
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
        /* شاشة قصيرة (جوال صغير): نُظهر بطاقة السؤال كاملة (الخانات والبطاقات) دون أن يبحث الطفل عنها بالتمرير */
        try { if (window.innerHeight <= 720 && !test) { var y0 = -(window.__taStickyTop || 0) + F.box.getBoundingClientRect().top + (window.pageYOffset || 0) - 6; if (y0 > 0) window.scrollTo(0, y0); } } catch (e) { /* لا شيء */ }

        function paint() {
            slotEls.forEach(function (se, i) {
                var t = slots[i];
                se.classList.toggle("filled", !!t);
                var old = se.querySelector(".wb3-slotl"); if (old) se.removeChild(old);
                if (t) { var l = el("span", "wb3-slotl l" + (i + 1), t.ch); l.setAttribute("dir", "rtl"); se.appendChild(l); }
            });
            tiles.forEach(function (t) { t.el.classList.toggle("used", t.slot >= 0); t.el.disabled = t.slot >= 0 || locked; });
        }
        function place(t, k) {
            if (slots[k]) release(k);
            slots[k] = t; t.slot = k; paint(); check();
        }
        function release(k) { var t = slots[k]; if (!t) return; slots[k] = null; t.slot = -1; paint(); }
        function clearSlots() { release(0); release(1); release(2); }
        function check() {
            if (slots.indexOf(null) >= 0 || locked) return;
            var got = slots.map(function (t) { return t.base; });
            if (got.join("") === want.join("")) { good(); return; }
            wrongs++;
            if (test) { locked = true; ctx.done("no", {}); return; }
            var sameSet = got.slice().sort().join("") === want.slice().sort().join("");
            slotEls.forEach(function (se) { se.classList.add("bad"); });
            setMsg(F, sameSet ? "الحروف صحيحة لكن الترتيب مختلف: نبدأ من اليمين، الحرف الأول في الخانة ١." : "ليس هذا الترتيب. جرّب حرفًا آخر.");
            locked = true;
            later(function () {
                locked = false; slotEls.forEach(function (se) { se.classList.remove("bad"); }); clearSlots();
                if (wrongs >= 2 && !hinted) {
                    hinted = true;
                    var tile = tiles.filter(function (t) { return t.base === want[0]; })[0];
                    if (tile) tile.el.classList.add("hint");
                    setMsg(F, "تلميح: ابدأ بهذا الحرف في الخانة ١.");
                    playKey(s.a.ch);
                }
                paint();
            }, reduced() ? 1400 : 1100);
            if (!F.acts.querySelector("#wb3Help")) {
                var hb = btn("ghost", "ساعدني", reveal); hb.id = "wb3Help"; F.acts.appendChild(hb);
            }
        }
        function reveal() {
            if (revealed || (locked && !F.box.querySelector(".wb3-slot.bad"))) return;
            revealed = true; locked = true;
            clearSlots();
            slotEls.forEach(function (se) { se.classList.remove("bad"); });
            want.forEach(function (c, i) {
                var t = tiles.filter(function (x) { return x.base === c; })[0];
                slots[i] = t; t.slot = i;
            });
            paint();
            setMsg(F, "هكذا تُبنى الكلمة: الحرف الأول ثم الثاني ثم الثالث.");
            later(function () { good(); }, 700);
        }
        /* النجاح: دمج تدريجي مرئي — الحرفان الأول والثاني مقطعًا (بصوته إن كان معتمدًا)، ثم الكلمة كاملة بتسجيلها */
        function good() {
            locked = true; paint();
            if (test) { ctx.done("ok", {}); return; }
            board.classList.add("joined");
            var res = revealed ? "r" : (hinted ? "a" : (wrongs ? "s" : "f"));
            var t1 = reduced() ? 150 : 450, t2 = t1 + (s.sylApproved ? 1250 : 900);
            later(function () {
                board.innerHTML = ""; board.classList.add("stepjoin");
                board.appendChild(sylEl(s, "pairsyl pop"));
                board.appendChild(letterEl(s.c.ch, "l3 mid"));
                tray.classList.add("gone");
                F.msg.textContent = s.sylApproved ? "الأول والثاني معًا: مقطع." : "الأول والثاني معًا: مقطع (المعلم يقرؤه معك).";
                if (s.sylApproved) playSyl(s);
            }, t1);
            later(function () {
                var j = wordEl(s, "huge pop"); j.id = "wb3Joined";
                board.innerHTML = ""; board.classList.remove("stepjoin"); board.classList.add("done"); board.appendChild(j);
                F.msg.textContent = "ثم الحرف الثالث: الكلمة كاملة.";
                playWord(s);
            }, t2);
            later(function () { ctx.done(res, { wrongs: wrongs, replays: replays }); }, t2 + 1300);
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
        var bx = el("section", "wb3-end"); bx.id = "wb3Summary";
        bx.appendChild(el("h2", "", T.f + T.s === total && total ? "ممتاز، أنهيتَ الجولة" : "أنهيتَ الجولة"));
        var ul = el("ul", "wb3-stats");
        [["من أول مرة", T.f], ["بعد تصحيح ذاتي", T.s], ["بتلميح", T.a], ["بعد عرض الحل", T.r]].forEach(function (x) {
            var li = el("li"); li.appendChild(el("b", "", ar(x[1]))); li.appendChild(el("span", "", x[0])); ul.appendChild(li);
        });
        bx.appendChild(ul);
        bx.appendChild(el("p", "wb3-note", R.stars ? "حصلتَ على " + ar(R.stars) + (R.stars === 1 ? " نجمة إتقان جديدة" : " نجوم إتقان جديدة") + "." : "نجمة الإتقان لكل كلمة: بناء الكلمة بلا نموذج من أول مرة + نجاح مستقل آخر في نشاط مختلف، أو قراءة مستقلة يؤكدها المعلم."));
        if (R.note) bx.appendChild(el("p", "wb3-note", R.note));
        if (T.skip) bx.appendChild(el("p", "wb3-note", "تخطّيتَ " + ar(T.skip) + " بسبب تعذّر تشغيل الصوت."));
        var row = el("div", "wb3-row center");
        var again = btn("main", "جولة جديدة", function () { if (R.mix) startReview(); else startActivity(R.type); });
        again.id = "wb3Again"; row.appendChild(again);
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
            var bx = el("section", "wb3-end"); bx.id = "wb3ReviewEmpty";
            bx.appendChild(el("h2", "", "لا توجد كلمات تحتاج مراجعة الآن"));
            bx.appendChild(el("p", "", "تابع التدرّب على مرحلة أخرى."));
            var row = el("div", "wb3-row center");
            row.appendChild(btn("main", "الرئيسية", renderHome));
            bx.appendChild(row); body().appendChild(bx);
            return;
        }
        var kinds = ["missing", "build"].concat(audioStagesOpen() ? ["hear"] : []);
        var picks = shuffle(need).slice(0, CFG.sessionLength);
        var items = picks.map(function (id, i) {
            var k = kinds[i % kinds.length];
            if (k === "hear" && !BYID[id].approved) k = "missing";
            return { id: id, type: k };
        });
        startActivity("review", { items: items, mix: true });
        S.run.type = "review";
    }

    /* ---------- المرحلة ٥: أقرأ بنفسي (القراءة المستقلة يؤكدها المعلم وحده) ---------- */
    /* mode: "ok" قراءة مستقلة بلا مساعدة (نجمة + دليل إتقان) · "help" بمساعدة · "no" يحتاج تدريبًا. true/false مقبولان للتوافق */
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
        var p = load(), pool = scopeIds(p, S.scope);
        var ids2 = pickTargets(p, pool, 5, "missing");
        S.run = { type: "read", items: ids2.map(function (id) { return { id: id, type: "read" }; }), i: 0, ok: 0, help: 0, sup: 0, nores: 0, stars: 0, tok: 0 };
        readQ();
    }
    function readQ() {
        var R = S.run;
        if (R.i >= R.items.length) return readEnd();
        var s = BYID[R.items[R.i].id];
        R.tok++; var tok = R.tok;
        setViewKeep(); refreshHead("أقرأ بنفسي");
        var F = frame(R, "اقرأ الكلمة بصوتك");
        var show = el("div", "wb3-readshow"); show.id = "wb3ReadShow";
        show.appendChild(wordEl(s, "huge"));
        F.area.appendChild(show);
        setMsg(F, "انظر إلى الحروف الثلاثة من اليمين ثم اقرأ الكلمة كاملة. لا يبدأ الصوت وحده.");
        var helps = 0;
        var helpB = btn("ghost", "ساعدني", function () {
            if (helps >= 3) return;
            helps++;
            show.innerHTML = "";
            if (helps === 1) {
                var row = el("div", "wb3-pair static");
                row.appendChild(letterEl(s.a.ch, "l1 mid")); row.appendChild(letterEl(s.b.ch, "l2 mid")); row.appendChild(letterEl(s.c.ch, "l3 mid"));
                show.appendChild(row);
                setMsg(F, "الحروف الثلاثة بالترتيب: الأول ثم الثاني ثم الثالث.");
            } else if (helps === 2) {
                var r2 = el("div", "wb3-pair static");
                r2.appendChild(letterEl(s.c.ch, "l3 mid")); r2.appendChild(el("span", "wb3-plus", "+")); r2.appendChild(sylEl(s, "pairsyl"));
                show.appendChild(r2);
                setMsg(F, s.sylApproved ? "الأول والثاني معًا مقطع واحد؛ ثم أضف الثالث." : "الأول والثاني معًا مقطع واحد، والمعلم يقرؤه معك؛ ثم أضف الثالث.");
                if (s.sylApproved) playSyl(s);
            } else {
                show.appendChild(wordEl(s, "huge"));
                setMsg(F, "اسمع الكلمة كاملة ثم اقرأها معي.");
                playWord(s);
                helpB.disabled = true;
            }
            R.helped = true;
        });
        helpB.id = "wb3ReadHelp";
        var read = btn("main big", "قرأتُ", function () {
            read.disabled = true; helpB.disabled = true; F.acts.innerHTML = "";
            if (s.approved) F.acts.appendChild(iconBtn("listen", ICONS.speaker, "اسمع التسجيل", function () { playWord(s); }));
            else F.acts.appendChild(el("p", "wb3-note", "تسجيل هذه الكلمة قيد الإعداد."));
            var tc = el("div", "wb3-tconf"); tc.id = "wb3TConf";
            tc.appendChild(el("span", "wb3-tconf-l", "تأكيد المعلم"));
            var okb = btn("main", "قرأ بلا مساعدة", function () { gate(function () { rate("ok"); }); }); okb.id = "wb3ReadOk";
            if (helps > 0) { okb.disabled = true; okb.setAttribute("aria-disabled", "true"); okb.title = "استُخدمت مساعدة"; }
            var hpb = btn("ghost", "قرأ بمساعدة", function () { gate(function () { rate("help"); }); }); hpb.id = "wb3ReadHelped";
            var nob = btn("ghost", "يحتاج تدريبًا", function () { gate(function () { rate("no"); }); }); nob.id = "wb3ReadNo";
            var skb = btn("ghost", "بدون تقييم", function () { R.nores++; R.i++; readQ(); }); skb.id = "wb3ReadSkip";
            tc.appendChild(okb); tc.appendChild(hpb); tc.appendChild(nob); tc.appendChild(skb);
            F.acts.appendChild(tc);
            setMsg(F, "ضغط «قرأتُ» وحده لا يُحسب إتقانًا. المعلم يؤكد النطق." + (helps > 0 ? " استُخدمت مساعدة، فلا تُحسب قراءة مستقلة." : ""));
        });
        read.id = "wb3Read";
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
        setView("summary", "أقرأ بنفسي");
        var b = body(), bx = el("section", "wb3-end"); bx.id = "wb3Summary";
        bx.appendChild(el("h2", "", "انتهت جولة القراءة"));
        var ul = el("ul", "wb3-stats");
        [["قرأ بلا مساعدة (بتأكيد المعلم)", R.ok], ["قرأ بمساعدة", R.help], ["يحتاج تدريبًا", R.sup], ["بدون تقييم", R.nores]].forEach(function (x) {
            var li = el("li"); li.appendChild(el("b", "", ar(x[1]))); li.appendChild(el("span", "", x[0])); ul.appendChild(li);
        });
        bx.appendChild(ul);
        if (R.stars) bx.appendChild(el("p", "wb3-note", "نجوم إتقان جديدة: " + ar(R.stars)));
        var row = el("div", "wb3-row center");
        row.appendChild(btn("main", "جولة جديدة", function () { startRead(); }));
        row.appendChild(btn("ghost", "الرئيسية", renderHome));
        bx.appendChild(row); b.appendChild(bx);
    }

    /* ---------- المرحلة ٦: اختبار الإتقان (٨ أسئلة، بلا مساعدة) ---------- */
    function startTest() {
        var p = load();
        if (!testOpen()) {
            setView("blocked", "اختبار الإتقان");
            var bx = el("section", "wb3-end"); bx.id = "wb3Blocked";
            bx.appendChild(el("h2", "", "الاختبار متوقف مؤقتًا"));
            bx.appendChild(el("p", "", "يحتاج أسئلة سمعية وبناءً من تسجيلات معتمدة، والمتاح الآن أقل من المطلوب."));
            var row = el("div", "wb3-row center"); row.appendChild(btn("main", "الرئيسية", renderHome));
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
        var hear = take(ap, M.hear), bld = take(ap, M.build), mis = take(all, M.missing), rd = take(all, M.read);
        var items = [];
        for (var k = 0; k < 2; k++) {
            items.push({ id: hear[k], type: "hear" }); items.push({ id: mis[k], type: "missing" });
            items.push({ id: bld[k], type: "build" }); items.push({ id: rd[k], type: "read" });
        }
        void p;
        S.run = { type: "test", items: items, i: 0, auto: 0, autoTotal: 0, skipped: 0, reads: [], tok: 0 };
        testQ();
    }
    function testQ() {
        var R = S.run;
        if (R.i >= R.items.length) return testEnd();
        var it = R.items[R.i], p = load();
        R.tok++; var tok = R.tok;
        setViewKeep(); refreshHead("اختبار الإتقان");
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
            var s = BYID[it.id], F = frame(R, "اقرأ الكلمة بصوتك");
            F.box.classList.add("test");
            F.area.appendChild(wordEl(s, "huge"));
            setMsg(F, "انطق الكلمة، ثم اضغط «قرأتُ». سيؤكد المعلم نطقك في النهاية.");
            var rb = btn("main big", "قرأتُ", function () { R.reads.push(it.id); nxt(); }); rb.id = "wb3Read";
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
        if (t.readOk[k] === true || t.readOk[k] === false) return; /* تأكيد واحد لكل قراءة */
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
        var bx = el("section", "wb3-end"); bx.id = "wb3TestResult";
        var head = el("h2", "");
        bx.appendChild(head);
        bx.appendChild(el("p", "wb3-big", "الأسئلة الآلية: " + ar(t.auto) + " من " + ar(t.autoTotal) + " (المطلوب " + ar(CFG.test.passAuto) + " فأكثر)"));
        if (t.status === "incomplete") {
            head.textContent = "لم يكتمل الاختبار";
            bx.appendChild(el("p", "wb3-note", "تعذّر تشغيل صوت أحد الأسئلة، فلا يُحسب هذا الاختبار. أعده لاحقًا."));
        } else {
            var rl = el("div", "wb3-reads"); rl.id = "wb3Reads";
            t.reads.forEach(function (rid, k) {
                var row = el("div", "wb3-readrow");
                row.appendChild(wordEl(BYID[rid], "small"));
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
                bx.appendChild(el("p", "wb3-note", "راجع الكلمات الصعبة ثم أعد الاختبار متى شئت. لا يضيع شيء مما أنجزتَه."));
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
        var sec = el("section", "wb3-tp"); sec.id = "wb3TeacherPanel";
        var cnt = { "new": 0, learning: 0, review: 0, mastered: 0 };
        SYL.forEach(function (s) { cnt[stateOf(p, s.id)]++; });
        var h = el("div", "wb3-tsum");
        h.innerHTML = "<span>أتقن: <b>" + ar(cnt.mastered) + "</b>/" + ar(SYL.length) + "</span><span>يتدرّب: <b>" + ar(cnt.learning) + "</b></span><span>يراجع: <b>" + ar(cnt.review) + "</b></span><span>جديدة: <b>" + ar(cnt["new"]) + "</b></span><span>النجوم: <b>" + ar(p.stars) + "</b>/" + ar(MAX_STARS) + "</span><span>الجولات: <b>" + ar(p.sessions) + "</b></span>";
        sec.appendChild(h);

        var sgT = suggest(p);
        var jr = el("div", "wb3-tbox"); jr.id = "wb3Journey";
        jr.appendChild(el("h3", "", "الرحلة والتوصية"));
        jr.appendChild(el("p", "", "الخطوة المقترحة: " + STAGE_BY[sgT.stage].title + " — " + sgT.why));
        var jl = el("ul", "wb3-acts");
        STAGES.forEach(function (st) { var li = el("li"); li.appendChild(el("span", "", st.title)); li.appendChild(el("b", "", stageStatus(p, st.id))); jl.appendChild(li); });
        jr.appendChild(jl); sec.appendChild(jr);

        var ap = approvedAll();
        var au = el("div", "wb3-tbox"); au.id = "wb3AudioStatus";
        au.appendChild(el("h3", "", "حالة الصوت"));
        var nSyl = SYL.filter(function (s) { return s.sylApproved; }).length;
        au.appendChild(el("p", "", "تسجيلات الكلمات المعتمدة: " + ar(ap.length) + " من " + ar(SYL.length) + ". مقاطع أول حرفين المعتمدة من الدرس الثاني: " + ar(nSyl) + " من " + ar(SYL.length) + "."));
        var noSyl = SYL.filter(function (s) { return !s.sylApproved; });
        au.appendChild(el("p", "wb3-note", "الكلمات التالية لا مقطع معتمد لأول حرفين فيها، فيُعرض دمجهما بصريًا مع دعم المعلم ثم يُشغَّل تسجيل الكلمة الكامل المعتمد. لا يُركَّب صوت من تسجيلات متفرقة."));
        if (noSyl.length) {
            var ml = el("div", "wb3-miss");
            ml.appendChild(el("span", "", "دمج بصري بدعم المعلم: "));
            noSyl.forEach(function (s) { ml.appendChild(wordEl(s, "tiny")); });
            au.appendChild(ml);
        }
        var miss = SYL.filter(function (s) { return !s.approved; });
        if (miss.length) {
            var ml2 = el("div", "wb3-miss");
            ml2.appendChild(el("span", "", "تسجيل الكلمة قيد الإعداد: "));
            miss.forEach(function (s) { ml2.appendChild(wordEl(s, "tiny")); });
            au.appendChild(ml2);
        }
        sec.appendChild(au);

        var ac = el("div", "wb3-tbox"); ac.id = "wb3ActStats";
        ac.appendChild(el("h3", "", "الأداء حسب النشاط (نجاح مستقل)"));
        var ul = el("ul", "wb3-acts");
        [["hear", "أسمع وأختار"], ["build", "أبني (بالصوت فقط)"], ["buildm", "أبني (مع نموذج بصري — دعم)"], ["missing", "أي حرف ينقص؟"]].forEach(function (x) {
            var a = accuracy(p, x[0]);
            var li = el("li"); li.appendChild(el("span", "", x[1])); li.appendChild(el("b", "", a[1] ? ar(a[0]) + "/" + ar(a[1]) + " (" + pct(a) + ")" : "لم يُجرَّب")); ul.appendChild(li);
        });
        ac.appendChild(ul); sec.appendChild(ac);

        var tb = el("div", "wb3-tbox");
        tb.appendChild(el("h3", "", "الكلمات"));
        var tbl = el("table", "wb3-table"); tbl.id = "wb3Table";
        tbl.innerHTML = "<thead><tr><th>الكلمة</th><th>الحالة</th><th>أول مرة</th><th>تصحيح</th><th>تلميح</th><th>كشف</th><th>أخطاء</th><th>أدلة النجمة</th><th>القراءة</th></tr></thead>";
        var tbody = el("tbody");
        var EVN = { hear: "سمع", build: "بناء", missing: "إكمال" };
        SYL.forEach(function (s) {
            var r = p.syl[s.id] || newRec(), st = stateOf(p, s.id);
            var tr = el("tr"); tr.setAttribute("data-id", s.id);
            var td = el("td"); td.appendChild(wordEl(s, "tiny")); tr.appendChild(td);
            var readTxt = r.read.att ? ({ ok: "مستقلة مؤكدة", help: "بمساعدة", sup: "تحتاج تدريبًا", "": "—" })[r.read.last] + " (" + ar(r.read.ok) + "/" + ar(r.read.att) + ")" : "—";
            [STATE_LABEL[st] + (p.starred[s.id] ? " ★" : ""), ar(r.f), ar(r.s), ar(r.a), ar(r.r), ar(r.w), (r.ev.length ? r.ev.map(function (k) { return EVN[k]; }).join("+") : "—"), readTxt].forEach(function (t) { tr.appendChild(el("td", "", t)); });
            tbody.appendChild(tr);
        });
        tbl.appendChild(tbody);
        var tw = el("div", "wb3-tablew"); tw.appendChild(tbl); tb.appendChild(tw); sec.appendChild(tb);

        var tt = el("div", "wb3-tbox"); tt.id = "wb3Tests";
        tt.appendChild(el("h3", "", "نتائج الاختبار"));
        if (!p.tests.length) tt.appendChild(el("p", "wb3-note", "لم يُجرَ اختبار بعد."));
        var LBL = { pending: "بانتظار تأكيد المعلم", pass: "نجاح", fail: "يحتاج تدريبًا", incomplete: "غير مكتمل" };
        p.tests.forEach(function (t, i) {
            var row = el("div", "wb3-testrow");
            row.appendChild(el("span", "", new Date(t.t).toLocaleDateString("ar") + " — آلي " + ar(t.auto) + "/" + ar(t.autoTotal) + " — " + LBL[t.status]));
            row.appendChild(btn("ghost sm", "فتح", function () { renderTestResult(i, true); }));
            tt.appendChild(row);
        });
        sec.appendChild(tt);

        var rs = el("div", "wb3-row center");
        var rb = btn("ghost", "إعادة التدريب من البداية", function () {
            if (!window.confirm("تُعاد حالة الكلمات والمستويات، وتبقى النجوم المكتسبة. متابعة؟")) return;
            var q = load(); q.syl = {}; q.lv = { hear: 1, build: 1, missing: 1 }; save(q); renderTeacher();
        });
        rb.id = "wb3Reset"; rs.appendChild(rb);
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
        var bt = document.getElementById("wbk3Entry");
        if (bt && !bt.getAttribute("data-wbk3-bound")) { bt.setAttribute("data-wbk3-bound", "1"); bt.addEventListener("click", open); }
        var q = null; try { q = new URLSearchParams(location.search).get("wbk3"); } catch (e) { /* لا شيء */ }
        if (q === "open") setTimeout(open, 900);
    }
    document.addEventListener("DOMContentLoaded", function () { setTimeout(bindEntry, 0); });
    if (document.readyState !== "loading") setTimeout(bindEntry, 0);

    window.wbk3Open = open;
    window.wbk3State = S; /* للاختبار */
    window.wbk3Internals = { load: load, save: save, rec: rec, logResult: logResult, stateOf: stateOf, giveStar: giveStar, suggest: suggest, playWord: playWord, playSyl: playSyl, playKey: playKey, needsReview: needsReview, mastered: mastered, applyRead: applyRead, confirmTest: confirmTest, poolFor: poolFor, pickDistractors: pickDistractors, simScore: simScore, KEY: KEY, MAX_STARS: MAX_STARS, renderHome: renderHome, renderLibrary: renderLibrary, startTest: startTest, startActivity: startActivity };
})();
