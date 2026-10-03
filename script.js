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

   القرآن والأدعية والأذكار لا يمرّان من هنا إطلاقًا ولن يتأثرا
   بأي تبديل مستقبلي لمحرك الصوت — يستخدمان AudioManager.play()
   مباشرة بملفات MP3 حقيقية كما كانا دائمًا، بمعزل كامل عن هذه
   الطبقة.

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
    "أحسنت! أتممت المستوى بنجاح": "assets/audio/educational/phrases/level_completed.mp3",
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
};
/* =========================================================================
   🆕 =====================================================================
   🔊 speakEducational() — نطق محلي بملفات MP3 (صوت NAMAA Saudi TTS)
   =====================================================================
   مخصَّصة حصريًا للأقسام التعليمية (الحروف/الكلمات/الأرقام/الكتابة/
   الجمع/الطرح/الألعاب/الحديث الشريف). لا علاقة لها إطلاقًا بـ
   speak() العامة، ولا بـ AudioManager، ولا بأي كود خاص بالقرآن أو
   الأدعية والأذكار — تلك كلها تبقى تمامًا كما هي بلا أي تعديل.

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
const EDUCATIONAL_TTS_FALLBACK_RATE = 0.72;

let educationalAudioInstance = null;
let educationalAudioBusy = false;
let educationalPendingRequest = null;

function stopEducationalAudio() {
    if (educationalAudioInstance) {
        try {
            educationalAudioInstance.pause();
            educationalAudioInstance.currentTime = 0;
        } catch (error) {}
    }
    educationalAudioInstance = null;
    educationalAudioBusy = false;
    educationalPendingRequest = null;
}

function educationalPlaybackFinished() {
    educationalAudioBusy = false;
    educationalAudioInstance = null;

    if (educationalPendingRequest) {
        const next = educationalPendingRequest;
        educationalPendingRequest = null;
        speakEducational(next.text, next.options);
    }
}

function watchEducationalTTSFallbackCompletion() {
    /* لا يوجد خطاف مباشر لنهاية speak() دون تعديلها؛ نتحقق دوريًا من
       الخاصية العامة speechSynthesis.speaking (قراءة فقط، بلا أي
       تعديل على أي دالة مشتركة) حتى تنتهي، ثم نُحرِّر القفل */
    if (!("speechSynthesis" in window)) {
        educationalPlaybackFinished();
        return;
    }

    const check = () => {
        if (!speechSynthesis.speaking) {
            educationalPlaybackFinished();
            return;
        }
        setTimeout(check, 150);
    };

    setTimeout(check, 150);
}

function speakEducational(text, options) {
    options = options || {};

    if (educationalAudioBusy) {
        /* صوت تعليمي قيد التشغيل الآن — لا نقاطعه أبدًا؛ نحتفظ فقط
           بأحدث طلب لتشغيله تلقائيًا بعد اكتماله */
        educationalPendingRequest = { text: text, options: options };
        return;
    }

    educationalAudioBusy = true;

    const localPath = EDUCATIONAL_AUDIO_MANIFEST[text];

    if (!localPath) {
        /* نص ديناميكي أو غير مُسجَّل — الرجوع التلقائي للصوت الحالي
           بلا أي تغيير في speak() نفسها، بسرعة أبطأ مناسبة للأطفال */
        const slowerOptions = Object.assign({}, options, { rate: EDUCATIONAL_TTS_FALLBACK_RATE });
        speak(text, slowerOptions);
        watchEducationalTTSFallbackCompletion();
        return;
    }

    try {
        const audio = new Audio(localPath);
        audio.playbackRate = EDUCATIONAL_AUDIO_PLAYBACK_RATE;

        try {
            audio.preservesPitch = true;
            audio.mozPreservesPitch = true;
            audio.webkitPreservesPitch = true;
        } catch (error) {}

        educationalAudioInstance = audio;

        audio.addEventListener("ended", () => {
            if (educationalAudioInstance === audio) {
                educationalPlaybackFinished();
            }
        }, { once: true });

        audio.addEventListener("error", () => {
            if (educationalAudioInstance === audio) {
                educationalAudioInstance = null;
            }
            /* فشل تشغيل الملف المحلي لأي سبب — رجوع فوري للصوت
               الحالي بدل تعطيل الصوت كليًا */
            const slowerOptions = Object.assign({}, options, { rate: EDUCATIONAL_TTS_FALLBACK_RATE });
            speak(text, slowerOptions);
            watchEducationalTTSFallbackCompletion();
        }, { once: true });

        const playPromise = audio.play();

        if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
                if (educationalAudioInstance === audio) {
                    educationalAudioInstance = null;
                }
                const slowerOptions = Object.assign({}, options, { rate: EDUCATIONAL_TTS_FALLBACK_RATE });
                speak(text, slowerOptions);
                watchEducationalTTSFallbackCompletion();
            });
        }
    } catch (error) {
        educationalAudioInstance = null;
        const slowerOptions = Object.assign({}, options, { rate: EDUCATIONAL_TTS_FALLBACK_RATE });
        speak(text, slowerOptions);
        watchEducationalTTSFallbackCompletion();
    }
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
        setTimeout(
            initWritingCanvas,
            100
        );
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

/* =========================================================
✍️ الكتابة
========================================================= */

let writingCanvas;
let writingCtx;
let writingDrawing = false;

const writingLetters = [
    "أ", "ب", "ت", "ث", "ج", "ح", "خ",
    "د", "ذ", "ر", "ز", "س", "ش", "ص",
    "ض", "ط", "ظ", "ع", "غ", "ف", "ق",
    "ك", "ل", "م", "ن", "ه", "و", "ي"
];

let writingIndex = 0;

function initWritingCanvas() {

    writingCanvas =
        $("writingCanvas");

    if (!writingCanvas) return;

    /*
       مهم:
       عنصر <canvas> بدون width/height
       يستخدم حجمًا افتراضيًا (300×150)
       يختلف عن حجمه الظاهر عبر CSS
       (100% × 300px)، مما كان يجعل نقطة
       اللمس/الرسم لا تطابق مكان الإصبع
       الفعلي، خصوصًا على الهاتف.
       نُطابق حجم لوحة الرسم الداخلي مع
       حجمها الحقيقي على الشاشة.
    */
    const rect =
        writingCanvas.getBoundingClientRect();

    writingCanvas.width =
        rect.width || 300;

    writingCanvas.height =
        rect.height || 300;

    writingCtx =
        writingCanvas.getContext("2d");

    writingCtx.lineWidth = 6;
    writingCtx.lineCap = "round";

    const drawStart = e => {

        writingDrawing = true;

        const rect =
            writingCanvas.getBoundingClientRect();

        writingCtx.beginPath();

        writingCtx.moveTo(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
    };

    const drawMove = e => {

        if (!writingDrawing) return;

        const rect =
            writingCanvas.getBoundingClientRect();

        writingCtx.lineTo(
            e.clientX - rect.left,
            e.clientY - rect.top
        );

        writingCtx.stroke();
    };

    const drawEnd = () => {
        writingDrawing = false;
    };

    writingCanvas.onpointerdown = drawStart;
    writingCanvas.onpointermove = drawMove;
    writingCanvas.onpointerup = drawEnd;
    writingCanvas.onpointerleave = drawEnd;

    renderWritingLetter();
}

function renderWritingLetter() {

    const letter =
        writingLetters[writingIndex];

    /*
     * HTML يستخدم writingGuide
     */
    if ($("writingGuide")) {
        $("writingGuide").textContent =
            letterWithFatha(letter);
    }

    /*
     * دعم الاسم القديم أيضًا إذا كان موجودًا
     */
    if ($("writingLetter")) {
        $("writingLetter").textContent =
            letterWithFatha(letter);
    }

    if ($("writingMessage")) {
        $("writingMessage").textContent =
            `اكتب حرف ${letterWithFatha(letter)}`;
    }
}

function clearWriting() {

    if (
        !writingCanvas ||
        !writingCtx
    ) return;

    writingCtx.clearRect(
        0,
        0,
        writingCanvas.width,
        writingCanvas.height
    );
}

/*
 * الاسم الموجود في HTML
 */
function clearCanvas() {
    clearWriting();
}

/*
 * الحرف التالي
 */
function nextWritingLetter() {

    writingIndex++;

    if (
        writingIndex >=
        writingLetters.length
    ) {
        writingIndex = 0;
    }

    clearWriting();
    renderWritingLetter();
}

/*
 * الاسم الموجود في HTML
 */
function newWritingLetter() {
    nextWritingLetter();
}

/*
 * زر انتهيت
 */
function finishWriting() {

    const message =
        $("writingMessage");

    if (message) {

        message.textContent =
            "🎉 أحسنت! انتهيت من كتابة الحرف ⭐";

        message.className =
            "message correct";
    }

    addStars(5);

    speakEducational(
        "أحسنت، عمل رائع",
        {
            rate: 0.8,
            pitch: 1.1
        }
    );
}

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

/* الكتابة */
window.initWritingCanvas =
    initWritingCanvas;

window.clearWriting =
    clearWriting;

window.clearCanvas =
    clearCanvas;

window.nextWritingLetter =
    nextWritingLetter;

window.newWritingLetter =
    newWritingLetter;

window.finishWriting =
    finishWriting;

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

        setTimeout(
            () => {
                initWritingCanvas();
            },
            300
        );
    }
);
/* =========================================================
   🎈 لعبة فرقع الحروف — نسخة احترافية هادئة (SEN-friendly)
   =========================================================
   بلا مؤقت، بلا أرواح، بلا عقاب. بالونات ثابتة تطفو بهدوء
   بدل السقوط السريع. 3 مستويات × 5 جولات لكل مستوى، تدرّج
   صعوبة حقيقي (2 ← 3 ← 4 بالونات)، مشتتات صوتية فعلية عند
   المستوى الأصعب (إعادة استخدام getPhoneticNeighbors الموجودة
   أصلًا في محرك الحروف). التقدّم يُحفَظ بنفس أسلوب التخزين
   المُتَّبع في بقية التطبيق (مفتاح معزول جديد خاص بهذه اللعبة
   فقط). لا علاقة لهذا الكود بلعبة فرقع الأرقام إطلاقًا — تلك
   منفصلة تمامًا في كودها الخاص ولم تُلمَس هنا بأي شكل.
   ========================================================= */

/* 🛠️ ملاحظة: يجب ألا تُنفَّذ هذه فورًا عند تحميل الملف — LETTER_LEVEL_GROUPS
   تُعرَّف لاحقًا أدناه في محرك الحروف، فاستدعاء فوري هنا كان يُسبِّب خطأ
   TDZ يُوقف تنفيذ بقية الملف بالكامل (ومنها matchingGame). الحل:
   دالة عادية تُحسَب فقط عند الاستخدام الفعلي، بعد اكتمال تحميل الملف. */
function getAllBalloonLetters() {
    const flat = [];
    LETTER_LEVEL_GROUPS.forEach(group => {
        group.letters.forEach(l => flat.push(l));
    });
    return flat;
}

const BALLOON_LEVEL_CONFIG = {
    1: { balloonCount: 2 },
    2: { balloonCount: 3 },
    3: { balloonCount: 4 }
};

const BALLOON_COLORS = ["red", "blue", "green", "yellow", "purple"];

const BALLOON_POSITIONS_BY_COUNT = {
    2: [18, 62],
    3: [12, 42, 72],
    4: [8, 34, 60, 84]
};

const balloonGame = {
    level: 1,
    round: 0,
    roundsPerLevel: 5,
    target: null,
    active: false,
    answered: false,
    session: 0
};

/* =========================================================
   💾 حفظ/تحميل تقدّم اللعبة — مفتاح معزول جديد خاص بهذه اللعبة
   فقط، بنفس أسلوب مفاتيح التقدّم الأخرى في التطبيق
   ========================================================= */

function loadBalloonLettersUnlockedLevel() {
    const saved = Number(localStorage.getItem("taha_balloon_letters_unlocked_level") || 1);
    return Math.min(Math.max(saved, 1), 3);
}

function saveBalloonLettersUnlockedLevel(level) {
    const current = loadBalloonLettersUnlockedLevel();
    if (level > current) {
        localStorage.setItem("taha_balloon_letters_unlocked_level", String(Math.min(level, 3)));
    }
}

/* =========================================================
   ▶️ بدء اللعبة — تبدأ دائمًا من المستوى المفتوح المحفوظ
   ========================================================= */

function startBalloonGame() {

    balloonGame.level = loadBalloonLettersUnlockedLevel();
    balloonGame.round = 0;
    balloonGame.active = true;
    balloonGame.answered = false;
    balloonGame.target = null;
    balloonGame.session++;

    showScreen("balloonGame");

    const overlay = $("balloonLevelComplete");
    if (overlay) overlay.style.display = "none";

    renderBalloonBasket();
    updateBalloonHUD();
    clearBalloonMessage();

    setTimeout(() => {
        if (!balloonGame.active) return;
        nextBalloonRound();
    }, 150);
}

/* =========================================================
   🔄 الجولة التالية
   ========================================================= */

function nextBalloonRound() {

    if (!balloonGame.active) return;

    balloonGame.round++;
    balloonGame.answered = false;

    if (balloonGame.round > balloonGame.roundsPerLevel) {
        finishBalloonLevel();
        return;
    }

    const target = pickBalloonTarget();
    balloonGame.target = target;

    updateBalloonHUD();
    clearBalloonMessage();
    renderBalloonArena(target);
    speakBalloonTarget(target);
}

function pickBalloonTarget() {
    const allLetters = getAllBalloonLetters();
    const index = Math.floor(Math.random() * allLetters.length);
    return allLetters[index];
}

/* =========================================================
   🧠 اختيار مشتتات ذكية — صوتية متقاربة فعليًا عند المستوى ٣
   ========================================================= */

function getBalloonDistractors(target, totalCount, level) {

    const distractors = [];
    const needed = totalCount - 1;

    if (level >= 3 && typeof getPhoneticNeighbors === "function") {
        const neighbors = shuffle(getPhoneticNeighbors(target) || []);
        neighbors.forEach(n => {
            if (distractors.length < needed && n !== target && !distractors.includes(n)) {
                distractors.push(n);
            }
        });
    }

    const rest = shuffle(
        getAllBalloonLetters().filter(l => l !== target && !distractors.includes(l))
    );

    let i = 0;
    while (distractors.length < needed && i < rest.length) {
        distractors.push(rest[i]);
        i++;
    }

    return distractors;
}

/* =========================================================
   🎈 رسم ساحة البالونات — مواضع ثابتة، تطفو بهدوء في مكانها
   ========================================================= */

function renderBalloonArena(target) {

    const arena = $("balloonArena");
    if (!arena) return;

    const clouds = arena.querySelectorAll(".arena-cloud");

    arena.querySelectorAll(".game-balloon").forEach(b => b.remove());

    const config = BALLOON_LEVEL_CONFIG[balloonGame.level] || BALLOON_LEVEL_CONFIG[1];
    const distractors = getBalloonDistractors(target, config.balloonCount, balloonGame.level);
    const allLetters = shuffle([target, ...distractors]);

    const positions = BALLOON_POSITIONS_BY_COUNT[allLetters.length] || BALLOON_POSITIONS_BY_COUNT[2];

    allLetters.forEach((letter, index) => {

        const balloon = document.createElement("button");
        balloon.type = "button";
        balloon.className =
            "game-balloon balloon-floating balloon-" +
            BALLOON_COLORS[index % BALLOON_COLORS.length];

        balloon.style.right = positions[index] + "%";
        balloon.style.top = (38 + (index % 2) * 14) + "%";
        balloon.style.animationDelay = (index * 0.35) + "s";

        balloon.textContent = letter;
        balloon.dataset.letter = letter;

        balloon.addEventListener("click", () => {
            handleBalloonClick(balloon, letter, target);
        });

        arena.appendChild(balloon);
    });
}

/* =========================================================
   👆 التعامل مع الضغط على بالونة
   ========================================================= */

function handleBalloonClick(balloon, clickedLetter, target) {

    if (!balloonGame.active) return;
    if (balloonGame.answered) return;

    if (clickedLetter === target) {
        balloonGame.answered = true;
        handleBalloonCorrect(balloon);
    } else {
        handleBalloonMistake(balloon);
    }
}

/* =========================================================
   ✅ إجابة صحيحة — تعزيز + نجمة + سلة + انتقال واضح
   ========================================================= */

const BALLOON_SUCCESS_PHRASES = ["أَحْسَنْتَ", "مُمْتَاز", "رَائِع", "بَرَافُو", "شَاطِر"];

function getRandomBalloonSuccessPhrase() {
    return BALLOON_SUCCESS_PHRASES[Math.floor(Math.random() * BALLOON_SUCCESS_PHRASES.length)];
}

function handleBalloonCorrect(balloon) {

    const session = balloonGame.session;

    if (typeof addStars === "function") {
        addStars(1);
    }

    balloon.classList.add("balloon-pop");
    balloon.style.pointerEvents = "none";

    speakEducational(getRandomBalloonSuccessPhrase());

    showBalloonMessage("🎉 أحسنت!", true);

    addBalloonToBasket();
    updateBalloonHUD();

    setTimeout(() => {
        if (session !== balloonGame.session) return;
        if (!balloonGame.active) return;
        nextBalloonRound();
    }, 1500);
}

/* =========================================================
   😊 إجابة خاطئة — تصحيح هادئ، بلا أي عقوبة أو خصم
   ========================================================= */

function handleBalloonMistake(balloon) {

    if (!balloonGame.active) return;
    if (balloonGame.answered) return;

    if (balloon.dataset.wrongClicked === "true") return;
    balloon.dataset.wrongClicked = "true";

    balloon.classList.add("balloon-wrong");

    showBalloonMessage("😊 حاول مرة أخرى", false);
    speakEducational("حاول مرة أخرى");

    setTimeout(() => {
        if (balloon && balloon.parentNode) {
            balloon.classList.remove("balloon-wrong");
            balloon.dataset.wrongClicked = "false";
        }
    }, 600);
}

/* =========================================================
   🧺 سلة التجميع المرئية
   ========================================================= */

function renderBalloonBasket() {
    const basket = $("balloonBasket");
    if (basket) basket.innerHTML = "";
}

function addBalloonToBasket() {
    const basket = $("balloonBasket");
    if (!basket) return;

    const item = document.createElement("span");
    item.className = "balloon-basket-item";
    item.textContent = "🎈";
    basket.appendChild(item);
}

/* =========================================================
   🏁 إكمال المستوى — شاشة هادئة + فتح المستوى التالي
   ========================================================= */

function finishBalloonLevel() {

    balloonGame.active = false;

    const isLastLevel = balloonGame.level >= 3;

    saveBalloonLettersUnlockedLevel(Math.min(balloonGame.level + 1, 3));

    const overlay = $("balloonLevelComplete");
    const titleEl = $("balloonLevelCompleteTitle");
    const bodyEl = $("balloonLevelCompleteBody");
    const nextBtn = $("balloonLevelCompleteNextBtn");

    if (titleEl) {
        titleEl.textContent = isLastLevel ? "🎉 أكملت اللعبة!" : "🌟 أحسنت! أكملت المستوى";
    }

    if (bodyEl) {
        bodyEl.textContent = isLastLevel
            ? "أتممت كل المستويات بنجاح"
            : "المستوى التالي بانتظارك";
    }

    if (nextBtn) {
        nextBtn.textContent = isLastLevel ? "🏠 العودة للألعاب" : "▶ المستوى التالي";
        nextBtn.onclick = isLastLevel ? exitBalloonGame : advanceToNextBalloonLevel;
    }

    if (overlay) overlay.style.display = "flex";

    speakEducational("أحسنت! أتممت المستوى بنجاح");
}

function advanceToNextBalloonLevel() {

    balloonGame.level = Math.min(balloonGame.level + 1, 3);
    balloonGame.round = 0;
    balloonGame.answered = false;
    balloonGame.active = true;
    balloonGame.session++;

    const overlay = $("balloonLevelComplete");
    if (overlay) overlay.style.display = "none";

    renderBalloonBasket();
    updateBalloonHUD();
    clearBalloonMessage();

    nextBalloonRound();
}

/* =========================================================
   🖥️ واجهة المعلومات (HUD) — مبسَّطة وهادئة
   ========================================================= */

function updateBalloonHUD() {

    const levelEl = $("balloonLevel");
    if (levelEl) levelEl.textContent = arabicNumber(balloonGame.level);

    const fill = $("balloonProgressFill");
    if (fill) {
        const completedRounds = Math.max(0, balloonGame.round - 1);
        const pct = Math.min(100, Math.round((completedRounds / balloonGame.roundsPerLevel) * 100));
        fill.style.width = pct + "%";
    }

    const scoreEl = $("balloonScore");
    if (scoreEl && typeof stars !== "undefined") {
        scoreEl.textContent = arabicNumber(stars);
    }
}

function showBalloonMessage(message, success) {
    const el = $("balloonMessage");
    if (!el) return;
    el.textContent = message;
    el.className = "balloon-message " + (success ? "success" : "wrong");
}

function clearBalloonMessage() {
    const el = $("balloonMessage");
    if (el) {
        el.textContent = "";
        el.className = "balloon-message";
    }
}

/* =========================================================
   🔊 نطق الحرف المطلوب — عبر speakEducational الحالية
   ========================================================= */

function speakBalloonTarget(letter) {
    const withFatha = letterWithFatha(letter);

    const targetDisplay = $("balloonTarget");
    if (targetDisplay) targetDisplay.textContent = withFatha;

    speakEducational(withFatha);
}

function repeatBalloonTarget() {
    if (!balloonGame.target) return;
    speakBalloonTarget(balloonGame.target);
}

/* =========================================================
   🚪 الخروج من اللعبة
   ========================================================= */

function exitBalloonGame() {

    balloonGame.active = false;

    const overlay = $("balloonLevelComplete");
    if (overlay) overlay.style.display = "none";

    showScreen("games");
}
/* =========================================================
   🔢 لعبة فرقع الأرقام - Number Balloon Game
   نسخة مستقلة ومحسنة
   ========================================================= */

const numberBalloonGame = {
    score: 0,
    streak: 0,
    bestStreak: 0,
    round: 0,
    totalRounds: 10,
    level: 1,
    target: null,
    active: false,
    paused: false,
    lives: 3,
    timeLeft: 15,

    roundTimer: null,
    nextRoundTimer: null,
    spawnTimers: [],

    session: 0,
    answered: false,
    earnedStars: 0,

    bestScore: Number(
        localStorage.getItem("numberBalloonBestScore") || 0
    )
};


/* =========================================================
   🔢 كلمات الأرقام
   ========================================================= */

const numberBalloonWords = {
    1: "وَاحِد",
    2: "اِثْنَان",
    3: "ثَلَاثَة",
    4: "أَرْبَعَة",
    5: "خَمْسَة",
    6: "سِتَّة",
    7: "سَبْعَة",
    8: "ثَمَانِيَة",
    9: "تِسْعَة",
    10: "عَشَرَة",

    11: "أَحَدَ عَشَر",
    12: "اِثْنَا عَشَر",
    13: "ثَلَاثَةَ عَشَر",
    14: "أَرْبَعَةَ عَشَر",
    15: "خَمْسَةَ عَشَر",
    16: "سِتَّةَ عَشَر",
    17: "سَبْعَةَ عَشَر",
    18: "ثَمَانِيَةَ عَشَر",
    19: "تِسْعَةَ عَشَر",
    20: "عِشْرُون",

    21: "وَاحِد وَعِشْرُون",
    22: "اِثْنَان وَعِشْرُون",
    23: "ثَلَاثَة وَعِشْرُون",
    24: "أَرْبَعَة وَعِشْرُون",
    25: "خَمْسَة وَعِشْرُون",
    26: "سِتَّة وَعِشْرُون",
    27: "سَبْعَة وَعِشْرُون",
    28: "ثَمَانِيَة وَعِشْرُون",
    29: "تِسْعَة وَعِشْرُون",
    30: "ثَلَاثُون"
};


/* =========================================================
   🔢 تحويل الأرقام إلى أرقام عربية
   ========================================================= */

function numberBalloonArabicNumber(number) {
    return String(number).replace(
        /[0-9]/g,
        digit => "٠١٢٣٤٥٦٧٨٩"[digit]
    );
}


/* =========================================================
   🎮 مستويات فرقع الأرقام
   ========================================================= */

const numberBalloonLevels = {

    1: {
        count: 4,
        duration: 12000,
        time: 15,
        min: 1,
        max: 5
    },

    2: {
        count: 6,
        duration: 9500,
        time: 13,
        min: 1,
        max: 10
    },

    3: {
        count: 8,
        duration: 7500,
        time: 11,
        min: 1,
        max: 20
    },

    4: {
        count: 10,
        duration: 6000,
        time: 9,
        min: 1,
        max: 30
    }
};


/* =========================================================
   ▶️ بدء لعبة الأرقام
   ========================================================= */

function startNumberBalloonGame() {

    stopNumberBalloonGameTimers();

    const oldFinish =
        document.getElementById(
            "numberBalloonFinishScreen"
        );

    if (oldFinish) {
        oldFinish.remove();
    }

    numberBalloonGame.score = 0;
    numberBalloonGame.streak = 0;
    numberBalloonGame.bestStreak = 0;
    numberBalloonGame.round = 0;
    numberBalloonGame.level = 1;
    numberBalloonGame.target = null;
    numberBalloonGame.active = true;
    numberBalloonGame.paused = false;
    numberBalloonGame.lives = 3;
    numberBalloonGame.timeLeft = 15;
    numberBalloonGame.answered = false;
    numberBalloonGame.earnedStars = 0;

    numberBalloonGame.session++;

    const session =
        numberBalloonGame.session;

    showScreen("numberBalloonGame");

    prepareNumberBalloonArena();
    createNumberBalloonControls();
    updateNumberBalloonHUD();

    setTimeout(() => {

        if (
            !numberBalloonGame.active ||
            session !== numberBalloonGame.session
        ) {
            return;
        }

        nextNumberBalloonRound();

    }, 250);
}


/* =========================================================
   🏟️ تجهيز ساحة الأرقام
   ========================================================= */

function prepareNumberBalloonArena() {

    const arena =
        document.getElementById(
            "numberBalloonArena"
        );

    if (!arena) return;

    arena.innerHTML = `
        <div class="arena-cloud cloud-one">☁️</div>
        <div class="arena-cloud cloud-two">☁️</div>
    `;
}


/* =========================================================
   🎮 إنشاء معلومات اللعبة
   ========================================================= */

function createNumberBalloonControls() {

    const wrapper =
        document.querySelector(
            "#numberBalloonGame .balloon-game-wrapper"
        );

    if (!wrapper) return;

    const old =
        document.getElementById(
            "numberBalloonControls"
        );

    if (old) {
        old.remove();
    }

    const controls =
        document.createElement("div");

    controls.id =
        "numberBalloonControls";

    controls.className =
        "balloon-controls";

    controls.innerHTML = `

        <div class="balloon-extra-hud">

            <div
                id="numberBalloonLives"
                class="balloon-lives"
            >
                ❤️❤️❤️
            </div>

            <div
                id="numberBalloonTimer"
                class="balloon-timer"
            >
                ⏱️ ١٥
            </div>

            <div
                id="numberBalloonBestScore"
                class="balloon-best-score"
            >
                🏆 ٠
            </div>

        </div>

        <button
            id="numberBalloonPauseBtn"
            class="balloon-control-btn"
            onclick="toggleNumberBalloonPause()"
        >
            ⏸️ إيقاف
        </button>
    `;

    const exitButton =
        wrapper.querySelector(
            ".exit-game-btn"
        );

    if (exitButton) {

        wrapper.insertBefore(
            controls,
            exitButton
        );

    } else {

        wrapper.appendChild(
            controls
        );
    }
}


/* =========================================================
   🔢 الجولة التالية
   ========================================================= */

function nextNumberBalloonRound() {

    if (
        !numberBalloonGame.active ||
        numberBalloonGame.paused
    ) {
        return;
    }

    numberBalloonGame.round++;
    numberBalloonGame.answered = false;

    if (
        numberBalloonGame.round >
        numberBalloonGame.totalRounds
    ) {

        finishNumberBalloonGame(
            "completed"
        );

        return;
    }

    updateNumberBalloonLevel();

    const target =
        getRandomNumberBalloonTarget();

    numberBalloonGame.target =
        target;

    updateNumberBalloonHUD();

    speakNumberBalloonTarget(
        target
    );

    clearNumberBalloonArena();

    createNumberBalloonWave(
        target
    );

    startNumberBalloonRoundTimer();
}


/* =========================================================
   📈 تحديد المستوى
   ========================================================= */

function updateNumberBalloonLevel() {

    if (
        numberBalloonGame.round <= 3
    ) {

        numberBalloonGame.level = 1;

    } else if (
        numberBalloonGame.round <= 6
    ) {

        numberBalloonGame.level = 2;

    } else if (
        numberBalloonGame.round <= 8
    ) {

        numberBalloonGame.level = 3;

    } else {

        numberBalloonGame.level = 4;
    }
}


/* =========================================================
   🎯 الرقم المطلوب
   ========================================================= */

function getRandomNumberBalloonTarget() {

    const level =
        numberBalloonLevels[
            numberBalloonGame.level
        ];

    return Math.floor(
        Math.random() *
        (
            level.max -
            level.min +
            1
        )
    ) + level.min;
}


/* =========================================================
   🎈 إنشاء موجة البالونات
   ========================================================= */

function createNumberBalloonWave(target) {

    const level =
        numberBalloonLevels[
            numberBalloonGame.level
        ];

    const choices =
        getNumberBalloonChoices(
            target,
            level.count
        );

    clearNumberBalloonSpawnTimers();

    choices.forEach(
        (number, index) => {

            const delay =
                index * 400;

            const session =
                numberBalloonGame.session;

            const timer =
                setTimeout(() => {

                    if (
                        !numberBalloonGame.active ||
                        numberBalloonGame.paused ||
                        session !== numberBalloonGame.session
                    ) {
                        return;
                    }

                    createNumberGameBalloon(
                        number,
                        target,
                        index,
                        level.duration
                    );

                }, delay);

            numberBalloonGame.spawnTimers.push(
                timer
            );
        }
    );
}


/* =========================================================
   🎯 اختيار أرقام مختلفة
   ========================================================= */

function getNumberBalloonChoices(
    target,
    count
) {

    const level =
        numberBalloonLevels[
            numberBalloonGame.level
        ];

    const choices = [
        target
    ];

    while (
        choices.length < count
    ) {

        const randomNumber =
            Math.floor(
                Math.random() *
                (
                    level.max -
                    level.min +
                    1
                )
            ) + level.min;

        if (
            !choices.includes(
                randomNumber
            )
        ) {

            choices.push(
                randomNumber
            );
        }
    }

    return shuffleNumberBalloonArray(
        choices
    );
}


/* =========================================================
   🔀 خلط الأرقام
   ========================================================= */

function shuffleNumberBalloonArray(
    array
) {

    const result = [...array];

    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];
    }

    return result;
}


/* =========================================================
   🎈 إنشاء بالونة
   ========================================================= */

function createNumberGameBalloon(
    value,
    target,
    index,
    duration
) {

    const arena =
        document.getElementById(
            "numberBalloonArena"
        );

    if (!arena) return;

    if (
        !numberBalloonGame.active ||
        numberBalloonGame.paused
    ) {
        return;
    }

    const balloon =
        document.createElement(
            "button"
        );

    balloon.type = "button";

    balloon.className =
        "game-balloon";

    balloon.textContent =
        numberBalloonArabicNumber(
            value
        );

    balloon.dataset.number =
        String(value);

    balloon.dataset.target =
        String(target);

    balloon.setAttribute(
        "aria-label",
        `الرقم ${value}`
    );

    const colors = [
        "red",
        "blue",
        "green",
        "yellow",
        "purple",
        "orange",
        "pink"
    ];

    balloon.classList.add(
        `balloon-${
            colors[
                Math.floor(
                    Math.random() *
                    colors.length
                )
            ]
        }`
    );

    const maxLeft =
        Math.max(
            30,
            arena.clientWidth - 100
        );

    const left =
        20 +
        Math.random() *
        maxLeft;

    const bottom =
        -110 -
        Math.random() * 80;

    balloon.style.left =
        `${left}px`;

    balloon.style.bottom =
        `${bottom}px`;

    balloon.style.transition =
        `transform ${duration}ms linear`;

    balloon.style.zIndex =
        String(10 + index);

    balloon.addEventListener(
        "click",
        () => {

            handleNumberBalloonClick(
                balloon,
                value,
                target
            );

        }
    );

    arena.appendChild(
        balloon
    );

    requestAnimationFrame(() => {

        if (
            !numberBalloonGame.active ||
            numberBalloonGame.paused
        ) {
            return;
        }

        balloon.style.transform =
            `translateY(-${
                arena.clientHeight + 180
            }px)`;
    });

    const session =
        numberBalloonGame.session;

    setTimeout(() => {

        if (
            session !==
            numberBalloonGame.session
        ) {
            return;
        }

        if (
            balloon.parentNode
        ) {
            balloon.remove();
        }

    }, duration + 700);
}


/* =========================================================
   🖱️ الضغط على البالونة
   ========================================================= */

function handleNumberBalloonClick(
    balloon,
    clickedNumber,
    target
) {

    if (
        !numberBalloonGame.active ||
        numberBalloonGame.paused ||
        numberBalloonGame.answered
    ) {
        return;
    }

    if (
        balloon.dataset.clicked === "true"
    ) {
        return;
    }

    balloon.dataset.clicked =
        "true";

    if (
        Number(clickedNumber) ===
        Number(target)
    ) {

        numberBalloonGame.answered =
            true;

        handleNumberBalloonCorrect(
            balloon
        );

    } else {

        handleNumberBalloonMistake(
            balloon
        );
    }
}


/* =========================================================
   ✅ الرقم الصحيح
   ========================================================= */

function handleNumberBalloonCorrect(
    balloon
) {

    stopNumberBalloonRoundTimer();

    numberBalloonGame.streak++;

    numberBalloonGame.bestStreak =
        Math.max(
            numberBalloonGame.bestStreak,
            numberBalloonGame.streak
        );

    const points =
        calculateNumberBalloonPoints();

    numberBalloonGame.score +=
        points;

    numberBalloonGame.earnedStars++;

    if (
        typeof addStars === "function"
    ) {
        addStars(1);
    }

    balloon.style.pointerEvents =
        "none";

    balloon.style.transition =
        "none";

    balloon.style.animation =
        "none";

    void balloon.offsetWidth;

    balloon.style.animation =
        "balloonPop .45s ease-out forwards";

    createNumberPopEffect(
        balloon
    );

    showNumberBalloonMessage(
        getNumberBalloonSuccessMessage(),
        true
    );

    speakNumberBalloonSuccess();

    updateNumberBalloonHUD();

    const session =
        numberBalloonGame.session;

    numberBalloonGame.nextRoundTimer =
        setTimeout(() => {

            if (
                !numberBalloonGame.active ||
                session !==
                numberBalloonGame.session
            ) {
                return;
            }

            clearNumberBalloonArena();

            nextNumberBalloonRound();

        }, 800);
}


/* =========================================================
   ❌ خطأ
   ========================================================= */

function handleNumberBalloonMistake(
    balloon
) {

    if (
        balloon.dataset.mistake === "true"
    ) {
        return;
    }

    balloon.dataset.mistake =
        "true";

    numberBalloonGame.streak =
        0;

    numberBalloonGame.lives =
        Math.max(
            0,
            numberBalloonGame.lives - 1
        );

    balloon.classList.add(
        "balloon-wrong"
    );

    showNumberBalloonMessage(
        "😊 حَاوِلْ مَرَّةً أُخْرَى",
        false
    );

    speakEducational(
        "حَاوِلْ مَرَّةً أُخْرَى"
    );

    updateNumberBalloonHUD();

    if (
        numberBalloonGame.lives <= 0
    ) {

        stopNumberBalloonRoundTimer();

        numberBalloonGame.answered =
            true;

        const session =
            numberBalloonGame.session;

        setTimeout(() => {

            if (
                numberBalloonGame.active &&
                session ===
                numberBalloonGame.session
            ) {

                finishNumberBalloonGame(
                    "noLives"
                );
            }

        }, 500);

        return;
    }

    setTimeout(() => {

        if (
            balloon.parentNode
        ) {

            balloon.classList.remove(
                "balloon-wrong"
            );
        }

    }, 550);
}


/* =========================================================
   ⏰ مؤقت الجولة
   ========================================================= */

function startNumberBalloonRoundTimer() {

    stopNumberBalloonRoundTimer();

    const level =
        numberBalloonLevels[
            numberBalloonGame.level
        ];

    numberBalloonGame.timeLeft =
        level.time;

    updateNumberBalloonHUD();

    numberBalloonGame.roundTimer =
        setInterval(() => {

            if (
                !numberBalloonGame.active ||
                numberBalloonGame.paused
            ) {
                return;
            }

            numberBalloonGame.timeLeft--;

            updateNumberBalloonHUD();

            if (
                numberBalloonGame.timeLeft <= 0
            ) {

                handleNumberBalloonTimeout();
            }

        }, 1000);
}


/* =========================================================
   ⏰ انتهى الوقت
   ========================================================= */

function handleNumberBalloonTimeout() {

    if (
        !numberBalloonGame.active ||
        numberBalloonGame.answered
    ) {
        return;
    }

    numberBalloonGame.answered =
        true;

    stopNumberBalloonRoundTimer();

    numberBalloonGame.streak =
        0;

    numberBalloonGame.lives =
        Math.max(
            0,
            numberBalloonGame.lives - 1
        );

    showNumberBalloonMessage(
        "⏰ اِنْتَهَى الوَقْت",
        false
    );

    speakEducational(
        "اِنْتَهَى الوَقْت"
    );

    clearNumberBalloonArena();

    updateNumberBalloonHUD();

    if (
        numberBalloonGame.lives <= 0
    ) {

        finishNumberBalloonGame(
            "noLives"
        );

        return;
    }

    const session =
        numberBalloonGame.session;

    numberBalloonGame.nextRoundTimer =
        setTimeout(() => {

            if (
                !numberBalloonGame.active ||
                session !==
                numberBalloonGame.session
            ) {
                return;
            }

            nextNumberBalloonRound();

        }, 1000);
}


/* =========================================================
   ⭐ النقاط
   ========================================================= */

function calculateNumberBalloonPoints() {

    let points = 10;

    if (
        numberBalloonGame.level > 1
    ) {

        points +=
            (
                numberBalloonGame.level -
                1
            ) * 5;
    }

    if (
        numberBalloonGame.streak >= 3
    ) {

        points += 5;
    }

    if (
        numberBalloonGame.streak >= 5
    ) {

        points += 10;
    }

    return points;
}


/* =========================================================
   🛑 إيقاف المؤقت
   ========================================================= */

function stopNumberBalloonRoundTimer() {

    if (
        numberBalloonGame.roundTimer
    ) {

        clearInterval(
            numberBalloonGame.roundTimer
        );

        numberBalloonGame.roundTimer =
            null;
    }
}


/* =========================================================
   🧹 تنظيف مؤقتات البالونات
   ========================================================= */

function clearNumberBalloonSpawnTimers() {

    numberBalloonGame.spawnTimers.forEach(
        timer => clearTimeout(timer)
    );

    numberBalloonGame.spawnTimers =
        [];
}


/* =========================================================
   🛑 إيقاف كل مؤقتات الأرقام
   ========================================================= */

function stopNumberBalloonGameTimers() {

    stopNumberBalloonRoundTimer();

    clearNumberBalloonSpawnTimers();

    if (
        numberBalloonGame.nextRoundTimer
    ) {

        clearTimeout(
            numberBalloonGame.nextRoundTimer
        );

        numberBalloonGame.nextRoundTimer =
            null;
    }
}


/* =========================================================
   🧹 تنظيف الساحة
   ========================================================= */

function clearNumberBalloonArena() {

    const arena =
        document.getElementById(
            "numberBalloonArena"
        );

    if (!arena) return;

    arena.innerHTML = `
        <div class="arena-cloud cloud-one">☁️</div>
        <div class="arena-cloud cloud-two">☁️</div>
    `;
}


/* =========================================================
   🔊 نطق الرقم
   ========================================================= */

function speakNumberBalloonTarget(
    number
) {

    const word =
        numberBalloonWords[number] ||
        String(number);

    if (
        typeof speak === "function"
    ) {

        speakEducational(
            word,
            {
                rate: 0.68,
                pitch: 1
            }
        );

        return;
    }

    if (
        "speechSynthesis" in window
    ) {

        speechSynthesis.cancel();

        const utterance =
            new SpeechSynthesisUtterance(
                word
            );

        utterance.lang =
            "ar-SA";

        utterance.rate =
            0.68;

        utterance.pitch =
            1;

        if (
            typeof arabicVoice !== "undefined" &&
            arabicVoice
        ) {

            utterance.voice =
                arabicVoice;
        }

        speechSynthesis.speak(
            utterance
        );
    }
}


/* =========================================================
   🔊 إعادة سماع الرقم
   ========================================================= */

function repeatNumberBalloonTarget() {

    if (
        numberBalloonGame.target === null
    ) {
        return;
    }

    speakNumberBalloonTarget(
        numberBalloonGame.target
    );
}


/* =========================================================
   🔊 التشجيع
   ========================================================= */

function speakNumberBalloonSuccess() {

    const messages = [
        "أَحْسَنْتَ",
        "مُمْتَاز",
        "رَائِع",
        "بَرَافُو",
        "شَاطِر"
    ];

    speakEducational(
        messages[
            Math.floor(
                Math.random() *
                messages.length
            )
        ]
    );
}


/* =========================================================
   💬 رسائل الأرقام
   ========================================================= */

function getNumberBalloonSuccessMessage() {

    const messages = [
        "🎉 أَحْسَنْتَ!",
        "⭐ مُمْتَاز!",
        "🌟 رَائِع!",
        "👏 بَرَافُو!",
        "🏆 شَاطِر!"
    ];

    return messages[
        Math.floor(
            Math.random() *
            messages.length
        )
    ];
}


function showNumberBalloonMessage(
    message,
    success
) {

    const element =
        document.getElementById(
            "numberBalloonMessage"
        );

    if (!element) return;

    element.textContent =
        message;

    element.classList.toggle(
        "success",
        !!success
    );

    element.classList.add(
        "show"
    );

    setTimeout(() => {

        element.classList.remove(
            "show"
        );

    }, 1200);
}


/* =========================================================
   💥 انفجار البالونة
   ========================================================= */

function createNumberPopEffect(
    balloon
) {

    const arena =
        document.getElementById(
            "numberBalloonArena"
        );

    if (!arena || !balloon) {
        return;
    }

    const rect =
        balloon.getBoundingClientRect();

    const arenaRect =
        arena.getBoundingClientRect();

    const x =
        rect.left +
        rect.width / 2 -
        arenaRect.left;

    const y =
        rect.top +
        rect.height / 2 -
        arenaRect.top;

    const symbols = [
        "✨",
        "⭐",
        "💥",
        "🌟",
        "🎉",
        "💫"
    ];

    for (
        let i = 0;
        i < 12;
        i++
    ) {

        const particle =
            document.createElement(
                "span"
            );

        particle.className =
            "pop-particle";

        particle.textContent =
            symbols[
                Math.floor(
                    Math.random() *
                    symbols.length
                )
            ];

        particle.style.left =
            `${x}px`;

        particle.style.top =
            `${y}px`;

        particle.style.setProperty(
            "--x",
            `${(Math.random() - 0.5) * 200}px`
        );

        particle.style.setProperty(
            "--y",
            `${(Math.random() - 0.5) * 200}px`
        );

        arena.appendChild(
            particle
        );

        setTimeout(() => {

            particle.remove();

        }, 900);
    }
}


/* =========================================================
   📊 تحديث واجهة الأرقام
   ========================================================= */

function updateNumberBalloonHUD() {

    const score =
        document.getElementById(
            "numberBalloonScore"
        );

    const level =
        document.getElementById(
            "numberBalloonLevel"
        );

    const progress =
        document.getElementById(
            "numberBalloonProgressFill"
        );

    const streak =
        document.getElementById(
            "numberBalloonStreak"
        );

    const target =
        document.getElementById(
            "numberBalloonTarget"
        );

    if (score) {

        score.textContent =
            numberBalloonArabicNumber(
                numberBalloonGame.score
            );
    }

    if (level) {

        level.textContent =
            numberBalloonArabicNumber(
                numberBalloonGame.level
            );
    }

    if (streak) {

        streak.textContent =
            numberBalloonArabicNumber(
                numberBalloonGame.streak
            );
    }

    if (target) {

        target.textContent =
            numberBalloonGame.target !== null
                ? numberBalloonArabicNumber(
                    numberBalloonGame.target
                )
                : "؟";
    }

    if (progress) {

        const percent =
            Math.min(
                100,
                (
                    numberBalloonGame.round /
                    numberBalloonGame.totalRounds
                ) * 100
            );

        progress.style.width =
            `${percent}%`;
    }

    updateNumberBalloonExtraHUD();
}


/* =========================================================
   ❤️ الأرواح والمؤقت
   ========================================================= */

function updateNumberBalloonExtraHUD() {

    const lives =
        document.getElementById(
            "numberBalloonLives"
        );

    const timer =
        document.getElementById(
            "numberBalloonTimer"
        );

    const best =
        document.getElementById(
            "numberBalloonBestScore"
        );

    if (lives) {

        lives.textContent =
            "❤️".repeat(
                Math.max(
                    0,
                    numberBalloonGame.lives
                )
            );
    }

    if (timer) {

        timer.textContent =
            `⏱️ ${numberBalloonArabicNumber(
                Math.max(
                    0,
                    numberBalloonGame.timeLeft
                )
            )}`;

        timer.classList.toggle(
            "danger",
            numberBalloonGame.timeLeft <= 5
        );
    }

    if (best) {

        best.textContent =
            `🏆 ${numberBalloonArabicNumber(
                numberBalloonGame.bestScore
            )}`;
    }
}


/* =========================================================
   ⏸️ إيقاف / استكمال
   ========================================================= */

function toggleNumberBalloonPause() {

    if (
        !numberBalloonGame.active
    ) {
        return;
    }

    if (
        numberBalloonGame.paused
    ) {

        resumeNumberBalloonGame();

    } else {

        pauseNumberBalloonGame();
    }
}


function pauseNumberBalloonGame() {

    if (
        numberBalloonGame.paused
    ) {
        return;
    }

    numberBalloonGame.paused =
        true;

    stopNumberBalloonRoundTimer();

    if (
        "speechSynthesis" in window
    ) {
        speechSynthesis.cancel();
    }

    showNumberBalloonPauseOverlay();

    const button =
        document.getElementById(
            "numberBalloonPauseBtn"
        );

    if (button) {

        button.textContent =
            "▶️ استكمال";
    }
}


function resumeNumberBalloonGame() {

    if (
        !numberBalloonGame.paused
    ) {
        return;
    }

    numberBalloonGame.paused =
        false;

    hideNumberBalloonPauseOverlay();

    const button =
        document.getElementById(
            "numberBalloonPauseBtn"
        );

    if (button) {

        button.textContent =
            "⏸️ إيقاف";
    }

    if (
        !numberBalloonGame.answered
    ) {

        startNumberBalloonRoundTimer();
    }
}


/* =========================================================
   ⏸️ شاشة التوقف
   ========================================================= */

function showNumberBalloonPauseOverlay() {

    let overlay =
        document.getElementById(
            "numberBalloonPauseOverlay"
        );

    if (!overlay) {

        overlay =
            document.createElement(
                "div"
            );

        overlay.id =
            "numberBalloonPauseOverlay";

        overlay.className =
            "balloon-pause-overlay";

        overlay.innerHTML = `

            <div class="pause-box">

                <div class="pause-icon">
                    ⏸️
                </div>

                <h2>
                    اللُّعْبَة مُتَوَقِّفَة
                </h2>

                <button
                    class="balloon-control-btn"
                    onclick="resumeNumberBalloonGame()"
                >
                    ▶️ استكمال اللعب
                </button>

            </div>
        `;

        document.body.appendChild(
            overlay
        );
    }

    overlay.classList.add(
        "show"
    );
}


function hideNumberBalloonPauseOverlay() {

    const overlay =
        document.getElementById(
            "numberBalloonPauseOverlay"
        );

    if (overlay) {

        overlay.classList.remove(
            "show"
        );
    }
}


/* =========================================================
   🏆 نهاية لعبة الأرقام
   ========================================================= */

function finishNumberBalloonGame(
    reason = "completed"
) {

    if (
        !numberBalloonGame.active
    ) {
        return;
    }

    stopNumberBalloonGameTimers();

    clearNumberBalloonArena();

    numberBalloonGame.active =
        false;

    numberBalloonGame.paused =
        false;

    numberBalloonGame.session++;

    hideNumberBalloonPauseOverlay();

    if (
        numberBalloonGame.score >
        numberBalloonGame.bestScore
    ) {

        numberBalloonGame.bestScore =
            numberBalloonGame.score;

        localStorage.setItem(
            "numberBalloonBestScore",
            String(
                numberBalloonGame.bestScore
            )
        );
    }

    const old =
        document.getElementById(
            "numberBalloonFinishScreen"
        );

    if (old) {
        old.remove();
    }

    const screen =
        document.getElementById(
            "numberBalloonGame"
        );

    if (!screen) return;

    const finish =
        document.createElement(
            "div"
        );

    finish.id =
        "numberBalloonFinishScreen";

    finish.className =
        "balloon-finish-screen";

    const completed =
        reason === "completed";

    finish.innerHTML = `

        <div class="finish-trophy">
            ${completed ? "🏆" : "💪"}
        </div>

        <h2>
            ${
                completed
                    ? "أَنْهَيْتَ لُعْبَة فَرِّقْع الأَرْقَام!"
                    : "انتهت اللعبة"
            }
        </h2>

        <p>
            ${
                completed
                    ? "مُمْتَاز! أَنْتَ بَطَلُ الأَرْقَام!"
                    : "لَا بَأْسَ! حَاوِلْ مَرَّةً أُخْرَى"
            }
        </p>

        <div class="finish-score">
            ⭐
            ${numberBalloonArabicNumber(
                numberBalloonGame.score
            )}
        </div>

        <div class="finish-stars">
            🌟 النجوم المكتسبة:
            ${numberBalloonArabicNumber(
                numberBalloonGame.earnedStars
            )}
        </div>

        <div class="finish-stats">

            <div>
                🔥 أفضل تتابع:
                ${numberBalloonArabicNumber(
                    numberBalloonGame.bestStreak
                )}
            </div>

            <div>
                🏆 أفضل نتيجة:
                ${numberBalloonArabicNumber(
                    numberBalloonGame.bestScore
                )}
            </div>

        </div>

        <div class="finish-actions">

            <button
                class="balloon-control-btn"
                onclick="startNumberBalloonGame()"
            >
                🔄 العب مرة أخرى
            </button>

            <button
                class="secondary balloon-control-btn"
                onclick="exitNumberBalloonGame()"
            >
                ⬅️ العودة للألعاب
            </button>

        </div>
    `;

    const wrapper =
        screen.querySelector(
            ".balloon-game-wrapper"
        );

    if (wrapper) {

        wrapper.appendChild(
            finish
        );
    }

    speakEducational(
        completed
            ? "مُمْتَاز! أَنْهَيْتَ لُعْبَة الأَرْقَام"
            : "لَا بَأْسَ. حَاوِلْ مَرَّةً أُخْرَى"
    );
}


/* =========================================================
   🚪 الخروج من الأرقام
   ========================================================= */

function exitNumberBalloonGame() {

    stopNumberBalloonGameTimers();

    numberBalloonGame.active =
        false;

    numberBalloonGame.paused =
        false;

    numberBalloonGame.target =
        null;

    numberBalloonGame.session++;

    clearNumberBalloonArena();

    hideNumberBalloonPauseOverlay();

    const controls =
        document.getElementById(
            "numberBalloonControls"
        );

    if (controls) {
        controls.remove();
    }

    const finish =
        document.getElementById(
            "numberBalloonFinishScreen"
        );

    if (finish) {
        finish.remove();
    }

    showScreen("games");
}
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
        "medial": ["نضج", "خضار", "مضرب", "أخضر", "قضيب"],
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
   🏎️ سباق الحروف — نسخة احترافية هادئة (SEN-friendly)
   =========================================================
   كلمة ناقص منها حرف ← بوابات بأشكال الحرف الصحيحة (منفصل/
   أول/وسط/آخر) حسب موقعه الفعلي داخل الكلمة. 4 مستويات
   (مطابقة LETTER_LEVEL_GROUPS تمامًا، بلا خلط بين مجموعاتها)،
   7 جولات بكل مستوى (حرف واحد لكل حرف من حروف المجموعة)،
   بتدرّج صعوبة داخلي حقيقي (عدد البوابات + نوع المشتتات).
   بلا مؤقت إجباري يقطع الجولة، بلا أرواح، بلا عقاب. بيانات
   الكلمات ثابتة بالكامل (RACE_WORD_BANK)، مُتحقَّقة برمجيًا
   مسبقًا — لا اختيار عشوائي للكلمات نفسها، فقط اختيار الجولة
   يُحدِّد أي كلمة من القائمة الثابتة لذلك الحرف/الموضع تُستخدَم.
   ========================================================= */

const RACE_NON_CONNECTORS = new Set(["أ", "إ", "آ", "ا", "د", "ذ", "ر", "ز", "و"]);

function raceValidPositionsForLetter(letter) {
    if (RACE_NON_CONNECTORS.has(letter)) return ["isolated", "final"];
    return ["initial", "medial", "final"];
}

function raceShapeForLetterAtPosition(letter, position) {
    const forms = arabicLetterForms[letter];
    if (!forms) return letter;
    return forms[position] || forms.isolated || letter;
}

const letterRaceGame = {
    level: 1,
    round: 0,
    roundsPerLevel: 7,
    letterOrder: [],
    target: null,
    targetPosition: null,
    targetWord: null,
    gates: [],
    selectedLane: 0,
    isRunning: false,
    answered: false,
    session: 0,
    score: 0
};

/* =========================================================
   💾 حفظ/تحميل المستوى المفتوح — مفتاح معزول جديد خاص بهذه
   اللعبة فقط، بنفس أسلوب مفاتيح التقدّم الأخرى في التطبيق
   ========================================================= */

function loadRaceUnlockedLevel() {
    const saved = Number(localStorage.getItem("taha_letterrace_unlocked_level") || 1);
    return Math.min(Math.max(saved, 1), 4);
}

function saveRaceUnlockedLevel(level) {
    const current = loadRaceUnlockedLevel();
    if (level > current) {
        localStorage.setItem("taha_letterrace_unlocked_level", String(Math.min(level, 4)));
    }
}

/* =========================================================
   🧠 تدرّج الصعوبة داخل المستوى — جولة 1-2 سهلة، 3-5 متوسطة،
   6-7 تحدٍّ (مشتتات بصرية حقيقية متشابهة)
   ========================================================= */

function raceRoundTier(round) {
    if (round <= 2) return "easy";
    if (round <= 5) return "medium";
    return "hard";
}

function raceGateCountForTier(tier, availablePositionsCount) {
    const wanted = tier === "easy" ? 2 : tier === "medium" ? 3 : 4;
    /* 🛠️ إصلاح: الحرف غير المتصل (مواضعه الصالحة = 2 فقط: منفصل/
       آخر) يبقى بعدد بوابات أبسط (حد أقصى 3) حتى عند التحدي —
       تمييزًا بصريًا أهدأ يناسب بساطة شكليه، كما وعد التصوّر
       المعتمد. الحرف المتصل (3 مواضع صالحة) يأخذ التدرّج الكامل */
    const maxForLetterType = availablePositionsCount <= 2 ? 3 : 4;
    return Math.min(wanted, maxForLetterType);
}

/* =========================================================
   ▶️ بدء اللعبة — تبدأ دائمًا من المستوى المفتوح المحفوظ
   ========================================================= */

function startLetterRace() {

    letterRaceGame.level = loadRaceUnlockedLevel();
    letterRaceGame.round = 0;
    letterRaceGame.score = 0;
    letterRaceGame.isRunning = false;
    letterRaceGame.answered = false;
    letterRaceGame.session++;

    const group = LETTER_LEVEL_GROUPS[letterRaceGame.level - 1];
    letterRaceGame.letterOrder = shuffle(group.letters.slice());

    showScreen("letterRaceGame");

    const overlay = $("letterRaceLevelComplete");
    if (overlay) overlay.style.display = "none";

    setupLetterRaceControls();
    updateLetterRaceHUD();
    clearLetterRaceMessage();

    setTimeout(() => {
        startLetterRaceRound();
    }, 150);
}

/* =========================================================
   🔄 بدء جولة جديدة — تختار حرفًا من ترتيب المستوى، موضعًا
   صالحًا حسب مستوى الصعوبة، وكلمة ثابتة من البنك المُتحقَّق
   ========================================================= */

function startLetterRaceRound() {

    letterRaceGame.round++;
    letterRaceGame.answered = false;

    if (letterRaceGame.round > letterRaceGame.roundsPerLevel) {
        finishRaceLevel();
        return;
    }

    const letter = letterRaceGame.letterOrder[letterRaceGame.round - 1];
    const tier = raceRoundTier(letterRaceGame.round);
    const validPositions = raceValidPositionsForLetter(letter);

    /* اختيار الموضع: عشوائي من المواضع الصالحة لهذا الحرف تحديدًا
       (الحروف غير المتصلة تُقيَّد تلقائيًا بمنفصل/آخر فقط) */
    const position = validPositions[Math.floor(Math.random() * validPositions.length)];

    const wordsForSlot = (RACE_WORD_BANK[letter] && RACE_WORD_BANK[letter][position]) || [];
    const word = wordsForSlot.length
        ? wordsForSlot[Math.floor(Math.random() * wordsForSlot.length)]
        : null;

    letterRaceGame.target = letter;
    letterRaceGame.targetPosition = position;
    letterRaceGame.targetWord = word;

    updateLetterRaceHUD();
    clearLetterRaceMessage();

    renderRaceWordWithBlank(word, letter, position);
    createLetterRaceGates(letter, position, tier);

    speakRaceRoundIntro(word);
}

/* =========================================================
   🧩 بناء خيارات البوابات — الشكل الصحيح + مشتتات مناسبة
   (عند التحدي: أشكال حروف متشابهة بصريًا فعليًا، إعادة استخدام
   LTR_SIMILAR_LETTERS الموجودة أصلًا في محرك الحروف)
   ========================================================= */

function buildRaceGateOptions(letter, position, tier) {

    const correctShape = raceShapeForLetterAtPosition(letter, position);

    const availablePositions = raceValidPositionsForLetter(letter).length;
    const gateCount = raceGateCountForTier(tier, availablePositions);

    const distractorShapes = [];

    const addShapeIfNew = (candidateLetter) => {
        if (distractorShapes.length >= gateCount - 1) return;
        if (candidateLetter === letter) return;
        const shape = raceShapeForLetterAtPosition(candidateLetter, position);
        if (shape && shape !== correctShape && !distractorShapes.includes(shape)) {
            distractorShapes.push(shape);
        }
    };

    if (tier === "hard") {
        const similar = (typeof LTR_SIMILAR_LETTERS !== "undefined" && LTR_SIMILAR_LETTERS[letter]) || [];
        shuffle(similar.slice()).forEach(addShapeIfNew);
    }

    const allLetters = ["أ","ب","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ك","ل","م","ن","ه","و","ي"];
    shuffle(allLetters.slice()).forEach(addShapeIfNew);

    const options = shuffle([correctShape, ...distractorShapes]);
    return options;
}

/* =========================================================
   📝 عرض الكلمة بفراغ مكان الحرف المطلوب
   ========================================================= */

/* 🛠️ تصحيح: الفراغ يحافظ على علامات الاتصال الصحيحة من الجانبين
   (عبر حرف التطويل ـ Unicode، فيتولى عرض المتصفح الطبيعي للنص
   العربي رسم الشكل المتصل الصحيح تلقائيًا)، بلا إظهار الحرف
   المخفي نفسه إطلاقًا قبل اختيار البوابة. القاعدة مبنية على
   targetPosition المُتحقَّق منه مسبقًا نفسه، لا تخمينًا جديدًا:
   - medial: تطويل بعد "قبل" + تطويل قبل "بعد" (يتصل الجانبان)
   - initial: تطويل قبل "بعد" فقط (يتصل للأمام فقط)
   - final: تطويل بعد "قبل" فقط (يتصل للخلف فقط)
   - isolated: بلا أي تطويل (لا يتصل بأي جانب) */

const RACE_TATWEEL = "\u0640";

function renderRaceWordWithBlank(word, letter, position) {

    const container = $("letterRaceTarget");
    if (!container) return;

    if (!word) {
        container.textContent = letterWithFatha(letter);
        return;
    }

    const index = word.indexOf(letter);
    if (index === -1) {
        container.textContent = word;
        return;
    }

    let before = word.slice(0, index);
    let after = word.slice(index + 1);

    if ((position === "medial" || position === "final") && before) {
        before = before + RACE_TATWEEL;
    }
    if ((position === "medial" || position === "initial") && after) {
        after = RACE_TATWEEL + after;
    }

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

function fillRaceWordBlank(letter) {
    const container = $("letterRaceTarget");
    if (!container) return;

    /* الكلمة الكاملة كنص عادي — عرض المتصفح الطبيعي للنص العربي
       يرسم الاتصال الصحيح تلقائيًا لكلمة حقيقية كاملة، بلا حاجة
       لأي تطويل أو تدخّل يدوي في هذه الحالة */
    if (letterRaceGame.targetWord) {
        container.textContent = letterRaceGame.targetWord;
    } else {
        container.textContent = letterWithFatha(letter);
    }

    container.classList.add("race-word-blank-filled");
}

/* =========================================================
   🚪 إنشاء البوابات — إعادة استخدام كاملة للبنية البصرية
   الحالية (السيارة/الحارات)، فقط تعرض أشكال الحرف الآن
   ========================================================= */

function createLetterRaceGates(letter, position, tier) {

    const container = $("letterRaceOptions");
    if (!container) return;

    const options = buildRaceGateOptions(letter, position, tier);
    const correctShape = raceShapeForLetterAtPosition(letter, position);

    letterRaceGame.gates = options;

    container.innerHTML = "";
    container.className = "letter-race-gates";

    options.forEach((shape, index) => {

        const gate = document.createElement("button");
        gate.type = "button";
        gate.className = "letter-race-gate";
        gate.dataset.index = String(index);
        gate.dataset.shape = shape;
        gate.dataset.correct = shape === correctShape ? "1" : "0";
        gate.setAttribute("aria-label", `بوابة الشكل ${shape}`);

        const gatePosition = ((index + 0.5) / options.length) * 100;
        gate.style.left = `${gatePosition}%`;
        gate.style.top = "50%";
        gate.style.transform = "translate(-50%, -50%)";

        gate.innerHTML = `
            <div class="gate-roof">🏁</div>
            <div class="gate-letter">${shape}</div>
            <div class="gate-base">🚦</div>
        `;

        gate.addEventListener("click", () => {

            if (!letterRaceGame.isRunning || letterRaceGame.answered) return;

            letterRaceGame.selectedLane = index;
            moveLetterRaceCarToLane(index, true);
            highlightLetterRaceSelectedGate();

            setTimeout(() => {
                if (!letterRaceGame.answered && letterRaceGame.isRunning) {
                    checkLetterRaceGate();
                }
            }, 150);
        });

        container.appendChild(gate);
    });

    letterRaceGame.selectedLane = Math.min(1, options.length - 1);
    moveLetterRaceCarToLane(letterRaceGame.selectedLane, false);
    highlightLetterRaceSelectedGate();

    letterRaceGame.isRunning = true;
}

/* =========================================================
   🎯 فحص البوابة المختارة
   ========================================================= */

function checkLetterRaceGate() {

    if (!letterRaceGame.isRunning || letterRaceGame.answered) return;

    letterRaceGame.answered = true;

    const gates = document.querySelectorAll("#letterRaceOptions .letter-race-gate");
    const selectedGate = gates[letterRaceGame.selectedLane];

    if (selectedGate && selectedGate.dataset.correct === "1") {
        handleLetterRaceCorrect(selectedGate);
    } else {
        handleLetterRaceWrong(selectedGate);
    }
}

/* =========================================================
   ✅ إجابة صحيحة — الفراغ يمتلئ، تعزيز، نجمة، انتقال واضح
   ========================================================= */

const RACE_SUCCESS_PHRASES = ["أَحْسَنْتَ", "مُمْتَاز", "رَائِع", "بَرَافُو", "شَاطِر"];

function handleLetterRaceCorrect(gate) {

    const session = letterRaceGame.session;

    letterRaceGame.isRunning = false;

    if (gate) {
        gate.classList.remove("selected");
        gate.classList.add("correct");
    }

    const car = $("letterRaceCar");
    if (car) {
        car.classList.remove("race-crash");
        car.classList.add("race-success");
    }

    fillRaceWordBlank(letterRaceGame.target);

    if (typeof addStars === "function") addStars(1);
    letterRaceGame.score++;

    createLetterRaceConfetti();
    createLetterRaceStarExplosion();

    const phrase = RACE_SUCCESS_PHRASES[Math.floor(Math.random() * RACE_SUCCESS_PHRASES.length)];
    showLetterRaceMessage("🎉 " + phrase);
    speakEducational(phrase);

    updateLetterRaceHUD();

    setTimeout(() => {
        if (session !== letterRaceGame.session) return;

        if (car) {
            car.classList.remove("race-success");
            car.style.transform = "translateX(-50%)";
        }

        startLetterRaceRound();

    }, 1700);
}

/* =========================================================
   😊 إجابة خاطئة — تصحيح هادئ، بلا أي عقوبة أو خصم، تبقى نفس
   الجولة حتى يختار الصحيح
   ========================================================= */

function handleLetterRaceWrong(gate) {

    if (gate) {
        gate.classList.add("wrong");
    }

    const car = $("letterRaceCar");
    if (car) {
        car.classList.add("race-crash");
    }

    showLetterRaceMessage("😊 حاول مرة أخرى");
    speakEducational("حاول مرة أخرى");

    setTimeout(() => {

        letterRaceGame.answered = false;

        if (gate) gate.classList.remove("wrong");
        if (car) car.classList.remove("race-crash");

    }, 700);
}

/* =========================================================
   🏁 إكمال المستوى — شاشة هادئة + فتح المستوى التالي
   ========================================================= */

function finishRaceLevel() {

    letterRaceGame.isRunning = false;

    const isLastLevel = letterRaceGame.level >= 4;

    saveRaceUnlockedLevel(Math.min(letterRaceGame.level + 1, 4));

    const overlay = $("letterRaceLevelComplete");
    const titleEl = $("letterRaceLevelCompleteTitle");
    const bodyEl = $("letterRaceLevelCompleteBody");
    const nextBtn = $("letterRaceLevelCompleteNextBtn");

    if (titleEl) {
        titleEl.textContent = isLastLevel ? "🎉 أكملت السباق!" : "🌟 أحسنت! أكملت المستوى";
    }
    if (bodyEl) {
        bodyEl.textContent = isLastLevel
            ? "أتممت كل مستويات سباق الحروف بنجاح"
            : "المستوى التالي بانتظارك";
    }
    if (nextBtn) {
        nextBtn.textContent = isLastLevel ? "🏠 العودة للألعاب" : "▶ المستوى التالي";
        nextBtn.onclick = isLastLevel ? exitLetterRace : advanceToNextRaceLevel;
    }

    if (overlay) overlay.style.display = "flex";

    speakEducational("أحسنت! أتممت المستوى بنجاح");
}

function advanceToNextRaceLevel() {

    letterRaceGame.level = Math.min(letterRaceGame.level + 1, 4);
    letterRaceGame.round = 0;
    letterRaceGame.answered = false;
    letterRaceGame.session++;

    const group = LETTER_LEVEL_GROUPS[letterRaceGame.level - 1];
    letterRaceGame.letterOrder = shuffle(group.letters.slice());

    const overlay = $("letterRaceLevelComplete");
    if (overlay) overlay.style.display = "none";

    updateLetterRaceHUD();
    clearLetterRaceMessage();

    startLetterRaceRound();
}

/* =========================================================
   🖥️ واجهة المعلومات (HUD) — مبسَّطة، بلا أرواح أو مؤقت
   ========================================================= */

function updateLetterRaceHUD() {

    const levelEl = $("letterRaceLevel");
    if (levelEl) levelEl.textContent = arabicNumber(letterRaceGame.level);

    const roundEl = $("letterRaceRound");
    if (roundEl) roundEl.textContent = arabicNumber(Math.min(letterRaceGame.round, letterRaceGame.roundsPerLevel));

    const totalEl = $("letterRaceTotalRounds");
    if (totalEl) totalEl.textContent = arabicNumber(letterRaceGame.roundsPerLevel);

    const scoreEl = $("letterRaceScore");
    if (scoreEl && typeof stars !== "undefined") scoreEl.textContent = arabicNumber(stars);

    const fill = $("letterRaceProgressFill");
    if (fill) {
        const completedRounds = Math.max(0, letterRaceGame.round - 1);
        const pct = Math.min(100, Math.round((completedRounds / letterRaceGame.roundsPerLevel) * 100));
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
   🔊 نطق الكلمة كاملة عند بداية الجولة + إعادة الاستماع
   ========================================================= */

function speakRaceRoundIntro(word) {
    if (word) {
        speakEducational(word);
    } else {
        speakEducational(letterWithFatha(letterRaceGame.target));
    }
}

function repeatLetterRaceTarget() {
    speakRaceRoundIntro(letterRaceGame.targetWord);
}

/* =========================================================
   🚗 الحركة والتحكم — إعادة استخدام كاملة للبنية الحالية
   (حارات/سيارة/لوحة مفاتيح)، فقط بلا أي مؤقت يفرض إجابة
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

    const totalLanes = Math.max(1, letterRaceGame.gates.length);
    const maxLane = totalLanes - 1;
    const newLane = letterRaceGame.selectedLane + direction;

    if (newLane < 0 || newLane > maxLane) return;

    letterRaceGame.selectedLane = newLane;
    moveLetterRaceCarToLane(letterRaceGame.selectedLane, true);
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
    if (!letterRaceGame.isRunning || letterRaceGame.answered) return;
    setTimeout(() => {
        if (!letterRaceGame.answered && letterRaceGame.isRunning) {
            checkLetterRaceGate();
        }
    }, 100);
}

/* =========================================================
   🎉 المؤثرات البصرية — إعادة استخدام كاملة بلا أي تعديل
   جوهري (قصيرة وهادئة أصلًا)
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
   🚪 الخروج من السباق
   ========================================================= */

function exitLetterRace() {

    letterRaceGame.isRunning = false;
    letterRaceGame.answered = true;

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

    showScreen("games");
}

/* =========================================================
   🔚 نهاية قسم سباق الحروف
   ========================================================= */


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

const matchingSuccessPhrases = [
    "أَحْسَنْتَ! 🌟",
    "مُمْتَاز! 👏",
    "رَائِع! 🎉",
    "بَطَل! 💪",
    "عَمَلٌ جَمِيل! 😍",
    "بَارِك اللهُ فِيك! ✨"
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

    if (typeof speak === "function") {
        speakEducational(text);
    }
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

/* --- تتبع تدريبات الكتابة (لأغراض المهمة اليومية) --- */

const originalFinishWriting = finishWriting;

finishWriting = function () {

    originalFinishWriting();

    const writingCount =
        Number(localStorage.getItem("taha_correct_writing") || 0) + 1;

    localStorage.setItem("taha_correct_writing", String(writingCount));

    DailyQuest.checkProgress();
};

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
    if (n > loadAdditionUnlockedLevel()) {
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

    const unlocked = loadAdditionUnlockedLevel();
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

    const unlocked = loadAdditionUnlockedLevel();

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
                    ${passed ? "أحسنت! أتممت المستوى بنجاح" : "محاولة رائعة!"}
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
            ? "أحسنت! أتممت المستوى بنجاح"
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
    if (n > loadSubtractionUnlockedLevel()) {
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

    const unlocked = loadSubtractionUnlockedLevel();
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

    const unlocked = loadSubtractionUnlockedLevel();

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
        `ابدأ من ${task.a} وارجع للخلف ${task.b} خطوات`,
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
        speakEducational(`ابدأ من ${task.a} وارجع للخلف ${task.b} خطوات`, { rate: 0.78 });
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
                    ${passed ? "أحسنت! أتممت المستوى بنجاح" : "محاولة رائعة!"}
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
            ? "أحسنت! أتممت المستوى بنجاح"
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
    if (n > loadWordsUnlockedLevel()) {
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

    const unlocked = loadWordsUnlockedLevel();
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

    const unlocked = loadWordsUnlockedLevel();

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
                    ${passed ? "أحسنت! أتممت المستوى بنجاح" : "محاولة رائعة!"}
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
        passed ? "أحسنت! أتممت المستوى بنجاح" : "محاولة رائعة، لنحاول مرة أخرى",
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
    if (n > ltrLoadUnlockedLevel()) ltrSaveUnlockedLevel(n);
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

    const unlocked = ltrLoadUnlockedLevel();

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
    const unlocked = ltrLoadUnlockedLevel();
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

/* --- الكتابة: زر "انتهيت" هو إشارة الإكمال الفعلية --- */

const originalFinishWritingForLog = finishWriting;

finishWriting = function () {

    const letterBefore =
        (typeof writingLetters !== "undefined" && typeof writingIndex !== "undefined")
            ? writingLetters[writingIndex]
            : null;

    originalFinishWritingForLog();

    StudentData.logEvent({
        type: "activity_complete",
        subject: "writing",
        skill: letterBefore,
        activity: "trace",
        correct: null
    });
};

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


/* =========================================================================
   🆕 =====================================================================
   🛡️ إصلاح أولوية عالية: منع تكرار إكمال نفس مهمة الكتابة
   =====================================================================
   finishWriting() لم تكن محمية إطلاقًا من الضغط المتكرر (حتى ببطء،
   بلا أي نافذة زمنية) — كل ضغطة على "✅ انتهيت" كانت تمنح نجومًا
   وتُسجِّل حدثًا جديدًا لنفس الحرف دون أي تتبّع إضافي فعلي. هذا
   الحارس يمنع ذلك: يُعاد ضبطه فقط عند عرض حرف جديد فعليًا للكتابة
   (بداية التطبيق أو الانتقال لحرف تالٍ)، ولا يمسّ منطق النجاح أو
   المكافآت نفسها إطلاقًا — فقط يمنع إعادة معالجة نفس الإكمال.
========================================================================= */

let writingCompletedForCurrentLetter = false;

const originalRenderWritingLetterForGuard = renderWritingLetter;

renderWritingLetter = function () {
    writingCompletedForCurrentLetter = false;
    originalRenderWritingLetterForGuard();
};

const originalFinishWritingForGuard = finishWriting;

finishWriting = function () {

    if (writingCompletedForCurrentLetter) return;

    writingCompletedForCurrentLetter = true;

    originalFinishWritingForGuard();
};

/* =========================================================
   🔚 نهاية إصلاحات الأولوية العالية (منع تكرار الإكمال)
========================================================= */
