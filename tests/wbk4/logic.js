const L=require('./lib.js');const fs=require('fs'),cp=require('child_process');
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
(async()=>{
 const {br,p,errs}=await L.mk('m390');await L.open(p);
 const D=await p.evaluate(()=>({s:WBK4_DATA.SENTENCES.map(s=>({id:s.id,key:s.key,audio:s.audio,u1:s.u1,u2:s.u2})),all:WBK4_DATA.allAudio(),chk:WBK4_DATA.AUDIO_CHECKED}));
 // ---- 1) all 22 audio files: exist, load, map to text, byte-identical to originals ----
 ok(D.all.length===18,'18 audio entries (8 sentences + 10 words)');
 const orig=fs.readdirSync('source-audio/batch_12').filter(f=>f.endsWith('.mp3')).sort();
 ok(orig.length===22,'22 originals preserved (4 unused)',String(orig.length));
 const md5=f=>cp.execSync('md5sum <'+JSON.stringify(f)).toString().slice(0,32);
 const exp=['sentence','word'];
 const origIdx=i=>i<8?i+2:i+4; /* sentences 3-10 are batch 3-10; words w03..w12 are batch 15-22 */
 D.all.forEach((a,i)=>{ok(fs.existsSync(a.file),'file exists '+a.file);ok(md5(a.file)===md5('source-audio/batch_12/'+orig[origIdx(i)]),'copy #'+(i+1)+' identical to original '+orig[origIdx(i)]);});
 ok(!fs.existsSync('assets/audio/educational/sentences/wbk4_s01_qaraa-wakataba.mp3')&&!fs.existsSync('assets/audio/educational/sentences/wbk4_s02_darasa-wanajaha.mp3'),'deleted sentences have no active audio');
 ok(fs.readdirSync('source-audio/batch_12').filter(f=>f.endsWith('.mp3')).length===22,'originals untouched');
 const dur=await p.evaluate(async fs=>{const r=[];for(const f of fs){r.push(await new Promise(res=>{const a=new Audio(f);a.preload='auto';a.onloadedmetadata=()=>res(a.duration);a.onerror=()=>res(-1);setTimeout(()=>res(-2),8000)}))}return r},D.all.map(a=>a.file));
 dur.forEach((d,i)=>ok(d>0.3&&d<8,'loads, duration '+D.all[i].file,String(d)));
 console.log('  durations',dur.map(x=>x.toFixed(2)).join(' '));
 const book=['طَلَعَ وَنَزَلَ','فَتَحَ وَأَخَذَ','رَكَعَ وَسَجَدَ','سَقَطَ وَنَهَضَ','طَبَخَ وَأَكَلَ','سَبَحَ وَغَطَسَ','وَقَفَ وَنَظَرَ','ذَهَبَ وَرَجَعَ'];
 ok(D.s.length===8,'exactly 8 sentences');
 ok(!D.s.some(s=>/كَتَبَ|دَرَسَ|نَجَحَ/.test(s.key)),'removed sentences absent from data');
 D.s.forEach((s,i)=>{ok(s.key===book[i],'sentence '+(i+1)+' text = book',s.key);ok(D.all[i].file===s.audio&&D.all[i].text===s.key,'audio #'+(i+1)+' mapped to its sentence');});
 ok(D.s.every(s=>s.u2.text===('وَ'+s.u2.word)&&s.u2.text.startsWith('وَ')&&s.u2.text.length>3),'و attached to second word in data');
 ok(D.chk===false,'audio flagged unverified until user listens');
 // ---- 2/3) full sentence recording, never composed; speeds ----
 await p.click('[data-stage="teach"]');await p.waitForTimeout(400);
 for(let i=0;i<8;i++){
  const shown=await p.evaluate(()=>document.querySelector('#wb4TeachShow .wb4-sent').textContent.replace(/\s+/g,' ').trim());
  ok(shown===D.s[i].key,'teach shows sentence '+(i+1),shown);
  await p.evaluate(()=>{window.__plays=[]});
  await p.click('#wb4Listen');await p.waitForTimeout(150);
  let pl=await p.evaluate(()=>window.__plays.slice());
  ok(pl.length===1&&pl[0].src===D.s[i].audio,'normal play = one full-sentence file '+(i+1),JSON.stringify(pl));
  ok(pl[0]&&pl[0].rate===1,'normal rate 1');
  await p.evaluate(()=>{window.__plays=[]});
  await p.click('#wb4ListenSlow');await p.waitForTimeout(150);
  pl=await p.evaluate(()=>window.__plays.slice());
  ok(pl.length===1&&pl[0].src===D.s[i].audio&&Math.abs(pl[0].rate-0.85)<1e-9&&pl[0].pp===true,'slow = same file, rate 0.85, preservesPitch '+(i+1),JSON.stringify(pl));
  // single word tap plays word file only
  await p.evaluate(()=>{window.__plays=[]});
  await p.click('.wb4-wordbtn[data-unit="2"]');await p.waitForTimeout(150);
  pl=await p.evaluate(()=>window.__plays.slice());
  ok(pl.length===1&&pl[0].src===D.s[i].u2.audio&&pl[0].src!==D.s[i].audio,'word tap = word file '+(i+1),JSON.stringify(pl));
  await p.click('#wb4QActs .wb3-btn.main');await p.waitForTimeout(120);
 }
 ok(await p.evaluate(()=>document.getElementById('wb4Path')!==null),'teach finishes back to home');
 ok(errs.length===0,'no errors (logic)',errs.join());
 await br.close();
 console.log('wbk4 logic:',pass,'pass',fail,'fail');process.exit(fail?1:0);
})();
