// Saves German captions for the current Watch videos to apps/web/public/captions/<id>.json.
// YouTube refuses caption requests from cloud servers, so run this from a home connection:
//   node scripts/fetch-captions.mjs [lang]
import { mkdirSync, writeFileSync, existsSync } from "node:fs";

const lang = process.argv[2] ?? "de";
const out = new URL(`../apps/web/public/captions/`, import.meta.url);
mkdirSync(out, { recursive: true });
const ids = new Set();
// Channel and playlist feeds for the language, as the Watch page reads them.
const text = await (await import("node:fs/promises")).readFile(new URL("../packages/content/src/videos.ts", import.meta.url), "utf8");
const block = text.slice(text.indexOf(`  ${lang}: [`), text.indexOf("],", text.indexOf(`  ${lang}: [`)));
for (const m of block.matchAll(/\{ id: "([^"]+)"(?:, playlist: "([^"]+)")?/g)) {
  const feed = m[2] ? `playlist_id=${m[2]}` : `channel_id=${m[1]}`;
  const xml = await (await fetch(`https://www.youtube.com/feeds/videos.xml?${feed}`)).text();
  for (const v of xml.matchAll(/<yt:videoId>([^<]+)/g)) ids.add(v[1]);
}

let saved = 0;
for (const id of ids) {
  const file = new URL(`${id}.json`, out);
  if (existsSync(file)) continue;
  const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context: { client: { clientName: "IOS", clientVersion: "20.10.4", deviceModel: "iPhone16,2", hl: "en" } }, videoId: id }),
  });
  const d = await res.json();
  const all = (d.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []).filter((t) => t.languageCode.split("-")[0] === lang);
  const track = all.find((t) => t.kind !== "asr") ?? all[0];
  if (!track) { console.log(id, "no captions"); continue; }
  const data = await (await fetch(`${track.baseUrl}&fmt=json3`)).json();
  const cues = (data.events ?? [])
    .map((e) => ({ start: (e.tStartMs ?? 0) / 1000, end: ((e.tStartMs ?? 0) + (e.dDurationMs ?? 0)) / 1000, text: (e.segs ?? []).map((s) => s.utf8 ?? "").join("").replace(/\s+/g, " ").trim() }))
    .filter((c) => c.text && !/^\[(Musik|Music|Applaus)\]$/.test(c.text));
  writeFileSync(file, JSON.stringify({ cues, auto: track.kind === "asr" }));
  saved++;
  console.log(id, cues.length, track.kind === "asr" ? "auto" : "manual");
  await new Promise((r) => setTimeout(r, 400));
}
console.log(`${ids.size} videos, ${saved} new caption files`);
