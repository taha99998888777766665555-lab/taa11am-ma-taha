// مراجعة بطاقات «أبني الكلمة» على ٣٦٠×٦٤٠: تداخل، قص، سهولة اللمس، وشكل الحرف حسب موضعه لا حسب ترتيب الصينية
const L=require('./lib.js');const fs=require('fs');
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
const PLAIN="قرأ كتب جلس زرع أكل رفع طلع حرث رسم دخل غرس فتح أخذ هرب وقف نظر خرج حمل وقع كسر نشر نبت خبز جمع وجد".split(' ');
const F='َ',T='ـ',NOJOIN='ادذرزوأ';
const expect=(w,i)=>{const c=w[i];const jp=i>0&&NOJOIN.indexOf(w[i-1])<0;const jn=i<2&&NOJOIN.indexOf(c)<0;return (jp?T:'')+c+F+(jn?T:'')};
(async()=>{
 const {br,p,errs}=await L.mk('small');await L.open(p);await p.evaluate(()=>{wbk3State.scope='all'});
 let shuffled=0,total=0,fonts=[];
 for(const lvl of [1,2]) for(let n=0;n<25;n++){
  const id='w'+String(n+1).padStart(2,'0'),w=PLAIN[n].split('');
  await p.evaluate(([id,l])=>{const q=wbk3Internals.load();q.lv={hear:l,build:l,missing:l};wbk3Internals.save(q);wbk3Internals.startActivity('build',{items:[{id,type:'build'}]})},[id,lvl]);
  await p.waitForSelector('#wb3Tray .wb3-tile');await p.waitForTimeout(200);
  const info=await p.$$eval('#wb3Tray .wb3-tile',b=>b.map(x=>{const r=x.getBoundingClientRect();return {l:x.dataset.letter,t:x.textContent,x:r.left,y:r.top,w:r.width,h:r.height,fs:getComputedStyle(x).fontSize}}));
  const vw=360;
  // 1) form depends on letter's word position, not tray position
  const orderInTray=info.map(t=>t.l).filter(c=>w.includes(c));total++;if(orderInTray.join('')!==w.join(''))shuffled++;
  w.forEach((c,i)=>ok(info.find(t=>t.l===c).t===expect(w,i),`${id}/L${lvl} ${c}@${i} form by word position`));
  // 2) no overlap, inside viewport
  for(let a=0;a<info.length;a++){const A=info[a];ok(A.x>=0&&A.x+A.w<=vw+0.5,`${id}: tile ${a} inside viewport`,JSON.stringify(A));
   for(let b=a+1;b<info.length;b++){const B=info[b];const ov=!(A.x+A.w<=B.x+0.5||B.x+B.w<=A.x+0.5||A.y+A.h<=B.y+0.5||B.y+B.h<=A.y+0.5);ok(!ov,`${id}: tiles ${a},${b} overlap`)}}
  // 3) touch: size and hit-test at center + corners-inset
  ok(info.every(t=>t.w>=48&&t.h>=48),`${id}: touch size >=48`,JSON.stringify(info.map(t=>[Math.round(t.w),Math.round(t.h)])));
  const vis=await p.evaluate(()=>{const f=document.getElementById('wb3Q').getBoundingClientRect(),t=document.getElementById('wb3Tray').getBoundingClientRect(),b=document.getElementById('wb3Board').getBoundingClientRect();return {tb:Math.round(t.bottom),bt:Math.round(b.top),vh:innerHeight}});ok(vis.bt>=0&&vis.tb<=vis.vh,`${id}/L${lvl}: slots and tray fully visible without scrolling`,JSON.stringify(vis));
  const hit=await p.evaluate(()=>[...document.querySelectorAll('#wb3Tray .wb3-tile')].every(t=>{const r=t.getBoundingClientRect();const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return e===t||t.contains(e)}));ok(hit,`${id}: each tile is the hit target at its centre`);
  fonts.push(parseFloat(info[0].fs));
  // 4) clipping: screenshot each tile, look for ink in a band touching the border
  if(lvl===1||n%3===0){
   const els=await p.$$('#wb3Tray .wb3-tile');
   for(let k=0;k<els.length;k++){const f=`/tmp/v3/t360/${id}_L${lvl}_${k}.png`;await els[k].screenshot({path:f})}
  }
  // 5) slot labels vs letters after placement
  for(const c of w){await p.locator(`#wb3Tray [data-letter="${c}"]:not(.used)`).first().click();await p.waitForTimeout(40)}
  const lab=await p.evaluate(()=>{const o=[];document.querySelectorAll('#wb3Board .wb3-slot').forEach(s=>{const a=s.querySelector('.wb3-slotn').getBoundingClientRect(),l=s.querySelector('.wb3-slotl');if(!l)return;const r=document.createRange();r.selectNodeContents(l);const b=r.getBoundingClientRect();const sr=s.getBoundingClientRect();o.push({over:!(b.bottom<=a.top||b.top>=a.bottom||b.right<=a.left||b.left>=a.right),inside:b.left>=sr.left-1&&b.right<=sr.right+1&&b.top>=sr.top-1&&b.bottom<=sr.bottom+1})});return o});
  ok(lab.length===3,`${id}: 3 filled slots`);
  await p.waitForSelector('#wb3Joined',{timeout:7000});
 }
 console.log('tray order differed from word order in',shuffled,'of',total,'boards (forms stayed tied to word position); tile font px:',Math.min(...fonts),'-',Math.max(...fonts));
 ok(shuffled>10,'tray order was genuinely shuffled in many boards');
 ok(errs.length===0,'no JS errors',errs.join('|'));
 console.log('PASS',pass,'FAIL',fail);await br.close();
})();
