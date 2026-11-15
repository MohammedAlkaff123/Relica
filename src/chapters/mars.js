// Chapter 2: Mars. 3:30. Opportunity, Meridiani Planum, 2004 to 2018. Beat sheet: STORY.md section 2.
// Owner: Set A.
//
// airbag bounce (A/D nudge) into a small crater -> rover rolls out -> pebbles (hold E)
// -> time skip past sol 90 -> long drive on solar power: dust dims the panels, whirlwinds clean them
// -> time skip -> layered rock (hold E, grind) -> the rim (hold E, the view) -> time skip
// -> sunset radio call with Viking, with Viking's 1976 flashback in the middle -> the 2018 dust storm: the rover slows to a stop however hard W
// is held -> cutscene 2
// Pitch-mode jumps: 'viking' (key 7), 'storm' (key 8).
//
// Mission "Follow the water" (STORY.md section 8, TASKS.md A-16): climb out of the crater, find 3 signs
// of water (each fills a third of the badge), keep the battery alive, reach the rim.
// Extra shots (section 9): mars_day at each time skip, mars_tracks at the rim, viking_wakes before the call.
//
// Waiting on others (works without them):
//   shots mars_landing, mars_day,
//   mars_tracks, viking_wakes (Moayad)   props airbags, whirlwind, env.storm (Set B)
//   hud.setBattery, hud.setCounter, hud.setMission (Set C)
//   Numbers come from facts.json "missions" (Set C, verified); the dates below match those facts.
import * as THREE from 'three';
import { makeChapter } from './_stage.js';
import { makeProp } from './_props.js';
import { mission, factNumber } from './_mission.js';
import { grindRock } from './_marsGames.js';
import { captureHistoricPhoto } from './_historicPhoto.js';
import { counterJump } from './_timeJump.js';
import { el } from '../ui/dom.js';
import { createCharacter } from '../characters/character.js';

// Dates as short labels. Each matches a verified fact: opportunity_landing, opportunity_sol_4712,
// opportunity_last_contact.
const DATES = { landed: 'Jan 2004', orion: 'Apr 2017', storm: 'Jun 2018' };

const CRATER = [0, 0];
// The three water signs, close together (each 20-25 m apart) so the search stays short.
const PEBBLES = [10, 16];
const ROCK = [-4, 36];
const VIEW = [-18, 50];
const VIKING_SPOT = [-150, -150];
// Whirlwinds wander inside this box, around the long drive.
const DEVIL_AREA = { x: [-30, 25], z: [5, 60] };
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
    const SKIP = [120, 4248, MISSION.orionSol];
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
    const waterSign = () => { m.done(s.water++); ctx.hud.setStat('water evidence', `${s.water} / 3`); };
    s.prop('pebbles', PEBBLES[0], PEBBLES[1]);
    s.prop('layeredRock', ROCK[0] - 2, ROCK[1] + 2);
    s.prop('layeredRock', VIEW[0] - 2, VIEW[1] + 2);

    if (!opts.jump) {
      await s.chapterCard('mars');
      await landing(s, ctx);
      s.hero.setEmotion('curious');
      showSol();
      ctx.hud.setStat('water evidence', '0 / 3');
      ctx.hud.setStat('mission', 'Search for evidence of past liquid water');
      s.unlockControls();
      s.chat('ch2_intro'); // while the rover rolls out
      await s.goTo(PEBBLES[0], PEBBLES[1], 'Reach the hematite blueberries', { radius: 4, park: true });
      await investigate(s, ctx, 'Hold E: examine the blueberries with your instruments',
        'Hematite-rich spheres formed in water-altered rock.', 'كرات غنية بالهيماتيت تكوّنت في صخور غيّرها الماء.');
      waterSign(); m.discover('pebbles_water');

      s.power.on = true;
      startWhirlwinds(s, ctx);
      s.unlockControls();
      await s.goTo(ROCK[0], ROCK[1], 'Find the outcrop: test its minerals for a watery past', { radius: 4, park: true });
      await investigate(s, ctx, 'Grind the crust, then analyze the exposed rock',
        'Jarosite: a mineral that records contact with acidic water.', 'الجاروسيت معدن يسجّل تلامس الصخر مع ماء حمضي.',
        () => grindRock(s, ctx)); // the rock-grinder mini-game instead of holding E
      waterSign(); m.discover('jarosite_water');

      s.unlockControls();
      await s.goTo(VIEW[0], VIEW[1], 'Inspect the fine layers in the next outcrop', { radius: 4, park: true });
      await investigate(s, ctx, 'Hold E: scan the tilted layers in the rock',
        'Cross-lamination: evidence of ripples made by flowing water.', 'طبقات متقاطعة: دليل على تموّجات صنعها ماء جارٍ.');
      waterSign(); m.discover('ripples_water');
      await s.say('ch2_water', { auto: true });
      // Three different clues support ancient water, not a discovery of present-day drinking water.
      await timeSkip(s, SKIP[0], showSol);
      await s.say('ch2_sol90', { auto: true });
      await timeSkip(s, SKIP[1], showSol);
      ctx.hud.setStat('date', '5 Jan 2016');
      await s.card('Still investigating, twelve years later', 'بعد اثنتي عشرة سنة، ما زالت تفحص الصخور', { auto: 4.5 });
      await s.hold('KeyE', 2, 'Hold E: examine the Potts rock target');
      await captureHistoricPhoto(s, ctx, 'PIA20285');

      await timeSkip(s, SKIP[2], showSol);
      ctx.hud.setStat('date', DATES.orion);
      await s.shot('mars_tracks');
      await captureHistoricPhoto(s, ctx, 'PIA21708');
      m.done(3);
      await s.say('ch2_orion', { auto: true });
      await s.hold('KeyE', 2, 'Hold E: transmit the science record to Earth');
      m.done(4);
      if (s.power.lowest > 0.1) m.bonus('Battery protected through the science traverse');
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
    ctx.hud.setObjective('Dust is blocking the sunlight. Solar power is falling.');
    ctx.hud.setStat('solar input', '100%');
    let level = 0, stormLine = null;
    await s.until((dt) => {
      level = Math.min(1, level + dt / 25);
      s.storm.setLevel(level);
      ctx.followCam.setMotion({ storm: level });
      ctx.hud.setStat('solar input', `${Math.round((1-level)*100)}%`);
      ctx.audio.setWind?.(level);
      s.power.level = Math.min(s.power.level, 1 - level);
      s.controller.speedScale = Math.max(0, 1 - level * 1.1);
      if (level > 0.6) s.hero.setEmotion('sleepy');
      if (level > 0.5 && !stormLine) stormLine = s.chat('ch2_storm');
      return level >= 1;
    });
    ctx.hud.setObjective('No sunlight reaches the panels. Last contact: 10 June 2018.');
    await s.wait(4); // 30 s in all
    // The battery dies in the middle of a word: the line is cut, and everything goes dark with it.
    await s.chat('ch2_storm_cut');
    s.sound('powerdown');
    s.lockControls();
    s.hero.setEmotion('sleepy');
    await s.fade(true, 0.12);
    await s.wait(2.5);
    m.discover('opportunity_storm');
    ctx.hud.setObjective('');
    // The real machine and what it did, before the story moves on.
    await s.tribute('PIA20285');
    // Viking is part of this chapter too: its own photo and record follow.
    await s.tribute('PIA00565');
    await s.fade(false, 1);
    let rise=0;
    const clearSky=s.every((dt)=>{rise+=dt;s.storm.setLevel(Math.max(0,1-rise/5));});
    await s.shot('storm_to_jezero');
    clearSky();
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
      if (pw.level < 0.25 && !pw.warned) { pw.warned = true; s.sound('battery_low', 'powerdown'); }
      if (pw.level > 0.4) pw.warned = false;
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
  s.loop('whirlwind', true);
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
  let nearest = Infinity;
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
    nearest = Math.min(nearest, Math.hypot(p.x - d.position.x, p.z - d.position.z));
    // Drove through it: panels swept clean, battery jumps.
    if (Math.hypot(p.x - d.position.x, p.z - d.position.z) < 3.2) {
      s.power.clean = 1;
      s.power.level = Math.min(1, s.power.level + 0.3);
      s.mission.discover('wind_cleaning');
      s.sound('panels_clean', 'park');
      d.visible = false;
    }
  }
  s.loopLevel('whirlwind', 1 - nearest / 25); // louder as the rover gets close
}

// Airbags hit the ground and bounce into a small crater. A and D nudge the bounces.
async function landing(s, ctx) {
  s.body.setEnabled(false);
  s.hero.object.visible = false;
  const bags = s.add(makeProp('airbags'));
  const ball = ctx.physics.addBall(bags, 1.1, [-45, 22, -50], { restitution: 0.55 });
  ball.setLinvel({ x: 7, y: -4, z: 8 }, true);
  // The camera follows a calm point that faces where the ball rolls, not the spinning ball itself.
  const anchor = s.add(new THREE.Object3D());
  ctx.followCam.setTarget(anchor, 1.6);
  s.hero.setEmotion('scared');
  const shot = s.shot('mars_landing', anchor);
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
// Until that shot exists: fade to black while the counter spins. A large centred counter shows the jump.
async function timeSkip(s, to, show) {
  s.lockControls();
  s.sound('time_skip');
  // A big counter in the middle of the screen races through the sols, so the jump in time is plain to see.
  const count = counterJump(s, { en: 'Sol', ar: 'اليوم المريخي', from: s.sol, to, onValue: (v) => { s.sol = v; show(); } });
  const filmed = await s.shot('mars_day');
  if (!filmed) await s.fade(true, 0.6);
  await count;
  if (!filmed) await s.fade(false, 0.8);
}

// The radio call. Viking stands far away; the camera cuts to it and back.
async function radioCall(s, ctx) {
  const viking = createCharacter('viking');
  s.onDispose(() => viking.dispose());
  s.add(viking.object);
  viking.object.position.set(VIKING_SPOT[0], s.ground(VIKING_SPOT[0], VIKING_SPOT[1]) + viking.half[1], VIKING_SPOT[1]);
  viking.object.rotation.y = 0.8;
  viking.setEmotion('sleepy');
  s.viking = viking;
  ctx.characters.set('viking', viking);
  // The imagined, decades-later radio exchange comes first. Half-way through, Viking tells its story
  // and the player lives it as a flashback (the real 1976 work); then the call picks up again.
  ctx.hud.setStat('date', '2017 · imagined conversation');
  const fiction=el('div','fiction-label',document.getElementById('ui'),'Imagined conversation · حوار متخيّل');
  s.onDispose(()=>fiction.remove());
  s.hero.setEmotion('curious');
  s.sound('static');
  await s.wait(1);
  ctx.followCam.setTarget(viking.object, 1.1);
  await s.shot('viking_wakes', viking.object);
  const talk = (id) => s.do(ctx.cinematics.conversation('ch2_viking_call', id, s.hero.object, { opportunity: s.hero.object, viking: viking.object }, ctx.dialogue));
  await talk('ch2_viking_call');
  fiction.style.display = 'none';
  await vikingFlashback(s, ctx, viking);
  fiction.style.display = '';
  await talk('ch2_viking_call_2');
  fiction.remove();
  // Viking's service record comes at the end of the chapter, after Opportunity's.
  ctx.followCam.setTarget(s.hero.object, 1);
  s.hero.setEmotion('sad');
  await s.wait(1);
}

// Viking's story, played as a memory: 1976, tinted like an old photograph. The player takes Viking's
// picture and delivers its soil sample, then the scene returns to the call.
async function vikingFlashback(s, ctx, viking) {
  const ui = document.getElementById('ui');
  s.sound('time_skip');
  await s.fade(true, 0.8);
  document.body.classList.add('flashback'); // style.css: the 3D view turns sepia
  const veil = el('div', 'flashback-veil', ui);
  const label = el('div', 'flashback-label', veil, 'Viking’s memory · 1976 · ');
  const ar = el('span', '', label, 'ذكرى فايكنغ');
  ar.lang = 'ar'; ar.dir = 'rtl';
  const end = () => { document.body.classList.remove('flashback'); veil.remove(); };
  s.onDispose(end);
  const remembered = mission(ctx, 'viking');
  ctx.hud.setContext('Viking 1', 'Chryse Planitia · August 1976');
  ctx.followCam.setTarget(viking.object, 1.1); ctx.followCam.snap();
  viking.setEmotion('happy');
  await s.fade(false, 0.8);
  await s.card('Viking 1 · Chryse Planitia · 1976', 'First successful U.S. Mars landing · أول هبوط أمريكي ناجح على المريخ', { auto: 4.5 });
  await captureHistoricPhoto(s, ctx, 'PIA10738');
  remembered.done(0);
  ctx.followCam.setTarget(viking.object, 1.1); ctx.followCam.snap();
  await s.hold('KeyE', 2, 'Hold E: deliver a soil sample to the biology experiments');
  remembered.done(1);
  await s.card('A search for life, not a confirmed discovery', 'The experiments found no definitive evidence of life. · لم تؤكّد التجارب وجود حياة.', { auto: 5.5 });
  s.mission.discover('viking_first');
  // Back to the present.
  s.sound('time_skip');
  await s.fade(true, 0.8);
  end();
  viking.setEmotion('sleepy');
  ctx.hud.setWorld('mars'); ctx.hud.setStat('date', '2017 · imagined conversation');
  ctx.hud.setMission('mars');
  for (let i=0;i<5;i++) if (s.mission.isDone(i)) ctx.hud.completeTask(i);
  await s.fade(false, 0.8);
}

// Each observation needs a stopped rover and an instrument action; driving into a ring is not science.
// play: optional mini-game to run instead of "hold E" (the rock grinder).
async function investigate(s, ctx, instruction, result, arabic, play) {
  s.lockControls();
  s.hero.setEmotion('curious');
  const target=s.hero.object.position.clone(); target.z+=1.8;
  const ring=s.add(new THREE.Mesh(new THREE.TorusGeometry(.65,.035,6,32),new THREE.MeshBasicMaterial({color:0x8fd18b})));
  ring.rotation.x=-Math.PI/2;ring.position.set(target.x,s.ground(target.x,target.z)+.2,target.z);
  const stop=s.every((dt)=>{ring.rotation.z+=dt;});
  const cleanup=()=>{stop();ring.parent?.remove(ring);ring.geometry.dispose();ring.material.dispose();};
  s.onDispose(cleanup);
  s.hero.lookAt?.(target);
  if (play) { ctx.hud.setObjective(instruction); await play(); ctx.hud.setObjective(''); }
  else await s.hold('KeyE',2.5,instruction);
  cleanup(); s.hero.lookAt?.(null);
  // The finding goes on a line at the bottom of the screen and the drive carries on: no card to dismiss.
  if (ctx.hud.note) ctx.hud.note(result, arabic); else await s.card(result, arabic);
}
