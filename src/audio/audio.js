// Sound. Owner: Set C.
// Placeholder: each character "speaks" with a short chirp made in code, at its own pitch.
// TODO Set C: real sound files (free licence, listed in the references), wind, rotor, music.
const PITCH = { lrv: 520, opportunity: 660, viking: 240, ingenuity: 980, pioneer: 180 };

export function createAudio() {
  let ac = null;

  return {
    beep(who) {
      try {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        if (ac.state === 'suspended') ac.resume();
        const base = PITCH[who] || 440;
        [1, 1.25, 0.9].forEach((mult, i) => {
          const start = ac.currentTime + i * 0.09;
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(base * mult, start);
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(0.08, start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.08);
          osc.connect(gain).connect(ac.destination);
          osc.start(start);
          osc.stop(start + 0.1);
        });
      } catch (err) {
        // Sound is never allowed to break the game.
      }
    },
  };
}
