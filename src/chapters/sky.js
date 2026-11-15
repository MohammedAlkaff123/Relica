// Chapter 3: the Mars sky. 2:30. Ingenuity, Jezero crater, 2021 to 2024. Beat sheet: STORY.md section 2.
// Owner: Set A.
//
// drops from under the big rover -> flight 1: spin up (hold Space 1.5 s), hold 3 m inside the height band
// for 3 s, land on the pad -> flights 2 and 3: scout the road, mark 3 dangers with E; the big rover's
// route bends around each mark -> land with battery to spare -> the big rover drives the route
// -> counter montage to 71 -> flight 72: growing drift and tilt, forced hard landing, a blade breaks
// -> Space only twitches the rotor -> the big rover drives on -> cutscene 3
// Pitch-mode jump: 'flight72' (key 9).
//
// Mission "Be the eyes" (STORY.md section 8, TASKS.md A-17).
// Extra shots (section 9): first_shadow at 3 m on flight 1, flights_montage at the counter montage.
//
// Waiting on others (works without them):
//   dialogue ch3_scout, ch3_crash, ch3_goodbye (Set C)   shots heli_drop, first_shadow, flights_montage,
//   last_flight (Moayad)   props perseverance, ring, heightBand, sandTrap, boulders, cliffEdge, flag,
//   hero.breakBlade() (Set B)
//   Numbers come from facts.json "missions" (Set C, verified); the dates below match those facts.
import * as THREE from 'three';
import { makeChapter } from './_stage.js';
import { mission, factNumber } from './_mission.js';
import { placesOf } from '../world/terrain.js';
import { wrightFabric, rotorSpinUp } from './_skyGames.js';

// Dates as short labels, each matching a verified fact: ingenuity_first_flight, ingenuity_total.
const DATES = { firstFlight: 'Apr 2021', lastFlight: 'Jan 2024' };

// The places come from Set B's Jezero map (placesOf('jezero')): three dangers and the smooth sand.
const START = [0, 0];
const ROVER_START = [0, -7];
const DEST = [-5, 70];                       // where the big rover wants to go
// Which danger is marked on which flight. The rover's planned road runs through all three, in the
// order cliff, sand trap, boulder field; marking one moves the road around it.
const DANGERS = [
  { place: 'sandTrap', name: 'the sand trap', flight: 2 },
  { place: 'cliff', name: 'the cliff edge', flight: 2 },
  { place: 'boulders', name: 'the boulder field', flight: 3 },
];
const ROAD_ORDER = ['cliff', 'sandTrap', 'boulders'];
// Where each scouting flight lands, clear of the dangers. Flight 2 is about 87 m, flight 3 about 72 m.
const PADS = { 2: [14, -8], 3: [10, 16] };

export default makeChapter({
  id: 'sky',
  world: 'jezero',      // Set B's Jezero terrain
  factsWorld: 'mars',   // gravity and the HUD panel are Mars
  character: 'ingenuity',
  vehicle: 'heli',
  cameraScale: 0.6,
  start: [START[0], START[1], 0],

  async script(s, ctx, opts) {
    const heli = s.controller;
    const MISSION = {
      planned: factNumber(ctx, 'ingenuity_planned', 5),
      total: factNumber(ctx, 'ingenuity_total', 72),
    };
    const rover = s.prop('perseverance', START[0], START[1], 0);
    // The rotor sound follows the blades.
    ctx.audio.loop?.('rotor', true);
    s.onDispose(() => ctx.audio.loop?.('rotor', false));
    s.every(() => ctx.audio.loopLevel?.('rotor', Math.min(1, s.hero.rotorSpeed / 40)));
    let pad = makePad(s, START[0], START[1]);
    let flight = 1;
    const showFlight = () => s.counter('flight', Math.floor(flight), MISSION.planned);
    ctx.hud.setStat('date', DATES.firstFlight);
    // Tasks (content/missions.json "sky"): 0 hold 3 m, 1 mark 3 dangers, 2 battery to spare.
    const m = s.mission = mission(ctx, 'sky');

    if (opts.jump !== 'flight72') {
      await s.chapterCard('sky');
      // A tiny machine drops from under the big rover, which backs away.
      heli.place(START[0], START[1], 0, 0.6);
      s.hero.setEmotion('scared');
      const drop = s.shot('heli_drop');
      await s.wait(1);
      await s.moveTo(rover, ROVER_START[0], ROVER_START[1], 3, { face: false });
      await drop;
      s.chat('ch3_intro'); // plays while the player starts the rotor

      // Flight 1: spin up, then hold 3 metres inside the band for 3 seconds, then land.
      showFlight();
      const band = s.prop('heightBand', START[0], START[1]);
      band.position.y += 3;
      // Before the first flight: the Wright brothers' fabric, then spin the rotor up in thin air.
      await wrightFabric(s, ctx);
      await rotorSpinUp(s, ctx);
      heli.spin = 1; // the rotor is at speed: lift starts as soon as Space is held
      s.unlockControls();
      ctx.hud.setObjective('Keep holding Space: climb to 3 metres');
      await s.until(() => heli.altitude >= 2.7);
      s.hero.setEmotion('happy');
      // "I'm flying": look straight down at its own shadow. It hovers by itself meanwhile.
      s.lockControls();
      heli.holdAt = 3;
      await s.shot('first_shadow');
      heli.holdAt = null;
      s.unlockControls();
      let inBand = 0;
      await s.until((dt) => {
        const ok = heli.altitude > 2.5 && heli.altitude < 3.5;
        if (ok) inBand += dt;
        ctx.hud.setObjective(ok
          ? `Hold it inside the band  ${Math.max(0, 3 - inBand).toFixed(1)} s`
          : heli.altitude < 2.5 ? 'Too low: tap Space to stay inside the band' : 'Too high: let go of Space');
        return inBand >= 3;
      });
      m.done(0);
      band.visible = false;
      await land(s, ctx, pad, 'Let go of Space to land on the pad');
      await s.photo('PIA23882');

      // Flights 2 and 3: scout the road and mark the dangers. The route bends around each mark.
      await s.card('Beyond the five-flight demonstration', 'Now an aerial scout for Perseverance · الآن تستكشف الطريق لبيرسيفيرانس', { auto: 4.5 });
      ctx.hud.setStat('phase', 'Extended mission · compressed scouting route');
      s.chat('ch3_scout');
      const places = placesOf('jezero');
      const at = (name) => { const p = places.find((q) => q.name === name); return p ? [p.x, p.z, p.r] : [0, 50, 10]; };
      const dangers = DANGERS.map((d) => ({ ...d, at: at(d.place), marked: false }));
      const route = makeRoute(s, [ROVER_START, ...ROAD_ORDER.map((n) => at(n).slice(0, 2)), DEST]);
      let marked = 0, recoveryTime = 0, recovered = false;
      const stopRecovery = s.every((dt) => {
        if (recovered || flight !== 6 || !heli.flying) return;
        recoveryTime += dt;
        const pulse = recoveryTime < 3 ? 0 : Math.sin(Math.min(1,(recoveryTime-3)/4)*Math.PI);
        heli.drift.tilt = pulse*.18; heli.drift.x = pulse*.7;
        if (pulse>.6) s.hero.setEmotion('scared');
        if (recoveryTime>=7) { recovered=true;heli.drift.tilt=heli.drift.x=0;s.hero.setEmotion('happy');s.chat('ch3_recover'); }
      });
      for (const f of [2, 3]) {
        flight = f + 4;
        showFlight();
        heli.battery = 1;
        s.unlockControls();
        for (const d of dangers.filter((x) => x.flight === f)) {
          await s.goTo(d.at[0], d.at[1], `Fly over ${d.name}`, { radius: 6 });
          ctx.navigation.set(d.at[0], d.at[1], d.name, { radius: 6, arrival: 'Press E: report the hazard' });
          ctx.hud.setObjective(`Press E above ${d.name} to report it to the rover`);
          await s.until(() => {
            const p = heli.position;
            return heli.flying && ctx.input.pressed('KeyE') && Math.hypot(p.x - d.at[0], p.z - d.at[1]) < Math.max(8, d.at[2]);
          });
          ctx.navigation.clear();
          d.marked = true;
          s.prop('flag', d.at[0], d.at[1]);
          route.avoid(d.at[0], d.at[1], d.at[2]);
          s.sound('mark', 'park');
          m.progress(1, ++marked, 3);
        }
        pad.dispose();
        pad = makePad(s, PADS[f][0], PADS[f][1]);
        const landed = await land(s, ctx, pad, f === 3 ? 'Land on the pad before the battery runs out' : 'Land on the pad');
        if (f === 3 && landed.battery > 0.1) m.done(2);
      }

      // The big rover drives the safe route the helicopter found.
      s.lockControls();
      ctx.hud.setObjective('The rover follows your safe route');
      await route.drive(rover);
      ctx.hud.setObjective('');

      // Montage: the counter passes 5 and keeps going.
      const spin = s.until((dt) => { flight = Math.min(MISSION.total - 1, flight + dt * 25); showFlight(); return flight >= MISSION.total - 1; });
      if (!(await s.shot('flights_montage'))) await s.fade(true, 0.8);
      await spin;
      m.discover('ingenuity_72');
      flight = MISSION.total - 1;
      showFlight();
      stopRecovery(); heli.drift.tilt=heli.drift.x=0;
      route.dispose();
    } else {
      await s.fade(true, 0);
    }

    // Flight 72. Smooth sand with nothing to look at. The horizon tips and the controls drift.
    pad.dispose();
    const sand = placesOf('jezero').find((q) => q.name === 'sand') ?? { x: -45, z: 55, r: 26 };
    const FAR = [sand.x - 110, sand.z + 50]; // across the sand; too far to reach before the crash
    heli.place(sand.x + sand.r, sand.z - 10, -1.6);
    rover.position.set(sand.x + sand.r + 8, s.ground(sand.x + sand.r + 8, sand.z - 18), sand.z - 18);
    flight = MISSION.total;
    showFlight();
    ctx.hud.setStat('date', DATES.lastFlight);
    heli.battery = 1;
    await s.fade(false, 0.8);
    s.hero.setEmotion('happy');
    s.unlockControls();
    s.goTo(FAR[0], FAR[1], 'Last flight: scout the smooth sand ahead', { radius: 4 }).catch(() => {});
    let air = 0, lastPush = null;
    await s.until((dt) => {
      if (heli.flying || air > 0) air += dt; // counts from take-off, even if it lands again
      if (air > 10) {
        const k = Math.min(1, (air - 10) / 6);
        heli.drift.x = 2.6 * k; heli.drift.z = -1.2 * k; heli.drift.tilt = 0.45 * k;
        if (k > 0.3) s.hero.setEmotion('scared');
        if (!s.warned) { s.warned = true; s.sound('drift_warning'); }
      }
      if (air > 12 && !lastPush) lastPush=s.chat('ch3_last_push');
      if (air > 16) heli.noLift = true;
      return heli.noLift && !heli.flying;
    });
    // Hard landing. A blade tip snaps.
    s.objectives.dispose();
    heli.drift.x = heli.drift.z = heli.drift.tilt = 0;
    heli.broken = true;
    heli.onTwitch = () => s.sound('rotor_twitch');
    s.hero.breakBlade?.();
    s.sound('crash');
    s.sound('crack');
    s.hero.setEmotion('sad');
    s.lockControls();
    if(lastPush) await lastPush;
    await s.shot('last_flight');
    s.unlockControls();
    ctx.hud.setObjective('Space: try to lift off again');
    await s.until(()=>ctx.input.pressed('Space'));
    await s.say('ch3_crash');

    // On the sand. Space only makes the rotor twitch. Nothing else.
    ctx.hud.setObjective('Space: try once more · Enter: let the rover continue');
    await s.until(() => ctx.input.pressed('Space', 'Enter'));
    ctx.hud.setObjective('');
    await s.wait(1.5);

    // Far away, the big rover turns its head, then drives on.
    s.lockControls();
    await s.wait(1);
    rover.rotation.y += 0.6;
    await s.wait(1);
    s.moveTo(rover, 30, 40, 14).catch(() => {});
    await s.say('ch3_goodbye');
    await s.say('ch3_grounded');
    await s.wait(2);
    await s.shot('mars_to_space');
    ctx.next();
  },

  tick(dt, s, ctx) {
    const heli = s.controller;
    if (!heli) return;
    if (!heli.flying && !heli.broken && heli.spin === 0) heli.battery = Math.min(1, heli.battery + dt / 20); // sun recharges on the ground
    if (heli.recharging && s.controls) ctx.hud.setObjective(`Solar recharge: ${Math.round(heli.battery * 100)}% · lift resumes at 35%`);
    const alt = heli.altitude.toFixed(1) + ' m';
    if (alt !== s.altShown) { s.altShown = alt; ctx.hud.setStat('altitude', alt); }
    const pct = Math.round(heli.battery * 100);
    if (pct !== s.batShown) { s.batShown = pct; s.battery(heli.battery); }
  },
});

// A landing pad: a ring flat on the ground.
function makePad(s, x, z) {
  const ring = s.prop('ring', x, z);
  ring.rotation.x = Math.PI / 2;
  ring.position.y += 0.08;
  ring.userData.pad = true;
  return { x, z, ring, dispose() { ring.visible = false; ring.userData.pad = false; } };
}

// Wait for a gentle landing on the pad. Landing elsewhere is allowed; the player lifts off again.
// Resolves with { battery } at the moment of landing.
async function land(s, ctx, pad, text) {
  const heli = s.controller;
  ctx.navigation.set(pad.x, pad.z, 'Landing pad', { radius: 2.6, arrival: 'Let go of Space to land' });
  ctx.hud.setObjective(text);
  await s.until(() => {
    const p = heli.position;
    const onPad = Math.hypot(p.x - pad.x, p.z - pad.z) < 2.6;
    if (!heli.flying && !onPad && heli.spin === 0) ctx.hud.setObjective('Not on the pad. Hold Space to lift off again');
    else if (heli.flying) {
      const d = Math.round(Math.hypot(p.x - pad.x, p.z - pad.z));
      ctx.hud.setObjective(d > 3 ? `${text} · ${d} m` : text);
    }
    return onPad && !heli.flying && heli.speed < 0.6;
  });
  ctx.navigation.clear();
  const battery = heli.battery;
  ctx.hud.setObjective('');
  s.hero.setEmotion('happy');
  return { battery };
}

// The big rover's planned route, drawn on the ground through a list of points.
// avoid(x, z, r) moves the road out of a marked danger of radius r, so the line visibly swings round it.
function makeRoute(s, start) {
  const points = start.map((p) => [...p]);
  let line = null;
  const mat = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 1.2, gapSize: 0.8, transparent: true, opacity: 0.85 });

  function draw() {
    if (line) { line.parent?.remove(line); line.geometry.dispose(); }
    const pts = [];
    for (let i = 0; i < points.length - 1; i++) {
      const [ax, az] = points[i], [bx, bz] = points[i + 1];
      const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 2);
      for (let k = 0; k < n; k++) {
        const x = ax + ((bx - ax) * k) / n, z = az + ((bz - az) * k) / n;
        pts.push(new THREE.Vector3(x, s.ground(x, z) + 0.15, z));
      }
    }
    const [lx, lz] = points[points.length - 1];
    pts.push(new THREE.Vector3(lx, s.ground(lx, lz) + 0.15, lz));
    line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
    line.computeLineDistances();
    s.add(line);
  }
  draw();

  return {
    avoid(x, z, r = 8) {
      // The road point inside the danger (or the nearest one) moves sideways, out past its edge.
      let best = 1, bestD = Infinity;
      for (let i = 1; i < points.length - 1; i++) {
        const d = Math.hypot(points[i][0] - x, points[i][1] - z);
        if (d < bestD) { bestD = d; best = i; }
      }
      const [px, pz] = points[best - 1], [nx, nz] = points[best + 1];
      const len = Math.hypot(nx - px, nz - pz) || 1;
      const side = [-(nz - pz) / len, (nx - px) / len]; // across the road
      points[best] = [x + side[0] * (r + 6), z + side[1] * (r + 6)];
      draw();
    },
    // Drive the rover prop along the route, one leg after another.
    async drive(rover) {
      for (let i = 1; i < points.length; i++) {
        const [x, z] = points[i];
        const d = Math.hypot(x - rover.position.x, z - rover.position.z);
        await s.moveTo(rover, x, z, Math.max(1, d / 18));
      }
    },
    dispose() { if (line) line.visible = false; },
  };
}
