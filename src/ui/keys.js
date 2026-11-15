// Keyboard keys drawn as real keycaps inside interface text. Owner: Set C.
//
//   keycap('E')                      one <kbd> element
//   fillWithKeys(node, 'Hold E to …') replaces node's content: words stay text, key names become keycaps
//
// A key name is: Space, Enter, Esc, a digit after "Press", or one capital letter from the game's keys
// (W A S D E P R) standing alone. "A real photo" is not a key: an "A" followed by a lowercase word other
// than "and" / "to" is read as the English article.
const LABEL = { Space: 'Space', Enter: 'Enter', Esc: 'Esc', Escape: 'Esc' };
const TOKEN = /(\bSpace\b|\bEnter\b|\bEsc(?:ape)?\b|(?<![A-Za-z])[WASDEPR](?![A-Za-z])|(?<=Press )\d)/g;

export function keycap(name, { size = '' } = {}) {
  const k = document.createElement('kbd');
  k.className = 'keycap' + (name.length > 1 ? ' wide' : '') + (size ? ' ' + size : '');
  k.textContent = LABEL[name] ?? name;
  k.dir = 'ltr';
  return k;
}

export function fillWithKeys(node, text) {
  node.textContent = '';
  // "(W)", "(Space)" or "(A, D)" next to a task: the keycaps speak for themselves, so the brackets and commas go.
  const s = String(text ?? '').replace(/\s*\(\s*((?:Space|Enter|Esc|[WASDEPR])(?:\s*[,،]\s*(?:Space|Enter|Esc|[WASDEPR]))*)\s*\)/g, (m, keys) => ' ' + keys.replace(/\s*[,،]\s*/g, ' '));
  let last = 0;
  for (const m of s.matchAll(TOKEN)) {
    const word = m[0];
    const after = s.slice(m.index + word.length);
    if (word === 'A' && /^ (?!and\b|to\b|\/)[a-z]/.test(after)) continue; // the article "A"
    if (m.index > last) node.append(s.slice(last, m.index));
    node.append(keycap(word));
    last = m.index + word.length;
  }
  if (last < s.length) node.append(s.slice(last));
  return node;
}
