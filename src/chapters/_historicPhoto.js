// Photo positions are authored from the NASA references in photo_tasks.json.
// These small sets match the composition, not survey-grade Martian coordinates.
import * as THREE from 'three';
import { loadJSON } from '../core/content.js';
import { el } from '../ui/dom.js';

export async function revealPhoto(s, ctx, id, after = () => {}) {
  await s.do(ctx.memory.preload(id));
  await s.fade(true, 0.6);
  const shown = ctx.memory.show(id, { reveal: true });
  await s.do(shown);
  after();
  await s.fade(false, 0.6);
}

function buildSet(kind) {
  const group = new THREE.Group();
  const grey = kind !== 'orion';
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
  mesh(ground, grey ? 0x686866 : 0xa4825d, [0, 0, 0]);
  // Repeatable rocks: photo composition should not change on restart.
  let seed = 76;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 150; i++) {
    const x = (rand() - 0.5) * 24, z = (rand() - 0.5) * 20;
    const size = kind === 'viking' ? 0.06 + rand() * 0.27 : 0.03 + rand() * 0.1;
    mesh(new THREE.IcosahedronGeometry(size, 0), grey ? 0x7e7c77 : 0x998165, [x, height(x,z) + size * .4, z], [1.3, .7, 1]);
  }
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
  } else if (kind === 'viking') {
    // Match the published, horizontally flipped view: sampler housing/struts left; exposed soil right.
    mesh(new THREE.BoxGeometry(1.8,.45,2.6), 0xb7b6b0, [-3,1.1,-.5]);
    rod([-2.5,1.2,-1.5],[-2.1,.15,2],.16,0xaaa9a1);
    rod([-3.5,.9,1.4],[-2.1,.15,2],.13,0xa4a39e);
  } else {
    // Pancam panorama: shallow oval depression, low far rim, wheel tracks down the left foreground.
    for (let j=0;j<30;j++) for (const x of [-7.4,-6.7]) {
      const z = 3 + j*.23;
      mesh(new THREE.BoxGeometry(.42,.025,.1),0x73634e,[x,height(x,z)+.04,z]);
    }
  }
  group.add(new THREE.HemisphereLight(0xffffff, 0x51463b, 2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.5); sun.position.set(-6,9,4); group.add(sun);
  return group;
}

export async function captureHistoricPhoto(s, ctx, id) {
  const profiles = await s.do(loadJSON('content/photo_tasks.json'));
  const profile = profiles[id];
  if (!profile) throw new Error(`No authored photo position for ${id}`);
  await s.do(ctx.memory.preload(id));
  const wasControls = s.controls;
  s.lockControls(); ctx.navigation.clear();
  await s.fade(true, .35);
  const previous = ctx.scene.children.map((object) => [object, object.visible]);
  const background = ctx.scene.background, fog = ctx.scene.fog, fov = ctx.camera.fov;
  const follow = ctx.followCam.enabled;
  const set = buildSet(profile.set);
  ctx.scene.add(set);
  ctx.scene.background = new THREE.Color(profile.set === 'orion' ? 0xb89b7c : 0x747472);
  ctx.scene.fog = null;
  ctx.followCam.enabled = false;
  const root=document.getElementById('ui');root.classList.add('photo-mode');
  const overlay = el('div', 'historic-viewfinder', root);
  const frame = el('div', 'historic-frame', overlay);
  frame.style.setProperty('--photo-aspect', profile.aspect);
  el('span','historic-reticle', frame, '+');
  const label = el('div','historic-label', overlay);
  el('div','',label,`${profile.title} · ${profile.date}`);
  el('div','',label,'Recreated camera view · A/D and W/S to frame · Space to photograph');
  const ar = el('div','ar',label,'مشهد معاد بناؤه · وجّه الكاميرا ثم اضغط Space لالتقاط الصورة');
  ar.lang='ar'; ar.dir='rtl';
  const state = s.captureState = { id, yaw: .15, pitch: .05, phase: 'frame', captured: false };
  const basePosition = new THREE.Vector3(...profile.position), baseTarget = new THREE.Vector3(...profile.target);
  const direction = baseTarget.clone().sub(basePosition);
  const baseYaw = Math.atan2(direction.x, -direction.z), basePitch = Math.atan2(direction.y, Math.hypot(direction.x,direction.z));
  const aim = () => {
    previous.forEach(([o]) => { o.visible = false; });
    ctx.camera.position.copy(basePosition);
    const yaw = baseYaw + state.yaw, pitch = basePitch + state.pitch;
    ctx.camera.lookAt(basePosition.clone().add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch))));
    ctx.camera.fov = profile.fov; ctx.camera.updateProjectionMatrix();
  };
  const stop = s.every(aim);
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return; cleaned = true;
    stop(); overlay.remove(); root.classList.remove('photo-mode'); ctx.scene.remove(set);
    const geometries = new Set(), materials = new Set();
    set.traverse((o) => { if(o.geometry)geometries.add(o.geometry); if(o.material)materials.add(o.material); });
    geometries.forEach((g)=>g.dispose()); materials.forEach((m)=>m.dispose());
    previous.forEach(([o,v])=>{o.visible=v;});
    ctx.scene.background=background; ctx.scene.fog=fog;
    ctx.camera.fov=fov;ctx.camera.updateProjectionMatrix();ctx.followCam.enabled=follow;ctx.followCam.snap();
  };
  s.onDispose(cleanup);
  try {
    aim(); await s.fade(false,.35);
    await s.until((dt)=>{
      state.yaw = THREE.MathUtils.clamp(state.yaw + ((ctx.input.down('KeyD','ArrowRight')?1:0)-(ctx.input.down('KeyA','ArrowLeft')?1:0))*dt*.35,-.35,.35);
      state.pitch = THREE.MathUtils.clamp(state.pitch + ((ctx.input.down('KeyW','ArrowUp')?1:0)-(ctx.input.down('KeyS','ArrowDown')?1:0))*dt*.25,-.2,.2);
      const aligned=Math.abs(state.yaw)<.035 && Math.abs(state.pitch)<.035;
      frame.classList.toggle('aligned',aligned);
      ctx.hud.setObjective(aligned ? 'Space: capture this mission view' : `Frame ${profile.subject}: ${state.yaw>.035?'A: left':state.yaw<-.035?'D: right':state.pitch>.035?'S: down':'W: up'}`);
      return aligned && ctx.input.pressed('Space');
    });
    state.captured=true; state.phase='reveal'; s.sound('shutter', 'tick');
    ctx.hud.setObjective(''); overlay.classList.add('hidden');
    await revealPhoto(s,ctx,id,cleanup);
    state.phase='done';
  } finally { cleanup(); }
  if (wasControls) s.unlockControls();
}
