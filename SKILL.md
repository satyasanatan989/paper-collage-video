---
name: paper-collage-video
description: >
  Make paper-collage ("Vox-style") explainer videos and kinetic lyric videos with no API keys and no paid
  services: torn colour paper, scissor-cut photo stickers, tape, halftone dots and words slapped on in the
  beat, while a camera travels across one big scrapbook wall. Uses Remotion plus free local Python tools
  (rembg cut-outs, librosa beat detection, optional faster-whisper timing). Use this skill whenever the user
  wants a collage, cut-paper, scrapbook, zine, editorial or Vox-like explainer, a lyric or lyrical video, a
  kinetic-typography music video, or a "video from my song / my script / my photos" in that look, in any
  language (Hindi, English, Hinglish, Urdu, ...), even if they never say "collage" or "Remotion".
---

# Paper-collage video (explainer + lyric), no API keys

You build the whole video locally. Nothing in this skill needs an API key, a login or credits: images come
from the user's own photos, frames of their own videos, public-domain scans, or are drawn in code; the
audio is the user's own song or voice-over. Say this up front, because it is the reason people pick this skill.

The look: torn colour sheets, cut-out photo stickers with a cream scissor margin, words on torn paper strips,
tape, halftone dots. Everything lands with a "slap" on the beat and stays stuck to the wall. The camera
whips from one patch of the wall to the next, one patch per line or idea, and the ending pulls back to
reveal the whole scrapbook. This continuity is what keeps it from feeling like a slideshow.

## What you need on the machine

Run `python scripts/check_setup.py`. It checks Node 18+, ffmpeg, and the Python packages, and prints the
exact install command for anything missing. Install only what is missing, and ask before installing.
`rembg` downloads its cut-out model once (about 170 MB, from GitHub, no account).

## Workflow

Copy `template/` to a new project folder next to the user's files (for example `my-video/`), run
`npm install` there, and work in that copy. Never edit the skill's own template.

1. **Collect inputs, in one message, only what is missing.**
   - Kind: explainer (voice-over or text) or lyric video (song).
   - Audio: the song section or voice-over file. Songs: only ones the user owns or has the right to use.
   - Words: the lyrics or the script, from the user. Do not write song lyrics from memory.
   - Format: 9:16 (Reels/Shorts, default) or 16:9. Language/script of the on-screen words.
   - Pictures (optional): their photos, a video to take frames from, or "draw it in code".
2. **Map the audio.** `python scripts/beats.py song.mp3 --start 37.2 --end 82.2 --out <project>`
   cuts the section to `public/audio.mp3` and writes `src/beats.json` (beat times from 0).
   Explainer with voice-over: `python scripts/transcribe.py vo.mp3 --lang en --out <project>` writes
   word times to `words.json` (runs locally, no key). For Hindi/Urdu songs whisper is unreliable: ask for
   an `.lrc` file or line start times, or estimate from beats and say it is an estimate.
3. **Write the line map**: each lyric line or script sentence gets a start time, snapped to the nearest
   beat when it is within about 0.12 s. Show it to the user as a short table before building.
4. **Pick a palette and plan the wall.** Read `references/style-guide.md`. One station (one patch of wall)
   per line/idea, 5-12 stations for 30-60 s. Show a rundown table (time, words, what we see) and wait for a yes.
   Changing a table is cheap; changing code is not.
5. **Make the pictures.** List frames and photos in a JSON for `scripts/cutout.py` (stickers and torn
   scraps, see `references/cutouts.md`). Run it and look at its contact sheet before using anything:
   remove-background mistakes are common and easy to spot there. No pictures? Use the code primitives
   (disc, heart, clock, calendar, icon, burst, orbit, sprinkle) instead.
6. **Textures**: `python scripts/textures.py --format 9:16 --out <project>` (palette from the storyboard).
7. **Write `src/storyboard.json`.** The schema and every element type are in
   `references/storyboard-schema.md`; working examples are in `examples/`. Words, pictures and props are
   timed by `beat` (n-th beat from the station start) or `at` (seconds), so they hit the music.
8. **Review stills, not the whole video.** `python scripts/review.py <project> 2 6.5 11 ...` renders those
   seconds and tiles them into `review/sheet.jpg`. Look at it like a director: words cut off or
   overlapping, faces covered, a station that is empty for more than a beat, text over a busy area. Fix, re-shoot.
9. **Render**: `npx remotion render Collage renders/video.mp4 --crf=19` inside the project.
   Check the duration and that audio is present (`ffprobe`). Tell the user what you checked and what you
   did not (you cannot listen to the sync yourself; ask them to watch with sound).

## Rules that make it look right (and why)

- **One wall, never slides.** Things stay stuck after they land and the camera moves to them. Fading one
  card out and another in is the slideshow look this style exists to avoid.
- **Literal pictures.** Show what the words say (a calendar tearing for "every moment", a heart for "heart").
  Viewers connect with literal images; clever metaphors make them scroll.
- **Words are paper.** One word or short phrase per strip, 110-220 px tall on a 1080-wide frame, rotated
  a few degrees, never smaller than 70 px (people watch on phones). At most two levels of text per station.
- **Hit the beat, not every beat.** Words land on the beats where they are sung or spoken; props land on
  the beats in between. Something new every 1-3 s, faster in a chorus.
- **Contrast.** Strips are solid paper, so text is always readable. Keep the bottom 15% of a 9:16 frame
  free of words (platform buttons sit there).
- **Deterministic.** No `Math.random()` or clock reads in the composition; the engine uses seeded noise, so
  every render matches the preview.
- **Credit and disclose.** Remind the user to credit the song and artists. If any picture came from an AI
  generator, they should say so when posting. Do not put another brand's logo or name on screen; "Vox-style"
  describes a look, it is not a brand to imitate.

## Files

| File | Read when |
|---|---|
| `references/storyboard-schema.md` | writing or editing `storyboard.json` (all element types and options) |
| `references/style-guide.md` | choosing palette, fonts, layouts, transitions for a new video |
| `references/lyric-video.md` | the user brings a song |
| `references/explainer.md` | the user brings a topic, script or voice-over |
| `references/cutouts.md` | turning photos or video frames into stickers and torn scraps |
| `references/troubleshooting.md` | something fails (Windows encoding, whisper/av errors, fonts, slow renders) |
| `examples/leap-year-explainer.json` | a complete code-only explainer (it is the template's demo) |
| `examples/lyric-video.json` | a lyric video built from cut-outs |
