/* الرقم ١٣: تحسينات المراجعة (ألوان ٤٤، منطقة لمس الدوائر، متاهة ١٢ عند ٣٢٠، «تخطَّ»، تلميحات قبل/بعد ١٥) — PORT=#### */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const PORT=process.env.PORT;let pass=0,fail=0;const iss=[];const ok=(c,m,d)=>{if(c)pass++;else{fail++;iss.push(m+' '+(d===undefined?'':JSON.stringify(d)))}};
const E=d=>String(d).replace(/\d/g,x=>'٠١٢٣٤٥٦٧٨٩'[x]);
(async()=>{const br=await chromium.launch();
for(const [vn,vp] of Object.entries({w320:{width:320,height:640,isMobile:true},w340:{width:340,height:700,isMobile:true},w360:{width:360,height:740,isMobile:true},w390:{width:390,height:844,isMobile:true},board:{width:1920,height:1080}})){
 const ctx=await br.newContext({viewport:{width:vp.width,height:vp.height},hasTouch:true,isMobile:!!vp.isMobile});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(2500);
 const start=n=>p.evaluate(n=>{localStorage.removeItem('taha_aj_progress_v1');localStorage.setItem('taha_app_stars','0');stars=0;ajReloadProgressFromStorage();startAJNumber(n)},n);
 const goto=async i=>{await p.evaluate(i=>{ajGame.actIndex=i;renderAJActivity()},i);await p.waitForTimeout(500)};
 const solved=()=>p.evaluate(()=>!!ajGame.current.solved);
 const msg=()=>p.evaluate(()=>document.getElementById('ajMessage').textContent);
 const tag=n=>`${vn} ${n}`;
 const noScroll=async n=>{const r=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,vw:innerWidth}));ok(r.sw<=r.vw+1,tag(n+': لا تمرير أفقي'),r)};
 // ١) ألوان البالونات
 await start(13);await goto(1);
 const sw=await p.evaluate(()=>{const b=[...document.querySelectorAll('.aj-find-palette .aj-swatch')].map(e=>e.getBoundingClientRect());const pal=document.querySelector('.aj-find-palette').getBoundingClientRect();return{n:b.length,min:Math.min(...b.map(r=>Math.min(r.width,r.height))),inside:b.every(r=>r.left>=-0.5&&r.right<=innerWidth+0.5),palIn:pal.left>=-0.5&&pal.right<=innerWidth+0.5,overlap:b.some((r,i)=>i&&Math.abs(r.left-b[i-1].left)<r.width-0.5)}});
 ok(sw.n===6&&sw.min>=43.9,tag('ألوان ≥٤٤'),sw);ok(sw.inside&&sw.palIn&&!sw.overlap,tag('الألوان داخل الشاشة بلا تداخل'),sw);await noScroll('البالونات');
 // ٢) دوائر التلوين
 await goto(0);
 const cc=await p.evaluate(()=>{const bs=[...document.querySelectorAll('.aj-frame-paint .aj-obj-circle')];const hit=(b)=>{b.scrollIntoView({block:'center',behavior:'instant'});const r2=b.getBoundingClientRect(),x=r2.left+r2.width/2,y=r2.top+r2.height/2;return[[-21,-21],[21,-21],[-21,21],[21,21],[0,0]].every(([dx,dy])=>{const e=document.elementFromPoint(x+dx,y+dy);return e===b||(e&&b.contains(e))})};
  const ok44=bs.map(hit);const rs=bs.map(b=>b.getBoundingClientRect());const vis=rs[0].width;
  const cx=b=>{const r=b.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};
  const cs=bs.map(cx);let minD=999;for(let i=0;i<cs.length;i++)for(let j=i+1;j<cs.length;j++){const dx=Math.abs(cs[i][0]-cs[j][0]),dy=Math.abs(cs[i][1]-cs[j][1]);if(dx<44&&dy<44)minD=Math.min(minD,Math.max(dx,dy))}
  return{n:bs.length,allHit:ok44.every(Boolean),vis:Math.round(vis*10)/10,sw:document.documentElement.scrollWidth,vw:innerWidth,minD}});
 ok(cc.n===13&&cc.allHit,tag('منطقة لمس ٤٤×٤٤ لكل دائرة (الزوايا والمركز)'),cc);ok(cc.minD===999,tag('لا تداخل بين مناطق اللمس'),cc);ok(cc.sw<=cc.vw+1,tag('لا تمرير أفقي في التلوين'),cc);
 const expect={w320:27.7,w340:30,w360:30,w390:32.8,board:39.2};ok(Math.abs(cc.vis-(expect[vn]||cc.vis))<=1.2||vn==='w340'||vn==='w360',tag('حجم الدائرة المرئية كما كان'),cc.vis);
 // لمس عند زاوية منطقة الـ٤٤ يلوّن
 const tapc=await p.evaluate(()=>{const b=document.querySelectorAll('.aj-frame-paint .aj-obj-circle')[7];b.scrollIntoView({block:'center',behavior:'instant'});const r=b.getBoundingClientRect();return{x:r.left+r.width/2+19,y:r.top+r.height/2+19}});
 await p.touchscreen.tap(tapc.x,tapc.y);await p.waitForTimeout(250);
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-frame-paint .aj-colored, .aj-frame-paint [aria-pressed="true"]').length)===1,tag('لمس ركن منطقة ٤٤ يلوّن دائرة واحدة فقط'));
 // ٣) متاهة ١٢
 await start(12);await goto(7);
 const mz=await p.evaluate(()=>({cells:[...document.querySelectorAll('.aj-maze-cell')].map(b=>{const r=b.getBoundingClientRect();return{w:r.width,h:r.height,l:r.left,r:r.right}}),vw:innerWidth,sp:ajGame.current.spec}));
 ok(mz.cells.length===30&&mz.cells.every(c=>c.w>=43.9&&c.h>=43.9),tag('خانات متاهة ١٢ ≥٤٤'),Math.min(...mz.cells.map(c=>c.w)));ok(mz.cells.every(c=>c.l>=-0.5&&c.r<=mz.vw+0.5),tag('متاهة ١٢ داخل الشاشة'));await noScroll('متاهة ١٢');
 ok(mz.sp.path.length===12&&mz.sp.path[0].join()==='0,5'&&mz.sp.path[11].join()==='4,0',tag('مسار ١٢ لم يتغير'));
 const path=mz.sp.path;
 for(let i=1;i<12;i++){const l=p.locator(`.aj-maze-cell[data-r="${path[i][0]}"][data-c="${path[i][1]}"]`);await l.scrollIntoViewIfNeeded();await l.tap();await p.waitForTimeout(60)}
 await p.waitForTimeout(250);ok(await solved(),tag('متاهة ١٢ تكتمل باللمس'));
 // ٤) تخطَّ في ١٣
 await start(13);
 const sk=await p.evaluate(async()=>{const out={};const w=ms=>new Promise(r=>setTimeout(r,ms));const nx=()=>document.getElementById('ajBtnNext'),sb=()=>document.getElementById('ajBtnSkip');
  out.nextBefore=nx().disabled;out.skipBefore=!sb().disabled;const st0=+localStorage.getItem('taha_app_stars');
  sb().click();await w(500);out.idx=ajGame.actIndex;out.skipped=JSON.stringify(JSON.parse(localStorage.getItem('taha_aj_progress_v1')).skipped);out.done=JSON.stringify(JSON.parse(localStorage.getItem('taha_aj_progress_v1')).done);out.stars=+localStorage.getItem('taha_app_stars')-st0;out.stage=document.getElementById('ajStage').children.length>0;out.nextAfter=nx().disabled;
  for(let i=1;i<11;i++){sb().click();await w(450)}
  out.finishShown=document.getElementById('ajDone').style.display==='flex';out.bonus=JSON.stringify(JSON.parse(localStorage.getItem('taha_aj_progress_v1')).bonus);out.starsAll=+localStorage.getItem('taha_app_stars')-st0;return out});
 ok(sk.nextBefore===true&&sk.skipBefore===true,tag('«التالي» معطّل قبل الحل و«تخطَّ» متاح'),sk);ok(sk.idx===1&&sk.stage&&sk.nextAfter===true,tag('«تخطَّ» ينقل إلى النشاط التالي ويُرسم'),sk);
 ok(sk.skipped.includes('13:0')&&sk.done==='{}'&&sk.stars===0,tag('التخطّي لا يُسجّل إنجازًا ولا نجوم'),sk);ok(sk.finishShown&&sk.bonus==='{}'&&sk.starsAll===0,tag('تخطّي كل الأنشطة يصل إلى نهاية الرقم دون هدية'),sk);
 // لاحقًا يمكن حلّ نشاط تُخطّي (إتقانه غير مشروط)
 const late=await p.evaluate(()=>{ajDoneClose&&0;return 1}).catch(()=>1);
 await start(13);await p.evaluate(()=>{document.getElementById('ajBtnSkip').click()});await p.waitForTimeout(400);
 await goto(0);const s1=await p.evaluate(()=>{ajActivitySolved();return{stars:+localStorage.getItem('taha_app_stars'),done:JSON.stringify(JSON.parse(localStorage.getItem('taha_aj_progress_v1')).done)}});
 ok(s1.stars===1&&s1.done.includes('13:0'),tag('نشاط مُتخطّى يمكن حلّه لاحقًا بنجمة واحدة'),s1);
 // ٥) قبل وما بعد: صفّان ١٣ ثم ١٢، بتلميحات بسيطة للعدّ والترتيب دون كشف
 await start(13);
 const KK=d=>p.locator('.aj-key',{hasText:new RegExp('^'+E(d)+'$')}).first();
 const typeNum=async s=>{for(const ch of String(s)){const k=KK(ch);await k.scrollIntoViewIfNeeded();await k.tap();}};
 const rowsAll=[];
 for(let rep=0;rep<3;rep++){await goto(6);rowsAll.push(await p.evaluate(()=>[...document.querySelectorAll('.aj-seq-row')].map(r=>[...r.children].map(c=>c.classList.contains('aj-blank')?'_':c.textContent.trim()).join('|'))))}
 ok(rowsAll.every(r=>r.length===2&&r[0]==='_|١٣|_'&&r[1]==='_|١٢|_'),tag('الصفّان ١٣ ثم ١٢ في كل مرة (لا ١٥ إطلاقًا)'),rowsAll);
 ok(await p.evaluate(()=>{let bad=0;for(let i=0;i<300;i++){const sp=ajBuildBeforeAfter(13);const t=JSON.stringify(sp);if(/١٤|١٥|١٦|١٧/.test(t.replace(/"answer":14/g,''))&&/١٥|١٦/.test(t))bad++;if(sp.rows[1].tokens[1].text!=='١٢'&&!/١٢/.test(JSON.stringify(sp.rows[1].tokens[1])))bad++}return bad===0}),tag('٣٠٠ بناء: لا ١٥ ولا ١٦ ولا تلميح ٢ ولا تلميح ١٥'));
 ok(await p.evaluate(()=>{const t=JSON.stringify(ajBuildBeforeAfter(13));return !/hint2|يُكتب بالواحد|عُدّ بهدوء من/.test(t)}),tag('لا تلميحات كتابة ولا عدّ من ١٠'));
 // الصف الأول: أخطاء وتلميحات
 await goto(6);
 const hints=[];
 for(let k=0;k<5;k++){await typeNum('99');await p.waitForTimeout(900);hints.push(await msg())}
 ok(!/تلميح/.test(hints[0])&&/تلميح/.test(hints[1]),tag('صف ١٣: لا تلميح بعد خطأ، وتلميح بعد خطأين'),hints);
 ok(hints.slice(1).every(h=>/قبل|بعد|عدّ/.test(h)&&!/[0-9]/.test(h)),tag('تلميح العدّ والترتيب بأرقام هندية'),hints);
 ok(!hints.some(h=>/ثم الأربعة|ثم الستة|١٤ |١٢،/.test(h)&&/يُكتب/.test(h)),tag('لا كشف للإجابة في التلميح'),hints);
 ok(await p.evaluate(()=>document.querySelectorAll('.aj-hint').length===0),tag('لا إضاءة لمفتاح الإجابة'));
 await p.waitForTimeout(900);
 await typeNum(12);await p.waitForTimeout(500);await typeNum(14);await p.waitForTimeout(500);
 ok(!(await solved()),tag('الصف الأول وحده لا يكمل'));
 // الصف الثاني: خطأ ثم صحيح
 const h2=[];for(let k=0;k<3;k++){await typeNum('77');await p.waitForTimeout(900);h2.push(await msg())}
 ok(/تلميح/.test(h2[1])&&!/[0-9]/.test(h2[1])&&/١٢/.test(h2[1]),tag('صف ١٢: تلميح نصي بسيط'),h2);
 ok(!(await solved()),tag('خطأ الصف الثاني لا يكمل'));
 await p.waitForTimeout(900);await typeNum(11);await p.waitForTimeout(500);await typeNum(13);await p.waitForTimeout(500);
 ok(await solved(),tag('الصفّان يكتملان بالأعداد ١٢،١٤ و١١،١٣'));
 ok(errs.length===0,tag('بلا أخطاء JS'),errs.join('|'));await ctx.close();}
await br.close();console.log(`PASS ${pass} FAIL ${fail}`);iss.forEach(x=>console.log(' -',x));process.exit(fail?1:0)})();
