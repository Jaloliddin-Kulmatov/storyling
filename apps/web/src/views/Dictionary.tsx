"use client";

import { dictionary, language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import Link from "next/link";
import { useMemo, useState } from "react";
import { playWord } from "@/lib/audio";
import { useLearner } from "@/lib/learner";
import { textOf, useStories } from "@/lib/stories";
import { Icon } from "@/components/ui";

export function Dictionary({ lang }: { lang: LangCode }) {
  const learner = useLearner(lang);
  const stories = useStories(lang);
  const all = useMemo(() => dictionary(lang), [lang]);
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all.slice(0, 40);
    return all
      .filter((e) => e.display.toLowerCase().includes(s) || e.meaning.toLowerCase().includes(s) || e.reading?.toLowerCase().includes(s))
      .sort((a, b) => Number(!a.display.toLowerCase().startsWith(s)) - Number(!b.display.toLowerCase().startsWith(s)))
      .slice(0, 60);
  }, [all, q]);

  const example = (lemma: string) => {
    for (const st of stories)
      for (const s of st.sentences)
        if (s.tokens.some((t) => t.lemma === lemma)) return { story: st, text: textOf(st, s) };
    return undefined;
  };

  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">{language(lang).name} · {all.length} words</div><h1>Dictionary</h1></div>
      </div>
      <input className="input" type="search" autoFocus placeholder={`Search in ${language(lang).name} or English`} aria-label="Search the dictionary" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 14 }} />
      <div className="table">
        {results.map((e) => {
          const saved = learner.word(e.lemma)?.saved === "learning";
          const known = !saved && learner.wordState(e.lemma) === "known";
          const ex = example(e.lemma);
          return (
            <div className="trow" key={e.lemma}>
              <span style={{ minWidth: 0 }}>
                <span className="l" lang={lang}>{e.display}</span> {e.reading && <span className="reading">{e.reading}</span>}{" "}
                <span className="pill">{e.pos}</span>
                <span className="g" style={{ display: "block" }}>{e.meaning}</span>
                {ex && <Link href={`/${lang}/read/${ex.story.id}`} className="small muted" lang={lang} style={{ display: "block", fontFamily: "var(--f-read)" }}>{ex.text}</Link>}
              </span>
              <span className="row">
                <button className="icon-btn" aria-label={`Hear ${e.display}`} onClick={() => playWord(lang, e.lemma, e.display)}>{Icon.speaker}</button>
                {saved ? (
                  <span className="pill">Saved</span>
                ) : known ? (
                  <span className="pill fit-easy">Known</span>
                ) : (
                  <button className="btn sm" onClick={() => learner.setWord(e.lemma, "learning")}>Review</button>
                )}
              </span>
            </div>
          );
        })}
        {!results.length && <div className="trow"><span className="muted">No words found.</span></div>}
      </div>
    </>
  );
}
