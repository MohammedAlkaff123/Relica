# Sound handoff: from Ziad (Set A) to Abdullatif (Set C)

These are the moments in the chapters that have an effect on screen and need a sound. **The code already
calls every name below.** As soon as `src/audio/audio.js` has the name, the sound plays in the game with no
other change. Until then, the moment is either silent or plays the stand-in shown in the table.

## One thing needed in `audio.js` first: `audio.has(name)`

```js
has: (name) => name in SOUNDS || name in LOOP_BUILDERS,   // true if this name exists
```

Stand-ins only work if this exists. `stage.sound(name, standIn)` plays `name` when `audio.has(name)` is true,
and `standIn` otherwise. Without `has`, the stand-in always plays, so new sounds are never heard.

## New one-shot sounds (`audio.play(name)`)

| Name | When it plays | Where in the code | Stand-in now | What it should sound like |
|---|---|---|---|---|
| `strap` | Moon: a sample box is strapped onto the rover (3 times) | `moon.js` `addSampleBox` | `land` | a strap pulled tight, or a click and a soft thump |
| `liftoff` | Moon: the top half of the Lunar Module lifts off (with the dust burst) | `moon.js` | `rumble` | engine ignition and a roar that fades as it rises. No air on the Moon, so muffled, felt through the ground |
| `panels_clean` | Mars: driving through a whirlwind sweeps the solar panels clean, the battery jumps | `mars.js` `updateWhirlwinds` | `park` | a whoosh of wind, then a rising "power back" tone |
| `battery_low` | Mars: the battery drops under 25% (once, until it charges again) | `mars.js` tick | `powerdown` | a gentle warning beep, two notes going down. Not an alarm |
| `time_skip` | Mars: each of the three time skips (the sol counter races) | `mars.js` `timeSkip` | none | a soft whoosh or a fast ticking clock |
| `mark` | Ingenuity: E marks a danger from the air (3 times) | `sky.js` | `park` | a confirm ping, like dropping a pin |
| `drift_warning` | Ingenuity, flight 72: the moment the drift starts | `sky.js` | none | a quiet unsteady wobble or a single uneasy tone. This is where the player starts to lose control |
| `rotor_twitch` | Ingenuity after the crash: each Space press, the broken rotor twitches for half a second | `sky.js` (`heli.onTwitch`) | none | a weak motor spin-up that dies at once. The saddest sound in the chapter |
| `fold` | Opening: the workers fold the rover in half | `opening.js` | none | metal joints and hinges clicking into place |
| `shutter` | Photo tasks: capturing an image (the three historic photos and Pioneer's Jupiter image) | `_historicPhoto.js`, `_pioneerPhoto.js` | `tick` | a camera shutter |

## New loops (`audio.loop(name, on)` and `audio.loopLevel(name, 0..1)`)

| Name | When it runs | Level (0 to 1) | What it should sound like |
|---|---|---|---|
| `dust_spray` | Moon: from the fender break to the repair at stop 2 | on/off | dry grit spraying, a hiss. No air on the Moon, so soft |
| `whirlwind` | Mars: while whirlwinds wander the plain | louder as the rover gets close (1 inside 0 m, 0 at 25 m and more) | a swirling wind rising and falling |

## Already hooked up to your existing sounds (nothing to do)

| Your name | Moment |
|---|---|
| `hum` (loop) | **Newly turned on:** the rover's motor in every chapter where you drive, the level follows speed |
| `rotor` (loop) | Ingenuity's blades, level follows the rotor speed |
| `crack` | Moon: the fender breaks. Ingenuity: the blade breaks |
| `crash` | Ingenuity: the hard landing on flight 72 |
| `bounce` | Mars: each airbag bounce on landing |
| `land` | Moon: landing after a jump that lasted more than half a second |
| `park` | Moon: a neat park in the middle of the circle |
| `powerdown` | Mars: the end of the storm |
| `static` | Mars: before Viking's radio call |
| `rumble` | Opening: the launch |
| `tick`, `discover`, `memory` | mission tasks, discovery cards, photos (your HUD plays these) |
| music `drive` / `storm` / `ending` | Moon free drive / Mars storm / the ending |
| `setWind(level)` | follows the Mars storm level, 0 to 1 |

## How to check

- `python serve.py`, then:
  - `localhost:5173/?chapter=2`: Moon (dust, marker beep, strap, liftoff)
  - `?chapter=3`: Mars (whirlwinds, battery, time skips)
  - `?chapter=4`: Ingenuity. Key `9` jumps straight to flight 72 (drift warning, rotor twitch)
  - `?chapter=1`: the opening (fold)
- If a name is wrong, nothing breaks: `audio.play` with an unknown name stays silent.
- After adding sounds, run `?test&speed=4`. It should still pass every check.

The names and moments are open to change. If you'd rather use another name, tell Ziad and he'll change it
in the chapter code.
