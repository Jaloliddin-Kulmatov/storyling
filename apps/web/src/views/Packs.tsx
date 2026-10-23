"use client";

import { Tr } from "@/lib/translate";
import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { wordPacks } from "@storyling/learner";
import Link from "next/link";
import { useState } from "react";
import { playWord } from "@/lib/audio";
import { useLearner } from "@/lib/learner";
import { Icon } from "@/components/ui";

const BATCH = 20; // words added per tap, easiest first, so the review queue stays manageable
const SHOWN = 40;

/** Word packs: vocabulary by topic. Add a whole pack to the notebook, or pick words one by one. */
export function Packs({ lang }: { lang: LangCode }) {
  const learner = useLearner(lang);
  const meta = language(lang);
  const packs = wordPacks(lang);
  const [open, setOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [all, setAll] = useState<Set<string>>(new Set());

  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">{meta.name} · by topic</div><h1>Word packs</h1></div>
        <Link className="btn sm" href={`/${lang}/words`}>{Icon.notebook} Notebook</Link>
      </div>
      <p className="muted" style={{ marginTop: -8 }}>Learn the words of a topic before you read about it. Add the whole pack to your notebook, then review it with flashcards.</p>

      <div className="stack">
        {packs.map((p) => {
          const known = p.words.filter((w) => learner.wordState(w.lemma) === "known").length;
          const saved = p.words.filter((w) => learner.word(w.lemma)?.saved === "learning").length;
          const isOpen = open === p.topic;
          const todo = p.words.filter((w) => learner.wordState(w.lemma) !== "known" && learner.word(w.lemma)?.saved !== "learning");
          return (
            <section key={p.topic} className="card" aria-label={p.label}>
              <button className="spread" style={{ width: "100%", background: "none", border: 0, textAlign: "left", padding: 0 }} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : p.topic)}>
                <span>
                  <b style={{ fontSize: 18 }}>{p.label}</b>
                  <span className="muted small" style={{ display: "block" }}>{p.words.length} words · {known} known · {saved} in notebook</span>
                </span>
                <span className="btn sm ghost">{isOpen ? "Hide" : "Show words"}</span>
              </button>
              {isOpen && (
                <>
                  <div className="row" style={{ margin: "12px 0" }}>
                    <button
                      className="btn primary sm"
                      disabled={!todo.length}
                      onClick={() => {
                        const next = todo.slice(0, BATCH);
                        learner.addWords(next.map((w) => w.lemma));
                        setToast(`${next.length} ${next.length === 1 ? "word" : "words"} added to your notebook`);
                        setTimeout(() => setToast(null), 3000);
                      }}
                    >
                      {todo.length ? `Add the next ${Math.min(BATCH, todo.length)} to notebook` : "All added"}
                    </button>
                    <Link className="btn sm" href={`/${lang}/practice?mode=review`}>Review flashcards</Link>
                  </div>
                  <div className="table">
                    {(all.has(p.topic) ? p.words : p.words.slice(0, SHOWN)).map((w) => {
                      const state = learner.wordState(w.lemma);
                      const isSaved = learner.word(w.lemma)?.saved === "learning";
                      return (
                        <div className="trow" key={w.lemma}>
                          <span style={{ minWidth: 0 }}>
                            <span className="l" lang={lang}>{w.display}</span> {w.reading && <span className="reading">{w.reading}</span>}{" "}
                            <span className="pill" style={{ color: `var(--lv${Math.min(w.level, 4)})` }}>{meta.levels[w.level]}</span>
                            <span className="g" style={{ display: "block" }}><Tr>{w.meaning}</Tr></span>
                          </span>
                          <span className="row">
                            <button className="icon-btn" aria-label={`Hear ${w.display}`} onClick={() => playWord(lang, w.lemma, w.display)}>{Icon.speaker}</button>
                            {state === "known" ? <span className="pill fit-easy">Known</span> : isSaved ? <span className="pill">Saved</span> : (
                              <button className="btn sm" onClick={() => learner.setWord(w.lemma, "learning")}>+ Notebook</button>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {p.words.length > SHOWN && !all.has(p.topic) && (
                    <button className="btn sm ghost" style={{ marginTop: 10 }} onClick={() => setAll((a) => new Set(a).add(p.topic))}>Show all {p.words.length} words</button>
                  )}
                </>
              )}
            </section>
          );
        })}
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
