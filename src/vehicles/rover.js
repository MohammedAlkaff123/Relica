// Placeholder driving for the Moon rover and Opportunity: W/S drive, A/D turn, Space hops.
// It moves a box by setting its speed directly, so it is easy to control but has no wheels or suspension.
// TODO Set A: replace with a real wheeled controller (Rapier has a ray-cast vehicle controller).
// Keep the same shape: createRover(...) returns { update(dt), idle(), speed }.
import * as THREE from 'three';

const q = new THREE.Quaternion();
const forward = new THREE.Vector3();

export function createRover(body, halfHeight, tuning, input) {
  let speed = 0;

  function apply(drive, turn, hop) {
    const t = tuning.rover;
    const r = body.rotation();
    q.set(r.x, r.y, r.z, r.w);
    forward.set(0, 0, 1).applyQuaternion(q);
    const v = body.linvel();
    const grounded = body.translation().y <= halfHeight + 0.06;
    let vy = v.y;
    if (hop && grounded) vy = t.hop;
    body.setLinvel({ x: forward.x * drive, y: vy, z: forward.z * drive }, true);
    body.setAngvel({ x: 0, y: turn * t.turn * (grounded ? 1 : 0.3), z: 0 }, true);
  }

  return {
    update(dt) {
      const t = tuning.rover;
      const drive = (input.down('KeyW', 'ArrowUp') ? 1 : 0) - (input.down('KeyS', 'ArrowDown') ? 1 : 0);
      const turn = (input.down('KeyA', 'ArrowLeft') ? 1 : 0) - (input.down('KeyD', 'ArrowRight') ? 1 : 0);
      speed += (drive * t.speed - speed) * Math.min(1, t.accel * dt);
      apply(speed, turn, input.pressed('Space'));
    },
    // Called while the player has no control (dialogue, cards): roll to a stop.
    idle(dt) {
      speed += (0 - speed) * Math.min(1, tuning.rover.accel * dt);
      apply(speed, 0, false);
    },
    get speed() { return Math.abs(speed); },
  };
}
