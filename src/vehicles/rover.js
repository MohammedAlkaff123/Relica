// Driving for the Moon rover and Opportunity. Owner: Set A.
//
//   const rover = createRover({ body, hero, world, tuning, input })
//   rover.update(dt)      player drives: W/S drive, A/D turn, Space hops
//   rover.idle(dt)        no player control: rolls to a stop
//   rover.speed           metres per second, always positive
//   rover.speedScale      0..1+ multiplier set by chapters (dust, storm, free drive)
//   rover.grounded        true when the wheels touch the ground
//   rover.turnToward(x, z, dt)   scripted: turn on the spot toward a point; returns true when facing it
//
// How it works: the physics body is a rounded box that only turns left and right, so it can never
// flip over. The controller sets its forward speed; gravity and the terrain do the rest, so it
// climbs hills and leaves the ground on crests. Lean and pitch are faked on the visible model
// (physics link "tilt"), sampled from the ground under the four corners. Rapier's ray-cast vehicle
// was not used: the box version is stable in Moon gravity and needs no suspension tuning.
import * as THREE from 'three';
import { heightAt } from '../core/terrain.js';
import { tiltOf } from '../core/physics.js';
import { findWheels } from './wheels.js';

const q = new THREE.Quaternion();
const forward = new THREE.Vector3();
const e = new THREE.Euler();
const MAX_TILT = THREE.MathUtils.degToRad(28);

export function createRover({ body, hero, world, tuning, input }) {
  const half = hero.half;
  const wheels = findWheels(hero);
  const tilt = tiltOf(body);
  let speed = 0;      // signed, along the rover's nose
  let turnNow = 0;    // smoothed steering
  let pitch = 0, roll = 0;
  let grounded = true;
  let lastAccel = 0;

  function sense() {
    const p = body.translation();
    const ground = heightAt(world, p.x, p.z);
    grounded = p.y - half[1] - ground < 0.18;
    return p;
  }

  function apply(dt, drive, turn, hop) {
    const t = tuning.rover;
    const p = sense();
    const r = body.rotation();
    q.set(r.x, r.y, r.z, r.w);
    forward.set(0, 0, 1).applyQuaternion(q);
    forward.y = 0; forward.normalize();

    // Speed builds and fades. Braking (pressing against the motion) is twice as strong.
    const top = t.speed * controller.speedScale;
    const want = drive * top;
    const braking = Math.sign(want) !== Math.sign(speed) && Math.abs(speed) > 0.2;
    const rate = (braking ? 2 : drive ? 1 : 0.7) * t.accel * (grounded ? 1 : 0.15);
    const before = speed;
    speed += (want - speed) * Math.min(1, rate * dt);
    if (Math.abs(speed) > Math.abs(top) && grounded) speed = Math.sign(speed) * Math.abs(top);
    lastAccel = (speed - before) / Math.max(dt, 1e-4);

    // Turning: fuller the faster it goes, gentle on the spot, weak in the air.
    turnNow += (turn - turnNow) * Math.min(1, 8 * dt);
    const move = THREE.MathUtils.clamp(Math.abs(speed) / 2, 0.4, 1);
    const dir = speed < -0.2 ? -1 : 1;
    const yawRate = turnNow * t.turn * move * dir * (grounded ? 1 : 0.3);

    const v = body.linvel();
    let vy = v.y;
    if (hop && grounded) vy = t.hop;
    if (grounded) body.setLinvel({ x: forward.x * speed, y: vy, z: forward.z * speed }, true);
    else body.setLinvel({ x: v.x + (forward.x * speed - v.x) * 0.02, y: vy, z: v.z + (forward.z * speed - v.z) * 0.02 }, true);
    body.setAngvel({ x: 0, y: yawRate, z: 0 }, true);

    // Visible lean and pitch, from the ground under the rover.
    if (tilt) {
      let wantPitch = 0, wantRoll = 0;
      if (grounded) {
        const sx = forward.z, sz = -forward.x; // the model's local +x axis, on the ground
        const hf = heightAt(world, p.x + forward.x * half[2], p.z + forward.z * half[2]);
        const hb = heightAt(world, p.x - forward.x * half[2], p.z - forward.z * half[2]);
        const hPlusX = heightAt(world, p.x + sx * half[0], p.z + sz * half[0]);
        const hMinusX = heightAt(world, p.x - sx * half[0], p.z - sz * half[0]);
        wantPitch = -Math.atan2(hf - hb, half[2] * 2);   // rotating +x around x tips the nose down
        wantRoll = Math.atan2(hPlusX - hMinusX, half[0] * 2); // rotating +z around z lifts the +x side
        wantPitch += THREE.MathUtils.clamp(-lastAccel * 0.012, -0.06, 0.06); // nose lifts when speeding up
        wantRoll += turnNow * Math.abs(speed) * 0.012 * dir;                 // leans out of the turn
      } else {
        wantPitch = THREE.MathUtils.clamp(-vy * 0.03, -0.2, 0.2); // nose follows the arc in the air
      }
      const k = 1 - Math.exp(-(grounded ? 10 : 2) * dt);
      pitch += (THREE.MathUtils.clamp(wantPitch, -MAX_TILT, MAX_TILT) - pitch) * k;
      roll += (THREE.MathUtils.clamp(wantRoll, -MAX_TILT, MAX_TILT) - roll) * k;
      tilt.setFromEuler(e.set(pitch, 0, roll, 'YXZ'));
    }

    wheels.roll(grounded ? speed * dt : speed * dt * 0.5, turnNow);
  }

  const controller = {
    speedScale: 1,
    update(dt) {
      const drive = (input.down('KeyW', 'ArrowUp') ? 1 : 0) - (input.down('KeyS', 'ArrowDown') ? 1 : 0);
      const turn = (input.down('KeyA', 'ArrowLeft') ? 1 : 0) - (input.down('KeyD', 'ArrowRight') ? 1 : 0);
      apply(dt, drive, turn, input.pressed('Space'));
    },
    idle(dt) { apply(dt, 0, 0, false); },
    turnToward(x, z, dt) {
      const p = body.translation();
      const r = body.rotation();
      q.set(r.x, r.y, r.z, r.w);
      forward.set(0, 0, 1).applyQuaternion(q);
      const want = Math.atan2(x - p.x, z - p.z);
      const now = Math.atan2(forward.x, forward.z);
      const diff = Math.atan2(Math.sin(want - now), Math.cos(want - now));
      apply(dt, 0, THREE.MathUtils.clamp(diff * 2, -1, 1), false);
      return Math.abs(diff) < 0.05;
    },
    // Put the rover somewhere at once (used by pitch-mode jumps and restarts).
    place(x, z, yaw = 0) {
      body.setTranslation({ x, y: heightAt(world, x, z) + half[1] + 0.05, z }, true);
      body.setRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      speed = 0;
    },
    get speed() { return Math.abs(speed); },
    get grounded() { return grounded; },
  };
  return controller;
}
