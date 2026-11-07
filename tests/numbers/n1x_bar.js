/* شريط التحكم السفلي للرقمين ١١ و١٢ (جوال بمقاسات مختلفة + حاسوب/سبورة): قبل الإكمال وبعده
   PORT=#### node tests/numbers/n1x_bar.js */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const PORT=process.env.PORT;let pass=0,fail=0;const iss=[];const ok=(c,m,d)=>{if(c)pass++;else{fail++;iss.push(m+' '+(d===undefined?'':JSON.stringify(d)))}};
const VPS=[[320,568],[360,640],[375,667],[390,844],[412,915],[1366,768],[1920,1080]];
(async()=>{const br=await chromium.launch();
for(const [w,h] of VPS){const phone=w<600;const ctx=await br.newContext({viewport:{width:w,height:h},isMobile:phone,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(1800);
 for(const n of [11,12]){
  for(const act of [0,1]){
   for(const state of ['before','after']){
    await p.evaluate(([n,act])=>{localStorage.removeItem('taha_aj_progress_v1');ajReloadProgressFromStorage();startAJNumber(n);ajGame.actIndex=act;renderAJActivity()},[n,act]);await p.waitForTimeout(350);
    if(state==='after'){
      if(act===0)await p.locator('.aj-ctl',{hasText:'ساعدني'}).first().click();
      else{const cs=p.locator('.aj-find .aj-cell');const t=await cs.evaluateAll((els,n)=>els.map((e,i)=>e.textContent.trim()===String(n).replace(/\d/g,x=>'٠١٢٣٤٥٦٧٨٩'[x])?i:-1).filter(i=>i>=0),n);for(const i of t)await cs.nth(i).click();}
      await p.waitForTimeout(500);}
    const m=await p.evaluate(()=>{const c=document.querySelector('#ajPlay .aj-controls');const cb=c.getBoundingClientRect();const btns=[...c.querySelectorAll('.aj-ctl')].filter(x=>x.offsetParent);const nx=btns.find(b=>b.classList.contains('aj-ctl-next'));const others=btns.filter(b=>b!==nx);const R=b=>b.getBoundingClientRect();
     return{pos:getComputedStyle(c).position,n:btns.length,solved:!!ajGame.current.solved,
      overflow:btns.filter(b=>b.scrollWidth>b.clientWidth+1).map(b=>b.textContent.trim()),
      minFont:Math.min(...others.map(b=>parseFloat(getComputedStyle(b).fontSize))),
      minW:Math.round(Math.min(...others.map(b=>R(b).width))),minH:Math.round(Math.min(...btns.map(b=>R(b).height))),
      nextFull:Math.round(R(nx).width/(cb.width-16)*100),nextAbove:R(nx).top<Math.min(...others.map(b=>R(b).top))-4,
      oneRow:new Set(others.map(b=>Math.round(R(b).top))).size===1,
      lines:others.map(b=>{const r=document.createRange();r.selectNodeContents(b);return new Set([...r.getClientRects()].map(x=>Math.round(x.top/4))).size}).join(''),
      barBottom:Math.round(cb.bottom),vh:innerHeight,sw:document.documentElement.scrollWidth}});
    const tag=`${w}x${h} #${n} نشاط${act+1} ${state}`;
    ok(m.solved===(state==='after'),tag+' حالة الإكمال',m);
    ok(m.overflow.length===0,tag+' لا تجاوز للنص',m.overflow);
    ok(m.sw<=w,tag+' لا تمرير أفقي',m.sw);
    if(phone){
      ok(m.minFont>=(w<=340?14:15),tag+' نص الأزرار الثانوية ≥١٥px (١٤px على ٣٢٠)',m.minFont);ok(m.minW>=60&&m.minH>=48,tag+' مساحات لمس ≥٦٠×٤٨',m);
      ok(m.nextFull>=95&&m.nextAbove,tag+' «التالي» صف مستقل بعرض كامل',m);ok(m.oneRow,tag+' الأزرار الثانوية في صف واحد',m);
      ok(w<=340?/^[12]+$/.test(m.lines):/^1+$/.test(m.lines),tag+' نص كل زر سطر واحد (سطران كحد أقصى على ٣٢٠ دون كسر كلمة)',m.lines);
      ok(m.pos===(h>=700?'sticky':'static'),tag+' لصق الشريط حسب ارتفاع الشاشة',m.pos);
    } else { ok(m.pos==='static'&&m.oneRow,tag+' الحاسوب/السبورة: الشريط غير لاصق وصف واحد',m); }
   }}}
 ok(errs.length===0,`${w}x${h} بلا أخطاء JS`,errs);await ctx.close();}
await br.close();console.log(`bar PASS ${pass} FAIL ${fail}`);iss.slice(0,15).forEach(x=>console.log(' -',x));process.exit(fail?1:0)})();
