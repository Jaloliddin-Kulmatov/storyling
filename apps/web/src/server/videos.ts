import "server-only";
import { fetchVideos, type Video } from "@storyling/content";
import type { LangCode } from "@storyling/core";

/** Latest learner videos for a language; Next caches each feed for 6 hours. */
export function getVideos(lang: LangCode): Promise<Video[]> {
  return fetchVideos(lang, { next: { revalidate: 21600 }, signal: AbortSignal.timeout(5000) });
}
