"use client";

import { grammarFor, language, type GrammarTopic } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLearner } from "@/lib/learner";
import { shuffle } from "@/lib/words";
import { Tr } from "@/lib/translate";

/** Grammar: a short explanation per topic, then exercises with an explanation after every answer. */
export function Grammar({ lang }: { lang: LangCode }) {
  const meta = language(lang);
  const learner = useLearner(lang);
  const topics = grammarFor(lang);
  const [open, setOpen] = useState<GrammarTopic | null>(null);

  if (open) return <Lesson key={open.id} topic={open} lang={lang} onBack={() => setOpen(null)} />;

  const levels = [...new Set(topics.map((t) => t.level))];
  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">{meta.name} · {topics.length} topics</div><h1>Grammar</h1></div>
        <Link className="btn sm" href={`/${lang}/practice`}>Practice</Link>
      </div>
      {!topics.length && <div className="empty"><p className="muted">Grammar lessons are ready for German. More languages are coming; the mock exams already work for every language.</p></div>}
      {levels.map((lv) => (
        <section key={lv} style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18 }}>{lv}</h2>
          <div className="game-grid">
            {topics.filter((t) => t.level === lv).map((t) => {
              const best = learner.games[`grammar-${t.id}`];
              return (
                <button key={t.id} className="game-card" onClick={() => setOpen(t)} style={{ textAlign: "left" }}>
                  <span className="t">{t.title}</span>
                  <span className="muted small">{t.items.length} exercises</span>
                  <span className="small gm">{best ? `Best ${best.best}% · played ${best.played}×` : "Not played yet"}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

function Lesson({ topic, lang, onBack }: { topic: GrammarTopic; lang: LangCode; onBack: () => void }) {
  const learner = useLearner(lang);
  const [round, setRound] = useState(0);
  const [started, setStarted] = useState(false);
  const items = useMemo(() => shuffle(topic.items).map((i) => ({ ...i, o: shuffle(i.o) })), [topic, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const q = items[n];

  const paragraphs = topic.explain.split("\n\n");
  if (!started)
    return (
      <>
        <div className="page-head">
          <div className="row"><button className="btn ghost sm" onClick={onBack}>← Grammar</button><h1 style={{ fontSize: 26 }}>{topic.title}</h1></div>
        </div>
        <div className="card stack" style={{ maxWidth: 680 }}>
          <span className="pill">{topic.level}</span>
          {paragraphs.map((p, i) => {
            const lines = p.split("\n");
            return (
              <div key={i}>
                {lines.map((l, k) => l.startsWith("- ") ? <div key={k} lang={lang} style={{ paddingLeft: 14 }}>• {l.slice(2)}</div> : <p key={k} style={{ margin: "0 0 6px" }}><Tr>{l}</Tr></p>)}
              </div>
            );
          })}
          <button className="btn primary block" onClick={() => setStarted(true)}>Start {topic.items.length} exercises</button>
        </div>
      </>
    );

  if (!q) {
    const pct = Math.round((score / items.length) * 100);
    return (
      <div className="flash">
        <div className="score-ring" style={{ ["--p" as string]: pct / 100 }}><b>{pct}%</b></div>
        <h2 style={{ fontSize: 22 }}>{pct >= 80 ? "Great!" : pct >= 50 ? "Good work!" : "Read the rule again and retry."}</h2>
        <p className="muted" style={{ margin: 0 }}>{score} of {items.length} correct.</p>
        <button className="btn primary block" onClick={() => { setRound((r) => r + 1); setN(0); setScore(0); setChosen(null); }}>Try again</button>
        <button className="btn block" onClick={onBack}>All topics</button>
      </div>
    );
  }

  return (
    <>
      <div className="page-head"><div className="row"><button className="btn ghost sm" onClick={onBack}>← Grammar</button><h1 style={{ fontSize: 26 }}>{topic.title}</h1></div></div>
      <div className="flash" style={{ textAlign: "left" }}>
        <div className="spread small muted"><span>Exercise {n + 1} of {items.length}</span><span>{score} correct</span></div>
        <div lang={lang} style={{ fontFamily: "var(--f-read)", fontSize: 22, lineHeight: 1.5 }}>{q.q}</div>
        <div className="choices">
          {q.o.map((o) => (
            <button key={o} lang={lang} disabled={chosen !== null}
              className={`choice${chosen !== null && o === q.a ? " ok" : ""}${chosen === o && o !== q.a ? " no" : ""}`}
              onClick={() => { setChosen(o); if (o === q.a) setScore((s) => s + 1); }}>{o}</button>
          ))}
        </div>
        {chosen !== null && (
          <>
            <p style={{ margin: 0 }}><b>{chosen === q.a ? "Correct. " : "Not quite. "}</b><Tr>{q.why}</Tr>{q.tr ? <span className="muted"> — <Tr>{q.tr}</Tr></span> : null}</p>
            <button className="btn primary block" onClick={() => {
              if (n + 1 >= items.length) learner.recordGame(`grammar-${topic.id}`, Math.round(((score) / items.length) * 100));
              setN(n + 1);
              setChosen(null);
            }}>{n + 1 >= items.length ? "See result" : "Next"}</button>
          </>
        )}
      </div>
    </>
  );
}
