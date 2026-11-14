// The guide box for photo tasks: an arrow, the key to press, and a bar for how close the frame is.
// Owner: Set A. Used by _historicPhoto.js (the three mission photos) and _pioneerPhoto.js (Jupiter).
//
//   const guide = createPhotoGuide()
//   guide.update(key, closeness, aligned)   key: 'KeyA' | 'KeyD' | 'KeyW' | 'KeyS' | null; closeness 0..1
//   guide.remove()
const ARROWS = { KeyA: '←', KeyD: '→', KeyW: '↑', KeyS: '↓' };
const WORDS = {
  KeyA: ['Move the frame left', 'حرّك الإطار لليسار'],
  KeyD: ['Move the frame right', 'حرّك الإطار لليمين'],
  KeyW: ['Move the frame up', 'حرّك الإطار للأعلى'],
  KeyS: ['Move the frame down', 'حرّك الإطار للأسفل'],
};

export function createPhotoGuide() {
  const box = document.createElement('div');
  box.className = 'photo-guide';
  Object.assign(box.style, {
    position: 'fixed', left: '50%', bottom: '17%', transform: 'translateX(-50%)', zIndex: 30,
    minWidth: '260px', padding: '10px 16px', borderRadius: '10px', textAlign: 'center',
    background: 'rgba(6, 10, 18, 0.78)', border: '1px solid rgba(255,255,255,0.25)', color: '#eef3f8',
    font: '600 15px system-ui, sans-serif', pointerEvents: 'none', transition: 'border-color .2s, background .2s',
  });
  const top = document.createElement('div');
  top.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:12px';
  const arrow = document.createElement('div');
  arrow.style.cssText = 'font-size:34px;line-height:1';
  const key = document.createElement('div');
  key.style.cssText = 'min-width:34px;padding:3px 8px;border:2px solid currentColor;border-radius:6px;font-size:18px';
  top.append(arrow, key);
  const en = document.createElement('div');
  en.style.marginTop = '6px';
  const ar = document.createElement('div');
  ar.lang = 'ar'; ar.dir = 'rtl';
  ar.style.cssText = 'font-size:14px;opacity:.85';
  const bar = document.createElement('div');
  bar.style.cssText = 'height:6px;margin-top:8px;border-radius:3px;background:rgba(255,255,255,.18);overflow:hidden';
  const fill = document.createElement('div');
  fill.style.cssText = 'height:100%;width:0;background:#e3a23c;transition:width .1s';
  bar.append(fill);
  box.append(top, en, ar, bar);
  (document.getElementById('ui') ?? document.body).appendChild(box);

  let shown = '';
  return {
    update(code, closeness = 0, aligned = false) {
      const state = aligned ? 'aligned' : code ?? '';
      fill.style.width = `${Math.round(Math.max(0, Math.min(1, closeness)) * 100)}%`;
      if (state === shown) return;
      shown = state;
      if (aligned) {
        arrow.textContent = '◎';
        key.textContent = 'Space';
        en.textContent = 'In frame: press Space to take the photo';
        ar.textContent = 'داخل الإطار: اضغط Space لالتقاط الصورة';
        box.style.borderColor = '#7fe08a';
        fill.style.background = '#7fe08a';
      } else {
        arrow.textContent = ARROWS[code] ?? '';
        key.textContent = code ? code.replace('Key', '') : '';
        [en.textContent, ar.textContent] = WORDS[code] ?? ['', ''];
        box.style.borderColor = 'rgba(255,255,255,0.25)';
        fill.style.background = '#e3a23c';
      }
    },
    hide() { box.style.display = 'none'; },
    show() { box.style.display = ''; },
    remove() { box.remove(); },
  };
}
