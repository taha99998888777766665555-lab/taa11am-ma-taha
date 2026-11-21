# سباق الحروف بالفتحة — ملفات الدمج داخل التطبيق

- `reading-race-host.js`: المضيف (وحدة ES). يبني الشاشة `#readingLettersRace` ويدير الجلسة والصوت والتأكيد والتنظيف، ويستدعي `rr3CreateEngine` الأصلي من `script.js`.
- `reading-drive.js` و`reading-painters.js`: منقولتان كما سُلّمتا (جمع النجوم، رسام السيارة والبوابة غير النشطة).
- `reading-race.css`: أنماط معزولة تحت `#readingLettersRace`.
- البيانات: `../reading-race-data/` (قائمة السماح والبصمات). الصوت من `assets/audio/educational/letters/` الأصلية بعد التحقق ببصمة SHA-256 (يتطلب سياقًا آمنًا: https أو localhost).

## تعديلات الملفات المشتركة (محصورة)
- `script.js`: المواضع الأربعة الاختيارية في المحرك (سُلّمت)، + `cfg.readingTheme` الاختياري، + فحص تنظيف في `showScreen` لا يعمل إلا إن وُجدت جلسة قراءة.
- `index.html`: بطاقة «سباق الحروف بالفتحة» في قسم الألعاب، وsection جديد، وlink للـCSS، وscript module.

## قبل النشر (لم يُنفَّذ، بانتظار موافقة المالك)
`service-worker.js`: رفع `CACHE_VERSION` وإضافة ملفات `reading-race/*` و`reading-race-data/approved-data.mjs` و`reading-banks.mjs` إلى `APP_SHELL`، ثم اختبار التحميل الأول وتحديث الكاش القديم. أصوات الحروف مخزّنة مسبقًا أصلًا (LESSON_AUDIO).
