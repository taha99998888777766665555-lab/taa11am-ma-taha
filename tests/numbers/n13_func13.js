/* الرقم ١٣ (المرحلة ١: الأنشطة ١–٥): PORT=#### node tests/numbers/n13_func13.js */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const PORT=process.env.PORT;let pass=0,fail=0;const iss=[];const ok=(c,m,d)=>{if(c)pass++;else{fail++;iss.push(m+' '+(d===undefined?'':JSON.stringify(d)))}};
const VP={p320:{width:320,height:640,isMobile:true},p360:{width:360,height:740,isMobile:true},p390:{width:390,height:844,isMobile:true},board:{width:1920,height:1080}};
(async()=>{const br=await chromium.launch();
for(const [vn,vp] of Object.entries(VP)){
 const ctx=await br.newContext({viewport:{width:vp.width,height:vp.height},hasTouch:true,isMobile:!!vp.isMobile,deviceScaleFactor:1});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 const cdp=await ctx.newCDPSession(p);
 const touchDrag=async pts=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pts[0]]});for(const q of pts.slice(1))await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[q]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(2500);
 await p.evaluate(()=>{localStorage.removeItem('taha_aj_progress_v1');localStorage.setItem('taha_app_stars','0');ajReloadProgressFromStorage();startAJNumber(13)});await p.waitForTimeout(400);
 const goto=async i=>{await p.evaluate(i=>{ajGame.actIndex=i;renderAJActivity()},i);await p.waitForTimeout(450)};
 const solved=()=>p.evaluate(()=>!!ajGame.current.solved);
 const msg=()=>p.evaluate(()=>document.getElementById('ajMessage').textContent);
 const T=async sel=>{const l=p.locator(sel).first();await l.scrollIntoViewIfNeeded();await p.waitForTimeout(150);await l.tap({timeout:5000})};
 const tag=(i,n)=>`${vn} #${i} ${n}`;
 const noOverflow=async(i)=>{const r=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,vw:innerWidth}));ok(r.sw<=r.vw+1,tag(i,'لا تمرير أفقي'),r)};
 const plan=await p.evaluate(()=>ajGame.plan.flat.map(x=>x.type));
 ok(JSON.stringify(plan.slice(0,5))==='["frameColor","balloonsFind","connectPictures","tenHowManyCircle","frameBuilder"]'&&plan.length===11,vn+' الخطة ١١ نشاطًا',plan);
 ok(await p.evaluate(()=>document.getElementById('ajPlay').classList.contains('aj-n13')),vn+' aj-n13');
 // ١) تلوين
 await goto(0);await noOverflow(1);
 const r=await p.evaluate(()=>{const b=document.querySelector('.aj-cv-paint').getBoundingClientRect();return{x:b.left,y:b.top,w:b.width,h:b.height}});
 await p.evaluate(()=>document.querySelector('.aj-cv-paint').scrollIntoView({block:'center'}));await p.waitForTimeout(700);
 const r2=await p.evaluate(()=>{const b=document.querySelector('.aj-cv-paint').getBoundingClientRect();return{x:b.left,y:b.top,w:b.width,h:b.height}});
 let flip=false;for(let y=r2.y+r2.h*0.08;y<r2.y+r2.h*0.95;y+=10){const pts=[];for(let k=0;k<=24;k++){pts.push({x:r2.x+r2.w*(0.1+0.8*(flip?1-k/24:k/24)),y});}flip=!flip;await touchDrag(pts);}
 const n=await p.locator('.aj-obj-btn').count();ok(n===13,tag(1,'١٣ دائرة'),n);
 for(let k=0;k<n;k++){await p.locator('.aj-obj-btn').nth(k).scrollIntoViewIfNeeded();await p.locator('.aj-obj-btn').nth(k).tap();}
 await p.waitForTimeout(300);ok(await solved(),tag(1,'يكتمل'),await msg());
 // ٢) بالونات
 await goto(1);await noOverflow(2);
 let cells=await p.evaluate(()=>[...document.querySelectorAll('.aj-find .aj-cell')].map(c=>c.textContent.trim()));
 ok(cells.length===8&&cells.filter(t=>t==='١٣').length===4,tag(2,'٨ بالونات ٤ منها ١٣'),cells);
 ok(JSON.stringify([...new Set(cells.filter(t=>t!=='١٣'))].sort())===JSON.stringify(['١٠','١٢','١٤','٣١']),tag(2,'المشتتات ١٠ ١٢ ١٤ ٣١'),cells);
 ok(await p.locator('.aj-find-palette .aj-swatch').count()===6,tag(2,'لوحة ٦ ألوان'));
 ok(await p.evaluate(()=>[...document.querySelectorAll('.aj-find-palette .aj-swatch,.aj-find .aj-cell')].every(e=>{const b=e.getBoundingClientRect();return b.width>=40&&b.height>=44-4})),tag(2,'أهداف اللمس'));
 ok(await p.evaluate(()=>/١٣/.test(document.querySelector('.aj-find-ref')?.textContent||'')),tag(2,'الرقم المرجعي ١٣'));
 for(let k=0;k<3;k++){const idx=cells.findIndex(t=>t!=='١٣');await T(`.aj-find .aj-cell >> nth=${idx}`);await p.waitForTimeout(120);}
 ok(/تلميح.*١٣.*١.*٣/.test(await msg()),tag(2,'تلميح نصي'),await msg());
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-hint,.aj-marked').length===0),tag(2,'لا كشف ولا وسم للخطأ'));
 let used=0;for(let k=0;k<8;k++){if(cells[k]!=='١٣')continue;await T(`.aj-find-palette .aj-swatch >> nth=${[2,4,5,0][used++]}`);await T(`.aj-find .aj-cell >> nth=${k}`);await p.waitForTimeout(100);}
 await p.waitForTimeout(300);ok(await solved(),tag(2,'يكتمل'));
 // ٣) توصيل
 await goto(2);await noOverflow(3);
 const ids=await p.evaluate(()=>[...document.querySelectorAll('.aj-conn-item')].map(e=>e.dataset.id));
 ok(ids.filter(x=>x[0]==='a').sort().join()==='a12,a13,a14',tag(3,'الصور ١٢ ١٣ ١٤'),ids);
 ok(await p.evaluate(()=>[...document.querySelectorAll('.aj-conn-item')].every(e=>{const b=e.getBoundingClientRect();return b.height>=44&&b.width>=44})),tag(3,'أهداف ≥٤٤'));
 await T('[data-id="a12"]');await T('[data-id="b13"]');await p.waitForTimeout(250);await T('[data-id="a13"]');await T('[data-id="b14"]');await p.waitForTimeout(800);
 ok(/تلميح/.test(await msg()),tag(3,'تلميح بعد خطأين'),await msg());ok(!(await solved()),tag(3,'الخطأ لا يكمل'));
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-hint').length===0),tag(3,'لا كشف'));
 // الترتيب الأول: صورة ثم عدد
 for(const v of [12]){await T(`[data-id="a${v}"]`);await T(`[data-id="b${v}"]`);await p.waitForTimeout(300);}
 // الترتيب الثاني: عدد ثم صورة
 await T('[data-id="b13"]');await T('[data-id="a13"]');await p.waitForTimeout(300);
 await T('[data-id="a14"]');await T('[data-id="b14"]');await p.waitForTimeout(400);
 ok(await solved(),tag(3,'يكتمل بالترتيبين'),await msg());
 // ٤) عشرة وكم؟
 await goto(3);await noOverflow(4);
 const groups=p.locator('.aj-group');
 ok(await groups.count()===2,tag(4,'مجموعتان'));
 for(let gi=0;gi<2;gi++){
  const m=gi===0?3:2;const E=d=>'٠١٢٣٤٥٦٧٨٩'[d];
  const g=groups.nth(gi);
  const st=await g.evaluate(e=>({tot:e.querySelector(':scope > .aj-opts:not(.aj-units-opts)').hidden,uo:[...e.querySelectorAll('.aj-units-opts .aj-opt-num')].map(x=>x.textContent.trim()).sort().join(','),q:e.querySelector('.aj-units-q').textContent}));
  ok(st.tot===true,tag(4,`م${gi+1}: المجموع مخفي قبل الآحاد`));
  ok(st.uo===(gi===0?'٢,٣,٤':'١,٢,٣'),tag(4,`م${gi+1}: خيارات الآحاد`),st);
  // محاولة لمس المجموع قبل الآحاد غير ممكنة
  ok(await g.locator(':scope > .aj-opts:not(.aj-units-opts) .aj-opt').first().isHidden(),tag(4,`م${gi+1}: أزرار المجموع غير ظاهرة`));
  const wrong1=gi===0?'٢':'١',wrong2=gi===0?'٤':'٣';
  await g.scrollIntoViewIfNeeded();
  await g.locator('.aj-units-opts .aj-opt',{hasText:new RegExp('^'+wrong1+'$')}).tap();await p.waitForTimeout(120);
  ok(!/تلميح/.test(await msg()),tag(4,`م${gi+1}: لا تلميح بعد خطأ واحد`));
  await g.locator('.aj-units-opts .aj-opt',{hasText:new RegExp('^'+wrong2+'$')}).tap();await p.waitForTimeout(150);
  ok(/تلميح/.test(await msg()),tag(4,`م${gi+1}: تلميح نصي بعد خطأين`),await msg());
  ok(await p.evaluate(()=>document.querySelectorAll('.aj-hint').length===0),tag(4,`م${gi+1}: لا كشف`));
  ok(await g.evaluate(e=>e.querySelector(':scope > .aj-opts:not(.aj-units-opts)').hidden),tag(4,`م${gi+1}: المجموع ما زال مخفيًا بعد الخطأ`));
  await g.locator('.aj-units-opts .aj-opt',{hasText:new RegExp('^'+E(m)+'$')}).tap();await p.waitForTimeout(200);
  ok(await g.evaluate(e=>!e.querySelector(':scope > .aj-opts:not(.aj-units-opts)').hidden),tag(4,`م${gi+1}: يظهر المجموع بعد الآحاد`));
  const tot=await g.evaluate(e=>[...e.querySelectorAll(':scope > .aj-opts:not(.aj-units-opts) .aj-opt-num')].map(x=>x.textContent.trim()).sort().join(','));
  ok(tot===(gi===0?'١٢,١٣,١٤':'١١,١٢,١٣'),tag(4,`م${gi+1}: خيارات المجموع`),tot);
  ok(!(await solved()),tag(4,`م${gi+1}: لا يكتمل بالآحاد وحدها`));
  const wt=gi===0?'١٢':'١١';
  await g.locator(':scope > .aj-opts:not(.aj-units-opts) .aj-opt',{hasText:new RegExp('^'+wt+'$')}).tap();await p.waitForTimeout(150);
  await g.locator(':scope > .aj-opts:not(.aj-units-opts) .aj-opt',{hasText:new RegExp('^'+(gi===0?'١٤':'١٣')+'$')}).tap();await p.waitForTimeout(150);
  ok(/تلميح/.test(await msg()),tag(4,`م${gi+1}: تلميح المجموع`),await msg());
  ok(!(await solved()),tag(4,`م${gi+1}: خطأ المجموع لا يكمل`));
  await g.locator(':scope > .aj-opts:not(.aj-units-opts) .aj-opt',{hasText:new RegExp('^'+(gi===0?'١٣':'١٢')+'$')}).tap();await p.waitForTimeout(250);
 }
 ok(await solved(),tag(4,'يكتمل بعد المجموعتين'));
 ok(await p.evaluate(()=>[...document.querySelectorAll('.aj-opt')].every(b=>b.offsetParent===null||(b.getBoundingClientRect().width>=44&&b.getBoundingClientRect().height>=44))),tag(4,'أهداف ≥٤٤'));
 await noOverflow(4);
 // ٥) كوّن العدد
 await goto(4);await noOverflow(5);
 ok(await p.evaluate(()=>document.querySelector('.aj-guided-row:nth-child(2)').hidden),tag(5,'المحاولة ٢ مخفية'));
 const cellSizes=()=>p.evaluate(()=>[...document.querySelectorAll('.aj-guided .aj-frame-cell-btn')].filter(b=>b.offsetParent!==null).map(b=>{const r=b.getBoundingClientRect();return[r.width,r.height]}));
 const cs=await cellSizes(); ok(cs.length===10,tag(5,'١٠ خلايا آحاد ظاهرة في المحاولة ١'),cs.length);
 const small=cs.filter(([w,h])=>w<44||h<44).length;ok(small===0,tag(5,'خلايا الإطار ≥٤٤'),{small,min:cs.map(c=>Math.round(c[0])).sort((a,b)=>a-b)[0]});
 const r1=p.locator('.aj-guided-row').nth(0).locator('.aj-frame-live .aj-frame-cell-btn');
 await r1.nth(0).scrollIntoViewIfNeeded();
 for(let k=0;k<2;k++)await r1.nth(k).tap();await p.waitForTimeout(150);
 ok(!(await p.evaluate(()=>document.querySelector('.aj-guided-row').classList.contains('aj-row-ok'))),tag(5,'دائرتان لا تكفيان'));
 await r1.nth(2).tap();await p.waitForTimeout(250);
 ok(await p.evaluate(()=>document.querySelector('.aj-guided-row').classList.contains('aj-row-ok')),tag(5,'ثلاث دوائر تنجح'));
 ok(/١٠ \+ ٣ = ١٣/.test(await p.evaluate(()=>document.querySelector('.aj-guided').textContent)),tag(5,'المعادلة ١٠ + ٣ = ١٣'));
 await p.waitForTimeout(1900);
 {const c2=await cellSizes();ok(c2.length>=20&&c2.every(([w,h])=>w>=44&&h>=44),tag(5,'خلايا المحاولتين ≥٤٤'),{n:c2.length,min:Math.round(Math.min(...c2.map(c=>c[0])))});}
 const A=p.locator('.aj-guided-row').nth(1).locator('.aj-frame-live').nth(0).locator('.aj-frame-cell-btn'),B=p.locator('.aj-guided-row').nth(1).locator('.aj-frame-live').nth(1).locator('.aj-frame-cell-btn');
 await B.nth(0).scrollIntoViewIfNeeded();for(let k=0;k<3;k++)await B.nth(k).tap();await p.waitForTimeout(150);ok(!(await solved()),tag(5,'٣ آحاد دون عشرة لا تكمل'));
 for(let k=0;k<10;k++){await A.nth(k).scrollIntoViewIfNeeded();await A.nth(k).tap();}
 await p.waitForTimeout(300);ok(await solved(),tag(5,'عشرة + ٣ تكمل'),await msg());
 await noOverflow(5);
 ok(errs.length===0,vn+' أخطاء JS',errs);
 await ctx.close();
}
await br.close();console.log(`pass ${pass} fail ${fail}`);iss.forEach(i=>console.log(' - '+i));process.exit(fail?1:0);})();
