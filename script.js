/* ==========================================
   🌟 تعلم مع أ/ طه محمد 🌟
   script.js
   النسخة الكاملة
========================================== */


/* ==========================================
   ⭐ الإحصائيات
========================================== */

let stars = 0;
let level = 1;

let correctLetters = 0;
let correctWords = 0;
let correctNumbers = 0;
let correctAddition = 0;
let correctSubtraction = 0;


/* ==========================================
   🔢 الأرقام العربية
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
   🔢 أسماء الأرقام
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
   🔊 نظام الصوت
========================================== */

let currentUtterance = null;
let arabicVoice = null;
let currentAudio = null;

function findArabicVoice() {

    if (!("speechSynthesis" in window)) {
        return null;
    }

    const voices = window.speechSynthesis.getVoices();

    if (!voices || voices.length === 0) {
        return null;
    }

    let voice = voices.find(function (v) {
        return v.lang &&
            v.lang.toLowerCase() === "ar-sa";
    });

    if (!voice) {
        voice = voices.find(function (v) {
            return v.lang &&
                v.lang.toLowerCase().startsWith("ar");
        });
    }

    return voice || null;
}


function loadSpeechVoices() {

    arabicVoice = findArabicVoice();

}


if ("speechSynthesis" in window) {

    if (window.speechSynthesis.onvoiceschanged !== undefined) {

        window.speechSynthesis.onvoiceschanged =
            loadSpeechVoices;

    }

    loadSpeechVoices();
}


/* ==========================================
   🗣️ النطق الآلي
========================================== */

function speak(text) {

    if (!text) return;

    if (!("speechSynthesis" in window)) return;

    let cleanText = String(text)
        .replace(/[\u064B-\u0652]/g, "")
        .replace(/\n+/g, " ")
        .trim();

    if (!cleanText) return;

    window.speechSynthesis.cancel();

    setTimeout(function () {

        currentUtterance =
            new SpeechSynthesisUtterance(cleanText);

        currentUtterance.lang = "ar-SA";
        currentUtterance.rate = 0.85;
        currentUtterance.pitch = 1;
        currentUtterance.volume = 1;

        if (!arabicVoice) {
            arabicVoice = findArabicVoice();
        }

        if (arabicVoice) {
            currentUtterance.voice = arabicVoice;
        }

        window.speechSynthesis.speak(
            currentUtterance
        );

    }, 50);
}


/* ==========================================
   ⭐ كلمة النجاح
   أصبحت: ممتاز
========================================== */

function praise() {

    speak("ممتاز");

}


/* ==========================================
   ⭐ النجوم والمستوى
========================================== */

function addStar() {

    stars++;

    if (stars % 10 === 0) {

        level++;

        speak("ممتاز، حصلت على مستوى جديد");

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

        const element =
            document.getElementById(id);

        if (!element) return;

        element.textContent =
            arabicNumber(data[id]);

    });

}


/* ==========================================
   🖥️ التنقل بين الشاشات
========================================== */

function showScreen(id) {

    if (currentAudio) {

        currentAudio.pause();
        currentAudio = null;

    }


    document.querySelectorAll(".screen")
        .forEach(function (screen) {

            screen.classList.remove("active");

        });


    const screen =
        document.getElementById(id);

    if (screen) {

        screen.classList.add("active");

    }

}


/* ==========================================
   🔤 بيانات الحروف
========================================== */

const letters = [

    {
        letter: "أ",
        fatha: "أَ",
        word: "أسد",
        emoji: "🦁",
        soundFile: "sound/alif.mp3"
    },

    {
        letter: "ب",
        fatha: "بَ",
        word: "بطة",
        emoji: "🦆",
        soundFile: "sound/baa.mp3"
    },

    {
        letter: "ت",
        fatha: "تَ",
        word: "تفاح",
        emoji: "🍎",
        soundFile: "sound/taa.mp3"
    },

    {
        letter: "ث",
        fatha: "ثَ",
        word: "ثعلب",
        emoji: "🦊",
        soundFile: "sound/thaa.mp3"
    },

    {
        letter: "ج",
        fatha: "جَ",
        word: "جمل",
        emoji: "🐪",
        soundFile: "sound/jeem.mp3"
    },

    {
        letter: "ح",
        fatha: "حَ",
        word: "حصان",
        emoji: "🐎",
        soundFile: "sound/haa.mp3"
    },

    {
        letter: "خ",
        fatha: "خَ",
        word: "خروف",
        emoji: "🐑",
        soundFile: "sound/khaa.mp3"
    },

    {
        letter: "د",
        fatha: "دَ",
        word: "دب",
        emoji: "🐻",
        soundFile: "sound/daal.mp3"
    },

    {
        letter: "ذ",
        fatha: "ذَ",
        word: "ذرة",
        emoji: "🌽",
        soundFile: "sound/thaal.mp3"
    },

    {
        letter: "ر",
        fatha: "رَ",
        word: "رمان",
        emoji: "🍎",
        soundFile: "sound/raa.mp3"
    },

    {
        letter: "ز",
        fatha: "زَ",
        word: "زهرة",
        emoji: "🌸",
        soundFile: "sound/zaay.mp3"
    },

    {
        letter: "س",
        fatha: "سَ",
        word: "سمكة",
        emoji: "🐟",
        soundFile: "sound/seen.mp3"
    },

    {
        letter: "ش",
        fatha: "شَ",
        word: "شمس",
        emoji: "☀️",
        soundFile: "sound/sheen.mp3"
    },

    {
        letter: "ص",
        fatha: "صَ",
        word: "صقر",
        emoji: "🦅",
        soundFile: "sound/saad.mp3"
    },

    {
        letter: "ض",
        fatha: "ضَ",
        word: "ضفدع",
        emoji: "🐸",
        soundFile: "sound/daad.mp3"
    },

    {
        letter: "ط",
        fatha: "طَ",
        word: "طائرة",
        emoji: "✈️",
        soundFile: "sound/taa2.mp3"
    },

    {
        letter: "ظ",
        fatha: "ظَ",
        word: "ظرف",
        emoji: "✉️",
        soundFile: "sound/thaa2.mp3"
    },

    {
        letter: "ع",
        fatha: "عَ",
        word: "عين",
        emoji: "👁️",
        soundFile: "sound/ain.mp3"
    },

    {
        letter: "غ",
        fatha: "غَ",
        word: "غزال",
        emoji: "🦌",
        soundFile: "sound/ghain.mp3"
    },

    {
        letter: "ف",
        fatha: "فَ",
        word: "فيل",
        emoji: "🐘",
        soundFile: "sound/faa.mp3"
    },

    {
        letter: "ق",
        fatha: "قَ",
        word: "قلم",
        emoji: "✏️",
        soundFile: "sound/qaaf.mp3"
    },

    {
        letter: "ك",
        fatha: "كَ",
        word: "كتاب",
        emoji: "📚",
        soundFile: "sound/kaaf.mp3"
    },

    {
        letter: "ل",
        fatha: "لَ",
        word: "ليمون",
        emoji: "🍋",
        soundFile: "sound/laam.mp3"
    },

    {
        letter: "م",
        fatha: "مَ",
        word: "موز",
        emoji: "🍌",
        soundFile: "sound/meem.mp3"
    },

    {
        letter: "ن",
        fatha: "نَ",
        word: "نحلة",
        emoji: "🐝",
        soundFile: "sound/noon.mp3"
    },

    {
        letter: "هـ",
        fatha: "هَ",
        word: "هلال",
        emoji: "🌙",
        soundFile: "sound/haa2.mp3"
    },

    {
        letter: "و",
        fatha: "وَ",
        word: "وردة",
        emoji: "🌹",
        soundFile: "sound/waw.mp3"
    },

    {
        letter: "ي",
        fatha: "يَ",
        word: "يد",
        emoji: "✋",
        soundFile: "sound/yaa.mp3"
    }

];


let letterIndex = 0;
let letterAnswered = false;


/* ==========================================
   🔤 تحميل الحرف
========================================== */

function loadLetter() {

    const item =
        letters[letterIndex];


    const letterEl =
        document.getElementById("currentLetter");

    const pictureEl =
        document.getElementById("letterPicture");

    const wordEl =
        document.getElementById("letterWord");


    if (letterEl) {

        letterEl.textContent =
            item.letter;

    }


    if (pictureEl) {

        pictureEl.textContent =
            item.emoji;

    }


    if (wordEl) {

        wordEl.textContent =
            item.word;

    }


    const message =
        document.getElementById("letterMessage");

    if (message) {

        message.textContent = "";

    }


    letterAnswered = false;


    createLetterOptions();

    renderVerticalLettersList();

}


/* ==========================================
   📋 قائمة الحروف
========================================== */

function renderVerticalLettersList() {

    let container =
        document.getElementById(
            "verticalLettersContainer"
        );


    if (!container) {

        const lettersSection =
            document.getElementById("letters");


        if (lettersSection) {

            container =
                document.createElement("div");

            container.id =
                "verticalLettersContainer";

            container.className =
                "letters-vertical-list";

            lettersSection.appendChild(
                container
            );

        } else {

            return;

        }

    }


    container.innerHTML =
        "<h3>📋 الحروف</h3>";


    letters.forEach(function (item, idx) {

        const row =
            document.createElement("div");


        row.className =
            "letter-row-item";


        row.innerHTML =
            `<span>${item.letter}</span>
             <span>${item.word}</span>
             <span>${item.emoji}</span>
             <span>🔊</span>`;


        row.onclick = function () {

            letterIndex = idx;

            loadLetter();

            speakCurrentLetter();

        };


        container.appendChild(row);

    });

}


/* ==========================================
   🔤 اختيارات الحرف
========================================== */

function createLetterOptions() {

    const box =
        document.getElementById(
            "letterOptions"
        );


    if (!box) return;


    box.innerHTML = "";


    let choices = [
        letters[letterIndex].letter
    ];


    while (choices.length < 3) {

        const random =
            letters[
                Math.floor(
                    Math.random() *
                    letters.length
                )
            ].letter;


        if (!choices.includes(random)) {

            choices.push(random);

        }

    }


    choices.sort(function () {

        return Math.random() - 0.5;

    });


    choices.forEach(function (answer) {

        const button =
            document.createElement("button");


        button.className = "option";

        button.textContent =
            answer;


        button.onclick = function () {

            checkLetter(answer);

        };


        box.appendChild(button);

    });

}


/* ==========================================
   🔤 التحقق من الحرف
========================================== */

function checkLetter(answer) {

    const message =
        document.getElementById(
            "letterMessage"
        );


    if (!message) return;


    if (
        answer ===
        letters[letterIndex].letter
    ) {

        message.textContent =
            "⭐ ممتاز";

        message.className =
            "message success-text";


        if (!letterAnswered) {

            correctLetters++;

            addStar();

            letterAnswered = true;

        }


        praise();


    } else {

        message.textContent =
            "😊 حاول مرة أخرى";

        message.className =
            "message error-text";


        speak("حاول مرة أخرى");

    }

}


/* ==========================================
   🔊 صوت الحرف
========================================== */

function speakCurrentLetter() {

    const item =
        letters[letterIndex];


    /*
       الألف له ملف صوت خاص:
       sound/alif.mp3

       وإذا لم يوجد الملف نستخدم
       النطق الآلي كبديل.
    */


    if (currentAudio) {

        currentAudio.pause();

        currentAudio = null;

    }


    if (item.soundFile) {

        currentAudio =
            new Audio(item.soundFile);


        currentAudio.play()
            .catch(function () {

                speak(item.fatha);

            });


        return;

    }


    speak(item.fatha);

}


/* ==========================================
   ➡️ الحرف التالي
========================================== */

function nextLetter() {

    letterIndex++;

    if (letterIndex >= letters.length) {

        letterIndex = 0;

    }

    loadLetter();

}


/* ==========================================
   📖 الكلمات
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

    const item =
        words[wordIndex];


    if (document.getElementById("currentWord")) {

        document.getElementById(
            "currentWord"
        ).textContent =
            item.word;

    }


    if (document.getElementById("wordPicture")) {

        document.getElementById(
            "wordPicture"
        ).textContent =
            item.emoji;

    }


    if (document.getElementById("wordMessage")) {

        document.getElementById(
            "wordMessage"
        ).textContent = "";

    }


    wordAnswered = false;

    createWordOptions();

}


function createWordOptions() {

    const box =
        document.getElementById(
            "wordOptions"
        );


    if (!box) return;


    box.innerHTML = "";


    let choices = [
        words[wordIndex].word
    ];


    while (choices.length < 3) {

        const random =
            words[
                Math.floor(
                    Math.random() *
                    words.length
                )
            ].word;


        if (!choices.includes(random)) {

            choices.push(random);

        }

    }


    choices.sort(function () {

        return Math.random() - 0.5;

    });


    choices.forEach(function (answer) {

        const button =
            document.createElement("button");

        button.className =
            "option";

        button.textContent =
            answer;


        button.onclick = function () {

            checkWord(answer);

        };


        box.appendChild(button);

    });

}


function checkWord(answer) {

    const message =
        document.getElementById(
            "wordMessage"
        );


    if (!message) return;


    if (answer === words[wordIndex].word) {

        message.textContent =
            "⭐ ممتاز";

        message.className =
            "message success-text";


        if (!wordAnswered) {

            correctWords++;

            addStar();

            wordAnswered = true;

        }


        praise();


    } else {

        message.textContent =
            "😊 حاول مرة أخرى";

        message.className =
            "message error-text";

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
   🔢 الأرقام
========================================== */

let currentNumber = 1;
let numberAnswered = false;


function loadNumber() {

    if (document.getElementById("currentNumber")) {

        document.getElementById(
            "currentNumber"
        ).textContent =
            arabicNumber(currentNumber);

    }


    if (document.getElementById("countItems")) {

        document.getElementById(
            "countItems"
        ).textContent =
            currentNumber <= 20
                ? "🍎".repeat(currentNumber)
                : "عدد التفاح: " +
                  arabicNumber(currentNumber);

    }


    if (document.getElementById("numberMessage")) {

        document.getElementById(
            "numberMessage"
        ).textContent = "";

    }


    numberAnswered = false;

    createNumberOptions();

}


function createNumberOptions() {

    const box =
        document.getElementById(
            "numberOptions"
        );


    if (!box) return;


    box.innerHTML = "";


    let choices = [
        currentNumber
    ];


    while (choices.length < 3) {

        const random =
            Math.floor(
                Math.random() * 100
            ) + 1;


        if (!choices.includes(random)) {

            choices.push(random);

        }

    }


    choices.sort(function () {

        return Math.random() - 0.5;

    });


    choices.forEach(function (answer) {

        const button =
            document.createElement("button");

        button.className =
            "option";

        button.textContent =
            arabicNumber(answer);


        button.onclick = function () {

            checkNumber(answer);

        };


        box.appendChild(button);

    });

}


function checkNumber(answer) {

    const message =
        document.getElementById(
            "numberMessage"
        );


    if (!message) return;


    if (answer === currentNumber) {

        message.textContent =
            "⭐ ممتاز";

        message.className =
            "message success-text";


        if (!numberAnswered) {

            correctNumbers++;

            addStar();

            numberAnswered = true;

        }


        praise();


    } else {

        message.textContent =
            "😊 حاول مرة أخرى";

        message.className =
            "message error-text";

        speak("حاول مرة أخرى");

    }

}


function speakNumber() {

    speak(
        numberWords[currentNumber] ||
        "الرقم " +
        arabicNumber(currentNumber)
    );

}


function newNumber() {

    currentNumber++;

    if (currentNumber > 100) {

        currentNumber = 1;

    }

    loadNumber();

}


/* ==========================================
   ➕ الجمع
========================================== */

let addA = 1;
let addB = 1;
let additionAnswered = false;


function newAddition() {

    addA =
        Math.floor(
            Math.random() * 10
        ) + 1;


    addB =
        Math.floor(
            Math.random() * 10
        ) + 1;


    if (document.getElementById("addQuestion")) {

        document.getElementById(
            "addQuestion"
        ).textContent =
            arabicNumber(addA) +
            " + " +
            arabicNumber(addB) +
            " = ؟";

    }


    if (document.getElementById("addPictures")) {

        document.getElementById(
            "addPictures"
        ).textContent =
            "🍎".repeat(addA) +
            " + " +
            "🍎".repeat(addB);

    }


    if (document.getElementById("addAnswer")) {

        document.getElementById(
            "addAnswer"
        ).value = "";

    }


    if (document.getElementById("addMessage")) {

        document.getElementById(
            "addMessage"
        ).textContent = "";

    }


    additionAnswered = false;

}


function checkAddition() {

    const input =
        document.getElementById(
            "addAnswer"
        );

    const message =
        document.getElementById(
            "addMessage"
        );


    if (!input || !message) return;


    if (
        Number(input.value) ===
        addA + addB
    ) {

        message.textContent =
            "⭐ ممتاز";

        message.className =
            "message success-text";


        if (!additionAnswered) {

            correctAddition++;

            addStar();

            additionAnswered = true;

        }


        praise();


    } else {

        message.textContent =
            "😊 حاول مرة أخرى";

        message.className =
            "message error-text";

        speak("حاول مرة أخرى");

    }

}


/* ==========================================
   ➖ الطرح
========================================== */

let subA = 5;
let subB = 2;
let subtractionAnswered = false;


function newSubtraction() {

    subA =
        Math.floor(
            Math.random() * 10
        ) + 1;


    subB =
        Math.floor(
            Math.random() * (subA + 1)
        );


    if (document.getElementById("subQuestion")) {

        document.getElementById(
            "subQuestion"
        ).textContent =
            arabicNumber(subA) +
            " - " +
            arabicNumber(subB) +
            " = ؟";

    }


    if (document.getElementById("subPictures")) {

        document.getElementById(
            "subPictures"
        ).textContent =
            "🍎".repeat(subA);

    }


    if (document.getElementById("subAnswer")) {

        document.getElementById(
            "subAnswer"
        ).value = "";

    }


    if (document.getElementById("subMessage")) {

        document.getElementById(
            "subMessage"
        ).textContent = "";

    }


    subtractionAnswered = false;

}


function checkSubtraction() {

    const input =
        document.getElementById(
            "subAnswer"
        );

    const message =
        document.getElementById(
            "subMessage"
        );


    if (!input || !message) return;


    if (
        Number(input.value) ===
        subA - subB
    ) {

        message.textContent =
            "⭐ ممتاز";

        message.className =
            "message success-text";


        if (!subtractionAnswered) {

            correctSubtraction++;

            addStar();

            subtractionAnswered = true;

        }


        praise();


    } else {

        message.textContent =
            "😊 حاول مرة أخرى";

        message.className =
            "message error-text";

        speak("حاول مرة أخرى");

    }

}


/* ==========================================
   📖 القرآن الكريم
========================================== */

const quranSurahs = [

    {
        name: "سورة الإخلاص",

        text:
            "قُلْ هُوَ اللَّهُ أَحَدٌ\n" +
            "اللَّهُ الصَّمَدُ\n" +
            "لَمْ يَلِدْ وَلَمْ يُولَدْ\n" +
            "وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",

        audio:
            "https://server11.mp3quran.net/sds/112.mp3"
    },

    {
        name: "سورة الفلق",

        text:
            "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ\n" +
            "مِنْ شَرِّ مَا خَلَقَ\n" +
            "وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ\n" +
            "وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ\n" +
            "وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",

        audio:
            "https://server11.mp3quran.net/sds/113.mp3"
    },

    {
        name: "سورة الناس",

        text:
            "قُلْ أَعُوذُ بِرَبِّ النَّاسِ\n" +
            "مَلِكِ النَّاسِ\n" +
            "إِلَهِ النَّاسِ\n" +
            "مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ\n" +
            "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ\n" +
            "مِنَ الْجِنَّةِ وَالنَّاسِ",

        audio:
            "https://server11.mp3quran.net/sds/114.mp3"
    }

];


let surahIndex = 0;


function loadSurah() {

    if (currentAudio) {

        currentAudio.pause();

        currentAudio = null;

    }


    const surah =
        quranSurahs[surahIndex];


    if (document.getElementById("surahName")) {

        document.getElementById(
            "surahName"
        ).textContent =
            surah.name;

    }


    if (document.getElementById("surahText")) {

        document.getElementById(
            "surahText"
        ).innerHTML =
            surah.text.replace(
                /\n/g,
                "<br><br>"
            );

    }

}


function speakSurah() {

    if (
        currentAudio &&
        !currentAudio.paused
    ) {

        currentAudio.pause();

        return;

    }


    if (currentAudio) {

        currentAudio.play();

        return;

    }


    currentAudio =
        new Audio(
            quranSurahs[
                surahIndex
            ].audio
        );


    currentAudio.play()
        .catch(function () {

            alert(
                "تأكد من اتصال الإنترنت"
            );

        });

}


function nextSurah() {

    if (currentAudio) {

        currentAudio.pause();

        currentAudio = null;

    }


    surahIndex++;


    if (
        surahIndex >=
        quranSurahs.length
    ) {

        surahIndex = 0;

    }


    loadSurah();

}


/* ==========================================
   📜 الحديث الشريف
========================================== */

const hadiths = [

    {
        text:
            "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",

        source:
            "رواه البخاري ومسلم",

        image: ""
    }

];


let hadithIndex = 0;


function loadHadith() {

    const hadith =
        hadiths[hadithIndex];


    if (document.getElementById("hadithText")) {

        document.getElementById(
            "hadithText"
        ).textContent =
            hadith.text;

    }


    if (document.getElementById("hadithSource")) {

        document.getElementById(
            "hadithSource"
        ).textContent =
            hadith.source;

    }

}


function speakHadith() {

    speak(
        hadiths[
            hadithIndex
        ].text
    );

}


function nextHadith() {

    hadithIndex++;


    if (
        hadithIndex >=
        hadiths.length
    ) {

        hadithIndex = 0;

    }


    loadHadith();

}


/* ==========================================
   🤲 الأدعية
========================================== */

const duas = [

    {
        title:
            "دعاء قبل الطعام",

        text:
            "بِسْمِ اللَّهِ"
    }

];


let duaIndex = 0;


function loadDua() {

    const dua =
        duas[duaIndex];


    if (document.getElementById("duaTitle")) {

        document.getElementById(
            "duaTitle"
        ).textContent =
            dua.title;

    }


    if (document.getElementById("duaText")) {

        document.getElementById(
            "duaText"
        ).textContent =
            dua.text;

    }

}


function speakDua() {

    speak(
        duas[
            duaIndex
        ].text
    );

}


function nextDua() {

    duaIndex++;


    if (
        duaIndex >=
        duas.length
    ) {

        duaIndex = 0;

    }


    loadDua();

}


/* ==========================================
   ✍️ الكتابة
========================================== */

let canvas = null;
let ctx = null;
let drawing = false;


function setupCanvas() {

    canvas =
        document.getElementById(
            "writingCanvas"
        );


    if (!canvas) return;


    const rect =
        canvas.getBoundingClientRect();


    canvas.width =
        rect.width || 300;


    canvas.height =
        rect.height || 150;


    ctx =
        canvas.getContext("2d");


    ctx.lineWidth = 8;

    ctx.lineCap = "round";


    canvas.addEventListener(
        "mousedown",
        startDrawing
    );

    canvas.addEventListener(
        "mousemove",
        draw
    );

    canvas.addEventListener(
        "mouseup",
        stopDrawing
    );


    canvas.addEventListener(
        "mouseleave",
        stopDrawing
    );


    canvas.addEventListener(
        "touchstart",
        startDrawing,
        { passive: false }
    );

    canvas.addEventListener(
        "touchmove",
        draw,
        { passive: false }
    );

    canvas.addEventListener(
        "touchend",
        stopDrawing
    );

}


function getPosition(e) {

    const rect =
        canvas.getBoundingClientRect();


    let clientX =
        e.touches
            ? e.touches[0].clientX
            : e.clientX;


    let clientY =
        e.touches
            ? e.touches[0].clientY
            : e.clientY;


    return {

        x:
            clientX -
            rect.left,

        y:
            clientY -
            rect.top

    };

}


function startDrawing(e) {

    drawing = true;


    const p =
        getPosition(e);


    ctx.beginPath();

    ctx.moveTo(
        p.x,
        p.y
    );

}


function draw(e) {

    if (!drawing || !ctx) return;


    e.preventDefault();


    const p =
        getPosition(e);


    ctx.lineTo(
        p.x,
        p.y
    );


    ctx.stroke();

}


function stopDrawing() {

    drawing = false;

}


function clearCanvas() {

    if (!ctx) return;


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

}


function finishWriting() {

    addStar();


    if (
        document.getElementById(
            "writingMessage"
        )
    ) {

        document.getElementById(
            "writingMessage"
        ).textContent =
            "⭐ ممتاز";

    }


    praise();

}


function newWritingLetter() {

    clearCanvas();

    speak(
        "حاول كتابة الحرف"
    );

}


/* ==========================================
   🏆 نظام بطل الحرف
========================================== */

const letterGameProgress = {

    alif: {

        completed: 0,

        total: 13,

        badgeEarned: false

    }

};


function completeLetterGame(gameNumber) {

    const progress =
        letterGameProgress.alif;


    if (
        progress.completed <
        progress.total
    ) {

        progress.completed++;

        addStar();

    }


    if (
        progress.completed >=
        progress.total &&
        !progress.badgeEarned
    ) {

        progress.badgeEarned = true;

        showLetterChampion();

    }

}


function showLetterChampion() {

    const message =
        document.getElementById(
            "letterChampionMessage"
        );


    if (message) {

        message.innerHTML =
            "🏅 بطل حرف الألف!<br>⭐ ممتاز! لقد أكملت الألعاب الـ١٣";

    }


    speak(
        "ممتاز، أنت بطل حرف الألف"
    );

}


/* ==========================================
   🎮 محرك ألعاب الحروف
========================================== */

const MiniGamesEngine = {

    currentLetter: "أ",

    currentWord: "أسد",

    currentEmoji: "🦁",


    setLetter: function (letterData) {

        this.currentLetter =
            letterData.letter;

        this.currentWord =
            letterData.word;

        this.currentEmoji =
            letterData.emoji;

    },


    success: function (gameNumber) {

        completeLetterGame(
            gameNumber
        );

    },


    speakLetter: function () {

        speak(
            this.currentLetter
        );

    },


    speakFatha: function () {

        speak(
            this.currentLetter +
            "َ"
        );

    },


    speakWord: function () {

        speak(
            this.currentWord
        );

    }

};


/* ==========================================
   🔤 إعداد حرف الألف للمحرك
========================================== */

function setupAlifGameEngine() {

    MiniGamesEngine.setLetter(
        letters[0]
    );

}


/* ==========================================
   🧩 اللعبة 1
   اختيار حرف الألف
========================================== */

function alifGame1(answer) {

    if (answer === "أ") {

        MiniGamesEngine.success(1);

        praise();

        return true;

    }


    speak("حاول مرة أخرى");

    return false;

}


/* ==========================================
   🔊 اللعبة 2
   اختيار الصوت الصحيح
========================================== */

function alifGame2(answer) {

    if (answer === "أَ") {

        MiniGamesEngine.success(2);

        praise();

        return true;

    }


    speak("حاول مرة أخرى");

    return false;

}


/* ==========================================
   🦁 اللعبة 3
   صورة الأسد
========================================== */

function alifGame3(answer) {

    if (
        answer === "أسد" ||
        answer === "🦁"
    ) {

        MiniGamesEngine.success(3);

        praise();

        return true;

    }


    speak("حاول مرة أخرى");

    return false;

}


/* ==========================================
   🔤 اللعبة 4
   حرف الألف في بداية الكلمة
========================================== */

function alifGame4(answer) {

    if (
        answer === "بداية" ||
        answer === "أول"
    ) {

        MiniGamesEngine.success(4);

        praise();

        return true;

    }


    speak("حاول مرة أخرى");

    return false;

}


/* ==========================================
   🔤 اللعبة 5
   صيد حرف الألف
========================================== */

function alifGame5(answer) {

    if (answer === "أ") {

        MiniGamesEngine.success(5);

        praise();

        return true;

    }


    speak("حاول مرة أخرى");

    return false;

}


/* ==========================================
   🧩 اللعبة 6
   البازل
========================================== */

function alifGame6(answer) {

    if (answer === "أ") {

        MiniGamesEngine.success(6);

        praise();

        return true;

    }


    speak("حاول مرة أخرى");

    return false;

}


/* ==========================================
   🏖️ اللعبة 7
   الرمل
========================================== */

function alifGame7(answer) {

    if (answer === "أ") {

        MiniGamesEngine.success(7);

        praise();

        return true;

    }


    speak("حاول مرة أخرى");

    return false;

}


/* ==========================================
   🎨 اللعبة 8
   تلوين الحرف
========================================== */

function alifGame8(answer) {

    if (answer === "أ") {

        MiniGamesEngine.success(8);

        praise();

        return true;

    }


    speak("حاول مرة أخرى");

    return false;

}


/* ==========================================
   🦁 اللعبة 9
   تلوين الكلمة
========================================== */

function alifGame9(answer) {

    if (answer === "أسد") {

        MiniGamesEngine.success(9);

        praise();

        return true;

    }


    speak("حاول مرة أخرى");

    return false;

}


/* ==========================================
   🔎 اللعبة 10
   أين حرف الألف؟
========================================== */

function alifGame10(answer) {

    if (answer === "أ") {

        MiniGamesEngine.success(10);

        praise();

        return true;

    }


    speak("حاول مرة أخرى");

    return false;

}


/* ==========================================
   🧠 اللعبة 11
   مطابقة الحرف بالصورة
========================================== */

function alifGame11(answer) {

    if (
        answer === "أسد" ||
        answer === "🦁"
    ) {

        MiniGamesEngine.success(11);

        praise();

        return true;

    }


    speak("حاول مرة أخرى");

    return false;

}


/* ==========================================
   👂 اللعبة 12
   اسمع واختر
========================================== */

function alifGame12(answer) {

    if (
        answer === "أ" ||
        answer === "أَ"
    ) {

        MiniGamesEngine.success(12);

        praise();

        return true;

    }


    speak("حاول مرة أخرى");

    return false;

}


/* ==========================================
   🏆 اللعبة 13
   الاختبار النهائي
========================================== */

function alifGame13(answer) {

    if (answer === "أ") {

        MiniGamesEngine.success(13);

        praise();

        return true;

    }


    speak("حاول مرة أخرى");

    return false;

}


/* ==========================================
   🔄 إعادة ألعاب الألف
========================================== */

function resetAlifGames() {

    letterGameProgress.alif.completed = 0;

    letterGameProgress.alif.badgeEarned = false;


    const message =
        document.getElementById(
            "letterChampionMessage"
        );


    if (message) {

        message.textContent = "";

    }

}


/* ==========================================
   🗑️ تصفير النتائج
========================================== */

function resetProgress() {

    if (
        !confirm(
            "هل تريد تصفير نتائج الطفل؟"
        )
    ) {

        return;

    }


    stars = 0;

    level = 1;

    correctLetters = 0;

    correctWords = 0;

    correctNumbers = 0;

    correctAddition = 0;

    correctSubtraction = 0;


    resetAlifGames();


    updateStats();


    speak(
        "تم تصفير النتائج"
    );

}


/* ==========================================
   🚀 تشغيل التطبيق
========================================== */

window.addEventListener(
    "load",
    function () {

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

        setupAlifGameEngine();

    }
);
