# storyboard.json

Everything on screen comes from `src/storyboard.json` in the project, plus beat times from `src/beats.json`
(written by `scripts/beats.py`). The engine (`src/Collage.tsx`) lays the stations out on one wall in a
snake grid, whips the camera to each station at its `start`, and pulls back at the end to show the whole wall.

## Top level

| Key | Meaning | Default |
|---|---|---|
| `format` | `"9:16"` (1080x1920) or `"16:9"` (1920x1080) | `9:16` |
| `fps` | frames per second | 30 |
| `duration` | video length in seconds; use the audio length | required |
| `audio` | file in `public/` | none (silent) |
| `font` | display font for words: `"Rozha One"` (Devanagari + Latin), `"Anton"` (Latin), `"Caveat"` (handwriting) | `Rozha One` |
| `columns` | stations per row on the wall | 3 |
| `palette` | extra or changed paper colours: `{"name": ["#paper", "#text"]}` | see below |
| `bpm`, `beatOffset` | only used when `beats.json` has no beats | 120, 0 |
| `finale` | `{"at": seconds, "dur": seconds}` for the pull-back reveal, or `false` | 2.2 s before the end |
| `flyers` | objects that travel between stations (see below) | none |
| `stations` | list of stations, in time order | required |

Built-in paper colours (`sheet`, word `color`): `cream`, `vermilion`, `marigold`, `indigo`, `ink`, `teal`, `pink`.
After adding a colour to `palette`, run `scripts/textures.py` again so its sheet and strip exist.
To add a font: `npm install @fontsource/<name>`, import its CSS in `src/index.ts`, then set `"font"`.

## Station

```json
{"start": 8.66, "sheet": "marigold", "rot": -0.4, "elements": [ ... ]}
```

`start` is when the camera arrives (put it on the beat where the line starts). Coordinates inside a station
go from (0,0) top-left to (1080,1920) or (1920,1080). Keep words out of the bottom 15% in 9:16.

## Timing any element

- `"beat": n` lands it on the n-th beat at or after the station start (0 = the station's first beat;
  `1.5` is allowed and means half a beat later, assuming ~0.5 s beats).
- `"at": seconds` lands it at an exact time (use for word timings from `words.json`).
- Neither: lands on beat 0.

## Shared options

`x`, `y` (top-left, px), `rot` (degrees), `z` (stacking; words default to 6, pictures 2, dots 0),
`in`: `"slap"` (default) | `"pop"` | `"drop"` | `"none"`, `shadow: false`.
Motion on top of the entrance:
- `"pulse": true` or a number (0.06) - bump on every beat
- `"float": 8` - slow bob, px
- `"spin": 20` - degrees per second
- `"move": {"to": [dx, dy], "beat": 2, "dur": 1.2, "ease": "inOut"}` - slide; `"ease": "beats", "steps": 6`
  moves in hops on each beat (two people walking toward each other)

## Element types

| type | Keys | Use |
|---|---|---|
| `word` | `text`, `size` (px, 110-220 typical), `color` (paper), `textColor`, `font` | lyric/script words on a torn strip |
| `image` | `src` (`"cut/man.png"`), `w` | cut-out sticker or torn scrap from `scripts/cutout.py` |
| `tape` | `w`, `rot` | masking tape pinning things |
| `dots` | `d`, `h`, `color`, `size`, `square` | halftone panel (drifts slowly, keeps the background alive) |
| `disc` | `d`, `color`, `craters: true`, `rise: {"from": 900, "dur": 2}` | sun, moon, planet, plate, coin |
| `heart` | `w`, `color`, `pulse`, `mend: {"beat": 1, "gap": 0.33}` | heart; `mend` starts torn in two and tapes back together |
| `clock` | `d`, `color` | hands tick forward on every beat from the station start |
| `calendar` | `w`, `pages` (top first), `last` (under the pages), `color` | one page tears off per beat |
| `icon` | `kind`: `marigold`, `star`, `petal`, `lamp`, `confetti`, `dot`; `d` | small props |
| `burst` | `kind`, `d`, `count`, `r`, `every: "beat"` (default) or `"once"`, `until` | props flying out on every beat |
| `sprinkle` | `kind`, `d`, `count`, `w`, `h`, `step` | props popping in one by one over an area (blossoms, stars) |
| `orbit` | `kind`, `d`, `count`, `r`, `speed`, `squash` | props circling a point (fireflies, planets) |
| `text` | `text`, `size`, `font` (default Caveat), `textColor` | small handwritten label, no strip |

## Flyers

A flyer carries the viewer from one station to the next (a bird with a letter, a paper plane):

```json
"flyers": [{"src": "cut/parrot.png", "w": 330, "keys": [
  {"t": 30.5, "station": 6, "x": 660, "y": 700},
  {"t": 33.4, "station": 6, "x": 1060, "y": 760, "arc": 170},
  {"t": 34.1, "station": 7, "x": 700, "y": 800}
]}]
```

`x`, `y` are inside the given station; the flyer eases between keys, arcs upward by `arc` px, and flaps
until its last key. `hideAfter` (seconds) removes it.

## Layout tips

- A 9:16 word at `size` 150 is about 190 px tall; Rozha One Hindi words are roughly `0.9 x size` wide per
  syllable cluster plus `0.9 x size` padding. Check with `scripts/review.py` rather than guessing.
- Stack 3-5 words per station, alternating rotation (-4, 3, -2 ...) and colour.
- Put the main picture first in `elements` (lower z) and words last.
