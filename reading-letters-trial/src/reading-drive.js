// Reading-only world collectibles. The existing engine owns motion and gate scoring.
export function createReadingDrive({onPhase,onCount,onCollect}) {
 let round=-1,phase='pending',saved=null,stars=[],origin=0,previous=null,total=0,bursts=[];
 const LENGTH=8400,PLAYER=1100,LANES=[-2/3,0,2/3];
 function before(s,dt){
  const front=s.pos+PLAYER;
  if(s.gate&&!s.gate.resolved&&s.gate.r!==round){
   round=s.gate.r;origin=front;saved=s.gate;saved.z+=LENGTH;saved.hitZ+=LENGTH;
   stars=[2200,4500,6800].map((z,i)=>({z:origin+z,x:LANES[(i+round)%3],taken:false,passed:false}));
   s.gate=null;s.spawnRound=-1;s.mode='step';s.chosen=false;s.steered=false;
   phase='stars';previous={z:front,x:s.playerX};onPhase('stars',round);
  }
  if(phase==='stars'){
   const prev=previous||{z:front,x:s.playerX};
   for(const star of stars){
    if(!star.passed&&prev.z<=star.z&&front>=star.z){
     const t=front>prev.z?(star.z-prev.z)/(front-prev.z):1;
     const x=prev.x+(s.playerX-prev.x)*t;star.passed=true;
     if(Math.abs(x-star.x)<=.30){star.taken=true;total++;onCount(total);onCollect();bursts.push({t:0,x:star.x});}
    }
   }
   previous={z:front,x:s.playerX};
   if(front>=origin+LENGTH){
    phase='gates';s.gate=saved;s.mode='step';s.chosen=false;s.steered=false;s.settle=0;s.waitMsg=false;
    stars=[];bursts=[];onPhase('gates',round);
   }
  }
  bursts.forEach(b=>b.t+=dt);bursts=bursts.filter(b=>b.t<.45);
 }
 function paint(ctx,f,U,roadW){
  if(phase!=='stars')return;
  for(const star of stars){
   if(star.passed||Math.floor(star.z/200)!==f.abs)continue;
   const p=(star.z-f.abs*200)/200,sc=f.s1+(f.s2-f.s1)*p;
   const x=f.x1+(f.x2-f.x1)*p+sc*star.x*roadW*U,y=f.y1+(f.y2-f.y1)*p;
   drawGoldStar(ctx,x,y-sc*180*U,Math.max(2,sc*175*U));
  }
 }
 function paintCarEffect(ctx,cx,cy,w){
  for(const b of bursts){const u=b.t/.45;ctx.save();ctx.globalAlpha=1-u;drawGoldStar(ctx,cx+(b.x*.18)*w,cy-w*(.6+u*.7),w*(.13+u*.04));ctx.restore();}
 }
 return {before,paint,paintCarEffect,get phase(){return phase},get total(){return total}};
}
export function drawGoldStar(ctx,x,y,r){
 ctx.save();ctx.translate(x,y);ctx.lineJoin='round';
 const path=()=>{ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,k=i%2?.46:1;const px=Math.cos(a)*r*k,py=Math.sin(a)*r*k;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath()};
 ctx.save();ctx.translate(r*.10,r*.16);path();ctx.fillStyle='#a96b10';ctx.fill();ctx.restore();
 const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#fff4ac');g.addColorStop(.45,'#ffd54d');g.addColorStop(1,'#dc951b');path();ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#b77b13';ctx.lineWidth=Math.max(1,r*.055);ctx.stroke();
 ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-r*.9);ctx.lineTo(r*.26,-r*.36);ctx.closePath();ctx.fillStyle='rgba(255,255,255,.5)';ctx.fill();ctx.restore();
}
export function createStarSound(){
 let context=null,voice=null;
 return {unlock(){try{context=context||new (window.AudioContext||window.webkitAudioContext)();void context.resume()}catch{}},play(){
  if(!context||context.state!=='running')return;
  try{voice?.stop();const o=context.createOscillator(),g=context.createGain(),t=context.currentTime;voice=o;o.type='sine';o.frequency.setValueAtTime(660,t);o.frequency.exponentialRampToValueAtTime(880,t+.07);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.035,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+.14);o.connect(g);g.connect(context.destination);o.start();o.stop(t+.15)}catch{}
 },stop(){try{voice?.stop()}catch{}},dispose(){try{voice?.stop();void context?.close()}catch{}}};
}
