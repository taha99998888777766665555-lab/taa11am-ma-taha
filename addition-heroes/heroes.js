/* تحدي أبطال الجمع — نموذج تجريبي مستقل (لا يقرأ ولا يكتب أي تخزين، ولا يمسّ التطبيق الأصلي).
   - ثلاثة مسارات مستقلة تمامًا: لكل مسار حالته وأسئلته ونجومه وسيارته (كائن L لكل مسار، بلا حالة مشتركة).
   - اللمس: Pointer Events فقط؛ كل مؤشر (pointerId) يُتتبَّع مستقلًا، ولا يُنادى setPointerCapture ولا preventDefault
     على مؤشرات الآخرين، ولا أي قفل عام. الإجابة تُحتسب عند رفع الإصبع فوق الزر نفسه الذي نزل عليه.
   - لا مؤقت، لا ترتيب للفائزين، لا خصم نجوم. الصوت مغلق افتراضيًا. */
(function () {
    "use strict";

    var TOTAL = 5;                       /* إجابات صحيحة لإنهاء المسار */
    var CONFIGS = [
        { id: 1, kind: "pics", max: 5, title: "المسار الأول", sub: "الجمع بالصور حتى ٥", help: null },
        { id: 2, kind: "num", max: 5, title: "المسار الثاني", sub: "الجمع حتى ٥", help: "dots" },
        { id: 3, kind: "num", max: 10, title: "المسار الثالث", sub: "الجمع حتى ١٠", help: "line" }
    ];
    var AR = "٠١٢٣٤٥٦٧٨٩";
    function ar(n) { return String(n).replace(/\d/g, function (d) { return AR.charAt(d); }); }
    function rnd(n) { return Math.floor(Math.random() * n); }
    function shuffle(a) { var r = a.slice(); for (var i = r.length - 1; i > 0; i--) { var j = rnd(i + 1), t = r[i]; r[i] = r[j]; r[j] = t; } return r; }
    function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

    /* ---------- حجم المسرح 16:9 بلا تمرير ---------- */
    var stage = document.getElementById("stage");
    function fit() {
        var w = window.innerWidth, hh = window.innerHeight;
        var sw = Math.min(w, hh * 16 / 9);
        document.documentElement.style.setProperty("--u", (sw / 100) + "px");
        layoutCars();
    }

    /* ---------- توليد الأسئلة ---------- */
    function genQuestion(cfg, prevKey) {
        var a, b, key, tries = 0;
        do {
            a = 1 + rnd(cfg.max - 1);
            b = 1 + rnd(cfg.max - a);
            key = a + "+" + b;
            tries++;
        } while (key === prevKey && tries < 40);
        var s = a + b;
        var near = [];
        for (var d = -2; d <= 2; d++) { var v = s + d; if (d !== 0 && v >= 1 && v <= cfg.max) near.push(v); }
        var pool = near.slice();
        for (var v2 = 1; v2 <= cfg.max; v2++) if (v2 !== s && pool.indexOf(v2) < 0) pool.push(v2);
        var wrong = shuffle(near).concat(shuffle(pool.filter(function (x) { return near.indexOf(x) < 0; }))).slice(0, 2);
        return { a: a, b: b, sum: s, key: key, options: shuffle([s].concat(wrong)), icon: ["apple", "ball", "flower"][rnd(3)] };
    }

    /* ---------- رسومات ---------- */
    var ICON = {
        apple: "<svg viewBox='0 0 40 40' aria-hidden='true'><circle cx='20' cy='23' r='13' fill='#c8281e' stroke='#7d1710' stroke-width='2'/><path d='M20 11c0-4 2-6 5-7' stroke='#5b3a1a' stroke-width='3' fill='none' stroke-linecap='round'/><ellipse cx='27' cy='8' rx='5' ry='3' fill='#2f8f3f' transform='rotate(-25 27 8)'/></svg>",
        ball: "<svg viewBox='0 0 40 40' aria-hidden='true'><circle cx='20' cy='20' r='15' fill='#2f6fc4' stroke='#173f7a' stroke-width='2'/><path d='M6 20h28M20 5c8 8 8 22 0 30M20 5c-8 8-8 22 0 30' stroke='#fff' stroke-width='2.4' fill='none'/></svg>",
        flower: "<svg viewBox='0 0 40 40' aria-hidden='true'><g fill='#e0509a' stroke='#8a2160' stroke-width='1.6'><circle cx='20' cy='9' r='6'/><circle cx='31' cy='17' r='6'/><circle cx='27' cy='30' r='6'/><circle cx='13' cy='30' r='6'/><circle cx='9' cy='17' r='6'/></g><circle cx='20' cy='20' r='6' fill='#f2c200' stroke='#8a6a00' stroke-width='1.6'/></svg>"
    };
    var STAR = "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2 6.3 20.3l1.2-6.4L2.8 9.5l6.4-.8z'/></svg>";
    /* سيارات كرتونية: لكل مسار لون وشكل وسائق مختلف (الأشكال تميّز المسارات حتى لمن لا يفرّق الألوان) */
    var PAL = [
        { c: "#ee7a1f", d: "#a34700", l: "#ffc58a" },
        { c: "#2f78d0", d: "#1b4f94", l: "#9cc6f2" },
        { c: "#2fa35f", d: "#1d6b3e", l: "#9fdcb8" }
    ];
    function driver(kind, cx, cy) {
        if (kind === 1) {      /* دبّ */
            return "<g><circle cx='" + (cx - 10) + "' cy='" + (cy - 9) + "' r='5' fill='#8a5a33'/><circle cx='" + (cx + 10) + "' cy='" + (cy - 9) + "' r='5' fill='#8a5a33'/>" +
                "<circle cx='" + cx + "' cy='" + cy + "' r='13' fill='#a8703f'/><ellipse cx='" + cx + "' cy='" + (cy + 5) + "' rx='6.5' ry='5' fill='#f1d3a8'/><circle cx='" + cx + "' cy='" + (cy + 3) + "' r='2.2' fill='#3a2412'/>" +
                "<circle cx='" + (cx - 5) + "' cy='" + (cy - 3) + "' r='2' fill='#2a1a0d'/><circle cx='" + (cx + 5) + "' cy='" + (cy - 3) + "' r='2' fill='#2a1a0d'/></g>";
        }
        if (kind === 2) {      /* أرنب */
            return "<g><ellipse cx='" + (cx - 6) + "' cy='" + (cy - 20) + "' rx='4.2' ry='12' fill='#f4f1ec' stroke='#cfc7bd' stroke-width='1'/><ellipse cx='" + (cx - 6) + "' cy='" + (cy - 20) + "' rx='1.9' ry='8' fill='#f6b6c4'/>" +
                "<ellipse cx='" + (cx + 7) + "' cy='" + (cy - 19) + "' rx='4.2' ry='11' fill='#f4f1ec' stroke='#cfc7bd' stroke-width='1'/><ellipse cx='" + (cx + 7) + "' cy='" + (cy - 19) + "' rx='1.9' ry='7' fill='#f6b6c4'/>" +
                "<circle cx='" + cx + "' cy='" + cy + "' r='13' fill='#f7f4ef' stroke='#cfc7bd' stroke-width='1'/><circle cx='" + (cx - 5) + "' cy='" + (cy - 2) + "' r='2' fill='#2a1a0d'/><circle cx='" + (cx + 5) + "' cy='" + (cy - 2) + "' r='2' fill='#2a1a0d'/>" +
                "<ellipse cx='" + cx + "' cy='" + (cy + 4) + "' rx='2.6' ry='2' fill='#e58aa0'/></g>";
        }
        /* قطة */
        return "<g><path d='M" + (cx - 13) + " " + (cy - 4) + "L" + (cx - 11) + " " + (cy - 19) + "L" + (cx - 2) + " " + (cy - 10) + "Z' fill='#e9a24b'/><path d='M" + (cx + 13) + " " + (cy - 4) + "L" + (cx + 11) + " " + (cy - 19) + "L" + (cx + 2) + " " + (cy - 10) + "Z' fill='#e9a24b'/>" +
            "<circle cx='" + cx + "' cy='" + cy + "' r='13' fill='#f0b862'/><path d='M" + (cx - 3) + " " + (cy - 12) + "v6M" + cx + " " + (cy - 13) + "v7M" + (cx + 3) + " " + (cy - 12) + "v6' stroke='#c47d1e' stroke-width='1.6' stroke-linecap='round'/>" +
            "<circle cx='" + (cx - 5) + "' cy='" + (cy - 1) + "' r='2' fill='#2a1a0d'/><circle cx='" + (cx + 5) + "' cy='" + (cy - 1) + "' r='2' fill='#2a1a0d'/><path d='M" + (cx - 2) + " " + (cy + 4) + "l2 2 2-2z' fill='#d9647a'/></g>";
    }
    function wheel(cx) {
        return "<g class='wheel-g' transform='translate(" + cx + " 82)'><g class='wheel'><circle r='15' fill='#2a3039'/><circle r='8.5' fill='#cfd6de'/><circle r='3' fill='#7b8794'/><path d='M0 -8v16M-8 0h16' stroke='#7b8794' stroke-width='2'/></g></g>";
    }
    function carSvg(n) {
        var P = PAL[n - 1], c = P.c, d = P.d, l = P.l, body, win, drv;
        if (n === 1) {         /* هاتشباك مدوَّر */
            body = "<path d='M12 78V66C12 54 22 50 38 48L60 30C68 22 76 20 88 20H118C132 20 142 26 150 38L160 50C170 53 176 60 176 70V78Z' fill='" + c + "' stroke='" + d + "' stroke-width='3.5' stroke-linejoin='round'/>";
            win = "<path d='M68 32C73 27 79 25 88 25H116C126 25 133 29 139 38H66Z' fill='#e3f3fb' stroke='" + d + "' stroke-width='2.5'/>";
            drv = driver(1, 100, 38);
        } else if (n === 2) {  /* رياضية منخفضة */
            body = "<path d='M8 80V70C8 60 18 57 32 55L62 40C70 35 80 33 92 33H122C134 33 144 38 152 48L168 54C176 56 180 64 180 72V80Z' fill='" + c + "' stroke='" + d + "' stroke-width='3.5' stroke-linejoin='round'/>";
            win = "<path d='M74 38C80 36 86 35 94 35H120C128 35 134 38 140 46H72Z' fill='#e3f3fb' stroke='" + d + "' stroke-width='2.5'/>";
            drv = driver(2, 104, 42);
        } else {               /* فان عالية */
            body = "<path d='M10 80V32C10 24 16 18 26 18H122C132 18 140 22 146 30L160 48C170 51 176 58 176 68V80Z' fill='" + c + "' stroke='" + d + "' stroke-width='3.5' stroke-linejoin='round'/>";
            win = "<rect x='20' y='25' width='42' height='26' rx='6' fill='#e3f3fb' stroke='" + d + "' stroke-width='2.5'/><path d='M70 25H120C128 25 134 29 139 38L142 51H70Z' fill='#e3f3fb' stroke='" + d + "' stroke-width='2.5'/>";
            drv = driver(3, 100, 40);
        }
        return "<svg viewBox='0 0 190 100' aria-hidden='true'><ellipse cx='95' cy='96' rx='80' ry='4.5' fill='#000' opacity='.18'/>" + body + win + drv +
            "<path d='M14 68h160' stroke='" + l + "' stroke-width='3' opacity='.55' stroke-linecap='round'/>" +
            "<rect x='9' y='62' width='9' height='7' rx='3' fill='#ffe58a' stroke='" + d + "' stroke-width='1.6'/><rect x='170' y='60' width='8' height='7' rx='3' fill='#e0483b' stroke='" + d + "' stroke-width='1.6'/>" +
            wheel(48) + wheel(142) + "</svg>";
    }
    function avatarSvg(n) {
        var svg = driver(n, 28, 34);
        return "<svg viewBox='0 0 56 60' aria-hidden='true'>" + svg + "</svg>";
    }
    function sceneSvg(n) {
        /* تلال وأشجار هادئة (ثابتة) */
        var hill = ["#b9dfa8", "#a5d296", "#8fc686"][n - 1], hill2 = ["#9fd18d", "#8cc47f", "#74b870"][n - 1];
        return "<svg class='hills' viewBox='0 0 300 80' preserveAspectRatio='none' aria-hidden='true'><path d='M0 80V46C30 28 62 28 96 44S160 60 200 40S270 24 300 40V80Z' fill='" + hill + "'/>" +
            "<path d='M0 80V58C40 46 80 52 120 58S210 54 250 48S290 54 300 58V80Z' fill='" + hill2 + "'/>" +
            "<g fill='#5aa56a'><rect x='34' y='38' width='4' height='14' fill='#8a6a44'/><circle cx='36' cy='34' r='11'/><rect x='238' y='36' width='4' height='14' fill='#8a6a44'/><circle cx='240' cy='32' r='12'/></g></svg>";
    }

    /* ---------- الصوت (مغلق افتراضيًا) ---------- */
    var soundOn = false, actx = null;
    function tone(freq, dur, vol) {
        if (!soundOn) return;
        try {
            actx = actx || new (window.AudioContext || window.webkitAudioContext)();
            var o = actx.createOscillator(), g = actx.createGain();
            o.type = "sine"; o.frequency.value = freq;
            g.gain.setValueAtTime(vol || .08, actx.currentTime);
            g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + dur);
            o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + dur);
        } catch (e) { /* لا شيء */ }
    }

    /* ---------- حالة كل مسار (مستقلة) ---------- */
    var lanes = CONFIGS.map(function (cfg) {
        return { cfg: cfg, el: document.getElementById("lane" + cfg.id), correct: 0, q: null, prev: null, locked: false, done: false, helpOn: false, wrongs: 0, attempts: 0, timers: [] };
    });
    var ID = {};

    function later(L, fn, ms) { var id = setTimeout(function () { fn(); }, ms); L.timers.push(id); }
    function clearLater(L) { L.timers.forEach(clearTimeout); L.timers = []; }

    function buildLane(L) {
        var cfg = L.cfg, el = L.el;
        el.innerHTML = "";
        var head = h("div", "l-head");
        head.appendChild(h("div", "l-avatar", avatarSvg(cfg.id)));
        head.appendChild(h("h2", "l-title", cfg.title + "<small>" + cfg.sub + "</small>"));
        L.starsEl = h("div", "l-stars");
        head.appendChild(L.starsEl);
        el.appendChild(head);

        L.road = h("div", "road");
        L.road.appendChild(h("div", "sky"));
        L.road.appendChild(h("i", "cloud c1"));
        L.road.appendChild(h("i", "cloud c2"));
        L.road.appendChild(h("div", "hillwrap", sceneSvg(cfg.id)));
        L.road.appendChild(h("div", "asphalt"));
        L.road.appendChild(h("div", "finish"));
        L.road.appendChild(h("div", "flag", "<svg viewBox='0 0 40 60' aria-hidden='true'><rect x='5' y='4' width='3.5' height='54' rx='1.5' fill='#6b7683'/><path d='M8.5 6h26l-6 8 6 8h-26z' fill='#fff' stroke='#16222f' stroke-width='1.6'/><path d='M8.5 6h8v8h-8zM24.5 6h8v8h-8zM16.5 14h8v8h-8z' fill='#16222f'/></svg>"));
        L.car = h("div", "car", carSvg(cfg.id));
        L.road.appendChild(L.car);
        L.sparks = h("div", "sparks");
        L.road.appendChild(L.sparks);
        el.appendChild(L.road);

        L.qArea = h("div", "q-area");
        L.qBody = h("div", "q-body");
        L.qBody.style.cssText = "display:contents";
        L.qArea.appendChild(L.qBody);
        L.hintEl = h("p", "q-hint", "");
        L.helpBox = h("div", "help-box");
        L.qArea.appendChild(L.helpBox);
        L.qArea.appendChild(L.hintEl);
        el.appendChild(L.qArea);

        L.ansEl = h("div", "answers");
        L.ansBtns = [0, 1, 2].map(function () {
            var b = h("button", "ans"); b.type = "button"; b.setAttribute("data-act", "ans"); b.setAttribute("data-lane", cfg.id);
            L.ansEl.appendChild(b); return b;
        });
        el.appendChild(L.ansEl);

        var foot = h("div", "l-foot");
        if (cfg.help) {
            L.helpBtn = h("button", "btn", cfg.help === "dots" ? "مساعدة: نقاط" : "مساعدة: خط الأعداد");
            L.helpBtn.type = "button"; L.helpBtn.setAttribute("data-act", "help"); L.helpBtn.setAttribute("data-lane", cfg.id);
            foot.appendChild(L.helpBtn);
        }
        var rs = h("button", "btn", "إعادة المسار"); rs.type = "button"; rs.setAttribute("data-act", "restart"); rs.setAttribute("data-lane", cfg.id);
        foot.appendChild(rs);
        el.appendChild(foot);

        L.cele = h("div", "cele");
        L.cele.hidden = true;
        L.cele.innerHTML = "<div class='big-stars'>" + new Array(TOTAL + 1).join(STAR) + "</div><h2>أحسنت! وصلتَ إلى النهاية</h2><p>أجبتَ عن " + ar(TOTAL) + " أسئلة صحيحة</p>";
        var again = h("button", "btn", "العب مرة أخرى"); again.type = "button"; again.setAttribute("data-act", "restart"); again.setAttribute("data-lane", cfg.id);
        L.cele.appendChild(again);
        el.appendChild(L.cele);
    }
    function laneColor(L) { return PAL[L.cfg.id - 1].c; }

    function renderStars(L) {
        var s = "";
        for (var i = 0; i < TOTAL; i++) s += STAR.replace("<svg ", "<svg class='" + (i < L.correct ? "on" : "off") + "' ");
        L.starsEl.innerHTML = s;
        L.starsEl.setAttribute("aria-label", "النجوم " + ar(L.correct) + " من " + ar(TOTAL));
    }
    function layoutCars() {
        lanes.forEach(function (L) {
            if (!L.road || !L.car) return;
            var rw = L.road.clientWidth, cw = L.car.offsetWidth, u = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--u")) || 10;
            var start = u * .6, end = rw - cw - u * 3.2;               /* تتوقف قبل خط النهاية فلا تغطيه */
            var dist = (end - start) * L.correct / TOTAL;
            L.car.style.right = start + "px";
            L.car.style.transform = "translateX(" + (-dist) + "px)";
        });
    }
    /* لمعان هادئ عند الإجابة الصحيحة (بصري فقط، بطيء، لا يغطي السؤال لأنه داخل مشهد الطريق) */
    function sparkle(L) {
        var r = L.car.getBoundingClientRect(), rr = L.road.getBoundingClientRect();
        for (var k = 0; k < 4; k++) {
            var s = h("i", "spark");
            s.style.left = (r.left - rr.left + r.width * (.2 + .2 * k)) + "px";
            s.style.top = (r.top - rr.top + r.height * .1) + "px";
            s.style.animationDelay = (k * .12) + "s";
            L.sparks.appendChild(s);
            (function (n) { setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 1700); })(s);
        }
        L.el.classList.add("moving");
        later(L, function () { L.el.classList.remove("moving"); }, 1000);
    }

    function showQuestion(L) {
        var q = L.q = genQuestion(L.cfg, L.prev);
        L.prev = q.key; L.locked = false; L.helpOn = false;
        var body = L.qBody; body.innerHTML = "";
        if (L.cfg.kind === "pics") {
            var pics = h("div", "q-pics");
            var g1 = h("div", "grp"), g2 = h("div", "grp");
            g1.setAttribute("aria-label", ar(q.a) + " صور"); g2.setAttribute("aria-label", ar(q.b) + " صور");
            for (var i = 0; i < q.a; i++) g1.insertAdjacentHTML("beforeend", ICON[q.icon]);
            for (var j = 0; j < q.b; j++) g2.insertAdjacentHTML("beforeend", ICON[q.icon]);
            pics.appendChild(g1); pics.appendChild(h("span", "plus", "+")); pics.appendChild(g2);
            body.appendChild(pics);
            body.appendChild(h("div", "q-eq", "<span class='op'>=</span><span class='qm'>؟</span>"));
        } else {
            body.appendChild(h("div", "q-eq", ar(q.a) + "<span class='op'>+</span>" + ar(q.b) + "<span class='op'>=</span><span class='qm'>؟</span>"));
        }
        L.helpBox.innerHTML = "";
        L.hintEl.textContent = L.cfg.kind === "pics" ? "عُدّ الصور كلها ثم اختر الناتج" : "اختر الناتج الصحيح";
        L.hintEl.className = "q-hint";
        L.ansBtns.forEach(function (b, i) {
            b.textContent = ar(q.options[i]); b.setAttribute("data-val", q.options[i]);
            b.className = "ans"; b.disabled = false;
            b.setAttribute("aria-label", "الإجابة " + ar(q.options[i]));
        });
        if (L.helpBtn) { L.helpBtn.classList.remove("on"); L.helpBtn.hidden = false; }
    }

    function resetLane(L) {
        clearLater(L);
        L.correct = 0; L.done = false; L.prev = null; L.wrongs = 0; L.attempts = 0;
        L.cele.hidden = true;
        renderStars(L);
        showQuestion(L);
        layoutCars();
        L.el.classList.remove("done");
    }

    /* ---------- المساعدة ---------- */
    function toggleHelp(L) {
        if (L.done || !L.q) return;
        L.helpOn = !L.helpOn;
        L.helpBtn.classList.toggle("on", L.helpOn);
        L.helpBox.innerHTML = "";
        if (!L.helpOn) return;
        var q = L.q;
        if (L.cfg.help === "dots") {
            var d = "<div class='dots'><span class='g'>" + new Array(q.a + 1).join("<i></i>") + "</span><b>+</b><span class='g g2'>" + new Array(q.b + 1).join("<i></i>") + "</span></div>";
            L.helpBox.innerHTML = d;
        } else {
            var W = 440, x0 = 22, dx = 39.6, svg = "<svg viewBox='0 0 440 92' aria-hidden='true'><line x1='10' y1='56' x2='430' y2='56' stroke='#4a5b6d' stroke-width='3'/>";
            for (var i = 0; i <= 10; i++) {
                var x = x0 + i * dx;
                svg += "<line x1='" + x + "' y1='48' x2='" + x + "' y2='64' stroke='#4a5b6d' stroke-width='3'/><text x='" + x + "' y='86' font-size='22' text-anchor='middle' fill='#16222f' font-family='inherit'>" + ar(i) + "</text>";
            }
            svg += "<circle cx='" + (x0 + q.a * dx) + "' cy='56' r='9' fill='" + laneColor(L) + "'/>";
            for (var k = 0; k < q.b; k++) {
                var xa = x0 + (q.a + k) * dx, xb = x0 + (q.a + k + 1) * dx;
                svg += "<path d='M" + xa + " 50 Q" + ((xa + xb) / 2) + " 6 " + (xb - 3) + " 46' fill='none' stroke='#7a4aa0' stroke-width='3.4' stroke-linecap='round'/><path d='M" + (xb - 11) + " 40l9 8-12 2z' fill='#7a4aa0'/>";
            }
            svg += "</svg>";
            L.helpBox.innerHTML = svg;
        }
    }

    /* ---------- الإجابة ---------- */
    function answer(L, btn) {
        if (L.done || L.locked || btn.disabled) return;
        var v = +btn.getAttribute("data-val");
        L.attempts++;
        if (v === L.q.sum) {
            L.locked = true;
            L.correct++;
            btn.classList.add("right");
            L.ansBtns.forEach(function (b) { if (b !== btn) b.disabled = true; });
            L.hintEl.textContent = "أحسنت! نجمة جديدة ★"; L.hintEl.className = "q-hint ok";
            renderStars(L); layoutCars(); sparkle(L);
            tone([523, 659, 784][L.cfg.id - 1], .25, .08);
            if (L.correct >= TOTAL) {
                L.done = true;
                later(L, function () { L.cele.hidden = false; L.el.classList.add("done"); }, 900);
            } else {
                later(L, function () { showQuestion(L); }, 900);
            }
        } else {
            L.wrongs++;
            btn.classList.add("wrong"); btn.disabled = true;
            L.hintEl.textContent = "حاول مرة أخرى"; L.hintEl.className = "q-hint";
            tone(220, .18, .05);
        }
    }

    /* ---------- اللمس: Pointer Events، كل مؤشر مستقل ---------- */
    var downs = {};          /* pointerId -> {el, lane} */
    function actOf(t) { return t && t.closest ? t.closest("[data-act]") : null; }
    function laneOf(el) { var n = el && el.closest ? el.closest(".lane") : null; return n ? lanes[(+n.getAttribute("data-lane")) - 1] : null; }
    function activate(el) {
        var L = laneOf(el); if (!L) return;
        var act = el.getAttribute("data-act");
        if (act === "ans") answer(L, el);
        else if (act === "help") toggleHelp(L);
        else if (act === "restart") resetLane(L);
    }
    var lanesEl = document.getElementById("lanes");
    lanesEl.addEventListener("pointerdown", function (e) {
        var el = actOf(e.target); if (!el || el.disabled) return;
        downs[e.pointerId] = el; el.classList.add("press");
    });
    function release(e, doAct) {
        var el = downs[e.pointerId]; if (!el) return;
        delete downs[e.pointerId];
        /* لا يزال أي مؤشر آخر ضاغطًا على الزر نفسه؟ نُبقي الإطار */
        var still = false; for (var k in downs) if (downs[k] === el) still = true;
        if (!still) el.classList.remove("press");
        if (!doAct) return;
        var under = document.elementFromPoint(e.clientX, e.clientY);
        if (under && (under === el || el.contains(under))) activate(el);
    }
    lanesEl.addEventListener("pointerup", function (e) { release(e, true); });
    lanesEl.addEventListener("pointercancel", function (e) { release(e, false); });
    /* مؤشر رُفع خارج الشاشة/المسار */
    document.addEventListener("pointerup", function (e) { if (downs[e.pointerId]) release(e, true); });
    document.addEventListener("pointercancel", function (e) { if (downs[e.pointerId]) release(e, false); });
    /* لوحة المفاتيح (اختبار/وصول): Enter/Space */
    lanesEl.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.getAttribute && e.target.getAttribute("data-act")) { e.preventDefault(); activate(e.target); } });
    ["contextmenu", "gesturestart", "dblclick"].forEach(function (t) { document.addEventListener(t, function (e) { e.preventDefault(); }); });

    /* ---------- أدوات المعلم + وضع اختبار اللمس ---------- */
    var toolSound = document.getElementById("toolSound"), toolTouch = document.getElementById("toolTouch");
    var panel = document.getElementById("touchPanel"), layer = document.getElementById("touchLayer");
    var tpNow = document.getElementById("tpNow"), tpMax = document.getElementById("tpMax"), tpLane = document.getElementById("tpLane"), tpLog = document.getElementById("tpLog");
    var touchMode = false, active = {}, maxNow = 0, logItems = [];
    function toolTap(btn, fn) {
        var started = false;
        btn.addEventListener("pointerdown", function () { started = true; });
        btn.addEventListener("pointerup", function (e) { if (!started) return; started = false; var u = document.elementFromPoint(e.clientX, e.clientY); if (u && (u === btn || btn.contains(u))) fn(); });
        btn.addEventListener("pointercancel", function () { started = false; });
        btn.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } });
    }
    toolTap(toolSound, function () {
        soundOn = !soundOn;
        toolSound.setAttribute("aria-pressed", String(soundOn));
        toolSound.textContent = soundOn ? "🔊 الصوت: مفتوح" : "🔇 الصوت: مغلق";
        if (soundOn) tone(440, .12, .05);
    });
    toolTap(toolTouch, function () {
        touchMode = !touchMode;
        toolTouch.setAttribute("aria-pressed", String(touchMode));
        panel.hidden = !touchMode;
        if (!touchMode) { layer.innerHTML = ""; active = {}; }
        resetTouchStats();
    });
    function resetTouchStats() { maxNow = 0; logItems = []; tpMax.textContent = ar(0); tpNow.textContent = ar(Object.keys(active).length); tpLog.innerHTML = ""; tpLane.textContent = "—"; }
    toolTap(document.getElementById("tpReset"), function () { active = {}; layer.innerHTML = ""; resetTouchStats(); });
    function laneAtX(x) {
        var r = stage.getBoundingClientRect(), rel = (x - r.left) / r.width;      /* 0..1 من اليسار */
        if (rel < 0 || rel > 1) return null;
        return rel > 2 / 3 ? 1 : (rel > 1 / 3 ? 2 : 3);                             /* المسار الأول على اليمين */
    }
    function updateDots() {
        var n = Object.keys(active).length;
        tpNow.textContent = ar(n);
        if (n > maxNow) { maxNow = n; tpMax.textContent = ar(maxNow); }
        var lns = {}; Object.keys(active).forEach(function (k) { var l = laneAtX(active[k].x); if (l) lns[l] = 1; });
        tpLane.textContent = Object.keys(lns).map(function (x) { return ar(x); }).join("، ") || "—";
    }
    function track(type) {
        document.addEventListener(type, function (e) {
            if (!touchMode) return;
            var r = stage.getBoundingClientRect();
            if (type === "pointerup" || type === "pointercancel") {
                var d = active[e.pointerId]; delete active[e.pointerId];
                var dot = document.getElementById("tp" + e.pointerId); if (dot) dot.remove();
                pushLog((type === "pointerup" ? "رفع" : "إلغاء") + " #" + ar(e.pointerId) + " " + laneName(laneAtX(e.clientX)));
            } else {
                var first = !active[e.pointerId];
                active[e.pointerId] = { x: e.clientX, y: e.clientY, type: e.pointerType };
                var dd = document.getElementById("tp" + e.pointerId);
                if (!dd) { dd = h("div", "tp-dot"); dd.id = "tp" + e.pointerId; dd.textContent = ar(e.pointerId); layer.appendChild(dd); }
                dd.style.left = (e.clientX - r.left) + "px"; dd.style.top = (e.clientY - r.top) + "px";
                if (type === "pointerdown" && first) pushLog("نزول #" + ar(e.pointerId) + " " + laneName(laneAtX(e.clientX)) + " (" + (e.pointerType || "؟") + ")");
            }
            updateDots();
        }, true);
    }
    function laneName(n) { return n ? "المسار " + ar(n) : "خارج المسارات"; }
    function pushLog(t) { logItems.unshift(t); logItems = logItems.slice(0, 3); tpLog.innerHTML = logItems.map(function (x) { return "<li>" + x + "</li>"; }).join(""); }
    ["pointerdown", "pointermove", "pointerup", "pointercancel"].forEach(track);

    /* ---------- البدء ---------- */
    lanes.forEach(function (L) { buildLane(L); renderStars(L); showQuestion(L); });
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    fit();
    try { if (/[?&]touchtest=1/.test(location.search) || location.hash === "#touchtest") { touchMode = true; toolTouch.setAttribute("aria-pressed", "true"); panel.hidden = false; resetTouchStats(); } } catch (e) { /* لا شيء */ }
    setTimeout(layoutCars, 50);

    /* واجهة للاختبار الآلي فقط */
    window.__heroes = { lanes: lanes, genQuestion: genQuestion, answer: answer, resetLane: resetLane, TOTAL: TOTAL, ar: ar, touch: function () { return { now: Object.keys(active).length, max: maxNow }; } };
})();
