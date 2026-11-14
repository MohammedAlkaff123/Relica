// Flying for Ingenuity. Owner: Set A.
//
//   const heli = createHeli({ body, hero, world, tuning, input })
//   heli.update(dt) / heli.idle(dt)
//   heli.altitude, heli.flying, heli.speed
//   heli.battery        0..1, drains while the rotor turns; at 0 there is no more lift
//   heli.spin           0..1 rotor spin-up. Lift starts only at 1 (hold Space ~1.5 s from rest)
//   heli.drift          { x, z, tilt }: a push the player cannot fully fight (the last flight)
//   heli.noLift         true forces it down (used to force the last landing)
//   heli.broken         after the crash: Space only makes the rotor twitch
//   heli.holdAt         metres, or null: hover at that height on its own (while a shot plays)
//
// Controls: hold Space to spin up and climb, let go to sink. W/S fly forward and back, A/D turn.
// Lift is an upward push that has to beat the world's gravity, so it feels different on each world.
// Optional numbers in content/tuning.json "heli": spinUp (s), drain (battery per second), damping.
import * as THREE from 'three';
import { heightAt } from '../core/terrain.js';
import { tiltOf } from '../core/physics.js';

const q = new THREE.Quaternion();
const forward = new THREE.Vector3();
const e = new THREE.Euler();

export function createHeli({ body, hero, world, tuning, input }) {
  const half = hero.half;
  const tilt = tiltOf(body);
  let rotor = 0;     // visual blade speed 0..1
  let pitch = 0, roll = 0;
  let twitch = 0;

  function altitude() {
    const p = body.translation();
    return p.y - half[1] - heightAt(world, p.x, p.z);
  }

  function apply(dt, lift, drive, turn) {
    const t = tuning.heli;
    const spinUp = t.spinUp ?? 1.5;
    const alt = altitude();
    const airborne = alt > 0.08;

    // Rotor spin-up. On the ground it has to reach full speed before it lifts.
    if (heli.broken) {
      if (lift && twitch <= 0) twitch = 0.5;
      lift = 0;
      heli.spin = 0;
    } else if (lift && heli.battery > 0) heli.spin = Math.min(1, heli.spin + dt / spinUp);
    else if (!airborne) heli.spin = Math.max(0, heli.spin - dt / spinUp);
    const canLift = lift && heli.spin >= 1 && heli.battery > 0 && !heli.noLift;

    if (heli.spin > 0 || airborne) heli.battery = Math.max(0, heli.battery - (t.drain ?? 1 / 45) * dt * (canLift ? 1 : 0.4));

    const r = body.rotation();
    q.set(r.x, r.y, r.z, r.w);
    forward.set(0, 0, 1).applyQuaternion(q);
    forward.y = 0; forward.normalize();
    const v = body.linvel();
    const move = airborne ? drive * t.speed : 0;
    const damp = Math.exp(-(t.damping ?? 0.8) * dt); // thin air still slows a little
    let vy = v.y * (airborne ? damp : 1) + (canLift ? t.lift * dt : 0);
    if (heli.holdAt != null && airborne) vy = (heli.holdAt - alt) * 1.5; // scripted hover during a shot
    if (heli.noLift && airborne) vy = Math.min(vy, -1.2); // forced down, hard
    const d = airborne ? heli.drift : { x: 0, z: 0 };
    body.setLinvel({ x: forward.x * move + d.x, y: vy, z: forward.z * move + d.z }, true);
    body.setAngvel({ x: 0, y: turn * t.turn * (airborne || heli.spin > 0.5 ? 1 : 0.3), z: 0 }, true);

    // Blades: a blur while lifting, slower while sinking, a short twitch when broken.
    twitch = Math.max(0, twitch - dt);
    const wantRotor = heli.holdAt != null ? 1 : heli.broken ? (twitch > 0 ? 0.35 : 0) : canLift ? 1 : heli.spin * (airborne ? 0.8 : 1);
    rotor += (wantRotor - rotor) * Math.min(1, 4 * dt);
    hero.rotorSpeed = rotor * 40;

    // Lean into the direction of travel, and with the drift.
    if (tilt) {
      const wantPitch = airborne ? drive * 0.18 : 0;
      const wantRoll = airborne ? (heli.drift.tilt ?? 0) : heli.broken ? 0.35 : 0;
      const k = 1 - Math.exp(-4 * dt);
      pitch += (wantPitch - pitch) * k;
      roll += (wantRoll - roll) * k;
      tilt.setFromEuler(e.set(pitch, 0, roll, 'YXZ'));
    }
  }

  const heli = {
    battery: 1,
    spin: 0,
    drift: { x: 0, z: 0, tilt: 0 },
    noLift: false,
    broken: false,
    holdAt: null,     // a height in metres: hover there on its own (used while a shot plays)
    update(dt) {
      const drive = (input.down('KeyW', 'ArrowUp') ? 1 : 0) - (input.down('KeyS', 'ArrowDown') ? 1 : 0);
      const turn = (input.down('KeyA', 'ArrowLeft') ? 1 : 0) - (input.down('KeyD', 'ArrowRight') ? 1 : 0);
      apply(dt, input.down('Space') ? 1 : 0, drive, turn);
    },
    idle(dt) { apply(dt, 0, 0, 0); },
    place(x, z, yaw = 0, height = 0) {
      body.setTranslation({ x, y: heightAt(world, x, z) + half[1] + 0.05 + height, z }, true);
      body.setRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    },
    get altitude() { return Math.max(0, altitude()); },
    get flying() { return altitude() > 0.08; },
    get speed() { const v = body.linvel(); return Math.hypot(v.x, v.z); },
    get position() { return body.translation(); },
  };
  return heli;
}
