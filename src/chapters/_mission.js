// Mission task list and discovery cards for a chapter (STORY.md section 8). Owner: Set A.
//
//   const m = mission(ctx, 'moon')   title and tasks come from content/missions.json (Set C)
//   m.progress(0, 1, 3)              counts toward task 0; ticks it at 3 / 3
//   m.done(0)                        ticks task 0 (once)
//   m.bonus('2.4 s')                 the bonus line (the longest jump)
//   m.discover('moon_gravity')       discovery card from content/discoveries.json
//
// Task numbers follow the order in content/missions.json. If Set C changes that order, change the
// numbers in the chapter file too.
export function mission(ctx, id) {
  const hud = ctx.hud;
  const ticked = new Set();
  const found = new Set();
  hud.setMission(id);

  const m = {
    progress(i, n, of) {
      if (n >= of) m.done(i);
    },
    done(i) {
      if (ticked.has(i)) return;
      ticked.add(i);
      hud.completeTask(i);
    },
    isDone: (i) => ticked.has(i),
    bonus(value) { hud.setBonus(value); },
    discover(card, opts) {
      if (found.has(card)) return;
      found.add(card);
      hud.discover(card, opts);
    },
    found,
  };
  return m;
}

// A verified number from content/facts.json "missions" (Set C), e.g. factNumber(ctx, 'opportunity_planned', 90).
// Uses the fallback (and says so in the console) if the fact is missing or not yet verified.
export function factNumber(ctx, key, fallback) {
  const f = ctx.facts.missions?.[key];
  if (!f?.verified) { console.warn(`fact "${key}" is not verified in facts.json, using ${fallback}`); return fallback; }
  const n = String(f.value).replace(/,/g, '').match(/\d+(\.\d+)?/);
  return n ? Number(n[0]) : fallback;
}
