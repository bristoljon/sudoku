// Built in solving approaches. Each is a natural language description of
// how a person might tackle a puzzle, translated into a plan of building
// blocks from techniques.js. A pass runs each step of the plan in turn;
// passes repeat until the puzzle is solved.
//
//   plan     - steps: { technique, ...technique options, repeat }
//              repeat: keep doing this step while it finds something
//   restart  - after any step finds something, go back to the first step
//   options  - notcheck / linecheck, as the toggle buttons
//   fallback - when a full pass finds nothing, try the other building blocks
//   guess    - if still stuck, fall back to Tree Search as a last resort

const STRATEGIES = [
  {
    id: 'box-by-box',
    name: 'Box by box',
    description: 'Go through the boxes in order. In each box, look at every blank and read '
      + 'across its row, down its column and around its box to see what it can\'t be. If only one '
      + 'digit is left, write it in. Keep sweeping until a whole sweep finds nothing.',
    plan: [{ technique: 'notSearch', order: 'box' }],
  },
  {
    id: 'digit-by-digit',
    name: 'Digit by digit',
    description: 'Take each digit from 1 to 9 in turn. For every box that\'s missing it, cross '
      + 'off the squares where it can\'t go because it\'s already in that row or column. If only '
      + 'one square is left, it goes there. After 9, start again at 1.',
    plan: [{ technique: 'hiddenSearch', unit: 'box', order: 'digit' }],
  },
  {
    id: 'rows-then-columns',
    name: 'Rows then columns',
    description: 'Work along each row: for each missing digit, find the squares it could go in. '
      + 'If there\'s only one, fill it in. Then do the same down each column.',
    plan: [
      { technique: 'hiddenSearch', unit: 'row' },
      { technique: 'hiddenSearch', unit: 'col' },
    ],
  },
  {
    id: 'all-rounder',
    name: 'All-rounder',
    description: 'Mix it up: check every blank for what it can\'t be, then look for digits with '
      + 'only one home in each box, each column and each row. Stick with a method while it keeps '
      + 'finding digits before moving on. (This is what the Solve button does.)',
    plan: [
      { technique: 'notSearch', repeat: true },
      { technique: 'hiddenSearch', unit: 'box', repeat: true },
      { technique: 'hiddenSearch', unit: 'col', repeat: true },
      { technique: 'hiddenSearch', unit: 'row', repeat: true },
    ],
  },
  {
    id: 'pencil-marks',
    name: 'Pencil marker',
    description: 'Keep pencil marks. Each time you write a digit, glance at the squares it affects '
      + 'and fill any that are down to one option. Look for digits with only one home in each box, '
      + 'and when a digit\'s options in a box all sit on one line, rub it out of the rest of that '
      + 'line. Go back to the boxes whenever you find something; otherwise try rows and columns.',
    options: { notcheck: true, linecheck: true },
    restart: true,
    plan: [
      { technique: 'hiddenSearch', unit: 'box' },
      { technique: 'hiddenSearch', unit: 'row' },
      { technique: 'hiddenSearch', unit: 'col' },
    ],
  },
].map(s => ({
  options: {}, restart: false, fallback: true, guess: true, ...s,
}));

const UNIT_WORDS = { box: 'box', row: 'row', col: 'column' };

// Describes a plan step in terms of the building blocks (button names)
function describeStep(step) {
  let text;
  if (step.technique === 'notSearch') {
    text = `Not Search every blank, ${step.order === 'box' ? 'box by box' : 'row by row'}`;
  }
  else {
    const unit = UNIT_WORDS[step.unit];
    const name = `${unit[0].toUpperCase()}${unit.slice(1)} Search`;
    text = step.order === 'digit'
      ? `${name}, for each digit 1-9 check every ${unit}`
      : `${name}, for each ${unit} check every missing digit`;
  }
  return step.repeat ? `${text}; repeat while it finds anything` : text;
}

// The strategy as a numbered list of instructions using the button names
function describePlan(strategy) {
  const lines = [];
  const toggles = [];
  if (strategy.options.notcheck) toggles.push('Not Check');
  if (strategy.options.linecheck) toggles.push('Line Check');
  if (toggles.length) lines.push(`Turn on ${toggles.join(' and ')}`);
  const first = lines.length + 1;
  strategy.plan.forEach(step => lines.push(describeStep(step)));
  lines.push(strategy.restart
    ? `Whenever a step finds something, go back to step ${first}`
    : `Repeat from step ${first} until a whole pass finds nothing`);
  if (strategy.fallback) {
    lines.push(`If stuck, try the other searches (easiest first) and go back to step ${first} as soon as one finds something`);
  }
  if (strategy.guess) {
    lines.push(`${strategy.fallback ? 'Only if nothing works' : 'If stuck'}, Tree Search: guess, and back up if it leads to a contradiction`);
  }
  return lines;
}

module.exports = { STRATEGIES, describeStep, describePlan };
