"""Synthesize a royalty-free 120 BPM drum + pluck loop so the demo renders with sound.

    python demo_audio.py                 -> template/public/audio.mp3 (16 s)
    python demo_audio.py out.mp3 30      -> 30 s loop
"""
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np

out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "template", "public", "audio.mp3")
dur = float(sys.argv[2]) if len(sys.argv) > 2 else 16.0
sr, bpm = 44100, 120
t = np.arange(int(sr * dur)) / sr
beat = 60 / bpm
mix = np.zeros_like(t)


def env(start, length, decay):
    e = np.zeros_like(t)
    i0, i1 = int(start * sr), int(min(dur, start + length) * sr)
    e[i0:i1] = np.exp(-np.arange(i1 - i0) / sr * decay)
    return e


notes = [220, 277.2, 329.6, 277.2, 246.9, 311.1, 370, 311.1]
noise = np.random.default_rng(1).normal(size=t.size)
for k in range(int(dur / beat)):
    s = k * beat
    dt = (t - s).clip(0)
    mix += .9 * env(s, .35, 18) * np.sin(2 * np.pi * (55 * dt + 2 * (1 - np.exp(-dt * 30))))   # kick with pitch drop
    if k % 2:
        mix += .22 * env(s, .2, 30) * noise                                                    # snare-ish
    f = notes[k % len(notes)]
    mix += .22 * env(s, .9, 5) * (np.sin(2 * np.pi * f * t) + .4 * np.sin(4 * np.pi * f * t))   # pluck
mix *= np.minimum(1, t / .3) * np.minimum(1, (dur - t) / 1.5)
pcm = (mix / np.abs(mix).max() * .8 * 32767).astype(np.int16)
tmp = os.path.join(tempfile.mkdtemp(), "demo.wav")
with wave.open(tmp, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(sr)
    w.writeframes(pcm.tobytes())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-b:a", "128k", out], check=True)
print("wrote", out)
