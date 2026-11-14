# RELICA: story lock, dialogue and shot list

This is the story and performance draft for the directors to review. Mohammed checks the story and dialogue; Moayad checks camera staging. The decisions explicitly marked approved below remain settled. The final continuity pass, Opportunity staging, Pioneer ending and revised shot timings are proposals for their next review, not a claim that the game is implemented or the whole story is locked. See STORY_REVIEW.md for the review order, source notes and integration work.

Every real-world claim marked **(verify)** must be confirmed by Abdullatif on a NASA page before it stays in the game.

**Mohammed's approved direction (14 Nov):** simple Modern Standard Arabic; the Factory opening establishes an innocent, trusting Moon rover through playful wheel discovery and a worker's silent, reassuring gesture; the Moon rover waits with quiet hope; Ingenuity is a fighter who repeatedly recovers and pushes beyond expectations until the final landing takes away her ability to fly. The two revised Viking replies are also approved. The full Opportunity staging, Pioneer ending and shot timings below remain proposed for review.

## 1. The vision

A machine wakes with a purpose. We experience the care it receives, the work it does and the discoveries it makes. Some travel far beyond their planned missions. Eventually the crew leaves, communication falls silent or flight becomes impossible. The work and the machines remain; Pioneer keeps travelling.

We do not tell the player facts about these machines. We let the player be one: wake up, be needed, keep going, be left. The facts arrive because the player lived them.

**Tone.** Toy Story for the fear of being left by the people you exist for. Wall-E for the lonely worker who keeps going and says almost nothing. The eyes and the antenna do the acting.

**The proposed ending holds grief and pride together.** The player has witnessed each machine's work. In an imagined listening scene, their separate voices are heard together by Pioneer. No machine is physically rescued or meets a later one. Being remembered is the meaning of "not forgotten".

### Rules of this world

1. Machines and humans never talk to each other. Humans have no faces and no voices.
2. Machines speak rarely and in short lines. If a look can say it, cut the line.
3. The machines' conversations use imagined radio voices. Frame Viking's call as imagined when it begins, and identify Pioneer's listening scene on its chapter card. The end card also distinguishes fiction from mission history; none of these exchanges is a recorded transmission.
4. The places, dates, mission totals and photos are real. Player controls, compressed time and staged recoveries are storytelling devices; they must not be presented as recorded mission events.

### Three motifs that hold the game together

| Motif | How it appears |
|---|---|
| **Looking up** | Every chapter ends with the hero looking up at the sky. The camera follows that look and finds the next machine. This is the cutscene idea from the brief, used as the spine of the story |
| **Planned and done** | Each HUD carries a small "planned" number that is quietly passed: 90 sols, 5 flights. Nobody comments on it. The counter just keeps going |
| **"I'm still here"** | The Moon rover, Opportunity and Ingenuity each end with this line. The Factory opens the Moon rover's story without repeating it. In the proposed epilogue the four remembered voices, including Viking, speak one at a time; Pioneer answers them |

## 2. Beat sheet

Times are nominal targets from the start of each part. "Call" names the intended trigger, not proof that it is wired. Chapter budgets include their short character moments and ending shots; the three interplanetary transitions are counted separately. Never cut off a subtitle to meet a timestamp. Manual reading and photo browsing can extend a playthrough.

### Opening: the factory (0:45)

| Time | Beat | Player | Hero emotion | Call |
|---|---|---|---|---|
| 0:00 | Black. One soft beep. Two eyelids open | Enter | sleepy → curious | shot `opening_wake`, title card |
| 0:08 | Clean room. The rover is on a test stand with its wheels off the floor. It discovers its wheels with delight; give the player time to enjoy making them move | W spins the wheels, A and D steer them. It cannot go anywhere yet | happy | dialogue `ch0_wake` |
| 0:25 | Two workers in hooded suits carefully fold it for transport. Before closing the panel, one briefly rests a gloved hand on its frame. The rover follows the hand with its eyes, then softens | none | scared → curious, reassured | dialogue `ch0_fold` before the reassuring gesture |
| 0:35 | Black. Only the eyes. Launch vibrations build and the rover braces. The rumble fades into silence and floating; fear gives way to curiosity | none | scared → curious | shot `launch` |

**Approved opening direction:** the rover is innocent and trusting. Keep the existing three dialogue lines; the gloved hand adds care without words, a visible face or a human reply. Its later choice to wait on the Moon grows from that trust. The gesture is fictional character staging. Fit it within the existing 0:25–0:35 beat and keep the whole opening at 45 seconds. Moayad translates the gesture and eye response into shots; gameplay and camera implementation remain pending.

### Chapter 1: the Moon (3:00)

Apollo 17, Taurus–Littrow, December 1972.

| Time | Beat | Player | Hero emotion | Call |
|---|---|---|---|---|
| 0:00 | The rover unfolds beside the Lunar Module. Earth hangs in a black sky. Two astronauts climb on | none | happy | shot `moon_arrival`, dialogue `ch1_intro` |
| 0:15 | Drive to science stop 1. The first hill throws the rover into the air, slowly | drive, hop | happy | objective, HUD distance |
| 0:50 | Stop 1. The astronauts collect rocks. The rover's eyes follow them | wait 8 s | curious | |
| 1:00 | Leaving stop 1, the rear fender breaks **(historical damage and repair; placement in this drive is compressed staging)**. Dust fountains over everyone. Driving is slow and blind | drive through its own dust | scared, then sad | dust shower on, dialogue `ch1_dust` |
| 1:40 | Stop 2. The astronauts tape maps over the wheel **(real)**. The rover follows their hands with its eyes, recalling the care it received in the Factory | wait | happy | memory `as17-137-20979`, dialogue `ch1_fixed`, dust off |
| 1:55 | The long free drive to stop 3. Music comes in. Top speed, big floating hops. This is the happiest moment in the game | drive | happy | |
| 2:25 | Stop 3 is the last one. The astronauts walk away toward the Lunar Module | none | curious | controls off |
| 2:35 | The rover turns its eye to the lander. The top half lifts off without a sound. The eye tilts up to follow it **(real: the rover's camera filmed the lift-off, verify)**. It asks whether the crew will return. Hold a pause with no answer, then let it look toward where they boarded and quietly choose to wait | none | curious → sad, still hopeful | first two lines of `ch1_left_behind`, shot `moon_liftoff` |
| 2:50 | Alone. Wide shot. "I'm still here." It looks up | none | sad | final line of `ch1_left_behind` once, then cutscene `moon_to_mars` |

**Approved Moon direction:** needed → worried → cared for → joyful → quietly waiting. Preserve the happiest free drive before the departure. The repair eye-line echoes the Factory gesture; both are fictional character performance. Keep the three existing farewell lines in order, with an unanswered pause after "Will you come back?" and the final motif reserved for the wide shot. Fit these beats within the existing three-minute chapter. Moayad stages the eye-lines and pause in CAM-1; chapter/dialogue timing integration remains pending. The Factory and Moon story reviews are approved. The two Viking replies are approved; the broader Opportunity staging and epilogue below are ready for review.

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
| 2:15 | Sunset. Radio static. An old voice acknowledges loneliness, reminds Opportunity that discoveries endure, and encourages it to keep exploring | Enter through the lines | curious → sad → curious | dialogue `ch2_viking_call`, cut-away to Viking |
| 2:50 | After a compressed journey toward Perseverance Valley, the sky turns brown. The Sun becomes a dim dot. The battery falls and the wheels slow, however hard the player holds W; the eyes still search ahead | drive, slower and slower | sleepy, still curious | storm 0 → 1; first line of `ch2_storm` |
| 3:20 | Stopped. The eyes make one last search, then look up into the brown. "I'm still here." | none | sleepy | final line of `ch2_storm` once, then cutscene `storm_to_jezero` |

**Approved Viking dialogue (14 Nov):** acknowledge that silence can hurt, then encourage Opportunity to continue discovering. Keep Viking older and slower; his final line offers encouragement before the storm rather than a farewell or an instruction to rest. Preserve the six-line conversation and existing chapter duration. These are imagined character lines, not historical radio messages. The two dialogue revisions are approved; the remaining chapter review and camera/performance integration are still open.

**Proposed Opportunity direction:** a patient explorer whose curiosity outlasts its movement. Keep the playful landing, discoveries and passing sol counter. Viking acknowledges loneliness and sends it back to exploring; the storm interrupts that renewed hope. Preserve control while speed drains away, then let the final eye movement and motif carry the ending. No extra farewell speech, score penalty or restart prompt for the scripted storm ending.

**Accuracy and staging:** the last communication was on 10 June 2018; NASA declared the mission ended in February 2019. Perseverance Valley is the final setting, while the earlier Orion view is a separate discovery moment. The final drive, visibly fading battery and radio conversation are dramatic compression. Viking stopped operating in 1982; his conversation with Opportunity is imagined. Sources: [NASA Opportunity mission](https://science.nasa.gov/mission/mer-opportunity/) and [NASA Viking 1 mission](https://science.nasa.gov/mission/viking-1/).

### Chapter 3: the Mars sky, Ingenuity (2:30)

Jezero crater, 2021 to 2024.

**Her character:** a fighter. The air is difficult and the ground feels close, but she keeps finding enough strength for another flight. The player learns to believe she will recover. Her final loss hurts because that recovery has become familiar. She remains alert and determined after she is grounded.

| Time | Beat | Player | Hero emotion | Call |
|---|---|---|---|---|
| 0:00 | Under a big rover's belly, a tiny machine drops to the sand. The rover backs away. She looks up and decides to try | none | scared → curious | shot `heli_drop`, dialogue `ch3_intro` |
| 0:15 | Flight 1. The rotor strains, she briefly dips, then the player's lift input brings her up to the 3 m band. Hover and land. This first recovery teaches the player to trust her. HUD: "Flight 1, planned: 5" | hold Space, steady the hover, land | scared → happy | memory `PIA23882`, shot `first_shadow` |
| 0:40 | Flights 2 and 3. Scout the road for the big rover. One readable dip on each flight seems about to become a fall; she steadies herself and climbs again with the player's help. The rover follows the safe road below | fly, recover, mark dangers, land | scared during the dip → happy on recovery | dialogue `ch3_scout`; `ch3_recover` once after the first scouting recovery |
| 1:20 | The counter passes 5 and keeps going: 20, 50, 71. Brief views of effort and successful flight carry her determination through the years | none | happy, determined | shot `flights_montage` |
| 1:40 | Flight 72. A brief vertical flight over featureless sand ripples. As she descends, her sense of the ground slips. She fights to steady herself and seems to catch it once more, but sideways motion builds. The final landing damages the rotor blades and permanently grounds her | keep trying to steady her until the landing; the final outcome is scripted | scared, still fighting | `ch3_last_push` during the final struggle; `last_flight` at the landing and its aftermath |
| 2:05 | On the sand, she tries again. Space makes the damaged rotor twitch and stop. Her eyes stay open; her will to continue remains | press Space, no lift | sad, determined | dialogue `ch3_crash` with the first failed attempt |
| 2:15 | Far away, the big rover turns its head, then drives on. She sends it onward, proud of how far she flew. "I'm still here." She looks up | none | sad → happy with pride → sad | dialogue `ch3_goodbye`, cutscene `mars_to_space` |

**Play direction for Ziad:** build the recoveries into the existing three flights, within the chapter's current time budget. A dip gives a clear rotor/tilt cue and enough height to recover with the established controls. Restore lift visibly when the player responds; keep these earlier flights recoverable and repeatable. The danger should feel real without relying on surprise control lockouts or random crashes. Keep player control through the final struggle, then hand off to the loss-of-flight cutscene when the landing makes the damage irreversible. No game-over or retry prompt at that story ending.

**Performance direction for Moayad:** let the viewer see both effort and recovery. The camera stays readable while the ground approaches; it settles when she regains height. Save the sustained stillness for the damaged rotor and her next attempt to lift. Section 5 proposes a `last_flight` aftermath shot beginning at touchdown so the earlier struggle remains playable. Moayad still needs to approve and author that shot. Play `ch3_goodbye` once; `ch3_grounded` is a legacy alias, not another goodbye.

**Accuracy:** NASA records up to five planned test flights and 72 completed flights. The first real flight held a stable 3 m hover for 30 seconds; the 3-second task and staged dips here are game compression and invented drama. Flight 72 was a brief vertical test, not a long scouting run. NASA's investigation identifies poor surface tracking and sideways motion at touchdown as the likely accident sequence; all four blades were damaged. Do not imply repeated real engine failures or that she simply ran out of determination.

Sources: [NASA/JPL first-flight report](https://www.jpl.nasa.gov/news/nasas-ingenuity-mars-helicopter-succeeds-in-historic-first-flight/) and [NASA accident investigation](https://www.nasa.gov/missions/mars-2020-perseverance/ingenuity-helicopter/nasa-performs-first-aircraft-accident-investigation-on-another-world/). See also `content/facts.json` → `missions.ingenuity_first_flight`, `ingenuity_planned`, `ingenuity_total`, `ingenuity_last_flight`.

### Epilogue: Pioneer 10 (1:15 target; proposed)

**His character:** a quiet listener. The finale lets the player recognize every machine again and feel the pride in what each accomplished. It does not restore their ability to work or imply a working radio link today.

| Time | Beat | Player | Hero emotion | Call |
|---|---|---|---|---|
| 0:00 | A dish in the dark. One slow blink. The chapter card states launch in 1972, last signal in 2003, and an imagined listening scene | Enter through the card and two short lines | sleepy | chapter `epilogue`, dialogue `ep_drift` |
| 0:15 | Turn toward the Sun, now a distant bright point. Familiar tones gently emerge as the player finds the direction of home | A and D; hold still | curious | mission `epilogue` |
| 0:30 | Remember the Moon rover, Viking, Opportunity and Ingenuity where their stories ended. One voice at a time says "I'm still here." Leave room around each voice | hold still, then scene control | happy | dialogue `ep_voices`, shot `where_they_are` aligned to its four lines |
| 0:46 | Back to Pioneer. "I hear you. All of you." A quiet pause | none | happy, content | dialogue `ep_last` once |
| 0:52 | Pull back slowly. No additional voice or task completion sound | none | sleepy, peaceful | shot `ending` (15 s) |
| 1:07 | "Abandoned, but not forgotten." The fiction/history note shares the card. After the player continues, show the real photo collection and credits | Enter at the player's pace | | `card.ending()`, memory wall, credits |

**Delivery:** the four voices remain sequential, never a loud chorus. Use the same subtle voice signatures the player already knows. The 16-second reunion is a nominal four seconds per machine; stay with a speaker until its line finishes if reading takes longer. Pioneer has one final answer. Keep the ending card before the optional photo browsing so every player reaches the emotional conclusion first. These pacing and order changes are proposals; chapter and camera integration remains pending.

**Accuracy:** NASA records Pioneer 10's launch in 1972 and its last received signal on 23 January 2003. Turning the dish and hearing the other machines is an imagined interactive scene, not evidence that the spacecraft can receive or transmit today. Source: [NASA Pioneer 10 mission](https://science.nasa.gov/mission/pioneer-10/).

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
| `ch1_left_behind` | lrv | curious | Hopes the crew will return | "Will you come back?" |
| | lrv | sad | Chooses to wait, without bitterness | "…I’ll wait here." |
| | lrv | sad | Motif line | "I'm still here." |
| `ch2_intro` | opportunity | curious | Sets up the planned number | "Ninety days. That's all they asked." |
| | opportunity | happy | Decides to make them count | "Then let's see everything." |
| `ch2_sol90` | opportunity | happy | Passing the limit, lightly | "Ninety. …I can keep going." |
| `ch2_orion` | opportunity | curious | Links Mars back to the Moon | "They named this one after a Moon lander." |
| `ch2_viking_call` | viking | sleepy | An old voice wakes up | "Who is driving around up there?" |
| | opportunity | curious | Introduces itself by its limit | "Opportunity. They gave me ninety days." |
| | viking | happy | The parallel **(verify: 90-day plan, about 6 years of work)** | "They gave me ninety too. I gave them six years." |
| | opportunity | sad | The real question of the game | "Does it hurt, when they stop calling?" |
| | viking | sleepy | Acknowledges loneliness; discoveries endure | "Sometimes… but what we discovered remains." |
| | viking | happy | Encourages continued exploration before the storm | "Keep going, little one. There's still more to discover." |
| `ch2_storm` | opportunity | sleepy | Notices the dark without fear | "The sky is turning brown." |
| | opportunity | sleepy | Motif line, whispered | "I'm still here." |
| `ch3_intro` | ingenuity | scared | Feels the difficulty, chooses to try | "The air is thin… but I’ll try." |
| | ingenuity | curious | Treats the planned number as a beginning | "Five flights? Let’s start with one." |
| `ch3_scout` | ingenuity | happy | Finds its purpose | "Follow me. I can see the way." |
| `ch3_recover` | ingenuity | happy | A short breath after recovering; play once | "I can keep going." |
| `ch3_last_push` | ingenuity | scared | Still fighting during the final descent | "Come on… a little more." |
| `ch3_crash` | ingenuity | sad | Tries the damaged rotor again | "Come on… once more." |
| `ch3_goodbye` | ingenuity | sad | Tells the rover to leave | "Go on. You have work to do." |
| | ingenuity | happy | Pride through the sadness | "Seventy-two. I counted." |
| | ingenuity | sad | Motif line | "I'm still here." |
| `ep_drift` | pioneer | sleepy | Time and distance | "I left in 1972. I never stopped." |
| | pioneer | sleepy | Ties to chapter 1 **(verify both dates)** | "The same year as a little rover on the Moon." |
| `ep_voices` | lrv, viking, opportunity, ingenuity | happy | Proposed reunion: one line each, sequential, with room to listen | "I'm still here." |
| `ep_last` | pioneer | happy | Proposed answer in the imagined scene: every voice was heard | "I hear you. All of you." |

**Arabic register approved by Mohammed:** simple Modern Standard Arabic, with short, natural sentences. Use one register for all machines; Viking sounds older and slower. Ingenuity uses a feminine voice and keeps her resolve in both languages. Determination is carried by performance and the existing emotions; no new emotion API is required.

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

Camera positions are described from the machine: behind, in front, left, right. The revised `moon_liftoff`, `last_flight` and `where_they_are` staging is proposed for CAM-1 review. These tables specify intent; they do not create shot files or approve camera work on Moayad's behalf.

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

### `moon_liftoff` (15 s target; proposed alignment)

| # | Time | Shot | Move | We feel |
|---|---|---|---|---|
| 1 | 0–5 | Over the rover's shoulder; the lander's ascent stage rises | Follow its eye-line. "Will you come back?" | Trust reaching after the crew |
| 2 | 5–10 | Close on the eye as it returns toward the empty boarding place | Still. Leave an unanswered pause, then "…I'll wait here." | Hope becoming waiting |
| 3 | 10–15 | Wide; rover small in the landscape | Hold the empty sky. No second call of the farewell group | Space left by the crew |

At the chapter's 2:50 wide hold, play only the final "I'm still here" line, then begin `moon_to_mars`. Dialogue completion controls the hold; a fixed timer must not advance past unread words. There is no audible rocket in the lunar vacuum; machine voice and music are expressive scoring.

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

Proposed label during Viking's shots: `IMAGINED RADIO · CHRYSE PLANITIA` / `حوار متخيّل · سهل كريس`. The label distinguishes the fictional conversation from historical radio recordings.

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

### `last_flight` (8 s; proposed touchdown and aftermath)

The chapter owns the controllable struggle and the single touchdown event. Start this shot at touchdown; never replay the approach or impact after the player already landed.

| # | Time | Shot | Move | We feel |
|---|---|---|---|---|
| 1 | 0–1 | Touchdown, seen from the player's existing view | One brief jolt, then settle. No extra scripted drop | The recovery did not come |
| 2 | 1–4 | Damaged rotor blades, with the eyes visible behind | Slow move that reveals the damage | She can no longer fly |
| 3 | 4–8 | At eye level beside her | Hold still; she remains alert | Her resolve remains |

After this shot, restore Space for the attempt to lift. Play `ch3_crash` with the first attempt, not before it. Provide a visible continuation prompt after that attempt; the story must not require an unexplained number of key presses. The rotor twitch is fictional expressive performance. NASA's likely accident sequence damaged all four blades; do not present a single missing tip as the complete historical damage.

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
| 2 | 8–15 | Same | Pull back until it is one dot among the stars. Leave a quiet hold, then fade to the ending card before the photo wall | Scale and remembrance |

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

**The fun:** fighting to stay aloft, recovering, then daring another flight. The player should feel each hard-won recovery before the final loss of flight. The recoveries are staged gameplay, with the same battery and controls already planned.

| Task | How it plays | What the player learns by doing it |
|---|---|---|
| First flight: hold 3 metres for 3 seconds | Keep the helicopter inside a marked height band | The air is about 1% of Earth's, so staying up takes constant effort **(verify)** |
| Scout the road: mark 3 dangers | Fly over a sand trap, a boulder field and a cliff edge, and press E above each to mark it. The big rover's route bends around every mark | Why a helicopter was useful to a rover |
| Land with battery to spare | Reach the pad before the bar empties | Flights were short because the battery was small **(verify)** |

### Epilogue: "Listen"

| Task | How it plays |
|---|---|
| Find the Sun | Turn the dish with A and D |
| Hold still and listen | Keep the dish pointed toward the Sun while the imagined voices arrive |

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

**Proposed pacing rules:** ordinary inserts are eight seconds at most and fit inside their existing chapter beats. Do not stack them before returning control, except at chapter ends. The reunion `where_they_are` is the explicit exception at 16 seconds nominal. Readable subtitles take priority over fixed duration. Escape should skip the presentation while applying its final story state; this is an implementation acceptance target, not a verified feature.

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
| `where_they_are` | Epilogue, during the voices | 16 s nominal | One machine per line: the Moon rover, Viking, Opportunity in Perseverance Valley, Ingenuity on the sand. Four seconds each as a starting point; hold longer for a line if needed. These are imagined views of their final settings, not live footage | We remember each one before Pioneer answers |

Count these inserts once, inside the chapter budgets: `earth_goodbye` is the Factory hand gesture already described at 0:25, `moon_pat` belongs to the repair, and `where_they_are` belongs to the epilogue voices. The five chapter targets total 11:00; the three transitions add 0:32, for 11:32 nominal. Aim for a measured 12–13 minute first playthrough, allowing reading time. Photo-wall and credits browsing are untimed. Shorten repetitive travel if the measured run exceeds the target; preserve the recoveries, unanswered pause and closing voices.

If production time runs short, simplify camera moves for `mars_tracks` and reuse one setup for `mars_day`. Keep the Factory hand gesture, the repair response, the visible 5 → 72 achievement and the final four voices; those carry the reviewed story. `flights_montage` can use a fixed view and counter, but must not erase Ingenuity's accomplishments. Exact camera choices remain with Moayad.
