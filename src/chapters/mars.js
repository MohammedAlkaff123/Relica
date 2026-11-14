// Chapter 2: Mars. 3:30. Opportunity. See PLAN.md section 4.
//
// TODO Set A:
// - airbag bounce landing before the player gets control
// - battery that charges in sunlight and drains while driving; dust on the panels slows charging
// - a rock to grind, then memory.show('PIA20285')
// - the Viking radio call at sunset. Viking is far away, so show it as a radio call, never side by side
// - 2018 dust storm: sky darkens, battery drops, controls fade, hero.setEmotion('sleepy')
// The sol counter below is only a placeholder for the real pacing.
import { makeChapter } from './_stage.js';

export default makeChapter({
  id: 'mars',
  world: 'mars',
  character: 'opportunity',
  vehicle: 'rover',
  card: { title: 'Mars', sub: 'Meridiani Planum · planned mission: 90 sols' },
  date: 'Jan 2004',
  intro: 'ch2_intro',
  objective: 'Explore. The mission was planned for 90 sols.  E = finish chapter (stub)',
  outro: 'ch2_viking_call',
  memory: 'PIA07108',
  cutscene: 'storm_to_jezero',
  tick(dt, stage, ctx) {
    stage.sol = (stage.sol ?? 1) + dt * 20; // placeholder speed
    ctx.hud.setStat('sol', Math.floor(stage.sol).toLocaleString('en') + ' / 90 planned');
  },
});
