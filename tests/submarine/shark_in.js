/* القرش الأخير يبقى كاملًا داخل الشاشة منذ ظهوره وطوال سباحته. PORT=8992 VP=m360 */
const L=require('./lib.js');const vp=process.env.VP||'m360';
(async()=>{const {br,p,errs}=await L.open(vp);await L.enter(p);
 for(const T of [4,10]){
 await p.evaluate(T=>__subGame.startRound({type:'num',n:T},T),T);await p.waitForTimeout(500);
 for(let k=0;k<T-1;k++){const f=await L.pickFish(p);const h=await L.hatchXY(p);await L.dragMouse(p,f,h,100);await p.waitForTimeout(900)}
 let out=0,n=0,seen=false,minApp=1;
 for(let i=0;i<70;i++){
  const r=await p.evaluate(()=>{const g=__subGame,G=g.G,s=G.shark;if(!s)return null;const half=210*G.F*0.5*(0.4+0.6*Math.min(1,s.appear));return {l:s.x-half,r:s.x+half,t:s.y-60*G.F,b:s.y+60*G.F,W:G.W,H:G.H,ap:s.appear,st:s.state}});
  if(r){seen=true;n++;if(r.l<-1||r.r>r.W+1||r.t<0||r.b>r.H)out++;minApp=Math.min(minApp,r.ap)}
  await p.waitForTimeout(100)}
 L.ok(seen,'ظهر القرش (هدف '+T+')');L.ok(n>30&&out===0,'القرش كاملًا داخل الشاشة في كل اللقطات (هدف '+T+')',{n,out});
 L.ok(minApp<1,'للدخول حركة ظهور تدريجية',minApp);
 }
 L.ok(!errs.length,'لا أخطاء JS',errs);await br.close();process.exit(L.summary('shark['+vp+']')?1:0)})();
