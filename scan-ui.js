// Scan-to-import UI: pick / take a photo, detect the grid, let the user check
// and fix the digits (or drag the corners) before importing.
import { rgbaToGray, scan, conflicts, SIZE, CELL } from './scan.js';
import { toast } from './toast.js';

const MAX_SIDE = 1200; // photos are scaled down to this before processing

export function initScanner({ onImport }) {
  const $ = id => document.getElementById(id);
  const sheet = $('scanner');
  const camera = $('scanCamera');
  const gallery = $('scanFile');
  const menu = $('scanMenu');
  const scanBtn = $('scanBtn');
  const canvas = $('scanCanvas');
  const ctx = canvas.getContext('2d');
  const busy = $('scanBusy');
  const hint = $('scanHint');
  const pad = $('scanPad');
  const btnImport = $('scanImport');
  const btnAdjust = $('scanAdjust');
  const btnRetake = $('scanRetake');

  let photo = null; // { canvas, gray, w, h }
  let result = null; // scan() output
  let grid = null; // editable 81 digits
  let sure = null; // per-cell: true when confident / user-edited
  let selected = -1;
  let mode = 'review'; // or 'corners'
  let quad = null; // corners being edited
  let drag = -1;
  let warpedImg = null; // canvas holding the straightened photo

  // On phones / tablets offer the camera or the photo library (Android's
  // picker for a plain file input doesn't include the camera). Elsewhere
  // there's no camera to take one with, so go straight to picking a file.
  const canTakePhoto = matchMedia('(pointer: coarse)').matches;
  let source = gallery; // what Retake reopens

  function pick(input) {
    source = input;
    showMenu(false);
    input.click();
  }

  function showMenu(show) {
    menu.hidden = !show;
    scanBtn.setAttribute('aria-expanded', show);
    if (show) $('scanTake').focus();
  }

  scanBtn.addEventListener('click', () => {
    if (!canTakePhoto) pick(gallery);
    else showMenu(menu.hidden);
  });
  $('scanTake').addEventListener('click', () => pick(camera));
  $('scanChoose').addEventListener('click', () => pick(gallery));
  document.addEventListener('click', (e) => {
    if (!menu.hidden && !e.target.closest('.scan-wrap')) showMenu(false);
  });
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      showMenu(false);
      scanBtn.focus();
    }
  });
  btnRetake.addEventListener('click', () => source.click());
  $('scanClose').addEventListener('click', close);
  sheet.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (mode !== 'review' || selected < 0) return;
    if (/^[1-9]$/.test(e.key)) setDigit(Number(e.key));
    else if (['Backspace', 'Delete', '0', ' '].includes(e.key)) setDigit(0);
    else if (e.key.startsWith('Arrow')) {
      const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -9, ArrowDown: 9 }[e.key];
      selected = (selected + d + 81) % 81;
      draw();
    } else return;
    e.preventDefault();
  });

  const onPhoto = async (e) => {
    const input = e.currentTarget;
    const f = input.files[0];
    input.value = '';
    if (!f) return;
    open();
    setBusy(true, 'Reading puzzle…');
    try {
      photo = await loadPhoto(f);
      // let the spinner paint before the (blocking) scan
      await new Promise(r => setTimeout(r, 30));
      run(null);
    } catch (err) {
      console.error(err);
      setBusy(false);
      close();
      toast("Couldn't open that image");
    }
  };
  camera.addEventListener('change', onPhoto);
  gallery.addEventListener('change', onPhoto);

  function open() {
    sheet.hidden = false;
    document.body.classList.add('noscroll');
    sheet.focus();
  }

  function close() {
    sheet.hidden = true;
    document.body.classList.remove('noscroll');
    mode = 'review';
  }

  function setBusy(on, text) {
    busy.hidden = !on;
    if (text) busy.querySelector('span').textContent = text;
  }

  function run(manualQuad) {
    setBusy(true, 'Reading puzzle…');
    const t0 = performance.now();
    result = scan(photo.gray, photo.w, photo.h, manualQuad);
    console.log('scan took', Math.round(performance.now() - t0), 'ms');
    setBusy(false);
    if (!result.quad) {
      // No grid found: go straight to manual corners with a default box
      const m = 0.15;
      quad = [[photo.w * m, photo.h * m], [photo.w * (1 - m), photo.h * m],
        [photo.w * (1 - m), photo.h * (1 - m)], [photo.w * m, photo.h * (1 - m)]];
      setMode('corners');
      hint.textContent = "Couldn't find the grid - drag the corners onto the puzzle's corners.";
      return;
    }
    grid = result.grid.slice();
    sure = result.confidence.map(c => c > 0.9);
    warpedImg = grayCanvas(result.warped, SIZE, SIZE);
    selected = -1;
    setMode('review');
  }

  function setMode(m) {
    mode = m;
    sheet.dataset.mode = m;
    if (m === 'review') {
      const unsure = sure.filter((s, i) => grid[i] && !s).length;
      hint.textContent = unsure
        ? `Found ${grid.filter(Boolean).length} digits. Check the ${unsure} highlighted in orange - tap a cell to fix it.`
        : `Found ${grid.filter(Boolean).length} digits. Tap a cell to fix any mistakes.`;
      btnAdjust.textContent = 'Adjust corners';
      btnImport.textContent = 'Import';
    } else {
      if (!quad) quad = result.quad.map(p => p.slice());
      hint.textContent = 'Drag the four handles onto the outer corners of the grid.';
      btnAdjust.textContent = 'Cancel';
      btnImport.textContent = 'Apply';
    }
    resize();
  }

  btnAdjust.addEventListener('click', () => {
    if (mode === 'review') {
      quad = result.quad.map(p => p.slice());
      setMode('corners');
    } else if (result && result.quad) {
      quad = null;
      setMode('review');
    } else {
      close();
    }
  });

  btnImport.addEventListener('click', () => {
    if (mode === 'corners') {
      const q = quad;
      quad = null;
      run(q);
      return;
    }
    const bad = conflicts(grid);
    if (bad.size) {
      toast('Some digits clash (shown in red) - fix them before importing');
      return;
    }
    if (grid.filter(Boolean).length < 10) {
      toast('That looks like too few digits for a puzzle');
      return;
    }
    close();
    onImport(grid.slice());
  });

  pad.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || selected < 0) {
      if (b) toast('Tap a cell in the picture first');
      return;
    }
    setDigit(b.dataset.digit ? Number(b.dataset.digit) : 0);
  });

  function setDigit(d) {
    grid[selected] = d;
    sure[selected] = true;
    draw();
  }

  // ---- canvas drawing ----
  let view = { scale: 1, ox: 0, oy: 0, cssW: 0, cssH: 0 };

  function resize() {
    const box = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    let cssW = box.width;
    let cssH = box.width;
    if (mode === 'corners') {
      const maxH = Math.max(240, window.innerHeight * 0.55);
      cssH = Math.min(maxH, cssW * photo.h / photo.w);
      cssW = cssH * photo.w / photo.h;
      if (cssW > box.width) { cssW = box.width; cssH = cssW * photo.h / photo.w; }
    }
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    view = { cssW, cssH, dpr };
    draw();
  }
  window.addEventListener('resize', () => { if (!sheet.hidden) resize(); });

  function draw() {
    const { dpr, cssW, cssH } = view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    if (mode === 'corners') return drawCorners();
    const cw = cssW / 9;
    ctx.globalAlpha = 1;
    ctx.drawImage(warpedImg, 0, 0, cssW, cssH);
    const bad = conflicts(grid);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fs = Math.round(cw * 0.36);
    ctx.font = `700 ${fs}px system-ui, sans-serif`;
    for (let i = 0; i < 81; i++) {
      const x = (i % 9) * cw;
      const y = Math.floor(i / 9) * cw;
      if (grid[i]) {
        const color = bad.has(i) ? '#d32f2f' : sure[i] ? '#1565c0' : '#ef6c00';
        const r = cw * 0.23;
        const bx = x + cw - r - 2;
        const by = y + r + 2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(String(grid[i]), bx, by + 1);
        if (!sure[i] || bad.has(i)) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, cw - 4, cw - 4);
        }
      }
      if (i === selected) {
        ctx.strokeStyle = '#6a1b9a';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 1.5, y + 1.5, cw - 3, cw - 3);
      }
    }
  }

  function toView([x, y]) {
    return [x / photo.w * view.cssW, y / photo.h * view.cssH];
  }

  function drawCorners() {
    const { cssW, cssH } = view;
    ctx.drawImage(photo.canvas, 0, 0, cssW, cssH);
    const pts = quad.map(toView);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.rect(0, 0, cssW, cssH);
    ctx.moveTo(...pts[0]);
    for (let i = 3; i >= 0; i--) ctx.lineTo(...pts[i]);
    ctx.fill('evenodd');
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
    ctx.closePath();
    ctx.stroke();
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p[0], p[1], 13, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,230,118,0.35)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  }

  function eventPos(e) {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  canvas.addEventListener('pointerdown', (e) => {
    const [px, py] = eventPos(e);
    if (mode === 'review') {
      const cw = view.cssW / 9;
      const c = Math.floor(px / cw);
      const r = Math.floor(py / cw);
      if (c >= 0 && c < 9 && r >= 0 && r < 9) {
        selected = r * 9 + c;
        draw();
      }
      return;
    }
    let best = -1;
    let bd = 40; // touch radius in css px
    quad.map(toView).forEach(([x, y], i) => {
      const d = Math.hypot(x - px, y - py);
      if (d < bd) { bd = d; best = i; }
    });
    if (best >= 0) {
      drag = best;
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (drag < 0) return;
    const [px, py] = eventPos(e);
    quad[drag] = [
      Math.min(Math.max(px, 0), view.cssW) / view.cssW * photo.w,
      Math.min(Math.max(py, 0), view.cssH) / view.cssH * photo.h,
    ];
    draw();
  });
  const endDrag = () => { drag = -1; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
}

function grayCanvas(gray, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const img = g.createImageData(w, h);
  for (let i = 0, j = 0; i < gray.length; i++, j += 4) {
    img.data[j] = img.data[j + 1] = img.data[j + 2] = gray[i];
    img.data[j + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // faint cell guides so misalignment is obvious
  g.strokeStyle = 'rgba(106,27,154,0.35)';
  g.lineWidth = 1;
  for (let k = 1; k < 9; k++) {
    g.beginPath();
    g.moveTo(k * CELL + 0.5, 0); g.lineTo(k * CELL + 0.5, h);
    g.moveTo(0, k * CELL + 0.5); g.lineTo(w, k * CELL + 0.5);
    g.stroke();
  }
  return c;
}

// Decode (respecting EXIF rotation), scale down and convert to greyscale
async function loadPhoto(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const s = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * s);
    const h = Math.round(img.naturalHeight * s);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, w, h);
    const gray = rgbaToGray(g.getImageData(0, 0, w, h).data, w, h);
    return { canvas, gray, w, h };
  } finally {
    URL.revokeObjectURL(url);
  }
}
