"use client";

import { coverage, recommend, type Coverage, type LangCode } from "@storyling/core";
import { useMemo } from "react";
import { useLearner } from "./learner";
import { useStories, type AnyStory } from "./stories";

export interface Ranked {
  story: AnyStory;
  coverage: Coverage;
  read: boolean;
}

/** Every story with the learner's coverage, unread best-fit first, read stories last. */
export function useRankedStories(lang: LangCode): Ranked[] {
  const learner = useLearner(lang);
  const all = useStories(lang);
  return useMemo(() => {
    const due = new Set(learner.dueWords().map((w) => w.lemma));
    const items = all.map((story) => {
      const lemmas = new Set(story.sentences.flatMap((s) => s.tokens.flatMap((t) => (t.lemma ? [t.lemma] : []))));
      return {
        story,
        coverage: coverage(story, learner.pKnown),
        read: learner.finished.includes(story.id),
        due: [...lemmas].filter((l) => due.has(l)).length,
      };
    });
    const order = recommend(
      items.map((i) => ({
        id: i.story.id,
        coverage: i.coverage,
        continuesSeries: false,
        interestMatch: 0,
        dueWordsInside: i.due,
        ageDays: 0,
        recentlyAbandoned: false,
        finished: i.read,
      })),
      items.length,
    ).map((c) => c.id);
    const byId = new Map(items.map((i) => [i.story.id, i]));
    const unread = order.map((id) => byId.get(id)!);
    const read = items.filter((i) => i.read);
    return [...unread, ...read].map(({ story, coverage, read }) => ({ story, coverage, read }));
  }, [all, learner]);
}
