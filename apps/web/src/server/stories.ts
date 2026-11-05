import "server-only";
import { lookup, sentenceText } from "@storyling/content";
import type { LangCode, Sentence, Token } from "@storyling/core";
import type { PublishedStory } from "@storyling/learner";
import { photoKeywords, prepareText, writeDailyStory, type PreparedText } from "./ai";
import { db } from "./db";
import { searchPhotos } from "./photos";

/** Languages learners can see, so the only ones worth writing for. */
export const DAILY_LANGS: LangCode[] = ["de"];
/** Stop writing when this many stories wait for review, so a quiet week doesn't spend AI credits on a pile nobody reads. */
export const MAX_WAITING = 14;

const EASY = ["A1", "A2"];
const HARD = ["B1", "B2", "C1"];
export const TOPICS: Record<string, string> = {
  daily: "everyday life", food: "food and cooking", work: "work and colleagues", weather: "weather and the seasons",
  animals: "animals", travel: "a journey", city: "life in a German city", home: "home and neighbours",
  history: "a moment from German history", people: "family and friendship", nature: "nature and the outdoors",
  science: "a discovery or invention", culture: "German customs and culture",
};

const PUNCT = /^[\p{P}\p{S}]+$/u;
const admins = () => (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
export const adminEmails = admins;
export const isAdminEmail = (email: string) => admins().includes(email.toLowerCase());

/** Two stories a day, one easier and one harder, moving through the levels and topics. */
export function dailyPlan(day: string): { level: string; topic: string }[] {
  const n = Math.floor(Date.parse(day) / 864e5);
  const topics = Object.keys(TOPICS);
  return [
    { level: EASY[n % EASY.length]!, topic: topics[(n * 2) % topics.length]! },
    { level: HARD[n % HARD.length]!, topic: topics[(n * 2 + 1) % topics.length]! },
  ];
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
 * Give photos to waiting stories that have none, so a reviewer sees each one before learners do.
 * Published stories are left alone. Stops at `until` (a timestamp) to stay inside the cron's time limit.
 */
export async function fillCovers(until: number) {
  const sql = await db();
  const rows = (await sql`SELECT id, story FROM daily_stories WHERE status = 'pending' AND story->'cover' IS NULL ORDER BY created_at DESC LIMIT 10`) as { id: string; story: PublishedStory }[];
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

/** Write one story and put it in the review queue. Returns false when that id already exists. */
export async function queueStory(id: string, lang: LangCode, level: string, topic: string, avoid: string[]) {
  const p = await writeDailyStory(lang, level, TOPICS[topic] ?? topic, avoid);
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
  const rows = await sql`INSERT INTO daily_stories (id, lang, story, warnings)
    VALUES (${id}, ${lang}, ${JSON.stringify(story)}::jsonb, ${JSON.stringify(storyWarnings(story))}::jsonb)
    ON CONFLICT (id) DO NOTHING RETURNING id`;
  return rows.length > 0;
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
