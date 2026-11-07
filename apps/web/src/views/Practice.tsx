"use client";

import { useT } from "@/lib/i18n";
import { Tr } from "@/lib/translate";
import { ARTICLE, DE_GENDER, language, lookup, pictureOf, pictureWords } from "@storyling/content";
import { previewIntervals, type LangCode, type ReviewGrade, type Sentence } from "@storyling/core";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { canSpeak, playSentence, playWord, stopAudio } from "@/lib/audio";
import { FUNCTION_POS, wordLevelOf } from "@storyling/learner";
import { useLearner, type StoredWord } from "@/lib/learner";
import { isUserStory, lookupIn, PUNCT, textOf, useStories, type AnyStory } from "@/lib/stories";
import { highlight, shuffle, useWordInfo } from "@/lib/words";
import { Icon } from "@/components/ui";
import { DictationRun } from "@/components/DictationRun";

type Mode = "review" | "match" | "order" | "listen" | "dictation" | "picture" | "bingo" | "gaps";

interface PoolWord {
  lemma: string;
  display: string;
  meaning: string;
  story: AnyStory;
  sentence: number;
}

interface Card { title: string; text: string; icon: keyof typeof Icon; tone: string; mode?: Mode; href?: string; mins: string }

const GAME_EMOJI: Record<string, string> = {
  "Picture match": "🖼️", Bingo: "🎯", "Match words": "🧩", "Fill the gaps": "✏️", "Build the sentence": "🧱", Listening: "🎧", Dictation: "✍️", "Level test": "📊", "Mock exams": "🎓", Grammar: "📘",
};

const SECTIONS: { title: string; key: string; cards: Card[] }[] = [
  { title: "Word games", key: "prac.words", cards: [
    { mode: "picture", title: "Picture match", text: "See a picture, pick the word. Hear a word, find the picture.", icon: "spark", tone: "t1", mins: "2 min" },
    { mode: "bingo", title: "Bingo", text: "Hear a word and mark it on your card. Four in a row wins.", icon: "spark", tone: "t1", mins: "3 min" },
    { mode: "match", title: "Match words", text: "Pair each word with its meaning.", icon: "spark", tone: "t1", mins: "1 min" },
  ] },
  { title: "Text games", key: "prac.text", cards: [
    { mode: "gaps", title: "Fill the gaps", text: "Finish the half-written words in a short text, with or without audio.", icon: "library", tone: "t2", mins: "4 min" },
    { mode: "order", title: "Build the sentence", text: "Put the words of a story sentence in order.", icon: "library", tone: "t2", mins: "2 min" },
  ] },
  { title: "Listening and writing", key: "prac.listen", cards: [
    { mode: "listen", title: "Listening", text: "Hear a sentence and pick what was said.", icon: "speaker", tone: "t2", mins: "2 min" },
    { mode: "dictation", title: "Dictation", text: "Hear a sentence and type what you hear.", icon: "speaker", tone: "t2", mins: "4 min" },
  ] },
  { title: "Grammar", key: "prac.grammar", cards: [
    { href: "/grammar", title: "Grammar", text: "Short rules with exercises, by level.", icon: "library", tone: "t3", mins: "5 min" },
  ] },
];

/** The level test lives on the Tests tab with the mock exams. */
export function LevelTestPage({ lang }: { lang: LangCode }) {
  const router = useRouter();
  return <Shell lang={lang} source={false} title="Level test" back="Tests" onBack={() => router.push(`/${lang}/exams`)}><LevelTest lang={lang} /></Shell>;
}

export function Practice({ lang }: { lang: LangCode }) {
  const params = useSearchParams();
  const router = useRouter();
  const mode = params.get("mode") as Mode | null;
  const learner = useLearner(lang);
  const due = learner.dueWords().length;
  const meta = language(lang);
  const back = () => router.push(`/${lang}/practice`);
  const t = useT();

  if (mode === "picture") return <Shell lang={lang} title="Picture match" onBack={back}><PictureMatch lang={lang} /></Shell>;
  if (mode === "bingo") return <Shell lang={lang} title="Bingo" onBack={back}><Bingo lang={lang} /></Shell>;
  if (mode === "gaps") return <Shell lang={lang} title="Fill the gaps" onBack={back}><GapFill lang={lang} /></Shell>;
  if (mode === "review") return <Shell lang={lang} source={false} title="Flashcards" onBack={back}><Review lang={lang} /></Shell>;
  if (mode === "match") return <Shell lang={lang} title="Match words" onBack={back}><Match lang={lang} /></Shell>;
  if (mode === "order") return <Shell lang={lang} title="Build the sentence" onBack={back}><Order lang={lang} /></Shell>;
  if (mode === "listen") return <Shell lang={lang} title="Listening" onBack={back}><Listen lang={lang} /></Shell>;
  if (mode === "dictation") return <Shell lang={lang} title="Dictation" onBack={back}><DictationGame lang={lang} onBack={back} /></Shell>;

  const anyGame = Object.values(learner.games).reduce((n, g) => n + g.played, 0);
  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">{meta.name} · {learner.learningCount} saved words</div><h1>{t("prac.title")}</h1></div>
        <Link className="btn sm" href={`/${lang}/words`}>{Icon.notebook} {t("prac.notebook")}</Link>
      </div>

      <div className="review-hero">
        <span className="rh-icon" aria-hidden="true">{Icon.words}</span>
        <span className="rh-body">
          <b>{due ? `${due} ${due === 1 ? "word is" : "words are"} ready to review` : learner.learningCount ? "You're up to date" : "Start your word list"}</b>
          <span className="muted small">
            {due ? "A few minutes of flashcards keeps them in memory." : learner.learningCount ? "Nothing is due. You can still go over your saved words." : "Tap words while reading and press Review. They will come back here."}
          </span>
        </span>
        {learner.learningCount ? (
          <Link className="btn primary" href={`/${lang}/practice?mode=review`}>{due ? "Start review" : "Review anyway"}</Link>
        ) : (
          <Link className="btn primary" href={`/${lang}`}>Read a story</Link>
        )}
      </div>

      {SECTIONS.map((sec) => (
        <section key={sec.title} className="game-section" aria-label={sec.title}>
          <h2>{t(sec.key)}</h2>
          <div className="game-grid">
            {sec.cards.map((g) => {
              const best = g.mode ? learner.games[g.mode] : undefined;
              return (
                <Link key={g.title} href={g.mode ? `/${lang}/practice?mode=${g.mode}` : `/${lang}${g.href}`} className={`game-card ${g.tone}`}>
                  <span className="spread"><span className="gi" aria-hidden="true">{GAME_EMOJI[g.title] ?? Icon[g.icon]}</span><span className="small muted">{g.mins}</span></span>
                  <span className="t">{g.title}</span>
                  <span className="muted small">{g.text}</span>
                  {g.mode && <span className="small gm">{best ? `Best ${best.best}% · played ${best.played}×` : "Not played yet"}</span>}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      {!anyGame && <p className="muted small">Tip: every game uses the words and sentences from the stories you read, so read a story first for the best practice.</p>}
    </>
  );
}

/** Where a game takes its words from: everything, the learner's saved words, or chosen stories. */
type From = { kind: "all" } | { kind: "saved" } | { kind: "stories"; ids: string[] };

function useFrom(): From {
  const v = useSearchParams().get("from") ?? "";
  if (v === "saved") return { kind: "saved" };
  if (v.startsWith("s:")) {
    const ids = v.slice(2).split(",").filter(Boolean);
    if (ids.length) return { kind: "stories", ids };
  }
  return { kind: "all" };
}

function Shell({ lang, title, onBack, back = "Practice", source = true, children }: { lang: LangCode; title: string; onBack: () => void; back?: string; source?: boolean; children: React.ReactNode }) {
  useEffect(() => () => stopAudio(), []);
  const params = useSearchParams();
  return (
    <>
      <div className="page-head">
        <div className="row">
          <button className="btn ghost sm" onClick={onBack}>{Icon.back} {back}</button>
          <h1 style={{ fontSize: 26 }}>{title}</h1>
        </div>
      </div>
      {source && <SourcePicker lang={lang} />}
      {/* A new source starts a new game. */}
      <div key={params.get("from") ?? "all"}>{children}</div>
    </>
  );
}

function SourcePicker({ lang }: { lang: LangCode }) {
  const from = useFrom();
  const router = useRouter();
  const params = useSearchParams();
  const learner = useLearner(lang);
  const stories = useStories(lang);
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<string[]>(from.kind === "stories" ? from.ids : []);
  const [q, setQ] = useState("");
  const go = (v: string | null) => {
    const p = new URLSearchParams(params.toString());
    if (v) p.set("from", v);
    else p.delete("from");
    router.replace(`/${lang}/practice?${p.toString()}`, { scroll: false });
  };
  // Read stories first, then the rest by level.
  const levels = language(lang).levels;
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return stories
      .filter((st) => !s || st.title.toLowerCase().includes(s))
      .sort((a, b) => Number(learner.finished.includes(b.id)) - Number(learner.finished.includes(a.id)) || levels.indexOf(a.level) - levels.indexOf(b.level));
  }, [stories, learner.finished, q, levels]);
  const chosenTitles = from.kind === "stories" ? from.ids.map((id) => stories.find((s) => s.id === id)?.title).filter(Boolean) : [];

  return (
    <div className="source-bar">
      <span className="small muted">Words from</span>
      <div className="filters">
        <button className="chip" aria-pressed={from.kind === "all"} onClick={() => go(null)}>Everything</button>
        <button className="chip" aria-pressed={from.kind === "saved"} onClick={() => go("saved")}>My saved words · {learner.learningCount}</button>
        <button className="chip" aria-pressed={from.kind === "stories"} onClick={() => setOpen(!open)}>
          {from.kind === "stories" ? (chosenTitles.length === 1 ? chosenTitles[0] : `${chosenTitles.length} stories`) : "Choose stories"} ▾
        </button>
      </div>
      {open && (
        <div className="source-pop">
          <input className="input" type="search" placeholder="Search stories" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="source-list">
            {list.map((st) => (
              <label key={st.id} className="source-row">
                <input type="checkbox" checked={pick.includes(st.id)} onChange={(e) => setPick(e.target.checked ? [...pick, st.id] : pick.filter((x) => x !== st.id))} />
                <span>{st.title}</span>
                <span className="small muted">{learner.finished.includes(st.id) ? "✓ read · " : ""}{st.level}</span>
              </label>
            ))}
          </div>
          <div className="spread">
            <button className="btn ghost sm" onClick={() => setPick([])}>Clear</button>
            <button className="btn primary sm" disabled={!pick.length} onClick={() => { go(`s:${pick.join(",")}`); setOpen(false); }}>
              Use {pick.length || ""} {pick.length === 1 ? "story" : "stories"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Lemmas a game may use under the chosen source, or null for "everything". */
function useAllowed(lang: LangCode): Set<string> | null {
  const from = useFrom();
  const stories = useStories(lang);
  const learner = useLearner(lang);
  return useMemo(() => {
    if (from.kind === "saved") return new Set(learner.allWords.filter((w) => w?.lemma && w.saved === "learning").map((w) => w.lemma));
    if (from.kind === "stories") {
      const out = new Set<string>();
      for (const st of stories) if (from.ids.includes(st.id)) for (const x of st.sentences) for (const t of x.tokens) if (t.lemma) out.add(t.lemma);
      return out;
    }
    return null;
  }, [from, stories, learner.allWords]);
}

/** Ask for a wider source when the chosen one has too few words for a game. */
function TooFew({ need }: { need: number }) {
  return <div className="empty"><p className="muted">This game needs at least {need} different words. Choose more stories or “Everything” above.</p></div>;
}

/** Words with meanings from the learner's saved words first, then from stories (one level, or all). */
function usePool(lang: LangCode, level?: string) {
  const stories = useStories(lang);
  const learner = useLearner(lang);
  const from = useFrom();
  const pool = useMemo(() => {
    const out = new Map<string, PoolWord>();
    // Without a chosen level: stories up to one level above the learner's, so words stay reachable.
    const levels = language(lang).levels;
    const reach = (learner.level ?? 0) + 1;
    const near = stories.filter((s) => isUserStory(s) || levels.indexOf(s.level) <= reach);
    const source = level ? stories.filter((s) => s.level === level) : near.length ? near : stories;
    const add = (story: AnyStory, lemma: string, sentence: number) => {
      if (!lemma || out.has(lemma)) return;
      const e = lookupIn(story, lemma);
      if (!e || typeof e.meaning !== "string" || typeof e.display !== "string") return;
      // Content words only, and no meanings that give the answer away ("this (dieser / diese)").
      if (e && !FUNCTION_POS.has(e.pos) && !e.meaning.toLowerCase().includes(e.display.toLowerCase()))
        out.set(lemma, { lemma, display: e.display, meaning: e.meaning, story, sentence });
    };
    if (!level) {
      for (const w of learner.allWords.filter((w) => w?.lemma && w.saved === "learning")) {
        const st = stories.find((s) => s.id === w.source?.storyId) ?? stories.find((s) => s.sentences.some((x) => x.tokens.some((t) => t.lemma === w.lemma)));
        const at = w.source?.sentence ?? st?.sentences.findIndex((x) => x.tokens.some((t) => t.lemma === w.lemma)) ?? -1;
        if (st && st.sentences[at]) add(st, w.lemma, at);
      }
    }
    const saved = out.size;
    for (const st of source)
      st.sentences.forEach((x, i) => x.tokens.forEach((t) => t.lemma && !t.isName && add(st, t.lemma, i)));
    // Saved words first (shuffled), then the rest (shuffled): games show your own words before others.
    const all = [...out.values()];
    return [...shuffle(all.slice(0, saved)), ...shuffle(all.slice(saved))];
  }, [stories, learner.allWords, learner.level, level, lang]);
  return useMemo(() => {
    if (level || from.kind === "all") return pool;
    if (from.kind === "saved") return pool.filter((p) => learner.word(p.lemma)?.saved === "learning");
    // Words from the chosen stories (they may sit above the learner's level, so look them up directly).
    const out = new Map<string, PoolWord>();
    for (const st of stories.filter((x) => from.ids.includes(x.id)))
      st.sentences.forEach((x, i) => x.tokens.forEach((t) => {
        if (!t.lemma || t.isName || out.has(t.lemma)) return;
        const e = lookupIn(st, t.lemma);
        if (e && typeof e.meaning === "string" && !FUNCTION_POS.has(e.pos) && !e.meaning.toLowerCase().includes(e.display.toLowerCase()))
          out.set(t.lemma, { lemma: t.lemma, display: e.display, meaning: e.meaning, story: st, sentence: i });
      }));
    return shuffle([...out.values()]);
  }, [pool, from, level, stories, learner]);
}

/** Sentences good for games: 4–10 words, from stories the learner has read first. */
function useSentences(lang: LangCode) {
  const stories = useStories(lang);
  const learner = useLearner(lang);
  const from = useFrom();
  const allowed = useAllowed(lang);
  return useMemo(() => {
    const fits = (s: Sentence) => { const n = s.tokens.filter((t) => t.lemma).length; return n >= 4 && n <= 10; };
    if (from.kind === "stories")
      return stories.filter((st) => from.ids.includes(st.id)).flatMap((story) => story.sentences.map((s, i) => ({ story, s, i })).filter(({ s }) => fits(s)));
    if (from.kind === "saved" && allowed)
      return stories.flatMap((story) => story.sentences.map((s, i) => ({ story, s, i })).filter(({ s }) => fits(s) && s.tokens.some((t) => t.lemma && allowed.has(t.lemma)))).slice(0, 200);
    const read = stories.filter((s) => learner.finished.includes(s.id));
    const rest = stories.filter((s) => !learner.finished.includes(s.id) && s.level === language(lang).levels[Math.min(learner.level ?? 0, language(lang).levels.length - 1)]);
    const pick = (list: AnyStory[]) =>
      list.flatMap((story) =>
        story.sentences.map((s, i) => ({ story, s, i })).filter(({ s }) => {
          const n = s.tokens.filter((t) => t.lemma).length;
          return n >= 4 && n <= 10;
        }),
      );
    const mine = pick(read);
    return mine.length >= 5 ? mine : [...mine, ...pick(rest.length ? rest : stories)];
  }, [stories, learner.finished, learner.level, lang, from, allowed]);
}

function Done({ score, total, onAgain, note }: { score: number; total: number; onAgain: () => void; note?: string }) {
  const pct = Math.round((score / Math.max(1, total)) * 100);
  const shown = useCountUp(pct);
  return (
    <div className="flash done-card">
      {pct >= 80 && <Confetti />}
      <div className="score-ring anim" style={{ ["--p" as string]: pct / 100 }}><b>{shown}%</b></div>
      <h2 style={{ fontSize: 22 }}>{pct >= 80 ? "Great job!" : pct >= 50 ? "Good work!" : "Keep practicing!"}</h2>
      <p className="muted" style={{ margin: 0 }}>{score} of {total} correct.{note ? ` ${note}` : ""}</p>
      <button className="btn primary block" onClick={onAgain}>Play again</button>
    </div>
  );
}

/**
 * Build a round once and keep it until `key` changes. Games must not reshuffle when the learner's
 * data changes mid-game (a wrong answer saves the word, which updates the store).
 */
/** Counts from 0 up to `to` over about a second, for result screens. */
function useCountUp(to: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return setV(to);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setV(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return v;
}

const CONFETTI_COLORS = ["#2f9e6e", "#f59e0b", "#3b82f6", "#ef4444", "#a855f7", "#10b981"];

/** A short burst of confetti for a good score (CSS only, hidden with reduced motion). */
function Confetti() {
  const bits = useMemo(
    () => Array.from({ length: 28 }, (_, i) => ({ x: Math.round((Math.random() - 0.5) * 520), y: Math.round(-120 - Math.random() * 220), r: Math.round(Math.random() * 720 - 360), c: CONFETTI_COLORS[i % CONFETTI_COLORS.length], d: Math.random() * 0.15 })),
    [],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <i key={i} style={{ ["--x" as string]: `${b.x}px`, ["--y" as string]: `${b.y}px`, ["--r" as string]: `${b.r}deg`, background: b.c, animationDelay: `${b.d}s` }} />
      ))}
    </div>
  );
}

/** Correct answers in a row; shown as a small flame badge from 2 up. */
function useCombo() {
  const [combo, setCombo] = useState(0);
  return [combo, (ok: boolean) => setCombo((c) => (ok ? c + 1 : 0))] as const;
}

function Combo({ n }: { n: number }) {
  if (n < 2) return null;
  return <span key={n} className="combo" aria-live="polite">🔥 {n} in a row</span>;
}

/** Animated progress bar for a round of questions. */
function Progress({ done, total }: { done: number; total: number }) {
  return (
    <div className="g-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
      <span style={{ width: `${(done / Math.max(1, total)) * 100}%` }} />
    </div>
  );
}

/** Keyboard shortcuts for a game screen (ignored while typing in a field). */
function useKeys(on: (key: string) => void) {
  const ref = useRef(on);
  ref.current = on;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " ") e.preventDefault();
      ref.current(e.key);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
}

/** Number keys pick an answer, Enter presses the main button (Check / Next). */
function useChoiceKeys() {
  useKeys((k) => {
    if (/^[1-6]$/.test(k)) document.querySelectorAll<HTMLButtonElement>(".flash .choices button:not(:disabled)")[Number(k) - 1]?.click();
    else if (k === "Enter") document.querySelector<HTMLButtonElement>(".flash > .btn.primary.block:not(:disabled)")?.click();
  });
}

function useFrozen<T>(build: () => T, key: string): T {
  const ref = useRef<{ key: string; value: T } | null>(null);
  if (!ref.current || ref.current.key !== key) ref.current = { key, value: build() };
  return ref.current.value;
}

// ── Flashcards (spaced repetition) ──
const GRADES: { g: ReviewGrade; label: string; cls: string }[] = [
  { g: "again", label: "Again", cls: "danger" },
  { g: "hard", label: "Hard", cls: "" },
  { g: "good", label: "Good", cls: "primary" },
  { g: "easy", label: "Easy", cls: "" },
];
const interval = (ms: number) => {
  const d = ms / 864e5;
  return d < 1 / 24 ? `${Math.max(1, Math.round(ms / 6e4))}m` : d < 1 ? `${Math.round(d * 24)}h` : d < 30 ? `${Math.round(d)}d` : `${Math.round(d / 30)}mo`;
};

function Review({ lang }: { lang: LangCode }) {
  const learner = useLearner(lang);
  const { meaningOf, contextOf } = useWordInfo(lang);
  const [queue, setQueue] = useState<string[]>(() => {
    const due = learner.dueWords().map((w) => w.lemma);
    return due.length ? due : shuffle(learner.allWords.filter((w) => w?.lemma && w.saved === "learning").map((w) => w.lemma)).slice(0, 20);
  });
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const word = queue[0] ? learner.word(queue[0]) : undefined;

  if (!word) {
    return (
      <div className="empty">
        <h2 style={{ fontSize: 22 }}>{done ? `Done! ${done} ${done === 1 ? "card" : "cards"} reviewed.` : "Nothing to review right now"}</h2>
        <p className="muted">
          {learner.learningCount ? "Saved words come back when they are due. Reading stories that use them also counts." : "Tap a word while reading and press Review to save it."}
        </p>
        <Link className="btn primary" href={`/${lang}`}>Read a story</Link>
      </div>
    );
  }

  function grade(g: ReviewGrade) {
    if (!word) return;
    learner.grade(word.lemma, g);
    setFlipped(false);
    setDone((n) => n + 1);
    setQueue((q) => (g === "again" ? [...q.slice(1), q[0]!] : q.slice(1)));
  }

  return <FlashCard key={`${word.lemma}-${done}`} word={word} lang={lang} meaning={meaningOf(word)} ctx={contextOf(word)} flipped={flipped} onFlip={() => setFlipped(true)} onGrade={grade} left={queue.length} />;
}

function FlashCard({ word, lang, meaning, ctx, flipped, onFlip, onGrade, left }: {
  word: StoredWord;
  lang: LangCode;
  meaning: ReturnType<ReturnType<typeof useWordInfo>["meaningOf"]>;
  ctx: ReturnType<ReturnType<typeof useWordInfo>["contextOf"]>;
  flipped: boolean;
  onFlip: () => void;
  onGrade: (g: ReviewGrade) => void;
  left: number;
}) {
  const intervals = word.card ? previewIntervals(word.card) : undefined;
  useKeys((k) => {
    if (!flipped && (k === " " || k === "Enter")) onFlip();
    else if (flipped && "1234".includes(k)) onGrade(GRADES[Number(k) - 1]!.g);
  });
  const parts = ctx ? highlight(ctx.text, ctx.surface) : null;
  return (
    <div className="flash">
      <div className="spread small muted"><span>{left} left</span><span>Seen {word.encounters}× in stories</span></div>
      <div className="row" style={{ justifyContent: "center" }}>
        <span className="lemma" lang={lang}>{meaning?.display ?? word.lemma}</span>
        <button className="icon-btn" aria-label="Hear the word" onClick={() => playWord(lang, word.lemma, meaning?.display ?? word.lemma)}>{Icon.speaker}</button>
      </div>
      {ctx && <div className="ctx" lang={lang}>{parts ? <>{parts[0]}<mark>{parts[1]}</mark>{parts[2]}</> : ctx.text}</div>}
      {!flipped ? (
        <button className="btn primary block" onClick={onFlip} autoFocus>Show meaning <kbd>Space</kbd></button>
      ) : (
        <>
          <div className="answer-reveal">
            {meaning?.reading && <div className="reading">{meaning.reading}</div>}
            <div style={{ fontSize: 22, fontWeight: 700 }}>{meaning?.meaning ? <Tr>{meaning.meaning}</Tr> : "—"}</div>
            {meaning?.pos && <div className="muted small">{meaning.pos}</div>}
            {ctx?.translation && <p className="muted" style={{ margin: "8px 0 0" }}><Tr>{ctx.translation}</Tr></p>}
          </div>
          <div className="grades">
            {GRADES.map(({ g, label, cls }, i) => (
              <button key={g} className={`btn ${cls}`} onClick={() => onGrade(g)} title={`Key ${i + 1}`}>
                {label}
                {intervals && <small>{interval(intervals[g])}</small>}
              </button>
            ))}
          </div>
          <span className="small muted">Keyboard: 1 Again · 2 Hard · 3 Good · 4 Easy</span>
        </>
      )}
    </div>
  );
}

// ── Match words ──
function Match({ lang }: { lang: LangCode }) {
  const [combo, hit] = useCombo();
  const pool = usePool(lang);
  const learner = useLearner(lang);
  const [round, setRound] = useState(0);
  const { pairs, right } = useFrozen(() => {
    const seen = new Set<string>();
    // Different meanings only, so every pair is unambiguous.
    const pairs = pool.filter((p) => (seen.has(p.meaning) ? false : (seen.add(p.meaning), true))).slice(round * 6 % Math.max(6, pool.length - 6)).slice(0, 6);
    return { pairs, right: shuffle(pairs) };
  }, `match-${round}-${pool.length > 0}`);
  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const finished = pairs.length > 0 && solved.size === pairs.length;
  const score = Math.max(0, pairs.length - mistakes);

  useEffect(() => {
    if (finished) learner.recordGame("match", Math.round((score / pairs.length) * 100));
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  if (pairs.length < 3) return <TooFew need={3} />;
  if (finished) return <Done score={score} total={pairs.length} onAgain={() => { setRound((r) => r + 1); setSolved(new Set()); setMistakes(0); setPicked(null); }} />;

  function choose(lemma: string) {
    if (!picked) return;
    if (picked === lemma) {
      setSolved((s) => new Set(s).add(lemma));
      setPicked(null);
      hit(true);
    } else {
      hit(false);
      setMistakes((m) => m + 1);
      setWrong(lemma);
      setTimeout(() => setWrong(null), 500);
    }
  }

  return (
    <div className="match">
      <p className="muted" style={{ margin: "0 0 12px" }}>Tap a word, then tap its meaning.</p>
      <div className="match-cols">
        <div className="col">
          {pairs.map((p) => (
            <button key={p.lemma} className={`tile${picked === p.lemma ? " picked" : ""}${solved.has(p.lemma) ? " solved" : ""}`} disabled={solved.has(p.lemma)} lang={lang}
              onClick={() => { setPicked(p.lemma); playWord(lang, p.lemma, p.display); }}>{p.display}</button>
          ))}
        </div>
        <div className="col">
          {right.map((p) => (
            <button key={p.lemma} className={`tile en${solved.has(p.lemma) ? " solved" : ""}${wrong === p.lemma ? " wrong" : ""}`} disabled={solved.has(p.lemma) || !picked} onClick={() => choose(p.lemma)}><Tr>{p.meaning}</Tr></button>
          ))}
        </div>
      </div>
      <Progress done={solved.size} total={pairs.length} />
      <p className="small muted">{solved.size}/{pairs.length} matched · {mistakes} {mistakes === 1 ? "mistake" : "mistakes"} <Combo n={combo} /></p>
    </div>
  );
}

// ── Build the sentence ──
const ROUNDS = 5;

function Order({ lang }: { lang: LangCode }) {
  useChoiceKeys();
  const [combo, hit] = useCombo();
  const sentences = useSentences(lang);
  const learner = useLearner(lang);
  const noSpace = language(lang).noSpace;
  const [game, setGame] = useState(0);
  const rounds = useFrozen(() => shuffle(sentences).slice(0, ROUNDS), `order-${game}`);
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [built, setBuilt] = useState<number[]>([]);
  const [checked, setChecked] = useState<null | boolean>(null);
  const cur = rounds[n];
  const words = useMemo(() => (cur ? cur.s.tokens.filter((t) => !PUNCT.test(t.surface)) : []), [cur]);
  const tiles = useFrozen(() => shuffle(words.map((_, i) => i)), `tiles-${game}-${n}`);

  if (!cur) {
    if (rounds.length) return <Done score={score} total={rounds.length} onAgain={() => { setGame((g) => g + 1); setN(0); setScore(0); setBuilt([]); setChecked(null); }} />;
    return <div className="empty"><p className="muted">No sentences to practice yet.</p></div>;
  }

  const join = (xs: string[]) => xs.join(noSpace ? "" : " ");
  // Hint: keep the correct start of what was built, then add the next right word.
  const hintAt = (b: number[]) => {
    let k = 0;
    while (k < b.length && words[b[k]!]!.surface === words[k]!.surface) k++;
    return k < words.length ? k : -1;
  };
  const correctIdx = (b: number[], k: number) => {
    const used = new Set(b.slice(0, k));
    const next = words.findIndex((t, i) => !used.has(i) && t.surface === words[k]!.surface);
    return next >= 0 ? [next] : [];
  };
  const answer = join(words.map((t) => t.surface));
  function check() {
    const ok = join(built.map((i) => words[i]!.surface)) === answer;
    setChecked(ok);
    hit(ok);
    if (ok) setScore((s) => s + 1);
    playSentence(cur!.story.id, lang, cur!.i, textOf(cur!.story, cur!.s));
  }
  function next() {
    const last = n + 1 >= rounds.length;
    if (last) learner.recordGame("order", Math.round(((score) / rounds.length) * 100));
    setN(n + 1);
    setBuilt([]);
    setChecked(null);
  }

  return (
    <div className="flash" style={{ textAlign: "left" }} key={n}>
      <div className="spread small muted"><span>Sentence {n + 1} of {rounds.length} <Combo n={combo} /></span><span>{cur.story.title}</span></div>
      {cur.s.translation && <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}><Tr>{cur.s.translation}</Tr></p>}
      <div className={`build${checked === true ? " ok" : checked === false ? " no" : ""}`} lang={lang}>
        {built.map((i, k) => (
          <button key={k} className="tile sm" disabled={checked !== null} onClick={() => setBuilt(built.filter((_, j) => j !== k))}>{words[i]!.surface}</button>
        ))}
        {!built.length && <span className="muted small">Tap the words below in the right order.</span>}
      </div>
      <div className="bank" lang={lang}>
        {tiles.map((i) => (
          <button key={i} className="tile sm" disabled={built.includes(i) || checked !== null} onClick={() => setBuilt([...built, i])}>{words[i]!.surface}</button>
        ))}
      </div>
      {checked === null && (
        <div className="row" style={{ justifyContent: "center", gap: 8 }}>
          <button className="btn ghost sm" onClick={() => playSentence(cur.story.id, lang, cur.i, textOf(cur.story, cur.s))}>{Icon.speaker} Listen</button>
          <button className="btn ghost sm" disabled={hintAt(built) < 0} onClick={() => { const k = hintAt(built); if (k >= 0) setBuilt([...built.slice(0, k), ...correctIdx(built, k)]); }}>Hint</button>
          <button className="btn ghost sm" disabled={!built.length} onClick={() => setBuilt([])}>Clear</button>
        </div>
      )}
      {checked === null ? (
        <button className="btn primary block" disabled={built.length !== words.length} onClick={check}>Check</button>
      ) : (
        <>
          <p style={{ margin: 0 }} lang={lang}><b>{checked ? "Correct!" : "Not quite."}</b> {checked ? "" : <span>The sentence is: {textOf(cur.story, cur.s)}</span>}</p>
          <button className="btn primary block" onClick={next}>{n + 1 >= rounds.length ? "See result" : "Next"}</button>
        </>
      )}
    </div>
  );
}

// ── Listening ──
function Listen({ lang }: { lang: LangCode }) {
  useChoiceKeys();
  const [combo, hit] = useCombo();
  const sentences = useSentences(lang);
  const learner = useLearner(lang);
  const [game, setGame] = useState(0);
  const rounds = useFrozen(() => shuffle(sentences).slice(0, ROUNDS), `listen-${game}`);
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const cur = rounds[n];
  const options = useFrozen(() => {
    if (!cur) return [];
    const others = shuffle(sentences.filter((x) => x !== cur && textOf(x.story, x.s) !== textOf(cur.story, cur.s))).slice(0, 2);
    return shuffle([cur, ...others]);
  }, `listen-${game}-${n}`);

  const play = () => cur && playSentence(cur.story.id, lang, cur.i, textOf(cur.story, cur.s), learner.level === 0 ? 0.85 : 1);
  useEffect(() => {
    if (cur) play();
  }, [cur]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cur) {
    if (rounds.length) return <Done score={score} total={rounds.length} onAgain={() => { setGame((g) => g + 1); setN(0); setScore(0); setChosen(null); }} />;
    return <div className="empty"><p className="muted">No sentences to practice yet.</p></div>;
  }

  return (
    <div className="flash" key={n}>
      <div className="spread small muted"><span>Question {n + 1} of {rounds.length}</span><span><Combo n={combo} /> What did you hear?</span></div>
      <Progress done={n} total={rounds.length} />
      <button className="icon-btn play big" aria-label="Play the sentence again" onClick={play}>{Icon.play}</button>
      <div className="choices" style={{ textAlign: "left" }} lang={lang}>
        {options.map((o, k) => {
          const isRight = o.story.id === cur.story.id && o.i === cur.i;
          return (
            <button key={k} disabled={chosen !== null}
              className={`choice${chosen !== null && isRight ? " ok" : ""}${chosen === k && !isRight ? " no" : ""}`}
              onClick={() => { setChosen(k); hit(isRight); if (isRight) setScore((s) => s + 1); }}>
              {textOf(o.story, o.s)}
            </button>
          );
        })}
      </div>
      {chosen !== null && (
        <>
          {cur.s.translation && <p className="muted" style={{ margin: 0 }}><Tr>{cur.s.translation}</Tr></p>}
          <button className="btn primary block" onClick={() => {
            if (n + 1 >= rounds.length) learner.recordGame("listen", Math.round((score / rounds.length) * 100));
            setN(n + 1);
            setChosen(null);
          }}>{n + 1 >= rounds.length ? "See result" : "Next"}</button>
        </>
      )}
    </div>
  );
}

// ── Level test ──
function LevelTest({ lang }: { lang: LangCode }) {
  useChoiceKeys();
  const [combo, hit] = useCombo();
  const meta = language(lang);
  const learner = useLearner(lang);
  const stories = useStories(lang);
  const [level, setLevel] = useState<string | null>(null);
  const [game, setGame] = useState(0);
  const pool = usePool(lang, level ?? undefined);
  const questions = useFrozen(() => {
    if (!level) return [];
    const meanings = [...new Set(pool.map((p) => p.meaning))];
    return shuffle(pool).slice(0, 10).map((p) => ({
      p,
      options: shuffle([p.meaning, ...shuffle(meanings.filter((m) => m !== p.meaning)).slice(0, 3)]),
    }));
  }, `test-${level}-${game}`);
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);

  if (!level) {
    return (
      <div className="flash">
        <p style={{ margin: 0 }}>Choose a level. You get 10 questions on words from that level's stories.</p>
        <div className="choices">
          {meta.levels.map((l) => {
            const count = stories.filter((s) => s.level === l && !isUserStory(s)).length;
            const best = learner.games[`test-${l}`];
            return (
              <button key={l} className="choice" disabled={!count} onClick={() => setLevel(l)}>
                <b>{l}</b> <span className="muted small">· {count} stories{best ? ` · best ${best.best}%` : ""}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  const q = questions[n];
  if (!q) {
    return <Done score={score} total={questions.length} note={`Level ${level}.`} onAgain={() => { setGame((g) => g + 1); setN(0); setScore(0); setChosen(null); }} />;
  }
  const ctx: Sentence | undefined = q.p.story.sentences[q.p.sentence];
  const ctxText = ctx ? textOf(q.p.story, ctx) : "";
  const parts = ctx ? highlight(ctxText, ctx.tokens.find((t) => t.lemma === q.p.lemma)?.surface ?? q.p.display) : null;

  return (
    <div className="flash" style={{ textAlign: "left" }} key={n}>
      <div className="spread small muted"><span>{level} · question {n + 1} of {questions.length}</span><span><Combo n={combo} /> {score} correct</span></div>
      <Progress done={n} total={questions.length} />
      <div className="row"><span className="lemma" lang={lang}>{q.p.display}</span><button className="icon-btn" aria-label="Hear the word" onClick={() => playWord(lang, q.p.lemma, q.p.display)}>{Icon.speaker}</button></div>
      {parts && <div className="ctx muted" lang={lang} style={{ textAlign: "left" }}>{parts[0]}<mark>{parts[1]}</mark>{parts[2]}</div>}
      <div className="choices">
        {q.options.map((o) => (
          <button key={o} disabled={chosen !== null}
            className={`choice${chosen !== null && o === q.p.meaning ? " ok" : ""}${chosen === o && o !== q.p.meaning ? " no" : ""}`}
            onClick={() => {
              setChosen(o);
              hit(o === q.p.meaning);
              if (o === q.p.meaning) setScore((s) => s + 1);
              else learner.setWord(q.p.lemma, "learning", { storyId: q.p.story.id, sentence: q.p.sentence });
            }}><Tr>{o}</Tr></button>
        ))}
      </div>
      {chosen !== null && (
        <>
          <p className="small muted" style={{ margin: 0 }}>{chosen === q.p.meaning ? "Correct!" : "Saved to your notebook for review."}</p>
          <button className="btn primary block" onClick={() => {
            if (n + 1 >= questions.length) learner.recordGame(`test-${level}`, Math.round((score / questions.length) * 100));
            setN(n + 1);
            setChosen(null);
          }}>{n + 1 >= questions.length ? "See result" : "Next"}</button>
        </>
      )}
    </div>
  );
}

// ── Dictation ──
function DictationGame({ lang, onBack }: { lang: LangCode; onBack: () => void }) {
  const sentences = useSentences(lang);
  const learner = useLearner(lang);
  const [game, setGame] = useState(0);
  const items = useFrozen(() => shuffle(sentences).slice(0, ROUNDS).map((x) => ({ story: x.story, index: x.i })), `dictation-${game}`);
  if (!items.length) return <div className="empty"><p className="muted">No sentences to practice yet.</p></div>;
  return (
    <DictationRun
      key={game}
      items={items}
      rate={learner.level === 0 ? 0.85 : 1}
      onFinish={(score) => {
        learner.recordGame("dictation", score);
        setGame((g) => g + 1);
        onBack();
      }}
    />
  );
}

// ── Picture match ──
const art = (lang: LangCode, lemma: string) => (lang === "de" && DE_GENDER[lemma] && DE_GENDER[lemma] !== "pl" ? `${ARTICLE[DE_GENDER[lemma]!]} ` : "");

/** Words that have a picture, nearest to the learner's level first. */
function usePictureWords(lang: LangCode) {
  const learner = useLearner(lang);
  const allowed = useAllowed(lang);
  return useMemo(() => {
    const reach = (learner.level ?? 0) + 1;
    const seen = new Set<string>();
    const all = pictureWords(lang).flatMap((lemma) => {
      const e = lookup(lang, lemma);
      const pic = pictureOf(lang, lemma)!;
      // One word per picture, so every question has one right answer.
      if (!e || seen.has(pic) || (allowed && !allowed.has(lemma))) return [];
      seen.add(pic);
      return [{ lemma, display: e.display, meaning: e.meaning, pic, near: (wordLevelOf(lang, lemma) ?? 0) <= reach }];
    });
    return [...shuffle(all.filter((w) => w.near)), ...shuffle(all.filter((w) => !w.near))];
  }, [lang, learner.level, allowed]);
}

function PictureMatch({ lang }: { lang: LangCode }) {
  useChoiceKeys();
  const [combo, hit] = useCombo();
  const words = usePictureWords(lang);
  const learner = useLearner(lang);
  const [game, setGame] = useState(0);
  const rounds = useFrozen(() => {
    const picked = shuffle(words.slice(0, 30)).slice(0, 8);
    // Alternate: picture → pick the word, then word → pick the picture.
    if (words.length < 4) return [];
    return picked.map((w, i) => ({ w, toWord: i % 2 === 0, options: shuffle([w, ...shuffle(words.filter((x) => x !== w)).slice(0, 3)]) }));
  }, `pic-${game}-${words.length > 0}`);
  const [n, setN] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const cur = rounds[n];

  useEffect(() => {
    if (cur && !cur.toWord) playWord(lang, cur.w.lemma, cur.w.display);
  }, [cur]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cur) {
    if (rounds.length) return <Done score={score} total={rounds.length} onAgain={() => { setGame((g) => g + 1); setN(0); setScore(0); setChosen(null); }} />;
    return <div className="empty"><p className="muted">{words.length ? `Only ${words.length} of these words have pictures.` : "None of these words have pictures yet."} Choose more stories or “Everything” above.</p></div>;
  }

  const pick = (lemma: string) => {
    if (chosen) return;
    const ok = lemma === cur.w.lemma;
    setChosen(lemma);
    hit(ok);
    if (ok) setScore((s) => s + 1);
    else learner.setWord(cur.w.lemma, "learning");
    playWord(lang, cur.w.lemma, cur.w.display);
  };

  return (
    <div className="flash sp-q" key={n}>
      <div className="spread small muted"><span>Picture {n + 1} of {rounds.length}</span><span><Combo n={combo} /> {cur.toWord ? "What is this?" : "Find the picture"}</span></div>
      <Progress done={n} total={rounds.length} />
      {cur.toWord ? (
        <div className="pic-big" aria-label="Picture">{cur.w.pic}</div>
      ) : (
        <button className="pic-word" lang={lang} onClick={() => playWord(lang, cur.w.lemma, cur.w.display)}>
          <span className="g-art">{art(lang, cur.w.lemma)}</span>{cur.w.display} <span aria-hidden="true">{Icon.speaker}</span>
        </button>
      )}
      <div className={cur.toWord ? "choices" : "pic-grid"} lang={cur.toWord ? lang : undefined}>
        {cur.options.map((o) => {
          const right = o.lemma === cur.w.lemma;
          return (
            <button key={o.lemma} disabled={!!chosen}
              className={`${cur.toWord ? "choice" : "pic-choice"}${chosen && right ? " ok" : ""}${chosen === o.lemma && !right ? " no" : ""}`}
              onClick={() => pick(o.lemma)}>
              {cur.toWord ? <>{art(lang, o.lemma)}{o.display}</> : <span aria-label={o.meaning}>{o.pic}</span>}
            </button>
          );
        })}
      </div>
      {chosen && (
        <>
          <p className="muted" style={{ margin: 0 }}>{cur.w.pic} <b lang={lang}>{art(lang, cur.w.lemma)}{cur.w.display}</b> · <Tr>{cur.w.meaning}</Tr></p>
          <button className="btn primary block" onClick={() => {
            if (n + 1 >= rounds.length) learner.recordGame("picture", Math.round((score / rounds.length) * 100));
            setN(n + 1);
            setChosen(null);
          }}>{n + 1 >= rounds.length ? "See result" : "Next"}</button>
        </>
      )}
    </div>
  );
}

// ── Bingo ──
const LINES = [
  [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15],
  [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
  [0, 5, 10, 15], [3, 6, 9, 12],
];

function Bingo({ lang }: { lang: LangCode }) {
  const pool = usePool(lang);
  const learner = useLearner(lang);
  const [combo, hit] = useCombo();
  const [game, setGame] = useState(0);
  const [audioOnly, setAudioOnly] = useState(false);
  const card = useFrozen(() => {
    const seen = new Set<string>();
    return pool.filter((p) => (seen.has(p.meaning) ? false : (seen.add(p.meaning), true))).slice(0, 16);
  }, `bingo-${game}-${pool.length > 0}`);
  const calls = useFrozen(() => shuffle(card.map((_, i) => i)), `bingo-calls-${game}-${card.length}`);
  const [k, setK] = useState(0);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const call = card[calls[k] ?? -1];
  const line = LINES.find((l) => l.every((i) => marked.has(i)));

  const say = () => call && playWord(lang, call.lemma, call.display);
  useEffect(() => {
    if (call && !line) say();
  }, [call?.lemma]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (line) learner.recordGame("bingo", Math.max(0, Math.round(((marked.size - mistakes) / marked.size) * 100)));
  }, [!!line]); // eslint-disable-line react-hooks/exhaustive-deps

  if (card.length < 16) return <TooFew need={16} />;

  const again = () => { setGame((g) => g + 1); setK(0); setMarked(new Set()); setMistakes(0); };
  const tap = (i: number) => {
    if (line || marked.has(i) || !call) return;
    if (card[i] === call) {
      setMarked((m) => new Set(m).add(i));
      hit(true);
      setK(k + 1);
    } else {
      hit(false);
      setMistakes((m) => m + 1);
      setWrong(i);
      setTimeout(() => setWrong(null), 500);
    }
  };

  return (
    <div className="bingo">
      {line ? (
        <div className="bingo-win flash">
          <Confetti />
          <b className="bingo-title">BINGO!</b>
          <p className="muted" style={{ margin: 0 }}>{marked.size} words found · {mistakes} {mistakes === 1 ? "mistake" : "mistakes"}</p>
          <button className="btn primary" onClick={again}>New card</button>
        </div>
      ) : (
        <div className="bingo-call">
          <button className="icon-btn play big" aria-label="Hear the word again" onClick={say}>{Icon.play}</button>
          <span className="stack" style={{ gap: 2 }}>
            <span className="small muted">Find this word · call {k + 1}</span>
            <b className="bingo-meaning">{audioOnly ? "Listen…" : <Tr>{call?.meaning ?? ""}</Tr>}</b>
          </span>
          <button className="chip" aria-pressed={audioOnly} onClick={() => setAudioOnly(!audioOnly)}>Audio only</button>
        </div>
      )}
      <div className="bingo-card" lang={lang}>
        {card.map((w, i) => (
          <button key={w.lemma} onClick={() => tap(i)}
            className={`bingo-cell${marked.has(i) ? " on" : ""}${line?.includes(i) ? " win" : ""}${wrong === i ? " wrong" : ""}`}>
            {w.display}
          </button>
        ))}
      </div>
      <p className="small muted">{marked.size} marked · {mistakes} {mistakes === 1 ? "mistake" : "mistakes"} <Combo n={combo} /> · Get four in a row, column or diagonal.</p>
    </div>
  );
}

// ── Fill the gaps (C-test, like onSET) ──
interface Gap { si: number; ti: number; shown: string; missing: string }

function GapFill({ lang }: { lang: LangCode }) {
  const stories = useStories(lang);
  const learner = useLearner(lang);
  const from = useFrom();
  const allowed = useAllowed(lang);
  const [game, setGame] = useState(0);
  const [withAudio, setWithAudio] = useState(true);
  const text = useFrozen(() => {
    // A short passage (3–4 sentences) from a story at the learner's level, read stories first.
    const levels = language(lang).levels;
    const at = levels[Math.min(learner.level ?? 0, levels.length - 1)];
    const fit = stories.filter((s) => !isUserStory(s) && s.sentences.length >= 4);
    const near = fit.filter((s) => learner.finished.includes(s.id) || s.level === at);
    const chosen = from.kind === "stories" ? stories.filter((s) => from.ids.includes(s.id) && s.sentences.length >= 2) : [];
    // Saved words: a story that uses the most of them.
    const bySaved = from.kind === "saved" && allowed?.size
      ? [...fit].sort((a, b) => count(b) - count(a)).slice(0, 3)
      : [];
    function count(st: AnyStory) { return st.sentences.reduce((n, x) => n + x.tokens.filter((t) => t.lemma && allowed!.has(t.lemma)).length, 0); }
    const story = shuffle(chosen.length ? chosen : bySaved.length ? bySaved : near.length ? near : fit)[0];
    if (!story) return null;
    const start = Math.floor(Math.random() * Math.max(1, story.sentences.length - 3));
    const idx = Array.from({ length: Math.min(4, story.sentences.length) }, (_, i) => start + i);
    // Classic C-test: first sentence stays whole; then every second word loses its second half.
    const gaps: Gap[] = [];
    let n = 0;
    idx.forEach((si, k) => {
      if (k === 0) return;
      story.sentences[si]!.tokens.forEach((t, ti) => {
        if (PUNCT.test(t.surface) || !t.lemma || t.isName || /\d/.test(t.surface)) return;
        // With saved words chosen, gap those words first; otherwise every second word.
        const want = from.kind === "saved" && allowed ? allowed.has(t.lemma) || n % 2 === 1 : n % 2 === 1;
        n++;
        if (want && t.surface.length >= 2 && gaps.length < 16) {
          const keep = Math.ceil(t.surface.length / 2);
          gaps.push({ si, ti, shown: t.surface.slice(0, keep), missing: t.surface.slice(keep) });
        }
      });
    });
    return { story, idx, gaps };
  }, `gap-${game}-${stories.length > 0}`);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  if (!text || !text.gaps.length) return <div className="empty"><p className="muted">No text to practice yet.</p></div>;
  const { story, idx, gaps } = text;
  const key = (g: Gap) => `${g.si}-${g.ti}`;
  const right = (g: Gap) => (answers[key(g)] ?? "").trim().toLowerCase() === g.missing.toLowerCase();
  const score = gaps.filter(right).length;
  const filled = gaps.filter((g) => (answers[key(g)] ?? "").trim()).length;
  const noSpace = language(lang).noSpace;

  const check = () => {
    setChecked(true);
    learner.recordGame("gaps", Math.round((score / gaps.length) * 100));
    for (const g of gaps) if (!right(g)) { const t = story.sentences[g.si]!.tokens[g.ti]!; if (t.lemma) learner.setWord(t.lemma, "learning", { storyId: story.id, sentence: g.si }); }
  };

  return (
    <div className="gapfill">
      <div className="spread" style={{ flexWrap: "wrap", gap: 8 }}>
        <p className="muted small" style={{ margin: 0 }}>Complete the words. Each gap needs the missing second half of the word.</p>
        <button className="chip" aria-pressed={withAudio} onClick={() => setWithAudio(!withAudio)}>{withAudio ? "With audio" : "Without audio"}</button>
      </div>
      <div className="gap-text" lang={lang}>
        {idx.map((si) => {
          const s = story.sentences[si]!;
          return (
            <p key={si}>
              {withAudio && <button className="icon-btn sm" aria-label="Hear this sentence" onClick={() => playSentence(story.id, lang, si, textOf(story, s), 0.9)}>{Icon.speaker}</button>}
              {s.tokens.map((t, ti) => {
                const g = gaps.find((x) => x.si === si && x.ti === ti);
                const sp = noSpace || ti === 0 || PUNCT.test(t.surface) ? "" : " ";
                if (!g) return <span key={ti}>{sp}{t.surface}</span>;
                const k = key(g);
                return (
                  <span key={ti} className="gap-word">
                    {sp}{g.shown}
                    <input className={`gap-in${checked ? (right(g) ? " ok" : " no") : ""}`} value={answers[k] ?? ""} disabled={checked}
                      maxLength={g.missing.length + 2} style={{ width: `${g.missing.length + 1.2}ch` }} aria-label={`Finish the word starting ${g.shown}`}
                      autoCapitalize="off" autoCorrect="off" spellCheck={false}
                      onChange={(e) => setAnswers({ ...answers, [k]: e.target.value })} />
                    {checked && !right(g) && <small className="gap-fix">{g.shown}{g.missing}</small>}
                  </span>
                );
              })}
              {checked && s.translation && <small className="g gap-tr"><Tr>{s.translation}</Tr></small>}
            </p>
          );
        })}
      </div>
      <Progress done={checked ? gaps.length : filled} total={gaps.length} />
      {checked ? (
        <Done score={score} total={gaps.length} note={`From “${story.title}”.`} onAgain={() => { setGame((g) => g + 1); setAnswers({}); setChecked(false); }} />
      ) : (
        <div className="spread">
          <span className="small muted">{filled} of {gaps.length} filled</span>
          <button className="btn primary" onClick={check}>Check</button>
        </div>
      )}
    </div>
  );
}
