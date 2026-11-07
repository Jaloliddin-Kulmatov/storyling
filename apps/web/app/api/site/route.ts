import { NextResponse } from "next/server";
import { DEFAULT_SETTINGS, getSettings } from "@/server/admin";
import { dbEnabled } from "@/server/db";

const HEADERS = { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=20" };

/** Public switches from the admin panel: the announcement and which languages are offered. */
export async function GET() {
  const s = dbEnabled() ? await getSettings().catch(() => DEFAULT_SETTINGS) : DEFAULT_SETTINGS;
  return NextResponse.json({ announcement: s.announcement, hiddenLangs: s.hiddenLangs }, { headers: HEADERS });
}
