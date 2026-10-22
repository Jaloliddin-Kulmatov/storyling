import type { Story, Token } from "./types";

export type Fit = "easy" | "just_right" | "stretch" | "too_hard";

export interface Coverage {
  /** Expected share of countable words the learner knows, 0–1. */
  ratio: number;
  /** ratio as a whole percent, for display. */
  percent: number;
  /** Countable word tokens (punctuation and names excluded). */
  total: number;
  /** Distinct lemmas the learner probably doesn't know (pKnown < 0.5). */
  newWords: string[];
  fit: Fit;
}

/** Fit bands from the Blueprint (section 06). */
export function fitFor(ratio: number): Fit {
  if (ratio >= 0.98) return "easy";
  if (ratio >= 0.95) return "just_right";
  if (ratio >= 0.9) return "stretch";
  return "too_hard";
}

export const FIT_LABEL: Record<Fit, string> = {
  easy: "Easy",
  just_right: "Just right",
  stretch: "Stretch",
  too_hard: "Challenging",
};

const counts = (t: Token): t is Token & { lemma: string } => !!t.lemma && !t.isName;

/**
 * Expected coverage of a story for one learner.
 * @param pKnown returns the learner's probability of knowing a lemma (0 for unseen words).
 */
export function coverage(story: Story, pKnown: (lemma: string) => number): Coverage {
  let sum = 0;
  let total = 0;
  const unknown = new Set<string>();
  for (const sentence of story.sentences) {
    for (const token of sentence.tokens) {
      if (!counts(token)) continue;
      const p = pKnown(token.lemma);
      sum += p;
      total += 1;
      if (p < 0.5) unknown.add(token.lemma);
    }
  }
  const ratio = total === 0 ? 1 : sum / total;
  return { ratio, percent: Math.round(ratio * 100), total, newWords: [...unknown], fit: fitFor(ratio) };
}
