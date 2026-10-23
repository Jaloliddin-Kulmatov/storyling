"use client";

import { language } from "@storyling/content";
import { previewIntervals, type LangCode, type ReviewGrade, type Sentence } from "@storyling/core";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { canSpeak, playSentence, playWord, stopAudio } from "@/lib/audio";
import { useLearner, type StoredWord } from "@/lib/learner";
import { isUserStory, lookupIn, PUNCT, textOf, useStories, type AnyStory } from "@/lib/stories";
import { highlight, shuffle, useWordInfo } from "@/lib/words";
import { Icon } from "@/components/ui";
import { DictationRun } from "@/components/DictationRun";

type Mode = "review" | "match" | "order" | "listen" | "dictation" | "test";

interface PoolWord {
  lemma: string;
  display: string;
  meaning: string;
  story: AnyStory;
  sentence: number;
}

const GAMES: { mode: Mode; title: string; text: string; icon: keyof typeof Icon }[] = [
  { mode: "review", title: "Flashcards", text: "Review saved words when they are due.", icon: "words" },
  { mode: "match", title: "Match words", text: "Pair each word with its meaning.", icon: "spark" },
  { mode: "order", title: "Build the sentence", text: "Put the words of a story sentence in order.", icon: "library" },
  { mode: "listen", title: "Listening", text: "Hear a sentence and pick what was said.", icon: "speaker" },
  { mode: "dictation", title: "Dictation", text: "Hear a sentence and type what you hear.", icon: "speaker" },
  { mode: "test", title: "Level test", text: "10 questions on the words of one level.", icon: "progress" },
];

const LINKS: { href: string; title: string; text: string; icon: keyof typeof Icon }[] = [
  { href: "/grammar", title: "Grammar", text: "Short rules and exercises by level.", icon: "library" },
  { href: "/exams", title: "Mock exams", text: "Timed paper: listening, reading, vocabulary, grammar.", icon: "progress" },
];

export function Practice({ lang }: { lang: LangCode }) {
  const params = useSearchParams();
  const router = useRouter();
  const mode = params.get("mode") as Mode | null;
  const learner = useLearner(lang);
  const due = learner.dueWords().length;
  const meta = language(lang);
  const back = () => router.push(`/${lang}/practice`);

  if (mode === "review") return <Shell title="Flashcards" onBack={back}><Review lang={lang} /></Shell>;
  if (mode === "match") return <Shell title="Match words" onBack={back}><Match lang={lang} /></Shell>;
  if (mode === "order") return <Shell title="Build the sentence" onBack={back}><Order lang={lang} /></Shell>;
  if (mode === "listen") return <Shell title="Listening" onBack={back}><Listen lang={lang} /></Shell>;
  if (mode === "dictation") return <Shell title="Dictation" onBack={back}><DictationGame lang={lang} onBack={back} /></Shell>;
  if (mode === "test") return <Shell title="Level test" onBack={back}><LevelTest lang={lang} /></Shell>;

  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">{meta.name} · {learner.learningCount} words to learn</div><h1>Practice</h1></div>
      </div>
      <div className="game-grid">
        {GAMES.map((g) => {
          const best = learner.games[g.mode];
          return (
            <Link key={g.mode} href={`/${lang}/practice?mode=${g.mode}`} className="game-card">
              <span className="gi" aria-hidden="true">{Icon[g.icon]}</span>
              <span className="t">{g.title}</span>
              <span className="muted small">{g.text}</span>
              <span className="small gm">
                {g.mode === "review" ? (due ? <b>{due} due now</b> : "Nothing due") : best ? `Best ${best.best}% · played ${best.played}×` : "Not played yet"}
              </span>
            </Link>
          );
        })}
        {LINKS.map((g) => (
          <Link key={g.href} href={`/${lang}${g.href}`} className="game-card">
            <span className="gi" aria-hidden="true">{Icon[g.icon]}</span>
            <span className="t">{g.title}</span>
            <span className="muted small">{g.text}</span>
          </Link>
        ))}
      </div>
    </>
  );
}

function Shell({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  useEffect(() => () => stopAudio(), []);
  return (
    <>
      <div className="page-head">
        <div className="row">
          <button className="btn ghost sm" onClick={onBack}>{Icon.back} Practice</button>
          <h1 style={{ fontSize: 26 }}>{title}</h1>
        </div>
      </div>
      {children}
    </>
  );
}

/** Words with meanings from the learner's saved words first, then from stories (one level, or all). */
function usePool(lang: LangCode, level?: string) {
  const stories = useStories(lang);
  const learner = useLearner(lang);
  return useMemo(() => {
    const out = new Map<string, PoolWord>();
    // Without a chosen level: stories up to one level above the learner's, so words stay reachable.
    const levels = language(lang).levels;
    const reach = (learner.level ?? 0) + 1;
    const near = stories.filter((s) => isUserStory(s) || levels.indexOf(s.level) <= reach);
    const source = level ? stories.filter((s) => s.level === level) : near.length ? near : stories;
    const add = (story: AnyStory, lemma: string, sentence: number) => {
      if (out.has(lemma)) return;
      const e = lookupIn(story, lemma);
      if (e && e.pos !== "name") out.set(lemma, { lemma, display: e.display, meaning: e.meaning, story, sentence });
    };
    if (!level) {
      for (const w of learner.allWords.filter((w) => w.saved === "learning")) {
        const st = stories.find((s) => s.id === w.source?.storyId) ?? stories.find((s) => s.sentences.some((x) => x.tokens.some((t) => t.lemma === w.lemma)));
        if (st) add(st, w.lemma, w.source?.sentence ?? st.sentences.findIndex((x) => x.tokens.some((t) => t.lemma === w.lemma)));
      }
    }
    for (const st of source)
      st.sentences.forEach((x, i) => x.tokens.forEach((t) => t.lemma && !t.isName && add(st, t.lemma, i)));
    return [...out.values()];
  }, [stories, learner.allWords, learner.level, level, lang]);
}

/** Sentences good for games: 4–10 words, from stories the learner has read first. */
function useSentences(lang: LangCode) {
  const stories = useStories(lang);
  const learner = useLearner(lang);
  return useMemo(() => {
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
  }, [stories, learner.finished, learner.level, lang]);
}

function Done({ score, total, onAgain, note }: { score: number; total: number; onAgain: () => void; note?: string }) {
  const pct = Math.round((score / Math.max(1, total)) * 100);
  return (
    <div className="flash">
      <div className="score-ring" style={{ ["--p" as string]: pct / 100 }}><b>{pct}%</b></div>
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
  const [queue, setQueue] = useState<string[]>(() => learner.dueWords().map((w) => w.lemma));
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
    learner.grade(word!.lemma, g);
    setFlipped(false);
    setDone((n) => n + 1);
    setQueue((q) => (g === "again" ? [...q.slice(1), q[0]!] : q.slice(1)));
  }

  return <FlashCard key={word.lemma} word={word} lang={lang} meaning={meaningOf(word)} ctx={contextOf(word)} flipped={flipped} onFlip={() => setFlipped(true)} onGrade={grade} left={queue.length} />;
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
                {intervals && <small>{interval(intervals[g])}</small>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Match words ──
function Match({ lang }: { lang: LangCode }) {
  const pool = usePool(lang);
  const learner = useLearner(lang);
  const [round, setRound] = useState(0);
  const { pairs, right } = useFrozen(() => {
    const seen = new Set<string>();
    // Different meanings only, so every pair is unambiguous.
    const pairs = shuffle(pool).filter((p) => (seen.has(p.meaning) ? false : (seen.add(p.meaning), true))).slice(0, 6);
    return { pairs, right: shuffle(pairs) };
  }, `match-${round}`);
  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const finished = pairs.length > 0 && solved.size === pairs.length;
  const score = Math.max(0, pairs.length - mistakes);

  useEffect(() => {
    if (finished) learner.recordGame("match", Math.round((score / pairs.length) * 100));
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  if (pairs.length < 3) return <div className="empty"><p className="muted">Read a story first, then come back to play.</p></div>;
  if (finished) return <Done score={score} total={pairs.length} onAgain={() => { setRound((r) => r + 1); setSolved(new Set()); setMistakes(0); setPicked(null); }} />;

  function choose(lemma: string) {
    if (!picked) return;
    if (picked === lemma) {
      setSolved((s) => new Set(s).add(lemma));
      setPicked(null);
    } else {
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
            <button key={p.lemma} className={`tile en${solved.has(p.lemma) ? " solved" : ""}${wrong === p.lemma ? " wrong" : ""}`} disabled={solved.has(p.lemma) || !picked} onClick={() => choose(p.lemma)}>{p.meaning}</button>
          ))}
        </div>
      </div>
      <p className="small muted">{solved.size}/{pairs.length} matched · {mistakes} {mistakes === 1 ? "mistake" : "mistakes"}</p>
    </div>
  );
}

// ── Build the sentence ──
const ROUNDS = 5;

function Order({ lang }: { lang: LangCode }) {
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
  const answer = join(words.map((t) => t.surface));
  function check() {
    const ok = join(built.map((i) => words[i]!.surface)) === answer;
    setChecked(ok);
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
    <div className="flash" style={{ textAlign: "left" }}>
      <div className="spread small muted"><span>Sentence {n + 1} of {rounds.length}</span><span>{cur.story.title}</span></div>
      {cur.s.translation && <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{cur.s.translation}</p>}
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

  if (!canSpeak()) return <div className="empty"><p className="muted">This browser can't play speech. Try Chrome, Safari or Edge.</p></div>;
  if (!cur) {
    if (rounds.length) return <Done score={score} total={rounds.length} onAgain={() => { setGame((g) => g + 1); setN(0); setScore(0); setChosen(null); }} />;
    return <div className="empty"><p className="muted">No sentences to practice yet.</p></div>;
  }

  return (
    <div className="flash">
      <div className="spread small muted"><span>Question {n + 1} of {rounds.length}</span><span>What did you hear?</span></div>
      <button className="icon-btn play big" aria-label="Play the sentence again" onClick={play}>{Icon.play}</button>
      <div className="choices" style={{ textAlign: "left" }} lang={lang}>
        {options.map((o, k) => {
          const isRight = o.story.id === cur.story.id && o.i === cur.i;
          return (
            <button key={k} disabled={chosen !== null}
              className={`choice${chosen !== null && isRight ? " ok" : ""}${chosen === k && !isRight ? " no" : ""}`}
              onClick={() => { setChosen(k); if (isRight) setScore((s) => s + 1); }}>
              {textOf(o.story, o.s)}
            </button>
          );
        })}
      </div>
      {chosen !== null && (
        <>
          {cur.s.translation && <p className="muted" style={{ margin: 0 }}>{cur.s.translation}</p>}
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
    <div className="flash" style={{ textAlign: "left" }}>
      <div className="spread small muted"><span>{level} · question {n + 1} of {questions.length}</span><span>{score} correct</span></div>
      <div className="meter" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${questions.length}, minmax(0, 1fr))` }}>
        {questions.map((_, i) => <span key={i} className={i < n ? "on" : ""} />)}
      </div>
      <div className="row"><span className="lemma" lang={lang}>{q.p.display}</span><button className="icon-btn" aria-label="Hear the word" onClick={() => playWord(lang, q.p.lemma, q.p.display)}>{Icon.speaker}</button></div>
      {parts && <div className="ctx muted" lang={lang} style={{ textAlign: "left" }}>{parts[0]}<mark>{parts[1]}</mark>{parts[2]}</div>}
      <div className="choices">
        {q.options.map((o) => (
          <button key={o} disabled={chosen !== null}
            className={`choice${chosen !== null && o === q.p.meaning ? " ok" : ""}${chosen === o && o !== q.p.meaning ? " no" : ""}`}
            onClick={() => {
              setChosen(o);
              if (o === q.p.meaning) setScore((s) => s + 1);
              else learner.setWord(q.p.lemma, "learning", { storyId: q.p.story.id, sentence: q.p.sentence });
            }}>{o}</button>
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
