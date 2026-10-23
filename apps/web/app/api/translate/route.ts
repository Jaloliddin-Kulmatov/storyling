import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { AiError, aiEnabled, checkLimit, TARGET_LANGUAGES, translateLines } from "@/server/ai";
import { db, dbEnabled } from "@/server/db";

const keyOf = (target: string, src: string) => `${target}:${createHash("sha1").update(src).digest("hex")}`;

/**
 * Translate short English texts (sentence translations, word meanings) into the learner's language.
 * Results are shared through the database when there is one, so each text is translated once for everyone.
 */
export async function POST(req: NextRequest) {
  try {
    const b = (await req.json().catch(() => ({}))) as { target?: unknown; texts?: unknown };
    const target = typeof b.target === "string" ? b.target : "";
    const texts = b.texts;
    if (!TARGET_LANGUAGES[target] || target === "en") throw new AiError("Unknown language.", 400);
    if (!Array.isArray(texts) || !texts.length || texts.length > 40 || texts.some((t) => typeof t !== "string" || !t || t.length > 300))
      throw new AiError("Send 1 to 40 texts of at most 300 characters.", 400);
    const src = texts as string[];
    const out: (string | null)[] = src.map(() => null);

    if (dbEnabled()) {
      const sql = await db();
      const keys = src.map((t) => keyOf(target, t));
      const rows = (await sql`SELECT key, out FROM translations WHERE key = ANY(${keys})`) as { key: string; out: string }[];
      const have = new Map(rows.map((r) => [r.key, r.out]));
      keys.forEach((k, i) => (out[i] = have.get(k) ?? null));
    }

    const miss = out.map((o, i) => (o === null ? i : -1)).filter((i) => i >= 0);
    if (miss.length) {
      if (!aiEnabled()) throw new AiError("Translation is turned off on this server.", 503);
      checkLimit(req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local");
      const done = await translateLines("en", target, miss.map((i) => src[i]!));
      miss.forEach((i, j) => (out[i] = done[j]!));
      if (dbEnabled()) {
        const sql = await db();
        await Promise.all(miss.map((i, j) => sql`INSERT INTO translations (key, target, src, out) VALUES (${keyOf(target, src[i]!)}, ${target}, ${src[i]!}, ${done[j]!}) ON CONFLICT (key) DO NOTHING`));
      }
    }
    return NextResponse.json({ texts: out });
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError("Translation failed.", 500);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
