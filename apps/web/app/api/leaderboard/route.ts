import { db } from "@/server/db";
import { accountRoute } from "@/server/account-route";

const RANGE: Record<string, number> = { day: 1, week: 7, month: 30 };

export const GET = accountRoute(async (user, req) => {
  const r = new URL(req.url).searchParams.get("range") ?? "week";
  const days = RANGE[r] ?? 7;
  const sql = await db();
  const rows = (await sql`
    SELECT u.id, u.name, SUM(p.points)::int AS points
    FROM points p JOIN users u ON u.id = p.user_id
    WHERE p.day > (current_date - ${days}::int)
    GROUP BY u.id, u.name
    ORDER BY points DESC, u.name
    LIMIT 50`) as { id: string; name: string; points: number }[];
  return { range: r, me: user?.id ?? null, rows: rows.map((x, i) => ({ rank: i + 1, name: x.name, points: x.points, me: x.id === user?.id })) };
}, { auth: false });
