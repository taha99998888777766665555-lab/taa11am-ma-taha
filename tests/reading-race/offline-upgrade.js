/* ترقية الكاش v69→v70 + تشغيل «سباق الحروف بالفتحة» دون إنترنت. OLD=مجلد النسخة السابقة NEW=مجلد الفرع */
const {chromium}=require('playwright');const {execSync,spawn}=require('child_process');
const PORT=8977,OLD=process.env.OLD||'/tmp/oldmain',NEW=process.env.NEW||process.cwd();let pass=0,fail=0;
const ok=(c,m,d='')=>{if(c){pass++;console.log('  ✓',m)}else{fail++;console.log('  ✗ FAIL',m,d)}};
const srv=dir=>spawn('python3',['-m','http.server',PORT,'--bind','127.0.0.1'],{cwd:dir,stdio:'ignore'});
const kill=()=>{try{execSync(`fuser -k ${PORT}/tcp`,{stdio:'ignore'})}catch(e){}};
(async()=>{kill();let sv=srv(OLD);await new Promise(r=>setTimeout(r,1200));
 const br=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const ctx=await br.newContext({viewport:{width:1366,height:768}});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 const U=`http://127.0.0.1:${PORT}/index.html`;
 await p.goto(U);await p.waitForTimeout(3000);await p.evaluate(()=>navigator.serviceWorker.ready.then(()=>1));await p.waitForTimeout(3000);
 let ks=await p.evaluate(()=>caches.keys());ok(ks.includes('taha-app-v69')&&!ks.includes('taha-app-v70'),'النسخة السابقة: v69 فقط',ks.join());
 await p.evaluate(()=>{localStorage.setItem('taha_app_stars','12');localStorage.setItem('taha_child_name','أحمد')});await p.waitForTimeout(300);
 const snap=()=>p.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return o});
 const before=await snap();
 kill();await p.waitForTimeout(500);require('fs').utimesSync(NEW+'/service-worker.js',new Date(),new Date());/* خادم python يقارن Last-Modified فيجب أن يكون الملف الجديد أحدث */sv=srv(NEW);await p.waitForTimeout(1200);
 await p.reload();await p.waitForTimeout(5000);await p.reload();await p.waitForTimeout(5000);
 ks=await p.evaluate(()=>caches.keys());ok(ks.includes('taha-app-v70')&&!ks.includes('taha-app-v69'),'بعد الترقية: v70 وحُذفت v69',ks.join());
 const files=await p.evaluate(async()=>{const c=await caches.open('taha-app-v70');return (await c.keys()).map(x=>x.url.replace(location.origin,''))});
 const need=['/reading-race/reading-race-host.js','/reading-race/reading-drive.js','/reading-race/reading-painters.js','/reading-race/reading-race.css','/reading-race-data/reading-banks.mjs','/reading-race-data/approved-data.mjs'];
 ok(need.every(f=>files.includes(f)),'ملفات اللعبة والبيانات في كاش v70',need.filter(f=>!files.includes(f)).join());
 const letters=files.filter(f=>/educational\/letters\/letter_\d+_/.test(f));ok(letters.length>=28,'أصوات الحروف مخزنة',letters.length);
 const after=await snap();const chg=Object.keys(before).filter(k=>after[k]!==before[k]);const added=Object.keys(after).filter(k=>!(k in before));
 console.log('   تغيّر:',JSON.stringify(chg),'أُضيف:',JSON.stringify(added));
 ok(chg.length===0&&added.every(k=>/__taha_badges$/.test(k)),'بيانات الطالب والنجوم دون تغيّر بعد الترقية (يُستثنى مفتاح الشارات الذي ينشئه التطبيق نفسه عند التحميل)');
 // نسخة الملفات المخزنة = نسخة الخادم الجديدة (لا ملف قديم غير متوافق)
 const same=await p.evaluate(async()=>{const r=await caches.match('./script.js');const n=await fetch('./script.js',{cache:'no-store'});return (await r.text())===(await n.text())});ok(same,'script.js المخزن = الجديد');
 const hasHook=await p.evaluate(async()=>(await (await caches.match('./script.js')).text()).includes('__readingRaceTeardown'));ok(hasHook,'script.js المخزن يحوي فحص التنظيف');
 // دون إنترنت
 await ctx.setOffline(true);kill();await p.waitForTimeout(500);
 await p.reload();await p.waitForTimeout(3500);
 ok(await p.evaluate(()=>typeof showScreen==='function'&&!!document.getElementById('openReadingLettersRace')),'إعادة تحميل التطبيق دون إنترنت');
 const failed=[];p.on('requestfailed',r=>failed.push(r.url()));
 await p.evaluate(()=>showScreen('games'));await p.waitForTimeout(900);await p.click('#openReadingLettersRace');await p.waitForTimeout(500);
 ok(await p.evaluate(()=>document.querySelectorAll('.rlr-letter').length)===27,'٢٧ حرفًا تظهر دون إنترنت');
 for(const L of ['letter-2','letter-1']){
  await p.click(`.rlr-letter[data-letter="${L}"]`);await p.click('.rlr-go');
  let rounds=0,fin=false,t0=Date.now();
  while(Date.now()-t0<150000){await p.waitForTimeout(300);
   const st=await p.evaluate(()=>({fin:!document.querySelector('.rlr-finish').hidden,g:!document.querySelector('.rlr-choices').hidden,fb:document.querySelector('.rlr-feedback').textContent}));
   if(/تعذر/.test(st.fb)){ok(false,'فشل التحقق من الصوت دون إنترنت',st.fb);break}
   if(st.fin){fin=true;break}
   if(st.g){const i=await p.$$eval('.rlr-choice',(bs,L)=>bs.findIndex(b=>b.dataset.id===L&&!b.disabled),L);if(i>=0){await p.click(`.rlr-choice[data-lane="${i}"]`);rounds++;await p.waitForTimeout(1200)}}}
  ok(fin&&rounds>=5,`${L}: خمس جولات كاملة دون إنترنت`,{fin,rounds});
  if(fin&&L==='letter-2'){await p.click('.rlr-back');await p.waitForTimeout(400)}
 }
 ok(failed.filter(u=>!/favicon/.test(u)).length===0,'لا طلبات فاشلة داخل اللعبة دون إنترنت',failed.join());
 // ألعاب قديمة دون إنترنت
 for(const [n,fn] of [['letterRaceMap',"openLetterRaceMap()"],['matchingModes',"showScreen('matchingModes')"],['addition',"showScreen('addition')"],['words',"showScreen('words')"],['games',"showScreen('games')"]]){
  await p.evaluate(fn);await p.waitForTimeout(600);ok(await p.evaluate(()=>document.querySelector('.screen.active').id)===n,'شاشة قديمة تعمل دون إنترنت: '+n)}
 ok(errs.length===0,'لا أخطاء صفحة',errs.join('|'));
 console.log(`PASS ${pass} FAIL ${fail}`);kill();await br.close();process.exit(fail?1:0)})()
