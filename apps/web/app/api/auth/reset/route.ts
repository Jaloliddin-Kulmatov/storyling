import { createHash } from "node:crypto";
import { hashPassword, startSession } from "@/server/auth";
import { db } from "@/server/db";
import { accountRoute, HttpError } from "@/server/account-route";

/** POST { token, password }: set a new password from an emailed link, then sign in. */
export const POST = accountRoute(async (_u, req) => {
  const b = (await req.json().catch(() => ({}))) as { token?: unknown; password?: unknown };
  const password = String(b.password ?? "");
  if (password.length < 8 || password.length > 200) throw new HttpError("Use a password of at least 8 characters.");
  const sql = await db();
  const hash = createHash("sha256").update(String(b.token ?? "")).digest("hex");
  const [row] = (await sql`DELETE FROM password_resets WHERE token_hash = ${hash} AND expires_at > now() RETURNING user_id`) as { user_id: string }[];
  if (!row) throw new HttpError("This reset link has expired. Ask for a new one.", 410);
  const [u] = (await sql`UPDATE users SET pass_hash = ${await hashPassword(password)} WHERE id = ${row.user_id} RETURNING id, email, name`) as { id: string; email: string; name: string }[];
  await startSession(u!.id);
  return { user: u };
}, { auth: false });
