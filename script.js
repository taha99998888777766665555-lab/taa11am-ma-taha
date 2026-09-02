/* =========================================================
   🌟 تعلم مع أ/ طه محمد 🌟
   script.js - النسخة الكاملة المصححة
   ========================================================= */

"use strict";

/* =========================================================
   🔧 أدوات عامة
   ========================================================= */

const $ = (id) => document.getElementById(id);

function arabicNumber(number) {
    return String(number).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
}

function normalizeNumber(value) {
    if (value === null || value === undefined) return NaN;

    return Number(
        String(value)
            .replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
            .replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
            .trim()
    );
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
   🔊 الصوت العربي
   ========================================================= */

let arabicVoice = null;

function findArabicVoice() {
    if (!("speechSynthesis" in window)) return null;

    const voices = speechSynthesis.getVoices();

    arabicVoice =
        voices.find(v => v.lang === "ar-SA") ||
        voices.find(v => v.lang === "ar-SA".toLowerCase()) ||
        voices.find(v => v.lang.startsWith("ar")) ||
        null;

    return arabicVoice;
}

if ("speechSynthesis" in window) {
    speechSynthesis.onvoiceschanged = findArabicVoice;

    setTimeout(findArabicVoice, 100);
    setTimeout(findArabicVoice, 500);
}

function speak(text, options = {}) {
    if (!("speechSynthesis" in window)) return;

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(String(text));

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
   ⭐ النجوم والمستوى والإحصائيات
   ========================================================= */

let stars = Number(localStorage.getItem("taha_app_stars") || 0);
let level = Number(localStorage.getItem("taha_app_level") || 1);

let correctLetters =
    Number(localStorage.getItem("taha_correct_letters") || 0);

let correctWords =
    Number(localStorage.getItem("taha_correct_words") || 0);

let correctNumbers =
    Number(localStorage.getItem("taha_correct_numbers") || 0);

let correctAddition =
    Number(localStorage.getItem("taha_correct_addition") || 0);

let correctSubtraction =
    Number(localStorage.getItem("taha_correct_subtraction") || 0);

function getStars() {
    return stars;
}

function addStars(amount) {
    stars += Number(amount) || 0;

    level = Math.floor(stars / 100) + 1;

    localStorage.setItem("taha_app_stars", stars);
    localStorage.setItem("taha_app_level", level);

    updateStats();
}

function updateStats() {
    const starsEl = $("stars");
    const levelEl = $("level");

    if (starsEl) {
        starsEl.textContent = arabicNumber(stars);
    }

    if (levelEl) {
        levelEl.textContent = arabicNumber(level);
    }

    if ($("rewardStars")) {
        $("rewardStars").textContent = arabicNumber(stars);
    }

    if ($("teacherStars")) {
        $("teacherStars").textContent = arabicNumber(stars);
    }

    if ($("teacherLevel")) {
        $("teacherLevel").textContent = arabicNumber(level);
    }

    if ($("teacherLetters")) {
        $("teacherLetters").textContent =
            arabicNumber(correctLetters);
    }

    if ($("teacherWords")) {
        $("teacherWords").textContent =
            arabicNumber(correctWords);
    }

    if ($("teacherNumbers")) {
        $("teacherNumbers").textContent =
            arabicNumber(correctNumbers);
    }

    if ($("teacherAddition")) {
        $("teacherAddition").textContent =
            arabicNumber(correctAddition);
    }

    if ($("teacherSubtraction")) {
        $("teacherSubtraction").textContent =
            arabicNumber(correctSubtraction);
    }
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

/* =========================================================
   🧭 التنقل بين الأقسام
   ========================================================= */

function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    const target = $(screenId);

    if (!target) {
        console.warn("القسم غير موجود:", screenId);
        return;
    }

    target.classList.add("active");

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

    updateStats();
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
            background: rgba(255,255,255,.96);
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

        .letter-game-option:disabled {
            cursor: default;
            opacity: .9;
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

        .number-choice {
            font-size: 28px;
        }

        #writingCanvas {
            touch-action: none;
            cursor: crosshair;
        }
    `;

    document.head.appendChild(style);
}

/* =========================================================
   🔤 اختيارات الحروف بدون تكرار
   ========================================================= */

function getUniqueLetterChoices(correctLetter, count = 3) {
    const wrong = shuffle(
        letters
            .map(item => item.letter)
            .filter(letter => letter !== correctLetter)
    ).slice(0, count - 1);

    return shuffle(
        unique([correctLetter, ...wrong])
    );
}

function getUniqueItems(correctItem, count = 3) {
    const others = shuffle(
        letters.filter(
            item => item.letter !== correctItem.letter
        )
    ).slice(0, count - 1);

    return shuffle(
        unique(
            [correctItem, ...others].map(item => item.letter)
        )
    ).map(letter =>
        letters.find(item => item.letter === letter)
    );
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
        `حرف ${item.letter} مثل ${item.word}`,
        {
            rate: 0.75
        }
    );
}

function playLetterAudio() {
    speakCurrentLetter();
}

/* =========================================================
   🎮 صندوق الألعاب
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
                اللعبة ${arabicNumber(currentLetterGame + 1)}
                من ${arabicNumber(TOTAL_LETTER_GAMES)}
            </div>

            <div class="game-progress">
                <div
                    class="game-progress-fill"
                    style="width:${(currentLetterGame / TOTAL_LETTER_GAMES) * 100}%"
                ></div>
            </div>

            <div id="letterGameContent"></div>

        </div>
    `;

    renderCurrentLetterGame();
}

/* =========================================================
   🎮 محرك الألعاب
   ========================================================= */

function renderCurrentLetterGame() {
    const content = $("letterGameContent");

    if (!content) return;

    letterGameAnswered = false;

    const item = letters[currentLetterIndex];

    switch (currentLetterGame) {

        case 0:
            gameChooseCorrectLetter(content, item);
            break;

        case 1:
            gameListenAndChoose(content, item);
            break;

        case 2:
            gameChoosePicture(content, item);
            break;

        case 3:
            gameChooseWordStartingLetter(content, item);
            break;

        case 4:
            gameFirstLetterOfWord(content);
            break;

        case 5:
            gameCompleteWord(content, item);
            break;

        case 6:
            gameFindLetter(content, item);
            break;

        case 7:
            gameMatchLetterPicture(content, item);
            break;

        case 8:
            gameMatchLetterWord(content, item);
            break;

        case 9:
            gameListenHaraka(content, item);
            break;

        case 10:
            gameListenWord(content, item);
            break;

        case 11:
            gameWhichWordDoesNotStart(content, item);
            break;

        case 12:
            gamePictureOnly(content, item);
            break;

        case 13:
            gameOddLookingLetter(content, item);
            break;

        case 14:
            gameLetterInContext(content, item);
            break;

        case 15:
            gamePictureToLetter(content, item);
            break;

        case 16:
            gameWhichWordContainsLetter(content, item);
            break;

        case 17:
            gameLetterRiddle(content, item);
            break;

        case 18:
            gameMemory(content, item);
            break;

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

function renderOptions(
    content,
    choices,
    correctValue,
    formatter,
    callback
) {
    const options = choices.map((choice, index) => {

        const value =
            choice && typeof choice === "object"
                ? (choice.letter || choice.word || "")
                : choice;

        return `
            <button
                class="letter-game-option"
                data-value="${String(value)
                    .replace(/&/g, "&amp;")
                    .replace(/"/g, "&quot;")}"
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

        <div
            id="letterGameMessage"
            class="game-message"
        ></div>

        <button
            id="letterGameNext"
            class="game-next-btn"
            style="display:none"
            onclick="nextLetterGame()"
        >
            اللعبة التالية ➜
        </button>
    `;

    content
        .querySelectorAll(".letter-game-option")
        .forEach(button => {

            button.addEventListener("click", () => {

                if (letterGameAnswered) return;

                callback(
                    button.dataset.value,
                    button,
                    correctValue
                );
            });

        });
}

function finishLetterGame(isCorrect, button = null) {
    if (letterGameAnswered) return;

    letterGameAnswered = true;

    const message = $("letterGameMessage");

    if (isCorrect) {

        if (button) {
            button.classList.add("correct");
        }

        letterGameStars += 5;

        addStars(5);

        correctLetters++;
        saveCounters();
        updateStats();

        if (message) {
            message.textContent =
                "🎉 أحسنت! حصلت على ⭐ ٥ نجوم";
        }

        speak(
            "أحسنت، إجابة صحيحة",
            {
                rate: 0.8,
                pitch: 1.1
            }
        );

    } else {

        if (button) {
            button.classList.add("wrong");
        }

        if (message) {
            message.textContent =
                "😊 حاول مرة أخرى";
        }

        speak(
            "حاول مرة أخرى",
            {
                rate: 0.8
            }
        );
    }

    document
        .querySelectorAll(".letter-game-option")
        .forEach(btn => {
            btn.disabled = true;
        });

    const next = $("letterGameNext");

    if (next) {
        next.style.display = "inline-block";
    }
}

/* =========================================================
   🎮 اللعبة 1
   ========================================================= */

function gameChooseCorrectLetter(content, item) {

    content.innerHTML = `
        ${gameHeader("اختر الحرف الصحيح")}

        <div class="game-question">
            أين حرف <strong>${item.letter}</strong>؟
        </div>
    `;

    const choices =
        getUniqueLetterChoices(item.letter, 3);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(
                value === correct,
                button
            );
        }
    );
}

/* =========================================================
   🎮 اللعبة 2
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

    const choices =
        getUniqueLetterChoices(item.letter, 4);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(
                value === correct,
                button
            );
        }
    );
}

/* =========================================================
   🎮 اللعبة 3
   ========================================================= */

function gameChoosePicture(content, item) {

    const choices =
        getUniqueItems(item, 3);

    content.innerHTML = `
        ${gameHeader("اختر الصورة")}

        <div class="game-question">
            اختر الصورة التي تبدأ بحرف
            <strong>${item.letter}</strong>
        </div>

        <div class="letter-options-grid">

            ${choices.map((choice, index) => `
                <button
                    class="letter-game-option"
                    data-index="${index}"
                >
                    <div class="game-picture">
                        ${choice.emoji}
                    </div>
                </button>
            `).join("")}

        </div>

        <div
            id="letterGameMessage"
            class="game-message"
        ></div>

        <button
            id="letterGameNext"
            class="game-next-btn"
            style="display:none"
            onclick="nextLetterGame()"
        >
            اللعبة التالية ➜
        </button>
    `;

    content
        .querySelectorAll(".letter-game-option")
        .forEach((button, index) => {

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
   ========================================================= */

function gameChooseWordStartingLetter(content, item) {

    const choices =
        getUniqueItems(item, 4);

    content.innerHTML = `
        ${gameHeader("اختر الكلمة")}

        <div class="game-question">
            أي كلمة تبدأ بحرف
            <strong>${item.letter}</strong>؟
        </div>
    `;

    renderOptions(
        content,
        choices,
        item.word,
        choice => choice.word,
        (value, button, correct) => {
            finishLetterGame(
                value === correct,
                button
            );
        }
    );
}

/* =========================================================
   🎮 اللعبة 5
   ========================================================= */

function gameFirstLetterOfWord(content) {

    const target =
        letters[currentLetterIndex];

    content.innerHTML = `
        ${gameHeader("أول حرف")}

        <div class="game-word">
            ${target.word}
        </div>

        <div class="game-question">
            ما أول حرف في كلمة
            <strong>${target.word}</strong>؟
        </div>
    `;

    const choices =
        getUniqueLetterChoices(target.letter, 3);

    renderOptions(
        content,
        choices,
        target.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(
                value === correct,
                button
            );
        }
    );
}

/* =========================================================
   🎮 اللعبة 6
   ========================================================= */

function gameCompleteWord(content, item) {

    const remaining =
        item.word.substring(1);

    content.innerHTML = `
        ${gameHeader("أكمل الكلمة")}

        <div class="game-word">
            ـ${remaining}
        </div>

        <div class="game-question">
            اختر الحرف الناقص
        </div>
    `;

    const choices =
        getUniqueLetterChoices(item.letter, 4);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(
                value === correct,
                button
            );
        }
    );
}

/* =========================================================
   🎮 اللعبة 7
   ========================================================= */

function gameFindLetter(content, item) {

    let choices =
        shuffle(letters)
            .filter(x => x.letter !== item.letter)
            .slice(0, 7)
            .map(x => x.letter);

    choices.push(item.letter);

    choices = shuffle(unique(choices));

    content.innerHTML = `
        ${gameHeader("ابحث عن الحرف")}

        <div class="game-question">
            ابحث عن حرف
            <strong>${item.letter}</strong>
        </div>
    `;

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(
                value === correct,
                button
            );
        }
    );
}

/* =========================================================
   🎮 اللعبة 8
   ========================================================= */

function gameMatchLetterPicture(content, item) {

    const choices =
        getUniqueItems(item, 4);

    content.innerHTML = `
        ${gameHeader("طابق الحرف مع الصورة")}

        <div class="game-big-letter">
            ${item.letter}
        </div>

        <div class="game-question">
            اختر الصورة المناسبة للحرف
        </div>

        <div class="letter-options-grid">

            ${choices.map((choice, index) => `
                <button
                    class="letter-game-option"
                    data-index="${index}"
                >
                    <div class="game-picture">
                        ${choice.emoji}
                    </div>
                </button>
            `).join("")}

        </div>

        <div
            id="letterGameMessage"
            class="game-message"
        ></div>

        <button
            id="letterGameNext"
            class="game-next-btn"
            style="display:none"
            onclick="nextLetterGame()"
        >
            اللعبة التالية ➜
        </button>
    `;

    content
        .querySelectorAll(".letter-game-option")
        .forEach((button, index) => {

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
   ========================================================= */

function gameMatchLetterWord(content, item) {

    const choices =
        getUniqueItems(item, 4);

    content.innerHTML = `
        ${gameHeader("طابق الحرف مع الكلمة")}

        <div class="game-big-letter">
            ${item.letter}
        </div>

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
            finishLetterGame(
                value === correct,
                button
            );
        }
    );
}

/* =========================================================
   🎮 اللعبة 10
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

    const choices =
        getUniqueLetterChoices(item.letter, 4);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(
                value === correct,
                button
            );
        }
    );
}

/* =========================================================
   🎮 اللعبة 11
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

    const choices =
        getUniqueLetterChoices(item.letter, 4);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {
            finishLetterGame(
                value === correct,
                button
            );
        }
    );
}

/* =========================================================
   🎮 اللعبة 12
   ========================================================= */

function gameWhichWordDoesNotStart(content, item) {

    const startsWith =
        shuffle(
            letters.filter(
                x => x.letter === item.letter
            )
        );

    const doesNotStart =
        shuffle(
            letters.filter(
                x => x.letter !== item.letter
            )
        ).slice(0, 1);

    const choices = shuffle([
        ...startsWith.slice(0, 3),
        ...doesNotStart
    ]);

    const correct =
        choices.find(
            x => x.letter !== item.letter
        );

    content.innerHTML = `
        ${gameHeader("الكلمة المختلفة")}

        <div class="game-question">
            أي كلمة <strong>لا تبدأ</strong>
            بحرف ${item.letter}؟
        </div>
    `;

    renderOptions(
        content,
        choices,
        correct.word,
        choice => choice.word,
        (value, button, correctValue) => {

            finishLetterGame(
                value === correctValue,
                button
            );
        }
    );
}

/* =========================================================
   🎮 اللعبة 13
   ========================================================= */

function gamePictureOnly(content, item) {

    content.innerHTML = `
        ${gameHeader("صورة فقط")}

        <div class="game-picture">
            ${item.emoji}
        </div>

        <div class="game-question">
            ما الحرف الذي تبدأ به هذه الصورة؟
        </div>
    `;

    const choices =
        getUniqueLetterChoices(item.letter, 4);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {

            finishLetterGame(
                value === correct,
                button
            );
        }
    );
}

/* =========================================================
   🎮 اللعبة 14
   ========================================================= */

function gameOddLookingLetter(content, item) {

    const groups = {
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

    let choices = unique([
        item.letter,
        ...(groups[item.letter] || [])
    ]);

    if (choices.length < 4) {

        const extra =
            shuffle(
                letters
                    .map(x => x.letter)
                    .filter(x => !choices.includes(x))
            );

        choices.push(
            ...extra.slice(
                0,
                4 - choices.length
            )
        );
    }

    choices =
        shuffle(choices.slice(0, 4));

    content.innerHTML = `
        ${gameHeader("انتبه للحروف المتشابهة")}

        <div class="game-question">
            أين حرف <strong>${item.letter}</strong>؟
        </div>

        <div>
            ركّز جيدًا 👀
        </div>
    `;

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {

            finishLetterGame(
                value === correct,
                button
            );
        }
    );
}

/* =========================================================
   🎮 اللعبة 15
   ========================================================= */

function gameLetterInContext(content, item) {

    const highlighted =
        item.word.replace(
            item.letter,
            `<span style="
                text-decoration:underline;
                font-size:1.25em
            ">${item.letter}</span>`
        );

    content.innerHTML = `
        ${gameHeader("الحرف داخل الكلمة")}

        <div class="game-word">
            ${highlighted}
        </div>

        <div class="game-question">
            ما الحرف الموجود في بداية الكلمة؟
        </div>
    `;

    const choices =
        getUniqueLetterChoices(item.letter, 3);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {

            finishLetterGame(
                value === correct,
                button
            );
        }
    );
}

/* =========================================================
   🎮 اللعبة 16
   ========================================================= */

function gamePictureToLetter(content, item) {

    content.innerHTML = `
        ${gameHeader("الصورة ← الحرف")}

        <div class="game-picture">
            ${item.emoji}
        </div>

        <div class="game-question">
            اختر الحرف الذي يناسب الصورة
        </div>
    `;

    const choices =
        getUniqueLetterChoices(item.letter, 4);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {

            finishLetterGame(
                value === correct,
                button
            );
        }
    );
}

/* =========================================================
   🎮 اللعبة 17
   ========================================================= */

function gameWhichWordContainsLetter(content, item) {

    const wrongWords =
        shuffle(
            letters.filter(
                x =>
                    x.letter !== item.letter &&
                    !x.word.includes(item.letter)
            )
        ).slice(0, 2);

    const choices =
        shuffle([
            item,
            ...wrongWords
        ]);

    content.innerHTML = `
        ${gameHeader("ابحث داخل الكلمات")}

        <div class="game-question">
            أي كلمة تحتوي على حرف
            <strong>${item.letter}</strong>؟
        </div>
    `;

    renderOptions(
        content,
        choices,
        item.word,
        choice => choice.word,
        (value, button, correct) => {

            finishLetterGame(
                value === correct,
                button
            );
        }
    );
}

/* =========================================================
   🎮 اللعبة 18
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

    const choices =
        getUniqueLetterChoices(item.letter, 4);

    renderOptions(
        content,
        choices,
        item.letter,
        choice => choice,
        (value, button, correct) => {

            finishLetterGame(
                value === correct,
                button
            );
        }
    );
}

/* =========================================================
   🎮 اللعبة 19
   ========================================================= */

function gameMemory(content, item) {

    content.innerHTML = `
        ${gameHeader("لعبة الذاكرة 🧠")}

        <div class="game-question">
            احفظ الحرف جيدًا...
        </div>

        <div
            id="memoryLetter"
            class="game-memory-hidden"
        >
            ${item.letter}
        </div>

        <div id="memoryInstruction">
            👀 لديك ثانيتان للحفظ
        </div>
    `;

    setTimeout(() => {

        if (!document.body.contains(content)) return;

        const memoryLetter =
            $("memoryLetter");

        if (memoryLetter) {
            memoryLetter.textContent = "❓";
        }

        const instruction =
            $("memoryInstruction");

        if (instruction) {
            instruction.textContent =
                "ما الحرف الذي رأيته؟";
        }

        const choices =
            getUniqueLetterChoices(item.letter, 4);

        content.insertAdjacentHTML(
            "beforeend",
            `
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

                <div
                    id="letterGameMessage"
                    class="game-message"
                ></div>

                <button
                    id="letterGameNext"
                    class="game-next-btn"
                    style="display:none"
                    onclick="nextLetterGame()"
                >
                    اللعبة التالية ➜
                </button>
            `
        );

        content
            .querySelectorAll(".letter-game-option")
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
   ========================================================= */

function gameFinalChallenge(content, item) {

    const type =
        Math.floor(Math.random() * 4);

    if (type === 0) {

        content.innerHTML = `
            ${gameHeader("🏆 التحدي الكبير")}

            <div class="game-picture">
                ${item.emoji}
            </div>

            <div class="game-question">
                اختر الحرف الصحيح للصورة
            </div>
        `;

        const choices =
            getUniqueLetterChoices(item.letter, 5);

        renderOptions(
            content,
            choices,
            item.letter,
            choice => choice,
            (value, button, correct) => {

                finishLetterGame(
                    value === correct,
                    button
                );
            }
        );

    } else if (type === 1) {

        content.innerHTML = `
            ${gameHeader("🏆 التحدي الكبير")}

            <div class="game-word">
                ${item.word}
            </div>

            <div class="game-question">
                ما أول حرف؟
            </div>
        `;

        const choices =
            getUniqueLetterChoices(item.letter, 5);

        renderOptions(
            content,
            choices,
            item.letter,
            choice => choice,
            (value, button, correct) => {

                finishLetterGame(
                    value === correct,
                    button
                );
            }
        );

    } else if (type === 2) {

        content.innerHTML = `
            ${gameHeader("🏆 التحدي الكبير")}

            <div class="game-big-letter">
                ${item.letter}
            </div>

            <div class="game-question">
                اختر الكلمة الصحيحة
            </div>
        `;

        const choices =
            getUniqueItems(item, 5);

        renderOptions(
            content,
            choices,
            item.word,
            choice => choice.word,
            (value, button, correct) => {

                finishLetterGame(
                    value === correct,
                    button
                );
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

        const choices =
            getUniqueLetterChoices(item.letter, 5);

        renderOptions(
            content,
            choices,
            item.letter,
            choice => choice,
            (value, button, correct) => {

                finishLetterGame(
                    value === correct,
                    button
                );
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

        const content =
            $("letterGameContent");

        if (content) {

            content.innerHTML = `
                <div class="game-category">
                    🏆 أحسنت جدًا!
                </div>

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

        speak(
            "ممتاز! أكملت جميع ألعاب الحرف"
        );

        return;
    }

    renderLetterGamesBox();
}

function nextLetter() {

    currentLetterIndex++;

    if (currentLetterIndex >= letters.length) {

        currentLetterIndex = 0;

        speak(
            "مبروك! أكملت جميع الحروف"
        );
    }

    currentLetterGame = 0;
    letterGameAnswered = false;
    letterGameStars = 0;

    renderLetterPage();
}

function resetLetterGames() {

    currentLetterGame = 0;
    letterGameAnswered = false;
    letterGameStars = 0;

    renderLetterPage();
}

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

    const item =
        words[currentWordIndex];

    if ($("currentWord")) {
        $("currentWord").textContent =
            item.word;
    }

    if ($("wordPicture")) {
        $("wordPicture").textContent =
            item.emoji;
    }

    if ($("wordLetter")) {
        $("wordLetter").textContent =
            item.word.charAt(0);
    }
}

function speakWord() {

    const item =
        words[currentWordIndex];

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

    const items =
        $("countItems");

    if (items) {

        const count =
            Math.min(currentNumber, 20);

        items.textContent =
            "🍎".repeat(count);
    }

    renderNumberOptions();
}

function speakNumber() {

    speak(
        numberWords[currentNumber] ||
        arabicNumber(currentNumber)
    );
}

function getNumberChoices(correctNumber) {

    const set = new Set([
        correctNumber
    ]);

    while (set.size < 4) {

        const offset =
            Math.floor(Math.random() * 7) - 3;

        const value =
            correctNumber + offset;

        if (value >= 1 && value <= 40) {
            set.add(value);
        }
    }

    return shuffle(
        [...set]
    );
}

function renderNumberOptions() {

    const box =
        $("numberOptions");

    if (!box) return;

    const choices =
        getNumberChoices(currentNumber);

    box.innerHTML = "";

    choices.forEach(number => {

        const button =
            document.createElement("button");

        button.className =
            "letter-game-option number-choice";

        button.textContent =
            arabicNumber(number);

        button.onclick = () => {

            const all =
                box.querySelectorAll("button");

            all.forEach(btn => {
                btn.disabled = true;
            });

            if (number === currentNumber) {

                button.classList.add("correct");

                if ($("numberMessage")) {
                    $("numberMessage").textContent =
                        "🎉 أحسنت! إجابة صحيحة ⭐";
                }

                addStars(5);

                correctNumbers++;
                saveCounters();
                updateStats();

                speak(
                    "أحسنت، إجابة صحيحة"
                );

            } else {

                button.classList.add("wrong");

                if ($("numberMessage")) {
                    $("numberMessage").textContent =
                        "😊 حاول مرة أخرى";
                }

                speak(
                    "حاول مرة أخرى"
                );
            }
        };

        box.appendChild(button);
    });
}

function nextNumber() {

    currentNumber++;

    if (currentNumber > 40) {
        currentNumber = 1;
    }

    if ($("numberMessage")) {
        $("numberMessage").textContent = "";
    }

    renderCurrentNumber();
}

/* =========================================================
   ✍️ الكتابة
   ========================================================= */

let writingCanvas = null;
let writingCtx = null;
let writingDrawing = false;

const writingLetters = [
    "أ","ب","ت","ث","ج","ح","خ",
    "د","ذ","ر","ز","س","ش","ص",
    "ض","ط","ظ","ع","غ","ف","ق",
    "ك","ل","م","ن","ه","و","ي"
];

let writingIndex = 0;

function setupWritingCanvasSize() {

    if (!writingCanvas) return;

    const rect =
        writingCanvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const ratio =
        Math.max(1, Math.min(3, window.devicePixelRatio || 1));

    writingCanvas.width =
        Math.round(rect.width * ratio);

    writingCanvas.height =
        Math.round(rect.height * ratio);

    writingCtx =
        writingCanvas.getContext("2d");

    writingCtx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );

    writingCtx.lineWidth = 6;
    writingCtx.lineCap = "round";
    writingCtx.lineJoin = "round";
}

function getCanvasPoint(e) {

    const rect =
        writingCanvas.getBoundingClientRect();

    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function initWritingCanvas() {

    writingCanvas =
        $("writingCanvas");

    if (!writingCanvas) return;

    if (!writingCanvas.style.height) {
        writingCanvas.style.height = "300px";
    }

    setupWritingCanvasSize();

    writingCanvas.onpointerdown =
        (e) => {

            e.preventDefault();

            writingDrawing = true;

            const point =
                getCanvasPoint(e);

            writingCtx.beginPath();

            writingCtx.moveTo(
                point.x,
                point.y
            );

            if (
                writingCanvas.setPointerCapture
            ) {
                try {
                    writingCanvas.setPointerCapture(
                        e.pointerId
                    );
                } catch (_) {}
            }
        };

    writingCanvas.onpointermove =
        (e) => {

            if (!writingDrawing) return;

            e.preventDefault();

            const point =
                getCanvasPoint(e);

            writingCtx.lineTo(
                point.x,
                point.y
            );

            writingCtx.stroke();
        };

    writingCanvas.onpointerup =
        () => {
            writingDrawing = false;
        };

    writingCanvas.onpointercancel =
        () => {
            writingDrawing = false;
        };

    writingCanvas.onpointerleave =
        () => {
            writingDrawing = false;
        };

    renderWritingLetter();
}

function renderWritingLetter() {

    const letter =
        writingLetters[writingIndex];

    if ($("writingGuide")) {
        $("writingGuide").textContent =
            letter;
    }

    if ($("writingLetter")) {
        $("writingLetter").textContent =
            letter;
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

function finishWriting() {

    if ($("writingMessage")) {
        $("writingMessage").textContent =
            "🎉 أحسنت! استمر في التدريب ⭐";
    }

    addStars(3);

    speak(
        "أحسنت، استمر في الكتابة",
        {
            rate: 0.8
        }
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

/* =========================================================
   ➕ الجمع
   ========================================================= */

let currentAddA = 1;
let currentAddB = 1;
let additionAnswered = false;

function renderAdditionPictures() {

    const box =
        $("addPictures");

    if (!box) return;

    const total =
        currentAddA + currentAddB;

    const first =
        "🍎".repeat(currentAddA);

    const second =
        "🍎".repeat(currentAddB);

    box.innerHTML = `
        <div style="
            font-size:32px;
            margin:10px;
            line-height:1.8;
        ">
            ${first}
            <span style="
                display:inline-block;
                margin:0 8px;
            ">➕</span>
            ${second}
        </div>

        <div style="
            font-size:22px;
            margin-top:10px;
        ">
            المجموع: ؟
        </div>
    `;
}

function newAddition() {

    additionAnswered = false;

    currentAddA =
        Math.floor(Math.random() * 9) + 1;

    currentAddB =
        Math.floor(Math.random() * 9) + 1;

    const question =
        $("addQuestion");

    if (question) {

        question.textContent =
            `${arabicNumber(currentAddA)} + ${arabicNumber(currentAddB)} = ؟`;
    }

    renderAdditionPictures();

    const answer =
        $("addAnswer");

    if (answer) {
        answer.value = "";
        answer.focus?.();
    }

    if ($("addMessage")) {
        $("addMessage").textContent = "";
    }
}

function checkAddition() {

    const answer =
        $("addAnswer");

    if (!answer) return;

    const userAnswer =
        normalizeNumber(answer.value);

    const correct =
        currentAddA + currentAddB;

    if (userAnswer === correct) {

        if (!additionAnswered) {

            additionAnswered = true;

            addStars(5);

            correctAddition++;
            saveCounters();
            updateStats();
        }

        if ($("addMessage")) {
            $("addMessage").textContent =
                "🎉 أحسنت! إجابة صحيحة ⭐";
        }

        speak(
            "أحسنت، إجابة صحيحة"
        );

    } else {

        if ($("addMessage")) {
            $("addMessage").textContent =
                "😊 حاول مرة أخرى";
        }

        speak(
            "حاول مرة أخرى"
        );
    }
}

/* =========================================================
   ➖ الطرح
   ========================================================= */

let currentSubA = 5;
let currentSubB = 1;
let subtractionAnswered = false;

function renderSubtractionPictures() {

    const box =
        $("subPictures");

    if (!box) return;

    const remaining =
        currentSubA - currentSubB;

    box.innerHTML = `
        <div style="
            font-size:30px;
            line-height:1.8;
        ">
            ${"🍎".repeat(currentSubA)}
        </div>

        <div style="
            font-size:21px;
            margin:8px 0;
        ">
            احذف ${arabicNumber(currentSubB)} تفاحة
            ➖
        </div>

        <div style="
            font-size:30px;
        ">
            المتبقي: ${arabicNumber(remaining)}
        </div>
    `;
}

function newSubtraction() {

    subtractionAnswered = false;

    currentSubA =
        Math.floor(Math.random() * 10) + 2;

    currentSubB =
        Math.floor(
            Math.random() * currentSubA
        ) + 1;

    const question =
        $("subQuestion");

    if (question) {

        question.textContent =
            `${arabicNumber(currentSubA)} - ${arabicNumber(currentSubB)} = ؟`;
    }

    renderSubtractionPictures();

    const answer =
        $("subAnswer");

    if (answer) {
        answer.value = "";
        answer.focus?.();
    }

    if ($("subMessage")) {
        $("subMessage").textContent = "";
    }
}

function checkSubtraction() {

    const answer =
        $("subAnswer");

    if (!answer) return;

    const userAnswer =
        normalizeNumber(answer.value);

    const correct =
        currentSubA - currentSubB;

    if (userAnswer === correct) {

        if (!subtractionAnswered) {

            subtractionAnswered = true;

            addStars(5);

            correctSubtraction++;
            saveCounters();
            updateStats();
        }

        if ($("subMessage")) {
            $("subMessage").textContent =
                "🎉 أحسنت! إجابة صحيحة ⭐";
        }

        speak(
            "أحسنت، إجابة صحيحة"
        );

    } else {

        if ($("subMessage")) {
            $("subMessage").textContent =
                "😊 حاول مرة أخرى";
        }

        speak(
            "حاول مرة أخرى"
        );
    }
}

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

    const surah =
        quranSurahs[currentSurahIndex];

    if ($("surahName")) {
        $("surahName").textContent =
            surah.name;
    }

    if ($("surahTitle")) {
        $("surahTitle").textContent =
            surah.name;
    }

    if ($("surahText")) {
        $("surahText").textContent =
            getSurahText(surah.file);
    }
}

function getSurahText(file) {

    const texts = {

        "001":
            "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\n" +
            "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\n" +
            "الرَّحْمَٰنِ الرَّحِيمِ\n" +
            "مَالِكِ يَوْمِ الدِّينِ\n" +
            "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ\n" +
            "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ\n" +
            "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",

        "112":
            "قُلْ هُوَ اللَّهُ أَحَدٌ\n" +
            "اللَّهُ الصَّمَدُ\n" +
            "لَمْ يَلِدْ وَلَمْ يُولَدْ\n" +
            "وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",

        "113":
            "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ\n" +
            "مِنْ شَرِّ مَا خَلَقَ\n" +
            "وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ\n" +
            "وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ\n" +
            "وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",

        "114":
            "قُلْ أَعُوذُ بِرَبِّ النَّاسِ\n" +
            "مَلِكِ النَّاسِ\n" +
            "إِلَٰهِ النَّاسِ\n" +
            "مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ\n" +
            "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ\n" +
            "مِنَ الْجِنَّةِ وَالنَّاسِ"
    };

    return texts[file] || "";
}

function speakSurah() {

    const surah =
        quranSurahs[currentSurahIndex];

    /*
       تشغيل تلاوة محلية إذا كان هناك ملف صوت
       باسم السورة داخل مجلد sounds.
    */

    if (currentQuranAudio) {

        currentQuranAudio.pause();
        currentQuranAudio.currentTime = 0;
        currentQuranAudio = null;
    }

    const audioPaths = [
        `sounds/${surah.file}.mp3`,
        `sound/${surah.file}.mp3`,
        `sounds/quran/${surah.file}.mp3`
    ];

    let tried = false;

    const tryAudio = (index) => {

        if (index >= audioPaths.length) {

            speak(
                getSurahText(surah.file),
                {
                    rate: 0.65
                }
            );

            return;
        }

        const audio =
            new Audio(audioPaths[index]);

        audio.preload = "auto";

        audio.oncanplaythrough = () => {

            if (tried) return;

            tried = true;

            currentQuranAudio =
                audio;

            audio.play().catch(() => {
                speak(
                    getSurahText(surah.file),
                    {
                        rate: 0.65
                    }
                );
            });
        };

        audio.onerror = () => {

            if (!tried) {
                tryAudio(index + 1);
            }
        };

        audio.load();
    };

    tryAudio(0);
}

function nextSurah() {

    if (currentQuranAudio) {

        currentQuranAudio.pause();
        currentQuranAudio.currentTime = 0;
        currentQuranAudio = null;
    }

    if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
    }

    currentSurahIndex++;

    if (
        currentSurahIndex >=
        quranSurahs.length
    ) {
        currentSurahIndex = 0;
    }

    renderSurah();
}

/* =========================================================
   📜 الأحاديث
   ========================================================= */

const hadiths = [
    {
        text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
        source: "رواه البخاري ومسلم",
        meaning: "الأعمال تكون بحسب النية."
    },
    {
        text: "مَنْ لا يَرْحَمْ لا يُرْحَمْ",
        source: "رواه البخاري ومسلم",
        meaning: "ارحم الناس يرحمك الله."
    },
    {
        text: "خَيْرُكُمْ مَنْ تَعَلَّمَ القُرْآنَ وَعَلَّمَهُ",
        source: "رواه البخاري",
        meaning: "أفضل الناس من يتعلم القرآن ويعلمه."
    },
    {
        text: "المُسْلِمُ مَنْ سَلِمَ المُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
        source: "رواه البخاري ومسلم",
        meaning: "المسلم لا يؤذي الآخرين بلسانه أو يده."
    },
    {
        text: "لا تَغْضَبْ",
        source: "رواه البخاري",
        meaning: "حاول أن تتحكم في غضبك."
    }
];

let currentHadithIndex = 0;

function renderHadith() {

    const hadith =
        hadiths[currentHadithIndex];

    if ($("hadithText")) {
        $("hadithText").textContent =
            hadith.text;
    }

    if ($("hadithSource")) {
        $("hadithSource").textContent =
            hadith.source;
    }

    if ($("hadithMeaning")) {
        $("hadithMeaning").textContent =
            hadith.meaning;
    }

    if ($("hadithImage")) {
        $("hadithImage").textContent =
            "📖";
    }
}

function speakHadith() {

    const hadith =
        hadiths[currentHadithIndex];

    speak(
        `${hadith.text}. ${hadith.meaning}`,
        {
            rate: 0.7
        }
    );
}

function nextHadith() {

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
   🤲 الأدعية وأذكار الصباح والمساء
   ========================================================= */

const duas = [

    {
        title: "دعاء الاستيقاظ",
        text:
            "الحمد لله الذي أحيانا بعدما أماتنا وإليه النشور."
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
        title: "ذكر من أذكار الصباح",
        text:
            "أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له."
    },

    {
        title: "ذكر من أذكار المساء",
        text:
            "أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له."
    },

    {
        title: "سيد الاستغفار",
        text:
            "اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت."
    },

    {
        title: "ذكر",
        text:
            "سبحان الله وبحمده."
    }
];

let currentDuaIndex = 0;

function renderDua() {

    const dua =
        duas[currentDuaIndex];

    if ($("duaTitle")) {
        $("duaTitle").textContent =
            dua.title;
    }

    if ($("duaText")) {
        $("duaText").textContent =
            dua.text;
    }
}

function speakDua() {

    const dua =
        duas[currentDuaIndex];

    speak(
        `${dua.title}. ${dua.text}`,
        {
            rate: 0.7
        }
    );
}

function nextDua() {

    currentDuaIndex++;

    if (
        currentDuaIndex >=
        duas.length
    ) {
        currentDuaIndex = 0;
    }

    renderDua();
}

/* =========================================================
   🎁 المكافآت
   ========================================================= */

function renderRewards() {
    updateStats();
}

/* =========================================================
   👨‍🏫 المعلم
   ========================================================= */

function renderTeacher() {
    updateStats();
}

/* =========================================================
   🗑️ تصفير التقدم
   ========================================================= */

function resetProgress() {
const modal =
        $("confirmModal");

    const modalText =
        $("confirmModalText");

    if (modalText) {
        modalText.textContent =
            "هل أنت متأكد أنك تريد تصفير جميع النجوم والمستوى والتقدم؟";
    }

    if (modal) {
        modal.hidden = false;
    }
}

function closeConfirmModal() {

    const modal =
        $("confirmModal");

    if (modal) {
        modal.hidden = true;
    }
}

function confirmResetProgress() {

    stars = 0;
    level = 1;

    correctLetters = 0;
    correctWords = 0;
    correctNumbers = 0;
    correctAddition = 0;
    correctSubtraction = 0;

    localStorage.removeItem(
        "taha_app_stars"
    );

    localStorage.removeItem(
        "taha_app_level"
    );

    localStorage.removeItem(
        "taha_correct_letters"
    );

    localStorage.removeItem(
        "taha_correct_words"
    );

    localStorage.removeItem(
        "taha_correct_numbers"
    );

    localStorage.removeItem(
        "taha_correct_addition"
    );

    localStorage.removeItem(
        "taha_correct_subtraction"
    );

    updateStats();

    closeConfirmModal();

    speak(
        "تم تصفير التقدم"
    );
}

/* =========================================================
   🪟 المودال
   ========================================================= */

function setupModal() {

    const yes =
        $("confirmModalYes");

    const no =
        $("confirmModalNo");

    if (yes) {
        yes.onclick =
            confirmResetProgress;
    }

    if (no) {
        no.onclick =
            closeConfirmModal;
    }

    const modal =
        $("confirmModal");

    if (modal) {

        modal.addEventListener(
            "click",
            (event) => {

                if (event.target === modal) {
                    closeConfirmModal();
                }
            }
        );
    }
}

/* =========================================================
   🔗 توافق كامل مع index.html
   ========================================================= */

window.$ = $;

window.speak = speak;

window.showScreen = showScreen;

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

window.speakWord =
    speakWord;

window.playCurrentWordAudio =
    playCurrentWordAudio;

window.nextWord =
    nextWord;

window.speakNumber =
    speakNumber;

/* HTML القديم يستخدم newNumber */
window.newNumber =
    nextNumber;

window.nextNumber =
    nextNumber;

window.initWritingCanvas =
    initWritingCanvas;

window.clearWriting =
    clearWriting;

/* HTML يستخدم clearCanvas */
window.clearCanvas =
    clearWriting;

/* HTML يستخدم finishWriting */
window.finishWriting =
    finishWriting;

window.nextWritingLetter =
    nextWritingLetter;

/* HTML يستخدم newWritingLetter */
window.newWritingLetter =
    newWritingLetter;

window.newAddition =
    newAddition;

window.checkAddition =
    checkAddition;

window.newSubtraction =
    newSubtraction;

window.checkSubtraction =
    checkSubtraction;

window.speakSurah =
    speakSurah;

window.nextSurah =
    nextSurah;

window.speakHadith =
    speakHadith;

window.nextHadith =
    nextHadith;

window.speakDua =
    speakDua;

window.nextDua =
    nextDua;

window.resetProgress =
    resetProgress;

/* =========================================================
   🚀 تشغيل أولي
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupModal();

        updateStats();

        renderCurrentWord();

        renderCurrentNumber();

        renderWritingLetter();

        renderSurah();

        renderHadith();

        renderDua();

        /*
           لا نغيّر الصفحة النشطة الموجودة
           في index.html.
        */
    }
);

/* =========================================================
   🌟 نهاية الملف
   ========================================================= */
    
