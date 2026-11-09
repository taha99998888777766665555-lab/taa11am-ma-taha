/* الرقم ١٣: العمل دون إنترنت + حفظ التقدم والنجوم. PORT=#### */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const PORT=process.env.PORT;let pass=0,fail=0;const ok=(c,m,d)=>{if(c)pass++;else{fail++;console.log(' -',m,JSON.stringify(d))}};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(3500);await p.evaluate(()=>navigator.serviceWorker.ready.then(()=>1));await p.waitForTimeout(3000);
const ks=await p.evaluate(()=>caches.keys());ok(ks.join()==='taha-app-v67','كاش الإصدار الحالي فقط',ks);
await ctx.setOffline(true);await p.reload();await p.waitForTimeout(3000);
const r=await p.evaluate(async()=>{localStorage.removeItem('taha_aj_progress_v1');localStorage.setItem('taha_app_stars','0');ajReloadProgressFromStorage();startAJNumber(13);const out=[];for(let i=0;i<11;i++){ajGame.actIndex=i;renderAJActivity();await new Promise(r=>setTimeout(r,250));out.push(document.querySelectorAll('#ajStage *').length)}return out});
ok(r.every(x=>x>5),'الأنشطة ١–١١ تُرسم بلا اتصال',r);
// حل «عشرة وكم؟» بلا اتصال: نجمة واحدة وحفظ التقدم ولا تتكرر
await p.evaluate(()=>{ajGame.actIndex=3;renderAJActivity()});await p.waitForTimeout(300);
const g=p.locator('.aj-group');for(const [gi,u,t] of [[0,'٣','١٣'],[1,'٢','١٢']]){await g.nth(gi).locator('.aj-units-opts .aj-opt',{hasText:new RegExp('^'+u+'$')}).tap();await p.waitForTimeout(200);await g.nth(gi).locator(':scope > .aj-opts:not(.aj-units-opts) .aj-opt',{hasText:new RegExp('^'+t+'$')}).tap();await p.waitForTimeout(200);}await p.waitForTimeout(400);
const st=await p.evaluate(()=>({solved:!!ajGame.current.solved,done:JSON.parse(localStorage.getItem('taha_aj_progress_v1')).done,stars:+localStorage.getItem('taha_app_stars')}));
ok(st.solved&&st.done['13:3']===1&&st.stars===1,'حل نشاط بلا اتصال: حفظ التقدم ونجمة واحدة',st);
await p.reload();await p.waitForTimeout(3000);
const st2=await p.evaluate(()=>({done:JSON.parse(localStorage.getItem('taha_aj_progress_v1')).done,stars:+localStorage.getItem('taha_app_stars')}));
ok(st2.done['13:3']===1&&st2.stars===1,'بعد إعادة التحميل: التقدم والنجوم محفوظان دون تكرار',st2);
await p.evaluate(()=>{startAJNumber(13);ajGame.actIndex=3;renderAJActivity()});await p.waitForTimeout(300);
const g2=p.locator('.aj-group');for(const [gi,u,t] of [[0,'٣','١٣'],[1,'٢','١٢']]){await g2.nth(gi).locator('.aj-units-opts .aj-opt',{hasText:new RegExp('^'+u+'$')}).tap();await p.waitForTimeout(200);await g2.nth(gi).locator(':scope > .aj-opts:not(.aj-units-opts) .aj-opt',{hasText:new RegExp('^'+t+'$')}).tap();await p.waitForTimeout(200);}await p.waitForTimeout(400);
ok(await p.evaluate(()=>+localStorage.getItem('taha_app_stars'))===1,'إعادة حل نشاط منجز لا تضيف نجمة');
ok(errs.length===0,'بلا أخطاء JS',errs);await br.close();console.log(`off13 PASS ${pass} FAIL ${fail}`)})();
