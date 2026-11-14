// Photo positions are authored from the NASA references in photo_tasks.json.
// These small sets match the composition, not survey-grade Martian coordinates.
import * as THREE from 'three';
import { loadJSON } from '../core/content.js';
import { el } from '../ui/dom.js';
import { buildPhotoSet } from '../world/photoSet.js';

export async function revealPhoto(s, ctx, id, after = () => {}) {
  await s.do(ctx.memory.preload(id));
  await s.fade(true, 0.6);
  const shown = ctx.memory.show(id, { reveal: true });
  await s.do(shown);
  after();
  await s.fade(false, 0.6);
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
  const set = buildPhotoSet(profile.set, s.env.ground?.map);
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
    set.userData.dispose?.();
    const geometries = new Set(), materials = new Set();
    set.traverse((o) => { if(o.geometry)geometries.add(o.geometry); if(o.material)materials.add(o.material); if(o.isInstancedMesh)o.dispose(); });
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
