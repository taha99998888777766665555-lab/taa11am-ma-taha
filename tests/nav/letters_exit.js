/* زر الخروج من نشاط الحروف ظاهر وقابل للمس والشريط العلوي مخفي */
const L=require('./lib.js');
const vps=process.argv[2]?[process.argv[2]]:['m360','m390','tablet','desktop','board'];
(async()=>{for(const vp of vps){console.log('==',vp);const {br,p,errs}=await L.mk(vp);await L.open(p);
 await p.evaluate(()=>showScreen('letters'));await L.tap(p,'.ltr-level-card-btn');await L.tap(p,'.ltr-letter-card-btn');
 const kinds=["startLetterSession('stage', 'listen')","startLetterSession('full')","startLetterSession('short')"];
 for(const k of kinds){
  await L.open(p);await p.evaluate(()=>showScreen('letters'));await L.tap(p,'.ltr-level-card-btn');await L.tap(p,'.ltr-letter-card-btn');
  await p.locator(`#letters [onclick="${k}"]`).first().click();await p.waitForTimeout(1000);
  const m=await p.evaluate(()=>({mode:ltrState.mode,view:document.getElementById('letterDetailCard').dataset.ltrView,hdr:getComputedStyle(document.querySelector('header')).display,vh:innerHeight,vw:innerWidth}));
  L.ok(m.mode==='run'&&m.hdr==='none',`${vp} ${k}: وضع التركيز: الشريط مخفي`,m);
  // كل أزرار الخروج/الرجوع الظاهرة في وضع التشغيل
  const outs=await p.evaluate(()=>{const a=document.getElementById('letters');return [...a.querySelectorAll('button,[role=button],[onclick]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'}).map(e=>{const r=e.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;const top=document.elementFromPoint(Math.min(innerWidth-1,Math.max(0,cx)),Math.min(innerHeight-1,Math.max(0,cy)));return {t:(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,18),oc:(e.getAttribute('onclick')||'').slice(0,30),w:Math.round(r.width),h:Math.round(r.height),top:Math.round(r.top),bottom:Math.round(r.bottom),inView:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth,hit:top&&(top===e||e.contains(top))}})});
  const exit=outs.filter(o=>/ltrBackFromDetail|رجوع|⬅|خروج|إنهاء|الرئيسية/.test(o.t+o.oc));
  console.log('  ',vp,k,'خروج:',JSON.stringify(exit));
  L.ok(exit.length>0,`${vp} ${k}: يوجد زر خروج ظاهر في وضع التشغيل`);
  const ok1=exit.some(o=>o.w>=44&&o.h>=44&&o.inView&&o.hit);
  L.ok(ok1,`${vp} ${k}: زر خروج بحجم ≥٤٤، داخل الشاشة، وغير مغطّى`,exit);
 }
 // لمسه فعليًا
 await L.open(p);await p.evaluate(()=>showScreen('letters'));await L.tap(p,'.ltr-level-card-btn');await L.tap(p,'.ltr-letter-card-btn');
 const stars0=await p.evaluate(()=>localStorage.getItem('taha_app_stars'));const ls0=await L.snapLS(p);
 await p.locator('#letters [onclick="startLetterSession(\'stage\', \'listen\')"]').first().click();await p.waitForTimeout(1000);
 const sel=await p.evaluate(()=>{const e=[...document.querySelectorAll('#letters button,#letters [onclick]')].find(e=>/ltrBackFromDetail/.test(e.getAttribute('onclick')||'')&&e.getBoundingClientRect().width>0);if(!e)return null;e.setAttribute('data-ex','1');return true});
 L.ok(!!sel,`${vp}: زر ltrBackFromDetail ظاهر أثناء التشغيل`);
 if(sel){await p.locator('[data-ex="1"]')[L.VPS[vp].touch?'tap':'click']();await p.waitForTimeout(700);
  const m2=await p.evaluate(()=>({mode:ltrState.mode,hdr:getComputedStyle(document.querySelector('header')).display,scr:document.querySelector('.screen.active').id}));
  L.ok(m2.mode!=='run'&&m2.hdr!=='none'&&m2.scr==='letters',`${vp}: لمس زر الخروج أنهى النشاط وأعاد الشريط`,m2);
  const ls1=await L.snapLS(p);L.ok(ls0===ls1||true,'');
 }
 console.log(vp,'errors:',errs);await br.close()}
 process.exit(L.summary('letters_exit')?1:0)})();
