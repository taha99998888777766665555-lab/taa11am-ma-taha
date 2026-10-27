const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async()=>{
 const b=await chromium.launch(); const c=await b.newContext({viewport:{width:360,height:640},hasTouch:true});
 const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto('http://localhost:8994/index.html?wbk4=open'); await p.waitForTimeout(2500);
 console.log('active', await p.evaluate(()=>document.querySelector('.screen.active')?.id));
 console.log(await p.evaluate(()=>document.getElementById('wb4Path')?.children.length));
 for (const st of ['teach','build','hear','missing','read','test']) {
   await p.evaluate(s=>{window.wbk4Internals.renderHome();},st);
   await p.click(`[data-stage="${st}"]`); await p.waitForTimeout(700);
   console.log(st, await p.evaluate(()=>document.getElementById('wb4Inst')?.textContent), (await p.screenshot({path:`/tmp/l4_${st}.png`}))&&'');
 }
 console.log(errs);
 await b.close();
})();
