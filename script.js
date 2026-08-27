/* ==========================================
   🌟 تعلم مع أ/ طه محمد 🌟
   script.js
   النسخة الكاملة النهائية المتوافقة مع index.html
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
   🔊 نظام الصوت
========================================== */

let currentUtterance = null;
let arabicVoice = null;
let currentAudio = null;

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
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    let cleanText = String(text)
        .replace(/[\u064B-\u0652]/g, "")
        .replace(/\n+/g, " ")
        .trim();

    if (!cleanText) return;

    setTimeout(function () {
        currentUtterance = new SpeechSynthesisUtterance(cleanText);
        currentUtterance.lang = "ar-SA";
        currentUtterance.rate = 0.85;
        currentUtterance.pitch = 1;
        currentUtterance.volume = 1;

        if (!arabicVoice) arabicVoice = findArabicVoice();
        if (arabicVoice) currentUtterance.voice = arabicVoice;

        window.speechSynthesis.speak(currentUtterance);
    }, 50);
}


/* ==========================================
   ⭐ كلمة النجاح وإضافة النجوم
========================================== */

function praise() {
    speak("ممتاز");
}

function addStar() {
    stars++;
    if (stars % 10 === 0) {
        level++;
        speak("مستوى جديد");
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
   التنقل بين الشاشات
========================================== */

function showScreen(id) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }

    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }

    document.querySelectorAll(".screen").forEach(function (screen) {
        screen.classList.remove("active");
    });

    const screen = document.getElementById(id);
    if (screen) screen.classList.add("active");

    if (id === "letters") renderLettersList();
    if (id === "letterLesson") updateLetterLesson();
}


/* ==========================================
   🔤 بيانات الحروف
========================================== */

const letters = [
    { letter: "أ", sound: "أَ", word: "أَسَد", picture: "🦁", audio: "sound/alif.mp3" },
    { letter: "ب", sound: "بَ", word: "بَطَّة", picture: "🦆", audio: "" },
    { letter: "ت", sound: "تَ", word: "تُفَّاح", picture: "🍎", audio: "" },
    { letter: "ث", sound: "ثَ", word: "ثَعْلَب", picture: "🦊", audio: "" },
    { letter: "ج", sound: "جَ", word: "جَمَل", picture: "🐪", audio: "" },
    { letter: "ح", sound: "حَ", word: "حِصَان", picture: "🐎", audio: "" },
    { letter: "خ", sound: "خَ", word: "خَرُوف", picture: "🐑", audio: "" },
    { letter: "د", sound: "دَ", word: "دُب", picture: "🐻", audio: "" },
    { letter: "ذ", sound: "ذَ", word: "ذُرَة", picture: "🌽", audio: "" },
    { letter: "ر", sound: "رَ", word: "رُمَّان", picture: "🍎", audio: "" },
    { letter: "ز", sound: "زَ", word: "زَهْرَة", picture: "🌸", audio: "" },
    { letter: "س", sound: "سَ", word: "سَمَكَة", picture: "🐟", audio: "" },
    { letter: "ش", sound: "شَ", word: "شَمْس", picture: "☀️", audio: "" },
    { letter: "ص", sound: "صَ", word: "صَقْر", picture: "🦅", audio: "" },
    { letter: "ض", sound: "ضَ", word: "ضِفْدَع", picture: "🐸", audio: "" },
    { letter: "ط", sound: "طَ", word: "طَائِرَة", picture: "✈️", audio: "" },
    { letter: "ظ", sound: "ظَ", word: "ظَرْف", picture: "✉️", audio: "" },
    { letter: "ع", sound: "عَ", word: "عَيْن", picture: "👁️", audio: "" },
    { letter: "غ", sound: "غَ", word: "غَزَال", picture: "🦌", audio: "" },
    { letter: "ف", sound: "فَ", word: "فِيل", picture: "🐘", audio: "" },
    { letter: "ق", sound: "قَ", word: "قَلَم", picture: "✏️", audio: "" },
    { letter: "ك", sound: "كَ", word: "كِتَاب", picture: "📚", audio: "" },
    { letter: "ل", sound: "لَ", word: "لَيْمُون", picture: "🍋", audio: "" },
    { letter: "م", sound: "مَ", word: "مَوْز", picture: "🍌", audio: "" },
    { letter: "ن", sound: "نَ", word: "نَحْلَة", picture: "🐝", audio: "" },
    { letter: "هـ", sound: "هَ", word: "هِلَال", picture: "🌙", audio: "" },
    { letter: "و", sound: "وَ", word: "وَرْدَة", picture: "🌹", audio: "" },
    { letter: "ي", sound: "يَ", word: "يَد", picture: "✋", audio: "" }
];


/* ==========================================
   🔤 قائمة الحروف الرئيسية
========================================== */

let selectedLetterIndex = 0;

function renderLettersList() {
    const container = document.getElementById("lettersList");
    if (!container) return;
    container.innerHTML = "";

    letters.forEach(function (item, index) {
        const button = document.createElement("button");
        button.className = "letter-row-item";
        button.innerHTML = `<span>${item.letter}<small>${item.word}</small></span><span>${item.picture}</span>`;
        button.onclick = function () {
            selectedLetterIndex = index;
            openLetterLesson(index);
        };
        container.appendChild(button);
    });
}

function openLetterLesson(index) {
    selectedLetterIndex = index;
    showScreen("letterLesson");
    startLetterGames();
}

function getCurrentLetter() {
    return letters[selectedLetterIndex];
}

function updateLetterLesson() {
    const item = getCurrentLetter();
    const title = document.getElementById("lessonTitle");
    const letter = document.getElementById("lessonLetter");
    const sound = document.getElementById("lessonSound");
    const picture = document.getElementById("lessonPicture");
    const word = document.getElementById("lessonWord");

    if (title) title.textContent = "🌟 حرف " + item.letter + " 🌟";
    if (letter) letter.textContent = item.letter;
    if (sound) sound.textContent = item.sound;
    if (picture) picture.textContent = item.picture;
    if (word) word.textContent = item.word;
}

function speakLessonSound() {
    const item = getCurrentLetter();
    if (item.audio) {
        const audio = new Audio(item.audio);
        audio.currentTime = 0;
        audio.play().catch(function () {
            speak(item.sound);
        });
        return;
    }
    speak(item.sound);
}


/* ==========================================
   🎮 محرك الألعاب الـ 13 للحروف
========================================== */

let currentGameIndex = 0;
let completedGames = [];
const TOTAL_GAMES = 13;

function startLetterGames() {
    currentGameIndex = 0;
    completedGames = new Array(TOTAL_GAMES).fill(false);

    const badge = document.getElementById("badgeArea");
    if (badge) badge.style.display = "none";

    const nextButton = document.getElementById("nextGameButton");
    if (nextButton) nextButton.style.display = "none";

    updateLetterLesson();
    renderCurrentMiniGame();
}

function updateGameProgress() {
    const number = document.getElementById("currentGameNumber");
    const fill = document.getElementById("gameProgressFill");
    const starsElement = document.getElementById("letterStars");

    if (number) number.textContent = arabicNumber(currentGameIndex + 1);
    if (fill) {
        const percentage = ((currentGameIndex) / TOTAL_GAMES) * 100;
        fill.style.width = percentage + "%";
    }
    if (starsElement) {
        const count = completedGames.filter(Boolean).length;
        starsElement.textContent = arabicNumber(count);
    }
}

function completeCurrentGame() {
    if (completedGames[currentGameIndex]) return;
    completedGames[currentGameIndex] = true;
    addStar();

    const message = document.getElementById("gameMessage");
    if (message) {
        message.textContent = "⭐ ممتاز";
        message.className = "game-message success-text";
    }

    praise();
    updateGameProgress();

    const nextButton = document.getElementById("nextGameButton");
    if (nextButton) {
        nextButton.style.display = "inline-block";
        if (currentGameIndex === TOTAL_GAMES - 1) {
            nextButton.textContent = "🏅 إظهار الشارة";
        } else {
            nextButton.textContent = "اللعبة التالية ➡️";
        }
    }
}

function nextMiniGame() {
    if (!completedGames[currentGameIndex]) {
        const message = document.getElementById("gameMessage");
        if (message) {
            message.textContent = "😊 أكمل اللعبة أولًا";
            message.className = "game-message error-text";
        }
        speak("أكمل اللعبة أولًا");
        return;
    }

    if (currentGameIndex === TOTAL_GAMES - 1) {
        finishLetterBadge();
        return;
    }

    currentGameIndex++;
    renderCurrentMiniGame();
}

function finishLetterBadge() {
    const badge = document.getElementById("badgeArea");
    const miniGame = document.getElementById("miniGame");
    const nextButton = document.getElementById("nextGameButton");

    if (miniGame) miniGame.innerHTML = "";
    if (nextButton) nextButton.style.display = "none";
    if (badge) badge.style.display = "block";

    const item = getCurrentLetter();
    speak("ممتاز، أكملت ألعاب حرف " + item.letter);

    const fill = document.getElementById("gameProgressFill");
    if (fill) fill.style.width = "100%";
}

function renderCurrentMiniGame() {
    const container = document.getElementById("miniGame");
    const message = document.getElementById("gameMessage");
    const nextButton = document.getElementById("nextGameButton");

    if (!container) return;
    container.innerHTML = "";
    if (message) message.textContent = "";
    if (nextButton) nextButton.style.display = "none";

    updateGameProgress();

    switch (currentGameIndex) {
        case 0: gameRecognizeLetter(container); break;
        case 1: gameChooseLetter(container); break;
        case 2: gameChooseSound(container); break;
        case 3: gameFindLetter(container); break;
        case 4: gameCatchLetters(container); break;
        case 5: gameMatchPicture(container); break;
        case 6: gamePuzzle(container); break;
        case 7: gameSand(container); break;
        case 8: gameTrace(container); break;
        case 9: gameColor(container); break;
        case 10: gameChooseWord(container); break;
        case 11: gameSearchLetter(container); break;
        case 12: gameFinalChallenge(container); break;
    }
}

// تفاصيل الألعاب الـ 13
function gameRecognizeLetter(container) {
    const item = getCurrentLetter();
    container.innerHTML = `<h3>🔤 تعرف على الحرف</h3><p>اضغط على الحرف واستمع إليه</p><button class="option" style="font-size:70px;" id="recognizeLetterButton">${item.letter}</button><p>${item.picture}<br>${item.word}</p>`;
    document.getElementById("recognizeLetterButton").onclick = function () {
        speakLessonSound();
        setTimeout(completeCurrentGame, 500);
    };
}

function gameChooseLetter(container) {
    const item = getCurrentLetter();
    let choices = [item.letter];
    while (choices.length < 3) {
        const random = letters[Math.floor(Math.random() * letters.length)].letter;
        if (!choices.includes(random)) choices.push(random);
    }
    choices.sort(() => Math.random() - 0.5);
    container.innerHTML = `<h3>🎯 اختر الحرف الصحيح</h3><p>اختر حرف ${item.letter}</p><div class="options" id="gameOptions"></div>`;
    const box = document.getElementById("gameOptions");
    choices.forEach(function (choice) {
        const button = document.createElement("button");
        button.className = "option";
        button.textContent = choice;
        button.onclick = function () {
            if (choice === item.letter) completeCurrentGame();
            else showGameError();
        };
        box.appendChild(button);
    });
}

function gameChooseSound(container) {
    const item = getCurrentLetter();
    const wrongSounds = ["بَ", "تَ", "مَ"];
    let choices = [item.sound];
    wrongSounds.forEach(sound => {
        if (sound !== item.sound && choices.length < 3) choices.push(sound);
    });
    choices.sort(() => Math.random() - 0.5);
    container.innerHTML = `<h3>🔊 اختر صوت الحرف</h3><div class="lesson-letter">${item.letter}</div><p>ما الصوت الصحيح؟</p><div class="options" id="soundOptions"></div>`;
    const box = document.getElementById("soundOptions");
    choices.forEach(function (choice) {
        const button = document.createElement("button");
        button.className = "option";
        button.textContent = choice;
        button.onclick = function () {
            if (choice === item.sound) {
                speakLessonSound();
                setTimeout(completeCurrentGame, 400);
            } else {
                showGameError();
            }
        };
        box.appendChild(button);
    });
}

function gameFindLetter(container) {
    const item = getCurrentLetter();
    const otherLetters = ["ب", "ت", "م", "س", "ل"];
    let choices = [item.letter];
    while (choices.length < 5) {
        const random = otherLetters[Math.floor(Math.random() * otherLetters.length)];
        if (!choices.includes(random)) choices.push(random);
    }
    choices.sort(() => Math.random() - 0.5);
    container.innerHTML = `<h3>👀 أين حرف ${item.letter}؟</h3><p>اضغط على الحرف الصحيح</p><div class="options" id="findOptions"></div>`;
    const box = document.getElementById("findOptions");
    choices.forEach(function (choice) {
        const button = document.createElement("button");
        button.className = "option";
        button.textContent = choice;
        button.onclick = function () {
            if (choice === item.letter) completeCurrentGame();
            else showGameError();
        };
        box.appendChild(button);
    });
}

function gameCatchLetters(container) {
    const item = getCurrentLetter();
    container.innerHTML = `<h3>🎯 صيد الحروف</h3><p>اضغط على ${item.letter}</p><div id="catchArea" style="display:flex;flex-wrap:wrap;justify-content:center;gap:15px;margin:20px 0;"></div>`;
    const area = document.getElementById("catchArea");
    let choices = [item.letter, "ب", "م", "س", "ت", item.letter];
    choices.sort(() => Math.random() - 0.5);
    choices.forEach(function (choice) {
        const button = document.createElement("button");
        button.className = "option";
        button.textContent = choice;
        button.onclick = function () {
            if (choice === item.letter) completeCurrentGame();
            else showGameError();
        };
        area.appendChild(button);
    });
}

function gameMatchPicture(container) {
    const item = getCurrentLetter();
    container.innerHTML = `<h3>🧩 وصل الحرف بالصورة</h3><div style="font-size:70px;">${item.picture}</div><p>هذه صورة ${item.word}</p><div class="options" id="matchOptions"></div>`;
    const wordsChoices = [item.word, "بطة", "موز"];
    wordsChoices.sort(() => Math.random() - 0.5);
    const box = document.getElementById("matchOptions");
    wordsChoices.forEach(function (word) {
        const button = document.createElement("button");
        button.className = "option";
        button.textContent = word;
        button.onclick = function () {
            if (word === item.word) completeCurrentGame();
            else showGameError();
        };
        box.appendChild(button);
    });
}

function gamePuzzle(container) {
    const item = getCurrentLetter();
    let pieces = [item.letter, "؟", item.picture];
    container.innerHTML = `<h3>🧩 البازل</h3><p>رتب القطع لتكوين الحرف الصحيح</p><div id="puzzleArea" class="options"></div><p>اضغط على الحرف الصحيح</p>`;
    const area = document.getElementById("puzzleArea");
    pieces.sort(() => Math.random() - 0.5);
    pieces.forEach(function (piece) {
        const button = document.createElement("button");
        button.className = "option";
        button.textContent = piece;
        button.onclick = function () {
            if (piece === item.letter) completeCurrentGame();
            else showGameError();
        };
        area.appendChild(button);
    });
}

function gameSand(container) {
    const item = getCurrentLetter();
    container.innerHTML = `<h3>🏖️ اكتب الحرف في الرمل</h3><p>ارسم حرف ${item.letter} بإصبعك داخل الصندوق</p><div id="sandArea" style="height:220px;background:#f5deb3;border:4px dashed #c9a66b;border-radius:20px;position:relative;touch-action:none;"><div style="position:absolute;width:100%;text-align:center;top:60px;font-size:100px;color:rgba(120,90,50,.25);">${item.letter}</div></div><br><button class="success" id="sandDone">✅ انتهيت</button>`;
    const sand = document.getElementById("sandArea");
    let drawing = false;

    function position(e) {
        const rect = sand.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }

    sand.addEventListener("pointerdown", function (e) {
        drawing = true;
        const p = position(e);
        const dot = document.createElement("div");
        dot.style.position = "absolute";
        dot.style.width = "12px";
        dot.style.height = "12px";
        dot.style.background = "#8d6e63";
        dot.style.borderRadius = "50%";
        dot.style.left = p.x + "px";
        dot.style.top = p.y + "px";
        sand.appendChild(dot);
    });

    sand.addEventListener("pointermove", function (e) {
        if (!drawing) return;
        const p = position(e);
        const dot = document.createElement("div");
        dot.style.position = "absolute";
        dot.style.width = "8px";
        dot.style.height = "8px";
        dot.style.background = "#8d6e63";
        dot.style.borderRadius = "50%";
        dot.style.left = p.x + "px";
        dot.style.top = p.y + "px";
        sand.appendChild(dot);
    });

    sand.addEventListener("pointerup", () => { drawing = false; });
    document.getElementById("sandDone").onclick = completeCurrentGame;
}

function gameTrace(container) {
    const item = getCurrentLetter();
    container.innerHTML = `<h3>✏️ تتبع الحرف</h3><p>تتبع الحرف بإصبعك</p><div style="font-size:130px;color:#b0bec5;border:4px dashed #90caf9;border-radius:20px;padding:20px;margin:15px;" id="traceLetter">${item.letter}</div><button class="success" id="traceDone">✅ انتهيت</button>`;
    document.getElementById("traceDone").onclick = completeCurrentGame;
}

function gameColor(container) {
    const item = getCurrentLetter();
    container.innerHTML = `<h3>🎨 لوّن الحرف</h3><p>اضغط على اللون الذي تريده</p><div id="colorLetter" style="font-size:140px;font-weight:bold;margin:20px;color:#3949ab;">${item.letter}</div><div class="options"><button class="option" data-color="red">🔴</button><button class="option" data-color="blue">🔵</button><button class="option" data-color="green">🟢</button><button class="option" data-color="orange">🟠</button></div><button class="success" id="colorDone">✅ انتهيت</button>`;
    const letter = document.getElementById("colorLetter");
    document.querySelectorAll("[data-color]").forEach(function (button) {
        button.onclick = function () { letter.style.color = button.dataset.color; };
    });
    document.getElementById("colorDone").onclick = completeCurrentGame;
}

function gameChooseWord(container) {
    const item = getCurrentLetter();
    const correct = item.word;
    const choices = [correct, "بَاب", "مُوز"];
    choices.sort(() => Math.random() - 0.5);
    container.innerHTML = `<h3>📖 اختر الكلمة التي تبدأ بالحرف</h3><div style="font-size:70px;margin:15px;">${item.letter}</div><div class="options" id="wordGameOptions"></div>`;
    const box = document.getElementById("wordGameOptions");
    choices.forEach(function (word) {
        const button = document.createElement("button");
        button.className = "option";
        button.textContent = word;
        button.onclick = function () {
            if (word === correct) completeCurrentGame();
            else showGameError();
        };
        box.appendChild(button);
    });
}

function gameSearchLetter(container) {
    const item = getCurrentLetter();
    container.innerHTML = `<h3>🔎 ابحث عن الحرف</h3><p>اضغط على كل حرف ${item.letter}</p><div id="searchArea" class="options"></div>`;
    const area = document.getElementById("searchArea");
    const choices = [item.letter, "ب", item.letter, "م", "ت", item.letter];
    let found = 0;
    choices.sort(() => Math.random() - 0.5);
    choices.forEach(function (choice) {
        const button = document.createElement("button");
        button.className = "option";
        button.textContent = choice;
        button.onclick = function () {
            if (choice === item.letter && !button.disabled) {
                button.disabled = true;
                found++;
                if (found >= 3) completeCurrentGame();
            } else if (choice !== item.letter) {
                showGameError();
            }
        };
        area.appendChild(button);
    });
}

function gameFinalChallenge(container) {
    const item = getCurrentLetter();
    container.innerHTML = `<h3>🏆 التحدي النهائي</h3><div style="font-size:80px;margin:15px;">${item.picture}</div><p>ما الحرف الذي تبدأ به كلمة ${item.word}؟</p><div class="options" id="finalOptions"></div>`;
    let choices = [item.letter, "ب", "م"];
    choices.sort(() => Math.random() - 0.5);
    const box = document.getElementById("finalOptions");
    choices.forEach(function (choice) {
        const button = document.createElement("button");
        button.className = "option";
        button.textContent = choice;
        button.onclick = function () {
            if (choice === item.letter) completeCurrentGame();
            else showGameError();
        };
        box.appendChild(button);
    });
}

function showGameError() {
    const message = document.getElementById("gameMessage");
    if (message) {
        message.textContent = "😊 حاول مرة أخرى";
        message.className = "game-message error-text";
    }
    speak("حاول مرة أخرى");
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
    const item = words[wordIndex];
    const word = document.getElementById("currentWord");
    const picture = document.getElementById("wordPicture");
    const message = document.getElementById("wordMessage");

    if (word) word.textContent = item.word;
    if (picture) picture.textContent = item.emoji;
    if (message) message.textContent = "";
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
        message.textContent = "⭐ ممتاز";
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

function speakWord() { speak(words[wordIndex].word); }
function nextWord() { wordIndex = (wordIndex + 1) % words.length; loadWord(); }


/* ==========================================
   🔢 الأرقام
========================================== */

let currentNumber = 1;
let numberAnswered = false;

function loadNumber() {
    const number = document.getElementById("currentNumber");
    const count = document.getElementById("countItems");
    const message = document.getElementById("numberMessage");

    if (number) number.textContent = arabicNumber(currentNumber);
    if (count) {
        if (currentNumber <= 20) count.textContent = "🍎".repeat(currentNumber);
        else count.textContent = "عدد التفاح: " + arabicNumber(currentNumber);
    }
    if (message) message.textContent = "";
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
        message.textContent = "⭐ ممتاز";
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
    currentNumber = currentNumber >= 100 ? 1 : currentNumber + 1;
    loadNumber();
}


/* ==========================================
   ➕ الجمع
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

    if (question) question.textContent = arabicNumber(addA) + " + " + arabicNumber(addB) + " = ؟";
    if (pictures) pictures.textContent = "🍎".repeat(addA) + " + " + "🍎".repeat(addB);
    if (answer) answer.value = "";
    if (message) message.textContent = "";
    additionAnswered = false;
}

function checkAddition() {
    const input = document.getElementById("addAnswer");
    const message = document.getElementById("addMessage");
    if (!input || !message) return;

    if (Number(input.value) === addA + addB) {
        message.textContent = "⭐ ممتاز";
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
   ➖ الطرح
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

    if (question) question.textContent = arabicNumber(subA) + " - " + arabicNumber(subB) + " = ؟";
    if (pictures) pictures.textContent = "🍎".repeat(subA);
    if (answer) answer.value = "";
    if (message) message.textContent = "";
    subtractionAnswered = false;
}

function checkSubtraction() {
    const input = document.getElementById("subAnswer");
    const message = document.getElementById("subMessage");
    if (!input || !message) return;

    if (Number(input.value) === subA - subB) {
        message.textContent = "⭐ ممتاز";
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
   📖 القرآن الكريم
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
    }
];

let surahIndex = 0;

function loadSurah() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    const surah = quranSurahs[surahIndex];
    const name = document.getElementById("surahName");
    const text = document.getElementById("surahText");

    if (name) name.textContent = surah.name;
    if (text) text.innerHTML = surah.text.replace(/\n/g, "<br><br>");
}

function speakSurah() {
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        return;
    }
    if (currentAudio) {
        currentAudio.play();
        return;
    }
    currentAudio = new Audio(quranSurahs[surahIndex].audio);
    currentAudio.play().catch(function () {
        alert("تأكد من اتصال الإنترنت");
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
   🕌 الأحاديث النبوية
========================================== */

const hadiths = [
    {
        image: "❤️",
        text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
        source: "رواه البخاري ومسلم",
        meaning: "اعمل الخير بنية طيبة"
    },
    {
        image: "😊",
        text: "مَنْ لَا يَرْحَمْ لَا يُرْحَمْ",
        source: "رواه البخاري ومسلم",
        meaning: "ارحم الناس والحيوانات"
    },
    {
        image: "🤝",
        text: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
        source: "رواه البخاري ومسلم",
        meaning: "لا تؤذ أحدًا بكلامك أو بيدك"
    },
    {
        image: "🌸",
        text: "الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ",
        source: "رواه البخاري",
        meaning: "الكلام الجميل عمل صالح"
    },
    {
        image: "🤲",
        text: "مَنْ لَا يَشْكُرِ النَّاسَ لَا يَشْكُرِ اللَّهَ",
        source: "رواه الترمذي",
        meaning: "اشكر من يساعدك"
    }
];

let hadithIndex = 0;

function loadHadith() {
    const hadith = hadiths[hadithIndex];
    const image = document.getElementById("hadithImage");
    const text = document.getElementById("hadithText");
    const source = document.getElementById("hadithSource");
    const meaning = document.getElementById("hadithMeaning");

    if (image) image.textContent = hadith.image;
    if (text) text.textContent = hadith.text;
    if (source) source.textContent = hadith.source;
    if (meaning) meaning.textContent = hadith.meaning;
}

function speakHadith() {
    speak(hadiths[hadithIndex].text);
}

function nextHadith() {
    hadithIndex = (hadithIndex + 1) % hadiths.length;
    loadHadith();
}


/* ==========================================
   🤲 الأدعية
========================================== */

const duas = [
    { title: "دعاء قبل الطعام", text: "بسم الله" },
    { title: "دعاء بعد الطعام", text: "الحمد لله الذي أطعمني هذا ورزقنيه من غير حول مني ولا قوة" },
    { title: "دعاء دخول المنزل", text: "بسم الله ولجنا وبسم الله خرجنا وعلى ربنا توكلنا" },
    { title: "دعاء الخروج من المنزل", text: "بسم الله توكلت على الله ولا حول ولا قوة إلا بالله" },
    { title: "دعاء قبل النوم", text: "باسمك اللهم أموت وأحيا" },
    { title: "دعاء الاستيقاظ", text: "الحمد لله الذي أحيانا بعدما أماتنا وإليه النشور" },
    { title: "دعاء طلب العلم", text: "رَبِّ زِدْنِي عِلْمًا" }
];

let duaIndex = 0;

function loadDua() {
    const dua = duas[duaIndex];
    const title = document.getElementById("duaTitle");
    const text = document.getElementById("duaText");

    if (title) title.textContent = dua.title;
    if (text) text.textContent = dua.text;
}

function speakDua() {
    speak(duas[duaIndex].text);
}

function nextDua() {
    duaIndex = (duaIndex + 1) % duas.length;
    loadDua();
}


/* ==========================================
   ✏️ الكتابة
========================================== */

const writingLetters = ["أ", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ر", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "هـ", "و", "ي"];
let writingIndex = 0;
let writingDrawing = false;
let writingCanvas = null;
let writingContext = null;

function setupWritingCanvas() {
    writingCanvas = document.getElementById("writingCanvas");
    if (!writingCanvas) return;

    const rect = writingCanvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    writingCanvas.width = rect.width * ratio;
    writingCanvas.height = rect.height * ratio;

    writingContext = writingCanvas.getContext("2d");
    writingContext.scale(ratio, ratio);
    writingContext.lineWidth = 6;
    writingContext.lineCap = "round";
    writingContext.lineJoin = "round";

    writingCanvas.onpointerdown = function (e) {
        writingDrawing = true;
        const point = getCanvasPoint(e);
        writingContext.beginPath();
        writingContext.moveTo(point.x, point.y);
    };

    writingCanvas.onpointermove = function (e) {
        if (!writingDrawing) return;
        const point = getCanvasPoint(e);
        writingContext.lineTo(point.x, point.y);
        writingContext.stroke();
    };

    writingCanvas.onpointerup = function () { writingDrawing = false; };
    writingCanvas.onpointerleave = function () { writingDrawing = false; };
}

function getCanvasPoint(e) {
    const rect = writingCanvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function clearCanvas() {
    if (!writingCanvas || !writingContext) setupWritingCanvas();
    if (!writingCanvas || !writingContext) return;
    writingContext.clearRect(0, 0, writingCanvas.width, writingCanvas.height);
}

function finishWriting() {
    const message = document.getElementById("writingMessage");
    if (message) {
        message.textContent = "⭐ ممتاز! أحسنت الكتابة";
        message.className = "message success-text";
    }
    addStar();
    praise();
}

function newWritingLetter() {
    writingIndex = (writingIndex + 1) % writingLetters.length;
    const guide = document.getElementById("writingGuide");
    if (guide) guide.textContent = writingLetters[writingIndex];
    clearCanvas();
}


/* ==========================================
   💾 حفظ وتحميل التقدم
========================================== */

function saveProgress() {
    const progress = {
        stars: stars,
        level: level,
        correctLetters: correctLetters,
        correctWords: correctWords,
        correctNumbers: correctNumbers,
        correctAddition: correctAddition,
        correctSubtraction: correctSubtraction
    };
    try {
        localStorage.setItem("taahProgress", JSON.stringify(progress));
    } catch (error) {
        console.log("تعذر حفظ التقدم");
    }
}

function loadProgress() {
    try {
        const saved = localStorage.getItem("taahProgress");
        if (!saved) {
            updateStats();
            return;
        }
        const progress = JSON.parse(saved);
        stars = Number(progress.stars) || 0;
        level = Number(progress.level) || 1;
        correctLetters = Number(progress.correctLetters) || 0;
        correctWords = Number(progress.correctWords) || 0;
        correctNumbers = Number(progress.correctNumbers) || 0;
        correctAddition = Number(progress.correctAddition) || 0;
        correctSubtraction = Number(progress.correctSubtraction) || 0;
        updateStats();
    } catch (error) {
        console.log("تعذر تحميل التقدم");
        updateStats();
    }
}

const originalAddStar = addStar;
addStar = function () {
    originalAddStar();
    saveProgress();
};

function resetProgress() {
    const confirmReset = confirm("هل تريد تصفير جميع النتائج؟");
    if (!confirmReset) return;

    stars = 0;
    level = 1;
    correctLetters = 0;
    correctWords = 0;
    correctNumbers = 0;
    correctAddition = 0;
    correctSubtraction = 0;

    try {
        localStorage.removeItem("taahProgress");
    } catch (error) {
        console.log("تعذر حذف التقدم");
    }

    updateStats();
    speak("تم تصفير النتائج");
}


/* ==========================================
   🚀 تشغيل التطبيق
========================================== */

function initializeApp() {
    loadProgress();
    updateStats();
    renderLettersList();
    loadWord();
    loadNumber();
    newAddition();
    newSubtraction();
    loadSurah();
    loadHadith();
    loadDua();
    setupWritingCanvas();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    initializeApp();
}

window.addEventListener("resize", function () {
    if (document.getElementById("writing") && document.getElementById("writing").classList.contains("active")) {
        setupWritingCanvas();
    }
});

/* ==========================================
   نهاية script.js
========================================== */
