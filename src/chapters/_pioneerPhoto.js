// A compressed memory of Pioneer's Jupiter imaging work. The captured picture is a game image.
import * as THREE from 'three';
import { mission } from './_mission.js';
import { revealPhoto } from './_historicPhoto.js';
import { el } from '../ui/dom.js';

const CONE = 8 * Math.PI / 180;
const difference = (target, yaw) => Math.atan2(Math.sin(target - yaw), Math.cos(target - yaw));

export async function photographJupiter(s, ctx) {
  const m = mission(ctx, 'epilogue_photo');
  ctx.hud.setContext('Pioneer 10', 'Jupiter flyby');
  ctx.hud.setStat('date', 'December 1973');
  ctx.hud.setStat('planned', '21 months');
  await s.do(ctx.card.chapter('epilogue_photo'));
  s.hero.setEmotion('curious');
  const state = s.photoState = { phase: 'frame', targetYaw: 0.42, captured: false, sent: false };
  const earthYaw = -0.65;
  const objects = s.add(new THREE.Group());
  const materials = [];
  const latitudeColors = [0xd9c3a6, 0xb59b7f, 0xe4cfad, 0xc99b73, 0xead5b6, 0xb58261, 0xe4c6a0, 0xb48b70, 0xd7bc9c, 0xe4d1b6];
  // Simple bands provide a readable Jupiter silhouette without requiring another image asset.
  const jupiter = new THREE.Group();
  jupiter.position.set(Math.sin(state.targetYaw) * 80, s.hero.object.position.y, Math.cos(state.targetYaw) * 80);
  for (let i = 0; i < latitudeColors.length; i++) {
    const material = new THREE.MeshBasicMaterial({ color: latitudeColors[i] });
    materials.push(material);
    jupiter.add(new THREE.Mesh(new THREE.SphereGeometry(8, 48, 3, 0, Math.PI * 2, i * Math.PI / 10, Math.PI / 10), material));
  }
  objects.add(jupiter);
  const earthMaterial = new THREE.MeshBasicMaterial({ color: 0xa8d6ff });
  materials.push(earthMaterial);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), earthMaterial);
  earth.position.set(Math.sin(earthYaw) * 65, s.hero.object.position.y, Math.cos(earthYaw) * 65);
  objects.add(earth);

  const overlay = el('div', 'pioneer-viewfinder', document.getElementById('ui'));
  overlay.setAttribute('aria-label', 'Pioneer image capture');
  const reticle = el('div', 'pioneer-reticle', overlay);
  const label = el('div', 'pioneer-target', reticle, 'Jupiter · المشتري');
  const preview = el('img', 'pioneer-preview hidden', overlay);
  preview.alt = 'Jupiter captured in the game';
  const imageNote = el('div', 'pioneer-image-note hidden', overlay, 'Game image · صورة من اللعبة');
  const originalFov = ctx.camera.fov;
  ctx.followCam.enabled = false;
  ctx.camera.fov = 50;
  ctx.camera.updateProjectionMatrix();
  const direction = new THREE.Vector3();
  const look = new THREE.Vector3();
  const aim = () => {
    direction.set(Math.sin(s.hero.object.rotation.y), 0, Math.cos(s.hero.object.rotation.y));
    ctx.camera.position.copy(s.hero.object.position).addScaledVector(direction, 8);
    look.copy(ctx.camera.position).add(direction);
    ctx.camera.lookAt(look);
  };
  const stopCamera = s.every(aim);
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    stopCamera();
    overlay.remove();
    ctx.scene.remove(objects);
    objects.traverse((o) => o.geometry?.dispose());
    for (const material of materials) material.dispose();
    ctx.camera.fov = originalFov;
    ctx.camera.updateProjectionMatrix();
    ctx.followCam.enabled = true;
    ctx.followCam.snap();
  };
  s.onDispose(cleanup);
  s.unlockControls();
  aim();

  await s.until(() => {
    const off = difference(state.targetYaw, s.hero.object.rotation.y);
    const aligned = Math.abs(off) < CONE;
    reticle.classList.toggle('aligned', aligned);
    if (aligned) m.done(0);
    ctx.hud.setObjective(aligned ? 'Space: capture Jupiter · التقط صورة للمشتري' : 'A / D: frame Jupiter · ضع المشتري داخل الإطار');
    if (!aligned || !ctx.input.pressed('Space')) return false;
    state.captured = true;
    state.phase = 'scan';
    return true;
  });

  s.lockControls();
  s.spinRate = 0;
  aim();
  // Render before copying: WebGL need not preserve the previous frame's drawing buffer.
  ctx.renderer.render(ctx.scene, ctx.camera);
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = Math.round(320 * ctx.renderer.domElement.height / ctx.renderer.domElement.width);
  canvas.getContext('2d').drawImage(ctx.renderer.domElement, 0, 0, canvas.width, canvas.height);
  preview.src = canvas.toDataURL('image/jpeg', 0.8);
  preview.classList.remove('hidden');
  imageNote.classList.remove('hidden');
  let scanned = 0;
  await s.until((dt) => {
    scanned = Math.min(1, scanned + dt / 1.5);
    preview.style.clipPath = `inset(0 0 ${(1 - scanned) * 100}% 0)`;
    ctx.hud.setObjective(`Scanning image ${Math.round(scanned * 100)}% · جارٍ تسجيل الصورة`);
    return scanned === 1;
  });
  m.done(1);
  s.hero.setEmotion('happy');
  state.phase = 'send';
  state.targetYaw = earthYaw;
  label.textContent = 'Earth · الأرض';
  s.unlockControls();
  let held = 0;
  await s.until((dt) => {
    const aligned = Math.abs(difference(earthYaw, s.hero.object.rotation.y)) < CONE;
    reticle.classList.toggle('aligned', aligned);
    held = aligned ? held + dt : 0;
    ctx.hud.setObjective(aligned ? `Sending image ${Math.min(100, Math.floor(held * 50))}% · جارٍ إرسال الصورة` : 'A / D: turn toward Earth to send · اتجه نحو الأرض للإرسال');
    return held >= 2;
  });
  state.sent = true;
  state.phase = 'done';
  m.done(2);
  s.lockControls();
  s.spinRate = 0;
  ctx.hud.setObjective('Image sent home · أُرسلت الصورة إلى الأرض');
  ctx.audio.beep('pioneer');
  await s.wait(1.5);
  overlay.classList.add('hidden');
  await revealPhoto(s, ctx, 'AC73-9341');
  await s.fade(true, 0.5);
  cleanup();
  ctx.hud.setObjective('');
  ctx.hud.setStat('date', '1973 → 2003');
  await s.card('21 months planned. More than 30 years.', 'مهمة مقررة من ٢١ شهرًا امتدت أكثر من ٣٠ سنة.');
  ctx.hud.setWorld('space');
  await s.fade(false, 0.5);
}
