/* خلايا «كوّن العدد» للرقمين ١١ و١٢ على الجوال: PORT=#### node tests/numbers/n11_cells.js */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const PORT=process.env.PORT;let pass=0,fail=0;const iss=[];const ok=(c,m,d)=>{if(c)pass++;else{fail++;iss.push(m+' '+(d===undefined?'':JSON.stringify(d)))}};
(async()=>{const br=await chromium.launch();
for(const [n,idx] of [[11,5],[12,4]]){for(const w of [320,360,390,412,768,1366]){
 const ctx=await br.newContext({viewport:{width:w,height:w<700?800:900},hasTouch:true,isMobile:w<700,deviceScaleFactor:1});const p=await ctx.newPage();
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(2000);
 await p.evaluate(n=>{localStorage.removeItem('taha_aj_progress_v1');ajReloadProgressFromStorage();startAJNumber(n)},n);await p.waitForTimeout(300);
 await p.evaluate(i=>{ajGame.actIndex=i;renderAJActivity()},idx);await p.waitForTimeout(500);
 const typ=await p.evaluate(()=>ajGame.current.type);ok(typ==='frameBuilder',`${n}@${w} نوع النشاط`,typ);
 const m=await p.evaluate(()=>{const cs=[...document.querySelectorAll('.aj-guided-row:not([hidden]) .aj-frame-live .aj-frame-cell-btn')].map(c=>c.getBoundingClientRect());const fr=[...document.querySelectorAll('.aj-guided-row:not([hidden]) .aj-frame-live')].map(c=>c.getBoundingClientRect());return{minW:Math.min(...cs.map(r=>r.width)),minH:Math.min(...cs.map(r=>r.height)),right:Math.max(...fr.map(r=>r.right)),left:Math.min(...fr.map(r=>r.left)),vw:innerWidth,sw:document.documentElement.scrollWidth,n:cs.length}});
 ok(m.n>=10,`${n}@${w} الخلايا موجودة`,m);ok(m.minW>=44&&m.minH>=44,`${n}@${w} الخلية قابلة للمس`,m);ok(m.left>=0&&m.right<=m.vw&&m.sw<=m.vw,`${n}@${w} بلا تجاوز أفقي`,m);
 await ctx.close();}}
await br.close();console.log(`PASS ${pass} FAIL ${fail}`);iss.forEach(x=>console.log(' -',x));process.exit(fail?1:0)})();
