// Memory photos: real NASA photos from the data pack. Owner: Set C.
//
//   await memory.show('as17-137-20979')   freeze the game and show the real photo of this moment
//   await memory.wall()                   show everything the player has collected (the ending)
//
// Photos are in public/nasa/<group>/<nasa_id>.jpg, with their credit from public/nasa/metadata.json.
// content/memories.json gives each photo our own title and one-sentence caption (English and Arabic),
// and chooses the crop: "focus" (which part stays in frame), "zoom" and "fit": "contain".
// A photo without an entry there falls back to NASA's own title and description.
import { el } from './dom.js';
import { loadJSON } from '../core/content.js';
import { sfx } from '../audio/audio.js';
import { found } from './discoveries.js';

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
  const titleOf = (p) => overrides[p.nasa_id]?.title ?? p.title;
  // outsidePack: the photo was added from images.nasa.gov later, not from the data pack; the credit says so.
  const credit = (p) => `${overrides[p.nasa_id]?.taken ?? p.date_created.slice(0, 4)} · NASA/${p.center} · ${p.nasa_id}`
    + (overrides[p.nasa_id]?.outsidePack ? ' · from images.nasa.gov, not our data pack · من موقع ناسا، ليست من حزمة البيانات' : '');
  const tributeIds = Object.keys(overrides).filter((id) => overrides[id]?.tribute && photos.has(id));

  function bilingual(parent, text, className = 'desc') {
    if (!text) return;
    const en = el('div', className, parent, text.en ?? '');
    en.lang = 'en';
    const ar = el('div', `${className} ar`, parent, text.ar ?? '');
    ar.lang = 'ar';
    ar.dir = 'rtl';
  }

  function wallPhoto(grid, id) {
    const p = photos.get(id);
    if (!p) return;
    const o = overrides[id] ?? {};
    const fig = el('figure', '', grid);
    photo(el('div', 'thumb', fig), p);
    const caption = el('figcaption', '', fig);
    el('strong', '', caption, titleOf(p));
    el('div', 'meta', caption, credit(p));
    bilingual(caption, o.caption);
    if (o.tribute) {
      bilingual(caption, o.tribute, 'service desc');
      const sources = el('div', 'sources', caption);
      for (const [i, url] of (o.tribute.sources ?? []).entries()) {
        const link = el('a', '', sources, `NASA source ${i + 1}`);
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
    img.addEventListener('error', () => {
      img.hidden = true;
      el('div', 'desc', parent, 'The NASA image could not load. You can continue and retry this chapter.');
    }, { once: true });
    if (o.fit === 'contain') { img.style.objectFit = 'contain'; img.style.background = '#000'; }
    if (o.focus) { img.style.objectPosition = o.focus; img.style.transformOrigin = o.focus; }
    if (o.zoom && o.zoom !== 1) img.style.transform = `scale(${o.zoom})`;
    return img;
  }

  // Only the newest photo may hide the box, so opening one photo over another never hides the new one.
  let shown = 0;
  async function open(build) {
    const me = ++shown;
    box.textContent = '';
    box.classList.remove('memory-wall', 'photo-reveal');
    build();
    box.classList.remove('hidden');
    await prompt.wait();
    if (me === shown) box.classList.add('hidden');
  }

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
        el('h3', '', frame, titleOf(p));
        el('div', 'meta', frame, credit(p));
        const words = tribute && o.tribute ? o.tribute : o.caption;
        if (tribute && o.tribute) el('div', 'service-label', frame, 'Service record · سجلّ الخدمة');
        if (words) {
          el('div', 'desc', frame, words.en);
          const ar = el('div', 'desc ar', frame, words.ar ?? '');
          ar.lang = 'ar';
          ar.dir = 'rtl';
        } else {
          const text = p.description.length > 230 ? p.description.slice(0, 230).trimEnd() + '…' : p.description;
          el('div', 'desc', frame, text);
        }
        el('div', 'hint', frame, 'A real photo from NASA · Enter to continue');
      });
    },
    async wall() {
      await open(() => {
        box.classList.add('memory-wall');
        if (tributeIds.length) {
          const heading = el('div', 'wall-heading', box);
          el('h2', '', heading, 'In honor of their service');
          bilingual(heading, { ar: 'تقديرًا لما قدّمته هذه الآلات' });
          const grid = el('div', 'wall', box);
          for (const id of tributeIds) wallPhoto(grid, id);
        }
        // Tributes honor the whole cast, including in chapter-select demos. They do not unlock memories.
        const otherMemories = collected.filter((id) => !tributeIds.includes(id));
        if (otherMemories.length) {
          el('h3', 'wall-heading', box, 'Your collected memories');
          const grid = el('div', 'wall', box);
          for (const id of otherMemories) wallPhoto(grid, id);
        }
        if (!tributeIds.length && !collected.length) el('div', 'hint', box, 'No memories collected yet');
        // Everything the player discovered on the way (hud.discover), under the photos.
        if (found.length) {
          const list = el('div', 'discovered', box);
          el('h3', '', list, 'What you discovered');
          const ol = el('ol', '', list);
          for (const d of found) el('li', '', ol, d.en);
        }
        el('div', 'wall-heading wall-continue', box, 'Enter to continue · اضغط Enter للمتابعة');
      });
    },
    hide() { box.classList.add('hidden'); },
  };
}
