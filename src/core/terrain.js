// Ground height for physics and gameplay. Owner: Set A.
//
//   heightAt(world, x, z)   -> ground height in metres at that point
//   normalAt(world, x, z)   -> THREE.Vector3 pointing away from the ground
//   conformWorld(env, world) -> temporary: bends Set B's flat ground to match the fallback hills
//
// The real terrain belongs to Set B. As soon as src/world/world.js exports
//   export function heightAt(world, x, z) { ... }
// this file uses it, and the fallback below (and conformWorld) switch off on their own.
// Until then the fallback gives gentle hills, a ridge on the Moon to fly off, and a shallow
// landing crater on Mars, so gameplay can be built and tested now.
import * as THREE from 'three';
import * as World from '../world/world.js';

const fromSetB = () => typeof World.heightAt === 'function';

// ---- fallback terrain (temporary) ----

const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const bump = (d, w) => Math.exp(-(d * d) / (2 * w * w));

// A bowl with a raised rim. d = distance from the centre.
function crater(d, radius, depth) {
  const bowl = d < radius ? depth * ((d / radius) ** 2 - 1) : 0;
  return bowl + depth * 0.35 * bump(d - radius, radius * 0.25);
}

// [x, z, radius, depth]. Kept away from the objective spots in the chapter files.
const MOON_CRATERS = [[-55, 70, 14, 2.2], [60, 110, 18, 3], [-90, -40, 22, 3], [85, -20, 12, 1.6], [10, 175, 16, 2]];
const MARS_CRATERS = [[0, 0, 11, 1.3], [-120, 60, 25, 3], [90, 150, 14, 1.8]];

const FALLBACK = {
  factory: () => 0,
  space: () => 0,
  moon(x, z) {
    let h = 0.9 * Math.sin(x * 0.045 + 1) * Math.cos(z * 0.038) + 0.5 * Math.sin(x * 0.09 + z * 0.07);
    // The first hill on the way to science stop 1: a ridge to fly off in low gravity.
    h += 2.4 * bump(z - 30, 4.5) * bump(x - 12, 28);
    for (const [cx, cz, r, d] of MOON_CRATERS) h += crater(Math.hypot(x - cx, z - cz), r, d);
    return h * smooth(10, 24, Math.hypot(x - 2, z - 2)); // flat landing site around the Lunar Module
  },
  mars(x, z) {
    let h = 0.7 * Math.sin(x * 0.03 + 0.4) * Math.cos(z * 0.027) + 0.35 * Math.sin(x * 0.08 - z * 0.05);
    h *= smooth(8, 30, Math.hypot(x, z)) * smooth(10, 30, Math.hypot(x + 80, z + 80)); // flat at both start spots
    for (const [cx, cz, r, d] of MARS_CRATERS) h += crater(Math.hypot(x - cx, z - cz), r, d);
    return h;
  },
};

export function heightAt(world, x, z) {
  if (fromSetB()) return World.heightAt(world, x, z);
  return (FALLBACK[world] ?? FALLBACK.factory)(x, z);
}

const n = new THREE.Vector3();
export function normalAt(world, x, z, out = n) {
  const e = 0.5;
  const dx = heightAt(world, x + e, z) - heightAt(world, x - e, z);
  const dz = heightAt(world, x, z + e) - heightAt(world, x, z - e);
  return out.set(-dx, 2 * e, -dz).normalize();
}

// Temporary bridge while the fallback is in use: lifts Set B's flat ground mesh and its rocks onto
// the fallback hills so what you see matches what you drive on. Does nothing once Set B ships heightAt.
export function conformWorld(env, world) {
  if (fromSetB() || !env?.group) return;
  env.group.traverse((o) => {
    if (!o.isMesh) return;
    const type = o.geometry?.type;
    if (type === 'PlaneGeometry') {
      const pos = o.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) * 0.3 + heightAt(world, pos.getX(i), pos.getZ(i)));
      pos.needsUpdate = true;
      o.geometry.computeVertexNormals();
    } else if (type === 'IcosahedronGeometry') {
      o.position.y += heightAt(world, o.position.x, o.position.z);
    }
  });
}
