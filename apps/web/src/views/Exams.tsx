"use client";

import { grammarFor, language, lookup } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { playSentence, stopAudio } from "@/lib/audio";
import { useLearner } from "@/lib/learner";
import { highlight, shuffle } from "@/lib/words";
import { isUserStory, textOf, useStories } from "@/lib/stories";
import { Icon } from "@/components/ui";
import { Tr } from "@/lib/translate";

type Section = "Listening" | "Reading" | "Vocabulary" | "Grammar";
interface Q {
  section: Section;
  /** Shown above the options. */
  prompt: string;
  /** Sentence to speak (listening). */
  say?: { storyId: string; index: number; text: string };
  options: string[];
  answer: string;
  note?: string;
  /** Grammar fallback: the English meaning the learner must match to a sentence. */
  means?: string;
}

const PER_SECTION = 5;
const MINUTES = 20;
const PASS = 60;
const FUNCTION = new Set(["pron", "det", "prep", "conj", "part", "aux", "num", "intj", "name"]);
/** Only nouns and verbs are blanked in Reading: other classes (pronouns, adjectives) often have several valid answers. */
const GAP = new Set(["noun", "verb"]);

/** Storyling mock exams: four timed sections built from the level's own stories. Not an official Goethe/Telc paper. */
export function Exams({ lang }: { lang: LangCode }) {
  const meta = language(lang);
  const learner = useLearner(lang);
  const stories = useStories(lang);
  const [level, setLevel] = useState<string | null>(null);
  const [run, setRun] = useState(0);

  const counts = useMemo(() => Object.fromEntries(meta.levels.map((l) => [l, stories.filter((s) => s.level === l && !isUserStory(s)).length])), [meta, stories]);

  if (!level)
    return (
      <>
        <div className="page-head"><div><div className="eyebrow">{meta.name} · {MINUTES} minutes · 4 sections</div><h1>Mock exams</h1></div></div>
        <p className="muted" style={{ marginTop: -8 }}>Exam-style practice in the structure of the big language exams: Listening, Reading, Vocabulary and Grammar. Pass mark {PASS}%. These papers are written by Storyling from its own texts, they are not official Goethe, Telc or other exam papers.</p>
        <div className="game-grid">
          {meta.levels.map((l) => {
            const best = learner.games[`exam-${l}`];
            return (
              <button key={l} className="game-card" disabled={counts[l]! < 6} style={{ textAlign: "left" }} onClick={() => { setLevel(l); setRun((r) => r + 1); }}>
                <span className="t">{l}</span>
                <span className="muted small">{counts[l]} texts · {PER_SECTION * 4} questions</span>
                <span className="small gm">{best ? `Best ${best.best}% · taken ${best.played}×` : "Not taken yet"}</span>
              </button>
            );
          })}
        </div>
        {learner.exams.length > 0 && (
          <section style={{ marginTop: 24 }} aria-label="Your past papers">
            <h2 style={{ fontSize: 18 }}>Your past papers</h2>
            <div className="table">
              {learner.exams.slice(0, 10).map((e) => (
                <div className="trow" key={e.at}>
                  <span>
                    <b>{e.level}</b> <span className="muted small">{new Date(e.at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className="small muted" style={{ display: "block" }}>{Object.entries(e.sections).map(([n, [r, of]]) => `${n} ${r}/${of}`).join(" · ")}</span>
                  </span>
                  <b style={{ color: e.pct >= PASS ? "var(--primary)" : undefined }}>{e.pct}%</b>
                </div>
              ))}
            </div>
          </section>
        )}
      </>
    );

  return <Paper key={`${level}-${run}`} lang={lang} level={level} onExit={() => setLevel(null)} onAgain={() => setRun((r) => r + 1)} />;
}

function build(lang: LangCode, level: string, stories: ReturnType<typeof useStories>): Q[] {
  const pool = stories.filter((s) => s.level === level && !isUserStory(s));
  const sents = pool.flatMap((story) => story.sentences.map((s, i) => ({ story, s, i, text: textOf(story, s) })).filter((x) => x.s.tokens.length >= 4 && x.text.length < 120));
  const out: Q[] = [];

  // Listening: hear a sentence, pick what was said.
  for (const x of shuffle(sents).slice(0, PER_SECTION)) {
    const others = shuffle(sents.filter((y) => y.text !== x.text)).slice(0, 2).map((y) => y.text);
    out.push({ section: "Listening", prompt: "Listen. What do you hear?", say: { storyId: x.story.id, index: x.i, text: x.text }, options: shuffle([x.text, ...others]), answer: x.text, ...(x.s.translation ? { note: x.s.translation } : {}) });
  }

  // Reading: fill the gap in a sentence with the right word.
  const bank = new Map<string, string[]>();
  for (const x of sents)
    for (const t of x.s.tokens) {
      const e = t.lemma ? lookup(lang, t.lemma) : undefined;
      if (e && GAP.has(e.pos)) bank.set(e.pos, [...(bank.get(e.pos) ?? []), t.surface]);
    }
  const reading: Q[] = [];
  for (const x of shuffle(sents)) {
    if (reading.length >= PER_SECTION) break;
    const cands = x.s.tokens.filter((t) => {
      const e = t.lemma ? lookup(lang, t.lemma) : undefined;
      return e && GAP.has(e.pos) && t.surface.length > 2 && (bank.get(e.pos)?.length ?? 0) > 6;
    });
    const t = cands[Math.floor(Math.random() * cands.length)];
    if (!t) continue;
    const pos = lookup(lang, t.lemma!)!.pos;
    const wrong = shuffle([...new Set(bank.get(pos)!)].filter((w) => w.toLowerCase() !== t.surface.toLowerCase())).slice(0, 3);
    if (wrong.length < 3 || !x.text.includes(t.surface)) continue;
    const parts = highlight(x.text, t.surface)!;
    reading.push({ section: "Reading", prompt: `${parts[0]}_____${parts[2]}`, options: shuffle([t.surface, ...wrong]), answer: t.surface, ...(x.s.translation ? { note: x.s.translation } : {}) });
  }
  out.push(...reading);

  // Vocabulary: pick the meaning of a word.
  const words = new Map<string, { display: string; meaning: string }>();
  for (const x of sents)
    for (const t of x.s.tokens) {
      const e = t.lemma ? lookup(lang, t.lemma) : undefined;
      if (e && !FUNCTION.has(e.pos)) words.set(e.lemma, { display: e.display, meaning: e.meaning });
    }
  const meanings = [...new Set([...words.values()].map((w) => w.meaning))];
  for (const w of shuffle([...words.values()]).slice(0, PER_SECTION))
    out.push({ section: "Vocabulary", prompt: w.display, options: shuffle([w.meaning, ...shuffle(meanings.filter((m) => m !== w.meaning)).slice(0, 3)]), answer: w.meaning });

  // Grammar: written exercises when the language has them; otherwise meaning-to-sentence.
  const topics = grammarFor(lang).filter((g) => g.level === level);
  const items = shuffle(topics.flatMap((t) => t.items)).slice(0, PER_SECTION);
  if (items.length >= PER_SECTION) for (const it of items) out.push({ section: "Grammar", prompt: it.q, options: shuffle(it.o), answer: it.a, note: it.why });
  else
    for (const x of shuffle(sents.filter((y) => y.s.translation)).slice(0, PER_SECTION)) {
      const others = shuffle(sents.filter((y) => y.text !== x.text)).slice(0, 2).map((y) => y.text);
      out.push({ section: "Grammar", prompt: "Which sentence means:", means: x.s.translation, options: shuffle([x.text, ...others]), answer: x.text });
    }
  return out;
}

function Paper({ lang, level, onExit, onAgain }: { lang: LangCode; level: string; onExit: () => void; onAgain: () => void }) {
  const learner = useLearner(lang);
  const stories = useStories(lang);
  const qs = useMemo(() => build(lang, level, stories), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [answers, setAnswers] = useState<(string | null)[]>(() => qs.map(() => null));
  const [n, setN] = useState(0);
  const [left, setLeft] = useState(MINUTES * 60);
  const [done, setDone] = useState(false);
  const saved = useRef(false);

  const total = qs.length;
  const sections = (["Listening", "Reading", "Vocabulary", "Grammar"] as Section[]).map((name) => {
    const idx = qs.map((q, i) => (q.section === name ? i : -1)).filter((i) => i >= 0);
    const right = idx.filter((i) => answers[i] === qs[i]!.answer).length;
    return { name, right, of: idx.length };
  });
  const right = sections.reduce((a, s) => a + s.right, 0);
  const pct = total ? Math.round((right / total) * 100) : 0;

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [done]);
  useEffect(() => { if (left <= 0 && !done) setDone(true); }, [left, done]);
  useEffect(() => {
    if (done && !saved.current) {
      saved.current = true;
      learner.recordGame(`exam-${level}`, pct);
      learner.recordExam({ level, pct, sections: Object.fromEntries(sections.map((s) => [s.name, [s.right, s.of] as [number, number]])) });
      stopAudio();
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopAudio(), []);

  const q = qs[n];
  useEffect(() => {
    if (q?.say && !done) playSentence(q.say.storyId, lang, q.say.index, q.say.text, 1);
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!qs.length) return <div className="empty"><p className="muted">Not enough texts at this level yet.</p><button className="btn" onClick={onExit}>Back</button></div>;

  if (done)
    return (
      <>
        <div className="page-head"><div><div className="eyebrow">{language(lang).name} · {level}</div><h1>Result</h1></div></div>
        <div className="flash">
          <div className="score-ring" style={{ ["--p" as string]: pct / 100 }}><b>{pct}%</b></div>
          <h2 style={{ fontSize: 22 }}>{pct >= PASS ? "Passed" : "Not passed yet"}</h2>
          <p className="muted" style={{ margin: 0 }}>{right} of {total} correct. Pass mark {PASS}%.</p>
          <div className="table" style={{ textAlign: "left" }}>
            {sections.map((s) => (
              <div className="trow" key={s.name}><span>{s.name}</span><span><b>{s.right}</b> / {s.of}</span></div>
            ))}
          </div>
          <details style={{ textAlign: "left" }}>
            <summary>Review answers</summary>
            {qs.map((x, i) => (
              <p key={i} className="small" lang={lang} style={{ margin: "8px 0" }}>
                <b>{i + 1}.</b> {x.section === "Listening" ? x.answer : x.prompt} — {answers[i] === x.answer ? "✓" : <span>✗ <b>{x.answer}</b></span>}{x.note ? <span className="muted"> · <Tr>{x.note}</Tr></span> : null}
              </p>
            ))}
          </details>
          <button className="btn primary block" onClick={onAgain}>New paper</button>
          <button className="btn block" onClick={onExit}>All levels</button>
        </div>
      </>
    );

  const q2 = q!;
  const mm = String(Math.floor(Math.max(left, 0) / 60)).padStart(2, "0");
  const ss = String(Math.max(left, 0) % 60).padStart(2, "0");
  const answered = answers.filter(Boolean).length;
  return (
    <>
      <div className="page-head">
        <div className="row"><button className="btn ghost sm" onClick={onExit}>← Exams</button><h1 style={{ fontSize: 26 }}>{level} mock exam</h1></div>
        <span className="pill" style={{ fontVariantNumeric: "tabular-nums", color: left < 120 ? "var(--danger, #c0392b)" : undefined }}>{mm}:{ss}</span>
      </div>
      <div className="flash" style={{ textAlign: "left" }}>
        <div className="spread small muted"><span>{q2.section} · question {n + 1} of {total}</span><span>{answered} answered</span></div>
        <div className="meter" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
          {qs.map((_, i) => <span key={i} className={answers[i] ? "on" : ""} />)}
        </div>
        {q2.say ? (
          <div className="row" style={{ justifyContent: "center" }}>
            <button className="icon-btn play big" aria-label="Play again" onClick={() => playSentence(q2.say!.storyId, lang, q2.say!.index, q2.say!.text, 1)}>{Icon.play}</button>
          </div>
        ) : null}
        <div lang={q2.section === "Vocabulary" || q2.section === "Reading" || q2.section === "Grammar" ? lang : undefined} style={{ fontFamily: "var(--f-read)", fontSize: q2.section === "Vocabulary" ? 34 : 21, lineHeight: 1.5 }}>{q2.section === "Grammar" && q2.means ? <>{q2.prompt} “<Tr>{q2.means}</Tr>”</> : q2.prompt}</div>
        <div className="choices">
          {q2.options.map((o) => (
            <button key={o} lang={q2.section === "Vocabulary" ? undefined : lang} className={`choice${answers[n] === o ? " ok" : ""}`} onClick={() => setAnswers((a) => a.map((v, i) => (i === n ? o : v)))}>{q2.section === "Vocabulary" ? <Tr>{o}</Tr> : o}</button>
          ))}
        </div>
        <div className="spread">
          <button className="btn ghost" disabled={n === 0} onClick={() => setN(n - 1)}>Previous</button>
          {n + 1 < total ? (
            <button className="btn primary" onClick={() => setN(n + 1)}>Next</button>
          ) : (
            <button className="btn primary" onClick={() => setDone(true)}>Finish exam</button>
          )}
        </div>
        {n + 1 < total && answered === total && <button className="btn block" onClick={() => setDone(true)}>Finish exam</button>}
      </div>
    </>
  );
}
