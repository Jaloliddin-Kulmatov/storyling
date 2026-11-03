"use client";

import { language } from "@storyling/content";
import { checkDictation, type DictationResult } from "@storyling/learner";
import { useEffect, useRef, useState } from "react";
import { callAi } from "@/lib/ai";
import { playSentence, stopAudio } from "@/lib/audio";
import { useSettings } from "@/lib/learner";
import { textOf, type AnyStory } from "@/lib/stories";
import { Icon } from "@/components/ui";

interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;
const recognizer = (): RecognitionCtor | undefined =>
  typeof window === "undefined" ? undefined : ((window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition);

const storyText = (story: AnyStory) => story.sentences.map((s) => textOf(story, s)).join(" ");

/**
 * Read aloud: hear a sentence, say it, and see which words the speech recognizer understood.
 * Uses the browser's speech recognition (Chrome, Edge, Safari); it is a rough guide, not a pronunciation score.
 */
export function SpeakRun({ story, onFinish }: { story: AnyStory; onFinish: (score: number) => void }) {
  const Ctor = recognizer();
  const meta = language(story.lang);
  const [n, setN] = useState(0);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [result, setResult] = useState<DictationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const rec = useRef<Recognition | null>(null);
  const sentence = story.sentences[n];
  const expected = sentence ? textOf(story, sentence) : "";

  useEffect(() => () => { rec.current?.stop(); stopAudio(); }, []);

  if (!Ctor) return <p className="muted">Your browser can't listen to speech. Try Chrome, Edge or Safari.</p>;

  if (!sentence) {
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return (
      <div className="stack" style={{ textAlign: "center" }}>
        <div className="score-ring" style={{ ["--p" as string]: avg / 100 }}><b>{avg}%</b></div>
        <p style={{ margin: 0 }}>Words understood across {scores.length} sentences.</p>
        <button className="btn primary block" onClick={() => onFinish(avg)}>Done</button>
      </div>
    );
  }

  const listen = () => {
    setError(null);
    setResult(null);
    setHeard("");
    stopAudio();
    const r = new Ctor();
    r.lang = meta.tts;
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      const said = Array.from(e.results).map((x) => x[0]?.transcript ?? "").join(" ");
      setHeard(said);
      setResult(checkDictation(expected, said, meta.noSpace));
    };
    r.onerror = (e) => setError(e.error === "not-allowed" ? "Allow the microphone to use this." : "I couldn't hear that. Try again.");
    r.onend = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  };

  return (
    <div className="stack">
      <div className="spread small muted"><span>Sentence {n + 1} of {story.sentences.length}</span><span>Read it aloud</span></div>
      <p lang={story.lang} style={{ fontFamily: "var(--f-read)", fontSize: 22, lineHeight: 1.6, margin: 0 }}>{expected}</p>
      <div className="row" style={{ justifyContent: "center", gap: 10 }}>
        <button className="btn ghost" onClick={() => playSentence(story.id, story.lang, n, expected)}>{Icon.speaker} Listen first</button>
        <button className={`btn ${listening ? "danger" : "primary"}`} onClick={() => (listening ? rec.current?.stop() : listen())}>
          {listening ? "Listening… tap to stop" : result ? "Try again" : "🎙 Speak"}
        </button>
      </div>
      {error && <p role="alert" className="small" style={{ margin: 0 }}>{error}</p>}
      {result && (
        <>
          <div className="dict-result" lang={story.lang}>
            {result.words.map((w, i) => <span key={i} className={w.ok ? "ok" : "no"}>{w.word}{meta.noSpace ? "" : " "}</span>)}
          </div>
          <p className="small" style={{ margin: 0 }}><b>{result.score}%</b> of the words were understood. <span className="muted">Heard: “{heard}”</span></p>
          <button className="btn primary block" onClick={() => { setScores((s) => [...s, result.score]); setResult(null); setHeard(""); setN(n + 1); }}>
            {n + 1 >= story.sentences.length ? "See result" : "Next sentence"}
          </button>
        </>
      )}
    </div>
  );
}

interface Feedback {
  corrected: string;
  fixes: { wrong: string; right: string; why: string }[];
  comment: string;
}

/** Write 3–5 sentences about the story and get AI corrections, explained in the learner's language. */
export function WritePanel({ story, ai }: { story: AnyStory; ai: boolean }) {
  const [settings] = useSettings();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [fb, setFb] = useState<Feedback | null>(null);
  const [err, setErr] = useState<string | null>(null);
  if (!ai) return <p className="muted">Writing correction needs AI to be turned on for this site.</p>;
  const explainIn = settings.translateTo !== "en" ? settings.translateTo : settings.uiLang;
  const send = async () => {
    setBusy(true);
    setErr(null);
    try {
      setFb(await callAi<Feedback>("correct", { lang: story.lang, story: storyText(story), text, explainIn }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="stack">
      <p className="muted small" style={{ margin: 0 }}>Write 3–5 sentences in {language(story.lang).name} about the story: what happens, or what you think about it.</p>
      <textarea className="textarea" rows={5} lang={story.lang} value={text} onChange={(e) => setText(e.target.value)} placeholder={`${language(story.lang).name}…`} />
      <button className="btn primary" disabled={busy || text.trim().length < 10} onClick={send}>{busy ? "Checking…" : "Check my writing"}</button>
      {err && <p role="alert" className="small">{err}</p>}
      {fb && (
        <div className="stack">
          <div className="box" lang={story.lang}><div className="eyebrow" style={{ marginBottom: 4 }}>Corrected</div>{fb.corrected}</div>
          {fb.fixes.length > 0 ? (
            <ul className="fixes">
              {fb.fixes.map((f, i) => (
                <li key={i}><s lang={story.lang}>{f.wrong}</s> → <b lang={story.lang}>{f.right}</b><span className="muted small"> · {f.why}</span></li>
              ))}
            </ul>
          ) : <p className="small" style={{ margin: 0 }}>No mistakes found. Well done!</p>}
          {fb.comment && <p className="small" style={{ margin: 0 }}>{fb.comment}</p>}
        </div>
      )}
    </div>
  );
}

/** "Ask the story": a short chat with an AI tutor about this text, answered in the learner's language. */
export function AskPanel({ story, ai }: { story: AnyStory; ai: boolean }) {
  const [settings] = useSettings();
  const [q, setQ] = useState("");
  const [chat, setChat] = useState<{ q: string; a: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!ai) return <p className="muted">The story tutor needs AI to be turned on for this site.</p>;
  const answerIn = settings.translateTo !== "en" ? settings.translateTo : settings.uiLang;
  const ask = async (question: string) => {
    if (!question.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const { text } = await callAi<{ text: string }>("ask", { lang: story.lang, story: storyText(story), question, answerIn, history: chat });
      setChat((c) => [...c, { q: question, a: text }]);
      setQ("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };
  const ideas = ["What happens in this story?", "Explain the hardest sentence.", "Which words should I learn first?"];
  return (
    <div className="stack">
      {chat.length === 0 && (
        <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
          {ideas.map((i) => <button key={i} className="chip" onClick={() => void ask(i)} disabled={busy}>{i}</button>)}
        </div>
      )}
      <div className="chat">
        {chat.map((m, i) => (
          <div key={i} className="stack" style={{ gap: 6 }}>
            <div className="bubble me">{m.q}</div>
            <div className="bubble">{m.a}</div>
          </div>
        ))}
        {busy && <div className="bubble muted">Thinking…</div>}
      </div>
      {err && <p role="alert" className="small">{err}</p>}
      <form className="row" onSubmit={(e) => { e.preventDefault(); void ask(q); }}>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything about this story" aria-label="Your question" style={{ flex: 1 }} />
        <button className="btn primary" disabled={busy || !q.trim()}>Ask</button>
      </form>
    </div>
  );
}
