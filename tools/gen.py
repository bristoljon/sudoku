"""Generate synthetic photos of sudoku puzzles for training / testing the scanner.

usage: python3 tools/gen.py OUTDIR COUNT [--fonts train|test|all] [--seed N]
Writes OUTDIR/NNNN.jpg and OUTDIR/NNNN.json ({"grid": [81 ints], "corners": [[x,y]x4]})
"""
import argparse, json, os, random
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(__file__)
HOLDOUT = ('texgyreheros-regular', 'Lora', 'Carlito-Bold', 'Poppins-Medium', 'DejaVuSerifCondensed.ttf')


def font_list(which):
    fonts = []
    for line in open(os.path.join(HERE, 'fonts.txt')):
        p = line.strip()
        b = os.path.basename(p)
        if not p.endswith(('.ttf', '.otf')) or 'unifont' in b or 'slant' in b or 'japanese' in b:
            continue
        held = any(h in b for h in HOLDOUT)
        if which == 'train' and held:
            continue
        if which == 'test' and not held:
            continue
        fonts.append(p)
    return fonts


def solved_grid(rng):
    base = 3
    def pattern(r, c): return (base * (r % base) + r // base + c) % 9
    rows = [g * base + r for g in rng.sample(range(base), base) for r in rng.sample(range(base), base)]
    cols = [g * base + c for g in rng.sample(range(base), base) for c in rng.sample(range(base), base)]
    nums = rng.sample(range(1, 10), 9)
    return [nums[pattern(r, c)] for r in rows for c in cols]


def puzzle(rng):
    g = solved_grid(rng)
    keep = rng.randint(22, 40)
    idx = set(rng.sample(range(81), keep))
    return [g[i] if i in idx else 0 for i in range(81)]


def render_grid(rng, digits, fonts):
    cell = rng.randint(26, 80)
    thin = max(1, round(cell * rng.uniform(0.01, 0.045)))
    thick = thin + rng.randint(1, max(2, cell // 18))
    outer = thick + rng.randint(0, 3)
    size = cell * 9
    pad = outer
    W = size + 2 * pad
    paper = rng.randint(200, 255)
    tint = np.array([paper, paper - rng.randint(0, 15), paper - rng.randint(0, 30)]).clip(0, 255)
    img = Image.new('RGB', (W, W), tuple(int(v) for v in tint))
    d = ImageDraw.Draw(img)
    if rng.random() < 0.25:  # shaded alternate boxes
        shade = tuple(int(v) - rng.randint(15, 45) for v in tint)
        for br in range(3):
            for bc in range(3):
                if (br + bc) % 2:
                    d.rectangle([pad + bc * 3 * cell, pad + br * 3 * cell,
                                 pad + (bc + 1) * 3 * cell, pad + (br + 1) * 3 * cell], fill=shade)
    ink = rng.randint(0, 70)
    line_col = (ink, ink, ink + rng.randint(0, 40))
    thin_col = line_col if rng.random() < 0.6 else tuple([rng.randint(110, 190)] * 3)
    for i in range(10):
        t = outer if i in (0, 9) else thick if i % 3 == 0 else thin
        col = line_col if i % 3 == 0 else thin_col
        p = pad + i * cell
        d.rectangle([p - t // 2, pad - outer // 2, p - t // 2 + t - 1, pad + size + outer // 2], fill=col)
        d.rectangle([pad - outer // 2, p - t // 2, pad + size + outer // 2, p - t // 2 + t - 1], fill=col)
    fpath = rng.choice(fonts)
    ratio = rng.uniform(0.5, 0.85)
    font = ImageFont.truetype(fpath, int(cell * ratio))
    dcol = rng.choice([(ink, ink, ink), (10, 10, 10), (20, 30, 120), (60, 60, 60)])
    stroke = 1 if rng.random() < 0.15 and cell > 40 else 0
    for i, v in enumerate(digits):
        if not v:
            continue
        r, c = divmod(i, 9)
        cx = pad + c * cell + cell / 2 + rng.uniform(-0.05, 0.05) * cell
        cy = pad + r * cell + cell / 2 + rng.uniform(-0.05, 0.05) * cell
        d.text((cx, cy), str(v), font=font, fill=dcol, anchor='mm', stroke_width=stroke, stroke_fill=dcol)
    # pencil marks / small candidates in some empty cells
    if rng.random() < 0.15:
        small = ImageFont.truetype(fpath, max(6, int(cell * 0.22)))
        for i, v in enumerate(digits):
            if v or rng.random() > 0.3:
                continue
            r, c = divmod(i, 9)
            for k in rng.sample(range(1, 10), rng.randint(1, 3)):
                kr, kc = divmod(k - 1, 3)
                d.text((pad + c * cell + (kc + 0.5) * cell / 3, pad + r * cell + (kr + 0.5) * cell / 3),
                       str(k), font=small, fill=(120, 120, 120), anchor='mm')
    corners = [[pad - outer / 2, pad - outer / 2], [pad + size + outer / 2, pad - outer / 2],
               [pad + size + outer / 2, pad + size + outer / 2], [pad - outer / 2, pad + size + outer / 2]]
    return np.array(img), corners, os.path.basename(fpath)


def scene(rng, grid_img, corners):
    gh = grid_img.shape[0]
    S = int(gh * rng.uniform(1.15, 1.7))
    paper = rng.randint(170, 250)
    canvas = np.full((S, S, 3), paper, np.uint8)
    canvas = (canvas.astype(np.int16) + rng.randint(-15, 15)).clip(0, 255).astype(np.uint8)
    # clutter text
    pil = Image.fromarray(canvas)
    d = ImageDraw.Draw(pil)
    for _ in range(rng.randint(0, 25)):
        x, y = rng.randint(0, S), rng.randint(0, S)
        s = ''.join(rng.choice('abcdefghijklmnopqrstuvwxyz0123456789 ') for _ in range(rng.randint(3, 20)))
        d.text((x, y), s, fill=(rng.randint(0, 90),) * 3)
    canvas = np.array(pil)
    ox = rng.randint(0, S - gh)
    oy = rng.randint(0, S - gh)
    canvas[oy:oy + gh, ox:ox + gh] = grid_img
    pts = np.float32([[x + ox, y + oy] for x, y in corners])
    # random perspective
    j = rng.uniform(0, 0.12) * S
    src = np.float32([[0, 0], [S, 0], [S, S], [0, S]])
    dst = src + np.float32([[rng.uniform(-j, j), rng.uniform(-j, j)] for _ in range(4)])
    ang = np.deg2rad(rng.uniform(-14, 14))
    R = np.array([[np.cos(ang), -np.sin(ang)], [np.sin(ang), np.cos(ang)]])
    dst = (dst - S / 2) @ R.T + S / 2
    dst -= dst.min(axis=0)
    out_w, out_h = int(dst[:, 0].max()), int(dst[:, 1].max())
    H = cv2.getPerspectiveTransform(src, np.float32(dst))
    bg = tuple(int(v) for v in np.random.randint(20, 120, 3))
    img = cv2.warpPerspective(canvas, H, (out_w, out_h), borderValue=bg)
    pts = cv2.perspectiveTransform(pts[None], H)[0]
    # lighting
    yy, xx = np.mgrid[0:out_h, 0:out_w].astype(np.float32)
    gx, gy = rng.uniform(-1, 1), rng.uniform(-1, 1)
    grad = 1 - rng.uniform(0, 0.45) * ((xx / out_w - 0.5) * gx + (yy / out_h - 0.5) * gy + 0.5)
    if rng.random() < 0.3:  # shadow blob
        cx, cy, rad = rng.uniform(0, out_w), rng.uniform(0, out_h), rng.uniform(0.2, 0.6) * out_w
        grad *= 1 - 0.35 * np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * rad ** 2))
    img = (img.astype(np.float32) * grad[..., None])
    sigma = rng.uniform(0, 1.6)
    if sigma > 0.3:
        img = cv2.GaussianBlur(img, (0, 0), sigma)
    img += np.random.normal(0, rng.uniform(0, 9), img.shape)
    img = img.clip(0, 255).astype(np.uint8)
    # resize to typical phone-ish size
    long = rng.randint(700, 1600)
    s = long / max(out_w, out_h)
    img = cv2.resize(img, (int(out_w * s), int(out_h * s)), interpolation=cv2.INTER_AREA)
    pts *= s
    return img, pts.tolist()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('count', type=int)
    ap.add_argument('--fonts', default='train')
    ap.add_argument('--seed', type=int, default=1)
    a = ap.parse_args()
    rng = random.Random(a.seed)
    np.random.seed(a.seed)
    fonts = font_list(a.fonts)
    os.makedirs(a.out, exist_ok=True)
    for n in range(a.count):
        digits = puzzle(rng)
        g, corners, fname = render_grid(rng, digits, fonts)
        img, pts = scene(rng, g, corners)
        cv2.imwrite(os.path.join(a.out, f'{n:04d}.jpg'), img[:, :, ::-1],
                    [cv2.IMWRITE_JPEG_QUALITY, rng.randint(35, 95)])
        json.dump({'grid': digits, 'corners': pts, 'font': fname},
                  open(os.path.join(a.out, f'{n:04d}.json'), 'w'))


if __name__ == '__main__':
    main()
