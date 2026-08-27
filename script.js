/* ==========================================
   🔤 بيانات الحروف بالحركات
========================================== */

const letters = [
    { letter: "أ", sound: "أَ", word: "أَسَد", picture: "🦁", audio: "sound/alif.mp3" },
    { letter: "ب", sound: "بَ", word: "بَطَّة", picture: "🦆", audio: "" },
    { letter: "ت", sound: "تَ", word: "تَمْر", picture: "🌴", audio: "" },
    { letter: "ث", sound: "ثَ", word: "ثَعْلَب", picture: "🦊", audio: "" },
    { letter: "ج", sound: "جَ", word: "جَمَل", picture: "🐪", audio: "" },
    { letter: "ح", sound: "حَ", word: "حَمَامَة", picture: "🕊️", audio: "" },
    { letter: "خ", sound: "خَ", word: "خَرُوف", picture: "🐑", audio: "" },
    { letter: "د", sound: "دَ", word: "دَجَاجَة", picture: "🐔", audio: "" },
    { letter: "ذ", sound: "ذَ", word: "ذَرَة", picture: "🌽", audio: "" },
    { letter: "ر", sound: "رَ", word: "رُمَّان", picture: "🔴", audio: "" },
    { letter: "ز", sound: "زَ", word: "زَهْرَة", picture: "🌸", audio: "" },
    { letter: "س", sound: "سَ", word: "سَمَكَة", picture: "🐟", audio: "" },
    { letter: "ش", sound: "شَ", word: "شَمْس", picture: "☀️", audio: "" },
    { letter: "ص", sound: "صَ", word: "صَقْر", picture: "🦅", audio: "" },
    { letter: "ض", sound: "ضَ", word: "ضَفْدَع", picture: "🐸", audio: "" },
    { letter: "ط", sound: "طَ", word: "طَائِرَة", picture: "✈️", audio: "" },
    { letter: "ظ", sound: "ظَ", word: "ظَرْف", picture: "✉️", audio: "" },
    { letter: "ع", sound: "عَ", word: "عَيْن", picture: "👁️", audio: "" },
    { letter: "غ", sound: "غَ", word: "غَزَال", picture: "🦌", audio: "" },
    { letter: "ف", sound: "فَ", word: "فَرَاشَة", picture: "🦋", audio: "" },
    { letter: "ق", sound: "قَ", word: "قَلَم", picture: "✏️", audio: "" },
    { letter: "ك", sound: "كَ", word: "كَعْكَة", picture: "🍰", audio: "" },
    { letter: "ل", sound: "لَ", word: "لَيْمُون", picture: "🍋", audio: "" },
    { letter: "م", sound: "مَ", word: "مَوْز", picture: "🍌", audio: "" },
    { letter: "ن", sound: "نَ", word: "نَحْلَة", picture: "🐝", audio: "" },
    { letter: "هـ", sound: "هَ", word: "هَلَال", picture: "🌙", audio: "" },
    { letter: "و", sound: "وَ", word: "وَرْدَة", picture: "🌹", audio: "" },
    { letter: "ي", sound: "يَ", word: "يَد", picture: "✋", audio: "" }
];


/* ==========================================
   ⭐ نظام النقاط والنجوم العام
========================================== */

let totalStars = 0;

function addStar() {
    totalStars++;
    updateStarsDisplay();
}

function updateStarsDisplay() {
    const starElements = document.querySelectorAll(".total-stars");

    starElements.forEach(function(el) {
        el.textContent = arabicNumber(totalStars);
    });
}


/* ==========================================
   🗣️ نظام النطق والصوت
========================================== */

let currentAudio = null;

function speak(text) {
    if (!("speechSynthesis" in window)) return;

    try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = "ar-SA";
        utterance.rate = 0.85;
        utterance.pitch = 1.1;

        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.log("تعذر تشغيل النطق:", error);
    }
}


function playAudio(path) {
    try {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        currentAudio = new Audio(path);

        currentAudio.play().catch(function(error) {
            console.log("تعذر تشغيل الملف الصوتي:", error);

            currentAudio = null;
        });
    } catch (error) {
        console.log("خطأ في تشغيل الصوت:", error);
    }
}


function praise() {
    const phrases = [
        "ممتاز!",
        "أحسنت!",
        "بطل!",
        "رائع جداً!",
        "بارك الله فيك!"
    ];

    const randomPhrase =
        phrases[Math.floor(Math.random() * phrases.length)];

    speak(randomPhrase);
}


/* ==========================================
   🔢 تحويل الأرقام إلى العربية
========================================== */

function arabicNumber(n) {
    const arabicNums = [
        "٠", "١", "٢", "٣", "٤",
        "٥", "٦", "٧", "٨", "٩"
    ];

    return String(n).replace(/\d/g, function(x) {
        return arabicNums[x];
    });
}


/* ==========================================
   📱 التنقل بين الأقسام
========================================== */

function showScreen(screenId) {

    document.querySelectorAll(".screen").forEach(function(screen) {
        screen.classList.remove("active");
    });

    const target = document.getElementById(screenId);

    if (target) {
        target.classList.add("active");
    }
}


/* ==========================================
   🏠 تهيئة التطبيق
========================================== */

document.addEventListener("DOMContentLoaded", function() {

    renderLetterGrid();

    updateStarsDisplay();
});


/* ==========================================
   🔤 شبكة الحروف
========================================== */

function renderLetterGrid() {

    const grid = document.getElementById("lettersGrid");

    if (!grid) return;

    grid.innerHTML = "";

    letters.forEach(function(item, index) {

        const card = document.createElement("div");

        card.className = "letter-card";

        card.innerHTML = `
            <div class="card-letter">${item.letter}</div>
            <div class="card-word">${item.word}</div>
        `;

        card.onclick = function() {

            currentLetterIndex = index;

            openLetterLesson();
        };

        grid.appendChild(card);
    });
}


/* ==========================================
   📖 قسم درس الحرف
========================================== */

function openLetterLesson() {

    showScreen("lessonScreen");

    updateLetterLesson();
}


function updateLetterLesson() {

    const item = getCurrentLetter();

    const letterEl =
        document.getElementById("lessonLetterDisplay");

    const soundEl =
        document.getElementById("lessonSoundDisplay");

    const wordEl =
        document.getElementById("lessonWordDisplay");

    const pictureEl =
        document.getElementById("lessonPictureDisplay");


    if (letterEl) {
        letterEl.textContent = item.letter;
    }

    if (soundEl) {
        soundEl.textContent = item.sound;
    }

    if (wordEl) {
        wordEl.textContent = item.word;
    }

    if (pictureEl) {
        pictureEl.textContent = item.picture;
    }

    startLetterGames();
}


/* ==========================================
   🎮 محرك الألعاب
========================================== */

let currentGameIndex = 0;

let currentLetterIndex = 0;

let completedGames = [];

const TOTAL_GAMES = 26;


/* ==========================================
   🔍 الحصول على الحرف الحالي
========================================== */

function getCurrentLetter() {

    return letters[currentLetterIndex];
}


/* ==========================================
   🎧 صوت درس الحرف
========================================== */

function speakLessonSound() {

    const item = getCurrentLetter();

    if (item.audio) {

        playAudio(item.audio);

        return;
    }

    speak(item.sound);
}


/* ==========================================
   ▶️ بدء ألعاب الحرف
========================================== */

function startLetterGames() {

    currentGameIndex = 0;

    completedGames =
        new Array(TOTAL_GAMES).fill(false);


    const badge =
        document.getElementById("badgeArea");

    if (badge) {
        badge.style.display = "none";
    }


    const nextButton =
        document.getElementById("nextGameButton");

    if (nextButton) {
        nextButton.style.display = "none";
    }


    updateGameProgress();

    renderCurrentMiniGame();
}


/* ==========================================
   📊 تقدم الألعاب
========================================== */

function updateGameProgress() {

    const number =
        document.getElementById("currentGameNumber");

    const fill =
        document.getElementById("gameProgressFill");

    const starsElement =
        document.getElementById("letterStars");


    if (number) {

        number.textContent =
            arabicNumber(currentGameIndex + 1);
    }


    if (fill) {

        const percentage =
            (currentGameIndex / TOTAL_GAMES) * 100;

        fill.style.width =
            percentage + "%";
    }


    if (starsElement) {

        const count =
            completedGames.filter(Boolean).length;

        starsElement.textContent =
            arabicNumber(count);
    }
}


/* ==========================================
   ⭐ إكمال اللعبة الحالية
========================================== */

function completeCurrentGame() {

    if (completedGames[currentGameIndex]) {
        return;
    }


    completedGames[currentGameIndex] = true;

    addStar();


    const message =
        document.getElementById("gameMessage");

    if (message) {

        message.textContent = "⭐ ممتاز";

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


/* ==========================================
   ▶️ اللعبة التالية
========================================== */

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


/* ==========================================
   🏅 الشارة النهائية
========================================== */

function finishLetterBadge() {

    const badge =
        document.getElementById("badgeArea");

    const miniGame =
        document.getElementById("miniGame");

    const nextButton =
        document.getElementById("nextGameButton");


    if (miniGame) {
        miniGame.innerHTML = "";
    }


    if (nextButton) {
        nextButton.style.display = "none";
    }


    if (badge) {
        badge.style.display = "block";
    }


    speak(
        "أحسنت! انتهيت من الألعاب الستة والعشرين."
    );


    const fill =
        document.getElementById("gameProgressFill");

    if (fill) {
        fill.style.width = "100%";
    }
}


/* ==========================================
   🎮 تشغيل اللعبة الحالية
========================================== */

function renderCurrentMiniGame() {

    const container =
        document.getElementById("miniGame");

    const message =
        document.getElementById("gameMessage");

    const nextButton =
        document.getElementById("nextGameButton");


    if (!container) return;


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


/* ==========================================
   1️⃣ تعرف على الحرف
========================================== */

function gameRecognizeLetter(container) {

    const item = getCurrentLetter();


    container.innerHTML = `

        <h3>🔤 تعرف على الحرف</h3>

        <p>اضغط على الحرف واستمع إليه</p>

        <button
            class="option"
            id="recognizeLetterButton"
            style="font-size:70px;">
            ${item.letter}
        </button>

        <p style="font-size:40px;">
            ${item.picture}
        </p>

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


/* ==========================================
   2️⃣ اختر الحرف الصحيح
========================================== */

function gameChooseLetter(container) {

    const item = getCurrentLetter();

    let choices = [item.letter];


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
            id="gameOptions">
        </div>
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

                speakLessonSound();

                setTimeout(
                    completeCurrentGame,
                    300
                );

            } else {

                showGameError();
            }
        };


        box.appendChild(button);
    });
}


/* ==========================================
   3️⃣ اختر صوت الحرف
========================================== */

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
            class="lesson-letter">
            ${item.letter}
        </div>

        <p>
            ما الصوت الصحيح؟
        </p>

        <div
            class="options"
            id="soundOptions">
        </div>
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


/* ==========================================
   4️⃣ أين الحرف؟
========================================== */

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


    choices =
        choices.slice(0, 5);


    choices.sort(
        () => Math.random() - 0.5
    );


    container.innerHTML = `

        <h3>
            👀 أين حرف ${item.letter}؟
        </h3>

        <p>
            اضغط على الحرف الصحيح
        </p>

        <div
            class="options"
            id="findOptions">
        </div>
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


/* ==========================================
   5️⃣ صيد الحروف
========================================== */

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
            ">
        </div>
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


/* ==========================================
   6️⃣ وصل الحرف بالصورة
========================================== */

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
            style="font-size:70px;">
            ${item.picture}
        </div>

        <p>
            ما اسم الصورة؟
        </p>

        <div
            class="options"
            id="matchOptions">
        </div>
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


/* ==========================================
   7️⃣ البازل
========================================== */

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

        <h3>
            🧩 بازل حرف ${item.letter}
        </h3>

        <p>
            اضغط على القطع بالترتيب:
            الحرف ← الصوت ← الصورة
        </p>

        <div
            id="puzzleBoard"
            style="
                display:flex;
                flex-wrap:wrap;
                justify-content:center;
                align-items:center;
                gap:12px;
                min-height:130px;
                margin:20px 0;
                padding:15px;
                border:4px dashed #90caf9;
                border-radius:20px;
                background:#f5faff;
            ">
        </div>

        <p>
            الترتيب الصحيح:
            <strong>
                ${item.letter}
                ←
                ${item.sound}
                ←
                ${item.picture}
            </strong>
        </p>

        <button
            class="success"
            id="checkPuzzle">
            ✅ تحقق من الترتيب
        </button>

        <button
            class="option"
            id="resetPuzzle">
            🔄 إعادة الخلط
        </button>
    `;


    const board =
        document.getElementById("puzzleBoard");


    let selectedOrder = [];


    function createPieces(list) {

        board.innerHTML = "";

        selectedOrder = [];


        list.forEach(function(piece) {

            const element =
                document.createElement("button");


            element.className = "option";

            element.dataset.id =
                piece.id;

            element.textContent =
                piece.text;


            element.style.cssText += `
                width:90px;
                height:90px;
                font-size:40px;
                margin:5px;
            `;


            element.onclick = function() {

                if (
                    element.disabled
                ) {
                    return;
                }


                selectedOrder.push(
                    piece.id
                );


                element.disabled = true;

                element.style.opacity = "0.5";


                if (
                    selectedOrder.length === 3
                ) {

                    const correct =
                        [1, 2, 3];


                    const isCorrect =
                        selectedOrder.every(
                            function(id, index) {
                                return (
                                    id ===
                                    correct[index]
                                );
                            }
                        );


                    if (isCorrect) {

                        completeCurrentGame();

                    } else {

                        showGameError();

                        setTimeout(
                            function() {

                                selectedOrder = [];

                                board
                                    .querySelectorAll(
                                        "button"
                                    )
                                    .forEach(
                                        function(btn) {

                                            btn.disabled =
                                                false;

                                            btn.style.opacity =
                                                "1";
                                        }
                                    );

                            },
                            600
                        );
                    }
                }
            };


            board.appendChild(element);
        });
    }


    createPieces(
        [...pieces].sort(
            () => Math.random() - 0.5
        )
    );


    document.getElementById(
        "checkPuzzle"
    ).onclick = function() {

        if (selectedOrder.length !== 3) {

            showGameError();

            return;
        }


        const correct = [1, 2, 3];


        const isCorrect =
            selectedOrder.every(
                function(id, index) {
                    return id === correct[index];
                }
            );


        if (isCorrect) {

            completeCurrentGame();

        } else {

            showGameError();
        }
    };


    document.getElementById(
        "resetPuzzle"
    ).onclick = function() {

        createPieces(
            [...pieces].sort(
                () => Math.random() - 0.5
            )
        );
    };
}


/* ==========================================
   8️⃣ الكتابة في الرمل
========================================== */

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
            ">

            <div
                style="
                    position:absolute;
                    width:100%;
                    text-align:center;
                    top:50px;
                    font-size:100px;
                    color:rgba(120,90,50,.25);
                    pointer-events:none;
                ">
                ${item.letter}
            </div>

        </div>

        <br>

        <button
            class="option"
            id="clearSand">
            🔄 مسح
        </button>

        <button
            class="success"
            id="sandDone">
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


    document.getElementById(
        "clearSand"
    ).onclick = function() {

        sand
            .querySelectorAll(
                "div:not(:first-child)"
            )
            .forEach(
                function(dot) {
                    dot.remove();
                }
            );
    };


    document.getElementById(
        "sandDone"
    ).onclick =
        completeCurrentGame;
}


/* ==========================================
   9️⃣ تتبع الحرف
========================================== */

function gameTrace(container) {

    const item = getCurrentLetter();


    container.innerHTML = `

        <h3>✏️ تتبع الحرف</h3>

        <p>
            تتبع حرف ${item.letter}
            بإصبعك
        </p>

        <div
            id="traceLetter"
            style="
                font-size:130px;
                color:#b0bec5;
                border:4px dashed #90caf9;
                border-radius:20px;
                padding:20px;
                margin:15px;
                user-select:none;
                touch-action:none;
            ">
            ${item.letter}
        </div>

        <button
            class="success"
            id="traceDone">
            ✅ انتهيت
        </button>
    `;


    const trace =
        document.getElementById(
            "traceLetter"
        );


    let touched = false;


    trace.addEventListener(
        "pointerdown",
        function() {

            touched = true;

            trace.style.color =
                "#42a5f5";
        }
    );


    trace.addEventListener(
        "pointermove",
        function() {

            if (touched) {

                trace.style.color =
                    "#42a5f5";
            }
        }
    );


    trace.addEventListener(
        "pointerup",
        function() {

            touched = false;
        }
    );


    document.getElementById(
        "traceDone"
    ).onclick =
        completeCurrentGame;
}


/* ==========================================
   🔟 تلوين الحرف
========================================== */

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
            ">
            ${item.letter}
        </div>

        <div class="options">

            <button
                class="option"
                data-color="red">
                🔴
            </button>

            <button
                class="option"
                data-color="blue">
                🔵
            </button>

            <button
                class="option"
                data-color="green">
                🟢
            </button>

            <button
                class="option"
                data-color="orange">
                🟠
            </button>

        </div>

        <button
            class="success"
            id="colorDone">
            ✅ انتهيت
        </button>
    `;


    const letter =
        document.getElementById(
            "colorLetter"
        );


    document
        .querySelectorAll("[data-color]")
        .forEach(function(button) {

            button.onclick = function() {

                letter.style.color =
                    button.dataset.color;
            };
        });


    document.getElementById(
        "colorDone"
    ).onclick =
        completeCurrentGame;
}


/* ==========================================
   1️⃣1️⃣ اختر الكلمة
========================================== */

function gameChooseWord(container) {

    const item = getCurrentLetter();

    const correct = item.word;


    let choices = [
        correct,
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
            ">
            ${item.letter}
        </div>

        <div
            class="options"
            id="wordGameOptions">
        </div>
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

            if (word === correct) {

                completeCurrentGame();

            } else {

                showGameError();
            }
        };


        box.appendChild(button);
    });
}


/* ==========================================
   1️⃣2️⃣ ابحث عن الحرف
========================================== */

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


    let found = 0;


    choices.sort(
        () => Math.random() - 0.5
    );


    container.innerHTML = `

        <h3>🔎 ابحث عن الحرف</h3>

        <p>
            اضغط على جميع حروف ${item.letter}
        </p>

        <div
            id="searchArea"
            class="options">
        </div>
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

            if (button.disabled) return;


            if (choice === item.letter) {

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


/* ==========================================
   1️⃣3️⃣ التحدي النهائي
========================================== */

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
            ">
            ${item.picture}
        </div>

        <p>
            ما الحرف الذي تبدأ به كلمة
            ${item.word}؟
        </p>

        <div
            class="options"
            id="finalOptions">
        </div>
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


/* ==========================================
   1️⃣4️⃣ فرقع الحرف 🎈
========================================== */

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
            فرقع البالونات التي تحمل
            حرف ${item.letter}
        </p>

        <div
            id="balloonArea"
            style="
                display:flex;
                flex-wrap:wrap;
                justify-content:center;
                gap:15px;
            ">
        </div>
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

            if (button.disabled) return;


            if (letter === item.letter) {

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


/* ==========================================
   1️⃣5️⃣ النحلة تجمع الحرف 🐝
========================================== */

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
            ">
            🐝
        </div>

        <div
            id="beeOptions"
            class="options">
        </div>
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


/* ==========================================
   1️⃣6️⃣ سيارة الحرف 🚗
========================================== */

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
            اختر الطريق الذي يحمل
            حرف ${item.letter}
        </p>

        <div
            style="
                font-size:60px;
                margin:15px;
            ">
            🚗
        </div>

        <div
            id="roadOptions"
            class="options">
        </div>
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


/* ==========================================
   1️⃣7️⃣ صوّب على الحرف 🎯
========================================== */

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

        <h3>🎯 صوّب على الحرف</h3>

        <p>
            اضغط على الهدف الذي يحمل
            حرف ${item.letter}
        </p>

        <div
            id="targetArea"
            class="options">
        </div>
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

            if (button.disabled) return;


            if (letter === item.letter) {

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


/* ==========================================
   1️⃣8️⃣ لعبة الذاكرة 🧠
========================================== */

function gameMemory(container) {

    const item = getCurrentLetter();


    const cards = [

        {
            id: 1,
            pair: "A",
            value: item.letter
        },

        {
            id: 2,
            pair: "A",
            value: item.letter
        },

        {
            id: 3,
            pair: "B",
            value: item.picture
        },

        {
            id: 4,
            pair: "B",
            value: item.picture
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
            ">
        </div>
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


        button.textContent = "❓";


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
                first.card.pair ===
                second.card.pair;


            setTimeout(
                function() {

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

                },
                700
            );
        };


        area.appendChild(button);
    });
}


/* ==========================================
   1️⃣9️⃣ ضع الحرف في مكانه 🏠
========================================== */

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
            اختر حرف ${item.letter}
            ثم ضعه في البيت
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
                touch-action:none;
            ">
            🏠
        </div>

        <div
            id="dragLetters"
            class="options">
        </div>
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

        button.textContent = letter;


        /*
         * اختيار باللمس للموبايل
         */
        button.onclick = function() {

            if (letter === item.letter) {

                house.textContent =
                    "🏠 " + letter;

                completeCurrentGame();

            } else {

                showGameError();
            }
        };


        area.appendChild(button);
    });
}


/* ==========================================
   2️⃣0️⃣ الحرف المختلف 🔥
========================================== */

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
            class="options">
        </div>
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


/* ==========================================
   2️⃣1️⃣ صيد السمك 🐠
========================================== */

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
            اصطد السمكة التي تحمل
            حرف ${item.letter}
        </p>

        <div
            id="fishArea"
            class="options">
        </div>
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

            if (button.disabled) return;


            if (letter === item.letter) {

                button.disabled = true;

                found++;


                if (found =
