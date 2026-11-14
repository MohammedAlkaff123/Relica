// Spins and steers a character's wheels. Owner: Set A.
//
// Set B's characters list their wheel parts in hero.wheels (parts named "wheel_..."). The model loads
// after the chapter starts, so the wheels are looked up again until they appear. The box stand-in
// builds its wheels from one shared cylinder; those are found by that shape instead.
import * as THREE from 'three';

const box = new THREE.Box3();
const size = new THREE.Vector3();

function lookUp(hero) {
  if (hero.wheels?.length) {
    box.setFromObject(hero.wheels[0]).getSize(size);
    return { list: hero.wheels, radius: Math.max(0.05, size.y / 2) };
  }
  const byGeo = new Map();
  for (const child of hero.object.children) {
    if (child.isMesh && child.geometry?.type === 'CylinderGeometry') {
      if (!byGeo.has(child.geometry)) byGeo.set(child.geometry, []);
      byGeo.get(child.geometry).push(child);
    }
  }
  for (const [geo, meshes] of byGeo) if (meshes.length === 4) return { list: meshes, radius: geo.parameters.radiusTop };
  return { list: [], radius: 0.3 };
}

export function findWheels(hero) {
  let found = lookUp(hero), front = [], model = hero.model;
  const prepare = () => {
    for (const w of found.list) w.rotation.order = 'YXZ'; // steer around y first, then spin around x
    front = found.list.filter((w) => w.position.z > 0 || /_F/.test(w.name));
  };
  prepare();
  return {
    get count() { return found.list.length; },
    // distance: metres rolled since last call (negative = backwards). steer: -1..1.
    roll(distance, steer = 0) {
      if (hero.model !== model) { model = hero.model; found = lookUp(hero); prepare(); } // the model arrived
      for (const w of found.list) w.rotation.x += distance / found.radius;
      for (const w of front) w.rotation.y += (steer * 0.45 - w.rotation.y) * 0.25;
    },
  };
}
