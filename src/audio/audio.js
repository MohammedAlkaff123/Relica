// Sound. Owner: Set C.
//
//   audio.setWorld('moon')        background for a world: factory | moon | mars | space | null (silence)
//   audio.setWind(0..1)           wind strength on Mars; 1 = the 2018 dust storm
//   audio.play('tick')            a one-shot sound (list in SOUNDS below)
//   audio.loop('rotor', true)     start or stop a looping sound: rotor | hum
//   audio.loopLevel('rotor', 0.5) how hard a loop works (rotor speed, motor load), 0..1
//   audio.music('drive')          a music cue: drive | storm | ending | null to fade out
//   audio.speak(who, text)        a machine says a line in its own voice (see "voices" below)
//   audio.beep(who)               a short sample of a voice: lrv | opportunity | viking | ingenuity | pioneer
//   audio.setBoost(2)             overall loudness, 1 = normal, up to 4
//
// Every sound is made in code (Web Audio), so nothing needs a licence and nothing downloads.
// A file in public/audio/<name>.mp3 can later replace any one-shot: see FILES below.
// The Moon has no air, so setWorld('moon') plays nothing from outside: only the rover's own hum and beeps.
// Sound is never allowed to break the game: every public call is wrapped in try/catch.

// The signal chain, in order:
//   every sound -> master (gain) -> glue (gentle compressor) -> boost (gain) -> limiter -> analyser -> speakers
// The old chain used a compressor on its default settings (ratio 12), which squashed everything back down
// and made the game too quiet. Now the compressor is gentle, and a limiter at the end only stops clipping.
// boost: 1 = normal, up to 4 for quiet speakers. audio.setBoost(2) or the slider on the sound test page.
let ac = null;
let master = null;
let boost = null;
let analyser = null;
let boostLevel = 1.5;
function context() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = 1.6;
    const glue = ac.createDynamicsCompressor();
    glue.threshold.value = -18;
    glue.knee.value = 12;
    glue.ratio.value = 3;
    glue.attack.value = 0.005;
    glue.release.value = 0.2;
    boost = ac.createGain();
    boost.gain.value = boostLevel;
    const limiter = ac.createDynamicsCompressor();
    limiter.threshold.value = -2;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.1;
    analyser = ac.createAnalyser();
    analyser.fftSize = 2048;
    master.connect(glue).connect(boost).connect(limiter).connect(analyser).connect(ac.destination);
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

function tone(freq, at, length, { type = 'triangle', volume = 0.08, to = null, out = null } = {}) {
  const c = context();
  const start = c.currentTime + at;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + length);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.02, length / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(out ?? master);
  osc.start(start);
  osc.stop(start + length + 0.05);
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

// A burst of filtered noise: thuds, dust, rumble.
function burst(at, length, { freq = 400, q = 0.8, volume = 0.3, type = 'lowpass' } = {}) {
  const c = context();
  const start = c.currentTime + at;
  const src = noise();
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  src.connect(filter).connect(gain).connect(master);
  src.start(start);
  src.stop(start + length + 0.05);
}

// ---------- voices: each machine "speaks" its line in its own sound ----------
//
// audio.speak(who, text) turns the words of a line into a burst of sound. The same text always gives the
// same sound, and a longer line gives a longer burst. Each machine has its own recipe, so a player can tell
// who is talking with eyes closed:
//
//   lrv          Moon rover. Bright, bouncy chirps that slide upward, one per syllable. Happy and quick.
//   opportunity  Mars rover. Real Morse code of the English line: steady dots and dashes on one clean tone.
//   viking       The old lander. Low, slow, buzzy hums with a shaky vibrato, each falling at the end, plus radio crackle.
//   ingenuity    The helicopter. Very fast, very high blips, like a nervous little bird.
//   pioneer      The far probe. A few long, soft, gliding tones with an echo, as if from very far away.
//
// A "?" makes the last sound rise, a "!" makes the line louder. The English text is used, because each
// letter maps to a fixed sound (and Morse needs Latin letters). The pitch range and rhythm of each machine
// are far apart on purpose: high/fast (Ingenuity), mid/bouncy (LRV), mid/steady (Opportunity),
// low/slow (Viking), long/echoing (Pioneer).

const MORSE = {
  a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---',
  k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-',
  u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
};
// Musical steps (a pentatonic scale), so every voice sounds pleasant whatever the letters are.
const SCALE = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];

function words(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}
// Rough syllables: groups of vowels. "everything" -> 3.
function syllables(word) {
  return Math.max(1, (word.match(/[aeiouy]+/g) || []).length);
}
const code = (s, i) => s.charCodeAt(i % s.length) || 97;

// One voice note: an oscillator with its own envelope, an optional pitch slide and vibrato.
function note(out, at, freq, len, { type = 'triangle', vol = 0.3, slide = 1, vibrato = 0, vibratoRate = 6, attack = 0.01 } = {}) {
  const c = context();
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide !== 1) osc.frequency.exponentialRampToValueAtTime(freq * slide, t + len);
  if (vibrato) {
    const lfo = c.createOscillator();
    const depth = c.createGain();
    lfo.frequency.value = vibratoRate;
    depth.gain.value = vibrato;
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + len + 0.05);
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(attack, len / 3));
  g.gain.setValueAtTime(vol, t + len * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + len + 0.05);
}

// Each recipe schedules its notes into `out` and returns how long the line lasts, in seconds.
const VOICE_RECIPES = {
  // Moon rover: one upward chirp per syllable, hopping around the scale.
  lrv(out, text, loud) {
    let t = 0;
    const base = 560;
    for (const w of words(text).slice(0, 10)) {
      for (let s = 0; s < Math.min(3, syllables(w)); s++) {
        const step = SCALE[code(w, s * 3) % SCALE.length];
        note(out, t, base * step, 0.085, { type: 'triangle', vol: 0.32 * loud, slide: 1.18 });
        t += 0.11;
      }
      t += 0.07;
    }
    return t;
  },

  // Mars rover: the English line in real Morse code. Dot 70 ms, dash 3 dots.
  opportunity(out, text, loud) {
    const dot = 0.065;
    let t = 0;
    for (const w of words(text)) {
      for (const ch of w) {
        const m = MORSE[ch];
        if (!m) continue;
        for (const sym of m) {
          const len = sym === '.' ? dot : dot * 3;
          note(out, t, 740, len, { type: 'sine', vol: 0.4 * loud, attack: 0.004 });
          note(out, t, 1480, len, { type: 'sine', vol: 0.08 * loud, attack: 0.004 }); // a little brightness
          t += len + dot;
        }
        t += dot * 2;
        if (t > 2.6) return t; // keep lines short: about the first 2.6 seconds of Morse is enough
      }
      t += dot * 4;
    }
    return t;
  },

  // Old Viking: slow, low buzz, shaky (vibrato), each hum falling at the end, with radio crackle at the start.
  viking(out, text, loud) {
    const c = context();
    burst(0, 0.18, { freq: 2600, type: 'bandpass', q: 0.8, volume: 0.12 * loud });
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;
    filter.connect(out);
    let t = 0.12;
    const all = words(text);
    let n = 0;
    for (const w of all) {
      const step = [1, 9 / 8, 4 / 5, 1][code(w, 0) % 4];
      note(filter, t, 165 * step, 0.26, { type: 'sawtooth', vol: 0.3 * loud, slide: 0.88, vibrato: 7, vibratoRate: 5 });
      t += 0.33;
      if (++n >= 7) break;
    }
    return t;
  },

  // Ingenuity: rapid high square blips, one per letter, nervous and quick.
  ingenuity(out, text, loud) {
    let t = 0;
    const letters = words(text).join('').slice(0, 26);
    for (let i = 0; i < letters.length; i++) {
      const step = SCALE[code(letters, i) % SCALE.length];
      note(out, t, 1150 * step, 0.035, { type: 'square', vol: 0.22 * loud, attack: 0.002 });
      t += 0.05 + ((code(letters, i) % 3) * 0.01);
    }
    return t;
  },

  // Pioneer: a few long gliding tones, soft attack, echoing as if from far away.
  pioneer(out, text, loud) {
    const c = context();
    const delay = c.createDelay(1);
    delay.delayTime.value = 0.28;
    const feedback = c.createGain();
    feedback.gain.value = 0.4;
    delay.connect(feedback).connect(delay);
    delay.connect(out);
    const dry = c.createGain();
    dry.connect(out);
    dry.connect(delay);
    let t = 0;
    for (const w of words(text).slice(0, 4)) {
      const step = SCALE[code(w, 1) % 4];
      note(dry, t, 330 * step, 0.5, { type: 'sine', vol: 0.4 * loud, slide: 1.12, attack: 0.12 });
      note(dry, t, 660 * step, 0.5, { type: 'sine', vol: 0.08 * loud, slide: 1.12, attack: 0.12 });
      t += 0.6;
    }
    return t + 0.6; // room for the echo to fade
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
  const recipe = VOICE_RECIPES[who] ?? VOICE_RECIPES.lrv;
  const out = c.createGain();
  out.connect(master);
  const loud = /!/.test(text) ? 1.25 : 1;
  let duration = recipe(out, text || VOICE_SAMPLES[who] || 'hello', loud);
  // A question rises at the end: one extra rising note in the machine's own register.
  if (/\?\s*$/.test(text)) {
    const end = { lrv: 700, opportunity: 740, viking: 190, ingenuity: 1500, pioneer: 400 }[who] ?? 600;
    const type = { opportunity: 'sine', viking: 'sawtooth', ingenuity: 'square', pioneer: 'sine' }[who] ?? 'triangle';
    note(out, duration, end, 0.16, { type, vol: (who === 'ingenuity' ? 0.22 : 0.3) * loud, slide: 1.35 });
    duration += 0.2;
  }
  let stopped = false;
  return {
    duration,
    stop() {
      if (stopped) return;
      stopped = true;
      const now = c.currentTime;
      out.gain.setTargetAtTime(0, now, 0.03);
      setTimeout(() => out.disconnect(), 300);
    },
  };
}

// ---------- one-shot sounds ----------

const SOUNDS = {
  tick:    () => { tone(880, 0, 0.07); tone(1320, 0.06, 0.12); },                       // a mission task is done
  discover:() => { [660, 880, 1100].forEach((f, i) => tone(f, i * 0.08, 0.25, { type: 'sine', volume: 0.06 })); }, // discovery card
  memory:  () => { tone(523, 0, 0.5, { type: 'sine', volume: 0.06 }); tone(784, 0.12, 0.6, { type: 'sine', volume: 0.05 }); }, // memory photo
  park:    () => { tone(700, 0, 0.08); tone(1050, 0.1, 0.16); },                       // a neat park at a stop
  land:    () => { burst(0, 0.35, { freq: 180, volume: 0.35 }); },                       // landing thud (inside the machine, so also on the Moon)
  bounce:  () => { burst(0, 0.25, { freq: 260, volume: 0.3 }); tone(90, 0, 0.2, { type: 'sine', volume: 0.12 }); }, // airbag bounce
  crack:   () => { burst(0, 0.12, { freq: 2500, type: 'bandpass', q: 2, volume: 0.35 }); tone(300, 0, 0.15, { type: 'square', to: 120, volume: 0.05 }); }, // fender or blade breaks
  crash:   () => { burst(0, 0.6, { freq: 220, volume: 0.45 }); burst(0.02, 0.2, { freq: 1800, type: 'bandpass', volume: 0.2 }); },
  rumble:  () => { burst(0, 6, { freq: 90, volume: 0.5 }); },                            // launch
  powerdown: () => { tone(600, 0, 1.4, { type: 'sine', to: 80, volume: 0.07 }); },       // the end of a machine
  static:  () => { burst(0, 0.8, { freq: 3000, type: 'bandpass', q: 0.6, volume: 0.08 }); }, // radio before the Viking call
};

// Replace a one-shot with a real file by adding it here: name -> path. Missing files fall back to the code sound.
const FILES = {};
const fileCache = {};
async function playFile(name) {
  const c = context();
  if (!fileCache[name]) {
    fileCache[name] = fetch(FILES[name]).then((r) => r.arrayBuffer()).then((b) => c.decodeAudioData(b));
  }
  const src = c.createBufferSource();
  src.buffer = await fileCache[name];
  src.connect(master);
  src.start();
}

// ---------- loops: world background, wind, hum, rotor ----------

const loops = {};

function makeLoop(build) {
  const c = context();
  const gain = c.createGain();
  gain.gain.value = 0;
  gain.connect(master);
  const parts = build(c, gain);
  return { gain, ...parts, on: false };
}

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
    o.type = 'sine';
    o.frequency.value = 60;
    const src = noise();
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 300;
    const g = c.createGain();
    g.gain.value = 0.25;
    o.connect(out);
    src.connect(f).connect(g).connect(out);
    o.start(); src.start();
    return {};
  },
  // Very faint, very low drone for deep space.
  drone: (c, out) => {
    const a = c.createOscillator();
    const b = c.createOscillator();
    a.type = b.type = 'sine';
    a.frequency.value = 55;
    b.frequency.value = 55.4;
    a.connect(out); b.connect(out);
    a.start(); b.start();
    return {};
  },
  // The machine's own motor hum. loopLevel raises its pitch with the load.
  hum: (c, out) => {
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 70;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 400;
    o.connect(f).connect(out);
    o.start();
    return { osc: o, base: 70, range: 90 };
  },
  // Rotor buzz for Ingenuity: a fast pulsing tone.
  rotor: (c, out) => {
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 40;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    o.connect(f).connect(out);
    o.start();
    return { osc: o, base: 30, range: 70 };
  },
};

const LOOP_VOLUME = { wind: 0.12, room: 0.03, drone: 0.03, hum: 0.04, rotor: 0.07 };

function setLoop(name, on, volume = LOOP_VOLUME[name]) {
  if (!LOOP_BUILDERS[name]) return;
  if (!loops[name]) {
    if (!on) return;
    loops[name] = makeLoop(LOOP_BUILDERS[name]);
  }
  const l = loops[name];
  const c = context();
  l.on = on;
  l.gain.gain.cancelScheduledValues(c.currentTime);
  l.gain.gain.setTargetAtTime(on ? volume : 0, c.currentTime, on ? 0.4 : 0.6);
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
  musicGain.connect(master);
  const out = musicGain;
  const beat = 60 / cue.bpm;
  let step = 0;
  const playStep = () => {
    const chord = cue.chords[Math.floor(step / 4) % cue.chords.length];
    if (step % 4 === 0) chord.forEach((f) => tone(f, 0, beat * 4, { type: 'sine', volume: 0.025, out }));
    const note = cue.melody[step % cue.melody.length];
    if (note) tone(note, 0, beat * 0.9, { type: cue.wave, volume: 0.03, out });
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
export const sfx = safe((name) => {
  if (FILES[name]) playFile(name).catch(() => SOUNDS[name]?.());
  else SOUNDS[name]?.();
});

export function createAudio() {
  return {
    play: sfx,
    // A machine says a line: audio.speak('viking', 'Who is driving around up there?') -> { duration, stop() }
    speak: (who, text) => {
      try { return speak(who, text); } catch (err) { console.warn('sound:', err); return { duration: 0, stop() {} }; }
    },
    // Short voice sample, kept for older code: the machine's sample line.
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
      l.gain.gain.setTargetAtTime(LOOP_VOLUME.wind * (1 + windLevel * 3), c.currentTime, 0.5);
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

let windLevel = 0;
