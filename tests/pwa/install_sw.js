/* قابلية التثبيت الحقيقية (Chromium CDP) + ترقية v48→v50 مع حفظ بيانات الطلاب + بلا اتصال. */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const {execSync,spawn}=require('child_process');
const PORT=8976,OLD='/tmp/old48',NEW=process.env.NEWDIR||process.cwd();let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
(async()=>{execSync(`fuser -k ${PORT}/tcp || true`);
 let sv=spawn('python3',['-m','http.server',PORT,'--bind','127.0.0.1'],{cwd:OLD,stdio:'ignore'});await new Promise(r=>setTimeout(r,1200));
 const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1366,height:768}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(3500);await p.evaluate(()=>navigator.serviceWorker.ready.then(()=>1));await p.waitForTimeout(2500);
 let ks=await p.evaluate(()=>caches.keys());ok(ks.join()==='taha-app-v48','المنشورة الحالية v48',ks.join());
 await p.evaluate(()=>{localStorage.setItem('taha_app_stars','12');localStorage.setItem('taha_child_name','أحمد');const b=StudentStore.add('طالب ثانٍ');return b});await p.waitForTimeout(800);
 const snap=()=>p.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return o});
 const before=await snap();
 execSync(`fuser -k ${PORT}/tcp || true`);await p.waitForTimeout(600);
 sv=spawn('python3',['-m','http.server',PORT,'--bind','127.0.0.1'],{cwd:NEW,stdio:'ignore'});await p.waitForTimeout(1200);
 await p.reload();await p.waitForTimeout(4500);await p.reload();await p.waitForTimeout(4500);
 ks=await p.evaluate(()=>caches.keys());ok(ks.join()==='taha-app-v50','بعد إعادتين للتحميل: v50 فقط (لا نسخة قديمة)',ks.join());
 ok(await p.evaluate(()=>!!document.getElementById('hmInstall')&&typeof taInstallState==='function'),'ملف التثبيت الجديد يعمل بعد الترقية');
 const after=await snap();const d=Object.keys(before).filter(k=>after[k]!==before[k]);const nk=Object.keys(after).filter(k=>!(k in before));ok(d.length===0&&nk.every(k=>/__taha_badges$/.test(k)),'بيانات الطلاب والنجوم كما هي',d.join());
 const c=await p.evaluate(async()=>{const o=[];for(const k of await caches.keys()){const c=await caches.open(k);o.push(...(await c.keys()).map(x=>x.url.replace(location.origin,'')))}return o});
 ok(c.includes('/pwa-install.js')&&c.includes('/manifest.json')&&c.includes('/icons/icon-512.png'),'pwa-install.js والـmanifest والأيقونات في الكاش');
 // قابلية التثبيت وفق Chromium
 const cdp=await ctx.newCDPSession(p);await cdp.send('Page.enable');
 const ie=await cdp.send('Page.getInstallabilityErrors');ok(ie.installabilityErrors.length===0,'Chromium: لا أخطاء قابلية تثبيت',JSON.stringify(ie.installabilityErrors));
 const am=await cdp.send('Page.getAppManifest');ok(am.errors.length===0,'manifest بلا أخطاء',JSON.stringify(am.errors));
 const mj=JSON.parse(am.data);ok(mj.name==='تعلم مع أ/طه محمد'&&mj.display==='standalone'&&mj.icons.some(i=>i.sizes==='512x512'&&i.purpose==='maskable')&&mj.icons.some(i=>i.sizes==='192x192'),'الاسم والعرض المستقل والأيقونات');
 // الأيقونات: مقاسات صحيحة، Apple opaque، ومحدَّثة في الكاش (ليست النجمة القديمة)
 const ic=await p.evaluate(async()=>{const o={};for(const u of ['icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png']){const b=await (await fetch(u)).blob();const im=await createImageBitmap(b);const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,im.width,im.height).data;const px=(X,Y)=>{const i=(Y*im.width+X)*4;return [d[i],d[i+1],d[i+2],d[i+3]]};o[u]={w:im.width,h:im.height,corner:px(0,0),mid:px(Math.floor(im.width*0.12),Math.floor(im.height*0.3)),star:px(Math.floor(im.width/2),Math.floor(im.height*0.4))};}
  const k=(await caches.keys())[0];const c=await caches.open(k);const m=await c.match('icons/icon-512.png');o.cachedBytes=(await m.blob()).size;o.liveBytes=(await (await fetch('icons/icon-512.png',{cache:'reload'})).blob()).size;return o});
 ok(ic['icons/icon-192.png'].w===192&&ic['icons/icon-512.png'].w===512&&ic['icons/icon-maskable-512.png'].w===512&&ic['icons/apple-touch-icon.png'].w===180,'مقاسات الأيقونات ١٩٢/٥١٢/٥١٢ maskable/١٨٠',JSON.stringify(ic));
 ok(ic['icons/apple-touch-icon.png'].corner[3]===255&&ic['icons/icon-maskable-512.png'].corner[3]===255,'Apple وmaskable بلا شفافية (ملء كامل)');
 ok(ic['icons/icon-512.png'].mid[2]>150&&ic['icons/icon-512.png'].mid[0]<80&&ic['icons/icon-512.png'].star[3]===255,'الأيقونة ليست النجمة الصفراء القديمة');
 ok(ic.cachedBytes===ic.liveBytes&&ic.cachedBytes>20000,'الكاش يحمل الأيقونة الجديدة نفسها المنشورة',ic.cachedBytes+'/'+ic.liveBytes);
 await ctx.setOffline(true);await p.reload();await p.waitForTimeout(2500);
 ok(await p.evaluate(()=>document.querySelector('.screen.active').id==='home'&&!!document.getElementById('hmInstall')),'يعمل بلا اتصال');
 ok(errs.length===0,'بلا أخطاء JS',errs.join('|'));
 sv.kill();await br.close();execSync(`fuser -k ${PORT}/tcp || true`);console.log('install_sw:',pass,'pass',fail,'fail');process.exit(fail?1:0)})();
