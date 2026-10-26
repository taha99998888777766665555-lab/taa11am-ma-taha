/* فحص المرحلة الثانية: مقاسات، لمس، تباين، تداخل، تمرير، وسلامة المنطق — لكل وضع (v2|off) وكل مقاس.
   PORT=8992 MODES=v2,off VPS=m360,... node tests/ui/check.js */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const VPS={m360:[360,640,2,1,1],m390:[390,844,2,1,1],tablet:[820,1180,2,1,0],desktop:[1366,768,1,0,0],board:[1920,1080,1,1,0]};
const PORT=process.env.PORT||8992;
const MODES=(process.env.MODES||'v2,off').split(','),only=(process.env.VPS||Object.keys(VPS).join(',')).split(',');
let pass=0,fail=0,warn=0;const ok=(c,m,d)=>{if(c)pass++;else{fail++;console.log('  ✗',m,d!==undefined?JSON.stringify(d):'')}};
const rows=[];
const CONTRAST=`(sel)=>{
 const parse=c=>{const m=c.match(/rgba?\\(([^)]+)\\)/);if(!m)return[0,0,0,0];const a=m[1].split(',').map(parseFloat);return[a[0],a[1],a[2],a.length>3?a[3]:1]};
 const over=(f,b)=>{const a=f[3];return[f[0]*a+b[0]*(1-a),f[1]*a+b[1]*(1-a),f[2]*a+b[2]*(1-a),1]};
 const lum=c=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2])};
 const out=[];
 document.querySelectorAll(sel).forEach(e=>{
  const r=e.getBoundingClientRect();if(!r.width||!r.height)return;
  const cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.display==='none')return;
  const chain=[];for(let n=e;n;n=n.parentElement){const c2=getComputedStyle(n);let c=parse(c2.backgroundColor);if(c[3]===0&&/gradient/.test(c2.backgroundImage)){const m=c2.backgroundImage.match(/rgb\\([^)]*\\)/);if(m)c=parse(m[0])}chain.push(c)}
  let bg=[255,255,255,1];for(let i=chain.length-1;i>=0;i--)bg=over(chain[i],bg);
  const fg=over(parse(cs.color),bg);
  const L1=lum(fg),L2=lum(bg);const cr=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
  out.push({t:(e.textContent||'').trim().slice(0,22),cr:Math.round(cr*100)/100,fs:parseFloat(cs.fontSize)});
 });return out}`;
(async()=>{const br=await chromium.launch();
for(const mode of MODES)for(const vp of only){const [w,h,d,t,m]=VPS[vp];const tag=`${vp}/${mode}`;console.log('==',tag);
 const ctx=await br.newContext({viewport:{width:w,height:h},deviceScaleFactor:d,hasTouch:!!t,isMobile:!!m,serviceWorkers:'block'});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));p.on('console',x=>{if(x.type()==='error')errs.push(x.text().slice(0,120))});
 await p.addInitScript(()=>{try{localStorage.setItem('taha_child_name','طالب');localStorage.setItem('taha_child_avatar','🦁')}catch(e){}});
 await p.goto(`http://127.0.0.1:${PORT}/index.html?ui=${mode}&shots=1`);await p.waitForTimeout(1300);
 const noH=async n=>{const o=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth}));ok(o.sw<=o.iw+1,`${tag} ${n}: لا تمرير أفقي`,o)};
 const size=async(sel,min,n,all=true)=>{const r=await p.$$eval(sel,els=>els.filter(e=>{const b=e.getBoundingClientRect();const cs=getComputedStyle(e);return b.width>0&&b.height>0&&cs.visibility!=='hidden'}).map(e=>{const b=e.getBoundingClientRect();return{w:Math.round(b.width),h:Math.round(b.height),t:(e.textContent||'').trim().slice(0,14)}}));ok(r.length>0,`${tag} ${n}: وُجد`,sel);ok(r.every(x=>x.h>=min&&x.w>=min),`${tag} ${n}: لمس ≥${min}`,r.filter(x=>x.h<min||x.w<min).slice(0,3));return r};
 const hit=async(sel,n)=>{const r=await p.$$eval(sel,els=>els.filter(e=>e.getBoundingClientRect().width>0).map(e=>{const b=e.getBoundingClientRect();const x=b.left+b.width/2,y=Math.min(b.top+b.height/2,innerHeight-1);const el=document.elementFromPoint(x,y);return el===e||e.contains(el)||b.bottom>innerHeight}));ok(r.every(Boolean),`${tag} ${n}: غير مغطّى`)};
 const contrast=async(sel,n,min=4.5)=>{const r=await p.evaluate(`(${CONTRAST})(${JSON.stringify(sel)})`);ok(r.length>0,`${tag} تباين ${n}: عناصر`,sel);const bad=r.filter(x=>x.cr<min);ok(bad.length===0,`${tag} تباين ${n} ≥${min}`,bad.slice(0,3));rows.push([tag,n,r.length?Math.min(...r.map(x=>x.cr)):null]);};
 /* ١) الرئيسية */
 await noH('الرئيسية');await size('#home .hm-tile',56,'بطاقات الرئيسية');await hit('#home .hm-tile','بطاقات الرئيسية');
 await contrast('#home .hm-tile__title, .hm-title, .hm-group__head, header.hm-header h1','نصوص الرئيسية');
 /* ٢) الكلمات */
 await p.evaluate(()=>showScreen('words'));await p.waitForTimeout(350);await noH('الكلمات');
 await size('#hmHomeBtn',56,'زر الرئيسية');await size('.wbk-entry',56,'بطاقات الدروس');await hit('.wbk-entry','بطاقات الدروس');await hit('#hmHomeBtn','زر الرئيسية');
 await contrast('.wbk-entry-tx strong, .wbk-entry-tx small, #wordsLevelsHub > h2, .words-hub-subtitle','نصوص الكلمات');
 const hb=await p.evaluate(()=>{const b=document.getElementById('hmHomeBtn').getBoundingClientRect();return[Math.round(b.left),Math.round(b.top)]});
 /* ٣) رئيسية الدرس ٣ */
 await p.evaluate(()=>wbk3Open());await p.waitForTimeout(500);await noH('رئيسية الدرس');
 const hb2=await p.evaluate(()=>{const b=document.getElementById('hmHomeBtn').getBoundingClientRect();return[Math.round(b.left),Math.round(b.top)]});
 ok(hb[0]===hb2[0]&&hb[1]===hb2[1],`${tag} مكان زر الرئيسية ثابت بين الكلمات والدرس`,[hb,hb2]);
 await size('#wb3Back',56,'رجوع الدرس');await size('.wb3-stepbtn',56,'خطوات الدرس');await size('#wb3LibBtn',56,'مكتبة الكلمات');
 await contrast('.wb3-head .wb3-title strong, .wb3-head .wb3-sub, .wb3-top-tx h2, .wb3-top-tx p, .wb3-stx b, .wb3-stx small','نصوص الدرس');
 /* ٤) أبني الكلمة */
 await p.evaluate(()=>{wbk3State.scope='all';const q=wbk3Internals.load();q.lv={hear:1,build:1,missing:1};wbk3Internals.save(q);wbk3Internals.startActivity('build',{items:[{id:'w01',type:'build'}]})});
 await p.waitForSelector('#wb3Tray .wb3-tile');await p.waitForTimeout(500);await noH('أبني الكلمة');
 await size('#wb3Tray .wb3-tile',56,'حروف الصينية');await size('#wb3Back',56,'رجوع النشاط');await size('#hmHomeBtn',56,'الرئيسية في النشاط');await size('#wb3Listen',56,'اسمع');await size('.wb3-slot',56,'الخانات');
 await hit('#wb3Tray .wb3-tile','حروف الصينية');await hit('#wb3Back','رجوع النشاط');
 await contrast('.wb3-inst, #wb3Model, #wb3Model *, .wb3-slotn, .wb3-qn, #wb3Listen span','نصوص النشاط');
 const hb3=await p.evaluate(()=>{const b=document.getElementById('hmHomeBtn').getBoundingClientRect();return[Math.round(b.left),Math.round(b.top)]});
 ok(Math.abs(hb[0]-hb3[0])<=1,`${tag} زر الرئيسية: نفس الجهة (x) في النشاط`,[hb,hb3]);
 const geo=await p.evaluate(()=>{const R=s=>[...document.querySelectorAll(s)].map(e=>e.getBoundingClientRect());const boxes=[['listen',R('#wb3Listen')[0]],...R('.wb3-slot').map((b,i)=>['slot'+i,b]),...R('#wb3Tray .wb3-tile').map((b,i)=>['tile'+i,b])].filter(x=>x[1]);const ov=[];for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i][1],b=boxes[j][1];if(!(a.right<=b.left+.5||b.right<=a.left+.5||a.bottom<=b.top+.5||b.bottom<=a.top+.5))ov.push([boxes[i][0],boxes[j][0]])}const tr=R('#wb3Tray')[0];return{ov,trayBottom:Math.round(tr.bottom),vh:innerHeight,inside:boxes.every(x=>x[1].left>=-0.5&&x[1].right<=innerWidth+0.5)}});
 ok(geo.ov.length===0,`${tag} لا تداخل بين عناصر النشاط`,geo.ov);ok(geo.inside,`${tag} كل عناصر النشاط داخل العرض`);
 rows.push([tag,'الصينية ظاهرة دون تمرير',geo.trayBottom<=geo.vh?'نعم':`لا (${geo.trayBottom}>${geo.vh})`]);
 /* منطق: ركّب الكلمة الصحيحة بالترتيب فتظهر شاشة الدمج (دون تغيير المنطق) */
 const WD=['ق','ر','أ'];for(const c of WD){await p.locator(`#wb3Tray [data-letter="${c}"]:not(.used)`).first().click();await p.waitForTimeout(80)}
 await p.waitForSelector('#wb3Joined',{timeout:7000}).then(()=>ok(true,'')).catch(()=>ok(false,`${tag} اكتمال البناء الصحيح يعمل`));
 ok(errs.length===0,`${tag} لا أخطاء JS`,errs);
 /* ٥) نشاط الحروف على الجوال: لا تداخل بين الحرف الكبير وصف الأزرار */
 await p.evaluate(()=>showScreen('letters'));await p.waitForTimeout(300);
 await p.locator('.ltr-level-card-btn').first().click();await p.waitForTimeout(300);await p.locator('.ltr-letter-card-btn').first().click();await p.waitForTimeout(300);
 await p.locator('#letters [onclick="startLetterSession(\'stage\', \'listen\')"]').first().click();await p.waitForTimeout(900);
 const L=await p.evaluate(()=>{const tb=[...document.querySelectorAll('.ltr-toolbar')].find(e=>e.getBoundingClientRect().width>0).getBoundingClientRect(),bl=[...document.querySelectorAll('.ltr-big-letter')].find(e=>e.getBoundingClientRect().width>0);const r=document.createRange();r.selectNodeContents(bl);const g=r.getBoundingClientRect();const b=bl.getBoundingClientRect();return{tbBottom:Math.round(tb.bottom),letterTop:Math.round(b.top),inkTop:Math.round(g.top),fs:getComputedStyle(bl).fontSize,lh:getComputedStyle(bl).lineHeight}});
 /* حبر الحرف داخل منطقة الأزرار؟ نخفي الأزرار ونفحص البكسلات الداكنة في مستطيلها */
 const tbr=await p.evaluate(()=>{const e=[...document.querySelectorAll('.ltr-toolbar')].find(e=>e.getBoundingClientRect().width>0);e.dataset.u2t='1';const st=document.createElement('style');st.id='u2hide';st.textContent='[data-u2t],[data-u2t] *{visibility:hidden!important;opacity:0!important;background:transparent!important;border-color:transparent!important;color:transparent!important;text-shadow:none!important}';document.head.appendChild(st);const b=e.getBoundingClientRect();return{x:Math.max(0,Math.floor(b.left)),y:Math.max(0,Math.floor(b.top)),w:Math.ceil(b.width),h:Math.ceil(b.height)}});
 console.log('   tbr',tag,JSON.stringify(tbr));const buf=await p.screenshot({path:'/tmp/ui/ink_'+vp+'_'+mode+'.png',clip:{x:tbr.x,y:tbr.y,width:Math.min(tbr.w,w-tbr.x),height:tbr.h}});
 const {data,info}=await require('/opt/npm-tools/node_modules/sharp')(buf).raw().toBuffer({resolveWithObject:true});
 let ink=0;for(let i=0;i<data.length;i+=info.channels){if(data[i]<110&&data[i+1]<130&&data[i+2]<190)ink++}
 L.ink=ink;await p.evaluate(()=>{document.getElementById('u2hide').remove()});
 if(mode!=='off')ok(ink===0,`${tag} حبر الحرف لا يدخل مستطيل صف الأزرار`,{ink});
 rows.push([tag,'بكسلات حبر الحرف داخل صف الأزرار',ink]);
 if(mode!=='off')ok(L.letterTop>=L.tbBottom,`${tag} الحرف الكبير لا يعلو صف الأزرار`,L);
 rows.push([tag,'حرف «أَ»: أعلى الصندوق − أسفل الأزرار',L.letterTop-L.tbBottom,L.fs]);
 await size('.ltr-toolbar-btn',56,'أزرار الحروف');
 await ctx.close()}
await br.close();
console.log('\nPASS',pass,'FAIL',fail);
console.log('--- أدنى تباين/قيم:');rows.forEach(r=>console.log(r.join(' | ')));
})();
