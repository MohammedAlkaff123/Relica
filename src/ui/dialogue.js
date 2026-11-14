// Dialogue bubbles: Arabic line (right to left) with the English subtitle underneath. Owner: Set C.
//
//   await dialogue.play('ch2_viking_call')
//
// Lines live in content/dialogue.json:
//   "ch2_viking_call": [ { "who": "viking", "emotion": "sleepy", "ar": "...", "en": "..." } ]
// While a line is up, the speaker (if on stage) shows the emotion and sends signal rings.
// TODO Set C: typewriter effect, speaker portrait, a different beep per character.
import { el } from './dom.js';
import { loadJSON } from '../core/content.js';
import { CAST } from '../characters/character.js';

export async function createDialogue(root, prompt, audio, getCharacter) {
  const script = await loadJSON('content/dialogue.json');
  const box = el('div', 'dialogue hidden', root);
  const who = el('div', 'who', box);
  const ar = el('div', 'ar', box);
  ar.dir = 'rtl';
  ar.lang = 'ar';
  const en = el('div', 'en', box);
  el('div', 'hint', box, 'Enter to continue');

  return {
    async play(id) {
      const lines = script[id];
      if (!lines) { console.warn(`dialogue "${id}" is missing from content/dialogue.json`); return; }
      for (const line of lines) {
        const speaker = getCharacter(line.who);
        who.textContent = CAST[line.who]?.name ?? line.who;
        ar.textContent = line.ar;
        en.textContent = line.en;
        box.classList.remove('hidden');
        if (speaker) { if (line.emotion) speaker.setEmotion(line.emotion); speaker.talk(true); }
        audio.beep(line.who);
        const ok = await prompt.wait();
        if (speaker) speaker.talk(false);
        if (!ok) break;
      }
      box.classList.add('hidden');
    },
    hide() { box.classList.add('hidden'); },
  };
}
