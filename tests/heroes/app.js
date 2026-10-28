/* دمج «تحدي أبطال الجمع»: فتح من الألعاب، لمس متزامن داخل الإطار، العودة، عدم المساس بالبيانات. PORT=8991 */
const L=require('../nav/lib.js');const ok=L.ok;
const VPS=['desktop','board','tablet','m390'];
(async()=>{
 for(const vp of VPS){
  console.log('—',vp);
  const {br,ctx,p,errs}=await L.mk(vp);
  const E=()=>errs.filter(e=>!/ERR_TUNNEL|fonts\.g|ERR_NAME|Failed to load resource/.test(e));
  await L.open(p);
  await p.evaluate(()=>showScreen('games'));await p.waitForTimeout(400);
  const cards=await p.evaluate(()=>[...document.querySelectorAll('#games .game-launch-card h3')].map(h=>h.textContent.trim()));
  ok(cards.includes('تحدي أبطال الجمع'),vp+' البطاقة في قسم الألعاب',cards.join('|'));
  ok(['فرقع الحروف','فرقع الأرقام','سباق الحروف','أصدقاء الحديقة','سلال الفرز'].every(n=>cards.includes(n)),vp+' بقية الألعاب موجودة كما هي');
  const ls0=await L.snapLS(p);
  ok(await p.evaluate(()=>{const f=document.getElementById('heroesFrame');return !f.contentWindow.document.querySelector('.lane')}),vp+' الإطار فارغ قبل الفتح');
  await p.locator('.heroes-game-card').scrollIntoViewIfNeeded();await p.locator('.heroes-game-card').click();await p.waitForTimeout(1800);
  let s=await L.st(p);ok(s.scr==='additionHeroes',vp+' فتحت الشاشة',s.scr);
  const fh=await p.$('#heroesFrame');const fr=await fh.contentFrame();
  ok(!!fr&&await fr.evaluate(()=>document.querySelectorAll('.lane').length===3&&!!window.__heroes),vp+' اللعبة داخل الإطار بثلاثة مسارات');
  const bb=await fh.boundingBox();ok(bb.width>=300&&bb.height>=200,vp+' الإطار بحجم كافٍ',JSON.stringify(bb));
  const lay=await fr.evaluate(()=>({sc:document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1,min:Math.min(...[...document.querySelectorAll('.ans')].map(a=>a.getBoundingClientRect().height)),tools:!!document.getElementById('toolTouch')&&document.getElementById('toolTouch').getBoundingClientRect().bottom<=innerHeight+1}));
  ok(!lay.sc,vp+' لا تمرير داخل اللعبة');ok(lay.min>=(bb.width>=900?60:(vp==='m390'?30:40)),vp+' أزرار الإجابة كبيرة ('+Math.round(lay.min)+')');ok(lay.tools,vp+' زر اختبار اللمس ظاهر');
  const ctr=(l,right)=>fr.evaluate(([l,right])=>{const L=__heroes.lanes[l-1];const b=L.ansBtns.find(b=>right?+b.dataset.val===L.q.sum:+b.dataset.val!==L.q.sum&&!b.disabled);const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}},[l,right]);
  const cs=()=>fr.evaluate(()=>__heroes.lanes.map(L=>L.correct));
  const cdp=await ctx.newCDPSession(p);
  // لمس متزامن بثلاثة أصابع: كل إصبع على الإجابة الصحيحة في مساره
  const pts=[];for(let l=1;l<=3;l++){const c=await ctr(l,true);pts.push({x:bb.x+c.x,y:bb.y+c.y,id:l})}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts.map(q=>({x:q.x,y:q.y,id:q.id}))});await p.waitForTimeout(80);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(1500);
  ok((await cs()).join()==='1,1,1',vp+' ٣ لمسات متزامنة: تقدّم كل مسار مرة',(await cs()).join());
  // إجابة خاطئة في مسار واحد لا تحرّك السيارة، وبقية المسارات لا تتأثر
  await p.waitForTimeout(2200);
  const w=await ctr(2,false);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bb.x+w.x,y:bb.y+w.y,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(700);
  ok((await cs()).join()==='1,1,1',vp+' الخطأ لا يحرّك ولا يخصم');
  // وضع اختبار اللمس يعمل داخل الإطار
  const tap=async()=>{const c=await fr.evaluate(()=>{const r=document.getElementById('toolTouch').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bb.x+c.x,y:bb.y+c.y,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(250)};await tap();
  ok(await fr.evaluate(()=>!document.getElementById('touchPanel').hidden),vp+' وضع اختبار اللمس يفتح');
  await tap();
  // العودة بزر ⬅️
  await p.locator('.heroes-back').click();await p.waitForTimeout(700);
  s=await L.st(p);ok(s.scr==='games',vp+' زر ⬅️ يعيد لقائمة الألعاب',s.scr);
  ok(await p.evaluate(()=>!document.getElementById('heroesFrame').contentWindow.document.querySelector('.lane')),vp+' الإطار فُرِّغ بعد الخروج');
  // فتح ثانٍ ثم زر رجوع المتصفح
  await p.locator('.heroes-game-card').click();await p.waitForTimeout(1500);
  ok((await L.st(p)).scr==='additionHeroes',vp+' فتح ثانٍ');
  s=await L.back(p,700);ok(s.scr==='games',vp+' زر رجوع المتصفح يعيد للألعاب',s.scr);
  s=await L.back(p,700);ok(s.scr==='home',vp+' ثم للرئيسية',s.scr);
  // لا أثر على بيانات الطلاب
  {const a=JSON.parse(ls0),b=JSON.parse(await L.snapLS(p));const d=b.filter(x=>JSON.stringify(a.find(y=>y[0]===x[0]))!==JSON.stringify(x)).map(x=>x[0]).concat(a.filter(x=>!b.find(y=>y[0]===x[0])).map(x=>x[0]));ok(d.length===0,vp+' التخزين المحلي (الطلاب والنجوم) لم يتغير',d.join());}
  ok(true,'');//vp+' التخزين المحلي (الطلاب والنجوم) لم يتغير');
  // أقسام أخرى تفتح بلا أخطاء
  for(const sc of ['letters','numbers','addition','words','games'])await p.evaluate(x=>showScreen(x),sc);
  await p.waitForTimeout(500);
  ok(E().length===0,vp+' بلا أخطاء JS',E().join('|'));
  await br.close();
 }
 process.exit(L.summary('heroes-app')?1:0)})();
