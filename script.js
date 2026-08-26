/* ==========================================
   🌟 تعلم مع أ/ طه محمد 🌟
   ملف script.js
   نظام النطق العربي الجديد (مُحسّن)
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

    40: "أربعون",
    41: "واحد وأربعون",
    42: "اثنان وأربعون",
    43: "ثلاثة وأربعون",
    44: "أربعة وأربعون",
    45: "خمسة وأربعون",
    46: "ستة وأربعون",
    47: "سبعة وأربعون",
    48: "ثمانية وأربعون",
    49: "تسعة وأربعون",

    50: "خمسون",
    51: "واحد وخمسون",
    52: "اثنان وخمسون",
    53: "ثلاثة وخمسون",
    54: "أربعة وخمسون",
    55: "خمسة وخمسون",
    56: "ستة وخمسون",
    57: "سبعة وخمسون",
    58: "ثمانية وخمسون",
    59: "تسعة وخمسون",

    60: "ستون",
    61: "واحد وستون",
    62: "اثنان وستون",
    63: "ثلاثة وستون",
    64: "أربعة وستون",
    65: "خمسة وستون",
    66: "ستة وستون",
    67: "سبعة وستون",
    68: "ثمانية وستون",
    69: "تسعة وستون",

    70: "سبعون",
    71: "واحد وسبعون",
    72: "اثنان وسبعون",
    73: "ثلاثة وسبعون",
    74: "أربعة وسبعون",
    75: "خمسة وسبعون",
    76: "ستة وسبعون",
    77: "سبعة وسبعون",
    78: "ثمانية وسبعون",
    79: "تسعة وسبعون",

    80: "ثمانون",
    81: "واحد وثمانون",
    82: "اثنان وثمانون",
    83: "ثلاثة وثمانون",
    84: "أربعة وثمانون",
    85: "خمسة وثمانون",
    86: "ستة وثمانون",
    87: "سبعة وثمانون",
    88: "ثمانية وثمانون",
    89: "تسعة وثمانون",

    90: "تسعون",
    91: "واحد وتسعون",
    92: "اثنان وتسعون",
    93: "ثلاثة وتسعون",
    94: "أربعة وتسعون",
    95: "خمسة وتسعون",
    96: "ستة وتسعون",
    97: "سبعة وتسعون",
    98: "ثمانية وتسعون",
    99: "تسعة وتسعون",
    100: "مئة"
};


/* ==========================================
   🔊 نظام النطق العربي الجديد (مُحسّن)
========================================== */

let currentUtterance = null;
let arabicVoice = null;


function findArabicVoice() {
    if (!("speechSynthesis" in window)) {
        return null;
    }

    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
        return null;
    }

    // البحث عن صوت سعودي أولًا
    let voice = voices.find(function (v) {
        return v.lang && v.lang.toLowerCase() === "ar-sa";
    });

    if (voice) {
        return voice;
    }

    // ثم أي صوت عربي آخر
    voice = voices.find(function (v) {
        return v.lang && v.lang.toLowerCase().startsWith("ar");
    });

    return voice || null;
}


function loadSpeechVoices() {
    arabicVoice = findArabicVoice();
}


if ("speechSynthesis" in window) {
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = function () {
            loadSpeechVoices();
        };
    }
    loadSpeechVoices();
}


function speak(text) {
    if (!text) return;

    if (!("speechSynthesis" in window)) {
        alert("المتصفح لا يدعم النطق الصوتي");
        return;
    }

    // تنظيف النص
    const cleanText = String(text).replace(/\n+/g, " ").trim();
    if (!cleanText) return;

    // إيقاف أي نطق سابق مع مهلة قصيرة لاستقرار المتصفح والجوالات
    window.speechSynthesis.cancel();

    setTimeout(function () {
        currentUtterance = new SpeechSynthesisUtterance(cleanText);
        currentUtterance.lang = "ar-SA";
        currentUtterance.rate = 0.85; // سرعة هادئة ومناسبة للأطفال
        currentUtterance.pitch = 1.1;  // نبرة حماسية لطيفة
        currentUtterance.volume = 1;

        // تحديث الصوت إذا لم يكن محملاً مسبقاً
        if (!arabicVoice) {
            arabicVoice = findArabicVoice();
        }

        if (arabicVoice) {
            currentUtterance.voice = arabicVoice;
        }

        currentUtterance.onerror = function (event) {
            console.log("خطأ في النطق:", event.error);
        };

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
        stars: stars,
        level: level,
        rewardStars: stars,
        teacherStars: stars,
        teacherLevel: level,
        teacherLetters: correctLetters,
        teacherWords: correctWords,
        teacherNumbers: correctNumbers,
        teacherAddition: correctAddition,
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
    document.querySelectorAll(".screen").forEach(function (screen) {
        screen.classList.remove("active");
    });

    const screen = document.getElementById(id);
    if (screen) {
        screen.classList.add("active");
    }
}


/* ==========================================
   الحروف
========================================== */

const letters = [
    { letter: "أ", word: "أسد", emoji: "🦁" },
    { letter: "ب", word: "بطة", emoji: "🦆" },
    { letter: "ت", word: "تفاح", emoji: "🍎" },
    { letter: "ث", word: "ثعلب", emoji: "🦊" },
    { letter: "ج", word: "جمل", emoji: "🐪" },
    { letter: "ح", word: "حصان", emoji: "🐎" },
    { letter: "خ", word: "خروف", emoji: "🐑" },
    { letter: "د", word: "دب", emoji: "🐻" },
    { letter: "ذ", word: "ذرة", emoji: "🌽" },
    { letter: "ر", word: "رمان", emoji: "🍎" },
    { letter: "ز", word: "زهرة", emoji: "🌸" },
    { letter: "س", word: "سمكة", emoji: "🐟" },
    { letter: "ش", word: "شمس", emoji: "☀️" },
    { letter: "ص", word: "صقر", emoji: "🦅" },
    { letter: "ض", word: "ضفدع", emoji: "🐸" },
    { letter: "ط", word: "طائرة", emoji: "✈️" },
    { letter: "ظ", word: "ظرف", emoji: "✉️" },
    { letter: "ع", word: "عين", emoji: "👁️" },
    { letter: "غ", word: "غزال", emoji: "🦌" },
    { letter: "ف", word: "فيل", emoji: "🐘" },
    { letter: "ق", word: "قلم", emoji: "✏️" },
    { letter: "ك", word: "كتاب", emoji: "📚" },
    { letter: "ل", word: "ليمون", emoji: "🍋" },
    { letter: "م", word: "موز", emoji: "🍌" },
    { letter: "ن", word: "نحلة", emoji: "🐝" },
    { letter: "هـ", word: "هلال", emoji: "🌙" },
    { letter: "و", word: "وردة", emoji: "🌹" },
    { letter: "ي", word: "يد", emoji: "✋" }
];


const letterFatha = [
    "أَ", "بَ", "تَ", "ثَ", "جَ", "حَ", "خَ", "دَ", "ذَ", "رَ", "زَ", "سَ", "شَ", "صَ", "ضَ", "طَ", "ظَ", "عَ", "غَ", "فَ", "قَ", "كَ", "لَ", "مَ", "نَ", "هَ", "وَ", "يَ"
];


let letterIndex = 0;
let letterAnswered = false;


function loadLetter() {
    const item = letters[letterIndex];

    const currentLetter = document.getElementById("currentLetter");
    if (currentLetter) {
        currentLetter.textContent = item.letter;
    }

    const picture = document.getElementById("letterPicture");
    if (picture) {
        picture.textContent = item.emoji;
    }

    const word = document.getElementById("letterWord");
    if (word) {
        word.textContent = item.word;
    }

    const message = document.getElementById("letterMessage");
    if (message) {
        message.textContent = "";
    }

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
        if (!choices.includes(random)) {
            choices.push(random);
        }
    }

    choices.sort(function () {
        return Math.random() - 0.5;
    });

    choices.forEach(function (answer) {
        const button = document.createElement("button");
        button.className = "option";
        button.textContent = answer;
        button.onclick = function () {
            checkLetter(answer);
        };
        box.appendChild(button);
    });
}


function checkLetter(answer) {
    const message = document.getElementById("letterMessage");
    if (!message) return;

    if (answer === letters[letterIndex].letter) {
        message.textContent = "🎉 أحسنت!";
        message.className = "message success-text";

        if (!letterAnswered) {
            correctLetters++;
            addStar();
            letterAnswered = true;
        }

        praise();
    } else {
        message.textContent = "😊 حاول مرة أخرى";
        message.className = "message error-text";
        speak("حاول مرة أخرى");
    }
}


function speakCurrentLetter() {
    const item = letters[letterIndex];
    speak(letterFatha[letterIndex] + " " + item.word);
}


function nextLetter() {
    letterIndex++;
    if (letterIndex >= letters.length) {
        letterIndex = 0;
    }
    loadLetter();
}


/* ==========================================
   الكلمات
========================================== */

const words = [
    { word: "بيت", emoji: "🏠" },
    { word: "باب", emoji: "🚪" },
    { word: "ماما", emoji: "👩" },
    { word: "بابا", emoji: "👨" },
    { word: "قلم", emoji: "✏️" },
    { word: "كتاب", emoji: "📚" },
    { word: "موز", emoji: "🍌" },
    { word: "تفاح", emoji: "🍎" },
    { word: "ماء", emoji: "💧" },
    { word: "شمس", emoji: "☀️" }
];


let wordIndex = 0;
let wordAnswered = false;


function loadWord() {
    const item = words[wordIndex];

    const currentWord = document.getElementById("currentWord");
    const picture = document.getElementById("wordPicture");
    const message = document.getElementById("wordMessage");

    if (currentWord) {
        currentWord.textContent = item.word;
    }

    if (picture) {
        picture.textContent = item.emoji;
    }

    if (message) {
        message.textContent = "";
    }

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
        if (!choices.includes(random)) {
            choices.push(random);
        }
    }

    choices.sort(function () {
        return Math.random() - 0.5;
    });

    choices.forEach(function (answer) {
        const button = document.createElement("button");
        button.className = "option";
        button.textContent = answer;
        button.onclick = function () {
            checkWord(answer);
        };
        box.appendChild(button);
    });
}


function checkWord(answer) {
    const message = document.getElementById("wordMessage");
    if (!message) return;

    if (answer === words[wordIndex].word) {
        message.textContent = "🎉 أحسنت!";
        message.className = "message success-text";

        if (!wordAnswered) {
            correctWords++;
            addStar();
            wordAnswered = true;
        }

        praise();
    } else {
        message.textContent = "😊 حاول مرة أخرى";
        message.className = "message error-text";
        speak("حاول مرة أخرى");
    }
}


function speakWord() {
    speak(words[wordIndex].word);
}


function nextWord() {
    wordIndex++;
    if (wordIndex >= words.length) {
        wordIndex = 0;
    }
    loadWord();
}


/* ==========================================
   الأرقام
========================================== */

let currentNumber = 1;
let numberAnswered = false;


function loadNumber() {
    const number = document.getElementById("currentNumber");
    const items = document.getElementById("countItems");
    const message = document.getElementById("numberMessage");

    if (number) {
        number.textContent = arabicNumber(currentNumber);
    }

    if (items) {
        if (currentNumber <= 20) {
            items.textContent = "🍎".repeat(currentNumber);
        } else {
            items.textContent = "عدد التفاح: " + arabicNumber(currentNumber);
        }
    }

    if (message) {
        message.textContent = "";
    }

    numberAnswered = false;
    createNumberOptions();
}


function createNumberOptions() {
    const box = document.getElementById("numberOptions");
    if (!box) return;

    box.innerHTML = "";

    let choices = [currentNumber];

    while (choices.length < 3) {
        const random = Math.floor(Math.random() * 100) + 1;
        if (!choices.includes(random)) {
            choices.push(random);
        }
    }

    choices.sort(function () {
        return Math.random() - 0.5;
    });

    choices.forEach(function (answer) {
        const button = document.createElement("button");
        button.className = "option";
        button.textContent = arabicNumber(answer);
        button.onclick = function () {
            checkNumber(answer);
        };
        box.appendChild(button);
    });
}


function checkNumber(answer) {
    const message = document.getElementById("numberMessage");
    if (!message) return;

    if (answer === currentNumber) {
        message.textContent = "🎉 أحسنت!";
        message.className = "message success-text";

        if (!numberAnswered) {
            correctNumbers++;
            addStar();
            numberAnswered = true;
        }

        praise();
    } else {
        message.textContent = "😊 حاول مرة أخرى";
        message.className = "message error-text";
        speak("حاول مرة أخرى");
    }
}


function speakNumber() {
    speak(numberWords[currentNumber] || "الرقم " + arabicNumber(currentNumber));
}


function newNumber() {
    currentNumber++;
    if (currentNumber > 100) {
        currentNumber = 1;
    }
    loadNumber();
}


/* ==========================================
   الجمع
========================================== */

let addA = 1;
let addB = 1;
let additionAnswered = false;


function newAddition() {
    addA = Math.floor(Math.random() * 10) + 1;
    addB = Math.floor(Math.random() * 10) + 1;

    const question = document.getElementById("addQuestion");
    const pictures = document.getElementById("addPictures");
    const answer = document.getElementById("addAnswer");
    const message = document.getElementById("addMessage");

    if (question) {
        question.textContent = arabicNumber(addA) + " + " + arabicNumber(addB) + " = ؟";
    }

    if (pictures) {
        pictures.textContent = "🍎".repeat(addA) + " + " + "🍎".repeat(addB);
    }

    if (answer) {
        answer.value = "";
    }

    if (message) {
        message.textContent = "";
    }

    additionAnswered = false;
}


function checkAddition() {
    const input = document.getElementById("addAnswer");
    const message = document.getElementById("addMessage");

    if (!input || !message) return;

    const answer = Number(input.value);

    if (answer === addA + addB) {
        message.textContent = "🎉 أحسنت!";
        message.className = "message success-text";

        if (!additionAnswered) {
            correctAddition++;
            addStar();
            additionAnswered = true;
        }

        praise();
    } else {
        message.textContent = "😊 حاول مرة أخرى";
        message.className = "message error-text";
        speak("حاول مرة أخرى");
    }
}


/* ==========================================
   الطرح
========================================== */

let subA = 5;
let subB = 2;
let subtractionAnswered = false;


function newSubtraction() {
    subA = Math.floor(Math.random() * 10) + 1;
    subB = Math.floor(Math.random() * (subA + 1));

    const question = document.getElementById("subQuestion");
    const pictures = document.getElementById("subPictures");
    const answer = document.getElementById("subAnswer");
    const message = document.getElementById("subMessage");

    if (question) {
        question.textContent = arabicNumber(subA) + " - " + arabicNumber(subB) + " = ؟";
    }

    if (pictures) {
        pictures.textContent = "🍎".repeat(subA);
    }

    if (answer) {
        answer.value = "";
    }

    if (message) {
        message.textContent = "";
    }

    subtractionAnswered = false;
}


function checkSubtraction() {
    const input = document.getElementById("subAnswer");
    const message = document.getElementById("subMessage");

    if (!input || !message) return;

    const answer = Number(input.value);

    if (answer === subA - subB) {
        message.textContent = "🎉 أحسنت!";
        message.className = "message success-text";

        if (!subtractionAnswered) {
            correctSubtraction++;
            addStar();
            subtractionAnswered = true;
        }

        praise();
    } else {
        message.textContent = "😊 حاول مرة أخرى";
        message.className = "message error-text";
        speak("حاول مرة أخرى");
    }
}


/* ==========================================
   القرآن الكريم
========================================== */

const quranSurahs = [
    {
        name: "سورة الإخلاص",
        text: "قُلْ هُوَ اللَّهُ أَحَدٌ\nاللَّهُ الصَّمَدُ\nلَمْ يَلِدْ وَلَمْ يُولَدْ\nوَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ"
    },
    {
        name: "سورة الفلق",
        text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ\nمِنْ شَرِّ مَا خَلَقَ\nوَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ\nوَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ\nوَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ"
    },
    {
        name: "سورة الناس",
        text: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ\nمَلِكِ النَّاسِ\nإِلَهِ النَّاسِ\nمِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ\nالَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ\nمِنَ الْجِنَّةِ وَالنَّاسِ"
    },
    {
        name: "سورة الكوثر",
        text: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ\nفَصَلِّ لِرَبِّكَ وَانْحَرْ\nإِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ"
    },
    {
        name: "سورة العصر",
        text: "وَالْعَصْرِ\nإِنَّ الْإِنسَانَ لَفِي خُسْرٍ\nإِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ\nوَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ"
    },
    {
        name: "سورة النصر",
        text: "إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ\nوَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا\nفَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ\nإِنَّهُ كَانَ تَوَّابًا"
    }
];


let surahIndex = 0;


function loadSurah() {
    const surah = quranSurahs[surahIndex];
    const name = document.getElementById("surahName");
    const text = document.getElementById("surahText");

    if (name) {
        name.textContent = surah.name;
    }

    if (text) {
        text.innerHTML = surah.text.replace(/\n/g, "<br><br>");
    }
}


function speakSurah() {
    speak(quranSurahs[surahIndex].text);
}


function nextSurah() {
    surahIndex++;
    if (surahIndex >= quranSurahs.length) {
        surahIndex = 0;
    }
    loadSurah();
}


/* ==========================================
   الحديث الشريف
========================================== */

const hadiths = [
    {
        text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
        source: "رواه البخاري ومسلم",
        image: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80"
    },
    {
        text: "الدِّينُ النَّصِيحَةُ",
        source: "رواه مسلم",
        image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80"
    },
    {
        text: "مَنْ غَشَّ فَلَيْسَ مِنِّي",
        source: "رواه مسلم",
        image: "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=800&q=80"
    },
    {
        text: "إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ",
        source: "رواه البخاري ومسلم",
        image: "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=800&q=80"
    },
    {
        text: "كُلُّ مَعْرُوفٍ صَدَقَةٌ",
        source: "رواه البخاري ومسلم",
        image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80"
    },
    {
        text: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
        source: "رواه البخاري ومسلم",
        image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80"
    },
    {
        text: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
        source: "رواه البخاري ومسلم",
        image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=800&q=80"
    },
    {
        text: "مَنْ صَلَّى عَلَيَّ صَلَاةً صَلَّى اللَّهُ عَلَيْهِ بِهَا عَشْرًا",
        source: "رواه مسلم",
        image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80"
    },
    {
        text: "مَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ",
        source: "رواه البخاري",
        image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80"
    },
    {
        text: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ",
        source: "رواه الترمذي",
        image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80"
    }
];


let hadithIndex = 0;


function loadHadith() {
    const hadith = hadiths[hadithIndex];
    const text = document.getElementById("hadithText");
    const source = document.getElementById("hadithSource");
    const image = document.getElementById("hadithImage");

    if (text) {
        text.textContent = hadith.text;
    }

    if (source) {
        source.textContent = hadith.source;
    }

    if (image) {
        image.src = hadith.image;
        image.alt = "صورة توضيحية للحديث";
    }
}


function speakHadith() {
    speak(hadiths[hadithIndex].text);
}


function nextHadith() {
    hadithIndex++;
    if (hadithIndex >= hadiths.length) {
        hadithIndex = 0;
    }
    loadHadith();
}


/* ==========================================
   الأدعية
========================================== */

const duas = [
    { title: "دعاء قبل الطعام", text: "بِسْمِ اللَّهِ" },
    { title: "دعاء بعد الطعام", text: "الْحَمْدُ لِلَّهِ" },
    { title: "دعاء عند النوم", text: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا" },
    { title: "دعاء الاستيقاظ", text: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ" },
    { title: "دعاء دخول المنزل", text: "بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى رَبِّنَا تَوَكَّلْنَا" },
    { title: "دعاء طلب العلم", text: "رَبِّ زِدْنِي عِلْمًا" },
    { title: "دعاء للوالدين", text: "رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا" }
];


let duaIndex = 0;


function loadDua() {
    const dua = duas[duaIndex];
    const title = document.getElementById("duaTitle");
    const text = document.getElementById("duaText");

    if (title) {
        title.textContent = dua.title;
    }

    if (text) {
        text.textContent = dua.text;
    }
}


function speakDua() {
    speak(duas[duaIndex].text);
}


function nextDua() {
    duaIndex++;
    if (duaIndex >= duas.length) {
        duaIndex = 0;
    }
    loadDua();
}


/* ==========================================
   الكتابة
========================================== */

let canvas = null;
let ctx = null;
let drawing = false;


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
        return {
            x: event.touches[0].clientX - rect.left,
            y: event.touches[0].clientY - rect.top
        };
    }

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}


function startDrawing(event) {
    if (!ctx) return;
    drawing = true;
    const position = getPosition(event);
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
}


function draw(event) {
    if (!drawing || !ctx) return;
    event.preventDefault();
    const position = getPosition(event);
    ctx.lineTo(position.x, position.y);
    ctx.stroke();
}


function stopDrawing() {
    drawing = false;
}


function clearCanvas() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}


function finishWriting() {
    addStar();
    const message = document.getElementById("writingMessage");
    if (message) {
        message.textContent = "🌟 رائع!";
        message.className = "message success-text";
    }
    speak("رائع");
}


function newWritingLetter() {
    clearCanvas();
    speak("حاول كتابة الحرف");
}


/* ==========================================
   تصفير النتائج
========================================== */

function resetProgress() {
    const answer = confirm("هل تريد تصفير نتائج الطفل؟");
    if (!answer) return;

    stars = 0;
    level = 1;
    correctLetters = 0;
    correctWords = 0;
    correctNumbers = 0;
    correctAddition = 0;
    correctSubtraction = 0;

    updateStats();
    speak("تم تصفير النتائج");
}


/* ==========================================
   تشغيل التطبيق
========================================== */

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
