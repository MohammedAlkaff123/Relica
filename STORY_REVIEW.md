# RELICA: final story review draft

Prepared for Mohammed and Moayad, 14 November 2026. This is a reviewable story/content proposal. It does not mark DIR-1 or the camera tasks complete, and it does not claim the proposed performances are implemented.

## Review status

| Part | Settled decisions | Proposed in this pass |
|---|---|---|
| Language | Simple Modern Standard Arabic; short lines; Viking older and slower; Ingenuity feminine | Correct one colloquial Moon line and make the helicopter mission prompts consistently feminine |
| Factory | Playful wheel discovery, careful packing, one reassuring gloved hand | Count `earth_goodbye` inside the existing packing beat, so the gesture happens once |
| Moon | Joy of carrying the crew, repair echoes care, hopeful waiting | Align the three farewell lines with the ascent, unanswered pause and final wide hold |
| Opportunity | Viking's two revised replies | Patient exploration, a renewed desire to discover, then a gradual storm ending with searching eyes |
| Ingenuity | Fighter; repeated recoveries; 5 planned, 72 flown; final loss of flight; pride afterward | Align the aftermath shot and dialogue triggers; keep recovery and milestone moments when simplifying production |
| Pioneer | Existing setting, four returning voices, closing motto | Explicitly imagined listening, sequential voices, one short answer, silence, ending card before optional photos |

The two Viking replies retain the approved wording:

| Arabic | English |
|---|---|
| أحيانًا… لكن ما اكتشفناه يبقى. | Sometimes… but what we discovered remains. |
| واصل يا صغيري. ما زال هناك ما تكتشفه. | Keep going, little one. There's still more to discover. |

The proposed final reply from Pioneer is:

> أسمعكم… أسمعكم جميعًا.
>
> I hear you. All of you.

## The complete emotional journey

The Factory gives the Moon rover trust. The Moon lets it experience being useful and receiving care, so waiting for the astronauts feels natural. Opportunity offers a different kind of persistence: one more discovery, day after day. Viking gives that curiosity companionship without denying loneliness. Ingenuity expresses determination through effort and recovery; losing flight does not erase her achievement. Pioneer lets the player hear every machine again and stay with them briefly.

Keep the final phrase distinct in each performance: hopeful waiting on the Moon, a soft remaining presence in the storm, resolve after Ingenuity is grounded, then recognition during the imagined reunion. Avoid adding explanatory speeches over those moments.

## Pacing proposal

| Segment | Target | Included moments |
|---|---|---|
| Factory | 0:45 | Wake, wheel tutorial, packing and hand gesture, launch |
| Moon | 3:00 | Arrival, three stops, repair, joyful drive, ascent and final line |
| Moon → Mars | 0:10 | Year change and approach |
| Opportunity | 3:30 | Landing, discoveries, three time skips, Viking call, storm |
| Storm → Jezero | 0:10 | Travel and year change |
| Ingenuity | 2:30 | Three playable flights and recoveries, montage, flight 72, failed lift and farewell |
| Mars → space | 0:12 | Look up and leave Mars |
| Pioneer | 1:15 | Orientation, four voices, reply, pullback and ending card |
| **Nominal total** | **11:32** | Short inserts are counted once, inside the chapter targets |

Aim for a measured 12–13 minute first playthrough. These are editing targets, not measured runtime. The current dialogue UI waits for Enter by default; its automatic hold also depends on line length and voice duration. No fixed cut should truncate a line. In particular, the Viking call and four-voice reunion need a real playback check. Reduce repetitive travel if necessary; photo-wall and credits browsing remain untimed.

## Historical framing checked for this revision

- **Pioneer:** last signal received on 23 January 2003. The new chapter subtitle states this before the imagined listening scene; the final reply does not assert that today's spacecraft can receive or transmit. [NASA Pioneer 10](https://science.nasa.gov/mission/pioneer-10/)
- **Viking:** stopped operating in November 1982, before Opportunity arrived. The proposed on-screen call label says it is imagined. [NASA Viking 1](https://science.nasa.gov/mission/viking-1/)
- **Opportunity:** last communication in June 2018; mission declared ended in February 2019. The final setting is Perseverance Valley, separate from the earlier Orion viewpoint. The continuous fading drive is dramatic compression. [NASA Opportunity](https://science.nasa.gov/mission/mer-opportunity/)
- **Ingenuity:** NASA records 72 flights and describes poor tracking over featureless sand ripples as the likely start of the final accident sequence. The final flight was a vertical test; damage affected all four blades. Earlier dips and the attempt to lift afterward are invented character/gameplay moments. [NASA investigation](https://www.nasa.gov/missions/mars-2020-perseverance/ingenuity-helicopter/nasa-performs-first-aircraft-accident-investigation-on-another-world/)

Existing source records in `content/facts.json` remain unchanged. This pass does not certify every environmental value or every legacy source link. The proposed ending card explicitly separates imagined voices/playable scenes from the mission history and photos.

## Concrete integration work

The observations below are from Set A PR #2 at `cb36148e9407106280882e19f36e922105c4c3d3`, not a claim about a later build. Source links are pinned to that revision. The story/content PR leaves Set A and camera code untouched.

| Priority | Area and current observation | Required behavior | Owner |
|---|---|---|---|
| First | [Ingenuity farewell](https://github.com/MohammedAlkaff123/Relica/blob/cb36148e9407106280882e19f36e922105c4c3d3/src/chapters/sky.js#L203) calls both `ch3_goodbye` and its duplicate `ch3_grounded` | Play one goodbye. Keep the alias until older callers are retired | Ziad |
| First | [Final flight](https://github.com/MohammedAlkaff123/Relica/blob/cb36148e9407106280882e19f36e922105c4c3d3/src/chapters/sky.js#L164) asks for scouting and disables lift on a timer | Use the approved vertical test and controllable struggle; the landing causes permanent grounding. Wire `ch3_recover` once and `ch3_last_push` during the final struggle | Ziad |
| First | [Grounded attempt](https://github.com/MohammedAlkaff123/Relica/blob/cb36148e9407106280882e19f36e922105c4c3d3/src/chapters/sky.js#L185) speaks before requiring two Space presses | Trigger `ch3_crash` with the first failed lift. Make continuation visible. No repeated impact in the `last_flight` shot | Ziad + Moayad |
| First | [Storm dialogue](https://github.com/MohammedAlkaff123/Relica/blob/cb36148e9407106280882e19f36e922105c4c3d3/src/chapters/mars.js#L143) starts the whole two-line group halfway through the storm | Say the sky line during darkening; reserve “I'm still here” until movement stops, and await it before the transition | Ziad + Abdullatif |
| Next | [Moon farewell](https://github.com/MohammedAlkaff123/Relica/blob/cb36148e9407106280882e19f36e922105c4c3d3/src/chapters/moon.js#L207) plays the full group after the ascent shot | Match the question, silence, waiting and final wide hold described in STORY.md; avoid parallel dialogue calls | Ziad + Moayad + Abdullatif |
| Next | [Epilogue](https://github.com/MohammedAlkaff123/Relica/blob/cb36148e9407106280882e19f36e922105c4c3d3/src/chapters/epilogue.js) runs the reunion shot and dialogue independently, then shows photos before the ending card | Advance the camera with each voice. Return to Pioneer for the answer. End card before optional photo wall. Do not make Pioneer visibly transmit the other machines' lines | Ziad + Moayad + Abdullatif |
| Next | [Milestone card](https://github.com/MohammedAlkaff123/Relica/blob/cb36148e9407106280882e19f36e922105c4c3d3/src/chapters/sky.js#L145) announces 72 flights while the counter is still 71 | Show the achievement after flight 72 has completed, preferably during the proud farewell so it does not interrupt the failed-lift silence | Ziad + Abdullatif |
| Next | Factory gesture, repair eye-line and Viking conversation | Author the reviewed gestures once, show who is speaking, and make the imagined-call label readable | Moayad + Abdulkarim + Abdullatif |

The current dialogue API supports `play(id, { auto })`, but not a per-line stage callback. Owners should agree on one timing interface or compatible split IDs before implementing line-dependent shots. The draft deliberately preserves every existing dialogue ID so it can be merged without breaking old callers.

## Review and playthrough acceptance

1. Read the Factory and Moon beats aloud. The waiting must still feel trusting after the ascent.
2. Read the six-line Viking call. Its final sentence should send Opportunity back toward discovery.
3. Check the 5 → 72 sequence. Earlier recoveries must be readable and repeatable; the final outcome must feel like loss of flight, not a player failure screen.
4. Read the four reunion lines sequentially, then Pioneer's answer. Each machine should have a moment of its own before the final quiet.
5. In the integrated game, check that no ending line repeats, no subtitle is cut off, and every scripted wait has a clear way forward. Check chapter restart and skip behavior separately from narrative approval.
6. Confirm the fiction labels and real photo captions remain readable. Record actual runtime and any failed checks in TESTLOG.md after playing; this document is not a passed playtest.

For the directors' next review: accept or adjust the patient-explorer staging, the Pioneer reply and final order, and the proposed shot timing. The already-approved Viking wording and Ingenuity fighter direction are preserved.
