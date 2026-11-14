// Props for the chapters. Owner: Set A.
//
// Real props come from Set B's createProp (src/world/props.js). The few things Set B does not make
// (the factory stand and workers, the epilogue Sun, Mars whirlwinds, the three dangers in chapter 3,
// the height band and the marker flag) have simple stand-ins here. If Set B adds one of these names,
// theirs is used automatically.
import * as THREE from 'three';
import { createProp, PROP_NAMES } from '../world/props.js';

const mat = (color, extra) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, ...extra });
const box = (w, h, d, color) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));

const STAND_INS = {
  lunarModule() {
    const g = new THREE.Group();
    const descent = box(4.2, 1.8, 4.2, 0xc9a24a); // gold foil
    descent.position.y = 2.2;
    g.add(descent);
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const leg = box(0.15, 2.6, 0.15, 0x9a9a9a);
      leg.position.set(x * 2.6, 1.1, z * 2.6);
      leg.rotation.set(z * 0.35, 0, -x * 0.35);
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 10), mat(0x9a9a9a));
      pad.position.set(x * 3.1, 0.05, z * 3.1);
      g.add(leg, pad);
    }
    const ascent = new THREE.Group();
    ascent.name = 'ascent';
    const cabin = box(3.2, 2.4, 2.8, 0xb9bcc2);
    cabin.position.y = 4.3;
    const hatch = box(0.9, 1.0, 0.1, 0x30333a);
    hatch.position.set(0, 4.0, 1.45);
    ascent.add(cabin, hatch);
    g.add(ascent);
    return g;
  },
  astronaut() {
    const g = new THREE.Group();
    const suit = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.9, 4, 8), mat(0xf1f1ee));
    suit.position.y = 0.8;
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat(0xf1f1ee));
    helmet.position.y = 1.62;
    // Mirror visor: no face is ever seen.
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10, 0, Math.PI), mat(0xd4a640, { metalness: 0.9, roughness: 0.15 }));
    visor.position.set(0, 1.62, 0.09);
    const pack = box(0.5, 0.6, 0.25, 0xdedad0);
    pack.position.set(0, 1.0, -0.33);
    g.add(suit, helmet, visor, pack);
    return g;
  },
  worker() {
    const g = STAND_INS.astronaut();
    g.traverse((o) => { if (o.isMesh) o.material = mat(0xe8eef2); });
    return g;
  },
  airbags() {
    const g = new THREE.Group();
    const m = mat(0xe9e2d0);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2, b = (i % 2 ? 0.5 : -0.5);
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6), m);
      s.position.set(Math.cos(a) * 0.9 * Math.cos(b), Math.sin(b) * 0.9, Math.sin(a) * 0.9 * Math.cos(b));
      g.add(s);
    }
    g.add(new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), m));
    return g;
  },
  perseverance() {
    const g = new THREE.Group();
    const body = box(2.7, 0.9, 3.0, 0xe3e1da);
    body.position.y = 1.4;
    g.add(body);
    const wheel = new THREE.CylinderGeometry(0.26, 0.26, 0.3, 10);
    wheel.rotateZ(Math.PI / 2);
    for (const z of [-1.1, 0, 1.1]) for (const x of [-1, 1]) {
      const w = new THREE.Mesh(wheel, mat(0x55585e));
      w.position.set(x * 1.45, 0.26, z);
      g.add(w);
    }
    const mast = box(0.12, 1.4, 0.12, 0xcfcfc8);
    mast.position.set(0.7, 2.5, 1.2);
    const head = box(0.6, 0.3, 0.3, 0xcfcfc8);
    head.position.set(0.7, 3.25, 1.25);
    g.add(mast, head);
    return g;
  },
  sampleBox() {
    const b = box(0.5, 0.28, 0.4, 0x8f8a7c);
    b.add(box(0.52, 0.04, 0.42, 0x3a3d44)); // strap
    return b;
  },
  // A dust devil: a tall spinning cone of dust. userData.spin is turned by the chapter.
  whirlwind() {
    const g = new THREE.Group();
    const m = new THREE.MeshBasicMaterial({ color: 0xc89064, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6 - i * 0.35, 9 - i, 10, 1, true), m);
      cone.rotation.x = Math.PI; // wide at the top
      cone.position.y = 4.5 - i * 0.3;
      g.add(cone);
    }
    return g;
  },
  sandTrap() {
    const m = new THREE.Mesh(new THREE.CircleGeometry(4, 20), mat(0xd9b07a));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.04;
    const g = new THREE.Group();
    g.add(m);
    return g;
  },
  boulders() {
    const g = new THREE.Group();
    const geo = new THREE.IcosahedronGeometry(1, 0);
    for (let i = 0; i < 9; i++) {
      const r = new THREE.Mesh(geo, mat(0x6e3a22));
      const s = 0.5 + ((i * 37) % 10) / 10;
      r.scale.set(s, s * 0.8, s);
      r.position.set(Math.cos(i * 2.4) * (1 + i * 0.35), s * 0.3, Math.sin(i * 2.4) * (1 + i * 0.35));
      g.add(r);
    }
    return g;
  },
  cliffEdge() {
    const g = new THREE.Group();
    const wall = box(10, 3, 1.2, 0x7b4126);
    wall.position.y = -1.2;
    const lip = box(10, 0.3, 3, 0x9a5634);
    lip.position.set(0, 0.1, -1);
    g.add(wall, lip);
    return g;
  },
  // Two faint rings at the bottom and top of the height band for the first flight.
  heightBand() {
    const g = new THREE.Group();
    for (const y of [-0.5, 0.5]) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.03, 6, 48), new THREE.MeshBasicMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0.7 }));
      r.rotation.x = Math.PI / 2;
      r.position.y = y;
      g.add(r);
    }
    return g;
  },
  flag() {
    const g = new THREE.Group();
    const pole = box(0.06, 1.6, 0.06, 0xdddddd);
    pole.position.y = 0.8;
    const cloth = box(0.6, 0.35, 0.02, 0xe3a23c);
    cloth.position.set(0.3, 1.4, 0);
    g.add(pole, cloth);
    return g;
  },
  ring() {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.09, 8, 40),
      new THREE.MeshBasicMaterial({ color: 0xe3a23c, transparent: true, opacity: 0.95 }),
    );
    return ring;
  },
  stand() {
    const g = new THREE.Group();
    const top = box(1.6, 0.25, 1.6, 0x6d7480);
    top.position.y = 0.95;
    const post = box(0.4, 0.9, 0.4, 0x5a606b);
    post.position.y = 0.45;
    g.add(top, post);
    return g;
  },
  sun() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff6d8, fog: false })));
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const grad = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,240,200,0.9)');
    grad.addColorStop(1, 'rgba(255,240,200,0)');
    x.fillStyle = grad;
    x.fillRect(0, 0, 64, 64);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false, fog: false }));
    glow.scale.setScalar(60);
    g.add(glow);
    return g;
  },
};

export function makeProp(name) {
  if (PROP_NAMES.includes(name)) return createProp(name);
  const make = STAND_INS[name];
  if (!make) throw new Error(`no prop or stand-in called "${name}"`);
  const obj = make();
  obj.name = 'prop:' + name;
  return obj;
}
