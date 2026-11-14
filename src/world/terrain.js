// The shape of the ground. Owner: Set B.
//
//   heightAt('moon', x, z)        ground height in metres at any point
//   cratersOf('moon')             [{ x, z, r, depth, name? }] so chapters can put things on or around them
//   mesasOf('jezero')             [{ x, z, r, height }] the flat-topped hills
//
// Worlds: 'moon', 'mars' (Meridiani plains, chapter 2), 'jezero' (chapter 3). Anything else is flat.
// On 'mars', cratersOf gives two named places: 'start' (the small crater Opportunity lands in)
// and 'rim' (the big crater to reach, 160 m away).
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

  // Meridiani Planum, chapter 2. Very flat, with wind ripples. Opportunity starts on the floor of a
  // small crater (`pit`, like Eagle crater) and drives out. Far off there is one big crater whose
  // rim is the place to reach.
  mars: {
    seed: 2004, hills: 1.6, hillSize: 150, rough: 0.12, roughSize: 20,
    ripples: { height: 0.09, length: 10, angle: 0.5 },
    pit: { r: 11, depth: 1.3 },
    fixed: [{ name: 'rim', x: -70, z: 150, r: 45, depth: 8 }],
  },

  // Jezero crater, chapter 3. A flat old lake bed, two flat-topped mesas, and the crater wall
  // standing in steps all around the horizon. Ask for it by name: heightAt('jezero', x, z).
  jezero: {
    seed: 2021, hills: 1.2, hillSize: 120, rough: 0.15, roughSize: 16,
    wall: { from: 120, to: 190, steps: 3, stepHeight: 10 },
    mesas: [{ x: 70, z: 95, r: 18, height: 9 }, { x: -95, z: 40, r: 14, height: 7 }, { x: -30, z: -110, r: 22, height: 11 }],
  },
};

// Craters are placed once per world: a ring of them near the start so the drive passes some,
// then the rest scattered. None touch the start area and none overlap.
const craterLists = new Map();
export function cratersOf(world) {
  if (craterLists.has(world)) return craterLists.get(world);
  const spec = WORLDS[world];
  const list = [];
  // Named places come first. `flat: true` means heightAt shapes it another way; it is listed so a
  // chapter can find it.
  if (spec?.pit) list.push({ name: 'start', x: 0, z: 0, r: spec.pit.r, depth: spec.pit.depth, flat: true });
  if (spec?.fixed) list.push(...spec.fixed);
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

export function mesasOf(world) {
  return WORLDS[world]?.mesas ?? [];
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
  const far = Math.hypot(x, z);
  // Flat at the start, rising to full height 30 m out.
  const open = smoothstep(spec.pit ? spec.pit.r : 8, 30, far);
  let h = layered(x / spec.hillSize, z / spec.hillSize, spec.seed, 3) * spec.hills;
  h += layered(x / spec.roughSize, z / spec.roughSize, spec.seed + 7, 2) * spec.rough;
  if (spec.ripples) {
    // Long wind ripples, all lying the same way, bent a little so they do not look ruled.
    const r = spec.ripples, along = x * Math.cos(r.angle) + z * Math.sin(r.angle);
    h += Math.sin((along / r.length) * Math.PI * 2 + noise(x / 30, z / 30, spec.seed + 3) * 4) * r.height;
  }
  h *= open;
  if (spec.pit) {
    // The start is the floor of a shallow crater: the plain around it is higher, with a low rim.
    const p = spec.pit;
    h += p.depth * smoothstep(p.r * 0.45, p.r, far) + 0.3 * Math.exp(-(((far - p.r) / 2.5) ** 2));
  }
  if (spec.wall) {
    // The crater wall: it rises in steps, each a steep face with a flat shelf on top.
    const w = spec.wall;
    const d = far + (noise(x / 40, z / 40, spec.seed + 5) - 0.5) * 36;
    const t = smoothstep(w.from, w.to, d) * w.steps, whole = Math.floor(t);
    h += (whole + smoothstep(0.5, 0.9, t - whole)) * w.stepHeight;
  }
  if (spec.mesas) {
    for (const m of spec.mesas) {
      const d = Math.hypot(x - m.x, z - m.z) / m.r;
      if (d < 1) h += m.height * (1 - smoothstep(0.7, 1, d)); // flat top, steep sides
    }
  }
  for (const c of cratersOf(world)) {
    if (c.flat) continue;
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
