import "server-only";
import { language, languages, lookup, sentenceText } from "@storyling/content";
import type { LangCode, Sentence, Token } from "@storyling/core";
import type { PublishedStory } from "@storyling/learner";
import { glossFor, photoKeywords, prepareText, translateLines, writeDailyStory, writeFactStory, type PreparedText } from "./ai";
import { factFor, type Fact } from "./facts";
import { db } from "./db";
import { searchPhotos } from "./photos";

/** Languages learners can see, so the only ones worth writing for. */
export const DAILY_LANGS: LangCode[] = languages.map((l) => l.code);
/** Stories per language per day. */
export const DAILY_PER_LANG = 4;

export const TOPICS: Record<string, string> = {
  daily: "everyday life", food: "food and cooking", work: "work and colleagues", weather: "weather and the seasons",
  animals: "animals", travel: "a journey", city: "life in a big city", home: "home and neighbours",
  history: "a moment from history", people: "family and friendship", nature: "nature and the outdoors",
  science: "a discovery or invention", culture: "local customs and culture", facts: "a true and surprising fact",
};

const PUNCT = /^[\p{P}\p{S}]+$/u;
const admins = () => (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
export const adminEmails = admins;
export const isAdminEmail = (email: string) => admins().includes(email.toLowerCase());

/** Short form of a level for story ids: "HSK 1" → "hsk1". */
export const levelSlug = (level: string) => level.toLowerCase().replace(/\s+/g, "");

/**
 * Today's stories: four per language, across its levels and topics. Every language gets its first story before any
 * gets its second, so a day when the AI runs out of quota is shared evenly.
 */
export function dailyPlan(day: string): { id: string; lang: LangCode; level: string; topic: string; fact?: Fact }[] {
  const n = Math.floor(Date.parse(day) / 864e5);
  const topics = Object.keys(TOPICS);
  return Array.from({ length: DAILY_PER_LANG }, (_, slot) =>
    DAILY_LANGS.map((lang, i) => {
      const levels = language(lang).levels;
      const level = levels[(n + slot) % levels.length]!;
      // The last story of the day retells a true fact from our list instead of making one up.
      if (slot === DAILY_PER_LANG - 1) return { id: `${lang}-daily-${day}-${slot + 1}-${levelSlug(level)}`, lang, level, topic: "facts", fact: factFor(lang, n, i) };
      return { id: `${lang}-daily-${day}-${slot + 1}-${levelSlug(level)}`, lang, level, topic: topics[(n * DAILY_PER_LANG + slot * 3 + i) % topics.length]! };
    }),
  ).flat();
}

const minutesFor = (s: Sentence[]) => Math.max(1, Math.round(s.reduce((n, x) => n + x.tokens.filter((t) => t.lemma).length, 0) / 80));

function tokensOf(p: PreparedText, dict: PublishedStory["dict"]) {
  return p.sentences.map((s): Sentence => ({
    tokens: s.tokens
      .filter((t) => t.s)
      .map((t): Token => (!t.l || PUNCT.test(t.s) ? { surface: t.s } : { surface: t.s, lemma: t.l, isName: /name|proper/i.test(dict[t.l]?.[0] ?? "") })),
    translation: s.tr,
  }));
}

function glossary(p: PreparedText): PublishedStory["dict"] {
  const dict: PublishedStory["dict"] = {};
  for (const g of p.glossary) dict[g.lemma] = g.reading ? [g.pos, g.meaning, g.reading] : [g.pos, g.meaning];
  return dict;
}

/** Things a reviewer should look at. They don't block publishing. */
export function storyWarnings(s: PublishedStory): string[] {
  const out: string[] = [];
  if (s.sentences.length < 6) out.push(`Only ${s.sentences.length} sentences.`);
  const untranslated = s.sentences.filter((x) => !x.translation?.trim()).length;
  if (untranslated) out.push(`${untranslated} sentence${untranslated > 1 ? "s have" : " has"} no translation.`);
  const missing = new Set<string>();
  for (const x of s.sentences) for (const t of x.tokens) if (t.lemma && !s.dict[t.lemma] && !lookup(s.lang, t.lemma)) missing.add(t.lemma);
  if (missing.size) out.push(`No meaning for: ${[...missing].slice(0, 12).join(", ")}${missing.size > 12 ? "…" : ""}`);
  if (!s.titleEnglish.trim()) out.push("No English title.");
  if (!s.cover) out.push("No picture yet.");
  return out;
}

const SCRIPTS: Partial<Record<LangCode, RegExp>> = { zh: /\p{Script=Han}/u, ja: /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u, ko: /\p{Script=Hangul}/u, ru: /\p{Script=Cyrillic}/u };

/** What keeps a story from going straight to learners. It waits in Review stories instead. */
export function publishProblems(s: PublishedStory): string[] {
  const out: string[] = [];
  if (s.sentences.length < 6) out.push("Too short.");
  if (!s.title.trim() || !s.titleEnglish.trim()) out.push("No title.");
  if (s.sentences.some((x) => !x.translation?.trim())) out.push("A sentence has no translation.");
  const words = s.sentences.flatMap((x) => x.tokens.filter((t) => t.lemma));
  const unknown = words.filter((t) => !s.dict[t.lemma!] && !lookup(s.lang, t.lemma!)).length;
  if (unknown > words.length * 0.05) out.push("Too many words have no meaning.");
  const script = SCRIPTS[s.lang];
  if (script && words.filter((t) => script.test(t.surface)).length < words.length * 0.8) out.push("Not written in the right language.");
  return out;
}

/**
 * Fix what can be fixed without a person: ask the AI for meanings the glossary left out and for missing translations,
 * then make any word that still has no meaning plain text, so no tap ever shows an empty card. Returns the fixed story
 * and what still stops it from being posted.
 */
export async function selfCheck(input: PublishedStory): Promise<{ story: PublishedStory; problems: string[] }> {
  const story: PublishedStory = { ...input, dict: { ...input.dict }, sentences: input.sentences.map((s) => ({ ...s, tokens: [...s.tokens] })) };
  const known = (l: string) => !!story.dict[l] || !!lookup(story.lang, l);
  const missing = [...new Set(story.sentences.flatMap((s) => s.tokens.flatMap((t) => (t.lemma && !known(t.lemma) ? [t.lemma] : []))))];
  if (missing.length) {
    const text = story.sentences.map((s) => sentenceText(story.lang, s)).join(" ");
    const found = await glossFor(story.lang, missing.slice(0, 40), text).catch(() => []);
    for (const g of found) if (missing.includes(g.lemma)) story.dict[g.lemma] = g.reading ? [g.pos, g.meaning, g.reading] : [g.pos, g.meaning];
    story.sentences = story.sentences.map((s) => ({ ...s, tokens: s.tokens.map((t) => (t.lemma && !known(t.lemma) ? { surface: t.surface } : t)) }));
  }
  const untranslated = story.sentences.map((s, i) => (s.translation?.trim() ? -1 : i)).filter((i) => i >= 0);
  if (untranslated.length) {
    const lines = await translateLines(story.lang, "en", untranslated.map((i) => sentenceText(story.lang, story.sentences[i]!))).catch(() => []);
    lines.forEach((tr, k) => { if (tr.trim()) story.sentences[untranslated[k]!]!.translation = tr.trim(); });
  }
  return { story, problems: publishProblems(story) };
}

/** Search words for a story's photo, falling back to its topic if the AI is unavailable. */
export async function photoQuery(s: PublishedStory) {
  const words = await photoKeywords(s.titleEnglish || s.title, s.sentences.slice(0, 2).map((x) => x.translation).join(" ")).catch(() => "");
  return words || (TOPICS[s.topic] ?? s.topic);
}

/** A photo for a story: varied among the best few, so stories on the same subject don't all look alike. */
async function pickCover(s: PublishedStory) {
  const query = await photoQuery(s);
  const photos = await searchPhotos(query).catch(() => []);
  return photos[Math.floor(Math.random() * Math.min(photos.length, 5))];
}

/**
 * Give photos to stories from the last few days that have none, when the photo search failed as they were written.
 * Stops at `until` (a timestamp) to stay inside the cron's time limit.
 */
export async function fillCovers(until: number) {
  const sql = await db();
  const rows = (await sql`SELECT id, story FROM daily_stories WHERE status IN ('pending', 'published') AND story->'cover' IS NULL AND created_at > now() - interval '3 days' ORDER BY created_at DESC LIMIT 10`) as { id: string; story: PublishedStory }[];
  let filled = 0;
  for (const r of rows) {
    if (Date.now() > until) break;
    const cover = await pickCover(r.story);
    if (!cover) continue;
    await sql`UPDATE daily_stories SET story = story || ${JSON.stringify({ cover })}::jsonb WHERE id = ${r.id}`;
    filled++;
  }
  return filled;
}

/**
 * Write one story, let it check and fix itself, and post it. A story that still fails is thrown away, so the next run
 * writes that slot again. Returns the problems, or none when it was posted.
 */
export async function writeAndPost(id: string, lang: LangCode, level: string, topic: string, avoid: string[], fact?: Fact): Promise<string[]> {
  const p = fact ? await writeFactStory(lang, level, fact.fact) : await writeDailyStory(lang, level, TOPICS[topic] ?? topic, avoid);
  const dict = glossary(p);
  const sentences = tokensOf(p, dict);
  const story: PublishedStory = {
    id, lang, title: p.title, titleEnglish: p.titleEnglish, level, topic,
    minutes: minutesFor(sentences),
    date: new Date().toLocaleDateString("en", { month: "short", day: "numeric" }),
    sentences, dict, publishedAt: 0,
  };
  const cover = await pickCover(story);
  if (cover) story.cover = cover;
  const sql = await db();
  const checked = await selfCheck(story);
  if (checked.problems.length) return checked.problems;
  await sql`INSERT INTO daily_stories (id, lang, status, story, warnings, published_at, reviewed_by)
    VALUES (${id}, ${lang}, 'published', ${JSON.stringify(checked.story)}::jsonb, ${JSON.stringify(storyWarnings(checked.story))}::jsonb, now(), 'auto-check')
    ON CONFLICT (id) DO NOTHING`;
  return [];
}

/** Stories still waiting from before: fix and post each one that passes now; the rest go to Rejected. */
export async function clearWaiting(until: number) {
  const sql = await db();
  const rows = (await sql`SELECT id, story FROM daily_stories WHERE status = 'pending' ORDER BY created_at LIMIT 12`) as { id: string; story: PublishedStory }[];
  let posted = 0, rejected = 0;
  for (const r of rows) {
    if (Date.now() > until) break;
    const { story, problems } = await selfCheck(r.story);
    const status = problems.length ? "rejected" : "published";
    await sql`UPDATE daily_stories SET story = ${JSON.stringify(story)}::jsonb, warnings = ${JSON.stringify(problems.length ? problems : storyWarnings(story))}::jsonb,
      status = ${status}, reviewed_by = 'auto-check', published_at = ${problems.length ? null : new Date().toISOString()} WHERE id = ${r.id} AND status = 'pending'`;
    if (problems.length) rejected++;
    else posted++;
  }
  return { posted, rejected };
}

export const recentTitles = async (lang: LangCode) => {
  const sql = await db();
  const rows = (await sql`SELECT story->>'title' AS title FROM daily_stories WHERE lang = ${lang} ORDER BY created_at DESC LIMIT 30`) as { title: string }[];
  return rows.map((r) => r.title);
};

export interface SentenceEdit {
  /** Which sentence this was, or -1 for a new one. */
  from: number;
  text: string;
  tr: string;
}

/** Sentences after a review. Changed text gets fresh words and lemmas from the AI, or a plain split if the AI is unavailable. */
export async function applySentenceEdits(story: PublishedStory, edits: SentenceEdit[]) {
  const dict = { ...story.dict };
  const lemmaOf = new Map(story.sentences.flatMap((s) => s.tokens.flatMap((t) => (t.lemma ? [[t.surface, t.lemma] as const] : []))));
  const sentences = await Promise.all(
    edits.filter((e) => e.text.trim()).map(async (e): Promise<Sentence> => {
      const old = story.sentences[e.from];
      if (old && sentenceText(story.lang, old) === e.text.trim()) return { ...old, translation: e.tr };
      let tokens: Token[];
      try {
        const p = await prepareText(story.lang, e.text.trim());
        const fresh = glossary(p);
        for (const [k, v] of Object.entries(fresh)) dict[k] ??= v;
        tokens = tokensOf(p, dict).flatMap((s) => s.tokens);
      } catch {
        tokens = (e.text.match(/[\p{L}\p{N}'’-]+|[^\s]/gu) ?? []).map((w) => (PUNCT.test(w) ? { surface: w } : { surface: w, lemma: lemmaOf.get(w) ?? w }));
      }
      return { tokens, translation: e.tr };
    }),
  );
  return { sentences, dict, minutes: minutesFor(sentences) };
}
