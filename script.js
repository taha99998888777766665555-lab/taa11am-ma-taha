/* =========================================================
   🌟 تعلم مع أ/ طه محمد 🌟
   script.js - النسخة الكاملة
   ========================================================= */

"use strict";

/* =========================================================
   🔧 أدوات عامة
   ========================================================= */

const $ = (id) => document.getElementById(id);

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
   🔊 الصوت
   ========================================================= */

let arabicVoice = null;

function findArabicVoice() {
    const voices = speechSynthesis.getVoices();

    arabicVoice =
        voices.find(v => v.lang === "ar-SA") ||
        voices.find(v => v.lang.startsWith("ar")) ||
        null;

    return arabicVoice;
}

if ("speechSynthesis" in window) {
    speechSynthesis.onvoiceschanged = findArabicVoice;
    findArabicVoice();
}

function speak(text, options = {}) {
    if (!("speechSynthesis" in window)) return;

    speechSynthesis.cancel();

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
}

/* =========================================================
   ⭐ النجوم والمستوى
   ========================================================= */

let stars = Number(localStorage.getItem("taha_app_stars") || 0);
let level = Number(localStorage.getItem("taha_app_level") || 1);

function getStars() {
    return stars;
}

function addStars(amount) {
    stars += amount;

    level = Math.floor(stars / 100) + 1;

    localStorage.setItem("taha_app_stars", stars);
    localStorage.setItem("taha_app_level", level);

    updateStats();
}

function updateStats() {
    const starsEl = $("stars");
    const levelEl = $("level");

    if (starsEl) starsEl.textContent = arabicNumber(stars);
    if (levelEl) levelEl.textContent = arabicNumber(level);
}

/* =========================================================
   🧭 التنقل بين الصفحات
   ========================================================= */

function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => {
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

    if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
    }

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
        setTimeout(initWritingCanvas, 100);
    }

    if (screenId === "addition") {
        newAddition();
    }

    if (screenId === "subtraction") {
        newSubtraction();
    }

    if (screenId === "quran") {
        renderSurah();
    }

    if (screenId === "hadith") {
        renderHadith();
    }

    if (screenId === "duas") {
        renderDua();
    }
}

/* =========================================================
   🔤 الحروف العربية
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

let currentLetterIndex = 0;
let currentLetterGame = 0;
let letterGameAnswered = false;
let letterGameStars = 0;

const TOTAL_LETTER_GAMES = 20;

/* =========================================================
   🎨 تنسيق ألعاب الحروف
   ========================================================= */

function addLetterGameStyles() {
    if ($("letterGameStyles")) return;

    const style = document.createElement("style");
    style.id = "letterGameStyles";

    style.textContent = `
        .letter-games-box {
            margin: 20px auto;
            max-width: 850px;
        }

        .letter-game-card {
            background: rgba(255,255,255,.95);
            border-radius: 24px;
            padding: 20px;
            box-shadow: 0 8px 25px rgba(0,0,0,.10);
            text-align: center;
        }

        .game-number {
            font-size: 17px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .game-question {
            font-size: 24px;
            font-weight: bold;
            margin: 15px 0;
            line-height: 1.7;
        }

        .game-big-letter {
            font-size: 75px;
            font-weight: bold;
            margin: 12px;
        }

        .game-picture {
            font-size: 70px;
            margin: 15px;
        }

        .letter-options-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit,minmax(85px,1fr));
            gap: 12px;
            margin-top: 20px;
        }

        .letter-game-option {
            border: 0;
            border-radius: 18px;
            padding: 15px 8px;
            background: #f1f5f9;
            font-size: 30px;
            font-weight: bold;
            cursor: pointer;
            transition: .2s;
            min-height: 70px;
        }

        .letter-game-option:hover {
            transform: translateY(-3px);
        }

        .letter-game-option.correct {
            background: #c8f7d2 !important;
        }

        .letter-game-option.wrong {
            background: #ffd0d0 !important;
        }

        .game-word {
            font-size: 42px;
            font-weight: bold;
            margin: 20px;
        }

        .game-memory-hidden {
            font-size: 55px;
            font-weight: bold;
            min-height: 75px;
        }

        .game-progress {
            height: 12px;
            background: #e5e7eb;
            border-radius: 20px;
            overflow: hidden;
            margin: 15px 0;
        }

        .game-progress-fill {
            height: 100%;
            width: 0%;
            background: #22c55e;
            transition: width .3s;
        }

        .game-message {
            min-height: 35px;
            font-size: 20px;
            font-weight: bold;
            margin-top: 15px;
        }

        .game-next-btn {
            margin-top: 18px;
            border: 0;
            border-radius: 15px;
            padding: 13px 25px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
        }

        .game-category {
            display: inline-block;
            padding: 7px 14px;
            border-radius: 20px;
            background: #eef2ff;
            font-size: 14px;
            margin-bottom: 8px;
        }
    `;

    document.head.appendChild(style);
}

/* =========================================================
   🔤 اختيارات حروف بدون تكرار
   ========================================================= */

function getUniqueLetterChoices(correctLetter, count = 3) {
    const wrongLetters = shuffle(
        letters
            .map(item => item.letter)
            .filter(letter => letter !== correctLetter)
    ).slice(0, count - 1);

    return shuffle(unique([correctLetter, ...wrongLetters]));
}

function getUniqueItems(correctItem, count = 3) {
    const others = shuffle(
        letters.filter(item => item.letter !== correctItem.letter)
    ).slice(0, count - 1);

    return shuffle(unique([correctItem, ...others]));
}

/* =========================================================
   🔤 صفحة الحروف
   ========================================================= */

function renderLetterPage() {
    addLetterGameStyles();

    const item = letters[currentLetterIndex];

    if ($("currentLetter")) {
        $("currentLetter").textContent = item.letter;
    }

    if ($("letterPicture")) {
        $("letterPicture").textContent = item.emoji;
    }

    if ($("letterWord")) {
        $("letterWord").textContent = item.word;
    }

    renderLetterGamesBox();
}

function speakCurrentLetter() {
    const item = letters[currentLetterIndex];

    speak(
        `حرف ${item.letter}، مثل ${item.word}`,
        { rate: 0.75 }
    );
}

function playLetterAudio() {
    speakCurrentLetter();
}

/* =========================================================
   🎮 إنشاء صندوق الألعاب
   ========================================================= */

function getLetterGamesBox() {
    let box = $("letterGamesBox");

    if (!box) {
        box = document.createElement("div");
        box.id = "letterGamesBox";
        box.className = "letter-games-box";

        const lettersScreen = $("letters");

        if (lettersScreen) {
            lettersScreen.appendChild(box);
        }
    }

    return box;
}

function renderLetterGamesBox() {
    const box = getLetterGamesBox();

    if (!box) return;

    box.innerHTML = `
        <div class="letter-game-card">
            <div class="game-number">
                اللعبة ${arabicNumber(currentLetterGame + 1)} من ${arabicNumber(TOTAL_LETTER_GAMES)}
            </div>

            <div class="game-progress">
                <div
                    id="letterGameProgressFill"
                    class="game-progress-fill"
                    style="width:${((currentLetterGame) / TOTAL_LETTER_GAMES) * 100}%"
                ></div>
            </div>

            <div id="letterGameContent"></div>
        </div>
    `;

    renderCurrentLetterGame();
}

/* =========================================================
   🎮 محرك الألعاب العشرين
   ========================================================= */

function renderCurrentLetterGame() {
    const content = $("letterGameContent");

    if (!content) return;

    letterGameAnswered = false;

    const item = letters[currentLetterIndex];

    switch (currentLetterGame) {

        /* 1 ------------------------------------------------ */
        case 0:
            gameChooseCorrectLetter(content, item);
            break;

        /* 2 ------------------------------------------------ */
        case 1:
            gameListenAndChoose(content, item);
            break;

        /* 3 ------------------------------------------------ */
        case 2:
            gameChoosePicture(content, item);
            break;

        /* 4 ------------------------------------------------ */
        case 3:
            gameChooseWordStartingLetter(content, item);
            break;

        /* 5 ------------------------------------------------ */
        case 4:
            gameFirstLetterOfWord(content);
            break;

        /* 6 ------------------------------------------------ */
        case 5:
            gameCompleteWord(content, item);
            break;

        /* 7 ------------------------------------------------ */
        case 6:
            gameFindLetter(content, item);
            break;

        /* 8 ------------------------------------------------ */
        case 7:
            gameMatchLetterPicture(content, item);
            break;

        /* 9 ------------------------------------------------ */
        case 8:
            gameMatchLetterWord(content, item);
            break;

        /* 10 ----------------------------------------------- */
        case 9:
            gameListenHaraka(content, item);
            break;

        /* 11 ----------------------------------------------- */
        case 10:
            gameListenWord(content, item);
            break;

        /* 12 ----------------------------------------------- */
        case 11:
            gameWhichWordDoesNotStart(content, item);
            break;

        /* 13 ----------------------------------------------- */
        case 12:
            gamePictureOnly(content, item);
            break;

        /* 14 ----------------------------------------------- */
        case 13:
            gameOddLookingLetter(content, item);
            break;

        /* 15 ----------------------------------------------- */
        case 14:
            gameLetterInContext(content, item);
            break;

        /* 16 ----------------------------------------------- */
        case 15:
            gamePictureToLetter(content, item);
            break;

        /* 17 ----------------------------------------------- */
        case 16:
            gameWhichWordContainsLetter(content, item);
            break;

        /* 18 ----------------------------------------------- */
        case 17:
            gameLetterRiddle(content, item);
            break;

        /* 19 ----------------------------------------------- */
        case 18:
            gameMemory(content, item);
            break;

        /* 20 ----------------------------------------------- */
        case 19:
            gameFinalChallenge(content, item);
            break;
    }
}

/* =========================================================
   🧩 أدوات الألعاب
   ========================================================= */

function gameHeader(title, subtitle = "") {
    return `
        <div class="game-category">${title}</div>
        ${subtitle ? `<div>${subtitle}</div>` : ""}
    `;
}

function renderOptions(content, choices, correctValue, formatter, callback) {
    const options = choices.map((choice, index) => {
        return `
            <button
                class="letter-game-option"
                data-value="${String(choice.letter || choice.word || choice).replace(/"/g, "&quot;")}"
                data-index="${index}"
            >
                ${formatter(choice)}
            </button>
        `;
    }).join("");

    content.innerHTML += `
        <div class="letter-options-grid">
            ${options}
        </div>
        <div id="letterGameMessage" class="game-message"></div>
        <button
            id="letterGameNext"
            class="game-next-btn"
            style="display:none"
            onclick="nextLetterGame()"
        >
            اللعبة التالية ➜
        </button>
    `;

    content.querySelectorAll(".letter-game-option").forEach(button => {
        button.addEventListener("click", () => {
            if (letterGameAnswered) return;

            const value = button.dataset.value;

            callback(
                value,
                button,
                correctValue
            );
        });
    });
}

function finishLetterGame(isCorrect, button = null) {
    letterGameAnswered = true;

    const message = $("letterGameMessage");

    if (isCorrect) {
        if (button) button.classList.add("correct");

        letterGameStars += 5;
        addStars(5);

        if (message) {
            message.textContent = "🎉 أحسنت! حصلت على ⭐ ٥ نجوم";
        }

        speak("أحسنت، إجابة صحيحة", {
            rate: 0.8,
            pitch: 1.1
        });

    } else {
        if (button) button.classList.add("wrong");

        if (message) {
            message.textContent = "😊 حاول مرة أخرى";
        }

        speak("حاول مرة أخرى", {
            rate: 0.8
        });
    }

    document.querySelectorAll(".letter-game-option").forEach(btn => {
        btn.disabled = true;
    });

    const next = $("letterGameNext");

    if (next) {
        next.style.display = "inline-block";
    }
}

/* =========================================================
   🎮 اللعبة 1
   اختر الحرف الصحيح
   ========================================================= */

function gameChooseCorrectLetter(content, item) {
    content.innerHTML = `
        ${gameHeader("اختر الحرف الصحيح")}
        <div class="game-question">
            أين حرف <strong>${item.letter}</strong>؟
        </div>
    `;

    const choices = getUniqueLetterChoices(item.letter, 3);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(value === correct, button);
        }
    );
}

/* =========================================================
   🎮 اللعبة 2
   اسمع الحرف
   ========================================================= */

function gameListenAndChoose(content, item) {
    content.innerHTML = `
        ${gameHeader("اسمع واختر")}
        <div class="game-question">
            🔊 اضغط على الزر ثم اختر الحرف الذي سمعته
        </div>

        <button
            class="game-next-btn"
            onclick="speak('${item.letter}')"
        >
            🔊 اسمع الحرف
        </button>
    `;

    const choices = getUniqueLetterChoices(item.letter, 4);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(value === correct, button);
        }
    );
}

/* =========================================================
   🎮 اللعبة 3
   اختر الصورة
   ========================================================= */

function gameChoosePicture(content, item) {
    const choices = getUniqueItems(item, 3);

    content.innerHTML = `
        ${gameHeader("اختر الصورة")}
        <div class="game-question">
            اختر الصورة التي تبدأ بحرف <strong>${item.letter}</strong>
        </div>

        <div class="letter-options-grid">
            ${choices.map((choice, index) => `
                <button
                    class="letter-game-option"
                    data-index="${index}"
                >
                    <div class="game-picture">${choice.emoji}</div>
                </button>
            `).join("")}
        </div>

        <div id="letterGameMessage" class="game-message"></div>

        <button
            id="letterGameNext"
            class="game-next-btn"
            style="display:none"
            onclick="nextLetterGame()"
        >
            اللعبة التالية ➜
        </button>
    `;

    content.querySelectorAll(".letter-game-option").forEach((button, index) => {
        button.onclick = () => {
            finishLetterGame(
                choices[index].letter === item.letter,
                button
            );
        };
    });
}

/* =========================================================
   🎮 اللعبة 4
   اختر الكلمة
   ========================================================= */

function gameChooseWordStartingLetter(content, item) {
    const choices = getUniqueItems(item, 4);

    content.innerHTML = `
        ${gameHeader("اختر الكلمة")}
        <div class="game-question">
            أي كلمة تبدأ بحرف <strong>${item.letter}</strong>؟
        </div>
    `;

    renderOptions(
        content,
        choices,
        item.word,
        choice => choice.word,
        (value, button, correct) => {
            finishLetterGame(value === correct, button);
        }
    );
}

/* =========================================================
   🎮 اللعبة 5
   أول حرف في الكلمة
   ========================================================= */

function gameFirstLetterOfWord(content) {
    const target = letters[currentLetterIndex];

    content.innerHTML = `
        ${gameHeader("أول حرف")}
        <div class="game-word">${target.word}</div>

        <div class="game-question">
            ما أول حرف في كلمة <strong>${target.word}</strong>؟
        </div>
    `;

    const choices = getUniqueLetterChoices(target.letter, 3);

    renderOptions(
        content,
        choices,
        target.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(value === correct, button);
        }
    );
}

/* =========================================================
   🎮 اللعبة 6
   أكمل الكلمة
   ========================================================= */

function gameCompleteWord(content, item) {
    const remaining = item.word.substring(1);

    content.innerHTML = `
        ${gameHeader("أكمل الكلمة")}
        <div class="game-word">ـ${remaining}</div>

        <div class="game-question">
            اختر الحرف الناقص
        </div>
    `;

    const choices = getUniqueLetterChoices(item.letter, 4);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(value === correct, button);
        }
    );
}

/* =========================================================
   🎮 اللعبة 7
   ابحث عن الحرف
   ========================================================= */

function gameFindLetter(content, item) {
    const allLetters = shuffle(letters)
        .slice(0, 8)
        .map(x => x.letter);

    if (!allLetters.includes(item.letter)) {
        allLetters[0] = item.letter;
    }

    const choices = unique(allLetters);

    content.innerHTML = `
        ${gameHeader("ابحث عن الحرف")}
        <div class="game-question">
            ابحث عن حرف <strong>${item.letter}</strong>
        </div>
    `;

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(value === correct, button);
        }
    );
}

/* =========================================================
   🎮 اللعبة 8
   طابق الحرف مع الصورة
   ========================================================= */

function gameMatchLetterPicture(content, item) {
    const choices = getUniqueItems(item, 4);

    content.innerHTML = `
        ${gameHeader("طابق الحرف مع الصورة")}
        <div class="game-big-letter">${item.letter}</div>

        <div class="game-question">
            اختر الصورة المناسبة للحرف
        </div>

        <div class="letter-options-grid">
            ${choices.map((choice, index) => `
                <button class="letter-game-option" data-index="${index}">
                    <div class="game-picture">${choice.emoji}</div>
                </button>
            `).join("")}
        </div>

        <div id="letterGameMessage" class="game-message"></div>

        <button
            id="letterGameNext"
            class="game-next-btn"
            style="display:none"
            onclick="nextLetterGame()"
        >
            اللعبة التالية ➜
        </button>
    `;

    content.querySelectorAll(".letter-game-option").forEach((button, index) => {
        button.onclick = () => {
            finishLetterGame(
                choices[index].letter === item.letter,
                button
            );
        };
    });
}

/* =========================================================
   🎮 اللعبة 9
   طابق الحرف مع الكلمة
   ========================================================= */

function gameMatchLetterWord(content, item) {
    const choices = getUniqueItems(item, 4);

    content.innerHTML = `
        ${gameHeader("طابق الحرف مع الكلمة")}
        <div class="game-big-letter">${item.letter}</div>

        <div class="game-question">
            اختر الكلمة المناسبة للحرف
        </div>
    `;

    renderOptions(
        content,
        choices,
        item.word,
        choice => choice.word,
        (value, button, correct) => {
            finishLetterGame(value === correct, button);
        }
    );
}

/* =========================================================
   🎮 اللعبة 10
   اسمع الفتحة
   ========================================================= */

function gameListenHaraka(content, item) {
    content.innerHTML = `
        ${gameHeader("اسمع صوت الحرف")}
        <div class="game-question">
            🔊 اسمع الصوت واختر الحرف
        </div>

        <button
            class="game-next-btn"
            onclick="speak('${item.letter}َ')"
        >
            🔊 اسمع
        </button>
    `;

    const choices = getUniqueLetterChoices(item.letter, 4);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(value === correct, button);
        }
    );
}

/* =========================================================
   🎮 اللعبة 11
   اسمع الكلمة
   ========================================================= */

function gameListenWord(content, item) {
    content.innerHTML = `
        ${gameHeader("اسمع الكلمة")}
        <div class="game-question">
            🔊 اسمع الكلمة ثم اختر أول حرف فيها
        </div>

        <button
            class="game-next-btn"
            onclick="speak('${item.word}')"
        >
            🔊 اسمع الكلمة
        </button>
    `;

    const choices = getUniqueLetterChoices(item.letter, 4);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(value === correct, button);
        }
    );
}

/* =========================================================
   🎮 اللعبة 12
   أي كلمة لا تبدأ بالحرف؟
   ========================================================= */

function gameWhichWordDoesNotStart(content, item) {
    const correctWords = shuffle(
        letters.filter(x => x.letter === item.letter)
    );

    const wrongWords = shuffle(
        letters.filter(x => x.letter !== item.letter)
    ).slice(0, 1);

    let choices = [
        item,
        ...shuffle(
            letters.filter(x => x.letter !== item.letter)
        ).slice(0, 2),
        wrongWords[0]
    ];

    choices = unique(
        choices.map(x => x.word)
    ).map(word => letters.find(x => x.word === word));

    choices = shuffle(choices);

    const wrongAnswer = choices.find(x => x.letter !== item.letter);

    content.innerHTML = `
        ${gameHeader("اختيار الكلمة المختلفة")}
        <div class="game-question">
            أي كلمة <strong>لا تبدأ</strong> بحرف ${item.letter}؟
        </div>
    `;

    renderOptions(
        content,
        choices,
        wrongAnswer.word,
        choice => choice.word,
        (value, button, correct) => {
            finishLetterGame(value === correct, button);
        }
    );
}

/* =========================================================
   🎮 اللعبة 13
   صورة فقط
   ========================================================= */

function gamePictureOnly(content, item) {
    content.innerHTML = `
        ${gameHeader("صورة فقط")}
        <div class="game-picture">${item.emoji}</div>

        <div class="game-question">
            ما الحرف الذي تبدأ به هذه الصورة؟
        </div>
    `;

    const choices = getUniqueLetterChoices(item.letter, 4);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(value === correct, button);
        }
    );
}

/* =========================================================
   🎮 اللعبة 14
   الحروف المتشابهة
   ========================================================= */

function gameOddLookingLetter(content, item) {
    const similarGroups = {
        "ب": ["ت", "ث", "ن"],
        "ت": ["ب", "ث", "ن"],
        "ث": ["ب", "ت", "ن"],
        "ج": ["ح", "خ"],
        "ح": ["ج", "خ"],
        "خ": ["ج", "ح"],
        "د": ["ذ"],
        "ذ": ["د"],
        "ر": ["ز"],
        "ز": ["ر"],
        "س": ["ش"],
        "ش": ["س"],
        "ص": ["ض"],
        "ض": ["ص"],
        "ط": ["ظ"],
        "ظ": ["ط"],
        "ع": ["غ"],
        "غ": ["ع"],
        "ف": ["ق"],
        "ق": ["ف"],
        "ه": ["و"],
        "و": ["ه"]
    };

    let choices = similarGroups[item.letter] || [];

    choices = unique(
        [item.letter, ...choices]
    ).slice(0, 4);

    while (choices.length < 4) {
        const extra = shuffle(
            letters.map(x => x.letter)
                .filter(x => !choices.includes(x))
        )[0];

        if (extra) choices.push(extra);
    }

    choices = shuffle(choices);

    content.innerHTML = `
        ${gameHeader("انتبه للحروف المتشابهة")}
        <div class="game-question">
            أين حرف <strong>${item.letter}</strong>؟
        </div>
        <div style="font-size:16px">
            ركّز جيدًا 👀
        </div>
    `;

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(value === correct, button);
        }
    );
}

/* =========================================================
   🎮 اللعبة 15
   الحرف داخل الكلمة
   ========================================================= */

function gameLetterInContext(content, item) {
    const highlighted = item.word
        .replace(
            item.letter,
            `<span style="text-decoration:underline;font-size:1.25em">${item.letter}</span>`
        );

    content.innerHTML = `
        ${gameHeader("الحرف داخل الكلمة")}
        <div class="game-word">${highlighted}</div>

        <div class="game-question">
            ما الحرف الملوّن في بداية الكلمة؟
        </div>
    `;

    const choices = getUniqueLetterChoices(item.letter, 3);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(value === correct, button);
        }
    );
}

/* =========================================================
   🎮 اللعبة 16
   الصورة ← الحرف
   ========================================================= */

function gamePictureToLetter(content, item) {
    content.innerHTML = `
        ${gameHeader("الصورة ← الحرف")}
        <div class="game-picture">${item.emoji}</div>

        <div class="game-question">
            اختر الحرف الذي يناسب الصورة
        </div>
    `;

    const choices = getUniqueLetterChoices(item.letter, 4);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(value === correct, button);
        }
    );
}

/* =========================================================
   🎮 اللعبة 17
   أي كلمة تحتوي على الحرف؟
   ========================================================= */

function gameWhichWordContainsLetter(content, item) {
    let candidates = [
        item,
        ...shuffle(
            letters.filter(x => !x.word.includes(item.letter))
        ).slice(0, 2)
    ];

    candidates = shuffle(candidates);

    content.innerHTML = `
        ${gameHeader("ابحث داخل الكلمات")}
        <div class="game-question">
            أي كلمة تحتوي على حرف <strong>${item.letter}</strong>؟
        </div>
    `;

    renderOptions(
        content,
        candidates,
        item.word,
        choice => choice.word,
        (value, button, correct) => {
            finishLetterGame(value === correct, button);
        }
    );
}

/* =========================================================
   🎮 اللعبة 18
   لغز الحرف
   ========================================================= */

function gameLetterRiddle(content, item) {
    content.innerHTML = `
        ${gameHeader("لغز الحرف 🧠")}

        <div class="game-question">
            أنا حرف تبدأ به كلمة
            <strong>${item.word}</strong>
            ${item.emoji}
            <br>
            فمن أنا؟
        </div>
    `;

    const choices = getUniqueLetterChoices(item.letter, 4);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(value === correct, button);
        }
    );
}

/* =========================================================
   🎮 اللعبة 19
   الذاكرة
   ========================================================= */

function gameMemory(content, item) {
    content.innerHTML = `
        ${gameHeader("لعبة الذاكرة 🧠")}
        <div class="game-question">
            احفظ الحرف جيدًا...
        </div>

        <div id="memoryLetter" class="game-memory-hidden">
            ${item.letter}
        </div>

        <div id="memoryInstruction">
            👀 لديك ثانيتان للحفظ
        </div>
    `;

    setTimeout(() => {
        const memoryLetter = $("memoryLetter");

        if (memoryLetter) {
            memoryLetter.textContent = "❓";
        }

        const instruction = $("memoryInstruction");

        if (instruction) {
            instruction.textContent = "ما الحرف الذي رأيته؟";
        }

        const choices = getUniqueLetterChoices(item.letter, 4);

        const optionsHTML = `
            <div class="letter-options-grid">
                ${choices.map((choice, index) => `
                    <button
                        class="letter-game-option"
                        data-index="${index}"
                    >
                        ${choice}
                    </button>
                `).join("")}
            </div>

            <div id="letterGameMessage" class="game-message"></div>

            <button
                id="letterGameNext"
                class="game-next-btn"
                style="display:none"
                onclick="nextLetterGame()"
            >
                اللعبة التالية ➜
            </button>
        `;

        content.insertAdjacentHTML("beforeend", optionsHTML);

        content.querySelectorAll(".letter-game-option")
            .forEach((button, index) => {

                button.onclick = () => {
                    finishLetterGame(
                        choices[index] === item.letter,
                        button
                    );
                };
            });

    }, 2000);
}

/* =========================================================
   🎮 اللعبة 20
   التحدي الكبير
   ========================================================= */

function gameFinalChallenge(content, item) {
    const challengeType = Math.floor(Math.random() * 4);

    if (challengeType === 0) {
        content.innerHTML = `
            ${gameHeader("🏆 التحدي الكبير")}
            <div class="game-picture">${item.emoji}</div>
            <div class="game-question">
                اختر الحرف الصحيح للصورة
            </div>
        `;

        const choices = getUniqueLetterChoices(item.letter, 5);

        renderOptions(
            content,
            choices,
            item.letter,
            choice => choice,
            (value, button, correct) => {
                finishLetterGame(value === correct, button);
            }
        );

    } else if (challengeType === 1) {

        content.innerHTML = `
            ${gameHeader("🏆 التحدي الكبير")}
            <div class="game-word">${item.word}</div>
            <div class="game-question">
                ما أول حرف؟
            </div>
        `;

        const choices = getUniqueLetterChoices(item.letter, 5);

        renderOptions(
            content,
            choices,
            item.letter,
            choice => choice,
            (value, button, correct) => {
                finishLetterGame(value === correct, button);
            }
        );

    } else if (challengeType === 2) {

        content.innerHTML = `
            ${gameHeader("🏆 التحدي الكبير")}
            <div class="game-big-letter">${item.letter}</div>
            <div class="game-question">
                اختر الكلمة الصحيحة
            </div>
        `;

        const choices = getUniqueItems(item, 5);

        renderOptions(
            content,
            choices,
            item.word,
            choice => choice.word,
            (value, button, correct) => {
                finishLetterGame(value === correct, button);
            }
        );

    } else {

        content.innerHTML = `
            ${gameHeader("🏆 التحدي الكبير")}
            <div class="game-question">
                🔊 اسمع الحرف ثم اختره
            </div>

            <button
                class="game-next-btn"
                onclick="speak('${item.letter}')"
            >
                🔊 اسمع
            </button>
        `;

        const choices = getUniqueLetterChoices(item.letter, 5);

        renderOptions(
            content,
            choices,
            item.letter,
            choice => choice,
            (value, button, correct) => {
                finishLetterGame(value === correct, button);
            }
        );
    }
}

/* =========================================================
   ➡️ اللعبة التالية
   ========================================================= */

function nextLetterGame() {
    if (!letterGameAnswered) return;

    currentLetterGame++;

    if (currentLetterGame >= TOTAL_LETTER_GAMES) {

        addStars(20);

        const content = $("letterGameContent");

        if (content) {
            content.innerHTML = `
                <div class="game-category">🏆 أحسنت جدًا!</div>

                <div class="game-big-letter">
                    ${letters[currentLetterIndex].letter}
                </div>

                <div class="game-question">
                    أكملت الألعاب العشرين بنجاح 🎉
                </div>

                <div style="font-size:22px">
                    ⭐ مكافأة إضافية: ٢٠ نجمة
                </div>

                <button
                    class="game-next-btn"
                    onclick="nextLetter()"
                >
                    الحرف التالي ➜
                </button>
            `;
        }

        speak("ممتاز! أكملت جميع ألعاب الحرف");

        return;
    }

    renderLetterGamesBox();
}

function nextLetter() {
    currentLetterIndex++;

    if (currentLetterIndex >= letters.length) {
        currentLetterIndex = 0;

        speak("مبروك! أكملت جميع الحروف");
    }

    currentLetterGame = 0;
    letterGameAnswered = false;
    letterGameStars = 0;

    renderLetterPage();
}

function resetLetterGames() {
    currentLetterGame = 0;
    letterGameAnswered = false;
    renderLetterPage();
}

/* =========================================================
   🔗 توافق مع أزرار HTML القديمة
   ========================================================= */

window.speakCurrentLetter = speakCurrentLetter;
window.playLetterAudio = playLetterAudio;
window.nextLetter = nextLetter;
window.nextLetterGame = nextLetterGame;
window.resetLetterGames = resetLetterGames;

/* =========================================================
   📝 الكلمات
   ========================================================= */

const words = [
    { word: "أسد", emoji: "🦁" },
    { word: "بقرة", emoji: "🐄" },
    { word: "تفاح", emoji: "🍎" },
    { word: "ثعلب", emoji: "🦊" },
    { word: "جمل", emoji: "🐪" },
    { word: "حصان", emoji: "🐎" },
    { word: "خبز", emoji: "🍞" },
    { word: "دب", emoji: "🐻" },
    { word: "رمان", emoji: "🍎" },
    { word: "زرافة", emoji: "🦒" },
    { word: "سمكة", emoji: "🐟" },
    { word: "شمس", emoji: "☀️" },
    { word: "صقر", emoji: "🦅" },
    { word: "ضفدع", emoji: "🐸" },
    { word: "طائرة", emoji: "✈️" },
    { word: "فيل", emoji: "🐘" },
    { word: "قمر", emoji: "🌙" },
    { word: "كتاب", emoji: "📘" },
    { word: "ليمون", emoji: "🍋" },
    { word: "موز", emoji: "🍌" }
];

let currentWordIndex = 0;

function renderCurrentWord() {
    const item = words[currentWordIndex];

    if ($("currentWord")) {
        $("currentWord").textContent = item.word;
    }

    if ($("wordPicture")) {
        $("wordPicture").textContent = item.emoji;
    }

    const wordLetter = $("wordLetter");

    if (wordLetter) {
        wordLetter.textContent = item.word.charAt(0);
    }
}

function speakWord() {
    const item = words[currentWordIndex];
    speak(item.word);
}

function playCurrentWordAudio() {
    speakWord();
}

function nextWord() {
    currentWordIndex++;

    if (currentWordIndex >= words.length) {
        currentWordIndex = 0;
    }

    renderCurrentWord();
}

window.speakWord = speakWord;
window.playCurrentWordAudio = playCurrentWordAudio;
window.nextWord = nextWord;

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
        $("currentNumber").textContent = arabicNumber(currentNumber);
    }

    if ($("numberWord")) {
        $("numberWord").textContent =
            numberWords[currentNumber] || arabicNumber(currentNumber);
    }

    const items = $("numberItems");

    if (items) {
        const count = Math.min(currentNumber, 20);

        items.textContent = "🍎".repeat(count);
    }
}

function speakNumber() {
    speak(
        numberWords[currentNumber] ||
        arabicNumber(currentNumber)
    );
}

function nextNumber() {
    currentNumber++;

    if (currentNumber > 40) {
        currentNumber = 1;
    }

    renderCurrentNumber();
}

window.speakNumber = speakNumber;
window.nextNumber = nextNumber;

/* =========================================================
   ✍️ الكتابة
   ========================================================= */

let writingCanvas;
let writingCtx;
let writingDrawing = false;

let writingLetters = [
    "أ","ب","ت","ث","ج","ح","خ",
    "د","ذ","ر","ز","س","ش","ص",
    "ض","ط","ظ","ع","غ","ف","ق",
    "ك","ل","م","ن","ه","و","ي"
];

let writingIndex = 0;

function initWritingCanvas() {
    writingCanvas = $("writingCanvas");

    if (!writingCanvas) return;

    writingCtx = writingCanvas.getContext("2d");

    writingCtx.lineWidth = 6;
    writingCtx.lineCap = "round";

    const drawStart = (e) => {
        writingDrawing = true;

        const rect = writingCanvas.getBoundingClientRect();

        writingCtx.beginPath();
        writingCtx.moveTo(
            e.clientX - rect.left,
            e.clientY - rect.top
        );
    };

    const drawMove = (e) => {
        if (!writingDrawing) return;

        const rect = writingCanvas.getBoundingClientRect();

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
    const letter = writingLetters[writingIndex];

    if ($("writingLetter")) {
        $("writingLetter").textContent = letter;
    }

    if ($("writingMessage")) {
        $("writingMessage").textContent =
            `اكتب حرف ${letter}`;
    }
}

function clearWriting() {
    if (!writingCanvas || !writingCtx) return;

    writingCtx.clearRect(
        0,
        0,
        writingCanvas.width,
        writingCanvas.height
    );
}

function nextWritingLetter() {
    writingIndex++;

    if (writingIndex >= writingLetters.length) {
        writingIndex = 0;
    }

    clearWriting();
    renderWritingLetter();
}

window.initWritingCanvas = initWritingCanvas;
window.clearWriting = clearWriting;
window.nextWritingLetter = nextWritingLetter;

/* =========================================================
   ➕ الجمع
   ========================================================= */

let currentAddA = 1;
let currentAddB = 1;

function newAddition() {
    currentAddA = Math.floor(Math.random() * 9) + 1;
    currentAddB = Math.floor(Math.random() * 9) + 1;

    if ($("addA")) {
        $("addA").textContent = arabicNumber(currentAddA);
    }

    if ($("addB")) {
        $("addB").textContent = arabicNumber(currentAddB);
    }

    const answer = $("additionAnswer");

    if (answer) {
        answer.value = "";
    }

    if ($("additionMessage")) {
        $("additionMessage").textContent = "";
    }
}

function checkAddition() {
    const answer = $("additionAnswer");

    if (!answer) return;

    const userAnswer = Number(
        answer.value.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    );

    const correct = currentAddA + currentAddB;

    if (userAnswer === correct) {
        if ($("additionMessage")) {
            $("additionMessage").textContent =
                "🎉 أحسنت! إجابة صحيحة ⭐";
        }

        addStars(5);
        speak("أحسنت، إجابة صحيحة");
    } else {
        if ($("additionMessage")) {
            $("additionMessage").textContent =
                "😊 حاول مرة أخرى";
        }

        speak("حاول مرة أخرى");
    }
}

window.newAddition = newAddition;
window.checkAddition = checkAddition;

/* =========================================================
   ➖ الطرح
   ========================================================= */

let currentSubA = 5;
let currentSubB = 1;

function newSubtraction() {
    currentSubA = Math.floor(Math.random() * 10) + 2;
    currentSubB = Math.floor(Math.random() * currentSubA) + 1;

    if ($("subA")) {
        $("subA").textContent = arabicNumber(currentSubA);
    }

    if ($("subB")) {
        $("subB").textContent = arabicNumber(currentSubB);
    }

    const answer = $("subtractionAnswer");

    if (answer) {
        answer.value = "";
    }

    if ($("subtractionMessage")) {
        $("subtractionMessage").textContent = "";
    }
}

function checkSubtraction() {
    const answer = $("subtractionAnswer");

    if (!answer) return;

    const userAnswer = Number(
        answer.value.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    );

    const correct = currentSubA - currentSubB;

    if (userAnswer === correct) {
        if ($("subtractionMessage")) {
            $("subtractionMessage").textContent =
                "🎉 أحسنت! إجابة صحيحة ⭐";
        }

        addStars(5);
        speak("أحسنت، إجابة صحيحة");
    } else {
        if ($("subtractionMessage")) {
            $("subtractionMessage").textContent =
                "😊 حاول مرة أخرى";
        }

        speak("حاول مرة أخرى");
    }
}

window.newSubtraction = newSubtraction;
window.checkSubtraction = checkSubtraction;

/* =========================================================
   📖 القرآن الكريم
   ========================================================= */

const quranSurahs = [
    {
        name: "سورة الفاتحة",
        file: "001"
    },
    {
        name: "سورة الإخلاص",
        file: "112"
    },
    {
        name: "سورة الفلق",
        file: "113"
    },
    {
        name: "سورة الناس",
        file: "114"
    }
];

let currentSurahIndex = 0;
let currentQuranAudio = null;

function renderSurah() {
    const surah = quranSurahs[currentSurahIndex];

    if ($("surahTitle")) {
        $("surahTitle").textContent = surah.name;
    }

    if ($("surahText")) {
        $("surahText").textContent = getSurahText(surah.file);
    }
}

function getSurahText(file) {
    const texts = {
        "001":
            "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\nالرَّحْمَٰنِ الرَّحِيمِ\nمَالِكِ يَوْمِ الدِّينِ\nإِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ\nاهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ\nصِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",

        "112":
            "قُلْ هُوَ اللَّهُ أَحَدٌ\nاللَّهُ الصَّمَدُ\nلَمْ يَلِدْ وَلَمْ يُولَدْ\nوَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",

        "113":
            "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ\nمِنْ شَرِّ مَا خَلَقَ\nوَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ\nوَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ\nوَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",

        "114":
            "قُلْ أَعُوذُ بِرَبِّ النَّاسِ\nمَلِكِ النَّاسِ\nإِلَٰهِ النَّاسِ\nمِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ\nالَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ\nمِنَ الْجِنَّةِ وَالنَّاسِ"
    };

    return texts[file] || "";
}

function speakSurah() {
    const surah = quranSur
