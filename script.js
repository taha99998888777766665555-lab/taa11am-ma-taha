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
📖 متغيرات القرآن
========================================================= */

let currentSurahIndex = 0;
let currentQuranAyah = 0;
let quranPlayingAll = false;


/* =========================================================
🔗 رابط صوت الآية
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
📖 عرض السورة
========================================================= */

function renderSurah() {

    const surah =
        quranSurahs[currentSurahIndex];

    if (!surah) return;

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


            /* نص الآية */

            const text =
                document.createElement("div");

            text.className =
                "quran-ayah-text";

            text.textContent =
                ayah;


            /* زر تشغيل الآية */

            const button =
                document.createElement("button");

            button.className =
                "primary quran-ayah-button";

            button.type =
                "button";

            button.textContent =
                `🔊 الآية ${arabicNumber(ayahNumber)}`;


            button.addEventListener(
                "click",
                function () {

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


/* =========================================================
🔊 إظهار رسالة خطأ للقرآن
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
🧹 إزالة رسالة الخطأ
========================================================= */

function clearQuranError() {

    const errorBox =
        $("quranAudioMessage");

    if (errorBox) {
        errorBox.textContent = "";
    }
}


/* =========================================================
🔊 تشغيل آية واحدة
========================================================= */

function speakQuranAyah(ayahNumber) {

    /*
     * أوقف أي صوت سابق
     */
    stopAllAudio();

    quranPlayingAll = false;

    const session =
        quranSessionToken;

    const surah =
        quranSurahs[currentSurahIndex];

    if (!surah) return;

    const ayahs =
        quranAyahs[surah.file] || [];

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
            surah.file,
            ayahNumber
        );


    console.log(
        "Quran audio URL:",
        url
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
        "loadeddata",
        () => {

            console.log(
                "Quran audio loaded:",
                url
            );

        },
        {
            once: true
        }
    );


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


    /*
     * التشغيل يبدأ مباشرة بعد ضغط المستخدم
     */
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
🔊 تشغيل السورة كاملة
========================================================= */

function speakSurah() {

    stopAllAudio();

    const session =
        quranSessionToken;

    const surah =
        quranSurahs[currentSurahIndex];

    if (!surah) return;

    const ayahs =
        quranAyahs[surah.file] || [];

    if (!ayahs.length) return;

    clearQuranError();

    quranPlayingAll =
        true;

    currentQuranAyah =
        1;


    function playNextQuranAyah() {

        if (
            session !==
            quranSessionToken
        ) {
            return;
        }

        if (!quranPlayingAll) {
            return;
        }

        if (
            currentQuranAyah >
            ayahs.length
        ) {

            quranPlayingAll =
                false;

            currentQuranAudio =
                null;

            return;
        }


        const url =
            getQuranAyahUrl(
                surah.file,
                currentQuranAyah
            );


        console.log(
            "Playing Quran:",
            url
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

                playNextQuranAyah();

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


    playNextQuranAyah();
}


/* =========================================================
⏭️ السورة التالية
========================================================= */

function nextSurah() {

    stopAllAudio();

    quranPlayingAll =
        false;

    currentQuranAyah =
        0;

    currentSurahIndex++;

    if (
        currentSurahIndex >=
        quranSurahs.length
    ) {

        currentSurahIndex =
            0;
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
/* =========================================================
   🎈 لعبة فرقع الحروف - Balloon Pop V2
   النسخة المعدلة النهائية
   ========================================================= */

const balloonGame = {
    mode: "letters",

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
        localStorage.getItem("balloonBestScore") || 0
    )
};


/* =========================================================
   🎨 ألوان البالونات
   ========================================================= */

const balloonColors = [
    "red",
    "blue",
    "green",
    "yellow",
    "purple",
    "orange",
    "pink"
];


/* =========================================================
   🏆 مستويات اللعبة
   ========================================================= */

const balloonLevels = {

    1: {
        count: 5,
        duration: 11500,
        time: 15
    },

    2: {
        count: 7,
        duration: 9000,
        time: 13
    },

    3: {
        count: 9,
        duration: 7000,
        time: 11
    }

};


/* =========================================================
   🔊 أصوات الحروف
   ========================================================= */

const balloonLetterSounds = {

    "أ": "أَ",
    "ا": "أَ",

    "ب": "بَ",
    "ت": "تَ",
    "ث": "ثَ",

    "ج": "جَ",
    "ح": "حَ",
    "خ": "خَ",

    "د": "دَ",
    "ذ": "ذَ",

    "ر": "رَ",
    "ز": "زَ",

    "س": "سَ",
    "ش": "شَ",

    "ص": "صَ",
    "ض": "ضَ",

    "ط": "طَ",
    "ظ": "ظَ",

    "ع": "عَ",
    "غ": "غَ",

    "ف": "فَ",
    "ق": "قَ",

    "ك": "كَ",
    "ل": "لَ",

    "م": "مَ",
    "ن": "نَ",

    "ه": "هَ",

    "و": "وَ",
    "ي": "يَ"

};


/* =========================================================
   ▶️ بدء اللعبة
   ========================================================= */

function startBalloonGame(mode = "letters") {

    stopBalloonGameTimers();

    balloonGame.mode = mode;

    balloonGame.score = 0;

    balloonGame.streak = 0;

    balloonGame.bestStreak = 0;

    balloonGame.round = 0;

    balloonGame.level = 1;

    balloonGame.target = null;

    balloonGame.active = true;

    balloonGame.paused = false;

    balloonGame.lives = 3;

    balloonGame.timeLeft = 15;

    balloonGame.answered = false;

    balloonGame.earnedStars = 0;

    balloonGame.session++;

    showScreen("balloonGame");

    prepareBalloonArena();

    createBalloonControls();

    updateBalloonHUD();

    setTimeout(() => {

        if (!balloonGame.active) return;

        nextBalloonRound();

    }, 150);

}


/* =========================================================
   🎪 تجهيز ساحة اللعبة
   ========================================================= */

function prepareBalloonArena() {

    const arena =
        document.getElementById("balloonArena");

    if (!arena) return;

    clearBalloonArena();

    arena.style.display = "block";

    arena.classList.remove("game-started");

    setTimeout(() => {

        if (balloonGame.active) {

            arena.classList.add("game-started");

        }

    }, 50);

}


/* =========================================================
   🎮 أزرار التحكم
   ========================================================= */

function createBalloonControls() {

    const arenaWrapper =
        document.querySelector(
            ".balloon-game-wrapper"
        );

    if (!arenaWrapper) return;

    let controls =
        document.getElementById(
            "balloonControls"
        );

    if (controls) {

        controls.remove();

    }

    controls =
        document.createElement("div");

    controls.id =
        "balloonControls";

    controls.className =
        "balloon-controls";

    controls.innerHTML = `
        <button
            class="balloon-control-btn"
            onclick="toggleBalloonPause()"
            id="balloonPauseBtn">
            ⏸️ إيقاف
        </button>

        <div class="balloon-best-score">
            🏆 أفضل نتيجة:
            <strong id="balloonBestScore">
                ${arabicNumber(balloonGame.bestScore)}
            </strong>
        </div>

        <div class="balloon-level-label">
            المستوى:
            <strong id="balloonLevelText">
                ١
            </strong>
        </div>
    `;

    const hud =
        arenaWrapper.querySelector(
            ".game-hud"
        );

    if (hud) {

        hud.insertAdjacentElement(
            "afterend",
            controls
        );

    } else {

        arenaWrapper.prepend(
            controls
        );

    }

    updateBalloonExtraHUD();

}


/* =========================================================
   🔄 الجولة التالية
   ========================================================= */

function nextBalloonRound() {

    if (!balloonGame.active) return;

    if (balloonGame.paused) return;

    balloonGame.round++;

    balloonGame.answered = false;

    if (
        balloonGame.round >
        balloonGame.totalRounds
    ) {

        finishBalloonGame();

        return;
    }

    updateBalloonDifficulty();

    const letter =
        getSmartBalloonLetter();

    balloonGame.target =
        letter;

    updateBalloonHUD();

    /*
       🔊 نطق صوت الحرف فقط
    */

    speakBalloonTarget(letter);

    clearBalloonArena();

    createBalloonWave(letter);

    startRoundTimer();

}


/* =========================================================
   📈 تحديد مستوى الصعوبة
   ========================================================= */

function updateBalloonDifficulty() {

    if (balloonGame.round <= 3) {

        balloonGame.level = 1;

    } else if (balloonGame.round <= 7) {

        balloonGame.level = 2;

    } else {

        balloonGame.level = 3;

    }

    const levelText =
        document.getElementById(
            "balloonLevelText"
        );

    if (levelText) {

        levelText.textContent =
            balloonGame.level === 1
                ? "١"
                : balloonGame.level === 2
                    ? "٢"
                    : "٣";

    }

}


/* =========================================================
   🧠 اختيار حرف ذكي
   ========================================================= */

function getSmartBalloonLetter() {

    if (
        typeof letters !== "undefined" &&
        Array.isArray(letters) &&
        letters.length > 0
    ) {

        const index =
            Math.floor(
                Math.random() *
                letters.length
            );

        return letters[index];

    }

    const fallbackLetters = [

        { letter: "ا", word: "أسد" },
        { letter: "ب", word: "باب" },
        { letter: "ت", word: "تفاح" },
        { letter: "ث", word: "ثعلب" },

        { letter: "ج", word: "جمل" },
        { letter: "ح", word: "حوت" },
        { letter: "خ", word: "خبز" },

        { letter: "د", word: "دب" },
        { letter: "ذ", word: "ذهب" },

        { letter: "ر", word: "رمان" },
        { letter: "ز", word: "زرافة" },

        { letter: "س", word: "سمكة" },
        { letter: "ش", word: "شمس" },

        { letter: "ص", word: "صقر" },
        { letter: "ض", word: "ضفدع" },

        { letter: "ط", word: "طائرة" },
        { letter: "ظ", word: "ظرف" },

        { letter: "ع", word: "عصفور" },
        { letter: "غ", word: "غزال" },

        { letter: "ف", word: "فيل" },
        { letter: "ق", word: "قلم" },

        { letter: "ك", word: "كتاب" },
        { letter: "ل", word: "ليمون" },

        { letter: "م", word: "موز" },
        { letter: "ن", word: "نمر" },

        { letter: "ه", word: "هلال" },
        { letter: "و", word: "وردة" },
        { letter: "ي", word: "يد" }

    ];

    return fallbackLetters[
        Math.floor(
            Math.random() *
            fallbackLetters.length
        )
    ];

}


/* =========================================================
   🎈 إنشاء مجموعة البالونات
   ========================================================= */

function createBalloonWave(target) {

    const arena =
        document.getElementById(
            "balloonArena"
        );

    if (!arena) return;

    const level =
        balloonLevels[
            balloonGame.level
        ];

    const choices =
        getBalloonChoices(
            target,
            level.count
        );

    choices.forEach(
        (choice, index) => {

            const timer =
                setTimeout(() => {

                    if (
                        !balloonGame.active
                    ) return;

                    if (
                        balloonGame.paused
                    ) return;

                    createGameBalloon(
                        choice,
                        target,
                        index,
                        level.duration
                    );

                }, index * 450);

            balloonGame.spawnTimers.push(
                timer
            );

        }
    );

}


/* =========================================================
   🔤 اختيارات الحروف
   ========================================================= */

function getBalloonChoices(
    target,
    count
) {

    const choices = [];

    choices.push(target);

    let allLetters = [];

    if (
        typeof letters !== "undefined" &&
        Array.isArray(letters)
    ) {

        allLetters =
            [...letters];

    }

    const fallback = [

        "ا", "ب", "ت", "ث",
        "ج", "ح", "خ",
        "د", "ذ", "ر", "ز",
        "س", "ش", "ص",
        "ض", "ط", "ظ",
        "ع", "غ", "ف", "ق",
        "ك", "ل", "م", "ن",
        "ه", "و", "ي"

    ];

    while (
        choices.length < count
    ) {

        let candidate;

        if (
            allLetters.length > 0
        ) {

            candidate =
                allLetters[
                    Math.floor(
                        Math.random() *
                        allLetters.length
                    )
                ];

        } else {

            candidate =
                fallback[
                    Math.floor(
                        Math.random() *
                        fallback.length
                    )
                ];

        }

        const candidateLetter =
            typeof candidate === "object"
                ? candidate.letter
                : candidate;

        const alreadyExists =
            choices.some(item => {

                const itemLetter =
                    typeof item === "object"
                        ? item.letter
                        : item;

                return (
                    itemLetter ===
                    candidateLetter
                );

            });

        if (!alreadyExists) {

            choices.push(candidate);

        }

    }

    return choices.sort(
        () => Math.random() - 0.5
    );

}


/* =========================================================
   🎈 إنشاء البالونة
   ========================================================= */

function createGameBalloon(
    choice,
    target,
    index,
    duration
) {

    const arena =
        document.getElementById(
            "balloonArena"
        );

    if (!arena) return;

    if (!balloonGame.active) return;

    const balloon =
        document.createElement(
            "button"
        );

    balloon.type = "button";

    balloon.className =
        "game-balloon " +
        balloonColors[
            Math.floor(
                Math.random() *
                balloonColors.length
            )
        ];

    const letter =
        typeof choice === "object"
            ? choice.letter
            : choice;

    balloon.textContent =
        letter;

    balloon.dataset.letter =
        letter;

    balloon.setAttribute(
        "aria-label",
        "بالون"
    );

    const arenaWidth =
        arena.clientWidth || 700;

    const balloonSize = 75;

    const maxLeft =
        Math.max(
            10,
            arenaWidth -
            balloonSize -
            10
        );

    const left =
        Math.floor(
            Math.random() *
            maxLeft
        );

    balloon.style.left =
        left + "px";

    balloon.style.bottom =
        "-120px";

    balloon.style.position =
        "absolute";

    balloon.style.zIndex =
        "10";

    /*
       مهم:
       نستخدم click فقط حتى لا يحدث
       الضغط مرتين في الهاتف.
    */

    balloon.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            handleBalloonClick(
                balloon,
                letter,
                target
            );

        }
    );

    arena.appendChild(
        balloon
    );

    /*
       بدء حركة البالونة بعد إضافتها
       للساحة.
    */

    requestAnimationFrame(() => {

        if (!balloonGame.active) {
            return;
        }

        if (balloonGame.paused) {
            return;
        }

        balloon.style.transition =
            `bottom ${duration}ms linear`;

        balloon.style.bottom =
            (
                arena.clientHeight +
                140
            ) + "px";

    });

    /*
       حذف البالونة إذا وصلت إلى أعلى
       بدون إجابة.
    */

    const removeTimer =
        setTimeout(() => {

            if (
                balloon.parentNode &&
                !balloon.classList.contains(
                    "balloon-pop"
                )
            ) {

                balloon.remove();

            }

        }, duration + 500);

    balloonGame.spawnTimers.push(
        removeTimer
    );

}


/* =========================================================
   👆 الضغط على البالون
   ========================================================= */

function handleBalloonClick(
    balloon,
    clickedLetter,
    target
) {

    if (!balloonGame.active)
        return;

    if (balloonGame.paused)
        return;

    if (balloonGame.answered)
        return;

    if (
        clickedLetter ===
        target.letter
    ) {

        balloonGame.answered =
            true;

        handleBalloonCorrect(
            balloon
        );

    } else {

        handleBalloonMistake(
            balloon
        );

    }

}


/* =========================================================
   ✅ الإجابة الصحيحة
   ========================================================= */

function handleBalloonCorrect(
    balloon
) {

    balloonGame.streak++;

    if (
        balloonGame.streak >
        balloonGame.bestStreak
    ) {

        balloonGame.bestStreak =
            balloonGame.streak;

    }

    const points =
        calculateBalloonPoints();

    balloonGame.score +=
        points;

    balloonGame.earnedStars++;

    if (
        typeof addStars === "function"
    ) {

        addStars(1);

    }

    /*
       💥 تشغيل الفرقعة
    */

    balloon.classList.add(
        "balloon-pop"
    );

    createPopEffect(
        balloon
    );

    showBalloonMessage(
        getRandomSuccessMessage(),
        true
    );

 /*
   🔊 صوت النجاح
*/

const speech =
    getRandomSuccessSpeech();

if (
    typeof speak === "function"
) {
    speak(speech, {
        rate: 0.65,
        pitch: 1.05,
        volume: 1
    });
}

/*
   نترك الفرقعة تظهر كاملة.
*/

balloon.style.pointerEvents =
    "none";

    /*
       بعد انتهاء الفرقعة:
       ننظف الساحة ونبدأ الجولة التالية.
    */

    balloonGame.nextRoundTimer =
        setTimeout(() => {

            if (
                !balloonGame.active
            ) return;

            clearBalloonArena();

            nextBalloonRound();

        }, 700);

}


/* =========================================================
   ❌ الإجابة الخاطئة
   ========================================================= */

function handleBalloonMistake(
    balloon
) {

    if (!balloonGame.active)
        return;

    if (balloonGame.paused)
        return;

    /*
       لا نخصم أكثر من مرة بسرعة
       من نفس البالونة.
    */

    if (
        balloon.dataset.wrongClicked ===
        "true"
    ) {

        return;

    }

    balloon.dataset.wrongClicked =
        "true";

    balloonGame.streak = 0;

    balloonGame.lives--;

    balloon.classList.add(
        "balloon-wrong"
    );

    showBalloonMessage(
        "😊 حاول مرة أخرى",
        false
    );

    if (
        typeof speak === "function"
    ) {

        speak("حاول مرة أخرى");

    }

    updateBalloonHUD();

    setTimeout(() => {

        if (
            balloon.parentNode
        ) {

            balloon.classList.remove(
                "balloon-wrong"
            );

            balloon.dataset.wrongClicked =
                "false";

        }

    }, 500);

}


/* =========================================================
   ⭐ حساب النقاط
   ========================================================= */

function calculateBalloonPoints() {

    let points = 10;

    points +=
        (balloonGame.level - 1) *
        5;

    if (
        balloonGame.streak >= 3
    ) {

        points += 5;

    }

    if (
        balloonGame.streak >= 5
    ) {

        points += 10;

    }

    return points;

}


/* =========================================================
   ⏱️ مؤقت الجولة
   ========================================================= */

function startRoundTimer() {

    stopRoundTimer();

    const level =
        balloonLevels[
            balloonGame.level
        ];

    balloonGame.timeLeft =
        level.time;

    updateBalloonExtraHUD();

    balloonGame.roundTimer =
        setInterval(() => {

            if (
                !balloonGame.active
            ) return;

            if (
                balloonGame.paused
            ) return;

            balloonGame.timeLeft--;

            updateBalloonExtraHUD();

            if (
                balloonGame.timeLeft <= 0
            ) {

                handleBalloonTimeout();

            }

        }, 1000);

}


/* =========================================================
   ⏰ انتهاء الوقت
   ========================================================= */

function handleBalloonTimeout() {

    if (
        balloonGame.answered
    ) return;

    balloonGame.answered =
        true;

    stopRoundTimer();

    balloonGame.streak = 0;

    balloonGame.lives--;

    showBalloonMessage(
        "⏰ انتهى الوقت",
        false
    );

    if (
        typeof speak === "function"
    ) {

        speak("انتهى الوقت");

    }

    clearBalloonArena();

    updateBalloonHUD();

    balloonGame.nextRoundTimer =
        setTimeout(() => {

            if (
                !balloonGame.active
            ) return;

            nextBalloonRound();

        }, 1000);

}


/* =========================================================
   🛑 إيقاف المؤقت
   ========================================================= */

function stopRoundTimer() {

    if (
        balloonGame.roundTimer
    ) {

        clearInterval(
            balloonGame.roundTimer
        );

        balloonGame.roundTimer =
            null;

    }

}


/* =========================================================
   🧹 حذف مؤقتات البالونات
   ========================================================= */

function clearBalloonSpawnTimers() {

    balloonGame.spawnTimers.forEach(
        timer => {

            clearTimeout(
                timer
            );

        }
    );

    balloonGame.spawnTimers = [];

}


/* =========================================================
   🛑 إيقاف جميع المؤقتات
   ========================================================= */

function stopBalloonGameTimers() {

    stopRoundTimer();

    clearBalloonSpawnTimers();

    if (
        balloonGame.nextRoundTimer
    ) {

        clearTimeout(
            balloonGame.nextRoundTimer
        );

        balloonGame.nextRoundTimer =
            null;

    }

}


/* =========================================================
   🎈 حذف البالونات
   ========================================================= */

function removeRemainingBalloons() {

    const arena =
        document.getElementById(
            "balloonArena"
        );

    if (!arena) return;

    const balloons =
        arena.querySelectorAll(
            ".game-balloon"
        );

    balloons.forEach(
        balloon => {

            balloon.remove();

        }
    );

    /*
       حذف جسيمات الانفجار أيضًا.
    */

    const particles =
        arena.querySelectorAll(
            ".pop-particle"
        );

    particles.forEach(
        particle => {

            particle.remove();

        }
    );

}


/* =========================================================
   🧹 تنظيف الساحة
   ========================================================= */

function clearBalloonArena() {

    stopRoundTimer();

    clearBalloonSpawnTimers();

    removeRemainingBalloons();

}


/* =========================================================
   😊 رسائل النجاح
   ========================================================= */

function getRandomSuccessSpeech() {
    const messages = [
        "أَحْسَنْتَ",
        "مُمْتَاز",
        "رَائِع",
        "بَرَافُو",
        "شَاطِر"
    ];

    return messages[
        Math.floor(
            Math.random() *
            messages.length
        )
    ];
}

/*
   دالة بنفس الاسم القديم المستخدم في
   handleBalloonCorrect لعرض رسالة النجاح
   على الشاشة (لم تكن معرّفة من قبل، وهذا
   كان يوقف تشغيل الجولة التالية بالكامل).
*/
function getRandomSuccessMessage() {
    return getRandomSuccessSpeech();
}


/* =========================================================
   💬 عرض الرسالة
   ========================================================= */

function showBalloonMessage(
    message,
    success = true
) {

    const box =
        document.getElementById(
            "balloonMessage"
        );

    if (!box) return;

    box.textContent =
        message;

    box.classList.remove(
        "success",
        "error",
        "wrong"
    );

    box.classList.add(
        success
            ? "success"
            : "wrong"
    );

    box.style.opacity =
        "1";

    clearTimeout(
        box._messageTimer
    );

    box._messageTimer =
        setTimeout(() => {

            box.style.opacity =
                "0";

        }, 1200);

}


/* =========================================================
   📊 تحديث بيانات اللعبة
   ========================================================= */

function updateBalloonHUD() {

    const score =
        document.getElementById(
            "balloonScore"
        );

    const level =
        document.getElementById(
            "balloonLevel"
        );

    const progress =
        document.getElementById(
            "balloonProgressFill"
        );

    const streak =
        document.getElementById(
            "balloonStreak"
        );

    const target =
        document.getElementById(
            "balloonTarget"
        );

    if (score) {

        score.textContent =
            arabicNumber(balloonGame.score);

    }

    if (level) {

        level.textContent =
            arabicNumber(balloonGame.level);

    }

    if (progress) {

        const percentage =
            (
                balloonGame.round /
                balloonGame.totalRounds
            ) * 100;

        progress.style.width =
            percentage + "%";

    }

    if (streak) {

        streak.textContent =
            arabicNumber(balloonGame.streak);

    }

    if (target) {

        target.textContent =
            balloonGame.target
                ? balloonGame.target.letter
                : "؟";

    }

    updateBalloonExtraHUD();

}


/* =========================================================
   ❤️ الوقت والمحاولات
   ========================================================= */

function updateBalloonExtraHUD() {

    const controls =
        document.getElementById(
            "balloonControls"
        );

    if (!controls) return;

    let lives =
        document.getElementById(
            "balloonLives"
        );

    let timer =
        document.getElementById(
            "balloonTimer"
        );

    if (!lives) {

        lives =
            document.createElement(
                "div"
            );

        lives.id =
            "balloonLives";

        lives.className =
            "balloon-lives";

        controls.appendChild(
            lives
        );

    }

    if (!timer) {

        timer =
            document.createElement(
                "div"
            );

        timer.id =
            "balloonTimer";

        timer.className =
            "balloon-timer";

        controls.appendChild(
            timer
        );

    }

    lives.textContent =
        "❤️".repeat(
            Math.max(
                0,
                balloonGame.lives
            )
        );

    timer.textContent =
        "⏱️ " +
        arabicNumber(
            Math.max(0, balloonGame.timeLeft)
        );

    if (
        balloonGame.timeLeft <= 5
    ) {

        timer.classList.add(
            "danger"
        );

    } else {

        timer.classList.remove(
            "danger"
        );

    }

    const best =
        document.getElementById(
            "balloonBestScore"
        );

    if (best) {

        best.textContent =
            arabicNumber(balloonGame.bestScore);

    }

}


/* =========================================================
   ⏸️ إيقاف / تشغيل اللعبة
   ========================================================= */

function toggleBalloonPause() {

    if (!balloonGame.active)
        return;

    balloonGame.paused =
        !balloonGame.paused;

    const button =
        document.getElementById(
            "balloonPauseBtn"
        );

    if (
        balloonGame.paused
    ) {

        stopRoundTimer();

        pauseBalloonAnimations();

        if (button) {

            button.textContent =
                "▶️ متابعة";

        }

        showBalloonPauseOverlay();

    } else {

        resumeBalloonAnimations();

        if (button) {

            button.textContent =
                "⏸️ إيقاف";

        }

        startRoundTimer();

        hideBalloonPauseOverlay();

    }

}


/* =========================================================
   ⏸️ إيقاف حركة البالونات
   ========================================================= */

function pauseBalloonAnimations() {

    const arena =
        document.getElementById(
            "balloonArena"
        );

    if (!arena) return;

    arena
        .querySelectorAll(
            ".game-balloon"
        )
        .forEach(
            balloon => {

                const computed =
                    getComputedStyle(
                        balloon
                    );

                const bottom =
                    computed.bottom;

                balloon.style.transition =
                    "none";

                balloon.style.bottom =
                    bottom;

            }
        );

}


/* =========================================================
   ▶️ استئناف حركة البالونات
   ========================================================= */

function resumeBalloonAnimations() {

    const arena =
        document.getElementById(
            "balloonArena"
        );

    if (!arena) return;

    const duration =
        balloonLevels[
            balloonGame.level
        ].duration;

    arena
        .querySelectorAll(
            ".game-balloon"
        )
        .forEach(
            balloon => {

                balloon.style.transition =
                    `bottom ${duration}ms linear`;

                balloon.style.bottom =
                    (
                        arena.clientHeight +
                        140
                    ) + "px";

            }
        );

}


/* =========================================================
   ⏸️ شاشة الإيقاف
   ========================================================= */

function showBalloonPauseOverlay() {

    let overlay =
        document.getElementById(
            "balloonPauseOverlay"
        );

    if (overlay) {

        overlay.style.display =
            "flex";

        return;

    }

    overlay =
        document.createElement(
            "div"
        );

    overlay.id =
        "balloonPauseOverlay";

    overlay.className =
        "balloon-pause-overlay";

    overlay.innerHTML = `

        <div class="pause-card">

            <div class="pause-icon">
                ⏸️
            </div>

            <h2>
                اللعبة متوقفة
            </h2>

            <p>
                اضغط متابعة للعودة إلى اللعبة
            </p>

            <button
                class="balloon-control-btn"
                onclick="toggleBalloonPause()">

                ▶️ متابعة

            </button>

        </div>

    `;

    const wrapper =
        document.querySelector(
            ".balloon-game-wrapper"
        );

    if (wrapper) {

        wrapper.appendChild(
            overlay
        );

    }

}


/* =========================================================
   ▶️ إخفاء شاشة الإيقاف
   ========================================================= */

function hideBalloonPauseOverlay() {

    const overlay =
        document.getElementById(
            "balloonPauseOverlay"
        );

    if (overlay) {

        overlay.style.display =
            "none";

    }

}


/* =========================================================
   🔊 إعادة نطق صوت الحرف
   ========================================================= */

function repeatBalloonTarget() {

    if (!balloonGame.active)
        return;

    if (!balloonGame.target)
        return;

    speakBalloonTarget(
        balloonGame.target
    );

}


/* =========================================================
   🔊 نطق صوت الحرف فقط
   ========================================================= */

function speakBalloonTarget(
    letterData
) {

    if (!letterData) return;

    const letter =
        letterData.letter ||
        letterData;

    const sound =
        balloonLetterSounds[
            letter
        ] || letter;

    /*
       مهم جدًا:
       لا نستخدم speak() هنا.
       لأن speak() العامة في التطبيق
       قد تحتوي على منطق خاص بنطق
       أسماء الحروف أو التعليمات.

       اللعبة تستخدم SpeechSynthesis
       مباشرة حتى تنطق "بَ" فقط.
    */

    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis.cancel();

        const utterance =
            new SpeechSynthesisUtterance(
                sound
            );

        utterance.lang =
            "ar-SA";

        utterance.rate =
            0.65;

        utterance.pitch =
            1;

        utterance.volume =
            1;

        window.speechSynthesis.speak(
            utterance
        );

    }

}


/* =========================================================
   💥 تأثير الفرقعة
   ========================================================= */

function createPopEffect(
    balloon
) {

    if (!balloon) return;

    const rect =
        balloon.getBoundingClientRect();

    const arena =
        document.getElementById(
            "balloonArena"
        );

    if (!arena) return;

    const arenaRect =
        arena.getBoundingClientRect();

    const x =
        rect.left -
        arenaRect.left +
        rect.width / 2;

    const y =
        rect.top -
        arenaRect.top +
        rect.height / 2;

    const particles = [

        "✨",
        "⭐",
        "💥",
        "🌟",
        "🎉",
        "💫"

    ];

    particles.forEach(
        (emoji, index) => {

            const particle =
                document.createElement(
                    "span"
                );

            particle.className =
                "pop-particle";

            particle.textContent =
                emoji;

            particle.style.left =
                x + "px";

            particle.style.top =
                y + "px";

            /*
               مهم:
               CSS يستخدم --x و --y
               وليس --particle-x/y
            */

            particle.style.setProperty(
                "--x",
                (
                    Math.random() *
                    160 -
                    80
                ) + "px"
            );

            particle.style.setProperty(
                "--y",
                (
                    Math.random() *
                    160 -
                    80
                ) + "px"
            );

            particle.style.animationDelay =
                (
                    index * 0.03
                ) + "s";

            arena.appendChild(
                particle
            );

            setTimeout(() => {

                if (
                    particle.parentNode
                ) {

                    particle.remove();

                }

            }, 900);

        }
    );

}


/* =========================================================
   🏁 إنهاء اللعبة
   ========================================================= */

function finishBalloonGame() {

    if (!balloonGame.active)
        return;

    stopBalloonGameTimers();

    clearBalloonArena();

    balloonGame.active =
        false;

    balloonGame.paused =
        false;

    if (
        balloonGame.score >
        balloonGame.bestScore
    ) {

        balloonGame.bestScore =
            balloonGame.score;

        localStorage.setItem(
            "balloonBestScore",
            balloonGame.bestScore
        );

    }

    const arena =
        document.getElementById(
            "balloonArena"
        );

    if (!arena) return;

    const oldFinish =
        document.getElementById(
            "balloonFinishScreen"
        );

    if (oldFinish) {

        oldFinish.remove();

    }

    const stars =
        Math.min(
            3,
            Math.max(
                1,
                Math.ceil(
                    balloonGame.score /
                    100
                )
            )
        );

    const finish =
        document.createElement(
            "div"
        );

    finish.id =
        "balloonFinishScreen";

    finish.className =
        "balloon-finish-screen";

    finish.innerHTML = `

        <div class="finish-trophy">
            🏆
        </div>

        <h2>
            أحسنت يا بطل! 🎉
        </h2>

        <p>
            لقد أنهيت لعبة فرقع الحروف
        </p>

        <div class="finish-score">
            ${balloonGame.score}
        </div>

        <div class="finish-stars">
            ${"⭐".repeat(stars)}
        </div>

        <div class="finish-stats">

            <div>

                <span>
                    الجولة
                </span>

                <strong>
                    ${balloonGame.totalRounds}
                </strong>

            </div>

            <div>

                <span>
                    أفضل سلسلة
                </span>

                <strong>
                    ${balloonGame.bestStreak}
                </strong>

            </div>

            <div>

                <span>
                    أفضل نتيجة
                </span>

                <strong>
                    ${balloonGame.bestScore}
                </strong>

            </div>

        </div>

        <button
            class="balloon-control-btn"
            onclick="startBalloonGame('letters')">

            🔄 العب مرة أخرى

        </button>

        <button
            class="balloon-control-btn"
            onclick="exitBalloonGame()">

            🏠 العودة للألعاب

        </button>

    `;

    arena.appendChild(
        finish
    );

    if (
        typeof speak === "function"
    ) {

        speak("أحسنت يا بطل");

    }

}


/* =========================================================
   🚪 الخروج من اللعبة
   ========================================================= */

function exitBalloonGame() {

    stopBalloonGameTimers();

    balloonGame.active =
        false;

    balloonGame.paused =
        false;

    balloonGame.target =
        null;

    clearBalloonArena();

    hideBalloonPauseOverlay();

    const controls =
        document.getElementById(
            "balloonControls"
        );

    if (controls) {

        controls.remove();

    }

    showScreen("games");

}
/* =========================================================
   🔢 لعبة فرقع الأرقام - Number Balloon Game
   لعبة مستقلة تمامًا عن لعبة فرقع الحروف
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
   🔢 الأرقام والكلمات العربية
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
   🔢 تحويل الرقم إلى أرقام عربية
   ========================================================= */

function numberBalloonArabicNumber(number) {
    return String(number).replace(/[0-9]/g, digit => {
        return "٠١٢٣٤٥٦٧٨٩"[digit];
    });
}


/* =========================================================
   🎮 مستويات اللعبة
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
   ▶️ بدء اللعبة
   ========================================================= */

function startNumberBalloonGame() {

    stopNumberBalloonGameTimers();

    const oldFinish =
        document.getElementById("numberBalloonFinishScreen");

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

    const currentSession =
        numberBalloonGame.session;

    showScreen("numberBalloonGame");

    prepareNumberBalloonArena();
    createNumberBalloonControls();
    updateNumberBalloonHUD();

    setTimeout(() => {

        if (
            !numberBalloonGame.active ||
            currentSession !== numberBalloonGame.session
        ) {
            return;
        }

        nextNumberBalloonRound();

    }, 250);
}


/* =========================================================
   🏟️ تجهيز الساحة
   ========================================================= */

function prepareNumberBalloonArena() {

    const arena =
        document.getElementById("numberBalloonArena");

    if (!arena) return;

    arena.innerHTML = `
        <div class="arena-cloud cloud-one">☁️</div>
        <div class="arena-cloud cloud-two">☁️</div>
    `;
}


/* =========================================================
   🎮 أزرار التحكم
   ========================================================= */

function createNumberBalloonControls() {

    const wrapper =
        document.querySelector(
            "#numberBalloonGame .balloon-game-wrapper"
        );

    if (!wrapper) return;

    const old =
        document.getElementById("numberBalloonControls");

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
        wrapper.querySelector(".exit-game-btn");

    if (exitButton) {
        wrapper.insertBefore(
            controls,
            exitButton
        );
    } else {
        wrapper.appendChild(controls);
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

        finishNumberBalloonGame("completed");

        return;
    }

    updateNumberBalloonLevel();

    const target =
        getRandomNumberBalloonTarget();

    numberBalloonGame.target =
        target;

    updateNumberBalloonHUD();

    speakNumberBalloonTarget(target);

    clearNumberBalloonArena();

    createNumberBalloonWave(target);

    startNumberBalloonRoundTimer();
}


/* =========================================================
   🎯 تحديد مستوى اللعبة
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
   🎯 اختيار الرقم المطلوب حسب المستوى
   ========================================================= */

function getRandomNumberBalloonTarget() {

    const level =
        numberBalloonLevels[
            numberBalloonGame.level
        ];

    return Math.floor(
        Math.random() *
        (level.max - level.min + 1)
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
                index * 450;

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

    return choices.sort(
        () => Math.random() - 0.5
    );
}


/* =========================================================
   🎈 إنشاء بالونة رقم
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
        document.createElement("button");

    balloon.type =
        "button";

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

    const color =
        colors[
            Math.floor(
                Math.random() *
                colors.length
            )
        ];

    balloon.classList.add(
        `balloon-${color}`
    );

    const arenaWidth =
        Math.max(
            80,
            arena.clientWidth - 90
        );

    const left =
        20 +
        Math.random() *
        Math.max(
            30,
            arenaWidth - 40
        );

    const bottom =
        -100 -
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
        function () {

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
            balloon,
            clickedNumber
        );

    } else {

        handleNumberBalloonMistake(
            balloon
        );
    }
}


/* =========================================================
   ✅ إجابة صحيحة
   ========================================================= */

function handleNumberBalloonCorrect(
    balloon,
    number
) {

    stopNumberBalloonRoundTimer();

    numberBalloonGame.streak++;

    if (
        numberBalloonGame.streak >
        numberBalloonGame.bestStreak
    ) {

        numberBalloonGame.bestStreak =
            numberBalloonGame.streak;
    }

    const points =
        calculateNumberBalloonPoints();

    numberBalloonGame.score +=
        points;

    numberBalloonGame.earnedStars++;

    addStars(1);

    balloon.classList.add(
        "balloon-pop"
    );

    createNumberPopEffect(
        balloon
    );

    showNumberBalloonMessage(
        getNumberBalloonSuccessMessage(),
        true
    );

    speakNumberBalloonSuccess();

    balloon.style.pointerEvents =
        "none";

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

        }, 750);
}


/* =========================================================
   ❌ إجابة خاطئة
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
        "😊 حاول مرة أخرى",
        false
    );

    speakNumberBalloonRetry();

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

        }, 450);

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

    }, 500);
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
   ⏰ انتهاء الوقت
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
        "⏰ انتهى الوقت",
        false
    );

    speakNumberBalloonTimeout();

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
   ⭐ حساب النقاط
   ========================================================= */

function calculateNumberBalloonPoints() {

    let points = 10;

    if (
        numberBalloonGame.level > 1
    ) {

        points +=
            (numberBalloonGame.level - 1) * 5;
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
   🛑 إيقاف مؤقت الجولة
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
   🧹 تنظيف مؤقتات إنشاء البالونات
   ========================================================= */

function clearNumberBalloonSpawnTimers() {

    numberBalloonGame.spawnTimers.forEach(
        timer => clearTimeout(timer)
    );

    numberBalloonGame.spawnTimers =
        [];
}


/* =========================================================
   🛑 إيقاف جميع المؤقتات
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

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }

    const word =
        numberBalloonWords[number] ||
        String(number);

    speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(
            word
        );

    utterance.lang =
        "ar-SA";

    utterance.rate =
        0.7;

    utterance.pitch =
        1;

    utterance.volume =
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


/* =========================================================
   🔊 إعادة سماع الرقم
   ========================================================= */

function repeatNumberBalloonTarget() {

    if (
        !numberBalloonGame.target
    ) {
        return;
    }

    speakNumberBalloonTarget(
        numberBalloonGame.target
    );
}


/* =========================================================
   🔊 أصوات اللعبة
   ========================================================= */

function speakNumberBalloonSuccess() {

    const messages = [
        "أَحْسَنْتَ",
        "مُمْتَاز",
        "رَائِع",
        "بَرَافُو",
        "شَاطِر"
    ];

    const message =
        messages[
            Math.floor(
                Math.random() *
                messages.length
            )
        ];

    speak(message);
}


function speakNumberBalloonRetry() {

    speak(
        "حاول مرة أخرى"
    );
}


function speakNumberBalloonTimeout() {

    speak(
        "انتهى الوقت"
    );
}


/* =========================================================
   💬 رسائل اللعبة
   ========================================================= */

function getNumberBalloonSuccessMessage() {

    const messages = [
        "🎉 أحسنت!",
        "⭐ ممتاز!",
        "🌟 رائع!",
        "👏 برافو!",
        "🏆 شاطر!"
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
   💥 تأثير الفرقعة
   ========================================================= */

function createNumberPopEffect(
    balloon
) {

    const arena =
        document.getElementById(
            "numberBalloonArena"
        );

    if (!arena) return;

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
        i < 10;
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
            `${(Math.random() - 0.5) * 180}px`
        );

        particle.style.setProperty(
            "--y",
            `${(Math.random() - 0.5) * 180}px`
        );

        arena.appendChild(
            particle
        );

        setTimeout(() => {

            if (
                particle.parentNode
            ) {

                particle.remove();
            }

        }, 800);
    }
}


/* =========================================================
   📊 تحديث واجهة اللعبة
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
            numberBalloonGame.target
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
   ❤️ المؤقت والأرواح وأفضل نتيجة
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
   ⏸️ إيقاف / استكمال اللعبة
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


/* =========================================================
   ⏸️ إيقاف
   ========================================================= */

function pauseNumberBalloonGame() {

    if (
        numberBalloonGame.paused
    ) {
        return;
    }

    numberBalloonGame.paused =
        true;

    stopNumberBalloonRoundTimer();

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


/* =========================================================
   ▶️ استكمال
   ========================================================= */

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
   ⏸️ شاشة الإيقاف
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
                    اللعبة متوقفة
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


/* =========================================================
   ▶️ إخفاء شاشة الإيقاف
   ========================================================= */

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
   🏆 نهاية اللعبة
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
                    ? "أحسنت! أنهيت لعبة فرقع الأرقام"
                    : "انتهت اللعبة"
            }
        </h2>

        <div class="finish-score">
            ⭐
            ${numberBalloonArabicNumber(
                numberBalloonGame.score
            )}
        </div>

        <div class="finish-stars">
            🌟 نجوم مكتسبة:
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
}


/* =========================================================
   🚪 الخروج من لعبة الأرقام
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


/* =========================================================
   🔚 نهاية لعبة فرقع الأرقام
   ========================================================= */
