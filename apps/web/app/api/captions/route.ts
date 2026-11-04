import { NextResponse } from "next/server";

interface Track { baseUrl: string; languageCode: string; kind?: string }
interface Json3 { events?: { tStartMs?: number; dDurationMs?: number; segs?: { utf8?: string }[] }[] }

const ID = /^[A-Za-z0-9_-]{11}$/;
const LANG = /^[a-z]{2,3}$/;

/** The video's caption tracks, read the way YouTube's iOS app does (the web page needs a signed request). */
async function tracks(videoId: string): Promise<Track[]> {
  const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context: { client: { clientName: "IOS", clientVersion: "20.10.4", deviceModel: "iPhone16,2", hl: "en" } }, videoId }),
    signal: AbortSignal.timeout(6000),
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [];
  const d = (await res.json()) as { captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: Track[] } } };
  return d.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
}

/** GET /api/captions?v=VIDEO_ID&lang=de → { cues: [{ start, end, text }], auto } */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const v = url.searchParams.get("v") ?? "";
  const lang = url.searchParams.get("lang") ?? "";
  if (!ID.test(v) || !LANG.test(lang)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    const all = (await tracks(v)).filter((t) => t.languageCode.split("-")[0] === lang);
    // Captions written by the creator first, then YouTube's automatic ones.
    const track = all.find((t) => t.kind !== "asr") ?? all[0];
    if (!track || !track.baseUrl.startsWith("https://www.youtube.com/")) return NextResponse.json({ cues: [] });
    const res = await fetch(`${track.baseUrl}&fmt=json3`, { signal: AbortSignal.timeout(6000), next: { revalidate: 86400 } });
    const data = (await res.json()) as Json3;
    const cues = (data.events ?? [])
      .map((e) => ({
        start: (e.tStartMs ?? 0) / 1000,
        end: ((e.tStartMs ?? 0) + (e.dDurationMs ?? 0)) / 1000,
        text: (e.segs ?? []).map((s) => s.utf8 ?? "").join("").replace(/\s+/g, " ").trim(),
      }))
      .filter((c) => c.text && c.text !== "[Musik]" && c.text !== "[Music]");
    return NextResponse.json({ cues, auto: track.kind === "asr" }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch {
    return NextResponse.json({ cues: [] });
  }
}
