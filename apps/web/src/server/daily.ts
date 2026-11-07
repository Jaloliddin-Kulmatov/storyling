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
const MINUTE_LIMIT_PAUSE = 62_000;

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
  let waited = false;
  for (let i = 0; i < todo.length && Date.now() - started < WRITE_FOR; i++) {
    const { id, lang, level, topic } = todo[i]!;
    try {
      const titles = (avoid[lang] ??= await recentTitles(lang));
      ((await writeAndPost(id, lang, level, topic, titles)) === "published" ? published : held).push(id);
      waited = false;
    } catch (e) {
      console.error(e);
      const busy = e instanceof AiError && e.status === 429;
      // The limit per minute clears after a pause. Still busy after one means the day's limit, so stop.
      if (busy && !waited) {
        waited = true;
        i--;
        await new Promise((r) => setTimeout(r, MINUTE_LIMIT_PAUSE));
        continue;
      }
      errors.push(`${id}: ${e instanceof Error ? e.message : "failed"}`);
      if (busy) break;
    }
  }
  if (held.length && mailEnabled()) {
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storyling.vercel.app";
    for (const to of adminEmails()) await sendMail(to, `${held.length} stories failed the checks`, `They were not posted. Read them here:\n${site}/de/admin`);
  }
  const covers = await fillCovers(started + COVERS_UNTIL);
  return { published, held, errors, left: todo.length - published.length - held.length, covers, model: lastAiModel(), seconds: Math.round((Date.now() - started) / 1000) };
}
