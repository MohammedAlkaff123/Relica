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
//   facts.json "missions" (Set C): the numbers in MISSION below are the plan's, not yet verified.
import * as THREE from 'three';
import { makeChapter } from './_stage.js';
import { mission } from './_mission.js';

// From PLAN.md section 12. Replace with facts.missions.ingenuity once Set C has verified them.
const MISSION = { planned: 5, total: 72, firstFlight: 'Apr 2021', lastFlight: 'Jan 2024' };

const START = [-80, -80];
const ROVER_START = [START[0], START[1] - 7];
const DEST = [-18, -4];                      // where the big rover wants to go
// The three dangers sit on the straight road. Marking one bends the route around it.
const DANGERS = [
  { prop: 'sandTrap', name: 'the sand trap', at: [-66, -63], flight: 2 },
  { prop: 'boulders', name: 'the boulder field', at: [-50, -45], flight: 2 },
  { prop: 'cliffEdge', name: 'the cliff edge', at: [-35, -26], flight: 3 },
];
const PADS = { 2: [-48, -54], 3: [-24, -12] }; // where each scouting flight lands
const FAR = [110, 60]; // flight 72 heads out over the smooth sand; too far to reach before the crash

export default makeChapter({
  id: 'sky',
  world: 'mars',
  character: 'ingenuity',
  vehicle: 'heli',
  cameraScale: 0.6,
  start: [START[0], START[1], 0],

  async script(s, ctx, opts) {
    const heli = s.controller;
    const rover = s.prop('perseverance', START[0], START[1], 0);
    let pad = makePad(s, START[0], START[1]);
    let flight = 1;
    const showFlight = () => s.counter('flight', Math.floor(flight), MISSION.planned);
    ctx.hud.setStat('date', MISSION.firstFlight);
    const m = s.mission = mission(ctx, 'Be the eyes', [
      'First flight: hold 3 metres for 3 seconds',
      'Scout the road: mark 3 dangers',
      'Land with battery to spare',
    ]);

    if (opts.jump !== 'flight72') {
      await s.card('The Mars Sky', `Jezero crater · planned: ${MISSION.planned} flights`);
      // A tiny machine drops from under the big rover, which backs away.
      heli.place(START[0], START[1], 0, 0.6);
      s.hero.setEmotion('scared');
      const drop = s.shot('heli_drop');
      await s.wait(1);
      await s.moveTo(rover, ROVER_START[0], ROVER_START[1], 3, { face: false });
      await drop;
      await s.say('ch3_intro');

      // Flight 1: spin up, then hold 3 metres inside the band for 3 seconds, then land.
      showFlight();
      const band = s.prop('heightBand', START[0], START[1]);
      band.position.y += 3;
      s.unlockControls();
      ctx.hud.setObjective('Hold Space to spin up the rotor');
      await s.until(() => heli.spin >= 1);
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
      await s.say('ch3_scout');
      const dangers = DANGERS.map((d) => ({ ...d, object: s.prop(d.prop, d.at[0], d.at[1], 0.4), marked: false }));
      const route = makeRoute(s, ROVER_START, DEST);
      let marked = 0;
      for (const f of [2, 3]) {
        flight = f;
        showFlight();
        heli.battery = 1;
        s.unlockControls();
        for (const d of dangers.filter((x) => x.flight === f)) {
          await s.goTo(d.at[0], d.at[1], `Fly over ${d.name}`, { radius: 5 });
          ctx.hud.setObjective(`Press E above ${d.name} to mark it`);
          await s.until(() => {
            const p = heli.position;
            return heli.flying && ctx.input.pressed('KeyE') && Math.hypot(p.x - d.at[0], p.z - d.at[1]) < 7;
          });
          d.marked = true;
          s.prop('flag', d.at[0], d.at[1]);
          route.avoid(d.at);
          s.sound('mark');
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
      m.discover('ingenuity_72_flights');
      flight = MISSION.total - 1;
      showFlight();
      route.dispose();
    } else {
      await s.fade(true, 0);
    }

    // Flight 72. Smooth sand with nothing to look at. The horizon tips and the controls drift.
    pad.dispose();
    heli.place(-20, 0, 0.8);
    rover.position.set(-14, s.ground(-14, -6), -6);
    flight = MISSION.total;
    showFlight();
    ctx.hud.setStat('date', MISSION.lastFlight);
    heli.battery = 1;
    await s.fade(false, 0.8);
    s.hero.setEmotion('happy');
    s.unlockControls();
    s.goTo(FAR[0], FAR[1], 'Last flight: scout the smooth sand ahead', { radius: 4 }).catch(() => {});
    let air = 0;
    await s.until((dt) => {
      if (heli.flying || air > 0) air += dt; // counts from take-off, even if it lands again
      if (air > 10) {
        const k = Math.min(1, (air - 10) / 6);
        heli.drift.x = 2.6 * k; heli.drift.z = -1.2 * k; heli.drift.tilt = 0.45 * k;
        if (k > 0.3) s.hero.setEmotion('scared');
      }
      if (air > 16) heli.noLift = true;
      return heli.noLift && !heli.flying;
    });
    // Hard landing. A blade tip snaps.
    s.objectives.dispose();
    heli.drift.x = heli.drift.z = heli.drift.tilt = 0;
    heli.broken = true;
    s.hero.breakBlade?.();
    s.sound('crash');
    s.hero.setEmotion('sad');
    await s.shot('last_flight');
    await s.say('ch3_crash');

    // On the sand. Space only makes the rotor twitch. Nothing else.
    let tries = 0, down = false;
    await s.until(() => {
      const now = ctx.input.down('Space');
      if (now && !down) tries++;
      down = now;
      return tries >= 2;
    });
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
  const battery = heli.battery;
  ctx.hud.setObjective('');
  s.hero.setEmotion('happy');
  return { battery };
}

// The big rover's planned route, drawn on the ground. avoid(point) bends it around a marked danger.
function makeRoute(s, from, to) {
  const points = [from, to];
  let line = null;
  const mat = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 1.2, gapSize: 0.8, transparent: true, opacity: 0.8 });

  function draw() {
    if (line) { line.parent?.remove(line); line.geometry.dispose(); }
    const pts = [];
    for (let i = 0; i < points.length - 1; i++) {
      const [ax, az] = points[i], [bx, bz] = points[i + 1];
      const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 2);
      for (let k = 0; k < n; k++) {
        const x = ax + ((bx - ax) * k) / n, z = az + ((bz - az) * k) / n;
        pts.push(new THREE.Vector3(x, s.ground(x, z) + 0.12, z));
      }
    }
    pts.push(new THREE.Vector3(to[0], s.ground(to[0], to[1]) + 0.12, to[1]));
    line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
    line.computeLineDistances();
    s.add(line);
  }
  draw();

  return {
    // Insert a detour point to the side of the danger, on the segment it sits on.
    avoid([x, z]) {
      let best = 0, bestD = Infinity;
      for (let i = 0; i < points.length - 1; i++) {
        const [ax, az] = points[i], [bx, bz] = points[i + 1];
        const d = Math.hypot((ax + bx) / 2 - x, (az + bz) / 2 - z);
        if (d < bestD) { bestD = d; best = i; }
      }
      const [ax, az] = points[best], [bx, bz] = points[best + 1];
      const len = Math.hypot(bx - ax, bz - az) || 1;
      const side = [-(bz - az) / len, (bx - ax) / len]; // perpendicular to the road
      points.splice(best + 1, 0, [x + side[0] * 10, z + side[1] * 10]);
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
