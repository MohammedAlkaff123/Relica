// The shape of the ground. Owner: Set B.
//
//   heightAt('moon', x, z)        ground height in metres at any point
//   cratersOf('moon')             [{ x, z, r, depth }] so chapters can put things on or around them
//   heightGrid('moon')            the same heights on a grid, laid out for a Rapier heightfield
//
// The picture (world.js) and the physics (Set A) both read heightAt, so they always agree.
// Nothing here is random at run time: the same world always gives the same land.
// The start point (0, 0) is flat and at height 0 in every world, so a chapter can spawn there.

export const TERRAIN_SIZE = 400; // metres, centred on (0, 0)
export const TERRAIN_CELLS = 160; // grid squares along each side, 2.5 m each

// ---- repeatable noise ----

function hash(ix, iz, seed) {
  let h = (ix * 374761393 + iz * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t) => t * t * (3 - 2 * t);
const smoothstep = (a, b, v) => smooth(Math.min(1, Math.max(0, (v - a) / (b - a))));

// Smooth noise between 0 and 1. One "bump" is about one unit wide.
function noise(x, z, seed) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = smooth(x - ix), fz = smooth(z - iz);
  const a = hash(ix, iz, seed), b = hash(ix + 1, iz, seed);
  const c = hash(ix, iz + 1, seed), d = hash(ix + 1, iz + 1, seed);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

// Several layers of noise, each half as tall and twice as fine. Result is about -0.5 to 0.5.
function layered(x, z, seed, layers) {
  let sum = 0, amp = 0.5, total = 0;
  for (let i = 0; i < layers; i++) {
    sum += noise(x, z, seed + i * 101) * amp;
    total += amp;
    x *= 2; z *= 2; amp *= 0.5;
  }
  return sum / total - 0.5;
}

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

// ---- the worlds ----

// hills: height of the big hills in metres, top to bottom. hillSize: how wide one hill is.
// rough: height of the small bumps. roughSize: how wide one bump is.
const WORLDS = {
  moon: { seed: 1972, hills: 6, hillSize: 90, rough: 0.5, roughSize: 14, craters: 22 },
  mars: { seed: 2004, hills: 3, hillSize: 130, rough: 0.25, roughSize: 18, craters: 0 }, // B-7 will shape Mars properly
};

// Craters are placed once per world: a ring of them near the start so the drive passes some,
// then the rest scattered. None touch the start area and none overlap.
const craterLists = new Map();
export function cratersOf(world) {
  if (craterLists.has(world)) return craterLists.get(world);
  const spec = WORLDS[world];
  const list = [];
  if (spec?.craters) {
    const rand = rng(spec.seed);
    let tries = 0;
    while (list.length < spec.craters && tries++ < 2000) {
      const near = list.length < 8; // the first eight sit 25 to 80 m from the start
      const dist = near ? 25 + rand() * 55 : 60 + rand() * 125;
      const angle = rand() * Math.PI * 2;
      const r = near ? 5 + rand() * 6 : 6 + rand() * 13;
      const x = Math.cos(angle) * dist, z = Math.sin(angle) * dist;
      if (dist - r * 1.5 < 14) continue;
      if (Math.abs(x) + r * 1.5 > TERRAIN_SIZE / 2 || Math.abs(z) + r * 1.5 > TERRAIN_SIZE / 2) continue;
      if (list.some((c) => Math.hypot(c.x - x, c.z - z) < (c.r + r) * 1.5)) continue;
      list.push({ x, z, r, depth: r * 0.22 });
    }
  }
  craterLists.set(world, list);
  return list;
}

// A bowl with a raised rim. d is the distance from the centre, in crater radii.
function craterShape(d, c) {
  if (d > 1.7) return 0;
  const bowl = d < 1 ? -c.depth * (1 - d * d) : 0;
  const rim = c.depth * 0.3 * Math.exp(-(((d - 1) / 0.25) ** 2));
  return bowl + rim;
}

export function heightAt(world, x, z) {
  const spec = WORLDS[world];
  if (!spec) return 0; // factory floor, deep space
  // Flat at the start, rising to full height 30 m out.
  const open = smoothstep(8, 30, Math.hypot(x, z));
  let h = layered(x / spec.hillSize, z / spec.hillSize, spec.seed, 3) * spec.hills;
  h += layered(x / spec.roughSize, z / spec.roughSize, spec.seed + 7, 2) * spec.rough;
  h *= open;
  for (const c of cratersOf(world)) {
    const dx = x - c.x, dz = z - c.z, reach = c.r * 1.7;
    if (dx > reach || dx < -reach || dz > reach || dz < -reach) continue;
    h += craterShape(Math.hypot(dx, dz) / c.r, c);
  }
  return h;
}

// For Set A. Use it like this in physics.js:
//   const g = heightGrid(worldName);
//   world.createCollider(RAPIER.ColliderDesc.heightfield(g.rows, g.cols, g.heights, g.scale));
// Rapier wants (rows + 1) x (cols + 1) heights, column by column, rows along z and columns along x.
export function heightGrid(world, size = TERRAIN_SIZE, cells = TERRAIN_CELLS) {
  const n = cells + 1;
  const heights = new Float32Array(n * n);
  for (let col = 0; col < n; col++) {
    const x = (col / cells - 0.5) * size;
    for (let row = 0; row < n; row++) heights[col * n + row] = heightAt(world, x, (row / cells - 0.5) * size);
  }
  return { rows: cells, cols: cells, heights, scale: { x: size, y: 1, z: size } };
}
