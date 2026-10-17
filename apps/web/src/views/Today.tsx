"use client";

import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import Link from "next/link";
import { useAiEnabled } from "@/lib/ai";
import { today, useLearner, useSettings } from "@/lib/learner";
import { useRankedStories } from "@/lib/rank";
import { isUserStory, TOPIC_LABEL } from "@/lib/stories";
import { Art, CoverageBar, FitBadge, Icon, StoryCard } from "@/components/ui";

export function Today({ lang }: { lang: LangCode }) {
  const learner = useLearner(lang);
  const [settings] = useSettings();
  const ranked = useRankedStories(lang);
  const ai = useAiEnabled();
  const meta = language(lang);

  const minutesToday = Math.floor((learner.log[today()]?.seconds ?? 0) / 60);
  const goal = settings.dailyGoalMinutes;
  const due = learner.dueWords().length;
  // Prefer the best-fitting catalog story; the learner's own texts stay one tap away in the library.
  const next = ranked.find((r) => !r.read && !isUserStory(r.story)) ?? ranked.find((r) => !r.read);
  const more = ranked.filter((r) => !r.read && r !== next).slice(0, 6);
  const allRead = ranked.length > 0 && ranked.every((r) => r.read);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">{new Date().toLocaleDateString("en", { weekday: "long", day: "numeric", month: "long" })}</div>
          <h1>Today</h1>
        </div>
        <span className="muted" lang={lang} style={{ fontFamily: "var(--f-read)", fontSize: 20 }}>{meta.native}</span>
      </div>

      <div className="stats">
        <div className="stat">
          <b>{minutesToday}/{goal} min</b>
          <span>daily goal</span>
          <div className="goal"><i style={{ width: `${Math.min(100, (minutesToday / goal) * 100)}%` }} /></div>
        </div>
        <div className="stat"><b>{learner.streak} {learner.streak === 1 ? "day" : "days"}</b><span>streak</span></div>
        <div className="stat"><b>{learner.knownCount}</b><span>words known</span></div>
        <Link href={`/${lang}/words`} className="stat" style={{ color: "inherit", textDecoration: "none" }}>
          <b>{due}</b><span>{due === 1 ? "word" : "words"} to review</span>
        </Link>
      </div>

      {next && (
        <>
          <div className="section-h"><h2>{learner.finished.length ? "Read next" : "Your first story"}</h2></div>
          <Link href={`/${lang}/read/${next.story.id}`} className="feature">
            <Art topic={isUserStory(next.story) ? "mine" : next.story.topic} />
            <span className="fb">
              <span className="eyebrow" style={{ color: "var(--primary-strong)" }}>{next.story.level} · {next.story.minutes} min</span>
              <span className="t" lang={lang}>{next.story.title}</span>
              <span className="muted">{next.story.titleEnglish || TOPIC_LABEL[next.story.topic]}</span>
              <CoverageBar coverage={next.coverage} />
              <span className="row small"><FitBadge coverage={next.coverage} /><span className="muted">{next.coverage.newWords.length} new words</span></span>
            </span>
          </Link>
        </>
      )}

      {allRead && (
        <div className="empty" style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 22 }}>You've read every story here</h2>
          <p className="muted">Add your own text{ai ? " or let AI write a new story with your words" : ""}.</p>
          <Link className="btn primary" href={`/${lang}/add`}>Add a text</Link>
        </div>
      )}

      {due > 0 && (
        <div className="card spread" style={{ marginTop: 16 }}>
          <span><b>{due} {due === 1 ? "word is" : "words are"} due for review.</b> <span className="muted">Reading a story that uses them counts too.</span></span>
          <Link className="btn sm" href={`/${lang}/words`}>Review now</Link>
        </div>
      )}

      {ai && (
        <Link href={`/${lang}/add?tab=story`} className="card spread" style={{ marginTop: 12, textDecoration: "none", color: "inherit", background: "var(--new-word-soft)", borderColor: "transparent" }}>
          <span><b className="row" style={{ display: "inline-flex" }}>{Icon.spark} Story for me</b><br /><span className="muted small">A new story at your level, using the words you're learning.</span></span>
          <span className="btn sm">Write one</span>
        </Link>
      )}

      {more.length > 0 && (
        <>
          <div className="section-h"><h2>Also good for you</h2><Link href={`/${lang}/library`} className="small" style={{ fontWeight: 700 }}>See all</Link></div>
          <div className="grid">{more.map((r) => <StoryCard key={r.story.id} {...r} />)}</div>
        </>
      )}
    </>
  );
}
