/**
 * Yes/no vocabulary test. The learner says which words they know; made-up words
 * catch guessing. Each answered word belongs to a frequency band (e.g. ranks 1–1000).
 */
export interface PlacementItem {
  /** Upper frequency rank of the item's band, e.g. 1000, 2000, 3000. Pseudo-words: null. */
  bandMax: number | null;
  /** Lower rank of the band (exclusive), e.g. 0 for 1–1000. */
  bandMin?: number;
  saidKnown: boolean;
}

export interface PlacementResult {
  /** Estimated number of known words. */
  vocabEstimate: number;
  /** Share of made-up words the learner claimed to know. */
  falseAlarmRate: number;
  /** True when the learner said yes to so many fake words that the estimate is unreliable. */
  unreliable: boolean;
}

/**
 * For each band: corrected hit rate h' = (h − f) / (1 − f), where h is the share of real
 * words claimed and f the share of fake words claimed (a standard yes/no-test correction).
 * The estimate is the sum over bands of h' × band size.
 */
export function estimateVocabulary(items: PlacementItem[]): PlacementResult {
  const fakes = items.filter((i) => i.bandMax === null);
  const f = fakes.length ? fakes.filter((i) => i.saidKnown).length / fakes.length : 0;

  const bands = new Map<number, { min: number; yes: number; n: number }>();
  for (const item of items) {
    if (item.bandMax === null) continue;
    const b = bands.get(item.bandMax) ?? { min: item.bandMin ?? 0, yes: 0, n: 0 };
    b.n += 1;
    if (item.saidKnown) b.yes += 1;
    bands.set(item.bandMax, b);
  }

  let vocabEstimate = 0;
  for (const [max, b] of bands) {
    const h = b.yes / b.n;
    const corrected = f >= 1 ? 0 : Math.max(0, (h - f) / (1 - f));
    vocabEstimate += corrected * (max - b.min);
  }

  return { vocabEstimate: Math.round(vocabEstimate), falseAlarmRate: f, unreliable: f > 0.3 };
}
