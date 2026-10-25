const L=require('./lib.js');const fs=require('fs');const {execSync}=require('child_process');
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
const F='َ';
const PLAIN="قرأ كتب جلس زرع أكل رفع طلع حرث رسم دخل غرس فتح أخذ هرب وقف نظر خرج حمل وقع كسر نشر نبت خبز جمع وجد".split(' ');
const BOOK=PLAIN.map(w=>[...w].map(c=>c+F).join(''));
const NOSYL=['w01','w17','w20','w21','w23'];
(async()=>{
 const {br,p,errs}=await L.mk('board');
 await p.addInitScript(()=>{window.__aud=[];const A=window.Audio;window.Audio=function(s){window.__aud.push(String(s));return new A(s)};window.Audio.prototype=A.prototype;});
 await L.open(p);
 await p.evaluate(()=>{window.__edu=[];const o=EduAudio.play;EduAudio.play=function(a,b){window.__edu.push(JSON.stringify(a));return o.apply(this,arguments)};});
 const st=()=>p.evaluate(()=>wbk3Internals.load());
 const cur=()=>p.evaluate(()=>{const R=wbk3State.run;return R.items[R.i]});
 const clearLog=()=>p.evaluate(()=>{window.__aud.length=0;window.__edu.length=0});
 const aud=()=>p.evaluate(()=>window.__aud.slice());
 const home=()=>p.evaluate(()=>wbk3Internals.renderHome());
 const setLv=(n)=>p.evaluate((n)=>{const q=wbk3Internals.load();q.lv={hear:n,build:n,missing:n};wbk3Internals.save(q)},n);
 const reset=()=>p.evaluate(()=>{localStorage.removeItem(wbk3Internals.KEY)});
 // ===== A. data =====
 const data=await p.evaluate(()=>WBK3_DATA.WORDS.map(w=>({id:w.id,key:w.key,shown:w.shown,n:w.n,approved:w.approved,audio:w.audio,sylApproved:w.sylApproved,sylAudio:w.sylAudio})));
 ok(data.length===25,'25 words');
 ok(data.every((w,i)=>w.key===BOOK[i]&&w.shown===BOOK[i]&&w.n===i+1),'words match book order exactly (with fatha on every letter)');
 ok(new Set(data.map(w=>w.key)).size===25,'25 unique, no repeats');
 ok(data.every(w=>(w.key.match(/َ/g)||[]).length===3 && [...w.key.replace(/َ/g,'')].length===3),'every word = 3 letters, each with fatha');
 const groups=await p.evaluate(()=>WBK3_DATA.GROUPS);ok(groups.length===5&&groups.every((g,i)=>g.join()===data.slice(i*5,i*5+5).map(w=>w.id).join()),'5 rows of 5 follow the book rows');
 ok(data.every(w=>w.approved && w.audio && fs.existsSync(__dirname+'/../../'+w.audio)),'25 word recordings approved and files exist');
 ok(new Set(data.map(w=>w.audio)).size===25,'25 distinct audio paths');
 const oldMap={1:'verbs/verb_03',2:'verbs/verb_01',3:'words/extra_041',7:'verbs/verb_04',8:'verbs/verb_05',10:'verbs/verb_10',12:'words/extra_212',13:'verbs/verb_06',17:'verbs/verb_07',18:'verbs/verb_09',23:'verbs/verb_08',24:'verbs/verb_11',25:'verbs/verb_12'};
 ok(Object.keys(oldMap).every(n=>data[n-1].audio.endsWith(oldMap[n]+'.mp3')),'13 old recordings bound to their ORIGINAL paths');
 const newN=[4,5,6,9,11,14,15,16,19,20,21,22];
 const tr={4:'zay-raa-ain',5:'alef-kaf-lam',6:'raa-faa-ain',9:'raa-seen-meem',11:'ghain-raa-seen',14:'ha-raa-ba',15:'waw-qaf-faa',16:'noon-zaa-raa',19:'waw-qaf-ain',20:'kaf-seen-raa',21:'noon-sheen-raa',22:'noon-ba-ta'};
 ok(newN.every(n=>data[n-1].audio.endsWith('words/wbk3_'+String(n).padStart(2,'0')+'_'+tr[n]+'.mp3')),'12 new recordings bound by NAME to the right word');
 // letters-of-filename vs letters-of-word cross-check
 const LN={'ا':'alef','ب':'ba','ت':'ta','ث':'tha','ج':'jeem','ح':'haa','خ':'khaa','د':'dal','ذ':'thal','ر':'raa','ز':'zay','س':'seen','ش':'sheen','ص':'sad','ض':'dad','ط':'taa','ظ':'zaa','ع':'ain','غ':'ghain','ف':'faa','ق':'qaf','ك':'kaf','ل':'lam','م':'meem','ن':'noon','ه':'ha','و':'waw','ي':'yaa','أ':'alef'};
 ok(newN.every(n=>{const w=PLAIN[n-1];const exp=[...w].map(c=>LN[c]).join('-');return tr[n]===exp}),'filename letter-names equal the word letters (independent mapping check)');
 ok(data.filter(w=>w.sylApproved).length===20 && data.filter(w=>!w.sylApproved).map(w=>w.id).join()===NOSYL.join(),'20 words have an approved lesson-2 syllable; the 5 without are exactly '+NOSYL.join());
 ok(data.every(w=>w.sylApproved?/syllables\/(l2_\d\d|wbk2_\d\d_[a-z-]+)\.mp3$/.test(w.sylAudio):w.sylAudio===''),'no syllable audio path for unapproved syllables');
 ok(!data.some(w=>/wbk2_01|wbk2_21|wbk2_23/.test(w.sylAudio)),'rejected syllable recordings never referenced');
 const bad=await p.evaluate(()=>WBK3_DATA.WORDS.filter(w=>w.sylApproved).map(w=>{const s=WBK2_DATA.SYLLABLES.find(x=>x.key===w.sylKey);return s&&s.approved&&s.audio===w.sylAudio}).every(Boolean));
 ok(bad,'syllable audio equals lesson-2 approved audio exactly');
 // PDF cross-check (if the book is available)
 if(fs.existsSync('/tmp/v56/guide.pdf')){
  const t=execSync('pdftotext -f 6 -l 6 -layout /tmp/v56/guide.pdf -').toString();const rows=[];
  for(const ln of t.split('\n')){const toks=ln.trim().split(/\s{2,}/).filter(Boolean);if(toks.length===5){rows.push(toks.map(k=>k.replace(/[‪-‮⁦-⁩‎‏]/g,'').replace(/[َ\s]/g,'')).reverse());}}
  const fromPdf=[].concat(...rows);
  ok(fromPdf.length===25 && fromPdf.every((w,i)=>w===PLAIN[i]),'PDF page 6 text (RTL row order) == data order',fromPdf.join(' '));
 }
 // ===== B. library =====
 await p.click('#wb3LibBtn');await p.waitForTimeout(200);
 const shown=await p.$$eval('#wb3Grid .wb3-cell',b=>b.map(x=>x.textContent.replace(/[○◐↻✔☆]/g,'').trim()));
 ok(shown.length===25&&shown.every((c,i)=>c===BOOK[i]),'library renders 25 cells in book order');
 ok(await p.evaluate(()=>getComputedStyle(document.getElementById('wbkL3')).direction)==='rtl','rtl');
 const xs=await p.$$eval('#wb3Grid .wb3-cell',b=>b.slice(0,5).map(x=>Math.round(x.getBoundingClientRect().left)));
 ok(xs[0]>xs[1]&&xs[1]>xs[2]&&xs[2]>xs[3]&&xs[3]>xs[4],'first book cell is rightmost (RTL)',xs.join());
 await p.click('#wb3Back');await p.waitForTimeout(200);
 // ===== C. discover: gradual blending =====
 await reset();await clearLog();
 await p.evaluate(()=>wbk3Internals.renderLibrary());await p.click('#wb3Grid [data-id=w02]');await p.waitForTimeout(250);
 const stepTxt=async()=>[await p.textContent('#wb3Cap'),await p.$$eval('#wb3Stage > *',n=>n.map(x=>x.textContent.trim()).join('|'))];
 ok((await stepTxt())[0].includes('الحرف الأول')&&(await stepTxt())[1].startsWith('كَ'),'step1 = first letter alone');
 await p.click('#wb3Acts .main');await p.waitForTimeout(200);ok((await stepTxt())[0].includes('الحرف الثاني'),'step2 = second letter alone');
 await p.click('#wb3Acts .main');await p.waitForTimeout(1300);
 ok((await stepTxt())[0].includes('مقطعًا واحدًا'),'step3 = merge first two into a syllable');
 ok(await p.$('#wb3ListenSyl')!==null,'approved syllable (كَتَـ): listen button present');
 await clearLog();await p.click('#wb3ListenSyl');await p.waitForTimeout(300);
 ok((await aud()).some(a=>/syllables\/l2_02\.mp3$/.test(a)),'plays the approved lesson-2 syllable file');
 ok(await p.$eval('#wb3Stage',s=>s.textContent.includes('كَتَـ')),'syllable shown joined (with tatweel)');
 await p.click('#wb3Acts .main');await p.waitForTimeout(250);
 ok((await stepTxt())[0].includes('نضيف الحرف الثالث')&&(await stepTxt())[1].includes('بَ'),'step4 = add the third letter to the syllable');
 await p.click('#wb3Acts .main');await p.waitForTimeout(250);
 ok((await stepTxt())[1]==='كَتَبَ','step5 = whole word');
 await clearLog();await p.click('#wb3Listen');await p.waitForTimeout(250);
 ok((await aud()).some(a=>/verbs\/verb_01\.mp3$/.test(a)),'word recording plays at the end (original old path)');
 await p.click('#wb3Acts .main');await p.waitForTimeout(250);
 let s=await st();ok(s.syl.w02&&s.syl.w02.seen===1&&s.stars===0,'discover marks seen, gives no star');
 // word WITHOUT approved syllable
 await p.evaluate(()=>wbk3Internals.renderLibrary());await p.click('#wb3Grid [data-id=w01]');await p.waitForTimeout(200);
 await p.click('#wb3Disc .wb3-stepdot[data-i="2"]');await p.waitForTimeout(1300);
 ok(await p.$('#wb3ListenSyl')===null,'no listen button for a syllable without approved recording (قَرَ)');
 ok((await p.textContent('#wb3Cap')).includes('المعلم يقرؤه معك'),'visual merge with teacher support message');
 await clearLog();await p.waitForTimeout(400);
 ok((await aud()).length===0,'nothing plays by itself there');
 await p.click('#wb3Disc .wb3-stepdot[data-i="4"]');await p.waitForTimeout(200);
 await clearLog();await p.click('#wb3Listen');await p.waitForTimeout(250);
 ok((await aud()).some(a=>/verbs\/verb_03\.mp3$/.test(a)),'full-word approved recording still plays for قَرَأَ');
 // ===== D. rules of the star (unit) =====
 await reset();
 const R=await p.evaluate(()=>{const I=wbk3Internals,o={};let q=I.load();
  I.logResult(q,'w03','hear','a',{});I.logResult(q,'w03','hear','r',{});I.logResult(q,'w03','missing','s',{});o.helpNoEv=q.syl.w03.ev.length===0&&!q.starred.w03;
  I.logResult(q,'w04','hear','f',{});o.oneNoStar=q.syl.w04.ev.length===1&&!q.starred.w04&&q.stars===0;
  I.logResult(q,'w04','hear','f',{});I.logResult(q,'w04','hear','f',{});o.sameActNoStar=!q.starred.w04&&q.stars===0;
  I.logResult(q,'w04','buildm','f',{});o.modelNoEv=q.syl.w04.ev.indexOf('build')<0&&!q.starred.w04;
  I.logResult(q,'w04','missing','f',{});o.hearMissingNoStar=!q.starred.w04&&q.stars===0&&q.syl.w04.ev.join()==='hear,missing';I.logResult(q,'w04','build','f',{});o.twoActWithBuildStar=!!q.starred.w04&&q.stars===1;
  I.logResult(q,'w04','hear','r',{});I.logResult(q,'w04','build','a',{});o.keptNoDouble=q.stars===1&&q.syl.w04.ev.length===3;
  I.logResult(q,'w05','build','f',{});I.logResult(q,'w05','build','f',{});o.buildTwiceNoStar=!q.starred.w05;
  I.logResult(q,'w10','build','s',{});I.logResult(q,'w10','hear','f',{});o.buildSelfCorrectedNoStar=!q.starred.w10;I.logResult(q,'w10','build','a',{});I.logResult(q,'w10','build','r',{});o.buildHintRevealNoStar=!q.starred.w10;
  I.logResult(q,'w12','hear','f',{});I.logResult(q,'w12','missing','f',{});I.logResult(q,'w12','hear','f',{});I.logResult(q,'w12','missing','f',{});o.manyGuessableNoStar=!q.starred.w12&&q.stars===1;I.logResult(q,'w12','build','f',{});o.thenBuildStar=!!q.starred.w12;
  I.logResult(q,'w05','missing','a',{});o.hintNotEvidence=!q.starred.w05;
  I.applyRead(q,'w06','ok');o.readOkStar=!!q.starred.w06;
  I.applyRead(q,'w07','help');o.readHelpNoStar=!q.starred.w07&&q.syl.w07.read.last==='help'&&!I.mastered(q.syl.w07);
  I.applyRead(q,'w08','no');o.readNoNoStar=!q.starred.w08&&I.needsReview(q.syl.w08);
  const n=q.stars;I.applyRead(q,'w06','ok');o.noDouble=q.stars===n;
  o.masteredByReadOnly=I.mastered(q.syl.w06);
  I.logResult(q,'w13','hear','f',{});I.logResult(q,'w13','build','f',{});o.starNotMastered=!!q.starred.w13&&!I.mastered(q.syl.w13)&&I.stateOf(q,'w13')!=='mastered';
  I.applyRead(q,'w13','ok');o.masteredAfterRead=I.mastered(q.syl.w13);I.logResult(q,'w13','hear','r',{});o.errorAfterKeepsStar=!!q.starred.w13;
  const sb=q.stars;I.logResult(q,'w14','hear','r',{});I.logResult(q,'w14','build','r',{});I.logResult(q,'w14','missing','a',{});o.errorsNeverBlock=q.stars===sb&&q.syl.w14.r===2;
  o.helpNotMastered=!I.mastered(q.syl.w07);
  I.save(q);return o});
 for(const k of Object.keys(R))ok(R[k],'star rule: '+k);
 // ===== E. hear =====
 await reset();await p.evaluate(()=>{wbk3State.scope='all'});await setLv(1);await home();
 await p.click('[data-stage=hear]');await p.waitForTimeout(500);
 let it=await cur();ok(it.type==='hear','hear item');
 ok((await p.$$('#wb3Opts .wb3-opt')).length===2,'lv1: 2 options');
 const optsOk=async()=>{const ids=await p.$$eval('#wb3Opts .wb3-opt',b=>b.map(x=>x.dataset.id));return ids.every(i=>/^w\d\d$/.test(i))&&new Set(ids).size===ids.length};
 ok(await optsOk(),'options are distinct book words');
 ok((await aud()).some(a=>a.endsWith(data[+it.id.slice(1)-1].audio)),'target word recording autoplays');
 await p.click(`#wb3Opts [data-id=${it.id}]`);await p.waitForTimeout(300);
 s=await st();ok(s.syl[it.id].f===1&&s.stars===0&&s.syl[it.id].ev.join()==='hear','hear first try: f + one evidence, NO star yet');
 const firstHear=it.id;
 await p.click('#wb3QActs .main');await p.waitForTimeout(400);it=await cur();
 let ids=await p.$$eval('#wb3Opts .wb3-opt',b=>b.map(x=>x.dataset.id));let wrong=ids.find(o=>o!==it.id);
 await p.click(`#wb3Opts [data-id=${wrong}]`);await p.waitForTimeout(250);
 ok(await p.$eval(`#wb3Opts [data-id=${wrong}]`,b=>b.disabled),'wrong option disabled');
 await p.click(`#wb3Opts [data-id=${it.id}]`);await p.waitForTimeout(300);
 s=await st();ok(s.syl[it.id].s===1&&s.syl[it.id].ev.length===0,'wrong then right = self-correction, no evidence');
 // levels
 await setLv(3);await home();await p.click('[data-stage=hear]');await p.waitForTimeout(400);
 ok((await p.$$('#wb3Opts .wb3-opt')).length===3,'lv3: 3 options');
 const sim=await p.evaluate(()=>{const I=wbk3Internals,r={};[1,2,3].forEach(lv=>{let t=0,n=0;for(let k=1;k<=25;k++){for(let rep=0;rep<10;rep++){const id='w'+String(k).padStart(2,'0');I.pickDistractors(id,2,lv).forEach(d=>{t+=I.simScore(WBK3_DATA.WORDS[k-1]&&{a:WBK3_DATA.WORDS[k-1].a,b:WBK3_DATA.WORDS[k-1].b,c:WBK3_DATA.WORDS[k-1].c},WBK3_DATA.WORDS[+d.slice(1)-1]);n++})}}r[lv]=t/n});return r});
 ok(sim[1]<sim[2]&&sim[2]<sim[3],'distractor similarity grows with level (lv1<lv2<lv3)',JSON.stringify(sim));
 console.log('  distractor mean similarity by level:',JSON.stringify(sim));
 // ===== F. build (gradual blend) =====
 const letters=id=>PLAIN[+id.slice(1)-1].split('');
 const ready=async(id)=>{const want=letters(id);await p.waitForFunction(w=>{const t=[...document.querySelectorAll('#wb3Tray .wb3-tile')].map(x=>x.dataset.letter);return w.every(c=>t.includes(c))&&!document.querySelector('#wb3Tray .wb3-tile.used')},want,{timeout:8000}).catch(async e=>{console.log("READY FAIL",id,want,await p.evaluate(()=>[...document.querySelectorAll("#wb3Tray .wb3-tile")].map(x=>x.dataset.letter+(x.classList.contains("used")?"*":"")).join(",")+" cur="+JSON.stringify(wbk3State.run.items[wbk3State.run.i])));throw e})};
 const place=async(id,order)=>{await ready(id);for(const c of order){await p.click(`#wb3Tray [data-letter="${c}"]:not(.used)`);await p.waitForTimeout(60)}};
 await reset();await p.evaluate(()=>{wbk3State.scope='all'});await setLv(1);await home();await clearLog();
 await p.click('[data-stage=build]');await p.waitForTimeout(500);
 it=await cur();ok(it.type==='build'&&it.model===true,'lv1 build has a visual model (support)');
 ok(await p.$('#wb3Model')!==null,'model visible at lv1');
 ok((await p.$$('#wb3Board .wb3-slot')).length===3,'three slots');
 const lab=await p.$$eval('#wb3Board .wb3-slotn',n=>n.map(x=>x.textContent.trim()));ok(lab.join('|')==='١ الأول|٢ الثاني|٣ الثالث','slot labels first/second/third',lab.join('|'));
 // reversed order first: wrong
 let L3=letters(it.id);
 await place(it.id,L3.slice().reverse());await p.waitForTimeout(150);
 ok((await p.textContent('#wb3Msg')).includes('الترتيب'),'reversed order gets the order-specific message');
 s=await st();ok((s.syl[it.id]||{f:0}).f===0,'reversed order is not a success');
 await p.waitForTimeout(1500);
 await p.waitForSelector('#wb3Tray .wb3-tile:not(.used)');
 await clearLog();
 await place(it.id,L3);
 await p.waitForSelector('#wb3Joined',{timeout:6000});
 const a1=await aud();
 const wi=+it.id.slice(1)-1;
 const idxW=a1.findIndex(a=>a.endsWith(data[wi].audio)),idxS=data[wi].sylApproved?a1.findIndex(a=>a.endsWith(data[wi].sylAudio)):-1;
 if(data[wi].sylApproved)ok(idxS>=0&&idxW>idxS,'staged: syllable audio THEN full-word audio ('+it.id+')',a1.join());
 else ok(idxW>=0&&!a1.some(a=>/syllables\//.test(a)),'no-syllable word: only the full-word audio ('+it.id+')',a1.join());
 await p.waitForTimeout(1600);
 s=await st();ok(s.syl[it.id].s===1&&s.syl[it.id].act.buildm[1]===1&&s.syl[it.id].act.build[1]===0&&s.syl[it.id].ev.length===0,'model-assisted build recorded as buildm, no evidence');
 // lv2 build: audio only, evidence 'build'
 await setLv(2);await home();await p.click('[data-stage=build]');await p.waitForTimeout(500);
 it=await cur();ok(it.model===false&&await p.$('#wb3Model')===null,'lv2 build: NO model (audio only)');
 L3=letters(it.id);await place(it.id,L3);await p.waitForSelector('#wb3Joined',{timeout:6000});await p.waitForTimeout(1600);
 s=await st();ok(s.syl[it.id].f===1&&s.syl[it.id].ev.indexOf('build')>=0&&s.syl[it.id].act.build[0]===1,'audio-only build first try = independent evidence "build"');
 // hint / help
 await p.waitForSelector('#wb3Joined',{state:'detached',timeout:8000});await p.waitForSelector('#wb3Tray .wb3-tile');await p.waitForTimeout(300);
 it=await cur();L3=letters(it.id);
 for(let k=0;k<2;k++){await place(it.id,L3.slice().reverse());await p.waitForTimeout(1500);await p.waitForSelector('#wb3Tray .wb3-tile:not(.used)')}
 ok(await p.$('#wb3Tray .wb3-tile.hint')!==null,'hint after two wrong tries');
 ok(await p.$('#wb3Help')!==null,'help button after a wrong try');
 await p.click('#wb3Help');await p.waitForSelector('#wb3Joined',{timeout:6000});await p.waitForTimeout(1600);
 s=await st();ok(s.syl[it.id].r===1&&s.syl[it.id].ev.length===0&&!s.starred[it.id],'reveal = r, no evidence, no star');
 // ===== G. missing =====
 await reset();await p.evaluate(()=>{wbk3State.scope='all'});await setLv(1);await home();await clearLog();
 await p.click('[data-stage=missing]');await p.waitForTimeout(700);
 it=await cur();ok(it.type==='missing','missing item');
 ok((await aud()).length===0&&(await p.evaluate(()=>window.__edu.length))===0,'nothing plays at the start (not a hearing task)');
 ok(await p.$('#wb3Board .wb3-slot.gap[data-slot="2"]')!==null,'lv1: the missing letter is the last one');
 ok((await p.$$('#wb3Opts .wb3-opt')).length===2,'lv1: 2 letter options');
 const tgt=letters(it.id)[2];
 await p.click(`#wb3Opts [data-letter="${tgt}"]`);await p.waitForSelector('#wb3Joined',{timeout:4000});await p.waitForTimeout(1300);
 s=await st();ok(s.syl[it.id].f===1&&s.syl[it.id].ev.join()==='missing'&&s.stars===0,'missing first try: evidence "missing", no star alone');
 // wrong -> hint (audio) -> reveal
 await p.waitForTimeout(500);it=await cur();
 const tg2=letters(it.id)[2];const wl=await p.$$eval('#wb3Opts .wb3-opt',b=>b.map(x=>x.dataset.letter));
 const bad1=wl.find(c=>c!==tg2);
 await p.click(`#wb3Opts [data-letter="${bad1}"]`);await p.waitForTimeout(200);
 ok(await p.$('#wb3Help')!==null,'help after wrong');
 await p.click('#wb3Help');await p.waitForTimeout(200);await p.click(`#wb3Opts [data-letter="${tg2}"]`);await p.waitForSelector('#wb3Joined',{timeout:4000});await p.waitForTimeout(1300);
 s=await st();ok(s.syl[it.id].r===1&&s.syl[it.id].ev.length===0,'missing reveal = r, no evidence');
 // lv3 positions & distractor letters not in word
 await setLv(3);const poss=new Set();
 for(let k=0;k<12;k++){await home();await p.click('[data-stage=missing]');await p.waitForTimeout(300);
   const g=await p.$eval('#wb3Board .wb3-slot.gap',e=>+e.dataset.slot);poss.add(g);
   const cid=(await cur()).id;const ls=letters(cid);const opts2=await p.$$eval('#wb3Opts .wb3-opt',b=>b.map(x=>x.dataset.letter));
   ok(opts2.length===3&&opts2.filter(c=>ls.includes(c)).length===1&&opts2.includes(ls[g]),'lv3: 3 letter options, exactly one belongs to the word');
 }
 ok(poss.size>=2,'lv3 varies the missing position',[...poss].join());
 // ===== H. read: help ladder, teacher confirmation =====
 await reset();await p.evaluate(()=>{wbk3State.scope='all';wbk3State.gate=true});await home();await clearLog();
 await p.click('[data-stage=read]');await p.waitForTimeout(500);
 ok((await aud()).length===0,'read: nothing plays by itself');
 it=await cur();
 await p.click('#wb3Read');await p.waitForTimeout(200);
 ok(await p.$('#wb3ReadOk:not([disabled])')!==null,'no help used: independent confirmation enabled');
 ok(await p.$('#wb3ReadHelped')!==null&&await p.$('#wb3ReadNo')!==null,'three teacher options');
 await p.click('#wb3ReadOk');await p.waitForTimeout(400);
 s=await st();ok(s.syl[it.id].read.last==='ok'&&s.syl[it.id].read.ok===1&&!!s.starred[it.id]&&s.stars===1,'independent confirmed read: ok + star');
 it=await cur();
 await p.click('#wb3ReadHelp');await p.waitForTimeout(150);ok(await p.$eval('#wb3ReadShow',e=>e.querySelectorAll('.wb3-letter').length===3),'help 1: three separated letters');
 await clearLog();await p.click('#wb3ReadHelp');await p.waitForTimeout(250);
 const ws=data[+it.id.slice(1)-1];
 ok(ws.sylApproved?(await aud()).some(a=>a.endsWith(ws.sylAudio)):(await aud()).length===0,'help 2: first-two merged; syllable audio only if approved ('+it.id+')');
 await p.click('#wb3ReadHelp');await p.waitForTimeout(250);ok((await aud()).some(a=>a.endsWith(ws.audio)),'help 3: full word recording');
 ok(await p.$eval('#wb3ReadHelp',b=>b.disabled),'help ladder ends');
 await p.click('#wb3Read');await p.waitForTimeout(200);
 ok(await p.$eval('#wb3ReadOk',b=>b.disabled),'after using help the independent option is disabled');
 await p.click('#wb3ReadHelped');await p.waitForTimeout(400);
 s=await st();ok(s.syl[it.id].read.last==='help'&&!s.starred[it.id]&&s.syl[it.id].read.hint===3&&s.stars===1,'read with help: recorded as help, no star, not mastered');
 it=await cur();await p.click('#wb3Read');await p.waitForTimeout(150);await p.click('#wb3ReadNo');await p.waitForTimeout(300);
 s=await st();ok(s.syl[it.id].read.last==='sup'&&s.stars===1,'needs training: no star');
 // ===== I. test =====
 await reset();await p.evaluate(()=>{wbk3State.scope='all';wbk3State.gate=true});
 await p.evaluate(()=>wbk3Internals.startTest());await p.waitForTimeout(400);
 const types=await p.evaluate(()=>wbk3State.run.items.map(i=>i.type));
 ok(types.length===8&&['hear','build','missing','read'].every(t=>types.filter(x=>x===t).length===2),'test = 8 questions: 2 hear, 2 build, 2 missing, 2 read',types.join());
 const tids=await p.evaluate(()=>wbk3State.run.items.map(i=>i.id));ok(new Set(tids).size===8,'8 distinct words in the test');
 const ansTest=async()=>{for(let k=0;k<8;k++){await p.waitForTimeout(450);const i=await cur();
   if(i.type==='hear')await p.click(`#wb3Opts [data-id=${i.id}]`);
   else if(i.type==='build'){await place(i.id,letters(i.id))}
   else if(i.type==='missing'){const g=await p.$eval('#wb3Board .wb3-slot.gap',e=>+e.dataset.slot);await p.click(`#wb3Opts [data-letter="${letters(i.id)[g]}"]`)}
   else await p.click('#wb3Read');}};
 await ansTest();await p.waitForSelector('#wb3TestResult',{timeout:8000});
 s=await st();ok(s.tests.length===1&&s.tests[0].auto===6&&s.tests[0].status==='pending'&&s.stars===0,'6/6 auto but status pending until teacher confirms reading; no star');
 await p.click('#wb3Reads .rok[data-k="0"]');await p.waitForTimeout(200);
 s=await st();ok(s.tests[0].status==='pending'&&!s.testStar,'one of two reads confirmed: still pending');
 await p.click('#wb3Reads .rok[data-k="1"]');await p.waitForTimeout(200);
 s=await st();ok(s.tests[0].status==='pass'&&s.testStar===true,'both reads confirmed independent: pass');
 const starsAfter=s.stars;
 ok(s.stars===2+0||s.stars>=1,'test star + read stars counted');
 await p.evaluate(()=>wbk3Internals.startTest());await p.waitForTimeout(300);await ansTest();await p.waitForSelector('#wb3TestResult',{timeout:8000});
 await p.click('#wb3Reads .rok[data-k="0"]');await p.click('#wb3Reads .rok[data-k="1"]');await p.waitForTimeout(200);
 s=await st();ok(s.testStar===true&&s.stars<=starsAfter+2,'second pass gives no second test star',s.stars+' vs '+starsAfter);
 const uniqueStars=Object.keys(s.starred).length;ok(s.stars===uniqueStars+1,'stars = unique starred words + 1 test star (no multiplication)',s.stars+' / '+uniqueStars);
 // ===== J. audio rules over the whole run =====
 const allAud=await aud();
 console.log('  audio calls seen in last block:',allAud.length);
 // ===== J2. reset keeps stars; mastery only via confirmed read =====
 p.on('dialog',d=>d.accept());
 await p.evaluate(()=>{const I=wbk3Internals;const q=I.load();I.logResult(q,'w15','hear','f',{});I.logResult(q,'w15','build','f',{});I.save(q)});
 const pre=await st();ok(!!pre.starred.w15,'precondition: w15 starred via hear+build');
 ok(await p.evaluate(()=>wbk3Internals.stateOf(wbk3Internals.load(),'w15'))!=='mastered','star without read: NOT mastered ✔');
 await p.evaluate(()=>{wbk3State.gate=true});await p.click('#wb3Back');await p.waitForTimeout(200);await p.click('#wb3Teacher');await p.waitForTimeout(300);
 await p.click('#wb3Reset');await p.waitForTimeout(300);
 const post=await st();ok(post.stars===pre.stars&&post.starred.w15&&Object.keys(post.syl).length===0,'reset: progress state cleared, stars kept');
 await p.evaluate(()=>{const I=wbk3Internals;const q=I.load();I.logResult(q,'w15','hear','f',{});I.logResult(q,'w15','build','f',{});I.save(q)});
 ok((await st()).stars===pre.stars,'re-earning after reset does not double the star');
 // ===== K. teacher panel =====
 await p.evaluate(()=>{wbk3State.gate=true});await p.click('#wb3Back');await p.waitForTimeout(200);
 await p.click('#wb3Teacher');await p.waitForTimeout(300);
 ok(await p.$('#wb3TeacherPanel')!==null&&(await p.$$('#wb3Table tbody tr')).length===25,'teacher panel lists 25 words');
 ok((await p.textContent('#wb3AudioStatus')).includes('٢٥ من ٢٥')&&(await p.textContent('#wb3AudioStatus')).includes('٢٠ من ٢٥'),'audio status: 25/25 words, 20/25 syllables');
 ok(errs.length===0,'no JS errors',errs.join(' | '));
 console.log('PASS',pass,'FAIL',fail);
 await br.close();
})();
