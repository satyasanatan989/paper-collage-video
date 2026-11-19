"""Word-level timings from a voice-over, fully offline with faster-whisper (no API key).

    python transcribe.py vo.mp3 --lang en --out my-video        ->  my-video/words.json

Good for clear speech in English and many other languages. For sung Hindi/Urdu lyrics it is unreliable:
use an .lrc file or the user's line times instead. The model (~500 MB for "small") downloads once.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np

sys.stdout.reconfigure(encoding="utf-8")
ap = argparse.ArgumentParser()
ap.add_argument("audio")
ap.add_argument("--lang", default=None, help="en, hi, ur, ... (auto if omitted)")
ap.add_argument("--model", default="small", help="tiny / base / small / medium")
ap.add_argument("--out", required=True)
a = ap.parse_args()

from faster_whisper import WhisperModel  # noqa: E402

# Decode with ffmpeg and hand over raw samples: avoids the PyAV "metadata_errors" incompatibility on some installs.
tmp = os.path.join(tempfile.mkdtemp(), "a.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.audio, "-ac", "1", "-ar", "16000", tmp], check=True)
with wave.open(tmp) as w:
    samples = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768

model = WhisperModel(a.model, device="cpu", compute_type="int8")
segs, info = model.transcribe(samples, language=a.lang, word_timestamps=True)
words, lines = [], []
for s in segs:
    lines.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()})
    words += [{"start": round(x.start, 2), "end": round(x.end, 2), "word": x.word.strip()} for x in (s.words or [])]
    print(f"{s.start:6.2f}-{s.end:6.2f}  {s.text.strip()}")
out = os.path.join(a.out, "words.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump({"language": info.language, "lines": lines, "words": words}, f, ensure_ascii=False, indent=1)
print(f"\n{len(words)} words -> {out}. Check the text: names and numbers are often misheard.")
