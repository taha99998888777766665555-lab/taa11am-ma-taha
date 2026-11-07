/* الرقم ١١ (المرحلة ٣): PORT=#### node tests/numbers/n11_func11.js — يتطلب خادمًا محليًا لمجلد المشروع */
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
 await p.evaluate(()=>{localStorage.removeItem('taha_aj_progress_v1');localStorage.setItem('taha_app_stars','0');ajReloadProgressFromStorage();startAJNumber(11)});await p.waitForTimeout(400);
 const stars=()=>p.evaluate(()=>+localStorage.getItem('taha_app_stars'));
 const goto=async i=>{await p.evaluate(i=>{ajGame.actIndex=i;renderAJActivity()},i);await p.waitForTimeout(450)};
 const solved=()=>p.evaluate(()=>!!ajGame.current.solved);
 const msg=()=>p.evaluate(()=>document.getElementById('ajMessage').textContent);
 const T=async sel=>{const l=p.locator(sel).first();await l.scrollIntoViewIfNeeded();await l.tap({timeout:5000})};
 const tag=(i,n)=>`${vn} #${i} ${n}`;
 // الخطة
 const plan=await p.evaluate(()=>ajGame.plan.flat.map(x=>x.type));
 ok(JSON.stringify(plan)===JSON.stringify(["frameColor","balloonsFind","colorReveal","connectPictures","tenHowManyCircle","frameBuilder","numberLine","countWrite","traceTwo"]),vn+' ترتيب الأنشطة التسعة',plan);
 const scan=async (selCanvas,rowStep=14)=>{ // يمسح مركز اللوحة باللمس
  await p.evaluate(s=>document.querySelector(s).scrollIntoView({block:'center'}),selCanvas);await p.waitForTimeout(700);const r=await p.evaluate(s=>{const b=document.querySelector(s).getBoundingClientRect();return{x:b.left,y:b.top,w:b.width,h:b.height}},selCanvas);
  let flip=false;for(let y=r.y+r.h*0.08;y<r.y+r.h*0.95;y+=rowStep){const pts=[];for(let k=0;k<=24;k++){const xx=r.x+r.w*(0.1+0.8*(flip?1-k/24:k/24));pts.push({x:xx,y});}flip=!flip;await touchDrag(pts);}};
 // ١) تلوين
 await goto(0);await scan('.aj-cv-paint',10);
 const n=await p.locator('.aj-obj-btn').count();for(let k=0;k<n;k++)await p.locator('.aj-obj-btn').nth(k).tap();
 await p.waitForTimeout(300);ok(await solved(),tag(1,'التلوين يكتمل بالرسم باللمس + لمس ١١ دائرة'),{n,m:await msg()});ok(n===11,tag(1,'١١ دائرة'),n);
 // ٢) البالونات
 await goto(1);
 let cells=await p.evaluate(()=>[...document.querySelectorAll('.aj-find .aj-cell')].map(c=>c.textContent.trim()));
 ok(cells.length===8&&cells.filter(t=>t==='١١').length===4,tag(2,'٨ بالونات، ٤ منها ١١'),cells);
 for(let k=0;k<3;k++){const idx=cells.findIndex(t=>t!=='١١');await p.locator('.aj-find .aj-cell').nth(idx).tap();await p.waitForTimeout(120);}
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-hint').length===0),tag(2,'لا كشف تلقائي للإجابة بعد ٣ أخطاء'));
 ok(/تلميح/.test(await msg()),tag(2,'تلميح نصي هادئ'),await msg());
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-marked').length===0),tag(2,'الخطأ لا يوسم'));
 ok(await p.evaluate(()=>{const w=document.querySelector('.aj-cell-wrong');return !w||getComputedStyle(w).animationName==='none'}),tag(2,'بلا اهتزاز'));
 for(let k=0;k<8;k++){if(cells[k]==='١١')await p.locator('.aj-find .aj-cell').nth(k).tap();}
 await p.waitForTimeout(250);ok(await solved(),tag(2,'يكتمل'));
 // ٣) الشبكة
 await goto(2);
 const g=await p.evaluate(()=>{const cs=[...document.querySelectorAll('.aj-find .aj-cell')];const W=innerWidth;return{n:cs.length,t:cs.filter(c=>c.textContent.trim()==='١١').length,small:cs.filter(c=>{const b=c.getBoundingClientRect();return b.width<44||b.height<44}).length,out:cs.filter(c=>{const b=c.getBoundingClientRect();return b.left<-1||b.right>W+1}).length,texts:[...new Set(cs.map(c=>c.textContent.trim()))].sort().join(','),cols:getComputedStyle(document.querySelector('.aj-find-grid')).gridTemplateColumns.split(' ').length}});
 ok(g.n===30&&g.cols===6,tag(3,'شبكة ٦×٥'),g);ok(g.t===18,tag(3,'١٨ خانة مطلوبة تطابق شكل البيت'),g.t);ok(g.small===0&&g.out===0,tag(3,'كل الخانات قابلة للمس وغير مقصوصة'),g);ok(g.texts==='١٠,١١,١٢,١٣',tag(3,'المشتتات ١٠ و١٢ و١٣ فقط'),g.texts);
 cells=await p.evaluate(()=>[...document.querySelectorAll('.aj-find .aj-cell')].map(c=>c.textContent.trim()));
 for(let k=0;k<3;k++){const idx=cells.findIndex(t=>t!=='١١');await p.locator('.aj-find .aj-cell').nth(idx).tap();await p.waitForTimeout(120);}
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-hint').length===0),tag(3,'لا كشف تلقائي'));
 for(let k=0;k<30;k++){if(cells[k]==='١١')await p.locator('.aj-find .aj-cell').nth(k).tap();}
 await p.waitForTimeout(300);ok(await solved(),tag(3,'يكتمل وتظهر الصورة'));ok(await p.evaluate(()=>!!document.querySelector('.aj-revealed')),tag(3,'ظهرت الصورة'));
 // ٤) التوصيل
 await goto(3);
 const ids=await p.evaluate(()=>[...document.querySelectorAll('.aj-conn-item')].map(e=>e.dataset.id));
 ok(ids.filter(x=>x[0]==='a').sort().join()==='a11,a12,a13',tag(4,'الصور ١١ و١٢ و١٣'),ids);
 await T('[data-id="a11"]');await T('[data-id="b12"]');await p.waitForTimeout(200);await T('[data-id="a12"]');await T('[data-id="b11"]');await p.waitForTimeout(800);
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-hint').length===0),tag(4,'لا كشف تلقائي بعد خطأين'));ok(/تلميح/.test(await msg()),tag(4,'تلميح نصي'),await msg());ok(!(await solved()),tag(4,'الخطأ لا يكمل'));
 for(const v of [11,12,13]){await T(`[data-id="a${v}"]`);await T(`[data-id="b${v}"]`);await p.waitForTimeout(300);}
 ok(await solved(),tag(4,'يكتمل'));
 // ٥) عشرة وكم
 await goto(4);
 const grp=await p.evaluate(()=>[...document.querySelectorAll('.aj-group')].map(g=>[...g.querySelectorAll('.aj-opt-num')].map(x=>x.textContent.trim()).sort().join(',')));
 ok(JSON.stringify(grp)===JSON.stringify(['١٠,١١,١٢','١١,١٢,١٣']),tag(5,'خيارات قريبة ثابتة'),grp);
 const grs=p.locator('.aj-group');
 for(let k=0;k<2;k++){await grs.nth(0).locator('.aj-opt',{hasText:'١٠'}).tap();await p.waitForTimeout(150);}
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-hint').length===0),tag(5,'لا تظليل للإجابة'));ok(/تلميح/.test(await msg()),tag(5,'تلميح نصي'),await msg());
 await grs.nth(0).locator('.aj-opt',{hasText:/^١١$/}).tap();await p.waitForTimeout(200);await grs.nth(1).locator('.aj-opt',{hasText:/^١٢$/}).tap();await p.waitForTimeout(250);
 ok(await solved(),tag(5,'يكتمل'));
 // ٦) كوّن العدد
 await goto(5);
 ok(await p.evaluate(()=>document.querySelector('.aj-guided-row:nth-child(2)').hidden),tag(6,'المحاولة ٢ مخفية أولًا'));
 const r1=p.locator('.aj-guided-row').nth(0).locator('.aj-frame-live .aj-frame-cell-btn');
 await r1.nth(0).scrollIntoViewIfNeeded();await r1.nth(3).tap();await p.waitForTimeout(250);
 ok(await p.evaluate(()=>document.querySelector('.aj-guided-row').classList.contains('aj-row-ok')),tag(6,'المحاولة ١ تنجح'));
 await p.waitForTimeout(1900);
 ok(await p.evaluate(()=>!document.querySelector('.aj-guided-row:nth-child(2)').hidden),tag(6,'تظهر المحاولة ٢ بعد التهنئة'));
 const lab=await p.evaluate(()=>[...document.querySelectorAll('.aj-guided-row:nth-child(2) .aj-guided-label')].map(x=>x.textContent.trim()));ok(lab.length===2&&/عشرة/.test(lab[0])&&/آحاد/.test(lab[1]),tag(6,'عنوانا العشرة والآحاد ثابتان بنفس الترتيب'),lab);
 ok(await p.evaluate(()=>!/١٠ \+ ١ = ١١/.test(document.querySelector('.aj-guided').textContent)),tag(6,'المعادلة غير ظاهرة قبل إكمال المحاولة ٢'));
 ok(!(await solved()),tag(6,'النشاط لا يكتمل بالأولى فقط'));
 const A=p.locator('.aj-guided-row').nth(1).locator('.aj-frame-live').nth(0).locator('.aj-frame-cell-btn'),B=p.locator('.aj-guided-row').nth(1).locator('.aj-frame-live').nth(1).locator('.aj-frame-cell-btn');
 await B.nth(0).scrollIntoViewIfNeeded();await B.nth(0).tap();await p.waitForTimeout(150);ok(!(await solved()),tag(6,'واحد في الآحاد دون عشرة لا يكمل'));
 for(let k=0;k<10;k++){await A.nth(k).scrollIntoViewIfNeeded();await A.nth(k).tap();}
 await p.waitForTimeout(300);ok(await solved(),tag(6,'عشرة + واحد يكتمل'),await msg());ok(/١٠ \+ ١ = ١١/.test(await p.evaluate(()=>document.querySelector('.aj-guided').textContent)),tag(6,'تظهر المعادلة ١٠ + ١ = ١١'));
 // ٧) خط الأعداد
 await goto(6);
 const L=await p.evaluate(()=>[...document.querySelectorAll('.aj-lineg-opt')].map(b=>{const r=b.getBoundingClientRect();return{t:b.querySelector('.aj-opt-num').textContent,x:r.left+r.width/2,w:r.width,h:r.height}}));
 ok(L.map(o=>o.t).join()==='١٠,١١,١٢,١٣,١٤,١٥',tag(7,'١٠ إلى ١٥'),L.map(o=>o.t));
 ok(L.every((o,i)=>i===0||o.x<L[i-1].x),tag(7,'تصاعد من اليمين إلى اليسار'));ok(L.every(o=>o.w>=50&&o.h>=60),tag(7,'أهداف لمس كافية'),L.map(o=>Math.round(o.w)));
 const rail=await p.evaluate(()=>{const l=document.querySelector('.aj-lineg-line').getBoundingClientRect();return{l:l.left,r:l.right,vw:innerWidth,bb:getComputedStyle(document.querySelector('.aj-lineg-line')).borderBottomWidth}});ok(rail.l>=0&&rail.r<=rail.vw&&rail.bb==='8px',tag(7,'الخط متصل داخل الشاشة'),rail);
 const LN=p.locator('.aj-lineg-opt');
 await LN.nth(3).tap();await LN.nth(4).tap();await p.waitForTimeout(250);
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-hint').length===0&&!document.querySelector('.aj-lineg-hit')),tag(7,'لا كشف تلقائي'));ok(await p.evaluate(()=>document.querySelector('.aj-lineg-start')!==null),tag(7,'يُشار إلى نقطة البداية ١٠ فقط'));ok(/تلميح/.test(await msg()),tag(7,'تلميح نصي'),await msg());
 await LN.nth(1).tap();await p.waitForTimeout(250);ok(await solved(),tag(7,'يكتمل'));
 const nb=await p.evaluate(()=>[...document.querySelectorAll('.aj-lineg-cap')].map(c=>c.textContent).join('|')+'#'+document.querySelector('.aj-lineg-rel').textContent.replace(/\s+/g,' '));ok(/قبله/.test(nb)&&/بعده/.test(nb)&&/١٠ ثم ١١ ثم ١٢/.test(nb),tag(7,'إبراز علاقة ١١ بجاريه'),nb);
 // ٨) عُدّ واكتب
 await goto(7);
 ok(await p.locator('.aj-countable .aj-object').count()===11,tag(8,'١١ تفاحة'));
 const cnt=p.locator('.aj-countable .aj-object');
 const K0=d=>p.locator('.aj-key',{hasText:new RegExp('^'+E(d)+'$')}).first();
 await K0(1).scrollIntoViewIfNeeded();await K0(1).tap();await K0(1).tap();await p.waitForTimeout(300);
 ok(!(await solved())&&/المس كل/.test(await msg()),tag(8,'لا تُقبل الإجابة قبل عدّ كل التفاحات'),await msg());await p.waitForTimeout(1000);
 for(const k of [10,3,7,0,5,1,9,2,8,4,6,6,10,0]){await cnt.nth(k).scrollIntoViewIfNeeded();await cnt.nth(k).tap();}
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-countable .aj-counted').length===11),tag(8,'١١ مَعدودة بأي ترتيب'));
 const maxBadge=await p.evaluate(()=>Math.max(...[...document.querySelectorAll('.aj-count-badge')].map(b=>b.textContent.trim()).map(t=>'٠١٢٣٤٥٦٧٨٩'.split('').reduce((a,c,i)=>a.split(c).join(i),t)*1)));ok(maxBadge===11,tag(8,'لا عدّ مزدوج'),maxBadge);
  const K=d=>p.locator('.aj-key',{hasText:new RegExp('^'+E(d)+'$')}).first();
 await K(1).scrollIntoViewIfNeeded();await K(1).tap();await K(2).tap();await p.waitForTimeout(250);
 ok(!(await solved())&&/عُدّ/.test(await msg()),tag(8,'١٢ خطأ هادئ'),await msg());await p.waitForTimeout(800);
 await K(1).tap();await K(1).tap();await p.waitForTimeout(250);ok(await solved(),tag(8,'كتابة ١١ تكمل'));
 const keys=await p.evaluate(()=>[...document.querySelectorAll('.aj-key')].map(k=>k.textContent.trim()).join(''));ok(!/[0-9]/.test(keys),tag(8,'لوحة أرقام شرقية'),keys);
 // ٩) التتبع
 await goto(8);
 for(let s=0;s<3;s++){await p.evaluate(()=>{document.getElementById('ajMessage').textContent=''});
  const info=await p.evaluate(()=>{const g=document.querySelector('.aj-cv-guide'),i=document.querySelector('.aj-cv-ink');i.scrollIntoView({block:'center'});const r=i.getBoundingClientRect();return{w:g.width,h:g.height,r:{x:r.left,y:r.top,w:r.width,h:r.height}}});
  if(s===0)var runs=await p.evaluate(()=>{const g=document.querySelector('.aj-cv-guide');const W=g.width,H=g.height;const d=g.getContext('2d').getImageData(0,0,W,H).data;const out=[];for(let y=0;y<H;y+=6){let st=-1;for(let x=0;x<=W;x++){const a=x<W?d[(y*W+x)*4+3]:0;if(a>20&&st<0)st=x;if(a<=20&&st>=0){out.push([y,st,x-1]);st=-1}}}return out});
  const sx=info.r.w/info.w,sy=info.r.h/info.h;let flip=false;
  for(const [y,a,b] of runs.concat(runs)){const rr=await p.evaluate(()=>{const b=document.querySelector('.aj-cv-ink').getBoundingClientRect();return{x:b.left,y:b.top}});const x0=flip?b:a,x1=flip?a:b;flip=!flip;const pts=[];const st=Math.max(2,Math.round(Math.abs(x1-x0)/14));for(let k=0;k<=st;k++)pts.push({x:rr.x+(x0+(x1-x0)*k/st)*sx,y:rr.y+y*sy});await touchDrag(pts);
   if(await p.evaluate(()=>/✓ ممتاز|🎉/.test(document.getElementById('ajMessage').textContent)))break;}
  await p.waitForTimeout(s<2?1500:400);}
 ok(await solved(),tag(9,'التتبع بثلاث مراحل باللمس يكتمل'),await msg());
 ok(await stars()===9,tag('*','٩ نجوم (نجمة لكل نشاط)'),await stars());
 const cl=await p.evaluate(()=>{ajFinishNumber();return localStorage.getItem('taha_app_stars')});ok(+cl===12,vn+' هدية ٣ نجوم عند الإتمام',cl);
 const prog=await p.evaluate(()=>JSON.parse(localStorage.getItem('taha_aj_progress_v1')));ok(Object.keys(prog.done).filter(k=>k.startsWith('11:')).length===9&&prog.bonus[11]===1,vn+' التقدم محفوظ',prog);
 // لا أقفال
 ok(await p.evaluate(()=>{for(let i=0;i<9;i++){ajGame.actIndex=i;renderAJActivity()}return true}),vn+' التنقل الحر بين الأنشطة');
 const west=await p.evaluate(()=>{startAJNumber(11);let bad=[];for(let i=0;i<9;i++){ajGame.actIndex=i;renderAJActivity();if(/[0-9]/.test(document.getElementById('ajPlay').innerText))bad.push(i+1)}return bad});ok(west.length===0,vn+' أرقام عربية هندية فقط في كل الأنشطة',west);
 ok(errs.length===0,vn+' بلا أخطاء JS',errs.join('|'));await ctx.close();}
await br.close();console.log(`PASS ${pass} FAIL ${fail}`);iss.forEach(x=>console.log(' -',x));})();
