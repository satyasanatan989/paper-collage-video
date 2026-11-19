# Style guide: making it feel like paper, not slides

## The idea in one line
A scrapbook wall being made in time with the music: every word and picture is paper that slaps down on a
beat and stays, and the camera moves along the wall.

## Pick a palette from the subject
Choose 3-4 paper colours for the whole video, from the subject itself (a film poster, a product, a festival,
a country's flag, a food). Keep cream as the neutral. Alternate dark and light sheets from station to
station so the cut is felt even before anything lands. Built-ins: cream, vermilion, marigold, indigo,
ink, teal, pink; add your own in `palette` and re-run `textures.py`.

Two videos in a row with the same palette and font look like a template. Change at least two of:
palette, font, signature prop, layout rhythm.

## Fonts
- Hindi / Devanagari: Rozha One (bundled). Other good free Devanagari display fonts from Fontsource:
  Yatra One, Kalam (handwriting), Tiro Devanagari Hindi.
- English: Anton (bundled, poster condensed), Caveat (bundled, handwriting labels).
- Other scripts (Urdu, Bengali, Tamil, ...): install a Fontsource font that covers the script
  (for example `@fontsource/noto-nastaliq-urdu`) and set `"font"`. Always check a still: a missing glyph
  shows as boxes.

## Layout rhythm per station
- One main picture (cut-out person, torn photo, or a big prop like a clock or disc) + 2-5 word strips.
- Words stacked diagonally, alternating rotation and colour, big enough for a phone (110-220 px).
- One background-life element: a `dots` halftone panel, an `orbit`, `float`, or a slow `rise`.
- Something new lands every 1-3 s. In a chorus or climax, add `burst` on every beat and move faster.

## Turning words into pictures (literal beats clever)
| The words are about | Show |
|---|---|
| time, moments, waiting | calendar pages tearing, clock ticking per beat, hourglass, sun and moon passing |
| heart, love | paper heart pulsing on the beat; a torn heart taped back together for longing or reunion |
| giving, offering | a hand-to-hand object, a pour, a flower or lamp passed across |
| a message, speaking | a bird or paper plane flyer carrying a note to the next station |
| numbers, facts | the number itself as a giant strip, a calendar, a coin stack (discs), a clock |
| celebration | bursts of marigolds or confetti on each beat |
| night, dreams | indigo sheet, moon disc with craters, orbiting stars |

## Transitions
The engine whips the camera to the next station with a small dip and tilt; that is the default cut. Use
a flyer when something should be carried across. The finale pull-back reveals every station at once:
plan the wall so the overview reads as one poster (balanced colours, no empty station).

## Things that make it look cheap
- Words smaller than 70 px, or long sentences on one strip (split them).
- A station with only text: add a prop or picture.
- Faces covered by words: move the words, the face is the reason people stop scrolling.
- The same rotation and size for every word.
- Text in the bottom 15% of a 9:16 frame (hidden by the app's buttons).
