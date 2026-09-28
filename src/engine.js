// Pure (DOM free) sudoku model. Cells are indexed 0-80 in reading order.
// Candidates ('maybes') are stored as 9 bit masks, bit (d - 1) set if the
// cell could still be digit d.

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const ALL = 0x1ff;

const bit = d => 1 << (d - 1);

// Lookup tables for mask -> number of candidates / list of digits
const COUNT = new Uint8Array(512);
const LIST = [];
for (let mask = 0; mask < 512; mask++) {
  LIST[mask] = DIGITS.filter(d => mask & bit(d));
  COUNT[mask] = LIST[mask].length;
}

const rowOf = i => Math.floor(i / 9);
const colOf = i => i % 9;
const boxOf = i => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

const CELLS = Array.from({ length: 81 }, (_, i) => i);

// Cells in each unit. Box cells are in reading order within the box.
const UNITS = {
  row: DIGITS.map((_, n) => CELLS.filter(i => rowOf(i) === n)),
  col: DIGITS.map((_, n) => CELLS.filter(i => colOf(i) === n)),
  box: DIGITS.map((_, n) => CELLS.filter(i => boxOf(i) === n)),
};

const UNIT_OF = { row: rowOf, col: colOf, box: boxOf };

// The 20 cells sharing a row, column or box with each cell, ordered the way
// you'd read them: across the row, down the column, then the rest of the box
const PEERS = CELLS.map(i => [
  ...UNITS.row[rowOf(i)].filter(j => j !== i),
  ...UNITS.col[colOf(i)].filter(j => j !== i),
  ...UNITS.box[boxOf(i)].filter(j => rowOf(j) !== rowOf(i) && colOf(j) !== colOf(i)),
]);

// Cells in box order: box 1 top left to box 9 bottom right
const BOX_ORDER = [].concat(...UNITS.box);

const label = i => `r${rowOf(i) + 1}c${colOf(i) + 1}`;
const unitName = (type, n) => `${{ row: 'Row', col: 'Column', box: 'Box' }[type]} ${n + 1}`;

class Contradiction extends Error {}

// Accepts 81 digits with '.' or '0' for blanks. Whitespace is ignored.
function parseValues(text) {
  const chars = String(text).replace(/\s/g, '');
  if (chars.length !== 81 || /[^0-9.]/.test(chars)) {
    throw new Error('A puzzle must be 81 characters of 1-9, with 0 or . for blanks');
  }
  return [...chars].map(c => (c === '.' ? 0 : Number(c)));
}

class Grid {
  constructor() {
    this.values = new Uint8Array(81);
    this.cands = new Uint16Array(81).fill(ALL);
  }

  static parse(text) {
    return Grid.fromValues(parseValues(text));
  }

  static fromValues(values) {
    const grid = new Grid();
    values.forEach((d, i) => { if (d) grid.place(i, d); });
    return grid;
  }

  clone() {
    const grid = new Grid();
    grid.restore(this.snapshot());
    return grid;
  }

  snapshot() {
    return { values: this.values.slice(), cands: this.cands.slice() };
  }

  restore(snap) {
    this.values.set(snap.values);
    this.cands.set(snap.cands);
  }

  couldBe(i, d) {
    return !this.values[i] && (this.cands[i] & bit(d)) !== 0;
  }

  candidates(i) {
    return this.values[i] ? [] : LIST[this.cands[i]];
  }

  // Returns the only remaining candidate, or 0
  single(i) {
    return !this.values[i] && COUNT[this.cands[i]] === 1 ? LIST[this.cands[i]][0] : 0;
  }

  blanks(cells = CELLS) {
    return cells.filter(i => !this.values[i]);
  }

  unitHas(cells, d) {
    return cells.some(i => this.values[i] === d);
  }

  isSolved() {
    return this.values.every(v => v);
  }

  // Sets the value and removes it from the maybes of every peer. Returns the
  // blank peers that lost a candidate so callers can check them (Not Check).
  place(i, d) {
    if (this.values[i]) throw new Error(`${label(i)} is already ${this.values[i]}`);
    if (!(this.cands[i] & bit(d))) {
      throw new Contradiction(`${label(i)} can't be ${d}`);
    }
    this.values[i] = d;
    this.cands[i] = bit(d);
    const affected = [];
    for (const p of PEERS[i]) {
      if (this.values[p] === d) throw new Contradiction(`${d} appears twice near ${label(i)}`);
      if (!this.values[p] && this.cands[p] & bit(d)) {
        this.cands[p] &= ~bit(d);
        if (!this.cands[p]) throw new Contradiction(`${label(p)} has no options left`);
        affected.push(p);
      }
    }
    return affected;
  }

  // Removes a candidate. Returns true if it was there.
  eliminate(i, d) {
    if (this.values[i] || !(this.cands[i] & bit(d))) return false;
    this.cands[i] &= ~bit(d);
    if (!this.cands[i]) throw new Contradiction(`${label(i)} has no options left`);
    return true;
  }

  toString() {
    return Array.from(this.values, v => v || '.').join('');
  }
}

// Plain depth first search used to check a puzzle has exactly one solution.
// Not a 'human' method so not counted towards any grading.
function countSolutions(grid, limit = 2) {
  let count = 0;
  let solution = null;
  const search = g => {
    let best = -1;
    for (let i = 0; i < 81; i++) {
      if (!g.values[i] && (best < 0 || COUNT[g.cands[i]] < COUNT[g.cands[best]])) best = i;
    }
    if (best < 0) {
      if (!count++) solution = g.toString();
      return;
    }
    for (const d of LIST[g.cands[best]]) {
      const next = g.clone();
      try {
        next.place(best, d);
      } catch (e) {
        if (e instanceof Contradiction) continue;
        throw e;
      }
      search(next);
      if (count >= limit) return;
    }
  };
  search(grid.clone());
  return { count, solution };
}

module.exports = {
  DIGITS, ALL, bit, COUNT, LIST, CELLS, UNITS, UNIT_OF, PEERS, BOX_ORDER,
  rowOf, colOf, boxOf, label, unitName, Grid, Contradiction, parseValues, countSolutions,
};
