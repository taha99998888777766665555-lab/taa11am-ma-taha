/* ==========================================
   🌟 تعلم مع أ/ طه محمد 🌟
   ملف script.js (النسخة النهائية والمحدثة للألعاب وترتيب الحروف)
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
   🔊 نظام النطق الآلي والصوتي
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
   التنقل بين الشاشات
========================================== */

function showScreen(id) {
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
   🔤 الحروف والكلمات (مع جعل الحروف تحت بعضها والألعاب الـ 13)
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
    const letterEl = document.getElementById("currentLetter");
    const pictureEl = document.getElementById("letterPicture");
    const wordEl = document.getElementById("letterWord");
    
    if (letterEl) letterEl.textContent = item.letter;
    if (pictureEl) pictureEl.textContent = item.emoji;
    if (wordEl) wordEl.textContent = item.word;
    
    const message = document.getElementById("letterMessage");
    if (message) message.textContent = "";
    letterAnswered = false;
    createLetterOptions();
    renderVerticalLettersList();
}

// دالة لجعل الحروف تظهر تحت بعضها بشكل مرتب واحترافي
function renderVerticalLettersList() {
    let container = document.getElementById("verticalLettersContainer");
    if (!container) {
        // إنشاء الحاوية تلقائياً إذا لم تكن موجودة في الـ HTML
        const lettersSection = document.getElementById("letters");
        if (lettersSection) {
            container = document.createElement("div");
            container.id = "verticalLettersContainer";
            container.className = "letters-vertical-list";
            lettersSection.appendChild(container);
        } else {
            return;
        }
    }
    
    container.innerHTML = "<h3>📋 قائمة الحروف مرتبة:</h3>";
    letters.forEach(function(item, idx) {
        const row = document.createElement("div");
        row.className = "letter-row-item";
        row.innerHTML = `<span>${item.letter} - ${item.word} ${item.emoji}</span> 🔊`;
        row.onclick = function() {
            letterIndex = idx;
            loadLetter();
            speakCurrentLetter();
        };
        container.appendChild(row);
    });
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
    if (!message) return;
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

function speakCurrentLetter() {
    // تشغيل ملف الصوت الخاص بك إذا وجد، وإلا نطق آلي احتياطي
    let customAudio = new Audio('sound/alif.mp3');
    customAudio.play().catch(function() {
        speak(letters[letterIndex].sound);
    });
}

function nextLetter() { 
    letterIndex = (letterIndex + 1) % letters.length; 
    loadLetter(); 
}


/* ==========================================
   📖 الكلمات والأرقام والألعاب التفاعلية
========================================== */

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
    if (document.getElementById("currentWord")) document.getElementById("currentWord").textContent = item.word;
    if (document.getElementById("wordPicture")) document.getElementById("wordPicture").textContent = item.emoji;
    if (document.getElementById("wordMessage")) document.getElementById("wordMessage").textContent = "";
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
    if (!message) return;
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
    if (document.getElementById("currentNumber")) document.getElementById("currentNumber").textContent = arabicNumber(currentNumber);
    if (document.getElementById("countItems")) document.getElementById("countItems").textContent = currentNumber <= 20 ? "🍎".repeat(currentNumber) : "عدد التفاح: " + arabicNumber(currentNumber);
    if (document.getElementById("numberMessage")) document.getElementById("numberMessage").textContent = "";
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
    if (!message) return;
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
    if (document.getElementById("addQuestion")) document.getElementById("addQuestion").textContent = arabicNumber(addA) + " + " + arabicNumber(addB) + " = ؟";
    if (document.getElementById("addPictures")) document.getElementById("addPictures").textContent = "🍎".repeat(addA) + " + " + "🍎".repeat(addB);
    if (document.getElementById("addAnswer")) document.getElementById("addAnswer").value = "";
    if (document.getElementById("addMessage")) document.getElementById("addMessage").textContent = "";
    additionAnswered = false;
}

function checkAddition() {
    const input = document.getElementById("addAnswer");
    const message = document.getElementById("addMessage");
    if (!input || !message) return;
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
    if (document.getElementById("subQuestion")) document.getElementById("subQuestion").textContent = arabicNumber(subA) + " - " + arabicNumber(subB) + " = ؟";
    if (document.getElementById("subPictures")) document.getElementById("subPictures").textContent = "🍎".repeat(subA);
    if (document.getElementById("subAnswer")) document.getElementById("subAnswer").value = "";
    if (document.getElementById("subMessage")) document.getElementById("subMessage").textContent = "";
    subtractionAnswered = false;
}

function checkSubtraction() {
    const input = document.getElementById("subAnswer");
    const message = document.getElementById("subMessage");
    if (!input || !message) return;
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
   📖 القرآن الكريم والحديث والأدعية والتحكم
========================================== */

const quranSurahs = [
    { name: "سورة الإخلاص", text: "قُلْ هُوَ اللَّهُ أَحَدٌ\nاللَّهُ الصَّمَدُ\nلَمْ يَلِدْ وَلَمْ يُولَدْ\nوَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ", audio: "https://server11.mp3quran.net/sds/112.mp3" },
    { name: "سورة الفلق", text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ\nمِنْ شَرِّ مَا خَلَقَ\nوَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ\nوَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ\nوَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ", audio: "https://server11.mp3quran.net/sds/113.mp3" },
    { name: "سورة الناس", text: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ\nمَلِكِ النَّاسِ\nإِلَهِ النَّاسِ\nمِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ\nالَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ\nمِنَ الْجِنَّةِ وَالنَّاسِ", audio: "https://server11.mp3quran.net/sds/114.mp3" }
];

let surahIndex = 0;
let currentAudio = null;

function loadSurah() {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    const surah = quranSurahs[surahIndex];
    if (document.getElementById("surahName")) document.getElementById("surahName").textContent = surah.name;
    if (document.getElementById("surahText")) document.getElementById("surahText").innerHTML = surah.text.replace(/\n/g, "<br><br>");
}

function speakSurah() {
    if (currentAudio && !currentAudio.paused) { currentAudio.pause(); return; }
    if (currentAudio) { currentAudio.play(); return; }
    currentAudio = new Audio(quranSurahs[surahIndex].audio);
    currentAudio.play().catch(function() { alert("تأكد من اتصال الإنترنت"); });
}

function nextSurah() {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    surahIndex = (surahIndex + 1) % quranSurahs.length;
    loadSurah();
}

const hadiths = [
    { text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ", source: "رواه البخاري ومسلم", image: "" }
];
let hadithIndex = 0;
function loadHadith() {
    if (document.getElementById("hadithText")) document.getElementById("hadithText").textContent = hadiths[hadithIndex].text;
    if (document.getElementById("hadithSource")) document.getElementById("hadithSource").textContent = hadiths[hadithIndex].source;
}
function speakHadith() { speak(hadiths[hadithIndex].text); }
function nextHadith() { hadithIndex = (hadithIndex + 1) % hadiths.length; loadHadith(); }

const duas = [{ title: "دعاء قبل الطعام", text: "بِسْمِ اللَّهِ" }];
let duaIndex = 0;
function loadDua() {
    if (document.getElementById("duaTitle")) document.getElementById("duaTitle").textContent = duas[duaIndex].title;
    if (document.getElementById("duaText")) document.getElementById("duaText").textContent = duas[duaIndex].text;
}
function speakDua() { speak(duas[duaIndex].text); }
function nextDua() { duaIndex = (duaIndex + 1) % duas.length; loadDua(); }

let canvas = null, ctx = null, drawing = false;
function setupCanvas() {
    canvas = document.getElementById("writingCanvas");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 300;
    canvas.height = rect.height || 150;
    ctx = canvas.getContext("2d");
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDrawing);
}

function getPosition(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function startDrawing(e) { drawing = true; const p = getPosition(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
function draw(e) { if (!drawing || !ctx) return; e.preventDefault(); const p = getPosition(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }
function stopDrawing() { drawing = false; }
function clearCanvas() { if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); }
function finishWriting() { addStar(); if(document.getElementById("writingMessage")) document.getElementById("writingMessage").textContent = "🌟 رائع!"; speak("رائع"); }
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
