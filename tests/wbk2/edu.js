/* اختبارات تربوية محاكاة: ملفات تعريف طلاب مختلفة عبر الواجهة الفعلية (ضغط حقيقي) */
const L=require('/tmp/v61/t/lib.js');
const out=[];const log=(k,v)=>{out.push([k,v]);console.log('•',k,'=>',typeof v==='string'?v:JSON.stringify(v))};
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
const seed=`(function(){var a=0x9e3779b9;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})()`;
async function fresh(){const c=await L.mk('board');await c.p.addInitScript(seed);await L.open(c.p);await c.p.evaluate(()=>{wbk2State.scope='all'});return c}
const st=p=>p.evaluate(()=>wbk2Internals.load());
const cur=p=>p.evaluate(()=>{const R=wbk2State.run;return R.items[R.i]});
const nextBtn=async p=>{const n=await p.$('#wb2QActs .main');if(n)await n.click().catch(()=>{});await p.waitForTimeout(150)};
(async()=>{
 /* أ) طالب يحتاج مساعدة متكررة */
 {const {br,p,errs}=await fresh();
  await p.evaluate(()=>wbk2Internals.renderHome());await p.click('[data-stage=decode]');
  for(let i=0;i<6;i++){await p.waitForTimeout(250);const it=await cur(p);const opts=await p.$$eval('#wb2Opts .wb2-opt',b=>b.map(x=>x.dataset.id));
   await p.click(`#wb2Opts [data-id=${opts.find(o=>o!==it.id)}]`);await p.click('#wb2Help');await p.click(`#wb2Opts [data-id=${it.id}]`);await p.waitForTimeout(250);await nextBtn(p);}
  const s=await st(p);const ids=Object.keys(s.syl);
  const rev=await p.evaluate(()=>Object.keys(wbk2Internals.load().syl).filter(id=>wbk2Internals.needsReview(wbk2Internals.load().syl[id])));
  const sg=await p.evaluate(()=>wbk2Internals.suggest(wbk2Internals.load()));
  log('أ) مساعدة متكررة',{r:ids.reduce((a,id)=>a+s.syl[id].r,0),stars:s.stars,needReview:rev.length,suggest:sg.stage,lvDecode:s.lv.decode});
  ok(ids.reduce((a,id)=>a+s.syl[id].r,0)===6&&s.stars===0,'A: all revealed, no stars');
  ok(rev.length===6&&['review','discover'].includes(sg.stage),'A: all flagged review; suggestion sends child back (review/discover): '+sg.stage);
  ok(!ids.some(id=>s.syl[id].f+s.syl[id].s>0),'A: no independent evidence');
  // الجولة التالية تعيد نفس المقاطع (الأولوية للمراجعة)
  await p.evaluate(()=>wbk2Internals.renderHome());await p.click('[data-stage=decode]');
  const nt=await p.evaluate(()=>wbk2State.run.items.map(i=>i.id));ok(nt.slice(0,6).every(id=>rev.includes(id)),'A: next session prioritises review items');
  ok(errs.length===0,'A errs');await br.close();}
 /* ب) إجابات عشوائية */
 {const {br,p,errs}=await fresh();let correct=0,total=0;
  for(const stg of ['hear','decode','build']){
   for(let r=0;r<4;r++){await p.evaluate(()=>wbk2Internals.renderHome());await p.click(`[data-stage=${stg}]`);
    for(let i=0;i<6;i++){await p.waitForTimeout(220);const it=await cur(p);
     if(it.type==='build'){const tl=await p.$$('#wb2Tray .wb2-tile');for(let k=0;k<2;k++){const free=await p.$$('#wb2Tray .wb2-tile:not(.used)');const pick=free[Math.floor(await p.evaluate(n=>Math.random()*n,free.length))];await pick.click().catch(()=>{});}
      await p.waitForTimeout(1500);
      const done=await p.$('#wb2QActs .main');if(done){total++;}else{total++;const hb=await p.$('#wb2Help');if(hb){await hb.click().catch(()=>{});await p.waitForSelector('#wb2QActs .main',{timeout:8000}).catch(()=>{})}}
     } else {const opts=await p.$$eval('#wb2Opts .wb2-opt',b=>b.map(x=>x.dataset.id));const o=opts[Math.floor(await p.evaluate(n=>Math.random()*n,opts.length))];
      await p.click(`#wb2Opts [data-id=${o}]`);total++;
      if(o!==it.id){const hb=await p.$('#wb2Help');if(hb){await hb.click();await p.click(`#wb2Opts [data-id=${it.id}]`)}}}
     await p.waitForTimeout(250);await nextBtn(p);}}}
  const s=await st(p);const ids=Object.keys(s.syl);
  const f=ids.reduce((a,id)=>a+s.syl[id].f,0),sl=ids.reduce((a,id)=>a+s.syl[id].s,0),a_=ids.reduce((a,id)=>a+s.syl[id].a,0),r=ids.reduce((a,id)=>a+s.syl[id].r,0);
  const mastered=await p.evaluate(()=>Object.keys(wbk2Internals.load().syl).filter(id=>wbk2Internals.mastered(wbk2Internals.load().syl[id])).length);
  log('ب) عشوائي',{questions:f+sl+a_+r,firstTry:f,selfCorrect:sl,hint:a_,revealed:r,stars:s.stars,mastered,lv:s.lv});
  ok(mastered===0,'B: random guessing never reaches mastery (needs teacher-confirmed reading)');
  ok(f<(f+sl+a_+r)*0.7,'B: first-try success stays near chance, not high');
  ok(errs.length===0,'B errs '+errs);await br.close();}
 /* ج) طالب يعكس ترتيب الحرفين */
 {const {br,p,errs}=await fresh();let swappedMsgs=0,qs=0;
  await p.evaluate(()=>wbk2Internals.renderHome());await p.click('[data-stage=build]');
  for(let i=0;i<6;i++){await p.waitForTimeout(250);const it=await cur(p);const sy=await p.evaluate(id=>WBK2_DATA.SYLLABLES.find(s=>s.id===id),it.id);
   for(let t=0;t<2;t++){await p.click(`#wb2Tray [data-letter="${sy.b.base}"]`);await p.click(`#wb2Tray [data-letter="${sy.a.base}"]`);await p.waitForTimeout(250);
     if((await p.textContent('#wb2Msg')).includes('معكوس'))swappedMsgs++;await p.waitForTimeout(1350);}
   qs++;await p.click('#wb2Help');await p.waitForSelector('#wb2QActs .main',{timeout:8000});await nextBtn(p);}
  const s=await st(p);const ids=Object.keys(s.syl);
  const res={a:ids.reduce((x,id)=>x+s.syl[id].a,0),r:ids.reduce((x,id)=>x+s.syl[id].r,0),f:ids.reduce((x,id)=>x+s.syl[id].f,0),s:ids.reduce((x,id)=>x+s.syl[id].s,0)};
  log('ج) عكس الترتيب',{questions:qs,swappedFeedbackShown:swappedMsgs,...res,stars:s.stars});
  ok(swappedMsgs===12,'C: every reversal got the order-specific feedback');ok(res.f===0&&res.s===0&&s.stars===0,'C: reversing never counts as success');
  ok(errs.length===0,'C errs');await br.close();}
 /* د) يتقن بصريًا ولا يقرأ مستقلًا */
 {const {br,p,errs}=await fresh();
  await p.evaluate(()=>{const q=wbk2Internals.load();WBK2_DATA.SYLLABLES.forEach(s=>{wbk2Internals.logResult(q,s.id,'decode','f',{});wbk2Internals.logResult(q,s.id,'build','f',{});wbk2Internals.logResult(q,s.id,'decode','f',{});q.syl[s.id].seen=1});wbk2Internals.save(q)});
  // تحدي القراءة: المعلم يقيّم «يحتاج تدريبًا» لأول ٥
  await p.evaluate(()=>wbk2Internals.renderHome());await p.click('[data-stage=read]');
  for(let i=0;i<5;i++){await p.waitForTimeout(200);await p.click('#wb2Read');await p.evaluate(()=>{wbk2State.gate=true});await p.click('#wb2ReadNo');await p.waitForTimeout(250);}
  // التقييم: كل الآلي صحيح، القراءة غير مؤكدة بأنها صحيحة
  await p.evaluate(()=>wbk2Internals.startTest());
  for(let i=0;i<8;i++){await p.waitForTimeout(250);const it=await cur(p);
   if(it.type==='read')await p.click('#wb2Read');
   else if(it.type==='build'){const sy=await p.evaluate(id=>WBK2_DATA.SYLLABLES.find(s=>s.id===id),it.id);await p.click(`#wb2Tray [data-letter="${sy.a.base}"]`);await p.click(`#wb2Tray [data-letter="${sy.b.base}"]`)}
   else await p.click(`#wb2Opts [data-id=${it.id}]`);
   await p.waitForTimeout(250);}
  await p.waitForTimeout(400);
  await p.evaluate(()=>{wbk2State.gate=true});
  for(let k=0;k<2;k++){await p.click('#wb2Reads .rno');await p.waitForTimeout(300)}
  const s=await st(p);const t=s.tests[s.tests.length-1];
  const mastered=await p.evaluate(()=>WBK2_DATA.SYLLABLES.filter(x=>wbk2Internals.mastered(wbk2Internals.load().syl[x.id])).length);
  const reviewN=await p.evaluate(()=>WBK2_DATA.SYLLABLES.filter(x=>wbk2Internals.stateOf(wbk2Internals.load(),x.id)==='review').length);
  log('د) يتقن بصريًا ولا يقرأ',{auto:t.auto+'/'+t.autoTotal,testStatus:t.status,testStar:s.testStar,masteredSyllables:mastered,flaggedReview:reviewN,starsFromVisual:s.stars});
  ok(t.auto===6&&t.status==='fail'&&!s.testStar,'D: perfect visual/auditory but unconfirmed reading => test not passed, no test star');
  ok(mastered===0,'D: no syllable mastered without teacher-confirmed reading');ok(reviewN>=5,'D: unread syllables flagged for review');
  ok(errs.length===0,'D errs '+errs);await br.close();}
 /* هـ) إعادة النشاط لاستخراج نجوم */
 {const {br,p,errs}=await fresh();const appStars=()=>p.evaluate(()=>+localStorage.getItem('taha_app_stars')||0);
  const a0=await appStars();let rounds=0;
  for(let r=0;r<10;r++){await p.evaluate(()=>wbk2Internals.renderHome());await p.click('[data-stage=decode]');
   for(let i=0;i<6;i++){await p.waitForTimeout(180);const it=await cur(p);await p.click(`#wb2Opts [data-id=${it.id}]`);await p.waitForTimeout(180);await nextBtn(p);}rounds++;}
  let s=await st(p);const uniqStarred=Object.keys(s.starred).length;const a1=await appStars();
  log('هـ) إعادة لاستخراج نجوم',{rounds,questions:rounds*6,starsInLesson:s.stars,uniqueStarred:uniqStarred,appStarsDelta:a1-a0});
  ok(s.stars===uniqStarred&&a1-a0===s.stars,'E: lesson stars == unique syllables == app-total delta (no inflation)');
  ok(s.stars<=24,'E: cap at unique syllables');
  // إعادة التدريب لا تعيد النجوم
  await p.evaluate(()=>{wbk2State.gate=true});await p.click('#wb2Teacher');p.on('dialog',d=>d.accept());await p.click('#wb2Reset');await p.waitForTimeout(300);
  const b0=await appStars();
  for(let r=0;r<3;r++){await p.evaluate(()=>wbk2Internals.renderHome());await p.click('[data-stage=decode]');for(let i=0;i<6;i++){await p.waitForTimeout(180);const it=await cur(p);await p.click(`#wb2Opts [data-id=${it.id}]`);await p.waitForTimeout(180);await nextBtn(p)}}
  s=await st(p);const b1=await appStars();
  log('هـ) بعد «إعادة التدريب» وإعادة اللعب',{starsLesson:s.stars,appStarsDelta:b1-b0});
  ok(b1===b0,'E: replay after reset gives no extra app stars');ok(errs.length===0,'E errs');await br.close();}
 console.log('PASS',pass,'FAIL',fail);
})();
