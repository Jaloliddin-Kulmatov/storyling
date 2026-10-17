"use client";

import { lookup } from "@storyling/content";
import { displayState, previewIntervals, type LangCode, type ReviewGrade } from "@storyling/core";
import Link from "next/link";
import { useMemo, useState } from "react";
import { playWord } from "@/lib/audio";
import { useLearner, type StoredWord } from "@/lib/learner";
import { lookupIn, textOf, useStories } from "@/lib/stories";
import { Icon } from "@/components/ui";

const GRADES: { g: ReviewGrade; label: string; cls: string }[] = [
  { g: "again", label: "Again", cls: "danger" },
  { g: "hard", label: "Hard", cls: "" },
  { g: "good", label: "Good", cls: "primary" },
  { g: "easy", label: "Easy", cls: "" },
];

const days = (n: number) => (n < 1 ? "<1d" : n < 30 ? `${Math.round(n)}d` : `${Math.round(n / 30)}mo`);

type Filter = "learning" | "known" | "ignored";

export function Words({ lang }: { lang: LangCode }) {
  const learner = useLearner(lang);
  const stories = useStories(lang);
  const [tab, setTab] = useState<"review" | "list">("review");
  const [filter, setFilter] = useState<Filter>("learning");
  const [flipped, setFlipped] = useState(false);
  // Fix the queue when the session starts so grading doesn't reshuffle it.
  const [queue, setQueue] = useState<string[]>(() => learner.dueWords().map((w) => w.lemma));
  const [doneCount, setDoneCount] = useState(0);

  const current = queue[0] ? learner.word(queue[0]) : undefined;

  const meaningOf = (w: StoredWord) => {
    const story = w.source ? stories.find((s) => s.id === w.source!.storyId) : undefined;
    return (story ? lookupIn(story, w.lemma) : undefined) ?? lookup(lang, w.lemma);
  };

  function contextOf(w: StoredWord) {
    const story = w.source ? stories.find((s) => s.id === w.source!.storyId) : undefined;
    const s = story?.sentences[w.source!.sentence];
    if (story && s) return { text: textOf(story, s), surface: s.tokens.find((t) => t.lemma === w.lemma)?.surface ?? w.lemma, translation: s.translation };
    const hit = stories.flatMap((st) => st.sentences.map((s) => ({ st, s }))).find(({ s }) => s.tokens.some((t) => t.lemma === w.lemma));
    if (!hit) return undefined;
    return { text: textOf(hit.st, hit.s), surface: hit.s.tokens.find((t) => t.lemma === w.lemma)!.surface, translation: hit.s.translation };
  }

  const list = useMemo(
    () =>
      learner.allWords
        .filter((w) => (filter === "learning" ? w.saved === "learning" : filter === "ignored" ? w.saved === "ignored" : displayState(w) === "known"))
        .sort((a, b) => a.lemma.localeCompare(b.lemma)),
    [learner.allWords, filter],
  );

  function grade(g: ReviewGrade) {
    if (!current) return;
    learner.grade(current.lemma, g);
    setFlipped(false);
    setDoneCount((n) => n + 1);
    // "Again" goes to the back of this session's queue.
    setQueue((q) => (g === "again" ? [...q.slice(1), q[0]!] : q.slice(1)));
  }

  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">{learner.learningCount} saved · {learner.knownCount} known</div><h1>Words</h1></div>
        <div className="seg" role="group" aria-label="View">
          <button aria-pressed={tab === "review"} onClick={() => setTab("review")}>Review</button>
          <button aria-pressed={tab === "list"} onClick={() => setTab("list")}>Word list</button>
        </div>
      </div>

      {tab === "review" && (
        current ? (
          <Card key={current.lemma} word={current} meaning={meaningOf(current)} ctx={contextOf(current)} lang={lang} flipped={flipped} onFlip={() => setFlipped(true)} onGrade={grade} left={queue.length} />
        ) : (
          <div className="empty">
            <h2 style={{ fontSize: 22 }}>{doneCount ? `Done! ${doneCount} ${doneCount === 1 ? "card" : "cards"} reviewed.` : "Nothing to review right now"}</h2>
            <p className="muted">
              {learner.learningCount
                ? "Saved words come back when they are due. Reading stories that use them also counts as review."
                : "Tap a word while reading and press Review to save it here."}
            </p>
            <Link className="btn primary" href={`/${lang}`}>Read a story</Link>
          </div>
        )
      )}

      {tab === "list" && (
        <>
          <div className="filters" style={{ marginBottom: 12 }}>
            {(["learning", "known", "ignored"] as Filter[]).map((f) => (
              <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === "learning" ? "Saved" : f === "known" ? "Known" : "Ignored"}</button>
            ))}
          </div>
          {list.length ? (
            <div className="table">
              {list.map((w) => {
                const e = meaningOf(w);
                return (
                  <div className="trow" key={w.lemma}>
                    <span style={{ minWidth: 0 }}>
                      <span className="l" lang={lang}>{e?.display ?? w.lemma}</span>{" "}
                      {e?.reading && <span className="reading">{e.reading}</span>}
                      <span className="g" style={{ display: "block" }}>{e?.meaning ?? "—"}{w.card && w.saved === "learning" ? ` · next in ${days((new Date(w.card.due).getTime() - Date.now()) / 864e5)}` : ""}</span>
                    </span>
                    <span className="row">
                      <button className="icon-btn" aria-label={`Hear ${w.lemma}`} onClick={() => playWord(lang, w.lemma, e?.display ?? w.lemma)}>{Icon.speaker}</button>
                      {filter === "learning" && <button className="btn sm" onClick={() => learner.setWord(w.lemma, "known")}>Known</button>}
                      {filter !== "learning" && <button className="btn sm" onClick={() => learner.setWord(w.lemma, "learning")}>Review</button>}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty"><p className="muted" style={{ margin: 0 }}>No words here yet.</p></div>
          )}
        </>
      )}
    </>
  );
}

function Card({ word, meaning, ctx, lang, flipped, onFlip, onGrade, left }: {
  word: StoredWord;
  meaning: ReturnType<typeof lookup>;
  ctx?: { text: string; surface: string; translation?: string };
  lang: LangCode;
  flipped: boolean;
  onFlip: () => void;
  onGrade: (g: ReviewGrade) => void;
  left: number;
}) {
  const intervals = word.card ? previewIntervals(word.card) : undefined;
  return (
    <div className="flash">
      <div className="spread small muted"><span>{left} left</span><span>{word.encounters}× seen in stories</span></div>
      <div className="row" style={{ justifyContent: "center" }}>
        <span className="lemma" lang={lang}>{meaning?.display ?? word.lemma}</span>
        <button className="icon-btn" aria-label="Hear the word" onClick={() => playWord(lang, word.lemma, meaning?.display ?? word.lemma)}>{Icon.speaker}</button>
      </div>
      {ctx && (
        <div className="ctx" lang={lang}>
          {ctx.text.split(ctx.surface).map((p, i, a) => <span key={i}>{p}{i < a.length - 1 && <mark>{ctx.surface}</mark>}</span>)}
        </div>
      )}
      {!flipped ? (
        <button className="btn primary block" onClick={onFlip} autoFocus>Show meaning</button>
      ) : (
        <>
          <div>
            {meaning?.reading && <div className="reading">{meaning.reading}</div>}
            <div style={{ fontSize: 22, fontWeight: 700 }}>{meaning?.meaning ?? "—"}</div>
            {meaning?.pos && <div className="muted small">{meaning.pos}</div>}
            {ctx?.translation && <p className="muted" style={{ margin: "8px 0 0" }}>{ctx.translation}</p>}
          </div>
          <div className="grades">
            {GRADES.map(({ g, label, cls }) => (
              <button key={g} className={`btn ${cls}`} onClick={() => onGrade(g)}>
                {label}
                {intervals && <small>{days(intervals[g] / 864e5)}</small>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
