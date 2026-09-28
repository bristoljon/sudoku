// Grades a puzzle by solving it with every built in approach and measuring
// the effort each needs (looks, see techniques.js).
//
// Difficulty is the geometric mean of those efforts rather than the sum or
// plain average: one approach that happens to suit a puzzle badly (and ends
// up guessing a lot) would otherwise swamp the score. The spread between the
// best and worst approach says how much the puzzle favours a particular style.
//
// Approaches only guess once none of the search methods can make progress.
// Guessing is hard for people however quickly it pays off, so a puzzle that
// needs it is rated at least GUESSING_FLOOR.

const {
  Grid, Contradiction, parseValues, countSolutions,
} = require('./engine');
const {
  createContext, solveWith, drain, GaveUp,
} = require('./techniques');
const { STRATEGIES } = require('./strategies');

const BUDGET = 2000000;

// Upper bounds on effort (looks) for each rating. Calibrated against 150
// generated puzzles (median effort ~1500) and some well known ones: a typical
// newspaper easy is ~800, Inkala's 'world's hardest' ~340,000.
const RATINGS = [
  [1000, 'Gentle'],
  [2500, 'Moderate'],
  [6000, 'Tricky'],
  [20000, 'Tough'],
  [100000, 'Fiendish'],
  [Infinity, 'Diabolical'],
];

const GUESSING_FLOOR = 'Tough';

const LABELS = RATINGS.map(([, name]) => name);

function rate(effort, guessing = false) {
  const n = RATINGS.findIndex(([max]) => effort <= max);
  return LABELS[guessing ? Math.max(n, LABELS.indexOf(GUESSING_FLOOR)) : n];
}

function attempt(givens, strategy, budget = BUDGET) {
  const ctx = createContext(givens.clone(), { options: strategy.options, budget });
  const start = Date.now();
  let outcome;
  try {
    outcome = drain(solveWith(ctx, strategy)) ? 'solved' : 'stuck';
  }
  catch (e) {
    if (!(e instanceof GaveUp)) throw e;
    outcome = 'gave up';
  }
  return {
    id: strategy.id,
    name: strategy.name,
    outcome,
    ...ctx.stats,
    ms: Date.now() - start,
    solution: ctx.grid.toString(),
  };
}

// puzzle: 81 char string, array of values or Grid (only its values are used)
function grade(puzzle, { strategies = STRATEGIES, budget = BUDGET } = {}) {
  let values = puzzle;
  if (typeof puzzle === 'string') values = parseValues(puzzle);
  else if (puzzle instanceof Grid) values = puzzle.values;
  let givens;
  try {
    givens = Grid.fromValues(values);
  }
  catch (e) {
    if (!(e instanceof Contradiction)) throw e;
    return { valid: false, message: `The givens clash: ${e.message}` };
  }

  const { count } = countSolutions(givens, 2);
  if (count !== 1) {
    return {
      valid: false,
      message: count ? 'This puzzle has more than one solution' : 'This puzzle has no solution',
    };
  }

  const results = strategies.map(s => attempt(givens, s, budget));
  const efforts = results.map(r => r.looks);
  const effort = Math.round(Math.exp(efforts.reduce((sum, e) => sum + Math.log(e), 0) / efforts.length));
  const ranked = [...results].sort((a, b) => a.looks - b.looks);
  const needsGuessing = results.every(r => r.guesses > 0);

  return {
    valid: true,
    givens: values.filter(v => v).length,
    effort,
    needsGuessing,
    rating: rate(effort, needsGuessing),
    results,
    favoured: ranked[0],
    spread: ranked[ranked.length - 1].looks / ranked[0].looks,
  };
}

module.exports = {
  grade, attempt, rate, RATINGS, GUESSING_FLOOR, BUDGET,
};
