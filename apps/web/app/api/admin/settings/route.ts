import { z } from "zod";
import { accountRoute, HttpError } from "@/server/account-route";
import { getSettings, requireAdmin, saveSettings } from "@/server/admin";
import { aiEnabled } from "@/server/ai";
import { writeDailyStories } from "@/server/daily";

export const maxDuration = 300;

export const GET = accountRoute(async (user) => {
  requireAdmin(user);
  return getSettings();
});

const Patch = z.object({
  announcement: z.string().trim().max(200).optional(),
  hiddenLangs: z.array(z.string().max(5)).max(10).optional(),
  hiddenStories: z.array(z.string().max(80)).max(2000).optional(),
  dailyOff: z.boolean().optional(),
});

/** PUT: change some switches. */
export const PUT = accountRoute(async (user, req) => {
  requireAdmin(user);
  const b = Patch.safeParse(await req.json().catch(() => null));
  if (!b.success) throw new HttpError("Those settings don't look right.");
  const next = { ...(await getSettings()), ...b.data };
  await saveSettings(next);
  return next;
});

/** POST: write and post what's left of today's stories now instead of waiting for the next run. */
export const POST = accountRoute(async (user) => {
  requireAdmin(user);
  if (!aiEnabled()) throw new HttpError("AI is turned off on this server.", 503);
  return writeDailyStories();
});
