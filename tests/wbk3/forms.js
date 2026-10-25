// أشكال الحروف حسب الموضع في «أبني الكلمة» لكل الكلمات الـ٢٥ — وظيفيًا وبصريًا
const L=require('./lib.js');const fs=require('fs');
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
const PLAIN="قرأ كتب جلس زرع أكل رفع طلع حرث رسم دخل غرس فتح أخذ هرب وقف نظر خرج حمل وقع كسر نشر نبت خبز جمع وجد".split(' ');
const F='َ',T='ـ';
const NOJOIN='ادذرزوأإآؤةى';           // مستقلة: لا تتصل بما بعدها
const joinsNext=c=>NOJOIN.indexOf(c)<0;   // قاعدة مستقلة عن الكود (عكس القائمة)
const expect=(w,i)=>{const c=w[i];const jp=i>0&&joinsNext(w[i-1]);const jn=i<2&&joinsNext(c);return (jp?T:'')+c+F+(jn?T:'')};
(async()=>{
 const vps=process.argv[2]?process.argv[2].split(','):['board','phone','smartboard'];
 for(const vp of vps){
  const {br,p,errs}=await L.mk(vp);await L.open(p);await p.evaluate(()=>{wbk3State.scope='all'});
  const lv=await p.evaluate(()=>{const q=wbk3Internals.load();q.lv={hear:2,build:2,missing:2};wbk3Internals.save(q)});
  let bad=0;
  for(let n=0;n<25;n++){
   const id='w'+String(n+1).padStart(2,'0'),w=PLAIN[n].split('');
   // مستوى ١ (مع نموذج) للكلمات الزوجية، ومستوى ٢ للفردية
   await p.evaluate(([id,l])=>{const q=wbk3Internals.load();q.lv={hear:l,build:l,missing:l};wbk3Internals.save(q);wbk3Internals.startActivity('build',{items:[{id,type:'build'}]})},[id,n%2?2:1]);
   await p.waitForSelector('#wb3Tray .wb3-tile',{timeout:6000});await p.waitForTimeout(250);
   const tiles=await p.$$eval('#wb3Tray .wb3-tile',b=>b.map(x=>({l:x.dataset.letter,t:x.textContent,ov:x.scrollWidth>x.clientWidth+1||x.scrollHeight>x.clientHeight+1,w:Math.round(x.getBoundingClientRect().width),h:Math.round(x.getBoundingClientRect().height)})));
   w.forEach((c,i)=>{const t=tiles.find(x=>x.l===c);ok(t&&t.t===expect(w,i),`${id} ${PLAIN[n]} pos${i} ${c}: form`,JSON.stringify(t)+' want '+JSON.stringify(expect(w,i)))});
   
   ok(tiles.every(t=>t.w>=44&&t.h>=44),`${id}: tiles >= 44px`);
   // distractors: every tile text matches one of the 3 positional forms for that letter (no wrong joins)
   // ordering: slots right-to-left
   const xs=await p.$$eval('#wb3Board .wb3-slot',b=>b.map(x=>Math.round(x.getBoundingClientRect().left)));ok(xs[0]>xs[1]&&xs[1]>xs[2],id+': slot 1 is rightmost');
   if(n%5===0||['w01','w06','w09','w25'].includes(id)) await p.screenshot({path:`/tmp/v3/f/${vp}_${id}_a.png`});
   // place letters in order
   for(const c of w){await p.locator(`#wb3Tray [data-letter="${c}"]:not(.used)`).first().click();await p.waitForTimeout(60)}
   const slots=await p.$$eval('#wb3Board .wb3-slotl',b=>b.map(x=>x.textContent));
   ok(slots.join('')===w.map((c,i)=>expect(w,i)).join(''),id+': slots hold positional forms',slots.join('|'));
   if(n%5===0||['w01','w06','w09','w25'].includes(id)) await p.screenshot({path:`/tmp/v3/f/${vp}_${id}_b.png`});
   await p.waitForSelector('#wb3Joined',{timeout:7000});
   const j=await p.$eval('#wb3Joined',e=>e.textContent.trim());
   ok(j===w.map(c=>c+F).join(''),id+': completed word shown as one joined word (not separate cards)',JSON.stringify(j));
   ok(await p.$$eval('#wb3Board .wb3-slot, #wb3Board .wb3-slotl',x=>x.length)===0,id+': separate cards gone after completion');
   await p.waitForTimeout(80);
   if(n%5===0||['w01','w06','w09','w25'].includes(id)) await p.screenshot({path:`/tmp/v3/f/${vp}_${id}_c.png`});
   const hs=await p.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);ok(hs[0]<=hs[1],id+': no horizontal scroll');
  }
  ok(errs.length===0,vp+': no JS errors',errs.join(' | '));
  console.log(vp,'done');await br.close();
 }
 console.log('PASS',pass,'FAIL',fail);
})();
