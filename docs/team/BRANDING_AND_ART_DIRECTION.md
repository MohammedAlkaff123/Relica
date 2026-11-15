# RELICA: Still Here — ريليكا: ما زلتُ هنا

Director brief, 14 November 2026. The title is approved. UI/branding delivery is open. The supplied Outer Wilds wallpaper collection is now the visual reference direction; the first RELICA art slice still needs director review.

## Name and ownership

- English title: **RELICA: Still Here**.
- Arabic title: **ريليكا: ما زلتُ هنا**.
- “Abandoned but not Forgotten” / the Arabic challenge title describes the challenge, not the game name. Keep it in challenge credits/submission context.
- Abdullatif (Abdulatif): game logo, bilingual wordmarks, brand system, main menu, HUD and interface components, language copy and sound presentation.
- Abdulkarim: world materials, textures, lighting, restrained environmental effects and switchable Low/Medium/High visual presets; existing character animation and photo reconstruction work continues.
- Ziad: menu/start/pause/input lifecycle, renderer/settings integration and performance support. Abdullatif owns the graphics selector; Abdulkarim owns the three visual presets. Moayad approves look and readability; Mohammed reviews language, comprehension and feel.
- Existing pitch slides/video use the earlier short title. Update their title/wordmark during the branding pass and recapture final media after visual approval.

## Main menu and Arabic — Abdullatif, open deliverables

The current build starts with a title card and Enter prompt, not a finished menu. It shows both dialogue languages together and still has English HUD/objective strings. Do not mark this work complete merely because some Arabic text exists.

1. Deliver a real menu with Start / ابدأ, Settings / الإعدادات, How to play / طريقة اللعب, Credits / فريق العمل, and a visible **العربية / English** choice before gameplay. Only show Continue if an actual saved checkpoint exists. Browser games do not need a misleading Quit button.
2. Language selection updates the menu immediately and persists across reloads; tolerate unavailable browser storage. Offer the same choice in settings. Set the document language, Arabic RTL layout and appropriate alignment. Keep keyboard labels, NASA identifiers, citations and numeric/unit runs readable with explicit direction handling.
3. Translate the whole player-facing interface: objectives, mission steps, hints, navigation text, photo instructions, loading/error states, settings, chapter cards, service tributes and credits headings. Preserve source citations, original image credits and historical distinctions. Scan hard-coded chapter/UI strings as well as JSON content.
4. Use the selected language for primary dialogue and captions; offer optional secondary subtitles. Text must remain reader-paced and readable over every scene. Preserve Enter behavior and photo-viewfinder controls. Language changes must not restart a mission or lose captured memories.
5. Build shared components/tokens for buttons, panels, dialogue, objectives, mission list, navigation, photo frame, chapter cards, settings and credits. Supply hover, focus, pressed and disabled states; use text/icons as well as color. No isolated first-version panels after the redesign.
6. Deliver editable logo/wordmarks and lightweight exports, clear-space/minimum-size guidance, palette, Arabic/Latin typography, spacing and icon rules. Keep brand assets separate from the historically credited NASA imagery. The concept board is not a logo proposal.
7. Support keyboard focus, visible focus outlines, touch-sized menu controls, readable scaling and small screens. Avoid blurred/glassy layers and decorative particle backgrounds. Any menu motion should be subtle and respect reduced-motion preference.
8. Coordinate with Ziad: menus block gameplay input; pause/settings freeze relevant game progression, restore focus and controls on close, and do not collide with Escape cutscene skipping. Existing deep links and test/pitch jumps must remain usable.

Acceptance: start in Arabic, reload, play a mission, open settings, switch to English and back, complete a photo task, then read the ending and credits. Verify no lost progress, no overlapping text, correct RTL and no unexplained English prompts. Check desktop and narrow phone layouts with real Arabic fonts. Mobile menu support alone does not establish mobile gameplay support; touch controls and device testing are a separate integration check.

## Supplied visual reference — Outer Wilds

The director supplied `outer_wilds_wallpapers.zip` after the initial A/B/C exploration. Use this collection as the reference direction, rather than treating A, B or C as selected. The descriptions below are the visual interpretation of the supplied images; review the first original RELICA slice with Moayad before extending it across every chapter.

(The Outer Wilds reference contact sheet was removed from the public repository before submission because it is copyrighted game art.)

Reference images: Outer Wilds; supplied by the director for art discussion. This contact sheet is documentation only and is not loaded by the game. Build original RELICA assets and branding.

| Reference in the archive | What to carry into RELICA |
|---|---|
| `OW_Campfire.png` | Chunky readable forms, selective surface detail, warm focal light against cool shaded ground; retain softness and character readability |
| `OW_Moon.png` | Strong foreground silhouettes, quiet dark space and a large celestial focal point; create awe through framing and scale |
| `OW_Village.png` | Simplified textured environments, controlled palette, distant depth and clear sun direction |
| `OW_ShipInterior.png` | Believable worn materials and readable functional machinery; reduce clutter for our smaller scenes |
| `OW_Skeleton.png` | Layered silhouettes, distance and dramatic scale; use the compositional idea without adding its fantasy creatures or atmosphere to airless lunar scenes |
| `OuterWilds_4k Background image.jpg` | Small explorers against a vast dark sky and a warm visual anchor; RELICA keeps its own wordmark |

Direction: approachable stylized realism, not smooth plastic and not dense photorealism. Preserve clean forms with restrained painted/roughness variation. Warm/cool separation and deliberate shadows provide drama. NASA terrain, machine proportions, emotional face rigs and historical-photo framing remain the factual/functional constraints. Moon/deep space remain airless; Mars gets restrained dusty depth. A large planet is a composition reference, not permission to change historical views or astronomical scale in photo tasks.

## Low / Medium / High graphics — world/runtime implemented, selector OPEN

**Abdullatif:** add **Graphics quality / جودة الرسومات** to both main-menu Settings and in-game Settings, with **Low / منخفضة**, **Medium / متوسطة**, **High / عالية**. Show the current selection, a short localized description, and keyboard/touch-accessible states. Save the preference and restore it before the first world loads; handle unavailable storage. Medium is the initial default when no preference exists. No automatic quality changes that silently override the player's selection.

**Abdulkarim / Moayad continuation:** implemented world presets; maintain all worlds, materials, textures, shadows, decorations and effects to support these three modes. Provide a shared preset definition and an `applyQuality` hook for each active world/effect; dispose resources cleanly when changing settings or chapters. The same art style, silhouettes, palette and mission readability must survive in all modes. Low is a finished visual target, not a placeholder version.

**Ziad:** connect the selector and presets through one runtime settings API, apply resolution/shadow settings, pass the chosen preset to newly loaded worlds and coordinate safe asynchronous asset changes. The runtime and world/effect hooks now implement selectable presets; Abdullatif’s selector UI is still open. See DIRECTORS_HANDOFF.md for completion evidence.

Suggested integration contract (to implement, not an existing API): `quality.get()` returns `low|medium|high`; `await quality.set(level)` updates the renderer and active world; `quality.subscribe(listener)` updates the UI and returns an unsubscribe function. Put preset values in one shared data file. The UI must not reach into individual world meshes. Validate saved values, retain the previous working preset if loading fails, and allow only the latest change to finish when the player clicks rapidly.

Starting budgets below are tuning proposals, not measured performance promises. Abdulkarim and Ziad may adjust them together after profiling, preserving the three clear quality levels.

| Feature | Low | Medium | High |
|---|---|---|---|
| Drawing-buffer pixel-ratio cap | 1.0 | 1.5 | 2.0 |
| Contact / sun shadows | Baked or simple contact shading; no dynamic shadow map | One tightly bounded 512–1024 sun shadow map if the device budget allows | One bounded map up to 2048 with a few important casters |
| Shared material textures | Typically 256–512 px variants | Typically 512–1024 px | Up to 1024–2048 for close-up hero surfaces where justified |
| Decorative rock/debris detail | Reduced counts and earlier distance culling | Standard counts and distance | More nearby decorative detail; same terrain and landmarks |
| Local dust pool | About 25% of the profiled maximum | About 50% | Up to the fixed profiled maximum; never unbounded |
| Stars and atmosphere | Sparse static stars; inexpensive Mars fog/color | Same composition, modest extra depth/detail | Same composition with restrained extra detail |
| Post-processing | None required | None required | Optional only after profiling; no dependency on bloom, volumetrics or depth of field |

Texture size means real asset/residency reduction, not just a lower texture-filter setting. Load the appropriate variants and release superseded GPU resources safely; do not download or retain every high-resolution map on Low. Device capability limits may cap a setting, but the interface must explain a fallback rather than showing High while silently rendering a different preset. Keep DOM text/menu rendering at full CSS resolution when lowering the 3D drawing buffer.

Across modes preserve physics/collision, routes, mission timing, science targets, navigation arrows, emotional faces, camera shots, photograph alignment and real-photo reveal quality. The storm still visibly blocks sunlight and ends the mission on Low. Important silhouettes must not pop during close-up cutscenes. No setting may remove a gameplay obstacle or historical photo feature.

Switch without page reload, mission restart, lost photos or dialogue advancement. Apply safely at a frame boundary; return control only after the UI is closed. Do not promise toggling constructor-only renderer options such as WebGL antialiasing through a simple property change; keep those fixed unless Ziad deliberately implements and validates renderer recreation.

Acceptance for the joint handoff:

- Switch Low → Medium → High → Low in every world, then restart and jump chapters. Confirm the selected mode persists and newly loaded worlds inherit it.
- Repeat in Arabic and English, reload the browser and test storage failure/invalid values. Check that saved progress and language preference are unaffected.
- Check switching during the storm, a conversation and photo framing; no lost inputs, paused-state leaks or hidden mission targets.
- Record draw calls, texture/geometry residency and frame times on the demo laptop and a named lower-end device for each mode. Repeated switches must not steadily increase memory or accumulate emitters/lights/listeners.
- Compare the same Moon/Mars/Pioneer camera frames at all three levels. Low must still feel intentional and majestic. Maintain the existing 30/60 fps targets as targets until measured.

## Constraints for the eventual art pass

These apply to every option; they are not a claim that all devices are supported.

- Aim for children and adults: recognizable machines, readable eyes, believable material differences, approachable shapes, no noisy photoreal grit. Preserve emotion rigs and mission readability.
- Create grandeur through composition, distant silhouettes, scale, light direction and quiet negative space. In space and on the Moon, use a restrained static star field. Avoid colorful nebula wallpaper, glitter, lens flares and constant floating sparkles.
- Use small shared/tileable textures or atlases, vertex colors and baked contact shading. Start around 256–512 px for minor assets and 1024 px for important shared atlases; increase only when a close-up demonstrates need. Reuse materials and rocks rather than creating many unique texture sets.
- Prefer one sun/key light per world with inexpensive fill. Keep dynamic shadow casters limited; provide a low setting using baked/contact shadows. Do not require screen-space reflections, ambient-occlusion passes, volumetric fog, depth of field or bloom for the look to work.
- Moon wheel dust should be a short, low ballistic spray that settles; Mars driving dust should trail near wheels. Rotor dust appears near the surface, not as airborne glitter. The final storm needs broad atmosphere/fog and declining sunlight, with only a small local dust layer to suggest motion.
- Reuse a fixed pool of sprites/points, limit transparent screen coverage, stop emissions when idle and clean up on chapter change. Lower the count on low quality. Preserve instrument targets, arrows and text visibility during the storm.
- Start with one small Moon/Mars material-and-lighting slice, compare it against the approved reference at actual gameplay/cutscene distances, and record texture memory, draw calls and frame times before expanding. Target 30 fps on an agreed low-end test device and 60 where feasible; these are targets, not measured promises.
- Test on the actual demo laptop plus a representative low-end phone/integrated-GPU device. Record browser/device, resolution, quality preset and slow scenes in TESTLOG.md. Broad support also requires loading, memory, WebGL and input checks.

Final acceptance belongs to Moayad and Mohammed after reviewing the slice, not to a concept image. Retain the historical-photo framing and fade-to-original transitions throughout the art pass.


## Set B completion under Moayad — 14 November

Moayad approved **G / sand_01 / Ready-made CC0 / Our palette for Moon and Mars**. Jezero uses the same selected detail with its own Mars ground color. The local 256/512/1024 variants replace H / rocks_ground_05; source, license and reproducible processing are in public/textures/README.md and tools/textures/make.mjs.

Delivered: retained Abdulkarim’s warm/cool lighting, massifs and skyline; unified renderer/world/effect presets in content/quality.json; fixed the preset-object/level-name mismatch; implemented bounded quality-dependent dust and storm particles, moving shadow coverage, safe texture loading/rollback and chapter cleanup. Added collect/kneel, repair, reassurance/pat and farewell actions to the procedural figures using Ziad’s existing hooks. Figure animation now follows game time and pauses correctly. Completed mission prop replacements (height band, route flag, sand trap, boulders, cliff edge and restrained whirlwind). Refined the three historical-photo sets with instrument silhouettes, surface detail and instanced gravel; framing profiles and real-photo reveals remain intact. These are stylized composition studies, not exact reconstructions.

Verification: full browser run **57 passed, 0 failed**, no browser exceptions or missing assets. Targeted checks cover all presets in every world, saved/blocked storage, invalid values, failed texture load rollback, rapid competing changes, pause, distinct figure actions and repeated-switch GPU resource stability. Same-world resource counts settled at 90 geometries / 2 textures before and after repeated switches. All 25 machine/emotion combinations have finite transforms; rendered world, figure and photo-set previews were inspected. Tests used headless Edge with software WebGL: no actual-device FPS or subjective emotional acceptance is claimed.

Remaining human checks: Moayad/Mohammed review the final lighting, faces and photo approximations; measure FPS/memory on the demo laptop and a lower-end device; novice playtest and final media capture. Abdullatif still owns the branded menu, Arabic/English interface and graphics selector. The selector should call ctx.quality.get/set/subscribe; it must not modify meshes directly. This pass completes the Set B implementation work identified in the handoff, not those separate UI or human acceptance tasks.

Raw evidence: tests/worlds-selftest.json and tests/worlds-quality-check.json.
