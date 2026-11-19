"""Render stills at chosen seconds and tile them into <project>/review/sheet.jpg for a quick visual check.

    python review.py my-video 1 4.5 9 13.2
"""
import json
import math
import os
import subprocess
import sys

from PIL import Image

proj, times = sys.argv[1], [float(x) for x in sys.argv[2:]]
with open(os.path.join(proj, "src", "storyboard.json"), encoding="utf-8") as f:
    fps = json.load(f).get("fps", 30)
os.makedirs(os.path.join(proj, "review"), exist_ok=True)
paths = []
for t in times:
    rel = os.path.join("review", f"at_{t:g}.jpg")
    subprocess.run(f'npx remotion still Collage "{rel}" --frame={round(t * fps)} --image-format=jpeg --log=error',
                   cwd=proj, shell=True, check=True)
    paths.append(os.path.join(proj, rel))
ims = [Image.open(p).convert("RGB") for p in paths]
w = 300
h = round(ims[0].height * w / ims[0].width)
cols = min(8, len(ims))
sheet = Image.new("RGB", (w * cols, h * math.ceil(len(ims) / cols)), (20, 20, 20))
for i, im in enumerate(ims):
    sheet.paste(im.resize((w, h)), ((i % cols) * w, (i // cols) * h))
out = os.path.join(proj, "review", "sheet.jpg")
sheet.save(out, quality=88)
print("contact sheet:", out)
