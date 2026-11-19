import { grammarFor, storiesFor, type CatalogStory, type GrammarTopic } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { FUNCTION_POS, lookupIn, wordLevelOf, type AnyStory } from "@storyling/learner";

export interface Lesson {
  n: number;
  story: CatalogStory;
  grammar?: GrammarTopic;
}

const words = (s: CatalogStory) => s.sentences.reduce((n, x) => n + x.tokens.filter((t) => t.lemma).length, 0);

/** The course for one level: its built-in stories from shortest to longest, each paired with one grammar point of that level. */
export function lessonsFor(lang: LangCode, level: string): Lesson[] {
  const topics = grammarFor(lang).filter((g) => g.level === level);
  return storiesFor(lang)
    .filter((s) => s.level === level && s.sentences.length >= 4)
    .sort((a, b) => words(a) - words(b) || a.id.localeCompare(b.id))
    .map((story, i) => ({ n: i + 1, story, grammar: topics.length ? topics[i % topics.length] : undefined }));
}

export interface Keyword { lemma: string; display: string; meaning: string; reading?: string; sentence: number; surface: string }

/**
 * The five words most worth knowing before reading: content words (no names or particles), the learner's unknown
 * ones first, then the harder ones, then the ones the story uses most.
 */
export function keywordsOf(story: AnyStory, known: (lemma: string) => boolean, count = 5): Keyword[] {
  const seen = new Map<string, Keyword & { uses: number }>();
  story.sentences.forEach((s, i) =>
    s.tokens.forEach((t) => {
      if (!t.lemma || t.isName) return;
      const hit = seen.get(t.lemma);
      if (hit) return void hit.uses++;
      const e = lookupIn(story, t.lemma);
      if (!e || FUNCTION_POS.has(e.pos) || !e.meaning) return;
      seen.set(t.lemma, { lemma: t.lemma, display: e.display, meaning: e.meaning, reading: e.reading, sentence: i, surface: t.surface, uses: 1 });
    }),
  );
  const level = (l: string) => wordLevelOf(story.lang, l) ?? 0;
  return [...seen.values()]
    .sort((a, b) => Number(known(a.lemma)) - Number(known(b.lemma)) || level(b.lemma) - level(a.lemma) || b.uses - a.uses)
    .slice(0, count);
}
