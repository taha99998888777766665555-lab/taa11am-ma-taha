/* =========================================================
   🌟 تعلم مع أ/طه محمد
   script.js - الجزء الأول
========================================================= */


/* =========================================================
   🔤 بيانات الحروف
========================================================= */

const letters = [
    { letter: "أ", sound: "أَ", word: "أَسَد", picture: "🦁", audio: "sound/alif.mp3" },
    { letter: "ب", sound: "بَ", word: "بَطَّة", picture: "🦆", audio: "" },
    { letter: "ت", sound: "تَ", word: "تُفَّاح", picture: "🍎", audio: "" },
    { letter: "ث", sound: "ثَ", word: "ثَعْلَب", picture: "🦊", audio: "" },
    { letter: "ج", sound: "جَ", word: "جَمَل", picture: "🐪", audio: "" },
    { letter: "ح", sound: "حَ", word: "حِصَان", picture: "🐎", audio: "" },
    { letter: "خ", sound: "خَ", word: "خَرُوف", picture: "🐑", audio: "" },
    { letter: "د", sound: "دَ", word: "دُبّ", picture: "🐻", audio: "" },
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
    { letter: "هـ", sound: "هَ", word: "هِلال", picture: "🌙", audio: "" },
    { letter: "و", sound: "وَ", word: "وَرْدَة", picture: "🌹", audio: "" },
    { letter: "ي", sound: "يَ", word: "يَد", picture: "✋", audio: "" }
];


/* =========================================================
   ⭐ المتغيرات العامة
========================================================= */

let totalStars = Number(localStorage.getItem("totalStars")) || 0;

let currentLetterIndex = 0;
let currentGameIndex = 0;
let completedGames = [];

const TOTAL_GAMES = 26;

let correctWords = Number(localStorage.getItem("correctWords")) || 0;
let correctNumbers = Number(localStorage.getItem("correctNumbers")) || 0;
let correctAddition = Number(localStorage.getItem("correctAddition")) || 0;
let correctSubtraction = Number(localStorage.getItem("correctSubtraction")) || 0;
let correctLetters = Number(localStorage.getItem("correctLetters")) || 0;

let currentWordIndex = 0;
let currentNumber = 1;

let addA = 1;
let addB = 1;

let subA = 3;
let subB = 1;

let currentWritingIndex = 0;
let currentSurahIndex = 0;
let currentHadithIndex = 0;
let currentDuaIndex = 0;


/* =========================================================
   🔢 الأرقام العربية
========================================================= */

function arabicNumber(number) {
    const arabicNums = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];

    return String(number).replace(/\d/g, function(digit) {
        return arabicNums[digit];
    });
}


/* =========================================================
   ⭐ النجوم والمستوى
========================================================= */

function addStar() {
    totalStars++;

    localStorage.setItem("totalStars", totalStars);

    updateStarsDisplay();
    updateTeacherStats();
}

function updateStarsDisplay() {

    const stars = document.getElementById("stars");
    const rewardStars = document.getElementById("rewardStars");
    const teacherStars = document.getElementById("teacherStars");

    if (stars) {
        stars.textContent = arabicNumber(totalStars);
    }

    if (rewardStars) {
        rewardStars.textContent = arabicNumber(totalStars);
    }

    if (teacherStars) {
        teacherStars.textContent = arabicNumber(totalStars);
    }

    const level = Math.floor(totalStars / 10) + 1;

    const levelElement = document.getElementById("level");
    const teacherLevel = document.getElementById("teacherLevel");

    if (levelElement) {
        levelElement.textContent = arabicNumber(level);
    }

    if (teacherLevel) {
        teacherLevel.textContent = arabicNumber(level);
    }
}


/* =========================================================
   🗣️ النطق
========================================================= */

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "ar-SA";
    utterance.rate = 0.85;
    utterance.pitch = 1.1;

    window.speechSynthesis.speak(utterance);
}


function praise() {

    const phrases = [
        "ممتاز!",
        "أحسنت!",
        "بطل!",
        "رائع جدًا!",
        "بارك الله فيك!",
        "أحسنت يا بطل!",
        "عمل رائع!"
    ];

    const phrase =
        phrases[Math.floor(Math.random() * phrases.length)];

    speak(phrase);
}


/* =========================================================
   📱 التنقل بين الشاشات
========================================================= */

function showScreen(screenId) {

    document.querySelectorAll(".screen").forEach(function(screen) {
        screen.classList.remove("active");
    });

    const target = document.getElementById(screenId);

    if (target) {
        target.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   🔤 قائمة الحروف
========================================================= */

function renderLetterGrid() {

    const container =
        document.getElementById("lettersList");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    letters.forEach(function(item, index) {

        const card = document.createElement("button");

        card.className = "letter-card";

        card.innerHTML = `
            <div class="card-letter">${item.letter}</div>
            <div class="card-word">${item.word}</div>
            <div class="card-picture">${item.picture}</div>
        `;

        card.onclick = function() {

            currentLetterIndex = index;

            openLetterLesson();
        };

        container.appendChild(card);
    });
}


/* =========================================================
   🔤 الحرف الحالي
========================================================= */

function getCurrentLetter() {

    return letters[currentLetterIndex];
}


/* =========================================================
   📖 فتح درس الحرف
========================================================= */

function openLetterLesson() {

    showScreen("letterLesson");

    updateLetterLesson();
}


function updateLetterLesson() {

    const item = getCurrentLetter();

    const title =
        document.getElementById("lessonTitle");

    const letter =
        document.getElementById("lessonLetter");

    const sound =
        document.getElementById("lessonSound");

    const picture =
        document.getElementById("lessonPicture");

    const word =
        document.getElementById("lessonWord");

    const badgeTitle =
        document.getElementById("badgeTitle");

    if (title) {
        title.textContent =
            "🌟 حرف " + item.letter + " 🌟";
    }

    if (letter) {
        letter.textContent = item.letter;
    }

    if (sound) {
        sound.textContent = item.sound;
    }

    if (picture) {
        picture.textContent = item.picture;
    }

    if (word) {
        word.textContent = item.word;
    }

    if (badgeTitle) {
        badgeTitle.textContent =
            "بطل حرف " + item.letter;
    }

    startLetterGames();
}


/* =========================================================
   🔊 صوت الحرف
========================================================= */

function speakLessonSound() {

    const item = getCurrentLetter();

    if (item.audio) {

        const audio =
            new Audio(item.audio);

        audio.currentTime = 0;

        audio.play().catch(function(error) {

            console.log(
                "تعذر تشغيل الملف الصوتي:",
                error
            );

            speak(item.sound);
        });

        return;
    }

    speak(item.sound);
}


/* =========================================================
   🎮 بدء ألعاب الحرف
========================================================= */

function startLetterGames() {

    currentGameIndex = 0;

    completedGames =
        new Array(TOTAL_GAMES).fill(false);

    const badge =
        document.getElementById("badgeArea");

    const nextButton =
        document.getElementById("nextGameButton");

    if (badge) {
        badge.style.display = "none";
    }

    if (nextButton) {
        nextButton.style.display = "none";
    }

    updateGameProgress();

    renderCurrentMiniGame();
}


/* =========================================================
   📊 تقدم الألعاب
========================================================= */

function updateGameProgress() {

    const current =
        document.getElementById("currentGameNumber");

    const total =
        document.getElementById("gameTotalNumber");

    const fill =
        document.getElementById("gameProgressFill");

    const stars =
        document.getElementById("letterStars");

    const completed =
        completedGames.filter(Boolean).length;

    if (current) {
        current.textContent =
            arabicNumber(currentGameIndex + 1);
    }

    if (total) {
        total.textContent =
            arabicNumber(TOTAL_GAMES);
    }

    if (stars) {
        stars.textContent =
            arabicNumber(completed);
    }

    if (fill) {

        const percentage =
            (completed / TOTAL_GAMES) * 100;

        fill.style.width =
            percentage + "%";
    }
}


/* =========================================================
   ⭐ إكمال اللعبة
========================================================= */

function completeCurrentGame() {

    if (completedGames[currentGameIndex]) {
        return;
    }

    completedGames[currentGameIndex] = true;

    addStar();

    if (currentGameIndex === 0) {
        correctLetters++;
        localStorage.setItem(
            "correctLetters",
            correctLetters
        );
    }

    const message =
        document.getElementById("gameMessage");

    if (message) {

        message.textContent =
            "⭐ ممتاز! إجابة صحيحة";

        message.className =
            "game-message success-text";
    }

    praise();

    updateGameProgress();

    const nextButton =
        document.getElementById("nextGameButton");

    if (nextButton) {

        nextButton.style.display =
            "inline-block";

        if (currentGameIndex === TOTAL_GAMES - 1) {

            nextButton.textContent =
                "🏅 إظهار الشارة";

        } else {

            nextButton.textContent =
                "اللعبة التالية ➡️";
        }
    }
}


/* =========================================================
   ▶️ اللعبة التالية
========================================================= */

function nextMiniGame() {

    if (!completedGames[currentGameIndex]) {

        const message =
            document.getElementById("gameMessage");

        if (message) {

            message.textContent =
                "😊 أكمل اللعبة أولًا";

            message.className =
                "game-message error-text";
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


/* =========================================================
   🏅 إنهاء الحرف
========================================================= */

function finishLetterBadge() {

    const badge =
        document.getElementById("badgeArea");

    const miniGame =
        document.getElementById("miniGame");

    const nextButton =
        document.getElementById("nextGameButton");

    const fill =
        document.getElementById("gameProgressFill");

    if (miniGame) {
        miniGame.innerHTML = "";
    }

    if (nextButton) {
        nextButton.style.display = "none";
    }

    if (badge) {
        badge.style.display = "block";
    }

    if (fill) {
        fill.style.width = "100%";
    }

    speak(
        "أحسنت! انتهيت من الألعاب الستة والعشرين."
    );
}


/* =========================================================
   🎮 تشغيل اللعبة الحالية
========================================================= */

function renderCurrentMiniGame() {

    const container =
        document.getElementById("miniGame");

    const message =
        document.getElementById("gameMessage");

    const nextButton =
        document.getElementById("nextGameButton");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (message) {
        message.textContent = "";
        message.className = "game-message";
    }

    if (nextButton) {
        nextButton.style.display = "none";
    }

    updateGameProgress();

    switch (currentGameIndex) {

        case 0:
            gameRecognizeLetter(container);
            break;

        case 1:
            gameChooseLetter(container);
            break;

        case 2:
            gameChooseSound(container);
            break;

        case 3:
            gameFindLetter(container);
            break;

        case 4:
            gameCatchLetters(container);
            break;

        case 5:
            gameMatchPicture(container);
            break;

        case 6:
            gamePuzzle(container);
            break;

        case 7:
            gameSand(container);
            break;

        case 8:
            gameTrace(container);
            break;

        case 9:
            gameColor(container);
            break;

        case 10:
            gameChooseWord(container);
            break;

        case 11:
            gameSearchLetter(container);
            break;

        case 12:
            gameFinalChallenge(container);
            break;

        case 13:
            gameBalloons(container);
            break;

        case 14:
            gameBee(container);
            break;

        case 15:
            gameCar(container);
            break;

        case 16:
            gameTarget(container);
            break;

        case 17:
            gameMemory(container);
            break;

        case 18:
            gameDragPlace(container);
            break;

        case 19:
            gameDifferent(container);
            break;

        case 20:
            gameFish(container);
            break;

        case 21:
            gameTrain(container);
            break;

        case 22:
            gameHidden(container);
            break;

        case 23:
            gameAdvancedColor(container);
            break;

        case 24:
            gameMatchAll(container);
            break;

        case 25:
            gameFinalTest(container);
            break;
    }
}


/* =========================================================
   1️⃣ تعرف على الحرف
========================================================= */

function gameRecognizeLetter(container) {

    const item = getCurrentLetter();

    container.innerHTML = `
        <h3>🔤 تعرف على الحرف</h3>

        <p>
            اضغط على الحرف واستمع إليه
        </p>

        <button
            class="option"
            id="recognizeLetterButton"
            style="font-size:70px;"
        >
            ${item.letter}
        </button>

        <div style="font-size:60px; margin:15px;">
            ${item.picture}
        </div>

        <p>
            ${item.word}
        </p>
    `;

    document
        .getElementById("recognizeLetterButton")
        .onclick = function() {

            speakLessonSound();

            setTimeout(
                completeCurrentGame,
                500
            );
        };
}


/* =========================================================
   2️⃣ اختر الحرف الصحيح
========================================================= */

function gameChooseLetter(container) {

    const item = getCurrentLetter();

    let choices = [
        item.letter
    ];

    while (choices.length < 3) {

        const random =
            letters[
                Math.floor(
                    Math.random() * letters.length
                )
            ].letter;

        if (!choices.includes(random)) {
            choices.push(random);
        }
    }

    choices.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>🎯 اختر الحرف الصحيح</h3>

        <p>
            اختر حرف ${item.letter}
        </p>

        <div
            class="options"
            id="gameOptions"
        ></div>
    `;

    const box =
        document.getElementById("gameOptions");

    choices.forEach(function(choice) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent = choice;

        button.onclick = function() {

            if (choice === item.letter) {

                completeCurrentGame();

            } else {

                showGameError();
            }
        };

        box.appendChild(button);
    });
}


/* =========================================================
   3️⃣ اختر صوت الحرف
========================================================= */

function gameChooseSound(container) {

    const item = getCurrentLetter();

    let choices = [
        item.sound,
        "بَ",
        "مَ"
    ];

    choices = [
        ...new Set(choices)
    ];

    while (choices.length < 3) {

        const random =
            letters[
                Math.floor(
                    Math.random() * letters.length
                )
            ].sound;

        if (!choices.includes(random)) {
            choices.push(random);
        }
    }

    choices.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>🔊 اختر صوت الحرف</h3>

        <div
            class="lesson-letter"
            style="font-size:70px;"
        >
            ${item.letter}
        </div>

        <p>
            ما الصوت الصحيح؟
        </p>

        <div
            class="options"
            id="soundOptions"
        ></div>
    `;

    const box =
        document.getElementById("soundOptions");

    choices.forEach(function(choice) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent = choice;

        button.onclick = function() {

            if (choice === item.sound) {

                speakLessonSound();

                setTimeout(
                    completeCurrentGame,
                    400
                );

            } else {

                showGameError();
            }
        };

        box.appendChild(button);
    });
}


/* =========================================================
   4️⃣ أين الحرف؟
========================================================= */

function gameFindLetter(container) {

    const item = getCurrentLetter();

    let choices = [
        item.letter,
        "ب",
        "م",
        "س",
        "ل"
    ];

    while (choices.length < 5) {

        const random =
            letters[
                Math.floor(
                    Math.random() * letters.length
                )
            ].letter;

        if (!choices.includes(random)) {
            choices.push(random);
        }
    }

    choices = choices.slice(0, 5);

    choices.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>👀 أين حرف ${item.letter}؟</h3>

        <p>
            اضغط على الحرف الصحيح
        </p>

        <div
            class="options"
            id="findOptions"
        ></div>
    `;

    const box =
        document.getElementById("findOptions");

    choices.forEach(function(choice) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent = choice;

        button.onclick = function() {

            if (choice === item.letter) {

                completeCurrentGame();

            } else {

                showGameError();
            }
        };

        box.appendChild(button);
    });
}


/* =========================================================
   5️⃣ صيد الحروف
========================================================= */

function gameCatchLetters(container) {

    const item = getCurrentLetter();

    let choices = [
        item.letter,
        "ب",
        "م",
        "س",
        "ت",
        item.letter
    ];

    choices.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>🎯 صيد الحروف</h3>

        <p>
            اضغط على حرف ${item.letter}
        </p>

        <div
            id="catchArea"
            style="
                display:flex;
                flex-wrap:wrap;
                justify-content:center;
                gap:15px;
                margin:20px 0;
            "
        ></div>
    `;

    const area =
        document.getElementById("catchArea");

    choices.forEach(function(choice) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent = choice;

        button.onclick = function() {

            if (choice === item.letter) {

                completeCurrentGame();

            } else {

                showGameError();
            }
        };

        area.appendChild(button);
    });
}


/* =========================================================
   6️⃣ وصل الحرف بالصورة
========================================================= */

function gameMatchPicture(container) {

    const item = getCurrentLetter();

    let choices = [
        item.word,
        "بَطَّة",
        "مَوْز"
    ];

    while (choices.length < 3) {

        const random =
            letters[
                Math.floor(
                    Math.random() * letters.length
                )
            ].word;

        if (!choices.includes(random)) {
            choices.push(random);
        }
    }

    choices.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>🧩 وصل الحرف بالصورة</h3>

        <div
            style="font-size:70px;"
        >
            ${item.picture}
        </div>

        <p>
            ما اسم الصورة؟
        </p>

        <div
            class="options"
            id="matchOptions"
        ></div>
    `;

    const box =
        document.getElementById("matchOptions");

    choices.forEach(function(choice) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent = choice;

        button.onclick = function() {

            if (choice === item.word) {

                completeCurrentGame();

            } else {

                showGameError();
            }
        };

        box.appendChild(button);
    });
}


/* =========================================================
   7️⃣ البازل
========================================================= */

function gamePuzzle(container) {

    const item = getCurrentLetter();

    const pieces = [
        {
            id: 1,
            text: item.letter
        },
        {
            id: 2,
            text: item.sound
        },
        {
            id: 3,
            text: item.picture
        }
    ];

    container.innerHTML = `
        <h3>🧩 بازل حرف ${item.letter}</h3>

        <p>
            اسحب القطع ورتبها بالترتيب الصحيح
        </p>

        <div
            id="puzzleBoard"
            style="
                display:flex;
                justify-content:center;
                align-items:center;
                gap:12px;
                min-height:130px;
                margin:20px 0;
                padding:15px;
                border:4px dashed #90caf9;
                border-radius:20px;
                background:#f5faff;
                direction:rtl;
            "
        ></div>

        <p>
            الترتيب الصحيح:
            ${item.letter}
            ←
            ${item.sound}
            ←
            ${item.picture}
        </p>

        <button
            class="success"
            id="checkPuzzle"
        >
            ✅ تحقق
        </button>

        <button
            class="option"
            id="resetPuzzle"
        >
            🔄 إعادة الخلط
        </button>
    `;

    const board =
        document.getElementById("puzzleBoard");

    function createPieces(list) {

        board.innerHTML = "";

        list.forEach(function(piece) {

            const element =
                document.createElement("div");

            element.draggable = true;

            element.dataset.id =
                piece.id;

            element.textContent =
                piece.text;

            element.style.cssText = `
                width:90px;
                height:90px;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:45px;
                background:white;
                border:4px solid #64b5f6;
                border-radius:18px;
                cursor:grab;
                user-select:none;
                touch-action:none;
            `;

            element.addEventListener(
                "dragstart",
                function(e) {

                    e.dataTransfer.setData(
                        "text/plain",
                        piece.id
                    );

                    element.style.opacity = "0.5";
                }
            );

            element.addEventListener(
                "dragend",
                function() {

                    element.style.opacity = "1";
                }
            );

            element.addEventListener(
                "dragover",
                function(e) {

                    e.preventDefault();
                }
            );

            element.addEventListener(
                "drop",
                function(e) {

                    e.preventDefault();

                    const draggedId =
                        Number(
                            e.dataTransfer.getData(
                                "text/plain"
                            )
                        );

                    const dragged =
                        [...board.children]
                            .find(
                                el =>
                                    Number(
                                        el.dataset.id
                                    ) === draggedId
                            );

                    if (
                        !dragged ||
                        dragged === element
                    ) {
                        return;
                    }

                    board.insertBefore(
                        dragged,
                        element
                    );
                }
            );

            board.appendChild(element);
        });
    }

    createPieces(
        [...pieces].sort(
            () => Math.random() - 0.5
        )
    );

    document
        .getElementById("checkPuzzle")
        .onclick = function() {

            const order =
                [...board.children]
                    .map(
                        element =>
                            Number(
                                element.dataset.id
                            )
                    );

            const correct =
                [1, 2, 3];

            const isCorrect =
                order.every(
                    (id, index) =>
                        id === correct[index]
                );

            if (isCorrect) {

                completeCurrentGame();

            } else {

                showGameError();
            }
        };

    document
        .getElementById("resetPuzzle")
        .onclick = function() {

            createPieces(
                [...pieces].sort(
                    () => Math.random() - 0.5
                )
            );
        };
}


/* =========================================================
   8️⃣ الكتابة في الرمل
========================================================= */

function gameSand(container) {

    const item = getCurrentLetter();

    container.innerHTML = `
        <h3>🏖️ اكتب الحرف في الرمل</h3>

        <p>
            ارسم حرف ${item.letter}
            بإصبعك داخل الصندوق
        </p>

        <div
            id="sandArea"
            style="
                height:220px;
                background:#f5deb3;
                border:4px dashed #c9a66b;
                border-radius:20px;
                position:relative;
                touch-action:none;
                overflow:hidden;
            "
        >
            <div
                style="
                    position:absolute;
                    width:100%;
                    text-align:center;
                    top:50px;
                    font-size:100px;
                    color:rgba(120,90,50,.25);
                    pointer-events:none;
                "
            >
                ${item.letter}
            </div>
        </div>

        <br>

        <button
            class="success"
            id="sandDone"
        >
            ✅ انتهيت
        </button>
    `;

    const sand =
        document.getElementById("sandArea");

    let drawing = false;

    function position(e) {

        const rect =
            sand.getBoundingClientRect();

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    function addSandDot(p) {

        const dot =
            document.createElement("div");

        dot.style.position =
            "absolute";

        dot.style.width =
            "9px";

        dot.style.height =
            "9px";

        dot.style.background =
            "#8d6e63";

        dot.style.borderRadius =
            "50%";

        dot.style.left =
            p.x + "px";

        dot.style.top =
            p.y + "px";

        dot.style.pointerEvents =
            "none";

        sand.appendChild(dot);
    }

    sand.addEventListener(
        "pointerdown",
        function(e) {

            drawing = true;

            sand.setPointerCapture(
                e.pointerId
            );

            addSandDot(
                position(e)
            );
        }
    );

    sand.addEventListener(
        "pointermove",
        function(e) {

            if (!drawing) return;

            addSandDot(
                position(e)
            );
        }
    );

    sand.addEventListener(
        "pointerup",
        function() {

            drawing = false;
        }
    );

    sand.addEventListener(
        "pointercancel",
        function() {

            drawing = false;
        }
    );

    document
        .getElementById("sandDone")
        .onclick =
        completeCurrentGame;
}


/* =========================================================
   9️⃣ تتبع الحرف
========================================================= */

function gameTrace(container) {

    const item = getCurrentLetter();

    container.innerHTML = `
        <h3>✏️ تتبع الحرف</h3>

        <p>
            تتبع حرف ${item.letter}
            بإصبعك
        </p>

        <div
            style="
                font-size:130px;
                color:#b0bec5;
                border:4px dashed #90caf9;
                border-radius:20px;
                padding:20px;
                margin:15px;
            "
        >
            ${item.letter}
        </div>

        <button
            class="success"
            id="traceDone"
        >
            ✅ انتهيت
        </button>
    `;

    document
        .getElementById("traceDone")
        .onclick =
        completeCurrentGame;
}


/* =========================================================
   🔟 تلوين الحرف
========================================================= */

function gameColor(container) {

    const item = getCurrentLetter();

    container.innerHTML = `
        <h3>🎨 لوّن الحرف</h3>

        <div
            id="colorLetter"
            style="
                font-size:140px;
                font-weight:bold;
                margin:20px;
            "
        >
            ${item.letter}
        </div>

        <div class="options">

            <button
                class="option"
                data-color="red"
            >
                🔴
            </button>

            <button
                class="option"
                data-color="blue"
            >
                🔵
            </button>

            <button
                class="option"
                data-color="green"
            >
                🟢
            </button>

            <button
                class="option"
                data-color="orange"
            >
                🟠
            </button>

        </div>

        <button
            class="success"
            id="colorDone"
        >
            ✅ انتهيت
        </button>
    `;

    const letter =
        document.getElementById(
            "colorLetter"
        );

    document
        .querySelectorAll(
            "[data-color]"
        )
        .forEach(function(button) {

            button.onclick =
                function() {

                    letter.style.color =
                        button.dataset.color;
                };
        });

    document
        .getElementById("colorDone")
        .onclick =
        completeCurrentGame;
}


/* =========================================================
   1️⃣1️⃣ اختر الكلمة
========================================================= */

function gameChooseWord(container) {

    const item = getCurrentLetter();

    let choices = [
        item.word,
        "بَاب",
        "مُوز"
    ];

    while (choices.length < 3) {

        const random =
            letters[
                Math.floor(
                    Math.random() * letters.length
                )
            ].word;

        if (!choices.includes(random)) {
            choices.push(random);
        }
    }

    choices.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>
            📖 اختر الكلمة التي تبدأ بالحرف
        </h3>

        <div
            style="
                font-size:70px;
                margin:15px;
            "
        >
            ${item.letter}
        </div>

        <div
            class="options"
            id="wordGameOptions"
        ></div>
    `;

    const box =
        document.getElementById(
            "wordGameOptions"
        );

    choices.forEach(function(word) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent = word;

        button.onclick = function() {

            if (word === item.word) {

                completeCurrentGame();

            } else {

                showGameError();
            }
        };

        box.appendChild(button);
    });
}


/* =========================================================
   1️⃣2️⃣ ابحث عن الحرف
========================================================= */

function gameSearchLetter(container) {

    const item = getCurrentLetter();

    let choices = [
        item.letter,
        "ب",
        item.letter,
        "م",
        "ت",
        item.letter
    ];

    choices.sort(
        () => Math.random() - 0.5
    );

    let found = 0;

    container.innerHTML = `
        <h3>🔎 ابحث عن الحرف</h3>

        <p>
            اضغط على جميع حروف ${item.letter}
        </p>

        <div
            id="searchArea"
            class="options"
        ></div>
    `;

    const area =
        document.getElementById(
            "searchArea"
        );

    choices.forEach(function(choice) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent = choice;

        button.onclick = function() {

            if (choice === item.letter) {

                if (button.disabled) {
                    return;
                }

                button.disabled = true;

                found++;

                if (found === 3) {

                    completeCurrentGame();
                }

            } else {

                showGameError();
            }
        };

        area.appendChild(button);
    });
}
/* =========================================================
   🌟 تعلم مع أ/طه محمد
   script.js - الجزء الثاني
========================================================= */


/* =========================================================
   1️⃣3️⃣ التحدي النهائي
========================================================= */

function gameFinalChallenge(container) {

    const item = getCurrentLetter();

    let choices = [
        item.letter,
        "ب",
        "م"
    ];

    choices.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>🏆 التحدي النهائي</h3>

        <div
            style="
                font-size:80px;
                margin:15px;
            "
        >
            ${item.picture}
        </div>

        <p>
            ما الحرف الذي تبدأ به كلمة
            ${item.word}؟
        </p>

        <div
            class="options"
            id="finalOptions"
        ></div>
    `;

    const box =
        document.getElementById(
            "finalOptions"
        );

    choices.forEach(function(choice) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent = choice;

        button.onclick = function() {

            if (choice === item.letter) {

                completeCurrentGame();

            } else {

                showGameError();
            }
        };

        box.appendChild(button);
    });
}


/* =========================================================
   1️⃣4️⃣ البالونات
========================================================= */

function gameBalloons(container) {

    const item = getCurrentLetter();

    let balloons = [
        item.letter,
        "ب",
        "م",
        "س",
        item.letter,
        "ت"
    ];

    balloons.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>🎈 فرقع الحرف</h3>

        <p>
            فرقع البالونات التي تحمل حرف
            ${item.letter}
        </p>

        <div
            id="balloonArea"
            style="
                display:flex;
                flex-wrap:wrap;
                justify-content:center;
                gap:15px;
            "
        ></div>
    `;

    const area =
        document.getElementById(
            "balloonArea"
        );

    let found = 0;

    balloons.forEach(function(letter) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent =
            "🎈 " + letter;

        button.onclick = function() {

            if (letter === item.letter) {

                if (button.disabled) {
                    return;
                }

                button.disabled = true;

                found++;

                if (found === 2) {

                    completeCurrentGame();
                }

            } else {

                showGameError();
            }
        };

        area.appendChild(button);
    });
}


/* =========================================================
   1️⃣5️⃣ النحلة
========================================================= */

function gameBee(container) {

    const item = getCurrentLetter();

    let choices = [
        item.letter,
        "ب",
        "ت",
        "م"
    ];

    choices.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>🐝 النحلة تجمع الحرف</h3>

        <p>
            ساعد النحلة في جمع حرف
            ${item.letter}
        </p>

        <div
            style="
                font-size:70px;
                margin:15px;
            "
        >
            🐝
        </div>

        <div
            id="beeOptions"
            class="options"
        ></div>
    `;

    const box =
        document.getElementById(
            "beeOptions"
        );

    choices.forEach(function(choice) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent =
            "🌸 " + choice;

        button.onclick = function() {

            if (choice === item.letter) {

                completeCurrentGame();

            } else {

                showGameError();
            }
        };

        box.appendChild(button);
    });
}


/* =========================================================
   1️⃣6️⃣ سيارة الحرف
========================================================= */

function gameCar(container) {

    const item = getCurrentLetter();

    let roads = [
        item.letter,
        "ب",
        "م"
    ];

    roads.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>🚗 سيارة الحرف</h3>

        <p>
            اختر الطريق الذي يحمل حرف
            ${item.letter}
        </p>

        <div
            style="
                font-size:60px;
                margin:15px;
            "
        >
            🚗
        </div>

        <div
            id="roadOptions"
            class="options"
        ></div>
    `;

    const box =
        document.getElementById(
            "roadOptions"
        );

    roads.forEach(function(letter) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.style.minWidth =
            "100px";

        button.textContent =
            "🛣️ " + letter;

        button.onclick = function() {

            if (letter === item.letter) {

                completeCurrentGame();

            } else {

                showGameError();
            }
        };

        box.appendChild(button);
    });
}


/* =========================================================
   1️⃣7️⃣ صوب على الحرف
========================================================= */

function gameTarget(container) {

    const item = getCurrentLetter();

    let targets = [
        item.letter,
        "ب",
        "م",
        "س",
        item.letter
    ];

    targets.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>🎯 صوب على الحرف</h3>

        <p>
            اضغط على الهدف الذي يحمل حرف
            ${item.letter}
        </p>

        <div
            id="targetArea"
            class="options"
        ></div>
    `;

    const area =
        document.getElementById(
            "targetArea"
        );

    let found = 0;

    targets.forEach(function(letter) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent =
            "🎯 " + letter;

        button.onclick = function() {

            if (letter === item.letter) {

                if (button.disabled) {
                    return;
                }

                button.disabled = true;

                found++;

                if (found === 2) {

                    completeCurrentGame();
                }

            } else {

                showGameError();
            }
        };

        area.appendChild(button);
    });
}


/* =========================================================
   1️⃣8️⃣ لعبة الذاكرة
========================================================= */

function gameMemory(container) {

    const item = getCurrentLetter();

    const cards = [
        {
            id: 1,
            value: item.letter,
            type: "letter"
        },
        {
            id: 2,
            value: item.letter,
            type: "letter"
        },
        {
            id: 3,
            value: item.picture,
            type: "picture"
        },
        {
            id: 4,
            value: item.picture,
            type: "picture"
        }
    ];

    cards.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>🧠 لعبة الذاكرة</h3>

        <p>
            طابق الحرف مع صورته
        </p>

        <div
            id="memoryArea"
            style="
                display:grid;
                grid-template-columns:
                    repeat(2,100px);
                gap:15px;
                justify-content:center;
            "
        ></div>
    `;

    const area =
        document.getElementById(
            "memoryArea"
        );

    let first = null;
    let second = null;

    let matched = 0;
    let locked = false;

    cards.forEach(function(card) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.style.height =
            "100px";

        button.style.fontSize =
            "35px";

        button.textContent =
            "❓";

        button.onclick = function() {

            if (
                locked ||
                button.disabled
            ) {
                return;
            }

            button.textContent =
                card.value;

            if (!first) {

                first = {
                    button,
                    card
                };

                return;
            }

            second = {
                button,
                card
            };

            locked = true;

            const isPair =
                first.card.type ===
                second.card.type;

            setTimeout(function() {

                if (isPair) {

                    first.button.disabled =
                        true;

                    second.button.disabled =
                        true;

                    matched++;

                    if (matched === 2) {

                        completeCurrentGame();
                    }

                } else {

                    first.button.textContent =
                        "❓";

                    second.button.textContent =
                        "❓";
                }

                first = null;
                second = null;

                locked = false;

            }, 600);
        };

        area.appendChild(button);
    });
}


/* =========================================================
   1️⃣9️⃣ ضع الحرف في مكانه
========================================================= */

function gameDragPlace(container) {

    const item = getCurrentLetter();

    let choices = [
        item.letter,
        "ب",
        "م"
    ];

    choices.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>🏠 ضع الحرف في مكانه</h3>

        <p>
            اسحب حرف ${item.letter}
            إلى البيت
        </p>

        <div
            id="dropHouse"
            style="
                width:220px;
                height:120px;
                margin:20px auto;
                border:4px dashed #64b5f6;
                border-radius:20px;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:30px;
            "
        >
            🏠 ضع الحرف هنا
        </div>

        <div
            id="dragLetters"
            class="options"
        ></div>
    `;

    const house =
        document.getElementById(
            "dropHouse"
        );

    const area =
        document.getElementById(
            "dragLetters"
        );

    choices.forEach(function(letter) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.draggable = true;

        button.textContent = letter;

        button.addEventListener(
            "dragstart",
            function(e) {

                e.dataTransfer.setData(
                    "text/plain",
                    letter
                );
            }
        );

        area.appendChild(button);
    });

    house.addEventListener(
        "dragover",
        function(e) {

            e.preventDefault();
        }
    );

    house.addEventListener(
        "drop",
        function(e) {

            e.preventDefault();

            const letter =
                e.dataTransfer.getData(
                    "text/plain"
                );

            if (letter === item.letter) {

                completeCurrentGame();

            } else {

                showGameError();
            }
        }
    );
}


/* =========================================================
   2️⃣0️⃣ الحرف المختلف
========================================================= */

function gameDifferent(container) {

    const item = getCurrentLetter();

    let different =
        letters[
            Math.floor(
                Math.random() *
                letters.length
            )
        ].letter;

    while (
        different === item.letter
    ) {

        different =
            letters[
                Math.floor(
                    Math.random() *
                    letters.length
                )
            ].letter;
    }

    let choices = [
        item.letter,
        item.letter,
        item.letter,
        item.letter,
        different
    ];

    choices.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>🔥 الحرف المختلف</h3>

        <p>
            اضغط على الحرف المختلف
        </p>

        <div
            id="differentArea"
            class="options"
        ></div>
    `;

    const area =
        document.getElementById(
            "differentArea"
        );

    choices.forEach(function(letter) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent = letter;

        button.onclick = function() {

            if (letter === different) {

                completeCurrentGame();

            } else {

                showGameError();
            }
        };

        area.appendChild(button);
    });
}


/* =========================================================
   2️⃣1️⃣ صيد السمك
========================================================= */

function gameFish(container) {

    const item = getCurrentLetter();

    let fish = [
        item.letter,
        "ب",
        "م",
        item.letter,
        "ت"
    ];

    fish.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>🐠 صيد السمك</h3>

        <p>
            اصطد السمكة التي تحمل حرف
            ${item.letter}
        </p>

        <div
            id="fishArea"
            class="options"
        ></div>
    `;

    const area =
        document.getElementById(
            "fishArea"
        );

    let found = 0;

    fish.forEach(function(letter) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent =
            "🐠 " + letter;

        button.onclick = function() {

            if (letter === item.letter) {

                if (button.disabled) {
                    return;
                }

                button.disabled = true;

                found++;

                if (found === 2) {

                    completeCurrentGame();
                }

            } else {

                showGameError();
            }
        };

        area.appendChild(button);
    });
}


/* =========================================================
   2️⃣2️⃣ قطار الحروف
========================================================= */

function gameTrain(container) {

    const item = getCurrentLetter();

    const firstLetter =
        item.word.charAt(0);

    let choices = [
        firstLetter,
        "ب",
        "م"
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

    choices.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>🚂 قطار الحروف</h3>

        <p>
            اختر الحرف الذي يبدأ به
            ${item.word}
        </p>

        <div
            style="font-size:70px;"
        >
            🚂
        </div>

        <div
            id="trainOptions"
            class="options"
        ></div>
    `;

    const area =
        document.getElementById(
            "trainOptions"
        );

    choices.forEach(function(letter) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent =
            "🚃 " + letter;

        button.onclick = function() {

            if (letter === firstLetter) {

                completeCurrentGame();

            } else {

                showGameError();
            }
        };

        area.appendChild(button);
    });
}


/* =========================================================
   2️⃣3️⃣ الحرف المخفي
========================================================= */

function gameHidden(container) {

    const item = getCurrentLetter();

    let choices = [];

    for (let i = 0; i < 20; i++) {

        if (i === 12) {

            choices.push(item.letter);

        } else {

            choices.push(
                letters[
                    Math.floor(
                        Math.random() *
                        letters.length
                    )
                ].letter
            );
        }
    }

    choices.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>🔍 اكتشف الحرف المخفي</h3>

        <p>
            اضغط على حرف ${item.letter}
        </p>

        <div
            id="hiddenArea"
            style="
                line-height:2.5;
                font-size:35px;
            "
        ></div>
    `;

    const area =
        document.getElementById(
            "hiddenArea"
        );

    choices.forEach(function(letter) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.style.margin =
            "5px";

        button.textContent =
            letter;

        button.onclick = function() {

            if (letter === item.letter) {

                completeCurrentGame();

            } else {

                showGameError();
            }
        };

        area.appendChild(button);
    });
}


/* =========================================================
   2️⃣4️⃣ التلوين المتقدم
========================================================= */

function gameAdvancedColor(container) {

    const item = getCurrentLetter();

    const colors = [
        "red",
        "blue",
        "green",
        "orange",
        "purple"
    ];

    container.innerHTML = `
        <h3>🎨 لوّن الحرف المتقدم</h3>

        <p>
            اختر لونك المفضل
        </p>

        <div
            id="advancedColorLetter"
            style="
                font-size:150px;
                font-weight:bold;
                margin:20px;
            "
        >
            ${item.letter}
        </div>

        <div
            id="advancedColors"
            class="options"
        ></div>

        <button
            class="success"
            id="advancedColorDone"
        >
            ✅ انتهيت
        </button>
    `;

    const letter =
        document.getElementById(
            "advancedColorLetter"
        );

    const area =
        document.getElementById(
            "advancedColors"
        );

    colors.forEach(function(color) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent = "🎨";

        button.style.background =
            color;

        button.onclick = function() {

            letter.style.color =
                color;
        };

        area.appendChild(button);
    });

    document
        .getElementById(
            "advancedColorDone"
        )
        .onclick =
        completeCurrentGame;
}


/* =========================================================
   2️⃣5️⃣ طابق الحرف والصوت والصورة
========================================================= */

function gameMatchAll(container) {

    const item = getCurrentLetter();

    const cards = [
        {
            type: "letter",
            value: item.letter
        },
        {
            type: "sound",
            value: item.sound
        },
        {
            type: "picture",
            value: item.picture
        }
    ];

    cards.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `
        <h3>
            🧩 طابق الحرف والصوت والصورة
        </h3>

        <p>
            اضغط بالترتيب:
            الحرف ← الصوت ← الصورة
        </p>

        <div
            id="matchAllArea"
            class="options"
        ></div>
    `;

    const area =
        document.getElementById(
            "matchAllArea"
        );

    let step = 0;

    cards.forEach(function(card) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent =
            card.value;

        button.style.fontSize =
            "40px";

        button.onclick = function() {

            const correctType =
                [
                    "letter",
                    "sound",
                    "picture"
                ][step];

            if (card.type === correctType) {

                button.disabled = true;

                step++;

                if (step === 3) {

                    completeCurrentGame();
                }

            } else {

                showGameError();
            }
        };

        area.appendChild(button);
    });
}


/* =========================================================
   2️⃣6️⃣ الاختبار الشامل
========================================================= */

function gameFinalTest(container) {

    const item = getCurrentLetter();

    container.innerHTML = `
        <h3>
            🏆 اختبار حرف ${item.letter}
        </h3>

        <p>
            اختر الحرف الذي تسمعه:
        </p>

        <button
            class="option"
            id="listenFinal"
        >
            🔊 استمع
        </button>

        <div
            id="finalTestOptions"
            class="options"
            style="margin-top:20px;"
        ></div>
    `;

    document
        .getElementById("listenFinal")
        .onclick =
        function() {

            speakLessonSound();
        };

    let choices = [
        item.letter,
        "ب",
        "م",
        "س"
    ];

    while (choices.length < 4) {

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

    choices.sort(
        () => Math.random() - 0.5
    );

    const box =
        document.getElementById(
            "finalTestOptions"
        );

    choices.forEach(function(letter) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent =
            letter;

        button.onclick = function() {

            if (letter === item.letter) {

                completeCurrentGame();

            } else {

                showGameError();
            }
        };

        box.appendChild(button);
    });
}


/* =========================================================
   ❌ إجابة خاطئة
========================================================= */

function showGameError() {

    const message =
        document.getElementById(
            "gameMessage"
        );

    if (message) {

        message.textContent =
            "😊 حاول مرة أخرى";

        message.className =
            "game-message error-text";
    }

    speak("حاول مرة أخرى");
}


/* =========================================================
   📖 الكلمات
========================================================= */

const words = [
    {
        word: "بيت",
        picture: "🏠"
    },
    {
        word: "قلم",
        picture: "✏️"
    },
    {
        word: "كتاب",
        picture: "📚"
    },
    {
        word: "موز",
        picture: "🍌"
    },
    {
        word: "تفاح",
        picture: "🍎"
    },
    {
        word: "أسد",
        picture: "🦁"
    },
    {
        word: "سمكة",
        picture: "🐟"
    },
    {
        word: "شمس",
        picture: "☀️"
    },
    {
        word: "باب",
        picture: "🚪"
    },
    {
        word: "سيارة",
        picture: "🚗"
    }
];


function renderWord() {

    const item =
        words[currentWordIndex];

    const picture =
        document.getElementById(
            "wordPicture"
        );

    const word =
        document.getElementById(
            "currentWord"
        );

    if (picture) {
        picture.textContent =
            item.picture;
    }

    if (word) {
        word.textContent =
            item.word;
    }

    renderWordOptions();

    const message =
        document.getElementById(
            "wordMessage"
        );

    if (message) {
        message.textContent = "";
    }
}


function renderWordOptions() {

    const item =
        words[currentWordIndex];

    const box =
        document.getElementById(
            "wordOptions"
        );

    if (!box) {
        return;
    }

    box.innerHTML = "";

    let choices = [
        item.word,
        "قلم",
        "كتاب"
    ];

    choices = [
        ...new Set(choices)
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

    choices.sort(
        () => Math.random() - 0.5
    );

    choices.forEach(function(choice) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent =
            choice;

        button.onclick = function() {

            if (choice === item.word) {

                const message =
                    document.getElementById(
                        "wordMessage"
                    );

                if (message) {
                    message.textContent =
                        "⭐ أحسنت! إجابة صحيحة";
                }

                correctWords++;

                localStorage.setItem(
                    "correctWords",
                    correctWords
                );

                addStar();

                praise();

            } else {

                const message =
                    document.getElementById(
                        "wordMessage"
                    );

                if (message) {
                    message.textContent =
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


function speakWord() {

    const item =
        words[currentWordIndex];

    speak(item.word);
}


function nextWord() {

    currentWordIndex++;

    if (
        currentWordIndex >=
        words.length
    ) {
        currentWordIndex = 0;
    }

    renderWord();
}


/* =========================================================
   🔢 الأرقام
========================================================= */

function renderNumber() {

    const number =
        currentNumber;

    const numberElement =
        document.getElementById(
            "currentNumber"
        );

    const countItems =
        document.getElementById(
            "countItems"
        );

    if (numberElement) {

        numberElement.textContent =
            arabicNumber(number);
    }

    if (countItems) {

        let apples = "";

        for (
            let i = 0;
            i < number;
            i++
        ) {

            apples += "🍎 ";

            if (
                i > 0 &&
                (i + 1) % 10 === 0
            ) {
                apples += "<br>";
            }
        }

        countItems.innerHTML =
            apples;
    }

    renderNumberOptions();

    const message =
        document.getElementById(
            "numberMessage"
        );

    if (message) {
        message.textContent = "";
    }
}


function renderNumberOptions() {

    const box =
        document.getElementById(
            "numberOptions"
        );

    if (!box) {
        return;
    }

    box.innerHTML = "";

    let choices = [
        currentNumber
    ];

    while (choices.length < 3) {

        let random =
            Math.floor(
                Math.random() * 10
            ) + 1;

        if (!choices.includes(random)) {
            choices.push(random);
        }
    }

    choices.sort(
        () => Math.random() - 0.5
    );

    choices.forEach(function(choice) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent =
            arabicNumber(choice);

        button.onclick = function() {

            const message =
                document.getElementById(
                    "numberMessage"
                );

            if (choice === currentNumber) {

                if (message) {
                    message.textContent =
                        "⭐ أحسنت! إجابة صحيحة";
                }

                correctNumbers++;

                localStorage.setItem(
                    "correctNumbers",
                    correctNumbers
                );

                addStar();

                praise();

            } else {

                if (message) {
                    message.textContent =
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


function speakNumber() {

    speak(
        String(currentNumber)
    );
}


function newNumber() {

    currentNumber++;

    if (currentNumber > 10) {
        currentNumber = 1;
    }

    renderNumber();
}


/* =========================================================
   ✏️ الكتابة
========================================================= */

function renderWritingLetter() {

    const guide =
        document.getElementById(
            "writingGuide"
        );

    if (!guide) {
        return;
    }

    guide.textContent =
        letters[currentWritingIndex].letter;

    clearCanvas();
}


function newWritingLetter() {

    currentWritingIndex++;

    if (
        currentWritingIndex >=
        letters.length
    ) {
        currentWritingIndex = 0;
    }

    renderWritingLetter();
}


function finishWriting() {

    const message =
        document.getElementById(
            "writingMessage"
        );

    if (message) {

        message.textContent =
            "⭐ أحسنت! انتهيت من الكتابة";
    }

    addStar();

    praise();
}


/* =========================================================
   🖌️ Canvas الكتابة
========================================================= */

let writingCanvas = null;
let writingContext = null;
let drawingOnCanvas = false;


function setupWritingCanvas() {

    writingCanvas =
        document.getElementById(
            "writingCanvas"
        );

    if (!writingCanvas) {
        return;
    }

    const rect =
        writingCanvas.getBoundingClientRect();

    writingCanvas.width =
        rect.width || 300;

    writingCanvas.height =
        250;

    writingContext =
        writingCanvas.getContext("2d");

    writingContext.lineWidth = 7;

    writingContext.lineCap =
        "round";

    function getPosition(e) {

        const bounds =
            writingCanvas.getBoundingClientRect();

        return {
            x: e.clientX - bounds.left,
            y: e.clientY - bounds.top
        };
    }

    writingCanvas.addEventListener(
        "pointerdown",
        function(e) {

            drawingOnCanvas = true;

            writingCanvas.setPointerCapture(
                e.pointerId
            );

            const p =
                getPosition(e);

            writingContext.beginPath();

            writingContext.moveTo(
                p.x,
                p.y
            );
        }
    );

    writingCanvas.addEventListener(
        "pointermove",
        function(e) {

            if (!drawingOnCanvas) {
                return;
            }

            const p =
                getPosition(e);

            writingContext.lineTo(
                p.x,
                p.y
            );

            writingContext.stroke();
        }
    );

    writingCanvas.addEventListener(
        "pointerup",
        function() {

            drawingOnCanvas = false;
        }
    );

    writingCanvas.addEventListener(
        "pointercancel",
        function() {

            drawingOnCanvas = false;
        }
    );
}


function clearCanvas() {

    if (
        !writingCanvas ||
        !writingContext
    ) {
        return;
    }

    writingContext.clearRect(
        0,
        0,
        writingCanvas.width,
        writingCanvas.height
    );
}


/* =========================================================
   ➕ الجمع
========================================================= */

function newAddition() {

    addA =
        Math.floor(
            Math.random() * 10
        ) + 1;

    addB =
        Math.floor(
            Math.random() * 10
        ) + 1;

    const question =
        document.getElementById(
            "addQuestion"
        );

    const pictures =
        document.getElementById(
            "addPictures"
        );

    const answer =
        document.getElementById(
            "addAnswer"
        );

    const message =
        document.getElementById(
            "addMessage"
        );

    if (question) {

        question.textContent =
            `${arabicNumber(addA)} + ${arabicNumber(addB)} = ؟`;
    }

    if (pictures) {

        pictures.textContent =
            "🍎".repeat(addA) +
            " + " +
            "🍎".repeat(addB);
    }

    if (answer) {
        answer.value = "";
    }

    if (message) {
        message.textContent = "";
    }
}


function checkAddition() {

    const answer =
        document.getElementById(
            "addAnswer"
        );

    const message =
        document.getElementById(
            "addMessage"
        );

    if (!answer) {
        return;
    }

    const userAnswer =
        Number(answer.value);

    const correctAnswer =
        addA + addB;

    if (
        userAnswer ===
        correctAnswer
    ) {

        if (message) {

            message.textContent =
                "⭐ أحسنت! إجابة صحيحة";
        }

        correctAddition++;

        localStorage.setItem(
            "correctAddition",
            correctAddition
        );

        addStar();

        praise();

    } else {

        if (message) {

            message.textContent =
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

function newSubtraction() {

    subA =
        Math.floor(
            Math.random() * 10
        ) + 2;

    subB =
        Math.floor(
            Math.random() * subA
        ) + 1;

    const question =
        document.getElementById(
            "subQuestion"
        );

    const pictures =
        document.getElementById(
            "subPictures"
        );

    const answer =
        document.getElementById(
            "subAnswer"
        );

    const message =
        document.getElementById(
            "subMessage"
        );

    if (question) {

        question.textContent =
            `${arabicNumber(subA)} - ${arabicNumber(subB)} = ؟`;
    }

    if (pictures) {

        pictures.textContent =
            "🍎".repeat(subA) +
            "  ➖  " +
            "🍎".repeat(subB);
    }

    if (answer) {
        answer.value = "";
    }

    if (message) {
        message.textContent = "";
    }
}


function checkSubtraction() {

    const answer =
        document.getElementById(
            "subAnswer"
        );

    const message =
        document.getElementById(
            "subMessage"
        );

    if (!answer) {
        return;
    }

    const userAnswer =
        Number(answer.value);

    const correctAnswer =
        subA - subB;

    if (
        userAnswer ===
        correctAnswer
    ) {

        if (message) {

            message.textContent =
                "⭐ أحسنت! إجابة صحيحة";
        }

        correctSubtraction++;

        localStorage.setItem(
            "correctSubtraction",
            correctSubtraction
        );

        addStar();

        praise();

    } else {

        if (message) {

            message.textContent =
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

const surahs = [
    {
        name: "سورة الإخلاص",
        text:
            "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ"
    },
    {
        name: "سورة الفلق",
        text:
            "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ"
    },
    {
        name: "سورة الناس",
        text:
            "قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ"
    },
    {
        name: "سورة الكوثر",
        text:
            "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ ۝ فَصَلِّ لِرَبِّكَ وَانْحَرْ ۝ إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ"
    }
];


function renderSurah() {

    const surah =
        surahs[currentSurahIndex];

    const name =
        document.getElementById(
            "surahName"
        );

    const text =
        document.getElementById(
            "surahText"
        );

    if (name) {
        name.textContent =
            surah.name;
    }

    if (text) {
        text.textContent =
            surah.text;
    }
}


function speakSurah() {

    const surah =
        surahs[currentSurahIndex];

    speak(
        surah.name +
        ". " +
        surah.text
    );
}


function nextSurah() {

    currentSurahIndex++;

    if (
        currentSurahIndex >=
        surahs.length
    ) {
        currentSurahIndex = 0;
    }

    renderSurah();
}


/* =========================================================
   🕌 الأحاديث
========================================================= */

const hadiths = [
    {
        image: "❤️",
        text:
            "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
        source:
            "رواه البخاري ومسلم",
        meaning:
            "اعمل الخير بنية طيبة"
    },
    {
        image: "😊",
        text:
            "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ",
        source:
            "رواه الترمذي",
        meaning:
            "الابتسامة الجميلة صدقة"
    },
    {
        image: "🤝",
        text:
            "مَنْ لَا يَرْحَمْ لَا يُرْحَمْ",
        source:
            "رواه البخاري ومسلم",
        meaning:
            "ارحم الناس يرحمك الله"
    },
    {
        image: "🌷",
        text:
            "الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ",
        source:
            "رواه البخاري ومسلم",
        meaning:
            "قل كلامًا طيبًا وجميلًا"
    }
];


function renderHadith() {

    const hadith =
        hadiths[currentHadithIndex];

    const image =
        document.getElementById(
            "hadithImage"
        );

    const text =
        document.getElementById(
            "hadithText"
        );

    const source =
        document.getElementById(
            "hadithSource"
        );

    const meaning =
        document.getElementById(
            "hadithMeaning"
        );

    if (image) {
        image.textContent =
            hadith.image;
    }

    if (text) {
        text.textContent =
            hadith.text;
    }

    if (source) {
        source.textContent =
            hadith.source;
    }

    if (meaning) {
        meaning.textContent =
            hadith.meaning;
    }
}


function speakHadith() {

    const hadith =
        hadiths[currentHadithIndex];

    speak(
        hadith.text
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
   🤲 الأدعية
========================================================= */

const duas = [
    {
        title: "دعاء قبل الطعام",
        text: "بِسْمِ اللَّهِ"
    },
    {
        title: "دعاء بعد الطعام",
        text:
            "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ"
    },
    {
        title: "دعاء عند النوم",
        text:
            "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا"
    },
    {
        title: "دعاء الاستيقاظ",
        text:
            "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ"
    },
    {
        title: "دعاء دخول المنزل",
        text:
            "بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا"
    }
];


function renderDua() {

    const dua =
        duas[currentDuaIndex];

    const title =
        document.getElementById(
            "duaTitle"
        );

    const text =
        document.getElementById(
            "duaText"
        );

    if (title) {
        title.textContent =
            dua.title;
    }

    if (text) {
        text.textContent =
            dua.text;
    }
}


function speakDua() {

    const dua =
        duas[currentDuaIndex];

    speak(
        dua.text
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
   👨‍🏫 إحصائيات المعلم
========================================================= */

function updateTeacherStats() {

    const stars =
        document.getElementById(
            "teacherStars"
        );

    const lettersEl =
        document.getElementById(
            "teacherLetters"
        );

    const wordsEl =
        document.getElementById(
            "teacherWords"
        );

    const numbersEl =
        document.getElementById(
            "teacherNumbers"
        );

    const additionEl =
        document.getElementById(
            "teacherAddition"
        );

    const subtractionEl =
        document.getElementById(
            "teacherSubtraction"
        );

    if (stars) {
        stars.textContent =
            arabicNumber(totalStars);
    }

    if (lettersEl) {
        lettersEl.textContent =
            arabicNumber(correctLetters);
    }

    if (wordsEl) {
        wordsEl.textContent =
            arabicNumber(correctWords);
    }

    if (numbersEl) {
        numbersEl.textContent =
            arabicNumber(correctNumbers);
    }

    if (additionEl) {
        additionEl.textContent =
            arabicNumber(correctAddition);
    }

    if (subtractionEl) {
        subtractionEl.textContent =
            arabicNumber(correctSubtraction);
    }

    const level =
        Math.floor(
            totalStars / 10
        ) + 1;

    const teacherLevel =
        document.getElementById(
            "teacherLevel"
        );

    if (teacherLevel) {

        teacherLevel.textContent =
            arabicNumber(level);
    }
}


/* =========================================================
   🔄 تصفير النتائج
========================================================= */

function resetProgress() {

    const confirmed =
        confirm(
            "هل تريد تصفير جميع النتائج والنجوم؟"
        );

    if (!confirmed) {
        return;
    }

    totalStars = 0;

    correctLetters = 0;
    correctWords = 0;
    correctNumbers = 0;
    correctAddition = 0;
    correctSubtraction = 0;

    localStorage.removeItem(
        "totalStars"
    );

    localStorage.removeItem(
        "correctLetters"
    );

    localStorage.removeItem(
        "correctWords"
    );

    localStorage.removeItem(
        "correctNumbers"
    );

    localStorage.removeItem(
        "correctAddition"
    );

    localStorage.removeItem(
        "correctSubtraction"
    );

    updateStarsDisplay();
    updateTeacherStats();

    speak(
        "تم تصفير النتائج"
    );
}


/* =========================================================
   🚀 تشغيل التطبيق عند فتح الصفحة
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        renderLetterGrid();

        updateStarsDisplay();

        updateTeacherStats();

        renderWord();

        renderNumber();

        renderWritingLetter();

        newAddition();

        newSubtraction();

        renderSurah();

        renderHadith();

        renderDua();

        setupWritingCanvas();
    }
);


/* =========================================================
   ⌨️ منع إرسال الصفحة عند الضغط Enter
   في حقول الجمع والطرح
========================================================= */

document.addEventListener(
    "keydown",
    function(e) {

        if (
            e.key !== "Enter"
        ) {
            return;
        }

        const active =
            document.activeElement;

        if (!active) {
            return;
        }

        if (
            active.id ===
            "addAnswer"
        ) {

            checkAddition();

        }

        if (
            active.id ===
            "subAnswer"
        ) {

            checkSubtraction();
        }
    }
);


/* =========================================================
   🎉 نهاية script.js
========================================================= */
