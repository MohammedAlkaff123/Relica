// Environment panel, objective line, mission list, hold prompt and discovery cards. Owner: Set C.
//
//   hud.setWorld('mars')            shows gravity, temperature, pressure from content/facts.json
//   hud.setContext(name, place)     a mission memory: its name and place, no environment rows
//   hud.setStat('date', '1971')     adds or updates an extra row (date, sol, distance, battery...)
//   hud.setObjective('Drive to the first science stop')   '' hides it
//   hud.setBattery(0.75)            battery bar, 0..1 (null hides it)
//   hud.setCounter('sol', 4712, 90) value with a small "planned 90" beside it
//   hud.setHold({ key: 'E', text: 'Hold E: secure the samples', progress: 0.4 })   the hold prompt; null hides it
//
// Mission list (top corner, STORY.md section 8):
//   hud.setMission('moon')                       title and tasks from content/missions.json
//   hud.setMission('Carry the crew', ['Take the crew to 3 science stops', ...])   or give the text directly
//   hud.completeTask(0)                          ticks off a task with a sound
//   hud.setBonus('Longest jump', '3.1 s')        a bonus line under the tasks ('' hides it)
//   hud.setMission('')                           hides the list
//
// Discovery cards: hud.discover('moon_gravity') shows one sentence from content/discoveries.json, saved for the end.
//
// Every text is shown in the player's language (src/ui/i18n.js) and redrawn when the language changes.
// Chapters keep writing English: the HUD remembers what it was given and translates it where it draws it.
import { el } from './dom.js';
import { loadJSON } from '../core/content.js';
import { sfx } from '../audio/audio.js';
import { found } from './discoveries.js';
import { prefs, pick } from './prefs.js';
import { t, translate, holdAction, registerPairs, isolateUnits } from './i18n.js';
import { fillWithKeys, keycap } from './keys.js';

const ltr = (parent, text) => { const b = el('bdi', 'ltr', parent, text); b.dir = 'ltr'; return b; };

export function createHud(root, facts) {
  registerPairs(facts);
  const panel = el('div', 'hud hidden', root);
  const title = el('h2', '', panel);
  const place = el('div', 'place', panel);
  const rows = el('div', 'rows', panel);
  const legend = el('div', 'legend hidden', panel);
  const objective = el('div', 'objective hidden', root);
  objective.setAttribute('role', 'status');
  const stats = new Map(); // label -> { row, kind, ... }

  const mission = el('div', 'mission hidden', root);
  const missionHead = el('div', 'mission-head', mission);
  const missionLabel = el('span', 'mission-label', missionHead);
  const missionTitle = el('h2', '', mission);
  const taskList = el('ol', 'tasks', mission);
  const bonus = el('div', 'bonus hidden', mission);
  let taskItems = [];

  // Hold prompt, drawn inside the objective box: "Hold [E]", the action, and one continuous bar that turns
  // from green to red as it fills. Its text still reads "Hold E: ..." for screen readers and the self-test.
  const objText = el('span', 'objective-text', objective);
  const hold = el('div', 'hold hidden', objective);
  const holdLine = el('div', 'hold-line', hold);
  const holdVerb = el('span', 'hold-verb', holdLine);
  const holdKey = el('span', 'hold-key', holdLine);
  const holdColon = el('span', 'hold-colon', holdLine);
  const holdText = el('span', 'hold-text', holdLine);
  const holdTrack = el('div', 'hold-track', hold);
  const holdFill = el('div', 'hold-fill', holdTrack);

  // Discovery card: one line near the top, no pause.
  const discovery = el('div', 'discovery hidden', root);
  const discoveryLabel = el('div', 'discovery-label', discovery);
  const discoveryText = el('div', 'discovery-text', discovery);
  const discoverySecond = el('div', 'discovery-second', discovery);
  let discoveries = {};
  let discoveryTimer = null;
  let shownDiscovery = null;
  const discoveryQueue = [];
  loadJSON('content/discoveries.json')
    .then((data) => { discoveries = data; registerPairs(data); })
    .catch((err) => console.warn('content/discoveries.json could not be loaded', err));

  // What we were given, so a language change can redraw it.
  let holdTimer = null;
  const given = { world: null, context: null, objective: '', mission: null, bonus: null, hold: null };

  function drawDiscovery() {
    if (!shownDiscovery) return;
    discoveryLabel.textContent = t('hud.discovery');
    discoveryText.textContent = pick(shownDiscovery);
    const other = prefs.language === 'ar' ? shownDiscovery.en : shownDiscovery.ar;
    discoverySecond.textContent = prefs.get().secondary ? other ?? '' : '';
    discoverySecond.lang = prefs.language === 'ar' ? 'en' : 'ar';
  }
  // The discovery card sits just under the objective box, whatever its height (a hold prompt is taller).
  function placeDiscovery() {
    if (discovery.classList.contains('hidden') || innerWidth <= 960) { discovery.style.top = ''; return; }
    const box = objective.classList.contains('hidden') ? null : objective.getBoundingClientRect();
    discovery.style.top = (box && box.height ? box.bottom + 12 : 16) + 'px';
  }
  function nextDiscovery() {
    if (discoveryTimer || !discoveryQueue.length) return;
    shownDiscovery = discoveryQueue.shift();
    drawDiscovery();
    discovery.classList.remove('hidden', 'out');
    placeDiscovery();
    sfx('discover');
    discoveryTimer = setTimeout(() => {
      discovery.classList.add('out');
      discoveryTimer = setTimeout(() => {
        discovery.classList.add('hidden');
        discoveryTimer = null;
        shownDiscovery = null;
        nextDiscovery();
      }, 400);
    }, 5000);
  }

  // The mission texts load in the background, so the HUD is ready at once.
  let missions = null;
  let pendingMission = null;
  loadJSON('content/missions.json')
    .then((data) => {
      missions = data;
      registerPairs(data);
      if (pendingMission) { const id = pendingMission; pendingMission = null; showMission(id); }
    })
    .catch((err) => console.warn('content/missions.json could not be loaded', err));

  function row(label, value, verified = true) {
    const r = el('div', 'row', rows);
    el('span', 'row-label', r, translate(label));
    const v = el('span', 'row-value' + (verified ? '' : ' unverified'), r);
    if (value !== undefined) ltr(v, value);
    r.dataset.label = label;
    return v;
  }
  function removeRow(label) {
    const s = stats.get(label);
    if (s) s.row.remove();
    stats.delete(label);
  }
  const factText = (fact) => fact.text ? isolateUnits(translate(fact.text)) : `${fact.value} ${fact.unit ?? ''}`.trim();

  function drawWorld() {
    const name = given.world;
    if (!name) return;
    const w = facts.worlds[name];
    title.textContent = translate(w.label);
    place.textContent = translate(w.place);
    for (const r of [...rows.querySelectorAll('.row.fact')]) r.remove();
    let unverified = false;
    const first = rows.firstChild;
    for (const key of ['gravity', 'temperature', 'pressure']) {
      const fact = w[key];
      if (!fact) continue;
      if (!fact.verified) unverified = true;
      const r = el('div', 'row fact');
      el('span', 'row-label', r, translate(key));
      const v = el('span', 'row-value' + (fact.verified ? '' : ' unverified'), r);
      if (fact.text) v.textContent = factText(fact); else ltr(v, factText(fact));
      if (!fact.verified) v.title = t('hud.unverified');
      rows.insertBefore(r, first);
    }
    legend.textContent = t('hud.unverified');
    legend.classList.toggle('hidden', !unverified);
  }

  function drawObjective() {
    if (given.hold) return drawHold();
    const text = given.objective ? isolateUnits(translate(given.objective)) : '';
    hold.classList.add('hidden');
    // Hidden text still counts as text: empty the hold line so the objective reads only the objective.
    holdVerb.textContent = holdKey.textContent = holdColon.textContent = holdText.textContent = '';
    objText.classList.remove('hidden');
    objective.classList.remove('holding');
    fillWithKeys(objText, text);
    objective.classList.toggle('hidden', !text);
    placeDiscovery();
  }

  function drawHold() {
    const h = given.hold;
    if (!h) return drawObjective();
    objText.classList.add('hidden');
    objText.textContent = '';
    hold.classList.remove('hidden');
    holdColon.textContent = prefs.language === 'ar' ? ' ' : ': ';
    objective.classList.remove('hidden');
    objective.classList.add('holding');
    holdVerb.textContent = t('hud.hold') + ' ';
    holdKey.textContent = '';
    holdKey.append(keycap(h.key ?? 'E', { size: 'big' }));
    holdText.textContent = holdAction(h.text);
    const p = Math.max(0, Math.min(1, h.progress ?? 0));
    holdFill.style.width = (p * 100).toFixed(1) + '%';
    // Green when the press starts, through amber, to red when the action is confirmed.
    holdFill.style.background = `hsl(${(130 - 125 * p).toFixed(0)} 62% 46%)`;
    objective.classList.toggle('pressing', !!h.pressing);
    objective.classList.toggle('confirmed', p >= 1);
    placeDiscovery();
  }

  function fillMission(heading, tasks, bonusLabel) {
    missionLabel.textContent = t('hud.mission');
    missionTitle.textContent = pick(heading);
    const done = taskItems.map((li) => li.classList.contains('done'));
    taskList.textContent = '';
    taskItems = tasks.map((task, i) => {
      const li = el('li', done[i] ? 'done' : '', taskList);
      el('span', 'check', li).setAttribute('aria-hidden', 'true');
      fillWithKeys(el('span', 'task-text', li), pick(task));
      return li;
    });
    bonus.dataset.label = pick(bonusLabel) ?? '';
    mission.classList.remove('hidden');
  }

  function showMission(id) {
    if (!missions) { pendingMission = id; return; }
    const m = missions[id];
    if (!m) { console.warn(`mission "${id}" is missing from content/missions.json`); return; }
    given.mission = { id };
    taskItems = [];
    fillMission(m.title, m.tasks, m.bonus);
    bonus.classList.add('hidden');
  }

  function drawStats() {
    for (const [label, s] of stats) {
      const name = s.row.querySelector('.row-label');
      if (name) name.textContent = translate(label);
      if (s.kind === 'stat' && s.raw !== undefined) setValue(s, s.raw);
      if (s.kind === 'counter') drawCounter(s);
    }
  }
  function setValue(s, value) {
    s.raw = value;
    const shown = isolateUnits(translate(String(value)));
    s.value.textContent = '';
    if (/[؀-ۿ]/.test(shown)) s.value.textContent = shown; else ltr(s.value, shown);
  }
  function drawCounter(c) {
    c.num.textContent = typeof c.value === 'number' ? c.value.toLocaleString('en') : String(c.value);
    const hasPlan = c.planned !== undefined && c.planned !== null;
    c.plan.textContent = hasPlan ? t('hud.planned', { n: typeof c.planned === 'number' ? c.planned.toLocaleString('en') : c.planned }) : '';
    c.row.classList.toggle('passed', hasPlan && Number(c.value) > Number(c.planned));
  }

  prefs.subscribe(() => {
    if (given.world) drawWorld();
    if (given.context) { title.textContent = translate(given.context[0]); place.textContent = translate(given.context[1]); }
    drawStats();
    drawObjective();
    if (given.mission?.id && missions?.[given.mission.id]) {
      const m = missions[given.mission.id];
      fillMission(m.title, m.tasks, m.bonus);
    } else if (given.mission?.title) fillMission(given.mission.title, given.mission.tasks);
    if (given.bonus) api.setBonus(...given.bonus);
    drawDiscovery();
  });

  const api = {
    setWorld(name) {
      given.world = name;
      given.context = null;
      rows.textContent = '';
      stats.clear();
      drawWorld();
      panel.classList.remove('hidden');
    },
    // A mission memory can show its date and purpose without borrowing another location's environment.
    setContext(name, location) {
      given.world = null;
      given.context = [name, location];
      title.textContent = translate(name);
      place.textContent = translate(location);
      rows.textContent = '';
      stats.clear();
      legend.classList.add('hidden');
      panel.classList.remove('hidden');
    },
    setStat(label, value) {
      let s = stats.get(label);
      if (!s || s.kind !== 'stat') {
        removeRow(label);
        const v = row(label);
        s = { row: v.parentNode, value: v, kind: 'stat' };
        stats.set(label, s);
      }
      setValue(s, value);
    },
    setObjective(text) {
      given.objective = text || '';
      drawObjective();
    },
    setHold(state) {
      clearTimeout(holdTimer);
      given.hold = state || null;
      drawHold();
      // A finished hold stays red for a moment, so the player sees it was accepted.
      if (state?.confirmed) {
        const mine = state;
        holdTimer = setTimeout(() => { if (given.hold === mine) { given.hold = null; drawObjective(); } }, 450);
      }
    },

    // Battery as a bar, 0 = empty, 1 = full. null hides it.
    setBattery(level) {
      if (level === null) { removeRow('battery'); return; }
      const v = Math.max(0, Math.min(1, Number(level) || 0));
      let b = stats.get('battery');
      if (!b || b.kind !== 'battery') {
        removeRow('battery');
        const r = el('div', 'row battery', rows);
        el('span', 'row-label', r, translate('battery'));
        const cell = el('span', 'row-value', r);
        const track = el('span', 'bar', cell);
        const fill = el('span', 'fill', track);
        const pct = el('bdi', 'pct', cell);
        pct.dir = 'ltr';
        b = { row: r, kind: 'battery', fill, pct };
        stats.set('battery', b);
      }
      b.fill.style.width = (v * 100).toFixed(1) + '%';
      b.pct.textContent = Math.round(v * 100) + '%';
      b.row.classList.toggle('low', v < 0.2);
    },

    // A counter with its planned number beside it: setCounter('sol', 4712, 90) -> "4,712  planned 90".
    // Once the value passes the plan, the planned label turns copper. Nobody comments on it.
    setCounter(label, value, planned) {
      let c = stats.get(label);
      if (!c || c.kind !== 'counter') {
        removeRow(label);
        const r = el('div', 'row counter', rows);
        el('span', 'row-label', r, translate(label));
        const cell = el('span', 'row-value', r);
        const num = el('bdi', 'num', cell);
        num.dir = 'ltr';
        const plan = el('span', 'planned', cell);
        c = { row: r, kind: 'counter', num, plan };
        stats.set(label, c);
      }
      c.value = value;
      c.planned = planned;
      drawCounter(c);
    },

    setMission(titleOrId, tasks) {
      pendingMission = null;
      if (!titleOrId) { given.mission = null; mission.classList.add('hidden'); return; }
      if (Array.isArray(tasks)) { given.mission = { title: titleOrId, tasks }; taskItems = []; fillMission(titleOrId, tasks); bonus.classList.add('hidden'); }
      else showMission(titleOrId);
    },
    completeTask(index) {
      const item = taskItems[index];
      if (!item || item.classList.contains('done')) return;
      item.classList.add('done');
      sfx('tick');
    },
    // Shows a discovery card and saves it for the end screen. Each id shows once.
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
      given.bonus = [label, value];
      bonus.textContent = '';
      if (value === '' || value === null) { given.bonus = null; bonus.classList.add('hidden'); return; }
      el('span', '', bonus, translate(label));
      ltr(bonus, String(value));
      bonus.classList.remove('hidden');
    },
  };
  return api;
}
