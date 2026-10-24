const L=require('/tmp/v61/t/lib.js');
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
(async()=>{
 for(const vp of ['board','phone']){
  const {br,p,errs}=await L.mk(vp);await L.open(p);await p.evaluate(()=>{wbk2State.scope='all'});
  await p.evaluate(()=>wbk2Internals.renderHome());await p.click('[data-stage=build]');await p.waitForTimeout(500);
  const it=await p.evaluate(()=>{const R=wbk2State.run;return R.items[R.i]});const sy=await p.evaluate(id=>WBK2_DATA.SYLLABLES.find(s=>s.id===id),it.id);
  const b0=await (await p.$('.wb2-slot[data-slot="0"]')).boundingBox(),b1=await (await p.$('.wb2-slot[data-slot="1"]')).boundingBox();
  ok(b0.x>b1.x,vp+': slot 1 (first letter) is physically on the RIGHT of slot 2');
  const lab=await p.$$eval('.wb2-slot',s=>s.map(x=>x.textContent));ok(lab[0].includes('الأول')&&lab[1].includes('الثاني'),vp+': slots labelled first/second',lab.join('|'));
  ok((await p.textContent('#wb2DirNote')).includes('اليمين'),vp+': direction note');
  // أول حرف يُنقر يذهب إلى الخانة اليمنى
  await p.click(`#wb2Tray [data-letter="${sy.a.base}"]`);
  const x1=await p.$eval('.wb2-slot[data-slot="0"] .wb2-slotl',e=>e.getBoundingClientRect().x);ok(x1>b1.x+b1.width-5||x1>b1.x,vp+': first tapped letter lands in the right slot');
  ok(await p.$eval('.wb2-slot[data-slot="0"] .wb2-slotl',e=>e.textContent)===sy.a.base+'َ',vp+': slot 1 holds first letter');
  await p.click(`#wb2Tray [data-letter="${sy.b.base}"]`);await p.waitForTimeout(1800);
  ok(await p.$eval('#wb2Joined',e=>e.textContent)===sy.shown,vp+': joined result == book form '+sy.shown);
  // الاكتشاف: أزرار الخطوات
  await p.evaluate(()=>wbk2Internals.renderLibrary());await p.click('#wb2Grid [data-id=s02]');await p.waitForTimeout(300);
  const hs=await p.$$eval('.wb2-stepdot',b=>b.map(x=>{const r=x.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)]}));
  ok(hs.length===5&&hs.every(([w,h])=>w>=48&&h>=48),vp+': 5 step buttons >=48px',JSON.stringify(hs));
  await p.click('.wb2-stepdot[data-i="3"]');await p.waitForTimeout(200);ok(await p.$eval('.wb2-steps li.on',e=>e.dataset.i)==='3',vp+': step button jumps');
  const nb=await (await p.$('#wb2Acts .main')).boundingBox();ok(nb.height>=64,vp+': next button big',nb.height);
  // الرئيسية: بطاقة الخطوة المقترحة مبسّطة
  await p.evaluate(()=>wbk2Internals.renderHome());
  const vis=await p.evaluate(()=>[...document.querySelectorAll('.wb2-step.sug *')].filter(e=>e.offsetParent&&e.children.length===0).map(e=>e.textContent.trim()).filter(Boolean));
  ok(!vis.some(t=>/ابدأ بالتعرّف|لم تبدأ|اكتشفتَ|نجاح مستقل/.test(t)),vp+': suggested card has no teacher details',vis.join('|'));
  // المكتبة: حجم الخط
  await p.click('#wb2LibBtn');const fs=await p.$eval('.cellsyl',e=>parseFloat(getComputedStyle(e).fontSize));ok(fs>=(vp==='phone'?30:62),vp+': library syllables large '+fs);
  ok(errs.length===0,vp+' errs '+errs);await br.close();}
 console.log('PASS',pass,'FAIL',fail);
})();
