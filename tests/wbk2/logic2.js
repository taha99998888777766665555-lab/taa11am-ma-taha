const L=require('/tmp/v61/t/lib.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c){pass++;}else{fail++;console.log('FAIL',m);}};
(async()=>{
 const {br,ctx,p,errs}=await L.mk('board');
 await L.open(p);
 const st=()=>p.evaluate(()=>wbk2Internals.load());
 const cur=()=>p.evaluate(()=>{const R=wbk2State.run;return R.items[R.i]});
 // per-student isolation
 await p.evaluate(()=>{const q=wbk2Internals.load();wbk2Internals.logResult(q,'s02','decode','f',{});wbk2Internals.save(q)});
 const a=await st(); ok(a.stars===1,'student A has star');
 const raw=await p.evaluate(()=>{const r=[];for(let i=0;i<800;i++){const k=localStorage.key(i);if(k===null)break;r.push(k)}return r});
 ok(raw.some(k=>/^taha_s_.+__taha_wbk2_progress_v1$/.test(k)),'stored under per-student prefix: '+raw.filter(k=>k.includes('wbk2')));
 await p.evaluate(()=>{const id=StudentStore.add('ب','🐼');StudentStore.switchTo(id)}); await p.waitForTimeout(1800);
 await L.open(p);
 const b=await st(); ok(b.stars===0 && Object.keys(b.syl).length===0,'student B starts clean');
 // lesson1 key not created
 ok(await p.evaluate(()=>localStorage.getItem('taha_wbk_progress_v1'))===null,'lesson 1 key untouched for B');
 // missing audio: route 404 for syllables
 await ctx.route('**/syllables/*.mp3',r=>r.fulfill({status:404,body:''}));
 await p.evaluate(()=>wbk2State.scope='all'); await p.evaluate(()=>wbk2Internals.renderHome());
 await p.click('[data-stage=hear]'); await p.waitForTimeout(1200);
 ok(await p.$('#wb2QActs .skip')!==null,'missing audio shows skip');
 ok((await p.textContent('#wb2Msg')).includes('تعذّر'),'missing audio message');
 const before=await st(); await p.click('#wb2QActs .skip'); await p.waitForTimeout(600);
 ok(JSON.stringify((await st()).syl)===JSON.stringify(before.syl),'skip not counted');
 await ctx.unroute('**/syllables/*.mp3');
 // full test
 await p.evaluate(()=>wbk2Internals.renderHome()); await p.click('[data-stage=test]'); await p.waitForTimeout(300);
 const types=await p.evaluate(()=>wbk2State.run.items.map(i=>i.type)); 
 ok(types.length===8 && ['hear','build','decode','read'].every(t=>types.filter(x=>x===t).length===2),'test mix 2/2/2/2: '+types);
 const ids=await p.evaluate(()=>wbk2State.run.items.map(i=>i.id)); ok(new Set(ids).size===8,'test 8 distinct syllables');
 for(let i=0;i<8;i++){
   const it=await cur(); await p.waitForTimeout(250);
   if(it.type==='read'){await p.click('#wb2Read');}
   else if(it.type==='build'){const sy=await p.evaluate(id=>WBK2_DATA.SYLLABLES.find(s=>s.id===id),it.id);await p.click(`#wb2Tray [data-letter="${sy.a.base}"]`);await p.click(`#wb2Tray [data-letter="${sy.b.base}"]`);}
   else {
     ok(await p.$('#wb2Help')===null,'no help in test');
     if(i===0){const opts=await p.$$eval('#wb2Opts .wb2-opt',b=>b.map(x=>x.dataset.id));const w=opts.find(o=>o!==it.id);await p.click(`#wb2Opts [data-id=${w}]`);} else await p.click(`#wb2Opts [data-id=${it.id}]`);
   }
   await p.waitForTimeout(250);
 }
 await p.waitForTimeout(400);
 let t=(await st()).tests; ok(t.length===1 && t[0].auto===5 && t[0].status==='pending','test pending teacher, auto 5/6: '+JSON.stringify(t[0]));
 ok((await st()).stars===0 && !(await st()).testStar,'no star before teacher confirm');
 ok((await p.textContent('#wb2TestResult h2')).includes('بانتظار'),'pending heading');
 // teacher gate shows when confirming
 await p.click('#wb2Reads .rok'); await p.waitForTimeout(200);
 ok(await p.$('#wb2Gate')!==null,'gate prompts');
 // solve addition
 const txt=await p.textContent('#wb2Gate p'); const nums=txt.replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).match(/\d+/g).map(Number);
 await p.fill('#wb2GateInput',String(nums[0]+nums[1])); await p.click('#wb2Gate .main'); await p.waitForTimeout(300);
 t=(await st()).tests[0]; ok(t.readOk[0]===true && t.readOk[1]===null,'first reading confirmed');
 await p.click('#wb2Reads .rok'); await p.waitForTimeout(300);
 t=(await st()).tests[0]; ok(t.status==='pass','pass after both confirmed');
 let s2=await st(); ok(s2.testStar===true,'test star set');
 const starsNow=s2.stars; await p.evaluate(()=>{wbk2Internals.confirmTest(0,0,true);wbk2Internals.confirmTest(0,1,true)}); ok((await st()).stars===starsNow,'no duplicate test star on re-confirm');
 // reading in test does not mark independent reading without teacher: read mastery requires ok
 const rs=await p.evaluate(()=>{const q=wbk2Internals.load();return Object.values(q.syl).filter(r=>r.read.last==='ok').length}); ok(rs===2,'only 2 teacher-confirmed readings');
 // teacher panel + reset keeps stars
 await p.click('#wb2Teacher'); await p.waitForTimeout(300); ok(await p.$('#wb2TeacherPanel')!==null,'teacher panel opens (session unlocked)');
 ok(await p.$$eval('#wb2Table tbody tr',r=>r.length)===24,'24 rows in table');
 p.on('dialog',d=>d.accept()); const sb=(await st()).stars; await p.click('#wb2Reset'); await p.waitForTimeout(300);
 const af=await st(); ok(af.stars===sb && Object.keys(af.syl).length===0,'reset keeps stars, clears syllables');
 console.log('errs',errs); ok(errs.filter(e=>!/404/.test(e)).length===0,'no js errors (expected 404s from injected fault ignored)'); console.log('PASS',pass,'FAIL',fail);
 await br.close();
})();
