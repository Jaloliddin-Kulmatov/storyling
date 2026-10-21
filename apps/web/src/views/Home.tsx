"use client";

import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import Link from "next/link";
import { useMemo, useState } from "react";
import { today, useLearner, useSettings } from "@/lib/learner";
import { useRankedStories, type Ranked } from "@/lib/rank";
import { isUserStory, TOPIC_LABEL } from "@/lib/stories";
import { Cover, FitBadge, Icon } from "@/components/ui";

/**
 * Home: a reading feed sorted like a news app. Level tabs across the top ("For you" first),
 * topic chips, one featured story, then a list. Stats sit in one compact strip above.
 */
export function Home({ lang }: { lang: LangCode }) {
  const learner = useLearner(lang);
  const [settings] = useSettings();
  const ranked = useRankedStories(lang);
  const meta = language(lang);
  const [level, setLevel] = useState("for-you");
  const [topic, setTopic] = useState("all");
  const [query, setQuery] = useState("");

  const minutes = Math.floor((learner.log[today()]?.seconds ?? 0) / 60);
  const goal = settings.dailyGoalMinutes;
  const due = learner.dueWords().length;
  const topicOf = (r: Ranked) => (isUserStory(r.story) ? "mine" : r.story.topic);

  const levelItems = useMemo(
    () =>
      level === "for-you"
        ? ranked.filter((r) => !isUserStory(r.story))
        : level === "mine"
          ? ranked.filter((r) => isUserStory(r.story))
          : ranked.filter((r) => !isUserStory(r.story) && r.story.level === level),
    [ranked, level],
  );
  const topics = ["all", ...new Set(levelItems.map(topicOf))];
  const q = query.trim().toLowerCase();
  const items = levelItems.filter(
    (r) =>
      (topic === "all" || topicOf(r) === topic) &&
      (!q || r.story.title.toLowerCase().includes(q) || r.story.titleEnglish.toLowerCase().includes(q)),
  );
  const [featured, ...rest] = items;
  const countAt = (l: string) => ranked.filter((r) => !isUserStory(r.story) && r.story.level === l).length;

  return (
    <>
      <div className="home-top">
        <div>
          <div className="eyebrow">{meta.name} · {new Date().toLocaleDateString("en", { weekday: "long", day: "numeric", month: "long" })}</div>
          <h1>Read today</h1>
        </div>
        <div className="row">
          <input className="input" type="search" placeholder="Search stories" aria-label="Search stories" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 200 }} />
          <Link className="btn sm" href={`/${lang}/add`}>{Icon.add} Add text</Link>
        </div>
      </div>

      <div className="strip" role="group" aria-label="Today's progress">
        <span className="ring" style={{ ["--p" as string]: Math.min(1, minutes / goal) }} aria-hidden="true" />
        <span><b>{minutes}/{goal}</b> min today</span>
        <span className="dot" aria-hidden="true" />
        <span><b>{learner.streak}</b> day streak</span>
        <span className="dot" aria-hidden="true" />
        <span><b>{learner.knownCount}</b> words known</span>
        {due > 0 && (
          <Link href={`/${lang}/practice?mode=review`} className="strip-cta">{due} to review {Icon.next}</Link>
        )}
      </div>

      <div className="level-tabs" role="tablist" aria-label="Level">
        <button role="tab" aria-selected={level === "for-you"} onClick={() => { setLevel("for-you"); setTopic("all"); }}>For you</button>
        {meta.levels.map((l) => (
          <button key={l} role="tab" aria-selected={level === l} onClick={() => { setLevel(l); setTopic("all"); }}>
            {l} <small>{countAt(l)}</small>
          </button>
        ))}
        {learner.stories.length > 0 && (
          <button role="tab" aria-selected={level === "mine"} onClick={() => { setLevel("mine"); setTopic("all"); }}>My texts</button>
        )}
      </div>
      <div className="filters" role="group" aria-label="Topic" style={{ margin: "12px 0 16px" }}>
        {topics.map((t) => (
          <button key={t} className="chip" aria-pressed={topic === t} onClick={() => setTopic(t)}>{t === "all" ? "All topics" : TOPIC_LABEL[t] ?? t}</button>
        ))}
      </div>

      {featured ? (
        <>
          <Featured r={featured} lang={lang} saved={learner.favorites.includes(featured.story.id)} onSave={() => learner.toggleFavorite(featured.story.id)} />
          <div className="feed">
            {rest.map((r) => (
              <FeedRow key={r.story.id} r={r} lang={lang} saved={learner.favorites.includes(r.story.id)} onSave={() => learner.toggleFavorite(r.story.id)} />
            ))}
          </div>
        </>
      ) : (
        <div className="empty"><p className="muted" style={{ margin: 0 }}>No stories here yet.</p></div>
      )}
    </>
  );
}

function SaveButton({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  return (
    <button
      className={`save${saved ? " on" : ""}`}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save story"}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(); }}
    >
      {Icon.bookmark}
    </button>
  );
}

function Featured({ r, lang, saved, onSave }: { r: Ranked; lang: LangCode; saved: boolean; onSave: () => void }) {
  const s = r.story;
  const topic = isUserStory(s) ? "mine" : s.topic;
  return (
    <Link href={`/${lang}/read/${s.id}`} className="hero-card">
      <Cover story={s} className="hero-img">
        <span className="hero-shade" />
        <span className="hero-over">
          <span className="row small">
            <span className="lvl">{s.level}</span>
            <span className="tag">{TOPIC_LABEL[topic] ?? topic}</span>
            <span className="tag">{s.minutes} min</span>
            {r.read && <span className="tag">Read</span>}
          </span>
          <span className="t" lang={lang}>{s.title}</span>
          {s.titleEnglish && <span className="sub">{s.titleEnglish}</span>}
        </span>
      </Cover>
      <span className="hb">
        <span className="snippet" lang={lang}>{s.sentences.slice(0, 2).map((x) => x.tokens.map((t) => t.surface).join(" ")).join(" ").replace(/ ([.,!?:;。、！？])/g, "$1")}</span>
        <span className="spread">
          <span className="row"><FitBadge coverage={r.coverage} /><span className="muted small">{r.coverage.newWords.length} new words</span></span>
          <span className="row"><SaveButton saved={saved} onSave={onSave} /><span className="btn sm primary">Read now</span></span>
        </span>
      </span>
    </Link>
  );
}

function FeedRow({ r, lang, saved, onSave }: { r: Ranked; lang: LangCode; saved: boolean; onSave: () => void }) {
  const s = r.story;
  const topic = isUserStory(s) ? "mine" : s.topic;
  return (
    <Link href={`/${lang}/read/${s.id}`} className={`feed-row${r.read ? " read" : ""}`}>
      <Cover story={s} className="thumb">{r.read && <span className="read-dot" aria-label="Read">✓</span>}</Cover>
      <span className="fr-body">
        <span className="row small"><span className="lvl">{s.level}</span><span className="muted">{TOPIC_LABEL[topic] ?? topic}</span></span>
        <span className="t" lang={lang}>{s.title}</span>
        {s.titleEnglish && <span className="muted small">{s.titleEnglish}</span>}
        <span className="row small muted">
          <span>{s.minutes} min read</span>
          <span>· {s.date}</span>
        </span>
      </span>
      <span className="fr-side">
        <FitBadge coverage={r.coverage} />
        <SaveButton saved={saved} onSave={onSave} />
      </span>
    </Link>
  );
}
