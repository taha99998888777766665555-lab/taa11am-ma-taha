/* قسم الأرقام («أرقامي الجميلة» ١–٢٠): كل الأرقام مفتوحة للدخول المباشر ودخولها لا يمسّ أي بيانات.
   PORT=8993 node tests/numbers/open.js        (الفرع)
   PORT=8990 BASE=1 node tests/numbers/open.js (main: لإثبات القفل الأصلي) */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const PORT=process.env.PORT||8993,BASE=process.env.BASE==='1';
let pass=0,fail=0;const ok=(c,m,d)=>{if(c)pass++;else{fail++;console.log('  ✗',m,d!==undefined?JSON.stringify(d):'')}};
const snap=p=>p.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return JSON.stringify(Object.keys(o).sort().map(k=>[k,o[k]]))});
const URL=`http://127.0.0.1:${PORT}/index.html`;
(async()=>{const br=await chromium.launch();
const mk=async(vp={width:390,height:844},seed)=>{const ctx=await br.newContext({viewport:vp,hasTouch:true,isMobile:vp.width<600,serviceWorkers:'block'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.addInitScript(s=>{try{if(!localStorage.getItem('__seeded')){localStorage.setItem('taha_child_name','ط');localStorage.setItem('taha_child_avatar','🦁');(s||[]).forEach(([k,v])=>localStorage.setItem(k,v));localStorage.setItem('__seeded','1')}}catch(e){}},seed);
 await p.goto(URL);await p.waitForTimeout(1400);return{ctx,p,errs}};
const grid=(p,book)=>p.evaluate(b=>{openAJHome(b);const m=document.getElementById('ajMap');const bs=[...m.querySelectorAll('.aj-num-btn')];return{n:bs.length,locked:bs.filter(x=>x.classList.contains('aj-locked')).length,lock:/🔒/.test(m.textContent),dis:bs.filter(x=>x.getAttribute('aria-disabled')==='true').length,cur:bs.filter(x=>x.classList.contains('aj-current')).map(x=>x.dataset.number),hint:document.getElementById('ajHomeHint').textContent}},book);
async function enterAll(p,errs,label,tap){
 const out=[];
 for(let n=1;n<=20;n++){
  await p.evaluate(b=>openAJHome(b),n<=10?1:2);await p.waitForTimeout(120);
  const btn=p.locator(`#ajMap .aj-num-btn[data-number="${n}"]`);await btn.scrollIntoViewIfNeeded();
  if(tap)await btn.tap({timeout:3000});else await btn.click({timeout:3000});await p.waitForTimeout(250);
  out.push(await p.evaluate(()=>({scr:document.querySelector('.screen.active')&&document.querySelector('.screen.active').id,num:ajGame.number,act:ajGame.active,stage:document.getElementById('ajStage').children.length})));
  await p.evaluate(()=>ajBackToMap());await p.waitForTimeout(80)}
 if(!BASE)out.forEach((r,i)=>ok(r.scr==='ajPlay'&&r.num===i+1&&r.act&&r.stage>0,`${label}: دخول الرقم ${i+1} مباشرة`,r));
 else console.log('   (main)',label,'دخل مباشرة:',out.map((r,i)=>r.scr==='ajPlay'?i+1:null).filter(Boolean).join(','));
 ok(errs.length===0,`${label}: لا أخطاء JS`,errs);return out}
/* ١) طالب جديد */
{const {ctx,p,errs}=await mk();
 for(const b of [1,2]){const g=await grid(p,b);console.log(`طالب جديد — كتاب ${b}:`,JSON.stringify(g));
  if(BASE)console.log('   (main) مقفل:',g.locked,'من',g.n);
  else{ok(g.n===10&&g.locked===0&&!g.lock&&g.dis===0,`كتاب ${b}: ١٠ أرقام بلا قفل ولا 🔒 ولا aria-disabled`,g);ok(g.cur.length===1,`كتاب ${b}: رقم مقترح واحد`,g)}}
 const before=await snap(p);await enterAll(p,errs,'طالب جديد',false);const after=await snap(p);
 if(!BASE)ok(before===after,'طالب جديد: دخول الأرقام العشرين لم يغيّر أي مفتاح تخزين',{b:before.length,a:after.length});
 await ctx.close()}
if(BASE){console.log('PASS',pass,'FAIL',fail);await br.close();return}
/* ٢) طالب متقدم: ١–٣ مكتملة، ٣٧ نجمة */
{const done={};
 const seed=[['taha_app_stars','37']];
 const {ctx,p,errs}=await mk({width:390,height:844},seed);
 await p.evaluate(()=>{ajReloadProgressFromStorage();const pr=ajLoadProgress();for(let n=1;n<=3;n++){ajBuildPlan(n).flat.forEach((_,i)=>{pr.done[ajActKey(n,i)]=1});pr.bonus[n]=1}ajSaveProgress()});
 await p.reload();await p.waitForTimeout(1400);
 const g1=await grid(p,1);ok(g1.locked===0&&g1.cur.join()==='4','متقدم: صفر أقفال والمقترح = الرقم ٤',g1);
 const g2=await grid(p,2);ok(g2.locked===0&&!g2.lock,'متقدم: كتاب ٢ بلا أقفال',g2);
 const before=await snap(p);await enterAll(p,errs,'طالب متقدم',false);const after=await snap(p);
 ok(before===after,'متقدم: الدخول المباشر للأرقام العشرين لم يغيّر أي بيانات (نجوم/تقدم)',{});
 const st0=await p.evaluate(()=>localStorage.getItem('taha_app_stars'));ok(st0==='37','النجوم ٣٧ كما هي',st0);
 /* قواعد النجوم القائمة تعمل كما هي على رقم بعيد (١٥): نجمة لأول إنجاز نشاط فقط */
 const r=await p.evaluate(()=>{startAJNumber(15);const s0=+localStorage.getItem('taha_app_stars');ajActivitySolved();const s1=+localStorage.getItem('taha_app_stars');
  renderAJActivity();ajActivitySolved();const s2=+localStorage.getItem('taha_app_stars');return{s0,s1,s2,done:ajIsDone(15,0)}});
 ok(r.s0===37&&r.s1===38&&r.s2===38&&r.done,'رقم ١٥ مباشرة: +١ نجمة لأول إنجاز نشاط ولا تتكرر عند الإعادة (القاعدة القائمة)',r);
 /* تخطّي كل أنشطة رقم ١٢: لا نجوم ولا هدية */
 const r2=await p.evaluate(()=>{startAJNumber(12);const s0=+localStorage.getItem('taha_app_stars');const total=ajGame.plan.flat.length;for(let i=0;i<total;i++){ajSkipActivity()}return{s0,s1:+localStorage.getItem('taha_app_stars'),bonus12:!!ajLoadProgress().bonus[12]}});
 ok(r2.s0===r2.s1&&!r2.bonus12,'تخطّي رقم ١٢ كاملًا: لا نجوم ولا هدية إتمام (القاعدة القائمة)',r2);
 const keep=await p.evaluate(()=>{const pr=ajLoadProgress();let ok=true;for(let n=1;n<=3;n++){ajBuildPlan(n).flat.forEach((_,i)=>{if(!pr.done[ajActKey(n,i)])ok=false});if(!pr.bonus[n])ok=false}return ok});
 ok(keep,'تقدّم الأرقام ١–٣ سليم بعد كل ما سبق',{});
 /* شاشة الإتمام: زر «الرقم التالي» يظهر دائمًا ما لم يكن آخر رقم */
 const fin=await p.evaluate(()=>{startAJNumber(7);ajFinishNumber();const b=document.getElementById('ajDoneNext');return{hidden:b.hidden}});
 ok(fin.hidden===false,'إتمام الرقم ٧: زر الرقم التالي ظاهر',fin);
 await ctx.close()}
/* ٣) طالبان: لا تأثير متبادل */
{const {ctx,p}=await mk();
 await p.evaluate(()=>{const a=StudentStore.currentId();window.__ids={a,b:StudentStore.add('ثانٍ')}});
 const ids=await p.evaluate(()=>window.__ids);
 await p.evaluate(a=>StudentStore.switchTo(a),ids.a).catch(()=>{});await p.waitForTimeout(1800);
 await p.evaluate(()=>{ajReloadProgressFromStorage();startAJNumber(9);ajActivitySolved()});await p.waitForTimeout(200);
 await p.waitForTimeout(100);
 const sA=await p.evaluate(()=>localStorage.getItem('taha_aj_progress_v1'));
 await p.evaluate(b=>StudentStore.switchTo(b),ids.b).catch(()=>{});await p.waitForTimeout(1800);
 await p.evaluate(()=>{ajReloadProgressFromStorage();for(const n of [1,10,11,20]){startAJNumber(n);ajActivitySolved()}});await p.waitForTimeout(200);
 await p.evaluate(a=>StudentStore.switchTo(a),ids.a).catch(()=>{});await p.waitForTimeout(1800);
 const sA2=await p.evaluate(()=>localStorage.getItem('taha_aj_progress_v1'));
 ok(!!sA&&/"9:0"/.test(sA)&&sA===sA2,'طالب أول: تقدّمه كما كان بعد أن عمل الثاني على أرقام بعيدة',{});
 await ctx.close()}
console.log('PASS',pass,'FAIL',fail);await br.close()})();
