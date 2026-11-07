import "server-only";
import { HttpError } from "./account-route";
import type { Account } from "./auth";
import { db } from "./db";
import { isAdminEmail } from "./stories";

export function requireAdmin(user: Account | null) {
  if (!user || !isAdminEmail(user.email)) throw new HttpError("Only admins can do this.", 403);
  return user;
}

/** What an admin can switch on the running site. */
export interface SiteSettings {
  /** Shown at the top of the app for everyone; empty for none. */
  announcement: string;
  /** Not offered to new learners. People already learning them keep their access. */
  hiddenLangs: string[];
  /** Built-in stories taken out of every list. */
  hiddenStories: string[];
  /** Stops the morning story writing. */
  dailyOff: boolean;
}

export const DEFAULT_SETTINGS: SiteSettings = { announcement: "", hiddenLangs: [], hiddenStories: [], dailyOff: false };

export async function getSettings(): Promise<SiteSettings> {
  const sql = await db();
  const [row] = (await sql`SELECT data FROM site_settings WHERE id = 1`) as { data: Partial<SiteSettings> }[];
  return { ...DEFAULT_SETTINGS, ...row?.data };
}

export async function saveSettings(s: SiteSettings) {
  const sql = await db();
  await sql`INSERT INTO site_settings (id, data) VALUES (1, ${JSON.stringify(s)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
}
