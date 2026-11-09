/* الأرقام ١٤–٢٠: كل الأنشطة الـ١١ بلمس حقيقي + استكشاف المواصفات — PORT=#### [NUMS=14,15] [VPS=p320,board] node tests/numbers/n14_20_func.js */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const PORT=process.env.PORT;let pass=0,fail=0;const iss=[];const ok=(c,m,d)=>{if(c)pass++;else{fail++;iss.push(m+' '+(d===undefined?'':JSON.stringify(d)))}};
const E=d=>String(d).replace(/\d/g,x=>'٠١٢٣٤٥٦٧٨٩'[x]);
const ALL={p320:{width:320,height:640,isMobile:true},p390:{width:390,height:844,isMobile:true},board:{width:1920,height:1080}};
const VPS=(process.env.VPS||'p320,p390,board').split(',');const NUMS=(process.env.NUMS||'14,15,16,17,18,19,20').split(',').map(Number);
(async()=>{const br=await chromium.launch();
for(const vn of VPS){const vp=ALL[vn];
 const ctx=await br.newContext({viewport:{width:vp.width,height:vp.height},hasTouch:true,isMobile:!!vp.isMobile});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 const cdp=await ctx.newCDPSession(p);
 const touchDrag=async pts=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pts[0]]});for(const q of pts.slice(1))await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[q]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(2500);
 const solved=()=>p.evaluate(()=>!!ajGame.current.solved);
 const msg=()=>p.evaluate(()=>document.getElementById('ajMessage').textContent);
 const T=async sel=>{const l=p.locator(sel).first();await l.scrollIntoViewIfNeeded();await p.waitForTimeout(120);await l.tap({timeout:5000})};
 const noHint=()=>p.evaluate(()=>document.querySelectorAll('.aj-hint').length===0);
 for(const N of NUMS){
  await p.evaluate(N=>{localStorage.removeItem('taha_aj_progress_v1');localStorage.setItem('taha_app_stars','0');ajReloadProgressFromStorage();stars=0;startAJNumber(N)},N);await p.waitForTimeout(400);
  const goto=async i=>{await p.evaluate(i=>{ajGame.actIndex=i;renderAJActivity()},i);await p.waitForTimeout(450)};
  const tag=(i,n)=>`${vn} n${N} #${i} ${n}`;
  const noOv=async i=>{const r=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,vw:innerWidth}));ok(r.sw<=r.vw+1,tag(i,'لا تمرير أفقي'),r)};
  const plan=await p.evaluate(()=>ajGame.plan.flat.map(x=>x.type));
  ok(plan.length===11&&plan.slice(0,5).join()==='frameColor,balloonsFind,connectPictures,tenHowManyCircle,frameBuilder',tag('*','الخطة'),plan);
  // ١
  await goto(0);await noOv(1);
  await p.evaluate(()=>document.querySelector('.aj-cv-paint').scrollIntoView({block:'center',behavior:'instant'}));await p.waitForTimeout(700);
  {const r2=await p.evaluate(()=>{const b=document.querySelector('.aj-cv-paint').getBoundingClientRect();return{x:b.left,y:b.top,w:b.width,h:b.height}});let flip=false;for(let y=r2.y+r2.h*0.08;y<r2.y+r2.h*0.95;y+=10){const pts=[];for(let k=0;k<=24;k++)pts.push({x:r2.x+r2.w*(0.1+0.8*(flip?1-k/24:k/24)),y});flip=!flip;await touchDrag(pts);}}
  const n1=await p.locator('.aj-obj-btn').count();ok(n1===N,tag(1,'عدد الدوائر'),n1);
  for(let k=0;k<n1;k++){await p.locator('.aj-obj-btn').nth(k).scrollIntoViewIfNeeded();await p.locator('.aj-obj-btn').nth(k).tap();}
  await p.waitForTimeout(300);ok(await solved(),tag(1,'يكتمل'),await msg());
  // ٢
  await goto(1);await noOv(2);
  const cells=await p.evaluate(()=>[...document.querySelectorAll('.aj-find .aj-cell')].map(c=>c.textContent.trim()));
  const tgt=cells.filter(t=>t===E(N)).length;ok(cells.length>=8&&tgt>=3,tag(2,'بالونات الهدف'),cells);
  const wrongIdx=cells.findIndex(t=>t!==E(N));
  for(let k=0;k<3;k++){await T(`.aj-find .aj-cell >> nth=${wrongIdx}`);await p.waitForTimeout(120);}
  ok(/تلميح/.test(await msg())&&!/[0-9]/.test(await msg()),tag(2,'تلميح نصي'),await msg());
  ok(await p.evaluate(()=>document.querySelectorAll('.aj-hint,.aj-marked').length===0),tag(2,'لا كشف'));
  const nsw=await p.locator('.aj-find-palette .aj-swatch').count();let u=0;
  for(let k=0;k<cells.length;k++){if(cells[k]!==E(N))continue;await T(`.aj-find-palette .aj-swatch >> nth=${u++%nsw}`);await T(`.aj-find .aj-cell >> nth=${k}`);await p.waitForTimeout(100);}
  await p.waitForTimeout(300);ok(await solved(),tag(2,'يكتمل'),await msg());
  // ٣
  await goto(2);await noOv(3);
  const vals=await p.evaluate(()=>[...document.querySelectorAll('.aj-conn-item')].filter(e=>e.dataset.id[0]==='a').map(e=>+e.dataset.id.slice(1)));
  ok(vals.length===3&&vals.includes(N),tag(3,'ثلاث صور تشمل الهدف'),vals);
  const bad=vals.find(v=>v!==vals[0]);
  await T(`[data-id="a${vals[0]}"]`);await T(`[data-id="b${bad}"]`);await p.waitForTimeout(250);await T(`[data-id="a${bad}"]`);await T(`[data-id="b${vals[0]}"]`);await p.waitForTimeout(700);
  ok(!(await solved()),tag(3,'الخطأ لا يكمل'));ok(await noHint(),tag(3,'لا كشف'));
  vals.forEach(()=>0);
  await T(`[data-id="a${vals[0]}"]`);await T(`[data-id="b${vals[0]}"]`);await p.waitForTimeout(300);
  await T(`[data-id="b${vals[1]}"]`);await T(`[data-id="a${vals[1]}"]`);await p.waitForTimeout(300);
  await T(`[data-id="a${vals[2]}"]`);await T(`[data-id="b${vals[2]}"]`);await p.waitForTimeout(400);
  ok(await solved(),tag(3,'يكتمل'),await msg());
  // ٤
  await goto(3);await noOv(4);
  const spec4=await p.evaluate(()=>ajGame.current.spec.groups.map(g=>({steps:(g.steps||(g.units?[g.units]:[])).length})));
  const plan4=N===20?[{steps:[2,0],tot:20,wrongStep:[1,3],wrongTot:[19,10]},{steps:[9],tot:19,wrongStep:[8,7],wrongTot:[18,20]}]:[{steps:[N-10],tot:N,wrongStep:null,wrongTot:null},{steps:[N-11],tot:N-1,wrongStep:null,wrongTot:null}];
  ok(spec4.length===2&&spec4[0].steps===plan4[0].steps.length&&spec4[1].steps===1,tag(4,'مجموعتان بخطواتها'),spec4);
  const groups=p.locator('.aj-group');
  for(let gi=0;gi<2;gi++){const g=groups.nth(gi),pl=plan4[gi];await g.scrollIntoViewIfNeeded();
   ok(await g.evaluate(e=>e.querySelector(':scope > .aj-opts:not(.aj-units-opts)').hidden),tag(4,`م${gi+1}: المجموع مخفي أولًا`));
   for(let si=0;si<pl.steps.length;si++){
    const st=g.locator('.aj-units-step').nth(si);
    ok(await st.isVisible(),tag(4,`م${gi+1} خطوة${si+1} ظاهرة بعد السابقة`));
    const texts=await st.locator('.aj-opt .aj-opt-num').allTextContents();
    ok(texts.includes(E(pl.steps[si]))&&texts.length===3&&new Set(texts).size===3,tag(4,`م${gi+1} خطوة${si+1}: خيارات`),texts);
    const wr=texts.filter(t=>t!==E(pl.steps[si]));
    await st.locator('.aj-opt',{hasText:new RegExp('^'+wr[0]+'$')}).tap();await p.waitForTimeout(120);
    ok(!/تلميح/.test(await msg()),tag(4,`م${gi+1} خطوة${si+1}: لا تلميح بعد خطأ`));
    await st.locator('.aj-opt',{hasText:new RegExp('^'+wr[1]+'$')}).tap();await p.waitForTimeout(150);
    ok(/تلميح/.test(await msg())&&!/[0-9]/.test(await msg()),tag(4,`م${gi+1} خطوة${si+1}: تلميح نصي بعد خطأين`),await msg());ok(await noHint(),tag(4,`م${gi+1}: لا كشف`));
    ok(await g.evaluate(e=>e.querySelector(':scope > .aj-opts:not(.aj-units-opts)').hidden),tag(4,`م${gi+1}: المجموع مخفي بعد الخطأ`));
    await st.locator('.aj-opt',{hasText:new RegExp('^'+E(pl.steps[si])+'$')}).tap();await p.waitForTimeout(220);
   }
   ok(await g.evaluate(e=>!e.querySelector(':scope > .aj-opts:not(.aj-units-opts)').hidden),tag(4,`م${gi+1}: يظهر المجموع بعد الخطوات`));
   const tot=g.locator(':scope > .aj-opts:not(.aj-units-opts) .aj-opt');const tt=await tot.locator('.aj-opt-num').allTextContents();
   ok(tt.includes(E(pl.tot))&&tt.length===3&&new Set(tt).size===3&&tt.every(t=>+t.split('').map(c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).join('')<=20),tag(4,`م${gi+1}: خيارات المجموع`),tt);
   ok(!(await solved()),tag(4,`م${gi+1}: لا يكتمل بالخطوات وحدها`));
   const wt=tt.find(t=>t!==E(pl.tot));await tot.filter({hasText:new RegExp('^'+wt+'$')}).first().tap();await p.waitForTimeout(150);
   await tot.filter({hasText:new RegExp('^'+E(pl.tot)+'$')}).first().tap();await p.waitForTimeout(250);
  }
  ok(await solved(),tag(4,'يكتمل'),await msg());
  ok(await p.evaluate(()=>[...document.querySelectorAll('.aj-opt')].every(b=>b.offsetParent===null||(b.getBoundingClientRect().width>=44&&b.getBoundingClientRect().height>=44))),tag(4,'أهداف ≥٤٤'));
  await noOv(4);
  // ٥
  await goto(4);await noOv(5);
  const U=N-10;
  const r1=p.locator('.aj-guided-row').nth(0).locator('.aj-frame-live .aj-frame-cell-btn');
  const vis=await p.evaluate(()=>[...document.querySelectorAll('.aj-guided .aj-frame-cell-btn')].filter(b=>b.offsetParent!==null).map(b=>{const r=b.getBoundingClientRect();return[r.width,r.height]}));
  ok(vis.length>=1&&vis.every(([w,h])=>w>=44&&h>=44),tag(5,'خلايا ≥٤٤'),{n:vis.length,min:Math.min(...vis.map(v=>v[0]))});
  await r1.nth(0).scrollIntoViewIfNeeded();
  for(let k=0;k<U-1;k++)await r1.nth(k).tap();await p.waitForTimeout(150);
  ok(!(await p.evaluate(()=>document.querySelector('.aj-guided-row').classList.contains('aj-row-ok'))),tag(5,'ناقص واحدة لا يكفي'));
  await r1.nth(U-1).tap();await p.waitForTimeout(250);
  ok(await p.evaluate(()=>document.querySelector('.aj-guided-row').classList.contains('aj-row-ok')),tag(5,'العدد المطلوب ينجح'));
  const eq=await p.evaluate(()=>document.querySelector('.aj-guided').textContent.replace(/\s+/g,' '));
  ok(eq.includes(`١٠ + ${E(U)} = ${E(N)}`),tag(5,'المعادلة'),eq.slice(0,200));
  await p.waitForTimeout(1900);
  const row2=p.locator('.aj-guided-row').nth(1);
  const A=row2.locator('.aj-frame-live').nth(0).locator('.aj-frame-cell-btn'),B=row2.locator('.aj-frame-live').nth(1).locator('.aj-frame-cell-btn');
  const c2=await p.evaluate(()=>[...document.querySelectorAll('.aj-guided .aj-frame-cell-btn')].filter(b=>b.offsetParent!==null).map(b=>{const r=b.getBoundingClientRect();return[r.width,r.height]}));
  ok(c2.every(([w,h])=>w>=44&&h>=44),tag(5,'خلايا المحاولتين ≥٤٤'),Math.min(...c2.map(c=>c[0])));
  await B.nth(0).scrollIntoViewIfNeeded();for(let k=0;k<U;k++)await B.nth(k).tap();await p.waitForTimeout(150);ok(!(await solved()),tag(5,'آحاد دون عشرة لا تكمل'));
  for(let k=0;k<10;k++){await A.nth(k).scrollIntoViewIfNeeded();await A.nth(k).tap();}
  await p.waitForTimeout(300);ok(await solved(),tag(5,'عشرة + آحاد تكمل'),await msg());await noOv(5);
  // ٦
  await goto(5);
  const L=await p.evaluate(()=>[...document.querySelectorAll('.aj-lineg-opt')].map(b=>{const r=b.getBoundingClientRect();return{t:b.querySelector('.aj-opt-num').textContent.trim(),x:r.left+r.width/2,w:r.width,h:r.height}}));
  const toN=s=>+s.split('').map(c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).join('');const ln=L.map(o=>toN(o.t));
  ok(L.length===6&&ln.every((v,i)=>i===0||v===ln[i-1]+1)&&ln.includes(N),tag(6,'٦ أعداد متتالية تشمل الهدف'),ln);
  ok(L.every((o,i)=>i===0||o.x<L[i-1].x)&&L.every(o=>o.w>=44&&o.h>=60),tag(6,'اتجاه وأهداف'),L.map(o=>Math.round(o.w)));
  ok(await p.evaluate(()=>document.querySelector('.aj-lineg-stim .aj-bignum').textContent.trim())===E(N),tag(6,'المطلوب'));
  await noOv(6);
  const LN=p.locator('.aj-lineg-opt');const ti=ln.indexOf(N);const w1=(ti+1)%6===ti?(ti+2)%6:(ti+1)%6;const w2=ln.findIndex((v,i)=>i!==ti&&i!==w1);
  await LN.nth(w1).tap();await LN.nth(w2).tap();await p.waitForTimeout(250);
  ok(await p.evaluate(()=>document.querySelectorAll('.aj-hint').length===0&&!document.querySelector('.aj-lineg-hit')),tag(6,'لا كشف تلقائي'));
  ok(/تلميح/.test(await msg())&&!/[0-9]/.test(await msg()),tag(6,'تلميح نصي'),await msg());
  ok(await p.evaluate(s=>{const e=document.querySelectorAll('.aj-lineg-start');return e.length===1&&e[0].querySelector('.aj-opt-num').textContent.trim()===s},E(ln[0])),tag(6,'يُشار إلى بداية النافذة فقط'));
  ok(!(await solved()),tag(6,'الخطأ لا يكمل'));
  await LN.nth(ti).tap();await p.waitForTimeout(250);ok(await solved(),tag(6,'يكتمل'));
  // ٧
  await goto(6);await noOv(7);
  const rows=await p.evaluate(()=>[...document.querySelectorAll('.aj-seq-row')].map(r=>[...r.children].map(c=>c.classList.contains('aj-blank')?'_':c.textContent.trim())));
  const exp=N===20?[['_','٢٠'],['_','١٩','_']]:null;
  if(N===20)ok(rows.length===2&&rows[0].join()==='_,٢٠'&&rows[1].join()==='_,١٩,_',tag(7,'صفا ٢٠'),rows);
  else ok(rows.length===2&&rows[0].join()===`_,${E(N)},_`&&rows[1].join()===`_,${E(N-1)},_`,tag(7,'صفّان'),rows);
  const KK=d=>p.locator('.aj-key',{hasText:new RegExp('^'+E(d)+'$')}).first();
  const typeNum=async s=>{for(const ch of String(s)){const k=KK(ch);await k.scrollIntoViewIfNeeded();await k.tap();}};
  await typeNum('99');await p.waitForTimeout(1000);await typeNum('98');await p.waitForTimeout(250);
  ok(await noHint(),tag(7,'لا إضاءة'));ok(/تلميح/.test(await msg())&&!/[0-9]/.test(await msg()),tag(7,'تلميح نصي'),await msg());
  await p.waitForTimeout(800);
  const ans=await p.evaluate(()=>{const T=s=>+s.split('').map(ch=>'٠١٢٣٤٥٦٧٨٩'.indexOf(ch)).join('');return[...document.querySelectorAll('.aj-seq-row')].map(r=>{const ch=[...r.children];const fi=ch.findIndex(c=>!c.classList.contains('aj-blank'));const t=T(ch[fi].textContent.trim());return ch.map((c,i)=>c.classList.contains('aj-blank')?(i<fi?t-1:t+1):null).filter(x=>x!==null)})});
  for(const row of ans)for(const a of row){await typeNum(a);await p.waitForTimeout(400);}
  await p.waitForTimeout(300);ok(await solved(),tag(7,'يكتمل'),{ans,m:await msg()});
  // ٨
  const design=await p.evaluate(N=>{const bad=[];const seen=new Set();for(let t=0;t<150;t++){const sp=ajBuildMaze(N);seen.add(JSON.stringify(sp.path));const P=sp.path.map(x=>x.join(','));const set=new Set(P);
   if(sp.path.length!==13)bad.push('len');
   const tg=sp.cells.filter(c=>c.value===N).map(c=>c.r+','+c.c);if(tg.length!==13||tg.some(k=>!set.has(k)))bad.push('target-outside');
   if(sp.cells.some(c=>c.path&&c.value!==N))bad.push('path-value');
   const nbs=(r,c)=>[[r+1,c],[r-1,c],[r,c+1],[r,c-1]].map(x=>x.join(','));
   sp.path.forEach((pp,i)=>{const adj=nbs(pp[0],pp[1]).filter(k=>set.has(k));if(adj.length!==((i===0||i===12)?1:2))bad.push('shortcut');});
   for(let i=1;i<sp.path.length;i++)if(Math.abs(sp.path[i][0]-sp.path[i-1][0])+Math.abs(sp.path[i][1]-sp.path[i-1][1])!==1)bad.push('step');
   if(sp.cells.some(c=>c.value<0||c.value>99))bad.push('range');
  }return{bad:[...new Set(bad)],variants:seen.size,sample:ajBuildMaze(N).cells.filter(c=>!c.path).map(c=>c.value).slice(0,12)}},N);
  ok(design.bad.length===0,tag(8,'تصميم المتاهة'),design);ok(design.variants>=3,tag(8,'عدة تصاميم'),design.variants);
  await goto(7);
  const mz=await p.evaluate(()=>({sp:ajGame.current.spec,cells:[...document.querySelectorAll('.aj-maze-cell')].map(b=>{const r=b.getBoundingClientRect();return{r:+b.dataset.r,c:+b.dataset.c,w:r.width,h:r.height,l:r.left,rt:r.right}}),vw:innerWidth,txt:document.querySelector('.aj-maze').innerText}));
  ok(mz.cells.length===30&&mz.cells.every(c=>c.w>=(vn==='board'?60:44)&&c.h>=(vn==='board'?60:44)&&c.l>=0&&c.rt<=mz.vw),tag(8,'خانات قابلة للمس داخل الشاشة'),Math.min(...mz.cells.map(c=>c.w)));
  const cs=(r,c)=>`.aj-maze-cell[data-r="${r}"][data-c="${c}"]`;const path=mz.sp.path,onP=new Set(path.map(x=>x.join(',')));
  const s0=path[0];const wa=[[s0[0]+1,s0[1]],[s0[0],s0[1]-1],[s0[0],s0[1]+1],[s0[0]-1,s0[1]]].find(x=>!onP.has(x.join(','))&&x[0]>=0&&x[0]<5&&x[1]>=0&&x[1]<6);
  if(wa){for(let k=0;k<3;k++){await T(cs(...wa));await p.waitForTimeout(150);}
   ok(await noHint()&&/تلميح/.test(await msg())&&!/[0-9]/.test(await msg()),tag(8,'تلميح نصي بلا إضاءة'),await msg());
   ok(await p.evaluate(()=>document.querySelectorAll('.aj-maze-visited').length===1),tag(8,'الخطأ لا يتقدم'));}
  for(let i=1;i<=4;i++){await T(cs(...path[i]));await p.waitForTimeout(110);}
  await p.evaluate(()=>document.querySelector('.aj-maze-grid').scrollIntoView({block:'center',behavior:'instant'}));await p.waitForTimeout(700);
  const ctr=await p.evaluate(()=>Object.fromEntries([...document.querySelectorAll('.aj-maze-cell')].map(b=>{const r=b.getBoundingClientRect();return[b.dataset.r+','+b.dataset.c,{x:r.left+r.width/2,y:r.top+r.height/2}]})));
  const dp=[];for(let i=4;i<path.length;i++){const a=ctr[path[i-1].join(',')],b=ctr[path[i].join(',')];for(let k=(i===4?0:1);k<=6;k++)dp.push({x:a.x+(b.x-a.x)*k/6,y:a.y+(b.y-a.y)*k/6});}
  await touchDrag(dp);await p.waitForTimeout(350);ok(await solved(),tag(8,'السحب على المسار يوصل'),await msg());
  // ٩
  const co=await p.evaluate(N=>{const bad=[];const wr=new Set();for(let t=0;t<200;t++){const sp=ajBuildCrossOutCard(N);const o=sp.groups[0].options;
   if(o.length!==4)bad.push('len');const good=o.filter(x=>!x.correct),odd=o.filter(x=>x.correct);
   if(odd.length!==1)bad.push('odd');if(good.some(x=>x.rep.value!==N))bad.push('good≠N');if(odd[0].rep.value===N)bad.push('odd=N');
   if(good.map(x=>x.rep.type).sort().join()!=='base10,frame,numeral')bad.push('types');wr.add(odd[0].rep.value);
   if(o.some(x=>x.aria!=='بطاقة'))bad.push('aria');}return{bad:[...new Set(bad)],wr:[...wr].sort((a,b)=>a-b)}},N);
  ok(co.bad.length===0,tag(9,'تصميم الشطب'),co);
  await goto(8);ok(await p.locator('.aj-opt').count()===4,tag(9,'أربع بطاقات'));
  const ig=await p.evaluate(()=>ajGame.current.spec.groups[0].options.map((o,i)=>o.correct?-1:i).filter(i=>i>=0));const io=await p.evaluate(()=>ajGame.current.spec.groups[0].options.findIndex(o=>o.correct));
  await p.locator('.aj-opt').nth(ig[0]).tap();await p.locator('.aj-opt').nth(ig[1]).tap();await p.waitForTimeout(250);
  ok(await noHint()&&!(await solved())&&/تلميح/.test(await msg()),tag(9,'خطأ هادئ'));
  await p.locator('.aj-opt').nth(io).tap();await p.waitForTimeout(250);ok(await solved(),tag(9,'يكتمل'));await noOv(9);
  // ١٠
  await goto(9);const cnt=p.locator('.aj-countable .aj-object');
  ok(await cnt.count()===N,tag(10,'عدد التفاحات'),await cnt.count());
  ok(await p.evaluate(()=>[...document.querySelectorAll('.aj-countable .aj-object')].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})),tag(10,'التفاح داخل الشاشة'));
  const K0=d=>p.locator('.aj-key',{hasText:new RegExp('^'+E(d)+'$')}).first();
  const typeK=async s=>{for(const ch of String(s)){await K0(ch).scrollIntoViewIfNeeded();await K0(ch).tap();}};
  await typeK(N);await p.waitForTimeout(300);ok(!(await solved())&&/المس كل/.test(await msg()),tag(10,'لا قبول قبل العدّ'),await msg());await p.waitForTimeout(1000);
  const order=[...Array(N).keys()].reverse();
  for(const k of order){await cnt.nth(k).scrollIntoViewIfNeeded();await cnt.nth(k).tap();}
  ok(await p.evaluate(()=>document.querySelectorAll('.aj-countable .aj-counted').length)===N,tag(10,'كلها معدودة'));
  const mb=await p.evaluate(()=>Math.max(...[...document.querySelectorAll('.aj-count-badge')].map(b=>+b.textContent.trim().split('').map(c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).join(''))));ok(mb===N,tag(10,'لا عدّ مزدوج'),mb);
  await typeK(N-1);await p.waitForTimeout(250);ok(!(await solved())&&/عُدّ/.test(await msg()),tag(10,'عدد خاطئ هادئ'),await msg());await p.waitForTimeout(900);
  await typeK(N);await p.waitForTimeout(250);ok(await solved(),tag(10,'الصحيح يكمل'),await msg());await noOv(10);
  // ١١
  await goto(10);
  for(let s=0;s<3;s++){await p.evaluate(()=>{document.getElementById('ajMessage').textContent=''});
   const info=await p.evaluate(()=>{const g=document.querySelector('.aj-cv-guide'),i=document.querySelector('.aj-cv-ink');i.scrollIntoView({block:'center',behavior:'instant'});const r=i.getBoundingClientRect();return{w:g.width,h:g.height,r:{x:r.left,y:r.top,w:r.width,h:r.height}}});
   if(s===0)var runs=await p.evaluate(()=>{const g=document.querySelector('.aj-cv-guide');const W=g.width,H=g.height;const d=g.getContext('2d').getImageData(0,0,W,H).data;const out=[];for(let y=0;y<H;y+=6){let st=-1;for(let x=0;x<=W;x++){const a=x<W?d[(y*W+x)*4+3]:0;if(a>20&&st<0)st=x;if(a<=20&&st>=0){out.push([y,st,x-1]);st=-1}}}return out});
   const sx=info.r.w/info.w,sy=info.r.h/info.h;let flip=false;
   for(const [y,a,b] of runs.concat(runs)){const rr=await p.evaluate(()=>{const b=document.querySelector('.aj-cv-ink').getBoundingClientRect();return{x:b.left,y:b.top}});const x0=flip?b:a,x1=flip?a:b;flip=!flip;const pts=[];const st=Math.max(2,Math.round(Math.abs(x1-x0)/14));for(let k=0;k<=st;k++)pts.push({x:rr.x+(x0+(x1-x0)*k/st)*sx,y:rr.y+y*sy});await touchDrag(pts);
    if(await p.evaluate(()=>/✓ ممتاز|🎉/.test(document.getElementById('ajMessage').textContent)))break;}
   await p.waitForTimeout(s<2?1500:400);}
  ok(await solved(),tag(11,'التتبع يكتمل'),await msg());
  // نجوم: ١١ نشاطًا + مكافأة ٣ = ١٤ مرة واحدة
  await p.waitForTimeout(800);
  const sA=await p.evaluate(()=>+localStorage.getItem('taha_app_stars'));ok(sA===11,tag('*','١١ نجمة للأنشطة'),sA);
  await p.evaluate(()=>ajAdvance());await p.waitForTimeout(500);const s1=await p.evaluate(()=>+localStorage.getItem('taha_app_stars'));ok(s1===14,tag('*','+٣ مكافأة عند الإنهاء'),s1);
  await p.evaluate(()=>{ajGame.actIndex=10;ajAdvance()});await p.waitForTimeout(400);const s2=await p.evaluate(()=>+localStorage.getItem('taha_app_stars'));ok(s2===14,tag('*','لا مكافأة مكررة'),s2);
 }
 ok(errs.length===0,vn+' بلا أخطاء JS',errs.join('|'));await ctx.close();}
await br.close();console.log(`PASS ${pass} FAIL ${fail}`);iss.forEach(x=>console.log(' -',x));process.exit(fail?1:0)})();
