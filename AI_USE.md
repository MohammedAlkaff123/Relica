# AI use log

The challenge requires us to disclose every use of AI. Add a line whenever AI makes or changes something.
The idea, the story and the explanation of the project are the team's own.

| When | Who | Tool | What it was used for |
|---|---|---|---|
| 14 Nov | (your name) | Claude Code | Reviewed the NASA data pack and drafted PLAN.md from the team's idea |
| 14 Nov | (your name) | Claude Code | Drafted STORY.md (beat sheet, dialogue intents, shot list) and TASKS.md from the team's idea, for the directors to check and change |
| 14 Nov | (your name) | Claude Code | Project skeleton: frame loop, physics wrapper, placeholder controllers, placeholder characters, interface stubs, README |
| 14 Nov | Abdullatif | Claude Code | C-2: drafted the final Arabic and English lines for the opening and chapter 1 from the intent table in STORY.md; reviewed and chosen by Abdullatif |
| 14 Nov | Abdullatif | Claude Code | C-13: mission list on the HUD (setMission, completeTask, setBonus), content/missions.json from STORY.md section 8, tick sound |
| 14 Nov | Abdullatif | Claude Code | C-1: checked the world numbers in facts.json against the NASA fact sheets and added the source links |
| 14 Nov | Abdullatif | Claude Code | C-3: dialogue box version 2 (letter-by-letter typing, a colour per speaker, auto mode for cutscenes) |
| 14 Nov | Abdullatif | Claude Code | C-5: HUD version 2 (battery bar, counter with planned number, cleaner objective line, chapter cards from content/chapters.json) |
| 14 Nov | Abdullatif | Claude Code | C-7: sound functions (play, setWorld, setWind, loops, music cues, a voice per character), all sounds generated in code for now |
| 14 Nov | Abdullatif | Claude Code | C-8: checked the mission facts from PLAN.md section 12 and the (verify) marks in STORY.md on NASA pages; results with links in facts.json under missions |
| 14 Nov | Abdullatif | Claude Code | C-14: discovery cards (hud.discover), the eight cards in content/discoveries.json with sources, and the list on the end wall |
| 14 Nov | Abdullatif | Claude Code | C-4: drafted the Arabic and English lines for chapters 2, 3 and the epilogue from the intent table in STORY.md, checked against the verified facts |
| 14 Nov | Abdullatif | Claude Code | C-6: memory photo captions in Arabic and English, crops that keep logos out of frame, a memory sound; photos checked by eye |
| 14 Nov | Abdullatif | Claude Code | C-9: title screen, ending card and credits (card.title, card.ending, card.credits), texts in content/credits.json, photo credits read from CREDITS.csv |
| 14 Nov | Abdullatif | Claude Code | C-10: README upload pack (how to run, tools, NASA data statement, AI disclosure, references) and the Set C calls in the contracts |
| 14 Nov | Abdullatif | Claude Code | C-12: English and Arabic subtitle files for the 30-second video, timed to the storyboard in STORY.md |
| 14 Nov | Abdullatif | Claude Code | C-11: proofreading pass over all player text; fixed four Arabic and English lines. Final read-through with Mohammed still to do |
| 14 Nov | Abdullatif | Claude Code | C-7: louder audio chain with a boost control, and a voice for each machine built from the words of its line (chirps, Morse code, low hums, fast blips, echoing tones) |
| 14 Nov | Abdulkarim | Claude Code | Searched for open-licence 3D models and found NASA's own set (github.com/nasa/NASA-3D-Resources); checked each model's triangle count, size and textures |
| 14 Nov | Abdulkarim | Claude Code | B-2/B-5: wrote the script in tools/models that adapts seven NASA models to our look (no textures or flags, under 5,000 triangles, metres, named parts); results checked by eye |
| 14 Nov | Abdulkarim | Claude Code | B-3: model loading in character.js, with the boxes kept when a file is missing, and the face rig moved onto the model's head and antenna |
| 14 Nov | Abdulkarim | Claude Code | B-1: terrain function (heightAt, crater list, height grid for the physics) and the ground mesh built from it; heights checked against a Rapier heightfield |
| 14 Nov | Abdullatif | Claude Code | C-7: Morse voices with a signature per machine (Viking as an old telegraph, Pioneer deep and echoing), mix buses with dB levels measured per sound, new distinct interface and event sounds |
| 14 Nov | Abdulkarim | Claude Code | B-2: script that builds the Moon rover model from simple shapes (tools/models/build_lrv.mjs), shaped after the NASA pack photos; checked by eye in the game |
