// Chapter 3: the Mars sky. 2:30. Ingenuity, Jezero crater, 2021 to 2024. Beat sheet: STORY.md section 2.
// Owner: Set A.
//
// drops from under the big rover -> flight 1: spin up (hold Space 1.5 s), climb to 3 m, hover 3 s, land
// on the pad -> flights 2 and 3: four rings each while the big rover follows below -> counter montage
// to 71 -> flight 72: growing drift and tilt, forced hard landing, a blade breaks
// -> Space only twitches the rotor -> the big rover drives on -> cutscene 3
// Pitch-mode jump: 'flight72' (key 9).
//
// Waiting on others (works without them):
//   dialogue ch3_scout, ch3_crash, ch3_goodbye (Set C)   shots heli_drop, last_flight (Moayad)
//   props perseverance, ring, hero.breakBlade() (Set B)
//   facts.json "missions" (Set C): the numbers in MISSION below are the plan's, not yet verified.
import * as THREE from 'three';
import { makeChapter } from './_stage.js';

// From PLAN.md section 12. Replace with facts.missions.ingenuity once Set C has verified them.
const MISSION = { planned: 5, total: 72, firstFlight: 'Apr 2021', lastFlight: 'Jan 2024' };

const START = [-80, -80];
const RINGS = [
  [[-80, -66, 3.5], [-74, -54, 4.5], [-64, -46, 4], [-52, -42, 3.5]],
  [[-40, -38, 4], [-30, -30, 5], [-24, -18, 4.5], [-22, -6, 3.5]],
];
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
    const showFlight = () => s.counter('flight', flight, MISSION.planned);
    ctx.hud.setStat('date', MISSION.firstFlight);

    if (opts.jump !== 'flight72') {
      await s.card('The Mars Sky', `Jezero crater · planned: ${MISSION.planned} flights`);
      // A tiny machine drops from under the big rover, which backs away.
      heli.place(START[0], START[1], 0, 0.6);
      s.hero.setEmotion('scared');
      const drop = s.shot('heli_drop');
      await s.wait(1);
      await s.moveTo(rover, START[0], START[1] - 7, 3, { face: false });
      await drop;
      await s.say('ch3_intro');

      // Flight 1: spin up, climb to 3 m, hover, land.
      showFlight();
      s.unlockControls();
      ctx.hud.setObjective('Hold Space to spin up the rotor');
      await s.until(() => heli.spin >= 1);
      ctx.hud.setObjective('Keep holding Space: climb to 3 metres');
      await s.until(() => heli.altitude >= 2.8);
      s.hero.setEmotion('happy');
      let hover = 0;
      await s.until((dt) => {
        if (heli.altitude > 1.8 && heli.altitude < 5) hover += dt;
        ctx.hud.setObjective(`Hover: tap Space to stay up  ${Math.max(0, 3 - hover).toFixed(1)} s`);
        return hover >= 3;
      });
      await land(s, ctx, pad, 'Let go of Space to land on the pad');
      await s.photo('PIA23882');

      // Flights 2 and 3: rings, while the big rover follows the road below.
      await s.say('ch3_scout');
      for (const rings of RINGS) {
        flight++;
        showFlight();
        heli.battery = 1;
        s.unlockControls();
        await flyRings(s, ctx, rings, rover);
        const last = rings[rings.length - 1];
        pad.dispose();
        pad = makePad(s, last[0] + 3, last[1] + 3);
        await land(s, ctx, pad, 'Land on the pad');
      }

      // Montage: the counter passes 5 and keeps going.
      s.lockControls();
      await s.fade(true, 0.8);
      await s.until((dt) => { flight = Math.min(MISSION.total - 1, flight + dt * 30); showFlight(); return flight >= MISSION.total - 1; });
      flight = MISSION.total - 1;
      showFlight();
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
    ctx.audio.play?.('crash');
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
  return { x, z, ring, dispose() { ring.visible = false; } };
}

// Wait for a gentle landing on the pad. Landing elsewhere is allowed; the player lifts off again.
function land(s, ctx, pad, text) {
  const heli = s.controller;
  ctx.hud.setObjective(text);
  return s.until(() => {
    const p = heli.position;
    const onPad = Math.hypot(p.x - pad.x, p.z - pad.z) < 2.6;
    if (!heli.flying && !onPad && heli.spin === 0) ctx.hud.setObjective('Not on the pad. Hold Space to lift off again');
    else if (heli.flying) ctx.hud.setObjective(text);
    return onPad && !heli.flying && heli.speed < 0.6;
  }).then(() => { ctx.hud.setObjective(''); s.hero.setEmotion('happy'); });
}

// Dim or light a ring (works for a single mesh or a model from Set B).
function glow(object, opacity) {
  object.traverse((o) => { if (o.material) { o.material.transparent = true; o.material.opacity = opacity; } });
}

// Fly through each ring in order. The current ring glows; the big rover drives to each one passed.
async function flyRings(s, ctx, rings, rover) {
  const heli = s.controller;
  const meshes = rings.map(([x, z, h]) => {
    const r = s.prop('ring', x, z);
    r.position.y += h;
    r.userData.target = true;
    glow(r, 0.25);
    return r;
  });
  for (let i = 0; i < rings.length; i++) {
    const ring = meshes[i];
    glow(ring, 1);
    // Face the ring toward where the helicopter comes from, so it is easy to fly through.
    const prev = i ? rings[i - 1] : [heli.position.x, heli.position.z];
    ring.rotation.y = Math.atan2(rings[i][0] - prev[0], rings[i][1] - prev[1]);
    ctx.hud.setObjective(`Fly through the rings  ${i + 1} / ${rings.length}`);
    const c = new THREE.Vector3();
    await s.until(() => {
      ring.getWorldPosition(c);
      const p = heli.position;
      return Math.hypot(p.x - c.x, p.y - c.y, p.z - c.z) < 2;
    });
    ring.visible = false;
    ctx.audio.play?.('ring');
    s.moveTo(rover, rings[i][0] + 2, rings[i][1] - 2, 4).catch(() => {});
  }
}
