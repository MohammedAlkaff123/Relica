// A camera-relative compass: up is ahead, down is behind, even when a goal is off screen.
import * as THREE from 'three';
import { el } from './dom.js';

export function createNavigation(root, camera) {
  const box = el('div', 'navigation hidden', root);
  box.setAttribute('role', 'status');
  const dial = el('div', 'navigation-dial', box);
  const arrow = el('span', 'navigation-arrow', dial, '↑');
  arrow.setAttribute('aria-hidden', 'true');
  const words = el('div', '', box);
  const name = el('div', 'navigation-name', words);
  const detail = el('div', 'navigation-detail', words);
  const forward = new THREE.Vector3(), right = new THREE.Vector3(), delta = new THREE.Vector3();
  let target = null;
  return {
    set(x, z, text, { radius = 2, arrival = 'You are here' } = {}) {
      target = { x, z, text, radius, arrival };
      name.textContent = text;
    },
    clear() { target = null; box.classList.add('hidden'); },
    get target() { return target; },
    update(hero, enabled) {
      const covered = root.querySelector('.card:not(.hidden), .memory:not(.hidden), .dialogue:not(.hidden), .credits:not(.hidden)');
      box.classList.toggle('hidden', !target || !hero || !enabled || !!covered);
      if (!target || !hero || !enabled) return;
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 0.0001) forward.set(0, 0, 1).applyQuaternion(hero.quaternion).setY(0);
      forward.normalize();
      right.crossVectors(forward, THREE.Object3D.DEFAULT_UP).normalize();
      delta.set(target.x - hero.position.x, 0, target.z - hero.position.z);
      const distance = delta.length();
      const angle = Math.atan2(delta.dot(right), delta.dot(forward));
      const arrived = distance <= target.radius;
      arrow.textContent = arrived ? '◎' : '↑';
      arrow.style.transform = `rotate(${arrived ? 0 : angle}rad)`;
      const bearing = Math.abs(angle) > 2.35 ? 'Behind you' : angle > 0.6 ? 'To your right' : angle < -0.6 ? 'To your left' : 'Ahead';
      detail.textContent = arrived ? target.arrival : `${Math.round(distance)} m · ${bearing}`;
      box.setAttribute('aria-label', `${target.text}: ${detail.textContent}`);
    },
  };
}
