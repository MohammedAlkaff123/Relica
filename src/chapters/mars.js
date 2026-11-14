// Chapter 2: Mars. 3:30. Opportunity, Meridiani Planum, 2004 to 2018. Beat sheet: STORY.md section 2.
// Owner: Set A.
//
// airbag bounce (A/D nudge) into a small crater -> rover rolls out -> pebbles (hold E)
// -> time skip past sol 90 -> long drive on solar power: dust dims the panels, whirlwinds clean them
// -> time skip -> layered rock (hold E, grind) -> the rim (hold E, the view) -> time skip
// -> sunset radio call with Viking -> the 2018 dust storm: the rover slows to a stop however hard W
// is held -> cutscene 2
// Pitch-mode jumps: 'viking' (key 7), 'storm' (key 8).
//
// Mission "Follow the water" (STORY.md section 8, TASKS.md A-16): climb out of the crater, find 3 signs
// of water (each fills a third of the badge), keep the battery alive, reach the rim.
// Extra shots (section 9): mars_day at each time skip, mars_tracks at the rim, viking_wakes before the call.
//
// Waiting on others (works without them):
//   dialogue ch2_pebbles, ch2_sol90, ch2_orion, ch2_storm (Set C)   shots mars_landing, mars_day,
//   mars_tracks, viking_wakes (Moayad)   props airbags, whirlwind, env.storm (Set B)
//   hud.setBattery, hud.setCounter, hud.setMission (Set C)
//   Numbers come from facts.json "missions" (Set C, verified); the dates below match those facts.
import * as THREE from 'three';
import { makeChapter } from './_stage.js';
import { makeProp } from './_props.js';
import { mission, factNumber } from './_mission.js';
import { createCharacter } from '../characters/character.js';

// Dates as short labels. Each matches a verified fact: opportunity_landing, opportunity_sol_4712,
// opportunity_last_contact.
const DATES = { landed: 'Jan 2004', orion: 'Apr 2017', storm: 'Jun 2018' };

const CRATER = [0, 0];
const PEBBLES = [16, 26];
const ROCK = [-20, 88];
const VIEW = [62, 132];
const VIKING_SPOT = [-150, -150];
// Whirlwinds wander inside this box, around the long drive.
const DEVIL_AREA = { x: [-40, 75], z: [30, 135] };
const DEVILS = 4;

export default makeChapter({
  id: 'mars',
  world: 'mars',
  character: 'opportunity',
  vehicle: 'rover',
  start: [0, 0, 0],

  async script(s, ctx, opts) {
    const MISSION = {
      planned: factNumber(ctx, 'opportunity_planned', 90),
      orionSol: factNumber(ctx, 'opportunity_sol_4712', 4712),
    };
    // The counter jumps used by the three time skips (story pacing, not facts), ending on the real sol.
    const SKIP = [120, 2400, MISSION.orionSol];
    s.sol = 1;
    s.power = { on: false, level: 1, clean: 1, shown: -1, lowest: 1 };
    s.water = 0;
    ctx.hud.setStat('date', DATES.landed);
    // Tasks (content/missions.json "mars"): 0 crater, 1 water signs, 2 battery, 3 rim.
    const m = s.mission = mission(ctx, 'mars');
    const showSol = () => {
      s.counter('sol', s.sol, MISSION.planned);
      if (s.sol > MISSION.planned) m.discover('opportunity_90');
    };
    const waterSign = () => { s.water++; m.progress(1, s.water, 3); };

    if (!opts.jump) {
      await s.do(ctx.card.chapter('mars'));
      await landing(s, ctx);
      s.hero.setEmotion('curious');
      showSol();
      await s.say('ch2_intro');

      // Out of the crater to the pebbles.
      s.unlockControls();
      await s.goTo(PEBBLES[0], PEBBLES[1], 'Climb out of the crater', { radius: 5 });
      m.done(0);
      s.hero.setEmotion('happy');
      await s.hold('KeyE', 2, 'Hold E to study the tiny round pebbles');
      waterSign();
      m.discover('pebbles_water');
      await s.say('ch2_pebbles');

      // Time skip 1: the counter passes 90 and keeps going.
      await timeSkip(s, SKIP[0], showSol);
      await s.say('ch2_sol90');

      // The long drive on solar power. Whirlwinds wander the plain.
      s.power.on = true;
      startWhirlwinds(s, ctx);
      s.unlockControls();
      await s.goTo(ROCK[0], ROCK[1], 'Drive to the layered rock. Whirlwinds clean your panels', { radius: 5 });
      await timeSkip(s, SKIP[1], showSol);
      s.unlockControls();
      s.hero.setEmotion('curious');
      await s.hold('KeyE', 2, 'Hold E to grind the layered rock');
      waterSign();
      await s.photo('PIA20285');

      await s.goTo(VIEW[0], VIEW[1], 'Drive to the crater rim', { radius: 6 });
      m.done(3);
      if (s.power.lowest > 0.1) m.done(2);
      s.lockControls();
      await s.shot('mars_tracks');
      s.unlockControls();
      await s.hold('KeyE', 2, 'Hold E to study the view from the rim');
      waterSign();
      s.lockControls();
      await timeSkip(s, SKIP[2], showSol);
      ctx.hud.setStat('date', DATES.orion);
      await s.photo('PIA21708');
      await s.say('ch2_orion');
    } else {
      s.controller.place(VIEW[0], VIEW[1], 0.6);
      s.sol = SKIP[2];
      showSol();
      ctx.hud.setStat('date', DATES.orion);
      s.power.on = true;
      await s.wait(0.1);
    }

    if (opts.jump !== 'storm') {
      // Sunset. Radio static. An old voice from far away: Viking is never shown beside Opportunity.
      s.lockControls();
      await radioCall(s, ctx);
    }

    // The 2018 dust storm. Nothing tells the player to let go of W.
    ctx.hud.setStat('date', DATES.storm);
    ctx.audio.music?.('storm');
    s.onDispose(() => { ctx.audio.music?.(null); ctx.audio.setWind?.(0); });
    s.power.on = false;
    s.devils?.forEach((d) => { d.visible = false; });
    s.unlockControls();
    ctx.hud.setObjective('');
    let level = 0, said = false;
    await s.until((dt) => {
      level = Math.min(1, level + dt / 25);
      s.storm.setLevel(level);
      ctx.audio.setWind?.(level);
      s.power.level = Math.min(s.power.level, 1 - level);
      s.controller.speedScale = Math.max(0, 1 - level * 1.1);
      if (level > 0.6) s.hero.setEmotion('sleepy');
      if (level > 0.5 && !said) { said = true; s.say('ch2_storm').catch(() => {}); }
      return level >= 1;
    });
    await s.wait(5); // 30 s in all
    s.sound('powerdown');
    s.lockControls();
    await s.wait(2);
    await s.shot('storm_to_jezero');
    ctx.next();
  },

  tick(dt, s, ctx) {
    const pw = s.power;
    if (!pw) return;
    if (pw.on && s.controls) {
      // Solar power: charges in sunlight, drains while driving. Dust on the panels slows charging.
      pw.clean = Math.max(0.1, pw.clean - dt / 35);
      pw.level += (0.035 * pw.clean - 0.012 - s.controller.speed * 0.006) * dt;
      pw.level = THREE.MathUtils.clamp(pw.level, 0.05, 1);
      pw.lowest = Math.min(pw.lowest, pw.level);
      s.hero.setEmotion(pw.level < 0.3 ? 'sad' : 'happy');
      // A flat battery never stops the game, it only slows the rover down.
      s.controller.speedScale = THREE.MathUtils.clamp(0.35 + pw.level * 1.3, 0.35, 1);
    }
    if (pw.on && s.devils) updateWhirlwinds(dt, s, ctx);
    const pct = Math.round(pw.level * 100);
    if (pct !== pw.shown && (pw.on || pw.shown >= 0)) { pw.shown = pct; s.battery(pw.level); }
    if (s.viking) s.viking.update(dt);
  },
});

// ---- whirlwinds: drive through one and the panels are swept clean ----

function startWhirlwinds(s) {
  const rand = (a) => a[0] + Math.random() * (a[1] - a[0]);
  s.devils = [];
  for (let i = 0; i < DEVILS; i++) {
    const d = s.add(makeProp('whirlwind'));
    d.userData.dir = Math.random() * Math.PI * 2;
    d.userData.respawn = 0;
    d.position.set(rand(DEVIL_AREA.x), 0, rand(DEVIL_AREA.z));
    s.devils.push(d);
  }
  s.respawnDevil = (d) => {
    d.position.set(rand(DEVIL_AREA.x), 0, rand(DEVIL_AREA.z));
    d.userData.respawn = 0;
    d.visible = true;
    d.scale.setScalar(1);
  };
}

function updateWhirlwinds(dt, s) {
  const p = s.hero.object.position;
  for (const d of s.devils) {
    if (!d.visible) {
      d.userData.respawn += dt;
      if (d.userData.respawn > 12) s.respawnDevil(d);
      continue;
    }
    // Wander slowly, turning now and then, staying inside the area.
    d.userData.dir += (Math.random() - 0.5) * dt * 1.5;
    d.position.x += Math.sin(d.userData.dir) * 1.2 * dt;
    d.position.z += Math.cos(d.userData.dir) * 1.2 * dt;
    if (d.position.x < DEVIL_AREA.x[0] || d.position.x > DEVIL_AREA.x[1] || d.position.z < DEVIL_AREA.z[0] || d.position.z > DEVIL_AREA.z[1]) {
      d.userData.dir += Math.PI;
    }
    d.position.y = s.ground(d.position.x, d.position.z);
    d.rotation.y += dt * 6;
    d.scale.y = 1 + 0.08 * Math.sin(s.time * 3 + d.id);
    // Drove through it: panels swept clean, battery jumps.
    if (Math.hypot(p.x - d.position.x, p.z - d.position.z) < 3.2) {
      s.power.clean = 1;
      s.power.level = Math.min(1, s.power.level + 0.3);
      s.mission.discover('wind_cleaning');
      s.sound('park'); // a rising beep: power back
      d.visible = false;
    }
  }
}

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
  let still = 0, t = 0, lastVy = 0;
  await s.until((dt) => {
    t += dt;
    const p = ball.translation(), v = ball.linvel();
    if (lastVy < -1.5 && v.y > 0.5) s.sound('bounce');
    lastVy = v.y;
    anchor.position.set(p.x, p.y, p.z);
    const flat = Math.hypot(v.x, v.z);
    if (flat > 0.5) anchor.rotation.y += (Math.atan2(v.x, v.z) - anchor.rotation.y) * 0.05;
    if (s.alive) {
      const nudge = (ctx.input.down('KeyA', 'ArrowLeft') ? 1 : 0) - (ctx.input.down('KeyD', 'ArrowRight') ? 1 : 0);
      if (nudge) ball.applyImpulse({ x: Math.cos(anchor.rotation.y) * nudge * 6 * dt, y: 0, z: -Math.sin(anchor.rotation.y) * nudge * 6 * dt }, true);
      // The crater gently pulls the ball in, so every player ends up inside it.
      if (t > 4) ball.applyImpulse({ x: (CRATER[0] - p.x) * 0.6 * dt, y: 0, z: (CRATER[1] - p.z) * 0.6 * dt }, true);
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

// The sol counter races forward over the mars_day shot (the Sun crossing the sky).
// Until that shot exists: fade to black while the counter spins.
async function timeSkip(s, to, show) {
  s.lockControls();
  const from = s.sol;
  let t = 0;
  const spin = s.until((dt) => {
    t = Math.min(1, t + dt / 2.6);
    s.sol = from + (to - from) * t * t;
    show();
    return t >= 1;
  });
  if (await s.shot('mars_day')) { await spin; return; }
  await s.fade(true, 0.6);
  await spin;
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
  s.sound('static');
  await s.wait(1);
  ctx.followCam.setTarget(viking.object, 1.1);
  await s.shot('viking_wakes', viking.object);
  await s.say('ch2_viking_call');
  ctx.followCam.setTarget(s.hero.object, 1);
  s.hero.setEmotion('sad');
  await s.wait(1);
}
