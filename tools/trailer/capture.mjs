// Records the trailer's clips from the running game, frame by frame, into tools/trailer/out/<clip>/.
//   node capture.mjs            every clip
//   node capture.mjs liftoff    one clip (or several names)
// Start the game first:  python serve.py
//
// Each clip opens the game at a quiet point, takes over the camera, and plays one moment.
// Nothing here changes the game: it only drives it, like a player with a tripod.
// The cut list (which frames of which clip go where) is in timeline.mjs.
import { launch, openGame, until, skip, record, stageReady, hide } from './lib.mjs';

// ---------- helpers that run inside the game page ----------
// T.setCam((t, dt, camera) => {...}) takes the camera over (t = seconds since it was set); null gives it back.
async function install(page) {
  await page.evaluate(async () => {
    const R = window.relica;
    if (window.T) return;
    const THREE = await import('three');
    const T = window.T = { THREE, cam: null, t: 0, run: [] };
    const cine = R.cinematics.update.bind(R.cinematics), follow = R.followCam.update.bind(R.followCam);
    R.cinematics.update = (dt) => { if (!T.cam) cine(dt); };
    R.followCam.update = (dt) => {
      for (const fn of T.run) fn(dt);
      if (!T.cam) return follow(dt);
      T.t += dt;
      T.cam(T.t, dt, R.camera);
      R.camera.updateProjectionMatrix();
    };
    T.setCam = (fn) => { T.cam = fn; T.t = 0; document.getElementById('ui').classList.remove('cinema'); };
    // Camera at `from` looking at `to` (arrays or Vector3), with a field of view.
    const V = (v) => (v.isVector3 ? v : new THREE.Vector3(v[0], v[1], v[2]));
    T.aim = (cam, from, to, fov = 50) => { cam.position.copy(V(from)); cam.lookAt(V(to)); cam.fov = fov; };
    T.pos = (o) => o.getWorldPosition(new THREE.Vector3());
    T.ease = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
    T.mix = (a, b, u) => a + (b - a) * u;
    T.find = (name) => { const out = []; R.scene.traverse((o) => { if (o.name === name) out.push(o); }); return out; };
    // A point given in the hero's own space: x to its left, y up, z ahead.
    T.rel = (x, y, z) => new THREE.Vector3(x, y, z).applyQuaternion(R.stage.hero.object.quaternion).add(R.stage.hero.object.position);
    // A camera that keeps its place relative to the hero, drifting from one spot to another over `secs`.
    T.track = (a, b, lookY, fov, secs = 3) => T.setCam((t, dt, cam) => {
      const u = T.ease(t / secs);
      const h = R.stage.hero.object.position;
      T.aim(cam, T.rel(T.mix(a[0], b[0], u), T.mix(a[1], b[1], u), T.mix(a[2], b[2], u)), [h.x, h.y + lookY, h.z], fov);
    });
    await R.stage.hero.ready;
  });
}

// Opens a chapter and waits until its world and hero are on stage. `jump` picks a quiet point.
async function chapter(browser, id, jump) {
  const page = await openGame(browser, `?chapter=${id}${jump ? '&jump=' + jump : ''}&lang=ar&mute&quality=high`);
  await until(page, stageReady, { label: id });
  await install(page);
  await skip(page, 20); // let models settle on the ground
  return page;
}

const keys = (page, down, up = []) => Promise.all([...up.map((k) => page.keyboard.up(k)), ...down.map((k) => page.keyboard.down(k))]);

// Plays a mini-game with the keys its own "perfect player" asks for (stage.game.botKeys()).
function bot(page) {
  let held = new Set();
  return async () => {
    const want = await page.evaluate(() => { const g = window.relica.stage.game; return g ? { keys: g.botKeys(), tap: !!g.tap } : null; });
    if (!want) { for (const k of held) await page.keyboard.up(k); held.clear(); return false; }
    if (want.tap) { for (const k of want.keys) { await page.keyboard.down(k); await page.keyboard.up(k); } return true; }
    for (const k of held) if (!want.keys.includes(k)) { await page.keyboard.up(k); held.delete(k); }
    for (const k of want.keys) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); }
    return true;
  };
}

// ---------- the clips ----------
const CLIPS = {
  // 24-27 s: lift-off from the Moon, seen from the cabin looking down: the rover shrinks, alone.
  // Played backwards it is the landing at 0-2 s.
  async liftoff(browser) {
    const page = await chapter(browser, 'moon', 'selftest');
    await hide(page, 'all');
    await page.evaluate(async () => {
      const R = window.relica, s = R.stage, { THREE } = T;
      s.lockControls();
      const lm = s.actors.lunarModule;
      await lm.userData.ready;
      for (const a of T.find('astronaut')) a.visible = false;
      const L = lm.position;
      // The rover is parked a little way off, facing the Lunar Module.
      s.controller.place(L.x - 7.5, L.z + 6.5, Math.atan2(7.5, -6.5));
      T.ascent = lm.getObjectByName('ascent');
      s.hero.setEmotion('sad');
      s.hero.lookAt?.(T.ascent);
      T.fly = -1; // seconds since ignition; negative = still on the ground
      T.run.push((dt) => {
        if (T.fly < 0) return;
        T.fly += dt;
        T.ascent.position.y = 1.2 * T.fly + 3.4 * T.fly * T.fly; // slow off the deck, then away
      });
      T.setCam((t, dt, cam) => {
        const a = T.pos(T.ascent), h = s.hero.object.position;
        const out = new THREE.Vector3(h.x - a.x, 0, h.z - a.z).normalize();
        // Just outside the cabin, on the rover's side, looking down at it.
        T.aim(cam, [a.x + out.x * 2.6, a.y + 5.6, a.z + out.z * 2.6], [h.x, h.y + 0.2, h.z], 62);
      });
    });
    await skip(page, 30);
    await record(page, 'liftoff', 105, { each: async (i) => {
      if (i === 8) await page.evaluate(() => { T.fly = 0; window.relica.stage.fx.liftoff?.(T.ascent); });
    } });
    await page.close();
  },

  // 6-7.5 s and 16-16.8 s: the Moon rover drives and hops, slow in one-sixth gravity.
  async hop(browser) {
    const page = await chapter(browser, 'moon', 'selftest');
    await hide(page, 'all');
    await page.evaluate(() => {
      const s = window.relica.stage;
      for (const a of T.find('astronaut')) a.visible = false;
      s.controller.place(34, 6, Math.PI / 2);
      s.unlockControls();
      s.hero.setEmotion('happy');
      // Low, beside and a little ahead, so the hop shows against the black sky.
      T.track([-5.5, 0.9, 3.5], [-5, 1.1, 5.5], 0.7, 46, 5);
    });
    await skip(page, 10);
    await keys(page, ['KeyW']);
    await skip(page, 55); // up to speed
    await record(page, 'hop', 150, { each: async (i) => {
      if (i === 10 || i === 85) await page.keyboard.down('Space');
      if (i === 13 || i === 88) await page.keyboard.up('Space');
    } });
    await keys(page, [], ['KeyW']);
    await page.close();
  },

  // 7.5-9 s and 18.4-19.2 s: Ingenuity lifts off in Mars's thin air. Two cameras on the same flight.
  async heli(browser) {
    // The camera stands still on the ground and tilts up, so the climb shows against the sky.
    for (const [name, at, fov] of [['heli', [2.9, -0.08, 3.5], 44], ['heli_below', [0.75, -0.2, 1.05], 64]]) {
      const page = await chapter(browser, 'sky');
      await hide(page, 'all');
      await page.evaluate(([at, fov]) => {
        const s = window.relica.stage;
        s.controller.place(16, 10, -0.6);
        s.unlockControls();
        s.hero.setEmotion('happy');
        T.tripod = null;
        T.setCam((t, dt, cam) => {
          const h = s.hero.object.position;
          if (!T.tripod) T.tripod = { from: T.rel(...at), look: h.clone() };
          T.tripod.look.lerp(h, 1 - Math.exp(-9 * dt));
          T.aim(cam, T.tripod.from, [T.tripod.look.x, T.tripod.look.y + 0.12, T.tripod.look.z], fov);
        });
      }, [at, fov]);
      await skip(page, 25);
      // The chapter's own opening moves the helicopter after about three seconds, so the clip ends before that.
      await record(page, name, 84, { each: async (i) => { if (i === 6) await page.keyboard.down('Space'); } });
      await page.keyboard.up('Space');
      await page.close();
    }
  },

  // 3-6 s: the game's own model, framed like the NASA photo it cross-fades from.
  async models(browser) {
    let page = await chapter(browser, 'moon', 'selftest');
    await hide(page, 'all');
    await page.evaluate(() => {
      const s = window.relica.stage;
      for (const a of T.find('astronaut')) a.visible = false;
      s.lockControls(); s.controller.place(30, 12, 0.9); s.hero.setEmotion('happy');
      // The right rear wheel and its dust guard, close, as in photo as17-137-20979.
      T.track([-2.3, 0.35, -2.1], [-2.0, 0.45, -1.8], 0.05, 34, 2);
    });
    await skip(page, 25);
    await record(page, 'model_lrv', 45);
    await page.close();

    page = await chapter(browser, 'mars');
    await hide(page, 'all');
    await page.evaluate(() => {
      const s = window.relica.stage;
      s.lockControls(); s.controller.place(30, 40, 0.4); s.hero.setEmotion('curious');
      T.track([3.4, 1.5, 4.6], [2.9, 1.3, 4.1], 0.55, 40, 2);
    });
    await skip(page, 25);
    await record(page, 'model_oppy', 45);
    await page.close();

    page = await chapter(browser, 'sky');
    await hide(page, 'all');
    await page.evaluate(() => {
      const s = window.relica.stage;
      s.lockControls(); s.controller.place(16, 10, -0.6); s.hero.setEmotion('curious');
      // Front three-quarter, slightly above, like the studio photo PIA23882.
      T.track([1.25, 0.45, 1.55], [1.1, 0.4, 1.4], 0.22, 40, 2);
    });
    await skip(page, 25);
    await record(page, 'model_heli', 45);
    await page.close();
  },

  // 9-13 s: the historic photo task. The player lines the frame up and takes the picture.
  // The cross-fade to NASA's original is added in the edit, from the real file.
  async photo(browser) {
    const page = await chapter(browser, 'mars');
    await hide(page, 'hud');
    // The chapter's opening card waits for Enter behind the photo task: keep it out of the picture.
    await page.evaluate(() => { const s = document.createElement('style'); s.textContent = '.card,.bars,.historic-label,.photo-guide{display:none!important}'; document.head.appendChild(s); });
    await page.evaluate(() => { void import('/src/chapters/_historicPhoto.js').then((m) => m.captureHistoricPhoto(window.relica.stage, window.relica, 'PIA20285')); });
    await until(page, () => window.relica.stage.captureState?.phase === 'frame', { label: 'the photo task' });
    await skip(page, 4);
    const state = () => page.evaluate(() => { const c = window.relica.stage.captureState; return { yaw: c.yaw, pitch: c.pitch, phase: c.phase }; });
    let shot = -1;
    await record(page, 'photo', 96, { each: async (i) => {
      const c = await state();
      if (i < 22) return; // hold on the off-centre view first
      const a = c.yaw > 0.03, w = c.pitch > 0.03;
      await keys(page, [...(a ? ['KeyA'] : []), ...(w ? ['KeyS'] : [])], [...(a ? [] : ['KeyA']), ...(w ? [] : ['KeyS'])]);
      if (!a && !w && shot < 0 && c.phase === 'frame') shot = i + 14; // a beat on the green frame, then the shutter
      if (i === shot) { await page.keyboard.down('Space'); await page.keyboard.up('Space'); console.log('  shutter at frame', i + 1); }
    } });
    await page.close();
  },

  // 13-16 s: the dust guard. The puzzle of map pieces, then the rover driving with and without the dust.
  async fender(browser) {
    let page = await chapter(browser, 'moon', 'selftest');
    await hide(page, 'hud');
    await page.evaluate(() => {
      const s = window.relica.stage;
      s.lockControls();
      for (const a of T.find('astronaut')) a.visible = false;
      void import('/src/chapters/_moonGames.js').then((m) => m.fenderRepair(s, window.relica));
    });
    await until(page, () => window.relica.stage.game?.id === 'fenderRepair', { label: 'the dust guard puzzle' });
    await skip(page, 6);
    const play = bot(page);
    await record(page, 'fender', 150, { each: async (i) => { if (i > 10 && i % 9 === 0) await play(); } });
    await page.close();

    page = await chapter(browser, 'moon', 'selftest');
    await hide(page, 'all');
    await page.evaluate(() => {
      const s = window.relica.stage;
      for (const a of T.find('astronaut')) a.visible = false;
      s.controller.place(34, 6, Math.PI / 2);
      s.unlockControls(); s.hero.setEmotion('scared');
      s.dust.shower(true, s.hero);
      // Behind and to the right, where the broken dust guard throws its dust.
      T.track([-3.4, 1.5, -5.2], [-3.0, 1.4, -4.6], 0.5, 48, 3);
    });
    await keys(page, ['KeyW']);
    await skip(page, 60);
    await record(page, 'dust', 110, { each: async (i) => {
      if (i === 50) await page.evaluate(() => { const s = window.relica.stage; s.dust.shower(false); s.hero.setEmotion('happy'); });
    } });
    await keys(page, [], ['KeyW']);
    await page.close();
  },

  // 16.8-17.6 s: Opportunity grinds into a rock (the rock-grinder game), up to what it finds inside.
  async grind(browser) {
    const page = await chapter(browser, 'mars');
    await hide(page, 'hud');
    await page.evaluate(() => {
      const s = window.relica.stage;
      s.lockControls(); s.controller.place(30, 40, 0.4); s.hero.setEmotion('curious');
      T.track([2.2, 1.3, 3.6], [2.0, 1.2, 3.2], 0.5, 42, 6);
      void import('/src/chapters/_marsGames.js').then((m) => m.grindRock(s, window.relica));
    });
    await until(page, () => window.relica.stage.game?.id === 'grindRock', { label: 'the rock grinder' });
    const play = bot(page);
    let done = false, n = 0;
    await record(page, 'grind', 420, { each: async (i) => { if (!done && !(await play())) { done = true; n = i; } } });
    console.log('  grinder finished at frame', n || 'not yet');
    await page.close();
  },

  // 17.6-18.4 s: Viking 1 in its 1976 memory (the game's sepia look), where it sampled the soil.
  async viking(browser) {
    const page = await chapter(browser, 'mars');
    await hide(page, 'all');
    await page.evaluate(async () => {
      const R = window.relica, s = R.stage, { THREE } = T;
      s.lockControls();
      const { createCharacter } = await import('/src/characters/character.js');
      const v = createCharacter('viking');
      const x = 60, z = 70;
      v.object.position.set(x, s.ground(x, z) + v.half[1], z);
      v.object.rotation.y = 0.5;
      R.scene.add(v.object);
      await v.ready;
      v.setEmotion('happy');
      T.run.push((dt) => v.update(dt));
      document.body.classList.add('flashback'); // the game's own look for Viking's memory
      // The Mars rover is far away in this memory: move it out of sight.
      s.hero.object.visible = false;
      const p = v.object.position;
      // Low and in front of the sampler arm, slowly circling in.
      T.setCam((t, dt, cam) => {
        const u = T.ease(t / 2.5), a = 0.55 + u * 0.3, d = 3.6 - u * 0.4;
        T.aim(cam, [p.x + Math.sin(a) * d, p.y + 0.9, p.z + Math.cos(a) * d], [p.x, p.y + 0.2, p.z], 44);
      });
    });
    await skip(page, 30);
    await record(page, 'viking', 50);
    await page.close();
  },

  // 19.2-20 s: Pioneer 10 in front of Jupiter, from the game's own fly-by scene.
  async pioneer(browser) {
    const page = await chapter(browser, 'epilogue');
    await hide(page, 'all');
    // The scene opens on its chapter card; Enter moves on to Jupiter.
    for (let i = 0; i < 80 && !(await page.evaluate(() => !!window.relica.stage.photoState)); i++) {
      await page.keyboard.down('Enter'); await page.keyboard.up('Enter'); await skip(page, 3);
    }
    await page.evaluate(() => {
      const R = window.relica, s = R.stage, { THREE } = T, st = s.photoState, h = s.hero.object;
      h.rotation.y = st.targetYaw + 0.35;
      s.hero.setEmotion('curious');
      // Jupiter is 80 m off in this direction; put the camera behind Pioneer so the planet fills the frame.
      const j = new THREE.Vector3(Math.sin(st.targetYaw) * 80, h.position.y + Math.tan(st.targetPitch) * 80, Math.cos(st.targetYaw) * 80);
      const dir = j.clone().sub(h.position).normalize(), side = new THREE.Vector3(dir.z, 0, -dir.x);
      T.setCam((t, dt, cam) => {
        const u = T.ease(t / 3);
        const from = h.position.clone().addScaledVector(dir, -7.5 + u * 0.8).addScaledVector(side, 2.6 - u * 0.5).add(new THREE.Vector3(0, -0.9, 0));
        T.aim(cam, from, h.position.clone().lerp(j, 0.09), 21);
      });
    });
    await skip(page, 10);
    await record(page, 'pioneer', 50);
    await page.close();
  },

  // 20-24 s: faces. Opportunity in the storm, Ingenuity grounded after her last flight, the Moon rover left behind.
  async faces(browser) {
    let page = await chapter(browser, 'mars');
    await hide(page, 'all');
    await page.evaluate(() => {
      const s = window.relica.stage;
      s.lockControls(); s.controller.place(30, 40, 0.4);
      s.storm.setLevel(0.62); s.hero.setEmotion('scared');
      T.track([1.5, 1.35, 2.5], [1.2, 1.3, 2.2], 0.95, 34, 2.5);
    });
    await skip(page, 40);
    await record(page, 'face_oppy', 55, { each: async (i) => { if (i === 26) await page.evaluate(() => window.relica.stage.hero.setEmotion('sad')); } });
    await page.close();

    page = await chapter(browser, 'sky');
    await hide(page, 'all');
    await page.evaluate(() => {
      const s = window.relica.stage;
      s.lockControls(); s.controller.place(-45, 55, 0.3);
      s.hero.breakBlade?.(); s.hero.setEmotion('sad');
      T.track([0.55, 0.3, 1.05], [0.45, 0.28, 0.9], 0.12, 36, 2.5);
    });
    await skip(page, 70); // the blade tips have landed
    await record(page, 'face_heli', 55);
    await page.close();

    page = await chapter(browser, 'moon', 'selftest');
    await hide(page, 'all');
    await page.evaluate(() => {
      const s = window.relica.stage;
      for (const a of T.find('astronaut')) a.visible = false;
      s.lockControls(); s.controller.place(30, 12, 0.9);
      s.hero.setEmotion('curious');
      // It looks up at where the cabin went.
      const up = T.rel(0.6, 30, 12);
      s.hero.lookAt?.(up);
      T.track([-1.5, 1.0, 2.9], [-1.3, 1.05, 2.6], 0.75, 34, 2.5);
    });
    await skip(page, 40);
    await record(page, 'face_lrv', 55, { each: async (i) => { if (i === 16) await page.evaluate(() => window.relica.stage.hero.setEmotion('sad')); } });
    await page.close();
  },
};

const want = process.argv.slice(2);
const names = want.length ? want : Object.keys(CLIPS);
const browser = await launch();
try {
  for (const name of names) {
    if (!CLIPS[name]) { console.warn('no clip called', name, '· known:', Object.keys(CLIPS).join(', ')); continue; }
    console.log('clip', name);
    try { await CLIPS[name](browser); } catch (err) { console.error('  FAILED:', err.message); }
  }
} finally {
  await browser.close();
}
