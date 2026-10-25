const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const VPS={phone:{width:390,height:844,dsf:2,touch:true,mobile:true},board:{width:1366,height:768,dsf:1,touch:false},tablet:{width:820,height:1180,dsf:2,touch:true},smartboard:{width:1920,height:1080,dsf:1,touch:true},big:{width:1920,height:1080,dsf:1,touch:false},small:{width:360,height:640,dsf:2,touch:true,mobile:true}};
exports.VPS=VPS;
exports.PORT=8971;
exports.mk=async(vp,opts={})=>{const br=await chromium.launch();const v=VPS[vp];
 const ctx=await br.newContext({viewport:{width:v.width,height:v.height},deviceScaleFactor:v.dsf,hasTouch:v.touch,isMobile:!!v.mobile,serviceWorkers:opts.sw?'allow':'block',reducedMotion:opts.rm?'reduce':'no-preference'});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text().slice(0,140))});
 return {br,ctx,p,errs};};
exports.open=async(p,port=8971)=>{await p.goto(`http://127.0.0.1:${port}/index.html`);await p.waitForTimeout(1300);await p.evaluate(()=>{showScreen('words');});await p.waitForTimeout(200);await p.evaluate(()=>wbk3Open());await p.waitForTimeout(500)};
