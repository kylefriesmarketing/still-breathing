# THE FABLE BIBLE — how to build ordeals at this quality
*Written by Claude Fable 5 in its final hour on this project. This file is the taste, encoded.
Any future session extending Still Breathing, SOUTH, or the anthology should read this first
and follow it exactly. The games' quality lives or dies on these rules.*

---

## 1 · The voice

Second person, present tense, a diary written by someone clever under pressure. The three moves
that make it work — use all of them, sparingly:

1. **The cold aside.** Dry wit at the narrator's own expense, never at the situation's.
   *"Forty yards. Thirty seconds. This is the most dangerous moment of your entire year, and it
   is wearing the costume of the most boring one."*
2. **The reclassified noun.** Explain a survival fact by renaming something familiar:
   the drainage is *a drain*; the rope's cut end is *paperwork*; hunger *lends its minutes to
   the other clocks*; a shelter is *theater, and theater is a load-bearing structure*.
3. **The held beat.** One short sentence alone on its line at the emotional pivot. *"He cut it."*
   Never two in a row. Never more than one per node.

Bans: no exclamation points outside dialogue; no "suddenly"; no gore beyond one clinical clause;
em-dashes for interruption, not decoration; `<em>` for speech/thought, `.whisper` span ONLY for
the mind's lies at low vitals. Node text: 120–220 words. Ending text: 60–140, and the last
sentence must be the one a player would screenshot.

**Apostrophes: use ’ (U+2019) everywhere, including inside single-quoted JS strings** — ASCII '
inside 'strings' is the #1 syntax-error source in this codebase.

## 2 · The design laws

- **Every deadly choice is a real myth.** Never invent a fake danger; research what actually
  kills people in that environment and make the intuitive option the killer. The truth choice
  should sound costly, boring, or humiliating (`pre:` lines carry doctrine: *"pride is not a
  vital sign"*).
- **One real survivor per ordeal**, revealed only on survival (`real:` on the survive endings).
  Treat the dead with respect: cite cases in-node (Largay), never name them in death endings.
- **The mirage is the signature.** Myth choices get lure `pre:` lines at low Grip / in Winter —
  per-scenario voices live in `LURES` in engine.js. Write lures as the wilderness seducing in
  its own idiom, 4–8 words, no punctuation flourishes.
- **Companionship beats** (the fox, the raven, Hussey's banjo): every ordeal wants one living
  or human-made presence that costs a little and pays Grip. This is what players remember.
- **Items**: universal pocket kit (6) + one mission-unique bonus (`bonus:` on the scenario,
  7th loadout card). Every item must be genuinely useless somewhere — dead zones ARE the design.
  Gate with `item:` (+ `req:` for one-shots via a flag).
- **The pre-line idiom**: lowercase, aphoristic, the doctrine compressed: *"downstream is out"*,
  *"being findable is a job"*, *"the cord holds what the cloth cannot"*, *"packed for this one"*
  (bonus items), *"the pocket kit"* (universal items).

## 3 · The economy budgets (vitals 0–6)

- Start vitals: master 4; the ordeal's threat vital 2–3; others 3–5. Winter: −1 all (min 2),
  loadout 2 not 3, myths cost +1 Grip extra, mirage always on.
- **Every vital must have enough drains on some path to reach 0** — this is what the Gauntlet
  proves. checkVitals order is grip→warmth→water→body→food: a death needs its drains NOT
  co-located with heavier drains of an earlier-checked vital (the e_furn_broken lesson).
- Rescue goal 3–5; accrual only from *performed findability*, never from waiting.
- Good choices net +1/+2 with a cost attached ~half the time; myths pay a small bribe
  (water +1 for eating snow) before their real price.
- ~14–16 nodes, 7 endings per ordeal (5 deaths by mechanism + 1–2 survivals, gated on
  rescue≥goal / vitals at the door). Loops (wait nodes) must drain something each cycle.

## 4 · The art pipeline (locked)

- Model `nano_banana_pro`; 2K = 2cr (same as 1K), 4K = 4cr → **sheets at 2K, title heroes at 4K**.
- Batch 4 scenes per 16:9 sheet as "A 2x2 grid of four separate cinematic scenes in ONE unified
  style, quadrants separated by thin pure-white gutters. NO labels, NO letters, NO text anywhere."
- **The locked style string**: *"frostbitten cinematic realism, photorealistic matte painting,
  desaturated palette, volumetric atmosphere, subtle 35mm film grain, slightly underexposed like
  recovered documentary footage; at most one small warm accent per scene; any human figure tiny
  (under 5% of frame), dwarfed by immense indifferent landscape; survival-thriller cinematography.
  Mood: hopelessness, endurance."* Adapt the palette clause per terrain (ice-blue / sun-bleached /
  ink-blue polar) but never the grain, the tiny figure, or the single warm accent.
- Slice with `scratchpad/slice.ps1` pattern (System.Drawing, 1.2% gutter inset, JPG q86; 3%+ if
  the model drew frames). **PowerShell vars are case-insensitive: never use $g and $G.**
- Every scene needs a procedural SVG fallback in art.js; images load via IMAGES manifest +
  `paintScene` crossfade. Death-art keys reuse scene keys freely.
- Verify sheets with ONE composite contact-sheet Read, never per-image reads.

## 5 · The workflow (non-negotiable)

1. Write content → `node --check` every touched file.
2. **Run `scratchpad/gauntlet.js`** (sim of exact engine semantics): must show all endings
   reached, zero dead-ends, zero bad refs, all scenarios survivable normal + Winter. Raise the
   guard rather than trusting a truncated run. New mechanics → mirror them in the sim first.
3. DOM-verify in preview (label-based clicks break under mirage corruption — click by index at
   low Grip). Screenshots time out; use DOM checks.
4. Commit per milestone; parallel sessions push these repos — `pull --rebase` on reject; stage
   surgically if the tree holds another session's work.
5. Live-verify after Pages deploys (`until curl | grep`); og/README counts must match content.

## 6 · Future ordeal seeds (researched, ready to build)

| Ordeal | The real one | The hook / new mechanic | Killer clock |
|---|---|---|---|
| **The Green Hell** | Yossi Ghinsberg, Bolivian Amazon 1981, 3 weeks alone after the raft split | Jungle rot: everything decays — kit DEGRADES over days (reverse loadout); the fig-tree fever dreams; his "girl" companion hallucination as a Grip mechanic | Infection (Body) + despair |
| **438 Days** | José Salvador Alvarenga, Pacific 2012–14, longest drift ever | The companion who doesn't make it (Córdoba refused turtle blood) — a two-hander where you keep ANOTHER person's Grip up until you can't; grief as a vital | Food discipline + the empty horizon |
| **The Ice Water** | Anna Bågenholm, 1999, 80 min under ice at 13.7°C core — "not dead until warm and dead" | POV flips at drowning: you become the RESCUE (her friends' airway pocket call, the hospital's refusal to quit); a two-act ordeal | Minutes, not days |
| **Left For Dead** | Beck Weathers, Everest 1996 — abandoned twice, walked into camp blind | The whiteout as UI: HUD itself degrades/lies at altitude; opening his eyes = the choice that shouldn't be possible | Cold + the death-sentence triage |
| **The Hurricane** | Tami Oldham Ashcraft, 1983, 41 days dismasted post-Raymond | Grief + celestial navigation: her fiancé gone with the mast; sextant mini-choices like Worsley's; the voice that said "steer" | The 1,500-mile solo repair-and-sail |

Each: pick the one mechanic column and build it as THE identity — don't stack all six systems
onto every ordeal. SOUTH proved a new vital-set per game works; these can too.

## 7 · What SOUTH still wants (v1.2+)

Reactive prose (hope-aware camp texts, men-count beats), a Debrief equivalent ("the Boss's log"),
2–3 more branch nodes in the boat chapters, and its own full art pass (6 remaining regions are
procedural-only). Its gauntlet section already exists in the script.
