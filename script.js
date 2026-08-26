/* ==========================================
   🌟 تعلم مع أ/ طه محمد 🌟
   ملف script.js (النسخة النهائية والمحدثة للقرآن والصوتيات)
========================================== */


/* ==========================================
   الإحصائيات
========================================== */

let stars = 0;
let level = 1;

let correctLetters = 0;
let correctWords = 0;
let correctNumbers = 0;
let correctAddition = 0;
let correctSubtraction = 0;


/* ==========================================
   الأرقام العربية
========================================== */

function arabicNumber(number) {
    return String(number)
        .replace(/0/g, "٠")
        .replace(/1/g, "١")
        .replace(/2/g, "٢")
        .replace(/3/g, "٣")
        .replace(/4/g, "٤")
        .replace(/5/g, "٥")
        .replace(/6/g, "٦")
        .replace(/7/g, "٧")
        .replace(/8/g, "٨")
        .replace(/9/g, "٩");
}


/* ==========================================
   أسماء الأرقام
========================================== */

const numberWords = {
    1: "واحد", 2: "اثنان", 3: "ثلاثة", 4: "أربعة", 5: "خمسة",
    6: "ستة", 7: "سبعة", 8: "ثمانية", 9: "تسعة", 10: "عشرة",
    11: "أحد عشر", 12: "اثنا عشر", 13: "ثلاثة عشر", 14: "أربعة عشر", 15: "خمسة عشر",
    16: "ستة عشر", 17: "سبعة عشر", 18: "ثمانية عشر", 19: "تسعة عشر", 20: "عشرون",
    21: "واحد وعشرون", 22: "اثنان وعشرون", 23: "ثلاثة وعشرون", 24: "أربعة وعشرون", 25: "خمسة وعشرون",
    26: "ستة وعشرون", 27: "سبعة وعشرون", 28: "ثمانية وعشرون", 29: "تسعة وعشرون", 30: "ثلاثون",
    31: "واحد وثلاثون", 32: "اثنان وثلاثون", 33: "ثلاثة وثلاثون", 34: "أربعة وثلاثون", 35: "خمسة وثلاثون",
    36: "ستة وثلاثون", 37: "سبعة وثلاثون", 38: "ثمانية وثلاثون", 39: "تسعة وثلاثون", 40: "أربعون",
    41: "واحد وأربعون", 42: "اثنان وأربعون", 43: "ثلاثة وأربعون", 44: "أربعة وأربعون", 45: "خمسة وأربعون",
    46: "ستة وأربعون", 47: "سبعة وأربعون", 48: "ثمانية وأربعون", 49: "تسعة وأربعون", 50: "خمسون",
    51: "واحد وخمسون", 52: "اثنان وخمسون", 53: "ثلاثة وخمسون", 54: "أربعة وخمسون", 55: "خمسة وخمسون",
    56: "ستة وخمسون", 57: "سبعة وخمسون", 58: "ثمانية وخمسون", 59: "تسعة وخمسون", 60: "ستون",
    61: "واحد وستون", 62: "اثنان وستون", 63: "ثلاثة وستون", 64: "أربعة وستون", 65: "خمسة وستون",
    66: "ستة وستون", 67: "سبعة وستون", 68: "ثمانية وستون", 69: "تسعة وستون", 70: "سبعون",
    71: "واحد وسبعون", 72: "اثنان وسبعون", 73: "ثلاثة وسبعون", 74: "أربعة وسبعون", 75: "خمسة وسبعون",
    76: "ستة وسبعون", 77: "سبعة وسبعون", 78: "ثمانية وسبعون", 79: "تسعة وسبعون", 80: "ثمانون",
    81: "واحد وثمانون", 82: "اثنان وثمانون", 83: "ثلاثة وثمانون", 84: "أربعة وثمانون", 85: "خمسة وثمانون",
    86: "ستة وثمانون", 87: "سبعة وثمانون", 88: "ثمانية وثمانون", 89: "ثمانية وثمانون", 90: "تسعون",
    91: "واحد وتسعون", 92: "اثنان وتسعون", 93: "ثلاثة وتسعون", 94: "أربعة وتسعون", 95: "خمسة وتسعون",
    96: "ستة وتسعون", 97: "سبعة وتسعون", 98: "ثمانية وتسعون", 99: "تسعة وتسعون", 100: "مئة"
};


/* ==========================================
   🔊 نظام النطق الآلي (للحروف والكلمات والأرقام)
========================================== */

let currentUtterance = null;
let arabicVoice = null;

function findArabicVoice() {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    let voice = voices.find(v => v.lang && v.lang.toLowerCase() === "ar-sa");
    if (!voice) {
        voice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith("ar"));
    }
    return voice || null;
}

function loadSpeechVoices() {
    arabicVoice = findArabicVoice();
}

if ("speechSynthesis" in window) {
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadSpeechVoices;
    }
    loadSpeechVoices();
}

function speak(text) {
    if (!text) return;
    if (!("speechSynthesis" in window)) return;

    let cleanText = String(text).replace(/[\u064B-\u0652]/g, "").replace(/\n+/g, " ").trim();
    if (!cleanText) return;

    window.speechSynthesis.cancel();

    setTimeout(function () {
        currentUtterance = new SpeechSynthesisUtterance(cleanText);
        currentUtterance.lang = "ar-SA";
        currentUtterance.rate = 0.85;
        currentUtterance.pitch = 1.0;
        currentUtterance.volume = 1;

        if (!arabicVoice) arabicVoice = findArabicVoice();
        if (arabicVoice) currentUtterance.voice = arabicVoice;

        window.speechSynthesis.speak(currentUtterance);
    }, 50);
}

function praise() {
    speak("أحسنت");
}


/* ==========================================
   ⭐ النجوم والمستوى
========================================== */

function addStar() {
    stars++;
    if (stars % 10 === 0) {
        level++;
        speak("رائع، حصلت على مستوى جديد");
    }
    updateStats();
}

function updateStats() {
    const data = {
        stars: stars, level: level,
        rewardStars: stars, teacherStars: stars, teacherLevel: level,
        teacherLetters: correctLetters, teacherWords: correctWords,
        teacherNumbers: correctNumbers, teacherAddition: correctAddition,
        teacherSubtraction: correctSubtraction
    };

    Object.keys(data).forEach(function (id) {
        const element = document.getElementById(id);
        if (!element) return;
        element.textContent = arabicNumber(data[id]);
    });
}


/* ==========================================
   التنقل
========================================== */

function showScreen(id) {
    // إيقاف أي تلاوة قرآن جارية عند الانتقال لقسم آخر لمنع تداخل الصوت
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    document.querySelectorAll(".screen").forEach(function (screen) {
        screen.classList.remove("active");
    });
    const screen = document.getElementById(id);
    if (screen) screen.classList.add("active");
}


/* ==========================================
   الحروف والكلمات والأرقام والجمع والطرح (تعمل بنظام النطق الذكي)
========================================== */

const letters = [
    { letter: "أ", word: "أسد", emoji: "🦁", sound: "أَ، أسد" },
    { letter: "ب", word: "بطة", emoji: "🦆", sound: "بَ، بطة" },
    { letter: "ت", word: "تفاح", emoji: "🍎", sound: "تَ، تفاح" },
    { letter: "ث", word: "ثعلب", emoji: "🦊", sound: "ثَ، ثعلب" },
    { letter: "ج", word: "جمل", emoji: "🐪", sound: "جَ، جمل" },
    { letter: "ح", word: "حصان", emoji: "🐎", sound: "حَ، حصان" },
    { letter: "خ", word: "خروف", emoji: "🐑", sound: "خَ، خروف" },
    { letter: "د", word: "دب", emoji: "🐻", sound: "دَ، دب" },
    { letter: "ذ", word: "ذرة", emoji: "🌽", sound: "ذَ، ذرة" },
    { letter: "ر", word: "رمان", emoji: "🍎", sound: "رَ، رمان" },
    { letter: "ز", word: "زهرة", emoji: "🌸", sound: "زَ، زهرة" },
    { letter: "س", word: "سمكة", emoji: "🐟", sound: "سَ، سمكة" },
    { letter: "ش", word: "شمس", emoji: "☀️", sound: "شَ، شمس" },
    { letter: "ص", word: "صقر", emoji: "🦅", sound: "صَ، صقر" },
    { letter: "ض", word: "ضفدع", emoji: "🐸", sound: "ضَ، ضفدع" },
    { letter: "ط", word: "طائرة", emoji: "✈️", sound: "طَ، طائرة" },
    { letter: "ظ", word: "ظرف", emoji: "✉️", sound: "ظَ، ظرف" },
    { letter: "ع", word: "عين", emoji: "👁️", sound: "عَ، عين" },
    { letter: "غ", word: "غزال", emoji: "🦌", sound: "غَ، غزال" },
    { letter: "ف", word: "فيل", emoji: "🐘", sound: "فَ، فيل" },
    { letter: "ق", word: "قلم", emoji: "✏️", sound: "قَ، قلم" },
    { letter: "ك", word: "كتاب", emoji: "📚", sound: "كَ، كتاب" },
    { letter: "ل", word: "ليمون", emoji: "🍋", sound: "لَ، ليمون" },
    { letter: "م", word: "موز", emoji: "🍌", sound: "مَ، موز" },
    { letter: "ن", word: "نحلة", emoji: "🐝", sound: "نَ، نحلة" },
    { letter: "هـ", word: "هلال", emoji: "🌙", sound: "هَ، هلال" },
    { letter: "و", word: "وردة", emoji: "🌹", sound: "وَ، وردة" },
    { letter: "ي", word: "يد", emoji: "✋", sound: "يَ، يد" }
];

let letterIndex = 0;
let letterAnswered = false;

function loadLetter() {
    const item = letters[letterIndex];
    document.getElementById("currentLetter").textContent = item.letter;
    document.getElementById("letterPicture").textContent = item.emoji;
    document.getElementById("letterWord").textContent = item.word;
    document.getElementById("letterMessage").textContent = "";
    letterAnswered = false;
    createLetterOptions();
}

function createLetterOptions() {
    const box = document.getElementById("letterOptions");
    if (!box) return;
    box.innerHTML = "";
    let choices = [letters[letterIndex].letter];
    while (choices.length < 3) {
        const random = letters[Math.floor(Math.random() * letters.length)].letter;
        if (!choices.includes(random)) choices.push(random);
    }
    choices.sort(() => Math.random() - 0.5);
    choices.forEach(function (answer) {
        const button = document.createElement("button");
        button.className = "option";
        button.textContent = answer;
        button.onclick = function () { checkLetter(answer); };
        box.appendChild(button);
    });
}

function checkLetter(answer) {
    const message = document.getElementById("letterMessage");
    if (answer === letters[letterIndex].letter) {
        message.textContent = "🎉 أحسنت!";
        message.className = "message success-text";
        if (!letterAnswered) { correctLetters++; addStar(); letterAnswered = true; }
        praise();
    } else {
        message.textContent = "😊 حاول مرة أخرى";
        message.className = "message error-text";
        speak("حاول مرة أخرى");
    }
}

function speakCurrentLetter() { speak(letters[letterIndex].sound); }
function nextLetter() { letterIndex = (letterIndex + 1) % letters.length; loadLetter(); }

const words = [
    { word: "بيت", emoji: "🏠" }, { word: "باب", emoji: "🚪" },
    { word: "ماما", emoji: "👩" }, { word: "بابا", emoji: "👨" },
    { word: "قلم", emoji: "✏️" }, { word: "كتاب", emoji: "📚" },
    { word: "موز", emoji: "🍌" }, { word: "تفاح", emoji: "🍎" },
    { word: "ماء", emoji: "💧" }, { word: "شمس", emoji: "☀️" }
];

let wordIndex = 0;
let wordAnswered = false;

function loadWord() {
    const item = words[wordIndex];
    document.getElementById("currentWord").textContent = item.word;
    document.getElementById("wordPicture").textContent = item.emoji;
    document.getElementById("wordMessage").textContent = "";
    wordAnswered = false;
    createWordOptions();
}

function createWordOptions() {
    const box = document.getElementById("wordOptions");
    if (!box) return;
    box.innerHTML = "";
    let choices = [words[wordIndex].word];
    while (choices.length < 3) {
        const random = words[Math.floor(Math.random() * words.length)].word;
        if (!choices.includes(random)) choices.push(random);
    }
    choices.sort(() => Math.random() - 0.5);
    choices.forEach(function (answer) {
        const button = document.createElement("button");
        button.className = "option";
        button.textContent = answer;
        button.onclick = function () { checkWord(answer); };
        box.appendChild(button);
    });
}

function checkWord(answer) {
    const message = document.getElementById("wordMessage");
    if (answer === words[wordIndex].word) {
        message.textContent = "🎉 أحسنت!";
        message.className = "message success-text";
        if (!wordAnswered) { correctWords++; addStar(); wordAnswered = true; }
        praise();
    } else {
        message.textContent = "😊 حاول مرة أخرى";
        message.className = "message error-text";
        speak("حاول مرة أخرى");
    }
}

function speakWord() { speak(words[wordIndex].word); }
function nextWord() { wordIndex = (wordIndex + 1) % words.length; loadWord(); }

let currentNumber = 1;
let numberAnswered = false;

function loadNumber() {
    document.getElementById("currentNumber").textContent = arabicNumber(currentNumber);
    document.getElementById("countItems").textContent = currentNumber <= 20 ? "🍎".repeat(currentNumber) : "عدد التفاح: " + arabicNumber(currentNumber);
    document.getElementById("numberMessage").textContent = "";
    numberAnswered = false;
    createNumberOptions();
}

function createNumberOptions() {
    const box = document.getElementById("numberOptions");
    if (!box) return;
    box.innerHTML = "";
    let choices = [currentNumber];
    while (choices.length < 3) {
        let random = Math.floor(Math.random() * 100) + 1;
        if (!choices.includes(random)) choices.push(random);
    }
    choices.sort(() => Math.random() - 0.5);
    choices.forEach(function (answer) {
        const button = document.createElement("button");
        button.className = "option";
        button.textContent = arabicNumber(answer);
        button.onclick = function () { checkNumber(answer); };
        box.appendChild(button);
    });
}

function checkNumber(answer) {
    const message = document.getElementById("numberMessage");
    if (answer === currentNumber) {
        message.textContent = "🎉 أحسنت!";
        message.className = "message success-text";
        if (!numberAnswered) { correctNumbers++; addStar(); numberAnswered = true; }
        praise();
    } else {
        message.textContent = "😊 حاول مرة أخرى";
        message.className = "message error-text";
        speak("حاول مرة أخرى");
    }
}

function speakNumber() { speak(numberWords[currentNumber] || "الرقم " + arabicNumber(currentNumber)); }
function newNumber() { currentNumber = currentNumber >= 100 ? 1 : currentNumber + 1; loadNumber(); }

let addA = 1, addB = 1, additionAnswered = false;
function newAddition() {
    addA = Math.floor(Math.random() * 10) + 1;
    addB = Math.floor(Math.random() * 10) + 1;
    document.getElementById("addQuestion").textContent = arabicNumber(addA) + " + " + arabicNumber(addB) + " = ؟";
    document.getElementById("addPictures").textContent = "🍎".repeat(addA) + " + " + "🍎".repeat(addB);
    document.getElementById("addAnswer").value = "";
    document.getElementById("addMessage").textContent = "";
    additionAnswered = false;
}

function checkAddition() {
    const input = document.getElementById("addAnswer");
    const message = document.getElementById("addMessage");
    if (Number(input.value) === addA + addB) {
        message.textContent = "🎉 أحسنت!";
        message.className = "message success-text";
        if (!additionAnswered) { correctAddition++; addStar(); additionAnswered = true; }
        praise();
    } else {
        message.textContent = "😊 حاول مرة أخرى";
        message.className = "message error-text";
        speak("حاول مرة أخرى");
    }
}

let subA = 5, subB = 2, subtractionAnswered = false;
function newSubtraction() {
    subA = Math.floor(Math.random() * 10) + 1;
    subB = Math.floor(Math.random() * (subA + 1));
    document.getElementById("subQuestion").textContent = arabicNumber(subA) + " - " + arabicNumber(subB) + " = ؟";
    document.getElementById("subPictures").textContent = "🍎".repeat(subA);
    document.getElementById("subAnswer").value = "";
    document.getElementById("subMessage").textContent = "";
    subtractionAnswered = false;
}

function checkSubtraction() {
    const input = document.getElementById("subAnswer");
    const message = document.getElementById("subMessage");
    if (Number(input.value) === subA - subB) {
        message.textContent = "🎉 أحسنت!";
        message.className = "message success-text";
        if (!subtractionAnswered) { correctSubtraction++; addStar(); subtractionAnswered = true; }
        praise();
    } else {
        message.textContent = "😊 حاول مرة أخرى";
        message.className = "message error-text";
        speak("حاول مرة أخرى");
    }
}


/* ==========================================
   📖 القرآن الكريم (بصوت شيخ حقيقي 100%)
========================================== */

const quranSurahs = [
    {
        name: "سورة الإخلاص",
        text: "قُلْ هُوَ اللَّهُ أَحَدٌ\nاللَّهُ الصَّمَدُ\nلَمْ يَلِدْ وَلَمْ يُولَدْ\nوَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
        audio: "https://server11.mp3quran.net/sds/112.mp3"
    },
    {
        name: "سورة الفلق",
        text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ\nمِنْ شَرِّ مَا خَلَقَ\nوَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ\nوَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ\nوَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",
        audio: "https://server11.mp3quran.net/sds/113.mp3"
    },
    {
        name: "سورة الناس",
        text: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ\nمَلِكِ النَّاسِ\nإِلَهِ النَّاسِ\nمِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ\nالَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ\nمِنَ الْجِنَّةِ وَالنَّاسِ",
        audio: "https://server11.mp3quran.net/sds/114.mp3"
    },
    {
        name: "سورة الكوثر",
        text: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ\nفَصَلِّ لِرَبِّكَ وَانْحَرْ\nإِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ",
        audio: "https://server11.mp3quran.net/sds/108.mp3"
    },
    {
        name: "سورة العصر",
        text: "وَالْعَصْرِ\nإِنَّ الْإِنسَانَ لَفِي خُسْرٍ\nإِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ\nوَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ",
        audio: "https://server11.mp3quran.net/sds/103.mp3"
    },
    {
        name: "سورة النصر",
        text: "إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ\nوَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا\nفَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ\nإِنَّهُ كَانَ تَوَّابًا",
        audio: "https://server11.mp3quran.net/sds/110.mp3"
    }
];

let surahIndex = 0;
let currentAudio = null;

function loadSurah() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    const surah = quranSurahs[surahIndex];
    const nameEl = document.getElementById("surahName");
    const textEl = document.getElementById("surahText");
    
    if (nameEl) nameEl.textContent = surah.name;
    if (textEl) textEl.innerHTML = surah.text.replace(/\n/g, "<br><br>");
}

function speakSurah() {
    // إذا كان الصوت يعمل، قم بإيقافه؛ وإذا كان متوقفاً، قم بتشغيله
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        return;
    }

    if (currentAudio) {
        currentAudio.play().catch(function(e) {
            console.log("خطأ إعادة التشغيل:", e);
        });
        return;
    }

    const surah = quranSurahs[surahIndex];
    currentAudio = new Audio(surah.audio);
    
    currentAudio.play().catch(function(error) {
        console.log("تعذر التشغيل المباشر:", error);
        alert("يرجى التأكد من اتصال الإنترنت لتشغيل التلاوة");
    });
}

function nextSurah() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    surahIndex = (surahIndex + 1) % quranSurahs.length;
    loadSurah();
}


/* ==========================================
   الحديث الشريف والأدعية والكتابة والتحكم
========================================== */

const hadiths = [
    { text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ", source: "رواه البخاري ومسلم", image: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80" },
    { text: "الدِّينُ النَّصِيحَةُ", source: "رواه مسلم", image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80" },
    { text: "مَنْ غَشَّ فَلَيْسَ مِنِّي", source: "رواه مسلم", image: "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=800&q=80" },
    { text: "إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ", source: "رواه البخاري ومسلم", image: "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=800&q=80" },
    { text: "كُلُّ مَعْرُوفٍ صَدَقَةٌ", source: "رواه البخاري ومسلم", image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80" }
];

let hadithIndex = 0;
function loadHadith() {
    const h = hadiths[hadithIndex];
    document.getElementById("hadithText").textContent = h.text;
    document.getElementById("hadithSource").textContent = h.source;
    document.getElementById("hadithImage").src = h.image;
}
function speakHadith() { speak(hadiths[hadithIndex].text); }
function nextHadith() { hadithIndex = (hadithIndex + 1) % hadiths.length; loadHadith(); }

const duas = [
    { title: "دعاء قبل الطعام", text: "بِسْمِ اللَّهِ" },
    { title: "دعاء بعد الطعام", text: "الْحَمْدُ لِلَّهِ" },
    { title: "دعاء عند النوم", text: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا" },
    { title: "دعاء الاستيقاظ", text: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ" }
];

let duaIndex = 0;
function loadDua() {
    document.getElementById("duaTitle").textContent = duas[duaIndex].title;
    document.getElementById("duaText").textContent = duas[duaIndex].text;
}
function speakDua() { speak(duas[duaIndex].text); }
function nextDua() { duaIndex = (duaIndex + 1) % duas.length; loadDua(); }

let canvas = null, ctx = null, drawing = false;

function setupCanvas() {
    canvas = document.getElementById("writingCanvas");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx = canvas.getContext("2d");
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);
    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDrawing);
}

function getPosition(event) {
    const rect = canvas.getBoundingClientRect();
    if (event.touches && event.touches.length) {
        return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
    }
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function startDrawing(e) { drawing = true; const p = getPosition(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
function draw(e) { if (!drawing || !ctx) return; e.preventDefault(); const p = getPosition(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }
function stopDrawing() { drawing = false; }
function clearCanvas() { if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); }
function finishWriting() { addStar(); document.getElementById("writingMessage").textContent = "🌟 رائع!"; speak("رائع"); }
function newWritingLetter() { clearCanvas(); speak("حاول كتابة الحرف"); }

function resetProgress() {
    if (!confirm("هل تريد تصفير نتائج الطفل؟")) return;
    stars = 0; level = 1; correctLetters = 0; correctWords = 0; correctNumbers = 0; correctAddition = 0; correctSubtraction = 0;
    updateStats();
    speak("تم تصفير النتائج");
}

window.addEventListener("load", function () {
    loadSpeechVoices();
    updateStats();
    loadLetter();
    loadWord();
    loadNumber();
    newAddition();
    newSubtraction();
    loadSurah();
    loadHadith();
    loadDua();
    setupCanvas();
});
