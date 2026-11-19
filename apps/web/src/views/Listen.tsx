"use client";

import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Cover, Icon } from "@/components/ui";
import { hasRecording, playSentence, stopAudio } from "@/lib/audio";
import { useLearner } from "@/lib/learner";
import { isPublished, isUserStory, textOf, useStories, type AnyStory } from "@/lib/stories";

/** Listen: stories played one after another like a podcast, newest first, with the sentence and its translation on screen. */
export function Listen({ lang }: { lang: LangCode }) {
  const meta = language(lang);
  const learner = useLearner(lang);
  const all = useStories(lang);
  const [level, setLevel] = useState<string>("new");
  const list = useMemo(() => {
    const pool = all.filter((s) => !isUserStory(s));
    if (level === "new") return pool.filter(isPublished).slice(0, 40);
    return pool.filter((s) => s.level === level);
  }, [all, level]);
  const [at, setAt] = useState(0);
  const [line, setLine] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const run = useRef(0);
  const cur: AnyStory | undefined = list[at];
  useEffect(() => () => { run.current++; stopAudio(); }, []);
  useEffect(() => { stop(); setAt(0); setLine(0); }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

  async function play(from = at, fromLine = line) {
    const mine = ++run.current;
    setPlaying(true);
    for (let i = from; i < list.length; i++) {
      const st = list[i]!;
      setAt(i);
      for (let k = i === from ? fromLine : 0; k < st.sentences.length; k++) {
        setLine(k);
        await playSentence(st.id, lang, k, textOf(st, st.sentences[k]!), rate);
        if (mine !== run.current) return;
        await new Promise((r) => setTimeout(r, 350));
        if (mine !== run.current) return;
      }
      learner.addTime(Math.round(st.sentences.length * 4));
      await new Promise((r) => setTimeout(r, 1200));
      if (mine !== run.current) return;
    }
    setPlaying(false);
  }
  function stop() { run.current++; stopAudio(); setPlaying(false); }
  const jump = (i: number) => { stop(); setAt(i); setLine(0); setTimeout(() => void play(i, 0), 50); };

  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">{meta.name} · story podcast</div><h1>Listen</h1></div>
        <a className="btn sm" href={`/api/podcast/${lang}`} target="_blank" rel="noreferrer">🎙️ Podcast feed</a>
      </div>
      <div className="level-tabs" role="tablist" aria-label="Stories">
        <button role="tab" aria-selected={level === "new"} onClick={() => setLevel("new")}>New</button>
        {meta.levels.map((l) => <button key={l} role="tab" aria-selected={level === l} onClick={() => setLevel(l)}>{l}</button>)}
      </div>

      {cur ? (
        <div className={`ls-player${playing ? " on" : ""}`}>
          <Cover story={cur} className="ls-art" />
          <div className="ls-body">
            <span className="small muted">{cur.level} · story {at + 1} of {list.length}{hasRecording(cur.id) ? "" : " · browser voice"}</span>
            <Link href={`/${lang}/read/${cur.id}`} className="ls-title" lang={lang}>{cur.title}</Link>
            <p className="ls-line" lang={lang} key={`${at}-${line}`}>{textOf(cur, cur.sentences[line]!)}</p>
            <p className="ls-tr small muted">{cur.sentences[line]?.translation}</p>
            <div className="ls-bar"><span style={{ width: `${((line + 1) / cur.sentences.length) * 100}%` }} /></div>
            <div className="row" style={{ gap: 10, alignItems: "center" }}>
              <button className="icon-btn" aria-label="Previous story" disabled={at === 0} onClick={() => jump(at - 1)}>{Icon.back}</button>
              <button className="icon-btn play big" aria-label={playing ? "Pause" : "Play"} onClick={() => (playing ? stop() : void play())}>{playing ? "❚❚" : Icon.play}</button>
              <button className="icon-btn" aria-label="Next story" disabled={at >= list.length - 1} onClick={() => jump(at + 1)}>{Icon.next}</button>
              <span className="seg" style={{ marginLeft: "auto" }}>
                {[0.75, 1, 1.25].map((r) => <button key={r} aria-pressed={rate === r} onClick={() => setRate(r)}>{r}×</button>)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty"><p className="muted">No stories here yet.</p></div>
      )}

      <ol className="ls-list">
        {list.map((s, i) => (
          <li key={s.id}>
            <button className={i === at ? "on" : ""} onClick={() => jump(i)}>
              <span className="ls-n">{i === at && playing ? "♪" : i + 1}</span>
              <span className="stack" style={{ gap: 1, minWidth: 0 }}>
                <b lang={lang}>{s.title}</b>
                <span className="small muted">{s.titleEnglish} · {s.level} · {s.sentences.length} sentences</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}
