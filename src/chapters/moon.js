// Chapter 1: the Moon. 3:00. Apollo 17 Lunar Roving Vehicle. See PLAN.md section 4.
//
// TODO Set A:
// - Lunar Module and two astronauts (mirror visors) as props; they ride along
// - three science stops as trigger zones, with a marker on each
// - fender event: dust showers the rover until the "repair", then memory.show('as17-137-20979')
// - ending: park, the crew lifts off, the rover looks up (hero.setEmotion('sad'))
// - HUD: distance driven with ctx.hud.setStat('driven', ...)
import { makeChapter } from './_stage.js';

export default makeChapter({
  id: 'moon',
  world: 'moon',
  character: 'lrv',
  vehicle: 'rover',
  card: { title: 'The Moon', sub: 'Taurus–Littrow valley · December 1972' },
  date: 'Dec 1972',
  intro: 'ch1_intro',
  objective: 'Drive in one-sixth gravity. Space to hop.  E = finish chapter (stub)',
  outro: 'ch1_left_behind',
  memory: 'as17-137-20979',
  cutscene: 'moon_to_mars',
  tick(dt, stage, ctx) {
    stage.driven = (stage.driven ?? 0) + stage.controller.speed * dt;
    ctx.hud.setStat('driven', stage.driven.toFixed(0) + ' m');
  },
});
