# RELICA: Still Here — ريليكا: ما زلتُ هنا

Director brief, 14 November 2026. The title is approved. UI/branding delivery is open. Environment style is awaiting the directors' selection.

## Name and ownership

- English title: **RELICA: Still Here**.
- Arabic title: **ريليكا: ما زلتُ هنا**.
- “Abandoned but not Forgotten” / the Arabic challenge title describes the challenge, not the game name. Keep it in challenge credits/submission context.
- Abdullatif (Abdulatif): game logo, bilingual wordmarks, brand system, main menu, HUD and interface components, language copy and sound presentation.
- Abdulkarim: world materials, textures, lighting and restrained environmental effects **after style selection**; existing character animation and photo reconstruction work continues.
- Ziad: menu/start/pause/input lifecycle, quality settings and performance support. Moayad approves look and readability; Mohammed reviews language, comprehension and feel.
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

## Visual options — selection pending

The directors have seen one comparison board showing the same Mars-rover and Moon-rover scenes in three styles. It is a mood/material reference, not a measured engine render or a model blueprint. Existing machine identities, facial rig and NASA photo viewpoints take precedence over any inaccuracies in the concept art.

| Option | Shapes and surfaces | Lighting and mood | Tradeoff |
|---|---|---|---|
| A — Warm Explorer | Broad low-poly shapes, gentle painted variation, minimal fine texture | Warm, clear and friendly; soft contact shading | Most cartoon-like; simplest visual detail |
| B — Quiet Frontier | Simplified believable forms, restrained wear, readable rock strata and metal/foil differences | Calm amber light, subtle cool lunar shadows, loneliness and wonder | Recommended balance of approachable and semi-realistic; simplify the board's fine detail in engine |
| C — Cosmic Cinema | More realistic surface variation and sharper forms | Strong long shadows, deeper contrast, dramatic scale | More texture work and greater risk of dark unreadable gameplay; avoid expensive effects |

**Selected option: not yet chosen.** Do not interpret the recommendation as approval. Once chosen, add the selected image/reference, date and director decision to DIRECTORS_HANDOFF.md, then turn the following constraints into Abdulkarim's approved work order. Do not send messages or assign an unselected look on the directors' behalf.

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
