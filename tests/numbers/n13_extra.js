/* الرقم ١٣: المتاهة (اختصارات/ترتيب عشوائي/رجوع) + كل ترتيبات «اشطب» + الأنشطة غير مقفلة — PORT=#### */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const PORT=process.env.PORT;let pass=0,fail=0;const iss=[];const ok=(c,m,d)=>{if(c)pass++;else{fail++;iss.push(m+' '+(d===undefined?'':JSON.stringify(d)))}};
(async()=>{const br=await chromium.launch();
for(const [vn,vp] of Object.entries({p320:{width:320,height:640,isMobile:true},p390:{width:390,height:844,isMobile:true},board:{width:1920,height:1080}})){
 const ctx=await br.newContext({viewport:{width:vp.width,height:vp.height},hasTouch:true,isMobile:!!vp.isMobile});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(2500);
 await p.evaluate(()=>{localStorage.removeItem('taha_aj_progress_v1');ajReloadProgressFromStorage();startAJNumber(13)});await p.waitForTimeout(300);
 const goto=async i=>{await p.evaluate(i=>{ajGame.actIndex=i;renderAJActivity()},i);await p.waitForTimeout(350)};
 const solved=()=>p.evaluate(()=>!!ajGame.current.solved);
 const tag=(n)=>`${vn} ${n}`;
 // ١) المتاهة: كل تصميم من الأربعة
 const designs=await p.evaluate(()=>{const s=new Set();for(let i=0;i<400;i++)s.add(JSON.stringify(ajBuildMaze(13).path));return[...s].map(x=>JSON.parse(x))});
 ok(designs.length===4,tag('٤ تصاميم للمتاهة'),designs.length);
 for(let d=0;d<designs.length;d++){
  const path=designs[d];
  // اختيار التصميم بالقوة
  await p.evaluate(path=>{startAJNumber(13);ajGame.actIndex=7;const orig=ajBuildMaze;window.__om=window.__om||orig;AJ_TYPES.maze.build=n=>{const sp=window.__om(13);sp.path=path;const set=new Set(path.map(x=>x.join(',')));let k=0;const dec=[12,14,10,31];sp.cells.forEach(c=>{c.path=set.has(c.r+','+c.c);c.value=c.path?13:dec[k++%4]});return sp};renderAJActivity()},path);await p.waitForTimeout(400);
  const sel=(r,c)=>`.aj-maze-cell[data-r="${r}"][data-c="${c}"]`;
  const visited=()=>p.evaluate(()=>document.querySelectorAll('.aj-maze-visited').length);
  const tapc=async(r,c)=>{const l=p.locator(sel(r,c));await l.scrollIntoViewIfNeeded();await l.tap();await p.waitForTimeout(60)};
  // لمس كل المسار عشوائيًا (دون الخانة الثانية) لا ينهي
  const order=path.slice(2).map((x,i)=>[x,(i*7919)%97]).sort((a,b)=>a[1]-b[1]).map(x=>x[0]);
  for(const [r,c] of order)await tapc(r,c);
  ok(await visited()===1&&!(await solved()),tag(`تصميم ${d+1}: لمس خانات المسار عشوائيًا لا يتقدم`),await visited());
  // لمس خانة بعيدة (البيت) مباشرة لا ينهي
  await tapc(...path[12]);ok(!(await solved())&&await visited()===1,tag(`تصميم ${d+1}: لا قفز إلى البيت`));
  // خانة سابقة (البداية) مجددًا لا تؤثر
  await tapc(...path[0]);ok(await visited()===1,tag(`تصميم ${d+1}: إعادة لمس البداية لا تؤثر`));
  // مشي صحيح مع لمس خاطئ في المنتصف
  for(let i=1;i<=6;i++)await tapc(...path[i]);
  const before=await visited();await tapc(...path[3]);await tapc(...path[9]);ok(await visited()===before&&before===7,tag(`تصميم ${d+1}: الرجوع/القفز لا يغيّر`),before);
  for(let i=7;i<=12;i++)await tapc(...path[i]);
  ok(await solved()&&await visited()===13,tag(`تصميم ${d+1}: يكتمل عند البيت بعد ١٣ خانة`),await visited());
 }
 // ٢) اشطب: كل ترتيبات البطاقات (٧ مختلفة × ٤ مواضع = ٢٨)
 const reps=[['numeral',31],['numeral',12],['numeral',14],['frame',12],['frame',14],['base10',12],['base10',14]];
 // الدالة الأصلية: نحفظها قبل الحلقة
 await p.evaluate(()=>{window.ajBuildCrossOutCardOrig=window.ajBuildCrossOutCardOrig||ajBuildCrossOutCard});
 let good=0;
 for(const [t,v] of reps){for(let pos=0;pos<4;pos++){
  await p.evaluate(([t,v,pos])=>{startAJNumber(13);ajGame.actIndex=8;AJ_TYPES.crossOutCard.build=()=>{const sp=window.ajBuildCrossOutCardOrig(13);const o=sp.groups[0].options;const g=o.filter(x=>!x.correct);g.splice(pos,0,{rep:{type:t,value:v},correct:true,aria:'بطاقة'});sp.groups[0].options=g;return sp};renderAJActivity()},[t,v,pos]);await p.waitForTimeout(250);
  const btns=p.locator('.aj-opt');
  const cnt=await btns.count();
  // خطأ أولًا: بطاقة صحيحة (ليست المختلفة)
  const wrongIdx=pos===0?1:0;await btns.nth(wrongIdx).scrollIntoViewIfNeeded();await btns.nth(wrongIdx).tap();await p.waitForTimeout(80);
  const midSolved=await solved();
  await btns.nth(pos).scrollIntoViewIfNeeded();await btns.nth(pos).tap();await p.waitForTimeout(120);
  if(cnt===4&&!midSolved&&await solved())good++;
 }}
 ok(good===28,tag('٢٨ ترتيبًا للشطب: الخطأ لا يكمل والبطاقة المختلفة تكمل'),good);
 // ٣) لا أقفال: كل الأنشطة تُفتح مباشرة وبأي ترتيب دون إتقان السابقة؛ «التالي» وحده معطّل قبل الحل
 const nav=await p.evaluate(()=>{startAJNumber(13);const r=[];[10,3,7,0,9,5,2,8,1,6,4].forEach(i=>{ajGame.actIndex=i;renderAJActivity();r.push(!!document.querySelector('#ajStage')&&document.getElementById('ajStage').children.length>0)});const nx=document.getElementById('ajBtnNext');return{ok:r.every(Boolean),nextDisabled:nx.disabled,skipEnabled:!document.getElementById('ajBtnSkip').disabled}});
 ok(nav.ok,tag('الأنشطة الـ١١ تُعرض بأي ترتيب'),nav);ok(nav.nextDisabled&&nav.skipEnabled,tag('«التالي» معطّل قبل الحل (القفل لهذا الزر فقط) و«تخطَّ» متاح'),nav);
 ok(errs.length===0,tag('بلا أخطاء JS'),errs.join('|'));await ctx.close();}
await br.close();console.log(`PASS ${pass} FAIL ${fail}`);iss.forEach(x=>console.log(' -',x));process.exit(fail?1:0)})();
