import { checkPassword, startSession } from "@/server/auth";
import { db } from "@/server/db";
import { accountRoute, HttpError } from "@/server/account-route";

export const POST = accountRoute(async (_u, req) => {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = String(b.email ?? "").trim().toLowerCase();
  const sql = await db();
  const rows = (await sql`SELECT id, email, name, pass_hash FROM users WHERE email = ${email}`) as { id: string; email: string; name: string; pass_hash: string }[];
  const u = rows[0];
  if (!u || !(await checkPassword(String(b.password ?? ""), u.pass_hash))) throw new HttpError("Wrong email or password.", 401);
  await startSession(u.id);
  return { user: { id: u.id, email: u.email, name: u.name } };
}, { auth: false });
