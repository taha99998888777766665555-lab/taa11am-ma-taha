const L=require('/tmp/v61/t/lib.js');const fs=require('fs'),crypto=require('crypto');
let pass=0,fail=0;const ok=(c,m,d='')=>{if(c)pass++;else{fail++;console.log('FAIL',m,d)}};
const R='/home/claude/wt-words-l2/',D=R+'assets/audio/educational/syllables/';
const map=JSON.parse(fs.readFileSync(''+__dirname+'/audio-map.json','utf8')); // [idx,cell,text,file] من جدول المراجعة
const md5=f=>crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');
(async()=>{
 // 1) الملفات مطابقة للمصدر المرفوع حسب الجدول (لا الترتيب وحده)
 for(const [i,c,t,f] of map){const src=`/tmp/v62/in/${String(i).padStart(3,'0')}_audio_${i}.mp3`;ok(fs.existsSync(D+f)&&md5(D+f)===md5(src),`file ${f} == upload #${i} (${t})`)}
 ok(map.length===14,'14 mapped');
 // 2) الأسماء في الملف تطابق المقطع الصحيح: اسم الملف يحمل رقم الخلية نفسها
 const data=await (async()=>{global.self=global;require(R+'wbk2-data.js');return WBK2_DATA})();
 data.SYLLABLES.forEach(s=>{if(s.audio.includes('wbk2_')){ok(+s.audio.match(/wbk2_(\d+)_/)[1]===s.cell,'name cell == syllable cell '+s.id)}});
 const appr=data.SYLLABLES.filter(s=>s.approved);
 ok(appr.length===21,'21 approved');
 const rej=data.SYLLABLES.filter(s=>[1,21,23].includes(s.cell));
 ok(rej.length===3&&rej.every(s=>!s.approved&&!fs.existsSync(R+s.audio)),'3 rejected: not approved, no file on disk');
 ok(appr.every(s=>fs.existsSync(R+s.audio)),'all approved files exist');
 ok(JSON.stringify(data.approvedAudioFiles().sort())===JSON.stringify(appr.map(s=>s.audio).sort())&&data.approvedAudioFiles().length===21,'approvedAudioFiles()==21');
 // 3) القديمة السبعة لم تتغير (git)
 const {execSync}=require('child_process');
 ok(execSync('git status --porcelain -- assets/audio/educational/syllables/l2_*.mp3',{cwd:R}).toString().trim()==='','old l2_* untouched');
 // 4) المتصفح: كل مقطع معتمد يشغّل ملفه هو بالجدول، والمرفوض لا يشغّل شيئًا
 const {br,p,errs}=await L.mk('board');
 await p.addInitScript(()=>{window.__aud=[];const A=window.Audio;window.Audio=function(s){window.__aud.push(String(s));return new A(s)};window.Audio.prototype=A.prototype});
 await L.open(p);
 for(const s of appr){await p.evaluate(id=>wbk2Internals.playSyllable(WBK2_DATA.SYLLABLES.find(x=>x.id===id)),s.id);}
 let played=await p.evaluate(()=>window.__aud.filter(x=>x.includes('/syllables/')));
 ok(played.length===21&&played.every((x,i)=>x.endsWith(appr[i].audio)),'each approved id plays its own file');
 await p.evaluate(()=>{window.__aud.length=0});
 for(const s of rej){const r=await p.evaluate(id=>wbk2Internals.playSyllable(WBK2_DATA.SYLLABLES.find(x=>x.id===id)),s.id);ok(r===false,'rejected not played '+s.id)}
 ok(await p.evaluate(()=>window.__aud.filter(x=>x.includes('/syllables/')).length)===0,'no audio element created for rejected');
 // 5) واجهة المرفوض: قيد الإعداد
 await p.evaluate(()=>wbk2Internals.renderLibrary());await p.click('#wb2Grid [data-id=s01]');await p.waitForTimeout(200);
 for(let i=0;i<3;i++){await p.click('#wb2Acts .main');await p.waitForTimeout(150)}await p.waitForTimeout(700);
 ok(await p.$eval('#wb2Listen',b=>b.disabled)&&(await p.textContent('#wb2Listen')).includes('قيد الإعداد'),'rejected syllable shows قيد الإعداد, listen disabled');
 // 6) المقاطع المرفوضة لا تدخل الأسئلة السمعية أبدًا
 let leak=0;for(let k=0;k<40;k++){const o=await p.evaluate(()=>{const q=wbk2Internals.load();const pf=wbk2Internals.poolFor(q,'all',true);return pf.pool});if(o.some(id=>['s01','s21','s23'].includes(id)))leak++;}
 ok(leak===0,'rejected never in audio pool'); 
 for(let k=0;k<8;k++){await p.evaluate(()=>wbk2Internals.startTest());const ty=await p.evaluate(()=>wbk2State.run.items.filter(i=>i.type==='hear'||i.type==='build').map(i=>i.id));ok(ty.every(id=>!['s01','s21','s23'].includes(id)),'test audio items approved only')}
 console.log('errs',errs);ok(errs.length===0,'no js errors');console.log('PASS',pass,'FAIL',fail);await br.close();
})();
