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
//   astronaut     1.85 m, mirror visor, no flag or logo. Use it twice for the crew
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
//
// The three models are adapted from NASA's 3D Resources: see public/models/README.md.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const PETAL_CLOSED = -1.91; // radians: the three petals meet in a point

const EARTH_BLUE = 0x4f86c6;
const loader = new GLTFLoader();
const files = new Map(); // name -> promise of the loaded scene, so a file is fetched once

const mats = new Map();
function flat(color, extra) {
  if (extra) return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, ...extra });
  if (!mats.has(color)) mats.set(color, new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9 }));
  return mats.get(color);
}

function rng(seed) {
  let s = (seed % 2147483646) + 1;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

// A prop that comes from public/models/<name>.glb. Until the file arrives the group is empty;
// if it never arrives, a plain box of the right size stands in so the chapter still works.
function fromFile(name, size) {
  const group = new THREE.Group();
  if (!files.has(name)) {
    const url = new URL(`../../public/models/${name}.glb`, import.meta.url).href;
    files.set(name, loader.loadAsync(url).then((g) => g.scene, () => null));
  }
  group.userData.ready = files.get(name).then((scene) => {
    if (scene) { group.add(scene.clone(true)); return true; } // clones share the geometry
    const box = new THREE.Mesh(new THREE.BoxGeometry(...size), flat(0x9a9da3));
    box.position.y = size[1] / 2;
    group.add(box);
    return false;
  });
  return group;
}

const rockShape = new THREE.IcosahedronGeometry(1, 0);
const ball = new THREE.IcosahedronGeometry(1, 1);

const BUILDERS = {
  lunarModule: () => fromFile('lunarModule', [9, 7, 9]),
  astronaut: () => fromFile('astronaut', [0.7, 1.85, 0.5]),
  perseverance: () => fromFile('perseverance', [2.7, 1.85, 3.1]),

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
  return prop;
}
