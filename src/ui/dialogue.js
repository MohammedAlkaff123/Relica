// Dialogue bubbles: Arabic line (right to left) with the English subtitle underneath. Owner: Set C.
//
//   await dialogue.play('ch2_viking_call')                 the player presses Enter for each line
//   await dialogue.play('ch2_viking_call', { auto: true }) lines advance on their own (cutscenes, the video)
//
// Lines live in content/dialogue.json:
//   "ch2_viking_call": [ { "who": "viking", "emotion": "sleepy", "ar": "...", "en": "..." } ]
// The text types out letter by letter. Enter while it is typing shows the whole line; Enter again continues.
// In auto mode Enter skips ahead to the next line. A line can set its own hold time with "hold": seconds.
// While a line is up, the speaker (if on stage) shows the emotion and sends signal rings.
//
//   dialogue.play('ch1_intro', { ambient: true })   a passing remark: a small caption low on the screen.
//       The player keeps driving; nothing waits for Enter and the camera is left alone.
// A line with "cut": true vanishes the moment it finishes typing (the speaker is cut off mid-word).
// Speakers who are not machines (the crew) are named in PEOPLE below.
import { el } from './dom.js';
import { loadJSON } from '../core/content.js';
import { CAST } from '../characters/character.js';

const LETTERS_PER_SECOND = 32;
// How long a finished line stays up in auto mode: a base plus time to read it.
const holdFor = (line, voiceSeconds = 0) =>
  line.hold ?? Math.max(2.2, voiceSeconds + 0.6, 1.2 + Math.max(line.ar.length, line.en.length) * 0.055);

// Split into what a reader sees as single letters, so Arabic marks stay on their letter while typing.
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('ar', { granularity: 'grapheme' }) : null;
const letters = (text) => (segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text));

// Speakers with no character model.
const PEOPLE = { crew: { name: 'Crew', ar: 'الطاقم' } };

const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

export async function createDialogue(root, prompt, audio, getCharacter, followCam) {
  const script = await loadJSON('content/dialogue.json');
  // Two boxes with the same parts: the full dialogue box, and the small caption for passing remarks.
  // The caption has its own class so nothing mistakes it for a box that waits for Enter.
  function makeBox(className) {
    const box = el('div', `${className} hidden`, root);
    const who = el('div', 'who', box);
    const whoEn = el('span', '', who);
    const whoAr = el('span', 'who-ar', who);
    whoAr.lang = 'ar';
    const ar = el('div', 'ar', box);
    ar.dir = 'rtl';
    ar.lang = 'ar';
    const en = el('div', 'en', box);
    return { box, whoEn, whoAr, ar, en };
  }
  const full = makeBox('dialogue');
  const caption = makeBox('caption');
  const hint = el('div', 'hint', full.box, 'Enter to continue');

  let generation = 0;
  let typing = null; // the running typewriter, so Enter can finish it

  // Types both lines together, so the Arabic and the English finish at the same moment.
  function type(line, { ar, en }) {
    const a = letters(line.ar);
    const e = letters(line.en);
    const total = Math.max(a.length, e.length, 1);
    let shown = 0;
    let done;
    const finished = new Promise((r) => { done = r; });
    const timer = setInterval(() => {
      shown = Math.min(total, shown + 1);
      draw();
      if (shown >= total) stop();
    }, 1000 / LETTERS_PER_SECOND);
    function draw() {
      const k = shown / total;
      ar.textContent = a.slice(0, Math.ceil(a.length * k)).join('');
      en.textContent = e.slice(0, Math.ceil(e.length * k)).join('');
    }
    function stop() {
      clearInterval(timer);
      shown = total;
      draw();
      typing = null;
      done();
    }
    draw();
    typing = { stop, finished };
    return typing;
  }

  // Resolves with 'enter', 'cancel' (the chapter was left) or 'time' (auto mode only).
  async function waitForPlayer(seconds) {
    const press = prompt.wait().then((ok) => (ok ? 'enter' : 'cancel'));
    if (seconds === undefined) return press;
    const result = await Promise.race([press, sleep(seconds).then(() => 'time')]);
    if (result === 'time') prompt.cancel(); // let go of our own wait, nobody else is waiting
    return result;
  }

  return {
    async play(id, { auto = false, ambient = false, camera = true, onLine } = {}) {
      const token = ++generation;
      if (typing) typing.stop(); // a new conversation replaces whatever was still typing
      const view = ambient ? caption : full;
      (ambient ? full : caption).box.classList.add('hidden');
      const { box, whoEn, whoAr } = view;
      const lines = script[id];
      if (!lines) { console.warn(`dialogue "${id}" is missing from content/dialogue.json`); return; }
      hint.textContent = auto ? 'Enter to skip' : 'Enter to continue';
      for (const [index, line] of lines.entries()) {
        if (token !== generation) break;
        const speaker = getCharacter(line.who);
        const cast = CAST[line.who] ?? PEOPLE[line.who];
        onLine?.(line, index);
        if (camera && !ambient && followCam?.enabled && speaker) followCam.talkTo(speaker.object);
        box.dataset.who = line.who;
        whoEn.textContent = cast?.name ?? line.who;
        whoAr.textContent = cast?.ar ?? '';
        box.classList.remove('hidden');
        if (speaker) { if (line.emotion) speaker.setEmotion(line.emotion); speaker.talk(true); }
        // The machine "speaks" this line in its own voice; the sound is cut if the player moves on early.
        const voice = audio.speak ? audio.speak(line.who, line.en) : (audio.beep(line.who), null);

        // 1. Type the line. Enter shows it all at once.
        const t = type(line, view);
        if (ambient) {
          // A passing remark: types, stays long enough to read, and goes. No key is needed.
          await t.finished;
          await sleep(line.cut ? 0.1 : holdFor(line, voice?.duration));
          if (speaker) speaker.talk(false);
          if (voice) voice.stop();
          if (token !== generation) break;
          continue;
        }
        let result = await Promise.race([
          t.finished.then(() => 'typed'),
          waitForPlayer().then((r) => { t.stop(); return r; }),
        ]);
        if (result === 'typed') prompt.cancel(); // typing ended first: drop the wait we started

        // 2. Wait for Enter, or for the hold time in auto mode.
        if (line.cut && result !== 'cancel') result = 'time';
        else if (result !== 'cancel') result = await waitForPlayer(auto ? holdFor(line, voice?.duration) : undefined);
        if (speaker) speaker.talk(false);
        if (voice) voice.stop();
        if (result === 'cancel') break;
      }
      if (token === generation) {
        if (typing) typing.stop();
        box.classList.add('hidden');
        if (camera && !ambient) followCam?.release();
      }
    },
    hide() {
      generation++; followCam?.release();
      if (typing) typing.stop();
      full.box.classList.add('hidden');
      caption.box.classList.add('hidden');
    },
  };
}
