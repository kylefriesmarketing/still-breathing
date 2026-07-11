# STILL BREATHING — a survival
A branching-survival game in the same engine philosophy as **Choose Wisely** and **Nine
Circles** — vanilla JS, zero dependencies, all content data-driven in `js/storyData.js` — but a
new mechanical identity built to feel *real* and *intense*. Every ordeal is reconstructed from a
documented true survival case, and every deadly choice is a real survival myth that has actually
gotten people killed.

## Fantasy
The world tries to subtract you. You keep your head, do the next small thing, accept where you
actually are, and hold a reason to live — or you don't, and it does the reasonable-seeming thing
to you. Three separate ordeals, one truth underneath all of them: **the body can go astonishingly
far; it's almost always the mind that decides.** (Laurence Gonzales, *Deep Survival*; History's
*Alone*.)

## Core systems (all new vs. the other two games)
1. **The Rule of Threes, as vitals** — five meters, each on its own clock: **Grip** (will to
   live — the master), **Core** (thermal reserve; 0 = hypothermia in cold, heatstroke in sun),
   **Water** (~3-day clock), **Food** (the long ~3-week clock that steals judgement first), and
   **Body** (blood/injury). Any vital hitting 0 kills you by its specific real mechanism.
2. **Grip is the corruption engine** — at Grip ≤ 2 the narration itself becomes unreliable
   (hypothermic euphoria, dehydration mirage, isolation hallucination — all medically real):
   words waver, and **deadly-myth choices grow a seductive lure** ("your body is already sure")
   while good choices look costly. Impaired cognition, dramatized. Grip 0 = the *give-up* death,
   which the game insists is the one that actually kills the most people.
3. **Myth vs. Truth choices** — the glamorous/intuitive option is usually the killer: eat snow
   for water (drops core temp), drink seawater (kidneys spend more than you gain), paradoxical
   undressing, walk out from a crash site, swim for the raft, thrash at the shark, tear the arm
   free by force. Choosing the unglamorous true technique builds Grip.
4. **The Kit** — salvaged/found items (`fire kit, knife, space blanket, signal mirror, ditch bag,
   solar still, gaff, multitool`) gate hidden real-technique choices. The multitool is the only
   door out of the canyon.
5. **Rescue meter** — the win track: staying with the wreck, signal fires, the mirror flash, the
   flare, following moving water down, the birds over the raft. Reach the goal and the climax
   flips from "they don't see you" to rescue.
6. **The Log** — journal collectibles (9), the small clear-headed lines a survivor writes to stay
   a mind. Inscribed permanently only if you live.
7. **They Came Back** — the real survivors behind each ordeal, revealed on survival: **Juliane
   Koepcke** (white), **Steven Callahan** (raft), **Aron Ralston** (pinch), and the composite
   *Deep Survival / Alone* mind (the meta ending).
8. **Cross-run memory** — the title remembers how it ended last time and how many ordeals you've
   survived.

## The three ordeals
- **The White Mile** — bush-plane crash, subarctic backcountry. Killer clock: cold + the first
  night. Truth: stop the bleeding first, *stay with the wreck*, build before dark, follow the
  river *down* (Koepcke). Endings: cold, thirst, starve, bleed, give-up, drown; **saved** (found
  at the wreck), **walk-out** (river to people).
- **The Raft** — sailboat holed by a whale at night, open Atlantic (Callahan). Killer clock:
  water + sun. Truth: grab the ditch bag, shade up, ration, run the solar still, spear fish, go
  still for sharks, keep the routine after the ship passes. Endings: heat, thirst (seawater),
  starve, bleed (shark), give-up, shark; **saved** (birds → fishermen), **land**.
- **The Pinch** — solo canyoneering, arm pinned by a boulder, nobody knows where you went
  (Ralston). Killer clock: water + the freezing nights. Truth: don't panic, ration to the drop,
  find a reason (the future child), then *the only door* — break the bones and cut with the dull
  multitool. Endings: cold, thirst, bleed, give-up; **the cut** (self-rescue).
- **Meta** — survive all three ⇒ **Still Breathing**, the truth the survivors share.

## Files
- `index.html` — shell (title, scenario select, name, game, ending, galleries)
- `css/style.css` — cold field-manual look: slate, bone, blood-ember; sans HUD, serif diary
- `js/storyData.js` — ALL content: scenarios, regions, items, logs, real survivors, nodes, endings
- `js/art.js` — procedural SVG scene painter per region (no image assets); one lone figure
- `js/audio.js` — generative WebAudio: wind/ocean/rain/fire/canyon beds + a fragile "held-on"
  motif that only rings while Grip is up and wanders out of tune as Grip fails
- `js/engine.js` — state, vitals, Grip mirage, kit, rescue, day clock, endings, galleries, `~` debug

## Run
Serve repo root: `powershell -ExecutionPolicy Bypass -File serve.ps1` →
http://localhost:8321/still-breathing/index.html . Static, dependency-free; GitHub Pages ready.
`~` = field-lantern debug, `m` = mute.

## Grounding (researched, not invented)
Deep Survival (Gonzales); Adrift: 76 Days Lost at Sea (Callahan); 127 Hours / Between a Rock and
a Hard Place (Ralston); LANSA Flight 508 (Koepcke); History's *Alone*; standard survival-myth
literature (seawater, eating snow, paradoxical undressing, walking out).
