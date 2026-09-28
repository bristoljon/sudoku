import {
  Grid, Contradiction, LIST, CELLS, rowOf, colOf, boxOf, parseValues,
} from './src/engine.js';
import {
  createContext, solveWith, notSearch, hiddenSearch, GaveUp,
} from './src/techniques.js';
import { STRATEGIES, describePlan } from './src/strategies.js';
import { grade, GUESSING_FLOOR } from './src/grader.js';
import PUZZLES from './src/puzzles.js';
import { initScanner } from './scan-ui.js';
import { toast } from './toast.js';

// Digit colour shows which method solved the cell (matches the buttons).
// Digits you enter yourself have no colour: they're the puzzle's givens.
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

const store = {
  get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode etc */ }
  },
};

const Sudoku = {
  grid: new Grid(),
  colors: new Array(81).fill(''),
  els: [],
  lit: new Set(),
  selected: -1,
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

  // Read-only inputs: they hold the digits and solver visuals but don't pop
  // up a mobile keyboard - digits come from the keypad (or a real keyboard)
  init() {
    CELLS.forEach(i => {
      const el = document.createElement('input');
      el.setAttribute('type', 'text');
      el.setAttribute('class', 'cell');
      el.setAttribute('readonly', '');
      el.setAttribute('inputmode', 'none');
      el.setAttribute('autocomplete', 'off');
      el.setAttribute('aria-label', `Row ${rowOf(i) + 1} column ${colOf(i) + 1}`);
      $(String(boxOf(i))).appendChild(el);
      el.addEventListener('keydown', e => this.onKey(i, e));
      el.addEventListener('focus', () => this.select(i, true));
      el.addEventListener('mouseover', () => this.showPopover(i));
      this.els[i] = el;
    });
  },

  // Rendering

  render(i) {
    const el = this.els[i];
    el.value = this.grid.values[i] || '';
    el.style.color = this.colors[i];
    if (!this.lit.has(i)) el.style.backgroundColor = '';
  },

  renderAll() {
    CELLS.forEach(i => this.render(i));
    if (this.selected >= 0) this.showPopover(this.selected);
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

  // Mark the selected cell and its row / column / box
  select(i, fromFocus) {
    this.selected = i;
    this.els.forEach((el, j) => {
      el.classList.toggle('sel', j === i);
      el.classList.toggle('peer', j !== i
        && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i)));
    });
    if (!fromFocus) this.els[i].focus({ preventScroll: true });
    this.showPopover(i);
  },

  showPopover(i) {
    const { values } = this.grid;
    $('popover').textContent = values[i]
      ? `Row ${rowOf(i) + 1}, column ${colOf(i) + 1}: ${values[i]}`
      : `Could be: ${this.grid.candidates(i).join(' ')}`;
    if (i !== this.selected) return;
    document.querySelectorAll('#keypad [data-digit]').forEach(b => {
      b.classList.toggle('dim', !values[i] && !this.grid.couldBe(i, Number(b.dataset.digit)));
    });
  },

  nope(i, text) {
    const el = this.els[i];
    el.classList.remove('nope');
    void el.offsetWidth; // restart animation
    el.classList.add('nope');
    toast(text);
  },

  // User input

  // Arrow keys move, 1-9 enter, backspace / delete / 0 / space clear
  onKey(i, event) {
    const moves = {
      ArrowLeft: i > 0 ? i - 1 : -1,
      ArrowRight: i < 80 ? i + 1 : -1,
      ArrowUp: i >= 9 ? i - 9 : -1,
      ArrowDown: i < 72 ? i + 9 : -1,
    };
    if (event.key === 'Tab') return;
    event.preventDefault();
    if (event.key in moves) {
      if (moves[event.key] >= 0) this.select(moves[event.key]);
    }
    else if (['Delete', 'Backspace', '0', ' '].includes(event.key)) this.setValue(i, 0);
    else if (/^[1-9]$/.test(event.key)) this.setValue(i, Number(event.key));
  },

  // Entering a digit keeps pencil marks. Changing or deleting one rebuilds
  // the maybes from the digits on the grid.
  setValue(i, d) {
    if (this.running) {
      toast('Stop the search first (tap it again)');
      return;
    }
    const current = this.grid.values[i];
    if (d === current) return;
    let next = this.grid.clone();
    if (current) {
      const values = Array.from(this.grid.values);
      values[i] = 0;
      next = Grid.fromValues(values);
    }
    if (d) {
      if (!next.couldBe(i, d)) {
        this.nope(i, `${d} can't go there - it's already in this row, column or box`);
        return;
      }
      try {
        next.place(i, d);
      }
      catch (e) {
        if (!(e instanceof Contradiction)) throw e;
        this.nope(i, `${d} can't go there: ${e.message}`);
        return;
      }
    }
    this.grid = next;
    this.colors[i] = '';
    this.renderAll();
    this.savestep();
  },

  // The digits you entered (not the solver's): what Grade rates
  givens() {
    return CELLS.map(i => (this.colors[i] ? 0 : this.grid.values[i]));
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

  stop() {
    if (this.running) this.running.stop = true;
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

  // Runs one of the Solve tab buttons
  runButton(id, name) {
    const ctx = this.context();
    const single = {
      notsearch: () => notSearch(ctx),
      boxsearch: () => hiddenSearch(ctx, { unit: 'box' }),
      colsearch: () => hiddenSearch(ctx, { unit: 'col' }),
      rowsearch: () => hiddenSearch(ctx, { unit: 'row' }),
    };
    if (single[id]) {
      return this.play(single[id]()).then(found => {
        this.log(`${name}: ${found ? `${found} found` : 'nothing new'} (${fmt(ctx.stats.looks)} looks)`, null, null, 'result');
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
    if (this.running) return;
    const n = this.current + (direction === 'back' ? -1 : 1);
    if (n < 0 || n >= this.history.length) return;
    this.current = n;
    this.restore(this.history[n]);
  },

  // Saving / loading

  clear() {
    this.stop();
    this.grid = new Grid();
    this.colors.fill('');
    this.renderAll();
    this.savestep();
    clearGrade();
  },

  // Same format as v1 so old saves still load
  save(name) {
    const cells = CELLS.map(i => ({
      value: this.grid.values[i] ? String(this.grid.values[i]) : '',
      maybes: this.grid.values[i] ? [String(this.grid.values[i])] : LIST[this.grid.cands[i]].map(String),
      color: this.colors[i],
    }));
    store.set(name, JSON.stringify(cells));
  },

  load(name) {
    let cells;
    let grid;
    try {
      cells = JSON.parse(store.get(name));
      if (!Array.isArray(cells) || cells.length !== 81) return false;
      grid = Grid.fromValues(cells.map(c => Number(c.value) || 0));
    }
    catch (e) {
      return false;
    }
    cells.forEach((c, i) => {
      if (!c.value && c.maybes) {
        const mask = c.maybes.reduce((m, d) => m | (1 << (Number(d) - 1)), 0);
        if (grid.cands[i] & mask) grid.cands[i] &= mask;
      }
    });
    this.stop();
    this.grid = grid;
    // v1 saved every cell's colour, including 'black' / '#222' for givens
    this.colors = cells.map(c => (c.value && Object.values(COLORS).includes(c.color) ? c.color : ''));
    this.resetHistory();
    return true;
  },

  // Loads 81 digits (0 = blank) as a new puzzle
  loadValues(values) {
    const grid = Grid.fromValues(values);
    this.stop();
    this.grid = grid;
    this.colors.fill('');
    this.resetHistory();
  },

  resetHistory() {
    this.renderAll();
    this.history = [];
    this.current = -1;
    this.beforeRun = null;
    this.savestep();
    clearGrade();
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

// Grade tab

function renderStrategies() {
  $('strategies').innerHTML = STRATEGIES.map(s => `
    <div class="strategy">
      <h3>${esc(s.name)} <button type="button" class="watch" data-id="${s.id}">Watch</button></h3>
      <p>${esc(s.description)}</p>
      <ol class="plan">${describePlan(s).map(line => `<li>${esc(line)}</li>`).join('')}</ol>
    </div>`).join('');
}

function clearGrade() {
  $('grade').innerHTML = '';
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
      <td>${esc(r.name)}${r.outcome === 'solved' ? '' : ` <em>(${r.outcome})</em>`}</td>
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
    <p>This puzzle favours <strong>${esc(result.favoured.name)}</strong>; the hardest approach
    took ${result.spread.toFixed(1)}&times; as many looks.</p>
    <div class="scroll">
      <table>
        <thead><tr><th>Approach</th><th class="num">Looks</th><th class="num">Passes</th><th class="num">Stuck</th><th class="num">Guesses</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// Grading runs in a worker so hard puzzles don't freeze the page. Falls back
// to running here if workers aren't available or the worker fails to load.
let worker = null;
let workerBroken = !window.Worker;
let jobs = 0;

function gradeInPage(values) {
  return new Promise(resolve => setTimeout(() => resolve(grade(values)), 20));
}

function gradeAsync(values) {
  if (workerBroken) return gradeInPage(values);
  if (!worker) worker = new Worker('grade-worker.js');
  const current = worker;
  const id = ++jobs;
  return new Promise((resolve, reject) => {
    const done = () => {
      current.removeEventListener('message', onMessage);
      current.removeEventListener('error', onError);
    };
    function onMessage({ data }) {
      if (data.id !== id) return;
      done();
      if (data.error) reject(new Error(data.error));
      else resolve(data.result);
    }
    function onError() {
      done();
      workerBroken = true;
      worker = null;
      resolve(gradeInPage(values));
    }
    current.addEventListener('message', onMessage);
    current.addEventListener('error', onError);
    current.postMessage({ id, values });
  });
}

// Event listeners

const runButtons = () => document.querySelectorAll('.solve, .watch');

// Disables the other run buttons while one is going. Tapping the active
// one again stops it.
function running(button, promise) {
  runButtons().forEach(b => { b.disabled = b !== button; });
  button.classList.add('running');
  const done = () => {
    runButtons().forEach(b => { b.disabled = false; });
    button.classList.remove('running');
  };
  promise.then(done, e => {
    done();
    toast(e instanceof GaveUp || e instanceof Contradiction || e.message === 'Stopped'
      ? e.message
      : `Error: ${e.message}`);
    if (e instanceof Contradiction) Sudoku.log(`This puzzle appears to be unsolvable: ${e.message}`, 'red');
  });
}

function start(button, fn) {
  if (Sudoku.running) {
    Sudoku.stop();
    return;
  }
  Sudoku.beforeRun = Sudoku.snapshot();
  running(button, fn());
}

$('clear').addEventListener('click', () => Sudoku.clear());

$('save').addEventListener('click', () => {
  Sudoku.save('puzzle');
  toast('Saved - Load will bring you back to this point');
});

$('load').addEventListener('click', () => {
  if (!Sudoku.load('puzzle')) toast('Nothing saved yet');
});

$('reset').addEventListener('click', () => {
  if (Sudoku.beforeRun && !Sudoku.running) {
    Sudoku.restore(Sudoku.beforeRun);
    Sudoku.savestep();
  }
});

document.querySelectorAll('.visual').forEach(btn => btn.addEventListener('click', e => {
  document.querySelectorAll('.visual').forEach(el => el.classList.remove('active'));
  e.currentTarget.classList.add('active');
  Sudoku.config.visuals = Number(e.currentTarget.dataset.speed);
}));

$('backStep').addEventListener('click', () => Sudoku.step('back'));
$('forwardStep').addEventListener('click', () => Sudoku.step('forward'));

// Not Check / Line Check / Tree Search toggles
document.querySelectorAll('.check').forEach(btn => btn.addEventListener('click', e => {
  const el = e.currentTarget;
  const on = !Sudoku.config[el.id];
  Sudoku.config[el.id] = on;
  el.classList.toggle('active', on);
  el.setAttribute('aria-pressed', on);
}));

// On-screen keypad
const keypad = $('keypad');
keypad.addEventListener('pointerdown', e => e.preventDefault()); // keep cell focus
keypad.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  if (Sudoku.selected < 0) {
    toast('Tap a cell first');
    return;
  }
  Sudoku.setValue(Sudoku.selected, Number(btn.dataset.digit) || 0);
});

document.querySelectorAll('.solve').forEach(btn => btn.addEventListener('click', e => {
  const target = e.currentTarget;
  start(target, () => Sudoku.runButton(target.id, target.textContent.trim()));
}));

$('strategies').addEventListener('click', e => {
  const btn = e.target.closest('.watch');
  if (!btn) return;
  const strategy = STRATEGIES.find(s => s.id === btn.dataset.id);
  start(btn, () => Sudoku.watch(strategy));
});

$('grade-btn').addEventListener('click', e => {
  const button = e.currentTarget;
  button.disabled = true;
  $('grade').innerHTML = '<p class="verdict">Grading&hellip;</p>';
  gradeAsync(Sudoku.givens())
    .then(renderGrade, err => {
      $('grade').innerHTML = `<p class="verdict">${esc(err.message)}</p>`;
    })
    .then(() => { button.disabled = false; });
});

$('clear-log').addEventListener('click', () => Sudoku.clearLog());

// Tabs under the grid
const tabs = document.querySelectorAll('[role="tab"]');
function showTab(id) {
  tabs.forEach(tab => {
    const on = tab.id === id;
    tab.setAttribute('aria-selected', on);
    tab.tabIndex = on ? 0 : -1;
    $(tab.getAttribute('aria-controls')).hidden = !on;
  });
  store.set('tab', id);
}
tabs.forEach(tab => tab.addEventListener('click', () => showTab(tab.id)));
$('tabs').addEventListener('keydown', e => {
  const list = [...tabs];
  const n = list.indexOf(document.activeElement);
  const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
  if (n < 0 || !step) return;
  const next = list[(n + step + list.length) % list.length];
  showTab(next.id);
  next.focus();
});
const savedTab = store.get('tab');
if (savedTab && $(savedTab) && $(savedTab).getAttribute('role') === 'tab') showTab(savedTab);

// Examples and puzzle text
$('examples').innerHTML = '<option value="">Examples&hellip;</option>'
  + PUZZLES.map((p, n) => `<option value="${n}">${esc(p.name)}</option>`).join('');
$('examples').addEventListener('change', e => {
  if (e.target.value === '') return;
  Sudoku.loadValues(parseValues(PUZZLES[e.target.value].puzzle));
  e.target.value = '';
});

$('import').addEventListener('click', () => {
  try {
    Sudoku.loadValues(parseValues($('puzzle-text').value));
  }
  catch (e) {
    toast(e.message);
  }
});

$('export').addEventListener('click', () => {
  $('puzzle-text').value = Sudoku.grid.toString();
});

initScanner({
  onImport: grid => {
    try {
      Sudoku.loadValues(grid);
    }
    catch (e) {
      if (!(e instanceof Contradiction)) throw e;
      toast(`Couldn't import: ${e.message}`);
      return;
    }
    Sudoku.save('puzzle');
    toast(`Imported ${grid.filter(Boolean).length} digits and saved as your start position`);
  },
});

Sudoku.init();
renderStrategies();
if (!Sudoku.load('puzzle')) {
  Sudoku.loadValues(parseValues(PUZZLES[1].puzzle));
  Sudoku.save('puzzle');
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
