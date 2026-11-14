// Boot file. Wires every system together and runs the frame loop.
// Owner: Set A. Other sets should not need to edit this file.
import { createGame } from './core/game.js';
import { createInput } from './core/input.js';
import * as physics from './core/physics.js';
import { createChapters } from './core/chapters.js';
import { createFollowCamera } from './core/followCamera.js';
import { loadJSON } from './core/content.js';
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
    scene: game.scene, camera: game.camera,
    input, physics, facts, tuning, characters,
    hud, card, dialogue, memory, followCam, cinematics, audio,
  };

  const list = [opening, moon, mars, sky, epilogue];
  const chapters = createChapters(list, ctx, () => {
    // Called when we jump chapters: close anything that is waiting on the player.
    prompt.cancel();
    cinematics.cancel();
    dialogue.hide(); memory.hide(); card.hide();
    hud.setObjective('');
  });
  ctx.next = chapters.next;
  ctx.goto = chapters.go;

  game.start((dt) => {
    if (input.pressed('Backquote')) tweak.toggle();
    if (input.pressed('Escape')) cinematics.cancel(); // skip a cutscene
    for (let i = 0; i < list.length; i++) {
      if (input.pressed('Digit' + (i + 1))) chapters.go(i); // chapter select for the pitch
    }
    prompt.update();
    chapters.update(dt);
    physics.step(dt);
    followCam.update(dt);
    cinematics.update(dt);
    input.endFrame();
  });

  chapters.go(0);
  window.relica = ctx; // handy in the browser console
}

boot().catch((err) => {
  console.error(err);
  root.style.padding = '24px';
  root.textContent = 'Relica failed to start: ' + err.message;
});
