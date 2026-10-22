import "server-only";
import type { LangCode } from "@storyling/core";
import snapshot from "@/data/videos.json";
import { CHANNELS, parseFeed, type Video } from "@/lib/channels";

const saved = snapshot as Partial<Record<LangCode, Video[]>>;

/**
 * Latest videos for a language from each channel's public YouTube feed.
 * The feed service is flaky, so each channel falls back to the saved snapshot.
 */
export async function getVideos(lang: LangCode): Promise<Video[]> {
  const lists = await Promise.all(
    CHANNELS[lang].map(async (ch) => {
      try {
        const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`, {
          next: { revalidate: 21600 },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const videos = parseFeed(await res.text(), ch);
          if (videos.length) return videos;
        }
      } catch {
        // fall through to the snapshot
      }
      return (saved[lang] ?? []).filter((v) => v.channelId === ch.id);
    }),
  );
  return lists.flat().sort((a, b) => b.published.localeCompare(a.published));
}
