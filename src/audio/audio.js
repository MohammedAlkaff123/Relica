// Sound. Owner: Set C.
//
//   audio.setWorld('moon')        background for a world: factory | moon | mars | space | null (silence)
//   audio.setWind(0..1)           wind strength on Mars; 1 = the 2018 dust storm
//   audio.play('tick')            a one-shot sound (list in SOUNDS below)
//   audio.loop('rotor', true)     start or stop a looping sound: rotor | hum
//   audio.loopLevel('rotor', 0.5) how hard a loop works (rotor speed, motor load), 0..1
//   audio.music('drive')          a music cue: drive | storm | ending | null to fade out
//   audio.beep(who)               a character's voice: lrv | opportunity | viking | ingenuity | pioneer
//
// Every sound is made in code (Web Audio), so nothing needs a licence and nothing downloads.
// A file in public/audio/<name>.mp3 can later replace any one-shot: see FILES below.
// The Moon has no air, so setWorld('moon') plays nothing from outside: only the rover's own hum and beeps.
// Sound is never allowed to break the game: every public call is wrapped in try/catch.

let ac = null;
let master = null;
function context() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = 0.8;
    const limiter = ac.createDynamicsCompressor();
    master.connect(limiter).connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
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

// ---------- voices ----------

// Each machine speaks in beeps. Viking is low and slow, Ingenuity high and quick.
const VOICES = {
  lrv:         { base: 520, notes: [1, 1.25, 0.9],             gap: 0.09, len: 0.08, type: 'triangle' },
  opportunity: { base: 660, notes: [1, 1.12, 1.33, 1.0],       gap: 0.08, len: 0.07, type: 'triangle' },
  viking:      { base: 190, notes: [1, 0.84, 0.75],            gap: 0.22, len: 0.2,  type: 'sine' },
  ingenuity:   { base: 1100, notes: [1, 1.2, 1.1, 1.4, 1.3],   gap: 0.045, len: 0.04, type: 'square', volume: 0.035 },
  pioneer:     { base: 150, notes: [1, 1.5],                   gap: 0.4,  len: 0.38, type: 'sine', volume: 0.06 },
};

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
    beep: safe((who) => {
      const v = VOICES[who] ?? VOICES.lrv;
      v.notes.forEach((mult, i) => tone(v.base * mult, i * v.gap, v.len, { type: v.type, volume: v.volume ?? 0.08 }));
    }),
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
