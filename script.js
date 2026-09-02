// ==========================================
// 🌟 تعلم مع أ/ طه محمد
// script.js متوافق مع index.html الحالي
// ==========================================


// ==========================================
// ⭐ نظام النقاط والمستويات
// ==========================================

let starsCount = 0;
let level = 1;

function convertToEasternArabicNumerals(num) {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

    return String(num).replace(/\d/g, function (digit) {
        return arabicNumbers[digit];
    });
}

function normalizeArabicNumber(value) {
    if (value === null || value === undefined) return '';

    return String(value)
        .replace(/[٠-٩]/g, function (digit) {
            return '٠١٢٣٤٥٦٧٨٩'.indexOf(digit);
        })
        .replace(/[۰-۹]/g, function (digit) {
            return '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit);
        });
}

function addStars(amount) {
    starsCount += amount;

    if (starsCount < 0) {
        starsCount = 0;
    }

    level = Math.floor(starsCount / 50) + 1;

    updateDisplay();
    updateTeacherStats();
    saveProgress();
}

function updateDisplay() {
    const starsEl = document.getElementById('stars');
    const levelEl = document.getElementById('level');
    const rewardStarsEl = document.getElementById('rewardStars');

    if (starsEl) {
        starsEl.textContent =
            convertToEasternArabicNumerals(starsCount);
    }

    if (levelEl) {
        levelEl.textContent =
            convertToEasternArabicNumerals(level);
    }

    if (rewardStarsEl) {
        rewardStarsEl.textContent =
            convertToEasternArabicNumerals(starsCount);
    }

    const teacherStars =
        document.getElementById('teacherStars');

    const teacherLevel =
        document.getElementById('teacherLevel');

    if (teacherStars) {
        teacherStars.textContent =
            convertToEasternArabicNumerals(starsCount);
    }

    if (teacherLevel) {
        teacherLevel.textContent =
            convertToEasternArabicNumerals(level);
    }
}


// ==========================================
// 💾 حفظ واسترجاع التقدم
// ==========================================

function saveProgress() {
    try {
        localStorage.setItem(
            'taha_app_stars',
            String(starsCount)
        );

        localStorage.setItem(
            'taha_app_level',
            String(level)
        );
    } catch (error) {
        console.log('تعذر حفظ التقدم:', error);
    }
}

function loadProgress() {
    try {
        const savedStars =
            localStorage.getItem('taha_app_stars');

        if (savedStars !== null) {
            const parsedStars =
                parseInt(savedStars, 10);

            if (!isNaN(parsedStars) && parsedStars >= 0) {
                starsCount = parsedStars;
            }
        }

        // المستوى يتم حسابه من النجوم
        level = Math.floor(starsCount / 50) + 1;

        updateDisplay();
        updateTeacherStats();

    } catch (error) {
        console.log('تعذر تحميل التقدم:', error);
    }
}


// ==========================================
// 🖥️ التنقل بين الأقسام
// ==========================================

function showScreen(screenId) {

    try {

        // إيقاف الكلام
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        // إيقاف القرآن
        stopQuranAudio();

        const screens =
            document.querySelectorAll('.screen');

        screens.forEach(function (screen) {
            screen.classList.remove('active');
        });

        const targetScreen =
            document.getElementById(screenId);

        if (!targetScreen) {
            console.log(
                'الشاشة غير موجودة:',
                screenId
            );
            return;
        }

        targetScreen.classList.add('active');

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });


        // تهيئة القسم المطلوب

        if (screenId === 'letters') {
            newLetter();
        }

        if (screenId === 'words') {
            newWord();
        }

        if (screenId === 'numbers') {
            newNumber();
        }

        if (screenId === 'writing') {
            setTimeout(initWritingCanvas, 100);
        }

        if (screenId === 'addition') {
            newAddition();
        }

        if (screenId === 'subtraction') {
            newSubtraction();
        }

        if (screenId === 'quran') {
            loadQuranAyah();
        }

        if (screenId === 'hadith') {
            loadHadith();
        }

        if (screenId === 'duas') {
            loadDua();
        }

        if (screenId === 'teacher') {
            updateTeacherStats();
        }

    } catch (error) {

        console.error(
            'خطأ في فتح القسم:',
            error
        );
    }
}


// ==========================================
// 🔊 نظام الصوت
// ==========================================

let quranAudio = null;

function playAudioText(text) {

    if (!text) return;

    if (!('speechSynthesis' in window)) {
        console.log(
            'المتصفح لا يدعم النطق الصوتي'
        );
        return;
    }

    window.speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(text);

    utterance.lang = 'ar-SA';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices =
        window.speechSynthesis.getVoices();

    const arabicVoice =
        voices.find(function (voice) {
            return voice.lang &&
                voice.lang.toLowerCase() === 'ar-sa';
        }) ||
        voices.find(function (voice) {
            return voice.lang &&
                voice.lang.toLowerCase().startsWith('ar');
        });

    if (arabicVoice) {
        utterance.voice = arabicVoice;
    }

    window.speechSynthesis.speak(utterance);
}


// تشغيل ملف صوت خارجي
function playNaturalAudio(url) {

    if (!url) return;

    stopQuranAudio();

    quranAudio = new Audio(url);

    quranAudio.preload = 'auto';

    quranAudio.play().catch(function (error) {
        console.log(
            'تعذر تشغيل الصوت:',
            error
        );
    });
}

function stopQuranAudio() {

    if (quranAudio) {

        quranAudio.pause();

        quranAudio.currentTime = 0;

        quranAudio = null;
    }
}


// ==========================================
// 🔤 قسم الحروف
// ==========================================

const lettersData = [

    {
        name: 'ألف',
        letter: 'أ',
        sound: 'أَ',
        picture: '🦁',
        word: 'أَسَد'
    },

    {
        name: 'باء',
        letter: 'ب',
        sound: 'بَ',
        picture: '🦆',
        word: 'بَطَّة'
    },

    {
        name: 'تاء',
        letter: 'ت',
        sound: 'تَ',
        picture: '🍎',
        word: 'تُفَّاحَة'
    },

    {
        name: 'ثاء',
        letter: 'ث',
        sound: 'ثَ',
        picture: '🦊',
        word: 'ثَعْلَب'
    },

    {
        name: 'جيم',
        letter: 'ج',
        sound: 'جَ',
        picture: '🐫',
        word: 'جَمَل'
    },

    {
        name: 'حاء',
        letter: 'ح',
        sound: 'حَ',
        picture: '🐴',
        word: 'حِصَان'
    },

    {
        name: 'خاء',
        letter: 'خ',
        sound: 'خَ',
        picture: '🥬',
        word: 'خَسّ'
    },

    {
        name: 'دال',
        letter: 'د',
        sound: 'دَ',
        picture: '🐓',
        word: 'دِيك'
    },

    {
        name: 'ذال',
        letter: 'ذ',
        sound: 'ذَ',
        picture: '🐺',
        word: 'ذِئْب'
    },

    {
        name: 'راء',
        letter: 'ر',
        sound: 'رَ',
        picture: '🍎',
        word: 'رُمَّان'
    },

    {
        name: 'زاي',
        letter: 'ز',
        sound: 'زَ',
        picture: '🦒',
        word: 'زَرَافَة'
    },

    {
        name: 'سين',
        letter: 'س',
        sound: 'سَ',
        picture: '🚗',
        word: 'سَيَّارَة'
    },

    {
        name: 'شين',
        letter: 'ش',
        sound: 'شَ',
        picture: '☀️',
        word: 'شَمْس'
    },

    {
        name: 'صاد',
        letter: 'ص',
        sound: 'صَ',
        picture: '🦅',
        word: 'صَقْر'
    },

    {
        name: 'ضاد',
        letter: 'ض',
        sound: 'ضَ',
        picture: '🐸',
        word: 'ضِفْدَع'
    },

    {
        name: 'طاء',
        letter: 'ط',
        sound: 'طَ',
        picture: '✈️',
        word: 'طَائِرَة'
    },

    {
        name: 'ظاء',
        letter: 'ظ',
        sound: 'ظَ',
        picture: '🦌',
        word: 'ظَبْي'
    },

    {
        name: 'عين',
        letter: 'ع',
        sound: 'عَ',
        picture: '🍇',
        word: 'عِنَب'
    },

    {
        name: 'غين',
        letter: 'غ',
        sound: 'غَ',
        picture: '☁️',
        word: 'غَيْم'
    },

    {
        name: 'فاء',
        letter: 'ف',
        sound: 'فَ',
        picture: '🐘',
        word: 'فِيل'
    },

    {
        name: 'قاف',
        letter: 'ق',
        sound: 'قَ',
        picture: '🌙',
        word: 'قَمَر'
    },

    {
        name: 'كاف',
        letter: 'ك',
        sound: 'كَ',
        picture: '📖',
        word: 'كِتَاب'
    },

    {
        name: 'لام',
        letter: 'ل',
        sound: 'لَ',
        picture: '🍋',
        word: 'لَيْمُون'
    },

    {
        name: 'ميم',
        letter: 'م',
        sound: 'مَ',
        picture: '🍌',
        word: 'مَوْز'
    },

    {
        name: 'نون',
        letter: 'ن',
        sound: 'نَ',
        picture: '🐅',
        word: 'نَمِر'
    },

    {
        name: 'هاء',
        letter: 'هـ',
        sound: 'هَ',
        picture: '🎁',
        word: 'هَدِيَّة'
    },

    {
        name: 'واو',
        letter: 'و',
        sound: 'وَ',
        picture: '🌹',
        word: 'وَرْدَة'
    },

    {
        name: 'ياء',
        letter: 'ي',
        sound: 'يَ',
        picture: '🤲',
        word: 'يَد'
    }

];

let currentLetterIndex = 0;
let currentLetterObj = null;
let letterAnswered = false;


// إنشاء سؤال حرف جديد
function newLetter() {

    const randomIndex =
        Math.floor(
            Math.random() * lettersData.length
        );

    currentLetterIndex = randomIndex;

    currentLetterObj =
        lettersData[currentLetterIndex];

    letterAnswered = false;

    const letterEl =
        document.getElementById('currentLetter');

    const pictureEl =
        document.getElementById('letterPicture');

    const wordEl =
        document.getElementById('letterWord');

    const messageEl =
        document.getElementById('letterMessage');

    const optionsEl =
        document.getElementById('letterOptions');

    if (letterEl) {
        letterEl.textContent =
            currentLetterObj.letter;
    }

    if (pictureEl) {
        pictureEl.textContent =
            currentLetterObj.picture;
    }

    if (wordEl) {
        wordEl.textContent =
            currentLetterObj.word;
    }

    if (messageEl) {
        messageEl.textContent = '';
        messageEl.style.color = '';
    }

    if (!optionsEl) return;

    optionsEl.innerHTML = '';

    let choices = [
        currentLetterObj.letter
    ];

    while (choices.length < 3) {

        const randomLetter =
            lettersData[
                Math.floor(
                    Math.random() *
                    lettersData.length
                )
            ].letter;

        if (!choices.includes(randomLetter)) {
            choices.push(randomLetter);
        }
    }

    choices.sort(
        () => Math.random() - 0.5
    );

    choices.forEach(function (letter) {

        const button =
            document.createElement('button');

        button.className = 'option-btn';

        button.textContent = letter;

        button.onclick = function () {

            if (letter === currentLetterObj.letter) {

                messageEl.textContent =
                    '🎉 أحسنت! إجابة صحيحة';

                messageEl.style.color = 'green';

                if (!letterAnswered) {
                    letterAnswered = true;
                    addStars(5);
                }

            } else {

                messageEl.textContent =
                    '❌ حاول مرة أخرى يا بطل';

                messageEl.style.color = 'red';
            }

        };

        optionsEl.appendChild(button);

    });
}


// زر سماع الحرف
function speakCurrentLetter() {

    if (!currentLetterObj) return;

    playAudioText(
        `حرف ${currentLetterObj.name}، ${currentLetterObj.sound}، مثل ${currentLetterObj.word}`
    );
}


// توافق مع الكود القديم
function playLetterAudio() {
    speakCurrentLetter();
}


// الانتقال لحرف جديد
function nextLetter() {
    newLetter();
}


// ==========================================
// 📚 الكلمات
// ==========================================

const wordsData = [

    {
        word: 'مدرسة',
        picture: '🏫'
    },

    {
        word: 'تفاحة',
        picture: '🍎'
    },

    {
        word: 'قطة',
        picture: '🐱'
    },

    {
        word: 'شمس',
        picture: '☀️'
    },

    {
        word: 'قمر',
        picture: '🌙'
    },

    {
        word: 'سيارة',
        picture: '🚗'
    },

    {
        word: 'سمكة',
        picture: '🐟'
    },

    {
        word: 'كتاب',
        picture: '📖'
    }

];

let currentWordObj = null;
let wordAnswered = false;

function newWord() {

    currentWordObj =
        wordsData[
            Math.floor(
                Math.random() *
                wordsData.length
            )
        ];

    wordAnswered = false;

    const picture =
        document.getElementById('wordPicture');

    const word =
        document.getElementById('currentWord');

    const message =
        document.getElementById('wordMessage');

    const options =
        document.getElementById('wordOptions');

    if (picture) {
        picture.textContent =
            currentWordObj.picture;
    }

    if (word) {
        word.textContent =
            currentWordObj.word;
    }

    if (message) {
        message.textContent = '';
        message.style.color = '';
    }

    if (!options) return;

    options.innerHTML = '';

    let choices = [
        currentWordObj.word
    ];

    while (choices.length < 3) {

        const randomWord =
            wordsData[
                Math.floor(
                    Math.random() *
                    wordsData.length
                )
            ].word;

        if (!choices.includes(randomWord)) {
            choices.push(randomWord);
        }
    }

    choices.sort(
        () => Math.random() - 0.5
    );

    choices.forEach(function (selectedWord) {

        const button =
            document.createElement('button');

        button.className =
            'option-btn';

        button.textContent =
            selectedWord;

        button.onclick = function () {

            if (
                selectedWord ===
                currentWordObj.word
            ) {

                message.textContent =
                    '🎉 إجابة صحيحة وبطل ممتاز!';

                message.style.color = 'green';

                if (!wordAnswered) {
                    wordAnswered = true;
                    addStars(5);
                }

            } else {

                message.textContent =
                    '❌ حاول مرة أخرى';

                message.style.color = 'red';
            }

        };

        options.appendChild(button);

    });
}


function speakWord() {

    if (currentWordObj) {
        playAudioText(
            currentWordObj.word
        );
    }
}


// التوافق مع الاسم القديم
function playCurrentWordAudio() {
    speakWord();
}


// ==========================================
// 🔢 الأرقام
// ==========================================

let currentNumVal = 1;
let numberAnswered = false;

function newNumber() {

    currentNumVal =
        Math.floor(
            Math.random() * 10
        ) + 1;

    numberAnswered = false;

    const numberEl =
        document.getElementById('currentNumber');

    const countEl =
        document.getElementById('countItems');

    const messageEl =
        document.getElementById('numberMessage');

    const optionsEl =
        document.getElementById('numberOptions');

    if (numberEl) {

        numberEl.textContent =
            convertToEasternArabicNumerals(
                currentNumVal
            );
    }

    const icons = [
        '🍎',
        '⭐',
        '🎈',
        '🐟',
        '🐱',
        '⚽',
        '🚗'
    ];

    const chosenIcon =
        icons[
            Math.floor(
                Math.random() *
                icons.length
            )
        ];

    if (countEl) {

        countEl.textContent =
            chosenIcon.repeat(
                currentNumVal
            );
    }

    if (messageEl) {

        messageEl.textContent = '';
        messageEl.style.color = '';
    }

    if (!optionsEl) return;

    optionsEl.innerHTML = '';

    let choices = [
        currentNumVal
    ];

    while (choices.length < 3) {

        const randomNumber =
            Math.floor(
                Math.random() * 10
            ) + 1;

        if (!choices.includes(randomNumber)) {
            choices.push(randomNumber);
        }
    }

    choices.sort(
        () => Math.random() - 0.5
    );

    choices.forEach(function (number) {

        const button =
            document.createElement('button');

        button.className =
            'option-btn';

        button.textContent =
            convertToEasternArabicNumerals(
                number
            );

        button.onclick = function () {

            if (number === currentNumVal) {

                messageEl.textContent =
                    '🎉 صحيح يا بطل الأرقام!';

                messageEl.style.color =
                    'green';

                if (!numberAnswered) {
                    numberAnswered = true;
                    addStars(5);
                }

            } else {

                messageEl.textContent =
                    '❌ حاول العد مرة أخرى';

                messageEl.style.color =
                    'red';
            }

        };

        optionsEl.appendChild(button);

    });
}


function speakNumber() {

    playAudioText(
        `الرقم ${currentNumVal}`
    );
}


// التوافق مع الاسم القديم
function playCurrentNumberAudio() {
    speakNumber();
}


// ==========================================
// ✏️ الكتابة
// ==========================================

let canvas = null;
let ctx = null;
let isDrawing = false;

const writingLetters = [
    'أ', 'ب', 'ت', 'ث',
    'ج', 'ح', 'خ',
    'د', 'ذ', 'ر', 'ز',
    'س', 'ش', 'ص', 'ض',
    'ط', 'ظ',
    'ع', 'غ',
    'ف', 'ق', 'ك',
    'ل', 'م', 'ن',
    'هـ', 'و', 'ي'
];

let currentWritingIndex = 0;
let writingCompleted = false;


function initWritingCanvas() {

    canvas =
        document.getElementById('writingCanvas');

    if (!canvas) return;

    ctx =
        canvas.getContext('2d');

    const parentWidth =
        canvas.parentElement
            ? canvas.parentElement.clientWidth
            : 350;

    canvas.width =
        Math.max(
            280,
            Math.min(
                500,
                parentWidth - 30
            )
        );

    canvas.height = 250;

    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#4a90e2';

    canvas.onmousedown = startDraw;
    canvas.onmousemove = drawing;
    canvas.onmouseup = stopDraw;
    canvas.onmouseleave = stopDraw;

    canvas.ontouchstart =
        function (event) {

            event.preventDefault();

            startDraw(
                event.touches[0]
            );
        };

    canvas.ontouchmove =
        function (event) {

            event.preventDefault();

            drawing(
                event.touches[0]
            );
        };

    canvas.ontouchend =
        function () {
            stopDraw();
        };

    newWritingLetter();
}


function getCanvasPoint(event) {

    const rect =
        canvas.getBoundingClientRect();

    return {
        x:
            event.clientX -
            rect.left,

        y:
            event.clientY -
            rect.top
    };
}


function startDraw(event) {

    if (!ctx) return;

    isDrawing = true;

    const point =
        getCanvasPoint(event);

    ctx.beginPath();

    ctx.moveTo(
        point.x,
        point.y
    );
}


function drawing(event) {

    if (!isDrawing || !ctx) return;

    const point =
        getCanvasPoint(event);

    ctx.lineTo(
        point.x,
        point.y
    );

    ctx.stroke();
}


function stopDraw() {

    isDrawing = false;
}


function clearCanvas() {

    if (!ctx || !canvas) return;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const message =
        document.getElementById(
            'writingMessage'
        );

    if (message) {
        message.textContent = '';
    }
}


function newWritingLetter() {

    if (!canvas || !ctx) return;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const letter =
        writingLetters[
            currentWritingIndex
        ];

    const guide =
        document.getElementById(
            'writingGuide'
        );

    const message =
        document.getElementById(
            'writingMessage'
        );

    if (guide) {
        guide.textContent = letter;
    }

    if (message) {
        message.textContent = '';
        message.style.color = '';
    }

    writingCompleted = false;

    currentWritingIndex =
        (currentWritingIndex + 1) %
        writingLetters.length;
}


function finishWriting() {

    const message =
        document.getElementById(
            'writingMessage'
        );

    if (message) {

        message.textContent =
            '🌟 خط جميل جداً! أحسنت الكتابة';

        message.style.color =
            'green';
    }

    if (!writingCompleted) {

        writingCompleted = true;

        addStars(10);
    }
}


// ==========================================
// ➕ الجمع
// ==========================================

let addLevel = 1;

let currentAddA = 1;
let currentAddB = 1;

let additionAnswered = false;


function setAdditionLevel(lvl) {

    addLevel = lvl;

    const btn1 =
        document.getElementById('addBtn1');

    const btn2 =
        document.getElementById('addBtn2');

    const btn3 =
        document.getElementById('addBtn3');

    if (btn1) {
        btn1.className =
            lvl === 1
                ? 'primary'
                : 'secondary';
    }

    if (btn2) {
        btn2.className =
            lvl === 2
                ? 'primary'
                : 'secondary';
    }

    if (btn3) {
        btn3.className =
            lvl === 3
                ? 'primary'
                : 'secondary';
    }

    newAddition();
}


function newAddition() {

    additionAnswered = false;

    const maxLimit =
        addLevel === 1
            ? 5
            : addLevel === 2
                ? 10
                : 20;

    currentAddA =
        Math.floor(
            Math.random() *
            maxLimit
        ) + 1;

    currentAddB =
        Math.floor(
            Math.random() *
            maxLimit
        ) + 1;

    if (
        addLevel === 1 &&
        currentAddA + currentAddB > 10
    ) {

        currentAddA = 3;
        currentAddB = 2;
    }

    const question =
        document.getElementById(
            'addQuestion'
        );

    const pictures =
        document.getElementById(
            'addPictures'
        );

    const answer =
        document.getElementById(
            'addAnswer'
        );

    const message =
        document.getElementById(
            'addMessage'
        );

    if (question) {

        question.textContent =
            `${convertToEasternArabicNumerals(currentAddA)} + ${convertToEasternArabicNumerals(currentAddB)} = ؟`;
    }

    if (pictures) {

        if (addLevel === 1) {

            pictures.textContent =
                '🍎'.repeat(currentAddA) +
                '  +  ' +
                '🍎'.repeat(currentAddB);

        } else {

            pictures.textContent = '➕';
        }
    }

    if (answer) {
        answer.value = '';
    }

    if (message) {
        message.textContent = '';
        message.style.color = '';
    }
}


function checkAddition() {

    const answer =
        document.getElementById(
            'addAnswer'
        );

    const message =
        document.getElementById(
            'addMessage'
        );

    if (!answer || !message) return;

    const normalized =
        normalizeArabicNumber(
            answer.value
        );

    const userAnswer =
        parseInt(normalized, 10);

    const correctAnswer =
        currentAddA +
        currentAddB;

    if (
        userAnswer ===
        correctAnswer
    ) {

        message.textContent =
            '🎉 إجابة صحيحة وموفقة!';

        message.style.color =
            'green';

        if (!additionAnswered) {

            additionAnswered = true;

            addStars(5);
        }

    } else {

        message.textContent =
            `❌ خطأ، الناتج الصحيح هو ${convertToEasternArabicNumerals(correctAnswer)}`;

        message.style.color =
            'red';
    }
}


// ==========================================
// ➖ الطرح
// ==========================================

let subLevel = 1;

let currentSubA = 1;
let currentSubB = 1;

let subtractionAnswered = false;


function setSubtractionLevel(lvl) {

    subLevel = lvl;

    const btn1 =
        document.getElementById(
            'subBtn1'
        );

    const btn2 =
        document.getElementById(
            'subBtn2'
        );

    const btn3 =
        document.getElementById(
            'subBtn3'
        );

    if (btn1) {
        btn1.className =
            lvl === 1
                ? 'primary'
                : 'secondary';
    }

    if (btn2) {
        btn2.className =
            lvl === 2
                ? 'primary'
                : 'secondary';
    }

    if (btn3) {
        btn3.className =
            lvl === 3
                ? 'primary'
                : 'secondary';
    }

    newSubtraction();
}


function newSubtraction() {

    subtractionAnswered = false;

    const maxLimit =
        subLevel === 1
            ? 5
            : subLevel === 2
                ? 10
                : 20;

    currentSubA =
        Math.floor(
            Math.random() *
            maxLimit
        ) + 1;

    currentSubB =
        Math.floor(
            Math.random() *
            currentSubA
        );

    const question =
        document.getElementById(
            'subQuestion'
        );

    const pictures =
        document.getElementById(
            'subPictures'
        );

    const answer =
        document.getElementById(
            'subAnswer'
        );

    const message =
        document.getElementById(
            'subMessage'
        );

    if (question) {

        question.textContent =
            `${convertToEasternArabicNumerals(currentSubA)} - ${convertToEasternArabicNumerals(currentSubB)} = ؟`;
    }

    if (pictures) {

        if (subLevel === 1) {

            pictures.textContent =
                '🍎'.repeat(currentSubA);

        } else {

            pictures.textContent =
                '➖';
        }
    }

    if (answer) {
        answer.value = '';
    }

    if (message) {
        message.textContent = '';
        message.style.color = '';
    }
}


function checkSubtraction() {

    const answer =
        document.getElementById(
            'subAnswer'
        );

    const message =
        document.getElementById(
            'subMessage'
        );

    if (!answer || !message) return;

    const normalized =
        normalizeArabicNumber(
            answer.value
        );

    const userAnswer =
        parseInt(normalized, 10);

    const correctAnswer =
        currentSubA -
        currentSubB;

    if (
        userAnswer ===
        correctAnswer
    ) {

        message.textContent =
            '🎉 بطل الطرح الذكي!';

        message.style.color =
            'green';

        if (!subtractionAnswered) {

            subtractionAnswered = true;

            addStars(5);
        }

    } else {

        message.textContent =
            `❌ خطأ، الناتج الصحيح هو ${convertToEasternArabicNumerals(correctAnswer)}`;

        message.style.color =
            'red';
    }
}


// ==========================================
// 📖 القرآن الكريم
// ==========================================

const quranSurahs = [

    {
        name: 'سورة الإخلاص',

        ayahs: [

            {
                text:
                    'قُلْ هُوَ اللَّهُ أَحَدٌ',

                audio:
                    'https://everyayah.com/data/Husary_128kbps/112001.mp3'
            },

            {
                text:
                    'اللَّهُ الصَّمَدُ',

                audio:
                    'https://everyayah.com/data/Husary_128kbps/112002.mp3'
            },

            {
                text:
                    'لَمْ يَلِدْ وَلَمْ يُولَدْ',

                audio:
                    'https://everyayah.com/data/Husary_128kbps/112003.mp3'
            },

            {
                text:
                    'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',

                audio:
                    'https://everyayah.com/data/Husary_128kbps/112004.mp3'
            }

        ]
    },


    {
        name: 'سورة الفاتحة',

        ayahs: [

            {
                text:
                    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',

                audio:
                    'https://everyayah.com/data/Husary_128kbps/001001.mp3'
            },

            {
                text:
                    'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',

                audio:
                    'https://everyayah.com/data/Husary_128kbps/001002.mp3'
            },

            {
                text:
                    'الرَّحْمَٰنِ الرَّحِيمِ',

                audio:
                    'https://everyayah.com/data/Husary_128kbps/001003.mp3'
            },

            {
                text:
                    'مَالِكِ يَوْمِ الدِّينِ',

                audio:
                    'https://everyayah.com/data/Husary_128kbps/001004.mp3'
            },

            {
                text:
                    'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',

                audio:
                    'https://everyayah.com/data/Husary_128kbps/001005.mp3'
            },

            {
                text:
                    'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',

                audio:
                    'https://everyayah.com/data/Husary_128kbps/001006.mp3'
            },

            {
                text:
                    'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',

                audio:
                    'https://everyayah.com/data/Husary_128kbps/001007.mp3'
            }

        ]
    },


    {
        name: 'سورة الكوثر',

        ayahs: [

            {
                text:
                    'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ',

                audio:
                    'https://everyayah.com/data/Husary_128kbps/108001.mp3'
            },

            {
                text:
                    'فَصَلِّ لِرَبِّكَ وَانْحَرْ',

                audio:
                    'https://everyayah.com/data/Husary_128kbps/108002.mp3'
            },

            {
                text:
                    'إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ',

                audio:
                    'https://everyayah.com/data/Husary_128kbps/108003.mp3'
            }

        ]
    }

];

let currentQuranIndex = 0;
let currentQuranAyahIndex = 0;


function loadQuranAyah() {

    const surah =
        quranSurahs[currentQuranIndex];

    if (!surah) return;

    currentQuranAyahIndex = 0;

    const name =
        document.getElementById(
            'surahName'
        );

    const text =
        document.getElementById(
            'surahText'
        );

    if (name) {
        name.textContent =
            surah.name;
    }

    if (text) {

        text.innerHTML =
            surah.ayahs
                .map(function (ayah, index) {

                    return `
                        <div class="quran-ayah-row">
                            <div class="quran-ayah-text">
                                ﴿${convertToEasternArabicNumerals(index + 1)}﴾
                                ${ayah.text}
                            </div>
                        </div>
                    `;

                })
                .join('');
    }
}


function speakSurah() {

    const surah =
        quranSurahs[currentQuranIndex];

    if (!surah) return;

    stopQuranAudio();

    currentQuranAyahIndex = 0;

    playNextQuranAyah();
}


function playNextQuranAyah() {

    const surah =
        quranSurahs[currentQuranIndex];

    if (!surah) return;

    if (
        currentQuranAyahIndex >=
        surah.ayahs.length
    ) {

        currentQuranAyahIndex = 0;

        return;
    }

    const ayah =
        surah.ayahs[
            currentQuranAyahIndex
        ];

    quranAudio =
        new Audio(ayah.audio);

    quranAudio.onended =
        function () {

            currentQuranAyahIndex++;

            playNextQuranAyah();
        };

    quranAudio.play().catch(
        function (error) {

            console.log(
                'تعذر تشغيل التلاوة:',
                error
            );

        }
    );
}


function nextSurah() {

    stopQuranAudio();

    currentQuranIndex =
        (currentQuranIndex + 1) %
        quranSurahs.length;

    loadQuranAyah();
}


// ==========================================
// 🕌 الأحاديث
// ==========================================

const hadithsData = [

    {
        text:
            'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',

        source:
            'رواه البخاري ومسلم'
    },

    {
        text:
            'الدِّينُ النَّصِيحَةُ',

        source:
            'رواه مسلم'
    },

    {
        text:
            'مَا زَالَ جِبْرِيلُ يُوصِينِي بِالْجَارِ حَتَّى ظَنَنْتُ أَنَّهُ سَيُوَرِّثُهُ',

        source:
            'متفق عليه'
    }

];

let currentHadithIdx = 0;


function loadHadith() {

    const hadith =
        hadithsData[
            currentHadithIdx
        ];

    const text =
        document.getElementById(
            'hadithText'
        );

    const source =
        document.getElementById(
            'hadithSource'
        );

    if (text) {
        text.textContent =
            hadith.text;
    }

    if (source) {
        source.textContent =
            hadith.source;
    }
}


function nextHadith() {

    currentHadithIdx =
        (currentHadithIdx + 1) %
        hadithsData.length;

    loadHadith();
}


function speakHadith() {

    playAudioText(
        hadithsData[
            currentHadithIdx
        ].text
    );
}


function playHadithAudio() {
    speakHadith();
}


// ==========================================
// 🤲 الأدعية
// ==========================================

const duasData = [

    {
        title:
            'دعاء قبل الطعام',

        text:
            'بِسْمِ اللَّهِ'
    },

    {
        title:
            'دعاء الاستيقاظ من النوم',

        text:
            'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ'
    },

    {
        title:
            'دعاء ركوب الدابة',

        text:
            'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ'
    }

];

let currentDuaIdx = 0;


function loadDua() {

    const dua =
        duasData[
            currentDuaIdx
        ];

    const title =
        document.getElementById(
            'duaTitle'
        );

    const text =
        document.getElementById(
            'duaText'
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


function nextDua() {

    currentDuaIdx =
        (currentDuaIdx + 1) %
        duasData.length;

    loadDua();
}


function speakDua() {

    playAudioText(
        duasData[
            currentDuaIdx
        ].text
    );
}


function playDuaAudio() {
    speakDua();
}


// ==========================================
// 👨‍🏫 لوحة المعلم
// ==========================================

function updateTeacherStats() {

    const stats = {

        teacherStars:
            starsCount,

        teacherLevel:
            level,

        teacherLetters:
            Math.floor(starsCount / 10),

        teacherWords:
            Math.floor(starsCount / 5),

        teacherNumbers:
            Math.floor(starsCount / 5),

        teacherAddition:
            Math.floor(starsCount / 8),

        teacherSubtraction:
            Math.floor(starsCount / 8)

    };


    Object.keys(stats).forEach(
        function (id) {

            const element =
                document.getElementById(id);

            if (element) {

                element.textContent =
                    convertToEasternArabicNumerals(
                        stats[id]
                    );
            }

        }
    );
}


// ==========================================
// 🔄 تصفير النتائج
// ==========================================

function resetProgress() {

    const confirmed =
        window.confirm(
            'هل أنت متأكد من تصفير النتائج والنقاط؟'
        );

    if (!confirmed) return;

    starsCount = 0;
    level = 1;

    saveProgress();

    updateDisplay();
    updateTeacherStats();

    window.alert(
        'تم تصفير النتائج بنجاح.'
    );
}


// ==========================================
// 🚀 تشغيل التطبيق
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    function () {

        loadProgress();

        // تحميل القسم الأول بدون فتحه
        // حتى تكون البيانات جاهزة

        try {
            loadHadith();
            loadDua();
        } catch (error) {
            console.log(
                'خطأ في التهيئة:',
                error
            );
        }

    }
);


// تحميل الأصوات عند توفرها
if ('speechSynthesis' in window) {

    window.speechSynthesis.onvoiceschanged =
        function () {
            window.speechSynthesis.getVoices();
        };
}
