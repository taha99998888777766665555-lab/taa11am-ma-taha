/* المستويات التسعة القديمة: مفتوحة فعلًا، ودخولها لا يمسّ أي بيانات. PORT=8992 node tests/ui/levels.js
   يُشغَّل أيضًا على main (PORT=8990 BASE=1) لإثبات القفل الأصلي. */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const PORT=process.env.PORT||8992,BASE=process.env.BASE==='1',Q=BASE?'':'?ui=v2&shots=1';
let pass=0,fail=0;const ok=(c,m,d)=>{if(c)pass++;else{fail++;console.log('  ✗',m,d!==undefined?JSON.stringify(d):'')}};
const snap=p=>p.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return JSON.stringify(Object.keys(o).sort().map(k=>[k,o[k]]))});
(async()=>{const br=await chromium.launch();
const mkp=async(vp={width:390,height:844})=>{const ctx=await br.newContext({viewport:vp,hasTouch:true,isMobile:vp.width<600,serviceWorkers:'block'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));return{ctx,p,errs}};
async function openAll(p,errs,label){
 const res=[];
 for(let i=1;i<=9;i++){
  await p.evaluate(()=>showScreen('words'));await p.waitForTimeout(250);
  const card=p.locator('#wordsLevelsGrid .words-level-card-btn').nth(i-1);
  await card.scrollIntoViewIfNeeded();await card.click({timeout:3000});await p.waitForTimeout(350);
  const r=await p.evaluate(()=>({lvl:(typeof wordsLevelState!=='undefined'&&wordsLevelState)?wordsLevelState.levelId:null,tasks:(wordsLevelState&&wordsLevelState.tasks||[]).length,stage:(document.getElementById('wordsTaskStage')||{}).textContent.trim().length,shown:getComputedStyle(document.getElementById('wordsLevelCard')).display}));
  res.push(r);
  await p.evaluate(()=>backToWordsLevels());await p.waitForTimeout(150);
 }
 if(!BASE){res.forEach((r,k)=>{ok(r.lvl===k+1&&r.shown==='block'&&r.tasks===10&&r.stage>0,`${label}: دخول المستوى ${k+1} مباشرة (10 مهام ومحتوى ظاهر)`,r)})}
 ok(errs.length===0,`${label}: لا أخطاء JS`,errs);
 return res}
/* ١) طالب جديد بلا تقدم */
{const {ctx,p,errs}=await mkp();await p.addInitScript(()=>{try{if(!localStorage.getItem('__seeded')){localStorage.setItem('taha_child_name','جديد');localStorage.setItem('taha_child_avatar','🦁');localStorage.setItem('__seeded','1')}}catch(e){}});
 await p.goto(`http://127.0.0.1:${PORT}/index.html${Q}`);await p.waitForTimeout(1400);await p.evaluate(()=>showScreen('words'));await p.waitForTimeout(400);
 const g=await p.evaluate(()=>({n:document.querySelectorAll('#wordsLevelsGrid .words-level-card-btn').length,locked:document.querySelectorAll('#wordsLevelsGrid .locked').length,lockEmoji:/🔒/.test(document.getElementById('wordsLevelsGrid').textContent),blockers:[...document.querySelectorAll('#wordsLevelsGrid button')].filter(b=>/showWordsLockedMessage/.test(b.getAttribute('onclick')||'')).length,sug:[...document.querySelectorAll('#wordsLevelsGrid .suggested')].map(e=>e.textContent.trim().slice(0,12))}));
 console.log('طالب جديد — شبكة المستويات:',JSON.stringify(g));
 if(BASE){console.log('   (main) مقفل:',g.locked,'من',g.n)}
 else{ok(g.n===9,'تسعة مستويات كلها موجودة',g);ok(g.locked===0&&!g.lockEmoji&&g.blockers===0,'لا أقفال ولا منع (لا class locked ولا 🔒 ولا رسالة منع)',g);ok(g.sug.length===1,'مستوى مقترح واحد مميَّز',g)}
 const before=await snap(p);
 await openAll(p,errs,'طالب جديد');
 const after=await snap(p);
 if(!BASE)ok(before===after,'طالب جديد: فتح المستويات التسعة لم يغيّر أي مفتاح تخزين',{b:before.length,a:after.length});
 await ctx.close()}
if(BASE){console.log('PASS',pass,'FAIL',fail);await br.close();return}
/* ٢) طالب لديه تقدم: المستويات 1-3 مكتملة، المحفوظ=4 */
{const {ctx,p,errs}=await mkp();
 await p.addInitScript(()=>{try{if(!localStorage.getItem('__seeded')){localStorage.setItem('taha_child_name','متقدم');localStorage.setItem('taha_child_avatar','🦁');localStorage.setItem('taha_words_unlocked_level','4');localStorage.setItem('taha_words_level_best',JSON.stringify({1:10,2:9,3:8}));localStorage.setItem('taha_app_stars','37');localStorage.setItem('__seeded','1')}}catch(e){}});
 await p.goto(`http://127.0.0.1:${PORT}/index.html${Q}`);await p.waitForTimeout(1400);await p.evaluate(()=>showScreen('words'));await p.waitForTimeout(400);
 const g=await p.evaluate(()=>({done:document.querySelectorAll('#wordsLevelsGrid .completed').length,sug:[...document.querySelectorAll('#wordsLevelsGrid .suggested')].map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,30)),locked:document.querySelectorAll('#wordsLevelsGrid .locked').length}));
 ok(g.done===3&&g.sug.length===1&&/٤/.test(g.sug[0])&&g.locked===0,'طالب متقدم: ٣ مكتملة، المقترح = المستوى ٤، صفر أقفال',g);
 const before=await snap(p);
 await openAll(p,errs,'طالب متقدم');
 const after=await snap(p);
 ok(before===after,'طالب متقدم: النجوم والتقدم ونتائج المستويات كما هي بعد فتح التسعة',{});
 ok(await p.evaluate(()=>localStorage.getItem('taha_app_stars')==='37'&&localStorage.getItem('taha_words_unlocked_level')==='4'&&localStorage.getItem('taha_words_level_best')===JSON.stringify({1:10,2:9,3:8})),'القيم المحفوظة بعينها: نجوم ٣٧، مستوى ٤، نتائج 10/9/8');
 /* إنهاء مستوى بعيد (٧) بنجاح لا يفقد شيئًا: النتيجة تُحفظ، والمستوى المحفوظ لا ينخفض ولا يقفز */
 await p.evaluate(()=>{showScreen('words');openWordsLevel(7);wordsLevelState.correctCount=9;finishWordsLevel()});await p.waitForTimeout(400);
 const post=await p.evaluate(()=>({lvl:localStorage.getItem('taha_words_unlocked_level'),best:JSON.parse(localStorage.getItem('taha_words_level_best')),stars:localStorage.getItem('taha_app_stars')}));
 ok(post.lvl==='4'&&post.best[7]===9&&post.best[1]===10&&post.best[2]===9&&post.best[3]===8,'إنهاء المستوى ٧ مباشرة: المستوى المحفوظ ٤ ثابت، ونتيجة ٧ تُحفظ، ونتائج ١–٣ سليمة',post);
 console.log('   نجوم بعد نجاح المستوى ٧:',post.stars,'(القاعدة القائمة: +١٠ عند ≥٨/١٠، لم تتغير)');
 await ctx.close()}
/* ٣) طالبان: فتح المستويات لأحدهما لا يمسّ الآخر */
{const {ctx,p,errs}=await mkp();
 await p.addInitScript(()=>{try{if(!localStorage.getItem('__seeded')){localStorage.setItem('taha_child_name','أول');localStorage.setItem('taha_child_avatar','🦁');localStorage.setItem('__seeded','1')}}catch(e){}});
 await p.goto(`http://127.0.0.1:${PORT}/index.html${Q}`);await p.waitForTimeout(1400);
 const ids=await p.evaluate(()=>{const a=StudentStore.currentId();const b=StudentStore.add('طالب ثانٍ');return{a,b}});
 await p.evaluate(({a,b})=>{StudentStore.switchTo(a)},ids).catch(()=>{});await p.waitForTimeout(1800);
 await p.evaluate(()=>{localStorage.setItem('taha_words_unlocked_level','5')});
 const sA=await snap(p);
 await p.evaluate(b=>StudentStore.switchTo(b),ids.b).catch(()=>{});await p.waitForTimeout(1800);
 await p.evaluate(()=>showScreen('words'));await p.waitForTimeout(400);
 const g=await p.evaluate(()=>({locked:document.querySelectorAll('#wordsLevelsGrid .locked').length,sug:[...document.querySelectorAll('#wordsLevelsGrid .suggested')].length}));
 ok(g.locked===0,'الطالب الثاني الجديد: صفر أقفال',g);
 await openAll(p,errs,'الطالب الثاني الجديد');
 await p.evaluate(a=>StudentStore.switchTo(a),ids.a).catch(()=>{});await p.waitForTimeout(1800);
 const sA2=await snap(p);
 const A=new Map(JSON.parse(sA)),B=new Map(JSON.parse(sA2));
 const changed=[...A.keys()].filter(k=>B.has(k)&&A.get(k)!==B.get(k)),removed=[...A.keys()].filter(k=>!B.has(k)),added=[...B.keys()].filter(k=>!A.has(k));
 console.log('   الطالب الأول بعد العودة — معدَّل:',changed.length,'محذوف:',removed.length,'مضاف تلقائيًا (إعدادات أولية لأقسام أخرى عند أول تحميل):',added.map(k=>k.split('__')[1]).join(','));
 ok(changed.length===0&&removed.length===0,'بيانات الطالب الأول (نجوم/تقدم/مستويات) لم يُعدَّل أو يُحذف منها شيء بعد أن فتح الثاني كل المستويات',{changed,removed});
 ok(added.every(k=>!/words|stars/.test(k)),'لا مفاتيح كلمات/نجوم أُضيفت للأول',added);
 await ctx.close()}
console.log('PASS',pass,'FAIL',fail);await br.close()})();
