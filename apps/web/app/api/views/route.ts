import { NextResponse } from "next/server";
import { db, dbEnabled } from "@/server/db";
import { accountRoute, HttpError } from "@/server/account-route";

const ID = /^[a-z]{2}-[a-z0-9-]{1,60}$/;

/** How many times each story has been opened, shown as reading counts in the library. */
const getViews = accountRoute(async () => {
  const sql = await db();
  const rows = (await sql`SELECT story_id, views FROM story_views ORDER BY views DESC LIMIT 1000`) as { story_id: string; views: number }[];
  return { views: Object.fromEntries(rows.map((r) => [r.story_id, r.views])) };
}, { auth: false });

const addView = accountRoute(async (_u, req) => {
  const b = (await req.json().catch(() => ({}))) as { id?: unknown };
  if (typeof b.id !== "string" || !ID.test(b.id)) throw new HttpError("Unknown story.");
  const sql = await db();
  await sql`INSERT INTO story_views (story_id, views) VALUES (${b.id}, 1) ON CONFLICT (story_id) DO UPDATE SET views = story_views.views + 1`;
  return { ok: true };
}, { auth: false });

// Without a database there are no counts: answer quietly instead of with an error.
export const GET = (req: Request) => (dbEnabled() ? getViews(req) : NextResponse.json({ views: {} }));
export const POST = (req: Request) => (dbEnabled() ? addView(req) : NextResponse.json({ ok: false }));
