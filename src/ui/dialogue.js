// Dialogue: the line in the player's language, the other language underneath if they asked for it. Owner: Set C.
//
//   await dialogue.play('ch2_viking_call')                 the player presses Enter for each line
//   await dialogue.play('ch2_viking_call', { auto: true }) lines advance on their own (cutscenes, the video)
//
// Lines live in content/dialogue.json:
//   "ch2_viking_call": [ { "who": "viking", "emotion": "sleepy", "ar": "...", "en": "..." } ]
// The text types out letter by letter. Enter while it is typing shows the whole line; Enter again continues.
// In auto mode Enter skips ahead to the next line. A line can set its own hold time with "hold": seconds.
// While a line is up, the speaker (if on stage) shows the emotion, sends signal rings, and its voice
// carries the same emotion (audio.speak(who, text, emotion)).
import { el } from './dom.js';
import { loadJSON } from '../core/content.js';
import { CAST } from '../characters/character.js';
import { prefs } from './prefs.js';
import { t } from './i18n.js';
import { keycap } from './keys.js';

const LETTERS_PER_SECOND = 32;
// How long a finished line stays up in auto mode: a base plus time to read it.
const holdFor = (line, voiceSeconds = 0) =>
  line.hold ?? Math.max(2.2, voiceSeconds + 0.6, 1.2 + Math.max(line.ar.length, line.en.length) * 0.055);

// Split into what a reader sees as single letters, so Arabic marks stay on their letter while typing.
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('ar', { granularity: 'grapheme' }) : null;
const letters = (text) => (segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text));

const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

// Speakers who are not machines (the crew beside the rover) and so are not in CAST.
const PEOPLE = { crew: { name: 'Crew', ar: 'الطاقم' } };

export async function createDialogue(root, prompt, audio, getCharacter, followCam) {
  const script = await loadJSON('content/dialogue.json');
  const box = el('div', 'dialogue hidden', root);
  const who = el('div', 'who', box);
  const whoName = el('span', 'who-name', who);
  const main = el('div', 'line-main', box);
  const second = el('div', 'line-second', box);
  const foot = el('div', 'dialogue-foot', box);
  const next = el('button', 'next-btn', foot);
  next.type = 'button';
  next.append(keycap('Enter'));
  const nextWord = el('span', '', next);
  // A click on the button is the same as Enter: the window's click already continues, so nothing more is needed.

  let generation = 0;
  let typing = null; // the running typewriter, so Enter can finish it
  let current = null;
  let auto = false;

  function languages() {
    const first = prefs.language;
    return { first, other: first === 'ar' ? 'en' : 'ar' };
  }
  function drawStatic() {
    const { first, other } = languages();
    main.lang = first;
    main.dir = first === 'ar' ? 'rtl' : 'ltr';
    second.lang = other;
    second.dir = other === 'ar' ? 'rtl' : 'ltr';
    second.classList.toggle('hidden', !prefs.get().secondary);
    nextWord.textContent = auto ? t('hud.skip') : t('hud.next');
    if (current) {
      const cast = CAST[current.who] ?? PEOPLE[current.who];
      whoName.textContent = first === 'ar' ? cast?.ar ?? current.who : cast?.name ?? current.who;
    }
  }
  prefs.subscribe(() => {
    drawStatic();
    if (current && !typing) { main.textContent = current[languages().first]; second.textContent = current[languages().other]; }
  });

  // Types both lines together, so the two languages finish at the same moment.
  function type(line) {
    const { first, other } = languages();
    const a = letters(line[first]);
    const e = letters(line[other]);
    const total = Math.max(a.length, 1);
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
      main.textContent = a.slice(0, Math.ceil(a.length * k)).join('');
      second.textContent = e.slice(0, Math.ceil(e.length * k)).join('');
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
    // Auto lines wait in game time, so a pause menu does not let the cutscene run on.
    let left = seconds;
    const timed = new Promise((resolve) => {
      let last = performance.now();
      const id = setInterval(() => {
        const now = performance.now();
        if (!window.relica?.paused) left -= (now - last) / 1000;
        last = now;
        if (left <= 0) { clearInterval(id); resolve('time'); }
      }, 50);
      press.then(() => clearInterval(id));
    });
    const result = await Promise.race([press, timed]);
    if (result === 'time') prompt.cancel(); // let go of our own wait, nobody else is waiting
    return result;
  }

  return {
    async play(id, { auto: isAuto = false, camera = true, onLine } = {}) {
      const token = ++generation;
      const lines = script[id];
      if (!lines) { console.warn(`dialogue "${id}" is missing from content/dialogue.json`); return; }
      auto = isAuto;
      for (const [index, line] of lines.entries()) {
        if (token !== generation) break;
        const speaker = getCharacter(line.who);
        onLine?.(line, index);
        if (camera && followCam?.enabled && speaker) followCam.talkTo(speaker.object);
        current = line;
        box.dataset.who = line.who;
        drawStatic();
        box.classList.remove('hidden');
        if (speaker) { if (line.emotion) speaker.setEmotion(line.emotion); speaker.talk(true); }
        // The machine "speaks" this line in its own voice, with the line's emotion; cut if the player moves on.
        const voice = audio.speak ? audio.speak(line.who, line.en, line.emotion) : (audio.beep(line.who), null);

        // 1. Type the line. Enter shows it all at once.
        const tw = type(line);
        let result = await Promise.race([
          tw.finished.then(() => 'typed'),
          waitForPlayer().then((r) => { tw.stop(); return r; }),
        ]);
        if (result === 'typed') prompt.cancel(); // typing ended first: drop the wait we started

        // 2. Wait for Enter, or for the hold time in auto mode.
        // A line with "cut": true ends the moment it is typed: the speaker is cut off mid-word.
        if (line.cut && result !== 'cancel') result = 'time';
        else if (result !== 'cancel') result = await waitForPlayer(isAuto ? holdFor(line, voice?.duration) : undefined);
        if (speaker) speaker.talk(false);
        if (voice) voice.stop();
        if (result === 'cancel') break;
      }
      if (token === generation) {
        if (typing) typing.stop();
        current = null;
        box.classList.add('hidden');
        if (camera) followCam?.release();
      }
    },
    hide() {
      generation++; followCam?.release();
      if (typing) typing.stop();
      current = null;
      box.classList.add('hidden');
    },
  };
}
