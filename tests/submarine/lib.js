const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const PORT=process.env.PORT||8992;
exports.VPS={board:{width:1920,height:1080},desktop:{width:1366,height:768},tablet:{width:1024,height:768,hasTouch:true},tabletP:{width:768,height:1024,hasTouch:true},m390:{width:390,height:844,hasTouch:true,isMobile:true},m360:{width:360,height:740,hasTouch:true,isMobile:true},phoneL:{width:844,height:390,hasTouch:true,isMobile:true}};
let pass=0,fail=0;
exports.ok=(c,m,x)=>{if(c)pass++;else{fail++;console.log('FAIL',m,x===undefined?'':JSON.stringify(x))}};
exports.summary=(n)=>{console.log(`${n}: ${pass} pass ${fail} fail`);return fail};
exports.open=async(vp,opts={})=>{
 const V=exports.VPS[vp];const br=await chromium.launch();
 const ctx=await br.newContext({viewport:{width:V.width,height:V.height},hasTouch:!!V.hasTouch,isMobile:!!V.isMobile,serviceWorkers:opts.sw?'allow':'block'});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
 await p.addInitScript(()=>{try{if(!localStorage.getItem('taha_child_name')){localStorage.setItem('taha_child_name','طالب');localStorage.setItem('taha_child_avatar','🦁')}}catch(e){}});
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(1200);
 return {br,ctx,p,errs,V};
};
exports.enter=async(p)=>{await p.evaluate(()=>{showScreen('numbers');openSubmarineGame()});await p.waitForTimeout(500)};
// تحويل إحداثيات العالم إلى إحداثيات الصفحة
exports.w2p=(p,x,y)=>p.evaluate(([x,y])=>{const r=document.getElementById('sgCanvas').getBoundingClientRect();const G=__subGame.G;return {x:r.left+x*r.width/G.W,y:r.top+y*r.height/G.H}},[x,y]);
exports.fishXY=(p,i)=>p.evaluate(i=>{const f=__subGame.G.fish[i];return f?{x:f.x,y:f.y,id:f.id}:null},i);
exports.hatchXY=(p)=>p.evaluate(()=>{const g=__subGame;g.hatchWorld();return {x:g.G.hatch.x,y:g.G.hatch.y,r:g.G.hatch.r}});
// سحب بالفأرة من سمكة إلى نقطة (عالم)
exports.dragMouse=async(p,from,to,hold=300)=>{
 const a=await exports.w2p(p,from.x,from.y),b=await exports.w2p(p,to.x,to.y);
 await p.mouse.move(a.x,a.y);await p.mouse.down();
 for(let i=1;i<=12;i++){await p.mouse.move(a.x+(b.x-a.x)*i/12,a.y+(b.y-a.y)*i/12);await p.waitForTimeout(18)}
 await p.waitForTimeout(hold);await p.mouse.up();
};
exports.state=(p)=>p.evaluate(()=>{const G=__subGame.G;return {phase:G.phase,count:G.count,target:G.target,fish:G.fish.length,shark:!!G.shark,sharkShown:G.sharkShown,entering:__subGame.fishList().filter(f=>f.state==='entering').length,audio:__subGame.audioLog.slice(),face:G.sub.face,faceT:G.sub.faceTarget,sx:G.sub.x,sy:G.sub.y,stats:G.stats}});

// أنسب سمكة للسحب: الأبعد عن القرش وعن بقية الأسماك (تفادي التقاط سمكة أخرى بالخطأ)
exports.pickFish=(p)=>p.evaluate(()=>{const G=__subGame.G;let best=null,bv=-1;
 G.fish.forEach(f=>{if(f.state!=='swim')return;let d=1e9;__subGame.fishList().forEach(o=>{if(o===f||o.state==='collected')return;d=Math.min(d,Math.hypot(o.x-f.x,o.y-f.y)-(o.kind==='shark'?120:0))});if(d>bv){bv=d;best=f}});
 return best?{x:best.x,y:best.y,id:best.id}:null});
