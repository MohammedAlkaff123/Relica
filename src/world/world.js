// Environments. Owner: Set B.
//
//   const env = buildWorld('moon', scene, { quality: 'medium' })   factory | moon | mars | jezero | space
//   env.applyQuality('low')                 switch Low / Medium / High while it is on screen
//   env.dispose()
//
//   env.sunDirection                        unit vector toward the Sun (the epilogue aims at it)
//   env.workers                             the two hooded workers in the factory, else []
//   env.quality                             the level it is showing now
//
// The ground shape (hills, craters) comes from terrain.js. Here: the ground's look, rocks, sky, sun,
// the far skyline, the factory room and the stars. Dust, the storm and the hero's shadow are in
// effects.js. The numbers for the three quality levels are all in quality.js.
//
// The look (BRANDING_AND_ART_DIRECTION.md): clean shapes with a little painted variation, a warm
// Sun against cool shade, and scale from distant silhouettes. No effect here needs post-processing.
import * as THREE from 'three';
import { heightAt, placesOf, TERRAIN_SIZE, TERRAIN_CELLS } from './terrain.js';
import { createProp } from './props.js';
import { presetFor, initialQuality, normalizeQuality } from './quality.js';

// sunAt: direction to the Sun. sunColor / fill: the warm key light and the cool light in the shade
// (fill = [from the sky, bounced off the ground]). disc / halo: the Sun you can see.
// skyline: far mountains or plateau, beyond the land you can drive on. They are scenery only.
const LOOK = {
  factory: { sky: 0xdfe5ec, ground: 0xc6ccd5, fog: [30, 140], sun: 2.0, ambient: 1.6, rocks: 0, sunAt: [0.15, 1, 0.25], room: true,
             sunColor: 0xfffaf2, fill: [0xeaf1fb, 0xc6ccd5], plain: true },
  // Taurus-Littrow: a valley floor between two massifs. A low Sun from the side, one hard key light,
  // almost no fill, so shadows are long and nearly black. The Earth is the only colour in the sky.
  moon:    { sky: 0x000000, ground: 0x8b8d92, fog: null, sun: 3.2, ambient: 0.3, rocks: 70, rock: 0x74767b, stars: true,
             sunAt: [-0.78, 0.4, 0.48], sunColor: 0xfff4e6, fill: [0x8fa3c8, 0x3a3b40], shadowSoft: 1,
             disc: 0xffffff, earth: { at: [0.3, 0.42, 0.86], size: 46 },
             skyline: { from: 300, base: 0, peak: 125, color: 0x7b7d83,
                        massifs: [[0.55, 0.55, 1], [3.7, 0.75, 0.85], [2.1, 0.3, 0.42], [5.25, 0.35, 0.5]] } },
  // Meridiani Planum is flat to the horizon: no mountains here, only the plain running on.
  mars:    { sky: 0xd8a878, ground: 0xb0623a, fog: [40, 240], sun: 2.6, ambient: 0.95, rocks: 90, rock: 0x86482b,
             sunAt: [-0.45, 0.3, 0.85], sunColor: 0xffdcb0, fill: [0xc8ccd6, 0x8a5a40], shadowSoft: 2.5,
             disc: 0xfff3dc, halo: 0xb9c2cc },
  // Jezero is Mars too: same sky and light, darker lake-bed floor, and thinner haze so the
  // crater wall shows on the horizon. The skyline carries the wall on as a plateau.
  jezero:  { sky: 0xd8a878, ground: 0xa35a38, fog: [70, 520], sun: 2.6, ambient: 0.95, rocks: 130, rock: 0x7c4329,
             sunAt: [0.6, 0.34, 0.72], sunColor: 0xffdcb0, fill: [0xc8ccd6, 0x8a5a40], shadowSoft: 2.5,
             disc: 0xfff3dc, halo: 0xb9c2cc,
             skyline: { from: 199, base: 30, peak: 44, color: 0x9a5536, massifs: [[1.0, 0.9, 1], [4.1, 0.8, 0.8]] } },
  // Deep space: the Sun is only the brightest star, behind and to the right of where Pioneer
  // starts, so the player has to turn to find it. Its light is small and cold.
  space:   { sky: 0x02030a, ground: null, fog: null, sun: 2.2, ambient: 0.35, rocks: 0, stars: true, milkyWay: true,
             sunAt: [0.75, 0.12, -0.62], sunColor: 0xdde6ff, disc: 0xfff6e0, discSize: 7, halo: 0xfff0c8, haloSize: 40, haloOpacity: 0.22 },
};

const TILE_METRES = 8; // one copy of the ground detail texture covers this much ground

// Small repeatable random, so rocks sit in the same place for everyone.
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

// Smooth repeatable noise from 0 to 1, for broad changes of tone across the ground.
function tone(x, z, seed) {
  const h = (ix, iz) => { let n = (ix * 374761393 + iz * 668265263 + seed * 1442695041) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = h(ix, iz), b = h(ix + 1, iz), c = h(ix, iz + 1), d = h(ix + 1, iz + 1);
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
}

// ---- the ground detail texture ----
// One grey photo texture (public/textures, from Poly Haven "Sand 01", CC0), in three sizes.
// Every world multiplies it by its own ground colour. Only the size the quality level asks for is
// downloaded and kept; when no world uses a size any more, it is released.
const textureLoader = new THREE.TextureLoader();
const details = new Map(); // size -> { texture, users }
function takeDetail(size) {
  let entry = details.get(size);
  if (!entry) {
    const url = new URL(`../../public/textures/ground_detail_${size}.jpg`, import.meta.url).href;
    entry = { texture: null, users: 0, ready: null };
    details.set(size, entry);
    entry.ready = textureLoader.loadAsync(url).then((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = 4;
      entry.texture = texture;
      return texture;
    });
  }
  entry.users++;
  return entry.ready;
}
function dropDetail(size) {
  const entry = details.get(size);
  if (!entry || --entry.users > 0) return;
  entry.texture?.dispose();
  details.delete(size);
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
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ size, sizeAttenuation: false, fog: false, vertexColors: true }));
  points.userData.total = count;
  return points;
}

// Far mountains (the Moon's massifs) or a plateau (Jezero's crater wall carried on), as one ring
// of big flat-shaded faces well outside the land you can drive on.
function buildSkyline(spec, rand) {
  const A = 96, rows = [0, 0.4, 0.82, 1, 0.9, 0.72], step = 85;
  const profile = (angle) => {
    let m = 0.2 + 0.14 * Math.sin(angle * 5 + 1.3) * Math.sin(angle * 2.3);
    for (const [at, width, height] of spec.massifs) {
      let d = Math.abs(angle - at) % (Math.PI * 2); if (d > Math.PI) d = Math.PI * 2 - d;
      m += height * Math.exp(-((d / width) ** 2));
    }
    return Math.min(1.15, m);
  };
  const pos = [], idx = [];
  for (let j = 0; j < rows.length; j++) for (let i = 0; i <= A; i++) {
    const angle = (i / A) * Math.PI * 2, wrap = i === A ? 0 : i;
    const jr = rng(1000 + j * 131 + wrap * 7)(); // the same wobble at both ends of the ring
    const r = spec.from + j * step + (j ? (jr - 0.5) * 30 : 0);
    const h = j === 0 ? (spec.base || -3) : spec.base + (spec.peak - spec.base) * profile(angle) * rows[j] * (0.82 + jr * 0.36);
    pos.push(Math.sin(angle) * r, h, Math.cos(angle) * r);
  }
  for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < A; i++) {
    const a = j * (A + 1) + i, b = a + 1, c = a + A + 1, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: spec.color, flatShading: true, roughness: 1 }));
  mesh.name = 'skyline';
  return mesh;
}

// The clean room the Moon rover is built in. The floor is the flat ground at y = 0, so the room
// is only walls, a ceiling of light panels, the test stand around the start point, and two workers.
// It is 26 m wide and 30 m long; the rover starts at (0, 0) facing +Z with the camera behind it.
function buildFactoryRoom(group, workers) {
  const flat = (color, extra) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, ...extra });
  const wall = flat(0xdfe5ec), trim = flat(0xaeb6c2), dark = flat(0x596170), foil = flat(0xe3a23c, { roughness: 0.5 });
  const glow = new THREE.MeshBasicMaterial({ color: 0xffffff });
  // `casts`: things standing on the floor throw a shadow. Walls and the ceiling do not: the
  // light is meant to come from the ceiling panels, so the ceiling must not block it.
  const add = (w, h, d, x, y, z, mat, casts = false) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = casts; group.add(m); return m; };
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
  for (const x of [-2.6, 2.6]) { add(0.22, 4.2, 0.22, x, 2.1, 0, trim, true); add(0.9, 0.12, 1.4, x, 0.06, 0, dark, true); }
  add(5.4, 0.26, 0.26, 0, 4.2, 0, trim, true);
  add(0.5, 0.3, 0.4, 0, 3.95, 0, dark, true);  // the hoist
  add(0.03, 1.0, 0.03, 0, 3.3, 0, dark);       // its cable

  // Things around the room: foil-wrapped crates, a workbench, a tool cart.
  add(1.4, 1.1, 1.1, -8.5, 0.55, 9, foil, true);
  add(1.0, 0.8, 1.0, -7.2, 0.4, 10.2, foil, true);
  add(1.2, 0.7, 0.9, -8.6, 1.45, 9.1, foil, true);
  add(4.2, 0.1, 1.2, 8, 0.95, 12, trim, true);
  for (const x of [6.1, 9.9]) add(0.1, 0.95, 1.1, x, 0.475, 12, dark, true);
  add(0.9, 0.9, 0.6, -5, 0.5, -4, dark, true);

  // Two workers in clean-room suits, one each side of the stand, turned toward the rover.
  for (const [x, z] of [[-3.4, 1.6], [3.5, -0.4]]) {
    const worker = createProp('worker');
    worker.position.set(x, 0, z);
    worker.rotation.y = Math.atan2(-x, -z);
    group.add(worker);
    workers.push(worker);
  }
}

// The two pictures the Sun's glare is made of, drawn once: a round fade, and a level line that is
// brightest in the middle and thins to nothing at both ends.
const glares = new Map();
function sunGlare(kind) {
  if (!glares.has(kind)) {
    const c = document.createElement('canvas'); c.width = 256; c.height = kind === 'streak' ? 32 : 256;
    const g = c.getContext('2d');
    if (kind === 'streak') {
      const px = g.createImageData(256, 32);
      for (let y = 0; y < 32; y++) for (let x = 0; x < 256; x++) {
        const u = Math.abs(x - 127.5) / 127.5, v = Math.abs(y - 15.5) / 15.5;
        const a = Math.pow(1 - u, 2.2) * Math.exp(-v * v * 7);
        px.data.set([255, 255, 255, Math.round(255 * a)], (y * 256 + x) * 4);
      }
      g.putImageData(px, 0, 0);
    } else {
      const fade = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      fade.addColorStop(0, 'rgba(255,255,255,0.9)'); fade.addColorStop(0.25, 'rgba(255,255,255,0.35)'); fade.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = fade; g.fillRect(0, 0, 256, 256);
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    glares.set(kind, tex); // kept for the whole game: every world's Sun shares the two
  }
  return glares.get(kind);
}

export function buildWorld(name, scene, { quality = initialQuality() } = {}) {
  const look = LOOK[name];
  if (!look) throw new Error(`unknown world "${name}"`);
  const group = new THREE.Group();
  group.name = 'world:' + name;
  const rand = rng(name.length * 7919 + 13);

  scene.background = new THREE.Color(look.sky);
  scene.fog = look.fog ? new THREE.Fog(look.sky, look.fog[0], look.fog[1]) : null;

  // One warm key light, one cool fill. The Sun's shadow map (Medium and High) is set in applyQuality.
  const sun = new THREE.DirectionalLight(look.sunColor ?? 0xffffff, look.sun);
  const sunDirection = new THREE.Vector3(...(look.sunAt ?? [40, 60, -30])).normalize();
  sun.position.copy(sunDirection).multiplyScalar(150);
  // Across and up in the Sun's view of the ground, for moving its shadow box (updateShadow).
  const shadowRight = new THREE.Vector3().crossVectors(THREE.Object3D.DEFAULT_UP, sunDirection);
  if (shadowRight.lengthSq() < 1e-6) shadowRight.set(1, 0, 0); // a Sun straight overhead
  shadowRight.normalize();
  const shadowUp = new THREE.Vector3().crossVectors(sunDirection, shadowRight), shadowAt = new THREE.Vector3();
  const [fillSky, fillGround] = look.fill ?? [0xffffff, look.ground ?? 0x222233];
  const ambient = new THREE.HemisphereLight(fillSky, fillGround, look.ambient);
  group.add(sun, sun.target, ambient);

  // The Sun as a disc in the sky, in the direction the light comes from. Haze does not hide it,
  // so in the dust storm it stays as a pale dot (effects.js dims it).
  let sunDisc = null;
  if (look.disc) {
    sunDisc = new THREE.Group();
    // The dot is drawn lower than the light really comes from, and no further than a glance to
    // the side of the way the hero first faces (+z), so the player sees it without looking up.
    // The light and the shadows keep the true direction. `discAt` in the look table overrides it;
    // in deep space the Sun stays where it is: there the player has to turn and find it.
    const discDirection = sunDirection.clone();
    if (look.discAt) discDirection.set(...look.discAt).normalize();
    else if (look.ground !== null) {
      const side = THREE.MathUtils.clamp(Math.atan2(sunDirection.x, sunDirection.z), -0.32, 0.32), rise = THREE.MathUtils.degToRad(look.discHeight ?? 3); // the follow camera shows only a thin strip of sky
      discDirection.set(Math.sin(side) * Math.cos(rise), Math.sin(rise), Math.cos(side) * Math.cos(rise));
    }
    sunDisc.position.copy(discDirection).multiplyScalar(1400);
    const discSize = look.discSize ?? 30;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(discSize, 32), new THREE.MeshBasicMaterial({ color: look.disc, fog: false }));
    disc.name = 'disc';
    sunDisc.add(disc);
    // A soft glow round the dot and one long level streak through it, like a bright lamp seen
    // through a lens. Both are added light, so they vanish against a bright sky and in the storm.
    const glare = (name, w, h, opacity, z) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: sunGlare(name), color: look.disc, fog: false, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.name = name; m.position.z = z; m.userData.opacity = opacity;
      sunDisc.add(m);
    };
    glare('glow', discSize * 7, discSize * 7, look.fog ? 0.5 : 0.8, -0.6);
    glare('streak', discSize * 44, discSize * 2.2, look.fog ? 0.55 : 0.9, -0.3);
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
  let ground = null;     // the ground's material, so the storm can change its colour
  let groundMesh = null;
  if (look.ground !== null) {
    // The ground takes its shape from heightAt, the same function the physics reads.
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_CELLS, TERRAIN_CELLS);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    const col = new Float32Array(pos.count * 3).fill(1);
    // Smooth sand is painted paler on the ground itself, so the patches can be found from the air.
    const base = new THREE.Color(look.ground), pale = base.clone().lerp(new THREE.Color(0xe2b98a), 0.45);
    const paint = [pale.r / base.r, pale.g / base.g, pale.b / base.b];
    const E = TERRAIN_SIZE / TERRAIN_CELLS;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), h = heightAt(name, x, z);
      pos.setY(i, h);
      uv.setXY(i, x / TILE_METRES, z / TILE_METRES);
      if (look.plain) continue;
      // Painted shading, baked into the ground's own colour so it costs nothing to draw:
      // hollows (crater floors) a little darker, rims and crests a little lighter,
      // and slow drifts of tone so no large area is one flat colour.
      const hollow = (heightAt(name, x + E, z) + heightAt(name, x - E, z) + heightAt(name, x, z + E) + heightAt(name, x, z - E)) / 4 - h;
      let m = 1 - Math.max(-0.1, Math.min(0.16, hollow * 0.3));
      m *= 0.93 + 0.14 * tone(x / 34, z / 34, 5) + 0.06 * (tone(x / 9, z / 9, 9) - 0.5);
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = m;
      for (const p of places) {
        if (p.ripples && Math.hypot(x - p.x, z - p.z) < p.r * 0.92) { col[i * 3] = paint[0] * m; col[i * 3 + 1] = paint[1] * m; col[i * 3 + 2] = paint[2] * m; }
      }
    }
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    // The paint multiplies the ground colour, so the storm still darkens it with everything else.
    ground = new THREE.MeshStandardMaterial({ color: look.ground, flatShading: true, roughness: 1, vertexColors: true });
    groundMesh = new THREE.Mesh(geo, ground);
    groundMesh.name = 'ground';
    groundMesh.receiveShadow = true;
    group.add(groundMesh);

    if (!look.room) {
      // The plain carries on past the edge of the land you can drive on, out to the horizon.
      const apron = new THREE.RingGeometry(TERRAIN_SIZE * 0.49, 1450, 64, 1);
      apron.rotateX(-Math.PI / 2);
      const far = new THREE.Mesh(apron, new THREE.MeshStandardMaterial({ color: look.ground, flatShading: true, roughness: 1 }));
      far.position.y = -1.5;
      far.name = 'apron';
      group.add(far);
      ground.userData.apron = far.material; // the storm tints it with the ground
    }
  }
  if (look.skyline) group.add(buildSkyline(look.skyline, rand));

  const rockShape = new THREE.IcosahedronGeometry(1, 0);
  const rockMaterial = look.rock ? new THREE.MeshStandardMaterial({ color: look.rock, flatShading: true, roughness: 1 }) : null;
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), c3 = new THREE.Color();
  const boulderFields = [];
  for (const p of places) {
    if (p.boulders) {
      // A field of big rocks: a landmark and a danger to mark, so it is the same at every quality.
      const field = new THREE.InstancedMesh(rockShape, rockMaterial, p.boulders);
      for (let i = 0; i < p.boulders; i++) {
        const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * p.r, size = 0.9 + rand() * 1.6;
        const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
        q4.setFromEuler(new THREE.Euler(rand() * 0.6, rand() * Math.PI * 2, rand() * 0.6));
        m4.compose(p3.set(x, heightAt(name, x, z) + size * 0.3, z), q4, s3.set(size, size * (0.6 + rand() * 0.4), size));
        field.setMatrixAt(i, m4);
        field.setColorAt(i, c3.setScalar(0.85 + rand() * 0.3));
      }
      field.name = 'place:' + p.name;
      group.add(field);
      boulderFields.push(field);
    }
  }

  // Decorative rocks: one shape, one material, one draw call. The list is made once at the most
  // any level shows; a lower level simply draws fewer of the same rocks, in the same places.
  let rocks = null, rockShade = null, pebbles = null;
  if (look.rocks) {
    const most = Math.ceil(look.rocks * 1.6);
    rocks = new THREE.InstancedMesh(rockShape, rockMaterial, most);
    // Low has no shadow map, so each rock gets a soft dark patch on the side away from the Sun.
    const patch = new THREE.CircleGeometry(1, 10);
    patch.rotateX(-Math.PI / 2);
    rockShade = new THREE.InstancedMesh(patch, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: look.fog ? 0.22 : 0.42, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), most);
    let n = 0, tries = 0;
    while (n < most && tries++ < most * 30) {
      const x = (rand() - 0.5) * 300, z = (rand() - 0.5) * 300;
      if (Math.hypot(x, z) < 10) continue; // keep the start area clear
      if (places.some((p) => p.clear && Math.hypot(x - p.x, z - p.z) < p.r)) continue; // and the smooth sand
      const s = 0.3 + rand() * 1.4, y = heightAt(name, x, z);
      q4.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, rand() * Math.PI);
      m4.compose(p3.set(x, y + s * 0.15, z), q4, s3.set(s, s * 0.6, s));
      rocks.setMatrixAt(n, m4);
      rocks.setColorAt(n, c3.setScalar(0.84 + rand() * 0.32));
      q4.identity();
      m4.compose(p3.set(x - sunDirection.x * s * 0.6, y + 0.03, z - sunDirection.z * s * 0.6), q4, s3.set(s * 1.25, 1, s * 1.25));
      rockShade.setMatrixAt(n, m4);
      n++;
    }
    rocks.userData.most = rockShade.userData.most = n;
    rocks.name = 'rocks';
    rockShade.name = 'rockShade';
    group.add(rocks, rockShade);

    // Small stones near where the player drives: Medium and High only.
    const mostPebbles = 700;
    pebbles = new THREE.InstancedMesh(rockShape, rockMaterial, mostPebbles);
    for (let i = 0; i < mostPebbles; i++) {
      let x, z, guard = 0;
      do {
        const a = rand() * Math.PI * 2, d = 5 + Math.pow(rand(), 1.6) * 120;
        x = Math.cos(a) * d; z = Math.sin(a) * d;
      } while (guard++ < 8 && places.some((p) => p.clear && Math.hypot(x - p.x, z - p.z) < p.r));
      const s = 0.05 + rand() * 0.13;
      q4.setFromEuler(new THREE.Euler(rand() * 3, rand() * 3, rand() * 3));
      m4.compose(p3.set(x, heightAt(name, x, z) + s * 0.3, z), q4, s3.set(s, s * 0.7, s));
      pebbles.setMatrixAt(i, m4);
      pebbles.setColorAt(i, c3.setScalar(0.8 + rand() * 0.4));
    }
    pebbles.name = 'pebbles';
    group.add(pebbles);
  }

  const starLayers = [];
  if (look.stars) {
    // Three sizes of star, a few of them tinted, so the sky has depth instead of even speckle.
    // They never move or twinkle.
    const tints = [0xffffff, 0xffffff, 0xcfdcff, 0xffe9c9];
    for (const [count, size, dim] of [[1900, 1.2, 0.6], [520, 2, 0.85], [80, 3.2, 1]]) {
      starLayers.push(starLayer(rand, count, size, (c) => c.set(tints[Math.floor(rand() * tints.length)]).multiplyScalar(dim * (0.6 + rand() * 0.4))));
    }
    if (look.milkyWay) {
      // A faint band of many small stars along one tilted circle across the sky.
      const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.9, 0.3, 0.4));
      const band = starLayer(rand, 2600, 1, (c) => c.set(0x8f9ac0).multiplyScalar(0.35 + rand() * 0.45), (v) => {
        const a = rand() * Math.PI * 2, off = (rand() + rand() + rand() - 1.5) * 0.22;
        v.set(Math.cos(a), off, Math.sin(a)).normalize().applyQuaternion(tilt);
      });
      band.userData.band = true;
      starLayers.push(band);
    }
    group.add(...starLayers);
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

  // ---- Low / Medium / High ----
  let level = null, detailSize = 0, generation = 0, disposed = false;
  async function applyQuality(value, next) {
    const wanted = normalizeQuality(next ?? value);
    const preset = typeof value === 'object' ? value : presetFor(wanted);
    const mine = ++generation;
    const size = ground && !look.plain ? preset.textureSize : 0;
    let map = ground?.map ?? null;
    if (size !== detailSize && size) {
      try { map = await takeDetail(size); }
      catch (error) { dropDetail(size); throw error; }
      if (disposed || mine !== generation) { dropDetail(size); return; }
    }
    if (disposed || mine !== generation) return;
    if (size !== detailSize) {
      ground.map = size ? map : null; ground.needsUpdate = true;
      if (rockMaterial) { rockMaterial.map = ground.map; rockMaterial.needsUpdate = true; }
      if (detailSize) dropDetail(detailSize);
      detailSize = size;
    }
    level = wanted;

    if (rocks) {
      rocks.count = rockShade.count = Math.min(rocks.userData.most, Math.round(look.rocks * preset.decorScale));
      rockShade.visible = preset.shadowMapSize === 0;
      rocks.castShadow = preset.shadowMapSize > 0; // with no air nothing softens the light: every rock throws a shadow
      pebbles.count = preset.pebbles;
      pebbles.visible = preset.pebbles > 0;
    }
    for (const field of boulderFields) field.castShadow = preset.shadowMapSize > 0;
    for (const layer of starLayers) layer.geometry.setDrawRange(0, Math.floor(layer.userData.total * (layer.userData.band ? preset.starBand : preset.starScale)));

    // The Sun's shadow: one map, kept to a box around the hero (effects.js moves the box).
    const shadows = preset.shadowMapSize > 0 && !!groundMesh;
    if (sun.shadow.map && (!shadows || sun.shadow.mapSize.x !== preset.shadowMapSize)) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    sun.castShadow = shadows;
    if (shadows) {
      const R = preset.shadowRange, cam = sun.shadow.camera;
      sun.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize);
      cam.left = -R; cam.right = R; cam.top = R; cam.bottom = -R; cam.near = 1; cam.far = 320;
      cam.updateProjectionMatrix();
      // Small offsets, so a shadow starts where the boot or the wheel meets the ground. The old
      // ones (-0.0006, 0.06) pushed it some 30 cm away under a low Sun. The ground does not cast,
      // so it cannot streak itself; these only have to keep the machines and rocks clean.
      sun.shadow.bias = -0.00006; // about 2 cm along the light
      sun.shadow.normalBias = 0.015;
      // The edge is smoothed by the renderer's soft filter (core/quality.js), the same in every
      // world. That filter does not read `radius`; it is kept for the look table.
      sun.shadow.radius = look.shadowSoft ?? 1;
    }

    return preset;
  }
  const ready = applyQuality(quality);
  // A chapter can be disposed while the first texture is loading. attach() also awaits ready.
  ready.catch((error) => console.warn('World texture failed to load', error.message));

  scene.add(group);
  return {
    group,
    name, look, sun, ambient, ground, sunDisc, // effects.js reads and changes these
    sunDirection,
    workers,
    applyQuality, ready,
    get textureSize() { return detailSize; },
    updateShadow(target) {
      if (!sun.castShadow) return;
      // The box follows the hero in whole shadow pixels, measured along the two axes of the Sun's
      // own view. Moved freely, every shadow edge crawls while the hero drives.
      const texel = (sun.shadow.camera.right - sun.shadow.camera.left) / sun.shadow.mapSize.x;
      const p = target.position;
      shadowAt.set(0, 0, 0)
        .addScaledVector(shadowRight, Math.round(p.dot(shadowRight) / texel) * texel)
        .addScaledVector(shadowUp, Math.round(p.dot(shadowUp) / texel) * texel)
        .addScaledVector(sunDirection, p.dot(sunDirection));
      sun.target.position.copy(shadowAt);
      sun.position.copy(shadowAt).addScaledVector(sunDirection, 150);
      sun.target.updateMatrixWorld();
    },
    get quality() { return level; },
    get shadowRange() { return sun.castShadow ? presetFor(level).shadowRange : 0; },
    dispose() {
      disposed = true; generation++;
      scene.remove(group);
      scene.fog = null;
      if (detailSize) { dropDetail(detailSize); detailSize = 0; }
      if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
      const materials = new Set(), geometries = new Set();
      group.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        if (o.material) materials.add(o.material);
        if (o.isInstancedMesh) o.dispose();
      });
      geometries.forEach((g) => { if (!g.userData.shared) g.dispose(); });
      rockShape.dispose(); // may be unused in the factory/space
      materials.forEach((m) => { if (!m.userData.shared) m.dispose(); });
    },
  };
}
