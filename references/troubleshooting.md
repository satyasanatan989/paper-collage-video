# Troubleshooting

| Problem | Fix |
|---|---|
| `UnicodeEncodeError` / garbled Hindi printed on Windows | run Python with `PYTHONIOENCODING=utf-8`, open files with `encoding="utf-8"` |
| faster-whisper: `open() got an unexpected keyword argument 'metadata_errors'` | PyAV version mismatch; `transcribe.py` already avoids it by decoding with ffmpeg and passing samples |
| Words show as boxes | the font lacks that script; install a Fontsource font that covers it and set `"font"` |
| A word strip looks cut off on the right | shorten the phrase or reduce `size`; very long phrases should be split into two strips |
| Audio got shorter or silent after `beats.py` | you passed the project's own `public/audio.mp3` as input on an old version; the script now writes via a temp file |
| BPM doubled or halved | `beats.py --bpm-hint <bpm>` |
| Render is slow | it is CPU-bound (drop shadows on big images). Use `--concurrency=4` or lower `--crf` quality, or render a 720p test first with `--scale=0.667` |
| Station images flash in late | they are loading; Remotion waits for `<Img>`, so this only happens in the Studio preview, not in renders |
| `rembg` downloads at first run | expected, once (~170 MB model in `~/.u2net`) |
| A still looks right but motion feels off | you cannot hear the video; render it and ask the user which second is wrong, then shift that line's `start` or element `beat` |
| Everything is early or late by the same amount | add or subtract the same seconds from every station `start` (and every `at`) |
