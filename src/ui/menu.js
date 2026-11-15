// Main menu, pause menu, Settings, How to play, Chapters and Credits. Owner: Set C.
//
//   const shell = createShell({ root, ctx, chapterIds, onPlay, onRestart, onQuit })
//   shell.showMain()          the main menu over the living Moon scene (src/ui/menuScene.js)
//   shell.pause(true/false)   the in-game pause menu (P, the pause button, or a hidden tab)
//   shell.blocking            true while any menu is open: game keys and clicks are held back
//
// Callbacks from src/main.js:
//   onPlay(index, { restore })   start chapter `index`; restore = the saved photos and discoveries
//   onRestart()                  restart the current chapter
//   onQuit()                     leave the chapter and come back to the main menu
//
// Menus pause game time through ctx.setPaused and never touch the 3D world directly: graphics go
// through ctx.quality.get/set/subscribe, sound through ctx.audio.setVolumes.
import { el } from './dom.js';
import { icon } from './icons.js';
import { prefs, pick } from './prefs.js';
import { t, applyText } from './i18n.js';
import { keycap } from './keys.js';
import { save } from './save.js';
import { loadJSON } from '../core/content.js';
import { sfx } from '../audio/audio.js';

const LOGO_INK = 'public/brand/logos/relica-lockup-ink-1200.png';
const SPACE_APPS = 'public/brand/partners/space-apps-black.svg';

export function createShell({ root, ctx, chapterIds, onPlay, onRestart, onQuit }) {
  const stack = []; // open sheets, top last
  let mainOpen = false, inGame = false, paused = false, menuScene = null;
  const credits = loadJSON('content/credits.json').catch(() => ({}));

  // ---------- small builders ----------
  function button(key, { iconName, variant = 'primary', onClick, sub } = {}) {
    const b = el('button', `btn btn-${variant}`);
    b.type = 'button';
    if (iconName) b.append(icon(iconName));
    const words = el('span', 'btn-words', b);
    const label = el('span', 'btn-label', words);
    label.dataset.t = key;
    label.textContent = t(key);
    if (sub) el('span', 'btn-sub', words, sub);
    b.addEventListener('click', (e) => { sfx('mark'); onClick?.(e); });
    return b;
  }
  function text(tag, cls, key, parent) {
    const n = el(tag, cls, parent, t(key));
    n.dataset.t = key;
    return n;
  }

  // ---------- the main menu ----------
  const main = el('div', 'main-menu hidden', root);
  main.setAttribute('role', 'dialog');
  main.setAttribute('aria-modal', 'true');
  const card = el('div', 'menu-card', main);
  const logo = el('img', 'menu-logo', card);
  logo.src = LOGO_INK;
  logo.alt = 'Relica';
  text('div', 'menu-eyebrow', 'landing.challenge', card);
  text('h1', 'menu-title', 'landing.title', card);
  text('p', 'menu-line', 'landing.line', card);
  const actions = el('div', 'menu-actions', card);
  const grid = el('div', 'menu-grid', card);
  const lang = languageSwitch(el('div', 'menu-lang', main));
  const partner = el('div', 'menu-partner', main);
  const symbol = el('img', '', partner);
  symbol.src = 'public/brand/logos/relica-symbol-ivory-256.png';
  symbol.alt = 'Relica';
  el('span', 'times', partner, '×');
  const spaceApps = el('img', 'space-apps', partner);
  spaceApps.src = 'public/brand/partners/space-apps-white.svg';
  spaceApps.alt = 'NASA Space Apps Challenge';

  function buildMainActions() {
    actions.textContent = '';
    grid.textContent = '';
    const saved = save.read();
    if (saved && saved.chapter > 0) {
      const name = t('chapter.' + (chapterIds[saved.chapter] ?? 'opening'));
      const cont = button('menu.continue', { iconName: 'play', onClick: () => play(saved.chapter, saved), sub: t('save.chapter', { n: saved.chapter + 1, name }) });
      cont.classList.add('btn-hero');
      actions.append(cont);
      actions.append(button('menu.new', { variant: 'secondary', onClick: confirmNew }));
    } else {
      const start = button('menu.new', { iconName: 'play', onClick: () => play(0, null) });
      start.classList.add('btn-hero');
      actions.append(start);
    }
    for (const [key, ic, fn] of [['menu.chapters', 'chapters', openChapters], ['menu.settings', 'settings', openSettings], ['menu.howto', 'keyboard', openHowTo], ['menu.credits', 'people', openCredits]]) {
      const b = button(key, { iconName: ic, variant: 'tile', onClick: fn });
      b.addEventListener('pointerenter', () => menuScene?.mood(key === 'menu.credits' ? 'happy' : 'curious'));
      grid.append(b);
    }
    for (const b of actions.querySelectorAll('.btn-hero')) b.addEventListener('pointerenter', () => menuScene?.mood('happy'));
  }

  function play(index, restore) {
    menuScene?.mood('happy', 5);
    hideMain();
    onPlay(index, { restore });
  }

  function confirmNew() {
    const body = el('div', 'confirm');
    text('p', '', 'menu.newConfirm', body);
    const row = el('div', 'sheet-actions', body);
    row.append(button('menu.yes', { onClick: () => { closeTop(); save.clear(); play(0, null); } }));
    row.append(button('menu.no', { variant: 'secondary', onClick: closeTop }));
    openSheet('menu.new', body, { small: true });
  }

  // ---------- language switch (main menu corner and Settings) ----------
  function languageSwitch(parent) {
    const box = el('div', 'segmented', parent);
    box.setAttribute('role', 'group');
    box.append(icon('globe', 'seg-icon'));
    const options = [['ar', 'العربية'], ['en', 'English']].map(([code, name]) => {
      const b = el('button', 'seg', box, name);
      b.type = 'button';
      b.lang = code;
      b.addEventListener('click', () => { sfx('mark'); prefs.set({ language: code }); });
      return [code, b];
    });
    const sync = () => options.forEach(([code, b]) => b.setAttribute('aria-pressed', String(prefs.language === code)));
    sync();
    prefs.subscribe(sync);
    return box;
  }

  // ---------- sheets (modal panels) ----------
  const layer = el('div', 'sheet-layer hidden', root);
  function openSheet(titleKey, body, { small = false, wide = false, onClose, className = '' } = {}) {
    const back = el('div', 'sheet-back' + (className ? ' ' + className : ''), layer);
    const sheet = el('section', 'sheet' + (small ? ' small' : '') + (wide ? ' wide' : ''), back);
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    const head = el('header', 'sheet-head', sheet);
    const h = text('h2', '', titleKey, head);
    h.id = 'sheet-' + Math.random().toString(36).slice(2);
    sheet.setAttribute('aria-labelledby', h.id);
    const close = el('button', 'icon-btn', head);
    close.type = 'button';
    close.dataset.tLabel = 'menu.close';
    close.setAttribute('aria-label', t('menu.close'));
    close.append(icon('close'));
    close.addEventListener('click', () => { sfx('mark'); closeTop(); });
    const scroll = el('div', 'sheet-body', sheet);
    scroll.append(body);
    back.addEventListener('pointerdown', (e) => { if (e.target === back) closeTop(); });
    const entry = { back, onClose, focus: document.activeElement };
    stack.push(entry);
    layer.classList.remove('hidden');
    requestAnimationFrame(() => (sheet.querySelector('.btn, button:not(.icon-btn), input') ?? close).focus({ preventScroll: true }));
    return entry;
  }
  function closeTop() {
    const entry = stack.pop();
    if (!entry) return;
    entry.back.remove();
    entry.onClose?.();
    if (!stack.length) layer.classList.add('hidden');
    entry.focus?.focus?.({ preventScroll: true });
    if (!stack.length && paused && !pauseEntry) resumeGame();
  }

  // ---------- Settings ----------
  function settingsBody() {
    const body = el('div', 'settings');
    // Language
    const langRow = el('div', 'set-row', body);
    text('h3', '', 'set.language', langRow);
    languageSwitch(langRow);

    // Graphics
    const gfx = el('div', 'set-block', body);
    text('h3', '', 'set.graphics', gfx);
    const choices = el('div', 'choice-row', gfx);
    choices.setAttribute('role', 'radiogroup');
    const status = el('p', 'set-status', gfx);
    status.setAttribute('role', 'status');
    const levels = ctx?.quality?.levels ?? ['low', 'medium', 'high'];
    const cards = levels.map((level) => {
      const b = el('button', 'choice', choices);
      b.type = 'button';
      b.setAttribute('role', 'radio');
      const bars = el('span', 'choice-bars', b);
      for (let i = 0; i < 3; i++) el('i', i <= levels.indexOf(level) ? 'on' : '', bars);
      text('strong', '', 'set.' + level, b);
      text('span', '', `set.${level}Info`, b);
      b.addEventListener('click', async () => {
        if (!ctx?.quality || level === ctx.quality.get()) return;
        sfx('mark');
        status.textContent = t('set.applying');
        cards.forEach(([, c]) => { c.disabled = true; });
        try { await ctx.quality.set(level); status.textContent = ''; }
        catch { status.textContent = t('set.failed'); }
        finally { cards.forEach(([, c]) => { c.disabled = false; }); sync(); }
      });
      return [level, b];
    });
    const sync = () => cards.forEach(([level, b]) => b.setAttribute('aria-checked', String(ctx?.quality?.get() === level)));
    sync();
    const unsub = ctx?.quality?.subscribe?.(sync);

    // Sound
    const snd = el('div', 'set-block', body);
    const sndHead = el('div', 'set-row', snd);
    text('h3', '', 'set.sound', sndHead);
    const mute = toggle('set.mute', () => prefs.get().muted, (on) => prefs.set({ muted: on }), sndHead);
    for (const [k, key] of [['master', 'set.master'], ['music', 'set.music'], ['voice', 'set.voice'], ['sfx', 'set.sfx']]) {
      const row = el('label', 'slider-row', snd);
      text('span', 'slider-name', key, row);
      const range = el('input', 'slider', row);
      range.type = 'range'; range.min = '0'; range.max = '100'; range.step = '1';
      const value = el('output', 'slider-value', row);
      const show = () => {
        const v = Math.round(prefs.get().volume[k] * 100);
        range.value = String(v);
        range.style.setProperty('--fill', v + '%');
        value.textContent = v + '%';
      };
      show();
      range.addEventListener('input', () => {
        prefs.set({ volume: { [k]: Number(range.value) / 100 } });
        show();
      });
      range.addEventListener('change', () => { if (k === 'voice') ctx?.audio?.beep?.('lrv'); else sfx(k === 'music' ? 'discover' : 'tick'); });
    }

    // Subtitles
    const sub = el('div', 'set-row', body);
    const words = el('div', '', sub);
    text('h3', '', 'set.subtitles', words);
    text('p', 'set-info', 'set.subtitlesInfo', words);
    toggle(null, () => prefs.get().secondary, (on) => prefs.set({ secondary: on }), sub);

    text('p', 'set-note', 'set.saved', body);
    return { body, cleanup: () => unsub?.() };
  }
  function toggle(key, get, set, parent) {
    const b = el('button', 'switch', parent);
    b.type = 'button';
    b.setAttribute('role', 'switch');
    if (key) { const l = text('span', 'switch-label', key, b); l.setAttribute('aria-hidden', 'false'); }
    el('span', 'switch-track', b).append(el('span', 'switch-knob'));
    const sync = () => b.setAttribute('aria-checked', String(get()));
    sync();
    b.addEventListener('click', () => { set(!get()); sync(); sfx('mark'); });
    return b;
  }
  function openSettings() {
    const { body, cleanup } = settingsBody();
    openSheet('menu.settings', body, { onClose: cleanup });
  }

  // ---------- How to play: the keys, drawn as a keyboard ----------
  function howToBody() {
    const body = el('div', 'howto');
    const tile = (titleKey, infoKey, keysNode) => {
      const c = el('div', 'how-tile', body);
      c.append(keysNode);
      text('strong', '', titleKey, c);
      if (infoKey) text('span', '', infoKey, c);
      return c;
    };
    const wasd = el('div', 'keys-wasd');
    for (const k of ['W', 'A', 'S', 'D']) wasd.append(keycap(k, { size: 'big' }));
    tile('how.drive', 'how.driveInfo', wasd);
    const e = el('div', 'keys-row');
    e.append(keycap('E', { size: 'big' }));
    const demo = el('span', 'hold-demo', e);
    el('span', 'hold-demo-fill', demo);
    tile('how.act', 'how.actInfo', e);
    const space = el('div', 'keys-row');
    space.append(keycap('Space', { size: 'big space' }));
    tile('how.fly', 'how.flyInfo', space);
    const enter = el('div', 'keys-row');
    enter.append(keycap('Enter', { size: 'big' }));
    tile('how.next', 'how.nextInfo', enter);
    const compass = el('div', 'keys-row');
    const dial = el('span', 'compass demo', compass);
    el('span', 'compass-dot', dial);
    tile('how.goal', 'how.goalInfo', compass);
    const small = el('div', 'how-small', body);
    for (const [k, key] of [['P', 'how.pause'], ['R', 'how.restart'], ['Esc', 'how.skip']]) {
      const r = el('div', 'how-mini', small);
      r.append(keycap(k));
      text('span', '', key, r);
    }
    return body;
  }
  function openHowTo() { openSheet('menu.howto', howToBody(), { wide: true }); }

  // ---------- Chapters ----------
  function openChapters() {
    const body = el('div', 'chapter-list');
    chapterIds.forEach((id, i) => {
      const b = el('button', 'chapter-card', body);
      b.type = 'button';
      el('span', 'chapter-num', b, String(i + 1));
      text('span', 'chapter-name', 'chapter.' + id, b);
      b.addEventListener('click', () => { sfx('mark'); closeTop(); play(i, null); });
    });
    openSheet('menu.chapters', body);
  }

  // ---------- Credits ----------
  async function creditsBody() {
    const body = el('div', 'credits-sheet');
    const c = await credits;
    text('h3', '', 'credits.team', body);
    const team = el('ul', 'team', body);
    for (const m of c.team ?? []) {
      const li = el('li', '', team);
      el('strong', '', li, pick(m.name));
      el('span', '', li, pick(m.role));
    }
    for (const block of c.credits ?? []) {
      if (block.heading === 'Made by') continue;
      el('h3', '', body, pick(block.title ?? block.heading));
      for (const line of block.lines) el('p', '', body, pick(line));
    }
    const partners = el('div', 'credit-partners', body);
    const sym = el('img', '', partners);
    sym.src = 'public/brand/logos/relica-symbol-ink-256.png';
    sym.alt = 'Relica';
    el('span', 'times', partners, '×');
    const sa = el('img', 'space-apps', partners);
    sa.src = SPACE_APPS;
    sa.alt = 'NASA Space Apps Challenge';
    return body;
  }
  async function openCredits() { openSheet('menu.credits', await creditsBody(), { wide: true }); }

  // ---------- pause menu ----------
  let pauseEntry = null;
  function pauseBody() {
    const body = el('div', 'pause-actions');
    body.append(button('menu.resume', { iconName: 'play', onClick: () => api.pause(false) }));
    body.append(button('menu.settings', { iconName: 'settings', variant: 'secondary', onClick: openSettings }));
    body.append(button('menu.howto', { iconName: 'keyboard', variant: 'secondary', onClick: openHowTo }));
    body.append(button('menu.restart', { iconName: 'restart', variant: 'secondary', onClick: () => { api.pause(false); onRestart(); } }));
    body.append(button('menu.quit', { iconName: 'home', variant: 'secondary', onClick: () => { api.pause(false); onQuit(); } }));
    return body;
  }
  function pauseGame() { if (!paused) { paused = true; ctx?.setPaused?.(true, { fromMenu: true }); ctx?.audio?.setPaused?.(true); } }
  function resumeGame() { if (paused) { paused = false; ctx?.setPaused?.(false, { fromMenu: true }); ctx?.audio?.setPaused?.(false); } }

  // ---------- in-game buttons: pause and settings, top corner ----------
  const corner = el('div', 'hud-buttons hidden', root);
  const pauseBtn = el('button', 'icon-btn round', corner);
  pauseBtn.type = 'button';
  pauseBtn.append(icon('pause'));
  pauseBtn.dataset.tLabel = 'hud.pause';
  const gearBtn = el('button', 'icon-btn round', corner);
  gearBtn.type = 'button';
  gearBtn.append(icon('settings'));
  gearBtn.dataset.tLabel = 'hud.settings';
  for (const b of [pauseBtn, gearBtn]) {
    b.addEventListener('pointerdown', (e) => e.stopPropagation()); // a click here is not "continue" in the game
    b.addEventListener('keydown', (e) => e.stopPropagation());
  }
  pauseBtn.addEventListener('click', () => { sfx('mark'); api.pause(true); });
  gearBtn.addEventListener('click', () => { sfx('mark'); pauseGame(); openSettings(); });

  // ---------- holding the game back while a menu is open ----------
  const GAME_KEYS = /^(Key[A-Z]|Digit\d|Space|Enter|Escape|Backquote|Arrow\w+)$/;
  window.addEventListener('keydown', (e) => {
    if (stack.length && e.key === 'Tab') trapFocus(e);
    if (e.code === 'Escape' && stack.length) { e.stopPropagation(); e.preventDefault(); closeTop(); return; }
    if (document.body.classList.contains('end-open')) return; // the end screen handles its own keys
    if (e.code === 'KeyP' && inGame && !mainOpen) {
      e.stopPropagation();
      if (!e.repeat) api.pause(!pauseEntry);
      return;
    }
    if (api.blocking && GAME_KEYS.test(e.code)) e.stopPropagation(); // the button's own Enter still works
  }, true);
  window.addEventListener('pointerdown', (e) => { if (api.blocking) e.stopPropagation(); }, true);
  window.addEventListener('keyup', (e) => { if (api.blocking && GAME_KEYS.test(e.code)) e.stopPropagation(); }, true);

  function trapFocus(e) {
    const sheet = stack[stack.length - 1]?.back.querySelector('.sheet');
    if (!sheet) return;
    const items = [...sheet.querySelectorAll('button:not([disabled]), input, a[href]')].filter((n) => n.offsetParent);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // Text follows the language everywhere in the shell.
  prefs.subscribe(() => {
    applyText(root);
    for (const n of root.querySelectorAll('[data-t-label]')) n.setAttribute('aria-label', t(n.dataset.tLabel));
    if (mainOpen) buildMainActions();
  });
  applyText(root);

  function hideMain() {
    mainOpen = false;
    document.body.classList.remove('menu-open');
    main.classList.add('hidden');
    menuScene?.dispose();
    menuScene = null;
  }

  const api = {
    get blocking() { return mainOpen || stack.length > 0; },
    get inMainMenu() { return mainOpen; },
    get menuScene() { return menuScene; },
    showMain(createScene) {
      while (stack.length) closeTop();
      pauseEntry = null;
      paused = false;
      inGame = false;
      corner.classList.add('hidden');
      mainOpen = true;
      document.body.classList.add('menu-open');
      buildMainActions();
      main.classList.remove('hidden');
      menuScene = createScene ? createScene() : null;
      requestAnimationFrame(() => main.querySelector('.btn-hero')?.focus({ preventScroll: true }));
    },
    setInGame(on) {
      inGame = !!on;
      corner.classList.toggle('hidden', !inGame);
    },
    pause(on) {
      if (on && !pauseEntry && inGame && !document.body.classList.contains('end-open')) {
        pauseGame();
        pauseEntry = openSheet('menu.paused', pauseBody(), { small: true, className: 'pause-overlay', onClose: () => { pauseEntry = null; resumeGame(); } });
      } else if (!on && pauseEntry) {
        while (stack.length && stack[stack.length - 1] !== pauseEntry) closeTop();
        closeTop();
      }
    },
    get paused() { return !!pauseEntry; },
    openSettings,
  };
  return api;
}
