// Full-screen cards: chapter titles, the title screen, the ending and the credits. Owner: Set C.
//
//   await card.show('The Moon', 'Taurus–Littrow valley · December 1972')     a plain card
//   await card.show({ title, mission, place, dates, sub })
//   await card.chapter('moon')       the same, with the text from content/chapters.json
//   await card.title()               title screen        (text in content/credits.json)
//   await card.ending()              the final card: what is imagined and what is real
//   await card.credits()             credits: the team, then sources, with only the NASA photos the game shows
//
// Text is shown in the player's language. Chapter code may pass English, or "English · عربي" pairs.
import { el } from './dom.js';
import { loadJSON } from '../core/content.js';
import { prefs, pick } from './prefs.js';
import { t, translate, registerPairs } from './i18n.js';
import { keycap } from './keys.js';

export function createCard(root, prompt) {
  const box = el('div', 'card hidden', root);
  const sheet = el('div', 'card-sheet', box);
  const mission = el('div', 'mission-name', sheet);
  const title = el('h1', '', sheet);
  const sub = el('p', 'card-sub', sheet);
  const facts = el('div', 'card-facts', sheet);
  const next = continueButton(sheet);

  // Credits roll: its own scrolling page.
  const rollBox = el('div', 'credits hidden', root);
  const roll = el('div', 'roll', rollBox);
  const rollNext = continueButton(rollBox);

  function continueButton(parent) {
    const b = el('button', 'next-btn', parent);
    b.type = 'button';
    b.append(keycap('Enter'));
    const w = el('span', '', b, t('hud.next'));
    w.dataset.t = 'hud.next';
    return b;
  }

  const texts = loadJSON('content/credits.json').catch((err) => {
    console.warn('content/credits.json could not be loaded', err);
    return {};
  });
  const chapters = loadJSON('content/chapters.json').then((c) => { registerPairs(c); return c; }).catch((err) => {
    console.warn('content/chapters.json could not be loaded', err);
    return {};
  });

  let shownCard = null;
  const show = (value) => (value && typeof value === 'object' ? pick(value) : translate(value ?? ''));
  function fill(c) {
    shownCard = c;
    title.textContent = show(c.title);
    mission.textContent = show(c.mission);
    sub.textContent = show(c.sub);
    facts.textContent = '';
    for (const part of [c.place, c.dates]) {
      const s = show(part);
      if (s) el('span', '', facts, s);
    }
    for (const node of [mission, sub, facts]) node.classList.toggle('hidden', !node.textContent);
  }
  prefs.subscribe(() => {
    if (shownCard) fill(shownCard);
    for (const n of root.querySelectorAll('.card [data-t], .credits [data-t]')) n.textContent = t(n.dataset.t);
    if (!rollBox.classList.contains('hidden')) drawCredits();
  });

  // Only the newest card may hide the box, so a card opened over another never hides the new one.
  let shown = 0;
  async function open(c, kind = '') {
    const me = ++shown;
    box.className = 'card' + (kind ? ' ' + kind : '');
    fill(c);
    await prompt.wait();
    if (me === shown) { box.classList.add('hidden'); shownCard = null; }
  }

  let creditsData = null;
  function drawCredits() {
    const { t: c, photos } = creditsData;
    roll.textContent = '';
    const logo = el('img', 'credits-logo', roll);
    logo.src = 'public/brand/logos/relica-lockup-ivory-1200.png';
    logo.alt = 'Relica';
    el('h1', '', roll, t('credits.title'));
    el('h2', '', roll, t('credits.team'));
    const team = el('ul', 'credits-team', roll);
    for (const m of c.team ?? []) {
      const li = el('li', '', team);
      el('strong', '', li, pick(m.name));
      el('span', '', li, pick(m.role));
    }
    for (const block of c.credits ?? []) {
      if (block.heading === 'Made by') continue;
      el('h2', '', roll, pick(block.title ?? block.heading));
      for (const line of block.lines) el('p', '', roll, pick(line));
    }
    if (photos.length) {
      el('h2', '', roll, t('credits.photos'));
      for (const p of photos) {
        const line = el('p', 'photo-credit', roll);
        el('span', '', line, translate(p.title) + ' ');
        const id = el('bdi', '', line, `NASA/${p.center} · ${p.nasa_id}`);
        id.dir = 'ltr';
      }
    }
    const partners = el('div', 'credit-partners', roll);
    const sym = el('img', '', partners);
    sym.src = 'public/brand/logos/relica-symbol-ivory-256.png';
    sym.alt = 'Relica';
    el('span', 'times', partners, '×');
    const sa = el('img', 'space-apps', partners);
    sa.src = 'public/brand/partners/space-apps-white.svg';
    sa.alt = 'NASA Space Apps Challenge';
  }

  return {
    async show(heading, line = '') {
      await open(typeof heading === 'object' ? heading : { title: heading, sub: line });
    },
    async chapter(id) {
      const c = (await chapters)[id];
      if (!c) { console.warn(`chapter "${id}" is missing from content/chapters.json`); return; }
      await open({ title: c.title, mission: c.mission, place: c.place, dates: c.dates, sub: c.sub }, 'chapter-card');
    },
    // Title screen: the game's name and "Press Enter to wake up".
    async title() {
      const tx = (await texts).title;
      if (!tx) return;
      await open({ title: { en: tx.name, ar: tx.line.ar }, sub: tx.start }, 'title-screen');
    },
    // The final card, with the line that says what is imagined and what is real.
    async ending() {
      const e = (await texts).ending;
      if (!e) return;
      await open({ title: e.title, sub: e.truth }, 'ending');
    },
    // Credits: the team, libraries, fonts, sounds, and only the NASA photos the game shows.
    async credits() {
      const [c, photos] = await Promise.all([texts, usedPhotos()]);
      const me = ++shown;
      creditsData = { t: c, photos };
      drawCredits();
      rollBox.classList.remove('hidden');
      rollBox.scrollTop = 0;
      await prompt.wait();
      if (me === shown) rollBox.classList.add('hidden');
    },
    hide() { box.classList.add('hidden'); rollBox.classList.add('hidden'); shownCard = null; },
  };
}

// The NASA photos the game shows: rows of public/nasa/CREDITS.csv whose id is in content/memories.json.
export async function usedPhotos() {
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
