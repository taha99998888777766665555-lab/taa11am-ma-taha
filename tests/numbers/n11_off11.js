/* الرقم ١١: العمل دون إنترنت. PORT=#### */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const PORT=process.env.PORT;let pass=0,fail=0;const ok=(c,m,d)=>{if(c)pass++;else{fail++;console.log(' -',m,JSON.stringify(d))}};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(3500);await p.evaluate(()=>navigator.serviceWorker.ready.then(()=>1));await p.waitForTimeout(3000);
const ks=await p.evaluate(()=>caches.keys());ok(ks.join()==='taha-app-v66','الكاش v62 فقط',ks);
await ctx.setOffline(true);await p.reload();await p.waitForTimeout(3000);
const r=await p.evaluate(async()=>{localStorage.removeItem('taha_aj_progress_v1');ajReloadProgressFromStorage();startAJNumber(11);const out=[];for(let i=0;i<9;i++){ajGame.actIndex=i;renderAJActivity();await new Promise(r=>setTimeout(r,250));out.push(document.getElementById('ajStage').children.length)}return{out,font:document.fonts.check('900 40px "AJ Zero"',"٠")}});
ok(r.out.every(x=>x>0),'الأنشطة التسعة تُرسم بلا اتصال',r);
await p.evaluate(()=>{ajGame.actIndex=6;renderAJActivity()});await p.locator('.aj-lineg-opt').nth(1).tap();await p.waitForTimeout(300);
ok(await p.evaluate(()=>ajGame.current.solved&&!!JSON.parse(localStorage.getItem('taha_aj_progress_v1')).done['11:6']),'حل نشاط بلا اتصال وحفظه');
ok(errs.length===0,'بلا أخطاء JS',errs);await br.close();console.log(`off11 PASS ${pass} FAIL ${fail}`)})();
