// Environment panel, objective line and mission list. Owner: Set C.
//
//   hud.setWorld('mars')            shows gravity, temperature, pressure from content/facts.json
//   hud.setStat('Sol', '4,712')     adds or updates an extra row (date, sol, distance, battery...)
//   hud.setObjective('Drive to the first science stop')   '' hides it
//
// Mission list (top right, STORY.md section 8):
//   hud.setMission('moon')                       title and tasks from content/missions.json
//   hud.setMission('Carry the crew', ['Take the crew to 3 science stops', ...])   or give the text directly
//   hud.completeTask(0)                          ticks off a task with a sound
//   hud.setBonus('Longest jump', '3.1 s')        a bonus line under the tasks ('' hides it)
//   hud.setMission('')                           hides the list
//
// A fact marked "verified": false in facts.json is shown with an orange "?".
import { el } from './dom.js';
import { loadJSON } from '../core/content.js';
import { sfx } from '../audio/audio.js';

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
      if (!stats.has(label)) stats.set(label, row(label, ''));
      stats.get(label).textContent = value;
    },
    setObjective(text) {
      objective.textContent = text;
      objective.classList.toggle('hidden', !text);
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
