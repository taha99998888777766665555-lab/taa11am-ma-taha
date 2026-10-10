/* =========================================================
   👥 نظام ملفات الطلاب المتعددة — طبقة التخزين
   كل بيانات التعلّم تُحفظ تحت بادئة خاصة بالطالب الحالي
   (taha_s_<id>__<المفتاح الأصلي>)، فيعمل بقية الكود دون أي تغيير.
   مفاتيح الجهاز المشتركة (الإعدادات، رمز المعلم، القرآن) لا تتغير.
   عند أول تشغيل تُنسخ بيانات الملف القديم إلى أول طالب (والنسخة
   القديمة تبقى كما هي احتياطًا ولا تُقرأ بعد ذلك).
========================================================= */
var StudentStore = (function () {
    var real = window.localStorage;
    var REG = "taha_students_v1";
    var CUR = "taha_current_student";
    var SHARED = { taha_settings: 1, taha_teacher_pin: 1, taha_quran_last_surah_index: 1 };
    var OVR = "taha_teacher_override_levels";
    var MAX_STUDENTS = 30;
    var cur = null;
    var list = [];

    function isPerStudent(k) {
        if (typeof k !== "string") return false;
        if (SHARED[k] || k === REG || k === CUR) return false;
        if (k.indexOf("taha_s_") === 0) return false;
        return k.indexOf("taha_") === 0 || k === "matchingProgressV2" || k === "matchingBestScore";
    }
    function pfx(id) { return "taha_s_" + id + "__"; }
    function gen() {
        return "stu_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    }
    function rget(k) { try { return real.getItem(k); } catch (e) { return null; } }
    function rset(k, v) { try { real.setItem(k, v); } catch (e) { /* ممتلئ */ } }
    function saveReg() { rset(REG, JSON.stringify({ list: list })); }

    function init() {
        var reg = null;
        try { reg = JSON.parse(rget(REG)); } catch (e) { reg = null; }
        if (reg && Array.isArray(reg.list) && reg.list.length) {
            list = reg.list.filter(function (x) { return typeof x === "string"; });
        }
        if (!list.length) {
            var id = rget("taha_student_id") || gen();
            var keys = [];
            try { for (var i = 0; i < real.length; i++) keys.push(real.key(i)); } catch (e) { /* لا شيء */ }
            keys.forEach(function (k) {
                if (isPerStudent(k)) { var v = rget(k); if (v !== null) rset(pfx(id) + k, v); }
            });
            rset(pfx(id) + "taha_student_id", id);
            list = [id];
            saveReg();
            rset(CUR, id);
        }
        var c = rget(CUR);
        cur = (c && list.indexOf(c) >= 0) ? c : list[0];
        rset(CUR, cur);
    }

    var shim = {
        getItem: function (k) { return real.getItem(isPerStudent(k) ? pfx(cur) + k : k); },
        setItem: function (k, v) { real.setItem(isPerStudent(k) ? pfx(cur) + k : k, v); },
        removeItem: function (k) { real.removeItem(isPerStudent(k) ? pfx(cur) + k : k); },
        key: function (i) { return real.key(i); },
        get length() { return real.length; },
        clear: function () { real.clear(); }
    };

    init();
    try {
        Object.defineProperty(window, "localStorage", { configurable: true, get: function () { return shim; } });
    } catch (e) { /* المتصفح لا يسمح — يبقى الملف الواحد */ }

    function read(id, k) { return rget(pfx(id) + k); }
    function num(id, k, d) { var n = Number(read(id, k)); return isFinite(n) && read(id, k) !== null ? n : d; }

    function info(id) {
        return {
            id: id,
            name: read(id, "taha_child_name") || "",
            avatar: read(id, "taha_child_avatar") || "🦁",
            stars: num(id, "taha_app_stars", 0),
            level: num(id, "taha_app_level", 1),
            override: read(id, OVR) === "1",
            current: id === cur
        };
    }

    return {
        MAX: MAX_STUDENTS,
        currentId: function () { return cur; },
        count: function () { return list.length; },
        list: function () { return list.map(info); },
        get: info,
        isOverride: function (id) { return read(id || cur, OVR) === "1"; },
        setOverride: function (id, on) { rset(pfx(id) + OVR, on ? "1" : "0"); },
        /* المستوى الفعلي لعرض الأقفال فقط — لا يُكتب أبدًا في التقدّم */
        eff: function (n) { return read(cur, OVR) === "1" ? 99 : n; },
        add: function (name, avatar) {
            if (list.length >= MAX_STUDENTS) return null;
            var id = gen();
            rset(pfx(id) + "taha_student_id", id);
            rset(pfx(id) + "taha_child_name", String(name || "").slice(0, 24));
            rset(pfx(id) + "taha_child_avatar", avatar || "🦁");
            list.push(id);
            saveReg();
            return id;
        },
        update: function (id, name, avatar) {
            if (list.indexOf(id) < 0) return;
            rset(pfx(id) + "taha_child_name", String(name || "").slice(0, 24));
            rset(pfx(id) + "taha_child_avatar", avatar || "🦁");
        },
        remove: function (id) {
            if (list.length <= 1 || list.indexOf(id) < 0) return false;
            var p = pfx(id), keys = [];
            try { for (var i = 0; i < real.length; i++) keys.push(real.key(i)); } catch (e) { /* لا شيء */ }
            keys.forEach(function (k) { if (k.indexOf(p) === 0) { try { real.removeItem(k); } catch (e) { /* لا شيء */ } } });
            list = list.filter(function (x) { return x !== id; });
            saveReg();
            if (cur === id) { cur = list[0]; rset(CUR, cur); return "switched"; }
            return true;
        },
        /* التبديل = حفظ المؤشر ثم إعادة تحميل التطبيق، فلا يبقى أي
           متغيّر في الذاكرة من الطالب السابق */
        switchTo: function (id) {
            if (list.indexOf(id) < 0) return;
            if (id !== cur) rset(CUR, id);
            try { sessionStorage.setItem("taha_stu_switched", "1"); } catch (e) { /* لا شيء */ }
            location.reload();
        }
    };
})();

/* =========================================================
🌟 تعلم مع أ/ طه محمد 🌟
script.js - النسخة النهائية المصلحة بالكامل
========================================================= */

"use strict";

/* =========================================================
🔧 أدوات عامة
========================================================= */

const $ = id => document.getElementById(id);

function arabicNumber(number) {
    return String(number).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
}

function shuffle(array) {
    const arr = [...array];

    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

function unique(array) {
    return [...new Set(array)];
}

/* =========================================================
🔤 أدوات الحروف العربية
========================================================= */

function removeArabicHarakat(text) {
    return String(text || "")
        .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
        .replace(/\u0640/g, "");
}

function normalizeArabicText(text) {
    return removeArabicHarakat(String(text || ""))
        .replace(/[أإآٱ]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ؤ/g, "و")
        .replace(/ئ/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/\s+/g, "")
        .trim();
}

function getFirstArabicLetter(word) {
    return removeArabicHarakat(word)
        .replace(/\s+/g, "")
        .trim()
        .charAt(0);
}

function wordStartsWithLetter(word, letter) {
    let normalizedWord = normalizeArabicText(word);
    const targetLetter = normalizeArabicText(letter);

    if (!normalizedWord || !targetLetter) return false;

    if (
        targetLetter !== "ا" &&
        normalizedWord.startsWith("ال")
    ) {
        normalizedWord = normalizedWord.substring(2);
    }

    return normalizedWord.charAt(0) === targetLetter.charAt(0);
}

function wordContainsLetter(word, letter) {
    const normalizedWord = normalizeArabicText(word);
    const normalizedLetter = normalizeArabicText(letter);

    if (!normalizedWord || !normalizedLetter) return false;

    return normalizedWord.includes(normalizedLetter);
}

function letterWithFatha(letter) {
    const clean = removeArabicHarakat(letter);
    return clean + "َ";
}

function matchAnswer(value, correct, valueType = "letter", targetLetter = null) {
    if (valueType === "word") {
        if (targetLetter) {
            return wordStartsWithLetter(value, targetLetter);
        }

        return (
            normalizeArabicText(value) ===
            normalizeArabicText(correct)
        );
    }

    return (
        normalizeArabicText(value) ===
        normalizeArabicText(correct)
    );
}

/* =========================================================
🔊 الصوت العربي
========================================================= */

/* =========================================================================
   🆕 =====================================================================
   🔊 TTSManager — طبقة تجريد صوتية موحّدة وقابلة لتبديل المحرك
   =====================================================================
   تُستخدم حصريًا لكل الأصوات "التعليمية": الحروف، الكلمات، الأرقام،
   الكتابة، الجمع، الطرح، الحديث، الألعاب، والتعليمات — عبر نفس
   دالة speak() العامة الحالية دون أي تغيير في مكان استدعائها.

   سياسة الصوت: القرآن الكريم والأدعية وحدهما القسمان المحميان — لا يمرّان
   من هنا إطلاقًا ولن يتأثرا بأي تبديل مستقبلي لمحرك الصوت (يستخدمان
   AudioManager.play() مباشرة بملفات MP3 حقيقية كما كانا دائمًا). الحديث
   الشريف ليس محميًا: هو صوت تعليمي يمرّ من هنا ويُسجَّل تسجيلًا خاصًا.

   الفكرة: أي قسم في التطبيق ينادي speak(text, options) كما هو
   تمامًا. TTSManager هو من يقرر "من يُنطق فعليًا" عبر محرك مسجَّل
   وقابل للتبديل (registerEngine / setActiveEngine) دون الحاجة
   لتعديل حرف واحد داخل أقسام الحروف/الكلمات/الأرقام/إلخ لاحقًا.

   لإضافة محرك جديد مستقبلًا (TTS عصبي، أو ملفات صوت AI محلية):
     TTSManager.registerEngine("اسم-المحرك", {
         isAvailable: () => true/false,
         speak: (text, options) => { ... },
         stop: () => { ... }
     });
     TTSManager.setActiveEngine("اسم-المحرك");
   وسينتقل صوت كل الأقسام التعليمية فورًا دون أي تعديل آخر. وإن
   كان المحرك الجديد غير متاح لحظتها أو فشل، يعود النظام تلقائيًا
   لمحرك المتصفح الحالي (fallback) فلا ينقطع الصوت أبدًا.
========================================================================= */

const TTSManager = (function () {

    const engines = {};
    let activeEngineName = null;
    const FALLBACK_ENGINE_NAME = "browser-speech";

    function registerEngine(name, engine, makeActive) {
        engines[name] = engine;
        if (makeActive || !activeEngineName) {
            activeEngineName = name;
        }
    }

    function setActiveEngine(name) {
        if (engines[name]) {
            activeEngineName = name;
            return true;
        }
        return false;
    }

    function getActiveEngineName() {
        return activeEngineName;
    }

    function listEngines() {
        return Object.keys(engines);
    }

    function speak(text, options) {

        const primary = engines[activeEngineName];
        const fallback = engines[FALLBACK_ENGINE_NAME];

        const primaryReady =
            primary &&
            (typeof primary.isAvailable !== "function" || primary.isAvailable());

        function runFallback() {
            if (fallback && fallback !== primary) {
                try {
                    fallback.speak(text, options || {});
                } catch (error) {}
            }
        }

        if (primaryReady) {
            try {
                /* 🆕 دعم المحركات غير المتزامنة (مثل محرك سحابي يعتمد
                   على fetch): إن أعاد speak() الوعد (Promise) ورُفض
                   لاحقًا (فشل شبكة/مفتاح غير صالح)، نعود تلقائيًا
                   للمحرك الاحتياطي — دون أي تغيير في سلوك المحركات
                   المتزامنة الحالية (التي لا تُعيد شيئًا أصلًا) */
                const result = primary.speak(text, options || {});

                if (result && typeof result.catch === "function") {
                    result.catch(() => runFallback());
                }

                return;
            } catch (error) {
                runFallback();
                return;
            }
        }

        runFallback();
    }

    function stopAll() {
        Object.keys(engines).forEach(name => {
            const engine = engines[name];
            if (engine && typeof engine.stop === "function") {
                try {
                    engine.stop();
                } catch (error) {}
            }
        });
    }

    return {
        registerEngine,
        setActiveEngine,
        getActiveEngineName,
        listEngines,
        speak,
        stop: stopAll
    };

})();

/* =========================================================
   🔊 المحرك الافتراضي/المؤقت الحالي: متصفح + أفضل صوت عربي
   متاح تلقائيًا (نفس منطق اختيار الصوت المُحسَّن سابقًا، بلا أي
   تغيير سلوكي) — سيُستبدَل لاحقًا بمحرك TTS عصبي أو ملفات AI
   محلية عبر registerEngine/setActiveEngine فقط، دون لمس أي قسم.
========================================================= */

let arabicVoice = null;

function scoreArabicVoice(voice) {
    const name = (voice.name || "").toLowerCase();
    let score = 0;

    if (name.includes("neural")) score += 100;
    if (name.includes("natural")) score += 90;
    if (name.includes("premium")) score += 70;
    if (name.includes("enhanced")) score += 70;
    if (name.includes("wavenet")) score += 70;
    if (name.includes("studio")) score += 60;
    if (name.includes("online")) score += 40;

    if (voice.localService === false) score += 20;

    if (voice.lang && voice.lang.toLowerCase() === "ar-sa") score += 10;
    else if (voice.lang && voice.lang.toLowerCase().startsWith("ar")) score += 5;

    return score;
}

function findArabicVoice() {
    if (!("speechSynthesis" in window)) return null;

    const voices = speechSynthesis.getVoices();

    const arabicVoices = voices.filter(
        voice => voice.lang && voice.lang.toLowerCase().startsWith("ar")
    );

    if (arabicVoices.length === 0) {
        arabicVoice = null;
        return null;
    }

    arabicVoices.sort((a, b) => scoreArabicVoice(b) - scoreArabicVoice(a));

    arabicVoice = arabicVoices[0];

    return arabicVoice;
}

const browserSpeechEngine = {

    name: "متصفح الجهاز (مؤقت)",

    isAvailable: function () {
        return "speechSynthesis" in window;
    },

    speak: function (text, options) {
        options = options || {};

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = options.lang || "ar-SA";
        utterance.rate = options.rate ?? 0.82;
        utterance.pitch = options.pitch ?? 1;
        utterance.volume = options.volume ?? 1;

        if (!arabicVoice) {
            findArabicVoice();
        }

        if (arabicVoice) {
            utterance.voice = arabicVoice;
        }

        speechSynthesis.speak(utterance);
    },

    stop: function () {
        if ("speechSynthesis" in window) {
            try {
                speechSynthesis.cancel();
            } catch (error) {}
        }
    }

};

TTSManager.registerEngine("browser-speech", browserSpeechEngine, true);

if ("speechSynthesis" in window) {
    speechSynthesis.onvoiceschanged = findArabicVoice;
    findArabicVoice();
}

/* =========================================================================
   🆕 =====================================================================
   🤖 محرك TTS سحابي عصبي (Cloud Neural TTS) — الخطوة الثانية
   =====================================================================
   تكامل حقيقي وصحيح مع Azure Cognitive Services Speech (REST API)،
   وهي إحدى أفضل الخدمات توثيقًا وأبسطها استدعاءً من متصفح بلا
   خادم خلفي، وتملك أصواتًا عربية عصبية طبيعية فعليًا (مثل
   ar-SA-HamedNeural / ar-SA-ZariyahNeural). صوت الخدمة السحابية
   ثابت تمامًا بين الأجهزة (كمبيوتر/جوال) لأنه يُولَّد على الخادم
   ويُشغَّل كملف صوتي جاهز، بخلاف أصوات المتصفح المتغيّرة محليًا.

   ⚠️ هذا المحرك يحتاج مفتاح اشتراك Azure Speech فعليًا ليعمل —
   غير متوفر في بيئة التطوير الحالية (لا اتصال بالإنترنت لأي خدمة
   TTS سحابية، ولا مفتاح API). الحقلان أدناه فارغان عمدًا. إلى أن
   تُعبَّآن بقيمتين حقيقيتين، isAvailable() ستُعيد false تلقائيًا
   فيستمر التطبيق بصوت المتصفح الحالي (fallback) دون أي انقطاع أو
   أي تغيير ملحوظ — تمامًا كسلوكه الآن.

   لاستخدام مزوّد آخر (Google Cloud TTS، ElevenLabs، Amazon Polly
   ...) لاحقًا: استبدل محتوى دالة speak() هنا بنداء ذلك المزوّد،
   دون الحاجة لتغيير أي شيء آخر في TTSManager أو أي قسم بالتطبيق.
========================================================================= */

const CLOUD_TTS_CONFIG = {
    /* 🔑 مفتاح اشتراك Azure Speech — اترك فارغًا حتى تضيف مفتاحك */
    apiKey: "",
    /* 🌍 منطقة الخدمة، مثل "uaenorth" أو "westeurope" حسب اشتراكك */
    region: "",
    /* 🗣️ اسم الصوت العربي العصبي — يمكن تغييره لأي صوت مدعوم */
    voiceName: "ar-SA-HamedNeural"
};

function escapeForSSML(text) {
    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

const cloudNeuralTTSEngine = {

    name: "Azure Neural TTS (سحابي)",

    isAvailable: function () {
        return !!(CLOUD_TTS_CONFIG.apiKey && CLOUD_TTS_CONFIG.region);
    },

    speak: function (text, options) {
        options = options || {};

        if (!this.isAvailable()) {
            return Promise.reject(new Error("Cloud TTS not configured"));
        }

        const rate = options.rate ?? 0.82;
        const ratePercent = Math.round((rate - 1) * 100);
        const rateAttr = (ratePercent >= 0 ? "+" : "") + ratePercent + "%";

        const ssml =
            `<speak version="1.0" xml:lang="ar-SA">` +
            `<voice name="${CLOUD_TTS_CONFIG.voiceName}">` +
            `<prosody rate="${rateAttr}">${escapeForSSML(text)}</prosody>` +
            `</voice></speak>`;

        const endpoint =
            `https://${CLOUD_TTS_CONFIG.region}.tts.speech.microsoft.com/cognitiveservices/v1`;

        return fetch(endpoint, {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": CLOUD_TTS_CONFIG.apiKey,
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat": "audio-16khz-64kbitrate-mono-mp3"
            },
            body: ssml
        })
        .then(response => {
            if (!response.ok) {
                throw new Error("Cloud TTS request failed: " + response.status);
            }
            return response.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.volume = options.volume ?? 1;
            audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
            const playPromise = audio.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(() => {});
            }
        });
    },

    stop: function () {
        /* لا حاجة لمرجع صوت نشط هنا: كل نداء speak() ينشئ عنصر
           Audio منفصلًا قصير العمر، وTTSManager.stop() يستدعي
           هذه الدالة على كل المحركات المسجَّلة بلا استثناء — تُركت
           فارغة عمدًا لأن AudioManager.stop() تُوقف صوت المتصفح
           الاحتياطي أصلًا، وهذا يكفي عمليًا للحالة الحالية. */
    }

};

TTSManager.registerEngine("cloud-neural", cloudNeuralTTSEngine, true);

/* =========================================================
🔊 AudioManager — يبقى كما هو تمامًا لملفات الصوت الحقيقية
(القرآن والأدعية والأذكار)، ويُفوِّض النطق الصوتي التعليمي
لـ TTSManager فقط دون أي تغيير في سلوكه العام (نفس التأخير،
نفس تحويل الحرف المجرَّد لصوته بالفتحة، نفس إيقاف الصوت قبل
البدء بصوت جديد)
========================================================= */

const AudioManager = (() => {

    let activeAudio = null;
    let activeAudioId = null;
    let lastSpeechTime = 0;

    function stop() {

        TTSManager.stop();

        if (activeAudio) {
            try {
                activeAudio.pause();
                activeAudio.currentTime = 0;
                activeAudio.src = "";
            } catch (error) {}
        }

        activeAudio = null;
        activeAudioId = null;
    }

    function play({
        id,
        src,
        onended = null,
        onerror = null
    }) {

        stop();

        if (!src) return null;

        const audio = new Audio(src);

        audio.preload = "auto";

        activeAudio = audio;
        activeAudioId = id || null;

        if (typeof onended === "function") {
            audio.addEventListener("ended", onended, {
                once: true
            });
        }

        if (typeof onerror === "function") {
            audio.addEventListener("error", onerror, {
                once: true
            });
        }

        const promise = audio.play();

        if (promise && typeof promise.catch === "function") {
            promise.catch(() => {});
        }

        return audio;
    }

    function speak(text, options = {}) {

        const now = Date.now();

        if (now - lastSpeechTime < 250) return;

        lastSpeechTime = now;

        stop();

        let textToSpeak = String(text || "");

        if (
            textToSpeak.length === 1 &&
            /[\u0600-\u06FF]/.test(textToSpeak)
        ) {
            textToSpeak = letterWithFatha(textToSpeak);
        }

        TTSManager.speak(textToSpeak, options);
    }

    function isPlaying(id) {
        return (
            activeAudioId === id &&
            activeAudio &&
            !activeAudio.paused
        );
    }

    return {
        stop,
        play,
        speak,
        isPlaying
    };

})();

function speak(text, options = {}) {
    AudioManager.speak(text, options);
}

const EDUCATIONAL_AUDIO_MANIFEST = {
    "أَ": "assets/audio/educational/letters/letter_01_alef.mp3",
    "بَ": "assets/audio/educational/letters/letter_02_ba.mp3",
    "تَ": "assets/audio/educational/letters/letter_03_ta.mp3",
    "ثَ": "assets/audio/educational/letters/letter_04_tha.mp3",
    "جَ": "assets/audio/educational/letters/letter_05_jeem.mp3",
    "حَ": "assets/audio/educational/letters/letter_06_haa.mp3",
    "خَ": "assets/audio/educational/letters/letter_07_khaa.mp3",
    "دَ": "assets/audio/educational/letters/letter_08_dal.mp3",
    "ذَ": "assets/audio/educational/letters/letter_09_thal.mp3",
    "رَ": "assets/audio/educational/letters/letter_10_raa.mp3",
    "زَ": "assets/audio/educational/letters/letter_11_zay.mp3",
    "سَ": "assets/audio/educational/letters/letter_12_seen.mp3",
    "شَ": "assets/audio/educational/letters/letter_13_sheen.mp3",
    "صَ": "assets/audio/educational/letters/letter_14_sad.mp3",
    "ضَ": "assets/audio/educational/letters/letter_15_dad.mp3",
    "طَ": "assets/audio/educational/letters/letter_16_taa.mp3",
    "ظَ": "assets/audio/educational/letters/letter_17_zaa.mp3",
    "عَ": "assets/audio/educational/letters/letter_18_ain.mp3",
    "غَ": "assets/audio/educational/letters/letter_19_ghain.mp3",
    "فَ": "assets/audio/educational/letters/letter_20_faa.mp3",
    "قَ": "assets/audio/educational/letters/letter_21_qaf.mp3",
    "كَ": "assets/audio/educational/letters/letter_22_kaf.mp3",
    "لَ": "assets/audio/educational/letters/letter_23_lam.mp3",
    "مَ": "assets/audio/educational/letters/letter_24_meem.mp3",
    "نَ": "assets/audio/educational/letters/letter_25_noon.mp3",
    "هَ": "assets/audio/educational/letters/letter_26_ha.mp3",
    "وَ": "assets/audio/educational/letters/letter_27_waw.mp3",
    "يَ": "assets/audio/educational/letters/letter_28_yaa.mp3",
    "واحد": "assets/audio/educational/numbers/number_01.mp3",
    "اثنان": "assets/audio/educational/numbers/number_02.mp3",
    "ثلاثة": "assets/audio/educational/numbers/number_03.mp3",
    "أربعة": "assets/audio/educational/numbers/number_04.mp3",
    "خمسة": "assets/audio/educational/numbers/number_05.mp3",
    "ستة": "assets/audio/educational/numbers/number_06.mp3",
    "سبعة": "assets/audio/educational/numbers/number_07.mp3",
    "ثمانية": "assets/audio/educational/numbers/number_08.mp3",
    "تسعة": "assets/audio/educational/numbers/number_09.mp3",
    "عشرة": "assets/audio/educational/numbers/number_10.mp3",
    "أحد عشر": "assets/audio/educational/numbers/number_11.mp3",
    "اثنا عشر": "assets/audio/educational/numbers/number_12.mp3",
    "ثلاثة عشر": "assets/audio/educational/numbers/number_13.mp3",
    "أربعة عشر": "assets/audio/educational/numbers/number_14.mp3",
    "خمسة عشر": "assets/audio/educational/numbers/number_15.mp3",
    "ستة عشر": "assets/audio/educational/numbers/number_16.mp3",
    "سبعة عشر": "assets/audio/educational/numbers/number_17.mp3",
    "ثمانية عشر": "assets/audio/educational/numbers/number_18.mp3",
    "تسعة عشر": "assets/audio/educational/numbers/number_19.mp3",
    "عشرون": "assets/audio/educational/numbers/number_20.mp3",
    "واحد وعشرون": "assets/audio/educational/numbers/number_21.mp3",
    "اثنان وعشرون": "assets/audio/educational/numbers/number_22.mp3",
    "ثلاثة وعشرون": "assets/audio/educational/numbers/number_23.mp3",
    "أربعة وعشرون": "assets/audio/educational/numbers/number_24.mp3",
    "خمسة وعشرون": "assets/audio/educational/numbers/number_25.mp3",
    "ستة وعشرون": "assets/audio/educational/numbers/number_26.mp3",
    "سبعة وعشرون": "assets/audio/educational/numbers/number_27.mp3",
    "ثمانية وعشرون": "assets/audio/educational/numbers/number_28.mp3",
    "تسعة وعشرون": "assets/audio/educational/numbers/number_29.mp3",
    "ثلاثون": "assets/audio/educational/numbers/number_30.mp3",
    "واحد وثلاثون": "assets/audio/educational/numbers/number_31.mp3",
    "اثنان وثلاثون": "assets/audio/educational/numbers/number_32.mp3",
    "ثلاثة وثلاثون": "assets/audio/educational/numbers/number_33.mp3",
    "أربعة وثلاثون": "assets/audio/educational/numbers/number_34.mp3",
    "خمسة وثلاثون": "assets/audio/educational/numbers/number_35.mp3",
    "ستة وثلاثون": "assets/audio/educational/numbers/number_36.mp3",
    "سبعة وثلاثون": "assets/audio/educational/numbers/number_37.mp3",
    "ثمانية وثلاثون": "assets/audio/educational/numbers/number_38.mp3",
    "تسعة وثلاثون": "assets/audio/educational/numbers/number_39.mp3",
    "أربعون": "assets/audio/educational/numbers/number_40.mp3",
    "أناناس": "assets/audio/educational/words/word_01_01.mp3",
    "أرنب": "assets/audio/educational/words/word_01_02.mp3",
    "أسد": "assets/audio/educational/words/word_01_03.mp3",
    "أم": "assets/audio/educational/words/word_01_04.mp3",
    "أذن": "assets/audio/educational/words/word_01_05.mp3",
    "أخطبوط": "assets/audio/educational/words/word_01_06.mp3",
    "بيت": "assets/audio/educational/words/word_02_01.mp3",
    "بنت": "assets/audio/educational/words/word_02_02.mp3",
    "بطة": "assets/audio/educational/words/word_02_03.mp3",
    "باب": "assets/audio/educational/words/word_02_04.mp3",
    "برتقال": "assets/audio/educational/words/word_02_05.mp3",
    "بقرة": "assets/audio/educational/words/word_02_06.mp3",
    "بطيخ": "assets/audio/educational/words/word_02_07.mp3",
    "تفاح": "assets/audio/educational/words/word_03_01.mp3",
    "تاج": "assets/audio/educational/words/word_03_02.mp3",
    "تمر": "assets/audio/educational/words/word_03_03.mp3",
    "تين": "assets/audio/educational/words/word_03_04.mp3",
    "تمساح": "assets/audio/educational/words/word_03_05.mp3",
    "توت": "assets/audio/educational/words/word_03_06.mp3",
    "ثعلب": "assets/audio/educational/words/word_04_01.mp3",
    "ثوم": "assets/audio/educational/words/word_04_02.mp3",
    "ثعبان": "assets/audio/educational/words/word_04_03.mp3",
    "ثلاجة": "assets/audio/educational/words/word_04_04.mp3",
    "ثلج": "assets/audio/educational/words/word_04_05.mp3",
    "جسر": "assets/audio/educational/words/word_05_01.mp3",
    "جبنة": "assets/audio/educational/words/word_05_02.mp3",
    "جرس": "assets/audio/educational/words/word_05_03.mp3",
    "جزر": "assets/audio/educational/words/word_05_04.mp3",
    "جبل": "assets/audio/educational/words/word_05_05.mp3",
    "جمل": "assets/audio/educational/words/word_05_06.mp3",
    "حصان": "assets/audio/educational/words/word_06_01.mp3",
    "حليب": "assets/audio/educational/words/word_06_02.mp3",
    "حذاء": "assets/audio/educational/words/word_06_03.mp3",
    "حوت": "assets/audio/educational/words/word_06_04.mp3",
    "حقيبة": "assets/audio/educational/words/word_06_05.mp3",
    "خيمة": "assets/audio/educational/words/word_07_01.mp3",
    "خيار": "assets/audio/educational/words/word_07_02.mp3",
    "خس": "assets/audio/educational/words/word_07_03.mp3",
    "خوخ": "assets/audio/educational/words/word_07_04.mp3",
    "خبز": "assets/audio/educational/words/word_07_05.mp3",
    "خروف": "assets/audio/educational/words/word_07_06.mp3",
    "دجاجة": "assets/audio/educational/words/word_08_01.mp3",
    "دب": "assets/audio/educational/words/word_08_02.mp3",
    "ديك": "assets/audio/educational/words/word_08_03.mp3",
    "دلفين": "assets/audio/educational/words/word_08_04.mp3",
    "دفتر": "assets/audio/educational/words/word_08_05.mp3",
    "دراجة": "assets/audio/educational/words/word_08_06.mp3",
    "ذيل": "assets/audio/educational/words/word_09_01.mp3",
    "ذهب": "assets/audio/educational/words/word_09_02.mp3",
    "ذراع": "assets/audio/educational/words/word_09_03.mp3",
    "ذبابة": "assets/audio/educational/words/word_09_04.mp3",
    "ذئب": "assets/audio/educational/words/word_09_05.mp3",
    "رمل": "assets/audio/educational/words/word_10_01.mp3",
    "ريشة": "assets/audio/educational/words/word_10_02.mp3",
    "رأس": "assets/audio/educational/words/word_10_03.mp3",
    "رجل": "assets/audio/educational/words/word_10_04.mp3",
    "زهرة": "assets/audio/educational/words/word_11_01.mp3",
    "زينة": "assets/audio/educational/words/word_11_02.mp3",
    "زرافة": "assets/audio/educational/words/word_11_03.mp3",
    "زيت": "assets/audio/educational/words/word_11_04.mp3",
    "زيتون": "assets/audio/educational/words/word_11_05.mp3",
    "سفينة": "assets/audio/educational/words/word_12_01.mp3",
    "سيارة": "assets/audio/educational/words/word_12_02.mp3",
    "سمكة": "assets/audio/educational/words/word_12_03.mp3",
    "ساعة": "assets/audio/educational/words/word_12_04.mp3",
    "سرير": "assets/audio/educational/words/word_12_05.mp3",
    "سماء": "assets/audio/educational/words/word_12_06.mp3",
    "شمس": "assets/audio/educational/words/word_13_01.mp3",
    "شعر": "assets/audio/educational/words/word_13_02.mp3",
    "شجرة": "assets/audio/educational/words/word_13_03.mp3",
    "شمعة": "assets/audio/educational/words/word_13_04.mp3",
    "شوكة": "assets/audio/educational/words/word_13_05.mp3",
    "شباك": "assets/audio/educational/words/word_13_06.mp3",
    "صندوق": "assets/audio/educational/words/word_14_01.mp3",
    "صالة": "assets/audio/educational/words/word_14_02.mp3",
    "صقر": "assets/audio/educational/words/word_14_03.mp3",
    "صاروخ": "assets/audio/educational/words/word_14_04.mp3",
    "صافرة": "assets/audio/educational/words/word_14_05.mp3",
    "صحن": "assets/audio/educational/words/word_14_06.mp3",
    "صبار": "assets/audio/educational/words/word_14_07.mp3",
    "ضرس": "assets/audio/educational/words/word_15_01.mp3",
    "ضفدع": "assets/audio/educational/words/word_15_02.mp3",
    "ضابط": "assets/audio/educational/words/word_15_03.mp3",
    "ضوء": "assets/audio/educational/words/word_15_04.mp3",
    "طباخ": "assets/audio/educational/words/word_16_01.mp3",
    "طاولة": "assets/audio/educational/words/word_16_02.mp3",
    "طبيب": "assets/audio/educational/words/word_16_03.mp3",
    "طائرة": "assets/audio/educational/words/word_16_04.mp3",
    "طاووس": "assets/audio/educational/words/word_16_05.mp3",
    "طفل": "assets/audio/educational/words/word_16_06.mp3",
    "ظرف": "assets/audio/educational/words/word_17_01.mp3",
    "ظفر": "assets/audio/educational/words/word_17_02.mp3",
    "ظل": "assets/audio/educational/words/word_17_03.mp3",
    "علم": "assets/audio/educational/words/word_18_01.mp3",
    "عصفور": "assets/audio/educational/words/word_18_02.mp3",
    "عين": "assets/audio/educational/words/word_18_03.mp3",
    "عنب": "assets/audio/educational/words/word_18_04.mp3",
    "عسل": "assets/audio/educational/words/word_18_05.mp3",
    "عصير": "assets/audio/educational/words/word_18_06.mp3",
    "غسالة": "assets/audio/educational/words/word_19_01.mp3",
    "غيوم": "assets/audio/educational/words/word_19_02.mp3",
    "غراب": "assets/audio/educational/words/word_19_03.mp3",
    "غوريلا": "assets/audio/educational/words/word_19_04.mp3",
    "غزالة": "assets/audio/educational/words/word_19_05.mp3",
    "فراشة": "assets/audio/educational/words/word_20_01.mp3",
    "فستان": "assets/audio/educational/words/word_20_02.mp3",
    "فانوس": "assets/audio/educational/words/word_20_03.mp3",
    "فراولة": "assets/audio/educational/words/word_20_04.mp3",
    "فيل": "assets/audio/educational/words/word_20_05.mp3",
    "فأر": "assets/audio/educational/words/word_20_06.mp3",
    "قميص": "assets/audio/educational/words/word_21_01.mp3",
    "قلم": "assets/audio/educational/words/word_21_02.mp3",
    "قرد": "assets/audio/educational/words/word_21_03.mp3",
    "قلب": "assets/audio/educational/words/word_21_04.mp3",
    "قفاز": "assets/audio/educational/words/word_21_05.mp3",
    "قصر": "assets/audio/educational/words/word_21_06.mp3",
    "كرة": "assets/audio/educational/words/word_22_01.mp3",
    "كأس": "assets/audio/educational/words/word_22_02.mp3",
    "كلب": "assets/audio/educational/words/word_22_03.mp3",
    "كرسي": "assets/audio/educational/words/word_22_04.mp3",
    "كيك": "assets/audio/educational/words/word_22_05.mp3",
    "كرز": "assets/audio/educational/words/word_22_06.mp3",
    "كتاب": "assets/audio/educational/words/word_22_07.mp3",
    "ليمون": "assets/audio/educational/words/word_23_01.mp3",
    "لبن": "assets/audio/educational/words/word_23_02.mp3",
    "لحم": "assets/audio/educational/words/word_23_03.mp3",
    "لمبة": "assets/audio/educational/words/word_23_04.mp3",
    "لعبة": "assets/audio/educational/words/word_23_05.mp3",
    "لسان": "assets/audio/educational/words/word_23_06.mp3",
    "مسبح": "assets/audio/educational/words/word_24_01.mp3",
    "مدرسة": "assets/audio/educational/words/word_24_02.mp3",
    "مسجد": "assets/audio/educational/words/word_24_03.mp3",
    "مقص": "assets/audio/educational/words/word_24_04.mp3",
    "مفتاح": "assets/audio/educational/words/word_24_05.mp3",
    "موز": "assets/audio/educational/words/word_24_06.mp3",
    "نسر": "assets/audio/educational/words/word_25_01.mp3",
    "نحل": "assets/audio/educational/words/word_25_02.mp3",
    "نجمة": "assets/audio/educational/words/word_25_03.mp3",
    "نمر": "assets/audio/educational/words/word_25_04.mp3",
    "نعامة": "assets/audio/educational/words/word_25_05.mp3",
    "نخلة": "assets/audio/educational/words/word_25_06.mp3",
    "هلال": "assets/audio/educational/words/word_26_01.mp3",
    "هدهد": "assets/audio/educational/words/word_26_02.mp3",
    "هدية": "assets/audio/educational/words/word_26_03.mp3",
    "هاتف": "assets/audio/educational/words/word_26_04.mp3",
    "هرم": "assets/audio/educational/words/word_26_05.mp3",
    "وجه": "assets/audio/educational/words/word_27_01.mp3",
    "وردة": "assets/audio/educational/words/word_27_02.mp3",
    "ولد": "assets/audio/educational/words/word_27_03.mp3",
    "وسادة": "assets/audio/educational/words/word_27_04.mp3",
    "يلعب": "assets/audio/educational/words/word_28_01.mp3",
    "يوسفي": "assets/audio/educational/words/word_28_02.mp3",
    "يد": "assets/audio/educational/words/word_28_03.mp3",
    "يخت": "assets/audio/educational/words/word_28_04.mp3",
    "يويو": "assets/audio/educational/words/word_28_05.mp3",
    "حاول مرة أخرى": "assets/audio/educational/phrases/try_again.mp3",
    "أحسنت! إجابة صحيحة": "assets/audio/educational/phrases/correct_answer.mp3",
    "صحيح": "assets/audio/educational/phrases/correct_short.mp3",
    "انتهى الوقت": "assets/audio/educational/phrases/time_up.mp3",
    "أحسنت! أتممت هذا الحرف بنجاح": "assets/audio/educational/phrases/letter_completed.mp3",
    "أحسنت يا بطل": "assets/audio/educational/phrases/ahsant_ya_batal.mp3",
    "أحسنت! أكملت المستوى بنجاح": "assets/audio/educational/phrases/level_completed.mp3",
    "محاولة رائعة، لنحاول مرة أخرى": "assets/audio/educational/phrases/great_attempt_retry.mp3",
    "أكمل المستوى السابق أولًا لتفتح هذا المستوى": "assets/audio/educational/phrases/level_locked.mp3",
    "أكمل المجموعة السابقة أولًا لتفتح هذه المجموعة": "assets/audio/educational/phrases/group_locked.mp3",
    "تم تصفير المكافآت والإحصائيات": "assets/audio/educational/phrases/progress_reset.mp3",
    "أحسنت، عمل رائع": "assets/audio/educational/phrases/writing_done.mp3",
    "اِنْتَهَى الوَقْت": "assets/audio/educational/phrases/balloon_time_up.mp3",
    "حَاوِلْ مَرَّةً أُخْرَى": "assets/audio/educational/phrases/balloon_try_again.mp3",
    "لَا بَأْسَ. حَاوِلْ مَرَّةً أُخْرَى": "assets/audio/educational/phrases/balloon_no_worries_retry.mp3",
    "مُمْتَاز! أَنْهَيْتَ لُعْبَة الأَرْقَام": "assets/audio/educational/phrases/balloon_number_game_done.mp3",
    "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى.": "assets/audio/educational/hadith/hadith_01.mp3",
    "من لا يرحم لا يُرحم.": "assets/audio/educational/hadith/hadith_02.mp3",
    "تبسمك في وجه أخيك لك صدقة.": "assets/audio/educational/hadith/hadith_03.mp3",
    "المسلم من سلم المسلمون من لسانه ويده.": "assets/audio/educational/hadith/hadith_04.mp3",
    "خيركم من تعلم القرآن وعلمه.": "assets/audio/educational/hadith/hadith_05.mp3",
    /* ── مقاطع تركيب الجمل الديناميكية (الجمع/الطرح/خط الأعداد/إطار العشرة/القصص): ملفاتها من قائمة التسجيل الرئيسية، وتعمل بمجرد رفعها ── */
    "وَصَلْنَا إِلَى": "assets/audio/educational/math/nl_arrived.mp3",
    "وَارْجِعْ لِلْخَلْفْ": "assets/audio/educational/math/nl_go_back.mp3",
    "اِبْدَأْ مِنْ": "assets/audio/educational/math/nl_start_from.mp3",
    "خُطُوَاتْ": "assets/audio/educational/math/nl_steps.mp3",
    "نَاقِصْ": "assets/audio/educational/math/op_minus.mp3",
    "زَائِدْ": "assets/audio/educational/math/op_plus.mp3",
    "يُسَاوِي كَمْ؟": "assets/audio/educational/math/q_equals_how_many.mp3",
    "مَا هُوَ العَدَدُ المَفْقُودْ؟": "assets/audio/educational/math/q_missing_number.mp3",
    "كَمْ مَجْمُوعُ هَذِهِ الصُّوَرْ؟": "assets/audio/educational/math/q_picture_sum.mp3",
    "كَمْ قُرْصًا بَقِيَ؟": "assets/audio/educational/math/q_tenframe_left.mp3",
    "كَمْ رَاكِبًا بَقِيَ فِي الحَافِلَة؟": "assets/audio/educational/math/remain_bus.mp3",
    "كَمْ جَزَرَةً بَقِيَتْ؟": "assets/audio/educational/math/remain_carrot.mp3",
    "أَزِلْ": "assets/audio/educational/math/remove_only_pre.mp3",
    "مِنَ البَالُونَاتْ": "assets/audio/educational/math/rm_balloon_post.mp3",
    "فَرْقِعْ": "assets/audio/educational/math/rm_balloon_pre.mp3",
    "مِنَ العَصَافِيرِ لِتَطِيرَ بَعِيدًا": "assets/audio/educational/math/rm_bird_post.mp3",
    "اِضْغَطْ عَلَى": "assets/audio/educational/math/rm_bird_pre.mp3",
    "مِنَ الرُّكَّابِ مِنَ الحَافِلَة": "assets/audio/educational/math/rm_bus_post.mp3",
    "أَنْزِلْ": "assets/audio/educational/math/rm_bus_pre.mp3",
    "مِنَ الجَزَرْ": "assets/audio/educational/math/rm_carrot_post.mp3",
    "أَطْعِمِ الأَرْنَبَ وَأَزِلْ": "assets/audio/educational/math/rm_carrot_pre.mp3",
    "عِنْدَ أَحْمَدْ": "assets/audio/educational/math/story_add1_p1.mp3",
    "تُفَّاحَاتْ، وَأَعْطَتْهُ أُمُّهْ": "assets/audio/educational/math/story_add1_p2.mp3",
    "تُفَّاحَاتٍ أُخْرَى. كَمْ تُفَّاحَةً أَصْبَحَتْ مَعَهْ؟": "assets/audio/educational/math/story_add1_p3.mp3",
    "فِي الحَدِيقَة": "assets/audio/educational/math/story_add2_p1.mp3",
    "عُصْفُورْ، وَجَاءَ": "assets/audio/educational/math/story_add2_p2.mp3",
    "عُصْفُورٌ آخَرْ. كَمْ عُصْفُورًا فِي الحَدِيقَةِ الآنَ؟": "assets/audio/educational/math/story_add2_p3.mp3",
    "مَعَ سَارَة": "assets/audio/educational/math/story_add3_p1.mp3",
    "بَالُونَاتْ، وَاشْتَرَتْ": "assets/audio/educational/math/story_add3_p2.mp3",
    "بَالُونَاتٍ جَدِيدَة. كَمْ بَالُونَةً أَصْبَحَ مَعَهَا؟": "assets/audio/educational/math/story_add3_p3.mp3",
    "عِنْدَ البَائِعْ": "assets/audio/educational/math/story_add4_p1.mp3",
    "كُتُبْ، وَأَحْضَرَ": "assets/audio/educational/math/story_add4_p2.mp3",
    "كُتُبٍ أُخْرَى. كَمْ كِتَابًا أَصْبَحَ عِنْدَهْ؟": "assets/audio/educational/math/story_add4_p3.mp3",
    "فِي الحَوْضْ": "assets/audio/educational/math/story_add5_p1.mp3",
    "سَمَكَة، وَأَضَافَ خَالِدْ": "assets/audio/educational/math/story_add5_p2.mp3",
    "سَمَكَاتْ. كَمْ سَمَكَةً فِي الحَوْضِ الآنَ؟": "assets/audio/educational/math/story_add5_p3.mp3",
    "كَانَ فِي الشَّجَرَة": "assets/audio/educational/math/story_sub1_p1.mp3",
    "عَصَافِيرْ، طَارَ مِنْهَا": "assets/audio/educational/math/story_sub1_p2.mp3",
    "كَمْ عُصْفُورًا بَقِيَ؟": "assets/audio/educational/math/story_sub1_p3.mp3",
    "عِنْدَ سَارَة": "assets/audio/educational/math/story_sub2_p1.mp3",
    "تُفَّاحَاتْ، أَخَذَتْ مِنْهَا أُخْتُهَا": "assets/audio/educational/math/story_sub2_p2.mp3",
    "كَمْ تُفَّاحَةً بَقِيَتْ مَعَهَا؟": "assets/audio/educational/math/story_sub2_p3.mp3",
    "كَانَ مَعَ أَحْمَدْ": "assets/audio/educational/math/story_sub3_p1.mp3",
    "بَالُونَاتْ، اخْتَفَتْ مِنْهَا": "assets/audio/educational/math/story_sub3_p2.mp3",
    "كَمْ بَالُونَةً بَقِيَتْ؟": "assets/audio/educational/math/story_sub3_p3.mp3",
    "عِنْدَ خَالِدْ": "assets/audio/educational/math/story_sub4_p1.mp3",
    "حَلْوَيَاتْ، أَكَلَ مِنْهَا": "assets/audio/educational/math/story_sub4_p2.mp3",
    "كَمْ حَلْوَى بَقِيَتْ؟": "assets/audio/educational/math/story_sub4_p3.mp3",
    "كَانَتْ فِي المَوْقِفْ": "assets/audio/educational/math/story_sub5_p1.mp3",
    "سَيَّارَاتْ، غَادَرَتْ مِنْهَا": "assets/audio/educational/math/story_sub5_p2.mp3",
    "كَمْ سَيَّارَةً بَقِيَتْ؟": "assets/audio/educational/math/story_sub5_p3.mp3",
    "إِطَارُ العَشَرَة": "assets/audio/educational/math/tenframe_intro.mp3",
    "مِنَ الأَقْرَاصِ المُمْتَلِئَة": "assets/audio/educational/math/tenframe_remove_post.mp3",
    "وَأَرْبَعُونْ": "assets/audio/educational/numbers/and_tens_40.mp3",
    "وَخَمْسُونْ": "assets/audio/educational/numbers/and_tens_50.mp3",
    "وَسِتُّونْ": "assets/audio/educational/numbers/and_tens_60.mp3",
    "وَسَبْعُونْ": "assets/audio/educational/numbers/and_tens_70.mp3",
    "وَثَمَانُونْ": "assets/audio/educational/numbers/and_tens_80.mp3",
    "وَتِسْعُونْ": "assets/audio/educational/numbers/and_tens_90.mp3",
    "صِفْرْ": "assets/audio/educational/numbers/number_00.mp3",
    "مِئَة": "assets/audio/educational/numbers/number_100.mp3",
    "خَمْسُونْ": "assets/audio/educational/numbers/number_50.mp3",
    "سِتُّونْ": "assets/audio/educational/numbers/number_60.mp3",
    "سَبْعُونْ": "assets/audio/educational/numbers/number_70.mp3",
    "ثَمَانُونْ": "assets/audio/educational/numbers/number_80.mp3",
    "تِسْعُونْ": "assets/audio/educational/numbers/number_90.mp3",
    /* ── 32 كلمة جديدة (سباق الحروف / مواضع الحرف / المطابقة / الكتابة) — دفعة NAMAA الأولى ── */
    "اِسْمْ": "assets/audio/educational/words/extra_189.mp3",
    "بَصّ": "assets/audio/educational/words/extra_190.mp3",
    "بَطّ": "assets/audio/educational/words/extra_191.mp3",
    "تُفَّاحَة": "assets/audio/educational/words/extra_192.mp3",
    "جَزَرَة": "assets/audio/educational/words/extra_193.mp3",
    "جَوّ": "assets/audio/educational/words/extra_194.mp3",
    "حَافِلَة": "assets/audio/educational/words/extra_195.mp3",
    "حَدِيثْ": "assets/audio/educational/words/extra_196.mp3",
    "حَدِيقَة": "assets/audio/educational/words/extra_197.mp3",
    "حَقّ": "assets/audio/educational/words/extra_198.mp3",
    "حَلْوَى": "assets/audio/educational/words/extra_199.mp3",
    "خَاتَمْ": "assets/audio/educational/words/extra_200.mp3",
    "خُضَارْ": "assets/audio/educational/words/extra_201.mp3",
    "خَطّ": "assets/audio/educational/words/extra_202.mp3",
    "دَمَجَ": "assets/audio/educational/words/extra_203.mp3",
    "سَبْعْ": "assets/audio/educational/words/extra_204.mp3",
    "سَرِيعْ": "assets/audio/educational/words/extra_205.mp3",
    "سُلَّمْ": "assets/audio/educational/words/extra_206.mp3",
    "سَمَكْ": "assets/audio/educational/words/extra_207.mp3",
    "شَكْلْ": "assets/audio/educational/words/extra_208.mp3",
    "صَفّ": "assets/audio/educational/words/extra_209.mp3",
    "صُوصْ": "assets/audio/educational/words/extra_210.mp3",
    "طَبَقْ": "assets/audio/educational/words/extra_211.mp3",
    "فَتَحَ": "assets/audio/educational/words/extra_212.mp3",
    "قَصّ": "assets/audio/educational/words/extra_213.mp3",
    "قِطّ": "assets/audio/educational/words/extra_214.mp3",
    "قِطَّة": "assets/audio/educational/words/extra_215.mp3",
    "لَفَظَ": "assets/audio/educational/words/extra_216.mp3",
    "مَثَلْ": "assets/audio/educational/words/extra_217.mp3",
    "مَنْزِلْ": "assets/audio/educational/words/extra_218.mp3",
    "نَبِيّ": "assets/audio/educational/words/extra_219.mp3",
    "نَصّ": "assets/audio/educational/words/extra_220.mp3",
    /* دفعة 2: حركات ومقاطع وأفعال وكلمات إضافية — مفاتيح للملفات الموجودة فعلًا فقط.
       harakat/syllables/verbs تُطابَق بنصها المشكَّل حرفيًا ولا تدخل فهرس التطابق بلا تشكيل (انظر buildIndex).
       letter_29_alef_madd و letter_30_ta_marbuta خارج المانيفست عمدًا حتى توجد شاشة تستدعيهما. */
    "بُ": "assets/audio/educational/harakat/damma_02.mp3",
    "تُ": "assets/audio/educational/harakat/damma_03.mp3",
    "ثُ": "assets/audio/educational/harakat/damma_04.mp3",
    "خُ": "assets/audio/educational/harakat/damma_07.mp3",
    "ذُ": "assets/audio/educational/harakat/damma_09.mp3",
    "رُ": "assets/audio/educational/harakat/damma_10.mp3",
    "زُ": "assets/audio/educational/harakat/damma_11.mp3",
    "شُ": "assets/audio/educational/harakat/damma_13.mp3",
    "صُ": "assets/audio/educational/harakat/damma_14.mp3",
    "طُ": "assets/audio/educational/harakat/damma_16.mp3",
    "ظُ": "assets/audio/educational/harakat/damma_17.mp3",
    "عُ": "assets/audio/educational/harakat/damma_18.mp3",
    "غُ": "assets/audio/educational/harakat/damma_19.mp3",
    "فُ": "assets/audio/educational/harakat/damma_20.mp3",
    "قُ": "assets/audio/educational/harakat/damma_21.mp3",
    "كُ": "assets/audio/educational/harakat/damma_22.mp3",
    "لُ": "assets/audio/educational/harakat/damma_23.mp3",
    "مُ": "assets/audio/educational/harakat/damma_24.mp3",
    "نُ": "assets/audio/educational/harakat/damma_25.mp3",
    "هُ": "assets/audio/educational/harakat/damma_26.mp3",
    "يُ": "assets/audio/educational/harakat/damma_28.mp3",
    "إِ": "assets/audio/educational/harakat/kasra_01.mp3",
    "بِ": "assets/audio/educational/harakat/kasra_02.mp3",
    "تِ": "assets/audio/educational/harakat/kasra_03.mp3",
    "ثِ": "assets/audio/educational/harakat/kasra_04.mp3",
    "جِ": "assets/audio/educational/harakat/kasra_05.mp3",
    "حِ": "assets/audio/educational/harakat/kasra_06.mp3",
    "خِ": "assets/audio/educational/harakat/kasra_07.mp3",
    "ذِ": "assets/audio/educational/harakat/kasra_09.mp3",
    "رِ": "assets/audio/educational/harakat/kasra_10.mp3",
    "زِ": "assets/audio/educational/harakat/kasra_11.mp3",
    "سِ": "assets/audio/educational/harakat/kasra_12.mp3",
    "شِ": "assets/audio/educational/harakat/kasra_13.mp3",
    "صِ": "assets/audio/educational/harakat/kasra_14.mp3",
    "ضِ": "assets/audio/educational/harakat/kasra_15.mp3",
    "طِ": "assets/audio/educational/harakat/kasra_16.mp3",
    "ظِ": "assets/audio/educational/harakat/kasra_17.mp3",
    "غِ": "assets/audio/educational/harakat/kasra_19.mp3",
    "فِ": "assets/audio/educational/harakat/kasra_20.mp3",
    "قِ": "assets/audio/educational/harakat/kasra_21.mp3",
    "كِ": "assets/audio/educational/harakat/kasra_22.mp3",
    "لِ": "assets/audio/educational/harakat/kasra_23.mp3",
    "هِ": "assets/audio/educational/harakat/kasra_26.mp3",
    "وِ": "assets/audio/educational/harakat/kasra_27.mp3",
    "يِ": "assets/audio/educational/harakat/kasra_28.mp3",
    "آخر الكلمة": "assets/audio/educational/letters/pos_final.mp3",
    "أول الكلمة": "assets/audio/educational/letters/pos_initial.mp3",
    "منفصل": "assets/audio/educational/letters/pos_isolated.mp3",
    "وسط الكلمة": "assets/audio/educational/letters/pos_medial.mp3",
    "خَطْوَةً وَاحِدَة": "assets/audio/educational/math/nl_step_one.mp3",
    "خَطْوَتَيْنِ": "assets/audio/educational/math/nl_step_two.mp3",
    "أَحْسَنْتَ! أَكْمَلْتَ لُعْبَةَ المُطَابَقَة": "assets/audio/educational/phrases/match_game_done.mp3",
    "أَحْسَنْتَ! أَكْمَلْتَ الجَوْلَة": "assets/audio/educational/phrases/match_round_done.mp3",
    "أَحْسَنْتَ! أَتْمَمْتَ الجَوْلَةَ بِنَجَاحْ": "assets/audio/educational/phrases/round_completed.mp3",
    "قَرَ": "assets/audio/educational/syllables/l2_01.mp3",
    "كَتَ": "assets/audio/educational/syllables/l2_02.mp3",
    "نَظَ": "assets/audio/educational/syllables/l2_03.mp3",
    "جَمَ": "assets/audio/educational/syllables/l2_04.mp3",
    "حَمَ": "assets/audio/educational/syllables/l2_05.mp3",
    "خَبَ": "assets/audio/educational/syllables/l2_06.mp3",
    "دَخَ": "assets/audio/educational/syllables/l2_07.mp3",
    "وَجَ": "assets/audio/educational/syllables/l2_08.mp3",
    "أَكَ": "assets/audio/educational/syllables/l2_09.mp3",
    "هَرَ": "assets/audio/educational/syllables/l2_10.mp3",
    "وَقَ": "assets/audio/educational/syllables/l2_11.mp3",
    "طَلَ": "assets/audio/educational/syllables/l2_12.mp3",
    "سَكَ": "assets/audio/educational/syllables/l2_13.mp3",
    "فَتَ": "assets/audio/educational/syllables/l2_14.mp3",
    "لَبَ": "assets/audio/educational/syllables/l2_16.mp3",
    "رَقَ": "assets/audio/educational/syllables/l2_17.mp3",
    "ضَحَ": "assets/audio/educational/syllables/l2_18.mp3",
    "طَبَ": "assets/audio/educational/syllables/l2_19.mp3",
    "بَتُ": "assets/audio/educational/syllables/l5_01.mp3",
    "كُتَ": "assets/audio/educational/syllables/l5_04.mp3",
    "دُبَ": "assets/audio/educational/syllables/l5_06.mp3",
    "رَمُ": "assets/audio/educational/syllables/l5_07.mp3",
    "شُبَ": "assets/audio/educational/syllables/l5_08.mp3",
    "نَمُ": "assets/audio/educational/syllables/l5_09.mp3",
    "تُبَ": "assets/audio/educational/syllables/l5_10.mp3",
    "لُمَ": "assets/audio/educational/syllables/l5_11.mp3",
    "بَتِ": "assets/audio/educational/syllables/l8_01.mp3",
    "مُسَ": "assets/audio/educational/syllables/l8_02.mp3",
    "كِتُ": "assets/audio/educational/syllables/l8_03.mp3",
    "سَمِ": "assets/audio/educational/syllables/l8_04.mp3",
    "دُرِ": "assets/audio/educational/syllables/l8_05.mp3",
    "فِتُ": "assets/audio/educational/syllables/l8_06.mp3",
    "لَمِ": "assets/audio/educational/syllables/l8_07.mp3",
    "نُبَ": "assets/audio/educational/syllables/l8_08.mp3",
    "رِتُ": "assets/audio/educational/syllables/l8_09.mp3",
    "حَمِ": "assets/audio/educational/syllables/l8_10.mp3",
    "ذَهَبَ": "assets/audio/educational/verbs/verb_02.mp3",
    "قَرَأَ": "assets/audio/educational/verbs/verb_03.mp3",
    "طَلَعَ": "assets/audio/educational/verbs/verb_04.mp3",
    "أَخَذَ": "assets/audio/educational/verbs/verb_06.mp3",
    "خَرَجَ": "assets/audio/educational/verbs/verb_07.mp3",
    "خَبَزَ": "assets/audio/educational/verbs/verb_08.mp3",
    "جَمَعَ": "assets/audio/educational/verbs/verb_11.mp3",
    "كَبُرَ": "assets/audio/educational/verbs/verb_13.mp3",
    "صَغُرَ": "assets/audio/educational/verbs/verb_15.mp3",
    "بَعُدَ": "assets/audio/educational/verbs/verb_17.mp3",
    "عَظُمَ": "assets/audio/educational/verbs/verb_19.mp3",
    "سَهُلَ": "assets/audio/educational/verbs/verb_20.mp3",
    "شَرِبَ": "assets/audio/educational/verbs/verb_22.mp3",
    "عَلِمَ": "assets/audio/educational/verbs/verb_24.mp3",
    "لَعِبَ": "assets/audio/educational/verbs/verb_26.mp3",
    "رَكِبَ": "assets/audio/educational/verbs/verb_27.mp3",
    "حَسِبَ": "assets/audio/educational/verbs/verb_28.mp3",
    "عَمِلَ": "assets/audio/educational/verbs/verb_29.mp3",
    "أَخْضَرْ": "assets/audio/educational/words/extra_001.mp3",
    "أَزْرَقْ": "assets/audio/educational/words/extra_002.mp3",
    "أُسْتَاذْ": "assets/audio/educational/words/extra_003.mp3",
    "أَسْمَاكْ": "assets/audio/educational/words/extra_004.mp3",
    "أَفْعَى": "assets/audio/educational/words/extra_005.mp3",
    "اِسْتَيْقَظَ": "assets/audio/educational/words/extra_006.mp3",
    "اِنْتَبَهَ": "assets/audio/educational/words/extra_007.mp3",
    "بَبَّغَاءْ": "assets/audio/educational/words/extra_008.mp3",
    "بَحَثَ": "assets/audio/educational/words/extra_009.mp3",
    "بَحْرْ": "assets/audio/educational/words/extra_010.mp3",
    "بَخُورْ": "assets/audio/educational/words/extra_011.mp3",
    "بَخِيلْ": "assets/audio/educational/words/extra_012.mp3",
    "بُرْجْ": "assets/audio/educational/words/extra_013.mp3",
    "بُرْغِيّ": "assets/audio/educational/words/extra_014.mp3",
    "بَرْقْ": "assets/audio/educational/words/extra_015.mp3",
    "بُرْكَانْ": "assets/audio/educational/words/extra_016.mp3",
    "بَصَلْ": "assets/audio/educational/words/extra_017.mp3",
    "بَطْرِيقْ": "assets/audio/educational/words/extra_018.mp3",
    "بَعْضْ": "assets/audio/educational/words/extra_019.mp3",
    "بَعُوضَة": "assets/audio/educational/words/extra_020.mp3",
    "بَغْلْ": "assets/audio/educational/words/extra_021.mp3",
    "بَقَّالَة": "assets/audio/educational/words/extra_022.mp3",
    "بَكَرَة": "assets/audio/educational/words/extra_023.mp3",
    "بَلَدْ": "assets/audio/educational/words/extra_024.mp3",
    "بَلَغَ": "assets/audio/educational/words/extra_025.mp3",
    "بُنِّيّ": "assets/audio/educational/words/extra_026.mp3",
    "بُومَة": "assets/audio/educational/words/extra_027.mp3",
    "بَيْضْ": "assets/audio/educational/words/extra_028.mp3",
    "تَارِيخْ": "assets/audio/educational/words/extra_029.mp3",
    "تِلْفَازْ": "assets/audio/educational/words/extra_030.mp3",
    "تَلَفَّظَ": "assets/audio/educational/words/extra_031.mp3",
    "تِلْمِيذْ": "assets/audio/educational/words/extra_032.mp3",
    "تِمْثَالْ": "assets/audio/educational/words/extra_033.mp3",
    "تِنِّينْ": "assets/audio/educational/words/extra_034.mp3",
    "ثَوْبْ": "assets/audio/educational/words/extra_035.mp3",
    "ثَوْرْ": "assets/audio/educational/words/extra_036.mp3",
    "جُبْنْ": "assets/audio/educational/words/extra_037.mp3",
    "جَرَاثِيمْ": "assets/audio/educational/words/extra_038.mp3",
    "جُرَذْ": "assets/audio/educational/words/extra_039.mp3",
    "جَرْوْ": "assets/audio/educational/words/extra_040.mp3",
    "جَلَسَ": "assets/audio/educational/words/extra_041.mp3",
    "جَمِيعْ": "assets/audio/educational/words/extra_042.mp3",
    "حَبْلْ": "assets/audio/educational/words/extra_043.mp3",
    "حَفِظَ": "assets/audio/educational/words/extra_044.mp3",
    "حِكَايَة": "assets/audio/educational/words/extra_045.mp3",
    "حَلَزُونْ": "assets/audio/educational/words/extra_046.mp3",
    "حِمَارْ": "assets/audio/educational/words/extra_047.mp3",
    "حَمَامَة": "assets/audio/educational/words/extra_048.mp3",
    "خَرِيطَة": "assets/audio/educational/words/extra_049.mp3",
    "خَشَبْ": "assets/audio/educational/words/extra_050.mp3",
    "خَطَأْ": "assets/audio/educational/words/extra_051.mp3",
    "خُفَّاشْ": "assets/audio/educational/words/extra_052.mp3",
    "دَلْوْ": "assets/audio/educational/words/extra_053.mp3",
    "دِمَاغْ": "assets/audio/educational/words/extra_054.mp3",
    "دَمَغَ": "assets/audio/educational/words/extra_055.mp3",
    "دَهِشَ": "assets/audio/educational/words/extra_056.mp3",
    "دِينَاصُورْ": "assets/audio/educational/words/extra_057.mp3",
    "ذُرَة": "assets/audio/educational/words/extra_058.mp3",
    "رَاكُونْ": "assets/audio/educational/words/extra_059.mp3",
    "رَبِيعْ": "assets/audio/educational/words/extra_060.mp3",
    "رَخُصَ": "assets/audio/educational/words/extra_061.mp3",
    "رَضِيعْ": "assets/audio/educational/words/extra_062.mp3",
    "رَقَبَة": "assets/audio/educational/words/extra_063.mp3",
    "رَكَضَ": "assets/audio/educational/words/extra_064.mp3",
    "رُمَّانْ": "assets/audio/educational/words/extra_065.mp3",
    "رَمْزْ": "assets/audio/educational/words/extra_066.mp3",
    "رِيشْ": "assets/audio/educational/words/extra_067.mp3",
    "زُهُورْ": "assets/audio/educational/words/extra_068.mp3",
    "سَاقْ": "assets/audio/educational/words/extra_069.mp3",
    "سَحَابْ": "assets/audio/educational/words/extra_070.mp3",
    "سَخَّانْ": "assets/audio/educational/words/extra_071.mp3",
    "سِكِّينْ": "assets/audio/educational/words/extra_072.mp3",
    "سُلَحْفَاة": "assets/audio/educational/words/extra_073.mp3",
    "سَهْمْ": "assets/audio/educational/words/extra_074.mp3",
    "سَيْفْ": "assets/audio/educational/words/extra_075.mp3",
    "شَاحِنَة": "assets/audio/educational/words/extra_076.mp3",
    "شَايْ": "assets/audio/educational/words/extra_077.mp3",
    "شَبَهْ": "assets/audio/educational/words/extra_078.mp3",
    "شُرْطِيّ": "assets/audio/educational/words/extra_079.mp3",
    "شَغَفْ": "assets/audio/educational/words/extra_080.mp3",
    "شَهْدْ": "assets/audio/educational/words/extra_081.mp3",
    "شَوْكْ": "assets/audio/educational/words/extra_082.mp3",
    "شَيْخْ": "assets/audio/educational/words/extra_083.mp3",
    "صَبَغَ": "assets/audio/educational/words/extra_084.mp3",
    "صَبِيّ": "assets/audio/educational/words/extra_085.mp3",
    "صَخْرَة": "assets/audio/educational/words/extra_086.mp3",
    "صَدِيقْ": "assets/audio/educational/words/extra_087.mp3",
    "صَغِيرْ": "assets/audio/educational/words/extra_088.mp3",
    "صَمْغْ": "assets/audio/educational/words/extra_089.mp3",
    "صِنَّارَة": "assets/audio/educational/words/extra_090.mp3",
    "صَيْدَلِيَّة": "assets/audio/educational/words/extra_091.mp3",
    "ضَبُعْ": "assets/audio/educational/words/extra_092.mp3",
    "ضَحِكَ": "assets/audio/educational/words/extra_093.mp3",
    "ضَفِيرَة": "assets/audio/educational/words/extra_094.mp3",
    "طَبَخَ": "assets/audio/educational/words/extra_095.mp3",
    "طَبْلْ": "assets/audio/educational/words/extra_096.mp3",
    "طَرِيقْ": "assets/audio/educational/words/extra_097.mp3",
    "طَمَاطِمْ": "assets/audio/educational/words/extra_098.mp3",
    "طَيَّارَة": "assets/audio/educational/words/extra_099.mp3",
    "ظَاهِرَة": "assets/audio/educational/words/extra_100.mp3",
    "ظَبْيْ": "assets/audio/educational/words/extra_101.mp3",
    "ظَرْبَانْ": "assets/audio/educational/words/extra_102.mp3",
    "ظَلَامْ": "assets/audio/educational/words/extra_103.mp3",
    "ظَهْرْ": "assets/audio/educational/words/extra_104.mp3",
    "عَشَاءْ": "assets/audio/educational/words/extra_105.mp3",
    "عَطَشْ": "assets/audio/educational/words/extra_106.mp3",
    "عَلِقَ": "assets/audio/educational/words/extra_107.mp3",
    "غَابَة": "assets/audio/educational/words/extra_108.mp3",
    "غِذَاءْ": "assets/audio/educational/words/extra_109.mp3",
    "غَزَالْ": "assets/audio/educational/words/extra_110.mp3",
    "غَوَّاصَة": "assets/audio/educational/words/extra_111.mp3",
    "غَيْمَة": "assets/audio/educational/words/extra_112.mp3",
    "فَأْسْ": "assets/audio/educational/words/extra_113.mp3",
    "فَرِيقْ": "assets/audio/educational/words/extra_114.mp3",
    "فَهْدْ": "assets/audio/educational/words/extra_115.mp3",
    "فَوَاكِهْ": "assets/audio/educational/words/extra_116.mp3",
    "قِرْشْ": "assets/audio/educational/words/extra_117.mp3",
    "قِطَارْ": "assets/audio/educational/words/extra_119.mp3",
    "قَمَرْ": "assets/audio/educational/words/extra_120.mp3",
    "قُنْفُذْ": "assets/audio/educational/words/extra_121.mp3",
    "كَفّ": "assets/audio/educational/words/extra_122.mp3",
    "كُمَّثْرَى": "assets/audio/educational/words/extra_123.mp3",
    "كَنْزْ": "assets/audio/educational/words/extra_124.mp3",
    "كَهْفْ": "assets/audio/educational/words/extra_125.mp3",
    "كَيْفْ": "assets/audio/educational/words/extra_126.mp3",
    "لَبِسَ": "assets/audio/educational/words/extra_127.mp3",
    "لَجَأَ": "assets/audio/educational/words/extra_128.mp3",
    "لَحَظَ": "assets/audio/educational/words/extra_129.mp3",
    "لُغْزْ": "assets/audio/educational/words/extra_130.mp3",
    "مَاعِزْ": "assets/audio/educational/words/extra_131.mp3",
    "مُثَلَّثْ": "assets/audio/educational/words/extra_132.mp3",
    "مُثِيرْ": "assets/audio/educational/words/extra_133.mp3",
    "مِحْرَاثْ": "assets/audio/educational/words/extra_134.mp3",
    "مَحْظُوظْ": "assets/audio/educational/words/extra_135.mp3",
    "مِحْفَظَة": "assets/audio/educational/words/extra_136.mp3",
    "مِخَدَّة": "assets/audio/educational/words/extra_137.mp3",
    "مَخْزَنْ": "assets/audio/educational/words/extra_138.mp3",
    "مُرَبَّعْ": "assets/audio/educational/words/extra_139.mp3",
    "مَرْفَأْ": "assets/audio/educational/words/extra_140.mp3",
    "مَرِيضْ": "assets/audio/educational/words/extra_141.mp3",
    "مُسْتَشْفَى": "assets/audio/educational/words/extra_142.mp3",
    "مَسَحَ": "assets/audio/educational/words/extra_143.mp3",
    "مِسْطَرَة": "assets/audio/educational/words/extra_144.mp3",
    "مُشْطْ": "assets/audio/educational/words/extra_145.mp3",
    "مِشْمِشْ": "assets/audio/educational/words/extra_146.mp3",
    "مِضْرَبْ": "assets/audio/educational/words/extra_147.mp3",
    "مَطْبَخْ": "assets/audio/educational/words/extra_148.mp3",
    "مِظَلَّة": "assets/audio/educational/words/extra_149.mp3",
    "مَغَارَة": "assets/audio/educational/words/extra_150.mp3",
    "مِغْرَفَة": "assets/audio/educational/words/extra_151.mp3",
    "مَغْسَلَة": "assets/audio/educational/words/extra_152.mp3",
    "مَكْتَبْ": "assets/audio/educational/words/extra_153.mp3",
    "مَلْجَأْ": "assets/audio/educational/words/extra_154.mp3",
    "مِلْحْ": "assets/audio/educational/words/extra_155.mp3",
    "مَلْعَبْ": "assets/audio/educational/words/extra_156.mp3",
    "مَلِكْ": "assets/audio/educational/words/extra_157.mp3",
    "مِنْظَارْ": "assets/audio/educational/words/extra_158.mp3",
    "مَنْفَذْ": "assets/audio/educational/words/extra_159.mp3",
    "مُهَرِّجْ": "assets/audio/educational/words/extra_160.mp3",
    "مِيَاهْ": "assets/audio/educational/words/extra_161.mp3",
    "نَارْ": "assets/audio/educational/words/extra_162.mp3",
    "نَبَغَ": "assets/audio/educational/words/extra_163.mp3",
    "نَبَّهَ": "assets/audio/educational/words/extra_164.mp3",
    "نَجَحَ": "assets/audio/educational/words/extra_165.mp3",
    "نَجْمْ": "assets/audio/educational/words/extra_166.mp3",
    "نُجُومْ": "assets/audio/educational/words/extra_167.mp3",
    "نَحْلَة": "assets/audio/educational/words/extra_168.mp3",
    "نَضِجَ": "assets/audio/educational/words/extra_169.mp3",
    "نَظَّارَة": "assets/audio/educational/words/extra_170.mp3",
    "نَظِيفْ": "assets/audio/educational/words/extra_171.mp3",
    "نَفَثَ": "assets/audio/educational/words/extra_172.mp3",
    "نَفَذَ": "assets/audio/educational/words/extra_173.mp3",
    "نَقْشْ": "assets/audio/educational/words/extra_174.mp3",
    "نَمْلْ": "assets/audio/educational/words/extra_175.mp3",
    "نَمْلَة": "assets/audio/educational/words/extra_176.mp3",
    "نَهْرْ": "assets/audio/educational/words/extra_177.mp3",
    "نَهَضَ": "assets/audio/educational/words/extra_178.mp3",
    "هِرَّة": "assets/audio/educational/words/extra_179.mp3",
    "وَرَقَة": "assets/audio/educational/words/extra_180.mp3",
    "وَزَّة": "assets/audio/educational/words/extra_181.mp3",
    "وَهَجْ": "assets/audio/educational/words/extra_182.mp3",
    "يَبْحَثْ": "assets/audio/educational/words/extra_183.mp3",
    "يَسَارْ": "assets/audio/educational/words/extra_184.mp3",
    "يَعْسُوبْ": "assets/audio/educational/words/extra_185.mp3",
    "يَقْرَأْ": "assets/audio/educational/words/extra_186.mp3",
    "يَمِينْ": "assets/audio/educational/words/extra_187.mp3",
    "بَيْضَة": "assets/audio/educational/words/extra_188.mp3",
    /* دفعة 3: حركات ومقاطع وأفعال — الملفات الموجودة فعلًا فقط (kasra_01 وkasra_04 وkasra_25 بانتظار إعادة التوليد). */
    "وُ": "assets/audio/educational/harakat/damma_27.mp3",
    "مِ": "assets/audio/educational/harakat/kasra_24.mp3",
    "نِ": "assets/audio/educational/harakat/kasra_25.mp3",
    "سُ": "assets/audio/educational/harakat/damma_12.mp3",
    "حُ": "assets/audio/educational/harakat/damma_06.mp3",
    "ضُ": "assets/audio/educational/harakat/damma_15.mp3",
    "جُ": "assets/audio/educational/harakat/damma_05.mp3",
    "أُ": "assets/audio/educational/harakat/damma_01.mp3",
    "دُ": "assets/audio/educational/harakat/damma_08.mp3",
    "عِ": "assets/audio/educational/harakat/kasra_18.mp3",
    "دِ": "assets/audio/educational/harakat/kasra_08.mp3",
    "مُنَ": "assets/audio/educational/syllables/l5_02.mp3",
    "جَمُ": "assets/audio/educational/syllables/l5_05.mp3",
    "سَمُ": "assets/audio/educational/syllables/l5_03.mp3",
    "كَتَبَ": "assets/audio/educational/verbs/verb_01.mp3",
    "حَرَثَ": "assets/audio/educational/verbs/verb_05.mp3",
    "فَهِمَ": "assets/audio/educational/verbs/verb_23.mp3",
    "دَخَلَ": "assets/audio/educational/verbs/verb_10.mp3",
    "سَمِعَ": "assets/audio/educational/verbs/verb_25.mp3",
    "حَسُنَ": "assets/audio/educational/verbs/verb_14.mp3",
    "وَجَدَ": "assets/audio/educational/verbs/verb_12.mp3",
    "قَرُبَ": "assets/audio/educational/verbs/verb_18.mp3",
    "حَمَلَ": "assets/audio/educational/verbs/verb_09.mp3",
    "كَرُمَ": "assets/audio/educational/verbs/verb_16.mp3",
    "صَعُبَ": "assets/audio/educational/verbs/verb_21.mp3",
    "غَسَ": "assets/audio/educational/syllables/l2_15.mp3",
    /* شرح الأحاديث الخمسة الحالية (زر «اسمع الشرح»): المفتاح يطابق hadiths[i].meaning بعد حذف التشكيل. */
    "الأَعْمَالُ تَكُونُ بِحَسَبِ نِيَّةِ الإِنْسَانِ وَقَصْدِهْ": "assets/audio/educational/hadith/hadith_01_meaning.mp3",
    "عَلَيْنَا أَنْ نَرْحَمَ النَّاسَ وَنُحْسِنَ مُعَامَلَتَهُمْ": "assets/audio/educational/hadith/hadith_02_meaning.mp3",
    "الابْتِسَامَةُ الجَمِيلَةُ صَدَقَة": "assets/audio/educational/hadith/hadith_03_meaning.mp3",
    "المُسْلِمُ لَا يُؤْذِي الآخَرِينَ بِكَلَامِهِ أَوْ أَفْعَالِهْ": "assets/audio/educational/hadith/hadith_04_meaning.mp3",
    "مِنْ أَفْضَلِ النَّاسِ مَنْ يَتَعَلَّمُ القُرْآنَ وَيُعَلِّمُهُ لِغَيْرِهْ": "assets/audio/educational/hadith/hadith_05_meaning.mp3",
};
/* =========================================================================
   🆕 =====================================================================
   🔊 speakEducational() — نطق محلي بملفات MP3 (صوت NAMAA Saudi TTS)
   =====================================================================
   مخصَّصة حصريًا للأقسام التعليمية (الحروف/الكلمات/الأرقام/الكتابة/
   الجمع/الطرح/الألعاب/الحديث الشريف). لا علاقة لها إطلاقًا بـ
   speak() العامة، ولا بـ AudioManager، ولا بأي كود خاص بالقرآن أو
   الأدعية — تلك تبقى تمامًا كما هي بلا أي تعديل (المحميّان: القرآن والأدعية فقط).

   ⚠️ تحديث المرحلة الثانية: لم يعد هناك أي تراجع إلى speak() / صوت
   المتصفح هنا. كل التشغيل يمرّ من EduAudio (أدناه): MP3 محلي فقط، وإن
   لم يوجد ملف فالنتيجة صمت + تسجيل النص في EduAudio.misses.
   (الوصف التالي تاريخي.)

   الآلية: تبحث في EDUCATIONAL_AUDIO_MANIFEST عن تطابق حرفي تام مع
   النص المطلوب؛ إن وُجد، تُشغِّل الملف المحلي المقابل مباشرة. إن لم
   يوجد (نص ديناميكي مثل أسئلة الجمع/الطرح، أو أي نص غير مُسجَّل)،
   تتراجع تلقائيًا لاستدعاء speak() الحالية بلا أي تغيير فيها —
   فيستمر الصوت بالعمل دائمًا، ولا يتعطَّل أبدًا.
========================================================================= */

/* =========================================================================
   🆕 إصلاح: سرعة أبطأ + منع تداخل الأصوات التعليمية تمامًا
   =========================================================================
   - EDUCATIONAL_AUDIO_PLAYBACK_RATE: تُبطئ تشغيل ملفات MP3 المحلية
     (NAMAA) عبر خاصية playbackRate القياسية في المتصفح — بلا أي
     تعديل على الملفات الصوتية الـ244 نفسها إطلاقًا، مع الحفاظ على
     طبقة الصوت (pitch) عبر preservesPitch لصوت طبيعي غير مشوَّه.
   - EDUCATIONAL_TTS_FALLBACK_RATE: تُبطئ أيضًا أي نص يتراجع لاستخدام
     speak() الحالية (نصوص ديناميكية كالجمع والطرح)، عبر تعديل خيار
     rate المُمرَّر فقط — بلا أي تعديل على speak()/TTSManager نفسهما.
   - قفل تشغيل (busy lock) + "فتحة انتظار" واحدة فقط لأحدث طلب: أي
     صوت تعليمي جديد أثناء تشغيل صوت تعزيزي حالي لا يقاطعه إطلاقًا؛
     يُحفَظ فقط آخر طلب ويُشغَّل تلقائيًا بعد اكتمال الصوت الحالي.
========================================================================= */

const EDUCATIONAL_AUDIO_PLAYBACK_RATE = 0.8;

/* =========================================================================
   🔊 EduAudio — محرك الصوت التعليمي الموحَّد (MP3 المحلي فقط)
   =========================================================================
   • كل الأقسام التعليمية (الحروف، الكلمات، الأرقام، الكتابة، الجمع، الطرح،
     الحديث الشريف، الألعاب) تمرّ من هنا: لا Browser TTS ولا TTS سحابي.
   • صوت واحد فقط في اللحظة: أي تشغيل جديد يُنهي ما قبله أو يُحفَظ كأحدث
     طلب منتظِر (mode: queue = الصوت الجاري يكتمل، interrupt = يقاطعه).
   • مفتاح «الصوت» في الإعدادات يتحكم في كل الـ MP3 التعليمية، وإيقافه يقطع
     الجاري فورًا.
   • ما لا ملف له: صمت + تسجيل في EduAudio.misses (لا نطق بديل أبدًا).
   • القرآن والأدعية (القسمان المحميان) لا تمرّ من هنا ولم تُمَسّ؛ الحديث الشريف يمرّ من هنا.
========================================================================= */
const EduAudio = (function () {

    /* نصوص مشكَّلة تختلف قراءتها عن الكلمة المسجَّلة بنفس الحروف
       (فعل ≠ اسم، أو مقطع ≠ كلمة): لا تُطابَق بلا تشكيلها — تنتظر تسجيلها */
    const NO_FUZZY = ["دُبَ", "ذَهَبَ", "خَبَزَ", "عَلِمَ"];
    const HARAKAT = /[ً-ٰٟـ‌‍]/g;
    const PUNCT = /[!؟?.,،:؛"'()«»\-–—…]/g;
    const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
    const GAP_MS = 120;
    const PAUSE_MS = 340;      // وقفة بعد الفاصلة/النقطة/علامة الاستفهام داخل الجملة المركّبة
    const FILE_GUARD_MS = 9000;
    const TENS_WORDS = { 40: "أربعون", 50: "خمسون", 60: "ستون", 70: "سبعون", 80: "ثمانون", 90: "تسعون" };

    let el = null;            // عنصر Audio الجاري (واحد فقط)
    let token = 0;
    let busy = false;
    let pending = null;
    let index = null;
    let indexMaxLen = 1;
    const misses = {};
    const log = [];

    function manifest() {
        return (typeof EDUCATIONAL_AUDIO_MANIFEST !== "undefined") ? EDUCATIONAL_AUDIO_MANIFEST : {};
    }
    function norm(s) {
        return String(s == null ? "" : s)
            .replace(HARAKAT, "")
            .replace(/[\u{1F000}-\u{1FFFF}\u2600-\u27BF\uFE0F\u2B50]/gu, " ")
            .replace(/[٠-٩]/g, d => String(AR_DIGITS.indexOf(d)))
            .replace(PUNCT, " ")
            .replace(/\s+/g, " ")
            .trim();
    }
    function buildIndex() {
        index = {};
        indexMaxLen = 1;
        const m = manifest();
        Object.keys(m).forEach(k => {
            /* الحروف والحركات والمقاطع والأفعال تُقرأ بتشكيل بعينه: لا تُطابَق بلا تشكيلها (كَتَبَ ≠ كُتُب) */
            if (/\/(letters|harakat|syllables|verbs)\//.test(m[k])) return;
            const n = norm(k);
            if (n && !index[n]) {
                index[n] = m[k];
                const c = n.split(" ").length;
                if (c > indexMaxLen) indexMaxLen = c;
            }
        });
    }
    function enabled() {
        try { return !(typeof Settings !== "undefined" && Settings.get().sound === false); } catch (e) { return true; }
    }

    /* نص واحد → مسار واحد أو null */
    function one(text) {
        const m = manifest();
        const t = String(text == null ? "" : text).trim();
        if (!t) return null;
        if (m[t]) return m[t];
        /* حرف مفرد: بلا حركة أو بفتحة فقط → صوت الحرف التعليمي. أي حركة أخرى
           (ضمة/كسرة/سكون...) لا تُحوَّل إلى الفتحة لأن النطق سيكون خاطئًا */
        if (/^[ء-ي][ً-ٰٟ]*$/.test(t)) {
            const base = t[0];
            const marks = t.slice(1);
            if (marks === "" || marks === "َ") {
                const k = base + "َ";
                if (m[k]) return m[k];
                if (base === "ا") return m["أَ"] || null;
            }
            return null;
        }
        if (NO_FUZZY.indexOf(t) >= 0) return null;
        if (!index) buildIndex();
        const n = norm(t);
        /* «حرف ب» أو «حرف ب في أول الكلمة» → صوت الحرف نفسه (لا ملف لكلمة «حرف» ولا لمواضع الحرف) */
        const lm = /^حرف ([\u0621-\u064A])(?: في .+)?$/.exec(n);
        if (lm) return one(lm[1]);
        if (/^\d+$/.test(n)) {
            const w = (typeof numberWords !== "undefined") ? numberWords[Number(n)] : null;
            if (w && m[w]) return m[w];
            return index[n] || null;
        }
        return index[n] || null;
    }

    /* عدد صحيح → قائمة مسارات مقاطعه (٠–٤٠ ملفات مفردة، ٤١–٩٩ = الآحاد + «وأربعون…»، ١٠٠ = مئة) أو null */
    function numberPaths(n) {
        if (!(n >= 0 && n <= 100)) return null;
        const direct = one(String(n));
        if (direct) return [direct];
        if (!index) buildIndex();
        if (n === 0) return index[norm("صفر")] ? [index[norm("صفر")]] : null;
        if (n === 100) return index[norm("مئة")] ? [index[norm("مئة")]] : null;
        const t = Math.floor(n / 10) * 10, u = n % 10;
        if (!TENS_WORDS[t]) return null;
        if (u === 0) return index[norm(TENS_WORDS[t])] ? [index[norm(TENS_WORDS[t])]] : null;
        const unit = one(String(u)), tens = index[norm("و" + TENS_WORDS[t])];
        return (unit && tens) ? [unit, tens] : null;
    }

    /* نص → خطة تشغيل { paths, gaps } أو null.
       gaps[i] = الفاصل (م.ث) بعد الملف i. الجملة غير المسجَّلة كاملةً تُركَّب من مقاطع
       مسجَّلة (عبارات وكلمات وأعداد) بأقل عدد ممكن من الملفات، وبترتيب النص نفسه؛
       وإن تعذّر تغطية كل كلماتها تُرجَع null (صمت مسجَّل في misses، لا نطق ناقص). */
    function plan(text) {
        const p = one(text);
        if (p) return { paths: [p], gaps: [] };
        const t = String(text == null ? "" : text).trim();
        const m = manifest();
        /* مقطع من حروف بفتحة فقط (قَرَ، كَتَ): نُركّبه من أصوات الحروف الموجودة */
        if (/^([ء-ي]َ){2}$/.test(t)) {
            const out = [];
            for (let i = 0; i < t.length; i += 2) {
                const k = t.substr(i, 2);
                if (!m[k]) return null;
                out.push(m[k]);
            }
            return { paths: out, gaps: out.map(() => GAP_MS) };
        }
        if (!index) buildIndex();
        /* كلمات النص مع علامة الوقفة بعد كل كلمة تنتهي بفاصلة/نقطة/استفهام/تعجب */
        const toks = [];
        t.split(/\s+/).forEach(w => {
            const n = norm(w);
            if (!n) return;
            n.split(" ").forEach((piece, idx, arr) => {
                toks.push({ n: piece, pause: idx === arr.length - 1 && /[،,.؟?!:؛]$/.test(w.replace(/[\s"'()«»]+$/g, "")) });
            });
        });
        const N = toks.length;
        if (N < 1 || N > 40) return null;
        /* كلمة/حرف واحد مشكَّل لا يُحوَّل هنا إلا إذا كان عددًا (حتى لا تُنطق «مِ» بصوت «مَ»
           ولا تُتجاوز قائمة NO_FUZZY)؛ والحروف المفردة داخل العبارات تبقى كما كانت (٢–٦ كلمات) */
        if (N === 1 && !/^\d+$/.test(toks[0].n)) return null;
        const allowLetters = (N >= 2 && N <= 6);
        const INF = 1e9;
        const cost = new Array(N + 1).fill(INF), back = new Array(N + 1).fill(null);
        cost[0] = 0;
        const maxL = Math.min(indexMaxLen, 12);
        for (let i = 0; i < N; i++) {
            if (cost[i] >= INF) continue;
            for (let l = 1; l <= Math.min(maxL, N - i); l++) {
                let seg = null;
                if (l === 1) {
                    const q = (allowLetters || toks[i].n.length > 1) ? one(toks[i].n) : null;
                    if (q) seg = [q];
                    else if (/^\d+$/.test(toks[i].n)) seg = numberPaths(Number(toks[i].n));
                } else {
                    const q = index[toks.slice(i, i + l).map(x => x.n).join(" ")];
                    if (q) seg = [q];
                }
                if (!seg) continue;
                const c = cost[i] + seg.length;
                if (c < cost[i + l] || (c === cost[i + l] && back[i + l] && l > back[i + l].l)) {
                    cost[i + l] = c;
                    back[i + l] = { from: i, l: l, seg: seg };
                }
            }
        }
        if (cost[N] >= INF) return null;
        const chain = [];
        for (let j = N; j > 0; j = back[j].from) chain.unshift(back[j]);
        const paths = [], gaps = [];
        chain.forEach(b => {
            const lastTok = toks[b.from + b.l - 1];
            b.seg.forEach((q, k) => {
                paths.push(q);
                gaps.push(k === b.seg.length - 1 && lastTok.pause ? PAUSE_MS : GAP_MS);
            });
        });
        return { paths: paths, gaps: gaps };
    }

    /* نص → قائمة مسارات (للتتابع) أو null */
    function resolve(text) {
        const pl = plan(text);
        return pl ? pl.paths : null;
    }

    function has(text) { return !!resolve(text); }

    function clearEl() {
        const a = el;
        el = null;
        if (a) { try { a.pause(); a.currentTime = 0; } catch (e) { /* لا شيء */ } }
    }

    function stop() {
        token++;
        busy = false;
        pending = null;
        clearEl();
    }

    function defer(fn) { if (typeof fn === "function") setTimeout(fn, 0); }

    function run(paths, opts, label) {
        stopLight();
        const my = ++token;
        busy = true;
        log.push({ text: label, files: paths.map(p => p.split("/").pop()) });
        if (log.length > 300) log.shift();
        let i = 0;
        let finished = false;

        const finish = () => {
            if (finished || my !== token) return;
            finished = true;
            busy = false;
            clearEl();
            if (typeof opts.done === "function") { try { opts.done(); } catch (e) { /* لا شيء */ } }
            if (my === token && pending) {
                const nx = pending;
                pending = null;
                play(nx.what, nx.opts);
            }
        };

        const step = () => {
            if (my !== token) return;
            if (i >= paths.length) { finish(); return; }
            const path = paths[i++];
            let moved = false;
            const next = () => {
                if (moved || my !== token) return;
                moved = true;
                if (i >= paths.length) finish(); else setTimeout(step, (opts.gaps && opts.gaps[i - 1] != null) ? opts.gaps[i - 1] : GAP_MS);
            };
            try {
                const a = new Audio(path);
                clearEl();
                el = a;
                a.playbackRate = (typeof EDUCATIONAL_AUDIO_PLAYBACK_RATE !== "undefined") ? EDUCATIONAL_AUDIO_PLAYBACK_RATE : 0.8;
                try { a.preservesPitch = true; a.mozPreservesPitch = true; a.webkitPreservesPitch = true; } catch (e) { /* لا شيء */ }
                a.addEventListener("ended", next, { once: true });
                a.addEventListener("error", next, { once: true });
                const pr = a.play();
                if (pr && typeof pr.catch === "function") pr.catch(next);
                /* مهلة أمان لملف لا يبدأ أو لا ينتهي؛ وبعد معرفة مدة الملف تُضبط على مدته الفعلية
                   حتى لا يُقطع مقطع طويل ولا يتداخل مع التالي */
                let guard = setTimeout(next, FILE_GUARD_MS);
                a.addEventListener("loadedmetadata", () => {
                    if (!(a.duration > 0) || !isFinite(a.duration)) return;
                    clearTimeout(guard);
                    guard = setTimeout(next, Math.ceil(a.duration / a.playbackRate * 1000) + 2500);
                }, { once: true });
            } catch (e) { next(); }
        };
        step();
    }

    function stopLight() {
        /* إنهاء ما قبله دون مسح الطلب المنتظر */
        const keep = pending;
        token++;
        clearEl();
        pending = keep;
    }

    /* what: نص أو مصفوفة نصوص. opts: { mode: "queue"|"interrupt", done } */
    function play(what, opts) {
        opts = opts || {};
        const list = Array.isArray(what) ? what : [what];
        const paths = [];
        const gaps = [];
        let ok = true;
        list.forEach(w => {
            const pl = plan(w);
            if (pl) {
                if (paths.length) gaps[gaps.length - 1] = GAP_MS;
                pl.paths.forEach((p, k) => { paths.push(p); gaps.push(pl.gaps[k] != null ? pl.gaps[k] : GAP_MS); });
            }
            else { ok = false; const key = String(w); misses[key] = (misses[key] || 0) + 1; }
        });
        opts = Object.assign({}, opts, { gaps: gaps });
        if (!enabled()) { defer(opts.done); return false; }
        if (!paths.length) { defer(opts.done); return false; }
        const label = list.join(" + ");
        if (opts.mode !== "interrupt" && busy) {
            pending = { what: what, opts: opts };
            return true;
        }
        if (opts.mode === "interrupt") pending = null;
        /* لا يسمع الطفل قرآنًا/دعاء مع الصوت التعليمي */
        try { if (typeof stopAllAudio === "function") stopAllAudio(); } catch (e) { /* لا شيء */ }
        run(paths, opts, label);
        return ok;
    }

    return {
        play: play,
        stop: stop,
        has: has,
        resolve: resolve,
        isBusy: function () { return busy; },
        misses: misses,
        log: log
    };
})();

function stopEducationalAudio() { EduAudio.stop(); }

function speakEducational(text, options) {
    EduAudio.play(text, { mode: "queue" });
}

/* إيقاف الصوت التعليمي المحلي عند تغيير الشاشة — تغليف غير جراحي
   لـ showScreen نفسها (دالة تنقّل عامة، لا علاقة لها بالقرآن أو
   الأدعية تحديدًا)، بلا أي لمس لـ AudioManager أو stopAllAudio */
const originalShowScreenForEducationalAudio = showScreen;

showScreen = function (screenId) {
    stopEducationalAudio();
    originalShowScreenForEducationalAudio(screenId);
};

/* =========================================================
   🔚 نهاية بنية speakEducational المحلية
========================================================= */


/* =========================================================
⭐ النجوم والمستوى والإحصائيات
========================================================= */

let stars = Number(
    localStorage.getItem("taha_app_stars") || 0
);

let level = Number(
    localStorage.getItem("taha_app_level") || 1
);

/* إحصائيات المعلم */
let correctLetters = Number(
    localStorage.getItem("taha_correct_letters") || 0
);

let correctWords = Number(
    localStorage.getItem("taha_correct_words") || 0
);

let correctNumbers = Number(
    localStorage.getItem("taha_correct_numbers") || 0
);

let correctAddition = Number(
    localStorage.getItem("taha_correct_addition") || 0
);

let correctSubtraction = Number(
    localStorage.getItem("taha_correct_subtraction") || 0
);

function getStars() {
    return stars;
}

function saveCounters() {

    localStorage.setItem(
        "taha_correct_letters",
        correctLetters
    );

    localStorage.setItem(
        "taha_correct_words",
        correctWords
    );

    localStorage.setItem(
        "taha_correct_numbers",
        correctNumbers
    );

    localStorage.setItem(
        "taha_correct_addition",
        correctAddition
    );

    localStorage.setItem(
        "taha_correct_subtraction",
        correctSubtraction
    );
}

function addStars(amount) {

    amount = Number(amount) || 0;

    stars += amount;

    if (stars < 0) {
        stars = 0;
    }

    level =
        Math.floor(stars / 100) + 1;

    localStorage.setItem(
        "taha_app_stars",
        stars
    );

    localStorage.setItem(
        "taha_app_level",
        level
    );

    updateStats();
}

function updateStats() {

    const starsEl = $("stars");
    const levelEl = $("level");

    if (starsEl) {
        starsEl.textContent =
            arabicNumber(stars);
    }

    if (levelEl) {
        levelEl.textContent =
            arabicNumber(level);
    }

    const rewardStars = $("rewardStars");

    if (rewardStars) {
        rewardStars.textContent =
            arabicNumber(stars);
    }

    const teacherStars = $("teacherStars");
    const teacherLevel = $("teacherLevel");

    if (teacherStars) {
        teacherStars.textContent =
            arabicNumber(stars);
    }

    if (teacherLevel) {
        teacherLevel.textContent =
            arabicNumber(level);
    }

    const teacherLetters = $("teacherLetters");
    const teacherWords = $("teacherWords");
    const teacherNumbers = $("teacherNumbers");
    const teacherAddition = $("teacherAddition");
    const teacherSubtraction = $("teacherSubtraction");

    if (teacherLetters) {
        teacherLetters.textContent =
            arabicNumber(correctLetters);
    }

    if (teacherWords) {
        teacherWords.textContent =
            arabicNumber(correctWords);
    }

    if (teacherNumbers) {
        teacherNumbers.textContent =
            arabicNumber(correctNumbers);
    }

    if (teacherAddition) {
        teacherAddition.textContent =
            arabicNumber(correctAddition);
    }

    if (teacherSubtraction) {
        teacherSubtraction.textContent =
            arabicNumber(correctSubtraction);
    }
}

/* =========================================================
🛑 إدارة الصوت والجلسات
========================================================= */

let letterGameSessionToken = 0;
let memoryTimer = null;

let quranSessionToken = 0;
let currentQuranAudio = null;

function invalidateLetterGameSession() {

    letterGameSessionToken++;

    if (memoryTimer) {
        clearTimeout(memoryTimer);
        memoryTimer = null;
    }
}

function stopAllAudio() {

    AudioManager.stop();

    if (currentQuranAudio) {

        try {
            currentQuranAudio.pause();
            currentQuranAudio.currentTime = 0;
            currentQuranAudio.src = "";
        } catch (error) {}

        currentQuranAudio = null;
    }

    quranSessionToken++;
}

/* =========================================================
🧭 التنقل
========================================================= */

function showScreen(screenId) {

    stopAllAudio();
    invalidateLetterGameSession();

    if (
        typeof matchingGame !== "undefined" &&
        matchingGame.active &&
        screenId !== "matchingGame"
    ) {
        stopMatchingGame();
    }

    document
        .querySelectorAll(".screen")
        .forEach(screen => {
            screen.classList.remove("active");
        });

    const target = $(screenId);

    if (target) {
        target.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (screenId === "letters") {
        renderLetterPage();
    }

    if (screenId === "words") {
        renderCurrentWord();
    }

    if (screenId === "numbers") {
        renderCurrentNumber();
    }

    if (screenId === "writing") {
        if (typeof renderWritingHub === "function") renderWritingHub();
    }

    if (screenId === "addition") {
        newAddition();
    }

    if (screenId === "subtraction") {
        newSubtraction();
    }

    if (screenId === "quran") {
        renderQuranSurahGrid();
        showQuranSurahList();
    }

    if (screenId === "hadith") {
        renderHadith();
    }

    if (screenId === "duas") {
        renderDua();
    }
}

/* =========================================================
🔤 الحروف
========================================================= */

const letters = [
    { letter: "أ", word: "أسد", emoji: "🦁" },
    { letter: "ب", word: "بقرة", emoji: "🐄" },
    { letter: "ت", word: "تفاح", emoji: "🍎" },
    { letter: "ث", word: "ثعلب", emoji: "🦊" },
    { letter: "ج", word: "جمل", emoji: "🐪" },
    { letter: "ح", word: "حصان", emoji: "🐎" },
    { letter: "خ", word: "خبز", emoji: "🍞" },
    { letter: "د", word: "دب", emoji: "🐻" },
    { letter: "ذ", word: "ذرة", emoji: "🌽" },
    { letter: "ر", word: "رمان", emoji: "🍎" },
    { letter: "ز", word: "زرافة", emoji: "🦒" },
    { letter: "س", word: "سمكة", emoji: "🐟" },
    { letter: "ش", word: "شمس", emoji: "☀️" },
    { letter: "ص", word: "صقر", emoji: "🦅" },
    { letter: "ض", word: "ضفدع", emoji: "🐸" },
    { letter: "ط", word: "طائرة", emoji: "✈️" },
    { letter: "ظ", word: "ظرف", emoji: "✉️" },
    { letter: "ع", word: "عين", emoji: "👁️" },
    { letter: "غ", word: "غيمة", emoji: "☁️" },
    { letter: "ف", word: "فيل", emoji: "🐘" },
    { letter: "ق", word: "قمر", emoji: "🌙" },
    { letter: "ك", word: "كتاب", emoji: "📘" },
    { letter: "ل", word: "ليمون", emoji: "🍋" },
    { letter: "م", word: "موز", emoji: "🍌" },
    { letter: "ن", word: "نجم", emoji: "⭐" },
    { letter: "ه", word: "هلال", emoji: "🌙" },
    { letter: "و", word: "وردة", emoji: "🌹" },
    { letter: "ي", word: "يد", emoji: "✋" }
];
/* =========================================================
📝 الكلمات
========================================================= */

/*
   🆕 تمت إعادة بناء قسم الكلمات بالكامل (٩ مستويات للحركات
   القصيرة). النظام الجديد الفعلي موجود في نهاية هذا الملف
   ضمن قسم "تطوير الكلمات الجديد".

   الدوال الأربع التالية (words, currentWordIndex,
   renderCurrentWord, speakWord, playCurrentWordAudio, nextWord)
   أصبحت الآن Stubs بسيطة فقط، غرضها الوحيد هو منع أي خطأ
   JavaScript في نقاط خارجية موجودة مسبقًا بالمشروع (خارج قسم
   الكلمات تمامًا) ما زالت تشير لهذه الأسماء بالاسم:
   - showScreen() الأصلية (تستدعي renderCurrentWord عند الدخول
     لشاشة "words" — أصبحت الآن لا تفعل شيئًا مرئيًا لأن الشاشة
     الجديدة تُدار عبر renderWordsLevelsHub بدلًا من ذلك).
   - "🌍 تصدير الدوال المطلوبة إلى HTML" (window.speakWord,
     window.playCurrentWordAudio, window.nextWord).
   - مستمع DOMContentLoaded الأصلي (يستدعي renderCurrentWord).
   - المُغلِّف (wrapper) الخاص بعدّاد "correctWords" ولوحة
     المعلم/المهمة اليومية، الذي يلتقط nextWord الأصلية.
   النظام الجديد لا يعتمد على أي من هذه الدوال، وله عدّاده
   ومنطقه المستقل بالكامل، لكنها تبقى موجودة (فارغة الأثر)
   حصرًا لضمان عدم كسر تلك النقاط الخارجية.
*/

const words = [];

let currentWordIndex = 0;

function renderCurrentWord() {}

function speakWord() {}

function playCurrentWordAudio() {}

function nextWord() {}

/* =========================================================
🔢 الأرقام
========================================================= */

let currentNumber = 1;

const numberWords = {
    1: "واحد",
    2: "اثنان",
    3: "ثلاثة",
    4: "أربعة",
    5: "خمسة",
    6: "ستة",
    7: "سبعة",
    8: "ثمانية",
    9: "تسعة",
    10: "عشرة",
    11: "أحد عشر",
    12: "اثنا عشر",
    13: "ثلاثة عشر",
    14: "أربعة عشر",
    15: "خمسة عشر",
    16: "ستة عشر",
    17: "سبعة عشر",
    18: "ثمانية عشر",
    19: "تسعة عشر",
    20: "عشرون",
    21: "واحد وعشرون",
    22: "اثنان وعشرون",
    23: "ثلاثة وعشرون",
    24: "أربعة وعشرون",
    25: "خمسة وعشرون",
    26: "ستة وعشرون",
    27: "سبعة وعشرون",
    28: "ثمانية وعشرون",
    29: "تسعة وعشرون",
    30: "ثلاثون",
    31: "واحد وثلاثون",
    32: "اثنان وثلاثون",
    33: "ثلاثة وثلاثون",
    34: "أربعة وثلاثون",
    35: "خمسة وثلاثون",
    36: "ستة وثلاثون",
    37: "سبعة وثلاثون",
    38: "ثمانية وثلاثون",
    39: "تسعة وثلاثون",
    40: "أربعون"
};

function renderCurrentNumber() {

    if ($("currentNumber")) {
        $("currentNumber").textContent =
            arabicNumber(currentNumber);
    }

    if ($("numberWord")) {
        $("numberWord").textContent =
            numberWords[currentNumber] ||
            arabicNumber(currentNumber);
    }

    /*
     * مهم:
     * HTML يستخدم countItems وليس numberItems
     */
    const items =
        $("countItems");

    if (items) {

        const count =
            Math.min(currentNumber, 20);

        items.textContent =
            "🍎".repeat(count);
    }
}

function speakNumber() {

    speakEducational(
        numberWords[currentNumber] ||
        arabicNumber(currentNumber)
    );
}

function nextNumber() {

    stopAllAudio();

    currentNumber++;

    if (currentNumber > 40) {
        currentNumber = 1;
    }

    renderCurrentNumber();
}

/*
 * اسم الدالة الموجود في HTML
 */
function newNumber() {
    nextNumber();
}

/* ✍️ الكتابة: القسم الجديد «حروفي الجميلة» في نهاية الملف */

/* =========================================================
➕ الجمع والطرح
========================================================= */

function toWesternDigits(v) {

    return String(v ?? "")
        .replace(
            /[٠-٩]/g,
            d =>
                "٠١٢٣٤٥٦٧٨٩".indexOf(d)
        )
        .replace(
            /[۰-۹]/g,
            d =>
                "۰۱۲۳۴۵۶۷۸۹".indexOf(d)
        );
}

function toArabicDigits(v) {

    return String(v ?? "")
        .replace(
            /\d/g,
            d => "٠١٢٣٤٥٦٧٨٩"[d]
        );
}

function parseNumber(v) {

    const n =
        Number(
            toWesternDigits(v)
                .replace(/[^\d-]/g, "")
        );

    return Number.isInteger(n)
        ? n
        : NaN;
}

/* =========================================================
➕ الجمع
========================================================= */

let currentAddA = 1;
let currentAddB = 1;

let additionTimer = null;

function newAddition() {

    if (additionTimer) {
        clearTimeout(additionTimer);
        additionTimer = null;
    }

    currentAddA =
        Math.floor(Math.random() * 9) + 1;

    currentAddB =
        Math.floor(Math.random() * 9) + 1;

    const question =
        $("addQuestion");

    const pictures =
        $("addPictures");

    const answer =
        $("addAnswer");

    const message =
        $("addMessage");

    if (question) {
        question.textContent =
            `${arabicNumber(currentAddA)} + ${arabicNumber(currentAddB)} = ؟`;
    }

    if (pictures) {
        pictures.textContent =
            "🍎".repeat(currentAddA) +
            "  +  " +
            "🍎".repeat(currentAddB);
    }

    if (answer) {
        answer.value = "";
    }

    if (message) {
        message.textContent = "";
        message.className = "message";
    }

    speakEducational(
        `${currentAddA} زائد ${currentAddB} يساوي كم؟`,
        {
            rate: 0.8
        }
    );
}

function checkAddition() {

    /*
       منع الضغط المتكرر بسرعة على "تحقق"
       بعد إجابة صحيحة (كان يسبب مضاعفة
       النجوم وتراكم المؤقتات).
    */
    if (additionTimer) return;

    const answerEl =
        $("addAnswer");

    const message =
        $("addMessage");

    const answer =
        parseNumber(
            answerEl ? answerEl.value : ""
        );

    const correct =
        currentAddA + currentAddB;

    if (!Number.isFinite(answer)) {

        if (message) {
            message.textContent =
                "✏️ اكتب الإجابة أولًا";

            message.className =
                "message wrong";
        }

        return;
    }

    if (answer === correct) {

        if (message) {
            message.textContent =
                "🎉 أحسنت! إجابة صحيحة ⭐";

            message.className =
                "message correct";
        }

        correctAddition++;

        saveCounters();

        addStars(5);

        speakEducational(
            "أحسنت! إجابة صحيحة",
            {
                rate: 0.8
            }
        );

        additionTimer =
            setTimeout(
                () => {
                    additionTimer = null;
                    newAddition();
                },
                1000
            );

    } else {

        if (message) {
            message.textContent =
                "😊 حاول مرة أخرى";

            message.className =
                "message wrong";
        }

        speakEducational(
            "حاول مرة أخرى",
            {
                rate: 0.8
            }
        );
    }
}

/* =========================================================
➖ الطرح
========================================================= */

let currentSubA = 3;
let currentSubB = 1;

let subtractionTimer = null;

function newSubtraction() {

    if (subtractionTimer) {
        clearTimeout(subtractionTimer);
        subtractionTimer = null;
    }

    currentSubA =
        Math.floor(Math.random() * 9) + 2;

    currentSubB =
        Math.floor(
            Math.random() * currentSubA
        ) + 1;

    const question =
        $("subQuestion");

    const pictures =
        $("subPictures");

    const answer =
        $("subAnswer");

    const message =
        $("subMessage");

    if (question) {
        question.textContent =
            `${arabicNumber(currentSubA)} - ${arabicNumber(currentSubB)} = ؟`;
    }

    if (pictures) {
        pictures.textContent =
            "🍎".repeat(currentSubA) +
            "  −  " +
            "🍎".repeat(currentSubB);
    }

    if (answer) {
        answer.value = "";
    }

    if (message) {
        message.textContent = "";
        message.className = "message";
    }

    speakEducational(
        `${currentSubA} ناقص ${currentSubB} يساوي كم؟`,
        {
            rate: 0.8
        }
    );
}

function checkSubtraction() {

    /*
       منع الضغط المتكرر بسرعة على "تحقق"
       بعد إجابة صحيحة (نفس إصلاح الجمع).
    */
    if (subtractionTimer) return;

    const answerEl =
        $("subAnswer");

    const message =
        $("subMessage");

    const answer =
        parseNumber(
            answerEl ? answerEl.value : ""
        );

    const correct =
        currentSubA - currentSubB;

    if (!Number.isFinite(answer)) {

        if (message) {
            message.textContent =
                "✏️ اكتب الإجابة أولًا";

            message.className =
                "message wrong";
        }

        return;
    }

    if (answer === correct) {

        if (message) {
            message.textContent =
                "🎉 أحسنت! إجابة صحيحة ⭐";

            message.className =
                "message correct";
        }

        correctSubtraction++;

        saveCounters();

        addStars(5);

        speakEducational(
            "أحسنت! إجابة صحيحة",
            {
                rate: 0.8
            }
        );

        subtractionTimer =
            setTimeout(
                () => {
                    subtractionTimer = null;
                    newSubtraction();
                },
                1000
            );

    } else {

        if (message) {
            message.textContent =
                "😊 حاول مرة أخرى";

            message.className =
                "message wrong";
        }

        speakEducational(
            "حاول مرة أخرى",
            {
                rate: 0.8
            }
        );
    }
}

/* =========================================================
⌨️ Enter للجمع والطرح
========================================================= */

document.addEventListener(
    "keydown",
    function(e) {

        if (e.key !== "Enter") return;

        if (
            document.activeElement?.id ===
            "addAnswer"
        ) {
            e.preventDefault();
            checkAddition();
        }

        if (
            document.activeElement?.id ===
            "subAnswer"
        ) {
            e.preventDefault();
            checkSubtraction();
        }
    }
);

/* =========================================================
📖 القرآن الكريم
🎙️ الشيخ الحصري
🔊 EveryAyah
========================================================= */

const quranSurahs = [
    { id: 114, name: "الناس", ayahCount: 6 },
    { id: 113, name: "الفلق", ayahCount: 5 },
    { id: 112, name: "الإخلاص", ayahCount: 4 },
    { id: 111, name: "المسد", ayahCount: 5 },
    { id: 110, name: "النصر", ayahCount: 3 },
    { id: 109, name: "الكافرون", ayahCount: 6 },
    { id: 108, name: "الكوثر", ayahCount: 3 },
    { id: 107, name: "الماعون", ayahCount: 7 },
    { id: 106, name: "قريش", ayahCount: 4 },
    { id: 105, name: "الفيل", ayahCount: 5 },
    { id: 104, name: "الهمزة", ayahCount: 9 },
    { id: 103, name: "العصر", ayahCount: 3 },
    { id: 102, name: "التكاثر", ayahCount: 8 },
    { id: 101, name: "القارعة", ayahCount: 11 },
    { id: 100, name: "العاديات", ayahCount: 11 },
    { id: 99, name: "الزلزلة", ayahCount: 8 },
    { id: 98, name: "البينة", ayahCount: 8 },
    { id: 97, name: "القدر", ayahCount: 5 },
    { id: 96, name: "العلق", ayahCount: 19 },
    { id: 95, name: "التين", ayahCount: 8 },
    { id: 94, name: "الشرح", ayahCount: 8 },
    { id: 93, name: "الضحى", ayahCount: 11 },
    { id: 92, name: "الليل", ayahCount: 21 },
    { id: 91, name: "الشمس", ayahCount: 15 },
    { id: 90, name: "البلد", ayahCount: 20 },
    { id: 89, name: "الفجر", ayahCount: 30 },
    { id: 88, name: "الغاشية", ayahCount: 26 },
    { id: 87, name: "الأعلى", ayahCount: 19 },
    { id: 86, name: "الطارق", ayahCount: 17 },
    { id: 85, name: "البروج", ayahCount: 22 },
    { id: 84, name: "الإنشقاق", ayahCount: 25 },
    { id: 83, name: "المطففين", ayahCount: 36 },
    { id: 82, name: "الإنفطار", ayahCount: 19 },
    { id: 81, name: "التكوير", ayahCount: 29 },
    { id: 80, name: "عبس", ayahCount: 42 },
    { id: 79, name: "النازعات", ayahCount: 46 },
    { id: 78, name: "النبإ", ayahCount: 40 },
];

const quranAyahs = {
    "114": [
        "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ",
        "مَلِكِ ٱلنَّاسِ",
        "إِلَٰهِ ٱلنَّاسِ",
        "مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ",
        "ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ",
        "مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ"
    ],
    "113": [
        "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ",
        "مِن شَرِّ مَا خَلَقَ",
        "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
        "وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ",
        "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ"
    ],
    "112": [
        "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
        "ٱللَّهُ ٱلصَّمَدُ",
        "لَمْ يَلِدْ وَلَمْ يُولَدْ",
        "وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ"
    ],
    "111": [
        "تَبَّتْ يَدَآ أَبِى لَهَبٍ وَتَبَّ",
        "مَآ أَغْنَىٰ عَنْهُ مَالُهُۥ وَمَا كَسَبَ",
        "سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ",
        "وَٱمْرَأَتُهُۥ حَمَّالَةَ ٱلْحَطَبِ",
        "فِى جِيدِهَا حَبْلٌ مِّن مَّسَدٍۭ"
    ],
    "110": [
        "إِذَا جَآءَ نَصْرُ ٱللَّهِ وَٱلْفَتْحُ",
        "وَرَأَيْتَ ٱلنَّاسَ يَدْخُلُونَ فِى دِينِ ٱللَّهِ أَفْوَاجًا",
        "فَسَبِّحْ بِحَمْدِ رَبِّكَ وَٱسْتَغْفِرْهُ إِنَّهُۥ كَانَ تَوَّابًۢا"
    ],
    "109": [
        "قُلْ يَٰٓأَيُّهَا ٱلْكَٰفِرُونَ",
        "لَآ أَعْبُدُ مَا تَعْبُدُونَ",
        "وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ",
        "وَلَآ أَنَا۠ عَابِدٌ مَّا عَبَدتُّمْ",
        "وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ",
        "لَكُمْ دِينُكُمْ وَلِىَ دِينِ"
    ],
    "108": [
        "إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ",
        "فَصَلِّ لِرَبِّكَ وَٱنْحَرْ",
        "إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ"
    ],
    "107": [
        "أَرَءَيْتَ ٱلَّذِى يُكَذِّبُ بِٱلدِّينِ",
        "فَذَٰلِكَ ٱلَّذِى يَدُعُّ ٱلْيَتِيمَ",
        "وَلَا يَحُضُّ عَلَىٰ طَعَامِ ٱلْمِسْكِينِ",
        "فَوَيْلٌ لِّلْمُصَلِّينَ",
        "ٱلَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ",
        "ٱلَّذِينَ هُمْ يُرَآءُونَ",
        "وَيَمْنَعُونَ ٱلْمَاعُونَ"
    ],
    "106": [
        "لِإِيلَٰفِ قُرَيْشٍ",
        "إِۦلَٰفِهِمْ رِحْلَةَ ٱلشِّتَآءِ وَٱلصَّيْفِ",
        "فَلْيَعْبُدُوا۟ رَبَّ هَٰذَا ٱلْبَيْتِ",
        "ٱلَّذِىٓ أَطْعَمَهُم مِّن جُوعٍ وَءَامَنَهُم مِّنْ خَوْفٍۭ"
    ],
    "105": [
        "أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَٰبِ ٱلْفِيلِ",
        "أَلَمْ يَجْعَلْ كَيْدَهُمْ فِى تَضْلِيلٍ",
        "وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ",
        "تَرْمِيهِم بِحِجَارَةٍ مِّن سِجِّيلٍ",
        "فَجَعَلَهُمْ كَعَصْفٍ مَّأْكُولٍۭ"
    ],
    "104": [
        "وَيْلٌ لِّكُلِّ هُمَزَةٍ لُّمَزَةٍ",
        "ٱلَّذِى جَمَعَ مَالًا وَعَدَّدَهُۥ",
        "يَحْسَبُ أَنَّ مَالَهُۥٓ أَخْلَدَهُۥ",
        "كَلَّا لَيُنۢبَذَنَّ فِى ٱلْحُطَمَةِ",
        "وَمَآ أَدْرَىٰكَ مَا ٱلْحُطَمَةُ",
        "نَارُ ٱللَّهِ ٱلْمُوقَدَةُ",
        "ٱلَّتِى تَطَّلِعُ عَلَى ٱلْأَفْـِٔدَةِ",
        "إِنَّهَا عَلَيْهِم مُّؤْصَدَةٌ",
        "فِى عَمَدٍ مُّمَدَّدَةٍۭ"
    ],
    "103": [
        "وَٱلْعَصْرِ",
        "إِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ",
        "إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ"
    ],
    "102": [
        "أَلْهَىٰكُمُ ٱلتَّكَاثُرُ",
        "حَتَّىٰ زُرْتُمُ ٱلْمَقَابِرَ",
        "كَلَّا سَوْفَ تَعْلَمُونَ",
        "ثُمَّ كَلَّا سَوْفَ تَعْلَمُونَ",
        "كَلَّا لَوْ تَعْلَمُونَ عِلْمَ ٱلْيَقِينِ",
        "لَتَرَوُنَّ ٱلْجَحِيمَ",
        "ثُمَّ لَتَرَوُنَّهَا عَيْنَ ٱلْيَقِينِ",
        "ثُمَّ لَتُسْـَٔلُنَّ يَوْمَئِذٍ عَنِ ٱلنَّعِيمِ"
    ],
    "101": [
        "ٱلْقَارِعَةُ",
        "مَا ٱلْقَارِعَةُ",
        "وَمَآ أَدْرَىٰكَ مَا ٱلْقَارِعَةُ",
        "يَوْمَ يَكُونُ ٱلنَّاسُ كَٱلْفَرَاشِ ٱلْمَبْثُوثِ",
        "وَتَكُونُ ٱلْجِبَالُ كَٱلْعِهْنِ ٱلْمَنفُوشِ",
        "فَأَمَّا مَن ثَقُلَتْ مَوَٰزِينُهُۥ",
        "فَهُوَ فِى عِيشَةٍ رَّاضِيَةٍ",
        "وَأَمَّا مَنْ خَفَّتْ مَوَٰزِينُهُۥ",
        "فَأُمُّهُۥ هَاوِيَةٌ",
        "وَمَآ أَدْرَىٰكَ مَا هِيَهْ",
        "نَارٌ حَامِيَةٌۢ"
    ],
    "100": [
        "وَٱلْعَٰدِيَٰتِ ضَبْحًا",
        "فَٱلْمُورِيَٰتِ قَدْحًا",
        "فَٱلْمُغِيرَٰتِ صُبْحًا",
        "فَأَثَرْنَ بِهِۦ نَقْعًا",
        "فَوَسَطْنَ بِهِۦ جَمْعًا",
        "إِنَّ ٱلْإِنسَٰنَ لِرَبِّهِۦ لَكَنُودٌ",
        "وَإِنَّهُۥ عَلَىٰ ذَٰلِكَ لَشَهِيدٌ",
        "وَإِنَّهُۥ لِحُبِّ ٱلْخَيْرِ لَشَدِيدٌ",
        "أَفَلَا يَعْلَمُ إِذَا بُعْثِرَ مَا فِى ٱلْقُبُورِ",
        "وَحُصِّلَ مَا فِى ٱلصُّدُورِ",
        "إِنَّ رَبَّهُم بِهِمْ يَوْمَئِذٍ لَّخَبِيرٌۢ"
    ],
    "99": [
        "إِذَا زُلْزِلَتِ ٱلْأَرْضُ زِلْزَالَهَا",
        "وَأَخْرَجَتِ ٱلْأَرْضُ أَثْقَالَهَا",
        "وَقَالَ ٱلْإِنسَٰنُ مَا لَهَا",
        "يَوْمَئِذٍ تُحَدِّثُ أَخْبَارَهَا",
        "بِأَنَّ رَبَّكَ أَوْحَىٰ لَهَا",
        "يَوْمَئِذٍ يَصْدُرُ ٱلنَّاسُ أَشْتَاتًا لِّيُرَوْا۟ أَعْمَٰلَهُمْ",
        "فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُۥ",
        "وَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ شَرًّا يَرَهُۥ"
    ],
    "98": [
        "لَمْ يَكُنِ ٱلَّذِينَ كَفَرُوا۟ مِنْ أَهْلِ ٱلْكِتَٰبِ وَٱلْمُشْرِكِينَ مُنفَكِّينَ حَتَّىٰ تَأْتِيَهُمُ ٱلْبَيِّنَةُ",
        "رَسُولٌ مِّنَ ٱللَّهِ يَتْلُوا۟ صُحُفًا مُّطَهَّرَةً",
        "فِيهَا كُتُبٌ قَيِّمَةٌ",
        "وَمَا تَفَرَّقَ ٱلَّذِينَ أُوتُوا۟ ٱلْكِتَٰبَ إِلَّا مِنۢ بَعْدِ مَا جَآءَتْهُمُ ٱلْبَيِّنَةُ",
        "وَمَآ أُمِرُوٓا۟ إِلَّا لِيَعْبُدُوا۟ ٱللَّهَ مُخْلِصِينَ لَهُ ٱلدِّينَ حُنَفَآءَ وَيُقِيمُوا۟ ٱلصَّلَوٰةَ وَيُؤْتُوا۟ ٱلزَّكَوٰةَ وَذَٰلِكَ دِينُ ٱلْقَيِّمَةِ",
        "إِنَّ ٱلَّذِينَ كَفَرُوا۟ مِنْ أَهْلِ ٱلْكِتَٰبِ وَٱلْمُشْرِكِينَ فِى نَارِ جَهَنَّمَ خَٰلِدِينَ فِيهَآ أُو۟لَٰٓئِكَ هُمْ شَرُّ ٱلْبَرِيَّةِ",
        "إِنَّ ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ أُو۟لَٰٓئِكَ هُمْ خَيْرُ ٱلْبَرِيَّةِ",
        "جَزَآؤُهُمْ عِندَ رَبِّهِمْ جَنَّٰتُ عَدْنٍ تَجْرِى مِن تَحْتِهَا ٱلْأَنْهَٰرُ خَٰلِدِينَ فِيهَآ أَبَدًا رَّضِىَ ٱللَّهُ عَنْهُمْ وَرَضُوا۟ عَنْهُ ذَٰلِكَ لِمَنْ خَشِىَ رَبَّهُۥ"
    ],
    "97": [
        "إِنَّآ أَنزَلْنَٰهُ فِى لَيْلَةِ ٱلْقَدْرِ",
        "وَمَآ أَدْرَىٰكَ مَا لَيْلَةُ ٱلْقَدْرِ",
        "لَيْلَةُ ٱلْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ",
        "تَنَزَّلُ ٱلْمَلَٰٓئِكَةُ وَٱلرُّوحُ فِيهَا بِإِذْنِ رَبِّهِم مِّن كُلِّ أَمْرٍ",
        "سَلَٰمٌ هِىَ حَتَّىٰ مَطْلَعِ ٱلْفَجْرِ"
    ],
    "96": [
        "ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِى خَلَقَ",
        "خَلَقَ ٱلْإِنسَٰنَ مِنْ عَلَقٍ",
        "ٱقْرَأْ وَرَبُّكَ ٱلْأَكْرَمُ",
        "ٱلَّذِى عَلَّمَ بِٱلْقَلَمِ",
        "عَلَّمَ ٱلْإِنسَٰنَ مَا لَمْ يَعْلَمْ",
        "كَلَّآ إِنَّ ٱلْإِنسَٰنَ لَيَطْغَىٰٓ",
        "أَن رَّءَاهُ ٱسْتَغْنَىٰٓ",
        "إِنَّ إِلَىٰ رَبِّكَ ٱلرُّجْعَىٰٓ",
        "أَرَءَيْتَ ٱلَّذِى يَنْهَىٰ",
        "عَبْدًا إِذَا صَلَّىٰٓ",
        "أَرَءَيْتَ إِن كَانَ عَلَى ٱلْهُدَىٰٓ",
        "أَوْ أَمَرَ بِٱلتَّقْوَىٰٓ",
        "أَرَءَيْتَ إِن كَذَّبَ وَتَوَلَّىٰٓ",
        "أَلَمْ يَعْلَم بِأَنَّ ٱللَّهَ يَرَىٰ",
        "كَلَّا لَئِن لَّمْ يَنتَهِ لَنَسْفَعًۢا بِٱلنَّاصِيَةِ",
        "نَاصِيَةٍ كَٰذِبَةٍ خَاطِئَةٍ",
        "فَلْيَدْعُ نَادِيَهُۥ",
        "سَنَدْعُ ٱلزَّبَانِيَةَ",
        "كَلَّا لَا تُطِعْهُ وَٱسْجُدْ وَٱقْتَرِب"
    ],
    "95": [
        "وَٱلتِّينِ وَٱلزَّيْتُونِ",
        "وَطُورِ سِينِينَ",
        "وَهَٰذَا ٱلْبَلَدِ ٱلْأَمِينِ",
        "لَقَدْ خَلَقْنَا ٱلْإِنسَٰنَ فِىٓ أَحْسَنِ تَقْوِيمٍ",
        "ثُمَّ رَدَدْنَٰهُ أَسْفَلَ سَٰفِلِينَ",
        "إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ فَلَهُمْ أَجْرٌ غَيْرُ مَمْنُونٍ",
        "فَمَا يُكَذِّبُكَ بَعْدُ بِٱلدِّينِ",
        "أَلَيْسَ ٱللَّهُ بِأَحْكَمِ ٱلْحَٰكِمِينَ"
    ],
    "94": [
        "أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ",
        "وَوَضَعْنَا عَنكَ وِزْرَكَ",
        "ٱلَّذِىٓ أَنقَضَ ظَهْرَكَ",
        "وَرَفَعْنَا لَكَ ذِكْرَكَ",
        "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
        "إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
        "فَإِذَا فَرَغْتَ فَٱنصَبْ",
        "وَإِلَىٰ رَبِّكَ فَٱرْغَب"
    ],
    "93": [
        "وَٱلضُّحَىٰ",
        "وَٱلَّيْلِ إِذَا سَجَىٰ",
        "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ",
        "وَلَلْـَٔاخِرَةُ خَيْرٌ لَّكَ مِنَ ٱلْأُولَىٰ",
        "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰٓ",
        "أَلَمْ يَجِدْكَ يَتِيمًا فَـَٔاوَىٰ",
        "وَوَجَدَكَ ضَآلًّا فَهَدَىٰ",
        "وَوَجَدَكَ عَآئِلًا فَأَغْنَىٰ",
        "فَأَمَّا ٱلْيَتِيمَ فَلَا تَقْهَرْ",
        "وَأَمَّا ٱلسَّآئِلَ فَلَا تَنْهَرْ",
        "وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ"
    ],
    "92": [
        "وَٱلَّيْلِ إِذَا يَغْشَىٰ",
        "وَٱلنَّهَارِ إِذَا تَجَلَّىٰ",
        "وَمَا خَلَقَ ٱلذَّكَرَ وَٱلْأُنثَىٰٓ",
        "إِنَّ سَعْيَكُمْ لَشَتَّىٰ",
        "فَأَمَّا مَنْ أَعْطَىٰ وَٱتَّقَىٰ",
        "وَصَدَّقَ بِٱلْحُسْنَىٰ",
        "فَسَنُيَسِّرُهُۥ لِلْيُسْرَىٰ",
        "وَأَمَّا مَنۢ بَخِلَ وَٱسْتَغْنَىٰ",
        "وَكَذَّبَ بِٱلْحُسْنَىٰ",
        "فَسَنُيَسِّرُهُۥ لِلْعُسْرَىٰ",
        "وَمَا يُغْنِى عَنْهُ مَالُهُۥٓ إِذَا تَرَدَّىٰٓ",
        "إِنَّ عَلَيْنَا لَلْهُدَىٰ",
        "وَإِنَّ لَنَا لَلْـَٔاخِرَةَ وَٱلْأُولَىٰ",
        "فَأَنذَرْتُكُمْ نَارًا تَلَظَّىٰ",
        "لَا يَصْلَىٰهَآ إِلَّا ٱلْأَشْقَى",
        "ٱلَّذِى كَذَّبَ وَتَوَلَّىٰ",
        "وَسَيُجَنَّبُهَا ٱلْأَتْقَى",
        "ٱلَّذِى يُؤْتِى مَالَهُۥ يَتَزَكَّىٰ",
        "وَمَا لِأَحَدٍ عِندَهُۥ مِن نِّعْمَةٍ تُجْزَىٰٓ",
        "إِلَّا ٱبْتِغَآءَ وَجْهِ رَبِّهِ ٱلْأَعْلَىٰ",
        "وَلَسَوْفَ يَرْضَىٰ"
    ],
    "91": [
        "وَٱلشَّمْسِ وَضُحَىٰهَا",
        "وَٱلْقَمَرِ إِذَا تَلَىٰهَا",
        "وَٱلنَّهَارِ إِذَا جَلَّىٰهَا",
        "وَٱلَّيْلِ إِذَا يَغْشَىٰهَا",
        "وَٱلسَّمَآءِ وَمَا بَنَىٰهَا",
        "وَٱلْأَرْضِ وَمَا طَحَىٰهَا",
        "وَنَفْسٍ وَمَا سَوَّىٰهَا",
        "فَأَلْهَمَهَا فُجُورَهَا وَتَقْوَىٰهَا",
        "قَدْ أَفْلَحَ مَن زَكَّىٰهَا",
        "وَقَدْ خَابَ مَن دَسَّىٰهَا",
        "كَذَّبَتْ ثَمُودُ بِطَغْوَىٰهَآ",
        "إِذِ ٱنۢبَعَثَ أَشْقَىٰهَا",
        "فَقَالَ لَهُمْ رَسُولُ ٱللَّهِ نَاقَةَ ٱللَّهِ وَسُقْيَٰهَا",
        "فَكَذَّبُوهُ فَعَقَرُوهَا فَدَمْدَمَ عَلَيْهِمْ رَبُّهُم بِذَنۢبِهِمْ فَسَوَّىٰهَا",
        "وَلَا يَخَافُ عُقْبَٰهَا"
    ],
    "90": [
        "لَآ أُقْسِمُ بِهَٰذَا ٱلْبَلَدِ",
        "وَأَنتَ حِلٌّۢ بِهَٰذَا ٱلْبَلَدِ",
        "وَوَالِدٍ وَمَا وَلَدَ",
        "لَقَدْ خَلَقْنَا ٱلْإِنسَٰنَ فِى كَبَدٍ",
        "أَيَحْسَبُ أَن لَّن يَقْدِرَ عَلَيْهِ أَحَدٌ",
        "يَقُولُ أَهْلَكْتُ مَالًا لُّبَدًا",
        "أَيَحْسَبُ أَن لَّمْ يَرَهُۥٓ أَحَدٌ",
        "أَلَمْ نَجْعَل لَّهُۥ عَيْنَيْنِ",
        "وَلِسَانًا وَشَفَتَيْنِ",
        "وَهَدَيْنَٰهُ ٱلنَّجْدَيْنِ",
        "فَلَا ٱقْتَحَمَ ٱلْعَقَبَةَ",
        "وَمَآ أَدْرَىٰكَ مَا ٱلْعَقَبَةُ",
        "فَكُّ رَقَبَةٍ",
        "أَوْ إِطْعَٰمٌ فِى يَوْمٍ ذِى مَسْغَبَةٍ",
        "يَتِيمًا ذَا مَقْرَبَةٍ",
        "أَوْ مِسْكِينًا ذَا مَتْرَبَةٍ",
        "ثُمَّ كَانَ مِنَ ٱلَّذِينَ ءَامَنُوا۟ وَتَوَاصَوْا۟ بِٱلصَّبْرِ وَتَوَاصَوْا۟ بِٱلْمَرْحَمَةِ",
        "أُو۟لَٰٓئِكَ أَصْحَٰبُ ٱلْمَيْمَنَةِ",
        "وَٱلَّذِينَ كَفَرُوا۟ بِـَٔايَٰتِنَا هُمْ أَصْحَٰبُ ٱلْمَشْـَٔمَةِ",
        "عَلَيْهِمْ نَارٌ مُّؤْصَدَةٌۢ"
    ],
    "89": [
        "وَٱلْفَجْرِ",
        "وَلَيَالٍ عَشْرٍ",
        "وَٱلشَّفْعِ وَٱلْوَتْرِ",
        "وَٱلَّيْلِ إِذَا يَسْرِ",
        "هَلْ فِى ذَٰلِكَ قَسَمٌ لِّذِى حِجْرٍ",
        "أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِعَادٍ",
        "إِرَمَ ذَاتِ ٱلْعِمَادِ",
        "ٱلَّتِى لَمْ يُخْلَقْ مِثْلُهَا فِى ٱلْبِلَٰدِ",
        "وَثَمُودَ ٱلَّذِينَ جَابُوا۟ ٱلصَّخْرَ بِٱلْوَادِ",
        "وَفِرْعَوْنَ ذِى ٱلْأَوْتَادِ",
        "ٱلَّذِينَ طَغَوْا۟ فِى ٱلْبِلَٰدِ",
        "فَأَكْثَرُوا۟ فِيهَا ٱلْفَسَادَ",
        "فَصَبَّ عَلَيْهِمْ رَبُّكَ سَوْطَ عَذَابٍ",
        "إِنَّ رَبَّكَ لَبِٱلْمِرْصَادِ",
        "فَأَمَّا ٱلْإِنسَٰنُ إِذَا مَا ٱبْتَلَىٰهُ رَبُّهُۥ فَأَكْرَمَهُۥ وَنَعَّمَهُۥ فَيَقُولُ رَبِّىٓ أَكْرَمَنِ",
        "وَأَمَّآ إِذَا مَا ٱبْتَلَىٰهُ فَقَدَرَ عَلَيْهِ رِزْقَهُۥ فَيَقُولُ رَبِّىٓ أَهَٰنَنِ",
        "كَلَّا بَل لَّا تُكْرِمُونَ ٱلْيَتِيمَ",
        "وَلَا تَحَٰٓضُّونَ عَلَىٰ طَعَامِ ٱلْمِسْكِينِ",
        "وَتَأْكُلُونَ ٱلتُّرَاثَ أَكْلًا لَّمًّا",
        "وَتُحِبُّونَ ٱلْمَالَ حُبًّا جَمًّا",
        "كَلَّآ إِذَا دُكَّتِ ٱلْأَرْضُ دَكًّا دَكًّا",
        "وَجَآءَ رَبُّكَ وَٱلْمَلَكُ صَفًّا صَفًّا",
        "وَجِا۟ىٓءَ يَوْمَئِذٍۭ بِجَهَنَّمَ يَوْمَئِذٍ يَتَذَكَّرُ ٱلْإِنسَٰنُ وَأَنَّىٰ لَهُ ٱلذِّكْرَىٰ",
        "يَقُولُ يَٰلَيْتَنِى قَدَّمْتُ لِحَيَاتِى",
        "فَيَوْمَئِذٍ لَّا يُعَذِّبُ عَذَابَهُۥٓ أَحَدٌ",
        "وَلَا يُوثِقُ وَثَاقَهُۥٓ أَحَدٌ",
        "يَٰٓأَيَّتُهَا ٱلنَّفْسُ ٱلْمُطْمَئِنَّةُ",
        "ٱرْجِعِىٓ إِلَىٰ رَبِّكِ رَاضِيَةً مَّرْضِيَّةً",
        "فَٱدْخُلِى فِى عِبَٰدِى",
        "وَٱدْخُلِى جَنَّتِى"
    ],
    "88": [
        "هَلْ أَتَىٰكَ حَدِيثُ ٱلْغَٰشِيَةِ",
        "وُجُوهٌ يَوْمَئِذٍ خَٰشِعَةٌ",
        "عَامِلَةٌ نَّاصِبَةٌ",
        "تَصْلَىٰ نَارًا حَامِيَةً",
        "تُسْقَىٰ مِنْ عَيْنٍ ءَانِيَةٍ",
        "لَّيْسَ لَهُمْ طَعَامٌ إِلَّا مِن ضَرِيعٍ",
        "لَّا يُسْمِنُ وَلَا يُغْنِى مِن جُوعٍ",
        "وُجُوهٌ يَوْمَئِذٍ نَّاعِمَةٌ",
        "لِّسَعْيِهَا رَاضِيَةٌ",
        "فِى جَنَّةٍ عَالِيَةٍ",
        "لَّا تَسْمَعُ فِيهَا لَٰغِيَةً",
        "فِيهَا عَيْنٌ جَارِيَةٌ",
        "فِيهَا سُرُرٌ مَّرْفُوعَةٌ",
        "وَأَكْوَابٌ مَّوْضُوعَةٌ",
        "وَنَمَارِقُ مَصْفُوفَةٌ",
        "وَزَرَابِىُّ مَبْثُوثَةٌ",
        "أَفَلَا يَنظُرُونَ إِلَى ٱلْإِبِلِ كَيْفَ خُلِقَتْ",
        "وَإِلَى ٱلسَّمَآءِ كَيْفَ رُفِعَتْ",
        "وَإِلَى ٱلْجِبَالِ كَيْفَ نُصِبَتْ",
        "وَإِلَى ٱلْأَرْضِ كَيْفَ سُطِحَتْ",
        "فَذَكِّرْ إِنَّمَآ أَنتَ مُذَكِّرٌ",
        "لَّسْتَ عَلَيْهِم بِمُصَيْطِرٍ",
        "إِلَّا مَن تَوَلَّىٰ وَكَفَرَ",
        "فَيُعَذِّبُهُ ٱللَّهُ ٱلْعَذَابَ ٱلْأَكْبَرَ",
        "إِنَّ إِلَيْنَآ إِيَابَهُمْ",
        "ثُمَّ إِنَّ عَلَيْنَا حِسَابَهُم"
    ],
    "87": [
        "سَبِّحِ ٱسْمَ رَبِّكَ ٱلْأَعْلَى",
        "ٱلَّذِى خَلَقَ فَسَوَّىٰ",
        "وَٱلَّذِى قَدَّرَ فَهَدَىٰ",
        "وَٱلَّذِىٓ أَخْرَجَ ٱلْمَرْعَىٰ",
        "فَجَعَلَهُۥ غُثَآءً أَحْوَىٰ",
        "سَنُقْرِئُكَ فَلَا تَنسَىٰٓ",
        "إِلَّا مَا شَآءَ ٱللَّهُ إِنَّهُۥ يَعْلَمُ ٱلْجَهْرَ وَمَا يَخْفَىٰ",
        "وَنُيَسِّرُكَ لِلْيُسْرَىٰ",
        "فَذَكِّرْ إِن نَّفَعَتِ ٱلذِّكْرَىٰ",
        "سَيَذَّكَّرُ مَن يَخْشَىٰ",
        "وَيَتَجَنَّبُهَا ٱلْأَشْقَى",
        "ٱلَّذِى يَصْلَى ٱلنَّارَ ٱلْكُبْرَىٰ",
        "ثُمَّ لَا يَمُوتُ فِيهَا وَلَا يَحْيَىٰ",
        "قَدْ أَفْلَحَ مَن تَزَكَّىٰ",
        "وَذَكَرَ ٱسْمَ رَبِّهِۦ فَصَلَّىٰ",
        "بَلْ تُؤْثِرُونَ ٱلْحَيَوٰةَ ٱلدُّنْيَا",
        "وَٱلْـَٔاخِرَةُ خَيْرٌ وَأَبْقَىٰٓ",
        "إِنَّ هَٰذَا لَفِى ٱلصُّحُفِ ٱلْأُولَىٰ",
        "صُحُفِ إِبْرَٰهِيمَ وَمُوسَىٰ"
    ],
    "86": [
        "وَٱلسَّمَآءِ وَٱلطَّارِقِ",
        "وَمَآ أَدْرَىٰكَ مَا ٱلطَّارِقُ",
        "ٱلنَّجْمُ ٱلثَّاقِبُ",
        "إِن كُلُّ نَفْسٍ لَّمَّا عَلَيْهَا حَافِظٌ",
        "فَلْيَنظُرِ ٱلْإِنسَٰنُ مِمَّ خُلِقَ",
        "خُلِقَ مِن مَّآءٍ دَافِقٍ",
        "يَخْرُجُ مِنۢ بَيْنِ ٱلصُّلْبِ وَٱلتَّرَآئِبِ",
        "إِنَّهُۥ عَلَىٰ رَجْعِهِۦ لَقَادِرٌ",
        "يَوْمَ تُبْلَى ٱلسَّرَآئِرُ",
        "فَمَا لَهُۥ مِن قُوَّةٍ وَلَا نَاصِرٍ",
        "وَٱلسَّمَآءِ ذَاتِ ٱلرَّجْعِ",
        "وَٱلْأَرْضِ ذَاتِ ٱلصَّدْعِ",
        "إِنَّهُۥ لَقَوْلٌ فَصْلٌ",
        "وَمَا هُوَ بِٱلْهَزْلِ",
        "إِنَّهُمْ يَكِيدُونَ كَيْدًا",
        "وَأَكِيدُ كَيْدًا",
        "فَمَهِّلِ ٱلْكَٰفِرِينَ أَمْهِلْهُمْ رُوَيْدًۢا"
    ],
    "85": [
        "وَٱلسَّمَآءِ ذَاتِ ٱلْبُرُوجِ",
        "وَٱلْيَوْمِ ٱلْمَوْعُودِ",
        "وَشَاهِدٍ وَمَشْهُودٍ",
        "قُتِلَ أَصْحَٰبُ ٱلْأُخْدُودِ",
        "ٱلنَّارِ ذَاتِ ٱلْوَقُودِ",
        "إِذْ هُمْ عَلَيْهَا قُعُودٌ",
        "وَهُمْ عَلَىٰ مَا يَفْعَلُونَ بِٱلْمُؤْمِنِينَ شُهُودٌ",
        "وَمَا نَقَمُوا۟ مِنْهُمْ إِلَّآ أَن يُؤْمِنُوا۟ بِٱللَّهِ ٱلْعَزِيزِ ٱلْحَمِيدِ",
        "ٱلَّذِى لَهُۥ مُلْكُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ وَٱللَّهُ عَلَىٰ كُلِّ شَىْءٍ شَهِيدٌ",
        "إِنَّ ٱلَّذِينَ فَتَنُوا۟ ٱلْمُؤْمِنِينَ وَٱلْمُؤْمِنَٰتِ ثُمَّ لَمْ يَتُوبُوا۟ فَلَهُمْ عَذَابُ جَهَنَّمَ وَلَهُمْ عَذَابُ ٱلْحَرِيقِ",
        "إِنَّ ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ لَهُمْ جَنَّٰتٌ تَجْرِى مِن تَحْتِهَا ٱلْأَنْهَٰرُ ذَٰلِكَ ٱلْفَوْزُ ٱلْكَبِيرُ",
        "إِنَّ بَطْشَ رَبِّكَ لَشَدِيدٌ",
        "إِنَّهُۥ هُوَ يُبْدِئُ وَيُعِيدُ",
        "وَهُوَ ٱلْغَفُورُ ٱلْوَدُودُ",
        "ذُو ٱلْعَرْشِ ٱلْمَجِيدُ",
        "فَعَّالٌ لِّمَا يُرِيدُ",
        "هَلْ أَتَىٰكَ حَدِيثُ ٱلْجُنُودِ",
        "فِرْعَوْنَ وَثَمُودَ",
        "بَلِ ٱلَّذِينَ كَفَرُوا۟ فِى تَكْذِيبٍ",
        "وَٱللَّهُ مِن وَرَآئِهِم مُّحِيطٌۢ",
        "بَلْ هُوَ قُرْءَانٌ مَّجِيدٌ",
        "فِى لَوْحٍ مَّحْفُوظٍۭ"
    ],
    "84": [
        "إِذَا ٱلسَّمَآءُ ٱنشَقَّتْ",
        "وَأَذِنَتْ لِرَبِّهَا وَحُقَّتْ",
        "وَإِذَا ٱلْأَرْضُ مُدَّتْ",
        "وَأَلْقَتْ مَا فِيهَا وَتَخَلَّتْ",
        "وَأَذِنَتْ لِرَبِّهَا وَحُقَّتْ",
        "يَٰٓأَيُّهَا ٱلْإِنسَٰنُ إِنَّكَ كَادِحٌ إِلَىٰ رَبِّكَ كَدْحًا فَمُلَٰقِيهِ",
        "فَأَمَّا مَنْ أُوتِىَ كِتَٰبَهُۥ بِيَمِينِهِۦ",
        "فَسَوْفَ يُحَاسَبُ حِسَابًا يَسِيرًا",
        "وَيَنقَلِبُ إِلَىٰٓ أَهْلِهِۦ مَسْرُورًا",
        "وَأَمَّا مَنْ أُوتِىَ كِتَٰبَهُۥ وَرَآءَ ظَهْرِهِۦ",
        "فَسَوْفَ يَدْعُوا۟ ثُبُورًا",
        "وَيَصْلَىٰ سَعِيرًا",
        "إِنَّهُۥ كَانَ فِىٓ أَهْلِهِۦ مَسْرُورًا",
        "إِنَّهُۥ ظَنَّ أَن لَّن يَحُورَ",
        "بَلَىٰٓ إِنَّ رَبَّهُۥ كَانَ بِهِۦ بَصِيرًا",
        "فَلَآ أُقْسِمُ بِٱلشَّفَقِ",
        "وَٱلَّيْلِ وَمَا وَسَقَ",
        "وَٱلْقَمَرِ إِذَا ٱتَّسَقَ",
        "لَتَرْكَبُنَّ طَبَقًا عَن طَبَقٍ",
        "فَمَا لَهُمْ لَا يُؤْمِنُونَ",
        "وَإِذَا قُرِئَ عَلَيْهِمُ ٱلْقُرْءَانُ لَا يَسْجُدُونَ",
        "بَلِ ٱلَّذِينَ كَفَرُوا۟ يُكَذِّبُونَ",
        "وَٱللَّهُ أَعْلَمُ بِمَا يُوعُونَ",
        "فَبَشِّرْهُم بِعَذَابٍ أَلِيمٍ",
        "إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ لَهُمْ أَجْرٌ غَيْرُ مَمْنُونٍۭ"
    ],
    "83": [
        "وَيْلٌ لِّلْمُطَفِّفِينَ",
        "ٱلَّذِينَ إِذَا ٱكْتَالُوا۟ عَلَى ٱلنَّاسِ يَسْتَوْفُونَ",
        "وَإِذَا كَالُوهُمْ أَو وَّزَنُوهُمْ يُخْسِرُونَ",
        "أَلَا يَظُنُّ أُو۟لَٰٓئِكَ أَنَّهُم مَّبْعُوثُونَ",
        "لِيَوْمٍ عَظِيمٍ",
        "يَوْمَ يَقُومُ ٱلنَّاسُ لِرَبِّ ٱلْعَٰلَمِينَ",
        "كَلَّآ إِنَّ كِتَٰبَ ٱلْفُجَّارِ لَفِى سِجِّينٍ",
        "وَمَآ أَدْرَىٰكَ مَا سِجِّينٌ",
        "كِتَٰبٌ مَّرْقُومٌ",
        "وَيْلٌ يَوْمَئِذٍ لِّلْمُكَذِّبِينَ",
        "ٱلَّذِينَ يُكَذِّبُونَ بِيَوْمِ ٱلدِّينِ",
        "وَمَا يُكَذِّبُ بِهِۦٓ إِلَّا كُلُّ مُعْتَدٍ أَثِيمٍ",
        "إِذَا تُتْلَىٰ عَلَيْهِ ءَايَٰتُنَا قَالَ أَسَٰطِيرُ ٱلْأَوَّلِينَ",
        "كَلَّا بَلْ رَانَ عَلَىٰ قُلُوبِهِم مَّا كَانُوا۟ يَكْسِبُونَ",
        "كَلَّآ إِنَّهُمْ عَن رَّبِّهِمْ يَوْمَئِذٍ لَّمَحْجُوبُونَ",
        "ثُمَّ إِنَّهُمْ لَصَالُوا۟ ٱلْجَحِيمِ",
        "ثُمَّ يُقَالُ هَٰذَا ٱلَّذِى كُنتُم بِهِۦ تُكَذِّبُونَ",
        "كَلَّآ إِنَّ كِتَٰبَ ٱلْأَبْرَارِ لَفِى عِلِّيِّينَ",
        "وَمَآ أَدْرَىٰكَ مَا عِلِّيُّونَ",
        "كِتَٰبٌ مَّرْقُومٌ",
        "يَشْهَدُهُ ٱلْمُقَرَّبُونَ",
        "إِنَّ ٱلْأَبْرَارَ لَفِى نَعِيمٍ",
        "عَلَى ٱلْأَرَآئِكِ يَنظُرُونَ",
        "تَعْرِفُ فِى وُجُوهِهِمْ نَضْرَةَ ٱلنَّعِيمِ",
        "يُسْقَوْنَ مِن رَّحِيقٍ مَّخْتُومٍ",
        "خِتَٰمُهُۥ مِسْكٌ وَفِى ذَٰلِكَ فَلْيَتَنَافَسِ ٱلْمُتَنَٰفِسُونَ",
        "وَمِزَاجُهُۥ مِن تَسْنِيمٍ",
        "عَيْنًا يَشْرَبُ بِهَا ٱلْمُقَرَّبُونَ",
        "إِنَّ ٱلَّذِينَ أَجْرَمُوا۟ كَانُوا۟ مِنَ ٱلَّذِينَ ءَامَنُوا۟ يَضْحَكُونَ",
        "وَإِذَا مَرُّوا۟ بِهِمْ يَتَغَامَزُونَ",
        "وَإِذَا ٱنقَلَبُوٓا۟ إِلَىٰٓ أَهْلِهِمُ ٱنقَلَبُوا۟ فَكِهِينَ",
        "وَإِذَا رَأَوْهُمْ قَالُوٓا۟ إِنَّ هَٰٓؤُلَآءِ لَضَآلُّونَ",
        "وَمَآ أُرْسِلُوا۟ عَلَيْهِمْ حَٰفِظِينَ",
        "فَٱلْيَوْمَ ٱلَّذِينَ ءَامَنُوا۟ مِنَ ٱلْكُفَّارِ يَضْحَكُونَ",
        "عَلَى ٱلْأَرَآئِكِ يَنظُرُونَ",
        "هَلْ ثُوِّبَ ٱلْكُفَّارُ مَا كَانُوا۟ يَفْعَلُونَ"
    ],
    "82": [
        "إِذَا ٱلسَّمَآءُ ٱنفَطَرَتْ",
        "وَإِذَا ٱلْكَوَاكِبُ ٱنتَثَرَتْ",
        "وَإِذَا ٱلْبِحَارُ فُجِّرَتْ",
        "وَإِذَا ٱلْقُبُورُ بُعْثِرَتْ",
        "عَلِمَتْ نَفْسٌ مَّا قَدَّمَتْ وَأَخَّرَتْ",
        "يَٰٓأَيُّهَا ٱلْإِنسَٰنُ مَا غَرَّكَ بِرَبِّكَ ٱلْكَرِيمِ",
        "ٱلَّذِى خَلَقَكَ فَسَوَّىٰكَ فَعَدَلَكَ",
        "فِىٓ أَىِّ صُورَةٍ مَّا شَآءَ رَكَّبَكَ",
        "كَلَّا بَلْ تُكَذِّبُونَ بِٱلدِّينِ",
        "وَإِنَّ عَلَيْكُمْ لَحَٰفِظِينَ",
        "كِرَامًا كَٰتِبِينَ",
        "يَعْلَمُونَ مَا تَفْعَلُونَ",
        "إِنَّ ٱلْأَبْرَارَ لَفِى نَعِيمٍ",
        "وَإِنَّ ٱلْفُجَّارَ لَفِى جَحِيمٍ",
        "يَصْلَوْنَهَا يَوْمَ ٱلدِّينِ",
        "وَمَا هُمْ عَنْهَا بِغَآئِبِينَ",
        "وَمَآ أَدْرَىٰكَ مَا يَوْمُ ٱلدِّينِ",
        "ثُمَّ مَآ أَدْرَىٰكَ مَا يَوْمُ ٱلدِّينِ",
        "يَوْمَ لَا تَمْلِكُ نَفْسٌ لِّنَفْسٍ شَيْـًٔا وَٱلْأَمْرُ يَوْمَئِذٍ لِّلَّهِ"
    ],
    "81": [
        "إِذَا ٱلشَّمْسُ كُوِّرَتْ",
        "وَإِذَا ٱلنُّجُومُ ٱنكَدَرَتْ",
        "وَإِذَا ٱلْجِبَالُ سُيِّرَتْ",
        "وَإِذَا ٱلْعِشَارُ عُطِّلَتْ",
        "وَإِذَا ٱلْوُحُوشُ حُشِرَتْ",
        "وَإِذَا ٱلْبِحَارُ سُجِّرَتْ",
        "وَإِذَا ٱلنُّفُوسُ زُوِّجَتْ",
        "وَإِذَا ٱلْمَوْءُۥدَةُ سُئِلَتْ",
        "بِأَىِّ ذَنۢبٍ قُتِلَتْ",
        "وَإِذَا ٱلصُّحُفُ نُشِرَتْ",
        "وَإِذَا ٱلسَّمَآءُ كُشِطَتْ",
        "وَإِذَا ٱلْجَحِيمُ سُعِّرَتْ",
        "وَإِذَا ٱلْجَنَّةُ أُزْلِفَتْ",
        "عَلِمَتْ نَفْسٌ مَّآ أَحْضَرَتْ",
        "فَلَآ أُقْسِمُ بِٱلْخُنَّسِ",
        "ٱلْجَوَارِ ٱلْكُنَّسِ",
        "وَٱلَّيْلِ إِذَا عَسْعَسَ",
        "وَٱلصُّبْحِ إِذَا تَنَفَّسَ",
        "إِنَّهُۥ لَقَوْلُ رَسُولٍ كَرِيمٍ",
        "ذِى قُوَّةٍ عِندَ ذِى ٱلْعَرْشِ مَكِينٍ",
        "مُّطَاعٍ ثَمَّ أَمِينٍ",
        "وَمَا صَاحِبُكُم بِمَجْنُونٍ",
        "وَلَقَدْ رَءَاهُ بِٱلْأُفُقِ ٱلْمُبِينِ",
        "وَمَا هُوَ عَلَى ٱلْغَيْبِ بِضَنِينٍ",
        "وَمَا هُوَ بِقَوْلِ شَيْطَٰنٍ رَّجِيمٍ",
        "فَأَيْنَ تَذْهَبُونَ",
        "إِنْ هُوَ إِلَّا ذِكْرٌ لِّلْعَٰلَمِينَ",
        "لِمَن شَآءَ مِنكُمْ أَن يَسْتَقِيمَ",
        "وَمَا تَشَآءُونَ إِلَّآ أَن يَشَآءَ ٱللَّهُ رَبُّ ٱلْعَٰلَمِينَ"
    ],
    "80": [
        "عَبَسَ وَتَوَلَّىٰٓ",
        "أَن جَآءَهُ ٱلْأَعْمَىٰ",
        "وَمَا يُدْرِيكَ لَعَلَّهُۥ يَزَّكَّىٰٓ",
        "أَوْ يَذَّكَّرُ فَتَنفَعَهُ ٱلذِّكْرَىٰٓ",
        "أَمَّا مَنِ ٱسْتَغْنَىٰ",
        "فَأَنتَ لَهُۥ تَصَدَّىٰ",
        "وَمَا عَلَيْكَ أَلَّا يَزَّكَّىٰ",
        "وَأَمَّا مَن جَآءَكَ يَسْعَىٰ",
        "وَهُوَ يَخْشَىٰ",
        "فَأَنتَ عَنْهُ تَلَهَّىٰ",
        "كَلَّآ إِنَّهَا تَذْكِرَةٌ",
        "فَمَن شَآءَ ذَكَرَهُۥ",
        "فِى صُحُفٍ مُّكَرَّمَةٍ",
        "مَّرْفُوعَةٍ مُّطَهَّرَةٍۭ",
        "بِأَيْدِى سَفَرَةٍ",
        "كِرَامٍۭ بَرَرَةٍ",
        "قُتِلَ ٱلْإِنسَٰنُ مَآ أَكْفَرَهُۥ",
        "مِنْ أَىِّ شَىْءٍ خَلَقَهُۥ",
        "مِن نُّطْفَةٍ خَلَقَهُۥ فَقَدَّرَهُۥ",
        "ثُمَّ ٱلسَّبِيلَ يَسَّرَهُۥ",
        "ثُمَّ أَمَاتَهُۥ فَأَقْبَرَهُۥ",
        "ثُمَّ إِذَا شَآءَ أَنشَرَهُۥ",
        "كَلَّا لَمَّا يَقْضِ مَآ أَمَرَهُۥ",
        "فَلْيَنظُرِ ٱلْإِنسَٰنُ إِلَىٰ طَعَامِهِۦٓ",
        "أَنَّا صَبَبْنَا ٱلْمَآءَ صَبًّا",
        "ثُمَّ شَقَقْنَا ٱلْأَرْضَ شَقًّا",
        "فَأَنۢبَتْنَا فِيهَا حَبًّا",
        "وَعِنَبًا وَقَضْبًا",
        "وَزَيْتُونًا وَنَخْلًا",
        "وَحَدَآئِقَ غُلْبًا",
        "وَفَٰكِهَةً وَأَبًّا",
        "مَّتَٰعًا لَّكُمْ وَلِأَنْعَٰمِكُمْ",
        "فَإِذَا جَآءَتِ ٱلصَّآخَّةُ",
        "يَوْمَ يَفِرُّ ٱلْمَرْءُ مِنْ أَخِيهِ",
        "وَأُمِّهِۦ وَأَبِيهِ",
        "وَصَٰحِبَتِهِۦ وَبَنِيهِ",
        "لِكُلِّ ٱمْرِئٍ مِّنْهُمْ يَوْمَئِذٍ شَأْنٌ يُغْنِيهِ",
        "وُجُوهٌ يَوْمَئِذٍ مُّسْفِرَةٌ",
        "ضَاحِكَةٌ مُّسْتَبْشِرَةٌ",
        "وَوُجُوهٌ يَوْمَئِذٍ عَلَيْهَا غَبَرَةٌ",
        "تَرْهَقُهَا قَتَرَةٌ",
        "أُو۟لَٰٓئِكَ هُمُ ٱلْكَفَرَةُ ٱلْفَجَرَةُ"
    ],
    "79": [
        "وَٱلنَّٰزِعَٰتِ غَرْقًا",
        "وَٱلنَّٰشِطَٰتِ نَشْطًا",
        "وَٱلسَّٰبِحَٰتِ سَبْحًا",
        "فَٱلسَّٰبِقَٰتِ سَبْقًا",
        "فَٱلْمُدَبِّرَٰتِ أَمْرًا",
        "يَوْمَ تَرْجُفُ ٱلرَّاجِفَةُ",
        "تَتْبَعُهَا ٱلرَّادِفَةُ",
        "قُلُوبٌ يَوْمَئِذٍ وَاجِفَةٌ",
        "أَبْصَٰرُهَا خَٰشِعَةٌ",
        "يَقُولُونَ أَءِنَّا لَمَرْدُودُونَ فِى ٱلْحَافِرَةِ",
        "أَءِذَا كُنَّا عِظَٰمًا نَّخِرَةً",
        "قَالُوا۟ تِلْكَ إِذًا كَرَّةٌ خَاسِرَةٌ",
        "فَإِنَّمَا هِىَ زَجْرَةٌ وَٰحِدَةٌ",
        "فَإِذَا هُم بِٱلسَّاهِرَةِ",
        "هَلْ أَتَىٰكَ حَدِيثُ مُوسَىٰٓ",
        "إِذْ نَادَىٰهُ رَبُّهُۥ بِٱلْوَادِ ٱلْمُقَدَّسِ طُوًى",
        "ٱذْهَبْ إِلَىٰ فِرْعَوْنَ إِنَّهُۥ طَغَىٰ",
        "فَقُلْ هَل لَّكَ إِلَىٰٓ أَن تَزَكَّىٰ",
        "وَأَهْدِيَكَ إِلَىٰ رَبِّكَ فَتَخْشَىٰ",
        "فَأَرَىٰهُ ٱلْـَٔايَةَ ٱلْكُبْرَىٰ",
        "فَكَذَّبَ وَعَصَىٰ",
        "ثُمَّ أَدْبَرَ يَسْعَىٰ",
        "فَحَشَرَ فَنَادَىٰ",
        "فَقَالَ أَنَا۠ رَبُّكُمُ ٱلْأَعْلَىٰ",
        "فَأَخَذَهُ ٱللَّهُ نَكَالَ ٱلْـَٔاخِرَةِ وَٱلْأُولَىٰٓ",
        "إِنَّ فِى ذَٰلِكَ لَعِبْرَةً لِّمَن يَخْشَىٰٓ",
        "ءَأَنتُمْ أَشَدُّ خَلْقًا أَمِ ٱلسَّمَآءُ بَنَىٰهَا",
        "رَفَعَ سَمْكَهَا فَسَوَّىٰهَا",
        "وَأَغْطَشَ لَيْلَهَا وَأَخْرَجَ ضُحَىٰهَا",
        "وَٱلْأَرْضَ بَعْدَ ذَٰلِكَ دَحَىٰهَآ",
        "أَخْرَجَ مِنْهَا مَآءَهَا وَمَرْعَىٰهَا",
        "وَٱلْجِبَالَ أَرْسَىٰهَا",
        "مَتَٰعًا لَّكُمْ وَلِأَنْعَٰمِكُمْ",
        "فَإِذَا جَآءَتِ ٱلطَّآمَّةُ ٱلْكُبْرَىٰ",
        "يَوْمَ يَتَذَكَّرُ ٱلْإِنسَٰنُ مَا سَعَىٰ",
        "وَبُرِّزَتِ ٱلْجَحِيمُ لِمَن يَرَىٰ",
        "فَأَمَّا مَن طَغَىٰ",
        "وَءَاثَرَ ٱلْحَيَوٰةَ ٱلدُّنْيَا",
        "فَإِنَّ ٱلْجَحِيمَ هِىَ ٱلْمَأْوَىٰ",
        "وَأَمَّا مَنْ خَافَ مَقَامَ رَبِّهِۦ وَنَهَى ٱلنَّفْسَ عَنِ ٱلْهَوَىٰ",
        "فَإِنَّ ٱلْجَنَّةَ هِىَ ٱلْمَأْوَىٰ",
        "يَسْـَٔلُونَكَ عَنِ ٱلسَّاعَةِ أَيَّانَ مُرْسَىٰهَا",
        "فِيمَ أَنتَ مِن ذِكْرَىٰهَآ",
        "إِلَىٰ رَبِّكَ مُنتَهَىٰهَآ",
        "إِنَّمَآ أَنتَ مُنذِرُ مَن يَخْشَىٰهَا",
        "كَأَنَّهُمْ يَوْمَ يَرَوْنَهَا لَمْ يَلْبَثُوٓا۟ إِلَّا عَشِيَّةً أَوْ ضُحَىٰهَا"
    ],
    "78": [
        "عَمَّ يَتَسَآءَلُونَ",
        "عَنِ ٱلنَّبَإِ ٱلْعَظِيمِ",
        "ٱلَّذِى هُمْ فِيهِ مُخْتَلِفُونَ",
        "كَلَّا سَيَعْلَمُونَ",
        "ثُمَّ كَلَّا سَيَعْلَمُونَ",
        "أَلَمْ نَجْعَلِ ٱلْأَرْضَ مِهَٰدًا",
        "وَٱلْجِبَالَ أَوْتَادًا",
        "وَخَلَقْنَٰكُمْ أَزْوَٰجًا",
        "وَجَعَلْنَا نَوْمَكُمْ سُبَاتًا",
        "وَجَعَلْنَا ٱلَّيْلَ لِبَاسًا",
        "وَجَعَلْنَا ٱلنَّهَارَ مَعَاشًا",
        "وَبَنَيْنَا فَوْقَكُمْ سَبْعًا شِدَادًا",
        "وَجَعَلْنَا سِرَاجًا وَهَّاجًا",
        "وَأَنزَلْنَا مِنَ ٱلْمُعْصِرَٰتِ مَآءً ثَجَّاجًا",
        "لِّنُخْرِجَ بِهِۦ حَبًّا وَنَبَاتًا",
        "وَجَنَّٰتٍ أَلْفَافًا",
        "إِنَّ يَوْمَ ٱلْفَصْلِ كَانَ مِيقَٰتًا",
        "يَوْمَ يُنفَخُ فِى ٱلصُّورِ فَتَأْتُونَ أَفْوَاجًا",
        "وَفُتِحَتِ ٱلسَّمَآءُ فَكَانَتْ أَبْوَٰبًا",
        "وَسُيِّرَتِ ٱلْجِبَالُ فَكَانَتْ سَرَابًا",
        "إِنَّ جَهَنَّمَ كَانَتْ مِرْصَادًا",
        "لِّلطَّٰغِينَ مَـَٔابًا",
        "لَّٰبِثِينَ فِيهَآ أَحْقَابًا",
        "لَّا يَذُوقُونَ فِيهَا بَرْدًا وَلَا شَرَابًا",
        "إِلَّا حَمِيمًا وَغَسَّاقًا",
        "جَزَآءً وِفَاقًا",
        "إِنَّهُمْ كَانُوا۟ لَا يَرْجُونَ حِسَابًا",
        "وَكَذَّبُوا۟ بِـَٔايَٰتِنَا كِذَّابًا",
        "وَكُلَّ شَىْءٍ أَحْصَيْنَٰهُ كِتَٰبًا",
        "فَذُوقُوا۟ فَلَن نَّزِيدَكُمْ إِلَّا عَذَابًا",
        "إِنَّ لِلْمُتَّقِينَ مَفَازًا",
        "حَدَآئِقَ وَأَعْنَٰبًا",
        "وَكَوَاعِبَ أَتْرَابًا",
        "وَكَأْسًا دِهَاقًا",
        "لَّا يَسْمَعُونَ فِيهَا لَغْوًا وَلَا كِذَّٰبًا",
        "جَزَآءً مِّن رَّبِّكَ عَطَآءً حِسَابًا",
        "رَّبِّ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضِ وَمَا بَيْنَهُمَا ٱلرَّحْمَٰنِ لَا يَمْلِكُونَ مِنْهُ خِطَابًا",
        "يَوْمَ يَقُومُ ٱلرُّوحُ وَٱلْمَلَٰٓئِكَةُ صَفًّا لَّا يَتَكَلَّمُونَ إِلَّا مَنْ أَذِنَ لَهُ ٱلرَّحْمَٰنُ وَقَالَ صَوَابًا",
        "ذَٰلِكَ ٱلْيَوْمُ ٱلْحَقُّ فَمَن شَآءَ ٱتَّخَذَ إِلَىٰ رَبِّهِۦ مَـَٔابًا",
        "إِنَّآ أَنذَرْنَٰكُمْ عَذَابًا قَرِيبًا يَوْمَ يَنظُرُ ٱلْمَرْءُ مَا قَدَّمَتْ يَدَاهُ وَيَقُولُ ٱلْكَافِرُ يَٰلَيْتَنِى كُنتُ تُرَٰبًۢا"
    ],
};
/* =========================================================
   ✨ ثابت البسملة — منفصل تمامًا عن مصفوفة آيات أي سورة،
   ولا يدخل في ترقيم الآيات إطلاقًا (يُستخدم نصًا لكل السور،
   وصوته يُعاد استخدام ملف الفاتحة الآية الأولى الموجود أصلًا
   في نفس مصدر الصوت الحالي — لا ملف صوتي جديد يُضاف)
========================================================= */

const QURAN_BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";


/* =========================================================
📖 متغيرات القرآن
========================================================= */

let currentSurahIndex = 0;
let currentQuranAyah = 0;
let quranPlayingAll = false;
let quranViewMode = "list";


/* =========================================================
🔗 رابط صوت الآية (بلا أي تغيير عن السابق)
========================================================= */

function getQuranAyahUrl(surahFile, ayahNumber) {

    const surah =
        String(surahFile).padStart(3, "0");

    const ayah =
        String(ayahNumber).padStart(3, "0");

    return (
        "https://everyayah.com/data/" +
        "Husary_128kbps/" +
        surah +
        ayah +
        ".mp3"
    );
}


/* =========================================================
   🆕 تمييز بصري هادئ للعنصر الجاري تشغيله (بسملة/آية) — يُضاف
   عند بدء التشغيل ويُزال تلقائيًا عند الانتهاء أو التوقف أو
   الانتقال لعنصر آخر
========================================================= */

function quranClearPlayingHighlight() {

    document
        .querySelectorAll(".quran-ayah.playing, .quran-bismillah-button.playing")
        .forEach(el => el.classList.remove("playing"));
}

function quranSetPlayingHighlight(key) {

    quranClearPlayingHighlight();

    if (key === null || key === undefined) return;

    const el = key === "bismillah"
        ? $("quranBismillahBtn")
        : document.querySelector(`.quran-ayah[data-ayah="${key}"]`);

    if (el) el.classList.add("playing");
}


/* =========================================================
   🆕 زر الإيقاف — يظهر فقط أثناء التشغيل الفعلي
========================================================= */

function quranShowStopButton() {
    const btn = $("quranStopBtn");
    if (btn) btn.style.display = "inline-block";
}

function quranHideStopButton() {
    const btn = $("quranStopBtn");
    if (btn) btn.style.display = "none";
}

function stopQuranPlayback() {

    stopAllAudio();

    quranPlayingAll = false;

    quranClearPlayingHighlight();
    quranHideStopButton();
    clearQuranError();
}


/* =========================================================
   🏠 شبكة اختيار السورة (٣٧ سورة — جزء عمّ)
========================================================= */

function renderQuranSurahGrid() {

    const grid = $("quranSurahGrid");
    if (!grid) return;

    grid.innerHTML = "";

    quranSurahs.forEach((surah, index) => {

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quran-surah-card";
        btn.textContent = "سورة " + surah.name;

        btn.addEventListener("click", () => {
            openQuranSurah(index);
        });

        grid.appendChild(btn);
    });
}

function showQuranSurahList() {

    stopAllAudio();
    quranPlayingAll = false;
    quranViewMode = "list";

    const listView = $("quranSurahListView");
    const detailView = $("quranSurahDetailView");

    if (listView) listView.style.display = "block";
    if (detailView) detailView.style.display = "none";
}

function openQuranSurah(index) {

    if (index < 0 || index >= quranSurahs.length) return;

    quranViewMode = "detail";

    /* 🆕 حفظ بسيط لآخر سورة (معزول تمامًا، بلا أي تغيير في البنية
       أو السلوك الحالي — للاستخدام المستقبلي فقط إن احتجناه) */
    try {
        localStorage.setItem("taha_quran_last_surah_index", String(index));
    } catch (error) {}

    /* nextSurah() هنا تُستخدَم بمعناها المطوَّر (فتح سورة محدَّدة
       بدل الدوران التسلسلي القديم) — نفس الدالة التي يعتمد عليها
       سجل الأحداث الحالي فتستمر إشارته للمعلم تعمل تلقائيًا */
    nextSurah(index);

    const listView = $("quranSurahListView");
    const detailView = $("quranSurahDetailView");

    if (listView) listView.style.display = "none";
    if (detailView) detailView.style.display = "block";
}


/* =========================================================
🧭 التالي/فتح سورة محدَّدة (طُوِّرت: تقبل فهرسًا محددًا اختياريًا
مع الحفاظ الكامل على سلوكها القديم عند عدم تمرير شيء)
========================================================= */

function nextSurah(targetIndex) {

    stopAllAudio();

    quranPlayingAll = false;
    currentQuranAyah = 0;

    if (typeof targetIndex === "number") {

        currentSurahIndex = targetIndex;

    } else {

        currentSurahIndex++;

        if (currentSurahIndex >= quranSurahs.length) {
            currentSurahIndex = 0;
        }
    }

    renderSurah();
}


/* =========================================================
📖 عرض تفاصيل السورة (طُوِّرت: بسملة مستقلة + سمة data-ayah لكل
آية لدعم التمييز البصري + زر تشغيل كامل مميَّز بصريًا)
========================================================= */

function renderSurah() {

    const surah =
        quranSurahs[currentSurahIndex];

    if (!surah) return;

    const ayahs =
        quranAyahs[String(surah.id)] || [];

    if ($("surahName")) {
        $("surahName").textContent = "سورة " + surah.name;
    }

    quranClearPlayingHighlight();
    quranHideStopButton();
    clearQuranError();

    const container = $("surahAyahs");
    if (!container) return;

    container.innerHTML = "";

    ayahs.forEach((ayah, index) => {

        const ayahNumber = index + 1;

        const ayahBox = document.createElement("div");
        ayahBox.className = "quran-ayah";
        ayahBox.dataset.ayah = String(ayahNumber);

        const text = document.createElement("div");
        text.className = "quran-ayah-text";
        text.textContent = ayah;

        const button = document.createElement("button");
        button.className = "primary quran-ayah-button";
        button.type = "button";
        button.textContent = `🔊 الآية ${arabicNumber(ayahNumber)}`;

        button.addEventListener("click", function () {
            speakQuranAyah(ayahNumber);
        });

        ayahBox.appendChild(text);
        ayahBox.appendChild(button);

        container.appendChild(ayahBox);
    });
}


/* =========================================================
🔊 إظهار رسالة خطأ للقرآن (بلا أي تغيير)
========================================================= */

function showQuranError(message) {

    let errorBox =
        $("quranAudioMessage");

    if (!errorBox) {

        errorBox =
            document.createElement("div");

        errorBox.id =
            "quranAudioMessage";

        errorBox.style.cssText = `
            margin:15px auto;
            padding:12px 15px;
            border-radius:14px;
            background:#fff3cd;
            color:#664d03;
            font-weight:bold;
            text-align:center;
            max-width:700px;
        `;

        const container =
            $("surahAyahs");

        if (container && container.parentNode) {

            container.parentNode.insertBefore(
                errorBox,
                container
            );
        }
    }

    errorBox.textContent =
        message;

    clearTimeout(
        showQuranError.timer
    );

    showQuranError.timer =
        setTimeout(
            () => {

                if (errorBox) {
                    errorBox.textContent = "";
                }

            },
            5000
        );
}


/* =========================================================
🧹 إزالة رسالة الخطأ (بلا أي تغيير)
========================================================= */

function clearQuranError() {

    const errorBox =
        $("quranAudioMessage");

    if (errorBox) {
        errorBox.textContent = "";
    }
}


/* =========================================================
   🆕 تشغيل البسملة وحدها — تُعيد استخدام ملف صوت الفاتحة (الآية
   الأولى) الموجود أصلًا في نفس مصدر الصوت الحالي (البسملة نفسها
   بالضبط عند أي قارئ)، بلا أي ملف صوتي جديد
========================================================= */

function speakBismillah() {

    stopAllAudio();

    quranPlayingAll = false;

    const session = quranSessionToken;

    clearQuranError();

    const url = getQuranAyahUrl("001", 1);

    const audio = new Audio();
    currentQuranAudio = audio;

    audio.preload = "auto";
    audio.src = url;

    quranSetPlayingHighlight("bismillah");
    quranShowStopButton();

    audio.addEventListener("ended", () => {

        if (session !== quranSessionToken) return;

        currentQuranAudio = null;
        quranClearPlayingHighlight();
        quranHideStopButton();

    }, { once: true });

    audio.addEventListener("error", () => {

        if (session !== quranSessionToken) return;

        currentQuranAudio = null;
        quranClearPlayingHighlight();
        quranHideStopButton();

        console.error("Quran Bismillah audio error:", url, audio.error);

        showQuranError("⚠️ تعذر تشغيل صوت البسملة. تأكد من اتصال الإنترنت ثم حاول مرة أخرى.");

    }, { once: true });

    const playPromise = audio.play();

    if (playPromise && typeof playPromise.catch === "function") {

        playPromise.catch(error => {

            if (session !== quranSessionToken) return;

            currentQuranAudio = null;
            quranClearPlayingHighlight();
            quranHideStopButton();

            console.error("Quran Bismillah play() failed:", error);

            showQuranError("⚠️ المتصفح منع تشغيل الصوت أو تعذر تحميله. اضغط الزر مرة أخرى.");
        });
    }
}


/* =========================================================
🔊 تشغيل آية واحدة فقط (طُوِّرت: تمييز بصري + زر إيقاف، بلا أي
تغيير في مصدر الصوت أو طريقة التشغيل الأساسية)
========================================================= */

function speakQuranAyah(ayahNumber) {

    /*
     * أوقف أي صوت سابق — هذا وحده يكفي لمقاطعة أي تشغيل متسلسل
     * جارٍ فورًا (السورة كاملة)، لأن quranPlayingAll تُصبح false
     * أدناه فتتوقف حلقة playNextQuranAyah عن نفسها تلقائيًا
     */
    stopAllAudio();

    quranPlayingAll = false;

    const session =
        quranSessionToken;

    const surah =
        quranSurahs[currentSurahIndex];

    if (!surah) return;

    const ayahs =
        quranAyahs[String(surah.id)] || [];

    if (
        ayahNumber < 1 ||
        ayahNumber > ayahs.length
    ) {
        return;
    }

    currentQuranAyah =
        ayahNumber;

    clearQuranError();

    const url =
        getQuranAyahUrl(
            surah.id,
            ayahNumber
        );

    const audio =
        new Audio();

    currentQuranAudio =
        audio;

    audio.preload =
        "auto";

    audio.src =
        url;

    quranSetPlayingHighlight(ayahNumber);
    quranShowStopButton();

    audio.addEventListener(
        "ended",
        () => {

            if (
                session !==
                quranSessionToken
            ) {
                return;
            }

            currentQuranAudio =
                null;

            quranClearPlayingHighlight();
            quranHideStopButton();

        },
        {
            once: true
        }
    );

    audio.addEventListener(
        "error",
        () => {

            if (
                session !==
                quranSessionToken
            ) {
                return;
            }

            currentQuranAudio =
                null;

            quranClearPlayingHighlight();
            quranHideStopButton();

            console.error(
                "Quran audio error:",
                url,
                audio.error
            );

            showQuranError(
                "⚠️ تعذر تشغيل صوت الآية. تأكد من اتصال الإنترنت ثم حاول مرة أخرى."
            );

        },
        {
            once: true
        }
    );

    const playPromise =
        audio.play();

    if (
        playPromise &&
        typeof playPromise.catch === "function"
    ) {

        playPromise.catch(
            error => {

                if (
                    session !==
                    quranSessionToken
                ) {
                    return;
                }

                currentQuranAudio =
                    null;

                quranClearPlayingHighlight();
                quranHideStopButton();

                console.error(
                    "Quran play() failed:",
                    error
                );

                showQuranError(
                    "⚠️ المتصفح منع تشغيل الصوت أو تعذر تحميله. اضغط زر الآية مرة أخرى."
                );
            }
        );
    }
}


/* =========================================================
🔊 تشغيل السورة كاملة (طُوِّرت: البسملة أولًا ثم الآيات بالترتيب
+ تمييز بصري لكل عنصر أثناء دوره + زر إيقاف، بلا أي تغيير في
مصدر الصوت أو آلية الجلسة الحالية)
========================================================= */

function speakSurah() {

    stopAllAudio();

    const session =
        quranSessionToken;

    const surah =
        quranSurahs[currentSurahIndex];

    if (!surah) return;

    const ayahs =
        quranAyahs[String(surah.id)] || [];

    if (!ayahs.length) return;

    clearQuranError();

    quranPlayingAll =
        true;

    /* 🆕 نبدأ من "البسملة" (تُمثَّل بالقيمة 0)، ثم الآية ١ فصاعدًا */
    currentQuranAyah =
        0;

    quranShowStopButton();


    function playNextQuranStep() {

        if (
            session !==
            quranSessionToken
        ) {
            return;
        }

        if (!quranPlayingAll) {
            return;
        }

        /* ---- الخطوة صفر: البسملة ---- */
        if (currentQuranAyah === 0) {

            quranSetPlayingHighlight("bismillah");

            const url = getQuranAyahUrl("001", 1);

            const audio = new Audio();
            currentQuranAudio = audio;
            audio.preload = "auto";
            audio.src = url;

            audio.addEventListener("ended", () => {

                if (session !== quranSessionToken) return;
                if (!quranPlayingAll) return;

                currentQuranAyah = 1;
                playNextQuranStep();

            }, { once: true });

            audio.addEventListener("error", () => {

                if (session !== quranSessionToken) return;

                quranPlayingAll = false;
                currentQuranAudio = null;
                quranClearPlayingHighlight();
                quranHideStopButton();

                console.error("Quran full-surah Bismillah error:", url, audio.error);
                showQuranError("⚠️ حدث خطأ أثناء تحميل البسملة.");

            }, { once: true });

            const playPromise = audio.play();

            if (playPromise && typeof playPromise.catch === "function") {

                playPromise.catch(error => {

                    if (session !== quranSessionToken) return;

                    quranPlayingAll = false;
                    currentQuranAudio = null;
                    quranClearPlayingHighlight();
                    quranHideStopButton();

                    console.error("Quran full play (bismillah) failed:", error);
                    showQuranError("⚠️ تعذر تشغيل السورة. اضغط زر الاستماع مرة أخرى.");
                });
            }

            return;
        }

        /* ---- انتهت كل الآيات ---- */
        if (
            currentQuranAyah >
            ayahs.length
        ) {

            quranPlayingAll =
                false;

            currentQuranAudio =
                null;

            quranClearPlayingHighlight();
            quranHideStopButton();

            return;
        }

        /* ---- آية عادية ---- */
        quranSetPlayingHighlight(currentQuranAyah);

        const url =
            getQuranAyahUrl(
                surah.id,
                currentQuranAyah
            );

        const audio =
            new Audio();

        currentQuranAudio =
            audio;

        audio.preload =
            "auto";

        audio.src =
            url;

        audio.addEventListener(
            "ended",
            () => {

                if (
                    session !==
                    quranSessionToken
                ) {
                    return;
                }

                if (!quranPlayingAll) {
                    return;
                }

                currentQuranAyah++;

                playNextQuranStep();

            },
            {
                once: true
            }
        );

        audio.addEventListener(
            "error",
            () => {

                if (
                    session !==
                    quranSessionToken
                ) {
                    return;
                }

                quranPlayingAll =
                    false;

                currentQuranAudio =
                    null;

                quranClearPlayingHighlight();
                quranHideStopButton();

                console.error(
                    "Quran full-surah error:",
                    url,
                    audio.error
                );

                showQuranError(
                    "⚠️ حدث خطأ أثناء تحميل تلاوة السورة."
                );

            },
            {
                once: true
            }
        );

        const playPromise =
            audio.play();

        if (
            playPromise &&
            typeof playPromise.catch === "function"
        ) {

            playPromise.catch(
                error => {

                    if (
                        session !==
                        quranSessionToken
                    ) {
                        return;
                    }

                    quranPlayingAll =
                        false;

                    currentQuranAudio =
                        null;

                    quranClearPlayingHighlight();
                    quranHideStopButton();

                    console.error(
                        "Quran full play failed:",
                        error
                    );

                    showQuranError(
                        "⚠️ تعذر تشغيل السورة. اضغط زر الاستماع مرة أخرى."
                    );
                }
            );
        }
    }


    playNextQuranStep();
}
/* =========================================================
📜 الحديث الشريف
========================================================= */

const hadiths = [

    {
        title: "الحديث الأول",
        text:
            "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى.",
        meaning:
            "الأعمال تكون بحسب نية الإنسان وقصده."
    },

    {
        title: "الحديث الثاني",
        text:
            "من لا يرحم لا يُرحم.",
        meaning:
            "علينا أن نرحم الناس ونحسن معاملتهم."
    },

    {
        title: "الحديث الثالث",
        text:
            "تبسمك في وجه أخيك لك صدقة.",
        meaning:
            "الابتسامة الجميلة صدقة."
    },

    {
        title: "الحديث الرابع",
        text:
            "المسلم من سلم المسلمون من لسانه ويده.",
        meaning:
            "المسلم لا يؤذي الآخرين بكلامه أو أفعاله."
    },

    {
        title: "الحديث الخامس",
        text:
            "خيركم من تعلم القرآن وعلمه.",
        meaning:
            "من أفضل الناس من يتعلم القرآن ويعلمه لغيره."
    }

];

let currentHadithIndex = 0;

function renderHadith() {

    const hadith =
        hadiths[currentHadithIndex];

    if ($("hadithTitle")) {
        $("hadithTitle").textContent =
            hadith.title;
    }

    if ($("hadithText")) {
        $("hadithText").textContent =
            hadith.text;
    }

    if ($("hadithMeaning")) {
        $("hadithMeaning").textContent =
            hadith.meaning;
    }
}

function speakHadith() {

    speakEducational(
        hadiths[currentHadithIndex].text,
        {
            rate: 0.72
        }
    );
}

/* شرح الحديث الحالي: تسجيل مخصص لجملة المعنى المعروضة تحت الحديث نفسه */
function speakHadithMeaning() {

    speakEducational(
        hadiths[currentHadithIndex].meaning,
        {
            rate: 0.72
        }
    );
}

function playHadithAudio() {
    speakHadith();
}

function nextHadith() {

    stopAllAudio();

    currentHadithIndex++;

    if (
        currentHadithIndex >=
        hadiths.length
    ) {
        currentHadithIndex = 0;
    }

    renderHadith();
}

/* =========================================================
🤲 الأدعية والأذكار
🎙️ تسجيلات صوتية حقيقية من الدرر السنية
========================================================= */

const duaCategories = [

    {
        id: "prophetic",
        title: "أدعية النبي الجامعة",
        icon: "🤲",
        audio: "https://media.dorar.net/1776313661.mp3"
    },

    {
        id: "quran",
        title: "أدعية القرآن",
        icon: "📖",
        audio: "https://media.dorar.net/1777706926.mp3"
    },

    {
        id: "sunnah",
        title: "من هدي النبي",
        icon: "🌿",
        audio: "https://media.dorar.net/1776314152.mp3"
    },

    {
        id: "protection",
        title: "أمور كان يتعوذ منها النبي",
        icon: "🛡️",
        audio: "https://media.dorar.net/1776314096.mp3"
    },

    {
        id: "morning-evening",
        title: "أذكار الصباح والمساء",
        icon: "🌅",
        audio: "https://media.dorar.net/1776314209.mp3"
    },

    {
        id: "prayer",
        title: "أدعية الصلاة",
        icon: "🕌",
        audio: "https://media.dorar.net/1776314182.mp3"
    },

    {
        id: "dreams-wakeup",
        title: "أدعية الأحلام والاستيقاظ من النوم",
        icon: "🌙",
        audio: "https://media.dorar.net/1776314265.mp3"
    },

    {
        id: "sleep",
        title: "أذكار النوم",
        icon: "😴",
        audio: "https://media.dorar.net/1776314241.mp3"
    },

    {
        id: "sick",
        title: "أدعية المريض",
        icon: "🤲",
        audio: "https://media.dorar.net/1776314313.mp3"
    },

    {
        id: "travel",
        title: "أدعية السفر",
        icon: "✈️",
        audio: "https://media.dorar.net/1776314288.mp3"
    }

];


/* =========================================================
📜 الأدعية الموجودة في التطبيق
📌 محفوظة كما هي حتى لا نفقد أي محتوى سابق
========================================================= */

const generalDuas = [

    {
        title: "دعاء الاستفتاح",
        text:
            "اللهم باعد بيني وبين خطاياي كما باعدت بين المشرق والمغرب."
    },

    {
        title: "دعاء الوالدين",
        text:
            "رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا."
    },

    {
        title: "دعاء العلم",
        text:
            "رَبِّ زِدْنِي عِلْمًا."
    },

    {
        title: "دعاء الهداية",
        text:
            "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ."
    },

    {
        title: "دعاء الخير",
        text:
            "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ."
    },

    {
        title: "دعاء المغفرة",
        text:
            "رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَكَفِّرْ عَنَّا سَيِّئَاتِنَا."
    },

    {
        title: "دعاء التوفيق",
        text:
            "اللهم وفقني لما تحب وترضى."
    },

    {
        title: "دعاء الحفظ",
        text:
            "اللهم احفظني وأهلي ومن أحب."
    },

    {
        title: "دعاء الصحة",
        text:
            "اللهم إني أسألك العفو والعافية."
    },

    {
        title: "دعاء قبل الطعام",
        text:
            "بسم الله."
    },

    {
        title: "دعاء بعد الطعام",
        text:
            "الحمد لله الذي أطعمني هذا ورزقنيه من غير حول مني ولا قوة."
    },

    {
        title: "دعاء دخول المنزل",
        text:
            "بسم الله ولجنا، وبسم الله خرجنا، وعلى ربنا توكلنا."
    },

    {
        title: "دعاء الخروج من المنزل",
        text:
            "بسم الله، توكلت على الله، ولا حول ولا قوة إلا بالله."
    },

    {
        title: "دعاء النوم",
        text:
            "باسمك اللهم أموت وأحيا."
    },

    {
        title: "دعاء الاستيقاظ",
        text:
            "الحمد لله الذي أحيانا بعدما أماتنا وإليه النشور."
    }

];


const morningAdhkar = [

    {
        title: "أصبحنا وأصبح الملك لله",
        text:
            "أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير."
    },

    {
        title: "اللهم بك أصبحنا",
        text:
            "اللهم بك أصبحنا وبك أمسينا، وبك نحيا وبك نموت وإليك النشور."
    },

    {
        title: "رضيت بالله ربًا",
        text:
            "رضيت بالله ربًا، وبالإسلام دينًا، وبمحمد صلى الله عليه وسلم نبيًا."
    },

    {
        title: "بسم الله الذي لا يضر",
        text:
            "بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم."
    },

    {
        title: "حسبي الله",
        text:
            "حسبي الله لا إله إلا هو، عليه توكلت وهو رب العرش العظيم."
    },

    {
        title: "سيد الاستغفار",
        text:
            "اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي وأبوء بذنبي فاغفر لي، فإنه لا يغفر الذنوب إلا أنت."
    }

];


const eveningAdhkar = [

    {
        title: "أمسينا وأمسى الملك لله",
        text:
            "أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير."
    },

    {
        title: "اللهم بك أمسينا",
        text:
            "اللهم بك أمسينا وبك أصبحنا، وبك نحيا وبك نموت وإليك المصير."
    },

    {
        title: "رضيت بالله ربًا",
        text:
            "رضيت بالله ربًا، وبالإسلام دينًا، وبمحمد صلى الله عليه وسلم نبيًا."
    },

    {
        title: "بسم الله الذي لا يضر",
        text:
            "بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم."
    }

];


/* =========================================================
🔧 متغيرات الأدعية
========================================================= */

let duaCategory = "prophetic";
let currentDuaIndex = 0;
let currentDuaAudio = null;


/* =========================================================
📚 الحصول على القسم الحالي
========================================================= */

function getCurrentDuaCategory() {

    return (
        duaCategories.find(
            category =>
                category.id === duaCategory
        ) ||
        duaCategories[0]
    );
}


/* =========================================================
🛑 إيقاف تسجيل الدعاء الحالي
========================================================= */

function stopDuaAudio() {

    if (currentDuaAudio) {

        try {
            currentDuaAudio.pause();
            currentDuaAudio.currentTime = 0;
            currentDuaAudio.src = "";
        } catch (error) {}

        currentDuaAudio = null;
    }

    /*
     * إيقاف أي صوت آخر يديره AudioManager
     */
    if (
        typeof AudioManager !== "undefined" &&
        AudioManager &&
        typeof AudioManager.stop === "function"
    ) {
        try {
            AudioManager.stop();
        } catch (error) {}
    }
}


/* =========================================================
🎨 تنسيق قسم الأدعية
========================================================= */

function addDuaStyles() {

    if ($("duaStyles")) return;

    const style =
        document.createElement("style");

    style.id =
        "duaStyles";

    style.textContent = `

        .dua-categories {
            display: grid;
            grid-template-columns:
                repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            margin: 20px auto;
            max-width: 900px;
        }

        .dua-category-button {
            border: 0;
            border-radius: 18px;
            padding: 15px 10px;
            background: #f1f5f9;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: .2s;
            min-height: 75px;
            font-family: inherit;
        }

        .dua-category-button:hover {
            transform: translateY(-2px);
        }

        .dua-category-button:active {
            transform: scale(.97);
        }

        .dua-category-button.active {
            background: #dbeafe;
            box-shadow:
                0 4px 12px rgba(0,0,0,.12);
        }

        .dua-audio-card {
            margin: 20px auto;
            padding: 22px;
            max-width: 700px;
            border-radius: 22px;
            background: rgba(255,255,255,.95);
            box-shadow:
                0 8px 25px rgba(0,0,0,.10);
            text-align: center;
        }

        .dua-audio-icon {
            font-size: 55px;
            margin-bottom: 10px;
        }

        .dua-audio-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 15px;
        }

        .dua-audio-description {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 18px;
            opacity: .85;
        }

        .dua-audio-button {
            border: 0;
            border-radius: 18px;
            padding: 14px 25px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            font-family: inherit;
            min-width: 220px;
        }

        .dua-audio-button:disabled {
            opacity: .75;
            cursor: wait;
        }

        .dua-audio-message {
            min-height: 25px;
            margin-top: 12px;
            font-weight: bold;
            line-height: 1.6;
        }

        .dua-next-button {
            margin-top: 15px;
        }

        @media (max-width: 600px) {

            .dua-categories {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
                gap: 8px;
            }

            .dua-category-button {
                font-size: 14px;
                min-height: 70px;
                padding: 12px 6px;
            }

            .dua-audio-card {
                padding: 18px 12px;
            }

            .dua-audio-title {
                font-size: 20px;
            }

            .dua-audio-button {
                width: 100%;
            }
        }

    `;

    document.head.appendChild(style);
}


/* =========================================================
📖 عرض قسم الأدعية
========================================================= */

function renderDua() {

    addDuaStyles();

    const category =
        getCurrentDuaCategory();

    if (!category) return;

    currentDuaIndex = 0;

    const title =
        $("duaTitle");

    const text =
        $("duaText");

    if (title) {

        title.textContent =
            category.title;
    }

    if (text) {

        text.textContent =
            "اضغط على زر الاستماع لسماع التسجيل الصوتي الكامل لهذا القسم.";
    }

    createDuaControls();
}


/* =========================================================
🎛️ إنشاء أزرار أقسام الأدعية
========================================================= */

function createDuaControls() {

    const screen =
        $("duas");

    if (!screen) return;

    let controls =
        $("duaControls");


    /* -----------------------------------------------------
       إنشاء حاوية الأقسام إذا لم تكن موجودة
    ----------------------------------------------------- */

    if (!controls) {

        controls =
            document.createElement("div");

        controls.id =
            "duaControls";

        const title =
            screen.querySelector("h1, h2");

        if (
            title &&
            title.parentNode
        ) {

            title.parentNode.insertBefore(
                controls,
                title.nextSibling
            );

        } else {

            screen.prepend(controls);
        }
    }


    controls.className =
        "dua-categories";


    /* -----------------------------------------------------
       أزرار الأقسام
    ----------------------------------------------------- */

    controls.innerHTML =
        duaCategories
            .map(
                category => `

                    <button
                        type="button"
                        class="dua-category-button ${
                            category.id === duaCategory
                                ? "active"
                                : ""
                        }"
                        onclick="changeDuaCategory('${category.id}')"
                    >
                        ${category.icon}
                        <br>
                        ${category.title}
                    </button>

                `
            )
            .join("");


    /* -----------------------------------------------------
       بطاقة التسجيل
    ----------------------------------------------------- */

    let audioCard =
        $("duaAudioCard");


    if (!audioCard) {

        audioCard =
            document.createElement("div");

        audioCard.id =
            "duaAudioCard";

        audioCard.className =
            "dua-audio-card";

        screen.appendChild(audioCard);
    }


    const category =
        getCurrentDuaCategory();


    audioCard.innerHTML = `

        <div class="dua-audio-icon">
            ${category.icon}
        </div>

        <div class="dua-audio-title">
            ${category.title}
        </div>

        <div class="dua-audio-description">
            🎙️ تسجيل صوتي حقيقي من الدرر السنية
        </div>

        <button
            id="duaRealAudioButton"
            class="primary dua-audio-button"
            type="button"
            onclick="playDuaAudio()"
        >
            🔊 استمع للتسجيل
        </button>

        <div
            id="duaAudioMessage"
            class="dua-audio-message"
            aria-live="polite"
        ></div>

        <button
            class="secondary dua-audio-button dua-next-button"
            type="button"
            onclick="nextDua()"
        >
            ➡️ القسم التالي
        </button>

    `;


    /* -----------------------------------------------------
       عداد / اسم القسم
    ----------------------------------------------------- */

    let counter =
        $("duaCounter");


    if (!counter) {

        counter =
            document.createElement("div");

        counter.id =
            "duaCounter";

        counter.style.cssText =
            "text-align:center;font-weight:bold;margin:10px;";

        screen.appendChild(counter);
    }


    const categoryIndex =
        duaCategories.findIndex(
            item =>
                item.id === duaCategory
        );


    counter.textContent =
        `📚 القسم ${arabicNumber(categoryIndex + 1)} من ${arabicNumber(duaCategories.length)}`;
}


/* =========================================================
🔄 تغيير قسم الأدعية
========================================================= */

function changeDuaCategory(category) {

    /*
     * إيقاف أي صوت يعمل قبل الانتقال
     */
    if (
        typeof stopAllAudio === "function"
    ) {
        try {
            stopAllAudio();
        } catch (error) {}
    }

    stopDuaAudio();


    /*
     * التأكد أن القسم موجود
     */
    const exists =
        duaCategories.some(
            item =>
                item.id === category
        );


    if (!exists) {
        return;
    }


    duaCategory =
        category;

    currentDuaIndex =
        0;


    renderDua();
}


/* =========================================================
🔊 تشغيل التسجيل الحقيقي من الدرر السنية
========================================================= */

function playDuaAudio() {

    /*
     * إيقاف أي تسجيل سابق
     */
    if (
        typeof stopAllAudio === "function"
    ) {
        try {
            stopAllAudio();
        } catch (error) {}
    }

    stopDuaAudio();


    const category =
        getCurrentDuaCategory();


    if (
        !category ||
        !category.audio
    ) {

        const message =
            $("duaAudioMessage");

        if (message) {

            message.textContent =
                "⚠️ لا يوجد تسجيل صوتي لهذا القسم.";
        }

        return;
    }


    const message =
        $("duaAudioMessage");

    const button =
        $("duaRealAudioButton");


    if (message) {

        message.textContent =
            "🔊 جاري تشغيل التسجيل...";
    }


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "⏸️ جاري التشغيل...";
    }


    /*
     * إنشاء مشغل الصوت
     */
    const audio =
        new Audio();


    currentDuaAudio =
        audio;


    audio.preload =
        "auto";


    audio.src =
        category.audio;


    /* -----------------------------------------------------
       عند بدء التشغيل فعليًا
    ----------------------------------------------------- */

    audio.addEventListener(
        "playing",
        () => {

            if (
                currentDuaAudio !== audio
            ) {
                return;
            }

            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "⏸️ إيقاف التسجيل";
            }

            if (message) {

                message.textContent =
                    "🎙️ يتم تشغيل التسجيل الحقيقي...";
            }
        }
    );


    /* -----------------------------------------------------
       الضغط مرة أخرى = إيقاف
    ----------------------------------------------------- */

    audio.addEventListener(
        "pause",
        () => {

            if (
                currentDuaAudio !== audio
            ) {
                return;
            }

            if (
                audio.currentTime <
                audio.duration
            ) {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        "▶️ متابعة التسجيل";
                }
            }
        }
    );


    /* -----------------------------------------------------
       انتهاء التسجيل
    ----------------------------------------------------- */

    audio.addEventListener(
        "ended",
        () => {

            if (
                currentDuaAudio !== audio
            ) {
                return;
            }

            currentDuaAudio =
                null;


            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "🔊 استمع للتسجيل مرة أخرى";
            }


            if (message) {

                message.textContent =
                    "✅ انتهى التسجيل";
            }
        },
        {
            once: true
        }
    );


    /* -----------------------------------------------------
       حدوث خطأ في الملف الصوتي
    ----------------------------------------------------- */

    audio.addEventListener(
        "error",
        () => {

            if (
                currentDuaAudio !== audio
            ) {
                return;
            }

            currentDuaAudio =
                null;


            if (button) {

                button.disabled =
                    false;

                button.textContent =
                    "🔊 حاول مرة أخرى";
            }


            if (message) {

                message.textContent =
                    "⚠️ تعذر تشغيل التسجيل. تأكد من اتصال الإنترنت ثم حاول مرة أخرى.";
            }


            console.error(
                "Dua audio error:",
                category.audio,
                audio.error
            );
        },
        {
            once: true
        }
    );


    /* -----------------------------------------------------
       تشغيل التسجيل
    ----------------------------------------------------- */

    const playPromise =
        audio.play();


    if (
        playPromise &&
        typeof playPromise.catch === "function"
    ) {

        playPromise.catch(
            error => {

                if (
                    currentDuaAudio !== audio
                ) {
                    return;
                }

                currentDuaAudio =
                    null;


                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        "🔊 حاول مرة أخرى";
                }


                if (message) {

                    message.textContent =
                        "⚠️ اضغط على زر الاستماع مرة أخرى لتشغيل التسجيل.";
                }


                console.error(
                    "Dua audio play failed:",
                    error
                );
            }
        );
    }


    /*
     * تغيير وظيفة الزر أثناء التشغيل
     */
    if (button) {

        button.onclick =
            function () {

                if (
                    currentDuaAudio === audio &&
                    !audio.paused
                ) {

                    audio.pause();

                    return;
                }


                if (
                    currentDuaAudio === audio &&
                    audio.paused
                ) {

                    audio.play().catch(
                        error => {

                            console.error(
                                "Dua audio resume failed:",
                                error
                            );
                        }
                    );

                    return;
                }


                playDuaAudio();
            };
    }
}


/* =========================================================
🗣️ تشغيل الدعاء القديم
📌 احتياطي للأزرار القديمة في HTML
========================================================= */

function speakDua() {

    const category =
        getCurrentDuaCategory();


    /*
     * إذا كان القسم يحتوي على
     * تسجيل حقيقي من الدرر السنية
     * نستخدم التسجيل الحقيقي.
     */
    if (
        category &&
        category.audio
    ) {

        playDuaAudio();

        return;
    }


    /*
     * الاحتياط القديم
     */
    const list =
        generalDuas;


    if (
        !list.length ||
        !list[currentDuaIndex]
    ) {

        return;
    }


    if (
        typeof speak === "function"
    ) {

        speak(
            list[currentDuaIndex].text,
            {
                rate: 0.7
            }
        );
    }
}


/* =========================================================
▶️ توافق مع زر HTML القديم
========================================================= */

function playCurrentDuaAudio() {

    playDuaAudio();
}


/* =========================================================
➡️ الانتقال إلى القسم التالي
========================================================= */

function nextDua() {

    /*
     * إيقاف الصوت الحالي
     */
    if (
        typeof stopAllAudio === "function"
    ) {

        try {
            stopAllAudio();
        } catch (error) {}
    }

    stopDuaAudio();


    /*
     * معرفة القسم الحالي
     */
    const currentIndex =
        duaCategories.findIndex(
            category =>
                category.id === duaCategory
        );


    let nextIndex =
        currentIndex + 1;


    /*
     * الرجوع لأول قسم بعد آخر قسم
     */
    if (
        nextIndex >=
        duaCategories.length
    ) {

        nextIndex = 0;
    }


    duaCategory =
        duaCategories[nextIndex].id;


    currentDuaIndex =
        0;


    renderDua();
}


/* =========================================================
🏠 إيقاف صوت الأدعية عند مغادرة الصفحة
========================================================= */

function stopDuaWhenLeavingScreen() {

    stopDuaAudio();
}


/* =========================================================
🌐 إتاحة الدوال لـ HTML
========================================================= */

window.changeDuaCategory =
    changeDuaCategory;

window.speakDua =
    speakDua;

window.playDuaAudio =
    playDuaAudio;

window.playCurrentDuaAudio =
    playCurrentDuaAudio;

window.nextDua =
    nextDua;

window.stopDuaAudio =
    stopDuaAudio;


/* =========================================================
🚀 تشغيل قسم الأدعية أول مرة
========================================================= */

if (
    typeof renderDua === "function"
) {
    renderDua();
}
/* =========================================================
🏆 تصفير التقدم
========================================================= */

function resetProgress() {

    const confirmed =
        confirm(
            "هل أنت متأكد أنك تريد تصفير النجوم والمستوى والإحصائيات؟"
        );

    if (!confirmed) return;

    stars = 0;
    level = 1;

    correctLetters = 0;
    correctWords = 0;
    correctNumbers = 0;
    correctAddition = 0;
    correctSubtraction = 0;

    localStorage.setItem(
        "taha_app_stars",
        0
    );

    localStorage.setItem(
        "taha_app_level",
        1
    );

    saveCounters();

    updateStats();

    speakEducational(
        "تم تصفير المكافآت والإحصائيات"
    );
}

/* =========================================================
🌍 تصدير الدوال المطلوبة إلى HTML
========================================================= */

/* التنقل */
window.showScreen = showScreen;

/* الصوت */
window.speak = speak;

/* الحروف */
window.speakCurrentLetter =
    speakCurrentLetter;

window.playLetterAudio =
    playLetterAudio;

window.nextLetter =
    nextLetter;

window.nextLetterGame =
    nextLetterGame;

window.resetLetterGames =
    resetLetterGames;

/* الكلمات */
window.speakWord =
    speakWord;

window.playCurrentWordAudio =
    playCurrentWordAudio;

window.nextWord =
    nextWord;

/* الأرقام */
window.speakNumber =
    speakNumber;

window.nextNumber =
    nextNumber;

window.newNumber =
    newNumber;

/* الجمع */
window.newAddition =
    newAddition;

window.checkAddition =
    checkAddition;

/* الطرح */
window.newSubtraction =
    newSubtraction;

window.checkSubtraction =
    checkSubtraction;

/* القرآن */
window.speakSurah =
    speakSurah;

window.speakQuranAyah =
    speakQuranAyah;

window.nextSurah =
    nextSurah;

/* الحديث */
window.speakHadith =
    speakHadith;

window.speakHadithMeaning =
    speakHadithMeaning;

window.playHadithAudio =
    playHadithAudio;

window.nextHadith =
    nextHadith;

/* الأدعية */
window.changeDuaCategory =
    changeDuaCategory;

window.speakDua =
    speakDua;

window.playDuaAudio =
    playDuaAudio;

window.nextDua =
    nextDua;

/* المكافآت */
window.resetProgress =
    resetProgress;

/* =========================================================
🛡️ إيقاف الصوت عند إخفاء الصفحة
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (document.hidden) {

            stopAllAudio();

            invalidateLetterGameSession();
        }
    }
);

window.addEventListener(
    "beforeunload",
    () => {

        stopAllAudio();

        invalidateLetterGameSession();
    }
);

/* =========================================================
🚀 تشغيل التطبيق
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateStats();

        addLetterGameStyles();

        renderLetterPage();

        renderCurrentWord();

        renderCurrentNumber();

        renderSurah();

        renderHadith();

        renderDua();

    }
);
/* =========================================================
   🎈🔢 فرقع الحروف + فرقع الأرقام — الإصدار ٢ (SEN-friendly)
   ---------------------------------------------------------
   محرّك واحد للّعبتين بتصميم لكل منهما:
   • فرقع الحروف: سماء نهارية، بالونات ملوّنة، الحرف بصوته التعليمي.
   • فرقع الأرقام: حديقة احتفال، فقاعات/بالونات، الرقم بصوته الكامل.
   بلا مؤقت ولا أرواح ولا عقوبات؛ الخطأ يعالَج بتلميح تدريجي.
   الصوت: ملفات MP3 المحلية فقط من EDUCATIONAL_AUDIO_MANIFEST
   (الحرف بصوته، والرقم/العبارة كاملة)، بلا أي TTS إطلاقًا.
   التقدّم مستقل: taha_pop_progress_v1
========================================================= */

const POP_KEY = "taha_pop_progress_v1";
const POP_ROUNDS = 5;
const POP_COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];

/* مفاتيح الأرقام في الـmanifest (بلا تشكيل) — الرقم بصوته الكامل */
const POP_NUM_WORDS = [null, "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة",
    "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر", "عشرون",
    "واحد وعشرون", "اثنان وعشرون", "ثلاثة وعشرون", "أربعة وعشرون", "خمسة وعشرون", "ستة وعشرون", "سبعة وعشرون", "ثمانية وعشرون", "تسعة وعشرون", "ثلاثون"];

const POP_PRAISE = ["صحيح", "أحسنت يا بطل", "أحسنت، عمل رائع"];
const POP_LEVEL_DONE = "أحسنت! أكملت المستوى بنجاح";

const POP_KINDS = {
    letters: {
        screen: "balloonGame",
        env: "sky",
        title: "فرقع الحروف",
        icon: "🎈",
        sub: "اسمع الحرف ثم فرقع البالونة الصحيحة",
        hubGlyphs: ["أ", "ب", "ت"],
        askText: "اسمع الحرف ثم فرقع البالونة الصحيحة",
        levels: [
            { id: 1, name: "سهل", note: "بالونتان وحروف مألوفة", count: 2, pool: "g12", show: true },
            { id: 2, name: "متوسط", note: "ثلاث بالونات، كل الحروف", count: 3, pool: "all", show: true },
            { id: 3, name: "متقدّم", note: "أربع بالونات وحروف متشابهة", count: 4, pool: "all", show: false, near: true }
        ]
    },
    numbers: {
        screen: "numberBalloonGame",
        env: "fair",
        title: "فرقع الأرقام",
        icon: "🔢",
        sub: "اسمع الرقم ثم فرقع البالونة الصحيحة",
        hubGlyphs: ["١", "٢", "٣"],
        askText: "اسمع الرقم ثم فرقع البالونة الصحيحة",
        levels: [
            { id: 1, name: "سهل", note: "من ١ إلى ٥ — ثلاث بالونات", count: 3, max: 5 },
            { id: 2, name: "متوسط", note: "من ١ إلى ١٠ — أربع بالونات", count: 4, max: 10 },
            { id: 3, name: "متقدّم", note: "من ١ إلى ٢٠ — خمس بالونات", count: 5, max: 20, near: true },
            { id: 4, name: "بطل", note: "من ١ إلى ٣٠ — ست بالونات", count: 6, max: 30, near: true }
        ]
    }
};

const pop = {
    active: false,
    kind: "letters",
    view: "hub",
    level: 1,
    round: 0,
    mistakes: 0,
    hint: 0,
    solved: false,
    session: 0,
    target: null,
    used: [],
    timers: [],
    built: {},
    cur: null
};

/* ---------- أدوات ---------- */

function pEl(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
}

function pNum(n) {
    return (typeof arabicNumber === "function") ? arabicNumber(n) : String(n);
}

function pShuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
}

function pCalm() {
    try { return !!(typeof Settings !== "undefined" && Settings.get().calm); } catch (e) { return false; }
}

function pCfg() { return POP_KINDS[pop.kind]; }
function pRoot() { return document.getElementById(pCfg().screen); }
function pQ(sel) { const r = pRoot(); return r ? r.querySelector(sel) : null; }

/* مؤقّتات الجولة: تُلغى كلها عند الخروج أو بدء جولة جديدة (ليست مؤقتًا للّعب، بل تأخيرات الحركة) */
function pLater(fn, ms) {
    const ses = pop.session;
    const t = setTimeout(() => {
        pop.timers = pop.timers.filter(x => x !== t);
        if (ses === pop.session && pop.active) fn();
    }, ms);
    pop.timers.push(t);
    return t;
}

function pClearTimers() {
    pop.timers.forEach(t => clearTimeout(t));
    pop.timers = [];
}

/* ---------- الصوت: ملفات MP3 المحلية فقط، صوت واحد في كل مرة، بلا TTS ---------- */

function popStopAudio() { EduAudio.stop(); }

/* مفتاح الصوت للقيمة: الحرف بصوته (بفتحة) أو الرقم بكلمته الكاملة */
function popKey(kind, v) {
    if (kind === "letters") return letterWithFatha(v);
    return POP_NUM_WORDS[Number(v)] || null;
}

function popHas(key) {
    return !!key && typeof EDUCATIONAL_AUDIO_MANIFEST !== "undefined" && !!EDUCATIONAL_AUDIO_MANIFEST[key];
}

/* يشغّل قائمة مفاتيح بالتتابع (كلمة كاملة لكل مفتاح). done تُستدعى بعد آخر ملف أو إن تعذّر التشغيل */
function popSay(keys, done) {
    const list = (Array.isArray(keys) ? keys : [keys]).filter(popHas);
    if (!list.length) { EduAudio.stop(); if (done) setTimeout(done, 0); return; }
    EduAudio.play(list, { mode: "interrupt", done: done });
}

/* ---------- التقدّم المحفوظ (مستقل) ---------- */

function popLoad() {
    const empty = () => ({ letters: { done: {}, last: null }, numbers: { done: {}, last: null } });
    try {
        const o = JSON.parse(localStorage.getItem(POP_KEY));
        if (!o || typeof o !== "object") return empty();
        const out = empty();
        Object.keys(POP_KINDS).forEach(k => {
            const src = o[k];
            if (!src || typeof src !== "object") return;
            const maxLv = POP_KINDS[k].levels.length;
            if (src.done && typeof src.done === "object") {
                Object.keys(src.done).forEach(lv => {
                    const n = Number(lv);
                    const v = src.done[lv];
                    if (n >= 1 && n <= maxLv && v && typeof v === "object") {
                        out[k].done[n] = { n: Math.max(1, Math.min(9999, Number(v.n) || 1)), best: Math.max(0, Math.min(99, Number(v.best) || 0)) };
                    }
                });
            }
            const l = src.last;
            if (l && typeof l === "object" && Number(l.level) >= 1 && Number(l.level) <= maxLv) {
                out[k].last = { level: Number(l.level), mistakes: Math.max(0, Math.min(99, Number(l.mistakes) || 0)) };
            }
        });
        return out;
    } catch (e) {
        return empty();
    }
}

function popSave(p) {
    try { localStorage.setItem(POP_KEY, JSON.stringify(p)); } catch (e) { /* لا شيء */ }
}

function popDoneCount(kind) {
    return Object.keys(popLoad()[kind].done).length;
}

/* المستوى المقترح: التالي بعد جولة هادئة، وإلا نفس المستوى */
function popSuggest(kind) {
    const p = popLoad()[kind];
    const max = POP_KINDS[kind].levels.length;
    if (!p.last) return 1;
    if (p.last.mistakes <= 2) return Math.min(max, p.last.level + 1);
    return p.last.level;
}

/* ---------- بناء الشاشة (مرة واحدة لكل لعبة) ---------- */

const POP_SCENERY = {
    sky: [["☀️", "sun"], ["☁️", "c1"], ["☁️", "c2"], ["☁️", "c3"], ["🐦", "bird"]],
    fair: [["🌙", "moon"], ["✨", "s1"], ["✨", "s2"], ["⭐", "s3"], ["✨", "s4"]]
};

function popBuild(kind) {
    const cfg = POP_KINDS[kind];
    const sec = document.getElementById(cfg.screen);
    if (!sec) return null;
    if (pop.built[kind] && sec.querySelector(".pop-world")) return sec.querySelector(".pop-world");
    sec.innerHTML = "";
    const world = pEl("div", "pop-world");
    world.dataset.kind = kind;
    world.dataset.env = cfg.env;
    world.dataset.view = "hub";

    const sc = pEl("div", "pop-scenery");
    sc.setAttribute("aria-hidden", "true");
    if (cfg.env === "fair") {
        const flags = pEl("div", "pop-bunting");
        for (let i = 0; i < 9; i++) flags.appendChild(pEl("i", "pf" + (i % 5)));
        sc.appendChild(flags);
        for (let i = 0; i < 6; i++) {
            const b = pEl("span", "pop-bubble-deco");
            b.style.left = (8 + i * 16) + "%";
            b.style.setProperty("--bd", (14 + i * 3) + "s");
            b.style.setProperty("--bl", (-i * 3.1) + "s");
            b.style.setProperty("--bs", (26 + (i % 3) * 14) + "px");
            sc.appendChild(b);
        }
    }
    (POP_SCENERY[cfg.env] || []).forEach(([g, c]) => sc.appendChild(pEl("span", "pop-deco pd-" + c, g)));
    world.appendChild(sc);

    const top = pEl("div", "pop-topbar");
    const back = pEl("button", "pop-icon-btn", "⬅️");
    back.type = "button";
    back.setAttribute("aria-label", "رجوع");
    back.addEventListener("click", () => popBack());
    top.appendChild(back);
    top.appendChild(pEl("h2", "pop-title", cfg.icon + " " + cfg.title));
    top.appendChild(pEl("span", "pop-spacer"));
    world.appendChild(top);

    const hub = pEl("div", "pop-view pop-hub");
    const levels = pEl("div", "pop-view pop-levels");
    levels.hidden = true;
    const play = pEl("div", "pop-view pop-play");
    play.hidden = true;

    /* واجهة اللعب */
    const hud = pEl("div", "pop-hud");
    const starPill = pEl("div", "pop-pill pop-starpill");
    starPill.appendChild(pEl("span", "", "⭐"));
    starPill.appendChild(pEl("strong", "pop-stars", "٠"));
    hud.appendChild(starPill);
    const mid = pEl("div", "pop-hud-mid");
    mid.appendChild(pEl("span", "pop-hud-level"));
    mid.appendChild(pEl("span", "pop-round-text"));
    hud.appendChild(mid);
    const pips = pEl("div", "pop-pips");
    pips.setAttribute("aria-hidden", "true");
    hud.appendChild(pips);
    play.appendChild(hud);

    const tgt = pEl("div", "pop-target");
    tgt.appendChild(pEl("div", "pop-ask", cfg.askText));
    const tRow = pEl("div", "pop-target-row");
    const glyph = pEl("button", "pop-target-glyph", "؟");
    glyph.type = "button";
    glyph.setAttribute("aria-label", "اسمع مرة أخرى");
    glyph.addEventListener("click", () => popListen());
    tRow.appendChild(glyph);
    const sp = pEl("button", "pop-speaker", "🔊");
    sp.type = "button";
    sp.setAttribute("aria-label", "اسمع مرة أخرى");
    sp.addEventListener("click", () => popListen());
    tRow.appendChild(sp);
    tgt.appendChild(tRow);
    tgt.appendChild(pEl("div", "pop-word"));
    play.appendChild(tgt);

    const arena = pEl("div", "pop-arena");
    play.appendChild(arena);
    const msg = pEl("div", "pop-message");
    msg.setAttribute("role", "status");
    msg.setAttribute("aria-live", "polite");
    play.appendChild(msg);
    const ctl = pEl("div", "pop-controls");
    const bL = pEl("button", "pop-ctl", "🔊 استمع");
    bL.type = "button";
    bL.addEventListener("click", () => popListen());
    const bH = pEl("button", "pop-ctl pop-hintbtn", "💡 مساعدة");
    bH.type = "button";
    bH.addEventListener("click", () => popHintBtn());
    ctl.appendChild(bL);
    ctl.appendChild(bH);
    play.appendChild(ctl);

    world.appendChild(hub);
    world.appendChild(levels);
    world.appendChild(play);

    /* شاشة الإنجاز */
    const dlg = pEl("div", "pop-dialog");
    dlg.setAttribute("role", "dialog");
    dlg.setAttribute("aria-modal", "true");
    dlg.setAttribute("aria-labelledby", "popDoneTitle_" + kind);
    dlg.hidden = true;
    const box = pEl("div", "pop-dialog-box");
    box.appendChild(pEl("div", "pop-trophy", "🏆"));
    box.appendChild(pEl("div", "pop-done-balloons"));
    const h3 = pEl("h3", "", "أحسنت يا بطل!");
    h3.id = "popDoneTitle_" + kind;
    box.appendChild(h3);
    box.appendChild(pEl("p", "pop-done-text"));
    box.appendChild(pEl("div", "pop-done-stars"));
    const bn = pEl("button", "pop-big-btn pop-done-next", "المستوى التالي ◀");
    bn.type = "button";
    const ba = pEl("button", "pop-ctl pop-done-again", "🔄 العب المستوى مرة أخرى");
    ba.type = "button";
    const bh = pEl("button", "pop-ctl pop-done-levels", "🎈 كل المستويات");
    bh.type = "button";
    bn.addEventListener("click", () => { popCloseDone(); popStartLevel(pop.kind, Math.min(POP_KINDS[pop.kind].levels.length, pop.level + 1)); });
    ba.addEventListener("click", () => { popCloseDone(); popStartLevel(pop.kind, pop.level); });
    bh.addEventListener("click", () => { popCloseDone(); popShowLevels(); });
    box.appendChild(bn);
    box.appendChild(ba);
    box.appendChild(bh);
    dlg.appendChild(box);
    dlg.addEventListener("keydown", e => {
        if (e.key === "Escape") { popCloseDone(); popShowLevels(); return; }
        if (e.key !== "Tab") return;
        const f = Array.from(dlg.querySelectorAll("button")).filter(b => !b.hidden && !b.disabled);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    world.appendChild(dlg);

    sec.appendChild(world);
    pop.built[kind] = true;
    return world;
}

function popViews(view) {
    pop.view = view;
    const w = pQ(".pop-world");
    if (!w) return;
    w.dataset.view = view;
    const map = { hub: ".pop-hub", levels: ".pop-levels", play: ".pop-play" };
    Object.keys(map).forEach(k => {
        const e = w.querySelector(map[k]);
        if (!e) return;
        e.hidden = k !== view;
        if (k === view) { e.classList.remove("pop-view-in"); void e.offsetWidth; e.classList.add("pop-view-in"); }
    });
    const cfg = pCfg();
    const t = w.querySelector(".pop-title");
    if (t) t.textContent = cfg.icon + " " + cfg.title;
    popKeepInView();
}

function popKeepInView() {
    const w = pQ(".pop-world");
    if (!w) return;
    const r = w.getBoundingClientRect();
    if (r.top < -20) { try { w.scrollIntoView({ block: "start" }); } catch (e) { /* لا شيء */ } }
}

/* ---------- الدخول والخروج ---------- */

function popEnter(kind) {
    popTeardown();
    pop.kind = kind;
    pop.active = true;
    popBuild(kind);
    showScreen(POP_KINDS[kind].screen);
    popShowHub();
}

function startBalloonGame() { popEnter("letters"); }
function startNumberBalloonGame() { popEnter("numbers"); }

function popExit() {
    popTeardown();
    pop.active = false;
    showScreen("games");
}

function exitBalloonGame() { popExit(); }
function exitNumberBalloonGame() { popExit(); }

function popTeardown() {
    pop.session++;
    pClearTimers();
    pop.cur = null;
    popStopAudio();
    document.querySelectorAll(".pop-ghost-fly").forEach(n => n.remove());
    try { popCloseDone(); } catch (e) { /* لا شيء */ }
}

function popBack() {
    if (pop.view === "play") { popTeardown(); pop.active = true; popShowLevels(); return; }
    if (pop.view === "levels") { popShowHub(); return; }
    popExit();
}

/* ---------- شاشة البداية ---------- */

function popShowHub() {
    popTeardown();
    pop.active = true;
    popViews("hub");
    const cfg = pCfg();
    const hub = pQ(".pop-hub");
    if (!hub) return;
    hub.innerHTML = "";
    const hero = pEl("div", "pop-hero");
    hero.appendChild(pEl("h1", "pop-hero-title", cfg.title));
    hero.appendChild(pEl("div", "pop-hero-sub", cfg.sub));
    const cluster = pEl("div", "pop-cluster");
    cfg.hubGlyphs.forEach((g, i) => {
        const b = popMakeBalloon(g, POP_COLORS[(i * 2) % POP_COLORS.length], i);
        b.classList.add("pop-hubb");
        b.setAttribute("aria-label", g);
        b.addEventListener("click", () => popHubTap(b, g));
        cluster.appendChild(b);
    });
    hero.appendChild(cluster);
    const start = pEl("button", "pop-start", "▶ هيا نبدأ");
    start.type = "button";
    start.classList.add("pop-start-btn");
    start.addEventListener("click", () => popStartLevel(pop.kind, popSuggest(pop.kind)));
    hero.appendChild(start);
    const choose = pEl("button", "pop-choose", "🎯 اختر المستوى");
    choose.type = "button";
    choose.classList.add("pop-choose-btn");
    choose.addEventListener("click", () => popShowLevels());
    hero.appendChild(choose);
    const total = cfg.levels.length;
    hero.appendChild(pEl("div", "pop-progress-line", "أنجزت " + pNum(popDoneCount(pop.kind)) + " من " + pNum(total) + " مستويات"));
    hub.appendChild(hero);
}

/* بالونات البداية تُفرقَع للّعب وتنطق قيمتها بصوتها الكامل */
function popHubTap(b, v) {
    if (b.classList.contains("popping")) return;
    popSay([popKey(pop.kind, popGlyphToValue(v))]);
    b.classList.add("popping");
    popBurst(b);
    const ses = pop.session;
    setTimeout(() => { if (ses === pop.session && b.parentNode) b.classList.remove("popping"); }, 1300);
}

function popGlyphToValue(g) {
    if (pop.kind === "letters") return g;
    return "٠١٢٣٤٥٦٧٨٩".indexOf(g);
}

/* ---------- اختيار المستوى ---------- */

function popShowLevels() {
    popTeardown();
    pop.active = true;
    popViews("levels");
    const cfg = pCfg();
    const box = pQ(".pop-levels");
    if (!box) return;
    box.innerHTML = "";
    const p = popLoad()[pop.kind];
    const sug = popSuggest(pop.kind);
    box.appendChild(pEl("div", "pop-intro-line", "اختر مستواك وانطلق 🎈"));
    const list = pEl("div", "pop-level-list");
    cfg.levels.forEach(l => {
        const b = pEl("button", "pop-level pop-lv" + l.id + (l.id === sug ? " suggested" : ""));
        b.type = "button";
        b.dataset.level = String(l.id);
        const art = pEl("span", "pop-level-art");
        art.setAttribute("aria-hidden", "true");
        for (let i = 0; i < Math.min(l.count, 6); i++) art.appendChild(pEl("i", "pc-" + POP_COLORS[i % POP_COLORS.length]));
        b.appendChild(art);
        const done = p.done[l.id];
        const t = pEl("span", "pop-level-text");
        t.appendChild(pEl("strong", "", l.name + (done ? " ✓" : "")));
        t.appendChild(pEl("small", "", l.note + (l.id === sug ? " — مقترح لك 👍" : "")));
        b.appendChild(t);
        b.appendChild(pEl("span", "pop-level-stars", done ? "🌟".repeat(Math.min(3, l.id)) : "⭐".repeat(Math.min(3, l.id))));
        b.addEventListener("click", () => popStartLevel(pop.kind, l.id));
        list.appendChild(b);
    });
    box.appendChild(list);
}

/* ---------- الجولات ---------- */

function popStartLevel(kind, level) {
    if (pop.kind !== kind || !pop.built[kind]) { pop.kind = kind; popBuild(kind); }
    popTeardown();
    pop.active = true;
    pop.kind = kind;
    pop.level = level;
    pop.round = 0;
    pop.mistakes = 0;
    pop.used = [];
    const sec = document.getElementById(POP_KINDS[kind].screen);
    if (!sec || !sec.classList.contains("active")) showScreen(POP_KINDS[kind].screen);
    popViews("play");
    popRound();
}

function popLevelCfg() { return pCfg().levels[pop.level - 1]; }

function popUpdateHud() {
    const lv = popLevelCfg();
    const lt = pQ(".pop-hud-level");
    if (lt && lv) lt.textContent = "المستوى " + pNum(pop.level) + " — " + lv.name;
    const rt = pQ(".pop-round-text");
    if (rt) rt.textContent = "الجولة " + pNum(pop.round + 1) + " من " + pNum(POP_ROUNDS);
    const st = pQ(".pop-stars");
    if (st && typeof stars !== "undefined") st.textContent = pNum(stars);
    const pips = pQ(".pop-pips");
    if (pips) {
        pips.innerHTML = "";
        for (let i = 0; i < POP_ROUNDS; i++) {
            const done = i < pop.round || (i === pop.round && pop.solved);
            pips.appendChild(pEl("i", "pc-" + POP_COLORS[i % POP_COLORS.length] + (done ? " on" : (i === pop.round ? " cur" : ""))));
        }
    }
}

function popMsg(text, kind) {
    const m = pQ(".pop-message");
    if (!m) return;
    m.textContent = text || "";
    m.className = "pop-message" + (kind ? " " + kind : "");
}

/* بالونة واحدة: زر كبير بجسم مرسوم بالـCSS وخيط */
function popMakeBalloon(glyph, color, i) {
    const b = pEl("button", "pop-balloon pc-" + color);
    b.type = "button";
    b.style.setProperty("--i", i);
    b.style.setProperty("--fd", (4.2 + (i % 4) * 0.7).toFixed(1) + "s");
    b.style.setProperty("--fl", (-i * 0.9).toFixed(1) + "s");
    const fl = pEl("span", "pop-float");
    const body = pEl("span", "pop-body");
    body.appendChild(pEl("span", "pop-glyph", glyph));
    fl.appendChild(body);
    fl.appendChild(pEl("span", "pop-knot"));
    fl.appendChild(pEl("span", "pop-string"));
    b.appendChild(fl);
    return b;
}

function popPickTarget() {
    const cfg = pCfg();
    const lv = popLevelCfg();
    let pool;
    if (pop.kind === "letters") {
        pool = [];
        LETTER_LEVEL_GROUPS.forEach(g => { if (lv.pool === "all" || g.id <= 2) g.letters.forEach(l => pool.push(l)); });
    } else {
        pool = [];
        for (let n = 1; n <= lv.max; n++) pool.push(n);
    }
    const fresh = pool.filter(x => pop.used.indexOf(x) < 0);
    const src = fresh.length ? fresh : pool;
    const t = src[Math.floor(Math.random() * src.length)];
    pop.used.push(t);
    return t;
}

function popChoices(target) {
    const lv = popLevelCfg();
    const need = lv.count - 1;
    let out = [];
    if (pop.kind === "letters") {
        const all = [];
        LETTER_LEVEL_GROUPS.forEach(g => { g.letters.forEach(l => { if (lv.pool === "all" || g.id <= 2) all.push(l); }); });
        if (lv.near && typeof getPhoneticNeighbors === "function") {
            pShuffle(getPhoneticNeighbors(target) || []).forEach(n => { if (out.length < need && n !== target && all.indexOf(n) >= 0 && out.indexOf(n) < 0) out.push(n); });
        }
        pShuffle(all.filter(l => l !== target && out.indexOf(l) < 0)).forEach(l => { if (out.length < need) out.push(l); });
    } else {
        const all = [];
        for (let n = 1; n <= lv.max; n++) if (n !== target) all.push(n);
        if (lv.near) {
            pShuffle(all.filter(n => Math.abs(n - target) <= 2)).slice(0, 1).forEach(n => out.push(n));
        }
        pShuffle(all.filter(n => out.indexOf(n) < 0)).forEach(n => { if (out.length < need) out.push(n); });
    }
    return pShuffle([target].concat(out));
}

function popDisplay(v) {
    return pop.kind === "letters" ? v : pNum(v);
}

function popRound() {
    pop.session++;
    pClearTimers();
    popStopAudio();
    pop.solved = false;
    pop.hint = 0;
    pop.roundStart = Date.now();
    const lv = popLevelCfg();
    const target = popPickTarget();
    pop.target = target;
    const values = popChoices(target);
    pop.cur = { target, values, tried: {} };
    popUpdateHud();
    popMsg("");
    const g = pQ(".pop-target-glyph");
    if (g) {
        const show = pop.kind === "letters" && lv.show;
        g.textContent = show ? letterWithFatha(target) : "؟";
        g.classList.toggle("revealed", false);
        g.classList.remove("pop-win-glow");
    }
    const w = pQ(".pop-word");
    if (w) w.textContent = "";
    const arena = pQ(".pop-arena");
    if (!arena) return;
    arena.innerHTML = "";
    arena.className = "pop-arena pop-n" + values.length;
    values.forEach((v, i) => {
        const b = popMakeBalloon(popDisplay(v), POP_COLORS[(i + Math.floor(Math.random() * 3)) % POP_COLORS.length], i);
        b.dataset.v = String(v);
        b.setAttribute("aria-label", pop.kind === "letters" ? "بالونة حرف" : "بالونة رقم");
        b.addEventListener("click", () => popTap(b, v));
        arena.appendChild(b);
    });
    popKeepInView();
    const key = popKey(pop.kind, target);
    pLater(() => popSay([key]), 550);
}

function popListen() {
    if (!pop.active || pop.view !== "play" || pop.cur == null) return;
    popSay([popKey(pop.kind, pop.cur.target)]);
}

function popTap(b, v) {
    if (!pop.active || pop.solved || !pop.cur || b.classList.contains("popping")) return;
    const key = popKey(pop.kind, v);
    if (v === pop.cur.target) popCorrect(b, v, key);
    else popWrong(b, v, key);
}

function popCorrect(b, v, key) {
    pop.solved = true;
    const t0 = Date.now();
    b.classList.add("popping", "right");
    popClearHints();
    const arena = pQ(".pop-arena");
    if (arena) {
        arena.classList.add("pop-win");
        arena.querySelectorAll(".pop-balloon").forEach(x => { if (x !== b) x.classList.add("leaving"); });
    }
    popBurst(b);
    popStarFly(b);
    try { if (typeof addStars === "function") addStars(1); } catch (e) { /* لا شيء */ }
    popUpdateHud();
    const g = pQ(".pop-target-glyph");
    if (g) { g.textContent = popDisplay(v); if (pop.kind === "letters") g.textContent = letterWithFatha(v); g.classList.add("revealed", "pop-win-glow"); }
    const w = pQ(".pop-word");
    if (w) w.textContent = pop.kind === "numbers" ? POP_NUM_WORDS[v] : "";
    popMsg("أحسنت! 🌟", "ok");
    const last = pop.round >= POP_ROUNDS - 1;
    const praise = last ? "صحيح" : POP_PRAISE[pop.round % POP_PRAISE.length];
    const go = () => {
        const wait = Math.max(500, 1500 - (Date.now() - t0)) + (pCalm() ? 400 : 0);
        pLater(() => popNext(), wait);
    };
    popSay([key, praise], go);
}

function popWrong(b, v, key) {
    const c = pop.cur;
    const first = !c.tried[v];
    c.tried[v] = true;
    if (first) { pop.mistakes++; pop.hint = Math.min(3, pop.hint + 1); }
    b.classList.remove("wrong");
    void b.offsetWidth;
    b.classList.add("wrong");
    setTimeout(() => b.classList.remove("wrong"), 700);
    popMsg("هذه «" + popDisplay(v) + "»، جرّب بالونة أخرى 💙");
    /* تسمع الطفل ما لمسه ثم تعيد المطلوب ليتعلّم الفرق */
    const tkey = popKey(pop.kind, c.target);
    popSay([key], () => { if (pop.active && !pop.solved && pop.cur === c) popSay([tkey]); });
    popApplyHint(pop.hint);
}

function popClearHints() {
    document.querySelectorAll("#" + pCfg().screen + " .pop-balloon").forEach(x => x.classList.remove("hint", "hint2", "dim"));
    document.querySelectorAll(".pop-finger").forEach(n => n.remove());
}

/* تلميح تدريجي: ١ سماع، ٢ توهّج البالونة الصحيحة، ٣ إخفاء الباقي مع إصبع إرشاد */
function popApplyHint(level) {
    if (!pop.cur || pop.solved) return;
    popClearHints();
    const arena = pQ(".pop-arena");
    if (!arena) return;
    const balloons = Array.from(arena.querySelectorAll(".pop-balloon"));
    const right = balloons.find(x => x.dataset.v === String(pop.cur.target));
    if (!right) return;
    if (level >= 2) right.classList.add("hint");
    if (level >= 3) {
        right.classList.add("hint2");
        balloons.forEach(x => { if (x !== right) x.classList.add("dim"); });
        if (!pCalm()) { const f = pEl("span", "pop-finger", "👆"); f.setAttribute("aria-hidden", "true"); right.appendChild(f); }
    }
}

function popHintBtn() {
    if (!pop.active || pop.view !== "play" || !pop.cur || pop.solved) return;
    pop.hint = Math.min(3, pop.hint + 1);
    if (pop.hint === 1) { popSay([popKey(pop.kind, pop.cur.target)]); popMsg("اسمع جيدًا 👂"); }
    else { popApplyHint(pop.hint); popMsg(pop.hint === 2 ? "انظر إلى البالونة المضيئة 💡" : "المس البالونة التي أشير إليها 👆"); }
}

function popNext() {
    if (!pop.active || !pop.solved) return;
    if (pop.round >= POP_ROUNDS - 1) { popFinishLevel(); return; }
    pop.round++;
    popRound();
}

/* ---------- المؤثرات ---------- */

const POP_CONFETTI = ["#ff6b6b", "#4dabf7", "#51cf66", "#ffd43b", "#b197fc", "#ff922b", "#f783ac"];

/* انفجار نجاح: حلقة + قصاصات + نجوم، قليل ومنظّم، ويُلغى في الوضع الهادئ */
function popBurst(el) {
    if (!el || pCalm()) return;
    const world = pQ(".pop-world");
    if (!world) return;
    const w = world.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2 - w.left, cy = r.top + r.height * 0.4 - w.top;
    const ring = pEl("span", "pop-ring");
    ring.style.left = cx + "px";
    ring.style.top = cy + "px";
    world.appendChild(ring);
    setTimeout(() => ring.remove(), 700);
    for (let i = 0; i < 14; i++) {
        const p = pEl("span", i % 4 === 3 ? "pop-spark-star" : "pop-piece", i % 4 === 3 ? "⭐" : "");
        const ang = (Math.PI * 2 * i) / 14 + Math.random() * 0.35;
        const dist = 70 + Math.random() * 70;
        p.style.left = cx + "px";
        p.style.top = cy + "px";
        p.style.setProperty("--dx", Math.cos(ang) * dist + "px");
        p.style.setProperty("--dy", Math.sin(ang) * dist - 20 + "px");
        p.style.setProperty("--rot", Math.round(Math.random() * 360) + "deg");
        if (i % 4 !== 3) p.style.background = POP_CONFETTI[i % POP_CONFETTI.length];
        p.setAttribute("aria-hidden", "true");
        world.appendChild(p);
        setTimeout(() => p.remove(), 1000);
    }
}

/* نجمة تطير من البالونة إلى عدّاد النجوم */
function popStarFly(from) {
    if (pCalm() || !from || !from.getBoundingClientRect) return;
    const to = pQ(".pop-starpill");
    if (!to) return;
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const s = pEl("span", "pop-ghost-fly", "⭐");
    s.setAttribute("aria-hidden", "true");
    s.style.left = (a.left + a.width / 2 - 20) + "px";
    s.style.top = (a.top + a.height / 3) + "px";
    document.body.appendChild(s);
    const dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 3);
    if (s.animate) {
        const an = s.animate([
            { transform: "translate(0,0) scale(0.6)", opacity: 0 },
            { transform: "translate(0,-30px) scale(1.4)", opacity: 1, offset: 0.25 },
            { transform: "translate(" + dx + "px," + dy + "px) scale(0.8)", opacity: 1, offset: 0.9 },
            { transform: "translate(" + dx + "px," + dy + "px) scale(0.4)", opacity: 0 }
        ], { duration: 900, easing: "ease-in-out" });
        an.onfinish = () => s.remove();
    }
    setTimeout(() => s.remove(), 1200);
}

/* ---------- شاشة الإنجاز ---------- */

function popFinishLevel() {
    const kind = pop.kind;
    const p = popLoad();
    const prev = p[kind].done[pop.level];
    const first = !prev;
    p[kind].done[pop.level] = { n: (prev ? prev.n : 0) + 1, best: prev ? Math.min(prev.best, pop.mistakes) : pop.mistakes };
    p[kind].last = { level: pop.level, mistakes: pop.mistakes };
    popSave(p);
    try {
        if (typeof StudentData !== "undefined" && StudentData.logEvent) {
            StudentData.logEvent({ type: "activity_complete", subject: "games", skill: kind === "letters" ? "pop_letters" : "pop_numbers", activity: "level_" + pop.level, correct: null });
        }
    } catch (e) { /* لا شيء */ }
    const dlg = pQ(".pop-dialog");
    if (!dlg) { popShowLevels(); return; }
    const cfg = pCfg();
    const lv = popLevelCfg();
    const t = dlg.querySelector(".pop-done-text");
    if (t) t.textContent = "أتممت «" + cfg.title + "» — " + lv.name + (first ? " ✨ مستوى جديد!" : "");
    const st = dlg.querySelector(".pop-done-stars");
    if (st) { st.innerHTML = ""; for (let i = 0; i < POP_ROUNDS; i++) { const s = pEl("span", "", "⭐"); s.style.animationDelay = (i * 0.12) + "s"; st.appendChild(s); } }
    const db = dlg.querySelector(".pop-done-balloons");
    if (db) {
        db.innerHTML = "";
        const gl = cfg.hubGlyphs;
        gl.forEach((g, i) => { const bb = popMakeBalloon(g, POP_COLORS[(i * 2 + 1) % POP_COLORS.length], i); bb.tabIndex = -1; bb.disabled = true; db.appendChild(bb); });
    }
    const nx = dlg.querySelector(".pop-done-next");
    if (nx) nx.hidden = pop.level >= cfg.levels.length;
    dlg.hidden = false;
    popSetInert(true);
    popConfettiRain(dlg);
    popBurst(dlg.querySelector(".pop-trophy"));
    popSay([POP_LEVEL_DONE]);
    const focusBtn = (nx && !nx.hidden) ? nx : dlg.querySelector(".pop-done-again");
    if (focusBtn) focusBtn.focus();
}

function popConfettiRain(dlg) {
    if (pCalm()) return;
    for (let i = 0; i < 26; i++) {
        const c = pEl("span", "pop-rain");
        c.style.left = (Math.random() * 100) + "%";
        c.style.background = POP_CONFETTI[i % POP_CONFETTI.length];
        c.style.setProperty("--rd", (2.2 + Math.random() * 1.6).toFixed(2) + "s");
        c.style.setProperty("--rl", (Math.random() * 1.2).toFixed(2) + "s");
        c.style.setProperty("--rx", ((Math.random() - 0.5) * 80).toFixed(0) + "px");
        c.setAttribute("aria-hidden", "true");
        dlg.appendChild(c);
        setTimeout(() => c.remove(), 4200);
    }
}

function popCloseDone() {
    ["letters", "numbers"].forEach(k => {
        const sec = document.getElementById(POP_KINDS[k].screen);
        const dlg = sec && sec.querySelector(".pop-dialog");
        if (dlg) { dlg.hidden = true; dlg.querySelectorAll(".pop-rain").forEach(n => n.remove()); }
    });
    popSetInert(false);
}

function popSetInert(on) {
    ["letters", "numbers"].forEach(k => {
        const sec = document.getElementById(POP_KINDS[k].screen);
        const world = sec && sec.querySelector(".pop-world");
        if (!world) return;
        Array.from(world.children).forEach(c => {
            if (c.classList.contains("pop-dialog")) return;
            if (on && k === pop.kind) c.setAttribute("inert", ""); else c.removeAttribute("inert");
        });
    });
}

/* ---------- ربط الشاشات: تنظيف عند مغادرة اللعبتين ---------- */

const originalShowScreenForPop = showScreen;

showScreen = function (screenId) {
    if (typeof pop !== "undefined" && pop.active && screenId !== POP_KINDS[pop.kind].screen) {
        popTeardown();
        pop.active = false;
    }
    return originalShowScreenForPop.apply(this, arguments);
};

/* واجهات قديمة تُستدعى من HTML */
function repeatBalloonTarget() { popListen(); }
function repeatNumberBalloonTarget() { popListen(); }

window.startBalloonGame = startBalloonGame;
window.exitBalloonGame = exitBalloonGame;
window.startNumberBalloonGame = startNumberBalloonGame;
window.exitNumberBalloonGame = exitNumberBalloonGame;
window.pop = pop;

/* =========================================================
   🔚 نهاية فرقع الحروف والأرقام (الإصدار ٢)
========================================================= */

const RACE_WORD_BANK = {
    "أ": {
        "final": ["فأر", "كأس", "لجأ", "مرفأ", "ملجأ"],
        "isolated": ["أخطبوط", "أذن", "أرنب", "أسد", "أم", "أناناس", "رأس"],
    },
    "ب": {
        "final": ["أرنب", "ثعلب", "حليب", "ذئب", "ذهب", "عنب", "قلب", "كلب", "مكتب", "يلعب"],
        "initial": ["باب", "بحر", "بخيل", "برتقال", "بطة", "بطيخ", "بعض", "بقرة", "بلد", "بلغ", "بنت", "بيت", "ذبابة", "ضابط"],
        "medial": ["أخطبوط", "ثعبان", "جبل", "جبنة", "حقيبة", "خبز", "سبع", "شباك", "صبار", "طباخ", "طبخ", "طبيب", "لبن", "لعبة", "لمبة", "مسبح", "نبي"],
    },
    "ت": {
        "final": ["بنت", "بيت", "زيت", "يخت"],
        "initial": ["برتقال", "تاج", "تفاح", "تمر", "تمساح", "توت", "تين", "هاتف"],
        "medial": ["دفتر", "زيتون", "فتح", "فستان", "كتاب", "مفتاح", "مكتب"],
    },
    "ث": {
        "final": ["حديث", "بحث", "نفث", "يبحث"],
        "initial": ["ثعبان", "ثعلب", "ثلاجة", "ثلج", "ثوم"],
        "medial": ["مثل", "مثلث", "مثير", "تمثال"],
    },
    "ج": {
        "final": ["ثلج", "نضج", "وهج", "دمج"],
        "initial": ["ثلاجة", "جبل", "جبنة", "جرس", "جزر", "جسر", "جلس", "جمل", "جو", "دجاجة", "دراجة", "رجل", "وجه"],
        "medial": ["شجرة", "لجأ", "مسجد", "نجم", "نجمة"],
    },
    "ح": {
        "final": ["فتح", "مسبح", "مسح", "نجح"],
        "initial": ["حديث", "حذاء", "حصان", "حفظ", "حق", "حقيبة", "حليب", "حوت"],
        "medial": ["بحر", "صحن", "لحم", "نحل"],
    },
    "خ": {
        "final": ["بطيخ", "طبخ", "مطبخ", "تاريخ", "شيخ"],
        "initial": ["أخطبوط", "خبز", "خروف", "خس", "خط", "خوخ", "خيار", "خيمة"],
        "medial": ["بخيل", "نخلة", "يخت", "مخزن", "مخدة", "بخور", "سخان"],
    },
    "د": {
        "final": ["أسد", "بلد", "حديث", "صندوق", "ضفدع", "مدرسة", "مسجد", "هدهد", "هدية", "ولد", "يد"],
        "isolated": ["دب", "دجاجة", "دراجة", "دفتر", "دلفين", "ديك", "قرد", "وردة", "وسادة"],
    },
    "ذ": {
        "final": ["حذاء", "نفذ", "منفذ", "تلميذ"],
        "isolated": ["أذن", "ذئب", "ذبابة", "ذراع", "ذهب", "ذيل"],
    },
    "ر": {
        "final": ["بحر", "برتقال", "بقرة", "تمر", "جرس", "جسر", "خروف", "دفتر", "زهرة", "سرير", "شجرة", "شعر", "صافرة", "صقر", "ضرس", "طائرة", "ظرف", "ظفر", "عصير", "غراب", "فراشة", "فراولة", "قرد", "قصر", "قمر", "كرة", "كرز", "كرسي", "نسر", "نمر", "هرم"],
        "isolated": ["أرنب", "جزر", "خيار", "دراجة", "ذراع", "رأس", "رجل", "رمل", "ريشة", "زرافة", "سيارة", "صاروخ", "صبار", "عصفور", "غوريلا", "فأر", "مدرسة", "وردة"],
    },
    "ز": {
        "final": ["جزر", "خبز", "غزالة", "لغز", "كنز", "رمز"],
        "isolated": ["زرافة", "زهرة", "زيت", "زيتون", "زينة", "قفاز", "كرز", "موز"],
    },
    "س": {
        "final": ["جلس", "خس", "شمس", "لبس"],
        "initial": ["أسد", "اسم", "ساعة", "سبع", "سرير", "سفينة", "سماء", "سمكة", "سيارة", "كرسي", "مدرسة", "وسادة", "يوسفي"],
        "medial": ["تمساح", "جسر", "عسل", "غسالة", "فستان", "لسان", "مسبح", "مسجد", "نسر"],
    },
    "ش": {
        "final": ["عطش", "ريش", "نقش", "دهش"],
        "initial": ["شباك", "شجرة", "شعر", "شمس", "شمعة", "شوكة", "فراشة"],
        "medial": ["ريشة", "مشمش", "عشاء", "مشط"],
    },
    "ص": {
        "final": ["قص", "قميص", "مقص", "رخص", "نص", "بص"],
        "initial": ["صاروخ", "صافرة", "صالة", "صبار", "صحن", "صقر", "صندوق"],
        "medial": ["حصان", "عصفور", "عصير", "قصر"],
    },
    "ض": {
        "final": ["بعض", "مريض", "نهض", "ركض"],
        "initial": ["ضابط", "ضرس", "ضفدع", "ضوء"],
        "medial": ["نضج", "خضار", "مضرب", "أخضر", "بيضة"],
    },
    "ط": {
        "final": ["خط", "ضابط", "قط", "بط"],
        "initial": ["طائرة", "طاولة", "طاووس", "طباخ", "طبخ", "طبيب", "طفل"],
        "medial": ["أخطبوط", "بطة", "بطيخ", "عطش"],
    },
    "ظ": {
        "final": ["حفظ", "لفظ", "لحظ", "تلفظ"],
        "initial": ["ظرف", "ظفر", "ظل", "ظبي", "ظاهرة"],
        "medial": ["نظارة", "منظار", "محفظة", "نظيف"],
    },
    "ع": {
        "final": ["سبع", "ربيع", "جميع", "سريع"],
        "initial": ["ساعة", "عسل", "عصفور", "عصير", "عطش", "علم", "عنب", "عين"],
        "medial": ["بعض", "ثعبان", "ثعلب", "شعر", "شمعة", "لعبة", "نعامة", "يلعب"],
    },
    "غ": {
        "final": ["بلغ", "نبغ", "صبغ", "دمغ"],
        "initial": ["غراب", "غزالة", "غسالة", "غوريلا", "غيوم"],
        "medial": ["مغسلة", "صغير", "مغارة", "بغل"],
    },
    "ف": {
        "final": ["كيف", "هاتف", "صف", "كف", "شغف"],
        "initial": ["دفتر", "زرافة", "صافرة", "فأر", "فانوس", "فتح", "فراشة", "فراولة", "فستان", "فيل"],
        "medial": ["تفاح", "حفظ", "دلفين", "سفينة", "ضفدع", "طفل", "ظفر", "عصفور", "قفاز", "مفتاح", "نفذ", "يوسفي"],
    },
    "ق": {
        "final": ["حق", "طريق", "فريق", "علق"],
        "initial": ["قرد", "قص", "قصر", "قفاز", "قلب", "قلم", "قمر", "قميص"],
        "medial": ["برتقال", "بقرة", "حقيبة", "صقر", "مقص"],
    },
    "ك": {
        "final": ["ديك", "ملك", "سمك", "ضحك"],
        "initial": ["شوكة", "كأس", "كتاب", "كرة", "كرز", "كرسي", "كلب", "كيف", "كيك"],
        "medial": ["سمكة", "مكتب", "حكاية", "بكرة", "شكل"],
    },
    "ل": {
        "final": ["بخيل", "جبل", "جمل", "ذيل", "رجل", "رمل", "طفل", "ظل", "عسل", "فيل", "مثل", "نحل"],
        "initial": ["دلفين", "صالة", "طاولة", "غزالة", "غسالة", "فراولة", "لبن", "لجأ", "لحم", "لسان", "لعبة", "لمبة", "ليمون", "ولد"],
        "medial": ["بلد", "بلغ", "ثعلب", "ثلاجة", "ثلج", "جلس", "حليب", "علم", "غوريلا", "قلب", "قلم", "كلب", "ملك", "نخلة", "هلال", "يلعب"],
    },
    "م": {
        "final": ["اسم", "علم", "قلم", "لحم", "نجم"],
        "initial": ["رمل", "مثل", "مدرسة", "مسبح", "مسجد", "مفتاح", "مقص", "مكتب", "ملك", "موز", "نعامة"],
        "medial": ["تمر", "تمساح", "جمل", "خيمة", "سماء", "سمكة", "شمس", "شمعة", "قمر", "قميص", "لمبة", "ليمون", "نجمة", "نمر"],
    },
    "ن": {
        "final": ["تين", "دلفين", "صحن", "عين", "لبن"],
        "initial": ["أرنب", "أناناس", "فانوس", "نبي", "نجم", "نجمة", "نحل", "نخلة", "نسر", "نضج", "نعامة", "نفذ", "نمر"],
        "medial": ["بنت", "جبنة", "زينة", "سفينة", "صندوق", "عنب"],
    },
    "ه": {
        "final": ["وجه", "نبه", "شبه", "انتبه"],
        "initial": ["ذهب", "زهرة", "هاتف", "هدهد", "هدية", "هرم", "هلال"],
        "medial": ["نهر", "ظهر", "شهد", "فهد"],
    },
    "و": {
        "final": ["أخطبوط", "توت", "ثوم", "جو", "حوت", "خوخ", "زيتون", "شوكة", "ضوء", "عصفور", "غوريلا", "غيوم", "فانوس", "ليمون", "موز", "يوسفي", "يويو"],
        "isolated": ["خروف", "صاروخ", "صندوق", "طاولة", "طاووس", "فراولة", "وجه", "وردة", "وسادة", "ولد"],
    },
    "ي": {
        "final": ["كرسي", "نبي", "بني", "صبي"],
        "initial": ["حديث", "ديك", "ذيل", "ريشة", "زيت", "زيتون", "زينة", "سرير", "غوريلا", "هدية", "يخت", "يد", "يلعب", "يوسفي", "يويو"],
        "medial": ["بخيل", "بطيخ", "بيت", "تين", "حقيبة", "حليب", "خيار", "خيمة", "دلفين", "سفينة", "سيارة", "طبيب", "عصير", "عين", "غيوم", "فيل", "قميص", "كيف", "كيك", "ليمون"],
    },
};
/* =========================================================
   🏎️ سباق الحروف ٢ — مستوى مستقل لكل حرف (SEN-friendly)
   =========================================================
   لكل حرف مسار مراحل متدرّج:
     ١ اسمع الحرف  ← ٢ اعرف شكله  ← ٣ اكتشفه في كلمات
     ← (أول الكلمة ← وسطها ← آخرها) أو (منفصل ← آخر) للحروف التي لا تتصل
     ← اختبار الإتقان (٦ جولات، يُتقَن بـ ٥ من ٦ من أول محاولة)
   • اختيار الكلمات ثابت ومحدَّد بالترتيب (RACE_WORD_BANK) ويتناوب مع
     عدد مرات اللعب، لا عشوائية تعليمية؛ والكلمة لا تدخل إلا إذا تحقّق
     برمجيًا أن الحرف يقع فعلًا في الموضع المطلوب ولها تسجيل صوتي.
   • بلا مؤقت يقطع الجولة ولا أرواح ولا عقاب: الخطأ يُخفِت البوابة
     الخاطئة، وبعد خطأين تُضيء الصحيحة (تعلّم بلا خطأ).
   • الصوت: ملفات MP3 المحلية فقط عبر EduAudio، صوت واحد في اللحظة
     (كل جولة تقاطع ما قبلها)، ولا يبدأ التالي قبل انتهاء التشجيع.
   • التقدّم محفوظ لكل حرف ولكل مرحلة (taha_letterrace_v2).
   ========================================================= */

const RACE_NON_CONNECTORS = new Set(["أ", "إ", "آ", "ا", "د", "ذ", "ر", "ز", "و"]);
const RACE_BREAKERS = new Set(["أ", "إ", "آ", "ا", "د", "ذ", "ر", "ز", "و", "ء", "ؤ"]);
const RACE_ALPHABET = ["أ","ب","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ك","ل","م","ن","ه","و","ي"];
const RACE_STORAGE_KEY = "taha_letterrace_v2";
const RACE_MASTERY_PASS = 5;

const RACE_POSITION_TITLES = {
    initial: "الحرف في أول الكلمة",
    medial: "الحرف في وسط الكلمة",
    final: "الحرف في آخر الكلمة",
    isolated: "الحرف منفصلًا"
};
const RACE_POSITION_ICONS = { initial: "▶️", medial: "⏺️", final: "⏹️", isolated: "🔹" };

function raceValidPositionsForLetter(letter) {
    if (RACE_NON_CONNECTORS.has(letter)) return ["isolated", "final"];
    return ["initial", "medial", "final"];
}

function raceShapeForLetterAtPosition(letter, position) {
    const forms = arabicLetterForms[letter];
    if (!forms) return letter;
    return forms[position] || forms.isolated || letter;
}

/* موضع حرف بعينه داخل كلمة (يُحسب من اتصال الحروف الفعلي) */
function raceOccurrencePosition(word, i) {
    const ch = word[i];
    const prev = i > 0 ? word[i - 1] : "";
    const next = i < word.length - 1 ? word[i + 1] : "";
    const connectsBack = !!prev && /^[ء-ي]$/.test(prev) && !RACE_BREAKERS.has(prev);
    const connectsForward = !!next && /^[ء-ي]$/.test(next) && !RACE_BREAKERS.has(ch);
    if (connectsBack && connectsForward) return "medial";
    if (connectsBack) return "final";
    if (connectsForward) return "initial";
    return "isolated";
}

function raceFindOccurrence(word, letter, position) {
    for (let i = 0; i < word.length; i++) {
        if (word[i] === letter && raceOccurrencePosition(word, i) === position) return i;
    }
    return -1;
}

/* كلمات صالحة بترتيب البنك الثابت: الحرف فعلًا في الموضع، ولها تسجيل، ولا يتكرر
   الحرف المطلوب في الكلمة (وإلا ظهر الحرف المخفي في مكان آخر منها وانكشفت الإجابة) */
function raceValidWords(letter, position) {
    const list = (RACE_WORD_BANK[letter] && RACE_WORD_BANK[letter][position]) || [];
    return list.filter(w =>
        raceFindOccurrence(w, letter, position) >= 0 &&
        Array.from(w).filter(c => c === letter).length === 1 &&
        EduAudio.has(w));
}

function racePickWord(letter, position, offset, used) {
    const list = raceValidWords(letter, position);
    if (!list.length) return null;
    for (let k = 0; k < list.length; k++) {
        const w = list[(offset + k) % list.length];
        if (!used.has(w)) return w;
    }
    return list[offset % list.length];
}

function raceLetterOrder() {
    const out = [];
    LETTER_LEVEL_GROUPS.forEach(g => g.letters.forEach(l => { if (!out.includes(l)) out.push(l); }));
    return out.length ? out : RACE_ALPHABET.slice();
}

/* ---------- المراحل ---------- */

function raceStagesFor(letter) {
    const P = raceValidPositionsForLetter(letter);
    const stages = [
        { id: "hear", icon: "🎧", title: "اسمع الحرف", kind: "hear", rounds: 3, positions: ["isolated"] },
        { id: "see", icon: "👀", title: "اعرف شكله", kind: "see", rounds: 3, positions: ["isolated"] },
        { id: "words", icon: "🔎", title: "اكتشفه في كلمات", kind: "word", rounds: 4, positions: P }
    ];
    P.forEach(pos => {
        stages.push({ id: "pos_" + pos, icon: RACE_POSITION_ICONS[pos], title: RACE_POSITION_TITLES[pos], kind: "word", rounds: 3, positions: [pos] });
    });
    stages.push({ id: "mastery", icon: "🏆", title: "اختبار الإتقان", kind: "mastery", rounds: 6, positions: P });
    return stages;
}

/* ---------- المشتتات (حتمية، تدور بحسب البذرة) ---------- */

function raceRotate(arr, k) {
    if (!arr.length) return arr;
    const n = arr.length, s = ((k % n) + n) % n;
    return arr.map((_, i) => arr[(i + s) % n]);
}

function raceDistractorShapes(letter, position, count, hard, seed) {
    const correct = raceShapeForLetterAtPosition(letter, position);
    const similar = ((typeof LTR_SIMILAR_LETTERS !== "undefined" && LTR_SIMILAR_LETTERS[letter]) || []).filter(l => l !== letter);
    const needsConnector = position === "initial" || position === "medial";
    const eligible = RACE_ALPHABET.filter(l => l !== letter && (!needsConnector || !RACE_NON_CONNECTORS.has(l)));
    const sim = eligible.filter(l => similar.includes(l));
    const far = eligible.filter(l => !similar.includes(l));
    const order = hard
        ? raceRotate(sim, seed).concat(raceRotate(far, seed * 3))
        : raceRotate(far, seed * 3).concat(raceRotate(sim, seed));
    const shapes = [];
    order.forEach(l => {
        if (shapes.length >= count) return;
        const s = raceShapeForLetterAtPosition(l, position);
        if (s && s !== correct && !shapes.includes(s)) shapes.push(s);
    });
    return shapes;
}

/* ---------- بناء جولات المرحلة ---------- */

function raceBuildRounds(letter, stage, seed) {
    const rounds = [];
    const used = new Set();
    const P = stage.positions;
    for (let r = 0; r < stage.rounds; r++) {
        let kind = stage.kind === "mastery" ? "word" : stage.kind;
        let position = (kind === "hear" || kind === "see") ? "isolated" : P[r % P.length];
        let word = null, occ = -1;
        if (kind === "word") {
            word = racePickWord(letter, position, seed + r, used);
            if (word) { used.add(word); occ = raceFindOccurrence(word, letter, position); }
            else { kind = "see"; position = "isolated"; }
        }
        const hard = stage.kind === "mastery" ? true
            : kind === "hear" ? false
            : kind === "see" ? r >= 1
            : stage.id === "words" ? r >= 2 : r >= 1;
        const gateCount = kind === "hear" ? 2 : 3;
        const correctShape = raceShapeForLetterAtPosition(letter, position);
        const distract = raceDistractorShapes(letter, position, gateCount - 1, hard, seed + r);
        const correctIndex = (seed + r) % (distract.length + 1);
        const options = distract.slice();
        options.splice(correctIndex, 0, correctShape);
        rounds.push({ kind, letter, position, word, occ, options, correctShape, correctIndex: options.indexOf(correctShape), wrong: 0, hinted: false, firstTry: false });
    }
    return rounds;
}

/* ---------- التقدّم المحفوظ ---------- */

function raceIsObj(x) { return !!x && typeof x === "object" && !Array.isArray(x); }

/* يقبل أي سجل محفوظ ويُرجع نسخة سليمة البنية: الإدخال السليم يبقى كما هو،
   وما كان تالفًا (null أو نوع خاطئ) يُستبدل بقيمة فارغة فقط دون لمس بقية السجل */
function raceNormalizeProgress(p) {
    const out = { v: 2, letters: {}, lastLetter: (p && typeof p.lastLetter === "string") ? p.lastLetter : null };
    if (p && p.migratedV1 === true) out.migratedV1 = true;
    const src = (p && raceIsObj(p.letters)) ? p.letters : {};
    Object.keys(src).forEach(l => {
        const e = src[l];
        if (!raceIsObj(e)) return;
        const stages = {};
        if (raceIsObj(e.stages)) {
            Object.keys(e.stages).forEach(id => {
                const r = e.stages[id];
                if (!raceIsObj(r)) return;
                const rec = { done: r.done === true, stars: Math.max(0, Math.min(3, Number(r.stars) || 0)), plays: Math.max(0, Number(r.plays) || 0) };
                if (r.migrated === true) rec.migrated = true;
                stages[id] = rec;
            });
        }
        const m = raceIsObj(e.mastery) ? e.mastery : {};
        out.letters[l] = {
            stages: stages,
            mastery: {
                passed: m.passed === true,
                best: Math.max(0, Number(m.best) || 0),
                stars: Math.max(0, Math.min(3, Number(m.stars) || 0)),
                attempts: Math.max(0, Number(m.attempts) || 0)
            }
        };
    });
    return out;
}

/* ترحيل لمرة واحدة من السباق القديم (taha_letterrace_unlocked_level = 1..4).
   المستوى N المفتوح يعني أن المجموعات ١..N-١ أُنجزت. للحروف فيها فقط تُعدّ مرحلتا
   «اسمع الحرف» و«اعرف شكله» منجزتين بنجمة واحدة (تُفتح بعدهما «اكتشفه في كلمات»).
   لا إتقان أبدًا، ولا تُعدَّل مرحلة مُنجزة أصلًا، ولا يُكتب في المفتاح القديم. */
function raceMigrateLegacy(p) {
    if (p.migratedV1 === true) return false;
    p.migratedV1 = true;
    let level = 0;
    try { level = parseInt(localStorage.getItem("taha_letterrace_unlocked_level"), 10); } catch (e) { level = 0; }
    if (!(level >= 2 && level <= 4)) return true;
    if (typeof LETTER_LEVEL_GROUPS === "undefined") { delete p.migratedV1; return false; }
    LETTER_LEVEL_GROUPS.slice(0, level - 1).forEach(g => g.letters.forEach(l => {
        const e = raceLetterEntry(p, l);
        ["hear", "see"].forEach(id => {
            if (!(e.stages[id] && e.stages[id].done)) e.stages[id] = { done: true, stars: 1, plays: 0, migrated: true };
        });
    }));
    return true;
}

function raceLoadProgress() {
    let p = null, corrupt = false, raw = null;
    try {
        raw = localStorage.getItem(RACE_STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (raceIsObj(parsed) && parsed.v === 2) p = raceNormalizeProgress(parsed);
                else corrupt = true;
            } catch (e) { corrupt = true; }
        }
    } catch (e) { /* لا شيء */ }
    if (corrupt && raw) {
        /* نسخة احتياطية مرة واحدة قبل أن يُكتب فوق سجل غير مفهوم */
        try { if (!localStorage.getItem(RACE_STORAGE_KEY + "_corrupt_backup")) localStorage.setItem(RACE_STORAGE_KEY + "_corrupt_backup", raw); } catch (e) { /* لا شيء */ }
    }
    if (!p) p = { v: 2, letters: {}, lastLetter: null };
    if (raceMigrateLegacy(p)) raceSaveProgress(p);
    return p;
}

function raceSaveProgress(p) {
    try { localStorage.setItem(RACE_STORAGE_KEY, JSON.stringify(p)); } catch (e) { /* لا شيء */ }
}

function raceLetterEntry(p, letter) {
    if (!p.letters[letter]) p.letters[letter] = { stages: {}, mastery: { passed: false, best: 0, stars: 0, attempts: 0 } };
    return p.letters[letter];
}

function raceStageDone(entry, id) { return !!(entry && entry.stages && entry.stages[id] && entry.stages[id].done); }

function raceLetterSummary(letter) {
    const p = raceLoadProgress();
    const e = p.letters[letter];
    const stages = raceStagesFor(letter);
    const done = e ? stages.filter(s => raceStageDone(e, s.id)).length : 0;
    return { done, total: stages.length, mastered: !!(e && e.mastery && e.mastery.passed), stars: e && e.mastery ? e.mastery.stars : 0, started: done > 0 };
}

function raceRecommendedLetter() {
    const order = raceLetterOrder();
    for (const l of order) { if (!raceLetterSummary(l).mastered) return l; }
    return order[0];
}

/* ---------- حالة اللعبة ---------- */

const letterRaceGame = {
    letter: null,
    stages: [],
    stageIdx: 0,
    rounds: [],
    roundIdx: -1,
    cur: null,
    target: null,
    targetPosition: null,
    targetWord: null,
    gates: [],
    selectedLane: 0,
    isRunning: false,
    answered: false,
    session: 0,
    score: 0,
    firstTryCount: 0,
    timers: []
};

function raceSchedule(fn, ms) {
    const session = letterRaceGame.session;
    const id = setTimeout(() => {
        letterRaceGame.timers = letterRaceGame.timers.filter(t => t !== id);
        if (session !== letterRaceGame.session) return;
        fn();
    }, ms);
    letterRaceGame.timers.push(id);
    return id;
}

function raceClearTimers() {
    letterRaceGame.timers.forEach(t => clearTimeout(t));
    letterRaceGame.timers = [];
}

/* صوت واحد في اللحظة: يقاطع ما قبله، ثم done مرة واحدة فقط (مع مهلة أمان) */
function raceSay(what, done, maxMs) {
    const session = letterRaceGame.session;
    let fired = false;
    const fin = () => {
        if (fired || session !== letterRaceGame.session) return;
        fired = true;
        if (done) done();
    };
    if (typeof EduAudio === "undefined") { fin(); return; }
    EduAudio.play(what, { mode: "interrupt", done: fin });
    if (done) raceSchedule(fin, maxMs || 4500);
}

/* =========================================================
   🗺️ شاشة الحروف ومراحل كل حرف
   ========================================================= */

function openLetterRaceMap() {
    showScreen("letterRaceMap");
    renderRaceMap();
}

function leaveLetterRaceMap() {
    showScreen("games");
}

function raceMapShow(view) {
    const grid = $("raceMapView"), st = $("raceStageView");
    if (grid) grid.style.display = view === "grid" ? "block" : "none";
    if (st) st.style.display = view === "stages" ? "block" : "none";
}

function raceStarsText(n, max) {
    max = max || 3;
    return "★".repeat(Math.max(0, n)) + "☆".repeat(Math.max(0, max - n));
}

function renderRaceMap() {
    raceMapShow("grid");
    const order = raceLetterOrder();
    const rec = raceRecommendedLetter();
    let mastered = 0;
    const cards = order.map(l => {
        const s = raceLetterSummary(l);
        if (s.mastered) mastered++;
        const cls = "race-map-card" + (s.mastered ? " mastered" : "") + (l === rec ? " recommended" : "") + (s.started && !s.mastered ? " started" : "");
        const badge = s.mastered ? "🏅" : (l === rec ? "▶" : "");
        return `<button type="button" class="${cls}" data-letter="${l}" onclick="openRaceLetter('${l}')" aria-label="الحرف ${l}، أنجزت ${s.done} من ${s.total} مراحل">
            <span class="race-map-badge">${badge}</span>
            <span class="race-map-letter">${l}</span>
            <span class="race-map-stars">${raceStarsText(s.stars)}</span>
            <span class="race-map-count">${arabicNumber(s.done)}/${arabicNumber(s.total)}</span>
        </button>`;
    }).join("");
    const grid = $("raceMapGrid");
    if (grid) grid.innerHTML = cards;
    const sum = $("raceMapSummary");
    if (sum) sum.textContent = `أتقنتَ ${arabicNumber(mastered)} من ${arabicNumber(order.length)} حرفًا`;
    const cont = $("raceMapContinue");
    if (cont) {
        cont.textContent = `▶ تابع حرف ${rec}`;
        cont.onclick = () => openRaceLetter(rec);
    }
}

function openRaceLetter(letter) {
    letterRaceGame.letter = letter;
    const p = raceLoadProgress();
    p.lastLetter = letter;
    raceSaveProgress(p);
    renderRaceStages();
    if (!$("letterRaceMap").classList.contains("active")) showScreen("letterRaceMap");
    raceMapShow("stages");
}

function renderRaceStages() {
    const letter = letterRaceGame.letter;
    const stages = raceStagesFor(letter);
    const p = raceLoadProgress();
    const entry = p.letters[letter] || { stages: {}, mastery: { passed: false, best: 0, stars: 0, attempts: 0 } };
    const title = $("raceStageLetter");
    if (title) title.textContent = letter;
    const forms = $("raceStageForms");
    if (forms) {
        const F = arabicLetterForms[letter] || {};
        const parts = [];
        if (!RACE_NON_CONNECTORS.has(letter)) { parts.push(["أول", F.initial]); parts.push(["وسط", F.medial]); }
        parts.push(["آخر", F.final]); parts.push(["منفصل", F.isolated]);
        forms.innerHTML = parts.filter(x => x[1]).map(x => `<span class="race-form-chip"><b>${x[1]}</b><small>${x[0]}</small></span>`).join("");
    }
    const list = $("raceStageList");
    if (!list) return;
    let prevDone = true;
    list.innerHTML = stages.map((s, i) => {
        const done = raceStageDone(entry, s.id);
        const open = i === 0 || prevDone;
        prevDone = done;
        const st = entry.stages[s.id];
        const starsN = s.id === "mastery" ? (entry.mastery.stars || 0) : (st && st.stars) || 0;
        const state = done ? "done" : (open ? "open" : "locked");
        const mark = done ? "✅" : (open ? "▶" : "🔒");
        return `<button type="button" class="race-stage-btn ${state}" data-stage="${s.id}" ${open ? "" : "disabled"} onclick="startRaceStage('${letter}', ${i})">
            <span class="race-stage-no">${arabicNumber(i + 1)}</span>
            <span class="race-stage-icon">${s.icon}</span>
            <span class="race-stage-name">${s.title}</span>
            <span class="race-stage-stars">${done ? raceStarsText(starsN) : ""}</span>
            <span class="race-stage-mark">${mark}</span>
        </button>`;
    }).join("");
}

function raceBackFromStages() {
    renderRaceMap();
}

/* =========================================================
   ▶️ بدء مرحلة
   ========================================================= */

function startLetterRace() {
    openLetterRaceMap();
}

function startRaceStage(letter, stageIdx) {
    const stages = raceStagesFor(letter);
    const stage = stages[stageIdx];
    if (!stage) return;

    const p = raceLoadProgress();
    const entry = raceLetterEntry(p, letter);
    const plays = (entry.stages[stage.id] && entry.stages[stage.id].plays) || 0;
    const order = raceLetterOrder();
    const seed = plays * 3 + (order.indexOf(letter) % 3);

    raceClearTimers();
    letterRaceGame.session++;
    letterRaceGame.letter = letter;
    letterRaceGame.stages = stages;
    letterRaceGame.stageIdx = stageIdx;
    letterRaceGame.rounds = raceBuildRounds(letter, stage, seed);
    letterRaceGame.roundIdx = -1;
    letterRaceGame.cur = null;
    letterRaceGame.isRunning = false;
    letterRaceGame.answered = false;
    letterRaceGame.score = 0;
    letterRaceGame.firstTryCount = 0;

    showScreen("letterRaceGame");

    const overlay = $("letterRaceLevelComplete");
    if (overlay) overlay.style.display = "none";

    setupLetterRaceControls();
    renderRaceStageBar();
    updateLetterRaceHUD();
    clearLetterRaceMessage();

    raceSchedule(() => startLetterRaceRound(), 200);
}

function renderRaceStageBar() {
    const g = letterRaceGame;
    const lv = $("letterRaceLevel");
    if (lv) lv.textContent = g.letter || "";
    const nm = $("raceStageName");
    const stage = g.stages[g.stageIdx];
    if (nm && stage) nm.textContent = stage.icon + " " + stage.title;
    const chips = $("raceStageChips");
    if (chips) {
        const p = raceLoadProgress();
        const e = p.letters[g.letter];
        chips.innerHTML = g.stages.map((s, i) => `<span class="race-chip ${i === g.stageIdx ? "current" : (raceStageDone(e, s.id) ? "done" : "")}"></span>`).join("");
    }
}

/* =========================================================
   🔄 جولة جديدة
   ========================================================= */

/* الشاشة الحالية هي شاشة السباق؟ (وإلا فالطفل غادرها بطريق آخر غير زر الرجوع) */
function raceScreenActive() {
    const el = $("letterRaceGame");
    return !!(el && el.classList.contains("active"));
}

/* إنهاء اللعبة بصمت عند مغادرة الشاشة: لا جولة تالية ولا صوت ولا تمرير في الخلفية */
function raceAbortInBackground() {
    letterRaceGame.isRunning = false;
    letterRaceGame.answered = true;
    letterRaceGame.session++;
    raceClearTimers();
    document.removeEventListener("keydown", handleLetterRaceKeyboard);
}

function startLetterRaceRound() {

    if (!raceScreenActive()) { raceAbortInBackground(); return; }

    letterRaceGame.roundIdx++;
    letterRaceGame.answered = false;

    if (letterRaceGame.roundIdx >= letterRaceGame.rounds.length) {
        finishRaceStage();
        return;
    }

    const round = letterRaceGame.rounds[letterRaceGame.roundIdx];
    letterRaceGame.cur = round;
    letterRaceGame.target = round.letter;
    letterRaceGame.targetPosition = round.position;
    letterRaceGame.targetWord = round.word;

    updateLetterRaceHUD();
    clearLetterRaceMessage();
    renderRaceCommand(round);
    createLetterRaceGates(round);
    raceScrollToPlay();
    speakRaceRoundIntro();
}

/* يُظهر الأمر والمضمار والبوابات والأزرار معًا دون تمرير يدوي من الطفل */
function raceScrollToPlay() {
    try {
        const cmd = document.querySelector("#letterRaceGame .letter-race-command");
        if (!cmd) return;
        const top = cmd.getBoundingClientRect().top + window.scrollY - 8;
        window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    } catch (e) { /* لا شيء */ }
}

function renderRaceCommand(round) {
    const badge = $("raceCommandBadge"), label = $("raceCommandLabel"), listen = $("raceListenLabel");
    const target = $("letterRaceTarget");
    if (target) { target.classList.remove("race-word-blank-filled", "race-sound-icon", "race-letter-show"); }
    if (round.kind === "hear") {
        if (badge) badge.textContent = "🎧 اسمع الحرف";
        if (label) label.textContent = "اسمع الصوت ثم اختر الحرف";
        if (listen) listen.textContent = "اسمع الحرف";
        if (target) { target.textContent = "🔊"; target.classList.add("race-sound-icon"); }
    } else if (round.kind === "see") {
        if (badge) badge.textContent = "👀 انظر";
        if (label) label.textContent = "اختر الحرف المطابق";
        if (listen) listen.textContent = "اسمع الحرف";
        if (target) { target.textContent = round.correctShape; target.classList.add("race-letter-show"); }
    } else {
        if (badge) badge.textContent = "🎧 اسمع واختر";
        if (label) label.textContent = "أكمل الكلمة";
        if (listen) listen.textContent = "اسمع الكلمة";
        renderRaceWordWithBlank(round.word, round.letter, round.position, round.occ);
    }
}

const RACE_TATWEEL = "ـ";

function renderRaceWordWithBlank(word, letter, position, occ) {

    const container = $("letterRaceTarget");
    if (!container) return;

    if (!word) {
        container.textContent = letterWithFatha(letter);
        return;
    }

    const index = (typeof occ === "number" && occ >= 0) ? occ : word.indexOf(letter);
    if (index === -1) {
        container.textContent = word;
        return;
    }

    let before = word.slice(0, index);
    let after = word.slice(index + 1);

    if ((position === "medial" || position === "final") && before) before = before + RACE_TATWEEL;
    if ((position === "medial" || position === "initial") && after) after = RACE_TATWEEL + after;

    container.innerHTML = "";

    const beforeSpan = document.createElement("span");
    beforeSpan.textContent = before;
    container.appendChild(beforeSpan);

    const blank = document.createElement("span");
    blank.className = "race-word-blank";
    blank.id = "raceWordBlank";
    blank.textContent = "";
    container.appendChild(blank);

    const afterSpan = document.createElement("span");
    afterSpan.textContent = after;
    container.appendChild(afterSpan);
}

function fillRaceWordBlank() {
    const container = $("letterRaceTarget");
    if (!container) return;
    const round = letterRaceGame.cur;
    if (round && round.kind === "word" && round.word) {
        container.textContent = round.word;
    } else if (round && round.kind === "see") {
        container.textContent = round.correctShape;
    } else if (round && round.kind === "hear") {
        container.textContent = round.correctShape;
        container.classList.remove("race-sound-icon");
        container.classList.add("race-letter-show");
    }
    container.classList.add("race-word-blank-filled");
}

/* =========================================================
   🚪 البوابات
   ========================================================= */

function createLetterRaceGates(round) {

    const container = $("letterRaceOptions");
    if (!container) return;

    const options = round.options;
    letterRaceGame.gates = options;

    container.innerHTML = "";
    container.className = "letter-race-gates";

    options.forEach((shape, index) => {

        const gate = document.createElement("button");
        gate.type = "button";
        gate.className = "letter-race-gate";
        gate.dataset.index = String(index);
        gate.dataset.shape = shape;
        gate.dataset.correct = shape === round.correctShape ? "1" : "0";
        gate.setAttribute("aria-label", `بوابة الشكل ${shape}`);

        gate.style.left = `${((index + 0.5) / options.length) * 100}%`;
        gate.style.top = "50%";
        gate.style.transform = "translate(-50%, -50%)";

        gate.innerHTML = `
            <div class="gate-roof">🏁</div>
            <div class="gate-letter">${shape}</div>
            <div class="gate-base">🚦</div>
        `;

        gate.addEventListener("click", () => submitRaceGate(index));

        container.appendChild(gate);
    });

    letterRaceGame.selectedLane = Math.min(1, options.length - 1);
    moveLetterRaceCarToLane(letterRaceGame.selectedLane, false);
    highlightLetterRaceSelectedGate();

    letterRaceGame.isRunning = true;
}

/* اختيار بوابة: يُقفَل الإدخال فورًا (نقرتان سريعتان لا تُحسبان معًا)،
   تتحرك السيارة، ثم يُقيَّم الاختيار نفسه بعد لحظة قصيرة */
function submitRaceGate(index) {

    if (!letterRaceGame.isRunning || letterRaceGame.answered) return;

    const gates = document.querySelectorAll("#letterRaceOptions .letter-race-gate");
    const gate = gates[index];
    if (!gate || gate.classList.contains("dimmed")) return;

    letterRaceGame.answered = true;
    letterRaceGame.selectedLane = index;
    moveLetterRaceCarToLane(index, true);
    highlightLetterRaceSelectedGate();

    raceSchedule(() => {
        if (gate.dataset.correct === "1") {
            handleLetterRaceCorrect(gate);
        } else {
            handleLetterRaceWrong(gate);
        }
    }, 150);
}

function checkLetterRaceGate() {
    submitRaceGate(letterRaceGame.selectedLane);
}

/* =========================================================
   ✅ إجابة صحيحة
   ========================================================= */

const RACE_SUCCESS_PHRASES = ["أحسنت يا بطل", "أحسنت، عمل رائع", "صحيح"];

function handleLetterRaceCorrect(gate) {

    const round = letterRaceGame.cur;
    letterRaceGame.isRunning = false;

    if (gate) {
        gate.classList.remove("selected", "hint");
        gate.classList.add("correct");
    }

    const car = $("letterRaceCar");
    if (car) {
        car.classList.remove("race-crash");
        car.classList.add("race-success");
    }

    fillRaceWordBlank();

    const first = round && round.wrong === 0;
    if (round) round.firstTry = !!first;
    if (first) {
        letterRaceGame.firstTryCount++;
        if (typeof addStars === "function") addStars(1);
    }
    letterRaceGame.score++;

    createLetterRaceConfetti();
    createLetterRaceStarExplosion();

    const phrase = RACE_SUCCESS_PHRASES[(letterRaceGame.roundIdx + letterRaceGame.stageIdx) % RACE_SUCCESS_PHRASES.length];
    showLetterRaceMessage("🎉 " + phrase);
    updateLetterRaceHUD(true);

    /* التشجيع كاملًا، ثم وقفة قصيرة، ثم الجولة التالية — بلا تداخل */
    raceSay(phrase, () => {
        raceSchedule(() => {
            if (car) {
                car.classList.remove("race-success");
                car.style.transform = "translateX(-50%)";
            }
            startLetterRaceRound();
        }, 450);
    }, 4000);
}

/* =========================================================
   😊 إجابة خاطئة — تعلّم بلا خطأ: تُخفَّت الخاطئة، وبعد خطأين
   تُضيء الصحيحة. لا خصم ولا نهاية للجولة.
   ========================================================= */

function handleLetterRaceWrong(gate) {

    const round = letterRaceGame.cur;
    if (round) round.wrong++;

    if (gate) {
        gate.classList.add("wrong");
        gate.classList.add("dimmed");
    }

    const car = $("letterRaceCar");
    if (car) car.classList.add("race-crash");

    showLetterRaceMessage("😊 حاول مرة أخرى");

    const hint = round && round.wrong >= 2;
    if (hint && !round.hinted) {
        round.hinted = true;
        const right = document.querySelector('#letterRaceOptions .letter-race-gate[data-correct="1"]');
        if (right) right.classList.add("hint");
    }

    const again = () => { if (hint) speakRaceRoundIntro(); };
    raceSay("حاول مرة أخرى", again, 3000);

    raceSchedule(() => {
        if (gate) gate.classList.remove("wrong");
        if (car) car.classList.remove("race-crash");
        letterRaceGame.answered = false;
        /* ضع السيارة على أول بوابة غير مُخفَّتة */
        const gates = document.querySelectorAll("#letterRaceOptions .letter-race-gate");
        let lane = -1;
        gates.forEach((g, i) => { if (lane < 0 && !g.classList.contains("dimmed")) lane = i; });
        if (lane >= 0) {
            letterRaceGame.selectedLane = lane;
            moveLetterRaceCarToLane(lane, true);
            highlightLetterRaceSelectedGate();
        }
    }, 700);
}

/* =========================================================
   🏁 نهاية المرحلة
   ========================================================= */

function raceStageStars(rounds, firstTry) {
    if (firstTry >= rounds) return 3;
    if (firstTry >= Math.ceil(rounds * 2 / 3)) return 2;
    return 1;
}

function finishRaceStage() {

    if (!raceScreenActive()) { raceAbortInBackground(); return; }

    letterRaceGame.isRunning = false;

    const g = letterRaceGame;
    const stage = g.stages[g.stageIdx];
    const total = g.rounds.length;
    const ft = g.firstTryCount;
    const isMastery = stage.id === "mastery";
    const p = raceLoadProgress();
    const entry = raceLetterEntry(p, g.letter);
    const rec = entry.stages[stage.id] || { done: false, stars: 0, plays: 0 };
    rec.plays = (rec.plays || 0) + 1;

    let passed = true, starsEarned;
    if (isMastery) {
        entry.mastery.attempts = (entry.mastery.attempts || 0) + 1;
        entry.mastery.best = Math.max(entry.mastery.best || 0, ft);
        passed = ft >= RACE_MASTERY_PASS;
        starsEarned = passed ? (ft >= total ? 3 : 2) : 0;
        if (passed) {
            entry.mastery.passed = true;
            entry.mastery.stars = Math.max(entry.mastery.stars || 0, starsEarned);
            rec.done = true;
            rec.stars = entry.mastery.stars;
        }
    } else {
        starsEarned = raceStageStars(total, ft);
        rec.done = true;
        rec.stars = Math.max(rec.stars || 0, starsEarned);
    }
    entry.stages[stage.id] = rec;
    p.lastLetter = g.letter;
    raceSaveProgress(p);
    renderRaceStageBar();

    const overlay = $("letterRaceLevelComplete");
    const titleEl = $("letterRaceLevelCompleteTitle");
    const bodyEl = $("letterRaceLevelCompleteBody");
    const starsEl = $("letterRaceLevelCompleteStars");
    const nextBtn = $("letterRaceLevelCompleteNextBtn");
    const mapBtn = $("letterRaceLevelCompleteMapBtn");
    const lastStage = g.stageIdx >= g.stages.length - 1;

    let phrase = "أحسنت! أكملت المستوى بنجاح";
    if (isMastery && passed) {
        if (titleEl) titleEl.textContent = `🏅 أتقنتَ حرف ${g.letter}!`;
        if (bodyEl) bodyEl.textContent = `أجبتَ ${arabicNumber(ft)} من ${arabicNumber(total)} من أول مرة`;
        if (nextBtn) { nextBtn.textContent = "🗺️ اختر حرفًا آخر"; nextBtn.onclick = raceGoToMap; }
        if (mapBtn) mapBtn.style.display = "none";
        createLetterRaceConfetti();
    } else if (isMastery) {
        if (titleEl) titleEl.textContent = "💪 قريب جدًا!";
        if (bodyEl) bodyEl.textContent = `أجبتَ ${arabicNumber(ft)} من ${arabicNumber(total)} من أول مرة. نتدرّب قليلًا ثم نحاول مرة أخرى`;
        if (nextBtn) { nextBtn.textContent = "🔁 أعد الاختبار"; nextBtn.onclick = () => startRaceStage(g.letter, g.stageIdx); }
        if (mapBtn) { mapBtn.style.display = ""; mapBtn.textContent = "🗺️ مراحل الحرف"; }
        phrase = "حاول مرة أخرى";
    } else {
        if (titleEl) titleEl.textContent = "🌟 أحسنت! أكملت المرحلة";
        if (bodyEl) bodyEl.textContent = `${stage.title} — ${arabicNumber(ft)} من ${arabicNumber(total)} من أول مرة`;
        if (nextBtn) {
            nextBtn.textContent = "▶ المرحلة التالية";
            nextBtn.onclick = () => startRaceStage(g.letter, g.stageIdx + 1);
        }
        if (mapBtn) { mapBtn.style.display = ""; mapBtn.textContent = "🗺️ مراحل الحرف"; }
    }
    if (starsEl) starsEl.textContent = isMastery && !passed ? "" : raceStarsText(starsEarned);
    if (overlay) overlay.style.display = "flex";

    raceSay(phrase);
}

function raceGoToMap() {
    exitLetterRace(true);
}

/* =========================================================
   🖥️ واجهة المعلومات (HUD)
   ========================================================= */

function updateLetterRaceHUD(afterCorrect) {

    const total = letterRaceGame.rounds.length || 1;

    const roundEl = $("letterRaceRound");
    if (roundEl) roundEl.textContent = arabicNumber(Math.max(1, Math.min(letterRaceGame.roundIdx + 1, total)));

    const totalEl = $("letterRaceTotalRounds");
    if (totalEl) totalEl.textContent = arabicNumber(total);

    const scoreEl = $("letterRaceScore");
    if (scoreEl && typeof stars !== "undefined") scoreEl.textContent = arabicNumber(stars);

    const fill = $("letterRaceProgressFill");
    if (fill) {
        const completed = afterCorrect ? letterRaceGame.roundIdx + 1 : Math.max(0, letterRaceGame.roundIdx);
        const pct = Math.min(100, Math.round((completed / total) * 100));
        fill.style.width = pct + "%";
    }
}

function showLetterRaceMessage(text) {
    const el = $("letterRaceMessage");
    if (el) el.textContent = text;
}

function clearLetterRaceMessage() {
    const el = $("letterRaceMessage");
    if (el) el.textContent = "";
}

/* =========================================================
   🔊 نطق الجولة (الحرف أو الكلمة) + إعادة الاستماع
   ========================================================= */

function speakRaceRoundIntro() {
    const round = letterRaceGame.cur;
    if (!round || !raceScreenActive()) return;
    if (round.kind === "word" && round.word && EduAudio.has(round.word)) {
        EduAudio.play(round.word, { mode: "interrupt" });
    } else {
        EduAudio.play(letterWithFatha(round.letter), { mode: "interrupt" });
    }
}

function repeatLetterRaceTarget() {
    if (!letterRaceGame.cur) return;
    speakRaceRoundIntro();
}

/* =========================================================
   🚗 الحركة والتحكم
   ========================================================= */

function moveLetterRaceCarToLane(lane, animate) {

    const car = $("letterRaceCar");
    if (!car) return;

    const totalLanes = Math.max(1, letterRaceGame.gates.length);
    const lanePercent = ((lane + 0.5) / totalLanes) * 100;

    car.style.transition = animate ? "left .25s ease" : "none";
    car.style.left = lanePercent + "%";
}

function moveLetterRaceCar(direction) {

    if (!letterRaceGame.isRunning || letterRaceGame.answered) return;

    const gatesEls = document.querySelectorAll("#letterRaceOptions .letter-race-gate");
    const total = letterRaceGame.gates.length;
    let lane = letterRaceGame.selectedLane + direction;
    /* تخطَّ البوابات المُخفَّتة */
    while (lane >= 0 && lane < total && gatesEls[lane] && gatesEls[lane].classList.contains("dimmed")) lane += direction;
    if (lane < 0 || lane >= total) return;

    letterRaceGame.selectedLane = lane;
    moveLetterRaceCarToLane(lane, true);
    highlightLetterRaceSelectedGate();
}

function highlightLetterRaceSelectedGate() {
    const gates = document.querySelectorAll("#letterRaceOptions .letter-race-gate");
    gates.forEach((gate, index) => {
        gate.classList.toggle("selected", index === letterRaceGame.selectedLane);
    });
}

function handleLetterRaceKeyboard(event) {
    if (!$("letterRaceGame") || !$("letterRaceGame").classList.contains("active")) return;

    if (event.key === "ArrowRight") { moveLetterRaceCar(1); event.preventDefault(); }
    else if (event.key === "ArrowLeft") { moveLetterRaceCar(-1); event.preventDefault(); }
    else if (event.key === "Enter" || event.key === " ") { letterRaceSelect(); event.preventDefault(); }
}

function setupLetterRaceControls() {
    document.removeEventListener("keydown", handleLetterRaceKeyboard);
    document.addEventListener("keydown", handleLetterRaceKeyboard);
}

function letterRaceLeft() { moveLetterRaceCar(-1); }
function letterRaceRight() { moveLetterRaceCar(1); }

function letterRaceSelect() {
    submitRaceGate(letterRaceGame.selectedLane);
}

/* =========================================================
   🎉 المؤثرات البصرية (قصيرة وهادئة؛ الوضع الهادئ يعطّل الكونفيتي)
   ========================================================= */

function createLetterRaceConfetti() {
    const effects = $("raceEffects");
    if (!effects) return;
    effects.innerHTML = "";
    const colors = ["#facc15", "#4ade80", "#60a5fa", "#f472b6"];
    for (let i = 0; i < 10; i++) {
        const piece = document.createElement("div");
        piece.className = "race-confetti-piece";
        piece.style.left = Math.random() * 100 + "%";
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = (Math.random() * 0.3) + "s";
        effects.appendChild(piece);
    }
    setTimeout(() => { if (effects) effects.innerHTML = ""; }, 1500);
}

function createLetterRaceStarExplosion() {
    const effects = $("raceEffects");
    if (!effects) return;
    const star = document.createElement("div");
    star.className = "race-star-burst";
    star.textContent = "⭐";
    effects.appendChild(star);
    setTimeout(() => { if (star && star.parentNode) star.remove(); }, 900);
}

/* =========================================================
   🚪 الخروج: من اللعب إلى مراحل الحرف (أو إلى خريطة الحروف)
   ========================================================= */

function exitLetterRace(toGrid) {

    letterRaceGame.isRunning = false;
    letterRaceGame.answered = true;
    letterRaceGame.session++;
    raceClearTimers();
    try { EduAudio.stop(); } catch (e) { /* لا شيء */ }

    document.removeEventListener("keydown", handleLetterRaceKeyboard);

    const overlay = $("letterRaceLevelComplete");
    if (overlay) overlay.style.display = "none";

    const gates = $("letterRaceOptions");
    if (gates) gates.innerHTML = "";

    const car = $("letterRaceCar");
    if (car) {
        car.classList.remove("race-crash", "race-success");
        car.style.transition = "none";
        car.style.left = "50%";
    }

    showScreen("letterRaceMap");
    if (toGrid === true || !letterRaceGame.letter) {
        renderRaceMap();
    } else {
        renderRaceStages();
        raceMapShow("stages");
    }
}

/* =========================================================
   🔚 نهاية قسم سباق الحروف
   ========================================================= */

/* =========================================================
   🧩🧩🧩 لعبة المطابقة - Matching Game (10 أنماط)
   تدعم: حرف↔حرف، صورة↔صورة، حرف↔صورة، صورة↔كلمة،
   كلمة↔صورة، حرف↔كلمة، صوت الحرف↔الحرف، صوت الكلمة↔الصورة،
   رقم↔كمية، الحرف↔أشكاله (منفصل/أول/وسط/آخر)
   يدعم: Tap-to-Match + Drag & Drop + Magnet Snap +
   صوت تعليمي + تلميحات تدريجية + Errorless Learning/Fading +
   نقاط ونجوم + حفظ التقدم لكل نمط + تدرج الصعوبة
   ========================================================= */

/* =========================================================
   🔡 أشكال الحروف حسب الموضع (منفصل / أول / وسط / آخر)
   تعتمد على نطاق يونيكود Arabic Presentation Forms-B
   ========================================================= */

const arabicLetterForms = {
    "أ": { isolated: "\uFE83", final: "\uFE84" },
    "ب": {
        isolated: "\uFE8F", initial: "\uFE91",
        medial: "\uFE92", final: "\uFE90"
    },
    "ت": {
        isolated: "\uFE95", initial: "\uFE97",
        medial: "\uFE98", final: "\uFE96"
    },
    "ث": {
        isolated: "\uFE99", initial: "\uFE9B",
        medial: "\uFE9C", final: "\uFE9A"
    },
    "ج": {
        isolated: "\uFE9D", initial: "\uFE9F",
        medial: "\uFEA0", final: "\uFE9E"
    },
    "ح": {
        isolated: "\uFEA1", initial: "\uFEA3",
        medial: "\uFEA4", final: "\uFEA2"
    },
    "خ": {
        isolated: "\uFEA5", initial: "\uFEA7",
        medial: "\uFEA8", final: "\uFEA6"
    },
    "د": { isolated: "\uFEA9", final: "\uFEAA" },
    "ذ": { isolated: "\uFEAB", final: "\uFEAC" },
    "ر": { isolated: "\uFEAD", final: "\uFEAE" },
    "ز": { isolated: "\uFEAF", final: "\uFEB0" },
    "س": {
        isolated: "\uFEB1", initial: "\uFEB3",
        medial: "\uFEB4", final: "\uFEB2"
    },
    "ش": {
        isolated: "\uFEB5", initial: "\uFEB7",
        medial: "\uFEB8", final: "\uFEB6"
    },
    "ص": {
        isolated: "\uFEB9", initial: "\uFEBB",
        medial: "\uFEBC", final: "\uFEBA"
    },
    "ض": {
        isolated: "\uFEBD", initial: "\uFEBF",
        medial: "\uFEC0", final: "\uFEBE"
    },
    "ط": {
        isolated: "\uFEC1", initial: "\uFEC3",
        medial: "\uFEC4", final: "\uFEC2"
    },
    "ظ": {
        isolated: "\uFEC5", initial: "\uFEC7",
        medial: "\uFEC8", final: "\uFEC6"
    },
    "ع": {
        isolated: "\uFEC9", initial: "\uFECB",
        medial: "\uFECC", final: "\uFECA"
    },
    "غ": {
        isolated: "\uFECD", initial: "\uFECF",
        medial: "\uFED0", final: "\uFECE"
    },
    "ف": {
        isolated: "\uFED1", initial: "\uFED3",
        medial: "\uFED4", final: "\uFED2"
    },
    "ق": {
        isolated: "\uFED5", initial: "\uFED7",
        medial: "\uFED8", final: "\uFED6"
    },
    "ك": {
        isolated: "\uFED9", initial: "\uFEDB",
        medial: "\uFEDC", final: "\uFEDA"
    },
    "ل": {
        isolated: "\uFEDD", initial: "\uFEDF",
        medial: "\uFEE0", final: "\uFEDE"
    },
    "م": {
        isolated: "\uFEE1", initial: "\uFEE3",
        medial: "\uFEE4", final: "\uFEE2"
    },
    "ن": {
        isolated: "\uFEE5", initial: "\uFEE7",
        medial: "\uFEE8", final: "\uFEE6"
    },
    "ه": {
        isolated: "\uFEE9", initial: "\uFEEB",
        medial: "\uFEEC", final: "\uFEEA"
    },
    "و": { isolated: "\uFEED", final: "\uFEEE" },
    "ي": {
        isolated: "\uFEF1", initial: "\uFEF3",
        medial: "\uFEF4", final: "\uFEF2"
    }
};

const arabicFormPositionLabels = {
    isolated: "منفصل",
    initial: "أول الكلمة",
    medial: "وسط الكلمة",
    final: "آخر الكلمة"
};

/* =========================================================
   🖼️ مجموعة صور عامة لنمط "صورة ↔ صورة"
   ========================================================= */

const matchingObjectsPool = [
    { name: "شمس", emoji: "☀️" },
    { name: "قمر", emoji: "🌙" },
    { name: "نجمة", emoji: "⭐" },
    { name: "زهرة", emoji: "🌸" },
    { name: "شجرة", emoji: "🌳" },
    { name: "كرة", emoji: "⚽" },
    { name: "سيارة", emoji: "🚗" },
    { name: "منزل", emoji: "🏠" },
    { name: "قطة", emoji: "🐱" },
    { name: "كلب", emoji: "🐶" },
    { name: "سمكة", emoji: "🐠" },
    { name: "طائر", emoji: "🐦" },
    { name: "تفاحة", emoji: "🍏" },
    { name: "موزة", emoji: "🍌" },
    { name: "مظلة", emoji: "☂️" },
    { name: "ساعة", emoji: "⏰" }
];

/* =========================================================
   🎮 حالة لعبة المطابقة
   ========================================================= */

const matchingGame = {

    mode: "letters-pictures",

    round: 0,
    totalRounds: 5,

    score: 0,
    mistakes: 0,

    streak: 0,
    bestStreak: 0,

    matchedCount: 0,

    pairs: [],

    selectedSourceId: null,

    dragSourceId: null,
    activePointerId: null,
    dragMoved: false,
    dragStartX: 0,
    dragStartY: 0,

    magnetTargetId: null,

    hintLevel: 0,
    consecutiveWrong: 0,

    active: false,
    paused: false,

    session: 0,

    roundTimer: null,

    difficultyLevel: 1,

    bestScore: 0,

    /* يُحمَّل عند أول استخدام (حفظ التقدم لكل نمط) */
    progress: null

};


/* =========================================================
   💾 حفظ واسترجاع التقدم (لكل نمط على حدة)
   ========================================================= */

function loadMatchingProgress() {

    let progress = {};

    try {

        const raw =
            localStorage.getItem("matchingProgressV2");

        if (raw) {
            progress = JSON.parse(raw) || {};
        }

    } catch (error) {
        progress = {};
    }

    /* توافق مع النسخة القديمة: نقل أفضل نتيجة سابقة
       إلى نمط "الحروف والصور" إن لم تكن هناك بيانات جديدة */

    const legacyBest =
        Number(
            localStorage.getItem("matchingBestScore") || 0
        );

    if (!progress["letters-pictures"] && legacyBest > 0) {

        progress["letters-pictures"] = {
            bestScore: legacyBest,
            bestStars: 0,
            difficultyLevel: 1,
            plays: 0
        };
    }

    return progress;
}

function saveMatchingProgress() {

    try {

        localStorage.setItem(
            "matchingProgressV2",
            JSON.stringify(matchingGame.progress || {})
        );

    } catch (error) {}
}

function getMatchingModeProgress(mode) {

    const progress = matchingGame.progress || {};

    return (
        progress[mode] || {
            bestScore: 0,
            bestStars: 0,
            difficultyLevel: 1,
            plays: 0
        }
    );
}


/* =========================================================
   🎉 عبارات النجاح
   ========================================================= */

/* عبارات التشجيع = نصوص لها تسجيلات موجودة فقط (الصوت = النص المعروض) */
const matchingSuccessPhrases = [
    "أحسنت يا بطل 🌟",
    "أحسنت، عمل رائع 👏",
    "صحيح 🎉"
];

function getMatchingSuccessMessage() {

    return matchingSuccessPhrases[
        Math.floor(
            Math.random() * matchingSuccessPhrases.length
        )
    ];
}


/* =========================================================
   🔊 نطق نص المطابقة
   ========================================================= */

function speakMatchingLabel(text) {
    speakEducational(text);
}


/* =========================================================
   📈 تدرج الصعوبة: عدد الجولات وعدد الأزواج
   ========================================================= */

function getMatchingTotalRounds(difficultyLevel) {

    const level = difficultyLevel || 1;

    return Math.min(5 + Math.floor((level - 1) / 2), 7);
}

function getMatchingPairsCountForRound(round, difficultyLevel) {

    const level = difficultyLevel || 1;

    const base = [3, 4, 4, 5, 6, 6, 7];

    const idx = Math.min(round, base.length - 1);

    const bonus = Math.min(level - 1, 3);

    return Math.min(base[idx] + bonus, 8);
}


/* =========================================================
   🔤 بناء مجموعة "الحرف وأشكاله"
   ========================================================= */

function buildLetterFormsPool() {

    const pool = [];

    letters.forEach(item => {

        const forms = arabicLetterForms[item.letter];

        if (!forms) return;

        Object.keys(forms).forEach(posKey => {

            const glyph = forms[posKey];

            if (!glyph) return;

            const posLabel =
                arabicFormPositionLabels[posKey] || posKey;

            pool.push({
                id:
                    "LF" +
                    item.letter.charCodeAt(0) +
                    "-" + posKey,
                source: glyph,
                target: item.letter + " (" + posLabel + ")",
                sourceSpeak: letterWithFatha(item.letter),
                targetSpeak:
                    "حرف " + item.letter +
                    " في " + posLabel,
                sourceClass: "matching-form-face",
                targetClass: "matching-label-face"
            });
        });
    });

    return pool;
}


/* =========================================================
   🧠 توليد بيانات الأزواج حسب النمط (10 أنماط)
   ========================================================= */

function generateMatchingPairs(mode, count) {

    let pool = [];

    switch (mode) {

        case "numbers-quantities":

            pool = [];

            for (let n = 1; n <= 10; n++) {

                pool.push({
                    id: "NQ" + n,
                    source: arabicNumber(n),
                    target: "🍎".repeat(n),
                    sourceSpeak:
                        numberWords[n] || arabicNumber(n),
                    targetSpeak:
                        numberWords[n] || arabicNumber(n),
                    sourceClass: "matching-number-face",
                    targetClass: "matching-quantity-face"
                });
            }

            break;

        default: /* نمط غير معروف (بعد حذف 8 أنماط قديمة مكرَّرة
                     أو غير مطلوبة — الأنماط الأربعة الأخرى
                     المُبقاة مُعالَجة بالكامل عبر التغليف أدناه) */

            pool = [];
    }

    const chosen =
        shuffle(pool).slice(
            0,
            Math.min(count, pool.length)
        );

    return chosen.map(pair => ({
        ...pair,
        matched: false
    }));
}


/* =========================================================
   📝 عنوان التعليمات حسب النمط
   ========================================================= */

function setMatchingInstructionLabel(mode) {

    const label = $("matchingInstructionLabel");

    if (!label) return;

    const texts = {
        "letters-letters":
            "🎯 اربط كل حرف بنفس الحرف",
        "pictures-pictures":
            "🎯 اربط كل صورة بنفس الصورة المطابقة لها",
        "letters-pictures":
            "🎯 اربط كل حرف بالصورة المناسبة له",
        "pictures-words":
            "🎯 اربط كل صورة بالكلمة الصحيحة لها",
        "words-pictures":
            "🎯 اقرأ الكلمة واربطها بصورتها",
        "letters-words":
            "🎯 اربط كل حرف بالكلمة التي تبدأ به",
        "letter-sound-letters":
            "🎯 استمع لصوت الحرف واختر الحرف الصحيح",
        "word-sound-pictures":
            "🎯 استمع للكلمة واختر الصورة المناسبة",
        "numbers-quantities":
            "🎯 اربط كل رقم بعدد العناصر المناسب",
        "letters-forms":
            "🎯 اربط شكل الحرف بموضعه الصحيح في الكلمة"
    };

    label.textContent =
        texts[mode] ||
        "🎯 اربط كل عنصر بما يناسبه";
}


/* =========================================================
   ▶️ بدء لعبة المطابقة
   ========================================================= */

function startMatchingGame(mode) {

    stopMatchingGame();

    matchingGame.mode = mode || "letters-pictures";

    if (!matchingGame.progress) {
        matchingGame.progress = loadMatchingProgress();
    }

    const modeProgress =
        getMatchingModeProgress(matchingGame.mode);

    matchingGame.difficultyLevel =
        modeProgress.difficultyLevel || 1;

    matchingGame.bestScore =
        modeProgress.bestScore || 0;

    matchingGame.round = 0;

    matchingGame.totalRounds =
        getMatchingTotalRounds(matchingGame.difficultyLevel);

    matchingGame.score = 0;
    matchingGame.mistakes = 0;

    matchingGame.streak = 0;
    matchingGame.bestStreak = 0;

    matchingGame.matchedCount = 0;
    matchingGame.pairs = [];

    matchingGame.selectedSourceId = null;
    matchingGame.dragSourceId = null;
    matchingGame.activePointerId = null;
    matchingGame.magnetTargetId = null;

    matchingGame.hintLevel = 0;
    matchingGame.consecutiveWrong = 0;

    matchingGame.active = true;
    matchingGame.paused = false;

    matchingGame.session++;

    showScreen("matchingGame");

    setMatchingInstructionLabel(matchingGame.mode);

    updateMatchingHUD();

    setTimeout(() => {

        if (!matchingGame.active) return;

        buildMatchingRound();

    }, 150);
}


/* =========================================================
   🧩 بناء جولة جديدة
   ========================================================= */

function buildMatchingRound() {

    if (!matchingGame.active) return;

    clearMatchingBoard();

    matchingGame.matchedCount = 0;
    matchingGame.hintLevel = 0;
    matchingGame.consecutiveWrong = 0;

    matchingGame.pairs =
        generateMatchingPairs(
            matchingGame.mode,
            getMatchingPairsCountForRound(
                matchingGame.round,
                matchingGame.difficultyLevel
            )
        );

    renderMatchingBoard();

    updateMatchingHUD();

    showMatchingMessage(
        "🧩 اربط كل عنصر بما يناسبه",
        ""
    );
}


/* =========================================================
   🎨 رسم لوحة المطابقة
   ========================================================= */

function renderMatchingBoard() {

    const sourceCol = $("matchingSourceColumn");
    const targetCol = $("matchingTargetColumn");

    if (!sourceCol || !targetCol) return;

    sourceCol.innerHTML = "";
    targetCol.innerHTML = "";

    const sourceOrder = shuffle(matchingGame.pairs);
    const targetOrder = shuffle(matchingGame.pairs);

    sourceOrder.forEach(pair => {

        const card = document.createElement("button");

        card.type = "button";

        card.className =
            "matching-card matching-source-card " +
            (pair.sourceClass || "");

        card.dataset.id = pair.id;

        card.setAttribute(
            "aria-label",
            "عنصر للمطابقة: " + pair.sourceSpeak
        );

        card.textContent =
            pair.sourceDisplay || pair.source;

        card.addEventListener(
            "pointerdown",
            event => matchingSourcePointerDown(event, pair.id)
        );

        card.addEventListener(
            "pointermove",
            matchingSourcePointerMove
        );

        card.addEventListener(
            "pointerup",
            matchingSourcePointerUp
        );

        card.addEventListener(
            "pointercancel",
            matchingSourcePointerUp
        );

        sourceCol.appendChild(card);
    });

    targetOrder.forEach(pair => {

        const card = document.createElement("button");

        card.type = "button";

        card.className =
            "matching-card matching-target-card " +
            (pair.targetClass || "");

        card.dataset.id = pair.id;

        card.setAttribute(
            "aria-label",
            "هدف المطابقة: " + pair.targetSpeak
        );

        card.textContent =
            pair.targetDisplay || pair.target;

        card.addEventListener(
            "click",
            event => matchingTargetClick(event, pair.id)
        );

        targetCol.appendChild(card);
    });

    ensureMatchingLineLayer();
}


/* =========================================================
   🧹 تفريغ اللوحة
   ========================================================= */

function clearMatchingBoard() {

    removeMatchingTempLine();
    clearMatchingMagnet();

    const svg = $("matchingLinesSvg");

    if (svg) {
        svg.innerHTML = "";
    }

    const sourceCol = $("matchingSourceColumn");
    const targetCol = $("matchingTargetColumn");

    if (sourceCol) sourceCol.innerHTML = "";
    if (targetCol) targetCol.innerHTML = "";
}


/* =========================================================
   ✅ إلغاء تحديد المصدر الحالي
   ========================================================= */

function clearMatchingSelection() {

    document
        .querySelectorAll(
            ".matching-source-card.matching-selected"
        )
        .forEach(el => {
            el.classList.remove("matching-selected");
        });

    matchingGame.selectedSourceId = null;
}


/* =========================================================
   🧲 المغناطيس أثناء السحب
   ========================================================= */

const MATCHING_MAGNET_RADIUS = 85;

function clearMatchingMagnet() {

    document
        .querySelectorAll(".matching-magnet-target")
        .forEach(el => {
            el.classList.remove("matching-magnet-target");
        });

    matchingGame.magnetTargetId = null;
}

function findNearestMatchingTarget(clientX, clientY) {

    const candidates =
        document.querySelectorAll(
            ".matching-target-card:not(.matching-matched)" +
            ":not(.matching-faded)"
        );

    let nearestEl = null;
    let nearestDist = Infinity;

    candidates.forEach(el => {

        const rect = el.getBoundingClientRect();

        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dist =
            Math.hypot(clientX - cx, clientY - cy);

        if (dist < nearestDist) {
            nearestDist = dist;
            nearestEl = el;
        }
    });

    return { el: nearestEl, dist: nearestDist };
}


/* =========================================================
   🧽 تلاشي المشتتات (تعلّم بلا أخطاء / Fading)
   ========================================================= */

function fadeDistractorTargets(correctId, countToFade) {

    const candidates =
        matchingGame.pairs
            .filter(p => !p.matched && p.id !== correctId)
            .map(p =>
                document.querySelector(
                    '.matching-target-card[data-id="' +
                    p.id + '"]'
                )
            )
            .filter(el =>
                el &&
                !el.classList.contains("matching-faded")
            );

    shuffle(candidates)
        .slice(0, Math.max(0, countToFade))
        .forEach(el => {
            el.classList.add("matching-faded");
            el.setAttribute("aria-disabled", "true");
        });
}

function unfadeAllMatchingTargets() {

    document
        .querySelectorAll(".matching-faded")
        .forEach(el => {
            el.classList.remove("matching-faded");
            el.removeAttribute("aria-disabled");
        });
}


/* =========================================================
   👆⬅️➡️ التفاعل: الضغط والسحب من عنصر المصدر
   ========================================================= */

function matchingSourcePointerDown(event, pairId) {

    const state = matchingGame;

    if (!state.active || state.paused) return;

    const pair =
        state.pairs.find(p => p.id === pairId);

    if (!pair || pair.matched) return;

    const card = event.currentTarget;

    /*
       إذا كان هذا العنصر محددًا مسبقًا،
       نعتبر الضغط عليه مرة أخرى إلغاءً للتحديد.
    */

    if (
        state.selectedSourceId === pairId &&
        state.dragSourceId === null
    ) {

        state.selectedSourceId = null;

        card.classList.remove("matching-selected");

        event.preventDefault();

        return;
    }

    try {
        card.setPointerCapture(event.pointerId);
    } catch (error) {}

    clearMatchingSelection();
    clearMatchingMagnet();

    card.classList.add("matching-selected");

    state.activePointerId = event.pointerId;
    state.dragSourceId = pairId;
    state.dragStartX = event.clientX;
    state.dragStartY = event.clientY;
    state.dragMoved = false;

    speakMatchingLabel(
        pair.sourceSpeak || pair.source
    );

    ensureMatchingLineLayer();

    updateMatchingTempLine(
        card,
        event.clientX,
        event.clientY
    );

    event.preventDefault();
}


function matchingSourcePointerMove(event) {

    const state = matchingGame;

    if (state.dragSourceId === null) return;

    if (event.pointerId !== state.activePointerId) return;

    const dx = event.clientX - state.dragStartX;
    const dy = event.clientY - state.dragStartY;

    if (Math.hypot(dx, dy) > 6) {
        state.dragMoved = true;
    }

    const card = event.currentTarget;

    const nearest =
        findNearestMatchingTarget(
            event.clientX,
            event.clientY
        );

    clearMatchingMagnet();

    if (nearest.el && nearest.dist <= MATCHING_MAGNET_RADIUS) {

        nearest.el.classList.add("matching-magnet-target");
        state.magnetTargetId = nearest.el.dataset.id;

        updateMatchingTempLine(
            card,
            event.clientX,
            event.clientY,
            nearest.el
        );

    } else {

        updateMatchingTempLine(
            card,
            event.clientX,
            event.clientY
        );
    }
}


function matchingSourcePointerUp(event) {

    const state = matchingGame;

    if (state.dragSourceId === null) return;

    if (event.pointerId !== state.activePointerId) return;

    const card = event.currentTarget;

    try {
        card.releasePointerCapture(event.pointerId);
    } catch (error) {}

    const sourceId = state.dragSourceId;
    const moved = state.dragMoved;
    const magnetTargetId = state.magnetTargetId;

    removeMatchingTempLine();
    clearMatchingMagnet();

    let targetCard = null;

    if (
        typeof document.elementFromPoint === "function"
    ) {

        const dropEl =
            document.elementFromPoint(
                event.clientX,
                event.clientY
            );

        targetCard =
            dropEl ?
                dropEl.closest(".matching-target-card") :
                null;
    }

    /*
       المغناطيس: إن لم يكن هناك عنصر واضح تحت الإصبع
       لكن كان هناك هدف قريب أثناء السحب، نعتبره الهدف.
    */

    if (
        (
            !targetCard ||
            targetCard.classList.contains("matching-matched")
        ) &&
        magnetTargetId
    ) {

        const magnetEl =
            document.querySelector(
                '.matching-target-card[data-id="' +
                magnetTargetId + '"]'
            );

        if (
            magnetEl &&
            !magnetEl.classList.contains("matching-matched")
        ) {
            targetCard = magnetEl;
        }
    }

    state.dragSourceId = null;
    state.activePointerId = null;

    if (
        targetCard &&
        !targetCard.classList.contains("matching-matched")
    ) {

        evaluateMatchingAttempt(
            sourceId,
            targetCard.dataset.id,
            card,
            targetCard
        );

        return;
    }

    if (!moved) {

        /*
           ضغطة بسيطة (تاب) بدون سحب حقيقي:
           نبقي العنصر محددًا لينتظر ضغطة
           على الهدف المناسب.
        */

        state.selectedSourceId = sourceId;

    } else {

        card.classList.remove("matching-selected");

        state.selectedSourceId = null;
    }
}


/* =========================================================
   👆 التفاعل: الضغط على عنصر الهدف
   ========================================================= */

function matchingTargetClick(event, targetId) {

    const state = matchingGame;

    if (!state.active || state.paused) return;

    const pair =
        state.pairs.find(p => p.id === targetId);

    if (!pair || pair.matched) return;

    if (state.selectedSourceId === null) {

        speakMatchingLabel(
            pair.targetSpeak || pair.target
        );

        const card = event.currentTarget;

        card.classList.add("matching-nudge");

        setTimeout(() => {
            card.classList.remove("matching-nudge");
        }, 400);

        return;
    }

    const sourceId = state.selectedSourceId;

    const sourceCard =
        document.querySelector(
            '.matching-source-card[data-id="' +
            sourceId + '"]'
        );

    const targetCard = event.currentTarget;

    evaluateMatchingAttempt(
        sourceId,
        targetId,
        sourceCard,
        targetCard
    );
}


/* =========================================================
   ⚖️ تقييم محاولة المطابقة
   ========================================================= */

function evaluateMatchingAttempt(
    sourceId,
    targetId,
    sourceCardEl,
    targetCardEl
) {

    const state = matchingGame;

    if (!state.active) return;

    clearMatchingSelection();

    if (sourceCardEl) {
        sourceCardEl.classList.remove("matching-selected");
    }

    if (sourceId === targetId) {

        handleMatchingCorrect(
            sourceId,
            sourceCardEl,
            targetCardEl
        );

    } else {

        handleMatchingWrong(
            sourceCardEl,
            targetCardEl,
            sourceId
        );
    }
}


/* =========================================================
   ✅ إجابة صحيحة
   ========================================================= */

function handleMatchingCorrect(
    pairId,
    sourceCardEl,
    targetCardEl
) {

    const state = matchingGame;

    const pair =
        state.pairs.find(p => p.id === pairId);

    if (!pair || pair.matched) return;

    pair.matched = true;

    state.matchedCount++;
    state.consecutiveWrong = 0;

    state.streak++;

    if (state.streak > state.bestStreak) {
        state.bestStreak = state.streak;
    }

    const points =
        10 + Math.min(state.streak, 5) * 2;

    state.score += points;

    if (typeof addStars === "function") {
        addStars(1);
    }

    /* إعادة إظهار أي عناصر تم إخفاؤها مؤقتًا لتسهيل الإجابة */
    unfadeAllMatchingTargets();

    if (sourceCardEl) {

        sourceCardEl.classList.add(
            "matching-matched",
            "matching-correct-pulse"
        );
    }

    if (targetCardEl) {

        targetCardEl.classList.add(
            "matching-matched",
            "matching-correct-pulse"
        );
    }

    setTimeout(() => {

        if (sourceCardEl) {
            sourceCardEl.classList.remove(
                "matching-correct-pulse"
            );
        }

        if (targetCardEl) {
            targetCardEl.classList.remove(
                "matching-correct-pulse"
            );
        }

    }, 550);

    if (sourceCardEl && targetCardEl) {
        drawMatchingPermanentLine(
            sourceCardEl,
            targetCardEl
        );
    }

    showMatchingMessage(
        getMatchingSuccessMessage(),
        "success"
    );

    speakMatchingLabel(getMatchingSuccessMessage());

    updateMatchingHUD();

    if (state.matchedCount >= state.pairs.length) {

        state.roundTimer = setTimeout(() => {

            if (!state.active) return;

            finishMatchingRound();

        }, 750);
    }
}


/* =========================================================
   ❌ إجابة خاطئة
   ========================================================= */

function handleMatchingWrong(
    sourceCardEl,
    targetCardEl,
    sourceId
) {

    const state = matchingGame;

    state.streak = 0;
    state.mistakes++;
    state.consecutiveWrong = (state.consecutiveWrong || 0) + 1;

    if (sourceCardEl) {

        sourceCardEl.classList.add("matching-wrong");

        setTimeout(() => {
            sourceCardEl.classList.remove(
                "matching-wrong"
            );
        }, 500);
    }

    if (targetCardEl) {

        targetCardEl.classList.add("matching-wrong");

        setTimeout(() => {
            targetCardEl.classList.remove(
                "matching-wrong"
            );
        }, 500);
    }

    showMatchingMessage(
        "😊 حاول مرة أخرى",
        "wrong"
    );

    speakMatchingLabel("حاول مرة أخرى");

    updateMatchingHUD();

    /*
       تعلّم بلا أخطاء (Errorless Learning / Fading):
       بعد خطأين متتاليين على نفس المحاولة نقلّل عدد
       المشتتات المتاحة لنسهّل الوصول للإجابة الصحيحة.
    */

    if (state.consecutiveWrong >= 2 && sourceId) {

        const remainingCount =
            state.pairs.filter(p => !p.matched).length;

        if (remainingCount > 2) {
            fadeDistractorTargets(sourceId, 1);
        }
    }
}


/* =========================================================
   💡 تلميح تدريجي (Progressive Hints)
   ========================================================= */

function matchingHint() {

    const state = matchingGame;

    if (!state.active || state.paused) return;

    const remaining =
        state.pairs.filter(p => !p.matched);

    if (!remaining.length) return;

    const pair = remaining[0];

    state.hintLevel = (state.hintLevel || 0) + 1;

    const level = state.hintLevel;

    const sourceEl =
        document.querySelector(
            '.matching-source-card[data-id="' +
            pair.id + '"]'
        );

    const targetEl =
        document.querySelector(
            '.matching-target-card[data-id="' +
            pair.id + '"]'
        );

    const glowClass =
        level >= 3 ?
            "matching-hint-glow-strong" :
            "matching-hint-glow";

    [sourceEl, targetEl].forEach(el => {

        if (!el) return;

        el.classList.add(glowClass);

        setTimeout(() => {
            el.classList.remove(
                "matching-hint-glow",
                "matching-hint-glow-strong"
            );
        }, 1600);
    });

    if (level === 1) {

        /* المستوى الأول: مجرد لفت انتباه بسيط */

        showMatchingMessage(
            "🔍 انظر جيدًا لهذين العنصرين",
            ""
        );

    } else if (level === 2) {

        /* المستوى الثاني: إضافة الصوت التعليمي */

        speakMatchingLabel(
            pair.sourceSpeak || pair.source
        );

        showMatchingMessage(
            "💡 استمع جيدًا ثم اربط بينهما",
            ""
        );

    } else {

        /* المستوى الثالث فأعلى: تلاشي المشتتات (Fading) */

        speakMatchingLabel(
            pair.sourceSpeak || pair.source
        );

        if (remaining.length > 2) {
            fadeDistractorTargets(
                pair.id,
                remaining.length - 2
            );
        }

        showMatchingMessage(
            "🌟 لقد سهّلنا عليك الاختيار الآن!",
            ""
        );
    }
}


/* =========================================================
   🏁 إنهاء الجولة الحالية
   ========================================================= */

function finishMatchingRound() {

    const state = matchingGame;

    if (!state.active) return;

    state.round++;

    showMatchingMessage(
        "🎉 أحسنت! أكملت الجولة",
        "success"
    );

    speakMatchingLabel("أحسنت! أكملت الجولة");

    if (state.round >= state.totalRounds) {

        state.roundTimer = setTimeout(() => {

            if (!state.active) return;

            finishMatchingGame();

        }, 900);

    } else {

        state.roundTimer = setTimeout(() => {

            if (!state.active) return;

            buildMatchingRound();

        }, 1100);
    }
}


/* =========================================================
   🏆 إنهاء اللعبة كاملة + حفظ التقدم + تدرج الصعوبة
   ========================================================= */

function finishMatchingGame() {

    const state = matchingGame;

    state.active = false;

    let starsCount = 1;

    if (state.mistakes === 0) {
        starsCount = 3;
    } else if (state.mistakes <= 3) {
        starsCount = 2;
    }

    if (!state.progress) {
        state.progress = loadMatchingProgress();
    }

    const existing = getMatchingModeProgress(state.mode);

    existing.plays = (existing.plays || 0) + 1;

    existing.bestScore =
        Math.max(existing.bestScore || 0, state.score);

    existing.bestStars =
        Math.max(existing.bestStars || 0, starsCount);

    /*
       تدرج الصعوبة: نرفع المستوى إذا أتقن الطفل الجولة
       بلا أخطاء، ونخفضه قليلًا إذا واجه صعوبة كبيرة،
       ونثبّته في الحالات المتوسطة.
    */

    const currentLevel = existing.difficultyLevel || 1;

    if (state.mistakes === 0 && currentLevel < 5) {

        existing.difficultyLevel = currentLevel + 1;

    } else if (
        state.mistakes >= state.totalRounds * 3 &&
        currentLevel > 1
    ) {

        existing.difficultyLevel = currentLevel - 1;

    } else {

        existing.difficultyLevel = currentLevel;
    }

    state.progress[state.mode] = existing;

    saveMatchingProgress();

    state.bestScore = existing.bestScore;
    state.difficultyLevel = existing.difficultyLevel;

    /* توافق مع المفتاح القديم لأفضل نتيجة عامة */

    try {

        const legacyBest =
            Number(
                localStorage.getItem("matchingBestScore") || 0
            );

        if (state.score > legacyBest) {

            localStorage.setItem(
                "matchingBestScore",
                String(state.score)
            );
        }

    } catch (error) {}

    if (typeof addStars === "function") {
        addStars(3);
    }

    const screen = $("matchingGame");

    if (!screen) return;

    const old = $("matchingFinishScreen");

    if (old) old.remove();

    const finish = document.createElement("div");

    finish.id = "matchingFinishScreen";
    finish.className = "matching-result";

    finish.innerHTML =
        '<div class="result-icon">🏆</div>' +
        '<h2>أَحْسَنْتَ! أَكْمَلْتَ لُعْبَةَ المُطَابَقَة</h2>' +
        '<p>أَنْتَ بَطَلُ المُطَابَقَة!</p>' +
        '<div class="result-score">⭐ ' +
            arabicNumber(state.score) +
        '</div>' +
        '<div class="result-stars">' +
            "⭐".repeat(starsCount) +
        '</div>' +
        '<div class="result-stats">' +
            '<div><span>🔥 أفضل تتابع</span><strong>' +
                arabicNumber(state.bestStreak) +
            '</strong></div>' +
            '<div><span>🏆 أفضل نتيجة</span><strong>' +
                arabicNumber(state.bestScore) +
            '</strong></div>' +
            '<div><span>❌ الأخطاء</span><strong>' +
                arabicNumber(state.mistakes) +
            '</strong></div>' +
            '<div><span>🎯 المستوى الجديد</span><strong>' +
                arabicNumber(state.difficultyLevel) +
            '</strong></div>' +
        '</div>' +
        '<div class="result-actions">' +
            '<button class="primary" type="button" ' +
            'onclick="startMatchingGame(\'' +
            state.mode + '\')">' +
            '🔄 لعبة جديدة</button>' +
            '<button class="secondary" type="button" ' +
            'onclick="exitMatchingGame()">' +
            '⬅️ العودة للألعاب</button>' +
        '</div>';

    const wrapper =
        screen.querySelector(".matching-game-wrapper");

    if (wrapper) {
        wrapper.appendChild(finish);
    }

    speakMatchingLabel(
        "أحسنت! أكملت لعبة المطابقة"
    );
}


/* =========================================================
   📊 تحديث لوحة المعلومات
   ========================================================= */

function updateMatchingHUD() {

    const state = matchingGame;

    if ($("matchingScore")) {
        $("matchingScore").textContent =
            arabicNumber(state.score);
    }

    if ($("matchingStreak")) {
        $("matchingStreak").textContent =
            arabicNumber(state.streak);
    }

    if ($("matchingDifficultyLevel")) {
        $("matchingDifficultyLevel").textContent =
            arabicNumber(state.difficultyLevel || 1);
    }

    if ($("matchingRound")) {
        $("matchingRound").textContent =
            arabicNumber(
                Math.min(
                    state.round + 1,
                    state.totalRounds
                )
            );
    }

    if ($("matchingTotalRounds")) {
        $("matchingTotalRounds").textContent =
            arabicNumber(state.totalRounds);
    }
}


/* =========================================================
   💬 رسالة اللعبة
   ========================================================= */

function showMatchingMessage(text, type) {

    const el = $("matchingMessage");

    if (!el) return;

    el.textContent = text;

    el.className =
        "matching-message" +
        (type ? " " + type : "");
}


/* =========================================================
   📐 خطوط الربط (SVG)
   ========================================================= */

function ensureMatchingLineLayer() {

    const svg = $("matchingLinesSvg");
    const board = $("matchingBoard");

    if (!svg || !board) return null;

    const rect = board.getBoundingClientRect();

    svg.setAttribute(
        "width",
        Math.max(rect.width, 1)
    );

    svg.setAttribute(
        "height",
        Math.max(rect.height, 1)
    );

    svg.setAttribute(
        "viewBox",
        "0 0 " +
        Math.max(rect.width, 1) + " " +
        Math.max(rect.height, 1)
    );

    return svg;
}

function getMatchingBoardRelativeCenter(el) {

    const board = $("matchingBoard");

    if (!board || !el) return { x: 0, y: 0 };

    const boardRect = board.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    return {
        x:
            elRect.left + elRect.width / 2 -
            boardRect.left,
        y:
            elRect.top + elRect.height / 2 -
            boardRect.top
    };
}

function updateMatchingTempLine(
    sourceEl,
    clientX,
    clientY,
    snapTargetEl
) {

    const svg = ensureMatchingLineLayer();

    if (!svg) return;

    const board = $("matchingBoard");

    if (!board) return;

    const boardRect = board.getBoundingClientRect();

    const start =
        getMatchingBoardRelativeCenter(sourceEl);

    const end =
        snapTargetEl ?
            getMatchingBoardRelativeCenter(snapTargetEl) :
            {
                x: clientX - boardRect.left,
                y: clientY - boardRect.top
            };

    let line = $("matchingTempLine");

    if (!line) {

        line =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );

        line.id = "matchingTempLine";

        line.setAttribute(
            "class",
            "matching-temp-line"
        );

        svg.appendChild(line);
    }

    line.setAttribute("x1", start.x);
    line.setAttribute("y1", start.y);
    line.setAttribute("x2", end.x);
    line.setAttribute("y2", end.y);
}

function removeMatchingTempLine() {

    const line = $("matchingTempLine");

    if (line) line.remove();
}

function drawMatchingPermanentLine(sourceEl, targetEl) {

    const svg = ensureMatchingLineLayer();

    if (!svg) return;

    const start =
        getMatchingBoardRelativeCenter(sourceEl);

    const end =
        getMatchingBoardRelativeCenter(targetEl);

    const line =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

    line.setAttribute(
        "class",
        "matching-solved-line"
    );

    line.setAttribute("x1", start.x);
    line.setAttribute("y1", start.y);
    line.setAttribute("x2", end.x);
    line.setAttribute("y2", end.y);

    svg.appendChild(line);
}

function redrawMatchingLines() {

    const svg = $("matchingLinesSvg");

    if (!svg) return;

    ensureMatchingLineLayer();

    svg
        .querySelectorAll(".matching-solved-line")
        .forEach(line => line.remove());

    matchingGame.pairs
        .filter(pair => pair.matched)
        .forEach(pair => {

            const sourceEl =
                document.querySelector(
                    '.matching-source-card[data-id="' +
                    pair.id + '"]'
                );

            const targetEl =
                document.querySelector(
                    '.matching-target-card[data-id="' +
                    pair.id + '"]'
                );

            if (sourceEl && targetEl) {

                drawMatchingPermanentLine(
                    sourceEl,
                    targetEl
                );
            }
        });
}

window.addEventListener("resize", () => {

    if (matchingGame.active) {
        redrawMatchingLines();
    }
});


/* =========================================================
   🛑 إيقاف اللعبة (تنظيف)
   ========================================================= */

function stopMatchingGame() {

    clearTimeout(matchingGame.roundTimer);

    matchingGame.roundTimer = null;

    matchingGame.active = false;
    matchingGame.paused = false;

    matchingGame.selectedSourceId = null;
    matchingGame.dragSourceId = null;
    matchingGame.activePointerId = null;

    clearMatchingMagnet();
    clearMatchingBoard();

    const finish = $("matchingFinishScreen");

    if (finish) finish.remove();
}


/* =========================================================
   🚪 الخروج من لعبة المطابقة
   ========================================================= */

function exitMatchingGame() {

    stopMatchingGame();

    matchingGame.session++;

    showScreen("games");
}


/* =========================================================
   🔚 نهاية قسم لعبة المطابقة
   ========================================================= */

/* =========================================================================
   🆕 =====================================================================
   🔤 حرف ↔ حرف — نسخة احترافية مستقلة (Tap-to-Select)
   =====================================================================
   قسم جديد كليًا ومعزول تمامًا عن نظام المطابقة الأصلي (matchingGame)
   وآلية السحب — لا يشاركه أي حالة أو عنصر DOM. يُعيد استخدام منطق
   البيانات/الصعوبة/التقدّم/الصوت الموجود فعليًا (generateMatchingPairs،
   getMatchingTotalRounds، getMatchingPairsCountForRound،
   loadMatchingProgress/saveMatchingProgress، speakEducational،
   addStars) بلا أي تغيير فيها، باستثناء إضافة حقل "letter" واحد
   بسيط وغير جراحي إلى buildLetterFormFormPool (مُستخدَمة حصريًا من
   هذا النمط) ليتسنى نطق صوت الحرف بالفتحة الصحيح بدل اسمه.
========================================================================= */

const mlgGame = {
    round: 0,
    totalRounds: 5,
    difficultyLevel: 1,
    pairs: [],
    cards: [],
    matchedCount: 0,
    selectedCardId: null,
    active: false,
    session: 0
};

/* =========================================================
   ▶️ بدء اللعبة
   ========================================================= */

function startFormsMatchingGame() {

    if (!matchingGame.progress) {
        matchingGame.progress = loadMatchingProgress();
    }

    const modeProgress = getMatchingModeProgress("forms-forms");

    mlgGame.difficultyLevel = modeProgress.difficultyLevel || 1;
    mlgGame.round = 0;
    mlgGame.totalRounds = getMatchingTotalRounds(mlgGame.difficultyLevel);
    mlgGame.matchedCount = 0;
    mlgGame.selectedCardId = null;
    mlgGame.active = true;
    mlgGame.session++;

    showScreen("matchingLettersGame");

    const overlay = $("mlgSuccessOverlay");
    if (overlay) overlay.style.display = "none";

    updateMlgHUD();
    clearMlgMessage();

    setTimeout(() => {
        if (mlgGame.active) buildMlgRound();
    }, 150);
}

/* =========================================================
   🧩 بناء جولة جديدة — بيانات ثابتة من generateMatchingPairs
   نفسها، بلا أي عشوائية مضافة في المحتوى
   ========================================================= */

function buildMlgRound() {

    if (!mlgGame.active) return;

    mlgGame.round++;
    mlgGame.matchedCount = 0;
    mlgGame.selectedCardId = null;

    const count = getMatchingPairsCountForRound(
        mlgGame.round,
        mlgGame.difficultyLevel
    );

    mlgGame.pairs = generateMatchingPairs("forms-forms", count);

    const cards = [];

    mlgGame.pairs.forEach(pair => {
        cards.push({
            cardId: pair.id + "-A",
            pairId: pair.id,
            display: pair.source,
            letter: pair.letter,
            matched: false
        });
        cards.push({
            cardId: pair.id + "-B",
            pairId: pair.id,
            display: pair.target,
            letter: pair.letter,
            matched: false
        });
    });

    mlgGame.cards = shuffle(cards);

    renderMlgGrid();
    updateMlgHUD();
    showMlgMessage("🧩 اختر البطاقتين المتطابقتين لنفس الحرف");
}

/* =========================================================
   🎨 رسم الشبكة — عمودان، أزرار حقيقية (تركيز لوحة مفاتيح
   وتفعيل Enter/Space مجانًا عبر عنصر button الأصلي)
   ========================================================= */

function renderMlgGrid() {

    const grid = $("mlgGrid");
    if (!grid) return;

    grid.innerHTML = "";

    mlgGame.cards.forEach(card => {

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mlg-card";
        btn.textContent = card.display;
        btn.dataset.cardId = card.cardId;
        btn.setAttribute("aria-label", "بطاقة شكل حرف، اضغط للاختيار");
        btn.setAttribute("aria-pressed", "false");

        btn.addEventListener("click", () => {
            handleMlgCardTap(card.cardId);
        });

        grid.appendChild(btn);
    });
}

function getMlgCardButton(cardId) {
    return document.querySelector(`.mlg-card[data-card-id="${CSS.escape(cardId)}"]`);
}

/* =========================================================
   👆 التعامل مع اختيار بطاقة — Tap-to-Select
   ========================================================= */

function handleMlgCardTap(cardId) {

    if (!mlgGame.active) return;

    const card = mlgGame.cards.find(c => c.cardId === cardId);
    if (!card || card.matched) return;

    const btn = getMlgCardButton(cardId);

    if (card.letter) {
        speakEducational(letterWithFatha(card.letter));
    }

    if (mlgGame.selectedCardId === null) {

        mlgGame.selectedCardId = cardId;

        if (btn) {
            btn.classList.add("mlg-selected");
            btn.setAttribute("aria-pressed", "true");
        }

        return;
    }

    if (mlgGame.selectedCardId === cardId) {

        mlgGame.selectedCardId = null;

        if (btn) {
            btn.classList.remove("mlg-selected");
            btn.setAttribute("aria-pressed", "false");
        }

        return;
    }

    const firstCardId = mlgGame.selectedCardId;
    const firstCard = mlgGame.cards.find(c => c.cardId === firstCardId);
    const firstBtn = getMlgCardButton(firstCardId);

    const isMatch = firstCard && firstCard.pairId === card.pairId;

    if (isMatch) {
        handleMlgCorrect(firstBtn, btn, firstCard, card);
    } else {
        handleMlgWrong(firstBtn, btn);
    }
}

/* =========================================================
   ✅ إجابة صحيحة — ✓ + نجاح هادئ + صوت + نجمة + تقدّم + انتقال
   ========================================================= */

function handleMlgCorrect(btnA, btnB, cardA, cardB) {

    const session = mlgGame.session;

    mlgGame.selectedCardId = null;
    cardA.matched = true;
    cardB.matched = true;
    mlgGame.matchedCount++;

    [btnA, btnB].forEach(btn => {
        if (!btn) return;
        btn.classList.remove("mlg-selected");
        btn.classList.add("mlg-correct");
        btn.disabled = true;
        btn.setAttribute("aria-pressed", "false");
        btn.setAttribute("aria-label", "بطاقة متطابقة بنجاح");
    });

    if (typeof addStars === "function") addStars(1);

    /* 🛠️ الصوت الوحيد في هذه اللعبة هو صوت الحرف المحلي — تم
       إيقاف نطق عبارة التشجيع هنا عمدًا (كانت تذهب دائمًا لـ
       Browser TTS الاحتياطي لعدم وجود ملف محلي مطابق لها، وتُسمَع
       بعد صوت الحرف مباشرة). الرسالة البصرية تبقى كما هي. */
    const successPhrase = getMatchingSuccessMessage();
    showMlgMessage("🎉 " + successPhrase, "success");

    updateMlgHUD();

    if (mlgGame.matchedCount >= mlgGame.pairs.length) {

        setTimeout(() => {
            if (session !== mlgGame.session) return;
            if (!mlgGame.active) return;
            finishMlgRound();
        }, 1000);
    }
}

/* =========================================================
   😊 إجابة خاطئة — × + اهتزاز خفيف + صوت هادئ، بلا أي عقوبة
   ========================================================= */

function handleMlgWrong(btnA, btnB) {

    const session = mlgGame.session;

    [btnA, btnB].forEach(btn => {
        if (btn) btn.classList.add("mlg-wrong");
    });

    /* 🛠️ نفس المبدأ: الصوت الوحيد هنا هو صوت الحرف المحلي — تم
       إيقاف نطق "حاول مرة أخرى" عمدًا، تبقى الرسالة البصرية فقط */
    showMlgMessage("😊 حاول مرة أخرى", "wrong");

    setTimeout(() => {

        if (session !== mlgGame.session) return;

        [btnA, btnB].forEach(btn => {
            if (!btn) return;
            btn.classList.remove("mlg-wrong", "mlg-selected");
            btn.setAttribute("aria-pressed", "false");
        });

        mlgGame.selectedCardId = null;

    }, 650);
}

/* =========================================================
   🏁 إكمال الجولة — شاشة نجاح أنيقة + Confetti محدود جدًا
   ========================================================= */

function finishMlgRound() {

    mlgGame.active = false;

    if (!matchingGame.progress) {
        matchingGame.progress = loadMatchingProgress();
    }

    const prev = getMatchingModeProgress("forms-forms");

    const updated = {
        bestScore: Math.max(prev.bestScore || 0, mlgGame.matchedCount),
        bestStars: prev.bestStars || 0,
        difficultyLevel: prev.difficultyLevel || 1,
        plays: (prev.plays || 0) + 1
    };

    /* تدرّج صعوبة هادئ: كل جولتين مكتملتين تزيد المستوى درجة واحدة */
    if (updated.plays % 2 === 0) {
        updated.difficultyLevel = Math.min(updated.difficultyLevel + 1, 6);
    }

    matchingGame.progress["forms-forms"] = updated;
    saveMatchingProgress();

    const isLastRound = mlgGame.round >= mlgGame.totalRounds;

    const overlay = $("mlgSuccessOverlay");
    const title = $("mlgSuccessTitle");
    const body = $("mlgSuccessBody");
    const nextBtn = $("mlgNextBtn");

    if (title) {
        title.textContent = isLastRound ? "🎉 أكملت كل الجولات!" : "🌟 أحسنت! أكملت الجولة";
    }
    if (body) {
        body.textContent = isLastRound
            ? "عمل رائع في مطابقة أشكال الحروف"
            : "الجولة التالية بانتظارك";
    }
    if (nextBtn) {
        nextBtn.textContent = isLastRound ? "🏠 العودة للألعاب" : "▶ الجولة التالية";
        nextBtn.onclick = isLastRound ? exitFormsMatchingGame : continueMlgNextRound;
    }

    renderMlgConfetti();

    if (overlay) overlay.style.display = "flex";

    speakEducational("أحسنت! أتممت الجولة بنجاح");

    if (nextBtn) {
        setTimeout(() => nextBtn.focus(), 50);
    }
}

function continueMlgNextRound() {

    const overlay = $("mlgSuccessOverlay");
    if (overlay) overlay.style.display = "none";

    mlgGame.active = true;

    buildMlgRound();
}

/* =========================================================
   🎊 قصاصات احتفال محدودة جدًا (8 قصاصات فقط، قصيرة)
   ========================================================= */

function renderMlgConfetti() {

    const el = $("mlgConfetti");
    if (!el) return;

    el.innerHTML = "";

    const colors = ["#38bdf8", "#facc15", "#4ade80", "#f472b6"];

    for (let i = 0; i < 8; i++) {

        const piece = document.createElement("div");
        piece.className = "mlg-confetti-piece";
        piece.style.left = (10 + Math.random() * 80) + "%";
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = (Math.random() * 0.25) + "s";

        el.appendChild(piece);
    }

    setTimeout(() => {
        if (el) el.innerHTML = "";
    }, 1400);
}

/* =========================================================
   🖥️ واجهة المعلومات (HUD)
   ========================================================= */

function updateMlgHUD() {

    const starsEl = $("mlgStars");
    if (starsEl && typeof stars !== "undefined") {
        starsEl.textContent = arabicNumber(stars);
    }

    const fill = $("mlgProgressFill");
    const track = $("mlgProgressTrack");

    if (fill) {
        const total = mlgGame.pairs.length || 1;
        const pct = Math.round((mlgGame.matchedCount / total) * 100);
        fill.style.width = pct + "%";
        if (track) track.setAttribute("aria-valuenow", String(pct));
    }
}

function showMlgMessage(text) {
    const el = $("mlgMessage");
    if (el) el.textContent = text;
}

function clearMlgMessage() {
    const el = $("mlgMessage");
    if (el) el.textContent = "";
}

/* =========================================================
   🚪 الخروج من اللعبة
   ========================================================= */

function exitFormsMatchingGame() {

    mlgGame.active = false;
    mlgGame.session++;

    const overlay = $("mlgSuccessOverlay");
    if (overlay) overlay.style.display = "none";

    showScreen("games");
}

/* إيقاف هادئ عند مغادرة الشاشة عبر أي تنقّل عام (مثل زر الرئيسية) —
   تغليف غير جراحي لـ showScreen، بلا أي تعديل على الدالة الأصلية */

const originalShowScreenForMlg = showScreen;

showScreen = function (screenId) {

    if (
        typeof mlgGame !== "undefined" &&
        mlgGame.active &&
        screenId !== "matchingLettersGame"
    ) {
        mlgGame.active = false;
        mlgGame.session++;

        const overlay = $("mlgSuccessOverlay");
        if (overlay) overlay.style.display = "none";
    }

    originalShowScreenForMlg(screenId);
};

/* =========================================================
   🔚 نهاية قسم "حرف ↔ حرف" الاحترافي المستقل
   ========================================================= */

/* =========================================================================
   🆕 =====================================================================
   🔢 رقم ↔ كمية — نسخة احترافية مستقلة (Tap-to-Select)
   =====================================================================
   قسم جديد كليًا ومعزول تمامًا — لا يشارك أي حالة أو عنصر DOM مع
   نظام المطابقة الأصلي أو مع "حرف ↔ حرف". توليد البيانات مستقل
   بالكامل (generateNQPairs) ولا يمسّ generateMatchingPairs أو
   حالتها الأصلية لنمط numbers-quantities إطلاقًا — يُعيد استخدام
   نفس arabicNumber()/numberWords الموجودين فعليًا فقط، بلا أي
   تعديل عليهما. 4 مستويات بتدرّج حقيقي في مدى الأرقام المستخدمة
   (1-3 ← 1-5 ← 1-7 ← 1-10)، وليس فقط عدد الأزواج. تمثيل الكمية
   بإطار العشرة (Ten-Frame) — أداة تربوية معتمدة لتعليم الأعداد
   المبكر، بنية ثابتة ٢×٥ تجعل العدّ والمقارنة سهلين دائمًا بلا
   ازدحام مهما كانت الكمية.
========================================================================= */

const NQ_LEVEL_RANGES = { 1: 3, 2: 5, 3: 7, 4: 10 };

const nqGame = {
    level: 1,
    round: 0,
    totalRounds: 5,
    maxNumber: 3,
    pairs: [],
    cards: [],
    matchedCount: 0,
    selectedCardId: null,
    active: false,
    session: 0
};

/* =========================================================
   💾 حفظ/تحميل المستوى المفتوح — مفتاح معزول جديد خاص بهذه
   اللعبة فقط
   ========================================================= */

function loadNQUnlockedLevel() {
    const saved = Number(localStorage.getItem("taha_nq_unlocked_level") || 1);
    return Math.min(Math.max(saved, 1), 4);
}

function saveNQUnlockedLevel(level) {
    const current = loadNQUnlockedLevel();
    if (level > current) {
        localStorage.setItem("taha_nq_unlocked_level", String(Math.min(level, 4)));
    }
}

/* =========================================================
   🧮 توليد أزواج رقم↔كمية — دالة مستقلة بالكامل، لا تمسّ
   generateMatchingPairs أو حالتها الأصلية لهذا النمط إطلاقًا
   ========================================================= */

function generateNQPairs(maxNumber, count) {

    const pool = [];

    for (let n = 1; n <= maxNumber; n++) {
        pool.push({
            id: "NQG" + n,
            number: n,
            numberDisplay: arabicNumber(n),
            speak: numberWords[n] || arabicNumber(n)
        });
    }

    return shuffle(pool).slice(0, Math.min(count, pool.length));
}

/* =========================================================
   ▶️ بدء اللعبة — تبدأ دائمًا من المستوى المفتوح المحفوظ
   ========================================================= */

function startNQGame() {

    nqGame.level = loadNQUnlockedLevel();
    nqGame.maxNumber = NQ_LEVEL_RANGES[nqGame.level] || 3;
    nqGame.round = 0;
    nqGame.totalRounds = getMatchingTotalRounds(nqGame.level);
    nqGame.matchedCount = 0;
    nqGame.selectedCardId = null;
    nqGame.active = true;
    nqGame.session++;

    showScreen("matchingQuantityGame");

    const overlay = $("nqgLevelComplete");
    if (overlay) overlay.style.display = "none";

    updateNQHUD();
    clearNQMessage();

    setTimeout(() => {
        if (nqGame.active) buildNQRound();
    }, 150);
}

/* =========================================================
   🧩 بناء جولة جديدة
   ========================================================= */

function buildNQRound() {

    if (!nqGame.active) return;

    nqGame.round++;
    nqGame.matchedCount = 0;
    nqGame.selectedCardId = null;

    const count = Math.min(
        getMatchingPairsCountForRound(nqGame.round, nqGame.level),
        nqGame.maxNumber
    );

    nqGame.pairs = generateNQPairs(nqGame.maxNumber, count);

    const cards = [];

    nqGame.pairs.forEach(pair => {
        cards.push({
            cardId: pair.id + "-num",
            pairId: pair.id,
            type: "number",
            number: pair.number,
            speak: pair.speak,
            matched: false
        });
        cards.push({
            cardId: pair.id + "-qty",
            pairId: pair.id,
            type: "quantity",
            number: pair.number,
            speak: pair.speak,
            matched: false
        });
    });

    nqGame.cards = shuffle(cards);

    renderNQGrid();
    updateNQHUD();
    showNQMessage("🧩 اختر الرقم وعدد العناصر المناسب له");
}

/* =========================================================
   🎨 رسم الشبكة — بطاقات رقم كبيرة جدًا + بطاقات كمية بإطار
   العشرة (Ten-Frame)
   ========================================================= */

function buildTenFrame(number) {

    const frame = document.createElement("div");
    frame.className = "nqg-tenframe";
    frame.setAttribute("aria-hidden", "true");

    for (let i = 1; i <= 10; i++) {
        const cell = document.createElement("div");
        cell.className = "nqg-tenframe-cell" + (i <= number ? " filled" : "");
        frame.appendChild(cell);
    }

    return frame;
}

function renderNQGrid() {

    const grid = $("nqgGrid");
    if (!grid) return;

    grid.innerHTML = "";

    nqGame.cards.forEach(card => {

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "nqg-card";
        btn.dataset.cardId = card.cardId;

        if (card.type === "number") {

            const numEl = document.createElement("span");
            numEl.className = "nqg-number-display";
            numEl.textContent = arabicNumber(card.number);
            btn.appendChild(numEl);

            btn.setAttribute("aria-label", "بطاقة الرقم " + card.speak + "، اضغط للاختيار");

        } else {

            btn.appendChild(buildTenFrame(card.number));
            btn.setAttribute("aria-label", "بطاقة كمية، اضغط للاختيار");
        }

        btn.setAttribute("aria-pressed", "false");

        btn.addEventListener("click", () => {
            handleNQCardTap(card.cardId);
        });

        grid.appendChild(btn);
    });
}

function getNQCardButton(cardId) {
    return document.querySelector(`.nqg-card[data-card-id="${CSS.escape(cardId)}"]`);
}

/* =========================================================
   👆 التعامل مع اختيار بطاقة — Tap-to-Select
   ========================================================= */

function handleNQCardTap(cardId) {

    if (!nqGame.active) return;

    const card = nqGame.cards.find(c => c.cardId === cardId);
    if (!card || card.matched) return;

    const btn = getNQCardButton(cardId);

    if (card.speak) {
        speakEducational(card.speak);
    }

    if (nqGame.selectedCardId === null) {

        nqGame.selectedCardId = cardId;

        if (btn) {
            btn.classList.add("nqg-selected");
            btn.setAttribute("aria-pressed", "true");
        }

        return;
    }

    if (nqGame.selectedCardId === cardId) {

        nqGame.selectedCardId = null;

        if (btn) {
            btn.classList.remove("nqg-selected");
            btn.setAttribute("aria-pressed", "false");
        }

        return;
    }

    const firstCardId = nqGame.selectedCardId;
    const firstCard = nqGame.cards.find(c => c.cardId === firstCardId);
    const firstBtn = getNQCardButton(firstCardId);

    const isMatch = firstCard && firstCard.pairId === card.pairId;

    if (isMatch) {
        handleNQCorrect(firstBtn, btn, firstCard, card);
    } else {
        handleNQWrong(firstBtn, btn);
    }
}

/* =========================================================
   ✅ إجابة صحيحة — ✓ + تثبيت بصري + نجمة + تقدّم، بلا صوت
   تشجيع لفظي (الصوت الوحيد هنا هو صوت الرقم المحلي، كما
   في "حرف ↔ حرف")
   ========================================================= */

function handleNQCorrect(btnA, btnB, cardA, cardB) {

    const session = nqGame.session;

    nqGame.selectedCardId = null;
    cardA.matched = true;
    cardB.matched = true;
    nqGame.matchedCount++;

    [btnA, btnB].forEach(btn => {
        if (!btn) return;
        btn.classList.remove("nqg-selected");
        btn.classList.add("nqg-correct");
        btn.disabled = true;
        btn.setAttribute("aria-pressed", "false");
        btn.setAttribute("aria-label", "بطاقة متطابقة بنجاح");
    });

    if (typeof addStars === "function") addStars(1);

    showNQMessage("🎉 أحسنت!");

    updateNQHUD();

    if (nqGame.matchedCount >= nqGame.pairs.length) {

        setTimeout(() => {
            if (session !== nqGame.session) return;
            if (!nqGame.active) return;
            finishNQRound();
        }, 1000);
    }
}

/* =========================================================
   😊 إجابة خاطئة — × + اهتزاز خفيف، بلا أي عقوبة أو صوت لفظي
   ========================================================= */

function handleNQWrong(btnA, btnB) {

    const session = nqGame.session;

    [btnA, btnB].forEach(btn => {
        if (btn) btn.classList.add("nqg-wrong");
    });

    showNQMessage("😊 حاول مرة أخرى");

    setTimeout(() => {

        if (session !== nqGame.session) return;

        [btnA, btnB].forEach(btn => {
            if (!btn) return;
            btn.classList.remove("nqg-wrong", "nqg-selected");
            btn.setAttribute("aria-pressed", "false");
        });

        nqGame.selectedCardId = null;

    }, 650);
}

/* =========================================================
   🏁 إكمال الجولة/المستوى — شاشة نجاح أنيقة + Confetti محدود
   ========================================================= */

function finishNQRound() {

    if (nqGame.round < nqGame.totalRounds) {

        setTimeout(() => {
            if (!nqGame.active) return;
            buildNQRound();
        }, 400);

        return;
    }

    nqGame.active = false;

    const isLastLevel = nqGame.level >= 4;

    saveNQUnlockedLevel(Math.min(nqGame.level + 1, 4));

    const overlay = $("nqgLevelComplete");
    const title = $("nqgLevelCompleteTitle");
    const body = $("nqgLevelCompleteBody");
    const nextBtn = $("nqgLevelCompleteNextBtn");

    if (title) {
        title.textContent = isLastLevel ? "🎉 أكملت كل المستويات!" : "🌟 أحسنت! أكملت المستوى";
    }
    if (body) {
        body.textContent = isLastLevel
            ? "عمل رائع في مطابقة الأرقام والكميات"
            : "المستوى التالي بانتظارك";
    }
    if (nextBtn) {
        nextBtn.textContent = isLastLevel ? "🏠 العودة للألعاب" : "▶ المستوى التالي";
        nextBtn.onclick = isLastLevel ? exitNQGame : advanceToNextNQLevel;
    }

    renderNQConfetti();

    if (overlay) overlay.style.display = "flex";

    if (nextBtn) {
        setTimeout(() => nextBtn.focus(), 50);
    }
}

function advanceToNextNQLevel() {

    nqGame.level = Math.min(nqGame.level + 1, 4);
    nqGame.maxNumber = NQ_LEVEL_RANGES[nqGame.level] || 10;
    nqGame.round = 0;
    nqGame.totalRounds = getMatchingTotalRounds(nqGame.level);
    nqGame.matchedCount = 0;
    nqGame.selectedCardId = null;
    nqGame.active = true;

    const overlay = $("nqgLevelComplete");
    if (overlay) overlay.style.display = "none";

    updateNQHUD();
    clearNQMessage();

    buildNQRound();
}

/* =========================================================
   🎊 قصاصات احتفال محدودة جدًا (8 قصاصات فقط)
   ========================================================= */

function renderNQConfetti() {

    const el = $("nqgConfetti");
    if (!el) return;

    el.innerHTML = "";

    const colors = ["#4ade80", "#facc15", "#38bdf8", "#f472b6"];

    for (let i = 0; i < 8; i++) {

        const piece = document.createElement("div");
        piece.className = "nqg-confetti-piece";
        piece.style.left = (10 + Math.random() * 80) + "%";
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = (Math.random() * 0.25) + "s";

        el.appendChild(piece);
    }

    setTimeout(() => {
        if (el) el.innerHTML = "";
    }, 1400);
}

/* =========================================================
   🖥️ واجهة المعلومات (HUD)
   ========================================================= */

function updateNQHUD() {

    const starsEl = $("nqgStars");
    if (starsEl && typeof stars !== "undefined") {
        starsEl.textContent = arabicNumber(stars);
    }

    const levelEl = $("nqgLevel");
    if (levelEl) levelEl.textContent = arabicNumber(nqGame.level);

    const roundEl = $("nqgRound");
    if (roundEl) roundEl.textContent = arabicNumber(Math.min(nqGame.round, nqGame.totalRounds));

    const totalEl = $("nqgTotalRounds");
    if (totalEl) totalEl.textContent = arabicNumber(nqGame.totalRounds);

    const fill = $("nqgProgressFill");
    const track = $("nqgProgressTrack");

    if (fill) {
        const completedRounds = Math.max(0, nqGame.round - 1);
        const pct = Math.min(100, Math.round((completedRounds / nqGame.totalRounds) * 100));
        fill.style.width = pct + "%";
        if (track) track.setAttribute("aria-valuenow", String(pct));
    }
}

function showNQMessage(text) {
    const el = $("nqgMessage");
    if (el) el.textContent = text;
}

function clearNQMessage() {
    const el = $("nqgMessage");
    if (el) el.textContent = "";
}

/* =========================================================
   🚪 الخروج من اللعبة
   ========================================================= */

function exitNQGame() {

    nqGame.active = false;
    nqGame.session++;

    const overlay = $("nqgLevelComplete");
    if (overlay) overlay.style.display = "none";

    showScreen("games");
}

/* إيقاف هادئ عند مغادرة الشاشة عبر أي تنقّل عام — تغليف غير
   جراحي إضافي لـ showScreen (يُضاف فوق التغليف السابق لـ"حرف
   ↔ حرف"، بلا أي تعديل على أي منهما) */

const originalShowScreenForNQ = showScreen;

showScreen = function (screenId) {

    if (
        typeof nqGame !== "undefined" &&
        nqGame.active &&
        screenId !== "matchingQuantityGame"
    ) {
        nqGame.active = false;
        nqGame.session++;

        const overlay = $("nqgLevelComplete");
        if (overlay) overlay.style.display = "none";
    }

    originalShowScreenForNQ(screenId);
};

/* =========================================================
   🔚 نهاية قسم "رقم ↔ كمية" الاحترافي المستقل
   ========================================================= */


/* =========================================================================
   🆕 =====================================================================
   🖼️ حرف ↔ صورة — نسخة احترافية مستقلة (Tap-to-Select)
   =====================================================================
   قسم جديد كليًا ومعزول تمامًا — لا يشارك أي حالة أو عنصر DOM مع نظام
   المطابقة الأصلي ولا مع "حرف ↔ حرف" ولا "رقم ↔ كمية". بياناته مجموعة
   ثابتة موثوقة (حرف ← كلمة ← صورة) لكل الحروف الـ28: كل كلمة تبدأ
   فعليًا بحرفها، ولها ملف صوت محلي في بنك الصوت التعليمي (تحقّقنا
   برمجيًا). 4 مستويات = مجموعات الحروف الأربع نفسها المعتمدة في
   التطبيق (بلا خلط بين مجموعاتها)، وتدرّج صعوبة حقيقي داخل المستوى:
   جولات سهلة تتباعد فيها الحروف المتشابهة، ثم متوسطة، ثم جولات تحدٍّ
   تجمع حروفًا متشابهة فعليًا (LTR_SIMILAR_LETTERS الموجودة أصلًا).
   فكرتها المميّزة: "مكتبة الصور" — صورة لكل حرف يُتقنه الطفل.
   الصوت: ملفات MP3 المحلية فقط (صوت الحرف بالفتحة / اسم الصورة) —
   لا Browser ولا Google TTS إطلاقًا داخل هذه اللعبة.
========================================================================= */

const OL_PICTURE_BANK = {
    "أ": { word: "أسد", emoji: "🦁" },
    "ب": { word: "بطة", emoji: "🦆" },
    "ت": { word: "تمساح", emoji: "🐊" },
    "ث": { word: "ثعلب", emoji: "🦊" },
    "ج": { word: "جمل", emoji: "🐪" },
    "ح": { word: "حصان", emoji: "🐎" },
    "خ": { word: "خروف", emoji: "🐑" },
    "د": { word: "دب", emoji: "🐻" },
    "ذ": { word: "ذئب", emoji: "🐺" },
    "ر": { word: "رجل", emoji: "👨" },
    "ز": { word: "زرافة", emoji: "🦒" },
    "س": { word: "سمكة", emoji: "🐟" },
    "ش": { word: "شمس", emoji: "☀️" },
    "ص": { word: "صقر", emoji: "🦅" },
    "ض": { word: "ضفدع", emoji: "🐸" },
    "ط": { word: "طائرة", emoji: "✈️" },
    "ظ": { word: "ظرف", emoji: "✉️" },
    "ع": { word: "عين", emoji: "👁️" },
    "غ": { word: "غيوم", emoji: "☁️" },
    "ف": { word: "فيل", emoji: "🐘" },
    "ق": { word: "قلب", emoji: "❤️" },
    "ك": { word: "كتاب", emoji: "📘" },
    "ل": { word: "ليمون", emoji: "🍋" },
    "م": { word: "موز", emoji: "🍌" },
    "ن": { word: "نمر", emoji: "🐯" },
    "ه": { word: "هلال", emoji: "🌙" },
    "و": { word: "وردة", emoji: "🌹" },
    "ي": { word: "يد", emoji: "✋" },
};

const olGame = {
    level: 1,
    round: 0,
    totalRounds: 5,
    levelLetters: [],
    collected: [],
    pairs: [],
    cards: [],
    matchedCount: 0,
    selectedCardId: null,
    active: false,
    session: 0
};

/* =========================================================
   🔊 صوت محلي فقط — إن لم يوجد ملف مطابق تمامًا يبقى صامتًا
   بدل أي TTS احتياطي (التزامًا بقاعدة "MP3 المحلي فقط")
   ========================================================= */

function speakOLLocal(text) {
    speakEducational(text);
}

/* =========================================================
   💾 حفظ/تحميل المستوى المفتوح — مفتاح معزول جديد
   ========================================================= */

function loadOLUnlockedLevel() {
    const saved = Number(localStorage.getItem("taha_ol_unlocked_level") || 1);
    return Math.min(Math.max(saved, 1), 4);
}

function saveOLUnlockedLevel(level) {
    const current = loadOLUnlockedLevel();
    if (level > current) {
        localStorage.setItem("taha_ol_unlocked_level", String(Math.min(level, 4)));
    }
}

/* =========================================================
   🧠 تدرّج الصعوبة داخل المستوى (جولات 1-2 سهلة، 3-4 متوسطة،
   5+ تحدٍّ) — عدد الأزواج ونوع الحروف المجتمعة كلاهما يتدرّج
   ========================================================= */

function olTierForRound(round) {
    if (round <= 2) return "easy";
    if (round <= 4) return "medium";
    return "hard";
}

function olPairCountForTier(tier, poolLength) {
    const wanted = tier === "easy" ? 3 : tier === "medium" ? 4 : 5;
    return Math.min(wanted, poolLength);
}

function olLettersAreSimilar(a, b) {
    const sim = (typeof LTR_SIMILAR_LETTERS !== "undefined") ? LTR_SIMILAR_LETTERS : {};
    return (sim[a] || []).includes(b) || (sim[b] || []).includes(a);
}

function selectOLLetters(pool, collected, count, tier) {

    /* الحروف التي لم تُجمَع صورتها بعد تُفضَّل أولًا */
    const ordered = shuffle(pool.filter(l => !collected.includes(l)))
        .concat(shuffle(pool.filter(l => collected.includes(l))));

    const chosen = [];

    if (tier === "hard") {

        /* تحدٍّ: ابدأ بحرف له متشابهات داخل نفس المستوى، ثم أضف متشابهاته */
        const seed = ordered.find(l => pool.some(o => o !== l && olLettersAreSimilar(l, o)));

        if (seed) {
            chosen.push(seed);
            pool.forEach(o => {
                if (chosen.length < count && o !== seed && olLettersAreSimilar(seed, o)) {
                    chosen.push(o);
                }
            });
        }

    } else if (tier === "easy") {

        /* سهل: تباعد الحروف المتشابهة قدر الإمكان */
        ordered.forEach(l => {
            if (chosen.length < count && !chosen.some(c => olLettersAreSimilar(c, l))) {
                chosen.push(l);
            }
        });
    }

    ordered.forEach(l => {
        if (chosen.length < count && !chosen.includes(l)) chosen.push(l);
    });

    return chosen;
}

/* =========================================================
   ▶️ بدء اللعبة — تبدأ دائمًا من المستوى المفتوح المحفوظ
   ========================================================= */

function resetOLLevelState() {
    const group = LETTER_LEVEL_GROUPS[olGame.level - 1];
    olGame.levelLetters = group ? group.letters.slice() : [];
    olGame.collected = [];
    olGame.round = 0;
    olGame.totalRounds = getMatchingTotalRounds(olGame.level);
    olGame.matchedCount = 0;
    olGame.selectedCardId = null;
    olGame.pairs = [];
    olGame.cards = [];
}

function startOLGame() {

    olGame.level = loadOLUnlockedLevel();
    resetOLLevelState();
    olGame.active = true;
    olGame.session++;

    showScreen("matchingPictureGame");

    setOLBackgroundInert(false);

    const overlay = $("olgLevelComplete");
    if (overlay) overlay.style.display = "none";

    renderOLGallery();
    updateOLHUD();
    clearOLMessage();

    setTimeout(() => {
        if (olGame.active) buildOLRound();
    }, 150);
}

/* =========================================================
   🧩 بناء جولة جديدة
   ========================================================= */

function buildOLRound() {

    if (!olGame.active) return;

    olGame.round++;
    olGame.matchedCount = 0;
    olGame.selectedCardId = null;

    const tier = olTierForRound(olGame.round);
    const count = olPairCountForTier(tier, olGame.levelLetters.length);

    const letterSet = selectOLLetters(olGame.levelLetters, olGame.collected, count, tier);

    olGame.pairs = letterSet.map((letter, index) => ({
        id: "OLG" + index,
        letter: letter,
        word: OL_PICTURE_BANK[letter].word,
        emoji: OL_PICTURE_BANK[letter].emoji
    }));

    const cards = [];

    olGame.pairs.forEach(pair => {
        cards.push({ cardId: pair.id + "-L", pairId: pair.id, type: "letter", pair: pair, matched: false });
        cards.push({ cardId: pair.id + "-P", pairId: pair.id, type: "picture", pair: pair, matched: false });
    });

    olGame.cards = shuffle(cards);

    renderOLGrid();
    updateOLHUD();
    showOLMessage("🧩 اربط كل حرف بالصورة التي تبدأ به");
}

/* =========================================================
   🎨 رسم الشبكة — بطاقات حرف كبيرة جدًا + بطاقات صورة "ملصقات"
   (الكلمة مخفية حتى لا تكشف الحل، وتظهر بعد الإجابة الصحيحة)
   ========================================================= */

function renderOLGrid() {

    const grid = $("olgGrid");
    if (!grid) return;

    grid.innerHTML = "";

    olGame.cards.forEach(card => {

        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.cardId = card.cardId;

        if (card.type === "letter") {

            btn.className = "olg-card olg-letter-card";

            const letterEl = document.createElement("span");
            letterEl.className = "olg-letter-display";
            letterEl.textContent = card.pair.letter;
            btn.appendChild(letterEl);

            btn.setAttribute("aria-label", "بطاقة الحرف " + letterWithFatha(card.pair.letter) + "، اضغط للاختيار");

        } else {

            btn.className = "olg-card olg-picture-card";

            const sticker = document.createElement("span");
            sticker.className = "olg-picture-sticker";
            sticker.setAttribute("aria-hidden", "true");
            sticker.textContent = card.pair.emoji;
            btn.appendChild(sticker);

            const wordEl = document.createElement("span");
            wordEl.className = "olg-picture-word";
            wordEl.setAttribute("aria-hidden", "true");

            const first = document.createElement("span");
            first.className = "olg-first-letter";
            first.textContent = card.pair.word.charAt(0);
            wordEl.appendChild(first);
            wordEl.appendChild(document.createTextNode(card.pair.word.slice(1)));
            btn.appendChild(wordEl);

            btn.setAttribute("aria-label", "بطاقة صورة " + card.pair.word + "، اضغط للاختيار");
        }

        btn.setAttribute("aria-pressed", "false");

        btn.addEventListener("click", () => {
            handleOLCardTap(card.cardId);
        });

        grid.appendChild(btn);
    });
}

function getOLCardButton(cardId) {
    return document.querySelector(`.olg-card[data-card-id="${CSS.escape(cardId)}"]`);
}

/* =========================================================
   👆 التعامل مع اختيار بطاقة — Tap-to-Select
   ========================================================= */

function handleOLCardTap(cardId) {

    if (!olGame.active) return;

    const card = olGame.cards.find(c => c.cardId === cardId);
    if (!card || card.matched) return;

    const btn = getOLCardButton(cardId);

    /* الحرف ينطق صوته بالفتحة، والصورة تنطق اسمها — MP3 محلي فقط */
    if (card.type === "letter") {
        speakOLLocal(letterWithFatha(card.pair.letter));
    } else {
        speakOLLocal(card.pair.word);
    }

    if (olGame.selectedCardId === null) {

        olGame.selectedCardId = cardId;

        if (btn) {
            btn.classList.add("olg-selected");
            btn.setAttribute("aria-pressed", "true");
        }

        return;
    }

    if (olGame.selectedCardId === cardId) {

        olGame.selectedCardId = null;

        if (btn) {
            btn.classList.remove("olg-selected");
            btn.setAttribute("aria-pressed", "false");
        }

        return;
    }

    const firstCardId = olGame.selectedCardId;
    const firstCard = olGame.cards.find(c => c.cardId === firstCardId);
    const firstBtn = getOLCardButton(firstCardId);

    const isMatch = firstCard && firstCard.pairId === card.pairId;

    if (isMatch) {
        handleOLCorrect(firstBtn, btn, firstCard, card);
    } else {
        handleOLWrong(firstBtn, btn);
    }
}

/* =========================================================
   ✅ إجابة صحيحة — ✓ + تثبيت بصري + إظهار الكلمة + نجمة +
   تقدّم + إضافة الصورة إلى المكتبة (بلا أي صوت إضافي)
   ========================================================= */

function handleOLCorrect(btnA, btnB, cardA, cardB) {

    const session = olGame.session;

    olGame.selectedCardId = null;
    cardA.matched = true;
    cardB.matched = true;
    olGame.matchedCount++;

    [btnA, btnB].forEach(btn => {
        if (!btn) return;
        btn.classList.remove("olg-selected");
        btn.classList.add("olg-correct");
        btn.disabled = true;
        btn.setAttribute("aria-pressed", "false");
    });

    const pair = cardA.pair;

    [[btnA, cardA], [btnB, cardB]].forEach(([btn, card]) => {
        if (!btn) return;
        btn.setAttribute(
            "aria-label",
            "بطاقة متطابقة بنجاح: " + (card.type === "letter"
                ? letterWithFatha(pair.letter)
                : pair.word)
        );
    });

    let newlyCollectedLetter = null;

    if (!olGame.collected.includes(pair.letter)) {
        olGame.collected.push(pair.letter);
        newlyCollectedLetter = pair.letter;
    }

    if (typeof addStars === "function") addStars(1);

    showOLMessage("🎉 أحسنت! " + pair.word + " يبدأ بحرف " + pair.letter);

    renderOLGallery(newlyCollectedLetter);
    updateOLHUD();

    if (olGame.matchedCount >= olGame.pairs.length) {

        setTimeout(() => {
            if (session !== olGame.session) return;
            if (!olGame.active) return;
            finishOLRound();
        }, 1200);
    }
}

/* =========================================================
   😊 إجابة خاطئة — × + اهتزاز خفيف، بلا أي عقوبة أو صوت لفظي
   ========================================================= */

function handleOLWrong(btnA, btnB) {

    const session = olGame.session;

    [btnA, btnB].forEach(btn => {
        if (btn) btn.classList.add("olg-wrong");
    });

    showOLMessage("😊 حاول مرة أخرى");

    setTimeout(() => {

        if (session !== olGame.session) return;

        [btnA, btnB].forEach(btn => {
            if (!btn) return;
            btn.classList.remove("olg-wrong", "olg-selected");
            btn.setAttribute("aria-pressed", "false");
        });

        olGame.selectedCardId = null;

    }, 650);
}

/* =========================================================
   ♿ عند ظهور شاشة النجاح (aria-modal) يُعطَّل ما خلفها (inert) حتى
   لا يصل إليه مستخدم لوحة المفاتيح أو قارئ الشاشة، ويُعاد بعد إغلاقها
   ========================================================= */

function olTrapDialogFocus(event) {
    if (event.key !== "Tab") return;
    const btn = $("olgLevelCompleteNextBtn");
    if (!btn) return;
    /* في الحوار زرّ واحد فقط — نُبقي التركيز عليه بدل أن يغادر الصفحة */
    event.preventDefault();
    btn.focus();
}

function setOLBackgroundInert(flag) {
    const wrapper = document.querySelector("#matchingPictureGame .olg-wrapper");
    if (!wrapper) return;
    Array.from(wrapper.children).forEach(child => {
        if (child.id === "olgLevelComplete") return;
        child.inert = !!flag;
    });
}

/* =========================================================
   🏁 إكمال الجولة/المستوى — شاشة نجاح أنيقة + Confetti محدود
   ========================================================= */

function finishOLRound() {

    const session = olGame.session;

    if (olGame.round < olGame.totalRounds) {

        showOLMessage("🌟 جولة مكتملة");

        setTimeout(() => {
            if (session !== olGame.session) return;
            if (!olGame.active) return;
            buildOLRound();
        }, 500);

        return;
    }

    olGame.active = false;

    const isLastLevel = olGame.level >= 4;

    saveOLUnlockedLevel(Math.min(olGame.level + 1, 4));

    const overlay = $("olgLevelComplete");
    const title = $("olgLevelCompleteTitle");
    const body = $("olgLevelCompleteBody");
    const nextBtn = $("olgLevelCompleteNextBtn");
    const summary = $("olgLevelCompleteGallery");

    if (title) {
        title.textContent = isLastLevel ? "🎉 أكملت كل المستويات!" : "🌟 أحسنت! أكملت المستوى";
    }

    if (body) {
        body.textContent = "جمعت " + arabicNumber(olGame.collected.length) +
            " من " + arabicNumber(olGame.levelLetters.length) + " صور في مكتبتك";
    }

    if (summary) {
        summary.innerHTML = "";
        olGame.levelLetters.forEach(letter => {
            if (olGame.collected.includes(letter)) {
                const span = document.createElement("span");
                span.textContent = OL_PICTURE_BANK[letter].emoji;
                summary.appendChild(span);
            }
        });
    }

    if (nextBtn) {
        nextBtn.textContent = isLastLevel ? "🏠 العودة للألعاب" : "▶ المستوى التالي";
        nextBtn.onclick = isLastLevel ? exitOLGame : advanceToNextOLLevel;
    }

    renderOLConfetti();

    setOLBackgroundInert(true);

    if (overlay) {
        overlay.addEventListener("keydown", olTrapDialogFocus);
        overlay.style.display = "flex";
    }

    if (nextBtn) {
        setTimeout(() => nextBtn.focus(), 50);
    }
}

function advanceToNextOLLevel() {

    olGame.level = Math.min(olGame.level + 1, 4);
    resetOLLevelState();
    olGame.active = true;
    olGame.session++;

    setOLBackgroundInert(false);

    const overlay = $("olgLevelComplete");
    if (overlay) overlay.style.display = "none";

    renderOLGallery();
    updateOLHUD();
    clearOLMessage();

    buildOLRound();
}

/* =========================================================
   🎊 قصاصات احتفال محدودة جدًا (8 قصاصات فقط)
   ========================================================= */

function renderOLConfetti() {

    const el = $("olgConfetti");
    if (!el) return;

    el.innerHTML = "";

    const colors = ["#fbbf24", "#4ade80", "#38bdf8", "#f472b6"];

    for (let i = 0; i < 8; i++) {

        const piece = document.createElement("div");
        piece.className = "olg-confetti-piece";
        piece.style.left = (10 + Math.random() * 80) + "%";
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = (Math.random() * 0.25) + "s";

        el.appendChild(piece);
    }

    setTimeout(() => {
        if (el) el.innerHTML = "";
    }, 1400);
}

/* =========================================================
   📚 مكتبة الصور — خانة لكل حرف في المستوى، تمتلئ بصورته عند
   إتقانه
   ========================================================= */

function renderOLGallery(justCollectedLetter) {

    const strip = $("olgGallery");
    if (!strip) return;

    strip.innerHTML = "";

    olGame.levelLetters.forEach(letter => {

        const slot = document.createElement("span");
        slot.className = "olg-gallery-slot";
        slot.setAttribute("role", "listitem");

        if (olGame.collected.includes(letter)) {
            slot.classList.add("filled");
            if (letter === justCollectedLetter) slot.classList.add("olg-just-filled");
            slot.textContent = OL_PICTURE_BANK[letter].emoji;
            slot.setAttribute("aria-label", "صورة مجمَّعة: " + OL_PICTURE_BANK[letter].word);
        } else {
            slot.setAttribute("aria-label", "خانة فارغة");
        }

        strip.appendChild(slot);
    });

    const countEl = $("olgGalleryCount");
    if (countEl) {
        countEl.textContent =
            arabicNumber(olGame.collected.length) + "/" +
            arabicNumber(olGame.levelLetters.length);
    }
}

/* =========================================================
   🖥️ واجهة المعلومات (HUD)
   ========================================================= */

function updateOLHUD() {

    const starsEl = $("olgStars");
    if (starsEl && typeof stars !== "undefined") {
        starsEl.textContent = arabicNumber(stars);
    }

    const levelEl = $("olgLevel");
    if (levelEl) levelEl.textContent = arabicNumber(olGame.level);

    const roundEl = $("olgRound");
    if (roundEl) roundEl.textContent = arabicNumber(Math.min(Math.max(olGame.round, 1), olGame.totalRounds));

    const totalEl = $("olgTotalRounds");
    if (totalEl) totalEl.textContent = arabicNumber(olGame.totalRounds);

    const fill = $("olgProgressFill");
    const track = $("olgProgressTrack");

    if (fill) {
        const done = Math.max(0, olGame.round - 1);
        const inRound = olGame.pairs.length ? olGame.matchedCount / olGame.pairs.length : 0;
        const pct = Math.min(100, Math.round(((done + inRound) / olGame.totalRounds) * 100));
        fill.style.width = pct + "%";
        if (track) track.setAttribute("aria-valuenow", String(pct));
    }
}

function showOLMessage(text) {
    const el = $("olgMessage");
    if (el) el.textContent = text;
}

function clearOLMessage() {
    const el = $("olgMessage");
    if (el) el.textContent = "";
}

/* =========================================================
   🚪 الخروج من اللعبة
   ========================================================= */

function exitOLGame() {

    olGame.active = false;
    olGame.session++;

    setOLBackgroundInert(false);

    const overlay = $("olgLevelComplete");
    if (overlay) overlay.style.display = "none";

    showScreen("games");
}

/* إيقاف هادئ عند مغادرة الشاشة عبر أي تنقّل عام — تغليف غير جراحي
   إضافي لـ showScreen (فوق التغليفات السابقة، بلا تعديل عليها) */

const originalShowScreenForOL = showScreen;

showScreen = function (screenId) {

    if (
        typeof olGame !== "undefined" &&
        olGame.active &&
        screenId !== "matchingPictureGame"
    ) {
        olGame.active = false;
        olGame.session++;

        setOLBackgroundInert(false);

        const overlay = $("olgLevelComplete");
        if (overlay) overlay.style.display = "none";
    }

    originalShowScreenForOL(screenId);
};

/* =========================================================
   🔚 نهاية قسم "حرف ↔ صورة" الاحترافي المستقل
   ========================================================= */


/* =========================================================================
   🆕 =====================================================================
   📝 صورة ↔ كلمة — نسخة احترافية مستقلة (Tap-to-Select)
   =====================================================================
   قسم جديد كليًا ومعزول تمامًا — لا يشارك أي حالة أو عنصر DOM أو تخزين
   مع بقية أقسام/ألعاب المطابقة. فكرته "لوحة التسمية": صور في الأعلى لكل
   منها خانة تسمية فارغة، وصينية بطاقات كلمات بالأسفل؛ يختار الطفل كلمة
   ثم صورتها (أو العكس) فتستقر الكلمة في خانة الصورة.

   البيانات: 110 زوجًا (كلمة + صورة) مُنتقاة من LETTER_UNITS — مصدر
   الصور الموجود أصلًا في التطبيق وكلماته هي نفسها كلمات ملفات الصوت
   المحلية. استُبعد منه ما فيه لبس أو خطأ: صور مكررة لكلمتين، صور لا
   تمثّل الكلمة (مثل «ذيل» 🦁، «تين» 🍈، «ثلاجة» 🧊، «طاولة» 🪑)، أفعال،
   وإيموجي مركّب أو حديث قد لا يظهر على الأجهزة القديمة. لم تُضَف أي
   صورة جديدة. المستويات الأربعة = مجموعات الحروف الأربع المعتمدة
   (بحسب أول حرف في الكلمة)، بلا خلط بينها.

   التدرّج داخل المستوى مرتبط بمهارة القراءة نفسها:
   - سهل: كلمات قصيرة وبدايات مختلفة، والصورة تنطق اسمها عند لمسها.
   - متوسط: أي طول مع بدايات مختلفة، والصورة تنطق أيضًا.
   - تحدٍّ: ثلاث كلمات تتشارك الحرف الأول (يجب قراءتها كاملة)، وتصمت
     الصورة ويبقى نطق الكلمة للتحقق (سحب الدعم تدريجيًا).
   كما يُمنع اجتماع كلمتين قد تلتبس صورتاهما (دجاجة/ديك، قرد/غوريلا).

   الصوت: ملفات MP3 المحلية فقط (اسم الكلمة) — لا Browser ولا Google
   TTS ولا أي صوت بديل داخل هذه اللعبة.
========================================================================= */

const PW_WORD_BANK = {
    1: [
        { word: "أناناس", emoji: "🍍" }, { word: "أرنب", emoji: "🐰" }, { word: "أسد", emoji: "🦁" },
        { word: "أذن", emoji: "👂" }, { word: "أخطبوط", emoji: "🐙" }, { word: "بيت", emoji: "🏠" },
        { word: "بنت", emoji: "👧" }, { word: "بطة", emoji: "🦆" }, { word: "باب", emoji: "🚪" },
        { word: "برتقال", emoji: "🍊" }, { word: "بقرة", emoji: "🐄" }, { word: "بطيخ", emoji: "🍉" },
        { word: "تفاح", emoji: "🍎" }, { word: "تاج", emoji: "👑" }, { word: "تمساح", emoji: "🐊" },
        { word: "ثعلب", emoji: "🦊" }, { word: "ثوم", emoji: "🧄" }, { word: "ثعبان", emoji: "🐍" },
        { word: "ثلج", emoji: "❄️" }, { word: "جسر", emoji: "🌉" }, { word: "جبنة", emoji: "🧀" },
        { word: "جرس", emoji: "🔔" }, { word: "جزر", emoji: "🥕" }, { word: "جبل", emoji: "⛰️" },
        { word: "جمل", emoji: "🐪" }, { word: "حصان", emoji: "🐎" }, { word: "حليب", emoji: "🥛" },
        { word: "حذاء", emoji: "👞" }, { word: "حوت", emoji: "🐳" }, { word: "حقيبة", emoji: "🎒" },
        { word: "خيمة", emoji: "⛺" }, { word: "خيار", emoji: "🥒" }, { word: "خس", emoji: "🥬" },
        { word: "خوخ", emoji: "🍑" }, { word: "خبز", emoji: "🍞" }, { word: "خروف", emoji: "🐑" },
    ],
    2: [
        { word: "دجاجة", emoji: "🐔" }, { word: "دب", emoji: "🐻" }, { word: "ديك", emoji: "🐓" },
        { word: "دلفين", emoji: "🐬" }, { word: "دفتر", emoji: "📓" }, { word: "دراجة", emoji: "🚲" },
        { word: "ذئب", emoji: "🐺" }, { word: "زهرة", emoji: "🌸" }, { word: "زرافة", emoji: "🦒" },
        { word: "سفينة", emoji: "🚢" }, { word: "سيارة", emoji: "🚗" }, { word: "سمكة", emoji: "🐟" },
        { word: "ساعة", emoji: "⏰" }, { word: "سرير", emoji: "🛏️" }, { word: "شمس", emoji: "☀️" },
        { word: "شجرة", emoji: "🌳" }, { word: "شمعة", emoji: "🕯️" }, { word: "صندوق", emoji: "📦" },
        { word: "صاروخ", emoji: "🚀" }, { word: "صحن", emoji: "🍽️" }, { word: "صبار", emoji: "🌵" },
    ],
    3: [
        { word: "ضرس", emoji: "🦷" }, { word: "ضفدع", emoji: "🐸" }, { word: "طائرة", emoji: "✈️" },
        { word: "طاووس", emoji: "🦚" }, { word: "طفل", emoji: "👶" }, { word: "ظرف", emoji: "✉️" },
        { word: "علم", emoji: "🚩" }, { word: "عصفور", emoji: "🐦" }, { word: "عين", emoji: "👁️" },
        { word: "عنب", emoji: "🍇" }, { word: "عسل", emoji: "🍯" }, { word: "عصير", emoji: "🧃" },
        { word: "غيوم", emoji: "☁️" }, { word: "غوريلا", emoji: "🦍" }, { word: "فراشة", emoji: "🦋" },
        { word: "فستان", emoji: "👗" }, { word: "فانوس", emoji: "🏮" }, { word: "فراولة", emoji: "🍓" },
        { word: "فيل", emoji: "🐘" }, { word: "فأر", emoji: "🐭" }, { word: "قميص", emoji: "👕" },
        { word: "قلم", emoji: "✏️" }, { word: "قرد", emoji: "🐒" }, { word: "قلب", emoji: "❤️" },
        { word: "قفاز", emoji: "🧤" }, { word: "قصر", emoji: "🏰" },
    ],
    4: [
        { word: "كرة", emoji: "⚽" }, { word: "كلب", emoji: "🐶" }, { word: "كرسي", emoji: "🪑" },
        { word: "كيك", emoji: "🎂" }, { word: "كرز", emoji: "🍒" }, { word: "كتاب", emoji: "📘" },
        { word: "ليمون", emoji: "🍋" }, { word: "لحم", emoji: "🥩" }, { word: "لمبة", emoji: "💡" },
        { word: "لعبة", emoji: "🧸" }, { word: "لسان", emoji: "👅" }, { word: "مدرسة", emoji: "🏫" },
        { word: "مسجد", emoji: "🕌" }, { word: "مقص", emoji: "✂️" }, { word: "مفتاح", emoji: "🔑" },
        { word: "موز", emoji: "🍌" }, { word: "نسر", emoji: "🦅" }, { word: "نحل", emoji: "🐝" },
        { word: "نجمة", emoji: "⭐" }, { word: "نمر", emoji: "🐯" }, { word: "نخلة", emoji: "🌴" },
        { word: "هلال", emoji: "🌙" }, { word: "هدية", emoji: "🎁" }, { word: "هاتف", emoji: "📱" },
        { word: "ولد", emoji: "👦" }, { word: "وردة", emoji: "🌹" }, { word: "يد", emoji: "✋" },
    ],
};

const PW_CONFLICT_GROUPS = [
    ["دجاجة", "ديك"],
    ["قرد", "غوريلا"]
];

const pwGame = {
    level: 1,
    round: 0,
    totalRounds: 5,
    tier: "easy",
    levelWords: [],
    collected: [],
    pairs: [],
    items: [],
    matchedCount: 0,
    selectedId: null,
    consecutiveWrong: 0,
    active: false,
    session: 0
};

/* =========================================================
   🔊 صوت محلي فقط — إن لم يوجد ملف مطابق تمامًا يبقى صامتًا
   بدل أي TTS احتياطي
   ========================================================= */

function speakPWLocal(text) {
    speakEducational(text);
}

function pwEmojiFor(word) {
    for (const lvl of Object.keys(PW_WORD_BANK)) {
        const hit = PW_WORD_BANK[lvl].find(e => e.word === word);
        if (hit) return hit.emoji;
    }
    return "";
}

/* =========================================================
   💾 حفظ/تحميل المستوى المفتوح — مفتاح معزول جديد
   ========================================================= */

function loadPWUnlockedLevel() {
    const saved = Number(localStorage.getItem("taha_pw_unlocked_level") || 1);
    return Math.min(Math.max(saved, 1), 4);
}

function savePWUnlockedLevel(level) {
    const current = loadPWUnlockedLevel();
    if (level > current) {
        localStorage.setItem("taha_pw_unlocked_level", String(Math.min(level, 4)));
    }
}

/* =========================================================
   🧠 تدرّج الصعوبة داخل المستوى (جولات 1-2 سهلة، 3-4 متوسطة،
   5+ تحدٍّ)
   ========================================================= */

function pwTierForRound(round) {
    if (round <= 2) return "easy";
    if (round <= 4) return "medium";
    return "hard";
}

function pwPairCountForTier(tier, poolLength) {
    const wanted = tier === "easy" ? 3 : tier === "medium" ? 4 : 5;
    return Math.min(wanted, poolLength);
}

/* سحب الدعم الصوتي تدريجيًا: في التحدّي تصمت الصورة ويبقى نطق الكلمة */
function pwPictureSpeaks(tier) {
    return tier !== "hard";
}

function pwWordLen(word) {
    return Array.from(word).length;
}

function pwWordsConflict(a, b) {
    return PW_CONFLICT_GROUPS.some(g => g.includes(a) && g.includes(b));
}

function pwSelectOnce(poolWords, collected, count, tier) {

    /* الكلمات التي لم يتعلّمها الطفل بعد تُفضَّل أولًا */
    const ordered = shuffle(poolWords.filter(w => !collected.includes(w)))
        .concat(shuffle(poolWords.filter(w => collected.includes(w))));

    const chosen = [];

    const canAdd = (w, opts) => {
        if (chosen.includes(w)) return false;
        if (chosen.some(c => pwWordsConflict(c, w))) return false;
        if (opts.distinctFirst && chosen.some(c => c.charAt(0) === w.charAt(0))) return false;
        if (opts.maxLen && pwWordLen(w) > opts.maxLen) return false;
        return true;
    };

    const fill = (opts, list) => {
        list.forEach(w => {
            if (chosen.length < count && canAdd(w, opts)) chosen.push(w);
        });
    };

    if (tier === "hard") {

        /* تحدٍّ: ثلاث كلمات تتشارك الحرف الأول (إن وُجدت) */
        const countByLetter = {};
        poolWords.forEach(w => {
            countByLetter[w.charAt(0)] = (countByLetter[w.charAt(0)] || 0) + 1;
        });

        const seed = ordered.find(w => countByLetter[w.charAt(0)] >= 3);

        if (seed) {
            let cluster = 0;
            [seed].concat(ordered.filter(w => w !== seed && w.charAt(0) === seed.charAt(0)))
                .forEach(w => {
                    if (cluster < 3 && chosen.length < count && canAdd(w, {})) {
                        chosen.push(w);
                        cluster++;
                    }
                });
        }

        /* ثم كلمات أطول بدايات مختلفة */
        const longFirst = ordered.slice().sort((a, b) =>
            (pwWordLen(b) >= 5 ? 1 : 0) - (pwWordLen(a) >= 5 ? 1 : 0)
        );
        fill({ distinctFirst: true }, longFirst);

    } else if (tier === "easy") {

        /* سهل: كلمات قصيرة وبدايات مختلفة */
        fill({ distinctFirst: true, maxLen: 3 }, ordered);
        fill({ distinctFirst: true, maxLen: 4 }, ordered);

    } else {

        fill({ distinctFirst: true }, ordered);
    }

    /* احتياط: تخفيف الشروط لضمان اكتمال العدد دائمًا */
    fill({}, ordered);

    return chosen;
}

/* الخوارزمية أعلاه جشعة: قد تقع في طريق مسدود (مثلًا اختيار «قرد» يمنع
   «غوريلا») فتُكمل بكلمة سبق تعلّمها بينما يوجد حلّ أفضل. لذلك نجرّب عدة
   محاولات ونأخذ الأفضل: أكثر كلمات جديدة، مع احترام قاعدة المستوى. */

function pwScoreSelection(chosen, collected, tier) {
    const fresh = chosen.filter(w => !collected.includes(w)).length;

    const firsts = {};
    chosen.forEach(w => { firsts[w.charAt(0)] = (firsts[w.charAt(0)] || 0) + 1; });
    const maxShare = Math.max.apply(null, Object.values(firsts));

    let rule = 0;

    if (tier === "hard") {
        rule = maxShare >= 3 ? 5 : 0;
    } else {
        rule = maxShare === 1 ? 5 : 0;
        if (tier === "easy" && chosen.every(w => pwWordLen(w) <= 3)) rule += 3;
    }

    return fresh * 10 + rule;
}

function selectPWWords(poolWords, collected, count, tier) {

    let best = null;
    let bestScore = -1;

    for (let attempt = 0; attempt < 10; attempt++) {

        const candidate = pwSelectOnce(poolWords, collected, count, tier);
        const score = pwScoreSelection(candidate, collected, tier);

        if (candidate.length === count && score > bestScore) {
            best = candidate;
            bestScore = score;
        }

        /* أعلى درجة ممكنة: كل الكلمات جديدة + قاعدة المستوى محقَّقة كاملة */
        const maxPossible = count * 10 + (tier === "easy" ? 8 : 5);
        if (bestScore >= maxPossible) break;
    }

    return best || pwSelectOnce(poolWords, collected, count, tier);
}

/* =========================================================
   ▶️ بدء اللعبة — تبدأ دائمًا من المستوى المفتوح المحفوظ
   ========================================================= */

function resetPWLevelState() {
    pwGame.levelWords = (PW_WORD_BANK[pwGame.level] || []).map(e => e.word);
    pwGame.collected = [];
    pwGame.round = 0;
    pwGame.totalRounds = getMatchingTotalRounds(pwGame.level);
    pwGame.tier = "easy";
    pwGame.matchedCount = 0;
    pwGame.selectedId = null;
    pwGame.consecutiveWrong = 0;
    pwGame.pairs = [];
    pwGame.items = [];
}

function startPWGame() {

    pwGame.level = loadPWUnlockedLevel();
    resetPWLevelState();
    pwGame.active = true;
    pwGame.session++;

    showScreen("matchingPictureWordGame");

    setPWBackgroundInert(false);

    const overlay = $("pwgLevelComplete");
    if (overlay) overlay.style.display = "none";

    updatePWHUD();
    clearPWMessage();

    setTimeout(() => {
        if (pwGame.active) buildPWRound();
    }, 150);
}

/* =========================================================
   🧩 بناء جولة جديدة
   ========================================================= */

function pwShuffleTilesAwayFromPictures(pictures, tiles) {
    /* لا نترك ترتيب البطاقات مطابقًا لترتيب الصور (حتى لا يُخمَّن
       الحل بالموضع): نعيد الخلط حتى لا يقع أي تطابق موضعي */
    for (let attempt = 0; attempt < 12; attempt++) {
        const candidate = shuffle(tiles);
        if (candidate.every((t, i) => !pictures[i] || t.pairId !== pictures[i].pairId)) {
            return candidate;
        }
    }
    const rotated = tiles.slice();
    if (rotated.length > 1) rotated.push(rotated.shift());
    return rotated;
}

function buildPWRound() {

    if (!pwGame.active) return;

    pwGame.round++;
    pwGame.matchedCount = 0;
    pwGame.selectedId = null;
    pwGame.consecutiveWrong = 0;

    const tier = pwTierForRound(pwGame.round);
    pwGame.tier = tier;

    const count = pwPairCountForTier(tier, pwGame.levelWords.length);
    const words = selectPWWords(pwGame.levelWords, pwGame.collected, count, tier);

    pwGame.pairs = words.map((word, index) => ({
        id: "PWG" + index,
        word: word,
        emoji: pwEmojiFor(word)
    }));

    const pictures = shuffle(pwGame.pairs.map(pair => ({
        itemId: pair.id + "-P", pairId: pair.id, kind: "picture", pair: pair, matched: false
    })));

    const tiles = pwShuffleTilesAwayFromPictures(
        pictures,
        pwGame.pairs.map(pair => ({
            itemId: pair.id + "-W", pairId: pair.id, kind: "tile", pair: pair, matched: false
        }))
    );

    pwGame.items = pictures.concat(tiles);

    renderPWBoard(pictures, tiles);
    updatePWHUD();

    showPWMessage(
        tier === "hard"
            ? "🔍 تحدٍّ: اقرأ الكلمات بعناية ثم اختر الصورة"
            : "🧩 اختر كلمة ثم الصورة التي تدل عليها"
    );
}

/* =========================================================
   🎨 رسم اللوحة — صور بخانات تسمية + صينية كلمات
   ========================================================= */

function renderPWBoard(pictures, tiles) {

    const board = $("pwgBoard");
    const tray = $("pwgTray");
    if (!board || !tray) return;

    board.innerHTML = "";
    tray.innerHTML = "";

    pictures.forEach(item => {

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pwg-pic-card";
        btn.dataset.itemId = item.itemId;

        const emoji = document.createElement("span");
        emoji.className = "pwg-pic-emoji";
        emoji.setAttribute("aria-hidden", "true");
        emoji.textContent = item.pair.emoji;
        btn.appendChild(emoji);

        const slot = document.createElement("span");
        slot.className = "pwg-pic-slot";
        slot.setAttribute("aria-hidden", "true");
        btn.appendChild(slot);

        btn.setAttribute("aria-label", "صورة " + item.pair.word + "، اضغط للاختيار");
        btn.setAttribute("aria-pressed", "false");

        btn.addEventListener("click", () => handlePWTap(item.itemId));

        board.appendChild(btn);
    });

    tiles.forEach(item => {

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pwg-tile";
        btn.dataset.itemId = item.itemId;
        btn.textContent = item.pair.word;

        btn.setAttribute("aria-label", "الكلمة " + item.pair.word + "، اضغط للاختيار");
        btn.setAttribute("aria-pressed", "false");

        btn.addEventListener("click", () => handlePWTap(item.itemId));

        tray.appendChild(btn);
    });
}

function getPWButton(itemId) {
    return document.querySelector(
        `#matchingPictureWordGame [data-item-id="${CSS.escape(itemId)}"]`
    );
}

function clearPWHints() {
    document
        .querySelectorAll("#matchingPictureWordGame .pwg-hint")
        .forEach(el => el.classList.remove("pwg-hint"));
}

function setPWSelected(itemId, flag) {
    const btn = getPWButton(itemId);
    if (!btn) return;
    btn.classList.toggle("pwg-selected", flag);
    btn.setAttribute("aria-pressed", flag ? "true" : "false");
}

/* =========================================================
   👆 التعامل مع اختيار بطاقة — Tap-to-Select
   (كلمة ثم صورة، أو صورة ثم كلمة؛ لمس بطاقة من النوع نفسه
   ينقل التحديد إليها؛ لمس المحدَّدة مرة ثانية يُلغيها)
   ========================================================= */

function handlePWTap(itemId) {

    if (!pwGame.active) return;

    const item = pwGame.items.find(i => i.itemId === itemId);
    if (!item || item.matched) return;

    /* الصوت: الكلمة تنطق دائمًا؛ والصورة تنطق في السهل والمتوسط فقط */
    if (item.kind === "tile" || pwPictureSpeaks(pwGame.tier)) {
        speakPWLocal(item.pair.word);
    }

    if (pwGame.selectedId === null) {

        pwGame.selectedId = itemId;
        setPWSelected(itemId, true);

        showPWMessage(
            item.kind === "tile"
                ? "👆 اخترتَ «" + item.pair.word + "» — الآن اختر صورتها"
                : "👆 اخترتَ صورة — الآن اختر كلمتها"
        );

        return;
    }

    if (pwGame.selectedId === itemId) {

        setPWSelected(itemId, false);
        pwGame.selectedId = null;
        clearPWMessage();

        return;
    }

    const first = pwGame.items.find(i => i.itemId === pwGame.selectedId);

    /* بطاقة من النوع نفسه: ننقل التحديد إليها بدل تقييم خاطئ */
    if (first && first.kind === item.kind) {

        setPWSelected(first.itemId, false);
        pwGame.selectedId = itemId;
        setPWSelected(itemId, true);

        showPWMessage(
            item.kind === "tile"
                ? "👆 اخترتَ «" + item.pair.word + "» — الآن اختر صورتها"
                : "👆 اخترتَ صورة — الآن اختر كلمتها"
        );

        return;
    }

    if (first && first.pairId === item.pairId) {
        handlePWCorrect(first, item);
    } else {
        handlePWWrong(first, item);
    }
}

/* =========================================================
   ✅ إجابة صحيحة — ✓ + استقرار الكلمة في خانة الصورة + نجمة +
   تقدّم + إضافة الكلمة إلى "كلماتي" (بلا أي صوت إضافي)
   ========================================================= */

function handlePWCorrect(a, b) {

    const session = pwGame.session;

    const picture = a.kind === "picture" ? a : b;
    const tile = a.kind === "tile" ? a : b;

    picture.matched = true;
    tile.matched = true;
    pwGame.selectedId = null;
    pwGame.consecutiveWrong = 0;
    pwGame.matchedCount++;

    clearPWHints();

    const picBtn = getPWButton(picture.itemId);
    const tileBtn = getPWButton(tile.itemId);
    const word = picture.pair.word;

    if (picBtn) {
        picBtn.classList.remove("pwg-selected", "pwg-hint");
        picBtn.classList.add("pwg-correct");
        picBtn.disabled = true;
        picBtn.setAttribute("aria-pressed", "false");
        picBtn.setAttribute("aria-label", "صورة مطابقة بنجاح: " + word);

        const slot = picBtn.querySelector(".pwg-pic-slot");
        if (slot) {
            slot.textContent = word;
            slot.classList.add("filled");
        }
    }

    if (tileBtn) {
        tileBtn.classList.remove("pwg-selected", "pwg-hint");
        tileBtn.classList.add("pwg-placed");
        tileBtn.disabled = true;
        tileBtn.setAttribute("aria-pressed", "false");
        tileBtn.setAttribute("aria-hidden", "true");
    }

    if (!pwGame.collected.includes(word)) {
        pwGame.collected.push(word);
    }

    if (typeof addStars === "function") addStars(1);

    showPWMessage("🎉 أحسنت! «" + word + "»");

    updatePWHUD();

    if (pwGame.matchedCount >= pwGame.pairs.length) {

        setTimeout(() => {
            if (session !== pwGame.session) return;
            if (!pwGame.active) return;
            finishPWRound();
        }, 1200);
    }
}

/* =========================================================
   😊 إجابة خاطئة — × + اهتزاز خفيف، بلا أي عقوبة أو صوت لفظي.
   بعد خطأين متتاليين: تلميح هادئ (إطار أصفر + 💡) على البطاقة
   المناسبة لما اختاره الطفل أولًا، لتقليل الإحباط
   ========================================================= */

function handlePWWrong(first, second) {

    const session = pwGame.session;

    const firstBtn = first ? getPWButton(first.itemId) : null;
    const secondBtn = getPWButton(second.itemId);

    [firstBtn, secondBtn].forEach(btn => {
        if (btn) btn.classList.add("pwg-wrong");
    });

    pwGame.consecutiveWrong++;

    clearPWHints();

    if (pwGame.consecutiveWrong >= 2 && first) {

        const partner = pwGame.items.find(i =>
            i.pairId === first.pairId && i.kind !== first.kind && !i.matched
        );
        const partnerBtn = partner ? getPWButton(partner.itemId) : null;

        if (partnerBtn) {
            partnerBtn.classList.add("pwg-hint");
            showPWMessage("💡 تلميح: انظر إلى البطاقة ذات الإطار الأصفر");
        } else {
            showPWMessage("😊 حاول مرة أخرى");
        }

    } else {

        showPWMessage("😊 حاول مرة أخرى");
    }

    setTimeout(() => {

        if (session !== pwGame.session) return;

        [firstBtn, secondBtn].forEach(btn => {
            if (!btn) return;
            btn.classList.remove("pwg-wrong", "pwg-selected");
            btn.setAttribute("aria-pressed", "false");
        });

        pwGame.selectedId = null;

    }, 650);
}

/* =========================================================
   ♿ عند ظهور شاشة النجاح (aria-modal) يُعطَّل ما خلفها (inert)
   ويُحبَس التركيز داخلها، ويُعاد كل ذلك بعد إغلاقها
   ========================================================= */

function pwTrapDialogFocus(event) {

    if (event.key !== "Tab") return;

    /* عناصر الحوار القابلة للتركيز: صفحة "قاموسي" (قابلة للتمرير بالأسهم)
       ثم زرّ المتابعة. نُدير الحلقة بينهما فلا يغادر التركيز الحوار،
       ويبقى القاموس متاحًا لمستخدم لوحة المفاتيح */
    const focusables = [$("pwgLevelCompleteDict"), $("pwgLevelCompleteNextBtn")]
        .filter(Boolean);

    if (!focusables.length) return;

    event.preventDefault();

    const index = focusables.indexOf(document.activeElement);
    let target;

    if (event.shiftKey) {
        target = index <= 0 ? focusables[focusables.length - 1] : focusables[index - 1];
    } else {
        target = (index === -1 || index === focusables.length - 1)
            ? focusables[0]
            : focusables[index + 1];
    }

    target.focus();
}

function setPWBackgroundInert(flag) {
    const wrapper = document.querySelector("#matchingPictureWordGame .pwg-wrapper");
    if (!wrapper) return;
    Array.from(wrapper.children).forEach(child => {
        if (child.id === "pwgLevelComplete") return;
        child.inert = !!flag;
    });
}

/* =========================================================
   🏁 إكمال الجولة/المستوى — شاشة نجاح أنيقة + صفحة "قاموسي" +
   Confetti محدود
   ========================================================= */

function finishPWRound() {

    const session = pwGame.session;

    if (pwGame.round < pwGame.totalRounds) {

        showPWMessage("🌟 جولة مكتملة");

        setTimeout(() => {
            if (session !== pwGame.session) return;
            if (!pwGame.active) return;
            buildPWRound();
        }, 500);

        return;
    }

    pwGame.active = false;

    const isLastLevel = pwGame.level >= 4;

    savePWUnlockedLevel(Math.min(pwGame.level + 1, 4));

    const overlay = $("pwgLevelComplete");
    const title = $("pwgLevelCompleteTitle");
    const body = $("pwgLevelCompleteBody");
    const nextBtn = $("pwgLevelCompleteNextBtn");
    const dict = $("pwgLevelCompleteDict");

    if (title) {
        title.textContent = isLastLevel ? "🎉 أكملت كل المستويات!" : "🌟 أحسنت! أكملت المستوى";
    }

    if (body) {
        body.textContent = "تعلّمت " + arabicNumber(pwGame.collected.length) +
            " كلمة جديدة في قاموسك";
    }

    if (dict) {
        dict.innerHTML = "";
        (PW_WORD_BANK[pwGame.level] || []).forEach(entry => {
            if (!pwGame.collected.includes(entry.word)) return;

            const cell = document.createElement("div");
            cell.className = "pwg-dict-item";
            cell.setAttribute("role", "listitem");

            const emoji = document.createElement("span");
            emoji.className = "pwg-dict-emoji";
            emoji.setAttribute("aria-hidden", "true");
            emoji.textContent = entry.emoji;

            const word = document.createElement("span");
            word.className = "pwg-dict-word";
            word.textContent = entry.word;

            cell.appendChild(emoji);
            cell.appendChild(word);
            dict.appendChild(cell);
        });
    }

    if (nextBtn) {
        nextBtn.textContent = isLastLevel ? "🏠 العودة للألعاب" : "▶ المستوى التالي";
        nextBtn.onclick = isLastLevel ? exitPWGame : advanceToNextPWLevel;
    }

    renderPWConfetti();

    setPWBackgroundInert(true);

    if (overlay) {
        overlay.addEventListener("keydown", pwTrapDialogFocus);
        overlay.style.display = "flex";
    }

    if (nextBtn) {
        setTimeout(() => nextBtn.focus(), 50);
    }
}

function advanceToNextPWLevel() {

    pwGame.level = Math.min(pwGame.level + 1, 4);
    resetPWLevelState();
    pwGame.active = true;
    pwGame.session++;

    setPWBackgroundInert(false);

    const overlay = $("pwgLevelComplete");
    if (overlay) overlay.style.display = "none";

    updatePWHUD();
    clearPWMessage();

    buildPWRound();
}

/* =========================================================
   🎊 قصاصات احتفال محدودة جدًا (8 قصاصات فقط)
   ========================================================= */

function renderPWConfetti() {

    const el = $("pwgConfetti");
    if (!el) return;

    el.innerHTML = "";

    const colors = ["#2dd4bf", "#fbbf24", "#4ade80", "#f472b6"];

    for (let i = 0; i < 8; i++) {

        const piece = document.createElement("div");
        piece.className = "pwg-confetti-piece";
        piece.style.left = (10 + Math.random() * 80) + "%";
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = (Math.random() * 0.25) + "s";

        el.appendChild(piece);
    }

    setTimeout(() => {
        if (el) el.innerHTML = "";
    }, 1400);
}

/* =========================================================
   🖥️ واجهة المعلومات (HUD)
   ========================================================= */

function updatePWHUD() {

    const starsEl = $("pwgStars");
    if (starsEl && typeof stars !== "undefined") {
        starsEl.textContent = arabicNumber(stars);
    }

    const levelEl = $("pwgLevel");
    if (levelEl) levelEl.textContent = arabicNumber(pwGame.level);

    const roundEl = $("pwgRound");
    if (roundEl) roundEl.textContent = arabicNumber(Math.min(Math.max(pwGame.round, 1), pwGame.totalRounds));

    const totalEl = $("pwgTotalRounds");
    if (totalEl) totalEl.textContent = arabicNumber(pwGame.totalRounds);

    const wordsEl = $("pwgWordsCount");
    if (wordsEl) wordsEl.textContent = arabicNumber(pwGame.collected.length);

    const fill = $("pwgProgressFill");
    const track = $("pwgProgressTrack");

    if (fill) {
        const done = Math.max(0, pwGame.round - 1);
        const inRound = pwGame.pairs.length ? pwGame.matchedCount / pwGame.pairs.length : 0;
        const pct = Math.min(100, Math.round(((done + inRound) / pwGame.totalRounds) * 100));
        fill.style.width = pct + "%";
        if (track) track.setAttribute("aria-valuenow", String(pct));
    }
}

function showPWMessage(text) {
    const el = $("pwgMessage");
    if (el) el.textContent = text;
}

function clearPWMessage() {
    const el = $("pwgMessage");
    if (el) el.textContent = "";
}

/* =========================================================
   🚪 الخروج من اللعبة
   ========================================================= */

function exitPWGame() {

    pwGame.active = false;
    pwGame.session++;

    setPWBackgroundInert(false);

    const overlay = $("pwgLevelComplete");
    if (overlay) overlay.style.display = "none";

    showScreen("games");
}

/* إيقاف هادئ عند مغادرة الشاشة عبر أي تنقّل عام — تغليف غير جراحي
   إضافي لـ showScreen (فوق التغليفات السابقة، بلا تعديل عليها) */

const originalShowScreenForPW = showScreen;

showScreen = function (screenId) {

    if (
        typeof pwGame !== "undefined" &&
        pwGame.active &&
        screenId !== "matchingPictureWordGame"
    ) {
        pwGame.active = false;
        pwGame.session++;

        setPWBackgroundInert(false);

        const overlay = $("pwgLevelComplete");
        if (overlay) overlay.style.display = "none";
    }

    originalShowScreenForPW(screenId);
};

/* =========================================================
   🔚 نهاية قسم "صورة ↔ كلمة" الاحترافي المستقل
   ========================================================= */

/* =========================================================================
   🆕 =====================================================================
   🌟 أرقامي الجميلة — أنشطة تفاعلية داخل قسم الأرقام
   =====================================================================
   تحويل تفاعلي لمحتوى كتابَي «أرقامي الجميلة ١–١٠» و«أرقامي الجميلة ١١–٢٠»
   (٣ صفحات لكل رقم). كل نشاط في الكتابين صار نشاطًا تفاعليًا فعليًا بنفس
   عنوانه وتدرّجه: تلوين بالأصبع، اختيار، بحث ووسم، توصيل (سحب أو لمس)،
   تتبّع وكتابة، عدّ ولوحة أرقام، ملء تسلسل، سحب وإفلات، متاهة، توصيل
   نقاط، وبناء إطار العشرة.

   قسم جديد معزول: كل المعرّفات تبدأ بـ aj / AJ ومفتاح الحفظ
   taha_aj_progress_v1، ولا يشارك أي حالة مع الألعاب أو الأقسام الأخرى.
   الأرقام عربية هندية فقط. بلا مؤقّت ولا أرواح ولا عقوبات: الخطأ يهتز
   بهدوء ثم يُعاد، وبعد خطأين متتاليين يظهر تلميح هادئ (إطار أصفر + 💡).
   الصوت: ملفات MP3 المحلية فقط (كلمات الأرقام ١–٢٠) — لا Browser ولا
   Google TTS إطلاقًا داخل هذا القسم.
========================================================================= */

const AJ_KEY = "taha_aj_progress_v1";

const AJ_COLORS = [
    { id: "red",    hex: "#ef6c5b", name: "الأحمر" },
    { id: "orange", hex: "#f5a54a", name: "البرتقالي" },
    { id: "yellow", hex: "#f6d55c", name: "الأصفر" },
    { id: "green",  hex: "#6cc27a", name: "الأخضر" },
    { id: "blue",   hex: "#58a6e0", name: "الأزرق" },
    { id: "purple", hex: "#a98ad8", name: "البنفسجي" }
];

const AJ_PASTELS = ["#dbe8f6", "#e3f1e0", "#fbe8d8", "#fbf1cf", "#ebe3f3"];

/* خطة كل رقم: ٣ صفحات (مطابقة لصفحات الكتابين) — كل عنصر نوع نشاط */

const AJ_PLAN_1_10 = [
    ["colorNumberObjects", "pointNumber", "circleCorrect", "findGrid", "connectIdentical"],
    ["circleRows", "crossGrid", "connectSet", "connectQuantity"],
    ["trace", "countWrite"]
];

const AJ_PLAN_11_20 = {
    11: [["frameColor", "balloonsFind", "numberLine"], ["tenHowManyCircle", "connectPictures", "colorReveal"], ["traceTwo", "frameBuilder"]],
    12: [["frameColor", "countCircle"], ["beforeAfter", "circleBigger", "maze"], ["traceTwo", "numberLine", "crossOutCard"]],
    13: [["frameColor", "balloonsFind"], ["baseTenCircle", "missingNumber", "colorReveal"], ["traceTwo", "orderNumbers"]],
    14: [["frameColor", "countCircle"], ["tenHowManyWrite", "beforeAfter", "dotToDot"], ["traceTwo", "frameBuilder"]],
    15: [["frameColor", "balloonsFind"], ["trainMissing", "circleSmaller", "colorReveal"], ["traceTwo", "beforeAfter"]],
    16: [["frameColor", "countCircle", "numberLine"], ["baseTenCircle", "connectBaseTen", "maze"], ["traceTwo", "frameBuilder"]],
    17: [["frameColor", "balloonsFind"], ["missingNumber", "tenHowManyWrite", "colorReveal"], ["traceTwo", "orderNumbers"]],
    18: [["frameColor", "countCircle"], ["tenHowManyCircle", "beforeAfter", "dotToDot"], ["traceTwo", "circleSmaller"]],
    19: [["frameColor", "balloonsFind"], ["trainMissing", "circleBigger", "colorReveal"], ["traceTwo", "beforeAfter"]],
    20: [["frameColor", "countCircle"], ["baseTenCircle", "missingNumber", "maze"], ["traceTwo", "orderNumbers"]]
};

const AJ_OBJECTS = {
    apples:   { svg: "apple",   label: "تفاحة",  plural: "التفاحات" },
    fish:     { svg: "fish",    label: "سمكة",   plural: "الأسماك" },
    balloons: { svg: "balloon", label: "بالون",  plural: "البالونات" }
};

/* صور المفاجأة (لوّن كل خانة فيها الرقم لتظهر الصورة) — ٩ أعمدة × ٧ صفوف
   كل حرف = لون خانة مستهدفة، والنقطة = خانة عادية (ليست الرقم) */

const AJ_REVEAL_PATTERNS = [
    { name: "بيت", rows: [
        "....r....",
        "...rrr...",
        "..rrrrr..",
        ".rrrrrrr.",
        ".bbbbbbb.",
        ".bbyybbb.",
        ".bbyybbb." ] },
    { name: "قلب", rows: [
        ".........",
        ".rr...rr.",
        "rrrr.rrrr",
        "rrrrrrrrr",
        ".rrrrrrr.",
        "..rrrrr..",
        "...rrr..." ] },
    { name: "شجرة", rows: [
        "....g....",
        "...ggg...",
        "..ggggg..",
        ".ggggggg.",
        "...nnn...",
        "...nnn...",
        "...nnn..." ] },
    { name: "سمكة", rows: [
        ".........",
        "..bbbb.b.",
        ".bbbbbbbb",
        "bbwbbbbbb",
        ".bbbbbbbb",
        "..bbbb.b.",
        "........." ] },
    { name: "زهرة", rows: [
        "...r.r...",
        "....y....",
        "...ryr...",
        "....y....",
        ".....g...",
        "...g.g...",
        "....ggg.." ] }
];

const AJ_REVEAL_COLORS = {
    r: "#ef6c5b", y: "#f6d55c", g: "#6cc27a", b: "#58a6e0", n: "#a9784f", w: "#ffffff", o: "#f5a54a"
};

const ajGame = {
    book: 1,
    number: 1,
    actIndex: 0,
    plan: null,
    current: null,
    active: false,
    session: 0,
    wrongRun: 0
};

/* =========================================================
   🧰 أدوات عامة صغيرة
   ========================================================= */

function ajNum(n) {
    return arabicNumber(n);
}

function ajRand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function ajRange(min, max) {
    const out = [];
    for (let i = min; i <= max; i++) out.push(i);
    return out;
}

/* أعداد مختلفة عن n ضمن مدى، مع تفضيل الأقرب (تشتيت مناسب لا عشوائي) */
function ajOthers(n, min, max, count) {

    const pool = ajRange(min, max).filter(x => x !== n);

    const near = pool
        .slice()
        .sort((a, b) => Math.abs(a - n) - Math.abs(b - n))
        .slice(0, Math.max(count + 2, count * 2));

    return shuffle(near).slice(0, count);
}

function ajEl(tag, className, text, attrs) {

    const el = document.createElement(tag);

    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = text;

    if (attrs) {
        Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
    }

    return el;
}

/* =========================================================
   🔊 مشغّل MP3 محلي خاص بهذا القسم — بلا أي مسار تراجع إلى TTS

   يستخدم ملفات بنك الصوت التعليمي نفسها (EDUCATIONAL_AUDIO_MANIFEST) وبالسرعة
   نفسها، وبنفس سلوك «القفل + أحدث طلب» (الصوت يكتمل ولا يُقاطَع؛ ويُحفظ
   أحدث طلب فقط ليُشغَّل بعده).

   لماذا لا نستعمل speakEducational هنا؟ لأن مسار التراجع فيها يستدعي speak()
   (صوت المتصفح) عند أي رفض لـ audio.play() — ومنه الرفض الناتج عن إيقاف الصوت
   أثناء بدء تشغيله حين ينتقل الطفل سريعًا بين الشاشات. هنا الفشل = صمت فقط.
   نظام الصوت العام نفسه لم يُمَسّ.
   ========================================================= */

function speakAJLocal(text) { EduAudio.play(text, { mode: "queue" }); }

function ajStopAudio() { EduAudio.stop(); }

function ajSpeakNumber(n) {
    const word = (typeof numberWords !== "undefined") ? numberWords[n] : null;
    if (word) speakAJLocal(word);
}

/* =========================================================
   💾 تقدّم الطالب — محفوظ ومعزول
   ========================================================= */

let ajProgressCache = null;

function ajLoadProgress() {

    if (ajProgressCache) return ajProgressCache;

    let data = null;

    try {
        data = JSON.parse(localStorage.getItem(AJ_KEY) || "null");
    } catch (e) {
        data = null;
    }

    if (!data || typeof data !== "object") data = {};

    ajProgressCache = {
        done: data.done || {},
        skipped: data.skipped || {},
        bonus: data.bonus || {}
    };

    return ajProgressCache;
}

function ajSaveProgress() {
    try {
        localStorage.setItem(AJ_KEY, JSON.stringify(ajLoadProgress()));
    } catch (e) { /* التخزين ممتلئ أو معطّل: نكمل دون حفظ */ }
}

function ajReloadProgressFromStorage() {
    ajProgressCache = null;
    return ajLoadProgress();
}

function ajActKey(n, idx) {
    return n + ":" + idx;
}

function ajIsDone(n, idx) {
    return !!ajLoadProgress().done[ajActKey(n, idx)];
}

function ajIsSkipped(n, idx) {
    return !!ajLoadProgress().skipped[ajActKey(n, idx)];
}

function ajMarkDone(n, idx) {
    const p = ajLoadProgress();
    p.done[ajActKey(n, idx)] = 1;
    delete p.skipped[ajActKey(n, idx)];
    ajSaveProgress();
}

function ajMarkSkipped(n, idx) {
    const p = ajLoadProgress();
    if (!p.done[ajActKey(n, idx)]) p.skipped[ajActKey(n, idx)] = 1;
    ajSaveProgress();
}

function ajNumberCounts(n) {

    const plan = ajBuildPlan(n);
    let done = 0;
    let skipped = 0;

    plan.flat.forEach((_, idx) => {
        if (ajIsDone(n, idx)) done++;
        else if (ajIsSkipped(n, idx)) skipped++;
    });

    return { total: plan.flat.length, done: done, skipped: skipped };
}

function ajNumberComplete(n) {
    const c = ajNumberCounts(n);
    return c.done + c.skipped >= c.total;
}

/* فتح تدريجي: الرقم ١ مفتوح، وكل رقم يُفتح بإكمال الذي قبله
   (وبهذا يُفتح ١١ بعد إكمال ١٠ — نفس تدرّج الكتابين) */

function ajNumberUnlocked(n) {
    return n === 1 || StudentStore.isOverride() || ajNumberComplete(n - 1);
}

function ajFirstOpenIndex(n) {

    const plan = ajBuildPlan(n);

    for (let i = 0; i < plan.flat.length; i++) {
        if (!ajIsDone(n, i) && !ajIsSkipped(n, i)) return i;
    }

    return 0;
}

function ajTotalDone() {
    let total = 0;
    for (let n = 1; n <= 20; n++) total += ajNumberCounts(n).done;
    return total;
}

/* =========================================================
   🗺️ خطة الأنشطة لكل رقم
   ========================================================= */

function ajBuildPlan(n) {

    const pagesKeys = (n <= 10) ? AJ_PLAN_1_10 : AJ_PLAN_11_20[n];

    const flat = [];

    pagesKeys.forEach((page, pageIndex) => {
        page.forEach(type => {
            flat.push({ type: type, page: pageIndex });
        });
    });

    return { pages: pagesKeys, flat: flat };
}

/* =========================================================
   🎨 رسوم SVG بسيطة (تفاحة/سمكة/بالون) + إطار العشرة + مكعبات
   تُرسم برمجيًا (لا إيموجي) لثبات الشكل وإمكان تلوينها
   ========================================================= */

function ajShapeSVG(kind) {

    if (kind === "apple") {
        return '<svg class="aj-shape" viewBox="0 0 48 52" aria-hidden="true" focusable="false">' +
            '<path class="aj-fill" d="M24 15 C19 9 7 12 7 28 C7 41 15 50 21 50 C22.5 50 23.2 49.3 24 49.3 C24.8 49.3 25.5 50 27 50 C33 50 41 41 41 28 C41 12 29 9 24 15 Z"/>' +
            '<path class="aj-stem" d="M24 15 C24 11 25.5 8 28 6"/>' +
            '<path class="aj-leaf" d="M27 10 C31 4 38 5 40 9 C36 13 30 13 27 10 Z"/>' +
            '</svg>';
    }

    if (kind === "fish") {
        return '<svg class="aj-shape" viewBox="0 0 56 36" aria-hidden="true" focusable="false">' +
            '<path class="aj-fill" d="M4 18 C10 6 30 4 40 18 C30 32 10 30 4 18 Z"/>' +
            '<path class="aj-fill" d="M38 18 L54 6 L54 30 Z"/>' +
            '<circle class="aj-eye" cx="12" cy="15" r="2.2"/>' +
            '</svg>';
    }

    return '<svg class="aj-shape" viewBox="0 0 40 56" aria-hidden="true" focusable="false">' +
        '<ellipse class="aj-fill" cx="20" cy="20" rx="16" ry="19"/>' +
        '<path class="aj-fill" d="M17 38 L23 38 L20 43 Z"/>' +
        '<path class="aj-stem" d="M20 43 C16 48 24 50 20 55"/>' +
        '</svg>';
}

/* إطار العشرة: ٢×٥ — filled = عدد العدّادات الظاهرة في الإطار */

function ajFrameEl(filled, cls) {

    const frame = ajEl("div", "aj-frame" + (cls ? " " + cls : ""));
    frame.setAttribute("aria-hidden", "true");

    for (let i = 0; i < 10; i++) {
        const cell = ajEl("span", "aj-frame-cell");
        if (i < filled) cell.appendChild(ajEl("span", "aj-counter"));
        frame.appendChild(cell);
    }

    return frame;
}

/* مكعبات العشرات والآحاد: قضيب = ١٠ مربعات زرقاء، ومربع برتقالي = ١ */

function ajBaseTenSVG(n) {

    const tens = Math.floor(n / 10);
    const units = n % 10;

    const rodW = 16, gap = 6, cell = 11;
    const unitCols = 3, unitCell = 15;

    const tensWidth = tens * (rodW + gap);
    const unitsWidth = units ? unitCols * unitCell : 0;
    const width = Math.max(40, tensWidth + unitsWidth + 8);
    const height = 10 * cell + 8;

    let svg = '<svg class="aj-base10" viewBox="0 0 ' + width + ' ' + height + '" aria-hidden="true" focusable="false">';

    for (let t = 0; t < tens; t++) {
        for (let i = 0; i < 10; i++) {
            svg += '<rect class="aj-b10-ten" x="' + (width - 4 - (t + 1) * (rodW + gap) + gap) + '" y="' + (4 + i * cell) + '" width="' + rodW + '" height="' + (cell - 1) + '" rx="2"/>';
        }
    }

    for (let u = 0; u < units; u++) {
        const col = u % unitCols;
        const row = Math.floor(u / unitCols);
        svg += '<rect class="aj-b10-unit" x="' + (4 + col * unitCell) + '" y="' + (4 + row * unitCell) + '" width="' + (unitCell - 2) + '" height="' + (unitCell - 2) + '" rx="2"/>';
    }

    return svg + '</svg>';
}

/* مجموعة أشياء ثابتة (غير تفاعلية) في صفوف منتظمة */

function ajObjectsRow(type, count, solid) {

    const wrap = ajEl("div", "aj-objects" + (solid ? " aj-solid" : ""));
    wrap.setAttribute("aria-hidden", "true");

    const info = AJ_OBJECTS[type];

    for (let i = 0; i < count; i++) {
        const o = ajEl("span", "aj-object aj-object-" + info.svg);
        o.innerHTML = ajShapeSVG(info.svg);
        wrap.appendChild(o);
    }

    return wrap;
}

/* =========================================================
   🏗️ مولّدات الأنشطة — كل دالة تُنتج «مواصفة» (spec) لنشاط واحد.
   العناوين حرفيًا من الكتابين. المحتوى يُولَّد عند كل لعب (تشتيت
   قريب من الرقم لا عشوائي)، والإجابات الصحيحة محفوظة في الـ spec فقط.
   ========================================================= */

function ajNumeralOption(value, correct) {
    return {
        value: value,
        text: ajNum(value),
        correct: !!correct,
        speak: (typeof numberWords !== "undefined") ? numberWords[value] : null,
        aria: "الرقم " + ((typeof numberWords !== "undefined" && numberWords[value]) || ajNum(value))
    };
}

function ajThreeNumerals(n, min, max) {
    const others = ajOthers(n, min, max, 2);
    return shuffle([ajNumeralOption(n, true)].concat(others.map(v => ajNumeralOption(v, false))));
}

/* ترتيب مختلف عن الأصل (حتى لا يكون التوصيل بالموضع) */
function ajDifferentOrder(list) {
    for (let i = 0; i < 12; i++) {
        const c = shuffle(list);
        if (c.every((v, idx) => v !== list[idx])) return c;
    }
    const r = list.slice();
    r.push(r.shift());
    return r;
}

/* ---------- ١–١٠ ---------- */

function ajBuildColorNumberObjects(n) {
    return { text: ajNum(n), objects: { type: "apples", count: n }, goal: 0.72 };
}

function ajBuildPointNumber(n) {
    const options = shuffle([n].concat(ajOthers(n, 1, 10, 5))).map(v => ajNumeralOption(v, v === n));
    return {
        mark: "circle",
        autoSpeak: n,
        groups: [{ options: options, layout: "grid3", cls: "aj-opts-big" }]
    };
}

function ajBuildCircleCorrect(n) {
    return {
        mark: "circle",
        groups: [{
            stimulus: { type: "objects", kind: "apples", count: n },
            options: ajThreeNumerals(n, 1, 10),
            layout: "row",
            cls: "aj-opts-round"
        }]
    };
}

function ajFindCells(n, total, targetCount, min, max) {
    const others = ajRange(min, max).filter(v => v !== n);
    const cells = [];
    for (let i = 0; i < targetCount; i++) cells.push({ text: ajNum(n), target: true });
    for (let i = targetCount; i < total; i++) cells.push({ text: ajNum(others[ajRand(0, others.length - 1)]), target: false });
    return shuffle(cells);
}

function ajBuildFindGrid(n) {
    return {
        variant: "grid", cols: 4, mark: "color",
        cells: ajFindCells(n, 20, ajRand(5, 7), 1, 10),
        word: ajNum(n)
    };
}

function ajBuildCircleRows(n) {
    /* ٤ صفوف × ٥ خانات؛ في كل صف رقم واحد على الأقل */
    const rows = [];
    for (let r = 0; r < 4; r++) {
        const t = ajRand(1, 2);
        rows.push(ajFindCells(n, 5, t, 1, 10));
    }
    return {
        variant: "rows", cols: 5, mark: "circle",
        cells: [].concat.apply([], rows),
        word: ajNum(n)
    };
}

function ajBuildCrossGrid(n) {
    return {
        variant: "grid", cols: 5, mark: "cross",
        cells: ajFindCells(n, 20, ajRand(5, 6), 1, 10),
        word: ajNum(n)
    };
}

function ajBuildConnectIdentical(n) {
    const values = [n].concat(ajOthers(n, 1, 10, 2));
    const left = shuffle(values);
    const right = ajDifferentOrder(left);
    const pairs = {};
    values.forEach(v => { pairs["a" + v] = "b" + v; });
    return {
        layout: "two",
        a: left.map(v => ({ id: "a" + v, value: v, numeral: ajNum(v), speak: numberWords[v] })),
        b: right.map(v => ({ id: "b" + v, value: v, numeral: ajNum(v), speak: numberWords[v] })),
        pairs: pairs
    };
}

function ajBuildConnectSet(n) {
    const counts = shuffle([n].concat(ajOthers(n, 1, 10, 5)));
    return {
        layout: "center",
        a: [{ id: "c", value: n, numeral: ajNum(n), big: true, speak: numberWords[n] }],
        b: counts.map(v => ({ id: "s" + v, value: v, objects: { type: "apples", count: v }, aria: "مجموعة" })),
        pairs: { c: "s" + n }
    };
}

function ajBuildConnectQuantity(n) {
    const values = [n].concat(ajOthers(n, 1, 10, 2));
    const left = shuffle(values);
    const right = ajDifferentOrder(left);
    const pairs = {};
    values.forEach(v => { pairs["a" + v] = "b" + v; });
    return {
        layout: "two",
        a: left.map(v => ({ id: "a" + v, value: v, numeral: ajNum(v), speak: numberWords[v] })),
        b: right.map(v => ({ id: "b" + v, value: v, objects: { type: "apples", count: v }, aria: "كمية" })),
        pairs: pairs
    };
}

function ajBuildTrace(n) {
    return {
        text: ajNum(n),
        stages: [
            { guide: "dotted", threshold: 0.5, label: "تتبّع النقاط" },
            { guide: "faint", threshold: 0.42, label: "تتبّع النقاط الخفيفة" },
            { guide: "none", threshold: 0.28, label: "اكتبه وحدك" }
        ]
    };
}

function ajBuildCountWrite(n) {
    return { objects: { type: "apples", count: n }, answer: n };
}

/* ---------- ١١–٢٠ ---------- */

function ajBuildFrameColor(n) {
    return { text: ajNum(n), objects: { type: "frames", count: n }, goal: 0.72 };
}

function ajBuildBalloonsFind(n) {
    return {
        variant: "balloons", cols: 4, mark: "color",
        cells: ajFindCells(n, 12, ajRand(5, 7), 11, 20),
        word: ajNum(n)
    };
}

function ajBuildNumberLine(n) {
    return {
        mark: "circle",
        groups: [{
            stimulus: { type: "bigNumeral", value: n },
            options: ajRange(10, 20).map(v => Object.assign(ajNumeralOption(v, v === n), { tick: true })),
            layout: "line",
            cls: "aj-opts-line"
        }]
    };
}

function ajBuildTenHowManyCircle(n) {
    const m1 = n - 10;
    let m2 = ajRand(1, 9);
    if (m2 === m1) m2 = (m2 % 9) + 1;

    const groupFor = m => ({
        stimulus: { type: "tenPlus", extra: m },
        options: ajThreeNumerals(10 + m, 11, 20),
        layout: "row",
        cls: "aj-opts-round"
    });

    return { mark: "circle", groups: [groupFor(m1), groupFor(m2)] };
}

function ajBuildConnectPictures(n) {
    const values = [n].concat(ajOthers(n, 11, 20, 2));
    const left = shuffle(values);
    const right = ajDifferentOrder(left);
    const pairs = {};
    values.forEach(v => { pairs["a" + v] = "b" + v; });
    return {
        layout: "two",
        a: left.map(v => ({ id: "a" + v, value: v, frame: v - 10, aria: "صورة عدد" })),
        b: right.map(v => ({ id: "b" + v, value: v, numeral: ajNum(v), speak: numberWords[v] })),
        pairs: pairs
    };
}

function ajBuildConnectBaseTen(n) {
    const values = [n].concat(ajOthers(n, 10, 20, 2));
    const left = shuffle(values);
    const right = ajDifferentOrder(left);
    const pairs = {};
    values.forEach(v => { pairs["a" + v] = "b" + v; });
    return {
        layout: "two",
        a: left.map(v => ({ id: "a" + v, value: v, base10: v, aria: "مكعبات عدد" })),
        b: right.map(v => ({ id: "b" + v, value: v, numeral: ajNum(v), speak: numberWords[v] })),
        pairs: pairs
    };
}

function ajBuildColorReveal(n) {
    const pattern = AJ_REVEAL_PATTERNS[(((n - 11) / 2) | 0) % AJ_REVEAL_PATTERNS.length];
    const others = ajRange(11, 20).filter(v => v !== n);
    const cells = [];

    pattern.rows.forEach(row => {
        row.split("").forEach(ch => {
            if (ch === ".") {
                cells.push({ text: ajNum(others[ajRand(0, others.length - 1)]), target: false });
            } else {
                cells.push({ text: ajNum(n), target: true, pic: AJ_REVEAL_COLORS[ch] || "#58a6e0" });
            }
        });
    });

    return { variant: "reveal", cols: 9, mark: "color", cells: cells, revealName: pattern.name, word: ajNum(n) };
}

function ajBuildFrameBuilder(n) {
    const need = n - 10;
    const pre = need >= 2 ? ajRand(0, need - 1) : 0;
    return { target: n, rows: [{ pre: pre }, { pre: 0 }] };
}

function ajBuildCountCircle(n) {
    const kinds = { 12: "fish", 14: "balloons", 16: "apples", 18: "fish", 20: "balloons" };
    return {
        mark: "circle",
        groups: [{
            stimulus: { type: "countable", kind: kinds[n] || "apples", count: n },
            options: ajThreeNumerals(n, 11, 20),
            layout: "row",
            cls: "aj-opts-round"
        }]
    };
}

function ajBlank(answer) { return { type: "blank", answer: answer }; }
function ajFixed(text, hl) { return { type: "fixed", text: text, hl: !!hl }; }

function ajBuildBeforeAfter(n) {
    let m = ajRand(12, 19);
    if (m === n) m = (m === 19 ? 12 : m + 1);

    const rowFor = v => ({
        tokens: [ajBlank(v - 1), ajFixed(ajNum(v), true), ajBlank(v + 1)]   /* RTL: الأيمن = «قبله» (الأصغر) */
    });

    return { rows: [rowFor(n), rowFor(m)], label: "قبل — الرقم — بعد" };
}

function ajSeqRow(centerValue, blankValue) {
    let s = ajRand(Math.max(10, centerValue - 3), Math.min(16, centerValue - 1));
    if (s > centerValue || s + 4 < centerValue) s = Math.min(16, Math.max(10, centerValue - 2));
    const tokens = [];
    /* تصاعدي: العنصر الأول (الأيمن في RTL) هو الأصغر — كما في الكتابين */
    for (let v = s; v <= s + 4; v++) {
        tokens.push(v === blankValue ? ajBlank(v) : ajFixed(ajNum(v), false));
    }
    return { tokens: tokens };
}

function ajBuildMissingNumber(n) {
    const row1 = ajSeqRow(n, n);
    let other = ajRand(11, 19);
    if (other === n) other = (other === 19 ? 12 : other + 1);
    const row2 = ajSeqRow(other, other + (Math.random() < 0.5 ? 0 : (other < 19 ? 1 : 0)));
    return { rows: [row1, row2], label: "اكتب العدد الناقص" };
}

function ajBuildTenHowManyWrite(n) {
    let m2 = ajRand(1, 9);
    if (m2 === n - 10) m2 = (m2 % 9) + 1;

    const rowFor = m => ({
        ltr: true,
        tokens: [
            ajBlank(m),
            { type: "sym", text: "+" },
            ajFixed(ajNum(10), false),
            { type: "sym", text: "=" },
            ajFixed(ajNum(10 + m), true),
            { type: "pic", extra: m }
        ]
    });

    return { rows: [rowFor(n - 10), rowFor(m2)], label: "عشرة وكم؟" };
}

function ajBuildCompare(n, bigger) {

    const pairA = shuffle([n, ajOthers(n, 11, 20, 1)[0]]);
    let pairB = shuffle(ajRange(11, 20)).slice(0, 2);
    if (pairB.indexOf(n) !== -1 && pairA.indexOf(n) !== -1 && pairB.every(v => pairA.indexOf(v) !== -1)) {
        pairB = shuffle(ajRange(11, 20).filter(v => v !== n)).slice(0, 2);
    }

    const groupFor = pair => {
        const target = bigger ? Math.max(pair[0], pair[1]) : Math.min(pair[0], pair[1]);
        return {
            options: pair.map(v => ajNumeralOption(v, v === target)),
            layout: "cards",
            cls: "aj-opts-cards"
        };
    };

    return { mark: "circle", groups: [groupFor(pairA), groupFor(pairB)] };
}

function ajBuildCircleBigger(n) { return ajBuildCompare(n, true); }
function ajBuildCircleSmaller(n) { return ajBuildCompare(n, false); }

function ajBuildMaze(n) {

    const rows = 5, cols = 6;
    let r = 0, c = cols - 1;
    const path = [[r, c]];

    while (r < rows - 1 || c > 0) {
        const canDown = r < rows - 1;
        const canLeft = c > 0;
        let down;
        if (canDown && canLeft) down = Math.random() < 0.5;
        else down = canDown;
        if (down) r++; else c--;
        path.push([r, c]);
    }

    const pool = ajOthers(n, 10, 20, 6);
    const onPath = {};
    path.forEach(p => { onPath[p[0] + "," + p[1]] = true; });

    const cells = [];
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const isPath = !!onPath[i + "," + j];
            cells.push({
                r: i, c: j, path: isPath,
                value: isPath ? n : pool[ajRand(0, pool.length - 1)]
            });
        }
    }

    return { rows: rows, cols: cols, path: path, cells: cells, target: n };
}

function ajRepresentation(type, value) {
    return { type: type, value: value };
}

function ajBuildCrossOutCard(n) {

    const deltas = [-2, -1, 1, 2].filter(d => n + d >= 11 && n + d <= 20);
    const wrongValue = n + deltas[ajRand(0, deltas.length - 1)];
    const wrongType = ["frame", "base10", "numeral"][ajRand(0, 2)];

    const cards = [
        ajRepresentation("numeral", n),
        ajRepresentation("frame", n),
        ajRepresentation("base10", n),
        ajRepresentation(wrongType, wrongValue)
    ];

    const options = shuffle(cards.map((c, i) => ({
        rep: c,
        correct: i === 3,
        aria: "بطاقة"
    })));

    return {
        mark: "cross",
        groups: [{ options: options, layout: "cards", cls: "aj-opts-cards aj-opts-rep" }]
    };
}

function ajBuildBaseTenCircle(n) {
    const values = shuffle([n].concat(ajOthers(n, 10, 20, 2)));
    return {
        mark: "circle",
        groups: [{
            stimulus: { type: "bigNumeral", value: n },
            options: values.map(v => ({ rep: ajRepresentation("base10", v), correct: v === n, aria: "مكعبات" })),
            layout: "cards",
            cls: "aj-opts-cards aj-opts-rep"
        }]
    };
}

function ajBuildOrderNumbers(n) {

    const set1 = shuffle([n].concat(ajOthers(n, 11, 20, 3)));
    const pool2 = ajRange(11, 20);
    const set2 = shuffle(pool2).slice(0, 4);

    const group = values => ({
        tiles: values.slice(),
        slots: values.slice().sort((a, b) => a - b).map(v => ({ expected: v }))
    });

    return { layout: "order", groups: [group(set1), group(set2)] };
}

function ajBuildTrainMissing(n) {

    const all = ajRange(11, 20);
    const blanks = [n].concat(shuffle(all.filter(v => v !== n)).slice(0, 3));

    const slots = all.map(v => (
        blanks.indexOf(v) !== -1
            ? { expected: v }
            : { fixed: ajNum(v) }
    ));

    return { layout: "train", groups: [{ tiles: shuffle(blanks), slots: slots }] };
}

function ajBuildDotToDot(n) {

    const heart = (n === 14);

    /* منحنى كثيف ثم نقاط متساوية البعد على طول المحيط (لا بحسب الزاوية)،
       حتى لا تتكدّس النقاط قرب حزّ القلب فتتداخل مناطق اللمس */

    const dense = [];
    const STEPS = 1440;

    for (let i = 0; i <= STEPS; i++) {
        const t = (i / STEPS) * Math.PI * 2;
        if (heart) {
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            dense.push({ x: 50 + x * 2.4, y: 46 + y * 2.4 });
        } else {
            dense.push({ x: 50 + 40 * Math.sin(t), y: 50 - 40 * Math.cos(t) });
        }
    }

    const cum = [0];
    for (let i = 1; i < dense.length; i++) {
        cum.push(cum[i - 1] + Math.hypot(dense[i].x - dense[i - 1].x, dense[i].y - dense[i - 1].y));
    }

    const total = cum[cum.length - 1];
    const pts = [];
    let j = 0;

    for (let k = 0; k < n; k++) {
        const target = (k / n) * total;
        while (j < cum.length - 2 && cum[j + 1] < target) j++;
        const span = cum[j + 1] - cum[j] || 1;
        const f = (target - cum[j]) / span;
        pts.push({
            x: dense[j].x + (dense[j + 1].x - dense[j].x) * f,
            y: dense[j].y + (dense[j + 1].y - dense[j].y) * f
        });
    }

    return { n: n, shape: heart ? "heart" : "circle", points: pts };
}

function ajBuildTraceTwo(n) {
    const spec = ajBuildTrace(n);
    return spec;
}

/* =========================================================
   📚 سجلّ أنواع الأنشطة: العنوان والأيقونة (من الكتابين) ونوع المكوّن
   ========================================================= */

const AJ_TYPES = {
    colorNumberObjects: { title: "لوّن الرقم ولوّن التفاحات", icon: "🎨", kind: "paint", build: ajBuildColorNumberObjects },
    pointNumber:        { title: "أشِر إلى الرقم", icon: "👆", kind: "choice", build: ajBuildPointNumber },
    circleCorrect:      { title: "ضع دائرة حول الرقم الصحيح", icon: "⭕", kind: "choice", build: ajBuildCircleCorrect },
    findGrid:           { title: "ابحث عن الرقم ولوّنه", icon: "🔍", kind: "find", build: ajBuildFindGrid },
    connectIdentical:   { title: "صِل الرقم بالرقم المماثل", icon: "🔗", kind: "connect", build: ajBuildConnectIdentical },
    circleRows:         { title: "ضع دائرة حول الرقم في كل صف", icon: "⭕", kind: "find", build: ajBuildCircleRows },
    crossGrid:          { title: "اشطب الرقم المطلوب فقط", icon: "❌", kind: "find", build: ajBuildCrossGrid },
    connectSet:         { title: "صِل الرقم بالمجموعة الصحيحة", icon: "🔗", kind: "connect", build: ajBuildConnectSet },
    connectQuantity:    { title: "صِل الرقم بالكمية المناسبة", icon: "🔗", kind: "connect", build: ajBuildConnectQuantity },
    trace:              { title: "تتبّع الرقم ثم انسخه", icon: "✏️", kind: "trace", build: ajBuildTrace },
    countWrite:         { title: "عُدّ التفاحات واكتب الرقم", icon: "🔢", kind: "countWrite", build: ajBuildCountWrite },

    frameColor:         { title: "لوّن الرقم ولوّن الدوائر", icon: "🎨", kind: "paint", build: ajBuildFrameColor },
    balloonsFind:       { title: "لوّن البالونات التي فيها الرقم", icon: "🎈", kind: "find", build: ajBuildBalloonsFind },
    numberLine:         { title: "ضع دائرة حول الرقم على خط الأعداد", icon: "📏", kind: "choice", build: ajBuildNumberLine },
    tenHowManyCircle:   { title: "عشرة وكم؟ ضع دائرة حول العدد", icon: "🔟", kind: "choice", build: ajBuildTenHowManyCircle },
    connectPictures:    { title: "صِل كل صورة بالعدد المناسب", icon: "🔗", kind: "connect", build: ajBuildConnectPictures },
    colorReveal:        { title: "لوّن كل خانة فيها الرقم لتظهر الصورة", icon: "🖼️", kind: "find", build: ajBuildColorReveal },
    frameBuilder:       { title: "ارسم دوائر في الإطار حتى يصبح العدد مثل الرقم", icon: "⚫", kind: "frames", build: ajBuildFrameBuilder },
    countCircle:        { title: "عُدّ وضع دائرة حول العدد الصحيح", icon: "🔢", kind: "choice", build: ajBuildCountCircle },
    beforeAfter:        { title: "اكتب العدد الذي قبله والعدد الذي بعده", icon: "✏️", kind: "fillSeq", build: ajBuildBeforeAfter },
    circleBigger:       { title: "ضع دائرة حول العدد الأكبر", icon: "⭕", kind: "choice", build: ajBuildCircleBigger },
    circleSmaller:      { title: "ضع دائرة حول العدد الأصغر", icon: "⭕", kind: "choice", build: ajBuildCircleSmaller },
    maze:               { title: "امشِ على الرقم فقط حتى تصل إلى البيت", icon: "🏠", kind: "maze", build: ajBuildMaze },
    crossOutCard:       { title: "اشطب البطاقة التي لا تساوي الرقم", icon: "❌", kind: "choice", build: ajBuildCrossOutCard },
    baseTenCircle:      { title: "ضع دائرة حول الصورة التي تساوي الرقم", icon: "🧱", kind: "choice", build: ajBuildBaseTenCircle },
    missingNumber:      { title: "اكتب العدد الناقص", icon: "✏️", kind: "fillSeq", build: ajBuildMissingNumber },
    orderNumbers:       { title: "رتّب الأعداد من الأصغر إلى الأكبر", icon: "📶", kind: "dnd", build: ajBuildOrderNumbers },
    tenHowManyWrite:    { title: "عشرة وكم؟ اكتب العدد في المربع", icon: "🔟", kind: "fillSeq", build: ajBuildTenHowManyWrite },
    dotToDot:           { title: "صِل النقاط بالترتيب من الواحد", icon: "✨", kind: "dots", build: ajBuildDotToDot },
    trainMissing:       { title: "اكتب الأعداد الناقصة في القطار", icon: "🚂", kind: "dnd", build: ajBuildTrainMissing },
    connectBaseTen:     { title: "صِل كل صورة بالعدد المناسب", icon: "🔗", kind: "connect", build: ajBuildConnectBaseTen },
    traceTwo:           { title: "تتبّع الرقم ثم اكتبه وحدك", icon: "✏️", kind: "trace", build: ajBuildTraceTwo }
};

/* =========================================================
   🎛️ مشغّل الأنشطة — الخريطة، التنقل، التقدّم، النجوم
   ========================================================= */

/* نقرة لوحة المفاتيح: detail = 0 (أما اللمس/الفأرة ففيها detail ≥ 1
   وتُعالَج عبر أحداث المؤشر في المكوّنات التي تدعم السحب) */

function ajIsKeyboardClick(event) {
    return event.detail === 0;
}

function ajCurrent() {
    return ajGame.current;
}

function ajMakeApi(session) {

    const alive = () => (
        ajGame.active &&
        ajGame.session === session &&
        ajGame.current &&
        ajGame.current.session === session
    );

    return {
        session: session,
        alive: alive,

        say(text) {
            if (!alive()) return;
            const el = $("ajMessage");
            if (el) el.textContent = text;
        },

        solved() {
            if (!alive()) return;
            ajActivitySolved();
        },

        speakNumber(n) {
            if (alive()) ajSpeakNumber(n);
        },

        speakText(text) {
            if (alive()) speakAJLocal(text);
        },

        /* مؤقّت آمن: لا ينفَّذ إن غادر الطفل النشاط */
        later(fn, ms) {
            setTimeout(() => {
                if (alive()) fn();
            }, ms);
        }
    };
}

function ajTeardownCurrent() {

    ajStopAudio();

    const cur = ajGame.current;

    if (cur && typeof cur.cleanup === "function") {
        try { cur.cleanup(); } catch (e) { /* تنظيف آمن */ }
    }

    ajGame.current = null;

    const stage = $("ajStage");
    if (stage) stage.innerHTML = "";
}

function ajUpdateStars() {
    ["ajStars", "ajHomeStars"].forEach(id => {
        const el = $(id);
        if (el && typeof stars !== "undefined") el.textContent = arabicNumber(stars);
    });
}

/* =========================================================
   🏠 الصفحة الرئيسية — غلاف الكتاب + خريطة الأرقام
   ========================================================= */

function openAJHome(book) {

    ajReloadProgressFromStorage();

    if (book === 1 || book === 2) ajGame.book = book;

    showScreen("ajHome");
    renderAJHome();
}

function exitAJ() {

    ajTeardownCurrent();
    ajGame.active = false;
    ajGame.session++;

    showScreen("numbers");
}

function ajSelectBook(book) {
    ajGame.book = book;
    renderAJHome();
}

function renderAJHome() {

    ajUpdateStars();

    [1, 2].forEach(b => {
        const tab = $("ajBook" + b);
        if (!tab) return;
        const on = ajGame.book === b;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.classList.toggle("aj-tab-on", on);
    });

    const from = ajGame.book === 1 ? 1 : 11;
    const to = from + 9;

    const map = $("ajMap");
    if (!map) return;

    map.innerHTML = "";

    let doneCount = 0;
    let totalCount = 0;
    let currentMarked = false;

    for (let n = from; n <= to; n++) {

        const counts = ajNumberCounts(n);
        const unlocked = ajNumberUnlocked(n);
        const complete = ajNumberComplete(n);

        doneCount += counts.done + counts.skipped;
        totalCount += counts.total;

        const btn = ajEl("button", "aj-num-btn" +
            (complete ? " aj-complete" : "") +
            (!unlocked ? " aj-locked" : ""));

        btn.type = "button";

        if (unlocked && !complete && !currentMarked) {
            btn.classList.add("aj-current");
            currentMarked = true;
        }

        btn.style.setProperty("--aj-pastel", AJ_PASTELS[(n - from) % AJ_PASTELS.length]);
        btn.setAttribute("role", "listitem");
        btn.dataset.number = String(n);

        const numWord = (typeof numberWords !== "undefined" && numberWords[n]) || ajNum(n);

        btn.setAttribute("aria-label",
            "الرقم " + numWord + "، " +
            (unlocked
                ? (complete ? "مكتمل" : "أنجزت " + ajNum(counts.done + counts.skipped) + " من " + ajNum(counts.total) + " أنشطة")
                : "مقفل، أكمل الرقم السابق أولًا"));

        if (!unlocked) btn.setAttribute("aria-disabled", "true");

        const num = ajEl("span", "aj-num-glyph", ajNum(n));
        btn.appendChild(num);

        const meta = ajEl("span", "aj-num-meta");
        if (!unlocked) meta.textContent = "🔒";
        else if (complete) meta.textContent = "✓";
        else meta.textContent = ajNum(counts.done + counts.skipped) + "/" + ajNum(counts.total);
        btn.appendChild(meta);

        const mini = ajEl("span", "aj-num-bar");
        const fill = ajEl("span", "aj-num-bar-fill");
        fill.style.width = Math.round(((counts.done + counts.skipped) / counts.total) * 100) + "%";
        mini.appendChild(fill);
        btn.appendChild(mini);

        btn.addEventListener("click", () => startAJNumber(n));

        map.appendChild(btn);
    }

    const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
    const fillEl = $("ajOverallFill");
    const track = $("ajOverallTrack");
    const text = $("ajOverallText");

    if (fillEl) fillEl.style.width = pct + "%";
    if (track) track.setAttribute("aria-valuenow", String(pct));
    if (text) text.textContent = "أنجزتَ " + ajNum(doneCount) + " من " + ajNum(totalCount) + " نشاطًا في هذا الكتاب";

    const hint = $("ajHomeHint");
    if (hint) hint.textContent = "";
}

/* =========================================================
   ▶️ بدء رقم — يُستأنف من أول نشاط لم يُنجَز
   ========================================================= */

function startAJNumber(n) {

    if (!ajNumberUnlocked(n)) {
        const hint = $("ajHomeHint");
        if (hint) {
            hint.textContent = "🔒 أكمل الرقم " + ajNum(n - 1) + " أولًا لتفتح هذا الرقم";
        }
        return;
    }

    ajTeardownCurrent();

    ajGame.number = n;
    ajGame.book = n <= 10 ? 1 : 2;
    ajGame.plan = ajBuildPlan(n);
    ajGame.actIndex = ajFirstOpenIndex(n);
    ajGame.active = true;
    ajGame.session++;

    showScreen("ajPlay");

    ajSetDialogInert(false);

    const dialog = $("ajDone");
    if (dialog) dialog.style.display = "none";

    renderAJActivity();
}

function ajBackToMap() {

    ajTeardownCurrent();
    ajGame.active = false;
    ajGame.session++;

    ajSetDialogInert(false);

    const dialog = $("ajDone");
    if (dialog) dialog.style.display = "none";

    showScreen("ajHome");
    renderAJHome();
}

/* =========================================================
   🧩 عرض نشاط
   ========================================================= */

function ajUpdatePlayHeader() {

    const n = ajGame.number;
    const total = ajGame.plan.flat.length;
    const idx = ajGame.actIndex;
    const act = ajGame.plan.flat[idx];

    const circle = $("ajNumCircle");
    if (circle) circle.textContent = ajNum(n);

    const dots = $("ajPageDots");
    if (dots) {
        Array.from(dots.children).forEach((d, i) => {
            d.classList.toggle("aj-dot-on", i === act.page);
            d.classList.toggle("aj-dot-done", i < act.page);
        });
    }

    const fill = $("ajProgressFill");
    const track = $("ajProgressTrack");
    const doneCount = ajNumberCounts(n);
    const pct = Math.round(((doneCount.done + doneCount.skipped) / total) * 100);

    if (fill) fill.style.width = pct + "%";
    if (track) track.setAttribute("aria-valuenow", String(pct));

    const text = $("ajProgressText");
    if (text) {
        text.textContent = "الصفحة " + ajNum(act.page + 1) + " — النشاط " + ajNum(idx + 1) + " من " + ajNum(total);
    }

    ajUpdateStars();
}

function renderAJActivity() {

    ajTeardownCurrent();

    const n = ajGame.number;
    const idx = ajGame.actIndex;
    const act = ajGame.plan.flat[idx];
    const def = AJ_TYPES[act.type];

    ajGame.wrongRun = 0;

    const session = ajGame.session;
    const spec = def.build(n);

    ajGame.current = {
        session: session,
        type: act.type,
        kind: def.kind,
        spec: spec,
        solved: false,
        cleanup: null,
        assist: null
    };

    const title = $("ajActTitle");
    const icon = $("ajActIcon");
    if (title) title.textContent = def.title;
    if (icon) icon.textContent = def.icon;

    const stage = $("ajStage");
    stage.innerHTML = "";
    stage.className = "aj-stage aj-stage-" + def.kind;

    const msg = $("ajMessage");
    if (msg) msg.textContent = "";

    const next = $("ajBtnNext");
    if (next) {
        next.disabled = true;
        next.setAttribute("aria-disabled", "true");
    }

    ajUpdatePlayHeader();

    const api = ajMakeApi(session);
    const renderer = AJ_RENDERERS[def.kind];

    const result = renderer(stage, spec, api);

    if (result && typeof result === "object") {
        ajGame.current.cleanup = result.cleanup || null;
        ajGame.current.assist = result.assist || null;
    } else if (typeof result === "function") {
        ajGame.current.cleanup = result;
    }

    const assistBtn = $("ajBtnAssist");
    if (assistBtn) assistBtn.hidden = !ajGame.current.assist;

    /* إن كان النشاط مُنجَزًا سابقًا فيبقى قابلًا للّعب من جديد دون نجمة */
    window.scrollTo({ top: 0, behavior: "auto" });
}

/* =========================================================
   ✅ نشاط مُنجَز — نجمة أولى مرة فقط، فتح «التالي» (بلا انتقال تلقائي)
   ========================================================= */

function ajActivitySolved() {

    const cur = ajGame.current;
    if (!cur || cur.solved) return;

    cur.solved = true;

    const n = ajGame.number;
    const idx = ajGame.actIndex;

    const firstTime = !ajIsDone(n, idx);

    if (firstTime && typeof addStars === "function") addStars(1);

    ajMarkDone(n, idx);

    const stage = $("ajStage");
    if (stage) stage.classList.add("aj-solved");

    const msg = $("ajMessage");
    if (msg && !/🎉|🌟|✓/.test(msg.textContent)) {
        msg.textContent = firstTime ? "🎉 أحسنت! نشاط مكتمل ⭐" : "🎉 أحسنت!";
    }

    const next = $("ajBtnNext");
    if (next) {
        next.disabled = false;
        next.removeAttribute("aria-disabled");
        next.textContent = (idx >= ajGame.plan.flat.length - 1) ? "🌟 إنهاء الرقم" : "التالي ▶";
    }

    ajUpdatePlayHeader();
}

function ajNextActivity() {

    const cur = ajGame.current;

    if (!cur || !cur.solved) return;

    ajAdvance();
}

function ajSkipActivity() {

    if (!ajGame.current) return;

    if (!ajGame.current.solved) {
        ajMarkSkipped(ajGame.number, ajGame.actIndex);
    }

    ajAdvance();
}

function ajAdvance() {

    if (ajGame.actIndex >= ajGame.plan.flat.length - 1) {
        ajFinishNumber();
        return;
    }

    ajGame.actIndex++;
    renderAJActivity();
}

function ajAgainActivity() {
    if (!ajGame.active) return;
    renderAJActivity();
}

function ajListenActivity() {
    if (!ajGame.active) return;
    ajSpeakNumber(ajGame.number);
}

function ajAssistActivity() {
    const cur = ajGame.current;
    if (cur && typeof cur.assist === "function") cur.assist();
}

/* =========================================================
   🌟 إتمام رقم — شاشة نجاح أنيقة + فتح الرقم التالي
   ========================================================= */

function ajTrapDialogFocus(event) {

    if (event.key !== "Tab") return;

    const focusables = [$("ajDoneNext"), $("ajDoneMap")].filter(b => b && !b.hidden);

    if (!focusables.length) return;

    event.preventDefault();

    const index = focusables.indexOf(document.activeElement);
    let target;

    if (event.shiftKey) {
        target = index <= 0 ? focusables[focusables.length - 1] : focusables[index - 1];
    } else {
        target = (index === -1 || index === focusables.length - 1) ? focusables[0] : focusables[index + 1];
    }

    target.focus();
}

function ajSetDialogInert(flag) {

    const wrap = document.querySelector("#ajPlay .aj-wrap");
    if (!wrap) return;

    Array.from(wrap.children).forEach(child => {
        if (child.id === "ajDone") return;
        child.inert = !!flag;
    });
}

function ajFinishNumber() {

    const n = ajGame.number;
    const p = ajLoadProgress();

    ajTeardownCurrent();

    /* هدية الإتمام لمن أنجز كل الأنشطة فعلًا؛ التخطّي يفتح الرقم التالي فقط */
    const counts = ajNumberCounts(n);
    const firstCompletion = !p.bonus[n] && counts.skipped === 0;

    if (firstCompletion) {
        p.bonus[n] = 1;
        ajSaveProgress();
        if (typeof addStars === "function") addStars(3);
    }

    ajUpdateStars();

    const hasNext = n < 20;
    const nextUnlocked = hasNext && ajNumberUnlocked(n + 1);

    const word = (typeof numberWords !== "undefined" && numberWords[n]) || ajNum(n);

    const title = $("ajDoneTitle");
    const body = $("ajDoneBody");
    const big = $("ajDoneNumber");
    const nextBtn = $("ajDoneNext");
    const mapBtn = $("ajDoneMap");

    if (title) title.textContent = n === 20 ? "🎉 أتممتَ كل الأرقام!" : "🌟 أحسنت! أتممتَ الرقم";
    if (big) big.textContent = ajNum(n);

    if (body) {
        body.textContent = (firstCompletion ? "حصلت على ٣ نجوم هدية ⭐ — " : "") +
            "الرقم " + word +
            (nextUnlocked ? " — الرقم التالي بانتظارك" : "");
    }

    if (nextBtn) {
        nextBtn.hidden = !nextUnlocked;
        nextBtn.textContent = "▶ الرقم " + ajNum(n + 1);
        nextBtn.onclick = () => startAJNumber(n + 1);
    }

    if (mapBtn) mapBtn.onclick = ajBackToMap;

    ajRenderConfetti();

    ajSetDialogInert(true);

    const dialog = $("ajDone");

    if (dialog) {
        dialog.addEventListener("keydown", ajTrapDialogFocus);
        dialog.style.display = "flex";
    }

    ajSpeakNumber(n);

    setTimeout(() => {
        const focusTarget = (nextBtn && !nextBtn.hidden) ? nextBtn : mapBtn;
        if (focusTarget) focusTarget.focus();
    }, 60);
}

/* قصاصات احتفال محدودة جدًا (٨ قصاصات فقط، قصيرة) */

function ajRenderConfetti() {

    const el = $("ajConfetti");
    if (!el) return;

    el.innerHTML = "";

    const colors = ["#58a6e0", "#f6d55c", "#6cc27a", "#ef6c5b"];

    for (let i = 0; i < 8; i++) {

        const piece = ajEl("div", "aj-confetti-piece");
        piece.style.left = (10 + Math.random() * 80) + "%";
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = (Math.random() * 0.25) + "s";

        el.appendChild(piece);
    }

    setTimeout(() => { if (el) el.innerHTML = ""; }, 1400);
}

/* =========================================================
   🔌 سجلّ المكوّنات
   ========================================================= */

const AJ_RENDERERS = {
    paint: (stage, spec, api) => ajRenderPaint(stage, spec, api),
    choice: (stage, spec, api) => ajRenderChoice(stage, spec, api),
    find: (stage, spec, api) => ajRenderFind(stage, spec, api),
    connect: (stage, spec, api) => ajRenderConnect(stage, spec, api),
    trace: (stage, spec, api) => ajRenderTrace(stage, spec, api),
    countWrite: (stage, spec, api) => ajRenderCountWrite(stage, spec, api),
    fillSeq: (stage, spec, api) => ajRenderFillSeq(stage, spec, api),
    dnd: (stage, spec, api) => ajRenderDnd(stage, spec, api),
    maze: (stage, spec, api) => ajRenderMaze(stage, spec, api),
    dots: (stage, spec, api) => ajRenderDots(stage, spec, api),
    frames: (stage, spec, api) => ajRenderFrames(stage, spec, api)
};

/* ---------- لوحة أرقام عربية هندية كبيرة (للكتابة) ---------- */

const AJ_DIGIT_NAMES = ["صفر", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];

function ajKeypad(onDigit, onBack) {

    const pad = ajEl("div", "aj-keypad");
    pad.setAttribute("role", "group");
    pad.setAttribute("aria-label", "لوحة الأرقام");

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].forEach(d => {
        const b = ajEl("button", "aj-key", ajNum(d));
        b.type = "button";
        b.setAttribute("aria-label", AJ_DIGIT_NAMES[d]);
        b.addEventListener("click", () => onDigit(d));
        pad.appendChild(b);
    });

    const back = ajEl("button", "aj-key aj-key-back", "⌫");
    back.type = "button";
    back.setAttribute("aria-label", "امسح");
    back.addEventListener("click", onBack);
    pad.appendChild(back);

    return pad;
}

/* ---------- أشياء قابلة للعدّ: كل لمسة ترقّم الشيء وتنطق رقمه ---------- */

function ajCountableObjects(kind, count, api, onChange) {

    const info = AJ_OBJECTS[kind];
    const wrap = ajEl("div", "aj-objects aj-countable aj-solid");
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "اضغط كل " + info.label + " لتعدّها");

    let counted = 0;

    for (let i = 0; i < count; i++) {

        const btn = ajEl("button", "aj-object aj-object-" + info.svg);
        btn.type = "button";
        btn.innerHTML = ajShapeSVG(info.svg);
        btn.setAttribute("aria-label", info.label + " " + ajNum(i + 1) + "، اضغط لتعدّها");

        const badge = ajEl("span", "aj-count-badge");
        badge.setAttribute("aria-hidden", "true");
        btn.appendChild(badge);

        btn.addEventListener("click", () => {

            if (btn.classList.contains("aj-counted")) return;

            counted++;
            btn.classList.add("aj-counted");
            btn.setAttribute("aria-pressed", "true");
            badge.textContent = ajNum(counted);

            api.speakNumber(counted);

            if (onChange) onChange(counted);
        });

        wrap.appendChild(btn);
    }

    return wrap;
}

/* =========================================================
   🖌️ أدوات اللوحة (Canvas) المشتركة للتلوين والتتبّع
   ========================================================= */

function ajGlyphFont(size) {
    return "900 " + size + "px Tahoma, \"Noto Naskh Arabic\", Arial, sans-serif";
}

/* تخطيط الرقم داخل اللوحة: حجم خط يناسب العرض والارتفاع، ومركز رأسي دقيق */
function ajGlyphLayout(ctx, text, W, H) {

    let size = 380;

    ctx.font = ajGlyphFont(size);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    let m = ctx.measureText(text);

    const maxW = W * 0.9;
    const maxH = H * 0.84;

    if (m.width > maxW) {
        size = size * maxW / m.width;
        ctx.font = ajGlyphFont(size);
        m = ctx.measureText(text);
    }

    let asc = m.actualBoundingBoxAscent || size * 0.75;
    let desc = m.actualBoundingBoxDescent || 0;

    if (asc + desc > maxH) {
        size = size * maxH / (asc + desc);
        ctx.font = ajGlyphFont(size);
        m = ctx.measureText(text);
        asc = m.actualBoundingBoxAscent || size * 0.75;
        desc = m.actualBoundingBoxDescent || 0;
    }

    return { font: ajGlyphFont(size), x: W / 2, y: (H + asc - desc) / 2 };
}

function ajApplyLayout(ctx, layout) {
    ctx.font = layout.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
}

function ajMakeCanvas(W, H, cls) {
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    cv.className = cls;
    return cv;
}

function ajMaskFromCtx(ctx, W, H, alphaMin) {

    const d = ctx.getImageData(0, 0, W, H).data;
    const list = [];

    for (let i = 3; i < d.length; i += 4) {
        if (d[i] >= alphaMin) list.push((i - 3) / 4);
    }

    return Uint32Array.from(list);
}

function ajCanvasPoint(canvas, event) {

    const r = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - r.left) * canvas.width / r.width,
        y: (event.clientY - r.top) * canvas.height / r.height
    };
}

/* ربط أحداث الرسم بالأصبع/الفأرة بعنصر ما */

function ajBindDrawing(wrap, canvas, onSegment, onDab, onEnd) {

    let drawing = false;
    let last = null;

    wrap.addEventListener("pointerdown", e => {
        e.preventDefault();
        drawing = true;
        last = ajCanvasPoint(canvas, e);
        onDab(last);
        try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* بعض المتصفحات */ }
    });

    wrap.addEventListener("pointermove", e => {
        if (!drawing) return;
        const p = ajCanvasPoint(canvas, e);
        onSegment(last, p);
        last = p;
    });

    const finish = () => {
        if (!drawing) return;
        drawing = false;
        last = null;
        onEnd();
    };

    wrap.addEventListener("pointerup", finish);
    wrap.addEventListener("pointercancel", finish);
    wrap.addEventListener("lostpointercapture", finish);
}

/* =========================================================
   🎨 التلوين التفاعلي: لوّن الرقم + لوّن التفاحات / الدوائر
   (اللون لا يخرج من حدود الرقم لأن الرسم بوضع source-atop)
   ========================================================= */

function ajRenderPaint(stage, spec, api) {

    const root = ajEl("div", "aj-paint");
    stage.appendChild(root);

    const two = spec.text.length > 1;
    const W = two ? 640 : 420;
    const H = 420;
    const BRUSH = 40;

    let color = AJ_COLORS[0].hex;

    /* لوحة الألوان */

    const palette = ajEl("div", "aj-palette");
    palette.setAttribute("role", "group");
    palette.setAttribute("aria-label", "اختر اللون");

    AJ_COLORS.forEach((c, i) => {
        const b = ajEl("button", "aj-swatch");
        b.type = "button";
        b.style.background = c.hex;
        b.setAttribute("aria-label", "اللون " + c.name);
        b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
        b.addEventListener("click", () => {
            color = c.hex;
            Array.from(palette.children).forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
        });
        palette.appendChild(b);
    });

    root.appendChild(palette);

    /* لوحة الرقم */

    const wrap = ajEl("div", "aj-canvas-wrap" + (two ? " aj-canvas-wide" : ""));
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", "الرقم " + spec.text + " بحجم كبير للتلوين");

    const paintCv = ajMakeCanvas(W, H, "aj-cv aj-cv-paint");
    const outlineCv = ajMakeCanvas(W, H, "aj-cv aj-cv-outline");

    wrap.appendChild(paintCv);
    wrap.appendChild(outlineCv);
    root.appendChild(wrap);

    const ctx = paintCv.getContext("2d", { willReadFrequently: true });
    const layout = ajGlyphLayout(ctx, spec.text, W, H);

    ajApplyLayout(ctx, layout);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(spec.text, layout.x, layout.y);

    const mask = ajMaskFromCtx(ctx, W, H, 200);

    const octx = outlineCv.getContext("2d");
    ajApplyLayout(octx, layout);
    octx.lineWidth = 7;
    octx.lineJoin = "round";
    octx.strokeStyle = "#1f3b63";
    octx.strokeText(spec.text, layout.x, layout.y);

    function painted() {
        const d = ctx.getImageData(0, 0, W, H).data;
        let count = 0;
        for (let k = 0; k < mask.length; k++) {
            const i = mask[k] * 4;
            if (d[i] < 248 || d[i + 1] < 248 || d[i + 2] < 248) count++;
        }
        return mask.length ? count / mask.length : 0;
    }

    function paintSegment(a, b) {
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";
        ctx.strokeStyle = color;
        ctx.lineWidth = BRUSH;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();
    }

    /* الأشياء المطلوب تلوينها */

    const objWrap = ajEl("div", "aj-paint-objects");
    objWrap.setAttribute("role", "group");

    const objButtons = [];

    function makeObjButton(extraCls, innerHTML, label) {
        const b = ajEl("button", "aj-obj-btn " + extraCls);
        b.type = "button";
        b.innerHTML = innerHTML;
        b.setAttribute("aria-label", label);
        b.setAttribute("aria-pressed", "false");
        objButtons.push(b);
        return b;
    }

    if (spec.objects.type === "apples") {

        objWrap.setAttribute("aria-label", "التفاحات — اضغط لتلوّنها");
        objWrap.classList.add("aj-objs-apples");

        for (let i = 0; i < spec.objects.count; i++) {
            objWrap.appendChild(makeObjButton("aj-obj-apple", ajShapeSVG("apple"), "تفاحة " + ajNum(i + 1) + "، اضغط لتلوّنها"));
        }

    } else {

        objWrap.setAttribute("aria-label", "الدوائر في إطارَي العشرة — اضغط لتلوّنها");
        objWrap.classList.add("aj-objs-frames");

        const extra = spec.objects.count - 10;

        [10, extra].forEach((count, fi) => {

            const frame = ajEl("div", "aj-frame aj-frame-paint");

            for (let i = 0; i < 10; i++) {
                const cell = ajEl("span", "aj-frame-cell");
                if (i < count) {
                    cell.appendChild(makeObjButton("aj-obj-circle", "", "دائرة " + ajNum((fi === 0 ? 0 : 10) + i + 1) + "، اضغط لتلوّنها"));
                }
                frame.appendChild(cell);
            }

            objWrap.appendChild(frame);
        });
    }

    root.appendChild(objWrap);

    const status = ajEl("div", "aj-paint-status");
    status.setAttribute("aria-live", "off");
    root.appendChild(status);

    let coloredCount = 0;

    function colorObject(btn) {
        if (!btn.classList.contains("aj-colored")) {
            coloredCount++;
            btn.classList.add("aj-colored");
            btn.setAttribute("aria-pressed", "true");
        }
        btn.style.setProperty("--aj-fill", color);
    }

    let fraction = 0;

    function update() {

        fraction = painted();

        const pct = Math.min(100, Math.round(fraction * 100));

        status.textContent =
            "الرقم: " + ajNum(pct) + "٪  •  الملوَّن: " + ajNum(coloredCount) + " من " + ajNum(objButtons.length);

        if (fraction >= spec.goal && coloredCount >= objButtons.length) {
            api.say("🎉 لوّنتَ الرقم وكل الأشياء!");
            api.solved();
        }
    }

    ajBindDrawing(
        wrap, paintCv,
        (a, b) => paintSegment(a, b),
        p => paintSegment(p, { x: p.x + 0.1, y: p.y + 0.1 }),
        update
    );

    /* تلوين الأشياء: لمسة أو سحب الإصبع فوقها (لمن يصعب عليه الضغط المتكرر) */

    let dragging = false;

    objWrap.addEventListener("pointerdown", e => {
        const b = e.target.closest ? e.target.closest(".aj-obj-btn") : null;
        if (!b) return;
        dragging = true;
        colorObject(b);
        update();
    });

    objWrap.addEventListener("pointermove", e => {
        if (!dragging) return;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const b = el && el.closest ? el.closest(".aj-obj-btn") : null;
        if (b && objWrap.contains(b)) colorObject(b);
    });

    const stopDrag = () => {
        if (!dragging) return;
        dragging = false;
        update();
    };

    document.addEventListener("pointerup", stopDrag);
    document.addEventListener("pointercancel", stopDrag);

    /* لوحة المفاتيح: النقرة بلا مؤشر (detail = 0) */
    objWrap.addEventListener("click", e => {
        const b = e.target.closest ? e.target.closest(".aj-obj-btn") : null;
        if (!b || !ajIsKeyboardClick(e)) return;
        colorObject(b);
        update();
    });

    update();

    return {
        cleanup() {
            document.removeEventListener("pointerup", stopDrag);
            document.removeEventListener("pointercancel", stopDrag);
        },

        /* مساعدة (لمن تعيقه الحركة أو يستخدم لوحة المفاتيح): تلوّن الرقم وكل الأشياء */
        assist() {
            ctx.save();
            ctx.globalCompositeOperation = "source-atop";
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, W, H);
            ctx.restore();
            objButtons.forEach(colorObject);
            update();
        }
    };
}

/* =========================================================
   ✏️ التتبّع والكتابة: ٣ مراحل كما في الكتاب
   (نقاط واضحة ← نقاط خفيفة ← اكتبه وحدك)
   يُقاس امتلاء «شريط» حول مسار الرقم بحبر الطفل؛ بلا عقوبة
   ========================================================= */

function ajRenderTrace(stage, spec, api) {

    const root = ajEl("div", "aj-trace");
    stage.appendChild(root);

    const two = spec.text.length > 1;
    const W = two ? 640 : 420;
    const H = 420;

    /* نموذج صغير للمرجعية */

    const head = ajEl("div", "aj-trace-head");
    const model = ajEl("div", "aj-trace-model");
    model.setAttribute("aria-label", "النموذج: " + spec.text);
    model.textContent = spec.text;
    const stageLabel = ajEl("div", "aj-trace-stage");
    const dotsRow = ajEl("div", "aj-trace-dots");
    dotsRow.setAttribute("aria-hidden", "true");
    spec.stages.forEach(() => dotsRow.appendChild(ajEl("span", "aj-trace-dot")));
    head.appendChild(model);
    head.appendChild(stageLabel);
    head.appendChild(dotsRow);
    root.appendChild(head);

    const wrap = ajEl("div", "aj-canvas-wrap aj-trace-wrap" + (two ? " aj-canvas-wide" : ""));
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", "لوحة التتبّع والكتابة للرقم " + spec.text);

    const guideCv = ajMakeCanvas(W, H, "aj-cv aj-cv-guide");
    const inkCv = ajMakeCanvas(W, H, "aj-cv aj-cv-ink");

    wrap.appendChild(guideCv);
    wrap.appendChild(inkCv);
    root.appendChild(wrap);

    const gctx = guideCv.getContext("2d");
    const ictx = inkCv.getContext("2d", { willReadFrequently: true });

    const layout = ajGlyphLayout(gctx, spec.text, W, H);

    /* شريط التسامح حول مسار الرقم */

    const bandCv = ajMakeCanvas(W, H, "");
    const bctx = bandCv.getContext("2d", { willReadFrequently: true });
    ajApplyLayout(bctx, layout);
    bctx.lineWidth = 46;
    bctx.lineJoin = "round";
    bctx.strokeStyle = "#000";
    bctx.strokeText(spec.text, layout.x, layout.y);
    const band = ajMaskFromCtx(bctx, W, H, 100);

    const meter = ajEl("div", "aj-meter");
    const meterFill = ajEl("div", "aj-meter-fill");
    meter.appendChild(meterFill);
    meter.setAttribute("aria-hidden", "true");
    root.appendChild(meter);

    const actions = ajEl("div", "aj-trace-actions");
    const clearBtn = ajEl("button", "aj-mini-btn", "🧹 امسح وأعد");
    clearBtn.type = "button";
    actions.appendChild(clearBtn);
    root.appendChild(actions);

    let si = 0;
    let finished = false;

    function drawGuide(kind) {

        gctx.clearRect(0, 0, W, H);

        if (kind === "none") return;

        ajApplyLayout(gctx, layout);

        if (kind === "dotted") {
            gctx.fillStyle = "#f1f5fb";
            gctx.fillText(spec.text, layout.x, layout.y);
        }

        gctx.lineJoin = "round";
        gctx.lineCap = "round";
        gctx.setLineDash([1, kind === "dotted" ? 11 : 15]);
        gctx.lineWidth = kind === "dotted" ? 8 : 7;
        gctx.strokeStyle = kind === "dotted" ? "#6f7f97" : "#c3cddb";
        gctx.strokeText(spec.text, layout.x, layout.y);
        gctx.setLineDash([]);
    }

    function coverage() {

        const d = ictx.getImageData(0, 0, W, H).data;
        let count = 0;

        for (let k = 0; k < band.length; k++) {
            if (d[band[k] * 4 + 3] > 40) count++;
        }

        return band.length ? count / band.length : 0;
    }

    function startStage(i) {

        si = i;

        const st = spec.stages[i];

        ictx.clearRect(0, 0, W, H);
        drawGuide(st.guide);

        stageLabel.textContent = "المحاولة " + ajNum(i + 1) + " من " + ajNum(spec.stages.length) + " — " + st.label;

        Array.from(dotsRow.children).forEach((d, k) => {
            d.classList.toggle("aj-on", k === i);
            d.classList.toggle("aj-done", k < i);
        });

        meterFill.style.width = "0%";

        wrap.classList.toggle("aj-trace-free", st.guide === "none");
    }

    function inkSegment(a, b) {
        ictx.save();
        ictx.strokeStyle = "#2f6fb5";
        ictx.lineWidth = 26;
        ictx.lineCap = "round";
        ictx.lineJoin = "round";
        ictx.beginPath();
        ictx.moveTo(a.x, a.y);
        ictx.lineTo(b.x, b.y);
        ictx.stroke();
        ictx.restore();
    }

    function evaluate() {

        if (finished) return;

        const st = spec.stages[si];
        const c = coverage();

        meterFill.style.width = Math.min(100, Math.round((c / st.threshold) * 100)) + "%";

        if (c < st.threshold) return;

        if (si < spec.stages.length - 1) {

            api.say("✓ ممتاز! الآن: " + spec.stages[si + 1].label);

            const next = si + 1;

            api.later(() => startStage(next), 900);

            /* منع إعادة التقييم أثناء الانتقال */
            si = -1;
            return;
        }

        finished = true;
        api.say("🎉 كتبتَ الرقم بنفسك!");
        api.solved();
    }

    ajBindDrawing(
        wrap, inkCv,
        (a, b) => { if (si >= 0) inkSegment(a, b); },
        p => { if (si >= 0) inkSegment(p, { x: p.x + 0.1, y: p.y + 0.1 }); },
        () => { if (si >= 0) evaluate(); }
    );

    clearBtn.addEventListener("click", () => {
        if (finished || si < 0) return;
        ictx.clearRect(0, 0, W, H);
        meterFill.style.width = "0%";
    });

    startStage(0);

    return {
        /* مساعدة: تُكمل المراحل (لمن تعيقه الحركة أو يستخدم لوحة المفاتيح) */
        assist() {
            if (finished) return;
            finished = true;
            ictx.clearRect(0, 0, W, H);
            ajApplyLayout(ictx, layout);
            ictx.lineWidth = 30;
            ictx.lineJoin = "round";
            ictx.strokeStyle = "#2f6fb5";
            ictx.strokeText(spec.text, layout.x, layout.y);
            Array.from(dotsRow.children).forEach(d => { d.classList.remove("aj-on"); d.classList.add("aj-done"); });
            meterFill.style.width = "100%";
            api.say("🎉 أحسنت!");
            api.solved();
        }
    };
}

/* =========================================================
   🧱 عناصر عرض مشتركة: تمثيلات العدد (رقم / إطار عشرة / مكعبات)
   ========================================================= */

function ajFramesPair(value, cls) {

    const wrap = ajEl("div", "aj-frames-pair" + (cls ? " " + cls : ""));
    wrap.setAttribute("aria-hidden", "true");

    if (value <= 10) {
        wrap.appendChild(ajFrameEl(value));
    } else {
        wrap.appendChild(ajFrameEl(10));
        wrap.appendChild(ajFrameEl(value - 10));
    }

    return wrap;
}

function ajRepNode(rep) {

    if (rep.type === "numeral") {
        return ajEl("span", "aj-rep-num", ajNum(rep.value));
    }

    if (rep.type === "frame") {
        return ajFramesPair(rep.value);
    }

    const holder = ajEl("span", "aj-rep-b10");
    holder.setAttribute("aria-hidden", "true");
    holder.innerHTML = ajBaseTenSVG(rep.value);
    return holder;
}

function ajStimulusNode(st, api) {

    if (st.type === "objects") {
        const box = ajEl("div", "aj-stim aj-stim-objects");
        box.appendChild(ajObjectsRow(st.kind, st.count, true));
        return box;
    }

    if (st.type === "bigNumeral") {
        const box = ajEl("div", "aj-stim aj-stim-big");
        box.appendChild(ajEl("span", "aj-bignum", ajNum(st.value)));
        return box;
    }

    if (st.type === "tenPlus") {
        const box = ajEl("div", "aj-stim aj-stim-tenplus");
        box.setAttribute("aria-hidden", "true");
        box.appendChild(ajFrameEl(st.extra));
        box.appendChild(ajEl("span", "aj-plus", "+"));
        box.appendChild(ajFrameEl(10));
        return box;
    }

    /* countable: لمسة لكل شيء تُرقّمه وتنطق رقمه */
    const box = ajEl("div", "aj-stim aj-stim-countable");
    box.appendChild(ajCountableObjects(st.kind, st.count, api));
    box.appendChild(ajEl("div", "aj-stim-hint", "اضغط كل شيء لتعدّه ثم اختر العدد"));
    return box;
}

/* =========================================================
   ⭕ الاختيار: ضع دائرة / اشطب — عدّة مجموعات في نشاط واحد
   صحيح: دائرة أو شطب + ✓ | خطأ: اهتزاز هادئ، وبعد خطأين تلميح أصفر
   ========================================================= */

function ajRenderChoice(stage, spec, api) {

    const root = ajEl("div", "aj-choice");
    stage.appendChild(root);

    let solvedGroups = 0;
    const total = spec.groups.length;

    if (spec.autoSpeak) {
        api.later(() => api.speakNumber(spec.autoSpeak), 250);
    }

    spec.groups.forEach((g, gi) => {

        const box = ajEl("div", "aj-group");
        root.appendChild(box);

        if (g.stimulus) box.appendChild(ajStimulusNode(g.stimulus, api));

        const opts = ajEl("div", "aj-opts aj-opts-" + g.layout + " " + (g.cls || ""));
        opts.setAttribute("role", "group");
        opts.setAttribute("aria-label", total > 1 ? "المجموعة " + ajNum(gi + 1) : "الخيارات");
        box.appendChild(opts);

        let wrongRun = 0;
        let groupSolved = false;
        const buttons = [];

        g.options.forEach(opt => {

            const b = ajEl("button", "aj-opt" + (opt.tick ? " aj-tick" : "") + (opt.rep ? " aj-opt-rep-card" : ""));
            b.type = "button";
            b.setAttribute("aria-label", (opt.aria || opt.text || "خيار") + "، اضغط للاختيار");

            if (opt.rep) {
                b.appendChild(ajRepNode(opt.rep));
            } else {
                b.appendChild(ajEl("span", "aj-opt-num", opt.text));
                if (opt.tick) b.appendChild(ajEl("span", "aj-tick-mark"));
            }

            b.addEventListener("click", () => {

                if (groupSolved) return;

                if (opt.speak) api.speakText(opt.speak);

                if (opt.correct) {

                    groupSolved = true;
                    solvedGroups++;

                    buttons.forEach(x => x.btn.classList.remove("aj-hint"));

                    b.classList.add("aj-opt-correct", spec.mark === "cross" ? "aj-mark-cross" : "aj-mark-circle");
                    b.setAttribute("aria-label", "الإجابة الصحيحة: " + (opt.aria || opt.text || ""));

                    buttons.forEach(x => {
                        if (x.btn !== b) x.btn.classList.add("aj-dim");
                        x.btn.setAttribute("aria-disabled", "true");
                    });

                    api.say(solvedGroups >= total ? "🎉 أحسنت! كل الإجابات صحيحة" : "✓ أحسنت! أكمل المجموعة التالية");

                    if (solvedGroups >= total) api.solved();

                } else {

                    wrongRun++;

                    b.classList.add("aj-opt-wrong");
                    api.later(() => b.classList.remove("aj-opt-wrong"), 650);

                    if (wrongRun >= 2) {
                        const right = buttons.find(x => x.opt.correct);
                        if (right) right.btn.classList.add("aj-hint");
                        api.say("💡 تلميح: انظر إلى الإطار الأصفر");
                    } else {
                        api.say("😊 حاول مرة أخرى");
                    }
                }
            });

            buttons.push({ btn: b, opt: opt });
            opts.appendChild(b);
        });
    });
}

/* =========================================================
   🔍 البحث والوسم: ابحث عن الرقم ولوّنه / ضع دائرة في كل صف /
   اشطب الرقم / لوّن البالونات / لوّن الخانات لتظهر الصورة
   ========================================================= */

function ajRenderFind(stage, spec, api) {

    const root = ajEl("div", "aj-find aj-find-" + spec.variant);
    stage.appendChild(root);

    const targets = spec.cells.filter(c => c.target).length;

    let marked = 0;
    let wrongRun = 0;
    let colorIdx = 0;

    const cellButtons = [];

    function mark(btn, cell) {

        if (btn.classList.contains("aj-marked")) return;

        btn.classList.add("aj-marked", "aj-m-" + spec.mark);
        btn.setAttribute("aria-pressed", "true");

        if (spec.mark === "color") {
            const c = cell.pic || AJ_COLORS[colorIdx % AJ_COLORS.length].hex;
            colorIdx++;
            btn.style.setProperty("--aj-mark", c);
        }

        marked++;
        wrongRun = 0;

        root.querySelectorAll(".aj-hint").forEach(h => h.classList.remove("aj-hint"));

        const remaining = targets - marked;

        if (remaining > 0) {
            api.say("✓ باقي " + ajNum(remaining) + " من " + ajNum(targets));
        } else {
            root.classList.add("aj-found-all");

            if (spec.variant === "reveal") {
                root.classList.add("aj-revealed");
                api.say("🎉 ظهرت الصورة: " + spec.revealName + "!");
            } else {
                api.say("🎉 أحسنت! وجدتَ كل " + spec.word);
            }

            api.solved();
        }
    }

    function makeCell(cell, i) {

        const b = ajEl("button", "aj-cell");
        b.type = "button";
        b.setAttribute("aria-pressed", "false");
        b.setAttribute("aria-label", "الرقم " + cell.text + "، اضغط للاختيار");

        if (spec.variant === "balloons") {
            const sh = ajEl("span", "aj-cell-balloon");
            sh.innerHTML = ajShapeSVG("balloon");
            b.appendChild(sh);
            b.appendChild(ajEl("span", "aj-cell-num aj-on-balloon", cell.text));
        } else {
            b.appendChild(ajEl("span", "aj-cell-num", cell.text));
        }

        b.addEventListener("click", () => {

            if (b.classList.contains("aj-marked")) return;

            if (cell.target) {
                mark(b, cell);
                return;
            }

            wrongRun++;

            b.classList.add("aj-cell-wrong");
            api.later(() => b.classList.remove("aj-cell-wrong"), 600);

            api.say("😊 هذا ليس " + spec.word + " — حاول مرة أخرى");

            if (wrongRun >= 3) {
                const left = cellButtons.find(x => x.cell.target && !x.btn.classList.contains("aj-marked"));
                if (left) left.btn.classList.add("aj-hint");
            }
        });

        cellButtons.push({ btn: b, cell: cell });

        return b;
    }

    if (spec.variant === "rows") {

        for (let r = 0; r * spec.cols < spec.cells.length; r++) {

            const row = ajEl("div", "aj-find-row");
            row.setAttribute("role", "group");
            row.setAttribute("aria-label", "الصف " + ajNum(r + 1));

            spec.cells.slice(r * spec.cols, (r + 1) * spec.cols).forEach((cell, k) => {
                row.appendChild(makeCell(cell, r * spec.cols + k));
            });

            root.appendChild(row);
        }

    } else {

        const grid = ajEl("div", "aj-find-grid");
        grid.style.gridTemplateColumns = "repeat(" + spec.cols + ", 1fr)";
        grid.setAttribute("role", "group");
        grid.setAttribute("aria-label", "الأرقام");

        spec.cells.forEach((cell, i) => grid.appendChild(makeCell(cell, i)));

        root.appendChild(grid);
    }

    api.say(spec.variant === "reveal"
        ? "🖼️ لوّن كل خانة فيها الرقم " + spec.word + " لتظهر صورة مفاجأة"
        : "🔍 ابحث عن كل الرقم " + spec.word);
}

/* =========================================================
   🔗 التوصيل: اسحب من عنصر إلى آخر (خط حيّ) أو المس عنصرًا ثم الآخر،
   أو استخدم لوحة المفاتيح (Enter/Space). الخطوط الصحيحة تثبت،
   والخاطئة تهتز بهدوء وتختفي بلا عقوبة، وبعد خطأين تلميح أصفر.
   ========================================================= */

const AJ_SVG_NS = "http://www.w3.org/2000/svg";

function ajConnLabel(d) {

    const word = (typeof numberWords !== "undefined" && numberWords[d.value]) || ajNum(d.value);

    if (d.numeral) return "الرقم " + word;
    if (d.objects) return "مجموعة من " + ajNum(d.value) + " تفاحات";
    if (d.base10 !== undefined) return "مكعبات العدد " + ajNum(d.value);
    return "صورة العدد " + ajNum(d.value);
}

function ajConnContent(d) {

    if (d.numeral) {
        return ajEl("span", "aj-conn-num" + (d.big ? " aj-conn-num-big" : ""), d.numeral);
    }

    if (d.objects) {
        const row = ajObjectsRow(d.objects.type, d.objects.count, true);
        row.classList.add("aj-objects-mini");
        return row;
    }

    if (d.base10 !== undefined) {
        return ajRepNode({ type: "base10", value: d.base10 });
    }

    return ajFramesPair(d.value, "aj-frames-mini");
}

function ajRenderConnect(stage, spec, api) {

    const root = ajEl("div", "aj-connect aj-connect-" + spec.layout);
    stage.appendChild(root);

    /* كميات (مجموعات تفاح) في أحد الطرفين: نمنحها عرضًا أكبر ليسهل عدّها */
    if (spec.layout === "two" && spec.b.some(d => d.objects)) root.classList.add("aj-two-qty");

    const items = {};
    const links = [];
    const need = Object.keys(spec.pairs).length;

    let connected = 0;
    let selectedId = null;
    let wrongRun = 0;
    let drag = null;
    let tempLine = null;

    function buildItem(data, side, edges) {

        const el = ajEl("button", "aj-conn-item aj-conn-" + side + (data.big ? " aj-conn-bigitem" : ""));
        el.type = "button";
        el.dataset.id = data.id;
        el.dataset.side = side;
        el.setAttribute("aria-label", ajConnLabel(data) + "، اضغط للاختيار ثم اختر ما يناسبه");
        el.setAttribute("aria-pressed", "false");
        el.appendChild(ajConnContent(data));

        const dots = { l: null, r: null };

        edges.forEach(edge => {
            const dot = ajEl("span", "aj-dot aj-dot-" + edge);
            dot.setAttribute("aria-hidden", "true");
            el.appendChild(dot);
            dots[edge] = dot;
        });

        items[data.id] = { id: data.id, side: side, data: data, el: el, dots: dots, locked: false };

        return el;
    }

    /* ---- بناء التخطيط ---- */

    if (spec.layout === "center") {

        /* بنية مسطّحة: الرقم أولًا ثم المجموعات الست؛ والتوزيع (ثلاثة أعمدة على
           الشاشات العريضة، أو عمودان على الضيقة) يتولاه CSS. الحافة المواجهة
           للخط تُحسب عند كل تخطيط (updateFaces) فتظهر نقطة واحدة فقط */

        spec.a.forEach(d => root.appendChild(buildItem(d, "a", ["l", "r"])));
        spec.b.forEach(d => root.appendChild(buildItem(d, "b", ["l", "r"])));

    } else {

        const colA = ajEl("div", "aj-conn-col");
        const colB = ajEl("div", "aj-conn-col");

        spec.a.forEach(d => colA.appendChild(buildItem(d, "a", ["l"])));
        spec.b.forEach(d => colB.appendChild(buildItem(d, "b", ["r"])));

        root.appendChild(colA);
        root.appendChild(colB);
    }

    const svg = document.createElementNS(AJ_SVG_NS, "svg");
    svg.setAttribute("class", "aj-conn-svg");
    svg.setAttribute("aria-hidden", "true");
    root.appendChild(svg);

    /* ---- هندسة الخطوط ---- */

    function centerX(item) {
        const r = item.el.getBoundingClientRect();
        return r.left + r.width / 2;
    }

    function anchor(item, towardX) {

        const rootR = root.getBoundingClientRect();
        const want = towardX < centerX(item) ? "l" : "r";
        const dot = item.dots[want] || item.dots[want === "l" ? "r" : "l"];
        const dr = dot.getBoundingClientRect();

        return { x: dr.left + dr.width / 2 - rootR.left, y: dr.top + dr.height / 2 - rootR.top };
    }

    function placeLine(line, A, B) {
        const pA = anchor(A, centerX(B));
        const pB = anchor(B, centerX(A));
        line.setAttribute("x1", pA.x);
        line.setAttribute("y1", pA.y);
        line.setAttribute("x2", pB.x);
        line.setAttribute("y2", pB.y);
    }

    function makeLine(cls) {
        const line = document.createElementNS(AJ_SVG_NS, "line");
        line.setAttribute("class", "aj-conn-line " + cls);
        svg.appendChild(line);
        return line;
    }

    /* مركز: أي حافة من كل عنصر تواجه الطرف الآخر؟ تُخفى النقطة الأخرى */
    function updateFaces() {

        if (spec.layout !== "center") return;

        const centre = Object.keys(items).map(k => items[k]).find(it => it.side === "a");
        if (!centre) return;

        const cx = centerX(centre);
        const used = { l: false, r: false };

        Object.keys(items).forEach(k => {
            const it = items[k];
            if (it.side !== "b") return;
            const face = cx < centerX(it) ? "l" : "r";
            it.el.dataset.face = face;
            used[cx < centerX(it) ? "l" : "r"] = true;
        });

        /* حافة الرقم المواجهة: إن كانت المجموعة على يمينه فنقطته يمينية */
        centre.el.dataset.faceL = used.r ? "1" : "0";
        centre.el.dataset.faceR = used.l ? "1" : "0";
    }

    function redraw() {
        updateFaces();
        links.forEach(l => placeLine(l.line, items[l.aId], items[l.bId]));
    }

    let observer = null;

    if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(redraw);
        observer.observe(root);
    }

    window.addEventListener("resize", redraw);

    /* ---- الاختيار ---- */

    function setSelected(id) {

        if (selectedId && items[selectedId]) {
            items[selectedId].el.classList.remove("aj-selected");
            items[selectedId].el.setAttribute("aria-pressed", "false");
        }

        selectedId = id;

        if (id && items[id]) {
            items[id].el.classList.add("aj-selected");
            items[id].el.setAttribute("aria-pressed", "true");
        }
    }

    function partnerOf(id) {

        const it = items[id];

        if (it.side === "a") return spec.pairs[id];

        return Object.keys(spec.pairs).find(k => spec.pairs[k] === id);
    }

    function evaluate(idX, idY) {

        const X = items[idX];
        const Y = items[idY];

        if (!X || !Y || X.locked || Y.locked || X.side === Y.side) {
            setSelected(null);
            return;
        }

        const a = X.side === "a" ? X : Y;
        const b = X.side === "a" ? Y : X;

        if (spec.pairs[a.id] === b.id) {

            a.locked = true;
            b.locked = true;

            [a, b].forEach(it => {
                it.el.classList.add("aj-conn-ok");
                it.el.classList.remove("aj-selected", "aj-hint");
                it.el.setAttribute("aria-pressed", "false");
                it.el.setAttribute("aria-disabled", "true");
                it.el.setAttribute("aria-label", "موصول: " + ajConnLabel(it.data));
            });

            const line = makeLine("aj-conn-ok-line");
            placeLine(line, a, b);
            links.push({ aId: a.id, bId: b.id, line: line });

            connected++;
            wrongRun = 0;
            selectedId = null;

            if (connected >= need) {
                api.say("🎉 أحسنت! وصلتَ كل الأزواج");
                api.solved();
            } else {
                api.say("✓ أحسنت! بقي " + ajNum(need - connected));
            }

            return;
        }

        /* خطأ: خط أحمر متقطع قصير + اهتزاز، ثم يُلغى التحديد (بلا عقوبة) */

        wrongRun++;

        const bad = makeLine("aj-conn-bad-line");
        placeLine(bad, a, b);

        [X, Y].forEach(it => it.el.classList.add("aj-conn-wrong"));

        api.later(() => {
            bad.remove();
            [X, Y].forEach(it => it.el.classList.remove("aj-conn-wrong"));
        }, 650);

        if (wrongRun >= 2) {
            const target = partnerOf(idX);
            if (target && items[target]) items[target].el.classList.add("aj-hint");
            api.say("💡 تلميح: انظر إلى الإطار الأصفر");
        } else {
            api.say("😊 حاول مرة أخرى");
        }

        setSelected(null);
    }

    function tapItem(id) {

        const it = items[id];
        if (!it || it.locked) return;

        if (it.data.speak) api.speakText(it.data.speak);

        if (!selectedId) { setSelected(id); return; }

        if (selectedId === id) { setSelected(null); return; }

        if (items[selectedId].side === it.side) { setSelected(id); return; }

        evaluate(selectedId, id);
    }

    /* ---- السحب بالمؤشر (أصبع/فأرة) ---- */

    function itemFromTarget(target) {
        const el = target && target.closest ? target.closest(".aj-conn-item") : null;
        return el && root.contains(el) ? items[el.dataset.id] : null;
    }

    function updateTemp(clientX, clientY) {

        const it = items[drag.id];
        const rootR = root.getBoundingClientRect();

        if (!tempLine) tempLine = makeLine("aj-conn-temp-line");

        const p = anchor(it, clientX);

        tempLine.setAttribute("x1", p.x);
        tempLine.setAttribute("y1", p.y);
        tempLine.setAttribute("x2", clientX - rootR.left);
        tempLine.setAttribute("y2", clientY - rootR.top);
    }

    function clearTemp() {
        if (tempLine) { tempLine.remove(); tempLine = null; }
    }

    function onMove(e) {

        if (!drag) return;

        if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 10) {
            drag.moved = true;
            setSelected(drag.id);
            const it = items[drag.id];
            if (it.data.speak) api.speakText(it.data.speak);
        }

        if (drag.moved) updateTemp(e.clientX, e.clientY);
    }

    function endDrag(e, cancelled) {

        const d = drag;
        drag = null;

        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onCancel);

        clearTemp();

        if (!d) return;

        if (cancelled) { if (d.moved) setSelected(null); return; }

        if (d.moved) {
            const target = itemFromTarget(document.elementFromPoint(e.clientX, e.clientY));
            if (target && target.id !== d.id) evaluate(d.id, target.id);
            else setSelected(null);
        } else {
            tapItem(d.id);
        }
    }

    function onUp(e) { endDrag(e, false); }
    function onCancel(e) { endDrag(e, true); }

    root.addEventListener("pointerdown", e => {

        const it = itemFromTarget(e.target);
        if (!it || it.locked) return;

        drag = { id: it.id, sx: e.clientX, sy: e.clientY, moved: false };

        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup", onUp);
        document.addEventListener("pointercancel", onCancel);
    });

    /* لوحة المفاتيح (Enter/Space على زرّ) — detail = 0 */
    root.addEventListener("click", e => {
        if (!ajIsKeyboardClick(e)) return;
        const it = itemFromTarget(e.target);
        if (it) tapItem(it.id);
    });

    api.say(spec.layout === "center"
        ? "🔗 اسحب من الرقم إلى المجموعة الصحيحة، أو المس الرقم ثم المجموعة"
        : "🔗 اسحب من عنصر إلى ما يناسبه، أو المس عنصرًا ثم الآخر");

    /* بعد أول رسم للتخطيط */
    requestAnimationFrame(redraw);

    return {
        cleanup() {
            document.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerup", onUp);
            document.removeEventListener("pointercancel", onCancel);
            window.removeEventListener("resize", redraw);
            if (observer) observer.disconnect();
        }
    };
}

/* =========================================================
   🔢 عُدّ واكتب الرقم: لمسة لكل شيء تعدّه (وتنطق رقمه)، ثم تكتب
   الجواب بلوحة أرقام عربية هندية كبيرة. بلا عقوبة عند الخطأ.
   ========================================================= */

function ajKeyFor(pad, digit) {
    const keys = pad.querySelectorAll(".aj-key");
    return keys[digit === 0 ? 9 : digit - 1];
}

function ajRenderCountWrite(stage, spec, api) {

    const root = ajEl("div", "aj-countwrite");
    stage.appendChild(root);

    const info = AJ_OBJECTS[spec.objects.type];

    const box = ajEl("div", "aj-stim aj-stim-countable");
    box.appendChild(ajCountableObjects(spec.objects.type, spec.objects.count, api));
    box.appendChild(ajEl("div", "aj-stim-hint", "اضغط كل " + info.label + " لتعدّها"));
    root.appendChild(box);

    const answerRow = ajEl("div", "aj-answer-row");
    answerRow.appendChild(ajEl("span", "aj-answer-label", "اكتب الرقم:"));

    const answerBox = ajEl("div", "aj-answer-box");
    answerBox.setAttribute("role", "status");
    answerBox.setAttribute("aria-live", "polite");
    answerBox.setAttribute("aria-label", "الجواب");
    answerRow.appendChild(answerBox);
    root.appendChild(answerRow);

    const len = String(spec.answer).length;
    let typed = "";
    let wrongRun = 0;
    let done = false;

    function render() {
        answerBox.textContent = typed ? ajNum(typed) : "";
    }

    function check() {

        if (Number(typed) === spec.answer) {

            done = true;
            answerBox.classList.add("aj-answer-ok");
            api.speakNumber(spec.answer);
            api.say("🎉 أحسنت! العدد " + ajNum(spec.answer));
            api.solved();
            return;
        }

        wrongRun++;
        answerBox.classList.add("aj-answer-wrong");

        api.say(wrongRun >= 2
            ? "💡 تلميح: اضغط كل " + info.label + " لتعدّها ثم اكتب آخر رقم"
            : "😊 عُدّ مرة أخرى ثم اكتب الرقم");

        api.later(() => {
            typed = "";
            answerBox.classList.remove("aj-answer-wrong");
            render();
        }, 650);
    }

    const pad = ajKeypad(d => {

        if (done || typed.length >= len || answerBox.classList.contains("aj-answer-wrong")) return;

        typed += String(d);
        render();

        if (typed.length === len) check();

    }, () => {
        if (done) return;
        typed = typed.slice(0, -1);
        render();
    });

    root.appendChild(pad);

    api.say("🔢 عُدّ ثم اكتب الرقم");
}

/* =========================================================
   ✏️ ملء التسلسل: قبل/بعد، العدد الناقص، «عشرة وكم؟» (معادلة)
   كل مربع فارغ يقبل أرقامًا عربية هندية من لوحة كبيرة؛ الصحيح يثبت ✓،
   والخطأ يهتز ويُمسح بلا عقوبة، وبعد خطأين يُلمَّح الرقم المطلوب على اللوحة.
   ========================================================= */

function ajRenderFillSeq(stage, spec, api) {

    const root = ajEl("div", "aj-fill");
    stage.appendChild(root);

    const blanks = [];
    let active = null;
    let wrongRun = 0;

    spec.rows.forEach(row => {

        const rowEl = ajEl("div", "aj-seq-row" + (row.ltr ? " aj-seq-ltr" : "") + (row.tokens.length >= 5 && !row.ltr ? " aj-seq-one-line" : ""));
        rowEl.setAttribute("role", "group");

        row.tokens.forEach(tok => {

            if (tok.type === "blank") {

                const b = ajEl("button", "aj-blank");
                b.type = "button";
                b.setAttribute("aria-label", "مربع فارغ، اكتب العدد");
                b.setAttribute("aria-pressed", "false");

                const rec = { el: b, answer: tok.answer, len: String(tok.answer).length, typed: "", solved: false };

                b.addEventListener("click", () => {
                    if (!rec.solved) setActive(rec);
                });

                blanks.push(rec);
                rowEl.appendChild(b);

            } else if (tok.type === "fixed") {

                const f = ajEl("span", "aj-seq-fixed" + (tok.hl ? " aj-seq-hl" : ""), tok.text);
                rowEl.appendChild(f);

            } else if (tok.type === "sym") {

                rowEl.appendChild(ajEl("span", "aj-seq-sym", tok.text));

            } else {

                const pic = ajEl("span", "aj-seq-pic");
                pic.setAttribute("aria-hidden", "true");
                pic.appendChild(ajFrameEl(tok.extra, "aj-frame-mini"));
                pic.appendChild(ajEl("span", "aj-plus aj-plus-mini", "+"));
                pic.appendChild(ajFrameEl(10, "aj-frame-mini"));
                rowEl.appendChild(pic);
            }
        });

        root.appendChild(rowEl);
    });

    function renderBlank(rec) {
        rec.el.textContent = rec.typed ? ajNum(rec.typed) : "";
    }

    function setActive(rec) {

        blanks.forEach(b => {
            b.el.classList.toggle("aj-blank-active", b === rec);
            b.el.setAttribute("aria-pressed", b === rec ? "true" : "false");
        });

        active = rec;

        clearKeyHints();
    }

    const pad = ajKeypad(d => {

        if (!active || active.solved || active.el.classList.contains("aj-blank-wrong")) return;
        if (active.typed.length >= active.len) return;

        active.typed += String(d);
        renderBlank(active);
        clearKeyHints();

        if (active.typed.length === active.len) check(active);

    }, () => {

        if (!active || active.solved) return;

        active.typed = active.typed.slice(0, -1);
        renderBlank(active);
    });

    function clearKeyHints() {
        pad.querySelectorAll(".aj-hint").forEach(k => k.classList.remove("aj-hint"));
    }

    function check(rec) {

        if (Number(rec.typed) === rec.answer) {

            rec.solved = true;
            wrongRun = 0;
            rec.el.classList.remove("aj-blank-active");
            rec.el.classList.add("aj-blank-ok");
            rec.el.setAttribute("aria-label", "صحيح: " + ajNum(rec.answer));
            rec.el.setAttribute("aria-pressed", "false");

            api.speakNumber(rec.answer);

            const left = blanks.filter(b => !b.solved);

            if (!left.length) {
                api.say("🎉 أحسنت! أكملتَ كل الأعداد");
                api.solved();
            } else {
                api.say("✓ أحسنت! بقي " + ajNum(left.length));
                setActive(left[0]);
            }

            return;
        }

        wrongRun++;

        rec.el.classList.add("aj-blank-wrong");

        if (wrongRun >= 2) {
            const need = Number(String(rec.answer)[0]);
            const key = ajKeyFor(pad, need);
            if (key) key.classList.add("aj-hint");
            api.say("💡 تلميح: ابدأ بالرقم المُلمَّح على اللوحة");
        } else {
            api.say("😊 حاول مرة أخرى");
        }

        api.later(() => {
            rec.typed = "";
            rec.el.classList.remove("aj-blank-wrong");
            renderBlank(rec);
        }, 650);
    }

    root.appendChild(pad);

    if (blanks.length) setActive(blanks[0]);

    api.say("✏️ اضغط المربع الفارغ ثم اكتب العدد");
}

/* =========================================================
   🖐️ السحب والإفلات: رتّب الأعداد / قطار الأعداد
   اسحب البطاقة إلى مكانها، أو المس البطاقة ثم المكان (أو العكس)،
   أو Enter/Space. المكان الخاطئ يهتز بهدوء وتعود البطاقة بلا عقوبة.
   ========================================================= */

function ajRenderDnd(stage, spec, api) {

    const root = ajEl("div", "aj-dnd aj-dnd-" + spec.layout);
    stage.appendChild(root);

    const total = spec.groups.length;
    let solvedGroups = 0;
    const cleanups = [];

    spec.groups.forEach((g, gi) => {

        const box = ajEl("div", "aj-dnd-group");
        root.appendChild(box);

        const slotsWrap = ajEl("div", spec.layout === "train" ? "aj-train" : "aj-slots");
        slotsWrap.setAttribute("role", "group");
        slotsWrap.setAttribute("aria-label", spec.layout === "train" ? "القطار" : "الأماكن: من الأصغر إلى الأكبر");

        if (spec.layout === "train") {
            const engine = ajEl("span", "aj-engine", "🚂");
            engine.setAttribute("aria-hidden", "true");
            slotsWrap.appendChild(engine);
        }

        const slots = [];

        g.slots.forEach((s, si) => {

            if (s.fixed !== undefined) {
                slotsWrap.appendChild(ajEl("span", "aj-wagon aj-wagon-fixed", s.fixed));
                return;
            }

            const el = ajEl("button", "aj-slot" + (spec.layout === "train" ? " aj-wagon" : ""));
            el.type = "button";
            el.setAttribute("aria-label", spec.layout === "train" ? "عربة فارغة" : "مكان فارغ رقم " + ajNum(si + 1));

            const rec = { el: el, expected: s.expected, filled: false };

            slots.push(rec);
            slotsWrap.appendChild(el);
        });

        box.appendChild(slotsWrap);

        const bank = ajEl("div", "aj-bank");
        bank.setAttribute("role", "group");
        bank.setAttribute("aria-label", "البطاقات — اسحب كل بطاقة إلى مكانها");
        box.appendChild(bank);

        const tiles = [];
        let selectedTile = null;
        let selectedSlot = null;
        let wrongRun = 0;
        let groupSolved = false;

        function clearSelection() {
            if (selectedTile) selectedTile.el.classList.remove("aj-selected");
            if (selectedSlot) selectedSlot.el.classList.remove("aj-selected");
            selectedTile = null;
            selectedSlot = null;
        }

        function clearHints() {
            box.querySelectorAll(".aj-hint").forEach(h => h.classList.remove("aj-hint"));
        }

        function place(tile, slot) {

            if (tile.used || slot.filled || groupSolved) { clearSelection(); return; }

            if (tile.value === slot.expected) {

                tile.used = true;
                slot.filled = true;
                wrongRun = 0;

                tile.el.classList.add("aj-tile-used");
                tile.el.disabled = true;
                tile.el.setAttribute("aria-hidden", "true");

                slot.el.textContent = ajNum(tile.value);
                slot.el.classList.add("aj-slot-ok");
                slot.el.setAttribute("aria-label", "صحيح: " + ajNum(tile.value));
                slot.el.disabled = true;

                clearHints();
                clearSelection();

                api.speakNumber(tile.value);

                if (slots.every(s => s.filled)) {

                    groupSolved = true;
                    solvedGroups++;

                    if (solvedGroups >= total) {
                        api.say("🎉 أحسنت! رتّبتَ كل الأعداد");
                        api.solved();
                    } else {
                        api.say("✓ أحسنت! أكمل المجموعة التالية");
                    }

                } else {
                    api.say("✓ أحسنت! بقي " + ajNum(slots.filter(s => !s.filled).length));
                }

                return;
            }

            /* مكان خاطئ: اهتزاز هادئ وتعود البطاقة، بلا عقوبة */

            wrongRun++;

            tile.el.classList.add("aj-opt-wrong");
            slot.el.classList.add("aj-opt-wrong");

            api.later(() => {
                tile.el.classList.remove("aj-opt-wrong");
                slot.el.classList.remove("aj-opt-wrong");
            }, 650);

            if (wrongRun >= 2) {
                const right = slots.find(s => s.expected === tile.value && !s.filled);
                if (right) right.el.classList.add("aj-hint");
                api.say("💡 تلميح: ضعها في المكان ذي الإطار الأصفر");
            } else {
                api.say(spec.layout === "order"
                    ? "😊 ابدأ بأصغر عدد — حاول مرة أخرى"
                    : "😊 ليست هذه العربة — حاول مرة أخرى");
            }

            clearSelection();
        }

        function tapTile(tile) {

            if (tile.used || groupSolved) return;

            api.speakNumber(tile.value);

            if (selectedSlot) { place(tile, selectedSlot); return; }

            if (spec.layout === "order") {
                /* في الترتيب: لمسة واحدة تضع البطاقة في أول مكان فارغ إن كانت صحيحة */
                const first = slots.find(s => !s.filled);
                if (first) place(tile, first);
                return;
            }

            if (selectedTile === tile) { clearSelection(); return; }

            clearSelection();
            selectedTile = tile;
            tile.el.classList.add("aj-selected");
        }

        function tapSlot(slot) {

            if (slot.filled || groupSolved) return;

            if (selectedTile) { place(selectedTile, slot); return; }

            if (selectedSlot === slot) { clearSelection(); return; }

            clearSelection();
            selectedSlot = slot;
            slot.el.classList.add("aj-selected");
        }

        slots.forEach(slot => {
            slot.el.addEventListener("click", () => tapSlot(slot));
        });

        g.tiles.forEach(value => {

            const el = ajEl("button", "aj-tile", ajNum(value));
            el.type = "button";
            el.setAttribute("aria-label", "بطاقة الرقم " + ajNum(value) + "، اسحبها أو اضغطها");

            const tile = { el: el, value: value, used: false };

            tiles.push(tile);
            bank.appendChild(el);

            /* السحب بالمؤشر مع بطاقة شبحية تتبع الإصبع */

            el.addEventListener("pointerdown", e => {

                if (tile.used || groupSolved) return;

                e.preventDefault();

                const sx = e.clientX;
                const sy = e.clientY;
                let moved = false;
                let ghost = null;
                let overSlot = null;

                const move = ev => {

                    if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) {
                        moved = true;
                        ghost = el.cloneNode(true);
                        ghost.classList.add("aj-ghost");
                        ghost.removeAttribute("aria-label");
                        ghost.setAttribute("aria-hidden", "true");
                        document.body.appendChild(ghost);
                        el.classList.add("aj-dragging");
                        clearSelection();
                    }

                    if (ghost) {
                        ghost.style.left = ev.clientX + "px";
                        ghost.style.top = ev.clientY + "px";

                        const under = document.elementFromPoint(ev.clientX, ev.clientY);
                        const slotEl = under && under.closest ? under.closest(".aj-slot") : null;

                        if (overSlot && overSlot !== slotEl) overSlot.classList.remove("aj-drop-over");
                        overSlot = slotEl;
                        if (overSlot) overSlot.classList.add("aj-drop-over");
                    }
                };

                const up = ev => {

                    document.removeEventListener("pointermove", move);
                    document.removeEventListener("pointerup", up);
                    document.removeEventListener("pointercancel", up);

                    if (ghost) ghost.remove();
                    if (overSlot) overSlot.classList.remove("aj-drop-over");
                    el.classList.remove("aj-dragging");

                    if (!moved) { tapTile(tile); return; }

                    const under = document.elementFromPoint(ev.clientX, ev.clientY);
                    const slotEl = under && under.closest ? under.closest(".aj-slot") : null;
                    const slot = slotEl ? slots.find(s => s.el === slotEl) : null;

                    if (slot) place(tile, slot);
                };

                document.addEventListener("pointermove", move);
                document.addEventListener("pointerup", up);
                document.addEventListener("pointercancel", up);

                cleanups.push(() => {
                    document.removeEventListener("pointermove", move);
                    document.removeEventListener("pointerup", up);
                    document.removeEventListener("pointercancel", up);
                    if (ghost) ghost.remove();
                });
            });

            /* لوحة المفاتيح: النقرة بلا مؤشر */
            el.addEventListener("click", e => {
                if (ajIsKeyboardClick(e)) tapTile(tile);
            });
        });
    });

    api.say(spec.layout === "order"
        ? "📶 اسحب الأعداد من الأصغر إلى الأكبر (أو المس البطاقة)"
        : "🚂 اسحب كل عدد إلى عربته (أو المس البطاقة ثم العربة)");

    return {
        cleanup() {
            cleanups.forEach(fn => fn());
            document.querySelectorAll(".aj-ghost").forEach(g => g.remove());
        }
    };
}

/* =========================================================
   🏠 المتاهة: امشِ على الرقم فقط حتى تصل إلى البيت
   اسحب الإصبع فوق المربعات أو المس المربع المجاور خطوة خطوة.
   الخطأ يهتز بهدوء بلا عقوبة، وبعد ٣ أخطاء يظهر تلميح للمربع التالي.
   ========================================================= */

function ajRenderMaze(stage, spec, api) {

    const root = ajEl("div", "aj-maze");
    stage.appendChild(root);

    const goal = ajEl("div", "aj-maze-goal", "امشِ على الرقم " + ajNum(spec.target) + " فقط");
    root.appendChild(goal);

    const grid = ajEl("div", "aj-maze-grid");
    grid.style.gridTemplateColumns = "repeat(" + spec.cols + ", 1fr)";
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", "المتاهة: ابدأ من الولد وامشِ على الرقم " + ajNum(spec.target) + " حتى البيت");
    root.appendChild(grid);

    const byKey = {};
    const path = spec.path;
    const start = path[0];
    const end = path[path.length - 1];

    let pos = 0;
    let wrongRun = 0;
    let finished = false;
    let down = false;
    let lastKey = null;

    spec.cells.forEach(cell => {

        const b = ajEl("button", "aj-maze-cell");
        b.type = "button";
        b.dataset.r = cell.r;
        b.dataset.c = cell.c;
        b.setAttribute("aria-label", "الرقم " + ajNum(cell.value));

        b.appendChild(ajEl("span", "aj-maze-num", ajNum(cell.value)));

        if (cell.r === start[0] && cell.c === start[1]) {
            const badge = ajEl("span", "aj-maze-badge aj-maze-boy", "🧒");
            badge.setAttribute("aria-hidden", "true");
            b.appendChild(badge);
            b.classList.add("aj-maze-visited", "aj-maze-start");
            b.setAttribute("aria-label", "البداية: الولد، الرقم " + ajNum(cell.value));
        }

        if (cell.r === end[0] && cell.c === end[1]) {
            const badge = ajEl("span", "aj-maze-badge aj-maze-house", "🏠");
            badge.setAttribute("aria-hidden", "true");
            b.appendChild(badge);
            b.classList.add("aj-maze-end");
            b.setAttribute("aria-label", "البيت، الرقم " + ajNum(cell.value));
        }

        byKey[cell.r + "," + cell.c] = { el: b, cell: cell };
        grid.appendChild(b);
    });

    function tryCell(r, c, fromDrag) {

        if (finished) return;

        const key = r + "," + c;
        const rec = byKey[key];

        if (!rec || rec.el.classList.contains("aj-maze-visited")) return;

        const cur = path[pos];
        const next = path[pos + 1];

        if (next && next[0] === r && next[1] === c) {

            pos++;
            wrongRun = 0;

            rec.el.classList.add("aj-maze-visited");
            rec.el.classList.remove("aj-hint");

            if (pos === path.length - 1) {
                finished = true;
                api.say("🎉 وصل الولد إلى البيت!");
                api.solved();
            } else {
                api.say("✓ أحسنت! تابع");
            }

            return;
        }

        const adjacent = Math.abs(r - cur[0]) + Math.abs(c - cur[1]) === 1;

        if (!adjacent) {
            if (!fromDrag) api.say("👣 امشِ خطوة خطوة من المربع الأخضر");
            return;
        }

        /* مجاور لكنه ليس الرقم المطلوب: اهتزاز هادئ بلا عقوبة */

        wrongRun++;

        rec.el.classList.add("aj-cell-wrong");
        api.later(() => rec.el.classList.remove("aj-cell-wrong"), 600);

        api.say("😊 هذا ليس " + ajNum(spec.target) + " — جرّب مربعًا آخر");

        if (wrongRun >= 3 && next) {
            const hintRec = byKey[next[0] + "," + next[1]];
            if (hintRec) hintRec.el.classList.add("aj-hint");
        }
    }

    function cellFromPoint(x, y) {
        const el = document.elementFromPoint(x, y);
        const cell = el && el.closest ? el.closest(".aj-maze-cell") : null;
        return cell && grid.contains(cell) ? cell : null;
    }

    grid.addEventListener("pointerdown", e => {
        const cell = e.target.closest ? e.target.closest(".aj-maze-cell") : null;
        if (!cell) return;
        down = true;
        lastKey = cell.dataset.r + "," + cell.dataset.c;
        tryCell(Number(cell.dataset.r), Number(cell.dataset.c), false);
    });

    grid.addEventListener("pointermove", e => {
        if (!down) return;
        const cell = cellFromPoint(e.clientX, e.clientY);
        if (!cell) return;
        const key = cell.dataset.r + "," + cell.dataset.c;
        if (key === lastKey) return;
        lastKey = key;
        tryCell(Number(cell.dataset.r), Number(cell.dataset.c), true);
    });

    const stop = () => { down = false; lastKey = null; };

    document.addEventListener("pointerup", stop);
    document.addEventListener("pointercancel", stop);

    grid.addEventListener("click", e => {
        if (!ajIsKeyboardClick(e)) return;
        const cell = e.target.closest ? e.target.closest(".aj-maze-cell") : null;
        if (cell) tryCell(Number(cell.dataset.r), Number(cell.dataset.c), false);
    });

    api.say("🧒 ابدأ من الولد وامشِ على الرقم " + ajNum(spec.target) + " حتى البيت 🏠");

    return {
        cleanup() {
            document.removeEventListener("pointerup", stop);
            document.removeEventListener("pointercancel", stop);
        }
    };
}

/* =========================================================
   ✨ توصيل النقاط بالترتيب من الواحد
   كل نقطة تنطق رقمها (عدّ مسموع)، وعند الاكتمال يُغلق الشكل ويتلوّن
   ========================================================= */

function ajRenderDots(stage, spec, api) {

    const root = ajEl("div", "aj-dots-root");
    stage.appendChild(root);

    const board = ajEl("div", "aj-dots");
    board.setAttribute("role", "group");
    board.setAttribute("aria-label", "النقاط المرقَّمة من ١ إلى " + ajNum(spec.n));
    root.appendChild(board);

    const svg = document.createElementNS(AJ_SVG_NS, "svg");
    svg.setAttribute("class", "aj-dots-svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    board.appendChild(svg);

    const fill = document.createElementNS(AJ_SVG_NS, "polygon");
    fill.setAttribute("class", "aj-dots-fill");
    fill.setAttribute("points", spec.points.map(p => p.x + "," + p.y).join(" "));
    svg.appendChild(fill);

    const buttons = [];
    let next = 1;
    let wrongRun = 0;

    spec.points.forEach((p, i) => {

        const b = ajEl("button", "aj-dot-btn" + (i === 0 ? " aj-dot-start" : ""), ajNum(i + 1));
        b.type = "button";
        b.style.left = p.x + "%";
        b.style.top = p.y + "%";
        b.setAttribute("aria-label", "النقطة " + ajNum(i + 1));

        b.addEventListener("click", () => tapDot(i + 1, b));

        buttons.push(b);
        board.appendChild(b);
    });

    function addLine(a, b, cls) {
        const line = document.createElementNS(AJ_SVG_NS, "line");
        line.setAttribute("class", "aj-dots-line " + (cls || ""));
        line.setAttribute("x1", a.x);
        line.setAttribute("y1", a.y);
        line.setAttribute("x2", b.x);
        line.setAttribute("y2", b.y);
        svg.appendChild(line);
    }

    function tapDot(k, btn) {

        if (k < next) return;

        if (k === next) {

            wrongRun = 0;
            buttons.forEach(x => x.classList.remove("aj-hint"));

            btn.classList.add("aj-dot-done");
            btn.classList.remove("aj-dot-start");
            btn.setAttribute("aria-label", "النقطة " + ajNum(k) + "، تم");

            api.speakNumber(k);

            if (k > 1) addLine(spec.points[k - 2], spec.points[k - 1]);

            next++;

            if (k === spec.n) {

                addLine(spec.points[spec.n - 1], spec.points[0]);
                svg.classList.add("aj-dots-complete");

                api.say("🎉 ظهر " + (spec.shape === "heart" ? "القلب" : "الشكل") + "! أحسنت");
                api.solved();

            } else {

                api.say("✓ الآن اضغط النقطة رقم " + ajNum(next));
            }

            return;
        }

        wrongRun++;

        btn.classList.add("aj-cell-wrong");
        api.later(() => btn.classList.remove("aj-cell-wrong"), 600);

        api.say("😊 اضغط النقطة رقم " + ajNum(next));

        if (wrongRun >= 2) buttons[next - 1].classList.add("aj-hint");
    }

    api.say("✨ ابدأ من النقطة رقم " + ajNum(1));
}

/* =========================================================
   ⚫ بناء إطار العشرة: ارسم دوائر في الإطار حتى يصبح العدد مثل الرقم
   (اللمس يضع/يُزيل دائرة؛ لا عقوبة على الزيادة — فقط تلميح لطيف)
   ========================================================= */

function ajRenderFrames(stage, spec, api) {

    const root = ajEl("div", "aj-frames");
    stage.appendChild(root);

    const need = spec.target - 10;
    const rowsState = [];
    let solvedRows = 0;

    spec.rows.forEach((row, ri) => {

        const rowEl = ajEl("div", "aj-frames-row");
        rowEl.setAttribute("role", "group");
        rowEl.setAttribute("aria-label", "الإطار " + ajNum(ri + 1));

        const chip = ajEl("span", "aj-frames-chip", ajNum(spec.target));
        chip.setAttribute("aria-label", "العدد المطلوب " + ajNum(spec.target));
        rowEl.appendChild(chip);

        const frames = ajEl("div", "aj-frames-pair aj-frames-pair-live");

        const full = ajFrameEl(10);
        frames.appendChild(full);

        const live = ajEl("div", "aj-frame aj-frame-live");
        const cells = [];

        for (let i = 0; i < 10; i++) {

            const cell = ajEl("button", "aj-frame-cell aj-frame-cell-btn");
            cell.type = "button";
            cell.setAttribute("aria-pressed", "false");
            cell.setAttribute("aria-label", "خانة " + ajNum(i + 1) + " في الإطار الثاني، اضغط لتضع دائرة");

            if (i < row.pre) {
                cell.appendChild(ajEl("span", "aj-counter"));
                cell.classList.add("aj-prefilled");
                cell.disabled = true;
                cell.setAttribute("aria-pressed", "true");
                cell.setAttribute("aria-label", "خانة " + ajNum(i + 1) + " فيها دائرة");
            }

            cells.push(cell);
            live.appendChild(cell);
        }

        frames.appendChild(live);
        rowEl.appendChild(frames);

        const state = { cells: cells, rowEl: rowEl, solved: false };
        rowsState.push(state);

        function count() {
            return cells.filter(c => c.querySelector(".aj-counter")).length;
        }

        cells.forEach(cell => {

            cell.addEventListener("click", () => {

                if (state.solved || cell.disabled) return;

                const existing = cell.querySelector(".aj-counter");

                if (existing) {
                    existing.remove();
                    cell.setAttribute("aria-pressed", "false");
                } else {
                    cell.appendChild(ajEl("span", "aj-counter aj-counter-new"));
                    cell.setAttribute("aria-pressed", "true");
                }

                const c = count();

                if (c === need) {

                    state.solved = true;
                    solvedRows++;
                    rowEl.classList.add("aj-row-ok");

                    cells.forEach(x => { x.disabled = true; });

                    api.speakNumber(spec.target);

                    if (solvedRows >= spec.rows.length) {
                        api.say("🎉 أحسنت! أصبح العدد مثل الرقم " + ajNum(spec.target));
                        api.solved();
                    } else {
                        api.say("✓ أحسنت! أكمل الإطار التالي");
                    }

                } else if (c > need) {
                    api.say("😊 كثير قليلًا — اضغط دائرة لتُزيلها");
                } else {
                    api.say("🧮 بقي " + ajNum(need - c) + " دائرة");
                }
            });
        });

        root.appendChild(rowEl);
    });

    api.say("⚫ ضع دوائر في الإطار الثاني حتى يصبح العدد " + ajNum(spec.target));
}

/* =========================================================
   🧷 ربط القسم بالتطبيق: إيقاف هادئ عند مغادرة الشاشة بأي تنقّل عام
   (تغليف غير جراحي لـ showScreen — فوق التغليفات السابقة، بلا تعديل عليها)
   ========================================================= */

const originalShowScreenForAJ = showScreen;

showScreen = function (screenId) {

    if (screenId !== "ajPlay" && screenId !== "ajHome") ajStopAudio();

    if (
        typeof ajGame !== "undefined" &&
        ajGame.active &&
        screenId !== "ajPlay"
    ) {
        ajTeardownCurrent();
        ajGame.active = false;
        ajGame.session++;

        ajSetDialogInert(false);

        const dialog = $("ajDone");
        if (dialog) dialog.style.display = "none";
    }

    originalShowScreenForAJ(screenId);
};

/* =========================================================
   🔚 نهاية قسم "أرقامي الجميلة" التفاعلي المستقل
   ========================================================= */

/* =========================================================
   🆕 =====================================================
   🧱 بنّاء الكلمات — لعبة مستقلة (قسم الألعاب)
   =====================================================
   الطفل يرى الصورة، ويسمع الكلمة، ثم يبنيها باختيار الحروف بالترتيب.
   تظهر الحروف المختارة في خانات الكلمة بالشكل المتصل الصحيح، مع
   إمكانية حذف آخر حرف وإعادة المحاولة. بلا مؤقت ولا أرواح ولا عقوبة.

   مستقلة تمامًا: معرّفاتها wb / WB، ومفتاح حفظها taha_wb_progress_v1،
   ومشغّل صوتها الخاص (MP3 محلي فقط، بلا أي TTS، وصوت واحد في كل مرة).
   تقرأ فقط (دون تعديل) من: PW_WORD_BANK (الكلمات والصور)،
   EDUCATIONAL_AUDIO_MANIFEST (الصوت)، arabicLetterForms +
   RACE_NON_CONNECTORS + raceShapeForLetterAtPosition (اتصال الحروف)،
   LTR_SIMILAR_LETTERS (الحروف المتشابهة للمشتّتات).
========================================================= */

const WB_KEY = "taha_wb_progress_v1";
const WB_ROUNDS = 6;

const WB_LEVELS = [
    { id: 1, label: "٢–٣ حروف", extra: 0, similar: 0 },
    { id: 2, label: "٤ حروف",   extra: 2, similar: 0 },
    { id: 3, label: "٥ حروف",   extra: 3, similar: 1 },
    { id: 4, label: "٥–٦ حروف", extra: 4, similar: 2 }
];

/* أشكال «ا» و«ة» القياسية (Unicode) — غير موجودة في جدول المشروع الأصلي،
   فتُضاف هنا داخل اللعبة فقط دون المساس بالجدول. تحقّقتُ ببكسلات المتصفح
   أن الكلمات المركّبة بها تطابق التشكيل الطبيعي تمامًا. */
const WB_EXTRA_FORMS = {
    "ا": { isolated: "\uFE8D", final: "\uFE8E" },
    "ة": { isolated: "\uFE93", final: "\uFE94" }
};

/* «ا» لا صوت مسجّلًا لها: تُنطَق بصوت «أ» (همزة الألف). «ة» بلا صوت مسجّل
   فتبقى صامتة (لا TTS). */
const WB_SOUND_ALIAS = { "ا": "أ" };

/* حروف همزة/ألف مقصورة بلا أشكال ولا أصوات في بيانات المشروع */
const WB_UNSUPPORTED_LETTERS = /[ءئؤىإآ]/;

const wbGame = {
    active: false,
    session: 0,
    level: 1,
    round: 0,
    entry: null,
    letters: [],
    tiles: [],
    placed: [],
    wrongAt: {},
    solved: false,
    usedWords: [],
    sessionWords: []
};


/* مساعد إنشاء عناصر خاص باللعبة (لا اعتماد على أقسام أخرى) */
function wbEl(tag, className, text) {

    const el = document.createElement(tag);

    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = text;

    return el;
}

/* =========================================================
   💾 حفظ التقدّم (مستقل)
   ========================================================= */

let wbProgressCache = null;

function wbLoadProgress() {

    if (wbProgressCache) return wbProgressCache;

    let data = null;

    try {
        data = JSON.parse(localStorage.getItem(WB_KEY) || "null");
    } catch (e) {
        data = null;
    }

    if (!data || typeof data !== "object") data = {};

    const unlocked = Math.min(Math.max(Number(data.unlocked) || 1, 1), WB_LEVELS.length);

    wbProgressCache = {
        unlocked: unlocked,
        collected: data.collected && typeof data.collected === "object" ? data.collected : {},
        bonus: data.bonus && typeof data.bonus === "object" ? data.bonus : {}
    };

    return wbProgressCache;
}

function wbSaveProgress() {
    try {
        localStorage.setItem(WB_KEY, JSON.stringify(wbLoadProgress()));
    } catch (e) { /* التخزين معطّل: نكمل دون حفظ */ }
}

function wbCollectedFor(level) {
    const c = wbLoadProgress().collected;
    return Array.isArray(c[level]) ? c[level] : [];
}

function wbMarkCollected(level, word) {
    const p = wbLoadProgress();
    if (!Array.isArray(p.collected[level])) p.collected[level] = [];
    if (!p.collected[level].includes(word)) p.collected[level].push(word);
    wbSaveProgress();
}

/* =========================================================
   🔤 اتصال الحروف: نفس خوارزمية المشروع (RACE_NON_CONNECTORS +
   raceShapeForLetterAtPosition) مع إضافة «ة» (لا تتصل بما بعدها)
   ========================================================= */

function wbIsNonConnector(letter) {
    return RACE_NON_CONNECTORS.has(letter) || letter === "ة";
}

function wbFormsOf(letter) {
    return arabicLetterForms[letter] || WB_EXTRA_FORMS[letter] || null;
}

function wbGlyph(letter, position) {

    if (arabicLetterForms[letter]) {
        return raceShapeForLetterAtPosition(letter, position);
    }

    const f = WB_EXTRA_FORMS[letter];

    return f ? (f[position] || f.isolated) : letter;
}

/* موضع الحرف i داخل كلمة طولها total (الحروف السابقة هي ما اختاره الطفل) */
function wbPosition(seq, i, total) {

    const hasIncoming = i > 0 && !wbIsNonConnector(seq[i - 1]);
    const hasOutgoing = !wbIsNonConnector(seq[i]) && i < total - 1;

    if (hasIncoming && hasOutgoing) return "medial";
    if (!hasIncoming && hasOutgoing) return "initial";
    if (hasIncoming && !hasOutgoing) return "final";

    return "isolated";
}

function wbJoinedRun(letters) {
    return letters.map((ch, i) => wbGlyph(ch, wbPosition(letters, i, letters.length))).join("");
}

/* =========================================================
   📚 بنك الكلمات: فحص + استبعاد + مجمّعات المستويات
   ========================================================= */

function wbValidateEntry(entry) {

    const word = entry.word || "";
    const L = Array.from(word);

    if (!entry.emoji) return "لا صورة";
    if (typeof EDUCATIONAL_AUDIO_MANIFEST === "undefined" || !EDUCATIONAL_AUDIO_MANIFEST[word]) return "لا صوت للكلمة";
    if (L.length < 2) return "قصيرة جدًا";
    if (L.some(c => WB_UNSUPPORTED_LETTERS.test(c))) return "حرف همزة بلا بيانات أشكال";
    if (L.some(c => !wbFormsOf(c))) return "حرف بلا شكل";
    if (/ل[اأإآ]/.test(word)) return "فيها لام-ألف (تتحوّل إلى رمز واحد)";
    if (L.indexOf("ة") !== -1 && L.indexOf("ة") !== L.length - 1) return "تاء مربوطة في غير آخر الكلمة";

    return null;
}

let wbBankCache = null;

function wbBank() {

    if (wbBankCache) return wbBankCache;

    const valid = [];
    const excluded = [];
    const seen = new Set();

    Object.keys(PW_WORD_BANK).forEach(key => {
        PW_WORD_BANK[key].forEach(e => {

            if (seen.has(e.word)) return;
            seen.add(e.word);

            const reason = wbValidateEntry(e);

            if (reason) {
                excluded.push({ word: e.word, reason: reason });
                return;
            }

            const letters = Array.from(e.word);
            const connectCount = letters.filter((c, i) => i < letters.length - 1 && !wbIsNonConnector(c)).length;

            valid.push({ word: e.word, emoji: e.emoji, letters: letters, len: letters.length, connectCount: connectCount });
        });
    });

    /* المستوى ١: ٢–٣ حروف | ٢: ٤ حروف | ٣ و٤: ٥–٦ حروف تُقسَم بالصعوبة
       (عدد الحروف المتصلة بما بعدها؛ الأقل أسهل) فتذهب الأسهل إلى ٣ */

    const long = valid
        .filter(w => w.len >= 5)
        .sort((a, b) => (a.len - b.len) || (a.connectCount - b.connectCount) || a.word.localeCompare(b.word, "ar"));

    const half = Math.ceil(long.length / 2);

    const pools = {
        1: valid.filter(w => w.len <= 3),
        2: valid.filter(w => w.len === 4),
        3: long.slice(0, half),
        4: long.slice(half)
    };

    wbBankCache = { valid: valid, excluded: excluded, pools: pools };

    return wbBankCache;
}

/* =========================================================
   🎯 المشتّتات والحروف المتاحة
   ========================================================= */

function wbPickDistractors(entry, level) {

    const cfg = WB_LEVELS[level - 1];

    if (!cfg || !cfg.extra) return [];

    const banned = new Set(entry.letters);

    /* لا نخلط أ/ا مع بعضهما، ولا ه/ت مع ة: التباس لا فائدة تعليمية منه الآن */
    if (banned.has("أ") || banned.has("ا")) banned.add("أ");
    if (banned.has("ة")) { banned.add("ه"); banned.add("ت"); }

    const candidates = Object.keys(arabicLetterForms).filter(c => !banned.has(c));
    const chosen = [];

    if (cfg.similar) {

        const sims = [];

        shuffle(entry.letters).forEach(l => {
            (LTR_SIMILAR_LETTERS[l] || []).forEach(s => {
                if (candidates.includes(s) && !sims.includes(s)) sims.push(s);
            });
        });

        shuffle(sims).slice(0, cfg.similar).forEach(s => chosen.push(s));
    }

    shuffle(candidates.filter(c => !chosen.includes(c)))
        .slice(0, cfg.extra - chosen.length)
        .forEach(c => chosen.push(c));

    return chosen;
}

function wbBuildTiles(entry, level) {

    const all = entry.letters.concat(wbPickDistractors(entry, level));
    let order = shuffle(all);

    /* في المستوى الأول (بلا مشتّتات) لا يكون الترتيب مطابقًا للكلمة من البداية */
    if (all.length > 1) {
        for (let t = 0; t < 12 && order.join("") === entry.letters.join(""); t++) {
            order = shuffle(all);
        }
    }

    return order.map((letter, i) => ({ id: i, letter: letter, used: false }));
}

function wbPickWord(level) {

    const pool = wbBank().pools[level] || [];

    let candidates = pool.filter(w => !wbGame.usedWords.includes(w.word));
    if (!candidates.length) candidates = pool.slice();

    const collected = wbCollectedFor(level);
    const fresh = candidates.filter(w => !collected.includes(w.word));

    const from = fresh.length ? fresh : candidates;

    return from[Math.floor(Math.random() * from.length)];
}

/* =========================================================
   🔊 مشغّل MP3 محلي خاص باللعبة — بلا TTS وصوت واحد فقط في كل مرة
   (الصوت الجارٍ يكتمل؛ وأحدث طلب فقط يُحفظ ليُشغَّل بعده). الفشل = صمت.
   ========================================================= */

function speakWBLocal(text, interrupt) {
    EduAudio.play(text, { mode: interrupt ? "interrupt" : "queue" });
}

function wbStopAudio() { EduAudio.stop(); }

function wbLetterSoundText(letter) {

    const base = WB_SOUND_ALIAS[letter] || letter;
    const text = letterWithFatha(base);

    return (typeof EDUCATIONAL_AUDIO_MANIFEST !== "undefined" && EDUCATIONAL_AUDIO_MANIFEST[text]) ? text : null;
}

/* =========================================================
   🎛️ مساعدات الواجهة
   ========================================================= */

function wbSay(text) {
    const el = $("wbMessage");
    if (el) el.textContent = text;
}

function wbAlive(session) {
    return wbGame.active && wbGame.session === session;
}

function wbLater(fn, ms) {
    const session = wbGame.session;
    setTimeout(() => { if (wbAlive(session)) fn(); }, ms);
}

function wbUpdateStars() {
    const el = $("wbStars");
    if (el && typeof stars !== "undefined") el.textContent = arabicNumber(stars);
}

function wbSetInert(flag) {

    const wrap = document.querySelector("#wordBuilderGame .wb-wrapper");
    if (!wrap) return;

    Array.from(wrap.children).forEach(child => {
        if (child.id === "wbDone") return;
        child.inert = !!flag;
    });
}

function wbRenderLevels() {

    const box = $("wbLevels");
    if (!box) return;

    const unlocked = StudentStore.eff(wbLoadProgress().unlocked);

    box.innerHTML = "";

    WB_LEVELS.forEach(cfg => {

        const locked = cfg.id > unlocked;
        const btn = wbEl("button", "wb-chip" + (locked ? " wb-locked" : ""));

        btn.type = "button";
        btn.dataset.level = String(cfg.id);
        btn.setAttribute("aria-pressed", cfg.id === wbGame.level ? "true" : "false");
        btn.setAttribute("aria-label", "المستوى " + arabicNumber(cfg.id) + "، " + cfg.label + (locked ? "، مقفل" : ""));

        const title = wbEl("span", "", locked ? "🔒 " + arabicNumber(cfg.id) : "المستوى " + arabicNumber(cfg.id));
        const sub = wbEl("small", "", cfg.label);

        btn.appendChild(title);
        btn.appendChild(sub);

        if (locked) btn.setAttribute("aria-disabled", "true");

        btn.addEventListener("click", () => {
            if (locked) {
                wbSay("🔒 أكمل المستوى " + arabicNumber(cfg.id - 1) + " أولًا لتفتح هذا المستوى");
                return;
            }
            if (cfg.id !== wbGame.level) wbStartLevel(cfg.id);
        });

        box.appendChild(btn);
    });
}

function wbUpdateHud() {

    const roundEl = $("wbRound");
    const totalEl = $("wbTotalRounds");
    const wordsEl = $("wbWordsCount");
    const fill = $("wbProgressFill");
    const track = $("wbProgressTrack");

    if (roundEl) roundEl.textContent = arabicNumber(Math.min(Math.max(wbGame.round, 1), WB_ROUNDS));
    if (totalEl) totalEl.textContent = arabicNumber(WB_ROUNDS);

    if (wordsEl) {
        wordsEl.textContent = arabicNumber(wbCollectedFor(wbGame.level).length) +
            " / " + arabicNumber((wbBank().pools[wbGame.level] || []).length);
    }

    const done = Math.max(wbGame.round - 1, 0) + (wbGame.solved ? 1 : 0);
    const pct = Math.round((done / WB_ROUNDS) * 100);

    if (fill) fill.style.width = pct + "%";
    if (track) track.setAttribute("aria-valuenow", String(pct));

    const back = $("wbBtnBack");
    if (back) back.disabled = wbGame.solved || wbGame.placed.length === 0;

    wbUpdateStars();
}

/* =========================================================
   🖼️ عرض الجولة
   ========================================================= */

function wbRenderSlots() {

    const box = $("wbSlots");
    if (!box || !wbGame.entry) return;

    const N = wbGame.letters.length;
    const seq = wbGame.placed.map(p => p.letter);

    box.innerHTML = "";
    box.style.setProperty("--wb-n", String(N));

    for (let i = 0; i < N; i++) {

        const slot = wbEl("div", "wb-slot");
        slot.setAttribute("role", "img");

        if (i < seq.length) {

            const wrong = !!wbGame.placed[i].wrong;

            slot.textContent = wbGlyph(seq[i], wbPosition(seq, i, N));
            slot.classList.add("wb-slot-filled", wrong ? "wb-slot-wrong" : "wb-slot-ok");
            slot.setAttribute("aria-label", "الخانة " + arabicNumber(i + 1) + ": الحرف " + seq[i] + (wrong ? "، غير مناسب هنا" : ""));

        } else {

            slot.setAttribute("aria-label", "الخانة " + arabicNumber(i + 1) + ": فارغة");

            if (i === seq.length && !wbGame.solved) slot.classList.add("wb-slot-next");
        }

        box.appendChild(slot);
    }
}

function wbRenderTray() {

    const tray = $("wbTray");
    if (!tray) return;

    tray.innerHTML = "";

    wbGame.tiles.forEach(tile => {

        const btn = wbEl("button", "wb-tile", wbGlyph(tile.letter, "isolated"));

        btn.type = "button";
        btn.dataset.id = String(tile.id);
        btn.setAttribute("aria-label", "الحرف " + tile.letter);

        btn.addEventListener("click", () => wbTapTile(tile.id));

        tile.el = btn;
        tray.appendChild(btn);
    });
}

function wbUpdateTray() {

    wbGame.tiles.forEach(tile => {

        const btn = tile.el;
        if (!btn) return;

        btn.classList.toggle("wb-tile-used", tile.used);
        btn.disabled = tile.used || wbGame.solved;

        if (tile.used) btn.setAttribute("aria-hidden", "true");
        else btn.removeAttribute("aria-hidden");
    });
}

function wbClearHints() {
    wbGame.tiles.forEach(t => { if (t.el) t.el.classList.remove("wb-hint"); });
}

function wbShowHint() {

    wbClearHints();

    const idx = wbGame.placed.length;
    const need = wbGame.letters[idx];
    const tile = wbGame.tiles.find(t => !t.used && t.letter === need);

    if (tile && tile.el) tile.el.classList.add("wb-hint");
}

function wbFocusNextTile(fromId) {

    const open = wbGame.tiles.filter(t => !t.used && t.el);

    if (!open.length) return;

    const after = open.find(t => t.id > fromId) || open[0];

    after.el.focus();
}

function wbRenderRound() {

    const entry = wbGame.entry;

    const pic = $("wbPic");
    if (pic) {
        pic.textContent = entry.emoji;
        pic.classList.remove("wb-pic-done");
    }

    const slots = $("wbSlots");
    const joined = $("wbJoined");
    if (slots) slots.hidden = false;
    if (joined) { joined.hidden = true; joined.textContent = ""; }

    const next = $("wbBtnNext");
    if (next) {
        next.disabled = true;
        next.textContent = wbGame.round >= WB_ROUNDS ? "🌟 إنهاء المستوى" : "التالي ▶";
    }

    wbRenderTray();
    wbRenderSlots();
    wbUpdateTray();
    wbUpdateHud();
}

/* =========================================================
   ▶️ تدفّق اللعبة
   ========================================================= */

function startWBGame(level) {

    wbProgressCache = null;
    wbLoadProgress();

    const target = Math.min(Math.max(Number(level) || wbLoadProgress().unlocked, 1), Math.min(StudentStore.eff(wbLoadProgress().unlocked), WB_LEVELS.length));

    wbTeardown();

    wbGame.active = true;
    wbGame.session++;

    showScreen("wordBuilderGame");

    wbSetInert(false);

    const dialog = $("wbDone");
    if (dialog) dialog.style.display = "none";

    document.addEventListener("keydown", wbKeyHandler);

    wbStartLevel(target);
}

function wbStartLevel(level) {

    wbStopAudio();

    const dialog = $("wbDone");
    if (dialog) dialog.style.display = "none";
    wbSetInert(false);

    wbGame.level = level;
    wbGame.round = 0;
    wbGame.usedWords = [];
    wbGame.sessionWords = [];

    wbRenderLevels();
    wbNextRound();
}

function wbNextRound() {

    wbGame.round++;

    const entry = wbPickWord(wbGame.level);

    wbGame.entry = entry;
    wbGame.letters = entry.letters.slice();
    wbGame.tiles = wbBuildTiles(entry, wbGame.level);
    wbGame.placed = [];
    wbGame.wrongAt = {};
    wbGame.solved = false;
    wbGame.usedWords.push(entry.word);

    wbRenderRound();

    wbSay("👂 اسمع الكلمة ثم اختر حروفها بالترتيب");

    wbLater(() => speakWBLocal(entry.word), 350);
}

function wbListen() {
    if (!wbGame.active || !wbGame.entry) return;
    speakWBLocal(wbGame.entry.word);
}

function wbHasWrong() {
    const last = wbGame.placed[wbGame.placed.length - 1];
    return !!(last && last.wrong);
}

function wbTapTile(tileId) {

    if (!wbGame.active || wbGame.solved) return;

    const tile = wbGame.tiles.find(t => t.id === tileId);

    if (!tile || tile.used) return;

    if (wbHasWrong()) {

        wbSay("😊 احذف الحرف الأخير أولًا ثم جرّب حرفًا آخر");

        const back = $("wbBtnBack");
        if (back) {
            back.classList.remove("wb-nudge");
            void back.offsetWidth;
            back.classList.add("wb-nudge");
        }

        return;
    }

    const index = wbGame.placed.length;

    if (index >= wbGame.letters.length) return;

    const sound = wbLetterSoundText(tile.letter);
    if (sound) speakWBLocal(sound, true);

    const correct = tile.letter === wbGame.letters[index];

    tile.used = true;
    wbGame.placed.push({ letter: tile.letter, tileId: tile.id, wrong: !correct });

    if (correct) {

        wbGame.wrongAt[index] = 0;
        wbClearHints();

        wbRenderSlots();
        wbUpdateTray();
        wbUpdateHud();

        if (wbGame.placed.length === wbGame.letters.length) {
            wbComplete();
        } else {
            const remaining = wbGame.letters.length - wbGame.placed.length;
            wbSay("✓ أحسنت! بقي " + arabicNumber(remaining) + (remaining === 1 ? " حرف" : " حروف"));
            wbFocusNextTile(tile.id);
        }

        return;
    }

    wbGame.wrongAt[index] = (wbGame.wrongAt[index] || 0) + 1;

    wbRenderSlots();
    wbUpdateTray();
    wbUpdateHud();

    if (wbGame.wrongAt[index] >= 2) {
        wbSay("💡 تلميح: احذف هذا الحرف ثم اختر الحرف ذا الإطار الأصفر");
    } else {
        wbSay("😊 هذا ليس الحرف المناسب هنا — اضغط ⌫ لتحذفه وجرّب غيره");
    }

    const back = $("wbBtnBack");
    if (back) {
        back.classList.remove("wb-nudge");
        void back.offsetWidth;
        back.classList.add("wb-nudge");
    }
}

function wbRemoveLast() {

    if (!wbGame.active || wbGame.solved || !wbGame.placed.length) return;

    const last = wbGame.placed.pop();
    const tile = wbGame.tiles.find(t => t.id === last.tileId);

    if (tile) tile.used = false;

    wbRenderSlots();
    wbUpdateTray();
    wbUpdateHud();

    const index = wbGame.placed.length;

    if ((wbGame.wrongAt[index] || 0) >= 2) {
        wbShowHint();
        wbSay("💡 تلميح: اختر الحرف ذا الإطار الأصفر");
    } else {
        wbClearHints();
        wbSay("↩️ حذفنا الحرف الأخير — اختر الحرف التالي");
    }

    if (tile && tile.el) tile.el.focus();
}

function wbResetWord() {

    if (!wbGame.active || wbGame.solved) return;

    wbGame.placed = [];
    wbGame.wrongAt = {};
    wbGame.tiles.forEach(t => { t.used = false; });

    wbClearHints();
    wbRenderSlots();
    wbUpdateTray();
    wbUpdateHud();

    wbSay("↻ لنبدأ الكلمة من جديد");
}

function wbComplete() {

    wbGame.solved = true;

    const entry = wbGame.entry;

    wbRenderSlots();
    wbUpdateTray();

    /* الكلمة كاملة بالشكل المتصل (سلسلة أشكال متجاورة تتصل كنص واحد) */
    const slots = $("wbSlots");
    const joined = $("wbJoined");

    if (slots) slots.hidden = true;

    if (joined) {
        joined.textContent = wbJoinedRun(wbGame.letters);
        joined.setAttribute("aria-label", "الكلمة كاملة: " + entry.word);
        joined.hidden = false;
    }

    const pic = $("wbPic");
    if (pic) pic.classList.add("wb-pic-done");

    wbClearHints();

    if (typeof addStars === "function") addStars(1);

    wbMarkCollected(wbGame.level, entry.word);

    if (!wbGame.sessionWords.some(w => w.word === entry.word)) {
        wbGame.sessionWords.push({ word: entry.word, emoji: entry.emoji, letters: wbGame.letters.slice() });
    }

    wbSay("🎉 أحسنت! بنيتَ كلمة «" + entry.word + "»");

    /* الكلمة تُنطَق بعد صوت الحرف الأخير (صوت واحد في كل مرة) */
    speakWBLocal(entry.word);

    const next = $("wbBtnNext");
    if (next) next.disabled = false;

    wbUpdateHud();

    wbLater(() => {
        const n = $("wbBtnNext");
        if (n && !n.disabled) n.focus();
    }, 250);
}

function wbNext() {

    if (!wbGame.active || !wbGame.solved) return;

    if (wbGame.round >= WB_ROUNDS) {
        wbFinishLevel();
        return;
    }

    wbNextRound();
}

/* =========================================================
   🌟 إكمال المستوى
   ========================================================= */

function wbTrapFocus(event) {

    if (event.key !== "Tab") return;

    const focusables = [$("wbDoneWords"), $("wbDoneNext"), $("wbDoneAgain"), $("wbDoneExit")]
        .filter(b => b && !b.hidden);

    if (!focusables.length) return;

    event.preventDefault();

    const index = focusables.indexOf(document.activeElement);
    let target;

    if (event.shiftKey) {
        target = index <= 0 ? focusables[focusables.length - 1] : focusables[index - 1];
    } else {
        target = (index === -1 || index === focusables.length - 1) ? focusables[0] : focusables[index + 1];
    }

    target.focus();
}

function wbFinishLevel() {

    const level = wbGame.level;
    const p = wbLoadProgress();

    if (level < WB_LEVELS.length && p.unlocked < level + 1 && level <= p.unlocked) p.unlocked = level + 1;

    const firstTime = !p.bonus[level];

    if (firstTime) {
        p.bonus[level] = 1;
        if (typeof addStars === "function") addStars(3);
    }

    wbSaveProgress();
    wbRenderLevels();
    wbUpdateStars();

    const hasNext = level < WB_LEVELS.length;

    const title = $("wbDoneTitle");
    const body = $("wbDoneBody");
    const list = $("wbDoneWords");
    const nextBtn = $("wbDoneNext");
    const againBtn = $("wbDoneAgain");
    const exitBtn = $("wbDoneExit");

    if (title) title.textContent = hasNext ? "🌟 أحسنت! أكملت المستوى " + arabicNumber(level) : "🎉 أكملت كل المستويات!";

    if (body) {
        body.textContent = "بنيتَ " + arabicNumber(wbGame.sessionWords.length) + " كلمات" +
            (firstTime ? " وحصلت على ٣ نجوم هدية ⭐" : "");
    }

    if (list) {

        list.innerHTML = "";

        wbGame.sessionWords.forEach(w => {

            const item = wbEl("div", "wb-done-item");
            item.setAttribute("role", "listitem");
            item.setAttribute("aria-label", w.word);

            item.appendChild(wbEl("span", "wb-done-emoji", w.emoji));
            item.appendChild(wbEl("span", "wb-done-word", wbJoinedRun(w.letters)));

            list.appendChild(item);
        });
    }

    if (nextBtn) {
        nextBtn.hidden = !hasNext;
        nextBtn.textContent = "▶ المستوى " + arabicNumber(level + 1);
        nextBtn.onclick = () => wbStartLevel(level + 1);
    }

    if (againBtn) againBtn.onclick = () => wbStartLevel(level);

    if (exitBtn) exitBtn.onclick = exitWBGame;

    wbRenderConfetti();

    wbSetInert(true);

    const dialog = $("wbDone");

    if (dialog) {
        dialog.removeEventListener("keydown", wbTrapFocus);
        dialog.addEventListener("keydown", wbTrapFocus);
        dialog.style.display = "flex";
    }

    setTimeout(() => {
        const target = (nextBtn && !nextBtn.hidden) ? nextBtn : exitBtn;
        if (target) target.focus();
    }, 60);
}

function wbRenderConfetti() {

    const el = $("wbConfetti");
    if (!el) return;

    el.innerHTML = "";

    const colors = ["#818cf8", "#fbbf24", "#34d399", "#f472b6"];

    for (let i = 0; i < 8; i++) {
        const piece = wbEl("div", "wb-confetti-piece");
        piece.style.left = (10 + Math.random() * 80) + "%";
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = (Math.random() * 0.25) + "s";
        el.appendChild(piece);
    }

    setTimeout(() => { if (el) el.innerHTML = ""; }, 1400);
}

/* =========================================================
   ⌨️ لوحة المفاتيح + الإنهاء + التغليف
   ========================================================= */

function wbKeyHandler(event) {

    if (!wbGame.active) return;

    const dialog = $("wbDone");
    if (dialog && dialog.style.display === "flex") return;

    if (event.key === "Backspace" || event.key === "Delete") {

        const tag = event.target && event.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;

        event.preventDefault();
        wbRemoveLast();
    }
}

function wbTeardown() {

    wbStopAudio();

    document.removeEventListener("keydown", wbKeyHandler);

    wbGame.active = false;
    wbGame.session++;

    const dialog = $("wbDone");
    if (dialog) dialog.style.display = "none";

    wbSetInert(false);
}

function exitWBGame() {

    wbTeardown();

    showScreen("games");
}

/* تغليف غير جراحي لـ showScreen — فوق التغليفات السابقة بلا تعديل عليها */

const originalShowScreenForWB = showScreen;

showScreen = function (screenId) {

    if (typeof wbGame !== "undefined" && wbGame.active && screenId !== "wordBuilderGame") {
        wbTeardown();
    }

    originalShowScreenForWB(screenId);
};

/* =========================================================
   🔚 نهاية لعبة "بنّاء الكلمات" المستقلة
   ========================================================= */








/* =========================================================================
   🆕 =====================================================================
   🌟 التطوير الجديد — تعلم مع أ/طه محمد 🌟
   الملف الشخصي | PWA | لوحة المعلم | المكافآت والشهادات |
   المهمة اليومية | الإعدادات
   =====================================================================
   ملاحظة: كل ما يلي إضافي بالكامل ولا يحذف أو يستبدل أي نظام موجود.
   نستخدم نفس نظام النجوم/المستوى/localStorage الحالي ونطوّر عليه فقط.
========================================================================= */

/* =========================================================
   ⚙️ الإعدادات (الصوت، الاهتزاز، الوضع الليلي، الوضع الهادئ)
========================================================= */

const Settings = (function () {

    const defaults = {
        sound: true,
        haptic: true,
        dark: false,
        calm: false
    };

    function loadFromStorage() {
        try {
            const saved = JSON.parse(
                localStorage.getItem("taha_settings") || "{}"
            );
            return Object.assign({}, defaults, saved);
        } catch (error) {
            return Object.assign({}, defaults);
        }
    }

    let current = loadFromStorage();

    function save() {
        localStorage.setItem(
            "taha_settings",
            JSON.stringify(current)
        );
    }

    function apply() {
        if (!document.body) return;
        document.body.classList.toggle("dark-mode", !!current.dark);
        document.body.classList.toggle("calm-mode", !!current.calm);
    }

    function get() {
        return current;
    }

    function set(key, value) {
        current[key] = value;
        save();
        apply();
    }

    return { get, set, apply };

})();

function updateSettingFromUI(key, value) {
    Settings.set(key, value);
    if (key === "sound" && !value) EduAudio.stop();
}

/* =========================================================
   📊 وحدة التحليلات (الصحيح/الخطأ، الحروف المتعلمة، الأرقام)
========================================================= */

const Analytics = (function () {

    function activeScreenId() {
        const el = document.querySelector(".screen.active");
        return el ? el.id : "home";
    }

    function getWrongTotal() {
        return Number(
            localStorage.getItem("taha_wrong_total") || 0
        );
    }

    function bumpWrongTotal() {
        const total = getWrongTotal() + 1;
        localStorage.setItem("taha_wrong_total", String(total));
        return total;
    }

    function getLetterAttempts() {
        try {
            return JSON.parse(
                localStorage.getItem("taha_letter_attempts") || "{}"
            );
        } catch (error) {
            return {};
        }
    }

    function saveLetterAttempts(data) {
        localStorage.setItem(
            "taha_letter_attempts",
            JSON.stringify(data)
        );
    }

    function markLetterAttempt(letter, correct) {
        const data = getLetterAttempts();

        if (!data[letter]) {
            data[letter] = { correct: 0, wrong: 0 };
        }

        if (correct) {
            data[letter].correct++;
        } else {
            data[letter].wrong++;
        }

        saveLetterAttempts(data);
    }

    function getLearnedLetters() {
        try {
            return JSON.parse(
                localStorage.getItem("taha_letters_learned") || "[]"
            );
        } catch (error) {
            return [];
        }
    }

    function markLetterLearned(letter) {
        const arr = getLearnedLetters();

        if (!arr.includes(letter)) {
            arr.push(letter);
            localStorage.setItem(
                "taha_letters_learned",
                JSON.stringify(arr)
            );
        }
    }

    function getLearnedNumbers() {
        try {
            return JSON.parse(
                localStorage.getItem("taha_numbers_learned") || "[]"
            );
        } catch (error) {
            return [];
        }
    }

    function markNumberLearned(num) {
        const arr = getLearnedNumbers();

        if (!arr.includes(num)) {
            arr.push(num);
            localStorage.setItem(
                "taha_numbers_learned",
                JSON.stringify(arr)
            );
        }
    }

    function recordCorrectEvent() {

        const screenId = activeScreenId();

        if (
            screenId === "letters" &&
            typeof letters !== "undefined" &&
            letters[currentLetterIndex]
        ) {
            const currentLetter = letters[currentLetterIndex].letter;
            markLetterAttempt(currentLetter, true);
            markLetterLearned(currentLetter);
        }

        if (
            Settings.get().haptic &&
            "vibrate" in navigator
        ) {
            try {
                navigator.vibrate(35);
            } catch (error) {}
        }

        checkBadges();
    }

    function recordWrongEvent() {

        bumpWrongTotal();

        const screenId = activeScreenId();

        if (
            screenId === "letters" &&
            typeof letters !== "undefined" &&
            letters[currentLetterIndex]
        ) {
            markLetterAttempt(
                letters[currentLetterIndex].letter,
                false
            );
        }
    }

    return {
        activeScreenId,
        getWrongTotal,
        getLetterAttempts,
        getLearnedLetters,
        getLearnedNumbers,
        markNumberLearned,
        recordCorrectEvent,
        recordWrongEvent
    };

})();

/* =========================================================
   🔍 مراقبة الإجابات الخاطئة تلقائيًا (بدون تعديل الألعاب)
========================================================= */

(function initWrongAnswerObserver() {

    const wrongPattern =
        /(?:^|\s)(wrong|balloon-wrong|matching-wrong)(?:\s|$)/;

    const observer = new MutationObserver(mutations => {

        mutations.forEach(mutation => {

            if (
                mutation.type !== "attributes" ||
                mutation.attributeName !== "class"
            ) return;

            const newClass =
                (mutation.target && mutation.target.className) || "";

            const oldClass = mutation.oldValue || "";

            if (
                wrongPattern.test(String(newClass)) &&
                !wrongPattern.test(String(oldClass))
            ) {
                Analytics.recordWrongEvent();
            }
        });
    });

    if (document.body) {
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["class"],
            attributeOldValue: true,
            subtree: true
        });
    }

})();

/* =========================================================
   ⏱️ متابعة وقت التعلم
========================================================= */

const TimeTracker = (function () {

    function todayKey() {
        return new Date().toISOString().slice(0, 10);
    }

    function getByDate() {
        try {
            return JSON.parse(
                localStorage.getItem("taha_time_by_date") || "{}"
            );
        } catch (error) {
            return {};
        }
    }

    function getTotal() {
        return Number(
            localStorage.getItem("taha_time_total_seconds") || 0
        );
    }

    function tick(seconds) {
        const byDate = getByDate();
        const key = todayKey();

        byDate[key] = (byDate[key] || 0) + seconds;

        localStorage.setItem(
            "taha_time_by_date",
            JSON.stringify(byDate)
        );

        localStorage.setItem(
            "taha_time_total_seconds",
            String(getTotal() + seconds)
        );
    }

    function getTodaySeconds() {
        return getByDate()[todayKey()] || 0;
    }

    return { tick, getTodaySeconds, getTotal };

})();

setInterval(() => {
    if (document.visibilityState === "visible") {
        TimeTracker.tick(15);
    }
}, 15000);

/* =========================================================
   🏅 الأوسمة والإنجازات
========================================================= */

const Badges = (function () {

    function getEarned() {
        try {
            return JSON.parse(
                localStorage.getItem("taha_badges") || "[]"
            );
        } catch (error) {
            return [];
        }
    }

    function isEarned(id) {
        return getEarned().includes(id);
    }

    function award(id) {
        const list = getEarned();

        if (!list.includes(id)) {
            list.push(id);
            localStorage.setItem(
                "taha_badges",
                JSON.stringify(list)
            );
            return true;
        }

        return false;
    }

    return { getEarned, isEarned, award };

})();

const LETTERS_TOTAL =
    (typeof letters !== "undefined" && letters.length) || 28;

const NUMBERS_TOTAL = 40;

const BADGE_DEFS = [
    {
        id: "first_star",
        emoji: "🌟",
        name: "أول نجمة",
        test: () => stars >= 1
    },
    {
        id: "stars_50",
        emoji: "⭐",
        name: "٥٠ نجمة",
        test: () => stars >= 50
    },
    {
        id: "stars_150",
        emoji: "✨",
        name: "١٥٠ نجمة",
        test: () => stars >= 150
    },
    {
        id: "stars_300",
        emoji: "💫",
        name: "٣٠٠ نجمة",
        test: () => stars >= 300
    },
    {
        id: "level_3",
        emoji: "🎯",
        name: "المستوى ٣",
        test: () => level >= 3
    },
    {
        id: "level_5",
        emoji: "🚀",
        name: "المستوى ٥",
        test: () => level >= 5
    },
    {
        id: "letters_champ",
        emoji: "🔤",
        name: "بطل الحروف",
        test: () => Analytics.getLearnedLetters().length >= LETTERS_TOTAL
    },
    {
        id: "numbers_champ",
        emoji: "🔢",
        name: "بطل الأرقام",
        test: () => Analytics.getLearnedNumbers().length >= NUMBERS_TOTAL
    },
    {
        id: "quest_5",
        emoji: "🗓️",
        name: "٥ مهام يومية",
        test: () =>
            Number(
                localStorage.getItem("taha_quests_completed_total") || 0
            ) >= 5
    },
    {
        id: "quest_20",
        emoji: "🏆",
        name: "٢٠ مهمة يومية",
        test: () =>
            Number(
                localStorage.getItem("taha_quests_completed_total") || 0
            ) >= 20
    }
];

function checkBadges() {

    let newlyEarned = false;

    BADGE_DEFS.forEach(def => {
        if (!Badges.isEarned(def.id) && def.test()) {
            if (Badges.award(def.id)) {
                newlyEarned = true;
            }
        }
    });

    return newlyEarned;
}

/* =========================================================
   🗓️ المهمة اليومية
========================================================= */

const DailyQuest = (function () {

    const TEMPLATES = [
        {
            id: "letters",
            label: "أجب بشكل صحيح في تحدي الحروف",
            emoji: "🔤",
            counterRef: () => correctLetters
        },
        {
            id: "words",
            label: "تدرّب على كلمات جديدة",
            emoji: "📖",
            counterRef: () => correctWords
        },
        {
            id: "numbers",
            label: "استكشف أرقامًا جديدة",
            emoji: "🔢",
            counterRef: () => correctNumbers
        },
        {
            id: "addition",
            label: "حل مسائل جمع",
            emoji: "➕",
            counterRef: () => correctAddition
        },
        {
            id: "subtraction",
            label: "حل مسائل طرح",
            emoji: "➖",
            counterRef: () => correctSubtraction
        },
        {
            id: "writing",
            label: "تدرّب على الكتابة",
            emoji: "✏️",
            counterRef: () =>
                Number(
                    localStorage.getItem("taha_correct_writing") || 0
                )
        }
    ];

    function todayKey() {
        return new Date().toISOString().slice(0, 10);
    }

    function load() {
        try {
            return JSON.parse(
                localStorage.getItem("taha_daily_quest") || "null"
            );
        } catch (error) {
            return null;
        }
    }

    function save(data) {
        localStorage.setItem(
            "taha_daily_quest",
            JSON.stringify(data)
        );
    }

    function seededRandom(seedStr) {

        let seed = 0;

        for (let i = 0; i < seedStr.length; i++) {
            seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
        }

        return function () {
            seed = (seed * 1103515245 + 12345) >>> 0;
            return (seed % 1000) / 1000;
        };
    }

    function generate() {

        const today = todayKey();
        const rand = seededRandom(today);

        const shuffled = [...TEMPLATES].sort(() => rand() - 0.5);
        const picked = shuffled.slice(0, 3);

        const targetBase =
            3 + Math.min(typeof level !== "undefined" ? level : 1, 6);

        const quests = picked.map(t => ({
            id: t.id,
            label: t.label,
            emoji: t.emoji,
            target: targetBase,
            baseline: t.counterRef(),
            reward: 10,
            doneAwarded: false
        }));

        const data = { date: today, quests };

        save(data);

        return data;
    }

    function getToday() {
        let data = load();

        if (!data || data.date !== todayKey()) {
            data = generate();
        }

        return data;
    }

    function checkProgress() {

        const data = getToday();

        const templateById = {};
        TEMPLATES.forEach(t => { templateById[t.id] = t; });

        let changed = false;

        data.quests.forEach(quest => {

            const template = templateById[quest.id];
            if (!template) return;

            const current = template.counterRef();
            const progress = Math.max(0, current - quest.baseline);

            if (progress >= quest.target && !quest.doneAwarded) {

                quest.doneAwarded = true;
                changed = true;

                addStars(quest.reward);

                const totalCompleted =
                    Number(
                        localStorage.getItem(
                            "taha_quests_completed_total"
                        ) || 0
                    ) + 1;

                localStorage.setItem(
                    "taha_quests_completed_total",
                    String(totalCompleted)
                );

                checkBadges();
            }
        });

        if (changed) save(data);

        return data;
    }

    return { getToday, checkProgress, TEMPLATES };

})();

/* =========================================================
   🛍️ متجر المكافآت (خلفيات، شخصيات، ملصقات)
========================================================= */

const STORE_ITEMS = [
    { id: "bg_ocean", type: "background", emoji: "🌊", name: "المحيط", cost: 20, cssClass: "theme-ocean" },
    { id: "bg_space", type: "background", emoji: "🌌", name: "الفضاء", cost: 30, cssClass: "theme-space" },
    { id: "bg_forest", type: "background", emoji: "🌳", name: "الغابة", cost: 30, cssClass: "theme-forest" },
    { id: "char_cat", type: "character", emoji: "🐱", name: "قطة", cost: 15 },
    { id: "char_bear", type: "character", emoji: "🐻", name: "دب", cost: 15 },
    { id: "char_bunny", type: "character", emoji: "🐰", name: "أرنب", cost: 15 },
    { id: "char_unicorn", type: "character", emoji: "🦄", name: "يونيكورن", cost: 40 },
    { id: "sticker_star", type: "sticker", emoji: "🌟", name: "ملصق نجمة", cost: 10 },
    { id: "sticker_heart", type: "sticker", emoji: "💖", name: "ملصق قلب", cost: 10 },
    { id: "sticker_rainbow", type: "sticker", emoji: "🌈", name: "ملصق قوس قزح", cost: 15 },
    { id: "sticker_trophy", type: "sticker", emoji: "🏆", name: "ملصق كأس", cost: 15 }
];

function getStoreOwned() {
    try {
        return JSON.parse(
            localStorage.getItem("taha_store_owned") || "[]"
        );
    } catch (error) {
        return [];
    }
}

function saveStoreOwned(arr) {
    localStorage.setItem("taha_store_owned", JSON.stringify(arr));
}

function getStoreEquipped() {
    try {
        return JSON.parse(
            localStorage.getItem("taha_store_equipped") || "{}"
        );
    } catch (error) {
        return {};
    }
}

function saveStoreEquipped(obj) {
    localStorage.setItem("taha_store_equipped", JSON.stringify(obj));
}

function buyStoreItem(id) {

    const item = STORE_ITEMS.find(i => i.id === id);
    if (!item) return;

    const owned = getStoreOwned();
    const msgEl = $("rewardsMsg");

    if (owned.includes(id)) {
        equipStoreItem(id);
        return;
    }

    if (stars < item.cost) {
        if (msgEl) {
            msgEl.textContent = "😊 تحتاج المزيد من النجوم لشراء هذا العنصر";
        }
        return;
    }

    addStars(-item.cost);

    owned.push(id);
    saveStoreOwned(owned);

    if (msgEl) {
        msgEl.textContent = "🎉 تم الشراء بنجاح!";
    }

    equipStoreItem(id);
    renderRewardsScreen();
}

function equipStoreItem(id) {

    const item = STORE_ITEMS.find(i => i.id === id);
    if (!item) return;

    const owned = getStoreOwned();
    if (!owned.includes(id)) return;

    const equipped = getStoreEquipped();

    if (item.type === "background") {

        equipped.background = id;

        document.body.className = document.body.className
            .split(" ")
            .filter(c => c && !c.startsWith("theme-"))
            .join(" ");

        if (item.cssClass) {
            document.body.classList.add(item.cssClass);
        }
    }

    if (item.type === "character") {
        equipped.character = id;
        applyProfileToHeader();
    }

    saveStoreEquipped(equipped);
    renderRewardsScreen();
}

function renderStoreGrid() {

    const grid = $("rewardsStoreGrid");
    if (!grid) return;

    const owned = getStoreOwned();
    const equipped = getStoreEquipped();

    grid.innerHTML = STORE_ITEMS.map(item => {

        const isOwned = owned.includes(item.id);

        const isEquipped =
            (item.type === "background" && equipped.background === item.id) ||
            (item.type === "character" && equipped.character === item.id);

        const classes = ["store-item"];
        if (isOwned) classes.push("owned");
        if (isEquipped) classes.push("equipped");

        let priceLabel;

        if (!isOwned) {
            priceLabel = "⭐ " + arabicNumber(item.cost);
        } else if (item.type === "sticker") {
            priceLabel = "✅ في حقيبتي";
        } else {
            priceLabel = isEquipped ? "✅ مُفعّل" : "👆 تفعيل";
        }

        return `
            <button class="${classes.join(" ")}" onclick="buyStoreItem('${item.id}')">
                <span class="store-emoji">${item.emoji}</span>
                <span>${item.name}</span>
                <span class="store-price">${priceLabel}</span>
            </button>
        `;
    }).join("");
}

/* =========================================================
   🏅 عرض شبكة الأوسمة
========================================================= */

function renderBadgesGrid() {

    const grid = $("rewardsBadgesGrid");
    if (!grid) return;

    const earned = Badges.getEarned();

    grid.innerHTML = BADGE_DEFS.map(def => {
        const isEarned = earned.includes(def.id);
        return `
            <div class="badge-item ${isEarned ? "earned" : ""}">
                <span class="badge-emoji">${def.emoji}</span>
                <span>${def.name}</span>
            </div>
        `;
    }).join("");
}

/* =========================================================
   📜 الشهادات
========================================================= */

function renderCertificatesGrid() {

    const grid = $("rewardsCertificatesGrid");
    if (!grid) return;

    const learnedLetters = Analytics.getLearnedLetters().length;
    const learnedNumbers = Analytics.getLearnedNumbers().length;

    const lettersUnlocked = learnedLetters >= LETTERS_TOTAL;
    const numbersUnlocked = learnedNumbers >= NUMBERS_TOTAL;

    grid.innerHTML = `
        <button class="certificate-card ${lettersUnlocked ? "unlocked" : ""}"
                onclick="${lettersUnlocked ? "openCertificate('letters')" : ""}">
            <div class="cert-icon">🔤</div>
            <div>شهادة الحروف</div>
            <small>${lettersUnlocked ? "مكتملة ✅" : arabicNumber(learnedLetters) + "/" + arabicNumber(LETTERS_TOTAL)}</small>
        </button>

        <button class="certificate-card ${numbersUnlocked ? "unlocked" : ""}"
                onclick="${numbersUnlocked ? "openCertificate('numbers')" : ""}">
            <div class="cert-icon">🔢</div>
            <div>شهادة الأرقام</div>
            <small>${numbersUnlocked ? "مكتملة ✅" : arabicNumber(learnedNumbers) + "/" + arabicNumber(NUMBERS_TOTAL)}</small>
        </button>
    `;
}

function openCertificate(type) {

    const name =
        localStorage.getItem("taha_child_name") || "بطل متميز";

    const nameEl = $("certChildName");
    const typeEl = $("certType");
    const dateEl = $("certDate");

    if (nameEl) nameEl.textContent = name;

    if (typeEl) {
        typeEl.textContent =
            type === "letters"
                ? "لإتمامه تعلم جميع الحروف العربية بنجاح 🔤"
                : "لإتمامه تعلم الأرقام بنجاح 🔢";
    }

    if (dateEl) {
        const now = new Date();
        dateEl.textContent =
            "بتاريخ: " + now.toLocaleDateString("ar-EG");
    }

    showScreen("certificateView");
}

function renderRewardsScreen() {
    updateStats();
    renderBadgesGrid();
    renderCertificatesGrid();
    renderStoreGrid();
}

/* =========================================================
   👤 الملف الشخصي
========================================================= */

const AVATAR_OPTIONS = [
    "🦁", "🐯", "🐱", "🐶", "🐰", "🐻",
    "🐼", "🦊", "🐵", "🦄", "🐸", "🐢",
    "🦋", "🐬", "🦉", "🐘"
];

function openProfileScreen() {
    showScreen("profile");
}

function renderProfileScreen() {

    const nameInput = $("profileNameInput");
    const grid = $("avatarGrid");

    const savedName = localStorage.getItem("taha_child_name") || "";
    const savedAvatar = localStorage.getItem("taha_child_avatar") || "🦁";

    if (nameInput) nameInput.value = savedName;

    if (grid) {
        grid.innerHTML = AVATAR_OPTIONS.map(emoji => `
            <button type="button"
                    class="avatar-option ${emoji === savedAvatar ? "selected" : ""}"
                    data-avatar="${emoji}"
                    onclick="selectAvatarOption(this)">
                ${emoji}
            </button>
        `).join("");
    }

    const msgEl = $("profileSaveMsg");
    if (msgEl) msgEl.textContent = "";

    renderProfileStudentCard();
}

/* =========================================================
   🆕 المرحلة الرابعة: بطاقة ملخّص الطالب — تُركَّب حيًّا من
   StudentData.getProfile() (نفس مصدر لوحة المعلم بالضبط)، بلا
   أي تخزين جديد وبلا أي نسبة أو مستوى إتقان مُخترَع
========================================================= */

function renderProfileStudentCard() {

    const profile = StudentData.getProfile();

    const avatarEl = $("profileCardAvatar");
    const nameEl = $("profileCardName");
    const idEl = $("profileCardId");

    if (avatarEl) avatarEl.textContent = profile.avatar || "🦁";
    if (nameEl) nameEl.textContent = profile.name || "لم يُحفظ اسم بعد";
    if (idEl) idEl.textContent = profile.studentId;

    if ($("profileCardStars")) {
        $("profileCardStars").textContent = arabicNumber(profile.stars);
    }
    if ($("profileCardLevel")) {
        $("profileCardLevel").textContent = arabicNumber(profile.level);
    }
    if ($("profileCardTimeToday")) {
        $("profileCardTimeToday").textContent =
            arabicNumber(Math.round(profile.timeTodaySeconds / 60)) + " دقيقة";
    }
    if ($("profileCardTimeTotal")) {
        $("profileCardTimeTotal").textContent =
            arabicNumber(Math.round(profile.timeTotalSeconds / 60)) + " دقيقة";
    }

    /* التقدّم الإجمالي — نفس البيانات الحقيقية المعروضة في لوحة
       المعلم بالضبط (عدد صحيح + مستوى مفتوح/مكتمل حيث يوجد) */
    const progressContainer = $("profileCardProgress");
    if (progressContainer) {
        progressContainer.innerHTML = `
            <div class="teacher-progress-row">
                <span>🔤 الحروف</span>
                <b>${arabicNumber(profile.counters.letters)}</b>
                <small class="teacher-progress-sub">مستوى مفتوح ${arabicNumber(profile.lettersEngine.unlockedLevel)}/٤ — حروف مكتملة ${arabicNumber(profile.lettersEngine.completedLetters.length)}/٢٨</small>
            </div>
            <div class="teacher-progress-row">
                <span>📖 الكلمات</span>
                <b>${arabicNumber(profile.counters.words)}</b>
                <small class="teacher-progress-sub">مستوى مفتوح ${arabicNumber(profile.unlockedLevels.words)}/٩</small>
            </div>
            <div class="teacher-progress-row">
                <span>🔢 الأرقام</span>
                <b>${arabicNumber(profile.counters.numbers)}</b>
                <small class="teacher-progress-sub">تم عرضها ${arabicNumber(profile.numbersLearned.length)}/٤٠</small>
            </div>
            <div class="teacher-progress-row">
                <span>➕ الجمع</span>
                <b>${arabicNumber(profile.counters.addition)}</b>
                <small class="teacher-progress-sub">مستوى مفتوح ${arabicNumber(profile.unlockedLevels.addition)}/١٠</small>
            </div>
            <div class="teacher-progress-row">
                <span>➖ الطرح</span>
                <b>${arabicNumber(profile.counters.subtraction)}</b>
                <small class="teacher-progress-sub">مستوى مفتوح ${arabicNumber(profile.unlockedLevels.subtraction)}/١٠</small>
            </div>
        `;
    }

    /* ملخّص المهارات المتدرَّب عليها — من سجل الأحداث بالكامل
       (كل الأوقات، وليس أسبوعًا محددًا كلوحة المعلم)؛ يظهر فقط
       إن وُجدت بيانات فعلية مسجَّلة منذ تفعيل السجل */
    const skillsContainer = $("profileCardSkills");
    if (skillsContainer) {

        const log = StudentData.loadEventLog();
        const skillEvents = log.filter(e =>
            (e.type === "activity_answer" || e.type === "activity_complete") && e.skill
        );

        if (skillEvents.length === 0) {
            skillsContainer.innerHTML =
                '<p class="teacher-empty-note">لا توجد بيانات كافية بعد 🙂</p>';
        } else {

            const skillsBySubject = {};
            skillEvents.forEach(e => {
                if (!skillsBySubject[e.subject]) skillsBySubject[e.subject] = new Set();
                skillsBySubject[e.subject].add(e.skill);
            });

            skillsContainer.innerHTML = Object.keys(skillsBySubject).map(subj => {
                const label = TEACHER_SUBJECT_LABELS[subj] || subj;
                return `<div class="weekly-summary-item"><span>${label}</span><b>${arabicNumber(skillsBySubject[subj].size)} مهارة</b></div>`;
            }).join("");
        }
    }
}

function selectAvatarOption(button) {
    document
        .querySelectorAll(".avatar-option")
        .forEach(btn => btn.classList.remove("selected"));

    button.classList.add("selected");
}

function saveProfile() {

    const nameInput = $("profileNameInput");
    const selected = document.querySelector(".avatar-option.selected");
    const msgEl = $("profileSaveMsg");

    const name = nameInput ? nameInput.value.trim() : "";
    const avatar = selected ? selected.dataset.avatar : "🦁";

    if (!name) {
        if (msgEl) msgEl.textContent = "😊 من فضلك اكتب اسمك أولًا";
        return;
    }

    localStorage.setItem("taha_child_name", name);
    localStorage.setItem("taha_child_avatar", avatar);

    applyProfileToHeader();

    if (msgEl) msgEl.textContent = "🎉 تم الحفظ بنجاح!";

    setTimeout(() => showScreen("home"), 900);
}

function applyProfileToHeader() {

    const name = localStorage.getItem("taha_child_name");
    const avatar = localStorage.getItem("taha_child_avatar") || "🦁";

    const nameEl = $("headerNameDisplay");
    const avatarEl = $("headerAvatarDisplay");

    if (nameEl) {
        nameEl.textContent = name ? name : "أهلًا بك!";
    }

    const equipped = getStoreEquipped();

    let equippedCharEmoji = null;

    if (equipped.character) {
        const charItem = STORE_ITEMS.find(i => i.id === equipped.character);
        if (charItem) equippedCharEmoji = charItem.emoji;
    }

    if (avatarEl) {
        avatarEl.textContent = equippedCharEmoji || avatar;
    }
}

/* =========================================================
   👨‍🏫 لوحة المعلم / ولي الأمر
========================================================= */

let teacherUnlockedSession = false;
let teacherMathAnswer = 0;

function generateTeacherMathQuestion() {
    const a = 2 + Math.floor(Math.random() * 8);
    const b = 2 + Math.floor(Math.random() * 8);
    teacherMathAnswer = a + b;
    return `${arabicNumber(a)} + ${arabicNumber(b)} = ؟`;
}

function renderTeacherLockOrContent() {

    const overlay = $("teacherLockOverlay");
    const content = $("teacherContent");

    if (!overlay || !content) return;

    if (teacherUnlockedSession) {
        overlay.style.display = "none";
        content.style.display = "block";
        renderTeacherStats();
        return;
    }

    overlay.style.display = "block";
    content.style.display = "none";

    const pin = localStorage.getItem("taha_teacher_pin");
    const questionEl = $("teacherLockQuestion");
    const msgEl = $("teacherLockMsg");
    const input = $("teacherLockAnswerInput");

    if (msgEl) msgEl.textContent = "";
    if (input) input.value = "";

    if (pin) {
        if (questionEl) questionEl.textContent = "🔢 أدخل الرمز السري (٤ أرقام)";
        if (input) input.setAttribute("maxlength", "4");
    } else {
        if (questionEl) questionEl.textContent = generateTeacherMathQuestion();
        if (input) input.removeAttribute("maxlength");
    }
}

function attemptTeacherUnlock() {

    const input = $("teacherLockAnswerInput");
    const msgEl = $("teacherLockMsg");

    if (!input) return;

    const pin = localStorage.getItem("taha_teacher_pin");
    const value = input.value.trim();

    let correct = false;

    if (pin) {
        correct = value === pin;
    } else {
        correct = Number(value) === teacherMathAnswer;
    }

    if (correct) {
        teacherUnlockedSession = true;
        renderTeacherLockOrContent();
    } else {
        if (msgEl) msgEl.textContent = "😊 حاول مرة أخرى";
        renderTeacherLockOrContent();
    }
}

function lockTeacherPanel() {
    teacherUnlockedSession = false;
    renderTeacherLockOrContent();
}

function setTeacherPin() {

    const input = $("teacherPinInputNew");
    const msgEl = $("teacherPinMsg");

    if (!input) return;

    const value = input.value.trim();

    if (!/^\d{4}$/.test(value)) {
        if (msgEl) msgEl.textContent = "من فضلك أدخل ٤ أرقام فقط";
        return;
    }

    localStorage.setItem("taha_teacher_pin", value);
    input.value = "";

    if (msgEl) msgEl.textContent = "✅ تم حفظ رمز الحماية";
}

function clearTeacherPin() {
    localStorage.removeItem("taha_teacher_pin");

    const msgEl = $("teacherPinMsg");
    if (msgEl) {
        msgEl.textContent =
            "تم إلغاء الرمز، سيتم استخدام سؤال حسابي بدلًا منه";
    }
}

function renderTeacherStats() {

    updateStats();

    /* 🆕 المرحلة الثانية: بيانات الطالب الموحّدة (هوية + تفاصيل تقدّم
       إضافية) — StudentData.getProfile() يُركِّب هذا حيًّا من نفس
       المفاتيح القديمة + مفاتيح محرك الحروف الجديد، دون أي تكرار */
    const profile = StudentData.getProfile();

    const identityAvatar = $("teacherStudentAvatar");
    const identityName = $("teacherStudentName");
    const identityId = $("teacherStudentId");

    if (identityAvatar) identityAvatar.textContent = profile.avatar || "🦁";
    if (identityName) {
        identityName.textContent = profile.name || "لم يُحفظ اسم بعد";
    }
    if (identityId) identityId.textContent = profile.studentId;

    const wrongTotal = Analytics.getWrongTotal();

    const correctSum =
        correctLetters +
        correctWords +
        correctNumbers +
        correctAddition +
        correctSubtraction;

    const totalAttempts = correctSum + wrongTotal;

    const accuracy =
        totalAttempts > 0
            ? Math.round((correctSum / totalAttempts) * 100)
            : 100;

    if ($("teacherWrong")) {
        $("teacherWrong").textContent = arabicNumber(wrongTotal);
    }

    if ($("teacherAccuracy")) {
        $("teacherAccuracy").textContent = "٪" + arabicNumber(accuracy);
    }

    const todayMinutes = Math.round(TimeTracker.getTodaySeconds() / 60);
    const totalMinutes = Math.round(TimeTracker.getTotal() / 60);

    if ($("teacherTimeToday")) {
        $("teacherTimeToday").textContent =
            arabicNumber(todayMinutes) + " دقيقة";
    }

    if ($("teacherTimeTotal")) {
        $("teacherTimeTotal").textContent =
            arabicNumber(totalMinutes) + " دقيقة";
    }

    if ($("teacherBadgesCount")) {
        $("teacherBadgesCount").textContent =
            arabicNumber(Badges.getEarned().length) + " وسام";
    }

    /* 🆕 تفاصيل إضافية تحت كل صف تقدّم — بيانات حقيقية موجودة فعلًا
       (مستوى مفتوح / عدد مكتمل)، وليست نسبًا مخترَعة */
    const lettersSub = $("teacherLettersSub");
    if (lettersSub) {
        lettersSub.textContent =
            "مستوى مفتوح " + arabicNumber(profile.lettersEngine.unlockedLevel) + "/٤" +
            " — حروف مكتملة " + arabicNumber(profile.lettersEngine.completedLetters.length) + "/٢٨";
    }

    const wordsSub = $("teacherWordsSub");
    if (wordsSub) {
        wordsSub.textContent = "مستوى مفتوح " + arabicNumber(profile.unlockedLevels.words) + "/٩";
    }

    const numbersSub = $("teacherNumbersSub");
    if (numbersSub) {
        numbersSub.textContent = "تم عرضها " + arabicNumber(profile.numbersLearned.length) + "/٤٠";
    }

    const additionSub = $("teacherAdditionSub");
    if (additionSub) {
        additionSub.textContent = "مستوى مفتوح " + arabicNumber(profile.unlockedLevels.addition) + "/١٠";
    }

    const subtractionSub = $("teacherSubtractionSub");
    if (subtractionSub) {
        subtractionSub.textContent = "مستوى مفتوح " + arabicNumber(profile.unlockedLevels.subtraction) + "/١٠";
    }

    renderTeacherWeeklySummary();
    renderTeacherRecentActivity();
    renderSkillsReview();
}

function renderSkillsReview() {

    const container = $("teacherSkillsReview");
    if (!container) return;

    /* 🆕 المرحلة الثانية: دمج مصدرين — محرك الحروف الجديد
       (taha_ltr2_adaptive، أدق لأنه لكل نشاط) يُفضَّل عند توفر
       بيانات كافية له، مع الحفاظ الكامل على النظام القديم
       (Analytics.getLetterAttempts) كاحتياط لأي حرف لا يملك
       بيانات جديدة كافية بعد — لا يُستبدل النظام القديم، يُستخدم
       كمصدر احتياطي فقط */
    const oldAttempts = Analytics.getLetterAttempts();

    let ltr2Adaptive = {};
    try {
        ltr2Adaptive = JSON.parse(localStorage.getItem("taha_ltr2_adaptive") || "{}");
    } catch (error) {
        ltr2Adaptive = {};
    }

    const allLetters = new Set([
        ...Object.keys(oldAttempts),
        ...Object.keys(ltr2Adaptive)
    ]);

    const rows = [...allLetters]
        .map(letter => {

            const ltr2 = ltr2Adaptive[letter];
            const ltr2Total = ltr2 ? (ltr2.correct + ltr2.wrong) : 0;

            if (ltr2Total >= 2) {
                return {
                    letter,
                    total: ltr2Total,
                    accuracy: ltr2.correct / ltr2Total,
                    source: "ltr2"
                };
            }

            const old = oldAttempts[letter];
            const oldTotal = old ? (old.correct + old.wrong) : 0;

            if (oldTotal >= 2) {
                return {
                    letter,
                    total: oldTotal,
                    accuracy: old.correct / oldTotal,
                    source: "old"
                };
            }

            return null;
        })
        .filter(r => r && r.accuracy < 0.7)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 6);

    if (rows.length === 0) {
        container.innerHTML =
            '<p class="teacher-empty-note">لا توجد مهارات تحتاج مراجعة حاليًا 🎉</p>';
        return;
    }

    container.innerHTML = rows.map(r => `
        <div class="skill-review-item">
            <b>${r.letter}</b>
            <span>${arabicNumber(Math.round(r.accuracy * 100))}٪ صحيح</span>
        </div>
    `).join("");
}

/* =========================================================
   🆕 المرحلة الثانية: ملخّص هذا الأسبوع (من taha_event_log
   وtaha_time_by_date فقط) — لا يظهر إلا بيانات حقيقية مسجَّلة
   فعلًا منذ تفعيل سجل الأحداث؛ بلا أي نسبة أو رقم مُخترَع
========================================================= */

function getTeacherEventsInLastDays(days) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    return StudentData.loadEventLog().filter(e => {
        const t = Date.parse(e.ts);
        return !isNaN(t) && t >= cutoff;
    });
}

const TEACHER_SUBJECT_LABELS = {
    letters: "🔤 الحروف",
    words: "📖 الكلمات",
    numbers: "🔢 الأرقام",
    addition: "➕ الجمع",
    subtraction: "➖ الطرح",
    writing: "✏️ الكتابة",
    quran: "📖 القرآن",
    hadith: "🕌 الحديث",
    duas: "🤲 الأدعية والأذكار"
};

function renderTeacherWeeklySummary() {

    const container = $("teacherWeeklySummary");
    if (!container) return;

    const weekEvents = getTeacherEventsInLastDays(7);
    const answerEvents = weekEvents.filter(e => e.type === "activity_answer");
    const completeEvents = weekEvents.filter(e => e.type === "activity_complete");
    const questEvents = weekEvents.filter(e => e.type === "quest_completed");

    let byDate = {};
    try {
        byDate = JSON.parse(localStorage.getItem("taha_time_by_date") || "{}");
    } catch (error) {
        byDate = {};
    }

    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let weeklySeconds = 0;

    Object.keys(byDate).forEach(dateKey => {
        const d = new Date(dateKey);
        if (!isNaN(d) && d >= cutoffDate) {
            weeklySeconds += byDate[dateKey];
        }
    });

    if (answerEvents.length === 0 && completeEvents.length === 0 && questEvents.length === 0 && weeklySeconds === 0) {
        container.innerHTML =
            '<p class="teacher-empty-note">لا توجد بيانات كافية بعد 🙂</p>';
        return;
    }

    const weeklyMinutes = Math.round(weeklySeconds / 60);
    const correctCount = answerEvents.filter(e => e.correct).length;
    const wrongCount = answerEvents.length - correctCount;
    const totalActivities = answerEvents.length + completeEvents.length;

    /* 🆕 المهارات تُجمَع من نوعي الحدث معًا (إجابة أو إكمال عرض
       محتوى) — كلاهما "تدرّب على مهارة" بمعنى حقيقي، فقط الصح/
       الخطأ يبقى محصورًا في أنشطة الإجابة التي تملك حكمًا فعليًا */
    const skillsBySubject = {};
    [...answerEvents, ...completeEvents].forEach(e => {
        if (!e.skill) return;
        if (!skillsBySubject[e.subject]) skillsBySubject[e.subject] = new Set();
        skillsBySubject[e.subject].add(e.skill);
    });

    let html = "";

    html += `<div class="weekly-summary-item"><span>⏱️ وقت التعلم</span><b>${arabicNumber(weeklyMinutes)} دقيقة</b></div>`;
    html += `<div class="weekly-summary-item"><span>📝 عدد الأنشطة</span><b>${arabicNumber(totalActivities)}</b></div>`;

    if (answerEvents.length > 0) {
        html += `<div class="weekly-summary-item"><span>✅ صحيح / ❌ خطأ</span><b>${arabicNumber(correctCount)} / ${arabicNumber(wrongCount)}</b></div>`;
    }

    Object.keys(skillsBySubject).forEach(subj => {
        const label = TEACHER_SUBJECT_LABELS[subj] || subj;
        html += `<div class="weekly-summary-item"><span>${label}</span><b>${arabicNumber(skillsBySubject[subj].size)} مهارة</b></div>`;
    });

    html += `<div class="weekly-summary-item"><span>🗓️ مهام يومية مكتملة</span><b>${arabicNumber(questEvents.length)}</b></div>`;

    container.innerHTML = html;

    const subjKeys = Object.keys(skillsBySubject);
    if (subjKeys.length > 0) {
        const noteText = subjKeys.map(subj => {
            const label = TEACHER_SUBJECT_LABELS[subj] || subj;
            return label + ": " + [...skillsBySubject[subj]].join("، ");
        }).join(" — ");

        container.innerHTML += `<p class="weekly-summary-note">${noteText}</p>`;
    }
}

/* =========================================================
   🆕 المرحلة الثانية: آخر الأنشطة (من taha_event_log فقط)
========================================================= */

function teacherFormatRelativeTime(isoString) {

    const t = Date.parse(isoString);
    if (isNaN(t)) return "";

    const diffMin = Math.round((Date.now() - t) / 60000);

    if (diffMin < 1) return "الآن";
    if (diffMin < 60) return "منذ " + arabicNumber(diffMin) + " د";

    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return "منذ " + arabicNumber(diffHours) + " س";

    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return "أمس";

    return "منذ " + arabicNumber(diffDays) + " يوم";
}

function renderTeacherRecentActivity() {

    const container = $("teacherRecentActivity");
    if (!container) return;

    const log = StudentData.loadEventLog();

    if (log.length === 0) {
        container.innerHTML =
            '<p class="teacher-empty-note">لا توجد بيانات كافية بعد 🙂</p>';
        return;
    }

    const recent = log.slice(-10).reverse();

    container.innerHTML = recent.map(e => {

        const icon = e.type === "quest_completed"
            ? "🗓️"
            : (TEACHER_SUBJECT_LABELS[e.subject] || "📌").split(" ")[0];

        const isQuest = e.type === "quest_completed";
        const isNeutralComplete = e.type === "activity_complete";

        const statusClass = isQuest
            ? "correct"
            : (isNeutralComplete ? "neutral" : (e.correct ? "correct" : "wrong"));

        const statusIcon = isQuest
            ? "🎉"
            : (isNeutralComplete ? "▫️" : (e.correct ? "✅" : "❌"));

        const subjectFull = (TEACHER_SUBJECT_LABELS[e.subject] || e.subject || "").replace(/^\S+\s/, "");

        const label = isQuest
            ? ("أكمل مهمة: " + (e.activity || e.skill || ""))
            : ((e.skill ? e.skill + " — " : "") + subjectFull);

        return `
            <div class="recent-activity-item ${statusClass}">
                <span class="ra-label">${icon} ${statusIcon} ${label}</span>
                <span class="ra-time">${teacherFormatRelativeTime(e.ts)}</span>
            </div>
        `;
    }).join("");
}

/* =========================================================
   🗓️ عرض شاشة المهمة اليومية
========================================================= */

function renderDailyQuestScreen() {

    const data = DailyQuest.checkProgress();

    const list = $("dailyQuestList");
    const dateEl = $("dailyQuestDate");
    const allDoneMsg = $("dailyQuestAllDoneMsg");

    if (dateEl) {
        dateEl.textContent =
            "مهام يوم: " + new Date().toLocaleDateString("ar-EG");
    }

    if (!list) return;

    const templateById = {};
    DailyQuest.TEMPLATES.forEach(t => { templateById[t.id] = t; });

    list.innerHTML = data.quests.map(q => {

        const template = templateById[q.id];
        const current = template ? template.counterRef() : 0;
        const progress = Math.min(q.target, Math.max(0, current - q.baseline));
        const percent = Math.round((progress / q.target) * 100);
        const isDone = progress >= q.target;

        return `
            <div class="quest-item ${isDone ? "done" : ""}">
                <div class="quest-item-top">
                    <span>${q.emoji} ${q.label}</span>
                    <span>${arabicNumber(progress)}/${arabicNumber(q.target)}</span>
                </div>
                <div class="quest-progress-bar">
                    <div class="quest-progress-fill" style="width:${percent}%"></div>
                </div>
                <div class="quest-reward">
                    ${isDone
                        ? "✅ تم! حصلت على ⭐ " + arabicNumber(q.reward)
                        : "🎁 المكافأة: ⭐ " + arabicNumber(q.reward)}
                </div>
            </div>
        `;
    }).join("");

    const allDone = data.quests.every(q => q.doneAwarded);

    if (allDoneMsg) {
        allDoneMsg.style.display = allDone ? "block" : "none";
    }
}

/* =========================================================
   ⚙️ عرض شاشة الإعدادات
========================================================= */

let deferredInstallPrompt = null;

function renderSettingsScreen() {

    const s = Settings.get();

    if ($("settingsSoundToggle")) $("settingsSoundToggle").checked = !!s.sound;
    if ($("settingsHapticToggle")) $("settingsHapticToggle").checked = !!s.haptic;
    if ($("settingsDarkToggle")) $("settingsDarkToggle").checked = !!s.dark;
    if ($("settingsCalmToggle")) $("settingsCalmToggle").checked = !!s.calm;

    const installBtn = $("settingsInstallBtn");
    if (installBtn) {
        installBtn.style.display = deferredInstallPrompt
            ? "inline-block"
            : "none";
    }
}

function triggerAppInstall() {

    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();

    deferredInstallPrompt.userChoice.finally(() => {
        deferredInstallPrompt = null;
        const installBtn = $("settingsInstallBtn");
        if (installBtn) installBtn.style.display = "none";
    });
}

window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;

    const installBtn = $("settingsInstallBtn");
    if (installBtn) installBtn.style.display = "inline-block";
});

/* =========================================================
   📲 تسجيل Service Worker لدعم العمل دون إنترنت والتثبيت
========================================================= */

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("service-worker.js")
            .catch(() => {});
    });
}

/* =========================================================
   🔗 دمج التطوير الجديد مع النظام الحالي (بدون كسر أي شيء)
========================================================= */

/* --- ربط شاشة (showScreen) بعرض الشاشات الجديدة --- */

const originalShowScreen = showScreen;

showScreen = function (screenId) {

    originalShowScreen(screenId);

    if (screenId === "teacher") {
        renderTeacherLockOrContent();
    }

    if (screenId === "rewards") {
        renderRewardsScreen();
    }

    if (screenId === "settings") {
        renderSettingsScreen();
    }

    if (screenId === "dailyQuest") {
        renderDailyQuestScreen();
    }

    if (screenId === "profile") {
        renderProfileScreen();
    }
};

/* --- ربط النجوم (addStars) بالتحليلات والمهمة اليومية والاهتزاز --- */

const originalAddStars = addStars;
let addStarsReentrant = false;

addStars = function (amount) {

    originalAddStars(amount);

    if (addStarsReentrant) return;

    addStarsReentrant = true;

    try {
        const amt = Number(amount) || 0;

        if (amt > 0) {
            Analytics.recordCorrectEvent();
        }

        DailyQuest.checkProgress();

    } finally {
        addStarsReentrant = false;
    }
};

/* --- ربط الصوت بإعداد تشغيل/إيقاف الصوت --- */

const originalSpeakFn = speak;

speak = function (text, options) {
    if (!Settings.get().sound) return;
    originalSpeakFn(text, options);
};

/* --- تفعيل عداد الكلمات المُتدرّب عليها --- */

const originalNextWord = nextWord;

nextWord = function () {
    originalNextWord();
    correctWords++;
    saveCounters();
    updateStats();
    DailyQuest.checkProgress();
};

/* --- تفعيل عداد الأرقام المُتدرّب عليها وتتبع الأرقام المتعلمة --- */

const originalNextNumber = nextNumber;

nextNumber = function () {
    originalNextNumber();
    correctNumbers++;
    saveCounters();
    updateStats();
    DailyQuest.checkProgress();
};

const originalRenderCurrentNumber = renderCurrentNumber;

renderCurrentNumber = function () {
    originalRenderCurrentNumber();
    Analytics.markNumberLearned(currentNumber);
};

/* --- تدريبات الكتابة تُحتسب للمهمة اليومية من wrCompleteActivity() --- */

/* --- احترام الوضع الهادئ عند عرض المؤثرات (Confetti) --- */

if (typeof createLetterRaceConfetti === "function") {

    const originalConfetti = createLetterRaceConfetti;

    createLetterRaceConfetti = function (...args) {
        if (Settings.get().calm) return;
        return originalConfetti.apply(this, args);
    };
}

/* =========================================================
   🚀 تهيئة التطوير الجديد عند تحميل الصفحة
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    Settings.apply();
    applyProfileToHeader();
    renderSettingsScreen();

    const equipped = getStoreEquipped();

    if (equipped.background) {
        const bgItem = STORE_ITEMS.find(i => i.id === equipped.background);
        if (bgItem && bgItem.cssClass) {
            document.body.classList.add(bgItem.cssClass);
        }
    }

    checkBadges();
    DailyQuest.checkProgress();

    if (!localStorage.getItem("taha_child_name")) {
        setTimeout(() => {
            openProfileScreen();
        }, 500);
    }
});

/* =========================================================
   🔚 نهاية قسم التطوير الجديد
========================================================= */


/* =========================================================================
   🆕 =====================================================================
   🧩 تطوير لعبة المطابقة — 4 أنماط جديدة فقط
   1) حرف ↔ حرف (أشكال الحرف حسب موضعه)
   2) حرف ↔ صورة (دائمًا أول حرف من اسم الصورة، بتنوع)
   3) صورة ↔ كلمة (أماكن من حولنا، قابلة للتوسعة بسهولة)
   4) شكل الحرف ↔ الكلمة (حسب الموضع الفعلي داخل كلمة حقيقية)
   =====================================================================
   ملاحظة: هذا القسم إضافي بالكامل. لا يحذف ولا يعدّل أي نمط أو دالة
   موجودة حاليًا في لعبة المطابقة. نعتمد أسلوب "التغليف" (wrapping)
   لإضافة الأنماط الجديدة دون لمس الأكواد الأصلية العاملة.
========================================================================= */

/* =========================================================
   🔤 مُنسّق عرض شكل الحرف مع الشرطة الرابطة (تطويل) لتوضيح
   اتجاه الاتصال بصريًا للطفل، مثل: "صـ" (أول) و "ـص" (آخر)
========================================================= */

function formatLetterFormGlyph(glyph, posKey) {

    if (!glyph) return "";

    if (posKey === "initial") return glyph + "ـ";
    if (posKey === "medial") return "ـ" + glyph + "ـ";
    if (posKey === "final") return "ـ" + glyph;

    return glyph; /* isolated: بلا شرطة */
}

/* =========================================================
   1️⃣ بناء أزواج "حرف ↔ حرف" (أشكال نفس الحرف)
   لكل حرف عربي: نطابق شكلين مختلفين لنفس الحرف
   (الأولوية لِـ "أول الكلمة" ↔ "آخر الكلمة"، وإلا "منفصل" ↔ "آخر الكلمة")
========================================================= */

function buildLetterFormFormPool() {

    const pool = [];

    letters.forEach((item, index) => {

        const forms = arabicLetterForms[item.letter];

        if (!forms) return;

        let posA = null;
        let posB = null;

        if (forms.initial && forms.final) {
            posA = "initial";
            posB = "final";
        } else if (forms.isolated && forms.final) {
            posA = "isolated";
            posB = "final";
        } else {
            return;
        }

        const glyphA = forms[posA];
        const glyphB = forms[posB];

        pool.push({
            id: "FF" + index,
            letter: item.letter,
            source: formatLetterFormGlyph(glyphA, posA),
            target: formatLetterFormGlyph(glyphB, posB),
            sourceSpeak:
                "حرف " + item.letter + " في " +
                (arabicFormPositionLabels[posA] || posA),
            targetSpeak:
                "حرف " + item.letter + " في " +
                (arabicFormPositionLabels[posB] || posB),
            sourceClass: "matching-form-face",
            targetClass: "matching-form-face"
        });
    });

    return pool;
}

/* =========================================================
   2️⃣ مجموعة صور غنية ومتنوعة لكل حرف (نمط حرف ↔ صورة)
   كل الكلمات تبدأ فعليًا بنفس الحرف المطلوب.
   يمكن إضافة كلمات/صور جديدة بسهولة داخل المصفوفات التالية.
========================================================= */

const matchingRichPicturesPool = {
    "أ": [
        { word: "أسد", emoji: "🦁" },
        { word: "أرنب", emoji: "🐰" },
        { word: "أذن", emoji: "👂" }
    ],
    "ب": [
        { word: "بطة", emoji: "🦆" },
        { word: "بيضة", emoji: "🥚" },
        { word: "باب", emoji: "🚪" }
    ],
    "ت": [
        { word: "تمساح", emoji: "🐊" },
        { word: "تفاح", emoji: "🍎" },
        { word: "تاج", emoji: "👑" }
    ],
    "ث": [
        { word: "ثعلب", emoji: "🦊" },
        { word: "ثلج", emoji: "❄️" }
    ],
    "ج": [
        { word: "جمل", emoji: "🐪" },
        { word: "جزر", emoji: "🥕" },
        { word: "جبل", emoji: "⛰️" }
    ],
    "ح": [
        { word: "حصان", emoji: "🐎" },
        { word: "حمامة", emoji: "🕊️" },
        { word: "حذاء", emoji: "👞" }
    ],
    "خ": [
        { word: "خروف", emoji: "🐑" },
        { word: "خيار", emoji: "🥒" },
        { word: "خيمة", emoji: "⛺" }
    ],
    "د": [
        { word: "دب", emoji: "🐻" },
        { word: "دجاجة", emoji: "🐔" },
        { word: "دراجة", emoji: "🚲" }
    ],
    "ذ": [
        { word: "ذرة", emoji: "🌽" },
        { word: "ذئب", emoji: "🐺" }
    ],
    "ر": [
        { word: "رمان", emoji: "🍎" },
        { word: "رجل", emoji: "👤" }
    ],
    "ز": [
        { word: "زرافة", emoji: "🦒" },
        { word: "زهرة", emoji: "🌸" }
    ],
    "س": [
        { word: "سمكة", emoji: "🐟" },
        { word: "سيارة", emoji: "🚗" },
        { word: "ساعة", emoji: "⏰" }
    ],
    "ش": [
        { word: "شمس", emoji: "☀️" },
        { word: "شجرة", emoji: "🌳" }
    ],
    "ص": [
        { word: "صقر", emoji: "🦅" },
        { word: "صندوق", emoji: "📦" }
    ],
    "ض": [
        { word: "ضفدع", emoji: "🐸" },
        { word: "ضوء", emoji: "💡" }
    ],
    "ط": [
        { word: "طائرة", emoji: "✈️" },
        { word: "طبق", emoji: "🍽️" }
    ],
    "ظ": [
        { word: "ظرف", emoji: "✉️" },
        { word: "ظبي", emoji: "🦌" }
    ],
    "ع": [
        { word: "عين", emoji: "👁️" },
        { word: "عصفور", emoji: "🐦" }
    ],
    "غ": [
        { word: "غيمة", emoji: "☁️" },
        { word: "غزال", emoji: "🦌" }
    ],
    "ف": [
        { word: "فيل", emoji: "🐘" },
        { word: "فراشة", emoji: "🦋" }
    ],
    "ق": [
        { word: "قمر", emoji: "🌙" },
        { word: "قطة", emoji: "🐱" }
    ],
    "ك": [
        { word: "كتاب", emoji: "📘" },
        { word: "كلب", emoji: "🐶" }
    ],
    "ل": [
        { word: "ليمون", emoji: "🍋" },
        { word: "لبن", emoji: "🥛" }
    ],
    "م": [
        { word: "موز", emoji: "🍌" },
        { word: "منزل", emoji: "🏠" }
    ],
    "ن": [
        { word: "نجم", emoji: "⭐" },
        { word: "نمر", emoji: "🐯" }
    ],
    "ه": [
        { word: "هلال", emoji: "🌙" },
        { word: "هدية", emoji: "🎁" }
    ],
    "و": [
        { word: "وردة", emoji: "🌹" }
    ],
    "ي": [
        { word: "يد", emoji: "✋" },
        { word: "يوسفي", emoji: "🍊" }
    ]
};

function buildObjectsLettersPool() {

    return letters.map((item, index) => {

        const candidates =
            matchingRichPicturesPool[item.letter] ||
            [{ word: item.word, emoji: item.emoji }];

        const pick =
            candidates[
                Math.floor(Math.random() * candidates.length)
            ];

        return {
            id: "OL" + index,
            source: item.letter,
            target: pick.emoji,
            sourceSpeak: letterWithFatha(item.letter),
            targetSpeak: pick.word,
            sourceClass: "matching-letter-face",
            targetClass: "matching-emoji-face"
        };
    });
}

/* =========================================================
   3️⃣ مجموعة "صورة ↔ كلمة": أماكن من حولنا
   لإضافة مكان/كلمة جديدة: أضف عنصرًا بنفس الشكل
   { word: "الكلمة الجديدة", emoji: "🔶" } في المصفوفة التالية.
========================================================= */

const matchingPlacesPool = [
    { word: "مدرسة", emoji: "🏫" },
    { word: "مسجد", emoji: "🕌" },
    { word: "مستشفى", emoji: "🏥" },
    { word: "بقالة", emoji: "🛒" },
    { word: "صيدلية", emoji: "💊" },
    { word: "حديقة", emoji: "🌳" },
    { word: "ملعب", emoji: "⚽" }

    /* لإضافة مكان جديد، أضف سطرًا هنا بنفس الشكل بالأعلى 👆 */
];

function buildPlacesWordsPool() {

    return matchingPlacesPool.map((item, index) => ({
        id: "PLW" + index,
        source: item.emoji,
        target: item.word,
        sourceSpeak: item.word,
        targetSpeak: item.word,
        sourceClass: "matching-emoji-face",
        targetClass: "matching-word-face"
    }));
}

/* =========================================================
   4️⃣ مجموعة "شكل الحرف ↔ الكلمة"
   كل عنصر: حرف + موضعه الفعلي داخل كلمة حقيقية + الكلمة نفسها.
   تم التحقق من صحة موضع كل حرف داخل كل كلمة (أول/وسط/آخر)
   حسب قواعد اتصال الحروف العربية الفعلية.
========================================================= */

const matchingLetterFormWordPool = [
    { letter: "ب", posKey: "initial", word: "بطة" },
    { letter: "ب", posKey: "medial", word: "سبع" },
    { letter: "ب", posKey: "final", word: "حليب" },

    { letter: "ت", posKey: "initial", word: "تفاح" },
    { letter: "ت", posKey: "medial", word: "كتاب" },
    { letter: "ت", posKey: "final", word: "بيت" },

    { letter: "س", posKey: "initial", word: "سمكة" },
    { letter: "س", posKey: "medial", word: "مسجد" },
    { letter: "س", posKey: "final", word: "جلس" },

    { letter: "ل", posKey: "initial", word: "ليمون" },
    { letter: "ل", posKey: "medial", word: "قلم" },
    { letter: "ل", posKey: "final", word: "جمل" },

    { letter: "م", posKey: "initial", word: "موز" },
    { letter: "م", posKey: "medial", word: "قمر" },
    { letter: "م", posKey: "final", word: "اسم" },

    { letter: "ف", posKey: "initial", word: "فيل" },
    { letter: "ف", posKey: "medial", word: "سفينة" },
    { letter: "ف", posKey: "final", word: "كيف" },

    { letter: "ن", posKey: "initial", word: "نجم" },
    { letter: "ن", posKey: "medial", word: "بنت" },
    { letter: "ن", posKey: "final", word: "لبن" },

    { letter: "أ", posKey: "isolated", word: "أسد" },
    { letter: "أ", posKey: "final", word: "لجأ" }

    /* لإضافة كلمة جديدة: تأكد من التحقق من موضع الحرف الفعلي
       داخل الكلمة قبل الإضافة (أول - وسط - آخر) */
];

function buildLetterFormWordPool() {

    return matchingLetterFormWordPool.map((item, index) => {

        const forms = arabicLetterForms[item.letter] || {};
        const glyph = forms[item.posKey] || item.letter;

        return {
            id: "LFW" + index,
            source: formatLetterFormGlyph(glyph, item.posKey),
            target: item.word,
            sourceSpeak: "حرف " + item.letter,
            targetSpeak: item.word,
            sourceClass: "matching-form-face",
            targetClass: "matching-word-face"
        };
    });
}

/* =========================================================
   🔗 دمج الأنماط الجديدة مع محرك المطابقة الحالي
   عبر تغليف الدوال (Wrapping) — بدون أي تعديل على الأصل
========================================================= */

const NEW_MATCHING_MODE_IDS = [
    "forms-forms",
    "objects-letters",
    "places-words",
    "letterform-word"
];

const originalGenerateMatchingPairs = generateMatchingPairs;

generateMatchingPairs = function (mode, count) {

    if (!NEW_MATCHING_MODE_IDS.includes(mode)) {
        return originalGenerateMatchingPairs(mode, count);
    }

    let pool = [];

    switch (mode) {

        case "forms-forms":
            pool = buildLetterFormFormPool();
            break;

        case "objects-letters":
            pool = buildObjectsLettersPool();
            break;

        case "places-words":
            pool = buildPlacesWordsPool();
            break;

        case "letterform-word":
            pool = buildLetterFormWordPool();
            break;
    }

    const chosen =
        shuffle(pool).slice(
            0,
            Math.min(count, pool.length)
        );

    return chosen.map(pair => ({
        ...pair,
        matched: false
    }));
};

const NEW_MATCHING_INSTRUCTIONS = {
    "forms-forms":
        "🎯 اربط شكل الحرف بشكله الآخر لنفس الحرف",
    "objects-letters":
        "🎯 اربط كل حرف بصورة تبدأ به",
    "places-words":
        "🎯 اربط كل مكان بصورته الصحيحة",
    "letterform-word":
        "🎯 اربط شكل الحرف بالكلمة التي يظهر فيها بهذا الشكل"
};

const originalSetMatchingInstructionLabel =
    setMatchingInstructionLabel;

setMatchingInstructionLabel = function (mode) {

    if (NEW_MATCHING_INSTRUCTIONS[mode]) {

        const label = $("matchingInstructionLabel");

        if (label) {
            label.textContent = NEW_MATCHING_INSTRUCTIONS[mode];
        }

        return;
    }

    originalSetMatchingInstructionLabel(mode);
};

/* --- إضافة data-mode على لوحة اللعب لتفعيل التصميم الكبير
       الخاص بالأنماط الأربعة الجديدة فقط (عبر CSS) --- */

const originalStartMatchingGame = startMatchingGame;

startMatchingGame = function (mode) {

    originalStartMatchingGame(mode);

    const board = $("matchingBoard");

    if (board) {
        board.setAttribute("data-mode", mode || "");
    }
};

/* =========================================================
   🔚 نهاية قسم تطوير لعبة المطابقة
========================================================= */


/* =========================================================
   🔊 دالتان محفوظتان (letterWithDamma / letterWithKasra)
   يعتمد عليهما قسم "الكلمات" (buildHarakaText) لعرض حركتي
   الضمة والكسرة هناك. أُبقيتا كما هما دون أي تعديل رغم إعادة
   بناء قسم الحروف بالكامل، حفاظًا على عمل قسم الكلمات.
========================================================= */

function letterWithDamma(letter) {
    const clean = removeArabicHarakat(letter);
    return clean + "ُ";
}

function letterWithKasra(letter) {
    const clean = removeArabicHarakat(letter);
    return clean + "ِ";
}



/* =========================================================================
   🆕 =====================================================================
   ➕🎓 تطوير قسم "الجمع" فقط — نظام مستويات متدرجة ومقفولة
   =====================================================================
   هذا القسم بالكامل إضافي ومعزول. لا يحذف أو يعدّل newAddition/
   checkAddition الأصليتين (يُعاد استخدامهما فعليًا داخل عدة مستويات
   عبر التغليف الآمن)، ولا يمس أي قسم آخر بالتطبيق (الطرح تحديدًا
   يشارك بعض الأصناف البصرية العامة مثل .count-items و .operation
   ولم تُمس إطلاقًا).
========================================================================= */

/* =========================================================
   📋 تعريف المستويات العشرة
========================================================= */

const ADDITION_LEVELS = [
    { id: 1, title: "جمع ضمن ٥", icon: "🍎", max: 5, mode: "choice-result" },
    { id: 2, title: "جمع ضمن ١٠", icon: "🔟", max: 10, mode: "digit-pad" },
    { id: 3, title: "جمع ضمن ٢٠", icon: "🔢", max: 20, mode: "digit-pad" },
    { id: 4, title: "العدد المفقود", icon: "❓", max: 10, mode: "missing-number" },
    { id: 5, title: "جمع أفقي", icon: "➡️", max: 20, mode: "digit-pad" },
    { id: 6, title: "جمع رأسي", icon: "⬇️", max: 20, mode: "vertical" },
    { id: 7, title: "جمع بالصور", icon: "🖼️", max: 10, mode: "picture-choice" },
    { id: 8, title: "مسائل متنوعة", icon: "📖", max: 15, mode: "word-problem" },
    { id: 9, title: "جمع ضمن ٥٠", icon: "5️⃣0️⃣", max: 50, mode: "digit-pad" },
    { id: 10, title: "جمع ضمن ١٠٠", icon: "💯", max: 100, mode: "digit-pad" }
];

const ADDITION_PICTURE_EMOJIS = [
    "🍎", "⭐", "🎈", "🌸", "🐟", "🍬", "🧸", "🍇"
];

const ADDITION_WORD_PROBLEM_TEMPLATES = [
    {
        emoji: "🍎",
        text: (a, b) =>
            `عند أحمد ${arabicNumber(a)} تفاحات، وأعطته أمه ${arabicNumber(b)} تفاحات أخرى. كم تفاحة أصبحت معه؟`
    },
    {
        emoji: "🐦",
        text: (a, b) =>
            `في الحديقة ${arabicNumber(a)} عصفور، وجاء ${arabicNumber(b)} عصفور آخر. كم عصفورًا في الحديقة الآن؟`
    },
    {
        emoji: "🎈",
        text: (a, b) =>
            `مع سارة ${arabicNumber(a)} بالونات، واشترت ${arabicNumber(b)} بالونات جديدة. كم بالونة أصبح معها؟`
    },
    {
        emoji: "📘",
        text: (a, b) =>
            `عند البائع ${arabicNumber(a)} كتب، وأحضر ${arabicNumber(b)} كتب أخرى. كم كتابًا أصبح عنده؟`
    },
    {
        emoji: "🐟",
        text: (a, b) =>
            `في الحوض ${arabicNumber(a)} سمكة، وأضاف خالد ${arabicNumber(b)} سمكات. كم سمكة في الحوض الآن؟`
    }
];

/* =========================================================
   💾 حفظ التقدم وفتح المستويات (localStorage معزول)
========================================================= */

function loadAdditionUnlockedLevel() {
    return Number(
        localStorage.getItem("taha_addition_unlocked_level") || 1
    );
}

function saveAdditionUnlockedLevel(n) {
    localStorage.setItem("taha_addition_unlocked_level", String(n));
}

function unlockAdditionLevel(n) {
    if (n > loadAdditionUnlockedLevel() && n - 1 <= loadAdditionUnlockedLevel()) {
        saveAdditionUnlockedLevel(n);
    }
}

function loadAdditionLevelBest() {
    try {
        return JSON.parse(
            localStorage.getItem("taha_addition_level_best") || "{}"
        );
    } catch (error) {
        return {};
    }
}

function saveAdditionLevelBest(levelId, score) {
    const data = loadAdditionLevelBest();

    if (!data[levelId] || score > data[levelId]) {
        data[levelId] = score;
        localStorage.setItem(
            "taha_addition_level_best",
            JSON.stringify(data)
        );
    }
}

/* =========================================================
   🎲 توليد مهام كل مستوى (تكرار ذكي: تجنّب نفس السؤال مرتين
   على التوالي)
========================================================= */

function generateAdditionPairForLevel(level) {

    const max = Math.max(level.max, 2);

    const a = 1 + Math.floor(Math.random() * (max - 1));
    const remaining = Math.max(max - a, 1);
    const b = 1 + Math.floor(Math.random() * remaining);

    return { a, b };
}

function buildAdditionChoices(correctValue, max) {

    const choices = new Set([correctValue]);
    let guard = 0;

    while (choices.size < 3 && guard < 30) {

        guard++;

        const delta =
            (Math.floor(Math.random() * 4) + 1) *
            (Math.random() < 0.5 ? -1 : 1);

        let candidate = correctValue + delta;

        if (candidate < 0) candidate = correctValue + Math.abs(delta);
        if (candidate < 0) candidate = correctValue + 1;

        choices.add(candidate);
    }

    let filler = correctValue + 1;

    while (choices.size < 3) {
        choices.add(filler);
        filler++;
    }

    return shuffle([...choices]);
}

function pickAdditionWordProblem(a, b) {
    const template =
        ADDITION_WORD_PROBLEM_TEMPLATES[
            Math.floor(Math.random() * ADDITION_WORD_PROBLEM_TEMPLATES.length)
        ];

    return {
        emoji: template.emoji,
        text: template.text(a, b)
    };
}

function buildAdditionTaskObject(level, a, b) {

    const correct = a + b;
    const task = { a, b, correct };

    if (level.mode === "choice-result") {
        task.choices = buildAdditionChoices(correct, level.max);
    }

    if (level.mode === "picture-choice") {
        task.choices = buildAdditionChoices(correct, level.max);
        task.emoji =
            ADDITION_PICTURE_EMOJIS[
                Math.floor(Math.random() * ADDITION_PICTURE_EMOJIS.length)
            ];
    }

    if (level.mode === "missing-number") {
        task.missingSide = Math.random() < 0.5 ? "a" : "b";
        const missingValue = task.missingSide === "a" ? a : b;
        task.choices = buildAdditionChoices(missingValue, level.max);
    }

    if (level.mode === "word-problem") {
        const problem = pickAdditionWordProblem(a, b);
        task.story = problem.text;
        task.storyEmoji = problem.emoji;
        task.choices = buildAdditionChoices(correct, level.max);
    }

    return task;
}

function generateAdditionTasksForLevel(level) {

    const tasks = [];
    let lastPair = null;

    for (let i = 0; i < 10; i++) {

        let pair;
        let attempts = 0;

        do {
            pair = generateAdditionPairForLevel(level);
            attempts++;
        } while (
            lastPair &&
            pair.a === lastPair.a &&
            pair.b === lastPair.b &&
            attempts < 8
        );

        lastPair = pair;
        tasks.push(buildAdditionTaskObject(level, pair.a, pair.b));
    }

    return tasks;
}

/* =========================================================
   🧮 حالة الجلسة الحالية للمستوى
========================================================= */

let additionLevelModeActive = false;

let additionLevelState = {
    levelId: 1,
    taskIndex: 0,
    correctCount: 0,
    currentTask: null,
    tasks: []
};

/* =========================================================
   🏠 شبكة اختيار المستويات
========================================================= */

function renderAdditionLevelsHub() {

    const grid = $("additionLevelsGrid");

    if (!grid) return;

    const unlocked = StudentStore.eff(loadAdditionUnlockedLevel());
    const bestScores = loadAdditionLevelBest();

    grid.innerHTML = ADDITION_LEVELS.map(level => {

        const isUnlocked = level.id <= unlocked;
        const isCompleted = (bestScores[level.id] || 0) >= 8;

        const classes = ["addition-level-card-btn"];
        if (!isUnlocked) classes.push("locked");
        if (isCompleted) classes.push("completed");

        const lockIcon = isCompleted ? "✅" : (isUnlocked ? "🔓" : "🔒");

        const bestText = bestScores[level.id]
            ? `أفضل نتيجة: ${arabicNumber(bestScores[level.id])}/١٠`
            : "";

        return `
            <button
                class="${classes.join(" ")}"
                type="button"
                ${isUnlocked
                    ? `onclick="openAdditionLevel(${level.id})"`
                    : `onclick="showAdditionLockedMessage()"`}
            >
                <span class="addition-level-lock-icon">${lockIcon}</span>
                <span class="addition-level-icon">${level.icon}</span>
                <span class="addition-level-name">
                    ${arabicNumber(level.id)}. ${level.title}
                </span>
                ${bestText ? `<span class="addition-level-best">${bestText}</span>` : ""}
            </button>
        `;
    }).join("");
}

function showAdditionLockedMessage() {
    speakEducational(
        "أكمل المستوى السابق أولًا لتفتح هذا المستوى",
        { rate: 0.85 }
    );
}

/* =========================================================
   🚪 التنقل: فتح مستوى / الرجوع للمستويات
========================================================= */

function openAdditionLevel(levelId) {

    const unlocked = StudentStore.eff(loadAdditionUnlockedLevel());

    if (levelId > unlocked) {
        showAdditionLockedMessage();
        return;
    }

    const level = ADDITION_LEVELS[levelId - 1];

    if (!level) return;

    additionLevelModeActive = true;

    additionLevelState = {
        levelId,
        taskIndex: 0,
        correctCount: 0,
        currentTask: null,
        tasks: generateAdditionTasksForLevel(level)
    };

    const hub = $("additionLevelsHub");
    const levelCard = $("additionLevelCard");
    const titleEl = $("additionLevelTitle");

    if (hub) hub.style.display = "none";
    if (levelCard) levelCard.style.display = "block";

    if (titleEl) {
        titleEl.textContent = `${level.icon} ${level.title}`;
    }

    renderCurrentAdditionTask();
}

function backToAdditionLevels() {

    additionLevelModeActive = false;

    if (additionTimer) {
        clearTimeout(additionTimer);
        additionTimer = null;
    }

    stopAllAudio();

    const hub = $("additionLevelsHub");
    const levelCard = $("additionLevelCard");

    if (levelCard) levelCard.style.display = "none";
    if (hub) hub.style.display = "block";

    renderAdditionLevelsHub();
}

/* =========================================================
   📊 عرض التقدم والنتيجة الحالية
========================================================= */

function updateAdditionScoreLabel() {

    const scoreEl = $("additionScoreLabel");

    if (scoreEl) {
        scoreEl.textContent =
            `✅ ${arabicNumber(additionLevelState.correctCount)} / ١٠`;
    }
}

function updateAdditionProgressUI() {

    const label = $("additionProgressLabel");
    const fill = $("additionProgressFill");

    const humanPos = additionLevelState.taskIndex + 1;

    if (label) {
        label.textContent =
            `المهمة ${arabicNumber(humanPos)} من ١٠`;
    }

    if (fill) {
        fill.style.width = ((humanPos / 10) * 100) + "%";
    }

    updateAdditionScoreLabel();
}

/* =========================================================
   🎛️ لوحة الأرقام (Digit Pad) — إدخال محدد ومتوقّع
========================================================= */

function setupAdditionDigitPad() {

    const pad = $("additionDigitPad");

    if (!pad) return;

    pad.innerHTML = "";

    const order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

    order.forEach(d => {

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "addition-digit-btn";
        btn.textContent = arabicNumber(d);

        btn.onclick = () => appendAdditionDigit(d);

        pad.appendChild(btn);
    });

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "addition-digit-btn addition-digit-clear";
    clearBtn.textContent = "⌫";
    clearBtn.onclick = clearAdditionDigit;

    pad.appendChild(clearBtn);
}

function appendAdditionDigit(d) {

    const input = $("addAnswer");

    if (!input) return;

    const current = input.value || "";

    if (current.length >= 3) return;

    input.value = current + String(d);
}

function clearAdditionDigit() {

    const input = $("addAnswer");

    if (!input) return;

    input.value = input.value.slice(0, -1);
}

/* =========================================================
   🖼️ قوالب عرض المهام المختلفة (Activity Templates)
========================================================= */

function renderAdditionChoiceButtons(grid, choices, correctValue, onResult) {

    grid.innerHTML = "";

    choices.forEach(value => {

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "addition-choice-btn";
        btn.textContent = arabicNumber(value);

        btn.onclick = () => {
            onResult(value === correctValue, btn);
        };

        grid.appendChild(btn);
    });
}

function renderLegacyAdditionDisplay(level, task) {

    const question = $("addQuestion");
    const pictures = $("addPictures");
    const answer = $("addAnswer");

    if (answer) answer.value = "";
    if (pictures) pictures.textContent = "";

    if (level.mode === "vertical") {

        if (question) {
            question.innerHTML = `
                <div class="addition-vertical-box">
                    <div class="addition-vertical-row">${arabicNumber(task.a)}</div>
                    <div class="addition-vertical-row addition-vertical-plus">${arabicNumber(task.b)}</div>
                    <div class="addition-vertical-line"></div>
                </div>
            `;
        }

    } else {

        if (question) {
            question.textContent =
                `${arabicNumber(task.a)} + ${arabicNumber(task.b)} = ؟`;
        }
    }
}

function renderPictureChoiceTask(stage, task) {

    stage.innerHTML = `
        <div class="addition-picture-groups">
            <div class="addition-picture-group">${task.emoji.repeat(task.a)}</div>
            <div class="addition-plus-sign">+</div>
            <div class="addition-picture-group">${task.emoji.repeat(task.b)}</div>
        </div>
        <div class="addition-level-title" style="font-size:18px;">
            كم المجموع؟
        </div>
        <div class="addition-choice-grid" id="additionChoiceGrid"></div>
    `;

    renderAdditionChoiceButtons(
        stage.querySelector("#additionChoiceGrid"),
        task.choices,
        task.correct,
        finishAdditionChoiceTask
    );
}

function renderMissingNumberTask(stage, task) {

    const displayA = task.missingSide === "a" ? "؟" : arabicNumber(task.a);
    const displayB = task.missingSide === "b" ? "؟" : arabicNumber(task.b);

    stage.innerHTML = `
        <div class="operation">${displayA} + ${displayB} = ${arabicNumber(task.correct)}</div>
        <div class="addition-level-title" style="font-size:18px;">
            ما هو العدد المفقود؟
        </div>
        <div class="addition-choice-grid" id="additionChoiceGrid"></div>
    `;

    const missingValue = task.missingSide === "a" ? task.a : task.b;

    renderAdditionChoiceButtons(
        stage.querySelector("#additionChoiceGrid"),
        task.choices,
        missingValue,
        finishAdditionChoiceTask
    );
}

function renderWordProblemTask(stage, task) {

    stage.innerHTML = `
        <div class="addition-word-problem-box">
            <span class="addition-word-problem-emoji">${task.storyEmoji || "📖"}</span>
            ${task.story}
        </div>
        <div class="addition-choice-grid" id="additionChoiceGrid"></div>
    `;

    renderAdditionChoiceButtons(
        stage.querySelector("#additionChoiceGrid"),
        task.choices,
        task.correct,
        finishAdditionChoiceTask
    );
}

function renderChoiceResultTask(stage, task) {

    stage.innerHTML = `
        <div class="operation">${arabicNumber(task.a)} + ${arabicNumber(task.b)} = ؟</div>
        <div class="addition-choice-grid" id="additionChoiceGrid"></div>
    `;

    renderAdditionChoiceButtons(
        stage.querySelector("#additionChoiceGrid"),
        task.choices,
        task.correct,
        finishAdditionChoiceTask
    );
}

/* =========================================================
   🚦 موزّع عرض المهمة الحالية
========================================================= */

function renderCurrentAdditionTask() {

    const level = ADDITION_LEVELS[additionLevelState.levelId - 1];
    const task = additionLevelState.tasks[additionLevelState.taskIndex];

    additionLevelState.currentTask = task;

    updateAdditionProgressUI();

    const legacyWrapper = $("additionFreePlayLegacy");
    const stage = $("additionTaskStage");
    const messageEl = $("addMessage");

    if (messageEl) {
        messageEl.textContent = "";
        messageEl.className = "message";
    }

    if (level.mode === "digit-pad" || level.mode === "vertical") {

        if (stage) stage.style.display = "none";
        if (legacyWrapper) legacyWrapper.style.display = "block";

        currentAddA = task.a;
        currentAddB = task.b;

        renderLegacyAdditionDisplay(level, task);
        setupAdditionDigitPad();

    } else {

        if (legacyWrapper) legacyWrapper.style.display = "none";
        if (stage) stage.style.display = "block";

        if (level.mode === "picture-choice") {
            renderPictureChoiceTask(stage, task);
        } else if (level.mode === "missing-number") {
            renderMissingNumberTask(stage, task);
        } else if (level.mode === "word-problem") {
            renderWordProblemTask(stage, task);
        } else {
            renderChoiceResultTask(stage, task);
        }
    }

    speakCurrentAdditionTask();
}

function speakCurrentAdditionTask() {

    const level = ADDITION_LEVELS[additionLevelState.levelId - 1];
    const task = additionLevelState.currentTask;

    if (!task) return;

    if (level.mode === "missing-number") {
        speakEducational("ما هو العدد المفقود؟", { rate: 0.8 });
    } else if (level.mode === "word-problem") {
        speakEducational(task.story, { rate: 0.78 });
    } else if (level.mode === "picture-choice") {
        speakEducational("كم مجموع هذه الصور؟", { rate: 0.8 });
    } else {
        speakEducational(
            `${task.a} زائد ${task.b} يساوي كم؟`,
            { rate: 0.8 }
        );
    }
}

function retryCurrentAdditionTask() {

    const level = ADDITION_LEVELS[additionLevelState.levelId - 1];

    if (!level) return;

    const pair = generateAdditionPairForLevel(level);
    const task = buildAdditionTaskObject(level, pair.a, pair.b);

    additionLevelState.tasks[additionLevelState.taskIndex] = task;

    renderCurrentAdditionTask();
}

/* =========================================================
   🏆 معالج نتيجة المهام القائمة على الاختيار (غير محرك
   الجمع/الطرح النصي — يستخدم نفس نظام النجوم والتقدم بالضبط)
========================================================= */

function finishAdditionChoiceTask(isCorrect, button) {

    const messageEl = $("addMessage");

    if (isCorrect) {

        if (button) button.classList.add("correct");

        correctAddition++;
        saveCounters();
        addStars(5);

        if (messageEl) {
            messageEl.textContent = "🎉 أحسنت! إجابة صحيحة ⭐";
            messageEl.className = "message correct";
        }

        speakEducational("أحسنت! إجابة صحيحة", { rate: 0.8 });

        document
            .querySelectorAll("#additionTaskStage .addition-choice-btn")
            .forEach(btn => { btn.disabled = true; });

        onAdditionLevelTaskCorrect();

        setTimeout(() => {
            advanceAdditionLevelTask();
        }, 1200);

    } else {

        if (button) button.classList.add("wrong");

        if (messageEl) {
            messageEl.textContent = "😊 حاول مرة أخرى";
            messageEl.className = "message wrong";
        }

        speakEducational("حاول مرة أخرى", { rate: 0.8 });
    }
}

function onAdditionLevelTaskCorrect() {
    additionLevelState.correctCount++;
    updateAdditionScoreLabel();
}

/* =========================================================
   🔗 دمج آمن مع newAddition / checkAddition الأصليتين
   (تغليف فقط، بدون أي تعديل لمنطقهما الأصلي — تُستخدمان فعليًا
   في مستويات: ضمن ١٠/٢٠/٥٠/١٠٠، الأفقي، والرأسي)
========================================================= */

const originalNewAdditionForLevels = newAddition;

newAddition = function () {

    if (additionLevelModeActive) {
        advanceAdditionLevelTask();
    } else {
        originalNewAdditionForLevels();
    }
};

const originalCheckAdditionForLevels = checkAddition;

checkAddition = function () {

    if (!additionLevelModeActive) {
        originalCheckAdditionForLevels();
        return;
    }

    const answerEl = $("addAnswer");

    const answer = parseNumber(
        answerEl ? answerEl.value : ""
    );

    const correct = currentAddA + currentAddB;

    const wasAnswered = Number.isFinite(answer);

    originalCheckAdditionForLevels();

    if (wasAnswered) {

        if (answer === correct) {
            onAdditionLevelTaskCorrect();
        }
        /* في حال الخطأ: لا عقوبة، الرسالة والصوت تمت معالجتهما
           بالفعل داخل الدالة الأصلية — الطفل يعيد المحاولة بنفس
           السؤال كما في السلوك الأصلي تمامًا */
    }
};

function advanceAdditionLevelTask() {

    additionLevelState.taskIndex++;

    if (additionLevelState.taskIndex >= 10) {
        finishAdditionLevel();
        return;
    }

    renderCurrentAdditionTask();
}

/* =========================================================
   🎉 إنهاء المستوى: فتح التالي عند ٨/١٠ فأكثر
========================================================= */

function finishAdditionLevel() {

    const level = ADDITION_LEVELS[additionLevelState.levelId - 1];
    const score = additionLevelState.correctCount;
    const passed = score >= 8;

    additionLevelModeActive = false;

    saveAdditionLevelBest(level.id, score);

    if (passed) {
        addStars(10);
        unlockAdditionLevel(level.id + 1);
    }

    renderAdditionLevelResultScreen(level, score, passed);
}

function renderAdditionLevelResultScreen(level, score, passed) {

    const legacyWrapper = $("additionFreePlayLegacy");
    const stage = $("additionTaskStage");
    const messageEl = $("addMessage");

    if (legacyWrapper) legacyWrapper.style.display = "none";

    if (messageEl) {
        messageEl.textContent = "";
        messageEl.className = "message";
    }

    const nextLevel = ADDITION_LEVELS[level.id];

    if (stage) {

        stage.style.display = "block";

        stage.innerHTML = `
            <div class="addition-level-result-card">

                <div class="addition-level-result-emoji">
                    ${passed ? "🏆" : "🌟"}
                </div>

                <div class="addition-level-result-title">
                    ${passed ? "أحسنت! أكملت المستوى بنجاح" : "محاولة رائعة!"}
                </div>

                <div class="addition-level-result-score">
                    النتيجة: ${arabicNumber(score)} / ١٠
                </div>

                ${passed && nextLevel ? `
                    <button class="success" type="button" onclick="openAdditionLevel(${nextLevel.id})">
                        ➡️ المستوى التالي: ${nextLevel.title}
                    </button>
                ` : ""}

                ${!passed ? `
                    <button class="success" type="button" onclick="openAdditionLevel(${level.id})">
                        🔁 إعادة المحاولة
                    </button>
                ` : ""}

                <button class="secondary" type="button" onclick="backToAdditionLevels()">
                    🏠 كل المستويات
                </button>

            </div>
        `;
    }

    updateAdditionProgressUI();

    speakEducational(
        passed
            ? "أحسنت! أكملت المستوى بنجاح"
            : "محاولة رائعة، لنحاول مرة أخرى",
        { rate: 0.8 }
    );
}

/* =========================================================
   🚪 نقطة الدخول: عرض شبكة المستويات دائمًا أولًا عند الدخول
   لقسم الجمع (تغليف إضافي فوق showScreen الحالية بدون
   المساس بمنطقها أو بأي قسم آخر تتعامل معه)
========================================================= */

const showScreenBeforeAdditionEngine = showScreen;

showScreen = function (screenId) {

    if (screenId === "addition") {
        /* نُصفّر الحالة قبل تشغيل السلسلة الأصلية حتى لا يتسبب
           استدعاء newAddition() الداخلي القديم (ضمن showScreen
           الأصلية) في أي تعارض؛ سيمر بأمان إلى النسخة الحرة
           المخفية أصلًا خلف شبكة المستويات */
        additionLevelModeActive = false;
    }

    showScreenBeforeAdditionEngine(screenId);

    if (screenId === "addition") {

        if (additionTimer) {
            clearTimeout(additionTimer);
            additionTimer = null;
        }

        const hub = $("additionLevelsHub");
        const levelCard = $("additionLevelCard");

        if (levelCard) levelCard.style.display = "none";
        if (hub) hub.style.display = "block";

        renderAdditionLevelsHub();
    }
};

/* تهيئة أولية بعد تحميل الصفحة */

document.addEventListener("DOMContentLoaded", () => {
    if ($("additionLevelsGrid")) {
        renderAdditionLevelsHub();
    }
});

/* =========================================================
   🔚 نهاية قسم تطوير "الجمع" الجديد بالكامل
========================================================= */


/* =========================================================================
   🆕 =====================================================================
   ➖🎓 تطوير قسم "الطرح" فقط — نظام مستويات متدرجة ومقفولة
   يعتمد منهج CPA (محسوس ← بصري ← مجرد) ومبادئ ABA
   (تحليل المهارة، Prompting → Fading، تصحيح بدون عقوبة،
   تعزيز إيجابي، تكرار ذكي، تسجيل الأداء ونوع المساعدة)
   =====================================================================
   هذا القسم بالكامل إضافي ومعزول. لا يحذف أو يعدّل newSubtraction/
   checkSubtraction الأصليتين (يُعاد استخدامهما فعليًا داخل عدة
   مستويات عبر التغليف الآمن)، ولا يمس أي قسم آخر بالتطبيق (الجمع
   تحديدًا يشارك بعض الأصناف البصرية العامة مثل .count-items
   و .operation ولم يُمس إطلاقًا).
========================================================================= */

/* =========================================================
   📋 تعريف المستويات العشرة
========================================================= */

const SUBTRACTION_LEVELS = [
    { id: 1, title: "طرح ضمن ٥", icon: "🥕", max: 5, mode: "concrete-removal" },
    { id: 2, title: "طرح ضمن ١٠ + إطار العشرة", icon: "🔟", max: 10, mode: "ten-frame" },
    { id: 3, title: "طرح ضمن ٢٠", icon: "🔢", max: 20, mode: "digit-pad" },
    { id: 4, title: "العدد المفقود", icon: "❓", max: 10, mode: "missing-number" },
    { id: 5, title: "طرح أفقي", icon: "➡️", max: 20, mode: "digit-pad" },
    { id: 6, title: "طرح رأسي", icon: "⬇️", max: 20, mode: "vertical" },
    { id: 7, title: "خط الأعداد", icon: "🐇", max: 10, mode: "number-line" },
    { id: 8, title: "مسائل متنوعة", icon: "📖", max: 15, mode: "word-problem" },
    { id: 9, title: "طرح ضمن ٥٠", icon: "5️⃣0️⃣", max: 50, mode: "digit-pad" },
    { id: 10, title: "طرح ضمن ١٠٠", icon: "💯", max: 100, mode: "digit-pad" }
];

/* =========================================================
   🥕🎈🚌 مسرحيات المرحلة المحسوسة (Concrete) — تُستخدم في
   المستوى الأول بتدوير الموضوع لتجنّب التكرار الممل
========================================================= */

const CONCRETE_REMOVAL_THEMES = [
    {
        id: "carrot",
        itemEmoji: "🥕",
        instructionRemove: b => `🐰 أطعم الأرنب وأزل ${arabicNumber(b)} من الجزر`,
        instructionRemain: "كم جزرة بقيت؟"
    },
    {
        id: "balloon",
        itemEmoji: "🎈",
        instructionRemove: b => `فرقع ${arabicNumber(b)} من البالونات`,
        instructionRemain: "كم بالونة بقيت؟"
    },
    {
        id: "bus",
        itemEmoji: "🧑",
        instructionRemove: b => `🚌 أنزل ${arabicNumber(b)} من الركاب من الحافلة`,
        instructionRemain: "كم راكبًا بقي في الحافلة؟"
    },
    {
        id: "bird",
        itemEmoji: "🐦",
        instructionRemove: b => `اضغط على ${arabicNumber(b)} من العصافير لتطير بعيدًا`,
        instructionRemain: "كم عصفورًا بقي؟"
    }
];

/* =========================================================
   📖 مسائل الطرح اللفظية — بلغة بسيطة (أخذنا/اختفى/طار/بقي)
========================================================= */

const SUBTRACTION_WORD_PROBLEM_TEMPLATES = [
    {
        emoji: "🐦",
        text: (a, b) =>
            `كان في الشجرة ${arabicNumber(a)} عصافير، طار منها ${arabicNumber(b)}. كم عصفورًا بقي؟`
    },
    {
        emoji: "🍎",
        text: (a, b) =>
            `عند سارة ${arabicNumber(a)} تفاحات، أخذت منها أختها ${arabicNumber(b)}. كم تفاحة بقيت معها؟`
    },
    {
        emoji: "🎈",
        text: (a, b) =>
            `كان مع أحمد ${arabicNumber(a)} بالونات، اختفت منها ${arabicNumber(b)}. كم بالونة بقيت؟`
    },
    {
        emoji: "🍬",
        text: (a, b) =>
            `عند خالد ${arabicNumber(a)} حلويات، أكل منها ${arabicNumber(b)}. كم حلوى بقيت؟`
    },
    {
        emoji: "🚗",
        text: (a, b) =>
            `كانت في الموقف ${arabicNumber(a)} سيارات، غادرت منها ${arabicNumber(b)}. كم سيارة بقيت؟`
    }
];

/* =========================================================
   💾 حفظ التقدم وفتح المستويات (localStorage معزول)
========================================================= */

function loadSubtractionUnlockedLevel() {
    return Number(
        localStorage.getItem("taha_subtraction_unlocked_level") || 1
    );
}

function saveSubtractionUnlockedLevel(n) {
    localStorage.setItem("taha_subtraction_unlocked_level", String(n));
}

function unlockSubtractionLevel(n) {
    if (n > loadSubtractionUnlockedLevel() && n - 1 <= loadSubtractionUnlockedLevel()) {
        saveSubtractionUnlockedLevel(n);
    }
}

function loadSubtractionLevelBest() {
    try {
        return JSON.parse(
            localStorage.getItem("taha_subtraction_level_best") || "{}"
        );
    } catch (error) {
        return {};
    }
}

function saveSubtractionLevelBest(levelId, score) {
    const data = loadSubtractionLevelBest();

    if (!data[levelId] || score > data[levelId]) {
        data[levelId] = score;
        localStorage.setItem(
            "taha_subtraction_level_best",
            JSON.stringify(data)
        );
    }
}

/* =========================================================
   🧠 تسجيل الأداء ونوع المساعدة (ABA) — لكل مستوى:
   عدد الصحيح/الخطأ، عدد مرات كل مستوى مساعدة (Prompting)،
   والأزواج (a,b) التي أخطأ فيها الطفل لأغراض التكرار الذكي
========================================================= */

function loadSubtractionAdaptive() {
    try {
        return JSON.parse(
            localStorage.getItem("taha_subtraction_adaptive_v1") || "{}"
        );
    } catch (error) {
        return {};
    }
}

function saveSubtractionAdaptive(data) {
    localStorage.setItem(
        "taha_subtraction_adaptive_v1",
        JSON.stringify(data)
    );
}

function recordSubtractionOutcome(levelId, a, b, correct, promptLevel) {

    const data = loadSubtractionAdaptive();

    if (!data[levelId]) {
        data[levelId] = {
            correctCount: 0,
            wrongCount: 0,
            promptUsage: { 0: 0, 1: 0, 2: 0, 3: 0 },
            difficultPairs: []
        };
    }

    const entry = data[levelId];

    if (correct) entry.correctCount++;
    else entry.wrongCount++;

    entry.promptUsage[promptLevel] =
        (entry.promptUsage[promptLevel] || 0) + 1;

    if (!correct) {

        const key = `${a}-${b}`;

        if (!entry.difficultPairs.includes(key)) {
            entry.difficultPairs.push(key);

            if (entry.difficultPairs.length > 10) {
                entry.difficultPairs.shift();
            }
        }

    } else {

        const key = `${a}-${b}`;
        const idx = entry.difficultPairs.indexOf(key);

        if (idx !== -1) {
            entry.difficultPairs.splice(idx, 1);
        }
    }

    saveSubtractionAdaptive(data);
}

/* =========================================================
   🎯 مستويات المساعدة (ABA Prompting Hierarchy)
   ٠: مستقل — ١: تلميح بصري — ٢: نموذج جزئي — ٣: نموذج كامل
   (Errorless Learning) — تُستخدم Fading تلقائيًا لأن العدّاد
   يُصفَّر بمجرد الإجابة الصحيحة
========================================================= */

let subtractionWrongStreak = 0;

function getSubtractionPromptLevel(wrongStreak) {
    if (wrongStreak <= 0) return 0;
    if (wrongStreak === 1) return 1;
    if (wrongStreak === 2) return 2;
    return 3;
}

function showSubtractionHint(text) {
    const box = $("subtractionHintBox");
    if (box) {
        box.textContent = text;
        box.classList.add("visible");
    }
}

function hideSubtractionHint() {
    const box = $("subtractionHintBox");
    if (box) {
        box.classList.remove("visible");
        box.textContent = "";
    }
}

function highlightCorrectSubtractionChoice() {

    const task = subtractionLevelState.currentTask;
    const level = SUBTRACTION_LEVELS[subtractionLevelState.levelId - 1];

    if (!task) return;

    let correctValue = task.correct;

    if (level.mode === "missing-number") {
        correctValue = task.missingSide === "a" ? task.a : task.b;
    }

    document
        .querySelectorAll(
            "#subtractionTaskStage .subtraction-choice-btn, " +
            "#subConcreteChoiceGrid .subtraction-choice-btn"
        )
        .forEach(btn => {
            if (btn.textContent === arabicNumber(correctValue)) {
                btn.classList.add("hinted");
            }
        });
}

function applySubtractionPrompting() {

    const level = getSubtractionPromptLevel(subtractionWrongStreak);

    if (level === 1) {

        showSubtractionHint(
            "🌟 خذ وقتك، فكّر جيدًا: كم بقي بعد أن أخذنا هذا العدد؟"
        );

    } else if (level === 2) {

        showSubtractionHint(
            "🌟 لنعدّ معًا ببطء... أنت قريب جدًا، حاول مرة أخرى!"
        );

        highlightCorrectSubtractionChoice();

    } else if (level >= 3) {

        showSubtractionHint(
            "🌟 لا بأس أبدًا! سأساعدك: هذه هي الإجابة الصحيحة ✅"
        );

        highlightCorrectSubtractionChoice();
    }
}

/* =========================================================
   🎲 توليد مهام كل مستوى (تكرار ذكي: إعادة إدراج الأزواج
   التي أخطأ فيها الطفل سابقًا ضمن الجولة الجديدة)
========================================================= */

function generateSubtractionPairForLevel(level) {

    const max = Math.max(level.max, 2);

    const a = 2 + Math.floor(Math.random() * (max - 1));
    const b = 1 + Math.floor(Math.random() * a);

    return { a, b };
}

function buildSubtractionChoices(correctValue, max) {

    const choices = new Set([correctValue]);
    let guard = 0;

    while (choices.size < 3 && guard < 30) {

        guard++;

        const delta =
            (Math.floor(Math.random() * 4) + 1) *
            (Math.random() < 0.5 ? -1 : 1);

        let candidate = correctValue + delta;

        if (candidate < 0) candidate = correctValue + Math.abs(delta);
        if (candidate < 0) candidate = correctValue + 1;

        choices.add(candidate);
    }

    let filler = correctValue + 1;

    while (choices.size < 3) {
        choices.add(filler);
        filler++;
    }

    return shuffle([...choices]);
}

function pickSubtractionWordProblem(a, b) {

    const template =
        SUBTRACTION_WORD_PROBLEM_TEMPLATES[
            Math.floor(Math.random() * SUBTRACTION_WORD_PROBLEM_TEMPLATES.length)
        ];

    return {
        emoji: template.emoji,
        text: template.text(a, b)
    };
}

function buildSubtractionTaskObject(level, a, b) {

    const correct = a - b;
    const task = { a, b, correct };

    if (level.mode === "concrete-removal") {
        task.theme =
            CONCRETE_REMOVAL_THEMES[
                Math.floor(Math.random() * CONCRETE_REMOVAL_THEMES.length)
            ];
        task.choices = buildSubtractionChoices(correct, level.max);
    }

    if (level.mode === "ten-frame") {
        task.choices = buildSubtractionChoices(correct, level.max);
    }

    if (level.mode === "missing-number") {
        task.missingSide = Math.random() < 0.5 ? "a" : "b";
        const missingValue = task.missingSide === "a" ? a : b;
        task.choices = buildSubtractionChoices(missingValue, level.max);
    }

    if (level.mode === "word-problem") {
        const problem = pickSubtractionWordProblem(a, b);
        task.story = problem.text;
        task.storyEmoji = problem.emoji;
        task.choices = buildSubtractionChoices(correct, level.max);
    }

    return task;
}

function generateSubtractionTasksForLevel(level) {

    const tasks = [];
    let lastPair = null;

    const adaptive = loadSubtractionAdaptive();
    const entry = adaptive[level.id];
    const difficultPairs = (entry && entry.difficultPairs) || [];

    const injectCount = Math.min(2, difficultPairs.length);
    const injectedIndexes = new Set();

    if (injectCount > 0) {
        shuffle([...Array(10).keys()])
            .slice(0, injectCount)
            .forEach(i => injectedIndexes.add(i));
    }

    const chosenDifficult = shuffle(difficultPairs).slice(0, injectCount);

    for (let i = 0; i < 10; i++) {

        let a, b;

        if (injectedIndexes.has(i) && chosenDifficult.length) {

            const pairStr = chosenDifficult.pop();
            const parts = pairStr.split("-").map(Number);

            a = parts[0];
            b = parts[1];

        } else {

            let pair;
            let attempts = 0;

            do {
                pair = generateSubtractionPairForLevel(level);
                attempts++;
            } while (
                lastPair &&
                pair.a === lastPair.a &&
                pair.b === lastPair.b &&
                attempts < 8
            );

            a = pair.a;
            b = pair.b;
        }

        lastPair = { a, b };
        tasks.push(buildSubtractionTaskObject(level, a, b));
    }

    return tasks;
}

/* =========================================================
   🧮 حالة الجلسة الحالية للمستوى
========================================================= */

let subtractionLevelModeActive = false;

let subtractionLevelState = {
    levelId: 1,
    taskIndex: 0,
    correctCount: 0,
    currentTask: null,
    tasks: []
};

/* =========================================================
   🏠 شبكة اختيار المستويات
========================================================= */

function renderSubtractionLevelsHub() {

    const grid = $("subtractionLevelsGrid");

    if (!grid) return;

    const unlocked = StudentStore.eff(loadSubtractionUnlockedLevel());
    const bestScores = loadSubtractionLevelBest();

    grid.innerHTML = SUBTRACTION_LEVELS.map(level => {

        const isUnlocked = level.id <= unlocked;
        const isCompleted = (bestScores[level.id] || 0) >= 8;

        const classes = ["subtraction-level-card-btn"];
        if (!isUnlocked) classes.push("locked");
        if (isCompleted) classes.push("completed");

        const lockIcon = isCompleted ? "✅" : (isUnlocked ? "🔓" : "🔒");

        const bestText = bestScores[level.id]
            ? `أفضل نتيجة: ${arabicNumber(bestScores[level.id])}/١٠`
            : "";

        return `
            <button
                class="${classes.join(" ")}"
                type="button"
                ${isUnlocked
                    ? `onclick="openSubtractionLevel(${level.id})"`
                    : `onclick="showSubtractionLockedMessage()"`}
            >
                <span class="subtraction-level-lock-icon">${lockIcon}</span>
                <span class="subtraction-level-icon">${level.icon}</span>
                <span class="subtraction-level-name">
                    ${arabicNumber(level.id)}. ${level.title}
                </span>
                ${bestText ? `<span class="subtraction-level-best">${bestText}</span>` : ""}
            </button>
        `;
    }).join("");
}

function showSubtractionLockedMessage() {
    speakEducational(
        "أكمل المستوى السابق أولًا لتفتح هذا المستوى",
        { rate: 0.85 }
    );
}

/* =========================================================
   🚪 التنقل: فتح مستوى / الرجوع للمستويات
========================================================= */

function openSubtractionLevel(levelId) {

    const unlocked = StudentStore.eff(loadSubtractionUnlockedLevel());

    if (levelId > unlocked) {
        showSubtractionLockedMessage();
        return;
    }

    const level = SUBTRACTION_LEVELS[levelId - 1];

    if (!level) return;

    subtractionLevelModeActive = true;
    subtractionWrongStreak = 0;

    subtractionLevelState = {
        levelId,
        taskIndex: 0,
        correctCount: 0,
        currentTask: null,
        tasks: generateSubtractionTasksForLevel(level)
    };

    const hub = $("subtractionLevelsHub");
    const levelCard = $("subtractionLevelCard");
    const titleEl = $("subtractionLevelTitle");

    if (hub) hub.style.display = "none";
    if (levelCard) levelCard.style.display = "block";

    if (titleEl) {
        titleEl.textContent = `${level.icon} ${level.title}`;
    }

    renderCurrentSubtractionTask();
}

function backToSubtractionLevels() {

    subtractionLevelModeActive = false;

    if (subtractionTimer) {
        clearTimeout(subtractionTimer);
        subtractionTimer = null;
    }

    stopAllAudio();
    hideSubtractionHint();

    const hub = $("subtractionLevelsHub");
    const levelCard = $("subtractionLevelCard");

    if (levelCard) levelCard.style.display = "none";
    if (hub) hub.style.display = "block";

    renderSubtractionLevelsHub();
}

/* =========================================================
   📊 عرض التقدم والنتيجة الحالية
========================================================= */

function updateSubtractionScoreLabel() {

    const scoreEl = $("subtractionScoreLabel");

    if (scoreEl) {
        scoreEl.textContent =
            `✅ ${arabicNumber(subtractionLevelState.correctCount)} / ١٠`;
    }
}

function updateSubtractionProgressUI() {

    const label = $("subtractionProgressLabel");
    const fill = $("subtractionProgressFill");

    const humanPos = subtractionLevelState.taskIndex + 1;

    if (label) {
        label.textContent =
            `المهمة ${arabicNumber(humanPos)} من ١٠`;
    }

    if (fill) {
        fill.style.width = ((humanPos / 10) * 100) + "%";
    }

    updateSubtractionScoreLabel();
}

/* =========================================================
   🎛️ لوحة الأرقام (Digit Pad)
========================================================= */

function setupSubtractionDigitPad() {

    const pad = $("subtractionDigitPad");

    if (!pad) return;

    pad.innerHTML = "";

    const order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

    order.forEach(d => {

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "subtraction-digit-btn";
        btn.textContent = arabicNumber(d);

        btn.onclick = () => appendSubtractionDigit(d);

        pad.appendChild(btn);
    });

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "subtraction-digit-btn subtraction-digit-clear";
    clearBtn.textContent = "⌫";
    clearBtn.onclick = clearSubtractionDigit;

    pad.appendChild(clearBtn);
}

function appendSubtractionDigit(d) {

    const input = $("subAnswer");

    if (!input) return;

    const current = input.value || "";

    if (current.length >= 3) return;

    input.value = current + String(d);
}

/* جملة عدّ الخطوات المنطوقة: المفرد والمثنى بصيغتهما الصحيحة (خطوة واحدة / خطوتين)،
   وما عدا ذلك (٣ فأكثر) يبقى كما كان بالضبط: «N خطوات» */
function subtractionStepsInstruction(a, b) {
    const n = Number(b);
    if (n === 1) return `ابدأ من ${a} وارجع للخلف خطوة واحدة`;
    if (n === 2) return `ابدأ من ${a} وارجع للخلف خطوتين`;
    return `ابدأ من ${a} وارجع للخلف ${b} خطوات`;
}

function clearSubtractionDigit() {

    const input = $("subAnswer");

    if (!input) return;

    input.value = input.value.slice(0, -1);
}

/* =========================================================
   🖼️ قوالب عرض المهام (Activity Templates)
========================================================= */

function renderSubtractionChoiceButtons(grid, choices, correctValue, onResult) {

    grid.innerHTML = "";

    choices.forEach(value => {

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "subtraction-choice-btn";
        btn.textContent = arabicNumber(value);

        btn.onclick = () => {
            onResult(value === correctValue, btn);
        };

        grid.appendChild(btn);
    });
}

function renderLegacySubtractionDisplay(level, task) {

    const question = $("subQuestion");
    const pictures = $("subPictures");
    const answer = $("subAnswer");

    if (answer) answer.value = "";
    if (pictures) pictures.textContent = "";

    if (level.mode === "vertical") {

        if (question) {
            question.innerHTML = `
                <div class="subtraction-vertical-box">
                    <div class="subtraction-vertical-row">${arabicNumber(task.a)}</div>
                    <div class="subtraction-vertical-row subtraction-vertical-minus">${arabicNumber(task.b)}</div>
                    <div class="subtraction-vertical-line"></div>
                </div>
            `;
        }

    } else {

        if (question) {
            question.textContent =
                `${arabicNumber(task.a)} - ${arabicNumber(task.b)} = ؟`;
        }
    }
}

function renderConcreteRemovalTask(stage, task) {

    const theme = task.theme;

    stage.innerHTML = `
        <div class="subtraction-concrete-instruction">${theme.instructionRemove(task.b)}</div>
        <div class="subtraction-concrete-progress" id="subConcreteProgress">
            ${arabicNumber(0)} / ${arabicNumber(task.b)}
        </div>
        <div class="subtraction-items-row" id="subItemsRow"></div>
        <div class="subtraction-remaining-question" id="subRemainingQuestion" style="display:none;">
            ${theme.instructionRemain}
        </div>
        <div class="subtraction-choice-grid" id="subConcreteChoiceGrid" style="display:none;"></div>
    `;

    const row = stage.querySelector("#subItemsRow");
    let removedCount = 0;

    for (let i = 0; i < task.a; i++) {

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "subtraction-item-btn";
        btn.textContent = theme.itemEmoji;

        btn.onclick = () => {

            if (btn.classList.contains("removed")) return;
            if (removedCount >= task.b) return;

            btn.classList.add("removed");
            removedCount++;

            const progressEl = stage.querySelector("#subConcreteProgress");

            if (progressEl) {
                progressEl.textContent =
                    `${arabicNumber(removedCount)} / ${arabicNumber(task.b)}`;
            }

            if (removedCount >= task.b) {
                revealConcreteRemaining();
            }
        };

        row.appendChild(btn);
    }

    function revealConcreteRemaining() {

        const qEl = stage.querySelector("#subRemainingQuestion");
        const grid = stage.querySelector("#subConcreteChoiceGrid");

        if (qEl) qEl.style.display = "block";
        if (grid) grid.style.display = "grid";

        renderSubtractionChoiceButtons(
            grid, task.choices, task.correct, finishSubtractionChoiceTask
        );

        speakEducational(theme.instructionRemain, { rate: 0.8 });
    }

    speakEducational(theme.instructionRemove(task.b), { rate: 0.8 });
}

function renderTenFrameTask(stage, task) {

    stage.innerHTML = `
        <div class="subtraction-concrete-instruction">
            إطار العشرة: أزل ${arabicNumber(task.b)} من الأقراص
        </div>
        <div class="subtraction-concrete-progress" id="subConcreteProgress">
            ${arabicNumber(0)} / ${arabicNumber(task.b)}
        </div>
        <div class="subtraction-ten-frame" id="subTenFrame"></div>
        <div class="subtraction-remaining-question" id="subRemainingQuestion" style="display:none;">
            كم قرصًا بقي؟
        </div>
        <div class="subtraction-choice-grid" id="subConcreteChoiceGrid" style="display:none;"></div>
    `;

    const frame = stage.querySelector("#subTenFrame");
    let removedCount = 0;

    for (let i = 0; i < 10; i++) {

        const cell = document.createElement("div");
        cell.className = "subtraction-ten-frame-cell";

        if (i < task.a) {
            cell.classList.add("filled", "tappable");
            cell.textContent = "🔵";
            cell.dataset.filled = "1";
        } else {
            cell.dataset.filled = "0";
        }

        cell.onclick = () => {

            if (cell.dataset.filled !== "1") return;
            if (removedCount >= task.b) return;

            cell.classList.remove("filled");
            cell.classList.add("removed-cell");
            cell.dataset.filled = "0";
            cell.textContent = "";

            removedCount++;

            const progressEl = stage.querySelector("#subConcreteProgress");

            if (progressEl) {
                progressEl.textContent =
                    `${arabicNumber(removedCount)} / ${arabicNumber(task.b)}`;
            }

            if (removedCount >= task.b) {
                revealTenFrameRemaining();
            }
        };

        frame.appendChild(cell);
    }

    function revealTenFrameRemaining() {

        const qEl = stage.querySelector("#subRemainingQuestion");
        const grid = stage.querySelector("#subConcreteChoiceGrid");

        if (qEl) qEl.style.display = "block";
        if (grid) grid.style.display = "grid";

        renderSubtractionChoiceButtons(
            grid, task.choices, task.correct, finishSubtractionChoiceTask
        );

        speakEducational("كم قرصًا بقي؟", { rate: 0.8 });
    }

    speakEducational(
        `إطار العشرة: أزل ${task.b} من الأقراص الممتلئة`,
        { rate: 0.8 }
    );
}

function renderNumberLineTask(stage, task) {

    stage.innerHTML = `
        <div class="subtraction-number-line-instruction">
            ابدأ من ${arabicNumber(task.a)} وارجع للخلف خطوة بخطوة
        </div>
        <div class="subtraction-number-line-steps-label" id="subNumberLineSteps">
            الخطوات: ${arabicNumber(0)} / ${arabicNumber(task.b)}
        </div>
        <div class="subtraction-number-line-wrapper">
            <div class="subtraction-number-line" id="subNumberLine"></div>
        </div>
        <div class="subtraction-remaining-question" id="subNumberLineQuestion" style="display:none;">
            🎉 وصلنا! هذا هو ناتج الطرح
        </div>
    `;

    const line = stage.querySelector("#subNumberLine");
    let currentPos = task.a;
    let stepsUsed = 0;

    for (let n = 0; n <= task.a; n++) {

        const point = document.createElement("div");
        point.className = "subtraction-number-line-point";
        point.dataset.value = n;

        const tick = document.createElement("div");
        tick.className = "subtraction-number-line-tick";
        point.appendChild(tick);

        const label = document.createElement("div");
        label.className = "subtraction-number-line-label";
        label.textContent = arabicNumber(n);
        point.appendChild(label);

        if (n === task.a) {

            const marker = document.createElement("div");
            marker.className = "subtraction-number-line-marker";
            marker.id = "subNumberLineMarker";
            marker.textContent = "🐇";
            point.appendChild(marker);
        }

        if (n < task.a) {
            point.classList.add("active-step");
            point.onclick = () => handleNumberLineStep(n);
        }

        line.appendChild(point);
    }

    function handleNumberLineStep(targetValue) {

        if (targetValue !== currentPos - 1) return;

        currentPos = targetValue;
        stepsUsed++;

        const marker = $("subNumberLineMarker");
        const newPoint = line.querySelector(`[data-value="${currentPos}"]`);

        if (marker && newPoint) {
            newPoint.appendChild(marker);
        }

        if (newPoint) newPoint.classList.add("landed");

        const stepsLabel = stage.querySelector("#subNumberLineSteps");

        if (stepsLabel) {
            stepsLabel.textContent =
                `الخطوات: ${arabicNumber(stepsUsed)} / ${arabicNumber(task.b)}`;
        }

        if (stepsUsed >= task.b) {

            const qEl = stage.querySelector("#subNumberLineQuestion");
            if (qEl) qEl.style.display = "block";

            speakEducational(`وصلنا إلى ${currentPos}`, { rate: 0.8 });

            setTimeout(() => {
                finishSubtractionChoiceTask(currentPos === task.correct, null);
            }, 900);
        }
    }

    speakEducational(
        subtractionStepsInstruction(task.a, task.b),
        { rate: 0.78 }
    );
}

function renderSubtractionMissingNumberTask(stage, task) {

    const displayA = task.missingSide === "a" ? "؟" : arabicNumber(task.a);
    const displayB = task.missingSide === "b" ? "؟" : arabicNumber(task.b);

    stage.innerHTML = `
        <div class="operation">${displayA} - ${displayB} = ${arabicNumber(task.correct)}</div>
        <div class="subtraction-level-title" style="font-size:18px;">
            ما هو العدد المفقود؟
        </div>
        <div class="subtraction-choice-grid" id="subChoiceGrid"></div>
    `;

    const missingValue = task.missingSide === "a" ? task.a : task.b;

    renderSubtractionChoiceButtons(
        stage.querySelector("#subChoiceGrid"),
        task.choices,
        missingValue,
        finishSubtractionChoiceTask
    );
}

function renderSubtractionWordProblemTask(stage, task) {

    stage.innerHTML = `
        <div class="subtraction-word-problem-box">
            <span class="subtraction-word-problem-emoji">${task.storyEmoji || "📖"}</span>
            ${task.story}
        </div>
        <div class="subtraction-choice-grid" id="subChoiceGrid"></div>
    `;

    renderSubtractionChoiceButtons(
        stage.querySelector("#subChoiceGrid"),
        task.choices,
        task.correct,
        finishSubtractionChoiceTask
    );
}

/* =========================================================
   🚦 موزّع عرض المهمة الحالية
========================================================= */

function renderCurrentSubtractionTask() {

    const level = SUBTRACTION_LEVELS[subtractionLevelState.levelId - 1];
    const task = subtractionLevelState.tasks[subtractionLevelState.taskIndex];

    subtractionLevelState.currentTask = task;
    subtractionWrongStreak = 0;

    hideSubtractionHint();
    updateSubtractionProgressUI();

    const legacyWrapper = $("subtractionFreePlayLegacy");
    const stage = $("subtractionTaskStage");
    const messageEl = $("subMessage");

    if (messageEl) {
        messageEl.textContent = "";
        messageEl.className = "message";
    }

    if (level.mode === "digit-pad" || level.mode === "vertical") {

        if (stage) stage.style.display = "none";
        if (legacyWrapper) legacyWrapper.style.display = "block";

        currentSubA = task.a;
        currentSubB = task.b;

        renderLegacySubtractionDisplay(level, task);
        setupSubtractionDigitPad();

        speakCurrentSubtractionTask();

    } else {

        if (legacyWrapper) legacyWrapper.style.display = "none";
        if (stage) stage.style.display = "block";

        if (level.mode === "concrete-removal") {
            renderConcreteRemovalTask(stage, task);
        } else if (level.mode === "ten-frame") {
            renderTenFrameTask(stage, task);
        } else if (level.mode === "number-line") {
            renderNumberLineTask(stage, task);
        } else if (level.mode === "missing-number") {
            renderSubtractionMissingNumberTask(stage, task);
            speakCurrentSubtractionTask();
        } else if (level.mode === "word-problem") {
            renderSubtractionWordProblemTask(stage, task);
            speakCurrentSubtractionTask();
        }
    }
}

function speakCurrentSubtractionTask() {

    const level = SUBTRACTION_LEVELS[subtractionLevelState.levelId - 1];
    const task = subtractionLevelState.currentTask;

    if (!task) return;

    if (level.mode === "missing-number") {
        speakEducational("ما هو العدد المفقود؟", { rate: 0.8 });
    } else if (level.mode === "word-problem") {
        speakEducational(task.story, { rate: 0.78 });
    } else if (level.mode === "concrete-removal") {
        speakEducational(task.theme.instructionRemove(task.b), { rate: 0.8 });
    } else if (level.mode === "ten-frame") {
        speakEducational(`أزل ${task.b} من الأقراص الممتلئة`, { rate: 0.8 });
    } else if (level.mode === "number-line") {
        speakEducational(subtractionStepsInstruction(task.a, task.b), { rate: 0.78 });
    } else {
        speakEducational(
            `${task.a} ناقص ${task.b} يساوي كم؟`,
            { rate: 0.8 }
        );
    }
}

function retryCurrentSubtractionTask() {

    const level = SUBTRACTION_LEVELS[subtractionLevelState.levelId - 1];

    if (!level) return;

    const pair = generateSubtractionPairForLevel(level);
    const task = buildSubtractionTaskObject(level, pair.a, pair.b);

    subtractionLevelState.tasks[subtractionLevelState.taskIndex] = task;

    renderCurrentSubtractionTask();
}

/* =========================================================
   🏆 معالج نتيجة المهام القائمة على الاختيار/المحسوسة
   (يستخدم نفس نظام النجوم والتقدم بالضبط — لا نظام منفصل)
========================================================= */

function finishSubtractionChoiceTask(isCorrect, button) {

    const messageEl = $("subMessage");
    const level = SUBTRACTION_LEVELS[subtractionLevelState.levelId - 1];
    const task = subtractionLevelState.currentTask;

    if (isCorrect) {

        if (button) button.classList.add("correct");

        correctSubtraction++;
        saveCounters();
        addStars(5);

        if (messageEl) {
            messageEl.textContent = "🎉 أحسنت! إجابة صحيحة ⭐";
            messageEl.className = "message correct";
        }

        speakEducational("أحسنت! إجابة صحيحة", { rate: 0.8 });

        document
            .querySelectorAll(
                "#subtractionTaskStage .subtraction-choice-btn, " +
                "#subConcreteChoiceGrid .subtraction-choice-btn"
            )
            .forEach(btn => {
                btn.disabled = true;
                btn.classList.remove("hinted");
            });

        hideSubtractionHint();

        recordSubtractionOutcome(
            level.id, task.a, task.b, true,
            getSubtractionPromptLevel(subtractionWrongStreak)
        );

        subtractionWrongStreak = 0;

        onSubtractionLevelTaskCorrect();

        setTimeout(() => {
            advanceSubtractionLevelTask();
        }, 1200);

    } else {

        if (button) button.classList.add("wrong");

        if (messageEl) {
            messageEl.textContent = "😊 حاول مرة أخرى";
            messageEl.className = "message wrong";
        }

        speakEducational("حاول مرة أخرى", { rate: 0.8 });

        subtractionWrongStreak++;

        recordSubtractionOutcome(
            level.id, task.a, task.b, false,
            getSubtractionPromptLevel(subtractionWrongStreak)
        );

        applySubtractionPrompting();
    }
}

function onSubtractionLevelTaskCorrect() {
    subtractionLevelState.correctCount++;
    updateSubtractionScoreLabel();
}

/* =========================================================
   🔗 دمج آمن مع newSubtraction / checkSubtraction الأصليتين
   (تغليف فقط، بدون أي تعديل لمنطقهما الأصلي — تُستخدمان فعليًا
   في مستويات: ضمن ٢٠/٥٠/١٠٠، الأفقي، والرأسي)
========================================================= */

const originalNewSubtractionForLevels = newSubtraction;

newSubtraction = function () {

    if (subtractionLevelModeActive) {
        advanceSubtractionLevelTask();
    } else {
        originalNewSubtractionForLevels();
    }
};

const originalCheckSubtractionForLevels = checkSubtraction;

checkSubtraction = function () {

    if (!subtractionLevelModeActive) {
        originalCheckSubtractionForLevels();
        return;
    }

    const answerEl = $("subAnswer");

    const answer = parseNumber(
        answerEl ? answerEl.value : ""
    );

    const correct = currentSubA - currentSubB;
    const wasAnswered = Number.isFinite(answer);

    const level = SUBTRACTION_LEVELS[subtractionLevelState.levelId - 1];
    const task = subtractionLevelState.currentTask;

    originalCheckSubtractionForLevels();

    if (wasAnswered) {

        if (answer === correct) {

            hideSubtractionHint();

            recordSubtractionOutcome(
                level.id, task.a, task.b, true,
                getSubtractionPromptLevel(subtractionWrongStreak)
            );

            subtractionWrongStreak = 0;

            onSubtractionLevelTaskCorrect();

        } else {

            subtractionWrongStreak++;

            recordSubtractionOutcome(
                level.id, task.a, task.b, false,
                getSubtractionPromptLevel(subtractionWrongStreak)
            );

            applySubtractionPrompting();
        }
    }
};

function advanceSubtractionLevelTask() {

    subtractionLevelState.taskIndex++;

    if (subtractionLevelState.taskIndex >= 10) {
        finishSubtractionLevel();
        return;
    }

    renderCurrentSubtractionTask();
}

/* =========================================================
   🎉 إنهاء المستوى: فتح التالي عند ٨/١٠ فأكثر
========================================================= */

function finishSubtractionLevel() {

    const level = SUBTRACTION_LEVELS[subtractionLevelState.levelId - 1];
    const score = subtractionLevelState.correctCount;
    const passed = score >= 8;

    subtractionLevelModeActive = false;

    saveSubtractionLevelBest(level.id, score);

    if (passed) {
        addStars(10);
        unlockSubtractionLevel(level.id + 1);
    }

    renderSubtractionLevelResultScreen(level, score, passed);
}

function renderSubtractionLevelResultScreen(level, score, passed) {

    const legacyWrapper = $("subtractionFreePlayLegacy");
    const stage = $("subtractionTaskStage");
    const messageEl = $("subMessage");

    if (legacyWrapper) legacyWrapper.style.display = "none";

    if (messageEl) {
        messageEl.textContent = "";
        messageEl.className = "message";
    }

    hideSubtractionHint();

    const nextLevel = SUBTRACTION_LEVELS[level.id];

    if (stage) {

        stage.style.display = "block";

        stage.innerHTML = `
            <div class="subtraction-level-result-card">

                <div class="subtraction-level-result-emoji">
                    ${passed ? "🏆" : "🌟"}
                </div>

                <div class="subtraction-level-result-title">
                    ${passed ? "أحسنت! أكملت المستوى بنجاح" : "محاولة رائعة!"}
                </div>

                <div class="subtraction-level-result-score">
                    النتيجة: ${arabicNumber(score)} / ١٠
                </div>

                ${passed && nextLevel ? `
                    <button class="success" type="button" onclick="openSubtractionLevel(${nextLevel.id})">
                        ➡️ المستوى التالي: ${nextLevel.title}
                    </button>
                ` : ""}

                ${!passed ? `
                    <button class="success" type="button" onclick="openSubtractionLevel(${level.id})">
                        🔁 إعادة المحاولة
                    </button>
                ` : ""}

                <button class="secondary" type="button" onclick="backToSubtractionLevels()">
                    🏠 كل المستويات
                </button>

            </div>
        `;
    }

    updateSubtractionProgressUI();

    speakEducational(
        passed
            ? "أحسنت! أكملت المستوى بنجاح"
            : "محاولة رائعة، لنحاول مرة أخرى",
        { rate: 0.8 }
    );
}

/* =========================================================
   🚪 نقطة الدخول: عرض شبكة المستويات دائمًا أولًا عند الدخول
   لقسم الطرح (تغليف إضافي فوق showScreen الحالية بدون
   المساس بمنطقها أو بأي قسم آخر تتعامل معه)
========================================================= */

const showScreenBeforeSubtractionEngine = showScreen;

showScreen = function (screenId) {

    if (screenId === "subtraction") {
        subtractionLevelModeActive = false;
    }

    showScreenBeforeSubtractionEngine(screenId);

    if (screenId === "subtraction") {

        if (subtractionTimer) {
            clearTimeout(subtractionTimer);
            subtractionTimer = null;
        }

        const hub = $("subtractionLevelsHub");
        const levelCard = $("subtractionLevelCard");

        if (levelCard) levelCard.style.display = "none";
        if (hub) hub.style.display = "block";

        renderSubtractionLevelsHub();
    }
};

/* تهيئة أولية بعد تحميل الصفحة */

document.addEventListener("DOMContentLoaded", () => {
    if ($("subtractionLevelsGrid")) {
        renderSubtractionLevelsHub();
    }
});

/* =========================================================
   🔚 نهاية قسم تطوير "الطرح" الجديد بالكامل
========================================================= */


/* =========================================================================
   🆕 =====================================================================
   📖🎓 إعادة بناء قسم "الكلمات" بالكامل — ٩ مستويات للحركات القصيرة
   =====================================================================
   الترتيب: (١) حروف بالفتح (٢) مقاطع بالفتح (٣) كلمات بالفتح
   (٤) حروف بالضم (٥) مقاطع بالفتح والضم (٦) كلمات بالفتح والضم
   (٧) حروف بالكسرة (٨) مقاطع بالحركات الثلاث (٩) كلمات بالحركات الثلاث
   لا مدود، لا سكون، لا شدة، لا تنوين — حركات قصيرة فقط.
   هذا القسم بالكامل مستقل ومعزول، ولا يمس أي قسم آخر بالتطبيق.
   جميع الكلمات تم التحقق من تشكيلها برمجيًا (فتحة/ضمة/كسرة فقط،
   بلا أي علامة أخرى) قبل اعتمادها.
========================================================================= */

/* =========================================================
   🔤 مساعد كسرة الألف الصحيح إملائيًا (إِ وليس أِ) — معزول
   بالكامل عن letterWithKasra المستخدمة في قسم الحروف
========================================================= */

function wordsLevelLetterWithKasra(letter) {
    if (letter === "أ" || letter === "ا" || letter === "إ") {
        return "إِ";
    }
    return removeArabicHarakat(letter) + "ِ";
}

/* =========================================================
   📋 بيانات كل مستوى (مبنيّة ومُتحقَّق منها بعناية لغوية)
========================================================= */

/* المستوى ١: كل الحروف بالفتحة */
const WORDS_L1_LETTERS = letters.map(item => item.letter);

/* المستوى ٤: كل الحروف بالضمة */
const WORDS_L4_LETTERS = letters.map(item => item.letter);

/* المستوى ٧: كل الحروف بالكسرة */
const WORDS_L7_LETTERS = letters.map(item => item.letter);

/* المستوى ٢: مقاطع من حرفين بالفتحة (بادئات كلمات حقيقية) */
const WORDS_L2_SYLLABLES = [
    "قَرَ", "كَتَ", "نَظَ", "جَمَ", "حَمَ", "خَبَ", "دَخَ", "وَجَ",
    "أَكَ", "هَرَ", "وَقَ", "طَلَ", "سَكَ", "فَتَ", "غَسَ", "لَبَ",
    "رَقَ", "ضَحَ", "طَبَ"
];

/* المستوى ٣: كلمات ثلاثية بالفتحة (نمط فَعَلَ) */
const WORDS_L3_WORDS = [
    { word: "كَتَبَ", emoji: "✍️" },
    { word: "ذَهَبَ", emoji: "🚶" },
    { word: "قَرَأَ", emoji: "📖" },
    { word: "طَلَعَ", emoji: "🌅" },
    { word: "حَرَثَ", emoji: "🚜" },
    { word: "أَخَذَ", emoji: "🤲" },
    { word: "خَرَجَ", emoji: "🚪" },
    { word: "خَبَزَ", emoji: "🍞" },
    { word: "حَمَلَ", emoji: "📦" },
    { word: "دَخَلَ", emoji: "🚶‍♂️" },
    { word: "جَمَعَ", emoji: "🧺" },
    { word: "وَجَدَ", emoji: "🔍" }
];

/* المستوى ٥: مقاطع من حرفين تجمع الفتحة والضمة */
const WORDS_L5_SYLLABLES = [
    "بَتُ", "مُنَ", "سَمُ", "كُتَ", "جَمُ",
    "دُبَ", "رَمُ", "شُبَ", "نَمُ", "تُبَ", "لُمَ"
];

/* المستوى ٦: كلمات ثلاثية تجمع الفتحة والضمة (نمط فَعُلَ) */
const WORDS_L6_WORDS = [
    { word: "كَبُرَ", emoji: "📏" },
    { word: "حَسُنَ", emoji: "🌟" },
    { word: "صَغُرَ", emoji: "🤏" },
    { word: "كَرُمَ", emoji: "🎁" },
    { word: "بَعُدَ", emoji: "🛣️" },
    { word: "قَرُبَ", emoji: "📍" },
    { word: "عَظُمَ", emoji: "🏔️" },
    { word: "سَهُلَ", emoji: "✅" },
    { word: "صَعُبَ", emoji: "⛰️" }
];

/* المستوى ٨: مقاطع من حرفين بالحركات الثلاث */
const WORDS_L8_SYLLABLES = [
    "بَتِ", "مُسَ", "كِتُ", "سَمِ", "دُرِ",
    "فِتُ", "لَمِ", "نُبَ", "رِتُ", "حَمِ"
];

/* المستوى ٩: كلمات ثلاثية بالحركات الثلاث (فَعَلَ + فَعِلَ + فَعُلَ)
   من السهل (فَعَلَ مألوف من المستوى ٣) إلى الأصعب (فَعِلَ/فَعُلَ) */
const WORDS_L9_FAALA_EXTRA = [
    { word: "شَرِبَ", emoji: "🥛" },
    { word: "فَهِمَ", emoji: "💡" },
    { word: "عَلِمَ", emoji: "🧠" },
    { word: "سَمِعَ", emoji: "👂" },
    { word: "لَعِبَ", emoji: "⚽" },
    { word: "رَكِبَ", emoji: "🚲" },
    { word: "حَسِبَ", emoji: "🧮" },
    { word: "عَمِلَ", emoji: "🛠️" }
];

function buildWordsLevel9Pool() {
    /* ترتيب من السهل (فَعَلَ الذي تدرّب عليه الطفل بالفعل في
       المستوى ٣) إلى الأصعب (فَعِلَ ثم فَعُلَ) */
    return [
        ...WORDS_L3_WORDS.slice(0, 4),
        ...WORDS_L9_FAALA_EXTRA,
        ...WORDS_L6_WORDS.slice(0, 4)
    ];
}

/* =========================================================
   📋 تعريف المستويات التسعة
========================================================= */

const WORDS_LEVELS = [
    { id: 1, title: "كل الحروف بالفتح", icon: "َ", mode: "letters", haraka: "fatha" },
    { id: 2, title: "مقاطع من حرفين بالفتح", icon: "بَتَ", mode: "syllables", pool: WORDS_L2_SYLLABLES },
    { id: 3, title: "كلمات ثلاثية بالفتح", icon: "📖", mode: "words", pool: WORDS_L3_WORDS },
    { id: 4, title: "جميع الحروف بالضم", icon: "ُ", mode: "letters", haraka: "damma" },
    { id: 5, title: "مقاطع من حرفين بالفتح والضم", icon: "بَتُ", mode: "syllables", pool: WORDS_L5_SYLLABLES },
    { id: 6, title: "كلمات ثلاثية بالفتح والضم", icon: "📗", mode: "words", pool: WORDS_L6_WORDS },
    { id: 7, title: "الحروف بالكسرة", icon: "ِ", mode: "letters", haraka: "kasra" },
    { id: 8, title: "مقاطع بالحركات الثلاث", icon: "بَبُبِ", mode: "mixed-syllables", pool: WORDS_L8_SYLLABLES },
    { id: 9, title: "كلمات ثلاثية بالحركات الثلاث", icon: "📚", mode: "words", pool: null }
];

/* =========================================================
   💾 حفظ التقدم وفتح المستويات (localStorage معزول)
========================================================= */

function loadWordsUnlockedLevel() {
    return Number(
        localStorage.getItem("taha_words_unlocked_level") || 1
    );
}

function saveWordsUnlockedLevel(n) {
    localStorage.setItem("taha_words_unlocked_level", String(n));
}

function unlockWordsLevel(n) {
    if (n > loadWordsUnlockedLevel() && n - 1 <= loadWordsUnlockedLevel()) {
        saveWordsUnlockedLevel(n);
    }
}

function loadWordsLevelBest() {
    try {
        return JSON.parse(
            localStorage.getItem("taha_words_level_best") || "{}"
        );
    } catch (error) {
        return {};
    }
}

function saveWordsLevelBest(levelId, score) {
    const data = loadWordsLevelBest();
    if (!data[levelId] || score > data[levelId]) {
        data[levelId] = score;
        localStorage.setItem(
            "taha_words_level_best", JSON.stringify(data)
        );
    }
}

/* =========================================================
   🧠 تسجيل الأداء ونوع المساعدة + التكرار الذكي (معزول)
========================================================= */

function loadWordsAdaptive() {
    try {
        return JSON.parse(
            localStorage.getItem("taha_words_adaptive_v1") || "{}"
        );
    } catch (error) {
        return {};
    }
}

function saveWordsAdaptive(data) {
    localStorage.setItem("taha_words_adaptive_v1", JSON.stringify(data));
}

function recordWordsOutcome(levelId, itemKey, correct, promptLevel) {

    const data = loadWordsAdaptive();

    if (!data[levelId]) {
        data[levelId] = {
            correctCount: 0,
            wrongCount: 0,
            promptUsage: { 0: 0, 1: 0, 2: 0, 3: 0 },
            difficultItems: []
        };
    }

    const entry = data[levelId];

    if (correct) entry.correctCount++;
    else entry.wrongCount++;

    entry.promptUsage[promptLevel] = (entry.promptUsage[promptLevel] || 0) + 1;

    if (!correct) {
        if (!entry.difficultItems.includes(itemKey)) {
            entry.difficultItems.push(itemKey);
            if (entry.difficultItems.length > 10) {
                entry.difficultItems.shift();
            }
        }
    } else {
        const idx = entry.difficultItems.indexOf(itemKey);
        if (idx !== -1) entry.difficultItems.splice(idx, 1);
    }

    saveWordsAdaptive(data);
}

/* =========================================================
   🎯 مستويات المساعدة (ABA Prompting Hierarchy) — نفس مبدأ
   قسمي الجمع والطرح، بمعزل كامل عن بياناتهما
========================================================= */

let wordsWrongStreak = 0;

function getWordsPromptLevel(wrongStreak) {
    if (wrongStreak <= 0) return 0;
    if (wrongStreak === 1) return 1;
    if (wrongStreak === 2) return 2;
    return 3;
}

function showWordsHint(text) {
    const box = $("wordsHintBox");
    if (box) {
        box.textContent = text;
        box.classList.add("visible");
    }
}

function hideWordsHint() {
    const box = $("wordsHintBox");
    if (box) {
        box.classList.remove("visible");
        box.textContent = "";
    }
}

function highlightCorrectWordsChoice() {

    const task = wordsLevelState.currentTask;
    if (!task) return;

    document
        .querySelectorAll(
            "#wordsTaskStage .words-choice-btn, #wordsTaskStage .words-harakat-btn"
        )
        .forEach(btn => {
            if (btn.dataset.correct === "1") {
                btn.classList.add("hinted");
            }
        });
}

function applyWordsPrompting() {

    const level = getWordsPromptLevel(wordsWrongStreak);

    if (level === 1) {
        showWordsHint("🌟 استمع مرة أخرى بهدوء، ثم اختر بعناية");
    } else if (level === 2) {
        showWordsHint("🌟 أنت قريب جدًا! لنستمع معًا مرة أخرى");
        highlightCorrectWordsChoice();
    } else if (level >= 3) {
        showWordsHint("🌟 لا بأس أبدًا! سأساعدك: هذه هي الإجابة الصحيحة ✅");
        highlightCorrectWordsChoice();
    }
}

/* =========================================================
   🎲 توليد مهام كل مستوى
========================================================= */

function buildHarakaText(letter, haraka) {
    if (haraka === "fatha") return letterWithFatha(letter);
    if (haraka === "damma") return letterWithDamma(letter);
    return wordsLevelLetterWithKasra(letter);
}

function buildWordsChoices(correctValue, pool, count) {

    const others = pool.filter(v => v !== correctValue);
    const distractors = shuffle(others).slice(0, count - 1);
    return shuffle([correctValue, ...distractors]);
}

function generateWordsTasksForLevel(level) {

    const tasks = [];

    const adaptive = loadWordsAdaptive();
    const entry = adaptive[level.id];
    const difficultItems = (entry && entry.difficultItems) || [];

    let pool = [];

    if (level.mode === "letters") {
        pool = WORDS_L1_LETTERS.map(l => buildHarakaText(l, level.haraka));
    } else if (level.mode === "syllables" || level.mode === "mixed-syllables") {
        pool = level.pool.slice();
    } else if (level.mode === "words") {
        pool = (level.id === 9 ? buildWordsLevel9Pool() : level.pool).map(w => w.word);
    }

    const poolWithMeta = level.mode === "words"
        ? (level.id === 9 ? buildWordsLevel9Pool() : level.pool)
        : null;

    /* إدراج العناصر التي أخطأ فيها الطفل سابقًا (تكرار ذكي) */
    const injectCount = Math.min(2, difficultItems.filter(v => pool.includes(v)).length);
    const chosenDifficult = shuffle(difficultItems.filter(v => pool.includes(v))).slice(0, injectCount);

    const injectedIndexes = new Set();
    if (injectCount > 0) {
        shuffle([...Array(10).keys()]).slice(0, injectCount).forEach(i => injectedIndexes.add(i));
    }

    let lastValue = null;

    for (let i = 0; i < 10; i++) {

        let value;

        if (injectedIndexes.has(i) && chosenDifficult.length) {
            value = chosenDifficult.pop();
        } else {
            let attempts = 0;
            do {
                value = pool[Math.floor(Math.random() * pool.length)];
                attempts++;
            } while (value === lastValue && attempts < 8 && pool.length > 1);
        }

        lastValue = value;

        const task = { value };

        /* 🎚️ تدرّج الصعوبة داخل المستوى نفسه: مهمتان فقط في
           البداية (٢ خيار)، ثم بقية المهام (٣ خيارات) — يبقى
           ضمن حدود "٢-٣ خيارات فقط" المطلوبة */
        const choiceCount = i < 2 ? 2 : 3;

        if (level.mode === "letters") {
            task.choices = buildWordsChoices(value, pool, choiceCount);
        } else if (level.mode === "syllables") {
            task.choices = buildWordsChoices(value, pool, choiceCount);
        } else if (level.mode === "mixed-syllables") {
            task.choices = buildWordsChoices(value, pool, choiceCount);
        } else if (level.mode === "words") {

            const meta = poolWithMeta.find(w => w.word === value) || { word: value, emoji: "📖" };
            task.emoji = meta.emoji;
            task.choices = buildWordsChoices(value, pool, choiceCount);

            /* بدائل تشكيل مقاربة لنفس هيكل الحروف (اختيار الكلمة الصحيحة) */
            task.spellingChoices = buildWordsSpellingDistractors(value, choiceCount);

            /* 🎚️ تدرّج نوع النشاط داخل المستوى: نبدأ بالأسهل
               (استماع واختيار)، ثم مطابقة القراءة بالصورة،
               ثم الأصعب (تمييز التشكيل الدقيق) في آخر المستوى */
            if (i < 3) {
                task.activityKind = 0; /* استماع واختيار */
            } else if (i < 7) {
                task.activityKind = 2; /* مطابقة: قراءة ثم اختيار الصورة */
            } else {
                task.activityKind = 1; /* اختيار الكلمة الصحيحة (تمييز التشكيل) */
            }
        }

        tasks.push(task);
    }

    return tasks;
}

/* توليد بدائل تشكيل مقاربة (نفس الحروف، حركات مبدّلة) لأغراض
   نشاط "اختيار الكلمة الصحيحة" */
function buildWordsSpellingDistractors(correctWord, count) {

    const distractorsNeeded = Math.max((count || 3) - 1, 1);

    const HARAKAT_MARKS = ["\u064E", "\u064F", "\u0650"];
    const chars = Array.from(correctWord);

    const positions = [];
    chars.forEach((ch, idx) => {
        if (HARAKAT_MARKS.includes(ch)) positions.push(idx);
    });

    const variants = new Set();
    let guard = 0;

    while (variants.size < distractorsNeeded && guard < 20) {

        guard++;

        const newChars = chars.slice();
        const posToChange = positions[Math.floor(Math.random() * positions.length)];
        const currentMark = newChars[posToChange];
        const otherMarks = HARAKAT_MARKS.filter(m => m !== currentMark);
        newChars[posToChange] = otherMarks[Math.floor(Math.random() * otherMarks.length)];

        const candidate = newChars.join("");
        if (candidate !== correctWord) variants.add(candidate);
    }

    return shuffle([correctWord, ...variants]).slice(0, count || 3);
}

/* =========================================================
   🧮 حالة الجلسة الحالية للمستوى
========================================================= */

let wordsLevelModeActive = false;

let wordsLevelState = {
    levelId: 1,
    taskIndex: 0,
    reviewIndex: 0,
    correctCount: 0,
    currentTask: null,
    tasks: []
};

/* =========================================================
   🏠 شبكة اختيار المستويات
========================================================= */

function renderWordsLevelsHub() {

    const grid = $("wordsLevelsGrid");
    if (!grid) return;

    const unlocked = StudentStore.eff(loadWordsUnlockedLevel());
    const bestScores = loadWordsLevelBest();

    grid.innerHTML = WORDS_LEVELS.map(level => {

        const isUnlocked = level.id <= unlocked;
        const isCompleted = (bestScores[level.id] || 0) >= 8;

        const classes = ["words-level-card-btn"];
        if (!isUnlocked) classes.push("locked");
        if (isCompleted) classes.push("completed");

        const lockIcon = isCompleted ? "✅" : (isUnlocked ? "🔓" : "🔒");
        const bestText = bestScores[level.id]
            ? `أفضل نتيجة: ${arabicNumber(bestScores[level.id])}/١٠`
            : "";

        return `
            <button
                class="${classes.join(" ")}"
                type="button"
                ${isUnlocked
                    ? `onclick="openWordsLevel(${level.id})"`
                    : `onclick="showWordsLockedMessage()"`}
            >
                <span class="words-level-lock-icon">${lockIcon}</span>
                <span class="words-level-icon">${level.icon}</span>
                <span class="words-level-name">
                    ${arabicNumber(level.id)}. ${level.title}
                </span>
                ${bestText ? `<span class="words-level-best">${bestText}</span>` : ""}
            </button>
        `;
    }).join("");
}

function showWordsLockedMessage() {
    speakEducational("أكمل المستوى السابق أولًا لتفتح هذا المستوى", { rate: 0.85 });
}

/* =========================================================
   🚪 التنقل: فتح مستوى / الرجوع للمستويات
========================================================= */

function openWordsLevel(levelId) {

    const unlocked = StudentStore.eff(loadWordsUnlockedLevel());

    if (levelId > unlocked) {
        showWordsLockedMessage();
        return;
    }

    const level = WORDS_LEVELS[levelId - 1];
    if (!level) return;

    wordsLevelModeActive = true;
    wordsWrongStreak = 0;

    wordsLevelState = {
        levelId,
        taskIndex: 0,
        reviewIndex: 0,
        correctCount: 0,
        currentTask: null,
        tasks: generateWordsTasksForLevel(level)
    };

    const hub = $("wordsLevelsHub");
    const levelCard = $("wordsLevelCard");
    const titleEl = $("wordsLevelTitle");

    if (hub) hub.style.display = "none";
    if (levelCard) levelCard.style.display = "block";
    if (titleEl) titleEl.textContent = `${level.icon} ${level.title}`;

    renderCurrentWordsTask();
}

function backToWordsLevels() {

    wordsLevelModeActive = false;

    stopAllAudio();
    hideWordsHint();

    const hub = $("wordsLevelsHub");
    const levelCard = $("wordsLevelCard");

    if (levelCard) levelCard.style.display = "none";
    if (hub) hub.style.display = "block";

    renderWordsLevelsHub();
}

/* =========================================================
   📊 عرض التقدم والنتيجة الحالية
========================================================= */

function updateWordsScoreLabel() {
    const scoreEl = $("wordsScoreLabel");
    if (scoreEl) {
        scoreEl.textContent = `✅ ${arabicNumber(wordsLevelState.correctCount)} / ١٠`;
    }
}

function updateWordsProgressUI() {

    const label = $("wordsProgressLabel");
    const fill = $("wordsProgressFill");
    const humanPos = wordsLevelState.taskIndex + 1;

    if (label) {
        label.textContent = `المهمة ${arabicNumber(humanPos)} من ١٠`;
    }

    if (fill) {
        fill.style.width = ((humanPos / 10) * 100) + "%";
    }

    updateWordsScoreLabel();
}

/* =========================================================
   🖼️ قوالب عرض المهام (استماع واختيار / اختيار الحركة /
   اختيار الكلمة الصحيحة / مطابقة القراءة بالصورة)
========================================================= */

function renderWordsChoiceButtons(grid, choices, correctValue, onResult) {

    grid.innerHTML = "";

    choices.forEach(value => {

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "words-choice-btn";
        btn.textContent = value;
        btn.dataset.correct = value === correctValue ? "1" : "0";

        btn.onclick = () => onResult(value === correctValue, btn);

        grid.appendChild(btn);
    });
}

function renderListenChooseTask(stage, task, level) {

    stage.innerHTML = `
        <div class="words-instruction-line">🔊 استمع ثم اختر ما سمعته</div>
        <div class="words-choice-grid" id="wordsChoiceGrid"></div>
    `;

    renderWordsChoiceButtons(
        stage.querySelector("#wordsChoiceGrid"),
        task.choices,
        task.value,
        finishWordsChoiceTask
    );
}

function renderWordsWordTask(stage, task, level) {

    const activityKind = typeof task.activityKind === "number"
        ? task.activityKind
        : Math.floor(Math.random() * 3);

    if (activityKind === 0) {

        /* استماع واختيار الكلمة المنطوقة */
        stage.innerHTML = `
            <div class="words-display-emoji">${task.emoji}</div>
            <div class="words-instruction-line">🔊 استمع ثم اختر الكلمة الصحيحة</div>
            <div class="words-choice-grid" id="wordsChoiceGrid"></div>
        `;

        renderWordsChoiceButtons(
            stage.querySelector("#wordsChoiceGrid"),
            task.choices,
            task.value,
            finishWordsChoiceTask
        );

    } else if (activityKind === 1) {

        /* اختيار الكلمة الصحيحة (تمييز التشكيل) */
        stage.innerHTML = `
            <div class="words-display-emoji">${task.emoji}</div>
            <div class="words-instruction-line">اختر الكلمة المكتوبة بشكل صحيح</div>
            <div class="words-choice-grid" id="wordsChoiceGrid"></div>
        `;

        renderWordsChoiceButtons(
            stage.querySelector("#wordsChoiceGrid"),
            task.spellingChoices,
            task.value,
            finishWordsChoiceTask
        );

    } else {

        /* مطابقة: اقرأ الكلمة ثم اختر صورتها الصحيحة */
        const distractorEmojis = shuffle(
            (level.id === 9 ? buildWordsLevel9Pool() : level.pool)
                .filter(w => w.word !== task.value)
        ).slice(0, 2).map(w => w.emoji);

        const emojiChoices = shuffle([task.emoji, ...distractorEmojis]);

        stage.innerHTML = `
            <div class="words-display-text">${task.value}</div>
            <div class="words-instruction-line">اقرأ الكلمة، ثم اختر الصورة المناسبة</div>
            <div class="words-choice-grid" id="wordsEmojiGrid"></div>
        `;

        const grid = stage.querySelector("#wordsEmojiGrid");

        emojiChoices.forEach(emoji => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "words-choice-btn";
            btn.textContent = emoji;
            btn.dataset.correct = emoji === task.emoji ? "1" : "0";
            btn.onclick = () => finishWordsChoiceTask(emoji === task.emoji, btn);
            grid.appendChild(btn);
        });
    }
}

function renderWordsHarakatChoiceTask(stage, task) {

    const HARAKA_DEFS = [
        { mark: "\u064E", label: "فتحة" },
        { mark: "\u064F", label: "ضمة" },
        { mark: "\u0650", label: "كسرة" }
    ];

    const baseLetter = removeArabicHarakat(task.value);
    const correctMark = task.value.slice(-1);

    stage.innerHTML = `
        <div class="words-instruction-line">🔊 استمع، ما الحركة التي سمعتها؟</div>
        <div class="words-harakat-grid" id="wordsHarakatGrid"></div>
    `;

    const grid = stage.querySelector("#wordsHarakatGrid");

    shuffle(HARAKA_DEFS).forEach(def => {

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "words-harakat-btn";
        btn.innerHTML = `${baseLetter}${def.mark}<span class="words-harakat-label">${def.label}</span>`;
        btn.dataset.correct = def.mark === correctMark ? "1" : "0";

        btn.onclick = () => finishWordsChoiceTask(def.mark === correctMark, btn);

        grid.appendChild(btn);
    });
}

/* =========================================================
   🚦 موزّع عرض المهمة الحالية
========================================================= */

function renderCurrentWordsTask() {

    const level = WORDS_LEVELS[wordsLevelState.levelId - 1];
    const task = wordsLevelState.tasks[wordsLevelState.taskIndex];

    wordsLevelState.currentTask = task;
    wordsWrongStreak = 0;

    hideWordsHint();
    updateWordsProgressUI();

    const stage = $("wordsTaskStage");
    const messageEl = $("wordMessage");

    if (messageEl) {
        messageEl.textContent = "";
        messageEl.className = "message";
    }

    if (!stage) return;

    /* المستوى ٨: أول ٣ مهام = مراجعة اختيار الحركة الصريحة
       بَ ← بُ ← بِ لتعزيز التدرّج قبل مقاطع الحركات المختلطة
       (عدّاد reviewIndex مستقل تمامًا عن taskIndex لتفادي أي
       تصادم عند العودة لعدّاد المهام الحقيقية) */
    if (level.mode === "mixed-syllables" && wordsLevelState.reviewIndex < 3) {

        const reviewLetters = ["ب", "س", "م"];
        const reviewLetter = reviewLetters[wordsLevelState.reviewIndex];
        const harakaOrder = ["fatha", "damma", "kasra"];
        const haraka = harakaOrder[wordsLevelState.reviewIndex];

        const reviewValue = buildHarakaText(reviewLetter, haraka);
        wordsLevelState.currentTask = { value: reviewValue, isHarakaReview: true };

        renderWordsHarakatChoiceTask(stage, wordsLevelState.currentTask);

    } else if (level.mode === "letters") {

        renderListenChooseTask(stage, task, level);

    } else if (level.mode === "syllables") {

        renderListenChooseTask(stage, task, level);

    } else if (level.mode === "mixed-syllables") {

        renderListenChooseTask(stage, task, level);

    } else if (level.mode === "words") {

        renderWordsWordTask(stage, task, level);
    }

    speakCurrentWordsTask();
}

function speakCurrentWordsTask() {

    const task = wordsLevelState.currentTask;
    if (!task) return;

    speakEducational(task.value, { rate: 0.75 });
}

function retryCurrentWordsTask() {
    renderCurrentWordsTask();
}

/* =========================================================
   🏆 معالج نتيجة موحّد لكل مهام الكلمات (يستخدم نفس نظام
   النجوم والتقدم بالضبط — لا نظام مكافآت منفصل — ويحافظ على
   تكامل عدّاد correctWords للوحة المعلم والمهمة اليومية)
========================================================= */

function finishWordsChoiceTask(isCorrect, button) {

    const messageEl = $("wordMessage");
    const level = WORDS_LEVELS[wordsLevelState.levelId - 1];
    const task = wordsLevelState.currentTask;
    const itemKey = task.value;

    if (isCorrect) {

        if (button) button.classList.add("correct");

        correctWords++;
        saveCounters();
        addStars(5);

        if (typeof updateStats === "function") updateStats();
        if (typeof DailyQuest !== "undefined" && DailyQuest.checkProgress) {
            DailyQuest.checkProgress();
        }

        if (messageEl) {
            messageEl.textContent = "🎉 أحسنت! إجابة صحيحة ⭐";
            messageEl.className = "message correct";
        }

        speakEducational("أحسنت! إجابة صحيحة", { rate: 0.8 });

        document
            .querySelectorAll(
                "#wordsTaskStage .words-choice-btn, #wordsTaskStage .words-harakat-btn"
            )
            .forEach(btn => {
                btn.disabled = true;
                btn.classList.remove("hinted");
            });

        hideWordsHint();

        if (!task.isHarakaReview) {
            recordWordsOutcome(
                level.id, itemKey, true, getWordsPromptLevel(wordsWrongStreak)
            );
        }

        wordsWrongStreak = 0;

        onWordsLevelTaskCorrect();

        setTimeout(() => advanceWordsLevelTask(), 1200);

    } else {

        if (button) button.classList.add("wrong");

        if (messageEl) {
            messageEl.textContent = "😊 حاول مرة أخرى";
            messageEl.className = "message wrong";
        }

        speakEducational("حاول مرة أخرى", { rate: 0.8 });

        wordsWrongStreak++;

        if (!task.isHarakaReview) {
            recordWordsOutcome(
                level.id, itemKey, false, getWordsPromptLevel(wordsWrongStreak)
            );
        }

        applyWordsPrompting();

        /* 🌟 بعد ٣ محاولات (مستوى المساعدة الكامل/Errorless)، ننتقل
           بهدوء للمهمة التالية دون احتساب هذه كصحيحة ودون أي رسالة
           فشل — فقط نمنح وقتًا كافيًا لرؤية الإجابة الصحيحة المُضاءة
           قبل التقدّم. هذا يجعل عتبة ٨/١٠ ذات معنى فعلي، ويبقي
           المبدأ "بدون عقوبة" لأن الطفل لا يُحاسَب ولا يُمنع من
           إكمال المستوى أبدًا */
        if (wordsWrongStreak >= 3 && !task.isHarakaReview) {

            document
                .querySelectorAll(
                    "#wordsTaskStage .words-choice-btn, #wordsTaskStage .words-harakat-btn"
                )
                .forEach(btn => { btn.disabled = true; });

            setTimeout(() => {
                hideWordsHint();
                wordsWrongStreak = 0;
                advanceWordsLevelTask();
            }, 3000);
        }
    }
}

function onWordsLevelTaskCorrect() {

    /* مهام مراجعة الحركة الصريحة في بداية المستوى ٨ لا تُحتسب
       ضمن الـ١٠ الأساسية؛ نتقدّم فقط دون زيادة العداد النهائي
       حتى تبقى النتيجة من ١٠ متسقة */
    const task = wordsLevelState.currentTask;

    if (task && task.isHarakaReview) return;

    wordsLevelState.correctCount++;
    updateWordsScoreLabel();
}

function advanceWordsLevelTask() {

    const level = WORDS_LEVELS[wordsLevelState.levelId - 1];
    const task = wordsLevelState.currentTask;

    /* التقدّم أثناء مراجعة الحركة الصريحة (أول ٣ مهام بالمستوى ٨)
       — عدّاد reviewIndex مستقل تمامًا عن taskIndex، فلا حاجة
       لإعادة ضبط أي عدّاد؛ بمجرد أن يصل reviewIndex إلى ٣ فإن
       renderCurrentWordsTask ستنتقل تلقائيًا لمهام المقاطع
       الحقيقية (taskIndex ما زال ٠ كما بدأ تمامًا) */
    if (level.mode === "mixed-syllables" && task && task.isHarakaReview) {

        wordsLevelState.reviewIndex++;
        renderCurrentWordsTask();
        return;
    }

    wordsLevelState.taskIndex++;

    if (wordsLevelState.taskIndex >= 10) {
        finishWordsLevel();
        return;
    }

    renderCurrentWordsTask();
}

/* =========================================================
   🎉 إنهاء المستوى: فتح التالي عند ٨/١٠ فأكثر
========================================================= */

function finishWordsLevel() {

    const level = WORDS_LEVELS[wordsLevelState.levelId - 1];
    const score = wordsLevelState.correctCount;
    const passed = score >= 8;

    wordsLevelModeActive = false;

    saveWordsLevelBest(level.id, score);

    if (passed) {
        addStars(10);
        unlockWordsLevel(level.id + 1);
    }

    renderWordsLevelResultScreen(level, score, passed);
}

function renderWordsLevelResultScreen(level, score, passed) {

    const stage = $("wordsTaskStage");
    const messageEl = $("wordMessage");

    if (messageEl) {
        messageEl.textContent = "";
        messageEl.className = "message";
    }

    hideWordsHint();

    const nextLevel = WORDS_LEVELS[level.id];

    if (stage) {

        stage.innerHTML = `
            <div class="words-level-result-card">

                <div class="words-level-result-emoji">
                    ${passed ? "🏆" : "🌟"}
                </div>

                <div class="words-level-result-title">
                    ${passed ? "أحسنت! أكملت المستوى بنجاح" : "محاولة رائعة!"}
                </div>

                <div class="words-level-result-score">
                    النتيجة: ${arabicNumber(score)} / ١٠
                </div>

                ${passed && nextLevel ? `
                    <button class="success" type="button" onclick="openWordsLevel(${nextLevel.id})">
                        ➡️ المستوى التالي: ${nextLevel.title}
                    </button>
                ` : ""}

                ${!passed ? `
                    <button class="success" type="button" onclick="openWordsLevel(${level.id})">
                        🔁 إعادة المحاولة
                    </button>
                ` : ""}

                <button class="secondary" type="button" onclick="backToWordsLevels()">
                    🏠 كل المستويات
                </button>

            </div>
        `;
    }

    updateWordsProgressUI();

    speakEducational(
        passed ? "أحسنت! أكملت المستوى بنجاح" : "محاولة رائعة، لنحاول مرة أخرى",
        { rate: 0.8 }
    );
}

/* =========================================================
   🚪 نقطة الدخول: عرض شبكة المستويات دائمًا أولًا عند الدخول
   لقسم الكلمات (تغليف إضافي فوق showScreen الحالية بدون
   المساس بمنطقها أو بأي قسم آخر تتعامل معه)
========================================================= */

const showScreenBeforeWordsEngine = showScreen;

showScreen = function (screenId) {

    if (screenId === "words") {
        wordsLevelModeActive = false;
    }

    showScreenBeforeWordsEngine(screenId);

    if (screenId === "words") {

        const hub = $("wordsLevelsHub");
        const levelCard = $("wordsLevelCard");

        if (levelCard) levelCard.style.display = "none";
        if (hub) hub.style.display = "block";

        renderWordsLevelsHub();
    }
};

/* تهيئة أولية بعد تحميل الصفحة */

document.addEventListener("DOMContentLoaded", () => {
    if ($("wordsLevelsGrid")) {
        renderWordsLevelsHub();
    }
});

/* =========================================================
   🔚 نهاية قسم إعادة بناء "الكلمات" الجديد بالكامل
========================================================= */


/* =========================================================================
   🆕 =====================================================================
   🔤🎓 إعادة بناء قسم "الحروف" بالكامل — محرك جديد قائم على البيانات
   (Data-Driven Engine) مستقل تمامًا عن أي محرك أو بيانات قديمة لقسم
   الحروف. يُبقي فقط letters[] (بيانات قديمة تعتمد عليها أقسام أخرى:
   المطابقة، الكلمات، المكافآت) دون استخدامها كمصدر لهذا المحرك الجديد.
   =====================================================================
   Data Schema لكل حرف: { letter, words: [{word, image}, ...] }
   المحرك: level(4 مجموعات) → letter → 10 أنشطة متدرجة → progress
========================================================================= */

/* =========================================================
   📋 بيانات الحروف الـ٢٨ (من كتاب «حروفي الجميلة»)
   تحققت من صحة كل كلمة برمجيًا: تبدأ فعليًا بالحرف المستهدف
========================================================= */

const LETTER_UNITS = [
    { letter: "أ", words: [
        { word: "أناناس", image: "🍍" },
        { word: "أرنب", image: "🐰" },
        { word: "أسد", image: "🦁" },
        { word: "أم", image: "👩" },
        { word: "أذن", image: "👂" },
        { word: "أخطبوط", image: "🐙" }
    ]},
    { letter: "ب", words: [
        { word: "بيت", image: "🏠" },
        { word: "بنت", image: "👧" },
        { word: "بطة", image: "🦆" },
        { word: "باب", image: "🚪" },
        { word: "برتقال", image: "🍊" },
        { word: "بقرة", image: "🐄" },
        { word: "بطيخ", image: "🍉" }
    ]},
    { letter: "ت", words: [
        { word: "تفاح", image: "🍎" },
        { word: "تاج", image: "👑" },
        { word: "تمر", image: "🌴" },
        { word: "تين", image: "🍈" },
        { word: "تمساح", image: "🐊" },
        { word: "توت", image: "🫐" }
    ]},
    { letter: "ث", words: [
        { word: "ثعلب", image: "🦊" },
        { word: "ثوم", image: "🧄" },
        { word: "ثعبان", image: "🐍" },
        { word: "ثلاجة", image: "🧊" },
        { word: "ثلج", image: "❄️" }
    ]},
    { letter: "ج", words: [
        { word: "جسر", image: "🌉" },
        { word: "جبنة", image: "🧀" },
        { word: "جرس", image: "🔔" },
        { word: "جزر", image: "🥕" },
        { word: "جبل", image: "⛰️" },
        { word: "جمل", image: "🐪" }
    ]},
    { letter: "ح", words: [
        { word: "حصان", image: "🐎" },
        { word: "حليب", image: "🥛" },
        { word: "حذاء", image: "👞" },
        { word: "حوت", image: "🐳" },
        { word: "حقيبة", image: "🎒" }
    ]},
    { letter: "خ", words: [
        { word: "خيمة", image: "⛺" },
        { word: "خيار", image: "🥒" },
        { word: "خس", image: "🥬" },
        { word: "خوخ", image: "🍑" },
        { word: "خبز", image: "🍞" },
        { word: "خروف", image: "🐑" }
    ]},
    { letter: "د", words: [
        { word: "دجاجة", image: "🐔" },
        { word: "دب", image: "🐻" },
        { word: "ديك", image: "🐓" },
        { word: "دلفين", image: "🐬" },
        { word: "دفتر", image: "📓" },
        { word: "دراجة", image: "🚲" }
    ]},
    { letter: "ذ", words: [
        { word: "ذيل", image: "🦁" },
        { word: "ذهب", image: "🥇" },
        { word: "ذراع", image: "💪" },
        { word: "ذبابة", image: "🪰" },
        { word: "ذئب", image: "🐺" }
    ]},
    { letter: "ر", words: [
        { word: "رمل", image: "🏖️" },
        { word: "ريشة", image: "🪶" },
        { word: "رأس", image: "🗣️" },
        { word: "رجل", image: "🧍" }
    ]},
    { letter: "ز", words: [
        { word: "زهرة", image: "🌸" },
        { word: "زينة", image: "🎀" },
        { word: "زرافة", image: "🦒" },
        { word: "زيت", image: "🫒" },
        { word: "زيتون", image: "🫒" }
    ]},
    { letter: "س", words: [
        { word: "سفينة", image: "🚢" },
        { word: "سيارة", image: "🚗" },
        { word: "سمكة", image: "🐟" },
        { word: "ساعة", image: "⏰" },
        { word: "سرير", image: "🛏️" },
        { word: "سماء", image: "🌌" }
    ]},
    { letter: "ش", words: [
        { word: "شمس", image: "☀️" },
        { word: "شعر", image: "💇" },
        { word: "شجرة", image: "🌳" },
        { word: "شمعة", image: "🕯️" },
        { word: "شوكة", image: "🍴" },
        { word: "شباك", image: "🪟" }
    ]},
    { letter: "ص", words: [
        { word: "صندوق", image: "📦" },
        { word: "صالة", image: "🛋️" },
        { word: "صقر", image: "🦅" },
        { word: "صاروخ", image: "🚀" },
        { word: "صافرة", image: "📯" },
        { word: "صحن", image: "🍽️" },
        { word: "صبار", image: "🌵" }
    ]},
    { letter: "ض", words: [
        { word: "ضرس", image: "🦷" },
        { word: "ضفدع", image: "🐸" },
        { word: "ضابط", image: "👮‍♂️" },
        { word: "ضوء", image: "💡" }
    ]},
    { letter: "ط", words: [
        { word: "طباخ", image: "👨‍🍳" },
        { word: "طاولة", image: "🪑" },
        { word: "طبيب", image: "👨‍⚕️" },
        { word: "طائرة", image: "✈️" },
        { word: "طاووس", image: "🦚" },
        { word: "طفل", image: "👶" }
    ]},
    { letter: "ظ", words: [
        { word: "ظرف", image: "✉️" },
        { word: "ظفر", image: "💅" },
        { word: "ظل", image: "🌓" }
    ]},
    { letter: "ع", words: [
        { word: "علم", image: "🚩" },
        { word: "عصفور", image: "🐦" },
        { word: "عين", image: "👁️" },
        { word: "عنب", image: "🍇" },
        { word: "عسل", image: "🍯" },
        { word: "عصير", image: "🧃" }
    ]},
    { letter: "غ", words: [
        { word: "غسالة", image: "🧺" },
        { word: "غيوم", image: "☁️" },
        { word: "غراب", image: "🐦‍⬛" },
        { word: "غوريلا", image: "🦍" },
        { word: "غزالة", image: "🦌" }
    ]},
    { letter: "ف", words: [
        { word: "فراشة", image: "🦋" },
        { word: "فستان", image: "👗" },
        { word: "فانوس", image: "🏮" },
        { word: "فراولة", image: "🍓" },
        { word: "فيل", image: "🐘" },
        { word: "فأر", image: "🐭" }
    ]},
    { letter: "ق", words: [
        { word: "قميص", image: "👕" },
        { word: "قلم", image: "✏️" },
        { word: "قرد", image: "🐒" },
        { word: "قلب", image: "❤️" },
        { word: "قفاز", image: "🧤" },
        { word: "قصر", image: "🏰" }
    ]},
    { letter: "ك", words: [
        { word: "كرة", image: "⚽" },
        { word: "كأس", image: "🏆" },
        { word: "كلب", image: "🐶" },
        { word: "كرسي", image: "🪑" },
        { word: "كيك", image: "🎂" },
        { word: "كرز", image: "🍒" },
        { word: "كتاب", image: "📘" }
    ]},
    { letter: "ل", words: [
        { word: "ليمون", image: "🍋" },
        { word: "لبن", image: "🥛" },
        { word: "لحم", image: "🥩" },
        { word: "لمبة", image: "💡" },
        { word: "لعبة", image: "🧸" },
        { word: "لسان", image: "👅" }
    ]},
    { letter: "م", words: [
        { word: "مسبح", image: "🏊" },
        { word: "مدرسة", image: "🏫" },
        { word: "مسجد", image: "🕌" },
        { word: "مقص", image: "✂️" },
        { word: "مفتاح", image: "🔑" },
        { word: "موز", image: "🍌" }
    ]},
    { letter: "ن", words: [
        { word: "نسر", image: "🦅" },
        { word: "نحل", image: "🐝" },
        { word: "نجمة", image: "⭐" },
        { word: "نمر", image: "🐯" },
        { word: "نعامة", image: "🦤" },
        { word: "نخلة", image: "🌴" }
    ]},
    { letter: "ه", words: [
        { word: "هلال", image: "🌙" },
        { word: "هدهد", image: "🐦" },
        { word: "هدية", image: "🎁" },
        { word: "هاتف", image: "📱" },
        { word: "هرم", image: "🔺" }
    ]},
    { letter: "و", words: [
        { word: "وجه", image: "😊" },
        { word: "وردة", image: "🌹" },
        { word: "ولد", image: "👦" },
        { word: "وسادة", image: "🛏️" }
    ]},
    { letter: "ي", words: [
        { word: "يلعب", image: "⚽" },
        { word: "يوسفي", image: "🍊" },
        { word: "يد", image: "✋" },
        { word: "يخت", image: "🛥️" },
        { word: "يويو", image: "🪀" }
    ]}
];

function getLetterUnit(letterChar) {
    return LETTER_UNITS.find(u => u.letter === letterChar);
}

function pickRandomLetterWord(letterChar) {
    const unit = getLetterUnit(letterChar);
    if (!unit || !unit.words.length) return { word: letterChar, image: "❓" };
    return unit.words[Math.floor(Math.random() * unit.words.length)];
}

/* =========================================================
   📋 المستويات الأربعة (كما طُلب بالضبط)
========================================================= */

const LETTER_LEVEL_GROUPS = [
    { id: 1, letters: ["أ", "ب", "ت", "ث", "ج", "ح", "خ"] },
    { id: 2, letters: ["د", "ذ", "ر", "ز", "س", "ش", "ص"] },
    { id: 3, letters: ["ض", "ط", "ظ", "ع", "غ", "ف", "ق"] },
    { id: 4, letters: ["ك", "ل", "م", "ن", "ه", "و", "ي"] }
];

/* =========================================================
   🔤 أمثلة حقيقية موثّقة لموضع كل حرف داخل كلمات فعلية
   (منفصل/أول/وسط/آخر) — تم التحقق برمجيًا من صحة كل إدخال
   حسب قواعد الاتصال العربية الحقيقية (وليس تخمينًا)
========================================================= */

const LETTER_POSITION_EXAMPLES = [
    { letter: "أ", posKey: "isolated", word: "أرنب" },
    { letter: "أ", posKey: "final", word: "لجأ" },
    { letter: "ب", posKey: "initial", word: "بيت" },
    { letter: "ب", posKey: "medial", word: "سبع" },
    { letter: "ب", posKey: "final", word: "حليب" },
    { letter: "ت", posKey: "initial", word: "تفاح" },
    { letter: "ت", posKey: "medial", word: "كتاب" },
    { letter: "ت", posKey: "final", word: "بيت" },
    { letter: "ث", posKey: "initial", word: "ثعلب" },
    { letter: "ث", posKey: "medial", word: "مثل" },
    { letter: "ث", posKey: "final", word: "حديث" },
    { letter: "ج", posKey: "initial", word: "جمل" },
    { letter: "ج", posKey: "medial", word: "نجم" },
    { letter: "ج", posKey: "final", word: "نضج" },
    { letter: "ح", posKey: "initial", word: "حصان" },
    { letter: "ح", posKey: "medial", word: "بحر" },
    { letter: "ح", posKey: "final", word: "فتح" },
    { letter: "خ", posKey: "initial", word: "خروف" },
    { letter: "خ", posKey: "medial", word: "بخيل" },
    { letter: "خ", posKey: "final", word: "طبخ" },
    { letter: "د", posKey: "isolated", word: "دب" },
    { letter: "د", posKey: "final", word: "بلد" },
    { letter: "ذ", posKey: "isolated", word: "ذئب" },
    { letter: "ذ", posKey: "final", word: "نفذ" },
    { letter: "ر", posKey: "isolated", word: "رمل" },
    { letter: "ر", posKey: "final", word: "قمر" },
    { letter: "ز", posKey: "isolated", word: "زهرة" },
    { letter: "ز", posKey: "final", word: "خبز" },
    { letter: "س", posKey: "initial", word: "سمكة" },
    { letter: "س", posKey: "medial", word: "مسجد" },
    { letter: "س", posKey: "final", word: "جلس" },
    { letter: "ش", posKey: "initial", word: "شمس" },
    { letter: "ش", posKey: "final", word: "عطش" },
    { letter: "ص", posKey: "initial", word: "صقر" },
    { letter: "ص", posKey: "final", word: "قص" },
    { letter: "ض", posKey: "initial", word: "ضفدع" },
    { letter: "ض", posKey: "final", word: "بعض" },
    { letter: "ط", posKey: "initial", word: "طائرة" },
    { letter: "ط", posKey: "final", word: "خط" },
    { letter: "ظ", posKey: "initial", word: "ظرف" },
    { letter: "ظ", posKey: "final", word: "حفظ" },
    { letter: "ع", posKey: "initial", word: "عصفور" },
    { letter: "ع", posKey: "final", word: "سبع" },
    { letter: "غ", posKey: "initial", word: "غراب" },
    { letter: "غ", posKey: "final", word: "بلغ" },
    { letter: "ف", posKey: "initial", word: "فيل" },
    { letter: "ف", posKey: "medial", word: "سفينة" },
    { letter: "ف", posKey: "final", word: "كيف" },
    { letter: "ق", posKey: "initial", word: "قلم" },
    { letter: "ق", posKey: "final", word: "حق" },
    { letter: "ك", posKey: "initial", word: "كلب" },
    { letter: "ك", posKey: "medial", word: "مكتب" },
    { letter: "ك", posKey: "final", word: "ملك" },
    { letter: "ل", posKey: "initial", word: "ليمون" },
    { letter: "ل", posKey: "medial", word: "قلم" },
    { letter: "ل", posKey: "final", word: "جمل" },
    { letter: "م", posKey: "initial", word: "موز" },
    { letter: "م", posKey: "medial", word: "قمر" },
    { letter: "م", posKey: "final", word: "اسم" },
    { letter: "ن", posKey: "initial", word: "نمر" },
    { letter: "ن", posKey: "medial", word: "بنت" },
    { letter: "ن", posKey: "final", word: "لبن" },
    { letter: "ه", posKey: "initial", word: "هلال" },
    { letter: "ه", posKey: "final", word: "وجه" },
    { letter: "و", posKey: "isolated", word: "وردة" },
    { letter: "و", posKey: "final", word: "جو" },
    { letter: "ي", posKey: "initial", word: "يد" },
    { letter: "ي", posKey: "medial", word: "بيت" },
    { letter: "ي", posKey: "final", word: "نبي" }
];

function getLetterPositionExamples(letterChar) {
    return LETTER_POSITION_EXAMPLES.filter(e => e.letter === letterChar);
}

function pickLetterPositionExample(letterChar) {
    const list = getLetterPositionExamples(letterChar);
    if (!list.length) return null;
    return list[Math.floor(Math.random() * list.length)];
}

const ARABIC_POSITION_LABELS_LTR = {
    isolated: "منفصل",
    initial: "أول الكلمة",
    medial: "وسط الكلمة",
    final: "آخر الكلمة"
};

/* =========================================================
   🔡 قواعد اتصال الحروف العربية (منطق جديد كليًا، معزول عن
   أي كود قديم لقسم الحروف). يعتمد فقط على arabicLetterForms
   المشتركة (بيانات لغوية عامة يستخدمها قسم المطابقة أيضًا).
========================================================= */

const LTR_NON_CONNECTORS = new Set(["ا", "أ", "إ", "آ", "د", "ذ", "ر", "ز", "و"]);

function ltrFormKeyAtIndex(word, index) {
    const chars = Array.from(word);
    const n = chars.length;
    const current = chars[index];

    const hasIncoming = index > 0 && !LTR_NON_CONNECTORS.has(chars[index - 1]);
    const hasOutgoing = index < n - 1 && !LTR_NON_CONNECTORS.has(current);

    if (hasIncoming && hasOutgoing) return "medial";
    if (hasIncoming && !hasOutgoing) return "final";
    if (!hasIncoming && hasOutgoing) return "initial";
    return "isolated";
}

function ltrGlyphAtIndex(word, index) {
    const chars = Array.from(word);
    const letter = chars[index];
    const posKey = ltrFormKeyAtIndex(word, index);
    const forms = (typeof arabicLetterForms !== "undefined" && arabicLetterForms[letter]) || null;
    const glyph = (forms && (forms[posKey] || forms.isolated)) || letter;
    return { letter, posKey, glyph };
}

function ltrFormatGlyph(glyph, posKey) {
    if (!glyph) return "";
    if (posKey === "initial") return glyph + "ـ";
    if (posKey === "medial") return "ـ" + glyph + "ـ";
    if (posKey === "final") return "ـ" + glyph;
    return glyph;
}

/* =========================================================
   💾 حفظ التقدم (مفاتيح localStorage جديدة كليًا ومعزولة —
   لا علاقة لها بأي بيانات قديمة لقسم الحروف)
========================================================= */

function ltrLoadUnlockedLevel() {
    return Number(localStorage.getItem("taha_ltr2_unlocked_level") || 1);
}

function ltrSaveUnlockedLevel(n) {
    localStorage.setItem("taha_ltr2_unlocked_level", String(n));
}

function ltrUnlockLevel(n) {
    if (n > ltrLoadUnlockedLevel() && n - 1 <= ltrLoadUnlockedLevel()) ltrSaveUnlockedLevel(n);
}

function ltrLoadCompletedLetters() {
    try {
        return JSON.parse(localStorage.getItem("taha_ltr2_completed_letters") || "[]");
    } catch (error) {
        return [];
    }
}

function ltrMarkLetterCompleted(letterChar) {
    const list = ltrLoadCompletedLetters();
    if (!list.includes(letterChar)) {
        list.push(letterChar);
        localStorage.setItem("taha_ltr2_completed_letters", JSON.stringify(list));
    }
}

function ltrIsLetterCompleted(letterChar) {
    return ltrLoadCompletedLetters().includes(letterChar);
}

function ltrIsLevelCompleted(levelId) {
    const group = LETTER_LEVEL_GROUPS[levelId - 1];
    if (!group) return false;
    const completed = ltrLoadCompletedLetters();
    return group.letters.every(l => completed.includes(l));
}

/* =========================================================
   🧠 تسجيل الأداء + تكرار ذكي (معزول تمامًا بمفتاح جديد)
========================================================= */

function ltrLoadAdaptive() {
    try {
        return JSON.parse(localStorage.getItem("taha_ltr2_adaptive") || "{}");
    } catch (error) {
        return {};
    }
}

function ltrSaveAdaptive(data) {
    localStorage.setItem("taha_ltr2_adaptive", JSON.stringify(data));
}

function ltrRecordOutcome(letterChar, activityId, correct, promptLevel) {
    const data = ltrLoadAdaptive();
    if (!data[letterChar]) {
        data[letterChar] = { correct: 0, wrong: 0, promptUsage: { 0: 0, 1: 0, 2: 0, 3: 0 } };
    }
    const entry = data[letterChar];
    if (correct) entry.correct++; else entry.wrong++;
    entry.promptUsage[promptLevel] = (entry.promptUsage[promptLevel] || 0) + 1;
    ltrSaveAdaptive(data);
}

/* =========================================================
   🎯 مستويات المساعدة (ABA Prompting) — بدون عقوبة أبدًا
========================================================= */

let ltrWrongStreak = 0;

function ltrPromptLevel(streak) {
    if (streak <= 0) return 0;
    if (streak === 1) return 1;
    if (streak === 2) return 2;
    return 3;
}

function ltrShowHint(text) {
    const box = $("ltrHintBox");
    if (box) { box.textContent = text; box.classList.add("visible"); }
}

function ltrHideHint() {
    const box = $("ltrHintBox");
    if (box) { box.classList.remove("visible"); box.textContent = ""; }
}

function ltrHighlightCorrectChoice() {
    document
        .querySelectorAll(
            "#ltrActivityStage .ltr-choice-btn, " +
            "#ltrActivityStage .ltr-audio-choice-btn"
        )
        .forEach(btn => {
            if (btn.dataset.correct === "1" && !btn.disabled) btn.classList.add("hinted");
        });
}

function ltrApplyPrompting() {
    const level = ltrPromptLevel(ltrWrongStreak);
    if (level === 1) {
        ltrShowHint("🌟 استمع جيدًا مرة أخرى، ثم اختر بهدوء");
    } else if (level === 2) {
        ltrShowHint("🌟 أنت قريب جدًا! حاول مرة أخرى");
        ltrHighlightCorrectChoice();
    } else if (level >= 3) {
        ltrShowHint("🌟 لا بأس أبدًا! سأساعدك: هذه هي الإجابة الصحيحة ✅");
        ltrHighlightCorrectChoice();
    }
}

/* =========================================================
   🧮 حالة الجلسة الحالية
========================================================= */

const LTR_ACTIVITY_COUNT = 10;

/* =========================================================
   🔧 إصلاح: currentLetterIndex متغيّر عام كانت تعتمد عليه
   أقسام أخرى (نظام الشهادات/المكافآت يقرأ letters[currentLetterIndex])
   وكان مُعرَّفًا ضمن محرك الحروف القديم المحذوف. أُعيد تعريفه هنا
   لأن المحرك الجديد يُزامنه مع مصفوفة letters القديمة عند فتح أي
   حرف، دون استخدامه كمصدر بيانات للمحرك الجديد نفسه.
========================================================= */

let currentLetterIndex = 0;

let ltrModeActive = false;

let ltrState = {
    levelId: 1,
    letter: null,
    activityIndex: 0,
    currentActivityData: null,
    queue: []
};

/* =========================================================
   🏠 شبكة اختيار المجموعات (٤ مستويات)
========================================================= */

function renderLettersLevelsHub() {
    const grid = $("lettersLevelsGrid");
    if (!grid) return;

    const unlocked = StudentStore.eff(ltrLoadUnlockedLevel());

    grid.innerHTML = LETTER_LEVEL_GROUPS.map(group => {
        const isUnlocked = group.id <= unlocked;
        const isCompleted = ltrIsLevelCompleted(group.id);

        const classes = ["ltr-level-card-btn"];
        if (!isUnlocked) classes.push("locked");
        if (isCompleted) classes.push("completed");

        const lockIcon = isCompleted ? "✅" : (isUnlocked ? "🔓" : "🔒");

        return `
            <button
                class="${classes.join(" ")}"
                type="button"
                ${isUnlocked ? `onclick="openLettersLevel(${group.id})"` : `onclick="ltrShowLockedMessage()"`}
            >
                <span class="ltr-level-lock-icon">${lockIcon}</span>
                <span class="ltr-level-letters-preview">${group.letters.join(" ")}</span>
                <span class="ltr-level-name">المجموعة ${arabicNumber(group.id)}</span>
            </button>
        `;
    }).join("");
}

function ltrShowLockedMessage() {
    speakEducational("أكمل المجموعة السابقة أولًا لتفتح هذه المجموعة", { rate: 0.85 });
}

/* =========================================================
   🚪 التنقل: المستويات ← شبكة الحروف ← تفاصيل الحرف
========================================================= */

function openLettersLevel(levelId) {
    const unlocked = StudentStore.eff(ltrLoadUnlockedLevel());
    if (levelId > unlocked) { ltrShowLockedMessage(); return; }

    const group = LETTER_LEVEL_GROUPS[levelId - 1];
    if (!group) return;

    ltrState.levelId = levelId;

    const hub = $("lettersLevelsHub");
    const gridCard = $("lettersGridCard");
    const titleEl = $("lettersGridTitle");

    if (hub) hub.style.display = "none";
    if (gridCard) gridCard.style.display = "block";
    if (titleEl) titleEl.textContent = `المجموعة ${arabicNumber(levelId)}`;

    renderLettersGridForLevel(group);
}

function renderLettersGridForLevel(group) {
    const grid = $("lettersGrid");
    if (!grid) return;

    const completed = ltrLoadCompletedLetters();

    grid.innerHTML = group.letters.map(letterChar => {
        const isCompleted = completed.includes(letterChar);
        return `
            <button
                class="ltr-letter-card-btn ${isCompleted ? "completed" : ""}"
                type="button"
                onclick="openLetterDetail('${letterChar}')"
            >
                ${isCompleted ? `<span class="ltr-letter-badge">✅</span>` : ""}
                ${letterWithFatha(letterChar)}
            </button>
        `;
    }).join("");
}

function backToLettersLevels() {
    const hub = $("lettersLevelsHub");
    const gridCard = $("lettersGridCard");
    if (gridCard) gridCard.style.display = "none";
    if (hub) hub.style.display = "block";
    renderLettersLevelsHub();
}

function backToLettersGrid() {
    ltrModeActive = false;
    stopAllAudio();
    ltrHideHint();

    const detailCard = $("letterDetailCard");
    const gridCard = $("lettersGridCard");
    if (detailCard) detailCard.style.display = "none";
    if (gridCard) gridCard.style.display = "block";

    const group = LETTER_LEVEL_GROUPS[ltrState.levelId - 1];
    if (group) renderLettersGridForLevel(group);
}

function openLetterDetail(letterChar) {

    /* 🛡️ تحقق دفاعي: تأكد أن الحرف الممرَّر صحيح وله بيانات فعلية
       في LETTER_UNITS قبل أي شيء آخر — يمنع أي حالة صامتة لو وصل
       معرّف حرف غير متوقع، ويسجّل تحذيرًا واضحًا بدل الفشل الصامت */
    const unit = getLetterUnit(letterChar);
    if (!unit) {
        console.warn("openLetterDetail: لم يتم العثور على بيانات للحرف:", letterChar);
        return;
    }

    ltrModeActive = true;
    ltrWrongStreak = 0;

    ltrState.letter = letterChar;
    ltrState.activityIndex = 0;
    ltrState.currentActivityData = null;
    ltrState.queue = buildLetterActivityQueue(letterChar);

    /* مزامنة currentLetterIndex مع مصفوفة letters القديمة (بيانات
       مشتركة يعتمد عليها نظام الشهادات/المكافآت) — بلا استخدام أي
       من منطق أو دوال المحرك القديم، فقط تحديث الفهرس ليتوافق مع
       الحرف الذي يتدرب عليه الطفل فعليًا حاليًا.
       🛡️ تحقق دفاعي إضافي: لو تعذّر إيجاد تطابق أو كانت letters
       غير متاحة لأي سبب، نُبقي currentLetterIndex برقم صحيح آمن (٠)
       بدل تركه بقيمة قديمة غير متوافقة مع الحرف الحالي */
    let oldIndex = -1;
    if (typeof letters !== "undefined" && Array.isArray(letters)) {
        oldIndex = letters.findIndex(item => item.letter === letterChar);
    }
    currentLetterIndex = oldIndex !== -1 ? oldIndex : 0;

    const gridCard = $("lettersGridCard");
    const detailCard = $("letterDetailCard");
    const bigLetter = $("currentLetterDisplay");

    if (gridCard) gridCard.style.display = "none";
    if (detailCard) detailCard.style.display = "block";
    if (bigLetter) bigLetter.textContent = letterWithFatha(letterChar);

    renderCurrentLetterActivity();
}

/* =========================================================
   📊 عرض التقدم
========================================================= */

function updateLtrProgressUI() {
    const label = $("ltrProgressLabel");
    const fill = $("ltrProgressFill");
    const humanPos = ltrState.activityIndex + 1;
    const total = (ltrState.queue && ltrState.queue.length) || LTR_ACTIVITY_COUNT;

    if (label) {
        label.textContent = `النشاط ${arabicNumber(humanPos)} من ${arabicNumber(total)}`;
    }
    if (fill) {
        fill.style.width = ((humanPos / total) * 100) + "%";
    }
}

/* =========================================================
   🔊 نطق صوت الحرف الحالي — بالفتحة فقط، أبدًا اسم الحرف
========================================================= */

function speakCurrentLetter() {
    if (!ltrState.letter) return;
    speakEducational(letterWithFatha(ltrState.letter), { rate: 0.75 });
}

function playLetterAudio() {
    speakCurrentLetter();
}

/* ملاحظة: استُبدل السجل المسطّح القديم (10 أنشطة فقط) بنظام
   المراحل التسع الغني (LTR_STAGES + buildLetterActivityQueue)
   المعرَّف لاحقًا في هذا الملف — كل الدوال (activitySoundToLetter،
   activityLetterToPicture، إلخ) ما زالت مستخدَمة فعليًا هناك،
   فقط طريقة تجميعها في تسلسل الحرف تطوّرت لتصبح أغنى وأكثر تنوعًا. */

/* =========================================================
   🚦 موزّع عرض النشاط الحالي
========================================================= */

function renderCurrentLetterActivity() {
    const activity = ltrState.queue[ltrState.activityIndex];
    const stage = $("ltrActivityStage");
    const goalEl = $("ltrActivityGoal");
    const messageEl = $("letterMessage");

    ltrWrongStreak = 0;
    ltrHideHint();
    updateLtrProgressUI();

    if (messageEl) { messageEl.textContent = ""; messageEl.className = "message"; }
    if (goalEl) goalEl.textContent = activity ? activity.goal : "";
    if (!stage || !activity) return;

    activity.render(stage, ltrState.letter, activity.difficulty || 2);
}

function retryCurrentLetterActivity() {
    renderCurrentLetterActivity();
}

/* =========================================================
   🏆 معالج نتيجة موحّد (يستخدم نفس نظام النجوم والتقدم
   الحالي بالضبط — addStars/correctLetters/saveCounters —
   لا نظام مكافآت منفصل)
========================================================= */

function finishLtrChoiceTask(isCorrect, button) {
    const messageEl = $("letterMessage");
    const activity = ltrState.queue[ltrState.activityIndex];

    if (isCorrect) {
        if (button) button.classList.add("correct");

        correctLetters++;
        saveCounters();
        addStars(5);

        if (messageEl) {
            messageEl.textContent = "🎉 أحسنت! إجابة صحيحة ⭐";
            messageEl.className = "message correct";
        }

        speakEducational("أحسنت! إجابة صحيحة", { rate: 0.8 });

        document
            .querySelectorAll("#ltrActivityStage .ltr-choice-btn, #ltrActivityStage .ltr-multi-item, #ltrActivityStage .ltr-audio-choice-btn")
            .forEach(btn => { btn.disabled = true; btn.classList.remove("hinted"); });

        ltrHideHint();
        ltrRecordOutcome(ltrState.letter, activity.id, true, ltrPromptLevel(ltrWrongStreak));
        ltrWrongStreak = 0;

        setTimeout(() => advanceLtrActivity(), 1200);

    } else {
        /* عند الخطأ: بدون عقاب، وبدون تعطيل كل الأزرار، وبدون مؤقّت
           خفي يتجاوز الطفل تلقائيًا. نعطّل فقط الزر الخاطئ الذي
           ضغطه (ليتذكر أنه جرّبه)، ونقدّم مساعدة متدرّجة (تلميح ثم
           إبراز الإجابة الصحيحة)، وتبقى كل الأزرار الأخرى — وعلى
           رأسها الصحيحة — قابلة للضغط دائمًا ليُكمل الطفل بنفسه
           بمجرد أن يراها، فيحصل على شعور إنجاز حقيقي بدل أن يُنقَل
           تلقائيًا دون فعل منه */
        if (button) {
            button.classList.add("wrong");
            button.disabled = true;
        }

        if (messageEl) {
            messageEl.textContent = "😊 حاول مرة أخرى";
            messageEl.className = "message wrong";
        }

        speakEducational("حاول مرة أخرى", { rate: 0.8 });

        ltrWrongStreak++;
        ltrRecordOutcome(ltrState.letter, activity.id, false, ltrPromptLevel(ltrWrongStreak));

        ltrApplyPrompting();
    }
}

function advanceLtrActivity() {
    ltrState.activityIndex++;

    if (ltrState.activityIndex >= ltrState.queue.length) {
        finishLetterUnit();
        return;
    }

    renderCurrentLetterActivity();
}

/* =========================================================
   🎉 إنهاء الحرف: فتح المجموعة التالية عند إتمام كل حروفها
========================================================= */

function finishLetterUnit() {
    ltrModeActive = false;

    addStars(10);
    ltrMarkLetterCompleted(ltrState.letter);

    const group = LETTER_LEVEL_GROUPS[ltrState.levelId - 1];
    const allDone = ltrIsLevelCompleted(ltrState.levelId);

    if (allDone) {
        ltrUnlockLevel(ltrState.levelId + 1);
    }

    renderLtrResultScreen(allDone);
}

function renderLtrResultScreen(levelJustCompleted) {
    const stage = $("ltrActivityStage");
    const messageEl = $("letterMessage");
    const goalEl = $("ltrActivityGoal");

    if (messageEl) { messageEl.textContent = ""; messageEl.className = "message"; }
    if (goalEl) goalEl.textContent = "";

    ltrHideHint();

    const group = LETTER_LEVEL_GROUPS[ltrState.levelId - 1];
    const nextLetterChar = group ? group.letters.find(l => !ltrIsLetterCompleted(l)) : null;

    if (!stage) return;

    stage.innerHTML = `
        <div class="ltr-result-card">
            <div class="ltr-result-emoji">🏆</div>
            <div class="ltr-result-title">أحسنت! أتممت حرف ${letterWithFatha(ltrState.letter)}</div>
            ${levelJustCompleted ? `
                <div class="ltr-result-score">🎊 أكملت كل حروف هذه المجموعة!</div>
            ` : ""}
            ${nextLetterChar ? `
                <button class="success" type="button" onclick="openLetterDetail('${nextLetterChar}')">
                    ➡️ الحرف التالي: ${letterWithFatha(nextLetterChar)}
                </button>
            ` : ""}
            <button class="secondary" type="button" onclick="backToLettersGrid()">
                🏠 كل حروف المجموعة
            </button>
        </div>
    `;

    speakEducational("أحسنت! أتممت هذا الحرف بنجاح", { rate: 0.8 });
}

/* =========================================================
   🔍 خريطة الحروف المتشابهة بصريًا (جديدة كليًا ومعزولة عن
   أي بيانات قديمة) — لأغراض نشاط التمييز
========================================================= */

const LTR_SIMILAR_LETTERS = {
    "أ": ["ل", "ك"], "ب": ["ت", "ث", "ن", "ي"], "ت": ["ب", "ث", "ن", "ي"],
    "ث": ["ب", "ت", "ن", "ي"], "ج": ["ح", "خ"], "ح": ["ج", "خ"], "خ": ["ج", "ح"],
    "د": ["ذ"], "ذ": ["د"], "ر": ["ز"], "ز": ["ر"], "س": ["ش"], "ش": ["س"],
    "ص": ["ض"], "ض": ["ص"], "ط": ["ظ"], "ظ": ["ط"], "ع": ["غ"], "غ": ["ع"],
    "ف": ["ق"], "ق": ["ف"], "ك": ["ل", "أ"], "ل": ["ك", "أ"], "م": ["ه"],
    "ن": ["ب", "ت", "ث", "ي"], "ه": ["م"], "و": ["ف"], "ي": ["ب", "ت", "ث", "ن"]
};

/* =========================================================
   🧱 قالب عام لعرض خيارات نشاط (Activity Template مُعاد
   استخدامه في كل الأنشطة القائمة على الاختيار)
========================================================= */

function renderLtrChoices(container, choices, formatter, correctValue, onSelect) {
    const grid = document.createElement("div");
    grid.className = "ltr-choice-grid";

    choices.forEach(choice => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ltr-choice-btn";
        btn.innerHTML = formatter(choice);
        btn.dataset.correct = choice === correctValue ? "1" : "0";
        btn.onclick = () => onSelect(choice === correctValue, btn);
        grid.appendChild(btn);
    });

    container.appendChild(grid);
}

function ltrPickDistractorLetters(targetLetter, count) {
    const pool = LETTER_UNITS.map(u => u.letter).filter(l => l !== targetLetter);
    return shuffle(pool).slice(0, count);
}

/* =========================================================
   1️⃣ التعرف على الصوت: استمع ثم اختر الحرف
========================================================= */

function activitySoundToLetter(stage, letterChar, difficulty) {
    const distractorCount = (difficulty || 2) >= 2 ? 2 : 1;
    const distractors = ltrPickDistractorLetters(letterChar, distractorCount);
    const choices = shuffle([letterChar, ...distractors]);

    stage.innerHTML = `
        <div class="ltr-instruction-line">🔊 استمع ثم اختر الحرف الصحيح</div>
        <button class="secondary" type="button" id="ltrReplaySoundBtn">🔊 استمع مرة أخرى</button>
    `;

    const choicesContainer = document.createElement("div");
    stage.appendChild(choicesContainer);

    renderLtrChoices(
        choicesContainer,
        choices,
        c => letterWithFatha(c),
        letterChar,
        finishLtrChoiceTask
    );

    stage.querySelector("#ltrReplaySoundBtn").onclick = () => speakCurrentLetter();

    speakEducational(letterWithFatha(letterChar), { rate: 0.75 });
}

/* =========================================================
   2️⃣ التعرف على الحرف: يظهر الحرف، اختر الصوت المطابق
========================================================= */

function activityLetterRecognition(stage, letterChar, difficulty) {
    const distractorCount = (difficulty || 2) >= 2 ? 2 : 1;
    const distractors = ltrPickDistractorLetters(letterChar, distractorCount);
    const choices = shuffle([letterChar, ...distractors]);

    stage.innerHTML = `
        <div class="ltr-display-glyph">${letterWithFatha(letterChar)}</div>
        <div class="ltr-instruction-line">اضغط على الصوت الذي يطابق هذا الحرف</div>
    `;

    const grid = document.createElement("div");
    grid.className = "ltr-choice-grid";

    choices.forEach(c => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ltr-choice-btn";
        btn.innerHTML = "🔊";
        btn.dataset.correct = c === letterChar ? "1" : "0";
        btn.onclick = () => {
            if (btn.disabled) return;
            btn.disabled = true;
            speakEducational(letterWithFatha(c), { rate: 0.75 });
            setTimeout(() => finishLtrChoiceTask(c === letterChar, btn), 500);
        };
        grid.appendChild(btn);
    });

    stage.appendChild(grid);
}

/* =========================================================
   3️⃣ التمييز: ابحث عن الحرف بين حروف متشابهة
========================================================= */

function activityDiscrimination(stage, letterChar, difficulty) {
    const distractorCount = (difficulty || 2) >= 2 ? 2 : 1;
    const similar = LTR_SIMILAR_LETTERS[letterChar] || ltrPickDistractorLetters(letterChar, distractorCount);
    const distractors = shuffle(similar).slice(0, distractorCount);
    const choices = shuffle([letterChar, ...distractors]);

    stage.innerHTML = `
        <div class="ltr-instruction-line">أين حرف ${letterWithFatha(letterChar)}؟ اضغط عليه</div>
    `;

    const choicesContainer = document.createElement("div");
    stage.appendChild(choicesContainer);

    renderLtrChoices(
        choicesContainer,
        choices,
        c => c,
        letterChar,
        finishLtrChoiceTask
    );

    speakEducational(letterWithFatha(letterChar), { rate: 0.75 });
}

/* =========================================================
   4️⃣ أشكال الحرف: معرض + اختيار الشكل الصحيح للموضع
========================================================= */

function activityLetterForms(stage, letterChar, difficulty) {
    const forms = (typeof arabicLetterForms !== "undefined" && arabicLetterForms[letterChar]) || {};
    const availableKeys = Object.keys(forms);
    const extraCount = (difficulty || 2) >= 2 ? 2 : 1;

    const galleryHtml = availableKeys.map(key => `
        <div class="ltr-forms-card">
            <div class="ltr-forms-glyph">${ltrFormatGlyph(forms[key], key)}</div>
            <div class="ltr-forms-label">${arabicFormPositionLabels[key] || key}</div>
        </div>
    `).join("");

    const correctKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
    let choiceKeys = shuffle(availableKeys.filter(k => k !== correctKey)).slice(0, extraCount);
    choiceKeys.push(correctKey);
    choiceKeys = shuffle([...new Set(choiceKeys)]);

    const positionLabel = arabicFormPositionLabels[correctKey] || correctKey;

    stage.innerHTML = `
        <div class="ltr-forms-gallery">${galleryHtml}</div>
        <button class="secondary" type="button" id="ltrFormsReplayBtn">🔊 استمع للسؤال مرة أخرى</button>
        <div class="ltr-instruction-line">
            أين شكل الحرف عندما يكون <strong>${positionLabel}</strong>؟
        </div>
    `;

    const choicesContainer = document.createElement("div");
    stage.appendChild(choicesContainer);

    renderLtrChoices(
        choicesContainer,
        choiceKeys,
        key => ltrFormatGlyph(forms[key], key),
        correctKey,
        finishLtrChoiceTask
    );

    const playQuestion = () => {
        speakEducational(letterWithFatha(letterChar), { rate: 0.75 });
        setTimeout(() => speakEducational(positionLabel, { rate: 0.75 }), 650);
    };
    stage.querySelector("#ltrFormsReplayBtn").onclick = playQuestion;
    setTimeout(playQuestion, 300);
}

/* =========================================================
   5️⃣ موضع الحرف في الكلمة (بيانات حقيقية موثّقة)
========================================================= */

function activityPositionInWord(stage, letterChar, difficulty) {
    const example = pickLetterPositionExample(letterChar) || {
        letter: letterChar, posKey: "initial", word: getLetterUnit(letterChar).words[0].word
    };
    const extraCount = (difficulty || 2) >= 2 ? 2 : 1;

    stage.innerHTML = `
        <div class="ltr-display-glyph" style="font-size:clamp(36px,8vw,54px);">${example.word}</div>
        <button class="secondary" type="button" id="ltrPositionReplayBtn">🔊 استمع للكلمة مرة أخرى</button>
        <div class="ltr-instruction-line">
            أين يوجد حرف ${letterWithFatha(letterChar)} في هذه الكلمة؟
        </div>
    `;

    const allKeys = ["initial", "medial", "final", "isolated"];
    let choiceKeys = shuffle(allKeys.filter(k => k !== example.posKey)).slice(0, extraCount);
    choiceKeys.push(example.posKey);
    choiceKeys = shuffle([...new Set(choiceKeys)]);

    const choicesContainer = document.createElement("div");
    stage.appendChild(choicesContainer);

    renderLtrChoices(
        choicesContainer,
        choiceKeys,
        key => arabicFormPositionLabels[key] || key,
        example.posKey,
        finishLtrChoiceTask
    );

    const playWord = () => speakEducational(example.word, { rate: 0.78 });
    stage.querySelector("#ltrPositionReplayBtn").onclick = playWord;
    setTimeout(playWord, 300);
}

/* =========================================================
   6️⃣ الحرف والصورة: اختر الصورة التي تبدأ بالحرف
========================================================= */

function activityLetterToPicture(stage, letterChar, difficulty) {
    const correctWord = pickRandomLetterWord(letterChar);

    const distractorCount = (difficulty || 2) >= 2 ? 2 : 1;
    const distractorLetters = ltrPickDistractorLetters(letterChar, distractorCount);
    const distractorWords = distractorLetters.map(l => pickRandomLetterWord(l));

    const choices = shuffle([correctWord, ...distractorWords]);

    stage.innerHTML = `
        <div class="ltr-display-glyph">${letterWithFatha(letterChar)}</div>
        <div class="ltr-instruction-line">اختر الصورة التي تبدأ بهذا الحرف</div>
    `;

    const choicesContainer = document.createElement("div");
    stage.appendChild(choicesContainer);

    renderLtrChoices(
        choicesContainer,
        choices,
        c => c.image,
        correctWord,
        finishLtrChoiceTask
    );
}

/* =========================================================
   7️⃣ الصورة والكلمة: تظهر صورة، اختر الكلمة الصحيحة
========================================================= */

function activityPictureToWord(stage, letterChar) {
    const correctWord = pickRandomLetterWord(letterChar);
    const unit = getLetterUnit(letterChar);

    const otherWords = unit.words.filter(w => w.word !== correctWord.word);
    const distractorWords = shuffle(otherWords).slice(0, 2);

    let choices = [correctWord, ...distractorWords];

    /* في حال عدم توفر كلمتين إضافيتين من نفس الحرف، أكمل
       ببعض كلمات من حروف أخرى لضمان ٣ خيارات دائمًا */
    if (choices.length < 3) {
        const extraLetters = ltrPickDistractorLetters(letterChar, 3 - choices.length);
        extraLetters.forEach(l => choices.push(pickRandomLetterWord(l)));
    }

    choices = shuffle(choices);

    stage.innerHTML = `
        <div class="ltr-display-emoji">${correctWord.image}</div>
        <div class="ltr-instruction-line">اختر الكلمة الصحيحة لهذه الصورة</div>
    `;

    const choicesContainer = document.createElement("div");
    stage.appendChild(choicesContainer);

    renderLtrChoices(
        choicesContainer,
        choices,
        c => c.word,
        correctWord,
        finishLtrChoiceTask
    );

    speakEducational(correctWord.word, { rate: 0.78 });
}

/* =========================================================
   8️⃣ الكلمات التي تبدأ بالحرف (اختيار متعدد من شبكة صور)
========================================================= */

function activityWordsStartingWith(stage, letterChar, difficulty) {
    const unit = getLetterUnit(letterChar);
    const easy = (difficulty || 2) <= 1;

    const correctCount = Math.min(easy ? 2 : 3, unit.words.length);
    const correctWords = shuffle(unit.words).slice(0, correctCount);

    const distractorCount = easy ? 2 : 3;
    const distractorLetters = ltrPickDistractorLetters(letterChar, distractorCount);
    const distractorWords = distractorLetters.map(l => pickRandomLetterWord(l));

    const allItems = shuffle([
        ...correctWords.map(w => ({ ...w, isCorrect: true })),
        ...distractorWords.map(w => ({ ...w, isCorrect: false }))
    ]);

    stage.innerHTML = `
        <div class="ltr-instruction-line">
            اضغط على كل الصور التي تبدأ بحرف ${letterWithFatha(letterChar)}
        </div>
        <div class="ltr-multi-grid" id="ltrMultiGrid"></div>
    `;

    const grid = stage.querySelector("#ltrMultiGrid");
    let remainingCorrect = correctWords.length;
    let done = false;
    const wrongState = {};
    ltrHideHint();

    allItems.forEach(item => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ltr-multi-item";
        btn.textContent = item.image;
        btn.dataset.correct = item.isCorrect ? "1" : "0";

        btn.onclick = () => {
            if (btn.disabled || done) return;
            btn.disabled = true;

            if (item.isCorrect) {
                btn.classList.add("selected-correct");
                remainingCorrect--;
                speakEducational("صحيح", { rate: 0.85 });

                if (remainingCorrect <= 0) {
                    done = true;
                    ltrHideHint();
                    grid.querySelectorAll(".ltr-multi-item").forEach(b => { b.disabled = true; });
                    finishLtrChoiceTask(true, null);
                }
            } else {
                btn.classList.add("selected-wrong");
                speakEducational("حاول مرة أخرى", { rate: 0.85 });
                setTimeout(() => {
                    btn.classList.remove("selected-wrong");
                    btn.disabled = false;
                }, 500);
                ltrMultiSelectWrongAttempt(wrongState, grid, ".ltr-multi-item");
            }
        };

        grid.appendChild(btn);
    });
}

/* =========================================================
   ✍️ محرك التتبع (Canvas) — جديد كليًا ومعزول
========================================================= */

function ltrSetupTraceCanvas(canvas) {
    const ctx = canvas.getContext("2d");

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#1565c0";
    }
    resize();

    let drawing = false;

    function getPos(event) {
        const rect = canvas.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    canvas.addEventListener("pointerdown", event => {
        drawing = true;
        const pos = getPos(event);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        try { canvas.setPointerCapture(event.pointerId); } catch (e) {}
    });

    canvas.addEventListener("pointermove", event => {
        if (!drawing) return;
        const pos = getPos(event);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    });

    function stop() { drawing = false; }
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);

    return { clear() { ctx.clearRect(0, 0, canvas.width, canvas.height); } };
}

/* =========================================================
   9️⃣ التتبع والكتابة
========================================================= */

function activityTracing(stage, letterChar) {
    stage.innerHTML = `
        <div class="ltr-instruction-line">تتبّع شكل الحرف بإصبعك ✍️</div>
        <div class="ltr-trace-wrapper">
            <div class="ltr-trace-canvas-box">
                <div class="ltr-trace-guide">${letterWithFatha(letterChar)}</div>
                <canvas class="ltr-trace-canvas" id="ltrTraceCanvas"></canvas>
            </div>
            <div>
                <button class="secondary" type="button" id="ltrTraceClearBtn">🧹 مسح</button>
                <button class="primary" type="button" id="ltrTraceDoneBtn">✅ تم</button>
            </div>
        </div>
    `;

    const canvas = stage.querySelector("#ltrTraceCanvas");
    const controls = ltrSetupTraceCanvas(canvas);

    stage.querySelector("#ltrTraceClearBtn").onclick = () => controls.clear();

    const traceDoneBtn = stage.querySelector("#ltrTraceDoneBtn");
    traceDoneBtn.onclick = () => {
        if (traceDoneBtn.disabled) return;
        traceDoneBtn.disabled = true;
        finishLtrChoiceTask(true, null);
    };
}

/* =========================================================
   🔟 المراجعة: مزيج عشوائي من الأنشطة السابقة
========================================================= */

/* ملاحظة: تم نقل نشاط "المراجعة" (activityReview) وتطويره ليصبح
   جزءًا من نظام المراحل التسع الجديد أدناه (بنك أوسع، وتحيّز
   نحو نقاط ضعف الطفل الفعلية) — تعريفه النهائي موجود لاحقًا
   في قسم "تطوير قسم الحروف — نظام تدرّج صوتي احترافي". */

/* =========================================================================
   🔗 دوال توافق (Compatibility Stubs) — فقط لمنع أي خطأ خارج
   قسم الحروف. لا تغيّر أي سلوك أو تصميم أو بيانات لأي قسم آخر.
   نقاط الاعتماد الخارجية المكتشفة أثناء الفحص:
   - showScreen الأصلية تستدعي renderLetterPage() و addLetterGameStyles()
     عند الدخول لشاشة "letters".
   - مستمع DOMContentLoaded الأصلي يستدعي renderLetterPage() و
     addLetterGameStyles() أيضًا.
   - كتلة "تصدير الدوال إلى window" تشير إلى: nextLetter,
     nextLetterGame, resetLetterGames (بالإضافة إلى speakCurrentLetter/
     playLetterAudio المُعرَّفتين أعلاه كدوال حقيقية ذات معنى).
========================================================================= */

function renderLetterPage() {
    /* لا حاجة لأي تنفيذ: العرض الجديد يُدار بالكامل عبر
       renderLettersLevelsHub / renderLettersGridForLevel /
       renderCurrentLetterActivity، ولا يعتمد على هذه الدالة إطلاقًا. */
}

function addLetterGameStyles() {
    /* لا حاجة لحقن أنماط ديناميكيًا؛ التصميم الجديد بالكامل
       داخل style.css بأصناف ثابتة (ltr-*). */
}

function nextLetter() {
    /* مفهوم "الحرف التالي" أصبح جزءًا من محرك المستويات الجديد
       (انظر renderLtrResultScreen) وليس دالة عامة منفصلة. تبقى
       هذه الدالة موجودة فقط لمنع خطأ في كتلة تصدير window. */
}

function nextLetterGame() {
    /* لا وجود لمفهوم "الألعاب العشرين" في المحرك الجديد. */
}

function resetLetterGames() {
    /* غير مستخدمة في المحرك الجديد. */
}

/* =========================================================
   🚪 نقطة الدخول: عرض شبكة المستويات دائمًا أولًا عند الدخول
   لقسم الحروف (تغليف إضافي فوق showScreen الحالية بدون
   المساس بمنطقها أو بأي قسم آخر تتعامل معه)
========================================================= */

const showScreenBeforeLettersRebuild = showScreen;

showScreen = function (screenId) {
    if (screenId === "letters") {
        ltrModeActive = false;
    }

    showScreenBeforeLettersRebuild(screenId);

    if (screenId === "letters") {
        const hub = $("lettersLevelsHub");
        const gridCard = $("lettersGridCard");
        const detailCard = $("letterDetailCard");

        if (gridCard) gridCard.style.display = "none";
        if (detailCard) detailCard.style.display = "none";
        if (hub) hub.style.display = "block";

        renderLettersLevelsHub();
    }
};

/* تهيئة أولية بعد تحميل الصفحة */

document.addEventListener("DOMContentLoaded", () => {
    if ($("lettersLevelsGrid")) {
        renderLettersLevelsHub();
    }
});

/* =========================================================
   🔚 نهاية إعادة بناء قسم "الحروف" بالكامل
========================================================= */


/* =========================================================================
   🆕 =====================================================================
   🎯 تطوير قسم "الحروف" — نظام تدرّج صوتي احترافي (٩ مراحل، بنك
   أنشطة غني لكل مرحلة) مبني على تحليل كامل لكتاب «حروفي الجميلة»
   =====================================================================
   قاعدة صارمة: كل الأمثلة الصوتية هنا تحقّقت من نطقها الفعلي
   بالفتحة كلمة كلمة (وليس تخمينًا) — لا نخلط أبدًا بين صوت الحرف
   بالفتحة ووجوده بحركة أخرى.
========================================================================= */

/* =========================================================
   🔊 بنك الكلمات "المؤكَّدة صوتيًا" — فقط الكلمات التي يُنطق
   فيها الحرف الهدف فعليًا بالفتحة، للاستخدام الحصري في أي
   نشاط يدّعي "صوت الحرف بالفتحة" (المراحل ٢، ٣، ٥، ٦).
   بنك الكلمات الأصلي (LETTER_UNITS) يبقى كما هو للأنشطة
   البصرية البحتة التي لا تدّعي صوتًا محددًا.
========================================================= */

const LETTER_SOUND_WORDS = {
    "أ": [{ word: "أناناس", image: "🍍" }, { word: "أرنب", image: "🐰" }, { word: "أسد", image: "🦁" }],
    "ب": [{ word: "بيت", image: "🏠" }, { word: "بطة", image: "🦆" }, { word: "باب", image: "🚪" }, { word: "بقرة", image: "🐄" }, { word: "بطيخ", image: "🍉" }],
    "ت": [{ word: "تاج", image: "👑" }, { word: "تمر", image: "🌴" }],
    "ث": [{ word: "ثعلب", image: "🦊" }, { word: "ثلاجة", image: "🧊" }, { word: "ثلج", image: "❄️" }],
    "ج": [{ word: "جرس", image: "🔔" }, { word: "جزر", image: "🥕" }, { word: "جبل", image: "⛰️" }, { word: "جمل", image: "🐪" }],
    "ح": [{ word: "حليب", image: "🥛" }, { word: "حقيبة", image: "🎒" }],
    "خ": [{ word: "خيمة", image: "⛺" }, { word: "خس", image: "🥬" }, { word: "خوخ", image: "🍑" }, { word: "خروف", image: "🐑" }],
    "د": [{ word: "دجاجة", image: "🐔" }, { word: "دفتر", image: "📓" }, { word: "دراجة", image: "🚲" }],
    "ذ": [{ word: "ذيل", image: "🦁" }, { word: "ذهب", image: "🥇" }],
    "ر": [{ word: "رمل", image: "🏖️" }, { word: "رأس", image: "🗣️" }, { word: "رجل", image: "🧍" }],
    "ز": [{ word: "زهرة", image: "🌸" }, { word: "زرافة", image: "🦒" }, { word: "زيت", image: "🫒" }, { word: "زيتون", image: "🫒" }],
    "س": [{ word: "سفينة", image: "🚢" }, { word: "سيارة", image: "🚗" }, { word: "سمكة", image: "🐟" }, { word: "ساعة", image: "⏰" }, { word: "سرير", image: "🛏️" }, { word: "سماء", image: "🌌" }],
    "ش": [{ word: "شمس", image: "☀️" }, { word: "شعر", image: "💇" }, { word: "شجرة", image: "🌳" }, { word: "شمعة", image: "🕯️" }, { word: "شوكة", image: "🍴" }],
    "ص": [{ word: "صالة", image: "🛋️" }, { word: "صقر", image: "🦅" }, { word: "صاروخ", image: "🚀" }, { word: "صافرة", image: "📯" }, { word: "صحن", image: "🍽️" }, { word: "صبار", image: "🌵" }],
    "ض": [{ word: "ضابط", image: "👮‍♂️" }, { word: "ضوء", image: "💡" }],
    "ط": [{ word: "طباخ", image: "👨‍🍳" }, { word: "طاولة", image: "🪑" }, { word: "طبيب", image: "👨‍⚕️" }, { word: "طائرة", image: "✈️" }, { word: "طاووس", image: "🦚" }],
    "ظ": [{ word: "ظرف", image: "✉️" }, { word: "ظلام", image: "🌑" }, { word: "ظهر", image: "🔙" }],
    "ع": [{ word: "علم", image: "🚩" }, { word: "عين", image: "👁️" }, { word: "عسل", image: "🍯" }, { word: "عصير", image: "🧃" }],
    "غ": [{ word: "غسالة", image: "🧺" }, { word: "غزالة", image: "🦌" }],
    "ف": [{ word: "فراشة", image: "🦋" }, { word: "فانوس", image: "🏮" }, { word: "فراولة", image: "🍓" }, { word: "فأر", image: "🐭" }],
    "ق": [{ word: "قميص", image: "👕" }, { word: "قلم", image: "✏️" }, { word: "قلب", image: "❤️" }, { word: "قصر", image: "🏰" }],
    "ك": [{ word: "كأس", image: "🏆" }, { word: "كلب", image: "🐶" }, { word: "كيك", image: "🎂" }, { word: "كرز", image: "🍒" }],
    "ل": [{ word: "ليمون", image: "🍋" }, { word: "لبن", image: "🥛" }, { word: "لحم", image: "🥩" }, { word: "لمبة", image: "💡" }],
    "م": [{ word: "مسبح", image: "🏊" }, { word: "مدرسة", image: "🏫" }, { word: "مسجد", image: "🕌" }, { word: "موز", image: "🍌" }],
    "ن": [{ word: "نسر", image: "🦅" }, { word: "نحل", image: "🐝" }, { word: "نجمة", image: "⭐" }, { word: "نعامة", image: "🦤" }, { word: "نخلة", image: "🌴" }],
    "ه": [{ word: "هدية", image: "🎁" }, { word: "هاتف", image: "📱" }, { word: "هرم", image: "🔺" }],
    "و": [{ word: "وجه", image: "😊" }, { word: "وردة", image: "🌹" }, { word: "ولد", image: "👦" }],
    "ي": [{ word: "يلعب", image: "⚽" }, { word: "يد", image: "✋" }, { word: "يخت", image: "🛥️" }]
};

function getLetterSoundWords(letterChar) {
    return LETTER_SOUND_WORDS[letterChar] || [];
}

function pickRandomSoundWord(letterChar) {
    const list = getLetterSoundWords(letterChar);
    if (!list.length) return pickRandomLetterWord(letterChar);
    return list[Math.floor(Math.random() * list.length)];
}

/* =========================================================
   🔉 خريطة التشابه الصوتي (مخارج نطق حقيقية فقط — معزولة
   تمامًا عن خريطة التشابه البصري LTR_SIMILAR_LETTERS)
========================================================= */

const LETTER_PHONETIC_NEIGHBORS = {
    "ت": ["ط"], "ط": ["ت"],
    "د": ["ض"], "ض": ["د"],
    "س": ["ص"], "ص": ["س"],
    "ذ": ["ظ", "ز"], "ظ": ["ذ"], "ز": ["ذ"],
    "ث": ["س"],
    "ح": ["ه"], "ه": ["ح"],
    "خ": ["غ"], "غ": ["خ"],
    "ق": ["ك"], "ك": ["ق"],
    "م": ["ن"], "ن": ["م"],
    "ب": ["م"],
    "ر": ["ل"], "ل": ["ر"]
};

function getPhoneticNeighbors(letterChar) {
    return LETTER_PHONETIC_NEIGHBORS[letterChar] || [];
}

/* يبني مشتِّتًا صوتيًا مناسبًا: من خريطة التشابه الحقيقية إن
   وُجدت، وإلا حرفًا بعيدًا صوتيًا بوضوح (بدل تشابه مصطنع) */
function pickPhoneticDistractor(letterChar, excludeList) {
    const exclude = new Set([letterChar, ...(excludeList || [])]);
    const neighbors = getPhoneticNeighbors(letterChar).filter(l => !exclude.has(l));

    if (neighbors.length) {
        return neighbors[Math.floor(Math.random() * neighbors.length)];
    }

    const distant = LETTER_UNITS
        .map(u => u.letter)
        .filter(l => !exclude.has(l) && !getPhoneticNeighbors(l).includes(letterChar));

    return shuffle(distant)[0];
}

/* =========================================================
   1️⃣ المرحلة ١: أسمع الصوت (تعرّض سمعي هادئ، بلا اختبار)
========================================================= */

function activityListenIsolated(stage, letterChar) {
    stage.innerHTML = `
        <div class="ltr-instruction-line">🔊 استمع للصوت، واضغط عليه كما تحب</div>
        <button type="button" class="ltr-pulse-letter-btn" id="ltrPulseLetterBtn">
            ${letterWithFatha(letterChar)}
        </button>
        <button type="button" class="primary" id="ltrListenDoneBtn" style="margin-top:18px;">
            ✅ تم
        </button>
    `;

    const pulseBtn = stage.querySelector("#ltrPulseLetterBtn");
    const playSound = () => {
        pulseBtn.classList.add("pulsing");
        speakEducational(letterWithFatha(letterChar), { rate: 0.7 });
        setTimeout(() => pulseBtn.classList.remove("pulsing"), 700);
    };

    pulseBtn.onclick = playSound;

    const listenDoneBtn = stage.querySelector("#ltrListenDoneBtn");
    listenDoneBtn.onclick = () => {
        if (listenDoneBtn.disabled) return;
        listenDoneBtn.disabled = true;
        finishLtrChoiceTask(true, null);
    };

    setTimeout(playSound, 300);
}

function activityListenInWord(stage, letterChar) {
    const item = pickRandomSoundWord(letterChar);

    stage.innerHTML = `
        <div class="ltr-instruction-line">🔊 استمع للحرف داخل هذه الكلمة</div>
        <div class="ltr-display-emoji">${item.image}</div>
        <div class="ltr-display-glyph" style="font-size:clamp(30px,7vw,44px);">${item.word}</div>
        <button type="button" class="secondary" id="ltrListenWordReplay">🔊 استمع مرة أخرى</button>
        <button type="button" class="primary" id="ltrListenWordDone" style="margin-top:14px;">✅ تم</button>
    `;

    const playAll = () => {
        speakEducational(letterWithFatha(letterChar), { rate: 0.75 });
        setTimeout(() => speakEducational(item.word, { rate: 0.75 }), 700);
    };

    stage.querySelector("#ltrListenWordReplay").onclick = playAll;

    const listenWordDoneBtn = stage.querySelector("#ltrListenWordDone");
    listenWordDoneBtn.onclick = () => {
        if (listenWordDoneBtn.disabled) return;
        listenWordDoneBtn.disabled = true;
        finishLtrChoiceTask(true, null);
    };

    setTimeout(playAll, 300);
}

/* =========================================================
   2️⃣ المرحلة ٢: أميز الصوت سمعيًا (٤ أنماط، بلا أي حرف مكتوب)
========================================================= */

/* أ) سماع واختيار المطابق */
function activityAuditoryMatch(stage, letterChar, difficulty) {
    const useHardDistractor = (difficulty || 2) >= 3;
    const optionCount = (difficulty || 2) >= 2 ? 3 : 2;

    const distantPool = LETTER_UNITS.map(u => u.letter).filter(l =>
        l !== letterChar && !getPhoneticNeighbors(letterChar).includes(l));

    const distractorLetters = [];
    if (useHardDistractor) {
        const phonetic = pickPhoneticDistractor(letterChar, []);
        if (phonetic) distractorLetters.push(phonetic);
    }
    while (distractorLetters.length < optionCount - 1) {
        const pick = shuffle(distantPool.filter(l => !distractorLetters.includes(l)))[0];
        if (!pick) break;
        distractorLetters.push(pick);
    }

    const options = shuffle([
        { letter: letterChar, correct: true },
        ...distractorLetters.map(l => ({ letter: l, correct: false }))
    ]);

    stage.innerHTML = `
        <div class="ltr-instruction-line">🔊 استمع، ثم اضغط على الصوت المطابق</div>
        <button type="button" class="secondary" id="ltrAudioReplay">🔊 استمع للصوت الهدف</button>
        <div class="ltr-audio-btn-row" id="ltrAudioOptions"></div>
    `;

    const row = stage.querySelector("#ltrAudioOptions");
    const colors = ["#42a5f5", "#66bb6a"];

    options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ltr-audio-choice-btn";
        btn.style.background = colors[i % colors.length];
        btn.innerHTML = "🔊";
        btn.dataset.correct = opt.correct ? "1" : "0";
        btn.onclick = () => {
            if (btn.disabled) return;
            btn.disabled = true;
            speakEducational(letterWithFatha(opt.letter), { rate: 0.75 });
            setTimeout(() => finishLtrChoiceTask(opt.correct, btn), 550);
        };
        row.appendChild(btn);
    });

    stage.querySelector("#ltrAudioReplay").onclick = () =>
        speakEducational(letterWithFatha(letterChar), { rate: 0.75 });

    setTimeout(() => speakEducational(letterWithFatha(letterChar), { rate: 0.75 }), 300);
}

function activityAuditoryMatchEasy(stage, letterChar, difficulty) {
    activityAuditoryMatch(stage, letterChar, difficulty || 1);
}

function activityAuditoryMatchHard(stage, letterChar, difficulty) {
    activityAuditoryMatch(stage, letterChar, Math.max(difficulty || 3, 3));
}

/* ب) متشابهان أم مختلفان؟ */
function activityAuditorySameDifferent(stage, letterChar) {
    const same = Math.random() < 0.5;

    let secondLetter;
    if (same) {
        secondLetter = letterChar;
    } else {
        const useNeighbor = Math.random() < 0.5;
        secondLetter = useNeighbor
            ? pickPhoneticDistractor(letterChar, [])
            : shuffle(LETTER_UNITS.map(u => u.letter).filter(l =>
                l !== letterChar && !getPhoneticNeighbors(letterChar).includes(l)))[0];
    }

    stage.innerHTML = `
        <div class="ltr-instruction-line">🔊 استمع للصوتين، هل هما متشابهان أم مختلفان؟</div>
        <div class="ltr-audio-btn-row">
            <button type="button" class="secondary" id="ltrPlayFirst">🔊 الأول</button>
            <button type="button" class="secondary" id="ltrPlaySecond">🔊 الثاني</button>
        </div>
        <div class="ltr-choice-grid" id="ltrSameDiffChoices" style="grid-template-columns:repeat(2,1fr);"></div>
    `;

    stage.querySelector("#ltrPlayFirst").onclick = () =>
        speakEducational(letterWithFatha(letterChar), { rate: 0.75 });
    stage.querySelector("#ltrPlaySecond").onclick = () =>
        speakEducational(letterWithFatha(secondLetter), { rate: 0.75 });

    const grid = stage.querySelector("#ltrSameDiffChoices");

    [{ label: "🟰 متشابهان", value: true }, { label: "✖️ مختلفان", value: false }].forEach(opt => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ltr-choice-btn";
        btn.textContent = opt.label;
        btn.dataset.correct = opt.value === same ? "1" : "0";
        btn.onclick = () => finishLtrChoiceTask(opt.value === same, btn);
        grid.appendChild(btn);
    });

    setTimeout(() => {
        speakEducational(letterWithFatha(letterChar), { rate: 0.75 });
        setTimeout(() => speakEducational(letterWithFatha(secondLetter), { rate: 0.75 }), 750);
    }, 300);
}

/* ج) اكتشف الصوت المستهدف بين عدة أصوات (ذاتي الوتيرة تمامًا) */
function activityAuditoryFindTarget(stage, letterChar) {
    const distractors = shuffle(
        LETTER_UNITS.map(u => u.letter).filter(l => l !== letterChar)
    ).slice(0, 2);

    const options = shuffle([letterChar, ...distractors]);

    stage.innerHTML = `
        <div class="ltr-instruction-line">🔊 تعرّف على الصوت الهدف أولًا</div>
        <button type="button" class="secondary" id="ltrTargetIntro">🔊 هذا هو الصوت المطلوب</button>
        <div class="ltr-instruction-line" style="margin-top:14px;">
            🔊 اضغط على الزر الذي فيه الصوت نفسه
        </div>
        <div class="ltr-audio-btn-row" id="ltrFindTargetRow"></div>
    `;

    stage.querySelector("#ltrTargetIntro").onclick = () =>
        speakEducational(letterWithFatha(letterChar), { rate: 0.75 });

    const row = stage.querySelector("#ltrFindTargetRow");
    const colors = ["#42a5f5", "#66bb6a"];

    options.forEach((letter, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ltr-audio-choice-btn";
        btn.style.background = colors[i % colors.length];
        btn.innerHTML = "🔊";
        btn.dataset.correct = letter === letterChar ? "1" : "0";
        btn.onclick = () => {
            if (btn.disabled) return;
            btn.disabled = true;
            speakEducational(letterWithFatha(letter), { rate: 0.75 });
            setTimeout(() => finishLtrChoiceTask(letter === letterChar, btn), 550);
        };
        row.appendChild(btn);
    });

    setTimeout(() => speakEducational(letterWithFatha(letterChar), { rate: 0.75 }), 300);
}

/* د) مراجعة سمعية مختلطة بسيطة */
function activityAuditoryMixedReview(stage, letterChar, difficulty) {
    const variants = [activityAuditoryMatchEasy, activityAuditorySameDifferent];
    variants[Math.floor(Math.random() * variants.length)](stage, letterChar, difficulty);
}

/* =========================================================
   3️⃣ المرحلة ٣ (تكملة): ربط الصوت بالحرف — نسخة أصعب
   (خيار ثالث من التشابه الصوتي الحقيقي إن وُجد)
========================================================= */

function activitySoundToLetterHard(stage, letterChar) {
    const distractor1 = pickPhoneticDistractor(letterChar, []);
    const distractor2 = shuffle(
        LETTER_UNITS.map(u => u.letter).filter(l =>
            l !== letterChar && l !== distractor1)
    )[0];

    const choices = shuffle([letterChar, distractor1, distractor2].filter(Boolean));

    stage.innerHTML = `
        <div class="ltr-instruction-line">🔊 استمع بعناية، ثم اختر الحرف الصحيح</div>
        <button class="secondary" type="button" id="ltrReplaySoundBtnHard">🔊 استمع مرة أخرى</button>
    `;

    const choicesContainer = document.createElement("div");
    stage.appendChild(choicesContainer);

    renderLtrChoices(
        choicesContainer,
        choices,
        c => letterWithFatha(c),
        letterChar,
        finishLtrChoiceTask
    );

    stage.querySelector("#ltrReplaySoundBtnHard").onclick = () => speakCurrentLetter();
    speakEducational(letterWithFatha(letterChar), { rate: 0.75 });
}

/* =========================================================
   4️⃣ المرحلة ٤ (جديد): ابحث ولوّن — موزاييك مبسّط مستوحى
   من الكتاب (شبكة صغيرة بدل ٢٤ خانة، مشتِّت واحد فقط)
========================================================= */

/* =========================================================
   🆘 مساعدة متدرّجة مشتركة لأنشطة الاختيار المتعدد (موزاييك/
   شطب/عجلة/شبكة الكلمات) — بدون عقاب وبدون تعطيل شامل، فقط
   تلميح هادئ ثم إضاءة العناصر الصحيحة المتبقية بعد عدة محاولات
   خاطئة (نفس فلسفة المساعدة التدريجية في بقية الأنشطة)
========================================================= */

function ltrMultiSelectWrongAttempt(state, container, itemSelector) {
    state.wrongCount = (state.wrongCount || 0) + 1;

    if (state.wrongCount === 2) {
        ltrShowHint("🌟 خذ وقتك، وابحث بعناية");
    } else if (state.wrongCount >= 4) {
        ltrShowHint("🌟 لا بأس أبدًا! العناصر المضيئة هي الصحيحة ✅");
        container.querySelectorAll(itemSelector).forEach(el => {
            if (!el.disabled && el.dataset.correct === "1") el.classList.add("hinted");
        });
    }
}

function activityMosaicSearch(stage, letterChar, difficulty) {
    const easy = (difficulty || 2) <= 1;
    const GRID_SIZE = easy ? 6 : 9;
    const distractorLetter = LTR_SIMILAR_LETTERS[letterChar]
        ? shuffle(LTR_SIMILAR_LETTERS[letterChar])[0]
        : shuffle(LETTER_UNITS.map(u => u.letter).filter(l => l !== letterChar))[0];

    const targetCount = easy ? 4 : 5;
    const cells = [];
    for (let i = 0; i < targetCount; i++) cells.push(letterChar);
    while (cells.length < GRID_SIZE) cells.push(distractorLetter);
    const shuffled = shuffle(cells);

    stage.innerHTML = `
        <div class="ltr-instruction-line">
            🔍 ابحث عن حرف ${letterWithFatha(letterChar)} ولوّنه لتكتشف المفاجأة
        </div>
        <div class="ltr-mosaic-grid" id="ltrMosaicGrid"></div>
    `;

    const grid = stage.querySelector("#ltrMosaicGrid");
    let remaining = targetCount;
    const wrongState = {};
    ltrHideHint();

    shuffled.forEach(letter => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "ltr-mosaic-cell";
        cell.textContent = letter;
        cell.dataset.correct = letter === letterChar ? "1" : "0";

        cell.onclick = () => {
            if (cell.disabled) return;

            if (letter === letterChar) {
                cell.classList.add("revealed");
                cell.disabled = true;
                remaining--;
                if (remaining <= 0) {
                    ltrHideHint();
                    grid.querySelectorAll(".ltr-mosaic-cell").forEach(c => { c.disabled = true; });
                    finishLtrChoiceTask(true, null);
                }
            } else {
                cell.classList.add("wrong-flash");
                speakEducational("حاول مرة أخرى", { rate: 0.85 });
                setTimeout(() => cell.classList.remove("wrong-flash"), 400);
                ltrMultiSelectWrongAttempt(wrongState, grid, ".ltr-mosaic-cell");
            }
        };

        grid.appendChild(cell);
    });
}

/* =========================================================
   4️⃣ المرحلة ٤ (جديد): الشطب على الحرف — شبكة مبسّطة
   (٣×٣ بدل ٦×٦، مشتِّت واحد أو اثنان)
========================================================= */

function activityCrossOutGrid(stage, letterChar, difficulty) {
    const easy = (difficulty || 2) <= 1;
    const distractorTypeCount = easy ? 1 : 2;
    const gridSize = easy ? 6 : 9;

    const distractors = LTR_SIMILAR_LETTERS[letterChar]
        ? shuffle(LTR_SIMILAR_LETTERS[letterChar]).slice(0, distractorTypeCount)
        : shuffle(LETTER_UNITS.map(u => u.letter).filter(l => l !== letterChar)).slice(0, distractorTypeCount);

    const targetCount = easy ? 3 : 4;
    const cells = [];
    for (let i = 0; i < targetCount; i++) cells.push(letterChar);
    while (cells.length < gridSize) {
        cells.push(distractors[cells.length % distractors.length]);
    }
    const shuffled = shuffle(cells);

    stage.innerHTML = `
        <div class="ltr-instruction-line">
            ✖️ اضغط لتشطب كل حرف ${letterWithFatha(letterChar)} في الشبكة
        </div>
        <div class="ltr-mosaic-grid" id="ltrCrossoutGrid"></div>
    `;

    const grid = stage.querySelector("#ltrCrossoutGrid");
    let remaining = targetCount;
    const wrongState = {};
    ltrHideHint();

    shuffled.forEach(letter => {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "ltr-mosaic-cell";
        cell.textContent = letter;
        cell.dataset.correct = letter === letterChar ? "1" : "0";

        cell.onclick = () => {
            if (cell.disabled) return;

            if (letter === letterChar) {
                cell.classList.add("crossed-out");
                cell.disabled = true;
                remaining--;
                if (remaining <= 0) {
                    ltrHideHint();
                    grid.querySelectorAll(".ltr-mosaic-cell").forEach(c => { c.disabled = true; });
                    finishLtrChoiceTask(true, null);
                }
            } else {
                cell.classList.add("wrong-flash");
                speakEducational("حاول مرة أخرى", { rate: 0.85 });
                setTimeout(() => cell.classList.remove("wrong-flash"), 400);
                ltrMultiSelectWrongAttempt(wrongState, grid, ".ltr-mosaic-cell");
            }
        };

        grid.appendChild(cell);
    });
}

/* =========================================================
   5️⃣ المرحلة ٥ (جديد): عجلة الوصل الدائرية — مطابقة بصريًا
   لتصميم الكتاب، تستخدم حصريًا الكلمات المؤكَّدة صوتيًا
========================================================= */

function activityConnectWheel(stage, letterChar, difficulty) {
    const totalItems = (difficulty || 2) <= 1 ? 4 : 6;
    const soundWords = getLetterSoundWords(letterChar);
    const correctCount = Math.min(Math.ceil(totalItems / 2), soundWords.length);
    const correctItems = shuffle(soundWords).slice(0, correctCount);

    const distractorLetters = shuffle(
        LETTER_UNITS.map(u => u.letter).filter(l => l !== letterChar)
    ).slice(0, totalItems - correctCount);

    const distractorItems = distractorLetters.map(l => pickRandomSoundWord(l));

    const allItems = shuffle([
        ...correctItems.map(w => ({ ...w, isCorrect: true })),
        ...distractorItems.map(w => ({ ...w, isCorrect: false }))
    ]);

    stage.innerHTML = `
        <div class="ltr-instruction-line">🎡 صِل الحرف بالصور التي تبدأ بصوته</div>
        <div class="ltr-wheel-wrapper">
            <div class="ltr-wheel-center">${letterWithFatha(letterChar)}</div>
            <div class="ltr-wheel-ring" id="ltrWheelRing"></div>
        </div>
    `;

    const ring = stage.querySelector("#ltrWheelRing");
    let remainingCorrect = correctItems.length;
    const wrongState = {};
    ltrHideHint();

    allItems.forEach((item, i) => {
        const angle = (360 / allItems.length) * i;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ltr-wheel-item";
        btn.style.transform = `rotate(${angle}deg) translate(120px) rotate(-${angle}deg)`;
        btn.textContent = item.image;
        btn.dataset.correct = item.isCorrect ? "1" : "0";

        btn.onclick = () => {
            if (btn.disabled) return;

            if (item.isCorrect) {
                btn.classList.add("selected-correct");
                btn.disabled = true;
                remainingCorrect--;
                speakEducational("صحيح", { rate: 0.85 });

                if (remainingCorrect <= 0) {
                    ltrHideHint();
                    ring.querySelectorAll(".ltr-wheel-item").forEach(b => { b.disabled = true; });
                    finishLtrChoiceTask(true, null);
                }
            } else {
                btn.classList.add("selected-wrong");
                speakEducational("حاول مرة أخرى", { rate: 0.85 });
                setTimeout(() => btn.classList.remove("selected-wrong"), 500);
                ltrMultiSelectWrongAttempt(wrongState, ring, ".ltr-wheel-item");
            }
        };

        ring.appendChild(btn);
    });
}

/* =========================================================
   5️⃣ المرحلة ٥ (تكملة): نسخة صوتية آمنة من "الحرف والصورة"
   تستخدم حصريًا LETTER_SOUND_WORDS (بدل البنك الكامل)
========================================================= */

function activityLetterToPictureSound(stage, letterChar, difficulty) {
    const correctWord = pickRandomSoundWord(letterChar);

    const distractorCount = (difficulty || 2) >= 2 ? 2 : 1;
    const distractorLetters = ltrPickDistractorLetters(letterChar, distractorCount);
    const distractorWords = distractorLetters.map(l => pickRandomSoundWord(l));

    const choices = shuffle([correctWord, ...distractorWords]);

    stage.innerHTML = `
        <div class="ltr-display-glyph">${letterWithFatha(letterChar)}</div>
        <div class="ltr-instruction-line">اختر الصورة التي تبدأ بصوت هذا الحرف</div>
    `;

    const choicesContainer = document.createElement("div");
    stage.appendChild(choicesContainer);

    renderLtrChoices(
        choicesContainer,
        choices,
        c => c.image,
        correctWord,
        finishLtrChoiceTask
    );

    speakEducational(letterWithFatha(letterChar), { rate: 0.75 });
}

/* =========================================================
   6️⃣ المرحلة ٦: أتعرف عليه داخل الكلمات (اكتشاف وجود الصوت)
   — مهارة وعي صوتي/سمعي بحتة، منفصلة تمامًا عن المرحلة ٧
   (التي تختبر الشكل الكتابي حسب الموضع، لا الصوت).
   كل الكلمات هنا من LETTER_SOUND_WORDS المؤكَّدة صوتيًا فقط —
   لا نسأل أبدًا "هل تسمع بَ" عن كلمة ليس فيها الحرف بالفتحة فعلًا.
========================================================= */

/* أ) هل تسمع هذا الصوت في الكلمة؟ (نعم/لا) */
function activityHearInWordYesNo(stage, letterChar) {
    const useCorrect = Math.random() < 0.5;

    let word, isPresent;

    if (useCorrect) {
        word = pickRandomSoundWord(letterChar);
        isPresent = true;
    } else {
        const otherLetters = LETTER_UNITS
            .map(u => u.letter)
            .filter(l => l !== letterChar && getLetterSoundWords(l).length > 0);
        const otherLetter = shuffle(otherLetters)[0];
        word = pickRandomSoundWord(otherLetter);
        isPresent = false;
    }

    stage.innerHTML = `
        <div class="ltr-instruction-line">🔊 استمع للكلمة</div>
        <div class="ltr-display-emoji">${word.image}</div>
        <button type="button" class="secondary" id="ltrHearWordReplay">🔊 استمع للكلمة</button>
        <div class="ltr-instruction-line" style="margin-top:14px;">
            هل سمعت صوت ${letterWithFatha(letterChar)} في هذه الكلمة؟
        </div>
        <div class="ltr-choice-grid" id="ltrYesNoChoices" style="grid-template-columns:repeat(2,1fr);"></div>
    `;

    const playWord = () => speakEducational(word.word, { rate: 0.75 });
    stage.querySelector("#ltrHearWordReplay").onclick = playWord;

    const grid = stage.querySelector("#ltrYesNoChoices");

    [{ label: "✅ نعم", value: true }, { label: "❌ لا", value: false }].forEach(opt => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ltr-choice-btn";
        btn.textContent = opt.label;
        btn.dataset.correct = opt.value === isPresent ? "1" : "0";
        btn.onclick = () => finishLtrChoiceTask(opt.value === isPresent, btn);
        grid.appendChild(btn);
    });

    setTimeout(playWord, 300);
}

/* ب) أي كلمة فيها الصوت المستهدف؟ */
function activityHearInWordChoose(stage, letterChar, difficulty) {
    const correctWord = pickRandomSoundWord(letterChar);

    const otherLetters = LETTER_UNITS
        .map(u => u.letter)
        .filter(l => l !== letterChar && getLetterSoundWords(l).length > 0);

    const distractorCount = (difficulty || 2) >= 2 ? 2 : 1;
    const distractorLetters = shuffle(otherLetters).slice(0, distractorCount);
    const distractorWords = distractorLetters.map(l => pickRandomSoundWord(l));

    const choices = shuffle([correctWord, ...distractorWords]);

    stage.innerHTML = `
        <div class="ltr-instruction-line">
            🔊 استمع لصوت ${letterWithFatha(letterChar)}، ثم اضغط على الكلمة التي تحتوي عليه
        </div>
        <button type="button" class="secondary" id="ltrTargetSoundReplay">🔊 صوت الحرف</button>
        <div class="ltr-choice-grid" id="ltrHearChooseGrid"></div>
    `;

    stage.querySelector("#ltrTargetSoundReplay").onclick = () =>
        speakEducational(letterWithFatha(letterChar), { rate: 0.75 });

    const grid = stage.querySelector("#ltrHearChooseGrid");

    choices.forEach(w => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ltr-choice-btn";
        btn.innerHTML = w.image;
        btn.dataset.correct = w.word === correctWord.word ? "1" : "0";
        btn.onclick = () => {
            if (btn.disabled) return;
            btn.disabled = true;
            speakEducational(w.word, { rate: 0.75 });
            setTimeout(() => finishLtrChoiceTask(w.word === correctWord.word, btn), 550);
        };
        grid.appendChild(btn);
    });

    setTimeout(() => speakEducational(letterWithFatha(letterChar), { rate: 0.75 }), 300);
}

/* ج) نسخة صوتية آمنة من "الصورة والكلمة" — تربط الصوت
   المسموع بكتابته الصحيحة، تستخدم حصريًا كلمات مؤكَّدة */
function activityPictureToWordSound(stage, letterChar) {
    const correctWord = pickRandomSoundWord(letterChar);
    const soundWords = getLetterSoundWords(letterChar);

    let distractorWords = shuffle(soundWords.filter(w => w.word !== correctWord.word)).slice(0, 2);

    if (distractorWords.length < 2) {
        const extra = ltrPickDistractorLetters(letterChar, 2 - distractorWords.length)
            .map(l => pickRandomSoundWord(l));
        distractorWords = [...distractorWords, ...extra];
    }

    const choices = shuffle([correctWord, ...distractorWords]);

    stage.innerHTML = `
        <div class="ltr-display-emoji">${correctWord.image}</div>
        <div class="ltr-instruction-line">استمع، ثم اختر الكلمة الصحيحة</div>
        <button type="button" class="secondary" id="ltrPtwReplay">🔊 استمع</button>
    `;

    const choicesContainer = document.createElement("div");
    stage.appendChild(choicesContainer);

    renderLtrChoices(
        choicesContainer,
        choices,
        c => c.word,
        correctWord,
        finishLtrChoiceTask
    );

    const playWord = () => speakEducational(correctWord.word, { rate: 0.78 });
    stage.querySelector("#ltrPtwReplay").onclick = playWord;
    setTimeout(playWord, 300);
}

/* =========================================================
   8️⃣ المرحلة ٨ (جديد): تتبّع الحرف داخل كلمة نموذجية
   (نقل مهارة التتبّع لسياق كلمة حقيقية، كما بالصفحة الثامنة
   من كل حرف في الكتاب — ديك/دب لحرف الدال مثلًا)
========================================================= */

function activityTraceInWord(stage, letterChar) {
    const item = pickRandomSoundWord(letterChar);

    stage.innerHTML = `
        <div class="ltr-instruction-line">تتبّع الحرف ${letterWithFatha(letterChar)} داخل هذه الكلمة ✍️</div>
        <div class="ltr-trace-wrapper">
            <div class="ltr-display-emoji">${item.image}</div>
            <div class="ltr-trace-canvas-box">
                <div class="ltr-trace-guide" style="font-size:clamp(60px,14vw,120px);">${item.word}</div>
                <canvas class="ltr-trace-canvas" id="ltrTraceWordCanvas"></canvas>
            </div>
            <div>
                <button class="secondary" type="button" id="ltrTraceWordClearBtn">🧹 مسح</button>
                <button class="primary" type="button" id="ltrTraceWordDoneBtn">✅ تم</button>
            </div>
        </div>
    `;

    const canvas = stage.querySelector("#ltrTraceWordCanvas");
    const controls = ltrSetupTraceCanvas(canvas);

    stage.querySelector("#ltrTraceWordClearBtn").onclick = () => controls.clear();

    const traceWordDoneBtn = stage.querySelector("#ltrTraceWordDoneBtn");
    traceWordDoneBtn.onclick = () => {
        if (traceWordDoneBtn.disabled) return;
        traceWordDoneBtn.disabled = true;
        finishLtrChoiceTask(true, null);
    };

    speakEducational(item.word, { rate: 0.75 });
}

/* =========================================================================
   📋 سجل المراحل التسع — كل مرحلة تحوي عدة أنشطة بديلة (بنك غني)
   يُبنى منها تسلسل فعلي لكل حرف عند فتحه (buildLetterActivityQueue)
========================================================================= */

const LTR_STAGES = [
    {
        id: "listen",
        goal: "أسمع الصوت",
        activities: [activityListenIsolated, activityListenInWord]
    },
    {
        id: "auditory-discrimination",
        goal: "أميز الصوت سمعيًا",
        activities: [
            activityAuditoryMatchEasy,
            activityAuditorySameDifferent,
            activityAuditoryFindTarget,
            activityAuditoryMatchHard,
            activityAuditoryMixedReview
        ]
    },
    {
        id: "sound-to-letter",
        goal: "أربط الصوت بالحرف",
        activities: [activitySoundToLetter, activitySoundToLetterHard, activityLetterRecognition]
    },
    {
        id: "visual-discrimination",
        goal: "أميز الحرف بصريًا",
        activities: [
            activityMosaicSearch,
            activityCrossOutGrid,
            activityDiscrimination,
            activityWordsStartingWith,
            activityLetterToPicture
        ]
    },
    {
        id: "link-to-picture",
        goal: "أربطه بالصورة",
        activities: [activityConnectWheel, activityLetterToPictureSound]
    },
    {
        id: "discover-in-word",
        goal: "أتعرف عليه داخل الكلمات",
        activities: [
            activityHearInWordYesNo,
            activityHearInWordChoose
        ]
    },
    {
        id: "shape-by-position",
        goal: "أميز أشكاله",
        activities: [activityPositionInWord, activityLetterForms]
    },
    {
        id: "trace-write",
        goal: "أتتبع وأكتب",
        activities: [activityTracing, activityTraceInWord]
    }
];

/* =========================================================
   🧩 بناء تسلسل الأنشطة الفعلي لحرف معيّن — يمر بكل الأنشطة
   في كل مرحلة (وليس عشوائيًا واحدًا فقط)، بترتيب المراحل، ثم
   يضيف مرحلة المراجعة التكيّفية في النهاية
========================================================= */

function buildLetterActivityQueue(letterChar) {

    const queue = [];

    LTR_STAGES.forEach(stage => {
        stage.activities.forEach((activityFn, posInStage) => {
            /* 🎚️ تدرّج صعوبة حقيقي داخل كل مرحلة: أول نشاط سهل
               (خيارات أقل)، ثم متوسط، ثم متقدم (خيارات/مشتتات
               أكثر تدريجيًا) — وليس نفس الصعوبة دائمًا */
            const difficulty = posInStage === 0 ? 1 : (posInStage === 1 ? 2 : 3);

            queue.push({
                id: stage.id,
                stageId: stage.id,
                goal: stage.goal,
                difficulty,
                render: activityFn
            });
        });
    });

    /* مرحلة المراجعة الختامية: نشاطان يسحبان من بنك متنوع،
       بتحيّز نحو المرحلة التي سجّل الطفل فيها أخطاء أكثر */
    queue.push({ id: "review", stageId: "review", goal: "أراجع", difficulty: 2, render: activityReview });
    queue.push({ id: "review", stageId: "review", goal: "أراجع", difficulty: 2, render: activityReview });

    return queue;
}

/* =========================================================
   9️⃣ المرحلة ٩: مراجعة تكيّفية — تسحب من بنك الأنشطة الكامل
   بتحيّز نحو المراحل التي أخطأ فيها الطفل أكثر
========================================================= */

function activityReview(stage, letterChar, difficulty) {

    const adaptive = ltrLoadAdaptive();
    const entry = adaptive[letterChar];

    const reviewPool = [
        activityAuditoryMatchEasy,
        activitySoundToLetter,
        activityDiscrimination,
        activityConnectWheel,
        activityHearInWordYesNo,
        activityPositionInWord
    ];

    const chosen = reviewPool[Math.floor(Math.random() * reviewPool.length)];

    /* إن كان الطفل قد أخطأ كثيرًا في هذا الحرف، نراجع بصعوبة
       أسهل لبناء الثقة أولًا بدل زيادة التحدي عليه */
    const strugglingHere = entry && entry.wrong > 0 && entry.wrong > entry.correct * 0.4;
    const effectiveDifficulty = strugglingHere ? 1 : (difficulty || 2);

    chosen(stage, letterChar, effectiveDifficulty);
}


/* =========================================================================
   🆕 =====================================================================
   🧑‍🎓 طبقة بيانات الطالب الموحّدة — المرحلة الأولى
   =====================================================================
   لا تُعدّل ولا تحذف ولا تُعيد تسمية أي مفتاح localStorage قديم.
   تُضيف فقط: معرّف طالب ثابت (studentId) + سجل أحداث زمني جديد،
   وتُركّب "عرضًا موحّدًا" (getProfile) حيًّا من البيانات الموجودة
   فعليًا في كل مرة يُطلب فيها — لا تُخزَّن نسخة مكرَّرة أبدًا، لذا
   يستحيل أن تتعارض هذه الطبقة مع أي بيانات قديمة أو تُفقدها.
========================================================================= */

const StudentData = (function () {

    const STUDENT_ID_KEY = "taha_student_id";
    const EVENT_LOG_KEY = "taha_event_log";
    const EVENT_LOG_MAX_ENTRIES = 500;

    /* -----------------------------------------------------------
       🆔 معرّف الطالب الثابت — يُنشأ مرة واحدة فقط عند أول تشغيل
       بعد هذا التحديث، ثم يبقى كما هو إلى الأبد على هذا الجهاز
    ----------------------------------------------------------- */

    function generateId() {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return "stu_" + crypto.randomUUID();
        }
        return "stu_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
    }

    function getStudentId() {
        let id = localStorage.getItem(STUDENT_ID_KEY);
        if (!id) {
            id = generateId();
            localStorage.setItem(STUDENT_ID_KEY, id);
        }
        return id;
    }

    /* -----------------------------------------------------------
       📜 سجل الأحداث الزمني — يبدأ التسجيل من هذه اللحظة فصاعدًا
       فقط. لا يُحوَّل أي تاريخ قديم (العدّادات القديمة لا تحمل
       طابعًا زمنيًا فعليًا، فتحويلها سيكون تخمينًا لا حقيقة)
    ----------------------------------------------------------- */

    function loadEventLog() {
        try {
            return JSON.parse(localStorage.getItem(EVENT_LOG_KEY) || "[]");
        } catch (error) {
            return [];
        }
    }

    function saveEventLog(log) {
        localStorage.setItem(EVENT_LOG_KEY, JSON.stringify(log));
    }

    function logEvent(event) {
        try {
            const log = loadEventLog();

            log.push(Object.assign(
                { ts: new Date().toISOString(), studentId: getStudentId() },
                event
            ));

            /* سقف بسيط لمنع نمو غير محدود لحجم localStorage؛ يحتفظ
               بأحدث الأحداث فقط عند تجاوز السقف */
            if (log.length > EVENT_LOG_MAX_ENTRIES) {
                log.splice(0, log.length - EVENT_LOG_MAX_ENTRIES);
            }

            saveEventLog(log);
        } catch (error) {
            /* فشل التسجيل لا يجب أبدًا أن يوقف أي نشاط تعليمي حالي */
        }
    }

    function safeParseArray(key) {
        try {
            const val = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(val) ? val : [];
        } catch (error) {
            return [];
        }
    }

    function safeParseObject(key) {
        try {
            const val = JSON.parse(localStorage.getItem(key) || "{}");
            return (val && typeof val === "object") ? val : {};
        } catch (error) {
            return {};
        }
    }

    /* -----------------------------------------------------------
       🧩 العرض الموحّد — يُركَّب حيًّا من كل البيانات الموجودة
       فعليًا (القديمة والجديدة معًا) في كل استدعاء، دون تخزين
       نسخة منفصلة قد تفقد تزامنها مع المصدر الأصلي
    ----------------------------------------------------------- */

    function getProfile() {
        return {
            studentId: getStudentId(),

            /* من قسم "ملفي الشخصي" — كما هي بلا أي تغيير */
            name: localStorage.getItem("taha_child_name") || null,
            avatar: localStorage.getItem("taha_child_avatar") || null,

            /* من النظام العام للنجوم والمستوى */
            stars: Number(localStorage.getItem("taha_app_stars") || 0),
            level: Number(localStorage.getItem("taha_app_level") || 1),

            /* عدّادات الإجابات الصحيحة الحالية لكل قسم (كما هي) */
            counters: {
                letters: Number(localStorage.getItem("taha_correct_letters") || 0),
                words: Number(localStorage.getItem("taha_correct_words") || 0),
                numbers: Number(localStorage.getItem("taha_correct_numbers") || 0),
                addition: Number(localStorage.getItem("taha_correct_addition") || 0),
                subtraction: Number(localStorage.getItem("taha_correct_subtraction") || 0)
            },

            wrongTotal: Number(localStorage.getItem("taha_wrong_total") || 0),

            timeTodaySeconds: (typeof TimeTracker !== "undefined") ? TimeTracker.getTodaySeconds() : 0,
            timeTotalSeconds: Number(localStorage.getItem("taha_time_total_seconds") || 0),

            lettersLearned: safeParseArray("taha_letters_learned"),
            numbersLearned: safeParseArray("taha_numbers_learned"),
            badges: safeParseArray("taha_badges"),

            /* 🆕 ربط محرك الحروف الجديد — يجعل بياناته الأدق (دقة كل
               نشاط لكل حرف، الحروف المكتملة فعليًا، المستوى المفتوح)
               قابلة للقراءة كجزء من العرض الموحّد لأول مرة */
            lettersEngine: {
                unlockedLevel: Number(localStorage.getItem("taha_ltr2_unlocked_level") || 1),
                completedLetters: safeParseArray("taha_ltr2_completed_letters"),
                adaptiveAccuracy: safeParseObject("taha_ltr2_adaptive")
            },

            /* مستويات الأقسام الأخرى المفتوحة حاليًا (قراءة فقط) */
            unlockedLevels: {
                words: Number(localStorage.getItem("taha_words_unlocked_level") || 1),
                addition: Number(localStorage.getItem("taha_addition_unlocked_level") || 1),
                subtraction: Number(localStorage.getItem("taha_subtraction_unlocked_level") || 1)
            },

            questsCompletedTotal: Number(localStorage.getItem("taha_quests_completed_total") || 0),

            /* 🆕 سجل الأحداث الجديد (فارغ حتى الآن ما لم تُسجَّل أحداث بعد) */
            eventLogCount: loadEventLog().length
        };
    }

    return {
        getStudentId,
        logEvent,
        loadEventLog,
        getProfile
    };

})();

/* تأكيد إنشاء معرّف الطالب من أول تحميل للصفحة بعد هذا التحديث */
StudentData.getStudentId();

/* =========================================================================
   🆕 =====================================================================
   📝 ربط سجل الأحداث بنقاط النتيجة الحالية — بتغليف غير جراحي
   (نفس أسلوب التغليف المستخدم في كل التطبيق سابقًا: استدعاء
   الدالة الأصلية أولًا دون أي تغيير في سلوكها، ثم تسجيل الحدث)
   =====================================================================
========================================================================= */

/* --- الحروف --- */

const originalFinishLtrChoiceTaskForLog = finishLtrChoiceTask;

finishLtrChoiceTask = function (isCorrect, button) {

    const activityEntry = (typeof ltrState !== "undefined" && ltrState.queue)
        ? ltrState.queue[ltrState.activityIndex]
        : null;
    const letterBefore = (typeof ltrState !== "undefined") ? ltrState.letter : null;

    originalFinishLtrChoiceTaskForLog(isCorrect, button);

    StudentData.logEvent({
        type: "activity_answer",
        subject: "letters",
        skill: letterBefore,
        activity: activityEntry ? activityEntry.id : null,
        correct: !!isCorrect
    });
};

/* --- الكلمات --- */

const originalFinishWordsChoiceTaskForLog = finishWordsChoiceTask;

finishWordsChoiceTask = function (isCorrect, button) {

    const level = (typeof wordsLevelState !== "undefined" && typeof WORDS_LEVELS !== "undefined")
        ? WORDS_LEVELS[wordsLevelState.levelId - 1]
        : null;

    originalFinishWordsChoiceTaskForLog(isCorrect, button);

    StudentData.logEvent({
        type: "activity_answer",
        subject: "words",
        skill: level ? level.title : null,
        activity: level ? String(level.id) : null,
        correct: !!isCorrect
    });
};

/* --- الجمع --- */

const originalFinishAdditionChoiceTaskForLog = finishAdditionChoiceTask;

finishAdditionChoiceTask = function (isCorrect, button) {

    const level = (typeof additionLevelState !== "undefined" && typeof ADDITION_LEVELS !== "undefined")
        ? ADDITION_LEVELS[additionLevelState.levelId - 1]
        : null;

    originalFinishAdditionChoiceTaskForLog(isCorrect, button);

    StudentData.logEvent({
        type: "activity_answer",
        subject: "addition",
        skill: level ? level.title : null,
        activity: level ? String(level.id) : null,
        correct: !!isCorrect
    });
};

/* --- الطرح --- */

const originalFinishSubtractionChoiceTaskForLog = finishSubtractionChoiceTask;

finishSubtractionChoiceTask = function (isCorrect, button) {

    const level = (typeof subtractionLevelState !== "undefined" && typeof SUBTRACTION_LEVELS !== "undefined")
        ? SUBTRACTION_LEVELS[subtractionLevelState.levelId - 1]
        : null;

    originalFinishSubtractionChoiceTaskForLog(isCorrect, button);

    StudentData.logEvent({
        type: "activity_answer",
        subject: "subtraction",
        skill: level ? level.title : null,
        activity: level ? String(level.id) : null,
        correct: !!isCorrect
    });
};

/* --- إكمال مهمة اليوم --- */

/* 🛡️ حارس عدم التداخل: addStars() الحالية (من جلسة سابقة) تستدعي
   DailyQuest.checkProgress() كأثر جانبي عند منح النجوم — وبما أن
   checkProgress() الأصلية تستدعي addStars() أثناء منح مكافأة إكمال
   المهمة (قبل حفظ الحالة)، يحدث استدعاء متداخل يُعيد معالجة نفس
   الإكمال مرتين (مما كان يُضاعف النجوم الممنوحة فعليًا قبل هذا
   الإصلاح، بصمت، دون أي علاقة بسجل الأحداث). هذا الحارس يمنع
   إعادة المعالجة أثناء التداخل فيضمن معالجة كل إكمال مرة واحدة
   فقط فعليًا — يستعيد السلوك الصحيح المقصود، ولا "يغيّر" نظام
   المكافآت (١٠ نجوم لكل مهمة هو المقصود أصلًا حسب reward: 10). */

let dailyQuestCheckProgressReentrant = false;

const originalDailyQuestCheckProgressForLog = DailyQuest.checkProgress;

DailyQuest.checkProgress = function () {

    if (dailyQuestCheckProgressReentrant) {
        return DailyQuest.getToday();
    }

    dailyQuestCheckProgressReentrant = true;

    try {

        const beforeData = DailyQuest.getToday();
        const beforeDoneIds = beforeData.quests.filter(q => q.doneAwarded).map(q => q.id);

        const result = originalDailyQuestCheckProgressForLog();

        const afterDoneIds = result.quests.filter(q => q.doneAwarded).map(q => q.id);
        const newlyCompleted = afterDoneIds.filter(id => !beforeDoneIds.includes(id));

        newlyCompleted.forEach(id => {
            const quest = result.quests.find(q => q.id === id);
            StudentData.logEvent({
                type: "quest_completed",
                subject: "daily_quest",
                skill: id,
                activity: quest ? quest.label : null,
                correct: true
            });
        });

        return result;

    } finally {
        dailyQuestCheckProgressReentrant = false;
    }
};

/* =========================================================
   🔚 نهاية طبقة بيانات الطالب الموحّدة — المرحلة الأولى
========================================================= */


/* =========================================================================
   🆕 =====================================================================
   📝 المرحلة الثالثة: ربط سجل الأحداث بالأقسام المتبقية
   (الأرقام، الكتابة، القرآن، الحديث، الأدعية والأذكار)
   =====================================================================
   نفس أسلوب التغليف غير الجراحي المستخدم سابقًا: استدعاء الدالة
   الحالية (وهي نفسها قد تكون ملفوفة من قبل) أولًا دون أي تغيير في
   سلوكها، ثم تسجيل حدث "إكمال" فقط — هذه الأقسام كلها استعراض
   محتوى بلا اختيار صح/خطأ، فالحدث المناسب الوحيد هو "أكمل/انتقل
   للتالي"، وليس نجاحًا أو فشلًا مُختلَقًا لا وجود له فعليًا.
========================================================================= */

/* --- الأرقام: "رقم جديد" يعني أن الطفل أنهى النظر في هذا الرقم --- */

const originalNextNumberForLog = nextNumber;

nextNumber = function () {

    const numberBefore = currentNumber;

    originalNextNumberForLog();

    StudentData.logEvent({
        type: "activity_complete",
        subject: "numbers",
        skill: String(numberBefore),
        activity: "flashcard",
        correct: null
    });
};

/* --- الكتابة: يُسجَّل الإكمال من wrCompleteActivity() --- */

/* --- القرآن: "سورة أخرى" يعني إكمال الاستماع/العرض الحالي --- */

const originalNextSurahForLog = nextSurah;

nextSurah = function (targetIndex) {

    const surahBefore =
        (typeof quranSurahs !== "undefined" && typeof currentSurahIndex !== "undefined")
            ? (quranSurahs[currentSurahIndex] && quranSurahs[currentSurahIndex].name)
            : null;

    /* 🛠️ إصلاح: تمرير targetIndex كما هو للدالة الأصلية — كانت
       تُستدعى بلا وسيطة إطلاقًا فتفقد أي فهرس سورة محدَّد يُمرَّر
       إليها (مشكلة اكتُشفت أثناء تطوير قائمة اختيار السور الجديدة) */
    originalNextSurahForLog(targetIndex);

    StudentData.logEvent({
        type: "activity_complete",
        subject: "quran",
        skill: surahBefore,
        activity: "surah",
        correct: null
    });
};

/* --- الحديث: "حديث آخر" يعني إكمال عرض الحديث الحالي --- */

const originalNextHadithForLog = nextHadith;

nextHadith = function () {

    const hadithBefore =
        (typeof hadiths !== "undefined" && typeof currentHadithIndex !== "undefined")
            ? (hadiths[currentHadithIndex] && hadiths[currentHadithIndex].title)
            : null;

    originalNextHadithForLog();

    StudentData.logEvent({
        type: "activity_complete",
        subject: "hadith",
        skill: hadithBefore,
        activity: "hadith",
        correct: null
    });
};

/* --- الأدعية والأذكار: "دعاء آخر" يعني إكمال القسم الحالي --- */

const originalNextDuaForLog = nextDua;

nextDua = function () {

    let duaCategoryTitle = null;

    if (typeof duaCategories !== "undefined" && typeof duaCategory !== "undefined") {
        const cat = duaCategories.find(c => c.id === duaCategory);
        duaCategoryTitle = cat ? cat.title : duaCategory;
    }

    originalNextDuaForLog();

    StudentData.logEvent({
        type: "activity_complete",
        subject: "duas",
        skill: duaCategoryTitle,
        activity: "dua",
        correct: null
    });
};

/* =========================================================
   🔚 نهاية المرحلة الثالثة — ربط بقية الأقسام بسجل الأحداث
========================================================= */


/* (حارس تكرار الكتابة القديم أُلغي: القسم الجديد يمنح المكافأة مرة واحدة لكل نشاط) */

/* =========================================================
   🔚 نهاية إصلاحات الأولوية العالية (منع تكرار الإكمال)
========================================================= */

/* =========================================================
   ✍️ الكتابة — «حروفي الجميلة»: تدريبات تفاعلية باللمس
   ---------------------------------------------------------
   لكل حرف أربعة تدريبات بنفس ترتيب ملف PDF:
   1) تتبّع الحرف بأشكاله  2) صِل الكلمة بالصورة
   3) اختر شكل الحرف الصحيح  4) أكمل الحرف الناقص بكتابته
   بلا مؤقت ولا عقوبات ولا خصم نقاط؛ المحاولة تُعاد بلا حدود.
   التقدّم محفوظ في المفتاح taha_wr_progress_v1.
========================================================= */

const WR_KEY = "taha_wr_progress_v1";

const WR_ACTS = [
    { id: 1, name: "تتبّع الحرف", icon: "✍️", log: "trace" },
    { id: 2, name: "صِل بالصورة", icon: "🔗", log: "connect" },
    { id: 3, name: "اختر الشكل", icon: "🔠", log: "choose_form" },
    { id: 4, name: "أكمل الحرف", icon: "🖍️", log: "write_missing" }
];

const WR_PASTELS = ["#e3f2fd", "#fff3e0", "#e8f5e9", "#fce4ec", "#ede7f6", "#e0f7fa", "#fffde7"];

const WR_FONT = '"Tahoma", "Arial", "DejaVu Sans", sans-serif';

const WR_TRACE_PASSES = [
    { guide: "dotted", cov: 0.55, prec: 0.70, label: "تتبّع النقاط بإصبعك" },
    { guide: "none", cov: 0.45, prec: 0.68, label: "اكتبه وحدك" }
];

const WR_EXTRA_FORMS = {
    "ا": { isolated: "ﺍ", final: "ﺎ" },
    "ة": { isolated: "ﺓ", final: "ﺔ" },
    "ى": { isolated: "ﻯ", final: "ﻰ" },
    "ء": { isolated: "ﺀ" },
    "ؤ": { isolated: "ﺅ", final: "ﺆ" },
    "ئ": { isolated: "ﺉ", final: "ﺊ", initial: "ﺋ", medial: "ﺌ" },
    "لا": { isolated: "ﻻ", final: "ﻼ" }
};

const WR_NONCONN = new Set(["أ", "إ", "آ", "ا", "د", "ذ", "ر", "ز", "و", "ؤ", "ة", "ى", "ء", "لا"]);

const WR_RAW = `
أ|أسد فأر فأس أرنب أذن|أرنب فأس خطأ رأس يقرأ فأر|أرنب أسد أفعى أناناس
ب|بطة كتاب جبنة بطيخ ثعلب حبل|مربع جبل عنب بطة مضرب ثعبان|بطة بقرة ببغاء برتقال
ت|كتاب تفاح بيت فستان حوت تمساح بنت توت|حوت بيت هاتف زيتون كتاب تمساح|تفاح تمساح تمر تنين
ث|ثور كمثرى ثعبان مثلث ثلج|كمثرى ثعبان محراث ثور مثلث جراثيم|ثوب ثعلب ثوم ثور
ج|جزر ثلج نجم جمل برج شجرة تاج|دجاجة جمل شجرة ثلج جزرة تاج|جمل جزر جرس جبل
ح|ملح حمار لحم مفتاح بحر حصان تفاحة|حوت تمساح تفاحة نحلة ملح سلحفاة|حلوى حمار حذاء حمامة
خ|نخلة صاروخ خاتم خوخ صخرة بطيخ خروف|نخلة خروف خاتم بطيخ صاروخ أخطبوط|خبز خيار خريطة خروف
د|دب مسجد قرد ضفدع هدية يد ديك|ضفدع ديك صندوق قرد أسد وردة|دب ديك دراجة ديناصور
ذ|ذرة حذاء أستاذ ذئب ذهب قنفذ ذيل|حذاء ذئب قنفذ أذن جرذ ذرة|ذهب ذئب ذرة ذبابة
ر|رمان بحر قطار ريشة طيارة وردة نظارة|فراشة رمان صقر سيارة طائرة فأر|رمان ريشة رأس رجل
ز|خبز أزرق تلفاز موز ماعز غزال زرافة|زرافة وزة ماعز حلزون جزر موز|زرافة زيت زهور زيتون
س|شمس سمكة فأس أسد سيارة خس فستان|شمس تمساح أناناس كرسي طاووس سيارة|ساعة سمكة سلحفاة سحاب
ش|ريشة شمس خشب شاحنة خفاش فراشة شمعة|خفاش شاحنة خشب ريش فراشة مشط|شمس شوكة شمعة شجرة
ص|صاروخ صخرة صوص مقص صقر قميص بصل|مقص حصان صقر غواصة صوص عصفور|صاروخ صديق صنارة صندوق
ض|بيض خضار بعوضة مريض ضفدع ضرس|بعوضة ضفدع ضبع بيض مضرب|ضابط ضفدع ضفيرة ضوء
ط|أخطبوط قطار طماطم بطة مشط طبل|أخطبوط طاووس مشط شرطي طائرة قطار|طائرة طماطم طبيب طبل
ظ|ظرف ظبي ظل ظفر استيقظ ظلام|مظلة ظبي محظوظ استيقظ ظربان|ظرف ظهر ظل ظفر
ع|ضفدع ثعبان ساعة علم رضيع عنب ضبع|مربع ساعة ثعبان عنب ثعلب ضفدع|عين عنب علم عصفور
غ|غيمة صمغ غسالة ببغاء غزال مغرفة غراب|صمغ غواصة ببغاء دماغ غوريلا برغي|غزال غذاء غسالة غابة
ف|فراشة خروف سيف زرافة حافلة فراولة هاتف|فيل ضفدع زرافة هاتف خروف مفتاح|فيل فأر فراولة فراشة
ق|قلم قرد بطريق برق برتقال قرش ساق|بطريق قطار رقبة بقرة مقص صندوق|قلم قرد قنفذ قمر
ك|كرة سمكة ديك كلب شوك ملك|راكون كرز بركان ديك أسماك سمكة|كتاب كنز كلب كرسي
ل|جمل سلم برتقال قلم لحم ليمون|جمل نحلة ليمون دلفين نملة غزال|لحم لسان ليمون لعبة
م|نمل هرم رمان لحم ثوم نمر|شمس مقص بومة نجوم خاتم موز|موز مفتاح مسطرة مظلة
ن|عنب عين نمر سكين نحلة زيتون|ليمون نحلة أرنب جبن عنب نجمة|نجوم نحلة نمر نار
ه|هرم مياه مهرج هدهد كهف هدية نهر|فواكه هرة زهرة سهم هلال مياه|هدية هاتف هرة هدهد
و|موز صاروخ خوخ ولد دلو طاووس|يويو وردة بومة خروف جرو حوت|وزة ورقة وسادة ولد
ي|كرسي بيض يد شاي بطريق بيت|بيت يد بطريق شاي سيارة كرسي|يمين يسار يد يعسوب
`;
const WR_EMOJI = {"أسد": "🦁", "فأر": "🐭", "فأس": "🪓", "أرنب": "🐰", "أذن": "👂", "خطأ": "❌", "رأس": "🙂", "يقرأ": "📖", "أفعى": "🐍", "أناناس": "🍍", "بطة": "🦆", "كتاب": "📕", "جبنة": "🧀", "بطيخ": "🍉", "ثعلب": "🦊", "حبل": "🪢", "مربع": "🟦", "جبل": "⛰️", "عنب": "🍇", "مضرب": "🏏", "ثعبان": "🐍", "بقرة": "🐄", "ببغاء": "🦜", "برتقال": "🍊", "تفاح": "🍎", "بيت": "🏠", "فستان": "👗", "حوت": "🐋", "تمساح": "🐊", "بنت": "👧", "توت": "🍓", "هاتف": "☎️", "زيتون": "🫒", "تمر": "🌴", "تنين": "🐉", "ثور": "🐂", "كمثرى": "🍐", "مثلث": "🔺", "ثلج": "🧊", "محراث": "🚜", "جراثيم": "🦠", "ثوب": "👘", "ثوم": "🧄", "جزر": "🥕", "نجم": "⭐", "جمل": "🐫", "برج": "🏙️", "شجرة": "🌳", "تاج": "👑", "دجاجة": "🐔", "جزرة": "🥕", "جرس": "🔔", "ملح": "🧂", "حمار": "🫏", "لحم": "🍖", "مفتاح": "🔑", "بحر": "🌊", "حصان": "🐴", "تفاحة": "🍏", "نحلة": "🐝", "سلحفاة": "🐢", "حلوى": "🍭", "حذاء": "👟", "حمامة": "🕊️", "نخلة": "🌴", "صاروخ": "🚀", "خاتم": "💍", "خوخ": "🍑", "صخرة": "🪨", "خروف": "🐑", "أخطبوط": "🐙", "خبز": "🍞", "خيار": "🥒", "خريطة": "🗺️", "دب": "🐻", "مسجد": "🕌", "قرد": "🐒", "ضفدع": "🐸", "هدية": "🎁", "يد": "✋", "ديك": "🐓", "صندوق": "📦", "وردة": "🌹", "دراجة": "🚲", "ديناصور": "🦖", "ذرة": "🌽", "أستاذ": "👨‍🏫", "ذئب": "🐺", "ذهب": "🪙", "قنفذ": "🦔", "ذيل": "🐕", "جرذ": "🐀", "ذبابة": "🪰", "رمان": "🍒", "قطار": "🚆", "ريشة": "🪶", "طيارة": "✈️", "نظارة": "👓", "فراشة": "🦋", "صقر": "🦅", "سيارة": "🚗", "طائرة": "🛩️", "رجل": "🧑", "أزرق": "🔵", "تلفاز": "📺", "موز": "🍌", "ماعز": "🐐", "غزال": "🦌", "زرافة": "🦒", "وزة": "🦢", "حلزون": "🐌", "زيت": "🫙", "زهور": "💐", "شمس": "☀️", "سمكة": "🐟", "خس": "🥬", "كرسي": "🪑", "طاووس": "🦚", "ساعة": "⏰", "سحاب": "☁️", "خشب": "🪵", "شاحنة": "🚚", "خفاش": "🦇", "شمعة": "🕯️", "ريش": "🍃", "مشط": "🪮", "شوكة": "🍴", "صوص": "🐥", "مقص": "✂️", "قميص": "👕", "بصل": "🧅", "غواصة": "🤿", "عصفور": "🐦", "صديق": "🤝", "صنارة": "🎣", "بيض": "🥚", "خضار": "🥗", "بعوضة": "🦟", "مريض": "🤒", "ضرس": "🦷", "ضبع": "🐆", "ضابط": "👮", "ضفيرة": "🎀", "ضوء": "💡", "طماطم": "🍅", "طبل": "🥁", "شرطي": "👮‍♂️", "طبيب": "👨‍⚕️", "ظرف": "✉️", "ظبي": "🦌", "ظل": "👤", "ظفر": "💅", "استيقظ": "🥱", "ظلام": "🌑", "مظلة": "☂️", "محظوظ": "🍀", "ظربان": "🦨", "ظهر": "🔙", "علم": "🚩", "رضيع": "👶", "عين": "👁️", "غيمة": "🌥️", "صمغ": "🧴", "غسالة": "🧺", "مغرفة": "🥄", "غراب": "🐦‍⬛", "دماغ": "🧠", "غوريلا": "🦍", "برغي": "🔩", "غذاء": "🍱", "غابة": "🌲", "سيف": "🗡️", "حافلة": "🚌", "فراولة": "🍓", "فيل": "🐘", "قلم": "✏️", "بطريق": "🐧", "برق": "⚡", "قرش": "🦈", "ساق": "🦵", "رقبة": "🧣", "قمر": "🌙", "كرة": "⚽", "كلب": "🐶", "شوك": "🌵", "ملك": "🤴", "راكون": "🦝", "كرز": "🍒", "بركان": "🌋", "أسماك": "🐠", "كنز": "💰", "سلم": "🪜", "ليمون": "🍋", "دلفين": "🐬", "نملة": "🐜", "لسان": "👅", "لعبة": "🧸", "نمل": "🐜", "هرم": "🔺", "نمر": "🐅", "بومة": "🦉", "نجوم": "✨", "مسطرة": "📏", "سكين": "🔪", "جبن": "🧀", "نجمة": "🌟", "نار": "🔥", "مياه": "💧", "مهرج": "🤡", "هدهد": "🐦", "كهف": "🕳️", "نهر": "🏞️", "فواكه": "🍇", "هرة": "🐱", "زهرة": "🌸", "سهم": "➡️", "هلال": "🌙", "ولد": "👦", "دلو": "🪣", "يويو": "🪀", "جرو": "🐕", "ورقة": "📄", "وسادة": "🛏️", "شاي": "🍵", "يمين": "👉", "يسار": "👈", "يعسوب": "🪲"};


const WR_LETTERS = WR_RAW.trim().split("\n").map(line => {
    const p = line.split("|");
    return { key: p[0], B: p[1].split(" "), C: p[2].split(" "), D: p[3].split(" ") };
});

const wrGame = {
    letter: 0,
    act: 1,
    unit: 0,
    units: [],
    solved: {},
    session: 0,
    cur: null,
    cleanup: null,
    bound: false
};

/* ---------- أدوات صغيرة ---------- */

function wrEl(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
}

function wrAr(n) {
    return (typeof arabicNumber === "function") ? arabicNumber(n) : String(n);
}

function wrShuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
}

function wrMessage(text, kind) {
    const m = $("wrMessage");
    if (!m) return;
    m.textContent = text || "";
    m.className = "wr-message" + (kind ? " " + kind : "");
}

/* ---------- التقدّم المحفوظ ---------- */

function wrLoad() {
    const empty = { done: {}, bonus: {} };
    try {
        const o = JSON.parse(localStorage.getItem(WR_KEY));
        if (!o || typeof o !== "object") return empty;
        const clean = { done: {}, bonus: {} };
        if (o.done && typeof o.done === "object") {
            Object.keys(o.done).forEach(k => {
                const m = /^(\d+):([1-4])$/.exec(k);
                if (m && Number(m[1]) < WR_LETTERS.length && o.done[k] === true) clean.done[k] = true;
            });
        }
        if (o.bonus && typeof o.bonus === "object") {
            Object.keys(o.bonus).forEach(k => {
                if (/^\d+$/.test(k) && Number(k) < WR_LETTERS.length && o.bonus[k] === true) clean.bonus[k] = true;
            });
        }
        return clean;
    } catch (e) {
        return empty;
    }
}

function wrSave(p) {
    try { localStorage.setItem(WR_KEY, JSON.stringify(p)); } catch (e) { /* لا شيء */ }
}

function wrIsDone(i, act) { return wrLoad().done[i + ":" + act] === true; }
function wrDoneCount(i) { const p = wrLoad(); return WR_ACTS.filter(a => p.done[i + ":" + a.id]).length; }
function wrLetterComplete(i) { return wrDoneCount(i) === WR_ACTS.length; }

function wrFirstOpenAct(i) {
    const p = wrLoad();
    const a = WR_ACTS.find(x => !p.done[i + ":" + x.id]);
    return a ? a.id : 1;
}

function wrFirstOpenLetter() {
    for (let i = 0; i < WR_LETTERS.length; i++) if (!wrLetterComplete(i)) return i;
    return 0;
}

/* ---------- تشكيل الحروف داخل الكلمة ---------- */

function wrFormsFor(ch) {
    if (typeof arabicLetterForms !== "undefined" && arabicLetterForms[ch]) return arabicLetterForms[ch];
    return WR_EXTRA_FORMS[ch] || { isolated: ch };
}

function wrGlyph(ch, pos) {
    const f = wrFormsFor(ch);
    if (f[pos]) return f[pos];
    if (pos === "medial") return f.final || f.isolated;
    return f.isolated;
}

function wrUnitsOfWord(word) {
    const out = [];
    const chars = Array.from(word);
    for (let i = 0; i < chars.length; i++) {
        if (chars[i] === "ل" && chars[i + 1] === "ا") { out.push("لا"); i++; }
        else out.push(chars[i]);
    }
    return out;
}

function wrPosition(units, i) {
    const cur = units[i];
    const prev = units[i - 1];
    const next = units[i + 1];
    const joinPrev = i > 0 && !WR_NONCONN.has(prev) && cur !== "ء";
    const joinNext = i < units.length - 1 && !WR_NONCONN.has(cur) && next !== "ء";
    if (joinPrev && joinNext) return "medial";
    if (joinPrev) return "final";
    if (joinNext) return "initial";
    return "isolated";
}

function wrGapIndex(units, letter) {
    return units.indexOf(letter);
}

/* يبني عقدة الكلمة؛ filled=false يترك مكان الحرف فارغًا بخط منقّط */
function wrWordNode(word, letter, filled) {
    const units = wrUnitsOfWord(word);
    const gap = wrGapIndex(units, letter);
    const node = wrEl("span", "wr-word");
    node.setAttribute("dir", "rtl");
    node.setAttribute("lang", "ar");
    units.forEach((u, i) => {
        const pos = wrPosition(units, i);
        const s = wrEl("span", "wr-ch", wrGlyph(u, pos));
        if (i === gap) {
            s.className = "wr-gap" + (filled ? " filled" : "");
            if (!filled) s.textContent = "";
            s.dataset.glyph = wrGlyph(u, pos);
        }
        node.appendChild(s);
    });
    node.dataset.word = word;
    node.setAttribute("aria-label", "الكلمة " + word + (filled ? "" : " ينقصها حرف"));
    return node;
}

function wrGapGlyph(word, letter) {
    const units = wrUnitsOfWord(word);
    const gap = wrGapIndex(units, letter);
    return gap < 0 ? wrGlyph(letter, "isolated") : wrGlyph(units[gap], wrPosition(units, gap));
}

/* ---------- الصوت: ملفات MP3 المحلية فقط، صوت واحد في كل مرة ---------- */

function wrStopAudio() { EduAudio.stop(); }

function speakWRLocal(text) {
    if (!EduAudio.has(text)) return false;
    EduAudio.play(text, { mode: "interrupt" });
    return true;
}

function wrSpeakLetter() {
    const L = WR_LETTERS[wrGame.letter];
    const t = (typeof letterWithFatha === "function") ? letterWithFatha(L.key) : L.key;
    speakWRLocal(t);
}

/* =========================================================
   🖌️ لوحة التتبّع والكتابة (Canvas + Pointer Events)
========================================================= */

function wrTraceBoard(root, opts, api) {

    const W = 560, H = 420;
    const BRUSH = 34;
    const wrap = wrEl("div", "wr-board");
    const guide = document.createElement("canvas");
    const ink = document.createElement("canvas");
    [guide, ink].forEach(c => { c.width = W; c.height = H; });
    guide.className = "wr-guide-canvas";
    ink.className = "wr-ink-canvas";
    ink.setAttribute("role", "img");
    ink.setAttribute("aria-label", "مساحة الكتابة، استخدم إصبعك أو القلم");
    wrap.appendChild(guide);
    wrap.appendChild(ink);
    root.appendChild(wrap);

    const gctx = guide.getContext("2d");
    const ictx = ink.getContext("2d", { willReadFrequently: true });

    /* مقاس الحرف وموضعه */
    const probe = document.createElement("canvas").getContext("2d");
    probe.font = "bold 400px " + WR_FONT;
    const m0 = probe.measureText(opts.glyph);
    const w0 = (m0.actualBoundingBoxLeft + m0.actualBoundingBoxRight) || 200;
    const h0 = (m0.actualBoundingBoxAscent + m0.actualBoundingBoxDescent) || 200;
    const size = Math.max(120, Math.min(520, 400 * Math.min(W * 0.74 / w0, H * 0.72 / h0)));
    probe.font = "bold " + size + "px " + WR_FONT;
    const m1 = probe.measureText(opts.glyph);
    const gx = W / 2 - (m1.actualBoundingBoxRight - m1.actualBoundingBoxLeft) / 2;
    const gy = H / 2 + (m1.actualBoundingBoxAscent - m1.actualBoundingBoxDescent) / 2;

    function paintGlyph(ctx, mode) {
        ctx.font = "bold " + size + "px " + WR_FONT;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.lineJoin = "round";
        if (mode === "stroke") { ctx.lineWidth = 46; ctx.strokeText(opts.glyph, gx, gy); }
        ctx.fillText(opts.glyph, gx, gy);
    }

    function maskOf(mode) {
        const c = document.createElement("canvas");
        c.width = W; c.height = H;
        const x = c.getContext("2d", { willReadFrequently: true });
        x.fillStyle = "#000"; x.strokeStyle = "#000";
        paintGlyph(x, mode);
        const d = x.getImageData(0, 0, W, H).data;
        const out = new Uint8Array(W * H);
        for (let i = 0; i < W * H; i++) out[i] = d[i * 4 + 3] > 128 ? 1 : 0;
        return out;
    }

    const inside = maskOf("fill");
    const band = maskOf("stroke");
    let insideCount = 0;
    for (let i = 0; i < inside.length; i++) insideCount += inside[i];

    let guideMode = opts.guide;
    let passed = false;
    let drawing = false;
    let last = null;
    let pathLen = 0;
    let clearTimer = null;
    let badInk = false;

    function drawGuide() {
        gctx.clearRect(0, 0, W, H);
        if (guideMode === "dotted") {
            gctx.fillStyle = "rgba(33,150,243,0.08)";
            gctx.strokeStyle = "#5c6bc0";
            gctx.lineWidth = 4;
            gctx.lineCap = "round";
            gctx.setLineDash([1, 13]);
            gctx.font = "bold " + size + "px " + WR_FONT;
            gctx.textAlign = "left";
            gctx.textBaseline = "alphabetic";
            gctx.fillText(opts.glyph, gx, gy);
            gctx.strokeText(opts.glyph, gx, gy);
            gctx.setLineDash([]);
        }
        if (passed) {
            gctx.fillStyle = "rgba(67,160,71,0.30)";
            gctx.font = "bold " + size + "px " + WR_FONT;
            gctx.textAlign = "left";
            gctx.textBaseline = "alphabetic";
            gctx.fillText(opts.glyph, gx, gy);
        }
    }

    drawGuide();

    function pt(e) {
        const r = ink.getBoundingClientRect();
        return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
    }

    function evaluate() {
        const d = ictx.getImageData(0, 0, W, H).data;
        let cov = 0, inkPx = 0, inBand = 0;
        for (let i = 0; i < W * H; i++) {
            if (d[i * 4 + 3] > 100) {
                inkPx++;
                if (band[i]) inBand++;
                if (inside[i]) cov++;
            }
        }
        return {
            cov: insideCount ? cov / insideCount : 0,
            prec: inkPx ? inBand / inkPx : 0,
            ink: inkPx
        };
    }

    function clear() {
        if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
        badInk = false;
        ictx.clearRect(0, 0, W, H);
        pathLen = 0;
    }

    function setBrush() {
        ictx.strokeStyle = "#1565c0";
        ictx.fillStyle = "#1565c0";
        ictx.lineWidth = BRUSH;
        ictx.lineCap = "round";
        ictx.lineJoin = "round";
    }

    function down(e) {
        if (passed || !api.alive()) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        if (badInk) { if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; } ictx.clearRect(0, 0, W, H); pathLen = 0; badInk = false; }
        try { ink.setPointerCapture(e.pointerId); } catch (err) { /* لا شيء */ }
        drawing = true;
        last = pt(e);
        setBrush();
        ictx.beginPath();
        ictx.arc(last.x, last.y, BRUSH / 2, 0, Math.PI * 2);
        ictx.fill();
    }

    function move(e) {
        if (!drawing || passed || !api.alive()) return;
        e.preventDefault();
        const p = pt(e);
        setBrush();
        ictx.beginPath();
        ictx.moveTo(last.x, last.y);
        ictx.lineTo(p.x, p.y);
        ictx.stroke();
        pathLen += Math.hypot(p.x - last.x, p.y - last.y);
        last = p;
    }

    function up() {
        if (!drawing) return;
        drawing = false;
        last = null;
        if (passed || !api.alive()) return;
        if (pathLen < 30) { return; }
        const r = evaluate();
        if (r.cov >= opts.cov && r.prec >= opts.prec) {
            passed = true;
            ictx.clearRect(0, 0, W, H);
            drawGuide();
            api.onPass();
        } else if (r.prec >= opts.prec) {
            /* الخط سليم لكن لم يكتمل الحرف بعد: نُبقي الحبر ليُكمله الطفل بضربة أخرى */
            api.onTry(r, "more");
        } else {
            /* الخط خرج كثيرًا عن الحرف: تُمسح المحاولة بلطف ويعيد الطفل بلا أي خصم */
            api.onTry(r, "off");
            badInk = true;
            clearTimer = setTimeout(() => {
                clearTimer = null;
                if (api.alive() && !passed) { ictx.clearRect(0, 0, W, H); pathLen = 0; badInk = false; }
            }, 800);
        }
    }

    ink.addEventListener("pointerdown", down);
    ink.addEventListener("pointermove", move);
    ink.addEventListener("pointerup", up);
    ink.addEventListener("pointercancel", up);
    ink.addEventListener("lostpointercapture", () => { drawing = false; });

    return {
        clear,
        assist() { guideMode = "dotted"; drawGuide(); },
        destroy() { if (clearTimer) clearTimeout(clearTimer); clearTimer = null; drawing = false; },
        debug: { W, H, inside, band, size, gx, gy, evaluate, isPassed: () => passed }
    };
}

/* =========================================================
   🧭 الهيكل: المحور، الحرف، الأنشطة، التنقّل
========================================================= */

function wrBind() {
    if (wrGame.bound) return;
    wrGame.bound = true;
    const on = (id, fn) => { const e = $(id); if (e) e.addEventListener("click", fn); };
    on("wrBackHub", () => wrBackToHub());
    on("wrBackHome", () => showScreen("home"));
    on("wrContinue", () => { const i = wrFirstOpenLetter(); startWRLetter(i, wrFirstOpenAct(i)); });
    on("wrPrevLetter", () => wrGoLetter(-1));
    on("wrNextLetter", () => wrGoLetter(1));
    on("wrBtnListen", () => wrListen());
    on("wrBtnAssist", () => wrAssist());
    on("wrBtnAgain", () => wrAgain());
    on("wrBtnSkip", () => wrSkip());
    on("wrBtnNext", () => wrNext());
    on("wrDoneNext", () => { wrCloseDone(); if (wrGame.letter < WR_LETTERS.length - 1) startWRLetter(wrGame.letter + 1, 1); else wrBackToHub(); });
    on("wrDoneHub", () => { wrCloseDone(); wrBackToHub(); });
    on("wrDoneAgain", () => { wrCloseDone(); startWRLetter(wrGame.letter, 1); });
    const tabs = $("wrTabs");
    if (tabs) tabs.addEventListener("click", e => {
        const b = e.target.closest("button[data-act]");
        if (b) startWRLetter(wrGame.letter, Number(b.dataset.act));
    });
    const dlg = $("wrDone");
    if (dlg) dlg.addEventListener("keydown", e => {
        if (e.key === "Escape") { wrCloseDone(); return; }
        if (e.key !== "Tab") return;
        const f = Array.from(dlg.querySelectorAll("button")).filter(b => !b.disabled);
        if (!f.length) return;
        const first = f[0], lastB = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastB.focus(); }
        else if (!e.shiftKey && document.activeElement === lastB) { e.preventDefault(); first.focus(); }
    });
}

function renderWritingHub() {
    wrBind();
    wrTeardownCurrent();
    const map = $("wrMap");
    if (!map) return;
    map.innerHTML = "";
    const p = wrLoad();
    let total = 0;
    WR_LETTERS.forEach((L, i) => {
        const n = WR_ACTS.filter(a => p.done[i + ":" + a.id]).length;
        total += n;
        const b = wrEl("button", "wr-tile" + (n === 4 ? " complete" : ""));
        b.type = "button";
        b.style.setProperty("--tile", WR_PASTELS[i % WR_PASTELS.length]);
        b.dataset.letter = String(i);
        const g = wrEl("span", "wr-tile-glyph", wrGlyph(L.key, "isolated"));
        g.setAttribute("aria-hidden", "true");
        b.appendChild(g);
        const pips = wrEl("span", "wr-pips");
        pips.setAttribute("aria-hidden", "true");
        WR_ACTS.forEach(a => pips.appendChild(wrEl("i", p.done[i + ":" + a.id] ? "on" : "")));
        b.appendChild(pips);
        b.setAttribute("aria-label", "الحرف " + L.key + "، أُنجز " + wrAr(n) + " من ٤ تدريبات");
        b.addEventListener("click", () => startWRLetter(i, wrFirstOpenAct(i)));
        map.appendChild(b);
    });
    const max = WR_LETTERS.length * WR_ACTS.length;
    const ov = $("wrOverall");
    if (ov) ov.textContent = "أنجزت " + wrAr(total) + " من " + wrAr(max) + " تدريبًا";
    const bar = $("wrOverallBar");
    if (bar) bar.style.width = Math.round(total / max * 100) + "%";
    const c = $("wrContinue");
    if (c) c.textContent = total === 0 ? "ابدأ بحرف أ ◀" : (total === max ? "أعد التدرّب من البداية 🌟" : "أكمل من حيث توقفت ◀");
}

function wrTeardownCurrent() {
    wrGame.session++;
    if (wrGame.cleanup) { try { wrGame.cleanup(); } catch (e) { /* لا شيء */ } }
    wrGame.cleanup = null;
    wrGame.cur = null;
    wrStopAudio();
}

function wrBackToHub() {
    wrTeardownCurrent();
    showScreen("writing");
}

function wrAlive(session) { return () => session === wrGame.session; }

function startWRLetter(letter, act) {
    wrBind();
    if (letter < 0 || letter >= WR_LETTERS.length) letter = 0;
    wrGame.letter = letter;
    wrGame.act = act >= 1 && act <= 4 ? act : 1;
    wrGame.unit = 0;
    wrGame.solved = {};
    const scr = $("writingPlay");
    if (!scr || !scr.classList.contains("active")) showScreen("writingPlay");
    wrRender();
}

function wrUnitsFor(letter, act) {
    const L = WR_LETTERS[letter];
    const key = L.key;
    if (act === 1) {
        const order = WR_NONCONN.has(key) ? ["isolated", "final"] : ["isolated", "initial", "medial", "final"];
        const u = [];
        order.forEach(pos => WR_TRACE_PASSES.forEach((ps, pi) => u.push({ kind: "trace", pos, pass: pi, glyph: wrGlyph(key, pos) })));
        return u;
    }
    if (act === 2) return [{ kind: "connect", words: L.B.slice(0, 6) }];
    if (act === 3) return L.C.map(w => ({ kind: "choose", word: w }));
    return L.D.map(w => ({ kind: "write", word: w }));
}

const WR_POS_NAMES = { isolated: "منفصل", initial: "في أول الكلمة", medial: "في وسط الكلمة", final: "في آخر الكلمة" };

function wrUpdateHeader() {
    const L = WR_LETTERS[wrGame.letter];
    const big = $("wrLetterBig");
    if (big) big.textContent = wrGlyph(L.key, "isolated");
    const kw = $("wrKeyWord");
    if (kw) kw.textContent = (WR_EMOJI[L.B[0]] || "") + " " + L.B[0];
    const pv = $("wrPrevLetter"), nx = $("wrNextLetter");
    if (pv) pv.disabled = wrGame.letter === 0;
    if (nx) nx.disabled = wrGame.letter === WR_LETTERS.length - 1;
    const p = wrLoad();
    const tabs = $("wrTabs");
    if (tabs) {
        tabs.innerHTML = "";
        WR_ACTS.forEach(a => {
            const done = p.done[wrGame.letter + ":" + a.id];
            const b = wrEl("button", "wr-tab" + (a.id === wrGame.act ? " active" : "") + (done ? " done" : ""));
            b.type = "button";
            b.dataset.act = String(a.id);
            b.textContent = a.icon + " " + a.name + (done ? " ✓" : "");
            b.setAttribute("aria-current", a.id === wrGame.act ? "step" : "false");
            tabs.appendChild(b);
        });
    }
    const t = $("wrActTitle");
    const act = WR_ACTS[wrGame.act - 1];
    if (t) t.textContent = act.icon + " " + act.name;
    const pt = $("wrProgressText");
    if (pt) pt.textContent = "التدريب " + wrAr(wrGame.unit + 1) + " من " + wrAr(wrGame.units.length);
    const bar = $("wrUnitBar");
    if (bar) bar.style.width = Math.round((wrGame.unit + (wrGame.solved[wrGame.unit] ? 1 : 0)) / wrGame.units.length * 100) + "%";
}

function wrSetNextEnabled(on) {
    const b = $("wrBtnNext");
    if (!b) return;
    b.disabled = !on;
    b.classList.toggle("ready", on);
}

function wrRender() {
    wrTeardownCurrent();
    const session = wrGame.session;
    wrGame.units = wrUnitsFor(wrGame.letter, wrGame.act);
    if (wrGame.unit >= wrGame.units.length) wrGame.unit = 0;
    wrUpdateHeader();
    const stage = $("wrStage");
    if (!stage) return;
    stage.innerHTML = "";
    wrMessage("");
    wrSetNextEnabled(!!wrGame.solved[wrGame.unit]);
    const assistBtn = $("wrBtnAssist");
    if (assistBtn) assistBtn.hidden = false;
    const unit = wrGame.units[wrGame.unit];
    const api = {
        session,
        alive: wrAlive(session),
        solved: () => { if (session === wrGame.session) wrUnitSolved(); },
        say: (t, k) => { if (session === wrGame.session) wrMessage(t, k); }
    };
    const R = { trace: wrRenderTrace, connect: wrRenderConnect, choose: wrRenderChoose, write: wrRenderWrite };
    wrGame.cur = R[unit.kind](stage, unit, api) || {};
    wrGame.cleanup = () => { if (wrGame.cur && wrGame.cur.destroy) wrGame.cur.destroy(); };
}

function wrGoLetter(d) {
    const n = wrGame.letter + d;
    if (n < 0 || n >= WR_LETTERS.length) return;
    startWRLetter(n, wrFirstOpenAct(n));
}

function wrListen() {
    if (wrGame.cur && wrGame.cur.listen) wrGame.cur.listen(); else wrSpeakLetter();
}

function wrAssist() {
    if (wrGame.cur && wrGame.cur.assist) wrGame.cur.assist();
}

function wrAgain() {
    if (wrGame.cur && wrGame.cur.reset) { wrGame.cur.reset(); return; }
    wrRender();
}

function wrSkip() {
    wrAdvance(false);
}

function wrNext() {
    if (!wrGame.solved[wrGame.unit]) return;
    wrAdvance(true);
}

function wrAdvance() {
    if (wrGame.unit < wrGame.units.length - 1) {
        wrGame.unit++;
        wrRender();
        return;
    }
    const open = wrGame.units.findIndex((u, i) => !wrGame.solved[i]);
    if (open >= 0) {
        wrGame.unit = open;
        wrRender();
        wrMessage("بقي تدريب لم تُكمله، لنُكمله معًا 🌟");
        return;
    }
    wrCompleteActivity();
    const next = WR_ACTS.find(a => a.id > wrGame.act && !wrIsDone(wrGame.letter, a.id))
        || WR_ACTS.find(a => !wrIsDone(wrGame.letter, a.id));
    if (!next) { wrFinishLetter(); return; }
    wrGame.act = next.id;
    wrGame.unit = 0;
    wrGame.solved = {};
    wrRender();
}

/* مكافأة وتسجيل: مرة واحدة فقط لكل نشاط، وإعادة المحاولة لا تُنقص شيئًا */
function wrCompleteActivity() {
    const key = wrGame.letter + ":" + wrGame.act;
    const p = wrLoad();
    if (p.done[key]) return;
    p.done[key] = true;
    wrSave(p);
    try { addStars(1); } catch (e) { /* لا شيء */ }
    try {
        localStorage.setItem("taha_correct_writing", String(Number(localStorage.getItem("taha_correct_writing") || 0) + 1));
        if (typeof DailyQuest !== "undefined" && DailyQuest.checkProgress) DailyQuest.checkProgress();
    } catch (e) { /* لا شيء */ }
    try {
        if (typeof StudentData !== "undefined" && StudentData.logEvent) {
            StudentData.logEvent({
                type: "activity_complete",
                subject: "writing",
                skill: WR_LETTERS[wrGame.letter].key,
                activity: WR_ACTS[wrGame.act - 1].log,
                correct: null
            });
        }
    } catch (e) { /* لا شيء */ }
}

function wrUnitSolved() {
    wrGame.solved[wrGame.unit] = true;
    wrSetNextEnabled(true);
    wrUpdateHeader();
    const msgs = ["أحسنت! 🌟", "رائع جدًا! ⭐", "ممتاز! 👏", "عمل جميل! 🎉"];
    wrMessage(msgs[wrGame.unit % msgs.length], "ok");
    const nx = $("wrBtnNext");
    if (nx) { try { nx.focus({ preventScroll: true }); } catch (e) { /* لا شيء */ } }
}

function wrFinishLetter() {
    const p = wrLoad();
    const i = wrGame.letter;
    if (!p.bonus[i]) {
        p.bonus[i] = true;
        wrSave(p);
        try { addStars(3); } catch (e) { /* لا شيء */ }
    }
    const dlg = $("wrDone");
    if (!dlg) return;
    const L = WR_LETTERS[i];
    const t = $("wrDoneText");
    if (t) t.textContent = "أتممت تدريبات الحرف " + L.key + " بنجاح!";
    const nx = $("wrDoneNext");
    if (nx) nx.textContent = i < WR_LETTERS.length - 1 ? "الحرف التالي ◀" : "العودة للحروف";
    wrUpdateHeader();
    dlg.hidden = false;
    wrSetInert(true);
    try { if (typeof createLetterRaceConfetti === "function") createLetterRaceConfetti(); } catch (e) { /* لا شيء */ }
    speakWRLocal("أحسنت، عمل رائع");
    if (nx) nx.focus();
}

function wrCloseDone() {
    const dlg = $("wrDone");
    if (dlg) dlg.hidden = true;
    wrSetInert(false);
}

function wrSetInert(on) {
    const dlg = $("wrDone");
    const wrap = dlg && dlg.parentElement;
    if (!wrap) return;
    Array.from(wrap.children).forEach(c => {
        if (c.id === "wrDone") return;
        if (on) c.setAttribute("inert", ""); else c.removeAttribute("inert");
    });
}

/* =========================================================
   1) تتبّع الحرف — الشكل منفصلًا ثم أول/وسط/آخر الكلمة
========================================================= */

function wrRenderTrace(stage, unit, api) {
    const L = WR_LETTERS[wrGame.letter];
    const pass = WR_TRACE_PASSES[unit.pass];
    const ref = wrEl("div", "wr-ref");
    ref.appendChild(wrEl("span", "wr-ref-glyph", unit.glyph));
    ref.appendChild(wrEl("span", "wr-ref-text", "الحرف " + L.key + " — " + WR_POS_NAMES[unit.pos]));
    stage.appendChild(ref);
    stage.appendChild(wrEl("div", "wr-pass", pass.label));
    let tries = 0;
    const board = wrTraceBoard(stage, { glyph: unit.glyph, guide: pass.guide, cov: pass.cov, prec: pass.prec }, {
        alive: api.alive,
        onPass() { api.say("أحسنت! 🌟", "ok"); wrSpeakLetter(); api.solved(); },
        onTry(r, why) { if (why === "more") { api.say("أحسنت! أكمل بقية الحرف 👆"); return; } tries++; api.say(tries >= 2 ? "قريب جدًا! اتبع الشكل ببطء 💙" : "حاول مرة أخرى، أنت تتقدّم 💙"); }
    });
    return {
        board,
        listen: wrSpeakLetter,
        assist: () => { board.assist(); api.say("هذه نقاط تساعدك 👆"); },
        reset: () => { board.clear(); api.say(""); },
        destroy: () => board.destroy()
    };
}

/* =========================================================
   2) صِل الكلمة بالصورة — سحب أو لمس أو لوحة مفاتيح
========================================================= */

function wrRenderConnect(stage, unit, api) {
    const L = WR_LETTERS[wrGame.letter];
    const words = unit.words;
    stage.appendChild(wrEl("div", "wr-pass", "صِل كل كلمة بصورتها (اسحب أو المس الكلمة ثم الصورة)"));
    const area = wrEl("div", "wr-conn");
    const col = wrEl("div", "wr-conn-col wr-conn-words");
    const pics = wrEl("div", "wr-conn-col wr-conn-pics");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "wr-conn-svg");
    svg.setAttribute("aria-hidden", "true");
    area.appendChild(svg);
    area.appendChild(col);
    area.appendChild(pics);
    stage.appendChild(area);

    const matched = {};
    const wrong = {};
    let selected = null;
    let drag = null;
    const wordBtns = {}, picBtns = {};

    words.forEach(w => {
        const b = wrEl("button", "wr-conn-item wr-conn-w");
        b.type = "button";
        b.dataset.w = w;
        b.appendChild(wrWordNode(w, L.key, false));
        b.setAttribute("aria-label", "كلمة ينقصها حرف، طولها " + wrAr(Array.from(w).length) + " حروف");
        col.appendChild(b);
        wordBtns[w] = b;
    });
    wrShuffle(words).forEach(w => {
        const b = wrEl("button", "wr-conn-item wr-conn-p", WR_EMOJI[w] || "❓");
        b.type = "button";
        b.dataset.w = w;
        b.setAttribute("aria-label", "صورة: " + w);
        pics.appendChild(b);
        picBtns[w] = b;
    });

    function center(el, side) {
        const a = area.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        return { x: (side === "l" ? r.left : r.right) - a.left, y: r.top + r.height / 2 - a.top };
    }

    function lineFor(w) {
        const p1 = center(wordBtns[w], "l");
        const p2 = center(picBtns[w], "r");
        return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    }

    function redraw() {
        svg.innerHTML = "";
        Object.keys(matched).forEach(w => {
            const l = lineFor(w);
            const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
            ["x1", "y1", "x2", "y2"].forEach(k => ln.setAttribute(k, l[k]));
            ln.setAttribute("class", "wr-line");
            svg.appendChild(ln);
        });
        if (drag && drag.line) svg.appendChild(drag.line);
    }

    function clearSel() {
        selected = null;
        Object.values(wordBtns).forEach(b => b.classList.remove("sel"));
    }

    function hint(w) {
        Object.values(picBtns).forEach(b => b.classList.remove("hint"));
        if (picBtns[w]) picBtns[w].classList.add("hint");
    }

    function attempt(w, picW) {
        if (!api.alive() || matched[w]) return;
        if (w === picW) {
            matched[w] = true;
            wordBtns[w].classList.add("matched");
            picBtns[w].classList.add("matched");
            wordBtns[w].replaceChildren(wrWordNode(w, L.key, true));
            wordBtns[w].disabled = true;
            picBtns[w].disabled = true;
            Object.values(picBtns).forEach(b => b.classList.remove("hint"));
            clearSel();
            redraw();
            speakWRLocal(w);
            const n = Object.keys(matched).length;
            if (n === words.length) api.solved();
            else api.say("صحيح! بقي " + wrAr(words.length - n) + " 🌟", "ok");
        } else {
            wrong[w] = (wrong[w] || 0) + 1;
            wordBtns[w].classList.add("shake");
            setTimeout(() => wordBtns[w] && wordBtns[w].classList.remove("shake"), 400);
            api.say("حاول مرة أخرى 💙");
            if (wrong[w] >= 2) hint(w);
            clearSel();
        }
    }

    function onWordDown(e) {
        const b = e.target.closest(".wr-conn-w");
        if (!b || b.disabled || !api.alive()) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        const w = b.dataset.w;
        const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
        ln.setAttribute("class", "wr-line drag");
        drag = { w, b, line: ln, moved: false, x0: e.clientX, y0: e.clientY, id: e.pointerId };
        try { b.setPointerCapture(e.pointerId); } catch (err) { /* لا شيء */ }
    }

    function onMove(e) {
        if (!drag || e.pointerId !== drag.id) return;
        if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 10) {
            drag.moved = true;
            drag.b.classList.add("sel");
            svg.appendChild(drag.line);
        }
        if (drag.moved) {
            const a = area.getBoundingClientRect();
            const p = center(drag.b, "l");
            drag.line.setAttribute("x1", p.x); drag.line.setAttribute("y1", p.y);
            drag.line.setAttribute("x2", e.clientX - a.left); drag.line.setAttribute("y2", e.clientY - a.top);
        }
    }

    function onUp(e) {
        if (!drag || e.pointerId !== drag.id) return;
        const d = drag;
        drag = null;
        if (d.line.parentNode) d.line.parentNode.removeChild(d.line);
        if (d.moved) {
            d.b.classList.remove("sel");
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const pic = el && el.closest ? el.closest(".wr-conn-p") : null;
            if (pic && !pic.disabled) attempt(d.w, pic.dataset.w);
        } else {
            /* لمسة عادية: اختر الكلمة أو ألغِ اختيارها */
            if (selected === d.w) clearSel();
            else { clearSel(); selected = d.w; d.b.classList.add("sel"); api.say("الآن المس الصورة المناسبة 👆"); }
        }
    }

    col.addEventListener("pointerdown", onWordDown);
    col.addEventListener("pointermove", onMove);
    col.addEventListener("pointerup", onUp);
    col.addEventListener("pointercancel", e => { if (drag && e.pointerId === drag.id) { if (drag.line.parentNode) drag.line.parentNode.removeChild(drag.line); drag.b.classList.remove("sel"); drag = null; } });
    col.addEventListener("keydown", e => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const b = e.target.closest(".wr-conn-w");
        if (!b || b.disabled) return;
        e.preventDefault();
        clearSel();
        selected = b.dataset.w;
        b.classList.add("sel");
        api.say("الآن اختر الصورة المناسبة");
    });
    pics.addEventListener("click", e => {
        const b = e.target.closest(".wr-conn-p");
        if (!b || b.disabled || !selected) return;
        attempt(selected, b.dataset.w);
    });

    let ro = null;
    if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(() => redraw()); ro.observe(area); }

    return {
        listen: () => { const w = selected || words.find(x => !matched[x]); if (w) speakWRLocal(w); },
        assist: () => { const w = selected || words.find(x => !matched[x]); if (w) { hint(w); api.say("هذه هي الصورة المناسبة 👆"); } },
        reset: () => wrRender(),
        destroy: () => { if (ro) ro.disconnect(); drag = null; },
        debug: { matched, attempt }
    };
}

/* =========================================================
   3) اختر شكل الحرف الصحيح لإكمال الكلمة
========================================================= */

function wrRenderChoose(stage, unit, api) {
    const L = WR_LETTERS[wrGame.letter];
    const word = unit.word;
    stage.appendChild(wrEl("div", "wr-pass", "اختر شكل الحرف الصحيح لتكمل الكلمة"));
    stage.appendChild(wrEl("div", "wr-pic", WR_EMOJI[word] || "❓"));
    let wordHolder = wrEl("div", "wr-word-holder");
    wordHolder.appendChild(wrWordNode(word, L.key, false));
    stage.appendChild(wordHolder);
    const correct = wrGapGlyph(word, L.key);
    const poss = WR_NONCONN.has(L.key) ? ["isolated", "final"] : ["isolated", "initial", "medial", "final"];
    const opts = [];
    poss.forEach(pos => { const g = wrGlyph(L.key, pos); if (opts.indexOf(g) < 0) opts.push(g); });
    const row = wrEl("div", "wr-forms");
    let wrongCount = 0;
    let done = false;
    wrShuffle(opts).forEach(g => {
        const b = wrEl("button", "wr-form", g);
        b.type = "button";
        b.dataset.glyph = g;
        b.setAttribute("aria-label", "شكل الحرف " + L.key);
        b.addEventListener("click", () => {
            if (done || !api.alive()) return;
            if (g === correct) {
                done = true;
                b.classList.add("right");
                wordHolder.replaceChildren(wrWordNode(word, L.key, true));
                speakWRLocal(word);
                api.solved();
            } else {
                wrongCount++;
                b.classList.add("shake");
                setTimeout(() => b.classList.remove("shake"), 400);
                api.say("حاول مرة أخرى 💙");
                if (wrongCount >= 2) row.querySelectorAll(".wr-form").forEach(x => { if (x.dataset.glyph === correct) x.classList.add("hint"); });
            }
        });
        row.appendChild(b);
    });
    stage.appendChild(row);
    return {
        listen: () => { if (!speakWRLocal(word)) wrSpeakLetter(); },
        assist: () => { row.querySelectorAll(".wr-form").forEach(x => { if (x.dataset.glyph === correct) x.classList.add("hint"); }); api.say("انظر إلى الزر المضيء 👆"); },
        reset: () => wrRender(),
        debug: { correct }
    };
}

/* =========================================================
   4) أكمل الحرف الناقص — اكتبه بإصبعك في المساحة
========================================================= */

function wrRenderWrite(stage, unit, api) {
    const L = WR_LETTERS[wrGame.letter];
    const word = unit.word;
    stage.appendChild(wrEl("div", "wr-pass", "اكتب الحرف الناقص بإصبعك"));
    const top = wrEl("div", "wr-write-top");
    top.appendChild(wrEl("span", "wr-pic small", WR_EMOJI[word] || "❓"));
    const holder = wrEl("span", "wr-word-holder");
    holder.appendChild(wrWordNode(word, L.key, false));
    top.appendChild(holder);
    stage.appendChild(top);
    const glyph = wrGapGlyph(word, L.key);
    const pass = WR_TRACE_PASSES[1];
    let tries = 0;
    const board = wrTraceBoard(stage, { glyph, guide: "none", cov: pass.cov, prec: pass.prec }, {
        alive: api.alive,
        onPass() { holder.replaceChildren(wrWordNode(word, L.key, true)); speakWRLocal(word); api.solved(); },
        onTry(r, why) { if (why === "more") { api.say("أحسنت! أكمل بقية الحرف 👆"); return; } tries++; api.say(tries >= 2 ? "اضغط زر المساعدة لتظهر النقاط 💡" : "حاول مرة أخرى 💙"); }
    });
    return {
        board,
        listen: () => { if (!speakWRLocal(word)) wrSpeakLetter(); },
        assist: () => { board.assist(); api.say("اتبع النقاط 👆"); },
        reset: () => { board.clear(); api.say(""); },
        destroy: () => board.destroy()
    };
}

/* ---------- ربط الشاشات: تنظيف الجلسة عند مغادرة صفحة التدريب ---------- */

const originalShowScreenForWR = showScreen;

showScreen = function (screenId) {
    if (screenId !== "writingPlay") {
        wrTeardownCurrent();
        try { wrCloseDone(); } catch (e) { /* لا شيء */ }
    }
    return originalShowScreenForWR.apply(this, arguments);
};

window.renderWritingHub = renderWritingHub;
window.startWRLetter = startWRLetter;
window.wrGame = wrGame;

/* =========================================================
   🔚 نهاية قسم الكتابة «حروفي الجميلة»
========================================================= */

/* =========================================================
   🐾 أصدقاء الحديقة — لعبة مستقلة (حيوانات وطيور) — الإصدار ٢
   ---------------------------------------------------------
   خمسة أنشطة × ثلاثة مستويات × ٥ جولات، لكل نشاط بيئته الخاصة:
   1) من هذا؟ (مرج)        2) أطعِم الحيوان (مزرعة)
   3) بيت الحيوان (مناظر)   4) عدّ معي (حظيرة)
   5) أين ظلّي؟ (مساء)
   بلا مؤقت ولا أرواح ولا عقوبات؛ الخطأ يُعالَج بتلميح تدريجي.
   الصوت: ملفات MP3 المحلية فقط (الكلمة كاملة لا الحروف)، بلا TTS.
   التقدّم مستقل: taha_zoo_progress_v1
========================================================= */

const ZOO_KEY = "taha_zoo_progress_v1";
const ZOO_ROUNDS = 5;

const ZOO_ACTS = [
    { id: "who", name: "من هذا؟", icon: "👂", mascot: "🐘", env: "meadow", desc: "اسمع الاسم واختر الحيوان", prompt: "اسمع جيدًا ثم المس الحيوان" },
    { id: "feed", name: "أطعِم الحيوان", icon: "🥕", mascot: "🐒", env: "farm", desc: "اسحب الطعام إلى صاحبه", prompt: "اسحب الطعام إلى من يحبه" },
    { id: "home", name: "بيت الحيوان", icon: "🏡", mascot: "🦁", env: "land", desc: "خذ كل حيوان إلى بيته", prompt: "خذ كل حيوان إلى بيته" },
    { id: "count", name: "عدّ معي", icon: "🔢", mascot: "🐻", env: "pen", desc: "المس الحيوانات وعُدّها", prompt: "المس كل حيوان لتعدّه" },
    { id: "shadow", name: "أين ظلّي؟", icon: "🌑", mascot: "🦊", env: "dusk", desc: "اسحب الحيوان إلى ظلّه", prompt: "اسحب كل حيوان إلى ظلّه" }
];

const ZOO_LEVELS = [
    { id: 1, name: "سهل", stars: "⭐", note: "ابدأ من هنا بهدوء" },
    { id: 2, name: "متوسط", stars: "⭐⭐", note: "خطوة أكبر قليلًا" },
    { id: 3, name: "متقدّم", stars: "⭐⭐⭐", note: "للبطل الماهر" }
];

/* n الاسم (له ملف MP3)، e الرمز، g البيت، f الطعام، k نوع الحركة الهادئة */
const ZOO_ANIMALS = [
    { n: "أرنب", e: "🐰", g: "forest", f: "🥕", k: "hop" },
    { n: "أسد", e: "🦁", g: "forest", f: "🍖", k: "sway" },
    { n: "بطة", e: "🦆", g: "farm", f: "🍞", k: "sway" },
    { n: "بقرة", e: "🐄", g: "farm", f: "🌿", k: "breathe" },
    { n: "ثعلب", e: "🦊", g: "forest", k: "sway" },
    { n: "ثعبان", e: "🐍", k: "sway" },
    { n: "تمساح", e: "🐊", k: "breathe" },
    { n: "حصان", e: "🐴", g: "farm", f: "🍎", k: "breathe" },
    { n: "حوت", e: "🐋", g: "sea", k: "swim" },
    { n: "خروف", e: "🐑", g: "farm", k: "breathe" },
    { n: "دجاجة", e: "🐔", g: "farm", f: "🌽", k: "hop" },
    { n: "دب", e: "🐻", g: "forest", f: "🍯", k: "breathe" },
    { n: "ديك", e: "🐓", g: "farm", k: "hop" },
    { n: "دلفين", e: "🐬", g: "sea", k: "swim" },
    { n: "ذئب", e: "🐺", g: "forest", k: "sway" },
    { n: "زرافة", e: "🦒", g: "forest", f: "🥬", k: "sway" },
    { n: "سمكة", e: "🐟", g: "sea", k: "swim" },
    { n: "نسر", e: "🦅", g: "sky", k: "fly" },
    { n: "ضفدع", e: "🐸", k: "hop" },
    { n: "عصفور", e: "🐦", g: "sky", f: "🌾", k: "fly" },
    { n: "غوريلا", e: "🦍", g: "forest", k: "breathe" },
    { n: "فراشة", e: "🦋", g: "sky", k: "fly" },
    { n: "فيل", e: "🐘", g: "forest", f: "🥜", k: "breathe" },
    { n: "فأر", e: "🐭", f: "🧀", k: "hop" },
    { n: "قرد", e: "🐒", g: "forest", f: "🍌", k: "sway" },
    { n: "كلب", e: "🐶", g: "farm", f: "🦴", k: "sway" },
    { n: "نحل", e: "🐝", g: "sky", f: "🌺", k: "fly" },
    { n: "نمر", e: "🐅", g: "forest", k: "sway" }
];

const ZOO_HABITATS = {
    farm: { name: "المزرعة", e: "🏡", deco: ["🌾", "🌻"] },
    forest: { name: "الغابة", e: "🌳", deco: ["🌲", "🍄"] },
    sea: { name: "البحر", e: "🌊", deco: ["🐚", "🫧"] },
    sky: { name: "السماء", e: "☁️", deco: ["☀️", "☁️"] }
};

const ZOO_NUM_WORDS = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة"];

const zoo = {
    active: false,
    view: "hub",
    act: "who",
    level: 1,
    round: 0,
    mistakes: 0,
    hint: 0,
    roundSolved: false,
    session: 0,
    used: [],
    cur: null,
    bound: false
};

/* ---------- أدوات ---------- */

function zEl(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
}

function zNum(n) {
    return (typeof arabicNumber === "function") ? arabicNumber(n) : String(n);
}

function zShuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
}

function zHasAudio(text) {
    return typeof EDUCATIONAL_AUDIO_MANIFEST !== "undefined" && !!EDUCATIONAL_AUDIO_MANIFEST[text];
}

function zAnimals() {
    const a = ZOO_ANIMALS.filter(x => zHasAudio(x.n));
    return a.length >= 12 ? a : ZOO_ANIMALS;
}

function zCalm() {
    try { return !!(typeof Settings !== "undefined" && Settings.get().calm); } catch (e) { return false; }
}

function zSay(text, kind) {
    const m = $("zooMessage");
    if (!m) return;
    m.textContent = text || "";
    m.className = "zoo-message" + (kind ? " " + kind : "");
}

/* حيوان "حيّ": حركة هادئة حسب نوعه مع تأخير عشوائي حتى لا يتحرك الجميع معًا */
function zLive(el, animal) {
    el.classList.add("zoo-life", "zl-" + ((animal && animal.k) || "sway"));
    el.style.setProperty("--zd", (3.2 + Math.random() * 2.6).toFixed(2) + "s");
    el.style.setProperty("--zl", (-Math.random() * 3).toFixed(2) + "s");
}

function zAnimalOf(name) {
    return ZOO_ANIMALS.find(a => a.n === name);
}

/* وميض نجاح صغير: ٨ جزيئات قليلة بلا زحام، وتُلغى في الوضع الهادئ */
function zBurst(el, glyphs) {
    if (!el || zCalm()) return;
    const world = $("zooWorld");
    if (!world) return;
    const w = world.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2 - w.left, cy = r.top + r.height / 2 - w.top;
    const g = glyphs || ["✨", "⭐", "💛", "✨"];
    for (let i = 0; i < 8; i++) {
        const p = zEl("span", "zoo-spark", g[i % g.length]);
        const ang = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
        const dist = 60 + Math.random() * 40;
        p.style.left = cx + "px";
        p.style.top = cy + "px";
        p.style.setProperty("--dx", Math.cos(ang) * dist + "px");
        p.style.setProperty("--dy", Math.sin(ang) * dist - 10 + "px");
        p.setAttribute("aria-hidden", "true");
        world.appendChild(p);
        setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, 950);
    }
}

function zMascot(state) {
    const m = $("zooMascot");
    if (!m) return;
    m.classList.remove("cheer", "oops");
    void m.offsetWidth;
    if (state) m.classList.add(state);
}

/* ---------- الصوت المحلي: صوت واحد في كل مرة، الكلمة كاملة، بلا TTS ---------- */

function zooStopAudio() { EduAudio.stop(); }

function speakZooLocal(text) {
    if (!EduAudio.has(text)) return false;
    EduAudio.play(text, { mode: "interrupt" });
    return true;
}

/* ---------- التقدّم المحفوظ (مستقل عن بقية الألعاب) ---------- */

function zooLoad() {
    const empty = { done: {}, last: {} };
    try {
        const o = JSON.parse(localStorage.getItem(ZOO_KEY));
        if (!o || typeof o !== "object") return empty;
        const clean = { done: {}, last: {} };
        const ids = ZOO_ACTS.map(a => a.id);
        if (o.done && typeof o.done === "object") {
            Object.keys(o.done).forEach(k => {
                const m = /^([a-z]+):([1-3])$/.exec(k);
                const v = o.done[k];
                if (m && ids.indexOf(m[1]) >= 0 && v && typeof v === "object") {
                    clean.done[k] = { n: Math.max(1, Math.min(9999, Number(v.n) || 1)), best: Math.max(0, Math.min(99, Number(v.best) || 0)) };
                }
            });
        }
        if (o.last && typeof o.last === "object") {
            Object.keys(o.last).forEach(k => {
                const v = o.last[k];
                if (ids.indexOf(k) >= 0 && v && [1, 2, 3].indexOf(Number(v.level)) >= 0) {
                    clean.last[k] = { level: Number(v.level), mistakes: Math.max(0, Math.min(99, Number(v.mistakes) || 0)) };
                }
            });
        }
        return clean;
    } catch (e) {
        return empty;
    }
}

function zooSave(p) {
    try { localStorage.setItem(ZOO_KEY, JSON.stringify(p)); } catch (e) { /* لا شيء */ }
}

function zooDoneCount() {
    return Object.keys(zooLoad().done).length;
}

/* مستوى مقترح: التالي بعد جولة هادئة، ونفس المستوى بعد جولة فيها أخطاء كثيرة */
function zooSuggestLevel(actId) {
    const p = zooLoad();
    const last = p.last[actId];
    if (!last) return 1;
    if (last.mistakes <= 2) return Math.min(3, last.level + 1);
    if (last.mistakes >= 8) return Math.max(1, last.level - (last.level > 1 && last.mistakes >= 12 ? 1 : 0));
    return last.level;
}

/* أول نشاط لم يكتمل: لزر «هيا نبدأ» */
function zooNextStep() {
    const p = zooLoad();
    for (const a of ZOO_ACTS) {
        const open = ZOO_LEVELS.find(l => !p.done[a.id + ":" + l.id]);
        if (open) return { act: a.id, level: open.id };
    }
    return { act: ZOO_ACTS[0].id, level: 1 };
}

/* =========================================================
   🌍 المشاهد: لكل بيئة زينة خاصة خلف المحتوى
========================================================= */

const ZOO_SCENERY = {
    hub: [["☀️", "sun"], ["☁️", "c1"], ["☁️", "c2"], ["🌳", "t1"], ["🌷", "f1"], ["🌼", "f2"], ["🐦", "bd"]],
    meadow: [["☀️", "sun"], ["☁️", "c1"], ["🌼", "f1"], ["🌷", "f2"], ["🦋", "bf"], ["🌳", "t1"]],
    farm: [["☁️", "c1"], ["🏡", "barn"], ["🌾", "f1"], ["🌻", "f2"]],
    land: [["☁️", "c1"], ["☁️", "c2"]],
    pen: [["☁️", "c1"], ["🌻", "f1"], ["🌼", "f2"], ["🌿", "f3"]],
    dusk: [["🦉", "owl"], ["🌙", "moon"], ["✨", "st1"], ["✨", "st2"], ["✨", "st3"], ["⭐", "st4"]]
};

function zooScenery(env) {
    const world = $("zooWorld");
    const sc = $("zooScenery");
    if (!world || !sc) return;
    world.dataset.env = env;
    sc.innerHTML = "";
    (ZOO_SCENERY[env] || []).forEach(([g, c]) => {
        const s = zEl("span", "zoo-deco zd-" + c, g);
        s.setAttribute("aria-hidden", "true");
        sc.appendChild(s);
    });
}

/* ---------- الشاشات: البداية، الأنشطة، المستويات، اللعب ---------- */

function zooBind() {
    if (zoo.bound) return;
    zoo.bound = true;
    const on = (id, fn) => { const e = $(id); if (e) e.addEventListener("click", fn); };
    on("zooBack", () => zooBack());
    on("zooBtnListen", () => zooListen());
    on("zooBtnHint", () => zooHint());
    on("zooBtnNext", () => zooNext());
    on("zooDoneNext", () => { zooCloseDone(); zooStartLevel(zoo.act, Math.min(3, zoo.level + 1)); });
    on("zooDoneAgain", () => { zooCloseDone(); zooStartLevel(zoo.act, zoo.level); });
    on("zooDoneHub", () => { zooCloseDone(); zooShowActs(); });
    const dlg = $("zooDone");
    if (dlg) dlg.addEventListener("keydown", e => {
        if (e.key === "Escape") { zooCloseDone(); return; }
        if (e.key !== "Tab") return;
        const f = Array.from(dlg.querySelectorAll("button")).filter(b => !b.hidden && !b.disabled);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
}

function zooViews(view) {
    zoo.view = view;
    const map = { hub: "zooHub", acts: "zooActs", levels: "zooLevels", play: "zooPlay" };
    Object.keys(map).forEach(k => { const e = $(map[k]); if (e) e.hidden = k !== view; });
    const w = $("zooWorld");
    if (w) w.dataset.view = view;
    const shown = $(map[view]);
    if (shown) { shown.classList.remove("zoo-view-in"); void shown.offsetWidth; shown.classList.add("zoo-view-in"); }
    zooKeepInView();
    const t = $("zooTitle");
    const act = ZOO_ACTS.find(a => a.id === zoo.act);
    if (t) t.textContent = (view === "hub" || view === "acts" || !act) ? "🐾 أصدقاء الحديقة" : act.icon + " " + act.name;
}

/* إن كان رأس اللعبة فوق حدود الشاشة (بعد سحب طويل) نعيده للأعلى فورًا */
function zooKeepInView() {
    const w = $("zooWorld");
    if (!w) return;
    const r = w.getBoundingClientRect();
    if (r.top < -20) { try { w.scrollIntoView({ block: "start" }); } catch (e) { /* لا شيء */ } }
}

function startZooGame() {
    zooBind();
    zooTeardown();
    zoo.active = true;
    showScreen("zooGame");
    zooShowHub();
}

function exitZooGame() {
    zooTeardown();
    zoo.active = false;
    showScreen("games");
}

function zooTeardown() {
    zoo.session++;
    if (zoo.cur && zoo.cur.destroy) { try { zoo.cur.destroy(); } catch (e) { /* لا شيء */ } }
    zoo.cur = null;
    zooStopAudio();
    document.querySelectorAll(".zoo-spark, .zoo-ghost").forEach(n => n.remove());
    try { zooCloseDone(); } catch (e) { /* لا شيء */ }
}

function zooBack() {
    if (zoo.view === "play") { zooTeardown(); zooShowLevels(zoo.act); return; }
    if (zoo.view === "levels") { zooShowActs(); return; }
    if (zoo.view === "acts") { zooShowHub(); return; }
    exitZooGame();
}

/* شاشة البداية: عنوان كبير وحيوانات تتمشى وزر «هيا نبدأ» */
function zooShowHub() {
    zooTeardown();
    zooScenery("hub");
    zooViews("hub");
    const hub = $("zooHub");
    if (!hub) return;
    hub.innerHTML = "";
    const hero = zEl("div", "zoo-hero");
    hero.appendChild(zEl("div", "zoo-logo", "🐾"));
    hero.appendChild(zEl("h1", "zoo-hero-title", "أصدقاء الحديقة"));
    hero.appendChild(zEl("div", "zoo-hero-sub", "حيوانات وطيور وألعاب ممتعة"));
    const walkers = zEl("div", "zoo-walkers");
    walkers.setAttribute("aria-hidden", "true");
    zShuffle(zAnimals()).slice(0, 4).forEach((a, i) => {
        const w = zEl("span", "zoo-walker", a.e);
        w.style.setProperty("--wd", (14 + i * 3) + "s");
        w.style.setProperty("--wl", (-i * 4) + "s");
        w.style.bottom = (i % 2 ? 2 : 12) + "px";
        walkers.appendChild(w);
    });
    hero.appendChild(walkers);
    const start = zEl("button", "zoo-start", "▶ هيا نبدأ");
    start.type = "button";
    start.id = "zooStart";
    start.addEventListener("click", () => { const s = zooNextStep(); zooStartLevel(s.act, s.level); });
    hero.appendChild(start);
    const more = zEl("button", "zoo-choose", "🗺️ اختر نشاطًا");
    more.type = "button";
    more.id = "zooChoose";
    more.addEventListener("click", () => zooShowActs());
    hero.appendChild(more);
    const total = ZOO_ACTS.length * ZOO_LEVELS.length;
    hero.appendChild(zEl("div", "zoo-progress-line", "أنجزت " + zNum(zooDoneCount()) + " من " + zNum(total) + " مستوى"));
    hub.appendChild(hero);
}

/* خريطة الأنشطة: بطاقة كبيرة بمشهد خاص لكل نشاط */
function zooShowActs() {
    zooTeardown();
    zooScenery("hub");
    zooViews("acts");
    const box = $("zooActs");
    if (!box) return;
    box.innerHTML = "";
    const p = zooLoad();
    box.appendChild(zEl("div", "zoo-intro-line", "اختر نشاطًا وانطلق مع أصدقائك 🐾"));
    const grid = zEl("div", "zoo-acts");
    ZOO_ACTS.forEach(a => {
        const b = zEl("button", "zoo-act zoo-act-" + a.env);
        b.type = "button";
        b.dataset.act = a.id;
        const art = zEl("span", "zoo-act-art");
        art.setAttribute("aria-hidden", "true");
        art.appendChild(zEl("span", "zoo-act-mascot", a.mascot));
        art.appendChild(zEl("span", "zoo-act-icon", a.icon));
        b.appendChild(art);
        const txt = zEl("span", "zoo-act-text");
        txt.appendChild(zEl("strong", "", a.name));
        txt.appendChild(zEl("small", "", a.desc));
        b.appendChild(txt);
        const dots = zEl("span", "zoo-dots");
        dots.setAttribute("aria-hidden", "true");
        ZOO_LEVELS.forEach(l => dots.appendChild(zEl("i", p.done[a.id + ":" + l.id] ? "on" : "")));
        b.appendChild(dots);
        const n = ZOO_LEVELS.filter(l => p.done[a.id + ":" + l.id]).length;
        b.setAttribute("aria-label", a.name + "، " + a.desc + "، أُنجز " + zNum(n) + " من ٣ مستويات");
        b.addEventListener("click", () => zooShowLevels(a.id));
        grid.appendChild(b);
    });
    box.appendChild(grid);
}

/* اختيار المستوى: ثلاث درجات كبيرة داخل بيئة النشاط مع مرشد */
function zooShowLevels(actId) {
    zooTeardown();
    zoo.act = actId;
    const act = ZOO_ACTS.find(a => a.id === actId);
    zooScenery(act.env);
    zooViews("levels");
    const box = $("zooLevels");
    if (!box) return;
    box.innerHTML = "";
    const p = zooLoad();
    const sug = zooSuggestLevel(actId);
    const guide = zEl("div", "zoo-guide");
    const m = zEl("span", "zoo-guide-mascot", act.mascot);
    zLive(m, { k: "sway" });
    m.setAttribute("aria-hidden", "true");
    guide.appendChild(m);
    guide.appendChild(zEl("div", "zoo-bubble", act.desc));
    box.appendChild(guide);
    const list = zEl("div", "zoo-levels");
    ZOO_LEVELS.forEach(l => {
        const b = zEl("button", "zoo-level zoo-lv" + l.id + (l.id === sug ? " suggested" : ""));
        b.type = "button";
        b.dataset.level = String(l.id);
        const done = p.done[actId + ":" + l.id];
        b.appendChild(zEl("span", "zoo-level-stars", done ? "🌟".repeat(l.id) : l.stars));
        const t = zEl("span", "zoo-level-text");
        t.appendChild(zEl("strong", "", l.name + (done ? " ✓" : "")));
        t.appendChild(zEl("small", "", l.note + (l.id === sug ? " — مقترح لك 👍" : "")));
        b.appendChild(t);
        b.addEventListener("click", () => zooStartLevel(actId, l.id));
        list.appendChild(b);
    });
    box.appendChild(list);
}

/* ---------- الجولات ---------- */

function zooStartLevel(actId, level) {
    zooBind();
    zooTeardown();
    zoo.active = true;
    zoo.act = actId;
    zoo.level = level;
    zoo.round = 0;
    zoo.mistakes = 0;
    zoo.used = [];
    const scr = $("zooGame");
    if (!scr || !scr.classList.contains("active")) showScreen("zooGame");
    const act = ZOO_ACTS.find(a => a.id === actId);
    zooScenery(act.env);
    zooViews("play");
    const mas = $("zooMascot");
    if (mas) { mas.textContent = act.mascot; zLive(mas, { k: "sway" }); }
    zooRound();
}

function zooUpdateHead() {
    const rp = $("zooRoundText");
    if (rp) rp.textContent = "الجولة " + zNum(zoo.round + 1) + " من " + zNum(ZOO_ROUNDS);
    const bar = $("zooBar");
    if (bar) bar.style.width = Math.round((zoo.round + (zoo.roundSolved ? 1 : 0)) / ZOO_ROUNDS * 100) + "%";
    const lv = $("zooLevelText");
    const l = ZOO_LEVELS[zoo.level - 1];
    if (lv && l) lv.textContent = l.stars + " " + l.name;
    const pips = $("zooPips");
    if (pips) {
        pips.innerHTML = "";
        for (let i = 0; i < ZOO_ROUNDS; i++) pips.appendChild(zEl("i", i < zoo.round || (i === zoo.round && zoo.roundSolved) ? "on" : (i === zoo.round ? "cur" : "")));
    }
}

function zooSetNext(on) {
    const b = $("zooBtnNext");
    if (!b) return;
    b.disabled = !on;
    b.classList.toggle("ready", on);
    b.textContent = zoo.round >= ZOO_ROUNDS - 1 ? "إنهاء المستوى 🌟" : "التالي ◀";
}

function zooRound() {
    if (zoo.cur && zoo.cur.destroy) { try { zoo.cur.destroy(); } catch (e) { /* لا شيء */ } }
    zoo.cur = null;
    zoo.session++;
    const session = zoo.session;
    zoo.roundSolved = false;
    zoo.hint = 0;
    zooUpdateHead();
    zooSetNext(false);
    zSay("");
    zMascot("");
    document.querySelectorAll(".zoo-spark, .zoo-ghost").forEach(n => n.remove());
    const stage = $("zooStage");
    if (!stage) return;
    stage.innerHTML = "";
    stage.classList.remove("zoo-enter");
    void stage.offsetWidth;
    stage.classList.add("zoo-enter");
    setTimeout(() => { if (session === zoo.session) stage.classList.remove("zoo-enter"); }, 900);
    zooKeepInView();
    const api = {
        alive: () => session === zoo.session,
        say: (t, k) => { if (session === zoo.session) zSay(t, k); },
        mistake: () => { if (session === zoo.session) { zoo.mistakes++; zoo.hint = Math.min(3, zoo.hint + 1); zMascot("oops"); } },
        solved: () => { if (session === zoo.session) zooRoundSolved(); }
    };
    const act = ZOO_ACTS.find(a => a.id === zoo.act);
    const R = { who: zooRenderWho, feed: zooRenderFeed, home: zooRenderHome, count: zooRenderCount, shadow: zooRenderShadow };
    stage.appendChild(zEl("div", "zoo-prompt", act.prompt));
    zoo.cur = R[zoo.act](stage, api) || {};
}

function zooRoundSolved() {
    zoo.roundSolved = true;
    zooUpdateHead();
    zooSetNext(true);
    zMascot("cheer");
    const msgs = ["أحسنت! 🌟", "رائع جدًا! ⭐", "ممتاز! 👏", "عمل جميل! 🎉", "بطل حقيقي! 🏅"];
    zSay(msgs[zoo.round % msgs.length], "ok");
    const stage = $("zooStage");
    if (stage) stage.classList.add("zoo-win");
    const nx = $("zooBtnNext");
    if (nx) { try { nx.focus({ preventScroll: true }); } catch (e) { /* لا شيء */ } }
}

function zooNext() {
    if (!zoo.roundSolved) return;
    const st = $("zooStage");
    if (st) st.classList.remove("zoo-win");
    if (zoo.round >= ZOO_ROUNDS - 1) { zooFinishLevel(); return; }
    zoo.round++;
    zooRound();
}

function zooListen() {
    if (zoo.cur && zoo.cur.listen) zoo.cur.listen();
}

/* مساعدة تدريجية: كل ضغطة (أو خطأ) ترفع درجة التلميح */
function zooHint() {
    zoo.hint = Math.min(3, zoo.hint + 1);
    if (zoo.cur && zoo.cur.hint) zoo.cur.hint(zoo.hint);
}

function zooFinishLevel() {
    const key = zoo.act + ":" + zoo.level;
    const p = zooLoad();
    const first = !p.done[key];
    const prev = p.done[key];
    p.done[key] = { n: (prev ? prev.n : 0) + 1, best: prev ? Math.min(prev.best, zoo.mistakes) : zoo.mistakes };
    p.last[zoo.act] = { level: zoo.level, mistakes: zoo.mistakes };
    zooSave(p);
    if (first) { try { addStars(1); } catch (e) { /* لا شيء */ } }
    try {
        if (typeof StudentData !== "undefined" && StudentData.logEvent) {
            StudentData.logEvent({
                type: "activity_complete",
                subject: "games",
                skill: "zoo_" + zoo.act,
                activity: "level_" + zoo.level,
                correct: null
            });
        }
    } catch (e) { /* لا شيء */ }
    const dlg = $("zooDone");
    if (!dlg) { zooShowActs(); return; }
    const act = ZOO_ACTS.find(a => a.id === zoo.act);
    const t = $("zooDoneText");
    if (t) t.textContent = "أتممت «" + act.name + "» — " + ZOO_LEVELS[zoo.level - 1].name + (first ? " وحصلت على نجمة ⭐" : "");
    const cheer = $("zooCheer");
    if (cheer) {
        cheer.innerHTML = "";
        zShuffle(zAnimals()).slice(0, 3).forEach((a, i) => {
            const s = zEl("span", "zoo-cheer-animal", a.e);
            s.style.animationDelay = (i * 0.18) + "s";
            cheer.appendChild(s);
        });
    }
    const nx = $("zooDoneNext");
    if (nx) nx.hidden = zoo.level >= 3;
    dlg.hidden = false;
    zooSetInert(true);
    const box = dlg.querySelector(".zoo-dialog-box");
    if (box) {
        const tr = box.querySelector(".zoo-trophy");
        zBurst(tr, ["⭐", "✨", "🎉", "💛"]);
        const ses = zoo.session;
        setTimeout(() => { if (ses === zoo.session && !dlg.hidden) zBurst(tr, ["🌟", "✨", "💚", "⭐"]); }, 450);
    }
    speakZooLocal("أحسنت يا بطل");
    const focusBtn = (nx && !nx.hidden) ? nx : $("zooDoneAgain");
    if (focusBtn) focusBtn.focus();
}

function zooCloseDone() {
    const dlg = $("zooDone");
    if (dlg) dlg.hidden = true;
    zooSetInert(false);
}

function zooSetInert(on) {
    const dlg = $("zooDone");
    const wrap = dlg && dlg.parentElement;
    if (!wrap) return;
    Array.from(wrap.children).forEach(c => {
        if (c === dlg) return;
        if (on) c.setAttribute("inert", ""); else c.removeAttribute("inert");
    });
}

/* اختيار حيوانات لم تُستخدم بعد في هذا المستوى كلما أمكن */
function zooPickAnimals(pool, n) {
    const fresh = pool.filter(a => zoo.used.indexOf(a.n) < 0);
    const src = fresh.length >= n ? fresh : pool;
    const pick = zShuffle(src).slice(0, n);
    pick.forEach(a => zoo.used.push(a.n));
    if (zoo.used.length > 40) zoo.used.splice(0, zoo.used.length - 40);
    return pick;
}

/* يد إرشاد تتحرك من عنصر إلى هدفه (تلميح الدرجة الثانية فما فوق) */
function zGhost(fromEl, toEl) {
    if (!fromEl || !toEl || zCalm() || !fromEl.animate) return;
    document.querySelectorAll(".zoo-ghost").forEach(n => n.remove());
    const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    const g = zEl("span", "zoo-ghost", "👆");
    g.setAttribute("aria-hidden", "true");
    g.style.left = (a.left + a.width / 2 - 24) + "px";
    g.style.top = (a.top + a.height / 2 - 10) + "px";
    document.body.appendChild(g);
    const dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2);
    const an = g.animate([
        { transform: "translate(0,0) scale(1)", opacity: 0 },
        { transform: "translate(0,0) scale(1.15)", opacity: 1, offset: 0.2 },
        { transform: "translate(" + dx + "px," + dy + "px) scale(1.15)", opacity: 1, offset: 0.8 },
        { transform: "translate(" + dx + "px," + dy + "px) scale(1)", opacity: 0 }
    ], { duration: 1800, iterations: 2, easing: "ease-in-out" });
    an.onfinish = () => g.remove();
    setTimeout(() => g.remove(), 4200);
}

/* =========================================================
   محرّك المطابقة بالسحب (إطعام / بيت / ظلّ)
   سحب بالإصبع أو الفأرة، أو لمستان (اختر ثم المس الهدف)،
   أو لوحة المفاتيح. الخطأ يعيد العنصر برفق بلا خصم.
========================================================= */

function zooDragMatch(stage, spec, api) {
    const area = zEl("div", "zoo-match " + (spec.cls || ""));
    const tRow = zEl("div", "zoo-targets");
    const iRow = zEl("div", "zoo-items");
    area.appendChild(tRow);
    area.appendChild(iRow);
    stage.appendChild(area);

    const targets = spec.targets.map(t => {
        const b = zEl("button", "zoo-target " + (t.cls || ""));
        b.type = "button";
        b.dataset.key = t.key;
        if (t.bg) b.style.background = t.bg;
        const face = zEl("span", "zoo-target-face " + (t.faceCls || ""), t.emoji);
        face.setAttribute("aria-hidden", "true");
        if (t.live) zLive(face, t.live);
        b.appendChild(face);
        if (t.label) b.appendChild(zEl("span", "zoo-target-label", t.label));
        (t.deco || []).forEach((d, i) => { const s = zEl("span", "zoo-tdeco zt" + i, d); s.setAttribute("aria-hidden", "true"); b.appendChild(s); });
        const put = zEl("span", "zoo-target-put");
        put.setAttribute("aria-hidden", "true");
        b.appendChild(put);
        b.setAttribute("aria-label", t.aria || t.label || "هدف");
        tRow.appendChild(b);
        return { el: b, face, key: t.key, put, need: t.need || 0, got: 0, name: t.name };
    });

    let remaining = spec.items.filter(i => !i.decoy).length;
    const items = zShuffle(spec.items).map((it, idx) => {
        const b = zEl("button", "zoo-item " + (it.cls || ""), it.emoji);
        b.type = "button";
        b.dataset.key = it.key;
        b.dataset.id = String(idx);
        b.setAttribute("aria-label", it.aria || "عنصر");
        if (it.live) zLive(b, it.live);
        iRow.appendChild(b);
        return { el: b, key: it.key, emoji: it.emoji, name: it.name, decoy: !!it.decoy, wrong: 0, placed: false, tx: 0, ty: 0 };
    });

    let selected = null;
    let drag = null;

    function clearSel() {
        if (selected) selected.el.classList.remove("sel");
        selected = null;
    }

    function clearHints() {
        targets.forEach(t => t.el.classList.remove("hint", "hint2"));
        items.forEach(i => i.el.classList.remove("hint"));
    }

    function openTarget(item) {
        return targets.find(x => x.key === item.key && (!x.need || x.got < x.need));
    }

    /* تلميح تدريجي: 1 وميض الهدف، 2 يد إرشاد، 3 الهدف يكبر مع اليد */
    function hintFor(item, level) {
        clearHints();
        const t = openTarget(item);
        item.el.classList.add("hint");
        if (!t) return;
        t.el.classList.add("hint");
        if (level >= 2) { t.el.classList.add("hint2"); zGhost(item.el, t.el); }
    }

    function setTx(item, x, y, extra) {
        item.tx = x; item.ty = y;
        item.el.style.transform = "translate(" + x + "px," + y + "px)" + (extra || "");
    }

    function giveBack(item) {
        item.el.style.transition = "transform 0.35s cubic-bezier(.3,1.4,.5,1)";
        setTx(item, 0, 0);
        item.el.classList.remove("dragging");
        setTimeout(() => { item.el.style.transition = ""; item.el.style.zIndex = ""; }, 380);
    }

    function attempt(item, target) {
        if (!api.alive() || item.placed) return;
        if (target && item.key === target.key && (!target.need || target.got < target.need)) {
            item.placed = true;
            target.got++;
            remaining--;
            clearHints();
            clearSel();
            document.querySelectorAll(".zoo-ghost").forEach(n => n.remove());
            /* يطير العنصر إلى مركز الهدف ثم يستقر داخله */
            const a = item.el.getBoundingClientRect(), b = target.el.getBoundingClientRect();
            const ndx = item.tx + ((b.left + b.width / 2) - (a.left + a.width / 2));
            const ndy = item.ty + ((b.top + b.height / 2) - (a.top + a.height / 2));
            item.el.style.transition = "transform 0.28s ease-out, opacity 0.28s";
            item.el.classList.remove("dragging", "sel", "hint");
            item.el.classList.add("flying");
            setTx(item, ndx, ndy, " scale(0.55)");
            item.el.disabled = true;
            setTimeout(() => {
                item.el.classList.add("placed");
                const mini = zEl("span", "zoo-mini", item.emoji);
                if (spec.liveMini) zLive(mini, spec.liveMini(item));
                target.put.appendChild(mini);
                target.el.classList.add("hop", "done");
                setTimeout(() => target.el.classList.remove("hop"), 700);
                zBurst(target.el, spec.burst);
                if (spec.onMatch) spec.onMatch(item, target);
                if (remaining === 0) api.solved();
                else api.say("صحيح! بقي " + zNum(remaining) + " 🌟", "ok");
            }, 270);
            zMascot("cheer");
        } else {
            item.wrong++;
            api.mistake();
            item.el.classList.add("shake");
            setTimeout(() => item.el.classList.remove("shake"), 450);
            api.say("لا بأس، حاول مرة أخرى 💙");
            giveBack(item);
            if (target) { target.el.classList.add("nope"); setTimeout(() => target.el.classList.remove("nope"), 500); }
            if (!item.decoy) hintFor(item, Math.min(3, Math.max(1, zoo.hint)));
            else { clearHints(); const real = items.find(i => !i.placed && !i.decoy); if (real && zoo.hint >= 2) hintFor(real, zoo.hint); }
            clearSel();
        }
    }

    function pointTarget(x, y) {
        let best = null;
        targets.forEach(t => {
            const r = t.el.getBoundingClientRect();
            if (x >= r.left - 14 && x <= r.right + 14 && y >= r.top - 14 && y <= r.bottom + 14) best = best || t;
        });
        return best;
    }

    function onDown(e) {
        const b = e.target.closest(".zoo-item");
        if (!b || b.disabled || !api.alive()) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        const item = items.find(i => i.el === b);
        if (!item || item.placed) return;
        drag = { item, id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
        b.classList.add("pressed");
        try { b.setPointerCapture(e.pointerId); } catch (err) { /* لا شيء */ }
    }

    function onMove(e) {
        if (!drag || e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
        if (!drag.moved && Math.hypot(dx, dy) > 8) {
            drag.moved = true;
            drag.item.el.classList.remove("pressed");
            drag.item.el.classList.add("dragging");
            drag.item.el.style.transition = "none";
            drag.item.el.style.zIndex = "30";
            if (spec.onPick) spec.onPick(drag.item);
        }
        if (drag.moved) {
            setTx(drag.item, dx, dy, " scale(1.12) rotate(" + Math.max(-8, Math.min(8, dx / 14)) + "deg)");
            const t = pointTarget(e.clientX, e.clientY);
            targets.forEach(x => x.el.classList.toggle("over", x === t));
            if (e.cancelable) e.preventDefault();
        }
    }

    function onUp(e) {
        if (!drag || e.pointerId !== drag.id) return;
        const d = drag;
        drag = null;
        d.item.el.classList.remove("pressed");
        targets.forEach(x => x.el.classList.remove("over"));
        if (d.moved) {
            attempt(d.item, pointTarget(e.clientX, e.clientY));
        } else {
            /* لمسة عادية: اختر العنصر (أو ألغِ اختياره) */
            if (selected === d.item) clearSel();
            else {
                clearSel();
                selected = d.item;
                d.item.el.classList.add("sel");
                if (spec.onPick) spec.onPick(d.item);
                api.say("الآن المس المكان المناسب 👆");
            }
        }
    }

    function onCancel(e) {
        if (!drag || e.pointerId !== drag.id) return;
        const d = drag;
        drag = null;
        d.item.el.classList.remove("pressed");
        targets.forEach(x => x.el.classList.remove("over"));
        giveBack(d.item);
    }

    iRow.addEventListener("pointerdown", onDown);
    iRow.addEventListener("pointermove", onMove);
    iRow.addEventListener("pointerup", onUp);
    iRow.addEventListener("pointercancel", onCancel);
    iRow.addEventListener("keydown", e => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const b = e.target.closest(".zoo-item");
        if (!b || b.disabled) return;
        e.preventDefault();
        const item = items.find(i => i.el === b);
        clearSel();
        selected = item;
        b.classList.add("sel");
        if (spec.onPick) spec.onPick(item);
        api.say("الآن اختر المكان المناسب");
    });
    tRow.addEventListener("click", e => {
        const b = e.target.closest(".zoo-target");
        if (!b) return;
        const t = targets.find(x => x.el === b);
        if (!t) return;
        if (selected) attempt(selected, t);
        else if (t.name) speakZooLocal(t.name);
    });

    return {
        items, targets,
        hint(level) {
            const it = items.find(i => !i.placed && !i.decoy);
            if (it) { hintFor(it, level || 1); api.say(level >= 2 ? "اتبع اليد 👆" : "انظر إلى المكان المضيء 💡"); }
        },
        firstOpen: () => items.find(i => !i.placed && !i.decoy),
        selected: () => selected,
        attempt,
        destroy() { drag = null; document.querySelectorAll(".zoo-ghost").forEach(n => n.remove()); }
    };
}

/* =========================================================
   1) من هذا؟ — مرج: حيوانات تقف على لافتات خشبية
========================================================= */

function zooRenderWho(stage, api) {
    const n = zoo.level + 1;
    const pool = zAnimals();
    const target = zooPickAnimals(pool, 1)[0];
    const others = zShuffle(pool.filter(a => a.e !== target.e && a.n !== target.n)).slice(0, n - 1);
    const options = zShuffle([target].concat(others));
    const say = zEl("button", "zoo-sayit", "🔊");
    say.type = "button";
    say.setAttribute("aria-label", "اسمع الاسم مرة أخرى");
    say.addEventListener("click", () => speakZooLocal(target.n));
    stage.appendChild(say);
    const row = zEl("div", "zoo-who zoo-n" + n);
    let done = false;
    options.forEach(a => {
        const b = zEl("button", "zoo-card");
        b.type = "button";
        b.dataset.name = a.n;
        const face = zEl("span", "zoo-card-face", a.e);
        zLive(face, a);
        b.appendChild(face);
        b.appendChild(zEl("span", "zoo-card-name", ""));
        b.setAttribute("aria-label", "حيوان");
        b.addEventListener("click", () => {
            if (done || !api.alive()) return;
            if (a.n === target.n) {
                done = true;
                b.classList.add("right", "hop");
                b.querySelector(".zoo-card-name").textContent = a.n;
                b.setAttribute("aria-label", a.n);
                row.querySelectorAll(".zoo-card").forEach(x => { x.classList.remove("hint", "hint2"); if (x !== b) x.classList.add("dim"); });
                speakZooLocal(a.n);
                zBurst(b);
                api.solved();
            } else {
                api.mistake();
                b.classList.add("shake", "nope");
                setTimeout(() => b.classList.remove("shake", "nope"), 450);
                /* يُنطق اسم الحيوان الذي لُمس ليتعلّم الطفل الفرق، ثم تلميح تدريجي */
                speakZooLocal(a.n);
                api.say("هذا " + a.n + "، جرّب حيوانًا آخر 💙");
                setTimeout(() => { if (api.alive() && !done) giveHint(zoo.hint); }, 1400);
            }
        });
        row.appendChild(b);
    });
    stage.appendChild(row);
    function giveHint(level) {
        const cards = Array.from(row.querySelectorAll(".zoo-card"));
        cards.forEach(x => x.classList.remove("hint", "hint2", "dim"));
        const c = cards.find(x => x.dataset.name === target.n);
        if (!c) return;
        if (level >= 1) c.classList.add("hint");
        if (level >= 2) c.classList.add("hint2");
        if (level >= 3) cards.forEach(x => { if (x !== c) x.classList.add("dim"); });
        speakZooLocal(target.n);
    }
    setTimeout(() => { if (api.alive() && !done) speakZooLocal(target.n); }, 300);
    return {
        listen: () => speakZooLocal(target.n),
        hint: level => { giveHint(level); api.say(level >= 2 ? "انظر إلى البطاقة المضيئة 👆" : "اسمع مرة أخرى 👂"); },
        debug: { target: target.n }
    };
}

/* =========================================================
   2) أطعِم الحيوان — مزرعة: حيوانات في الأعلى وطاولة طعام خشبية
========================================================= */

function zooRenderFeed(stage, api) {
    const k = zoo.level;
    const feedable = zAnimals().filter(a => a.f);
    const chosen = zooPickAnimals(feedable, k);
    const used = new Set(chosen.map(a => a.f));
    const decoy = zShuffle(feedable.filter(a => !used.has(a.f))).slice(0, 1);
    const ctl = zooDragMatch(stage, {
        cls: "zoo-feed",
        burst: ["❤️", "😋", "✨", "💛"],
        targets: chosen.map(a => ({ key: a.n, name: a.n, emoji: a.e, faceCls: "animal", live: a, aria: "حيوان جائع", need: 1, cls: "zt-feed" })),
        items: chosen.map(a => ({ key: a.n, emoji: a.f, name: a.n, aria: "طعام", cls: "food" }))
            .concat(decoy.map(a => ({ key: "decoy:" + a.n, emoji: a.f, decoy: true, aria: "طعام", cls: "food" }))),
        onMatch: (it, t) => { speakZooLocal(t.key); }
    }, api);
    setTimeout(() => { if (api.alive() && chosen[0]) speakZooLocal(chosen[0].n); }, 300);
    return {
        listen: () => { const real = ctl.firstOpen(); if (real) speakZooLocal(real.name); },
        hint: level => ctl.hint(level),
        destroy: () => ctl.destroy(),
        debug: { ctl }
    };
}

/* =========================================================
   3) بيت الحيوان — مناظر: لوحات كبيرة للغابة والبحر والسماء والمزرعة
========================================================= */

function zooRenderHome(stage, api) {
    const nh = zoo.level + 1;
    const na = zoo.level + 2;
    const homeable = zAnimals().filter(a => a.g);
    const groups = zShuffle(Object.keys(ZOO_HABITATS).filter(g => homeable.some(a => a.g === g))).slice(0, nh);
    const first = groups.map(g => zooPickAnimals(homeable.filter(a => a.g === g), 1)[0]);
    const restPool = homeable.filter(a => groups.indexOf(a.g) >= 0 && first.indexOf(a) < 0);
    const rest = zooPickAnimals(restPool, Math.max(0, na - first.length));
    const animals = first.concat(rest);
    const needByGroup = {};
    animals.forEach(a => { needByGroup[a.g] = (needByGroup[a.g] || 0) + 1; });
    const ctl = zooDragMatch(stage, {
        cls: "zoo-homes",
        burst: ["✨", "🌟", "💚", "✨"],
        targets: groups.map(g => ({ key: g, emoji: ZOO_HABITATS[g].e, label: ZOO_HABITATS[g].name, aria: ZOO_HABITATS[g].name, need: needByGroup[g] || 0, cls: "hab hab-" + g, deco: ZOO_HABITATS[g].deco })),
        items: animals.map(a => ({ key: a.g, emoji: a.e, name: a.n, aria: "حيوان", cls: "animal", live: a })),
        liveMini: it => zAnimalOf(it.name),
        onMatch: it => { speakZooLocal(it.name); },
        onPick: it => { speakZooLocal(it.name); }
    }, api);
    return {
        listen: () => { const s = ctl.selected() || ctl.firstOpen(); if (s && s.name) speakZooLocal(s.name); },
        hint: level => ctl.hint(level),
        destroy: () => ctl.destroy(),
        debug: { ctl }
    };
}

/* =========================================================
   5) أين ظلّي؟ — مساء: ظلال داكنة تحت القمر
========================================================= */

function zooRenderShadow(stage, api) {
    const k = zoo.level + 1;
    const animals = zooPickAnimals(zAnimals(), k);
    const ctl = zooDragMatch(stage, {
        cls: "zoo-shadows",
        burst: ["⭐", "✨", "🌟", "✨"],
        targets: zShuffle(animals).map(a => ({ key: a.n, name: a.n, emoji: a.e, faceCls: "shadow", aria: "ظل حيوان", need: 1, cls: "zt-shadow" })),
        items: animals.map(a => ({ key: a.n, emoji: a.e, name: a.n, aria: "حيوان", cls: "animal", live: a })),
        liveMini: it => zAnimalOf(it.name),
        onMatch: it => { speakZooLocal(it.name); },
        onPick: it => { speakZooLocal(it.name); }
    }, api);
    return {
        listen: () => { const s = ctl.selected() || ctl.firstOpen(); if (s && s.name) speakZooLocal(s.name); },
        hint: level => ctl.hint(level),
        destroy: () => ctl.destroy(),
        debug: { ctl }
    };
}

/* =========================================================
   4) عدّ معي — حظيرة: المس كل حيوان لتعدّه ثم اختر العدد
========================================================= */

function zooRenderCount(stage, api) {
    const ranges = { 1: [1, 3], 2: [2, 6], 3: [4, 10] };
    const r = ranges[zoo.level];
    const avoid = zoo.used.length ? zoo.used[zoo.used.length - 1] : null;
    const total = r[0] + Math.floor(Math.random() * (r[1] - r[0] + 1));
    const animal = zooPickAnimals(zAnimals().filter(a => a.n !== avoid), 1)[0];
    const big = zEl("div", "zoo-bignum", "");
    big.setAttribute("aria-hidden", "true");
    stage.appendChild(big);
    const pen = zEl("div", "zoo-pen");
    const counted = [];
    const bubbles = [];
    const askRow = zEl("div", "zoo-ask");
    askRow.hidden = true;
    for (let i = 0; i < total; i++) {
        const b = zEl("button", "zoo-pet");
        b.type = "button";
        const face = zEl("span", "zoo-pet-face", animal.e);
        zLive(face, animal);
        b.appendChild(face);
        b.style.setProperty("--rot", ((i % 3) - 1) * 3 + "deg");
        b.style.setProperty("--lift", ((i * 7) % 3) * 6 + "px");
        b.setAttribute("aria-label", "حيوان لم يُعدّ بعد");
        b.addEventListener("click", () => {
            if (!api.alive() || b.dataset.counted) return;
            b.dataset.counted = "1";
            b.classList.remove("hint", "hint2");
            counted.push(b);
            const n = counted.length;
            b.classList.add("counted", "hop");
            setTimeout(() => b.classList.remove("hop"), 600);
            b.appendChild(zEl("span", "zoo-badge", zNum(n)));
            b.setAttribute("aria-label", "الحيوان رقم " + zNum(n));
            big.textContent = zNum(n);
            big.classList.remove("pop"); void big.offsetWidth; big.classList.add("pop");
            speakZooLocal(ZOO_NUM_WORDS[n]);
            zBurst(b, ["✨", "⭐"]);
            if (n === total) {
                api.say("عدّدتها كلها! كم العدد؟", "ok");
                askRow.hidden = false;
            } else api.say("");
        });
        pen.appendChild(b);
        bubbles.push(b);
    }
    stage.appendChild(pen);
    askRow.appendChild(zEl("div", "zoo-prompt", "كم عدد الحيوانات؟"));
    const nOpts = zoo.level === 3 ? 4 : 3;
    const opts = new Set([total]);
    const cand = zShuffle([total - 2, total - 1, total + 1, total + 2, total + 3].filter(x => x >= 1 && x <= 10 && x !== total));
    for (const c of cand) { if (opts.size >= nOpts) break; opts.add(c); }
    const numRow = zEl("div", "zoo-nums zoo-n" + nOpts);
    let done = false;
    function numHint(level) {
        numRow.querySelectorAll(".zoo-num").forEach(x => {
            x.classList.remove("hint", "hint2", "dim");
            if (Number(x.dataset.v) === total) { if (level >= 1) x.classList.add("hint"); if (level >= 2) x.classList.add("hint2"); }
            else if (level >= 3) x.classList.add("dim");
        });
    }
    zShuffle(Array.from(opts)).forEach(v => {
        const b = zEl("button", "zoo-num", zNum(v));
        b.type = "button";
        b.dataset.v = String(v);
        b.setAttribute("aria-label", "العدد " + zNum(v));
        b.addEventListener("click", () => {
            if (done || !api.alive()) return;
            if (v === total) {
                done = true;
                b.classList.add("right", "hop");
                numRow.querySelectorAll(".zoo-num").forEach(x => x.classList.remove("hint", "hint2", "dim"));
                speakZooLocal(ZOO_NUM_WORDS[total]);
                zBurst(b);
                api.solved();
            } else {
                api.mistake();
                b.classList.add("shake", "nope");
                setTimeout(() => b.classList.remove("shake", "nope"), 450);
                api.say("لا بأس، عُدّها معي مرة أخرى 💙");
                numHint(zoo.hint);
            }
        });
        numRow.appendChild(b);
    });
    askRow.appendChild(numRow);
    stage.appendChild(askRow);
    return {
        listen: () => {
            const next = bubbles.find(b => !b.dataset.counted);
            if (next) speakZooLocal(ZOO_NUM_WORDS[counted.length + 1]); else speakZooLocal(ZOO_NUM_WORDS[total]);
        },
        hint: level => {
            const next = bubbles.find(b => !b.dataset.counted);
            if (next) {
                bubbles.forEach(b => b.classList.remove("hint", "hint2"));
                next.classList.add("hint");
                if (level >= 2) { next.classList.add("hint2"); zGhost(pen, next); }
                api.say("المس هذا الحيوان 👆");
            } else { numHint(level); api.say("انظر إلى الرقم المضيء 👆"); }
        },
        destroy: () => { document.querySelectorAll(".zoo-ghost").forEach(n => n.remove()); },
        debug: { total, animal: animal.n }
    };
}

/* ---------- ربط الشاشات: تنظيف عند مغادرة اللعبة ---------- */

const originalShowScreenForZoo = showScreen;

showScreen = function (screenId) {
    if (typeof zoo !== "undefined" && zoo.active && screenId !== "zooGame") {
        zooTeardown();
        zoo.active = false;
    }
    return originalShowScreenForZoo.apply(this, arguments);
};

window.startZooGame = startZooGame;
window.exitZooGame = exitZooGame;
window.zoo = zoo;

/* =========================================================
   🔚 نهاية لعبة «أصدقاء الحديقة» المستقلة
========================================================= */


/* =========================================================
   👥 واجهة ملفات الطلاب — اختيار سريع + إدارة (للمعلم) + تجاوز القفل
   التبديل بين الطلاب مفتوح بلمسة واحدة؛ الإضافة والتعديل والحذف
   وتجاوز القفل خلف نفس بوابة المعلم (رمز سري أو سؤال حساب).
========================================================= */
(function () {
    var view = "pick";          // pick | gate | manage | edit | confirm
    var gateOK = false;
    var gateNext = "manage";
    var editId = null;          // null = طالب جديد
    var editAvatar = "🦁";
    var confirmId = null;
    var note = "";
    var root = null;

    function el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    }
    function nm(s, i) { return s.name && s.name.trim() ? s.name : "طالب " + arabicNumber(i + 1); }
    function btn(cls, text, act, id) {
        var b = el("button", cls, text);
        b.type = "button";
        b.dataset.act = act;
        if (id) b.dataset.id = id;
        return b;
    }

    function ensureRoot() {
        if (root) return root;
        root = el("div", "stu-overlay");
        root.id = "stuOverlay";
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-modal", "true");
        root.hidden = true;
        root.addEventListener("click", onClick);
        document.body.appendChild(root);
        return root;
    }

    function open(v) {
        ensureRoot();
        gateOK = teacherUnlockedSession === true;
        note = "";
        view = v || "pick";
        root.hidden = false;
        document.body.classList.add("stu-open");
        render();
    }
    function close() {
        if (!root) return;
        root.hidden = true;
        document.body.classList.remove("stu-open");
        gateOK = false;
    }

    function panel(title) {
        root.innerHTML = "";
        var p = el("div", "stu-panel");
        p.appendChild(el("h2", "stu-title", title));
        root.appendChild(p);
        return p;
    }
    function noteLine(p) {
        if (note) p.appendChild(el("p", "stu-note", note));
    }

    function render() {
        if (view === "pick") return renderPick();
        if (view === "gate") return renderGate();
        if (view === "manage") return renderManage();
        if (view === "edit") return renderEdit();
        if (view === "confirm") return renderConfirm();
    }

    function renderPick() {
        var p = panel("👥 من سيتعلم الآن؟");
        var grid = el("div", "stu-grid");
        StudentStore.list().forEach(function (s, i) {
            var b = el("button", "stu-card" + (s.current ? " current" : ""));
            b.type = "button";
            b.dataset.act = "switch";
            b.dataset.id = s.id;
            b.appendChild(el("span", "stu-card-avatar", s.avatar));
            b.appendChild(el("span", "stu-card-name", nm(s, i)));
            var stt = el("span", "stu-card-stats");
            stt.appendChild(el("span", "", "⭐ " + arabicNumber(s.stars)));
            stt.appendChild(el("span", "", "🎯 " + arabicNumber(s.level)));
            b.appendChild(stt);
            if (s.current) b.appendChild(el("span", "stu-card-check", "✓ الحالي"));
            grid.appendChild(b);
        });
        p.appendChild(grid);
        noteLine(p);
        var row = el("div", "stu-actions");
        row.appendChild(btn("stu-btn", "➕ طالب جديد", "new"));
        row.appendChild(btn("stu-btn", "⚙️ إدارة الطلاب", "manage"));
        row.appendChild(btn("stu-btn ghost", "إغلاق", "close"));
        p.appendChild(row);
    }

    function renderGate() {
        var p = panel("🔒 للمعلم فقط");
        var pin = localStorage.getItem("taha_teacher_pin");
        p.appendChild(el("p", "stu-q", pin ? "🔢 أدخل الرمز السري (٤ أرقام)" : generateTeacherMathQuestion()));
        var inp = el("input", "stu-input");
        inp.id = "stuGateInput";
        inp.type = "text";
        inp.inputMode = "numeric";
        inp.autocomplete = "off";
        if (pin) inp.maxLength = 4;
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") onClick({ target: root.querySelector("[data-act=gateok]") }); });
        p.appendChild(inp);
        noteLine(p);
        var row = el("div", "stu-actions");
        row.appendChild(btn("stu-btn", "تأكيد", "gateok"));
        row.appendChild(btn("stu-btn ghost", "رجوع", "back"));
        p.appendChild(row);
        setTimeout(function () { try { inp.focus(); } catch (e) { /* لا شيء */ } }, 50);
    }

    function renderManage() {
        var p = panel("⚙️ إدارة الطلاب");
        var list = el("div", "stu-rows");
        StudentStore.list().forEach(function (s, i) {
            var r = el("div", "stu-row" + (s.current ? " current" : ""));
            r.appendChild(el("span", "stu-row-avatar", s.avatar));
            var info = el("span", "stu-row-info");
            info.appendChild(el("b", "", nm(s, i) + (s.current ? "  ✓" : "")));
            var sm = el("small", "stu-card-stats");
            sm.appendChild(el("span", "", "⭐ " + arabicNumber(s.stars)));
            sm.appendChild(el("span", "", "🎯 " + arabicNumber(s.level)));
            info.appendChild(sm);
            r.appendChild(info);
            var ob = btn("stu-mini" + (s.override ? " on" : ""), s.override ? "🔓 مفتوحة" : "🔒 عادي", "ovr", s.id);
            ob.setAttribute("aria-pressed", s.override ? "true" : "false");
            ob.setAttribute("aria-label", "فتح كل المستويات للطالب " + nm(s, i));
            r.appendChild(ob);
            var eb = btn("stu-mini", "✏️", "edit", s.id);
            eb.setAttribute("aria-label", "تعديل " + nm(s, i));
            r.appendChild(eb);
            var db = btn("stu-mini danger", "🗑", "del", s.id);
            db.setAttribute("aria-label", "حذف " + nm(s, i));
            if (StudentStore.count() <= 1) db.disabled = true;
            r.appendChild(db);
            list.appendChild(r);
        });
        p.appendChild(list);
        p.appendChild(el("p", "stu-hint", "🔓 «مفتوحة» = يظهر للطالب كل المستويات دون تغيير تقدّمه الحقيقي."));
        noteLine(p);
        var row = el("div", "stu-actions");
        var add = btn("stu-btn", "➕ طالب جديد", "new");
        if (StudentStore.count() >= StudentStore.MAX) add.disabled = true;
        row.appendChild(add);
        row.appendChild(btn("stu-btn ghost", "رجوع", "pick"));
        p.appendChild(row);
    }

    function renderEdit() {
        var p = panel(editId ? "✏️ تعديل الطالب" : "➕ طالب جديد");
        var lab = el("label", "stu-label", "اسم الطالب");
        lab.htmlFor = "stuNameInput";
        p.appendChild(lab);
        var inp = el("input", "stu-input");
        inp.id = "stuNameInput";
        inp.type = "text";
        inp.maxLength = 24;
        inp.autocomplete = "off";
        inp.placeholder = "اكتب الاسم";
        if (editId) inp.value = StudentStore.get(editId).name;
        p.appendChild(inp);
        p.appendChild(el("div", "stu-label", "الصورة"));
        var g = el("div", "stu-avatars");
        AVATAR_OPTIONS.forEach(function (a) {
            var b = btn("stu-av" + (a === editAvatar ? " selected" : ""), a, "av");
            b.dataset.av = a;
            g.appendChild(b);
        });
        p.appendChild(g);
        noteLine(p);
        var row = el("div", "stu-actions");
        row.appendChild(btn("stu-btn", "💾 حفظ", "save"));
        row.appendChild(btn("stu-btn ghost", "إلغاء", "manage"));
        p.appendChild(row);
    }

    function renderConfirm() {
        var s = StudentStore.get(confirmId);
        var p = panel("🗑 حذف الطالب؟");
        p.appendChild(el("p", "stu-q", "سيُحذف «" + (s.name || "الطالب") + "» وكل نجومه ومستوياته وسجله نهائيًا."));
        var row = el("div", "stu-actions");
        row.appendChild(btn("stu-btn danger", "نعم، احذف", "delok"));
        row.appendChild(btn("stu-btn ghost", "لا، رجوع", "manage"));
        p.appendChild(row);
    }

    function need(next) {
        if (gateOK) { view = next; note = ""; render(); return; }
        gateNext = next;
        view = "gate";
        note = "";
        render();
    }

    function onClick(e) {
        var t = e.target;
        if (t === root) { close(); return; }
        var b = t && t.closest ? t.closest("[data-act]") : null;
        if (!b || b.disabled) return;
        var act = b.dataset.act, id = b.dataset.id;
        if (act === "switch") {
            if (id === StudentStore.currentId()) { close(); return; }
            var s = StudentStore.get(id);
            var p = panel("🔄 جارٍ التبديل…");
            p.appendChild(el("p", "stu-q", s.avatar + " " + (s.name || "")));
            StudentStore.switchTo(id);
        } else if (act === "close") close();
        else if (act === "pick") { view = "pick"; note = ""; render(); }
        else if (act === "back") { view = "pick"; note = ""; render(); }
        else if (act === "manage") need("manage");
        else if (act === "new") {
            editId = null; editAvatar = AVATAR_OPTIONS[StudentStore.count() % AVATAR_OPTIONS.length];
            need("edit");
        } else if (act === "gateok") {
            var inp = document.getElementById("stuGateInput");
            var v = inp ? inp.value.trim() : "";
            var pin = localStorage.getItem("taha_teacher_pin");
            var ok = pin ? v === pin : Number(v) === teacherMathAnswer && v !== "";
            if (ok) { gateOK = true; view = gateNext; note = ""; render(); }
            else { note = "😊 حاول مرة أخرى"; render(); }
        } else if (act === "ovr") {
            StudentStore.setOverride(id, !StudentStore.isOverride(id));
            render();
        } else if (act === "edit") {
            editId = id; editAvatar = StudentStore.get(id).avatar; view = "edit"; note = ""; render();
        } else if (act === "av") {
            var typed = document.getElementById("stuNameInput");
            var keep = typed ? typed.value : "";
            editAvatar = b.dataset.av;
            render();
            var again = document.getElementById("stuNameInput");
            if (again) again.value = keep;
        } else if (act === "save") {
            var ni = document.getElementById("stuNameInput");
            var name = ni ? ni.value.trim() : "";
            if (!name) { note = "😊 اكتب اسم الطالب أولًا"; render(); return; }
            if (editId) {
                StudentStore.update(editId, name, editAvatar);
                if (editId === StudentStore.currentId() && typeof applyProfileToHeader === "function") applyProfileToHeader();
                note = "✅ تم الحفظ";
            } else {
                var nid = StudentStore.add(name, editAvatar);
                note = nid ? "✅ تمت إضافة " + name : "لا يمكن إضافة أكثر من " + arabicNumber(StudentStore.MAX) + " طالبًا";
            }
            view = "manage"; render();
        } else if (act === "del") {
            confirmId = id; view = "confirm"; render();
        } else if (act === "delok") {
            var r = StudentStore.remove(confirmId);
            if (r === "switched") { StudentStore.switchTo(StudentStore.currentId()); return; }
            note = r ? "✅ تم الحذف" : "";
            view = "manage"; render();
        }
    }

    window.openStudentPicker = function () { open("pick"); };
    window.openStudentManager = function () { open("manage"); };

    /* تجاوز القفل داخل لوحة المعلم (للطالب الحالي) */
    window.toggleTeacherOverride = function (on) {
        StudentStore.setOverride(StudentStore.currentId(), !!on);
        refreshTeacherStudentCard();
    };
    function refreshTeacherStudentCard() {
        var cb = document.getElementById("teacherOverrideToggle");
        if (cb) cb.checked = StudentStore.isOverride();
        var c = document.getElementById("teacherStudentCount");
        if (c) c.textContent = arabicNumber(StudentStore.count());
    }
    var origStats = renderTeacherStats;
    renderTeacherStats = function () {
        origStats.apply(this, arguments);
        refreshTeacherStudentCard();
    };

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && root && !root.hidden) close();
    });

    /* بعد التبديل: شاشة رئيسية + ترحيب قصير */
    document.addEventListener("DOMContentLoaded", function () {
        var chip = document.getElementById("headerProfileChip");
        if (chip) {
            chip.setAttribute("onclick", "openStudentPicker()");
            chip.setAttribute("aria-label", "تبديل الطالب");
            if (!chip.querySelector(".stu-swap")) chip.appendChild(el("span", "stu-swap", "⇄"));
        }
        var sw = null;
        try { sw = sessionStorage.getItem("taha_stu_switched"); sessionStorage.removeItem("taha_stu_switched"); } catch (e) { /* لا شيء */ }
        if (sw) {
            var n = localStorage.getItem("taha_child_name");
            var t = el("div", "stu-toast", "👋 أهلًا " + (n || "بك") + "!");
            document.body.appendChild(t);
            setTimeout(function () { t.remove(); }, 2200);
        }
    });
})();

/* =========================================================
   🧺 سلال الفرز — لعبة تصنيف مستقلة (قسم الألعاب)
   ---------------------------------------------------------
   فكرتها: يرى الطفل صورة ويسمع اسمها (ملف MP3 محلي موجود أصلًا)
   ثم يضعها مع أشباهها: فواكه، حيوانات، مركبات، ملابس...
   تبني مفهوم «الفئة» نفسه عبر مجالات مختلفة (لا تكرر «بيت الحيوان»
   الذي يخص موطن الحيوان فقط).

   • ٤ حزم × ٥ مراحل: من يشبهني؟ ← سلتان ← ثلاث سلال ← من لا ينتمي؟ ← الإتقان.
   • بلا مؤقت ولا أرواح ولا عقاب: الإجابة الخاطئة تُخفِت الخيار، وبعد
     خطأين يُبرَز الصحيح، وبعد ثلاثة يُوضَع بهدوء (ولا يُحتسب من أول مرة).
   • الصوت: أسماء الكلمات والعبارات المسجَّلة فقط عبر EduAudio — لا نطق آلي،
     ولا تسجيلات جديدة. نصوص السلال مكتوبة فقط.
   • التقدّم: taha_sortbaskets_v1 (معزول لكل طالب تلقائيًا عبر StudentStore).
   • المكافآت: نجمة واحدة لأول إكمال لكل مرحلة، ونجمتان لأول إتقان لكل حزمة؛
     إعادة المرحلة لا تمنح نجومًا.
   • التصنيف مُراجَع: استُبعد كل عنصر ملتبس (رمز يحتمل أكثر من فئة).
   • معزولة بالكامل داخل دالة واحدة، ولا تغلّف showScreen ولا تعدّل أي لعبة.
========================================================= */

(function () {
    "use strict";

    const SB_KEY = "taha_sortbaskets_v1";
    const SB_BACKUP_KEY = "taha_sortbaskets_v1_corrupt_backup";
    const SB_SCREEN = "sortGame";
    const SB_PASS = 6;   /* الإتقان: ٦ من ٨ من أول مرة */

    /* ---------------- التصنيف (كلمة + رمز) ----------------
       كل كلمة لها ملف MP3 محلي. المستبعد لالتباسه (لا يدخل اللعبة):
       يد ✋ (إشارة)، بيت 🏠 (يلتبس مع أشياء البيت)، قصر/مسجد/مدرسة/خيمة/جسر
       (فئة أماكن ملتبسة وقليلة)، تاج 👑، ظرف ✉️، قلب ❤️، ثوم 🧄، ساعة ⏰،
       صحن 🍽️، صندوق 📦، ثلج ❄️، عصير 🧃. */
    const SB_CATS = {
        animals:  { t: "حيوانات",      ex: "🦁", col: "#f97316", items: "أرنب🐰 أسد🦁 أخطبوط🐙 بطة🦆 بقرة🐄 تمساح🐊 ثعلب🦊 ثعبان🐍 جمل🐪 حصان🐎 حوت🐳 خروف🐑 دجاجة🐔 دب🐻 ديك🐓 دلفين🐬 ذئب🐺 زرافة🦒 سمكة🐟 ضفدع🐸 طاووس🦚 عصفور🐦 غوريلا🦍 فراشة🦋 فيل🐘 فأر🐭 قرد🐒 كلب🐶 نسر🦅 نحل🐝 نمر🐯" },
        fruits:   { t: "فواكه",        ex: "🍎", col: "#ef4444", items: "أناناس🍍 برتقال🍊 بطيخ🍉 تفاح🍎 خوخ🍑 عنب🍇 فراولة🍓 كرز🍒 ليمون🍋 موز🍌" },
        veg:      { t: "خضروات",       ex: "🥕", col: "#22c55e", items: "جزر🥕 خيار🥒 خس🥬" },
        vehicles: { t: "مركبات",       ex: "🚗", col: "#3b82f6", items: "دراجة🚲 سفينة🚢 سيارة🚗 صاروخ🚀 طائرة✈️" },
        clothes:  { t: "ملابس",        ex: "👕", col: "#a855f7", items: "حذاء👞 فستان👗 قميص👕 قفاز🧤" },
        body:     { t: "جسم الإنسان",  ex: "👁️", col: "#ec4899", items: "أذن👂 عين👁️ لسان👅 ضرس🦷" },
        school:   { t: "أدوات المدرسة", ex: "✏️", col: "#ca8a04", items: "قلم✏️ كتاب📘 دفتر📓 مقص✂️ حقيبة🎒" },
        home:     { t: "أشياء البيت",  ex: "🛏️", col: "#0d9488", items: "سرير🛏️ كرسي🪑 باب🚪 لمبة💡 مفتاح🔑" },
        sky:      { t: "في السماء",    ex: "☁️", col: "#0ea5e9", items: "شمس☀️ غيوم☁️ نجمة⭐ هلال🌙" },
        plants:   { t: "نباتات",       ex: "🌳", col: "#16a34a", items: "شجرة🌳 نخلة🌴 زهرة🌸 وردة🌹 صبار🌵" },
        food:     { t: "طعام وشراب",   ex: "🍞", col: "#d97706", items: "جبنة🧀 حليب🥛 خبز🍞 عسل🍯 كيك🎂 لحم🥩" }
    };

    /* فئتان لا تجتمعان في جولة واحدة (عنصر قد يصحّ في كلتيهما) */
    const SB_AVOID = [
        ["animals", "sky"], ["animals", "food"], ["food", "fruits"], ["food", "veg"], ["plants", "veg"],
        ["school", "clothes"], ["fruits", "plants"], ["vehicles", "sky"]
    ];
    /* عنصر يُستبعد متى وُجدت فئة معيّنة في الجولة نفسها (قد يُفهم أنه منها) */
    const SB_ITEM_AVOID = [["مفتاح", "vehicles"], ["كرسي", "school"]];

    const SB_PACKS = [
        { id: "p1", t: "حيوانات وفواكه ومركبات", icon: "🦁", cats: ["animals", "fruits", "vehicles"] },
        { id: "p2", t: "ملابسي وجسمي وبيتي",     icon: "👕", cats: ["clothes", "body", "home"] },
        { id: "p3", t: "مدرستي والطبيعة",         icon: "🎒", cats: ["school", "plants", "sky"] },
        { id: "p4", t: "فرز المحترفين",           icon: "🏅", cats: null }
    ];

    const SB_STAGES = [
        { id: "s1", t: "من يشبهني؟",   icon: "🤝", kind: "match",   n: 5, prompt: "اختر الصورة التي تشبه الصورة الكبيرة" },
        { id: "s2", t: "سلتان",         icon: "🧺", kind: "basket2", n: 6, prompt: "ضع الصورة في السلة المناسبة" },
        { id: "s3", t: "ثلاث سلال",     icon: "🧺", kind: "basket3", n: 6, prompt: "ضع الصورة في السلة المناسبة" },
        { id: "s4", t: "من لا ينتمي؟",  icon: "🔍", kind: "odd",     n: 5, prompt: "اختر الصورة التي لا تنتمي للمجموعة" },
        { id: "s5", t: "الإتقان",       icon: "🏅", kind: "mastery", n: 8, prompt: "اختبر نفسك: صور متنوعة" }
    ];

    const SB_PRAISE = ["صحيح", "أحسنت يا بطل", "أحسنت، عمل رائع"];
    const SB_STAGE_DONE = "أحسنت! أكملت المستوى بنجاح";
    const SB_RETRY = "محاولة رائعة، لنحاول مرة أخرى";
    const SB_LOCKED = "أكمل المستوى السابق أولًا لتفتح هذا المستوى";

    /* تحليل نص الفئة إلى عناصر {w, e, c} */
    Object.keys(SB_CATS).forEach(k => {
        SB_CATS[k].id = k;
        SB_CATS[k].list = SB_CATS[k].items.split(" ").map(s => {
            const i = s.search(/[^؀-ۿ]/);
            return { w: s.slice(0, i), e: s.slice(i), c: k };
        });
    });

    /* الكلمات المستبعدة لمجموعة فئات حاضرة في الجولة */
    function sbExcl(cats) {
        const out = new Set();
        SB_ITEM_AVOID.forEach(r => { if (cats.indexOf(r[1]) >= 0) out.add(r[0]); });
        return out;
    }

    function sbAvoid(a, b) {
        return SB_AVOID.some(p => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
    }

    /* لا يدخل اللعبة عنصر بلا ملف صوت */
    function sbPool(c) {
        return SB_CATS[c].list.filter(it => typeof EduAudio === "undefined" ? true : EduAudio.has(it.w));
    }

    /* ---------------- عشوائية حتمية ---------------- */
    function sbHash(s) {
        let h = 2166136261;
        for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
        return h >>> 0;
    }
    function sbRng(seed) {
        let a = seed >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function sbShuffle(arr, rnd) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1));
            const t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    /* ---------------- التقدّم (آمن ضد القيم التالفة) ---------------- */
    let sbMemo = null;
    let sbMemoOnly = false;

    function sbIsObj(x) { return !!x && typeof x === "object" && !Array.isArray(x); }
    function sbClamp(n, a, b) { n = Number(n); if (!isFinite(n)) n = 0; return Math.max(a, Math.min(b, Math.floor(n))); }

    function sbNormalize(raw) {
        const out = { v: 1, packs: {}, last: null };
        const rp = (sbIsObj(raw) && sbIsObj(raw.packs)) ? raw.packs : {};
        SB_PACKS.forEach(p => {
            const rpk = sbIsObj(rp[p.id]) ? rp[p.id] : {};
            const rst = sbIsObj(rpk.stages) ? rpk.stages : {};
            const o = { stages: {}, mastery: null };
            SB_STAGES.forEach(s => {
                const x = sbIsObj(rst[s.id]) ? rst[s.id] : {};
                o.stages[s.id] = {
                    done: x.done === true,
                    stars: x.done === true ? sbClamp(x.stars, 0, 3) : 0,
                    plays: sbClamp(x.plays, 0, 100000),
                    rewarded: x.rewarded === true
                };
            });
            const m = sbIsObj(rpk.mastery) ? rpk.mastery : {};
            o.mastery = {
                passed: m.passed === true,
                best: sbClamp(m.best, 0, 8),
                stars: sbClamp(m.stars, 0, 3),
                attempts: sbClamp(m.attempts, 0, 100000),
                rewarded: m.rewarded === true
            };
            out.packs[p.id] = o;
        });
        out.last = (sbIsObj(raw) && typeof raw.last === "string" && SB_PACKS.some(p => p.id === raw.last)) ? raw.last : null;
        return out;
    }

    function sbLoad() {
        if (sbMemoOnly && sbMemo) return sbMemo;
        let rawStr = null;
        try { rawStr = localStorage.getItem(SB_KEY); } catch (e) { rawStr = null; }
        if (rawStr == null) return sbNormalize(null);
        let parsed;
        try { parsed = JSON.parse(rawStr); } catch (e) { parsed = undefined; }
        if (!sbIsObj(parsed)) {
            /* قيمة تالفة: نسخة احتياطية واحدة قبل أن يُكتب فوقها أي شيء */
            try { if (localStorage.getItem(SB_BACKUP_KEY) == null) localStorage.setItem(SB_BACKUP_KEY, String(rawStr)); } catch (e) { /* لا شيء */ }
            return sbNormalize(null);
        }
        return sbNormalize(parsed);
    }

    function sbSave(p) {
        sbMemo = p;
        try { localStorage.setItem(SB_KEY, JSON.stringify(p)); sbMemoOnly = false; }
        catch (e) { sbMemoOnly = true; }
    }

    /* ---------------- أدوات DOM ---------------- */
    function el(tag, cls, text) {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }
    function $q(id) { return document.getElementById(id); }
    function num(n) { return (typeof arabicNumber === "function") ? arabicNumber(n) : String(n); }
    function calmOrReduced() {
        try {
            if (document.body.classList.contains("calm-mode")) return true;
            return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        } catch (e) { return false; }
    }

    /* ---------------- الحالة ---------------- */
    const sb = {
        session: 0,
        timers: [],
        view: "map",
        pack: null,
        stage: null,
        trials: [],
        idx: -1,
        first: 0,
        busy: false,
        bound: false
    };

    function sbActive() {
        const s = $q(SB_SCREEN);
        return !!(s && s.classList.contains("active"));
    }

    function sbClearTimers() {
        sb.timers.forEach(t => clearTimeout(t));
        sb.timers = [];
    }

    function sbTeardown() {
        sb.session++;
        sbClearTimers();
        sb.busy = false;
        try { if (typeof EduAudio !== "undefined") EduAudio.stop(); } catch (e) { /* لا شيء */ }
        const fx = $q("sbFx"); if (fx) fx.innerHTML = "";
        sbHideDone();
    }

    function sbLater(fn, ms) {
        const session = sb.session;
        const id = setTimeout(() => {
            sb.timers = sb.timers.filter(t => t !== id);
            if (session !== sb.session) return;
            if (!sbActive()) { sbTeardown(); return; }
            fn();
        }, ms);
        sb.timers.push(id);
    }

    function sbSay(what, done, maxMs) {
        const session = sb.session;
        let fired = false;
        const fin = () => {
            if (fired || session !== sb.session) return;
            fired = true;
            if (done) done();
        };
        if (typeof EduAudio === "undefined") { fin(); return; }
        try { EduAudio.play(what, { mode: "interrupt", done: fin }); } catch (e) { fin(); return; }
        if (done) sbLater(fin, maxMs || 3500);
    }

    /* ---------------- بناء الجولات ---------------- */
    function sbStageCats(pack, count, rnd, plays) {
        if (pack.cats) {
            if (count >= pack.cats.length) return pack.cats.slice();
            const pairs = [[0, 1], [1, 2], [0, 2]];
            const pr = pairs[plays % 3];
            return [pack.cats[pr[0]], pack.cats[pr[1]]];
        }
        const all = Object.keys(SB_CATS).filter(c => sbPool(c).length >= 3);
        for (let a = 0; a < 60; a++) {
            const pick = sbShuffle(all, rnd).slice(0, count);
            let ok = true;
            for (let i = 0; i < pick.length; i++) for (let j = i + 1; j < pick.length; j++) if (sbAvoid(pick[i], pick[j])) ok = false;
            if (ok) return pick;
        }
        /* احتياط حتمي: أول تركيبة لا تحوي فئتين متعارضتين */
        const n = all.length;
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
            if (sbAvoid(all[i], all[j])) continue;
            if (count === 2) return [all[i], all[j]];
            for (let k = j + 1; k < n; k++) if (!sbAvoid(all[i], all[k]) && !sbAvoid(all[j], all[k])) return [all[i], all[j], all[k]];
        }
        return all.slice(0, count);
    }

    function sbMakePicker(rnd) {
        const used = new Set();
        return function (c, exclude) {
            let pool = sbPool(c).filter(it => !exclude || !exclude.has(it.w));
            let fresh = pool.filter(it => !used.has(it.w));
            if (!fresh.length) { pool.forEach(it => used.delete(it.w)); fresh = pool; }
            const it = fresh[Math.floor(rnd() * fresh.length)];
            used.add(it.w);
            return it;
        };
    }

    function sbBuildTrials(pack, stage, plays) {
        const rnd = sbRng(sbHash(pack.id + ":" + stage.id) + plays * 7919 + 1);
        const pick = sbMakePicker(rnd);
        const cats3 = sbStageCats(pack, 3, rnd, plays);
        const cats2 = sbStageCats(pack, 2, rnd, plays);
        const trials = [];

        function matchTrial(cats, k, three) {
            const a = cats[k % cats.length];
            const others = cats.filter(c => c !== a);
            const oc = others[k % others.length];
            const o2 = three ? (others.find(c => c !== oc) || oc) : null;
            const ex = sbExcl(three ? [a, oc, o2] : [a, oc]);
            const sample = pick(a, ex);
            const same = pick(a, new Set(Array.from(ex).concat([sample.w])));
            const other = pick(oc, ex);
            const choices = [same, other];
            if (three) choices.push(pick(o2, ex));
            return { type: "match", cat: a, sample: sample, choices: sbShuffle(choices, rnd).map(x => ({ w: x.w, e: x.e, c: x.c, ok: x.c === a })) };
        }
        function oddTrial(cats, k) {
            const x = cats[k % cats.length];
            const ys = cats.filter(c => c !== x);
            const y = ys[k % ys.length];
            const same = [];
            const base = sbExcl([x, y]);
            const ex = new Set(base);
            for (let i = 0; i < 3; i++) { const it = pick(x, ex); ex.add(it.w); same.push(it); }
            const odd = pick(y, base);
            const cards = sbShuffle(same.concat([odd]), rnd).map(z => ({ w: z.w, e: z.e, c: z.c, ok: z.c === y }));
            return { type: "odd", cat: x, oddCat: y, cards: cards };
        }
        function basketTrials(cats, per) {
            const list = [];
            cats.forEach(c => { for (let i = 0; i < per; i++) list.push(c); });
            let order = sbShuffle(list, rnd);
            /* لا ثلاث متتالية من الفئة نفسها */
            for (let i = 2; i < order.length; i++) {
                if (order[i] === order[i - 1] && order[i] === order[i - 2]) {
                    const j = order.findIndex((c, q) => q > i && c !== order[i]);
                    if (j > 0) { const t = order[i]; order[i] = order[j]; order[j] = t; }
                }
            }
            const ex = sbExcl(cats);
            return order.map(c => ({ type: "basket", cat: c, item: pick(c, ex), baskets: cats.slice() }));
        }

        if (stage.kind === "match") {
            for (let k = 0; k < stage.n; k++) trials.push(matchTrial(cats3, k, k >= 3));
        } else if (stage.kind === "basket2") {
            basketTrials(cats2, 3).forEach(t => trials.push(t));
        } else if (stage.kind === "basket3") {
            basketTrials(cats3, 2).forEach(t => trials.push(t));
        } else if (stage.kind === "odd") {
            for (let k = 0; k < stage.n; k++) trials.push(oddTrial(cats3, k));
        } else {
            const bt = basketTrials(cats3, 3);
            const seq = ["basket", "odd", "match", "basket", "odd", "match", "basket", "odd"];
            let b = 0, o = 0, m = 0;
            seq.forEach(kind => {
                if (kind === "basket") trials.push(bt[b++ % bt.length]);
                else if (kind === "odd") trials.push(oddTrial(cats3, o++));
                else trials.push(matchTrial(cats3, m++, true));
            });
        }
        trials.forEach(t => { t.wrong = 0; t.firstTry = null; t.hinted = false; t.outcome = null; });
        return trials;
    }

    /* ---------------- العروض ---------------- */
    function sbShowView(v) {
        sb.view = v;
        ["sbMap", "sbStages", "sbPlay"].forEach(id => {
            const n = $q(id);
            if (n) n.classList.toggle("sb-hidden", id !== ("sb" + v.charAt(0).toUpperCase() + v.slice(1)));
        });
        const dots = $q("sbDots"); if (dots && v !== "play") dots.innerHTML = "";
        const title = $q("sbTitle");
        if (title) {
            if (v === "map") title.textContent = "🧺 سلال الفرز";
            else if (v === "stages" && sb.pack) title.textContent = sb.pack.icon + " " + sb.pack.t;
            else if (v === "play" && sb.pack && sb.stage) title.textContent = sb.stage.icon + " " + sb.stage.t;
        }
        const root = $q(SB_SCREEN);
        if (root) root.setAttribute("data-view", v);
        try { window.scrollTo({ top: 0, behavior: "instant" }); } catch (e) { /* لا شيء */ }
    }

    /* أثناء اللعب: ارفع منطقة اللعبة إلى أعلى الشاشة فتظهر الصورة والسلال معًا بلا تمرير */
    function sbScrollToGame() {
        const run = () => {
            try {
                const root = $q(SB_SCREEN);
                const wrap = root && root.querySelector(".sb-wrap");
                if (!wrap || !sbActive()) return;
                const top = Math.max(0, wrap.getBoundingClientRect().top + (window.pageYOffset || 0) - 6);
                window.scrollTo({ top: top, behavior: "instant" });
            } catch (e) { /* لا شيء */ }
        };
        run();
        if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
    }

    function sbStageLocked(prog, packId, stageId) {
        const st = prog.packs[packId].stages;
        const i = SB_STAGES.findIndex(s => s.id === stageId);
        if (i <= 0) return false;
        if (stageId === "s5") return !(st.s1.done && st.s2.done && st.s3.done && st.s4.done);
        return !st[SB_STAGES[i - 1].id].done;
    }

    function sbPackSummary(prog, pack) {
        const pr = prog.packs[pack.id];
        let done = 0, stars = 0;
        SB_STAGES.forEach(s => { if (pr.stages[s.id].done) { done++; stars += pr.stages[s.id].stars; } });
        return { done: done, total: SB_STAGES.length, stars: stars, mastered: pr.mastery.passed };
    }

    function sbRenderMap() {
        const box = $q("sbMap");
        if (!box) return;
        box.innerHTML = "";
        const prog = sbLoad();
        const intro = el("p", "sb-intro", "ضع كل صورة مع ما يشبهها 🧺");
        box.appendChild(intro);
        const grid = el("div", "sb-pack-grid");
        grid.setAttribute("role", "list");
        let recommended = null;
        SB_PACKS.forEach(p => { if (!recommended && !sbPackSummary(prog, p).mastered) recommended = p.id; });
        SB_PACKS.forEach(p => {
            const sum = sbPackSummary(prog, p);
            const b = el("button", "sb-pack" + (sum.mastered ? " sb-mastered" : "") + (p.id === recommended ? " sb-recommended" : ""));
            b.type = "button";
            b.setAttribute("role", "listitem");
            b.setAttribute("data-pack", p.id);
            b.setAttribute("aria-label", p.t + "، " + num(sum.done) + " من " + num(sum.total) + " مراحل" + (sum.mastered ? "، متقن" : ""));
            b.appendChild(el("span", "sb-pack-icon", p.icon));
            b.appendChild(el("span", "sb-pack-title", p.t));
            const ex = el("span", "sb-pack-ex");
            (p.cats || ["animals", "fruits", "vehicles", "clothes", "sky"]).forEach(c => ex.appendChild(el("span", null, SB_CATS[c].ex)));
            b.appendChild(ex);
            const meta = el("span", "sb-pack-meta", num(sum.done) + " من " + num(sum.total) + " مراحل");
            b.appendChild(meta);
            if (sum.mastered) b.appendChild(el("span", "sb-badge", "🏅 متقَن"));
            else if (p.id === recommended) b.appendChild(el("span", "sb-badge sb-badge-next", "ابدأ من هنا"));
            b.addEventListener("click", () => sbOpenPack(p.id));
            grid.appendChild(b);
        });
        box.appendChild(grid);
    }

    function sbStars(n) { return "★".repeat(n) + "☆".repeat(3 - n); }

    function sbRenderStages() {
        const box = $q("sbStages");
        if (!box || !sb.pack) return;
        box.innerHTML = "";
        const prog = sbLoad();
        const pr = prog.packs[sb.pack.id];
        const cats = el("div", "sb-cat-row");
        (sb.pack.cats || Object.keys(SB_CATS)).forEach(c => {
            const chip = el("span", "sb-cat-chip");
            chip.style.setProperty("--c", SB_CATS[c].col);
            chip.textContent = SB_CATS[c].ex + " " + SB_CATS[c].t;
            cats.appendChild(chip);
        });
        box.appendChild(cats);
        const list = el("div", "sb-stage-list");
        let next = null;
        SB_STAGES.forEach(s => { if (!next && !pr.stages[s.id].done && !sbStageLocked(prog, sb.pack.id, s.id)) next = s.id; });
        SB_STAGES.forEach((s, i) => {
            const st = pr.stages[s.id];
            const locked = sbStageLocked(prog, sb.pack.id, s.id);
            const b = el("button", "sb-stage-btn" + (st.done ? " sb-done-stage" : "") + (locked ? " sb-locked" : "") + (s.id === next ? " sb-recommended" : ""));
            b.type = "button";
            b.setAttribute("data-stage", s.id);
            if (locked) b.setAttribute("aria-disabled", "true");
            b.setAttribute("aria-label", s.t + (locked ? "، مقفلة" : st.done ? "، مكتملة" : ""));
            b.appendChild(el("span", "sb-stage-num", num(i + 1)));
            b.appendChild(el("span", "sb-stage-ico", locked ? "🔒" : s.icon));
            b.appendChild(el("span", "sb-stage-name", s.t));
            b.appendChild(el("span", "sb-stage-stars", st.done ? sbStars(st.stars) : (locked ? "" : "جديدة")));
            b.addEventListener("click", () => {
                if (locked) {
                    b.classList.remove("sb-shake"); void b.offsetWidth; b.classList.add("sb-shake");
                    sbSay(SB_LOCKED);
                    return;
                }
                sbStart(sb.pack.id, s.id);
            });
            list.appendChild(b);
        });
        box.appendChild(list);
        if (pr.mastery.passed) box.appendChild(el("p", "sb-mastery-note", "🏅 أتقنتَ هذه الحزمة"));
    }

    function sbOpenPack(packId) {
        sbTeardown();
        sb.pack = SB_PACKS.find(p => p.id === packId) || SB_PACKS[0];
        sb.stage = null;
        const prog = sbLoad(); prog.last = sb.pack.id; sbSave(prog);
        sbShowView("stages");
        sbRenderStages();
    }

    /* ---------------- اللعب ---------------- */
    function sbStart(packId, stageId) {
        sbTeardown();
        sb.pack = SB_PACKS.find(p => p.id === packId);
        sb.stage = SB_STAGES.find(s => s.id === stageId);
        if (!sb.pack || !sb.stage) return;
        const prog = sbLoad();
        const st = prog.packs[sb.pack.id].stages[sb.stage.id];
        const plays = st.plays;
        st.plays = plays + 1;
        prog.last = sb.pack.id;
        sbSave(prog);
        sb.trials = sbBuildTrials(sb.pack, sb.stage, plays);
        sb.idx = -1;
        sb.first = 0;
        sbShowView("play");
        const pr = $q("sbPrompt"); if (pr) pr.textContent = sb.stage.prompt;
        sbNextTrial();
    }

    function sbRenderDots() {
        const d = $q("sbDots");
        if (!d) return;
        d.innerHTML = "";
        sb.trials.forEach((t, i) => {
            const dot = el("span", "sb-dot" + (t.firstTry === true ? " sb-dot-ok" : t.firstTry === false ? " sb-dot-help" : "") + (i === sb.idx ? " sb-dot-now" : ""));
            d.appendChild(dot);
        });
        d.setAttribute("aria-label", "الجولة " + num(Math.min(sb.idx + 1, sb.trials.length)) + " من " + num(sb.trials.length));
    }

    function sbSetMsg(text) { const m = $q("sbMsg"); if (m) m.textContent = text || ""; }

    function sbNextTrial() {
        if (!sbActive()) { sbTeardown(); return; }
        sb.idx++;
        sb.busy = false;
        if (sb.idx >= sb.trials.length) { sbFinish(); return; }
        sbRenderDots();
        sbSetMsg("");
        const t = sb.trials[sb.idx];
        const area = $q("sbStageArea");
        if (!area) return;
        area.innerHTML = "";
        area.setAttribute("data-type", t.type);
        if (t.type === "basket") sbRenderBasket(area, t);
        else if (t.type === "match") sbRenderMatch(area, t);
        else sbRenderOdd(area, t);
        if (sb.idx === 0) sbScrollToGame();
    }

    function sbCard(it, cls) {
        const b = el("button", "sb-card " + (cls || ""));
        b.type = "button";
        b.setAttribute("data-word", it.w);
        b.setAttribute("aria-label", it.w);
        b.appendChild(el("span", "sb-emoji", it.e));
        b.appendChild(el("span", "sb-word", it.w));
        return b;
    }

    function sbRenderBasket(area, t) {
        const item = sbCard(t.item, "sb-item");
        item.appendChild(el("span", "sb-speaker", "🔊"));
        item.addEventListener("click", () => { if (!sb.busy) sbSay(t.item.w); });
        const zone = el("div", "sb-item-zone");
        zone.appendChild(item);
        area.appendChild(zone);
        const row = el("div", "sb-baskets sb-n" + t.baskets.length);
        t.baskets.forEach(c => {
            const cat = SB_CATS[c];
            const b = el("button", "sb-basket");
            b.type = "button";
            b.setAttribute("data-cat", c);
            b.setAttribute("aria-label", "سلة " + cat.t);
            b.style.setProperty("--c", cat.col);
            b.appendChild(el("span", "sb-basket-ex", cat.ex));
            b.appendChild(el("span", "sb-basket-t", cat.t));
            b.appendChild(el("span", "sb-basket-items"));
            b.addEventListener("click", () => sbAnswerBasket(t, c, b, item));
            row.appendChild(b);
        });
        area.appendChild(row);
        sbSay(t.item.w);
    }

    function sbRenderMatch(area, t) {
        const top = el("div", "sb-item-zone");
        const sample = sbCard(t.sample, "sb-sample");
        sample.addEventListener("click", () => { if (!sb.busy) sbSay(t.sample.w); });
        top.appendChild(sample);
        area.appendChild(top);
        const row = el("div", "sb-cards sb-n" + t.choices.length);
        t.choices.forEach(ch => {
            const c = sbCard(ch, "sb-choice");
            c.addEventListener("click", () => sbAnswerCard(t, ch, c, row));
            row.appendChild(c);
        });
        area.appendChild(row);
        sbSay(t.sample.w);
    }

    function sbRenderOdd(area, t) {
        const row = el("div", "sb-cards sb-odd-grid");
        t.cards.forEach(ch => {
            const c = sbCard(ch, "sb-choice");
            c.addEventListener("click", () => sbAnswerCard(t, ch, c, row));
            row.appendChild(c);
        });
        area.appendChild(row);
    }

    function sbPraiseFor(t) {
        return t.firstTry ? SB_PRAISE[sb.idx % SB_PRAISE.length] : SB_PRAISE[0];
    }

    function sbResolve(t, msg, mode) {
        /* تم حل الجولة: مستقلة، أو بعد محاولة/تلميح، أو تلقائية (بلا أي صوت تهنئة) */
        sb.busy = true;
        if (mode === "auto") t.outcome = "auto";
        else if (t.wrong === 0) t.outcome = "independent";
        else if (t.hinted) t.outcome = "hinted";
        else t.outcome = "retry";
        t.firstTry = t.outcome === "independent";
        if (t.firstTry) sb.first++;
        sbRenderDots();
        sbSetMsg(msg);
        if (t.outcome === "auto") {
            sbLater(() => sbNextTrial(), calmOrReduced() ? 500 : 1000);
            return;
        }
        const praise = sbPraiseFor(t);
        sbLater(() => sbSay(praise, () => sbNextTrial(), 2600), calmOrReduced() ? 120 : 520);
    }

    function sbAnswerBasket(t, catId, btn, itemEl) {
        if (sb.busy || btn.getAttribute("aria-disabled") === "true") return;
        if (catId === t.cat) {
            sb.busy = true;
            btn.classList.add("sb-right");
            const reduced = calmOrReduced();
            if (!reduced) {
                try {
                    const a = itemEl.getBoundingClientRect(), b = btn.getBoundingClientRect();
                    const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
                    const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
                    itemEl.style.transition = "transform .38s ease, opacity .38s ease";
                    itemEl.style.transform = "translate(" + dx + "px," + dy + "px) scale(.3)";
                    itemEl.style.opacity = "0";
                } catch (e) { /* لا شيء */ }
            }
            sbLater(() => {
                const holder = btn.querySelector(".sb-basket-items");
                if (holder && holder.children.length < 6) holder.appendChild(el("span", "sb-chip", t.item.e));
                itemEl.style.visibility = "hidden";
                btn.classList.add("sb-pop");
                sb.busy = false;
                sbResolve(t, "✅ " + t.item.w + " من " + SB_CATS[t.cat].t);
            }, reduced ? 40 : 400);
        } else {
            t.wrong++;
            btn.classList.add("sb-tried");
            btn.setAttribute("aria-disabled", "true");
            btn.classList.remove("sb-shake"); void btn.offsetWidth; btn.classList.add("sb-shake");
            sbSetMsg("جرّب سلة أخرى 🙂");
            sbSay(t.item.w);
            sbHelpBasket(t, itemEl);
        }
    }

    function sbHelpBasket(t, itemEl) {
        const area = $q("sbStageArea");
        if (!area) return;
        const right = area.querySelector('.sb-basket[data-cat="' + t.cat + '"]');
        if (t.wrong >= 2 && right) { right.classList.add("sb-hint"); t.hinted = true; }
        if (t.wrong >= 3 && right) {
            /* وضع تلقائي: لا يُحتسب مستقلًا ولا يُسمع «صحيح» */
            sbAnswerBasketAssisted(t, right, itemEl);
        }
    }

    function sbAnswerBasketAssisted(t, right, itemEl) {
        sb.busy = true;
        right.classList.add("sb-right");
        sbLater(() => {
            const holder = right.querySelector(".sb-basket-items");
            if (holder && holder.children.length < 6) holder.appendChild(el("span", "sb-chip", t.item.e));
            itemEl.style.visibility = "hidden";
            right.classList.add("sb-pop");
            sb.busy = false;
            sbResolve(t, "✅ " + t.item.w + " من " + SB_CATS[t.cat].t, "auto");
        }, 300);
    }

    function sbAnswerCard(t, ch, btn, row) {
        if (sb.busy || btn.getAttribute("aria-disabled") === "true") return;
        if (ch.ok) {
            sb.busy = true;
            btn.classList.add("sb-right");
            const m = t.type === "match"
                ? "✅ كلاهما من " + SB_CATS[t.cat].t
                : "✅ " + ch.w + " ليس من " + SB_CATS[t.cat].t;
            sbResolve(t, m);
        } else {
            t.wrong++;
            btn.classList.add("sb-faded");
            btn.setAttribute("aria-disabled", "true");
            btn.classList.remove("sb-shake"); void btn.offsetWidth; btn.classList.add("sb-shake");
            sbSetMsg("جرّب صورة أخرى 🙂");
            sbSay(ch.w);
            const right = Array.prototype.find.call(row.children, c => {
                const w = c.getAttribute("data-word");
                return (t.type === "match" ? t.choices : t.cards).some(x => x.w === w && x.ok);
            });
            if (t.wrong >= 2 && right) { right.classList.add("sb-hint"); t.hinted = true; }
            if (t.wrong >= 3 && right) {
                sb.busy = true;
                right.classList.add("sb-right");
                sbLater(() => { sb.busy = false; sbResolve(t, "✅ هذه هي الإجابة", "auto"); }, 300);
            }
        }
    }

    /* ---------------- نهاية المرحلة والمكافأة ---------------- */
    function sbStarsFor(first, total) {
        const r = total ? first / total : 0;
        return r >= 0.9 ? 3 : (r >= 0.7 ? 2 : 1);
    }

    function sbNeed(stage, total) {
        return stage.kind === "mastery" ? SB_PASS : Math.ceil(total * 0.6);
    }

    function sbFinish() {
        const total = sb.trials.length;
        const tally = { independent: 0, retry: 0, hinted: 0, auto: 0 };
        let wrongTaps = 0, hints = 0;
        sb.trials.forEach(t => {
            if (t.outcome && tally[t.outcome] !== undefined) tally[t.outcome]++;
            wrongTaps += t.wrong || 0;
            if (t.hinted) hints++;
        });
        const first = tally.independent;
        const prog = sbLoad();
        const pr = prog.packs[sb.pack.id];
        const st = pr.stages[sb.stage.id];
        const isMastery = sb.stage.kind === "mastery";
        const need = sbNeed(sb.stage, total);
        /* النجاح يقاس بالإجابات المستقلة فقط؛ التلقائية والمُلمَّح لها لا تكفي */
        const passed = first >= need;
        const stars = passed ? sbStarsFor(first, total) : 0;
        let award = 0;
        let attempt = 0;

        if (isMastery) {
            pr.mastery.attempts++;
            attempt = pr.mastery.attempts;
            if (first > pr.mastery.best) pr.mastery.best = first;
        } else {
            attempt = st.plays;
        }
        if (passed) {
            st.done = true;
            if (stars > st.stars) st.stars = stars;
            if (!st.rewarded) { st.rewarded = true; award += 1; }
            if (isMastery) {
                pr.mastery.passed = true;
                if (stars > pr.mastery.stars) pr.mastery.stars = stars;
                if (!pr.mastery.rewarded) { pr.mastery.rewarded = true; award += 2; }
            }
        }
        /* احفظ أولًا ثم امنح النجوم: لو تعذّر الحفظ لا تتكرر المكافأة لاحقًا */
        sbSave(prog);
        if (award > 0) { try { if (typeof addStars === "function") addStars(award); } catch (e) { /* لا شيء */ } }
        /* سجل المعلم: حدث واحد لكل محاولة، ناجحة أو لا، في بيانات الطالب الحالي */
        try {
            if (typeof StudentData !== "undefined" && StudentData.logEvent) {
                StudentData.logEvent({
                    type: passed ? "activity_complete" : "activity_attempt",
                    subject: "games", skill: "sort_" + sb.pack.id, activity: "stage_" + sb.stage.id,
                    correct: null,
                    passed: passed, mastery: isMastery, attempt: attempt, total: total, need: need,
                    independent: tally.independent, retry: tally.retry, hinted: tally.hinted, auto: tally.auto,
                    wrongTaps: wrongTaps, hints: hints, stars: stars
                });
            }
        } catch (e) { /* لا شيء */ }
        sbShowDone({ passed: passed, stars: stars, first: first, total: total, need: need, award: award, isMastery: isMastery, tally: tally });
    }

    function sbHideDone() {
        const d = $q("sbDone");
        if (d) d.classList.add("sb-hidden");
        const w = $q(SB_SCREEN);
        if (w) w.querySelectorAll(".sb-top,.sb-view").forEach(n => { try { n.inert = false; } catch (e) { /* لا شيء */ } });
    }

    function sbConfetti() {
        if (calmOrReduced()) return;
        const fx = $q("sbFx");
        if (!fx) return;
        fx.innerHTML = "";
        for (let i = 0; i < 8; i++) {
            const s = el("span", "sb-spark", "⭐");
            s.style.left = (8 + i * 11) + "%";
            s.style.animationDelay = (i * 0.07) + "s";
            fx.appendChild(s);
        }
        sbLater(() => { fx.innerHTML = ""; }, 1600);
    }

    function sbShowDone(r) {
        const d = $q("sbDone");
        if (!d) return;
        const prog = sbLoad();
        const nextStage = (() => {
            const i = SB_STAGES.findIndex(s => s.id === sb.stage.id);
            const n = SB_STAGES[i + 1];
            return (n && !sbStageLocked(prog, sb.pack.id, n.id)) ? n : null;
        })();
        const title = r.passed ? (r.isMastery ? "🏅 أتقنتَ هذه الحزمة!" : "🌟 أحسنت يا بطل!") : (r.first >= r.need - 1 ? "💪 قريب جدًا!" : "💪 لنتدرّب مرة أخرى!");
        const body = r.passed
            ? "أجبتَ " + num(r.first) + " من " + num(r.total) + " من أول مرة"
            : "أجبتَ " + num(r.first) + " من " + num(r.total) + " من أول مرة. نتدرّب قليلًا ثم نحاول مرة أخرى";
        $q("sbDoneTitle").textContent = title;
        $q("sbDoneBody").textContent = body;
        $q("sbDoneStars").textContent = r.passed ? sbStars(r.stars) : "";
        $q("sbDoneReward").textContent = r.award > 0 ? "⭐ ربحتَ " + num(r.award) + (r.award === 1 ? " نجمة" : " نجوم") : "";
        const acts = $q("sbDoneActs");
        acts.innerHTML = "";
        const mk = (label, cls, fn) => { const b = el("button", cls, label); b.type = "button"; b.addEventListener("click", fn); acts.appendChild(b); return b; };
        let primary;
        if (r.passed && nextStage) primary = mk("▶ " + nextStage.t, "sb-btn sb-btn-main", () => sbStart(sb.pack.id, nextStage.id));
        else if (!r.passed) primary = mk("🔁 أعد المحاولة", "sb-btn sb-btn-main", () => sbStart(sb.pack.id, sb.stage.id));
        else primary = mk("🗺️ الحزم", "sb-btn sb-btn-main", () => sbGoMap());
        if (r.passed) mk("🔁 إعادة", "sb-btn", () => sbStart(sb.pack.id, sb.stage.id));
        mk("📋 المراحل", "sb-btn", () => { sbTeardown(); sbShowView("stages"); sbRenderStages(); });
        d.classList.remove("sb-hidden");
        const w = $q(SB_SCREEN);
        if (w) w.querySelectorAll(".sb-top,.sb-view").forEach(n => { try { n.inert = true; } catch (e) { /* لا شيء */ } });
        sbConfetti();
        sbSay(r.passed ? SB_STAGE_DONE : SB_RETRY);
        try { primary.focus(); } catch (e) { /* لا شيء */ }
    }

    /* ---------------- التنقل ---------------- */
    function sbGoMap() {
        sbTeardown();
        sbShowView("map");
        sbRenderMap();
    }

    function sbBack() {
        if (sb.view === "play") { sbTeardown(); sbShowView("stages"); sbRenderStages(); return; }
        if (sb.view === "stages") { sbGoMap(); return; }
        sbTeardown();
        showScreen("games");
    }

    function sbBind() {
        if (sb.bound) return;
        sb.bound = true;
        const back = $q("sbBack");
        if (back) back.addEventListener("click", sbBack);
    }

    function openSortGame() {
        sbBind();
        sbTeardown();
        showScreen(SB_SCREEN);
        sbShowView("map");
        sbRenderMap();
    }

    window.openSortGame = openSortGame;
    /* واجهة قراءة للاختبارات فقط */
    window.SortBaskets = {
        _state: sb, _cats: SB_CATS, _packs: SB_PACKS, _stages: SB_STAGES, _avoid: SB_AVOID,
        _load: sbLoad, _normalize: sbNormalize, _build: sbBuildTrials, _pool: sbPool, _key: SB_KEY,
        _praise: SB_PRAISE, _lines: [SB_STAGE_DONE, SB_RETRY, SB_LOCKED], _itemAvoid: SB_ITEM_AVOID, _excl: sbExcl, _need: sbNeed
    };
})();

/* =========================================================
   🔚 نهاية لعبة «سلال الفرز»
========================================================= */
