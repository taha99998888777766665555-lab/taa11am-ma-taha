/* الرقم ١٢ — مراجعة نهائية: المتاهة (تسلسل/عشوائي/رجوع/تلميح) واشطب البطاقة (كل الترتيبات). PORT=#### */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const PORT=process.env.PORT;let pass=0,fail=0;const iss=[];const ok=(c,m,d)=>{if(c)pass++;else{fail++;iss.push(m+' '+(d===undefined?'':JSON.stringify(d)))}};
(async()=>{const br=await chromium.launch();
for(const [vn,vp] of Object.entries({phone:{width:390,height:844,isMobile:true},board:{width:1920,height:1080}})){
 const ctx=await br.newContext({viewport:{width:vp.width,height:vp.height},hasTouch:true,isMobile:!!vp.isMobile});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 const cdp=await ctx.newCDPSession(p);
 const touchDrag=async pts=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pts[0]]});for(const q of pts.slice(1))await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[q]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(2500);
 await p.evaluate(()=>{localStorage.removeItem('taha_aj_progress_v1');ajReloadProgressFromStorage();startAJNumber(12)});await p.waitForTimeout(300);
 const tag=n=>`${vn} ${n}`;
 // ===== المتاهة: على كل التصاميم الأربعة =====
 const seen=new Set();let tries=0;
 while(seen.size<4&&tries<80){tries++;
  await p.evaluate(()=>{ajGame.actIndex=7;renderAJActivity()});await p.waitForTimeout(120);
  const sp=await p.evaluate(()=>ajGame.current.spec);const key=JSON.stringify(sp.path);if(seen.has(key))continue;seen.add(key);
  const sel=([r,c])=>`.aj-maze-cell[data-r="${r}"][data-c="${c}"]`;const path=sp.path;
  const st=()=>p.evaluate(()=>({vis:document.querySelectorAll('.aj-maze-visited').length,solved:!!ajGame.current.solved,hints:document.querySelectorAll('.aj-hint').length,msg:document.getElementById('ajMessage').textContent}));
  const tap=async c=>{await p.evaluate(s=>document.querySelector(s).click(),sel(c));};
  // لا كشف للمسار عند العرض: خلايا المسار غير المزارة بلا أي صنف/سمة تميّزها عن غيرها
  const leak=await p.evaluate(sp=>{const on=new Set(sp.path.map(x=>x.join(',')));const cl=new Set(),at=new Set();[...document.querySelectorAll('.aj-maze-cell')].forEach(b=>{const k=b.dataset.r+','+b.dataset.c;if(k===sp.path[0].join(',')||k===sp.path[11].join(','))return;cl.add(b.className);b.getAttributeNames().forEach(a=>at.add(a))});return{cl:[...cl],at:[...at].sort()}},sp);
  ok(leak.cl.length===1&&leak.at.join()==='aria-label,class,data-c,data-r,type',tag('المسار لا يُكشف عند العرض (أصناف/سمات الخلايا متطابقة)'),leak);
  // ترتيب عكسي وعشوائي: لا يتقدّم ولا يكتمل
  for(const c of path.slice(2).reverse())await tap(c);
  let s=await st();ok(s.vis===1&&!s.solved,tag('لمس خانات ١٢ بترتيب عكسي لا يكمل ولا يتقدّم'),s);
  for(const c of [path[3],path[5],path[11],path[4]])await tap(c);s=await st();ok(s.vis===1&&!s.solved,tag('القفز فوق الخانات لا يُحتسب'),s);
  for(let t=0;t<10;t++){const perm=path.slice(3).sort(()=>Math.random()-.5);for(const c of perm)await tap(c);}
  s=await st();ok(s.vis===1&&!s.solved,tag('١٠ ترتيبات عشوائية لخانات ١٢ لا تكمل'),s);
  // خطوات خاطئة مجاورة + تلميح بلا كشف
  const on=new Set(path.map(x=>x.join(',')));const adj=[[path[0][0]+1,path[0][1]],[path[0][0],path[0][1]-1],[path[0][0]-1,path[0][1]],[path[0][0],path[0][1]+1]].find(x=>x[0]>=0&&x[0]<5&&x[1]>=0&&x[1]<6&&!on.has(x.join(',')));
  if(adj){for(let k=0;k<3;k++)await tap(adj);s=await st();ok(s.hints===0&&/تلميح/.test(s.msg)&&s.vis===1&&!s.solved,tag('أخطاء مجاورة: تلميح نصي بلا إضاءة ولا تقدّم'),s);}
  // تقدّم صحيح ثم رجوع: لمس خانة مزارة لا يغيّر شيئًا
  for(let i=1;i<=4;i++)await tap(path[i]);s=await st();ok(s.vis===5,tag('٤ خطوات صحيحة'),s);
  await tap(path[2]);await tap(path[0]);await tap(path[4]);s=await st();ok(s.vis===5&&!s.solved,tag('الرجوع/إعادة لمس خانة مزارة لا يغيّر الحالة ولا يفسد المسار'),s);
  // سحب يقفز عبر خانة غير متصلة لا يُحتسب
  await p.evaluate(()=>document.querySelector('.aj-maze-grid').scrollIntoView({block:'center'}));await p.waitForTimeout(600);
  const ctr=await p.evaluate(()=>Object.fromEntries([...document.querySelectorAll('.aj-maze-cell')].map(b=>{const r=b.getBoundingClientRect();return[b.dataset.r+','+b.dataset.c,{x:r.left+r.width/2,y:r.top+r.height/2}]})));
  await touchDrag([ctr[path[4].join(',')],ctr[path[8].join(',')]]);s=await st();ok(s.vis===5&&!s.solved,tag('سحب إصبع يقفز مباشرة لخانة بعيدة لا يتقدّم'),s);
  // إكمال المسار بالترتيب الصحيح
  for(let i=5;i<12;i++)await tap(path[i]);s=await st();ok(s.solved&&s.vis===12,tag('المسار الصحيح بالترتيب يكمل (١٢ خانة)'),s);
 }
 ok(seen.size===4,tag('اختُبرت التصاميم الأربعة'),seen.size);
 // ===== اشطب البطاقة المختلفة =====
 const big=await p.evaluate(()=>{const bad=[];const perms=new Set(),wr=new Set(),pos=new Set();
  for(let t=0;t<6000;t++){const sp=ajBuildCrossOutCard(12);const o=sp.groups[0].options;
   const lab=o.map(x=>x.correct?'odd':'g-'+x.rep.type);perms.add(lab.join('|'));pos.add(o.findIndex(x=>x.correct));
   const good=o.filter(x=>!x.correct),odd=o.filter(x=>x.correct);
   if(o.length!==4||odd.length!==1||good.length!==3)bad.push('count');
   if(good.some(x=>x.rep.value!==12))bad.push('good≠12');
   if(odd[0].rep.value===12)bad.push('odd=12');
   if(good.map(x=>x.rep.type).sort().join()!=='base10,frame,numeral')bad.push('types');
   wr.add(odd[0].rep.type+odd[0].rep.value);}
  return{bad:[...new Set(bad)],perms:perms.size,pos:[...pos].sort(),wr:[...wr].sort()}});
 ok(big.bad.length===0,tag('٦٠٠٠ بناء: ٣ بطاقات = ١٢ بالضبط (رقم/إطار/مكعبات) والرابعة مختلفة'),big.bad);
 ok(big.perms===24,tag('كل ترتيبات البطاقات الـ٢٤'),big.perms);ok(big.pos.join()==='0,1,2,3',tag('البطاقة المختلفة تظهر في المواضع الأربعة'),big.pos);
 ok(big.wr.length===7,tag('كل المشتتات السبعة'),big.wr);
 // تحقق من الـDOM الفعلي في ٦٠ رسمًا
 let domBad=[];
 for(let t=0;t<60;t++){
  await p.evaluate(()=>{ajGame.actIndex=8;renderAJActivity()});await p.waitForTimeout(40);
  const r=await p.evaluate(()=>{const cnt=h=>(h.match(/<(rect|circle|path|ellipse|polygon)/g)||[]).length;const nz=h=>h.replace(/id="[^"]*"/g,'').replace(/#[\w-]+/g,'').replace(/\s+/g,' ');const o=[...document.querySelectorAll('.aj-opt')];const ref12={num:'١٢',fr:ajFramesPair(12).outerHTML,b10:ajBaseTenSVG(12)};
   const cls=o.map(b=>{const n=b.querySelector('.aj-rep-num'),f=b.querySelector('.aj-frames-pair, .aj-frame'),k=b.querySelector('.aj-rep-b10');
     if(n)return n.textContent.trim()===ref12.num?'num12':'numX';
     if(k)return cnt(k.innerHTML)===cnt(ref12.b10)?'b10-12':'b10X';
     const fp=b.querySelector('.aj-rep-fr')||b.firstElementChild;return (fp&&fp.outerHTML===ref12.fr)||b.innerHTML.includes(ref12.fr)?'fr12':'frX'});
   const spec=ajGame.current.spec.groups[0].options;return{cls,oddIdx:spec.findIndex(x=>x.correct),n:o.length}});
  const good=r.cls.filter(c=>/12$/.test(c)).sort().join(),xs=r.cls.filter(c=>/X$/.test(c));
  if(r.n!==4||good!=='b10-12,fr12,num12'||xs.length!==1||!/X$/.test(r.cls[r.oddIdx]))domBad.push(r);}
 ok(domBad.length===0,tag('الـDOM: ثلاث بطاقات تساوي ١٢ بالضبط والرابعة فقط مختلفة (٦٠ رسمًا)'),domBad.slice(0,2));
 // سلوك النقر
 for(let t=0;t<6;t++){await p.evaluate(()=>{ajGame.actIndex=8;renderAJActivity()});await p.waitForTimeout(80);
  const odd=await p.evaluate(()=>ajGame.current.spec.groups[0].options.findIndex(x=>x.correct));
  for(let i=0;i<4;i++){if(i!==odd)await p.evaluate(i=>document.querySelectorAll('.aj-opt')[i].click(),i);}
  const a=await p.evaluate(()=>({sol:!!ajGame.current.solved,h:document.querySelectorAll('.aj-hint').length,mk:document.querySelectorAll('.aj-mark-cross').length}));
  await p.evaluate(i=>document.querySelectorAll('.aj-opt')[i].click(),odd);const b=await p.evaluate(()=>({sol:!!ajGame.current.solved,mk:document.querySelectorAll('.aj-mark-cross').length}));
  if(a.sol||a.h||a.mk||!b.sol||b.mk!==1)domBad.push({a,b});}
 ok(domBad.length===0,tag('النقر على الصحيحة الثلاث لا يكمل ولا يشطب؛ المختلفة تكمل وتُشطب وحدها'),domBad.slice(0,2));
 ok(errs.length===0,tag('بلا أخطاء JS'),errs.join('|'));await ctx.close();}
await br.close();console.log(`PASS ${pass} FAIL ${fail}`);iss.forEach(x=>console.log(' -',x));process.exit(fail?1:0)})();
