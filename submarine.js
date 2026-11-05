/* =========================================================
   🐠 submarine.js — «مغامرة الغواصة – صياد الأرقام»
   لعبة داخل قسم الأرقام: عدّ آلي وربط العدد بمدلوله.
   • الرسم كله متجهي على Canvas (غواصة وعشرة أنواع أسماك وقرش لطيف وشعاب)، لا رموز تعبيرية.
   • الأصوات: أصوات الأعداد العربية الموجودة عبر EduAudio فقط (لا تسجيل جديد ولا تعديل)،
     ومؤثرات قصيرة مُولَّدة برمجيًا تُجدوَل بعد/قبل صوت العدد لا معه.
   • التخزين: مفتاح واحد taha_submarine_progress_v1 (يُعزل تلقائيًا لكل طالب)؛ لا يمسّ النجوم ولا أي قسم آخر.
   • لا مؤقتات ولا عقوبات؛ كل المستويات مفتوحة.
   ========================================================= */
(function () {
    "use strict";

    var sec = document.getElementById("submarineGame");
    if (!sec) return;

    var AR = "٠١٢٣٤٥٦٧٨٩";
    function ar(n) { return String(n).replace(/\d/g, function (d) { return AR[d]; }); }
    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    function hyp(x, y) { return Math.sqrt(x * x + y * y); }
    function mulberry(seed) {
        return function () {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    /* ---------------- ثوابت اللعبة ---------------- */
    var LEVELS = [
        { id: 1, min: 1, max: 3, label: "العد من ١ إلى ٣" },
        { id: 2, min: 1, max: 5, label: "العد من ١ إلى ٥" },
        { id: 3, min: 1, max: 10, label: "العد من ١ إلى ١٠" }
    ];
    /* عدد الأسماك الإضافية فوق العدد المطلوب (الهدف ٧ ← ١٢ سمكة) */
    var EXTRA = { 1: 2, 2: 3, 3: 3, 4: 4, 5: 4, 6: 5, 7: 5, 8: 5, 9: 5, 10: 4 };
    var PROGRESS_KEY = "taha_submarine_progress_v1";

    /* ---------------- الحالة ---------------- */
    var G = {
        built: false, running: false, raf: 0, last: 0, t: 0,
        mode: "easy",                 /* easy = الغواصة ثابتة، free = قيادة بعصا التحكم */
        sel: { type: "level", id: 1 },
        phase: "menu",                /* menu | play | win */
        target: 0, count: 0, lastTarget: 0,
        fish: [], shark: null, sharkShown: false,
        slotsPop: [],                 /* زمن ظهور كل خانة في نافذة الغواصة */
        W: 0, H: 0, S: 1, F: 1, dpr: 1, groundY: 0, subL: 200,
        sub: { x: 0, y: 0, vx: 0, vy: 0, pitch: 0, face: 1, faceTarget: 1, prop: 0, bob: 0, jump: 0, spin: 0 },
        hatch: { x: 0, y: 0, r: 40 },
        pointers: {},                 /* pointerId → سمكة مسحوبة */
        joy: { x: 0, y: 0, id: null },
        keys: {},
        bubbles: [], parts: [], snow: [], kelp: [],
        celebrate: 0, winTimer: 0,
        nearHatch: false,
        lowFx: false, frameEma: 16, frames: 0,
        reduced: false,
        stats: { grabs: 0, rejected: 0, entered: 0, doubleCountBlocked: 0 }
    };

    var dom = {};
    var ctx = null, bgCanvas = null;

    /* =========================================================
       🔊 صوت: صف تسلسلي واحد (لا تداخل، ولا يضيع صوت عدد عند السحب السريع)
       ========================================================= */
    var Aud = { q: [], playing: false, ac: null, token: 0 };

    function soundOn() {
        try { return !(typeof Settings !== "undefined" && Settings.get().sound === false); } catch (e) { return true; }
    }
    function audioCtx() {
        if (!Aud.ac) {
            try { Aud.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { Aud.ac = null; }
        }
        if (Aud.ac && Aud.ac.state === "suspended") { try { Aud.ac.resume(); } catch (e) { /* لا شيء */ } }
        return Aud.ac;
    }
    function tone(a, t0, f0, f1, dur, vol, type) {
        var o = a.createOscillator(), g = a.createGain();
        o.type = type || "sine";
        o.frequency.setValueAtTime(f0, t0);
        if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(a.destination);
        o.start(t0); o.stop(t0 + dur + 0.02);
    }
    function synth(kind) {
        var a = audioCtx();
        if (!a) return;
        var t = a.currentTime + 0.005;
        if (kind === "plop") {          /* فقاعة قصيرة عند دخول السمكة */
            tone(a, t, 620, 260, 0.11, 0.16, "sine");
            tone(a, t + 0.03, 930, 420, 0.07, 0.07, "sine");
        } else if (kind === "shark") {   /* نغمة لطيفة عند ظهور القرش */
            tone(a, t, 392, 523, 0.16, 0.12, "triangle");
            tone(a, t + 0.17, 523, 659, 0.2, 0.12, "triangle");
        } else if (kind === "win") {     /* ارتجال احتفالي */
            [523, 659, 784, 1047].forEach(function (f, i) { tone(a, t + i * 0.11, f, f, 0.2, 0.13, "triangle"); });
        } else if (kind === "no") {      /* همسة لطيفة جدًا (ليست عقابًا) */
            tone(a, t, 330, 300, 0.09, 0.05, "sine");
        }
    }
    function pump() {
        if (Aud.playing || !Aud.q.length) return;
        var it = Aud.q.shift();
        var my = Aud.token;
        Aud.playing = true;
        var fin = false, wd = 0;
        function done() {
            if (fin) return;
            fin = true;
            clearTimeout(wd);
            if (my !== Aud.token) return;
            Aud.playing = false;
            pump();
        }
        wd = setTimeout(done, it.max || 3200);
        if (!soundOn()) { setTimeout(done, 20); return; }
        if (it.sfx) { synth(it.sfx); setTimeout(done, it.ms || 120); }
        else if (it.say != null) {
            try { EduAudio.play(it.say, { mode: "interrupt", done: done }); } catch (e) { done(); }
        } else { done(); }
    }
    function enqueue(it) { Aud.q.push(it); pump(); }
    function audioReset() {
        Aud.token++;
        Aud.q.length = 0;
        Aud.playing = false;
        try { EduAudio.stop(); } catch (e) { /* لا شيء */ }
    }
    var audioLog = [];   /* للاختبار: ترتيب ما أُرسل للصف */
    function sayNumber(n) { audioLog.push("say:" + n); enqueue({ say: String(n), max: 3000 }); }
    function sfx(k, ms) { audioLog.push("sfx:" + k); enqueue({ sfx: k, ms: ms || 120, max: 600 }); }
    function sayPhrase(p) { audioLog.push("say:" + p); enqueue({ say: p, max: 3500 }); }

    /* =========================================================
       🐠 رسم الأسماك (متجه) — كل دالة ترسم السمكة متجهة نحو +x، مركزها (٠،٠)، طولها len
       ========================================================= */
    function eye(c, x, y, r, look) {
        c.fillStyle = "#fff"; c.strokeStyle = "rgba(20,30,50,.85)"; c.lineWidth = Math.max(1, r * 0.16);
        c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill(); c.stroke();
        c.fillStyle = "#14203a";
        c.beginPath(); c.arc(x + r * 0.22 + (look || 0), y + r * 0.04, r * 0.6, 0, 6.2832); c.fill();
        c.fillStyle = "#fff";
        c.beginPath(); c.arc(x + r * 0.42 + (look || 0), y - r * 0.22, r * 0.2, 0, 6.2832); c.fill();
    }
    function grad(c, x0, y0, x1, y1, stops) {
        var g = c.createLinearGradient(x0, y0, x1, y1);
        for (var i = 0; i < stops.length; i += 2) g.addColorStop(stops[i], stops[i + 1]);
        return g;
    }
    function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, 6.2832); }
    function outline(c, col, w) { c.strokeStyle = col; c.lineWidth = w; c.lineJoin = "round"; c.lineCap = "round"; c.stroke(); }

    var SPECIES = [
        /* ١) سمكة المهرّج: برتقالية بثلاثة أحزمة بيضاء */
        { key: "clown", name: "سمكة المهرّج", len: 100, h: 54, draw: function (c, p) {
            var w = p.w;
            c.save(); c.translate(-36, 0); c.rotate(w * 0.32);
            c.beginPath(); c.moveTo(4, 0); c.quadraticCurveTo(-18, -22, -30, -17); c.quadraticCurveTo(-22, 0, -30, 17); c.quadraticCurveTo(-18, 22, 4, 0);
            c.fillStyle = "#ff7a12"; c.fill(); outline(c, "#222", 2.4); c.restore();
            c.beginPath(); c.moveTo(-14, -22); c.quadraticCurveTo(2, -42, 24, -24); c.closePath(); c.fillStyle = "#ff8a1f"; c.fill(); outline(c, "#222", 2.4);
            ell(c, 0, 0, 43, 27); c.fillStyle = grad(c, 0, -27, 0, 27, [0, "#ffb347", 0.5, "#ff7a12", 1, "#e85d04"]); c.fill();
            c.save(); ell(c, 0, 0, 43, 27); c.clip();
            [[-18, 9], [8, 12], [31, 8]].forEach(function (b) {
                c.beginPath(); c.moveTo(b[0] - b[1] / 2, -30); c.quadraticCurveTo(b[0] - b[1] / 2 - 4, 0, b[0] - b[1] / 2, 30);
                c.lineTo(b[0] + b[1] / 2, 30); c.quadraticCurveTo(b[0] + b[1] / 2 - 4, 0, b[0] + b[1] / 2, -30); c.closePath();
                c.fillStyle = "#fff"; c.fill(); outline(c, "#222", 2.2);
            });
            c.fillStyle = "rgba(255,255,255,.35)"; ell(c, 4, -14, 24, 6, -0.05); c.fill();
            c.restore();
            ell(c, 0, 0, 43, 27); outline(c, "#222", 2.6);
            c.save(); c.translate(8, 10); c.rotate(0.3 + w * 0.25);
            c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-10, 12, -16, 8); c.quadraticCurveTo(-8, 2, 0, 0); c.fillStyle = "#ff8a1f"; c.fill(); outline(c, "#222", 2); c.restore();
            eye(c, 27, -5, 6.2);
            c.beginPath(); c.arc(38, 6, 5, 0.4, 1.9); outline(c, "#7a2a00", 2);
        } },
        /* ٢) سمكة الدوري الزرقاء: قرص أزرق بنقش أسود وذيل أصفر */
        { key: "tang", name: "الدوري الأزرق", len: 108, h: 70, draw: function (c, p) {
            var w = p.w;
            c.save(); c.translate(-40, 0); c.rotate(w * 0.3);
            c.beginPath(); c.moveTo(6, 0); c.quadraticCurveTo(-10, -26, -24, -26); c.quadraticCurveTo(-14, 0, -24, 26); c.quadraticCurveTo(-10, 26, 6, 0);
            c.fillStyle = "#ffd60a"; c.fill(); outline(c, "#1b2a6b", 2.4); c.restore();
            c.beginPath(); c.moveTo(-26, -24); c.quadraticCurveTo(-4, -48, 28, -22); c.closePath(); c.fillStyle = "#1f6fe0"; c.fill(); outline(c, "#102a6b", 2.4);
            c.beginPath(); c.moveTo(-22, 24); c.quadraticCurveTo(0, 42, 22, 24); c.closePath(); c.fillStyle = "#1f6fe0"; c.fill(); outline(c, "#102a6b", 2.4);
            ell(c, 0, 0, 42, 31); c.fillStyle = grad(c, 0, -31, 0, 31, [0, "#5ec8ff", 0.5, "#2b8cff", 1, "#1348c9"]); c.fill();
            c.save(); ell(c, 0, 0, 42, 31); c.clip();
            c.beginPath(); c.moveTo(22, -8); c.bezierCurveTo(8, -26, -18, -22, -34, -6); c.bezierCurveTo(-18, -14, 4, -8, 10, 6); c.bezierCurveTo(14, 12, 6, 20, -4, 16);
            c.bezierCurveTo(8, 24, 24, 12, 22, -8); c.fillStyle = "#0b1b4a"; c.fill();
            c.fillStyle = "rgba(255,255,255,.3)"; ell(c, 2, -19, 22, 5, 0); c.fill(); c.restore();
            ell(c, 0, 0, 42, 31); outline(c, "#102a6b", 2.6);
            c.beginPath(); c.moveTo(-6, 10); c.lineTo(-14, 14); c.strokeStyle = "#ffd60a"; c.lineWidth = 3.4; c.lineCap = "round"; c.stroke();
            eye(c, 27, -7, 6.4);
            c.beginPath(); c.arc(40, 3, 3.6, 0.3, 2.2); outline(c, "#0b1b4a", 2);
        } },
        /* ٣) السمكة النفّاخة: كروية بأشواك قصيرة وملامح مستديرة */
        { key: "puffer", name: "النفّاخة", len: 86, h: 76, draw: function (c, p) {
            var w = p.w, i, a;
            c.save(); c.translate(-30, 0); c.rotate(w * 0.4);
            c.beginPath(); c.moveTo(4, 0); c.quadraticCurveTo(-10, -14, -20, -12); c.quadraticCurveTo(-14, 0, -20, 12); c.quadraticCurveTo(-10, 14, 4, 0);
            c.fillStyle = "#f2a900"; c.fill(); outline(c, "#7a4a00", 2.2); c.restore();
            c.fillStyle = "#e3a000";
            for (i = 0; i < 18; i++) {
                a = i / 18 * 6.2832 + 0.2;
                if (Math.cos(a) > 0.55 && Math.abs(Math.sin(a)) < 0.35) continue;
                var bx = Math.cos(a) * 33, by = Math.sin(a) * 33;
                c.beginPath(); c.moveTo(bx - Math.sin(a) * 4.5, by + Math.cos(a) * 4.5); c.lineTo(Math.cos(a) * 42, Math.sin(a) * 42); c.lineTo(bx + Math.sin(a) * 4.5, by - Math.cos(a) * 4.5); c.closePath(); c.fill();
            }
            c.beginPath(); c.arc(0, 0, 36, 0, 6.2832); c.fillStyle = grad(c, 0, -36, 0, 36, [0, "#ffe27a", 0.55, "#ffc933", 1, "#f2a900"]); c.fill();
            c.save(); c.beginPath(); c.arc(0, 0, 36, 0, 6.2832); c.clip();
            c.fillStyle = "#fff6d6"; ell(c, 6, 22, 34, 18, 0); c.fill();
            c.fillStyle = "rgba(120,70,0,.5)";
            [[-14, -14, 3.2], [-2, -22, 3], [-22, 2, 3.4], [-8, -2, 2.6], [8, -14, 2.6], [-18, 14, 2.6]].forEach(function (d) { c.beginPath(); c.arc(d[0], d[1], d[2], 0, 6.2832); c.fill(); });
            c.fillStyle = "rgba(255,255,255,.4)"; ell(c, -6, -22, 16, 5, -0.2); c.fill(); c.restore();
            c.beginPath(); c.arc(0, 0, 36, 0, 6.2832); outline(c, "#7a4a00", 2.6);
            c.save(); c.translate(2, 10); c.rotate(0.5 + Math.sin(p.t * 9) * 0.5);
            c.beginPath(); c.ellipse(-4, 0, 11, 6, 0, 0, 6.2832); c.fillStyle = "#ffd25a"; c.fill(); outline(c, "#7a4a00", 1.8); c.restore();
            eye(c, 18, -9, 8.2);
            c.beginPath(); c.arc(33, 6, 4, 0, 6.2832); c.fillStyle = "#d9534f"; c.fill(); outline(c, "#7a1f1a", 1.6);
        } },
        /* ٤) سمكة الملاك: جسم عالٍ بخطوط سوداء وزعانف طويلة */
        { key: "angel", name: "سمكة الملاك", len: 100, h: 92, draw: function (c, p) {
            var w = p.w;
            c.beginPath(); c.moveTo(-18, -26); c.bezierCurveTo(-34, -66, -70, -62, -58, -24 + w * 4); c.bezierCurveTo(-44, -30, -30, -24, -18, -14);
            c.fillStyle = "rgba(255,196,60,.92)"; c.fill(); outline(c, "#7a4a00", 2.2);
            c.beginPath(); c.moveTo(-18, 26); c.bezierCurveTo(-34, 66, -70, 62, -58, 24 - w * 4); c.bezierCurveTo(-44, 30, -30, 24, -18, 14);
            c.fillStyle = "rgba(255,196,60,.92)"; c.fill(); outline(c, "#7a4a00", 2.2);
            c.save(); c.translate(-38, 0); c.rotate(w * 0.28);
            c.beginPath(); c.moveTo(8, 0); c.quadraticCurveTo(-8, -22, -22, -18); c.quadraticCurveTo(-14, 0, -22, 18); c.quadraticCurveTo(-8, 22, 8, 0);
            c.fillStyle = "rgba(255,230,150,.95)"; c.fill(); outline(c, "#7a4a00", 2.2); c.restore();
            c.beginPath(); c.moveTo(-34, 0); c.quadraticCurveTo(-18, -44, 10, -42); c.quadraticCurveTo(46, -22, 44, 0); c.quadraticCurveTo(46, 22, 10, 42); c.quadraticCurveTo(-18, 44, -34, 0); c.closePath();
            c.fillStyle = grad(c, 0, -44, 0, 44, [0, "#fff7c2", 0.5, "#ffe066", 1, "#f4b400"]); c.fill();
            c.save(); c.clip();
            c.fillStyle = "#1c1c1c";
            [-14, 8, 28].forEach(function (x, i) { c.beginPath(); c.moveTo(x - 2.5, -46); c.quadraticCurveTo(x + 5 - i * 2, 0, x - 2.5, 46); c.lineTo(x + 5.5, 46); c.quadraticCurveTo(x + 11 - i * 2, 0, x + 5.5, -46); c.closePath(); c.fill(); });
            c.fillStyle = "rgba(255,255,255,.4)"; ell(c, 6, -26, 26, 6, -0.1); c.fill(); c.restore();
            c.beginPath(); c.moveTo(-34, 0); c.quadraticCurveTo(-18, -44, 10, -42); c.quadraticCurveTo(46, -22, 44, 0); c.quadraticCurveTo(46, 22, 10, 42); c.quadraticCurveTo(-18, 44, -34, 0); c.closePath(); outline(c, "#7a4a00", 2.6);
            eye(c, 30, -8, 5.6);
            c.beginPath(); c.arc(43, 4, 3.4, 0.2, 2.2); outline(c, "#7a4a00", 1.8);
        } },
        /* ٥) سمكة البيتا: جسم صغير وذيل مروحي حريري بتدرّج وردي/بنفسجي */
        { key: "betta", name: "سمكة البيتا", len: 112, h: 78, draw: function (c, p) {
            var w = p.w, t = p.t;
            c.save(); c.translate(-8, 0);
            [[0.95, "rgba(255,80,140,.88)", 0], [0.78, "rgba(176,66,255,.86)", 0.22], [0.58, "rgba(255,150,190,.9)", 0.4]].forEach(function (L, i) {
                c.save(); c.rotate(w * 0.18 + Math.sin(t * 3 + i) * 0.06);
                var s = L[0];
                c.beginPath(); c.moveTo(0, 0);
                c.bezierCurveTo(-30 * s, -50 * s, -70 * s, -46 * s, -80 * s, -10 * s);
                c.bezierCurveTo(-90 * s, 8 * s, -84 * s, 28 * s, -76 * s, 40 * s);
                c.bezierCurveTo(-60 * s, 56 * s, -24 * s, 40 * s, 0, 0); c.closePath();
                c.fillStyle = L[1]; c.fill(); if (i === 0) outline(c, "#5a1a7a", 2.2);
                c.restore();
            });
            c.restore();
            c.beginPath(); c.moveTo(-6, 12); c.quadraticCurveTo(-14, 36, -34, 38 + w * 3); c.quadraticCurveTo(-20, 22, -6, 12); c.fillStyle = "rgba(255,90,150,.9)"; c.fill(); outline(c, "#5a1a7a", 1.8);
            ell(c, 14, 0, 30, 20); c.fillStyle = grad(c, 0, -20, 0, 20, [0, "#ff8fb8", 0.5, "#ff3d81", 1, "#9b1fa8"]); c.fill(); outline(c, "#5a1a7a", 2.4);
            c.save(); ell(c, 14, 0, 30, 20); c.clip(); c.fillStyle = "rgba(255,255,255,.3)"; ell(c, 14, -12, 20, 5, 0); c.fill(); c.restore();
            eye(c, 28, -4, 6);
            c.beginPath(); c.arc(41, 5, 3.6, 0.3, 2.1); outline(c, "#5a1a7a", 1.8);
        } },
        /* ٦) سمكة الإبرة: طويلة رشيقة بخطم مدبّب وشراع ظهري */
        { key: "needle", name: "سمكة الإبرة", len: 150, h: 46, draw: function (c, p) {
            var w = p.w;
            c.save(); c.translate(-58, 0); c.rotate(w * 0.3);
            c.beginPath(); c.moveTo(6, 0); c.lineTo(-18, -22); c.quadraticCurveTo(-10, 0, -18, 22); c.closePath();
            c.fillStyle = "#1f8f9c"; c.fill(); outline(c, "#0b3f55", 2.2); c.restore();
            c.beginPath(); c.moveTo(-34, -13); c.quadraticCurveTo(-10, -42, 20, -14); c.closePath(); c.fillStyle = "#38c6d9"; c.fill(); outline(c, "#0b3f55", 2.2);
            c.beginPath(); c.moveTo(60, -4); c.lineTo(104, 0); c.lineTo(60, 5); c.closePath(); c.fillStyle = "#9fe0ea"; c.fill(); outline(c, "#0b3f55", 2.2);
            c.beginPath(); c.moveTo(-60, 0); c.quadraticCurveTo(-52, -17, -10, -17); c.quadraticCurveTo(40, -18, 64, -5); c.lineTo(64, 6); c.quadraticCurveTo(36, 18, -10, 17); c.quadraticCurveTo(-52, 16, -60, 0); c.closePath();
            c.fillStyle = grad(c, 0, -18, 0, 18, [0, "#1ec0d8", 0.55, "#5ad7e8", 0.56, "#e8fbff", 1, "#ffffff"]); c.fill(); outline(c, "#0b3f55", 2.6);
            c.fillStyle = "rgba(255,255,255,.45)"; ell(c, -4, -9, 34, 3.6, 0); c.fill();
            c.beginPath(); c.moveTo(-20, 8); c.quadraticCurveTo(-26, 22, -40, 22 + w * 3); c.quadraticCurveTo(-30, 12, -20, 8); c.fillStyle = "#38c6d9"; c.fill(); outline(c, "#0b3f55", 1.8);
            eye(c, 52, -5, 5.2);
        } },
        /* ٧) الشفنين الوردي: جناحان مثلثان يرفرفان وذيل رفيع */
        { key: "ray", name: "الشفنين", len: 108, h: 92, draw: function (c, p) {
            var w = p.w, f = 1 + w * 0.28;
            c.beginPath(); c.moveTo(-40, 0); c.quadraticCurveTo(-64, 6 * w, -80, 2 + w * 8); outline(c, "#7a2a6a", 4.2);
            c.beginPath(); c.moveTo(-40, 0); c.quadraticCurveTo(-64, 6 * w, -80, 2 + w * 8); outline(c, "#d786c8", 2.2);
            c.beginPath(); c.moveTo(52, 0);
            c.bezierCurveTo(36, -22 * f, 4, -44 * f, -26, -46 * f); c.quadraticCurveTo(-34, -20 * f, -44, 0);
            c.quadraticCurveTo(-34, 20 * f, -26, 46 * f); c.bezierCurveTo(4, 44 * f, 36, 22 * f, 52, 0); c.closePath();
            c.fillStyle = grad(c, 0, -44, 0, 44, [0, "#ffb0e2", 0.5, "#ec6fc4", 1, "#a444c7"]); c.fill();
            c.save(); c.clip();
            c.fillStyle = "rgba(255,255,255,.42)";
            [[-6, -18, 4], [-18, 8, 3.4], [6, 14, 3], [-26, -8, 3.2], [14, -6, 2.6], [-12, 26, 2.6], [-10, -30, 2.8]].forEach(function (d) { c.beginPath(); c.arc(d[0], d[1] * f, d[2], 0, 6.2832); c.fill(); });
            c.restore();
            c.beginPath(); c.moveTo(52, 0); c.bezierCurveTo(36, -22 * f, 4, -44 * f, -26, -46 * f); c.quadraticCurveTo(-34, -20 * f, -44, 0);
            c.quadraticCurveTo(-34, 20 * f, -26, 46 * f); c.bezierCurveTo(4, 44 * f, 36, 22 * f, 52, 0); c.closePath(); outline(c, "#7a2a6a", 2.6);
            eye(c, 36, -9, 5.4); eye(c, 36, 9, 5.4);
            c.beginPath(); c.arc(46, 0, 3, 0.4, 2.7); outline(c, "#7a2a6a", 1.8);
        } },
        /* ٨) سمكة الوراس: طويلة بخط وردي وزعنفة ظهرية متصلة */
        { key: "wrasse", name: "الوراس", len: 128, h: 58, draw: function (c, p) {
            var w = p.w;
            c.save(); c.translate(-50, 0); c.rotate(w * 0.3);
            c.beginPath(); c.moveTo(6, 0); c.quadraticCurveTo(-8, -22, -22, -18); c.quadraticCurveTo(-30, 0, -22, 18); c.quadraticCurveTo(-8, 22, 6, 0);
            c.fillStyle = "#ff8fb8"; c.fill(); outline(c, "#0d5a4a", 2.2); c.restore();
            c.beginPath(); c.moveTo(-42, -14); c.quadraticCurveTo(-10, -34, 38, -15); c.quadraticCurveTo(0, -18, -42, -14); c.closePath();
            c.fillStyle = "#ff6b9d"; c.fill(); outline(c, "#0d5a4a", 2.2);
            ell(c, 0, 0, 56, 22); c.fillStyle = grad(c, 0, -22, 0, 22, [0, "#4be6c2", 0.5, "#19b8a0", 1, "#0e8a8a"]); c.fill();
            c.save(); ell(c, 0, 0, 56, 22); c.clip();
            c.fillStyle = "#ff6b9d"; c.beginPath(); c.moveTo(-60, 2); c.quadraticCurveTo(0, -4, 60, 4); c.lineTo(60, 10); c.quadraticCurveTo(0, 2, -60, 8); c.closePath(); c.fill();
            c.fillStyle = "rgba(255,255,255,.55)"; [-34, -16, 2, 20, 38].forEach(function (x, i) { c.beginPath(); c.arc(x, -9 + (i % 2) * 3, 2.3, 0, 6.2832); c.fill(); });
            c.fillStyle = "rgba(255,255,255,.3)"; ell(c, 4, -13, 34, 4.4, 0); c.fill(); c.restore();
            ell(c, 0, 0, 56, 22); outline(c, "#0d5a4a", 2.6);
            c.beginPath(); c.moveTo(-6, 12); c.quadraticCurveTo(-14, 28, -30, 28 + w * 3); c.quadraticCurveTo(-18, 16, -6, 12); c.fillStyle = "#ff8fb8"; c.fill(); outline(c, "#0d5a4a", 1.8);
            eye(c, 38, -5, 6);
            c.beginPath(); c.moveTo(54, 4); c.quadraticCurveTo(58, 8, 52, 9); outline(c, "#a02060", 2);
        } },
        /* ٩) سمكة الصندوق: مربّعة صفراء بنقاط سوداء */
        { key: "box", name: "سمكة الصندوق", len: 86, h: 64, draw: function (c, p) {
            var w = p.w;
            c.save(); c.translate(-34, 0); c.rotate(w * 0.35);
            c.beginPath(); c.moveTo(4, -3); c.lineTo(-14, -9); c.lineTo(-14, 9); c.lineTo(4, 3); c.closePath(); c.fillStyle = "#ffd60a"; c.fill(); outline(c, "#5a4300", 2.2); c.restore();
            c.beginPath(); c.roundRect ? c.roundRect(-34, -29, 70, 58, 20) : ell(c, 0, 0, 34, 29);
            c.fillStyle = grad(c, 0, -29, 0, 29, [0, "#fff07a", 0.55, "#ffd60a", 1, "#f2a900"]); c.fill();
            c.save(); c.clip();
            c.fillStyle = "#1c1c1c";
            for (var r = 0; r < 3; r++) for (var q = 0; q < 4; q++) { c.beginPath(); c.arc(-22 + q * 15 + (r % 2) * 6, -17 + r * 17, 3.1, 0, 6.2832); c.fill(); }
            c.fillStyle = "rgba(255,255,255,.4)"; ell(c, -2, -24, 24, 4.6, 0); c.fill(); c.restore();
            c.beginPath(); c.roundRect ? c.roundRect(-34, -29, 70, 58, 20) : ell(c, 0, 0, 34, 29); outline(c, "#5a4300", 2.6);
            c.save(); c.translate(0, 14); c.rotate(Math.sin(p.t * 12) * 0.5);
            c.beginPath(); c.ellipse(-4, 4, 9, 5, 0.5, 0, 6.2832); c.fillStyle = "#ffe066"; c.fill(); outline(c, "#5a4300", 1.6); c.restore();
            eye(c, 18, -8, 7);
            c.beginPath(); c.ellipse(33, 6, 3.6, 4.6, 0, 0, 6.2832); c.fillStyle = "#e8744c"; c.fill(); outline(c, "#5a4300", 1.6);
        } },
        /* ١٠) سمكة الثعبان الشريطية: جسم متموّج طويل وزعنفة صفراء */
        { key: "eel", name: "الثعبان الشريطي", len: 150, h: 54, draw: function (c, p) {
            var t = p.t, N = 24, i, pts = [], x, y, A, wd;
            for (i = 0; i <= N; i++) {
                x = 66 - i * (146 / N);
                A = 4 + (i / N) * 15;
                y = Math.sin(i * 0.5 - t * 4.2) * A * (i === 0 ? 0.3 : 1);
                wd = i === 0 ? 11 : 12 - i * 0.38;
                pts.push([x, y, Math.max(2.2, wd)]);
            }
            var top = [], bot = [];
            for (i = 0; i <= N; i++) {
                var a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
                var dx = b[0] - a[0], dy = b[1] - a[1], L = hyp(dx, dy) || 1, nx = -dy / L, ny = dx / L;
                top.push([pts[i][0] + nx * pts[i][2], pts[i][1] + ny * pts[i][2]]);
                bot.push([pts[i][0] - nx * pts[i][2], pts[i][1] - ny * pts[i][2]]);
            }
            c.beginPath(); c.moveTo(top[0][0], top[0][1]);
            for (i = 1; i <= N; i++) c.lineTo(top[i][0], top[i][1]);
            for (i = N; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]);
            c.closePath();
            c.fillStyle = grad(c, 70, 0, -80, 0, [0, "#33e0c2", 0.5, "#4d8dff", 1, "#8a4dff"]); c.fill(); outline(c, "#1b2a6b", 2.4);
            c.beginPath(); c.moveTo(pts[1][0], pts[1][1] - 1);
            for (i = 2; i <= N - 2; i++) c.lineTo(pts[i][0], pts[i][1] - pts[i][2] * 0.35);
            c.strokeStyle = "#ffe14a"; c.lineWidth = 3.2; c.lineCap = "round"; c.stroke();
            c.fillStyle = "rgba(255,255,255,.55)";
            for (i = 3; i < N - 2; i += 3) { c.beginPath(); c.arc(pts[i][0], pts[i][1] + pts[i][2] * 0.3, 1.9, 0, 6.2832); c.fill(); }
            ell(c, 64, 0, 14, 11.5, 0); c.fillStyle = grad(c, 0, -11, 0, 11, [0, "#7af0d8", 1, "#2fb0c8"]); c.fill(); outline(c, "#1b2a6b", 2.4);
            eye(c, 66, -4, 5);
            c.beginPath(); c.arc(74, 4, 3.2, 0.2, 2.4); outline(c, "#1b2a6b", 1.8);
        } },
        /* ١١) سمكة القرص: قرص برتقالي بخطوط فيروزية */
        { key: "discus", name: "سمكة القرص", len: 92, h: 88, draw: function (c, p) {
            var w = p.w;
            c.save(); c.translate(-36, 0); c.rotate(w * 0.3);
            c.beginPath(); c.moveTo(6, 0); c.quadraticCurveTo(-4, -14, -16, -10); c.quadraticCurveTo(-12, 0, -16, 10); c.quadraticCurveTo(-4, 14, 6, 0);
            c.fillStyle = "#ff8c42"; c.fill(); outline(c, "#7a3300", 2.2); c.restore();
            c.beginPath(); c.moveTo(-20, -30); c.quadraticCurveTo(0, -52, 24, -30); c.closePath(); c.fillStyle = "#2ec4b6"; c.fill(); outline(c, "#0b5d57", 2.2);
            c.beginPath(); c.moveTo(-20, 30); c.quadraticCurveTo(0, 52, 24, 30); c.closePath(); c.fillStyle = "#2ec4b6"; c.fill(); outline(c, "#0b5d57", 2.2);
            c.beginPath(); c.arc(0, 0, 38, 0, 6.2832); c.fillStyle = grad(c, 0, -38, 0, 38, [0, "#ffd08a", 0.5, "#ff9a3c", 1, "#e8601c"]); c.fill();
            c.save(); c.beginPath(); c.arc(0, 0, 38, 0, 6.2832); c.clip();
            c.strokeStyle = "rgba(46,196,182,.9)"; c.lineWidth = 5;
            [-26, -10, 8, 24].forEach(function (x) { c.beginPath(); c.moveTo(x, -40); c.quadraticCurveTo(x + 7, 0, x, 40); c.stroke(); });
            c.fillStyle = "rgba(255,255,255,.35)"; ell(c, -4, -24, 24, 6, -0.1); c.fill(); c.restore();
            c.beginPath(); c.arc(0, 0, 38, 0, 6.2832); outline(c, "#7a3300", 2.6);
            eye(c, 24, -8, 6.6);
            c.beginPath(); c.arc(36, 4, 3.6, 0.3, 2.2); outline(c, "#7a3300", 1.8);
        } },
        /* ١٢) حصان البحر: قوام منتصب بذيل ملتفّ */
        { key: "seahorse", name: "حصان البحر", len: 66, h: 112, draw: function (c, p) {
            var w = p.w;
            c.save(); c.translate(-6, -2);
            c.beginPath(); c.moveTo(-6, -6); c.quadraticCurveTo(-30, -8 + w * 4, -26, 14); c.quadraticCurveTo(-22, 34, -6, 28);
            c.fillStyle = "rgba(255,209,102,.9)"; c.fill(); outline(c, "#9a5b00", 2); c.restore();
            c.lineCap = "round"; c.lineJoin = "round";
            c.beginPath(); c.moveTo(6, -30); c.bezierCurveTo(-8, -14, 16, -2, 8, 16); c.bezierCurveTo(2, 32, -8, 46, 10, 48); c.bezierCurveTo(22, 48, 20, 36, 12, 38);
            c.strokeStyle = "#9a5b00"; c.lineWidth = 22; c.stroke();
            c.strokeStyle = "#ff9f1c"; c.lineWidth = 18; c.stroke();
            c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 4; c.save(); c.translate(-4, -2); c.stroke(); c.restore();
            c.fillStyle = "#ffd166"; for (var i = 0; i < 4; i++) { c.beginPath(); c.arc(8 - i * 1.5, -8 + i * 11, 3, 0, 6.2832); c.fill(); }
            ell(c, 8, -38, 15, 12, 0.2); c.fillStyle = "#ffa733"; c.fill(); outline(c, "#9a5b00", 2.2);
            c.beginPath(); c.moveTo(18, -42); c.lineTo(36, -38); c.lineTo(36, -31); c.lineTo(19, -30); c.closePath(); c.fillStyle = "#ffb84d"; c.fill(); outline(c, "#9a5b00", 2.2);
            c.fillStyle = "#e85d04"; [-6, 2, 10].forEach(function (x) { c.beginPath(); c.moveTo(x - 3, -47); c.lineTo(x, -56); c.lineTo(x + 3, -47); c.closePath(); c.fill(); });
            eye(c, 10, -41, 5);
        } },
        /* ١٣) سمكة الأسد: خطوط حمراء وبيضاء وزعانف مروحية */
        { key: "lion", name: "سمكة الأسد", len: 112, h: 92, draw: function (c, p) {
            var w = p.w, i;
            c.save(); c.translate(-38, 0); c.rotate(w * 0.28);
            c.beginPath(); c.moveTo(4, 0); c.quadraticCurveTo(-10, -18, -24, -14); c.quadraticCurveTo(-16, 0, -24, 14); c.quadraticCurveTo(-10, 18, 4, 0);
            c.fillStyle = "rgba(255,140,120,.95)"; c.fill(); outline(c, "#7a1f1a", 2.2); c.restore();
            for (i = 0; i < 8; i++) { var a = -2.55 + i * 0.22; c.beginPath(); c.moveTo(Math.cos(a) * 20, Math.sin(a) * 18); c.lineTo(Math.cos(a) * 46, Math.sin(a) * 42); c.strokeStyle = "#c0392b"; c.lineWidth = 3.4; c.lineCap = "round"; c.stroke(); }
            c.save(); c.translate(6, 8); c.rotate(0.4 + w * 0.15);
            c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-40, 6, -44, 34); c.quadraticCurveTo(-12, 28, 8, 8); c.closePath();
            c.fillStyle = "rgba(255,200,180,.92)"; c.fill(); outline(c, "#7a1f1a", 2); c.strokeStyle = "rgba(192,57,43,.8)"; c.lineWidth = 2;
            for (i = 1; i < 5; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(-i * 9, 8 + i * 6); c.stroke(); } c.restore();
            ell(c, 0, 0, 38, 24); c.fillStyle = "#fff"; c.fill();
            c.save(); ell(c, 0, 0, 38, 24); c.clip();
            c.fillStyle = "#d94a38"; [-28, -14, 0, 14, 28].forEach(function (x) { c.beginPath(); c.moveTo(x - 4, -26); c.quadraticCurveTo(x + 2, 0, x - 4, 26); c.lineTo(x + 3, 26); c.quadraticCurveTo(x + 9, 0, x + 3, -26); c.closePath(); c.fill(); });
            c.fillStyle = "rgba(255,255,255,.35)"; ell(c, 2, -15, 22, 4.4, 0); c.fill(); c.restore();
            ell(c, 0, 0, 38, 24); outline(c, "#7a1f1a", 2.6);
            eye(c, 25, -6, 6);
            c.beginPath(); c.arc(37, 4, 3.4, 0.3, 2.1); outline(c, "#7a1f1a", 1.8);
        } },
        /* ١٤) سمكة الزناد: جسم مائل بزعنفتين ظهريتين وذيل هلالي */
        { key: "trigger", name: "سمكة الزناد", len: 98, h: 66, draw: function (c, p) {
            var w = p.w;
            c.save(); c.translate(-38, 0); c.rotate(w * 0.3);
            c.beginPath(); c.moveTo(6, 0); c.lineTo(-14, -20); c.quadraticCurveTo(-8, 0, -14, 20); c.closePath();
            c.fillStyle = "#ff9f1c"; c.fill(); outline(c, "#14325a", 2.2); c.restore();
            c.beginPath(); c.moveTo(-26, -20); c.quadraticCurveTo(-8, -36, 8, -24); c.closePath(); c.fillStyle = "#2f7fd6"; c.fill(); outline(c, "#14325a", 2.2);
            c.beginPath(); c.moveTo(12, -24); c.lineTo(20, -38); c.lineTo(24, -20); c.closePath(); c.fillStyle = "#14325a"; c.fill();
            c.beginPath(); c.moveTo(-30, 18); c.quadraticCurveTo(-10, 34, 8, 22); c.closePath(); c.fillStyle = "#2f7fd6"; c.fill(); outline(c, "#14325a", 2.2);
            c.beginPath(); c.moveTo(-40, 0); c.quadraticCurveTo(-34, -24, -4, -26); c.quadraticCurveTo(34, -24, 46, -2); c.quadraticCurveTo(30, 24, -4, 26); c.quadraticCurveTo(-34, 24, -40, 0); c.closePath();
            c.fillStyle = grad(c, 0, -26, 0, 26, [0, "#7fc4ff", 0.55, "#3b8be0", 1, "#ff9f1c"]); c.fill();
            c.save(); c.clip(); c.strokeStyle = "rgba(255,225,80,.95)"; c.lineWidth = 3; c.lineCap = "round";
            [[-24, -6], [-8, -2], [8, 2]].forEach(function (a) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0] + 14, a[1] + 8); c.stroke(); });
            c.fillStyle = "rgba(255,255,255,.35)"; ell(c, 0, -17, 26, 4.6, 0); c.fill(); c.restore();
            c.beginPath(); c.moveTo(-40, 0); c.quadraticCurveTo(-34, -24, -4, -26); c.quadraticCurveTo(34, -24, 46, -2); c.quadraticCurveTo(30, 24, -4, 26); c.quadraticCurveTo(-34, 24, -40, 0); c.closePath(); outline(c, "#14325a", 2.6);
            eye(c, 24, -8, 5.4);
            c.beginPath(); c.ellipse(45, 3, 3.4, 4.2, 0, 0, 6.2832); c.fillStyle = "#ff7b54"; c.fill(); outline(c, "#14325a", 1.6);
        } }
    ];
    SPECIES.forEach(function (s) { s.ry = s.h / 2; });

    /* القرش اللطيف: ابتسامة كبيرة وعينان واسعتان وخدّان ورديان، بلا أنياب حادّة */
    var SHARK = { key: "shark", name: "القرش اللطيف", len: 210, h: 120 };
    SHARK.draw = function (c, p) {
        var w = p.w;
        c.save(); c.translate(-82, -2); c.rotate(w * 0.24);
        c.beginPath(); c.moveTo(10, 0); c.bezierCurveTo(-8, -12, -20, -46, -44, -54); c.bezierCurveTo(-34, -28, -36, -10, -34, -2);
        c.bezierCurveTo(-36, 12, -30, 30, -42, 44); c.bezierCurveTo(-20, 38, -6, 14, 10, 0); c.closePath();
        c.fillStyle = grad(c, 0, -54, 0, 44, [0, "#5fb6ee", 1, "#2d82c2"]); c.fill(); outline(c, "#14507f", 3); c.restore();
        c.beginPath(); c.moveTo(-34, -34); c.quadraticCurveTo(-30, -84, -8, -92); c.quadraticCurveTo(-8, -62, 14, -40); c.closePath();
        c.fillStyle = "#3f95d6"; c.fill(); outline(c, "#14507f", 3);
        c.beginPath(); c.moveTo(106, 4); c.bezierCurveTo(100, -34, 40, -58, -30, -42); c.bezierCurveTo(-64, -34, -82, -12, -86, -2);
        c.bezierCurveTo(-76, 14, -50, 40, -10, 46); c.bezierCurveTo(46, 52, 98, 36, 106, 4); c.closePath();
        c.fillStyle = grad(c, 0, -56, 0, 50, [0, "#6cc0f2", 0.45, "#3f95d6", 0.7, "#2d82c2", 1, "#2d82c2"]); c.fill();
        c.save(); c.clip();
        c.beginPath(); c.moveTo(110, 8); c.bezierCurveTo(70, 8, 26, 14, -20, 22); c.bezierCurveTo(-50, 28, -80, 18, -92, 10); c.lineTo(-92, 70); c.lineTo(110, 70); c.closePath();
        c.fillStyle = grad(c, 0, 8, 0, 54, [0, "#ffffff", 1, "#d6ecff"]); c.fill();
        c.fillStyle = "rgba(255,255,255,.35)"; ell(c, 10, -34, 62, 7, -0.08); c.fill();
        c.restore();
        c.beginPath(); c.moveTo(106, 4); c.bezierCurveTo(100, -34, 40, -58, -30, -42); c.bezierCurveTo(-64, -34, -82, -12, -86, -2);
        c.bezierCurveTo(-76, 14, -50, 40, -10, 46); c.bezierCurveTo(46, 52, 98, 36, 106, 4); c.closePath(); outline(c, "#14507f", 3.2);
        c.save(); c.translate(8, 18); c.rotate(0.55 + w * 0.2);
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-18, 30, -42, 34); c.quadraticCurveTo(-26, 14, -10, -2); c.closePath();
        c.fillStyle = "#4aa1de"; c.fill(); outline(c, "#14507f", 2.6); c.restore();
        c.strokeStyle = "rgba(20,80,127,.5)"; c.lineWidth = 2.2; c.lineCap = "round";
        [0, 1, 2].forEach(function (i) { c.beginPath(); c.moveTo(26 - i * 7, -4 + i * 1.5); c.quadraticCurveTo(22 - i * 7, 8, 26 - i * 7, 18); c.stroke(); });
        eye(c, 66, -14, 13.5);
        c.strokeStyle = "#14507f"; c.lineWidth = 3; c.beginPath(); c.moveTo(54, -32); c.quadraticCurveTo(66, -38, 78, -32); c.stroke();
        c.fillStyle = "rgba(255,120,150,.55)"; ell(c, 56, 12, 11, 7, 0); c.fill();
        c.beginPath(); c.moveTo(98, 12); c.quadraticCurveTo(70, 40, 40, 20);
        c.strokeStyle = "#0d3a5c"; c.lineWidth = 3.4; c.stroke();
        c.fillStyle = "#fff";
        [[88, 20], [78, 25], [68, 28], [58, 28], [48, 25]].forEach(function (t) {
            c.beginPath(); c.moveTo(t[0] - 4.2, t[1] - 3.6); c.quadraticCurveTo(t[0], t[1] + 5, t[0] + 4.2, t[1] - 4.4); c.closePath(); c.fill();
        });
        c.strokeStyle = "#0d3a5c"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(98, 12); c.quadraticCurveTo(70, 40, 40, 20); c.stroke();
    };

    /* =========================================================
       🏗️ بناء الواجهة
       ========================================================= */
    var ICON_BACK = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var ICON_SPK = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
    var ICON_MENU = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
    var ICON_FLIP = '<svg viewBox="0 0 64 40" width="54" height="34" aria-hidden="true"><path d="M8 20h48" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M20 8L8 20l12 12M44 8l12 12-12 12" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    function build() {
        if (G.built) return;
        G.built = true;
        sec.innerHTML =
            '<div class="sg-bar">' +
            '<button type="button" class="sg-btn sg-back" id="sgBack" aria-label="العودة إلى قسم الأرقام">' + ICON_BACK + '<span>رجوع</span></button>' +
            '<div class="sg-title">مغامرة الغواصة <small>صياد الأرقام</small></div>' +
            '<div class="sg-seg" role="group" aria-label="نمط التحكم">' +
            '<button type="button" class="sg-segbtn" data-mode="easy" aria-pressed="true">التحكم السهل</button>' +
            '<button type="button" class="sg-segbtn" data-mode="free" aria-pressed="false">التحكم الحر</button></div>' +
            '<button type="button" class="sg-btn" id="sgListen" aria-label="اسمع العدد المطلوب">' + ICON_SPK + '<span>اسمع</span></button>' +
            '<button type="button" class="sg-btn" id="sgMenu" aria-label="تغيير العدد أو المستوى">' + ICON_MENU + '<span>العدد</span></button>' +
            '</div>' +
            '<div class="sg-stage" id="sgStage">' +
            '<canvas id="sgCanvas" aria-label="بحر اللعبة: اسحب الأسماك إلى فتحة الغواصة"></canvas>' +
            '<div class="sg-menu" id="sgMenuPanel" role="dialog" aria-label="اختيار العدد"></div>' +
            '<div class="sg-win" id="sgWin" hidden></div>' +
            '</div>' +
            '<div class="sg-dock" id="sgDock">' +
            '<div class="sg-joywrap" id="sgJoyWrap"><div class="sg-joy" id="sgJoy" role="application" aria-label="عصا التحكم بالغواصة">' +
            '<svg class="sg-joy-arrows" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8l11 14H39zM50 92L39 78h22zM8 50l14-11v22zM92 50L78 39v22z" fill="currentColor"/></svg>' +
            '<div class="sg-knob" id="sgKnob"></div></div></div>' +
            '<div class="sg-counter" id="sgCounter" role="status" aria-live="polite"><span class="sg-c-lbl">جمعت</span><span class="sg-c-n" id="sgCn">٠</span><span class="sg-c-of">من</span><span class="sg-c-t" id="sgCt">٠</span></div>' +
            '<button type="button" class="sg-flip" id="sgFlip" aria-label="تغيير اتجاه الغواصة">' + ICON_FLIP + '<span>اتجاه الغواصة</span></button>' +
            '</div>';
        dom.bar = sec.querySelector(".sg-bar");
        dom.stage = document.getElementById("sgStage");
        dom.canvas = document.getElementById("sgCanvas");
        dom.menu = document.getElementById("sgMenuPanel");
        dom.win = document.getElementById("sgWin");
        dom.joy = document.getElementById("sgJoy");
        dom.knob = document.getElementById("sgKnob");
        dom.flip = document.getElementById("sgFlip");
        dom.cn = document.getElementById("sgCn");
        dom.ct = document.getElementById("sgCt");
        dom.dock = document.getElementById("sgDock");
        dom.counter = document.getElementById("sgCounter");
        ctx = dom.canvas.getContext("2d");

        buildMenu();
        bind();
        applyMode();
    }

    function buildMenu() {
        var h = '<div class="sgm-card"><h2>اختر عددًا لتصطاده</h2>' +
            '<div class="sgm-levels" role="group" aria-label="المستويات">';
        LEVELS.forEach(function (L) {
            h += '<button type="button" class="sgm-level" data-level="' + L.id + '"><b>' + L.label + '</b><small>عدد يتغيّر كل مرة</small></button>';
        });
        h += '</div><div class="sgm-or">أو اختر عددًا محددًا</div><div class="sgm-nums" role="group" aria-label="العدد المستهدف">';
        for (var n = 1; n <= 10; n++) h += '<button type="button" class="sgm-num" data-num="' + n + '" aria-label="العدد ' + ar(n) + '">' + ar(n) + '</button>';
        h += '</div><div class="sgm-mode" role="group" aria-label="نمط التحكم"><button type="button" class="sgm-modebtn" data-mode="easy" aria-pressed="true"><b>التحكم السهل</b><small>الغواصة ثابتة، اسحب الأسماك إليها</small></button>' +
            '<button type="button" class="sgm-modebtn" data-mode="free" aria-pressed="false"><b>التحكم الحر</b><small>قُد الغواصة بالعصا ثم اسحب الأسماك</small></button></div></div>';
        dom.menu.innerHTML = h;
    }

    function applyMode() {
        sec.setAttribute("data-mode", G.mode);
        Array.prototype.forEach.call(sec.querySelectorAll("[data-mode]"), function (b) {
            if (b.tagName === "BUTTON") b.setAttribute("aria-pressed", b.getAttribute("data-mode") === G.mode ? "true" : "false");
        });
        dom.joy.parentNode.style.visibility = G.mode === "free" ? "visible" : "hidden";
        dom.flip.style.visibility = G.mode === "free" ? "visible" : "hidden";
        if (G.mode === "easy") { G.joy.x = 0; G.joy.y = 0; G.joy.id = null; moveKnob(0, 0); }
        dom.joy.parentNode.setAttribute("aria-hidden", G.mode === "free" ? "false" : "true");
    }

    function setMode(m) {
        G.mode = m === "free" ? "free" : "easy";
        applyMode();
        try { localStorage.setItem("taha_submarine_mode_v1", G.mode); } catch (e) { /* لا شيء */ }
    }

    /* =========================================================
       🖱️ ربط الأحداث
       ========================================================= */
    function bind() {
        document.getElementById("sgBack").addEventListener("click", exitGame);
        document.getElementById("sgListen").addEventListener("click", function () { if (G.phase === "play") { audioReset(); sayNumber(G.target); } });
        document.getElementById("sgMenu").addEventListener("click", showMenu);
        Array.prototype.forEach.call(sec.querySelectorAll("[data-mode]"), function (b) {
            if (b.tagName === "BUTTON") b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); });
        });
        dom.menu.addEventListener("click", function (e) {
            var t = e.target.closest("button");
            if (!t) return;
            if (t.hasAttribute("data-level")) startRound({ type: "level", id: Number(t.getAttribute("data-level")) });
            else if (t.hasAttribute("data-num")) startRound({ type: "num", n: Number(t.getAttribute("data-num")) });
        });
        dom.win.addEventListener("click", function (e) {
            var t = e.target.closest("button");
            if (!t) return;
            var a = t.getAttribute("data-act");
            if (a === "again") startRound(G.sel);
            else if (a === "menu") showMenu();
            else if (a === "back") exitGame();
        });
        dom.flip.addEventListener("pointerdown", function (e) { e.preventDefault(); flipSub(); });
        dom.flip.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flipSub(); } });

        /* عصا التحكم: مؤشرها مستقل عن مؤشرات السحب (لمس متعدد) */
        dom.joy.addEventListener("pointerdown", function (e) {
            if (G.joy.id !== null) return;
            e.preventDefault();
            G.joy.id = e.pointerId;
            try { dom.joy.setPointerCapture(e.pointerId); } catch (x) { /* لا شيء */ }
            joyUpdate(e);
        });
        dom.joy.addEventListener("pointermove", function (e) { if (e.pointerId === G.joy.id) { e.preventDefault(); joyUpdate(e); } });
        function joyEnd(e) { if (e.pointerId === G.joy.id) { G.joy.id = null; G.joy.x = 0; G.joy.y = 0; moveKnob(0, 0); } }
        dom.joy.addEventListener("pointerup", joyEnd);
        dom.joy.addEventListener("pointercancel", joyEnd);
        dom.joy.addEventListener("lostpointercapture", joyEnd);

        /* سحب الأسماك على اللوحة */
        var cv = dom.canvas;
        cv.addEventListener("pointerdown", onDown);
        cv.addEventListener("pointermove", onMove);
        cv.addEventListener("pointerup", onUp);
        cv.addEventListener("pointercancel", onUp);
        cv.addEventListener("lostpointercapture", function (e) { if (G.pointers[e.pointerId]) onUp(e); });
        cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });

        document.addEventListener("keydown", onKey);
        document.addEventListener("keyup", onKey);
        window.addEventListener("resize", onResize);
        window.addEventListener("orientationchange", function () { setTimeout(onResize, 250); });
        document.addEventListener("visibilitychange", function () { if (document.hidden) stopLoop(); else if (active()) startLoop(); });
        if (window.ResizeObserver) { try { new ResizeObserver(onResize).observe(dom.stage); } catch (e) { /* لا شيء */ } }
    }

    function joyUpdate(e) {
        var r = dom.joy.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2;
        var dx = e.clientX - cx, dy = e.clientY - cy, L = hyp(dx, dy);
        var lim = R * 0.78;
        if (L > lim) { dx *= lim / L; dy *= lim / L; L = lim; }
        moveKnob(dx, dy);
        var nx = dx / lim, ny = dy / lim, m = hyp(nx, ny);
        if (m < 0.14) { G.joy.x = 0; G.joy.y = 0; }
        else { var k = (m - 0.14) / (1 - 0.14) / m; G.joy.x = nx * k; G.joy.y = ny * k; }
    }
    function moveKnob(dx, dy) { dom.knob.style.transform = "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px))"; }

    function onKey(e) {
        if (!active() || G.phase !== "play") return;
        var tg = e.target && e.target.tagName;
        if (tg === "INPUT" || tg === "TEXTAREA" || tg === "SELECT") return;
        var k = e.code, down = e.type === "keydown";
        var map = { ArrowLeft: "l", ArrowRight: "r", ArrowUp: "u", ArrowDown: "d", KeyA: "l", KeyD: "r", KeyW: "u", KeyS: "d" };
        if (map[k]) { G.keys[map[k]] = down; if (G.mode === "free") e.preventDefault(); return; }
        if (down && !e.repeat && (k === "KeyF" || k === "ShiftLeft" || k === "ShiftRight") && G.mode === "free") { e.preventDefault(); flipSub(); }
    }

    function flipSub() {
        if (G.phase !== "play" && G.phase !== "win") return;
        G.sub.faceTarget = -G.sub.faceTarget;
        dom.flip.classList.remove("sg-pulse"); void dom.flip.offsetWidth; dom.flip.classList.add("sg-pulse");
    }

    /* ---- تحويل إحداثيات المؤشر إلى إحداثيات اللوحة ---- */
    function pt(e) {
        var r = dom.canvas.getBoundingClientRect();
        return { x: (e.clientX - r.left) * (G.W / r.width), y: (e.clientY - r.top) * (G.H / r.height) };
    }
    function hitFish(f, x, y) {
        var sp = f.sp, pad = Math.max(16, 20 * G.F), minR = 46;   /* مساحة إمساك لا تقل عن ٤٦ بكسل حول مركز السمكة */
        var rx = Math.max(sp.len * f.k * G.F * 0.5 + pad, minR), ry = Math.max(sp.h * f.k * G.F * 0.5 + pad, minR);
        var dx = x - f.x, dy = y - f.y;
        var v = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
        return v <= 1 ? v : -1;
    }
    function onDown(e) {
        if (G.phase !== "play" || G.celebrate > 0) return;
        audioCtx();
        var p = pt(e), best = null, bv = 9, i, f, v;
        var list = fishList();
        for (i = list.length - 1; i >= 0; i--) {
            f = list[i];
            if (f.state !== "swim" && f.state !== "return") continue;
            if (f.kind === "shark" && f.appear < 0.6) continue;
            v = hitFish(f, p.x, p.y);
            if (v >= 0 && v < bv) { bv = v; best = f; }
        }
        if (!best) {
            /* لا لمسة دقيقة؟ نلتقط أقرب سمكة ضمن ٧٢ بكسل (سامح مع الأصابع الصغيرة) */
            var bd = 72;
            for (i = list.length - 1; i >= 0; i--) {
                f = list[i];
                if (f.state !== "swim" && f.state !== "return") continue;
                v = hyp(f.x - p.x, f.y - p.y);
                if (v < bd) { bd = v; best = f; }
            }
        }
        if (!best) return;
        e.preventDefault();
        try { dom.canvas.setPointerCapture(e.pointerId); } catch (x) { /* لا شيء */ }
        best.state = "drag";
        best.drag = { id: e.pointerId, ox: best.x - p.x, oy: best.y - p.y, tx: p.x, ty: p.y, lx: best.x, ly: best.y, vx: 0, vy: 0 };
        G.pointers[e.pointerId] = best;
        best.grabT = G.t;
        G.stats.grabs++;
        /* السمكة المسحوبة تُرسم فوق الباقي */
        bringToFront(best);
    }
    function onMove(e) {
        var f = G.pointers[e.pointerId];
        if (!f) return;
        e.preventDefault();
        var p = pt(e);
        f.drag.tx = p.x; f.drag.ty = p.y;
    }
    function onUp(e) {
        var f = G.pointers[e.pointerId];
        if (!f) return;
        delete G.pointers[e.pointerId];
        try { dom.canvas.releasePointerCapture(e.pointerId); } catch (x) { /* لا شيء */ }
        releaseFish(f);
    }
    function fishList() { return G.fish.concat(G.shark ? [G.shark] : []); }
    function bringToFront(f) {
        if (f === G.shark) return;
        var i = G.fish.indexOf(f);
        if (i >= 0) { G.fish.splice(i, 1); G.fish.push(f); }
    }

    /* =========================================================
       🎮 الجولة
       ========================================================= */
    function loadProgress() {
        try { var o = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); return (o && typeof o === "object") ? o : {}; } catch (e) { return {}; }
    }
    function saveProgress(n) {
        try {
            var o = loadProgress();
            o.v = 1;
            o.rounds = (Number(o.rounds) || 0) + 1;
            o.targets = (o.targets && typeof o.targets === "object") ? o.targets : {};
            o.targets[n] = (Number(o.targets[n]) || 0) + 1;
            o.last = Date.now();
            localStorage.setItem(PROGRESS_KEY, JSON.stringify(o));
        } catch (e) { /* التخزين ممتلئ أو ممنوع: لا نعطّل اللعبة */ }
    }

    function pickTarget(sel) {
        if (sel.type === "num") return clamp(sel.n, 1, 10);
        var L = LEVELS[sel.id - 1] || LEVELS[0], n, tries = 0;
        do { n = L.min + Math.floor(Math.random() * (L.max - L.min + 1)); tries++; } while (n === G.lastTarget && tries < 6 && L.max > L.min);
        return n;
    }

    function startRound(sel, forced) {
        build();
        measure();
        G.sel = sel;
        G.target = forced || pickTarget(sel);
        G.lastTarget = G.target;
        G.count = 0;
        G.phase = "play";
        G.sharkShown = false;
        G.shark = null;
        G.celebrate = 0;
        G.pointers = {};
        G.slotsPop = [];
        G.collected = [];
        G.parts.length = 0;
        audioReset();
        dom.menu.classList.remove("sg-open");
        dom.win.hidden = true;
        dom.win.innerHTML = "";
        dom.canvas.style.pointerEvents = "auto";
        spawnFish();
        if (G.target === 1) spawnShark(true);
        resetSub();
        updateCounter(false);
        Array.prototype.forEach.call(dom.menu.querySelectorAll(".sgm-level,.sgm-num"), function (b) {
            var on = (sel.type === "level" && Number(b.getAttribute("data-level")) === sel.id) || (sel.type === "num" && Number(b.getAttribute("data-num")) === sel.n);
            b.classList.toggle("on", on);
        });
        sayNumber(G.target);
        if (active()) startLoop();
    }

    function showMenu() {
        build();
        G.phase = "menu";
        audioReset();
        dom.win.hidden = true;
        dom.menu.classList.add("sg-open");
        dom.canvas.style.pointerEvents = "none";
        Object.keys(G.pointers).forEach(function (k) { releaseFish(G.pointers[k]); });
        G.pointers = {};
        if (!G.fish.length) { G.target = 5; G.count = 0; spawnFish(); resetSub(); updateCounter(false); }
    }

    function resetSub() {
        var s = G.sub;
        s.x = G.W * 0.5; s.y = G.H * 0.47;
        s.vx = s.vy = 0; s.pitch = 0; s.jump = 0; s.spin = 0;
        var d = (G.sub.faceTarget || 1);
        s.face = d; s.faceTarget = d;
    }

    function spawnFish() {
        G.fish = [];
        var total = G.target + (EXTRA[G.target] || 3);
        var order = SPECIES.map(function (_, i) { return i; });
        for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
        var placed = [];
        for (var n = 0; n < total; n++) {
            var sp = SPECIES[order[n % order.length]];
            var k = rnd(0.88, 1.16);
            var f = {
                id: n, sp: sp, k: k, x: 0, y: 0, vx: 0, vy: 0, face: Math.random() < 0.5 ? 1 : -1, faceT: 1, tilt: 0,
                state: "swim", ph: rnd(0, 6.28), wt: 0, wx: 0, wy: 0, sp0: rnd(34, 62), shake: 0, drag: null, pop: 0, kind: "fish"
            };
            f.faceT = f.face;
            var tries = 0, ok;
            do {
                f.x = rnd(G.W * 0.06, G.W * 0.94); f.y = rnd(G.H * 0.08, G.groundY - 24);
                ok = !insideSubZone(f.x, f.y, 1.25) && placed.every(function (q) { return hyp(q.x - f.x, q.y - f.y) > (q.sp.len * q.k + sp.len * k) * G.F * 0.5; });
                tries++;
            } while (!ok && tries < 160);
            placed.push(f);
            f.vx = f.face * f.sp0 * G.F * 0.6;
            pickWaypoint(f);
            G.fish.push(f);
        }
    }

    function spawnShark(atStart) {
        var f = {
            id: 99, sp: SHARK, k: 1, x: 0, y: 0, vx: 0, vy: 0, face: 1, faceT: 1, tilt: 0, state: "swim",
            ph: 0, wt: 0, wx: 0, wy: 0, sp0: 30, shake: 0, drag: null, pop: 0, kind: "shark", entering: false, appear: 0
        };
        var side = Math.random() < 0.5 ? -1 : 1;
        /* يظهر القرش دائمًا كاملًا داخل الشاشة: يتلألأ ويكبر بلطف من نقطة قرب الجانب مع فقاعات */
        var half = SHARK.len * G.F * 0.5 + 18;
        f.x = side < 0 ? half + 8 : G.W - half - 8; f.y = atStart ? G.H * 0.2 : rnd(G.H * 0.14, G.H * 0.3);
        if (atStart) f.appear = 1;
        f.face = side < 0 ? 1 : -1; f.faceT = f.face;
        f.vx = f.face * 40 * G.F; f.vy = 0;
        pickWaypoint(f);
        G.shark = f;
        G.sharkShown = true;
        if (!atStart) { sfx("shark", 300); for (var i = 0; i < 14; i++) bubble(f.x + rnd(-half * 0.8, half * 0.8), f.y + rnd(-40, 40), 1); }
    }

    function insideSubZone(x, y, m) {
        var L = G.subL, s = G.sub;
        var dx = (x - s.x) / (L * 0.7 * (m || 1)), dy = (y - s.y + L * 0.07) / (L * 0.48 * (m || 1));
        return dx * dx + dy * dy < 1;
    }

    function pickWaypoint(f) {
        var tries = 0, x, y;
        var mx = f.sp.len * f.k * G.F * (f.kind === "shark" ? 0.5 : 0.4) + (f.kind === "shark" ? 8 : 0), my = Math.max(f.sp.h * f.k * G.F * 0.5, 24);
        do {
            x = rnd(mx, G.W - mx); y = rnd(my + 4, G.groundY - my);
            tries++;
        } while (insideSubZone(x, y, 1.2) && tries < 24);
        f.wx = x; f.wy = y;
        f.wt = rnd(2.2, 5.5);
    }

    /* =========================================================
       🧠 تحديث الحالة
       ========================================================= */
    function updateCounter(bump) {
        dom.cn.textContent = ar(G.count);
        dom.ct.textContent = ar(G.target);
        dom.counter.setAttribute("aria-label", "جمعت " + ar(G.count) + " من " + ar(G.target));
        if (bump) { dom.counter.classList.remove("sg-bump"); void dom.counter.offsetWidth; dom.counter.classList.add("sg-bump"); }
    }

    function hatchWorld() {
        var s = G.sub, L = G.subL, cs = Math.cos(s.pitch), sn = Math.sin(s.pitch);
        var lx = 0.17 * s.face * L, ly = -0.255 * L;
        G.hatch.x = s.x + lx * cs - ly * sn;
        G.hatch.y = s.y + lx * sn + ly * cs;
        G.hatch.r = Math.max(0.17 * L, 40 * Math.min(1.2, G.F));
    }

    function subBounds() {
        var L = G.subL;
        return { x0: L * 0.5 + 6, x1: G.W - L * 0.5 - 6, y0: L * 0.5 + 18, y1: G.groundY - L * 0.2 };
    }

    function step(dt) {
        var s = G.sub, i, f;
        G.t += dt;

        /* ---- الغواصة ---- */
        var ix = 0, iy = 0;
        if (G.mode === "free" && G.phase !== "menu") {
            ix = G.joy.x; iy = G.joy.y;
            if (G.keys.l) ix -= 1; if (G.keys.r) ix += 1; if (G.keys.u) iy -= 1; if (G.keys.d) iy += 1;
            var m = hyp(ix, iy); if (m > 1) { ix /= m; iy /= m; }
        }
        var maxV = 250 * Math.min(1.25, Math.max(0.7, G.F)) * 1.0;
        var ax = 1 - Math.exp(-dt * (ix || iy ? 4.2 : 3.0));
        s.vx += (ix * maxV - s.vx) * ax;
        s.vy += (iy * maxV * 0.8 - s.vy) * ax;
        s.x += s.vx * dt; s.y += s.vy * dt;
        var B = subBounds();
        if (s.x < B.x0) { s.x = B.x0; if (s.vx < 0) s.vx *= 0.2; }
        if (s.x > B.x1) { s.x = B.x1; if (s.vx > 0) s.vx *= 0.2; }
        if (s.y < B.y0) { s.y = B.y0; if (s.vy < 0) s.vy *= 0.2; }
        if (s.y > B.y1) { s.y = B.y1; if (s.vy > 0) s.vy *= 0.2; }
        if (G.mode === "easy" && G.phase !== "menu") {
            /* السهل: عودة لطيفة إلى المنتصف + طفو هادئ */
            var hx = G.W * 0.5, hy = G.H * 0.47;
            s.x += (hx - s.x) * Math.min(1, dt * 2.2); s.y += (hy - s.y) * Math.min(1, dt * 2.2);
        }
        s.bob += dt * 1.7;
        var bobY = Math.sin(s.bob) * 3.2 * G.F;
        s.pitchT = clamp((s.vy / maxV) * 0.16 * (s.face >= 0 ? 1 : 1), -0.2, 0.2);
        s.pitch += (s.pitchT - s.pitch) * Math.min(1, dt * 6);
        s.drawY = s.y + bobY;
        s.prop += dt * (5 + hyp(s.vx, s.vy) * 0.06) * 6;
        /* الاتجاه: تحوّل سلس */
        s.face += (s.faceTarget - s.face) * Math.min(1, dt * 7.5);
        if (Math.abs(s.face - s.faceTarget) < 0.01) s.face = s.faceTarget;
        if (G.celebrate > 0) { s.jump = Math.sin(clamp(1 - G.celebrate / 2.4, 0, 1) * Math.PI * 3) * 0.5; }
        hatchWorld();
        G.hatch.y += bobY;

        /* فقاعات المحرّك */
        if (hyp(s.vx, s.vy) > 20 && Math.random() < dt * 8) bubble(s.x - s.face * G.subL * 0.55, s.y + rnd(-6, 6), 0.7);

        /* ---- الأسماك ---- */
        var list = fishList(), near = false;
        for (i = 0; i < list.length; i++) {
            f = list[i];
            updateFish(f, dt, list);
            if (f.state === "drag") {
                if (inCatch(f)) near = true;
            }
        }
        G.nearHatch = near;
        /* مؤشرات السحب: لا تتبقى سمكة مسحوبة بلا مؤشر */
        Object.keys(G.pointers).forEach(function (k) { if (!G.pointers[k] || G.pointers[k].state !== "drag") delete G.pointers[k]; });

        /* ---- جسيمات وفقاعات ---- */
        for (i = G.parts.length - 1; i >= 0; i--) {
            var p = G.parts[i];
            p.life -= dt;
            if (p.life <= 0) { G.parts.splice(i, 1); continue; }
            p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.type === "star") { p.vy += 420 * dt * 0.4; p.rot += p.vr * dt; }
            else if (p.type === "bub") { p.vy -= 20 * dt; p.vx += Math.sin(G.t * 5 + p.x) * 6 * dt; }
        }
        for (i = 0; i < G.bubbles.length; i++) {
            var b = G.bubbles[i];
            b.y -= b.v * dt; b.x += Math.sin(G.t * 1.4 + b.ph) * 8 * dt;
            if (b.y < -20) { b.y = G.groundY - 4 + rnd(0, 20); b.x = rnd(0, G.W); }
        }
        for (i = 0; i < G.snow.length; i++) {
            var q = G.snow[i];
            q.y += q.v * dt; q.x += Math.sin(G.t * 0.6 + q.ph) * 6 * dt;
            if (q.y > G.groundY) { q.y = -4; q.x = rnd(0, G.W); }
        }

        /* ---- احتفال ---- */
        if (G.celebrate > 0) {
            G.celebrate -= dt;
            if (G.phase === "play" && G.celebrate <= 0.05) { /* لا شيء */ }
        }
        if (G.winTimer > 0) {
            G.winTimer -= dt;
            if (G.winTimer <= 0) showWin();
        }
    }

    function updateFish(f, dt, list) {
        var F = G.F, len = f.sp.len * f.k * F;
        f.ph += dt * (3 + hyp(f.vx, f.vy) * 0.05) * (f.sp.key === "eel" ? 1.4 : 1);

        if (f.state === "drag") {
            var d = f.drag;
            var tx = d.tx + d.ox, ty = d.ty + d.oy;
            tx = clamp(tx, len * 0.5 + 4, G.W - len * 0.5 - 4); ty = clamp(ty, 24, G.H - 24);
            var a = 1 - Math.exp(-dt * 22);
            var px = f.x, py = f.y;
            f.x += (tx - f.x) * a; f.y += (ty - f.y) * a;
            var ivx = (f.x - px) / Math.max(dt, 0.001), ivy = (f.y - py) / Math.max(dt, 0.001);
            d.vx = lerp(d.vx, ivx, 0.35); d.vy = lerp(d.vy, ivy, 0.35);
            f.vx = d.vx; f.vy = d.vy;
            if (Math.abs(d.vx) > 25) f.faceT = d.vx > 0 ? 1 : -1;
            f.ph += dt * 5;
        } else if (f.state === "entering") {
            f.enterT += dt / 0.34;
            var e = easeOut(clamp(f.enterT, 0, 1));
            f.x = lerp(f.fromX, G.hatch.x, e); f.y = lerp(f.fromY, G.hatch.y, e);
            f.scaleIn = 1 - 0.78 * e;
            f.ph += dt * 9;
            if (f.enterT >= 1) collect(f);
        } else if (f.state === "collected") {
            return;
        } else {
            /* سباحة طبيعية مستقلة */
            f.wt -= dt;
            var dx = f.wx - f.x, dy = f.wy - f.y, dist = hyp(dx, dy);
            if (f.wt <= 0 || dist < 24 * F) pickWaypoint(f);
            var speed = f.sp0 * F * (f.kind === "shark" ? 1.2 : 1) * (f.state === "return" ? 1.3 : 1);
            var wob = Math.sin(f.ph * 0.5 + f.id) * 0.25;
            var dxn = dx / (dist || 1), dyn = dy / (dist || 1);
            var dvx = dxn * speed, dvy = (dyn + wob * 0.4) * speed * 0.75;
            var k = 1 - Math.exp(-dt * (f.state === "return" ? 1.2 : 1.7));
            f.vx += (dvx - f.vx) * k; f.vy += (dvy - f.vy) * k;
            if (f.entering) {   /* دخول لطيف: يبطئ تدريجيًا كلما اقترب من موضعه داخل الشاشة */
                var inX = f.x < G.W / 2 ? len * 0.5 + 24 : G.W - len * 0.5 - 24;
                var toGo = Math.abs(inX - f.x), dir = G.W / 2 > f.x ? 1 : -1;
                f.vx = dir * clamp(60 + toGo * 0.9, 60, 150) * F; f.vy = (f.wy - f.y) * 0.5;
            }
            /* ابتعاد عن الغواصة وعن بعضها */
            var s = G.sub, ex = (f.x - s.x) / (G.subL * 0.72), ey = (f.y - s.y + G.subL * 0.07) / (G.subL * 0.5), ev = ex * ex + ey * ey;
            if (ev < 1.25) {
                var nx = f.x - s.x, ny = (f.y - s.y) * 1.4, nl = hyp(nx, ny) || 1;
                var push = (1.25 - ev) * 260 * F;
                f.vx += nx / nl * push * dt * 3; f.vy += ny / nl * push * dt * 3;
                if (ev < 0.95) { f.x += nx / nl * 140 * dt; f.y += ny / nl * 140 * dt; }
            }
            for (var j = 0; j < list.length; j++) {
                var o = list[j];
                if (o === f || o.state === "collected" || o.state === "entering") continue;
                var ox = f.x - o.x, oy = f.y - o.y, od = hyp(ox, oy), min = (f.sp.len * f.k + o.sp.len * o.k) * F * 0.46;
                if (od < min && od > 0.01) { var pr = (min - od) / min * 140 * F; f.vx += ox / od * pr * dt * 5; f.vy += oy / od * pr * dt * 5; if (od < min * 0.6) { f.x += ox / od * 60 * dt; f.y += oy / od * 60 * dt; } }
            }
            var sp2 = hyp(f.vx, f.vy), cap = speed * 1.7;
            if (sp2 > cap) { f.vx *= cap / sp2; f.vy *= cap / sp2; }
            f.x += f.vx * dt; f.y += f.vy * dt;
            /* الحدود (القرش القادم من خارج الشاشة يُستثنى حتى يدخل) */
            var mx = f.kind === "shark" ? len * 0.5 + 6 : len * 0.34, myT = Math.max(f.sp.h * f.k * F * 0.5, 22), top = 6 + myT, bot = G.groundY - myT * 0.6;
            if (f.entering) {
                if (f.x > mx + 10 && f.x < G.W - mx - 10) f.entering = false;
            } else {
                if (f.x < mx) { f.x = mx; f.vx = Math.abs(f.vx) * 0.6; if (f.wx < mx) pickWaypoint(f); }
                if (f.x > G.W - mx) { f.x = G.W - mx; f.vx = -Math.abs(f.vx) * 0.6; if (f.wx > G.W - mx) pickWaypoint(f); }
            }
            if (f.y < top) { f.y = top; f.vy = Math.abs(f.vy) * 0.5; }
            if (f.y > bot) { f.y = bot; f.vy = -Math.abs(f.vy) * 0.5; }
            if (f.state === "return" && hyp(f.vx, f.vy) < speed * 1.2) f.state = "swim";
            if (Math.abs(f.vx) > 10) f.faceT = f.vx > 0 ? 1 : -1;
        }
        f.face += (f.faceT - f.face) * Math.min(1, dt * 7);
        var ut = clamp(-f.vy / 110, -0.6, 0.6);
        f.tilt += (ut - f.tilt) * Math.min(1, dt * 6);
        if (f.shake > 0) f.shake -= dt;
        if (f.pop > 0) f.pop -= dt;
        if (f.kind === "shark" && f.appear < 1) f.appear = Math.min(1, f.appear + dt * 1.15);
    }

    /* منطقة الاستقبال المتسامحة: قرب الفتحة، أو فوق جسم الغواصة نفسه */
    function inCatch(f) {
        var d = hyp(f.x - G.hatch.x, f.y - G.hatch.y);
        return d <= G.hatch.r * 1.9 + 22 || insideSubZone(f.x, f.y, 0.92);
    }

    function releaseFish(f) {
        if (f.state !== "drag") return;
        if (inCatch(f)) tryEnter(f);
        else {
            f.state = "swim";
            f.vx = clamp(f.drag.vx * 0.5, -140, 140); f.vy = clamp(f.drag.vy * 0.5, -140, 140);
            pickWaypoint(f);
        }
        f.drag = null;
    }

    /* قاعدة القبول: العادية تُقبل حتى (الهدف−١)؛ ثم القرش وحده العنصر الأخير */
    function tryEnter(f) {
        var entering = fishList().filter(function (q) { return q.state === "entering"; }).length;
        var reserved = G.count + entering;
        var okFish = f.kind === "fish" && reserved < G.target - 1;
        var okShark = f.kind === "shark" && reserved === G.target - 1;
        if (!(okFish || okShark) || G.phase !== "play") {
            G.stats.rejected++;
            if (reserved >= G.target) G.stats.doubleCountBlocked++;
            f.state = "return";
            f.shake = 0.5;
            var dx = f.x - G.hatch.x, dy = f.y - G.hatch.y, d = hyp(dx, dy) || 1;
            f.vx = dx / d * 120; f.vy = dy / d * 120 - 30;
            pickWaypoint(f);
            sfx("no", 80);
            return;
        }
        f.state = "entering"; f.enterT = 0; f.fromX = f.x; f.fromY = f.y; f.scaleIn = 1;
    }

    function collect(f) {
        if (f.counted) { G.stats.doubleCountBlocked++; return; }   /* لا تُحتسب مرتين */
        f.counted = true;
        f.state = "collected";
        G.stats.entered++;
        var slot = G.count;
        G.count++;
        G.collected.push(f);
        G.slotsPop[slot] = G.t;
        if (f.kind === "fish") { var i = G.fish.indexOf(f); if (i >= 0) G.fish.splice(i, 1); }
        else { G.shark = null; }
        updateCounter(true);
        for (var k = 0; k < 7; k++) bubble(G.hatch.x + rnd(-14, 14), G.hatch.y + rnd(-6, 6), 1);
        if (G.count > 1) { try { if (navigator.vibrate && hapticOn()) navigator.vibrate(12); } catch (e) { /* لا شيء */ } }
        /* الصوت: مؤثر قصير ثم العدد (صف تسلسلي لا يتداخل) */
        sfx("plop", 110);
        sayNumber(G.count);
        if (G.count === G.target) { win(); return; }
        if (G.count === G.target - 1 && !G.sharkShown) spawnShark(false);
    }

    function hapticOn() { try { return !(typeof Settings !== "undefined" && Settings.get().haptic === false); } catch (e) { return true; } }

    function win() {
        G.phase = "win";
        G.celebrate = 2.4;
        G.winTimer = 3.1;
        saveProgress(G.target);
        sfx("win", 520);
        sayPhrase("أحسنت يا بطل");
        for (var i = 0; i < 22; i++) {
            G.parts.push({ type: "star", x: G.sub.x + rnd(-40, 40), y: G.sub.y - G.subL * 0.2, vx: rnd(-220, 220), vy: rnd(-380, -120), rot: rnd(0, 6), vr: rnd(-6, 6), s: rnd(10, 20) * G.F, life: rnd(1.6, 2.6), col: pick(["#ffd60a", "#ffb703", "#fff3a0", "#ff9f1c"]) });
        }
        for (var j = 0; j < 14; j++) bubble(G.sub.x + rnd(-G.subL * 0.4, G.subL * 0.4), G.sub.y, 1.3);
    }

    function showWin() {
        if (G.phase !== "win") return;
        dom.win.hidden = false;
        dom.win.innerHTML =
            '<div class="sgw-card"><div class="sgw-star" aria-hidden="true"><svg viewBox="0 0 100 100" width="96" height="96"><defs><linearGradient id="sgwg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a0"/><stop offset="1" stop-color="#ffb703"/></linearGradient></defs>' +
            '<path d="M50 6l13 28 31 4-23 21 6 31-27-15-27 15 6-31L6 38l31-4z" fill="url(#sgwg)" stroke="#c77700" stroke-width="4" stroke-linejoin="round"/></svg></div>' +
            '<h2>أحسنت يا بطل!</h2><p>جمعت ' + ar(G.target) + ' من ' + ar(G.target) + '</p>' +
            '<div class="sgw-btns"><button type="button" class="sgw-main" data-act="again">العب مرة أخرى</button>' +
            '<button type="button" data-act="menu">اختيار عدد آخر</button><button type="button" data-act="back">رجوع للأرقام</button></div></div>';
    }

    function bubble(x, y, s) {
        G.parts.push({ type: "bub", x: x, y: y, vx: rnd(-20, 20), vy: rnd(-70, -30), r: rnd(3, 7) * (s || 1) * G.F, life: rnd(0.8, 1.6) });
        if (G.parts.length > 120) G.parts.shift();
    }

    /* =========================================================
       🎨 الرسم
       ========================================================= */
    function measure() {
        if (!dom.stage) return;
        var r = dom.stage.getBoundingClientRect();
        var W = Math.max(280, Math.round(r.width)), H = Math.max(260, Math.round(r.height));
        var dpr = Math.min(window.devicePixelRatio || 1, G.lowFx ? 1.25 : 2);
        if (W === G.W && H === G.H && dpr === G.dpr) return;
        var ow = G.W, oh = G.H;
        G.W = W; G.H = H; G.dpr = dpr;
        dom.canvas.width = Math.round(W * dpr); dom.canvas.height = Math.round(H * dpr);
        dom.canvas.style.width = W + "px"; dom.canvas.style.height = H + "px";
        G.F = clamp(Math.min(W / 900, H / 600), 0.7, 1.5);
        G.subL = clamp(Math.min(W * (W < 600 ? 0.62 : 0.46), H * 0.78), 190, 430);
        G.groundY = H - clamp(H * 0.13, 46, 120);
        if (ow && oh) {
            var sx = W / ow, sy = H / oh;
            fishList().forEach(function (f) { f.x *= sx; f.y *= sy; f.wx *= sx; f.wy *= sy; });
            G.sub.x *= sx; G.sub.y *= sy;
        }
        initAmbient();
        renderBackground();
    }
    function onResize() { if (G.built && active()) measure(); }

    function initAmbient() {
        var r = mulberry(11), i;
        G.bubbles = [];
        var nb = G.lowFx ? 7 : 16;
        for (i = 0; i < nb; i++) G.bubbles.push({ x: r() * G.W, y: r() * G.H, r: 2.5 + r() * 6, v: 14 + r() * 28, ph: r() * 6 });
        G.snow = [];
        var ns = G.lowFx ? 0 : 26;
        for (i = 0; i < ns; i++) G.snow.push({ x: r() * G.W, y: r() * G.groundY, r: 0.8 + r() * 1.6, v: 4 + r() * 8, ph: r() * 6 });
        G.kelp = [];
        var xs = [0.05, 0.22, 0.46, 0.7, 0.93];
        xs.forEach(function (fx, k) { G.kelp.push({ x: fx * G.W, h: (0.13 + r() * 0.12) * G.H, w: (7 + r() * 5) * G.F, ph: r() * 6, col: k % 2 ? "#2bb673" : "#1f9d6a" }); });
    }

    function branchCoral(c, x, y, len, ang, depth, col, w, r) {
        c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round";
        var x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
        if (depth <= 0) { c.fillStyle = col; c.beginPath(); c.arc(x2, y2, w * 0.7, 0, 6.28); c.fill(); return; }
        branchCoral(c, x2, y2, len * 0.72, ang - 0.5 - r() * 0.3, depth - 1, col, w * 0.74, r);
        branchCoral(c, x2, y2, len * 0.72, ang + 0.5 + r() * 0.3, depth - 1, col, w * 0.74, r);
        if (r() < 0.45) branchCoral(c, x2, y2, len * 0.6, ang + (r() - 0.5) * 0.3, depth - 1, col, w * 0.7, r);
    }

    function renderBackground() {
        var W = G.W, H = G.H, gy = G.groundY, dpr = G.dpr;
        bgCanvas = document.createElement("canvas");
        bgCanvas.width = Math.round(W * dpr); bgCanvas.height = Math.round(H * dpr);
        var c = bgCanvas.getContext("2d");
        c.scale(dpr, dpr);
        var r = mulberry(7), i;
        /* ماء متدرّج */
        c.fillStyle = grad(c, 0, 0, 0, H, [0, "#8be3ff", 0.3, "#3fb6ec", 0.65, "#1a82cc", 1, "#0b4c8f"]);
        c.fillRect(0, 0, W, H);
        /* وهج الشمس العلوي */
        var rg = c.createRadialGradient(W * 0.7, -H * 0.1, 10, W * 0.7, -H * 0.1, H * 0.9);
        rg.addColorStop(0, "rgba(255,255,255,.55)"); rg.addColorStop(1, "rgba(255,255,255,0)");
        c.fillStyle = rg; c.fillRect(0, 0, W, H);
        /* تلال بعيدة */
        [["rgba(14,92,160,.55)", 0.62, 0.13], ["rgba(10,70,135,.6)", 0.72, 0.1]].forEach(function (L, k) {
            c.fillStyle = L[0]; c.beginPath(); c.moveTo(0, gy);
            for (var x = 0; x <= W + 20; x += 20) c.lineTo(x, gy - (L[1] * (gy * 0.32)) - Math.sin(x * 0.011 + k * 2) * gy * L[2] - Math.sin(x * 0.027 + k) * gy * 0.03);
            c.lineTo(W, gy); c.closePath(); c.fill();
        });
        /* صخرة قوسية بعيدة */
        c.fillStyle = "rgba(9,60,120,.55)";
        c.beginPath(); c.moveTo(W * 0.68, gy); c.quadraticCurveTo(W * 0.7, gy - gy * 0.42, W * 0.8, gy - gy * 0.3); c.quadraticCurveTo(W * 0.84, gy - gy * 0.2, W * 0.88, gy); c.lineTo(W * 0.84, gy); c.quadraticCurveTo(W * 0.82, gy - gy * 0.14, W * 0.78, gy - gy * 0.15); c.quadraticCurveTo(W * 0.74, gy - gy * 0.2, W * 0.73, gy); c.closePath(); c.fill();
        /* رمل */
        var gh = H - gy;
        c.fillStyle = grad(c, 0, gy - 10, 0, H, [0, "#ffe9b0", 0.4, "#f2cf86", 1, "#d9a85c"]);
        c.beginPath(); c.moveTo(0, gy + 6);
        for (var xx = 0; xx <= W + 16; xx += 16) c.lineTo(xx, gy + Math.sin(xx * 0.02) * 7 + Math.sin(xx * 0.05) * 3);
        c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
        c.fillStyle = "rgba(255,255,255,.28)";
        for (i = 0; i < 28; i++) { c.beginPath(); c.arc(r() * W, gy + 12 + r() * (gh - 14), 1 + r() * 2, 0, 6.28); c.fill(); }
        /* شعاب مرجانية: فروع وردية وبرتقالية وبنفسجية */
        var cols = ["#ff6b8b", "#ff8f5a", "#c36bff", "#ff5a7a", "#ffa94d"];
        var cn = Math.max(4, Math.round(W / 215));
        for (i = 0; i < cn; i++) {
            var cx = (i + 0.3 + r() * 0.4) * (W / cn), base = gy + 8 + r() * 10;
            var col = cols[i % cols.length], sc = (0.7 + r() * 0.55) * Math.max(0.7, G.F);
            var kind = i % 4;
            if (kind === 0 || kind === 3) { for (var b = -1; b <= 1; b += 2) branchCoral(c, cx + b * 10 * sc, base, 30 * sc, -Math.PI / 2 + b * 0.4, 3, col, 7 * sc, r); }
            else if (kind === 1) {   /* مروحة بحرية */
                c.strokeStyle = col; c.lineWidth = 2 * sc; c.lineCap = "round";
                for (var a = -1.15; a <= 1.15; a += 0.16) { c.beginPath(); c.moveTo(cx, base); c.lineTo(cx + Math.sin(a) * 44 * sc, base - Math.cos(a) * 46 * sc); c.stroke(); }
                c.beginPath(); c.arc(cx, base - 2, 44 * sc, -Math.PI / 2 - 1.15, -Math.PI / 2 + 1.15); c.stroke();
                c.fillStyle = "rgba(255,255,255,.12)"; c.beginPath(); c.moveTo(cx, base); c.arc(cx, base, 44 * sc, -Math.PI / 2 - 1.15, -Math.PI / 2 + 1.15); c.closePath(); c.fill();
            } else {                 /* مرجان دماغي */
                c.fillStyle = grad(c, 0, base - 34 * sc, 0, base, [0, "#ffb86b", 1, "#e07a2d"]);
                c.beginPath(); c.ellipse(cx, base, 34 * sc, 28 * sc, 0, Math.PI, 0); c.closePath(); c.fill();
                c.strokeStyle = "rgba(150,70,10,.5)"; c.lineWidth = 2 * sc; c.lineCap = "round";
                for (var q = 0; q < 6; q++) { c.beginPath(); c.arc(cx + (q - 2.5) * 9 * sc, base - 8 * sc - (q % 2) * 6 * sc, 7 * sc, Math.PI, 0.3 + Math.PI); c.stroke(); }
            }
        }
        /* إسفنج أنبوبي ونجمة بحر وصدفة */
        for (i = 0; i < Math.max(1, Math.round(W / 520)); i++) {
            var tx = r() * W, th = (26 + r() * 22) * Math.max(0.8, G.F);
            c.fillStyle = grad(c, tx - 8, 0, tx + 8, 0, [0, "#ffe27a", 1, "#f0b429"]);
            for (var tt = 0; tt < 3; tt++) { var ox = tt * 11 - 11; c.beginPath(); c.roundRect ? c.roundRect(tx + ox - 5, gy + 12 - th + tt * 7, 10, th, 5) : c.rect(tx + ox - 5, gy + 12 - th + tt * 7, 10, th); c.fill(); c.fillStyle = "rgba(120,70,0,.45)"; c.beginPath(); c.ellipse(tx + ox, gy + 12 - th + tt * 7, 4, 2, 0, 0, 6.28); c.fill(); c.fillStyle = grad(c, tx - 8, 0, tx + 8, 0, [0, "#ffe27a", 1, "#f0b429"]); }
        }
        for (i = 0; i < 2; i++) {
            var sx = r() * W, sy = gy + 18 + r() * Math.max(6, gh - 36), ss = (9 + r() * 6) * Math.max(0.8, G.F);
            c.fillStyle = i % 2 ? "#ff7f50" : "#ff5d73"; c.beginPath();
            for (var p = 0; p < 10; p++) { var rad = p % 2 ? ss * 0.45 : ss; var an = p / 10 * 6.28 - 1.57; c.lineTo(sx + Math.cos(an) * rad, sy + Math.sin(an) * rad); }
            c.closePath(); c.fill(); c.strokeStyle = "rgba(120,30,30,.4)"; c.lineWidth = 1; c.stroke();
        }
        var shx = W * (0.2 + r() * 0.2), shy = gy + 22;
        c.fillStyle = "#ffd7e0"; c.beginPath(); c.moveTo(shx - 12, shy); c.quadraticCurveTo(shx, shy - 22, shx + 12, shy); c.closePath(); c.fill(); c.strokeStyle = "#e88aa2"; c.lineWidth = 1.4; c.stroke();
        for (var ln = -1; ln <= 1; ln++) { c.beginPath(); c.moveTo(shx, shy); c.lineTo(shx + ln * 7, shy - 14); c.stroke(); }
    }

    function drawRays(c) {
        if (G.lowFx || G.reduced) return;
        var W = G.W, gy = G.groundY, t = G.t;
        c.save();
        c.globalCompositeOperation = "lighter";
        for (var i = 0; i < 5; i++) {
            var x0 = W * (0.1 + i * 0.2) + Math.sin(t * 0.25 + i * 1.7) * 36, w0 = 22 + (i % 3) * 14, drift = 120 + Math.sin(t * 0.2 + i) * 26;
            var g = c.createLinearGradient(0, 0, 0, gy);
            g.addColorStop(0, "rgba(200,245,255,.20)"); g.addColorStop(1, "rgba(200,245,255,0)");
            c.fillStyle = g;
            c.beginPath(); c.moveTo(x0 - w0, 0); c.lineTo(x0 + w0, 0); c.lineTo(x0 + w0 * 3 + drift, gy); c.lineTo(x0 - w0 * 2 + drift, gy); c.closePath(); c.fill();
        }
        c.restore();
    }

    function drawKelp(c) {
        var t = G.t, calm = G.reduced;
        for (var i = 0; i < G.kelp.length; i++) {
            var k = G.kelp[i], N = 7, pts = [], j;
            for (j = 0; j <= N; j++) {
                var u = j / N, sw = calm ? 0 : Math.sin(t * 1.0 + k.ph + u * 2.4) * 16 * u * G.F;
                pts.push([k.x + sw, G.groundY + 10 - k.h * u, k.w * (1 - u * 0.78)]);
            }
            c.beginPath(); c.moveTo(pts[0][0] - pts[0][2], pts[0][1]);
            for (j = 1; j <= N; j++) c.lineTo(pts[j][0] - pts[j][2], pts[j][1]);
            for (j = N; j >= 0; j--) c.lineTo(pts[j][0] + pts[j][2], pts[j][1]);
            c.closePath();
            c.fillStyle = k.col; c.globalAlpha = 0.9; c.fill(); c.globalAlpha = 1;
            c.strokeStyle = "rgba(255,255,255,.2)"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (j = 1; j <= N; j++) c.lineTo(pts[j][0], pts[j][1]); c.stroke();
        }
    }

    function drawBubbles(c) {
        for (var i = 0; i < G.bubbles.length; i++) {
            var b = G.bubbles[i];
            c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 1.4;
            c.fillStyle = "rgba(255,255,255,.10)";
            c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.28); c.fill(); c.stroke();
            c.fillStyle = "rgba(255,255,255,.7)"; c.beginPath(); c.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.28, 0, 6.28); c.fill();
        }
        if (!G.lowFx) {
            c.fillStyle = "rgba(255,255,255,.45)";
            for (var k = 0; k < G.snow.length; k++) { var q = G.snow[k]; c.beginPath(); c.arc(q.x, q.y, q.r, 0, 6.28); c.fill(); }
        }
    }

    function drawFish(c, f) {
        var sp = f.sp, s = G.F * f.k * (f.scaleIn !== undefined && f.state === "entering" ? f.scaleIn : 1);
        if (f.kind === "shark") s = G.F * (0.4 + 0.6 * easeOut(f.appear));
        var drag = f.state === "drag";
        c.save();
        if (f.kind === "shark" && f.appear < 1) c.globalAlpha = Math.min(1, f.appear * 1.6);
        c.translate(f.x, f.y);
        if (f.shake > 0) c.translate(Math.sin(f.shake * 50) * 4, 0);
        c.rotate(-Math.sign(f.faceT || 1) * f.tilt * 0.5 + (f.shake > 0 ? Math.sin(f.shake * 40) * 0.08 : 0) * 0);
        if (drag) s *= 1.1;
        c.scale(s * f.face, s);
        /* هالة القرش حين يكون هو المطلوب */
        if (f.kind === "shark" && G.phase === "play") {
            var pulse = 0.5 + 0.5 * Math.sin(G.t * 3.2);
            var rg = c.createRadialGradient(0, 0, 20, 0, 0, 150);
            rg.addColorStop(0, "rgba(255,240,150," + (0.38 + pulse * 0.2) + ")"); rg.addColorStop(1, "rgba(255,240,150,0)");
            c.fillStyle = rg; c.beginPath(); c.arc(0, 0, 150, 0, 6.28); c.fill();
        }
        if (drag) { c.shadowColor = "rgba(255,255,255,.75)"; c.shadowBlur = 14; }
        var w = Math.sin(f.ph * (f.kind === "shark" ? 1.2 : 1.6));
        sp.draw(c, { w: w, t: f.ph });
        c.restore();
    }

    function drawStar(c, x, y, r, rot) {
        c.beginPath();
        for (var i = 0; i < 10; i++) { var rr = i % 2 ? r * 0.45 : r, a = rot + i / 10 * 6.2832 - 1.5708; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
        c.closePath();
    }

    function drawSub(c) {
        var s = G.sub, L = G.subL, t = G.t;
        var y = (s.drawY !== undefined ? s.drawY : s.y) - Math.max(0, s.jump) * L * 0.18;
        c.save();
        c.translate(s.x, y);
        c.rotate(s.pitch + (G.celebrate > 0 ? Math.sin(t * 9) * 0.05 : 0));
        var fx = Math.abs(s.face) < 0.07 ? (s.face < 0 ? -0.07 : 0.07) : s.face;
        c.scale(L * fx, L);
        var lw = 0.012;

        /* مصباح أمامي */
        c.save(); c.globalCompositeOperation = "lighter";
        var lg = c.createLinearGradient(0.5, 0, 1.1, 0); lg.addColorStop(0, "rgba(255,250,190,.32)"); lg.addColorStop(1, "rgba(255,250,190,0)");
        c.fillStyle = lg; c.beginPath(); c.moveTo(0.49, -0.025); c.lineTo(1.1, -0.2); c.lineTo(1.1, 0.2); c.lineTo(0.49, 0.025); c.closePath(); c.fill(); c.restore();

        /* مروحة خلفية وزعانف الذيل */
        c.save(); c.translate(-0.52, 0.02);
        c.fillStyle = "#9aa5b1"; c.fillRect(-0.02, -0.018, 0.05, 0.036);
        c.rotate(0);
        for (var b = 0; b < 3; b++) {
            var a = s.prop + b * 2.0944, sy = Math.sin(a);
            c.fillStyle = b ? "#7d8996" : "#aab4bf"; c.beginPath(); c.ellipse(-0.025, sy * 0.1, 0.022, 0.06 * Math.abs(Math.cos(a)) + 0.012, 0, 0, 6.28); c.fill();
            c.strokeStyle = "#4a5560"; c.lineWidth = 0.007; c.stroke();
        }
        c.restore();
        c.fillStyle = "#e8890c";
        c.beginPath(); c.moveTo(-0.42, -0.16); c.lineTo(-0.56, -0.3); c.lineTo(-0.5, -0.1); c.closePath(); c.fill(); c.strokeStyle = "#a85d00"; c.lineWidth = lw; c.lineJoin = "round"; c.stroke();
        c.beginPath(); c.moveTo(-0.42, 0.18); c.lineTo(-0.56, 0.31); c.lineTo(-0.5, 0.1); c.closePath(); c.fill(); c.stroke();

        /* برج المراقبة والمنظار */
        c.fillStyle = grad(c, 0, -0.42, 0, -0.2, [0, "#ffe27a", 1, "#f6b100"]);
        c.beginPath(); c.moveTo(-0.22, -0.23); c.quadraticCurveTo(-0.22, -0.4, -0.15, -0.4); c.lineTo(-0.05, -0.4); c.quadraticCurveTo(0.02, -0.4, 0.03, -0.23); c.closePath(); c.fill(); c.strokeStyle = "#b86e00"; c.lineWidth = lw; c.stroke();
        c.strokeStyle = "#7d8996"; c.lineWidth = 0.022; c.lineCap = "round";
        c.beginPath(); c.moveTo(-0.1, -0.4); c.lineTo(-0.1, -0.53); c.lineTo(-0.03, -0.53); c.stroke();
        c.fillStyle = "#cfe9ff"; c.beginPath(); c.arc(-0.025, -0.53, 0.016, 0, 6.28); c.fill();
        c.fillStyle = "#bfeaff"; c.strokeStyle = "#b86e00"; c.lineWidth = lw;
        c.beginPath(); c.arc(-0.1, -0.32, 0.034, 0, 6.28); c.fill(); c.stroke();

        /* الهيكل */
        c.beginPath(); c.ellipse(0, 0, 0.5, 0.27, 0, 0, 6.2832);
        c.fillStyle = grad(c, 0, -0.27, 0, 0.27, [0, "#ffe680", 0.35, "#ffc800", 1, "#f08f00"]); c.fill();
        c.save(); c.beginPath(); c.ellipse(0, 0, 0.5, 0.27, 0, 0, 6.2832); c.clip();
        c.fillStyle = "#ff8f1f"; c.fillRect(-0.5, 0.1, 1, 0.055);
        c.fillStyle = "rgba(255,255,255,.4)"; c.beginPath(); c.ellipse(-0.04, -0.17, 0.34, 0.05, -0.04, 0, 6.28); c.fill();
        c.fillStyle = "#c46a00"; for (var rv = -4; rv <= 4; rv++) { c.beginPath(); c.arc(rv * 0.1, 0.1275, 0.007, 0, 6.28); c.fill(); }
        c.restore();
        c.strokeStyle = "#b86e00"; c.lineWidth = lw * 1.3; c.beginPath(); c.ellipse(0, 0, 0.5, 0.27, 0, 0, 6.2832); c.stroke();

        /* لوحة العدد (غير معكوسة) */
        c.save(); c.translate(0.335, 0.015);
        c.fillStyle = "#1b6fd1"; c.beginPath(); c.arc(0, 0, 0.125, 0, 6.28); c.fill();
        c.fillStyle = "#fff"; c.beginPath(); c.arc(0, 0, 0.1, 0, 6.28); c.fill();
        c.strokeStyle = "#0d4aa0"; c.lineWidth = 0.006; c.beginPath(); c.arc(0, 0, 0.1, 0, 6.28); c.stroke();
        c.scale(s.face >= 0 ? 1 : -1, 1);
        var big = G.target >= 10;
        c.scale(0.01, 0.01);
        c.fillStyle = "#0d3b7a"; c.textAlign = "center"; c.textBaseline = "middle";
        c.font = "700 " + (big ? 10.5 : 14.5) + "px 'Readex Pro','Cairo','Tajawal',system-ui,sans-serif";
        c.fillText(ar(G.target), 0, 1.2);
        c.restore();

        /* نافذة الأسماك المجمّعة */
        drawWindow(c, s, t);

        /* فتحة الاستقبال + حلقة الإسقاط */
        drawHatch(c, s, t);
        c.restore();

        /* نجمة الفوز فوق الغواصة */
        if (G.celebrate > 0) {
            var k = clamp(1 - G.celebrate / 2.4, 0, 1), sc = easeOut(Math.min(1, k * 3)) * (1 + Math.sin(t * 8) * 0.05);
            c.save(); c.translate(s.x, y - L * 0.62 - 16 * G.F);
            c.scale(sc, sc);
            c.fillStyle = grad(c, 0, -L * 0.2, 0, L * 0.2, [0, "#fff3a0", 1, "#ffb703"]);
            drawStar(c, 0, 0, L * 0.2, Math.sin(t * 3) * 0.15); c.fill();
            c.strokeStyle = "#c77700"; c.lineWidth = 3; c.lineJoin = "round"; c.stroke();
            c.restore();
        }
    }

    function drawHatch(c, s, t) {
        var hx = 0.17, hy = -0.255, rr = G.hatch.r / G.subL;
        c.save(); c.translate(hx, hy);
        /* حلقة الاستقبال الكبيرة (هدف الإسقاط) */
        var near = G.nearHatch, pulse = 0.5 + 0.5 * Math.sin(t * 3);
        var rg = c.createRadialGradient(0, -0.02, 0.02, 0, -0.02, rr * 1.15);
        rg.addColorStop(0, near ? "rgba(120,255,180,.55)" : "rgba(160,240,255,.34)");
        rg.addColorStop(0.7, near ? "rgba(120,255,180,.26)" : "rgba(160,240,255,.16)");
        rg.addColorStop(1, "rgba(160,240,255,0)");
        c.fillStyle = rg; c.beginPath(); c.arc(0, -0.02, rr * 1.15, 0, 6.28); c.fill();
        c.save(); c.setLineDash([0.028, 0.034]); c.lineDashOffset = -t * 0.04;
        c.strokeStyle = near ? "rgba(90,255,160,.95)" : "rgba(255,255,255," + (0.7 + pulse * 0.25) + ")";
        c.lineWidth = 0.011 + (near ? 0.004 : 0); c.beginPath(); c.arc(0, -0.02, rr * (near ? 1.02 : 0.96 + pulse * 0.03), 0, 6.28); c.stroke(); c.restore();
        /* الفتحة نفسها: حلقة معدنية وداخل مظلم وغطاء مرفوع */
        c.fillStyle = "#8d98a5"; c.beginPath(); c.ellipse(0, 0, 0.1, 0.034, 0, 0, 6.28); c.fill();
        c.fillStyle = grad(c, 0, -0.03, 0, 0.03, [0, "#2b1a00", 1, "#6b4306"]); c.beginPath(); c.ellipse(0, 0, 0.082, 0.026, 0, 0, 6.28); c.fill();
        c.strokeStyle = "#5c6672"; c.lineWidth = 0.008; c.beginPath(); c.ellipse(0, 0, 0.1, 0.034, 0, 0, 6.28); c.stroke();
        c.fillStyle = "#b9c3cf"; c.beginPath(); c.ellipse(-0.045, -0.045, 0.05, 0.016, -0.5, 0, 6.28); c.fill(); c.strokeStyle = "#5c6672"; c.stroke();
        c.restore();
    }

    function slotLayout(N) {
        /* مواضع خانات النافذة (إحداثيات محلية للنافذة) حسب العدد المطلوب */
        var cols = N <= 3 ? N : (N <= 8 ? Math.ceil(N / 2) : 5), rows = N <= 3 ? 1 : 2, W = 0.58, H = 0.33, out = [];
        var cw = W / cols, ch = H / rows;
        for (var i = 0; i < N; i++) {
            var rr = Math.floor(i / cols), cc = i % cols, inRow = rr === rows - 1 ? N - cols * (rows - 1) : cols;
            var x0 = -((inRow - 1) * cw) / 2;
            out.push({ x: x0 + cc * cw, y: (rr - (rows - 1) / 2) * ch, len: Math.min(cw * 0.92, 0.2), cw: cw });
        }
        return out;
    }

    function drawWindow(c, s, t) {
        var cx = -0.14, cy = 0.03, rx = 0.31, ry = 0.195;
        c.save(); c.translate(cx, cy);
        c.fillStyle = "#c9d2dc"; c.beginPath(); c.ellipse(0, 0, rx + 0.02, ry + 0.02, 0, 0, 6.28); c.fill();
        c.strokeStyle = "#7d8996"; c.lineWidth = 0.01; c.stroke();
        c.save(); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, 6.28); c.clip();
        c.fillStyle = grad(c, 0, -ry, 0, ry, [0, "#aeeaff", 0.55, "#4cb6ec", 1, "#1a78c2"]); c.fillRect(-rx, -ry, rx * 2, ry * 2);
        /* فقاعات صغيرة داخل الماء */
        c.fillStyle = "rgba(255,255,255,.45)";
        for (var b = 0; b < 4; b++) { var by = ((t * 0.05 + b * 0.27) % 1); c.beginPath(); c.arc(-0.22 + b * 0.15, ry - by * ry * 2, 0.006 + (b % 2) * 0.004, 0, 6.28); c.fill(); }
        /* الخانات: أسماك مجمّعة (غير معكوسة) ومواضع فارغة باهتة */
        var N = Math.max(1, G.target), slots = slotLayout(N), inv = s.face >= 0 ? 1 : -1;
        for (var i = 0; i < N; i++) {
            var sl = slots[i], f = G.collected ? G.collected[i] : null;
            c.save(); c.translate(sl.x * inv, sl.y);
            if (f) {
                var age = G.t - (G.slotsPop[i] || 0), pop = age < 0.4 ? easeOut(age / 0.4) * (1 + Math.sin(age / 0.4 * 3.14) * 0.25) : 1;
                var sc = (sl.len / f.sp.len) * pop;
                c.translate(0, Math.sin(t * 1.6 + i) * 0.004);
                c.scale(sc * inv, sc);
                f.sp.draw(c, { w: Math.sin(t * 3 + i * 1.3) * 0.7, t: t * 0.8 + i });
            } else {
                c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = 0.006; c.setLineDash([0.012, 0.012]);
                c.beginPath(); c.ellipse(0, 0, sl.len * 0.5, sl.len * 0.3, 0, 0, 6.28); c.stroke();
            }
            c.restore();
        }
        c.restore();
        c.fillStyle = "rgba(255,255,255,.22)"; c.beginPath(); c.ellipse(-0.1, -0.1, 0.14, 0.03, -0.3, 0, 6.28); c.fill();
        c.strokeStyle = "#aab4bf"; c.lineWidth = 0.012; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, 6.28); c.stroke();
        c.fillStyle = "#7d8996"; for (var k = 0; k < 8; k++) { var a = k / 8 * 6.2832; c.beginPath(); c.arc(Math.cos(a) * (rx + 0.01), Math.sin(a) * (ry + 0.01), 0.006, 0, 6.28); c.fill(); }
        c.restore();
    }

    function drawParts(c) {
        for (var i = 0; i < G.parts.length; i++) {
            var p = G.parts[i], a = clamp(p.life / 0.6, 0, 1);
            if (p.type === "star") {
                c.globalAlpha = a; c.fillStyle = p.col; drawStar(c, p.x, p.y, p.s, p.rot); c.fill();
                c.strokeStyle = "rgba(190,110,0,.7)"; c.lineWidth = 1.4; c.stroke(); c.globalAlpha = 1;
            } else {
                c.globalAlpha = a * 0.9; c.strokeStyle = "rgba(255,255,255,.85)"; c.fillStyle = "rgba(255,255,255,.16)"; c.lineWidth = 1.4;
                c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.28); c.fill(); c.stroke(); c.globalAlpha = 1;
            }
        }
    }

    function render() {
        var c = ctx;
        c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
        if (bgCanvas) c.drawImage(bgCanvas, 0, 0, G.W, G.H);
        drawRays(c);
        drawKelp(c);
        drawBubbles(c);
        var i, f;
        /* الأسماك السابحة خلف الغواصة، ثم الغواصة، ثم المسحوبة/الداخلة فوقها */
        var swim = [], top = [];
        fishList().forEach(function (q) { (q.state === "drag" || q.state === "entering" ? top : swim).push(q); });
        swim.sort(function (a, b) { return a.sp.len * a.k - b.sp.len * b.k; });
        for (i = 0; i < swim.length; i++) drawFish(c, swim[i]);
        drawSub(c);
        for (i = 0; i < top.length; i++) drawFish(c, top[i]);
        drawParts(c);
    }

    /* =========================================================
       ⏱️ الحلقة الرئيسية
       ========================================================= */
    function frame(ts) {
        if (!G.running) return;
        G.raf = requestAnimationFrame(frame);
        var dt = G.last ? Math.min(0.05, (ts - G.last) / 1000) : 0.016;
        G.last = ts;
        step(dt);
        render();
        /* مراقبة الأداء: عند البطء نخفّف الزخارف فقط (لا تغيير في اللعب) */
        G.frameEma = G.frameEma * 0.95 + dt * 1000 * 0.05;
        G.frames++;
        if (!G.lowFx && G.frames > 90 && G.frameEma > 26) { G.lowFx = true; G.dpr = 0; measure(); }
    }
    function active() { return sec.classList.contains("active"); }
    function startLoop() {
        if (G.running || document.hidden) return;
        G.running = true; G.last = 0;
        G.raf = requestAnimationFrame(frame);
    }
    function stopLoop() {
        G.running = false;
        if (G.raf) cancelAnimationFrame(G.raf);
        G.raf = 0;
    }

    /* =========================================================
       🚪 الدخول والخروج
       ========================================================= */
    function enter() {
        build();
        try { var m = localStorage.getItem("taha_submarine_mode_v1"); if (m === "free" || m === "easy") G.mode = m; } catch (e) { /* لا شيء */ }
        applyMode();
        try { G.reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) || document.body.classList.contains("calm-mode"); } catch (e) { G.reduced = false; }
        G.phase = "menu";
        G.W = 0; G.H = 0;
        setTimeout(function () {
            measure();
            if (G.phase === "menu") {
                G.target = 5; G.count = 0; G.collected = [];
                spawnFish(); resetSub(); updateCounter(false);
                dom.menu.classList.add("sg-open");
                dom.canvas.style.pointerEvents = "none";
            }
            startLoop();
        }, 30);
    }
    function leave() {
        stopLoop();
        audioReset();
        G.pointers = {}; G.keys = {}; G.joy.id = null; G.joy.x = G.joy.y = 0;
        G.phase = "menu";
        G.fish = []; G.shark = null;
    }
    function exitGame() { showScreen("numbers"); }

    var wasActive = false;
    new MutationObserver(function () {
        var on = active();
        if (on && !wasActive) enter();
        else if (!on && wasActive) leave();
        wasActive = on;
    }).observe(sec, { attributes: true, attributeFilter: ["class"] });
    wasActive = active();
    if (wasActive) enter();

    window.openSubmarineGame = function () { showScreen("submarineGame"); };
    /* واجهة للاختبار الآلي فقط */
    window.__subGame = {
        G: G, SPECIES: SPECIES, audioLog: audioLog, startRound: startRound, hatchWorld: hatchWorld, setMode: setMode,
        fishList: fishList, flipSub: flipSub, showMenu: showMenu
    };
})();
