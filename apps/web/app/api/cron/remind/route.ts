import { NextResponse } from "next/server";
import { db, dbEnabled } from "@/server/db";

/**
 * Daily (vercel.json cron): email learners who turned reminders on and have not practised today.
 * Needs RESEND_API_KEY and REMIND_FROM (e.g. "Storyling <hello@your-domain>"); Vercel sends CRON_SECRET as a bearer token.
 */
export async function GET(req: Request) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = process.env.RESEND_API_KEY;
  const from = process.env.REMIND_FROM;
  if (!dbEnabled() || !key || !from) return NextResponse.json({ sent: 0, reason: "Email reminders are not configured." });
  const sql = await db();
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS remind boolean NOT NULL DEFAULT false`;
  const users = (await sql`
    SELECT u.email, u.name,
      (SELECT COUNT(*)::int FROM points p WHERE p.user_id = u.id AND p.day >= current_date - 30) AS active
    FROM users u
    WHERE u.remind AND NOT EXISTS (SELECT 1 FROM points p WHERE p.user_id = u.id AND p.day = current_date)
    LIMIT 500`) as { email: string; name: string; active: number }[];
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storyling.vercel.app";
  let sent = 0;
  for (const u of users) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: u.email,
        subject: "Your 10 minutes of German 📚",
        text: `Hi ${u.name},\n\nYou haven't read today yet. One short story keeps your streak going:\n${site}/de\n\nTurn these emails off on the Me page: ${site}/de/progress`,
      }),
    });
    if (res.ok) sent++;
  }
  return NextResponse.json({ sent, candidates: users.length });
}
