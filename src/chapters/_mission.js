// Mission task list for a chapter (STORY.md section 8). Owner: Set A.
//
//   const m = mission(ctx, 'Carry the crew', ['Take the crew to 3 science stops', ...])
//   m.progress(0, 1, 3)        "1 / 3" on task 0
//   m.done(0)                  tick task 0 (once)
//   m.bonus('Longest jump', '2.4 s')
//   m.discover('moon_gravity') discovery card (STORY.md section 8)
//
// Uses Set C's HUD when it exists (TASKS.md C-13, C-14):
//   hud.setMission(title, [tasks]), hud.completeTask(index), hud.setBonus(label, value), hud.discover(id)
// Until then the tasks show as extra rows on the environment panel, and discoveries only go to the console.
export function mission(ctx, title, tasks) {
  const hud = ctx.hud;
  const real = typeof hud.setMission === 'function';
  const ticked = new Set();
  const found = new Set();
  if (real) hud.setMission(title, tasks);
  else {
    hud.setStat('mission', title);
    tasks.forEach((t) => hud.setStat(t, '·'));
  }

  const m = {
    progress(i, n, of) {
      if (ticked.has(i)) return;
      if (real && hud.setTaskProgress) hud.setTaskProgress(i, n, of);
      else if (!real) hud.setStat(tasks[i], `${n} / ${of}`);
      if (n >= of) m.done(i);
    },
    done(i) {
      if (ticked.has(i)) return;
      ticked.add(i);
      if (real) hud.completeTask(i);
      else { hud.setStat(tasks[i], '✓'); if (ctx.audio.play) ctx.audio.play('tick'); }
    },
    isDone: (i) => ticked.has(i),
    bonus(label, value) {
      if (hud.setBonus) hud.setBonus(label, value);
      else hud.setStat(label, value);
    },
    discover(id) {
      if (found.has(id)) return;
      found.add(id);
      if (hud.discover) hud.discover(id);
      else console.info(`discovery card "${id}" (waiting on hud.discover from Set C)`);
    },
  };
  return m;
}
