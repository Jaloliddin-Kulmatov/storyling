import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "./db";

/** Paid plans are on only when Stripe is configured; until then every feature stays free. */
export const billingEnabled = () => !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_MONTHLY;

/** Free plan limits (only enforced while billing is on). */
export const FREE = { storiesPerDay: 3, gradesPerDay: 1 };

let migrated: Promise<unknown> | null = null;
export async function billingDb() {
  const sql = await db();
  migrated ??= (async () => {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_until timestamptz`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer text`;
    await sql`CREATE TABLE IF NOT EXISTS usage (user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, day date NOT NULL DEFAULT current_date, kind text NOT NULL, n integer NOT NULL DEFAULT 0, PRIMARY KEY (user_id, day, kind))`;
  })().catch((e) => { migrated = null; throw e; });
  await migrated;
  return sql;
}

export async function isPro(userId: string): Promise<boolean> {
  if (!billingEnabled()) return true;
  const sql = await billingDb();
  const [row] = (await sql`SELECT pro_until FROM users WHERE id = ${userId}`) as { pro_until: string | null }[];
  return !!row?.pro_until && new Date(row.pro_until).getTime() > Date.now();
}

/** Count one use of a limited feature today; false when the free limit is already reached. */
export async function useQuota(userId: string, kind: string, limit: number): Promise<boolean> {
  const sql = await billingDb();
  const [row] = (await sql`
    INSERT INTO usage (user_id, kind, n) VALUES (${userId}, ${kind}, 1)
    ON CONFLICT (user_id, day, kind) DO UPDATE SET n = usage.n + 1
    RETURNING n`) as { n: number }[];
  return (row?.n ?? 0) <= limit;
}

/** Minimal Stripe REST call (form-encoded), so no SDK dependency is needed. */
export async function stripe<T>(path: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const data = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(data.error?.message ?? "Stripe request failed.");
  return data;
}

/** Checks the Stripe-Signature header (v1 HMAC-SHA256 of "timestamp.payload"). */
export function verifyStripe(payload: string, header: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts.t;
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const want = Buffer.from(createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex"));
  return sigs.some((s) => { const got = Buffer.from(s); return got.length === want.length && timingSafeEqual(got, want); });
}
