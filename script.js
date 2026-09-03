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

let arabicVoice = null;

function findArabicVoice() {
    if (!("speechSynthesis" in window)) return null;

    const voices = speechSynthesis.getVoices();

    arabicVoice =
        voices.find(
            voice =>
                voice.lang &&
                voice.lang.toLowerCase() === "ar-sa"
        ) ||
        voices.find(
            voice =>
                voice.lang &&
                voice.lang.toLowerCase().startsWith("ar")
        ) ||
        null;

    return arabicVoice;
}

if ("speechSynthesis" in window) {
    speechSynthesis.onvoiceschanged = findArabicVoice;
    findArabicVoice();
}

/* =========================================================
🔊 AudioManager
========================================================= */

const AudioManager = (() => {

    let activeAudio = null;
    let activeAudioId = null;
    let lastSpeechTime = 0;

    function stop() {

        if ("speechSynthesis" in window) {
            try {
                speechSynthesis.cancel();
            } catch (error) {}
        }

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

        if (!("speechSynthesis" in window)) return;

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

        const utterance =
            new SpeechSynthesisUtterance(textToSpeak);

        utterance.lang =
            options.lang || "ar-SA";

        utterance.rate =
            options.rate ?? 0.82;

        utterance.pitch =
            options.pitch ?? 1;

        utterance.volume =
            options.volume ?? 1;

        if (!arabicVoice) {
            findArabicVoice();
        }

        if (arabicVoice) {
            utterance.voice = arabicVoice;
        }

        speechSynthesis.speak(utterance);
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

    const style =
        document.createElement("style");

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
            grid-template-columns:
                repeat(auto-fit,minmax(85px,1fr));
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
🔤 اختيارات
========================================================= */

function getUniqueLetterChoices(correctLetter, count = 3) {

    const wrongLetters =
        shuffle(
            letters
                .map(item => item.letter)
                .filter(
                    letter =>
                        normalizeArabicText(letter) !==
                        normalizeArabicText(correctLetter)
                )
        ).slice(0, count - 1);

    return shuffle(
        unique([
            correctLetter,
            ...wrongLetters
        ])
    );
}

function getUniqueItems(correctItem, count = 3) {

    const others =
        shuffle(
            letters.filter(
                item =>
                    normalizeArabicText(item.letter) !==
                    normalizeArabicText(correctItem.letter)
            )
        ).slice(0, count - 1);

    return shuffle(
        unique([
            correctItem,
            ...others
        ])
    );
}

/* =========================================================
🔤 صفحة الحروف
========================================================= */

function renderLetterPage() {

    addLetterGameStyles();

    const item =
        letters[currentLetterIndex];

    if ($("currentLetter")) {
        $("currentLetter").textContent =
            letterWithFatha(item.letter);
    }

    if ($("letterPicture")) {
        $("letterPicture").textContent =
            item.emoji;
    }

    if ($("letterWord")) {
        $("letterWord").textContent =
            item.word;
    }

    renderLetterGamesBox();
}

function speakCurrentLetter() {

    const item =
        letters[currentLetterIndex];

    speak(
        `حرف ${item.letter}، ${letterWithFatha(item.letter)}، مثل ${item.word}`,
        {
            rate: 0.75
        }
    );
}

function playLetterAudio() {
    speakCurrentLetter();
}

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

    const box =
        getLetterGamesBox();

    if (!box) return;

    const progress =
        (currentLetterGame /
            TOTAL_LETTER_GAMES) *
        100;

    box.innerHTML = `
        <div class="letter-game-card">

            <div class="game-number">
                اللعبة
                ${arabicNumber(currentLetterGame + 1)}
                من
                ${arabicNumber(TOTAL_LETTER_GAMES)}
            </div>

            <div class="game-progress">
                <div
                    class="game-progress-fill"
                    style="width:${progress}%"
                ></div>
            </div>

            <div id="letterGameContent"></div>

        </div>
    `;

    renderCurrentLetterGame();
}

/* =========================================================
🎮 محرك ألعاب الحروف
========================================================= */

function renderCurrentLetterGame() {

    const content =
        $("letterGameContent");

    if (!content) return;

    stopAllAudio();
    invalidateLetterGameSession();

    letterGameAnswered = false;

    const item =
        letters[currentLetterIndex];

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

function gameHeader(title, subtitle = "") {

    return `
        <div class="game-category">
            ${title}
        </div>

        ${
            subtitle
                ? `<div>${subtitle}</div>`
                : ""
        }
    `;
}

function getOptionValue(choice, valueType) {

    if (
        typeof choice === "object" &&
        choice !== null
    ) {
        return valueType === "word"
            ? choice.word || ""
            : choice.letter || "";
    }

    return choice;
}

function renderOptions(
    content,
    choices,
    correctValue,
    valueType,
    formatter,
    callback
) {

    content.innerHTML += `
        <div class="letter-options-grid">
            ${
                choices.map(
                    (choice, index) => `
                        <button
                            class="letter-game-option"
                            data-index="${index}"
                            type="button"
                        >
                            ${formatter(choice)}
                        </button>
                    `
                ).join("")
            }
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
            type="button"
        >
            اللعبة التالية ➜
        </button>
    `;

    content
        .querySelectorAll(".letter-game-option")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    if (letterGameAnswered) return;

                    const index =
                        Number(button.dataset.index);

                    const choice =
                        choices[index];

                    const value =
                        getOptionValue(
                            choice,
                            valueType
                        );

                    callback(
                        value,
                        button,
                        correctValue,
                        choice
                    );
                }
            );
        });
}

/* =========================================================
🏆 نتيجة لعبة الحروف
========================================================= */

function finishLetterGame(isCorrect, button = null) {

    if (letterGameAnswered) return;

    if (isCorrect) {

        letterGameAnswered = true;

        if (button) {
            button.classList.add("correct");
        }

        letterGameStars += 5;

        correctLetters++;

        saveCounters();

        addStars(5);

        const message =
            $("letterGameMessage");

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

        document
            .querySelectorAll(".letter-game-option")
            .forEach(btn => {
                btn.disabled = true;
            });

        const next =
            $("letterGameNext");

        if (next) {
            next.style.display =
                "inline-block";
        }

    } else {

        if (button) {
            button.classList.add("wrong");
        }

        const message =
            $("letterGameMessage");

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
}

/* =========================================================
🎮 الألعاب 1 - 18
========================================================= */

function gameChooseCorrectLetter(content, item) {

    content.innerHTML = `
        ${gameHeader("اختر الحرف الصحيح")}

        <div class="game-question">
            أين حرف
            <strong>${letterWithFatha(item.letter)}</strong>؟
        </div>
    `;

    const choices =
        getUniqueLetterChoices(item.letter, 3);

    renderOptions(
        content,
        choices,
        item.letter,
        "letter",
        choice => letterWithFatha(choice),
        (value, button, correct) => {
            finishLetterGame(
                matchAnswer(value, correct, "letter"),
                button
            );
        }
    );
}

function gameListenAndChoose(content, item) {

    content.innerHTML = `
        ${gameHeader("اسمع واختر")}

        <div class="game-question">
            🔊 اضغط على الزر ثم اختر الحرف الذي سمعته
        </div>

        <button
            class="game-next-btn"
            onclick="speak('${item.letter}')"
            type="button"
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
        "letter",
        choice => letterWithFatha(choice),
        (value, button, correct) => {
            finishLetterGame(
                matchAnswer(value, correct, "letter"),
                button
            );
        }
    );
}

function gameChoosePicture(content, item) {

    const choices =
        getUniqueItems(item, 3);

    content.innerHTML = `
        ${gameHeader("اختر الصورة")}

        <div class="game-question">
            اختر الصورة التي تبدأ بحرف
            <strong>${letterWithFatha(item.letter)}</strong>
        </div>

        <div class="letter-options-grid">
            ${
                choices.map(
                    (choice, index) => `
                        <button
                            class="letter-game-option"
                            type="button"
                        >
                            <div class="game-picture">
                                ${choice.emoji}
                            </div>
                        </button>
                    `
                ).join("")
            }
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
            type="button"
        >
            اللعبة التالية ➜
        </button>
    `;

    content
        .querySelectorAll(".letter-game-option")
        .forEach((button, index) => {

            button.onclick = () => {

                finishLetterGame(
                    wordStartsWithLetter(
                        choices[index].word,
                        item.letter
                    ),
                    button
                );
            };
        });
}

function gameChooseWordStartingLetter(content, item) {

    const choices =
        getUniqueItems(item, 4);

    content.innerHTML = `
        ${gameHeader("اختر الكلمة")}

        <div class="game-question">
            أي كلمة تبدأ بحرف
            <strong>${letterWithFatha(item.letter)}</strong>؟
        </div>
    `;

    renderOptions(
        content,
        choices,
        item.word,
        "word",
        choice => choice.word,
        (value, button) => {

            finishLetterGame(
                matchAnswer(
                    value,
                    item.word,
                    "word",
                    item.letter
                ),
                button
            );
        }
    );
}

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
        getUniqueLetterChoices(
            target.letter,
            3
        );

    renderOptions(
        content,
        choices,
        target.letter,
        "letter",
        choice => letterWithFatha(choice),
        (value, button) => {

            finishLetterGame(
                matchAnswer(
                    value,
                    getFirstArabicLetter(target.word),
                    "letter"
                ),
                button
            );
        }
    );
}

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
        getUniqueLetterChoices(
            item.letter,
            4
        );

    renderOptions(
        content,
        choices,
        item.letter,
        "letter",
        choice => letterWithFatha(choice),
        (value, button, correct) => {

            finishLetterGame(
                matchAnswer(value, correct, "letter"),
                button
            );
        }
    );
}

function gameFindLetter(content, item) {

    let allLetters =
        shuffle(letters)
            .slice(0, 8)
            .map(x => x.letter);

    if (!allLetters.includes(item.letter)) {
        allLetters[0] = item.letter;
    }

    const choices =
        unique(allLetters);

    content.innerHTML = `
        ${gameHeader("ابحث عن الحرف")}

        <div class="game-question">
            ابحث عن حرف
            <strong>${letterWithFatha(item.letter)}</strong>
        </div>
    `;

    renderOptions(
        content,
        choices,
        item.letter,
        "letter",
        choice => letterWithFatha(choice),
        (value, button, correct) => {

            finishLetterGame(
                matchAnswer(value, correct, "letter"),
                button
            );
        }
    );
}

function gameMatchLetterPicture(content, item) {

    const choices =
        getUniqueItems(item, 4);

    content.innerHTML = `
        ${gameHeader("طابق الحرف مع الصورة")}

        <div class="game-big-letter">
            ${letterWithFatha(item.letter)}
        </div>

        <div class="game-question">
            اختر الصورة المناسبة للحرف
        </div>

        <div class="letter-options-grid">
            ${
                choices.map(
                    choice => `
                        <button
                            class="letter-game-option"
                            type="button"
                        >
                            <div class="game-picture">
                                ${choice.emoji}
                            </div>
                        </button>
                    `
                ).join("")
            }
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
            type="button"
        >
            اللعبة التالية ➜
        </button>
    `;

    content
        .querySelectorAll(".letter-game-option")
        .forEach((button, index) => {

            button.onclick = () => {

                finishLetterGame(
                    wordStartsWithLetter(
                        choices[index].word,
                        item.letter
                    ),
                    button
                );
            };
        });
}

function gameMatchLetterWord(content, item) {

    const choices =
        getUniqueItems(item, 4);

    content.innerHTML = `
        ${gameHeader("طابق الحرف مع الكلمة")}

        <div class="game-big-letter">
            ${letterWithFatha(item.letter)}
        </div>

        <div class="game-question">
            اختر الكلمة المناسبة للحرف
        </div>
    `;

    renderOptions(
        content,
        choices,
        item.word,
        "word",
        choice => choice.word,
        (value, button) => {

            finishLetterGame(
                matchAnswer(
                    value,
                    item.word,
                    "word",
                    item.letter
                ),
                button
            );
        }
    );
}

function gameListenHaraka(content, item) {

    const sound =
        letterWithFatha(item.letter);

    content.innerHTML = `
        ${gameHeader("اسمع صوت الحرف")}

        <div class="game-question">
            🔊 اسمع الصوت واختر الحرف
        </div>

        <button
            class="game-next-btn"
            onclick="speak('${sound}')"
            type="button"
        >
            🔊 اسمع
        </button>
    `;

    const choices =
        getUniqueLetterChoices(
            item.letter,
            4
        );

    renderOptions(
        content,
        choices,
        item.letter,
        "letter",
        choice => letterWithFatha(choice),
        (value, button, correct) => {

            finishLetterGame(
                matchAnswer(value, correct, "letter"),
                button
            );
        }
    );
}

function gameListenWord(content, item) {

    content.innerHTML = `
        ${gameHeader("اسمع الكلمة")}

        <div class="game-question">
            🔊 اسمع الكلمة ثم اختر أول حرف فيها
        </div>

        <button
            class="game-next-btn"
            onclick="speak('${item.word}')"
            type="button"
        >
            🔊 اسمع الكلمة
        </button>
    `;

    const choices =
        getUniqueLetterChoices(
            item.letter,
            4
        );

    renderOptions(
        content,
        choices,
        item.letter,
        "letter",
        choice => letterWithFatha(choice),
        (value, button) => {

            finishLetterGame(
                matchAnswer(
                    value,
                    getFirstArabicLetter(item.word),
                    "letter"
                ),
                button
            );
        }
    );
}

function gameWhichWordDoesNotStart(content, item) {

    const wrongWordObjs =
        shuffle(
            letters.filter(
                x =>
                    !wordStartsWithLetter(
                        x.word,
                        item.letter
                    )
            )
        ).slice(0, 3);

    if (!wrongWordObjs.length) return;

    const choices =
        shuffle([
            item,
            ...wrongWordObjs
        ]);

    content.innerHTML = `
        ${gameHeader("اختيار الكلمة المختلفة")}

        <div class="game-question">
            أي كلمة <strong>لا تبدأ</strong>
            بحرف
            ${letterWithFatha(item.letter)}؟
        </div>
    `;

    renderOptions(
        content,
        choices,
        wrongWordObjs[0].word,
        "word",
        choice => choice.word,
        (value, button) => {

            finishLetterGame(
                !wordStartsWithLetter(
                    value,
                    item.letter
                ),
                button
            );
        }
    );
}

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
        getUniqueLetterChoices(
            item.letter,
            4
        );

    renderOptions(
        content,
        choices,
        item.letter,
        "letter",
        choice => letterWithFatha(choice),
        (value, button) => {

            finishLetterGame(
                wordStartsWithLetter(
                    item.word,
                    value
                ),
                button
            );
        }
    );
}

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

    let choices =
        unique([
            item.letter,
            ...(similarGroups[item.letter] || [])
        ]).slice(0, 4);

    while (choices.length < 4) {

        const extra =
            shuffle(
                letters
                    .map(x => x.letter)
                    .filter(x => !choices.includes(x))
            )[0];

        if (!extra) break;

        choices.push(extra);
    }

    choices = shuffle(choices);

    content.innerHTML = `
        ${gameHeader("انتبه للحروف المتشابهة")}

        <div class="game-question">
            أين حرف
            <strong>${letterWithFatha(item.letter)}</strong>؟
        </div>

        <div>ركّز جيدًا 👀</div>
    `;

    renderOptions(
        content,
        choices,
        item.letter,
        "letter",
        choice => letterWithFatha(choice),
        (value, button, correct) => {

            finishLetterGame(
                matchAnswer(value, correct, "letter"),
                button
            );
        }
    );
}

function gameLetterInContext(content, item) {

    const index =
        item.word.indexOf(item.letter);

    let highlighted = item.word;

    if (index !== -1) {

        highlighted =
            item.word.substring(0, index) +

            `<span style="
                text-decoration:underline;
                font-size:1.25em;
            ">
                ${item.word.charAt(index)}
            </span>` +

            item.word.substring(index + 1);
    }

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
        getUniqueLetterChoices(
            item.letter,
            3
        );

    renderOptions(
        content,
        choices,
        item.letter,
        "letter",
        choice => letterWithFatha(choice),
        (value, button, correct) => {

            finishLetterGame(
                matchAnswer(value, correct, "letter"),
                button
            );
        }
    );
}

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
        getUniqueLetterChoices(
            item.letter,
            4
        );

    renderOptions(
        content,
        choices,
        item.letter,
        "letter",
        choice => letterWithFatha(choice),
        (value, button) => {

            finishLetterGame(
                wordStartsWithLetter(
                    item.word,
                    value
                ),
                button
            );
        }
    );
}

function gameWhichWordContainsLetter(content, item) {

    const correctWords =
        letters.filter(
            x =>
                wordContainsLetter(
                    x.word,
                    item.letter
                )
        );

    const wrongWords =
        letters.filter(
            x =>
                !wordContainsLetter(
                    x.word,
                    item.letter
                )
        );

    const correctItem =
        correctWords.find(
            x => x.word === item.word
        ) || item;

    const wrongChoices =
        shuffle(wrongWords).slice(0, 2);

    const candidates =
        shuffle([
            correctItem,
            ...wrongChoices
        ]);

    content.innerHTML = `
        ${gameHeader("ابحث داخل الكلمات")}

        <div class="game-question">
            أي كلمة تحتوي على حرف
            <strong>${letterWithFatha(item.letter)}</strong>؟
        </div>
    `;

    renderOptions(
        content,
        candidates,
        correctItem.word,
        "word",
        choice => choice.word,
        (value, button) => {

            finishLetterGame(
                wordContainsLetter(
                    value,
                    item.letter
                ),
                button
            );
        }
    );
}

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
        getUniqueLetterChoices(
            item.letter,
            4
        );

    renderOptions(
        content,
        choices,
        item.letter,
        "letter",
        choice => letterWithFatha(choice),
        (value, button) => {

            finishLetterGame(
                wordStartsWithLetter(
                    item.word,
                    value
                ),
                button
            );
        }
    );
}

/* =========================================================
🎮 لعبة الذاكرة
========================================================= */

function gameMemory(content, item) {

    invalidateLetterGameSession();

    const session =
        letterGameSessionToken;

    content.innerHTML = `
        ${gameHeader("لعبة الذاكرة 🧠")}

        <div class="game-question">
            احفظ الحرف جيدًا...
        </div>

        <div
            id="memoryLetter"
            class="game-memory-hidden"
        >
            ${letterWithFatha(item.letter)}
        </div>

        <div id="memoryInstruction">
            👀 لديك ثانيتان للحفظ
        </div>
    `;

    memoryTimer =
        setTimeout(() => {

            memoryTimer = null;

            if (
                session !==
                letterGameSessionToken
            ) return;

            if (currentLetterGame !== 18) return;

            const currentContent =
                $("letterGameContent");

            if (
                !currentContent ||
                !currentContent.isConnected
            ) return;

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
                getUniqueLetterChoices(
                    item.letter,
                    4
                );

            currentContent.insertAdjacentHTML(
                "beforeend",
                `
                    <div class="letter-options-grid">

                        ${
                            choices.map(
                                choice => `
                                    <button
                                        class="letter-game-option"
                                        type="button"
                                    >
                                        ${letterWithFatha(choice)}
                                    </button>
                                `
                            ).join("")
                        }

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
                        type="button"
                    >
                        اللعبة التالية ➜
                    </button>
                `
            );

            currentContent
                .querySelectorAll(
                    ".letter-game-option"
                )
                .forEach(
                    (button, index) => {

                        button.onclick = () => {

                            if (
                                session !==
                                letterGameSessionToken
                            ) return;

                            finishLetterGame(
                                matchAnswer(
                                    choices[index],
                                    item.letter,
                                    "letter"
                                ),
                                button
                            );
                        };
                    }
                );

        }, 2000);
}

/* =========================================================
🏆 التحدي الكبير
========================================================= */

function gameFinalChallenge(content, item) {

    const challengeType =
        Math.floor(Math.random() * 4);

    if (challengeType === 0) {

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
            getUniqueLetterChoices(
                item.letter,
                5
            );

        renderOptions(
            content,
            choices,
            item.letter,
            "letter",
            choice => letterWithFatha(choice),
            (value, button) => {

                finishLetterGame(
                    wordStartsWithLetter(
                        item.word,
                        value
                    ),
                    button
                );
            }
        );

        return;
    }

    if (challengeType === 1) {

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
            getUniqueLetterChoices(
                item.letter,
                5
            );

        renderOptions(
            content,
            choices,
            item.letter,
            "letter",
            choice => letterWithFatha(choice),
            (value, button) => {

                finishLetterGame(
                    matchAnswer(
                        value,
                        item.letter,
                        "letter"
                    ),
                    button
                );
            }
        );

        return;
    }

    if (challengeType === 2) {

        content.innerHTML = `
            ${gameHeader("🏆 التحدي الكبير")}

            <div class="game-big-letter">
                ${letterWithFatha(item.letter)}
            </div>

            <div class="game-question">
                اختر الكلمة الصحيحة
            </div>
        `;

        const choices =
            getUniqueItems(
                item,
                5
            );

        renderOptions(
            content,
            choices,
            item.word,
            "word",
            choice => choice.word,
            (value, button) => {

                finishLetterGame(
                    matchAnswer(
                        value,
                        item.word,
                        "word",
                        item.letter
                    ),
                    button
                );
            }
        );

        return;
    }

    content.innerHTML = `
        ${gameHeader("🏆 التحدي الكبير")}

        <div class="game-question">
            🔊 اسمع الحرف ثم اختره
        </div>

        <button
            class="game-next-btn"
            onclick="speak('${item.letter}')"
            type="button"
        >
            🔊 اسمع
        </button>
    `;

    const choices =
        getUniqueLetterChoices(
            item.letter,
            5
        );

    renderOptions(
        content,
        choices,
        item.letter,
        "letter",
        choice => letterWithFatha(choice),
        (value, button, correct) => {

            finishLetterGame(
                matchAnswer(value, correct, "letter"),
                button
            );
        }
    );
}

/* =========================================================
➡️ اللعبة التالية والحرف التالي
========================================================= */

function nextLetterGame() {

    if (!letterGameAnswered) return;

    invalidateLetterGameSession();
    stopAllAudio();

    currentLetterGame++;

    if (
        currentLetterGame >=
        TOTAL_LETTER_GAMES
    ) {

        addStars(20);

        const content =
            $("letterGameContent");

        if (content) {

            content.innerHTML = `
                <div class="game-category">
                    🏆 أحسنت جدًا!
                </div>

                <div class="game-big-letter">
                    ${
                        letterWithFatha(
                            letters[
                                currentLetterIndex
                            ].letter
                        )
                    }
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
                    type="button"
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

    invalidateLetterGameSession();
    stopAllAudio();

    currentLetterIndex++;

    if (
        currentLetterIndex >=
        letters.length
    ) {

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

    invalidateLetterGameSession();
    stopAllAudio();

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
            letterWithFatha(
                getFirstArabicLetter(item.word)
            );
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

    stopAllAudio();

    currentWordIndex++;

    if (
        currentWordIndex >=
        words.length
    ) {
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

    speak(
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

    speak(
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

    speak(
        `${currentAddA} زائد ${currentAddB} يساوي كم؟`,
        {
            rate: 0.8
        }
    );
}

function checkAddition() {

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

        speak(
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

        speak(
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

    speak(
        `${currentSubA} ناقص ${currentSubB} يساوي كم؟`,
        {
            rate: 0.8
        }
    );
}

function checkSubtraction() {

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

        speak(
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

        speak(
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

const quranAyahs = {

    "001": [
        "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
        "الرَّحْمَٰنِ الرَّحِيمِ",
        "مَالِكِ يَوْمِ الدِّينِ",
        "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
        "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
        "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ"
    ],

    "112": [
        "قُلْ هُوَ اللَّهُ أَحَدٌ",
        "اللَّهُ الصَّمَدُ",
        "لَمْ يَلِدْ وَلَمْ يُولَدْ",
        "وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ"
    ],

    "113": [
        "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
        "مِنْ شَرِّ مَا خَلَقَ",
        "وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ",
        "وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ",
        "وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ"
    ],

    "114": [
        "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
        "مَلِكِ النَّاسِ",
        "إِلَٰهِ النَّاسِ",
        "مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ",
        "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ",
        "مِنَ الْجِنَّةِ وَالنَّاسِ"
    ]
};

/* =========================================================
📖 عرض السورة
========================================================= */

let currentSurahIndex = 0;

function renderSurah() {

    const surah =
        quranSurahs[currentSurahIndex];

    const ayahs =
        quranAyahs[surah.file] || [];

    if ($("surahName")) {
        $("surahName").textContent =
            surah.name;
    }

    const container =
        $("surahAyahs");

    if (!container) return;

    container.innerHTML = "";

    ayahs.forEach(
        (ayah, index) => {

            const ayahNumber =
                index + 1;

            const ayahBox =
                document.createElement("div");

            ayahBox.className =
                "quran-ayah";

            const text =
                document.createElement("div");

            text.className =
                "quran-ayah-text";

            text.textContent =
                ayah;

            const button =
                document.createElement("button");

            button.className =
                "primary quran-ayah-button";

            button.type = "button";

            button.textContent =
                `🔊 الآية ${arabicNumber(ayahNumber)}`;

            button.addEventListener(
                "click",
                () => {
                    speakQuranAyah(
                        ayahNumber
                    );
                }
            );

            ayahBox.appendChild(text);
            ayahBox.appendChild(button);

            container.appendChild(
                ayahBox
            );
        }
    );
}

function getQuranAyahUrl(
    surahFile,
    ayahNumber
) {

    return (
        "https://everyayah.com/data/" +
        "Husary_128kbps/" +
        String(surahFile).padStart(3, "0") +
        String(ayahNumber).padStart(3, "0") +
        ".mp3"
    );
}
/* =========================================================
🔊 آية واحدة
========================================================= */

function speakQuranAyah(ayahNumber) {

    stopAllAudio();

    /*
     * stopAllAudio زاد الرقم مرة واحدة.
     * لذلك لا نزيده مرة أخرى.
     */
    const session =
        quranSessionToken;

    const surah =
        quranSurahs[currentSurahIndex];

    const ayahs =
        quranAyahs[surah.file] || [];

    if (
        ayahNumber < 1 ||
        ayahNumber > ayahs.length
    ) {
        return;
    }

    const url =
        getQuranAyahUrl(
            surah.file,
            ayahNumber
        );

    const audio =
        new Audio(url);

    currentQuranAudio =
        audio;

    audio.preload = "auto";

    audio.onended = () => {

        if (
            session !==
            quranSessionToken
        ) {
            return;
        }

        currentQuranAudio =
            null;
    };

    audio.onerror = () => {

        if (
            session ===
            quranSessionToken
        ) {
            currentQuranAudio =
                null;
        }
    };

    audio.play().catch(() => {

        if (
            session ===
            quranSessionToken
        ) {
            currentQuranAudio =
                null;
        }
    });
}

/* =========================================================
🔊 السورة كاملة
========================================================= */

function speakSurah() {

    stopAllAudio();

    const session =
        quranSessionToken;

    const surah =
        quranSurahs[currentSurahIndex];

    const ayahs =
        quranAyahs[surah.file] || [];

    if (!ayahs.length) return;

    let currentAyah = 1;

    function playNextAyah() {

        if (
            session !==
            quranSessionToken
        ) {
            return;
        }

        if (
            currentAyah >
            ayahs.length
        ) {

            currentQuranAudio =
                null;

            return;
        }

        const url =
            getQuranAyahUrl(
                surah.file,
                currentAyah
            );

        const audio =
            new Audio(url);

        currentQuranAudio =
            audio;

        audio.preload =
            "auto";

        audio.onended = () => {

            if (
                session !==
                quranSessionToken
            ) {
                return;
            }

            currentAyah++;

            playNextAyah();
        };

        audio.onerror = () => {

            if (
                session ===
                quranSessionToken
            ) {
                currentQuranAudio =
                    null;
            }
        };

        audio.play().catch(() => {

            if (
                session ===
                quranSessionToken
            ) {
                currentQuranAudio =
                    null;
            }
        });
    }

    playNextAyah();
}

function nextSurah() {

    stopAllAudio();

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

    speak(
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

let duaCategory = "general";
let currentDuaIndex = 0;

function getCurrentDuaList() {

    if (duaCategory === "morning") {
        return morningAdhkar;
    }

    if (duaCategory === "evening") {
        return eveningAdhkar;
    }

    return generalDuas;
}

function renderDua() {

    const list =
        getCurrentDuaList();

    if (
        currentDuaIndex >=
        list.length
    ) {
        currentDuaIndex = 0;
    }

    const dua =
        list[currentDuaIndex];

    if ($("duaTitle")) {
        $("duaTitle").textContent =
            dua.title;
    }

    if ($("duaText")) {
        $("duaText").textContent =
            dua.text;
    }

    createDuaControls();
}

function createDuaControls() {

    const screen =
        $("duas");

    if (!screen) return;

    let controls =
        $("duaControls");

    if (!controls) {

        controls =
            document.createElement("div");

        controls.id =
            "duaControls";

        controls.style.cssText = `
            display:flex;
            gap:8px;
            justify-content:center;
            flex-wrap:wrap;
            margin:15px 0;
        `;

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

    controls.innerHTML = `

        <button
            onclick="changeDuaCategory('general')"
            class="${
                duaCategory === "general"
                    ? "active"
                    : ""
            }"
            type="button"
        >
            🤲 الأدعية
        </button>

        <button
            onclick="changeDuaCategory('morning')"
            class="${
                duaCategory === "morning"
                    ? "active"
                    : ""
            }"
            type="button"
        >
            🌅 أذكار الصباح
        </button>

        <button
            onclick="changeDuaCategory('evening')"
            class="${
                duaCategory === "evening"
                    ? "active"
                    : ""
            }"
            type="button"
        >
            🌙 أذكار المساء
        </button>
    `;

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

    counter.textContent =
        `${arabicNumber(currentDuaIndex + 1)} من ${arabicNumber(list.length)}`;
}

function changeDuaCategory(category) {

    stopAllAudio();

    duaCategory =
        category;

    currentDuaIndex = 0;

    renderDua();
}

function speakDua() {

    const list =
        getCurrentDuaList();

    speak(
        list[currentDuaIndex].text,
        {
            rate: 0.7
        }
    );
}

function playDuaAudio() {
    speakDua();
}

function nextDua() {

    stopAllAudio();

    const list =
        getCurrentDuaList();

    currentDuaIndex++;

    if (
        currentDuaIndex >=
        list.length
    ) {
        currentDuaIndex = 0;
    }

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

    speak(
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
