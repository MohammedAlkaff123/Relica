# Trailer tools

Makes the 30-second Arabic trailer described in `TRAILER_HANDOFF.md`, entirely from the game itself.
Result: `pitch/Relica-trailer-30s.mp4` (H.264 + AAC, 1920×1080, 30 fps, 30 s, about 25 MB).

Nothing here is part of the game. It needs Node and Chrome (already on the team laptops); no ffmpeg.

```
cd tools/trailer
npm install                 # puppeteer-core, mp4-muxer
python ../../serve.py       # in another terminal: the game on http://localhost:5173
node capture.mjs            # 1. record every clip from the game into out/<clip>/0001.jpg ...
node compose.mjs --peek     # 2. (optional) a few stills of the edit in out/peek/ to check it
node compose.mjs            # 3. the edit, titles and sound, encoded to out/relica-trailer-30s.mp4
node verify.mjs             # 4. decodes the MP4 and saves stills and sound levels to check it
```

| File | What it does |
|---|---|
| `lib.mjs` | Opens the game in Chrome with its own clock: each saved frame moves game time by exactly 1/30 s, so the footage is smooth on any machine |
| `capture.mjs` | One function per clip: where to open the game, where the camera goes, which keys are pressed |
| `compose.html` | The edit, second by second, following the handoff table: clips, crops, cross-fades to NASA's photos, Arabic titles in the game's font, the two logos. Also makes the sound with Web Audio (no audio files, like the game) and encodes it all in the browser |
| `compose.mjs` | Opens `compose.html` and saves the MP4 |
| `verify.mjs` | Checks the finished file: size, length, sound level each second, stills |
| `sheet.mjs` | A contact sheet of any clip, to review it at a glance: `node sheet.mjs hop 10 5` |
| `probe.mjs` | A quick check that capture works on a machine |

## The cut

| Seconds | Picture | Title |
|---|---|---|
| 0–2 | Lift-off played backwards: the cabin coming down toward the rover | |
| 2–3 | Relica logo on stars | ما زلتُ هنا. |
| 3–6 | NASA photo cross-fades into the game's model: Moon rover, Opportunity, Ingenuity | من أرشيف ناسا… إلى عالم ريليكا. |
| 6–9 | The Moon rover's slow hop, then Ingenuity lifting off | محاكاة واقعية للفيزياء. |
| 9–13 | Framing the Potts photo task, the shutter, then NASA's original PIA20285 in the frame | استكشف المشهد الذي وثّقته ناسا. |
| 13–16 | The dust-guard map puzzle, then the rover driving as the dust stops | مهمة مستوحاة من أحداث أبولو 17. |
| 16–20 | 0.8 s each: Moon rover hop, Opportunity's rock grinder, Viking 1 in its 1976 memory, Ingenuity from below, Pioneer 10 with Jupiter | خمس آلات. خمس رحلات. |
| 20–24 | Faces: Opportunity in the storm, Ingenuity grounded, the Moon rover looking up | لكل آلة حكاية. |
| 24–27 | From the cabin looking down: the rover shrinks, alone | |
| 27–30 | Black, then the Relica and Space Apps logos on stars, and «الصور: NASA / JPL / JSC / ARC» | |

## Still open

- **The NASA Space Apps Madinah logo is not in the repository.** The end card uses the general
  Space Apps logo (`public/brand/partners/space-apps-white.svg`). Save the Madinah horizontal SVG,
  white, as `public/brand/partners/space-apps-madinah-white.svg` and run `node compose.mjs` again:
  it is picked up automatically.
- The sound is made in code in the style of the game. If the team has a free-licence music track,
  it can replace the pad in `soundtrack()` in `compose.html`.
- Abdullatif reviews the Arabic titles and facts; Moayad reviews the cut.
- Pioneer's Jupiter is the game's simple banded sphere, and the Viking shot is a game reconstruction
  in the flashback's sepia look, not the real 1976 image (the handoff asks for game footage here).

## Things learned

- Quiet points to open each world: `?chapter=moon&jump=selftest` (controls free, no story). `mars`,
  `sky` and `epilogue` open on their chapter card and wait there; in `sky` the chapter moves the
  helicopter after about 3 s, so clips there stay under 85 frames.
- Mini-games can be started alone, e.g.
  `void import('/src/chapters/_moonGames.js').then(m => m.fenderRepair(relica.stage, relica))`, and
  `relica.stage.game.botKeys()` gives the keys a perfect player would press.
- In Chrome without a window, a GPU canvas reads back as black: the encoder is given the canvas's
  pixels (`getImageData`) instead.
- `serve.py` does not answer range requests, so a browser cannot seek inside the MP4 from it; play it
  through, or open the file directly.
- On the Moon, crater slopes show a dark chequered pattern at High quality (shadow acne in Set B's
  `world.js`). The clips avoid craters. Worth fixing in the game.
