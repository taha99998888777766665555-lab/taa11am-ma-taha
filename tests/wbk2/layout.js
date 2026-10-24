const L=require('/tmp/v61/t/lib.js');
(async()=>{
 const bad=[];
 for(const vp of ['board','phone','tablet','big']){
  for(const rm of [false,true]){
   if(rm&&vp!=='board')continue;
   const {br,p,errs}=await L.mk(vp,{rm});await L.open(p);
   await p.evaluate(()=>{wbk2State.scope='all';window.__aud=[]});
   const chk=async(n)=>{await p.waitForTimeout(450);const m=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,over:[...document.querySelectorAll('#wbkL2 *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>document.documentElement.clientWidth+1||r.left<-1)&&getComputedStyle(e).position!=='fixed'&&!e.closest('.wb2-tablew')}).length,minBtn:Math.min(...[...document.querySelectorAll('#wbkL2 button')].filter(b=>b.offsetParent&&!b.closest('.wb2-cell')).map(b=>b.getBoundingClientRect().height))}));
    if(m.sw>m.cw||m.over||m.minBtn<44)bad.push(vp+(rm?'-rm':'')+' '+n+' '+JSON.stringify(m));
    if(!rm) await p.screenshot({path:`/tmp/v61/shots/L_${vp}_${n}.png`,fullPage:false});};
   await chk('home');
   await p.click('#wb2Go');await chk('disc1');for(let i=0;i<3;i++){await p.click('#wb2Acts .main');await p.waitForTimeout(150)} await chk('disc4');
   for(const s of ['hear','build','decode','read']){await p.evaluate(()=>wbk2Internals.renderHome());await p.click(`[data-stage=${s}]`);await chk(s);}
   await p.click('#wb2Read');await chk('read2');
   await p.evaluate(()=>wbk2Internals.renderHome());await p.click('[data-stage=review]');await chk('review');
   await p.evaluate(()=>wbk2Internals.startTest());await chk('test1');
   await p.evaluate(()=>{wbk2State.gate=true});await p.click('#wb2Teacher');await chk('teacher');
   if(errs.length)bad.push(vp+' errs '+errs);
   await br.close();
  }}
 console.log(bad.length?bad.join('\n'):'layout OK all sizes');
})();
