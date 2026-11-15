// Full-screen cards: chapter titles, the title screen, the ending and the credits. Owner: Set C.
//
//   await card.show('The Moon', 'Taurus–Littrow valley · December 1972')     a plain card
//   await card.show({ title, mission, place, dates, sub })
//   await card.chapter('moon')       the same, with the text from content/chapters.json
//   await card.title()               title screen        (text in content/credits.json)
//   await card.ending()              the final card: what is imagined and what is real
//   await card.credits()             the end screen: the team, sources and the NASA photos the game shows.
//                                    Only its two buttons close it; resolves to 'menu' or 'again'.
//
// Text is shown in the player's language. Chapter code may pass English, or "English · عربي" pairs.
import { el } from './dom.js';
import { loadJSON } from '../core/content.js';
import { prefs, pick } from './prefs.js';
import { t, translate, registerPairs } from './i18n.js';
import { keycap } from './keys.js';
import { icon } from './icons.js';

export function createCard(root, prompt) {
  const box = el('div', 'card hidden', root);
  const sheet = el('div', 'card-sheet', box);
  const mission = el('div', 'mission-name', sheet);
  const title = el('h1', '', sheet);
  const sub = el('p', 'card-sub', sheet);
  const facts = el('div', 'card-facts', sheet);
  // Chapter card ("game card"): the planet drawn in code with its name, and a real NASA photo of the machine.
  const stage = el('div', 'stage hidden', sheet);
  const next = continueButton(sheet);

  // The end screen: its own full page above everything, closed only by its two buttons.
  const rollBox = el('div', 'credits endscreen hidden', document.body);
  rollBox.setAttribute('role', 'dialog');
  rollBox.setAttribute('aria-modal', 'true');
  el('div', 'end-stars', rollBox);
  const rollScroll = el('div', 'end-scroll', rollBox);
  const roll = el('div', 'roll', rollScroll);
  const endBar = el('div', 'end-bar', rollBox);
  const endButton = (cls, ic, key) => {
    const btn = el('button', 'btn ' + cls, endBar);
    btn.type = 'button';
    btn.append(icon(ic));
    const w = el('span', '', btn, t(key));
    w.dataset.t = key;
    return btn;
  };
  const homeBtn = endButton('btn-end-primary', 'home', 'credits.menu');
  const againBtn = endButton('btn-end-secondary', 'restart', 'credits.again');
  // While it is open, keys and clicks never reach the game or the pause menu.
  const endIsOpen = () => !rollBox.classList.contains('hidden');
  const inBar = (e) => e.target instanceof Element && e.target.closest('.end-bar');
  for (const type of ['keydown', 'keyup']) {
    window.addEventListener(type, (e) => {
      if (!endIsOpen()) return;
      if (type === 'keydown' && e.key === 'Tab') {
        e.preventDefault();
        const order = [homeBtn, againBtn];
        const i = order.indexOf(document.activeElement);
        order[i === -1 ? 0 : (i + 1) % 2].focus();
      }
      // The focused button's own Enter/Space still presses it (that is the browser default, not a listener).
      e.stopPropagation();
      if (!inBar(e) && /^(Enter|Space|Escape)$/.test(e.code)) e.preventDefault();
    }, true);
  }
  window.addEventListener('pointerdown', (e) => { if (endIsOpen() && !inBar(e)) e.stopPropagation(); }, true);

  // Slow automatic scroll, like film credits. A wheel, touch or drag gives control to the player for a while.
  let autoScroll = 0, heldUntil = 0, lastT = 0, carry = 0;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  for (const type of ['wheel', 'touchstart', 'pointerdown']) rollScroll.addEventListener(type, () => { heldUntil = performance.now() + 5000; }, { passive: true });
  function scrollStep(now) {
    if (!endIsOpen()) { autoScroll = 0; return; }
    const dt = Math.min(0.1, (now - (lastT || now)) / 1000);
    lastT = now;
    if (now > heldUntil && !reduceMotion.matches) {
      carry += 30 * dt;
      const px = Math.floor(carry);
      carry -= px;
      if (px) rollScroll.scrollTop += px;
    }
    autoScroll = requestAnimationFrame(scrollStep);
  }

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
  const show = (value) => translate(value && typeof value === 'object' ? pick(value) : value ?? ''); // translate also keeps digits Western
  function drawStage(c) {
    stage.textContent = '';
    const art = STAGE_ART[c.id];
    const when = show(c.dates);
    if (when) {
      const d = el('bdi', 'stage-when', stage, when);
      d.dir = 'auto';
    }
    const world = el('div', 'stage-world', stage);
    el('div', 'planet planet-' + art.planet, world).setAttribute('aria-hidden', 'true');
    el('h1', 'stage-title', world, show(c.title));
    const where = show(c.place);
    if (where) el('p', 'stage-place', world, where);

    const machine = el('figure', 'stage-machine', stage);
    const img = el('img', '', machine);
    img.src = art.photo;
    img.alt = '';
    el('span', 'stage-credit', machine, art.credit);
    const cap = el('figcaption', '', machine);
    // "Mars Exploration Rover · Opportunity": the last part is the machine, the rest is the mission.
    const parts = show(c.mission).split(' · ');
    el('strong', '', cap, parts.pop() ?? '');
    if (parts.length) el('span', '', cap, parts.join(' · '));
    const fact = show(c.sub);
    if (fact) el('p', 'stage-fact', machine, fact);
  }
  function fill(c) {
    shownCard = c;
    const isStage = !!(c.id && STAGE_ART[c.id]);
    stage.classList.toggle('hidden', !isStage);
    if (isStage) {
      drawStage(c);
      for (const node of [mission, title, sub, facts]) node.classList.add('hidden');
      return;
    }
    title.textContent = show(c.title);
    mission.textContent = show(c.mission);
    sub.textContent = show(c.sub);
    facts.textContent = '';
    for (const part of [c.place, c.dates]) {
      const s = show(part);
      if (s) el('span', '', facts, s);
    }
    title.classList.remove('hidden');
    for (const node of [mission, sub, facts]) node.classList.toggle('hidden', !node.textContent);
  }
  prefs.subscribe(() => {
    if (shownCard) fill(shownCard);
    for (const n of [...root.querySelectorAll('.card [data-t]'), ...rollBox.querySelectorAll('[data-t]')]) n.textContent = t(n.dataset.t);
    if (endIsOpen()) drawCredits();
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
  let endChoice = null;
  function closeEnd() {
    rollBox.classList.add('hidden');
    document.body.classList.remove('end-open');
    cancelAnimationFrame(autoScroll);
    const r = endChoice;
    endChoice = null;
    r?.(null);
  }
  function drawCredits() {
    const { t: c, photos } = creditsData;
    roll.textContent = '';

    const head = el('header', 'end-head', roll);
    const logo = el('img', 'end-logo', head);
    logo.src = 'public/brand/logos/relica-lockup-ivory-1200.png';
    logo.alt = 'Relica';
    const name = el('p', 'end-name', head, 'RELICA: Still Here');
    name.dir = 'ltr';
    el('h1', 'end-thanks', head, t('credits.thanks'));
    el('p', 'end-lede', head, t('credits.lede'));

    const teamSec = el('section', 'end-section', roll);
    el('h2', 'end-eyebrow', teamSec, t('credits.team'));
    const team = el('ul', 'end-team', teamSec);
    for (const m of c.team ?? []) {
      const li = el('li', 'end-member', team);
      el('strong', '', li, pick(m.name));
      el('span', '', li, pick(m.role));
    }

    const blocks = (c.credits ?? []).filter((block) => block.heading !== 'Made by');
    if (blocks.length) {
      const sec = el('section', 'end-section', roll);
      el('h2', 'end-eyebrow', sec, t('credits.sources'));
      const grid = el('div', 'end-grid', sec);
      for (const block of blocks) {
        const box2 = el('div', 'end-block', grid);
        el('h3', '', box2, pick(block.title ?? block.heading));
        for (const line of block.lines) el('p', '', box2, pick(line));
      }
    }
    if (photos.length) {
      const sec = el('section', 'end-section', roll);
      el('h2', 'end-eyebrow', sec, t('credits.photos'));
      const list = el('ul', 'end-photos', sec);
      for (const p of photos) {
        const li = el('li', '', list);
        el('span', '', li, translate(p.title));
        const id = el('bdi', '', li, `NASA/${p.center} · ${p.nasa_id}`);
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
    el('p', 'end-fin', roll, t('credits.fin'));
  }

  return {
    async show(heading, line = '') {
      await open(typeof heading === 'object' ? heading : { title: heading, sub: line });
    },
    async chapter(id) {
      const c = (await chapters)[id];
      if (!c) { console.warn(`chapter "${id}" is missing from content/chapters.json`); return; }
      await open({ id, title: c.title, mission: c.mission, place: c.place, dates: c.dates, sub: c.sub }, STAGE_ART[id] ? 'stage-card' : '');
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
    // The end screen. Only its two buttons close it: 'menu' (main menu) or 'again' (play from the start).
    async credits() {
      const [c, photos] = await Promise.all([texts, usedPhotos()]);
      ++shown;
      creditsData = { t: c, photos };
      drawCredits();
      rollBox.classList.remove('hidden');
      document.body.classList.add('end-open');
      rollScroll.scrollTop = 0;
      heldUntil = performance.now() + 2500;
      lastT = 0;
      cancelAnimationFrame(autoScroll);
      autoScroll = requestAnimationFrame(scrollStep);
      const choice = await new Promise((resolve) => {
        endChoice = resolve;
        homeBtn.onclick = () => { endChoice = null; resolve('menu'); };
        againBtn.onclick = () => { endChoice = null; resolve('again'); };
      });
      closeEnd();
      return choice;
    },
    get endOpen() { return endIsOpen(); },
    hide() { box.classList.add('hidden'); closeEnd(); shownCard = null; },
  };
}

// Art for each chapter card: which planet to draw and a real NASA photo of the machine (no generated images).
// Every photo here is also a memory photo, so it is already in the credits.
const STAGE_ART = {
  moon: { planet: 'moon', photo: 'public/nasa/apollo_lunar_roving_vehicle/as17-137-20979.jpg', credit: 'NASA/JSC' },
  mars: { planet: 'mars', photo: 'public/nasa/opportunity_rover/PIA21708.jpg', credit: 'NASA/JPL/Cornell' },
  sky: { planet: 'mars', photo: 'public/nasa/ingenuity_helicopter/PIA23882.jpg', credit: 'NASA/JPL' },
  epilogue: { planet: 'jupiter', photo: 'public/nasa/pioneer_10_11/ARC-1972-AC72-2135.jpg', credit: 'NASA/ARC' },
  epilogue_photo: { planet: 'jupiter', photo: 'public/nasa/pioneer_10_11/ARC-1972-AC72-2135.jpg', credit: 'NASA/ARC' },
};

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
