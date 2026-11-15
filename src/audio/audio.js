// Sound. Owner: Set C.
//
//   audio.speak(who, text)        a machine says a line in its own Morse "voice" (see VOICES below)
//   audio.beep(who)               a short sample of a voice: lrv | opportunity | viking | ingenuity | pioneer
//   audio.play('tick')            a one-shot sound (list in SOUNDS below)
//   audio.setWorld('moon')        background for a world: factory | moon | mars | space | null (silence)
//   audio.setWind(0..1)           wind strength on Mars; 1 = the 2018 dust storm
//   audio.loop('rotor', true)     start or stop a looping sound: rotor | hum
//   audio.loopLevel('rotor', 0.5) how hard a loop works (rotor speed, motor load), 0..1
//   audio.music('drive')          a music cue: drive | storm | ending | null to fade out
//   audio.setBoost(2)             overall loudness, 1 = normal, up to 4
//   audio.has('strap')            true if the name is a known one-shot or loop (stage.sound stand-ins use it)
//   audio.setVolumes({ master, music, voice, sfx }, muted)   the player's own levels from Settings, 0..1
//   audio.setPaused(true)         pause menus freeze sound; false resumes it
//
// Voices carry emotion: audio.speak(who, text, 'sad'). The machine keeps its signature (its sound,
// speed and register); the mood moves the pitch, the tempo, the loudness and the shape of each note:
//   happy   +2 semitones, 12% faster, notes lift at the end, a small rising chirp after the line
//   curious unchanged (the machine's normal voice), a question still rises
//   sad     -3 semitones, 30% slower, softer, every note sags, a falling sigh after the line
//   sleepy  -2 semitones, 45% slower, much softer, notes sag a little
//   scared  +1 semitone, 20% faster, a fast tremble on every note
//
// Every sound is made in code (Web Audio), so nothing needs a licence and nothing downloads.
// Sound is never allowed to break the game: every public call is wrapped in try/catch.
//
// ---------- the mix ----------
// Every sound goes into one of five buses. Each bus has a level in decibels (dB) that matches its role:
// things the player must notice are loud, things that set the mood sit underneath.
//
//   bus        dB    what goes there                                   why
//   event       0    launch, crash, landing, airbag bounce, breaking   story moments: the loudest things in the game
//   voice      -3    the machines talking (Morse)                      the player must hear who speaks
//   ui         -9    task done, discovery, memory photo, parking       feedback: clear, but under the voices
//   music     -14    drive, storm, ending                              mood: always under the voices
//   ambience  -20    Mars wind, factory room, deep-space drone          background: felt more than heard
//
// The Moon has no air, so setWorld('moon') plays nothing from outside: only the machine's own sounds.
// The plan files (PLAN.md, STORY.md) set the rules above but give no dB numbers; this table is ours.
// The sound test page measures each sound so the levels can be checked.

export const MIX_DB = { event: 0, voice: -3, ui: -9, music: -14, ambience: -20 };
const dbToGain = (db) => Math.pow(10, db / 20);

let ac = null;
let master = null;
let boost = null;
let analyser = null;
let boostLevel = 1.5;
let bus = {};
let user = {};
// The player's levels (Settings). Each bus feeds one of these groups before the master.
const USER_GROUP = { event: 'sfx', ui: 'sfx', ambience: 'sfx', voice: 'voice', music: 'music' };
const levels = { master: 0.8, music: 0.7, voice: 0.9, sfx: 0.85, muted: false };
// A slider position (0..1) to gain: a gentle curve, so the middle of the slider sounds like the middle.
const sliderGain = (v) => (v <= 0 ? 0 : Math.pow(v, 1.6));

// Builds the whole mix on a context (the live one, or an offline one used to measure a sound silently).
// sound -> bus (dB level) -> player group level -> master -> glue (gentle compressor) -> boost -> limiter -> out
function buildChain(c) {
  const m = c.createGain();
  m.gain.value = levels.muted ? 0 : sliderGain(levels.master) / sliderGain(0.8);
  const glue = c.createDynamicsCompressor();
  glue.threshold.value = -14;
  glue.knee.value = 10;
  glue.ratio.value = 2.5;
  glue.attack.value = 0.005;
  glue.release.value = 0.25;
  const b = c.createGain();
  b.gain.value = boostLevel;
  const limiter = c.createDynamicsCompressor();
  limiter.threshold.value = -1.5;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.08;
  const a = c.createAnalyser();
  a.fftSize = 2048;
  m.connect(glue).connect(b).connect(limiter).connect(a).connect(c.destination);
  const u = {};
  for (const g of ['sfx', 'voice', 'music']) {
    u[g] = c.createGain();
    u[g].gain.value = sliderGain(levels[g]) / sliderGain(defaultsFor(g));
    u[g].connect(m);
  }
  const buses = {};
  for (const [name, db] of Object.entries(MIX_DB)) {
    buses[name] = c.createGain();
    buses[name].gain.value = dbToGain(db);
    buses[name].connect(u[USER_GROUP[name]]);
  }
  return { master: m, boost: b, analyser: a, bus: buses, user: u };
}
// The default slider positions are the reference: at the defaults the mix is exactly the dB table above.
const defaultsFor = (g) => ({ sfx: 0.85, voice: 0.9, music: 0.7 })[g];

let measuring = false;
function context() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    ({ master, boost, analyser, bus, user } = buildChain(ac));
  }
  if (!measuring && ac.state === 'suspended' && !paused) ac.resume();
  return ac;
}

function applyLevels() {
  if (!ac || measuring) return;
  const now = ac.currentTime;
  master.gain.setTargetAtTime(levels.muted ? 0 : sliderGain(levels.master) / sliderGain(0.8), now, 0.05);
  for (const g of ['sfx', 'voice', 'music']) user[g].gain.setTargetAtTime(sliderGain(levels[g]) / sliderGain(defaultsFor(g)), now, 0.05);
}

let paused = false;
function setPaused(on) {
  paused = !!on;
  if (!ac || measuring) return;
  if (paused && ac.state === 'running') ac.suspend();
  if (!paused && ac.state === 'suspended') ac.resume();
}

// Renders a sound offline (nothing is heard) and returns its loudness: the RMS of the loudest
// 300 ms, in dB of full scale, through the same mix and boost as the game. The sound test page shows it.
export async function measure(trigger, seconds = 3) {
  const live = { ac, master, boost, analyser, bus, user };
  const saved = { ...levels };
  Object.assign(levels, { master: 0.8, music: 0.7, voice: 0.9, sfx: 0.85, muted: false });
  const off = new OfflineAudioContext(1, Math.ceil(48000 * seconds), 48000);
  measuring = true;
  try {
    ac = off;
    ({ master, boost, analyser, bus, user } = buildChain(off));
    const result = trigger();
    if (result && typeof result.stop === 'function') setTimeout(() => {}, 0);
  } finally {
    ({ ac, master, boost, analyser, bus, user } = live);
    Object.assign(levels, saved);
    measuring = false;
  }
  const buffer = await off.startRendering();
  const d = buffer.getChannelData(0);
  const win = Math.floor(48000 * 0.3);
  let sum = 0, best = 0, peak = 0;
  for (let i = 0; i < d.length; i++) {
    sum += d[i] * d[i];
    if (i >= win) sum -= d[i - win] * d[i - win];
    if (i >= win - 1) best = Math.max(best, sum / win);
    peak = Math.max(peak, Math.abs(d[i]));
  }
  const db = (x) => (x > 0 ? 20 * Math.log10(x) : -120);
  return { rms: Math.round(db(Math.sqrt(best)) * 10) / 10, peak: Math.round(db(peak) * 10) / 10 };
}

// For the sound test page: the waveform of everything that is playing.
export function getAnalyser() { context(); return analyser; }

// Overall loudness: 1 = normal, up to 4.
export function setBoost(level) {
  boostLevel = Math.max(0.2, Math.min(4, Number(level) || 1));
  if (boost) boost.gain.setTargetAtTime(boostLevel, ac.currentTime, 0.05);
}

// ---------- building blocks ----------

// One oscillator note with its own envelope. slide: pitch multiplier reached at the end.
function osc(out, at, freq, len, { type = 'sine', vol = 0.5, slide = 1, attack = 0.005, release = null, detune = 0 } = {}) {
  const c = context();
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.detune.value = detune;
  o.frequency.setValueAtTime(freq, t);
  if (slide !== 1) o.frequency.exponentialRampToValueAtTime(freq * slide, t + len);
  const rel = release ?? Math.min(0.06, len * 0.4);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.max(0.002, Math.min(attack, len / 2)));
  g.gain.setValueAtTime(vol, t + Math.max(attack, len - rel));
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + len + 0.05);
  return o;
}

let noiseBuffer = null;
function noise() {
  const c = context();
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  return src;
}

// Filtered noise with an envelope: thuds, dust, static, clicks, roar.
function hiss(out, at, len, { freq = 400, q = 0.8, vol = 0.5, type = 'lowpass', attack = 0.003, sweepTo = null } = {}) {
  const c = context();
  const t = c.currentTime + at;
  const src = noise();
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + len);
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.max(0.002, attack));
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 1.5);
  src.stop(t + len + 0.05);
}

// A soft saturation curve: makes a tone sound like old electronics.
let crunchCurve = null;
function crunch() {
  if (!crunchCurve) {
    crunchCurve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = (i / 1023) * 2 - 1;
      crunchCurve[i] = Math.tanh(x * 3.5) * 0.9;
    }
  }
  const s = context().createWaveShaper();
  s.curve = crunchCurve;
  s.oversample = '2x';
  return s;
}

// A long, dark reverb (made from decaying noise): the space around Pioneer.
let spaceVerb = null;
function reverb() {
  const c = context();
  if (!spaceVerb) {
    const seconds = 4.5;
    const buf = c.createBuffer(2, c.sampleRate * seconds, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.6);
    }
    spaceVerb = buf;
  }
  const conv = c.createConvolver();
  conv.buffer = spaceVerb;
  return conv;
}

// ---------- voices: the machines talk to each other in Morse code ----------
//
// Real machines talk over radio networks. To keep it simple, every machine here "talks" in Morse code:
// the English text of its line, letter by letter, as dots and dashes. What makes each one recognisable is
// its signature: its speed, its pitch and the kind of sound it makes.
//
//   machine      speed (dot)  pitch           signature
//   ingenuity    35 ms        very high       thin, nervous, fastest of all
//   lrv          55 ms        high, melodic   bright chirps that hop between notes: young and cheerful
//   opportunity  70 ms        middle, steady  a clean radio tone, like a classic Morse operator: patient
//   viking       105 ms       low-middle      an old telegraph: relay clicks, crackle, mains hum, wobbly pitch
//   pioneer      170 ms       very deep       heavy, slow moans that bend in pitch, inside a huge echo
//
// The same text always makes the same sound. A "?" adds a rising tone at the end, a "!" makes it louder.

const MORSE = {
  a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---',
  k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-',
  u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
};
const SCALE = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3];

// Turns text into Morse timing: [{ at, len, letter }], stopping after `cap` seconds.
function morse(text, dot, cap) {
  const out = [];
  let t = 0;
  let letter = 0;
  const words = String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  for (const w of words) {
    for (const ch of w) {
      const m = MORSE[ch];
      if (!m) continue;
      for (const sym of m) {
        const len = sym === '.' ? dot : dot * 3;
        out.push({ at: t, len, letter, ch });
        t += len + dot;
      }
      t += dot * 2;
      letter++;
      if (t > cap) return { notes: out, end: t };
    }
    t += dot * 4;
  }
  return { notes: out, end: t };
}

// How each emotion changes a voice. pitch and tempo are multipliers; slide is how much each note bends
// (above 1 lifts, below 1 sags); tremble is a fast pitch shake in cents; tail is the little phrase after the line.
export const MOODS = {
  curious: { pitch: 1,     tempo: 1,    vol: 1,    slide: 1,    tremble: 0,  tail: null },
  happy:   { pitch: 1.122, tempo: 0.88, vol: 1.1,  slide: 1.05, tremble: 0,  tail: 'rise' },
  sad:     { pitch: 0.841, tempo: 1.3,  vol: 0.7,  slide: 0.93, tremble: 0,  tail: 'fall' },
  sleepy:  { pitch: 0.891, tempo: 1.45, vol: 0.5,  slide: 0.97, tremble: 0,  tail: null },
  scared:  { pitch: 1.059, tempo: 0.8,  vol: 0.92, slide: 1,    tremble: 28, tail: null },
};
const moodOf = (name) => MOODS[name] ?? MOODS.curious;
// A tremble alternates up and down from note to note: scared voices shake.
const shake = (m, i) => (m.tremble ? (i % 2 ? m.tremble : -m.tremble) : 0);

const VOICES = {
  ingenuity: {
    dot: 0.035, cap: 1.8, base: 1650, wave: 'square',
    play(out, notes, loud, end, m) {
      const hp = context().createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 900;
      hp.connect(out);
      notes.forEach((n, i) => {
        const jitter = 1 + ((n.ch.charCodeAt(0) % 5) - 2) * 0.03;
        osc(hp, n.at, 1650 * jitter * m.pitch, n.len, { type: 'square', vol: 0.32 * loud, attack: 0.002, slide: m.slide, detune: shake(m, i) });
      });
    },
  },

  lrv: {
    dot: 0.055, cap: 2.2, base: 820, wave: 'triangle',
    play(out, notes, loud, end, m) {
      notes.forEach((n, i) => {
        const f = 820 * SCALE[n.ch.charCodeAt(0) % SCALE.length] * m.pitch;
        osc(out, n.at, f, n.len, { type: 'triangle', vol: 0.7 * loud, slide: 1.1 * m.slide, attack: 0.004, detune: shake(m, i) });
        osc(out, n.at, f * 2, n.len, { type: 'sine', vol: 0.15 * loud, slide: 1.1 * m.slide, attack: 0.004, detune: shake(m, i) });
      });
    },
  },

  opportunity: {
    dot: 0.07, cap: 2.6, base: 700, wave: 'sine',
    play(out, notes, loud, end, m) {
      notes.forEach((n, i) => {
        osc(out, n.at, 700 * m.pitch, n.len, { type: 'sine', vol: 0.45 * loud, attack: 0.005, slide: m.slide, detune: shake(m, i) });
        osc(out, n.at, 1400 * m.pitch, n.len, { type: 'sine', vol: 0.12 * loud, attack: 0.005, slide: m.slide, detune: shake(m, i) });
      });
    },
  },

  // An old telegraph receiver: a buzzy tone through a narrow, tinny radio filter, slightly overdriven,
  // with a slow wobble in pitch (old parts), a relay click at every symbol, crackle and mains hum under it.
  viking: {
    dot: 0.105, cap: 3.2, base: 440, wave: 'square',
    play(out, notes, loud, end, m) {
      const c = context();
      const radio = c.createBiquadFilter();
      radio.type = 'bandpass';
      radio.frequency.value = 1100;
      radio.Q.value = 1.6;
      const drive = crunch();
      const pre = c.createGain();
      pre.gain.value = 1.8;
      const post = c.createGain();
      post.gain.value = 1.6; // the narrow radio filter takes away a lot of level; give it back
      pre.connect(drive).connect(radio).connect(post).connect(out);
      // Wobble: one slow LFO shared by every note through a constant source.
      const wobble = c.createOscillator();
      const wobbleDepth = c.createGain();
      wobble.frequency.value = 0.9;
      wobbleDepth.gain.value = 9 * m.pitch;
      wobble.connect(wobbleDepth);
      const t0 = c.currentTime;
      wobble.start(t0);
      wobble.stop(t0 + end + 0.5);
      notes.forEach((n, i) => {
        const o = osc(pre, n.at, 440 * m.pitch, n.len, { type: 'square', vol: 0.65 * loud, attack: 0.008, slide: m.slide, detune: shake(m, i) });
        wobbleDepth.connect(o.frequency);
        hiss(out, n.at, 0.012, { type: 'bandpass', freq: 3200, q: 2, vol: 0.5 * loud }); // relay click
      });
      // Mains hum and crackle under the whole message: part of the machine, so the mood leaves them alone.
      osc(out, 0, 60, end + 0.3, { type: 'sawtooth', vol: 0.07, attack: 0.1, release: 0.2 });
      hiss(out, 0, end + 0.3, { type: 'bandpass', freq: 2400, q: 0.7, vol: 0.06, attack: 0.1 });
      for (let i = 0; i < end * 7; i++) {
        hiss(out, (i * 0.137 + (i % 3) * 0.05) % end, 0.006, { type: 'highpass', freq: 2000, vol: 0.25 * loud });
      }
    },
  },

  // Very deep and heavy: layered low tones that bend down and back up (like something huge breathing
  // far away), with a soft attack, under a long dark echo. The harmonics are there so small speakers
  // still carry it; the low layer is felt on headphones.
  pioneer: {
    dot: 0.17, cap: 4, base: 78, wave: 'sine',
    play(out, notes, loud, end, m) {
      const c = context();
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      const verb = reverb();
      const wet = c.createGain();
      wet.gain.value = 0.9;
      const dry = c.createGain();
      dry.gain.value = 0.75;
      lp.connect(dry).connect(out);
      lp.connect(verb).connect(wet).connect(out);
      const f0 = 78 * m.pitch;
      notes.forEach((n, i) => {
        for (const [mult, vol] of [[1, 0.6], [2, 0.32], [3, 0.16], [4, 0.08]]) {
          const o = osc(lp, n.at, f0 * mult, n.len + 0.12, { type: 'sine', vol: vol * loud, attack: 0.06, release: 0.12, detune: shake(m, i) });
          const t = c.currentTime + n.at;
          o.frequency.setValueAtTime(f0 * mult, t);
          o.frequency.exponentialRampToValueAtTime(f0 * mult * 0.86, t + (n.len + 0.12) * 0.5);
          o.frequency.exponentialRampToValueAtTime(f0 * mult * 0.97 * m.slide, t + n.len + 0.12);
        }
      });
      osc(lp, 0, 39 * m.pitch, end + 0.6, { type: 'sine', vol: 0.35 * loud, attack: 0.3, release: 0.5 }); // sub layer
    },
  },
};

// A short sample line per machine, for audio.beep(who) and the sound test page.
export const VOICE_SAMPLES = {
  lrv: 'Wheels! I have wheels!',
  opportunity: 'Then let us see everything.',
  viking: 'Who is driving around up there?',
  ingenuity: 'Follow me. I can see the way.',
  pioneer: 'I hear you.',
};

// Starts a line. Returns { duration, stop() } so the dialogue can cut it when the player skips ahead.
function speak(who, text, emotion) {
  const c = context();
  const v = VOICES[who] ?? VOICES.opportunity;
  const m = moodOf(emotion);
  const out = c.createGain();
  out.connect(bus.voice);
  const line = text || VOICE_SAMPLES[who] || 'hello';
  const loud = (/!/.test(line) ? 1.2 : 1) * m.vol;
  const dot = v.dot * m.tempo;
  const { notes, end } = morse(line, dot, v.cap * Math.max(1, m.tempo * 0.9));
  v.play(out, notes, loud, end, m);
  let duration = end;
  const f = v.base * m.pitch;
  const tailVol = (who === 'viking' ? 0.25 : who === 'pioneer' ? 0.35 : 0.45) * loud;
  if (/\?\s*$/.test(line)) {
    // A question rises at the end, in the machine's own register.
    osc(out, duration, f, dot * 4, { type: v.wave, vol: tailVol, slide: 1.35, attack: 0.01 });
    duration += dot * 4 + 0.1;
  } else if (m.tail === 'rise') {
    // Happy: two quick notes going up, a little skip of joy.
    osc(out, duration, f * 1.26, dot * 1.6, { type: v.wave, vol: tailVol * 0.8, slide: 1.06, attack: 0.004 });
    osc(out, duration + dot * 2, f * 1.5, dot * 2.2, { type: v.wave, vol: tailVol * 0.8, slide: 1.08, attack: 0.004 });
    duration += dot * 4.4 + 0.1;
  } else if (m.tail === 'fall') {
    // Sad: one long note that sinks, like a sigh.
    osc(out, duration + dot, f * 0.94, dot * 7, { type: v.wave, vol: tailVol * 0.7, slide: 0.7, attack: 0.03, release: dot * 4 });
    duration += dot * 8 + 0.1;
  }
  if (who === 'pioneer') duration += 1.2; // the echo keeps going
  let stopped = false;
  return {
    duration,
    stop() {
      if (stopped) return;
      stopped = true;
      out.gain.setTargetAtTime(0, c.currentTime, 0.04);
      setTimeout(() => out.disconnect(), 400);
    },
  };
}

// ---------- one-shot sounds ----------
// Each one is built to sound like what it means, and they are made different on purpose:
//   tick      task done         two bright bell notes going up (a "ding-ding" of success)
//   discover  discovery card    a fast sparkling run upward with a soft shimmer (an "aha")
//   memory    memory photo      a camera shutter (click-clack) and a warm low chord
//   park      neat parking      two identical short beeps, like a car's parking sensor
//   land      landing thud      a heavy low drop with a puff of dust
//   bounce    airbag bounce     a rubbery "boing" that wobbles in pitch, with a soft thump
//   crack     something breaks  a sharp snap with a metallic ping
//   crash     hard crash        a big hit, metal rattling, then a low rumble
//   rumble    launch            a long roar that builds, with crackle and a deep shake (about 6 s)
//   powerdown machine stops     electronics winding down, a falling whine, then a last click
//   static    radio static      a burst of radio noise before a call

// Per-sound trim in dB inside its bus, set by measuring each sound on the sound test page so that
// sounds of the same role land at the same loudness (RMS, with boost 1.5):
//   events about -10 dB (launch about -8), voices about -10, interface about -17, music about -24,
//   Mars wind about -32 (the storm about -18).
const TRIM_DB = { land: 8, crack: 5, crash: 7, static: 9, discover: 5, powerdown: -7, bounce: 0, tick: 0, memory: 1, park: -1, rumble: 0 };
function trim(busName, name) {
  const g = context().createGain();
  g.gain.value = dbToGain(TRIM_DB[name] ?? 0);
  g.connect(bus[busName]);
  return g;
}

function bell(out, at, f, vol) {
  osc(out, at, f, 0.9, { type: 'sine', vol, attack: 0.003, release: 0.85 });
  osc(out, at, f * 2.76, 0.4, { type: 'sine', vol: vol * 0.25, attack: 0.003, release: 0.38 });
  osc(out, at, f * 5.4, 0.15, { type: 'sine', vol: vol * 0.1, attack: 0.002, release: 0.14 });
}

const SOUNDS = {
  tick: () => { const o = trim('ui', 'tick'); bell(o, 0, 1046, 0.55); bell(o, 0.11, 1568, 0.55); },
  discover: () => {
    const o = trim('ui', 'tick');
    [784, 988, 1175, 1568, 1976].forEach((f, i) => osc(o, i * 0.05, f, 0.32, { type: 'triangle', vol: 0.35, attack: 0.003, release: 0.28 }));
    osc(o, 0.2, 2637, 0.9, { type: 'sine', vol: 0.12, attack: 0.15, release: 0.6 });
    osc(o, 0.2, 1318, 0.9, { type: 'sine', vol: 0.18, attack: 0.15, release: 0.6 });
  },
  memory: () => {
    const o = trim('ui', 'memory');
    hiss(o, 0, 0.025, { type: 'highpass', freq: 1800, vol: 0.9 });
    hiss(o, 0.09, 0.04, { type: 'bandpass', freq: 1200, q: 1.5, vol: 0.8 });
    [262, 330, 392].forEach((f) => osc(o, 0.16, f, 1.1, { type: 'sine', vol: 0.22, attack: 0.08, release: 0.8 }));
  },
  park: () => { const o = trim('ui', 'park'); osc(o, 0, 1320, 0.09, { type: 'square', vol: 0.3 }); osc(o, 0.16, 1320, 0.09, { type: 'square', vol: 0.3 }); },
  land: () => {
    const o = trim('event', 'park');
    const t = osc(o, 0, 140, 0.45, { type: 'sine', vol: 0.9, slide: 0.3, attack: 0.003, release: 0.35 });
    osc(o, 0, 280, 0.2, { type: 'triangle', vol: 0.35, slide: 0.3, attack: 0.003 });
    hiss(o, 0, 0.5, { type: 'lowpass', freq: 900, vol: 0.5, sweepTo: 200 });
    return t;
  },
  bounce: () => {
    const o = trim('event', 'bounce');
    const b = osc(o, 0, 220, 0.5, { type: 'sine', vol: 0.75, attack: 0.003, release: 0.4 });
    const t = context().currentTime;
    b.frequency.setValueAtTime(220, t);
    b.frequency.exponentialRampToValueAtTime(110, t + 0.08);
    b.frequency.exponentialRampToValueAtTime(260, t + 0.22);
    b.frequency.exponentialRampToValueAtTime(150, t + 0.5);
    hiss(o, 0, 0.18, { type: 'lowpass', freq: 500, vol: 0.6 });
  },
  crack: () => {
    const o = trim('event', 'crack');
    hiss(o, 0, 0.06, { type: 'highpass', freq: 2500, vol: 1 });
    osc(o, 0, 2350, 0.5, { type: 'sine', vol: 0.3, attack: 0.001, release: 0.45 });
    osc(o, 0, 3710, 0.35, { type: 'sine', vol: 0.2, attack: 0.001, release: 0.3 });
    osc(o, 0.01, 180, 0.12, { type: 'square', vol: 0.25, slide: 0.5 });
  },
  crash: () => {
    const o = trim('event', 'crash');
    osc(o, 0, 120, 0.6, { type: 'sine', vol: 1, slide: 0.35, attack: 0.002, release: 0.5 });
    hiss(o, 0, 0.9, { type: 'lowpass', freq: 2200, vol: 0.9, sweepTo: 250 });
    [1830, 2710, 3390, 4420, 2150].forEach((f, i) => osc(o, 0.02 + i * 0.045, f, 0.4, { type: 'sine', vol: 0.18, attack: 0.001, release: 0.38 }));
    hiss(o, 0.25, 1.6, { type: 'lowpass', freq: 220, vol: 0.5, attack: 0.1 });
  },
  rumble: () => {
    const o = trim('event', 'rumble');
    const c = context();
    const t = c.currentTime;
    // Roar: noise that opens up and grows for 4 s, then holds.
    const src = noise();
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(200, t);
    f.frequency.exponentialRampToValueAtTime(1600, t + 4);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.0, t + 4);
    g.gain.setValueAtTime(1.0, t + 5.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 6.5);
    src.connect(f).connect(g).connect(o);
    src.start(t);
    src.stop(t + 6.6);
    // Deep shake under it, and crackle on top.
    osc(o, 0, 55, 6.4, { type: 'sawtooth', vol: 0.5, slide: 0.75, attack: 2.5, release: 1 });
    osc(o, 0, 41, 6.4, { type: 'sine', vol: 0.7, attack: 2, release: 1 });
    for (let i = 0; i < 70; i++) hiss(o, 1 + (i * 0.073) % 5, 0.02, { type: 'bandpass', freq: 1500 + (i % 7) * 300, q: 1, vol: 0.35 });
  },
  powerdown: () => {
    const o = trim('event', 'powerdown');
    const c = context();
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3000, c.currentTime);
    lp.frequency.exponentialRampToValueAtTime(120, c.currentTime + 1.6);
    lp.connect(o);
    osc(lp, 0, 880, 1.6, { type: 'sawtooth', vol: 0.45, slide: 0.12, attack: 0.01, release: 0.5 });
    osc(lp, 0, 1320, 1.2, { type: 'sine', vol: 0.2, slide: 0.15, attack: 0.01 });
    hiss(o, 1.62, 0.02, { type: 'bandpass', freq: 1800, q: 2, vol: 0.6 });
  },
  static: () => {
    const o = trim('event', 'static');
    hiss(o, 0, 0.9, { type: 'bandpass', freq: 2600, q: 0.5, vol: 0.4, attack: 0.02 });
    for (let i = 0; i < 9; i++) hiss(o, i * 0.09 + (i % 2) * 0.03, 0.01, { type: 'highpass', freq: 2500, vol: 0.6 });
  },
};

// ---------- the sounds from Ziad's handoff (SOUND_HANDOFF.md) ----------
// Each one follows the description in the handoff. Bus and trim put it at the loudness of its role:
//   interface feedback (marker_beep, strap, panels_clean, battery_low, time_skip, mark, shutter)  ~ -17 dB
//   story events (liftoff, drift_warning, rotor_twitch, fold)                                    ~ -10 dB
// marker_beep repeats many times while driving blind, so it sits a little under the others (~ -20 dB).
Object.assign(SOUNDS, {
  // A short clean beacon ping. Soft edges so a long run of them does not tire the ear.
  marker_beep: () => {
    const o = trim('ui', 'marker_beep');
    osc(o, 0, 1568, 0.11, { type: 'sine', vol: 0.5, attack: 0.006, release: 0.08 });
    osc(o, 0, 3136, 0.06, { type: 'sine', vol: 0.08, attack: 0.004, release: 0.05 });
  },
  // A strap pulled tight: three ratchet clicks, then a soft thump as the box settles.
  strap: () => {
    const o = trim('ui', 'strap');
    for (let i = 0; i < 3; i++) {
      hiss(o, i * 0.07, 0.018, { type: 'bandpass', freq: 2600 - i * 200, q: 3, vol: 0.9 });
      osc(o, i * 0.07, 900 - i * 60, 0.03, { type: 'square', vol: 0.12 });
    }
    osc(o, 0.24, 120, 0.22, { type: 'sine', vol: 0.75, slide: 0.6, attack: 0.003, release: 0.18 });
    hiss(o, 0.24, 0.16, { type: 'lowpass', freq: 600, vol: 0.4 });
  },
  // The Lunar Module ascent stage lifts off. No air on the Moon: no roar in the sky, only what reaches
  // the rover through the ground. A deep thump, a low muffled rumble that fades as the stage rises.
  liftoff: () => {
    const o = trim('event', 'liftoff');
    const c = context();
    const t = c.currentTime;
    osc(o, 0, 70, 0.5, { type: 'sine', vol: 1, slide: 0.5, attack: 0.002, release: 0.4 });
    hiss(o, 0, 0.25, { type: 'lowpass', freq: 400, vol: 0.8 });
    const src = noise();
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(260, t);
    f.frequency.exponentialRampToValueAtTime(90, t + 3.5);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
    src.connect(f).connect(g).connect(o);
    src.start(t);
    src.stop(t + 3.7);
    osc(o, 0.05, 44, 3.4, { type: 'sine', vol: 0.8, slide: 0.8, attack: 0.1, release: 2.5 });
  },
  // A whirlwind sweeps the panels: a whoosh, then a rising "power back" tone.
  panels_clean: () => {
    const o = trim('ui', 'panels_clean');
    hiss(o, 0, 0.7, { type: 'bandpass', freq: 400, q: 1.2, vol: 0.7, attack: 0.15, sweepTo: 2600 });
    [523, 659, 784, 1046].forEach((fr, i) => osc(o, 0.45 + i * 0.07, fr, 0.35, { type: 'triangle', vol: 0.32, attack: 0.01, release: 0.25 }));
    osc(o, 0.45, 262, 0.6, { type: 'sine', vol: 0.25, slide: 2, attack: 0.05, release: 0.3 });
  },
  // A gentle warning: two notes going down. Not an alarm.
  battery_low: () => {
    const o = trim('ui', 'battery_low');
    osc(o, 0, 880, 0.22, { type: 'triangle', vol: 0.45, attack: 0.01, release: 0.12 });
    osc(o, 0.26, 659, 0.34, { type: 'triangle', vol: 0.45, attack: 0.01, release: 0.25 });
  },
  // Time races: a soft whoosh with a clock ticking faster and faster.
  time_skip: () => {
    const o = trim('ui', 'time_skip');
    hiss(o, 0, 1.3, { type: 'bandpass', freq: 300, q: 0.8, vol: 0.45, attack: 0.4, sweepTo: 1800 });
    let at = 0;
    for (let i = 0; i < 14; i++) {
      hiss(o, at, 0.012, { type: 'bandpass', freq: i % 2 ? 3400 : 2600, q: 4, vol: 0.7 });
      at += Math.max(0.035, 0.16 * Math.pow(0.82, i));
    }
  },
  // A danger marked from the air: a confirm ping like dropping a pin.
  mark: () => {
    const o = trim('ui', 'mark');
    osc(o, 0, 1318, 0.12, { type: 'sine', vol: 0.45, attack: 0.003, release: 0.1 });
    osc(o, 0.09, 1976, 0.4, { type: 'sine', vol: 0.42, attack: 0.003, release: 0.35 });
    hiss(o, 0, 0.03, { type: 'lowpass', freq: 900, vol: 0.35 });
  },
  // Flight 72: the drift begins. Two tones that rub against each other and a slow wobble: uneasy, quiet.
  drift_warning: () => {
    const o = trim('event', 'drift_warning');
    const a = osc(o, 0, 392, 1.6, { type: 'sine', vol: 0.4, attack: 0.25, release: 0.7 });
    osc(o, 0, 404, 1.6, { type: 'sine', vol: 0.35, attack: 0.25, release: 0.7 });
    const c = context();
    const t = c.currentTime;
    a.frequency.setValueAtTime(392, t);
    a.frequency.linearRampToValueAtTime(380, t + 0.6);
    a.frequency.linearRampToValueAtTime(398, t + 1.1);
    a.frequency.linearRampToValueAtTime(370, t + 1.6);
  },
  // After the crash: the broken rotor tries to spin, then gives up. Weak, short, sad.
  rotor_twitch: () => {
    const o = trim('event', 'rotor_twitch');
    const c = context();
    const t = c.currentTime;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    lp.connect(o);
    const m = osc(lp, 0, 22, 0.55, { type: 'sawtooth', vol: 0.6, attack: 0.02, release: 0.3 });
    m.frequency.setValueAtTime(22, t);
    m.frequency.exponentialRampToValueAtTime(58, t + 0.2);
    m.frequency.exponentialRampToValueAtTime(14, t + 0.55);
    hiss(o, 0, 0.02, { type: 'bandpass', freq: 1500, q: 2, vol: 0.4 });
    hiss(o, 0.12, 0.25, { type: 'bandpass', freq: 500, q: 1, vol: 0.18, attack: 0.05 });
  },
  // The workers fold the rover: a small servo whine and four metal joints clicking into place.
  fold: () => {
    const o = trim('event', 'fold');
    osc(o, 0, 340, 1.1, { type: 'sawtooth', vol: 0.06, slide: 1.4, attack: 0.1, release: 0.2 });
    [0.15, 0.42, 0.66, 1.05].forEach((at, i) => {
      hiss(o, at, 0.03, { type: 'bandpass', freq: 1900 + i * 150, q: 2.5, vol: 0.9 });
      for (const [fr, v] of [[620 + i * 40, 0.25], [1710 + i * 70, 0.12], [2960, 0.06]]) {
        osc(o, at, fr, 0.28, { type: 'sine', vol: v, attack: 0.001, release: 0.26 });
      }
      osc(o, at, 110, 0.12, { type: 'sine', vol: 0.4, slide: 0.6, attack: 0.002 });
    });
  },
  // A camera shutter: a sharp click, a short mechanical whir, the second blade.
  shutter: () => {
    const o = trim('ui', 'shutter');
    hiss(o, 0, 0.02, { type: 'highpass', freq: 2200, vol: 1 });
    hiss(o, 0.025, 0.07, { type: 'bandpass', freq: 3800, q: 1.5, vol: 0.25 });
    hiss(o, 0.1, 0.035, { type: 'bandpass', freq: 1300, q: 1.8, vol: 0.85 });
    osc(o, 0.1, 160, 0.06, { type: 'sine', vol: 0.3, slide: 0.7 });
  },
});
Object.assign(TRIM_DB, {
  // Measured on the sound test page (silent offline render, RMS of the loudest 300 ms, boost 1.5).
  // Short sounds read lower on a 300 ms window, so clicks and pings aim a few dB under the longer ones.
  marker_beep: 12, strap: -1, liftoff: -12, panels_clean: -3, battery_low: 1, time_skip: 14,
  mark: 2, drift_warning: -14, rotor_twitch: -6, fold: -1, shutter: 7,
});

// ---------- loops: world background, wind, hum, rotor ----------

const loops = {};
const LOOP_BUS = { wind: 'ambience', room: 'ambience', drone: 'ambience', hum: 'event', rotor: 'event', dust_spray: 'event', whirlwind: 'ambience' };
// Level of each loop inside its bus (0..1).
const LOOP_LEVEL = { wind: 0.9, room: 0.5, drone: 0.7, hum: 0.12, rotor: 0.25, dust_spray: 0.2, whirlwind: 2.5 };

const LOOP_BUILDERS = {
  // Moon, from the fender break to the repair: dry grit spraying off the wheel. No air, so it is soft:
  // a fine hiss with an uneven grainy flutter, as if felt through the rover's body.
  dust_spray: (c, out) => {
    const src = noise();
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 3200;
    f.Q.value = 0.9;
    const grain = c.createGain();
    grain.gain.value = 0.6;
    const flutter = c.createOscillator();
    flutter.type = 'square';
    flutter.frequency.value = 17;
    const depth = c.createGain();
    depth.gain.value = 0.35;
    flutter.connect(depth).connect(grain.gain);
    src.connect(f).connect(grain).connect(out);
    src.start(); flutter.start();
    return {};
  },
  // Mars dust devils: a swirling wind that rises and falls. loopLevel sets how close the nearest one is.
  whirlwind: (c, out) => {
    const src = noise();
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 550;
    f.Q.value = 1.4;
    const sweep = c.createOscillator();
    const sweepDepth = c.createGain();
    sweep.frequency.value = 0.35;
    sweepDepth.gain.value = 320;
    sweep.connect(sweepDepth).connect(f.frequency);
    const swirl = c.createGain();
    swirl.gain.value = 0.7;
    const swirlLfo = c.createOscillator();
    const swirlDepth = c.createGain();
    swirlLfo.frequency.value = 0.9;
    swirlDepth.gain.value = 0.3;
    swirlLfo.connect(swirlDepth).connect(swirl.gain);
    const near = c.createGain();
    near.gain.value = 0;
    src.connect(f).connect(swirl).connect(near).connect(out);
    src.start(); sweep.start(); swirlLfo.start();
    return { near };
  },
  // Thin Mars wind: band-passed noise that slowly breathes. The storm makes it louder and lower.
  wind: (c, out) => {
    const src = noise();
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 0.7;
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = 0.13;
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(filter.frequency);
    src.connect(filter).connect(out);
    src.start(); lfo.start();
    return { filter };
  },
  // Soft electric room tone for the factory.
  room: (c, out) => {
    const o = c.createOscillator();
    o.frequency.value = 120;
    const src = noise();
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 400;
    const g = c.createGain();
    g.gain.value = 0.6;
    o.connect(out);
    src.connect(f).connect(g).connect(out);
    o.start(); src.start();
    return {};
  },
  // Very faint, very low drone for deep space.
  drone: (c, out) => {
    const a = c.createOscillator();
    const b = c.createOscillator();
    a.frequency.value = 110;
    b.frequency.value = 110.6;
    a.connect(out); b.connect(out);
    a.start(); b.start();
    return {};
  },
  // The machine's own motor hum. loopLevel raises its pitch with the load.
  hum: (c, out) => {
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 90;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 600;
    o.connect(f).connect(out);
    o.start();
    return { osc: o, base: 90, range: 110 };
  },
  // Rotor buzz for Ingenuity.
  rotor: (c, out) => {
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 40;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1200;
    o.connect(f).connect(out);
    o.start();
    return { osc: o, base: 30, range: 80 };
  },
};

function setLoop(name, on, level = LOOP_LEVEL[name]) {
  if (!LOOP_BUILDERS[name]) return;
  const c = context();
  if (!loops[name]) {
    if (!on) return;
    const gain = c.createGain();
    gain.gain.value = 0;
    gain.connect(bus[LOOP_BUS[name]]);
    loops[name] = { gain, ...LOOP_BUILDERS[name](c, gain), on: false };
  }
  const l = loops[name];
  l.on = on;
  l.gain.gain.cancelScheduledValues(c.currentTime);
  l.gain.gain.setTargetAtTime(on ? level : 0, c.currentTime, on ? 0.4 : 0.6);
}

// What each world plays in the background.
const WORLD_BED = {
  factory: ['room'],
  moon: [],          // no air: no outside sound at all
  mars: ['wind'],
  space: ['drone'],
};

// ---------- music cues ----------
// Short generated pieces. Each is a slow chord loop with a simple melody on top.

const MUSIC = {
  drive:  { bpm: 104, chords: [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]], melody: [659, 784, 880, 784, 659, 587, 523, 587], wave: 'triangle' },
  storm:  { bpm: 60,  chords: [[146.8, 174.6, 220], [130.8, 155.6, 196]], melody: [440, null, 415, null, 392, null, 349, null], wave: 'sine' },
  ending: { bpm: 72,  chords: [[261.6, 329.6, 392], [196, 246.9, 293.7], [220, 261.6, 329.6], [174.6, 220, 261.6]], melody: [523, 587, 659, null, 784, 659, 587, null], wave: 'sine' },
};

let musicTimer = null;
let musicGain = null;

function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  if (musicGain) {
    const g = musicGain;
    g.gain.setTargetAtTime(0, context().currentTime, 0.8);
    setTimeout(() => g.disconnect(), 4000);
    musicGain = null;
  }
}

function startMusic(name) {
  const cue = MUSIC[name];
  if (!cue) return;
  const c = context();
  stopMusic();
  musicGain = c.createGain();
  musicGain.gain.value = 0;
  musicGain.gain.setTargetAtTime(1, c.currentTime, 1.2);
  musicGain.connect(bus.music);
  const out = musicGain;
  const beat = 60 / cue.bpm;
  let step = 0;
  const playStep = () => {
    if (paused) return; // a suspended context would bunch the notes up and play them all at once on resume
    const chord = cue.chords[Math.floor(step / 4) % cue.chords.length];
    if (step % 4 === 0) chord.forEach((f) => osc(out, 0, f, beat * 4, { type: 'sine', vol: 0.18, attack: 0.3, release: 0.8 }));
    const note = cue.melody[step % cue.melody.length];
    if (note) osc(out, 0, note, beat * 0.9, { type: cue.wave, vol: 0.3, attack: 0.02, release: 0.3 });
    step++;
  };
  playStep();
  musicTimer = setInterval(playStep, beat * 1000);
}

// ---------- public ----------

function safe(fn) {
  // Sound never breaks the game: a failure is only a warning in the console.
  return (...args) => { try { return fn(...args); } catch (err) { console.warn('sound:', err); } };
}

// For interface files that do not receive `audio`: import { sfx } from '../audio/audio.js'
export const sfx = safe((name) => { context(); SOUNDS[name]?.(); });

let windLevel = 0;

// The player's levels from Settings, 0..1 each, and a mute switch. Saved by src/ui/prefs.js.
export const setVolumes = safe((volume = {}, muted = false) => {
  for (const k of ['master', 'music', 'voice', 'sfx']) {
    if (typeof volume[k] === 'number' && Number.isFinite(volume[k])) levels[k] = Math.max(0, Math.min(1, volume[k]));
  }
  levels.muted = !!muted;
  applyLevels();
});

export const hasSound = (name) => name in SOUNDS || name in LOOP_BUILDERS;
export const SOUND_NAMES = () => Object.keys(SOUNDS);
export const LOOP_NAMES = () => Object.keys(LOOP_BUILDERS);
export const LOOP_INFO = { bus: LOOP_BUS, level: LOOP_LEVEL };
export const TRIMS = TRIM_DB;

// For the sound test page: measure a one-shot, a voice line or a loop without playing it aloud.
export const measureSound = (name) => measure(() => SOUNDS[name]?.(), name === 'liftoff' || name === 'rumble' ? 7 : 3);
export const measureVoice = (who, text, emotion) => measure(() => speak(who, text || VOICE_SAMPLES[who], emotion), 6);
export function measureLoop(name, level = 1) {
  return measure(() => {
    const c = context();
    const gain = c.createGain();
    gain.gain.value = LOOP_LEVEL[name] ?? 0.5;
    gain.connect(bus[LOOP_BUS[name] ?? 'event']);
    const l = LOOP_BUILDERS[name](c, gain);
    if (l.near) l.near.gain.value = level;
    if (l.osc) l.osc.frequency.value = l.base + level * l.range;
  }, 2);
}

export function createAudio() {
  return {
    play: sfx,
    has: hasSound,
    setVolumes,
    setPaused: safe(setPaused),
    speak: (who, text, emotion) => {
      try { return speak(who, text, emotion); } catch (err) { console.warn('sound:', err); return { duration: 0, stop() {} }; }
    },
    beep: safe((who) => { speak(who, VOICE_SAMPLES[who] ?? 'hello'); }),
    setBoost: safe(setBoost),
    setWorld: safe((name) => {
      const want = new Set(WORLD_BED[name] ?? []);
      for (const n of ['wind', 'room', 'drone']) setLoop(n, want.has(n));
      if (name !== 'mars') windLevel = 0;
    }),
    setWind: safe((level) => {
      windLevel = Math.max(0, Math.min(1, level));
      const l = loops.wind;
      if (!l || !l.on) return;
      const c = context();
      // The storm pushes the wind from the background up to about the level of the voices (x7, about +17 dB).
      l.gain.gain.setTargetAtTime(LOOP_LEVEL.wind * (1 + windLevel * 6), c.currentTime, 0.5);
      l.filter.frequency.setTargetAtTime(500 - windLevel * 250, c.currentTime, 0.5);
    }),
    loop: safe((name, on) => setLoop(name, !!on)),
    loopLevel: safe((name, level) => {
      const l = loops[name];
      if (!l) return;
      const v = Math.max(0, Math.min(1, level));
      if (l.near) l.near.gain.setTargetAtTime(v, context().currentTime, 0.25); // whirlwind: distance sets loudness
      if (l.osc) l.osc.frequency.setTargetAtTime(l.base + v * l.range, context().currentTime, 0.1);
    }),
    music: safe((name) => (name ? startMusic(name) : stopMusic())),
    stopAll: safe(() => {
      for (const n of Object.keys(loops)) setLoop(n, false);
      stopMusic();
    }),
  };
}
