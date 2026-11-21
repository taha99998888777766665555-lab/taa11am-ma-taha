import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createReadingBank,bankCounts,sourceCommit} from '../reading-banks.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../..');
const allow=JSON.parse(await fs.readFile(path.join(here,'../allowlist.json')));
const verdicts=JSON.parse(await fs.readFile(path.join(here,'../human-review-results.json'))).verdicts;
const loadBytes=p=>fs.readFile(path.join(repo,p));
let pass=0;const check=(v)=>{assert.ok(v);pass++};
const deny=async f=>{await assert.rejects(f,/READING_AUDIO_REJECTED:/);pass++};
const slot=(r,role)=>({id:r.id,path:r.path,sha256:r.sha256,role});
check(allow.approved.length===72&&allow.blocked.length===5);
check(allow.sourceCommit===sourceCommit);
const approvedIds=new Set(verdicts.filter(r=>r.usable).map(r=>r.itemId));
check(allow.approved.every(r=>approvedIds.has(r.itemId)));
const sections=['letters','syllables','words'];
let validRoles=0,blockedRoles=0,questions=0;
for(const section of sections){
 const bank=createReadingBank(section,{loadBytes});
 const exported=JSON.parse(await fs.readFile(path.join(here,'../'+section+'.json')));
 check(bank.inventory.length===bankCounts[section]);
 assert.deepEqual(bank.inventory,exported.items);pass++;
 check(Object.isFrozen(bank.inventory)&&bank.inventory.every(Object.isFrozen));
 for(const row of bank.inventory){
  for(const role of ['question','answer','distractor']){
   const accepted=await bank.acceptSlot(slot(row,role));
   const original=await loadBytes(row.path);
   check(Buffer.from(await accepted.audio.arrayBuffer()).equals(original));
   check(accepted.sha256===createHash('sha256').update(original).digest('hex'));
   validRoles++;
  }
  const other=bank.inventory.find(x=>x.id!==row.id);
  const q=await bank.createQuestion({question:slot(row,'question'),answer:slot(row,'answer'),distractors:[slot(other,'distractor')]});
  check(q.question.id===row.id&&q.answer.id===row.id&&q.distractors[0].id===other.id);
  check(q.mode===(section==='words'?'whole-word':'whole-recording'));questions++;
 }
 for(const bad of allow.blocked){
  for(const role of ['question','answer','distractor']){
   await deny(()=>bank.acceptSlot({id:bad.itemId,path:bad.sourcePath,sha256:bad.audioSha256,role}));blockedRoles++;
  }
 }
 const r=bank.inventory[0],other=bank.inventory[1],cross=createReadingBank(sections.find(s=>s!==section),{loadBytes}).inventory[0];
 await deny(()=>bank.acceptSlot(slot(cross,'question')));
 await deny(()=>bank.acceptSlot({...slot(r,'question'),path:r.filename}));
 await deny(()=>bank.acceptSlot({...slot(r,'answer'),sha256:'0'.repeat(64)}));
 await deny(()=>bank.acceptSlot({...slot(r,'distractor'),id:'guessed'}));
 await deny(()=>bank.acceptSlot({...slot(r,'question'),role:'component'}));
 await deny(()=>bank.createQuestion({question:slot(r,'question'),answer:slot(other,'answer'),distractors:[slot(r,'distractor')]}));
 await deny(()=>bank.createQuestion({question:slot(r,'question'),answer:slot(r,'answer'),distractors:[slot(r,'distractor')]}));
 await deny(()=>bank.createQuestion({question:slot(r,'question'),answer:slot(r,'answer'),distractors:[]}));
 await deny(()=>bank.createQuestion({question:slot(r,'question'),answer:slot(r,'answer'),distractors:[slot(other,'distractor')],components:[]}));
 for(const role of ['question','answer','distractor']){
  const blocked=allow.blocked[0],bad={id:blocked.itemId,path:blocked.sourcePath,sha256:blocked.audioSha256,role};
  const spec={question:slot(r,'question'),answer:slot(r,'answer'),distractors:[slot(other,'distractor')]};
  if(role==='question'){spec.question=bad;spec.answer={...bad,role:'answer'}}
  else if(role==='answer')spec.answer=bad;
  else spec.distractors=[bad];
  await deny(()=>bank.createQuestion(spec));
 }
 for(const loader of [async()=>new Uint8Array([0]),async()=>{throw Error('missing')},async()=>'/fake.mp3']){
  const b=createReadingBank(section,{loadBytes:loader});await deny(()=>b.acceptSlot(slot(r,'question')));
 }
 // Even correct IDs, paths and hashes cannot launder rejected audio bytes.
 const rejected=await loadBytes(allow.blocked.find(x=>x.audioSha256).sourcePath);
 await deny(()=>createReadingBank(section,{loadBytes:async()=>rejected}).acceptSlot(slot(r,'distractor')));
 let held=await loadBytes(r.path);const b=createReadingBank(section,{loadBytes:async()=>held});
 const accepted=await b.acceptSlot(slot(r,'answer'));held.fill(0);
 check(createHash('sha256').update(Buffer.from(await accepted.audio.arrayBuffer())).digest('hex')===r.sha256);
 await deny(()=>b.acceptSlot(slot(r,'answer')));
}
await deny(async()=>createReadingBank('sentences',{loadBytes}));
await deny(async()=>createReadingBank('letters'));
// All original reviewed bytes, including rejected recordings, must remain unchanged.
for(const r of verdicts.filter(x=>x.audioSha256))check(createHash('sha256').update(await loadBytes(r.sourcePath)).digest('hex')===r.audioSha256);
console.log(JSON.stringify({status:'PASS',assertions:pass,acceptedAudioRoleChecks:validRoles,blockedAudioRoleChecks:blockedRoles,verifiedQuestions:questions,bankCounts,originalRecordingsUnchanged:74,wordsMode:'whole-word-only',runtime:'Node 22 Web Crypto / Blob',scope:'Data module only. No existing app imports module; no UI, race, student-state or playback integration tested.'},null,2));
