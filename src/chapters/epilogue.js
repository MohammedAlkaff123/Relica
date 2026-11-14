// Epilogue: Pioneer 10. 1:15. No physics, the probe just drifts. See PLAN.md section 4.
//
// TODO Set A:
// - turn the dish until it points at the Sun (a small bright dot), then finish on its own
// - faint voices of the other machines while turning
// - years counter
import { makeChapter } from './_stage.js';

export default makeChapter({
  id: 'epilogue',
  world: 'space',
  character: 'pioneer',
  vehicle: null,
  card: { title: 'Far Away', sub: 'Pioneer 10 · still travelling' },
  date: 'Today',
  intro: 'ep_drift',
  objective: 'A and D to turn back toward home.  E = finish (stub)',
  memory: 'ARC-1972-AC72-2135',
  tick(dt, stage, ctx) {
    const turn = (ctx.input.down('KeyA', 'ArrowLeft') ? 1 : 0) - (ctx.input.down('KeyD', 'ArrowRight') ? 1 : 0);
    stage.hero.object.rotation.y += turn * 0.6 * dt;
  },
  async end(stage, ctx) {
    await ctx.card.show('Abandoned, but not forgotten', 'Every photo you are about to see is real.');
    if (!stage.alive) return;
    await ctx.memory.wall();
  },
});
