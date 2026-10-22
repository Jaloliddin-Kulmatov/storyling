import type { LangCode, Sentence, Story, Token } from "@storyling/core";
import audioIndex from "./audio.json";
import coverIndex from "./covers.json";
import { DICT as BASE_DICT, LANGS, SEED, STORIES as BASE_STORIES } from "./data";
import { EVERYDAY_LANGS, MORE_DICT, MORE_STORIES } from "./more";

export { EVERYDAY_LANGS };
import type { RawEntry, RawSentence } from "./raw";

const DICT: Record<string, Record<string, RawEntry>> = Object.fromEntries(
  Object.keys(LANGS).map((l) => [l, { ...MORE_DICT[l], ...BASE_DICT[l] }]),
);
const STORIES = [...BASE_STORIES, ...MORE_STORIES];

export type { RawLang } from "./raw";

/** [start, end] in seconds inside an audio file. */
export type Span = [number, number];

/** Recorded audio: one file per story (a span per sentence) and one per language (a span per lemma). */
export const audio = audioIndex as unknown as {
  stories: Record<string, { f: string; s: Span[] }>;
  words: Record<string, { f: string; w: Record<string, Span> }>;
};

const PUNCT = /^[\p{P}\p{S}]+$/u;

export interface Language {
  code: LangCode;
  name: string;
  native: string;
  tts: string;
  levels: string[];
  noSpace: boolean;
}

export interface DictEntry {
  lemma: string;
  /** Lemma as shown; strips the "#v" disambiguation suffix ("sein#v" → "sein"). */
  display: string;
  pos: string;
  meaning: string;
  /** Pinyin for Chinese. */
  reading?: string;
}

export interface CatalogStory extends Story {
  title: string;
  titleEnglish: string;
  level: string;
  topic: string;
  minutes: number;
  date: string;
}

export const languages: Language[] = Object.entries(LANGS).map(([code, l]) => ({
  code: code as LangCode,
  name: l.name,
  native: l.native,
  tts: l.tts,
  levels: l.levels,
  noSpace: !!l.noSpace,
}));

export function language(code: LangCode): Language {
  const l = languages.find((x) => x.code === code);
  if (!l) throw new Error(`Unknown language: ${code}`);
  return l;
}

const NUMBER = /^\p{N}+([.,:]\p{N}+)*\.?$/u;

/** Parse "surface=lemma surface …" into tokens. A token with no "=" is its own lemma. */
export function parseSentence(lang: LangCode, [text, translation]: RawSentence): Sentence {
  const tokens: Token[] = text.split(" ").map((raw) => {
    // Punctuation and numbers ("1889", "15.") are shown but are not words to learn.
    if (PUNCT.test(raw) || NUMBER.test(raw)) return { surface: raw };
    const [surface, lemma] = raw.split("=") as [string, string | undefined];
    const l = lemma ?? surface;
    return { surface, lemma: l, isName: DICT[lang]?.[l]?.[0] === "name" };
  });
  return translation ? { tokens, translation } : { tokens };
}

export const stories: CatalogStory[] = STORIES.map((s) => ({
  id: s.id,
  lang: s.lang as LangCode,
  title: s.title,
  titleEnglish: s.tt,
  level: s.level,
  topic: s.cat,
  minutes: s.min,
  date: s.date,
  sentences: s.sents.map((raw) => parseSentence(s.lang as LangCode, raw)),
}));

export function storiesFor(lang: LangCode): CatalogStory[] {
  return stories.filter((s) => s.lang === lang);
}

export function lookup(lang: LangCode, lemma: string): DictEntry | undefined {
  const dict = DICT[lang];
  const key = dict?.[lemma] ? lemma : dict?.[lemma.toLowerCase()] ? lemma.toLowerCase() : undefined;
  if (!key || !dict) return undefined;
  const [pos, meaning, reading] = dict[key]!;
  return { lemma: key, display: key.split("#")[0]!, pos, meaning, ...(reading ? { reading } : {}) };
}

/** Every dictionary entry for a language (names left out), for search. */
export function dictionary(lang: LangCode): DictEntry[] {
  return Object.keys(DICT[lang] ?? {}).flatMap((l) => {
    const e = lookup(lang, l);
    return e && e.pos !== "name" ? [e] : [];
  });
}

/** Starter words for the "Some basics" placement choice. */
export function starterWords(lang: LangCode): string[] {
  return SEED[lang] ?? [];
}

/** Rebuild sentence text for display or speech, spacing tokens per language. */
export function sentenceText(lang: LangCode, sentence: Sentence): string {
  const noSpace = language(lang).noSpace;
  return sentence.tokens
    .map((t, i) => (i > 0 && !noSpace && !PUNCT.test(t.surface) ? " " : "") + t.surface)
    .join("");
}

// ── cover photos (Wikimedia Commons, free licenses; see the Credits page) ──
export interface CoverCredit {
  file: string;
  page: string;
  author: string;
  license: string;
}
export const coverCredits = coverIndex as Record<string, CoverCredit>;

/** Seed stories whose cover slug differs from the id suffix. */
const COVER_ALIAS: Record<string, string> = {
  "es-phone": "phone", "es-market": "market", "es-trip": "trip", "ja-train": "crowded", "ko-store": "store", "ko-rain": "rain",
  "ko-work": "work", "it-bus": "bus", "pt-market": "feira", "ru-cat": "sofa", "ru-metro": "metro", "ja-cat": "cat",
  "de-key": "key", "de-bike": "bike", "fr-train": "train",
};

/** Cover photo path for a story, or undefined (the app then draws a topic picture). */
export function coverOf(id: string): string | undefined {
  const slug = COVER_ALIAS[id] ?? id.slice(id.indexOf("-") + 1);
  return coverCredits[slug] ? `/covers/${slug}.jpg` : undefined;
}

export * from "./videos";
