// Characters and their faces. Owner: Set B.
//
//   const c = createCharacter('lrv')
//   scene.add(c.object)
//   c.setEmotion('sad')      curious | happy | scared | sad | sleepy
//   c.talk(true)             signal rings come out of the antenna
//   c.update(dt)             call every frame
//
// Right now every character is built from boxes so the game is playable from hour one.
// TODO Set B: load the real model from public/models/<id>.glb with GLTFLoader
// ("three/addons/loaders/GLTFLoader.js"), put it inside `object`, and keep the face rig below.
// The box size in CAST is also the physics size, so keep it close to the real model.
import * as THREE from 'three';

export const CAST = {
  lrv:         { name: 'Lunar Rover', ar: 'العربة القمرية', color: 0xd9d4c7, size: [1.6, 0.6, 2.4], wheels: true },
  opportunity: { name: 'Opportunity', ar: 'أوبورتيونيتي',  color: 0xcbb48a, size: [1.4, 0.6, 1.7], wheels: true, mast: true },
  viking:      { name: 'Viking 1',    ar: 'فايكنغ ١',       color: 0xb8b3a6, size: [1.8, 0.7, 1.8], beard: true },
  ingenuity:   { name: 'Ingenuity',   ar: 'إنجينويتي',      color: 0x9fa7b0, size: [0.5, 0.5, 0.5], rotor: true },
  pioneer:     { name: 'Pioneer 10',  ar: 'بايونير ١٠',     color: 0xd8d1bd, size: [1.0, 0.6, 1.0], dish: true },
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

  // Body. With wheels, the box sits on top of them; the physics box covers both.
  const bodyH = spec.wheels ? sy * 0.5 : sy;
  const bodyY = spec.wheels ? sy * 0.25 : 0;
  const body = new THREE.Mesh(new THREE.BoxGeometry(sx, bodyH, sz), flat(spec.color));
  body.position.y = bodyY;
  object.add(body);

  if (spec.wheels) {
    const r = sy * 0.45;
    const wheel = new THREE.CylinderGeometry(r, r, 0.2, 8);
    wheel.rotateZ(Math.PI / 2);
    const tyre = flat(0x3a3d44);
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      const m = new THREE.Mesh(wheel, tyre);
      m.position.set(x * (sx / 2 + 0.05), -sy / 2 + r, z * (sz / 2 - r));
      object.add(m);
    }
  }

  // Face: two eyes with lids. On a mast for Opportunity, on the front of the body for the rest.
  const face = new THREE.Group();
  const k = Math.min(1, sx / 1.4); // smaller face on small machines
  face.scale.setScalar(k);
  if (spec.mast) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), flat(0x8c8676));
    pole.position.set(0, bodyY + bodyH / 2 + 0.45, sz / 2 - 0.3);
    object.add(pole);
    face.position.set(0, bodyY + bodyH / 2 + 0.95, sz / 2 - 0.3);
    face.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.34, 0.2), flat(spec.color)));
    face.children[0].position.z = -0.1;
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
  object.add(antenna);

  const rings = [];
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.015, 6, 20),
      new THREE.MeshBasicMaterial({ color: SIGNAL, transparent: true, opacity: 0, depthWrite: false }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.9;
    antenna.add(ring);
    rings.push(ring);
  }

  let blades = null;
  if (spec.rotor) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 5), flat(0x6f7680));
    pole.position.y = sy / 2 + 0.15;
    object.add(pole);
    blades = [1, -1].map((dir, i) => {
      const g = new THREE.Group();
      g.position.y = sy / 2 + 0.3 - i * 0.08;
      g.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.015, 0.07), flat(0x2f333a)));
      g.userData.dir = dir;
      object.add(g);
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
    object.add(dish);
  }

  const now = { ...EMOTIONS.curious };
  let want = EMOTIONS.curious;
  let talking = false;
  let time = 0;
  let blinkIn = 2 + Math.random() * 3;
  let blink = 0;

  const character = {
    id, spec, object,
    half: [sx / 2, sy / 2, sz / 2],
    rotorSpeed: 0, // radians per second, set by the helicopter controller
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
        ring.position.y = 0.9 + p * 0.5;
        ring.material.opacity = talking ? 1 - p : 0;
      });

      if (blades) for (const g of blades) g.rotation.y += g.userData.dir * character.rotorSpeed * dt;
    },
  };
  return character;
}
