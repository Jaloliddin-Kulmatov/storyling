import { createHash, randomBytes } from "node:crypto";
import { db } from "@/server/db";
import { accountRoute, HttpError } from "@/server/account-route";
import { mailEnabled, sendMail } from "@/server/mail";

/** POST { email }: email a one-hour reset link. Always answers the same way, whether or not the account exists. */
export const POST = accountRoute(async (_u, req) => {
  if (!mailEnabled()) throw new HttpError("Password reset by email isn't set up on this site yet.", 503);
  const { email: raw } = (await req.json().catch(() => ({}))) as { email?: unknown };
  const email = String(raw ?? "").trim().toLowerCase();
  const sql = await db();
  await sql`CREATE TABLE IF NOT EXISTS password_resets (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL)`;
  const [u] = (await sql`SELECT id, name FROM users WHERE email = ${email}`) as { id: string; name: string }[];
  if (u) {
    const token = randomBytes(24).toString("base64url");
    await sql`DELETE FROM password_resets WHERE user_id = ${u.id} OR expires_at < now()`;
    await sql`INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (${createHash("sha256").update(token).digest("hex")}, ${u.id}, now() + interval '1 hour')`;
    const link = `${new URL(req.url).origin}/reset?token=${token}`;
    await sendMail(email, "Reset your Storyling password", `Hi ${u.name},\n\nSet a new password here (the link works for one hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`);
  }
  return { sent: true };
}, { auth: false });
