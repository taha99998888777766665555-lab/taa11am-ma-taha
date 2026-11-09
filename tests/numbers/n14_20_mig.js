/* الأرقام ١٤–٢٠: ترحيل التقدم القديم (من d463e8a) — PORT=#### */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const PORT=process.env.PORT;let pass=0,fail=0;const iss=[];const ok=(c,m,d)=>{if(c)pass++;else{fail++;iss.push(m+' '+(d===undefined?'':JSON.stringify(d)))}};
const E=d=>String(d).replace(/\d/g,x=>'٠١٢٣٤٥٦٧٨٩'[x]);
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1366,height:768}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(2500);
const set=(prog,st)=>p.evaluate(([prog,st])=>{localStorage.setItem('taha_aj_progress_v1',JSON.stringify(prog));localStorage.setItem('taha_app_stars',String(st));stars=st;ajReloadProgressFromStorage();},[prog,st]);
const get=()=>p.evaluate(()=>({p:JSON.parse(localStorage.getItem('taha_aj_progress_v1')),s:+localStorage.getItem('taha_app_stars')}));
const keys=o=>Object.keys(o||{}).sort().join(',');const S=a=>a.sort().join(',');
const OLD=JSON.parse(process.env.OLDIDX||'{"14":5,"15":5,"16":6,"17":5,"18":5,"19":5,"20":5}');
for(let n=14;n<=20;n++){const ti=OLD[n];
 const eq=await p.evaluate(n=>{const f=AJ_TYPES.frameColor.build(n),t=AJ_TYPES.traceTwo.build(n);const fc={...f};delete fc.compact;return{fc:JSON.stringify(fc),t:JSON.stringify(t)}},n);
 ok(eq.fc===`{"text":"${E(n)}","objects":{"type":"frames","count":${n}},"goal":0.72}`,`${n}: تلوين كما كان`,eq.fc);
 ok(eq.t.includes(`"text":"${E(n)}"`)&&eq.t.includes('"threshold":0.5')&&eq.t.includes('"threshold":0.28'),`${n}: تتبّع كما كان`,eq.t.slice(0,120));
 const old={done:{[`${n}:0`]:1,[`${n}:1`]:1,[`${n}:${ti}`]:1,'1:0':1,[`${n+1>20?19:n+1}:0`]:1},skipped:{[`${n}:3`]:1,'3:1':1},bonus:{'1':1,[n]:1}};
 await set(JSON.parse(JSON.stringify(old)),9);let g=await get();
 const other=`${n+1>20?19:n+1}:0`;
 ok(keys(g.p.done).split(',').filter(k=>k.startsWith(n+':')).sort().join()===S([`${n}:0`,`${n}:10`]),`${n}: المنقول التلوين والتتبع فقط`,keys(g.p.done));
 ok(g.p.done['1:0']&&g.p.done[other]!==undefined,`${n}: أرقام أخرى لم تُمس`);
 ok(!Object.keys(g.p.skipped).some(k=>k.startsWith(n+':'))&&'3:1' in g.p.skipped,`${n}: المتخطّى غير المنقول لا يُنقل`,keys(g.p.skipped));
 ok(g.s===9&&g.p.bonus[n]===1&&g.p.bonus['1']===1,`${n}: النجوم والهدايا ثابتة`,g);
 ok(g.p.mig&&g.p.mig[n]&&S(g.p.mig[n].before.done)===S([`${n}:0`,`${n}:1`,`${n}:${ti}`]),`${n}: نسخة السجل القديم محفوظة`,g.p.mig&&g.p.mig[n]);
 await p.reload();await p.waitForTimeout(1800);let g2=await get();ok(JSON.stringify(g2.p)===JSON.stringify(g.p),`${n}: إعادة التحميل لا تعيد الترحيل`);
 // لا نجمة مكررة للمنقول، والبقية تعطي نجمة، والهدية لا تتكرر
 const r=await p.evaluate(n=>{startAJNumber(n);const b0=+localStorage.getItem('taha_app_stars');ajGame.actIndex=0;renderAJActivity();ajActivitySolved();const a=+localStorage.getItem('taha_app_stars')-b0;ajGame.actIndex=10;renderAJActivity();ajActivitySolved();const t=+localStorage.getItem('taha_app_stars')-b0-a;ajGame.actIndex=1;renderAJActivity();ajActivitySolved();const c=+localStorage.getItem('taha_app_stars')-b0-a-t;return{a,t,c}},n);
 ok(r.a===0&&r.t===0&&r.c===1,`${n}: لا نجمة مكررة للمنقول`,r);
 // طالب أنهى كل القديم مع هدية
 await set({done:Object.fromEntries([...Array(7).keys()].map(i=>[`${n}:${i}`,1])),skipped:{},bonus:{[n]:1}},40);
 await p.evaluate(n=>{startAJNumber(n);[1,2,3,4,5,6,7,8,9].forEach(i=>{ajGame.actIndex=i;renderAJActivity();ajActivitySolved()});ajFinishNumber();ajFinishNumber()},n);g=await get();
 ok(g.s===49&&g.p.bonus[n]===1,`${n}: ٩ نجوم والهدية القديمة لا تتكرر`,g.s);
 await set({done:{},skipped:{},bonus:{}},5);g=await get();ok(keys(g.p.done)===''&&g.s===5,`${n}: طالب بلا تقدّم`);
}
await p.evaluate(()=>{localStorage.setItem('taha_aj_progress_v1','{bad');ajReloadProgressFromStorage();ajLoadProgress();});ok(true,'JSON تالف');
ok(errs.length===0,'بلا أخطاء JS',errs.join('|'));await br.close();console.log(`PASS ${pass} FAIL ${fail}`);iss.forEach(x=>console.log(' -',x));process.exit(fail?1:0)})();
