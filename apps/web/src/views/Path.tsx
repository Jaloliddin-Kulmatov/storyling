"use client";

import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SpeakRun } from "@/components/StoryTools";
import { Icon } from "@/components/ui";
import { playSentence, playWord, stopAudio } from "@/lib/audio";
import { today, useLearner } from "@/lib/learner";
import { keywordsOf, lessonsFor, type Keyword, type Lesson } from "@/lib/path";
import { textOf } from "@/lib/stories";
import { shuffle } from "@storyling/learner";
import { Tr } from "@/lib/translate";
import { Confetti } from "@/views/Practice";

const CAMP_DAYS = [14, 30] as const;
const STEPS = ["Warm up", "Lesson", "Speak", "Review"] as const;

const dayIndex = (start: string, day = today()) => Math.round((Date.parse(day) - Date.parse(start)) / 864e5);

/** The guided path: a course per level, one lesson after another, with an optional bootcamp that sets a daily deadline. */
export function PathPage({ lang }: { lang: LangCode }) {
  const learner = useLearner(lang);
  const meta = language(lang);
  const [level, setLevel] = useState(meta.levels[Math.min(learner.level ?? 0, meta.levels.length - 1)]!);
  useEffect(() => {
    if (learner.path.camp) setLevel(learner.path.camp.level);
  }, [learner.path.camp]);
  const lessons = useMemo(() => lessonsFor(lang, level), [lang, level]);
  const done = learner.path.done;
  const doneHere = lessons.filter((l) => done[l.story.id]).length;
  const next = lessons.find((l) => !done[l.story.id]);

  return (
    <>
      <div className="page-head"><div><div className="eyebrow">{meta.name} · {doneHere}/{lessons.length} lessons</div><h1>Your path</h1></div></div>
      <div className="level-tabs" role="tablist" aria-label="Level">
        {meta.levels.map((l) => (
          <button key={l} role="tab" aria-selected={level === l} onClick={() => setLevel(l)}>
            {l} <small>{lessonsFor(lang, l).filter((x) => done[x.story.id]).length}/{lessonsFor(lang, l).length}</small>
          </button>
        ))}
      </div>

      <Bootcamp lang={lang} level={level} lessons={lessons} />

      {next && (
        <Link className="pt-next" href={`/${lang}/path/${next.story.id}`}>
          <span className="pt-next-n">{next.n}</span>
          <span className="stack" style={{ gap: 2 }}>
            <span className="small" style={{ opacity: 0.8 }}>Next lesson · about 10 minutes</span>
            <b lang={lang}>{next.story.title}</b>
            <span className="small" style={{ opacity: 0.8 }}>{next.story.titleEnglish}</span>
          </span>
          <span className="btn sm pt-go">Start →</span>
        </Link>
      )}

      <ol className="pt-steps-legend" aria-label="Every lesson">
        {STEPS.map((s, i) => <li key={s}><b>{i + 1}</b> {s}</li>)}
      </ol>

      <ol className="pt-path">
        {lessons.map((l, i) => {
          const isDone = !!done[l.story.id];
          const isNext = l === next;
          return (
            <li key={l.story.id} className={`pt-node${isDone ? " done" : ""}${isNext ? " next" : ""}`} style={{ ["--i" as string]: i % 12, ["--x" as string]: `${Math.sin(i * 0.9) * 22}%` }}>
              <Link href={`/${lang}/path/${l.story.id}`} className="pt-dot" aria-label={`Lesson ${l.n}: ${l.story.titleEnglish}`}>{isDone ? "✓" : l.n}</Link>
              <span className="pt-label">
                <b lang={lang}>{l.story.title}</b>
                <span className="small muted">{l.story.titleEnglish}</span>
              </span>
            </li>
          );
        })}
      </ol>
      {!lessons.length && <div className="empty"><p className="muted">No lessons at this level yet.</p></div>}
    </>
  );
}

function Bootcamp({ lang, level, lessons }: { lang: LangCode; level: string; lessons: Lesson[] }) {
  const learner = useLearner(lang);
  const camp = learner.path.camp;
  const done = learner.path.done;
  if (!camp || camp.level !== level)
    return (
      <section className="bc bc-off">
        <div className="stack" style={{ gap: 4 }}>
          <b>🏕️ Bootcamp</b>
          <span className="small">One lesson a day with a deadline at midnight. Stay on track and finish the {level} course.</span>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {CAMP_DAYS.map((d) => <button key={d} className="btn sm" disabled={!lessons.length} onClick={() => learner.startCamp(level, Math.min(d, lessons.length))}>{Math.min(d, lessons.length)} days</button>)}
        </div>
      </section>
    );
  const day = Math.min(camp.days, dayIndex(camp.start) + 1);
  const finishedIn = Object.values(done).filter((d) => d >= camp.start).length;
  const doneToday = Object.values(done).filter((d) => d === today()).length;
  const due = Math.min(camp.days, day);
  const behind = Math.max(0, due - finishedIn);
  const complete = finishedIn >= camp.days;
  const end = new Date();
  end.setHours(24, 0, 0, 0);
  const hours = Math.max(0, Math.floor((end.getTime() - Date.now()) / 36e5));
  return (
    <section className={`bc${complete ? " won" : behind ? " late" : ""}`}>
      {complete && <Confetti />}
      <div className="spread" style={{ flexWrap: "wrap", gap: 8 }}>
        <div className="stack" style={{ gap: 2 }}>
          <b>{complete ? `🏆 Bootcamp complete!` : `🏕️ Bootcamp · day ${day} of ${camp.days}`}</b>
          <span className="small">
            {complete ? `You finished ${camp.days} lessons. Start another level when you're ready.`
              : doneToday ? "✓ Today's lesson is done. See you tomorrow!"
              : behind > 1 ? `You're ${behind} lessons behind. Catch up today.`
              : `Today's lesson is due in ${hours} ${hours === 1 ? "hour" : "hours"}.`}
          </span>
        </div>
        <button className="btn ghost sm" onClick={() => { if (confirm("Stop this bootcamp? Your finished lessons stay.")) learner.stopCamp(); }}>Stop</button>
      </div>
      <div className="bc-days" aria-label="Days">
        {Array.from({ length: camp.days }, (_, i) => {
          const d = new Date(Date.parse(camp.start) + i * 864e5).toISOString().slice(0, 10);
          const hit = Object.values(done).includes(d);
          const past = i < day - 1;
          return <i key={i} title={d} className={hit ? "hit" : i === day - 1 ? "today" : past ? "miss" : ""} />;
        })}
      </div>
      <div className="bc-bar"><span style={{ width: `${Math.min(100, (finishedIn / camp.days) * 100)}%` }} /></div>
      <span className="small muted">{finishedIn}/{camp.days} lessons</span>
    </section>
  );
}

/** One lesson: warm up, read with one grammar point, speak, review. */
export function PathLesson({ lang, id }: { lang: LangCode; id: string }) {
  const learner = useLearner(lang);
  const router = useRouter();
  const all = useMemo(() => language(lang).levels.flatMap((l) => lessonsFor(lang, l)), [lang]);
  const at = all.findIndex((l) => l.story.id === id);
  const lesson = all[at];
  const prev = at > 0 && all[at - 1]!.story.level === lesson?.story.level ? all[at - 1] : undefined;
  const nextLesson = all[at + 1];
  const known = (l: string) => learner.wordState(l) === "known";
  // Picked once, so marking words while learning doesn't reshuffle the lesson.
  const [keys] = useState<Keyword[]>(() => (lesson ? keywordsOf(lesson.story, known) : []));
  const [warm] = useState<Keyword[]>(() => (prev ? keywordsOf(prev.story, () => false) : []));
  const [step, setStep] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  // The grammar note comes from the story itself (AI); the level's written topic is the fallback when AI is off.
  const [noAi, setNoAi] = useState(false);
  useEffect(() => () => stopAudio(), []);

  if (!lesson) return <div className="empty"><p className="muted">This lesson doesn't exist.</p><Link className="btn" href={`/${lang}/path`}>Back to the path</Link></div>;
  const story = lesson.story;
  const go = (n: number) => { stopAudio(); setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="pl">
      <div className="spread" style={{ marginBottom: 12 }}>
        <Link className="btn ghost sm" href={`/${lang}/path`}>{Icon.back} Path</Link>
        <span className="small muted">{story.level} · Lesson {lesson.n}</span>
      </div>
      <ol className="pl-steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i < step || score !== null ? "done" : i === step ? "on" : ""}>
            <button disabled={i > step && score === null} onClick={() => go(i)}><b>{i < step || score !== null ? "✓" : i + 1}</b><span>{s}</span></button>
          </li>
        ))}
      </ol>

      <div className="pl-card" key={step}>
        {step === 0 && (
          warm.length >= 4
            ? <>
                <h2>Warm up</h2>
                <p className="muted">Words from your last lesson, <span lang={lang}>{prev!.story.title}</span>. Do you still know them?</p>
                <Quiz lang={lang} words={warm} pool={warm} onDone={() => go(1)} />
              </>
            : <>
                <h2>Warm up: 5 words to know</h2>
                <p className="muted">Tap a word to hear it. You'll meet each one in the story.</p>
                <KeywordCards lang={lang} words={keys} />
                <button className="btn primary block" onClick={() => go(1)}>Start the lesson</button>
              </>
        )}

        {step === 1 && (
          <>
            <h2 lang={lang}>{story.title}</h2>
            <p className="muted" style={{ marginTop: -6 }}>{story.titleEnglish}</p>
            <KeywordCards lang={lang} words={keys} compact />
            <StoryText lang={lang} story={story} />
            <AiGrammar lang={lang} id={story.id} onFail={() => setNoAi(true)} />
            {noAi && lesson.grammar && (
              <div className="pl-grammar">
                <span className="small muted">Grammar point</span>
                <b>{lesson.grammar.title}</b>
                {lesson.grammar.explain.split(/\n\s*\n/).slice(0, 2).map((p, i) => <p key={i}>{p.replace(/^- /gm, "• ")}</p>)}
                <Link className="small" href={`/${lang}/grammar`}>More on this in Grammar →</Link>
              </div>
            )}
            <button className="btn primary block" onClick={() => go(2)}>I've read it: speak</button>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Speak</h2>
            <p className="muted">Listen to each sentence, then say it yourself. Your browser checks what it hears.</p>
            <SpeakRun story={story} onFinish={() => go(3)} />
            <button className="btn ghost block" onClick={() => go(3)}>Skip speaking for now</button>
          </>
        )}

        {step === 3 && score === null && (
          <>
            <h2>Review</h2>
            <p className="muted">What do these words from the story mean?</p>
            <Quiz lang={lang} words={keys} pool={keys} onDone={(pct) => {
              setScore(pct);
              learner.completeLesson(story.id);
              learner.recordGame("path", pct);
              keys.forEach((k) => { if (!known(k.lemma)) learner.setWord(k.lemma, "learning"); });
            }} />
          </>
        )}

        {score !== null && (
          <div className="pl-done">
            <Confetti />
            <span className="pl-trophy" aria-hidden="true">🎉</span>
            <h2>Lesson {lesson.n} done!</h2>
            <p className="muted">Review score {score}%. The 5 words are in your notebook for flashcards.</p>
            {nextLesson && nextLesson.story.level === story.level
              ? <button className="btn primary block" onClick={() => router.push(`/${lang}/path/${nextLesson.story.id}`)}>Next lesson: <span lang={lang}>{nextLesson.story.title}</span></button>
              : <Link className="btn primary block" href={`/${lang}/path`}>Back to the path</Link>}
            <Link className="btn ghost block" href={`/${lang}/path`}>See my path</Link>
          </div>
        )}
      </div>
    </div>
  );
}

/** The lesson's grammar point: one the AI picks from this very story, written once and then cached. */
function AiGrammar({ lang, id, onFail }: { lang: LangCode; id: string; onFail: () => void }) {
  const [note, setNote] = useState<{ title: string; explain: string; example: string } | null | "none">(null);
  useEffect(() => {
    let dead = false;
    fetch(`/api/lesson-grammar?lang=${lang}&id=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (dead) return; setNote(d?.title ? d : "none"); if (!d?.title) onFail(); })
      .catch(() => { if (!dead) { setNote("none"); onFail(); } });
    return () => { dead = true; };
  }, [lang, id]);
  if (note === "none") return null;
  return (
    <div className="pl-grammar">
      <span className="small muted">Grammar point · written by AI</span>
      {note ? (
        <>
          <b>{note.title}</b>
          <p>{note.explain}</p>
          {note.example && <p lang={lang} style={{ fontFamily: "var(--f-read)", fontSize: 17 }}>“{note.example}”</p>}
        </>
      ) : <span className="muted small">Finding a grammar point in this story…</span>}
    </div>
  );
}

function KeywordCards({ lang, words, compact = false }: { lang: LangCode; words: Keyword[]; compact?: boolean }) {
  return (
    <div className={`kw${compact ? " compact" : ""}`}>
      {words.map((w, i) => (
        <button key={w.lemma} className="kw-card" style={{ ["--i" as string]: i }} onClick={() => playWord(lang, w.lemma, w.display)}>
          <b lang={lang}>{w.display}</b>
          {w.reading && <span className="reading">{w.reading}</span>}
          <span className="small muted"><Tr>{w.meaning}</Tr></span>
        </button>
      ))}
    </div>
  );
}

function StoryText({ lang, story }: { lang: LangCode; story: Lesson["story"] }) {
  const [show, setShow] = useState<Set<number>>(new Set());
  return (
    <div className="pl-text" lang={lang}>
      {story.sentences.map((s, i) => (
        <p key={i}>
          <button className="icon-btn" aria-label="Listen" onClick={() => playSentence(story.id, lang, i, textOf(story, s))}>{Icon.speaker}</button>
          <span onClick={() => setShow((x) => { const n = new Set(x); if (n.has(i)) n.delete(i); else n.add(i); return n; })}>{textOf(story, s)}</span>
          {show.has(i) && s.translation && <small lang="en">{s.translation}</small>}
        </p>
      ))}
      <span className="small muted" style={{ fontFamily: "var(--f-ui)" }}>Tap a sentence for its translation. <Link href={`/${lang}/read/${story.id}`}>Open in the full reader</Link> to tap single words.</span>
    </div>
  );
}

function Quiz({ lang, words, pool, onDone }: { lang: LangCode; words: Keyword[]; pool: Keyword[]; onDone: (pct: number) => void }) {
  const [qs] = useState(() => words.map((w) => ({ w, options: shuffle([w, ...shuffle(pool.filter((p) => p.meaning !== w.meaning)).slice(0, 3)]) })));
  const [n, setN] = useState(0);
  const [right, setRight] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const q = qs[n];
  useEffect(() => { if (q) playWord(lang, q.w.lemma, q.w.display); }, [n]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!q) return null;
  const pick = (o: Keyword) => {
    if (picked) return;
    setPicked(o.lemma);
    if (o === q.w) setRight((r) => r + 1);
  };
  const next = () => {
    const total = right;
    if (n + 1 >= qs.length) onDone(Math.round((total / qs.length) * 100));
    else { setN(n + 1); setPicked(null); }
  };
  return (
    <div className="pl-quiz" key={n}>
      <div className="g-progress"><span style={{ width: `${(n / qs.length) * 100}%` }} /></div>
      <button className="pic-word" lang={lang} onClick={() => playWord(lang, q.w.lemma, q.w.display)}>{q.w.display} <span aria-hidden="true">{Icon.speaker}</span></button>
      <div className="choices">
        {q.options.map((o) => (
          <button key={o.lemma} disabled={!!picked} className={`choice${picked && o === q.w ? " ok" : ""}${picked === o.lemma && o !== q.w ? " no" : ""}`} onClick={() => pick(o)}><Tr>{o.meaning}</Tr></button>
        ))}
      </div>
      {picked && <button className="btn primary block" onClick={next}>{n + 1 >= qs.length ? "Finish" : "Next"}</button>}
    </div>
  );
}

/** Home card: the next lesson on the path, one tap away. */
export function PathCard({ lang }: { lang: LangCode }) {
  const learner = useLearner(lang);
  const meta = language(lang);
  const level = learner.path.camp?.level ?? meta.levels[Math.min(learner.level ?? 0, meta.levels.length - 1)]!;
  const lessons = useMemo(() => lessonsFor(lang, level), [lang, level]);
  const next = lessons.find((l) => !learner.path.done[l.story.id]);
  const doneCount = lessons.length - lessons.filter((l) => !learner.path.done[l.story.id]).length;
  if (!next) return null;
  return (
    <Link className="pt-home" href={`/${lang}/path/${next.story.id}`}>
      <span className="pt-next-n">{next.n}</span>
      <span className="stack" style={{ gap: 2, minWidth: 0 }}>
        <span className="small muted">{learner.path.camp ? "Bootcamp · today's lesson" : `Your ${level} path · ${doneCount}/${lessons.length}`}</span>
        <b lang={lang}>{next.story.title}</b>
        <span className="small muted">Warm up · Lesson · Speak · Review</span>
      </span>
      <span className="btn primary sm" style={{ marginLeft: "auto" }}>Continue</span>
    </Link>
  );
}
