# Sudoku Solver

Pure JavaScript sudoku solver and difficulty grader with solving algorithm visualisation.

- **Installable PWA** – works offline, add it to your home screen.
- **Mobile friendly** – responsive grid and on-screen keypad.
- **Scan to import** – take or pick a photo of a puzzle (paper or screenshot); the grid is found,
  straightened and read entirely on-device, then you check/fix the digits before importing.

Info page <a href="http://bristoljon.uk/project/sudoku">here</a>
<br/>
Try the latest version <a href="https://sudoku.bristoljon.uk">here</a>

## Development

```sh
npm install
npm run watch    # rebuilds main.js on change
npm run serve    # http://localhost:8080 (service workers + camera need localhost or https)
npm run build    # minified main.js
npm run build:site  # build + assemble the deployable site in dist/
```

Deployed on Netlify from `master` (see `netlify.toml`).

Source files: `script.js` (solver + UI), `scan.js` (grid detection + digit recognition),
`scan-ui.js` (scan review screen), `digit-model.js` (generated classifier weights), `sw.js` (offline cache).
Bump `CACHE` in `sw.js` when you want installed copies to drop old files.

## How the scanner works

1. Adaptive threshold → largest grid-like connected component (checked by looking for ink on the
   expected box lines) → border lines fitted with RANSAC → corners nudged to maximise line coverage.
2. Perspective warp to a 9×9 grid, strip grid-line remnants from each cell, crop the digit.
3. A small neural net (400→96→10, int8 weights, ~50KB) classifies digits 1–9 or "not a digit".
4. Digits are assigned most-confident-first so rows/columns/boxes don't clash; unsure cells are flagged for review.

### Retraining the classifier

Needs Python (numpy, opencv, pillow) and node with `sharp`:

```sh
fc-list : file > tools/fonts.txt                      # fonts used to render training puzzles
python3 tools/gen.py /tmp/train 3000                  # synthetic photos of puzzles
node tools/extract.mjs /tmp/train /tmp/tr             # run the real pipeline, dump cell vectors
python3 tools/train.py digit-model.js /tmp/tr         # train + write weights
python3 tools/gen.py /tmp/test 300 --fonts all --seed 9 && node tools/extract.mjs /tmp/test   # evaluate
```
