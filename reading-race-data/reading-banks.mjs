// Data-only integration. No UI, engine, playback, storage or student-state access.
import { APPROVED, SOURCE_COMMIT } from './approved-data.mjs';
const freeze = value => {if(value && typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const roles = new Set(['question','answer','distractor']);
const sections = new Set(['letters','syllables','words']);
const index = new Map(APPROVED.map(row=>[row.id,row]));
const reject = code => {throw new Error('READING_AUDIO_REJECTED:'+code);};
export const sourceCommit=SOURCE_COMMIT;
export const bankCounts=freeze({letters:27,syllables:20,words:25});

export function createReadingBank(section,{loadBytes}={}) {
  if(!sections.has(section))reject('section');
  if(typeof loadBytes!=='function')reject('loader_required');
  const inventory=freeze(APPROVED.filter(r=>r.section===section).map(r=>({...r})));
  async function acceptSlot(slot) {
    if(!slot||!roles.has(slot.role))reject('role');
    const row=index.get(slot.id);
    if(!row||row.section!==section)reject('id_or_section');
    if(slot.path!==row.path||slot.sha256!==row.sha256)reject('identity');
    // Load only the allowlisted original path. No fallback or guessed filename.
    let loaded;try{loaded=await loadBytes(row.path);}catch{reject('load_failed');}
    if(!(loaded instanceof ArrayBuffer)&&!ArrayBuffer.isView(loaded))reject('bytes_required');
    // Snapshot before hashing; later loader mutation cannot alter the returned Blob.
    const snapshot=loaded instanceof ArrayBuffer?new Uint8Array(loaded.slice(0)):new Uint8Array(loaded.buffer,loaded.byteOffset,loaded.byteLength).slice();
    if(!globalThis.crypto?.subtle)reject('sha256_unavailable');
    const digest=Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',snapshot)),x=>x.toString(16).padStart(2,'0')).join('');
    if(digest!==row.sha256)reject('bytes_mismatch');
    return freeze({id:row.id,section,text:row.text,path:row.path,sha256:row.sha256,role:slot.role,mode:section==='words'?'whole-word':'whole-recording',audio:new Blob([snapshot],{type:'audio/mpeg'})});
  }
  async function createQuestion(spec) {
    if(!spec||Object.keys(spec).some(k=>!['question','answer','distractors'].includes(k)))reject('question_shape');
    if(!spec.question||!spec.answer||spec.question.role!=='question'||spec.answer.role!=='answer'||spec.question.id!==spec.answer.id)reject('answer_mismatch');
    if(!Array.isArray(spec.distractors)||!spec.distractors.length||spec.distractors.some(d=>!d||d.role!=='distractor'))reject('distractors');
    const ids=[spec.answer.id,...spec.distractors.map(d=>d.id)];
    if(new Set(ids).size!==ids.length)reject('duplicate_choices');
    // Every role independently validates against the same section-specific allowlist.
    const question=await acceptSlot(spec.question);
    const answer=await acceptSlot(spec.answer);
    const distractors=[];for(const slot of spec.distractors)distractors.push(await acceptSlot(slot));
    return freeze({section,question,answer,distractors,mode:section==='words'?'whole-word':'whole-recording'});
  }
  return freeze({section,inventory,acceptSlot,createQuestion,mode:section==='words'?'whole-word':'whole-recording'});
}
