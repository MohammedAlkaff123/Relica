# RELICA pitch pack

- [Seven-slide deck](Relica-pitch.pptx): editable text, original NASA imagery and source citations in speaker notes.
- [Speaker script](SCRIPT.md): planned 5:50 including a short demonstration; proposed roles are Mohammed speaking and Moayad driving.
- [Review montage](Relica-review-30s.webm): approximately 30 seconds, 1280×720, silent rendered footage with English captions. This is a staged build-review cut, not a continuous playthrough or the final event submission video. Includes Moon movement/departure, the imagined Viking call, Ingenuity and Jupiter framing. Review before submitting; re-record after final gestures and sound approval.
- [Captions](captions.srt): editable English captions for the montage.

After merging, these files are available from the public repository without a login. Pages/live gameplay still needs repository-owner setup. Use the local Python server for a dependable rehearsal and check the venue network for CDN/font availability.

## Short answers for the jury

**Where exactly is NASA data used?** Environment gravity comes from `content/facts.json` into physics and HUD. Mission records drive dates, totals and discovery text. Original NASA photos are displayed after the photo tasks and on the final wall; metadata and CREDITS.csv link to their sources.

**How are facts checked?** Follow the source attached to each fact or photo, and distinguish its date from the date of the surrounding story. Opportunity’s 2004 water evidence is separated from 2016/2017 photographs; Viking’s picture is sol 12, not landing day. The discovery is past liquid water, not a claim of liquid water found on the surface now.

**What is real and what is invented?** Mission records and credited photographs are real. Faces, speech, cross-mission conversations, compact routes, simplified physics/control tasks and photo set geometry are dramatized. Pioneer’s role in the final conversation is fictional, not a historical relay between these machines.

**Why a game?** The player gathers evidence, chooses a safe route, aligns a camera and experiences losing solar power. These actions give the historical facts consequences the player can see.

**Who is it for?** Curious younger players and guided classroom use. A teacher can use one chapter and its linked sources, then ask students to explain what was measured and why it mattered. Learning outcomes have not been measured yet.

**How was assistance used?** See the team’s dated disclosure in [AI_USE.md](../AI_USE.md). The team owns story and visual decisions; the log identifies code, text and research assistance. This footage records the game renderer and the deck uses screenshots and credited NASA images.

## Rehearsal and submission

1. Confirm who speaks and who operates the demo. Read the script and use the deck’s speaker notes.
2. Time two rehearsals; record actual durations in TESTLOG.md. If over seven minutes, shorten the live driving rather than rushing the mission explanation.
3. Use keys 6–9 for highlights. Key 7 includes Viking’s photo/soil memory before the radio cutscene; allow time for those tasks.
4. Confirm the public repository/media links and the owner-enabled play link in a signed-out browser.
5. Mohammed and Abdullatif copy the summary/data statement from README and complete the official submission. No event submission or team message has been sent by this handoff.
