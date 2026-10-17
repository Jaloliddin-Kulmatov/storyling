"use client";

import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { useMemo, useState } from "react";
import { useLearner } from "@/lib/learner";
import { useRankedStories } from "@/lib/rank";
import { isUserStory, TOPIC_LABEL } from "@/lib/stories";
import { StoryRow } from "@/components/ui";

type Sort = "fit" | "short" | "new";

export function Library({ lang }: { lang: LangCode }) {
  const ranked = useRankedStories(lang);
  const learner = useLearner(lang);
  const meta = language(lang);
  const [level, setLevel] = useState("all");
  const [topic, setTopic] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("fit");
  const [hideRead, setHideRead] = useState(false);

  const levels = ["all", ...meta.levels, ...(learner.stories.length ? ["Your text"] : [])];
  const topics = ["all", ...new Set(ranked.map((r) => (isUserStory(r.story) ? "mine" : r.story.topic)))];

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = ranked.filter((r) => {
      const t = isUserStory(r.story) ? "mine" : r.story.topic;
      const levelOk = level === "all" || (level === "Your text" ? isUserStory(r.story) : r.story.level === level);
      return (
        levelOk &&
        (topic === "all" || t === topic) &&
        (!hideRead || !r.read) &&
        (!q || r.story.title.toLowerCase().includes(q) || r.story.titleEnglish.toLowerCase().includes(q))
      );
    });
    if (sort === "short") list = [...list].sort((a, b) => a.story.minutes - b.story.minutes);
    if (sort === "new") list = [...list].sort((a, b) => (isUserStory(b.story) ? b.story.createdAt : 0) - (isUserStory(a.story) ? a.story.createdAt : 0));
    return list;
  }, [ranked, level, topic, query, sort, hideRead]);

  return (
    <>
      <div className="page-head">
        <div><div className="eyebrow">{meta.name} · {ranked.length} stories</div><h1>Library</h1></div>
        <input className="input" type="search" placeholder="Search titles" aria-label="Search stories" value={query} onChange={(e) => setQuery(e.target.value)} style={{ maxWidth: 260 }} />
      </div>

      <div className="tabs" role="group" aria-label="Level">
        {levels.map((l) => <button key={l} aria-pressed={level === l} onClick={() => setLevel(l)}>{l === "all" ? "All levels" : l}</button>)}
      </div>
      <div className="spread" style={{ marginBottom: 14 }}>
        <div className="filters" role="group" aria-label="Topic">
          {topics.map((t) => <button key={t} className="chip" aria-pressed={topic === t} onClick={() => setTopic(t)}>{t === "all" ? "All topics" : TOPIC_LABEL[t] ?? t}</button>)}
        </div>
        <div className="row">
          <label className="row small" style={{ fontWeight: 600 }}><input type="checkbox" checked={hideRead} onChange={(e) => setHideRead(e.target.checked)} /> Hide read</label>
          <div className="seg" role="group" aria-label="Sort">
            <button aria-pressed={sort === "fit"} onClick={() => setSort("fit")}>Best fit</button>
            <button aria-pressed={sort === "short"} onClick={() => setSort("short")}>Shortest</button>
            <button aria-pressed={sort === "new"} onClick={() => setSort("new")}>My texts first</button>
          </div>
        </div>
      </div>

      <div className="list">
        {shown.map((r) => <StoryRow key={r.story.id} {...r} />)}
        {!shown.length && <div className="empty"><p className="muted" style={{ margin: 0 }}>No stories match these filters.</p></div>}
      </div>
    </>
  );
}
