// Opening: the factory. 0:45. The rover opens its eyes and learns to drive on a test stand.
// Beat sheet: STORY.md section 2. Owner: Set A.
//
// title card -> wake -> on the stand: W/S spin the wheels, A/D steer them (the driving tutorial,
// it cannot go anywhere) -> two workers fold it -> black, launch rumble -> chapter 1
//
// Waiting on others (works without them): shots opening_wake, launch (Moayad); dialogue ch0_fold (Set C);
// props stand, worker (Set B); audio.play('launch') (Set C); shot earth_goodbye (Moayad).
// Mission "Wake up" (STORY.md section 8): spin your wheels, steer left and right.
import { makeChapter } from './_stage.js';
import { findWheels } from '../vehicles/wheels.js';
import { mission } from './_mission.js';

const STAND_TOP = 1.07;

export default makeChapter({
  id: 'opening',
  world: 'factory',
  character: 'lrv',
  vehicle: null,
  start: [0, 0, Math.PI],

  async script(s, ctx) {
    s.prop('stand', 0, 0);
    s.hero.object.position.y = STAND_TOP + s.hero.half[1];
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
    ctx.hud.setObjective('A and D: try your steering');
    await s.until(() => s.tutorial.steered > 1.2);
    m.done(1);
    ctx.hud.setObjective('');
    await s.wait(1);
    s.lockControls();

    // Two workers fold it in half and close a panel over it.
    const workers = [s.prop('worker', -6, -3), s.prop('worker', 6, -3)];
    await Promise.all(workers.map((w, i) => s.moveTo(w, i ? 1.6 : -1.6, -0.4, 2.5)));
    s.hero.setEmotion('scared');
    await s.say('ch0_fold');
    await s.until((dt) => {
      const sc = s.hero.object.scale;
      const k = 1 - Math.exp(-3 * dt);
      sc.y += (0.35 - sc.y) * k; sc.z += (0.5 - sc.z) * k;
      return sc.y - 0.35 < 0.01;
    });
    // From inside the box, through the closing gap: a worker rests a hand on the rover. Then dark.
    await s.shot('earth_goodbye');

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
