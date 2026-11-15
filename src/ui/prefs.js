// Player preferences: language, subtitles and sound levels. Owner: Set C.
//
//   prefs.get()                       { language, secondary, volume: { master, music, voice, sfx }, muted }
//   prefs.set({ language: 'en' })     saves, updates <html lang/dir>, tells every subscriber
//   prefs.subscribe(fn)               fn(state) after each change; returns an unsubscribe function
//   pick({ en, ar })                  the text in the chosen language (falls back to the other one)
//
// Graphics quality is not here: it belongs to ctx.quality (src/core/quality.js), which saves itself.
// Storage can be blocked (private windows, kiosk browsers). The game then keeps the choices for this visit.
const KEY = 'relica.prefs.v1';
const clamp01 = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : d);

function load() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { saved = {}; }
  const browserArabic = (navigator.language || '').toLowerCase().startsWith('ar');
  const v = saved.volume || {};
  return {
    language: saved.language === 'en' || saved.language === 'ar' ? saved.language : browserArabic ? 'ar' : 'en',
    secondary: saved.secondary === true,
    muted: saved.muted === true,
    volume: { master: clamp01(v.master, 0.8), music: clamp01(v.music, 0.7), voice: clamp01(v.voice, 0.9), sfx: clamp01(v.sfx, 0.85) },
  };
}

const state = load();
// ?mute in the address starts silent without changing the saved choice (used for automated checks).
// ?lang=ar / ?lang=en picks a language for this visit only. The self-test (?test) reads the English
// prompts, so it always runs in English.
const params = new URLSearchParams(location.search);
const forcedMute = params.has('mute');
// The language kept in storage: a ?lang / ?test visit never overwrites it unless the player picks one.
let storedLanguage = state.language;
if (params.get('lang') === 'ar' || params.get('lang') === 'en') state.language = params.get('lang');
if (params.has('test')) state.language = 'en';
const listeners = new Set();

function applyDocument() {
  const root = document.documentElement;
  root.lang = state.language;
  root.dir = state.language === 'ar' ? 'rtl' : 'ltr';
}
applyDocument();

function snapshot() {
  return { ...state, volume: { ...state.volume }, muted: state.muted || forcedMute };
}

export const prefs = {
  get: snapshot,
  set(patch = {}) {
    if (patch.language === 'ar' || patch.language === 'en') state.language = storedLanguage = patch.language;
    if (typeof patch.secondary === 'boolean') state.secondary = patch.secondary;
    if (typeof patch.muted === 'boolean') state.muted = patch.muted;
    if (patch.volume) for (const k of Object.keys(state.volume)) state.volume[k] = clamp01(patch.volume[k], state.volume[k]);
    applyDocument();
    try { localStorage.setItem(KEY, JSON.stringify({ ...state, language: storedLanguage })); } catch { /* storage blocked: keep for this visit */ }
    const now = snapshot();
    for (const fn of listeners) { try { fn(now); } catch (err) { console.warn(err); } }
  },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  get language() { return state.language; },
  get rtl() { return state.language === 'ar'; },
};

export function pick(text) {
  if (text === null || text === undefined) return '';
  if (typeof text !== 'object') return String(text);
  return text[state.language] ?? text.en ?? text.ar ?? '';
}
