// Reading-race opt-in painter. Uses the engine's position/scale only, never movement.
export function drawReadingCar(ctx,cx,by,w,o){
 ctx.save();ctx.translate(cx,by);ctx.scale(w*1.23,w*1.23);ctx.transform(1,0,-(o.tilt||0)*.09,1,0,0);
 const poly=(pts,fill,stroke)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.012;ctx.stroke()}};
 let g=ctx.createRadialGradient(0,.01,.02,0,.01,.8);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(-.8,-.1,1.6,.35);
 // Wide wheels, separate fenders and low sculpted rear deck.
 for(const s of[-1,1]){ctx.fillStyle='#111922';ctx.fillRect(s<0?-.55:.38,-.42,.17,.4);ctx.fillStyle='#344454';ctx.fillRect(s<0?-.53:.4,-.4,.12,.34);ctx.strokeStyle='#0c1219';ctx.lineWidth=.025;for(let n=0;n<4;n++){const y=-.39+((n*.08+(o.phase||0))%.32);ctx.beginPath();ctx.moveTo(s<0?-.53:.4,y);ctx.lineTo(s<0?-.41:.52,y);ctx.stroke()}}
 g=ctx.createLinearGradient(0,-.72,0,0);g.addColorStop(0,'#97ece4');g.addColorStop(.35,'#218f99');g.addColorStop(.7,'#11535f');g.addColorStop(1,'#092b3c');
 poly([[-.49,-.11],[-.51,-.33],[-.39,-.54],[-.28,-.71],[.28,-.71],[.39,-.54],[.51,-.33],[.49,-.11],[.32,.01],[-.32,.01]],g,'#99dcd7');
 poly([[-.3,-.51],[-.22,-.7],[.22,-.7],[.3,-.51]],'#b5e6e7','#246c78');
 poly([[-.32,-.46],[-.22,-.63],[.22,-.63],[.32,-.46]],'#142d43','#65b7c0');
 poly([[-.28,-.44],[.28,-.44],[.34,-.3],[-.34,-.3]],'#113d50','#2f8090');
 // Twin metallic stripes, aero channels, rear window slats.
 ctx.fillStyle='#f4d79a';ctx.fillRect(-.085,-.7,.045,.2);ctx.fillRect(.04,-.7,.045,.2);
 ctx.strokeStyle='#0b2939';ctx.lineWidth=.022;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-.24,-.42+i*.027);ctx.lineTo(.24,-.42+i*.027);ctx.stroke()}
 poly([[-.47,-.26],[-.28,-.22],[-.29,-.12],[-.48,-.17]],'#3ea8b2');poly([[.47,-.26],[.28,-.22],[.29,-.12],[.48,-.17]],'#3ea8b2');
 ctx.fillStyle=o.brake?'#ff6656':'#e14d48';ctx.fillRect(-.42,-.23,.23,.035);ctx.fillRect(.19,-.23,.23,.035);
 ctx.fillStyle='#080f1a';ctx.fillRect(-.27,-.13,.54,.085);ctx.fillStyle='#27394c';for(let i=-3;i<=3;i++)ctx.fillRect(i*.065,-.12,.023,.09);
 // Fixed rear wing and its supports, not an added animation.
 ctx.fillStyle='#152c3c';ctx.fillRect(-.35,-.37,.03,.1);ctx.fillRect(.32,-.37,.03,.1);
 poly([[-.55,-.38],[-.49,-.43],[.49,-.43],[.55,-.38],[.5,-.33],[-.5,-.33]],'#183746','#93d8d4');
 ctx.fillStyle='#f1d59f';ctx.fillRect(-.4,-.395,.8,.018);ctx.fillStyle='#a8bac8';ctx.beginPath();ctx.arc(-.25,-.07,.027,0,Math.PI*2);ctx.arc(.25,-.07,.027,0,Math.PI*2);ctx.fill();ctx.restore();
}
export function drawInactiveGate(ctx,cx,top,pw,ph){ctx.save();ctx.fillStyle='#344653';ctx.fillRect(cx-pw/2,top,pw,ph);ctx.strokeStyle='#a8b7bc';ctx.lineWidth=Math.max(2,pw*.035);ctx.beginPath();ctx.moveTo(cx-pw*.18,top+ph*.28);ctx.lineTo(cx+pw*.18,top+ph*.72);ctx.moveTo(cx+pw*.18,top+ph*.28);ctx.lineTo(cx-pw*.18,top+ph*.72);ctx.stroke();ctx.restore()}
