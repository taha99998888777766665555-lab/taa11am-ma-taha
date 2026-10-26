/* نشاط ← الرئيسية ← أمام مباشرة (بدون مغادرة الموقع) */
const L=require('./lib.js');
const CASES={lesson3:['words','#wbk3Entry','.wb3-stepbtn'],lesson2:['words','#wbk2Entry'],zoo:['games','[onclick="startZooGame()"]'],balloon:['games',"[onclick=\"startBalloonGame('letters')\"]"],
 matching:['games',"[onclick=\"showScreen('matchingModes')\"]",'[onclick="startNQGame()"]'],aj:['numbers','[onclick="openAJHome()"]','.aj-map-node, [class*=aj-map] button'],race:['games','[onclick="openLetterRaceMap()"]',"[onclick=\"openRaceLetter('أ')\"]"],
 writingPlay:['writing','.wr-tile'],quran:['quran','.quran-surah-card'],letters:['letters','.ltr-level-card-btn','.ltr-letter-card-btn'],addition:['addition']};
const vps=process.argv[2]?[process.argv[2]]:['m390'];
(async()=>{for(const vp of vps){console.log('==',vp);const {br,p,errs}=await L.mk(vp);
 for(const [n,steps] of Object.entries(CASES)){
  await L.open(p);
  for(const s of steps){if(/^[a-zA-Z]+$/.test(s)){await p.evaluate(id=>showScreen(id),s);await p.waitForTimeout(350)}else{await L.tap(p,s).catch(()=>{})}}
  const deep=await L.st(p);
  await p.locator('#hmHomeBtn')[L.VPS[vp].touch?'tap':'click']();await p.waitForTimeout(500);
  await p.goForward().catch(()=>{});await p.waitForTimeout(900);
  const f=await L.st(p);const chain=[f.scr];for(let i=0;i<4;i++){await p.goForward().catch(()=>{});await p.waitForTimeout(700);const x=await L.st(p);const d=await p.evaluate(()=>{const a=document.querySelector('.screen.active');return a.id+':'+a.innerText.trim().length}).catch(()=>'?');chain.push(d+'|'+(x.stack||[]).join('>'))}
  const info=await p.evaluate(()=>{const a=document.querySelector('.screen.active');const vis=e=>e.getBoundingClientRect().width>0;return {textLen:a.innerText.trim().length,btns:[...a.querySelectorAll('button')].filter(vis).length,home:getComputedStyle(document.getElementById('hmHomeBtn')).display}});
  const b=await L.back(p,600);const b2=await L.back(p,600);
  console.log(`${n.padEnd(11)} deep=${deep.scr.padEnd(12)} chain=${JSON.stringify(chain)} ${JSON.stringify(info)} | back→${b.scr} back→${b2.scr}`);
 }
 console.log(errs);await br.close()}})();
