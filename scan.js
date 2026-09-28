// On-device sudoku scanner: finds the grid in a photo, straightens it and
// reads the digits with a tiny neural net. No dependencies, works offline.
// All image functions work on 8-bit greyscale buffers so they can be run in
// the browser or in node (see tools/).
import MODEL from './digit-model.js';

export const CELL = 48; // px per cell in the straightened grid
export const SIZE = CELL * 9;
export const NET_SIZE = 20; // classifier input is NET_SIZE x NET_SIZE
const FIT = 16; // digit is scaled to fit in FIT x FIT, centred

export function rgbaToGray(rgba, w, h) {
  const g = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < g.length; i++, j += 4) {
    g[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
  }
  return g;
}

function integral(g, w, h) {
  const W = w + 1;
  const I = new Float64Array(W * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += g[y * w + x];
      I[(y + 1) * W + x + 1] = I[y * W + x + 1] + row;
    }
  }
  return I;
}

// 1 = ink (darker than local mean by more than c)
export function adaptiveThreshold(g, w, h, r, c) {
  const I = integral(g, w, h);
  const W = w + 1;
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(h - 1, y + r);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w - 1, x + r);
      const sum = I[(y1 + 1) * W + x1 + 1] - I[y0 * W + x1 + 1] -
        I[(y1 + 1) * W + x0] + I[y0 * W + x0];
      const n = (x1 - x0 + 1) * (y1 - y0 + 1);
      out[y * w + x] = g[y * w + x] < sum / n - c ? 1 : 0;
    }
  }
  return out;
}

// 8-connected components with bounding boxes and extreme corner points
export function components(bin, w, h) {
  const labels = new Int32Array(w * h);
  const stack = new Int32Array(w * h);
  const comps = [];
  for (let p0 = 0; p0 < bin.length; p0++) {
    if (!bin[p0] || labels[p0]) continue;
    const id = comps.length + 1;
    const c = {
      id, count: 0, minX: w, minY: h, maxX: 0, maxY: 0,
      sMin: Infinity, sMax: -Infinity, dMin: Infinity, dMax: -Infinity,
      tl: null, br: null, bl: null, tr: null,
    };
    let sp = 0;
    stack[sp++] = p0;
    labels[p0] = id;
    while (sp) {
      const p = stack[--sp];
      const x = p % w;
      const y = (p - x) / w;
      c.count++;
      if (x < c.minX) c.minX = x;
      if (x > c.maxX) c.maxX = x;
      if (y < c.minY) c.minY = y;
      if (y > c.maxY) c.maxY = y;
      const s = x + y;
      const d = x - y;
      if (s < c.sMin) { c.sMin = s; c.tl = [x, y]; }
      if (s > c.sMax) { c.sMax = s; c.br = [x, y]; }
      if (d < c.dMin) { c.dMin = d; c.bl = [x, y]; }
      if (d > c.dMax) { c.dMax = d; c.tr = [x, y]; }
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          const q = yy * w + xx;
          if (bin[q] && !labels[q]) {
            labels[q] = id;
            stack[sp++] = q;
          }
        }
      }
    }
    c.w = c.maxX - c.minX + 1;
    c.h = c.maxY - c.minY + 1;
    comps.push(c);
  }
  return { labels, comps };
}

function quadArea(q) {
  let a = 0;
  for (let i = 0; i < 4; i++) {
    const [x1, y1] = q[i];
    const [x2, y2] = q[(i + 1) % 4];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

// Deterministic PRNG so scans are repeatable
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Robust line fit (RANSAC + least squares). pts: [[a, b]] where the line is
// b = m * a + k (a is the scan axis). Returns {m, k} or null.
function fitLine(pts, tol) {
  if (pts.length < 10) return null;
  const rand = rng(pts.length);
  let best = null;
  let bestN = 0;
  for (let it = 0; it < 150; it++) {
    const p = pts[(rand() * pts.length) | 0];
    const q = pts[(rand() * pts.length) | 0];
    if (Math.abs(q[0] - p[0]) < pts.length * 0.1) continue;
    const m = (q[1] - p[1]) / (q[0] - p[0]);
    const k = p[1] - m * p[0];
    let n = 0;
    for (const [a, b] of pts) if (Math.abs(m * a + k - b) < tol) n++;
    if (n > bestN) { bestN = n; best = { m, k }; }
  }
  if (!best || bestN < pts.length * 0.3) return null;
  // least squares on inliers
  let sa = 0; let sb = 0; let saa = 0; let sab = 0; let n = 0;
  for (const [a, b] of pts) {
    if (Math.abs(best.m * a + best.k - b) >= tol) continue;
    sa += a; sb += b; saa += a * a; sab += a * b; n++;
  }
  const den = n * saa - sa * sa;
  if (!den) return best;
  const m = (n * sab - sa * sb) / den;
  return { m, k: (sb - m * sa) / n };
}

// Fit the 4 outer border lines of a component and intersect them
function borderQuad(labels, w, c) {
  const left = []; const right = []; const top = []; const bottom = [];
  for (let y = c.minY; y <= c.maxY; y++) {
    let lo = -1; let hi = -1;
    for (let x = c.minX; x <= c.maxX; x++) {
      if (labels[y * w + x] === c.id) { if (lo < 0) lo = x; hi = x; }
    }
    if (lo >= 0) { left.push([y, lo]); right.push([y, hi]); }
  }
  for (let x = c.minX; x <= c.maxX; x++) {
    let lo = -1; let hi = -1;
    for (let y = c.minY; y <= c.maxY; y++) {
      if (labels[y * w + x] === c.id) { if (lo < 0) lo = y; hi = y; }
    }
    if (lo >= 0) { top.push([x, lo]); bottom.push([x, hi]); }
  }
  const tol = Math.max(2, Math.min(c.w, c.h) / 150);
  const L = fitLine(left, tol); const R = fitLine(right, tol);
  const T = fitLine(top, tol); const B = fitLine(bottom, tol);
  if (!L || !R || !T || !B) return null;
  // vertical lines: x = m*y + k ; horizontal lines: y = m*x + k
  const meet = (V, H) => {
    const y = (H.m * V.k + H.k) / (1 - H.m * V.m);
    return [V.m * y + V.k, y];
  };
  return [meet(L, T), meet(R, T), meet(R, B), meet(L, B)];
}

function project(H, u, v) {
  const [a, b, c, d, e, f, g, hh] = H;
  const den = g * u + hh * v + 1;
  return [(a * u + b * v + c) / den, (d * u + e * v + f) / den];
}

// How much does the quad look like a sudoku grid? Compares ink on the
// expected box lines vs ink half way between lines.
function gridScore(bin, w, h, quad) {
  const H = homography(quad, 1);
  const N = 60;
  const ink = (u, v) => {
    const [x, y] = project(H, u, v);
    const xi = Math.round(x); const yi = Math.round(y);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const xx = xi + dx; const yy = yi + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h && bin[yy * w + xx]) return 1;
      }
    }
    return 0;
  };
  const line = (k) => {
    let s = 0;
    for (let i = 0; i < N; i++) {
      const t = (i + 0.5) / N;
      s += ink(k / 9, t) + ink(t, k / 9);
    }
    return s / (2 * N);
  };
  const on = [0, 3, 6, 9].map(line);
  const inner = [1, 2, 4, 5, 7, 8].map(line);
  const off = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5].map(line);
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  // Box lines must be solid; thin lines count for a bit
  return mean(on) * 0.75 + mean(inner) * 0.25 - mean(off);
}

// Nudge corners to maximise ink on the expected grid lines
function refineQuad(bin, w, h, quad) {
  const N = 80;
  const score = (q) => {
    const H = homography(q, 1);
    let s = 0;
    for (let k = 0; k <= 9; k++) {
      const wt = k % 3 === 0 ? 2 : 1;
      for (let i = 0; i < N; i++) {
        const t = (i + 0.5) / N;
        for (const [u, v] of [[k / 9, t], [t, k / 9]]) {
          const [x, y] = project(H, u, v);
          const xi = Math.round(x); const yi = Math.round(y);
          if (xi >= 0 && yi >= 0 && xi < w && yi < h && bin[yi * w + xi]) s += wt;
        }
      }
    }
    return s;
  };
  let q = quad.map(p => p.slice());
  let best = score(q);
  const side = Math.sqrt(Math.abs(quadArea(q)));
  for (let step = Math.max(1, side / 60); step >= 0.75; step /= 2) {
    let improved = true;
    let guard = 0;
    while (improved && guard++ < 20) {
      improved = false;
      for (let c = 0; c < 4; c++) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
          const t = q.map(p => p.slice());
          t[c][0] += dx * step; t[c][1] += dy * step;
          const s = score(t);
          if (s > best) { best = s; q = t; improved = true; }
        }
      }
    }
  }
  return q;
}

function sane(quad, w, h) {
  if (!quad || quad.some(p => !isFinite(p[0]) || !isFinite(p[1]))) return false;
  if (quad.some(([x, y]) => x < -0.1 * w || y < -0.1 * h || x > 1.1 * w || y > 1.1 * h)) return false;
  return quadArea(quad) > 0.03 * w * h;
}

// Returns [tl, tr, br, bl] corners of the grid, or null
export function findGrid(gray, w, h) {
  const r = Math.max(4, Math.round(Math.min(w, h) / 40));
  const minSide = Math.min(w, h) * 0.2;
  let best = null;
  for (const invert of [false, true]) {
    let g = gray;
    if (invert) {
      g = new Uint8Array(gray.length);
      for (let i = 0; i < g.length; i++) g[i] = 255 - gray[i];
    }
    const bin = adaptiveThreshold(g, w, h, r, 7);
    const { labels, comps } = components(bin, w, h);
    const cands = comps
      .filter(c => c.w >= minSide && c.h >= minSide && c.w / c.h > 0.4 && c.w / c.h < 2.5 &&
        c.count / (c.w * c.h) < 0.5)
      .sort((a, b) => b.w * b.h - a.w * a.h)
      .slice(0, 4);
    for (const c of cands) {
      const quads = [[c.tl, c.tr, c.br, c.bl], borderQuad(labels, w, c)];
      for (const q of quads) {
        if (!sane(q, w, h)) continue;
        const grid = gridScore(bin, w, h, q);
        // Small bonus for size so a whole grid beats one of its 3x3 boxes
        const score = grid + 0.15 * Math.sqrt(quadArea(q) / (w * h));
        if (grid > 0.2 && (!best || score > best.score)) best = { quad: q, score, bin };
      }
    }
    if (best && best.score > 0.4) break;
  }
  return best ? refineQuad(best.bin, w, h, best.quad) : null;
}

// Solve 8x8 system for homography mapping unit square (scaled by size) -> quad
function homography(quad, size) {
  const src = [[0, 0], [size, 0], [size, size], [0, size]];
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const [u, v] = src[i];
    const [x, y] = quad[i];
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]); b.push(x);
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y]); b.push(y);
  }
  // Gaussian elimination with partial pivoting
  for (let col = 0; col < 8; col++) {
    let piv = col;
    for (let r = col + 1; r < 8; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    }
    [A[col], A[piv]] = [A[piv], A[col]];
    [b[col], b[piv]] = [b[piv], b[col]];
    for (let r = 0; r < 8; r++) {
      if (r === col) continue;
      const f = A[r][col] / A[col][col];
      for (let k = col; k < 8; k++) A[r][k] -= f * A[col][k];
      b[r] -= f * b[col];
    }
  }
  return b.map((v, i) => v / A[i][i]);
}

// Straighten the quad into a SIZE x SIZE greyscale image
export function warp(gray, w, h, quad, size = SIZE) {
  const [a, b, c, d, e, f, g, hh] = homography(quad, size);
  const out = new Uint8Array(size * size);
  for (let v = 0; v < size; v++) {
    for (let u = 0; u < size; u++) {
      const uu = u + 0.5;
      const vv = v + 0.5;
      const den = g * uu + hh * vv + 1;
      let x = (a * uu + b * vv + c) / den - 0.5;
      let y = (d * uu + e * vv + f) / den - 0.5;
      x = Math.min(Math.max(x, 0), w - 1.001);
      y = Math.min(Math.max(y, 0), h - 1.001);
      const x0 = x | 0;
      const y0 = y | 0;
      const fx = x - x0;
      const fy = y - y0;
      const p = y0 * w + x0;
      const top = gray[p] * (1 - fx) + gray[p + 1] * fx;
      const bot = gray[p + w] * (1 - fx) + gray[p + w + 1] * fx;
      out[v * size + u] = top * (1 - fy) + bot * fy;
    }
  }
  return out;
}

// Scale the ink inside bbox into a NET_SIZE x NET_SIZE float vector
function normalise(bin, w, box) {
  const vec = new Float32Array(NET_SIZE * NET_SIZE);
  const scale = FIT / Math.max(box.w, box.h);
  const ow = box.w * scale;
  const oh = box.h * scale;
  const ox = (NET_SIZE - ow) / 2;
  const oy = (NET_SIZE - oh) / 2;
  const SS = 4; // supersampling
  for (let y = 0; y < NET_SIZE; y++) {
    for (let x = 0; x < NET_SIZE; x++) {
      let sum = 0;
      for (let sy = 0; sy < SS; sy++) {
        const py = y + (sy + 0.5) / SS - oy;
        if (py < 0 || py >= oh) continue;
        const by = box.minY + Math.floor(py / scale);
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS - ox;
          if (px < 0 || px >= ow) continue;
          const bx = box.minX + Math.floor(px / scale);
          sum += bin[by * w + bx];
        }
      }
      vec[y * NET_SIZE + x] = sum / (SS * SS);
    }
  }
  return vec;
}

// Find the digit in each cell of the straightened grid.
// Returns 81 entries: null for empty cells, otherwise a feature vector.
export function extractCells(warped) {
  const bin = adaptiveThreshold(warped, SIZE, SIZE, Math.round(CELL / 3), 8);
  const m = Math.round(CELL * 0.08);
  const cs = CELL - 2 * m;
  const sub = new Uint8Array(cs * cs);
  const cells = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const x0 = c * CELL + m;
      const y0 = r * CELL + m;
      for (let y = 0; y < cs; y++) {
        for (let x = 0; x < cs; x++) {
          sub[y * cs + x] = bin[(y0 + y) * SIZE + x0 + x];
        }
      }
      // Wipe grid line remnants: near-full rows/columns in the outer band
      const band = Math.round(cs * 0.22);
      for (let y = 0; y < cs; y++) {
        if (y >= band && y < cs - band) continue;
        let n = 0;
        for (let x = 0; x < cs; x++) n += sub[y * cs + x];
        if (n > 0.6 * cs) for (let x = 0; x < cs; x++) sub[y * cs + x] = 0;
      }
      for (let x = 0; x < cs; x++) {
        if (x >= band && x < cs - band) continue;
        let n = 0;
        for (let y = 0; y < cs; y++) n += sub[y * cs + x];
        if (n > 0.6 * cs) for (let y = 0; y < cs; y++) sub[y * cs + x] = 0;
      }
      const { comps } = components(sub, cs, cs);
      const mid = cs / 2;
      let best = null;
      for (const k of comps) {
        if (k.h < 0.28 * CELL || k.w > 0.9 * cs || k.count < 20) continue;
        const cx = (k.minX + k.maxX) / 2;
        const cy = (k.minY + k.maxY) / 2;
        if (Math.abs(cx - mid) > 0.25 * CELL || Math.abs(cy - mid) > 0.25 * CELL) continue;
        if (k.count / (k.w * k.h) > 0.95) continue; // solid block
        if (!best || k.count > best.count) best = k;
      }
      if (!best) { cells.push(null); continue; }
      // Merge nearby fragments (broken strokes)
      const box = { minX: best.minX, minY: best.minY, maxX: best.maxX, maxY: best.maxY };
      for (const k of comps) {
        if (k === best || k.count < 4) continue;
        if (k.maxX < best.minX - 2 || k.minX > best.maxX + 2) continue;
        if (k.maxY < best.minY - 3 || k.minY > best.maxY + 3) continue;
        const nb = {
          minX: Math.min(box.minX, k.minX), minY: Math.min(box.minY, k.minY),
          maxX: Math.max(box.maxX, k.maxX), maxY: Math.max(box.maxY, k.maxY),
        };
        if (nb.maxX - nb.minX > 0.9 * cs || nb.maxY - nb.minY > 0.95 * cs) continue;
        Object.assign(box, nb);
      }
      box.w = box.maxX - box.minX + 1;
      box.h = box.maxY - box.minY + 1;
      // Keep only the chosen pixels so line stubs inside bbox don't leak in
      const keep = new Uint8Array(cs * cs);
      for (let y = box.minY; y <= box.maxY; y++) {
        for (let x = box.minX; x <= box.maxX; x++) keep[y * cs + x] = sub[y * cs + x];
      }
      cells.push(normalise(keep, cs, box));
    }
  }
  return cells;
}

// ---- classifier ----
let net = null;
function decode(b64) {
  const s = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  const a = new Int8Array(s.length);
  for (let i = 0; i < s.length; i++) a[i] = (s.charCodeAt(i) << 24) >> 24;
  return a;
}
function loadNet() {
  if (net) return net;
  const layers = MODEL.layers.map(L => {
    const q = decode(L.w);
    const w = new Float32Array(q.length);
    for (let i = 0; i < q.length; i++) w[i] = q[i] * L.scale;
    return { w, b: Float32Array.from(L.b), inp: L.inp, out: L.out };
  });
  net = { layers, mean: MODEL.mean };
  return net;
}

// Returns probabilities for digits 1..9 (index 0 => digit 1), plus index 9
// for "not a digit"
export function classify(vec) {
  const { layers } = loadNet();
  let x = vec;
  layers.forEach((L, li) => {
    const y = new Float32Array(L.out);
    for (let o = 0; o < L.out; o++) {
      let s = L.b[o];
      const row = o * L.inp;
      for (let i = 0; i < L.inp; i++) s += L.w[row + i] * x[i];
      y[o] = li < layers.length - 1 ? Math.max(0, s) : s;
    }
    x = y;
  });
  const max = Math.max(...x);
  const e = Array.from(x, v => Math.exp(v - max));
  const sum = e.reduce((a, b) => a + b, 0);
  return e.map(v => v / sum);
}

const peers = (() => {
  const P = [];
  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    const s = new Set();
    for (let j = 0; j < 81; j++) {
      if (j === i) continue;
      const r2 = Math.floor(j / 9);
      const c2 = j % 9;
      const b2 = Math.floor(r2 / 3) * 3 + Math.floor(c2 / 3);
      if (r2 === r || c2 === c || b2 === b) s.add(j);
    }
    P.push([...s]);
  }
  return P;
})();
export { peers };

// Pick digits so no row/col/box has duplicates, most confident cells first.
export function resolve(probs) {
  const grid = new Array(81).fill(0);
  const order = probs
    .map((p, i) => (p ? { i, p, conf: Math.max(...p) } : null))
    .filter(Boolean)
    .sort((a, b) => b.conf - a.conf);
  for (const { i, p } of order) {
    const used = new Set(peers[i].map(j => grid[j]));
    const ranked = p.map((v, k) => [v, k + 1]).sort((a, b) => b[0] - a[0]);
    const pick = ranked.find(([v, d]) => !used.has(d) && v > 0.02);
    grid[i] = pick ? pick[1] : ranked[0][1];
  }
  return grid;
}

export function conflicts(grid) {
  const bad = new Set();
  for (let i = 0; i < 81; i++) {
    if (!grid[i]) continue;
    for (const j of peers[i]) if (grid[j] === grid[i]) bad.add(i);
  }
  return bad;
}

// Full pipeline. quad can be passed in to skip detection (manual corners).
export function scan(gray, w, h, quad) {
  quad = quad || findGrid(gray, w, h);
  if (!quad) return { quad: null };
  const warped = warp(gray, w, h, quad);
  const vecs = extractCells(warped);
  const probs = vecs.map((v) => {
    if (!v) return null;
    const p = classify(v);
    if (p.length === 10) { // last class = "not a digit" (noise, pencil marks)
      if (p[9] > 0.5) return null;
      const s = 1 - p[9];
      return p.slice(0, 9).map(x => x / s);
    }
    return p;
  });
  const grid = resolve(probs);
  const confidence = probs.map((p, i) => (p ? p[grid[i] - 1] : 1));
  return { quad, warped, vecs, probs, grid, confidence };
}
