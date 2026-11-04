import { checkPassword, startSession } from "@/server/auth";
import { db } from "@/server/db";
import { accountRoute, HttpError } from "@/server/account-route";

export const POST = accountRoute(async (_u, req) => {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = String(b.email ?? "").trim().toLowerCase();
  const sql = await db();
  const rows = (await sql`SELECT id, email, name, pass_hash FROM users WHERE email = ${email}`) as { id: string; email: string; name: string; pass_hash: string }[];
  const u = rows[0];
  // Specific messages, so learners know whether to register, reset, or use Google.
  if (!u) throw new HttpError("No account with this email yet. Create one with Register.", 404);
  if (u.pass_hash.startsWith("google:")) throw new HttpError("This account signs in with Google. Use “Continue with Google”.", 401);
  if (!(await checkPassword(String(b.password ?? ""), u.pass_hash))) throw new HttpError("Wrong password. Try again or reset it with “Forgot password?”.", 401);
  await startSession(u.id);
  return { user: { id: u.id, email: u.email, name: u.name } };
}, { auth: false });
