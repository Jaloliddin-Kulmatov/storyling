"use client";

import { dictionary, language, languages } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { parseCues, type Cue } from "@storyling/learner";
import Link from "next/link";
import { useMemo, useState } from "react";
import { callAi, useAiEnabled } from "@/lib/ai";
import { Tr } from "@/lib/translate";

const BATCH = 30;
const PER_RUN = 120; // lines translated per tap, so one tap stays within the daily AI allowance

const clock = (s: number) => {
  const ms = Math.round(s * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
const toSrt = (cues: Cue[], text: (i: number) => string) => cues.map((c, i) => `${i + 1}\n${clock(c.start)} --> ${clock(c.end)}\n${text(i)}\n`).join("\n");

/**
 * Subtitle study: load an .srt/.vtt file you already have, read it line by line in the language you are learning
 * (translated here in your browser if it is in another language), tap words, and save a copy with the same timings.
 * The file stays on your device and is not stored by Storyling.
 */
export function Subtitles({ lang }: { lang: LangCode }) {
  const meta = language(lang);
  const ai = useAiEnabled();
  const [name, setName] = useState("");
  const [cues, setCues] = useState<Cue[]>([]);
  const [from, setFrom] = useState<LangCode>("en");
  const [out, setOut] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string | null>(null);

  const same = from === lang;
  const shown = (i: number) => (same ? cues[i]!.text : out[i]);
  const done = cues.filter((_, i) => same || out[i]).length;

  const words = useMemo(() => new Map(dictionary(lang).map((e) => [e.display.toLowerCase(), e])), [lang]);

  const load = (text: string, fileName: string) => {
    const c = parseCues(text);
    if (!c.length) return setMsg("No subtitle lines found. Use an .srt or .vtt file.");
    setCues(c);
    setName(fileName);
    setOut({});
    setPicked(null);
    setMsg(`${c.length} lines loaded.`);
  };

  const translate = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const todo = cues.map((c, i) => [i, c.text] as const).filter(([i]) => !out[i]).slice(0, PER_RUN);
      const next = { ...out };
      for (let k = 0; k < todo.length; k += BATCH) {
        const chunk = todo.slice(k, k + BATCH);
        const res = await callAi<{ lines: string[] }>("translate", { lang: from, target: lang, lines: chunk.map(([, t]) => t.slice(0, 300)) });
        chunk.forEach(([i], j) => (next[i] = res.lines[j]!));
        setOut({ ...next });
      }
      setMsg(Object.keys(next).length >= cues.length ? "All lines are translated." : `Translated ${Object.keys(next).length} of ${cues.length} lines. Tap again for the next part.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Translation failed.");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const blob = new Blob([toSrt(cues, (i) => shown(i) ?? cues[i]!.text)], { type: "application/x-subrip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name.replace(/\.(srt|vtt)$/i, "") || "subtitles"}.${lang}.srt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const visible = cues.map((c, i) => ({ c, i })).filter(({ c, i }) => !q.trim() || c.text.toLowerCase().includes(q.toLowerCase()) || shown(i)?.toLowerCase().includes(q.toLowerCase())).slice(0, 200);
  const entry = picked ? words.get(picked.toLowerCase()) : undefined;

  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">{meta.name} · your own file</div><h1>Subtitle study</h1></div>
        <Link className="btn sm" href={`/${lang}/watch`}>Watch</Link>
      </div>

      {!cues.length ? (
        <div className="card stack" style={{ maxWidth: 680 }}>
          <p className="muted" style={{ margin: 0 }}>Open a subtitle file you already have (.srt or .vtt) to read it in {meta.name}. Storyling keeps timings exactly as they are. Your file stays in this browser and is not saved on our server.</p>
          <label className="field">
            The file is in
            <select className="select" value={from} onChange={(e) => setFrom(e.target.value as LangCode)}>
              {languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </label>
          <label className="btn primary" style={{ cursor: "pointer", justifySelf: "start" }}>
            Open a file
            <input type="file" accept=".srt,.vtt,.txt" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) load(await f.text(), f.name); e.target.value = ""; }} />
          </label>
          <details>
            <summary className="muted small">or paste the text</summary>
            <textarea className="textarea" rows={5} style={{ marginTop: 8 }} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Paste subtitles here" />
            <button className="btn sm" disabled={!paste.trim()} onClick={() => load(paste, "pasted")} style={{ marginTop: 8 }}>Use this text</button>
          </details>
          {msg && <span role="status" className="small">{msg}</span>}
        </div>
      ) : (
        <>
          <div className="spread" style={{ marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <span className="small muted">{name} · {cues.length} lines · {done} in {meta.name}</span>
            <span className="row">
              {!same && ai && done < cues.length && <button className="btn primary sm" disabled={busy} onClick={translate}>{busy ? "Translating…" : done ? "Translate the next part" : `Translate to ${meta.name}`}</button>}
              {!same && !ai && <span className="muted small">Translation needs AI to be turned on for this site.</span>}
              <button className="btn sm" disabled={!same && done === 0} onClick={download}>Download .srt ({meta.name})</button>
              <button className="btn ghost sm" onClick={() => { setCues([]); setOut({}); setPicked(null); setMsg(null); }}>Close file</button>
            </span>
          </div>
          {msg && <p role="status" className="small" style={{ margin: "0 0 8px" }}>{msg}</p>}
          <input className="input" type="search" placeholder="Search lines" aria-label="Search lines" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 10 }} />

          {picked && (
            <div className="card" style={{ marginBottom: 10 }} role="status">
              <div className="spread"><b lang={lang}>{entry?.display ?? picked}</b><button className="btn ghost sm" onClick={() => setPicked(null)}>Close</button></div>
              <div>{entry ? <><span className="pill">{entry.pos}</span> <Tr>{entry.meaning}</Tr></> : <span className="muted small">Not in the Storyling dictionary yet.</span>}</div>
            </div>
          )}

          <div className="table">
            {visible.map(({ c, i }) => {
              const t = shown(i);
              return (
                <div className="trow" key={i} style={{ alignItems: "flex-start" }}>
                  <span style={{ minWidth: 0 }}>
                    <span className="small muted" style={{ fontVariantNumeric: "tabular-nums" }}>{clock(c.start).slice(0, 8)}</span>
                    <span lang={lang} style={{ display: "block", fontFamily: "var(--f-read)", fontSize: 19, lineHeight: 1.5 }}>
                      {t ? t.split(/(\s+)/).map((w, k) => {
                        const bare = w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "");
                        return bare && !/^\s+$/.test(w)
                          ? <button key={k} className={`w${picked === bare ? " selected" : ""}`} style={{ font: "inherit" }} onClick={() => setPicked(bare)}>{w}</button>
                          : w;
                      }) : <span className="muted">…</span>}
                    </span>
                    {!same && <span className="g" style={{ display: "block" }}>{c.text}</span>}
                  </span>
                </div>
              );
            })}
            {cues.length > visible.length && !q && <div className="trow"><span className="muted small">Showing the first 200 lines. Use search to find others.</span></div>}
          </div>
        </>
      )}
    </>
  );
}
