// Sound. Owner: Set C.
// Placeholder: each character "speaks" with a short chirp made in code, at its own pitch.
// TODO Set C: real sound files (free licence, listed in the references), wind, rotor, music.
const PITCH = { lrv: 520, opportunity: 660, viking: 240, ingenuity: 980, pioneer: 180 };

// One shared audio context for the whole game. Browsers only allow sound after the first key
// press or click, so it is created lazily on the first sound.
let ac = null;
function context() {
  ac = ac || new (window.AudioContext || window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

// A short tone: frequency in Hz, start offset and length in seconds.
function tone(freq, at, length, { type = 'triangle', volume = 0.08 } = {}) {
  const c = context();
  const start = c.currentTime + at;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

// Small interface sounds, usable from any UI file without passing audio around:
//   import { sfx } from '../audio/audio.js';  sfx('tick')
const SFX = {
  tick: () => { tone(880, 0, 0.07); tone(1320, 0.06, 0.12); }, // a task on the mission list is done
};

export function sfx(name) {
  try { SFX[name]?.(); } catch (err) { /* sound is never allowed to break the game */ }
}

export function createAudio() {
  return {
    beep(who) {
      try {
        const base = PITCH[who] || 440;
        [1, 1.25, 0.9].forEach((mult, i) => tone(base * mult, i * 0.09, 0.08));
      } catch (err) {
        // Sound is never allowed to break the game.
      }
    },
  };
}
