// Finds a character's wheels so the controllers can spin and steer them. Owner: Set A.
//
// Preferred: Set B puts the wheel objects on the character as `hero.wheels` (front wheels first is
// not required; front = larger z) and the radius as `hero.wheelRadius`.
// Until then: the box characters build four wheels from one shared cylinder, so we look for a
// cylinder geometry used by exactly four direct children of the model.
export function findWheels(hero) {
  let list = hero.wheels;
  let radius = hero.wheelRadius;
  if (!list) {
    const byGeo = new Map();
    for (const child of hero.object.children) {
      if (child.isMesh && child.geometry?.type === 'CylinderGeometry') {
        if (!byGeo.has(child.geometry)) byGeo.set(child.geometry, []);
        byGeo.get(child.geometry).push(child);
      }
    }
    for (const [geo, meshes] of byGeo) {
      if (meshes.length === 4) { list = meshes; radius = radius ?? geo.parameters.radiusTop; break; }
    }
  }
  list = list ?? [];
  radius = radius || 0.3;
  for (const w of list) w.rotation.order = 'YXZ'; // steer around y first, then spin around x
  const front = list.filter((w) => w.position.z > 0);

  return {
    count: list.length,
    // distance: metres rolled since last call (negative = backwards). steer: -1..1.
    roll(distance, steer = 0) {
      for (const w of list) w.rotation.x += distance / radius;
      for (const w of front) w.rotation.y += (steer * 0.45 - w.rotation.y) * 0.25;
    },
  };
}
