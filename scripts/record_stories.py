#!/usr/bin/env python3
"""Record story audio with Piper (one .mp4 per story, a time span per sentence in audio.json).

  record_stories.py --site https://storyling.vercel.app   record published daily stories that have no audio yet
  record_stories.py --json stories.json                   record [{id, level, sentences: [text]}], replacing what exists

The language comes from the story id. Voices download on first use into VOICE_DIR (default /tmp/storyling-voices);
VOICE overrides the German model. A language whose voice can't load is skipped, and its stories use the browser voice.
Needs piper-tts and ffmpeg. ESPEAK_DATA is optional.
"""
import argparse, io, json, os, re, shutil, subprocess, urllib.request, wave
from piper import PiperVoice, SynthesisConfig

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f"{ROOT}/apps/web/public/audio"
INDEX = f"{ROOT}/packages/content/src/audio.json"
# Beginners hear a slower voice and longer pauses.
PACE = {
    "A1": (1.15, 0.7), "A2": (1.08, 0.6), "B1": (1.0, 0.5),
    "HSK 1": (1.15, 0.7), "HSK 2": (1.08, 0.6), "HSK 3": (1.0, 0.5),
    "N5": (1.15, 0.7), "N4": (1.08, 0.6), "N3": (1.0, 0.5),
    "Level 1": (1.15, 0.7), "Level 2": (1.08, 0.6), "Level 3": (1.0, 0.5),
}
HF = "https://huggingface.co/rhasspy/piper-voices/resolve/main"
# language: (voice model, speaker)
VOICES = {
    "de": ("de/de_DE/thorsten/high/de_DE-thorsten-high", None),
    "en": ("en/en_US/lessac/high/en_US-lessac-high", None),
    "es": ("es/es_MX/claude/high/es_MX-claude-high", None),
    "fr": ("fr/fr_FR/siwis/medium/fr_FR-siwis-medium", None),
    "pt": ("pt/pt_BR/faber/medium/pt_BR-faber-medium", None),
    "ru": ("ru/ru_RU/ruslan/medium/ru_RU-ruslan-medium", None),
    "tr": ("tr/tr_TR/dfki/medium/tr_TR-dfki-medium", None),
    "ko": ("ko/ko_KR/kss/medium/ko_KR-kss-medium", None),
    "ja": ("ja/ja_JP/hi_fi_captain/medium/ja_JP-hi_fi_captain-medium", 0),
    "zh": ("zh/zh_CN/huayan/medium/zh_CN-huayan-medium", None),
}
LANGS = list(VOICES)


def text_of(sentence, lang):
    """Sentence text from a published story's tokens: no space before punctuation, none at all in Chinese."""
    out = ""
    for t in sentence["tokens"]:
        s = t["surface"]
        out += s if not out or lang == "zh" or re.fullmatch(r"[^\w]+", s) else " " + s
    return out


def published(site):
    out = []
    for lang in LANGS:
        with urllib.request.urlopen(f"{site}/api/stories?lang={lang}") as r:
            out += [{"id": s["id"], "level": s["level"], "sentences": [text_of(x, lang) for x in s["sentences"]]} for s in json.load(r)["stories"]]
    return out


def load_voice(lang):
    """(voice, speaker) for a language, downloading the model if needed."""
    model, speaker = VOICES[lang]
    if lang == "de" and os.environ.get("VOICE"):
        path = os.environ["VOICE"]
    else:
        folder = os.environ.get("VOICE_DIR", "/tmp/storyling-voices")
        os.makedirs(folder, exist_ok=True)
        path = f"{folder}/{os.path.basename(model)}.onnx"
        for ext in (".onnx", ".onnx.json"):
            target = path if ext == ".onnx" else path + ".json"
            if not os.path.exists(target):
                urllib.request.urlretrieve(f"{HF}/{model}{ext}", target)
    extra = {"espeak_data_dir": os.environ["ESPEAK_DATA"]} if os.environ.get("ESPEAK_DATA") else {}
    return PiperVoice.load(path, download_dir=os.path.dirname(path), **extra), speaker


def record(voice, speaker, ffmpeg, story):
    rate = voice.config.sample_rate
    scale, pause = PACE.get(story["level"], (1.0, 0.45))
    silence = lambda sec: b"\x00\x00" * int(rate * sec)
    data, spans = silence(0.2), []
    for text in story["sentences"]:
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            voice.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=scale, speaker_id=speaker))
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
    ffmpeg = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
    for lang in LANGS:
        batch = [s for s in stories if s["id"].split("-")[0] == lang]
        if not batch:
            continue
        try:
            voice, speaker = load_voice(lang)
            for n, s in enumerate(batch, 1):
                index["stories"][s["id"]] = record(voice, speaker, ffmpeg, s)
                json.dump(index, open(INDEX, "w"), ensure_ascii=False)
                print(n, len(batch), s["id"], flush=True)
        except Exception as e:
            print(f"skipped {lang}: {e}", flush=True)


main()
