// Epilogue: Pioneer 10. 1:15. No physics, the probe just drifts. Beat sheet: STORY.md section 2.
// Owner: Set A.
//
// a dish in the dark -> A/D turn it to find the Sun, now only a bright star (faint voices grow as it
// lines up) -> within 5 degrees for 2 seconds: the voices arrive -> "I hear you."
// -> Abandoned, but not forgotten -> the wall of real photos -> credits
//
// Waiting on others (works without them): dialogue ep_voices, ep_last (Set C); shot ending (Moayad);
// prop sun (Set B); memory.wall() layout and credits (Set C).
import { makeChapter } from './_stage.js';

const SUN_YAW = 2.3;               // where the Sun sits, measured from the way the probe first faces
const ALIGN = (5 * Math.PI) / 180; // must point within 5 degrees
const VOICES = ['lrv', 'viking', 'opportunity', 'ingenuity'];

const angleTo = (s) => {
  const d = SUN_YAW - s.hero.object.rotation.y;
  return Math.atan2(Math.sin(d), Math.cos(d));
};

export default makeChapter({
  id: 'epilogue',
  world: 'space',
  character: 'pioneer',
  vehicle: null,
  start: [0, 0, 0],

  async script(s, ctx) {
    const sun = s.prop('sun');
    sun.position.set(Math.sin(SUN_YAW) * 900, 30, Math.cos(SUN_YAW) * 900);
    ctx.hud.setStat('date', 'Today');
    s.spinRate = 0;

    s.hero.setEmotion('sleepy');
    await s.card('Far Away', 'Pioneer 10 · still travelling');
    await s.say('ep_drift');

    s.hero.setEmotion('curious');
    s.unlockControls();
    ctx.hud.setObjective('A and D: turn back toward the Sun');
    let lined = 0, nextVoice = 0;
    await s.until((dt) => {
      const off = Math.abs(angleTo(s));
      // Faint voices of the other machines, more often the closer it points.
      nextVoice -= dt;
      if (off < 0.6 && nextVoice <= 0) {
        ctx.audio.beep(VOICES[Math.floor(Math.random() * VOICES.length)]);
        nextVoice = 0.8 + off * 6;
      }
      lined = off < ALIGN ? lined + dt : 0;
      ctx.hud.setObjective(lined > 0 ? 'Hold still…' : 'A and D: turn back toward the Sun');
      return lined >= 2;
    });

    // Lined up. Signal rings arrive, one voice at a time.
    s.lockControls();
    ctx.hud.setObjective('');
    s.hero.setEmotion('happy');
    s.hero.talk(true);
    await s.say('ep_voices');
    s.hero.talk(false);
    s.hero.setEmotion('sleepy');
    await s.say('ep_last');
    await s.shot('ending');
    await s.card('Abandoned, but not forgotten', 'Every photo you are about to see is real.');
    await s.photo('ARC-1972-AC72-2135');
    await s.do(ctx.memory.wall());
    await s.card('Relica', 'The conversations are imagined. The machines, the places, the dates and the photos are real.');
    ctx.hud.setObjective('The end. Press 1 to play again');
  },

  // A and D turn the dish, with a little drift so it feels like floating.
  tick(dt, s, ctx) {
    if (!s.controls) { s.spinRate = (s.spinRate ?? 0) * Math.exp(-3 * dt); }
    else {
      const turn = (ctx.input.down('KeyA', 'ArrowLeft') ? 1 : 0) - (ctx.input.down('KeyD', 'ArrowRight') ? 1 : 0);
      s.spinRate += (turn * 0.6 - s.spinRate) * Math.min(1, 2.5 * dt);
    }
    s.hero.object.rotation.y += (s.spinRate ?? 0) * dt;
  },
});
