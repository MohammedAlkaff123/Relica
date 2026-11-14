// Turns a NASA GLB into a game model: plain colours, no textures, no animations,
// named parts with sensible pivots, metres, front along +Z, under the triangle budget.
//   node clean.mjs <name|all> [outDir]
import fs from 'node:fs';
import { Document } from '@gltf-transform/core';
import { MeshoptSimplifier } from 'meshoptimizer';
import { makeIO } from './io.mjs';
import { loadTriangles, bounds, weld, components } from './lib.mjs';

const lin = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map((v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
const hexOf = (c) => c.map((v) => { const s = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return Math.round(Math.min(1, Math.max(0, s)) * 255).toString(16).padStart(2, '0'); }).join('');
const inBox = (t, lo, hi) => { for (let i = 0; i < 9; i++) { const a = i % 3; if (t.p[i] < lo[a] || t.p[i] > hi[a]) return false; } return true; };
const nodeGroups = (tris) => { const m = new Map(); for (const t of tris) { if (!m.has(t.node)) m.set(t.node, []); m.get(t.node).push(t); } return m; };

// Each model: prepare(tris) tags every triangle with t.part (untagged ones are dropped) and returns
// { parts: { name: { pivot?, parent? } }, anchors: { name: [x,y,z] } }.
// place(bounds, cast) returns { scale, offset } that moves the model into game space.
// Everything in prepare() is in the source model's own units, after `rotate`.
const MODELS = {
  opportunity: {
    budget: 4800, cast: [1.4, 0.6, 1.7],
    prepare(tris) {
      const comps = components(tris, 0.0005);
      const parts = { body: {} };
      for (const t of tris) t.part = 'body';
      // Six wheels: found by where they sit.
      const rows = { F: 2.27, M: -0.82, R: -2.58 };
      for (const [row, z] of Object.entries(rows)) for (const [side, sx] of [['L', 1], ['R', -1]]) {
        const lo = [sx > 0 ? 2.6 : -3.47, -2.45, z - 0.47], hi = [sx > 0 ? 3.47 : -2.6, -1.5, z + 0.47];
        const name = `wheel_${row}${side}`;
        let n = 0; for (const t of tris) if (inBox(t, lo, hi)) { t.part = name; n++; }
        parts[name] = { pivot: [sx * 3.05, -1.97, z] };
        if (!n) throw new Error('no triangles for ' + name);
      }
      // Mast and camera bar: one connected piece above the deck. It turns about the mast.
      const head = comps.find((g) => { const b = bounds(g); return g.length > 500 && b.center[1] > 3; });
      const hb = bounds(head); head.forEach((t) => (t.part = 'head'));
      parts.head = { pivot: [hb.center[0], hb.min[1], 0.68] };
      // Low-gain antenna: the thin pole behind the mast, and its tip.
      const ant = comps.filter((g) => { const b = bounds(g); return Math.abs(b.center[0] - 0.65) < 0.1 && Math.abs(b.center[2] + 1.55) < 0.1 && b.center[1] > 2.5; });
      const at = ant.flat(); at.forEach((t) => (t.part = 'antenna'));
      parts.antenna = { pivot: [0.65, bounds(at).min[1], -1.55] };
      return { parts, anchors: {} };
    },
    place: (b, cast) => { const s = cast[0] / b.size[0]; return { scale: s, offset: [-b.center[0] * s, -cast[1] / 2 - b.min[1] * s, 0] }; },
  },

  ingenuity: {
    budget: 4800, cast: [0.5, 0.5, 0.5],
    prepare(tris) {
      const parts = { body: {}, blade_top: { pivot: [0, 0.41, 0] }, blade_bottom: { pivot: [0, 0.31, 0] }, blade_tip: { parent: 'blade_top', pivot: [0, 0.41, 0.36] } };
      for (const t of tris) {
        if (t.node === 'rotors_01') t.part = Math.min(t.p[2], t.p[5], t.p[8]) > 0.36 ? 'blade_tip' : 'blade_top';
        else if (t.node === 'rotors_02') t.part = 'blade_bottom';
        else t.part = 'body';
      }
      const bus = bounds(tris.filter((t) => t.node === 'bus'));
      return { parts, anchors: { head: [0, bus.center[1], bus.max[2]], antenna: [0, bounds(tris).max[1], 0] } };
    },
    // Already in real metres (rotor span 1.2 m). Kept at real size; feet on the bottom of the physics box.
    place: (b, cast) => ({ scale: 1, offset: [0, -cast[1] / 2 - b.min[1], 0] }),
  },

  pioneer: {
    budget: 4800, cast: [1.0, 0.6, 1.0],
    rotate: (x, y, z) => [-x, y, -z], // in the source the dish opens toward -Z; turn it to face +Z
    prepare(tris) {
      for (const t of tris) t.part = 'body';
      const dish = bounds(tris.filter((t) => t.node === 'AO_dish'));
      this._dish = dish;
      return { parts: { body: {} }, anchors: { head: [dish.center[0], dish.center[1], dish.max[2]], antenna: [dish.center[0], dish.center[1], bounds(tris).max[2]] } };
    },
    // Real metres (dish 2.74 m). Origin at the middle of the dish.
    place(b) { const d = this._dish; return { scale: 1, offset: [-d.center[0], -d.center[1], -d.center[2]] }; },
  },

  viking: {
    budget: 4800, cast: [1.8, 0.7, 1.8],
    rotate: (x, y, z) => [-z, y, x], // the sampler arm pointed along +X; make that +Z
    prepare(tris) {
      for (const t of tris) t.part = 'body';
      const b = bounds(tris);
      return { parts: { body: {} }, anchors: { head: [b.center[0], b.min[1] + b.size[1] * 0.62, b.center[2] + b.size[2] * 0.12], antenna: [b.center[0], b.max[1], b.center[2]] } };
    },
    place: (b, cast) => { const s = cast[0] / b.size[0]; return { scale: s, offset: [-b.center[0] * s, -cast[1] / 2 - b.min[1] * s, -b.center[2] * s] }; },
  },

  lunar_module: {
    budget: 4800, dropSmaller: 0.32,
    prepare(tris) {
      for (const [name, g] of nodeGroups(tris)) {
        if (name.startsWith('pPlane')) continue; // the two flag decals
        const part = bounds(g).center[1] < 2.1 ? 'descent' : 'ascent';
        g.forEach((t) => (t.part = part));
      }
      return { parts: { descent: {}, ascent: { pivot: [0, 2.1, 0] } }, anchors: {} };
    },
    // About 7 m tall like the real one, feet on y = 0.
    place: (b) => { const s = 7.0 / b.size[1]; return { scale: s, offset: [-b.center[0] * s, -b.min[1] * s, -b.center[2] * s] }; },
  },

  astronaut: {
    budget: 3000,
    color: (t) => (t.mat === 'astnt1_2' ? lin(0x1f2a38) : lin(0xe8e6df)), // dark mirror visor, plain white suit: no patches
    prepare(tris) {
      for (const t of tris) t.part = t.mat === 'astnt1_2' ? 'visor' : 'body';
      return { parts: { body: {}, visor: {} }, anchors: {} };
    },
    place: (b) => { const s = 1.85 / b.size[1]; return { scale: s, offset: [-b.center[0] * s, -b.min[1] * s, -b.center[2] * s] }; },
  },

  perseverance: {
    budget: 4500, dropSmaller: 0.12,
    color: () => lin(0x6f7378), // background silhouette only
    prepare(tris) { for (const t of tris) t.part = 'body'; return { parts: { body: {} }, anchors: {} }; },
    place: (b) => ({ scale: 1, offset: [-b.center[0], -b.min[1], -b.center[2]] }),
  },
};

function simplifyGroup(tris, target, diag) {
  const { positions, indices } = weld(tris, diag * 2e-4);
  // Drop triangles that collapsed in the weld.
  const keep = [];
  for (let i = 0; i < indices.length; i += 3) if (indices[i] !== indices[i + 1] && indices[i + 1] !== indices[i + 2] && indices[i] !== indices[i + 2]) keep.push(indices[i], indices[i + 1], indices[i + 2]);
  let idx = new Uint32Array(keep);
  if (idx.length / 3 > target) {
    const want = Math.max(3, Math.floor(target) * 3);
    let [r] = MeshoptSimplifier.simplify(idx, positions, 3, want, 0.02, []);
    if (r.length > want * 1.25) [r] = MeshoptSimplifier.simplify(idx, positions, 3, want, 0.1, []);
    if (r.length > want * 1.25) [r] = MeshoptSimplifier.simplifySloppy(idx, positions, 3, null, want, 0.3);
    if (r.length >= 3) idx = r;
  }
  return { positions, indices: idx };
}

async function build(name, outDir) {
  const cfg = MODELS[name];
  let tris = await loadTriangles(`./nasa_source/${name}.glb`);
  const before = tris.length;
  if (cfg.rotate) for (const t of tris) for (let k = 0; k < 3; k++) t.p.set(cfg.rotate(t.p[k * 3], t.p[k * 3 + 1], t.p[k * 3 + 2]), k * 3);
  if (cfg.dropSmaller) { // tiny bolts and spheres nobody will see
    const gone = new Set();
    for (const [n, g] of nodeGroups(tris)) if (Math.hypot(...bounds(g).size) < cfg.dropSmaller) gone.add(n);
    tris = tris.filter((t) => !gone.has(t.node));
  }
  const info = cfg.prepare(tris);
  tris = tris.filter((t) => t.part);
  if (cfg.color) for (const t of tris) t.color = cfg.color(t);
  const all = bounds(tris);
  const { scale, offset } = cfg.place(all, cfg.cast);
  const tf = (p) => [p[0] * scale + offset[0], p[1] * scale + offset[1], p[2] * scale + offset[2]];

  // Group by part and colour.
  const groups = new Map();
  for (const t of tris) { const k = t.part + '#' + hexOf(t.color); if (!groups.has(k)) groups.set(k, { part: t.part, color: t.color, tris: [] }); groups.get(k).tris.push(t); }
  const ratio = Math.min(1, cfg.budget / tris.length);
  const diag = Math.hypot(...all.size);

  const doc = new Document(); const buffer = doc.createBuffer(); const scene = doc.createScene(name);
  const mats = new Map();
  const material = (c) => { const h = hexOf(c); if (!mats.has(h)) mats.set(h, doc.createMaterial('c_' + h).setBaseColorFactor([...c, 1]).setRoughnessFactor(0.9).setMetallicFactor(0)); return mats.get(h); };
  const nodes = {}; let after = 0;
  for (const [pn, spec] of Object.entries(info.parts)) {
    const piv = spec.pivot ? tf(spec.pivot) : [0, 0, 0];
    const mesh = doc.createMesh(pn);
    for (const g of groups.values()) {
      if (g.part !== pn) continue;
      const target = g.tris.length <= 24 ? g.tris.length : Math.max(12, g.tris.length * ratio);
      const { positions, indices } = simplifyGroup(g.tris, target, diag);
      if (indices.length < 3) continue;
      // Compact, move into game space, make relative to the pivot.
      const remap = new Map(); const out = []; const idx = new Uint32Array(indices.length);
      for (let i = 0; i < indices.length; i++) {
        let id = remap.get(indices[i]);
        if (id === undefined) { id = out.length / 3; const p = tf([positions[indices[i] * 3], positions[indices[i] * 3 + 1], positions[indices[i] * 3 + 2]]); out.push(p[0] - piv[0], p[1] - piv[1], p[2] - piv[2]); remap.set(indices[i], id); }
        idx[i] = id;
      }
      const pos = doc.createAccessor().setType('VEC3').setArray(new Float32Array(out)).setBuffer(buffer);
      const ind = doc.createAccessor().setType('SCALAR').setArray(out.length / 3 > 65535 ? idx : new Uint16Array(idx)).setBuffer(buffer);
      mesh.addPrimitive(doc.createPrimitive().setAttribute('POSITION', pos).setIndices(ind).setMaterial(material(g.color)));
      after += idx.length / 3;
    }
    nodes[pn] = { node: doc.createNode(pn).setMesh(mesh), piv, parent: spec.parent };
  }
  for (const n of Object.values(nodes)) {
    if (n.parent) { const pp = nodes[n.parent].piv; n.node.setTranslation([n.piv[0] - pp[0], n.piv[1] - pp[1], n.piv[2] - pp[2]]); nodes[n.parent].node.addChild(n.node); }
    else { n.node.setTranslation(n.piv); scene.addChild(n.node); }
  }
  // Empty marker nodes the face rig can attach to.
  for (const [an, p] of Object.entries(info.anchors)) if (!nodes[an]) scene.addChild(doc.createNode(an).setTranslation(tf(p)));
  doc.getRoot().getAsset().copyright = 'Adapted from NASA 3D Resources (github.com/nasa/NASA-3D-Resources). Source: NASA.';
  const io = await makeIO();
  const file = `${outDir}/${name}.glb`;
  await io.write(file, doc);
  const fb = all.size.map((v) => (v * scale).toFixed(2)).join(' x ');
  console.log(`${name.padEnd(13)} ${String(before).padStart(6)} -> ${String(after).padStart(5)} tris | ${(fs.statSync(file).size / 1024).toFixed(0).padStart(4)} KB | ${fb} m | colours ${mats.size} | parts ${Object.keys(nodes).join(',')} | anchors ${Object.keys(info.anchors).join(',')}`);
}

await MeshoptSimplifier.ready;
const [which = 'all', outDir = "../../public/models"] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
for (const n of which === 'all' ? Object.keys(MODELS) : [which]) await build(n, outDir);
