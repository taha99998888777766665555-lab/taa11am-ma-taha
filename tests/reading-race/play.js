const {chromium}=require('playwright');
const L=process.argv[2]||'letter-2', WRONG=+(process.argv[3]||0);
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const p=await b.newPage({viewport:{width:1366,height:768}});
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text())});p.on('response',r=>{if(r.status()>=400)errs.push(r.status()+' '+r.url())});
await p.addInitScript(()=>{window.__ev=[];const P=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const a=this;const id=(window.__aid=(window.__aid||0)+1);a.__id=id;window.__ev.push({t:Math.round(performance.now()),e:'play',id});a.addEventListener('ended',()=>window.__ev.push({t:Math.round(performance.now()),e:'ended',id}),{once:true});a.addEventListener('pause',()=>{if(!a.ended)window.__ev.push({t:Math.round(performance.now()),e:'pause',id})});return P.apply(this,arguments)}});
await p.goto((process.env.BASE||'http://localhost:8123')+'/index.html');await p.waitForTimeout(1200);
await p.evaluate(()=>showScreen('games'));await p.waitForTimeout(800);await p.click('#openReadingLettersRace');await p.waitForTimeout(300);
await p.click(`.rlr-letter[data-letter="${L}"]`);await p.click('.rlr-go');
const log=[];const t0=Date.now();let wrongLeft=WRONG,round=0,lastFin=false;
while(Date.now()-t0<170000){
 await p.waitForTimeout(250);
 const st=await p.evaluate(()=>({fin:!document.querySelector('.rlr-game').hidden&&!document.querySelector('.rlr-finish').hidden,gates:!document.querySelector('.rlr-choices').hidden,stats:document.querySelector('.rlr-stats').textContent,stars:document.querySelector('.rlr-steer').hidden}));
 if(st.fin){lastFin=true;break}
 if(st.gates){
  const info=await p.$$eval('.rlr-choice',bs=>bs.map(b=>({id:b.dataset.id,dis:b.disabled,t:b.textContent})));
  if(info.every(x=>x.dis))continue;
  const cur=await p.evaluate(()=>document.querySelector('.rlr-stats').textContent);
  const ok=info.findIndex(x=>x.id===L&&!x.dis);
  if(wrongLeft>0&&round===0){const w=info.findIndex(x=>x.id!==L&&!x.dis);if(w>=0){wrongLeft--;log.push('wrong click '+w);await p.click(`.rlr-choice[data-lane="${w}"]`,{timeout:3000}).catch(()=>{});await p.waitForTimeout(1500);continue}}
  if(ok>=0){log.push('correct click r'+cur);await p.click(`.rlr-choice[data-lane="${ok}"]`,{timeout:3000}).catch(()=>{});round++;await p.waitForTimeout(1200)}
 }else if(!st.stars===false){ /* steering: nudge to centre */ }
}
const fin=await p.evaluate(()=>({txt:document.querySelector('.rlr-star-finish').textContent,fb:document.querySelector('.rlr-feedback').textContent}));
const ev=await p.evaluate(()=>window.__ev);
console.log(JSON.stringify({L,lastFin,fin,log,errs}));console.log(ev.map(e=>e.e[0]+e.id+'@'+e.t).join(' '));
require('fs').writeFileSync(`ev_${L}.json`,JSON.stringify(ev));
await b.close()})()
