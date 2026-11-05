/* تدقيق الأرقام: يمشي على مستويات الجمع والطرح (كل المهام، صحيحًا وخطأً) ويجمع كل موضع يظهر فيه رقم غربي (0-9)
   في النص المرئي أو قيم الحقول أو aria/title. التشغيل: PORT=8991 VP=board node tests/numerals/audit.js */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const PORT=process.env.PORT||8991;
const VPS={board:{width:1920,height:1080},desktop:{width:1366,height:768},m390:{width:390,height:844,hasTouch:true,isMobile:true}};
const vp=process.env.VP||'board';
const found=new Map();
const SCAN=(secId)=>{const root=document.getElementById(secId);const out=[];const vis=e=>{const r=e.getClientRects();return r.length>0&&getComputedStyle(e).visibility!=='hidden'};
 const path=e=>{let s=[];while(e&&e!==root&&s.length<4){s.unshift((e.id?'#'+e.id:e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\s+/)[0]:e.tagName.toLowerCase()));e=e.parentElement}return s.join('>')};
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(/[0-9]/.test(n.nodeValue)&&n.parentElement&&vis(n.parentElement))out.push(['text',path(n.parentElement),n.nodeValue.trim().slice(0,50)])}
 root.querySelectorAll('input,textarea').forEach(i=>{if(/[0-9]/.test(i.value)&&vis(i))out.push(['value',path(i),i.value])});
 root.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach(e=>['aria-label','title','placeholder','alt'].forEach(a=>{const v=e.getAttribute(a);if(v&&/[0-9]/.test(v)&&vis(e))out.push([a,path(e),v.slice(0,50)])}));
 return out};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:VPS[vp],hasTouch:!!VPS[vp].hasTouch,isMobile:!!VPS[vp].isMobile,serviceWorkers:'block'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript(()=>{try{if(!localStorage.getItem('taha_child_name')){localStorage.setItem('taha_child_name','طالب');localStorage.setItem('taha_child_avatar','🦁')}}catch(e){}});
 await p.goto(`http://127.0.0.1:${PORT}/index.html`);await p.waitForTimeout(1500);
 const rec=async(tag,sec)=>{const r=await p.evaluate(SCAN,sec);r.forEach(x=>{const k=sec+'|'+x[0]+'|'+x[1]+'|'+x[2];if(!found.has(k))found.set(k,tag)})};
 for(const [sec,P,max] of [['addition','Addition',10],['subtraction','Subtraction',18]]){
  await p.evaluate(s=>showScreen(s),sec);await p.waitForTimeout(500);await rec(sec+' hub',sec);
  for(let lv=1;lv<=max;lv++){
   await p.evaluate(([f,l])=>window[f](l),['open'+P+'Level',lv]);await p.waitForTimeout(400);
   const mode=await p.evaluate(([P,l])=>eval(P.toLowerCase()+'LevelState').levelId&&(eval(P.toUpperCase()+'_LEVELS')[l-1].mode),[P,lv]);
   for(let t=0;t<10;t++){
    const tag=`${sec} L${lv}(${mode}) t${t}`;await p.waitForTimeout(250);await rec(tag,sec);
    const st=await p.evaluate(P=>{const S=eval(P.toLowerCase()+'LevelState');const lvl=eval(P.toUpperCase()+'_LEVELS')[S.levelId-1];const k=S.currentTask;return {idx:S.taskIndex,mode:lvl.mode,correct:k.correct,a:k.a,b:k.b,ms:k.missingSide}},P);
    if(st.idx!==t)break;
    const target=(st.mode==='missing-number')?(st.ms==='a'?st.a:st.b):st.correct;
    const pre=sec==='addition'?'add':'sub';
    if(st.mode==='digit-pad'||st.mode==='vertical'){
      const wrong=String(target+1);
      const typ=async s=>{for(const ch of s){await p.evaluate(([sec,ch])=>{const b=[...document.querySelectorAll(`#${sec}DigitPad button`)].find(x=>x.textContent.trim()==='٠١٢٣٤٥٦٧٨٩'[ch]);b&&b.click()},[sec==='addition'?'addition':'subtraction',ch])}};
      await typ(wrong);await rec(tag+' typed-wrong',sec);
      await p.evaluate(P=>{const f=window[P.slice(0,3).toLowerCase()+'2ToggleHint'];if(f)f()},P);await rec(tag+' hint-open',sec);
      for(let k=0;k<3;k++){await p.evaluate(P=>window['check'+P](),P);await p.waitForTimeout(150);await rec(tag+' wrong-check'+k,sec);await typ(wrong.slice(0,1))}
      await p.evaluate(sec=>{[...document.querySelectorAll(`#${sec}DigitPad .${sec}-digit-clear`)].forEach(b=>{for(let i=0;i<5;i++)b.click()})},sec);
      await typ(String(target));await rec(tag+' typed-right',sec);
      await p.evaluate(P=>window['check'+P](),P);await p.waitForTimeout(300);await rec(tag+' after-check',sec);
    }else{
      if(st.mode==='concrete-removal'){await p.evaluate(()=>{document.querySelectorAll('.subtraction-item-btn').forEach((b,i)=>{})});for(let i=0;i<st.b;i++)await p.evaluate(()=>{const b=[...document.querySelectorAll('.subtraction-item-btn:not(.removed)')][0];b&&b.click()});await rec(tag+' removed',sec)}
      if(st.mode==='ten-frame'){for(let i=0;i<st.b;i++)await p.evaluate(()=>{const b=document.querySelector('.subtraction-ten-frame-cell.tappable[data-filled="1"]');b&&b.click()});await rec(tag+' removed',sec)}
      if(st.mode==='number-line'){for(let n=st.a-1;n>=st.a-st.b;n--)await p.evaluate(n=>{const e=document.querySelector(`#subNumberLine [data-value="${n}"]`);e&&e.click()},n);await rec(tag+' stepped',sec);await p.waitForTimeout(1200);}
      else{
        const cls=sec==='addition'?'addition-choice-btn':'subtraction-choice-btn';
        for(let k=0;k<3;k++){await p.evaluate(([cls,target])=>{const bs=[...document.querySelectorAll('.'+cls)];const w=bs.find(b=>!b.disabled&&!b.classList.contains('wrong')&&b.textContent.trim()!==String(target).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]));w&&w.click()},[cls,target]);await rec(tag+' choice-wrong'+k,sec);await p.waitForTimeout(150)}
        await p.evaluate(P=>{const f=window[P.slice(0,3).toLowerCase()+'2ToggleHint'];if(f)f()},P);await rec(tag+' hint-open',sec);
        await p.evaluate(([cls,target])=>{const bs=[...document.querySelectorAll('.'+cls)];const r=bs.find(b=>b.textContent.trim()===String(target).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]));r&&r.click()},[cls,target]);await rec(tag+' choice-right',sec);
      }
    }
    // انتظر الانتقال للمهمة التالية أو شاشة النتيجة
    for(let w=0;w<40;w++){await p.waitForTimeout(250);const ni=await p.evaluate(P=>eval(P.toLowerCase()+'LevelState').taskIndex,P);if(ni!==t)break}
   }
   await p.waitForTimeout(500);await rec(`${sec} L${lv} result`,sec);
   await p.evaluate(P=>{try{window['backTo'+P+'Levels']()}catch(e){}},P);await p.waitForTimeout(200);
  }
 }
 const byWhere={};for(const [k,tag] of found){const [sec,kind,path,text]=k.split('|');const kk=`${sec}|${kind}|${path}`;(byWhere[kk]=byWhere[kk]||[]).push(text+'  ← '+tag)}
 console.log('مواضع أرقام غربية (٠-٩ لاتينية):',Object.keys(byWhere).length);
 for(const [k,v] of Object.entries(byWhere))console.log('-',k,'\n    ',v.slice(0,3).join('\n     '),v.length>3?`(+${v.length-3})`:'');
 console.log('JS errors:',errs.length,errs.slice(0,3).join('|'));
 await br.close();process.exit(found.size?1:0)})();
