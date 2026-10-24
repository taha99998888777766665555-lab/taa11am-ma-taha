const L=require('/tmp/v61/t/lib.js');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL',m)}};
(async()=>{
 const {br,p,errs}=await L.mk('phone');await L.open(p);
 await p.evaluate(()=>wbk2State.scope='all');
 const cur=()=>p.evaluate(()=>{const R=wbk2State.run;return R.items[R.i]});
 await p.evaluate(()=>wbk2Internals.renderHome()); await p.tap('[data-stage=build]'); await p.waitForTimeout(400);
 let it=await cur(); let sy=await p.evaluate(id=>WBK2_DATA.SYLLABLES.find(s=>s.id===id),it.id);
 await p.tap(`#wb2Tray [data-letter="${sy.a.base}"]`); await p.tap(`#wb2Tray [data-letter="${sy.b.base}"]`); await p.waitForTimeout(1500);
 ok((await p.evaluate(()=>wbk2Internals.load().syl)) [it.id].f===1,'touch tap build');
 // touch drag via CDP touch events
 await p.evaluate(()=>wbk2Internals.renderHome()); await p.tap('[data-stage=build]'); await p.waitForTimeout(400);
 it=await cur(); sy=await p.evaluate(id=>WBK2_DATA.SYLLABLES.find(s=>s.id===id),it.id);
 const cdp=await p.context().newCDPSession(p);
 async function tdrag(letter,slot){await p.evaluate(()=>{document.querySelector('.wb2-board').scrollIntoView({block:'start',behavior:'instant'})});await p.waitForTimeout(300);const a=await (await p.$(`#wb2Tray [data-letter="${letter}"]`)).boundingBox();const b=await (await p.$(`.wb2-slot[data-slot="${slot}"]`)).boundingBox();
  console.log(letter,JSON.stringify(a),JSON.stringify(b));const sx=a.x+a.width/2,sy2=a.y+a.height/2,ex=b.x+b.width/2,ey=b.y+b.height/2;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy2}]});
  for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx+(ex-sx)*i/8,y:sy2+(ey-sy2)*i/8}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(250);}
 const f0=((await p.evaluate(()=>wbk2Internals.load().syl))[it.id]||{f:0}).f;
 await tdrag(sy.a.base,0);await tdrag(sy.b.base,1);await p.waitForTimeout(1500);
 ok((await p.evaluate(()=>wbk2Internals.load().syl))[it.id].f===f0+1,'touch drag build');
 ok(await p.evaluate(()=>window.scrollX===0),'no horizontal scroll after drag');
 console.log('errs',errs);ok(errs.length===0,'no errors');console.log('PASS',pass,'FAIL',fail);await br.close();
})();
