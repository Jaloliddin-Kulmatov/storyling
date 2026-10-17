/** Shapes of the hand-written seed data in data.ts. */
export interface RawLang {
  name: string;
  native: string;
  /** BCP-47 tag for speech, e.g. "ko-KR". */
  tts: string;
  /** macOS voice used to record the seed audio. */
  voice: string;
  levels: string[];
  /** Written without spaces between words (Chinese). */
  noSpace?: boolean;
}

/** [part of speech, English meaning] or, for Chinese, [pos, meaning, pinyin]. */
export type RawEntry = [string, string] | [string, string, string];

/** ["surface=lemma surface …", "English translation"]; English stories omit the translation. */
export type RawSentence = [string] | [string, string];

export interface RawStory {
  id: string;
  lang: string;
  level: string;
  cat: string;
  min: number;
  date: string;
  title: string;
  /** English title; empty for English stories. */
  tt: string;
  sents: RawSentence[];
}
