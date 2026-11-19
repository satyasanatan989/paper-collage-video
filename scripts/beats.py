"""Cut a song section into <project>/public/audio.mp3 and write beat times to <project>/src/beats.json.

    python beats.py song.mp3 --start 37.2 --end 82.2 --out my-video
    python beats.py voiceover.wav --out my-video            (whole file, no cut)
"""
import argparse
import json
import os
import subprocess

import librosa
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("audio")
ap.add_argument("--start", type=float, default=0.0, help="section start in seconds")
ap.add_argument("--end", type=float, default=None, help="section end in seconds")
ap.add_argument("--out", required=True, help="project folder (your copy of template/)")
ap.add_argument("--bpm-hint", type=float, default=None, help="rough tempo, if detection doubles or halves it")
ap.add_argument("--no-fade", action="store_true", help="skip the short fade in / 2.5 s fade out")
a = ap.parse_args()

full = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.audio],
                            capture_output=True, text=True).stdout)
length = (a.end or full) - a.start
dst = os.path.join(a.out, "public", "audio.mp3")
tmp = dst + ".tmp.mp3"  # never let ffmpeg read and write the same file
cmd = ["ffmpeg", "-v", "error", "-y", "-ss", str(a.start), "-i", a.audio, "-t", f"{length:.3f}"]
if not a.no_fade:
    cmd += ["-af", f"afade=t=in:d=0.3,afade=t=out:st={max(0.0, length - 2.5):.2f}:d=2.5"]
subprocess.run(cmd + ["-b:a", "192k", tmp], check=True)
os.replace(tmp, dst)

y, sr = librosa.load(dst, sr=22050, mono=True)
env = librosa.onset.onset_strength(y=y, sr=sr)
kw = {"start_bpm": a.bpm_hint, "tightness": 200} if a.bpm_hint else {}
tempo, frames = librosa.beat.beat_track(onset_envelope=env, sr=sr, **kw)
bpm = float(np.atleast_1d(tempo)[0])
beats = [round(float(b), 3) for b in librosa.frames_to_time(frames, sr=sr)]
onsets = [round(float(o), 3) for o in librosa.onset.onset_detect(onset_envelope=env, sr=sr, units="time")]
dur = round(len(y) / sr, 3)
with open(os.path.join(a.out, "src", "beats.json"), "w") as f:
    json.dump({"bpm": round(bpm, 2), "duration": dur, "beats": beats, "onsets": onsets}, f, indent=1)
print(f"audio {dur}s  ~{bpm:.1f} BPM  {len(beats)} beats -> {a.out}/src/beats.json")
print("Set \"duration\" in storyboard.json to", dur, "| If the BPM looks doubled (slow song at ~130), rerun with --bpm-hint.")
