import "server-only";
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { promisify } from "node:util";
import { db } from "./db";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = "storyling_session";
const DAYS = 60;

/** AUTH_SECRET if set; otherwise derived from the database URL, which is already a secret. */
const secret = () => process.env.AUTH_SECRET || `storyling-session:${process.env.DATABASE_URL}`;
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("base64url");

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `${salt.toString("base64url")}.${(await scrypt(pw, salt, 32)).toString("base64url")}`;
}

export async function checkPassword(pw: string, stored: string) {
  const [s, h] = stored.split(".");
  if (!s || !h) return false;
  const got = await scrypt(pw, Buffer.from(s, "base64url"), 32);
  const want = Buffer.from(h, "base64url");
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function startSession(userId: string) {
  const exp = Date.now() + DAYS * 864e5;
  const body = `${userId}.${exp}`;
  (await cookies()).set(COOKIE, `${body}.${sign(body)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: DAYS * 86400 });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export interface Account {
  id: string;
  email: string;
  name: string;
}

export async function currentUser(): Promise<Account | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [id, exp, mac] = token.split(".");
  if (!id || !exp || !mac || Number(exp) < Date.now()) return null;
  const want = Buffer.from(sign(`${id}.${exp}`));
  const got = Buffer.from(mac);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const sql = await db();
  const rows = (await sql`SELECT id, email, name FROM users WHERE id = ${id}`) as Account[];
  return rows[0] ?? null;
}
