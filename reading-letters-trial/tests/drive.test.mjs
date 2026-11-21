import assert from 'node:assert/strict';
import {createReadingDrive} from '../src/reading-drive.js';
const results=[];
function run(name,points,expected){let count=0,collect=0,phases=[];const d=createReadingDrive({onPhase:p=>phases.push(p),onCount:n=>count=n,onCollect:()=>collect++});const g={r:0,z:13000,hitZ:13000,resolved:false};const s={pos:0,playerX:0,gate:g,spawnRound:-1,mode:'step'};d.before(s,.016);assert.equal(s.gate,null);assert.equal(g.z,21400);for(const [front,x] of points){s.pos=front-1100;s.playerX=x;d.before(s,.05)}assert.equal(count,expected);assert.equal(collect,expected);assert.equal(d.phase,'gates');assert.equal(s.gate,g);assert.equal(s.chosen,false);assert.equal(s.mode,'step');assert.deepEqual(phases,['stars','gates']);const prior=count;g.resolved=true;d.before(s,.016);g.resolved=false;s.pos+=300;d.before(s,.016);assert.equal(count,prior);assert.equal(d.phase,'gates');assert.equal(s.gate,g);results.push({name,stars:count,retryDoesNotReset:true});}
run('all three collected with lateral steering',[[2000,-2/3],[3500,-2/3],[4500,0],[5800,0],[6800,2/3],[8000,2/3],[9600,2/3]],3);
run('zero stars still reaches gates',[[2000,2/3],[3500,2/3],[4500,2/3],[5800,2/3],[6800,-2/3],[8000,-2/3],[9600,-2/3]],0);
run('crossing interpolation, not post-frame lane',[[3000,-2/3],[4800,2/3],[5200,0],[6000,0],[7600,2/3],[8000,2/3],[9600,2/3]],3);
run('large forward jump cannot duplicate a star',[[10000,0],[11000,0]],1);
console.log(JSON.stringify({status:'PASS',collisionLateralTolerance:.30,starDistances:[2200,4500,6800],zoneDistance:8400,results},null,2));
