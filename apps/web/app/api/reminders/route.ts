import { db } from "@/server/db";
import { accountRoute } from "@/server/account-route";

const emailOn = () => !!process.env.RESEND_API_KEY && !!process.env.REMIND_FROM;

async function ensure() {
  const sql = await db();
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS remind boolean NOT NULL DEFAULT false`;
  return sql;
}

/** GET: is the daily email reminder on for me? POST { on }: turn it on or off. */
export const GET = accountRoute(async (user) => {
  if (!user) return { on: false, email: emailOn() };
  const sql = await ensure();
  const [row] = (await sql`SELECT remind FROM users WHERE id = ${user.id}`) as { remind: boolean }[];
  return { on: !!row?.remind, email: emailOn() };
}, { auth: false });

export const POST = accountRoute(async (user, req) => {
  const body = (await req.json().catch(() => ({}))) as { on?: unknown };
  const sql = await ensure();
  await sql`UPDATE users SET remind = ${body.on === true} WHERE id = ${user!.id}`;
  return { on: body.on === true, email: emailOn() };
});
