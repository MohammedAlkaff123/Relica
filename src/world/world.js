// Environments. Owner: Set B.
//
//   const env = buildWorld('moon', scene)   factory | moon | mars | space
//   env.dispose()
//
// Placeholder look: flat ground, a few low-poly rocks, a sky colour, one sun.
// TODO Set B: craters and hills (and tell Set A so the physics ground matches),
// wheel dust, the Mars dust storm, the factory room, Jezero, a proper star field.
import * as THREE from 'three';

const LOOK = {
  factory: { sky: 0xdfe5ec, ground: 0xc6ccd5, fog: [30, 140], sun: 2.0, ambient: 1.6, rocks: 0 },
  moon:    { sky: 0x000000, ground: 0x8b8d92, fog: null,      sun: 3.2, ambient: 0.25, rocks: 70, rock: 0x74767b, stars: true },
  mars:    { sky: 0xd8a878, ground: 0xb0623a, fog: [40, 240], sun: 2.4, ambient: 1.1, rocks: 90, rock: 0x86482b },
  space:   { sky: 0x02030a, ground: null,     fog: null,      sun: 2.2, ambient: 0.35, rocks: 0, stars: true },
};

// Small repeatable random, so rocks sit in the same place for everyone.
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export function buildWorld(name, scene) {
  const look = LOOK[name];
  if (!look) throw new Error(`unknown world "${name}"`);
  const group = new THREE.Group();
  group.name = 'world:' + name;
  const rand = rng(name.length * 7919 + 13);

  scene.background = new THREE.Color(look.sky);
  scene.fog = look.fog ? new THREE.Fog(look.sky, look.fog[0], look.fog[1]) : null;

  const sun = new THREE.DirectionalLight(0xffffff, look.sun);
  sun.position.set(40, 60, -30);
  group.add(sun, new THREE.HemisphereLight(0xffffff, look.ground ?? 0x222233, look.ambient));

  if (look.ground !== null) {
    const geo = new THREE.PlaneGeometry(400, 400, 60, 60);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    // Small dips only, never above y = 0, because the physics ground is flat at y = 0.
    for (let i = 0; i < pos.count; i++) pos.setY(i, -rand() * 0.12);
    geo.computeVertexNormals();
    group.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: look.ground, flatShading: true, roughness: 1 })));
  }

  if (look.rocks) {
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const mat = new THREE.MeshStandardMaterial({ color: look.rock, flatShading: true, roughness: 1 });
    for (let i = 0; i < look.rocks; i++) {
      const x = (rand() - 0.5) * 300, z = (rand() - 0.5) * 300;
      if (Math.hypot(x, z) < 10) continue; // keep the start area clear
      const rock = new THREE.Mesh(geo, mat);
      const s = 0.3 + rand() * 1.4;
      rock.scale.set(s, s * 0.6, s);
      rock.position.set(x, s * 0.15, z);
      rock.rotation.y = rand() * Math.PI;
      group.add(rock);
    }
  }

  if (look.stars) {
    const pts = new Float32Array(1400 * 3);
    for (let i = 0; i < 1400; i++) {
      const u = rand() * 2 - 1, a = rand() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      pts.set([r * Math.cos(a) * 1500, u * 1500, r * Math.sin(a) * 1500], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    group.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false })));
  }

  scene.add(group);
  return {
    group,
    dispose() {
      scene.remove(group);
      scene.fog = null;
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    },
  };
}
