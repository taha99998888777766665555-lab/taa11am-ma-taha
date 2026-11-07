/* الرقم ١٢: PORT=#### node tests/numbers/n12_func12.js — يتطلب خادمًا محليًا لمجلد المشروع */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const PORT=process.env.PORT;let pass=0,fail=0;const iss=[];const ok=(c,m,d)=>{if(c)pass++;else{fail++;iss.push(m+' '+(d===undefined?'':JSON.stringify(d)))}};
const E=d=>String(d).replace(/\d/g,x=>'٠١٢٣٤٥٦٧٨٩'[x]);
const VP={phone:{width:390,height:844,isMobile:true},board:{width:1920,height:1080}};
(async()=>{const br=await chromium.launch();
for(const [vn,vp] of Object.entries(VP)){
 const ctx=await br.newContext({viewport:{width:vp.width,height:vp.height},hasTouch:true,isMobile:!!vp.isMobile,deviceScaleFactor:vn==='phone'?2:1});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 const cdp=await ctx.newCDPSession(p);
 const touchDrag=async pts=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pts[0]]});for(const q of pts.slice(1))await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[q]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(2500);
 await p.evaluate(()=>{localStorage.removeItem('taha_aj_progress_v1');localStorage.setItem('taha_app_stars','0');ajReloadProgressFromStorage();startAJNumber(12)});await p.waitForTimeout(400);
 const stars=()=>p.evaluate(()=>+localStorage.getItem('taha_app_stars'));
 const goto=async i=>{await p.evaluate(i=>{ajGame.actIndex=i;renderAJActivity()},i);await p.waitForTimeout(450)};
 const solved=()=>p.evaluate(()=>!!ajGame.current.solved);
 const msg=()=>p.evaluate(()=>document.getElementById('ajMessage').textContent);
 const T=async sel=>{const l=p.locator(sel).first();await l.scrollIntoViewIfNeeded();await l.tap({timeout:5000})};
 const tag=(i,n)=>`${vn} #${i} ${n}`;
 // الخطة
 const plan=await p.evaluate(()=>ajGame.plan.flat.map(x=>x.type));
 ok(JSON.stringify(plan)===JSON.stringify(["frameColor","balloonsFind","connectPictures","tenHowManyCircle","frameBuilder","numberLine","beforeAfter","maze","crossOutCard","countWrite","traceTwo"]),vn+' ترتيب الأنشطة الـ١١',plan);
 const scan=async (selCanvas,rowStep=14)=>{ // يمسح مركز اللوحة باللمس
  const r=await p.evaluate(s=>{const c=document.querySelector(s);c.scrollIntoView({block:'center'});const b=c.getBoundingClientRect();return{x:b.left,y:b.top,w:b.width,h:b.height}},selCanvas);
  let flip=false;for(let y=r.y+r.h*0.08;y<r.y+r.h*0.95;y+=rowStep){const pts=[];for(let k=0;k<=24;k++){const xx=r.x+r.w*(0.1+0.8*(flip?1-k/24:k/24));pts.push({x:xx,y});}flip=!flip;await touchDrag(pts);}};
 // ١) تلوين
 await goto(0);await scan('.aj-cv-paint',10);
 const n=await p.locator('.aj-obj-btn').count();for(let k=0;k<n;k++)await p.locator('.aj-obj-btn').nth(k).tap();
 await p.waitForTimeout(300);ok(await solved(),tag(1,'التلوين يكتمل بالرسم باللمس + لمس ١٢ دائرة'),{n,m:await msg()});ok(n===12,tag(1,'١٢ دائرة'),n);
 // ٢) البالونات
 await goto(1);
 let cells=await p.evaluate(()=>[...document.querySelectorAll('.aj-find .aj-cell')].map(c=>c.textContent.trim()));
 ok(cells.length===8&&cells.filter(t=>t==='١٢').length===4&&cells.includes('٢١')&&cells.includes('١١')&&cells.includes('١٣')&&cells.includes('١٠'),tag(2,'٨ بالونات: ٤ منها ١٢ والمشتتات ١٠ و١١ و١٣ و٢١'),cells);
 for(let k=0;k<3;k++){const idx=cells.findIndex(t=>t!=='١٢');await p.locator('.aj-find .aj-cell').nth(idx).tap();await p.waitForTimeout(120);}
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-hint').length===0),tag(2,'لا كشف تلقائي للإجابة بعد ٣ أخطاء'));
 ok(/تلميح/.test(await msg()),tag(2,'تلميح نصي هادئ'),await msg());
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-marked').length===0),tag(2,'الخطأ لا يوسم'));
 ok(await p.evaluate(()=>{const w=document.querySelector('.aj-cell-wrong');return !w||getComputedStyle(w).animationName==='none'}),tag(2,'بلا اهتزاز'));
 for(let k=0;k<8;k++){if(cells[k]==='١٢')await p.locator('.aj-find .aj-cell').nth(k).tap();}
 await p.waitForTimeout(250);ok(await solved(),tag(2,'يكتمل'));

 if(errs.length)ok(false,vn+' أخطاء صفحة',errs);await ctx.close();}
await br.close();console.log('PASS',pass,'FAIL',fail);iss.forEach(x=>console.log(' -',x));process.exit(fail?1:0)})();
