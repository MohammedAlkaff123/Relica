// Environment panel, objective line and mission list. Owner: Set C.
//
//   hud.setWorld('mars')            shows gravity, temperature, pressure from content/facts.json
//   hud.setStat('Sol', '4,712')     adds or updates an extra row (date, sol, distance, battery...)
//   hud.setObjective('Drive to the first science stop')   '' hides it
//   hud.setBattery(0.75)            battery bar, 0..1 (null hides it)
//   hud.setCounter('sol', 4712, 90) value with a small "planned: 90" beside it
//
// Mission list (top right, STORY.md section 8):
//   hud.setMission('moon')                       title and tasks from content/missions.json
//   hud.setMission('Carry the crew', ['Take the crew to 3 science stops', ...])   or give the text directly
//   hud.completeTask(0)                          ticks off a task with a sound
//   hud.setBonus('Longest jump', '3.1 s')        a bonus line under the tasks ('' hides it)
//   hud.setMission('')                           hides the list
//
// Discovery cards (STORY.md section 8):
//   hud.discover('moon_gravity')   one sentence from content/discoveries.json for four seconds, saved for the end
//
// A fact marked "verified": false in facts.json is shown with an orange "?".
import { el } from './dom.js';
import { loadJSON } from '../core/content.js';
import { sfx } from '../audio/audio.js';
import { found } from './discoveries.js';

export function createHud(root, facts) {
  const panel = el('div', 'hud hidden', root);
  const title = el('h2', '', panel);
  const place = el('div', 'place', panel);
  const rows = el('div', '', panel);
  const legend = el('div', 'legend hidden', panel, '? = not yet checked against a NASA source');
  const objective = el('div', 'objective hidden', root);
  const stats = new Map();

  const mission = el('div', 'mission hidden', root);
  const missionTitle = el('h2', '', mission);
  const taskList = el('ol', 'tasks', mission);
  const bonus = el('div', 'bonus hidden', mission);
  let taskItems = [];

  // Discovery card: one line at the bottom, no pause.
  const discovery = el('div', 'discovery hidden', root);
  const discoveryEn = el('div', 'en', discovery);
  const discoveryAr = el('div', 'ar', discovery);
  discoveryAr.lang = 'ar';
  discoveryAr.dir = 'rtl';
  let discoveries = {};
  let discoveryTimer = null;
  const discoveryQueue = [];
  loadJSON('content/discoveries.json')
    .then((data) => { discoveries = data; })
    .catch((err) => console.warn('content/discoveries.json could not be loaded', err));

  function nextDiscovery() {
    if (discoveryTimer || !discoveryQueue.length) return;
    const card = discoveryQueue.shift();
    discoveryEn.textContent = card.en;
    discoveryAr.textContent = card.ar ?? '';
    discovery.classList.remove('hidden', 'out');
    sfx('discover');
    discoveryTimer = setTimeout(() => {
      discovery.classList.add('out');
      discoveryTimer = setTimeout(() => {
        discovery.classList.add('hidden');
        discoveryTimer = null;
        nextDiscovery();
      }, 400);
    }, 4000);
  }

  // The mission texts load in the background, so the HUD is ready at once.
  let missions = null;
  let pendingMission = null;
  loadJSON('content/missions.json')
    .then((data) => {
      missions = data;
      if (pendingMission) { const id = pendingMission; pendingMission = null; showMission(id); }
    })
    .catch((err) => console.warn('content/missions.json could not be loaded', err));

  function row(label, value, verified = true) {
    const r = el('div', 'row', rows);
    el('span', '', r, label);
    const v = el('span', verified ? '' : 'unverified', r, value);
    return v;
  }

  // Extra rows (setStat, setBattery, setCounter) share one map by label, so a label can change type.
  function removeRow(label) {
    const s = stats.get(label);
    if (s) s.row.remove();
    stats.delete(label);
  }

  function show(fact) {
    return fact.text ?? `${fact.value} ${fact.unit ?? ''}`.trim();
  }

  function fillMission(heading, tasks, bonusLabel) {
    missionTitle.textContent = heading;
    taskList.textContent = '';
    taskItems = tasks.map((text) => el('li', '', taskList, text));
    bonus.dataset.label = bonusLabel ?? '';
    bonus.classList.add('hidden');
    mission.classList.remove('hidden');
  }

  function showMission(id) {
    if (!missions) { pendingMission = id; return; }
    const m = missions[id];
    if (!m) { console.warn(`mission "${id}" is missing from content/missions.json`); return; }
    fillMission(m.title.en, m.tasks.map((t) => t.en), m.bonus?.en);
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
      let s = stats.get(label);
      if (!s || !s.value) {
        removeRow(label);
        const value = row(label, '');
        s = { row: value.parentNode, value };
        stats.set(label, s);
      }
      s.value.textContent = value;
    },
    setObjective(text) {
      objective.textContent = text;
      objective.classList.toggle('hidden', !text);
    },

    // Battery as a bar, 0 = empty, 1 = full. null hides it.
    setBattery(level) {
      if (level === null) { removeRow('battery'); return; }
      const v = Math.max(0, Math.min(1, Number(level) || 0));
      let b = stats.get('battery');
      if (!b || !b.bar) {
        removeRow('battery');
        const r = el('div', 'row battery', rows);
        el('span', '', r, 'battery');
        const cell = el('span', '', r);
        const track = el('span', 'bar', cell);
        const fill = el('span', 'fill', track);
        const pct = el('span', 'pct', cell);
        b = { row: r, bar: true, fill, pct };
        stats.set('battery', b);
      }
      b.fill.style.width = (v * 100).toFixed(1) + '%';
      b.pct.textContent = Math.round(v * 100) + '%';
      b.row.classList.toggle('low', v < 0.2);
    },

    // A counter with its planned number beside it: setCounter('sol', 4712, 90) -> "4,712  planned: 90".
    // Once the value passes the plan, the planned label turns gold. Nobody comments on it.
    setCounter(label, value, planned) {
      let c = stats.get(label);
      if (!c || !c.counter) {
        removeRow(label);
        const r = el('div', 'row counter', rows);
        el('span', '', r, label);
        const cell = el('span', '', r);
        const num = el('span', 'num', cell);
        const plan = el('span', 'planned', cell);
        c = { row: r, counter: true, num, plan };
        stats.set(label, c);
      }
      c.num.textContent = typeof value === 'number' ? value.toLocaleString('en') : String(value);
      const hasPlan = planned !== undefined && planned !== null;
      c.plan.textContent = hasPlan ? `planned: ${typeof planned === 'number' ? planned.toLocaleString('en') : planned}` : '';
      c.row.classList.toggle('passed', hasPlan && Number(value) > Number(planned));
    },

    setMission(titleOrId, tasks) {
      pendingMission = null;
      if (!titleOrId) { mission.classList.add('hidden'); return; }
      if (Array.isArray(tasks)) fillMission(titleOrId, tasks);
      else showMission(titleOrId);
    },
    completeTask(index) {
      const item = taskItems[index];
      if (!item || item.classList.contains('done')) return;
      item.classList.add('done');
      sfx('tick');
    },
    // Shows a discovery card for four seconds and saves it for the end screen. Each id shows once.
    discover(id) {
      if (found.some((d) => d.id === id)) return;
      const card = discoveries[id];
      if (!card) { console.warn(`discovery "${id}" is missing from content/discoveries.json`); return; }
      const entry = { id, en: card.en, ar: card.ar, source: card.source };
      found.push(entry);
      discoveryQueue.push(entry);
      nextDiscovery();
    },
    // Everything discovered so far, in order: [{ id, en, ar, source }]
    get discoveries() { return found.slice(); },

    setBonus(label, value) {
      if (value === undefined) { value = label; label = bonus.dataset.label || 'Bonus'; }
      bonus.textContent = '';
      if (value === '' || value === null) { bonus.classList.add('hidden'); return; }
      el('span', '', bonus, label);
      el('span', '', bonus, String(value));
      bonus.classList.remove('hidden');
    },
  };
}
