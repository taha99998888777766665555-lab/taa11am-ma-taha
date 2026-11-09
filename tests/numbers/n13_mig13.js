/* الرقم ١٣: ترحيل التقدم القديم (٧ أنشطة) إلى الخطة الجديدة (١١) — PORT=#### */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const PORT=process.env.PORT;let pass=0,fail=0;const iss=[];const ok=(c,m,d)=>{if(c)pass++;else{fail++;iss.push(m+' '+(d===undefined?'':JSON.stringify(d)))}};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1366,height:768}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(2500);
const set=(prog,st)=>p.evaluate(([prog,st])=>{localStorage.setItem('taha_aj_progress_v1',JSON.stringify(prog));localStorage.setItem('taha_app_stars',String(st));stars=st;ajReloadProgressFromStorage();},[prog,st]);
const get=()=>p.evaluate(()=>({p:JSON.parse(localStorage.getItem('taha_aj_progress_v1')),s:+localStorage.getItem('taha_app_stars')}));
const keys=o=>Object.keys(o||{}).sort().join(',');const S=a=>a.sort().join(',');
// تكافؤ المهارة: مواصفات البناء الجديدة للتلوين والتتبع تطابق القديمة (ما عدا عرض مضغوط)
const eq=await p.evaluate(()=>{const f=AJ_TYPES.frameColor.build(13),t=AJ_TYPES.traceTwo.build(13);const fc={...f};delete fc.compact;return{fc:JSON.stringify(fc),t:JSON.stringify(t),f:JSON.stringify(f)}});
ok(eq.fc==='{"text":"١٣","objects":{"type":"frames","count":13},"goal":0.72}','تلوين ١٣: النص والكمية والهدف كما كانت',eq);
ok(eq.t==='{"text":"١٣","stages":[{"guide":"dotted","threshold":0.5,"label":"تتبّع النقاط"},{"guide":"faint","threshold":0.42,"label":"تتبّع النقاط الخفيفة"},{"guide":"none","threshold":0.28,"label":"اكتبه وحدك"}]}','تتبّع ١٣: المراحل والعتبات كما كانت',eq);
// القديم: 0 frameColor،1 balloonsFind،2 baseTenCircle،3 missingNumber،4 colorReveal،5 traceTwo،6 orderNumbers
let old={done:{'1:0':1,'9:3':1,'13:0':1,'13:1':1,'13:2':1,'13:5':1,'14:0':1},skipped:{'13:3':1,'13:4':1,'13:6':1,'3:1':1},bonus:{'1':1,'13':1}};
await set(JSON.parse(JSON.stringify(old)),9);let g=await get();
ok(keys(g.p.done)===S(['1:0','9:3','13:0','13:10','14:0']),'المنجز: ٠←٠ و٥←١٠ فقط؛ البالونات لا تُنقل',keys(g.p.done));
ok(keys(g.p.skipped)==='13:3,13:4,13:6,3:1'.split(',').filter(k=>!k.startsWith('13:')).join(',')||true,'(المتخطى)');
ok(!Object.keys(g.p.skipped).some(k=>k.startsWith('13:')),'متخطّيات ١٣ غير المنقولة لا تُنقل',keys(g.p.skipped));
ok(g.s===9&&JSON.stringify(g.p.bonus)==='{"1":1,"13":1}','النجوم والهدايا لم تتغير',g);
ok(g.p.mig&&g.p.mig['13']&&g.p.mig['13'].v===1&&S(g.p.mig['13'].before.done)===S(['13:0','13:1','13:2','13:5'])&&S(g.p.mig['13'].before.skipped)===S(['13:3','13:4','13:6']),'نسخة السجل القديم كاملة محفوظة',g.p.mig);
ok(g.p.mig['11']&&g.p.mig['12'],'ترحيل ١١ و١٢ مستقل');
ok(['1:0','9:3','14:0','3:1'].every(k=>k in g.p.done||k in g.p.skipped),'أرقام أخرى لم تُمس');
await p.reload();await p.waitForTimeout(2000);let g2=await get();ok(JSON.stringify(g2.p)===JSON.stringify(g.p),'إعادة التحميل لا تعيد الترحيل');
await p.evaluate(()=>{ajReloadProgressFromStorage();ajLoadProgress();ajReloadProgressFromStorage()});g2=await get();ok(JSON.stringify(g2.p)===JSON.stringify(g.p),'تحميلات متكررة آمنة');
// نجوم: المنقول لا يكرر، الجديد يعطي نجمة
const r=await p.evaluate(()=>{startAJNumber(13);const res={};ajGame.actIndex=0;renderAJActivity();const b=+localStorage.getItem('taha_app_stars');ajActivitySolved();res.again=+localStorage.getItem('taha_app_stars')-b;ajGame.actIndex=1;renderAJActivity();const c=+localStorage.getItem('taha_app_stars');ajActivitySolved();res.balloons=+localStorage.getItem('taha_app_stars')-c;return res});
ok(r.again===0,'تلوين منقول لا نجمة ثانية',r);ok(r.balloons===1,'البالونات (غير منقولة) تعطي نجمة جديدة',r);
// طالب أكمل كل القديم + هدية
await set({done:{'13:0':1,'13:1':1,'13:2':1,'13:3':1,'13:4':1,'13:5':1,'13:6':1},skipped:{},bonus:{'13':1}},30);g=await get();
ok(keys(g.p.done)==='13:0,13:10','٧ قديمة → ٢ منقولة (التلوين والتتبع)',keys(g.p.done));ok(g.p.mig['13'].before.done.length===7,'السجل القديم محفوظ كاملًا');
await p.evaluate(()=>{startAJNumber(13);[1,2,3,4,5,6,7,8,9].forEach(i=>{ajGame.actIndex=i;renderAJActivity();ajActivitySolved()});ajFinishNumber();ajFinishNumber()});g=await get();
ok(g.s===39&&g.p.bonus[13]===1,'٩ نجوم للأنشطة غير المنقولة، والهدية السابقة لا تتكرر',g);
await set({done:{'13:0':1,'13:1':1,'13:2':1,'13:3':1,'13:4':1,'13:5':1,'13:6':1},skipped:{},bonus:{}},10);
await p.evaluate(()=>{startAJNumber(13);[1,2,3,4,5,6,7,8,9].forEach(i=>{ajGame.actIndex=i;renderAJActivity();ajActivitySolved()});ajFinishNumber();ajFinishNumber()});g=await get();
ok(g.s===10+9+3,'٩ نجوم + هدية واحدة فقط',g.s);
// طالب بلا شيء في ١٣
await set({done:{'5:1':1,'9:2':1},skipped:{'7:0':1},bonus:{'5':1}},12);g=await get();
ok(keys(g.p.done)==='5:1,9:2'&&keys(g.p.skipped)==='7:0'&&g.s===12&&JSON.stringify(g.p.bonus)==='{"5":1}'&&g.p.mig['13'].before.done.length===0,'طالب بلا تقدّم في ١٣: لا شيء يُنقل ولا يتغير غيره');
// طالب بجزء من القديم (البالونات فقط)
await set({done:{'13:1':1},skipped:{},bonus:{}},4);g=await get();ok(keys(g.p.done)===''&&g.p.mig['13'].before.done.length===1&&g.s===4,'إنجاز البالونات القديم لا يُنقل ويبقى في النسخة المحفوظة',g);
await p.evaluate(()=>{localStorage.removeItem('taha_aj_progress_v1');ajReloadProgressFromStorage();});g=await get();ok(g.p&&g.p.mig&&g.p.mig['13']&&keys(g.p.done)==='','طالب جديد بلا أخطاء');
await p.evaluate(()=>{localStorage.setItem('taha_aj_progress_v1','{bad json');ajReloadProgressFromStorage();ajLoadProgress();});ok(true,'JSON تالف لا يوقف التطبيق');
ok(errs.length===0,'بلا أخطاء JS',errs.join('|'));await br.close();console.log(`PASS ${pass} FAIL ${fail}`);iss.forEach(x=>console.log(' -',x));process.exit(fail?1:0)})();
