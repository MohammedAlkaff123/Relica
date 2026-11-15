// The living picture behind the main menu: the Lunar Rover idling on the real Moon terrain of chapter 1,
// with its face, while the camera drifts around it. Owner: Set C (built from Set B's world and character).
//
//   const scene = createMenuScene(ctx)   builds it in ctx.scene
//   scene.update(dt)                     every frame while the menu is open
//   scene.mood('happy')                  the rover reacts to the menu (hover, start)
//   scene.dispose()                      removes everything before a chapter starts
import * as THREE from 'three';
import { buildWorld } from '../world/world.js';
import { heightAt } from '../core/terrain.js';
import { createCharacter } from '../characters/character.js';
import { prefs } from './prefs.js';

export function createMenuScene(ctx) {
  const { scene, camera } = ctx;
  const env = buildWorld('moon', scene, { quality: ctx.quality.get() });
  const hero = createCharacter('lrv');
  const x = 6, z = 10;
  hero.object.position.set(x, heightAt('moon', x, z) + hero.half[1], z);
  hero.object.rotation.y = -0.6;
  hero.setEmotion('curious');
  scene.add(hero.object);

  const focus = new THREE.Vector3(x, hero.object.position.y + 0.55, z);
  const look = new THREE.Vector3();
  const pointer = new THREE.Vector2(0, 0);
  let angle = 0.9, time = 0, moodTimer = 0;

  const onMove = (e) => { pointer.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1); };
  window.addEventListener('pointermove', onMove);

  // Push the picture to the side away from the menu card, so the rover is never behind the buttons.
  function frame() {
    const w = innerWidth, h = innerHeight;
    if (w < 820) { camera.clearViewOffset(); return; }
    const shift = w * 0.17 * (prefs.rtl ? 1 : -1);
    camera.setViewOffset(w, h, shift, 0, w, h);
  }

  return {
    hero,
    update(dt) {
      time += dt;
      angle += dt * 0.05;
      const r = 6.2;
      camera.position.set(focus.x + Math.sin(angle) * r, focus.y + 1.3 + Math.sin(time * 0.3) * 0.15, focus.z + Math.cos(angle) * r);
      camera.lookAt(focus);
      frame();
      // Keep the rover's face turned toward us in a three-quarter view while the camera drifts.
      hero.object.rotation.y = angle + (prefs.rtl ? 0.55 : -0.55);
      // The rover's eyes follow the pointer a little, so the menu feels alive.
      look.set(focus.x + pointer.x * 3, focus.y - pointer.y * 1.2, focus.z).add(camera.position).multiplyScalar(0.5);
      hero.lookAt(look);
      if (moodTimer > 0 && (moodTimer -= dt) <= 0) hero.setEmotion('curious');
      hero.update(dt);
    },
    mood(name, seconds = 2.5) { hero.setEmotion(name); moodTimer = seconds; },
    dispose() {
      window.removeEventListener('pointermove', onMove);
      camera.clearViewOffset();
      scene.remove(hero.object);
      hero.dispose();
      env.dispose();
    },
  };
}
