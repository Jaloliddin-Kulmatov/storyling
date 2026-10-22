import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { CHANNELS } from "@/lib/channels";
import { getVideos } from "@/server/videos";
import { Watch } from "@/views/Watch";

export const metadata: Metadata = { title: "Watch" };
// Refresh the video lists every 6 hours.
export const revalidate = 21600;

export default async function WatchPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const code = lang as LangCode;
  return <Watch lang={code} videos={await getVideos(code)} channels={CHANNELS[code]} />;
}
