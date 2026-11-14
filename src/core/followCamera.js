// Third-person gameplay camera: sits behind the target on a soft spring, with a little handheld sway.
// Numbers come from content/tuning.json -> "camera". Tune them in the panel (press `).
import * as THREE from 'three';
import { handheld } from '../cinematics/handheld.js';

export function createFollowCamera(camera, tuning) {
  const want = new THREE.Vector3();
  const look = new THREE.Vector3();
  const back = new THREE.Vector3();
  let target = null;
  let scale = 1;
  let snap = true;
  let time = 0;

  return {
    enabled: true,
    // scale shrinks or grows the camera distance for small or large machines
    setTarget(object, s = 1) { target = object; scale = s; snap = true; },
    snap() { snap = true; },
    update(dt) {
      time += dt;
      if (!this.enabled || !target) return;
      const t = tuning.camera;
      back.set(0, 0, -1).applyQuaternion(target.quaternion);
      back.y = 0;
      if (back.lengthSq() < 1e-6) back.set(0, 0, -1);
      back.normalize();
      want.copy(target.position).addScaledVector(back, t.distance * scale);
      want.y += t.height * scale;
      if (snap) { camera.position.copy(want); snap = false; }
      else camera.position.lerp(want, 1 - Math.exp(-t.lag * dt));
      look.copy(target.position);
      look.y += 0.8 * scale;
      camera.lookAt(look);
      if (camera.fov !== t.fov) { camera.fov = t.fov; camera.updateProjectionMatrix(); }
      handheld(camera, time, t.shakeDeg, t.shakeSpeed);
    },
  };
}
