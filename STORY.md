# RELICA: story lock, dialogue and shot list

This is the hour 0–1 work, drafted for the directors to check. Mohammed checks sections 1–3, Moayad checks sections 4–6. Change anything that does not match what you see in your heads, then tell the team it is locked.

Every real-world claim marked **(verify)** must be confirmed by Abdullatif on a NASA page before it stays in the game.

## 1. The vision

A machine is built for one job. It is loved while it is useful. It does far more than anyone asked. Then the people leave, and it stays exactly where it stopped.

We do not tell the player facts about these machines. We let the player be one: wake up, be needed, keep going, be left. The facts arrive because the player lived them.

**Tone.** Toy Story for the fear of being left by the people you exist for. Wall-E for the lonely worker who keeps going and says almost nothing. The eyes and the antenna do the acting.

**The ending is not sad.** Each machine is found by the next one, and all of them are found by the player. That is the meaning of "not forgotten".

### Rules of this world

1. Machines and humans never talk to each other. Humans have no faces and no voices.
2. Machines speak rarely and in short lines. If a look can say it, cut the line.
3. Machines only talk to each other by radio, and those conversations are imagined. The end card says so.
4. Everything else is real: the places, the dates, the numbers, the photos.

### Three motifs that hold the game together

| Motif | How it appears |
|---|---|
| **Looking up** | Every chapter ends with the hero looking up at the sky. The camera follows that look and finds the next machine. This is the cutscene idea from the brief, used as the spine of the story |
| **Planned and done** | Each HUD carries a small "planned" number that is quietly passed: 90 sols, 5 flights. Nobody comments on it. The counter just keeps going |
| **"I'm still here"** | The last line of every chapter is the same sentence, said by a different machine. In the epilogue all of them say it at once, and the final card answers them |

## 2. Beat sheet

Times are from the start of each part. "Call" is what the code triggers.

### Opening: the factory (0:45)

| Time | Beat | Player | Hero emotion | Call |
|---|---|---|---|---|
| 0:00 | Black. One soft beep. Two eyelids open | Enter | sleepy → curious | shot `opening_wake`, title card |
| 0:08 | Clean room. The rover is on a test stand with its wheels off the floor | W spins the wheels, A and D steer them. It cannot go anywhere yet | happy | dialogue `ch0_wake` |
| 0:25 | Two workers in hooded suits fold it in half and close a panel over it | none | scared | dialogue `ch0_fold` |
| 0:35 | Black. Only the eyes. Rumble grows, then sudden silence and floating | none | scared → curious | shot `launch` |

### Chapter 1: the Moon (3:00)

Apollo 17, Taurus–Littrow, December 1972.

| Time | Beat | Player | Hero emotion | Call |
|---|---|---|---|---|
| 0:00 | The rover unfolds beside the Lunar Module. Earth hangs in a black sky. Two astronauts climb on | none | happy | shot `moon_arrival`, dialogue `ch1_intro` |
| 0:15 | Drive to science stop 1. The first hill throws the rover into the air, slowly | drive, hop | happy | objective, HUD distance |
| 0:50 | Stop 1. The astronauts collect rocks. The rover's eyes follow them | wait 8 s | curious | |
| 1:00 | Leaving stop 1, the rear fender breaks **(real)**. Dust fountains over everyone. Driving is slow and blind | drive through its own dust | scared, then sad | dust shower on, dialogue `ch1_dust` |
| 1:40 | Stop 2. The astronauts tape maps over the wheel **(real)** | wait | happy | memory `as17-137-20979`, dialogue `ch1_fixed`, dust off |
| 1:55 | The long free drive to stop 3. Music comes in. Top speed, big floating hops. This is the happiest moment in the game | drive | happy | |
| 2:25 | Stop 3 is the last one. The astronauts walk away toward the Lunar Module | none | curious | controls off |
| 2:35 | The rover turns its eye to the lander. The top half lifts off without a sound. The eye tilts up to follow it **(real: the rover's camera filmed the lift-off, verify)** | none | sad | dialogue `ch1_left_behind`, shot `moon_liftoff` |
| 2:50 | Alone. Wide shot. "I'm still here." It looks up | none | sad | cutscene `moon_to_mars` |

### Chapter 2: Mars, Opportunity (3:30)

Meridiani Planum, 2004 to 2018.

| Time | Beat | Player | Hero emotion | Call |
|---|---|---|---|---|
| 0:00 | A bundle of airbags hits the ground and bounces across the plain into a small crater **(verify)** | A and D nudge the bounces | scared | shot `mars_landing` |
| 0:12 | Airbags sag, panels open, a mast rises, two eyes open. HUD: "Planned: 90 sols" | none | curious | dialogue `ch2_intro` |
| 0:20 | Drive out of the crater. Find a patch of tiny round pebbles | drive, hold E to study | happy | fact card: formed in water **(verify)** |
| 0:50 | Sunset and sunrise blink past. The counter reaches 90, and keeps counting | none | happy | dialogue `ch2_sol90` |
| 1:00 | Long drive. Dust settles on the panels and the battery sinks. A gust of wind cleans them and the battery jumps **(verify)** | drive, watch the battery | sad → happy | HUD battery |
| 1:30 | Sol counter in the thousands. Grind a rock | hold E | curious | memory `PIA20285` |
| 2:00 | A crater on the rim. It was named after a Moon lander **(real, in the pack)** | drive to the viewpoint | curious | memory `PIA21708`, dialogue `ch2_orion` |
| 2:15 | Sunset. Radio static. An old voice | Enter through the lines | curious → sad | dialogue `ch2_viking_call`, cut-away to Viking |
| 2:50 | The sky turns brown. The Sun becomes a dim dot. The battery falls and the wheels slow, however hard the player holds W | drive, slower and slower | sleepy | storm 0 → 1, dialogue `ch2_storm` |
| 3:20 | Stopped. "I'm still here." It looks up into the brown | none | sleepy | cutscene `storm_to_jezero` |

### Chapter 3: the Mars sky, Ingenuity (2:30)

Jezero crater, 2021 to 2024.

| Time | Beat | Player | Hero emotion | Call |
|---|---|---|---|---|
| 0:00 | Under a big rover's belly, a tiny machine drops to the sand. The rover backs away | none | scared | shot `heli_drop`, dialogue `ch3_intro` |
| 0:15 | Flight 1. Hold Space, the blades blur, it lifts to 3 metres, hovers, lands **(verify)**. HUD: "Flight 1, planned: 5" | hold Space | scared → happy | memory `PIA23882` |
| 0:40 | Flights 2 and 3. Fly through rings to find a safe road. The big rover follows the road below | fly | happy | dialogue `ch3_scout` |
| 1:20 | The counter passes 5 and keeps going: 20, 50, 71. The light changes with the seasons | none | happy | |
| 1:40 | Flight 72. Smooth sand with nothing to look at **(verify)**. The horizon tips. The controls drift. Hard landing. A blade tip snaps | fight the drift, and lose | scared | shot `last_flight`, dialogue `ch3_crash` |
| 2:05 | On the sand. The player presses Space. The rotor twitches and stops | hold Space, nothing happens | sad | |
| 2:15 | Far away, the big rover turns its head, then drives on. "I'm still here." It looks up | none | sad | dialogue `ch3_goodbye`, cutscene `mars_to_space` |

### Epilogue: Pioneer 10 (1:15)

| Time | Beat | Player | Hero emotion | Call |
|---|---|---|---|---|
| 0:00 | A dish in the dark. One slow blink | none | sleepy | dialogue `ep_drift` |
| 0:15 | Turn the dish to find the Sun, now only a bright star | A and D | curious | |
| 0:30 | Lined up. Signal rings arrive, coming inward this time. One voice at a time: the Moon rover, Viking, Opportunity, Ingenuity. Each says the same three words | hold still | happy | dialogue `ep_voices` |
| 0:50 | "I hear you." | none | sleepy, content | dialogue `ep_last` |
| 0:58 | Card: **Abandoned, but not forgotten.** Then the wall of real photos. Then: "The conversations are imagined. The machines, the places, the dates and the photos are real." | Enter | | shot `ending`, memory wall, credits |

## 3. Dialogue: intent for every line

Abdullatif writes the final Arabic and English from this. The English here is a draft to show the feeling, not the final text. Keep every line under 12 English words.

| Id | Who | Emotion | What the line must do | Draft |
|---|---|---|---|---|
| `ch0_wake` | lrv | sleepy | First thought. Small and confused | "…Oh. I'm on." |
| | lrv | happy | Discover the wheels with delight | "Wheels! I have wheels!" |
| `ch0_fold` | lrv | scared | Trust mixed with fear | "Where are we going?" |
| `ch1_intro` | lrv | happy | Wonder at low gravity | "Everything is so light here." |
| | lrv | happy | State its purpose proudly | "Hold on. I'll carry you." |
| `ch1_dust` | lrv | sad | Shame. It thinks it failed them | "I'm sorry. I'm making a mess." |
| `ch1_fixed` | lrv | happy | Being cared for | "You fixed me. With a map!" |
| `ch1_left_behind` | lrv | curious | Does not understand yet | "You forgot me. …Hello?" |
| | lrv | sad | Understands | "Oh. I was only for the ride." |
| | lrv | sad | Motif line | "I'm still here." |
| `ch2_intro` | opportunity | curious | Sets up the planned number | "Ninety days. That's all they asked." |
| | opportunity | happy | Decides to make them count | "Then let's see everything." |
| `ch2_sol90` | opportunity | happy | Passing the limit, lightly | "Ninety. …I can keep going." |
| `ch2_orion` | opportunity | curious | Links Mars back to the Moon | "They named this one after a Moon lander." |
| `ch2_viking_call` | viking | sleepy | An old voice wakes up | "Who is driving around up there?" |
| | opportunity | curious | Introduces itself by its limit | "Opportunity. They gave me ninety days." |
| | viking | happy | The parallel **(verify: 90-day plan, about 6 years of work)** | "They gave me ninety too. I gave them six years." |
| | opportunity | sad | The real question of the game | "Does it hurt, when they stop calling?" |
| | viking | sleepy | The answer of the game | "No. You keep watch. Someone always comes after." |
| | viking | happy | Blessing | "Rest, little one. You did more than they asked." |
| `ch2_storm` | opportunity | sleepy | Notices the dark without fear | "The sky is turning brown." |
| | opportunity | sleepy | Motif line, whispered | "I'm still here." |
| `ch3_intro` | ingenuity | scared | The impossible job | "The air is so thin. Can anything fly here?" |
| | ingenuity | scared | Sets up the planned number | "Five flights. If I'm lucky." |
| `ch3_scout` | ingenuity | happy | Finds its purpose | "Follow me. I can see the way." |
| `ch3_crash` | ingenuity | scared | Loses its bearings | "There's nothing to hold on to." |
| `ch3_goodbye` | ingenuity | sad | Tells the rover to leave | "Go on. You have work to do." |
| | ingenuity | happy | Pride through the sadness | "Seventy-two. I counted." |
| | ingenuity | sad | Motif line | "I'm still here." |
| `ep_drift` | pioneer | sleepy | Time and distance | "I left in 1972. I never stopped." |
| | pioneer | sleepy | Ties to chapter 1 **(verify both dates)** | "The same year as a little rover on the Moon." |
| `ep_voices` | lrv, viking, opportunity, ingenuity | happy | One line each, overlapping at the end | "I'm still here." |
| `ep_last` | pioneer | happy | It cannot answer, but it listens | "I hear you. I can't answer. But I hear you." |

Open choice for Mohammed: formal Arabic or a lighter everyday register. One register for all machines, with Viking sounding older and slower.

## 4. Camera language

| Setting | Value |
|---|---|
| Gameplay zoom (field of view) | 55° |
| Cutscene wide shots | 40–50° |
| End of a long zoom | 5–8° |
| Handheld, calm | 0.3° sway |
| Handheld, alive | 0.6° |
| Handheld, shaken | 1.2° and above |

**Gameplay camera per machine**

| Machine | Distance | Height | Follow lag | Note |
|---|---|---|---|---|
| Moon rover | 7 m | 3 m | soft | Lifts and widens a little during hops |
| Opportunity | 6 m | 2.6 m | soft | Sinks lower and closer as the storm grows |
| Ingenuity | 3.5 m | 1.5 m | tight | Tilts with the helicopter in turns |
| Pioneer 10 | 5 m | 1 m | very slow | Almost still |

**The face problem and the fix.** The camera sits behind the machine, and the eyes are on the front. Two fixes, both needed:

1. **Head turn.** When idle for 2 seconds, or when something happens behind it, the machine looks back over its shoulder toward the camera.
2. **Talk camera.** When a line of dialogue starts, the camera swings in half a second to a front three-quarter view of the speaker, and swings back when the dialogue ends.

**Viking is filmed differently.** Every shot of Viking is locked off on a tripod with no sway at all, because it has not moved since 1976. Every shot of Opportunity is handheld. Cutting between them shows the age gap without a word.

## 5. Shot list

Camera positions are described from the machine: behind, in front, left, right.

### `opening_wake` (8 s)

| # | Time | Shot | Move | We feel |
|---|---|---|---|---|
| 1 | 0–4 | Extreme close-up, two closed eyelids, dark | Still. The lids open. Light blooms | A birth |
| 2 | 4–8 | Same position | Slow pull back until the whole rover and the clean room are in frame. Handheld calm | Small in a big bright place |

### `launch` (10 s)

| # | Time | Shot | Move | We feel |
|---|---|---|---|---|
| 1 | 0–7 | Black. Only two eyes, close | Sway grows from 0 to 2.5°. Eyes squeeze shut | Fear |
| 2 | 7–10 | Same | Sway cuts to zero in one frame. Silence. The eyes open wide and drift slightly upward | Weightless wonder |

### `moon_arrival` (6 s)

| # | Time | Shot | Move | We feel |
|---|---|---|---|---|
| 1 | 0–6 | Wide and low. Lander on the left, Earth high on the right, the folded rover in the centre | Slow push in while the rover unfolds. Handheld calm | Arrival |

### `moon_liftoff` (15 s)

| # | Time | Shot | Move | We feel |
|---|---|---|---|---|
| 1 | 0–4 | Over the rover's shoulder. The lander is small and far away | Still. Handheld calm | Waiting |
| 2 | 4–7 | Close on the rover's eye from the front | The eye tilts up. The camera does not move | Understanding |
| 3 | 7–15 | Very wide. The rover is tiny at the bottom left. The top of the lander rises out of frame at the top right | Locked off. No sway. No sound. Hold three full seconds after it is gone | Left behind |

### `moon_to_mars` (10 s). Cutscene 1

| # | Time | Shot | Move | We feel |
|---|---|---|---|---|
| 1 | 0–2.5 | Behind and left of the rover, shoulder height | The camera lets go and drifts left. Sway rises from 0.6° to 1.1° | Unsteady |
| 2 | 2.5–4 | Tilt up along the rover's eye-line, past Earth | Hunts a little, overshoots, comes back to a small red dot | Searching |
| 3 | 4–8 | The red dot | Long zoom, 46° to 6°. Sway calms to 0.25°. Year counter runs 1972 → 2004 | Time passing |
| 4 | 8–10 | Mars fills the frame | A pale bundle streaks across. Cut on its movement | Here we go again |

### `mars_landing` (8 s)

| # | Time | Shot | Move | We feel |
|---|---|---|---|---|
| 1 | 0–8 | Ground level, looking along the plain | The bundle bounces toward the camera and over it. The camera whips round to follow. Sway shaken on each impact | Chaos, a little funny |

### `ch2_viking_call` (camera pattern during the dialogue)

| Speaker | Shot | Move |
|---|---|---|
| Opportunity | Side profile against the sunset, medium | Handheld alive |
| Viking | Straight on from low down. Beard and eyebrows fill the frame. A different, paler sunset behind | Locked off. A very slow push in across the whole call |

Label in the corner during Viking's shots: `RADIO · CHRYSE PLANITIA`.

### Storm (gameplay camera, 30 s)

No cut. As the storm level rises from 0 to 1: zoom narrows 55° → 45°, sway rises to 1.2°, the camera sinks from 2.6 m to 1.2 m and closes from 6 m to 3.5 m. The world shrinks to one machine.

### `storm_to_jezero` (10 s). Cutscene 2

| # | Time | Shot | Move | We feel |
|---|---|---|---|---|
| 1 | 0–3 | Beside the stopped rover, inside the brown | The camera rises straight up. Sway shaken | Leaving it |
| 2 | 3–5.5 | Above the storm. Clear sky, curved horizon | Pans across the planet. Sway alive | Relief |
| 3 | 5.5–8 | A glint far away | Zoom 45° → 8°. Year counter 2018 → 2021 | Someone new |
| 4 | 8–10 | The underside of a large rover | Cut to ground level on the last frame | |

### `heli_drop` (6 s)

| # | Time | Shot | Move | We feel |
|---|---|---|---|---|
| 1 | 0–6 | Ground level under the big rover | The small machine drops a hand's width and wobbles. The big wheels roll back out of frame. Two eyes open | Tiny and alone |

### `last_flight` (8 s)

| # | Time | Shot | Move | We feel |
|---|---|---|---|---|
| 1 | 0–5 | Chase camera, close | The horizon tips further and further. Sway grows | Losing control |
| 2 | 5–6 | Impact | One hard jolt, then stillness | |
| 3 | 6–8 | Close on the broken blade tip, the eyes soft behind it | Slow settle. Handheld calm | It is over |

### `mars_to_space` (12 s). Cutscene 3

| # | Time | Shot | Move | We feel |
|---|---|---|---|---|
| 1 | 0–3 | The camera lies on the sand beside Ingenuity, at eye level | Still. Both look at the same horizon | Company |
| 2 | 3–6 | Tilt up together into the night sky | Sway alive | |
| 3 | 6–12 | One faint point that moves against the stars | The longest zoom in the game, 50° → 5°. Sway fades to nothing | Awe |

### `ending` (15 s)

| # | Time | Shot | Move | We feel |
|---|---|---|---|---|
| 1 | 0–8 | Pioneer 10, three-quarter front | Slow half orbit. No sway | Peace |
| 2 | 8–15 | Same | Pull back and back until it is one dot among the stars. Fade to the card | Scale |

## 6. The 30-second video

| Time | Picture | Text on screen |
|---|---|---|
| 0–3 | Eyes open in the dark | |
| 3–8 | Floating hops across the Moon | "Play as the machines NASA left behind" |
| 8–12 | The lander leaves. The rover looks up | |
| 12–16 | The long zoom from the Moon to Mars, with the year counter | |
| 16–21 | Bearded Viking on the radio, Arabic line with English subtitle | |
| 21–25 | Ingenuity flies, then the broken blade | "Real places. Real dates. Real photos." |
| 25–28 | Pioneer 10 turning toward a far star | |
| 28–30 | Title card: RELICA | "Abandoned, but not forgotten" |

## 7. Colour and light per world

| World | Ground | Sky | Light | Accent |
|---|---|---|---|---|
| Factory | `#C6CCD5` | `#DFE5EC` | Soft and even, from above | Foil gold `#E3A23C` |
| Moon | `#8B8D92` | `#000000` | One hard white sun, black shadows, no haze | Earth blue `#4F86C6` |
| Mars, day | `#B0623A` | `#D8A878` | Warm, hazy, long soft shadows | Sky near the Sun slightly blue-grey |
| Mars, storm | `#6E4630` | `#7A5236` | Dim and flat | The Sun as a pale dot |
| Deep space | none | `#02030A` | One small cold light from the Sun's direction | Signal gold `#E3A23C` |

Signal rings and antenna tips are always foil gold, in every world, so the player learns that gold means "a voice".

## 8. Missions: clear tasks that are fun

Every chapter has a named mission and a short task list, shown at the top right of the screen. Each task ticks off with a sound when it is done. The player always knows what to do next and how far along they are.

Each mission is built on one fun mechanic, and that mechanic is also the lesson. The player learns by doing the thing, then one sentence confirms what they just felt.

### Opening: "Wake up"

| Task | How it plays |
|---|---|
| Spin your wheels | Hold W on the test stand |
| Steer left and right | A and D |

### Chapter 1: "Carry the crew"

**The fun:** big slow-motion jumps. Every hill is a ramp, and an air-time counter shows your best jump.

| Task | How it plays | What the player learns by doing it |
|---|---|---|
| Take the crew to 3 science stops | Park inside the circle at each stop. A neat park gets a happy beep | |
| Bring back 3 sample boxes | A box is strapped on at each stop. The stack grows on the back of the rover | The rover's job: carrying more, further |
| Longest jump (bonus) | Air-time record on screen | One-sixth gravity: the same hop that barely left the factory floor lasts three seconds here |
| Drive blind to stop 2 | After the fender breaks, follow a beeping marker through your own dust | With no air, dust flies in clean arcs and never hangs in clouds **(verify)** |

### Chapter 2: "Follow the water"

**The fun:** managing sunlight. The battery is your life, dust is the enemy, and whirlwinds are your friends.

| Task | How it plays | What the player learns by doing it |
|---|---|---|
| Climb out of the crater | First drive | |
| Find 3 signs of water | Hold E to study the round pebbles, the layered rock and the view from the rim. Each one fills a third of a "water" badge | What the mission was looking for, and that it found it **(verify)** |
| Keep the battery alive | Dust dims the panels as you drive. Whirlwinds wander the plain; drive through one and the panels are swept clean **(verify)** | Solar power on Mars, and why a 90-day rover lasted years |
| Reach the rim | The long drive, with the sol counter passing 90 | Planned and done |

### Chapter 3: "Be the eyes"

**The fun:** delicate flying on a short battery. Every flight is a small dare.

| Task | How it plays | What the player learns by doing it |
|---|---|---|
| First flight: hold 3 metres for 3 seconds | Keep the helicopter inside a marked height band | The air is about 1% of Earth's, so staying up takes constant effort **(verify)** |
| Scout the road: mark 3 dangers | Fly over a sand trap, a boulder field and a cliff edge, and press E above each to mark it. The big rover's route bends around every mark | Why a helicopter was useful to a rover |
| Land with battery to spare | Reach the pad before the bar empties | Flights were short because the battery was small **(verify)** |

### Epilogue: "Listen"

| Task | How it plays |
|---|---|
| Find the Sun | Turn the dish with A and D |
| Hold the signal | Keep it lined up while the voices arrive |

### Discovery cards

When a lesson lands, one sentence appears at the bottom of the screen for four seconds and is saved to a list the player can read at the end. No pop-up, no pause. Eight at most in the whole game:

1. Moon gravity is one-sixth of Earth's.
2. The Moon has no air: no wind, no sound, and dust that falls straight back.
3. A broken fender was fixed with maps and clamps.
4. The rover's own camera filmed its crew leaving.
5. Opportunity was planned for 90 Martian days.
6. The round pebbles formed in water.
7. Wind sometimes cleaned the solar panels.
8. Ingenuity was planned for 5 flights and made 72.

Every card needs a verified source before it goes in.

## 9. Extra cutscenes

Short moments that make the player care, placed where the game would otherwise go straight from one task to the next.

**Rules for all of them:** eight seconds at most. Never two in a row, except at chapter ends. The player gets the controls back within ten seconds. Escape always skips.

| Id | Where | Length | What we see | Why it is there |
|---|---|---|---|---|
| `earth_goodbye` | Opening, as the panel closes | 4 s | From inside the box, through the closing gap: a hooded worker rests a hand on the rover for a second. Then dark | Someone cared about it first |
| `moon_first_look` | Chapter 1, after unfolding | 5 s | The rover's eye pans across grey hills, then finds Earth, small and blue. The focus settles on it | Wonder, and how far from home |
| `moon_pat` | Chapter 1, after the repair | 3 s | An astronaut pats the taped fender twice and walks off. The rover's antenna perks up | The bond that makes the ending hurt |
| `mars_day` | Chapter 2, at each of the three time skips | 4 s | Locked-off wide shot. The Sun crosses the sky, shadows sweep round, the sol counter spins | Years passing, cheaply, three times |
| `mars_tracks` | Chapter 2, at the rim | 5 s | The mast turns to look back. Two wheel tracks run all the way to the horizon | Pride. Look how far it came |
| `viking_wakes` | Chapter 2, before the call | 6 s | A dust-covered lander, perfectly still. One eyelid cracks open. Dust slides off a long eyebrow | Meeting the old one properly |
| `first_shadow` | Chapter 3, at 3 metres on flight 1 | 5 s | Straight down: a tiny helicopter shadow on red sand **(verify: it photographed its own shadow)** | "I'm flying" |
| `flights_montage` | Chapter 3, the counter passing 5 | 6 s | Four quick flights in different light, the counter jumping each cut | Planned and done |
| `where_they_are` | Epilogue, during the voices | 12 s | As each voice arrives, cut to that machine where it rests today: the rover parked on the Moon, Viking under dust, Opportunity on the rim, Ingenuity on the sand. Three seconds each, locked off | The payoff of the whole game. Every one of them is still there |

This adds about 55 seconds, which takes the game to roughly 13:30. To stay near 12 minutes, shorten the driving between stops, not these moments.

If time runs short, cut in this order: `mars_tracks`, `flights_montage`, `earth_goodbye`, `moon_pat`. Never cut `viking_wakes` or `where_they_are`.
