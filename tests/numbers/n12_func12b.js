/* الرقم ١٢ (المرحلة ٣): الأنشطة ٦–١١ + اللمس المتسلسل في «صِل» — PORT=#### node tests/numbers/n12_func12b.js */
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
 const noHint=()=>p.evaluate(()=>document.querySelectorAll('.aj-hint').length===0);
 // ٣) اللمس المتسلسل في «صِل الصورة بالعدد»: عدد ثم صورة، وصورة ثم عدد، وسحب
 await goto(2);
 await T('[data-id="b11"]');await T('[data-id="a11"]');await p.waitForTimeout(350);
 ok(await p.evaluate(()=>document.querySelector('[data-id="a11"]').classList.contains('aj-conn-ok')&&document.querySelector('[data-id="b11"]').classList.contains('aj-conn-ok')),tag(3,'لمس العدد ثم الصورة يوصل'));
 await T('[data-id="a12"]');await T('[data-id="b12"]');await p.waitForTimeout(350);
 ok(await p.evaluate(()=>document.querySelector('[data-id="a12"]').classList.contains('aj-conn-ok')),tag(3,'لمس الصورة ثم العدد يوصل'));
 ok(!(await solved()),tag(3,'لا يكتمل قبل الثالث'));
 const c3=await p.evaluate(()=>{const f=id=>{const b=document.querySelector(`[data-id="${id}"]`);b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}};return null});
 await p.evaluate(()=>document.querySelector('[data-id="a13"]').scrollIntoView({block:'center'}));await p.waitForTimeout(700);
 const pr=await p.evaluate(()=>{const f=id=>{const r=document.querySelector(`[data-id="${id}"]`).getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}};return[f('a13'),f('b13')]});
 const pts=[];for(let k=0;k<=12;k++)pts.push({x:pr[0].x+(pr[1].x-pr[0].x)*k/12,y:pr[0].y+(pr[1].y-pr[0].y)*k/12});await touchDrag(pts);await p.waitForTimeout(400);
 ok(await solved(),tag(3,'السحب باللمس يوصل ويكمل النشاط'),await msg());
 // خطأ متسلسل ثم تعافٍ
 await goto(2);
 await T('[data-id="b11"]');await T('[data-id="a12"]');await p.waitForTimeout(300);ok(!(await solved())&&await p.evaluate(()=>!document.querySelector('[data-id="a12"]').classList.contains('aj-conn-ok')),tag(3,'توصيل خاطئ بالتسلسل لا يُقبل'));
 await p.waitForTimeout(900);
 for(const v of [11,12,13]){await T(`[data-id="b${v}"]`);await T(`[data-id="a${v}"]`);await p.waitForTimeout(250);}
 ok(await solved(),tag(3,'اكتمال بالتسلسل (عدد ثم صورة) للثلاثة'));
 // ٦) خط الأعداد
 await goto(5);
 const L=await p.evaluate(()=>[...document.querySelectorAll('.aj-lineg-opt')].map(b=>{const r=b.getBoundingClientRect();return{t:b.querySelector('.aj-opt-num').textContent,x:r.left+r.width/2,w:r.width,h:r.height}}));
 ok(L.map(o=>o.t).join()==='١٠,١١,١٢,١٣,١٤,١٥',tag(6,'١٠ إلى ١٥'),L.map(o=>o.t));
 ok(L.every((o,i)=>i===0||o.x<L[i-1].x),tag(6,'تصاعد من اليمين إلى اليسار'));ok(L.every(o=>o.w>=50&&o.h>=60),tag(6,'أهداف لمس كافية'),L.map(o=>Math.round(o.w)));
 ok(await p.evaluate(()=>document.querySelector('.aj-lineg-stim .aj-bignum').textContent.trim()==='١٢'),tag(6,'المطلوب ١٢'));
 const rail=await p.evaluate(()=>{const l=document.querySelector('.aj-lineg-line').getBoundingClientRect();return{l:l.left,r:l.right,vw:innerWidth}});ok(rail.l>=0&&rail.r<=rail.vw,tag(6,'الخط داخل الشاشة'),rail);
 const LN=p.locator('.aj-lineg-opt');
 await LN.nth(1).tap();await LN.nth(4).tap();await p.waitForTimeout(250);
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-hint').length===0&&!document.querySelector('.aj-lineg-hit')),tag(6,'لا كشف تلقائي'));
 ok(await p.evaluate(()=>{const s=document.querySelectorAll('.aj-lineg-start');return s.length===1&&s[0].querySelector('.aj-opt-num').textContent.trim()==='١٠'}),tag(6,'يُشار إلى ١٠ فقط كبداية'));
 ok(/خطوتين/.test(await msg()),tag(6,'تلميح نصي «خطوتين»'),await msg());
 await LN.nth(2).tap();await p.waitForTimeout(250);ok(await solved(),tag(6,'يكتمل'));
 const nb=await p.evaluate(()=>document.querySelector('.aj-lineg-rel').textContent.replace(/\s+/g,' ')+'#'+[...document.querySelectorAll('.aj-lineg-cap')].map(c=>c.textContent).join('|'));
 ok(/١١ ثم ١٢ ثم ١٣/.test(nb)&&/قبله/.test(nb)&&/بعده/.test(nb),tag(6,'إبراز ١١ و١٣ حول ١٢'),nb);
 // ٧) ما قبل وما بعد
 await goto(6);
 const rows=await p.evaluate(()=>[...document.querySelectorAll('.aj-seq-row')].map(r=>[...r.children].map(c=>c.classList.contains('aj-blank')?'_':c.textContent.trim())));
 ok(rows.length===2&&rows[0].join()==='_,١٢,_'&&/^_,(١١|١٤),_$/.test(rows[1].join()),tag(7,'صفّان: ١٢ ثم ١١ أو ١٤'),rows);
 const KK=d=>p.locator('.aj-key',{hasText:new RegExp('^'+E(d)+'$')}).first();
 const typeNum=async s=>{for(const ch of String(s)){const k=KK(ch);await k.scrollIntoViewIfNeeded();await k.tap();}};
 ok(await p.evaluate(()=>document.querySelector('.aj-fill').classList.contains('aj-calm')),tag(7,'نمط هادئ'));
 await typeNum('99');await p.waitForTimeout(200);await p.waitForTimeout(800);await typeNum('98');await p.waitForTimeout(250);
 ok(await noHint(),tag(7,'لا إضاءة لمفتاح الإجابة'));ok(/تلميح/.test(await msg())&&!/[0-9]/.test(await msg()),tag(7,'تلميح نصي'),await msg());
 ok(await p.evaluate(()=>{const w=document.querySelector('.aj-blank-wrong');return !w||getComputedStyle(w).animationName==='none'}),tag(7,'خطأ بلا اهتزاز'));
 await p.waitForTimeout(800);
 const ans=await p.evaluate(()=>[...document.querySelectorAll('.aj-seq-row')].map(r=>{const t=[...r.children].map(c=>c.classList.contains('aj-blank')?null:+c.textContent.trim().split('').map(ch=>'٠١٢٣٤٥٦٧٨٩'.indexOf(ch)).join('')).find(x=>x!==null);return[t-1,t+1]}));
 ok(ans[0][0]===11&&ans[0][1]===13,tag(7,'إجابات الصف الأول ١١ و١٣'),ans);
 for(const row of ans){for(const a of row){await typeNum(a);await p.waitForTimeout(400);}}
 await p.waitForTimeout(300);ok(await solved(),tag(7,'يكتمل بكتابة الأعداد الأربعة'),await msg());
 // ٨) المتاهة — تحقق من التصميم عبر ٣٠٠ بناء
 const design=await p.evaluate(()=>{const bad=[];const seen=new Set();for(let t=0;t<300;t++){const sp=ajBuildMaze(12);seen.add(JSON.stringify(sp.path));
   const P=sp.path.map(x=>x.join(','));const set=new Set(P);
   if(sp.path.length!==12)bad.push('len');
   const v={};sp.cells.forEach(c=>v[c.r+','+c.c]=c.value);
   if(sp.cells.length!==30)bad.push('cells');
   const twelves=sp.cells.filter(c=>c.value===12).map(c=>c.r+','+c.c);
   if(twelves.length!==12||twelves.some(k=>!set.has(k)))bad.push('12-outside');
   if(sp.cells.some(c=>!c.path&&![10,11,13,21].includes(c.value)))bad.push('decoy');
   const nbs=(r,c)=>[[r+1,c],[r-1,c],[r,c+1],[r,c-1]].map(x=>x.join(','));
   sp.path.forEach((pp,i)=>{const adj=nbs(pp[0],pp[1]).filter(k=>set.has(k));const exp=(i===0||i===11)?1:2;if(adj.length!==exp)bad.push('shortcut@'+i)});
   for(let i=1;i<12;i++){if(Math.abs(sp.path[i][0]-sp.path[i-1][0])+Math.abs(sp.path[i][1]-sp.path[i-1][1])!==1)bad.push('step')}
   if(sp.path[0].join()!=='0,5'||sp.path[11].join()!=='4,0')bad.push('ends');
   [10,11,13,21].forEach(d=>{if(!sp.cells.some(c=>c.value===d))bad.push('missing-decoy-'+d)});
 }return{bad:[...new Set(bad)],variants:seen.size}});
 ok(design.bad.length===0,tag(8,'تصميم المتاهة: مسار ١٢ خانة بلا اختصارات والمشتتات مدروسة'),design);ok(design.variants>=3,tag(8,'عدة تصاميم'),design.variants);
 await goto(7);
 const mz=await p.evaluate(()=>({sp:ajGame.current.spec,cells:[...document.querySelectorAll('.aj-maze-cell')].map(b=>{const r=b.getBoundingClientRect();return{r:+b.dataset.r,c:+b.dataset.c,w:r.width,h:r.height,l:r.left,rt:r.right}}),vw:innerWidth}));
 ok(mz.cells.length===30&&mz.cells.every(c=>c.w>=(vn==='phone'?44:60)&&c.h>=(vn==='phone'?44:60)),tag(8,'خانات المتاهة قابلة للمس'),Math.min(...mz.cells.map(c=>c.w)));
 ok(mz.cells.every(c=>c.l>=0&&c.rt<=mz.vw),tag(8,'المتاهة داخل الشاشة'));
 ok(await p.evaluate(()=>document.querySelector('.aj-maze').classList.contains('aj-calm')),tag(8,'نمط هادئ'));
 const cellSel=(r,c)=>`.aj-maze-cell[data-r="${r}"][data-c="${c}"]`;
 const path=mz.sp.path;const onP=new Set(path.map(x=>x.join(',')));
 const start=path[0];const wrongAdj=[[start[0]+1,start[1]],[start[0],start[1]-1]].find(x=>!onP.has(x.join(','))&&x[0]<5&&x[1]>=0);
 if(wrongAdj){for(let k=0;k<3;k++){await T(cellSel(...wrongAdj));await p.waitForTimeout(150);}
  ok(await noHint(),tag(8,'لا إضاءة للخانة الصحيحة بعد الأخطاء'));ok(/تلميح/.test(await msg()),tag(8,'تلميح نصي'),await msg());
  ok(await p.evaluate(()=>document.querySelectorAll('.aj-maze-visited').length===1),tag(8,'الخطأ لا يتقدم'));}
 // مشي أول ٥ خطوات بالنقر ثم باقي المسار بالسحب باللمس
 for(let i=1;i<=5;i++){await T(cellSel(...path[i]));await p.waitForTimeout(120);}
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-maze-visited').length===6),tag(8,'٥ خطوات نقر'));
 await p.evaluate(()=>document.querySelector('.aj-maze-grid').scrollIntoView({block:'center'}));await p.waitForTimeout(700);
 const ctr=await p.evaluate(()=>Object.fromEntries([...document.querySelectorAll('.aj-maze-cell')].map(b=>{const r=b.getBoundingClientRect();return[b.dataset.r+','+b.dataset.c,{x:r.left+r.width/2,y:r.top+r.height/2}]})));
 const dp=[];for(let i=5;i<12;i++){const a=ctr[path[i-1].join(',')],b=ctr[path[i].join(',')];for(let k=(i===5?0:1);k<=6;k++)dp.push({x:a.x+(b.x-a.x)*k/6,y:a.y+(b.y-a.y)*k/6});}
 await touchDrag(dp);await p.waitForTimeout(350);ok(await solved(),tag(8,'السحب باللمس على المسار يوصل إلى البيت'),await msg());
 // ٩) اشطب البطاقة المختلفة — ٣٠٠ بناء
 const co=await p.evaluate(()=>{const bad=[];const wr=new Set();for(let t=0;t<300;t++){const sp=ajBuildCrossOutCard(12);const o=sp.groups[0].options;
   if(o.length!==4)bad.push('len');
   const good=o.filter(x=>!x.correct),odd=o.filter(x=>x.correct);
   if(odd.length!==1)bad.push('odd-count');
   if(good.some(x=>x.rep.value!==12))bad.push('good-not-12');
   if(odd[0].rep.value===12)bad.push('odd-is-12');
   if(good.map(x=>x.rep.type).sort().join()!=='base10,frame,numeral')bad.push('types');
   wr.add(odd[0].rep.type+odd[0].rep.value);
   if(!sp.calm||sp.mark!=='cross')bad.push('flags');
   if(o.some(x=>x.aria!=='بطاقة'))bad.push('aria-leak');
 }return{bad:[...new Set(bad)],wr:[...wr]}});
 ok(co.bad.length===0,tag(9,'ثلاث بطاقات = ١٢ بطرق مختلفة وواحدة مختلفة'),co);ok(co.wr.includes('numeral21'),tag(9,'٢١ ضمن المشتتات'),co.wr);
 await goto(8);
 ok(await p.locator('.aj-opt').count()===4,tag(9,'أربع بطاقات'));
 ok(await p.evaluate(()=>[...document.querySelectorAll('.aj-opt')].every(b=>{const r=b.getBoundingClientRect();return r.width>=70&&r.height>=70&&r.left>=0&&r.right<=innerWidth})),tag(9,'بطاقات كبيرة داخل الشاشة'));
 ok(await p.evaluate(()=>[...document.querySelectorAll('.aj-opt')].every(b=>!b.className.match(/aj-hint|aj-opt-correct|aj-mark/))),tag(9,'لا علامات تكشف الإجابة'));
 const idxGood=await p.evaluate(()=>ajGame.current.spec.groups[0].options.map((o,i)=>o.correct?-1:i).filter(i=>i>=0));
 const idxOdd=await p.evaluate(()=>ajGame.current.spec.groups[0].options.findIndex(o=>o.correct));
 await p.locator('.aj-opt').nth(idxGood[0]).tap();await p.locator('.aj-opt').nth(idxGood[1]).tap();await p.waitForTimeout(250);
 ok(await noHint()&&!(await solved()),tag(9,'اختيار بطاقة صحيحة خطأ هادئ بلا إضاءة'));ok(/تلميح/.test(await msg()),tag(9,'تلميح نصي'),await msg());
 await p.locator('.aj-opt').nth(idxOdd).tap();await p.waitForTimeout(250);ok(await solved(),tag(9,'شطب البطاقة المختلفة يكمل'));
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-mark-cross').length===1),tag(9,'علامة الشطب على واحدة'));
 // ١٠) عُدّ واكتب
 await goto(9);
 ok(await p.locator('.aj-countable .aj-object').count()===12,tag(10,'١٢ تفاحة'));
 ok(await p.evaluate(()=>{const o=[...document.querySelectorAll('.aj-countable .aj-object')].map(e=>e.getBoundingClientRect());const rows=new Set(o.map(r=>Math.round(r.top/10)));return o.every(r=>r.left>=0&&r.right<=innerWidth)&&rows.size<=3}),tag(10,'التفاح في صفّين داخل الشاشة'));
 const cnt=p.locator('.aj-countable .aj-object');
 const K0=d=>p.locator('.aj-key',{hasText:new RegExp('^'+E(d)+'$')}).first();
 await K0(1).scrollIntoViewIfNeeded();await K0(1).tap();await K0(2).tap();await p.waitForTimeout(300);
 ok(!(await solved())&&/المس كل/.test(await msg()),tag(10,'لا تُقبل الإجابة قبل عدّ كل التفاحات'),await msg());await p.waitForTimeout(1000);
 for(const k of [11,3,7,0,5,1,9,2,8,4,6,10,6,0]){await cnt.nth(k).scrollIntoViewIfNeeded();await cnt.nth(k).tap();}
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-countable .aj-counted').length===12),tag(10,'١٢ مَعدودة بأي ترتيب'));
 const maxBadge=await p.evaluate(()=>Math.max(...[...document.querySelectorAll('.aj-count-badge')].map(b=>b.textContent.trim()).map(t=>'٠١٢٣٤٥٦٧٨٩'.split('').reduce((a,c,i)=>a.split(c).join(i),t)*1)));ok(maxBadge===12,tag(10,'لا عدّ مزدوج'),maxBadge);
 await K0(2).scrollIntoViewIfNeeded();await K0(1).tap();await K0(1).tap();await p.waitForTimeout(250);
 ok(!(await solved())&&/عُدّ/.test(await msg()),tag(10,'١١ خطأ هادئ'),await msg());await p.waitForTimeout(800);
 await K0(1).tap();await K0(2).tap();await p.waitForTimeout(250);ok(await solved(),tag(10,'كتابة ١٢ تكمل'));
 const keys=await p.evaluate(()=>[...document.querySelectorAll('.aj-key')].map(k=>k.textContent.trim()).join(''));ok(!/[0-9]/.test(keys),tag(10,'لوحة أرقام شرقية'),keys);
 // ١١) التتبع
 await goto(10);
 for(let s=0;s<3;s++){await p.evaluate(()=>{document.getElementById('ajMessage').textContent=''});
  const info=await p.evaluate(()=>{const g=document.querySelector('.aj-cv-guide'),i=document.querySelector('.aj-cv-ink');i.scrollIntoView({block:'center'});const r=i.getBoundingClientRect();return{w:g.width,h:g.height,r:{x:r.left,y:r.top,w:r.width,h:r.height}}});
  if(s===0)var runs=await p.evaluate(()=>{const g=document.querySelector('.aj-cv-guide');const W=g.width,H=g.height;const d=g.getContext('2d').getImageData(0,0,W,H).data;const out=[];for(let y=0;y<H;y+=6){let st=-1;for(let x=0;x<=W;x++){const a=x<W?d[(y*W+x)*4+3]:0;if(a>20&&st<0)st=x;if(a<=20&&st>=0){out.push([y,st,x-1]);st=-1}}}return out});
  const sx=info.r.w/info.w,sy=info.r.h/info.h;let flip=false;
  for(const [y,a,b] of runs.concat(runs)){const rr=await p.evaluate(()=>{const b=document.querySelector('.aj-cv-ink').getBoundingClientRect();return{x:b.left,y:b.top}});const x0=flip?b:a,x1=flip?a:b;flip=!flip;const pts=[];const st=Math.max(2,Math.round(Math.abs(x1-x0)/14));for(let k=0;k<=st;k++)pts.push({x:rr.x+(x0+(x1-x0)*k/st)*sx,y:rr.y+y*sy});await touchDrag(pts);
   if(await p.evaluate(()=>/✓ ممتاز|🎉/.test(document.getElementById('ajMessage').textContent)))break;}
  await p.waitForTimeout(s<2?1500:400);}
 ok(await solved(),tag(11,'التتبع بثلاث مراحل باللمس يكتمل'),await msg());
 ok(await stars()===7,tag('*','٧ نجوم: الأنشطة ٣ و٦–١١ (٣ لا تُعاد)'),await stars());
 const west=await p.evaluate(()=>{startAJNumber(12);let bad=[];for(let i=0;i<11;i++){ajGame.actIndex=i;renderAJActivity();if(/[0-9]/.test(document.getElementById('ajPlay').innerText))bad.push(i+1)}return bad});ok(west.length===0,vn+' أرقام عربية هندية فقط في الأنشطة الـ١١',west);
 ok(errs.length===0,vn+' بلا أخطاء JS',errs.join('|'));await ctx.close();}
await br.close();console.log(`PASS ${pass} FAIL ${fail}`);iss.forEach(x=>console.log(' -',x));process.exit(fail?1:0)})();
