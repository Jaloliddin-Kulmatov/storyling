"use client";

import type { LangCode } from "@storyling/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account";

type Range = "day" | "week" | "month";
interface Row { rank: number; name: string; points: number; me: boolean }

/** Leaderboard: points from reading time (2 per minute), words read (1 each) and new stories (10 each). */
export function Leaderboard({ lang }: { lang: LangCode }) {
  const a = useAccount();
  const [range, setRange] = useState<Range>("week");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!a.enabled) return;
    let alive = true;
    setRows(null);
    fetch(`/api/leaderboard?range=${range}`)
      .then((r) => r.json())
      .then((d: { rows?: Row[]; error?: string }) => alive && (d.rows ? setRows(d.rows) : setErr(d.error ?? "Could not load the leaderboard.")))
      .catch(() => alive && setErr("Could not load the leaderboard."));
    return () => { alive = false; };
  }, [range, a.enabled, a.lastSync]);

  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">All learners</div><h1>Leaderboard</h1></div>
        <Link className="btn sm" href={`/${lang}/progress`}>Account</Link>
      </div>
      {a.loaded && !a.enabled && <div className="empty"><p className="muted">The leaderboard is not turned on for this site.</p></div>}
      {a.enabled && (
        <>
          <div className="filters" role="group" aria-label="Period" style={{ marginBottom: 12 }}>
            {(["day", "week", "month"] as Range[]).map((r) => (
              <button key={r} className="chip" aria-pressed={range === r} onClick={() => setRange(r)}>{r === "day" ? "Today" : r === "week" ? "7 days" : "30 days"}</button>
            ))}
          </div>
          {!a.user && <p className="muted small">Sign in on the <Link href={`/${lang}/progress`}>Me tab</Link> to appear here.</p>}
          {err && <p role="alert">{err}</p>}
          <div className="table">
            {rows?.map((r) => (
              <div className="trow" key={r.rank} style={r.me ? { background: "var(--primary-soft)" } : undefined}>
                <span><b style={{ display: "inline-block", width: 32 }}>{r.rank}</b>{r.name}{r.me ? " (you)" : ""}</span>
                <b>{r.points}</b>
              </div>
            ))}
            {rows && !rows.length && <div className="trow"><span className="muted">No one has scored in this period yet. Read a story to be first.</span></div>}
          </div>
        </>
      )}
    </>
  );
}
