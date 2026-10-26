/* أداء: تحميل، أول رسم، حساب النمط/التخطيط، انزياح التخطيط، مهام طويلة — off مقابل calm/play، مع تبطيء المعالج ٤× للجوال.
   PORT=8992 RUNS=5 node tests/ui/perf.js */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const PORT=process.env.PORT||8992,RUNS=+(process.env.RUNS||5);
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)]};
(async()=>{const br=await chromium.launch();
for(const [vp,w,h,throttle] of [['m360',360,640,4],['desktop',1366,768,1]]){
 for(const mode of ['off','calm','play']){
  const R={load:[],fcp:[],style:[],layout:[],script:[],cls:[],long:[],heap:[],nodes:[],tap:[]};
  for(let i=0;i<RUNS;i++){
   const ctx=await br.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:w<600,isMobile:w<600,serviceWorkers:'block'});const p=await ctx.newPage();
   const cdp=await ctx.newCDPSession(p);await cdp.send('Performance.enable');if(throttle>1)await cdp.send('Emulation.setCPUThrottlingRate',{rate:throttle});
   await p.addInitScript(()=>{try{localStorage.setItem('taha_child_name','طالب');localStorage.setItem('taha_child_avatar','🦁')}catch(e){}
    window.__cls=0;window.__long=0;try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:'layout-shift',buffered:true})}catch(e){}
    try{new PerformanceObserver(l=>{window.__long+=l.getEntries().length}).observe({type:'longtask',buffered:true})}catch(e){}});
   await p.goto(`http://127.0.0.1:${PORT}/index.html?ui=${mode}&shots=1`,{waitUntil:'load'});await p.waitForTimeout(1500);
   const nav=await p.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];const f=performance.getEntriesByName('first-contentful-paint')[0];return{load:n.loadEventEnd,fcp:f?f.startTime:null}});
   const m0=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
   const t0=Date.now();
   await p.evaluate(()=>showScreen('words'));await p.waitForTimeout(300);await p.evaluate(()=>wbk3Open());await p.waitForTimeout(500);
   await p.evaluate(()=>{wbk3State.scope='all';wbk3Internals.startActivity('build',{items:[{id:'w01',type:'build'}]})});await p.waitForSelector('#wb3Tray .wb3-tile');await p.waitForTimeout(500);
   const tp=await p.evaluate(async()=>{const t=document.querySelector('#wb3Tray .wb3-tile');const a=performance.now();t.click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return performance.now()-a});
   const m1=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
   const ex=await p.evaluate(()=>({cls:window.__cls,long:window.__long}));
   R.load.push(nav.load);if(nav.fcp)R.fcp.push(nav.fcp);R.style.push((m1.RecalcStyleDuration-m0.RecalcStyleDuration)*1000);R.layout.push((m1.LayoutDuration-m0.LayoutDuration)*1000);R.script.push((m1.ScriptDuration-m0.ScriptDuration)*1000);R.cls.push(ex.cls);R.long.push(ex.long);R.heap.push(m1.JSHeapUsedSize/1048576);R.nodes.push(m1.Nodes);R.tap.push(tp);
   await ctx.close()}
  const f=x=>Math.round(med(x)*10)/10;
  console.log(`${vp} x${throttle} ${mode.padEnd(4)} | load ${f(R.load)}ms | FCP ${f(R.fcp)}ms | style ${f(R.style)}ms | layout ${f(R.layout)}ms | script ${f(R.script)}ms | tap→frame ${f(R.tap)}ms | CLS ${f(R.cls)} | longtasks ${f(R.long)} | heap ${f(R.heap)}MB | nodes ${f(R.nodes)}`);
 }}
await br.close()})();
