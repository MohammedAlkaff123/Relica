// Chapter 1: the Moon. 3:00. Apollo 17 Lunar Roving Vehicle. Beat sheet: STORY.md section 2.
// Owner: Set A.
//
// unfold beside the Lunar Module -> crew climbs on -> stop 1 (crew collects rocks)
// -> the fender breaks: dust shower, speed capped -> stop 2: repair, memory photo, dust off
// -> free drive to stop 3 -> park facing the Lunar Module -> crew walks back -> lift-off -> alone
// Pitch-mode jump 'fender' (key 6) starts just after stop 1.
//
// Waiting on others (works without them, see _props.js):
//   dialogue ch1_dust, ch1_fixed (Set C)   shots moon_arrival, moon_liftoff (Moayad)
//   props lunarModule, astronaut, env.dust (Set B)   audio.play('fender_snap' | 'music_free') (Set C)
import * as THREE from 'three';
import { makeChapter } from './_stage.js';

const LM = [0, -4];
const START = [7, 3, 0];
const STOP1 = [14, 58];
const STOP2 = [-22, 100];
const STOP3 = [-68, 22];
const PARK = [-20, -8];

// The two astronauts ride on the rover: put them on their seats.
function board(stage, crew) {
  crew.forEach((c, i) => {
    stage.hero.object.add(c);
    c.position.set(i ? 0.38 : -0.38, 0.05, -0.15);
    c.rotation.set(0, 0, 0);
    c.scale.setScalar(0.8);
  });
}

// Climb off and stand beside the rover.
async function climbOff(stage, crew) {
  crew.forEach((c) => { stage.detach(c); c.scale.setScalar(1); });
  const p = stage.hero.object.position;
  await Promise.all(crew.map((c, i) => stage.moveTo(c, p.x + (i ? 2.2 : -2.2), p.z + 1.5 + i, 1.2)));
}

async function climbOn(stage, crew) {
  const p = stage.hero.object.position;
  await Promise.all(crew.map((c, i) => stage.moveTo(c, p.x + (i ? 0.9 : -0.9), p.z, 1)));
  board(stage, crew);
}

export default makeChapter({
  id: 'moon',
  world: 'moon',
  character: 'lrv',
  vehicle: 'rover',
  start: START,

  async script(s, ctx, opts) {
    const lm = s.prop('lunarModule', LM[0], LM[1], 0);
    const crew = [s.prop('astronaut', LM[0] + 2, LM[1] + 4), s.prop('astronaut', LM[0] - 2, LM[1] + 4)];
    ctx.hud.setStat('date', 'Dec 1972');
    s.driven = 0;

    if (opts.jump !== 'fender') {
      s.hero.setEmotion('sleepy');
      await s.card('The Moon', 'Taurus–Littrow valley · December 1972');

      // Unfold: the rover opens out of its folded shape.
      s.hero.object.scale.set(1, 0.35, 0.5);
      s.hero.setEmotion('happy');
      await s.until((dt) => {
        const sc = s.hero.object.scale;
        const k = 1 - Math.exp(-3.5 * dt);
        sc.y += (1 - sc.y) * k; sc.z += (1 - sc.z) * k;
        return 1 - sc.y < 0.01;
      });
      s.hero.object.scale.set(1, 1, 1);
      await climbOn(s, crew);
      await s.shot('moon_arrival');
      await s.say('ch1_intro');

      s.unlockControls();
      await s.goTo(STOP1[0], STOP1[1], 'Drive the crew to science stop 1', { radius: 6 });

      // Stop 1: the crew collects rocks. The rover's eyes follow them.
      s.lockControls();
      s.hero.setEmotion('curious');
      await climbOff(s, crew);
      ctx.hud.setObjective('The crew is collecting samples');
      const p = s.hero.object.position;
      await Promise.all(crew.map((c, i) => s.moveTo(c, p.x + (i ? 5 : -4), p.z + 6, 3)));
      await s.wait(2);
      ctx.hud.setObjective('');
      await climbOn(s, crew);
    } else {
      // Pitch jump: start right after stop 1, crew aboard.
      s.controller.place(STOP1[0], STOP1[1] + 4, 0);
      board(s, crew);
      s.hero.setEmotion('happy');
      await s.wait(0.1); // let physics move the model to the new spot before measuring from it
    }

    // Leaving stop 1, the rear fender breaks (real: Apollo 17, 12 Dec 1972).
    s.unlockControls();
    const stop2 = s.goTo(STOP2[0], STOP2[1], 'Drive on to science stop 2', { radius: 6 });
    await s.until(() => Math.hypot(s.hero.object.position.x - STOP1[0], s.hero.object.position.z - STOP1[1]) > 10);
    ctx.audio.play?.('fender_snap');
    s.dust.shower(true, s.hero);
    s.controller.speedScale = 0.45;
    s.hero.setEmotion('scared');
    s.objectives.setText('Drive through the dust to science stop 2');
    await s.say('ch1_dust');
    s.hero.setEmotion('sad');
    await stop2;

    // Stop 2: the crew tapes maps over the wheel (real).
    s.lockControls();
    await climbOff(s, crew);
    ctx.hud.setObjective('The crew is repairing the fender');
    const q = s.hero.object.position;
    await Promise.all(crew.map((c, i) => s.moveTo(c, q.x + (i ? 1.2 : -1.2), q.z - 1.6, 1.2)));
    await s.wait(2.5);
    ctx.hud.setObjective('');
    s.dust.shower(false);
    s.controller.speedScale = 1;
    await s.photo('as17-137-20979');
    s.hero.setEmotion('happy');
    await s.say('ch1_fixed');
    await climbOn(s, crew);

    // The long free drive: the happiest moment in the game.
    ctx.audio.play?.('music_free');
    s.controller.speedScale = 1.35;
    s.unlockControls();
    await s.goTo(STOP3[0], STOP3[1], 'Free drive to the last science stop', { radius: 7 });
    s.lockControls();
    s.hero.setEmotion('curious');
    await climbOff(s, crew);
    ctx.hud.setObjective('The last samples');
    await s.wait(3);
    ctx.hud.setObjective('');
    await climbOn(s, crew);
    s.controller.speedScale = 1;

    s.unlockControls();
    await s.goTo(PARK[0], PARK[1], 'Park where you can see the Lunar Module', { radius: 5 });

    // Controls off. The crew walks back to the Lunar Module.
    s.lockControls();
    await s.until((dt) => s.controller.turnToward(LM[0], LM[1], dt));
    await climbOff(s, crew);
    await Promise.all(crew.map((c, i) => s.moveTo(c, LM[0] + (i ? 1 : -1), LM[1] + 3, 6)));
    crew.forEach((c) => { c.visible = false; });
    await s.wait(1.5);

    // Lift-off. Only the top half goes. The rover watches it leave.
    const ascent = lm.getObjectByName('ascent') ?? lm;
    let up = 0;
    s.every((dt) => { up += dt; ascent.position.y = 0.5 * 2.2 * up * up; });
    s.hero.setEmotion('sad');
    await Promise.all([s.shot('moon_liftoff'), s.wait(6)]);
    await s.say('ch1_left_behind');
    await s.wait(2);
    await s.shot('moon_to_mars');
    ctx.next();
  },

  tick(dt, s, ctx) {
    if (!s.controls) return;
    s.driven = (s.driven ?? 0) + s.controller.speed * dt;
    ctx.hud.setStat('driven', s.driven.toFixed(0) + ' m');
  },
});
