/* =========================================================================
   🏁 سباق الحروف بالفتحة — مضيف التطبيق (وحدة مستقلة)
   -------------------------------------------------------------------------
   - يستعمل محرك السباق الأصلي (rr3CreateEngine من script.js) دون نسخه أو تعديل منطقه.
   - الصوت: التسجيلات المعتمدة الأصلية فقط، تُحمَّل من مساراتها في قائمة السماح
     وتُتحقَّق ببصمة SHA-256 قبل التشغيل. لا TTS ولا بديل صوتيًا عند الفشل.
   - الحالة في الذاكرة فقط: لا يقرأ ولا يكتب بيانات الطلاب أو النجوم أو التقدم.
   - النجوم المجموعة داخل اللعبة للتشجيع فقط (لا تُضاف إلى رصيد الطالب).
   - المدخل: بطاقة «سباق الحروف بالفتحة» في قسم الألعاب → الشاشة #readingLettersRace.
   ========================================================================= */
import { createReadingBank } from '../reading-race-data/reading-banks.mjs';
import { drawReadingCar, drawInactiveGate } from './reading-painters.js';
import { createReadingDrive, createStarSound } from './reading-drive.js';

const SCREEN = 'readingLettersRace';
const ROUNDS = 5;
const LANES = [-2 / 3, 0, 2 / 3];
const IDLE = 'اختر حرفًا واحدًا للتدرب عليه طوال السباق.';

const ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);
const family = t => {
  for (const g of ['بتثني', 'جحخ', 'دذرز', 'سش', 'صض', 'طظ', 'عغ', 'فق', 'اأإآل', 'ه ةو', 'كم']) if (g.includes(t[0])) return g;
  return t[0];
};
const el = (tag, attrs = {}, kids = []) => {
  const n = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'text') n.textContent = attrs[k];
    else if (k === 'class') n.className = attrs[k];
    else n.setAttribute(k, attrs[k]);
  }
  kids.forEach(c => n.appendChild(c));
  return n;
};

/* ألوان الحلبة المعتمدة: نسخة مستقلة من المظهر؛ لا تعديل على RR3_THEMES ولا RR3_CAR_COLORS العامة */
function readingTheme() {
  try {
    return Object.assign({}, RR3_THEMES[9], {
      sky: ['#638eaf', '#b2d4e3', '#edf4ed'],
      grass: ['#638b7a', '#6e9481'],
      road: ['#353f4c', '#3c4653'],
      rumble: ['#73b2aa', '#e9ece3'],
      fog: [205, 225, 225]
    });
  } catch (e) { return null; }
}

/* ------------------------------------------------------------------ الحالة */
const G = {
  built: false, bank: null, inventory: [], selected: null,
  started: false, finished: false, preparing: false,
  phase: 'pending', collected: 0, active: 0, score: 0,
  choices: [], dim: [false, false, false], moving: false, playing: false,
  status: IDLE,
  engine: null, audio: null, urls: [], frame: 0, dead: true,
  sound: '', autoRound: -1, epoch: 0, session: [], token: 0,
  playback: Promise.resolve(), confirmation: Promise.resolve(), confirmedRound: -1,
  endPlay: null, drive: null, chime: null, ui: {}
};

/* ------------------------------------------------------------------ تحميل الصوت */
async function loadBytes(path) {
  const url = new URL(path, document.baseURI).href;      /* بالنسبة إلى قاعدة التطبيق لا إلى مجلد الوحدة */
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error('http_' + res.status);
  return await res.arrayBuffer();
}

/* ------------------------------------------------------------------ الصوت */
function stopAudio() {
  G.epoch++;
  try { G.audio && G.audio.pause(); } catch (e) { /* لا شيء */ }
  if (G.endPlay) G.endPlay();
  G.endPlay = null;
  try { G.chime && G.chime.stop(); } catch (e) { /* لا شيء */ }
  G.playing = false;
  paint();
}
function replay() {
  stopAudio();
  const token = G.epoch;
  if (!G.sound) return Promise.resolve();
  const a = new Audio(G.sound);
  G.audio = a;
  const playDone = new Promise(resolve => {
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      if (G.audio === a) { G.playing = false; paint(); }
      if (G.endPlay === end) G.endPlay = null;
      resolve();
    };
    G.endPlay = end;
    a.onended = end;
    a.onerror = () => { setStatus('اضغط «اسمع الحرف» لإعادة المحاولة.'); end(); };
    try { G.chime && G.chime.stop(); } catch (e) { /* لا شيء */ }
    a.play().then(() => {
      if (token !== G.epoch) { a.pause(); end(); return; }
      G.playing = true; paint();
    }).catch(() => { setStatus('اضغط «اسمع الحرف» لإعادة المحاولة.'); end(); });
  });
  G.playback = playDone;
  return playDone;
}

/* ------------------------------------------------------------------ إنهاء الجلسة */
function teardown() {
  G.token++; G.epoch++;
  G.dead = true;
  cancelAnimationFrame(G.frame);
  try { G.engine && G.engine.destroy(); } catch (e) { /* لا شيء */ }
  G.engine = null;
  try { G.audio && G.audio.pause(); } catch (e) { /* لا شيء */ }
  if (G.endPlay) G.endPlay();
  G.endPlay = null;
  try { G.chime && G.chime.dispose(); } catch (e) { /* لا شيء */ }
  G.chime = null; G.drive = null;
  G.urls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) { /* لا شيء */ } });
  G.urls = []; G.session = []; G.sound = '';
  G.started = false; G.finished = false; G.preparing = false; G.moving = false; G.playing = false;
  G.phase = 'pending'; G.collected = 0; G.active = 0; G.score = 0;
  G.status = IDLE;
  if (G.ui.stage) G.ui.stage.innerHTML = '';
  if (G.built) paint();
}
window.__readingRaceTeardown = teardown;

/* ------------------------------------------------------------------ بدء السباق */
async function start() {
  if (!G.selected || G.preparing || !G.bank) return;
  G.preparing = true; paint();
  /* أنهِ أي جلسة سابقة (نفس الحرف أو غيره) قبل بناء الجديدة */
  G.token++; G.epoch++;
  G.dead = true; cancelAnimationFrame(G.frame);
  try { G.engine && G.engine.destroy(); } catch (e) { /* لا شيء */ }
  G.engine = null;
  stopAudio();
  G.urls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) { /* لا شيء */ } });
  G.urls = [];
  const myToken = G.token;
  G.confirmation = Promise.resolve(); G.confirmedRound = -1; G.autoRound = -1;
  G.chime = G.chime || createStarSound();
  G.chime.unlock();
  G.collected = 0; G.phase = 'pending';

  const selected = G.selected;
  const pool = G.inventory.filter(x => family(x.text) !== family(selected.text));
  const session = [];
  try {
    const shift = Math.floor(Math.random() * 3);
    for (let i = 0; i < ROUNDS; i++) {
      const ds = [pool[(i * 3) % pool.length], pool[(i * 3 + 7) % pool.length]];
      const slot = (r, role) => ({ id: r.id, path: r.path, sha256: r.sha256, role });
      const q = await G.bank.createQuestion({
        question: slot(selected, 'question'),
        answer: slot(selected, 'answer'),
        distractors: ds.map(r => slot(r, 'distractor'))
      });
      if (G.token !== myToken) return;                   /* غادر الطفل أثناء التحقق */
      const all = [q.answer, ...q.distractors];
      const k = (i + shift) % 3;
      const ordered = all.slice(k).concat(all.slice(0, k));
      const url = URL.createObjectURL(q.question.audio);
      G.urls.push(url);
      session.push({ id: selected.id, text: selected.text, options: ordered.map(o => ({ id: o.id, text: o.text })), url });
    }
  } catch (e) {
    if (G.token !== myToken) return;
    G.preparing = false;
    G.status = 'تعذر التحقق من أصوات الجلسة. لم يبدأ السباق.';
    paint();
    return;
  }
  if (G.token !== myToken) return;
  if (typeof rr3CreateEngine !== 'function') {
    G.preparing = false; G.status = 'محرك السباق غير متاح.'; paint(); return;
  }

  const autoPlay = round => {
    if (G.autoRound === round) return;
    G.autoRound = round;
    void G.confirmation.then(async () => {
      if (G.audio && !G.audio.paused) { await G.playback; await new Promise(r => setTimeout(r, 240)); }
      if (G.token !== myToken || G.dead) return;
      G.sound = session[round].url;
      return replay();
    });
  };
  const confirm = (round, done) => {
    if (G.confirmedRound === round) { void G.confirmation.then(() => done && done()); return; }
    G.confirmedRound = round;
    G.sound = session[round].url;
    G.confirmation = replay().then(() => new Promise(r => setTimeout(r, 240)));
    void G.confirmation.then(() => { if (G.token === myToken && !G.dead) done && done(); });
  };

  G.dead = false;
  G.session = session;
  G.sound = session[0].url;
  G.started = true; G.finished = false; G.active = 0; G.score = 0;
  G.dim = [false, false, false]; G.choices = session[0].options; G.moving = false;
  G.status = 'اسمع الحرف، ثم اختر بوابة لتبدأ الحركة.';
  G.preparing = false;
  paint();

  G.drive = createReadingDrive({
    onPhase: p => {
      G.phase = p; G.moving = false;
      G.status = p === 'stars' ? 'تذكّر الصوت، وقُد السيارة لجمع النجوم. النجوم للتشجيع فقط.' : 'وصلت إلى البوابات. اختر الحرف الذي سمعته.';
      paint();
    },
    onCount: n => { G.collected = n; paint(); },
    onCollect: () => { if (!G.audio || G.audio.paused) G.chime && G.chime.play(); }
  });

  const eng = rr3CreateEngine({
    root: G.ui.stage, standalone: true, letter: '', stageTitle: '',
    rounds: session.map(r => ({
      correctShape: r.text,
      options: r.options.map(o => o.text),
      correctIndex: r.options.findIndex(o => o.id === r.id)
    })),
    readingCarPainter: (...args) => { drawReadingCar(...args); G.drive && G.drive.paintCarEffect(args[0], args[1], args[2], args[3]); },
    readingInactiveGatePainter: drawInactiveGate,
    readingAfterUpdate: (s, dt) => G.drive && G.drive.before(s, dt),
    readingRoadPainter: (...args) => G.drive && G.drive.paint(...args),
    readingTheme: readingTheme(),
    theme: 9, track: 'calm', layout: 'gate', mode: 'step', reduced: true, collision: 0,
    promptText: 'TARGET', phrases: ['أحسنت'],
    hooks: {
      say: (text, done) => {
        const idx = Math.min(G.engine ? G.engine.state.roundIdx : 0, ROUNDS - 1);
        if (Array.isArray(text) && text[0] === 'TARGET') { confirm(idx, done); return; }
        if (text === 'TARGET') autoPlay(idx);
        done && done();
      },
      stars: () => '',
      alive: () => !G.dead,
      error: () => { G.status = 'توقفت اللعبة بأمان. اختر الحرف من جديد.'; paint(); },
      finish: () => {
        void G.confirmation.then(() => {
          if (G.token !== myToken || G.dead) return;
          G.finished = true; G.moving = false; G.score = ROUNDS;
          G.status = 'أحسنت! أكملت السباق على الحرف ' + selected.text + '.';
          paint();
        });
        return { title: 'أحسنت!', body: '', next: '', onNext: () => {} };
      }
    }
  });
  G.engine = eng;
  eng.start();
  eng.state.paused = false;
  autoPlay(0);

  let seen = 0, wrongSeen = 0, signature = '';
  const monitor = () => {
    if (G.dead || G.token !== myToken) return;
    const s = eng.state;
    const idx = Math.min(s.roundIdx, ROUNDS - 1), r = eng.cfg.rounds[idx];
    if (s.roundIdx !== seen && s.roundIdx < ROUNDS) {
      seen = s.roundIdx; wrongSeen = 0;
      G.sound = session[seen].url;
      G.phase = 'pending'; G.active = seen; G.choices = session[seen].options; G.dim = [false, false, false];
      G.status = 'جولة جديدة على الحرف نفسه. اسمع ثم اختر.';
      paint();
      autoPlay(seen);
    }
    if (s.gate && s.gate.r === s.roundIdx && r) {
      const sig = r.dim.join(',') + s.busy + s.chosen;
      if (sig !== signature) { signature = sig; G.dim = [...r.dim]; G.moving = !!s.busy || !!s.chosen; paint(); }
      if (r.wrong > wrongSeen) {
        wrongSeen = r.wrong;
        G.status = wrongSeen === 1 ? 'حاول مرة أخرى. أخفينا البوابة غير المطابقة.' : 'بقيت البوابة المطابقة. اسمع الحرف ثم اخترها.';
        paint();
      }
      if (s.gate.good) { G.status = 'أحسنت! اجتزت البوابة.'; paint(); }
    }
    const sc = Math.min(s.roundIdx, ROUNDS);
    if (sc !== G.score) { G.score = sc; paint(); }
    G.frame = requestAnimationFrame(monitor);
  };
  G.frame = requestAnimationFrame(monitor);
}

/* ------------------------------------------------------------------ تحكم الطالب */
function steer(lane) {
  const e = G.engine;
  if (!e || G.phase !== 'stars') return;
  e.state.laneIdx = lane; e.state.targetX = LANES[lane];
}
function pick(lane) {
  const e = G.engine;
  if (!e || G.finished || G.dim[lane] || e.state.busy || e.state.chosen) return;
  stopAudio();
  const s = e.state;
  s.laneIdx = lane; s.targetX = LANES[lane];
  s.chosen = true; s.paused = false;
  G.moving = true; G.status = 'سيارتك تتجه إلى البوابة التي اخترتها.';
  paint();
}
function setStatus(t) { G.status = t; paint(); }

/* ------------------------------------------------------------------ الواجهة */
function build() {
  const wrap = document.getElementById('rlrWrap');
  if (!wrap || G.built) return;
  const u = G.ui;

  u.back = el('button', { type: 'button', class: 'rlr-back', 'data-a': 'back', 'aria-label': 'العودة للألعاب', text: '⬅️ العودة للألعاب' });
  u.back.addEventListener('click', () => {
    if (G.started || G.preparing) { teardown(); return; }      /* داخل السباق: اختيار حرف آخر */
    teardown(); showScreen('games');
  });
  u.listen = el('button', { type: 'button', class: 'rlr-sec rlr-listen', text: '🔊 اسمع الحرف' });
  u.listen.addEventListener('click', () => { void replay(); });
  const bar = el('div', { class: 'rlr-bar' }, [u.back, el('span', { class: 'rlr-title', text: '🏁 سباق الحروف بالفتحة' }), u.listen]);

  /* اختيار الحرف */
  u.picker = el('div', { class: 'rlr-pick' });
  u.pickerLetters = el('div', { class: 'rlr-letters', role: 'group', 'aria-label': 'اختر حرف التدريب' });
  u.startBtn = el('button', { type: 'button', class: 'rlr-go', text: 'اختر حرفًا أولًا' });
  u.startBtn.addEventListener('click', () => { void start(); });
  u.pickStatus = el('p', { class: 'rlr-note', role: 'status' });
  u.picker.append(
    el('h2', { class: 'rlr-h', text: 'اختر حرف السباق' }),
    el('p', { class: 'rlr-p', text: 'اختر الحرف الذي تريد التدرب عليه. سيبقى هو الحرف المطلوب في الجولات الخمس، وتتغير الحروف الأخرى ومواقع البوابات.' }),
    u.pickerLetters, u.startBtn, u.pickStatus);

  /* اللعب */
  u.game = el('div', { class: 'rlr-game' });
  u.progress = el('span');
  u.stats = el('div', { class: 'rlr-stats' });
  u.stage = el('div', { class: 'rlr-stage', 'aria-label': 'مضمار السباق وبوابات الحروف' });
  u.feedback = el('p', { class: 'rlr-feedback', role: 'status', 'aria-live': 'polite' });
  u.finishBox = el('div', { class: 'rlr-finish' });
  u.finishText = el('p', { class: 'rlr-star-finish' });
  u.again = el('button', { type: 'button', class: 'rlr-go', text: 'سباق جديد' });
  u.again.addEventListener('click', () => { void start(); });
  u.finishBox.append(u.finishText, u.again);
  u.steering = el('div', { class: 'rlr-steer', role: 'group', 'aria-label': 'توجيه السيارة لجمع النجوم' });
  ['يسار', 'وسط', 'يمين'].forEach((label, i) => {
    const b = el('button', { type: 'button', text: ['←', '↑', '→'][i] + ' ' + label });
    b.addEventListener('click', () => steer(i));
    u.steering.appendChild(b);
  });
  u.wait = el('p', { class: 'rlr-wait', text: 'استعد للجولة التالية' });
  u.choicesBox = el('div', { class: 'rlr-choices', role: 'group', 'aria-label': 'بوابات الحروف من اليسار إلى اليمين' });
  u.choiceBtns = [0, 1, 2].map(i => {
    const b = el('button', { type: 'button', class: 'rlr-choice', 'data-lane': String(i) });
    b.addEventListener('click', () => pick(i));
    u.choicesBox.appendChild(b);
    return b;
  });
  u.game.append(
    el('div', { class: 'rlr-progress' }, [u.progress]),
    u.stats, u.stage, u.feedback, u.finishBox, u.steering, u.wait, u.choicesBox);

  wrap.append(bar, u.picker, u.game);
  G.built = true;
}

function paint() {
  if (!G.built) return;
  const u = G.ui;
  /* العودة: داخل السباق = اختيار حرف آخر */
  const inRace = G.started || G.preparing;
  u.back.textContent = inRace ? '⬅️ اختيار حرف آخر' : '⬅️ العودة للألعاب';
  u.back.setAttribute('aria-label', inRace ? 'اختيار حرف آخر' : 'العودة للألعاب');
  u.picker.hidden = G.started;
  u.listen.hidden = !G.started;
  u.game.hidden = !G.started;
  if (!G.started) {
    [...u.pickerLetters.children].forEach(b => {
      const on = G.selected && G.selected.id === b.dataset.letter;
      b.classList.toggle('rlr-on', !!on);
      b.setAttribute('aria-pressed', String(!!on));
    });
    u.startBtn.disabled = !G.bank || !G.selected || G.preparing;
    u.startBtn.textContent = G.preparing ? 'نتحقق من الجلسة…' : (G.selected ? 'ابدأ سباق ' + G.selected.text : 'اختر حرفًا أولًا');
    u.pickStatus.textContent = G.status;
    return;
  }
  u.listen.hidden = false;
  u.listen.disabled = G.finished;
  u.listen.textContent = G.playing ? '🔊 اسمع مجددًا' : '🔊 اسمع الحرف';
  u.progress.style.width = (G.score / ROUNDS * 100) + '%';
  u.stats.textContent = '';
  u.stats.append('الجولة ' + ar(Math.min(G.active + 1, ROUNDS)) + ' من ' + ar(ROUNDS) + ' ');
  const sc = el('span', { class: 'rlr-star-count', 'aria-label': 'النجوم ' + ar(G.collected) + ' من ' + ar(15), text: '★ ' + ar(G.collected) + ' من ' + ar(15) });
  u.stats.appendChild(sc);
  u.feedback.textContent = G.status;
  u.finishBox.hidden = !G.finished;
  if (G.finished) {
    u.finishText.textContent = '★ أحسنت! جمعت ' + ar(G.collected) + ' من ' + ar(15) + ' نجمة';
    u.again.textContent = 'سباق جديد للحرف ' + (G.selected ? G.selected.text : '');
  }
  u.steering.hidden = G.finished || G.phase !== 'stars';
  u.wait.hidden = G.finished || G.phase !== 'pending';
  u.choicesBox.hidden = G.finished || (G.phase !== 'gates');
  G.choices.forEach((c, i) => {
    const b = u.choiceBtns[i];
    if (!b) return;
    b.dataset.id = c.id;
    b.textContent = G.dim[i] ? '×' : c.text;
    b.disabled = G.moving || !!G.dim[i];
    b.setAttribute('aria-label', G.dim[i] ? 'بوابة مستبعدة' : 'اختر بوابة ' + c.text);
  });
}

function renderLetters() {
  const u = G.ui;
  u.pickerLetters.textContent = '';
  G.inventory.forEach(r => {
    const b = el('button', { type: 'button', class: 'rlr-letter', 'data-letter': r.id, 'aria-pressed': 'false', text: r.text });
    b.addEventListener('click', () => { G.selected = r; paint(); });
    u.pickerLetters.appendChild(b);
  });
}

function open() {
  build();
  teardown();
  try {
    if (!G.bank) {
      G.bank = createReadingBank('letters', { loadBytes });
      G.inventory = G.bank.inventory;
    }
    G.status = IDLE;
  } catch (e) {
    G.status = 'تعذر التحقق. لن يُستخدم صوت بديل.';
  }
  if (G.ui.pickerLetters && !G.ui.pickerLetters.children.length) renderLetters();
  showScreen(SCREEN);
  paint();
}
window.openReadingLettersRace = open;

/* مدخل البطاقة (بلا onclick داخل index.html كي تبقى الوحدة مستقلة) */
document.addEventListener('click', ev => {
  const t = ev.target && ev.target.closest && ev.target.closest('#openReadingLettersRace');
  if (t) { ev.preventDefault(); open(); }
});

/* مغادرة الصفحة أو إخفاؤها: لا صوت يبقى */
window.addEventListener('pagehide', teardown);
