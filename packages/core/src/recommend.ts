import type { Coverage } from "./coverage";

/** The coverage the recommender aims for (middle of the 95–98% band). */
export const TARGET_COVERAGE = 0.965;

export interface Candidate {
  id: string;
  coverage: Coverage;
  /** 1 when this is the next unread episode of a series the learner is reading. */
  continuesSeries: boolean;
  /** 0–1 overlap between the story's topics and the learner's interests. */
  interestMatch: number;
  /** Number of the learner's due words that appear in the story. */
  dueWordsInside: number;
  /** Days since the story was published. */
  ageDays: number;
  /** The learner opened it recently and left without finishing. */
  recentlyAbandoned: boolean;
  finished: boolean;
}

/**
 * Weighted score from the Blueprint. Simple on purpose: easy to explain and debug.
 * Replace with a learned ranker once there is data.
 */
export function score(c: Candidate): number {
  const fitCloseness = Math.max(0, 1 - Math.abs(c.coverage.ratio - TARGET_COVERAGE) / 0.15);
  const dueBonus = Math.min(1, c.dueWordsInside / 5);
  const freshness = Math.max(0, 1 - c.ageDays / 30);
  return (
    1.0 * fitCloseness +
    0.6 * (c.continuesSeries ? 1 : 0) +
    0.4 * c.interestMatch +
    0.3 * dueBonus +
    0.2 * freshness -
    0.5 * (c.recentlyAbandoned ? 1 : 0)
  );
}

/** Unfinished candidates, best first. */
export function recommend(candidates: Candidate[], limit = 10): Candidate[] {
  return candidates
    .filter((c) => !c.finished)
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
}
