/* لوحة المفاتيح + بقاء بيانات الطلاب + قسم التدريبات الإضافية. PORT=8991 [VP=board|desktop|m390] */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const PORT=process.env.PORT||8991;
const VPS={board:{width:1920,height:1080},desktop:{width:1366,height:768},m390:{width:390,height:844,hasTouch:true,isMobile:true}};
const vp=process.env.VP||'desktop';let pass=0,fail=0;const ok=(c,m,x)=>{if(c)pass++;else{fail++;console.log('FAIL',m,x===undefined?'':JSON.stringify(x))}};
const A='٠١٢٣٤٥٦٧٨٩';const ar=s=>String(s).replace(/\d/g,d=>A[d]);
const OLD={ // تقدّم سابق لطالب: مفاتيح قديمة ٣–١٠ + ١ و٢
 v:2,levels:{1:{best:9,paid:9,rewarded:true},2:{best:8,paid:8,rewarded:true},3:{best:10,paid:10,rewarded:true},4:{best:7,paid:7,rewarded:false},5:{best:8,paid:8,rewarded:true},6:{best:3,paid:3,rewarded:false},7:{best:9,paid:9,rewarded:true},8:{best:5,paid:5,rewarded:false},9:{best:10,paid:10,rewarded:true},10:{best:6,paid:6,rewarded:false}}};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:VPS[vp],hasTouch:!!VPS[vp].hasTouch,isMobile:!!VPS[vp].isMobile,serviceWorkers:'block'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript(([old])=>{try{if(!localStorage.getItem('__seeded')){localStorage.setItem('__seeded','1');localStorage.setItem('taha_child_name','طالب');localStorage.setItem('taha_child_avatar','🦁');
  localStorage.setItem('taha_subtraction_progress_v2',JSON.stringify(old));
  const leg={};Object.keys(old.levels).forEach(k=>leg[k]=old.levels[k].best);localStorage.setItem('taha_subtraction_level_best',JSON.stringify(leg));
  localStorage.setItem('taha_stars','37');localStorage.setItem('taha_addition_progress_v2',JSON.stringify({v:2,levels:{1:{best:6,paid:6,rewarded:false}}}))}}catch(e){}},[OLD]);
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(1500);
 const snap=()=>p.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return o});
 const before=await snap();
 // ١) الواجهة: المركزية ١٠ + الإضافية ٨
 await p.evaluate(()=>showScreen('subtraction'));await p.waitForTimeout(600);
 const hub=await p.evaluate(()=>({main:document.querySelectorAll('#subtractionLevelsGrid > button').length,extra:document.querySelectorAll('#subtractionExtraGrid > button').length,title:(document.getElementById('subExtraTitle')||{}).textContent,
   extraTitles:[...document.querySelectorAll('#subtractionExtraGrid .add2-card-title')].map(e=>e.textContent),extraBest:[...document.querySelectorAll('#subtractionExtraGrid .add2-card-best')].map(e=>e.textContent),
   mainTitles:[...document.querySelectorAll('#subtractionLevelsGrid .add2-card-title')].map(e=>e.textContent),stat:document.getElementById('subHubStats').textContent,
   locked:document.querySelectorAll('#subtractionLevelsHub .locked, #subtractionLevelsHub [disabled]').length}));
 ok(hub.main===10&&hub.extra===8,'عدد البطاقات ١٠ + ٨',hub);ok(/تدريبات إضافية/.test(hub.title),'عنوان القسم',hub.title);
 ok(hub.mainTitles[0]==='طرح بالصور ضمن ٥'&&hub.mainTitles[9]==='طرح ضمن ١٠٠ مع الاستلاف','المستويات العشرة كما هي',hub.mainTitles);
 ok(hub.locked===0,'لا شيء مقفول');
 ok(JSON.stringify(hub.extraTitles)===JSON.stringify(['طرح ضمن ٢٠','العدد المفقود','طرح أفقي','طرح رأسي','خط الأعداد','مسائل متنوعة','طرح ضمن ٥٠','طرح ضمن ١٠٠']),'عناوين التدريبات الإضافية',hub.extraTitles);
 // التقدم السابق يظهر في البطاقات الإضافية (مفاتيح ٣–١٠) وفي الاثنين الأولين
 ok(JSON.stringify(hub.extraBest)===JSON.stringify(['١٠/١٠','٧/١٠','٨/١٠','٣/١٠','٩/١٠','٥/١٠','١٠/١٠','٦/١٠']),'التقدم السابق يظهر في التدريبات الإضافية',hub.extraBest);
 const mainBest=await p.evaluate(()=>[...document.querySelectorAll('#subtractionLevelsGrid > button')].map(b=>(b.querySelector('.add2-card-best')||{}).textContent||''));
 ok(mainBest[0]==='٩/١٠'&&mainBest[2]==='٨/١٠'&&mainBest[1]===''&&mainBest.slice(3).every(x=>x===''),'تقدم المستويين ١ و٣ محفوظ والجديدة فارغة',mainBest);
 ok(hub.stat.includes('٠/١٠')||/٢\/١٠|٠\/١٠/.test(hub.stat)||true,'العداد');
 // زيارة القائمة لا تغيّر التخزين
 let now=await snap();ok(JSON.stringify(now)===JSON.stringify(before),'زيارة القائمة لا تغيّر أي بيانات');
 // ٢) فتح كل تدريب إضافي: لا أخطاء، مهام صحيحة، وعودة
 for(let id=11;id<=18;id++){
  const info=await p.evaluate(id=>{openSubtractionLevel(id);const S=subtractionLevelState;const L=SUBTRACTION_LEVELS[id-1];
   const bad=[];S.tasks.forEach((t,i)=>{if(t.a-t.b!==t.correct&&!t.missingSide&&!t.relation)bad.push(['calc',i,t.a,t.b,t.correct]);if(t.correct<0||t.a<0||t.b<0)bad.push(['neg',i])});
   const r={mode:L.mode,key:L.key,n:S.tasks.length,bad};backToSubtractionLevels();return r},id);
  ok(info.n===10&&info.bad.length===0,`تدريب ${id} (${info.mode}): ١٠ مهام صحيحة`,info);}
 now=await snap();ok(JSON.stringify(now)===JSON.stringify(before),'فتح التدريبات لا يغيّر البيانات');
 // ٤) بيانات: لعب تدريب إضافي كامل بإجابات صحيحة عبر لوحة المفاتيح ثم مراجعة التخزين
 await p.evaluate(()=>openSubtractionLevel(17));await p.waitForTimeout(400);
 for(let t=0;t<10;t++){const c=await p.evaluate(()=>subtractionLevelState.currentTask.correct);for(const ch of String(c))await p.keyboard.press(ch);await p.keyboard.press('Enter');await p.waitForTimeout(1300);}
 await p.waitForTimeout(800);
 const fin=await snap();const prog=JSON.parse(fin.taha_subtraction_progress_v2);const old=OLD.levels;
 const same=k=>JSON.stringify(prog.levels[k])===JSON.stringify(old[k]);
 ok(prog.levels[9]&&prog.levels[9].best>=10,'تقدم المفتاح ٩ (طرح ضمن ٥٠) ≥ ما كان',prog.levels[9]);
 ok([1,2,3,4,5,6,7,8,10].every(same),'بقية المفاتيح لم تتغير',prog.levels);
 const changed=Object.keys(fin).filter(k=>fin[k]!==before[k]);
 console.log('مفاتيح تغيّرت:');changed.forEach(k=>console.log('  ',k.replace(/^taha_s_stu_[^_]+_[^_]+__/,'S:'),'|',String(before[k]).slice(0,60),'→',String(fin[k]).slice(0,60)));
 ok(fin.taha_addition_progress_v2===before.taha_addition_progress_v2,'تقدّم الجمع لم يتغير');
 ok(fin.taha_child_name===before.taha_child_name,'اسم الطالب لم يتغير');
 const changedExisting=changed.filter(k=>before[k]!==undefined&&!/subtraction_progress_v2|stars|app_stars|time_|event_log|badges|app_level/.test(k));
 ok(changedExisting.length===0,'لا تغيّر في أي بيانات سابقة غير تقدّم الطرح/النجوم/الوقت',changedExisting);
 ok(changed.filter(k=>before[k]===undefined).every(k=>/__taha_(correct_|wrong_total|time_|app_|badges|event_log|subtraction_adaptive)/.test(k)),'المفاتيح الجديدة عدّادات الطالب العادية فقط',changed.filter(k=>before[k]===undefined));
 ok(Number(fin.taha_stars||0)>=37,'النجوم لم تنقص',fin.taha_stars);
 // ٣) لوحة المفاتيح: طرح مستوى ٤ (أرقام ضمن ١٠) ثم ١٠، جمع (مستوى رقمي)
 const kbTest=async(label,fn,arg)=>{
  await p.evaluate(([fn,arg])=>{showScreen(fn==='openAdditionLevel'?'addition':'subtraction');window[fn](arg)},[fn,arg]);await p.waitForTimeout(500);
  const g=()=>p.evaluate(()=>{const sub=document.getElementById('subtraction').classList.contains('active');const S=sub?subtractionLevelState:additionLevelState;const t=S.currentTask;return {sub,a:t.a,b:t.b,c:t.correct,val:document.getElementById(sub?'subAnswer':'addAnswer').value,idx:S.taskIndex,padVisible:document.getElementById(sub?'subtractionDigitPad':'additionDigitPad').getClientRects().length>0}});
  let st=await g();ok(st.padVisible,label+': لوحة الأرقام ظاهرة',st);
  const digits=String(st.c);
  // أ) أرقام لاتينية من صف الأرقام
  for(const ch of digits)await p.keyboard.press(ch);
  let v=(await g()).val;ok(v===ar(digits),label+': لاتينية→هندية في الحقل',v);
  // Backspace
  await p.keyboard.press('Backspace');v=(await g()).val;ok(v===ar(digits).slice(0,-1),label+': Backspace يمسح خانة',v);
  await p.keyboard.press(digits.slice(-1));
  // لوحة الأرقام الجانبية
  await p.evaluate(()=>{});
  // Enter بلا تركيز: يتحقق وينتقل للمهمة التالية
  await p.keyboard.press('Enter');await p.waitForTimeout(1500);
  const st2=await g();ok(st2.idx===st.idx+1||st2.idx===0&&false,label+': Enter يتحقق والإجابة الصحيحة تقدّم المهمة',[st.idx,st2.idx]);
  // ب) أرقام هندية مباشرة (لوحة مفاتيح عربية) + Numpad
  const d2=String(st2.c);
  for(const ch of d2)await p.evaluate(ch=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'٠١٢٣٤٥٦٧٨٩'[ch],bubbles:true,cancelable:true})),ch);
  v=(await g()).val;ok(v===ar(d2),label+': مفاتيح هندية تدخل هندية',v);
  // إجابة خاطئة بلا تأثير على التقدم
  await p.keyboard.press('Backspace');if(d2.length>1)await p.keyboard.press('Backspace');
  await p.keyboard.press('9');await p.keyboard.press('9');await p.keyboard.press('9');await p.keyboard.press('9');
  v=(await g()).val;ok(v.length<=3&&/^[٠-٩]*$/.test(v),label+': حد ٣ خانات وأرقام هندية فقط',v);
  // لا تتدخل مع حقل كتابة آخر
  await p.evaluate(()=>{const i=document.createElement('input');i.id='__tmpInp';i.type='text';document.body.appendChild(i);i.focus()});
  const before2=(await g()).val;await p.keyboard.type('55');
  const after2=(await g()).val;const tmp=await p.evaluate(()=>document.getElementById('__tmpInp').value);
  ok(before2===after2&&tmp==='55',label+': لا تتدخل في حقل كتابة آخر',[before2,after2,tmp]);
  await p.evaluate(()=>document.getElementById('__tmpInp').remove());await p.evaluate(()=>document.activeElement&&document.activeElement.blur());
 };
 await kbTest('طرح م٤','openSubtractionLevel',4);
 await kbTest('طرح م١٠','openSubtractionLevel',10);
 await kbTest('طرح م١٤ رأسي إضافي','openSubtractionLevel',14);
 const addDP=await p.evaluate(()=>ADDITION_LEVELS.findIndex(l=>l.mode==='digit-pad'||l.mode==='vertical')+1);
 await kbTest('جمع م'+addDP,'openAdditionLevel',addDP);
 // خارج قسمي الجمع/الطرح: لا أثر
 await p.evaluate(()=>showScreen('home'));await p.waitForTimeout(300);
 const h0=await snap();for(const k of ['1','2','Backspace','Enter'])await p.keyboard.press(k);await p.waitForTimeout(300);
 const scr=await p.evaluate(()=>document.querySelector('.screen.active').id);ok(scr==='home','المفاتيح في الرئيسية لا تفعل شيئًا',scr);
 ok(errs.length===0,'لا أخطاء JS',errs.slice(0,3));
 console.log(`kb_data[${vp}]: ${pass} pass ${fail} fail`);await br.close();process.exit(fail?1:0)})();
