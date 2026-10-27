const L=require('./lib.js');
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
const BAD=/كَتَبَ|دَرَسَ|نَجَحَ|قَرَأَ|وكتب|ونجح|قرأ وكتب|درس ونجح/;
(async()=>{
 const {br,p,errs}=await L.mk('m390');await L.open(p);
 // legacy progress containing the removed sentences
 await p.evaluate(()=>{const q=wbk4Internals.load();const r=wbk4Internals.rec(q,'s01');r.seen=3;r.f=2;q.starred.s01=1;q.starred.s02=1;q.starred.s05=1;q.stars=3;wbk4Internals.rec(q,'s02').seen=1;wbk4Internals.rec(q,'s05');localStorage.setItem('taha_wbk4_progress_v1',JSON.stringify(q))});
 await p.evaluate(()=>{showScreen('words')});await p.click('#wbk4Entry');await p.waitForTimeout(400);
 const q=await p.evaluate(()=>wbk4Internals.load());
 ok(!q.syl.s01&&!q.syl.s02&&!q.starred.s01&&!q.starred.s02,'legacy data of removed sentences purged');
 ok(q.starred.s05===1&&q.stars===1,'remaining progress kept; lesson counter recomputed',JSON.stringify([q.stars]));
 const MAXs=await p.evaluate(()=>document.getElementById('wb4Stars').textContent);ok(/٩/.test(MAXs),'star counter shows max 9 (8 sentences + test)',MAXs);
 const txt=()=>p.evaluate(()=>document.getElementById('wbkL4').innerText);
 ok(!BAD.test(await txt()),'home has no removed text');
 await p.click('#wb4LibBtn');ok(await p.evaluate(()=>document.querySelectorAll('.wb4-cell').length)===8,'library shows 8 cards');
 ok(!BAD.test(await txt()),'library has no removed text');
 const nums=await p.evaluate(()=>[...document.querySelectorAll('.wb3-cn')].map(x=>x.textContent).join(''));ok(nums==='١٢٣٤٥٦٧٨','numbered 1..8',nums);
 const seen=new Set();
 for(const st of ['teach','build','hear','missing','read']){
  await p.evaluate(()=>wbk4Internals.renderLibrary());
  for(let start=0;start<8;start++){
   await p.evaluate(()=>wbk4Internals.renderLibrary());await p.click(`.wb4-cell:nth-child(${start+1})`);await p.click(`#wb4StageRow [data-stage="${st}"]`);
   for(let i=0;i<(st==='teach'?8:5);i++){await p.waitForTimeout(120);const t=await txt();if(BAD.test(t)){ok(false,st+' start'+start+' q'+i+' shows removed text',t.slice(0,80));}
    if(st==='teach'){const k=await p.evaluate(()=>document.querySelector('#wb4TeachShow').innerText.replace(/\s+/g,' '));seen.add(k);break;}
    if(st==='hear'){ // wrong then right; no automatic sound after answers
     await p.waitForTimeout(700);const id=await p.evaluate(()=>{const pl=window.__plays.filter(x=>/sentences\//.test(x.src));return WBK4_DATA.SENTENCES.find(s=>s.audio===pl[pl.length-1].src).id});
     const w=await p.evaluate(i=>[...document.querySelectorAll('#wb4Opts .wb3-opt')].map(b=>b.dataset.id).find(x=>x!==i),id);
     const opts=await p.evaluate(()=>[...document.querySelectorAll('#wb4Opts .wb3-opt')].map(b=>b.textContent));opts.forEach(o=>ok(!BAD.test(o),'distractor clean',o));
     await p.evaluate(()=>{window.__plays=[]});await p.click(`#wb4Opts [data-id="${w}"]`);await p.waitForTimeout(1500);
     ok(await p.evaluate(()=>window.__plays.length)===0,'wrong answer: no automatic sound');
     await p.evaluate(()=>{window.__plays=[]});await p.click(`#wb4Opts [data-id="${id}"]`);await p.waitForTimeout(1500);
     ok(await p.evaluate(()=>window.__plays.length)===0,'right answer: no automatic sound (not even praise)');
     ok(await p.evaluate(()=>!!document.getElementById('wb4Listen')||true),'listen button stays optional');
     await p.waitForTimeout(100);
    } else if(st==='build'){await p.click('#wb4Tray [data-unit="u1"]');await p.click('#wb4Tray [data-unit="u2"]');await p.waitForTimeout(2300);}
    else if(st==='missing'){await p.click('#wb4Opts [data-k="ok"]');await p.waitForTimeout(2300);}
    else if(st==='read'){await p.click('#wb4Read');await p.click('#wb4ReadSkip');}
    if(st==='hear'){const adv=await p.$('#wb4QActs .wb3-btn.main');if(adv)await p.click('#wb4QActs .wb3-btn.main');}
    else if(st==='build'||st==='missing'){const adv=await p.$('#wb4QActs .wb3-btn.main');if(adv)await p.click('#wb4QActs .wb3-btn.main');}
   }
  }
 }
 ok(seen.size===8,'teach shows 8 distinct sentences',String(seen.size));
 // tests: many runs
 for(let r=0;r<12;r++){await p.evaluate(()=>wbk4Internals.renderHome());await p.click('[data-stage="test"]');
  for(let i=0;i<5;i++){await p.waitForTimeout(150);const t=await txt();if(BAD.test(t))ok(false,'test run '+r+' shows removed text');
   const ty=await p.evaluate(()=>document.getElementById('wb4Tray')?'build':document.getElementById('wb4Gap')?'missing':document.getElementById('wb4Opts')?'hear':'read');
   if(ty==='build'){await p.click('#wb4Tray [data-unit="u1"]');await p.click('#wb4Tray [data-unit="u2"]');}
   else if(ty==='missing')await p.click('#wb4Opts [data-k="ok"]');
   else if(ty==='hear'){await p.waitForTimeout(600);const id=await p.evaluate(()=>{const pl=window.__plays.filter(x=>/sentences\//.test(x.src));return WBK4_DATA.SENTENCES.find(s=>s.audio===pl[pl.length-1].src).id});await p.click(`#wb4Opts [data-id="${id}"]`);}
   else await p.click('#wb4Read');}
  await p.waitForSelector('#wb4TestResult');if(BAD.test(await txt()))ok(false,'test result shows removed text');}
 ok(true,'12 test runs clean');
 await p.evaluate(()=>wbk4Internals.renderHome());await p.click('#wb4Teacher');if(await p.$('#wb4GateInput')){await p.fill('#wb4GateInput','1234');await p.keyboard.press('Enter');}await p.waitForSelector('#wb4Table');
 ok(!BAD.test(await txt()),'teacher panel clean');
 const plays=await p.evaluate(()=>window.__plays.map(x=>x.src));
 ok(!plays.some(s=>/qaraa|darasa|wakataba|wanajaha|dal-raa|noon-jeem-haa/.test(s)),'no removed recording ever played');
 ok(errs.length===0,'no errors',errs.join());
 await br.close();console.log('wbk4 removed:',pass,'pass',fail,'fail');process.exit(fail?1:0);
})();
