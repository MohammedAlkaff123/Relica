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
  const credit = (p) => `${p.date_created.slice(0, 4)} · NASA/${p.center} · ${p.nasa_id}`;

  // Puts the photo in its frame with the crop from memories.json.
  function photo(parent, p) {
    const o = overrides[p.nasa_id] ?? {};
    const img = el('img', '', parent);
    img.src = src(p);
    img.alt = titleOf(p);
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
    build();
    box.classList.remove('hidden');
    await prompt.wait();
    if (me === shown) box.classList.add('hidden');
  }

  return {
    collected,
    async show(id) {
      const p = photos.get(id);
      if (!p) { console.warn(`memory "${id}" is not in public/nasa/metadata.json`); return; }
      if (!collected.includes(id)) collected.push(id);
      const o = overrides[id] ?? {};
      sfx('memory');
      await open(() => {
        const frame = el('div', 'frame', box);
        photo(el('div', 'photo', frame), p);
        el('h3', '', frame, titleOf(p));
        el('div', 'meta', frame, credit(p));
        if (o.caption) {
          el('div', 'desc', frame, o.caption.en);
          const ar = el('div', 'desc ar', frame, o.caption.ar ?? '');
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
        const grid = el('div', 'wall', box);
        for (const id of collected) {
          const p = photos.get(id);
          const fig = el('figure', '', grid);
          photo(el('div', 'thumb', fig), p);
          el('figcaption', '', fig, `${titleOf(p)} · NASA/${p.center}`);
        }
        if (!collected.length) el('div', 'hint', grid, 'No memories collected yet');
        // Everything the player discovered on the way (hud.discover), under the photos.
        if (found.length) {
          const list = el('div', 'discovered', box);
          el('h3', '', list, 'What you discovered');
          const ol = el('ol', '', list);
          for (const d of found) el('li', '', ol, d.en);
        }
      });
    },
    hide() { box.classList.add('hidden'); },
  };
}
