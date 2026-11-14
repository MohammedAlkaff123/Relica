// Thin wrapper around Rapier. One physics world per chapter, with that world's gravity. Owner: Set A.
import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { heightAt } from './terrain.js';

let world = null;
const links = []; // { body, object, tilt? }: 3D objects that follow a physics body

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

// Flat ground with its top surface at y = 0. Kept for worlds with no terrain (the factory).
export function addGround(size = 400) {
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(size / 2, 0.5, size / 2).setFriction(0), body);
  return body;
}

// Ground that follows heightAt(worldName, x, z) from src/core/terrain.js, sampled every `cell` metres.
export function addTerrain(worldName, size = 400, cell = 2) {
  const cells = Math.round(size / cell);
  const heights = new Float32Array((cells + 1) * (cells + 1));
  // Rapier layout: rows run along z, columns along x, stored column by column.
  for (let col = 0; col <= cells; col++) {
    const x = -size / 2 + (col * size) / cells;
    for (let row = 0; row <= cells; row++) {
      const z = -size / 2 + (row * size) / cells;
      heights[row + col * (cells + 1)] = heightAt(worldName, x, z);
    }
  }
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(
    RAPIER.ColliderDesc.heightfield(cells, cells, heights, { x: size, y: 1, z: size }).setFriction(0),
    body,
  );
  // A floor far below, so nothing can fall forever if it slips through an edge.
  const floor = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -60, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(size, 1, size), floor);
  return body;
}

// A dynamic box that drives `object`. half = [x, y, z] half sizes, pos = [x, y, z].
// round: corner radius in metres. Rounded corners slide over bumps instead of catching on them.
// The returned link has `tilt`, a quaternion applied on top of the body's turn. Controllers use it
// for lean and pitch on the visible model while the body itself only turns left and right.
export function addBox(object, half, pos, { damping = 0.1, lockTilt = true, round = 0, restitution = 0.1 } = {}) {
  const desc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(pos[0], pos[1], pos[2])
    .setLinearDamping(damping)
    .setCanSleep(false);
  const body = world.createRigidBody(desc);
  if (lockTilt) body.setEnabledRotations(false, true, false, true); // only turn left and right
  const r = Math.min(round, half[0] * 0.9, half[1] * 0.9, half[2] * 0.9);
  const shape = r > 0
    ? RAPIER.ColliderDesc.roundCuboid(half[0] - r, half[1] - r, half[2] - r, r)
    : RAPIER.ColliderDesc.cuboid(half[0], half[1], half[2]);
  world.createCollider(shape.setFriction(0).setRestitution(restitution), body);
  links.push({ body, object, tilt: new THREE.Quaternion() });
  body.userData = links[links.length - 1];
  return body;
}

// A bouncing ball (the Mars airbags). Free to roll.
export function addBall(object, radius, pos, { restitution = 0.6, friction = 0.6, damping = 0.05 } = {}) {
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic().setTranslation(pos[0], pos[1], pos[2]).setLinearDamping(damping).setAngularDamping(0.4).setCanSleep(false),
  );
  world.createCollider(RAPIER.ColliderDesc.ball(radius).setRestitution(restitution).setFriction(friction), body);
  links.push({ body, object, tilt: null });
  return body;
}

export function removeBody(body) {
  if (!world || !body) return;
  const i = links.findIndex((l) => l.body === body);
  if (i >= 0) links.splice(i, 1);
  world.removeRigidBody(body);
}

// The tilt quaternion of a body made by addBox (identity if none).
export function tiltOf(body) {
  return body?.userData?.tilt ?? null;
}

const q = new THREE.Quaternion();
export function step(dt) {
  if (!world) return;
  world.integrationParameters.dt = Math.max(dt, 1 / 240);
  world.step();
  for (const { body, object, tilt } of links) {
    const t = body.translation();
    const r = body.rotation();
    object.position.set(t.x, t.y, t.z);
    object.quaternion.set(r.x, r.y, r.z, r.w);
    if (tilt) object.quaternion.multiply(q.copy(tilt));
  }
}

export { RAPIER };
