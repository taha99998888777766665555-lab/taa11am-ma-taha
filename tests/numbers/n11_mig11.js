/* الرقم ١١: اختبار ترحيل التقدم (حالات الإنجاز والتخطي والنجوم والهدايا). PORT=#### */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const PORT=process.env.PORT;let pass=0,fail=0;const iss=[];const ok=(c,m,d)=>{if(c)pass++;else{fail++;iss.push(m+' '+(d===undefined?'':JSON.stringify(d)))}};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1366,height:768}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(2500);
const set=(prog,st)=>p.evaluate(([prog,st])=>{localStorage.setItem('taha_aj_progress_v1',JSON.stringify(prog));localStorage.setItem('taha_app_stars',String(st));stars=st;ajReloadProgressFromStorage();},[prog,st]);
const get=()=>p.evaluate(()=>({p:JSON.parse(localStorage.getItem('taha_aj_progress_v1')),s:+localStorage.getItem('taha_app_stars')}));
const keys=o=>Object.keys(o||{}).sort().join(',');
const old={done:{'1:0':1,'1:3':1,'5:2':1,'11:0':1,'11:1':1,'11:3':1,'11:7':1,'12:0':1},skipped:{'11:2':1,'11:5':1,'3:1':1},bonus:{'1':1}};
// ١) حالة مختلطة: إنجاز وتخطٍّ
await set(JSON.parse(JSON.stringify(old)),7);
let g=await get();
ok(keys(g.p.done)==='1:0,1:3,11:1,11:4,11:5,11:0,12:0,5:2'.split(',').sort().join(','),'الإنجاز حسب النوع: ٠←٠ ١←١ ٣←٤ ٧←٥',keys(g.p.done));
ok(keys(g.p.skipped)==='11:2,11:6,3:1'.split(',').sort().join(','),'التخطي: ٢←٦ ٥←٢',keys(g.p.skipped));
ok(JSON.stringify(g.p.bonus)==='{"1":1}'&&g.s===7,'النجوم والهدايا لم تتغير',g);
ok(g.p.mig&&g.p.mig['11']&&g.p.mig['11'].v===1&&keys({a:1})&&g.p.mig['11'].before.done.length===4&&g.p.mig['11'].before.skipped.length===2,'نسخة من الحالة قبل الترحيل محفوظة',g.p.mig);
ok(['1:0','1:3','5:2','12:0','3:1'].every(k=>k in g.p.done||k in g.p.skipped),'أرقام أخرى لم تُمس');
// ٢) تكرار التحميل لا يعيد الترحيل
await p.reload();await p.waitForTimeout(2000);let g2=await get();ok(JSON.stringify(g2.p)===JSON.stringify(g.p),'إعادة التحميل لا تعيد الترحيل');
await p.evaluate(()=>{ajReloadProgressFromStorage();ajLoadProgress();ajReloadProgressFromStorage()});g2=await get();ok(JSON.stringify(g2.p)===JSON.stringify(g.p),'تحميلات متكررة آمنة');
// ٣) لا نجمة مكررة لنشاط منقول؛ نجمة لنشاط جديد؛ لا هدية مكررة
const r=await p.evaluate(()=>{startAJNumber(11);const res={};ajGame.actIndex=4;renderAJActivity();const b=+localStorage.getItem('taha_app_stars');ajActivitySolved();res.again=+localStorage.getItem('taha_app_stars')-b;ajGame.actIndex=7;renderAJActivity();const b2=+localStorage.getItem('taha_app_stars');ajActivitySolved();res.newAct=+localStorage.getItem('taha_app_stars')-b2;return res});
ok(r.again===0,'نشاط منجز سابقًا (منقول) لا يعطي نجمة ثانية',r);ok(r.newAct===1,'النشاط الجديد يعطي نجمة واحدة',r);
// ٤) إتمام كامل قديم مع هدية
await set({done:{'11:0':1,'11:1':1,'11:2':1,'11:3':1,'11:4':1,'11:5':1,'11:6':1,'11:7':1},skipped:{},bonus:{'11':1}},20);g=await get();
ok(Object.keys(g.p.done).length===8&&!('11:7' in g.p.done)&&('11:8' in g.p.done)&&('11:6' in g.p.done)&&('11:5' in g.p.done),'إتمام ٨ قديم → ٨ منقولة + الجديد (عُدّ واكتب) غير منجز',keys(g.p.done));
await p.evaluate(()=>{startAJNumber(11);ajGame.actIndex=7;renderAJActivity();ajActivitySolved();ajFinishNumber()});g=await get();ok(g.s===21&&g.p.bonus[11]===1,'نجمة النشاط الجديد فقط، دون تكرار هدية الإتمام',g.s);
// ٥) إتمام قديم بلا هدية (لم يضغط إنهاء) ⇒ يستحقها مرة واحدة فقط
await set({done:{'11:0':1,'11:1':1,'11:2':1,'11:3':1,'11:4':1,'11:5':1,'11:6':1,'11:7':1},skipped:{},bonus:{}},8);
await p.evaluate(()=>{startAJNumber(11);ajGame.actIndex=7;renderAJActivity();ajActivitySolved();ajFinishNumber();ajFinishNumber()});g=await get();ok(g.s===8+1+3,'هدية واحدة فقط عند الإنهاء (لا تكرار عند الإنهاء مرتين)',g.s);
// ٦) بيانات فارغة / تالفة
await p.evaluate(()=>{localStorage.removeItem('taha_aj_progress_v1');ajReloadProgressFromStorage();});g=await get();ok(g.p&&g.p.mig&&g.p.mig['11'],'طالب جديد: يُسجَّل الترحيل بلا أخطاء');
await p.evaluate(()=>{localStorage.setItem('taha_aj_progress_v1','{bad json');ajReloadProgressFromStorage();ajLoadProgress();});ok(true,'JSON تالف لا يوقف التطبيق');
// ٧) طالبان منفصلان
await p.evaluate(()=>{localStorage.setItem('taha_aj_progress_v1',JSON.stringify({done:{'11:0':1,'11:2':1},skipped:{},bonus:{}}));ajReloadProgressFromStorage();ajLoadProgress();});
const sid=await p.evaluate(()=>{const a=StudentStore.currentId();const b=StudentStore.add('ب');StudentStore.switchTo(b);return{a,b}});await p.waitForTimeout(1500);
await p.evaluate(()=>{localStorage.setItem('taha_aj_progress_v1',JSON.stringify({done:{'11:1':1},skipped:{'11:4':1},bonus:{}}));ajReloadProgressFromStorage();ajLoadProgress();});
const gb=await get();ok(keys(gb.p.done)==='11:1'&&keys(gb.p.skipped)==='11:3','الطالب ب: ١←١ ، تخطي ٤←٣',gb.p);
await p.evaluate(a=>{StudentStore.switchTo(a)},sid.a);await p.waitForTimeout(1500);await p.evaluate(()=>{ajReloadProgressFromStorage();ajLoadProgress()});const ga=await get();ok(keys(ga.p.done)==='11:0,11:6','الطالب أ منفصل: ٠←٠ و٢←٦',ga.p);
ok(errs.length===0,'بلا أخطاء JS',errs.join('|'));await br.close();console.log(`PASS ${pass} FAIL ${fail}`);iss.forEach(x=>console.log(' -',x));})();
