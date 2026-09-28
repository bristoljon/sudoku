const {
  Grid, Contradiction, LIST, CELLS, rowOf, colOf, boxOf, label, parseValues,
} = require('./src/engine');
const {
  createContext, solveWith, notSearch, hiddenSearch, GaveUp,
} = require('./src/techniques');
const { STRATEGIES, describePlan } = require('./src/strategies');
const { grade, GUESSING_FLOOR } = require('./src/grader');
const PUZZLES = require('./src/puzzles');

// Digit colour shows which method solved the cell (matches the buttons)
const COLORS = {
  box: 'chartreuse',
  col: 'deepskyblue',
  row: 'orange',
  tree: 'gray',
  line: 'olive',
  notsearch: 'darkorchid',
  notcheck: 'hotpink',
};

const TECHNIQUE_NAMES = {
  box: 'Box Search',
  col: 'Column Search',
  row: 'Row Search',
  tree: 'Tree Search',
  line: 'Line Check',
  notsearch: 'Not Search',
  notcheck: 'Not Check',
};

const MAX_HISTORY = 5000;

const $ = id => document.getElementById(id);
const fmt = n => Math.round(n).toLocaleString();
const esc = text => String(text).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);

const Sudoku = {
  grid: new Grid(),
  colors: new Array(81).fill(''),
  els: [],
  lit: new Set(),
  config: {
    visuals: 10,
    notcheck: false,
    linecheck: false,
    treesearch: false,
  },
  history: [],
  current: -1,
  running: null,
  beforeRun: null,

  init() {
    CELLS.forEach(i => {
      const el = document.createElement('input');
      el.setAttribute('type', 'number');
      el.setAttribute('class', 'cell');
      el.setAttribute('maxlength', '1');
      $(String(boxOf(i))).appendChild(el);
      el.addEventListener('keyup', e => this.keyup(i, e));
      el.addEventListener('keydown', e => e.preventDefault());
      el.addEventListener('keypress', e => e.preventDefault());
      el.addEventListener('click', () => this.showPopover(i));
      el.addEventListener('mouseover', () => this.showPopover(i));
      this.els[i] = el;
    });
  },

  // Rendering

  render(i) {
    const el = this.els[i];
    el.value = this.grid.values[i] || '';
    el.style.color = this.colors[i] || '#222';
    el.style.backgroundColor = this.lit.has(i) ? el.style.backgroundColor : 'white';
  },

  renderAll() {
    CELLS.forEach(i => this.render(i));
  },

  highlight(i, color, ghost) {
    this.lit.add(i);
    const el = this.els[i];
    el.style.backgroundColor = color;
    if (ghost) {
      el.value = ghost;
      el.style.color = '#666';
    }
  },

  clearHighlights() {
    const lit = [...this.lit];
    this.lit.clear();
    lit.forEach(i => this.render(i));
  },

  showPopover(i) {
    const text = this.grid.values[i]
      ? `${label(i)} is ${this.grid.values[i]}`
      : `${label(i)} maybe: ${this.grid.candidates(i).join(', ')}`;
    this.message(text);
  },

  message(text) {
    $('popover').textContent = text;
  },

  // User input

  keyup(i, event) {
    const moves = {
      37: [-1, 0], 38: [0, -1], 39: [1, 0], 40: [0, 1],
    };
    if (moves[event.keyCode]) {
      const [dx, dy] = moves[event.keyCode];
      const n = rowOf(i) * 9 + colOf(i) + dx + dy * 9;
      if (n >= 0 && n < 81) this.els[n].focus();
      return;
    }
    if (this.running) return;
    if (event.keyCode === 46 || event.keyCode === 8) {
      this.setValue(i, 0);
      return;
    }
    const key = event.key || String.fromCharCode(event.keyCode);
    if (/^[1-9]$/.test(key)) this.setValue(i, Number(key));
  },

  // Entering a digit keeps pencil marks. Changing or deleting one rebuilds
  // the maybes from the digits on the grid.
  setValue(i, d) {
    const current = this.grid.values[i];
    if (d === current) return;
    let next = this.grid.clone();
    if (current) {
      const values = Array.from(this.grid.values);
      values[i] = 0;
      next = Grid.fromValues(values);
    }
    if (d) {
      try {
        next.place(i, d);
      }
      catch (e) {
        if (!(e instanceof Contradiction)) throw e;
        this.message(e.message.startsWith(label(i)) ? e.message : `${label(i)} can't be ${d}: ${e.message}`);
        return;
      }
    }
    this.grid = next;
    this.colors[i] = '';
    this.renderAll();
    this.showPopover(i);
    this.savestep();
  },

  // Running techniques

  // Plays a technique / strategy generator. With visuals on, one event per
  // tick and the working is logged. On Ultra it runs synchronously and only
  // the result is shown.
  // Speed is read every tick so switching to Ultra part way finishes the run.
  play(iterator) {
    const run = { stop: false };
    this.running = run;
    return new Promise((resolve, reject) => {
      const finish = (error, value) => {
        clearTimeout(run.timer);
        this.running = null;
        this.clearHighlights();
        this.renderAll();
        if (error) reject(error);
        else resolve(value);
      };
      const tick = () => {
        if (run.stop) return finish(new Error('Stopped'));
        const speed = this.config.visuals;
        try {
          for (;;) {
            const step = iterator.next();
            if (step.done) return finish(null, step.value);
            if (this.show(step.value, speed > 0)) break;
          }
        }
        catch (e) {
          return finish(e);
        }
        run.timer = setTimeout(tick, speed);
        return null;
      };
      tick();
    });
  },

  // Applies an event to the page. Returns true if it's worth pausing on.
  show(event, visual) {
    const { grid } = this;
    if (event.type === 'place') {
      this.colors[event.cell] = COLORS[event.by];
      this.savestep();
    }
    if (event.type === 'backtrack') {
      CELLS.forEach(i => { if (!grid.values[i]) this.colors[i] = ''; });
    }
    if (!visual) return false;

    this.clearHighlights();
    switch (event.type) {
      case 'look':
        if (event.kind === 'read') {
          this.highlight(event.cell, 'lightgreen');
          this.highlight(event.from, 'orange');
        }
        else if (event.kind === 'try') {
          this.highlight(event.cell, event.ok ? 'lightgreen' : 'lightcoral', event.digit);
        }
        else if (event.kind === 'strike') {
          this.highlight(event.cell, 'pink');
        }
        else this.highlight(event.cell, 'khaki');
        return true;
      case 'place':
        this.render(event.cell);
        this.highlight(event.cell, 'lightgreen');
        this.log(event.reason, COLORS[event.by], TECHNIQUE_NAMES[event.by]);
        return true;
      case 'eliminate':
        event.cells.forEach(i => this.highlight(i, 'pink'));
        this.log(event.reason, COLORS.line, TECHNIQUE_NAMES.line);
        return true;
      case 'guess':
        this.highlight(event.cell, 'lightgray');
        this.log(event.reason, COLORS.tree, `Guess, depth ${event.depth}`);
        return true;
      case 'backtrack':
        this.renderAll();
        this.log(event.reason, 'red', 'Back up');
        return true;
      case 'pass':
        this.log(`Pass ${event.n}`, null, null, 'pass');
        return false;
      case 'fallback':
        this.log(`Stuck - try ${event.name} instead`, '#ddd', 'Borrow');
        return false;
      case 'stuck':
        this.log(`A whole pass found nothing new. Stuck with ${event.blanks} blanks.`, 'red');
        return false;
      default:
        return false;
    }
  },

  log(text, color, tag, className) {
    const list = $('working');
    const li = document.createElement('li');
    if (className) li.className = className;
    li.innerHTML = (tag ? `<span class="tag" style="background:${color}">${esc(tag)}</span> ` : '')
      + esc(text);
    list.appendChild(li);
    while (list.children.length > 1000) list.removeChild(list.firstChild);
    list.scrollTop = list.scrollHeight;
  },

  clearLog() {
    $('working').innerHTML = '';
  },

  context(options = this.config) {
    return createContext(this.grid, {
      options: { notcheck: options.notcheck, linecheck: options.linecheck },
    });
  },

  // Runs one of the original buttons
  runButton(id) {
    const ctx = this.context();
    const single = {
      notsearch: () => notSearch(ctx),
      boxsearch: () => hiddenSearch(ctx, { unit: 'box' }),
      colsearch: () => hiddenSearch(ctx, { unit: 'col' }),
      rowsearch: () => hiddenSearch(ctx, { unit: 'row' }),
    };
    if (single[id]) {
      return this.play(single[id]()).then(found => {
        this.log(`${$(id).value}: ${found ? `${found} found` : 'nothing new'} (${fmt(ctx.stats.looks)} looks)`, null, null, 'result');
      });
    }
    const strategy = {
      ...STRATEGIES.find(s => s.id === 'all-rounder'),
      fallback: false,
      guess: this.config.treesearch,
    };
    return this.play(solveWith(ctx, strategy)).then(solved => {
      this.log(summary('Solve', solved, ctx.stats), null, null, 'result');
      if (!solved) throw new Error('Failed to solve. Try enabling Tree Search');
    });
  },

  // Watches a built in approach solve the digits currently on the grid.
  // Pencil marks start fresh so the effort matches the grade.
  watch(strategy) {
    this.grid = Grid.fromValues(this.grid.values);
    const ctx = createContext(this.grid, { options: strategy.options });
    this.log(`${strategy.name}: ${strategy.description}`, null, null, 'heading');
    return this.play(solveWith(ctx, strategy)).then(solved => {
      this.log(summary(strategy.name, solved, ctx.stats), null, null, 'result');
    });
  },

  // History

  snapshot() {
    return { ...this.grid.snapshot(), colors: this.colors.slice() };
  },

  restore(snap) {
    this.grid = new Grid();
    this.grid.restore(snap);
    this.colors = snap.colors.slice();
    this.renderAll();
  },

  // Called every time a value is found. If we've stepped back, the steps
  // after this point are replaced.
  // Only the last MAX_HISTORY steps are kept (Reset goes back to the start of a run)
  savestep() {
    this.history.length = this.current + 1;
    this.history.push(this.snapshot());
    if (this.history.length > MAX_HISTORY) this.history.shift();
    this.current = this.history.length - 1;
  },

  step(direction) {
    const n = this.current + (direction === 'back' ? -1 : 1);
    if (n < 0 || n >= this.history.length) return;
    this.current = n;
    this.restore(this.history[n]);
  },

  // Saving / loading

  clear() {
    this.grid = new Grid();
    this.colors.fill('');
    this.renderAll();
    this.savestep();
  },

  // Same format as v1 so old saves still load
  save(name) {
    const cells = CELLS.map(i => ({
      value: this.grid.values[i] ? String(this.grid.values[i]) : '',
      maybes: this.grid.values[i] ? [String(this.grid.values[i])] : LIST[this.grid.cands[i]].map(String),
      color: this.colors[i],
    }));
    localStorage.setItem(name, JSON.stringify(cells));
  },

  load(name) {
    const cells = JSON.parse(localStorage.getItem(name));
    const grid = Grid.fromValues(cells.map(c => Number(c.value) || 0));
    cells.forEach((c, i) => {
      if (!c.value && c.maybes) {
        const mask = c.maybes.reduce((m, d) => m | (1 << (Number(d) - 1)), 0);
        if (grid.cands[i] & mask) grid.cands[i] &= mask;
      }
    });
    this.grid = grid;
    this.colors = cells.map(c => (c.value && c.color) || '');
    this.renderAll();
    this.history = [];
    this.current = -1;
    this.savestep();
  },

  loadString(text) {
    this.grid = Grid.fromValues(parseValues(text));
    this.colors.fill('');
    this.renderAll();
    this.history = [];
    this.current = -1;
    this.savestep();
  },
};

function summary(name, solved, stats) {
  const outcome = solved ? 'solved' : 'stuck';
  const guesses = stats.guesses
    ? `${stats.guesses} guesses, ${stats.backtracks} dead ends`
    : 'no guessing';
  const stuck = stats.stuck ? `, stuck ${stats.stuck} times` : '';
  return `${name}: ${outcome} in ${stats.passes} passes - ${fmt(stats.looks)} looks, `
    + `${stats.placed} digits entered${stuck}, ${guesses}`;
}

// Approaches panel

function renderStrategies() {
  $('strategies').innerHTML = STRATEGIES.map(s => `
    <div class="strategy">
      <h5>${esc(s.name)} <button class="btn btn-default btn-xs watch" data-id="${s.id}">Watch</button></h5>
      <p>${esc(s.description)}</p>
      <ol class="plan">${describePlan(s).map(line => `<li>${esc(line)}</li>`).join('')}</ol>
    </div>`).join('');
}

function renderGrade(result) {
  const el = $('grade');
  if (!result.valid) {
    el.innerHTML = `<p class="verdict">${esc(result.message)}</p>`;
    return;
  }
  const best = result.favoured.looks;
  const rows = result.results.map(r => `
    <tr${r.looks === best ? ' class="best"' : ''}>
      <td>${esc(r.name)}</td>
      <td>${r.outcome}</td>
      <td class="num">${fmt(r.looks)}</td>
      <td class="num">${r.passes}</td>
      <td class="num">${r.stuck}</td>
      <td class="num">${r.guesses}</td>
    </tr>`).join('');
  el.innerHTML = `
    <p class="verdict"><strong>${result.rating}</strong> - effort ${fmt(result.effort)}</p>
    ${result.needsGuessing ? `<p><strong>Needs guessing:</strong> at some point none of the
    searches can make progress, so every approach has to resort to trial and error. That makes
    it at least ${GUESSING_FLOOR}.</p>` : ''}
    <p>Effort is the number of looks (reading a square or checking if a digit fits) each approach
    needed, including any work wasted on wrong guesses. The difficulty is their geometric mean.
    'Stuck' counts how often an approach ran dry and had to borrow another search.
    This puzzle favours <strong>${esc(result.favoured.name)}</strong>; the hardest approach
    took ${result.spread.toFixed(1)}&times; as many looks.</p>
    <table class="table table-condensed">
      <thead><tr><th>Approach</th><th>Result</th><th class="num">Looks</th><th class="num">Passes</th><th class="num">Stuck</th><th class="num">Guesses</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// Event listeners

const runButtons = () => document.querySelectorAll('.solve, .watch, #grade-btn');

// Disables the other run buttons while one is going. Clicking the active
// one again stops it.
function running(button, promise) {
  runButtons().forEach(b => { b.disabled = b !== button; });
  button.classList.add('btn-danger');
  const done = () => {
    runButtons().forEach(b => { b.disabled = false; });
    button.classList.remove('btn-danger');
  };
  promise.then(done, e => {
    done();
    Sudoku.message(e instanceof GaveUp || e instanceof Contradiction || e.message === 'Stopped'
      ? e.message
      : `Error: ${e.message}`);
    if (e instanceof Contradiction) Sudoku.log(`This puzzle appears to be unsolvable: ${e.message}`, 'red');
  });
}

function start(button, fn) {
  if (Sudoku.running) {
    Sudoku.running.stop = true;
    return;
  }
  Sudoku.beforeRun = Sudoku.snapshot();
  running(button, fn());
}

$('clear').addEventListener('click', () => Sudoku.clear());
$('save').addEventListener('click', () => Sudoku.save('puzzle'));
$('load').addEventListener('click', () => Sudoku.load('puzzle'));
$('reset').addEventListener('click', () => {
  if (Sudoku.beforeRun && !Sudoku.running) {
    Sudoku.restore(Sudoku.beforeRun);
    Sudoku.savestep();
  }
});

document.querySelectorAll('.visual').forEach(el => el.addEventListener('click', e => {
  document.querySelectorAll('.visual').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  Sudoku.config.visuals = { visualSlow: 250, visualFast: 10, visualOff: 0 }[e.target.id];
}));

$('backStep').addEventListener('click', () => Sudoku.step('back'));
$('forwardStep').addEventListener('click', () => Sudoku.step('forward'));

['notcheck', 'linecheck', 'treesearch'].forEach(id => $(id).addEventListener('click', e => {
  Sudoku.config[id] = !Sudoku.config[id];
  e.target.classList.toggle('active', Sudoku.config[id]);
}));

document.querySelectorAll('.solve').forEach(el => el.addEventListener('click', e => {
  start(e.target, () => Sudoku.runButton(e.target.id));
}));

$('strategies').addEventListener('click', e => {
  if (!e.target.classList.contains('watch')) return;
  const strategy = STRATEGIES.find(s => s.id === e.target.dataset.id);
  start(e.target, () => Sudoku.watch(strategy));
});

$('grade-btn').addEventListener('click', e => {
  if (Sudoku.running) return;
  $('grade').innerHTML = '<p class="verdict">Grading&hellip;</p>';
  const button = e.target;
  button.disabled = true;
  // Let the page repaint before the (blocking) grading runs
  setTimeout(() => {
    try {
      renderGrade(grade(Sudoku.grid.values));
    }
    catch (err) {
      $('grade').innerHTML = `<p class="verdict">${esc(err.message)}</p>`;
    }
    button.disabled = false;
  }, 20);
});

$('clear-log').addEventListener('click', () => Sudoku.clearLog());

$('examples').innerHTML = '<option value="">Examples&hellip;</option>'
  + PUZZLES.map((p, n) => `<option value="${n}">${esc(p.name)}</option>`).join('');
$('examples').addEventListener('change', e => {
  if (e.target.value === '' || Sudoku.running) return;
  Sudoku.loadString(PUZZLES[e.target.value].puzzle);
  $('grade').innerHTML = '';
  e.target.value = '';
});

$('import').addEventListener('click', () => {
  if (Sudoku.running) return;
  try {
    Sudoku.loadString($('puzzle-text').value);
    $('grade').innerHTML = '';
  }
  catch (e) {
    Sudoku.message(e.message);
  }
});

$('export').addEventListener('click', () => {
  $('puzzle-text').value = Sudoku.grid.toString();
});

Sudoku.init();
renderStrategies();
if (!localStorage.getItem('puzzle')) {
  Sudoku.loadString(PUZZLES[1].puzzle);
  Sudoku.save('puzzle');
}
Sudoku.load('puzzle');
