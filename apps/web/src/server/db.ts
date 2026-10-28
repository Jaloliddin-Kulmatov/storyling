import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/** Accounts are on when DATABASE_URL (a Neon Postgres connection string) is set. */
export const dbEnabled = () => !!process.env.DATABASE_URL;

let sql: NeonQueryFunction<false, false> | null = null;
let ready: Promise<void> | null = null;

/** Query helper. Creates the tables the first time it is used, so there is no migration step to run. */
export async function db(): Promise<NeonQueryFunction<false, false>> {
  sql ??= neon(process.env.DATABASE_URL!);
  const q = sql;
  ready ??= (async () => {
    await q`CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL UNIQUE,
      name text NOT NULL,
      pass_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await q`CREATE TABLE IF NOT EXISTS sync (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    await q`CREATE TABLE IF NOT EXISTS points (
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day date NOT NULL,
      points integer NOT NULL,
      PRIMARY KEY (user_id, day)
    )`;
    await q`CREATE TABLE IF NOT EXISTS translations (
      key text PRIMARY KEY,
      target text NOT NULL,
      src text NOT NULL,
      out text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await q`CREATE TABLE IF NOT EXISTS story_views (
      story_id text PRIMARY KEY,
      views integer NOT NULL DEFAULT 0
    )`;
  })().catch((e) => {
    ready = null;
    throw e;
  });
  await ready;
  return q;
}
