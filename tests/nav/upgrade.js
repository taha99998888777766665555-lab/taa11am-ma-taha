/* ترقية v42 → v43: بيانات الطلاب لا تتغير، ويُخزَّن nav.js، وتعمل بلا اتصال */
const L=require('./lib.js');const {execSync,spawn}=require('child_process');
const PORT=8976,OLD='/home/claude/wt-main',NEW='/home/claude/wt-nav';
const ok=L.ok;
(async()=>{
 execSync(`fuser -k ${PORT}/tcp || true`);
 let sv=spawn('python3',['-m','http.server',PORT,'--bind','127.0.0.1'],{cwd:OLD,stdio:'ignore'});await new Promise(r=>setTimeout(r,1200));
 const br=await require('/opt/npm-tools/node_modules/playwright').chromium.launch();
 const ctx=await br.newContext({viewport:{width:1366,height:768}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(3500);
 await p.evaluate(()=>navigator.serviceWorker.ready.then(()=>1));await p.waitForTimeout(2500);
 let ks=await p.evaluate(()=>caches.keys());ok(ks.join()==='taha-app-v42','النسخة المنشورة الحالية v42',ks.join());
 ok(await p.evaluate(()=>!window.taNav&&!document.getElementById('hmHomeBtn')),'القديمة بلا nav.js ولا زر الرئيسية');
 const seed=await p.evaluate(()=>{localStorage.setItem('taha_app_stars','12');localStorage.setItem('taha_child_name','أحمد');
  const a=StudentStore.currentId();const b=StudentStore.add('طالب ثانٍ');return {a,b}});
 await p.evaluate(b=>StudentStore.switchTo(b),seed.b);await p.waitForTimeout(1800);
 await p.evaluate(()=>{localStorage.setItem('taha_app_stars','3')});
 await p.evaluate(a=>StudentStore.switchTo(a),seed.a);await p.waitForTimeout(1800);
 const snap=()=>p.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return o});
 const before=await snap();ok(Object.keys(before).length>5,'بيانات طالبين',String(Object.keys(before).length));
 execSync(`fuser -k ${PORT}/tcp || true`);await p.waitForTimeout(600);
 sv=spawn('python3',['-m','http.server',PORT,'--bind','127.0.0.1'],{cwd:NEW,stdio:'ignore'});await p.waitForTimeout(1200);
 await p.reload();await p.waitForTimeout(4500);await p.reload();await p.waitForTimeout(4500);
 ks=await p.evaluate(()=>caches.keys());ok(ks.join()==='taha-app-v43','بعد الترقية v43 فقط',ks.join());
 ok(await p.evaluate(()=>!!window.taNav&&!!document.getElementById('hmHomeBtn')),'nav.js وزر الرئيسية موجودان');
 const after=await snap();const diff=Object.keys(before).filter(k=>after[k]!==before[k]);
 ok(diff.length===0,'لا تغيّر في أي مفتاح تخزين قديم ('+Object.keys(before).length+' مفتاحًا)',diff.join());
 const nk=Object.keys(after).filter(k=>!(k in before));ok(nk.length===0,'لا مفاتيح جديدة',nk.join());
 const c=await p.evaluate(async()=>{const o=[];for(const k of await caches.keys()){const c=await caches.open(k);o.push(...(await c.keys()).map(x=>x.url.replace(location.origin,'')))}return o});
 ok(c.includes('/nav.js'),'nav.js في الكاش');
 // بلا اتصال
 await ctx.setOffline(true);await p.reload();await p.waitForTimeout(2500);
 ok(await p.evaluate(()=>!!window.taNav&&document.querySelector('.screen.active').id==='home'),'يعمل بلا اتصال');
 await p.evaluate(()=>showScreen('letters'));await p.waitForTimeout(300);
 await p.goBack();await p.waitForTimeout(400);
 ok(await p.evaluate(()=>document.querySelector('.screen.active').id==='home'),'الرجوع بلا اتصال يعمل');
 ok(errs.length===0,'بلا أخطاء JS',errs.join('|'));
 sv.kill();await br.close();execSync(`fuser -k ${PORT}/tcp || true`);
 process.exit(L.summary('upgrade')?1:0)})();
