# RELICA: who does what

## Approved title and interface direction — 14 November

**RELICA: Still Here — ريليكا: ما زلتُ هنا** is the approved game name. The challenge name is separate. Browser title and the existing title card now use it; this is not the final logo or completed main menu.

See [BRANDING_AND_ART_DIRECTION.md](BRANDING_AND_ART_DIRECTION.md) for the actionable brief. Abdullatif owns the logo, bilingual branding, a real main menu with a visible Arabic/English selector, and a unified redesign of the existing interface. Ziad supports menu/pause/input integration. These remain OPEN; prior functional UI delivery did not mean final visual design was complete.

Three environment-style concepts have been shown to the directors: A Warm Explorer, B Quiet Frontier, C Cosmic Cinema. **Style selection is PENDING.** B is a recommendation only. Do not begin a texture/lighting/particle overhaul from an unapproved option. After selection, attach the selected reference here and record the choice before Abdulkarim implements it. Existing animation and photo-scene tasks remain active.


> Current implementation status (14 Nov): see [DIRECTORS_HANDOFF.md](DIRECTORS_HANDOFF.md) and [TESTLOG.md](TESTLOG.md). Camera and mission changes requested by the directors are implemented; art acceptance, novice testing, rehearsal and submission remain explicit human steps. Earlier hour estimates and paper chapter timings are planning history.

Read [STORY.md](STORY.md) first. It says what the game is. This file says who builds each part of it.

| Person | Role | Owns |
|---|---|---|
| **Ziad** | Set A: engine and gameplay | `src/core/` (except the camera), `src/vehicles/`, `src/chapters/`, `src/main.js` |
| **Abdulkarim** | Set B: worlds and characters | `src/characters/`, `src/world/`, `public/models/` |
| **Abdullatif** | Set C: story text, data, interface, sound | `src/ui/`, `src/audio/`, `style.css`, `content/facts.json`, `content/dialogue.json`, `content/memories.json`, `public/nasa/` |
| **Moayad** | Director: camera, cutscenes, look | `src/cinematics/`, `src/core/followCamera.js`, `content/shots/` |
| **Mohammed** | Director: story, feel, testing, pitch | `content/tuning.json`, `TESTLOG.md`, the pitch, the GitHub repo |

## How we work

- **Hour 0, everyone (30 minutes).** Read STORY.md and your own section here. Run the game with `python serve.py`. Press 1–5 to see every chapter. Tell the directors anything you disagree with now, not at hour 12.
- **Stay in your folders.** If you need a change in someone else's file, ask them. This is what keeps five people from breaking each other's work.
- **Pull before you push**, commit small and often, and never push something that stops the game from starting.
- **AI tools leave no trace of themselves in the work.** The rule is written for the tools in `AGENTS.md` (Claude Code reads it through `CLAUDE.md`). If your tool does not read that file, paste the rule into its instructions:
  - Commits are authored by you alone. No "Co-Authored-By", "Generated with" or similar lines in commit messages or pull requests.
  - No chat logs or prompt dumps in the repo.
  - Code comments and tool config files (`.claude/`, `CLAUDE.md`, `AGENTS.md`) stay.
  - Check `git log` before every push.
- **Log AI use** in `AI_USE.md` every time, with your name. This is the one place AI is named, because the challenge requires us to disclose it.
- **Understand your own part.** A judge may ask any of you how your piece works.
- **Stuck for 20 minutes?** Say so in the group chat. Do not lose an hour quietly.

### Milestones

| Hour | Milestone | Mohammed's check |
|---|---|---|
| 5 | **M1 Moon slice.** Chapter 1 is fun to drive with real terrain, one real model, real dialogue, the talk camera | Does hopping across the Moon make you smile? |
| 11 | **M2 Ugly but complete.** Every beat in STORY.md happens, in order, with whatever art exists | Can you play start to end without E-skipping? |
| 17 | **M3 Content lock.** All models, sounds, photos and final text are in. No new features after this | Does it look and sound like one game? |
| 21 | **M4 Final build.** Blockers fixed, deployed, played twice from the live link | Would you show this to a judge? |
| 24 | **Shipped.** Video, slides, upload form | |

### Hand-offs between people

These are the moments where one person waits for another. Deliver a rough version on time; polish later.

| By hour | From | To | What |
|---|---|---|---|
| 2 | Abdulkarim | Ziad | `heightAt(world, x, z)`: one function that returns the ground height anywhere. Ziad builds the physics ground from it |
| 3 | Moayad | Ziad | Talk camera: `followCam.talkTo(object)` and `followCam.release()` |
| 4 | Abdullatif | everyone | Final dialogue for the opening and chapter 1 in `dialogue.json` |
| 4 | Abdulkarim | Moayad | The Moon rover model, for a look review |
| 6 | Moayad | Ziad | Every shot id from STORY.md exists in `content/shots/`, even if rough |
| 7 | Abdullatif | Ziad | `hud.setBattery(0..1)`, `hud.setCounter(label, value, planned)`, `audio.play(name)`, `audio.setWorld(name)` |
| 7 | Abdulkarim | Ziad | Props: `createProp('lunarModule')`, `'astronaut'`, `'airbags'`, `'perseverance'`, `'marker'`, `'ring'` |
| 9 | Abdulkarim | Ziad | Effects: `dust.shower(on)`, `storm.setLevel(0..1)`, `hero.breakBlade()` |
| 9 | Abdullatif | Ziad, Mohammed | Verified mission facts in `facts.json` under `missions` |
| 16 | everyone | Mohammed | Everything in. Content lock |

---

## Ziad: engine and gameplay

You make it a game. You turn the beat sheet in STORY.md section 2 into things that happen when the player drives somewhere. Start from `src/chapters/_stage.js` and the five chapter files: each has a TODO list.

### To milestone 1 (hours 1–5)

**A-1 Physics ground from the terrain.**
Replace the flat ground in `src/core/physics.js` with a Rapier height-field built by sampling Abdulkarim's `heightAt` on a grid. Until he delivers, write a temporary `heightAt` that returns gentle hills.
*Done when:* the rover climbs hills, flies off crests in Moon gravity, and never falls through the ground.

**A-2 Rover controller, version 2.**
The current one in `src/vehicles/rover.js` slides a box. Make it feel like a vehicle: speed builds and fades, it leans into turns, it pitches to match the slope under it, the wheels spin, and it leaves the ground on crests. Try Rapier's ray-cast vehicle controller for 90 minutes at most. If it is not stable by then, keep the box and fake the lean and pitch on the visible model only.
*Done when:* Mohammed drives for one minute on the Moon and on the factory floor and can feel the difference, and it never flips over.

**A-3 Zones and objectives.**
New file `src/core/objectives.js`: a circular zone at a position that fires once when the hero enters it, shows a marker, and can be chained into a sequence ("go here, then here"). An on-screen arrow or beam points to the current one.
*Done when:* a chapter can say `await stage.goTo(x, z, 'Drive to the first science stop')`.

**A-4 Chapter 1, complete.**
Follow the beat sheet exactly: unfold, astronauts ride, three stops, fender breaks after stop 1 (driving speed capped while the dust is on), repair and memory photo at stop 2, the free drive, the parking spot, controls off, lift-off, the last line. Use the box Lunar Module and astronauts until the real props arrive.
*Done when:* chapter 1 plays from the title card to cutscene 1 with no E key.

**A-5 Chapter helper tools.**
`stage.wait(seconds)`, `stage.fade(toBlack, seconds)`, `stage.lockControls()`, key R restarts the chapter, and `?chapter=3` in the address starts at that chapter.
*Done when:* the other chapters can be scripted in a few lines each.

### To milestone 2 (hours 5–11)

**A-6 Opening.**
The rover sits on a stand. W spins the wheels and A/D steers them, but it does not move. After the player has tried both, the fold animation plays, then the `launch` shot.
*Done when:* a new player learns the keys without reading anything.

**A-7 Chapter 2.**
- Landing: a ball with high bounce that the player nudges with A/D, ending in a shallow crater. Then swap to the rover.
- Battery: charges in sunlight, drains while driving. Dust slowly lowers the charge rate. One scripted wind gust restores it.
- Sol counter: three time-skips (fade, sunrise, counter jumps). The "planned: 90" label stays while the number passes it.
- Interactions: hold E for two seconds at the pebbles and at the rock.
- Viking call: controls off, cut-away, lines, controls on.
- Storm: 30 seconds. Storm level 0 → 1 drives the effect, the battery and a speed multiplier that reaches zero.

*Done when:* the player is still holding W when the rover stops, and nothing tells them to let go.

**A-8 Chapter 3.**
- Spin-up: hold Space for 1.5 seconds before lift starts.
- Each flight has a battery. Land on the pad to end it.
- Flight 1: lift to 3 m, hover 3 seconds, land. Flights 2–3: four rings each. The big rover prop follows the ring path on the ground.
- Counter montage to 71.
- Flight 72: after 10 seconds add growing sideways drift and tilt, then force the landing. Blade breaks.
- After the crash, Space makes the rotor twitch for half a second. Nothing else.

*Done when:* the crash feels like the player's loss, not a cutscene.

**A-9 Epilogue.**
First run `epilogue_photo`: a dated December 1973 Jupiter memory. A/D frames Jupiter, Space captures once when aligned, then two seconds of Earth alignment sends the captured image. Show a scan and one confirmation. Reset the capture/send state on restart and cancel on chapter exit. Advance through the passing years, then switch to the existing `epilogue` mission: find the Sun and hold still for the imagined voices. Show a readable corner label, “Imagined conversation / حوار متخيّل”, during that scene. Finish with the ending card, the photo wall with service tributes, and credits. See STORY.md for exact acceptance behavior. The photo phase is implemented in `src/chapters/_pioneerPhoto.js` and called by the epilogue; the captured thumbnail is explicitly a game image. Ziad owns its ongoing gameplay integration.
*Done when:* capturing outside the aiming cone does not advance, an uncaptured image cannot be sent, each task completes once, restart works, and the ending is reachable without E-skipping.

### To milestones 3 and 4 (hours 11–21)

**A-10 Integration.** Swap in every model, prop, effect and sound as they land. Each swap is one commit.
**A-11 Pitch mode.** Keys 1–5 still jump chapters. Add keys 6–9 to jump straight to: the fender repair, the Viking call, the storm, flight 72.
**A-12 Speed.** Hold 60 frames per second on a normal laptop. Check with the browser's performance panel. Tell Abdulkarim which objects cost the most.
**A-13 Offline safety.** Copy the four library files from `index.html` into `vendor/` and point the import map at them, so the pitch does not depend on wifi.
**A-14 Fix list.** Work through Mohammed's blockers in `TESTLOG.md`, top down.

---

## Abdulkarim: worlds and characters

You make it look like our game. Low-poly, flat-shaded, few colours, and every machine must be readable as a character from 7 metres behind it. Colours for each world are in STORY.md section 7.

### To milestone 1 (hours 1–5)

**B-1 Terrain function.**
New file `src/world/terrain.js` with `heightAt(world, x, z)`: smooth hills from layered noise, plus stamped craters for the Moon. The same seed must always give the same land. Build the visible ground mesh in `world.js` from this function, so the picture and the physics always agree.
*Done when:* Ziad has the function by hour 2 and the Moon has hills and at least six craters near the route.

**B-2 The model pipeline, proven on one model.**
Make the Moon rover first.
1. Reference photos from the pack: `apollo_lunar_roving_vehicle/as17-137-20979.jpg`, `S71-30542.jpg`, `0102627.jpg`.
2. Generate with an image-to-3D tool, or build it from simple shapes in Blender if the result is messy.
3. Clean up in Blender: under 5,000 triangles, flat shading, plain colours and no photo textures, no logos or flags, front of the machine pointing along +Z, up is +Y, sized in metres to match the box in `CAST` inside `character.js`, centre point in the middle.
4. Name the parts: `body`, `wheel_FL`, `wheel_FR`, `wheel_RL`, `wheel_RR`, `head`, `antenna`.
5. Export as `public/models/lrv.glb`, under 1.5 MB.

*Done when:* the rover model drives in chapter 1 and Moayad has approved it.

**B-3 Model loading.**
In `character.js`, load `public/models/<id>.glb` if it exists and put it in place of the boxes. If the file is missing or fails, keep the boxes. The face rig (eyes, lids, antenna, rings) stays in code and attaches to the `head` and `antenna` parts.
*Done when:* deleting a model file does not break the game.

**B-4 Head turn.**
`hero.lookAt(target)` turns the head and eyes toward a point, within a sensible limit. `hero.lookBack(on)` makes it glance over its shoulder at the camera. Ziad and Moayad will call these.
*Done when:* the rover's eyes follow the astronauts at stop 1.

### To milestone 2 (hours 5–11)

**B-5 The rest of the cast.**

| Model | Reference photos in the pack | Face notes |
|---|---|---|
| `opportunity` | `opportunity_rover/PIA20285`, `sojourner_rover/PIA04422` (shows the twin rovers) | Mast head, two camera eyes. It already looks like a creature |
| `viking` | `viking_landers/PIA00565`, `PIA00396` | Two round camera eyes, dish, three legs. Beard and long eyebrows from dusty foil strips and hanging cables. Everything sags |
| `ingenuity` | `ingenuity_helicopter/PIA23882`, `PIA23969`, `PIA24466` | Box body, four thin legs, two rotors. Eyes large for its size. Blade parts named `blade_top`, `blade_bottom`, with a separate `blade_tip` that can snap off |
| `pioneer` | `pioneer_10_11/ARC-1972-AC72-2135`, `ARC-1973-AC73-9019` | The dish is the face. One small eye. Long booms |

*Done when:* all five load in their chapters.

**B-6 Props.** New file `src/world/props.js` with `createProp(name)`:
Lunar Module in two parts (`descent`, `ascent`) so the top can lift off; one astronaut with a mirror visor and no flag or logo, used twice; airbag bundle; lander petals; `perseverance` as a simple grey silhouette; science-stop marker; flight ring; rock set; the pebble patch.
*Done when:* Ziad has replaced every box prop.

**Astronaut animation follow-up (Abdulkarim, with Ziad and Moayad):** main `21deaa0` supplies jointed procedural figures with breathing, walking, climbing and sitting. The old unrigged GLB is no longer the gameplay astronaut. Preserve these changes; add collect/kneel, repair/pat, reassurance and farewell actions. Abdulkarim owns those performances and their action interface; Ziad selects actions from chapter events; Moayad checks their framing. Confirm the two figures animate independently and seated positions fit the updated rover.

**B-7 Mars.** Wide flat plains with fine ripples for chapter 2, a crater rim to reach, and a different area with cliffs on the horizon for Jezero in chapter 3. A sun disc in the sky that the storm can dim.

**B-8 Effects.** New file `src/world/effects.js`:
wheel dust behind the rovers; `dust.shower(on)` for the broken fender; `storm.setLevel(0..1)` that shifts sky, haze and light toward the storm colours and adds blowing particles; a lift-off burst for the Lunar Module; rotor dust; `hero.breakBlade()`.
*Done when:* at storm level 1 you can barely see the rover's own antenna.

### To milestones 3 and 4 (hours 11–21)

**B-9 Factory room and deep space.** Walls, a test stand, two hooded workers (reuse the astronaut with a different head). For space: a better star field, the Sun as a bright star, Pioneer's world.
**B-10 Emotion pass.** With Mohammed, check all five emotions on all five characters from the gameplay camera. If sad and sleepy look the same, exaggerate.
**B-11 Light pass.** With Moayad, one world at a time. The Moon has black shadows and no haze. Mars is warm and soft.
**B-12 Speed.** Cut whatever Ziad reports as expensive. Rocks should share one shape.

---

## Abdullatif: story text, data, interface and sound

You make it true and you make it readable. You are also the person who answers "where is the NASA data?", so you own that answer.

### To milestone 1 (hours 1–5)

**C-1 Verify the environment numbers.**
For the four worlds in `content/facts.json`, find each number on a NASA page (nssdc.gsfc.nasa.gov planetary fact sheets, science.nasa.gov). Correct the value, paste the link in `source`, set `verified` to true. The orange "?" marks on the HUD disappear as you go.
*Done when:* the Moon panel shows no "?".

**C-2 Dialogue for the opening and chapter 1.**
Write the final Arabic and English from the intent table in STORY.md section 3. Agree the Arabic register with Mohammed first. Short lines: one breath each.
*Done when:* those lines are in `dialogue.json` with no "placeholder" text.

**C-3 Dialogue box, version 2.**
Text types out letter by letter and Enter completes it. The speaker's name has its own colour. Add `dialogue.play(id, { auto: true })` that advances on a timer, for cutscenes and for the video. Check Arabic punctuation and numbers display correctly.
*Done when:* the Viking call can run hands-free.

### To milestone 2 (hours 5–11)

**C-4 The rest of the dialogue.** Chapters 2, 3 and the epilogue. Read every line aloud once.

**C-5 HUD, version 2.**
`hud.setBattery(0..1)` as a bar. `hud.setCounter('sol', 4712, 90)` that shows the value with a small "planned: 90" beside it. A cleaner objective line. Chapter cards that show mission name, place and dates.
*Done when:* Ziad has these by hour 7.

**C-6 Memory photos.**
Copy any missing photos from `nasa_data/` into `public/nasa/` in the same folder layout. For each photo below, write a one-sentence caption in Arabic and English in `memories.json`, keep the NASA credit line, and set the crop.

| Moment | Photo id | Check |
|---|---|---|
| Opening, on the stand | `S71-16722` | Caption must say it is a training rover in 1971 |
| Fender repair | `as17-137-20979` | Crop keeps the backpack logo out of frame |
| Rock grinding | `PIA20285` | |
| Frost morning | `PIA07108` | |
| Orion crater | `PIA21708` | |
| First flight | `PIA23882` | |
| Its two cameras | `PIA23969` | Shows an adult engineer. Fine to use |
| Pioneer and its plaque | `ARC-1972-AC72-2135`, `ARC-1972-A72-2137` | |

Look at every photo yourself: no children, no visible NASA logo after cropping.
*Done when:* the end wall shows all of them with captions.

**C-7 Sound.**
`audio.play(name)` and `audio.setWorld(name)` in `src/audio/audio.js`. A beep voice for each character: Viking low and slow, Ingenuity high and quick. On the Moon there is no air, so there is no outside sound at all: only the rover's own hum and beeps. Mars has thin wind. Three short music cues: the free drive, the storm, the ending. Use only sounds with a free licence and write each source in the README.
*Done when:* the Moon chapter is noticeably quieter than Mars.

**C-8 Verify the mission facts.**
Every line in PLAN.md section 12 and every **(verify)** in STORY.md. Put the confirmed ones in `facts.json` under a new `missions` section with their links. Tell Mohammed at once about anything that turns out false, because the story may need to change.
*Done when:* by hour 9, nothing unverified is left in the script.

### To milestones 3 and 4 (hours 11–21)

**C-9 Title, ending, credits.** Title screen. The final card and the line "The conversations are imagined. The machines, the places, the dates and the photos are real." Credits built from `CREDITS.csv` (only photos we used), plus libraries, fonts, sounds and tools.
**C-10 Upload pack.** In the README: how to run, tools used, the NASA data statement (which files, where in the game), the AI disclosure from `AI_USE.md`, and references.
**C-11 Proofread.** All Arabic and all English, once, slowly, with Mohammed.
**C-12 Subtitles for the 30-second video**, with Moayad.

---

## Moayad: camera, cutscenes and look

The shot list is drafted in STORY.md sections 4–6. Your work is to judge it, change it, and make it real.

**CAM-1 Check the shot list (hour 0, 30 minutes).** Mark what to change in STORY.md sections 4–6. Tell the team when it is locked.

**CAM-2 Talk camera (by hour 3).** In `src/core/followCamera.js` add `talkTo(object)`: swing in half a second to a front three-quarter view of the speaker. `release()` swings back behind. Hook it into the dialogue so it happens on its own.
*Done when:* every line of dialogue shows the speaker's face.

**CAM-3 Camera per machine.** Move the camera numbers in `tuning.json` into one group per machine (values in STORY.md section 4) and let each chapter choose its group. Add the hop behaviour for the Moon and the storm behaviour for Mars.

**CAM-4 Upgrade the cutscene player** in `src/cinematics/cinematic.js`:
- hard cuts between shots (`"cut": true` on a key)
- look at a moving thing instead of a fixed point (`"look": "hero"` or a prop name)
- positions that turn with the machine, so "behind and left" is always behind and left
- fade to and from black
- roll, for the tipping horizon in `last_flight`
- timed events inside a shot (set an emotion, play a sound)

Try focus blur last, and drop it if it costs more than an hour.
*Done when:* `moon_liftoff` plays as three separate shots.

**CAM-5 Author every shot (rough by hour 6, final by hour 16).** One file in `content/shots/` per id in STORY.md section 5. Describe the shot to the AI in words, let it write the numbers, then fix the numbers by eye with the tuning panel.

**CAM-6 The Viking cut-away.** Viking lives in his own small set, far from Opportunity. During the call the camera cuts between the two sets on each line. Viking's shots are locked off; Opportunity's are handheld.

**CAM-7 Look approval.** Review every model and every world from Abdulkarim against STORY.md section 7. Three questions each time: can I tell what it is from far away, can I see where it is looking, does it belong with the others?

**CAM-8 The 30-second video (hours 21–23).** Storyboard in STORY.md section 6. Record from the final build using auto dialogue, cut it, add English subtitles with Abdullatif, upload to a public link.

---

## Mohammed: story, feel, testing and pitch

**DIR-1 Check the story (hour 0, 30 minutes).** STORY.md sections 1–3. Change beats and lines until it is the game in your head. Choose the Arabic register. Tell the team when it is locked.

**DIR-2 Repo.** Add the other four as collaborators on GitHub. Turn on Pages (Settings, Pages, branch `main`, root). Post the live link in the group chat.

**DIR-3 Feel targets.** Tune with the panel (key under Escape), then paste the values into `content/tuning.json`.

| Thing | Target feel |
|---|---|
| Rover on the Moon | Light and bouncy. A hop lasts about three seconds. Top speed feels fast because the ground is close |
| Rover in the factory | Heavy. The same hop barely leaves the ground |
| Opportunity | Slower and steadier than the Moon rover. Patient |
| Opportunity in the storm | The speed drains away so gradually the player cannot say when it stopped |
| Ingenuity | Twitchy and fragile. Lifting off takes effort. Landing is a relief |
| Pioneer | Enormously slow. Turning it takes patience |

**DIR-4 Milestone tests.** Play the build at hours 5, 11, 17 and 21. Write everything in `TESTLOG.md` as blocker, ugly or nice-to-have. At each milestone answer the check question in the table at the top, out loud, to the team.

**DIR-5 Pacing.** Time every chapter with a stopwatch against the targets in `TESTLOG.md`. If the total passes 13 minutes, shorten the drives, not the story beats.

**DIR-6 Cuts.** At each milestone, if a hand-off is more than an hour late, cut from the list in PLAN.md section 10. Decide in the meeting and move on.

**DIR-7 Emotion check (hour 12).** With Abdulkarim, look at every emotion on every character. Then sit someone who has not seen the game in front of chapter 1 and watch their face when the lander leaves.

**DIR-8 The pitch (hours 17–23).** Seven slides and a 5–7 minute script, outline in PLAN.md section 11. Decide who speaks and who drives the demo. Rehearse twice with a timer. Prepare short answers for:
- Where exactly is NASA data used?
- How do you know the facts are right?
- What did AI do, and what did you do?
- Who is this for, and how would a teacher use it?
- Why a game and not a website?
- What is invented and what is real?

**DIR-9 Upload (hours 22–24).** Fill the form with Abdullatif. Check the video link opens without a login. Submit with an hour to spare.

---

## Added after the first look: missions and extra cutscenes

The directors asked for clearer, more fun tasks and more short cutscenes. The design is in STORY.md sections 8 and 9. These tasks sit on top of the ones above.

| Id | Who | By | Task | Done when |
|---|---|---|---|---|
| **C-13** | Abdullatif | hour 4 | Task list on the HUD: `hud.setMission(title, [tasks])`, `hud.completeTask(index)` with a tick sound, `hud.setBonus(label, value)` for the jump record | Chapter 1 shows "Carry the crew" with its tasks ticking off |
| **C-14** | Abdullatif | hour 9 | Discovery cards: `hud.discover(id)` shows one sentence for four seconds and saves it. Text in Arabic and English in `content/discoveries.json`, each with its verified source. A list of them on the end screen | All eight cards appear in a full playthrough |
| **A-15** | Ziad | hour 5 | Chapter 1 mission: parking circles, sample boxes that stack on the rover, air-time counter and record | A new player finishes chapter 1 without asking what to do |
| **A-16** | Ziad | hour 9 | Chapter 2 mission: three hold-E water signs filling a badge, dust and battery, whirlwinds that clean the panels when driven through | The player hunts for whirlwinds on purpose |
| **A-17** | Ziad | hour 10 | Chapter 3 mission: the height band for flight 1, three dangers to mark with E, the rover's route bending around each mark | Marking a danger visibly changes the route |
| **B-13** | Abdulkarim | hour 8 | New props and effects: sample box, parking circle, whirlwind, the three dangers (sand trap, boulder field, cliff edge), the height band, a water badge icon | Ziad has replaced every placeholder |
| **CAM-9** | Moayad | rough by hour 8, final by hour 16 | The nine extra shots in STORY.md section 9. `mars_day` is one shot reused three times. `where_they_are` needs each machine left in its final pose in its own world | `where_they_are` plays and somebody in the room goes quiet |
| **DIR-10** | Mohammed | hour 11 | Fun check. Watch someone new play each mission. If they ask "what do I do?", the task text is wrong. If they stop trying to jump on the Moon after ten seconds, the jumps are not fun yet | Each mission passes with a new player |


### Animation integration update — 14 November

Main commit `21deaa0` replaces the astronaut/worker stand-ins with jointed procedural figures: breathing, walking, climbing aboard and sitting now run automatically. That update, the crew start positions and the revised rover seats are preserved in the directors’ integration. Earlier notes about the unrigged astronaut describe the old model. Abdulkarim now owns task-specific collecting, repair, reassurance and farewell gestures; Ziad owns their chapter triggers; Moayad reviews the performance in the authored shots.
