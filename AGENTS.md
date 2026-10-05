# Agent guide

The Frappe UI 1.0 launch film: React scenes rendered frame by frame with
HyperFrames, with a soundtrack synthesized in Python from the same cue
frames. Read README.md for the scene map and the sound overview. This file
is what you need to set up, change and verify the film without breaking
sync.

## Requirements

- Node 22 or newer (HyperFrames requires it).
- ffmpeg and ffprobe on PATH (macOS: `brew install ffmpeg`).
- Python 3.11 or newer, for the score.
- HyperFrames downloads its own headless Chrome into `~/.cache/hyperframes`
  on the first still or render. That needs network access once.

## Setup

Run from the repo root, in this order:

```bash
npm install
cd stage && npm install && cd ..
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Check that it worked:

```bash
npm run lint                                  # tsc, must print no errors
.venv/bin/python scripts/score.py             # must end "wrote public/audio/score.wav 86.98 s; drop at 46.52 s; lockup at 82.52 s"
npm run still -- V2-StageOne 1000             # → out/stills/V2-StageOne_1000.png, the card with "Rahul Mehta"
```

Then `npm run dev` serves the review player at http://localhost:5173/review.html
(`.claude/launch.json` has it as `review`). It plays the film with
`public/audio/score.wav`. `public/stage` (the built stage app) is committed,
so the stage does not need building until you change `stage/src`.

## Map

| Path | What |
| --- | --- |
| `src/v2/Film.tsx` | The film: scene order and lengths (Mark, StageOne, StageTwo, StageThree, End) |
| `src/v2/*.tsx` | One file per scene. Timing constants (scene-local frames) are at the top of each |
| `src/compositions.ts` | Composition ids: `FrappeUILaunch` (the film), `V2-<Scene>`, `V2-CardStill`. The `v1` ones are an old cut |
| `src/lib/player.tsx`, `src/lib/anim.ts` | The frame runtime and animation helpers (`typed`, `spr`, `kf`, …) |
| `stage/` | A Vue app with real frappe-ui components, shown in iframes; builds into `public/stage` |
| `stage/public/faces` | People's photos. The cast is male only; see `archive/pre_avatars/faces.md` |
| `scripts/score.py` | The soundtrack, written to `public/audio/score.wav` |
| `scripts/render.mjs`, `still.mjs`, `studio.mjs` | Render, stills, HyperFrames Studio |
| `archive/` | Earlier versions of scenes and score scripts. Not used by the build |

## Rules that keep picture and sound in sync

1. **Don't change a scene's total length.** The beat grid is anchored to
   the lockup (`GRID = LOCK % 120`, `LOCK` = End start + 659), so a scene that
   gets longer or shorter shifts every beat before the lockup against the
   picture. If you must change a length, change it by whole bars (120
   frames), and update `SCENES` at the top of `score.py`.
2. **Retiming inside a scene keeps its total.** Speed an animation up or
   down, then absorb the difference in a hold (StageTwo's
   `STAGE_TWO_END = LEVEL_AT[last] + 152` is an example). Change speed only,
   not the motion itself.
3. **Cue frames are copied by hand** from `src/v2` into `score.py`: StageOne
   `SURF_DONE` (surface elevations), StageTwo steps and `TILES` (each wall
   tile's reveal frame), the prompts' text, start frame and typing rate, and
   End `RING` and the recipe arrival frames. Change a scene constant, then
   update the matching cue.
4. **Beats are 30 frames** (120 bpm at 60 fps). Scene-local beat frames:
   StageOne ≡ 23 mod 30 (downbeats 53, 173, …), StageTwo ≡ 8 mod 30
   (downbeats 8, 128, 248, …), End ≡ 29 mod 30. Anything meant to hit the
   music lands on one of these.

## Working on sound

- Change `scripts/score.py`, run it, and reload the review player. You don't
  need to render.
- Each run prints how far the elevation hits and keystrokes sit above the
  music around them (in dB). The current taste is subtle: effects about
  +2 to +4 dB, supporting the picture, never leading it.
- `CHIRPS` and `SWOOSHES` are switched off on purpose (the owner removed
  them). Don't turn them back on unless asked.
- Before a change you might want to undo, copy `score.py` and `score.wav`
  into `archive/scores` and `archive/audio`. `archive/audio` is gitignored,
  because the WAVs are 16 MB each.

## Verifying picture changes

- `npm run still -- <CompId> <frame> [frame…]` writes PNGs to `out/stills`,
  plus a contact sheet when there's more than one frame. Open and look at
  them. Stills can't show motion, so check camera moves in the review
  player.
- `npm run lint` before you hand back.
- A full render (`npm run render`, about 5 min on an M-series Mac) only when
  asked. It uses one worker on purpose: the stage's charts animate from the
  frame before.

## Gotchas

- After changing `stage/src`, run `cd stage && npx vite build`. It writes
  `public/stage` and re-stamps `src/stageVersion.ts`; commit both.
- HyperFrames freezes `requestAnimationFrame` in pages it serves; the stage
  takes the real one from `__HF_VIRTUAL_TIME__` (`stage/index.html`).
- Importing scene files with `tsx` fails on the fonts module. To compute
  cue frames, copy the constant lines or the helper into a scratch script.
- The vite config warns about mixed exports and the CommonJS config loader.
  Both warnings are harmless.
- `out/` is gitignored: renders and stills stay local.
