"use client";

import { displayState, type LangCode } from "@storyling/core";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { playWord } from "@/lib/audio";
import { useLearner } from "@/lib/learner";
import { useRankedStories } from "@/lib/rank";
import { useWordInfo } from "@/lib/words";
import { Icon, StoryRow } from "@/components/ui";

type Tab = "words" | "saved" | "texts";
type Filter = "learning" | "known" | "ignored";

const days = (n: number) => (n < 1 ? "today" : n < 30 ? `in ${Math.round(n)}d` : `in ${Math.round(n / 30)}mo`);

/** Notebook: saved words, saved (bookmarked) stories and the learner's own texts. */
export function Notebook({ lang }: { lang: LangCode }) {
  const learner = useLearner(lang);
  const ranked = useRankedStories(lang);
  const { meaningOf, contextOf } = useWordInfo(lang);
  const params = useSearchParams();
  const router = useRouter();
  const tab = (params.get("tab") as Tab) || "words";
  const setTab = (t: Tab) => router.replace(`/${lang}/words${t === "words" ? "" : `?tab=${t}`}`, { scroll: false });
  const [filter, setFilter] = useState<Filter>("learning");
  const [q, setQ] = useState("");

  const counts = {
    learning: learner.allWords.filter((w) => w.saved === "learning").length,
    known: learner.knownCount,
    ignored: learner.allWords.filter((w) => w.saved === "ignored").length,
  };
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return learner.allWords
      .filter((w) => (filter === "learning" ? w.saved === "learning" : filter === "ignored" ? w.saved === "ignored" : displayState(w) === "known"))
      .filter((w) => !s || w.lemma.toLowerCase().includes(s) || meaningOf(w)?.meaning.toLowerCase().includes(s))
      .sort((a, b) => a.lemma.localeCompare(b.lemma));
  }, [learner.allWords, filter, q, meaningOf]);

  const saved = learner.favorites.map((id) => ranked.find((r) => r.story.id === id)).filter((r) => !!r);
  const texts = ranked.filter((r) => learner.stories.some((s) => s.id === r.story.id));

  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">Your collection</div><h1>Notebook</h1></div>
        <Link className="btn sm primary" href={`/${lang}/practice`}>{Icon.practice} Practice</Link>
      </div>

      <div className="level-tabs" role="tablist" aria-label="Notebook">
        <button role="tab" aria-selected={tab === "words"} onClick={() => setTab("words")}>Words <small>{counts.learning}</small></button>
        <button role="tab" aria-selected={tab === "saved"} onClick={() => setTab("saved")}>Saved stories <small>{saved.length}</small></button>
        <button role="tab" aria-selected={tab === "texts"} onClick={() => setTab("texts")}>My texts <small>{texts.length}</small></button>
      </div>

      {tab === "words" && (
        <>
          <div className="spread" style={{ margin: "14px 0" }}>
            <div className="filters">
              {(["learning", "known", "ignored"] as Filter[]).map((f) => (
                <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f === "learning" ? "To learn" : f === "known" ? "Known" : "Ignored"} · {counts[f]}
                </button>
              ))}
            </div>
            <input className="input" type="search" placeholder="Search words" aria-label="Search words" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 220 }} />
          </div>
          {list.length ? (
            <div className="word-grid">
              {list.map((w) => {
                const e = meaningOf(w);
                const ctx = contextOf(w);
                return (
                  <div className="word-card" key={w.lemma}>
                    <div className="spread">
                      <span>
                        <span className="l" lang={lang}>{e?.display ?? w.lemma}</span>{" "}
                        {e?.pos && <span className="pill">{e.pos}</span>}
                      </span>
                      <button className="icon-btn" aria-label={`Hear ${w.lemma}`} onClick={() => playWord(lang, w.lemma, e?.display ?? w.lemma)}>{Icon.speaker}</button>
                    </div>
                    {e?.reading && <span className="reading">{e.reading}</span>}
                    <span className="g">{e?.meaning ?? "No meaning saved"}</span>
                    {ctx && <Link href={`/${lang}/read/${ctx.story.id}`} className="ex" lang={lang}>{ctx.text}</Link>}
                    <div className="spread small">
                      <span className="muted">
                        Seen {w.encounters}×{w.card && w.saved === "learning" ? ` · review ${days((new Date(w.card.due).getTime() - Date.now()) / 864e5)}` : ""}
                      </span>
                      {filter === "learning" ? (
                        <button className="btn sm" onClick={() => learner.setWord(w.lemma, "known")}>I know it</button>
                      ) : (
                        <button className="btn sm" onClick={() => learner.setWord(w.lemma, "learning")}>Learn again</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty">
              <p className="muted" style={{ margin: 0 }}>
                {filter === "learning" ? "Tap a word while reading and press Review to add it here." : "No words here yet."}
              </p>
            </div>
          )}
        </>
      )}

      {tab === "saved" && (
        <div className="list" style={{ marginTop: 14 }}>
          {saved.map((r) => <StoryRow key={r.story.id} {...r} />)}
          {!saved.length && (
            <div className="empty">
              <p className="muted">Press the bookmark on any story to keep it here.</p>
              <Link className="btn primary" href={`/${lang}`}>Browse stories</Link>
            </div>
          )}
        </div>
      )}

      {tab === "texts" && (
        <div className="list" style={{ marginTop: 14 }}>
          {texts.map((r) => <StoryRow key={r.story.id} {...r} />)}
          <Link className="btn" href={`/${lang}/add`} style={{ justifySelf: "start" }}>{Icon.add} Add a text</Link>
        </div>
      )}
    </>
  );
}
