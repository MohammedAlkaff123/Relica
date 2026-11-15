// Memory photos: real NASA photos from the data pack. Owner: Set C.
//
//   await memory.show('as17-137-20979')   freeze the game and show the real photo of this moment
//   await memory.wall()                   show everything the player has collected (the ending)
//   memory.collected                      ids collected so far (the save keeps them)
//
// Photos are in public/nasa/<group>/<nasa_id>.jpg, with their credit from public/nasa/metadata.json.
// content/memories.json gives each photo our own title and one-sentence caption (English and Arabic),
// and chooses the crop: "focus" (which part stays in frame), "zoom" and "fit": "contain".
// The NASA id, centre and year are shown as they are (left to right), in both languages.
import { el } from './dom.js';
import { loadJSON } from '../core/content.js';
import { sfx } from '../audio/audio.js';
import { found } from './discoveries.js';
import { prefs, pick } from './prefs.js';
import { t, translate } from './i18n.js';
import { keycap } from './keys.js';

export async function createMemory(root, prompt) {
  const [meta, overrides] = await Promise.all([
    loadJSON('public/nasa/metadata.json'),
    loadJSON('content/memories.json'),
  ]);
  const photos = new Map();
  for (const [group, entry] of Object.entries(meta)) {
    for (const item of entry.items) photos.set(item.nasa_id, { ...item, group });
  }

  const box = el('div', 'memory hidden', root);
  const collected = [];
  const src = (p) => `public/nasa/${p.group}/${p.nasa_id}.jpg`;
  const titleOf = (p) => translate(overrides[p.nasa_id]?.title ?? p.title);
  const tributeIds = Object.keys(overrides).filter((id) => overrides[id]?.tribute && photos.has(id));

  function credit(parent, p) {
    const line = el('bdi', 'meta', parent, `${overrides[p.nasa_id]?.taken ?? p.date_created.slice(0, 4)} · NASA/${p.center} · ${p.nasa_id}`);
    line.dir = 'ltr';
    // outsidePack: added later from images.nasa.gov, not from the team's data pack. The card says so.
    if (overrides[p.nasa_id]?.outsidePack) {
      el('div', 'meta outside-pack', parent, prefs.language === 'ar' ? 'من موقع ناسا، وليست من حزمة بياناتنا' : 'From images.nasa.gov, not from our data pack');
    }
    return line;
  }
  // The caption in the chosen language, and the other one under it if the player asked for subtitles.
  function caption(parent, text, className = 'desc') {
    if (!text) return;
    const first = prefs.language, other = first === 'ar' ? 'en' : 'ar';
    const a = el('div', className, parent, text[first] ?? text.en ?? '');
    a.lang = first;
    if (prefs.get().secondary && text[other]) {
      const b = el('div', className + ' second', parent, text[other]);
      b.lang = other;
    }
  }
  function continueHint(parent, words) {
    const b = el('button', 'next-btn', parent);
    b.type = 'button';
    b.append(keycap('Enter'));
    el('span', '', b, words);
    return b;
  }

  function wallPhoto(grid, id) {
    const p = photos.get(id);
    if (!p) return;
    const o = overrides[id] ?? {};
    const fig = el('figure', '', grid);
    photo(el('div', 'thumb', fig), p);
    const cap = el('figcaption', '', fig);
    el('strong', '', cap, titleOf(p));
    credit(cap, p);
    caption(cap, o.caption);
    if (o.tribute) {
      caption(cap, o.tribute, 'service desc');
      const sources = el('div', 'sources', cap);
      for (const [i, url] of (o.tribute.sources ?? []).entries()) {
        const link = el('a', '', sources, t('end.source', { n: i + 1 }));
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        // Reading a source must not also count as the global click/Enter to leave the wall.
        link.addEventListener('pointerdown', (event) => event.stopPropagation());
        link.addEventListener('keydown', (event) => { if (event.key === 'Enter') event.stopPropagation(); });
      }
    }
  }

  // Puts the photo in its frame with the crop from memories.json.
  function photo(parent, p) {
    const o = overrides[p.nasa_id] ?? {};
    const img = el('img', '', parent);
    img.src = src(p);
    img.alt = titleOf(p);
    img.decoding = 'async';
    img.addEventListener('error', () => {
      img.hidden = true;
      el('div', 'desc', parent, t('end.photoError'));
    }, { once: true });
    if (o.fit === 'contain') { img.style.objectFit = 'contain'; img.style.background = '#101820'; }
    if (o.focus) { img.style.objectPosition = o.focus; img.style.transformOrigin = o.focus; }
    if (o.zoom && o.zoom !== 1) img.style.transform = `scale(${o.zoom})`;
    return img;
  }

  // Only the newest photo may hide the box, so opening one photo over another never hides the new one.
  let shown = 0;
  let redraw = null;
  async function open(build) {
    const me = ++shown;
    redraw = () => { box.textContent = ''; build(); };
    box.classList.remove('memory-wall', 'photo-reveal');
    redraw();
    box.classList.remove('hidden');
    await prompt.wait();
    if (me === shown) { box.classList.add('hidden'); redraw = null; }
  }
  prefs.subscribe(() => { if (redraw && !box.classList.contains('hidden')) redraw(); });

  return {
    collected,
    preload(id) {
      const p = photos.get(id);
      if (!p) return Promise.resolve(false);
      return new Promise((resolve) => {
        const img = new Image();
        const timer = setTimeout(() => resolve(false), 8000);
        img.onload = () => { clearTimeout(timer); resolve(true); };
        img.onerror = () => { clearTimeout(timer); resolve(false); };
        img.src = src(p);
      });
    },
    // tribute: show the machine's verified service record under the photo instead of the photo caption.
    async show(id, { reveal = false, tribute = false } = {}) {
      const p = photos.get(id);
      if (!p) { console.warn(`memory "${id}" is not in public/nasa/metadata.json`); return; }
      if (!collected.includes(id)) collected.push(id);
      const o = overrides[id] ?? {};
      sfx('memory');
      await open(() => {
        if (reveal) box.classList.add('photo-reveal');
        const frame = el('div', 'frame', box);
        photo(el('div', 'photo', frame), p);
        const words = el('div', 'frame-words', frame);
        el('div', 'real-tag', words, t('hud.realPhoto'));
        el('h3', '', words, titleOf(p));
        credit(words, p);
        // tribute: the machine's verified service record in place of the photo caption.
        if (tribute && o.tribute) {
          el('div', 'service-label', words, prefs.language === 'ar' ? 'سجلّ الخدمة' : 'Service record');
          caption(words, o.tribute);
        } else if (o.caption) caption(words, o.caption);
        else {
          const text = p.description.length > 230 ? p.description.slice(0, 230).trimEnd() + '…' : p.description;
          el('div', 'desc', words, text);
        }
        continueHint(words, t('hud.next'));
      });
    },
    async wall() {
      await open(() => {
        box.classList.add('memory-wall');
        if (tributeIds.length) {
          const heading = el('div', 'wall-heading', box);
          el('h2', '', heading, t('end.tribute'));
          const grid = el('div', 'wall', box);
          for (const id of tributeIds) wallPhoto(grid, id);
        }
        // Tributes honor the whole cast, including in chapter-select demos. They do not unlock memories.
        const otherMemories = collected.filter((id) => !tributeIds.includes(id));
        if (otherMemories.length) {
          el('h3', 'wall-heading', box, t('end.collected'));
          const grid = el('div', 'wall', box);
          for (const id of otherMemories) wallPhoto(grid, id);
        }
        if (!tributeIds.length && !collected.length) el('div', 'hint', box, t('end.none'));
        // Everything the player discovered on the way (hud.discover), under the photos.
        if (found.length) {
          const list = el('div', 'discovered', box);
          el('h3', '', list, t('end.discovered'));
          const ol = el('ol', '', list);
          for (const d of found) el('li', '', ol, pick(d));
        }
        continueHint(el('div', 'wall-continue', box), t('hud.next'));
      });
    },
    hide() { box.classList.add('hidden'); redraw = null; },
  };
}
