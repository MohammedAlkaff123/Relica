// Environment panel and objective line. Owner: Set C.
//
//   hud.setWorld('mars')            shows gravity, temperature, pressure from content/facts.json
//   hud.setStat('Sol', '4,712')     adds or updates an extra row (date, sol, distance, battery...)
//   hud.setObjective('Drive to the first science stop')   '' hides it
//
// A fact marked "verified": false in facts.json is shown with an orange "?".
// TODO Set C: verify every fact, then the "?" marks disappear on their own.
import { el } from './dom.js';

export function createHud(root, facts) {
  const panel = el('div', 'hud hidden', root);
  const title = el('h2', '', panel);
  const place = el('div', 'place', panel);
  const rows = el('div', '', panel);
  const legend = el('div', 'legend hidden', panel, '? = not yet checked against a NASA source');
  const objective = el('div', 'objective hidden', root);
  const stats = new Map();

  function row(label, value, verified = true) {
    const r = el('div', 'row', rows);
    el('span', '', r, label);
    const v = el('span', verified ? '' : 'unverified', r, value);
    return v;
  }

  function show(fact) {
    return fact.text ?? `${fact.value} ${fact.unit ?? ''}`.trim();
  }

  return {
    setWorld(name) {
      const w = facts.worlds[name];
      rows.textContent = '';
      stats.clear();
      title.textContent = w.label;
      place.textContent = w.place;
      let unverified = false;
      for (const key of ['gravity', 'temperature', 'pressure']) {
        const fact = w[key];
        if (!fact) continue;
        if (!fact.verified) unverified = true;
        row(key, show(fact), fact.verified);
      }
      legend.classList.toggle('hidden', !unverified);
      panel.classList.remove('hidden');
    },
    setStat(label, value) {
      if (!stats.has(label)) stats.set(label, row(label, ''));
      stats.get(label).textContent = value;
    },
    setObjective(text) {
      objective.textContent = text;
      objective.classList.toggle('hidden', !text);
    },
  };
}
