/* اختبارات «تحدي أبطال الجمع». التشغيل: node tests/heroes.test.js  (يحتاج خادمًا ثابتًا على PORT، الافتراضي 8981) */
const {chromium}=require(process.env.PW||'/opt/npm-tools/node_modules/playwright');
const PORT=process.env.PORT||8981,URL=`http://127.0.0.1:${PORT}/addition-heroes/index.html`;
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
const VPS={'1920x1080':[1920,1080],'1366x768':[1366,768],'1280x720':[1280,720],'3840x2160':[3840,2160],'1920x1200(16:10)':[1920,1200],'1024x600':[1024,600],'800x1280(portrait)':[800,1280]};
async function mk(w,h,opts={}){const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:false});
 await ctx.addInitScript(()=>{window.__actx=0;const A=window.AudioContext||window.webkitAudioContext;if(A){window.AudioContext=function(){window.__actx++;return new A()}}});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>m.type()==='error'&&!/ERR_TUNNEL|fonts\.g/.test(m.text())&&errs.push(m.text()));
 const reqs=[];p.on('request',r=>reqs.push(r.url()));
 await p.goto(URL+(opts.q||''));await p.waitForTimeout(300);const cdp=await ctx.newCDPSession(p);return {br,ctx,p,cdp,errs,reqs};}
const centerOf=(p,sel)=>p.evaluate(s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}},sel);
const rightBtn=(p,l)=>p.evaluate(l=>{const L=__heroes.lanes[l-1];const b=L.ansBtns.find(b=>+b.dataset.val===L.q.sum);const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}},l);
const wrongBtn=(p,l)=>p.evaluate(l=>{const L=__heroes.lanes[l-1];const b=L.ansBtns.find(b=>+b.dataset.val!==L.q.sum&&!b.disabled);const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}},l);
const st=p=>p.evaluate(()=>__heroes.lanes.map(L=>({c:L.correct,w:L.wrongs,d:L.done,k:L.q&&L.q.key})));
const T=(cdp,type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q.x,y:q.y,id:q.id!=null?q.id:i+1}))});
(async()=>{
 /* 1) توليد الأسئلة */
 {const {br,p}=await mk(1920,1080);
  const r=await p.evaluate(()=>{const o={bad:[],n:0};[{max:5},{max:5},{max:10}].forEach((cfg,ci)=>{let prev=null;for(let i=0;i<3000;i++){const q=__heroes.genQuestion(cfg,prev);o.n++;
   if(q.a<1||q.b<1||q.sum!==q.a+q.b||q.sum>cfg.max)o.bad.push('range '+q.key);
   if(new Set(q.options).size!==3||q.options.indexOf(q.sum)<0||q.options.some(v=>v<1||v>cfg.max))o.bad.push('opts '+q.key+' '+q.options);
   if(q.key===prev)o.bad.push('repeat '+q.key);prev=q.key}});
   const pos=[0,0,0];for(let i=0;i<900;i++){const q=__heroes.genQuestion({max:10},null);pos[q.options.indexOf(q.sum)]++}o.pos=pos;return o});
  ok(r.n===9000&&r.bad.length===0,'9000 questions valid: sum<=max, 3 distinct options incl. answer, no immediate repeat',r.bad.slice(0,3).join(' | '));
  ok(r.pos.every(x=>x>200),'correct answer position is spread over the 3 buttons',r.pos.join());
  await br.close();}
 /* 2) التخطيط على أحجام مختلفة */
 for(const [name,[w,h]] of Object.entries(VPS)){
  const {br,p,errs}=await mk(w,h);
  const r=await p.evaluate(()=>{const W=innerWidth,H=innerHeight,o={bad:[]};const de=document.documentElement;
   o.scroll=de.scrollWidth>W||de.scrollHeight>H||document.body.scrollHeight>H;
   const st=document.getElementById('stage').getBoundingClientRect();o.st=[Math.round(st.width),Math.round(st.height)];
   o.stageInside=st.left>=-1&&st.top>=-1&&st.right<=W+1&&st.bottom<=H+1;
   const lr=[...document.querySelectorAll('.lane')].map(l=>l.getBoundingClientRect());o.lw=lr.map(r=>Math.round(r.width));
   const btns=[...document.querySelectorAll('[data-act]')].filter(b=>b.offsetParent);
   btns.forEach(b=>{const r=b.getBoundingClientRect();if(r.left<st.left-1||r.right>st.right+1||r.top<st.top-1||r.bottom>st.bottom+1)o.bad.push('outside '+b.textContent);
     const lane=b.closest('.lane').getBoundingClientRect();if(r.left<lane.left-1||r.right>lane.right+1)o.bad.push('crosses lane '+b.textContent);});
   const ans=[...document.querySelectorAll('.ans')].map(b=>b.getBoundingClientRect());o.minAns=Math.round(Math.min(...ans.map(r=>Math.min(r.width,r.height))));
   o.minBtn=Math.round(Math.min(...btns.map(b=>b.getBoundingClientRect().height)));
   for(let i=0;i<btns.length;i++)for(let j=i+1;j<btns.length;j++){const a=btns[i].getBoundingClientRect(),b=btns[j].getBoundingClientRect();if(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom)o.bad.push('overlap '+btns[i].textContent+'/'+btns[j].textContent)}
   const txt=document.getElementById('lanes').innerText;o.latin=/[0-9]/.test(txt);
   o.ov=[...document.querySelectorAll('.lane .q-area')].filter(e=>e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2).length;
   o.cov=0;o.carOut=0;document.querySelectorAll('.lane').forEach(l=>{const R=l.querySelector('.road').getBoundingClientRect(),Q=l.querySelector('.q-area').getBoundingClientRect(),C=l.querySelector('.car').getBoundingClientRect();if(R.bottom>Q.top+1)o.cov++;l.querySelectorAll('.ans').forEach(a=>{const A=a.getBoundingClientRect();if(!(A.top>=R.bottom||A.bottom<=R.top||A.left>=R.right||A.right<=R.left))o.cov++});if(C.left<R.left-1||C.right>R.right+1||C.top<R.top-1||C.bottom>R.bottom+1)o.carOut++;const q=l.querySelector('.q-eq').getBoundingClientRect();l.querySelectorAll('.ans').forEach(a=>{if(q.height<a.getBoundingClientRect().height*0.3)o.cov++})});
   return o});
  ok(r.cov===0,name+' scene does not cover question/answers');ok(r.carOut===0,name+' car inside road scene');
  ok(!r.scroll,name+' no scrolling');ok(r.stageInside,name+' stage inside viewport',JSON.stringify(r.st));
  ok(Math.abs(r.lw[0]-r.lw[1])<=1&&Math.abs(r.lw[1]-r.lw[2])<=1,name+' three equal columns',r.lw.join());
  ok(r.bad.length===0,name+' buttons inside own lane, no overlap',r.bad.slice(0,3).join('|'));
  ok(r.minAns>=(w>=1024&&h>=600?60:44),name+' answer buttons large ('+r.minAns+'px)');
  if(name.indexOf('portrait')<0)ok(r.minBtn>=40,name+' other buttons >=40px ('+r.minBtn+')');
  ok(!r.latin,name+' only Arabic-Indic digits');ok(r.ov===0,name+' question/road content not overflowing',String(r.ov));
  /* 16:9 */
  if(name.indexOf('portrait')<0&&name.indexOf('16:10')<0)ok(Math.abs(r.st[0]/r.st[1]-16/9)<.02,name+' stage is 16:9');
  ok(errs.length===0,name+' no errors',errs.join());await br.close();}
 /* 3) لمس متزامن ٣ نقاط (CDP touch) */
 {const {br,p,cdp,errs}=await mk(1920,1080);
  const pts=[1,2,3].map(async l=>await rightBtn(p,l));const P=await Promise.all(pts);
  P.forEach((q,i)=>q.id=i+1);
  await T(cdp,'touchStart',P);await p.waitForTimeout(80);
  ok(await p.evaluate(()=>document.querySelectorAll('.ans.press').length)===3,'3 simultaneous touchdowns: 3 buttons pressed at once');
  await T(cdp,'touchEnd',[]);await p.waitForTimeout(150);
  let s=await st(p);ok(s.every(x=>x.c===1&&x.w===0),'3 simultaneous taps: every lane scored exactly 1',JSON.stringify(s));
  await p.waitForTimeout(1100);
  /* متتابعة: نزول ١ ثم ٢ ثم ٣، رفع بترتيب مختلف */
  const Q=[await rightBtn(p,1),await rightBtn(p,2),await rightBtn(p,3)];
  await T(cdp,'touchStart',[{...Q[0],id:1}]);await T(cdp,'touchStart',[{...Q[0],id:1},{...Q[1],id:2}]);await T(cdp,'touchStart',[{...Q[0],id:1},{...Q[1],id:2},{...Q[2],id:3}]);
  await T(cdp,'touchEnd',[{...Q[0],id:1},{...Q[1],id:2}]);await p.waitForTimeout(60);   /* بقي الإصبع ٣ فقط */
  await T(cdp,'touchEnd',[]);await p.waitForTimeout(150);
  s=await st(p);ok(s.every(x=>x.c===2),'staggered down/up order: all 3 lanes advanced',JSON.stringify(s));
  await p.waitForTimeout(1100);
  /* إصبع الطالب الأول مضغوط ومعلّق بينما يلعب الآخران */
  const A=await rightBtn(p,1);await T(cdp,'touchStart',[{...A,id:1}]);
  for(let k=0;k<3;k++){const B=await rightBtn(p,2),C=await rightBtn(p,3);
   await T(cdp,'touchStart',[{...A,id:1},{...B,id:2},{...C,id:3}]);await T(cdp,'touchEnd',[{...B,id:2},{...C,id:3}]);await p.waitForTimeout(40);}
  /* ملاحظة: touchEnd بنقاط متبقية يرفع النقاط الأخرى؛ التحقق من استقلال الحالة لا من عدّاد محدد */
  await T(cdp,'touchEnd',[]);await p.waitForTimeout(1200);
  s=await st(p);ok(errs.length===0,'no errors during multi-touch',errs.join());
  ok(s[1].c>=3&&s[2].c>=3,'lanes 2 and 3 kept scoring while finger 1 was held',JSON.stringify(s));
  await br.close();}
 /* 3b) إصبع معلّق حقيقي: نزول ١ (بلا رفع) ثم لعب كامل للمسارين الآخرين ثم رفع ١ */
 {const {br,p,cdp,errs}=await mk(1920,1080);
  const A=await rightBtn(p,1);await T(cdp,'touchStart',[{...A,id:1}]);
  for(let k=0;k<5;k++){const B=await rightBtn(p,2),C=await rightBtn(p,3);
   await T(cdp,'touchStart',[{...A,id:1},{...B,id:2},{...C,id:3}]);await p.waitForTimeout(30);
   await T(cdp,'touchEnd',[{...B,id:2},{...C,id:3}]);   /* رفع ٢ و٣ فقط، ويبقى ١ مضغوطًا */
   await p.waitForTimeout(1000);}
  let s=await st(p);ok(s[1].c===5&&s[2].c===5&&s[1].d&&s[2].d,'held finger on lane 1: lanes 2 and 3 completed their 5 correct answers',JSON.stringify(s));
  ok(s[0].c===0,'lane 1 not affected by others (still pending)',JSON.stringify(s[0]));
  await T(cdp,'touchEnd',[]);await p.waitForTimeout(150);
  s=await st(p);ok(s[0].c===1,'lane 1 finger release scores once',JSON.stringify(s[0]));
  ok(errs.length===0,'no errors (held finger)',errs.join());await br.close();}
 /* 4) استقلال المسارات والخطأ والنجوم والنهاية */
 {const {br,p,cdp,errs}=await mk(1920,1080);
  const W1=await wrongBtn(p,1),R2=await rightBtn(p,2);
  await T(cdp,'touchStart',[{...W1,id:1},{...R2,id:2}]);await T(cdp,'touchEnd',[]);await p.waitForTimeout(150);
  let s=await st(p);ok(s[0].c===0&&s[0].w===1&&s[1].c===1&&s[2].c===0,'lane1 wrong, lane2 right at the same moment: independent',JSON.stringify(s));
  ok(await p.evaluate(()=>__heroes.lanes[0].ansBtns.filter(b=>b.classList.contains('wrong')).length)===1,'wrong choice is dimmed, not penalised');
  ok((await p.evaluate(()=>document.querySelector('#lane1 .q-hint').textContent)).indexOf('حاول')>=0,'retry message');
  const R1=await rightBtn(p,1);await T(cdp,'touchStart',[{...R1,id:1}]);await T(cdp,'touchEnd',[]);await p.waitForTimeout(150);
  s=await st(p);ok(s[0].c===1,'retry after a wrong answer works and awards the star');
  ok(await p.evaluate(()=>document.querySelectorAll('#lane1 .l-stars .on').length)===1&&await p.evaluate(()=>document.querySelectorAll('#lane2 .l-stars .on').length)===1&&await p.evaluate(()=>document.querySelectorAll('#lane3 .l-stars .on').length)===0,'stars are per lane');
  /* مساعدة */
  await p.waitForTimeout(1000);
  const H2=await centerOf(p,'#lane2 [data-act=help]'),H3=await centerOf(p,'#lane3 [data-act=help]');
  await T(cdp,'touchStart',[{...H2,id:1},{...H3,id:2}]);await T(cdp,'touchEnd',[]);await p.waitForTimeout(100);
  ok(await p.evaluate(()=>document.querySelectorAll('#lane2 .help-box .dots i').length)>=2,'lane 2 help shows counting dots');
  ok(await p.evaluate(()=>document.querySelectorAll('#lane3 .help-box svg line').length)>=11,'lane 3 help shows a number line');
  ok(await p.evaluate(()=>document.querySelectorAll('#lane1 .help-box svg, #lane1 .help-box i').length)===0&&!(await p.$('#lane1 [data-act=help]')),'lane 1 has no help button (as specified)');
  /* مساعدة المسار ٢ لا تغيّر ٣ والعكس */
  const a=await p.evaluate(()=>[__heroes.lanes[1].helpOn,__heroes.lanes[2].helpOn]);ok(a[0]&&a[1],'both helps open independently');
  await T(cdp,'touchStart',[{...H2,id:1}]);await T(cdp,'touchEnd',[]);await p.waitForTimeout(80);
  ok(await p.evaluate(()=>[__heroes.lanes[1].helpOn,__heroes.lanes[2].helpOn].join())==='false,true','closing help in lane 2 leaves lane 3 help open');
  /* حتى النهاية في المسار ١: ٥ إجابات */
  await p.evaluate(()=>__heroes.resetLane(__heroes.lanes[0]));
  for(let k=0;k<5;k++){const R=await rightBtn(p,1);await T(cdp,'touchStart',[{...R,id:1}]);await T(cdp,'touchEnd',[]);await p.waitForTimeout(1050);}
  s=await st(p);ok(s[0].c===5&&s[0].d,'lane 1 reaches 5 correct answers and finishes');
  ok(await p.evaluate(()=>!document.querySelector('#lane1 .cele').hidden)&&await p.evaluate(()=>document.querySelectorAll('#lane1 .cele .big-stars svg').length)===5,'calm celebration shown in lane 1 only');
  ok(await p.evaluate(()=>document.querySelector('#lane2 .cele').hidden&&document.querySelector('#lane3 .cele').hidden),'other lanes show no celebration');
  const pos=await p.evaluate(()=>{const L=__heroes.lanes[0],c=L.car.getBoundingClientRect(),r=L.road.getBoundingClientRect(),f=L.road.querySelector('.flag').getBoundingClientRect();return {carLeft:c.left,flagRight:f.right,roadLeft:r.left}});
  ok(pos.carLeft<=pos.flagRight+80,'car reached the finish flag end of the road',JSON.stringify(pos));
  ok(s[1].c===1&&s[2].c===0,'other lanes unchanged by lane 1 finishing',JSON.stringify(s));
  /* أزرار المسار المنتهي معطّلة/مغطاة، ويمكن إعادة هذا المسار وحده */
  const RS=await centerOf(p,'#lane1 .cele [data-act=restart]');await T(cdp,'touchStart',[{...RS,id:1}]);await T(cdp,'touchEnd',[]);await p.waitForTimeout(150);
  s=await st(p);ok(s[0].c===0&&!s[0].d&&s[1].c===1,'restart of lane 1 only: lane 1 back to 0, lane 2 keeps its star',JSON.stringify(s));
  const RS3=await centerOf(p,'#lane3 [data-act=restart]');
  await T(cdp,'touchStart',[{...RS3,id:1}]);await T(cdp,'touchEnd',[]);await p.waitForTimeout(100);
  ok((await st(p))[1].c===1,'restart in lane 3 does not touch lane 2');
  ok(errs.length===0,'no errors (independence)',errs.join());await br.close();}
 /* 5) لا مؤقت: الانتظار الطويل لا يغيّر شيئًا */
 {const {br,p,errs}=await mk(1920,1080);const a=await st(p);await p.waitForTimeout(6000);const b=await st(p);ok(JSON.stringify(a)===JSON.stringify(b),'no timers: nothing changes while waiting');
  ok(await p.evaluate(()=>!document.body.innerText.match(/ترتيب|الفائز|الخاسر|الأول من|مؤقت|ثانية/)),'no ranking / winners / timer text');
  /* 6) الصوت مغلق افتراضيًا */
  ok(await p.evaluate(()=>document.getElementById('toolSound').getAttribute('aria-pressed'))==='false'&&await p.evaluate(()=>window.__actx)===0,'sound is off by default (no AudioContext created)');
  const R=await rightBtn(p,2);await p.touchscreen.tap(R.x,R.y);await p.waitForTimeout(150);ok(await p.evaluate(()=>window.__actx)===0,'answering with sound off creates no audio');
  const ST=await centerOf(p,'#toolSound');await p.touchscreen.tap(ST.x,ST.y);await p.waitForTimeout(100);
  ok(await p.evaluate(()=>document.getElementById('toolSound').getAttribute('aria-pressed'))==='true','sound can be switched on');
  ok(await p.evaluate(()=>localStorage.length+sessionStorage.length)===0,'no storage used (student data untouched)');
  ok(errs.length===0,'no errors (timers/sound)',errs.join());await br.close();}
 /* 7) وضع اختبار اللمس */
 {const {br,p,cdp,errs}=await mk(1920,1080);
  const TT=await centerOf(p,'#toolTouch');await p.touchscreen.tap(TT.x,TT.y);await p.waitForTimeout(100);
  ok(await p.evaluate(()=>!document.getElementById('touchPanel').hidden),'touch-test mode panel opens');
  const pts=[{x:300,y:600,id:11},{x:960,y:600,id:12},{x:1600,y:600,id:13}];
  await T(cdp,'touchStart',pts);await p.waitForTimeout(100);
  let r=await p.evaluate(()=>({now:document.getElementById('tpNow').textContent,max:document.getElementById('tpMax').textContent,lane:document.getElementById('tpLane').textContent,dots:document.querySelectorAll('.tp-dot').length,log:document.getElementById('tpLog').innerText}));
  ok(r.now==='٣'&&r.max==='٣'&&r.dots===3,'shows 3 simultaneous touches and 3 markers',JSON.stringify(r));
  ok(/١/.test(r.lane)&&/٢/.test(r.lane)&&/٣/.test(r.lane),'reports which lanes are touched',r.lane);
  await T(cdp,'touchMove',[{x:320,y:640,id:11},{x:980,y:640,id:12},{x:1620,y:640,id:13}]);await p.waitForTimeout(80);
  const dpos=await p.evaluate(()=>[...document.querySelectorAll('.tp-dot')].map(d=>[parseInt(d.style.left),parseInt(d.style.top)]));
  ok(dpos.some(d=>Math.abs(d[0]-320)<4&&Math.abs(d[1]-640)<4),'markers follow finger positions',JSON.stringify(dpos));
  await T(cdp,'touchEnd',[]);await p.waitForTimeout(100);
  r=await p.evaluate(()=>({now:document.getElementById('tpNow').textContent,max:document.getElementById('tpMax').textContent,dots:document.querySelectorAll('.tp-dot').length}));
  ok(r.now==='٠'&&r.max==='٣'&&r.dots===0,'after release: now 0, max stays 3, markers removed',JSON.stringify(r));
  /* ٥ لمسات (حد أعلى نظري لعدد الأصابع في الاختبار) */
  await T(cdp,'touchStart',[1,2,3,4,5].map(i=>({x:200*i,y:500,id:20+i})));await p.waitForTimeout(80);
  ok(await p.evaluate(()=>document.getElementById('tpMax').textContent)==='٥','counts 5 simultaneous touches');await T(cdp,'touchEnd',[]);
  ok(errs.length===0,'no errors (touch test)',errs.join());await br.close();}
 /* 8) فأرة ولوحة مفاتيح كبدائل */
 {const {br,p,errs}=await mk(1366,768);const R=await rightBtn(p,3);await p.mouse.click(R.x,R.y);await p.waitForTimeout(100);ok((await st(p))[2].c===1,'mouse click works');
  await p.waitForTimeout(1000);await p.evaluate(()=>{const L=__heroes.lanes[0];L.ansBtns.find(b=>+b.dataset.val===L.q.sum).focus()});await p.keyboard.press('Enter');await p.waitForTimeout(100);ok((await st(p))[0].c===1,'keyboard Enter works');
  /* رفع الإصبع خارج الزر لا يحتسب */
  const R2=await rightBtn(p,2),cdp=await p.context().newCDPSession(p);await T(cdp,'touchStart',[{...R2,id:1}]);await T(cdp,'touchMove',[{x:R2.x,y:R2.y-400,id:1}]);await T(cdp,'touchEnd',[]);await p.waitForTimeout(100);
  ok((await st(p))[1].c===0,'sliding the finger off a button cancels the tap (no accidental answer)');
  ok(errs.length===0,'no errors (mouse/keyboard)',errs.join());await br.close();}
 console.log('heroes tests:',pass,'pass',fail,'fail');process.exit(fail?1:0);
})();
