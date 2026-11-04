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
  /** Read a playlist feed instead of the channel's own (course series). */
  playlist?: string;
}

export const CHANNELS: Record<LangCode, Channel[]> = {
  en: [
    { id: "UCHaHD477h-FeBbVh9Sh7syA", name: "BBC Learning English", band: "intermediate", note: "News, grammar and vocabulary in clear English" },
    { id: "UCvgLaFuTGGRXl0eyvBRCifA", name: "Easy English", band: "intermediate", note: "Street interviews with subtitles" },
  ],
  de: [
    // Beginner (A1–A2)
    { id: "nicos-weg", playlist: "PLs7zUO7VPyJ5DV1iBRgSw2uDl832n0bLg", name: "Nicos Weg (DW)", band: "beginner", note: "The DW telenovela course, episode by episode, A1 to B1" },
    { id: "eg-a1", playlist: "PLk1fjOl39-50kWobutO8NVFzbw9PHtbbg", name: "Easy German A1", band: "beginner", note: "Easy German for absolute beginners, with German and English subtitles" },
    { id: "eg-a2", playlist: "PLk1fjOl39-5201BUdhtOM_x23poNvLouT", name: "Easy German A2", band: "beginner", note: "Everyday situations for advanced beginners" },
    { id: "eg-slow", playlist: "PLk1fjOl39-53Sy0xxIHKnQoZLHWb8rbl9", name: "Slow German", band: "beginner", note: "Easy German videos spoken slowly and clearly" },
    { id: "eg-super", playlist: "PLk1fjOl39-53GxQIn1Hxdouokf0J0SDpl", name: "Super Easy German", band: "beginner", note: "Short grammar and vocabulary lessons for beginners" },
    { id: "german-made-easy", playlist: "PLvr84R8yDNJZxVFRhIAdv-UGEj2KOA86n", name: "German Made Easy", band: "beginner", note: "Step-by-step beginner lessons in English, from the alphabet up" },
    { id: "UClBrbJXNh2sFxOuvH4o5H9g", playlist: "UULFlBrbJXNh2sFxOuvH4o5H9g", name: "lingoni GERMAN", band: "beginner", note: "Clear lessons from A1 to B1 with a German teacher" },
    { id: "UCZwegPHTG4gvnR0WLzaq5OQ", playlist: "UULFZwegPHTG4gvnR0WLzaq5OQ", name: "Learn German with Anja", band: "beginner", note: "Fun beginner lessons, vocabulary and culture" },
    { id: "UCzxztVPUVqd6iI1wGZcyalg", playlist: "UULFzxztVPUVqd6iI1wGZcyalg", name: "YourGermanTeacher", band: "beginner", note: "Grammar explained simply, for beginners" },
    // Intermediate (B1)
    { id: "eg-b1", playlist: "PLk1fjOl39-53yooogv6RaJAK29mx7nz1d", name: "Easy German B1", band: "intermediate", note: "Street interviews for intermediate learners" },
    { id: "UCbxb2fqe9oNgglAoYqsYOtQ", playlist: "UULFbxb2fqe9oNgglAoYqsYOtQ", name: "Easy German", band: "intermediate", note: "Street interviews and everyday German" },
    { id: "UCxUWIEL-USsiPak0Qy6_vVg", playlist: "UULFxUWIEL-USsiPak0Qy6_vVg", name: "DW Deutsch lernen", band: "intermediate", note: "Deutsche Welle news and job German, about B1" },
    { id: "UCCAI6jmeW5hWz2-jaLPqLUQ", playlist: "UULFCAI6jmeW5hWz2-jaLPqLUQ", name: "Deutsch mit Marija", band: "intermediate", note: "Grammar and speaking, all in German" },
    { id: "UC1xaY8XtSMaJN38RYJoGGCg", playlist: "UULF1xaY8XtSMaJN38RYJoGGCg", name: "Deutsch mit Benjamin", band: "intermediate", note: "Natural German explained in German" },
    { id: "UCesZBmRS6IgZ3uuiB8RdX0A", playlist: "UULFesZBmRS6IgZ3uuiB8RdX0A", name: "Get Germanized", band: "intermediate", note: "Life in Germany, culture and language" },
    // Advanced (B2–C1)
    { id: "eg-b2", playlist: "PLk1fjOl39-51lvdiuQYsLW-0aGIdNNknA", name: "Easy German B2", band: "advanced", note: "Longer conversations for upper-intermediate learners" },
    { id: "eg-c1", playlist: "PLk1fjOl39-53pjPz2VLCeu5vjOUMKZ22O", name: "Easy German C1", band: "advanced", note: "Politics, society and culture for advanced learners" },
    { id: "UC5NOEUbkLheQcaaRldYW5GA", playlist: "UULF5NOEUbkLheQcaaRldYW5GA", name: "tagesschau", band: "advanced", note: "The main German TV news" },
  ],
  es: [
    { id: "UCouyFdE9-Lrjo3M_2idKq1A", name: "Dreaming Spanish", band: "beginner", note: "Comprehensible input, from superbeginner up" },
    { id: "UCAL4AMMMXKxHDu3FqZV6CbQ", name: "Easy Spanish", band: "intermediate", note: "Street interviews with subtitles" },
  ],
  fr: [
    { id: "UCoUWq2QawqdC3-nRXKk-JUw", name: "Easy French", band: "intermediate", note: "Street interviews and slow French" },
    { id: "UCI4xp8qHD1MDErkqxb1dPbA", name: "innerFrench", band: "intermediate", note: "Clear, natural French on everyday topics" },
  ],
  tr: [
    { id: "UC1U-NW0ci6d1aHLc2gOHv8Q", name: "Easy Turkish", band: "intermediate", note: "Street interviews with Turkish and English subtitles" },
    { id: "UC-HOzxLZiH6MhGU5csLgINA", name: "TurkishClass101", band: "beginner", note: "Short lessons and everyday vocabulary" },
  ],
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
  if (/\bB2\b|\bC1\b|\bC2\b/i.test(title)) return "advanced";
  if (/\bB1\b|kurz und leicht/i.test(title)) return "intermediate";
  if (/super ?easy|superbeginner|beginner|anfänger|débutant|principiante|\bA1\b|\bA2\b|slow/i.test(title)) return "beginner";
  if (/advanced|fortgeschritten|avancé|avanzado/i.test(title)) return "advanced";
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
        const res = await fetch(`https://www.youtube.com/feeds/videos.xml?${ch.playlist ? `playlist_id=${ch.playlist}` : `channel_id=${ch.id}`}`, init);
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
