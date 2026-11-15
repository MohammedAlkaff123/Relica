// Epilogue: Pioneer 10. A 1973 Jupiter memory, then an imagined listening scene. Target 1:35.
// Owner: Set A.
//
// a dish in the dark -> A/D turn it to find the Sun, now only a bright star (faint voices grow as it
// lines up) -> within 5 degrees for 2 seconds: the voices arrive -> "I hear you."
// -> Abandoned, but not forgotten -> the wall of real photos -> credits
//
// Waiting on others (works without them): dialogue ep_voices, ep_last (Set C); shot ending (Moayad);
// shot where_they_are (Moayad). The Sun comes from Set B's space sky (env.sunDirection).
// Mission "Listen" (STORY.md section 8): find the Sun, hold the signal.
import { makeChapter } from './_stage.js';
import { mission } from './_mission.js';
import { photographJupiter } from './_pioneerPhoto.js';
import { rememberTheMachines } from './_remembrance.js';
import { el } from '../ui/dom.js';

const ALIGN = (5 * Math.PI) / 180; // must point within 5 degrees
const VOICES = ['lrv', 'viking', 'opportunity', 'ingenuity'];

const angleTo = (s) => {
  const d = s.sunYaw - s.hero.object.rotation.y;
  return Math.atan2(Math.sin(d), Math.cos(d));
};

export default makeChapter({
  id: 'epilogue',
  world: 'space',
  character: 'pioneer',
  vehicle: null,
  start: [0, 0, 0],

  async script(s, ctx) {
    // The Sun is part of Set B's deep-space sky; env.sunDirection points at it. Without it, a stand-in.
    const dir = s.env.sunDirection;
    s.sunYaw = dir ? Math.atan2(dir.x, dir.z) : 2.3;
    if (!dir) s.prop('sun').position.set(Math.sin(s.sunYaw) * 900, 30, Math.cos(s.sunYaw) * 900);
    s.spinRate = 0;
    await photographJupiter(s, ctx);
    ctx.hud.setStat('date', 'Last signal: 2003');
    const m = mission(ctx, 'epilogue'); // tasks: 0 find the Sun, 1 hold the signal

    s.hero.setEmotion('sleepy');
    await s.chapterCard('epilogue');
    await s.say('ep_drift', { auto: true });

    const fiction = el('div', 'fiction-label', document.getElementById('ui'));
    el('span', '', fiction, 'Imagined conversation');
    const ar = el('span', '', fiction, 'حوار متخيّل');
    ar.lang = 'ar'; ar.dir = 'rtl';
    s.onDispose(() => fiction.remove());

    s.hero.setEmotion('curious');
    s.unlockControls();
    ctx.hud.setObjective('A and D: turn back toward the Sun');
    let lined = 0, nextVoice = 0;
    await s.until((dt) => {
      const off = Math.abs(angleTo(s));
      if (off < ALIGN) m.done(0);
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
    m.done(1);
    // As each voice arrives: where that machine rests today. Plays with the voices if it exists.
    await rememberTheMachines(s, ctx);
    s.hero.setEmotion('sleepy');
    await s.say('ep_last');
    ctx.audio.music?.('ending');
    s.onDispose(() => ctx.audio.music?.(null));
    await s.shot('ending');
    fiction.remove();
    await s.do(ctx.card.ending());
    await s.do(ctx.memory.wall());
    // The end screen stays until the player picks: back to the main menu, or play from the start.
    ctx.hud.setObjective('The end');
    const choice = await s.do(ctx.card.credits());
    if (choice) ctx.finishGame?.(choice);
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
