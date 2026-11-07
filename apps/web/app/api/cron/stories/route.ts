import { NextResponse } from "next/server";
import { getSettings } from "@/server/admin";
import { aiEnabled } from "@/server/ai";
import { writeDailyStories } from "@/server/daily";
import { dbEnabled } from "@/server/db";

export const maxDuration = 300;

/** Ten runs each morning (vercel.json): write and post what's left of the day's stories. One that fails the checks waits in /de/admin. */
export async function GET(req: Request) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!dbEnabled() || !aiEnabled()) return NextResponse.json({ published: 0, reason: "Database or AI is not configured." });
  if ((await getSettings()).dailyOff) return NextResponse.json({ published: 0, reason: "Turned off in the admin panel." });
  const out = await writeDailyStories();
  return NextResponse.json(out, { status: out.errors.length && !out.published.length ? 502 : 200 });
}
