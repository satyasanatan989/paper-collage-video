"""Turn photos or video frames into paper stickers (person/object cut out with a cream scissor margin)
or torn photo scraps (rectangle with a torn paper edge). Runs locally; no API key.

    python cutout.py cutouts.json --out my-video

cutouts.json:
[
  {"name": "man",    "source": "photos/man.jpg",       "mode": "sticker"},
  {"name": "couple", "source": "clips/clip3.mp4@3.2",  "mode": "sticker", "crop": [450, 150, 360, 520]},
  {"name": "eye",    "source": "clips/clip4.mp4@7.4",  "mode": "torn",    "crop": [230, 170, 980, 460]}
]
"source" is an image, or a video with "@seconds" for a frame. "crop" is [x, y, w, h] in source pixels.
Optional: "upscale" (default 2 for small sources), "erase": [[[x, y], ...]] polygons in crop pixels to remove
(e.g. a hand under a bird). Output: <project>/public/cut/<name>.png and a contact sheet cut/_sheet.jpg.
"""
import argparse
import json
import os
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

CREAM = (244, 236, 218)
ap = argparse.ArgumentParser()
ap.add_argument("config")
ap.add_argument("--out", required=True)
ap.add_argument("--model", default="u2net", help="rembg model: u2net (default), isnet-general-use, u2net_human_seg")
a = ap.parse_args()
items = json.load(open(a.config, encoding="utf-8"))
base = os.path.dirname(os.path.abspath(a.config))
dst = os.path.join(a.out, "public", "cut")
os.makedirs(dst, exist_ok=True)
_session = None


def session():
    global _session
    if _session is None:
        from rembg import new_session
        _session = new_session(a.model)
    return _session


def load(src):
    path, _, at = src.partition("@")
    path = path if os.path.isabs(path) else os.path.join(base, path)
    if at:
        tmp = os.path.join(tempfile.mkdtemp(), "f.png")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", at, "-i", path, "-frames:v", "1", tmp], check=True)
        path = tmp
    return Image.open(path).convert("RGB")


def padded(im, pad):
    c = Image.new("RGB", (im.width + 2 * pad, im.height + 2 * pad), CREAM)
    c.paste(im, (pad, pad))
    return np.asarray(c)


def sticker(im, erase):
    from rembg import remove
    alpha = np.asarray(remove(im, session=session(), post_process_mask=True).getchannel("A")) > 128
    if erase:
        m = Image.new("L", im.size, 255)
        for poly in erase:
            ImageDraw.Draw(m).polygon([tuple(p) for p in poly], fill=0)
        alpha &= np.asarray(m) > 0
    lab, n = ndi.label(alpha)
    if n > 1:  # drop specks, keep the subject (and anything at least 8% of its size)
        sizes = ndi.sum(alpha, lab, range(1, n + 1))
        alpha = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > sizes.max() * .08])
    alpha = ndi.binary_fill_holes(ndi.binary_opening(alpha, iterations=2))
    pad = 34
    alpha = np.pad(alpha, pad)
    rgb = padded(im, pad)
    margin = ndi.gaussian_filter(ndi.binary_dilation(alpha, iterations=13).astype(float), 7) > .5
    out = np.zeros((*alpha.shape, 4), np.uint8)
    out[margin] = (*CREAM, 255)
    soft = ndi.gaussian_filter(alpha.astype(float), 1)[..., None]
    out[..., :3] = (rgb * soft + out[..., :3] * (1 - soft)).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def wobble(n, r, s):
    a1 = ndi.gaussian_filter1d(r.normal(size=n), s, mode="wrap")
    a2 = ndi.gaussian_filter1d(r.normal(size=n), s / 8, mode="wrap")
    return a1 / a1.std() + .35 * a2 / a2.std()


def torn(im, seed):
    pad = 40
    W, H = im.width + 2 * pad, im.height + 2 * pad
    yy, xx = np.mgrid[0:H, 0:W]
    r = np.random.default_rng(seed)

    def mask(inset):
        m = pad + inset + 10
        return ((yy > m + 9 * wobble(W, r, 40)[xx]) & (yy < H - m + 9 * wobble(W, r, 40)[xx]) &
                (xx > m + 9 * wobble(H, r, 40)[yy]) & (xx < W - m + 9 * wobble(H, r, 40)[yy]))
    paper, pic = mask(0), mask(13)
    rgb = padded(im, pad).copy()
    rgb[~pic] = CREAM
    return Image.fromarray(np.dstack([rgb, paper.astype(np.uint8) * 255]), "RGBA")


names = []
for i, it in enumerate(items):
    im = load(it["source"])
    if it.get("crop"):
        x, y, w, h = it["crop"]
        im = im.crop((x, y, x + w, y + h))
    k = it.get("upscale", 2 if max(im.size) < 1000 else 1)
    erase = [[[px * k, py * k] for px, py in poly] for poly in it.get("erase", [])]
    im = im.resize((im.width * k, im.height * k), Image.LANCZOS) if k != 1 else im
    res = sticker(im, erase) if it.get("mode", "sticker") == "sticker" else torn(im, 40 + i * 20)
    res = res.crop(res.getbbox())
    res.save(os.path.join(dst, f"{it['name']}.png"), optimize=True)
    names.append(it["name"])
    print(f"{it.get('mode', 'sticker'):7} {it['name']}  {res.width}x{res.height}", flush=True)

T, cols = 300, 5
sheet = Image.new("RGB", (T * cols, T * ((len(names) + cols - 1) // cols)), (58, 92, 120))
for i, n in enumerate(names):
    p = Image.open(os.path.join(dst, f"{n}.png"))
    p.thumbnail((T - 12, T - 12))
    sheet.paste(p, ((i % cols) * T + 6, (i // cols) * T + 6), p)
sheet.save(os.path.join(dst, "_sheet.jpg"), quality=88)
print("contact sheet:", os.path.join(dst, "_sheet.jpg"), "- look at it before using the cut-outs")
