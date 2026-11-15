// Authored from PIA20285, PIA21708 and the published flipped PIA10738.
// These are stylized composition studies, not a photogrammetric reconstruction.
import * as THREE from 'three';
import { presetFor, initialQuality } from './quality.js';

export function buildPhotoSet(kind, detail = null) {
  const group = new THREE.Group();
  const grey = kind !== 'orion';
  group.name = 'historic-photo-set';
  const surface = detail?.clone();
  if (surface) { surface.repeat.set(6, 6); surface.needsUpdate = true; }
  const materials = new Map();
  const mat = (color) => {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 1 }));
    return materials.get(color);
  };
  const mesh = (geo, color, pos, scale = [1, 1, 1]) => {
    const o = new THREE.Mesh(geo, mat(color));
    o.position.set(...pos); o.scale.set(...scale); group.add(o); return o;
  };
  const rod = (a, b, radius, color) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), d = end.clone().sub(start);
    const o = mesh(new THREE.CylinderGeometry(radius, radius, d.length(), 8), color, start.add(end).multiplyScalar(0.5).toArray());
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return o;
  };
  const height = (x, z) => kind === 'orion'
    ? -1.4 * Math.exp(-(x*x + z*z) / 32) + 0.3 * Math.exp(-((Math.hypot(x,z)-7)**2) / 1.5)
    : kind === 'potts' ? Math.max(0, -z - 1) * 0.22 + 1.5*Math.exp(-((x-1)**2+(z+6)**2)/18) : 0;
  const ground = new THREE.PlaneGeometry(50, 50, 80, 80);
  ground.rotateX(-Math.PI / 2);
  const positions = ground.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i);
    positions.setY(i, height(x, z) + Math.sin(x * 14 + z * 5) * 0.025);
  }
  ground.computeVertexNormals();
  const groundMesh = mesh(ground, grey ? 0x686866 : 0xa4825d, [0, 0, 0]);
  groundMesh.material = groundMesh.material.clone(); groundMesh.material.map = surface;
  const colors = new Float32Array(positions.count * 3);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i);
    const v = .91 + Math.sin(x * 2.8 + Math.sin(z * 3)) * .035 + Math.cos(z * 7 + x) * .025;
    colors.set([v, v, v], i * 3);
  }
  ground.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  groundMesh.material.vertexColors = true;
  // Repeatable rocks: photo composition should not change on restart.
  let seed = 76;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const gravel = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), mat(grey ? 0x7e7c77 : 0x998165), 150);
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), scale = new THREE.Vector3(), rotation = new THREE.Quaternion();
  for (let i = 0; i < 150; i++) {
    const x = (rand() - .5) * 24, z = (rand() - .5) * 20;
    const size = kind === 'viking' ? .04 + rand() * .22 : .03 + rand() * .1;
    position.set(x, height(x,z) + size * .4, z); scale.set(size * 1.3, size * .7, size);
    rotation.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, rand() * Math.PI * 2);
    gravel.setMatrixAt(i, matrix.compose(position, rotation, scale));
  }
  group.add(gravel);
  if (kind === 'viking') {
    for (const [x,z,size] of [[-.8,-.7,.35],[.4,0,.22],[1.4,-.4,.3],[1.9,1,.24],[.3,-1.3,.27],[2.4,-1.2,.42]]) mesh(new THREE.IcosahedronGeometry(size,0),0x81807a,[x,size*.5,z],[1.2,.8,1]);
  }
  if (kind === 'potts') {
    // Low front Hazcam: arm enters from the left, downward tool in the middle, right wheel foreground.
    rod([-2.5, .25, 2.5], [-.6, 1.5, -.8], .15, 0xb9b8b1);
    rod([-.6, 1.5, -.8], [-.35, .4, -1.1], .12, 0x777773);
    const turret = mesh(new THREE.CylinderGeometry(.35, .35, .35, 12), 0x93938d, [-.35,.32,-1.1]);
    turret.rotation.z = Math.PI/2;
    const wheel = mesh(new THREE.CylinderGeometry(.55,.55,.4,18), 0x30302e, [2.1,.42,2]);
    wheel.rotation.z = Math.PI/2;
    mesh(new THREE.BoxGeometry(1.4,.3,1.5), 0x888781, [-2.6,.3,2.5]);
    // Hazcam silhouette: hollow tool yoke, elbow pivots and cable loop, with wheel cleats.
    rod([-.55, 1.42, -.8], [-.5, .55, -1.05], .055, 0x3f403e);
    rod([-.1, 1.42, -.8], [-.1, .55, -1.05], .055, 0x3f403e);
    rod([-.55, 1.42, -.8], [-.1, 1.42, -.8], .09, 0x9c9c96);
    const cable = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.3,.4,2.4),new THREE.Vector3(-1.1,1.35,.1),new THREE.Vector3(-.8,1.6,-.7),new THREE.Vector3(-.4,1.1,-1)]);
    mesh(new THREE.TubeGeometry(cable, 16, .025, 5, false),0x363735,[0,0,0]);
    for (let i = 0; i < 18; i++) {
      const a = i / 18 * Math.PI * 2;
      const cleat = mesh(new THREE.BoxGeometry(.43,.035,.065),0x565653,[2.1,.42+Math.cos(a)*.55,2+Math.sin(a)*.55]);
      cleat.rotation.x = a;
    }
    // Broad fixed rock plates convey the rising abrasion target rather than a smooth hill.
    for (const [x,z,k] of [[-1,-3,.8],[.8,-3.2,1.1],[2,-4,1.3],[-1.4,-5,1.2],[.5,-6,1.6]]) {
      mesh(new THREE.IcosahedronGeometry(1,0),0x757570,[x,height(x,z)+.05,z],[k,.12,k*.7]);
    }
  } else if (kind === 'viking') {
    // Match the published, horizontally flipped view: sampler housing/struts left; exposed soil right.
    mesh(new THREE.BoxGeometry(1.8,.45,2.6), 0xb7b6b0, [-3,1.1,-.5]);
    rod([-2.5,1.2,-1.5],[-2.1,.15,2],.16,0xaaa9a1);
    rod([-3.5,.9,1.4],[-2.1,.15,2],.13,0xa4a39e);
    mesh(new THREE.BoxGeometry(1.25,.08,1.85),0x8b8c87,[-2.9,1.36,-.45]);
    mesh(new THREE.BoxGeometry(1.05,.05,1.65),0xc5c5bf,[-2.9,1.42,-.45]);
    // Sampler-housing seams and paired lower braces in the published flipped image.
    rod([-3.2,.8,1.3],[-1.9,.15,1.8],.055,0xd4d3cc);
    rod([-2.5,1.15,-1.4],[-1.9,.15,1.8],.055,0x666863);
    for (let j=0;j<5;j++) mesh(new THREE.BoxGeometry(.035,.02,1.7),0x777975,[-3.35+j*.22,1.46,-.45]);
  } else {
    // Pancam panorama: shallow oval depression, low far rim, wheel tracks down the left foreground.
    for (let j=0;j<30;j++) for (const baseX of [-7.4,-6.7]) {
      const x = baseX + Math.sin(j * .04) * .5;
      const z = 3 + j*.23;
      mesh(new THREE.BoxGeometry(.42,.025,.1),0x73634e,[x,height(x,z)+.04,z]);
    }
  }
  group.add(new THREE.HemisphereLight(0xffffff, 0x51463b, 2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.5); sun.position.set(-6,9,4); group.add(sun);
  // The same Sun shadow as the worlds (world.js applyQuality), over the 24 m the set covers.
  // Low has no shadow map. The ground receives and never casts, as in the worlds.
  const size = presetFor(initialQuality()).shadowMapSize;
  if (size > 0) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(size, size);
    Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 40 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0005; // about 2 cm along the light, as in the worlds
    sun.shadow.normalBias = 0.015;
    group.traverse((o) => { if (o.isMesh) { o.castShadow = o !== groundMesh; o.receiveShadow = true; } });
  }
  group.userData.dispose = () => { surface?.dispose(); sun.shadow.map?.dispose(); };
  return group;
}

