# Set B handoff: Abdulkarim's look pass (14–15 November)

For whoever continues Abdulkarim's work (Set B: `src/characters/`, `src/world/`, `public/models/`).
Read `AGENTS.md`, `PLAN.md`, `STORY.md` and `TASKS.md` first, as always. Everything below is on `main`.

## Rules that still apply

- Commits are authored by Abdulkarim alone (`KEMO <krem3437@gmail.com>`). No AI attribution lines in commits or PRs. AI use goes in `AI_USE.md` only, one line per pass.
- Stay in Set B's folders. When a change has to touch someone else's file, say so to them (see "Files outside Set B" below).
- After adding or changing any asset or source file, run `node tools/make-preload.mjs` so the loading screen knows about it (Vercel also runs it on deploy).
- Many files use CRLF line endings. Edit them in place keeping their endings; rewriting a whole file with other endings shows up as a 1,500-line diff.
- Keep the look childlike and simple. The one approved exception: the astronauts may have more shape and detail than the rest.

## What was done, and where

| Area | What | Where |
|---|---|---|
| Shadows | Option B: soft filter (`PCFSoftShadowMap`) on every level; small bias so shadows start at the feet and wheels; the shadow box moves in whole texels so edges do not crawl; small rocks cast on Medium too; the three historic photo sets cast shadows | `src/core/quality.js` (one line), `src/world/world.js` (`applyQuality`, `updateShadow`), `src/world/photoSet.js` |
| Astronauts and factory workers | One low-poly suit for everyone: cream suit, charcoal pack with aerial and amber tip, gloves, boots, coloured bands (first crew member orange, second red as on Apollo 17). Same joints and names as before, so every action (walk, sit, collect, repair, reassure, farewell) still works | `src/world/props.js` (`makeFigure`) |
| Wheel dust | Option D: soft puffs that swell and fade, plus a low haze left over the tracks; doubled in size and amount at Abdulkarim's request. On the Moon the puffs fly arcs and vanish on landing (no air) | `src/world/effects.js` (`makePool`), `src/world/softPoints.js` (shared soft-puff renderer) |
| Mars whirlwind | Option B: a soft leaning column of dust with a skirt at its foot, 14 m tall (doubled). It cancels the chapter's fast spin of the prop so it does not whirl like a stick | `src/world/props.js` (`whirlwind`) |
| Perseverance | Rebuilt from simple shapes (NASA's cut-down model fell apart). Six wheels `wheel_FL`…`wheel_BR` that roll forward and backward with the prop's movement | `tools/models/build_perseverance.mjs` → `public/models/perseverance.glb`; rolling in `props.js` (`rolling`) |
| Lunar Module | Rebuilt from simple shapes: gold eight-sided descent stage on four legs, ladder and porch, crew cabin with windows, tanks, thrusters and antennas. Parts `descent` and `ascent`. At lift-off an engine flame burns under the cabin and gold foil scraps fly off and land flat | `tools/models/build_lm.mjs` → `public/models/lunarModule.glb`; flame and scraps in `props.js` (`launching`) |
| Moon rover fold | Folding (factory) and unfolding (Moon start) no longer squash the model: the wheels draw in and the camera post and antenna lie back. `character.folded` 0..1 | `src/characters/character.js`, `src/chapters/opening.js`, `src/chapters/moon.js` |
| Moon lift-off scene | The 3D climb now starts when the conversation's first shot looks at the cabin, not during the camera mini-game (it used to be a dot 200 m up by then). Dialogue sits above the letterbox bars | `src/chapters/moon.js`, `style.css`. Ziad's later commit "dialogue above cutscene bars" touches the same thing: check they agree |
| Sun | Bigger dot with a soft glow and a level streak of light; drawn low near the horizon (about 3° up, within ~18° of straight ahead) so players see it. Light and shadows keep the true direction. Deep space is unchanged on purpose. Per world: `discHeight`, `discAt` in `LOOKS` | `src/world/world.js` |
| Viking 1 (the old one) | Option E: long tin-foil beard almost to the ground, heavy brows, heavy lids that never open fully. Other looks still in code: `now`, `tin`, `grandpa`, `weathered`, `elder` (`look` on the viking line of `CAST`) | `src/characters/character.js` |
| Metal surface on all machines | Option D, medium strength, with a light shine: Poly Haven "Blue Metal Plate" (CC0). Colours stay each machine's own; only marks, roughness and dents come from the photo. Laid on from three sides (the models have no UVs and no normals). Applied to the five characters and to the Lunar Module and Perseverance props; eyes and faces stay plain | `src/world/surface.js`, `public/textures/metal_plate.jpg` (source and processing in `public/textures/README.md`) |
| Mars findings | The three water findings show on a card at the bottom and the drive continues; no full-screen card to dismiss | `src/ui/hud.js` (`hud.note`), `src/chapters/mars.js` (`investigate`), `style.css` |

## Review pages (not part of the game)

Run `python serve.py`, then open `http://localhost:5173/tools/<page>`:

- `shadow-samples.html` shadow options A–E (B chosen)
- `astronaut-samples.html` early astronaut options (none chosen; replaced by the suit above)
- `effects-samples.html` whirlwind A–D and dust A–D (whirlwind B, dust D chosen)
- `viking-samples.html` Viking looks A–E (E chosen)
- `character-texture-samples.html` procedural surfaces (not used)
- `metal-texture-samples.html` Poly Haven metals B–G (D chosen). Loads the textures from Poly Haven, so it needs the internet

## Not verified yet

- The full self-test (`?test&speed=4`) was not run after these changes.
- The Moon lift-off fix was checked in code and the subtitle position on screen, but the scene was not played through to the end.
- Folding in the factory, the whole Mars water route, and Perseverance inside chapter 3 were not watched end to end.
- The doubled dust on the Moon may be too thick in the fender scene.
- Frame rate on a weak laptop with the soft shadows, metal surface and doubled dust is unmeasured.

## Files outside Set B that were changed

`src/core/quality.js` (Ziad), `src/chapters/moon.js`, `src/chapters/mars.js`, `src/chapters/opening.js` (Ziad), `src/ui/hud.js`, `style.css` (Abdullatif). The owners should know.

## Known issue not caused by Set B

`src/boot.js:41` (`drawSky`) throws "Cannot read properties of null (reading 'style')" in the console when the page changes. Abdullatif's file.

## Practical notes for the next tool

- From the AI sandbox only GitHub and package registries are reachable; Poly Haven, jsDelivr and similar are not. A texture has to be fetched in a browser or by a person and saved into `public/textures/`.
- In GLSL, `half` is a reserved word. Do not use it as a name.
- Pushing to GitHub has to be done from Abdulkarim's own terminal: `git push origin main`.
