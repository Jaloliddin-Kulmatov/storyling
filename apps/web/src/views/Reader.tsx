"use client";

import { countView } from "@/lib/views";
import { AskPanel, SpeakRun, WritePanel } from "@/components/StoryTools";
import { FUNCTION_POS, koreanLabels, romanize, shuffle, splitKorean } from "@storyling/learner";
import { ARTICLE, DE_GENDER, reviewOf } from "@storyling/content";
import { language } from "@storyling/content";
import type { LangCode, Token } from "@storyling/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { callAi, useAiEnabled } from "@/lib/ai";
import { canSpeak, hasRecording, playSentence, playWord, preload, stopAudio } from "@/lib/audio";
import { examplesFor, wordLevelOf } from "@storyling/learner";
import { useLearner, useSettings } from "@/lib/learner";
import { useRankedStories } from "@/lib/rank";
import { isUserStory, lookupIn, PUNCT, textOf, TOPIC_LABEL, useStory, type AnyStory } from "@/lib/stories";
import { Cover, Icon, Toast } from "@/components/ui";
import { DictationRun } from "@/components/DictationRun";
import { useStories } from "@/lib/stories";
import { Tr, useTranslated } from "@/lib/translate";

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
  const trs = useTranslated(story.sentences.map((x) => x.translation));

  const [picked, setPicked] = useState<Picked | null>(null);
  const [tapped, setTapped] = useState<Set<string>>(() => new Set());
  const [playing, setPlaying] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [shown, setShown] = useState<Set<number>>(() => new Set());
  const [mode, setMode] = useState<null | "dictation" | "grammar" | "speak" | "write" | "ask" | "settings" | "tools">(null);
  const run = useRef(0);
  const { markOpened } = learner;
  useEffect(() => { markOpened(story.id); if (!isUserStory(story)) countView(story.id); }, [story.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="row" style={{ gap: 6 }}>
          <button className={`icon-btn save-btn${learner.favorites.includes(story.id) ? " on" : ""}`} aria-pressed={learner.favorites.includes(story.id)} aria-label={learner.favorites.includes(story.id) ? "Saved" : "Save story"} onClick={() => learner.toggleFavorite(story.id)}>
            {Icon.bookmark}
          </button>
          <button className="icon-btn aa-btn" aria-label="Reading settings" onClick={() => setMode("settings")}>Aa</button>
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
          {!isUserStory(story) && (reviewOf(story.id)
            ? <p className="small review-ok" style={{ margin: "6px 0 0" }}>✓ Checked by a native speaker</p>
            : <p className="small muted" style={{ margin: "6px 0 0" }}>Written by Storyling. Not yet checked by a native speaker.</p>)}

          <div className={`text${settings.highlightNew ? " hl" : ""}${settings.levelUnderline ? " lvl-on" : ""}`} lang={lang} style={{ ["--scale" as string]: settings.fontScale }}>
            {story.sentences.map((s, i) => (
              <span key={i} id={`s-${i}`} className={`sent${playing === i ? " playing" : ""}`}>
                {s.tokens.map((t, j) => {
                  const space = !meta.noSpace && j > 0 && !PUNCT.test(t.surface) ? " " : "";
                  if (!t.lemma) return <span key={j}>{space}{t.surface}</span>;
                  // Only words the learner saved get the "review" style; words met before but not yet known stay "new".
                  const ws = t.isName ? "known" : learner.wordState(t.lemma);
                  const state = ws === "learning" && learner.word(t.lemma)?.saved !== "learning" ? "new" : ws;
                  const sel = picked?.lemma === t.lemma && picked.sentence === i;
                  const lv = wordLevelOf(lang, t.lemma);
                  const gender = lang === "de" && settings.genderColors && !t.isName ? genderOf(story, t.lemma) : undefined;
                  return (
                    <span key={j}>
                      {space}
                      <button className={`w ${state}${lv !== undefined && !t.isName ? ` lv${Math.min(lv, 4)}` : ""}${gender ? ` g-${gender}` : ""}${sel ? " selected" : ""}`} onClick={() => pick(t, i)}>{t.surface}</button>
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
                {lang === "ko" && settings.romanize && <span className="rom">{romanize(textOf(story, s))}</span>}
                {s.translation && (settings.showTranslations || shown.has(i)) && <span className="tr" lang={settings.translateTo}>{trs.texts[i]}</span>}
              </span>
            ))}
          </div>


          <StoryPractice story={story} tapped={tapped} done={done} onDone={(msg) => { setDone(true); setToast(msg); }} />
          <WatchMore story={story} />
          {isUserStory(story) && (
            <DeleteStory onDelete={() => { learner.removeStory(story.id); router.push(`/${lang}`); }} />
          )}
        </article>

        <WordPanel story={story} picked={picked} ai={ai} onClose={() => setPicked(null)} />
      </div>

      {!picked && (
        <button className="tools-fab" aria-label="Reading tools" onClick={() => { stop(); setMode("tools"); }}>{Icon.spark}<span>Tools</span></button>
      )}
      {mode === "dictation" && (
        <div className="overlay" role="dialog" aria-label="Dictation" onClick={(e) => e.target === e.currentTarget && setMode(null)}>
          <div className="sheet-in">
            <div className="spread"><b style={{ fontSize: 18 }}>Dictation · {story.title}</b><button className="icon-btn" aria-label="Close" onClick={() => setMode(null)}>{Icon.close}</button></div>
            <DictationRun
              items={story.sentences.map((_, index) => ({ story, index }))}
              rate={settings.rate}
              onFinish={(score) => { learner.recordGame("dictation", score); setMode(null); setToast(`Dictation finished · ${score}%`); }}
            />
          </div>
        </div>
      )}
      {mode === "settings" && (
        <div className="overlay" role="dialog" aria-label="Reading settings" onClick={(e) => e.target === e.currentTarget && setMode(null)}>
          <div className="sheet-in menu-sheet">
            <div className="spread"><b style={{ fontSize: 18 }}>Reading settings</b><button className="icon-btn" aria-label="Close" onClick={() => setMode(null)}>{Icon.close}</button></div>
            <div className="menu-row">
              <span>Text size</span>
              <div className="seg" role="group" aria-label="Text size">
                <button aria-label="Smaller text" onClick={() => setSettings({ fontScale: Math.max(0.85, +(settings.fontScale - 0.1).toFixed(2)) })}>A−</button>
                <button aria-label="Larger text" onClick={() => setSettings({ fontScale: Math.min(1.4, +(settings.fontScale + 0.1).toFixed(2)) })}>A+</button>
              </div>
            </div>
            <div className="menu-row">
              <span>Audio speed</span>
              <div className="seg" role="group" aria-label="Audio speed">
                {[0.75, 1, 1.25].map((r) => <button key={r} aria-pressed={settings.rate === r} onClick={() => setSettings({ rate: r })}>{r}×</button>)}
              </div>
            </div>
            <Toggle label="Show all translations" hint="A line in your language under every sentence" on={settings.showTranslations} set={(v) => setSettings({ showTranslations: v })} />
            {lang === "de" && <Toggle label="der / die / das colours" hint={<><b className="g-m">der</b> · <b className="g-f">die</b> · <b className="g-n">das</b></>} on={settings.genderColors} set={(v) => setSettings({ genderColors: v })} />}
            {lang === "ko" && <Toggle label="Romanization" hint="Latin letters under each sentence" on={settings.romanize} set={(v) => setSettings({ romanize: v })} />}
            <Toggle label="Highlight new words" hint={<><span className="hl"><span className="w new">new</span></span> not known yet · <span className="hl"><span className="w learning">word</span></span> saved for review</>} on={settings.highlightNew} set={(v) => setSettings({ highlightNew: v })} />
            <Toggle label="Underline words by level" hint={<span className="lvl-dots">{meta.levels.slice(0, 5).map((l, k) => <span key={l}><i style={{ background: `var(--lv${k})` }} />{l}</span>)}</span>} on={settings.levelUnderline} set={(v) => setSettings({ levelUnderline: v })} />
          </div>
        </div>
      )}
      {mode === "tools" && (
        <div className="overlay" role="dialog" aria-label="Reading tools" onClick={(e) => e.target === e.currentTarget && setMode(null)}>
          <div className="sheet-in menu-sheet">
            <div className="spread"><b style={{ fontSize: 18 }}>Practise with this story</b><button className="icon-btn" aria-label="Close" onClick={() => setMode(null)}>{Icon.close}</button></div>
            <div className="tool-grid">
              {voice && <button onClick={() => setMode("dictation")}><span className="ti">🎧</span><b>Dictation</b><span>Hear and type each sentence</span></button>}
              <button onClick={() => setMode("speak")}><span className="ti">🎙</span><b>Speak</b><span>Read aloud and get feedback</span></button>
              <button onClick={() => setMode("write")}><span className="ti">✍️</span><b>Write</b><span>Write about the story, get corrections</span></button>
              <button onClick={() => setMode("ask")}><span className="ti">💬</span><b>Ask</b><span>Questions about the text</span></button>
              <button onClick={() => setMode("grammar")}><span className="ti">📘</span><b>Grammar</b><span>Explain a sentence</span></button>
              <button onClick={() => { setMode(null); document.getElementById("practice")?.scrollIntoView({ behavior: "smooth" }); }}><span className="ti">✅</span><b>Words &amp; quiz</b><span>Meanings and practice below</span></button>
            </div>
          </div>
        </div>
      )}
      {(mode === "speak" || mode === "write" || mode === "ask") && (
        <div className="overlay" role="dialog" aria-label={mode === "speak" ? "Read aloud" : mode === "write" ? "Write about the story" : "Ask the story"} onClick={(e) => e.target === e.currentTarget && setMode(null)}>
          <div className="sheet-in">
            <div className="spread">
              <b style={{ fontSize: 18 }}>{mode === "speak" ? "Read aloud" : mode === "write" ? "Write about the story" : "Ask the story"}</b>
              <button className="icon-btn" aria-label="Close" onClick={() => setMode(null)}>{Icon.close}</button>
            </div>
            {mode === "speak" && <SpeakRun story={story} onFinish={(score) => { learner.recordGame("speak", score); setMode(null); setToast(`Reading aloud · ${score}% understood`); }} />}
            {mode === "write" && <WritePanel story={story} ai={ai} />}
            {mode === "ask" && <AskPanel story={story} ai={ai} />}
          </div>
        </div>
      )}
      {mode === "grammar" && (
        <div className="overlay" role="dialog" aria-label="Grammar help" onClick={(e) => e.target === e.currentTarget && setMode(null)}>
          <div className="sheet-in">
            <div className="spread"><b style={{ fontSize: 18 }}>Grammar help</b><button className="icon-btn" aria-label="Close" onClick={() => setMode(null)}>{Icon.close}</button></div>
            <GrammarHelp story={story} ai={ai} />
          </div>
        </div>
      )}

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
  const pe = picked ? lookupIn(story, picked.lemma) : undefined;
  const tr = useTranslated([pe?.meaning, picked ? story.sentences[picked.sentence]?.translation : undefined]);

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
        <span className="lemma" lang={lang}>
          {lang === "de" && entry?.pos === "noun" && DE_GENDER[entry.display] && <span className={`g-art g-${DE_GENDER[entry.display]}`}>{ARTICLE[DE_GENDER[entry.display]!]} </span>}
          {entry?.display ?? picked.lemma}
        </span>
        <button className="icon-btn" aria-label="Hear the word" onClick={() => playWord(lang, picked.lemma, picked.surface)}>{Icon.speaker}</button>
      </div>
      {entry?.reading && <span className="reading">{entry.reading}</span>}
      {lang === "ko" && <span className="reading">{romanize(entry?.display ?? picked.lemma)}</span>}
      {lang === "ko" && (() => {
        const sp = splitKorean(picked.surface, picked.lemma);
        return sp ? (
          <div className="ko-split" aria-label="Word parts">
            <span lang="ko"><b>{sp.stem}</b> + <b className="ko-end">{sp.ending}</b></span>
            {sp.gloss && <span className="muted small">{sp.ending}: {sp.gloss}</span>}
            {(() => {
              const lb = koreanLabels(picked.surface);
              return lb.honorific || lb.speech ? (
                <span className="row small" style={{ gap: 6, flexWrap: "wrap" }}>
                  {lb.honorific && <span className="pill" title="Shows respect to the person the verb is about">honorific</span>}
                  {lb.speech && <span className="pill">{lb.speech}</span>}
                </span>
              ) : null;
            })()}
          </div>
        ) : null;
      })()}
      {picked.surface !== (entry?.display ?? picked.lemma) && <span className="muted small">In the text: <span lang={lang}>{picked.surface}</span></span>}
      <div style={{ fontSize: 18, fontWeight: 600 }}>{tr.texts[0] ?? <span className="muted">No meaning in the dictionary yet.</span>}</div>

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
        <div className="box"><div className="eyebrow" style={{ marginBottom: 4 }}>Sentence</div>{tr.texts[1]}</div>
      )}
      <Examples story={story} lemma={picked.lemma} />

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

function Toggle({ label, hint, on, set }: { label: string; hint?: React.ReactNode; on: boolean; set: (v: boolean) => void }) {
  return (
    <label className="menu-row toggle-row">
      <span><span style={{ display: "block", fontWeight: 600 }}>{label}</span>{hint && <span className="small muted">{hint}</span>}</span>
      <input type="checkbox" className="switch" checked={on} onChange={(e) => set(e.target.checked)} />
    </label>
  );
}

interface StoryWord { lemma: string; display: string; meaning: string; pos: string; sentence: number; surface: string }

/** Content words of a story with meanings, new and saved words first. */
function storyWords(story: AnyStory): StoryWord[] {
  const seen = new Set<string>();
  const out: StoryWord[] = [];
  story.sentences.forEach((s, i) =>
    s.tokens.forEach((t) => {
      if (!t.lemma || t.isName || seen.has(t.lemma)) return;
      const e = lookupIn(story, t.lemma);
      if (!e || FUNCTION_POS.has(e.pos)) return;
      seen.add(t.lemma);
      out.push({ lemma: t.lemma, display: e.display, meaning: e.meaning, pos: e.pos, sentence: i, surface: t.surface });
    }),
  );
  return out;
}

type PQ =
  | { kind: "meaning"; lemma: string; sentence: number; prompt: string; context: string; options: string[]; answer: string }
  | { kind: "gap"; lemma: string; sentence: number; prompt: string; options: string[]; answer: string; translation?: string };

/** Practice for one story: what words mean, then fill the gap in a sentence from the story. */
function makePractice(story: AnyStory, words: StoryWord[], rank: (l: string) => number): PQ[] {
  const meanings = [...new Set(words.map((w) => w.meaning))];
  if (words.length < 4) return [];
  // Wrong options of the same kind (nouns with nouns, verbs with verbs) so the answer isn't obvious.
  const distractors = (w: StoryWord) => {
    const same = shuffle([...new Set(words.filter((x) => x.pos === w.pos && x.meaning !== w.meaning).map((x) => x.meaning))]);
    const rest = shuffle(meanings.filter((m) => m !== w.meaning && !same.includes(m)));
    return [...same, ...rest].slice(0, 3);
  };
  const pick = [...words].sort((a, b) => rank(a.lemma) - rank(b.lemma) || Math.random() - 0.5);
  const qs: PQ[] = pick.slice(0, 4).map((w) => ({
    kind: "meaning",
    lemma: w.lemma,
    sentence: w.sentence,
    prompt: w.display,
    context: textOf(story, story.sentences[w.sentence]!),
    options: shuffle([w.meaning, ...distractors(w)]),
    answer: w.meaning,
  }));
  for (const w of pick.slice(4, 6)) {
    const text = textOf(story, story.sentences[w.sentence]!);
    if (!text.includes(w.surface)) continue;
    const others = shuffle(words.filter((x) => x.pos === w.pos && x.surface !== w.surface)).slice(0, 3).map((x) => x.surface);
    if (others.length < 2) continue;
    qs.push({ kind: "gap", lemma: w.lemma, sentence: w.sentence, prompt: text.replace(w.surface, "_____"), options: shuffle([w.surface, ...others]), answer: w.surface, translation: story.sentences[w.sentence]!.translation });
  }
  return qs;
}

/**
 * Below every story, like a lesson page: the story's words with meanings, then practice.
 * Finishing the practice marks the story as read; words answered right count as learned, missed ones go to review.
 */
function StoryPractice({ story, tapped, done, onDone }: { story: AnyStory; tapped: Set<string>; done: boolean; onDone: (msg: string) => void }) {
  const lang = story.lang;
  const learner = useLearner(lang);
  const ranked = useRankedStories(lang);
  const words = useMemo(() => storyWords(story), [story]);
  const [all, setAll] = useState(false);
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const qs = useMemo(
    () => makePractice(story, words, (l) => (tapped.has(l) ? 0 : learner.wordState(l) === "new" ? 1 : learner.wordState(l) === "learning" ? 1 : 2)),
    [story, words, round], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [n, setN] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [results, setResults] = useState<{ lemma: string; ok: boolean }[]>([]);
  const next = useMemo(() => ranked.find((r) => !r.read && r.story.id !== story.id), [ranked, story.id]);
  // Only the harder words: not known yet, highest level first.
  const hard = useMemo(
    () => words.filter((w) => learner.wordState(w.lemma) !== "known" || results.some((r) => r.lemma === w.lemma)).sort((a, b) => (wordLevelOf(lang, b.lemma) ?? 0) - (wordLevelOf(lang, a.lemma) ?? 0)),
    [words, lang, done], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const meanings = useTranslated(hard.map((w) => w.meaning));
  const shown = all ? hard : hard.slice(0, 10);

  const finish = (res: { lemma: string; ok: boolean }[]) => {
    const r = learner.finishStory(story, tapped);
    for (const x of res) learner.setWord(x.lemma, x.ok ? "known" : "learning", { storyId: story.id, sentence: words.find((w) => w.lemma === x.lemma)?.sentence ?? 0 });
    const right = res.filter((x) => x.ok).length;
    if (res.length) learner.recordQuiz(right, res.length);
    onDone(`Story added to Read · ${right + r.newlyKnown} words learned${res.length - right ? ` · ${res.length - right} to review` : ""}`);
  };

  const q = qs[n];
  const right = results.filter((x) => x.ok).length;

  return (
    <section id="practice" className="story-practice" aria-label="Words and practice">
      <div className="sp-head"><h2>Practice</h2>{started && q && <span className="muted small">{n + 1} / {qs.length}</span>}</div>
      {done ? (
        <div className="finish done-card">
          <h3 style={{ margin: 0 }}>✓ Story added to your read stories</h3>
          <p className="muted small" style={{ margin: 0 }}>Learned words are in your Notebook under Known; missed ones come back in flashcards.</p>
          <div className="row" style={{ flexWrap: "wrap" }}>
            {next && <Link className="btn primary" href={`/${lang}/read/${next.story.id}`}>Next story: <span lang={lang}>{next.story.title}</span></Link>}
            <Link className="btn" href={`/${lang}/words`}>Notebook</Link>
          </div>
        </div>
      ) : !qs.length ? (
        <div className="finish"><button className="btn primary" onClick={() => finish([])}>Mark as read</button></div>
      ) : !started ? (
        <div className="finish sp-start">
          <span><b>{qs.length} quick questions</b> <span className="muted">· finish them to add this story and its words to what you've learned.</span></span>
          <div className="row">
            <button className="btn primary" onClick={() => setStarted(true)}>Start practice</button>
            <button className="btn ghost sm" onClick={() => finish([])}>Just mark as read</button>
          </div>
        </div>
      ) : q ? (
        <div className="flash sp-q" key={n} style={{ textAlign: "left" }}>
          <div className="g-progress"><span style={{ width: `${(n / qs.length) * 100}%` }} /></div>
          {q.kind === "meaning" ? (
            <>
              <span className="small muted">What does it mean?</span>
              <div className="lemma" lang={lang}>{q.prompt}</div>
              <div className="ctx muted" lang={lang}>{q.context}</div>
            </>
          ) : (
            <>
              <span className="small muted">Fill the gap</span>
              <div className="ctx" lang={lang} style={{ fontSize: 22 }}>{q.prompt}</div>
              {q.translation && <span className="small muted">{q.translation}</span>}
            </>
          )}
          <div className="choices">
            {q.options.map((o) => (
              <button key={o} lang={q.kind === "gap" ? lang : undefined} disabled={chosen !== null}
                className={`choice${chosen !== null && o === q.answer ? " ok" : ""}${chosen === o && o !== q.answer ? " no" : ""}`}
                onClick={() => { setChosen(o); setResults((r) => [...r, { lemma: q.lemma, ok: o === q.answer }]); }}>
                {q.kind === "meaning" ? <Tr>{o}</Tr> : o}
              </button>
            ))}
          </div>
          {chosen !== null && (
            <button className="btn primary block" onClick={() => {
              setChosen(null);
              if (n + 1 < qs.length) setN(n + 1);
              else finish(results);
            }}>{n + 1 < qs.length ? "Next" : `Finish · ${right}/${qs.length}`}</button>
          )}
        </div>
      ) : null}
      {started && !done && !q && <button className="btn" onClick={() => { setRound((r) => r + 1); setN(0); setResults([]); }}>Try again</button>}
      <div className="sp-head" style={{ marginTop: 26 }}><h2>Words to learn</h2><span className="muted small">{hard.length} of {words.length}</span></div>
      <ul className="vocab">
        {shown.map((w) => {
          const st = learner.wordState(w.lemma);
          const saved = learner.word(w.lemma)?.saved === "learning";
          const g = lang === "de" && w.pos === "noun" ? DE_GENDER[w.display] : undefined;
          return (
            <li key={w.lemma} className={st === "known" ? "known" : ""}>
              <button className="icon-btn" aria-label={`Hear ${w.display}`} onClick={() => playWord(lang, w.lemma, w.display)}>{Icon.speaker}</button>
              <span className="v-word" lang={lang}>{g && <span className={`g-art g-${g}`}>{ARTICLE[g]} </span>}{w.display}</span>
              <span className="v-mean">{meanings.texts[hard.indexOf(w)]}</span>
              <span className={`v-state ${st === "known" ? "ok" : saved ? "rev" : ""}`}>{st === "known" ? "Learned" : saved ? "Review" : "New"}</span>
            </li>
          );
        })}
      </ul>
      {hard.length > 10 && <button className="btn ghost sm" onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show ${hard.length - 10} more`}</button>}


    </section>
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

/** Topic videos on YouTube (a search in the story's language) and a link to the Watch page. */
const READING_TOPICS = new Set(["history", "people", "nature", "science", "culture"]);

function WatchMore({ story }: { story: AnyStory }) {
  const meta = language(story.lang);
  const topic = isUserStory(story) ? "mine" : story.topic;
  // Reading texts are about a named subject; search for it in the target language. Everyday stories: topic vocabulary videos.
  const query = READING_TOPICS.has(topic) ? `${story.title} ${meta.native}` : `${meta.name} ${TOPIC_LABEL[topic] ?? topic} vocabulary for learners`;
  return (
    <div className="box watch-box">
      <span className="eyebrow row" style={{ display: "inline-flex" }}>{Icon.video} Watch and listen</span>
      <span className="small">Hear real speakers talk about this topic.</span>
      <div className="row">
        <a className="btn sm" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer">Videos about {story.titleEnglish || story.title}</a>
        <Link className="btn sm ghost" href={`/${story.lang}/watch`}>{meta.name} videos for learners</Link>
      </div>
    </div>
  );
}

/** Pick a sentence and get a plain-English grammar explanation (needs the AI key on the server). */
function GrammarHelp({ story, ai }: { story: AnyStory; ai: boolean }) {
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [state, setState] = useState<{ busy: boolean; text?: string; error?: string }>({ busy: false });

  async function explain(i: number) {
    setPickedIdx(i);
    setState({ busy: true });
    const sentence = story.sentences[i]!;
    try {
      const { text } = await callAi<{ text: string }>("explain", { lang: story.lang, sentence: textOf(story, sentence), translation: sentence.translation });
      setState({ busy: false, text });
    } catch (e) {
      setState({ busy: false, error: (e as Error).message });
    }
  }

  if (!ai) {
    return (
      <div className="empty">
        <p style={{ margin: 0 }}><b>Grammar help uses AI.</b></p>
        <p className="muted small" style={{ margin: "4px 0 0" }}>The site owner can turn it on by adding an AI key. Meanwhile, tap any word to see its meaning and example sentences.</p>
      </div>
    );
  }
  return (
    <>
      <p className="muted small" style={{ margin: 0 }}>Choose a sentence to explain.</p>
      <div className="list" style={{ maxHeight: 240, overflow: "auto" }}>
        {story.sentences.map((s, i) => (
          <button key={i} className="row-card" style={{ display: "block", textAlign: "left", fontFamily: "var(--f-read)", fontSize: 17, borderColor: pickedIdx === i ? "var(--primary)" : undefined }} lang={story.lang} onClick={() => explain(i)}>
            {textOf(story, s)}
          </button>
        ))}
      </div>
      {state.busy && <p className="muted">Thinking…</p>}
      {state.text && <div className="box ai-text">{state.text}</div>}
      {state.error && <p role="alert" style={{ color: "var(--danger)", margin: 0 }}>{state.error}</p>}
    </>
  );
}

/** More sentences that use the word, with audio. */
function Examples({ story, lemma }: { story: AnyStory; lemma: string }) {
  const lang = story.lang;
  const all = useStories(lang);
  const items = useMemo(() => examplesFor(all.filter((x) => x.id !== story.id), lemma, 3), [all, lemma, story.id]);
  if (!items.length) return null;
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>More examples</div>
      <div className="ex-list">
        {items.map((ex) => (
          <div className="ex" key={ex.story.id}>
            <button className="icon-btn" aria-label="Hear this sentence" onClick={() => playSentence(ex.story.id, lang, ex.sentence, ex.text)}>{Icon.speaker}</button>
            <div>
              <div className="t" lang={lang}>{ex.text}</div>
              {ex.translation && <div className="muted small">{ex.translation}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


/** Gender of a German noun in the dictionary, for der/die/das colours. */
function genderOf(story: AnyStory, lemma?: string) {
  if (!lemma) return undefined;
  const e = lookupIn(story, lemma);
  return e?.pos === "noun" ? DE_GENDER[e.display] : undefined;
}
