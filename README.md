# Relica

A short low-poly story game about the machines NASA left behind on the Moon, on Mars and in deep space.
Built for the NASA Space Apps 2026 challenge "Abandoned but not Forgotten".

- [PLAN.md](PLAN.md): the overall plan, rules, tech and timeline
- [STORY.md](STORY.md): the story beat by beat, every dialogue line's intent, the shot list
- [TASKS.md](TASKS.md): who does what, with hand-off times

Set A is Ziad, Set B is Abdulkarim, Set C is Abdullatif. The camera file `src/core/followCamera.js` belongs to Moayad.

## Run it

You only need Python. There is nothing to install and no build step.

```bash
python serve.py
```

Then open http://localhost:5173

Opening `index.html` by double-click does not work: browsers only load the game's code from a server.
The page needs internet, because Three.js, Rapier and lil-gui load from a CDN (see `index.html`).

## Controls

| Key | What it does |
|---|---|
| W A S D or arrows | Drive or fly |
| Space | Hop (rovers), climb (helicopter) |
| Enter or click | Continue a card, a dialogue line or a memory photo |
| E | Finish the current chapter (placeholder until real goals exist) |
| 1 2 3 4 5 | Jump to a chapter: opening, Moon, Mars, Mars sky, epilogue |
| Escape | Skip a cutscene |
| ` (under Escape) | Show or hide the tuning panel. Add `#dev` to the address to start with it open |

## What exists right now

A skeleton that plays from the title card to the ending with boxes for characters:
every system in the plan has a small working version, and every chapter is a stub you can finish with E.
Each file starts with a comment that says who owns it and lists its TODOs.

## Folders

```
index.html, style.css   page and interface styles
serve.py                local server
src/main.js             boot and frame loop                      Set A
src/core/               loop, input, physics, chapters, camera   Set A
src/vehicles/           rover and helicopter controllers         Set A
src/chapters/           one file per chapter + _stage.js         Set A
src/cinematics/         cutscene player, handheld sway           Moayad
src/characters/         characters, faces, emotions              Set B
src/world/              ground, sky, light, rocks                Set B
src/ui/                 dialogue, HUD, memory photos, cards      Set C
src/audio/              sound                                    Set C
src/dev/                tuning panel
content/facts.json      real-world numbers (HUD + physics)       Set C
content/dialogue.json   every line, Arabic + English             Set C + Mohammed
content/memories.json   titles and crops for memory photos       Set C
content/shots/          cutscene camera keyframes                Moayad
content/tuning.json     feel numbers (speed, camera, lift)       Mohammed
public/models/          .glb models                              Set B
public/nasa/            NASA photos used in the game + metadata  Set C
nasa_data/              the full original data pack
```

## The contracts

Inside a chapter everything arrives through `ctx`:

```js
ctx.hud.setWorld('mars')                 // environment panel from facts.json
ctx.hud.setStat('sol', '4,712')          // extra HUD row
ctx.hud.setObjective('Drive to the rock')
await ctx.card.show('Mars', 'Meridiani Planum')
await ctx.dialogue.play('ch2_viking_call')
await ctx.memory.show('PIA07108')        // real NASA photo by its NASA id
await ctx.cinematics.play('moon_to_mars', stage.hero.object)
ctx.next()                               // go to the next chapter
```

Interface and sound (Set C):

```js
ctx.hud.setMission('moon')               // mission list, text from content/missions.json
ctx.hud.completeTask(0)                  // tick a task off, with a sound
ctx.hud.setBonus('3.1 s')                // bonus line under the tasks (longest jump)
ctx.hud.setBattery(0.4)                  // battery bar, 0..1
ctx.hud.setCounter('sol', 4712, 90)      // value with "planned: 90" beside it
ctx.hud.discover('moon_gravity')         // discovery card from content/discoveries.json
await ctx.card.chapter('mars')           // chapter card from content/chapters.json
await ctx.card.title()                   // title screen
await ctx.card.ending()                  // "The conversations are imagined..."
await ctx.card.credits()                 // credits
await ctx.dialogue.play('ch2_viking_call', { auto: true })  // lines advance on their own
ctx.audio.setWorld('mars')               // background: factory | moon (silent) | mars | space
ctx.audio.setWind(1)                     // the dust storm
ctx.audio.play('crack')                  // one-shot: tick, land, bounce, crack, crash, rumble, static...
ctx.audio.loop('rotor', true)            // looping: rotor | hum, with ctx.audio.loopLevel('rotor', 0.7)
ctx.audio.music('drive')                 // drive | storm | ending | null
```

All the text the player reads lives in `content/` (dialogue, missions, discoveries, memories, chapters,
credits), with Arabic and English side by side. Change text there, not in the code.

A character:

```js
hero.setEmotion('sad')   // curious | happy | scared | sad | sleepy
hero.talk(true)          // signal rings from the antenna
```

After every `await` inside a chapter, check `if (!stage.alive) return;`.
The player may have jumped to another chapter while you were waiting.

## Changing feel without code

Press `` ` `` to open the tuning panel and move the sliders. When it feels right, press **Copy values**
and paste the result over `content/tuning.json`.

## Putting it online (GitHub Pages)

1. Push this folder to a public GitHub repository.
2. Repository Settings, Pages, "Deploy from a branch", branch `main`, folder `/ (root)`.
3. The game is live at `https://<user>.github.io/<repo>/` a minute later.

Because there is no build step, what is in the repository is exactly what is served.

## Before the pitch

The libraries load from a CDN. If the venue wifi is bad the game will not start.
Either test on the venue network early, or download the four files listed in `index.html` into a
`vendor/` folder and point the import map at them.

## Rules we must not break

- No NASA logos or insignia on models or in the interface.
- No AI-generated images or video (they would need a watermark).
- Nobody under 18 seen or heard. `nasa_data/.../viking_landers/NHQ201707210014.jpg` shows a child: never use it.
- AI tools leave no trace of themselves in the work: no co-author or "generated with" lines in commits or pull requests. The rule for the tools is in [AGENTS.md](AGENTS.md).
- Every use of AI goes in [AI_USE.md](AI_USE.md), our disclosure log. The challenge requires it.
- A number that is not verified against a NASA page does not ship. `content/facts.json` tracks this.

## Credits

NASA photos: see `public/nasa/CREDITS.csv`.
Libraries: Three.js (MIT), Rapier (Apache-2.0), lil-gui (MIT).
Fonts: Space Grotesk, IBM Plex Mono, IBM Plex Sans Arabic (SIL Open Font License), from Google Fonts.

---

# Submission

The sections below are the upload pack for NASA Space Apps 2026. They are kept here so the form can be
filled by copying from one place.

## How to run it

1. Install Python 3 (nothing else is needed).
2. In this folder run `python serve.py`.
3. Open http://localhost:5173 in a current desktop browser (Chrome, Edge or Firefox).
4. Press Enter to start. W A S D to drive or fly, Space to hop or climb, Enter to continue.

The game also runs from the GitHub Pages link of this repository with no install at all.

## Tools used

| Tool | What for |
|---|---|
| Three.js | 3D rendering in the browser |
| Rapier | Physics, with each world's real gravity |
| lil-gui | Tuning panel for the directors |
| Web Audio API | Every sound and music cue, generated in code |
| Python `http.server` | Local server (`serve.py`) |
| Blender and an image-to-3D tool | Low-poly models, using the NASA photos as reference |
| GitHub and GitHub Pages | Code and hosting |
| Claude Code | AI help with code and text drafts. See the AI disclosure below |

## NASA data statement

Every real-world number, date and photo in the game comes from NASA.

| NASA data | File in this repository | Where it appears in the game |
|---|---|---|
| Planetary fact sheets (gravity, temperature, air pressure of Earth, the Moon and Mars) | `content/facts.json` → `worlds` | The environment panel on screen in every chapter. The physics uses the same gravity number |
| Mission pages and history articles (dates, places, planned and actual lifetimes) | `content/facts.json` → `missions` | Chapter cards, the "planned" counters (90 sols, 5 flights), the dialogue, the discovery cards |
| NASA Image and Video Library photos | `public/nasa/` with `metadata.json` and `CREDITS.csv` | Memory photos at key moments, the photo wall at the end, and the credits |
| The same photos | `nasa_data/` (the full pack) | Reference images for every 3D model |

The memory photos shown in the game: `S71-16722`, `as17-137-20979`, `PIA20285`, `PIA07108`, `PIA21708`,
`PIA23882`, `PIA23969`, `ARC-1972-AC72-2135`, `ARC-1972-A72-2137`. Each one was checked by eye: nobody under 18,
and no NASA logo left in frame after cropping.

Each fact in `content/facts.json` carries the link of the NASA page it was checked against. A fact without a
source is marked `"verified": false` and shows an orange "?" in the game.

## AI disclosure

AI was used, and every use is listed with the person and the tool in [AI_USE.md](AI_USE.md).
In short: Claude Code helped draft the plan documents, write code for the game systems and interface, draft
dialogue for the team to choose from, and look up NASA sources for the facts. No AI-generated images or video are
used. The idea, the story and the choices are the team's own, and each team member can explain their part.

## References

- NASA photos: [public/nasa/CREDITS.csv](public/nasa/CREDITS.csv) (each row links to its page on images.nasa.gov)
- NASA fact sheets: [Earth](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html),
  [Moon](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html),
  [Mars](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html)
- NASA mission pages: [Opportunity](https://science.nasa.gov/mission/mer-opportunity/),
  [Viking 1](https://science.nasa.gov/mission/viking-1/), [Pioneer 10](https://science.nasa.gov/mission/pioneer-10/),
  [Ingenuity](https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/),
  [Apollo Lunar Roving Vehicle](https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html)
- Every other fact source: the `source` links in [content/facts.json](content/facts.json)
- Code libraries: [Three.js](https://threejs.org) (MIT), [Rapier](https://rapier.rs) (Apache-2.0),
  [lil-gui](https://lil-gui.georgealways.com) (MIT)
- Fonts: Space Grotesk, IBM Plex Mono, IBM Plex Sans Arabic (SIL Open Font License), Google Fonts
- Sounds: generated in code. Any sound file added later is listed here with its source and licence
