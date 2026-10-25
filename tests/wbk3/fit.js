const L=require('./lib.js');
(async()=>{
 for (const vp of ['board','small']) {
  const {br,p,errs}=await L.mk(vp);await L.open(p);
  await p.evaluate(()=>{wbk3State.scope='all'});
  const m=async(n,sel)=>{await p.waitForTimeout(700);const r=await p.evaluate((sel)=>{const e=document.querySelector(sel);if(!e)return null;const b=e.getBoundingClientRect();return {bottom:Math.round(b.bottom),vh:innerHeight,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}},sel);console.log(vp,n,JSON.stringify(r));};
  for (const [st,sel] of [['build','#wb3Tray'],['hear','#wb3Opts'],['missing','#wb3Opts']]) {
    for (const lv of [1,2]) {
      await p.evaluate((a)=>{const q=wbk3Internals.load();q.lv.build=a;q.lv.hear=a;q.lv.missing=a;wbk3Internals.save(q);wbk3Internals.renderHome()},lv);
      await p.click(`[data-stage=${st}]`);await m(st+lv,sel);
    }
  }
  await p.evaluate(()=>wbk3Internals.renderLibrary());await m('lib','#wb3Grid');
  console.log(vp,'errs',errs);await br.close();
 }
})();
