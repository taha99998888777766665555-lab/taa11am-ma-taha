/* مسارات التنقل الأساسية: الرجوع خطوة بخطوة حتى الخروج */
const L=require('./lib.js');
const only=process.argv[2]?[process.argv[2]]:Object.keys(L.VPS);
(async()=>{for(const vp of only){console.log('== ',vp);
 const {br,p,errs}=await L.mk(vp);
 const chain=async(name,steps,expect)=>{ // steps: دوال تفتح المسار؛ expect: الشاشات المتوقعة عند ضغط الرجوع تباعًا
   await L.open(p);const got=[];
   for(const s of steps)await s();
   const first=await L.st(p);
   for(let i=0;i<expect.length;i++){const r=await L.back(p);got.push(r.scr)}
   L.ok(JSON.stringify(got)===JSON.stringify(expect),`${vp} ${name}: الرجوع المتسلسل`,{got,expect,first:first.scr});
 };
 const go=id=>async()=>{await p.evaluate(id=>showScreen(id),id);await p.waitForTimeout(350)};
 // الحروف: الشبكة ← مجموعة ← حرف ← رجوع ×3 ← الرئيسية ← خروج
 await chain('letters',[go('letters'),()=>L.tap(p,'.ltr-level-card-btn'),()=>L.tap(p,'.ltr-letter-card-btn')],['letters','letters','home','(غادر التطبيق)']);
 await chain('words',[go('words')],['home','(غادر التطبيق)']);
 await chain('writing',[go('writing'),()=>L.tap(p,'.wr-tile')],['writing','home','(غادر التطبيق)']);
 await chain('addition',[go('addition')],['home','(غادر التطبيق)']);
 await chain('quran',[go('quran'),()=>L.tap(p,'.quran-surah-card')],['quran','home','(غادر التطبيق)']);
 await chain('hadith',[go('hadith')],['home','(غادر التطبيق)']);
 await chain('home-only',[],['(غادر التطبيق)']);
 console.log(errs);await br.close()}
 process.exit(L.summary('walk1')?1:0)})();
