const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const SIZES=[[390,844],[390,667],[360,640],[375,568],[740,360],[1366,768],[1280,720],[820,1180],[1920,1080]];
(async()=>{const br=await chromium.launch();const bad=[];let checks=0;
 for(const [w,h] of SIZES){
  const ctx=await br.newContext({viewport:{width:w,height:h},hasTouch:w<900,isMobile:w<500,serviceWorkers:'block'});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://127.0.0.1:8961/index.html');await p.waitForTimeout(1200);await p.evaluate(()=>showScreen('words'));await p.evaluate(()=>wbk2Open());await p.waitForTimeout(400);
  await p.evaluate(()=>wbk2State.scope='all');
  const chk=async(name)=>{await p.waitForTimeout(500);
   const r=await p.evaluate(()=>{const out=[];const ctrls=[...document.querySelectorAll('#wbkL2 button:not(:disabled), #wbkL2 summary')].filter(b=>b.offsetParent);
    const de=document.documentElement;
    ctrls.forEach(b=>{if(b.closest('details:not([open])')&&b.tagName!=='SUMMARY')return;b.scrollIntoView({block:'nearest',behavior:'instant'});const r=b.getBoundingClientRect();if(r.width<1)return;
      const x=r.left+r.width/2,y=r.top+r.height/2;if(x<0||y<0||x>innerWidth||y>innerHeight){out.push('offscreen:'+(b.id||b.className));return}
      const t=document.elementFromPoint(x,y);if(!(t===b||b.contains(t)))out.push('covered:'+(b.id||b.className)+' by '+(t&&(t.id||t.className)));
      if(r.height<44&&!b.classList.contains('wb2-cell'))out.push('small:'+(b.id||b.className)+' '+Math.round(r.height));
    });
    window.scrollTo({top:0,behavior:'instant'});
    return {out,hs:de.scrollWidth>de.clientWidth,n:ctrls.length}});
   checks+=r.n;if(r.out.length||r.hs)bad.push(`${w}x${h} ${name} hs=${r.hs} ${r.out.slice(0,4).join('|')}`)};
  await chk('home');
  await p.click('#wb2LibBtn');await chk('library');await p.click('#wb2Back');
  await p.click('#wb2Go');await chk('disc1');for(let i=0;i<3;i++){await p.click('#wb2Acts .main');await p.waitForTimeout(120)}await p.waitForTimeout(900);await chk('disc4');
  for(const s of ['hear','build','decode','read']){await p.evaluate(()=>wbk2Internals.renderHome());await p.click(`[data-stage=${s}]`);await chk(s);}
  await p.click('#wb2Read');await chk('read2');
  await p.evaluate(()=>wbk2Internals.startTest());await chk('test1');
  await p.evaluate(()=>{wbk2State.gate=true});await p.click('#wb2Teacher');await chk('teacher');
  if(errs.length)bad.push(w+'x'+h+' errs '+errs);
  await ctx.close();}
 console.log('controls checked',checks);console.log(bad.length?bad.join('\n'):'NO OVERLAP / OVERFLOW at all sizes');await br.close();})();
