const L=require('./lib.js');
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
(async()=>{
for(const vp of Object.keys(L.VPS)){
 const {br,ctx,p,errs}=await L.mk(vp);await L.open(p);
 const V=L.VPS[vp];
 const chk=async(label)=>{
  const r=await p.evaluate(()=>{const W=innerWidth,H=innerHeight;const o={hs:document.documentElement.scrollWidth>W+1,bad:[]};
   document.querySelectorAll('#wbkL4 button:not([disabled]), #wbkL4 .wb4-sent, #wbkL4 .wb4-unit').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width||!r.height||getComputedStyle(e).visibility==='hidden')return;
    if(r.left<-1||r.right>W+1)o.bad.push((e.id||e.className)+' x '+Math.round(r.left)+'..'+Math.round(r.right));
    if(e.tagName==='BUTTON'&&(r.height<44||r.width<44))o.bad.push('small '+(e.id||e.className)+' '+Math.round(r.width)+'x'+Math.round(r.height));
    if(e.classList.contains('wb4-sent')&&e.scrollWidth>e.clientWidth+2)o.bad.push('clipped '+e.className)});
   const q=document.getElementById('wb4Q');if(q){const tray=document.getElementById('wb4Tray')||document.getElementById('wb4Opts');if(tray){const r=tray.getBoundingClientRect();o.trayBottom=Math.round(r.bottom);o.H=H}}return o});
  ok(!r.hs,vp+' '+label+' no horizontal scroll');ok(r.bad.length===0,vp+' '+label+' inside viewport / touch size / not clipped',r.bad.slice(0,4).join(' ; '));return r};
 await chk('home');
 for(const st of ['teach','build','hear','missing','read']){await p.evaluate(()=>wbk4Internals.renderHome());await p.click(`[data-stage="${st}"]`);await p.waitForTimeout(500);const r=await chk(st);
  if(['build','hear','missing'].includes(st)&&r.trayBottom)console.log('  ',vp,st,'options bottom',r.trayBottom,'of',r.H);}
 // drag (pointer) in build
 await p.evaluate(()=>wbk4Internals.renderHome());await p.click('[data-stage="build"]');await p.waitForTimeout(500);
 const box=async s=>{const b=await p.locator(s).first().boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2}};
 const t1=await box('#wb4Tray [data-unit="u1"]'),s1=await box('#wb4Board .wb3-slot[data-slot="0"]');
 await p.mouse.move(t1.x,t1.y);await p.mouse.down();await p.mouse.move((t1.x+s1.x)/2,(t1.y+s1.y)/2,{steps:5});await p.mouse.move(s1.x,s1.y,{steps:5});await p.mouse.up();await p.waitForTimeout(150);
 ok(await p.evaluate(()=>!!document.querySelector('#wb4Board .wb3-slot[data-slot="0"] .wb3-slotl')),vp+' drag places unit in slot 1');
 const t2=await box('#wb4Tray [data-unit="u2"]'),s2=await box('#wb4Board .wb3-slot[data-slot="1"]');
 if(V.touch){await p.locator('#wb4Tray [data-unit="u2"]').tap();}else{await p.mouse.move(t2.x,t2.y);await p.mouse.down();await p.mouse.move(s2.x,s2.y,{steps:8});await p.mouse.up();}
 await p.waitForSelector('#wb4Joined',{timeout:4000});ok(true,vp+' build completes (drag/tap)');
 // readable huge sentence in read
 await p.evaluate(()=>wbk4Internals.renderHome());await p.click('[data-stage="read"]');await p.waitForTimeout(400);
 const fs=await p.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('#wb4ReadShow .wb4-sent')).fontSize));ok(fs>=44,vp+' read font large ('+Math.round(fs)+'px)');
 ok(errs.length===0,vp+' no errors',errs.join());
 await br.close();
}
console.log('wbk4 devices:',pass,'pass',fail,'fail');process.exit(fail?1:0);})();
