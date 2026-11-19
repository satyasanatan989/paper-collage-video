# Pictures: stickers and torn scraps (local, no API key)

`scripts/cutout.py` makes two kinds of paper picture from photos or video frames:

- **sticker**: the subject is cut out with rembg (local AI background removal) and gets a cream scissor margin.
  Best for people, animals, objects with a clear outline.
- **torn**: a rectangle with a torn paper edge. Best for scenes, close-ups (an eye, hands), busy backgrounds,
  or anything rembg cuts badly.

## Config
```json
[
  {"name": "man",    "source": "photos/man.jpg", "mode": "sticker"},
  {"name": "couple", "source": "footage/clip3.mp4@3.2", "mode": "sticker", "crop": [450, 150, 360, 520]},
  {"name": "bird",   "source": "footage/clip6.mp4@5.2", "mode": "sticker", "crop": [360, 175, 335, 305],
   "erase": [[[190, 175], [250, 160], [260, 120], [335, 90], [335, 305], [190, 305]]]},
  {"name": "eye",    "source": "footage/clip4.mp4@7.4", "mode": "torn", "crop": [230, 170, 980, 460]}
]
```
Run `python scripts/cutout.py cutouts.json --out <project>`; files land in `public/cut/` and the contact sheet in
`public/cut/_sheet.jpg`.

## Finding crops
Grab a frame with ffmpeg (`ffmpeg -ss 3.2 -i clip.mp4 -frames:v 1 f.png`), draw a grid on it (every 100 px)
with Pillow, look at it, and read off `[x, y, w, h]`. Crop loosely around one subject; rembg works better on a
tight crop with one clear subject.

## Fixing bad cut-outs
- Extra bits (a hand under a bird, a moon behind a head): add an `erase` polygon (coordinates inside the crop,
  before upscaling) or tighten the crop.
- Parts missing (thin branches, blossoms, hair): switch to `torn`, or try `--model isnet-general-use`, or
  rebuild the lost parts with code props (a `sprinkle` of petal dots over a bare tree looks intentional).
- People: `--model u2net_human_seg` can be cleaner for portraits.

## Where pictures can come from without any API
- The user's own photos and drawings, and frames from footage they made or have rights to.
- Public-domain and CC0 collections (many museums and archives mark such images clearly). Keep a note of the
  source for each image.
- Code props (disc, heart, clock, calendar, icons) and textures, which need no pictures at all.
If any picture was made with an AI image or video generator, the user should disclose that when posting.
