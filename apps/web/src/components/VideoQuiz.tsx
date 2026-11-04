"use client";

import { lookup } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { FUNCTION_POS, shuffle, type Cue } from "@storyling/learner";
import { useMemo, useState } from "react";
import { playWord } from "@/lib/audio";
import { useLearner } from "@/lib/learner";
import { Tr } from "@/lib/translate";
import { Icon } from "@/components/ui";

interface Word { surface: string; lemma: string; display: string; meaning: string; pos: string; cue: number }
type Q = { kind: "gap"; w: Word; options: string[] } | { kind: "meaning"; w: Word; options: string[] };

const SPLIT = /[\s,.!?;:"„“”»«()–-]+/;

/** Dictionary words heard in the video, each with the line it came from. */
function wordsIn(lang: LangCode, cues: Cue[]): Word[] {
  const out = new Map<string, Word>();
  cues.forEach((c, cue) => {
    for (const surface of c.text.split(SPLIT)) {
      if (surface.length < 4 || /\d/.test(surface)) continue;
      const e = lookup(lang, surface) ?? lookup(lang, surface[0]!.toUpperCase() + surface.slice(1));
      if (!e || FUNCTION_POS.has(e.pos) || e.pos === "name" || out.has(e.lemma)) continue;
      if (e.meaning.toLowerCase().includes(e.display.toLowerCase())) continue;
      out.set(e.lemma, { surface, lemma: e.lemma, display: e.display, meaning: e.meaning, pos: e.pos, cue });
    }
  });
  return [...out.values()];
}

function build(lang: LangCode, cues: Cue[]): Q[] {
  const words = shuffle(wordsIn(lang, cues));
  if (words.length < 6) return [];
  const others = (w: Word, f: (x: Word) => string) => {
    const same = words.filter((x) => x !== w && x.pos === w.pos && f(x) !== f(w));
    const pool = same.length >= 3 ? same : words.filter((x) => x !== w && f(x) !== f(w));
    return [...new Set(shuffle(pool).map(f))].slice(0, 3);
  };
  // Gaps from lines with enough context, then meanings for different words.
  const gapWords = words.filter((w) => cues[w.cue]!.text.split(" ").length >= 4).slice(0, 3);
  const meaningWords = words.filter((w) => !gapWords.includes(w)).slice(0, 6 - gapWords.length);
  return shuffle([
    ...gapWords.map((w): Q => ({ kind: "gap", w, options: shuffle([w.surface, ...others(w, (x) => x.surface)]) })),
    ...meaningWords.map((w): Q => ({ kind: "meaning", w, options: shuffle([w.meaning, ...others(w, (x) => x.meaning)]) })),
  ]);
}

/** A short test on the video's own words: fill the gap in a subtitle line, or pick a word's meaning. */
export function VideoQuiz({ lang, cues, onPlay }: { lang: LangCode; cues: Cue[]; onPlay: (c: Cue) => void }) {
  const learner = useLearner(lang);
  const [round, setRound] = useState(0);
  const qs = useMemo(() => build(lang, cues), [lang, cues, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [missed, setMissed] = useState<string[]>([]);

  if (qs.length < 4) return null;
  if (!open)
    return (
      <div className="video-quiz-cta">
        <span><b>Test yourself on this video</b><span className="muted small" style={{ display: "block" }}>{qs.length} questions on words from the subtitles.</span></span>
        <button className="btn primary" onClick={() => setOpen(true)}>Start practice</button>
      </div>
    );

  const q = qs[n];
  if (!q) {
    const pct = Math.round((score / qs.length) * 100);
    return (
      <div className="flash done-card">
        <div className="score-ring anim" style={{ ["--p" as string]: pct / 100 }}><b>{pct}%</b></div>
        <p className="muted" style={{ margin: 0 }}>{score} of {qs.length} correct.{missed.length ? ` ${missed.length} ${missed.length === 1 ? "word was" : "words were"} added to your notebook.` : ""}</p>
        <button className="btn primary block" onClick={() => { setRound((r) => r + 1); setN(0); setScore(0); setChosen(null); setMissed([]); }}>Practice again</button>
      </div>
    );
  }

  const right = q.kind === "gap" ? q.w.surface : q.w.meaning;
  const pick = (o: string) => {
    if (chosen) return;
    setChosen(o);
    if (o === right) setScore((s) => s + 1);
    else {
      learner.setWord(q.w.lemma, "learning");
      setMissed((m) => [...m, q.w.lemma]);
    }
  };
  const next = () => {
    if (n + 1 >= qs.length) learner.recordGame("video", Math.round(((score) / qs.length) * 100));
    setN(n + 1);
    setChosen(null);
  };
  const line = cues[q.w.cue]!;

  return (
    <div className="flash sp-q" key={`${round}-${n}`}>
      <div className="spread small muted"><span>Question {n + 1} of {qs.length}</span><span>{q.kind === "gap" ? "Fill the gap" : "What does it mean?"}</span></div>
      <div className="g-progress"><span style={{ width: `${(n / qs.length) * 100}%` }} /></div>
      {q.kind === "gap" ? (
        <p className="vq-line" lang={lang}>
          {line.text.split(q.w.surface).map((part, i, a) => (
            <span key={i}>{part}{i < a.length - 1 && <span className={`vq-gap${chosen ? " filled" : ""}`}>{chosen ? q.w.surface : "_____"}</span>}</span>
          ))}
        </p>
      ) : (
        <button className="pic-word" lang={lang} onClick={() => playWord(lang, q.w.lemma, q.w.display)}>{q.w.display} <span aria-hidden="true">{Icon.speaker}</span></button>
      )}
      <button className="btn ghost sm" style={{ justifySelf: "start" }} onClick={() => onPlay(line)}>{Icon.play} Hear it in the video</button>
      <div className="choices" lang={q.kind === "gap" ? lang : undefined}>
        {q.options.map((o) => (
          <button key={o} disabled={!!chosen} className={`choice${chosen && o === right ? " ok" : ""}${chosen === o && o !== right ? " no" : ""}`} onClick={() => pick(o)}>
            {q.kind === "meaning" ? <Tr>{o}</Tr> : o}
          </button>
        ))}
      </div>
      {chosen && (
        <>
          <p className="muted" style={{ margin: 0 }}><b lang={lang}>{q.w.display}</b> · <Tr>{q.w.meaning}</Tr></p>
          <button className="btn primary block" onClick={next}>{n + 1 >= qs.length ? "See result" : "Next"}</button>
        </>
      )}
    </div>
  );
}
