// Translates the few overlays that chapter code builds itself (photo viewfinders, the "imagined
// conversation" label), so Arabic mode has no English left on screen. Owner: Set C.
// Only these areas are watched; everything else in the interface translates itself.
import { prefs } from './prefs.js';
import { translate } from './i18n.js';

const AREAS = '.historic-viewfinder, .pioneer-viewfinder, .fiction-label, .pioneer-image-note';

export function installLocalizer(root) {
  const original = new WeakMap();
  let queued = false;
  const observer = new MutationObserver(schedule);

  function update() {
    queued = false;
    observer.disconnect();
    for (const area of root.querySelectorAll(AREAS)) {
      // A separate Arabic line next to an English one: show only the chosen language.
      for (const ar of area.querySelectorAll('.ar, [lang="ar"]')) ar.hidden = true;
      const walker = document.createTreeWalker(area, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.parentElement?.closest('.ar, [lang="ar"]')) continue;
        if (!node.textContent.trim()) continue;
        const known = original.get(node);
        const source = known && known.shown === node.textContent ? known.source : node.textContent;
        const shown = translate(source);
        if (node.textContent !== shown) node.textContent = shown;
        original.set(node, { source, shown });
      }
      area.dir = prefs.rtl ? 'rtl' : 'ltr';
    }
    observer.observe(root, { childList: true, subtree: true, characterData: true });
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  prefs.subscribe(update);
  update();
}
