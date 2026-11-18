import { storiesFor } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import type { PublishedStory } from "@storyling/learner";
import { partsOf } from "@/lib/parts";
import { db, dbEnabled } from "@/server/db";
import { aiEnabled, languageName, pictureScene } from "@/server/ai";
import { makePicture, picturePrompt, seedOf } from "@/server/pictures";

export const maxDuration = 60;

// Made once, then kept by Vercel's CDN and browsers. A failure isn't kept, so the next visit tries again.
const KEEP = { "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable" };
const NO_STORE = { "Cache-Control": "no-store" };

async function findStory(lang: LangCode, id: string) {
  const built = storiesFor(lang).find((s) => s.id === id);
  if (built) return built;
  if (!id.includes("-daily-") || !dbEnabled()) return undefined;
  const sql = await db();
  const [row] = (await sql`SELECT story FROM daily_stories WHERE id = ${id} AND lang = ${lang} AND status = 'published'`) as { story: PublishedStory }[];
  return row?.story;
}

/** GET ?lang=de&id=…&part=0: the AI picture for one part of a built-in or published story. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") ?? "";
  const id = url.searchParams.get("id") ?? "";
  const part = Number(url.searchParams.get("part"));
  if (!/^[a-z]{2}$/.test(lang) || !id || !Number.isInteger(part)) return new Response("Bad request", { status: 400, headers: NO_STORE });
  const story = await findStory(lang as LangCode, id).catch(() => undefined);
  const range = story && partsOf(story.sentences.length)[part];
  if (!story || !range) return new Response("Not found", { status: 404, headers: NO_STORE });
  const title = story.titleEnglish || story.title;
  const text = story.sentences.slice(range[0], range[1]).map((s) => s.translation ?? "").join(" ");
  // A short scene from the AI draws far better than the raw sentences; the sentences are the fallback.
  const scene = aiEnabled() ? await pictureScene(title, text, `a place where ${languageName(lang)} is spoken`).catch(() => "") : "";
  const prompt = picturePrompt(id, scene || `A scene from the story "${title}": ${text}`);
  try {
    // A different seed for each part, so the pictures of one story differ.
    const pic = await makePicture(prompt, seedOf(`${id}#${part}`));
    return new Response(pic.bytes, { headers: { ...KEEP, "Content-Type": pic.type, "X-Picture-By": pic.by } });
  } catch (e) {
    console.error(e);
    return new Response("No picture right now", { status: 503, headers: { ...NO_STORE, "Retry-After": "45" } });
  }
}
