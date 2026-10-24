const L=require('/tmp/v61/t/lib.js');
(async()=>{const {br,p}=await L.mk('board');await L.open(p);
 const res=await p.evaluate(()=>{window.addStars=function(){};const I=wbk2Internals;const N=3000;
  const probs={hear:0.5,decode:0.5,build:1/12};const types=['hear','decode','build'];const out={};
  function rng(){return Math.random()}
  [72,144,300,600].forEach(V=>{const arr=[];let rule1=[];
   for(let n=0;n<N;n++){const q={v:1,stars:0,starred:{},testStar:false,sessions:0,syl:{},lv:{},tests:[],prefs:{}};let old=0;const oldSet={};
    for(let k=0;k<V;k++){const id=WBK2_DATA.SYLLABLES[Math.floor(rng()*24)].id,t=types[k%3];
     const f=rng()<probs[t];I.logResult(q,id,t,f?'f':'r',{});if(f)oldSet[id]=1}
    arr.push(q.stars);rule1.push(Object.keys(oldSet).length)}
   const pc=(a,x)=>{const b=a.slice().sort((m,n)=>m-n);return b[Math.floor(b.length*x)]};const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
   out[V]={newMean:+mean(arr).toFixed(1),newP95:pc(arr,.95),newMax:Math.max(...arr),oldMean:+mean(rule1).toFixed(1),oldP95:pc(rule1,.95)}});
  return out});
 console.log(JSON.stringify(res,null,1));await br.close()})();
