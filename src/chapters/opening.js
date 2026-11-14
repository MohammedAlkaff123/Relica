// Opening: the factory. 0:45. The rover opens its eyes and learns to drive. See PLAN.md section 4.
//
// TODO Set A:
// - wheel test on a stand = the driving tutorial (W/S, A/D)
// - "folded and packed": fade to black, launch rumble (camera shake + sound), then next chapter
// - memory photos S71-16722 and S71-30542 need copying into public/nasa first (they are in the pack)
import { makeChapter } from './_stage.js';

export default makeChapter({
  id: 'opening',
  world: 'factory',
  character: 'lrv',
  vehicle: 'rover',
  card: { title: 'RELICA', sub: 'Press Enter to wake up' },
  date: '1971',
  intro: 'ch0_wake',
  objective: 'Try your wheels: W A S D to drive, Space to hop.  E = finish chapter (stub)',
});
