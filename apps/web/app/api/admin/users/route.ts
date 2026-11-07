import { z } from "zod";
import { accountRoute, HttpError } from "@/server/account-route";
import { requireAdmin } from "@/server/admin";
import { billingDb } from "@/server/billing";
import { isAdminEmail } from "@/server/stories";

const PAGE = 30;

/** GET ?q=&offset=: accounts, newest first, without anything secret. */
export const GET = accountRoute(async (user, req) => {
  requireAdmin(user);
  const params = new URL(req.url).searchParams;
  const q = `%${(params.get("q") ?? "").trim().toLowerCase().replace(/[%_\\]/g, "\\$&")}%`;
  const offset = Math.max(0, Number(params.get("offset")) || 0);
  const sql = await billingDb();
  const rows = (await sql`
    SELECT u.id, u.email, u.name, u.created_at, u.pro_until,
      COALESCE(SUM(p.points), 0)::int AS points, MAX(p.day) AS last_active
    FROM users u LEFT JOIN points p ON p.user_id = u.id
    WHERE lower(u.email) LIKE ${q} OR lower(u.name) LIKE ${q}
    GROUP BY u.id ORDER BY u.created_at DESC LIMIT ${PAGE + 1} OFFSET ${offset}`) as { email: string }[];
  return { users: rows.slice(0, PAGE).map((r) => ({ ...r, admin: isAdminEmail(r.email) })), more: rows.length > PAGE };
});

const Pro = z.object({ id: z.string().uuid(), days: z.number().int().min(0).max(3650) });

/** PATCH { id, days }: give Pro for that many days from now, or take it away with 0. */
export const PATCH = accountRoute(async (user, req) => {
  requireAdmin(user);
  const b = Pro.safeParse(await req.json().catch(() => null));
  if (!b.success) throw new HttpError("Unknown account.");
  const sql = await billingDb();
  const until = b.data.days ? new Date(Date.now() + b.data.days * 864e5).toISOString() : null;
  await sql`UPDATE users SET pro_until = ${until} WHERE id = ${b.data.id}`;
  return { pro_until: until };
});

/** DELETE { id }: remove an account and everything saved with it. Admin accounts can't be deleted here. */
export const DELETE = accountRoute(async (user, req) => {
  requireAdmin(user);
  const b = z.object({ id: z.string().uuid() }).safeParse(await req.json().catch(() => null));
  if (!b.success) throw new HttpError("Unknown account.");
  const sql = await billingDb();
  const [row] = (await sql`SELECT email FROM users WHERE id = ${b.data.id}`) as { email: string }[];
  if (!row) throw new HttpError("That account is gone.", 404);
  if (isAdminEmail(row.email)) throw new HttpError("Admin accounts can't be deleted here.");
  await sql`DELETE FROM users WHERE id = ${b.data.id}`;
  return { ok: true };
});
