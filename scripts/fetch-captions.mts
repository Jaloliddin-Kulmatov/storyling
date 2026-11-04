// Saves captions for the current Watch videos to apps/web/public/captions/<id>.json.
// YouTube refuses caption requests from cloud servers, so run this from a home connection:
//   npx tsx scripts/fetch-captions.mts [lang] [--force]
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { CHANNELS } from "../packages/content/src/videos";
import type { LangCode } from "../packages/core/src/index";
import { cuesFromJson3, type Json3 } from "../apps/web/src/lib/captions";

const lang = (process.argv.find((a, i) => i > 1 && !a.startsWith("--")) ?? "de") as LangCode;
const force = process.argv.includes("--force");
const out = new URL("../apps/web/public/captions/", import.meta.url);
mkdirSync(out, { recursive: true });

const ids = new Set<string>();
for (const ch of CHANNELS[lang]) {
  const xml = await (await fetch(`https://www.youtube.com/feeds/videos.xml?${ch.playlist ? `playlist_id=${ch.playlist}` : `channel_id=${ch.id}`}`)).text();
  for (const entry of xml.split("<entry>").slice(1)) {
    const id = entry.match(/<yt:videoId>([^<]+)/)?.[1];
    if (id && !entry.includes("/shorts/")) ids.add(id);
  }
}

let saved = 0;
let none = 0;
let failed = 0;
for (const id of ids) {
  const file = new URL(`${id}.json`, out);
  if (existsSync(file) && !force) continue;
  try {
  const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context: { client: { clientName: "IOS", clientVersion: "20.10.4", deviceModel: "iPhone16,2", hl: "en" } }, videoId: id }),
  });
  const d = (await res.json()) as { captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: { baseUrl: string; languageCode: string; kind?: string }[] } } };
  const all = (d.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []).filter((t) => t.languageCode.split("-")[0] === lang);
  const track = all.find((t) => t.kind !== "asr") ?? all[0];
  if (!track) { none++; continue; }
  let body = "";
  // YouTube answers 429 when asked too fast: wait and try again.
  for (let attempt = 0; attempt < 4 && !body; attempt++) {
    const r = await fetch(`${track.baseUrl}&fmt=json3`);
    if (r.status === 429) { await new Promise((ok) => setTimeout(ok, 90_000 * (attempt + 1))); continue; }
    body = await r.text();
  }
  if (!body) { failed++; continue; }
  const data = JSON.parse(body) as Json3;
  const auto = track.kind === "asr";
  const cues = cuesFromJson3(data, auto);
  if (!cues.length) { none++; continue; }
  writeFileSync(file, JSON.stringify({ cues, auto }));
  saved++;
  } catch {
    failed++;
  }
  await new Promise((r) => setTimeout(r, 2500));
}
console.log(`${ids.size} videos · ${saved} caption files written · ${none} without ${lang} captions · ${failed} failed (run again later)`);
