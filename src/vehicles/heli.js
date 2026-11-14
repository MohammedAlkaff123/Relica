// Placeholder flying for Ingenuity: hold Space to climb, W/S fly forward and back, A/D turn.
// Lift is an upward push that has to beat the world's gravity, so it feels different on each world.
// TODO Set A: battery per flight, rotor spin-up delay, landing detection, crash on the last flight.
// Keep the same shape: createHeli(...) returns { update(dt), idle(dt), flying }.
import * as THREE from 'three';

const q = new THREE.Quaternion();
const forward = new THREE.Vector3();

export function createHeli(body, halfHeight, tuning, input, character) {
  let rotor = 0; // 0..1, how fast the blades spin

  function apply(dt, lift, drive, turn) {
    const t = tuning.heli;
    const r = body.rotation();
    q.set(r.x, r.y, r.z, r.w);
    forward.set(0, 0, 1).applyQuaternion(q);
    const v = body.linvel();
    const airborne = body.translation().y > halfHeight + 0.08;
    const move = airborne ? drive * t.speed : 0;
    body.setLinvel({ x: forward.x * move, y: v.y + lift * t.lift * dt, z: forward.z * move }, true);
    body.setAngvel({ x: 0, y: turn * t.turn, z: 0 }, true);
    rotor += ((lift > 0 ? 1 : airborne ? 0.6 : 0) - rotor) * Math.min(1, 3 * dt);
    if (character) character.rotorSpeed = rotor * 40;
  }

  return {
    update(dt) {
      const drive = (input.down('KeyW', 'ArrowUp') ? 1 : 0) - (input.down('KeyS', 'ArrowDown') ? 1 : 0);
      const turn = (input.down('KeyA', 'ArrowLeft') ? 1 : 0) - (input.down('KeyD', 'ArrowRight') ? 1 : 0);
      apply(dt, input.down('Space') ? 1 : 0, drive, turn);
    },
    idle(dt) { apply(dt, 0, 0, 0); },
    get flying() { return body.translation().y > halfHeight + 0.08; },
  };
}
