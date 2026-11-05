/* لعب كامل بالفأرة لكل الأعداد ١–١٠: قواعد القرش والعدّ والصوت والتقدم. PORT=8992 VP=desktop */
const L=require('./lib.js');const vp=process.env.VP||'desktop';
(async()=>{const {br,p,errs}=await L.open(vp);await L.enter(p);
 for(let N=1;N<=10;N++){
  await p.evaluate(n=>{__subGame.audioLog.length=0;__subGame.startRound({type:'num',n})},N);await p.waitForTimeout(400);
  let s=await L.state(p);
  L.ok(s.target===N&&s.count===0&&s.phase==='play',`N=${N}: بداية الجولة`,s);
  const total=await p.evaluate(()=>__subGame.G.fish.length);
  const expectTotal={1:3,2:5,3:6,4:8,5:9,6:11,7:12,8:13,9:14,10:14}[N];
  L.ok(total===expectTotal,`N=${N}: عدد الأسماك ${expectTotal}`,total);
  L.ok(N===1?s.shark:!s.shark,`N=${N}: القرش ${N===1?'موجود من البداية (العدد ١)':'غائب قبل دوره'}`,s.shark);
  L.ok(s.audio[0]==='say:'+N,`N=${N}: ينطق العدد المطلوب عند البدء`,s.audio);
  // الأسماك العادية: N-1
  for(let k=0;k<N-1;k++){
   const h=await L.hatchXY(p);const f=await L.pickFish(p);
   await L.dragMouse(p,f,h);await p.waitForTimeout(650);
   s=await L.state(p);
   L.ok(s.count===k+1,`N=${N}: بعد السمكة ${k+1} العداد ${k+1}`,{c:s.count});
   if(k+1<N-1)L.ok(!s.shark,`N=${N}: القرش لم يظهر بعد (${k+1}/${N-1})`);
  }
  if(N>=2){
   s=await L.state(p);
   L.ok(s.shark&&s.count===N-1,`N=${N}: القرش يظهر عند ${N-1}`,s);
   // سمكة عادية الآن لا تُحتسب
   const h=await L.hatchXY(p);const f=await L.pickFish(p);
   const before=await L.state(p);
   await L.dragMouse(p,f,h);await p.waitForTimeout(700);
   s=await L.state(p);
   L.ok(s.count===N-1&&s.phase==='play',`N=${N}: السمكة العادية بعد ${N-1} لا تُحتسب`,s);
   L.ok(s.stats.rejected>before.stats.rejected,`N=${N}: سُجّل الرفض`);
  } else {
   const h=await L.hatchXY(p);const f=await L.pickFish(p);
   await L.dragMouse(p,f,h);await p.waitForTimeout(700);
   s=await L.state(p);
   L.ok(s.count===0,`N=1: السمكة العادية لا تُحتسب (القرش هو المطلوب)`,s);
  }
  // سحب القرش (ينتظر دخوله إلى الشاشة)
  try{await p.waitForFunction(()=>{const f=__subGame.G.shark;return f&&!f.entering},null,{timeout:8000})}catch(e){console.log('NO-SHARK N='+N,JSON.stringify(await L.state(p)).slice(0,400));await p.screenshot({path:'/tmp/noshark.png'});throw e}
  await p.waitForTimeout(300);
  const sh=await p.evaluate(()=>{const f=__subGame.G.shark;return {x:f.x,y:f.y}});
  const h=await L.hatchXY(p);
  await L.dragMouse(p,sh,h,380);await p.waitForTimeout(900);
  s=await L.state(p);
  L.ok(s.count===N&&s.phase==='win',`N=${N}: القرش يكمل العدد (${s.count}/${N}) والفوز`,s);
  // الصوت: كل عدد مرة واحدة وبالترتيب ثم العبارة الختامية
  const nums=s.audio.filter(a=>/^say:\d+$/.test(a)).map(a=>Number(a.slice(4)));
  const expect=[N].concat(Array.from({length:N},(_,i)=>i+1));
  L.ok(JSON.stringify(nums)===JSON.stringify(expect),`N=${N}: ترتيب الأصوات`,nums);
  L.ok(s.audio[s.audio.length-1]==='say:أحسنت يا بطل',`N=${N}: تشجيع صوتي في النهاية`,s.audio.slice(-3));
  await p.waitForTimeout(3500);
  const win=await p.evaluate(()=>({hidden:document.getElementById('sgWin').hidden,txt:document.getElementById('sgWin').innerText}));
  L.ok(!win.hidden&&/أحسنت يا بطل/.test(win.txt),`N=${N}: شاشة الفوز`,win.txt.slice(0,40));
 }
 const prog=await p.evaluate(()=>JSON.parse(localStorage.getItem('taha_submarine_progress_v1')||'{}'));
 L.ok(prog.rounds===10&&[1,2,3,4,5,6,7,8,9,10].every(n=>prog.targets[n]===1),'التقدم المحفوظ',prog);
 L.ok(errs.length===0,'لا أخطاء JS',errs.slice(0,3));
 console.log(`play[${vp}]`);await br.close();process.exit(L.summary('play')?1:0)})();
