/* اختبارات زر «تثبيت التطبيق»: Android/كمبيوتر (حدث beforeinstallprompt)، iPhone/iPad (تعليمات)، الإخفاء بعد التثبيت، عدم المساس بالتخزين. PORT=8991 */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const PORT=process.env.PORT||8991,URL=`http://127.0.0.1:${PORT}/index.html`;
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
const IOS_UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const IPAD_UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const AND_UA='Mozilla/5.0 (Linux; Android 13; SM-T505) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
async function mk(br,o,init){const ctx=await br.newContext({serviceWorkers:'block',...o});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript(()=>{try{if(!localStorage.getItem('taha_child_name')){localStorage.setItem('taha_child_name','طالب');localStorage.setItem('taha_child_avatar','🦁')}}catch(e){}});
 if(init)await p.addInitScript(init);await p.goto(URL);await p.waitForTimeout(1500);return {ctx,p,errs}}
const fire=p=>p.evaluate(()=>{const e=new Event('beforeinstallprompt',{cancelable:true});e.prompted=0;e.prompt=function(){window.__prompted=(window.__prompted||0)+1;return Promise.resolve()};e.userChoice=new Promise(r=>{window.__choose=r});window.dispatchEvent(e);return e.defaultPrevented});
const vis=p=>p.evaluate(()=>!document.getElementById('hmInstall').hidden&&document.getElementById('hmInstall').getBoundingClientRect().height>0);
(async()=>{const br=await chromium.launch();
 // 1) Android/كمبيوتر
 for(const [n,o] of [['android',{viewport:{width:800,height:1280},userAgent:AND_UA,hasTouch:true,isMobile:true}],['desktop',{viewport:{width:1366,height:768}}]]){
  const {ctx,p,errs}=await mk(br,o);
  ok(!(await vis(p)),n+' الزر مخفي قبل حدث التثبيت (لا رسالة توحي بدعم غير موجود)');
  ok(await p.evaluate(()=>!document.getElementById('hmInstallIos').offsetParent&&document.getElementById('hmInstallIos').hidden),n+' نافذة iOS مخفية');
  const ls0=await p.evaluate(()=>JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage[k]])));
  ok(await fire(p),n+' المتصفح الافتراضي مُنع (preventDefault)');await p.waitForTimeout(200);
  ok(await vis(p),n+' الزر يظهر بعد beforeinstallprompt');
  const r=await p.evaluate(()=>{const b=document.getElementById('hmInstallBtn').getBoundingClientRect();return {h:b.height,w:b.width,t:document.getElementById('hmInstallBtn').textContent.replace(/\s+/g,' ').trim()}});
  ok(r.h>=56&&r.w>=200,n+' الزر كبير بما يكفي للمس',JSON.stringify(r));ok(/تثبيت التطبيق/.test(r.t),n+' العنوان «تثبيت التطبيق»',r.t);
  await p.locator('#hmInstallBtn').click();await p.waitForTimeout(200);
  ok(await p.evaluate(()=>window.__prompted===1),n+' الضغط يستدعي نافذة التثبيت مرة واحدة');
  ok(!(await vis(p)),n+' الزر يختفي بعد الضغط');
  await p.evaluate(()=>window.__choose({outcome:'accepted'}));await p.waitForTimeout(100);
  await p.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));await p.waitForTimeout(100);
  ok(!(await vis(p)),n+' مخفي بعد appinstalled');
  await fire(p);await p.waitForTimeout(100);ok(!(await vis(p)),n+' لا يعود بعد التثبيت داخل الجلسة');
  ok(await p.evaluate(()=>JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage[k]])))===ls0,n+' التخزين المحلي لم يتغير');
  // زر الإعدادات القديم ما زال يعمل
  ok(await p.evaluate(()=>typeof triggerAppInstall==='function'&&!!document.getElementById('settingsInstallBtn')),n+' زر الإعدادات الأصلي باقٍ');
  ok(errs.length===0,n+' بلا أخطاء JS',errs.join('|'));await ctx.close()}
 // 2) رفض المستخدم: لا يظهر الزر من جديد إلا بحدث جديد
 {const {ctx,p}=await mk(br,{viewport:{width:1366,height:768}});await fire(p);await p.locator('#hmInstallBtn').click();await p.evaluate(()=>window.__choose({outcome:'dismissed'}));await p.waitForTimeout(150);
  ok(!(await vis(p)),'بعد الرفض يبقى مخفيًا حتى يرسل المتصفح حدثًا جديدًا');await fire(p);await p.waitForTimeout(100);ok(await vis(p),'حدث جديد يعيد الزر');await ctx.close()}
 // 3) iPhone / iPad
 for(const [n,o] of [['iphone',{viewport:{width:390,height:844},userAgent:IOS_UA,hasTouch:true,isMobile:true}],['ipad',{viewport:{width:820,height:1180},userAgent:IPAD_UA,hasTouch:true}]]){
  const init=n==='ipad'?()=>{Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5});Object.defineProperty(navigator,'platform',{get:()=>'MacIntel'})}:null;
  const {ctx,p,errs}=await mk(br,o,init);
  ok(await vis(p),n+' يظهر الزر على iOS دون حدث');
  await p.locator('#hmInstallBtn').click();await p.waitForTimeout(200);
  const d=await p.evaluate(()=>{const e=document.getElementById('hmInstallIos');const r=e.getBoundingClientRect();return {open:!e.hidden,h:r.height,txt:e.textContent.replace(/\s+/g,' ')}});
  ok(d.open&&d.h>200,n+' تظهر نافذة التعليمات');ok(/المشاركة/.test(d.txt)&&/إضافة إلى الشاشة الرئيسية/.test(d.txt),n+' نص التعليمات صحيح');
  ok(await p.evaluate(()=>window.__prompted===undefined),n+' لا استدعاء لنافذة تلقائية');
  await p.locator('#hmInstallIos [data-close]').click();await p.waitForTimeout(150);
  ok(await p.evaluate(()=>document.getElementById('hmInstallIos').hidden),n+' زر «إغلاق» يغلقها');
  ok(errs.length===0,n+' بلا أخطاء',errs.join('|'));await ctx.close()}
 // 4) iOS مثبّت (standalone) ← مخفي
 {const {ctx,p}=await mk(br,{viewport:{width:390,height:844},userAgent:IOS_UA,hasTouch:true,isMobile:true},()=>Object.defineProperty(navigator,'standalone',{get:()=>true}));ok(!(await vis(p)),'iOS بعد الإضافة للشاشة الرئيسية: لا زر');await ctx.close()}
 // 5) standalone على Android/كمبيوتر (display-mode) ← مخفي حتى لو وصل الحدث
 {const {ctx,p}=await mk(br,{viewport:{width:1366,height:768}},()=>{const o=window.matchMedia.bind(window);window.matchMedia=q=>{const r=o(q);return /display-mode:\s*standalone/.test(q)?{matches:true,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}:r}});
  await fire(p);await p.waitForTimeout(100);ok(!(await vis(p)),'تطبيق مثبّت (display-mode: standalone): لا زر');await ctx.close()}
 // 6) متصفح داخل تطبيق (فيسبوك) على iOS: لا زر
 {const {ctx,p}=await mk(br,{viewport:{width:390,height:844},userAgent:IOS_UA+' [FBAN/FBIOS;FBAV/450]',hasTouch:true,isMobile:true});ok(!(await vis(p)),'متصفح داخل تطبيق على iOS: لا زر (لا قائمة إضافة)');await ctx.close()}
 // 7) المنقّح/الوضع الداكن/تخطيط الصفحة الرئيسية
 {const {ctx,p}=await mk(br,{viewport:{width:390,height:844},hasTouch:true,isMobile:true});await fire(p);await p.waitForTimeout(200);
  const l=await p.evaluate(()=>{const b=document.getElementById('hmInstallBtn').getBoundingClientRect();return {x:b.left>=0&&b.right<=innerWidth,sw:document.documentElement.scrollWidth<=innerWidth}});
  ok(l.x&&l.sw,'الزر داخل الشاشة بلا تمرير أفقي على ٣٩٠px',JSON.stringify(l));await p.screenshot({path:'/tmp/pwa_home.png',fullPage:true});await ctx.close()}
 await br.close();console.log('pwa tests:',pass,'pass',fail,'fail');process.exit(fail?1:0)})();
