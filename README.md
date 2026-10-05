# Frappe UI 1.0 — launch film

A motion piece for the Frappe UI 1.0 release, rendered with HyperFrames
(Apache 2.0). 1920×1080, 60 fps, about 87 s (5,201 frames). The score is
synthesized in Python from the same cue frames as the picture, at 120 bpm
(one beat = 30 frames, one bar = 120 frames).

The film is `FrappeUILaunch` (`src/v2/Film.tsx`): tokens → components →
products, on one continuous camera. An earlier cut lives on as
`FrappeUILaunch-v1` (`src/LaunchVideo.tsx`, `src/scenes`); it isn't the film.

## Setup

```bash
npm install && (cd stage && npm install)
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
npm run dev
```

`npm run dev` opens the review player at `/review.html`: it plays the film
with `public/audio/score.wav`, so a sound change only needs the score
regenerated and the page reloaded, not a render.

## Scene map

| Scene | Frames | What happens |
| --- | --- | --- |
| Mark | 338 | The Frappe UI mark constructs, bounces and locks up |
| StageOne | 2205 | A card is built class by class from tokens: type, ink, surface, border, radius, shadow, then avatar, name, divider, badge, button. The page goes dark, the card lifts through the surface elevations, then back to light |
| StageTwo | 550 | Tilted in isometric, the card rises through the six shadow elevations, drops back, and becomes one tile of a bento wall of real components |
| StageThree | 1199 | An agent is prompted ("Build a CRM deal page with frappe-ui") and builds the page; a second prompt adds a dashboard; a dark-mode slider |
| End | 909 | The page slides beside a rail of the apps built on frappe-ui, each recipe in turn; the apps form a ring, fold into the mark, and the lockup |

## Sound

`scripts/score.py` writes `public/audio/score.wav`:

```bash
.venv/bin/python scripts/score.py
```

It prints the drop and lockup times, plus checks of how far the elevation
hits and keystrokes sit above the music around them.

- **Structure.** F# major, F#–D#m–B–C#, two bars per chord. Sections are set
  by film frame (`section()`): intro, groove, the dark-mode breakdown, the
  build into the wall's drop, filtered under the prompts, and the last build
  into the lockup.
- **Buses.** Sounds go on buses (`kick`, `sub`, `chords`, `drums`, `fx`, `ui`,
  `sfx`, …), which `MIX` balances at the bottom of the file.
- **On/off switches.** `CHIRPS` (a falling "boing" on every class that
  lands) and `SWOOSHES` are built but set to False.
- **Previous versions.** Earlier versions of the score script are in
  `archive/scores`.

**The beat grid is anchored to the lockup.** `GRID = LOCK % 120`, where
`LOCK` is the End scene's start + 659. If any scene gets longer or shorter,
every beat before the lockup shifts against the picture. So:

- Keep scene lengths as they are, or change them only in whole bars
  (120 frames).
- When you change timing inside a scene, keep its total length. For
  example, StageTwo holds the full wall longer so its length stays 550.
- Cue frames in `score.py` are copied from the scene constants in `src/v2`
  (StageOne's `SURF_DONE`, StageTwo's `TILES`, the prompts' typing rates,
  End's `RING`, …). Change both together. The `SCENES` dict at the top of
  `score.py` must match the scene lengths.

Scene-local beat positions, for timing things to the music: StageOne beats
fall on frames ≡ 23 mod 30 (downbeats 53, 173, 293, …), StageTwo on ≡ 8
mod 30 (downbeats 8, 128, 248, …), End on ≡ 29 mod 30.

## Where the numbers come from

All colours, radii, shadows and type sizes are the real tokens, exported from
`~/dev/frappe-ui/tailwind/tokens.js` into `src/data/tokens.json`. The UI in
the film is React recreations of the frappe-ui components (`src/ui/kit.tsx`)
reading `--surface-*` / `--ink-*` / `--outline-*` variables, so any shot can
be rendered in either theme with `themeVars('light' | 'dark')`.

To refresh tokens after a frappe-ui change:

```bash
cd ~/dev/frappe-ui && node -e "import('./tailwind/tokens.js').then(t=>require('fs').writeFileSync('../frappe-ui-launch-video/src/data/tokens.json', JSON.stringify({ramps:t.colors.light, rampsDark:t.colors.dark, semantic:t.semanticColors, radius:t.radius, shadows:t.shadows, fontSize:t.fontSize, fontWeight:t.fontWeight},null,1)))"
```

## Commands

```bash
npm run dev                                     # review player: scrub, ←/→ a frame, shift for 10, space, [ ] scenes
npm run studio                                  # HyperFrames Studio, the rendering page as HyperFrames sees it
npm run still -- V2-StageOne 300 766 1600       # stills → out/stills (and a sheet when more than one)
npm run render                                  # the film, with the score → out/FrappeUILaunch.mp4 (about 5 min)
npm run render -- V2-StageTwo --from 100 --to 400 --out out/clip.mp4
cd stage && npx vite build                      # after changing the stage app
npm run lint                                    # typecheck
```

Composition ids live in `src/compositions.ts`.

## How it renders

The scenes are React, and every value in them is a function of the frame
(`useCurrentFrame()` from `src/lib/player.tsx`, our own small runtime).
`src/main.tsx` puts one composition on a page and listens for HyperFrames'
`hf-seek` event: it renders that frame, then holds the capture (`waitUntil`)
until the stage iframes (`stage/`, real frappe-ui in Vue) have caught up.
HyperFrames steps through every frame in headless Chrome and encodes with
FFmpeg. Renders use one worker, because the stage's charts animate from the
frame before.

HyperFrames freezes `requestAnimationFrame` in every page it serves, so
`stage/index.html` takes the real one from `__HF_VIRTUAL_TIME__`.

Timing lives in each scene's constants at the top of its file in `src/v2`
(scene-local frames). Scene lengths are in `src/v2/Film.tsx`. See Sound
for keeping the score in sync.

People's photos are in `stage/public/faces`; `archive/pre_avatars/faces.md`
records which photos were swapped for the current cast.

## Claims to check before publishing

- "384 semantic tokens": count of `semanticColors.light` entries.
- "50+ components": README.
- "Tracking set by hand for every size and weight": `tokens.tracking` table.
- "Already inside Frappe's apps": README "Used by" list (Frappe Cloud, CRM,
  Helpdesk, Frappe HR, Learning, Insights, Builder, Gameplan).
- The Helpdesk screen and the ticket data are illustrative, not a real
  recipe screenshot.
