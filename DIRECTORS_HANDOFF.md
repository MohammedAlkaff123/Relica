# Directors’ implementation and team handoff

## Approved title and interface direction — 14 November

**RELICA: Still Here — ريليكا: ما زلتُ هنا** is the approved game name. The challenge name is separate. Browser title and the existing title card now use it; this is not the final logo or completed main menu.

See [BRANDING_AND_ART_DIRECTION.md](BRANDING_AND_ART_DIRECTION.md) for the actionable brief. Abdullatif owns the logo, bilingual branding, a real main menu with a visible Arabic/English selector, and a unified redesign of the existing interface. Ziad supports menu/pause/input integration. These remain OPEN; prior functional UI delivery did not mean final visual design was complete.

Three environment-style concepts have been shown to the directors: A Warm Explorer, B Quiet Frontier, C Cosmic Cinema. **Style selection is PENDING.** B is a recommendation only. Do not begin a texture/lighting/particle overhaul from an unapproved option. After selection, attach the selected reference here and record the choice before Abdulkarim implements it. Existing animation and photo-scene tasks remain active.


Updated 14 November 2026 for Moayad and Mohammed. This is the current status; older milestone schedules in TASKS/PLAN are planning history. Camera and mission code is implemented and browser-tested. The concurrent main commit 21deaa0 (jointed figures, crew placement and wider rover seats) is preserved in this integration. Human creative approval, novice playtesting and event submission are not claimed as complete.

## Moayad

| Task | Status and evidence | Remaining acceptance |
|---|---|---|
| CAM-1 shot list | Implemented shot grammar and 21 shot files; current staging below | Review the build together; no group announcement has been sent |
| CAM-2 talk camera | Automatic front three-quarter speaker camera and release in dialogue.js | Check framing with final revised models |
| CAM-3 machine cameras | Individual tuning profiles; Moon hop lift/FOV, Mars storm closing, idle look-back | Feel review on the presentation laptop |
| CAM-4 player | Hard cuts, live named targets, local coordinates, fades, roll, emotion/sound events, year counter; cancellation tested | Focus blur intentionally omitted |
| CAM-5 authored shots | All story shot IDs have authored data; chapter transitions and key scene shots integrated | Artist pass can refine poses without replacing the camera API |
| CAM-6 Viking | Reader-paced cutscene between separate locations; Viking locked, Opportunity handheld; fiction label | Review both languages aloud |
| CAM-7 look | Model/framing inspection completed for implemented shots and photo sets | Abdulkarim’s concurrent jointed-figure update is integrated; task-specific gestures still need review |
| CAM-8 video | 30-second silent build-review montage with English captions in pitch/; captured renderer footage | Review the actual cut and make the final performance/audio recording after final gesture/audio review; approve submission use |
| CAM-9 inserts | Nine extra files authored; final voices use separate worlds and speaker-driven cuts | Emotional effect requires a fresh viewer |

## Mohammed

| Task | Status and evidence | Remaining acceptance |
|---|---|---|
| DIR-1 story | Requested mission-first chapters, Ingenuity fighter arc, Pioneer service and imagined reunion, historical corrections implemented | Read the revised lines aloud with Abdullatif |
| DIR-2 repository | Code ready for the requested main merge; public repo | Repository owner checks collaborators and enables Pages; connector exposes no administration action. No group message sent |
| DIR-3 feel | Per-machine camera tuning, storm slowing and helicopter recharge recovery implemented | Human feel tuning; automated physics is not a fun test |
| DIR-4 tests | Full browser playthrough: 41 passed, 0 failed; targeted camera/navigation/photo/recharge checks passed | Repeat on the actual demo laptop |
| DIR-5 pacing | Automated chapter timing recorded in TESTLOG; travel objectives have explicit purpose | Stopwatch a first-player run; aim 12–13 minutes and shorten travel if needed |
| DIR-6 cuts | Focus blur omitted; simplified photo geometry and representative scouting route explicitly documented | Any further scope cuts belong in a team decision |
| DIR-7 emotion | Expressions and separate final-world staging wired into scenes | Fresh-player Moon farewell test with Abdulkarim |
| DIR-8 pitch | Seven editable slides, source notes, approximately 5:50 script and Q&A prepared in pitch/ | Confirm speaker/demo roles and rehearse twice |
| DIR-9 upload | Summary, data mapping, references and review media assembled | Owner enables live link; Mohammed/Abdullatif complete the event form and submission |
| DIR-10 fun | Navigation and science-action text clarified; chapters tested to completion | Observe a new player in every mission; log confusion without coaching |

## What the other teammates can work on now

| Owner | Next concrete work | Integration contract / acceptance |
|---|---|---|
| Abdulkarim | Basic breathing, walking, climbing and sitting are integrated from main 21deaa0. Add explicit collect, repair, reassurance and farewell actions | The new procedural figures preserve named joints and animate movement automatically. Keep that behavior; provide an action hook or named clips to Ziad for task-specific performances |
| Ziad | Preserve automatic movement/boarding animation; bind new collection, repair and farewell actions when supplied | No T-pose during those actions; restart and chapter jumps stop mixers. Keep camera bindings `lunarModule`, `ascent`, `hero` and reader-paced conversations |
| Abdulkarim | Refine the three photo environments against their original references, including arm/strut silhouettes and rock distribution | Keep `content/photo_tasks.json` viewpoints and honest “recreated” label. Existing geometry matches major composition cues, not every rock |
| Abdullatif | Final Arabic/English read-through, subtitle and audio review | Preserve source/date distinctions, the small fiction labels and Enter-to-continue behavior; localize remaining chapter objective strings |
| Moayad + Mohammed | Review final art, actual laptop FPS, fresh-player comprehension, timing, pitch rehearsal and final media | Record the reviewer, date and results in TESTLOG; do not mark these done from an automated test |

## Camera and scene contracts

- `followCam.setProfile(character)` selects `content/tuning.json.cameraProfiles`; `talkTo` and `release` are managed by dialogue.
- Timed shot positions are relative to their start anchor; `local: true` rotates them with it. `look: "ascent"` tracks the bound moving object. `cut: true` holds the previous pose until the cut key.
- `cinematics.conversation(id, dialogueId, anchor, bindings, dialogue)` changes camera when the dialogue changes line. The Moon farewell has three poses; Viking has two speakers; remembrance has four distinct worlds. Text is never advanced by a shot timer.
- Escape cancels camera playback; R/chapter jumps cancel pending loads and restore the gameplay camera. Dialogue can still be continued with Enter after a camera skip.
- Photo tasks lock movement, use A/D and W/S framing, accept Space only when aligned, fade to the credited original and restore the chapter on Enter. Restart disposes the viewfinder and temporary scene.
- Travel navigation uses camera-relative bearings, including “Behind you,” distance and arrival instructions. It hides behind dialogue, photos and cutscenes.

## Mission continuity and historical boundaries

1. Apollo 17: carry crew and sample boxes. The fender incident is compressed; the real break happened at the lander on EVA 1 and its map/clamp replacement was installed before EVA 2. The crew collected the samples, not the rover autonomously.
2. Opportunity: investigate hematite spheres, jarosite and cross-lamination as 2004 evidence of past liquid water. Potts (2016) and Orion (2017) are later photography tasks, not the 2004 water discovery. Dust blocks sunlight in June 2018 and power falls before the last-contact card.
3. Viking: take its documented 1 August 1976/sol 12 view, then deliver a soil sample to the biology experiments. No definitive life discovery is claimed. First successful U.S. Mars landing is the accurate milestone. The later Opportunity conversation is imagined.
4. Ingenuity: demonstration, extended scouting flights 6/7 (representative compressed routes), recovery, montage through 71, then flight 72 and loss of lift. Five planned / 72 completed appears in the service tribute. The wobble and rotor twitch are dramatic staging, not telemetry reconstruction.
5. Pioneer 10: a dated December 1973 Jupiter image task and Earth transmission precede the imagined listening ending. Pioneer was built to receive commands from Earth and return science; there is no claim it listened to these other machines. Planned 21 months / over 30 years of service; last signal January 2003. The real image is a sequence, not the player’s exact captured frame.

All image IDs, source URLs and original credits are in `content/memories.json`, `content/photo_tasks.json`, `content/facts.json`, `content/discoveries.json` and `public/nasa/metadata.json` / `CREDITS.csv`. Photos and stylized scenes are distinct in the interface.
