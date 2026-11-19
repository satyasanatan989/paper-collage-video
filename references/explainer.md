# Explainers

## Inputs
- A topic, a script, or a recorded voice-over. If the user has only a topic, write a short script (90-150
  words for 45-60 s): a hook question, 3-5 facts each with one picture, and a pay-off line. Facts must be
  correct and sourced; say which ones you could not verify.
- Voice: the user records it on their phone (best, and free), or uses any offline text-to-speech they already
  have. This skill needs no paid voice service. A silent explainer with music also works: then time
  everything to beats.

## Steps
1. Put the voice-over (or music) through `scripts/beats.py <file> --out <project> --no-fade` to copy it to
   `public/audio.mp3` and get a beat grid (useful even for speech, for the props).
2. `python scripts/transcribe.py vo.mp3 --lang en --out <project>` gives `words.json` with each word's start.
   Check names and numbers against the script.
3. One station per sentence or idea. Station `start` = start time of the sentence's first word (minus 0.1 s so
   the camera arrives just before the voice).
4. Put the 1-3 key words of each sentence on strips with `"at"` = that word's start time. Not every word:
   the strips are the headline, the voice carries the rest.
5. Each fact gets its literal instrument: a number becomes a giant strip, a date a calendar, a duration a
   clock, a place a torn map or photo scrap, a person their cut-out photo.
6. Pictures: the user's photos, frames from their footage, public-domain scans (museum and archive
   collections that say public domain / CC0), or the code props. Do not use images whose licence is unknown.

## Example
`examples/leap-year-explainer.json` is a 16-second explainer made only from code props and words. It is the
template's built-in demo, so a fresh copy renders right away.
