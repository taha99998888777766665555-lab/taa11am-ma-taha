/* اللمس المتعدد (CDP) وعصا التحكم وزر الاتجاه ولوحة المفاتيح والصوت الفعلي. PORT=8992 VP=tablet */
const L=require('./lib.js');const vp=process.env.VP||'tablet';
(async()=>{const {br,ctx,p,errs}=await L.open(vp);const cdp=await ctx.newCDPSession(p);
 const T={pts:{}};
 const send=async(type)=>{await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:Object.keys(T.pts).map(id=>({x:T.pts[id].x,y:T.pts[id].y,id:Number(id)}))})};
 const down=async(id,x,y)=>{T.pts[id]={x,y};await send('touchStart')};
 const move=async(id,x,y)=>{T.pts[id]={x,y};await send('touchMove')};
 const up=async(id)=>{const pt=T.pts[id];await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x:pt.x,y:pt.y,id:Number(id)}]});delete T.pts[id]};
 const W2P=(x,y)=>L.w2p(p,x,y);
 const rectOf=sel=>p.evaluate(s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,l:r.left,t:r.top}},sel);
 await L.enter(p);
 await p.evaluate(()=>{__subGame.setMode('free');__subGame.audioLog.length=0;__subGame.startRound({type:'num',n:6})});await p.waitForTimeout(500);
 // --- لمس المساحات: أحجام الأزرار ---
 const jb=await rectOf('#sgJoy'),fb=await rectOf('#sgFlip'),bb=await rectOf('#sgBack');
 L.ok(jb.w>=(vp==='m360'||vp==='m390'?100:vp==='phoneL'?90:110)&&jb.h>=(vp==='m360'||vp==='m390'?100:vp==='phoneL'?90:110),'عصا التحكم كبيرة',[jb.w,jb.h]);L.ok(fb.w>=(vp==='m360'||vp==='m390'?96:vp==='phoneL'?86:100),'زر الاتجاه كبير',[fb.w,fb.h]);L.ok(bb.h>=48,'زر الرجوع كبير',bb.h);
 // لا تداخل بين الأزرار وساحة اللعب
 const st=await rectOf('#sgStage');
 L.ok(jb.t>=st.t+st.h/2+0.5*0 && jb.t>=(st.t+ (await p.evaluate(()=>document.getElementById('sgStage').getBoundingClientRect().height)))-1,'العصا خارج ساحة اللعب',{jt:jb.t});
 // --- أ) عصا + سحب سمكة بإصبعين ---
 const s0=await L.state(p);
 await down(1,jb.x,jb.y);await move(1,jb.x+jb.w*0.38,jb.y);await p.waitForTimeout(500);
 let s1=await L.state(p);
 L.ok(s1.sx>s0.sx+20,'العصا يمينًا تحرّك الغواصة يمينًا',[s0.sx,s1.sx]);
 // الإصبع الثاني يسحب سمكة إلى الفتحة أثناء حركة الغواصة
 const f=await L.fishXY(p,0);const fp=await W2P(f.x,f.y);
 await down(2,fp.x,fp.y);
 for(let i=0;i<30;i++){const h=await L.hatchXY(p);const hp=await W2P(h.x,h.y);const cur=T.pts[2];await move(2,cur.x+(hp.x-cur.x)*0.35,cur.y+(hp.y-cur.y)*0.35);await p.waitForTimeout(30)}
 const dr=await p.evaluate(()=>__subGame.fishList().some(f=>f.state==='drag'));
 L.ok(dr,'السمكة تُسحب أثناء تحريك الغواصة (لمس متعدد)');
 const sMid=await L.state(p);
 for(let i=0;i<6;i++){const h=await L.hatchXY(p);const hp=await W2P(h.x,h.y);await move(2,hp.x,hp.y);await p.waitForTimeout(30)}
 await up(2);await p.waitForTimeout(700);
 let s2=await L.state(p);
 L.ok(s2.count===1,'سمكة بإصبع والغواصة تتحرك بإصبع آخر: احتُسبت',s2.count);
 L.ok(s2.sx>=sMid.sx-5,'العصا ما زالت تعمل بعد رفع إصبع السحب');
 await up(1);await p.waitForTimeout(300);
 // --- ب) حدود منطقة اللعب ---
 await down(1,jb.x,jb.y);
 for(const [dx,dy,name] of [[-1,0,'يسار'],[1,0,'يمين'],[0,-1,'أعلى'],[0,1,'أسفل']]){
  await move(1,jb.x+dx*jb.w*0.45,jb.y+dy*jb.h*0.45);await p.waitForTimeout(3800);
  const b=await p.evaluate(()=>{const G=__subGame.G,s=G.sub,L=G.subL;return {x:s.x,y:s.y,W:G.W,H:G.H,gy:G.groundY,L}});
  L.ok(b.x-b.L*0.5>=-2&&b.x+b.L*0.5<=b.W+2&&b.y-b.L*0.2>=-2&&b.y<=b.gy+2,`حد ${name}: الغواصة داخل المنطقة`,b);
 }
 await up(1);
 // --- ج) زر اتجاه الغواصة ---
 await p.waitForTimeout(500);
 const h1=await L.hatchXY(p);const sPos=(await L.state(p));
 await down(3,fb.x,fb.y);await up(3);await p.waitForTimeout(700);
 const sF=await L.state(p);const h2=await L.hatchXY(p);
 L.ok(sF.faceT===-sPos.faceT&&Math.abs(sF.face-sF.faceT)<0.05,'زر الاتجاه يقلب الغواصة',[sPos.faceT,sF.faceT,sF.face]);
 L.ok((h2.x-sF.sx)*(h1.x-sPos.sx)<0,'الفتحة تنتقل إلى الجهة الأخرى مع الاتجاه',[h1.x-sPos.sx,h2.x-sF.sx]);
 // الغواصة لا تتحرك تلقائيًا بتغيير الاتجاه
 L.ok(Math.abs(sF.sx-sPos.sx)<8,'تغيير الاتجاه لا يحرّك الغواصة');
 // --- د) سقوط سمكتين معًا بإصبعين ---
 await p.evaluate(()=>{__subGame.audioLog.length=0;__subGame.startRound({type:'num',n:6})});await p.waitForTimeout(400);
 const A=await L.fishXY(p,0),B=await L.fishXY(p,1);const Ap=await W2P(A.x,A.y),Bp=await W2P(B.x,B.y);
 await down(4,Ap.x,Ap.y);await down(5,Bp.x,Bp.y);
 for(let i=0;i<24;i++){const h=await L.hatchXY(p);const hp=await W2P(h.x,h.y);for(const id of [4,5]){const c=T.pts[id];await move(id,c.x+(hp.x+(id===4?-10:10)-c.x)*0.4,c.y+(hp.y-c.y)*0.4)}await p.waitForTimeout(25)}
 await p.waitForTimeout(250);await up(4);await up(5);await p.waitForTimeout(1200);
 const sD=await L.state(p);
 L.ok(sD.count===2,'سمكتان معًا بإصبعين: العداد ٢ (بلا تكرار ولا فقد)',sD.count);
 const nums=sD.audio.filter(a=>/^say:\d+$/.test(a)).slice(1);
 L.ok(JSON.stringify(nums)===JSON.stringify(['say:1','say:2']),'العددان ١ و٢ كلاهما في الصف بالترتيب',nums);
 // --- هـ) إفلات بعيد: لا تُحتسب وتعود للسباحة ---
 const C=await L.fishXY(p,0);const Cp=await W2P(C.x,C.y);
 const far=await p.evaluate(()=>{const G=__subGame.G;return {x:G.W*0.1,y:G.groundY*0.3}});const farP=await W2P(far.x,far.y);
 const before=(await L.state(p)).count;
 await down(6,Cp.x,Cp.y);for(let i=1;i<=10;i++){await move(6,Cp.x+(farP.x-Cp.x)*i/10,Cp.y+(farP.y-Cp.y)*i/10);await p.waitForTimeout(25)}await p.waitForTimeout(300);await up(6);await p.waitForTimeout(900);
 const after=await p.evaluate(()=>({c:__subGame.G.count,sw:__subGame.G.fish.filter(f=>f.state==='swim'||f.state==='return').length,n:__subGame.G.fish.length}));
 L.ok(after.c===before&&after.sw===after.n,'إفلات بعيد: لا احتساب والسمكة تعود للسباحة',after);
 // --- و) مؤشر ملغى (touchcancel) لا يبقى عالقًا ---
 const D=await L.fishXY(p,1);const Dp=await W2P(D.x,D.y);
 await down(7,Dp.x,Dp.y);await p.waitForTimeout(150);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});delete T.pts[7];await p.waitForTimeout(500);
 const stuck=await p.evaluate(()=>__subGame.fishList().filter(f=>f.state==='drag').length);
 L.ok(stuck===0,'إلغاء اللمس لا يترك سمكة عالقة',stuck);
 // --- ز) الصوت الفعلي: الملفات تُشغَّل بالترتيب بلا تداخل ---
 const files=await p.evaluate(()=>EduAudio.log.map(l=>l.files.join(',')).slice(-6));
 L.ok(files.some(x=>/number_01/.test(x))&&files.some(x=>/number_02/.test(x)),'EduAudio شغّل number_01 ثم number_02',files);
 const iA=files.findIndex(x=>/number_01/.test(x)),iB=files.findIndex(x=>/number_02/.test(x));
 L.ok(iA>=0&&iB>iA,'الترتيب الفعلي للتشغيل صحيح',files);
 // --- ح) لوحة المفاتيح ---
 await p.evaluate(()=>{__subGame.setMode('free');__subGame.startRound({type:'num',n:3})});await p.waitForTimeout(400);
 const k0=await L.state(p);await p.keyboard.down('ArrowRight');await p.waitForTimeout(700);await p.keyboard.up('ArrowRight');
 const k1=await L.state(p);L.ok(k1.sx>k0.sx+30,'السهم الأيمن يحرّك الغواصة',[k0.sx,k1.sx]);
 await p.keyboard.press('KeyF');await p.waitForTimeout(600);const k2=await L.state(p);L.ok(k2.faceT===-k1.faceT,'مفتاح F يقلب الاتجاه');
 // --- ط) النمط السهل: الغواصة ثابتة والعصا مخفية ---
 await p.evaluate(()=>{__subGame.setMode('easy');__subGame.startRound({type:'num',n:3})});await p.waitForTimeout(500);
 const e0=await L.state(p);await p.keyboard.down('ArrowLeft');await p.waitForTimeout(600);await p.keyboard.up('ArrowLeft');const e1=await L.state(p);
 L.ok(Math.abs(e1.sx-e0.sx)<2&&Math.abs(e1.sy-e0.sy)<2,'النمط السهل: الغواصة ثابتة',[e0.sx,e1.sx]);
 const vis=await p.evaluate(()=>[getComputedStyle(document.getElementById('sgJoyWrap')).visibility,getComputedStyle(document.getElementById('sgFlip')).visibility]);
 L.ok(vis[0]==='hidden'&&vis[1]==='hidden','النمط السهل: العصا والزر مخفيّان',vis);
 L.ok(errs.length===0,'لا أخطاء JS',errs.slice(0,3));
 console.log(`touch[${vp}]`);await br.close();process.exit(L.summary('touch')?1:0)})();
