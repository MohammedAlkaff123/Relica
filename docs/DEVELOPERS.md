# Developer notes

How the code is laid out and how a chapter talks to the rest of the game. For judges, the project overview is in the [README](../README.md).

Team-only planning and hand-off notes are in [docs/team/](team/).

## Shortcuts for testing

Add these to the address: `?chapter=3` (start a chapter), `?jump=storm` (a moment inside a chapter), `?test&speed=4` (automated self-test), `&lang=ar` or `&lang=en` (language for one visit), `&mute` (start silent).
After adding or changing assets, run `node tools/make-preload.mjs` so the loading screen knows about them (Vercel also runs it on every deploy).
Sound test page: http://localhost:5173/tools/sound-test.html

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
await ctx.card.credits()                 // end screen (team, sources); only its buttons close it: 'menu' or 'again'
await ctx.dialogue.play('ch2_viking_call', { auto: true })  // lines advance on their own
ctx.audio.setWorld('mars')               // background: factory | moon (silent) | mars | space
ctx.audio.setWind(1)                     // the dust storm
ctx.audio.play('crack')                  // one-shot: tick, land, bounce, crack, crash, rumble, static...
ctx.audio.loop('rotor', true)            // looping: rotor | hum, with ctx.audio.loopLevel('rotor', 0.7)
ctx.audio.music('drive')                 // drive | storm | ending | null
```

```js
ctx.hud.setHold({ key: 'E', text, progress, pressing })   // hold prompt: keycap + bar from green to red (stage.hold uses it)
ctx.hud.setControls('heli-air')          // keys bar at the bottom: 'heli-ground', 'heli-air', 'rover' or null (the stage sets it)
ctx.audio.speak('viking', line.en, 'sad')                // a voice with emotion: curious | happy | sad | sleepy | scared
ctx.audio.has('strap')                                   // true if the sound exists (stage.sound stand-ins)
ctx.audio.setVolumes({ master, music, voice, sfx }, muted) // the player's levels from Settings
ctx.shell.pause(true)                                    // open the pause menu
```

Main dialogue, missions, discoveries, memories and cards live in `content/` with Arabic and English side by side. Chapter code may keep writing English prompts: `src/ui/i18n.js` translates them where the interface draws them, so the whole game switches language. A new English prompt in a chapter needs one line in the dictionary in `src/ui/i18n.js`.

A character:

```js
hero.setEmotion('sad')   // curious | happy | scared | sad | sleepy
hero.talk(true)          // signal rings from the antenna
```

Use stage helpers or `await stage.do(promise)` for asynchronous chapter work. They cancel with `Gone` on restart/chapter change. Register temporary scene/UI cleanup with `stage.onDispose`.

## Changing feel without code

Press `` ` `` to open the tuning panel and move the sliders. When it feels right, press **Copy values**
and paste the result over `content/tuning.json`.
