/* مستويات الطرح العشرة: كل جولة ١٠ مسائل صحيحة، بلا ناتج سالب، ومطابقة لمهارة المستوى (استلاف/دون استلاف بتعريف مستقل). PORT=8991 */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const PORT=process.env.PORT||8991;
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
(async()=>{const br=await chromium.launch();const p=await br.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript(()=>{try{localStorage.setItem('taha_child_name','طالب');localStorage.setItem('taha_child_avatar','🦁')}catch(e){}});
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(1500);
 const titles=await p.evaluate(()=>SUBTRACTION_MAIN_LEVELS.map(l=>l.title+'|'+l.mode+'|'+l.max));
 const want=['طرح بالصور ضمن ٥|concrete-removal|5','طرح بالأرقام ضمن ٥|choice-result|5','طرح بالصور ضمن ١٠|ten-frame|10','طرح بالأرقام ضمن ١٠|digit-pad|10','طرح ضمن ٢٠ دون استلاف|digit-pad|20','طرح ضمن ٢٠ مع الاستلاف|digit-pad|20','طرح ضمن ٥٠ دون استلاف|digit-pad|50','طرح ضمن ٥٠ مع الاستلاف|digit-pad|50','طرح ضمن ١٠٠ دون استلاف|digit-pad|100','طرح ضمن ١٠٠ مع الاستلاف|digit-pad|100'];
 ok(JSON.stringify(titles)===JSON.stringify(want),'ترتيب المستويات العشرة وأنماطها كما طلب المستخدم',titles.join(' ; '));
 ok(await p.evaluate(()=>new Set(SUBTRACTION_MAIN_LEVELS.map(l=>l.key)).size===10),'مفاتيح التقدم فريدة');
 const R=await p.evaluate(()=>{ // مستقل عن تعريف التطبيق: حاجة الاستلاف بمقارنة الخانات
  const borrow=(a,b)=>{while(a>0||b>0){if(a%10<b%10)return true;a=Math.floor(a/10);b=Math.floor(b/10)}return false};
  const out=[];
  SUBTRACTION_MAIN_LEVELS.forEach(l=>{const o={id:l.id,bad:[],pairs:new Set(),tierDown:0,len:0,zero:0,minA:999,maxA:0,rounds:0};
   for(let r=0;r<400;r++){const tasks=generateSubtractionTasksForLevel(l);o.rounds++;
    if(tasks.length!==10)o.bad.push('len '+tasks.length);
    const seen=new Set();let lastTier=0;
    tasks.forEach(t=>{const k=t.a+'-'+t.b;if(seen.has(k))o.bad.push('dup '+k);seen.add(k);o.pairs.add(k);
      if(t.correct!==t.a-t.b)o.bad.push('calc '+k);if(t.correct<0)o.bad.push('neg '+k);if(t.b<1||t.b>t.a)o.bad.push('range '+k);
      if(t.a>l.max)o.bad.push('>max '+k);if(t.correct===0)o.zero++;o.minA=Math.min(o.minA,t.a);o.maxA=Math.max(o.maxA,t.a);
      const bw=borrow(t.a,t.b);
      if([5,7,9].includes(l.id)&&bw)o.bad.push('borrow-in-noborrow '+k);
      if([6,8,10].includes(l.id)&&!bw)o.bad.push('noborrow-in-borrow '+k);
      if(l.id===5||l.id===6){if(t.a<11||t.a>20)o.bad.push('a-range20 '+k)}
      if(l.id===7||l.id===8){if(t.a<20||t.a>50)o.bad.push('a-range50 '+k)}
      if(l.id===9){if(t.a<51||t.a>99)o.bad.push('a-range100nb '+k)}
      if(l.id===10){if(t.a<52||t.a>100)o.bad.push('a-range100b '+k)}
      if(l.id===1||l.id===2){if(t.a>5||t.a<2)o.bad.push('a5 '+k)}
      if(l.id===3){if(t.a>10)o.bad.push('a10 '+k)}
      if(l.id===4){if(t.a<5||t.a>10)o.bad.push('a10n '+k)}
      if(l.mode==='choice-result'||l.mode==='concrete-removal'||l.mode==='ten-frame'){if(!t.choices||new Set(t.choices).size!==3||t.choices.indexOf(t.correct)<0||t.choices.some(c=>c<0))o.bad.push('choices '+k+' '+t.choices)}
      if(l.mode==='choice-result'&&t.choices.some(c=>c>l.max))o.bad.push('choice>max '+k+' '+t.choices);
      if(t.tier<lastTier)o.tierDown++;lastTier=t.tier});}
   o.pairs=o.pairs.size;o.bad=[...new Set(o.bad)].slice(0,5);out.push(o)});
  return out});
 R.forEach(o=>{ok(o.bad.length===0,`المستوى ${o.id}: كل المسائل صحيحة ومطابقة للمهارة (٤٠٠ جولة)`,o.bad.join(' | '));
  ok(o.tierDown===0,`المستوى ${o.id}: التدرّج من الأسهل للأصعب داخل الجولة`);
  console.log(`  L${o.id}: أزواج مختلفة=${o.pairs} أصفار=${o.zero} a∈[${o.minA},${o.maxA}]`)});
 // تنوّع داخل الحدود
 const div={5:25,6:25,7:80,8:80,9:150,10:150};R.forEach(o=>{if(div[o.id])ok(o.pairs>=div[o.id],`المستوى ${o.id}: تنوّع كافٍ (${o.pairs} زوجًا مختلفًا)`)});
 // التقدم القديم محفوظ: مفاتيح ٣–١٠ القديمة تبقى بعد load/save، ومفتاحا ١ و٢ يبقيان لمستويي الصور
 const keep=await p.evaluate(()=>{localStorage.setItem('taha_subtraction_progress_v2',JSON.stringify({v:2,levels:{1:{best:9,paid:9,rewarded:true},2:{best:8,paid:8,rewarded:true},5:{best:7,paid:7,rewarded:false},10:{best:10,paid:10,rewarded:true}}}));
  const pr=loadSubtractionProgress();saveSubtractionProgress(pr);const raw=JSON.parse(localStorage.getItem('taha_subtraction_progress_v2'));return {keys:Object.keys(raw.levels).sort().join(),b:loadSubtractionLevelBest()}});
 ok(keep.keys==='1,10,2,5','بعد الحفظ تبقى بيانات المستويات القديمة (١،٢،٥،١٠) كما هي',keep.keys);
 ok(keep.b[1]===9&&keep.b[3]===8,'أفضل نتيجة: الصور ضمن ٥ (م١) والصور ضمن ١٠ (م٣) تحتفظان بتقدمهما',JSON.stringify(keep.b));
 ok(errs.length===0,'بلا أخطاء JS',errs.join('|'));await br.close();console.log('levels:',pass,'pass',fail,'fail');process.exit(fail?1:0)})();
