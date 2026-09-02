// ==========================================
// 🌟 تعلم مع أ/ طه محمد
// script.js - النسخة المحسنة
// ==========================================


// ==========================================
// ⭐ المتغيرات العامة ونظام النقاط والمستويات
// ==========================================

let starsCount = 0;
let level = 1;

function addStars(amount) {
    amount = Number(amount) || 0;

    starsCount += amount;

    if (starsCount < 0) {
        starsCount = 0;
    }

    // كل 50 نجمة = مستوى جديد
    level = Math.floor(starsCount / 50) + 1;

    updateDisplay();
    saveProgress();
}

function updateDisplay() {
    const starsEl = document.getElementById('stars');
    const levelEl = document.getElementById('level');
    const rewardStarsEl = document.getElementById('rewardStars');

    if (starsEl) {
        starsEl.textContent = convertToEasternArabicNumerals(starsCount);
    }

    if (levelEl) {
        levelEl.textContent = convertToEasternArabicNumerals(level);
    }

    if (rewardStarsEl) {
        rewardStarsEl.textContent = convertToEasternArabicNumerals(starsCount);
    }

    // لوحة المعلم
    const tStars = document.getElementById('teacherStars');
    const tLevel = document.getElementById('teacherLevel');

    if (tStars) {
        tStars.textContent = convertToEasternArabicNumerals(starsCount);
    }

    if (tLevel) {
        tLevel.textContent = convertToEasternArabicNumerals(level);
    }
}


// ==========================================
// 🔢 تحويل الأرقام إلى أرقام عربية
// ==========================================

function convertToEasternArabicNumerals(num) {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

    return String(num).replace(/\d/g, function (x) {
        return arabicNumbers[x];
    });
}


// ==========================================
// 🔊 نظام الصوت
// ==========================================

let audioPlayer = null;

function initializeAudioPlayer() {
    audioPlayer = document.getElementById('audioPlayer');
}

function stopAllAudio() {
    // إيقاف الكلام
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }

    // إيقاف ملفات MP3
    if (audioPlayer) {
        try {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        } catch (e) {
            console.log('تعذر إيقاف الصوت');
        }
    }
}


// الصوت النصي الحالي
function playAudioText(text) {
    if (!text) return;

    stopSpeechOnly();

    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = 'ar-SA';
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 1;

        const voices = window.speechSynthesis.getVoices();

        // محاولة العثور على صوت عربي
        const arabicVoice =
            voices.find(v => v.lang && v.lang.toLowerCase() === 'ar-sa') ||
            voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ar'));

        if (arabicVoice) {
            utterance.voice = arabicVoice;
        }

        window.speechSynthesis.speak(utterance);
    } else {
        console.log('المتصفح لا يدعم النطق الصوتي');
    }
}


// إيقاف SpeechSynthesis فقط
function stopSpeechOnly() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}


// تشغيل ملف صوتي حقيقي
function playNaturalAudio(url) {
    if (!url) return;

    stopSpeechOnly();

    if (!audioPlayer) {
        audioPlayer = document.getElementById('audioPlayer');
    }

    if (!audioPlayer) {
        console.log('عنصر audioPlayer غير موجود');
        return;
    }

    try {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        audioPlayer.src = url;

        const playPromise = audioPlayer.play();

        if (playPromise !== undefined) {
            playPromise.catch(function (error) {
                console.log('خطأ في تشغيل الصوت:', error);
            });
        }
    } catch (error) {
        console.log('خطأ في ملف الصوت:', error);
    }
}


// تحميل أصوات SpeechSynthesis
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = function () {
        // تحديث الأصوات عند توفرها
        console.log('تم تحميل أصوات الجهاز');
    };
}


// ==========================================
// 📱 التبديل بين الشاشات
// ==========================================

function showScreen(screenId) {
    stopAllAudio();

    const screens = document.querySelectorAll('.screen');

    screens.forEach(function (screen) {
        screen.classList.remove('active');
    });

    const targetScreen = document.getElementById(screenId);

    if (!targetScreen) {
        console.log('الشاشة غير موجودة:', screenId);
        return;
    }

    targetScreen.classList.add('active');

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    // تهيئة الشاشة
    try {
        if (screenId === 'letters') {
            renderLettersList();
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

        if (screenId === 'adhkar') {
            switchAdhkarTab('morning');
        }

        if (screenId === 'teacher') {
            updateTeacherStats();
        }
    } catch (error) {
        console.log('خطأ أثناء تهيئة الشاشة:', error);
    }
}


// ==========================================
// 🔤 الحروف العربية
// ==========================================

const lettersData = [

    { name: 'ألف', letter: 'أ', sound: 'أَ', picture: '🦁', word: 'أَسَد' },

    { name: 'باء', letter: 'ب', sound: 'بَ', picture: '🦆', word: 'بَطَّة' },

    { name: 'تاء', letter: 'ت', sound: 'تَ', picture: '🍎', word: 'تُفَّاحَة' },

    { name: 'ثاء', letter: 'ث', sound: 'ثَ', picture: '🦊', word: 'ثَعْلَب' },

    { name: 'جيم', letter: 'ج', sound: 'جَ', picture: '🐫', word: 'جَمَل' },

    { name: 'حاء', letter: 'ح', sound: 'حَ', picture: '🐴', word: 'حِصَان' },

    { name: 'خاء', letter: 'خ', sound: 'خَ', picture: '🥬', word: 'خَسّ' },

    { name: 'دال', letter: 'د', sound: 'دَ', picture: '🐓', word: 'دِيك' },

    { name: 'ذال', letter: 'ذ', sound: 'ذَ', picture: '🐺', word: 'ذِئْب' },

    { name: 'راء', letter: 'ر', sound: 'رَ', picture: '🍎', word: 'رُمَّان' },

    { name: 'زاي', letter: 'ز', sound: 'زَ', picture: '🦒', word: 'زَرَافَة' },

    { name: 'سين', letter: 'س', sound: 'سَ', picture: '🚗', word: 'سَيَّارَة' },

    { name: 'شين', letter: 'ش', sound: 'شَ', picture: '☀️', word: 'شَمْس' },

    { name: 'صاد', letter: 'ص', sound: 'صَ', picture: '🦅', word: 'صَقْر' },

    { name: 'ضاد', letter: 'ض', sound: 'ضَ', picture: '🐸', word: 'ضِفْدَع' },

    { name: 'طاء', letter: 'ط', sound: 'طَ', picture: '✈️', word: 'طَائِرَة' },

    { name: 'ظاء', letter: 'ظ', sound: 'ظَ', picture: '🦌', word: 'ظَبْي' },

    { name: 'عين', letter: 'ع', sound: 'عَ', picture: '🍇', word: 'عِنَب' },

    { name: 'غين', letter: 'غ', sound: 'غَ', picture: '☁️', word: 'غَيْم' },

    { name: 'فاء', letter: 'ف', sound: 'فَ', picture: '🐘', word: 'فِيل' },

    { name: 'قاف', letter: 'ق', sound: 'قَ', picture: '🌙', word: 'قَمَر' },

    { name: 'كاف', letter: 'ك', sound: 'كَ', picture: '📖', word: 'كِتَاب' },

    { name: 'لام', letter: 'ل', sound: 'لَ', picture: '🍋', word: 'لَيْمُون' },

    { name: 'ميم', letter: 'م', sound: 'مَ', picture: '🍌', word: 'مَوْز' },

    { name: 'نون', letter: 'ن', sound: 'نَ', picture: '🐅', word: 'نَمِر' },

    { name: 'هاء', letter: 'هـ', sound: 'هَ', picture: '🎁', word: 'هَدِيَّة' },

    { name: 'واو', letter: 'و', sound: 'وَ', picture: '🌹', word: 'وَرْدَة' },

    { name: 'ياء', letter: 'ي', sound: 'يَ', picture: '🤲', word: 'يَد' }

];

let currentLetterObj = null;
let currentMiniGameIndex = 0;

const totalMiniGames = 5;


// ==========================================
// عرض قائمة الحروف
// ==========================================

function renderLettersList() {

    const listEl = document.getElementById('lettersList');

    if (!listEl) return;

    listEl.innerHTML = '';

    lettersData.forEach(function (item, index) {

        const btn = document.createElement('button');

        btn.className = 'letter-btn';

        btn.textContent = item.letter;

        btn.setAttribute('aria-label', 'حرف ' + item.name);

        btn.onclick = function () {
            startLetterLesson(index);
        };

        listEl.appendChild(btn);
    });
}


// ==========================================
// بدء درس الحرف
// ==========================================

function startLetterLesson(index) {

    if (!lettersData[index]) return;

    currentLetterObj = lettersData[index];

    currentMiniGameIndex = 0;

    const title = document.getElementById('lessonTitle');
    const letter = document.getElementById('lessonLetter');
    const sound = document.getElementById('lessonSound');
    const picture = document.getElementById('lessonPicture');
    const word = document.getElementById('lessonWord');

    if (title) {
        title.textContent = `🌟 حرف ${currentLetterObj.name} 🌟`;
    }

    if (letter) {
        letter.textContent = currentLetterObj.letter;
    }

    if (sound) {
        sound.textContent = currentLetterObj.sound;
    }

    if (picture) {
        picture.textContent = currentLetterObj.picture;
    }

    if (word) {
        word.textContent = currentLetterObj.word;
    }

    const badgeArea = document.getElementById('badgeArea');
    const nextButton = document.getElementById('nextGameButton');

    if (badgeArea) {
        badgeArea.style.display = 'none';
    }

    if (nextButton) {
        nextButton.style.display = 'none';
    }

    showScreen('letterLesson');

    loadMiniGame();
}


// ==========================================
// صوت الحرف
// ==========================================

function playLetterAudio() {

    if (!currentLetterObj) return;

    playAudioText(
        `حرف ${currentLetterObj.name}. ${currentLetterObj.sound}. ${currentLetterObj.word}`
    );
}


// ==========================================
// تحميل اللعبة المصغرة
// ==========================================

function loadMiniGame() {

    if (!currentLetterObj) return;

    const miniGameEl = document.getElementById('miniGame');
    const msgEl = document.getElementById('gameMessage');
    const nextBtn = document.getElementById('nextGameButton');

    if (!miniGameEl || !msgEl) return;

    miniGameEl.innerHTML = '';
    msgEl.textContent = '';

    if (nextBtn) {
        nextBtn.style.display = 'none';
    }

    // المؤشر
    const currentGameNumber = document.getElementById('currentGameNumber');
    const gameTotalNumber = document.getElementById('gameTotalNumber');
    const letterStars = document.getElementById('letterStars');
    const letterTotalGames = document.getElementById('letterTotalGames');
    const progressFill = document.getElementById('gameProgressFill');

    if (currentGameNumber) {
        currentGameNumber.textContent =
            convertToEasternArabicNumerals(currentMiniGameIndex + 1);
    }

    if (gameTotalNumber) {
        gameTotalNumber.textContent =
            convertToEasternArabicNumerals(totalMiniGames);
    }

    if (letterStars) {
        letterStars.textContent =
            convertToEasternArabicNumerals(currentMiniGameIndex);
    }

    if (letterTotalGames) {
        letterTotalGames.textContent =
            convertToEasternArabicNumerals(totalMiniGames);
    }

    if (progressFill) {
        const progressPercent =
            (currentMiniGameIndex / totalMiniGames) * 100;

        progressFill.style.width = progressPercent + '%';
    }


    // ==========================================
    // 🎮 اللعبة 1
    // اختيار الصورة
    // ==========================================

    if (currentMiniGameIndex === 0) {

        miniGameEl.innerHTML = `
            <h3>اختر الصورة التي تبدأ بحرف (${currentLetterObj.letter})</h3>
            <div id="gameOptions" class="options"></div>
        `;

        const optionsContainer =
            document.getElementById('gameOptions');

        if (!optionsContainer) return;

        const choices = [currentLetterObj];

        while (choices.length < 3) {

            const randomItem =
                lettersData[
                    Math.floor(Math.random() * lettersData.length)
                ];

            if (!choices.includes(randomItem)) {
                choices.push(randomItem);
            }
        }

        shuffleArray(choices);

        choices.forEach(function (item) {

            const btn = document.createElement('button');

            btn.className = 'option-btn';

            btn.textContent = item.picture;

            btn.onclick = function () {

                if (item.letter === currentLetterObj.letter) {

                    msgEl.textContent =
                        '🎉 أحسنت! إجابة صحيحة';

                    msgEl.style.color = 'green';

                    addStars(5);

                    disableGameOptions();

                    finishMiniGameStep();

                } else {

                    msgEl.textContent =
                        '❌ حاول مرة أخرى يا بطل';

                    msgEl.style.color = 'red';
                }
            };

            optionsContainer.appendChild(btn);
        });

        return;
    }


    // ==========================================
    // 🎮 اللعبة 2
    // الاستماع واختيار الحرف
    // ==========================================

    if (currentMiniGameIndex === 1) {

        miniGameEl.innerHTML = `
            <h3>🔊 اسمع الحرف واكتشفه</h3>

            <button class="primary" onclick="playLetterAudio()">
                🔊 اسمع الصوت مرة أخرى
            </button>

            <div id="gameOptions" class="options"></div>
        `;

        const optionsContainer =
            document.getElementById('gameOptions');

        if (!optionsContainer) return;

        const choices = [currentLetterObj.letter];

        while (choices.length < 3) {

            const randomLetter =
                lettersData[
                    Math.floor(Math.random() * lettersData.length)
                ].letter;

            if (!choices.includes(randomLetter)) {
                choices.push(randomLetter);
            }
        }

        shuffleArray(choices);

        choices.forEach(function (letter) {

            const btn = document.createElement('button');

            btn.className = 'option-btn';

            btn.textContent = letter;

            btn.onclick = function () {

                if (letter === currentLetterObj.letter) {

                    msgEl.textContent =
                        '🌟 رائع جداً!';

                    msgEl.style.color = 'green';

                    addStars(5);

                    disableGameOptions();

                    finishMiniGameStep();

                } else {

                    msgEl.textContent =
                        '❌ ليس هذا هو الحرف';

                    msgEl.style.color = 'red';
                }
            };

            optionsContainer.appendChild(btn);
        });

        // تشغيل الصوت تلقائياً بعد فتح اللعبة
        setTimeout(function () {
            playLetterAudio();
        }, 400);

        return;
    }


    // ==========================================
    // 🎮 اللعبة 3
    // الحرف الأول للكلمة
    // ==========================================

    if (currentMiniGameIndex === 2) {

        miniGameEl.innerHTML = `
            <h3>
                ما هو الحرف الأول في كلمة
                (${currentLetterObj.word})؟
            </h3>

            <div class="big-word">
                ${currentLetterObj.picture}
            </div>

            <div id="gameOptions" class="options"></div>
        `;

        const optionsContainer =
            document.getElementById('gameOptions');

        if (!optionsContainer) return;

        const choices = [currentLetterObj.letter];

        while (choices.length < 3) {

            const randomLetter =
                lettersData[
                    Math.floor(Math.random() * lettersData.length)
                ].letter;

            if (!choices.includes(randomLetter)) {
                choices.push(randomLetter);
            }
        }

        shuffleArray(choices);

        choices.forEach(function (letter) {

            const btn = document.createElement('button');

            btn.className = 'option-btn';

            btn.textContent = letter;

            btn.onclick = function () {

                if (letter === currentLetterObj.letter) {

                    msgEl.textContent =
                        '🎉 ممتاز يا بطل!';

                    msgEl.style.color = 'green';

                    addStars(5);

                    disableGameOptions();

                    finishMiniGameStep();

                } else {

                    msgEl.textContent =
                        '❌ خطأ، جرب حرفاً آخر';

                    msgEl.style.color = 'red';
                }
            };

            optionsContainer.appendChild(btn);
        });

        return;
    }


    // ==========================================
    // 🎮 اللعبة 4
    // تعرف على شكل الحرف
    // ==========================================

    if (currentMiniGameIndex === 3) {

        miniGameEl.innerHTML = `
            <h3>
                اختر الشكل الصحيح لحرف
                (${currentLetterObj.name})
            </h3>

            <div class="big-word">
                ${currentLetterObj.letter}
            </div>

            <button class="success" onclick="passDirectGame()">
                ✅ هذا هو الحرف
            </button>
        `;

        return;
    }


    // ==========================================
    // 🎮 اللعبة 5
    // إكمال الحرف
    // ==========================================

    if (currentMiniGameIndex === 4) {

        miniGameEl.innerHTML = `
            <h3>🌟 أحسنت! أكملت ألعاب حرف ${currentLetterObj.name}</h3>

            <div class="big-word">
                ${currentLetterObj.letter}
            </div>

            <p>
                هل تستطيع نطق الحرف؟
            </p>

            <button class="primary" onclick="playLetterAudio()">
                🔊 اسمع الحرف
            </button>

            <br><br>

            <button class="success" onclick="finishFinalLetterGame()">
                🏆 أكملت الحرف
            </button>
        `;

        if (progressFill) {
            progressFill.style.width = '80%';
        }

        return;
    }
}


// ==========================================
// إنهاء اللعبة الرابعة
// ==========================================

function passDirectGame() {

    const msgEl = document.getElementById('gameMessage');

    if (msgEl) {
        msgEl.textContent =
            '🎉 أحسنت اجتياز اللعبة!';

        msgEl.style.color = 'green';
    }

    addStars(5);

    disableGameOptions();

    finishMiniGameStep();
}


// ==========================================
// إنهاء اللعبة الخامسة
// ==========================================

function finishFinalLetterGame() {

    const progressFill =
        document.getElementById('gameProgressFill');

    if (progressFill) {
        progressFill.style.width = '100%';
    }

    const badgeArea =
        document.getElementById('badgeArea');

    if (badgeArea) {
        badgeArea.style.display = 'block';
    }

    const msgEl =
        document.getElementById('gameMessage');

    if (msgEl) {
        msgEl.textContent =
            '🏆 مبروك! أكملت جميع ألعاب الحرف';

        msgEl.style.color = 'green';
    }

    // مكافأة إكمال الحرف
    addStars(20);
}


// ==========================================
// إظهار زر اللعبة التالية
// ==========================================

function finishMiniGameStep() {

    const nextBtn =
        document.getElementById('nextGameButton');

    if (nextBtn) {
        nextBtn.style.display = 'inline-block';
    }
}


// ==========================================
// الانتقال للعبة التالية
// ==========================================

function nextMiniGame() {

    if (currentMiniGameIndex >= totalMiniGames - 1) {
        return;
    }

    currentMiniGameIndex++;

    loadMiniGame();
}


// ==========================================
// تعطيل الاختيارات بعد الإجابة الصحيحة
// ==========================================

function disableGameOptions() {

    const buttons =
        document.querySelectorAll('#gameOptions .option-btn');

    buttons.forEach(function (button) {
        button.disabled = true;
    });
}


// ==========================================
// 🔀 خلط العناصر
// ==========================================

function shuffleArray(array) {

    for (let i = array.length - 1; i > 0; i--) {

        const j =
            Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] =
            [array[j], array[i]];
    }

    return array;
}


// ==========================================
// 📖 الكلمات
// ==========================================

const wordsData = [

    { word: 'مدرسة', picture: '🏫' },

    { word: 'تفاحة', picture: '🍎' },

    { word: 'قطة', picture: '🐱' },

    { word: 'شمس', picture: '☀️' },

    { word: 'قمر', picture: '🌙' },

    { word: 'سيارة', picture: '🚗' },

    { word: 'سمكة', picture: '🐟' },

    { word: 'كتاب', picture: '📖' }

];

let currentWordObj = null;
let wordAnswered = false;


// ==========================================
// كلمة جديدة
// ==========================================

function newWord() {

    currentWordObj =
        wordsData[
            Math.floor(Math.random() * wordsData.length)
        ];

    wordAnswered = false;

    const picture =
        document.getElementById('wordPicture');

    const word =
        document.getElementById('currentWord');

    const message =
        document.getElementById('wordMessage');

    if (picture) {
        picture.textContent = currentWordObj.picture;
    }

    if (word) {
        word.textContent = currentWordObj.word;
    }

    if (message) {
        message.textContent = '';
    }

    const optionsContainer =
        document.getElementById('wordOptions');

    if (!optionsContainer) return;

    optionsContainer.innerHTML = '';

    const choices = [currentWordObj.word];

    while (choices.length < 3) {

        const randWord =
            wordsData[
                Math.floor(Math.random() * wordsData.length)
            ].word;

        if (!choices.includes(randWord)) {
            choices.push(randWord);
        }
    }

    shuffleArray(choices);

    choices.forEach(function (w) {

        const btn =
            document.createElement('button');

        btn.className = 'option-btn';

        btn.textContent = w;

        btn.onclick = function () {

            const msgEl =
                document.getElementById('wordMessage');

            if (w === currentWordObj.word) {

                msgEl.textContent =
                    '🎉 إجابة صحيحة يا بطل!';

                msgEl.style.color = 'green';

                if (!wordAnswered) {
                    addStars(5);
                    wordAnswered = true;
                }

                disableButtons(
                    optionsContainer.querySelectorAll('button')
                );

            } else {

                msgEl.textContent =
                    '❌ حاول مرة أخرى';

                msgEl.style.color = 'red';
            }
        };

        optionsContainer.appendChild(btn);
    });
}


// ==========================================
// صوت الكلمة
// ==========================================

function playCurrentWordAudio() {

    if (!currentWordObj) return;

    playAudioText(currentWordObj.word);
}


// ==========================================
// 🔢 الأرقام والعد
// ==========================================

let currentNumVal = 1;

const numberNames = [
    'صفر',
    'واحد',
    'اثنان',
    'ثلاثة',
    'أربعة',
    'خمسة',
    'ستة',
    'سبعة',
    'ثمانية',
    'تسعة',
    'عشرة'
];

let numberAnswered = false;


// ==========================================
// رقم جديد
// ==========================================

function newNumber() {

    currentNumVal =
        Math.floor(Math.random() * 10) + 1;

    numberAnswered = false;

    const numberEl =
        document.getElementById('currentNumber');

    if (numberEl) {
        numberEl.textContent =
            convertToEasternArabicNumerals(currentNumVal);
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
        icons[Math.floor(Math.random() * icons.length)];

    const countItems =
        document.getElementById('countItems');

    if (countItems) {
        countItems.textContent =
            chosenIcon.repeat(currentNumVal);
    }

    const message =
        document.getElementById('numberMessage');

    if (message) {
        message.textContent = '';
    }

    const optionsContainer =
        document.getElementById('numberOptions');

    if (!optionsContainer) return;

    optionsContainer.innerHTML = '';

    const choices = [currentNumVal];

    while (choices.length < 3) {

        const randomNumber =
            Math.floor(Math.random() * 10) + 1;

        if (!choices.includes(randomNumber)) {
            choices.push(randomNumber);
        }
    }

    shuffleArray(choices);

    choices.forEach(function (n) {

        const btn =
            document.createElement('button');

        btn.className = 'option-btn';

        btn.textContent =
            convertToEasternArabicNumerals(n);

        btn.onclick = function () {

            const msgEl =
                document.getElementById('numberMessage');

            if (n === currentNumVal) {

                msgEl.textContent =
                    '🎉 صحيح يا بطل الأرقام!';

                msgEl.style.color = 'green';

                if (!numberAnswered) {
                    addStars(5);
                    numberAnswered = true;
                }

                disableButtons(
                    optionsContainer.querySelectorAll('button')
                );

            } else {

                msgEl.textContent =
                    '❌ حاول العد مرة أخرى';

                msgEl.style.color = 'red';
            }
        };

        optionsContainer.appendChild(btn);
    });
}


// ==========================================
// صوت الرقم
// ==========================================

function playCurrentNumberAudio() {

    const name =
        numberNames[currentNumVal] || currentNumVal;

    playAudioText(`الرقم ${name}`);
}


// ==========================================
// ✏️ الكتابة
// ==========================================

let canvas = null;
let ctx = null;
let isDrawing = false;

const writingLetters = [
    'أ',
    'ب',
    'ت',
    'ث',
    'ج',
    'ح',
    'خ',
    'د',
    'ر',
    'س',
    'ش',
    'ص',
    'ط',
    'ع',
    'ف',
    'ق',
    'ك',
    'ل',
    'م',
    'ن',
    'هـ',
    'و',
    'ي'
];

let currentWritingIndex = 0;


// ==========================================
// تهيئة لوحة الكتابة
// ==========================================

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
        Math.min(350, Math.max(250, parentWidth - 40));

    canvas.height = 250;

    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#4a90e2';

    // Mouse
    canvas.onmousedown = startDraw;
    canvas.onmousemove = drawing;
    canvas.onmouseup = stopDraw;
    canvas.onmouseleave = stopDraw;

    // Touch
    canvas.ontouchstart = function (e) {

        if (!e.touches || !e.touches[0]) return;

        startDraw(e.touches[0]);

        e.preventDefault();
    };

    canvas.ontouchmove = function (e) {

        if (!e.touches || !e.touches[0]) return;

        drawing(e.touches[0]);

        e.preventDefault();
    };

    canvas.ontouchend = function (e) {

        stopDraw();

        e.preventDefault();
    };

    newWritingLetter();
}


// ==========================================
// حرف جديد للكتابة
// ==========================================

function newWritingLetter() {

    if (!ctx || !canvas) return;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const letter =
        writingLetters[currentWritingIndex];

    const guide =
        document.getElementById('writingGuide');

    const message =
        document.getElementById('writingMessage');

    if (guide) {
        guide.textContent = letter;
    }

    if (message) {
        message.textContent = '';
    }

    currentWritingIndex =
        (currentWritingIndex + 1) %
        writingLetters.length;
}


// ==========================================
// بدء الرسم
// ==========================================

function startDraw(e) {

    if (!canvas || !ctx) return;

    isDrawing = true;

    const rect =
        canvas.getBoundingClientRect();

    const x =
        e.clientX - rect.left;

    const y =
        e.clientY - rect.top;

    ctx.beginPath();

    ctx.moveTo(x, y);
}


// ==========================================
// الرسم
// ==========================================

function drawing(e) {

    if (!isDrawing || !canvas || !ctx) return;

    const rect =
        canvas.getBoundingClientRect();

    const x =
        e.clientX - rect.left;

    const y =
        e.clientY - rect.top;

    ctx.lineTo(x, y);

    ctx.stroke();
}


// ==========================================
// إيقاف الرسم
// ==========================================

function stopDraw() {

    isDrawing = false;

    if (ctx) {
        ctx.closePath();
    }
}


// ==========================================
// مسح اللوحة
// ==========================================

function clearCanvas() {

    if (!ctx || !canvas) return;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}


// ==========================================
// إنهاء الكتابة
// ==========================================

function finishWriting() {

    const message =
        document.getElementById('writingMessage');

    if (message) {

        message.textContent =
            '🌟 خط جميل جداً! أحسنت الكتابة';

        message.style.color = 'green';
    }

    addStars(10);
}


// ==========================================
// ➕ الجمع
// ==========================================

let addLevel = 1;
let currentAddA = 1;
let currentAddB = 1;
let additionAnswered = false;


// ==========================================
// اختيار مستوى الجمع
// ==========================================

function setAdditionLevel(lvl) {

    addLevel = Number(lvl) || 1;

    const btn1 = document.getElementById('addBtn1');
    const btn2 = document.getElementById('addBtn2');
    const btn3 = document.getElementById('addBtn3');

    if (btn1) {
        btn1.className =
            addLevel === 1 ? 'primary' : 'secondary';
    }

    if (btn2) {
        btn2.className =
            addLevel === 2 ? 'primary' : 'secondary';
    }

    if (btn3) {
        btn3.className =
            addLevel === 3 ? 'primary' : 'secondary';
    }

    newAddition();
}


// ==========================================
// سؤال جمع جديد
// ==========================================

function newAddition() {

    additionAnswered = false;

    let maxLimit =
        addLevel === 1
            ? 5
            : addLevel === 2
                ? 10
                : 20;

    currentAddA =
        Math.floor(Math.random() * maxLimit) + 1;

    currentAddB =
        Math.floor(Math.random() * maxLimit) + 1;

    // المستوى الأول لا يتجاوز 10
    if (
        addLevel === 1 &&
        currentAddA + currentAddB > 10
    ) {
        currentAddA = 3;
        currentAddB = 2;
    }

    const question =
        document.getElementById('addQuestion');

    if (question) {

        question.textContent =
            `${convertToEasternArabicNumerals(currentAddA)}
             + ${convertToEasternArabicNumerals(currentAddB)}
             = ؟`;
    }

    const pictures =
        document.getElementById('addPictures');

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

    const answer =
        document.getElementById('addAnswer');

    if (answer) {
        answer.value = '';
    }

    const message =
        document.getElementById('addMessage');

    if (message) {
        message.textContent = '';
    }
}


// ==========================================
// فحص الجمع
// ==========================================

function checkAddition() {

    const answer =
        document.getElementById('addAnswer');

    const msgEl =
        document.getElementById('addMessage');

    if (!answer || !msgEl) return;

    const userAns =
        parseInt(normalizeArabicNumber(answer.value), 10);

    const correctAns =
        currentAddA + currentAddB;

    if (userAns === correctAns) {

        msgEl.textContent =
            '🎉 إجابة صحيحة وموفقة!';

        msgEl.style.color = 'green';

        if (!additionAnswered) {

            addStars(5);

            additionAnswered = true;
        }

    } else {

        msgEl.textContent =
            `❌ خطأ، الناتج الصحيح هو
            ${convertToEasternArabicNumerals(correctAns)}`;

        msgEl.style.color = 'red';
    }
}


// ==========================================
// ➖ الطرح
// ==========================================

let subLevel = 1;
let currentSubA = 1;
let currentSubB = 1;
let subtractionAnswered = false;


// ==========================================
// اختيار مستوى الطرح
// ==========================================

function setSubtractionLevel(lvl) {

    subLevel = Number(lvl) || 1;

    const btn1 = document.getElementById('subBtn1');
    const btn2 = document.getElementById('subBtn2');
    const btn3 = document.getElementById('subBtn3');

    if (btn1) {
        btn1.className =
            subLevel === 1 ? 'primary' : 'secondary';
    }

    if (btn2) {
        btn2.className =
            subLevel === 2 ? 'primary' : 'secondary';
    }

    if (btn3) {
        btn3.className =
            subLevel === 3 ? 'primary' : 'secondary';
    }

    newSubtraction();
}


// ==========================================
// سؤال طرح جديد
// ==========================================

function newSubtraction() {

    subtractionAnswered = false;

    const maxLimit =
        subLevel === 1
            ? 5
            : subLevel === 2
                ? 10
                : 20;

    currentSubA =
        Math.floor(Math.random() * maxLimit) + 1;

    // يسمح بالناتج صفر
    currentSubB =
        Math.floor(Math.random() * (currentSubA + 1));

    const question =
        document.getElementById('subQuestion');

    if (question) {

        question.textContent =
            `${convertToEasternArabicNumerals(currentSubA)}
             - ${convertToEasternArabicNumerals(currentSubB)}
             = ؟`;
    }

    const pictures =
        document.getElementById('subPictures');

    if (pictures) {

        if (subLevel === 1) {

            pictures.textContent =
                '🍎'.repeat(currentSubA);

        } else {

            pictures.textContent = '➖';
        }
    }

    const answer =
        document.getElementById('subAnswer');

    if (answer) {
        answer.value = '';
    }

    const message =
        document.getElementById('subMessage');

    if (message) {
        message.textContent = '';
    }
}


// ==========================================
// فحص الطرح
// ==========================================

function checkSubtraction() {

    const answer =
        document.getElementById('subAnswer');

    const msgEl =
        document.getElementById('subMessage');

    if (!answer || !msgEl) return;

    const userAns =
        parseInt(normalizeArabicNumber(answer.value), 10);

    const correctAns =
        currentSubA - currentSubB;

    if (userAns === correctAns) {

        msgEl.textContent =
            '🎉 بطل الطرح الذكي!';

        msgEl.style.color = 'green';

        if (!subtractionAnswered) {

            addStars(5);

            subtractionAnswered = true;
        }

    } else {

        msgEl.textContent =
            `❌ خطأ، الناتج الصحيح هو
            ${convertToEasternArabicNumerals(correctAns)}`;

        msgEl.style.color = 'red';
    }
}


// ==========================================
// تحويل الأرقام العربية إلى إنجليزية
// حتى يعمل parseInt
// ==========================================

function normalizeArabicNumber(value) {

    if (value === null || value === undefined) {
        return '';
    }

    return String(value)
        .replace(/[٠-٩]/g, function (d) {
            return '٠١٢٣٤٥٦٧٨٩'.indexOf(d);
        })
        .replace(/٫/g, '.');
}


// ==========================================
// 📖 القرآن الكريم
// ==========================================

const quranSurahs = [

    {
        name: 'سورة الإخلاص',

        ayahs: [

            {
                text: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
                audio: 'https://everyayah.com/data/Husary_128kbps/112001.mp3'
            },

            {
                text: 'اللَّهُ الصَّمَدُ',
                audio: 'https://everyayah.com/data/Husary_128kbps/112002.mp3'
            },

            {
                text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
                audio: 'https://everyayah.com/data/Husary_128kbps/112003.mp3'
            },

            {
                text: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
                audio: 'https://everyayah.com/data/Husary_128kbps/112004.mp3'
            }

        ]
    },

    {
        name: 'سورة الفاتحة',

        ayahs: [

            {
                text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                audio: 'https://everyayah.com/data/Husary_128kbps/001001.mp3'
            },

            {
                text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
                audio: 'https://everyayah.com/data/Husary_128kbps/001002.mp3'
            },

            {
                text: 'الرَّحْمَٰنِ الرَّحِيمِ',
                audio: 'https://everyayah.com/data/Husary_128kbps/001003.mp3'
            },

            {
                text: 'مَالِكِ يَوْمِ الدِّينِ',
                audio: 'https://everyayah.com/data/Husary_128kbps/001004.mp3'
            },

            {
                text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
                audio: 'https://everyayah.com/data/Husary_128kbps/001005.mp3'
            },

            {
                text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
                audio: 'https://everyayah.com/data/Husary_128kbps/001006.mp3'
            },

            {
                text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
                audio: 'https://everyayah.com/data/Husary_128kbps/001007.mp3'
            }

        ]
    },

    {
        name: 'سورة الكوثر',

        ayahs: [

            {
                text: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ',
                audio: 'https://everyayah.com/data/Husary_128kbps/108001.mp3'
            },

            {
                text: 'فَصَلِّ لِرَبِّكَ وَانْحَرْ',
                audio: 'https://everyayah.com/data/Husary_128kbps/108002.mp3'
            },

            {
                text: 'إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ',
                audio: 'https://everyayah.com/data/Husary_128kbps/108003.mp3'
            }

        ]
    }

];

let currentQuranIndex = 0;


// ==========================================
// تحميل سورة القرآن
// ==========================================

function loadQuranAyah() {

    const surah =
        quranSurahs[currentQuranIndex];

    if (!surah) return;

    const surahName =
        document.getElementById('surahName');

    if (surahName) {
        surahName.textContent = surah.name;
    }

    const container =
        document.getElementById('quranAyahList');

    if (!container) return;

    container.innerHTML = '';

    surah.ayahs.forEach(function (item, idx) {

        const row =
            document.createElement('div');

        row.className =
            'quran-ayah-row';

        const textDiv =
            document.createElement('div');

        textDiv.className =
            'quran-ayah-text';

        textDiv.textContent =
            `(${convertToEasternArabicNumerals(idx + 1)}) ${item.text}`;

        const button =
            document.createElement('button');

        button.className =
            'primary';

        button.textContent =
            '🔊 استمع لتلاوة الآية';

        button.onclick = function () {
            playNaturalAudio(item.audio);
        };

        row.appendChild(textDiv);
        row.appendChild(button);

        container.appendChild(row);
    });
}


// ==========================================
// السورة التالية
// ==========================================

function nextSurah() {

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
        text: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
        source: 'رواه البخاري ومسلم'
    },

    {
        text: 'الدِّينُ النَّصِيحَةُ',
        source: 'رواه مسلم'
    },

    {
        text: 'مَا زَالَ جِبْرِيلُ يُوصِينِي بِالْجَارِ حَتَّى ظَنَنْتُ أَنَّهُ سَيُوَرِّثُهُ',
        source: 'متفق عليه'
    }

];

let currentHadithIdx = 0;


// ==========================================
// تحميل الحديث
// ==========================================

function loadHadith() {

    const h =
        hadithsData[currentHadithIdx];

    if (!h) return;

    const text =
        document.getElementById('hadithText');

    const source =
        document.getElementById('hadithSource');

    if (text) {
        text.textContent = h.text;
    }

    if (source) {
        source.textContent = h.source;
    }
}


// ==========================================
// الحديث التالي
// ==========================================

function nextHadith() {

    currentHadithIdx =
        (currentHadithIdx + 1) %
        hadithsData.length;

    loadHadith();
}


// ==========================================
// صوت الحديث
// ==========================================

function playHadithAudio() {

    if (!hadithsData[currentHadithIdx]) return;

    playAudioText(
        hadithsData[currentHadithIdx].text
    );
}


// ==========================================
// 🤲 الأدعية
// ==========================================

const duasData = [

    {
        title: 'دعاء قبل الطعام',
        text: 'بِسْمِ اللَّهِ'
    },

    {
        title: 'دعاء الاستيقاظ من النوم',
        text: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ'
    },

    {
        title: 'دعاء ركوب الدابة',
        text: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ'
    }

];

let currentDuaIdx = 0;


// ==========================================
// تحميل الدعاء
// ==========================================

function loadDua() {

    const d =
        duasData[currentDuaIdx];

    if (!d) return;

    const title =
        document.getElementById('duaTitle');

    const text =
        document.getElementById('duaText');

    if (title) {
        title.textContent = d.title;
    }

    if (text) {
        text.textContent = d.text;
    }
}


// ==========================================
// الدعاء التالي
// ==========================================

function nextDua() {

    currentDuaIdx =
        (currentDuaIdx + 1) %
        duasData.length;

    loadDua();
}


// ==========================================
// صوت الدعاء
// ==========================================

function playDuaAudio() {

    if (!duasData[currentDuaIdx]) return;

    playAudioText(
        duasData[currentDuaIdx].text
    );
}


// ==========================================
// 🌅 أذكار الصباح والمساء
// ==========================================

const morningAdhkar = [

    'أصبحنا وأصبح الملك لله، والحمد لله.',

    'اللهم بك أصبحنا وبك أمسينا، وبك نحيا وبك نموت وإليك النشور.',

    'سُبْحَانَ اللهِ وَبِحَمْدِهِ (١٠٠ مرة)'

];


const eveningAdhkar = [

    'أمسينا وأمسى الملك لله، والحمد لله.',

    'اللهم بك أمسينا وبك أصبحنا، وبك نحيا وبك نموت وإليك المصير.',

    'آية الكرسي'

];


// ==========================================
// تبديل الأذكار
// ==========================================

function switchAdhkarTab(type) {

    const tab1 =
        document.getElementById('adhkarTab1');

    const tab2 =
        document.getElementById('adhkarTab2');

    const container =
        document.getElementById('adhkarContainer');

    if (!container) return;

    container.innerHTML = '';

    const list =
        type === 'morning'
            ? morningAdhkar
            : eveningAdhkar;

    if (tab1) {
        tab1.className =
            type === 'morning'
                ? 'primary'
                : 'secondary';
    }

    if (tab2) {
        tab2.className =
            type === 'evening'
                ? 'primary'
                : 'secondary';
    }

    list.forEach(function (item) {

        const div =
            document.createElement('div');

        div.className =
            'adhkar-item';

        const span =
            document.createElement('span');

        span.textContent = item;

        const button =
            document.createElement('button');

        button.className =
            'primary';

        button.textContent = '🔊';

        button.onclick = function () {
            playAudioText(item);
        };

        div.appendChild(span);
        div.appendChild(button);

        container.appendChild(div);
    });
}


// ==========================================
// 👨‍🏫 لوحة المعلم
// ==========================================

function updateTeacherStats() {

    const teacherStars =
        document.getElementById('teacherStars');

    const teacherLevel =
        document.getElementById('teacherLevel');

    const teacherLetters =
        document.getElementById('teacherLetters');

    const teacherWords =
        document.getElementById('teacherWords');

    const teacherNumbers =
        document.getElementById('teacherNumbers');

    const teacherAddition =
        document.getElementById('teacherAddition');

    const teacherSubtraction =
        document.getElementById('teacherSubtraction');


    if (teacherStars) {

        teacherStars.textContent =
            convertToEasternArabicNumerals(starsCount);
    }


    if (teacherLevel) {

        teacherLevel.textContent =
            convertToEasternArabicNumerals(level);
    }


    // إحصاءات تقريبية بناءً على النجوم
    if (teacherLetters) {

        teacherLetters.textContent =
            convertToEasternArabicNumerals(
                Math.floor(starsCount / 10)
            );
    }


    if (teacherWords) {

        teacherWords.textContent =
            convertToEasternArabicNumerals(
                Math.floor(starsCount / 5)
            );
    }


    if (teacherNumbers) {

        teacherNumbers.textContent =
            convertToEasternArabicNumerals(
                Math.floor(starsCount / 5)
            );
    }


    if (teacherAddition) {

        teacherAddition.textContent =
            convertToEasternArabicNumerals(
                Math.floor(starsCount / 8)
            );
    }


    if (teacherSubtraction) {

        teacherSubtraction.textContent =
            convertToEasternArabicNumerals(
                Math.floor(starsCount / 8)
            );
    }
}


// ==========================================
// تصفير النتائج
// ==========================================

function resetProgress() {

    const confirmed =
        confirm(
            'هل أنت متأكد من تصفير النتائج والنقاط؟'
        );

    if (!confirmed) return;

    starsCount = 0;
    level = 1;

    saveProgress();

    updateDisplay();
    updateTeacherStats();

    alert(
        'تم تصفير النتائج بنجاح.'
    );
}


// ==========================================
// 💾 حفظ التقدم
// ==========================================

function saveProgress() {

    try {

        localStorage.setItem(
            'taha_app_stars',
            String(starsCount)
        );

        // المستوى يحفظ أيضًا للتوافق
        localStorage.setItem(
            'taha_app_level',
            String(level)
        );

    } catch (error) {

        console.log(
            'تعذر حفظ التقدم:',
            error
        );
    }
}


// ==========================================
// 📥 تحميل التقدم
// ==========================================

function loadProgress() {

    try {

        const savedStars =
            localStorage.getItem(
                'taha_app_stars'
            );

        if (savedStars !== null) {

            const parsedStars =
                parseInt(savedStars, 10);

            if (
                !isNaN(parsedStar
