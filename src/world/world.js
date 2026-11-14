// Environments. Owner: Set B.
//
//   const env = buildWorld('moon', scene)   factory | moon | mars | jezero | space
//   env.dispose()
//
//   env.sunDirection                        unit vector toward the Sun (the epilogue aims at it)
//   env.workers                             the two hooded workers in the factory, else []
//
// The ground shape (hills, craters) comes from terrain.js. Here: the mesh, rocks, sky, sun,
// the factory room and the stars. Dust and the storm are in effects.js.
import * as THREE from 'three';
import { heightAt, placesOf, TERRAIN_SIZE, TERRAIN_CELLS } from './terrain.js';
import { createProp } from './props.js';

const LOOK = {
  factory: { sky: 0xdfe5ec, ground: 0xc6ccd5, fog: [30, 140], sun: 2.0, ambient: 1.6, rocks: 0, sunAt: [0.15, 1, 0.25], room: true },
  moon:    { sky: 0x000000, ground: 0x8b8d92, fog: null,      sun: 3.2, ambient: 0.25, rocks: 70, rock: 0x74767b, stars: true,
             disc: 0xffffff, earth: { at: [0.3, 0.42, 0.86], size: 46 } },
  // sunAt: the direction to the Sun. Low on Mars, so it sits in the sky ahead of the rover.
  // disc: the Sun you can see. halo: the patch of sky around it (blue-grey on Mars).
  mars:    { sky: 0xd8a878, ground: 0xb0623a, fog: [40, 240], sun: 2.4, ambient: 1.1, rocks: 90, rock: 0x86482b,
             sunAt: [-0.45, 0.3, 0.85], disc: 0xfff3dc, halo: 0xb9c2cc },
  // Jezero is Mars too: same sky and light, darker lake-bed floor, and thinner haze so the
  // crater wall shows on the horizon.
  jezero:  { sky: 0xd8a878, ground: 0xa35a38, fog: [70, 520], sun: 2.4, ambient: 1.1, rocks: 130, rock: 0x7c4329,
             sunAt: [0.6, 0.34, 0.72], disc: 0xfff3dc, halo: 0xb9c2cc },
  // Deep space: the Sun is only the brightest star, behind and to the right of where Pioneer
  // starts, so the player has to turn to find it. Its light is small and cold.
  space:   { sky: 0x02030a, ground: null,     fog: null,      sun: 2.2, ambient: 0.35, rocks: 0, stars: true, milkyWay: true,
             sunAt: [0.75, 0.12, -0.62], sunColor: 0xdde6ff, disc: 0xfff6e0, discSize: 7, halo: 0xfff0c8, haloSize: 40, haloOpacity: 0.22 },
};

// Small repeatable random, so rocks sit in the same place for everyone.
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

// Points scattered over the sky. `place` puts one on the unit sphere (default: anywhere).
function starLayer(rand, count, size, tint, place) {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
  const v = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    if (place) place(v);
    else { const u = rand() * 2 - 1, a = rand() * Math.PI * 2, r = Math.sqrt(1 - u * u); v.set(r * Math.cos(a), u, r * Math.sin(a)); }
    pos.set([v.x * 1500, v.y * 1500, v.z * 1500], i * 3);
    tint(c);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ size, sizeAttenuation: false, fog: false, vertexColors: true }));
}

// The clean room the Moon rover is built in. The floor is the flat ground at y = 0, so the room
// is only walls, a ceiling of light panels, the test stand around the start point, and two workers.
// It is 26 m wide and 30 m long; the rover starts at (0, 0) facing +Z with the camera behind it.
function buildFactoryRoom(group, workers) {
  const flat = (color, extra) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, ...extra });
  const wall = flat(0xdfe5ec), trim = flat(0xaeb6c2), dark = flat(0x596170), foil = flat(0xe3a23c, { roughness: 0.5 });
  const glow = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const add = (w, h, d, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); group.add(m); return m; };
  const X = 13, Z0 = -12, Z1 = 18, H = 7, midZ = (Z0 + Z1) / 2, len = Z1 - Z0;

  // Walls, with a darker band along the bottom.
  for (const [w, d, x, z] of [[0.3, len, -X, midZ], [0.3, len, X, midZ], [X * 2, 0.3, 0, Z0], [X * 2, 0.3, 0, Z1]]) {
    add(w, H, d, x, H / 2, z, wall);
    add(w + 0.06, 1.1, d + 0.06, x, 0.55, z, trim);
  }
  // Ceiling and its light panels.
  add(X * 2, 0.3, len, 0, H + 0.15, midZ, wall);
  for (const x of [-6.5, 0, 6.5]) for (const z of [-6, 3, 12]) add(3.2, 0.06, 1.4, x, H - 0.04, z, glow);
  // A long window in the far wall, and a big door in the left one.
  add(14, 2.4, 0.1, 0, 3.6, Z1 - 0.2, new THREE.MeshBasicMaterial({ color: 0xbfd6ea }));
  for (const x of [-3.5, 0, 3.5]) add(0.12, 2.4, 0.14, x, 3.6, Z1 - 0.22, trim);
  add(0.1, 4.2, 5, X - 0.2, 2.1, 6, trim);
  add(0.12, 4.2, 0.12, X - 0.22, 2.1, 6, dark);

  // The test stand: a marked pad with four rollers under the wheels, and a hoist frame over it.
  add(3.6, 0.02, 4.6, 0, 0.01, 0, flat(0xb4bcc8));
  for (const [w, d, x, z] of [[3.6, 0.12, 0, 2.3], [3.6, 0.12, 0, -2.3], [0.12, 4.6, 1.8, 0], [0.12, 4.6, -1.8, 0]]) add(w, 0.025, d, x, 0.012, z, foil);
  for (const x of [-0.69, 0.69]) for (const z of [-0.84, 0.84]) add(0.5, 0.03, 0.7, x, 0.016, z, dark);
  for (const x of [-2.6, 2.6]) { add(0.22, 4.2, 0.22, x, 2.1, 0, trim); add(0.9, 0.12, 1.4, x, 0.06, 0, dark); }
  add(5.4, 0.26, 0.26, 0, 4.2, 0, trim);
  add(0.5, 0.3, 0.4, 0, 3.95, 0, dark);       // the hoist
  add(0.03, 1.0, 0.03, 0, 3.3, 0, dark);      // its cable

  // Things around the room: foil-wrapped crates, a workbench, a tool cart.
  add(1.4, 1.1, 1.1, -8.5, 0.55, 9, foil);
  add(1.0, 0.8, 1.0, -7.2, 0.4, 10.2, foil);
  add(1.2, 0.7, 0.9, -8.6, 1.45, 9.1, foil);
  add(4.2, 0.1, 1.2, 8, 0.95, 12, trim);
  for (const x of [6.1, 9.9]) add(0.1, 0.95, 1.1, x, 0.475, 12, dark);
  add(0.9, 0.9, 0.6, -5, 0.5, -4, dark);

  // Two workers in clean-room suits, one each side of the stand, turned toward the rover.
  for (const [x, z] of [[-3.4, 1.6], [3.5, -0.4]]) {
    const worker = createProp('worker');
    worker.position.set(x, 0, z);
    worker.rotation.y = Math.atan2(-x, -z);
    group.add(worker);
    workers.push(worker);
  }
}

export function buildWorld(name, scene) {
  const look = LOOK[name];
  if (!look) throw new Error(`unknown world "${name}"`);
  const group = new THREE.Group();
  group.name = 'world:' + name;
  const rand = rng(name.length * 7919 + 13);

  scene.background = new THREE.Color(look.sky);
  scene.fog = look.fog ? new THREE.Fog(look.sky, look.fog[0], look.fog[1]) : null;

  const sun = new THREE.DirectionalLight(look.sunColor ?? 0xffffff, look.sun);
  sun.position.set(...(look.sunAt ?? [40, 60, -30])).normalize().multiplyScalar(80);
  const ambient = new THREE.HemisphereLight(0xffffff, look.ground ?? 0x222233, look.ambient);
  group.add(sun, ambient);

  // The Sun as a disc in the sky, in the direction the light comes from. Haze does not hide it,
  // so in the dust storm it stays as a pale dot (effects.js dims it).
  let sunDisc = null;
  if (look.disc) {
    sunDisc = new THREE.Group();
    sunDisc.position.copy(sun.position).normalize().multiplyScalar(1400);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(look.discSize ?? 22, 20), new THREE.MeshBasicMaterial({ color: look.disc, fog: false }));
    disc.name = 'disc';
    sunDisc.add(disc);
    if (look.halo) {
      const halo = new THREE.Mesh(new THREE.CircleGeometry(look.haloSize ?? 150, 24), new THREE.MeshBasicMaterial({ color: look.halo, fog: false, transparent: true, opacity: look.haloOpacity ?? 0.35, depthWrite: false }));
      halo.name = 'halo';
      halo.position.z = -1;
      sunDisc.add(halo);
    }
    sunDisc.lookAt(0, 0, 0);
    group.add(sunDisc);
  }

  const places = placesOf(name);
  let ground = null; // the ground's material, so the storm can change its colour
  if (look.ground !== null) {
    // The ground takes its shape from heightAt, the same function the physics reads.
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_CELLS, TERRAIN_CELLS);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(name, pos.getX(i), pos.getZ(i)));
    geo.computeVertexNormals();
    // Smooth sand is painted paler on the ground itself, so the patches can be found from the air.
    // The paint multiplies the ground colour, so the storm still darkens it with everything else.
    const base = new THREE.Color(look.ground), pale = base.clone().lerp(new THREE.Color(0xe2b98a), 0.45);
    const paint = [pale.r / base.r, pale.g / base.g, pale.b / base.b];
    const col = new Float32Array(pos.count * 3).fill(1);
    for (const p of places) {
      if (!p.ripples) continue;
      for (let i = 0; i < pos.count; i++) {
        const d = Math.hypot(pos.getX(i) - p.x, pos.getZ(i) - p.z);
        if (d < p.r * 0.92) col.set(paint, i * 3);
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    ground = new THREE.MeshStandardMaterial({ color: look.ground, flatShading: true, roughness: 1, vertexColors: true });
    group.add(new THREE.Mesh(geo, ground));
  }

  for (const p of places) {
    if (p.boulders) {
      // A field of big rocks, all sharing one shape and one material.
      const geo = new THREE.IcosahedronGeometry(1, 0);
      const mat = new THREE.MeshStandardMaterial({ color: look.rock, flatShading: true, roughness: 1 });
      const field = new THREE.InstancedMesh(geo, mat, p.boulders);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), at = new THREE.Vector3();
      for (let i = 0; i < p.boulders; i++) {
        const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * p.r, size = 0.9 + rand() * 1.6;
        const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
        q.setFromEuler(new THREE.Euler(rand() * 0.6, rand() * Math.PI * 2, rand() * 0.6));
        m.compose(at.set(x, heightAt(name, x, z) + size * 0.3, z), q, s.set(size, size * (0.6 + rand() * 0.4), size));
        field.setMatrixAt(i, m);
      }
      field.name = 'place:' + p.name;
      group.add(field);
    }
  }

  if (look.rocks) {
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const mat = new THREE.MeshStandardMaterial({ color: look.rock, flatShading: true, roughness: 1 });
    for (let i = 0; i < look.rocks; i++) {
      const x = (rand() - 0.5) * 300, z = (rand() - 0.5) * 300;
      if (Math.hypot(x, z) < 10) continue; // keep the start area clear
      if (places.some((p) => p.clear && Math.hypot(x - p.x, z - p.z) < p.r)) continue; // and the smooth sand
      const rock = new THREE.Mesh(geo, mat);
      const s = 0.3 + rand() * 1.4;
      rock.scale.set(s, s * 0.6, s);
      rock.position.set(x, heightAt(name, x, z) + s * 0.15, z);
      rock.rotation.y = rand() * Math.PI;
      group.add(rock);
    }
  }

  if (look.stars) {
    // Three sizes of star, a few of them tinted, so the sky has depth instead of even speckle.
    const tints = [0xffffff, 0xffffff, 0xcfdcff, 0xffe9c9];
    for (const [count, size, dim] of [[1900, 1.2, 0.6], [520, 2, 0.85], [80, 3.2, 1]]) {
      group.add(starLayer(rand, count, size, (c) => c.set(tints[Math.floor(rand() * tints.length)]).multiplyScalar(dim * (0.6 + rand() * 0.4))));
    }
    if (look.milkyWay) {
      // A faint band of many small stars along one tilted circle across the sky.
      const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.9, 0.3, 0.4));
      const band = starLayer(rand, 2600, 1, (c) => c.set(0x8f9ac0).multiplyScalar(0.35 + rand() * 0.45), (v) => {
        const a = rand() * Math.PI * 2, off = (rand() + rand() + rand() - 1.5) * 0.22;
        v.set(Math.cos(a), off, Math.sin(a)).normalize().applyQuaternion(tilt);
      });
      group.add(band);
    }
  }

  if (look.earth) {
    // The Earth in the sky of the Moon: the one spot of colour. A dark disc over one side gives it a phase.
    const earth = new THREE.Group();
    const R = look.earth.size;
    const basic = (color, extra) => new THREE.MeshBasicMaterial({ color, fog: false, ...extra });
    const sea = new THREE.Mesh(new THREE.CircleGeometry(R, 24), basic(0x4f86c6));
    earth.add(sea);
    // Three long streaks of cloud, kept inside the disc.
    for (const [x, y, w, turn] of [[-0.3, 0.42, 0.5, 0.25], [-0.12, -0.05, 0.72, -0.15], [-0.38, -0.5, 0.42, 0.3]]) {
      const cloud = new THREE.Mesh(new THREE.CircleGeometry(R, 14), basic(0xeef3f7, { transparent: true, opacity: 0.8 }));
      cloud.scale.set(w, 0.09, 1);
      cloud.position.set(x * R, y * R, 20); // well in front of the sea: this far away, small gaps flicker
      cloud.rotation.z = turn;
      earth.add(cloud);
    }
    // The night side: a disc the colour of the sky, slid across, leaves a little more than half lit.
    const night = new THREE.Mesh(new THREE.CircleGeometry(R * 1.25, 28), basic(look.sky));
    night.position.set(R * 1.2, -R * 0.35, 40);
    earth.add(night);
    earth.position.set(...look.earth.at).normalize().multiplyScalar(1380);
    earth.lookAt(0, 0, 0);
    earth.name = 'earth';
    group.add(earth);
  }

  const workers = [];
  if (look.room) buildFactoryRoom(group, workers);

  scene.add(group);
  return {
    group,
    name, look, sun, ambient, ground, sunDisc, // effects.js reads and changes these
    sunDirection: sun.position.clone().normalize(),
    workers,
    dispose() {
      scene.remove(group);
      scene.fog = null;
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    },
  };
}
