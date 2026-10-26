/* إعادة التحميل، تبديل الطالب، النوافذ، أول تشغيل، الأمام، النقر السريع */
const L=require('./lib.js');
const only=process.argv[2]?[process.argv[2]]:['m360','m390','tablet','desktop','board'];
(async()=>{for(const vp of only){console.log('== ',vp);
 let {br,p,errs}=await L.mk(vp);
 // ١) إعادة التحميل وسط قسم: لا إدخالات "شبحية" بعدها
 await L.open(p);
 await p.evaluate(()=>showScreen('letters'));await p.waitForTimeout(300);await L.tap(p,'.ltr-level-card-btn');
 await p.reload();await p.waitForTimeout(1500);
 let s=await L.st(p);L.ok(s.scr==='home'&&s.stack.length===1,`${vp}: بعد إعادة التحميل الرئيسية ومسار بطول ١`,s);
 s=await L.back(p,700);L.ok(s.scr==='(غادر التطبيق)',`${vp}: الرجوع بعد إعادة التحميل يخرج (لا يعود لقسم قديم)`,s);
 // ٢) تبديل الطالب ثم الرجوع
 await L.open(p);
 const ids=await p.evaluate(()=>{const a=StudentStore.currentId();const b=StudentStore.add('طالب ثانٍ');return {a,b}});
 await p.evaluate(()=>showScreen('writing'));await p.waitForTimeout(300);
 const snapA=await p.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^taha_s_|students|current/.test(k))o[k]=localStorage.getItem(k)}return JSON.stringify(o)});
 await p.evaluate(b=>StudentStore.switchTo(b),ids.b);await p.waitForTimeout(2000);
 s=await L.st(p);L.ok(s.scr==='home'&&s.stack.length===1,`${vp}: بعد تبديل الطالب الرئيسية ومسار نظيف`,s);
 await p.evaluate(()=>showScreen('numbers'));await p.waitForTimeout(300);
 s=await L.back(p);L.ok(s.scr==='home',`${vp}: رجوع من الأرقام للرئيسية بعد التبديل`,s);
 await p.evaluate(a=>StudentStore.switchTo(a),ids.a);await p.waitForTimeout(2000);
 const snapB=await p.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^taha_s_|students|current/.test(k))o[k]=localStorage.getItem(k)}return JSON.stringify(o)});
 const A=JSON.parse(snapA),B=JSON.parse(snapB);const lost=Object.keys(A).filter(k=>/^taha_s_/.test(k)&&A[k]!==B[k]);
 L.ok(lost.length===0,`${vp}: بيانات الطالب الأول سليمة بعد تبديلين وتنقل`,lost);
 s=await L.back(p,700);L.ok(s.scr==='(غادر التطبيق)'||s.scr==='home',`${vp}: الرجوع بعد تبديل الطالب لا يفتح قسمًا قديمًا`,s);
 // ٣) نافذة اختيار الطالب: الرجوع يغلقها ولا يغيّر الشاشة
 await L.open(p);await p.evaluate(()=>showScreen('writing'));await p.waitForTimeout(300);
 await p.evaluate(()=>openStudentPicker());await p.waitForTimeout(500);
 const dlg=await p.evaluate(()=>!![...document.querySelectorAll('[role=dialog]')].find(d=>d.getBoundingClientRect().width>0));
 s=await L.back(p);const dlg2=await p.evaluate(()=>!![...document.querySelectorAll('[role=dialog]')].find(d=>d.getBoundingClientRect().width>0));
 L.ok(dlg,`${vp}: نافذة الطالب فُتحت`);
 L.ok(!dlg2&&s.scr==='writing',`${vp}: الرجوع أغلق نافذة الطالب وبقي في الكتابة`,{dlg2,s});
 s=await L.back(p);L.ok(s.scr==='home',`${vp}: ثم رجوع إلى الرئيسية`,s);
 // ٤) الأمام بعد الرجوع
 await p.evaluate(()=>showScreen('hadith'));await p.waitForTimeout(300);
 await L.back(p);await p.goForward();await p.waitForTimeout(500);
 s=await L.st(p);L.ok(s.scr==='hadith'&&s.stack.join()==='home,hadith',`${vp}: زر الأمام يعيد الحديث`,s);
 // ٥) نقر سريع: رئيسية ثم قسم بلا انتظار
 await L.open(p);
 await p.evaluate(()=>{showScreen('letters');showScreen('home');showScreen('words');showScreen('home');showScreen('quran')});await p.waitForTimeout(900);
 s=await L.st(p);L.ok(s.scr==='quran'&&s.stack[0]==='home'&&s.stack[s.stack.length-1]==='quran'&&s.stack.length<=3,`${vp}: تنقل سريع متتابع يبقى المسار متسقًا`,s);
 s=await L.back(p,700);L.ok(['home','words'].includes(s.scr)||s.scr==='quran',`${vp}: رجوع بعد التنقل السريع`,s);
 // ٦) أول تشغيل بلا اسم: ملف الطالب ثم الرجوع للرئيسية ثم الخروج
 await br.close();
 ({br,p,errs}=await L.mk(vp,{named:false}));
 await L.open(p,1800);s=await L.st(p);
 L.ok(s.scr==='profile'||s.scr==='home',`${vp}: أول تشغيل`,s);
 if(s.scr==='profile'){s=await L.back(p,600);L.ok(s.scr==='home',`${vp}: رجوع من ملف أول تشغيل للرئيسية`,s);s=await L.back(p,600);L.ok(s.scr==='(غادر التطبيق)',`${vp}: ثم خروج`,s)}
 console.log(vp,'errors:',errs);await br.close()}
 process.exit(L.summary('walk3')?1:0)})();
