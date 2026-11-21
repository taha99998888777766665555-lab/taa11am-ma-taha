const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto((process.env.BASE||'http://localhost:8123')+'/index.html');await p.waitForTimeout(1200);
await p.evaluate(()=>showScreen('games'));await p.waitForTimeout(800);
await p.tap('#openReadingLettersRace');await p.waitForTimeout(300);
await p.tap('.rlr-letter[data-letter="letter-5"]');await p.tap('.rlr-go');await p.waitForTimeout(2500);
await p.tap('.rlr-steer button:nth-child(1)');await p.waitForTimeout(400);
const lane1=await p.evaluate(()=>__lane||null).catch(()=>null);
let g=false;for(let i=0;i<60;i++){await p.waitForTimeout(500);if(await p.evaluate(()=>!document.querySelector('.rlr-choices').hidden)){g=true;break}}
await p.waitForTimeout(800);
const info=await p.$$eval('.rlr-choice',bs=>bs.map(b=>[b.dataset.id,b.disabled]));
const w=info.findIndex(x=>x[0]!=='letter-5');await p.tap(`.rlr-choice[data-lane="${w}"]`);await p.waitForTimeout(1800);
const after=await p.evaluate(()=>({fb:document.querySelector('.rlr-feedback').textContent,dis:[...document.querySelectorAll('.rlr-choice')].map(b=>b.disabled)}));
let ok=-1,waited=0;for(;waited<12000&&ok<0;waited+=300){await p.waitForTimeout(300);ok=await p.$$eval('.rlr-choice',bs=>bs.findIndex(b=>b.dataset.id==='letter-5'&&!b.disabled))}console.log('wrongDone after',waited);await p.tap(`.rlr-choice[data-lane="${ok}"]`);await p.waitForTimeout(3500);
const next=await p.evaluate(()=>document.querySelector('.rlr-stats').textContent);
console.log(JSON.stringify({g,after,next,errs}));await b.close()})()
