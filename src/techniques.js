// The solving building blocks. Each is a generator that works on ctx.grid,
// yields an event for every step (the breakpoints for visuals) and returns
// how much progress it made (digits placed + maybes removed).
//
// Every 'look' - reading a square, checking if a digit fits, rubbing out a
// pencil mark - adds one to ctx.stats.looks. That count is the effort score
// used by the grader, so it's the same whether or not anyone is watching.

import {
  DIGITS, ALL, bit, COUNT, LIST, CELLS, UNITS, UNIT_OF, PEERS, BOX_ORDER,
  boxOf, label, unitName, Contradiction,
} from './engine.js';

class GaveUp extends Error {}

const list = digits => digits.join(', ');
const labels = cells => cells.map(label).join(', ');

function createContext(grid, { options = {}, budget = Infinity } = {}) {
  return {
    grid,
    budget,
    options: { notcheck: false, linecheck: false, ...options },
    stats: {
      looks: 0, passes: 0, stuck: 0, placed: 0, eliminated: 0, guesses: 0, backtracks: 0, maxDepth: 0,
    },
    depth: 0,
  };
}

// Enter a digit. With Not Check on, glance at every square it affected and
// fill any that are now down to one option.
function* placeDigit(ctx, i, d, by, reason) {
  const affected = ctx.grid.place(i, d);
  ctx.stats.placed++;
  yield { type: 'place', cell: i, digit: d, by, reason };
  let found = 1;
  if (ctx.options.notcheck) {
    for (const p of affected) {
      if (ctx.grid.values[p]) continue;
      ctx.stats.looks++;
      yield { type: 'look', kind: 'glance', cell: p };
      const single = ctx.grid.single(p);
      if (single) {
        found += yield* placeDigit(ctx, p, single, 'notcheck',
          `${label(p)} is now down to one option: ${single}`);
      }
    }
  }
  return found;
}

// Not Search: for each blank, read across its row, column and box and rule
// out every digit already there. If only one is left, enter it.
function* notSearch(ctx, { order = 'row' } = {}) {
  const { grid } = ctx;
  let found = 0;
  for (const i of order === 'box' ? BOX_ORDER : CELLS) {
    if (grid.values[i]) continue;
    let seen = 0;
    for (const p of PEERS[i]) {
      const v = grid.values[p];
      if (!v) continue;
      ctx.stats.looks++;
      seen |= bit(v);
      yield { type: 'look', kind: 'read', cell: i, from: p, digit: v };
    }
    const d = grid.single(i);
    if (d) {
      const noted = LIST[ALL & ~seen & ~bit(d)];
      const reason = `${label(i)} (box ${boxOf(i) + 1}): its row, column and box already have `
        + `${list(LIST[seen])}${noted.length ? `, and pencil marks rule out ${list(noted)}` : ''}`
        + ` - so it must be ${d}`;
      found += yield* placeDigit(ctx, i, d, 'notsearch', reason);
    }
  }
  return found;
}

// If a box's options for a digit all sit on one row or column, the digit
// can't be anywhere else on that line.
function* lineCheck(ctx, box, d, spots) {
  const { grid } = ctx;
  const line = ['row', 'col'].find(t => spots.every(i => UNIT_OF[t](i) === UNIT_OF[t](spots[0])));
  if (!line) return 0;
  const n = UNIT_OF[line](spots[0]);
  const struck = [];
  for (const i of grid.blanks(UNITS[line][n])) {
    if (boxOf(i) === box) continue;
    ctx.stats.looks++;
    const had = grid.eliminate(i, d);
    yield { type: 'look', kind: 'strike', cell: i, digit: d, ok: had };
    if (had) struck.push(i);
  }
  if (!struck.length) return 0;
  ctx.stats.eliminated += struck.length;
  yield {
    type: 'eliminate',
    cells: struck,
    digit: d,
    by: 'line',
    reason: `Box ${box + 1}: ${d} must go in ${labels(spots)}, all on ${unitName(line, n).toLowerCase()}, `
      + `so rub ${d} out of the rest of that line: ${labels(struck)}`,
  };
  let found = struck.length;
  for (const i of struck) {
    const single = grid.single(i);
    if (single) {
      found += yield* placeDigit(ctx, i, single, 'line',
        `${label(i)} is down to one option after the line check: ${single}`);
    }
  }
  return found;
}

// Box / Column / Row Search: for each group, find every square a missing
// digit could go in. If there's only one, enter it.
// order 'unit' = for each group, each digit. 'digit' = for each digit, each group.
// linecheck overrides the Line Check toggle for this step.
function* hiddenSearch(ctx, { unit = 'box', order = 'unit', linecheck = ctx.options.linecheck } = {}) {
  const { grid } = ctx;
  const pairs = [];
  if (order === 'digit') DIGITS.forEach(d => UNITS[unit].forEach((_, n) => pairs.push([n, d])));
  else UNITS[unit].forEach((_, n) => DIGITS.forEach(d => pairs.push([n, d])));

  let found = 0;
  for (const [n, d] of pairs) {
    const cells = UNITS[unit][n];
    if (grid.unitHas(cells, d)) continue;
    const spots = [];
    for (const i of grid.blanks(cells)) {
      ctx.stats.looks++;
      const ok = grid.couldBe(i, d);
      yield { type: 'look', kind: 'try', cell: i, digit: d, ok };
      if (ok) spots.push(i);
    }
    if (!spots.length) {
      throw new Contradiction(`${unitName(unit, n)} has nowhere left for ${d}`);
    }
    if (spots.length === 1) {
      found += yield* placeDigit(ctx, spots[0], d, unit,
        `${unitName(unit, n)}: ${d} can only go in ${label(spots[0])}`);
    }
    else if (unit === 'box' && linecheck && spots.length <= 3) {
      found += yield* lineCheck(ctx, n, d, spots);
    }
  }
  return found;
}

const TECHNIQUES = { notSearch, hiddenSearch };

// Every building block, simplest first. When an approach gets stuck it tries
// the ones it doesn't normally use before resorting to guessing.
const FALLBACKS = [
  { technique: 'notSearch', name: 'Not Search' },
  { technique: 'hiddenSearch', unit: 'box', name: 'Box Search' },
  { technique: 'hiddenSearch', unit: 'row', name: 'Row Search' },
  { technique: 'hiddenSearch', unit: 'col', name: 'Column Search' },
  { technique: 'hiddenSearch', unit: 'box', linecheck: true, name: 'Box Search with Line Check' },
];

// Identifies what a step can find, ignoring the order it looks in
function stepKeys(ctx, step) {
  if (step.technique !== 'hiddenSearch') return [step.technique];
  const plain = `${step.technique}:${step.unit}`;
  const linecheck = step.linecheck === undefined ? ctx.options.linecheck : step.linecheck;
  // Box Search with Line Check finds everything plain Box Search does
  return step.unit === 'box' && linecheck ? [plain, `${plain}:line`] : [plain];
}

// Tries each building block the approach doesn't already use, going back to
// the approach as soon as one finds something.
function* fallBack(ctx, strategy) {
  const own = new Set([].concat(...strategy.plan.map(step => stepKeys(ctx, step))));
  ctx.stats.stuck++;
  for (const step of FALLBACKS) {
    if (stepKeys(ctx, step).every(key => own.has(key))) continue;
    yield { type: 'fallback', name: step.name };
    const found = yield* TECHNIQUES[step.technique](ctx, step);
    if (found) return found;
    stepKeys(ctx, step).forEach(key => own.add(key));
  }
  return 0;
}

// Runs a strategy's plan pass after pass until solved. If a whole pass makes
// no progress it borrows other building blocks (if strategy.fallback), then
// either stops (returns false) or, as a last resort, uses Tree Search.
function* solveWith(ctx, strategy) {
  const { grid, stats } = ctx;
  while (!grid.isSolved()) {
    if (stats.looks > ctx.budget) throw new GaveUp(`Gave up after ${ctx.budget} looks`);
    stats.passes++;
    yield { type: 'pass', n: stats.passes, depth: ctx.depth };
    let progress = 0;
    for (const step of strategy.plan) {
      let found;
      do {
        found = yield* TECHNIQUES[step.technique](ctx, step);
        progress += found;
      } while (found && step.repeat && !grid.isSolved());
      if (grid.isSolved()) return true;
      if (progress && strategy.restart) break;
    }
    if (!progress && strategy.fallback) progress = yield* fallBack(ctx, strategy);
    if (!progress) {
      if (!strategy.guess) {
        yield { type: 'stuck', blanks: grid.blanks().length };
        return false;
      }
      return yield* treeSearch(ctx, strategy);
    }
  }
  return true;
}

// Tree Search: pick the blank with fewest options and try the first. If that
// leads to a contradiction, undo everything since and rule it out. All the
// work done down a dead end still counts.
function* treeSearch(ctx, strategy) {
  const { grid, stats } = ctx;
  let cell = -1;
  for (const i of grid.blanks()) {
    stats.looks++;
    if (cell < 0 || COUNT[grid.cands[i]] < COUNT[grid.cands[cell]]) cell = i;
  }
  const options = grid.candidates(cell);
  const d = options[0];
  if (options.length === 1) {
    yield* placeDigit(ctx, cell, d, 'tree', `Stuck, but ${label(cell)} only has one option left: ${d}`);
    return yield* solveWith(ctx, strategy);
  }

  const snap = grid.snapshot();
  stats.guesses++;
  ctx.depth++;
  stats.maxDepth = Math.max(stats.maxDepth, ctx.depth);
  yield {
    type: 'guess',
    cell,
    digit: d,
    depth: ctx.depth,
    reason: `Stuck. ${label(cell)} could be ${options.join(' or ')} - guess ${d} and see what happens`,
  };
  try {
    yield* placeDigit(ctx, cell, d, 'tree', `Guess: ${label(cell)} = ${d}`);
    const solved = yield* solveWith(ctx, strategy);
    ctx.depth--;
    return solved;
  }
  catch (e) {
    ctx.depth--;
    if (!(e instanceof Contradiction)) throw e;
    grid.restore(snap);
    stats.backtracks++;
    yield {
      type: 'backtrack',
      cell,
      digit: d,
      depth: ctx.depth,
      reason: `Dead end (${e.message}) so ${label(cell)} isn't ${d}. Back up and rub it out.`,
    };
    grid.eliminate(cell, d);
    return yield* solveWith(ctx, strategy);
  }
}

// Runs a generator to completion without visuals, returning its result
function drain(iterator) {
  for (;;) {
    const step = iterator.next();
    if (step.done) return step.value;
  }
}

export {
  GaveUp, createContext, placeDigit, notSearch, hiddenSearch, lineCheck, solveWith, treeSearch,
  TECHNIQUES, FALLBACKS, drain,
};
