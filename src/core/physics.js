// Thin wrapper around Rapier. One physics world per chapter, with that world's gravity.
import RAPIER from '@dimforge/rapier3d-compat';

let world = null;
const links = []; // { body, object }: 3D objects that follow a physics body

export async function initPhysics() {
  await RAPIER.init();
}

// gravity in m/s², positive number. It comes from content/facts.json, the same number the HUD shows.
export function resetWorld(gravity) {
  if (world) world.free();
  links.length = 0;
  world = new RAPIER.World({ x: 0, y: -gravity, z: 0 });
  return world;
}

// Flat ground with its top surface at y = 0.
// TODO Set A: replace with a heightfield that matches the terrain mesh from src/world.
export function addGround(size = 400) {
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(size / 2, 0.5, size / 2).setFriction(0), body);
  return body;
}

// A dynamic box that drives `object`. half = [x, y, z] half sizes, pos = [x, y, z].
export function addBox(object, half, pos, { damping = 0.1, lockTilt = true } = {}) {
  const desc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(pos[0], pos[1], pos[2])
    .setLinearDamping(damping)
    .setCanSleep(false);
  const body = world.createRigidBody(desc);
  if (lockTilt) body.setEnabledRotations(false, true, false, true); // only turn left and right
  world.createCollider(RAPIER.ColliderDesc.cuboid(half[0], half[1], half[2]).setFriction(0).setRestitution(0.1), body);
  links.push({ body, object });
  return body;
}

export function step(dt) {
  if (!world) return;
  world.integrationParameters.dt = Math.max(dt, 1 / 240);
  world.step();
  for (const { body, object } of links) {
    const t = body.translation();
    const r = body.rotation();
    object.position.set(t.x, t.y, t.z);
    object.quaternion.set(r.x, r.y, r.z, r.w);
  }
}

export { RAPIER };
