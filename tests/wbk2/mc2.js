const N=4000;const probs={hear:0.5,decode:0.5,build:1/12};const types=['hear','decode','build'];
function sim(V,rule){let tot=[];for(let n=0;n<N;n++){const ev={};for(let k=0;k<V;k++){const id=Math.floor(Math.random()*24),t=types[k%3];if(Math.random()<probs[t]){(ev[id]=ev[id]||new Set()).add(t)}}
 let s=0;Object.values(ev).forEach(e=>{if(rule(e))s++});tot.push(s)}
 tot.sort((a,b)=>a-b);return {mean:+(tot.reduce((a,b)=>a+b)/N).toFixed(1),p95:tot[Math.floor(N*.95)]}}
const R={ 'القاعدة المعتمدة (نشاطان مختلفان)':e=>e.size>=2, 'بديل: نشاطان أحدهما البناء':e=>e.size>=2&&e.has('build'), 'بديل: الأنشطة الثلاثة':e=>e.size>=3};
for(const [k,r] of Object.entries(R)){console.log(k);for(const V of [72,144,300,600])console.log('  أسئلة',V,JSON.stringify(sim(V,r)))}
