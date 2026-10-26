const L=require('./lib.js');
(async()=>{const vp=process.argv[2]||'m390';const {br,p,errs}=await L.mk(vp);
 const det=()=>p.evaluate(()=>{const a=document.querySelector('.screen.active');return a.id+' | '+(taNav.stack().join('>'))+' | '+[...a.querySelectorAll('h2,h3,.wb3-title,.ltr-title')].filter(e=>e.getBoundingClientRect().width>0).slice(0,2).map(e=>e.textContent.trim().slice(0,20)).join('/')});
 const run=async(name,steps)=>{await L.open(p);for(const s of steps){if(/^[a-zA-Z0-9]+$/.test(s)){await p.evaluate(id=>showScreen(id),s);await p.waitForTimeout(350)}else{try{await L.tap(p,s)}catch(e){console.log('  !tap',s)}}}
  const tr=[await det()];for(let i=0;i<7;i++){await L.goBack;const r=await L.back(p,450);tr.push(r.scr==='(غادر التطبيق)'?'EXIT':await det());if(r.scr==='(غادر التطبيق)')break}
  console.log('##',name);tr.forEach(x=>console.log('   ',x))};
 await run('letters run',['letters','.ltr-level-card-btn','.ltr-letter-card-btn','.ltr-stage-card']);
 await run('addition level',['addition','#addition .add2-level-card, #addition [onclick*="Level"]']);
 await run('words level',['words','[onclick="openWordsLevel(1)"]']);
 await run('lesson3 activity',['words','#wbk3Entry','.wb3-stepbtn']);
 await run('quran surah',['quran','.quran-surah-card']);
 await run('balloon levels',['games',"[onclick=\"startBalloonGame('letters')\"]",'.pop-level, .pop-lv, [class*=pop-level]']);
 await run('aj',['numbers','[onclick="openAJHome()"]','.aj-map-node, .aj-node, [class*=aj-map] button']);
 await run('race letter',['games','[onclick="openLetterRaceMap()"]',"[onclick=\"openRaceLetter('أ')\"]",'.race-stage-card, [class*=race-stage]']);
 console.log(errs);await br.close()})();
