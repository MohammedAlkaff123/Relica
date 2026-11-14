// Chapter 2: Mars. 3:30. Opportunity, Meridiani Planum, 2004 to 2018. Beat sheet: STORY.md section 2.
// Owner: Set A.
//
// airbag bounce (A/D nudge) into a small crater -> rover rolls out -> pebbles (hold E)
// -> time skip past sol 90 -> long drive on solar power: dust lowers charging, one gust cleans it
// -> time skip -> grind a rock (hold E) -> crater viewpoint -> time skip -> sunset radio call with Viking
// -> the 2018 dust storm: the rover slows to a stop however hard W is held -> cutscene 2
// Pitch-mode jumps: 'viking' (key 7), 'storm' (key 8).
//
// Waiting on others (works without them):
//   dialogue ch2_pebbles, ch2_sol90, ch2_orion, ch2_storm (Set C)   shot mars_landing (Moayad)
//   props airbags, env.storm (Set B)   hud.setBattery, hud.setCounter (Set C)
//   facts.json "missions" (Set C): the numbers in MISSION below are the plan's, not yet verified.
import * as THREE from 'three';
import { makeChapter } from './_stage.js';
import { makeProp } from './_props.js';
import { createCharacter } from '../characters/character.js';

// From PLAN.md section 12. Replace with facts.missions.opportunity once Set C has verified them.
const MISSION = { planned: 90, orionSol: 4712, orionDate: 'Apr 2017', landed: 'Jan 2004', stormDate: 'Jun 2018' };
// The counter jumps used by the three time skips (story pacing, not facts).
const SKIP = [120, 2400, MISSION.orionSol];

const CRATER = [0, 0];
const PEBBLES = [16, 26];
const ROCK = [-20, 88];
const VIEW = [62, 132];
const VIKING_SPOT = [-150, -150];

export default makeChapter({
  id: 'mars',
  world: 'mars',
  character: 'opportunity',
  vehicle: 'rover',
  start: [0, 0, 0],

  async script(s, ctx, opts) {
    s.sol = 1;
    s.power = { on: false, level: 1, clean: 1, gust: false, shown: -1 };
    ctx.hud.setStat('date', MISSION.landed);
    const showSol = () => s.counter('sol', s.sol, MISSION.planned);

    if (!opts.jump) {
      await s.card('Mars', `Meridiani Planum · planned mission: ${MISSION.planned} sols`);
      await landing(s, ctx);
      s.hero.setEmotion('curious');
      showSol();
      await s.say('ch2_intro');

      // Out of the crater to the pebbles.
      s.unlockControls();
      await s.goTo(PEBBLES[0], PEBBLES[1], 'Drive out of the crater', { radius: 5 });
      s.hero.setEmotion('happy');
      await s.hold('KeyE', 2, 'Hold E to study the tiny round pebbles');
      await s.say('ch2_pebbles');

      // Time skip 1: the counter passes 90 and keeps going.
      await timeSkip(s, SKIP[0], showSol);
      await s.say('ch2_sol90');

      // The long drive on solar power.
      s.power.on = true;
      s.unlockControls();
      await s.goTo(ROCK[0], ROCK[1], 'Drive to the rock. Watch your battery', { radius: 5 });
      await timeSkip(s, SKIP[1], showSol);
      s.unlockControls();
      s.hero.setEmotion('curious');
      await s.hold('KeyE', 2, 'Hold E to grind the rock');
      await s.photo('PIA20285');

      await s.goTo(VIEW[0], VIEW[1], 'Drive to the crater rim', { radius: 6 });
      s.lockControls();
      await timeSkip(s, SKIP[2], showSol);
      ctx.hud.setStat('date', MISSION.orionDate);
      await s.photo('PIA21708');
      await s.say('ch2_orion');
    } else {
      s.controller.place(VIEW[0], VIEW[1], 0.6);
      s.sol = SKIP[2];
      showSol();
      ctx.hud.setStat('date', MISSION.orionDate);
      s.power.on = true;
      await s.wait(0.1);
    }

    if (opts.jump !== 'storm') {
      // Sunset. Radio static. An old voice from far away: Viking is never shown beside Opportunity.
      s.lockControls();
      await radioCall(s, ctx);
    }

    // The 2018 dust storm. Nothing tells the player to let go of W.
    ctx.hud.setStat('date', MISSION.stormDate);
    s.power.on = false;
    s.unlockControls();
    ctx.hud.setObjective('');
    let level = 0, said = false;
    await s.until((dt) => {
      level = Math.min(1, level + dt / 25);
      s.storm.setLevel(level);
      s.power.level = Math.min(s.power.level, 1 - level);
      s.controller.speedScale = Math.max(0, 1 - level * 1.1);
      if (level > 0.6) s.hero.setEmotion('sleepy');
      if (level > 0.5 && !said) { said = true; s.say('ch2_storm').catch(() => {}); }
      return level >= 1;
    });
    await s.wait(5); // 30 s in all
    s.lockControls();
    await s.wait(2);
    await s.shot('storm_to_jezero');
    ctx.next();
  },

  tick(dt, s) {
    const pw = s.power;
    if (!pw) return;
    if (pw.on && s.controls) {
      // Solar power: charges in sunlight, drains while driving. Dust on the panels slows charging.
      pw.clean = Math.max(0.15, pw.clean - dt / 50);
      pw.level += (0.035 * pw.clean - 0.008 - s.controller.speed * 0.006) * dt;
      // One scripted gust of wind cleans the panels when things look bad.
      if (!pw.gust && pw.level < 0.4) {
        pw.gust = true;
        pw.clean = 1;
        pw.level = Math.min(1, pw.level + 0.35);
        s.hero.setEmotion('happy');
      }
      pw.level = THREE.MathUtils.clamp(pw.level, 0.05, 1);
      if (pw.level < 0.35) s.hero.setEmotion('sad');
      s.controller.speedScale = THREE.MathUtils.clamp(0.4 + pw.level * 1.2, 0.4, 1);
    }
    const pct = Math.round(pw.level * 100);
    if (pct !== pw.shown && (pw.on || pw.shown >= 0)) { pw.shown = pct; s.battery(pw.level); }
    if (s.viking) s.viking.update(dt);
  },
});

// Airbags hit the ground and bounce into a small crater. A and D nudge the bounces.
async function landing(s, ctx) {
  s.body.setEnabled(false);
  s.hero.object.visible = false;
  const bags = s.add(makeProp('airbags'));
  const ball = ctx.physics.addBall(bags, 1.4, [-45, 22, -50], { restitution: 0.55 });
  ball.setLinvel({ x: 7, y: -4, z: 8 }, true);
  // The camera follows a calm point that faces where the ball rolls, not the spinning ball itself.
  const anchor = s.add(new THREE.Object3D());
  ctx.followCam.setTarget(anchor, 1.6);
  s.hero.setEmotion('scared');
  const shot = s.shot('mars_landing'); // plays over the bounce if it exists
  let still = 0, t = 0;
  await s.until((dt) => {
    t += dt;
    const p = ball.translation(), v = ball.linvel();
    anchor.position.set(p.x, p.y, p.z);
    const flat = Math.hypot(v.x, v.z);
    if (flat > 0.5) anchor.rotation.y += (Math.atan2(v.x, v.z) - anchor.rotation.y) * 0.05;
    if (s.alive) {
      const nudge = (ctx.input.down('KeyA', 'ArrowLeft') ? 1 : 0) - (ctx.input.down('KeyD', 'ArrowRight') ? 1 : 0);
      if (nudge) ball.applyImpulse({ x: Math.cos(anchor.rotation.y) * nudge * 6 * dt, y: 0, z: -Math.sin(anchor.rotation.y) * nudge * 6 * dt }, true);
      // The crater gently pulls the ball in, so every player ends up inside it.
      if (t > 4) ball.applyImpulse({ x: (0 - p.x) * 0.6 * dt, y: 0, z: (0 - p.z) * 0.6 * dt }, true);
    }
    const inCrater = Math.hypot(p.x - CRATER[0], p.z - CRATER[1]) < 8;
    still = inCrater && Math.hypot(v.x, v.y, v.z) < 1.2 ? still + dt : 0;
    return still > 0.6 || t > 20;
  });
  await shot;
  // Airbags sag, the rover rolls out.
  const p = ball.translation();
  ctx.physics.removeBody(ball);
  await s.until((dt) => { bags.scale.y = Math.max(0.25, bags.scale.y - dt * 0.6); return bags.scale.y <= 0.25; });
  s.body.setEnabled(true);
  s.controller.place(p.x, p.z + 3, anchor.rotation.y);
  s.hero.object.visible = true;
  ctx.followCam.setTarget(s.hero.object, 1);
  await s.wait(0.6);
}

// Fade out, the sol counter races forward, fade back in.
async function timeSkip(s, to, show) {
  s.lockControls();
  await s.fade(true, 0.8);
  const from = s.sol;
  let t = 0;
  await s.until((dt) => {
    t = Math.min(1, t + dt / 2.2);
    s.sol = from + (to - from) * t * t;
    show();
    return t >= 1;
  });
  await s.fade(false, 0.8);
}

// The radio call. Viking stands far away; the camera cuts to it and back.
async function radioCall(s, ctx) {
  const viking = createCharacter('viking');
  s.add(viking.object);
  viking.object.position.set(VIKING_SPOT[0], s.ground(VIKING_SPOT[0], VIKING_SPOT[1]) + viking.half[1], VIKING_SPOT[1]);
  viking.object.rotation.y = 0.8;
  viking.setEmotion('sleepy');
  s.viking = viking;
  ctx.characters.set('viking', viking);
  s.hero.setEmotion('curious');
  ctx.audio.play?.('radio_static');
  await s.wait(1);
  ctx.followCam.setTarget(viking.object, 1.1);
  await s.say('ch2_viking_call');
  ctx.followCam.setTarget(s.hero.object, 1);
  s.hero.setEmotion('sad');
  await s.wait(1);
}
