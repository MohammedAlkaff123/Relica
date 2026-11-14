// Memory photos: real NASA photos from the data pack, with captions read from its metadata.json. Owner: Set C.
//
//   await memory.show('as17-137-20979')   freeze the game and show the real photo of this moment
//   await memory.wall()                   show everything the player has collected (the ending)
//
// Photos are in public/nasa/<group>/<nasa_id>.jpg. content/memories.json can override the title
// and choose which part of a photo is shown ("focus").
// TODO Set C: nicer captions, a "new memory" sound, the final wall layout with credits.
import { el } from './dom.js';
import { loadJSON } from '../core/content.js';
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

  async function open(build) {
    box.textContent = '';
    build();
    box.classList.remove('hidden');
    await prompt.wait();
    box.classList.add('hidden');
  }

  return {
    collected,
    async show(id) {
      const p = photos.get(id);
      if (!p) { console.warn(`memory "${id}" is not in public/nasa/metadata.json`); return; }
      if (!collected.includes(id)) collected.push(id);
      const o = overrides[id] ?? {};
      await open(() => {
        const frame = el('div', 'frame', box);
        const img = el('img', '', el('div', 'photo', frame));
        img.src = src(p);
        img.alt = titleOf(p);
        if (o.focus) img.style.objectPosition = o.focus;
        el('h3', '', frame, titleOf(p));
        el('div', 'meta', frame, `${p.date_created.slice(0, 4)} · NASA/${p.center} · ${p.nasa_id}`);
        const text = p.description.length > 230 ? p.description.slice(0, 230).trimEnd() + '…' : p.description;
        el('div', 'desc', frame, text);
        el('div', 'hint', frame, 'A real photo from NASA · Enter to continue');
      });
    },
    async wall() {
      await open(() => {
        const grid = el('div', 'wall', box);
        for (const id of collected) {
          const p = photos.get(id);
          const fig = el('figure', '', grid);
          const img = el('img', '', fig);
          img.src = src(p);
          img.alt = titleOf(p);
          if (overrides[id]?.focus) img.style.objectPosition = overrides[id].focus;
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
