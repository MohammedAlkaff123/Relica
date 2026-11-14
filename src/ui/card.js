// Full-screen title card for chapters and the ending. Owner: Set C.
//
//   await card.show('The Moon', 'Taurus–Littrow valley · December 1972')     a plain card
//   await card.show({ title: 'The Moon', mission: 'Apollo 17 · Lunar Roving Vehicle',
//                     place: 'Taurus–Littrow valley', dates: 'December 1972' })
//   await card.chapter('moon')       the same, with the text from content/chapters.json
//   await card.title()               title screen        (text in content/credits.json)
//   await card.ending()              the final card: "The conversations are imagined..."
//   await card.credits()             credits, with only the NASA photos the game shows
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
  facts.dir = 'auto'; // Arabic lines here read right to left, so the full stop lands in the right place
  el('div', 'hint', box, 'Press Enter');

  // Credits roll: its own scrolling panel.
  const rollBox = el('div', 'credits hidden', root);
  const roll = el('div', 'roll', rollBox);
  el('div', 'hint', rollBox, 'Press Enter');

  const texts = loadJSON('content/credits.json').catch((err) => {
    console.warn('content/credits.json could not be loaded', err);
    return {};
  });

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

  // Only the newest card may hide the box, so a card opened over another never hides the new one.
  let shown = 0;
  async function open(c) {
    const me = ++shown;
    fill(c);
    box.classList.remove('hidden');
    await prompt.wait();
    if (me === shown) box.classList.add('hidden');
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
    // Title screen: the game's name, its line, and "Press Enter to wake up".
    async title() {
      const t = (await texts).title;
      if (!t) return;
      box.classList.add('title-screen');
      await open({ title: t.name, titleAr: t.line.ar, sub: t.line.en, place: t.start.en });
      box.classList.remove('title-screen');
    },
    // The final card, with the line that says what is imagined and what is real.
    async ending() {
      const e = (await texts).ending;
      if (!e) return;
      box.classList.add('ending');
      await open({ title: e.title.en, titleAr: e.title.ar, sub: e.truth.en, place: e.truth.ar });
      box.classList.remove('ending');
    },
    // Credits: the team, libraries, fonts, sounds, and only the NASA photos the game shows.
    async credits() {
      const [t, photos] = await Promise.all([texts, usedPhotos()]);
      const me = ++shown;
      roll.textContent = '';
      el('h1', '', roll, 'Credits');
      for (const block of t.credits ?? []) {
        el('h2', '', roll, block.heading);
        for (const line of block.lines) el('p', '', roll, line);
      }
      if (photos.length) {
        el('h2', '', roll, 'NASA photos (images.nasa.gov)');
        for (const p of photos) el('p', 'photo-credit', roll, `${p.title} · NASA/${p.center} · ${p.nasa_id}`);
      }
      rollBox.classList.remove('hidden');
      rollBox.scrollTop = 0;
      await prompt.wait();
      if (me === shown) rollBox.classList.add('hidden');
    },
    hide() { box.classList.add('hidden'); rollBox.classList.add('hidden'); },
  };
}

// The NASA photos the game shows: rows of public/nasa/CREDITS.csv whose id is in content/memories.json.
async function usedPhotos() {
  try {
    const [csv, memories] = await Promise.all([
      fetch('public/nasa/CREDITS.csv').then((r) => r.text()),
      loadJSON('content/memories.json'),
    ]);
    const rows = parseCSV(csv);
    const head = rows.shift();
    const col = (name) => head.indexOf(name);
    return rows
      .filter((r) => r[col('nasa_id')] in memories)
      // Our own photo title from memories.json, because some NASA titles are only the photo id.
      .map((r) => ({ nasa_id: r[col('nasa_id')], title: memories[r[col('nasa_id')]].title ?? r[col('title')], center: r[col('center')], page: r[col('source_page')] }));
  } catch (err) {
    console.warn('credits: could not read the photo list', err);
    return [];
  }
}

// Small CSV reader that understands quoted fields with commas inside.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  return rows;
}
