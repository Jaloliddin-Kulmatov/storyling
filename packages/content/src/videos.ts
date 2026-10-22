import type { LangCode } from "@storyling/core";
import snapshot from "./videos.json";

/** Learner-friendly YouTube channels per language. Videos come from each channel's public feed. */
export type Band = "beginner" | "intermediate" | "advanced";

export interface Channel {
  id: string;
  name: string;
  /** Default difficulty when a video title doesn't say. */
  band: Band;
  note: string;
}

export const CHANNELS: Record<LangCode, Channel[]> = {
  en: [
    { id: "UCHaHD477h-FeBbVh9Sh7syA", name: "BBC Learning English", band: "intermediate", note: "News, grammar and vocabulary in clear English" },
    { id: "UCvgLaFuTGGRXl0eyvBRCifA", name: "Easy English", band: "intermediate", note: "Street interviews with subtitles" },
  ],
  de: [
    { id: "UCxUWIEL-USsiPak0Qy6_vVg", name: "DW Deutsch lernen", band: "beginner", note: "Deutsche Welle courses, including the series Nicos Weg" },
    { id: "UCbxb2fqe9oNgglAoYqsYOtQ", name: "Easy German", band: "intermediate", note: "Street interviews and Super Easy German for beginners" },
  ],
  es: [
    { id: "UCouyFdE9-Lrjo3M_2idKq1A", name: "Dreaming Spanish", band: "beginner", note: "Comprehensible input, from superbeginner up" },
    { id: "UCAL4AMMMXKxHDu3FqZV6CbQ", name: "Easy Spanish", band: "intermediate", note: "Street interviews with subtitles" },
  ],
  fr: [
    { id: "UCoUWq2QawqdC3-nRXKk-JUw", name: "Easy French", band: "intermediate", note: "Street interviews and slow French" },
    { id: "UCI4xp8qHD1MDErkqxb1dPbA", name: "innerFrench", band: "intermediate", note: "Clear, natural French on everyday topics" },
  ],
  it: [{ id: "UChpDG_WQkf_2tgLUr9xTR0g", name: "Easy Italian", band: "intermediate", note: "Street interviews with subtitles" }],
  pt: [
    { id: "UCGs6EbIt75S4IMKPRUU0JNQ", name: "Speaking Brazilian", band: "intermediate", note: "Brazilian Portuguese as people really speak it" },
    { id: "UCeLpksGNxcD6eFpl_ixvbMw", name: "Easy Portuguese", band: "intermediate", note: "Street interviews (European Portuguese)" },
  ],
  ru: [
    { id: "UCklUqFEcJqFnWKEBozw5p4g", name: "Russian With Max", band: "beginner", note: "Slow, simple Russian" },
    { id: "UCxvt-g7JsPNnEn8tUtZZBBg", name: "Easy Russian", band: "intermediate", note: "Street interviews with subtitles" },
  ],
  zh: [
    { id: "UC2fAiRQHRQT9aj9P_ijYeow", name: "Mandarin Corner", band: "intermediate", note: "Real conversations with Chinese and pinyin subtitles" },
    { id: "UCw837dYLZNGdhk5G5zjySIg", name: "Easy Mandarin", band: "intermediate", note: "Street interviews with subtitles" },
  ],
  ja: [{ id: "UC16-9M0osgdFbLKXvCwpXaw", name: "Easy Japanese Podcast", band: "beginner", note: "Slow, simple Japanese about daily life" }],
  ko: [
    { id: "UC5r3WHrX4Z7peSYpDlgktGw", name: "Talk To Me In Korean", band: "beginner", note: "Lessons and listening practice" },
    { id: "UCSM7iNM9o6TEH00dEkn526w", name: "Easy Korean", band: "intermediate", note: "Street interviews with subtitles" },
  ],
};

export interface Video {
  id: string;
  title: string;
  channel: string;
  channelId: string;
  published: string;
  band: Band;
}

/** A title that names a level wins over the channel's default. */
export function bandFor(title: string, fallback: Band): Band {
  if (/super ?easy|superbeginner|beginner|anfänger|débutant|principiante|\bA1\b|\bA2\b|slow/i.test(title)) return "beginner";
  if (/advanced|fortgeschritten|avancé|avanzado|\bC1\b|\bC2\b/i.test(title)) return "advanced";
  if (/intermediate|\bB1\b|\bB2\b/i.test(title)) return "intermediate";
  return fallback;
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** Parse a YouTube channel feed (Atom XML). Shorts are skipped. */
/** Saved copy of each language's videos, used when the live feed is unavailable. */
export const savedVideos = snapshot as Partial<Record<LangCode, Video[]>>;

export function parseFeed(xml: string, ch: Channel): Video[] {
  const out: Video[] = [];
  for (const entry of xml.split("<entry>").slice(1)) {
    const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>([^<]*)<\/title>/)?.[1];
    const link = entry.match(/<link rel="alternate" href="([^"]+)"/)?.[1] ?? "";
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? "";
    if (!id || !title || link.includes("/shorts/")) continue;
    const t = decode(title);
    out.push({ id, title: t, channel: ch.name, channelId: ch.id, published, band: bandFor(t, ch.band) });
  }
  return out;
}

/** Latest videos for a language: each channel's live feed, falling back to the saved copy. */
export async function fetchVideos(lang: LangCode, init?: RequestInit & { next?: { revalidate: number } }): Promise<Video[]> {
  const lists = await Promise.all(
    CHANNELS[lang].map(async (ch) => {
      try {
        const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`, init);
        if (res.ok) {
          const videos = parseFeed(await res.text(), ch);
          if (videos.length) return videos;
        }
      } catch {
        // the feed service is flaky; fall through to the saved copy
      }
      return (savedVideos[lang] ?? []).filter((v) => v.channelId === ch.id);
    }),
  );
  return lists.flat().sort((a, b) => b.published.localeCompare(a.published));
}
