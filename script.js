/* ==========================================
   🔤 بيانات الحروف بالحركات
========================================== */

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


/* ==========================================
   🎮 إعداد الألعاب
========================================== */

let currentGameIndex = 0;
let currentLetterIndex = 0;
let completedGames = [];
const TOTAL_GAMES = 26;


/* ==========================================
   🔍 الحرف الحالي
========================================== */

function getCurrentLetter() {
    return letters[currentLetterIndex];
}


/* ==========================================
   🔊 نطق صوت الحرف
========================================== */

function speakLessonSound() {

    const item = getCurrentLetter();

    if (item.audio) {

        const audio = new Audio(item.audio);

        audio.currentTime = 0;

        audio.play().catch(function(error) {
            console.log("تعذر تشغيل الصوت:", error);
        });

        return;
    }

    if (typeof speak === "function") {
        speak(item.sound);
    }
}


/* ==========================================
   ▶️ بدء الألعاب
========================================== */

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


/* ==========================================
   📊 تقدم الألعاب
========================================== */

function updateGameProgress() {

    const number = document.getElementById("currentGameNumber");
    const fill = document.getElementById("gameProgressFill");
    const starsElement = document.getElementById("letterStars");

    if (number) {

        if (typeof arabicNumber === "function") {
            number.textContent = arabicNumber(currentGameIndex + 1);
        } else {
            number.textContent = currentGameIndex + 1;
        }
    }

    if (fill) {

        const percentage =
            (currentGameIndex / TOTAL_GAMES) * 100;

        fill.style.width = percentage + "%";
    }

    if (starsElement) {

        const count =
            completedGames.filter(Boolean).length;

        if (typeof arabicNumber === "function") {
            starsElement.textContent = arabicNumber(count);
        } else {
            starsElement.textContent = count;
        }
    }
}


/* ==========================================
   ⭐ إكمال اللعبة
========================================== */

function completeCurrentGame() {

    if (completedGames[currentGameIndex]) {
        return;
    }

    completedGames[currentGameIndex] = true;

    if (typeof addStar === "function") {
        addStar();
    }

    const message =
        document.getElementById("gameMessage");

    if (message) {

        message.textContent = "⭐ ممتاز! أحسنت";

        message.className =
            "game-message success-text";
    }

    if (typeof praise === "function") {
        praise();
    }

    updateGameProgress();

    const nextButton =
        document.getElementById("nextGameButton");

    if (nextButton) {

        nextButton.style.display = "inline-block";

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

        if (typeof speak === "function") {
            speak("أكمل اللعبة أولًا");
        }

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
        miniGame.innerHTML = `
            <div style="
                text-align:center;
                padding:30px;
                font-size:22px;
            ">
                <div style="font-size:100px;">🏆</div>
                <h2>أحسنت يا بطل! 🌟</h2>
                <p>لقد أكملت جميع الألعاب بنجاح.</p>
                <p style="font-size:45px;">⭐⭐⭐⭐⭐</p>
            </div>
        `;
    }

    if (nextButton) {
        nextButton.style.display = "none";
    }

    if (badge) {
        badge.style.display = "block";
    }

    const fill =
        document.getElementById("gameProgressFill");

    if (fill) {
        fill.style.width = "100%";
    }

    if (typeof speak === "function") {
        speak(
            "أحسنت! انتهيت من الألعاب الستة والعشرين."
        );
    }
}


/* ==========================================
   🎮 تشغيل اللعبة
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

        <p>
            اضغط على الحرف واستمع إلى صوته
        </p>

        <button
            class="option"
            id="recognizeLetterButton"
            style="font-size:80px;"
        >
            ${item.letter}
        </button>

        <div style="
            font-size:80px;
            margin:15px;
        ">
            ${item.picture}
        </div>

        <p style="font-size:25px;">
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

    let choices = [
        item.letter
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

    container.innerHTML = `

        <h3>🎯 اختر الحرف الصحيح</h3>

        <p>
            أين حرف ${item.letter}؟
        </p>

        <div
            class="options"
            id="chooseLetterOptions"
        ></div>
    `;

    const box =
        document.getElementById(
            "chooseLetterOptions"
        );

    choices.forEach(function(choice) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.style.fontSize = "50px";

        button.textContent = choice;

        button.onclick = function() {

            if (choice === item.letter) {

                speakLessonSound();

                completeCurrentGame();

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
        item.sound
    ];

    while (choices.length < 3) {

        const random =
            letters[
                Math.floor(
                    Math.random() *
                    letters.length
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
            style="font-size:90px;"
        >
            ${item.letter}
        </div>

        <button
            class="option"
            id="listenSoundButton"
        >
            🔊 استمع إلى الحرف
        </button>

        <p>
            اختر الصوت الصحيح
        </p>

        <div
            class="options"
            id="soundOptions"
        ></div>
    `;

    document
        .getElementById("listenSoundButton")
        .onclick = function() {

            speakLessonSound();
        };

    const box =
        document.getElementById(
            "soundOptions"
        );

    choices.forEach(function(choice) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent = choice;

        button.onclick = function() {

            if (choice === item.sound) {

                speakLessonSound();

                completeCurrentGame();

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
        item.letter
    ];

    while (choices.length < 6) {

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

        <h3>👀 أين الحرف؟</h3>

        <p>
            اضغط على حرف ${item.letter}
        </p>

        <div
            class="options"
            id="findOptions"
        ></div>
    `;

    const box =
        document.getElementById(
            "findOptions"
        );

    choices.forEach(function(choice) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.style.fontSize = "45px";

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
        item.letter,
        "ب",
        "م",
        "س",
        "ت",
        "ل",
        "ن"
    ];

    choices.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `

        <h3>🎯 صيد الحروف</h3>

        <p>
            اصطد حرف ${item.letter} مرتين
        </p>

        <div
            id="catchArea"
            class="options"
        ></div>
    `;

    const area =
        document.getElementById(
            "catchArea"
        );

    let found = 0;

    choices.forEach(function(choice) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.style.fontSize = "45px";

        button.textContent =
            "🎯 " + choice;

        button.onclick = function() {

            if (button.disabled) return;

            if (choice === item.letter) {

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
   6️⃣ مطابقة الصورة
========================================== */

function gameMatchPicture(container) {

    const item = getCurrentLetter();

    let choices = [
        item.word
    ];

    while (choices.length < 4) {

        const random =
            letters[
                Math.floor(
                    Math.random() *
                    letters.length
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

        <h3>🖼️ طابق الصورة</h3>

        <div style="
            font-size:90px;
            margin:20px;
        ">
            ${item.picture}
        </div>

        <p>
            ما اسم هذه الصورة؟
        </p>

        <div
            id="matchOptions"
            class="options"
        ></div>
    `;

    const box =
        document.getElementById(
            "matchOptions"
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

        <h3>🧩 بازل الحرف</h3>

        <p>
            رتب القطع:
            الحرف ← الصوت ← الصورة
        </p>

        <div
            id="puzzleBoard"
            style="
                display:flex;
                justify-content:center;
                align-items:center;
                gap:10px;
                flex-wrap:wrap;
                min-height:130px;
                margin:20px 0;
                padding:15px;
                border:4px dashed #90caf9;
                border-radius:20px;
            "
        ></div>

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
        document.getElementById(
            "puzzleBoard"
        );

    function createPieces(list) {

        board.innerHTML = "";

        list.forEach(function(piece) {

            const element =
                document.createElement("div");

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

            /* سحب بالماوس */

            element.draggable = true;

            element.addEventListener(
                "dragstart",
                function(e) {

                    e.dataTransfer.setData(
                        "text/plain",
                        piece.id
                    );

                    element.style.opacity =
                        "0.5";
                }
            );

            element.addEventListener(
                "dragend",
                function() {

                    element.style.opacity =
                        "1";
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
                            e.dataTransfer
                                .getData(
                                    "text/plain"
                                )
                        );

                    const dragged =
                        [
                            ...board.children
                        ].find(
                            el =>
                                Number(
                                    el.dataset.id
                                ) ===
                                draggedId
                        );

                    if (
                        dragged &&
                        dragged !== element
                    ) {

                        board.insertBefore(
                            dragged,
                            element
                        );
                    }
                }
            );

            /* لمس الجوال */

            element.addEventListener(
                "pointerdown",
                function() {

                    let startX = 0;

                    const move =
                        function(e) {

                            if (
                                Math.abs(
                                    e.clientX -
                                    startX
                                ) > 20
                            ) {

                                const children =
                                    [
                                        ...board
                                            .children
                                    ];

                                const target =
                                    children.find(
                                        el =>
                                            el !==
                                                element &&
                                            Math.abs(
                                                el.getBoundingClientRect()
                                                    .left -
                                                e.clientX
                                            ) < 80
                                    );

                                if (target) {

                                    board.insertBefore(
                                        element,
                                        target
                                    );
                                }
                            }
                        };

                    startX =
                        event.clientX || 0;

                    element.setPointerCapture(
                        event.pointerId
                    );

                    element.addEventListener(
                        "pointermove",
                        move
                    );

                    element.addEventListener(
                        "pointerup",
                        function() {

                            element.removeEventListener(
                                "pointermove",
                                move
                            );
                        },
                        {
                            once: true
                        }
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
                [
                    ...board.children
                ].map(
                    el =>
                        Number(el.dataset.id)
                );

            if (
                order[0] === 1 &&
                order[1] === 2 &&
                order[2] === 3
            ) {

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


/* ==========================================
   8️⃣ الكتابة في الرمل
========================================== */

function gameSand(container) {

    const item = getCurrentLetter();

    container.innerHTML = `

        <h3>🏖️ اكتب الحرف في الرمل</h3>

        <p>
            اكتب حرف ${item.letter}
            بإصبعك داخل الرمل
        </p>

        <canvas
            id="sandCanvas"
            style="
                width:100%;
                max-width:500px;
                height:250px;
                background:#f5deb3;
                border:4px dashed #c9a66b;
                border-radius:20px;
                touch-action:none;
            "
        ></canvas>

        <br>

        <button
            class="option"
            id="clearSand"
        >
            🔄 مسح
        </button>

        <button
            class="success"
            id="sandDone"
        >
            ✅ انتهيت
        </button>
    `;

    const canvas =
        document.getElementById(
            "sandCanvas"
        );

    const ctx =
        canvas.getContext("2d");

    function resizeCanvas() {

        const rect =
            canvas.getBoundingClientRect();

        canvas.width =
            rect.width * devicePixelRatio;

        canvas.height =
            rect.height * devicePixelRatio;

        ctx.scale(
            devicePixelRatio,
            devicePixelRatio
        );

        ctx.font =
            "150px Arial";

        ctx.textAlign =
            "center";

        ctx.fillStyle =
            "rgba(120,90,50,0.20)";

        ctx.fillText(
            item.letter,
            rect.width / 2,
            170
        );
    }

    resizeCanvas();

    let drawing = false;
    let hasDrawn = false;

    function getPosition(e) {

        const rect =
            canvas.getBoundingClientRect();

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    canvas.addEventListener(
        "pointerdown",
        function(e) {

            drawing = true;
            hasDrawn = true;

            canvas.setPointerCapture(
                e.pointerId
            );

            const p =
                getPosition(e);

            ctx.beginPath();

            ctx.moveTo(
                p.x,
                p.y
            );
        }
    );

    canvas.addEventListener(
        "pointermove",
        function(e) {

            if (!drawing) return;

            const p =
                getPosition(e);

            ctx.lineWidth = 8;

            ctx.lineCap = "round";

            ctx.strokeStyle = "#8d6e63";

            ctx.lineTo(
                p.x,
                p.y
            );

            ctx.stroke();
        }
    );

    canvas.addEventListener(
        "pointerup",
        function() {

            drawing = false;
        }
    );

    document
        .getElementById("clearSand")
        .onclick = function() {

            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            resizeCanvas();

            hasDrawn = false;
        };

    document
        .getElementById("sandDone")
        .onclick = function() {

            if (!hasDrawn) {

                showGameError();

                return;
            }

            completeCurrentGame();
        };
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

        <canvas
            id="traceCanvas"
            style="
                width:100%;
                max-width:500px;
                height:250px;
                border:4px dashed #90caf9;
                border-radius:20px;
                touch-action:none;
                background:#fff;
            "
        ></canvas>

        <br>

        <button
            class="option"
            id="clearTrace"
        >
            🔄 مسح
        </button>

        <button
            class="success"
            id="traceDone"
        >
            ✅ انتهيت
        </button>
    `;

    const canvas =
        document.getElementById(
            "traceCanvas"
        );

    const ctx =
        canvas.getContext("2d");

    function setup() {

        const rect =
            canvas.getBoundingClientRect();

        canvas.width =
            rect.width * devicePixelRatio;

        canvas.height =
            rect.height * devicePixelRatio;

        ctx.scale(
            devicePixelRatio,
            devicePixelRatio
        );

        ctx.font =
            "170px Arial";

        ctx.textAlign =
            "center";

        ctx.fillStyle =
            "#cfd8dc";

        ctx.fillText(
            item.letter,
            rect.width / 2,
            180
        );
    }

    setup();

    let drawn = false;
    let drawing = false;

    function position(e) {

        const rect =
            canvas.getBoundingClientRect();

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    canvas.addEventListener(
        "pointerdown",
        function(e) {

            drawing = true;
            drawn = true;

            canvas.setPointerCapture(
                e.pointerId
            );

            const p =
                position(e);

            ctx.beginPath();

            ctx.moveTo(
                p.x,
                p.y
            );
        }
    );

    canvas.addEventListener(
        "pointermove",
        function(e) {

            if (!drawing) return;

            const p =
                position(e);

            ctx.lineWidth = 9;

            ctx.lineCap = "round";

            ctx.strokeStyle = "#42a5f5";

            ctx.lineTo(
                p.x,
                p.y
            );

            ctx.stroke();
        }
    );

    canvas.addEventListener(
        "pointerup",
        function() {

            drawing = false;
        }
    );

    document
        .getElementById("clearTrace")
        .onclick = function() {

            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            setup();

            drawn = false;
        };

    document
        .getElementById("traceDone")
        .onclick = function() {

            if (!drawn) {

                showGameError();

                return;
            }

            completeCurrentGame();
        };
}


/* ==========================================
   🔟 تلوين الحرف
========================================== */

function gameColor(container) {

    const item = getCurrentLetter();

    container.innerHTML = `

        <h3>🎨 لوّن الحرف</h3>

        <p>
            اختر لونًا ثم لوّن الحرف
        </p>

        <div
            id="colorLetter"
            style="
                font-size:150px;
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

    let selected = false;

    document
        .querySelectorAll(
            "[data-color]"
        )
        .forEach(function(button) {

            button.onclick =
                function() {

                    selected = true;

                    letter.style.color =
                        button.dataset.color;
                };
        });

    document
        .getElementById("colorDone")
        .onclick = function() {

            if (!selected) {

                showGameError();

                return;
            }

            completeCurrentGame();
        };
}


/* ==========================================
   1️⃣1️⃣ اختر الكلمة
========================================== */

function gameChooseWord(container) {

    const item = getCurrentLetter();

    let choices = [
        item.word
    ];

    while (choices.length < 4) {

        const random =
            letters[
                Math.floor(
                    Math.random() *
                    letters.length
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

        <h3>📖 اختر الكلمة</h3>

        <div style="
            font-size:80px;
            margin:15px;
        ">
            ${item.letter}
        </div>

        <p>
            اختر الكلمة التي تبدأ بالحرف
        </p>

        <div
            id="wordOptions"
            class="options"
        ></div>
    `;

    const box =
        document.getElementById(
            "wordOptions"
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


/* ==========================================
   1️⃣2️⃣ ابحث عن جميع الحروف
========================================== */

function gameSearchLetter(container) {

    const item = getCurrentLetter();

    let choices = [
        item.letter,
        item.letter,
        item.letter,
        "ب",
        "م",
        "س",
        "ت",
        "ل",
        "ن"
    ];

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
            class="options"
        ></div>
    `;

    const area =
        document.getElementById(
            "searchArea"
        );

    let found = 0;

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
   1️⃣3️⃣ التحدي
========================================== */

function gameFinalChallenge(container) {

    const item = getCurrentLetter();

    container.innerHTML = `

        <h3>🏆 تحدي الحرف</h3>

        <div style="
            font-size:90px;
            margin:15px;
        ">
            ${item.picture}
        </div>

        <p>
            ما الحرف الذي تبدأ به كلمة
            ${item.word}؟
        </p>

        <button
            class="option"
            id="finalListen"
        >
            🔊 استمع إلى الكلمة
        </button>

        <div
            id="finalOptions"
            class="options"
        ></div>
    `;

    document
        .getElementById("finalListen")
        .onclick = function() {

            if (typeof speak === "function") {
                speak(item.word);
            }
        };

    let choices = [
        item.letter
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
   1️⃣4️⃣ البالونات
========================================== */

function gameBalloons(container) {

    const item = getCurrentLetter();

    let balloons = [
        item.letter,
        item.letter,
        "ب",
        "م",
        "س",
        "ت",
        "ل"
    ];

    balloons.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `

        <h3>🎈 فرقع البالونات</h3>

        <p>
            فرقع بالونين يحملان حرف
            ${item.letter}
        </p>

        <div
            id="balloonArea"
            class="options"
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

        button.style.fontSize = "35px";

        button.textContent =
            "🎈 " + letter;

        button.onclick = function() {

            if (button.disabled) return;

            if (letter === item.letter) {

                button.disabled = true;

                button.textContent =
                    "💥";

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
   1️⃣5️⃣ النحلة
========================================== */

function gameBee(container) {

    const item = getCurrentLetter();

    let choices = [
        item.letter,
        "ب",
        "م",
        "ت",
        "س"
    ];

    choices.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `

        <h3>🐝 ساعد النحلة</h3>

        <div style="
            font-size:80px;
            margin:15px;
        ">
            🐝
        </div>

        <p>
            ساعد النحلة في جمع حرف
            ${item.letter}
        </p>

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

                button.textContent =
                    "🐝❤️ " + choice;

                completeCurrentGame();

            } else {

                showGameError();
            }
        };

        box.appendChild(button);
    });
}


/* ==========================================
   1️⃣6️⃣ سيارة الحرف
========================================== */

function gameCar(container) {

    const item = getCurrentLetter();

    let choices = [
        item.letter,
        "ب",
        "م",
        "س"
    ];

    choices.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `

        <h3>🚗 سيارة الحرف</h3>

        <div style="
            font-size:70px;
        ">
            🚗
        </div>

        <p>
            اختر الطريق الذي يحمل حرف
            ${item.letter}
        </p>

        <div
            id="roadOptions"
            class="options"
        ></div>
    `;

    const box =
        document.getElementById(
            "roadOptions"
        );

    choices.forEach(function(letter) {

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
   1️⃣7️⃣ صوّب على الحرف
========================================== */

function gameTarget(container) {

    const item = getCurrentLetter();

    let targets = [
        item.letter,
        item.letter,
        "ب",
        "م",
        "س",
        "ت"
    ];

    targets.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `

        <h3>🎯 صوّب على الحرف</h3>

        <p>
            اضغط على الهدفين اللذين يحملان
            حرف ${item.letter}
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

        button.style.fontSize = "35px";

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
   1️⃣8️⃣ الذاكرة
========================================== */

function gameMemory(container) {

    const item = getCurrentLetter();

    const cards = [

        {
            id: 1,
            pair: "letter",
            value: item.letter
        },

        {
            id: 2,
            pair: "letter",
            value: item.letter
        },

        {
            id: 3,
            pair: "picture",
            value: item.picture
        },

        {
            id: 4,
            pair: "picture",
            value: item.picture
        }
    ];

    cards.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `

        <h3>🧠 لعبة الذاكرة</h3>

        <p>
            طابق كل عنصر مع مثيله
        </p>

        <div
            id="memoryArea"
            style="
                display:grid;
                grid-template-columns:
                    repeat(2,110px);
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
    let locked = false;
    let matched = 0;

    cards.forEach(function(card) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.style.height =
            "110px";

        button.style.fontSize =
            "45px";

        button.textContent =
            "❓";

        button.onclick = function() {

            if (
                locked ||
                button.disabled
            ) return;

            button.textContent =
                card.value;

            if (!first) {

                first = {
                    button: button,
                    card: card
                };

                return;
            }

            const second = {
                button: button,
                card: card
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

                    locked = false;

                },
                700
            );
        };

        area.appendChild(button);
    });
}


/* ==========================================
   1️⃣9️⃣ ضع الحرف في البيت
========================================== */

function gameDragPlace(container) {

    const item = getCurrentLetter();

    let choices = [
        item.letter,
        "ب",
        "م",
        "س"
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
                width:240px;
                height:140px;
                margin:20px auto;
                border:4px dashed #64b5f6;
                border-radius:20px;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:30px;
                touch-action:none;
            "
        >
            🏠
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

    let selectedLetter = null;

    choices.forEach(function(letter) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent =
            letter;

        button.draggable = true;

        button.addEventListener(
            "dragstart",
            function(e) {

                e.dataTransfer.setData(
                    "text/plain",
                    letter
                );
            }
        );

        /* دعم الجوال */

        button.addEventListener(
            "click",
            function() {

                selectedLetter =
                    letter;

                document
                    .querySelectorAll(
                        "#dragLetters .option"
                    )
                    .forEach(
                        b =>
                            b.style.border =
                                ""
                    );

                button.style.border =
                    "5px solid #4caf50";
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
                e.dataTransfer
                    .getData(
                        "text/plain"
                    );

            checkDrop(letter);
        }
    );

    house.addEventListener(
        "click",
        function() {

            if (!selectedLetter) {

                showGameError();

                return;
            }

            checkDrop(
                selectedLetter
            );
        }
    );

    function checkDrop(letter) {

        if (letter === item.letter) {

            house.innerHTML =
                "🏠 ❤️ " +
                item.letter;

            completeCurrentGame();

        } else {

            showGameError();
        }
    }
}


/* ==========================================
   2️⃣0️⃣ الحرف المختلف
========================================== */

function gameDifferent(container) {

    const item = getCurrentLetter();

    let different;

    do {

        different =
            letters[
                Math.floor(
                    Math.random() *
                    letters.length
                )
            ].letter;

    } while (
        different === item.letter
    );

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

        button.style.fontSize =
            "45px";

        button.textContent =
            letter;

        button.onclick = function() {

            if (letter === different) {

                button.textContent =
                    "⭐ " + letter;

                completeCurrentGame();

            } else {

                showGameError();
            }
        };

        area.appendChild(button);
    });
}


/* ==========================================
   2️⃣1️⃣ صيد السمك
========================================== */

function gameFish(container) {

    const item = getCurrentLetter();

    let fish = [
        item.letter,
        item.letter,
        "ب",
        "م",
        "ت",
        "س"
    ];

    fish.sort(
        () => Math.random() - 0.5
    );

    container.innerHTML = `

        <h3>🐠 صيد السمك</h3>

        <p>
            اصطد سمكتين تحملان حرف
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

        button.style.fontSize =
            "35px";

        button.textContent =
            "🐠 " + letter;

        button.onclick = function() {

            if (button.disabled) return;

            if (letter === item.letter) {

                button.disabled = true;

                button.textContent =
                    "🎣";

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
   2️⃣2️⃣ قطار الحروف
========================================== */

function gameTrain(container) {

    const item = getCurrentLetter();

    const firstLetter =
        item.word.charAt(0);

    let choices = [
        firstLetter
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

    container.innerHTML = `

        <h3>🚂 قطار الحروف</h3>

        <div style="
            font-size:80px;
        ">
            🚂
        </div>

        <p>
            اختر الحرف الذي تبدأ به
            ${item.word}
        </p>

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


/* ==========================================
   2️⃣3️⃣ الحرف المخفي
========================================== */

function gameHidden(container) {

    const item = getCurrentLetter();

    let choices = [];

    for (let i = 0; i < 20; i++) {

        choices.push(
            letters[
                Math.floor(
                    Math.random() *
                    letters.length
                )
            ].letter
        );
    }

    const hiddenIndex =
        Math.floor(
            Math.random() *
            choices.length
        );

    choices[hiddenIndex] =
        item.letter;

    container.innerHTML = `

        <h3>🔍 اكتشف الحرف المخفي</h3>

        <p>
            اضغط على حرف ${item.letter}
        </p>

        <div
            id="hiddenArea"
            class="options"
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

        button.style.fontSize =
            "35px";

        button.textContent =
            letter;

        button.onclick = function() {

            if (letter === item.letter) {

                button.textContent =
                    "⭐ " + letter;

                completeCurrentGame();

            } else {

                showGameError();
            }
        };

        area.appendChild(button);
    });
}


/* ==========================================
   2️⃣4️⃣ التلوين المتقدم
========================================== */

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

        <h3>🎨 لوّن الحرف</h3>

        <p>
            اختر اللون الذي يعجبك
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

    let selected = false;

    colors.forEach(function(color) {

        const button =
            document.createElement("button");

        button.className = "option";

        button.textContent =
            "🎨";

        button.style.background =
            color;

        button.onclick = function() {

            selected = true;

            letter.style.color =
                color;
        };

        area.appendChild(button);
    });

    document
        .getElementById(
            "advancedColorDone"
        )
        .onclick = function() {

            if (!selected) {

                showGameError();

                return;
            }

            completeCurrentGame();
        };
}


/* ==========================================
   2️⃣5️⃣ طابق الحرف والصوت والصورة
========================================== */

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

        <h3>🧩 طابق الحرف والصوت والصورة</h3>

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

        button.style.fontSize =
            "45px";

        button.textContent =
            card.value;

        button.onclick = function() {

            const correctType =
                [
                    "letter",
                    "sound",
                    "picture"
                ][step];

            if (
                card.type ===
                correctType
            ) {

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


/* ==========================================
   2️⃣6️⃣ الاختبار الشامل
========================================== */

function gameFinalTest(container) {

    const item = getCurrentLetter();

    container.innerHTML = `

        <h3>🏆 الاختبار الشامل</h3>

        <div
            id="finalTestContent"
        >
            <p>
                استمع إلى صوت الحرف
                ثم اختر الحرف الصحيح
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
            ></div>
        </div>
    `;

    document
        .getElementById("listenFinal")
        .onclick = function() {

            speakLessonSound();
        };

    let choices = [
        item.letter
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

        button.style.fontSize =
            "50px";

        button.textContent =
            letter;

        button.onclick = function() {

            if (letter !== item.letter) {

                showGameError();

                return;
            }

            button.disabled = true;

            /* المرحلة الثانية */

            box.innerHTML = `

                <p>
                    الآن اختر صورة كلمة
                    ${item.word}
                </p>

                <div
                    class="options"
                    id="finalPictureOptions"
                ></div>
            `;

            const pictureBox =
                document.getElementById(
                    "finalPictureOptions"
                );

            let pictures = [
                item.picture
            ];

            while (
                pictures.length < 3
            ) {

                const random =
                    letters[
                        Math.floor(
                            Math.random() *
                            letters.length
                        )
                    ].picture;

                if (
                    !pictures.includes(
                        random
                    )
                ) {

                    pictures.push(
                        random
                    );
                }
            }

            pictures.sort(
                () =>
                    Math.random() - 0.5
            );

            pictures.forEach(
                function(picture) {

                    const pictureButton =
                        document.createElement(
                            "button"
                        );

                    pictureButton.className =
                        "option";

                    pictureButton.style.fontSize =
                        "60px";

                    pictureButton.textContent =
                        picture;

                    pictureButton.onclick =
                        function() {

                            if (
                                picture ===
                                item.picture
                            ) {

                                completeCurrentGame();

                            } else {

                                showGameError();
                            }
                        };

                    pictureBox.appendChild(
                        pictureButton
                    );
                }
            );
        };

        box.appendChild(button);
    });
}


/* ==========================================
   ❌ إجابة خاطئة
========================================== */

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

    if (typeof speak === "function") {

        speak("حاول مرة أخرى");
    }
}


/* ==========================================
   🏁 نهاية ألعاب الحروف
========================================== */
