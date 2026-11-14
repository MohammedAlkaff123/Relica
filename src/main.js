// Boot file. Wires every system together and runs the frame loop.
// Owner: Set A. Other sets should not need to edit this file.
import { createGame } from './core/game.js';
import { createInput } from './core/input.js';
import * as physics from './core/physics.js';
import { createChapters } from './core/chapters.js';
import { createFollowCamera } from './core/followCamera.js';
import { loadJSON } from './core/content.js';
import { fadeTo } from './core/fade.js';
import { createCinematics } from './cinematics/cinematic.js';
import { createPrompt } from './ui/prompt.js';
import { createHud } from './ui/hud.js';
import { createCard } from './ui/card.js';
import { createDialogue } from './ui/dialogue.js';
import { createMemory } from './ui/memory.js';
import { createAudio } from './audio/audio.js';
import { createTweak } from './dev/tweak.js';

import opening from './chapters/opening.js';
import moon from './chapters/moon.js';
import mars from './chapters/mars.js';
import sky from './chapters/sky.js';
import epilogue from './chapters/epilogue.js';

const canvas = document.getElementById('view');
const root = document.getElementById('ui');

async function boot() {
  const [facts, tuning] = await Promise.all([
    loadJSON('content/facts.json'),
    loadJSON('content/tuning.json'),
  ]);
  await physics.initPhysics();

  const game = createGame(canvas);
  const input = createInput();
  const prompt = createPrompt(input);
  const audio = createAudio();
  const characters = new Map(); // id -> character currently on stage

  const hud = createHud(root, facts);
  const card = createCard(root, prompt);
  const dialogue = await createDialogue(root, prompt, audio, (id) => characters.get(id));
  const memory = await createMemory(root, prompt);
  const followCam = createFollowCamera(game.camera, tuning);
  const cinematics = createCinematics({ camera: game.camera, followCam, tuning, root });
  const tweak = createTweak(tuning);

  // Everything a chapter may use. See README "The contracts".
  const ctx = {
    scene: game.scene, camera: game.camera, renderer: game.renderer,
    input, physics, facts, tuning, characters,
    hud, card, dialogue, memory, followCam, cinematics, audio,
  };

  const list = [opening, moon, mars, sky, epilogue];
  const chapters = createChapters(list, ctx, () => {
    // Called when we jump chapters: close anything that is waiting on the player.
    prompt.cancel();
    cinematics.cancel();
    fadeTo(0, 0);
    dialogue.hide(); memory.hide(); card.hide();
    hud.setObjective('');
  });
  ctx.next = chapters.next;
  ctx.goto = chapters.go;

  // Pitch mode: keys 6-9 jump straight to a moment inside a chapter (TASKS.md A-11).
  const JUMPS = {
    Digit6: ['moon', 'fender'],
    Digit7: ['mars', 'viking'],
    Digit8: ['mars', 'storm'],
    Digit9: ['sky', 'flight72'],
  };

  // ?fps in the address shows frames per second and the slowest frame of the last second (TASKS.md A-12).
  let fps = null;
  if (new URLSearchParams(location.search).has('fps')) {
    const box = document.createElement('div');
    Object.assign(box.style, { position: 'fixed', right: '8px', bottom: '8px', font: '12px monospace', color: '#9f9', background: '#000a', padding: '4px 6px', zIndex: 10 });
    document.body.appendChild(box);
    fps = { box, frames: 0, worst: 0, last: performance.now(), prev: performance.now() };
  }

  // ?test runs the self-test (src/core/selftest.js). &speed=4 runs the game 4 times faster for it.
  const speed = Math.max(1, Math.min(8, Number(new URLSearchParams(location.search).get('speed')) || 1));
  ctx.clock = 0; // game seconds since the page opened

  game.start((frameDt) => {
    if (fps) {
      const now = performance.now();
      fps.frames++;
      fps.worst = Math.max(fps.worst, now - fps.prev);
      fps.prev = now;
      if (now - fps.last >= 1000) {
        fps.box.textContent = `${Math.round((fps.frames * 1000) / (now - fps.last))} fps · slowest ${fps.worst.toFixed(0)} ms · ${game.renderer.info.render.calls} draw calls`;
        fps.frames = 0; fps.worst = 0; fps.last = now;
      }
    }
    for (let step = 0; step < speed; step++) tick(frameDt);
  });

  function tick(dt) {
    ctx.clock += dt;
    if (input.pressed('Backquote')) tweak.toggle();
    if (input.pressed('Escape')) cinematics.cancel(); // skip a cutscene
    for (let i = 0; i < list.length; i++) {
      if (input.pressed('Digit' + (i + 1))) chapters.go(i); // chapter select for the pitch
    }
    for (const [code, [id, jump]] of Object.entries(JUMPS)) {
      if (input.pressed(code)) chapters.go(chapters.find(id), { jump });
    }
    if (input.pressed('KeyR')) chapters.restart();
    prompt.update();
    chapters.update(dt);
    physics.step(dt);
    followCam.update(dt);
    cinematics.update(dt);
    input.endFrame();
  }

  // ?chapter=3 (same numbers as the keys) or ?chapter=mars starts there. &jump=storm also works.
  const params = new URLSearchParams(location.search);
  const want = params.get('chapter');
  let first = 0;
  if (want) first = /^\d+$/.test(want) ? Number(want) - 1 : Math.max(0, chapters.find(want));
  chapters.go(first, { jump: params.get('jump') ?? undefined });
  window.relica = ctx; // handy in the browser console
  ctx.chapters = chapters;
  if (params.has('test')) import('./core/selftest.js').then((t) => t.runSelfTest(ctx)).catch((err) => console.error('self-test failed to load', err));
}

boot().catch((err) => {
  console.error(err);
  root.style.padding = '24px';
  root.textContent = 'Relica failed to start: ' + err.message;
});
