import { language, lookup, storiesFor } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import type { Level } from "./index";

/**
 * A one-minute word test. The learner ticks the words they know; their answers per level decide
 * which levels count as known, so story fit labels are realistic from the first screen.
 */
export interface PlacementWord {
  lemma: string;
  display: string;
  reading?: string;
  /** Index into the language's levels: the easiest level whose stories use this word. */
  level: number;
}

const PER_LEVEL = 6;
const SKIP_POS = new Set(["name", "article", "pronoun", "preposition", "conjunction", "determiner", "particle", "contraction", "interjection", "number", "copula", "suffix", "measure word", "counter"]);

/** Every word with the easiest level it appears at, from catalog stories only. */
export function wordLevels(lang: LangCode): Map<string, number> {
  const levels = language(lang).levels;
  const out = new Map<string, number>();
  for (const s of storiesFor(lang)) {
    const lv = levels.indexOf(s.level);
    if (lv < 0) continue;
    for (const sent of s.sentences)
      for (const t of sent.tokens) {
        if (!t.lemma || t.isName) continue;
        const prev = out.get(t.lemma);
        if (prev === undefined || lv < prev) out.set(t.lemma, lv);
      }
  }
  return out;
}

/** A small shuffled sample from each level, content words only, easiest level first. */
export function placementWords(lang: LangCode, rand: () => number = Math.random): PlacementWord[] {
  const levels = language(lang).levels;
  const byLevel: PlacementWord[][] = levels.map(() => []);
  for (const [lemma, level] of wordLevels(lang)) {
    const e = lookup(lang, lemma);
    if (!e || SKIP_POS.has(e.pos)) continue;
    byLevel[level]!.push({ lemma, display: e.display, reading: e.reading, level });
  }
  return byLevel.flatMap((list) => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a.slice(0, PER_LEVEL);
  });
}

export interface PlacementResult {
  /** Highest level index the learner passed (−1 if none). */
  passed: number;
  /** Words to mark as known. */
  known: string[];
  /** The 0–2 level used elsewhere in the app. */
  level: Level;
}

/**
 * A level is passed when the learner knew at least 60% of its sample, and every easier level was passed too.
 * Every word of a passed level counts as known; words ticked above that level count too.
 */
export function placementResult(lang: LangCode, sample: PlacementWord[], ticked: ReadonlySet<string>): PlacementResult {
  const levels = language(lang).levels;
  let passed = -1;
  for (let lv = 0; lv < levels.length; lv++) {
    const items = sample.filter((w) => w.level === lv);
    if (!items.length) break;
    const rate = items.filter((w) => ticked.has(w.lemma)).length / items.length;
    if (rate >= 0.6) passed = lv;
    else break;
  }
  const known = new Set<string>(ticked);
  for (const [lemma, lv] of wordLevels(lang)) if (lv <= passed) known.add(lemma);
  const level: Level = passed < 0 ? 0 : passed === 0 ? 1 : 2;
  return { passed, known: [...known], level };
}
