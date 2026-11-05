/* تحسينات الجولة الثانية: القرش داخل الشاشة، تسامح الإمساك والإسقاط، تتبّع الإصبع، ثبات العداد. PORT=8992 VP=m390 */
const L=require('./lib.js');const vp=process.env.VP||'m390';
(async()=>{const {br,p,errs,V}=await L.open(vp);await L.enter(p);
 await p.evaluate(()=>__subGame.startRound({type:'lvl',id:3},8));await p.waitForTimeout(600);
 const mouse=V.hasTouch?null:p.mouse;
 // ثبات العداد: مواضع التسمية والأرقام لا تتحرك بين ٠ و٣
 const box=()=>p.evaluate(()=>{const q=s=>{const r=document.querySelector(s).getBoundingClientRect();return [Math.round(r.left),Math.round(r.right),Math.round(r.top),Math.round(r.bottom)]};return {lbl:q('.sg-c-lbl'),n:q('.sg-c-n'),t:q('.sg-c-t'),txt:document.getElementById('sgCounter').innerText.replace(/\s+/g,' '),vw:innerWidth,stage:q('#sgStage'),ctr:q('#sgCounter')}});
 const b0=await box();
 L.ok(/جمعت/.test(b0.txt)&&/٠/.test(b0.txt)&&/٨/.test(b0.txt),'نص العداد «جمعت ٠ من ٨»',b0.txt);
 L.ok(b0.ctr[2]>=b0.stage[3]-1,'العداد لا يغطي ساحة اللعب',[b0.ctr,b0.stage]);
 L.ok(b0.ctr[0]>=0&&b0.ctr[1]<=b0.vw,'العداد داخل الشاشة',b0.ctr);
 // قياس حجم النافذة والأسماك المجمعة
 const win=await p.evaluate(()=>{const G=__subGame.G;return {winW:Math.round(2*0.31*G.subL),slotLen:Math.round(0.58/4*0.92*G.subL),subL:Math.round(G.subL)}});
 console.log('نافذة الغواصة بالبكسل:',JSON.stringify(win));
 L.ok(win.winW>=(vp.startsWith('m')?120:170),'النافذة كبيرة',win);
 // تسامح الإمساك: ٥٠ بكسل عن مركز السمكة
 let fp=await L.pickFish(p);
 const f0=await p.evaluate(id=>{const f=__subGame.G.fish.find(q=>q.id===id);return {x:f.x,y:f.y}},fp.id);
 const g1=await L.w2p(p,fp.x+50,fp.y);
 await p.evaluate(()=>{});
 if(V.hasTouch){const cdp=await p.context().newCDPSession(p);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:g1.x,y:g1.y,id:1}]});await p.waitForTimeout(150);
  var grabbed=await p.evaluate(id=>__subGame.G.fish.find(q=>q.id===id).state==='drag',fp.id);
  // تتبع: حرّك الإصبع بسرعة ثم اقِس التأخر
  const tgt=await L.w2p(p,fp.x+50,fp.y-60);
  for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:g1.x+(tgt.x-g1.x)*i/10,y:g1.y+(tgt.y-g1.y)*i/10,id:1}]});await p.waitForTimeout(16)}
  await p.waitForTimeout(250);
  var lag=await p.evaluate(([id,ty])=>{const f=__subGame.G.fish.find(q=>q.id===id);return {st:f.state,dy:Math.abs(f.y-(ty))}},[fp.id,fp.y-60]);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:tgt.x,y:tgt.y,id:1}]});
 }else{
  await p.mouse.move(g1.x,g1.y);await p.mouse.down();await p.waitForTimeout(150);
  var grabbed=await p.evaluate(id=>__subGame.G.fish.find(q=>q.id===id).state==='drag',fp.id);
  const tgt=await L.w2p(p,fp.x+50,fp.y-60);
  for(let i=1;i<=10;i++){await p.mouse.move(g1.x+(tgt.x-g1.x)*i/10,g1.y+(tgt.y-g1.y)*i/10);await p.waitForTimeout(16)}
  await p.waitForTimeout(250);
  var lag=await p.evaluate(([id,ty])=>{const f=__subGame.G.fish.find(q=>q.id===id);return {st:f.state,dy:Math.abs(f.y-(ty))}},[fp.id,fp.y-60]);
  await p.mouse.up();
 }
 L.ok(grabbed,'التقاط السمكة من ٥٠ بكسل عن مركزها');
 L.ok(lag.st==='drag'&&lag.dy<8,'السمكة تتبع الإصبع بلا انفلات',lag);
 await p.waitForTimeout(500);
 // تسامح الإسقاط: ١.٦ نصف قطر عن الفتحة / فوق جسم الغواصة / بعيد
 async function dropAt(getTo,label,expectIn){
  await p.evaluate(()=>{__subGame.G.fish.forEach(f=>{if(f.state==='return')f.state='swim'})});
  await p.waitForTimeout(250);
  const c0=(await L.state(p)).count;const fp=await L.pickFish(p);
  const to=await p.evaluate(getTo);
  await L.dragMouse(p,fp,to,150);await p.waitForTimeout(1600);
  const c1=(await L.state(p)).count;
  L.ok(expectIn?c1===c0+1:c1===c0,label,{c0,c1,to});
 }
 await dropAt(()=>{const g=__subGame;g.hatchWorld();const h=g.G.hatch;return {x:h.x+1.5*h.r,y:h.y+0.3*h.r}},'إسقاط على بعد ١.٥ نصف قطر من الفتحة يُحتسب',true);
 await dropAt(()=>{const G=__subGame.G;return {x:G.sub.x-G.sub.face*G.subL*0.22,y:G.sub.y+G.subL*0.1}},'إسقاط فوق جسم الغواصة يُحتسب',true);
 await dropAt(()=>{const g=__subGame,G=g.G;g.hatchWorld();const h=G.hatch,L=G.subL;let best=null,bd=0;
   for(let x=40;x<G.W-40;x+=20)for(let y=40;y<G.groundY-10;y+=20){const d=Math.hypot(x-h.x,y-h.y);const dx=(x-G.sub.x)/(L*0.7*1.1),dy=(y-G.sub.y+L*0.07)/(L*0.48*1.1);if(dx*dx+dy*dy>1&&d>h.r*1.9+60&&d>bd){bd=d;best={x,y}}}
   return best},'إسقاط بعيدًا عن الغواصة لا يُحتسب',false);
 const b3=await box();
 L.ok(JSON.stringify(b0.lbl)===JSON.stringify(b3.lbl)&&JSON.stringify(b0.n)===JSON.stringify(b3.n)&&JSON.stringify(b0.t)===JSON.stringify(b3.t),'مواقع التسمية والأرقام ثابتة طوال الجولة',[b0,b3]);
 console.log('errors:',JSON.stringify(errs));L.ok(!errs.length,'لا أخطاء JS',errs);
 await br.close();process.exit(L.summary('improve['+vp+']')?1:0)})();
