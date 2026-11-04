import { NextResponse } from "next/server";

interface Track { baseUrl: string; languageCode: string; kind?: string }
interface Json3 { events?: { tStartMs?: number; dDurationMs?: number; segs?: { utf8?: string }[] }[] }

const ID = /^[A-Za-z0-9_-]{11}$/;
const LANG = /^[a-z]{2,3}$/;

// YouTube answers some clients and not others depending on where the request comes from; try them in turn.
const CLIENTS = [
  { clientName: "IOS", clientVersion: "20.10.4", deviceModel: "iPhone16,2" },
  { clientName: "ANDROID_VR", clientVersion: "1.62.27", androidSdkVersion: 32 },
  { clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER", clientVersion: "2.0" },
  { clientName: "WEB_EMBEDDED_PLAYER", clientVersion: "1.20250101.00.00" },
];
const log: string[] = [];

/** The video's caption tracks, read through YouTube's app API (the web page needs a signed request). */
async function tracks(videoId: string): Promise<Track[]> {
  for (const client of CLIENTS) {
    try {
      const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: { client: { ...client, hl: "en" }, thirdParty: { embedUrl: "https://www.youtube.com/" } }, videoId }),
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      const d = (await res.json()) as { playabilityStatus?: { status?: string }; captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: Track[] } } };
      const list = d.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
      log.push(`${client.clientName}: ${res.status} ${d.playabilityStatus?.status ?? "?"} ${list.length}`);
      if (list.length) return list;
    } catch (e) {
      log.push(`${client.clientName}: ${e instanceof Error ? e.message : "error"}`);
    }
  }
  return [];
}

/** GET /api/captions?v=VIDEO_ID&lang=de → { cues: [{ start, end, text }], auto } */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const v = url.searchParams.get("v") ?? "";
  const lang = url.searchParams.get("lang") ?? "";
  if (!ID.test(v) || !LANG.test(lang)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  log.length = 0;
  try {
    const all = (await tracks(v)).filter((t) => t.languageCode.split("-")[0] === lang);
    // Captions written by the creator first, then YouTube's automatic ones.
    const track = all.find((t) => t.kind !== "asr") ?? all[0];
    if (!track || !track.baseUrl.startsWith("https://www.youtube.com/")) return NextResponse.json({ cues: [], ...(url.searchParams.has("debug") ? { log } : {}) });
    const res = await fetch(`${track.baseUrl}&fmt=json3`, { signal: AbortSignal.timeout(6000), cache: "no-store" });
    const body = await res.text();
    log.push(`timedtext: ${res.status} ${body.length}`);
    if (!body) return NextResponse.json({ cues: [], ...(url.searchParams.has("debug") ? { log } : {}) });
    const data = JSON.parse(body) as Json3;
    const cues = (data.events ?? [])
      .map((e) => ({
        start: (e.tStartMs ?? 0) / 1000,
        end: ((e.tStartMs ?? 0) + (e.dDurationMs ?? 0)) / 1000,
        text: (e.segs ?? []).map((s) => s.utf8 ?? "").join("").replace(/\s+/g, " ").trim(),
      }))
      .filter((c) => c.text && c.text !== "[Musik]" && c.text !== "[Music]");
    return NextResponse.json({ cues, auto: track.kind === "asr" }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch (e) {
    return NextResponse.json({ cues: [], ...(url.searchParams.has("debug") ? { log, error: String(e) } : {}) });
  }
}
