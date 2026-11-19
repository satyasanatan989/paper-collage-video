"""Check everything this skill needs. Prints what is missing and the command to install it. Installs nothing."""
import importlib.util
import shutil
import subprocess
import sys

ok = True


def report(name, good, fix):
    global ok
    print(("  ok      " if good else "  MISSING ") + name + ("" if good else f"\n          install: {fix}"))
    ok &= bool(good)


def version(cmd):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, shell=sys.platform == "win32").stdout.strip()
    except Exception:
        return ""


print("paper-collage-video setup check (no API keys needed)\n")
node = version(["node", "-v"])
good_node = node.startswith("v") and int(node[1:].split(".")[0]) >= 18
report(f"Node.js 18+ ({node or 'not found'})", good_node, "https://nodejs.org (LTS installer)")
report("ffmpeg + ffprobe", shutil.which("ffmpeg") and shutil.which("ffprobe"),
       "Windows: winget install Gyan.FFmpeg | macOS: brew install ffmpeg | Linux: sudo apt install ffmpeg")
report(f"Python 3.9+ ({sys.version.split()[0]})", sys.version_info >= (3, 9), "https://python.org")
for mod, pkg in {"numpy": "numpy", "PIL": "pillow", "scipy": "scipy", "librosa": "librosa soundfile"}.items():
    report(f"python package: {pkg}", importlib.util.find_spec(mod) is not None, f"pip install {pkg}")

print("\noptional:")
for mod, pkg, why in [("rembg", "rembg onnxruntime", "cut people/objects out of photos (model downloads once, ~170 MB)"),
                      ("faster_whisper", "faster-whisper", "word timings from a spoken voice-over (offline)")]:
    have = importlib.util.find_spec(mod) is not None
    print(("  ok      " if have else "  -       ") + f"{pkg}: {why}" + ("" if have else f"\n          install: pip install {pkg}"))

print("\nAll required tools are present." if ok else "\nInstall the missing items above, then run this again.")
sys.exit(0 if ok else 1)
