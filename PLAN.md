# RELICA: game plan and team tasks

Working title taken from the project folder. Browser game, 5 people, 24 hours.

## 1. The game in one minute

A 10–12 minute low-poly 3D story game that runs from a link. You play four NASA machines one after another: a Moon rover, a Mars rover, a Mars helicopter and a deep-space probe. Each was left behind when its job ended. Each has eyes, and an antenna that works as its mouth. Between chapters the camera goes handheld, looks up into space, finds the next machine and zooms into it.

Every date, place, environment number and "memory" photo in the game comes from a NASA source.

- **Challenge:** Abandoned but not Forgotten (NASA Space Apps 2026)
- **Audience:** school students and space fans
- **Text:** Arabic dialogue with English subtitles; menus and HUD in English

## 2. Rules that shape this plan

Taken from the data guide and the briefing transcript in this folder.

| Rule | What we do about it |
|---|---|
| Code and assets may only be made on 14–15 Nov | Nothing is reused from before today |
| NASA upload closes 15 Nov, 11:59 pm local | Final build is frozen 3 hours before our own deadline |
| Upload needs: summary, 30-second video or about 7 slides, public GitHub repo, how to run it, tools used, NASA data statement, AI disclosure, references, all in English | Set C owns the checklist in section 11 |
| Local jury pitch is 5–7 minutes live, plus questions | Keys 1–4 jump to any chapter so we can demo highlights |
| Five criteria with equal weight: impact, creativity, validity, relevance, presentation. Organisers said the data matters a lot and that visuals and transitions are not a criterion on their own | NASA data must be visible while playing, see section 6 |
| AI is allowed if every use is disclosed. The idea and its explanation must be the team's own | Everyone logs AI use in `AI_USE.md` from the first hour and can explain their own part to a judge |
| AI-generated images and video need a watermark | We use no AI images or video. AI-made 3D models and code are disclosed |
| No NASA logos | Models carry no insignia. Real photos are cropped where a logo shows |
| Nobody under 18 seen or heard | Astronauts have mirror visors and no voices. One pack photo is excluded, see section 6 |
| "A simple finished project beats a big unfinished one" | Cut list in section 10 is agreed in advance |

## 3. Cast

| Machine | Part in the story | Where | Face |
|---|---|---|---|
| **Lunar Roving Vehicle**, Apollo 17, 1972 | Playable, chapter 1 | Moon, Taurus–Littrow | TV camera is the eye, umbrella antenna is the mouth |
| **Opportunity**, 2004–2018 | Playable, chapter 2 | Mars, Meridiani Planum | Camera mast is the head with two eyes, small antenna is the mouth |
| **Viking 1 lander**, 1976–1982 | The old one. Not playable, speaks by radio | Mars, Chryse Planitia | Two camera turrets are eyes, dish is the mouth, beard and long eyebrows made of dusty foil strips and cables |
| **Ingenuity**, 2021–2024 | Playable, chapter 3 | Mars, Jezero crater | Eyes on the body box, top antenna is the mouth, rotors droop when sad |
| **Pioneer 10**, 1972 to today | Epilogue | Beyond the planets | The big dish is the face, one small sensor eye, very slow blink |

Background props: Lunar Module, two astronauts with mirror visors, airbag lander, Perseverance as a simple silhouette.

**Emotion kit, the same for every character:** two eyelids, eyes that look at things, head or mast tilt, antenna that perks up or droops, signal rings from the antenna while talking. Five emotions only: curious, happy, scared, sad, sleepy.

## 4. Story, minute by minute

| Part | Length | What you do | What you feel | Real NASA material on screen |
|---|---|---|---|---|
| **Opening: the factory** | 0:45 | Open your eyes in a clean room. Test your wheels on a stand (this is the driving tutorial). Get folded and packed. Darkness and launch rumble | Born with a purpose | LRV training photos `S71-16722`, `S71-30542` |
| **1. Moon: the rover** | 3:00 | Unfold next to the Lunar Module. Drive two astronauts to three science stops in one-sixth gravity. A fender breaks and dust rains on you until they tape maps over it. Park. The crew climbs in and lifts off. You tilt your camera up and watch them go | Joy of being useful, then left behind | Moon panel. Photos `as17-137-20979` (the real map-and-clamp fender repair), `as15-86-11603` |
| *Cutscene 1: Moon to Mars* | 0:30 | | | Year counter 1972 → 2004 |
| **2. Mars: Opportunity** | 3:30 | Bounce to a stop inside airbags. Roll off. Drive on solar power that depends on sun and dust. A counter says "planned: 90 sols" and keeps going into the thousands. Grind a rock. At sunset, a radio call with old Viking. Then the 2018 dust storm: the sky darkens, the battery drops, the controls fade | Stubborn hope, then a quiet ending | Mars panel, sol counter. Photos `PIA07108` (frost on the rover), `PIA20285` (rock grinding target), `PIA21708` (Orion crater, named after the Apollo 16 lunar module, which links back to chapter 1) |
| *Cutscene 2: storm to Jezero* | 0:30 | | | Year counter 2018 → 2021 |
| **3. Mars sky: Ingenuity** | 2:30 | Drop from the rover's belly. Spin up the rotors in very thin air. Three short flights to scout a path, while a counter that said "planned: 5 flights" runs to 72. Last flight over smooth sand ends in a hard landing and a broken blade. The rover drives on | Small and brave, then grounded | Photos `PIA23882`, `PIA23969` (its two real cameras) |
| *Cutscene 3: Mars to deep space* | 0:30 | | | |
| **Epilogue: Pioneer 10** | 1:15 | Drift. Turn the dish back toward a pale dot, the Sun. Too weak to speak, but you hear the other machines faintly. Then a wall of every real photo you collected, with credits. Last card: "Abandoned, but not forgotten" | Peace | Photos `ARC-1972-AC72-2135`, `ARC-1972-A72-2137` (the plaque) |

Total is about 12:30 on paper. Mohammed trims with a stopwatch.

Only the Moon rover gets the full factory-to-retirement arc. The others start at arrival, so each chapter stays short.

**Accuracy rules for the script**

- The machines never meet in person. They are thousands of kilometres and decades apart. All talk is by radio and framed as imagination.
- Never present an invented line as a real quote. The well-known "my battery is low" line was a journalist's paraphrase, so we do not show it as Opportunity's words.
- Real events keep their real dates, places and numbers. Anything invented is feelings and dialogue only.

## 5. Camera and cutscenes

Owner: Moayad.

**Gameplay camera.** Third person behind the machine on a soft spring, so it lags a little in turns. Lower and closer for the small machines (Ingenuity), higher and wider for the rover.

**Handheld recipe.** Slow random drift on rotation, about 0.3–1 degree, at 0.3–1.5 movements per second. Add a small bump on impacts. Slight "breathing" on the zoom. All of these are sliders in the tweak panel, so they are tuned by eye and not in code.

**Transition recipe, used three times**

1. The gameplay camera lets go of the machine and becomes handheld.
2. It tilts up to the sky, following where the machine is looking.
3. It hunts for a small dot, then pulls focus onto it.
4. Long slow zoom while a year counter ticks forward.
5. The dot becomes the next machine. Cut on motion into its gameplay camera.

| Cutscene | From | To | The cut |
|---|---|---|---|
| 1 | The rover watching the Lunar Module leave | A red dot among the stars grows into Mars | An airbag bundle streaks through frame, cut to bouncing |
| 2 | The dust storm fills the screen | Camera rises above the storm and pans to Jezero | A glint under a rover's belly, zoom in, Ingenuity drops and opens its eyes |
| 3 | Camera lies on the sand next to broken Ingenuity and looks up with it | Night sky, a faint moving point | Long zoom to Pioneer 10's dish |

Shots are written as plain data in `content/shots/*.json` (time, position, look-at target, zoom, shake). Moayad describes a shot in words, AI turns it into numbers, Moayad tunes the numbers.

## 6. Where the NASA data shows up

This is what we point to when a judge asks "where is the NASA data?".

1. **Environment panel, always on screen.** Gravity, temperature, air pressure, mission date or sol, distance driven. The physics reads the same gravity number the panel shows, from one file, `content/facts.json`.
2. **Memory photos.** At 8–10 key moments the game freezes into a photo frame showing the real NASA photo of that moment, with its caption loaded from the pack's `metadata.json`. The player collects them and sees them all at the end.
3. **Chapter cards.** Mission name, dates and landing site before each chapter.
4. **Model references.** The pack photos are the reference images for every 3D model.
5. **Credits screen.** Built from `CREDITS.csv`, which is also our References field.

**Checked in the pack**

- `viking_landers/NHQ201707210014.jpg` shows a child at a museum table. Do not use it.
- `as17-137-20979.jpg` (the fender) shows a NASA logo on an astronaut's backpack. Crop to the wheel and fender.
- Phoenix and two Dawn photos are launch preparation shots, not surface photos. We do not need them.
- Surveyor 3 has no photos. Not in our cast.

## 7. Tech

| Need | Choice |
|---|---|
| Engine | Three.js as plain browser modules with no build step. Libraries load from a CDN, and `python serve.py` runs the game. Moving to Vite later needs no code changes |
| Physics | Rapier, with gravity set per world from `facts.json` |
| Driving | One wheeled-vehicle controller shared by both rovers, with different settings |
| Flying | Simple thrust-against-gravity controller for Ingenuity |
| Text, HUD, dialogue | Normal HTML and CSS on top of the 3D view, so Arabic right-to-left text works properly |
| Tuning | A tweak panel (lil-gui) with a "copy values" button, so the directors change numbers without touching code |
| Models | GLB files. Flat shading, small colour palette per world |
| Hosting | GitHub repo plus GitHub Pages serving the repo as it is, so the repo link and the play link are both ready for the upload |

**Folders and owners**

```
src/core/        Set A   game loop, input, physics, chapter manager, gameplay camera
src/vehicles/    Set A   rover controller, helicopter controller
src/chapters/    Set A   opening, moon, mars, sky, epilogue
src/cinematics/  Moayad  shot player, handheld shake, zoom
src/characters/  Set B   model loader, face rig, emotions
src/world/       Set B   terrain, sky, dust, storm
src/ui/          Set C   dialogue, HUD, memory photos, menus, credits
src/audio/       Set C
content/         dialogue.json (Set C + Mohammed), facts.json (Set C),
                 shots/ (Moayad), tuning.json (Mohammed)
public/models/   Set B
public/nasa/     Set C   photos and metadata.json copied from the pack
```

**Agreed in the first hour, so nobody waits for anybody**

- A chapter has `load`, `start`, `update` and `dispose`, and says when it is done.
- `character.setEmotion("sad")` and `character.talk(true)`
- `dialogue.play("ch2_viking_call")`
- `cinematic.play("moon_to_mars")`
- `hud.setWorld("mars")`
- `memory.show("as17-137-20979")`

Every one of these already exists as a small working stub in the skeleton. Every character starts as coloured boxes built in code, and the real model replaces it later without changing anything else.

**Working rules**

- Stay inside your own folders. Ask before editing someone else's.
- Small commits, pull before you push, and the main branch must always run.
- Each person adds a line to `AI_USE.md` whenever AI makes something: tool, what for.
- Read what the AI wrote for you. A judge may ask you how it works.

## 8. Team

### Directors

**Moayad: camera, cutscenes and look**

1. Hour 0: check the drafted shot list in `STORY.md` sections 4–6, change what is wrong, and lock it.
2. Build the cutscene player with AI in `src/cinematics/`: keyframed camera, handheld shake, focus-and-zoom, black bars, year counter.
3. Tune the gameplay camera for each machine in the tweak panel.
4. Approve the look: colours, light and sky for each world. Review every model from Set B. Can you read the shape from far away? Do the eyes show emotion?
5. Record gameplay and cut the 30-second video.

**Mohammed: story, feel and testing**

1. Hour 0: check the drafted story and dialogue intents in `STORY.md` sections 1–3, change what is wrong, and lock them. He has the final say on the cut list.
2. Choose the Arabic register. Abdullatif writes the final Arabic and English from the intent table.
3. Tune the feel in the tweak panel: rover speed and bounce, battery drain, flight power, chapter lengths.
4. Play every milestone build from start to end. Keep one list in `TESTLOG.md`, sorted into blocker, ugly, nice-to-have.
5. Own the 5–7 minute pitch and the slides.

Both: one of you is always awake, and any "which is better?" question from a builder gets an answer within five minutes.

### Three task sets

Assigned: Set A to Ziad, Set B to Abdulkarim, Set C to Abdullatif. This is the summary. The full task sheets with "done when" checks and hand-off times are in `TASKS.md`. The story lock, dialogue intents and shot list are in `STORY.md`.

**Set A: Engine and gameplay (Ziad)**

- GitHub repo and GitHub Pages. The project skeleton already exists and runs, see `README.md`
- Game loop, keyboard input, chapter manager, chapter-select keys 1–4
- Physics world with gravity per world
- Rover controller for the Moon rover and Opportunity
- Helicopter controller for Ingenuity
- Chapter logic: science stops, fender event, battery and sol counter, dust storm, flight waypoints, crash
- Frame-rate checks and the final build

**Set B: Worlds and characters (Abdulkarim)**

- Box placeholder for every character in the first two hours
- Five low-poly character models and the props, made with an image-to-3D tool using the pack photos as reference, then cleaned up: right scale, named parts, under about 5,000 triangles each, no logos
- Face rig and the five emotions for every character, including Viking's beard and eyebrows
- Moon terrain with craters, Mars plains, Jezero, the factory room, the star field
- Light, sky colour, wheel dust, the dust storm

**Set C: Story, data, interface and sound (Abdullatif)**

- Check every fact in section 12 against a NASA page, then write `facts.json` with the source link beside each number
- Final dialogue in Arabic and English with Mohammed
- Dialogue bubbles (Arabic right-to-left with English subtitle underneath) and the trigger for antenna signal rings
- Environment panel, counters, chapter cards, title screen
- Memory photo system and the end wall, loading captions from `metadata.json`
- Credits screen from `CREDITS.csv`
- Sound: a beep voice per character, wind, rotor, music, all from free-licence sources and all listed
- README, `AI_USE.md` roll-up, references, and the upload form

## 9. Timeline

Hours count from the moment you start.

| Hours | Goal | Done when |
|---|---|---|
| 0–1 | **Kickoff.** Everyone reads `STORY.md` and their section of `TASKS.md` and runs the skeleton. The directors lock the story and the shot list | All five have played the skeleton, and the story is locked |
| 1–5 | **Milestone 1: Moon slice** | A box rover drives on Moon terrain in low gravity. The panel shows Moon data. One dialogue bubble in Arabic and English. One test cutscene with the handheld camera |
| 5–11 | **Milestone 2: ugly but complete** | The whole game plays from opening to final card with boxes for characters. All three cutscenes exist in rough form. All dialogue text is in |
| 11–17 | **Milestone 3: content lock** | Real models in, faces animate, sound in, memory photos in. No new features after this point |
| 17–21 | **Milestone 4: final build** | Blockers fixed. Smooth on a normal laptop. Two full playthroughs by someone who did not build that chapter. Deployed |
| 21–24 | **Ship** | Video, slides, README, upload form, references. Spare time for surprises |

Mohammed runs a 10-minute check at each milestone and decides what gets cut.

Sleep in turns of about three hours between hours 11 and 19. Whoever holds Set A sleeps after milestone 2, not before it.

## 10. Cut list

If a milestone is late, cut from the top. Decide at the milestone check, not later.

1. The factory opening becomes a 20-second cutscene with no controls.
2. Ingenuity gets one flight instead of three.
3. Opportunity starts already landed, with no airbag bounce.
4. One shared beep voice instead of one per character.
5. The epilogue becomes a cutscene with no controls.

Never cut: the Viking radio call, the three cutscenes, the environment panel, the memory photos.

## 11. Pitch and upload

**Local pitch, 5–7 minutes.** Do not try to play the whole game.

- 1 minute: the problem and the idea, in your own words
- 3 minutes: live demo using the chapter keys: fender repair on the Moon, cutscene 1, the Viking call, the storm, one Ingenuity flight
- 1 minute: where the NASA data is (section 6) and how accuracy was checked
- 1 minute: who it is for, and what comes next

**Upload checklist**

- [ ] Project summary in English
- [ ] 30-second video with English subtitles, on a public link that needs no login
- [ ] Public GitHub repo and the live play link
- [ ] README: how to run, tools used
- [ ] NASA data statement: which files, and where they appear in the game
- [ ] AI disclosure, from `AI_USE.md`
- [ ] References: `CREDITS.csv`, code libraries, fonts, sounds, model tools
- [ ] Final check: no NASA logos, no AI images, nobody under 18

## 12. Facts to verify

Set C checks each line on a NASA page before it goes into the game.

**Already in the pack**

- The rover was used on Apollo 15, 16 and 17 in 1971–1972.
- Apollo 17, Taurus–Littrow, 12 Dec 1972: a fender broke and was repaired with lunar maps and clamps.
- Viking 1 launched on 20 Aug 1975.
- Opportunity was still working on sol 4,712 (April 2017), at Orion crater on the rim of Endeavour crater.
- Ingenuity arrived on 18 Feb 2021 under Perseverance and has two cameras on its underside.
- Pioneer 10 was built by TRW, reached Cape Kennedy in Feb 1972, and carries a plaque.

**Written from memory, must be checked**

| Claim | Value to confirm |
|---|---|
| Moon gravity | 1.62 m/s², one sixth of Earth |
| Moon surface temperature | About +120 °C in sunlight, about −130 °C at night |
| Moon air pressure | Practically zero |
| Mars gravity | 3.71 m/s², about 38% of Earth |
| Mars air pressure | About 6 millibars, under 1% of Earth |
| Mars average temperature | About −60 °C |
| The rover's camera filmed the Apollo 17 lift-off | 14 Dec 1972 |
| Opportunity landing | Jan 2004, Meridiani Planum, planned for 90 sols |
| Opportunity last contact, end of mission | 10 June 2018, 13 Feb 2019 |
| Opportunity distance driven | About 45 km |
| Viking 1 landing, last contact | 20 July 1976, Nov 1982 |
| Ingenuity first flight, last flight, total | 19 Apr 2021, 18 Jan 2024, 72 flights, planned for 5 |
| Pioneer 10 launch, Jupiter flyby, last signal | Mar 1972, Dec 1973, Jan 2003 |

If a number cannot be confirmed, it does not go in the game.
