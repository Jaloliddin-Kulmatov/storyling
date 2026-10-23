import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { Leaderboard } from "@/views/Leaderboard";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Leaderboard lang={lang as LangCode} />;
}
