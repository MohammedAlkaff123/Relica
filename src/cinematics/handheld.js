// Handheld camera sway. Call it AFTER the camera has been aimed for this frame.
// deg   = how far it wanders, in degrees (0.3 is calm, 1.0 is nervous)
// speed = roughly how many sways per second
// Owner: Moayad.
import * as THREE from 'three';

function wobble(t, speed, rate, offset) {
  const a = t * speed * Math.PI * 2 * rate + offset;
  return Math.sin(a) * 0.6 + Math.sin(a * 2.3 + offset * 1.7) * 0.4;
}

export function handheld(camera, time, deg, speed) {
  if (!deg) return;
  const amount = THREE.MathUtils.degToRad(deg);
  camera.rotateX(amount * wobble(time, speed, 1.0, 0.0));
  camera.rotateY(amount * wobble(time, speed, 0.8, 2.1));
  camera.rotateZ(amount * 0.4 * wobble(time, speed, 0.6, 4.2));
}
