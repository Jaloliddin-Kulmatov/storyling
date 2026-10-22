/**
 * Dictation checking: the learner types what they heard; every expected word is marked as
 * matched or missed, ignoring case and punctuation. Languages written without spaces compare characters.
 */
export interface DictationWord {
  word: string;
  ok: boolean;
}

export interface DictationResult {
  words: DictationWord[];
  /** Share of expected words that were typed correctly, 0–100. */
  score: number;
}

const CLEAN = /[\p{P}\p{S}]/gu;

export function dictationTokens(text: string, noSpace: boolean): string[] {
  const clean = text.normalize("NFC").replace(CLEAN, " ");
  return noSpace ? [...clean.replace(/\s+/g, "")] : clean.split(/\s+/).filter(Boolean);
}

/** Longest-common-subsequence match, so one missing word does not mark everything after it wrong. */
export function checkDictation(expected: string, typed: string, noSpace = false): DictationResult {
  const a = dictationTokens(expected, noSpace);
  const b = dictationTokens(typed, noSpace).map((w) => w.toLocaleLowerCase());
  const lower = a.map((w) => w.toLocaleLowerCase());
  const n = a.length;
  const m = b.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) lcs[i]![j] = lower[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
  const ok = new Array<boolean>(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (lower[i] === b[j]) {
      ok[i] = true;
      i++;
      j++;
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) i++;
    else j++;
  }
  const hits = ok.filter(Boolean).length;
  return { words: a.map((word, k) => ({ word, ok: ok[k]! })), score: n ? Math.round((hits / n) * 100) : 100 };
}
