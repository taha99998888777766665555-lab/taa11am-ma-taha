/* ترقية النسخة المنشورة (cb98986) → numbers-12-dev: بيانات الطلاب الحاليين لا تُفقد ولا تتكرر مكافآتها، وتعمل بلا اتصال.
   OLD=<مجلد النسخة المنشورة> node tests/numbers/upgrade_pub_to_12.js */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const {spawn}=require('child_process');
const PORT=8810,OLD=process.env.OLD,NEW=process.env.NEW||process.cwd();let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,JSON.stringify(d))}};
const serve=d=>spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{cwd:d,stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{let srv=serve(OLD);await sleep(900);
const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(3500);await p.evaluate(()=>navigator.serviceWorker.ready.then(()=>1));await p.waitForTimeout(2500);
const oldVer=await p.evaluate(()=>caches.keys());
// طالب حالي: ١١ و١٢ بالترتيب القديم (٨ أنشطة)، أرقام أخرى، نجوم، هدية ١١، وبيانات أقسام أخرى
const seed={done:{'1:0':1,'1:4':1,'5:2':1,'10:10':1,'11:0':1,'11:1':1,'11:2':1,'11:3':1,'11:4':1,'11:5':1,'11:6':1,'11:7':1,'12:0':1,'12:1':1,'12:2':1,'12:3':1,'12:4':1,'12:5':1,'12:6':1,'12:7':1,'13:0':1},skipped:{'14:1':1},bonus:{'1':1,'11':1,'12':1}};
await p.evaluate(s=>{localStorage.setItem('taha_aj_progress_v1',JSON.stringify(s));localStorage.setItem('taha_app_stars','77');localStorage.setItem('taha_child_name','ط');localStorage.setItem('taha_child_avatar','🦁');localStorage.setItem('other_section_probe',JSON.stringify({letters:{'ب':3},quran:{s:1}}))},seed);
await p.reload();await p.waitForTimeout(3000);
const snapOld=await p.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return o});
await ctx.close();srv.kill();await sleep(500);
// الترقية: نفس الأصل (المنفذ) لكن بالملفات الجديدة، مع نفس بيانات المتصفح
const ctx2=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p2=await ctx2.newPage();const errs2=[];p2.on('pageerror',e=>errs2.push(String(e)));
srv=serve(NEW);await sleep(900);
await p2.goto(`http://127.0.0.1:${PORT}/manifest.json`);
await p2.evaluate(s=>{Object.entries(s).forEach(([k,v])=>localStorage.setItem(k,v))},snapOld);
await p2.goto(`http://127.0.0.1:${PORT}/index.html`);await p2.waitForTimeout(3500);await p2.evaluate(()=>navigator.serviceWorker.ready.then(()=>1));await p2.waitForTimeout(3000);
const g=()=>p2.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return o});
// افتح قسم الأرقام وكل الأرقام ١–١٢ ليحدث الترحيل فعليًا
await p2.evaluate(()=>{showScreen('numbers')});await p2.waitForTimeout(400);
for(let n=1;n<=20;n++){await p2.evaluate(n=>{openAJHome(n<=10?1:2);startAJNumber(n)},n);await p2.waitForTimeout(120)}
const A0=await g();const norm=o=>{const r={};Object.keys(o).forEach(k=>{r[k.replace(/^taha_s_[^_]+_[^_]+__/,'').replace(/^taha_s_.*?__/,'')]=o[k]});return r};const A=norm(A0);const O=norm(snapOld);
ok(A.taha_app_stars==='77','النجوم لم تتغير بعد الترقية وفتح الأرقام',A.taha_app_stars);
ok(A.other_section_probe===O.other_section_probe&&A.taha_child_name===O.taha_child_name&&!!O.other_section_probe,'بيانات الأقسام الأخرى كما هي');
const changed=Object.keys(O).filter(k=>A[k]!==O[k]);
ok(changed.every(k=>k==='taha_aj_progress_v1'),'المفتاح الوحيد المتغير هو تقدم أرقامي الجميلة',changed.map(k=>[k,String(O[k]).slice(0,60),String(A[k]).slice(0,60)]));
const P=JSON.parse(A.taha_aj_progress_v1);const keys=o=>Object.keys(o).sort().join(',');
ok(['1:0','1:4','5:2','10:10','13:0'].every(k=>P.done[k]===1)&&!P.skipped['14:1']&&P.mig['14']&&P.mig['14'].before.skipped.includes('14:1'),'تقدّم ١–١٠ كما هو؛ ١٣ و١٤ مرحّلان (المتخطّى القديم محفوظ في السجل ولا يُنقل)');
ok(JSON.stringify(P.bonus)===JSON.stringify(seed.bonus),'الهدايا كما هي',P.bonus);
ok(keys(Object.fromEntries(Object.keys(P.done).filter(k=>k.startsWith('12:')).map(k=>[k,1])))==='12:0,12:10,12:6,12:8','١٢: أربعة أنشطة منقولة فقط',keys(P.done));
ok(keys(Object.fromEntries(Object.keys(P.done).filter(k=>k.startsWith('11:')).map(k=>[k,1])))==='11:0,11:1,11:2,11:3,11:4,11:5,11:6,11:8'.split(',').sort().join(','),'١١: الترحيل المعتمد (٨ منقولة، عُدّ واكتب جديد)',keys(P.done));
ok(P.mig&&P.mig['12']&&P.mig['12'].before.done.length===8&&P.mig['11'].before.done.length===8,'السجل القديم للرقمين محفوظ كاملًا');
// إعادة فتح التطبيق مرارًا لا تعيد الترحيل ولا تكرر مكافأة
const before=A.taha_aj_progress_v1;
for(let i=0;i<3;i++){await p2.reload();await p2.waitForTimeout(2500);await p2.evaluate(()=>{showScreen('numbers');openAJHome(2);startAJNumber(12);startAJNumber(11)});await p2.waitForTimeout(300)}
const B=norm(await g());ok(B.taha_aj_progress_v1===before&&B.taha_app_stars==='77','٣ إعادات فتح: لا ترحيل مكرر ولا نجوم إضافية');
// إعادة حل نشاط منقول وإنهاء رقم سبق أخذ هديته: لا نجوم
const r=await p2.evaluate(()=>{const s0=+localStorage.getItem('taha_app_stars');startAJNumber(12);ajGame.actIndex=6;renderAJActivity();ajActivitySolved();ajGame.actIndex=0;renderAJActivity();ajActivitySolved();ajFinishNumber();return +localStorage.getItem('taha_app_stars')-s0});
ok(r===0,'إعادة حل أنشطة منقولة وإنهاء ١٢ (هديته مأخوذة): لا نجوم مكررة',r);
const r2=await p2.evaluate(()=>{const s0=+localStorage.getItem('taha_app_stars');startAJNumber(12);ajGame.actIndex=9;renderAJActivity();ajActivitySolved();ajGame.actIndex=9;renderAJActivity();ajActivitySolved();return +localStorage.getItem('taha_app_stars')-s0});
ok(r2===1,'نشاط جديد غير منقول يمنح نجمة واحدة فقط مهما أُعيد حلّه',r2);
// النسخة والكاش
const ks=await p2.evaluate(()=>caches.keys());ok(ks.join()==='taha-app-v67','الكاش الجديد فقط بعد التفعيل',{old:oldVer,now:ks});
// بلا اتصال: واجهة الأرقام الجديدة والأرقام ١–١٢
await ctx2.setOffline(true);await p2.reload();await p2.waitForTimeout(3000);
const off=await p2.evaluate(async()=>{showScreen('numbers');await new Promise(r=>setTimeout(r,500));const imgs=[...document.querySelectorAll('.nh-card img')].map(i=>i.complete&&i.naturalWidth>0);const out={imgs:imgs.length&&imgs.every(Boolean),acts:{}};
 for(let n=1;n<=12;n++){startAJNumber(n);const plan=ajBuildPlan(n).flat.length;let okc=0;for(let i=0;i<plan;i++){ajGame.actIndex=i;renderAJActivity();await new Promise(r=>setTimeout(r,150));if(document.querySelectorAll('#ajStage *').length>5)okc++}out.acts[n]=okc+'/'+plan}
 return out});
ok(off.imgs,'واجهة الأرقام الجديدة (الصور) تعمل بلا اتصال');
ok(Object.entries(off.acts).every(([n,v])=>{const[a,b]=v.split('/');return a===b}),'الأرقام ١–١٢: كل الأنشطة تُرسم بلا اتصال',off.acts);
ok(errs.length+errs2.length===0,'بلا أخطاء JS',errs.concat(errs2));
srv.kill();await br.close();console.log(`UPGRADE pub→12 PASS ${pass} FAIL ${fail}`);process.exit(fail?1:0)})();
