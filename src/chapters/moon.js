// Chapter 1: the Moon. 3:00. Apollo 17 Lunar Roving Vehicle. Beat sheet: STORY.md section 2.
// Owner: Set A.
//
// unfold beside the Lunar Module -> crew climbs on -> stop 1 (crew collects rocks)
// -> the fender breaks: dust shower, speed capped -> stop 2: repair, memory photo, dust off
// -> free drive to stop 3 -> park facing the Lunar Module -> crew walks back -> lift-off -> alone
// Pitch-mode jump 'fender' (key 6) starts just after stop 1.
//
// Mission "Carry the crew" (STORY.md section 8, TASKS.md A-15): park inside the circle at each stop
// (a neat park gets a happy beep), a sample box is strapped on at each stop and the stack grows,
// an air-time record for the longest jump, and a beeping marker to follow through the dust.
// Extra shots (section 9): moon_first_look after unfolding, moon_pat after the repair.
//
// Waiting on others (works without them, see _props.js):
//   dialogue ch1_dust, ch1_fixed (Set C)   shots moon_arrival, moon_liftoff (Moayad)
//   props lunarModule, astronaut, sampleBox, env.dust (Set B)
import { makeChapter } from './_stage.js';
import { mission } from './_mission.js';

const LM = [0, -4];
const START = [7, 3, 0];
const STOP1 = [14, 58];
const STOP2 = [-22, 110];   // just outside a crater in Set B's terrain
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

// Park at a stop: wait for the rover to stop inside the circle, beep if it is neat, count the stop.
async function park(s, ctx, [x, z], text, n) {
  const { neat } = await s.goTo(x, z, text, { radius: 6, park: true });
  if (neat) { s.sound('park'); s.hero.setEmotion('happy'); }
  s.mission.progress(0, n, 3);
}

// A sample box is strapped onto the back of the rover. The stack grows.
function addSampleBox(s, n) {
  s.sound('strap', 'land');
  const b = s.prop('sampleBox');
  s.hero.object.add(b);
  b.position.set(0, s.hero.half[1] * 0.5 + 0.14 + (n - 1) * 0.3, -s.hero.half[2] + 0.3);
  b.rotation.set(0, (n % 2) * 0.15, 0);
  s.mission.progress(1, n, 3);
  s.counter('sample boxes', n, 3);
}

// Crew actions (TASKS.md astronaut follow-up). Abdulkarim's figures walk, climb and sit on their own.
// Task actions are asked for through this contract, which Set B implements on the figure:
//   figure.userData.act(name)   name: 'collect' | 'repair' | 'reassure' | 'farewell'; null returns to idle.
//                               May return a Promise that ends with the action.
// Until act exists, nothing happens and the figures keep their automatic idle and walk, never a T-pose.
// The waits stay the same either way, so the chapter's timing does not depend on the actions.
function act(crew, name) {
  for (const c of crew) {
    try { c.userData.act?.(name); } catch (err) { console.warn(`crew action "${name}" failed`, err); }
  }
}
// Do an action for `seconds`, then back to idle.
async function perform(stage, crew, name, seconds) {
  act(crew, name);
  stage.onDispose(() => act(crew, null)); // restart and chapter jumps stop it
  try { await stage.wait(seconds); } finally { if (stage.alive) act(crew, null); }
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
    s.actors.lunarModule = lm;
    // The crew waits beside the rover, one each side, facing it.
    const crew = [s.prop('astronaut', START[0] - 2, START[1] + 0.2, Math.PI / 2), s.prop('astronaut', START[0] + 2, START[1] + 0.2, -Math.PI / 2)];
    ctx.hud.setStat('date', 'Dec 1972');
    s.driven = 0;
    s.air = { now: 0, best: 0 };
    // Tasks (content/missions.json "moon"): 0 science stops, 1 sample boxes, 2 drive blind. Bonus: longest jump.
    s.mission = mission(ctx, 'moon');
    // The self-test (src/core/selftest.js) drives the rover on its own here, with no story events.
    if (opts.jump === 'selftest') { s.unlockControls(); return; }

    if (opts.jump !== 'fender') {
      s.hero.setEmotion('sleepy');
      await s.do(ctx.card.chapter('moon'));

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
      await s.shot('moon_first_look');
      await climbOn(s, crew);
      await s.shot('moon_arrival');
      await s.say('ch1_intro');

      s.unlockControls();
      await park(s, ctx, STOP1, 'Drive the crew to science stop 1', 1);

      // Stop 1: the crew collects rocks. The rover's eyes follow them.
      s.lockControls();
      s.hero.setEmotion('curious');
      await climbOff(s, crew);
      ctx.hud.setObjective('The crew is collecting lunar geology samples');
      s.hero.lookAt?.(crew[0]); // the rover's eyes follow them
      const p = s.hero.object.position;
      await Promise.all(crew.map((c, i) => s.moveTo(c, p.x + (i ? 5 : -4), p.z + 6, 3)));
      await perform(s, crew, 'collect', 2);
      ctx.hud.setObjective('');
      s.hero.lookAt?.(null);
      await climbOn(s, crew);
      await s.hold('KeyE', 1.5, 'Hold E: secure the crew’s rock samples for the return trip');
      addSampleBox(s, 1);
    } else {
      // Pitch jump: start right after stop 1, crew aboard.
      s.controller.place(STOP1[0], STOP1[1] + 4, 0);
      board(s, crew);
      s.mission.progress(0, 1, 3);
      addSampleBox(s, 1);
      s.hero.setEmotion('happy');
      await s.wait(0.1); // let physics move the model to the new spot before measuring from it
    }

    // Compressed staging: the real fender broke at the lander during EVA 1;
    // the map-and-clamp replacement was fitted before EVA 2.
    s.unlockControls();
    const stop2 = park(s, ctx, STOP2, 'Drive on to science stop 2', 2);
    await s.until(() => Math.hypot(s.hero.object.position.x - STOP1[0], s.hero.object.position.z - STOP1[1]) > 10);
    s.sound('crack');
    s.dust.shower(true, s.hero);
    s.loop('dust_spray', true);
    s.controller.speedScale = 0.45;
    s.hero.setEmotion('scared');
    s.objectives.setText('Drive blind: follow the beeping marker');
    s.mission.discover('moon_no_air');
    // The marker beeps faster the closer the rover gets.
    let beepIn = 0;
    const stopBeeping = s.every((dt) => {
      const p = s.hero.object.position;
      beepIn -= dt;
      if (beepIn <= 0) {
        s.sound('marker_beep', 'park');
        beepIn = 0.25 + Math.min(1.5, Math.hypot(p.x - STOP2[0], p.z - STOP2[1]) / 30);
      }
    });
    await s.say('ch1_dust');
    s.hero.setEmotion('sad');
    await stop2;
    stopBeeping();
    s.mission.done(2);

    // Stop 2: the crew tapes maps over the wheel (real).
    s.lockControls();
    await climbOff(s, crew);
    ctx.hud.setObjective('The crew is repairing the fender');
    const q = s.hero.object.position;
    await Promise.all(crew.map((c, i) => s.moveTo(c, q.x + (i ? 1.2 : -1.2), q.z - 1.6, 1.2)));
    for (const c of crew) c.rotation.y = Math.atan2(q.x-c.position.x, q.z-c.position.z);
    await perform(s, crew, 'repair', 2.5);
    ctx.hud.setObjective('');
    s.dust.shower(false);
    s.loop('dust_spray', false);
    s.controller.speedScale = 1;
    await s.photo('as17-137-20979');
    s.mission.discover('fender_maps');
    act(crew, 'reassure'); // a hand on the rover while the camera holds on it
    await s.shot('moon_pat');
    act(crew, null);
    s.hero.setEmotion('happy');
    await s.say('ch1_fixed');
    await climbOn(s, crew);
    await s.hold('KeyE', 1.5, 'Hold E: secure the second geology sample box');
    addSampleBox(s, 2);

    // The long free drive: the happiest moment in the game.
    ctx.audio.music?.('drive');
    s.onDispose(() => ctx.audio.music?.(null));
    s.controller.speedScale = 1.35;
    s.unlockControls();
    await park(s, ctx, STOP3, 'Carry the crew to the last geology site', 3);
    s.lockControls();
    s.hero.setEmotion('curious');
    await climbOff(s, crew);
    ctx.hud.setObjective('The last samples');
    await perform(s, crew, 'collect', 3);
    ctx.hud.setObjective('');
    await climbOn(s, crew);
    await s.hold('KeyE', 1.5, 'Hold E: secure the last geology samples');
    addSampleBox(s, 3);
    s.controller.speedScale = 1;

    s.unlockControls();
    await s.goTo(PARK[0], PARK[1], 'Park where you can see the Lunar Module', { radius: 5 });

    // Controls off. The crew walks back to the Lunar Module.
    s.lockControls();
    await s.until((dt) => s.controller.turnToward(LM[0], LM[1], dt));
    await climbOff(s, crew);
    await Promise.all(crew.map((c, i) => s.moveTo(c, LM[0] + (i ? 1 : -1), LM[1] + 3, 6)));
    // At the ladder they turn back toward the rover for a moment.
    for (const c of crew) c.rotation.y = Math.atan2(s.hero.object.position.x - c.position.x, s.hero.object.position.z - c.position.z);
    await perform(s, crew, 'farewell', 1.5);
    crew.forEach((c) => { c.visible = false; });
    await s.wait(1.5);

    // Lift-off. Only the top half goes. The rover watches it leave.
    const ascent = lm.getObjectByName('ascent') ?? lm;
    s.actors.ascent = ascent;
    let up = 0;
    s.every((dt) => { up += dt; ascent.position.y = 0.5 * 2.2 * up * up; });
    s.fx.liftoff?.(ascent);
    s.sound('liftoff', 'rumble');
    s.hero.lookAt?.(ascent); // the rover's camera follows it up
    s.hero.setEmotion('sad');
    await s.do(ctx.cinematics.conversation('moon_liftoff', 'ch1_left_behind', s.hero.object, { lrv: s.hero.object, ascent }, ctx.dialogue));
    s.mission.discover('rover_filmed');
    await s.wait(2);
    await s.shot('moon_to_mars');
    ctx.next();
  },

  tick(dt, s, ctx) {
    // Air time: every hill is a ramp. The best jump is the bonus record.
    if (s.air && s.controller) {
      if (!s.controller.grounded) s.air.now += dt;
      else if (s.air.now > 0) {
        if (s.air.now > 0.5) s.sound('land');
        if (s.air.now > 0.5 && s.air.now > s.air.best) {
          s.air.best = s.air.now;
          s.mission.bonus(s.air.best.toFixed(1) + ' s');
          if (s.air.best >= 1.2) s.mission.discover('moon_gravity');
        }
        s.air.now = 0;
      }
    }
    if (!s.controls) return;
    s.driven = (s.driven ?? 0) + s.controller.speed * dt;
    ctx.hud.setStat('driven', s.driven.toFixed(0) + ' m');
  },
});
