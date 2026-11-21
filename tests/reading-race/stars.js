const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const p=await b.newPage({viewport:{width:1366,height:768}});
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
await p.goto((process.env.BASE||'http://localhost:8123')+'/index.html');await p.waitForTimeout(1200);
const snap=()=>p.evaluate(()=>JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));
await p.evaluate(()=>showScreen('games'));await p.waitForTimeout(800);
const before=await snap();const starsBefore=await p.evaluate(()=>typeof stars!=='undefined'?stars:null);
await p.click('#openReadingLettersRace');await p.click('.rlr-letter[data-letter="letter-2"]');await p.click('.rlr-go');
const counts=[];let k=0;const t0=Date.now();
while(Date.now()-t0<120000){await p.waitForTimeout(350);
 const st=await p.evaluate(()=>({fin:!document.querySelector('.rlr-finish').hidden,gates:!document.querySelector('.rlr-choices').hidden,stars:!document.querySelector('.rlr-steer').hidden,c:document.querySelector('.rlr-star-count')?.textContent}));
 if(st.fin)break;
 if(st.stars){await p.click(`.rlr-steer button:nth-child(${(k++%3)+1})`)}
 if(st.gates){const id=await p.$$eval('.rlr-choice',bs=>bs.map(b=>[b.dataset.id,b.disabled]));const i=id.findIndex(x=>x[0]==='letter-2'&&!x[1]);if(i>=0)await p.click(`.rlr-choice[data-lane="${i}"]`)}
 counts.push(st.c)}
const fin=await p.evaluate(()=>document.querySelector('.rlr-star-finish').textContent);
const after=await snap();const starsAfter=await p.evaluate(()=>typeof stars!=='undefined'?stars:null);
console.log(JSON.stringify({fin,max:[...new Set(counts)].slice(-4),storageSame:before===after,starsBefore,starsAfter,errs}));
await b.close()})()
