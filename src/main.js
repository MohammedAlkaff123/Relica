// Boot file. Wires every system together and runs the frame loop.
// Owner: Set A. Set C's hooks (main menu, settings, save, language) are marked "Set C".
//
// src/boot.js shows the landing page and the loading screen, then calls startGame(). A normal start
// opens the main menu; ?chapter=, ?jump= and ?test still go straight into the game as before.
import { createGame } from './core/game.js';
import { createInput } from './core/input.js';
import * as physics from './core/physics.js';
import { createChapters } from './core/chapters.js';
import { createFollowCamera } from './core/followCamera.js';
import { loadJSON } from './core/content.js';
import { createQuality } from './core/quality.js';
import { QUALITY_DATA } from './world/quality.js';
import { fadeTo } from './core/fade.js';
import { createCinematics } from './cinematics/cinematic.js';
import { createPrompt } from './ui/prompt.js';
import { createNavigation } from './ui/navigation.js';
import { createHud } from './ui/hud.js';
import { createCard } from './ui/card.js';
import { createDialogue } from './ui/dialogue.js';
import { createMemory } from './ui/memory.js';
import { createAudio } from './audio/audio.js';
import { createTweak } from './dev/tweak.js';
import { createShell } from './ui/menu.js';
import { createMenuScene } from './ui/menuScene.js';
import { installLocalizer } from './ui/localize.js';
import { prefs } from './ui/prefs.js';
import { save } from './ui/save.js';
import { found } from './ui/discoveries.js';

import opening from './chapters/opening.js';
import moon from './chapters/moon.js';
import mars from './chapters/mars.js';
import sky from './chapters/sky.js';
import epilogue from './chapters/epilogue.js';

const canvas = document.getElementById('view');
const root = document.getElementById('ui');

export async function startGame({ onStep = () => {} } = {}) {
  onStep('data');
  const [facts, tuning, qualityData] = await Promise.all([
    loadJSON('content/facts.json'),
    loadJSON('content/tuning.json'),
    Promise.resolve(QUALITY_DATA),
  ]);
  onStep('physics');
  await physics.initPhysics();

  const game = createGame(canvas);
  // Graphics quality (Low / Medium / High): applied before the first world loads.
  const quality = createQuality({ renderer: game.renderer, scene: game.scene, data: qualityData });
  const input = createInput();
  const prompt = createPrompt(input);
  const audio = createAudio();
  // Set C: the player's sound levels from Settings, now and whenever they change.
  const applySound = (p) => audio.setVolumes(p.volume, p.muted);
  applySound(prefs.get());
  prefs.subscribe(applySound);
  const characters = new Map(); // id -> character currently on stage

  const hud = createHud(root, facts);
  const navigation = createNavigation(root, game.camera);
  const card = createCard(root, prompt);
  const followCam = createFollowCamera(game.camera, tuning);
  const dialogue = await createDialogue(root, prompt, audio, (id) => characters.get(id), followCam);
  const memory = await createMemory(root, prompt);
  const cinematics = createCinematics({ camera: game.camera, followCam, tuning, root, audio, getCharacter: (id) => characters.get(id) });
  const tweak = createTweak(tuning);
  installLocalizer(root);
  onStep('interface');

  // Everything a chapter may use. See README "The contracts".
  const ctx = {
    scene: game.scene, camera: game.camera, renderer: game.renderer,
    input, physics, facts, tuning, characters,
    hud, card, dialogue, memory, followCam, cinematics, audio, navigation, quality,
  };

  const list = [opening, moon, mars, sky, epilogue];
  const chapters = createChapters(list, ctx, () => {
    // Called when we jump chapters: close anything that is waiting on the player.
    prompt.cancel();
    cinematics.cancel();
    fadeTo(0, 0);
    dialogue.hide(); memory.hide(); card.hide();
    hud.setObjective('');
    hud.setHold?.(null);
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

  // Pause. ctx.setPaused is the contract: it stops game time, physics, chapters and the camera.
  // Set C's menu (src/ui/menu.js) draws the pause screen and calls ctx.setPaused; P and the pause button open it.
  ctx.paused = false;
  ctx.setPaused = (on) => {
    ctx.paused = !!on;
    audio.setPaused(ctx.paused);
  };

  // Set C: main menu, pause menu and settings. Starting a chapter from the menu saves a checkpoint.
  const ids = list.map((c) => c.id);
  const params = new URLSearchParams(location.search);
  const deepLink = params.has('chapter') || params.has('jump') || params.has('test');
  let playing = false;
  const shell = createShell({
    root: document.getElementById('shell'),
    ctx,
    chapterIds: ids,
    onPlay(index, { restore }) {
      // Continue: bring back the photos and discoveries collected before this checkpoint.
      memory.collected.length = 0;
      found.length = 0;
      if (restore) {
        memory.collected.push(...restore.memories);
        found.push(...restore.discoveries);
      }
      playing = true;
      shell.setInGame(true);
      chapters.go(index);
    },
    onRestart() { chapters.restart(); },
    onQuit() { stopToMenu(); },
  });
  ctx.shell = shell;
  // Every chapter start is a checkpoint (not in the self-test or a deep link, which are for the team).
  const goChapter = chapters.go;
  chapters.go = (i, opts) => {
    goChapter(i, opts);
    if (!deepLink) save.write({ chapter: chapters.index, id: ids[chapters.index], memories: memory.collected.slice(), discoveries: found.slice() });
  };
  ctx.goto = chapters.go;
  ctx.next = () => chapters.go(chapters.index + 1);
  function stopToMenu() {
    playing = false;
    shell.setInGame(false);
    chapters.stop();
    showMenu();
  }
  function showMenu() {
    shell.showMain(() => createMenuScene(ctx));
  }

  // Leaving the tab pauses the game, so a demo is never found mid-storm with the rover gone.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !location.search.includes('test') && playing && !ctx.paused) shell.pause(true);
  });

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
    // Pause: P (handled by the menu), the pause button, or the tab being hidden. The picture stays, but game
    // time, physics, chapters and the camera stop. A menu can call ctx.setPaused(true / false) and read ctx.paused.
    if (shell.inMainMenu) { shell.menuScene?.update(frameDt); input.endFrame(); return; }
    if (ctx.paused) { input.endFrame(); return; }
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
    navigation.update(ctx.stage?.hero.object, ctx.stage?.alive && ctx.stage.controls && followCam.enabled);
    input.endFrame();
  }

  // ?chapter=3 (same numbers as the keys) or ?chapter=mars starts there. &jump=storm also works.
  window.relica = ctx; // handy in the browser console
  ctx.chapters = chapters;
  onStep('ready');
  if (deepLink) {
    const want = params.get('chapter');
    let first = 0;
    if (want) first = /^\d+$/.test(want) ? Number(want) - 1 : Math.max(0, chapters.find(want));
    playing = true;
    shell.setInGame(true);
    goChapter(first, { jump: params.get('jump') ?? undefined });
    if (params.has('test')) import('./core/selftest.js').then((t) => t.runSelfTest(ctx)).catch((err) => console.error('self-test failed to load', err));
  } else {
    showMenu();
  }
  return ctx;
}
