"use client";

import { dictionary, language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { wordLevelOf } from "@storyling/learner";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { playSentence, playWord } from "@/lib/audio";
import { useLearner } from "@/lib/learner";
import { textOf, useStories } from "@/lib/stories";
import { Icon } from "@/components/ui";
import { useTranslated } from "@/lib/translate";

/** Letters that are hard to type, shown as keys under the search box. */
const KEYS: Partial<Record<LangCode, string[]>> = {
  de: ["ä", "Ä", "ö", "Ö", "ü", "Ü", "ß"],
  es: ["á", "é", "í", "ó", "ú", "ü", "ñ", "¿", "¡"],
  fr: ["à", "â", "ç", "é", "è", "ê", "ë", "î", "ï", "ô", "û", "ù", "œ"],
  tr: ["ç", "ğ", "ı", "İ", "ö", "ş", "ü"],
  pt: ["á", "â", "ã", "à", "ç", "é", "ê", "í", "ó", "ô", "õ", "ú"],
};

type Tab = "word" | "example";

/** Dictionary: search by word or meaning, or search the example sentences in the stories. */
export function Dictionary({ lang }: { lang: LangCode }) {
  const learner = useLearner(lang);
  const stories = useStories(lang);
  const meta = language(lang);
  const all = useMemo(() => dictionary(lang), [lang]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("word");
  const input = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all.slice(0, 40);
    return all
      .filter((e) => e.display.toLowerCase().includes(s) || e.meaning.toLowerCase().includes(s) || e.reading?.toLowerCase().includes(s))
      .sort((a, b) => {
        const rank = (e: (typeof all)[number]) => (e.display.toLowerCase() === s ? 0 : e.display.toLowerCase().startsWith(s) ? 1 : 2);
        return rank(a) - rank(b) || a.display.length - b.display.length;
      })
      .slice(0, 60);
  }, [all, q]);

  const trMeanings = useTranslated(results.slice(0, 40).map((e) => e.meaning));
  const sentences = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const out: { story: (typeof stories)[number]; index: number; text: string; translation?: string }[] = [];
    for (const st of stories)
      for (const [index, sent] of st.sentences.entries()) {
        const text = textOf(st, sent);
        if (text.toLowerCase().includes(s) || sent.translation?.toLowerCase().includes(s)) out.push({ story: st, index, text, translation: sent.translation });
        if (out.length >= 40) return out;
      }
    return out;
  }, [stories, q]);

  const example = (lemma: string) => {
    for (const st of stories)
      for (const s of st.sentences)
        if (s.tokens.some((t) => t.lemma === lemma)) return { story: st, text: textOf(st, s) };
    return undefined;
  };

  const insert = (ch: string) => {
    const el = input.current;
    const start = el?.selectionStart ?? q.length;
    const end = el?.selectionEnd ?? q.length;
    setQ(q.slice(0, start) + ch + q.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + ch.length, start + ch.length);
    });
  };

  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">{meta.name} · {all.length} words</div><h1>Dictionary</h1></div>
      </div>

      {KEYS[lang] && (
        <div className="keys" role="group" aria-label="Special letters">
          {KEYS[lang]!.map((k) => <button key={k} onClick={() => insert(k)} lang={lang} aria-label={`Insert ${k}`}>{k}</button>)}
        </div>
      )}
      <input ref={input} className="input" type="search" autoFocus placeholder={`Search in ${meta.name} or English`} aria-label="Search the dictionary" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 12 }} />
      <div className="filters" role="tablist" aria-label="Search in" style={{ marginBottom: 12 }}>
        <button role="tab" className="chip" aria-selected={tab === "word"} aria-pressed={tab === "word"} onClick={() => setTab("word")}>Word</button>
        <button role="tab" className="chip" aria-selected={tab === "example"} aria-pressed={tab === "example"} onClick={() => setTab("example")}>Examples{q.trim().length >= 2 ? ` · ${sentences.length}${sentences.length >= 40 ? "+" : ""}` : ""}</button>
      </div>

      {tab === "word" && (
        <div className="table">
          {results.map((e, ri) => {
            const saved = learner.word(e.lemma)?.saved === "learning";
            const known = !saved && learner.wordState(e.lemma) === "known";
            const ex = example(e.lemma);
            const lv = wordLevelOf(lang, e.lemma);
            return (
              <div className="trow" key={e.lemma}>
                <span style={{ minWidth: 0 }}>
                  <span className="l" lang={lang}>{e.display}</span> {e.reading && <span className="reading">{e.reading}</span>}{" "}
                  <span className="pill">{e.pos}</span>
                  {lv !== undefined && <span className="pill" style={{ color: `var(--lv${Math.min(lv, 4)})`, marginLeft: 4 }}>{meta.levels[lv]}</span>}
                  <span className="g" style={{ display: "block" }}>{ri < 40 ? trMeanings.texts[ri] : e.meaning}</span>
                  {ex && <Link href={`/${lang}/read/${ex.story.id}`} className="small muted" lang={lang} style={{ display: "block", fontFamily: "var(--f-read)" }}>{ex.text}</Link>}
                </span>
                <span className="row">
                  <button className="icon-btn" aria-label={`Hear ${e.display}`} onClick={() => playWord(lang, e.lemma, e.display)}>{Icon.speaker}</button>
                  {saved ? (
                    <span className="pill">Saved</span>
                  ) : known ? (
                    <span className="pill fit-easy">Known</span>
                  ) : (
                    <button className="btn sm" onClick={() => learner.setWord(e.lemma, "learning")}>+ Notebook</button>
                  )}
                </span>
              </div>
            );
          })}
          {!results.length && <div className="trow"><span className="muted">No words found.</span></div>}
        </div>
      )}

      {tab === "example" && (
        <div className="table">
          {q.trim().length < 2 && <div className="trow"><span className="muted">Type a word or phrase to find sentences that use it.</span></div>}
          {sentences.map((x) => (
            <div className="trow" key={`${x.story.id}-${x.index}`}>
              <span style={{ minWidth: 0 }}>
                <Link href={`/${lang}/read/${x.story.id}`} lang={lang} style={{ fontFamily: "var(--f-read)", fontSize: 19, textDecoration: "none", color: "var(--ink)" }}>{x.text}</Link>
                {x.translation && <span className="g" style={{ display: "block" }}>{x.translation}</span>}
                <span className="small muted">{x.story.title}</span>
              </span>
              <button className="icon-btn" aria-label="Hear this sentence" onClick={() => playSentence(x.story.id, lang, x.index, x.text)}>{Icon.speaker}</button>
            </div>
          ))}
          {q.trim().length >= 2 && !sentences.length && <div className="trow"><span className="muted">No sentences found.</span></div>}
        </div>
      )}
    </>
  );
}
