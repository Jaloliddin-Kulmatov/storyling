import { hashPassword, startSession } from "@/server/auth";
import { db } from "@/server/db";
import { accountRoute, HttpError } from "@/server/account-route";

export const POST = accountRoute(async (_u, req) => {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = String(b.email ?? "").trim().toLowerCase();
  const name = String(b.name ?? "").trim().slice(0, 40) || email.split("@")[0]!;
  const password = String(b.password ?? "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) throw new HttpError("Enter a valid email address.");
  if (password.length < 8 || password.length > 200) throw new HttpError("Use a password of at least 8 characters.");
  const sql = await db();
  const rows = (await sql`INSERT INTO users (email, name, pass_hash) VALUES (${email}, ${name}, ${await hashPassword(password)})
    ON CONFLICT (email) DO NOTHING RETURNING id`) as { id: string }[];
  if (!rows[0]) throw new HttpError("An account with this email already exists. Sign in instead.", 409);
  await startSession(rows[0].id);
  return { user: { id: rows[0].id, email, name } };
}, { auth: false });
