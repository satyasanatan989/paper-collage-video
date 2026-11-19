"""Make the paper: torn colour sheets, torn word strips and a newsprint wall, all generated locally.

    python textures.py --out my-video                 (format and palette read from src/storyboard.json)
    python textures.py --out my-video --format 16:9

Writes <project>/public/tex/sheet_<name>.webp, strip_<name>.webp and wall.jpg.
"""
import argparse
import json
import os

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

PAL = {"cream": "#EFE6D2", "vermilion": "#D9381E", "marigold": "#F2A71B", "indigo": "#1F2F6B",
       "ink": "#1B1A17", "teal": "#167A72", "pink": "#F2A1B5"}
EDGE = np.array([244, 236, 218])

ap = argparse.ArgumentParser()
ap.add_argument("--out", required=True)
ap.add_argument("--format", default=None, help="9:16 or 16:9 (default: from storyboard.json)")
a = ap.parse_args()
sbp = os.path.join(a.out, "src", "storyboard.json")
sb = json.load(open(sbp, encoding="utf-8")) if os.path.exists(sbp) else {}
fmt = a.format or sb.get("format", "9:16")
for k, v in sb.get("palette", {}).items():
    PAL[k] = v[0] if isinstance(v, list) else v
W, H = (1080, 1920) if fmt != "16:9" else (1920, 1080)
out = os.path.join(a.out, "public", "tex")
os.makedirs(out, exist_ok=True)
hexrgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)])


def wobble(n, r, s):
    a1 = ndi.gaussian_filter1d(r.normal(size=n), s, mode="wrap")
    a2 = ndi.gaussian_filter1d(r.normal(size=n), s / 8, mode="wrap")
    return a1 / a1.std() + .35 * a2 / a2.std()


def grain(h, w, r, amp):
    fine = r.normal(size=(h, w))
    fibre = ndi.gaussian_filter(r.normal(size=(h, w)), (1, 7))
    blot = ndi.zoom(ndi.gaussian_filter(r.normal(size=(h // 16 + 2, w // 16 + 2)), 3), 16, order=1)[:h, :w]
    return amp * (.35 * fine + .45 * fibre / fibre.std() + .6 * blot / blot.std())


def torn(w, h, col, seed, edge, wob):
    r = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:h, 0:w]

    def mask(inset, sc):
        m = 14 + inset + wob
        return ((yy > m + wob * sc * wobble(w, r, 40)[xx]) & (yy < h - m + wob * sc * wobble(w, r, 40)[xx]) &
                (xx > m + wob * sc * wobble(h, r, 40)[yy]) & (xx < w - m + wob * sc * wobble(h, r, 40)[yy]))
    paper, face = mask(0, 1), mask(edge, .8)
    g = grain(h, w, r, 7)[..., None]
    rgb = np.where(face[..., None], col + g, EDGE + g * .6).clip(0, 255).astype(np.uint8)
    return Image.fromarray(np.dstack([rgb, paper.astype(np.uint8) * 255]), "RGBA")


for i, (name, hx) in enumerate(PAL.items()):
    torn(W + 160, H + 160, hexrgb(hx), 100 + i, 18, 10).save(f"{out}/sheet_{name}.webp", quality=86)
    torn(900, 250, hexrgb(hx), 200 + i, 10, 5).save(f"{out}/strip_{name}.webp", quality=90)

# newsprint wall: greeked columns (grey bars, never readable words)
r = np.random.default_rng(7)
S = 1400
im = Image.new("RGB", (S, S), (226, 216, 194))
d = ImageDraw.Draw(im)
for cx in range(30, S - 200, 225):
    y = 30
    while y < S - 30:
        if r.random() < .09:
            d.rectangle([cx, y, cx + 195, y + 34], fill=(92, 86, 76))
            y += 58
            continue
        d.rectangle([cx, y, cx + int(r.integers(150, 196)), y + 5], fill=(142, 134, 120))
        y += 15
arr = np.asarray(im).astype(float) + grain(S, S, r, 6)[..., None]
Image.fromarray(arr.clip(0, 255).astype(np.uint8)).save(f"{out}/wall.jpg", quality=86)
print(f"textures for {fmt}: {', '.join(PAL)} -> {out}")
