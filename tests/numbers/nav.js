/* قسم الأرقام: لمس، حجم الأزرار، تنقل (رجوع/رئيسية/زر المتصفح) على كل المقاسات. PORT=8993 [BASE=1 PORT=8990] node tests/numbers/nav.js */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const PORT=process.env.PORT||8993,BASE=process.env.BASE==='1';
const VPS={m360:[360,640,2,1,1],m390:[390,844,2,1,1],tablet:[820,1180,2,1,0],desktop:[1366,768,1,0,0],board:[1920,1080,1,1,0]};
let pass=0,fail=0;const ok=(c,m,d)=>{if(c)pass++;else{fail++;console.log('  ✗',m,d!==undefined?JSON.stringify(d):'')}};
const scr=p=>p.evaluate(()=>document.querySelector('.screen.active')&&document.querySelector('.screen.active').id);
(async()=>{const br=await chromium.launch();
for(const [vp,[w,h,d,t,m]] of Object.entries(VPS)){
 const ctx=await br.newContext({viewport:{width:w,height:h},deviceScaleFactor:d,hasTouch:!!t,isMobile:!!m,serviceWorkers:'block'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 await p.addInitScript(()=>{try{if(!localStorage.getItem('__s')){localStorage.setItem('taha_child_name','ط');localStorage.setItem('taha_child_avatar','🦁');localStorage.setItem('__s','1')}}catch(e){}});
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(1300);
 const tap=async loc=>{if(t)await loc.tap({timeout:4000});else await loc.click({timeout:4000})};
 /* من الرئيسية إلى الأرقام ثم «أرقامي الجميلة» بالنقر الفعلي */
 await tap(p.locator('#home .hm-tile',{hasText:'الأرقام'}).first());await p.waitForTimeout(400);
 ok(await scr(p)==='numbers',`${vp}: فتح الأرقام`);
 await tap(p.locator('.aj-entry-btn').first());await p.waitForTimeout(500);
 ok(await scr(p)==='ajHome',`${vp}: فتح أرقامي الجميلة`);
 const sz=await p.evaluate(()=>[...document.querySelectorAll('#ajMap .aj-num-btn')].map(b=>{const r=b.getBoundingClientRect();return[Math.round(r.width),Math.round(r.height),r.left>=0&&r.right<=innerWidth]}));
 ok(sz.length===10&&sz.every(s=>s[0]>=56&&s[1]>=56&&s[2]),`${vp}: أزرار الأرقام ≥٥٦ وداخل الشاشة`,sz.slice(0,3));
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${vp}: لا تمرير أفقي`);
 const targets=BASE?[1]:[1,10,11,20];
 for(const n of targets){
  await p.evaluate(b=>{openAJHome(b)},n<=10?1:2);await p.waitForTimeout(250);
  const b=p.locator(`#ajMap .aj-num-btn[data-number="${n}"]`);await b.scrollIntoViewIfNeeded();await tap(b);await p.waitForTimeout(450);
  ok(await scr(p)==='ajPlay'&&await p.evaluate(()=>ajGame.number)===n,`${vp}: لمس الرقم ${n} يفتح نشاطه`);
  /* الرجوع إلى الخريطة بزر الصفحة */
  await tap(p.locator('#ajPlay [onclick="ajBackToMap()"]').first());await p.waitForTimeout(350);
  ok(await scr(p)==='ajHome',`${vp}: زر الرجوع من الرقم ${n} → الخريطة`);
 }
 /* الرئيسية من داخل نشاط (زر الرئيسية الثابت) */
 await p.evaluate(()=>startAJNumber(1));await p.waitForTimeout(300);
 await tap(p.locator('#hmHomeBtn'));await p.waitForTimeout(400);
 ok(await scr(p)==='home',`${vp}: زر الرئيسية من داخل النشاط`);
 /* زر المتصفح: رجوع/أمام */
 await p.evaluate(()=>showScreen('numbers'));await p.waitForTimeout(150);await p.evaluate(()=>openAJHome(1));await p.waitForTimeout(150);await p.evaluate(()=>startAJNumber(1));
 const seq=[];
 for(let i=0;i<3;i++){await p.goBack().catch(()=>{});await p.waitForTimeout(350);seq.push(await scr(p))}
 for(let i=0;i<3;i++){await p.goForward().catch(()=>{});await p.waitForTimeout(350);seq.push(await scr(p))}
 console.log(vp,'تسلسل المتصفح (رجوع×٣ ثم أمام×٣):',seq.join(' → '));
 ok(!seq.includes(null)&&!seq.includes(undefined),`${vp}: لا شاشة فارغة في الرجوع/الأمام`,seq);
 ok(errs.length===0,`${vp}: لا أخطاء JS`,errs);
 await ctx.close()}
console.log('PASS',pass,'FAIL',fail);await br.close()})();
