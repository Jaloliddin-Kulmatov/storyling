import "server-only";
import type { LangCode } from "@storyling/core";
import { getSettings } from "./admin";
import { AiError, lastAiModel } from "./ai";
import { db } from "./db";
import { mailEnabled, sendMail } from "./mail";
import { adminEmails, dailyPlan, fillCovers, recentTitles, writeAndPost } from "./stories";

// The function stops at 300 seconds. Whatever's left waits for the next run, an hour later.
const WRITE_FOR = 240_000;
const COVERS_UNTIL = 270_000;

/** Write and post what's still missing from today's plan. Ids include the date, so a run only fills the gaps. */
export async function writeDailyStories() {
  const started = Date.now();
  const day = new Date().toISOString().slice(0, 10);
  const sql = await db();
  const { hiddenLangs } = await getSettings();
  const done = new Set(((await sql`SELECT id FROM daily_stories WHERE id LIKE ${`%-daily-${day}-%`}`) as { id: string }[]).map((r) => r.id));
  const todo = dailyPlan(day).filter((s) => !done.has(s.id) && !hiddenLangs.includes(s.lang));
  const published: string[] = [];
  const held: string[] = [];
  const errors: string[] = [];
  const avoid: Partial<Record<LangCode, string[]>> = {};
  for (const { id, lang, level, topic } of todo) {
    if (Date.now() - started > WRITE_FOR) break;
    try {
      const titles = (avoid[lang] ??= await recentTitles(lang));
      ((await writeAndPost(id, lang, level, topic, titles)) === "published" ? published : held).push(id);
    } catch (e) {
      console.error(e);
      errors.push(`${id}: ${e instanceof Error ? e.message : "failed"}`);
      // Every model is at its limit: more tries now would only fail too.
      if (e instanceof AiError && e.status === 429) break;
    }
  }
  if (held.length && mailEnabled()) {
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storyling.vercel.app";
    for (const to of adminEmails()) await sendMail(to, `${held.length} stories failed the checks`, `They were not posted. Read them here:\n${site}/de/admin`);
  }
  const covers = await fillCovers(started + COVERS_UNTIL);
  return { published, held, errors, left: todo.length - published.length - held.length, covers, model: lastAiModel(), seconds: Math.round((Date.now() - started) / 1000) };
}
