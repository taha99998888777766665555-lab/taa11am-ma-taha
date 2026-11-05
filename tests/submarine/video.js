/* تسجيل فيديو فعلي من تشغيل اللعبة. VP=m390|tablet  OUT=/tmp/sgvideo  (لا صوت: المتصفح بلا مخرج صوتي) */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const fs=require('fs');
const PORT=process.env.PORT||8992,vp=process.env.VP||'m390',OUT=process.env.OUT||'/tmp/sgvideo';
const VPS={m390:{width:390,height:844,hasTouch:true,isMobile:true},tablet:{width:1024,height:768,hasTouch:true}};
(async()=>{const V=VPS[vp];fs.mkdirSync(OUT,{recursive:true});
 const br=await chromium.launch();
 const ctx=await br.newContext({viewport:{width:V.width,height:V.height},hasTouch:true,isMobile:!!V.isMobile,deviceScaleFactor:vp==='m390'?2:1,recordVideo:{dir:OUT,size:{width:V.width*(vp==='m390'?1:1),height:V.height}},serviceWorkers:'block'});
 const p=await ctx.newPage();
 await p.addInitScript(()=>{try{localStorage.setItem('taha_child_name','طالب');localStorage.setItem('taha_child_avatar','🦁')}catch(e){}
  addEventListener('DOMContentLoaded',()=>{ // نقطة تُظهر مواضع الأصابع في الفيديو فقط
   const d={};const mk=id=>{const e=document.createElement('div');e.style.cssText='position:fixed;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(255,255,255,.45);border:3px solid rgba(255,60,60,.9);z-index:99999;pointer-events:none;display:none';document.body.appendChild(e);return d[id]=e};
   const mv=e=>{const t=d[e.pointerId]||mk(e.pointerId);t.style.display='block';t.style.left=e.clientX+'px';t.style.top=e.clientY+'px'};
   addEventListener('pointerdown',mv,true);addEventListener('pointermove',e=>{if(d[e.pointerId]&&d[e.pointerId].style.display==='block')mv(e)},true);
   const up=e=>{if(d[e.pointerId])d[e.pointerId].style.display='none'};addEventListener('pointerup',up,true);addEventListener('pointercancel',up,true)})});
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(1200);
 const cdp=await ctx.newCDPSession(p);
 const w2p=(x,y)=>p.evaluate(([x,y])=>{const r=document.getElementById('sgCanvas').getBoundingClientRect(),G=__subGame.G;return {x:r.left+x*r.width/G.W,y:r.top+y*r.height/G.H}},[x,y]);
 const T=async(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
 const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
 async function swipe(id,a,b,steps=26,extra=[],dt=22){for(let i=1;i<=steps;i++){const k=ease(i/steps);await T('touchMove',[{x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,id},...extra]);await p.waitForTimeout(dt)}}
 const hatch=()=>p.evaluate(()=>{__subGame.hatchWorld();const h=__subGame.G.hatch;return {x:h.x,y:h.y}});
 async function dragFish(extra=[],hold=0){
   const f=await require('./lib.js').pickFish(p);const a=await w2p(f.x,f.y),h=await hatch(),b=await w2p(h.x,h.y);
   await T('touchStart',[{x:a.x,y:a.y,id:1},...extra]);await p.waitForTimeout(160);
   await swipe(1,a,b,30,extra);await p.waitForTimeout(220);await T('touchEnd',[{x:b.x,y:b.y,id:1}]);await p.waitForTimeout(1500);}
 await p.waitForTimeout(800);
 await p.evaluate(()=>{showScreen('numbers')});await p.waitForTimeout(1200);
 await p.evaluate(()=>openSubmarineGame());await p.waitForTimeout(1500);
 // القائمة ← الوضع الحر ← الهدف ٥
 await p.click('.sgm-modebtn[data-mode="free"]');await p.waitForTimeout(700);
 await p.click('.sgm-num[data-num="5"]');await p.waitForTimeout(1800);
 // قيادة الغواصة بالعصا (إصبع واحد)
 const jb=await p.evaluate(()=>{const r=document.querySelector('.sg-joy').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,r:r.width/2}});
 await T('touchStart',[{x:jb.x,y:jb.y,id:2}]);await p.waitForTimeout(100);
 await swipe(2,jb,{x:jb.x+jb.r*0.7,y:jb.y-jb.r*0.2},14,[],25);await p.waitForTimeout(1300);
 await swipe(2,{x:jb.x+jb.r*0.7,y:jb.y-jb.r*0.2},{x:jb.x-jb.r*0.6,y:jb.y+jb.r*0.5},16,[],25);await p.waitForTimeout(1300);
 await T('touchEnd',[{x:jb.x-jb.r*0.6,y:jb.y+jb.r*0.5,id:2}]);await p.waitForTimeout(500);
 // زر الاتجاه
 const fb=await p.evaluate(()=>{const r=document.querySelector('.sg-flip').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});
 await T('touchStart',[{x:fb.x,y:fb.y,id:3}]);await p.waitForTimeout(80);await T('touchEnd',[{x:fb.x,y:fb.y,id:3}]);await p.waitForTimeout(1200);
 // سحب سمكتين بإصبع واحد
 await dragFish();await dragFish();
 // لمس متعدد: إصبع على العصا يقود الغواصة وإصبع آخر يسحب سمكة
 await T('touchStart',[{x:jb.x,y:jb.y,id:2}]);await p.waitForTimeout(80);
 await T('touchMove',[{x:jb.x+jb.r*0.6,y:jb.y,id:2}]);await p.waitForTimeout(500);
 await dragFish([{x:jb.x+jb.r*0.6,y:jb.y,id:2}]);
 await T('touchEnd',[{x:jb.x+jb.r*0.6,y:jb.y,id:2}]);await p.waitForTimeout(600);
 // سمكة تُترك بعيدًا فتعود للسباحة
 {const f=await require('./lib.js').pickFish(p);const a=await w2p(f.x,f.y);const far=await p.evaluate(()=>{const G=__subGame.G;return {x:G.W*0.5,y:G.groundY-60}});const b=await w2p(far.x,far.y);
  await T('touchStart',[{x:a.x,y:a.y,id:1}]);await p.waitForTimeout(140);await swipe(1,a,b,20);await T('touchEnd',[{x:b.x,y:b.y,id:1}]);await p.waitForTimeout(1500);}
 await dragFish();
 await p.waitForTimeout(1200); // ظهور القرش
 // القرش الأخير
 {const sk=await p.evaluate(()=>{const s=__subGame.G.shark;return s?{x:s.x,y:s.y}:null});
  if(sk){const a=await w2p(sk.x,sk.y),h=await hatch(),b=await w2p(h.x,h.y);await T('touchStart',[{x:a.x,y:a.y,id:1}]);await p.waitForTimeout(160);await swipe(1,a,b,34);await p.waitForTimeout(260);await T('touchEnd',[{x:b.x,y:b.y,id:1}]);}}
 await p.waitForTimeout(6500); // احتفال ثم نافذة الفوز
 const path=await p.video().path();await ctx.close();await br.close();
 fs.copyFileSync(path,OUT+'/'+vp+'.webm');console.log('saved',OUT+'/'+vp+'.webm');
})();
