import type { UserWord, WordEvent, WordEventType, WordState } from "./types";

/** pKnown at or above this counts as known. */
export const KNOWN_THRESHOLD = 0.9;

/**
 * How much each event moves a word's log-odds of being known.
 * Starting guesses from the Blueprint; refit on real logs once there is data.
 */
export const EVENT_WEIGHTS: Record<WordEventType, number> = {
  read_past: 0.35,
  tap: -0.6,
  review_again: -1.0,
  review_good: 0.8,
  review_easy: 1.2,
  retell_correct: 1.0,
  shadow_clear: 0.2,
};

const P_MIN = 0.01;
const P_MAX = 0.995;

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const logit = (p: number) => Math.log(p / (1 - p));
const clamp = (p: number) => Math.min(P_MAX, Math.max(P_MIN, p));

/**
 * Starting guess before the learner has met a word: likely known when the word's
 * frequency rank is well inside the estimated vocabulary size, unlikely when far outside.
 */
export function priorPKnown(frequencyRank: number, vocabEstimate: number): number {
  if (vocabEstimate <= 0) return P_MIN;
  const steepness = 4;
  return clamp(sigmoid((steepness * (vocabEstimate - frequencyRank)) / vocabEstimate));
}

export function newUserWord(lemma: string, pKnown: number): UserWord {
  return { lemma, pKnown: clamp(pKnown), encounters: 0, taps: 0 };
}

/** Apply one event and return the updated word. Does not mutate the input. */
export function applyEvent(word: UserWord, event: WordEvent): UserWord {
  const pKnown = clamp(sigmoid(logit(clamp(word.pKnown)) + EVENT_WEIGHTS[event.type]));
  const met = event.type === "read_past" || event.type === "tap";
  return {
    ...word,
    pKnown,
    encounters: word.encounters + (met ? 1 : 0),
    taps: word.taps + (event.type === "tap" ? 1 : 0),
  };
}

/** Replay events in time order. This is how the server rebuilds state from synced events. */
export function replay(initial: UserWord, events: WordEvent[]): UserWord {
  return [...events].sort((a, b) => a.at - b.at).reduce(applyEvent, initial);
}

/** What the reader shows for a word. */
export function displayState(word: UserWord | undefined): WordState {
  if (!word) return "new";
  if (word.saved === "ignored") return "ignored";
  if (word.saved === "learning") return "learning";
  if (word.pKnown >= KNOWN_THRESHOLD) return "known";
  return word.encounters > 0 ? "learning" : "new";
}
