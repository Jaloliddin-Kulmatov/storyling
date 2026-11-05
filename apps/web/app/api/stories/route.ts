import { NextResponse } from "next/server";
import { db, dbEnabled } from "@/server/db";

const LATEST = 120;
const HEADERS = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300", "Access-Control-Allow-Origin": "*" };

/** GET ?lang=de: the newest approved stories. GET ?lang=de&id=…: one approved story. Nothing else leaves the review queue. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") ?? "";
  const id = url.searchParams.get("id");
  if (!dbEnabled() || !/^[a-z]{2}$/.test(lang)) return NextResponse.json({ stories: [] }, { headers: HEADERS });
  try {
    const sql = await db();
    const rows = (id
      ? await sql`SELECT story, published_at FROM daily_stories WHERE id = ${id} AND lang = ${lang} AND status = 'published'`
      : await sql`SELECT story, published_at FROM daily_stories WHERE lang = ${lang} AND status = 'published' ORDER BY published_at DESC LIMIT ${LATEST}`) as { story: object; published_at: string }[];
    return NextResponse.json({ stories: rows.map((r) => ({ ...r.story, publishedAt: new Date(r.published_at).getTime() })) }, { headers: HEADERS });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ stories: [] });
  }
}
