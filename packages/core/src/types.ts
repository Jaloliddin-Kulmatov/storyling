export type LangCode = "en" | "es" | "fr" | "de" | "zh" | "ja" | "ko" | "it" | "pt" | "ru";

/** One token of a sentence. Punctuation tokens have no lemma. */
export interface Token {
  /** The text exactly as written, e.g. "갔어요". */
  surface: string;
  /** Dictionary form, e.g. "가다". Absent for punctuation. */
  lemma?: string;
  /** Names and numbers don't count toward coverage. */
  isName?: boolean;
}

export interface Sentence {
  tokens: Token[];
  /** English translation. */
  translation?: string;
}

export interface Story {
  id: string;
  lang: LangCode;
  sentences: Sentence[];
  seriesId?: string;
  episode?: number;
  topics?: string[];
}

export type WordState = "new" | "learning" | "known" | "ignored";

/** What the app remembers about one lemma for one learner. */
export interface UserWord {
  lemma: string;
  /** Probability the learner knows the word, 0–1. */
  pKnown: number;
  /** Set by the learner: saved for review, or ignored. Overrides pKnown for display. */
  saved?: "learning" | "ignored";
  /** Times met in a story (with or without a tap). */
  encounters: number;
  /** Times the learner tapped it for a meaning. */
  taps: number;
}

/** Everything that changes a word's score. Events are append-only; state is derived from them. */
export type WordEventType =
  | "read_past" //  read the sentence and didn't tap the word
  | "tap" //        looked the word up
  | "review_again"
  | "review_good"
  | "review_easy"
  | "retell_correct" // used correctly in a retell
  | "shadow_clear"; //  said clearly while shadowing

export interface WordEvent {
  type: WordEventType;
  lemma: string;
  at: number; // epoch ms
}
