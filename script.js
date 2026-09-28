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
import { initInstall } from './install.js';

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
  start: null,
  name: '',

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
    this.editedStart();
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

  // Puzzles
  //
  // Every puzzle has a start (what Reset goes back to): an example or scan as
  // it was loaded, a saved puzzle as it was when first saved, or whatever
  // you've typed in before running any searches.

  // Replaces the puzzle. name is set when it came from Puzzles, so saving
  // again updates that entry.
  open(state, start = state, name = '') {
    this.stop();
    this.restore(state);
    this.start = start;
    this.name = name;
    this.history = [];
    this.current = -1;
    this.beforeRun = null;
    this.savestep();
    clearGrade();
    this.persist();
  },

  // Loads 81 digits (0 = blank) as a new puzzle
  loadValues(values, name) {
    const grid = Grid.fromValues(values);
    this.open({ ...grid.snapshot(), colors: new Array(81).fill('') }, undefined, name);
  },

  clear() {
    this.loadValues(new Array(81).fill(0));
  },

  reset() {
    if (!this.start) return;
    this.stop();
    this.restore(this.start);
    this.savestep();
  },

  // Digits typed in before any search has run are setting up the puzzle
  editedStart() {
    if (this.colors.every(c => !c)) this.start = this.snapshot();
  },

  // The current puzzle survives reloads (and the app being closed)
  persist() {
    store.set('puzzle', JSON.stringify(toCells(this.snapshot())));
    if (this.start) store.set('start', JSON.stringify(toCells(this.start)));
    store.set('puzzle-name', this.name || '');
  },

  resume() {
    const state = fromCells(store.get('puzzle'));
    if (!state) return false;
    // Saves from before there was a start: the digits you entered
    const start = fromCells(store.get('start')) || givensOf(state);
    this.open(state, start, store.get('puzzle-name') || '');
    return true;
  },

  saveAs(name) {
    const list = savedPuzzles().filter(p => p.name !== name);
    list.unshift({ name, start: toCells(this.start || this.snapshot()), state: toCells(this.snapshot()) });
    store.set('saved', JSON.stringify(list));
    this.name = name;
    this.persist();
  },

  openSaved(name) {
    const entry = savedPuzzles().find(p => p.name === name);
    const state = entry && fromCells(entry.state);
    if (!state) return false;
    this.open(state, fromCells(entry.start) || givensOf(state), name);
    return true;
  },
};

// Stored in the same cell format as v1, so its saves still load
function toCells(snap) {
  return CELLS.map(i => ({
    value: snap.values[i] ? String(snap.values[i]) : '',
    maybes: snap.values[i] ? [String(snap.values[i])] : LIST[snap.cands[i]].map(String),
    color: snap.colors[i],
  }));
}

// Accepts cells or their JSON. Returns a snapshot, or null if unusable.
function fromCells(cells) {
  let grid;
  try {
    if (typeof cells === 'string') cells = JSON.parse(cells);
    if (!Array.isArray(cells) || cells.length !== 81) return null;
    grid = Grid.fromValues(cells.map(c => Number(c.value) || 0));
  }
  catch (e) {
    return null;
  }
  cells.forEach((c, i) => {
    if (!c.value && c.maybes) {
      const mask = c.maybes.reduce((m, d) => m | (1 << (Number(d) - 1)), 0);
      if (grid.cands[i] & mask) grid.cands[i] &= mask;
    }
  });
  // v1 saved every cell's colour, including 'black' / '#222' for givens
  const colors = cells.map(c => (c.value && Object.values(COLORS).includes(c.color) ? c.color : ''));
  return { ...grid.snapshot(), colors };
}

// Just the digits you entered, with fresh pencil marks
function givensOf(snap) {
  const grid = Grid.fromValues(CELLS.map(i => (snap.colors[i] ? 0 : snap.values[i])));
  return { ...grid.snapshot(), colors: new Array(81).fill('') };
}

function savedPuzzles() {
  try {
    const list = JSON.parse(store.get('saved'));
    return Array.isArray(list) ? list : [];
  }
  catch (e) {
    return [];
  }
}

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

$('reset').addEventListener('click', () => Sudoku.reset());

// Undo the last search / watch
$('undo').addEventListener('click', () => {
  if (Sudoku.beforeRun && !Sudoku.running) {
    Sudoku.restore(Sudoku.beforeRun);
    Sudoku.savestep();
  }
});

// Save dialog: name the puzzle (saving under an existing name replaces it)
// and manage saved puzzles

function renderSavedList() {
  const list = savedPuzzles();
  $('saved-list').innerHTML = list.length
    ? `<h3>Saved</h3><ul>${list.map(p => `
      <li><span>${esc(p.name)}</span>
      <button type="button" class="small delete" data-name="${esc(p.name)}" aria-label="Delete ${esc(p.name)}">Delete</button></li>`).join('')}</ul>`
    : '';
}

const defaultName = () => Sudoku.name
  || `Puzzle ${new Date().toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`;

$('save').addEventListener('click', () => {
  $('save-name').value = defaultName();
  renderSavedList();
  $('save-dialog').returnValue = ''; // Escape keeps the previous value
  $('save-dialog').showModal();
  $('save-name').select();
});

$('save-cancel').addEventListener('click', () => $('save-dialog').close('cancel'));

$('save-dialog').addEventListener('close', () => {
  const name = $('save-name').value.trim();
  if ($('save-dialog').returnValue !== 'save' || !name) return;
  const replacing = savedPuzzles().some(p => p.name === name);
  Sudoku.saveAs(name);
  renderPuzzleMenu();
  toast(`${replacing ? 'Updated' : 'Saved'} "${name}" - it's under Puzzles`);
});

$('saved-list').addEventListener('click', e => {
  const btn = e.target.closest('.delete');
  if (!btn) return;
  store.set('saved', JSON.stringify(savedPuzzles().filter(p => p.name !== btn.dataset.name)));
  if (Sudoku.name === btn.dataset.name) Sudoku.name = '';
  renderSavedList();
  renderPuzzleMenu();
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

// Puzzles menu: your saved puzzles, then the examples
function renderPuzzleMenu() {
  const saved = savedPuzzles();
  $('puzzles').innerHTML = '<option value="">Puzzles&hellip;</option>'
    + (saved.length ? `<optgroup label="Saved">${saved.map(p => `<option value="s:${esc(p.name)}">${esc(p.name)}</option>`).join('')}</optgroup>` : '')
    + `<optgroup label="Examples">${PUZZLES.map((p, n) => `<option value="e:${n}">${esc(p.name)}</option>`).join('')}</optgroup>`;
}

$('puzzles').addEventListener('change', e => {
  const { value } = e.target;
  e.target.value = '';
  if (value.startsWith('s:')) {
    if (!Sudoku.openSaved(value.slice(2))) toast("Couldn't open that puzzle");
  }
  else if (value.startsWith('e:')) {
    Sudoku.loadValues(parseValues(PUZZLES[value.slice(2)].puzzle));
  }
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
    toast(`Imported ${grid.filter(Boolean).length} digits - Reset comes back here`);
  },
});

initInstall();
Sudoku.init();
renderStrategies();
renderPuzzleMenu();
if (!Sudoku.resume()) Sudoku.loadValues(parseValues(PUZZLES[1].puzzle));

// Keep the current puzzle when the app is closed or switched away from
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') Sudoku.persist();
});
window.addEventListener('pagehide', () => Sudoku.persist());

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
