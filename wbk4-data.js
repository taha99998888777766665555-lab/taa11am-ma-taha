/* =========================================================================
   📕 الدرس الرابع «أقرأ جملًا من كلمتين» — البيانات فقط (لا منطق ولا واجهة)
   المصدر الوحيد: «الدليل المبسط لتعلم القراءة بالحركات القصيرة» — صفحة ٧ من الملف (الدرس المطبوع ٦):
   ٨ جمل (حُذفت الجملتان «قَرَأَ وَكَتَبَ» و«دَرَسَ وَنَجَحَ» نهائيًا بطلب صاحب المشروع)، كل جملة كلمتان من ثلاثة أحرف بالفتحة بينهما «وَ». الجمل بترتيب الكتاب حرفيًا
   (من اليمين إلى اليسار، سطرًا سطرًا). لا جمل من خارج الصفحة، ولا تغيير في التشكيل.
   -------------------------------------------------------------------------
   - الواو «وَ» تُعرض متصلة بالكلمة الثانية («وَنَزَلَ») وتُعامل معها وحدةً واحدة في الترتيب.
   - الصوت: تسجيل مستقل لكل جملة كاملة (٨)، وتسجيل لكل كلمة منفردة: ٨ كلمات من الدرس الثالث
     (تسجيلاتها المعتمدة هناك) و١٠ كلمات جديدة من الدفعة wbk4_w03..w12. لا TTS ولا تركيب جملة من أصوات كلمات.
   - حالة مطابقة الدفعة: بترتيب الدفعة (الدفعة الأصلية ٢٢ ملفًا؛ يُستعمل منها ١٨: ٨ جمل و١٠ كلمات جديدة. ملفات الجملتين المحذوفتين وكلمتيهما محفوظة أصلًا في source-audio ولا تُستعمل ولا تُخزَّن مسبقًا).
     لم يتوفّر CSV الأصلي ولا استماع بعد، فهي «بانتظار تأكيد الاستماع» (AUDIO_CHECKED = false).
     صفحة l4-audio-check.html تعرض كل ملف مع نصه المفترض لتأكيده.
   - النسخ الأصلية للدفعة محفوظة كما هي في source-audio/batch_12/ (لا تُخزَّن مسبقًا ولا تُستعمل).
   - يُحمَّل هذا الملف بعد wbk3-data.js، ويستورده service-worker.js للتخزين المسبق.
   ========================================================================= */
(function (root) {
    "use strict";

    var FATHA = "َ";
    var EDU = "assets/audio/educational/";
    var SENT_DIR = EDU + "sentences/";
    var WORD_DIR = EDU + "words/";
    var AUDIO_CHECKED = false;

    /* الجمل بترتيب الكتاب: [الرقم، الكلمة الأولى، الكلمة الثانية] كما طُبعت بالتشكيل الكامل */
    var RAW = [
        [3, "طَلَعَ", "نَزَلَ", "talaa-wanazala"],
        [4, "فَتَحَ", "أَخَذَ", "fataha-waakhatha"],
        [5, "رَكَعَ", "سَجَدَ", "rakaa-wasajada"],
        [6, "سَقَطَ", "نَهَضَ", "saqata-wanahada"],
        [7, "طَبَخَ", "أَكَلَ", "tabakha-waakala"],
        [8, "سَبَحَ", "غَطَسَ", "sabaha-waghatasa"],
        [9, "وَقَفَ", "نَظَرَ", "waqafa-wanazara"],
        [10, "ذَهَبَ", "رَجَعَ", "thahaba-warajaa"]
    ];

    /* الكلمات الاثنتا عشرة الجديدة (ملفات الدفعة، بترتيب ورودها في الجمل) */
    var NEW_WORDS = [
        ["نَزَلَ", "w03_noon-zay-lam"],
        ["رَكَعَ", "w04_raa-kaf-ain"], ["سَجَدَ", "w05_seen-jeem-dal"], ["سَقَطَ", "w06_seen-qaf-taa"],
        ["نَهَضَ", "w07_noon-ha-dad"], ["طَبَخَ", "w08_taa-ba-khaa"], ["سَبَحَ", "w09_seen-ba-haa"],
        ["غَطَسَ", "w10_ghain-taa-seen"], ["ذَهَبَ", "w11_thal-ha-ba"], ["رَجَعَ", "w12_raa-jeem-ain"]
    ];

    /* كلمات الدرس الثالث الثمانية: تسجيلاتها المعتمدة هناك (مصدر الحقيقة: WBK3_DATA) */
    var W3 = root.WBK3_DATA, L3BY = {};
    if (W3 && W3.WORDS) W3.WORDS.forEach(function (w) { if (w.approved && w.audio) L3BY[w.key] = w.audio; });

    var WORDAUDIO = {};
    NEW_WORDS.forEach(function (n) { WORDAUDIO[n[0]] = { file: WORD_DIR + "wbk4_" + n[1] + ".mp3", src: "batch12" }; });

    function pad(n) { return (n < 10 ? "0" : "") + n; }

    var SENTENCES = RAW.map(function (r) {
        var w1 = r[1], w2 = r[2];
        var a1 = WORDAUDIO[w1] || (L3BY[w1] ? { file: L3BY[w1], src: "lesson3" } : null);
        var a2 = WORDAUDIO[w2] || (L3BY[w2] ? { file: L3BY[w2], src: "lesson3" } : null);
        return {
            id: "s" + pad(r[0]),   /* المعرّف ثابت (يحفظ تقدّم الطلاب)؛ الرقم المعروض n يُعاد ترقيمه من ١ */
            n: 0,
            /* الوحدتان: الكلمة الأولى، ثم «وَ» + الكلمة الثانية وحدةً واحدة */
            u1: { text: w1, word: w1, audio: a1 ? a1.file : "", audioSrc: a1 ? a1.src : "" },
            u2: { text: "وَ" + w2, word: w2, audio: a2 ? a2.file : "", audioSrc: a2 ? a2.src : "" },
            /* النص الكامل كما يُقرأ: وَ متصلة بالكلمة الثانية */
            shown: w1 + " وَ" + w2,
            key: w1 + " وَ" + w2,
            audio: SENT_DIR + "wbk4_s" + pad(r[0]) + "_" + r[3] + ".mp3",
            approved: true
        };
    });

    SENTENCES.forEach(function (s, i) { s.n = i + 1; });

    /* أحرف الكلمات (للتشابه البصري بين الجمل عند اختيار البدائل) */
    function letters(w) { return w.replace(/[ً-ْ]/g, "").split(""); }
    SENTENCES.forEach(function (s) { s.letters = letters(s.u1.word + s.u2.word); });

    var STAGES = [
        { id: "teach", n: 1, title: "أقرأ مع المعلم", how: "أرى الجملة وأسمعها بسرعتين", audio: true },
        { id: "build", n: 2, title: "أرتّب الجملة", how: "أرتّب الوحدتين بالسحب أو باللمس", audio: false },
        { id: "hear", n: 3, title: "أستمع وأختار", how: "أسمع الجملة ثم أختار شكلها", audio: true },
        { id: "missing", n: 4, title: "أكمل الجملة", how: "أختار الكلمة الناقصة", audio: false },
        { id: "read", n: 5, title: "أقرأ بنفسي", how: "أقرأ الجملة بصوتي والمعلم يؤكد", audio: false },
        { id: "test", n: 6, title: "أختبر نفسي", how: "٥ أسئلة متنوعة بلا مساعدة", audio: true }
    ];

    var CONFIG = {
        sessionLength: 5,
        promoteStreak: 3,
        /* نجمة الجملة: نجاحان مستقلان (من أول مرة، بلا نموذج ولا تلميح ولا كشف حل) في نشاطين مختلفين
           أحدهما «أرتّب الجملة» بلا نموذج، أو قراءة مستقلة يؤكدها المعلم — كقاعدة الدرس الثالث */
        star: { independentActivities: 2 },
        test: { total: 5, mix: { hear: 1, build: 2, missing: 1, read: 1 }, passAuto: 3, autoTotal: 4, maxStars: 1 },
        speeds: { normal: 1, slow: 0.85 }
    };

    /* كل ملفات الصوت المستعملة (للصفحة والفحص) */
    function allAudio() {
        var out = [];
        SENTENCES.forEach(function (s) { out.push({ file: s.audio, text: s.key, kind: "sentence", n: s.n }); });
        NEW_WORDS.forEach(function (n, i) { out.push({ file: WORD_DIR + "wbk4_" + n[1] + ".mp3", text: n[0], kind: "word", n: i + 1 }); });
        return out;
    }

    root.WBK4_DATA = {
        FATHA: FATHA,
        SENTENCES: SENTENCES,
        NEW_WORDS: NEW_WORDS,
        STAGES: STAGES,
        CONFIG: CONFIG,
        AUDIO_CHECKED: AUDIO_CHECKED,
        allAudio: allAudio,
        /* ملفات الصوت المخزَّنة مسبقًا (الجمل + كلمات الدفعة الجديدة). كلمات الدرس الثالث يخزّنها wbk3-data.js */
        approvedAudioFiles: function () {
            var out = SENTENCES.map(function (s) { return s.audio; });
            NEW_WORDS.forEach(function (n) { out.push(WORD_DIR + "wbk4_" + n[1] + ".mp3"); });
            return out;
        }
    };
})(typeof self !== "undefined" ? self : window);
