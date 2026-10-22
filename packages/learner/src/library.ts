import { lookup, sentenceText, storiesFor, type CatalogStory, type DictEntry } from "@storyling/content";
import { coverage, recommend, type Coverage, type LangCode, type Sentence } from "@storyling/core";
import { useCallback, useMemo } from "react";
import { useLearner, type StoredWord, type UserStory } from "./index";

/**
 * Library helpers shared by the web and phone apps: the learner's stories next to the catalog,
 * ranking by fit, meanings in context, and small utilities for games.
 */
export type AnyStory = CatalogStory | UserStory;

export const isUserStory = (s: AnyStory): s is UserStory => "origin" in s;
export const PUNCT = /^[\p{P}\p{S}]+$/u;

export const TOPIC_LABEL: Record<string, string> = {
  daily: "Daily life", food: "Food", work: "Work", weather: "Weather", animals: "Animals",
  travel: "Travel", city: "City", home: "Home", history: "History", people: "People",
  nature: "Nature", science: "Science", culture: "Culture", mine: "My texts",
};

export const topicOf = (s: AnyStory) => (isUserStory(s) ? "mine" : s.topic);

/** Catalog stories plus the learner's own texts, newest own texts first. */
export function useStories(lang: LangCode): AnyStory[] {
  const { stories } = useLearner(lang);
  return useMemo(() => [...stories, ...storiesFor(lang)], [stories, lang]);
}

export function useStory(lang: LangCode, id: string): AnyStory | undefined {
  return useStories(lang).find((s) => s.id === id);
}

/** Meaning of a lemma: the story's own glossary first, then the shared dictionary. */
export function lookupIn(story: AnyStory, lemma: string): DictEntry | undefined {
  if (isUserStory(story)) {
    const e = story.dict[lemma];
    if (e) return { lemma, display: lemma, pos: e[0], meaning: e[1], ...(e[2] ? { reading: e[2] } : {}) };
  }
  return lookup(story.lang, lemma);
}

export function textOf(story: AnyStory, sentence: Sentence): string {
  return sentenceText(story.lang, sentence);
}

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

export interface WordContext {
  story: AnyStory;
  sentence: number;
  text: string;
  surface: string;
  translation?: string;
}

/** Meaning and an example sentence for a learner's word: where they saved it, else the first story that uses it. */
export function useWordInfo(lang: LangCode) {
  const stories = useStories(lang);

  const meaningOf = useCallback(
    (w: Pick<StoredWord, "lemma" | "source">): DictEntry | undefined => {
      const story = w.source ? stories.find((s) => s.id === w.source!.storyId) : undefined;
      return (story ? lookupIn(story, w.lemma) : undefined) ?? lookup(lang, w.lemma) ?? stories.map((s) => lookupIn(s, w.lemma)).find(Boolean);
    },
    [stories, lang],
  );

  const contextOf = useCallback(
    (w: Pick<StoredWord, "lemma" | "source">): WordContext | undefined => {
      const story = w.source ? stories.find((s) => s.id === w.source!.storyId) : undefined;
      const s = story?.sentences[w.source!.sentence];
      if (story && s?.tokens.some((t) => t.lemma === w.lemma)) {
        return { story, sentence: w.source!.sentence, text: textOf(story, s), surface: s.tokens.find((t) => t.lemma === w.lemma)!.surface, translation: s.translation };
      }
      for (const st of stories)
        for (const [i, x] of st.sentences.entries()) {
          const t = x.tokens.find((t) => t.lemma === w.lemma);
          if (t) return { story: st, sentence: i, text: textOf(st, x), surface: t.surface, translation: x.translation };
        }
      return undefined;
    },
    [stories],
  );

  return { meaningOf, contextOf, stories };
}

/** Split `text` around `word` so the word can be highlighted. */
export function highlight(text: string, word: string): [string, string, string] | null {
  const i = text.indexOf(word);
  return i < 0 ? null : [text.slice(0, i), word, text.slice(i + word.length)];
}

export function shuffle<T>(xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
