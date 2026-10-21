"use client";

import { language } from "@storyling/content";
import type { LangCode, Token } from "@storyling/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { callAi, useAiEnabled } from "@/lib/ai";
import { canSpeak, hasRecording, playSentence, playWord, preload, stopAudio } from "@/lib/audio";
import { useLearner, useSettings } from "@/lib/learner";
import { useRankedStories } from "@/lib/rank";
import { isUserStory, lookupIn, PUNCT, textOf, TOPIC_LABEL, useStory, type AnyStory } from "@/lib/stories";
import { Cover, Icon, Toast } from "@/components/ui";

const RATES = [0.75, 1, 1.25];

interface Picked {
  lemma: string;
  surface: string;
  sentence: number;
}

export function Reader({ lang, id }: { lang: LangCode; id: string }) {
  const story = useStory(lang, id);
  if (!story) {
    return (
      <div className="empty" style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 22 }}>Story not found</h2>
        <p className="muted">It may have been deleted from this device.</p>
        <Link className="btn primary" href={`/${lang}`}>Back to Home</Link>
      </div>
    );
  }
  return <StoryReader key={story.id} story={story} />;
}

function StoryReader({ story }: { story: AnyStory }) {
  const lang = story.lang;
  const meta = language(lang);
  const learner = useLearner(lang);
  const [settings, setSettings] = useSettings();
  const ai = useAiEnabled();
  const router = useRouter();

  const [picked, setPicked] = useState<Picked | null>(null);
  const [tapped, setTapped] = useState<Set<string>>(() => new Set());
  const [playing, setPlaying] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [shown, setShown] = useState<Set<number>>(() => new Set());
  const run = useRef(0);

  const recorded = hasRecording(story.id);
  const voice = recorded || canSpeak();

  useEffect(() => {
    preload(story.id, lang);
    return () => stopAudio();
  }, [story.id, lang]);

  // Count reading time while the tab is visible.
  const { addTime } = learner;
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") addTime(15);
    }, 15000);
    return () => clearInterval(t);
  }, [addTime]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  /** Play from sentence `from` to the end, highlighting each sentence. */
  async function playFrom(from: number) {
    const mine = ++run.current;
    for (let i = from; i < story.sentences.length; i++) {
      setPlaying(i);
      setCursor(i);
      document.getElementById(`s-${i}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      const ok = await playSentence(story.id, lang, i, textOf(story, story.sentences[i]!), settings.rate);
      if (mine !== run.current) return;
      if (!ok) break;
    }
    setPlaying(null);
  }

  function stop() {
    run.current++;
    stopAudio();
    setPlaying(null);
  }

  function pick(t: Token, sentence: number) {
    if (!t.lemma) return;
    setPicked({ lemma: t.lemma, surface: t.surface, sentence });
    setTapped((s) => (s.has(t.lemma!) ? s : new Set(s).add(t.lemma!)));
    playWord(lang, t.lemma, t.surface);
  }

  const progress = story.sentences.length ? ((playing ?? cursor) + 1) / story.sentences.length : 0;

  return (
    <>
      <div className="reader-bar">
        <Link href={`/${lang}`} className="btn ghost sm">{Icon.back} Home</Link>
        <div className="row">
          <button className={`chip save-chip${learner.favorites.includes(story.id) ? " on" : ""}`} aria-pressed={learner.favorites.includes(story.id)} onClick={() => learner.toggleFavorite(story.id)}>
            {Icon.bookmark} {learner.favorites.includes(story.id) ? "Saved" : "Save"}
          </button>
          <div className="seg" role="group" aria-label="Text size">
            <button aria-label="Smaller text" onClick={() => setSettings({ fontScale: Math.max(0.85, +(settings.fontScale - 0.1).toFixed(2)) })}>A−</button>
            <button aria-label="Larger text" onClick={() => setSettings({ fontScale: Math.min(1.4, +(settings.fontScale + 0.1).toFixed(2)) })}>A+</button>
          </div>
          <button className="chip" aria-pressed={settings.showTranslations} onClick={() => setSettings({ showTranslations: !settings.showTranslations })}>Translation</button>
          <button className="chip" aria-pressed={settings.highlightNew} onClick={() => setSettings({ highlightNew: !settings.highlightNew })}>Highlights</button>
        </div>
      </div>

      <div className="reader">
        <article className="article">
          <Cover story={story} className="article-art" />
          <div className="row small muted" style={{ marginTop: 16 }}>
            <span className="lvl">{story.level}</span>
            <span>{TOPIC_LABEL[isUserStory(story) ? "mine" : story.topic] ?? story.topic}</span>
            <span>· {story.date}</span>
            <span>· {story.sentences.reduce((n, x) => n + x.tokens.filter((t) => t.lemma).length, 0)} words</span>
            <span>· {story.minutes} min</span>
          </div>
          <h1 lang={lang} style={{ marginTop: 6 }}>{story.title}</h1>
          {story.titleEnglish && <p className="muted" style={{ margin: "4px 0 0" }}>{story.titleEnglish}</p>}

          <div className={`text${settings.highlightNew ? " hl" : ""}`} lang={lang} style={{ ["--scale" as string]: settings.fontScale }}>
            {story.sentences.map((s, i) => (
              <span key={i} id={`s-${i}`} className={`sent${playing === i ? " playing" : ""}`}>
                {s.tokens.map((t, j) => {
                  const space = !meta.noSpace && j > 0 && !PUNCT.test(t.surface) ? " " : "";
                  if (!t.lemma) return <span key={j}>{space}{t.surface}</span>;
                  // Only words the learner saved get the "review" style; words met before but not yet known stay "new".
                  const ws = t.isName ? "known" : learner.wordState(t.lemma);
                  const state = ws === "learning" && learner.word(t.lemma)?.saved !== "learning" ? "new" : ws;
                  const sel = picked?.lemma === t.lemma && picked.sentence === i;
                  return (
                    <span key={j}>
                      {space}
                      <button className={`w ${state}${sel ? " selected" : ""}`} onClick={() => pick(t, i)}>{t.surface}</button>
                    </span>
                  );
                })}
                {voice && (
                  <button className="icon-btn" style={{ width: 28, height: 28, marginLeft: 6, verticalAlign: "middle" }} aria-label={`Play sentence ${i + 1}`} onClick={() => (playing === i ? stop() : playFrom(i))}>
                    {Icon.speaker}
                  </button>
                )}
                {s.translation && !settings.showTranslations && (
                  <button className="icon-btn" style={{ width: 28, height: 28, marginLeft: 4, verticalAlign: "middle" }} aria-pressed={shown.has(i)} aria-label={`Translate sentence ${i + 1}`}
                    onClick={() => setShown((x) => { const n = new Set(x); if (n.has(i)) n.delete(i); else n.add(i); return n; })}>
                    {Icon.translate}
                  </button>
                )}
                {s.translation && (settings.showTranslations || shown.has(i)) && <span className="tr" lang="en">{s.translation}</span>}
              </span>
            ))}
          </div>

          <div className="legend">
            <span><span className="sw hl"><span className="w new">new</span></span>new word</span>
            <span><span className="sw hl"><span className="w learning">word</span></span>saved for review</span>
            <span>Tap any word for its meaning.</span>
          </div>

          <Finish story={story} tapped={tapped} done={done} onDone={(msg) => { setDone(true); setToast(msg); }} />
          {isUserStory(story) && (
            <DeleteStory onDelete={() => { learner.removeStory(story.id); router.push(`/${lang}`); }} />
          )}
        </article>

        <WordPanel story={story} picked={picked} ai={ai} onClose={() => setPicked(null)} />
      </div>

      {voice && (
        <div className="player">
          <div className="in">
            <button className="icon-btn" aria-label="Previous sentence" onClick={() => playFrom(Math.max(0, (playing ?? cursor) - 1))}>{Icon.prev}</button>
            <button className="icon-btn play" aria-label={playing !== null ? "Pause" : "Play"} onClick={() => (playing !== null ? stop() : playFrom(cursor >= story.sentences.length - 1 && cursor > 0 ? 0 : cursor))}>
              {playing !== null ? Icon.pause : Icon.play}
            </button>
            <button className="icon-btn" aria-label="Next sentence" onClick={() => playFrom(Math.min(story.sentences.length - 1, (playing ?? cursor) + 1))}>{Icon.next}</button>
            <div className="progress">
              <div className="spread small muted"><span>Sentence {(playing ?? cursor) + 1} of {story.sentences.length}</span><span>{recorded ? "Recorded audio" : "Browser voice"}</span></div>
              <div className="bar"><i style={{ width: `${progress * 100}%` }} /></div>
            </div>
            <div className="seg" role="group" aria-label="Speed">
              {RATES.map((r) => <button key={r} aria-pressed={settings.rate === r} onClick={() => setSettings({ rate: r })}>{r}×</button>)}
            </div>
          </div>
        </div>
      )}
      <Toast text={toast} />
    </>
  );
}

function WordPanel({ story, picked, ai, onClose }: { story: AnyStory; picked: Picked | null; ai: boolean; onClose: () => void }) {
  const lang = story.lang;
  const learner = useLearner(lang);
  const [explain, setExplain] = useState<{ key: string; text?: string; error?: string; busy: boolean } | null>(null);
  const [question, setQuestion] = useState("");

  if (!picked) {
    return (
      <aside className="panel idle" aria-label="Word details">
        <div className="eyebrow">Word</div>
        <p className="muted" style={{ margin: 0 }}>Tap any word in the story to see what it means, hear it, and save it for review.</p>
      </aside>
    );
  }

  const entry = lookupIn(story, picked.lemma);
  const ws = learner.wordState(picked.lemma);
  const state = ws === "learning" && learner.word(picked.lemma)?.saved !== "learning" ? "new" : ws;
  const w = learner.word(picked.lemma);
  const sentence = story.sentences[picked.sentence]!;
  const key = `${picked.sentence}`;
  const shown = explain?.key === key ? explain : null;
  const seen = Math.min(10, w?.encounters ?? 0);

  async function ask(q?: string) {
    setExplain({ key, busy: true });
    try {
      const { text } = await callAi<{ text: string }>("explain", { lang, sentence: textOf(story, sentence), translation: sentence.translation, question: q || undefined });
      setExplain({ key, text, busy: false });
    } catch (e) {
      setExplain({ key, error: (e as Error).message, busy: false });
    }
  }

  return (
    <aside className="panel" aria-label="Word details">
      <div className="spread">
        <span className="eyebrow">{entry?.pos ?? "Word"}</span>
        <button className="icon-btn close" aria-label="Close" onClick={onClose}>{Icon.close}</button>
      </div>
      <div className="row" style={{ alignItems: "center" }}>
        <span className="lemma" lang={lang}>{entry?.display ?? picked.lemma}</span>
        <button className="icon-btn" aria-label="Hear the word" onClick={() => playWord(lang, picked.lemma, picked.surface)}>{Icon.speaker}</button>
      </div>
      {entry?.reading && <span className="reading">{entry.reading}</span>}
      {picked.surface !== (entry?.display ?? picked.lemma) && <span className="muted small">In the text: <span lang={lang}>{picked.surface}</span></span>}
      <div style={{ fontSize: 18, fontWeight: 600 }}>{entry?.meaning ?? <span className="muted">No meaning in the dictionary yet.</span>}</div>

      <div>
        <div className="spread small muted" style={{ marginBottom: 4 }}><span>Seen in stories</span><span>{w?.encounters ?? 0}×</span></div>
        <div className="meter" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <span key={i} className={i < seen ? "on" : ""} />)}</div>
      </div>

      <div className="states" role="group" aria-label="Word status">
        <button className="s-learning" aria-pressed={state === "learning"} onClick={() => learner.setWord(picked.lemma, state === "learning" ? undefined : "learning", { storyId: story.id, sentence: picked.sentence })}>Review</button>
        <button className="s-known" aria-pressed={state === "known"} onClick={() => learner.setWord(picked.lemma, "known")}>Known</button>
        <button className="s-ignored" aria-pressed={state === "ignored"} onClick={() => learner.setWord(picked.lemma, state === "ignored" ? undefined : "ignored")}>Ignore</button>
      </div>

      {sentence.translation && (
        <div className="box"><div className="eyebrow" style={{ marginBottom: 4 }}>Sentence</div>{sentence.translation}</div>
      )}

      {ai && (
        <div className="box">
          <div className="spread">
            <span className="eyebrow row" style={{ display: "inline-flex" }}>{Icon.spark} AI tutor</span>
            {!shown?.busy && <button className="btn sm" onClick={() => ask()}>Explain sentence</button>}
          </div>
          {shown?.busy && <p className="muted small" style={{ margin: "8px 0 0" }}>Thinking…</p>}
          {shown?.text && <div className="ai-text">{shown.text}</div>}
          {shown?.error && <p className="small" style={{ color: "var(--danger)", margin: "8px 0 0" }}>{shown.error}</p>}
          <form className="row" style={{ marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); if (question.trim()) ask(question.trim()); }}>
            <input className="input" style={{ flex: 1, minWidth: 0 }} placeholder="Ask about this sentence" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={300} />
            <button className="btn sm" disabled={!question.trim() || shown?.busy}>Ask</button>
          </form>
        </div>
      )}
    </aside>
  );
}

interface Question {
  lemma: string;
  word: string;
  sentence: number;
  context: string;
  options: string[];
  answer: string;
}

function makeQuiz(story: AnyStory, tapped: Set<string>, isNew: (l: string) => boolean): Question[] {
  const seen = new Set<string>();
  const items: { lemma: string; surface: string; sentence: number; meaning: string }[] = [];
  story.sentences.forEach((s, i) =>
    s.tokens.forEach((t) => {
      if (!t.lemma || t.isName || seen.has(t.lemma)) return;
      const m = lookupIn(story, t.lemma)?.meaning;
      if (!m) return;
      seen.add(t.lemma);
      items.push({ lemma: t.lemma, surface: t.surface, sentence: i, meaning: m });
    }),
  );
  const meanings = [...new Set(items.map((i) => i.meaning))];
  if (meanings.length < 4) return [];
  const rank = (l: string) => (tapped.has(l) ? 0 : isNew(l) ? 1 : 2);
  const pool = [...items].sort((a, b) => rank(a.lemma) - rank(b.lemma) || Math.random() - 0.5).slice(0, 3);
  return pool.map((it) => {
    const wrong = meanings.filter((m) => m !== it.meaning).sort(() => Math.random() - 0.5).slice(0, 3);
    return {
      lemma: it.lemma,
      word: it.surface,
      sentence: it.sentence,
      context: textOf(story, story.sentences[it.sentence]!),
      options: [...wrong, it.meaning].sort(() => Math.random() - 0.5),
      answer: it.meaning,
    };
  });
}

function Finish({ story, tapped, done, onDone }: { story: AnyStory; tapped: Set<string>; done: boolean; onDone: (msg: string) => void }) {
  const lang = story.lang;
  const learner = useLearner(lang);
  const ranked = useRankedStories(lang);
  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const next = useMemo(() => ranked.find((r) => !r.read && r.story.id !== story.id), [ranked, story.id]);

  function finish(score?: { right: number; total: number }) {
    const r = learner.finishStory(story, tapped);
    if (score) learner.recordQuiz(score.right, score.total);
    const parts = ["Story finished"];
    if (r.newlyKnown) parts.push(`${r.newlyKnown} new ${r.newlyKnown === 1 ? "word" : "words"} known`);
    if (r.reviewedInStory) parts.push(`${r.reviewedInStory} reviewed`);
    onDone(parts.join(" · "));
  }

  if (done) {
    return (
      <div className="finish">
        <h2 style={{ fontSize: 22, margin: 0 }}>Well done!</h2>
        <div className="row">
          {next && <Link className="btn primary" href={`/${lang}/read/${next.story.id}`}>Next story: <span lang={lang}>{next.story.title}</span></Link>}
          <Link className="btn" href={`/${lang}/practice`}>Practice words</Link>
          <Link className="btn ghost" href={`/${lang}`}>Today</Link>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="finish">
        <div className="spread">
          <span><b>Finished reading?</b> <span className="muted">A quick check helps the words stick.</span></span>
          <div className="row">
            <button className="btn" onClick={() => finish()}>Mark as read</button>
            <button className="btn primary" onClick={() => {
              const q = makeQuiz(story, tapped, (l) => learner.wordState(l) === "new");
              if (q.length) setQuiz(q);
              else finish();
            }}>Quick check</button>
          </div>
        </div>
      </div>
    );
  }

  const q = quiz[step]!;
  const answered = chosen !== null;
  return (
    <div className="finish">
      <div className="quiz">
        <div className="spread small muted"><span>Question {step + 1} of {quiz.length}</span><span>What does it mean?</span></div>
        <div className="q" lang={lang}>{q.word}</div>
        <div className="muted" lang={lang} style={{ fontFamily: "var(--f-read)" }}>
          {q.context.split(q.word).map((part, i, arr) => <span key={i}>{part}{i < arr.length - 1 && <mark>{q.word}</mark>}</span>)}
        </div>
        <div className="choices">
          {q.options.map((o) => (
            <button key={o} className={`choice${answered && o === q.answer ? " ok" : ""}${answered && o === chosen && o !== q.answer ? " no" : ""}`} disabled={answered}
              onClick={() => {
                setChosen(o);
                if (o === q.answer) setRight((n) => n + 1);
                else learner.setWord(q.lemma, "learning", { storyId: story.id, sentence: q.sentence });
              }}>{o}</button>
          ))}
        </div>
        {answered && (
          <div className="spread">
            <span className="small">{chosen === q.answer ? "Correct!" : "Not quite. Saved for review."}</span>
            <button className="btn primary sm" onClick={() => {
              if (step + 1 < quiz.length) { setStep(step + 1); setChosen(null); }
              else finish({ right, total: quiz.length });
            }}>{step + 1 < quiz.length ? "Next" : "Finish"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function DeleteStory({ onDelete }: { onDelete: () => void }) {
  const [sure, setSure] = useState(false);
  return (
    <div style={{ marginTop: 18 }}>
      <button className={`btn sm ${sure ? "danger" : "ghost"}`} onClick={() => (sure ? onDelete() : setSure(true))}>
        {sure ? "Tap again to delete this text" : "Delete this text"}
      </button>
    </div>
  );
}
