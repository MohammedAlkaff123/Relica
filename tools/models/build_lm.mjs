// Builds the Apollo Lunar Module from simple shapes and writes lunarModule.glb. NASA's own model,
// cut down to a few thousand triangles, lost its outline, so this one is ours: the gold descent
// stage on four legs and the grey crew cabin on top, with nothing smaller than a window.
//   node build_lm.mjs [outDir]
//
// Front is +Z (the ladder and the hatch), up is +Y. Metres, close to real size: 9.6 m across the
// footpads, 6.4 m to the top of the antenna. A prop: centred in X and Z, footpads on y = 0.
// Parts: descent (stays on the Moon) and ascent (the crew cabin; the game lifts it by moving its
// y, so its own origin is the prop's origin). No flag, no lettering.
import fs from 'node:fs';
import { Document, NodeIO } from '@gltf-transform/core';

const C = {
  gold: 0xc9a24a,     // foil on the descent stage
  amber: 0x9a7630,    // darker foil panels
  silver: 0xb9bcc2,   // the crew cabin
  grey: 0x7e828a,
  dark: 0x2c2f36,     // windows, engine bells, the hatch
  white: 0xe6e3da,
};

// ---- shapes: each returns { pos: number[], idx: number[] } ----

function box(w, h, d, [x, y, z], rotX = 0) {
  const pos = [], c = Math.cos(rotX), s = Math.sin(rotX);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const px = sx * w / 2, py = sy * h / 2, pz = sz * d / 2;
    pos.push(x + px, y + py * c - pz * s, z + py * s + pz * c);
  }
  const idx = [0, 1, 3, 0, 3, 2, 4, 6, 7, 4, 7, 5, 0, 4, 5, 0, 5, 1, 2, 3, 7, 2, 7, 6, 0, 2, 6, 0, 6, 4, 1, 5, 7, 1, 7, 3];
  return { pos, idx };
}

// A closed cylinder. axis: 'x' (a wheel) or 'y' (a pole).
function cylinder(r, len, sides, [x, y, z], axis = 'y') {
  const pos = [], idx = [];
  const put = (a, b, t) => (axis === 'x' ? pos.push(x + t, y + a, z + b) : pos.push(x + a, y + t, z + b));
  for (let i = 0; i < sides; i++) {
    const ang = (i / sides) * Math.PI * 2;
    put(Math.cos(ang) * r, Math.sin(ang) * r, -len / 2);
    put(Math.cos(ang) * r, Math.sin(ang) * r, len / 2);
  }
  put(0, 0, -len / 2); put(0, 0, len / 2);
  const a = sides * 2, b = a + 1;
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    idx.push(i * 2, j * 2, i * 2 + 1, j * 2, j * 2 + 1, i * 2 + 1, a, j * 2, i * 2, b, i * 2 + 1, j * 2 + 1);
  }
  return { pos, idx };
}

// An open dish pointing up, then tipped forward by `tilt`. Drawn from both sides.
function dish(r, depth, sides, [x, y, z], tilt) {
  const pos = [0, 0, 0], idx = [], c = Math.cos(tilt), s = Math.sin(tilt);
  for (let i = 0; i < sides; i++) { const a = (i / sides) * Math.PI * 2; pos.push(Math.cos(a) * r, depth, Math.sin(a) * r); }
  for (let i = 0; i < sides; i++) idx.push(0, 1 + i, 1 + ((i + 1) % sides));
  for (let i = 0; i < pos.length; i += 3) { const py = pos[i + 1], pz = pos[i + 2]; pos[i] += x; pos[i + 1] = y + py * c - pz * s; pos[i + 2] = z + py * s + pz * c; }
  return { pos, idx, twoSided: true };
}

// A curved strip over the top of a wheel. From angle a0 to a1, measured from straight ahead.
function fender(r, width, [x, y, z], a0, a1, steps = 4) {
  const pos = [], idx = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    pos.push(x - width / 2, y + Math.sin(a) * r, z + Math.cos(a) * r, x + width / 2, y + Math.sin(a) * r, z + Math.cos(a) * r);
  }
  for (let i = 0; i < steps; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  return { pos, idx, twoSided: true };
}

// A closed shape with `sides` flat sides, one radius at the top and another at the bottom.
function prism(rTop, rBot, h, sides, [x, y, z], turn = Math.PI / sides) {
  const pos = [], idx = [];
  for (let i = 0; i < sides; i++) {
    const a = turn + (i / sides) * Math.PI * 2;
    pos.push(x + Math.sin(a) * rBot, y - h / 2, z + Math.cos(a) * rBot, x + Math.sin(a) * rTop, y + h / 2, z + Math.cos(a) * rTop);
  }
  pos.push(x, y - h / 2, z, x, y + h / 2, z);
  const lo = sides * 2, hi = lo + 1;
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    idx.push(i * 2, j * 2, i * 2 + 1, j * 2, j * 2 + 1, i * 2 + 1, lo, j * 2, i * 2, hi, i * 2 + 1, j * 2 + 1);
  }
  return { pos, idx, twoSided: true };
}

// A square bar from point a to point b.
function strut(a, b, thick) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(...d), n = d.map((v) => v / len);
  const ref = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
  const unit = (v) => { const l = Math.hypot(...v); return v.map((c) => c / l); };
  const u = unit(cross(n, ref)), v = cross(n, u), pos = [];
  for (const end of [a, b]) for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pos.push(...end.map((c, k) => c + (u[k] * su + v[k] * sv) * thick / 2));
  const idx = [0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; idx.push(i, i + 4, j + 4, i, j + 4, j); }
  return { pos, idx, twoSided: true };
}

// The same shape turned a quarter-turn (or any angle) about the middle of the lander.
function turned(shape, angle) {
  const c = Math.cos(angle), s = Math.sin(angle), pos = shape.pos.slice();
  for (let i = 0; i < pos.length; i += 3) { const x = pos[i], z = pos[i + 2]; pos[i] = x * c + z * s; pos[i + 2] = -x * s + z * c; }
  return { ...shape, pos };
}

// ---- the lander ----

const parts = {};
const part = (name, pivot = [0, 0, 0]) => (parts[name] = { pivot, shapes: [] });
const add = (name, color, shape) => parts[name].shapes.push({ color, ...shape });

// ---- descent stage: an eight-sided gold box on four legs ----
part('descent');
const BASE = 1.25, TOP = 2.85;                                               // underside and deck of the box
add('descent', C.gold, prism(2.1, 2.1, TOP - BASE, 8, [0, (BASE + TOP) / 2, 0]));
add('descent', C.amber, prism(2.14, 2.14, 0.55, 8, [0, BASE + 0.55, 0]));    // a darker band of foil
add('descent', C.dark, prism(1.95, 1.95, 0.1, 8, [0, TOP + 0.05, 0]));       // the deck the cabin sits on
add('descent', C.dark, prism(0.4, 0.85, 0.85, 10, [0, BASE - 0.4, 0]));      // descent engine bell
for (let k = 0; k < 4; k++) {
  const q = (shape) => turned(shape, k * Math.PI / 2);
  const foot = [0, 0.3, 4.6];
  add('descent', C.gold, q(strut([0, TOP - 0.25, 2.0], foot, 0.2)));          // main leg
  for (const sx of [-1, 1]) add('descent', C.grey, q(strut([sx * 1.0, BASE + 0.15, 1.85], [0, 0.75, 4.1], 0.1))); // two braces
  add('descent', C.gold, q(prism(0.6, 0.5, 0.14, 10, [0, 0.07, 4.7])));       // footpad
  add('descent', C.grey, q(strut(foot, [0, 0.14, 4.7], 0.16)));
}
// The ladder down the front leg, and the porch at its top.
for (let i = 1; i <= 7; i++) {
  const t = i / 8.5, y = TOP - 0.25 + (0.3 - (TOP - 0.25)) * t, z = 2.0 + (4.6 - 2.0) * t;
  add('descent', C.white, box(0.62, 0.05, 0.05, [0, y + 0.12, z]));
}
for (const sx of [-1, 1]) add('descent', C.white, strut([sx * 0.31, TOP - 0.1, 2.05], [sx * 0.31, 1.0, 3.9], 0.05));
add('descent', C.grey, box(1.0, 0.07, 1.0, [0, TOP + 0.12, 2.2]));
for (const sx of [-1, 1]) add('descent', C.grey, strut([sx * 0.48, TOP + 0.15, 2.65], [sx * 0.48, TOP + 0.85, 2.65], 0.05)); // porch rail posts
// Equipment bays on two sides (where the rover and the tools were stowed).
add('descent', C.white, box(0.9, 0.8, 0.12, [-1.45, 2.1, 1.5], 0));
add('descent', C.grey, box(0.12, 0.9, 1.0, [2.12, 2.05, 0]));

// ---- ascent stage: the crew cabin. This is the part that flies. ----
part('ascent');
const CAB = TOP + 0.1;                                                        // where the cabin stands on the deck
add('ascent', C.dark, prism(0.3, 0.5, 0.45, 8, [0, CAB + 0.05, 0]));         // its own engine bell, hidden until it lifts
add('ascent', C.silver, prism(1.45, 1.75, 1.7, 8, [0, CAB + 1.1, -0.1]));    // cabin body
add('ascent', C.grey, prism(1.0, 1.45, 0.45, 8, [0, CAB + 2.15, -0.1]));     // sloping roof
add('ascent', C.silver, box(1.9, 1.5, 0.9, [0, CAB + 1.15, 1.25]));          // the flat front the crew looks out of
add('ascent', C.grey, box(1.9, 0.5, 0.9, [0, CAB + 2.0, 1.15], -0.45));      // brow over the windows
for (const sx of [-1, 1]) add('ascent', C.dark, box(0.62, 0.52, 0.06, [sx * 0.55, CAB + 1.45, 1.72], 0.12)); // two windows
add('ascent', C.dark, box(0.78, 0.74, 0.06, [0, CAB + 0.62, 1.72]));         // hatch
add('ascent', C.grey, box(0.9, 0.86, 0.04, [0, CAB + 0.62, 1.7]));           // its frame
for (const sx of [-1, 1]) {
  add('ascent', C.amber, box(0.85, 1.05, 1.5, [sx * 1.95, CAB + 0.95, -0.2]));  // fuel tank housings, one each side
  add('ascent', C.gold, box(0.87, 0.3, 1.52, [sx * 1.95, CAB + 1.35, -0.2]));
  for (const sz of [-1, 1]) {                                                  // four small thruster clusters on arms
    const at = [sx * 2.2, CAB + 1.95, -0.1 + sz * 1.35];
    add('ascent', C.grey, strut([sx * 1.3, CAB + 1.8, -0.1 + sz * 1.0], at, 0.07));
    add('ascent', C.dark, box(0.34, 0.09, 0.09, at)); add('ascent', C.dark, box(0.09, 0.34, 0.09, at)); add('ascent', C.dark, box(0.09, 0.09, 0.34, at));
  }
}
add('ascent', C.silver, box(1.5, 1.0, 0.7, [0, CAB + 1.0, -1.55]));           // equipment bay on the back
add('ascent', C.grey, prism(0.42, 0.42, 0.35, 10, [0, CAB + 2.5, -0.35]));    // docking port on the roof
add('ascent', C.white, prism(0.3, 0.3, 0.06, 10, [0, CAB + 2.7, -0.35]));
// Antennas: the big dish for Earth on a mast, the small radar dish in front, two thin aerials.
add('ascent', C.grey, cylinder(0.035, 0.75, 6, [1.15, CAB + 2.6, -0.6]));
add('ascent', C.white, dish(0.5, 0.16, 10, [1.15, CAB + 3.0, -0.6], 0.7));
add('ascent', C.grey, cylinder(0.03, 0.3, 6, [0, CAB + 2.45, 0.85]));
add('ascent', C.white, dish(0.3, 0.1, 8, [0, CAB + 2.62, 0.85], 1.2));
for (const sx of [-1, 1]) add('ascent', C.grey, cylinder(0.018, 0.9, 5, [sx * 0.8, CAB + 2.75, -1.0]));

// ---- write the file ----

const lin = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map((v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
const doc = new Document(); const buffer = doc.createBuffer(); const scene = doc.createScene('lunarModule');
const mats = new Map();
function material(color, twoSided) {
  const key = color + (twoSided ? 'd' : '');
  if (!mats.has(key)) mats.set(key, doc.createMaterial('c_' + color.toString(16) + (twoSided ? '_2' : '')).setBaseColorFactor([...lin(color), 1]).setRoughnessFactor(0.9).setMetallicFactor(0).setDoubleSided(!!twoSided));
  return mats.get(key);
}
let tris = 0;
const min = [99, 99, 99], max = [-99, -99, -99];
for (const [name, p] of Object.entries(parts)) {
  const mesh = doc.createMesh(name);
  // One primitive per colour: merge that colour's shapes. No normals, so the game shades it flat.
  const byMat = new Map();
  for (const s of p.shapes) { const m = material(s.color, s.twoSided); if (!byMat.has(m)) byMat.set(m, { pos: [], idx: [] }); const g = byMat.get(m); const base = g.pos.length / 3; g.pos.push(...s.pos); g.idx.push(...s.idx.map((i) => i + base)); }
  for (const [m, g] of byMat) {
    for (let i = 0; i < g.pos.length; i++) { const a = i % 3; min[a] = Math.min(min[a], g.pos[i]); max[a] = Math.max(max[a], g.pos[i]); g.pos[i] -= p.pivot[a]; }
    // Unshared corners, so every face is flat and has its own shading.
    const flat = []; for (const i of g.idx) flat.push(g.pos[i * 3], g.pos[i * 3 + 1], g.pos[i * 3 + 2]);
    mesh.addPrimitive(doc.createPrimitive().setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(flat)).setBuffer(buffer)).setMaterial(m));
    tris += g.idx.length / 3;
  }
  scene.addChild(doc.createNode(name).setMesh(mesh).setTranslation(p.pivot));
}
doc.getRoot().getAsset().copyright = 'Team Relica. Built from simple shapes after NASA photos of the Apollo 17 Lunar Module.';
const outDir = process.argv[2] ?? '../../public/models';
const file = `${outDir}/lunarModule.glb`;
await new NodeIO().write(file, doc);
console.log(`lunarModule ${tris} tris | ${(fs.statSync(file).size / 1024).toFixed(0)} KB | ${max.map((v, i) => (v - min[i]).toFixed(2)).join(' x ')} m | lowest y ${min[1].toFixed(2)} | parts ${Object.keys(parts).join(',')}`);
