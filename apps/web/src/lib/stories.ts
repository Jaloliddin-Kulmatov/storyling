"use client";

import { language, lookup, sentenceText, storiesFor, type CatalogStory, type DictEntry } from "@storyling/content";
import type { LangCode, Sentence } from "@storyling/core";
import type { UserStory } from "@storyling/learner";
import { useMemo } from "react";
import type { PreparedText } from "@/server/ai";
import { useLearner } from "./learner";

export type AnyStory = CatalogStory | UserStory;

export const isUserStory = (s: AnyStory): s is UserStory => "origin" in s;
export const PUNCT = /^[\p{P}\p{S}]+$/u;

/** Catalog stories plus the learner's own texts, newest own texts first. */
export function useStories(lang: LangCode): AnyStory[] {
  const { stories } = useLearner(lang);
  return useMemo(() => [...stories, ...storiesFor(lang)], [stories, lang]);
}

export function useStory(lang: LangCode, id: string): AnyStory | undefined {
  const all = useStories(lang);
  return all.find((s) => s.id === id);
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

export const TOPIC_LABEL: Record<string, string> = {
  daily: "Daily life", food: "Food", work: "Work", weather: "Weather", animals: "Animals",
  travel: "Travel", city: "City", home: "Home", history: "History", people: "People",
  nature: "Nature", science: "Science", culture: "Culture", mine: "My texts",
};

const minutesFor = (words: number) => Math.max(1, Math.round(words / 80));

/** Turn an AI-prepared text into a story the reader can open. */
export function storyFromPrepared(lang: LangCode, p: PreparedText, origin: UserStory["origin"], level: string): UserStory {
  const sentences: Sentence[] = p.sentences.map((s) => ({
    tokens: s.tokens
      .filter((t) => t.s)
      .map((t) => (!t.l || PUNCT.test(t.s) ? { surface: t.s } : { surface: t.s, lemma: t.l })),
    translation: s.tr,
  }));
  const dict: UserStory["dict"] = {};
  for (const g of p.glossary) dict[g.lemma] = g.reading ? [g.pos, g.meaning, g.reading] : [g.pos, g.meaning];
  // Words the AI forgot to gloss fall back to the shared dictionary at lookup time.
  const words = sentences.reduce((n, s) => n + s.tokens.filter((t) => t.lemma).length, 0);
  return {
    id: `${origin === "ai" ? "ai" : "imp"}-${Date.now().toString(36)}`,
    lang,
    title: p.title,
    titleEnglish: p.titleEnglish,
    level,
    topic: "mine",
    minutes: minutesFor(words),
    date: new Date().toLocaleDateString("en", { month: "short", day: "numeric" }),
    sentences,
    origin,
    dict,
    createdAt: Date.now(),
  };
}

/** Import without AI: split with the browser's word segmenter; meanings come from the built-in dictionary. */
export function storyFromPlainText(lang: LangCode, title: string, text: string): UserStory | null {
  if (typeof Intl.Segmenter !== "function") return null;
  const tag = language(lang).tts;
  const words = new Intl.Segmenter(tag, { granularity: "word" });
  const sentences: Sentence[] = [];
  for (const { segment } of new Intl.Segmenter(tag, { granularity: "sentence" }).segment(text)) {
    const tokens = [];
    for (const w of words.segment(segment.trim())) {
      if (!w.segment.trim()) continue;
      tokens.push(w.isWordLike ? { surface: w.segment, lemma: lang === "de" ? w.segment : w.segment.toLowerCase() } : { surface: w.segment });
    }
    if (tokens.length) sentences.push({ tokens });
  }
  if (!sentences.length) return null;
  const count = sentences.reduce((n, s) => n + s.tokens.filter((t) => t.lemma).length, 0);
  return {
    id: `imp-${Date.now().toString(36)}`,
    lang,
    title: title || sentences[0]!.tokens.slice(0, 5).map((t) => t.surface).join(language(lang).noSpace ? "" : " "),
    titleEnglish: "",
    level: "Your text",
    topic: "mine",
    minutes: minutesFor(count),
    date: new Date().toLocaleDateString("en", { month: "short", day: "numeric" }),
    sentences,
    origin: "paste",
    dict: {},
    createdAt: Date.now(),
  };
}
