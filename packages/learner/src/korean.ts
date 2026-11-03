/**
 * Korean reading aids: romanization (Revised Romanization, simplified: letter by letter plus the most common
 * sound changes) and a split of a word into its stem and the particle or ending attached to it.
 */
const INITIAL = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
const MEDIAL = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"];
const FINAL = ["", "k", "k", "k", "n", "n", "n", "t", "l", "k", "m", "l", "l", "l", "p", "l", "m", "p", "p", "t", "t", "ng", "t", "t", "k", "t", "p", "t"];
// The final consonant moves to the next syllable when that one starts with ㅇ (silent): 먹어 → meogeo.
const FINAL_LINK = ["", "g", "kk", "ks", "n", "nj", "nh", "d", "r", "lg", "lm", "lb", "ls", "lt", "lp", "lh", "m", "b", "bs", "s", "ss", "", "j", "ch", "k", "t", "p", "h"];

const isSyllable = (c: number) => c >= 0xac00 && c <= 0xd7a3;

export function romanize(text: string): string {
  let out = "";
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const code = chars[i]!.codePointAt(0)!;
    if (!isSyllable(code)) {
      out += chars[i];
      continue;
    }
    const s = code - 0xac00;
    const ini = Math.floor(s / 588);
    const med = Math.floor((s % 588) / 28);
    const fin = s % 28;
    out += INITIAL[ini]! + MEDIAL[med]!;
    if (!fin) continue;
    const next = chars[i + 1]?.codePointAt(0);
    const nextSilent = next !== undefined && isSyllable(next) && Math.floor((next - 0xac00) / 588) === 11;
    out += nextSilent ? FINAL_LINK[fin]! : FINAL[fin]!;
  }
  // Nasal assimilation in the most common cases (합니다 → hamnida, 국물 → gungmul).
  return out.replace(/pn/g, "mn").replace(/kn/g, "ngn").replace(/km/g, "ngm").replace(/tn/g, "nn").replace(/lr/g, "ll").replace(/nr/g, "ll");
}

/** Common particles and endings, longest first, with a short English gloss. */
const SUFFIXES: [string, string][] = [
  ["었어요", "past tense, polite"], ["았어요", "past tense, polite"], ["였어요", "past tense, polite"], ["했어요", "did (past tense, polite)"],
  ["습니다", "formal polite ending"], ["ㅂ니다", "formal polite ending"], ["겠어요", "will / intend to (polite)"],
  ["을 거예요", "will (future, polite)"], ["ㄹ 거예요", "will (future, polite)"], ["거예요", "will (future, polite)"],
  ["어서", "so; and then"], ["아서", "so; and then"], ["해서", "so; and then"], ["지만", "but"], ["으면", "if; when"], ["면", "if; when"],
  ["에서", "at / in (where something happens); from"], ["에게", "to (a person)"], ["한테", "to (a person, spoken)"], ["까지", "until; up to"], ["부터", "from (a time)"],
  ["처럼", "like"], ["보다", "than"], ["하고", "and; with"], ["으로", "by; toward; as"], ["어요", "present tense, polite"], ["아요", "present tense, polite"], ["해요", "does (polite)"],
  ["예요", "is (polite)"], ["이에요", "is (polite)"], ["고", "and"], ["요", "polite ending"],
  ["은", "topic particle"], ["는", "topic particle"], ["이", "subject particle"], ["가", "subject particle"], ["을", "object particle"], ["를", "object particle"],
  ["에", "at / to / in (place or time)"], ["의", "possessive ('s)"], ["도", "also; too"], ["만", "only"], ["와", "and; with"], ["과", "and; with"], ["로", "by; toward; as"],
];

export interface KoreanSplit {
  stem: string;
  ending: string;
  gloss?: string;
}

/**
 * Split a word as written (surface) against its dictionary form (lemma): 준호는 / 준호 → 준호 + 는 (topic particle);
 * 갔어요 / 가다 → 가 + ㅆ어요. Returns undefined when nothing is attached.
 */
export function splitKorean(surface: string, lemma: string): KoreanSplit | undefined {
  const base = lemma.endsWith("다") && lemma.length > 1 ? lemma.slice(0, -1) : lemma;
  let k = 0;
  while (k < base.length && k < surface.length && surface[k] === base[k]) k++;
  if (k === 0 || k >= surface.length) return undefined;
  const stem = surface.slice(0, k);
  const ending = surface.slice(k);
  const gloss = SUFFIXES.find(([s]) => ending === s || ending.endsWith(s))?.[1];
  return { stem, ending, ...(gloss ? { gloss } : {}) };
}
