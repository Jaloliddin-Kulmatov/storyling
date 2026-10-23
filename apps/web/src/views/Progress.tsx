"use client";

import type { LangCode } from "@storyling/core";
import { today, useLearner, useSettings } from "@/lib/learner";
import { useStories } from "@/lib/stories";
import { AccountCard } from "@/components/AccountCard";

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
