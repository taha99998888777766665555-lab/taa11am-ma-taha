/* الرقم ١٣: مسح كل الأنشطة الـ١١ على ٣٢٠/٣٦٠/٣٩٠/السبورة: لا تمرير أفقي ولا قص ولا أهداف لمس <٤٤px — PORT=#### */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const PORT=process.env.PORT;let pass=0,fail=0;const iss=[];const ok=(c,m,d)=>{if(c)pass++;else{fail++;iss.push(m+' '+JSON.stringify(d))}};
(async()=>{const br=await chromium.launch();
for(const [vn,vp] of Object.entries({p320:{width:320,height:640,isMobile:true},p360:{width:360,height:740,isMobile:true},p390:{width:390,height:844,isMobile:true},board:{width:1920,height:1080}})){
 const ctx=await br.newContext({viewport:{width:vp.width,height:vp.height},hasTouch:true,isMobile:!!vp.isMobile});const p=await ctx.newPage();
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(2500);
 await p.evaluate(()=>{localStorage.removeItem('taha_aj_progress_v1');ajReloadProgressFromStorage();startAJNumber(13)});
 for(let i=0;i<11;i++){
  await p.evaluate(i=>{ajGame.actIndex=i;renderAJActivity()},i);await p.waitForTimeout(500);
  const r=await p.evaluate(()=>{const vw=innerWidth;const els=[...document.querySelectorAll('#ajStage button, #ajStage .aj-object, #ajStage .aj-maze-cell, #ajStage .aj-obj-btn, #ajStage .aj-key')].filter(e=>e.offsetParent!==null);
   const small=els.filter(e=>!e.matches('.aj-frame-paint .aj-obj-circle')).filter(e=>{const b=e.getBoundingClientRect();return b.width<43.5||b.height<43.5}).map(e=>e.className+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
   const out=[...document.querySelectorAll('#ajStage *')].filter(e=>e.offsetParent!==null&&!e.closest('canvas')).filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.left<-1||b.right>vw+1)}).map(e=>e.className).slice(0,4);
   return{sw:document.documentElement.scrollWidth,vw,small:[...new Set(small)].slice(0,5),out}});
  ok(r.sw<=r.vw+1,`${vn} #${i+1} لا تمرير أفقي`,r);ok(r.out.length===0,`${vn} #${i+1} لا قص خارج الشاشة`,r);ok(r.small.length===0,`${vn} #${i+1} أهداف ≥٤٤`,r);
 }
 await ctx.close();}
await br.close();console.log(`PASS ${pass} FAIL ${fail}`);iss.forEach(x=>console.log(' -',x));process.exit(fail?1:0)})();
