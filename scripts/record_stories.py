#!/usr/bin/env python3
"""Record story audio with Piper (one .mp4 per story, a time span per sentence in audio.json).

  record_stories.py --site https://storyling.vercel.app   record published daily stories that have no audio yet
  record_stories.py --json stories.json                   record [{id, level, sentences: [text]}], replacing what exists

Needs piper-tts and ffmpeg. VOICE points at the .onnx model; ESPEAK_DATA is optional.
"""
import argparse, io, json, os, re, shutil, subprocess, urllib.request, wave
from piper import PiperVoice, SynthesisConfig

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f"{ROOT}/apps/web/public/audio"
INDEX = f"{ROOT}/packages/content/src/audio.json"
# Beginners hear a slower voice and longer pauses.
PACE = {"A1": (1.15, 0.7), "A2": (1.08, 0.6), "B1": (1.0, 0.5)}


def text_of(sentence):
    """Sentence text from a published story's tokens: no space before punctuation."""
    out = ""
    for t in sentence["tokens"]:
        s = t["surface"]
        out += s if not out or re.fullmatch(r"[^\w]+", s) else " " + s
    return out


def published(site):
    with urllib.request.urlopen(f"{site}/api/stories?lang=de") as r:
        return [{"id": s["id"], "level": s["level"], "sentences": [text_of(x) for x in s["sentences"]]} for s in json.load(r)["stories"]]


def record(voice, ffmpeg, story):
    rate = voice.config.sample_rate
    scale, pause = PACE.get(story["level"], (1.0, 0.45))
    silence = lambda sec: b"\x00\x00" * int(rate * sec)
    data, spans = silence(0.2), []
    for text in story["sentences"]:
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            voice.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=scale))
        buf.seek(0)
        with wave.open(buf) as r:
            pcm = r.readframes(r.getnframes())
        start = len(data) / 2 / rate
        data += pcm
        spans.append([round(start, 3), round(len(data) / 2 / rate, 3)])
        data += silence(pause)
    subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(rate), "-ac", "1", "-i", "-", "-c:a", "aac", "-b:a", "56k", "-movflags", "+faststart", f"{OUT}/{story['id']}.mp4"], input=data, check=True)
    return {"f": f"/audio/{story['id']}.mp4", "s": spans}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--site")
    p.add_argument("--json")
    a = p.parse_args()
    index = json.load(open(INDEX))
    stories = json.load(open(a.json)) if a.json else [s for s in published(a.site) if s["id"] not in index["stories"]]
    if not stories:
        return print("nothing to record")
    voice = PiperVoice.load(os.environ["VOICE"], **({"espeak_data_dir": os.environ["ESPEAK_DATA"]} if os.environ.get("ESPEAK_DATA") else {}))
    ffmpeg = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
    for n, s in enumerate(stories, 1):
        index["stories"][s["id"]] = record(voice, ffmpeg, s)
        json.dump(index, open(INDEX, "w"), ensure_ascii=False)
        print(n, len(stories), s["id"], flush=True)


main()
