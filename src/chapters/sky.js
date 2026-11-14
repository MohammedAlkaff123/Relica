// Chapter 3: the Mars sky. 2:30. Ingenuity. See PLAN.md section 4.
//
// TODO Set A:
// - drop from under the rover (Perseverance as a simple silhouette prop)
// - three flights with waypoints; battery limits each flight; counter "planned: 5" runs to 72
// - last flight over smooth sand: forced hard landing, a blade breaks, hero.setEmotion('sad')
// - the rover drives away
import { makeChapter } from './_stage.js';

export default makeChapter({
  id: 'sky',
  world: 'mars',
  character: 'ingenuity',
  vehicle: 'heli',
  cameraScale: 0.6,
  card: { title: 'The Mars Sky', sub: 'Jezero crater · planned: 5 flights' },
  date: 'Apr 2021',
  intro: 'ch3_intro',
  objective: 'Hold Space to climb, W A S D to fly.  E = finish chapter (stub)',
  outro: 'ch3_grounded',
  memory: 'PIA23882',
  cutscene: 'mars_to_space',
  tick(dt, stage, ctx) {
    ctx.hud.setStat('altitude', Math.max(0, stage.hero.object.position.y - stage.hero.half[1]).toFixed(1) + ' m');
  },
});
