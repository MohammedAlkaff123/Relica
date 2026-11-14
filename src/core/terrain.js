// Ground height for physics and gameplay. Owner: Set A.
//
//   heightAt(world, x, z)   -> ground height in metres at that point (Set B's src/world/terrain.js)
//   normalAt(world, x, z)   -> THREE.Vector3 pointing away from the ground
//
// The shape of the ground belongs to Set B. The ground mesh and the physics both read the same
// heightAt, so what you see is what you drive on.
import * as THREE from 'three';
import { heightAt as setBHeightAt, TERRAIN_SIZE, TERRAIN_CELLS } from '../world/terrain.js';

export { TERRAIN_SIZE, TERRAIN_CELLS };

export function heightAt(world, x, z) {
  return setBHeightAt(world, x, z);
}

const n = new THREE.Vector3();
export function normalAt(world, x, z, out = n) {
  const e = 0.5;
  const dx = heightAt(world, x + e, z) - heightAt(world, x - e, z);
  const dz = heightAt(world, x, z + e) - heightAt(world, x, z - e);
  return out.set(-dx, 2 * e, -dz).normalize();
}
