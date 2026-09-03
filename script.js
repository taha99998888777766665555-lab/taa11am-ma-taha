/* =========================================================
🌟 تعلم مع أ/ طه محمد 🌟
script.js - النسخة الكاملة والمصلحة
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
🔤 أدوات الحروف العربية
========================================================= */

function removeArabicHarakat(text) {
return String(text || "")
.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
}

function normalizeArabicText(text) {
return removeArabicHarakat(String(text || ""))
.replace(/أ|إ|آ|ٱ/g, "ا")
.replace(/ى/g, "ي")
.replace(/ؤ/g, "و")
.replace(/ئ/g, "ي")
.trim();
}

function getFirstArabicLetter(word) {
const normalized = removeArabicHarakat(word)
.replace(/\s+/g, "")
.trim();

return normalized.charAt(0);

}

function wordStartsWithLetter(word, letter) {
const firstLetter = normalizeArabicText(
getFirstArabicLetter(word)
);

const targetLetter = normalizeArabicText(letter);  

return firstLetter === targetLetter;

}

function wordContainsLetter(word, letter) {
const normalizedWord = normalizeArabicText(word);
const normalizedLetter = normalizeArabicText(letter);

return normalizedWord.includes(normalizedLetter);

}

function letterWithFatha(letter) {
const clean = removeArabicHarakat(letter);
return clean + "َ";
}

/* =========================================================
🔊 الصوت (تم ضبط النطق ليقرا الحرف بحركته لا اسمه)
========================================================= */

let arabicVoice = null;

function findArabicVoice() {
if (!("speechSynthesis" in window)) return null;

const voices = speechSynthesis.getVoices();  

arabicVoice =  
    voices.find(v =>  
        v.lang &&  
        v.lang.toLowerCase() === "ar-sa"  
    ) ||  
    voices.find(v =>  
        v.lang &&  
        v.lang.toLowerCase().startsWith("ar")  
    ) ||  
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

// معالجة نطق الحرف المجرد ليُنطق بصوته (بالفتحة) إذا كان حرفاً مفرداً
let textToSpeak = text;
if (text && text.length === 1 && /[\u0600-\u06FF]/.test(text)) {
    textToSpeak = letterWithFatha(text);
}

const utterance = new SpeechSynthesisUtterance(textToSpeak);  

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

let stars = Number(
localStorage.getItem("taha_app_stars") || 0
);

let level = Number(
localStorage.getItem("taha_app_level") || 1
);

function getStars() {
return stars;
}

function addStars(amount) {
amount = Number(amount) || 0;

stars += amount;  

if (stars < 0) {  
    stars = 0;  
}  

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

const teacherStars = $("teacherStars");  
const teacherLevel = $("teacherLevel");  

if (teacherStars) {  
    teacherStars.textContent = arabicNumber(stars);  
}  

if (teacherLevel) {  
    teacherLevel.textContent = arabicNumber(level);  
}

}

/* =========================================================
🧭 التنقل بين الصفحات
========================================================= */

function stopAllAudio() {
if ("speechSynthesis" in window) {
speechSynthesis.cancel();
}

if (currentQuranAudio) {  
    try {  
        currentQuranAudio.pause();  
        currentQuranAudio.currentTime = 0;  
    } catch (e) {}  
}

}

function showScreen(screenId) {

stopAllAudio();  

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

return shuffle(  
    unique([  
        correctLetter,  
        ...wrongLetters  
    ])  
);

}

function getUniqueItems(correctItem, count = 3) {

const others = shuffle(  
    letters.filter(  
        item => item.letter !== correctItem.letter  
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

const item = letters[currentLetterIndex];  

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

const item = letters[currentLetterIndex];  

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

const progress =  
    (currentLetterGame / TOTAL_LETTER_GAMES) * 100;  

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
                id="letterGameProgressFill"  
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
🎮 محرك الألعاب العشرين
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

    let value;  

    if (  
        typeof choice === "object" &&  
        choice !== null  
    ) {  
        value =  
            choice.letter ||  
            choice.word ||  
            "";  
    } else {  
        value = choice;  
    }  

    return `  
        <button  
            class="letter-game-option"  
            data-value="${String(value).replace(/"/g, "&quot;")}"  
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

            const value =  
                button.dataset.value;  

            callback(  
                value,  
                button,  
                correctValue  
            );  
        });  

    });

}

/* =========================================================
🏆 إنهاء لعبة
========================================================= */

function finishLetterGame(
isCorrect,
button = null
) {

if (letterGameAnswered) return;  

if (isCorrect) {  

    letterGameAnswered = true;  

    if (button) {  
        button.classList.add("correct");  
    }  

    letterGameStars += 5;  

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
🎮 اللعبة 1
اختر الحرف الصحيح
========================================================= */

function gameChooseCorrectLetter(
content,
item
) {

content.innerHTML = `  

    ${gameHeader("اختر الحرف الصحيح")}  

    <div class="game-question">  
        أين حرف  
        <strong>${letterWithFatha(item.letter)}</strong>؟  
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
    choice => letterWithFatha(choice),  
    (value, button, correct) => {  

        finishLetterGame(  
            normalizeArabicText(value) ===  
            normalizeArabicText(correct),  
            button  
        );  

    }  
);

}

/* =========================================================
🎮 اللعبة 2
اسمع الحرف
========================================================= */

function gameListenAndChoose(
content,
item
) {

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
    getUniqueLetterChoices(  
        item.letter,  
        4  
    );  

renderOptions(  
    content,  
    choices,  
    item.letter,  
    choice => letterWithFatha(choice),  
    (value, button, correct) => {  

        finishLetterGame(  
            normalizeArabicText(value) ===  
            normalizeArabicText(correct),  
            button  
        );  

    }  
);

}

/* =========================================================
🎮 اللعبة 3
اختر الصورة
========================================================= */

function gameChoosePicture(
content,
item
) {

const choices =  
    getUniqueItems(item, 3);  

content.innerHTML = `  

    ${gameHeader("اختر الصورة")}  

    <div class="game-question">  
        اختر الصورة التي تبدأ بحرف  
        <strong>${letterWithFatha(item.letter)}</strong>  
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
                wordStartsWithLetter(  
                    choices[index].word,  
                    item.letter  
                ),  
                button  
            );  

        };  

    });

}

/* =========================================================
🎮 اللعبة 4
اختر الكلمة التي تبدأ بالحرف
========================================================= */

function gameChooseWordStartingLetter(
content,
item
) {

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
    choice => choice.word,  
    (value, button, correct) => {  

        finishLetterGame(  
            wordStartsWithLetter(  
                value,  
                item.letter  
            ),  
            button  
        );  

    }  
);

}

/* =========================================================
🎮 اللعبة 5
أول حرف في الكلمة
========================================================= */

function gameFirstLetterOfWord(
content
) {

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
    choice => letterWithFatha(choice),  
    (value, button, correct) => {  

        const first =  
            getFirstArabicLetter(  
                target.word  
            );  

        finishLetterGame(  
            normalizeArabicText(first) ===  
            normalizeArabicText(value),  
            button  
        );  

    }  
);

}

/* =========================================================
🎮 اللعبة 6
أكمل الكلمة
========================================================= */

function gameCompleteWord(
content,
item
) {

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
    choice => letterWithFatha(choice),  
    (value, button, correct) => {  

        finishLetterGame(  
            normalizeArabicText(value) ===  
            normalizeArabicText(correct),  
            button  
        );  

    }  
);

}

/* =========================================================
🎮 اللعبة 7
ابحث عن الحرف
========================================================= */

function gameFindLetter(
content,
item
) {

const allLetters =  
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
    choice => letterWithFatha(choice),  
    (value, button, correct) => {  

        finishLetterGame(  
            normalizeArabicText(value) ===  
            normalizeArabicText(correct),  
            button  
        );  

    }  
);

}

/* =========================================================
🎮 اللعبة 8
طابق الحرف مع الصورة
========================================================= */

function gameMatchLetterPicture(
content,
item
) {

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
                wordStartsWithLetter(  
                    choices[index].word,  
                    item.letter  
                ),  
                button  
            );  

        };  

    });

}

/* =========================================================
🎮 اللعبة 9
طابق الحرف مع الكلمة
========================================================= */

function gameMatchLetterWord(
content,
item
) {

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
    choice => choice.word,  
    (value, button, correct) => {  

        finishLetterGame(  
            wordStartsWithLetter(  
                value,  
                item.letter  
            ),  
            button  
        );  

    }  
);

}

/* =========================================================
🎮 اللعبة 10
اسمع الفتحة
========================================================= */

function gameListenHaraka(
content,
item
) {

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
    choice => letterWithFatha(choice),  
    (value, button, correct) => {  

        finishLetterGame(  
            normalizeArabicText(value) ===  
            normalizeArabicText(correct),  
            button  
        );  

    }  
);

}

/* =========================================================
🎮 اللعبة 11
اسمع الكلمة
========================================================= */

function gameListenWord(
content,
item
) {

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
    getUniqueLetterChoices(  
        item.letter,  
        4  
    );  

renderOptions(  
    content,  
    choices,  
    item.letter,  
    choice => letterWithFatha(choice),  
    (value, button, correct) => {  

        const first =  
            getFirstArabicLetter(  
                item.word  
            );  

        finishLetterGame(  
            normalizeArabicText(first) ===  
            normalizeArabicText(value),  
            button  
        );  

    }  
);

}

/* =========================================================
🎮 اللعبة 12 (تمت مراجعتها وإصلاحها بالكامل)
أي كلمة لا تبدأ بالحرف؟
========================================================= */

function gameWhichWordDoesNotStart(
content,
item
) {

// جلب كلمة تبدأ بالحرف المطلوب كعنصر أساسي، مع اختيار 3 كلمات أخرى لا تبدأ به
const correctWordObj = item;
const wrongWordObjs = shuffle(
    letters.filter(x => !wordStartsWithLetter(x.word, item.letter))
).slice(0, 3);

if (wrongWordObjs.length === 0) return;

const choices = shuffle([correctWordObj, ...wrongWordObjs]);
const wrongAnswer = wrongWordObjs[0];

content.innerHTML = `  

    ${gameHeader("اختيار الكلمة المختلفة")}  

    <div class="game-question">  
        أي كلمة  
        <strong>لا تبدأ</strong>  
        بحرف  
        ${letterWithFatha(item.letter)}؟  
    </div>  
`;  

renderOptions(  
    content,  
    choices,  
    wrongAnswer.word,  
    choice => choice.word,  
    (value, button, correct) => {  

        finishLetterGame(  
            !wordStartsWithLetter(value, item.letter),  
            button  
        );  

    }  
);

}

/* =========================================================
🎮 اللعبة 13
صورة فقط
========================================================= */

function gamePictureOnly(
content,
item
) {

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
    choice => letterWithFatha(choice),  
    (value, button, correct) => {  

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
🎮 اللعبة 14
الحروف المتشابهة
========================================================= */

function gameOddLookingLetter(
content,
item
) {

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
    similarGroups[item.letter] || [];  

choices = unique([  
    item.letter,  
    ...choices  
]).slice(0, 4);  

while (choices.length < 4) {  

    const extra =  
        shuffle(  
            letters  
                .map(x => x.letter)  
                .filter(  
                    x =>  
                        !choices.includes(x)  
                )  
        )[0];  

    if (extra) {  
        choices.push(extra);  
    }  
}  

choices = shuffle(choices);  

content.innerHTML = `  

    ${gameHeader("انتبه للحروف المتشابهة")}  

    <div class="game-question">  
        أين حرف  
        <strong>${letterWithFatha(item.letter)}</strong>؟  
    </div>  

    <div style="font-size:16px">  
        ركّز جيدًا 👀  
    </div>  
`;  

renderOptions(  
    content,  
    choices,  
    item.letter,  
    choice => letterWithFatha(choice),  
    (value, button, correct) => {  

        finishLetterGame(  
            normalizeArabicText(value) ===  
            normalizeArabicText(correct),  
            button  
        );  

    }  
);

}

/* =========================================================
🎮 اللعبة 15
الحرف داخل الكلمة
========================================================= */

function gameLetterInContext(
content,
item
) {

const index =  
    item.word.indexOf(item.letter);  

let highlighted =  
    item.word;  

if (index !== -1) {  

    highlighted =  
        item.word.substring(0, index) +  

        `<span  
            style="  
                text-decoration:underline;  
                font-size:1.25em;  
            "  
        >  
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
    choice => letterWithFatha(choice),  
    (value, button, correct) => {  

        finishLetterGame(  
            normalizeArabicText(value) ===  
            normalizeArabicText(correct),  
            button  
        );  

    }  
);

}

/* =========================================================
🎮 اللعبة 16
الصورة ← الحرف
========================================================= */

function gamePictureToLetter(
content,
item
) {

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
    choice => letterWithFatha(choice),  
    (value, button, correct) => {  

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
🎮 اللعبة 17
⭐ أي كلمة تحتوي على الحرف؟
========================================================= */

function gameWhichWordContainsLetter(
content,
item
) {

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

let correctItem =  
    correctWords.find(  
        x => x.word === item.word  
    );  

if (!correctItem) {  
    correctItem = item;  
}  

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

        <strong>  
            ${letterWithFatha(item.letter)}  
        </strong>؟  

    </div>  
`;  

renderOptions(  
    content,  
    candidates,  
    correctItem.word,  
    choice => choice.word,  
    (value, button, correct) => {  

        const isCorrect =  
            wordContainsLetter(  
                value,  
                item.letter  
            );  

        finishLetterGame(  
            isCorrect,  
            button  
        );  

    }  
);

}

/* =========================================================
🎮 اللعبة 18
لغز الحرف
========================================================= */

function gameLetterRiddle(
content,
item
) {

content.innerHTML = `  

    ${gameHeader("لغز الحرف 🧠")}  

    <div class="game-question">  

        أنا حرف تبدأ به كلمة  

        <strong>  
            ${item.word}  
        </strong>  

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
    choice => letterWithFatha(choice),  
    (value, button, correct) => {  

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
🎮 اللعبة 19
الذاكرة
========================================================= */

function gameMemory(
content,
item
) {

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

setTimeout(() => {  

    if (  
        !$("letterGameContent") ||  
        currentLetterGame !== 18  
    ) {  
        return;  
    }  

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

    const optionsHTML = `  

        <div class="letter-options-grid">  

            ${choices.map(  
                (choice, index) => `  

                    <button  
                        class="letter-game-option"  
                        data-index="${index}"  
                    >  
                        ${letterWithFatha(choice)}  
                    </button>  

                `  
            ).join("")}  

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

    content.insertAdjacentHTML(  
        "beforeend",  
        optionsHTML  
    );  

    content  
        .querySelectorAll(".letter-game-option")  
        .forEach((button, index) => {  

            button.onclick = () => {  

                finishLetterGame(  
                    normalizeArabicText(  
                        choices[index]  
                    ) ===  
                    normalizeArabicText(  
                        item.letter  
                    ),  
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

function gameFinalChallenge(
content,
item
) {

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
        choice => letterWithFatha(choice),  
        (value, button, correct) => {  

            finishLetterGame(  
                wordStartsWithLetter(  
                    item.word,  
                    value  
                ),  
                button  
            );  

        }  
    );  

} else if (challengeType === 1) {  

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
        choice => letterWithFatha(choice),  
        (value, button, correct) => {  

            finishLetterGame(  
                wordStartsWithLetter(  
                    item.word,  
                    value  
                ),  
                button  
            );  

        }  
    );  

} else if (challengeType === 2) {  

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
        getUniqueItems(item, 5);  

    renderOptions(  
        content,  
        choices,  
        item.word,  
        choice => choice.word,  
        (value, button, correct) => {  

            finishLetterGame(  
                wordStartsWithLetter(  
                    value,  
                    item.letter  
                ),  
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
        getUniqueLetterChoices(  
            item.letter,  
            5  
        );  

    renderOptions(  
        content,  
        choices,  
        item.letter,  
        choice => letterWithFatha(choice),  
        (value, button, correct) => {  

            finishLetterGame(  
                normalizeArabicText(value) ===  
                normalizeArabicText(correct),  
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
                ${letterWithFatha(  
                    letters[currentLetterIndex].letter  
                )}  
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

currentLetterGame = 0;  

letterGameAnswered = false;  

letterGameStars = 0;  

renderLetterPage();

}

/* =========================================================
🔗 توافق مع HTML
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

const wordLetter =  
    $("wordLetter");  

if (wordLetter) {  

    wordLetter.textContent =  
        letterWithFatha(  
            getFirstArabicLetter(  
                item.word  
            )  
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

currentWordIndex++;  

if (  
    currentWordIndex >=  
    words.length  
) {  
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

    $("currentNumber").textContent =  
        arabicNumber(currentNumber);  
}  

if ($("numberWord")) {  

    $("numberWord").textContent =  
        numberWords[currentNumber] ||  
        arabicNumber(currentNumber);  
}  

const items =  
    $("numberItems");  

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

writingCanvas =  
    $("writingCanvas");  

if (!writingCanvas) return;  

writingCtx =  
    writingCanvas.getContext("2d");  

writingCtx.lineWidth = 6;  
writingCtx.lineCap = "round";  

const drawStart = (e) => {  

    writingDrawing = true;  

    const rect =  
        writingCanvas.getBoundingClientRect();  

    writingCtx.beginPath();  

    writingCtx.moveTo(  
        e.clientX - rect.left,  
        e.clientY - rect.top  
    );  
};  

const drawMove = (e) => {  

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

if (!writingCanvas ||  
    !writingCtx) return;  

writingCtx.clearRect(  
    0,  
    0,  
    writingCanvas.width,  
    writingCanvas.height  
);

}

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

window.initWritingCanvas = initWritingCanvas;
window.clearWriting = clearWriting;
window.nextWritingLetter = nextWritingLetter;

/* =========================================================
➕ الجمع (تم إصلاح قراءة الأرقام العربية)
========================================================= */

let currentAddA = 1;
let currentAddB = 1;

function newAddition() {

currentAddA =  
    Math.floor(Math.random() * 9) + 1;  

currentAddB =  
    Math.floor(Math.random() * 9) + 1;  

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

const rawVal = answer.value.trim();
const normalizedVal = rawVal.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
const userAnswer = Number(normalizedVal);  

const correct = currentAddA + currentAddB;  

if (!isNaN(userAnswer) && userAnswer === correct) {  

    if ($("additionMessage")) {  
        $("additionMessage").textContent = "🎉 أحسنت! إجابة صحيحة ⭐";  
    }  

    addStars(5);  
    speak("أحسنت، إجابة صحيحة");  

} else {  

    if ($("additionMessage")) {  
        $("additionMessage").textContent = "😊 حاول مرة أخرى";  
    }  
    speak("حاول مرة أخرى");  
}

}

window.newAddition = newAddition;
window.checkAddition = checkAddition;

/* =========================================================
➖ الطرح (تم إصلاح قراءة الأرقام العربية)
========================================================= */

let currentSubA = 5;
let currentSubB = 1;

function newSubtraction() {

currentSubA =  
    Math.floor(Math.random() * 10) + 2;  

currentSubB =  
    Math.floor(Math.random() * currentSubA) + 1;  

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

const rawVal = answer.value.trim();
const normalizedVal = rawVal.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
const userAnswer = Number(normalizedVal);  

const correct = currentSubA - currentSubB;  

if (!isNaN(userAnswer) && userAnswer === correct) {  

    if ($("additionMessage")) {  
        // احتياطي لو كان العنصر موجوداً
    }
    if ($("subtractionMessage")) {  
        $("subtractionMessage").textContent = "🎉 أحسنت! إجابة صحيحة ⭐";  
    }  

    addStars(5);  
    speak("أحسنت، إجابة صحيحة");  

} else {  

    if ($("subtractionMessage")) {  
        $("subtractionMessage").textContent = "😊 حاول مرة أخرى";  
    }  
    speak("حاول مرة أخرى");  
}

}

window.newSubtraction = newSubtraction;
window.checkSubtraction = checkSubtraction;

/* =========================================================
📖 القرآن الكريم (صوت الشيخ الحصري الأصلي)
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

const surah = quranSurahs[currentSurahIndex];  

if (currentQuranAudio) {  
    try {  
        currentQuranAudio.pause();  
        currentQuranAudio.currentTime = 0;  
    } catch (e) {}  
}  

// رابط تلاوة الشيخ الحصري (جودة عالية ومستقرة)
const url = `https://everyayah.com/data/Husary_128kbit/` + String(surah.file).padStart(3, '0') + `001.mp3`;

currentQuranAudio = new Audio(url);  

currentQuranAudio.play().catch(() => {  
    // حل احتياطي في حال تعذر الاتصال بالخترنت
    speak(getSurahText(surah.file), { rate: 0.7 });  
});

}

function nextSurah() {

stopAllAudio();  

currentSurahIndex++;  

if (currentSurahIndex >= quranSurahs.length) {  
    currentSurahIndex = 0;  
}  

renderSurah();

}

window.speakSurah = speakSurah;
window.nextSurah = nextSurah;

/* =========================================================
📜 الحديث الشريف
========================================================= */

const hadiths = [

{  
    title: "الحديث الأول",  
    text: "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى.",  
    meaning: "الأعمال تكون بحسب نية الإنسان وقصده."  
},  

{  
    title: "الحديث الثاني",  
    text: "من لا يرحم لا يُرحم.",  
    meaning: "علينا أن نرحم الناس ونحسن معاملتهم."  
},  

{  
    title: "الحديث الثالث",  
    text: "تبسمك في وجه أخيك لك صدقة.",  
    meaning: "الابتسامة الجميلة صدقة."  
},  

{  
    title: "الحديث الرابع",  
    text: "المسلم من سلم المسلمون من لسانه ويده.",  
    meaning: "المسلم لا يؤذي الآخرين بكلامه أو أفعاله."  
},  

{  
    title: "الحديث الخامس",  
    text: "خيركم من تعلم القرآن وعلمه.",  
    meaning: "من أفضل الناس من يتعلم القرآن ويعلمه لغيره."  
}

];

let currentHadithIndex = 0;

function renderHadith() {

const hadith = hadiths[currentHadithIndex];  

if ($("hadithTitle")) {  
    $("hadithTitle").textContent = hadith.title;  
}  

if ($("hadithText")) {  
    $("hadithText").textContent = hadith.text;  
}  

if ($("hadithMeaning")) {  
    $("hadithMeaning").textContent = hadith.meaning;  
}

}

function speakHadith() {
speak(hadiths[currentHadithIndex].text, { rate: 0.72 });
}

function playHadithAudio() {
speakHadith();
}

function nextHadith() {

currentHadithIndex++;  
if (currentHadithIndex >= hadiths.length) {  
    currentHadithIndex = 0;  
}  
renderHadith();

}

window.speakHadith = speakHadith;
window.playHadithAudio = playHadithAudio;
window.nextHadith = nextHadith;

/* =========================================================
🤲 الأدعية وأذكار الصباح والمساء
========================================================= */

const generalDuas = [

{  
    title: "دعاء الاستفتاح",  
    text: "اللهم باعد بيني وبين خطاياي كما باعدت بين المشرق والمغرب."  
},  

{  
    title: "دعاء الوالدين",  
    text: "رَبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا."  
},  

{  
    title: "دعاء العلم",  
    text: "رَبِّ زِدْنِي عِلْمًا."  
},  

{  
    title: "دعاء الهداية",  
    text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ."  
},  

{  
    title: "دعاء الخير",  
    text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ."  
},  

{  
    title: "دعاء المغفرة",  
    text: "رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَكَفِّرْ عَنَّا سَيِّئَاتِنَا."  
},  

{  
    title: "دعاء التوفيق",  
    text: "اللهم وفقني لما تحب وترضى."  
},  

{  
    title: "دعاء الحفظ",  
    text: "اللهم احفظني وأهلي ومن أحب."  
},  

{  
    title: "دعاء الصحة",  
    text: "اللهم إني أسألك العفو والعافية."  
},  

{  
    title: "دعاء قبل الطعام",  
    text: "بسم الله."  
},  

{  
    title: "دعاء بعد الطعام",  
    text: "الحمد لله الذي أطعمني هذا ورزقنيه من غير حول مني ولا قوة."  
},  

{  
    title: "دعاء دخول المنزل",  
    text: "بسم الله ولجنا، وبسم الله خرجنا، وعلى ربنا توكلنا."  
},  

{  
    title: "دعاء الخروج من المنزل",  
    text: "بسم الله، توكلت على الله، ولا حول ولا قوة إلا بالله."  
},  

{  
    title: "دعاء النوم",  
    text: "باسمك اللهم أموت وأحيا."  
},  

{  
    title: "دعاء الاستيقاظ",  
    text: "الحمد لله الذي أحيانا بعدما أماتنا وإليه النشور."  
}

];

const morningAdhkar = [

{  
    title: "أصبحنا وأصبح الملك لله",  
    text: "أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير."  
},  

{  
    title: "اللهم بك أصبحنا",  
    text: "اللهم بك أصبحنا وبك أمسينا، وبك نحيا وبك نموت وإليك النشور."  
},  

{  
    title: "رضيت بالله ربًا",  
    text: "رضيت بالله ربًا، وبالإسلام دينًا، وبمحمد صلى الله عليه وسلم نبيًا."  
},  

{  
    title: "بسم الله الذي لا يضر",  
    text: "بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم."  
},  

{  
    title: "حسبي الله",  
    text: "حسبي الله لا إله إلا هو، عليه توكلت وهو رب العرش العظيم."  
},  

{  
    title: "سيد الاستغفار",  
    text: "اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي وأبوء بذنبي فاغفر لي، فإنه لا يغفر الذنوب إلا أنت."  
}

];

const eveningAdhkar = [

{  
    title: "أمسينا وأمسى الملك لله",  
    text: "أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير."  
},  

{  
    title: "اللهم بك أمسينا",  
    text: "اللهم بك أمسينا وبك أصبحنا، وبك نحيا وبك نموت وإليك المصير."  
},  

{  
    title: "رضيت بالله ربًا",  
    text: "رضيت بالله ربًا، وبالإسلام دينًا، وبمحمد صلى الله عليه وسلم نبيًا."  
},  

{  
    title: "بسم الله الذي لا يضر",  
    text: "بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم."  
}

];

let duaCategory = "general";
let currentDuaIndex = 0;

function getCurrentDuaList() {
if (duaCategory === "morning") return morningAdhkar;  
if (duaCategory === "evening") return eveningAdhkar;  
return generalDuas;
}

function renderDua() {

const list = getCurrentDuaList();  
if (currentDuaIndex >= list.length) {  
    currentDuaIndex = 0;  
}  

const dua = list[currentDuaIndex];  

if ($("duaTitle")) {  
    $("duaTitle").textContent = dua.title;  
}  

if ($("duaText")) {  
    $("duaText").textContent = dua.text;  
}  

createDuaControls();

}

function createDuaControls() {

const screen = $("duas");  
if (!screen) return;  

let controls = $("duaControls");  

if (!controls) {  
    controls = document.createElement("div");  
    controls.id = "duaControls";  
    controls.style.cssText = `  
        display:flex;  
        gap:8px;  
        justify-content:center;  
        flex-wrap:wrap;  
        margin:15px 0;  
    `;  

    const title = screen.querySelector("h1, h2");  
    if (title && title.parentNode) {  
        title.parentNode.insertBefore(controls, title.nextSibling);  
    } else {  
        screen.prepend(controls);  
    }  
}  

controls.innerHTML = `  
    <button onclick="changeDuaCategory('general')" class="${duaCategory === "general" ? "active" : ""}">🤲 الأدعية</button>  
    <button onclick="changeDuaCategory('morning')" class="${duaCategory === "morning" ? "active" : ""}">🌅 أذكار الصباح</button>  
    <button onclick="changeDuaCategory('evening')" class="${duaCategory === "evening" ? "active" : ""}">🌙 أذكار المساء</button>  
`;  

let counter = $("duaCounter");  

if (!counter) {  
    counter = document.createElement("div");  
    counter.id = "duaCounter";  
    counter.style.cssText = `text-align:center; font-weight:bold; margin:10px;`;  
    screen.appendChild(counter);  
}  

const list = getCurrentDuaList();  
counter.textContent = `${arabicNumber(currentDuaIndex + 1)} من ${arabicNumber(list.length)}`;

}

function changeDuaCategory(category) {
duaCategory = category;  
currentDuaIndex = 0;  
renderDua();
}

function speakDua() {
const list = getCurrentDuaList();  
speak(list[currentDuaIndex].text, { rate: 0.7 });
}

function playDuaAudio() {
speakDua();
}

function nextDua() {
const list = getCurrentDuaList();  
currentDuaIndex++;  
if (currentDuaIndex >= list.length) {  
    currentDuaIndex = 0;  
}  
renderDua();
}

window.changeDuaCategory = changeDuaCategory;
window.speakDua = speakDua;
window.playDuaAudio = playDuaAudio;
window.nextDua = nextDua;

/* =========================================================
🏆 مكافآتي
========================================================= */

function resetProgress() {
const confirmed = confirm("هل أنت متأكد أنك تريد تصفير النجوم والمستوى؟");  
if (!confirmed) return;  

stars = 0;  
level = 1;  
localStorage.setItem("taha_app_stars", 0);  
localStorage.setItem("taha_app_level", 1);  
updateStats();  
speak("تم تصفير المكافآت");
}

window.resetProgress = resetProgress;

/* =========================================================
🚀 بدء التطبيق
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
updateStats();  
addLetterGameStyles();  
renderLetterPage();  
renderCurrentWord();  
renderCurrentNumber();  
renderSurah();  
renderHadith();  
renderDua();  
setTimeout(() => { initWritingCanvas(); }, 300);
});

/* =========================================================
🛡️ دوال احتياطية لأسماء HTML
========================================================= */

window.playLetterAudio = playLetterAudio;
window.speakCurrentLetter = speakCurrentLetter;
window.speakWord = speakWord;
window.playCurrentWordAudio = playCurrentWordAudio;
window.speakNumber = speakNumber;
window.speakHadith = speakHadith;
window.playHadithAudio = playHadithAudio;
window.speakDua = speakDua;
window.playDuaAudio = playDuaAudio;
window.speakSurah = speakSurah;
