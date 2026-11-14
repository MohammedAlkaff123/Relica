# Test log

Owner: Mohammed. Updated 14 November 2026. Automated checks below used headless Microsoft Edge, 1280×800, software WebGL and the repository’s Three/Rapier versions. They are functional checks, not FPS or human usability measurements.

## Blockers fixed in this pass

- Ingenuity could exhaust its battery off-pad and repeatedly spend each tiny recharge while Space stayed held. It now spins down and recharges to 35%, with a visible status, then permits lift. A forced-zero-battery keyboard check recovered without releasing Space.
- The initial terrain self-test sometimes queried a newly created Rapier world before its first physics step. The harness now waits for the step before casting its 80 rays; both terrain checks pass.

## Automated result

`?test&speed=8`: **41 passed, 0 failed**, zero browser exceptions, zero missing game assets. Raw results: [tests/directors-selftest.json](tests/directors-selftest.json).

All five chapters complete. Moon samples, all five Opportunity tasks, all three water clues, sunlight loss and stopped movement with W held, Ingenuity scouting/final crash, Pioneer capture-before-send and the ending pass. Twenty rapid chapter jumps leave no extra scene objects.

Additional browser checks passed: camera-relative arrow in all four directions and arrival; out-of-frame photo rejection; A/D/W/S framing of all three historical views; real image loading/fade/Enter restoration; restart in a viewfinder; Viking and Opportunity cuts more than 100 metres apart; steady Viking camera; moving look target; hard cuts; anchor rotation; cancellation before a shot fetch finishes; zero-battery takeoff recovery.

## Chapter timings

| Chapter | Automated game seconds | Human stopwatch target | Human measured |
|---|---:|---|---|
| Opening | 46 | 0:45 | Pending |
| Moon | 159 | 3:00 | Pending |
| Mars, including Viking memory | 246 | 4:00 | Pending |
| Mars sky | 198 | 3:00 | Pending |
| Epilogue | 60 | 1:15 | Pending |
| Total | 709 (11:49) | About 12–13 minutes | Pending |

This final run includes main 21deaa0 (jointed figures, crew positions and rover seats), all new cameras, and the split storm dialogue. The bot skips reading, uses accelerated game time, and takes different travel paths; these numbers do not predict a first player’s reading time. Old 11:52 paper totals predate the added mission/photo tasks. Record a real run before claiming the pacing target met.

## Ugly / teammate work

- Main 21deaa0 adds jointed astronaut/worker breathing, walking, climbing and sitting. Preserved in the integration. Collection, repair, reassurance and farewell gestures still need specific animation and review.
- Photo sets preserve major framing cues with simple geometry; detailed instrument shape and rock distribution need Abdulkarim’s art pass.
- Some chapter objective/status strings remain English while main dialogue/cards are bilingual; Abdullatif owns the final localization pass.
- Review media is a silent staged montage of rendered gameplay, not a continuous run or final submission video.

## Human checks to record

- [ ] Moayad: final camera/art approval with completed models.
- [ ] Mohammed: new player finishes every mission without coaching; log exact confusing text.
- [ ] Mohammed + Abdulkarim: fresh viewer’s response to the Moon farewell.
- [ ] Abdullatif + Mohammed: Arabic/English read-through and subtitles.
- [ ] Whole team: actual laptop frame rate with `?fps`, sound balance and reduced-speed walkthrough.
- [ ] Mohammed + Moayad: two timed 5–7 minute pitch rehearsals.
- [ ] Owner: public play link, review media access, event form and final submission.

Append new findings with severity, chapter, reproduction steps, owner and retest result. Do not erase teammates’ findings when updating this log.
