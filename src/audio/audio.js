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
const bus = {};

// The signal chain: sound -> bus (dB level) -> master -> glue (gentle compressor) -> boost -> limiter -> speakers
function context() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = 1;
    const glue = ac.createDynamicsCompressor();
    glue.threshold.value = -14;
    glue.knee.value = 10;
    glue.ratio.value = 2.5;
    glue.attack.value = 0.005;
    glue.release.value = 0.25;
    boost = ac.createGain();
    boost.gain.value = boostLevel;
    const limiter = ac.createDynamicsCompressor();
    limiter.threshold.value = -1.5;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.08;
    analyser = ac.createAnalyser();
    analyser.fftSize = 2048;
    master.connect(glue).connect(boost).connect(limiter).connect(analyser).connect(ac.destination);
    for (const [name, db] of Object.entries(MIX_DB)) {
      bus[name] = ac.createGain();
      bus[name].gain.value = dbToGain(db);
      bus[name].connect(master);
    }
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
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

const VOICES = {
  ingenuity: {
    dot: 0.035, cap: 1.8,
    play(out, notes, loud) {
      const hp = context().createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 900;
      hp.connect(out);
      for (const n of notes) {
        const jitter = 1 + ((n.ch.charCodeAt(0) % 5) - 2) * 0.03;
        osc(hp, n.at, 1650 * jitter, n.len, { type: 'square', vol: 0.32 * loud, attack: 0.002 });
      }
    },
  },

  lrv: {
    dot: 0.055, cap: 2.2,
    play(out, notes, loud) {
      for (const n of notes) {
        const f = 820 * SCALE[n.ch.charCodeAt(0) % SCALE.length];
        osc(out, n.at, f, n.len, { type: 'triangle', vol: 0.7 * loud, slide: 1.1, attack: 0.004 });
        osc(out, n.at, f * 2, n.len, { type: 'sine', vol: 0.15 * loud, slide: 1.1, attack: 0.004 });
      }
    },
  },

  opportunity: {
    dot: 0.07, cap: 2.6,
    play(out, notes, loud) {
      for (const n of notes) {
        osc(out, n.at, 700, n.len, { type: 'sine', vol: 0.45 * loud, attack: 0.005 });
        osc(out, n.at, 1400, n.len, { type: 'sine', vol: 0.12 * loud, attack: 0.005 });
      }
    },
  },

  // An old telegraph receiver: a buzzy tone through a narrow, tinny radio filter, slightly overdriven,
  // with a slow wobble in pitch (old parts), a relay click at every symbol, crackle and mains hum under it.
  viking: {
    dot: 0.105, cap: 3.2,
    play(out, notes, loud, end) {
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
      wobbleDepth.gain.value = 9;
      wobble.connect(wobbleDepth);
      const t0 = c.currentTime;
      wobble.start(t0);
      wobble.stop(t0 + end + 0.5);
      for (const n of notes) {
        const o = osc(pre, n.at, 440, n.len, { type: 'square', vol: 0.65 * loud, attack: 0.008 });
        wobbleDepth.connect(o.frequency);
        hiss(out, n.at, 0.012, { type: 'bandpass', freq: 3200, q: 2, vol: 0.5 * loud }); // relay click
      }
      // Mains hum and crackle under the whole message.
      osc(out, 0, 60, end + 0.3, { type: 'sawtooth', vol: 0.07 * loud, attack: 0.1, release: 0.2 });
      hiss(out, 0, end + 0.3, { type: 'bandpass', freq: 2400, q: 0.7, vol: 0.06 * loud, attack: 0.1 });
      for (let i = 0; i < end * 7; i++) {
        hiss(out, (i * 0.137 + (i % 3) * 0.05) % end, 0.006, { type: 'highpass', freq: 2000, vol: 0.25 * loud });
      }
    },
  },

  // Very deep and heavy: layered low tones that bend down and back up (like something huge breathing
  // far away), with a soft attack, under a long dark echo. The harmonics are there so small speakers
  // still carry it; the low layer is felt on headphones.
  pioneer: {
    dot: 0.17, cap: 4,
    play(out, notes, loud, end) {
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
      for (const n of notes) {
        for (const [mult, vol] of [[1, 0.6], [2, 0.32], [3, 0.16], [4, 0.08]]) {
          const o = osc(lp, n.at, 78 * mult, n.len + 0.12, { type: 'sine', vol: vol * loud, attack: 0.06, release: 0.12 });
          const t = c.currentTime + n.at;
          o.frequency.setValueAtTime(78 * mult, t);
          o.frequency.exponentialRampToValueAtTime(78 * mult * 0.86, t + (n.len + 0.12) * 0.5);
          o.frequency.exponentialRampToValueAtTime(78 * mult * 0.97, t + n.len + 0.12);
        }
      }
      osc(lp, 0, 39, end + 0.6, { type: 'sine', vol: 0.35 * loud, attack: 0.3, release: 0.5 }); // sub layer
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
function speak(who, text) {
  const c = context();
  const v = VOICES[who] ?? VOICES.opportunity;
  const out = c.createGain();
  out.connect(bus.voice);
  const line = text || VOICE_SAMPLES[who] || 'hello';
  const loud = /!/.test(line) ? 1.2 : 1;
  const { notes, end } = morse(line, v.dot, v.cap);
  v.play(out, notes, loud, end);
  let duration = end;
  // A question rises at the end, in the machine's own register.
  if (/\?\s*$/.test(line)) {
    const f = { ingenuity: 1650, lrv: 820, opportunity: 700, viking: 440, pioneer: 78 }[who] ?? 700;
    const type = { ingenuity: 'square', lrv: 'triangle', viking: 'square' }[who] ?? 'sine';
    const target = who === 'viking' ? out : out;
    osc(target, end, f, v.dot * 4, { type, vol: (who === 'viking' ? 0.25 : 0.5) * loud, slide: 1.35, attack: 0.01 });
    duration += v.dot * 4 + 0.1;
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

// ---------- loops: world background, wind, hum, rotor ----------

const loops = {};
const LOOP_BUS = { wind: 'ambience', room: 'ambience', drone: 'ambience', hum: 'event', rotor: 'event' };
// Level of each loop inside its bus (0..1).
const LOOP_LEVEL = { wind: 0.9, room: 0.5, drone: 0.7, hum: 0.12, rotor: 0.25 };

const LOOP_BUILDERS = {
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

export function createAudio() {
  return {
    play: sfx,
    speak: (who, text) => {
      try { return speak(who, text); } catch (err) { console.warn('sound:', err); return { duration: 0, stop() {} }; }
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
      if (!l || !l.osc) return;
      const v = Math.max(0, Math.min(1, level));
      l.osc.frequency.setTargetAtTime(l.base + v * l.range, context().currentTime, 0.1);
    }),
    music: safe((name) => (name ? startMusic(name) : stopMusic())),
    stopAll: safe(() => {
      for (const n of Object.keys(loops)) setLoop(n, false);
      stopMusic();
    }),
  };
}
