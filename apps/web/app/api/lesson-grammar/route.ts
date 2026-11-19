import { sentenceText, storiesFor } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { NextResponse } from "next/server";
import { aiEnabled, lessonGrammar } from "@/server/ai";

export const maxDuration = 30;

/** GET ?lang=ko&id=ko-park: the grammar note for a path lesson. Written once by AI, then kept by the CDN. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const lang = (url.searchParams.get("lang") ?? "") as LangCode;
  const id = url.searchParams.get("id") ?? "";
  const story = /^[a-z]{2}$/.test(lang) ? storiesFor(lang).find((s) => s.id === id) : undefined;
  if (!story) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!aiEnabled()) return NextResponse.json({ error: "AI is off" }, { status: 503 });
  try {
    const note = await lessonGrammar(lang, story.level, story.sentences.map((s) => sentenceText(lang, s)).join("\n"));
    return NextResponse.json(note, { headers: { "Cache-Control": "public, s-maxage=31536000, immutable" } });
  } catch {
    return NextResponse.json({ error: "Try again later" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
