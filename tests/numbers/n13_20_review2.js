/* مراجعة ١٣–٢٠: شارات العدّ، اتجاه خط الأعداد ١١–٢٠، عنوان النشاط مقابل شارة النجوم — PORT=#### */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const PORT=process.env.PORT;let pass=0,fail=0;const iss=[];const ok=(c,m,d)=>{if(c)pass++;else{fail++;iss.push(m+' '+(d===undefined?'':JSON.stringify(d)))}};
const E=d=>String(d).replace(/\d/g,x=>'٠١٢٣٤٥٦٧٨٩'[x]);
(async()=>{const br=await chromium.launch();
for(const [vn,vp] of Object.entries({w320:{width:320,height:640},w340:{width:340,height:700},w359:{width:359,height:740},w360:{width:360,height:740},w390:{width:390,height:844},w412:{width:412,height:915},board:{width:1920,height:1080}})){
 const mob=vn!=='board';const ctx=await br.newContext({viewport:vp,hasTouch:true,isMobile:mob});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(2500);
 const tag=(n,i,t)=>`${vn} n${n} #${i} ${t}`;
 for(let N=11;N<=20;N++){
  await p.evaluate(N=>{localStorage.removeItem('taha_aj_progress_v1');ajReloadProgressFromStorage();startAJNumber(N)},N);
  const plan=await p.evaluate(()=>ajGame.plan.flat.map(x=>x.type));
  // ٣) العنوان مقابل النجوم في كل الأنشطة
  for(let i=0;i<plan.length;i++){await p.evaluate(i=>{ajGame.actIndex=i;renderAJActivity();window.scrollTo({top:0,behavior:'instant'})},i);await p.waitForTimeout(140);
   const g=await p.evaluate(()=>{const R=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return{l:r.left,r:r.right,t:r.top,b:r.bottom}};return{txt:R('#ajPlay .aj-progress-text'),st:R('#ajPlay .aj-stars'),tr:R('#ajPlay .aj-progress-track'),num:R('#ajPlay .aj-numcircle'),vw:innerWidth}});
   const hit=(a,b)=>a&&b&&a.l<b.r-0.5&&a.r>b.l+0.5&&a.t<b.b-0.5&&a.b>b.t+0.5;
   if(N===11||N===13||N===17||N===20||i===0)ok(!hit(g.txt,g.st)&&!hit(g.txt,g.num)&&g.txt.l>=0&&g.txt.r<=g.vw,tag(N,i+1,'العنوان لا يتداخل مع النجوم/الرقم'),g);
  }
  // ٢) خط الأعداد
  const li=plan.indexOf('numberLine');await p.evaluate(i=>{ajGame.actIndex=i;renderAJActivity()},li);await p.waitForTimeout(400);
  const L=await p.evaluate(()=>{const opts=[...document.querySelectorAll(ajGame.current.spec.guided?'.aj-lineg-opt':'.aj-opts-line .aj-opt')];return opts.map(b=>{const r=b.getBoundingClientRect();return{v:+b.querySelector('.aj-opt-num').textContent.trim().split('').map(c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).join(''),x:r.left+r.width/2,y:r.top}})});
  ok(L.length>=6&&L.every((o,i)=>i===0||(o.v===L[i-1].v+1&&o.x<L[i-1].x&&Math.abs(o.y-L[0].y)<3)),tag(N,'خط','الأعداد متصاعدة بخطوة ١ من اليمين إلى اليسار على صف واحد'),L.map(o=>o.v+'@'+Math.round(o.x)));
  const arrow=await p.evaluate(()=>{const l=document.querySelector('.aj-lineg-line');if(!l)return null;const a=getComputedStyle(l,'::after');return{dir:getComputedStyle(l).direction,after:a.content,l:a.left,r:a.right,tr:a.transform}});
  if(arrow)ok(arrow.dir==='rtl',tag(N,'خط','اتجاه RTL مع تصاعد نحو اليسار'),arrow);
  // ١) عُدّ واكتب
  const ci=plan.indexOf('countWrite');await p.evaluate(i=>{ajGame.actIndex=i;renderAJActivity();window.scrollTo({top:0,behavior:'instant'})},ci);await p.waitForTimeout(400);
  if(N>=13){
   ok(await p.evaluate(()=>[...document.querySelectorAll('.aj-count-badge')].every(b=>getComputedStyle(b).display==='none')),tag(N,'عد','لا شارات قبل اللمس'));
   const cnt=p.locator('.aj-countable .aj-object');await cnt.nth(0).scrollIntoViewIfNeeded();await cnt.nth(0).tap();await cnt.nth(0).tap();await p.waitForTimeout(150);
   const b=await p.evaluate(()=>{const o=document.querySelector('.aj-counted'),bd=o.querySelector('.aj-count-badge'),ob=o.getBoundingClientRect(),bb=bd.getBoundingClientRect(),cs=getComputedStyle(bd,'::after');return{n:document.querySelectorAll('.aj-counted').length,vis:getComputedStyle(bd).display,fs:getComputedStyle(bd).fontSize,after:cs.content,inside:bb.left>=ob.left-1&&bb.right<=ob.right+1&&bb.top>=ob.top-1&&bb.bottom<=ob.bottom+1,w:bb.width,ow:ob.width}});
   ok(b.n===1&&b.vis!=='none'&&b.fs==='0px'&&/✓/.test(b.after)&&b.inside&&b.w<=22,tag(N,'عد','بعد اللمس ✓ صغيرة داخل التفاحة ولمستان لا تُعدّان مرتين'),b);
   const sz=await p.evaluate(()=>[...document.querySelectorAll('.aj-countable .aj-object')].map(e=>{const r=e.getBoundingClientRect();return[r.width,r.height]}));
   ok(sz.length===N&&sz.every(([w,h])=>w>=44&&h>=44),tag(N,'عد','الأهداف ≥٤٤'),Math.min(...sz.map(s=>s[0])));
   for(let k=1;k<N;k++){await cnt.nth(k).scrollIntoViewIfNeeded();await cnt.nth(k).tap();}
   ok(await p.evaluate(()=>document.querySelectorAll('.aj-counted').length)===N,tag(N,'عد','كل التفاح معدود'));
   await p.screenshot({path:`/tmp/rv_${vn}_${N}.png`,fullPage:true}).catch(()=>{});
  }
 }
 ok(errs.length===0,vn+' بلا أخطاء JS',errs.join('|'));await ctx.close();}
await br.close();console.log(`PASS ${pass} FAIL ${fail}`);iss.forEach(x=>console.log(' -',x));process.exit(fail?1:0)})();
