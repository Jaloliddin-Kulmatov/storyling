#!/usr/bin/env python3
"""Build Storyling: record audio with macOS voices, then inline data + audio timings into storyling.html.

Usage: python3 src/build.py            (records only clips that changed)
"""
import hashlib, json, os, subprocess, sys, tempfile, wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
AUDIO = os.path.join(ROOT, "audio")
CACHE = os.path.join(SRC, ".clips")
RATE = 22050
GAP = 0.45   # silence between clips (s)
LEAD = 0.2   # silence at the start of each file (s)
os.makedirs(AUDIO, exist_ok=True)
os.makedirs(CACHE, exist_ok=True)

data_js = open(os.path.join(SRC, "data.js"), encoding="utf-8").read()

# Evaluate data.js with JavaScriptCore to get plain JSON.
probe = data_js + r"""
;(function(){
  var P = /^[\p{P}\p{S}]+$/u, out = {stories: [], words: {}, missing: []};
  STORIES.forEach(function(st){
    var noSpace = !!LANGS[st.lang].noSpace;
    out.stories.push({id: st.id, lang: st.lang, sents: st.sents.map(function(s){
      var toks = s[0].split(" ");
      toks.forEach(function(t){ if (P.test(t)) return; var l = t.split("=")[1] || t; if (!D[st.lang][l]) out.missing.push(st.id + ": " + l); });
      return toks.map(function(t, i){ var sf = t.split("=")[0]; return (i && !P.test(t) && !noSpace ? " " : "") + sf; }).join("");
    })});
  });
  Object.keys(D).forEach(function(lang){ out.words[lang] = Object.keys(D[lang]); });
  out.voices = {}; Object.keys(LANGS).forEach(function(k){ out.voices[k] = LANGS[k].voice; });
  return JSON.stringify(out);
})()
"""
with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
    f.write(probe)
res = subprocess.run(["osascript", "-l", "JavaScript", f.name], capture_output=True, text=True)
if res.returncode:
    sys.exit("data.js failed to evaluate:\n" + res.stderr)
info = json.loads(res.stdout)
if info["missing"]:
    sys.exit("Lemmas missing from the dictionary:\n  " + "\n  ".join(info["missing"]))


def clip(voice, text):
    """Record one clip as mono 16-bit WAV at RATE; cached by voice+text."""
    key = hashlib.sha1((voice + "\n" + text).encode()).hexdigest()[:16]
    wav = os.path.join(CACHE, key + ".wav")
    if not os.path.exists(wav):
        aiff = os.path.join(CACHE, key + ".aiff")
        subprocess.run(["say", "-v", voice, "-r", "150", "-o", aiff, text], check=True)
        subprocess.run(["afconvert", aiff, "-d", f"LEI16@{RATE}", "-c", "1", "-f", "WAVE", wav], check=True, capture_output=True)
        os.remove(aiff)
    with wave.open(wav) as w:
        return w.readframes(w.getnframes())


def sprite(name, voice, texts):
    """Join clips into audio/<name>.mp4; return [[start, end], ...] in seconds."""
    silence = lambda s: b"\x00\x00" * int(RATE * s)
    pcm, spans, t = bytearray(silence(LEAD)), [], LEAD
    for text in texts:
        frames = clip(voice, text)
        dur = len(frames) / 2 / RATE
        spans.append([round(t, 3), round(t + dur, 3)])
        pcm += frames + silence(GAP)
        t += dur + GAP
    tmp = os.path.join(CACHE, name + ".wav")
    with wave.open(tmp, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(bytes(pcm))
    out = os.path.join(AUDIO, name + ".mp4")
    subprocess.run(["afconvert", tmp, "-d", "aac", "-b", "48000", "-f", "m4af", out], check=True, capture_output=True)
    os.remove(tmp)
    return spans


audio = {"stories": {}, "words": {}}
for st in info["stories"]:
    audio["stories"][st["id"]] = {"f": f"audio/{st['id']}.mp4", "s": sprite(st["id"], info["voices"][st["lang"]], st["sents"])}
    print("story", st["id"], len(st["sents"]))
for lang, words in info["words"].items():
    spans = sprite("w-" + lang, info["voices"][lang], [w.split("#")[0] for w in words])
    audio["words"][lang] = {"f": f"audio/w-{lang}.mp4", "w": dict(zip(words, spans))}
    print("words", lang, len(words))

tpl = open(os.path.join(SRC, "app.html"), encoding="utf-8").read()
page = tpl.replace("/*DATA*/", data_js).replace("/*AUDIO*/{}", json.dumps(audio, ensure_ascii=False, separators=(",", ":")))
open(os.path.join(ROOT, "storyling.html"), "w", encoding="utf-8").write(page)
size = sum(os.path.getsize(os.path.join(AUDIO, x)) for x in os.listdir(AUDIO))
print(f"built storyling.html · {len(os.listdir(AUDIO))} audio files · {size/1e6:.1f} MB")
