"use client";

import { Tr } from "@/lib/translate";
import { displayState, type LangCode } from "@storyling/core";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { playWord } from "@/lib/audio";
import { useLearner } from "@/lib/learner";
import { useRankedStories, type Ranked } from "@/lib/rank";
import { useWordInfo } from "@/lib/words";
import { Icon, StoryRow } from "@/components/ui";

type Tab = "words" | "saved" | "history" | "texts";
type Filter = "learning" | "known" | "ignored";

const days = (n: number) => (n <= 0 ? "now" : n < 1 / 24 ? `in ${Math.max(1, Math.round(n * 1440))} min` : n < 1 ? `in ${Math.round(n * 24)}h` : n < 30 ? `in ${Math.round(n)}d` : `in ${Math.round(n / 30)}mo`);

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
  const [sort, setSort] = useState<"due" | "az" | "seen">("due");
  const due = learner.dueWords().length;

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
      .sort((a, b) =>
        sort === "az"
          ? a.lemma.localeCompare(b.lemma)
          : sort === "seen"
            ? b.encounters - a.encounters
            : (a.card ? new Date(a.card.due).getTime() : Infinity) - (b.card ? new Date(b.card.due).getTime() : Infinity) || a.lemma.localeCompare(b.lemma),
      );
  }, [learner.allWords, filter, q, meaningOf, sort]);

  const saved = learner.favorites.map((id) => ranked.find((r) => r.story.id === id)).filter((r) => !!r);
  const texts = ranked.filter((r) => learner.stories.some((s) => s.id === r.story.id));
  const history = learner.history.map((h) => ({ at: h.at, r: ranked.find((r) => r.story.id === h.id) })).filter((h): h is { at: number; r: Ranked } => !!h.r);

  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">Your collection</div><h1>Notebook</h1></div>
        <div className="row">
          <Link className="btn sm" href={`/${lang}/packs`}>{Icon.library} Word packs</Link>
          <Link className="btn sm" href={`/${lang}/dictionary`}>{Icon.dict} Dictionary</Link>
          <Link className="btn sm primary" href={`/${lang}/practice`}>{Icon.practice} Practice</Link>
        </div>
      </div>

      <div className="level-tabs" role="tablist" aria-label="Notebook">
        <button role="tab" aria-selected={tab === "words"} onClick={() => setTab("words")}>Words <small>{counts.learning}</small></button>
        <button role="tab" aria-selected={tab === "saved"} onClick={() => setTab("saved")}>Saved stories <small>{saved.length}</small></button>
        <button role="tab" aria-selected={tab === "history"} onClick={() => setTab("history")}>History <small>{history.length}</small></button>
        <button role="tab" aria-selected={tab === "texts"} onClick={() => setTab("texts")}>My texts <small>{texts.length}</small></button>
      </div>

      {tab === "words" && (
        <>
          {counts.learning > 0 && (
            <div className="review-hero" style={{ marginTop: 14 }}>
              <span className="rh-icon" aria-hidden="true">{Icon.words}</span>
              <span className="rh-body">
                <b>{due ? `${due} of ${counts.learning} words are due` : `${counts.learning} words saved, none due`}</b>
                <span className="muted small">Flashcards bring each word back just before you would forget it.</span>
              </span>
              <span className="row">
                <Link className="btn sm" href={`/${lang}/practice?mode=match`}>Match game</Link>
                <Link className="btn primary sm" href={`/${lang}/practice?mode=review`}>{due ? "Review now" : "Review anyway"}</Link>
              </span>
            </div>
          )}
          <div className="spread" style={{ margin: "14px 0", flexWrap: "wrap", gap: 8 }}>
            <div className="filters">
              {(["learning", "known", "ignored"] as Filter[]).map((f) => (
                <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                  {f === "learning" ? "To learn" : f === "known" ? "Known" : "Ignored"} · {counts[f]}
                </button>
              ))}
            </div>
            <span className="row" style={{ flexWrap: "nowrap" }}>
              <select className="select" aria-label="Sort words" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} style={{ width: "auto" }}>
                <option value="due">Due first</option>
                <option value="az">A–Z</option>
                <option value="seen">Most seen</option>
              </select>
              <input className="input" type="search" placeholder="Search words" aria-label="Search words" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 180 }} />
            </span>
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
                    <span className="g">{e?.meaning ? <Tr>{e.meaning}</Tr> : "No meaning saved"}</span>
                    {ctx && <Link href={`/${lang}/read/${ctx.story.id}`} className="ex" lang={lang}>{ctx.text}</Link>}
                    <div className="spread small">
                      <span className="muted">
                        Seen {w.encounters}×{w.card && w.saved === "learning" ? ` · review ${days((new Date(w.card.due).getTime() - Date.now()) / 864e5)}` : ""}
                      </span>
                      <span className="row" style={{ gap: 6 }}>
                        {filter === "learning" ? (
                          <>
                            <button className="btn ghost sm" aria-label={`Remove ${w.lemma} from the notebook`} onClick={() => learner.setWord(w.lemma, undefined)}>Remove</button>
                            <button className="btn sm" onClick={() => learner.setWord(w.lemma, "known")}>I know it</button>
                          </>
                        ) : (
                          <button className="btn sm" onClick={() => learner.setWord(w.lemma, "learning")}>Learn again</button>
                        )}
                      </span>
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

      {tab === "history" && (
        <div className="list" style={{ marginTop: 14 }}>
          {history.map(({ at, r }) => (
            <div key={r.story.id} style={{ display: "grid", gap: 2 }}>
              <span className="small muted" style={{ paddingLeft: 4 }}>{new Date(at).toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" })} · {new Date(at).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}</span>
              <StoryRow {...r} />
            </div>
          ))}
          {!history.length && (
            <div className="empty">
              <p className="muted">Stories you open will be listed here.</p>
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
