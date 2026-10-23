import { db } from "@/server/db";
import { accountRoute, HttpError } from "@/server/account-route";

const MAX = 4_000_000;

export const GET = accountRoute(async (user) => {
  const sql = await db();
  const rows = (await sql`SELECT data, updated_at FROM sync WHERE user_id = ${user!.id}`) as { data: unknown; updated_at: string }[];
  return { data: rows[0] ? JSON.stringify(rows[0].data) : null, updatedAt: rows[0]?.updated_at ?? null };
});

/** Save the learner's store and today's points. The client sends the merged store, so this just overwrites. */
export const PUT = accountRoute(async (user, req) => {
  const text = await req.text();
  if (text.length > MAX) throw new HttpError("Your data is too large to sync.", 413);
  const b = JSON.parse(text) as { data?: string; points?: Record<string, number> };
  if (typeof b.data !== "string") throw new HttpError("Missing data.");
  JSON.parse(b.data); // must be valid JSON
  const sql = await db();
  await sql`INSERT INTO sync (user_id, data, updated_at) VALUES (${user!.id}, ${b.data}::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
  const cutoff = Date.now() - 45 * 864e5;
  for (const [day, p] of Object.entries(b.points ?? {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(p) || Date.parse(day) < cutoff) continue;
    // A day can only go up, and one day can't be worth more than a person could plausibly earn.
    const pts = Math.min(Math.max(0, Math.round(p)), 3000);
    await sql`INSERT INTO points (user_id, day, points) VALUES (${user!.id}, ${day}, ${pts})
      ON CONFLICT (user_id, day) DO UPDATE SET points = GREATEST(points.points, EXCLUDED.points)`;
  }
  return { ok: true };
});
