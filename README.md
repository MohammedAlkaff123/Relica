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
