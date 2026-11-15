// Builds the big rover of chapter 3 (Mars 2020 Perseverance) from simple shapes and writes
// perseverance.glb. NASA's own model, cut down to a few thousand triangles, fell apart into loose
// shards, so this one is ours: the outline of the real rover and nothing smaller than a camera.
//   node build_perseverance.mjs [outDir]
//
// Front is +Z, up is +Y. Metres, real size: 3 m long, 2.7 m wide, 2.2 m to the top of the mast.
// A prop: centred in X and Z, wheels on y = 0. Parts: body, head (the camera mast; it can turn),
// and six wheels, wheel_FL ... wheel_BR, each turning about its own hub.
import fs from 'node:fs';
import { Document, NodeIO } from '@gltf-transform/core';

const C = {
  white: 0xe6e3da,  // the deck and the equipment box
  frame: 0xb9b6ad,  // suspension tubes, the arm
  dark: 0x3f4248,   // wheels, joints, lenses
  hub: 0x8f9298,
  black: 0x24262b,  // camera glass
  gold: 0xc9a65a,   // the gold-coloured box of the power source's heat shields
  rtg: 0x55585f,    // the power source at the back
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

const parts = {}; // name -> { pivot, shapes: [{ color, pos, idx, twoSided }] }
const part = (name, pivot = [0, 0, 0]) => (parts[name] = { pivot, shapes: [] });
const add = (name, color, shape) => parts[name].shapes.push({ color, ...shape });
// A straight bar between two points in the same side plane (same x): a suspension tube.
const bar = (x, [y0, z0], [y1, z1], thick, wide = thick) => box(wide, thick, Math.hypot(y1 - y0, z1 - z0), [x, (y0 + y1) / 2, (z0 + z1) / 2], Math.atan2(y1 - y0, z1 - z0));

const WHEEL_R = 0.26, WHEEL_W = 0.32, TRACK = 1.18;
const AXLES = [1.2, 0.05, -1.05];        // front, middle, back
const BODY_Y = 0.72, BODY_H = 0.42;      // underside of the equipment box, and its height
const DECK = BODY_Y + BODY_H;

part('body');
// The equipment box and the deck on top of it, a little wider, like a lid.
add('body', C.white, box(1.5, BODY_H, 2.0, [0, BODY_Y + BODY_H / 2, 0.05]));
add('body', C.frame, box(1.62, 0.05, 2.12, [0, DECK + 0.025, 0.05]));
add('body', C.dark, box(1.52, 0.06, 2.02, [0, BODY_Y - 0.03, 0.05]));           // belly pan
add('body', C.gold, box(0.9, 0.2, 0.06, [0, BODY_Y + 0.24, -0.98]));            // gold panel at the back

// The power source: a finned drum tipped up at the back.
add('body', C.rtg, box(0.46, 0.46, 0.72, [0, DECK + 0.06, -1.22], -0.6));
for (const dx of [-0.3, 0.3]) add('body', C.white, box(0.04, 0.6, 0.66, [dx, DECK + 0.06, -1.22], -0.6)); // two fins

// On the deck: the flat six-sided dish, a short pole antenna, a low instrument box.
add('body', C.frame, cylinder(0.03, 0.22, 6, [0.42, DECK + 0.16, -0.45]));
add('body', C.white, dish(0.3, 0.03, 6, [0.42, DECK + 0.27, -0.45], 0.35));
add('body', C.frame, cylinder(0.035, 0.42, 6, [-0.5, DECK + 0.26, -0.7]));
add('body', C.dark, cylinder(0.055, 0.1, 6, [-0.5, DECK + 0.5, -0.7]));
add('body', C.frame, box(0.5, 0.12, 0.42, [-0.3, DECK + 0.11, 0.1]));
add('body', C.dark, box(0.34, 0.02, 0.3, [-0.3, DECK + 0.18, 0.1]));

// The arm, folded across the front, with the heavy tool turret at its end.
add('body', C.frame, box(0.12, 0.12, 0.34, [0.55, BODY_Y + 0.22, 1.2]));        // shoulder
add('body', C.frame, box(1.0, 0.1, 0.1, [0.1, BODY_Y + 0.24, 1.36]));           // upper arm
add('body', C.dark, cylinder(0.08, 0.14, 8, [-0.42, BODY_Y + 0.24, 1.36], 'x')); // elbow
add('body', C.frame, box(0.74, 0.09, 0.09, [-0.05, BODY_Y + 0.08, 1.38]));      // forearm
add('body', C.dark, box(0.34, 0.32, 0.26, [0.44, BODY_Y + 0.08, 1.4]));         // turret
add('body', C.hub, cylinder(0.1, 0.3, 8, [0.44, BODY_Y + 0.08, 1.4], 'x'));

// Suspension, each side: one rocker from the front wheel back to a pivot on the body, and a
// bogie under it that carries the middle and back wheels.
for (const sx of [-1, 1]) {
  const x = sx * 0.9, hubY = WHEEL_R, pivot = [BODY_Y + 0.2, 0.25], bogie = [0.62, -0.5];
  add('body', C.dark, cylinder(0.09, 0.3, 8, [sx * 0.86, pivot[0], pivot[1]], 'x'));          // pivot on the body
  add('body', C.frame, bar(x, pivot, [0.6, AXLES[0] - 0.1], 0.09));                           // rocker, forward
  add('body', C.frame, bar(x, pivot, bogie, 0.09));                                           // rocker, back
  add('body', C.dark, cylinder(0.07, 0.16, 8, [x, bogie[0], bogie[1]], 'x'));                 // bogie pivot
  add('body', C.frame, bar(x, bogie, [0.5, AXLES[1] + 0.05], 0.08));
  add('body', C.frame, bar(x, bogie, [0.5, AXLES[2] + 0.05], 0.08));
  for (const [i, z] of AXLES.entries()) {
    const top = i === 0 ? 0.6 : 0.5, zTop = i === 0 ? z - 0.1 : z + 0.05;
    add('body', C.frame, box(0.08, top - hubY + 0.06, 0.08, [x, (top + hubY) / 2, zTop]));    // leg down to the hub
    add('body', C.frame, box(Math.abs(sx * TRACK - x) + 0.1, 0.07, 0.07, [(x + sx * TRACK) / 2, hubY, zTop])); // out to the wheel
    // The wheel: a dark drum, a lighter rim each side, a few raised cleats. Each wheel is its own
    // part, turning about its hub, so the game can roll it (props.js `rolling`).
    const at = [sx * TRACK, hubY, zTop], name = `wheel_${'FMB'[i]}${sx > 0 ? 'L' : 'R'}`;
    part(name, at);
    add(name, C.dark, cylinder(WHEEL_R, WHEEL_W, 12, at, 'x'));
    add(name, C.hub, cylinder(WHEEL_R * 0.55, WHEEL_W + 0.03, 8, at, 'x'));
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      add(name, C.hub, box(WHEEL_W * 0.9, 0.025, 0.07, [at[0], at[1] + Math.sin(a) * WHEEL_R, at[2] + Math.cos(a) * WHEEL_R], a - Math.PI / 2));
    }
  }
}

// The mast with the camera head: front, to the rover's right. This is the part that turns.
const HEAD = [-0.48, DECK + 0.05, 0.72];
part('head', HEAD);
add('head', C.frame, cylinder(0.09, 0.1, 8, [HEAD[0], DECK + 0.1, HEAD[2]]));                  // foot
add('head', C.white, cylinder(0.05, 0.7, 6, [HEAD[0], DECK + 0.42, HEAD[2]]));                // mast
add('head', C.white, box(0.56, 0.22, 0.26, [HEAD[0], DECK + 0.8, HEAD[2] + 0.02]));           // camera bar
add('head', C.dark, box(0.2, 0.2, 0.3, [HEAD[0] + 0.06, DECK + 1.0, HEAD[2] + 0.02]));         // the big laser eye on top
add('head', C.black, box(0.13, 0.13, 0.03, [HEAD[0] + 0.06, DECK + 1.0, HEAD[2] + 0.185]));
for (const dx of [-0.17, 0.17]) add('head', C.black, box(0.09, 0.09, 0.03, [HEAD[0] + dx, DECK + 0.8, HEAD[2] + 0.165])); // two camera lenses

// ---- write the file ----

const lin = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map((v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
const doc = new Document(); const buffer = doc.createBuffer(); const scene = doc.createScene('perseverance');
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
doc.getRoot().getAsset().copyright = 'Team Relica. Built from simple shapes after NASA images of the Mars 2020 Perseverance rover.';
const outDir = process.argv[2] ?? '../../public/models';
const file = `${outDir}/perseverance.glb`;
await new NodeIO().write(file, doc);
console.log(`perseverance ${tris} tris | ${(fs.statSync(file).size / 1024).toFixed(0)} KB | ${max.map((v, i) => (v - min[i]).toFixed(2)).join(' x ')} m | lowest y ${min[1].toFixed(2)} | parts ${Object.keys(parts).join(',')}`);
