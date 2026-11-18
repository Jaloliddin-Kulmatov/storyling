"use client";

import type { LangCode } from "@storyling/core";
import type { DayLog } from "@storyling/learner";
import Link from "next/link";
import { useEffect, useState } from "react";
import { today, useLearner } from "@/lib/learner";
import { Confetti } from "@/views/Practice";

interface Challenge { key: string; icon: string; label: string; value: number; target: number; xp: number; href: string }

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7) >>> 0;

/** Today's three challenges: always a story, plus two that change every day. */
export function challengesFor(day: string, log: DayLog | undefined, lang: LangCode, storyHref: string): Challenge[] {
  const l = log ?? { seconds: 0, words: 0, stories: 0 };
  const played = l.played ?? [];
  const pool: Challenge[] = [
    { key: "games", icon: "🎮", label: "Play 2 games", value: l.games ?? 0, target: 2, xp: 20, href: `/${lang}/practice` },
    { key: "win", icon: "🏆", label: "Score 80% or more in a game", value: l.wins ?? 0, target: 1, xp: 25, href: `/${lang}/practice` },
    { key: "review", icon: "🃏", label: "Review 10 flashcards", value: l.reviews ?? 0, target: 10, xp: 20, href: `/${lang}/practice?mode=review` },
    { key: "words", icon: "✨", label: "Meet 10 new words", value: l.words ?? 0, target: 10, xp: 20, href: storyHref },
    { key: "minutes", icon: "⏱️", label: "Read for 10 minutes", value: Math.floor((l.seconds ?? 0) / 60), target: 10, xp: 25, href: storyHref },
    { key: "speed", icon: "⚡", label: "Beat a Speed round", value: played.includes("speed") ? 1 : 0, target: 1, xp: 20, href: `/${lang}/practice?mode=speed` },
    { key: "memory", icon: "🧠", label: "Clear a Memory board", value: played.includes("memory") ? 1 : 0, target: 1, xp: 20, href: `/${lang}/practice?mode=memory` },
    { key: "dictation", icon: "✍️", label: "Finish a dictation", value: l.dictations ?? 0, target: 1, xp: 25, href: `/${lang}/practice?mode=dictation` },
    { key: "say", icon: "🎤", label: "Say 8 words out loud", value: played.includes("say") ? 1 : 0, target: 1, xp: 25, href: `/${lang}/practice?mode=say` },
  ];
  const h = hash(day);
  const a = pool[h % pool.length]!;
  const rest = pool.filter((c) => c !== a);
  const b = rest[(h >>> 8) % rest.length]!;
  return [{ key: "story", icon: "📖", label: "Read a story", value: l.stories ?? 0, target: 1, xp: 30, href: storyHref }, a, b];
}

const allDone = (cs: Challenge[]) => cs.every((c) => c.value >= c.target);

/** Days in a row, up to today, when all three challenges were done. */
function perfectStreak(log: Record<string, DayLog>, lang: LangCode) {
  let n = 0;
  const d = new Date();
  if (!allDone(challengesFor(today(d), log[today(d)], lang, ""))) d.setDate(d.getDate() - 1);
  while (allDone(challengesFor(today(d), log[today(d)], lang, ""))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function Challenges({ lang, storyHref }: { lang: LangCode; storyHref: string }) {
  const learner = useLearner(lang);
  const day = today();
  const list = challengesFor(day, learner.log[day], lang, storyHref);
  const done = list.filter((c) => c.value >= c.target);
  const xp = done.reduce((n, c) => n + c.xp, 0);
  const max = list.reduce((n, c) => n + c.xp, 0);
  const finished = done.length === list.length;
  const streak = perfectStreak(learner.log, lang);
  // Confetti once, the first time today's three are done on this device.
  const [party, setParty] = useState(false);
  useEffect(() => {
    if (!finished) return;
    const key = `challenges-party-${lang}-${day}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {}
    setParty(true);
  }, [finished, lang, day]);

  return (
    <section className={`challenges${finished ? " all" : ""}`} aria-label="Today's challenges">
      {party && <Confetti />}
      <div className="ch-head">
        <div className="ch-prize" style={{ ["--p" as string]: xp / max }} aria-hidden="true"><span>{finished ? "🏆" : "🎁"}</span></div>
        <div className="stack" style={{ gap: 2 }}>
          <b>{finished ? "All challenges done!" : "Today's challenges"}</b>
          <span className="small muted">{xp}/{max} XP{streak > 0 ? ` · 🔥 ${streak} perfect ${streak === 1 ? "day" : "days"} in a row` : " · New ones every day"}</span>
        </div>
      </div>
      <div className="ch-list">
        {list.map((c, i) => {
          const ok = c.value >= c.target;
          return (
            <Link key={c.key} href={c.href} className={`ch-item${ok ? " ok" : ""}`} style={{ ["--i" as string]: i }}>
              <span className="ch-icon" aria-hidden="true">{ok ? "✓" : c.icon}</span>
              <span className="ch-body">
                <span className="ch-label">{c.label}</span>
                <span className="ch-bar"><i style={{ width: `${Math.min(100, (c.value / c.target) * 100)}%` }} /></span>
              </span>
              <span className="ch-xp">{ok ? "Done" : `+${c.xp} XP`}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
