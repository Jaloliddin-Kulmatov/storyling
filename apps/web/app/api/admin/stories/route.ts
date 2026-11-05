import type { LangCode } from "@storyling/core";
import type { PublishedStory } from "@storyling/learner";
import { z } from "zod";
import { accountRoute, HttpError } from "@/server/account-route";
import { AiError, aiEnabled } from "@/server/ai";
import type { Account } from "@/server/auth";
import { db } from "@/server/db";
import { applySentenceEdits, DAILY_LANGS, isAdminEmail, queueStory, recentTitles, storyWarnings, TOPICS } from "@/server/stories";

export const maxDuration = 60;

function admin(user: Account | null) {
  if (!user || !isAdminEmail(user.email)) throw new HttpError("Only admins can do this.", 403);
  return user;
}

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

/** GET ?status=pending|published|rejected: stories in that state, plus how many wait for review. */
export const GET = accountRoute(async (user, req) => {
  admin(user);
  const status = new URL(req.url).searchParams.get("status") ?? "pending";
  if (!["pending", "published", "rejected"].includes(status)) throw new HttpError("Unknown status.");
  const sql = await db();
  const rows = await sql`SELECT id, status, story, warnings, created_at FROM daily_stories WHERE status = ${status} ORDER BY created_at DESC LIMIT 60`;
  const [count] = (await sql`SELECT COUNT(*)::int AS n FROM daily_stories WHERE status = 'pending'`) as { n: number }[];
  return { stories: rows, waiting: count!.n, levels: LEVELS, topics: TOPICS };
});

const Write = z.object({ lang: z.string(), level: z.enum(LEVELS as [string, ...string[]]), topic: z.string().refine((t) => t in TOPICS) });

/** POST { lang, level, topic }: write one more story for the queue now. */
export const POST = accountRoute(async (user, req) => {
  admin(user);
  if (!aiEnabled()) throw new HttpError("AI is turned off on this server.", 503);
  const b = Write.safeParse(await req.json().catch(() => null));
  const lang = b.data?.lang as LangCode;
  if (!b.success || !DAILY_LANGS.includes(lang)) throw new HttpError("Choose a level and topic.");
  const id = `${lang}-daily-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}`;
  try {
    await queueStory(id, lang, b.data.level, b.data.topic, await recentTitles(lang));
  } catch (e) {
    if (e instanceof AiError) throw new HttpError(e.message, e.status);
    throw e;
  }
  return { id };
});

const Review = z.object({
  id: z.string().max(80),
  status: z.enum(["pending", "published", "rejected"]).optional(),
  edit: z.object({
    title: z.string().trim().min(1).max(120),
    titleEnglish: z.string().trim().max(120),
    level: z.enum(LEVELS as [string, ...string[]]),
    topic: z.string().refine((t) => t in TOPICS),
    sentences: z.array(z.object({ from: z.number().int(), text: z.string().max(600), tr: z.string().max(600) })).min(1).max(60),
    meanings: z.record(z.string().max(80), z.string().max(200)),
  }).optional(),
});

/** PATCH { id, edit?, status? }: save a reviewer's changes and/or move the story to another state. */
export const PATCH = accountRoute(async (user, req) => {
  const reviewer = admin(user);
  const b = Review.safeParse(await req.json().catch(() => null));
  if (!b.success) throw new HttpError("Check the story: a title and at least one sentence are needed.");
  const { id, edit, status } = b.data;
  const sql = await db();
  const [row] = (await sql`SELECT story FROM daily_stories WHERE id = ${id}`) as { story: PublishedStory }[];
  if (!row) throw new HttpError("That story is gone.", 404);
  let story = row.story;
  if (edit) {
    const { sentences, dict, minutes } = await applySentenceEdits(story, edit.sentences);
    for (const [lemma, meaning] of Object.entries(edit.meanings)) {
      const e = dict[lemma];
      if (e) dict[lemma] = e[2] ? [e[0], meaning, e[2]] : [e[0], meaning];
    }
    story = { ...story, title: edit.title, titleEnglish: edit.titleEnglish, level: edit.level, topic: edit.topic, sentences, dict, minutes };
    await sql`UPDATE daily_stories SET story = ${JSON.stringify(story)}::jsonb, warnings = ${JSON.stringify(storyWarnings(story))}::jsonb WHERE id = ${id}`;
  }
  if (status) {
    await sql`UPDATE daily_stories SET status = ${status}, reviewed_by = ${reviewer.email},
      published_at = CASE WHEN ${status} = 'published' THEN now() ELSE NULL END WHERE id = ${id}`;
  }
  return { story, warnings: storyWarnings(story) };
});
