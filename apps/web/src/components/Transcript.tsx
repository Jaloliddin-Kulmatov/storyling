"use client";

import { cueAt, parseCues, type Cue } from "@storyling/learner";
import type { LangCode } from "@storyling/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { callAi, useAiEnabled } from "@/lib/ai";

interface YTPlayer {
  getCurrentTime(): number;
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

  useEffect(() => { setSaved(read(videoId)); setNow(-1); setMsg(null); }, [videoId]);

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
      <div className="pc-body" style={{ gap: 10 }}>
        {saved.cues.length > 0 ? (
          <>
            <div className="spread">
              <b>Transcript</b>
              <span className="row">
                {hasTr && <button className="chip" aria-pressed={showTr} onClick={() => setShowTr(!showTr)}>English</button>}
                {ai && <button className="btn sm" disabled={busy} onClick={translate}>{busy ? "Translating…" : hasTr ? "Translate the rest" : "Translate to English"}</button>}
                <button className="btn ghost sm" onClick={() => save({ cues: [], tr: {} })}>Remove</button>
              </span>
            </div>
            <div className="transcript" ref={list} lang={lang}>
              {saved.cues.map((c, i) => (
                <button key={i} data-i={i} className={i === now ? "on" : ""} onClick={() => { player.current?.seekTo(c.start, true); player.current?.playVideo(); setNow(i); }}>
                  <span>{c.text}</span>
                  {showTr && saved.tr[i] && <small lang="en">{saved.tr[i]}</small>}
                </button>
              ))}
            </div>
            {!ai && <span className="muted small">English translation needs AI to be turned on for this site (add GROQ_API_KEY).</span>}
          </>
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
