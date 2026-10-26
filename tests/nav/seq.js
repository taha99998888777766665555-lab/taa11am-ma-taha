/* التسلسل: نشاط داخلي ← الرئيسية ← رجوع المتصفح ← أمام المتصفح (وبالعكس: أمام مباشرة بعد الرئيسية) */
const L=require('./lib.js');
const SAFE=['home','letters','words','writing','numbers','addition','subtraction','quran','hadith','duas','games','matchingModes','rewards','dailyQuest','teacher','profile','settings'];
const CASES={lesson3:['words','#wbk3Entry','.wb3-stepbtn'],lesson2:['words','#wbk2Entry'],lesson1:['words','#wbkEntry'],zoo:['games','[onclick="startZooGame()"]'],balloon:['games',"[onclick=\"startBalloonGame('letters')\"]"],
 numBalloon:['games','[onclick="startNumberBalloonGame()"]'],builder:['games','[onclick="startWBGame()"]'],sort:['games','[onclick="openSortGame()"]'],
 matching:['games',"[onclick=\"showScreen('matchingModes')\"]",'[onclick="startNQGame()"]'],aj:['numbers','[onclick="openAJHome()"]'],race:['games','[onclick="openLetterRaceMap()"]',"[onclick=\"openRaceLetter('أ')\"]"],
 writingPlay:['writing','.wr-tile'],quran:['quran','.quran-surah-card'],letters:['letters','.ltr-level-card-btn','.ltr-letter-card-btn'],addition:['addition'],subtraction:['subtraction']};
const vps=process.argv[2]?[process.argv[2]]:['m360','m390','tablet','desktop','board'];
const rich=(p)=>p.evaluate(()=>{const a=document.querySelector('.screen.active');return a?{id:a.id,len:a.innerText.trim().length}:null}).catch(()=>null);
(async()=>{for(const vp of vps){console.log('==',vp);const {br,p,errs}=await L.mk(vp);
 const open=async(steps)=>{await L.open(p);for(const s of steps){if(/^[a-zA-Z]+$/.test(s)){await p.evaluate(id=>showScreen(id),s);await p.waitForTimeout(350)}else{await L.tap(p,s).catch(()=>{})}}};
 const home=async()=>{await p.locator('#hmHomeBtn')[L.VPS[vp].touch?'tap':'click']();await p.waitForTimeout(500)};
 for(const [n,steps] of Object.entries(CASES)){
  // أ) الرئيسية ← رجوع (خروج طبيعي) ← أمام (يعود للرئيسية فقط)
  await open(steps);await home();
  const s1=await L.st(p);L.ok(s1.scr==='home'&&s1.stack.length===1,`${n}@${vp}: الرئيسية`,s1);
  const b=await L.back(p,600);L.ok(b.scr==='(غادر التطبيق)',`${n}@${vp}: الرجوع بعد الرئيسية يخرج ولا يعيد نشاطًا قديمًا`,b);
  await p.goForward().catch(()=>{});await p.waitForTimeout(900);
  let f=await L.st(p);L.ok(f.scr==='home',`${n}@${vp}: الأمام بعد الخروج يعيد الرئيسية`,f);
  for(let i=0;i<3;i++){await p.goForward().catch(()=>{});await p.waitForTimeout(500)}
  f=await L.st(p);L.ok(f.scr==='home',`${n}@${vp}: أمام إضافي لا يفتح حالة قديمة`,f);
  // ب) الرئيسية ← أمام مباشرة (بلا مغادرة): لا يفتح إلا قائمة كاملة
  await open(steps);await home();
  const seen=[];for(let i=0;i<5;i++){await p.goForward().catch(()=>{});await p.waitForTimeout(600);const r=await rich(p);seen.push(r)}
  L.ok(seen.every(r=>r&&SAFE.includes(r.id)&&r.len>100),`${n}@${vp}: الأمام يفتح قوائم كاملة فقط`,seen);
  const st=await L.st(p);L.ok(st.stack.length<=3&&st.stack[0]==='home'&&new Set(st.stack).size===st.stack.length,`${n}@${vp}: المسار متسق بعد الأمام`,st);
  const chain=[];for(let i=0;i<6;i++){const r=await L.back(p,500);chain.push(r.scr);if(r.scr.startsWith('('))break}
  L.ok(chain.indexOf('home')>=0&&chain.indexOf('(غادر التطبيق)')===chain.indexOf('home')+1,`${n}@${vp}: الرجوع بعد الأمام يصل للرئيسية ثم يخرج`,chain);
 }
 console.log(vp,'errors:',errs);await br.close()}
 process.exit(L.summary('seq')?1:0)})();
