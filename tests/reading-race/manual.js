const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const p=await b.newPage({viewport:{width:1366,height:768}});
const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.addInitScript(()=>{window.__ev=[];window.__act=new Set();window.__all=[];const P=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const a=this;const id=(window.__aid=(window.__aid||0)+1);const ov=window.__all.filter(x=>x!==a&&!x.paused&&!x.ended).length;window.__all.push(a);window.__act.add(id);window.__ev.push({t:Math.round(performance.now()),e:'play',id,overlapAtStart:ov});const done=t=>{window.__act.delete(id);window.__ev.push({t:Math.round(performance.now()),e:t,id})};a.addEventListener('ended',()=>done('ended'),{once:true});a.addEventListener('pause',()=>{if(!a.ended)done('pause')});return P.apply(this,arguments)}});
await p.goto((process.env.BASE||'http://localhost:8123')+'/index.html');await p.waitForTimeout(1200);
await p.evaluate(()=>showScreen('games'));await p.waitForTimeout(800);await p.click('#openReadingLettersRace');
await p.click('.rlr-letter[data-letter="letter-2"]');await p.click('.rlr-go');
// wait for gates
for(let i=0;i<80;i++){await p.waitForTimeout(400);if(await p.evaluate(()=>!document.querySelector('.rlr-choices').hidden))break}
await p.waitForTimeout(800);
const lane=await p.$$eval('.rlr-choice',bs=>bs.findIndex(b=>b.dataset.id==='letter-2'&&!b.disabled));
await p.click(`.rlr-choice[data-lane="${lane}"]`);
// wait until a confirmation play starts then press listen mid-way
const n0=await p.evaluate(()=>window.__ev.filter(e=>e.e==='play').length);
for(let i=0;i<100;i++){await p.waitForTimeout(100);if(await p.evaluate((n)=>window.__ev.filter(e=>e.e==='play').length>n,n0))break}
await p.waitForTimeout(150);await p.click('.rlr-listen');
await p.waitForTimeout(6000);
const ev=await p.evaluate(()=>window.__ev);
console.log(ev.map(e=>e.e[0]+e.id+'@'+e.t+(e.overlapAtStart?'!OVERLAP'+e.overlapAtStart:'')).join(' '));
console.log('maxOverlapAtStart',Math.max(...ev.filter(e=>e.e==='play').map(e=>e.overlapAtStart)),'errs',errs);
await b.close()})()
