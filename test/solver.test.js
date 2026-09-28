import test from 'node:test';
import assert from 'node:assert';
import {
  Grid, Contradiction, PEERS, countSolutions,
} from '../src/engine.js';
import {
  createContext, solveWith, drain, hiddenSearch,
} from '../src/techniques.js';
import { STRATEGIES } from '../src/strategies.js';
import { grade, rate } from '../src/grader.js';
import PUZZLES from '../src/puzzles.js';

const [easy, original, pencil] = PUZZLES.map(p => p.puzzle);

test('every cell has 20 peers', () => {
  assert(PEERS.every(peers => new Set(peers).size === 20));
});

test('placing a digit removes it from its peers', () => {
  const grid = new Grid();
  grid.place(0, 5);
  assert.equal(grid.couldBe(8, 5), false);
  assert.equal(grid.couldBe(72, 5), false);
  assert.equal(grid.couldBe(20, 5), false);
  assert.equal(grid.couldBe(40, 5), true);
  assert.throws(() => grid.place(1, 5), Contradiction);
});

test('countSolutions spots unique, ambiguous and impossible puzzles', () => {
  assert.equal(countSolutions(Grid.parse(easy)).count, 1);
  assert.equal(countSolutions(new Grid()).count, 2);
  const broken = Grid.parse(easy);
  broken.cands[0] = 0;
  assert.equal(countSolutions(broken).count, 0);
});

for (const strategy of STRATEGIES) {
  test(`${strategy.name} solves every sample correctly`, () => {
    for (const { puzzle } of PUZZLES) {
      const ctx = createContext(Grid.parse(puzzle), { options: strategy.options });
      assert.equal(drain(solveWith(ctx, strategy)), true);
      assert.equal(ctx.grid.toString(), countSolutions(Grid.parse(puzzle)).solution);
    }
  });
}

test('without Tree Search a strategy reports being stuck', () => {
  const strategy = { ...STRATEGIES[0], fallback: false, guess: false };
  const ctx = createContext(Grid.parse(original));
  assert.equal(drain(solveWith(ctx, strategy)), false);
  assert(ctx.grid.blanks().length > 0);
});

test('every look is yielded, so visual and headless runs count the same', () => {
  const strategy = STRATEGIES.find(s => s.id === 'pencil-marks');
  const ctx = createContext(Grid.parse(pencil), { options: strategy.options });
  let looks = 0;
  for (const event of solveWith(ctx, strategy)) if (event.type === 'look') looks++;
  assert.equal(looks, ctx.stats.looks);
});

test('a stuck approach borrows other searches before guessing', () => {
  const strategy = STRATEGIES.find(s => s.id === 'box-by-box');
  const ctx = createContext(Grid.parse(pencil), { options: strategy.options });
  const events = [...solveWith(ctx, strategy)];
  assert.equal(ctx.stats.guesses, 0);
  assert(ctx.stats.stuck > 0);
  const borrowed = events.filter(e => e.type === 'fallback').map(e => e.name);
  assert(!borrowed.includes('Not Search'), 'never borrows a search it already uses');
});

test('Line Check lets pencil marks solve without guessing', () => {
  const strategy = STRATEGIES.find(s => s.id === 'pencil-marks');
  const ctx = createContext(Grid.parse(pencil), { options: strategy.options });
  drain(solveWith(ctx, strategy));
  assert.equal(ctx.stats.guesses, 0);
  assert(ctx.stats.eliminated > 0);
});

test('a group with nowhere for a digit is a contradiction', () => {
  const grid = Grid.parse(easy);
  for (const i of grid.blanks().filter(i => i < 9)) grid.eliminate(i, 4);
  assert.throws(() => drain(hiddenSearch(createContext(grid), { unit: 'row' })), Contradiction);
});

test('grading is deterministic and ranks puzzles sensibly', () => {
  const a = grade(easy);
  assert.deepEqual(grade(easy).results.map(r => r.looks), a.results.map(r => r.looks));
  const hard = grade(PUZZLES[PUZZLES.length - 1].puzzle);
  assert(hard.effort > a.effort * 10);
  assert.equal(a.rating, 'Gentle');
  assert.equal(hard.rating, 'Diabolical');
});

test('grade rejects puzzles without exactly one solution', () => {
  assert.equal(grade('.'.repeat(81)).valid, false);
  assert.equal(grade(`55${'.'.repeat(79)}`).valid, false);
});

test('ratings step up with effort', () => {
  assert.deepEqual([500, 2000, 5000, 10000, 50000, 500000].map(e => rate(e)),
    ['Gentle', 'Moderate', 'Tricky', 'Tough', 'Fiendish', 'Diabolical']);
});

test('needing to guess makes a puzzle at least Tough', () => {
  assert.equal(rate(2000, true), 'Tough');
  assert.equal(rate(50000, true), 'Fiendish');
  const hard = grade(PUZZLES[PUZZLES.length - 1].puzzle);
  assert(hard.needsGuessing);
  assert.equal(grade(pencil).needsGuessing, false);
});
