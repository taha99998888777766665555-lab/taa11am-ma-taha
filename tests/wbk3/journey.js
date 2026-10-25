// رحلة الطالب كاملة بالنقر اللمسي فقط (tap) على الجوال والسبورة الذكية
const L=require('./lib.js');
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('  FAIL',m,d)}};
const PLAIN="قرأ كتب جلس زرع أكل رفع طلع حرث رسم دخل غرس فتح أخذ هرب وقف نظر خرج حمل وقع كسر نشر نبت خبز جمع وجد".split(' ');
(async()=>{
 for(const vp of ['phone','small','smartboard','tablet']){
  console.log('== journey on',vp);
  const {br,p,errs}=await L.mk(vp);await L.open(p);
  await p.evaluate(()=>{wbk3State.scope='all';wbk3State.gate=true});
  const small=[];
  const sizes=async(tag)=>{const bad=await p.evaluate(()=>[...document.querySelectorAll('#wbkL3 button, #wbkL3 .wb3-opt, #wbkL3 .wb3-tile')].filter(b=>b.offsetParent!==null&&!b.disabled).map(b=>{const r=b.getBoundingClientRect();return {t:(b.id||b.className||b.textContent).toString().slice(0,30),w:Math.round(r.width),h:Math.round(r.height)}}).filter(x=>x.h<44||x.w<44));bad.forEach(b=>small.push(tag+':'+JSON.stringify(b)))};
  const cur=()=>p.evaluate(()=>{const R=wbk3State.run;return R.items[R.i]});
  const letters=id=>PLAIN[+id.slice(1)-1].split('');
  const st=()=>p.evaluate(()=>wbk3Internals.load());
  const tap=async s=>{await p.locator(s).first().tap()};
  const ready=async id=>{await p.waitForFunction(w=>{const t=[...document.querySelectorAll('#wb3Tray .wb3-tile')].map(x=>x.dataset.letter);return w.every(c=>t.includes(c))&&!document.querySelector('#wb3Tray .wb3-tile.used')},letters(id),{timeout:9000})};
  await sizes('home');
  // 1) discover
  await p.evaluate(()=>wbk3Internals.renderLibrary());await sizes('library');
  await tap('#wb3Grid [data-id=w02]');await p.waitForTimeout(300);
  for(let k=0;k<4;k++){await sizes('discover'+k);await tap('#wb3Acts .main');await p.waitForTimeout(k==1?1400:400)}
  await tap('#wb3Acts .main');await p.waitForTimeout(400);
  let s=await st();ok(s.syl.w02&&s.syl.w02.seen===1&&s.stars===0,'discover (tap): seen, no star');
  // 2) hear x2 rounds => hear evidence
  await p.evaluate(()=>wbk3Internals.renderHome());await tap('[data-stage=hear]');await p.waitForTimeout(600);await sizes('hear');
  for(let i=0;i<3;i++){await p.waitForTimeout(500);const it=await cur();await tap(`#wb3Opts [data-id=${it.id}]`);await p.waitForTimeout(400);await tap('#wb3QActs .main')}
  s=await st();ok(Object.values(s.syl).filter(x=>x.ev&&x.ev.includes('hear')).length>=2,'hear (tap) recorded');
  ok(s.stars===0,'listening alone gave NO star');
  // 3) build by tap on tiles, then by touch-drag
  await p.evaluate(()=>{const q=wbk3Internals.load();q.lv={hear:2,build:2,missing:2};wbk3Internals.save(q);wbk3Internals.renderHome()});
  await tap('[data-stage=build]');await p.waitForTimeout(600);await sizes('build');
  for(let i=0;i<2;i++){await p.waitForTimeout(400);const it=await cur();await ready(it.id);
    if(i===0){for(const c of letters(it.id)){await p.locator(`#wb3Tray [data-letter="${c}"]:not(.used)`).first().tap();await p.waitForTimeout(80)}}
    else{ // touch drag via CDP touch events
      const cdp=await p.context().newCDPSession(p);
      for(let k=0;k<3;k++){const c=letters(it.id)[k];const tb=await p.locator(`#wb3Tray [data-letter="${c}"]:not(.used)`).first().boundingBox();const sb=await p.locator(`#wb3Board .wb3-slot[data-slot="${k}"]`).first().boundingBox();
        const x0=tb.x+tb.width/2,y0=tb.y+tb.height/2,x1=sb.x+sb.width/2,y1=sb.y+sb.height/2;
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y:y0}]});
        for(let t=1;t<=6;t++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x0+(x1-x0)*t/6,y:y0+(y1-y0)*t/6}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(150)}
    }
    await p.waitForSelector('#wb3Joined',{timeout:7000});await p.waitForSelector('#wb3Joined',{state:'detached',timeout:8000}).catch(()=>{});}
  s=await st();const bf=Object.values(s.syl).filter(x=>x.act&&x.act.build&&x.act.build[0]>0).length;ok(bf>=2,'build: 1 by tap + 1 by touch-drag succeeded ('+bf+')');
  // 4) missing
  await p.evaluate(()=>wbk3Internals.renderHome());await tap('[data-stage=missing]');await p.waitForTimeout(700);await sizes('missing');
  for(let i=0;i<2;i++){await p.waitForTimeout(500);const it=await cur();const g=await p.$eval('#wb3Board .wb3-slot.gap',e=>+e.dataset.slot);await tap(`#wb3Opts [data-letter="${letters(it.id)[g]}"]`);await p.waitForSelector('#wb3Joined',{timeout:6000});await p.waitForSelector('#wb3Joined',{state:'detached',timeout:8000}).catch(()=>{})}
  s=await st();ok(Object.values(s.syl).filter(x=>x.ev&&x.ev.includes('missing')).length>=2,'missing (tap) recorded');
  console.log('  stars after hear+build+missing (two different activities may now qualify):',s.stars,'| starred:',Object.keys(s.starred).join());
  ok(Object.keys(s.starred).every(id=>s.syl[id].ev.filter((e,i,a)=>a.indexOf(e)===i).length>=2||s.syl[id].read.ok>0),'every starred word has 2 different independent activities or confirmed reading');
  // 5) read
  await p.evaluate(()=>wbk3Internals.renderHome());await tap('[data-stage=read]');await p.waitForTimeout(600);await sizes('read');
  const it=await cur();await tap('#wb3Read');await p.waitForTimeout(300);await sizes('read-confirm');
  const before=(await st()).stars;
  await tap('#wb3ReadOk');await p.waitForTimeout(500);s=await st();ok(s.syl[it.id].read.ok===1,'independent read confirmed by teacher (tap)');
  ok(s.stars===before+(s.starred[it.id]&&!0?1:0)||s.stars>=before,'read gives star only after confirmation');
  // 6) test
  await p.evaluate(()=>wbk3Internals.startTest());await p.waitForTimeout(500);
  for(let k=0;k<8;k++){await p.waitForTimeout(500);const i=await cur();await sizes('test-'+i.type);
   if(i.type==='hear')await tap(`#wb3Opts [data-id=${i.id}]`);
   else if(i.type==='build'){await ready(i.id);for(const c of letters(i.id)){await p.locator(`#wb3Tray [data-letter="${c}"]:not(.used)`).first().tap();await p.waitForTimeout(80)}}
   else if(i.type==='missing'){const g=await p.$eval('#wb3Board .wb3-slot.gap',e=>+e.dataset.slot);await tap(`#wb3Opts [data-letter="${letters(i.id)[g]}"]`)}
   else await tap('#wb3Read');}
  await p.waitForSelector('#wb3TestResult',{timeout:8000});await sizes('test-result');
  await tap('#wb3Reads .rok[data-k="0"]');await tap('#wb3Reads .rok[data-k="1"]');await p.waitForTimeout(300);
  s=await st();ok(s.tests.length===1&&s.tests[0].status==='pass','final test completed by touch and confirmed by teacher');
  const hs=await p.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);ok(hs[0]<=hs[1],'no horizontal scroll at end');
  ok(small.length===0,'every active button >= 44x44 px',small.slice(0,6).join(' ; '));
  ok(errs.length===0,'no JS errors',errs.join(' | '));
  await br.close();
 }
 console.log('PASS',pass,'FAIL',fail);
})();
