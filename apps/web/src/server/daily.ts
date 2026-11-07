import "server-only";
import type { LangCode } from "@storyling/core";
import { db } from "./db";
import { mailEnabled, sendMail } from "./mail";
import { adminEmails, dailyPlan, fillCovers, levelSlug, MAX_WAITING, queueStory, recentTitles } from "./stories";

/** Write the day's stories into the review queue. Ids include the date, so a second run only fills in what failed. */
export async function writeDailyStories() {
  const started = Date.now();
  const day = new Date().toISOString().slice(0, 10);
  const sql = await db();
  const written: string[] = [];
  const errors: string[] = [];
  const avoid: Partial<Record<LangCode, string[]>> = {};
  for (const { lang, level, topic } of dailyPlan(day)) {
    // The function stops at 60 seconds; what's left waits for the retry run.
    if (Date.now() - started > 40_000) break;
    const id = `${lang}-daily-${day}-${levelSlug(level)}`;
    const [row] = (await sql`SELECT COUNT(*)::int AS n FROM daily_stories WHERE lang = ${lang} AND status = 'pending'`) as { n: number }[];
    if (row!.n >= MAX_WAITING) continue;
    const seen = await sql`SELECT 1 FROM daily_stories WHERE id = ${id}`;
    if (seen.length) continue;
    try {
      if (await queueStory(id, lang, level, topic, (avoid[lang] ??= await recentTitles(lang)))) written.push(id);
    } catch (e) {
      console.error(e);
      errors.push(`${id}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  if (written.length && mailEnabled()) {
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storyling.vercel.app";
    for (const to of adminEmails()) await sendMail(to, `${written.length} new stories to review`, `Read and publish them here:\n${site}/de/admin`);
  }
  const covers = await fillCovers(started + 45_000);
  return { written, errors, covers };
}
