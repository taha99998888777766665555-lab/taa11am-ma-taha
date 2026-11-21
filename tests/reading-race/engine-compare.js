const {chromium}=require('playwright');
async function run(port){const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:700}});
await p.addInitScript(()=>{let a=12345;Math.random=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}});
await p.clock.install({time:0});
await p.goto(`http://localhost:${port}/index.html`);await p.clock.runFor(1500);
const out=[];
for(const theme of [5,0,9,3]){
 const h=await p.evaluate(async(theme)=>{const root=document.createElement('div');root.style.cssText='position:fixed;left:0;top:0;width:900px;height:600px;z-index:99999';document.body.appendChild(root);
  const rounds=[0,1,2].map(i=>({correctShape:'ب',options:['ب','ت','ج'],correctIndex:i}));
  const eng=rr3CreateEngine({root,standalone:true,letter:'',stageTitle:'',rounds,theme,track:'calm',layout:'gate',mode:'step',reduced:true,collision:0,promptText:'TARGET',phrases:['x'],hooks:{say:(t,d)=>d&&d(),stars:()=>'',alive:()=>true,error:()=>{},finish:()=>({title:'',body:'',next:'',onNext(){}})}});
  window.__e=eng;eng.start();eng.state.paused=false;return 1},theme);
 await p.clock.runFor(4000);
 const hash=await p.evaluate(()=>{const c=document.querySelector('canvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=0;for(let i=0;i<d.length;i+=7)h=(h*31+d[i])>>>0;const s=window.__e.state;const r=[s.pos,s.speed,s.playerX].map(x=>Math.round(x*1000)/1000);window.__e.destroy();document.querySelectorAll('div[style*="99999"]').forEach(n=>n.remove());return [h,r]});
 out.push(hash)}
await b.close();return out}
(async()=>{const a=await run(+process.argv[2]),m=await run(+process.argv[3]);console.log('branch',JSON.stringify(a));console.log('main  ',JSON.stringify(m));console.log('identical',JSON.stringify(a)===JSON.stringify(m))})()
