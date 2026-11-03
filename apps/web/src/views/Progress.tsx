"use client";

import type { LangCode } from "@storyling/core";
import { today, useLearner, useSettings } from "@/lib/learner";
import { useStories } from "@/lib/stories";
import { AccountCard } from "@/components/AccountCard";
import { language } from "@storyling/content";
import { wordLevels } from "@storyling/learner";
import { useMemo } from "react";

export function Progress({ lang }: { lang: LangCode }) {
  const learner = useLearner(lang);
  const [settings] = useSettings();
  const stories = useStories(lang);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = today(d);
    return { key, label: d.toLocaleDateString("en", { weekday: "narrow" }), minutes: Math.round((learner.log[key]?.seconds ?? 0) / 60) };
  });
  const max = Math.max(settings.dailyGoalMinutes, ...days.map((d) => d.minutes));
  const totalMinutes = Math.round(Object.values(learner.log).reduce((n, d) => n + d.seconds, 0) / 60);
  const wordsRead = Object.values(learner.log).reduce((n, d) => n + d.words, 0);
  const accuracy = learner.quiz.total ? Math.round((learner.quiz.right / learner.quiz.total) * 100) : null;
  const goalDays = days.filter((d) => d.minutes >= settings.dailyGoalMinutes).length;

  return (
    <>
      <div className="page-head"><div><div className="eyebrow">Your reading</div><h1>Progress</h1></div></div>

      <AccountCard lang={lang} />
      <WeeklyReport lang={lang} />
      <LevelEstimate lang={lang} />

      <div className="stats" style={{ marginTop: 16 }}>
        <div className="stat"><b>{learner.knownCount}</b><span>words known</span></div>
        <div className="stat"><b>{learner.streak} {learner.streak === 1 ? "day" : "days"}</b><span>streak</span></div>
        <div className="stat"><b>{learner.finished.length}/{stories.length}</b><span>stories read</span></div>
        <div className="stat"><b>{accuracy === null ? "—" : `${accuracy}%`}</b><span>quick-check accuracy</span></div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="spread" style={{ marginBottom: 14 }}>
          <b>Minutes per day</b>
          <span className="muted small">Goal met on {goalDays} of the last 14 days</span>
        </div>
        <div className="chart" role="img" aria-label={`Reading minutes for the last 14 days: ${days.map((d) => d.minutes).join(", ")}`}>
          {days.map((d, i) => (
            <span key={d.key} className={i === 13 ? "today" : ""} title={`${d.key}: ${d.minutes} min`} style={{ height: `${(d.minutes / max) * 100}%` }} />
          ))}
        </div>
        <div className="chart-labels">{days.map((d) => <span key={d.key}>{d.label}</span>)}</div>
      </div>

      <div className="stats" style={{ marginTop: 16 }}>
        <div className="stat"><b>{totalMinutes} min</b><span>total reading time</span></div>
        <div className="stat"><b>{wordsRead}</b><span>words read</span></div>
        <div className="stat"><b>{learner.learningCount}</b><span>saved for review</span></div>
        <div className="stat"><b>{learner.stories.length}</b><span>texts you added</span></div>
      </div>
    </>
  );
}


const sumDays = (log: Record<string, { seconds: number; words: number; stories: number; reviews?: number; dictations?: number }>, from: number, to: number) => {
  const out = { minutes: 0, words: 0, stories: 0, reviews: 0, dictations: 0, days: 0 };
  for (let i = from; i < to; i++) {
    const d = log[today(new Date(Date.now() - i * 864e5))];
    if (!d) continue;
    out.minutes += d.seconds / 60;
    out.words += d.words;
    out.stories += d.stories;
    out.reviews += d.reviews ?? 0;
    out.dictations += d.dictations ?? 0;
    if (d.seconds > 0) out.days++;
  }
  out.minutes = Math.round(out.minutes);
  return out;
};

/** This week against last week: minutes, days active, stories, words read, reviews and dictations. */
function WeeklyReport({ lang }: { lang: LangCode }) {
  const learner = useLearner(lang);
  const now = sumDays(learner.log, 0, 7);
  const before = sumDays(learner.log, 7, 14);
  const rows: [string, number, number][] = [
    ["Minutes read", now.minutes, before.minutes],
    ["Days active", now.days, before.days],
    ["Stories finished", now.stories, before.stories],
    ["Words read", now.words, before.words],
    ["Cards reviewed", now.reviews, before.reviews],
    ["Dictations", now.dictations, before.dictations],
  ];
  return (
    <section className="card" style={{ marginTop: 16 }} aria-labelledby="week-h">
      <div className="spread" style={{ marginBottom: 10 }}>
        <b id="week-h">This week</b>
        <span className="muted small">compared with the 7 days before</span>
      </div>
      <div className="week-grid">
        {rows.map(([label, a, b]) => {
          const diff = a - b;
          return (
            <div key={label} className="week-cell">
              <b>{a}</b>
              <span className="small muted">{label}</span>
              <span className={`small ${diff > 0 ? "up" : diff < 0 ? "down" : "muted"}`}>{diff > 0 ? `▲ ${diff}` : diff < 0 ? `▼ ${-diff}` : "same"}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Level estimate from the words the learner knows: for each level, the share of that level's story words
 * marked known. The estimate is the highest level where at least 60% are known.
 */
function LevelEstimate({ lang }: { lang: LangCode }) {
  const learner = useLearner(lang);
  const meta = language(lang);
  const shares = useMemo(() => {
    const byLevel = meta.levels.map(() => ({ known: 0, total: 0 }));
    for (const [lemma, lv] of wordLevels(lang)) {
      const b = byLevel[lv];
      if (!b) continue;
      b.total++;
      if (learner.wordState(lemma) === "known") b.known++;
    }
    return byLevel.map((b) => (b.total ? b.known / b.total : 0));
  }, [lang, learner, meta.levels]);
  let est = -1;
  shares.forEach((s, i) => { if (s >= 0.6 && est === i - 1) est = i; });
  const label = est < 0 ? `below ${meta.levels[0]}` : meta.levels[est]!;
  return (
    <section className="card" style={{ marginTop: 16 }} aria-labelledby="lvl-h">
      <div className="spread" style={{ marginBottom: 10 }}>
        <b id="lvl-h">Estimated level: {label}</b>
        <span className="muted small">updates as you read</span>
      </div>
      <div className="lvl-bars">
        {meta.levels.map((l, i) => (
          <div key={l} className="lvl-bar">
            <span className="small" style={{ width: 64 }}>{l}</span>
            <span className="bar"><span style={{ width: `${Math.round(shares[i]! * 100)}%` }} /></span>
            <span className="small muted" style={{ width: 44, textAlign: "right" }}>{Math.round(shares[i]! * 100)}%</span>
          </div>
        ))}
      </div>
      <p className="muted small" style={{ margin: "8px 0 0" }}>Share of each level&apos;s words you know. A level counts as reached at 60%. This is a guide, not an official CEFR or TOPIK result.</p>
    </section>
  );
}
