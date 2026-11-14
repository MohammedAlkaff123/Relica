// Builds the Moon rover (Apollo 17 Lunar Roving Vehicle) from simple shapes and writes lrv.glb.
// NASA publishes no 3D model of it, so this one is ours, shaped after the pack photos in
// public/nasa/apollo_lunar_roving_vehicle/.
//   node build_lrv.mjs [outDir]
//
// Front is +Z, up is +Y, the rover's left is +X. Metres. The lowest point is y = -0.3,
// the bottom of the physics box in CAST (1.6 x 0.6 x 2.4).
import fs from 'node:fs';
import { Document, NodeIO } from '@gltf-transform/core';

const C = {
  frame: 0xd9d4c7,  // bare aluminium
  dark: 0x4a4e56,   // seat webbing, joints
  tyre: 0x71757d,   // wire-mesh wheels
  hub: 0xc9c4b6,
  fender: 0xb9824a, // the orange-tan fibreglass fenders
  white: 0xeeeae0,  // thermal blankets
  foil: 0xcdb679,   // gold foil and the umbrella antenna
  camera: 0x5d626b,
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

// ---- the rover ----

const parts = {}; // name -> { pivot, parent?, shapes: [{ color, pos, idx, twoSided }] }
const part = (name, pivot = [0, 0, 0]) => (parts[name] = { pivot, shapes: [] });
const add = (name, color, shape) => parts[name].shapes.push({ color, ...shape });

const WHEEL_R = 0.36, WHEEL_W = 0.22, AXLE_Y = -0.3 + WHEEL_R, TRACK = 0.69, BASE = 0.84;
const DECK = 0.2; // top of the chassis

part('body');
add('body', C.frame, box(1.0, 0.1, 2.3, [0, DECK - 0.05, 0]));          // chassis
add('body', C.dark, box(0.5, 0.012, 0.9, [0, DECK + 0.006, -0.05]));     // floor panel under the seats
for (const sx of [-1, 1]) for (const sz of [-1, 1]) {                    // suspension arms
  add('body', C.dark, box(0.3, 0.05, 0.07, [sx * 0.55, (DECK - 0.05 + AXLE_Y) / 2 + 0.02, sz * BASE]));
}
// Two seats: tube frames with webbing, the backs leaning back a little.
for (const sx of [-1, 1]) {
  add('body', C.dark, box(0.42, 0.05, 0.42, [sx * 0.26, DECK + 0.2, -0.2]));
  add('body', C.dark, box(0.42, 0.5, 0.05, [sx * 0.26, DECK + 0.45, -0.46], 0.22));
  add('body', C.frame, box(0.04, 0.2, 0.04, [sx * 0.26, DECK + 0.1, -0.05]));
  add('body', C.frame, box(0.04, 0.2, 0.04, [sx * 0.26, DECK + 0.1, -0.36]));
  add('body', C.frame, box(0.3, 0.03, 0.2, [sx * 0.26, DECK + 0.04, 0.3]));  // footrest
}
// Console between the seats, with the T-handle the commander steers with.
add('body', C.frame, box(0.22, 0.3, 0.3, [0, DECK + 0.25, 0.28], -0.35));
add('body', C.dark, box(0.04, 0.14, 0.04, [0, DECK + 0.36, -0.02]));
add('body', C.dark, box(0.12, 0.04, 0.04, [0, DECK + 0.44, -0.02]));
// Front: batteries and the radio box under white blankets, a strip of gold foil on top.
add('body', C.white, box(0.86, 0.26, 0.42, [0, DECK + 0.13, 0.9]));
add('body', C.foil, box(0.5, 0.03, 0.3, [0, DECK + 0.275, 0.9]));
// Rear: the tool pallet and sample bags.
add('body', C.white, box(0.8, 0.3, 0.36, [0, DECK + 0.15, -0.94]));
add('body', C.frame, box(0.04, 0.55, 0.04, [0.34, DECK + 0.42, -1.08]));
add('body', C.frame, box(0.04, 0.55, 0.04, [-0.34, DECK + 0.42, -1.08]));
add('body', C.frame, box(0.72, 0.04, 0.04, [0, DECK + 0.68, -1.08]));

// Four wheels, each its own part so it can spin about its axle. Fenders stay still.
for (const [row, sz] of [['F', 1], ['R', -1]]) for (const [side, sx] of [['L', 1], ['R', -1]]) {
  const name = `wheel_${row}${side}`, at = [sx * TRACK, AXLE_Y, sz * BASE];
  part(name, at);
  add(name, C.tyre, cylinder(WHEEL_R, WHEEL_W, 12, at, 'x'));
  add(name, C.hub, cylinder(WHEEL_R * 0.45, WHEEL_W + 0.03, 8, at, 'x'));
  for (let i = 0; i < 6; i++) {                                           // chevron treads, so you can see it turn
    const a = (i / 6) * Math.PI * 2;
    add(name, C.hub, box(WHEEL_W * 0.8, 0.03, 0.09, [at[0], at[1] + Math.sin(a) * WHEEL_R, at[2] + Math.cos(a) * WHEEL_R], a - Math.PI / 2));
  }
  // The fender covers the top and the back of the wheel. The right rear one is the one that breaks
  // in the story, so it is a separate part.
  const f = fender(WHEEL_R + 0.07, WHEEL_W + 0.06, at, sz > 0 ? 0.5 : 0.9, sz > 0 ? 2.4 : 3.0);
  const fname = row === 'R' && side === 'R' ? 'fender_RR' : 'body';
  if (fname !== 'body') part(fname, at);
  add(fname, C.fender, f);
}

// The TV camera on its post, front right. This is the head: the eyes go on the camera.
const HEAD = [-0.36, DECK, 0.98];
part('head', HEAD);
add('head', C.frame, cylinder(0.03, 0.5, 6, [HEAD[0], DECK + 0.25, HEAD[2]]));
add('head', C.camera, box(0.42, 0.24, 0.3, [HEAD[0], DECK + 0.62, HEAD[2] + 0.03]));
add('head', C.dark, cylinder(0.06, 0.1, 8, [HEAD[0], DECK + 0.47, HEAD[2]]));

// The umbrella antenna on its mast, front left. This is the mouth.
const ANT = [0.36, DECK, 0.98];
part('antenna', ANT);
add('antenna', C.frame, cylinder(0.025, 0.95, 6, [ANT[0], DECK + 0.475, ANT[2]]));
add('antenna', C.foil, dish(0.42, 0.16, 10, [ANT[0], DECK + 0.95, ANT[2]], 0.5));
add('antenna', C.dark, cylinder(0.02, 0.2, 5, [ANT[0], DECK + 1.05, ANT[2] + 0.05]));

// ---- write the file ----

const lin = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map((v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
const doc = new Document(); const buffer = doc.createBuffer(); const scene = doc.createScene('lrv');
const mats = new Map();
function material(color, twoSided) {
  const key = color + (twoSided ? 'd' : '');
  if (!mats.has(key)) mats.set(key, doc.createMaterial('c_' + color.toString(16) + (twoSided ? '_2' : '')).setBaseColorFactor([...lin(color), 1]).setRoughnessFactor(0.9).setMetallicFactor(0).setDoubleSided(!!twoSided));
  return mats.get(key);
}
let tris = 0;
const min = [9, 9, 9], max = [-9, -9, -9];
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
doc.getRoot().getAsset().copyright = 'Team Relica. Built from simple shapes after NASA photos of the Apollo 17 Lunar Roving Vehicle.';
const outDir = process.argv[2] ?? '../../public/models';
const file = `${outDir}/lrv.glb`;
await new NodeIO().write(file, doc);
console.log(`lrv ${tris} tris | ${(fs.statSync(file).size / 1024).toFixed(0)} KB | ${max.map((v, i) => (v - min[i]).toFixed(2)).join(' x ')} m | lowest y ${min[1].toFixed(2)} | parts ${Object.keys(parts).join(',')}`);
