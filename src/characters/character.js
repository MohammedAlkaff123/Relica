// Characters and their faces. Owner: Set B.
//
//   const c = createCharacter('lrv')
//   scene.add(c.object)
//   c.setEmotion('sad')      curious | happy | scared | sad | sleepy
//   c.talk(true)             signal rings come out of the antenna
//   c.update(dt)             call every frame
//
//   c.part('wheel_FL')       a named part of the loaded model, or null
//   c.wheels                 every part whose name starts with "wheel_"
//   await c.ready            resolves when the model is in, or has failed and the boxes stay
//
// Every character starts as boxes, so the game is playable at once. If public/models/<id>.glb
// exists it replaces the boxes a moment later. If it is missing or broken the boxes stay.
// The face (eyes, lids, antenna, rings) is always built here in code and moves onto the model's
// `head` and `antenna` parts. How the models are made: public/models/README.md.
// The box size in CAST is also the physics size, so keep it close to the real model.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const modelUrl = (id) => new URL(`../../public/models/${id}.glb`, import.meta.url).href;

export const CAST = {
  lrv:         { name: 'Lunar Rover', ar: 'العربة القمرية', color: 0xd9d4c7, size: [1.6, 0.6, 2.4], wheels: true },
  opportunity: { name: 'Opportunity', ar: 'أوبورتيونيتي',  color: 0xcbb48a, size: [1.4, 0.6, 1.7], wheels: true, mast: true },
  viking:      { name: 'Viking 1',    ar: 'فايكنغ ١',       color: 0xb8b3a6, size: [1.8, 0.7, 1.8], beard: true },
  ingenuity:   { name: 'Ingenuity',   ar: 'إنجينويتي',      color: 0x9fa7b0, size: [0.5, 0.5, 0.5], rotor: true },
  pioneer:     { name: 'Pioneer 10',  ar: 'بايونير ١٠',     color: 0xd8d1bd, size: [1.0, 0.6, 1.0], dish: true, modelScale: 0.4 }, // the model is real size: a 2.74 m dish
};

// open: how open the eyes are. slant: outer corners down (sad) or up (happy).
// antenna: forward (+) or drooping back (-). nod: head up (+) or down (-).
const EMOTIONS = {
  curious: { open: 1.0,  slant: 0.0,  antenna: 0.15, nod: 0.1 },
  happy:   { open: 0.85, slant: -0.2, antenna: 0.3,  nod: 0.05 },
  scared:  { open: 1.15, slant: 0.1,  antenna: -0.2, nod: -0.05 },
  sad:     { open: 0.55, slant: 0.4,  antenna: -0.9, nod: -0.25 },
  sleepy:  { open: 0.25, slant: 0.15, antenna: -0.6, nod: -0.15 },
};

const SIGNAL = 0xe3a23c;

function flat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, ...extra });
}

export function createCharacter(id) {
  const spec = CAST[id];
  if (!spec) throw new Error(`unknown character "${id}"`);
  const [sx, sy, sz] = spec.size;
  const object = new THREE.Group();
  object.name = id;
  // Everything that is only a stand-in goes in here, so one line removes it when the model arrives.
  const boxes = new THREE.Group();
  boxes.name = 'boxes';
  object.add(boxes);

  // Body. With wheels, the box sits on top of them; the physics box covers both.
  const bodyH = spec.wheels ? sy * 0.5 : sy;
  const bodyY = spec.wheels ? sy * 0.25 : 0;
  const body = new THREE.Mesh(new THREE.BoxGeometry(sx, bodyH, sz), flat(spec.color));
  body.position.y = bodyY;
  boxes.add(body);

  if (spec.wheels) {
    const r = sy * 0.45;
    const wheel = new THREE.CylinderGeometry(r, r, 0.2, 8);
    wheel.rotateZ(Math.PI / 2);
    const tyre = flat(0x3a3d44);
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      const m = new THREE.Mesh(wheel, tyre);
      m.position.set(x * (sx / 2 + 0.05), -sy / 2 + r, z * (sz / 2 - r));
      boxes.add(m);
    }
  }

  // Face: two eyes with lids. On a mast for Opportunity, on the front of the body for the rest.
  const face = new THREE.Group();
  let faceBack = null; // the box behind the eyes on a mast; the real camera bar replaces it
  const k = Math.min(1, sx / 1.4); // smaller face on small machines
  face.scale.setScalar(k);
  if (spec.mast) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), flat(0x8c8676));
    pole.position.set(0, bodyY + bodyH / 2 + 0.45, sz / 2 - 0.3);
    boxes.add(pole);
    face.position.set(0, bodyY + bodyH / 2 + 0.95, sz / 2 - 0.3);
    faceBack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.34, 0.2), flat(spec.color));
    faceBack.position.z = -0.1;
    face.add(faceBack);
  } else {
    face.position.set(0, bodyY + bodyH * 0.1, sz / 2 + 0.01);
  }
  object.add(face);

  const lids = [];
  const lidColor = new THREE.Color(spec.color).multiplyScalar(0.7);
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.x = side * 0.22;
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), flat(0xf6f4ee));
    white.scale.z = 0.5;
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), flat(0x14161c));
    pupil.position.z = 0.06;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.14), flat(lidColor));
    lid.position.z = 0.05;
    eye.add(white, pupil, lid);
    face.add(eye);
    lids.push({ lid, side });
  }

  if (spec.beard) {
    const hair = flat(0xecebe6);
    for (let i = 0; i < 6; i++) {
      const len = 0.25 + ((i * 7) % 4) * 0.07;
      const strand = new THREE.Mesh(new THREE.BoxGeometry(0.06, len, 0.04), hair);
      strand.position.set((i - 2.5) * 0.09, -0.2 - len / 2, 0.05);
      face.add(strand);
    }
    for (const side of [-1, 1]) {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.08), hair);
      brow.position.set(side * 0.3, 0.26, 0.14);
      brow.rotation.z = -side * 0.3;
      face.add(brow);
    }
  }

  // Antenna: this is the mouth. Rings leave the tip while the character talks.
  const antenna = new THREE.Group();
  antenna.position.set(-sx * 0.3, bodyY + bodyH / 2, -sz * 0.3);
  antenna.scale.setScalar(Math.max(0.5, k));
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 5), flat(0x8c8676));
  rod.position.y = 0.45;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), flat(SIGNAL));
  tip.position.y = 0.9;
  antenna.add(rod, tip);
  let tipY = 0.9; // where the rings start; changes when a model antenna has another length
  object.add(antenna);

  const rings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.015, 6, 20),
      new THREE.MeshBasicMaterial({ color: SIGNAL, transparent: true, opacity: 0, depthWrite: false }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = tipY;
    antenna.add(ring);
    rings.push(ring);
  }

  let blades = null;
  if (spec.rotor) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 5), flat(0x6f7680));
    pole.position.y = sy / 2 + 0.15;
    boxes.add(pole);
    blades = [1, -1].map((dir, i) => {
      const g = new THREE.Group();
      g.position.y = sy / 2 + 0.3 - i * 0.08;
      g.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.015, 0.07), flat(0x2f333a)));
      g.userData.dir = dir;
      boxes.add(g);
      return g;
    });
  }

  if (spec.dish) {
    const dish = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 0.35, 12, 1, true),
      flat(0xe9e4d6, { side: THREE.DoubleSide }),
    );
    dish.rotation.x = Math.PI; // open side up
    dish.position.y = sy / 2 + 0.3;
    boxes.add(dish);
  }

  const now = { ...EMOTIONS.curious };
  let want = EMOTIONS.curious;
  let talking = false;
  let time = 0;
  let blinkIn = 2 + Math.random() * 3;
  let blink = 0;

  // Swap the boxes for the real model and move the face onto it.
  function useModel(model) {
    model.scale.setScalar(spec.modelScale ?? 1);
    model.updateMatrixWorld(true); // still outside the scene, so "world" here means character space
    const find = (name) => model.getObjectByName(name) ?? null;
    const box = new THREE.Box3();
    const at = new THREE.Vector3();

    const head = find('head');
    if (head) {
      head.getWorldPosition(at);
      box.setFromObject(head);
      if (box.isEmpty()) {
        // A marker with no shape: the face sits at that point on the body.
        face.position.copy(at);
      } else {
        // A real head (Opportunity's mast): the eyes go on the front of its top bar and turn with it.
        const k = model.scale.x;
        face.position.set(0, (box.max.y - at.y) / k - 0.07 / k, (box.max.z - at.z) / k + 0.01);
        face.scale.setScalar(((box.max.x - box.min.x) / 0.75) / k);
        head.add(face);
        if (faceBack) faceBack.visible = false;
      }
    }

    const ant = find('antenna');
    if (ant) {
      ant.getWorldPosition(at);
      box.setFromObject(ant);
      antenna.position.copy(at);
      if (box.isEmpty()) {
        antenna.scale.setScalar(0.4); // a marker: keep a short rod of our own on that spot
      } else {
        // A real antenna: it replaces our rod, and droops and perks up with the emotions.
        antenna.scale.setScalar(1);
        rod.visible = false;
        tipY = box.max.y - at.y;
        tip.position.y = tipY;
        const s = model.scale.x;
        antenna.add(ant);
        ant.position.set(0, 0, 0);
        ant.scale.setScalar(s);
      }
    }

    const top = find('blade_top'), bottom = find('blade_bottom');
    if (top && bottom) {
      top.userData.dir = 1;
      bottom.userData.dir = -1;
      blades = [top, bottom];
    }

    model.traverse((o) => {
      if (o.name && !parts.has(o.name)) parts.set(o.name, o);
      if (o.name?.startsWith('wheel_') && !o.parent?.name?.startsWith('wheel_')) character.wheels.push(o);
    });
    if (ant) parts.set('antenna', ant);
    object.remove(boxes);
    boxes.traverse((o) => o.geometry?.dispose());
    object.add(model);
    character.model = model;
  }

  const parts = new Map();
  const character = {
    id, spec, object,
    half: [sx / 2, sy / 2, sz / 2],
    rotorSpeed: 0, // radians per second, set by the helicopter controller
    model: null,   // the loaded model, or null while the boxes are showing
    wheels: [],
    part(name) { return parts.get(name) ?? null; },
    ready: null,
    setEmotion(name) { want = EMOTIONS[name] || EMOTIONS.curious; },
    talk(on) { talking = !!on; },
    update(dt) {
      time += dt;
      const s = 1 - Math.exp(-8 * dt);
      for (const key of Object.keys(now)) now[key] += (want[key] - now[key]) * s;

      blinkIn -= dt;
      if (blinkIn <= 0) { blink = 0.12; blinkIn = 2.5 + Math.random() * 4; }
      blink = Math.max(0, blink - dt);
      const open = blink > 0 ? 0 : now.open;

      for (const { lid, side } of lids) {
        lid.position.y = 0.02 + open * 0.3;
        lid.rotation.z = -side * now.slant;
      }
      face.rotation.x = -now.nod;
      antenna.rotation.x = now.antenna + (talking ? Math.sin(time * 18) * 0.06 : 0);

      rings.forEach((ring, i) => {
        const p = (time * 1.4 + i / 3) % 1;
        ring.scale.setScalar(0.3 + p * 2.2);
        ring.position.y = tipY + p * 0.5;
        ring.material.opacity = talking ? 1 - p : 0;
      });

      if (blades) for (const g of blades) g.rotation.y += g.userData.dir * character.rotorSpeed * dt;
    },
  };

  character.ready = loader.loadAsync(modelUrl(id)).then(
    (gltf) => { useModel(gltf.scene); return true; },
    () => false, // no file, or a broken one: the boxes stay
  );
  return character;
}
