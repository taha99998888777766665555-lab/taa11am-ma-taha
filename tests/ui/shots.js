/* لقطات: الرئيسية، مدخل الكلمات، رئيسية الدرس ٣، أبني الكلمة — PORT/OUT/MODE(calm|play|none) */
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const VPS={m360:[360,640,2,1,1],m390:[390,844,2,1,1],tablet:[820,1180,2,1,0],desktop:[1366,768,1,0,0],board:[1920,1080,1,1,0]};
const PORT=process.env.PORT||8992,OUT=process.env.OUT||'/tmp/ui/after',MODE=process.env.MODE||'';
const only=(process.env.VPS||Object.keys(VPS).join(',')).split(',');
(async()=>{const br=await chromium.launch();
 for(const vp of only){const [w,h,d,t,m]=VPS[vp];
  const ctx=await br.newContext({viewport:{width:w,height:h},deviceScaleFactor:d,hasTouch:!!t,isMobile:!!m,serviceWorkers:'block'});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
  await p.addInitScript(mode=>{try{localStorage.setItem('taha_child_name','طالب');localStorage.setItem('taha_child_avatar','🦁');}catch(e){}},MODE);
  await p.goto(`http://127.0.0.1:${PORT}/index.html${MODE?'?ui='+MODE+'&shots=1':''}`);await p.waitForTimeout(1500);
  const tag=`${vp}${MODE?'_'+MODE:''}`;
  const shot=async n=>{await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(500);await p.screenshot({path:`${OUT}/${tag}_${n}.png`})};
  await shot('1home');
  await p.evaluate(()=>showScreen('words'));await shot('2words');
  await p.evaluate(()=>document.getElementById('wordsLevelsGrid').scrollIntoView({block:'start'}));await p.waitForTimeout(500);await p.screenshot({path:`${OUT}/${tag}_2bLevels.png`});
  await p.evaluate(()=>wbk3Open());await shot('3lesson3');
  await p.evaluate(()=>{wbk3State.scope='all';const q=wbk3Internals.load();q.lv={hear:1,build:1,missing:1};wbk3Internals.save(q);wbk3Internals.startActivity('build',{items:[{id:'w01',type:'build'}]})});
  await p.waitForSelector('#wb3Tray .wb3-tile').catch(()=>{});await shot('4build');
  const tiles=await p.$$('#wb3Tray .wb3-tile');if(tiles.length){await tiles[0].click();await p.waitForTimeout(300);await shot('5build_placed')}
  if(process.env.LETTERS!=='0'){await p.evaluate(()=>showScreen('letters'));await p.waitForTimeout(300);
   await p.locator('.ltr-level-card-btn').first().click();await p.waitForTimeout(300);await p.locator('.ltr-letter-card-btn').first().click();await p.waitForTimeout(300);
   await p.locator('#letters [onclick="startLetterSession(\'stage\', \'listen\')"]').first().click();await p.waitForTimeout(900);await shot('6letters_run')}
  if(errs.length)console.log(vp,'ERR',errs);
  await ctx.close()}
 await br.close()})();
