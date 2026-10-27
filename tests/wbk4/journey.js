const L=require('./lib.js');
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
const vp=process.argv[2]||'m390';
async function stars(p){return p.evaluate(()=>wbk4Internals.load().stars)}
async function qtype(p){return p.evaluate(()=>{const q=document.getElementById('wb4Q');if(!q)return null;if(document.getElementById('wb4Tray'))return 'build';if(document.getElementById('wb4Gap'))return 'missing';if(document.getElementById('wb4Opts'))return 'hear';if(document.getElementById('wb4Read'))return 'read';return 'teach'})}
async function solve(p,type,wrongFirst){
 if(type==='build'){
  const info=await p.evaluate(()=>({tiles:[...document.querySelectorAll('#wb4Tray .wb3-tile')].map(t=>t.textContent),slots:document.querySelectorAll('#wb4Board .wb3-slot').length}));
  if(wrongFirst){await p.click('#wb4Tray [data-unit="u2"]');await p.click('#wb4Tray [data-unit="u1"]');await p.waitForTimeout(1600);}
  await p.click('#wb4Tray [data-unit="u1"]');await p.click('#wb4Tray [data-unit="u2"]');return info;
 }
 if(type==='missing'){
  if(wrongFirst){await p.click('#wb4Opts [data-k="no"]');}
  await p.click('#wb4Opts [data-k="ok"]');return;
 }
 if(type==='hear'){
  await p.waitForTimeout(600);
  const id=await p.evaluate(()=>{const pl=window.__plays.filter(x=>/sentences\//.test(x.src));const f=pl[pl.length-1].src;return WBK4_DATA.SENTENCES.find(s=>s.audio===f).id});
  if(wrongFirst){const w=await p.evaluate(i=>[...document.querySelectorAll('#wb4Opts .wb3-opt')].map(b=>b.dataset.id).find(x=>x!==i),id);await p.click(`#wb4Opts [data-id="${w}"]`);}
  await p.click(`#wb4Opts [data-id="${id}"]`);return id;
 }
}
async function runSession(p,startIdx,stage,opts={}){
 await p.evaluate(()=>wbk4Internals.renderLibrary());
 await p.click(`.wb4-cell:nth-child(${startIdx+1})`);
 await p.click(`#wb4StageRow [data-stage="${stage}"]`);
 const seen=[];
 for(let i=0;i<5;i++){
  await p.waitForTimeout(250);
  const t=await qtype(p);ok(t===stage,'question type '+stage+' #'+i,String(t));
  const info=await solve(p,stage,opts.wrong&&i===0);seen.push(info);
  await p.waitForSelector('#wb4QActs .wb3-btn.main',{timeout:6000});
  await p.click('#wb4QActs .wb3-btn.main');
 }
 await p.waitForSelector('#wb4Summary');
 return seen;
}
(async()=>{
 const {br,p,errs}=await L.mk(vp);await L.open(p);
 ok(await p.evaluate(()=>document.querySelector('.screen.active').id)==='wbkL4','lesson 4 opens ('+vp+')');
 ok(await p.evaluate(()=>document.querySelectorAll('#wb4Path .wb3-step').length)===6,'six activities listed');
 ok(await p.evaluate(()=>[...document.querySelectorAll('#wb4Path b')].map(b=>b.textContent).join('|'))==='أقرأ مع المعلم|أرتّب الجملة|أستمع وأختار|أكمل الجملة|أقرأ بنفسي|أختبر نفسي','titles as specified');
 ok(await p.evaluate(()=>!document.querySelector('#wb4Path [disabled], #wb4Path .locked')),'no locks');
 // library: ten sentences, book order
 await p.click('#wb4LibBtn');
 ok(await p.evaluate(()=>document.querySelectorAll('.wb4-cell').length)===8,'library has 8');
 // ---- build: only two units, و attached ----
 let seen=await runSession(p,0,'build');
 ok(seen.every(i=>i&&i.slots===2&&i.tiles.length===2),'build has exactly 2 slots and 2 tiles');
 ok(seen.every(i=>i.tiles.some(t=>t.startsWith('وَ')&&t.length>3)&&!i.tiles.some(t=>t.replace(/\s/g,'')==='وَ')),'و attached to second word, never a separate tile',JSON.stringify(seen));
 let st=await stars(p);ok(st===0,'first model-assisted build gives no star (support, not evidence)',String(st));
 ok(await p.evaluate(()=>wbk4Internals.load().lv.build)===2,'build promoted to unassisted level');
 seen=await runSession(p,3,'build');
 ok(seen.every(i=>i.slots===2&&i.tiles.length===2),'build lv2 2 units');
 st=await stars(p);ok(st===0,'one independent evidence is not enough for a star',String(st));
 // hear last five sentences (independent) -> star each
 await runSession(p,3,'hear');
 st=await stars(p);ok(st===5,'five stars after 2 independent activities on last five sentences',String(st));
 await runSession(p,3,'hear');await runSession(p,3,'build');
 ok(await stars(p)===5,'no repeated reward for same sentences');
 // hear/missing for s01-s05: no star (no unassisted build)
 await runSession(p,0,'hear');await runSession(p,0,'missing');
 ok(await stars(p)===5,'hear+missing without independent build give no star');
 // wrong answers: no lock, retry possible, no penalty
 const before=await p.evaluate(()=>JSON.stringify(wbk4Internals.load().starred));
 await runSession(p,0,'hear',{wrong:true});await runSession(p,0,'missing',{wrong:true});await runSession(p,3,'build',{wrong:true});
 ok(await p.evaluate(()=>JSON.stringify(wbk4Internals.load().starred))===before&&await stars(p)===5,'mistakes remove nothing and add nothing wrongly');
 // ---- read: teacher confirmation ----
 await p.evaluate(()=>wbk4Internals.renderLibrary());await p.click('.wb4-cell:nth-child(1)');await p.click('#wb4StageRow [data-stage="read"]');
 await p.waitForTimeout(300);
 const plays0=await p.evaluate(()=>window.__plays.length);
 ok(await p.evaluate(()=>!!document.getElementById('wb4ReadShow'))&&plays0>=0,'read shows sentence');
 await p.evaluate(()=>{window.__plays=[]});await p.waitForTimeout(500);
 ok(await p.evaluate(()=>window.__plays.length)===0,'read: no automatic sound');
 await p.click('#wb4Read');await p.waitForTimeout(200);
 ok(await stars(p)===5,'pressing «قرأتُ» alone gives no star');
 await p.click('#wb4ReadOk');await p.fill('#wb4GateInput','1234');await p.keyboard.press('Enter');await p.waitForTimeout(300);
 ok(await stars(p)===6,'teacher-confirmed independent read gives star');
 for(let i=1;i<5;i++){await p.waitForSelector('#wb4Read');await p.click('#wb4Read');await p.click('#wb4ReadOk');await p.waitForTimeout(150);}
 await p.waitForSelector('#wb4Summary');
 ok(await stars(p)===8,'five reads confirmed -> 8 stars (all 8 sentences)',String(await stars(p)));
 // helped read cannot be independent
 await p.evaluate(()=>wbk4Internals.renderLibrary());await p.click('.wb4-cell:nth-child(1)');await p.click('#wb4StageRow [data-stage="read"]');
 await p.click('#wb4ReadHelp');await p.click('#wb4Read');
 ok(await p.evaluate(()=>document.getElementById('wb4ReadOk').disabled),'after help, independent confirm disabled');
 await p.click('#wb4ReadSkip');
 // ---- test ----
 await p.evaluate(()=>wbk4Internals.renderHome());await p.click('[data-stage="test"]');
 const types=[];
 for(let i=0;i<5;i++){
  await p.waitForTimeout(300);const t=await qtype(p);types.push(t);
  if(t==='read'){await p.click('#wb4Read');}else{await solve(p,t);}
 }
 ok(types.join()==='build,hear,missing,build,read','test has 5 varied questions',types.join());
 await p.waitForSelector('#wb4TestResult');
 ok(await p.evaluate(()=>/بانتظار/.test(document.querySelector('#wb4TestResult h2').textContent)),'test waits for teacher confirmation');
 ok(await stars(p)===8,'no test star before confirmation');
 await p.click('.rok');await p.waitForTimeout(300);
 ok(await stars(p)===9&&await p.evaluate(()=>wbk4Internals.load().testStar),'test star once after confirm',String(await stars(p)));
 // second test: no extra star
 await p.click('#wb4TestResult .wb3-btn.main');
 for(let i=0;i<5;i++){await p.waitForTimeout(300);const t=await qtype(p);if(t==='read')await p.click('#wb4Read');else await solve(p,t);}
 await p.waitForSelector('#wb4TestResult');await p.click('.rok').catch(()=>{});await p.waitForTimeout(300);
 ok(await stars(p)===9,'second test passes without extra star',String(await stars(p)));
 // teacher panel
 await p.evaluate(()=>wbk4Internals.renderHome());await p.click('#wb4Teacher');await p.waitForTimeout(200);
 if(await p.$('#wb4GateInput')){await p.fill('#wb4GateInput','1234');await p.keyboard.press('Enter');}
 await p.waitForSelector('#wb4Table');ok(await p.evaluate(()=>document.querySelectorAll('#wb4Table tr').length)===9,'teacher table has 8 rows');
 // ---- navigation ----
 await p.evaluate(()=>wbk4Internals.renderHome());
 await p.click('#wb4Back');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>document.querySelector('.screen.active').id)==='words','back from home -> words');
 await p.click('#wbk4Entry');await p.waitForTimeout(300);await p.click('[data-stage="teach"]');await p.waitForTimeout(200);
 await p.click('#wb4Back');ok(await p.evaluate(()=>!!document.getElementById('wb4Path')),'back from activity -> journey home');
 await p.goBack();await p.waitForTimeout(500);
 const a1=await p.evaluate(()=>document.querySelector('.screen.active')&&document.querySelector('.screen.active').id);ok(!!a1,'browser back lands on a valid screen',a1);
 await p.goForward().catch(()=>{});await p.waitForTimeout(500);
 const a2=await p.evaluate(()=>document.querySelector('.screen.active').id);ok(!!a2,'browser forward valid',a2);
 await p.evaluate(()=>{showScreen('words')});await p.click('#wbk4Entry');await p.click('[data-stage="build"]');await p.waitForTimeout(300);
 await p.evaluate(()=>document.getElementById('hmHomeBtn')&&document.getElementById('hmHomeBtn').click());await p.waitForTimeout(500);
 ok(await p.evaluate(()=>document.querySelector('.screen.active').id)!=='wbkL4','home button leaves lesson');
 await p.evaluate(()=>{window.__plays=[]});await p.waitForTimeout(1200);
 ok(await p.evaluate(()=>window.__plays.length)===0,'no sound after leaving');
 ok(errs.length===0,'no console errors',errs.join());
 await br.close();console.log('wbk4 journey',vp,':',pass,'pass',fail,'fail');process.exit(fail?1:0);
})();
