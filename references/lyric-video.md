# Lyric videos

## Rights first
Work only with songs the user owns or has the right to use, and only with lyrics the user gives you. Do not
type out lyrics from memory and do not download songs from YouTube, Spotify or similar. When posting, the user
should credit the song and artists.

## Steps
1. **Pick the section.** 30-60 s (the hook/chorus plus its lead-in) suits Reels and Shorts. Ask for start and
   end times, or listen-free fallback: offer the first chorus and let the user correct it.
2. **Cut and find beats.** `python scripts/beats.py song.mp3 --start S --end E --out <project>`.
   Slow songs are often detected at double tempo (a 65 BPM ballad reported as 130). That is fine for timing
   words (more beats to land on) but use `--bpm-hint 65` if the pulse feels too busy.
3. **Line map.** Best: the user's `.lrc` file or line start times. Otherwise estimate: lines usually start on
   strong beats; for songs in languages whisper handles well you can try `scripts/transcribe.py` for rough
   line times, but sung Hindi/Urdu transcripts are mostly wrong (timings can still help). Always tell the
   user which times are estimates and ask them to check while watching.
4. **Words per beat.** Inside a line, land each word (or 2-word phrase) on successive beats: `"beat": 0, 1, 2...`
   from the station start. Long held notes: give the last word two beats.
5. **One station per line.** A repeated chorus line gets a new station each time that escalates (bigger words,
   more props, a `burst` on every beat in the last chorus).
6. **Ending.** The last line's station should hold something that resolves (a heart mended, two people meeting,
   a lamp lit), then the finale pull-back shows the whole wall while the music fades.

## A worked pattern (Hindi film song hook, 45 s, 8 lines)
| Station | Line role | Picture | Signature prop |
|---|---|---|---|
| 0 | intro, no words | moon disc rising, newspaper | `disc` + `rise` |
| 1 | "every moment near my heart" | man sticker | `calendar` tearing per beat + `heart` pulsing |
| 2 | "you stay" | couple sticker + tape | `tape`, lotus scrap |
| 3 | line 1 again (time) | couple small | `clock` ticking per beat |
| 4 | "you stay" (long hold) | woman portrait | `orbit` of stars, torn eye scrap |
| 5 | "life is a sweet thirst" | tree sticker | `sprinkle` blossoms, pour scrap |
| 6 | "this is what you say" | window scrap | bird `flyer` to the next station |
| 7 | line 1, last time | two people walking | `move` with `ease: "beats"`, `burst` marigolds |
| 8 | "you stay", ending | couple sitting | `heart` with `mend` |

See `examples/lyric-video.json` for the full storyboard of this pattern.
