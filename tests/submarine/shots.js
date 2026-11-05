/* صور المعاينة. PORT=8992 VP=board|m390|tablet ... → /tmp/sgshots/<vp>_*.png */
const L=require('./lib.js');const vp=process.env.VP||'board';const fs=require('fs');fs.mkdirSync('/tmp/sgshots',{recursive:true});
(async()=>{const {br,p,errs}=await L.open(vp);
 await p.evaluate(()=>showScreen('numbers'));await p.waitForTimeout(300);
 await p.screenshot({path:`/tmp/sgshots/${vp}_0_entry.png`});
 await p.evaluate(()=>openSubmarineGame());await p.waitForTimeout(900);
 await p.screenshot({path:`/tmp/sgshots/${vp}_1_menu.png`});
 await p.evaluate(()=>{__subGame.setMode('free');__subGame.startRound({type:'num',n:7})});await p.waitForTimeout(1600);
 await p.screenshot({path:`/tmp/sgshots/${vp}_2_free.png`});
 for(let k=0;k<4;k++){const h=await L.hatchXY(p);const f=await L.fishXY(p,0);await L.dragMouse(p,f,h);await p.waitForTimeout(500)}
 await p.waitForTimeout(500);
 // أثناء السحب: نلتقط سمكة تُسحب قرب الفتحة
 {const h=await L.hatchXY(p);const f=await L.fishXY(p,0);const a=await L.w2p(p,f.x,f.y),b=await L.w2p(p,h.x+h.r*0.2,h.y-h.r*0.4);
  await p.mouse.move(a.x,a.y);await p.mouse.down();for(let i=1;i<=10;i++){await p.mouse.move(a.x+(b.x-a.x)*i/10,a.y+(b.y-a.y)*i/10);await p.waitForTimeout(30)}await p.waitForTimeout(350);
  await p.screenshot({path:`/tmp/sgshots/${vp}_3_drag.png`});await p.mouse.up();await p.waitForTimeout(700)}
 for(let k=0;k<1;k++){const h=await L.hatchXY(p);const f=await L.fishXY(p,0);await L.dragMouse(p,f,h);await p.waitForTimeout(500)}
 await p.waitForTimeout(1800);
 await p.screenshot({path:`/tmp/sgshots/${vp}_4_shark.png`});
 await p.waitForFunction(()=>{const f=__subGame.G.shark;return f&&!f.entering},null,{timeout:8000});await p.waitForTimeout(500);
 const sh=await p.evaluate(()=>{const f=__subGame.G.shark;return {x:f.x,y:f.y}});const h=await L.hatchXY(p);
 await L.dragMouse(p,sh,h,380);await p.waitForTimeout(900);
 await p.screenshot({path:`/tmp/sgshots/${vp}_5_celebrate.png`});
 await p.waitForTimeout(3200);
 await p.screenshot({path:`/tmp/sgshots/${vp}_6_win.png`});
 console.log(vp,errs);await br.close()})();
