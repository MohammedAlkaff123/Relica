// Opening: the factory. 0:45. The rover opens its eyes and learns to drive on a test stand.
// Beat sheet: STORY.md section 2. Owner: Set A.
//
// title card -> wake -> on the stand: W/S spin the wheels, A/D steer them (the driving tutorial,
// it cannot go anywhere) -> two workers fold it -> black, launch rumble -> chapter 1
//
// Waiting on others (works without them): shots opening_wake, launch (Moayad); dialogue ch0_wheels, ch0_fold (Set C);
// shot earth_goodbye (Moayad). The test stand and the two workers are part of Set B's factory room.
// Mission "Wake up" (STORY.md section 8): spin your wheels, steer left and right.
import { makeChapter } from './_stage.js';
import { findWheels } from '../vehicles/wheels.js';
import { mission } from './_mission.js';

export default makeChapter({
  id: 'opening',
  world: 'factory',
  character: 'lrv',
  vehicle: null,
  start: [0, 0, 0], // on Set B's test stand at (0, 0), facing +Z

  async script(s, ctx) {
    ctx.hud.setStat('date', '1971');
    const wheels = findWheels(s.hero);
    s.tutorial = { spun: 0, steered: 0, wheels };
    const m = mission(ctx, 'opening');

    s.hero.setEmotion('sleepy');
    await s.do(ctx.card.title());
    await s.shot('opening_wake');
    s.hero.setEmotion('curious');
    await s.say('ch0_wake');

    // The tutorial: the player learns W/S and A/D without reading anything long.
    s.hero.setEmotion('happy');
    s.unlockControls();
    ctx.hud.setObjective('W and S: try your wheels');
    await s.until(() => s.tutorial.spun > 1.2);
    m.done(0);
    // It only notices its wheels once it has watched them turn. A passing remark: the tutorial goes on.
    s.say('ch0_wheels', { ambient: true });
    ctx.hud.setObjective('A and D: try your steering');
    await s.until(() => s.tutorial.steered > 1.2);
    m.done(1);
    ctx.hud.setObjective('');
    await s.wait(1);
    s.lockControls();

    // Two workers fold it in half and close a panel over it.
    // Set B's two workers stand by the test stand (env.workers); they step up to the rover.
    const workers = s.env.workers?.length ? s.env.workers : [s.prop('worker', -3.4, 1.6), s.prop('worker', 3.5, -0.4)];
    await Promise.all(workers.map((w, i) => s.moveTo(w, i ? 1.5 : -1.5, 0.2, 2)));
    // The people speak first ("let's go"); only then does the rover ask where. Then it is folded.
    await s.say('ch0_fold');
    s.hero.setEmotion('scared');
    s.sound('fold');
    await s.until((dt) => {
      const sc = s.hero.object.scale;
      const k = 1 - Math.exp(-3 * dt);
      sc.y += (0.35 - sc.y) * k; sc.z += (0.5 - sc.z) * k;
      return sc.y - 0.35 < 0.01;
    });
    // From inside the box, through the closing gap: a worker rests a hand on the rover. Then dark.
    workers[0]?.userData.act?.('reassure');
    s.onDispose(() => workers.forEach((w) => w.userData.act?.(null)));
    await s.shot('earth_goodbye');
    workers[0]?.userData.act?.(null);

    // Black. Launch rumble, then silence.
    await s.fade(true, 1.2);
    s.sound('rumble');
    await s.shot('launch');
    await s.wait(2.5);
    s.hero.setEmotion('curious');
    await s.wait(1);
    ctx.next();
  },

  // On the stand the wheels turn but the rover does not move.
  tick(dt, s, ctx) {
    const t = s.tutorial;
    if (!t) return;
    const drive = s.controls ? (ctx.input.down('KeyW', 'ArrowUp') ? 1 : 0) - (ctx.input.down('KeyS', 'ArrowDown') ? 1 : 0) : 0;
    const steer = s.controls ? (ctx.input.down('KeyA', 'ArrowLeft') ? 1 : 0) - (ctx.input.down('KeyD', 'ArrowRight') ? 1 : 0) : 0;
    t.speed = (t.speed ?? 0) + (drive * 6 - (t.speed ?? 0)) * Math.min(1, 3 * dt);
    t.wheels.roll(t.speed * dt, steer);
    if (drive) t.spun += dt;
    if (steer) t.steered += dt;
    // A little shudder while the wheels spin, so it feels alive.
    s.hero.object.rotation.z = Math.sin(s.time * 40) * 0.004 * Math.abs(t.speed);
  },
});
