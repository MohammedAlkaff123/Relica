// A camera-relative compass: the top of the dial is straight ahead, the bottom is behind you.
// A copper dot sits on the ring in the direction of the goal; when you arrive it moves to the centre.
// Owner: Set C (the goal positions come from Set A's objectives).
import * as THREE from 'three';
import { el } from './dom.js';
import { prefs } from './prefs.js';
import { translate } from './i18n.js';

export function createNavigation(root, camera) {
  const box = el('div', 'navigation hidden', root);
  box.setAttribute('role', 'status');
  const dial = el('div', 'compass', box);
  el('span', 'compass-ahead', dial);
  const dot = el('span', 'compass-dot', dial);
  dot.setAttribute('aria-hidden', 'true');
  const words = el('div', 'navigation-words', box);
  const name = el('div', 'navigation-name', words);
  const detail = el('div', 'navigation-detail', words);
  const forward = new THREE.Vector3(), right = new THREE.Vector3(), delta = new THREE.Vector3();
  let target = null;
  let lastDetail = '';

  prefs.subscribe(() => { if (target) name.textContent = translate(target.text); lastDetail = ''; });

  return {
    set(x, z, text, { radius = 2, arrival = 'You are here' } = {}) {
      target = { x, z, text, radius, arrival };
      name.textContent = translate(text);
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
      // The dot travels on the ring; 0 rad is the top of the dial (ahead), positive is to the right.
      const r = arrived ? 0 : 19;
      dot.style.transform = `translate(${(Math.sin(angle) * r).toFixed(1)}px, ${(-Math.cos(angle) * r).toFixed(1)}px)`;
      box.classList.toggle('arrived', arrived);
      const bearing = Math.abs(angle) > 2.35 ? 'Behind you' : angle > 0.6 ? 'To your right' : angle < -0.6 ? 'To your left' : 'Ahead';
      const text = arrived ? translate(target.arrival) : `${Math.round(distance)} ${prefs.language === 'ar' ? 'م' : 'm'} · ${translate(bearing)}`;
      if (text !== lastDetail) {
        detail.textContent = text;
        lastDetail = text;
        box.setAttribute('aria-label', `${translate(target.text)}: ${text}`);
      }
    },
  };
}
