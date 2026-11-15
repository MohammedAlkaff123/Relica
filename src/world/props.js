// Things that stand in the world but are not characters. Owner: Set B.
//
//   const lm = createProp('lunarModule')
//   scene.add(lm)                          every prop is a normal THREE object, origin on the ground
//   lm.position.set(x, heightAt(world, x, z), z)
//   await lm.userData.ready                only for the three props that load a file; true when it is in
//   lm.getObjectByName('ascent')           the top half, to lift it off
//
// Names:
//   lunarModule   parts `descent` and `ascent`. 9 m wide, 7 m tall
//   astronaut     1.8 m, mirror visor, backpack, no flag or logo. Use it twice for the crew.
//                 Jointed and self-animating: it breathes, walks when moved, sits when put on the rover.
//                 Parts `head`, `arm_L` `arm_R`, `hand_L` `hand_R`, `leg_L` `leg_R`, `visor`.
//                 For the rover's eyes: hero.lookAt(astronaut.getObjectByName('head'))
//   perseverance  plain grey shape for the background of chapter 3
//   airbags       the bundle Opportunity lands in. A ball 2.2 m across, origin at its centre
//   petals        the lander base with three petals. Parts `petal_1` `petal_2` `petal_3`:
//                 rotation.x = 0 is open flat, PETAL_CLOSED is folded up
//   marker        science-stop marker, 2.4 m pole with a blue top
//   ring          flight ring, 4.4 m across, standing upright facing +Z, origin at its centre
//   rock          one rock. createProp('rock', { size: 1.5, seed: 7 }). All rocks share one shape
//   layeredRock   the layered outcrop Opportunity studies
//   pebbles       the patch of tiny round pebbles, 1.6 m across
//   sampleBox     one sample box, to stack on the back of the Moon rover
//   worker        a factory worker: the same jointed figure as the astronaut, in a hooded
//                 clean-room suit with mask and goggles instead of the helmet and backpack. Same parts
//
// The Lunar Module and Perseverance are adapted from NASA's 3D Resources: see public/models/README.md.
// The people are built here from boxes, so they can have joints.
import * as THREE from 'three';
import { softPoints } from './softPoints.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { presetFor, initialQuality } from './quality.js';
import { shareResources } from './resources.js';

export const PETAL_CLOSED = -1.91; // radians: the three petals meet in a point

const EARTH_BLUE = 0x4f86c6;
const loader = new GLTFLoader();
const files = new Map(); // name -> promise of the loaded scene, so a file is fetched once

const mats = new Map();
function flat(color, extra) {
  if (extra) return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, ...extra });
  if (!mats.has(color)) mats.set(color, new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9 }));
  mats.get(color).userData.shared = true;
  return mats.get(color);
}

function rng(seed) {
  let s = (seed % 2147483646) + 1;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

// A prop that comes from public/models/<name>.glb. Until the file arrives the group is empty;
// if it never arrives, a plain box of the right size stands in so the chapter still works.
function fromFile(name, size, marks = {}) {
  const group = new THREE.Group();
  // Empty named points, there from the start, for things like hero.lookAt(prop.getObjectByName('hand_L')).
  for (const [mark, at] of Object.entries(marks)) {
    const point = new THREE.Object3D();
    point.name = mark;
    point.position.set(...at);
    group.add(point);
  }
  if (!files.has(name)) {
    const url = new URL(`../../public/models/${name}.glb`, import.meta.url).href;
    files.set(name, loader.loadAsync(url).then((g) => { shareResources(g.scene); return g.scene; }, () => null));
  }
  group.userData.ready = files.get(name).then((scene) => {
    if (group.userData.disposed) return false;
    if (scene) { group.add(scene.clone(true)); return true; } // clones share the geometry
    const box = new THREE.Mesh(new THREE.BoxGeometry(...size), flat(0x9a9da3));
    box.position.y = size[1] / 2;
    group.add(box);
    return false;
  });
  return group;
}

// ---- people ----
// One jointed figure for both the astronauts and the factory workers: hips, knees, shoulders,
// elbows and a head, each a group that turns. It moves itself, with nothing to call:
//   standing still   it breathes, shifts its weight and looks around a little
//   being moved      it walks, one step every 0.55 m, arms swinging
//   put on a vehicle it climbs up and sits, legs out in front
// "Put on a vehicle" means its parent is not the scene or the world. A chapter only has to slide
// it across the ground (stage.moveTo) or add it to the rover (hero.object.add), as it does now.
const SIT = { legL: -1.45, legR: -1.45, kneeL: 0.3, kneeR: 0.3, armL: -0.75, armR: -0.75, elbowL: -0.7, elbowR: -0.7, lean: -0.1, drop: -0.38 };

// Band colours of the Moon crew, in the order they are made: orange, then the commander's red
// (Apollo 17's commander wore red bands so the two could be told apart in photos).
const BANDS = [0xe07a3a, 0xc8452f];
let crew = 0;

function makeFigure(kind) {
  const astro = kind === 'astronaut';
  const w = astro ? 1.15 : 1; // a pressure suit is bulkier than a clean-room suit
  const suit = flat(astro ? 0xe8e6df : 0xf1f3f5), shade = flat(astro ? 0xcfccc2 : 0xd3d9e0);
  const glove = flat(astro ? 0xb9bec6 : 0x8fb4d6), boot = flat(0x9aa3ae), dark = flat(0x1f2a38);
  const g = new THREE.Group();
  const rig = new THREE.Group(); // everything you see; the animation moves this, never `g`
  g.add(rig);
  const box = (parent, sx, sy, sz, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); parent.add(m); return m; };
  const joint = (parent, name, x, y, z) => { const j = new THREE.Group(); j.name = name; j.position.set(x, y, z); parent.add(j); return j; };

  const hips = joint(rig, 'hips', 0, 0.92, 0);
  const spine = joint(hips, 'spine', 0, 0, 0);
  const head = joint(spine, 'head', 0, 0.66, 0);
  const J = { hips, spine, head };
  let torso;
  {
    // One suit for everyone, the Moon crew and the factory workers alike: a low-poly suit with more to look at than the rest of the cast, by the
    // directors' exception. Cream cloth, charcoal pack, gloves and boots, coloured bands at the
    // arms, knees and ankles. The joints and their names are the same as before, so every action
    // (walk, sit, collect, repair, pat, wave) still drives it.
    const cream = flat(0xe9dcc3), seam = flat(0xcdbfa4), char = flat(0x4a4640), glass = flat(0x26221f);
    const band = flat(BANDS[crew++ % BANDS.length]);
    // A shape with a few flat sides, narrower at one end: n sides, radius at the top and the bottom,
    // height, then how deep it is front to back (1 = round).
    const prism = (parent, n, rTop, rBot, h, x, y, z, mat, deep = 1) => {
      const geo = new THREE.CylinderGeometry(rTop, rBot, h, n);
      geo.rotateY(Math.PI / n); // a flat side to the front
      geo.scale(1, 1, deep);
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m;
    };
    torso = prism(spine, 6, 0.27, 0.215, 0.5, 0, 0.31, 0, cream, 0.72);
    prism(spine, 8, 0.15, 0.19, 0.07, 0, 0.585, 0, char);             // neck ring
    box(spine, 0.5, 0.05, 0.35, 0, 0.4, 0, char);                      // chest strap
    box(spine, 0.45, 0.08, 0.32, 0, 0.08, 0, char);                    // belt
    box(spine, 0.11, 0.07, 0.04, 0, 0.08, 0.165, seam);                // buckle
    box(spine, 0.16, 0.13, 0.05, 0, 0.25, 0.175, seam);                // chest control box
    box(spine, 0.035, 0.035, 0.02, 0.04, 0.27, 0.205, band);           // its one light
    box(spine, 0.42, 0.62, 0.2, 0, 0.37, -0.27, char);                 // life-support pack
    box(spine, 0.28, 0.3, 0.03, 0, 0.42, -0.375, seam);                // panel on its back
    box(spine, 0.014, 0.36, 0.014, 0.15, 0.86, -0.3, char);            // aerial
    box(spine, 0.035, 0.035, 0.035, 0.15, 1.05, -0.3, flat(0xe3a23c)); // amber tip, like the rovers'
    head.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 1), cream));
    const visor = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), glass); // dark glass: no face
    visor.scale.set(1.04, 0.92, 0.82); visor.position.set(0, -0.01, 0.115); visor.name = 'visor';
    head.add(visor);
    for (const sx of [1, -1]) box(head, 0.06, 0.12, 0.12, sx * 0.235, -0.01, 0, char); // ear pieces
    for (const [side, sx] of [['L', 1], ['R', -1]]) {
      const arm = joint(spine, 'arm_' + side, sx * 0.31, 0.5, 0);
      prism(arm, 6, 0.1, 0.09, 0.1, 0, -0.02, 0, cream);              // shoulder
      prism(arm, 6, 0.085, 0.075, 0.3, 0, -0.15, 0, cream);
      prism(arm, 6, 0.093, 0.089, 0.045, 0, -0.21, 0, band);
      const elbow = joint(arm, 'elbow_' + side, 0, -0.3, 0);
      prism(elbow, 6, 0.075, 0.07, 0.26, 0, -0.13, 0, cream);
      prism(elbow, 6, 0.088, 0.088, 0.05, 0, -0.25, 0, char);         // cuff
      box(elbow, 0.13, 0.15, 0.15, 0, -0.34, 0, char).name = 'hand_' + side;
      const leg = joint(hips, 'leg_' + side, sx * 0.13, 0, 0);
      prism(leg, 6, 0.11, 0.095, 0.44, 0, -0.22, 0, cream);
      const knee = joint(leg, 'knee_' + side, 0, -0.44, 0);
      box(knee, 0.13, 0.12, 0.06, 0, -0.03, 0.085, band);             // knee pad
      prism(knee, 6, 0.095, 0.085, 0.4, 0, -0.2, 0, cream);
      prism(knee, 6, 0.098, 0.098, 0.04, 0, -0.35, 0, band);
      box(knee, 0.19, 0.11, 0.31, 0, -0.425, 0.05, char);             // boot
      J['arm' + side] = arm; J['elbow' + side] = elbow; J['leg' + side] = leg; J['knee' + side] = knee;
    }
  }

  // ---- it animates itself: this runs once a frame, when the torso is about to be drawn ----
  const seed = Math.random() * 10;
  let action = null, actionTime = 0, elapsed = 0, managed = false;
  const ACTIONS = new Set(['collect', 'repair', 'reassure', 'farewell']);
  const pose = { legL: 0, legR: 0, kneeL: 0, kneeR: 0, armL: 0, armR: 0, armSideL: 0, armSideR: 0, headPitch: 0, elbowL: -0.15, elbowR: -0.15, lean: 0, drop: 0 };
  const want = { ...pose };
  const at = new THREE.Vector3(), was = new THREE.Vector3(), lag = new THREE.Vector3(), v = new THREE.Vector3();
  const q = new THREE.Quaternion(), sc = new THREE.Vector3();
  let lastTime = 0, lastParent = null, phase = 0, walk = 0, lagStart = 0;

  torso.frustumCulled = false; // always drawn, so this always runs, even if the body has swung out of view
  function animate(dt) {
    dt = Math.min(.05, Math.max(0.0001, dt));
    elapsed += dt; actionTime += dt;
    const now = elapsed, fresh = lastTime === 0;
    lastTime = now;
    g.getWorldPosition(at);
    if (fresh) { was.copy(at); lastParent = g.parent; lag.set(0, 0, 0); }

    // A sudden jump (put on a seat, taken off it): keep the body where it was and ease it over,
    // with a little hop, instead of snapping.
    const jumped = g.parent !== lastParent || at.distanceTo(was) > 0.6;
    if (jumped) {
      lag.add(was).sub(at);
      if (lag.length() > 1.6) lag.set(0, 0, 0); // further than a climb on or off: it was placed there, so just be there
      lagStart = lag.length();
    }
    const speed = jumped || fresh ? 0 : Math.hypot(at.x - was.x, at.z - was.z) / dt;
    was.copy(at); lastParent = g.parent;

    const parentName = g.parent?.name ?? '';
    const riding = !!g.parent && !g.parent.isScene && !parentName.startsWith('world:');
    walk += ((riding ? 0 : Math.min(1, speed / 1.0)) - walk) * (1 - Math.exp(-10 * dt));
    if (!riding) phase += speed * dt * (Math.PI / 0.55);
    const swing = Math.sin(phase), t = now + seed, breath = Math.sin(t * 1.5);

    want.armSideL = want.armSideR = want.headPitch = 0;
    if (riding) Object.assign(want, SIT);
    else {
      want.legL = -swing * 0.5 * walk; want.legR = swing * 0.5 * walk;                 // forward is negative
      want.kneeL = Math.max(0, Math.cos(phase)) * 0.75 * walk;                         // the knee bends as the leg comes through
      want.kneeR = Math.max(0, -Math.cos(phase)) * 0.75 * walk;
      want.armL = swing * 0.4 * walk + Math.sin(t * 0.8) * 0.02; want.armR = -swing * 0.4 * walk - Math.sin(t * 0.8) * 0.02;
      want.elbowL = want.elbowR = -0.15 - 0.2 * walk;
      want.lean = 0.05 * walk; want.drop = 0;
    }
    if (action && !riding) {
      const reach = Math.sin(actionTime * 3 + seed * .2);
      if (action === 'collect') Object.assign(want, {
        legL: -1.25, kneeL: 1.65, legR: -.3, kneeR: 1.1, drop: -.38,
        lean: .42, armL: -.45, armR: -.75 + reach * .12, elbowL: -.5, elbowR: -.35, headPitch: .4,
      });
      if (action === 'repair') Object.assign(want, {
        legL: -.55, legR: -.55, kneeL: 1.05, kneeR: 1.05, drop: -.22,
        lean: .3, armL: -1.05, armR: -1.05 + reach * .09, elbowL: -.5, elbowR: -.5 - reach * .12, headPitch: .25,
      });
      if (action === 'reassure') Object.assign(want, {
        lean: .08, armR: -1.12 + Math.sin(actionTime * 2.5) * .035, elbowR: -.22, headPitch: .14,
      });
      if (action === 'farewell') Object.assign(want, {
        armR: -2.4, elbowR: -.6, armSideR: -.35 + Math.sin(actionTime * 4) * .18, headPitch: -.08,
      });
    }
    const k = 1 - Math.exp(-9 * dt);
    for (const key of Object.keys(pose)) pose[key] += (want[key] - pose[key]) * k;

    J.legL.rotation.x = pose.legL; J.legR.rotation.x = pose.legR;
    J.kneeL.rotation.x = pose.kneeL; J.kneeR.rotation.x = pose.kneeR;
    J.armL.rotation.x = pose.armL; J.armR.rotation.x = pose.armR;
    J.armL.rotation.z = pose.armSideL; J.armR.rotation.z = pose.armSideR;
    J.elbowL.rotation.x = pose.elbowL; J.elbowR.rotation.x = pose.elbowR;
    J.spine.rotation.x = pose.lean;
    const still = 1 - walk;
    J.hips.rotation.y = swing * 0.06 * walk;
    J.hips.rotation.z = riding ? 0 : Math.sin(t * 0.4) * 0.02 * still;                 // weight from foot to foot
    // Breathing: the chest fills, the shoulders lift a touch. The head looks about slowly.
    torso.scale.set(1 + 0.015 * breath, 1 + 0.01 * breath, 1 + 0.045 * breath);
    J.armL.position.y = J.armR.position.y = 0.5 + 0.007 * breath;
    J.head.rotation.y = Math.sin(t * 0.31) * 0.16 * still;
    J.head.rotation.x = pose.headPitch + Math.sin(t * 0.23 + 1) * 0.04;

    lag.multiplyScalar(Math.exp(-6 * dt));
    if (lag.lengthSq() < 1e-5) lag.set(0, 0, 0);
    const u = lagStart > 0 ? Math.min(1, lag.length() / lagStart) : 0;
    const hop = 4 * u * (1 - u) * 0.3 * Math.min(1, lagStart);
    g.getWorldQuaternion(q).invert(); g.getWorldScale(sc);
    v.copy(lag).setY(lag.y + hop).applyQuaternion(q).divide(sc);                       // world offset -> our own space
    rig.position.set(v.x, v.y + pose.drop + Math.abs(swing) * 0.035 * walk, v.z);
  };
  let fallbackTime = performance.now();
  torso.onBeforeRender = () => {
    if (managed) return;
    const now = performance.now(); if (now - fallbackTime < 2) return;
    animate((now - fallbackTime) / 1000); fallbackTime = now;
  };
  g.userData.updateFigure = (dt) => { managed = true; animate(dt); };
  g.userData.act = (name) => {
    if (name !== null && !ACTIONS.has(name)) throw new Error('Unknown figure action: ' + name);
    if (action !== name) { action = name; actionTime = 0; }
  };
  g.userData.figure = { pose, lag, was, get action() { return action; }, get time() { return actionTime; } };
  return g;
}

const rockShape = new THREE.IcosahedronGeometry(1, 0);
rockShape.userData.shared = true;
const ball = new THREE.IcosahedronGeometry(1, 1);
ball.userData.shared = true;

// Wheels that turn with the ground covered, forward or backward, however the prop is moved.
// Any part of the model named "wheel_..." rolls; `radius` is the wheel's, in metres.
function rolling(group, radius) {
  const at = new THREE.Vector3(), last = new THREE.Vector3(), ahead = new THREE.Vector3(), q = new THREE.Quaternion();
  let wheels = null, fresh = true;
  group.userData.updateFigure = () => {
    if (!wheels) {
      const found = [];
      group.traverse((o) => { if (o.name.startsWith('wheel_') && !o.parent?.name.startsWith('wheel_')) found.push(o); });
      if (!found.length) return; // the model has not arrived yet
      wheels = found;
    }
    group.getWorldPosition(at);
    if (fresh) { last.copy(at); fresh = false; }
    ahead.set(0, 0, 1).applyQuaternion(group.getWorldQuaternion(q));
    const moved = (at.x - last.x) * ahead.x + (at.z - last.z) * ahead.z; // along its own nose: negative when backing up
    last.copy(at);
    if (Math.abs(moved) < 3) for (const w of wheels) w.rotation.x += moved / radius; // a bigger step is a placement, not a drive
  };
  return group;
}

const BUILDERS = {
  lunarModule: () => fromFile('lunarModule', [9, 7, 9]),
  astronaut: () => makeFigure('astronaut'),
  perseverance: () => rolling(fromFile('perseverance', [2.7, 1.85, 3.1]), 0.26),

  // Four lobes of six bags each, like the real pyramid of airbags.
  airbags() {
    const g = new THREE.Group();
    const cloth = flat(0xd9cdb4);
    const corners = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
    for (const c of corners) {
      const dir = new THREE.Vector3(...c).normalize();
      const side = new THREE.Vector3(0, 1, 0).cross(dir).normalize();
      const up = dir.clone().cross(side);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const bag = new THREE.Mesh(ball, cloth);
        bag.scale.setScalar(0.42);
        bag.position.copy(dir).multiplyScalar(0.55).addScaledVector(side, Math.cos(a) * 0.42).addScaledVector(up, Math.sin(a) * 0.42);
        g.add(bag);
      }
    }
    return g;
  },

  petals() {
    const g = new THREE.Group();
    const metal = flat(0xbdb7a8), panel = flat(0x2c3350);
    const R = 0.75; // base triangle: distance from the centre to an edge
    const base = new THREE.Mesh(new THREE.CylinderGeometry(R * 2, R * 2, 0.12, 3), metal);
    base.position.y = 0.06;
    g.add(base);
    for (let i = 0; i < 3; i++) {
      // A holder on the edge of the base, facing outward; the petal hinges inside it.
      const holder = new THREE.Group();
      holder.rotation.y = (i / 3) * Math.PI * 2 + Math.PI / 3;
      const petal = new THREE.Group();
      petal.name = `petal_${i + 1}`;
      petal.position.set(0, 0.1, R);
      const shape = new THREE.Shape().moveTo(-R * 1.73, 0).lineTo(R * 1.73, 0).lineTo(0, R * 3).closePath();
      const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false }), metal);
      plate.rotation.x = Math.PI / 2; // lie flat, pointing outward
      const cells = new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape().moveTo(-R * 1.2, 0.2).lineTo(R * 1.2, 0.2).lineTo(0, R * 2.3).closePath(), { depth: 0.02, bevelEnabled: false }), panel);
      cells.rotation.x = Math.PI / 2;
      cells.position.y = 0.025;
      petal.add(plate, cells);
      holder.add(petal);
      g.add(holder);
    }
    return g;
  },

  marker() {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 5), flat(0xe8e4d8));
    pole.position.y = 1.1;
    const top = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), flat(EARTH_BLUE, { emissive: EARTH_BLUE, emissiveIntensity: 0.6 }));
    top.name = 'top';
    top.position.y = 2.3;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.06, 6), flat(0x8c8676));
    foot.position.y = 0.03;
    g.add(pole, top, foot);
    return g;
  },

  // Bright and unlit, so it reads against the sky in a dust storm too.
  ring() {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.07, 5, 20), new THREE.MeshBasicMaterial({ color: 0xcfe2f5, fog: false }));
    const g = new THREE.Group();
    g.add(ring);
    return g;
  },

  rock({ size = 1, seed = 1, color = 0x74767b } = {}) {
    const r = rng(seed * 7919 + 11);
    const rock = new THREE.Mesh(rockShape, flat(color));
    rock.scale.set(size * (0.8 + r() * 0.5), size * (0.45 + r() * 0.3), size * (0.8 + r() * 0.5));
    rock.rotation.y = r() * Math.PI * 2;
    rock.position.y = rock.scale.y * 0.35;
    const g = new THREE.Group();
    g.add(rock);
    return g;
  },

  // Thin slabs stacked a little out of line: layers laid down one after another.
  layeredRock({ color = 0x9a5a38 } = {}) {
    const g = new THREE.Group();
    const r = rng(42);
    const light = flat(color), dark = flat(new THREE.Color(color).multiplyScalar(0.78).getHex());
    let y = 0;
    for (let i = 0; i < 7; i++) {
      const h = 0.1 + r() * 0.08, w = 1.9 - i * 0.16 + r() * 0.2;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 0.7), i % 2 ? dark : light);
      slab.position.set((r() - 0.5) * 0.2, y + h / 2, (r() - 0.5) * 0.15);
      slab.rotation.y = (r() - 0.5) * 0.25;
      g.add(slab);
      y += h;
    }
    return g;
  },

  // Sixty little grey-blue balls, drawn as one object.
  pebbles() {
    const count = 60, r = rng(2004);
    const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), flat(0x5b6470), count);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.8, size = 0.025 + r() * 0.03;
      m.compose(p.set(Math.cos(a) * d, size * 0.7, Math.sin(a) * d), q, s.setScalar(size));
      mesh.setMatrixAt(i, m);
    }
    const g = new THREE.Group();
    g.add(mesh);
    return g;
  },

  // Mission props replace Set A's stand-ins automatically via PROP_NAMES.
  heightBand() {
    const g = new THREE.Group();
    for (const y of [-.5,.5]) for (let i=0;i<4;i++) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(2.4,.025,4,12,Math.PI*.32), new THREE.MeshBasicMaterial({color:0x8fd3ff,transparent:true,opacity:.55,depthWrite:false}));
      arc.rotation.set(Math.PI/2,0,i*Math.PI/2);arc.position.y=y;g.add(arc);
    }
    return g;
  },
  flag() {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,1.5,6),flat(0xdad9ce));pole.position.y=.75;
    const tab = new THREE.Mesh(new THREE.BoxGeometry(.48,.28,.025),flat(0xe3a23c));tab.position.set(.24,1.3,0);
    g.add(pole,tab);return g;
  },
  sandTrap() {
    const g = new THREE.Group();
    const patch = new THREE.Mesh(new THREE.CircleGeometry(4,32),flat(0xc29469));patch.rotation.x=-Math.PI/2;patch.position.y=.025;g.add(patch);
    for(let i=0;i<8;i++) {
      const ridge=new THREE.Mesh(new THREE.CylinderGeometry(.045,.07,5,5),flat(0xb18159));
      ridge.rotation.z=Math.PI/2;ridge.position.set(0,.04,(i-3.5)*.55);g.add(ridge);
    }
    return g;
  },
  boulders() {
    const g = new THREE.Group();
    for(let i=0;i<9;i++) {
      const rock=BUILDERS.rock({size:.6+((i*37)%10)/10,seed:i+7,color:0x7c4329});
      rock.position.set(Math.cos(i*2.4)*(1+i*.35),0,Math.sin(i*2.4)*(1+i*.35));g.add(rock);
    }
    return g;
  },
  cliffEdge() {
    const g = new THREE.Group();
    for(let i=0;i<4;i++) {
      const slab=new THREE.Mesh(new THREE.BoxGeometry(10-i*.2,.65,1.3+i*.4),flat(i%2?0x874b30:0x9a5634));
      slab.position.set(0,-2+i*.6,-i*.2);g.add(slab);
    }
    return g;
  },
  // A hazy column of dust, 14 m tall, that leans and snakes slowly, with a low skirt of dust
  // round its foot. It moves by itself (the stage calls updateFigure on everything each frame).
  whirlwind() {
    const g = new THREE.Group(), random = rng(481);
    const SKIRT = 24, COLUMN = 110, count = SKIRT + COLUMN, H = 14;
    const puffs = softPoints(count, 0xc79a72);
    g.add(puffs.points);
    const skirt = Array.from({ length: SKIRT }, (_, i) => ({ a: (i / SKIRT) * Math.PI * 2, p: random() }));
    const column = Array.from({ length: COLUMN }, (_, i) => ({ y: (i / COLUMN) * H, a: random() * Math.PI * 2, lift: 1 + random() * 1.2, turn: 1.8 + random() * 1.2 }));
    let time = random() * 20;
    g.userData.updateFigure = (dt) => {
      time += dt;
      // The chapter spins the whole prop quickly (a habit from the old spiral of dots). The column
      // must not whirl round like a stick, so it turns itself back by the same amount.
      puffs.points.rotation.y = -g.rotation.y;
      skirt.forEach((u, i) => {
        u.p = (u.p + dt * 0.45) % 1; u.a += dt * 1.8;
        const r = 0.8 + u.p * 4.4;
        puffs.pos.set([Math.cos(u.a) * r, 0.4 + u.p * 1, Math.sin(u.a) * r], i * 3);
        puffs.size[i] = 1.6 + u.p * 3.2; puffs.alpha[i] = 0.36 * (1 - u.p);
      });
      column.forEach((u, k) => {
        const i = SKIRT + k;
        u.y = (u.y + u.lift * dt) % H; u.a += u.turn * dt;
        const r = (0.44 + u.y * 0.14) * 0.75; // narrow at the ground, wider at the top
        const leanX = Math.sin(u.y * 0.22 + time * 0.7) * 0.07 * u.y, leanZ = Math.cos(u.y * 0.18 + time * 0.5) * 0.05 * u.y;
        puffs.pos.set([leanX + Math.cos(u.a) * r, u.y, leanZ + Math.sin(u.a) * r], i * 3);
        puffs.size[i] = 1.8 + u.y * 0.34;
        puffs.alpha[i] = 0.3 * Math.min(1, u.y) * Math.min(1, (H - u.y) / 3); // thin at the foot, fading out at the top
      });
      puffs.touch();
    };
    g.userData.updateFigure(0);
    g.userData.applyQuality = (p) => puffs.geo.setDrawRange(0, Math.round(count * Math.max(0.5, p.dustScale)));
    g.userData.applyQuality(presetFor(initialQuality()));
    return g;
  },

  worker: () => makeFigure('worker'),

  sampleBox() {
    const g = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.2, 0.28), flat(0xeeeae0));
    box.position.y = 0.1;
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.21, 0.29), flat(0x4a4e56));
    strap.position.y = 0.1;
    g.add(box, strap);
    return g;
  },
};

export const PROP_NAMES = Object.keys(BUILDERS);

export function createProp(name, options) {
  const build = BUILDERS[name];
  if (!build) throw new Error(`unknown prop "${name}". Known: ${PROP_NAMES.join(', ')}`);
  const prop = build(options);
  prop.name = name;
  prop.userData.ready ??= Promise.resolve(true);
  prop.userData.ready.then(() => prop.traverse((o) => {
    if (o.isMesh && !o.material?.transparent) { o.castShadow = true; o.receiveShadow = true; }
  }));
  return prop;
}
