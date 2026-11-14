// Full-screen title card for chapters and the ending. Owner: Set C.
//
//   await card.show('The Moon', 'Taurus–Littrow valley · December 1972')     a plain card
//   await card.show({ title: 'The Moon', mission: 'Apollo 17 · Lunar Roving Vehicle',
//                     place: 'Taurus–Littrow valley', dates: 'December 1972' })
//   await card.chapter('moon')       the same, with the text from content/chapters.json
import { el } from './dom.js';
import { loadJSON } from '../core/content.js';

export function createCard(root, prompt) {
  const box = el('div', 'card hidden', root);
  const mission = el('div', 'mission-name', box);
  const title = el('h1', '', box);
  const titleAr = el('div', 'title-ar', box);
  titleAr.lang = 'ar';
  titleAr.dir = 'rtl';
  const sub = el('p', '', box);
  const facts = el('div', 'card-facts', box);
  el('div', 'hint', box, 'Press Enter');

  // Chapter texts load in the background; card.chapter() waits for them if needed.
  const chapters = loadJSON('content/chapters.json').catch((err) => {
    console.warn('content/chapters.json could not be loaded', err);
    return {};
  });

  function fill(c) {
    title.textContent = c.title ?? '';
    titleAr.textContent = c.titleAr ?? '';
    mission.textContent = c.mission ?? '';
    sub.textContent = c.sub ?? '';
    facts.textContent = '';
    for (const part of [c.place, c.dates]) if (part) el('span', '', facts, part);
    for (const node of [titleAr, mission, sub, facts]) node.classList.toggle('hidden', !node.textContent);
  }

  async function open(c) {
    fill(c);
    box.classList.remove('hidden');
    await prompt.wait();
    box.classList.add('hidden');
  }

  return {
    async show(heading, line = '') {
      await open(typeof heading === 'object' ? heading : { title: heading, sub: line });
    },
    async chapter(id) {
      const c = (await chapters)[id];
      if (!c) { console.warn(`chapter "${id}" is missing from content/chapters.json`); return; }
      await open({ title: c.title.en, titleAr: c.title.ar, mission: c.mission?.en, place: c.place?.en, dates: c.dates?.en, sub: c.sub?.en });
    },
    hide() { box.classList.add('hidden'); },
  };
}
