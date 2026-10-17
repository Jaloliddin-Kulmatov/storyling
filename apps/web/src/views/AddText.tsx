"use client";

import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { callAi, useAiEnabled } from "@/lib/ai";
import { useLearner } from "@/lib/learner";
import { storyFromPlainText, storyFromPrepared } from "@/lib/stories";
import type { PreparedText } from "@/server/ai";
import { Icon } from "@/components/ui";

const TOPICS = ["Daily life", "Food", "Travel", "Work", "Family", "Nature", "A mystery", "Friendship"];

export function AddText({ lang }: { lang: LangCode }) {
  const meta = language(lang);
  const learner = useLearner(lang);
  const ai = useAiEnabled();
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<"paste" | "story">(params.get("tab") === "story" ? "story" : "paste");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]!);
  const [level, setLevel] = useState(meta.levels[Math.min(learner.level ?? 0, meta.levels.length - 1)] ?? meta.levels[0]!);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const learning = learner.allWords.filter((w) => w.saved === "learning").map((w) => w.lemma).slice(0, 12);

  async function run(fn: (signal: AbortSignal) => Promise<string>) {
    setBusy(true);
    setError(null);
    abort.current = new AbortController();
    try {
      const id = await fn(abort.current.signal);
      router.push(`/${lang}/read/${id}`);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
      setBusy(false);
    }
  }

  function importPlain() {
    const s = storyFromPlainText(lang, title.trim(), text.trim());
    if (!s) return setError("This browser can't split the text into words. Try a newer browser, or use AI import.");
    learner.addStory(s);
    router.push(`/${lang}/read/${s.id}`);
  }

  const prepare = () =>
    run(async (signal) => {
      const p = await callAi<PreparedText>("prepare", { lang, text: text.trim() }, signal);
      const s = storyFromPrepared(lang, title.trim() ? { ...p, title: title.trim() } : p, "paste", "Your text");
      learner.addStory(s);
      return s.id;
    });

  const write = () =>
    run(async (signal) => {
      const p = await callAi<PreparedText>("story", { lang, level, topic, words: learning }, signal);
      const s = storyFromPrepared(lang, p, "ai", level);
      learner.addStory(s);
      return s.id;
    });

  return (
    <>
      <div className="page-head"><div><div className="eyebrow">{meta.name}</div><h1>Add a text</h1></div></div>

      <div className="seg" role="group" aria-label="Mode" style={{ marginBottom: 16 }}>
        <button aria-pressed={tab === "paste"} onClick={() => setTab("paste")}>Paste a text</button>
        <button aria-pressed={tab === "story"} onClick={() => setTab("story")}>Story for me</button>
      </div>

      {tab === "paste" && (
        <div className="card" style={{ display: "grid", gap: 12 }}>
          <label className="field"><span>Title (optional)</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} /></label>
          <label className="field">
            <span>Text in {meta.name}</span>
            <textarea className="textarea" rows={10} lang={lang} value={text} onChange={(e) => setText(e.target.value)} maxLength={3000} placeholder="Paste an article, song lyrics you own, a message, or notes…" />
          </label>
          <div className="spread">
            <span className="muted small">{text.length}/3000</span>
            <div className="row">
              <button className="btn" disabled={!text.trim() || busy} onClick={importPlain}>Import</button>
              {ai && <button className="btn primary" disabled={!text.trim() || busy} onClick={prepare}>{Icon.spark} Import with AI</button>}
            </div>
          </div>
          <p className="muted small" style={{ margin: 0 }}>
            {ai
              ? "Import splits the text into words and uses the built-in dictionary. Import with AI also adds dictionary forms, meanings and a translation for every sentence."
              : "The text is split into words and looked up in the built-in dictionary. Words not in the dictionary can still be saved and reviewed."}
          </p>
        </div>
      )}

      {tab === "story" && (
        ai ? (
          <div className="card" style={{ display: "grid", gap: 14 }}>
            <p style={{ margin: 0 }}>AI writes a short new story at your level and works in the words you are learning.</p>
            <label className="field">
              <span>Level</span>
              <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>{meta.levels.map((l) => <option key={l}>{l}</option>)}</select>
            </label>
            <div className="field">
              <span>Topic</span>
              <div className="filters">{TOPICS.map((t) => <button key={t} className="chip" aria-pressed={topic === t} onClick={() => setTopic(t)}>{t}</button>)}</div>
            </div>
            <div className="field">
              <span>Words to include</span>
              <p className="muted small" style={{ margin: 0 }} lang={lang}>{learning.length ? learning.join(" · ") : "None saved yet. Save words while reading and they'll appear in your stories."}</p>
            </div>
            <button className="btn primary" disabled={busy} onClick={write}>{Icon.spark} Write my story</button>
          </div>
        ) : (
          <div className="empty">
            <h2 style={{ fontSize: 20 }}>AI stories are turned off</h2>
            <p className="muted">The site owner can turn them on by adding an AI API key.</p>
          </div>
        )
      )}

      {busy && (
        <div className="card spread" style={{ marginTop: 12 }} role="status">
          <span>Preparing your text… this can take up to a minute.</span>
          <button className="btn sm ghost" onClick={() => { abort.current?.abort(); setBusy(false); }}>Cancel</button>
        </div>
      )}
      {error && <p role="alert" style={{ color: "var(--danger)" }}>{error}</p>}

      {learner.stories.length > 0 && (
        <>
          <div className="section-h"><h2>Your texts</h2></div>
          <div className="table">
            {learner.stories.map((s) => (
              <div className="trow" key={s.id}>
                <Link href={`/${lang}/read/${s.id}`} style={{ minWidth: 0, color: "inherit", textDecoration: "none" }}>
                  <span className="l" lang={lang}>{s.title}</span>
                  <span className="g" style={{ display: "block" }}>{s.origin === "ai" ? "AI story" : "Pasted"} · {s.level} · {s.date}</span>
                </Link>
                <button className="btn sm ghost" onClick={() => learner.removeStory(s.id)}>Delete</button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
