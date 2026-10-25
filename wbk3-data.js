/* =========================================================================
   📙 الدرس الثالث «أقرأ كلمات جميع حروفها مفتوحة» — البيانات فقط (لا منطق ولا واجهة)
   المصدر الوحيد: «الدليل المبسط لتعلم القراءة بالحركات القصيرة» — صفحة ٦ من الملف
   (الدرس المطبوع ٥): ٢٥ كلمة في خمسة أسطر، كل كلمة ثلاثة أحرف وكل حرف بفتحة، بلا تكرار.
   -------------------------------------------------------------------------
   - الكلمات بترتيب الكتاب حرفيًا (من اليمين إلى اليسار، سطرًا سطرًا). لا كلمات من خارج الصفحة.
   - الصوت: تسجيل كامل لكل كلمة، كلها معتمدة من صاحب المشروع بعد الاستماع (٢٥ من ٢٥):
       ١٣ تسجيلًا قديمًا في مساراته الأصلية دون تعديل، و١٢ جديدًا بأسماء wbk3_*.mp3.
   - مقطع أول حرفين: يُؤخذ من WBK2_DATA (مصدر الحقيقة للدرس الثاني) بحالة اعتماده كما هي؛
     المقطع المرفوض أو غير الموجود في الدرس الثاني لا يُشغَّل ولا يُركَّب من أصوات حروف.
   - يُحمَّل هذا الملف في الصفحة بعد wbk2-data.js، ويستورده service-worker.js للتخزين المسبق.
   ========================================================================= */
(function (root) {
    "use strict";

    var FATHA = "َ";
    var TATWEEL = "ـ";
    var EDU = "assets/audio/educational/";

    /* الحروف التي تتصل بما بعدها (كشيدة بعد الحرف الثاني في عرض مقطع أول حرفين) */
    var CONNECTS = "بتثجحخسشصضطظعغفقكلمنهيئ";

    /* الكلمات بترتيب الكتاب: [الرقم، الكلمة بلا تشكيل] */
    var RAW = [
        [1, "قرأ"], [2, "كتب"], [3, "جلس"], [4, "زرع"], [5, "أكل"],
        [6, "رفع"], [7, "طلع"], [8, "حرث"], [9, "رسم"], [10, "دخل"],
        [11, "غرس"], [12, "فتح"], [13, "أخذ"], [14, "هرب"], [15, "وقف"],
        [16, "نظر"], [17, "خرج"], [18, "حمل"], [19, "وقع"], [20, "كسر"],
        [21, "نشر"], [22, "نبت"], [23, "خبز"], [24, "جمع"], [25, "وجد"]
    ];

    /* تسجيلات الكلمات (معتمدة كلها). القديمة في أماكنها الأصلية */
    var AUDIO = {
        1: EDU + "verbs/verb_03.mp3", 2: EDU + "verbs/verb_01.mp3", 3: EDU + "words/extra_041.mp3",
        4: EDU + "words/wbk3_04_zay-raa-ain.mp3", 5: EDU + "words/wbk3_05_alef-kaf-lam.mp3",
        6: EDU + "words/wbk3_06_raa-faa-ain.mp3", 7: EDU + "verbs/verb_04.mp3", 8: EDU + "verbs/verb_05.mp3",
        9: EDU + "words/wbk3_09_raa-seen-meem.mp3", 10: EDU + "verbs/verb_10.mp3",
        11: EDU + "words/wbk3_11_ghain-raa-seen.mp3", 12: EDU + "words/extra_212.mp3", 13: EDU + "verbs/verb_06.mp3",
        14: EDU + "words/wbk3_14_ha-raa-ba.mp3", 15: EDU + "words/wbk3_15_waw-qaf-faa.mp3",
        16: EDU + "words/wbk3_16_noon-zaa-raa.mp3", 17: EDU + "verbs/verb_07.mp3", 18: EDU + "verbs/verb_09.mp3",
        19: EDU + "words/wbk3_19_waw-qaf-ain.mp3", 20: EDU + "words/wbk3_20_kaf-seen-raa.mp3",
        21: EDU + "words/wbk3_21_noon-sheen-raa.mp3", 22: EDU + "words/wbk3_22_noon-ba-ta.mp3",
        23: EDU + "verbs/verb_08.mp3", 24: EDU + "verbs/verb_11.mp3", 25: EDU + "verbs/verb_12.mp3"
    };
    var APPROVED = {};
    for (var k = 1; k <= 25; k++) APPROVED[k] = true;

    /* مقاطع أول حرفين المعتمدة في الدرس الثاني (بحسب مفتاح المقطع بالتشكيل) */
    var W2 = root.WBK2_DATA, SYLBY = {};
    if (W2 && W2.SYLLABLES) W2.SYLLABLES.forEach(function (s) { SYLBY[s.key] = s; });

    function pad(n) { return (n < 10 ? "0" : "") + n; }

    var WORDS = RAW.map(function (r) {
        var ls = r[1].split("");
        var a = ls[0], b = ls[1], c = ls[2];
        var pre = a + FATHA + b + FATHA;
        var sy = SYLBY[pre];
        var hasSyl = !!(sy && sy.approved && sy.audio);
        return {
            id: "w" + pad(r[0]),
            n: r[0],
            a: { base: a, ch: a + FATHA },
            b: { base: b, ch: b + FATHA },
            c: { base: c, ch: c + FATHA },
            /* الكلمة كما في الكتاب: ثلاثة أحرف بفتحة، نص واحد متصل */
            shown: pre + c + FATHA,
            key: pre + c + FATHA,
            /* مقطع أول حرفين متصلًا (كشيدة بعد الثاني إن كان يتصل بما بعده) */
            sylShown: pre + (CONNECTS.indexOf(b) >= 0 ? TATWEEL : ""),
            sylKey: pre,
            audio: AUDIO[r[0]] || "",
            approved: !!(APPROVED[r[0]] && AUDIO[r[0]]),
            /* صوت المقطع من الدرس الثاني: فقط إن كان معتمدًا */
            sylAudio: hasSyl ? sy.audio : "",
            sylApproved: hasSyl
        };
    });

    var CELLS = WORDS.map(function (w) { return w.id; });
    /* مجموعات التدرّج = أسطر الكتاب */
    var GROUPS = [[], [], [], [], []];
    WORDS.forEach(function (w) { GROUPS[Math.floor((w.n - 1) / 5)].push(w.id); });

    /* عائلات التشابه البصري للحروف (كما في الدرسين السابقين) */
    var FAMILIES = ["بتثني", "جحخ", "دذ", "رز", "سش", "صض", "طظ", "عغ", "فق"];

    /* المراحل: الأنشطة الستة المعتمدة + مراجعة. كلها مفتوحة بلا أقفال */
    var STAGES = [
        { id: "discover", n: 1, title: "أتهجّى وأدمج", how: "حرف، ثم حرفان معًا، ثم الكلمة كاملة", audio: false },
        { id: "build", n: 2, title: "أبني الكلمة", how: "أرتّب الحروف الثلاثة من اليمين", audio: false },
        { id: "hear", n: 3, title: "أسمع وأختار الكلمة", how: "أسمع الكلمة ثم أختار شكلها", audio: true },
        { id: "missing", n: 4, title: "أي حرف ينقص؟", how: "أقرأ الحرفين وأكمل الكلمة", audio: false },
        { id: "read", n: 5, title: "أقرأ بنفسي", how: "أقرأ الكلمة بصوتي والمعلم يؤكد", audio: false },
        { id: "test", n: 6, title: "اختبار الإتقان", how: "٨ أسئلة قصيرة بلا مساعدة", audio: true },
        { id: "review", n: 7, title: "مراجعة", how: "أعيد الكلمات التي أحتاج أن أتقنها", audio: false }
    ];

    var CONFIG = {
        sessionLength: 6,
        promoteStreak: 3,
        minApprovedForAudioStages: 3,
        groupAdvanceRatio: 0.8,
        /* نجمة إتقان الكلمة: نجاح مستقل (من أول مرة بلا مساعدة ولا نموذج بصري) في نشاطين مختلفين،
           أو قراءة مستقلة يؤكدها المعلم */
        star: { independentActivities: 2 },
        test: { total: 8, mix: { hear: 2, build: 2, missing: 2, read: 2 }, passAuto: 5, autoTotal: 6, maxStars: 1 }
    };

    root.WBK3_DATA = {
        FATHA: FATHA,
        TATWEEL: TATWEEL,
        WORDS: WORDS,
        CELLS: CELLS,
        GROUPS: GROUPS,
        FAMILIES: FAMILIES,
        STAGES: STAGES,
        CONFIG: CONFIG,
        /* ملفات الصوت المعتمدة فقط — يستعملها service-worker.js للتخزين المسبق
           (تسجيلات الكلمات؛ مقاطع الدرس الثاني يخزّنها wbk2-data.js) */
        approvedAudioFiles: function () {
            return WORDS.filter(function (w) { return w.approved && w.audio; }).map(function (w) { return w.audio; });
        }
    };
})(typeof self !== "undefined" ? self : window);
