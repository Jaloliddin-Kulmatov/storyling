"use client";

import { cueAt, parseCues, type Cue } from "@storyling/learner";
import type { LangCode } from "@storyling/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { callAi, useAiEnabled } from "@/lib/ai";
import { VideoQuiz } from "@/components/VideoQuiz";
import { lookup, type DictEntry } from "@storyling/content";
import { playWord } from "@/lib/audio";
import { useLearner } from "@/lib/learner";
import { Tr } from "@/lib/translate";
import { Icon } from "@/components/ui";

/**
 * Older saved auto-captions are YouTube's overlapping two-row windows (a few words each, cut mid-sentence).
 * Join neighbouring rows into fuller lines; captions saved with word timing already have clean lines.
 */
function tidyAuto(cues: Cue[]): Cue[] {
  const overlapping = cues.filter((c, i) => cues[i + 1] && c.end > cues[i + 1]!.start + 0.5).length > cues.length / 2;
  if (!overlapping) return cues;
  const out: Cue[] = [];
  for (const c of cues) {
    const last = out[out.length - 1];
    if (last && last.text.split(" ").length < 9) {
      last.text = `${last.text} ${c.text}`;
      last.end = c.end;
    } else out.push({ ...c, text: c.text[0]!.toUpperCase() + c.text.slice(1) });
  }
  out.forEach((c, i) => { if (out[i + 1]) c.end = out[i + 1]!.start; });
  return out;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** Dictionary entry for a word as heard (lower-case auto captions: try the capitalised noun too). */
function entryFor(lang: LangCode, raw: string): DictEntry | undefined {
  const w = raw.replace(/[^\p{L}'-]/gu, "");
  if (w.length < 2) return undefined;
  const e = lookup(lang, w) ?? lookup(lang, w[0]!.toUpperCase() + w.slice(1));
  return e && e.pos !== "name" ? e : undefined;
}

/** The word card shown under the subtitles: meaning, audio, save for review. */
function SubWord({ lang, e, line, onClose, onPlay }: { lang: LangCode; e: DictEntry; line: Cue; onClose: () => void; onPlay: () => void }) {
  const learner = useLearner(lang);
  const saved = learner.word(e.lemma)?.saved === "learning";
  return (
    <div className="sub-word flash">
      <div className="spread">
        <span className="row" style={{ alignItems: "center" }}>
          <b className="lemma" lang={lang}>{e.display}</b>
          <span className="pill">{e.pos}</span>
          <button className="icon-btn" aria-label={`Hear ${e.display}`} onClick={() => playWord(lang, e.lemma, e.display)}>{Icon.speaker}</button>
        </span>
        <button className="icon-btn" aria-label="Close" onClick={onClose}>{Icon.close}</button>
      </div>
      <span><Tr>{e.meaning}</Tr></span>
      <div className="row">
        <button className={`btn sm${saved ? "" : " primary"}`} onClick={() => learner.setWord(e.lemma, saved ? undefined : "learning")}>{saved ? "✓ Saved for review" : "+ Save for review"}</button>
        <button className="btn sm ghost" onClick={() => learner.setWord(e.lemma, "known")}>I know it</button>
        <button className="btn sm ghost" onClick={onPlay}>{Icon.play} Replay line</button>
      </div>
      <span className="small muted" lang={lang}>{line.text}</span>
    </div>
  );
}

interface YTPlayer {
  getCurrentTime(): number;
  pauseVideo?(): void;
  seekTo(s: number, allow: boolean): void;
  playVideo(): void;
  destroy(): void;
}
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiReady: Promise<void> | null = null;
function loadApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  return (apiReady ??= new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  }));
}

interface Saved { cues: Cue[]; tr: Record<number, string> }
const KEY = (id: string) => `storyling.subs.${id}`;
const read = (id: string): Saved => {
  try { return JSON.parse(localStorage.getItem(KEY(id)) ?? "") as Saved; } catch { return { cues: [], tr: {} }; }
};
const write = (id: string, v: Saved) => { try { localStorage.setItem(KEY(id), JSON.stringify(v)); } catch { /* storage may be blocked */ } };

/** A YouTube player with a synced transcript: paste subtitles, tap a line to jump, optional English translation. */
export function VideoWithTranscript({ lang, videoId, title }: { lang: LangCode; videoId: string; title: string }) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const ai = useAiEnabled();
  const [saved, setSaved] = useState<Saved>({ cues: [], tr: {} });
  const [now, setNow] = useState(-1);
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showTr, setShowTr] = useState(true);
  const cuesRef = useRef<Cue[]>([]);
  cuesRef.current = saved.cues;

  const [auto, setAuto] = useState(false);
  const [word, setWord] = useState<{ e: DictEntry; line: number } | null>(null);
  const [fetching, setFetching] = useState(false);
  useEffect(() => {
    const local = read(videoId);
    setSaved(local);
    setNow(-1);
    setMsg(null);
    setAuto(false);
    if (local.cues?.length) return;
    // No subtitles saved yet: load the video's own captions from YouTube.
    let dead = false;
    setFetching(true);
    // Saved caption files first (YouTube blocks caption requests from cloud servers), then the live route.
    const get = (u: string) => fetch(u).then((r) => (r.ok ? (r.json() as Promise<{ cues?: Cue[]; auto?: boolean }>) : { cues: [] }));
    get(`/captions/${videoId}.json`)
      .catch(() => ({ cues: [] as Cue[], auto: false }))
      .then((d) => (d.cues?.length ? d : get(`/api/captions?v=${videoId}&lang=${lang}`)))
      .then((d) => {
        if (dead || !d.cues?.length) return;
        setSaved({ cues: d.auto ? tidyAuto(d.cues) : d.cues, tr: {} });
        setAuto(!!d.auto);
      })
      .catch(() => {})
      .finally(() => !dead && setFetching(false));
    return () => { dead = true; };
  }, [videoId, lang]);

  useEffect(() => {
    let dead = false;
    let timer: ReturnType<typeof setInterval>;
    loadApi().then(() => {
      if (dead || !host.current) return;
      const el = document.createElement("div");
      host.current.replaceChildren(el);
      player.current = new window.YT!.Player(el, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: { rel: 0, cc_load_policy: 1, cc_lang_pref: lang, hl: "en", playsinline: 1 },
      });
      timer = setInterval(() => {
        const t = player.current?.getCurrentTime?.();
        if (typeof t === "number" && cuesRef.current.length) setNow(cueAt(cuesRef.current, t));
      }, 300);
    });
    return () => { dead = true; clearInterval(timer); player.current?.destroy?.(); player.current = null; };
  }, [videoId, lang]);

  useEffect(() => {
    if (now < 0) return;
    const row = list.current?.querySelector<HTMLElement>(`[data-i="${now}"]`);
    if (row && list.current) list.current.scrollTo({ top: row.offsetTop - list.current.clientHeight / 2 + row.clientHeight / 2, behavior: "smooth" });
  }, [now]);

  const save = useCallback((v: Saved) => { setSaved(v); write(videoId, v); }, [videoId]);

  const load = (text: string) => {
    const cues = parseCues(text);
    if (!cues.length) { setMsg("No subtitle lines found. Paste SRT, VTT, or the text copied from YouTube's “Show transcript”."); return; }
    save({ cues, tr: {} });
    setPaste("");
    setMsg(`${cues.length} lines loaded.`);
  };

  const translate = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const tr = { ...saved.tr };
      const todo = saved.cues.map((c, i) => [i, c.text] as const).filter(([i]) => !tr[i]);
      for (let k = 0; k < todo.length; k += 30) {
        const chunk = todo.slice(k, k + 30);
        const res = await callAi<{ lines: string[] }>("translate", { lang, target: "en", lines: chunk.map(([, t]) => t) });
        chunk.forEach(([i], j) => (tr[i] = res.lines[j]!));
        save({ cues: saved.cues, tr: { ...tr } });
      }
      setMsg("Translated to English.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Translation failed.");
    } finally {
      setBusy(false);
    }
  };

  const hasTr = Object.keys(saved.tr).length > 0;
  return (
    <>
      <div className="yt" role="region" aria-label={title}><div ref={host} style={{ position: "absolute", inset: 0 }} /></div>
      <div className="pc-body pc-subs" style={{ gap: 10 }}>
        {saved.cues.length > 0 ? (
          <>
            <div className="spread">
              <b>Subtitles {auto && <span className="pill">auto</span>}</b>
              <span className="row">
                {hasTr && <button className="chip" aria-pressed={showTr} onClick={() => setShowTr(!showTr)}>English</button>}
                {ai && <button className="btn sm" disabled={busy} onClick={translate}>{busy ? "Translating…" : hasTr ? "Translate the rest" : "Translate to English"}</button>}
                <button className="btn ghost sm" onClick={() => save({ cues: [], tr: {} })}>Remove</button>
              </span>
            </div>
            <div className="transcript" ref={list} lang={lang}>
              {saved.cues.map((c, i) => (
                <div key={i} data-i={i} className={`cue${i === now ? " on" : ""}`}>
                  <button className="cue-play" aria-label="Play from this line" onClick={() => { player.current?.seekTo(c.start, true); player.current?.playVideo(); setNow(i); }}>{fmt(c.start)}</button>
                  <span className="cue-text">
                    {c.text.split(/(\s+)/).map((part, k) => {
                      const e = /\p{L}/u.test(part) ? entryFor(lang, part) : undefined;
                      return e ? <button key={k} className={`cw${word?.e.lemma === e.lemma ? " on" : ""}`} onClick={() => { setWord({ e, line: i }); player.current?.pauseVideo?.(); }}>{part}</button> : <span key={k}>{part}</span>;
                    })}
                    {showTr && saved.tr[i] && <small lang="en">{saved.tr[i]}</small>}
                  </span>
                </div>
              ))}
            </div>
            {word && <SubWord lang={lang} e={word.e} line={saved.cues[word.line]!} onClose={() => setWord(null)} onPlay={() => { player.current?.seekTo(saved.cues[word.line]!.start, true); player.current?.playVideo(); }} />}
            {!ai && <span className="muted small">English translation needs AI to be turned on for this site (add GROQ_API_KEY).</span>}
            <VideoQuiz key={videoId} lang={lang} cues={saved.cues} onPlay={(c) => { player.current?.seekTo(c.start, true); player.current?.playVideo(); }} />
          </>
        ) : fetching ? (
          <span className="muted small">Loading subtitles…</span>
        ) : (
          <details>
            <summary><b>Add subtitles</b> <span className="muted small">to follow along line by line</span></summary>
            <div className="stack" style={{ marginTop: 10 }}>
              <p className="muted small" style={{ margin: 0 }}>On YouTube open the video, tap “…more” → “Show transcript”, select the text and copy it. Or paste an .srt / .vtt file. Then paste it here.</p>
              <textarea className="textarea" rows={5} placeholder="Paste the subtitles here" value={paste} onChange={(e) => setPaste(e.target.value)} />
              <div className="spread">
                <label className="btn ghost sm" style={{ cursor: "pointer" }}>
                  Open a file
                  <input type="file" accept=".srt,.vtt,.txt" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) load(await f.text()); e.target.value = ""; }} />
                </label>
                <button className="btn primary" disabled={!paste.trim()} onClick={() => load(paste)}>Use these subtitles</button>
              </div>
            </div>
          </details>
        )}
        {msg && <span className="small" role="status">{msg}</span>}
      </div>
    </>
  );
}
