/** YouTube "json3" captions → subtitle lines. Shared by the captions route and scripts/fetch-captions.ts. */
export interface Cue { start: number; end: number; text: string }
export interface Json3 { events?: { tStartMs?: number; dDurationMs?: number; aAppend?: number; segs?: { utf8?: string; tOffsetMs?: number }[] }[] }

const NOISE = /^\[(Musik|Music|Applaus|Lachen|Gelächter)\]$/i;

/**
 * Automatic captions come as overlapping two-row windows that cut sentences in half. Rebuild the
 * word timeline and break lines at pauses instead, at most ~14 words a line.
 */
export function cuesFromJson3(data: Json3, auto: boolean): Cue[] {
  const events = (data.events ?? []).filter((e) => e.segs?.length);
  if (!auto) {
    return events
      .map((e) => ({ start: (e.tStartMs ?? 0) / 1000, end: ((e.tStartMs ?? 0) + (e.dDurationMs ?? 0)) / 1000, text: (e.segs ?? []).map((s) => s.utf8 ?? "").join("").replace(/\s+/g, " ").trim() }))
      .filter((c) => c.text && !NOISE.test(c.text));
  }
  const words: { t: number; w: string; end: number }[] = [];
  for (const e of events) {
    const base = e.tStartMs ?? 0;
    const end = base + (e.dDurationMs ?? 0);
    for (const s of e.segs ?? []) {
      const w = (s.utf8 ?? "").trim();
      if (!w || NOISE.test(w)) continue;
      words.push({ t: base + (s.tOffsetMs ?? 0), w, end });
    }
  }
  words.sort((a, b) => a.t - b.t);
  const out: Cue[] = [];
  let line: typeof words = [];
  const flush = (nextStart?: number) => {
    if (!line.length) return;
    const text = line.map((x) => x.w).join(" ");
    out.push({ start: line[0]!.t / 1000, end: Math.min(nextStart ?? Infinity, line[line.length - 1]!.end, line[line.length - 1]!.t + 1500) / 1000, text: text[0]!.toUpperCase() + text.slice(1) });
    line = [];
  };
  words.forEach((x, i) => {
    const prev = words[i - 1];
    const gap = prev ? x.t - prev.t : 0;
    if (line.length && (gap > 900 || line.length >= 14 || (line.length >= 7 && gap > 450))) flush(x.t);
    line.push(x);
  });
  flush();
  return out;
}
