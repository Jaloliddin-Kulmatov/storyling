"use client";

import { lookup, type DictEntry } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { useCallback } from "react";
import type { StoredWord } from "./learner";
import { lookupIn, textOf, useStories, type AnyStory } from "./stories";

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
