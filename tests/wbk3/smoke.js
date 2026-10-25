const L=require('./lib.js');
(async()=>{
 for (const vp of ['board','phone']) {
 const {br,p,errs}=await L.mk(vp);
 await p.addInitScript(()=>{window.__aud=[];const A=window.Audio;window.Audio=function(s){window.__aud.push(s);return new A(s)};window.Audio.prototype=A.prototype;});
 await L.open(p);
 const out='/tmp/v3/shots';require('fs').mkdirSync(out,{recursive:true});
 await p.screenshot({path:`${out}/${vp}_home.png`});
 await p.click('#wb3LibBtn');await p.waitForTimeout(300);await p.screenshot({path:`${out}/${vp}_lib.png`,fullPage:true});
 await p.click('#wb3Back');await p.waitForTimeout(200);
 // discover each step
 await p.evaluate(()=>wbk3Internals.renderLibrary());await p.click('#wb3Grid [data-id=w02]');await p.waitForTimeout(300);
 for(let i=0;i<5;i++){await p.waitForTimeout(900);await p.screenshot({path:`${out}/${vp}_disc${i}.png`});if(i<4)await p.click('#wb3Acts .main');}
 // build
 await p.evaluate(()=>wbk3Internals.renderHome());await p.click('[data-stage=build]');await p.waitForTimeout(500);
 await p.screenshot({path:`${out}/${vp}_build.png`});
 // hear
 await p.evaluate(()=>{wbk3State.scope='all'});await p.evaluate(()=>wbk3Internals.renderHome());await p.click('[data-stage=hear]');await p.waitForTimeout(600);
 await p.screenshot({path:`${out}/${vp}_hear.png`});
 await p.evaluate(()=>wbk3Internals.renderHome());await p.click('[data-stage=missing]');await p.waitForTimeout(500);
 await p.screenshot({path:`${out}/${vp}_missing.png`});
 await p.evaluate(()=>wbk3Internals.renderHome());await p.click('[data-stage=read]');await p.waitForTimeout(500);
 await p.screenshot({path:`${out}/${vp}_read.png`});
 console.log(vp,'errs',errs, 'aud',await p.evaluate(()=>window.__aud.slice(0,4)));
 await br.close();}
})();
