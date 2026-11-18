"use client";

import { useT } from "@/lib/i18n";
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
import { Dictionary } from "@/views/Dictionary";

type Tab = "dictionary" | "words" | "saved" | "history" | "texts";
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
  const t = useT();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"due" | "az" | "seen">("due");
  const due = learner.dueWords().length;
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const toggle = (l: string) => setPicked((p) => { const n = new Set(p); if (n.has(l)) n.delete(l); else n.add(l); return n; });
  const stopPicking = () => { setPicking(false); setPicked(new Set()); };
  const practiceUrl = (mode: string, words?: string[]) => `/${lang}/practice?mode=${mode}${words ? `&from=w:${words.map(encodeURIComponent).join(",")}` : "&from=saved"}`;

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
        <div><div className="eyebrow">Your collection</div><h1>{t("note.title")}</h1></div>
        <div className="row">
          <Link className="btn sm" href={`/${lang}/packs`}>{Icon.library} Word packs</Link>
          <Link className="btn sm primary" href={`/${lang}/practice`}>{Icon.practice} Practice</Link>
        </div>
      </div>

      <div className="level-tabs" role="tablist" aria-label="Notebook">
        <button role="tab" aria-selected={tab === "dictionary"} onClick={() => setTab("dictionary")}>{Icon.dict} {t("nav.dictionary")}</button>
        <button role="tab" aria-selected={tab === "words"} onClick={() => setTab("words")}>{t("note.words")} <small>{counts.learning}</small></button>
        <button role="tab" aria-selected={tab === "saved"} onClick={() => setTab("saved")}>{t("note.saved")} <small>{saved.length}</small></button>
        <button role="tab" aria-selected={tab === "history"} onClick={() => setTab("history")}>{t("note.history")} <small>{history.length}</small></button>
        <button role="tab" aria-selected={tab === "texts"} onClick={() => setTab("texts")}>{t("note.texts")} <small>{texts.length}</small></button>
      </div>

      {tab === "dictionary" && <div style={{ marginTop: 14 }}><Dictionary lang={lang} embedded /></div>}

      {tab === "words" && (
        <>
          {counts.learning > 0 && (
            <div className="nb-practice">
              <div className="nb-stats">
                <span><b>{counts.learning}</b> to learn</span>
                <span><b>{due}</b> due now</span>
                <span><b>{counts.known}</b> known</span>
              </div>
              <span className="small muted">Practise your saved words:</span>
              <div className="nb-games">
                <Link className={`nb-game${due ? " hot" : ""}`} href={`/${lang}/practice?mode=review`}><span>🃏</span>Flashcards{due ? <small>{due} due</small> : null}</Link>
                <Link className="nb-game" href={practiceUrl("speed")}><span>⚡</span>Speed round</Link>
                <Link className="nb-game" href={practiceUrl("memory")}><span>🧠</span>Memory</Link>
                <Link className="nb-game" href={practiceUrl("spell")}><span>🔤</span>Spell it</Link>
                <Link className="nb-game" href={practiceUrl("match")}><span>🧩</span>Match</Link>
                <Link className="nb-game" href={practiceUrl("say")}><span>🎤</span>Say it</Link>
              </div>
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
              {list.length > 0 && <button className={`btn sm${picking ? " primary" : ""}`} aria-pressed={picking} onClick={() => (picking ? stopPicking() : setPicking(true))}>{picking ? "Done" : "Select"}</button>}
            </span>
          </div>
          {list.length ? (
            <div className="word-grid">
              {list.map((w) => {
                const e = meaningOf(w);
                const ctx = contextOf(w);
                return (
                  <div className={`word-card${picking ? " picking" : ""}${picked.has(w.lemma) ? " picked" : ""}`} key={w.lemma} onClick={picking ? () => toggle(w.lemma) : undefined}>
                    <div className="spread">
                      <span>
                        {picking && <input type="checkbox" className="nb-check" checked={picked.has(w.lemma)} onChange={() => toggle(w.lemma)} onClick={(e) => e.stopPropagation()} aria-label={`Select ${w.lemma}`} />}
                        <span className="l" lang={lang}>{e?.display ?? w.lemma}</span>{" "}
                        {e?.pos && <span className="pill">{e.pos}</span>}
                      </span>
                      <button className="icon-btn" aria-label={`Hear ${w.lemma}`} onClick={() => playWord(lang, w.lemma, e?.display ?? w.lemma)}>{Icon.speaker}</button>
                    </div>
                    {e?.reading && <span className="reading">{e.reading}</span>}
                    <span className="g">{e?.meaning ? <Tr>{e.meaning}</Tr> : "No meaning saved"}</span>
                    {ctx && <Link href={`/${lang}/read/${ctx.story.id}`} className="ex" lang={lang}>{ctx.text}</Link>}
                    <span className="nb-strength" title={`Strength ${Math.round(w.pKnown * 100)}%`} aria-label={`Strength ${Math.round(w.pKnown * 100)}%`}>
                      {[0, 1, 2, 3, 4].map((k) => <i key={k} className={w.pKnown > k / 5 ? "on" : ""} />)}
                    </span>
                    <div className="spread small">
                      <span className="muted">
                        Seen {w.encounters}×{w.card && w.saved === "learning" ? ` · review ${days((new Date(w.card.due).getTime() - Date.now()) / 864e5)}` : ""}
                      </span>
                      {!picking && <span className="row" style={{ gap: 6 }}>
                        {filter === "learning" ? (
                          <>
                            <button className="btn ghost sm" aria-label={`Remove ${w.lemma} from the notebook`} onClick={() => learner.setWord(w.lemma, undefined)}>Remove</button>
                            <button className="btn sm" onClick={() => learner.setWord(w.lemma, "known")}>I know it</button>
                          </>
                        ) : (
                          <button className="btn sm" onClick={() => learner.setWord(w.lemma, "learning")}>Learn again</button>
                        )}
                      </span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
          {picking && (
            <div className="nb-bar" role="toolbar" aria-label="Selected words">
              <span className="small"><b>{picked.size}</b> selected</span>
              <button className="btn ghost sm" onClick={() => setPicked(picked.size === list.length ? new Set() : new Set(list.map((w) => w.lemma)))}>{picked.size === list.length ? "None" : "All"}</button>
              {picked.size > 0 && (
                <>
                  {picked.size >= 4 ? <Link className="btn primary sm" href={practiceUrl("speed", [...picked].slice(0, 60))}>⚡ Speed</Link> : <span className="small muted">Pick 4+ for Speed</span>}
                  {picked.size >= 6 && <Link className="btn sm" href={practiceUrl("memory", [...picked].slice(0, 60))}>🧠 Memory</Link>}
                  <Link className="btn sm" href={practiceUrl("spell", [...picked].slice(0, 60))}>🔤 Spell</Link>
                  {filter !== "known" && <button className="btn sm" onClick={() => { picked.forEach((l) => learner.setWord(l, "known")); stopPicking(); }}>I know these</button>}
                  {filter !== "learning" && <button className="btn sm" onClick={() => { picked.forEach((l) => learner.setWord(l, "learning")); stopPicking(); }}>Learn again</button>}
                  {filter === "learning" && <button className="btn ghost sm" onClick={() => { picked.forEach((l) => learner.setWord(l, undefined)); stopPicking(); }}>Remove</button>}
                </>
              )}
            </div>
          )}
          {!list.length && (
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
