"use client";

import type { LangCode } from "@storyling/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account";

type Range = "league" | "day" | "week" | "month";
interface Row { rank: number; name: string; points: number; me: boolean }

/** Leaderboard: points from reading time (2 per minute), words read (1 each) and new stories (10 each). */
export function Leaderboard({ lang }: { lang: LangCode }) {
  const a = useAccount();
  const [range, setRange] = useState<Range>("league");
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
            {(["league", "day", "week", "month"] as Range[]).map((r) => (
              <button key={r} className="chip" aria-pressed={range === r} onClick={() => setRange(r)}>{r === "league" ? "🏆 Weekly league" : r === "day" ? "Today" : r === "week" ? "7 days" : "30 days"}</button>
            ))}
          </div>
          {range === "league" && rows && <LeagueCard rows={rows} />}
          {!a.user && <p className="muted small">Sign in on the <Link href={`/${lang}/progress`}>Me tab</Link> to appear here.</p>}
          {err && <p role="alert">{err}</p>}
          <div className="table">
            {rows?.map((r) => (
              <div className="trow" key={r.rank} style={r.me ? { background: "var(--primary-soft)" } : undefined}>
                <span><b style={{ display: "inline-block", width: 32 }}>{range === "league" && r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}</b>{r.name}{r.me ? " (you)" : ""}</span>
                <span className="row" style={{ gap: 8 }}>{range === "league" && <span className="pill">{tierOf(r.points).name}</span>}<b>{r.points}</b></span>
              </div>
            ))}
            {rows && !rows.length && <div className="trow"><span className="muted">No one has scored in this period yet. Read a story to be first.</span></div>}
          </div>
        </>
      )}
    </>
  );
}

/** League tiers by points this week: reading 15 minutes a day is enough for Gold. */
const TIERS = [
  { name: "🥉 Bronze", min: 0 },
  { name: "🥈 Silver", min: 100 },
  { name: "🥇 Gold", min: 300 },
  { name: "💎 Diamond", min: 700 },
];
const tierOf = (p: number) => [...TIERS].reverse().find((t) => p >= t.min)!;

function LeagueCard({ rows }: { rows: Row[] }) {
  const me = rows.find((r) => r.me);
  const now = new Date();
  // Days left until Monday 00:00 (the week resets then).
  const left = (8 - (now.getDay() || 7)) % 7 || 7;
  const tier = tierOf(me?.points ?? 0);
  const next = TIERS.find((t) => t.min > (me?.points ?? 0));
  const above = me && me.rank > 1 ? rows[me.rank - 2] : undefined;
  return (
    <div className="league-card">
      <span className="league-tier">{tier.name.split(" ")[0]}</span>
      <span className="stack" style={{ gap: 2 }}>
        <b>{me ? `${tier.name.slice(tier.name.indexOf(" ") + 1)} league · #${me.rank} this week` : "Join this week's league"}</b>
        <span className="small muted">
          {me
            ? [above ? `${above.points - me.points + 1} points to pass ${above.name}` : "You're in first place!", next ? `${next.min - me.points} to ${next.name}` : ""].filter(Boolean).join(" · ")
            : "Read, review or play to score points. Everyone starts at zero each Monday."}
        </span>
      </span>
      <span className="small muted" style={{ marginLeft: "auto" }}>Ends in {left} {left === 1 ? "day" : "days"}</span>
    </div>
  );
}
