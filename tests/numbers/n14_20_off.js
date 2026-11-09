/* الأرقام ١٤–٢٠ دون اتصال — PORT=#### */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const PORT=process.env.PORT;let pass=0,fail=0;const ok=(c,m,d)=>{if(c)pass++;else{fail++;console.log(' -',m,JSON.stringify(d))}};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(3500);await p.evaluate(()=>navigator.serviceWorker.ready.then(()=>1));await p.waitForTimeout(3000);
const ks=await p.evaluate(()=>caches.keys());ok(ks.join()==='taha-app-v67','كاش v67 فقط',ks);
await ctx.setOffline(true);await p.reload();await p.waitForTimeout(3000);
const r=await p.evaluate(async()=>{localStorage.removeItem('taha_aj_progress_v1');localStorage.setItem('taha_app_stars','0');stars=0;ajReloadProgressFromStorage();const out={};for(let n=14;n<=20;n++){startAJNumber(n);out[n]=[];for(let i=0;i<11;i++){ajGame.actIndex=i;renderAJActivity();await new Promise(r=>setTimeout(r,200));out[n].push(document.querySelectorAll('#ajStage *').length)}}return out});
ok(Object.values(r).every(a=>a.length===11&&a.every(x=>x>5)),'كل أنشطة ١٤–٢٠ تُرسم بلا اتصال',r);
await p.evaluate(()=>{startAJNumber(17);ajGame.actIndex=8;renderAJActivity()});await p.waitForTimeout(300);
const io=await p.evaluate(()=>ajGame.current.spec.groups[0].options.findIndex(o=>o.correct));await p.locator('.aj-opt').nth(io).tap();await p.waitForTimeout(500);
const st=await p.evaluate(()=>({solved:!!ajGame.current.solved,done:JSON.parse(localStorage.getItem('taha_aj_progress_v1')).done,stars:+localStorage.getItem('taha_app_stars')}));
ok(st.solved&&st.done['17:8']===1&&st.stars===1,'حل بلا اتصال: حفظ ونجمة واحدة',st);
await p.reload();await p.waitForTimeout(3000);
const st2=await p.evaluate(()=>({done:JSON.parse(localStorage.getItem('taha_aj_progress_v1')).done,stars:+localStorage.getItem('taha_app_stars')}));
ok(st2.done['17:8']===1&&st2.stars===1,'بعد إعادة التحميل محفوظ بلا تكرار',st2);
await p.evaluate(()=>{startAJNumber(17);ajGame.actIndex=8;renderAJActivity()});await p.waitForTimeout(300);
const io2=await p.evaluate(()=>ajGame.current.spec.groups[0].options.findIndex(o=>o.correct));await p.locator('.aj-opt').nth(io2).tap();await p.waitForTimeout(400);
ok(await p.evaluate(()=>+localStorage.getItem('taha_app_stars'))===1,'إعادة الحل لا تضيف نجمة');
ok(errs.length===0,'بلا أخطاء JS',errs);await br.close();console.log(`off14-20 PASS ${pass} FAIL ${fail}`)})();
