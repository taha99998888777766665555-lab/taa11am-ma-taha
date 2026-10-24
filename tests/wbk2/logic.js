const L=require('/tmp/v61/t/lib.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c){pass++;}else{fail++;console.log('FAIL',m);}};
const BOOK=[["قَرَ","كَتَـ","جَلَـ","زَرَ","أَكَـ"],["رَفَـ","طَلَـ","حَرَ","رَسَـ","دَخَـ"],["غَرَ","فَتَـ","أَخَـ","هَرَ","وَقَـ"],["نَظَـ","مَكَـ","حَمَـ","وَقَـ","شَرَ"],["نَشَـ","نَبَـ","خَبَـ","جَمَـ","وَجَـ"]].flat();
(async()=>{
 const {br,p,errs}=await L.mk('board');
 await p.addInitScript(()=>{window.__aud=[];const A=window.Audio;window.Audio=function(s){window.__aud.push(s);return new A(s)};window.Audio.prototype=A.prototype;});
 await L.open(p);
 await p.evaluate(()=>{window.__edu=[];const o=EduAudio.play;EduAudio.play=function(a,b){window.__edu.push(JSON.stringify(a));return o.apply(this,arguments)};});
 // A: cells
 const cells=await p.evaluate(()=>WBK2_DATA.CELLS.map(id=>WBK2_DATA.SYLLABLES.find(s=>s.id===id).shown));
 ok(cells.length===25 && cells.every((c,i)=>c===BOOK[i]),'25 cells match book');
 ok(await p.evaluate(()=>new Set(WBK2_DATA.SYLLABLES.map(s=>s.id)).size)===24,'24 unique');
 const shown=await p.$$eval('#wb2Grid .wb2-cell',b=>b.map(x=>x.textContent.replace(/[○◐↻✔=]/g,'').trim()));
 ok(shown.every((c,i)=>c===BOOK[i]),'rendered grid matches book');
 ok(await p.evaluate(()=>getComputedStyle(document.getElementById('wbkL2')).direction)==='rtl','rtl');
 // helpers
 const cur=()=>p.evaluate(()=>{const R=wbk2State.run;return R.items[R.i]});
 const st=()=>p.evaluate(()=>wbk2Internals.load());
 // discover s02
 await p.click('#wb2Grid [data-id=s02]'); await p.waitForTimeout(200);
 for(let i=0;i<5;i++){await p.click('#wb2Acts .main');await p.waitForTimeout(150);}
 let s=await st(); ok(s.syl.s02&&s.syl.s02.seen===1,'discover marks seen'); ok(s.stars===0,'discover gives no star');
 // hear: scope all
 await p.evaluate(()=>wbk2State.scope='all');
 await p.evaluate(()=>wbk2Internals.renderHome()); await p.click('[data-stage=hear]'); await p.waitForTimeout(400);
 let it=await cur(); ok(it.type==='hear','hear item'); 
 let approved=await p.evaluate(()=>WBK2_DATA.SYLLABLES.filter(s=>s.approved).map(s=>s.id));
 ok(approved.includes(it.id),'hear target approved');
 // right first try
 await p.click(`#wb2Opts [data-id=${it.id}]`); await p.waitForTimeout(300);
 s=await st(); ok(s.syl[it.id].f===1 && s.stars===1 && s.starred[it.id]===1,'first-try f + 1 star');
 const firstId=it.id;
 // next question: wrong then right -> s
 await p.click('#wb2QActs .main'); await p.waitForTimeout(300);
 it=await cur(); let opts=await p.$$eval('#wb2Opts .wb2-opt',b=>b.map(x=>x.dataset.id)); let wrong=opts.find(o=>o!==it.id);
 await p.click(`#wb2Opts [data-id=${wrong}]`); await p.waitForTimeout(200);
 ok(await p.$eval(`#wb2Opts [data-id=${wrong}]`,b=>b.disabled),'wrong option faded/disabled');
 ok(await p.$('#wb2Help')!==null,'help appears after wrong');
 await p.click(`#wb2Opts [data-id=${it.id}]`); await p.waitForTimeout(200);
 s=await st(); ok(s.syl[it.id].s>=1||s.syl[it.id].f>=1,'self-corrected recorded');
 // no duplicate star: repeated taps on correct after locked
 const before=(await st()).stars;
 for(let i=0;i<5;i++) await p.click(`#wb2Opts [data-id=${it.id}]`,{force:true}).catch(()=>{});
 ok((await st()).stars===before,'repeat tap no extra star');
 // reveal path: decode with help
 await p.evaluate(()=>{wbk2State.scope='all'});
 await p.evaluate(()=>wbk2Internals.renderHome()); await p.click('[data-stage=decode]'); await p.waitForTimeout(300);
 it=await cur(); opts=await p.$$eval('#wb2Opts .wb2-opt',b=>b.map(x=>x.dataset.id));
 const pre=await st(); const hadStar=!!pre.starred[it.id];
 wrong=opts.find(o=>o!==it.id);
 await p.click(`#wb2Opts [data-id=${wrong}]`); await p.waitForTimeout(150);
 await p.click('#wb2Help'); await p.waitForTimeout(150);
 ok(await p.$('#wb2Opts .reveal')!==null,'reveal highlights answer');
 await p.click(`#wb2Opts [data-id=${it.id}]`); await p.waitForTimeout(250);
 s=await st(); ok(s.syl[it.id].r===1,'reveal -> r'); ok(hadStar||!s.starred[it.id],'reveal gives no star');
 ok(await p.evaluate(()=>wbk2Internals.needsReview(wbk2Internals.load().syl[wbk2State.run.items[wbk2State.run.i].id])),'revealed needs review');
 // hint: 2 wrongs with 3 options? use fresh decode and force lv 2
 await p.evaluate(()=>{const q=wbk2Internals.load();q.lv.decode=2;wbk2Internals.save(q)});
 await p.evaluate(()=>wbk2Internals.renderHome()); await p.click('[data-stage=decode]'); await p.waitForTimeout(300);
 it=await cur(); opts=await p.$$eval('#wb2Opts .wb2-opt',b=>b.map(x=>x.dataset.id)); ok(opts.length===3,'level2 = 3 options');
 const ws=opts.filter(o=>o!==it.id);
 await p.click(`#wb2Opts [data-id=${ws[0]}]`); await p.click(`#wb2Opts [data-id=${ws[1]}]`); await p.waitForTimeout(150);
 ok(await p.$('#wb2Hint')!==null,'hint after 2 wrong');
 await p.click(`#wb2Opts [data-id=${it.id}]`); await p.waitForTimeout(200);
 ok((await st()).syl[it.id].a>=1,'hint -> a');
 // build: tap correct
 await p.evaluate(()=>wbk2Internals.renderHome()); await p.click('[data-stage=build]'); await p.waitForTimeout(300);
 it=await cur(); let sy=await p.evaluate(id=>WBK2_DATA.SYLLABLES.find(s=>s.id===id),it.id);
 const tile=b=>`#wb2Tray [data-letter="${b}"]`;
 // swapped order first
 await p.click(tile(sy.b.base)); await p.click(tile(sy.a.base)); await p.waitForTimeout(150);
 ok((await p.textContent('#wb2Msg')).includes('معكوس'),'swapped-order feedback');
 await p.waitForTimeout(1300);
 ok(await p.$$eval('.wb2-slotl',x=>x.length)===0,'slots cleared after wrong');
 await p.click(tile(sy.a.base)); await p.click(tile(sy.b.base)); await p.waitForTimeout(1500);
 s=await st(); ok(s.syl[it.id].s>=1,'build self-corrected recorded');
 // build via drag
 await p.evaluate(()=>wbk2Internals.renderHome()); await p.click('[data-stage=build]'); await p.waitForTimeout(300);
 it=await cur(); sy=await p.evaluate(id=>WBK2_DATA.SYLLABLES.find(s=>s.id===id),it.id);
 async function drag(letter,slot){const a=await (await p.$(tile(letter))).boundingBox();const b=await (await p.$(`.wb2-slot[data-slot="${slot}"]`)).boundingBox();
  await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(a.x+a.width/2-30,a.y-30,{steps:4});await p.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:6});await p.mouse.up();await p.waitForTimeout(150);}
 const pre2=(await st()).syl[it.id]; const f0=pre2?pre2.f:0;
 await drag(sy.a.base,0); await drag(sy.b.base,1); await p.waitForTimeout(1500);
 s=await st(); ok(s.syl[it.id].f===f0+1,'drag build correct -> f');
 // wbk duplicated star
 const r=await p.evaluate(()=>{const q=wbk2Internals.load();const b=q.stars;wbk2Internals.logResult(q,'s15','decode','f',{});const m=q.stars;wbk2Internals.logResult(q,'s15','decode','f',{});return [b,m,q.stars]});
 ok(r[1]===r[0]+1 && r[2]===r[1],'s15 (وَقَـ) star once');
 // audio spies
 const au=await p.evaluate(()=>({a:window.__aud,e:window.__edu}));
 const appr=await p.evaluate(()=>WBK2_DATA.SYLLABLES.filter(s=>s.approved).map(s=>s.audio));
 ok(au.a.filter(x=>x.includes('/syllables/')).every(x=>appr.includes(x)),'only approved files played: '+'');
 ok(au.e.every(x=>!/^\["([ء-ي]َ){2}"/.test(x)),'EduAudio never got syllable text: '+au.e.filter(x=>/^\["([ء-ي]َ){2}/.test(x)));
 console.log('edu calls sample',au.e.slice(0,4),'aud',au.a.length);
 console.log('errs',errs); ok(errs.length===0,'no js errors');
 console.log('PASS',pass,'FAIL',fail);
 await br.close();
})();
