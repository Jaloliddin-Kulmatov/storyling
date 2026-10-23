/** A timed subtitle line, in seconds. */
export interface Cue {
  start: number;
  end: number;
  text: string;
}

const TIME = /(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})/;
const seconds = (m: RegExpMatchArray) => Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]!.padEnd(3, "0")) / 1000;

/** Parse SRT or WebVTT text into cues. Tags are stripped, repeated lines (rolling captions) are merged. */
export function parseCues(input: string): Cue[] {
  const timed = parseTimed(input);
  return timed.length ? timed : parsePasted(input);
}

/** YouTube's "Show transcript" panel, copied as text: a "0:12" line, then the words. */
function parsePasted(input: string): Cue[] {
  const stamp = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/;
  const rows: { start: number; text: string[] }[] = [];
  for (const raw of input.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    const m = line.match(stamp);
    if (m) rows.push({ start: Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]), text: [] });
    else if (line && rows.length) rows[rows.length - 1]!.text.push(line);
  }
  return rows
    .filter((r) => r.text.length)
    .map((r, i, all) => ({ start: r.start, end: all[i + 1]?.start ?? r.start + 5, text: r.text.join(" ") }));
}

function parseTimed(input: string): Cue[] {
  const cues: Cue[] = [];
  for (const block of input.replace(/\r/g, "").replace(/^﻿/, "").split(/\n{2,}/)) {
    const lines = block.split("\n");
    const at = lines.findIndex((l) => l.includes("-->"));
    if (at < 0) continue;
    const [a, b] = lines[at]!.split("-->");
    const ma = a!.match(TIME);
    const mb = b!.match(TIME);
    if (!ma || !mb) continue;
    const text = lines
      .slice(at + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    const last = cues[cues.length - 1];
    if (last && last.text === text) last.end = seconds(mb);
    else cues.push({ start: seconds(ma), end: seconds(mb), text });
  }
  return cues.sort((x, y) => x.start - y.start);
}

/** Index of the cue showing at `t`, or the last one that has started. */
export function cueAt(cues: Cue[], t: number): number {
  let lo = 0;
  let hi = cues.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid]!.start <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}
