/* مسارات الأقسام والأنشطة بالنقر الفعلي: الرجوع لا يُخرج قبل الرئيسية، والرئيسية تطوي المسار، والتخزين لا يتغير */
const L=require('./lib.js');
const only=process.argv[2]?[process.argv[2]]:Object.keys(L.VPS);
const T=(s)=>`[onclick="${s}"]`;
const PATHS={
 'balloon':['games',T("startBalloonGame('letters')")],
 'numBalloon':['games',T('startNumberBalloonGame()')],
 'race-map':['games',T('openLetterRaceMap()')],
 'race-letter':['games',T('openLetterRaceMap()'),T("openRaceLetter('أ')")],
 'builder':['games',T('startWBGame()')],
 'zoo':['games',T('startZooGame()')],
 'sort':['games',T('openSortGame()')],
 'matching-modes':['games',T("showScreen('matchingModes')")],
 'match-nq':['games',T("showScreen('matchingModes')"),T('startNQGame()')],
 'match-forms':['games',T("showScreen('matchingModes')"),T('startFormsMatchingGame()')],
 'match-ol':['games',T("showScreen('matchingModes')"),T('startOLGame()')],
 'match-pw':['games',T("showScreen('matchingModes')"),T('startPWGame()')],
 'match-lw':['games',T("showScreen('matchingModes')"),T("startMatchingGame('letterform-word')")],
 'words-level':['words',T('openWordsLevel(1)')],
 'lesson1':['words','#wbkEntry'],
 'lesson2':['words','#wbk2Entry'],
 'lesson3':['words','#wbk3Entry'],
 'numbers-aj':['numbers',T('openAJHome()')],
 'addition-level':['addition'],
 'subtraction-level':['subtraction'],
 'rewards':['rewards'],'dailyQuest':['dailyQuest'],'teacher':['teacher'],'profile':['profile'],'settings':['settings'],'duas':['duas'],'numbers':['numbers'],
};
(async()=>{for(const vp of only){console.log('== ',vp);
 const {br,p,errs}=await L.mk(vp);
 for(const [name,steps] of Object.entries(PATHS)){
   await L.open(p);
   const seen=[];
   for(const s of steps){
     if(/^[a-zA-Z]+$/.test(s)){await p.evaluate(id=>showScreen(id),s);await p.waitForTimeout(400)}
     else {try{await L.tap(p,s)}catch(e){L.ok(false,`${vp} ${name}: تعذّر النقر على ${s}`)}}
     seen.push((await L.st(p)).scr);
   }
   const before=await L.snapLS(p);
   const depth=(await L.st(p)).stack;
   const got=[];let r;
   for(let i=0;i<8;i++){r=await L.back(p,380);got.push(r.scr);if(r.scr==='(غادر التطبيق)')break}
   const iHome=got.indexOf('home'),iExit=got.indexOf('(غادر التطبيق)');
   L.ok(iHome>=0&&iExit===iHome+1,`${name}@${vp}: الرجوع يصل للرئيسية ثم يخرج فقط`,{seen,got});
   L.ok(got.length<=7,`${name}@${vp}: لا حلقة رجوع`,got);
   // التخزين بعد الرجوع حتى الرئيسية (قبل الخروج)
   await L.open(p);
   for(const s of steps){if(/^[a-zA-Z]+$/.test(s)){await p.evaluate(id=>showScreen(id),s);await p.waitForTimeout(400)}else{try{await L.tap(p,s)}catch(e){}}}
   const b2=await L.snapLS(p);
   for(let i=0;i<8;i++){const x=await L.st(p);if(x.scr==='home')break;await L.back(p,380)}
   const a2=await L.snapLS(p);
   L.ok(b2===a2,`${name}@${vp}: الرجوع لا يغيّر التخزين (النجوم/التقدم)`);
   // زر الرئيسية في الشريط
   await L.open(p);
   for(const s of steps){if(/^[a-zA-Z]+$/.test(s)){await p.evaluate(id=>showScreen(id),s);await p.waitForTimeout(400)}else{try{await L.tap(p,s)}catch(e){}}}
   const vis=await p.evaluate(()=>{const b=document.getElementById('hmHomeBtn');const r=b.getBoundingClientRect();const h=getComputedStyle(document.querySelector('header')).display;return {w:Math.round(r.width),h:Math.round(r.height),shown:r.width>0,hdr:h}});
   if(vis.hdr!=='none'){
     L.ok(vis.shown&&vis.w>=44&&vis.h>=44,`${name}@${vp}: زر الرئيسية ظاهر وحجمه ≥٤٤`,vis);
     await p.locator('#hmHomeBtn').tap({timeout:3000}).catch(async()=>{L.ok(false,`${name}@${vp}: تعذّر لمس زر الرئيسية`)});
     await p.waitForTimeout(500);
     const s2=await L.st(p);
     L.ok(s2.scr==='home'&&s2.stack.length===1,`${name}@${vp}: الرئيسية تطوي المسار`,s2);
     const e=await L.back(p);L.ok(e.scr==='(غادر التطبيق)',`${name}@${vp}: الرجوع من الرئيسية يخرج`,e);
   }
 }
 console.log(vp,'errors:',errs);await br.close()}
 process.exit(L.summary('walk2')?1:0)})();
