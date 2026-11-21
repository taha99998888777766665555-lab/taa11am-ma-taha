# سباق الحروف بالفتحة — ملفات الدمج داخل التطبيق

- `reading-race-host.js`: المضيف (وحدة ES). يبني الشاشة `#readingLettersRace` ويدير الجلسة والصوت والتأكيد والتنظيف، ويستدعي `rr3CreateEngine` الأصلي من `script.js`.
- `reading-drive.js` و`reading-painters.js`: منقولتان كما سُلّمتا (جمع النجوم، رسام السيارة والبوابة غير النشطة).
- `reading-race.css`: أنماط معزولة تحت `#readingLettersRace`.
- البيانات: `../reading-race-data/` (قائمة السماح والبصمات). الصوت من `assets/audio/educational/letters/` الأصلية بعد التحقق ببصمة SHA-256 (يتطلب سياقًا آمنًا: https أو localhost).

## تعديلات الملفات المشتركة (محصورة)
- `script.js`: المواضع الأربعة الاختيارية في المحرك (سُلّمت)، + `cfg.readingTheme` الاختياري، + فحص تنظيف في `showScreen` لا يعمل إلا إن وُجدت جلسة قراءة.
- `index.html`: بطاقة «سباق الحروف بالفتحة» في قسم الألعاب، وsection جديد، وlink للـCSS، وscript module.

## الكاش دون إنترنت (نُفِّذ على الفرع)
`service-worker.js`: `CACHE_VERSION` صار `taha-app-v70`، وأُضيفت إلى `APP_SHELL` ملفات `reading-race/*` (المضيف والجمع والرسام والأنماط) و`reading-race-data/reading-banks.mjs` و`approved-data.mjs`. أصوات الحروف مخزنة أصلًا عبر `LESSON_AUDIO`. اختبار الترقية والعمل دون إنترنت: `tests/reading-race/offline-upgrade.js`.

## معاينة اللعبة قبل النشر
من جذر المشروع على الفرع `reading-letters-race-integration`:

    python3 -m http.server 8080

ثم افتح `http://localhost:8080/index.html` ← الألعاب ← «سباق الحروف بالفتحة». لا تفتح الملف مباشرة من القرص (file://) لأن التحقق من الصوت يحتاج localhost أو https. لتجربة التشغيل دون إنترنت: افتح اللعبة مرة وانتظر ثوانيَ، حدّث الصفحة مرتين، ثم أوقف الخادم أو اختر Offline في أدوات المطور وجرّب.
