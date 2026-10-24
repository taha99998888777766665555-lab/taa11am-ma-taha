/* =========================================================================
   📘 الدرس الثاني «أقرأ حرفين مفتوحين» — البيانات فقط (لا منطق ولا واجهة)
   المصدر الوحيد: «الدليل المبسط لتعلم القراءة بالحركات القصيرة» — صفحة ٥ من الملف
   (الدرس المطبوع ٤): ٢٥ خلية في خمسة أسطر، ٢٤ مقطعًا فريدًا («وَقَـ» مكرر في الخليتين ١٥ و١٩).
   -------------------------------------------------------------------------
   - الخلايا بترتيب الكتاب حرفيًا (من اليمين إلى اليسار، صفًّا صفًّا).
   - لا مقاطع من خارج الصفحة، ولا مدود، ولا ضمة أو كسرة، ولا كلمات.
   - الصوت: سجل «اعتماد» صريح لكل مقطع. الملف غير المعتمد لا يُشغَّل أبدًا ولو وُجد.
     تُرفَع الموافقة بتحويل approved إلى true بعد استماع صاحب المشروع واعتماده فقط.
   - يُحمَّل هذا الملف في الصفحة، ويستورده service-worker.js لمعرفة الأصوات المعتمدة
     وتخزينها مسبقًا (مصدر واحد للحقيقة).
   ========================================================================= */
(function (root) {
    "use strict";

    var FATHA = "َ";
    var TATWEEL = "ـ";
    var DIR = "assets/audio/educational/syllables/";

    /* الحروف التي تتصل بما بعدها (لعرض الكشيدة كما في الكتاب بعد الحرف الثاني) */
    var CONNECTS = "بتثجحخسشصضطظعغفقكلمنهيئ";

    /* المقاطع الفريدة بترتيب أول ظهور في الكتاب: [رقم الخلية الأولى، الحرف الأول، الحرف الثاني] */
    var RAW = [
        [1, "ق", "ر"], [2, "ك", "ت"], [3, "ج", "ل"], [4, "ز", "ر"], [5, "أ", "ك"],
        [6, "ر", "ف"], [7, "ط", "ل"], [8, "ح", "ر"], [9, "ر", "س"], [10, "د", "خ"],
        [11, "غ", "ر"], [12, "ف", "ت"], [13, "أ", "خ"], [14, "ه", "ر"], [15, "و", "ق"],
        [16, "ن", "ظ"], [17, "م", "ك"], [18, "ح", "م"], [20, "ش", "ر"],
        [21, "ن", "ش"], [22, "ن", "ب"], [23, "خ", "ب"], [24, "ج", "م"], [25, "و", "ج"]
    ];

    /* الصوت: التسجيلات السبعة المعتمدة (ملفات l2_* القديمة كما هي، لا تُعدَّل)
       والتسجيلات الجديدة بأسماء wbk2_*.mp3 (غير معتمدة حتى يعتمدها صاحب المشروع).
       الستة المرفوضة (قَرَ، هَرَ، وَقَـ، حَمَـ، خَبَـ، وَجَـ) لا تُستخدم من ملفات l2_* إطلاقًا. */
    var AUDIO = {
        /* معتمدة */
        2: { file: DIR + "l2_02.mp3", approved: true },   /* كَتَـ */
        5: { file: DIR + "l2_09.mp3", approved: true },   /* أَكَـ */
        7: { file: DIR + "l2_12.mp3", approved: true },   /* طَلَـ */
        10: { file: DIR + "l2_07.mp3", approved: true },  /* دَخَـ */
        12: { file: DIR + "l2_14.mp3", approved: true },  /* فَتَـ */
        16: { file: DIR + "l2_03.mp3", approved: true },  /* نَظَـ */
        24: { file: DIR + "l2_04.mp3", approved: true },  /* جَمَـ */
        /* معتمدة بعد استماع صاحب المشروع (التسجيلات الجديدة) */
        /* مرفوضة بعد الاستماع: قيد الإعداد ولا يُشغَّل شيء (الملف غير موجود عمدًا) — قَرَ */
        1: { file: DIR + "wbk2_01_qaf-raa.mp3", approved: false },
        3: { file: DIR + "wbk2_03_jeem-lam.mp3", approved: true },
        4: { file: DIR + "wbk2_04_zay-raa.mp3", approved: true },
        6: { file: DIR + "wbk2_06_raa-faa.mp3", approved: true },
        8: { file: DIR + "wbk2_08_haa-raa.mp3", approved: true },
        9: { file: DIR + "wbk2_09_raa-seen.mp3", approved: true },
        11: { file: DIR + "wbk2_11_ghain-raa.mp3", approved: true },
        13: { file: DIR + "wbk2_13_alef-khaa.mp3", approved: true },
        14: { file: DIR + "wbk2_14_ha-raa.mp3", approved: true },
        15: { file: DIR + "wbk2_15_waw-qaf.mp3", approved: true },
        17: { file: DIR + "wbk2_17_meem-kaf.mp3", approved: true },
        18: { file: DIR + "wbk2_18_haa-meem.mp3", approved: true },
        20: { file: DIR + "wbk2_20_sheen-raa.mp3", approved: true },
        21: { file: DIR + "wbk2_21_noon-sheen.mp3", approved: false },  /* مرفوض: نَشَـ */
        22: { file: DIR + "wbk2_22_noon-ba.mp3", approved: true },
        23: { file: DIR + "wbk2_23_khaa-ba.mp3", approved: false },    /* مرفوض: خَبَـ */
        25: { file: DIR + "wbk2_25_waw-jeem.mp3", approved: true }
    };

    function pad(n) { return (n < 10 ? "0" : "") + n; }

    var SYLLABLES = RAW.map(function (r) {
        var a = r[1], b = r[2];
        var au = AUDIO[r[0]] || { file: "", approved: false };
        return {
            id: "s" + pad(r[0]),
            cell: r[0],
            a: { base: a, ch: a + FATHA },
            b: { base: b, ch: b + FATHA },
            /* العرض كما في الكتاب: الحرفان بالفتحة، وكشيدة بعد الثاني إن كان يتصل بما بعده */
            shown: a + FATHA + b + FATHA + (CONNECTS.indexOf(b) >= 0 ? TATWEEL : ""),
            /* المفتاح: نص المقطع بلا كشيدة (لا يدخل في النطق ولا في مطابقة الإجابات) */
            key: a + FATHA + b + FATHA,
            audio: au.file,
            approved: !!au.approved
        };
    });

    /* الخلايا الخمس والعشرون بترتيب الكتاب: معرّف المقطع في كل خلية (وَقَـ في ١٥ و١٩) */
    var CELLS = [];
    (function () {
        var byCell = {};
        SYLLABLES.forEach(function (s) { byCell[s.cell] = s.id; });
        for (var c = 1; c <= 25; c++) CELLS.push(byCell[c] || byCell[15]);
    })();

    /* مجموعات التدرّج = أسطر الكتاب (المقاطع الفريدة بحسب أول ظهور) */
    var GROUPS = [[], [], [], [], []];
    SYLLABLES.forEach(function (s) { GROUPS[Math.floor((s.cell - 1) / 5)].push(s.id); });

    /* عائلات التشابه البصري للحروف المتصلة (مقاسة في الدرس الأول للشكل المتصل) */
    var FAMILIES = ["بتثني", "جحخ", "دذ", "رز", "سش", "صض", "طظ", "عغ", "فق"];

    /* المراحل: مسار بصري من سبع عقد (ست مراحل + مراجعة). كلها مفتوحة بلا أقفال */
    var STAGES = [
        { id: "discover", n: 1, title: "أكتشف المقطع", how: "أرى الحرفين، ثم أسمع المقطع كاملًا", audio: false },
        { id: "hear", n: 2, title: "أسمع وأختار", how: "أسمع المقطع ثم أختار شكله الصحيح", audio: true },
        { id: "build", n: 3, title: "أبني المقطع", how: "أرتّب الحرفين بالترتيب لأكوّن المقطع", audio: false },
        { id: "decode", n: 4, title: "أميّز وأقرأ", how: "أقرأ الحرفين وأختار المقطع المتصل", audio: false },
        { id: "read", n: 5, title: "تحدي القراءة", how: "أقرأ المقطع بصوتي ثم أتأكد", audio: false },
        { id: "test", n: 6, title: "تقييم الإتقان", how: "٨ أسئلة قصيرة بلا مساعدة", audio: true },
        { id: "review", n: 7, title: "مراجعة", how: "أعيد المقاطع التي أحتاج أن أتقنها", audio: false }
    ];

    /* إعدادات الجلسات والاختبار */
    var CONFIG = {
        sessionLength: 6,
        promoteStreak: 3,
        minApprovedForAudioStages: 3,
        groupAdvanceRatio: 0.8,
        /* نجمة إتقان المقطع: نجاح مستقل (من أول مرة بلا مساعدة) في نشاطين مختلفين، أو قراءة مؤكدة من المعلم */
        star: { independentActivities: 2 },
        test: { total: 8, mix: { hear: 2, build: 2, decode: 2, read: 2 }, passAuto: 5, autoTotal: 6, maxStars: 1 }
    };

    root.WBK2_DATA = {
        FATHA: FATHA,
        TATWEEL: TATWEEL,
        SYLLABLES: SYLLABLES,
        CELLS: CELLS,
        GROUPS: GROUPS,
        FAMILIES: FAMILIES,
        STAGES: STAGES,
        CONFIG: CONFIG,
        /* ملفات الصوت المعتمدة فقط — يستعملها service-worker.js للتخزين المسبق */
        approvedAudioFiles: function () {
            return SYLLABLES.filter(function (s) { return s.approved && s.audio; }).map(function (s) { return s.audio; });
        }
    };
})(typeof self !== "undefined" ? self : window);
