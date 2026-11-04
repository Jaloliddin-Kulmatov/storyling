import { startSession } from "@/server/auth";
import { db } from "@/server/db";
import { accountRoute, HttpError } from "@/server/account-route";

interface TokenInfo { aud?: string; email?: string; email_verified?: string; name?: string; exp?: string }

/** POST { credential }: a Google ID token from "Sign in with Google"; signs in, creating the account the first time. */
export const POST = accountRoute(async (_u, req) => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new HttpError("Google sign-in isn't set up on this site yet.", 503);
  const { credential } = (await req.json().catch(() => ({}))) as { credential?: unknown };
  if (typeof credential !== "string" || credential.length > 4096) throw new HttpError("Missing Google credential.");
  // Google checks the signature and expiry; we check it was issued for this site and the email is verified.
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  const info = (await res.json()) as TokenInfo;
  if (!res.ok || info.aud !== clientId || info.email_verified !== "true" || !info.email) throw new HttpError("Google sign-in failed. Try again.", 401);
  const email = info.email.toLowerCase();
  const name = (info.name ?? email.split("@")[0]!).slice(0, 40);
  const sql = await db();
  const [u] = (await sql`
    INSERT INTO users (email, name, pass_hash) VALUES (${email}, ${name}, ${"google:" + email})
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
    RETURNING id, email, name`) as { id: string; email: string; name: string }[];
  await startSession(u!.id);
  return { user: u };
}, { auth: false });
