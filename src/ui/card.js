// Full-screen title card for chapters and the ending. Owner: Set C.
//   await card.show('The Moon', 'Taurus–Littrow valley · December 1972')
import { el } from './dom.js';

export function createCard(root, prompt) {
  const box = el('div', 'card hidden', root);
  const title = el('h1', '', box);
  const sub = el('p', '', box);
  el('div', 'hint', box, 'Press Enter');

  return {
    async show(heading, line = '') {
      title.textContent = heading;
      sub.textContent = line;
      box.classList.remove('hidden');
      await prompt.wait();
      box.classList.add('hidden');
    },
    hide() { box.classList.add('hidden'); },
  };
}
