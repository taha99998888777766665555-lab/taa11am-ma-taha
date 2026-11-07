/* PWA: تشغيل اللعبة دون اتصال بعد تسجيل الـ service worker. PORT=8992 */
const {chromium}=require('playwright');const PORT=process.env.PORT||8992;
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:800}});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://localhost:${PORT}/index.html`);
await p.evaluate(async()=>{await navigator.serviceWorker.ready;});
await p.waitForTimeout(4000);
const names=await p.evaluate(()=>caches.keys());
const hasFiles=await p.evaluate(async()=>{const c=await caches.open((await caches.keys())[0]);return [await c.match('./submarine.js')?1:0,await c.match('./submarine.css')?1:0]});
await ctx.setOffline(true);await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>{showScreen('numbers');openSubmarineGame()});await p.waitForTimeout(800);
const r=await p.evaluate(()=>({active:document.querySelector('#submarineGame').classList.contains('active'),cv:!!document.querySelector('#submarineGame canvas'),api:!!window.__subGame}));
await p.evaluate(()=>__subGame.startRound(10,5));await p.waitForTimeout(1500);
const n=await p.evaluate(()=>__subGame.G.fish.length);
console.log(JSON.stringify({names,hasFiles,r,fish:n,errs}));
const ok=names.includes('taha-app-v66')&&hasFiles[0]&&hasFiles[1]&&r.active&&r.cv&&n>5&&!errs.length;
console.log(ok?'offline: PASS':'offline: FAIL');await b.close();process.exit(ok?0:1)})();
