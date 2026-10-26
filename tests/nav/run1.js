const L=require('./lib.js');
(async()=>{for(const vp of ['m390','board']){const {br,p,errs}=await L.mk(vp);await L.open(p);
 await p.evaluate(()=>showScreen('letters'));await L.tap(p,'.ltr-level-card-btn');await L.tap(p,'.ltr-letter-card-btn');
 const cards=await p.evaluate(()=>[...document.querySelectorAll('#letters [onclick*="startLetterSession"]')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.getAttribute('onclick')));
 console.log(vp,cards.slice(0,4));
 await p.locator('#letters [onclick*="startLetterSession"]').first().click();await p.waitForTimeout(900);
 const m=await p.evaluate(()=>({mode:ltrState.mode,hdr:getComputedStyle(document.querySelector('header')).display,stack:taNav.stack().join('>')}));console.log('after start',m);
 for(let i=0;i<5;i++){const r=await L.back(p,500);const m2=await p.evaluate(()=>window.ltrState?ltrState.mode:'-').catch(()=>'-');console.log(' back→',r.scr,m2,r.stack&&r.stack.join('>'));if(r.scr.startsWith('('))break}
 console.log(errs);await br.close()}})();
