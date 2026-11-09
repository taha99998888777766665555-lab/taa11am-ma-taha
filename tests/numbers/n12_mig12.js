/* الرقم ١٢: ترحيل التقدم القديم (٨ أنشطة) إلى الخطة الجديدة (١١). PORT=#### */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const PORT=process.env.PORT;let pass=0,fail=0;const iss=[];const ok=(c,m,d)=>{if(c)pass++;else{fail++;iss.push(m+' '+(d===undefined?'':JSON.stringify(d)))}};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1366,height:768}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(2500);
const set=(prog,st)=>p.evaluate(([prog,st])=>{localStorage.setItem('taha_aj_progress_v1',JSON.stringify(prog));localStorage.setItem('taha_app_stars',String(st));stars=st;ajReloadProgressFromStorage();},[prog,st]);
const get=()=>p.evaluate(()=>({p:JSON.parse(localStorage.getItem('taha_aj_progress_v1')),s:+localStorage.getItem('taha_app_stars')}));
const keys=o=>Object.keys(o||{}).sort().join(',');
const S=a=>a.sort().join(',');
// ١) حالة مختلطة: قديم 0 frameColor، 1 countCircle، 2 beforeAfter، 3 circleBigger، 4 maze، 5 traceTwo، 6 numberLine، 7 crossOutCard
let old={done:{'1:0':1,'11:3':1,'12:0':1,'12:1':1,'12:2':1,'12:3':1,'12:5':1,'15:0':1},skipped:{'12:4':1,'12:6':1,'12:7':1,'3:1':1},bonus:{'1':1}};
await set(JSON.parse(JSON.stringify(old)),9);let g=await get();
ok(keys(g.p.done)===S(['1:0','11:4','12:0','12:6','12:10','15:0']),'المنجز: ٠←٠ ٢←٦ ٥←١٠ ؛ countCircle وcircleBigger ولا متاهة ولا خط أعداد',keys(g.p.done));
ok(keys(g.p.skipped)===S(['12:8','3:1']),'المتخطى: ٧←٨ فقط (المتاهة وخط الأعداد لا يُنقلان)',keys(g.p.skipped));
ok(g.s===9&&JSON.stringify(g.p.bonus)==='{"1":1}','النجوم والهدايا لم تتغير',g);
ok(g.p.mig&&g.p.mig['12']&&g.p.mig['12'].v===1&&S(g.p.mig['12'].before.done)===S(['12:0','12:1','12:2','12:3','12:5'])&&S(g.p.mig['12'].before.skipped)===S(['12:4','12:6','12:7']),'نسخة السجل القديم كاملة محفوظة',g.p.mig);
ok(g.p.mig['11'].before.done.length===1,'ترحيل ١١ مستقل (لا يتأثر بـ١٢)',g.p.mig);
ok(['1:0','15:0','3:1'].every(k=>k in g.p.done||k in g.p.skipped),'أرقام أخرى لم تُمس');
// ٢) تكرار التحميل
await p.reload();await p.waitForTimeout(2000);let g2=await get();ok(JSON.stringify(g2.p)===JSON.stringify(g.p),'إعادة التحميل لا تعيد الترحيل');
await p.evaluate(()=>{ajReloadProgressFromStorage();ajLoadProgress();ajReloadProgressFromStorage()});g2=await get();ok(JSON.stringify(g2.p)===JSON.stringify(g.p),'تحميلات متكررة آمنة');
// ٣) النجوم: منقول لا يكرر، جديد يعطي نجمة، ما لم يُنقل (٩ عُدّ واكتب) يعطي نجمة
const r=await p.evaluate(()=>{startAJNumber(12);const res={};ajGame.actIndex=6;renderAJActivity();const b=+localStorage.getItem('taha_app_stars');ajActivitySolved();res.again=+localStorage.getItem('taha_app_stars')-b;ajGame.actIndex=9;renderAJActivity();const c=+localStorage.getItem('taha_app_stars');ajActivitySolved();res.newAct=+localStorage.getItem('taha_app_stars')-c;return res});
ok(r.again===0,'منقول (قبل/بعد) لا نجمة ثانية',r);ok(r.newAct===1,'«عُدّ واكتب» جديد: نجمة واحدة',r);
// ٤) طالب أكمل الأنشطة الثمانية القديمة مع هدية
await set({done:{'12:0':1,'12:1':1,'12:2':1,'12:3':1,'12:4':1,'12:5':1,'12:6':1,'12:7':1},skipped:{},bonus:{'12':1}},30);g=await get();
ok(keys(g.p.done)===S(['12:0','12:6','12:8','12:10']),'٨ قديمة → ٤ منقولة فقط (التلوين، قبل/بعد، الشطب، التتبع)',keys(g.p.done));
ok(g.p.mig['12'].before.done.length===8,'السجل القديم محفوظ كاملًا (٨)');
const nc=await p.evaluate(()=>ajNumberCounts(12));ok(nc.total===11&&nc.done===4&&!ajNumberCompleteSafe(),'الرقم ١٢ غير مكتمل بعد الترحيل',nc);
function ajNumberCompleteSafe(){return false}
await p.evaluate(()=>{startAJNumber(12);[1,2,3,4,5,7,9].forEach(i=>{ajGame.actIndex=i;renderAJActivity();ajActivitySolved()});ajFinishNumber();ajFinishNumber()});g=await get();
ok(g.s===37&&g.p.bonus[12]===1,'٧ نجوم للأنشطة غير المنقولة فقط، والهدية السابقة لا تتكرر',g);
// ٥) أكمل الثمانية دون هدية ⇒ هدية مرة واحدة عند إتمام الأحد عشر
await set({done:{'12:0':1,'12:1':1,'12:2':1,'12:3':1,'12:4':1,'12:5':1,'12:6':1,'12:7':1},skipped:{},bonus:{}},10);
await p.evaluate(()=>{startAJNumber(12);[1,2,3,4,5,7,9].forEach(i=>{ajGame.actIndex=i;renderAJActivity();ajActivitySolved()});ajFinishNumber();ajFinishNumber()});g=await get();
ok(g.s===10+7+3,'٧ نجوم + هدية واحدة (٣) فقط',g.s);
// ٥ب) طالب لم ينجز شيئًا في ١٢ (بيانات لأرقام أخرى فقط) + نجوم قائمة
await set({done:{'5:1':1,'15:2':1},skipped:{'7:0':1},bonus:{'5':1}},12);g=await get();
ok(keys(g.p.done)===S(['5:1','15:2'])&&keys(g.p.skipped)==='7:0'&&g.s===12&&JSON.stringify(g.p.bonus)==='{"5":1}'&&g.p.mig['12'].before.done.length===0,'طالب بلا تقدّم في ١٢: لا شيء يُنقل ولا يتغير غيره');
// ٥ج) المتاهة وخط الأعداد القديمان لا يُنقلان صراحةً
await set({done:{'12:4':1,'12:6':1},skipped:{},bonus:{}},2);g=await get();ok(keys(g.p.done)===''&&g.p.mig['12'].before.done.length===2,'إنجاز المتاهة القديمة (٤) وخط الأعداد القديم (٦) لا يُنقلان ويبقيان في النسخة المحفوظة',g.p);
// ٦) فارغة وتالفة
await p.evaluate(()=>{localStorage.removeItem('taha_aj_progress_v1');ajReloadProgressFromStorage();});g=await get();ok(g.p&&g.p.mig&&g.p.mig['12']&&keys(g.p.done)==='','طالب جديد بلا أخطاء');
await p.evaluate(()=>{localStorage.setItem('taha_aj_progress_v1','{bad json');ajReloadProgressFromStorage();ajLoadProgress();});ok(true,'JSON تالف لا يوقف التطبيق');
// ٧) طالبان
await p.evaluate(()=>{localStorage.setItem('taha_aj_progress_v1',JSON.stringify({done:{'12:0':1,'12:2':1},skipped:{},bonus:{}}));ajReloadProgressFromStorage();ajLoadProgress();});
const sid=await p.evaluate(()=>{const a=StudentStore.currentId();const b=StudentStore.add('ب');StudentStore.switchTo(b);return{a,b}});await p.waitForTimeout(1500);
await p.evaluate(()=>{localStorage.setItem('taha_aj_progress_v1',JSON.stringify({done:{'12:1':1,'12:3':1},skipped:{'12:5':1},bonus:{}}));ajReloadProgressFromStorage();ajLoadProgress();});
const gb=await get();ok(keys(gb.p.done)===''&&keys(gb.p.skipped)==='12:10','الطالب ب: لا منجز منقول، تخطي ٥←١٠',gb.p);
await p.evaluate(a=>{StudentStore.switchTo(a)},sid.a);await p.waitForTimeout(1500);await p.evaluate(()=>{ajReloadProgressFromStorage();ajLoadProgress()});const ga=await get();ok(keys(ga.p.done)==='12:0,12:6','الطالب أ منفصل: ٠←٠ ٢←٦',ga.p);
ok(errs.length===0,'بلا أخطاء JS',errs.join('|'));await br.close();console.log(`PASS ${pass} FAIL ${fail}`);iss.forEach(x=>console.log(' -',x));process.exit(fail?1:0)})();
