// A jump in time, made plain: a big counter in the middle of the screen races from one value to the
// next, settles for a moment, then disappears. Used by every time skip (sols, flights, years).
//
//   await counterJump(s, { en: 'Sol', ar: 'اليوم المريخي', from: 1, to: 120, onValue: (v) => ... })
//
// plain: true prints the number without a thousands comma (for years).
import { el } from '../ui/dom.js';

export function counterJump(s, { en, ar, from, to, seconds = 2.6, plain = false, onValue }) {
  const box = el('div', 'time-jump', document.getElementById('ui'));
  const label = el('div', 'label', box, `${en} · `);
  const arabic = el('span', '', label, ar);
  arabic.lang = 'ar';
  arabic.dir = 'rtl';
  const number = el('div', 'number', box, '');
  const show = (v) => { number.textContent = plain ? String(Math.round(v)) : Math.round(v).toLocaleString('en-US'); };
  show(from);
  s.onDispose(() => box.remove());
  let t = 0;
  return s.until((dt) => {
    t = Math.min(1, t + dt / seconds);
    const v = from + (to - from) * t * t; // starts slow, then races
    show(v);
    onValue?.(v);
    return t >= 1;
  }).then(async () => {
    box.classList.add('landed'); // the number settles on the new value for a moment
    await s.wait(1.1);
    box.remove();
  });
}
