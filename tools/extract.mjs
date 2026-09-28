// Run the scanner pipeline over generated images.
// usage: node tools/extract.mjs DIR [OUT_PREFIX]
//   Prints detection/segmentation/classification stats. If OUT_PREFIX is
//   given, writes OUT_PREFIX.x.f32 / OUT_PREFIX.y.u8 training data.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { findGrid, warp, extractCells, scan } from '../scan.js';

const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); } catch (e) {
  sharp = require(path.join(process.env.HOME, '.npm-global/lib/node_modules/sharp'));
}

export async function loadGray(file, max = 1200) {
  const img = sharp(file).rotate();
  const meta = await img.metadata();
  const s = Math.min(1, max / Math.max(meta.width, meta.height));
  const { data, info } = await img
    .resize(Math.round(meta.width * s), Math.round(meta.height * s))
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const g = new Uint8Array(info.width * info.height);
  for (let i = 0, j = 0; i < g.length; i++, j += info.channels) {
    g[i] = (data[j] * 77 + data[j + 1] * 150 + data[j + 2] * 29) >> 8;
  }
  return { g, w: info.width, h: info.height, s };
}

async function main() {
  const [dir, out] = process.argv.slice(2);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).sort();
  const X = [];
  const Y = [];
  const st = { imgs: 0, found: 0, good: 0, miss: 0, extra: 0, digits: 0, right: 0, resolved: 0, perfect: 0 };
  const fails = [];
  for (const f of files) {
    const truth = JSON.parse(fs.readFileSync(path.join(dir, f.replace('.jpg', '.json'))));
    const { g, w, h, s } = await loadGray(path.join(dir, f));
    st.imgs++;
    const quad = findGrid(g, w, h);
    if (!quad) { fails.push(f + ' nogrid'); continue; }
    st.found++;
    const tc = truth.corners.map(([x, y]) => [x * s, y * s]);
    const side = Math.hypot(tc[1][0] - tc[0][0], tc[1][1] - tc[0][1]);
    const err = Math.max(...quad.map((p, i) => Math.hypot(p[0] - tc[i][0], p[1] - tc[i][1])));
    if (err > side * 0.03) fails.push(`${f} corners off ${(err / side * 100).toFixed(1)}%`);
    if (err > side * 0.2) continue;
    st.good++;
    const warped = warp(g, w, h, quad);
    const vecs = extractCells(warped);
    vecs.forEach((v, i) => {
      const t = truth.grid[i];
      if (v && !t) { X.push(v); Y.push(9); }
      if (v && t) { X.push(v); Y.push(t - 1); }
    });
    const res = scan(g, w, h, quad);
    const bad = [];
    res.grid.forEach((d, i) => {
      const t = truth.grid[i];
      if (t) st.digits++;
      if (!d && t) st.miss++;
      else if (d && !t) st.extra++;
      else if (d && d === t) st.right++;
      if (d !== t) bad.push(`r${Math.floor(i / 9)}c${i % 9}:${t}->${d}`);
    });
    if (!bad.length) st.perfect++;
    else fails.push(`${f} ${truth.font} ${bad.join(' ')}`);
  }
  console.log(st);
  console.log(`grid found ${st.good}/${st.imgs}, digits right ${(st.right / st.digits * 100).toFixed(2)}%,` +
    ` missed ${st.miss}, extra ${st.extra}, perfect puzzles ${st.perfect}/${st.imgs}`);
  if (process.env.VERBOSE) console.log(fails.join('\n'));
  if (out) {
    const x = new Float32Array(X.length * X[0].length);
    X.forEach((v, i) => x.set(v, i * v.length));
    fs.writeFileSync(out + '.x.f32', Buffer.from(x.buffer));
    fs.writeFileSync(out + '.y.u8', Buffer.from(Uint8Array.from(Y)));
  }
}
if (process.argv[1] === new URL(import.meta.url).pathname) main();
