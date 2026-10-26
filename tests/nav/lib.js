/* أدوات اختبار التنقل — Chromium + Playwright. PORT=8991 افتراضيًا */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const VPS={m360:{width:360,height:640,dsf:2,touch:true,mobile:true},m390:{width:390,height:844,dsf:2,touch:true,mobile:true},tablet:{width:820,height:1180,dsf:2,touch:true,mobile:false},desktop:{width:1366,height:768,dsf:1,touch:false},board:{width:1920,height:1080,dsf:1,touch:true}};
exports.VPS=VPS;
exports.PORT=+(process.env.PORT||8991);
exports.URL=()=>`http://127.0.0.1:${exports.PORT}/index.html`;
let pass=0,fail=0;const fails=[];
exports.ok=(c,m,x)=>{if(c)pass++;else{fail++;fails.push(m+(x!==undefined?' ⇒ '+x:''));console.log('  ✗ FAIL',m,x!==undefined?'⇒ '+JSON.stringify(x):'')}};
exports.summary=(n)=>{console.log(`${n}: PASS ${pass} FAIL ${fail}`);return fail};
/* named=true: طالب مسجَّل (لا تظهر شاشة الملف عند أول تشغيل) */
exports.mk=async(vp,opts={})=>{const br=await chromium.launch();const v=VPS[vp];
 const ctx=await br.newContext({viewport:{width:v.width,height:v.height},deviceScaleFactor:v.dsf,hasTouch:v.touch,isMobile:!!v.mobile,serviceWorkers:'block'});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text().slice(0,160))});
 if(opts.named!==false)await p.addInitScript(()=>{try{if(!localStorage.getItem('taha_child_name')){localStorage.setItem('taha_child_name','طالب');localStorage.setItem('taha_child_avatar','🦁');}}catch(e){}});
 return {br,ctx,p,errs,vp};};
/* يفتح about:blank أولًا ليكون للخروج من التطبيق وجهة قبله */
exports.open=async(p,wait=1300)=>{await p.goto('about:blank');await p.goto(exports.URL());await p.waitForTimeout(wait)};
exports.st=(p)=>p.evaluate(()=>({scr:(document.querySelector('.screen.active')||{}).id||'(غادر التطبيق)',stack:window.taNav?taNav.stack():null,url:location.href.slice(-12)})).catch(()=>({scr:'(غادر التطبيق)',stack:null,url:'about:blank'}));
exports.back=async(p,ms=450)=>{await p.goBack().catch(()=>{});await p.waitForTimeout(ms);return exports.st(p)};
exports.tap=async(p,sel,i=0)=>{const l=p.locator(sel).nth(i);await l.scrollIntoViewIfNeeded().catch(()=>{});await l.click({timeout:3000});await p.waitForTimeout(450)};
exports.snapLS=(p)=>p.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return JSON.stringify(Object.keys(o).sort().map(k=>[k,o[k]]))});
