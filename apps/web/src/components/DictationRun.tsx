"use client";

import { language } from "@storyling/content";
import { checkDictation, type DictationResult } from "@storyling/learner";
import { useEffect, useRef, useState } from "react";
import { playSentence, stopAudio } from "@/lib/audio";
import { textOf, type AnyStory } from "@/lib/stories";
import { Icon } from "@/components/ui";

export interface DictationItem {
  story: AnyStory;
  index: number;
}

/**
 * Dictation: hear a sentence, type it, and see which words were missed.
 * Works for any list of sentences (one story, or a mix for practice).
 */
export function DictationRun({ items, rate = 1, onFinish }: { items: DictationItem[]; rate?: number; onFinish: (score: number) => void }) {
  const [n, setN] = useState(0);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<DictationResult | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [slow, setSlow] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const cur = items[n];
  const lang = cur?.story.lang;
  const noSpace = lang ? language(lang).noSpace : false;

  const play = (slowly = slow) => {
    if (!cur) return;
    playSentence(cur.story.id, cur.story.lang, cur.index, textOf(cur.story, cur.story.sentences[cur.index]!), slowly ? Math.min(rate, 0.75) : rate);
  };

  useEffect(() => {
    play();
    field.current?.focus();
    return () => stopAudio();
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cur) {
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return (
      <div className="flash">
        <div className="score-ring" style={{ ["--p" as string]: avg / 100 }}><b>{avg}%</b></div>
        <h2 style={{ fontSize: 22 }}>{avg >= 80 ? "Great listening!" : avg >= 50 ? "Good work!" : "Keep practicing!"}</h2>
        <p className="muted" style={{ margin: 0 }}>You wrote {scores.length} {scores.length === 1 ? "sentence" : "sentences"} with an average of {avg}% of the words correct.</p>
        <button className="btn primary block" onClick={() => onFinish(avg)}>Done</button>
      </div>
    );
  }

  const expected = textOf(cur.story, cur.story.sentences[cur.index]!);
  const translation = cur.story.sentences[cur.index]?.translation;

  return (
    <div className="flash" style={{ textAlign: "left" }}>
      <div className="spread small muted">
        <span>Sentence {n + 1} of {items.length}</span>
        <span>{cur.story.title}</span>
      </div>
      <div className="row" style={{ justifyContent: "center", gap: 14 }}>
        <button className="icon-btn play big" aria-label="Play the sentence" onClick={() => play()}>{Icon.play}</button>
        <button className={`chip`} aria-pressed={slow} onClick={() => { setSlow(!slow); play(!slow); }}>Slow</button>
      </div>
      {!result ? (
        <>
          <textarea
            ref={field}
            className="textarea"
            rows={3}
            lang={lang}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Type what you hear"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                setResult(checkDictation(expected, typed, noSpace));
              }
            }}
          />
          <div className="spread">
            <button className="btn ghost" onClick={() => setResult(checkDictation(expected, "", noSpace))}>Show the answer</button>
            <button className="btn primary" disabled={!typed.trim()} onClick={() => setResult(checkDictation(expected, typed, noSpace))}>Check</button>
          </div>
        </>
      ) : (
        <>
          <div className="dict-result" lang={lang}>
            {result.words.map((w, i) => (
              <span key={i} className={w.ok ? "ok" : "no"}>{w.word}{noSpace ? "" : " "}</span>
            ))}
          </div>
          <p className="small" style={{ margin: 0 }}>
            <b>{result.score}%</b> of the words are right. <span className="dict-key"><span className="ok">green</span> = correct, <span className="no">red</span> = missed or wrong</span>
          </p>
          {translation && <p className="muted" style={{ margin: 0 }}>{translation}</p>}
          <button
            className="btn primary block"
            onClick={() => {
              setScores((s) => [...s, result.score]);
              setResult(null);
              setTyped("");
              setN(n + 1);
            }}
          >
            {n + 1 >= items.length ? "See result" : "Next sentence"}
          </button>
        </>
      )}
    </div>
  );
}
