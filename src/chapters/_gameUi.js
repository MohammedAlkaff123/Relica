// A small panel for the chapter mini-games: title, a canvas to draw on, a help line with keycaps and a
// status line. Owner: Set A. Text follows the player's language (Set C's prefs), with keycaps from keys.js.
//
//   const ui = gamePanel(s, { title: { en, ar }, width: 520, height: 280 })
//   ui.g                 the canvas 2D context to draw on (ui.w, ui.h are its size)
//   ui.help({ en, ar })  the help line ("Hold Space …"); key names become keycaps
//   ui.status({ en, ar })
//   ui.remove()          also runs when the chapter is left
//
// Every game also sets s.game = { id, botKeys() } while it runs. botKeys() returns the keys a perfect
// player would hold this frame; the self-test bot uses it (src/core/selftest.js). Players never see it.
import { pick } from '../ui/prefs.js';
import { fillWithKeys } from '../ui/keys.js';

export const say = (text) => pick(text);

// intro (optional): one plain sentence under the title saying why we are doing this.
export function gamePanel(s, { title, intro, width = 520, height = 280, place = 'center' } = {}) {
  const box = document.createElement('div');
  box.className = 'mini-game';
  Object.assign(box.style, {
    position: 'fixed', left: '50%', top: place === 'center' ? '50%' : 'auto', bottom: place === 'low' ? '14%' : 'auto',
    transform: place === 'center' ? 'translate(-50%, -50%)' : 'translateX(-50%)', zIndex: 35,
    padding: '12px 14px 10px', borderRadius: '12px', background: 'rgba(7, 11, 20, 0.88)',
    border: '1px solid rgba(255,255,255,0.22)', color: '#eef3f8', textAlign: 'center',
    font: '600 15px system-ui, sans-serif', boxShadow: '0 10px 40px rgba(0,0,0,.45)', pointerEvents: 'auto',
  });
  const head = document.createElement('div');
  head.style.cssText = 'font-size:17px;margin-bottom:8px;letter-spacing:.2px';
  head.textContent = say(title);
  if (intro) {
    const why = document.createElement('div');
    why.style.cssText = 'font:500 14px system-ui, sans-serif;line-height:1.5;opacity:.9;margin:-2px auto 8px;max-width:86vw';
    why.style.width = `${width}px`;
    why.textContent = say(intro);
    head.append(why);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  canvas.style.cssText = `display:block;width:${width}px;max-width:86vw;border-radius:8px;background:#05070c;touch-action:none`;
  const help = document.createElement('div');
  help.style.cssText = 'margin-top:8px;min-height:22px;line-height:1.5';
  const status = document.createElement('div');
  status.style.cssText = 'margin-top:4px;min-height:20px;font-size:14px;opacity:.85';
  box.append(head, canvas, help, status);
  (document.getElementById('ui') ?? document.body).appendChild(box);

  let removed = false;
  const ui = {
    box, canvas, g: canvas.getContext('2d'), w: width, h: height,
    help(text) { fillWithKeys(help, say(text)); },
    status(text) { status.textContent = say(text); },
    remove() { if (removed) return; removed = true; box.remove(); if (s.game?.ui === ui) s.game = null; },
  };
  s.onDispose(() => ui.remove());
  return ui;
}

// Canvas coordinates of a pointer event (the canvas may be drawn smaller than its real size).
export function pointerAt(canvas, e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
}

// Stars for a result between 0 and 1: no game can be lost, the stars only say how well it went.
export const starsFor = (score) => (score >= 0.7 ? 3 : score >= 0.4 ? 2 : 1);
export const starText = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
