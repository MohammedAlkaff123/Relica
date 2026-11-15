// Small line icons drawn for Relica: round ends and round joins, one stroke weight, currentColor.
// icon('settings') returns an <svg> element sized by CSS (1em by default).
const PATHS = {
  settings: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5"/><circle cx="12" cy="12" r="6.6"/>',
  pause: '<rect x="6.5" y="5" width="3.6" height="14" rx="1.6"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.6"/>',
  play: '<path d="M8 5.6c0-.9 1-1.5 1.8-1l9 6.4c.7.5.7 1.5 0 2l-9 6.4c-.8.5-1.8 0-1.8-1z"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  sound: '<path d="M4 9.5h3l4.5-3.6c.6-.5 1.5 0 1.5.8v10.6c0 .8-.9 1.3-1.5.8L7 14.5H4z"/><path d="M16.5 9a4.5 4.5 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>',
  muted: '<path d="M4 9.5h3l4.5-3.6c.6-.5 1.5 0 1.5.8v10.6c0 .8-.9 1.3-1.5.8L7 14.5H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/>',
  globe: '<circle cx="12" cy="12" r="8.8"/><path d="M3.4 12h17.2M12 3.2c2.6 2.4 3.9 5.4 3.9 8.8s-1.3 6.4-3.9 8.8c-2.6-2.4-3.9-5.4-3.9-8.8S9.4 5.6 12 3.2z"/>',
  keyboard: '<rect x="2.8" y="6" width="18.4" height="12" rx="2.6"/><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M8 14.2h8"/>',
  book: '<path d="M4 5.5c0-.8.7-1.5 1.5-1.5H11c.6 0 1 .4 1 1v15c0-.9-.7-1.5-1.6-1.5H5.5c-.8 0-1.5-.7-1.5-1.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13c-.6 0-1 .4-1 1v15c0-.9.7-1.5 1.6-1.5h4.9c.8 0 1.5-.7 1.5-1.5z"/>',
  layers: '<path d="M12 3.5l8.5 4.6L12 12.7 3.5 8.1z"/><path d="M3.5 12l8.5 4.6 8.5-4.6M3.5 15.9l8.5 4.6 8.5-4.6"/>',
  restart: '<path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5"/><path d="M4.2 4.5v4h4"/>',
  home: '<path d="M4 11.2 12 4.5l8 6.7V19c0 .8-.7 1.5-1.5 1.5h-4V15h-5v5.5h-4c-.8 0-1.5-.7-1.5-1.5z"/>',
  photo: '<rect x="3" y="5.5" width="18" height="13.5" rx="2.6"/><circle cx="12" cy="12.2" r="3.6"/><path d="M8.5 5.5l1.2-2h4.6l1.2 2"/>',
  check: '<path d="M5.5 12.5l4 4 9-9"/>',
  people: '<circle cx="9" cy="8.5" r="3.3"/><path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><circle cx="17" cy="9.5" r="2.6"/><path d="M16.5 14.6c2.4 0 4 1.5 4.5 4.4"/>',
  chapters: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  thermometer: '<path d="M10 13.8V5.2a2 2 0 1 1 4 0v8.6a4.2 4.2 0 1 1-4 0z"/><path d="M12 9.5v6.3"/>',
  weight: '<path d="M8.8 9.2a3.2 3.2 0 1 1 6.4 0"/><path d="M6.9 9.8h10.2l1.7 8.8c.2.8-.5 1.4-1.3 1.4H6.5c-.8 0-1.5-.6-1.3-1.4z"/>',
  wind: '<path d="M3 9h10.5A2.5 2.5 0 1 0 11 6.5"/><path d="M3 13h14.5a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 17h6"/>',
  github: '<path d="M12 2.8a9.3 9.3 0 0 0-2.9 18.1c.5.1.6-.2.6-.5v-1.7c-2.6.6-3.1-1.2-3.1-1.2-.4-1.1-1-1.4-1-1.4-.9-.6 0-.6 0-.6.9.1 1.4 1 1.4 1 .8 1.4 2.2 1 2.7.8.1-.6.3-1 .6-1.2-2.1-.2-4.3-1-4.3-4.6 0-1 .4-1.9 1-2.5-.1-.3-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a9 9 0 0 1 4.7 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.2.1 2.5.6.6 1 1.5 1 2.5 0 3.6-2.2 4.4-4.3 4.6.3.3.6.8.6 1.6v2.4c0 .3.2.6.7.5A9.3 9.3 0 0 0 12 2.8z"/>',
};
const FILLED = new Set(['play', 'pause', 'github']);

export function icon(name, className = '') {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'icon ' + className);
  if (FILLED.has(name)) { svg.setAttribute('fill', 'currentColor'); svg.setAttribute('stroke', 'none'); }
  else {
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
  }
  svg.innerHTML = PATHS[name] ?? '';
  return svg;
}
