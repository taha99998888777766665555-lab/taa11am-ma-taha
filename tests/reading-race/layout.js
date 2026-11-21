const {chromium}=require('playwright');
const VPS=[['m320',320,640,true],['m390',390,844,true],['land-phone',844,390,true],['tablet',820,1180,true],['tablet-land',1180,820,true],['desk',1366,768,false],['board',1920,1080,true]];
(async()=>{const out=[];const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
for(const [n,w,h,touch] of VPS){const c=await b.newContext({viewport:{width:w,height:h},hasTouch:touch});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto((process.env.BASE||'http://localhost:8123')+'/index.html');await p.waitForTimeout(1000);
 await p.evaluate(()=>showScreen('games'));await p.waitForTimeout(700);
 const card=await p.evaluate(()=>{const r=document.getElementById('openReadingLettersRace').getBoundingClientRect();return {w:Math.round(r.width),h:Math.round(r.height)}});
 await p.click('#openReadingLettersRace');await p.waitForTimeout(400);
 const pick=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,latin:/[0-9]/.test(document.getElementById('readingLettersRace').innerText),letterMin:Math.min(...[...document.querySelectorAll('.rlr-letter')].map(b=>Math.round(Math.min(b.getBoundingClientRect().width,b.getBoundingClientRect().height))))}));
 await p.click('.rlr-letter[data-letter="letter-2"]');await p.click('.rlr-go');await p.waitForTimeout(2500);
 const stars=await p.evaluate(()=>{const q=s=>document.querySelector(s).getBoundingClientRect();const st=q('.rlr-stage'),sb=q('.rlr-steer button');return {stage:[Math.round(st.width),Math.round(st.height)],steerBottom:Math.round(sb.bottom),steerH:Math.round(sb.height),vh:innerHeight,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,latin:/[0-9]/.test(document.getElementById('readingLettersRace').innerText)}});
 // wait gates
 let gates=null;for(let i=0;i<60;i++){await p.waitForTimeout(500);const g=await p.evaluate(()=>!document.querySelector('.rlr-choices').hidden);if(g){await p.waitForTimeout(800);gates=await p.evaluate(()=>{const bs=[...document.querySelectorAll('.rlr-choice')].map(b=>b.getBoundingClientRect());return {bottom:Math.round(Math.max(...bs.map(r=>r.bottom))),minH:Math.round(Math.min(...bs.map(r=>r.height))),minW:Math.round(Math.min(...bs.map(r=>r.width))),vh:innerHeight,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,latin:/[0-9]/.test(document.getElementById('readingLettersRace').innerText)}});break}}
 await p.screenshot({path:`lay_${n}.png`});
 out.push({n,card,pick,stars,gates,errs});await c.close()}
console.log(JSON.stringify(out));await b.close()})()
