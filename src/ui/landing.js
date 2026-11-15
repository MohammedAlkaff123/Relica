// The landing page's living picture: two of the game's own machines with their faces.
// Pioneer 10 drifts in the top corner; the Lunar Rover sits on the curve of the Moon in the
// opposite bottom corner, blinking, its eyes following the pointer. Owner: Set C.
//
//   const landing = await createLanding(canvas)
//   landing.mood('happy')     the rover reacts (hovering "Start the game")
//   landing.dispose()         frees the GPU before the game starts
import * as THREE from 'three';
import { createCharacter } from '../characters/character.js';
import { prefs } from './prefs.js';

// A low-poly Moon in the game's flat-shaded style: an icosphere with gentle dents.
function makeMoon(radius) {
  const geo = new THREE.IcosahedronGeometry(radius, 5);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const craters = [];
  for (let i = 0; i < 14; i++) {
    craters.push({ dir: new THREE.Vector3(Math.sin(i * 2.4) * 0.9, Math.cos(i * 1.7), Math.sin(i * 3.1)).normalize(), size: 0.16 + (i % 4) * 0.05, depth: 0.05 + (i % 3) * 0.03 });
  }
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let h = 0;
    for (const c of craters) {
      const d = v.angleTo(c.dir) / c.size;
      if (d < 1.25) h -= c.depth * (d < 1 ? 1 - d * d : 0) - (d > 0.9 && d < 1.25 ? 0.02 : 0);
    }
    h += Math.sin(v.x * 9) * Math.cos(v.z * 7) * 0.012;
    v.multiplyScalar(radius * (1 + h * 0.6));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0x9c968c, roughness: 0.95, flatShading: true });
  return new THREE.Mesh(geo, mat);
}

export async function createLanding(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  camera.position.set(0, 0, 16);

  // Warm key light from the Sun's side, cool fill: the same warm/cool contrast as the worlds.
  scene.add(new THREE.HemisphereLight(0xcfd8e6, 0x2a221c, 0.9));
  const key = new THREE.DirectionalLight(0xffe2c0, 2.2);
  key.position.set(-6, 8, 10);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fb4ff, 0.8);
  rim.position.set(8, -2, -6);
  scene.add(rim);

  const moon = makeMoon(5);
  scene.add(moon);
  const rover = createCharacter('lrv');
  const roverHolder = new THREE.Group();
  roverHolder.add(rover.object);
  scene.add(roverHolder);
  rover.setEmotion('happy');
  const pioneer = createCharacter('pioneer');
  const pioneerHolder = new THREE.Group();
  pioneerHolder.add(pioneer.object);
  pioneerHolder.scale.setScalar(1.25);
  scene.add(pioneerHolder);
  pioneer.setEmotion('curious');

  const pointer = new THREE.Vector3(0, 0, 4);
  const onMove = (e) => {
    const x = (e.clientX / innerWidth) * 2 - 1, y = -(e.clientY / innerHeight) * 2 + 1;
    pointer.set(x * 8, y * 4.5, 4);
  };
  window.addEventListener('pointermove', onMove);

  // Place both machines in the screen corners for any window shape; mirrored for Arabic.
  function layout() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const viewH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const viewW = viewH * camera.aspect;
    const side = prefs.rtl ? -1 : 1; // +1: rover on the right (end side in English)
    const small = w < 760;
    const r = small ? 3.2 : 5;
    moon.scale.setScalar(r / 5);
    moon.position.set(side * (viewW / 2 - r * 0.05), -viewH / 2 - r * 0.68, -1);
    // The rover sits on the Moon's curve, a little toward the screen centre, leaning with the surface.
    const dir = new THREE.Vector3(-side * 0.3, 1, 0).normalize();
    roverHolder.position.copy(moon.position).addScaledVector(dir, r * 1.0 + 0.25);
    roverHolder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    roverHolder.scale.setScalar(small ? 0.7 : 1.05);
    rover.object.rotation.y = side * -0.45;
    pioneerHolder.position.set(-side * (viewW / 2 - (small ? 1.2 : 2.2)), viewH / 2 - (small ? 1.3 : 2.0), 0);
    pioneerHolder.scale.setScalar(small ? 0.8 : 1.35);
  }
  layout();
  window.addEventListener('resize', layout);
  const unlisten = prefs.subscribe(layout);

  let running = true, last = performance.now(), time = 0, moodTimer = 0;
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    moon.rotation.y += dt * 0.02;
    pioneer.object.rotation.y = Math.sin(time * 0.25) * 0.5 + 0.4;
    pioneer.object.rotation.z = Math.sin(time * 0.31) * 0.08;
    pioneerHolder.position.y += Math.sin(time * 0.8) * 0.0025;
    rover.lookAt(pointer);
    pioneer.lookAt(pointer);
    if (moodTimer > 0 && (moodTimer -= dt) <= 0) rover.setEmotion('happy');
    rover.update(dt);
    pioneer.update(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    mood(name, seconds = 2) { rover.setEmotion(name); moodTimer = seconds; },
    dispose() {
      running = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', layout);
      unlisten();
      rover.dispose();
      pioneer.dispose();
      moon.geometry.dispose();
      moon.material.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
    },
  };
}
