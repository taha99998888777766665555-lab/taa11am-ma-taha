const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const VPS={m360:{width:360,height:640,dsf:2,touch:true,mobile:true},m390:{width:390,height:844,dsf:2,touch:true,mobile:true},tablet:{width:820,height:1180,dsf:2,touch:true},desktop:{width:1366,height:768,dsf:1,touch:false},board:{width:1920,height:1080,dsf:1,touch:true}};
exports.VPS=VPS; exports.PORT=8994;
exports.mk=async(vp,opts={})=>{const br=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const v=VPS[vp];
 const ctx=await br.newContext({viewport:{width:v.width,height:v.height},deviceScaleFactor:v.dsf,hasTouch:v.touch,isMobile:!!v.mobile,serviceWorkers:opts.sw?'allow':'block'});
 await ctx.addInitScript(()=>{window.__plays=[];const P=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__plays.push({src:(this.currentSrc||this.src||'').replace(location.origin+'/',''),rate:this.playbackRate,pp:this.preservesPitch});return P.apply(this,arguments)}});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push('console:'+m.text().slice(0,140))});
 return {br,ctx,p,errs};};
exports.open=async(p,port=8994)=>{await p.goto(`http://127.0.0.1:${port}/index.html`);await p.waitForTimeout(1300);await p.evaluate(()=>{localStorage.setItem('taha_teacher_pin','1234');showScreen('words')});await p.waitForTimeout(200);await p.click('#wbk4Entry');await p.waitForTimeout(500)};
