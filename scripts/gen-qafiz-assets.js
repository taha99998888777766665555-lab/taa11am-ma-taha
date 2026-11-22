/* يعيد توليد qafiz-assets.js من محتوى qafiz-platformer/ (dist فقط). الاستعمال: node scripts/gen-qafiz-assets.js */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "qafiz-platformer");
const out = [];
(function walk(d) { for (const f of fs.readdirSync(d).sort()) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : out.push(path.relative(path.join(__dirname, ".."), p).split(path.sep).join("/")); } })(root);
const list = out.filter(f => !/\.md$/.test(f));
const head = `/* =========================================================
   🦘 qafiz-assets.js — قائمة ملفات لعبة «قافز المنصات» للعمل دون إنترنت (مولَّدة: scripts/gen-qafiz-assets.js)
   يستوردها service-worker.js (importScripts) ويستعملها عند طلب الصفحة «تخزين اللعبة» فقط،
   أي بعد أن يفتح الطالب اللعبة مرة واحدة متصلًا. لا تُحمَّل عند تثبيت التطبيق ولا عند فتحه.
   عند تغيير أي ملف في qafiz-platformer/ يُرفع QAFIZ_CACHE في service-worker.js ويُعاد توليد هذه القائمة.
   ========================================================= */
self.QAFIZ_ASSETS = [
`;
fs.writeFileSync(path.join(__dirname, "..", "qafiz-assets.js"), head + list.map(f => ` "./${f}"`).join(",\n") + "\n];\n");
console.log(list.length + " files");
