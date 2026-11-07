/* «عُدّ واكتب» للرقمين ١١ و١٢: لا قص ولا تمرير أفقي ولا تداخل، والتفاحة ≥٤٤×٤٤، وعدّ باللمس (٣٢٠–٤١٢ والسبورة). PORT=#### */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const PORT=process.env.PORT;let pass=0,fail=0;const iss=[];const ok=(c,m,d)=>{if(c)pass++;else{fail++;iss.push(m+' '+(d===undefined?'':JSON.stringify(d)))}};
const E=d=>String(d).replace(/\d/g,x=>'٠١٢٣٤٥٦٧٨٩'[x]);
(async()=>{const br=await chromium.launch();
for(const [w,h,m] of [[320,568,1],[340,640,1],[360,640,1],[390,844,1],[412,915,1],[1920,1080,0]]){
 const ctx=await br.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:!!m,serviceWorkers:'block'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript(()=>{localStorage.setItem('taha_child_name','ط')});await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(1800);
 for(const [n,idx] of [[11,7],[12,9]]){
  const tg=`${w}px #${n}`;
  await p.evaluate(()=>{localStorage.removeItem('taha_aj_progress_v1');ajReloadProgressFromStorage()});
  await p.evaluate(([n,i])=>{startAJNumber(n);ajGame.actIndex=i;renderAJActivity()},[n,idx]);await p.waitForTimeout(500);
  ok(await p.evaluate(()=>ajGame.current.type)==='countWrite',tg+' نوع النشاط');
  const g=await p.evaluate(()=>{const o=[...document.querySelectorAll('.aj-countable .aj-object')].map(e=>{const r=e.getBoundingClientRect();return{l:r.left,r:r.right,t:r.top,b:r.bottom,w:r.width,h:r.height}});
   let overlap=false;for(let i=0;i<o.length;i++)for(let j=i+1;j<o.length;j++){const a=o[i],b=o[j];if(a.l<b.r-0.5&&b.l<a.r-0.5&&a.t<b.b-0.5&&b.t<a.b-0.5)overlap=true}
   const hid=[...document.querySelectorAll('#ajStage *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left<-0.5||r.right>innerWidth+0.5)}).map(e=>e.className.toString().slice(0,25));
   return{n:o.length,minL:Math.min(...o.map(x=>x.l)),maxR:Math.max(...o.map(x=>x.r)),minW:Math.min(...o.map(x=>x.w)),minH:Math.min(...o.map(x=>x.h)),overlap,sw:document.documentElement.scrollWidth,vw:innerWidth,hid:[...new Set(hid)]}});
  ok(g.n===n,tg+' عدد التفاح',g.n);ok(g.minL>=0&&g.maxR<=g.vw,tg+' الصف داخل حافتي الشاشة',g);ok(g.minW>=44&&g.minH>=44,tg+' التفاحة ≥٤٤×٤٤',g);ok(!g.overlap,tg+' بلا تداخل');ok(g.sw<=g.vw,tg+' بلا تمرير أفقي',g);ok(g.hid.length===0,tg+' لا عناصر خارج الشاشة',g.hid);
  // عدّ باللمس الحقيقي
  const cnt=p.locator('.aj-countable .aj-object');const K=d=>p.locator('.aj-key',{hasText:new RegExp('^'+E(d)+'$')}).first();
  await K(1).scrollIntoViewIfNeeded();await K(1).tap();await K(n===11?1:2).tap();await p.waitForTimeout(300);
  ok(!(await p.evaluate(()=>!!ajGame.current.solved))&&/المس كل/.test(await p.evaluate(()=>document.getElementById('ajMessage').textContent)),tg+' لا تُقبل الكتابة قبل لمس كل التفاحات');await p.waitForTimeout(1000);
  const order=[...Array(n).keys()].sort(()=>Math.random()-.5);
  for(const k of order.concat([order[0],order[1],order[2]])){await cnt.nth(k).scrollIntoViewIfNeeded();await cnt.nth(k).tap();}
  const mx=await p.evaluate(()=>({counted:document.querySelectorAll('.aj-countable .aj-counted').length,max:Math.max(...[...document.querySelectorAll('.aj-count-badge')].map(b=>+b.textContent.trim().split('').map(c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).join('')))}));
  ok(mx.counted===n&&mx.max===n,tg+' كل التفاحات معدودة ولا عدّ مزدوج (لمس ٣ تفاحات مرتين)',mx);
  await K(1).scrollIntoViewIfNeeded();await K(1).tap();await K(n===11?1:2).tap();await p.waitForTimeout(300);
  ok(await p.evaluate(()=>!!ajGame.current.solved),tg+' الكتابة الصحيحة بعد العدّ تكمل');
 }
 ok(errs.length===0,`${w}px بلا أخطاء JS`,errs);await ctx.close();}
await br.close();console.log(`PASS ${pass} FAIL ${fail}`);iss.forEach(x=>console.log(' -',x));process.exit(fail?1:0)})();
