import { NextResponse } from "next/server";
import { getSettings } from "@/server/admin";
import { aiEnabled } from "@/server/ai";
import { writeDailyStories } from "@/server/daily";
import { dbEnabled } from "@/server/db";

export const maxDuration = 60;

/** Daily (vercel.json cron): write the day's stories into the review queue. Nothing here reaches learners; an admin publishes from /de/admin. */
export async function GET(req: Request) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!dbEnabled() || !aiEnabled()) return NextResponse.json({ written: 0, reason: "Database or AI is not configured." });
  if ((await getSettings()).dailyOff) return NextResponse.json({ written: 0, reason: "Turned off in the admin panel." });
  const out = await writeDailyStories();
  return NextResponse.json(out, { status: out.errors.length && !out.written.length ? 502 : 200 });
}
