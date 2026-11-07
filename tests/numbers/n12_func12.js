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
  await p.evaluate(s=>document.querySelector(s).scrollIntoView({block:'center'}),selCanvas);await p.waitForTimeout(700);const r=await p.evaluate(s=>{const b=document.querySelector(s).getBoundingClientRect();return{x:b.left,y:b.top,w:b.width,h:b.height}},selCanvas);
  let flip=false;for(let y=r.y+r.h*0.08;y<r.y+r.h*0.95;y+=rowStep){const pts=[];for(let k=0;k<=24;k++){const xx=r.x+r.w*(0.1+0.8*(flip?1-k/24:k/24));pts.push({x:xx,y});}flip=!flip;await touchDrag(pts);}};
 // ١) تلوين
 await goto(0);await scan('.aj-cv-paint',10);
 const n=await p.locator('.aj-obj-btn').count();for(let k=0;k<n;k++)await p.locator('.aj-obj-btn').nth(k).tap();
 await p.waitForTimeout(300);ok(await solved(),tag(1,'التلوين يكتمل بالرسم باللمس + لمس ١٢ دائرة'),{n,m:await msg()});ok(n===12,tag(1,'١٢ دائرة'),n);
 // ٢) البالونات — لوحة ألوان باختيار الطفل
 await goto(1);
 ok(await p.locator('.aj-find-palette .aj-swatch').count()===6,tag(2,'لوحة ألوان من ٦'));
 ok(await p.evaluate(()=>document.querySelector('.aj-find-palette .aj-swatch[aria-pressed="true"]')===document.querySelector('.aj-find-palette .aj-swatch')),tag(2,'الأحمر محدد افتراضيًا'));
 ok(await p.evaluate(()=>{const b=[...document.querySelectorAll('.aj-find-palette .aj-swatch')].map(x=>x.getBoundingClientRect());return b.every(r=>r.width>=40&&r.height>=40)}),tag(2,'أهداف لمس الألوان ≥٤٠px'));
 let cells=await p.evaluate(()=>[...document.querySelectorAll('.aj-find .aj-cell')].map(c=>c.textContent.trim()));
 ok(cells.length===8&&cells.filter(t=>t==='١٢').length===4&&['٢١','١١','١٣','١٠'].every(x=>cells.includes(x)),tag(2,'٨ بالونات: ٤ منها ١٢ والمشتتات ١٠ و١١ و١٣ و٢١'),cells);
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-find .aj-marked').length===0&&[...document.querySelectorAll('.aj-find .aj-cell')].every(c=>!c.style.getPropertyValue('--aj-mark'))),tag(2,'لا تلوين تلقائي عند العرض'));
 for(let k=0;k<3;k++){const idx=cells.findIndex(t=>t!=='١٢');await p.locator('.aj-find .aj-cell').nth(idx).tap();await p.waitForTimeout(120);}
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-hint').length===0),tag(2,'لا كشف تلقائي للإجابة بعد ٣ أخطاء'));
 ok(/تلميح/.test(await msg()),tag(2,'تلميح نصي هادئ'),await msg());
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-marked').length===0&&[...document.querySelectorAll('.aj-find .aj-cell')].every(c=>!c.style.getPropertyValue('--aj-mark'))),tag(2,'الخطأ لا يوسم ولا يلوَّن'));
 ok(await p.evaluate(()=>{const w=document.querySelector('.aj-cell-wrong');return !w||getComputedStyle(w).animationName==='none'}),tag(2,'بلا اهتزاز'));
 const hexes=await p.evaluate(()=>[...document.querySelectorAll('.aj-find-palette .aj-swatch')].map(b=>b.style.background));
 const want=[];let used=0;
 for(let k=0;k<8;k++){if(cells[k]!=='١٢')continue;const si=[2,4,5,0][used++];await p.locator('.aj-find-palette .aj-swatch').nth(si).tap();await p.locator('.aj-find .aj-cell').nth(k).tap();await p.waitForTimeout(100);want.push([k,si]);
  const got=await p.evaluate(k=>document.querySelectorAll('.aj-find .aj-cell')[k].style.getPropertyValue('--aj-mark'),k);const exp=await p.evaluate(i=>{const t=document.createElement('i');t.style.color=document.querySelectorAll('.aj-find-palette .aj-swatch')[i].style.background;document.body.appendChild(t);const c=getComputedStyle(t).color;t.remove();return c},si);
  const gotRgb=await p.evaluate(c=>{const t=document.createElement('i');t.style.color=c;document.body.appendChild(t);const r=getComputedStyle(t).color;t.remove();return r},got);
  ok(gotRgb===exp,tag(2,'البالون تلوّن بلون اختاره الطفل رقم '+si),{got:gotRgb,exp});}
 await p.waitForTimeout(250);ok(await solved(),tag(2,'يكتمل'));
 ok(await p.evaluate(()=>[...document.querySelectorAll('.aj-find .aj-cell')].filter(c=>!c.classList.contains('aj-marked')).every(c=>!c.style.getPropertyValue('--aj-mark'))),tag(2,'غير الصحيحة لم تُلوَّن'));
 // ٣) صِل الصورة بالعدد
 await goto(2);
 const ids=await p.evaluate(()=>[...document.querySelectorAll('.aj-conn-item')].map(e=>e.dataset.id));
 ok(ids.filter(x=>x[0]==='a').sort().join()==='a11,a12,a13'&&ids.filter(x=>x[0]==='b').sort().join()==='b11,b12,b13',tag(3,'الصور والأرقام ١١ و١٢ و١٣'),ids);
 const sz=await p.evaluate(()=>[...document.querySelectorAll('.aj-conn-item')].map(e=>{const b=e.getBoundingClientRect();return[Math.round(b.width),Math.round(b.height)]}));ok(sz.every(([w,h])=>w>=90&&h>=60),tag(3,'عناصر كبيرة قابلة للمس'),sz);
 const fr=await p.evaluate(()=>{const f=document.querySelector('.aj-conn-item .aj-frame');return f?Math.round(f.getBoundingClientRect().width):0});ok(fr>=(vn==='phone'?130:170),tag(3,'إطارات الكمية مكبّرة'),fr);
 await T('[data-id="a11"]');await T('[data-id="b12"]');await p.waitForTimeout(200);await T('[data-id="a12"]');await T('[data-id="b11"]');await p.waitForTimeout(800);
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-hint').length===0),tag(3,'لا كشف تلقائي بعد خطأين'));ok(/تلميح/.test(await msg()),tag(3,'تلميح نصي'),await msg());ok(!(await solved()),tag(3,'الخطأ لا يكمل'));
 for(const v of [11,12,13]){await T(`[data-id="a${v}"]`);await T(`[data-id="b${v}"]`);await p.waitForTimeout(300);}
 ok(await solved(),tag(3,'يكتمل'));
 // ٤) عشرة وكم؟
 await goto(3);
 const grp=await p.evaluate(()=>[...document.querySelectorAll('.aj-group')].map(g=>[...g.querySelectorAll('.aj-opt-num')].map(x=>x.textContent.trim()).sort().join(',')));
 ok(JSON.stringify(grp)===JSON.stringify(['١١,١٢,١٣','١٢,١٣,١٤']),tag(4,'خيارات قريبة ثابتة'),grp);
 const extras=await p.evaluate(()=>[...document.querySelectorAll('.aj-group')].map(g=>g.querySelectorAll('.aj-frame')[1]?g.querySelectorAll('.aj-frame')[1].querySelectorAll('.aj-counter,.aj-dot,.aj-circle,svg').length:-1));
 const grs=p.locator('.aj-group');
 for(let k=0;k<2;k++){await grs.nth(0).locator('.aj-opt',{hasText:/^١١$/}).tap();await p.waitForTimeout(150);}
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-hint').length===0),tag(4,'لا تظليل للإجابة'));ok(/تلميح/.test(await msg()),tag(4,'تلميح نصي'),await msg());
 ok(!(await solved()),tag(4,'الخطأ لا يكمل'));
 await grs.nth(0).locator('.aj-opt',{hasText:/^١٢$/}).tap();await p.waitForTimeout(200);await grs.nth(1).locator('.aj-opt',{hasText:/^١٣$/}).tap();await p.waitForTimeout(250);
 ok(await solved(),tag(4,'يكتمل'));
 // ٥) كوّن العدد بنفسك (عشرة + اثنان)
 await goto(4);
 ok(await p.evaluate(()=>document.querySelector('.aj-guided-row:nth-child(2)').hidden),tag(5,'المحاولة ٢ مخفية أولًا'));
 ok(await p.evaluate(()=>/اثنين/.test(document.querySelector('.aj-guided-title').textContent)),tag(5,'العنوان «أضف اثنين»'));
 const cellW=await p.evaluate(()=>Math.round(document.querySelector('.aj-guided-row .aj-frame-live .aj-frame-cell-btn').getBoundingClientRect().width));ok(cellW>=44,tag(5,'خانات الإطار قابلة للمس (≥٤٤px)'),cellW);
 const r1=p.locator('.aj-guided-row').nth(0).locator('.aj-frame-live .aj-frame-cell-btn');
 await r1.nth(0).scrollIntoViewIfNeeded();await r1.nth(3).tap();await p.waitForTimeout(250);
 ok(!(await p.evaluate(()=>document.querySelector('.aj-guided-row').classList.contains('aj-row-ok'))),tag(5,'دائرة واحدة لا تكمل المحاولة ١'));ok(/بقي ١/.test(await msg()),tag(5,'رسالة «بقي ١»'),await msg());
 await r1.nth(4).tap();await p.waitForTimeout(250);
 ok(await p.evaluate(()=>document.querySelector('.aj-guided-row').classList.contains('aj-row-ok')),tag(5,'دائرتان تكملان المحاولة ١'));
 ok(/١٠ \+ ٢ = ١٢/.test(await p.evaluate(()=>document.querySelector('.aj-guided').textContent)),tag(5,'تظهر المعادلة ١٠ + ٢ = ١٢ عند إكمال ١'));
 await p.waitForTimeout(1900);
 ok(await p.evaluate(()=>!document.querySelector('.aj-guided-row:nth-child(2)').hidden),tag(5,'تظهر المحاولة ٢ بعد التهنئة'));
 ok(await p.evaluate(()=>!/١٠ \+ ٢ = ١٢/.test(document.querySelector('.aj-guided').textContent)),tag(5,'المعادلة غير ظاهرة قبل إكمال المحاولة ٢'));
 const lab=await p.evaluate(()=>[...document.querySelectorAll('.aj-guided-row:nth-child(2) .aj-guided-label')].map(x=>x.textContent.trim()));ok(lab.length===2&&/عشرة/.test(lab[0])&&/آحاد/.test(lab[1]),tag(5,'عنوانا العشرة والآحاد ثابتان'),lab);
 ok(!(await solved()),tag(5,'النشاط لا يكتمل بالأولى فقط'));
 const A=p.locator('.aj-guided-row').nth(1).locator('.aj-frame-live').nth(0).locator('.aj-frame-cell-btn'),B=p.locator('.aj-guided-row').nth(1).locator('.aj-frame-live').nth(1).locator('.aj-frame-cell-btn');
 await B.nth(0).scrollIntoViewIfNeeded();await B.nth(0).tap();await B.nth(1).tap();await p.waitForTimeout(150);ok(!(await solved()),tag(5,'اثنان في الآحاد دون عشرة لا يكمل'));
 await B.nth(2).tap();await p.waitForTimeout(150);ok(!(await solved())&&/دائرتين/.test(await msg()),tag(5,'ثلاثة في الآحاد: رسالة هادئة بلا اكتمال'),await msg());await B.nth(2).tap();
 for(let k=0;k<10;k++){await A.nth(k).scrollIntoViewIfNeeded();await A.nth(k).tap();}
 await p.waitForTimeout(300);ok(await solved(),tag(5,'عشرة + اثنان يكتمل'),await msg());ok(/١٠ \+ ٢ = ١٢/.test(await p.evaluate(()=>document.querySelector('.aj-guided').textContent)),tag(5,'تظهر المعادلة بعد الإكمال'));
 const west=await p.evaluate(()=>{const bad=[];document.querySelectorAll('#ajPlay *').forEach(e=>{if(e.children.length===0&&/[0-9]/.test(e.textContent))bad.push(e.textContent.slice(0,20))});return bad});ok(west.length===0,tag(5,'أرقام عربية هندية فقط'),west);
 if(errs.length)ok(false,vn+' أخطاء صفحة',errs);await ctx.close();}
await br.close();console.log('PASS',pass,'FAIL',fail);iss.forEach(x=>console.log(' -',x));process.exit(fail?1:0)})();
