// Cutscene player. Owner: Moayad.
//
//   await ctx.cinematics.play('moon_to_mars', anchorObject)
//
// Reads content/shots/<id>.json:
//   {
//     "letterbox": true,            black bars top and bottom
//     "years": [1972, 2004],        optional counter that ticks during the shot
//     "keys": [                     camera keyframes, in seconds
//       { "t": 0, "pos": [x,y,z], "look": [x,y,z], "fov": 55, "shake": 0.6 }
//     ]
//   }
// pos and look are measured from where the anchor object stands when the shot starts.
// The camera eases between keys. Escape skips the shot.
//
// TODO Moayad: focus pull (depth of field), cut-on-motion into the next chapter, fades.
import * as THREE from 'three';
import { handheld } from './handheld.js';
import { loadJSON } from '../core/content.js';
import { el } from '../ui/dom.js';

const a = new THREE.Vector3();
const b = new THREE.Vector3();
const ease = (u) => u * u * (3 - 2 * u);

export function createCinematics({ camera, followCam, tuning, root }) {
  const bars = el('div', 'bars hidden', root);
  const years = el('div', 'years hidden', root);
  const cache = {};
  let active = null;
  let clock = 0;

  async function play(id, anchor) {
    if (!cache[id]) cache[id] = await loadJSON(`content/shots/${id}.json`);
    const shot = cache[id];
    if (active) finish();
    followCam.enabled = false;
    root.classList.add('cinema'); // hides the HUD while the shot plays
    bars.classList.toggle('hidden', !shot.letterbox);
    years.classList.toggle('hidden', !shot.years);
    return new Promise((resolve) => {
      active = {
        shot, resolve, t: 0,
        origin: anchor ? anchor.position.clone() : new THREE.Vector3(),
        end: shot.keys[shot.keys.length - 1].t,
      };
    });
  }

  function finish() {
    if (!active) return;
    const { resolve } = active;
    active = null;
    root.classList.remove('cinema');
    bars.classList.add('hidden');
    years.classList.add('hidden');
    followCam.enabled = true;
    followCam.snap();
    resolve();
  }

  function update(dt) {
    clock += dt;
    if (!active) return;
    active.t += dt;
    const { shot, origin, end } = active;
    const t = Math.min(active.t, end);
    const keys = shot.keys;
    let i = 0;
    while (i < keys.length - 2 && t > keys[i + 1].t) i++;
    const k0 = keys[i], k1 = keys[Math.min(i + 1, keys.length - 1)];
    const span = Math.max(k1.t - k0.t, 1e-6);
    const u = ease(THREE.MathUtils.clamp((t - k0.t) / span, 0, 1));

    camera.position.copy(a.fromArray(k0.pos).lerp(b.fromArray(k1.pos), u)).add(origin);
    a.fromArray(k0.look).lerp(b.fromArray(k1.look), u).add(origin);
    camera.lookAt(a);
    camera.fov = THREE.MathUtils.lerp(k0.fov ?? 55, k1.fov ?? 55, u);
    camera.updateProjectionMatrix();
    handheld(camera, clock, THREE.MathUtils.lerp(k0.shake ?? 0, k1.shake ?? 0, u), tuning.camera.shakeSpeed);

    if (shot.years) years.textContent = Math.round(THREE.MathUtils.lerp(shot.years[0], shot.years[1], ease(t / end)));
    if (active.t >= end) finish();
  }

  return { play, update, cancel: finish, get playing() { return !!active; } };
}
