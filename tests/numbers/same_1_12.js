const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const br=await chromium.launch();const out={};
for(const port of [8821,8822]){const p=await (await br.newContext({viewport:{width:1366,height:768}})).newPage();await p.goto(`http://127.0.0.1:${port}/index.html`);await p.waitForTimeout(2000);
 out[port]=await p.evaluate(()=>{let seed=12345;Math.random=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296};const r={};for(let n=1;n<=20;n++){if(n>=13)continue;const plan=ajBuildPlan(n);r[n]={plan:JSON.stringify(plan.flat.map(x=>x.type)),specs:plan.flat.map(a=>{try{return JSON.stringify(AJ_TYPES[a.type].build(n))}catch(e){return 'ERR'+e}})}}return JSON.stringify(r)});}
console.log('identical builds for 1-12:',out[8821]===out[8822],out[8821].length);
if(out[8821]!==out[8822]){const a=JSON.parse(out[8821]),b=JSON.parse(out[8822]);for(const n in a){a[n].specs.forEach((s,i)=>{if(s!==b[n].specs[i])console.log('DIFF',n,i,s.slice(0,200),'\n   ',b[n].specs[i].slice(0,200))});if(a[n].plan!==b[n].plan)console.log('PLANDIFF',n)}}
await br.close()})();
