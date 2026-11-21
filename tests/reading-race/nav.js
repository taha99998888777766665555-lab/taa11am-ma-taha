const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const p=await b.newPage({viewport:{width:1366,height:768}});
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text())});
await p.addInitScript(()=>{window.__au=[];const P=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__au.push(this);return P.apply(this,arguments)};window.__playing=()=>window.__au.filter(a=>!a.paused&&!a.ended).length});
await p.goto((process.env.BASE||'http://localhost:8123')+'/index.html');await p.waitForTimeout(1200);
const R={};
const open=async()=>{await p.evaluate(()=>showScreen('games'));await p.waitForTimeout(700);await p.click('#openReadingLettersRace');await p.waitForTimeout(300)};
const act=()=>p.evaluate(()=>document.querySelector('.screen.active').id);
// 1 open, pick, start, then manual listen x3 quick (no overlap)
await open();await p.click('.rlr-letter[data-letter="letter-2"]');await p.click('.rlr-go');await p.waitForTimeout(1500);
for(let i=0;i<3;i++){await p.click('.rlr-listen');await p.waitForTimeout(150)}
R.playingAfterQuick=await p.evaluate(()=>window.__playing());
// 2 "اختيار حرف آخر" (back button inside race) stops audio and returns picker
await p.click('.rlr-back');await p.waitForTimeout(300);
R.afterBack={screen:await act(),playing:await p.evaluate(()=>window.__playing()),picker:await p.evaluate(()=>!document.querySelector('.rlr-pick').hidden),stageEmpty:await p.evaluate(()=>document.querySelector('.rlr-stage').children.length)};
// 3 switch letter, start again
await p.click('.rlr-letter[data-letter="letter-5"]');await p.click('.rlr-go');await p.waitForTimeout(1200);
R.restart=await p.evaluate(()=>({txt:document.querySelector('.rlr-feedback').textContent,canv:document.querySelectorAll('.rlr-stage canvas').length}));
// 4 leave via global showScreen('home') during audio
await p.click('.rlr-listen');await p.waitForTimeout(200);
await p.evaluate(()=>showScreen('home'));await p.waitForTimeout(400);
R.afterHome={screen:await act(),playing:await p.evaluate(()=>window.__playing()),stageKids:await p.evaluate(()=>document.querySelector('.rlr-stage').children.length)};
// 5 reopen: fresh picker, start works, back to games
await open();R.reopen=await p.evaluate(()=>({pickerShown:!document.querySelector('.rlr-pick').hidden,sel:document.querySelectorAll('.rlr-on').length}));
await p.click('.rlr-back');await p.waitForTimeout(500);R.backGames=await act();
// 6 browser history back from reading screen -> games
await open();await p.click('.rlr-letter[data-letter="letter-1"]');await p.click('.rlr-go');await p.waitForTimeout(1200);
await p.goBack();await p.waitForTimeout(700);R.histBack1={screen:await act(),playing:await p.evaluate(()=>window.__playing())};
await p.goBack();await p.waitForTimeout(700);R.histBack2=await act();
// 7 reduced old games still open: letter race map, matching, balloons
const olds={};
for(const [id,fn] of [['letterRaceMap',"openLetterRaceMap()"],['matching',"showScreen('matchingModes')"],['addition',"showScreen('addition')"],['words',"showScreen('words')"]]){
 await p.evaluate(fn);await p.waitForTimeout(600);olds[id]=await act()}
R.olds=olds;R.errs=errs;
console.log(JSON.stringify(R,null,1));await b.close()})()
