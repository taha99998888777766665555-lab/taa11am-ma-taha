const L=require('./lib.js');
(async()=>{for(const vp of Object.keys(L.VPS)){const {br,p}=await L.mk(vp);await L.open(p);
 const shot=async(n)=>{await p.waitForTimeout(500);await p.screenshot({path:`/tmp/audit/navshots/${vp}_${n}.png`})};
 for(const id of ['letters','words','addition','subtraction']){await p.evaluate(id=>showScreen(id),id);await shot(id)}
 await p.evaluate(()=>showScreen('writing'));await L.tap(p,'.wr-tile');await shot('writingPlay');
 await p.evaluate(()=>showScreen('quran'));await L.tap(p,'.quran-surah-card');await shot('quran_surah');
 await p.evaluate(()=>showScreen('games'));await L.tap(p,'[onclick="startZooGame()"]');await shot('zoo');
 await p.evaluate(()=>showScreen('words'));await L.tap(p,'#wbk3Entry');await shot('lesson3');
 await br.close()}})();
