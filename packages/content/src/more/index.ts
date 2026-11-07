import type { RawEntry, RawStory } from "../raw";
import * as de from "./de";
import * as deReading from "./de-reading";
import * as deReading2 from "./de-reading2";
import * as deReading3 from "./de-reading3";
import * as en from "./en";
import * as en2 from "./en2";
import * as esReading from "./es-reading";
import * as koReading from "./ko-reading";
import * as es2 from "./es2";
import * as fr2 from "./fr2";
import * as de2 from "./de2";
import * as de3 from "./de3";
import * as de4 from "./de4";
import * as pt2 from "./pt2";
import * as ru2 from "./ru2";
import * as zh2 from "./zh2";
import * as ja2 from "./ja2";
import * as ko2 from "./ko2";
import * as ko3 from "./ko3";
import * as en3 from "./en3";
import * as fr3 from "./fr3";
import * as pt3 from "./pt3";
import * as ru3 from "./ru3";
import * as zh3 from "./zh3";
import * as ja3 from "./ja3";
import * as es3 from "./es3";
import * as es from "./es";
import * as fr from "./fr";
import * as tr from "./tr";
import * as tr2 from "./tr2";
import * as ja from "./ja";
import * as ko from "./ko";
import * as pt from "./pt";
import * as ru from "./ru";
import * as zh from "./zh";

interface Pack {
  lang: string;
  dict: Record<string, RawEntry>;
  stories: RawStory[];
}

/**
 * Extra content packs. "Everyday" is the same 10 stories written in each language; "reading" packs are
 * longer B1–C1 texts on history, science, culture and people. Pack glossaries only fill gaps:
 * the base dictionary in data.ts wins on conflicts.
 */
const PACKS: Pack[] = [
  { lang: "en", ...en },
  { lang: "es", ...es },
  { lang: "fr", ...fr },
  { lang: "de", ...de },
  { lang: "tr", ...tr },
  { lang: "pt", ...pt },
  { lang: "ru", ...ru },
  { lang: "zh", ...zh },
  { lang: "ja", ...ja },
  { lang: "ko", ...ko },
  { lang: "de", ...deReading },
  { lang: "de", ...deReading2 },
  { lang: "de", ...deReading3 },
  { lang: "en", ...en2 },
  { lang: "es", ...esReading },
  { lang: "ko", ...koReading },
  { lang: "es", ...es2 },
  { lang: "fr", ...fr2 },
  { lang: "de", ...de2 },
  { lang: "de", ...de3 },
  { lang: "de", ...de4 },
  { lang: "pt", ...pt2 },
  { lang: "ru", ...ru2 },
  { lang: "zh", ...zh2 },
  { lang: "ja", ...ja2 },
  { lang: "ko", ...ko2 },
  { lang: "ko", ...ko3 },
  { lang: "tr", ...tr2 },
  { lang: "es", ...es3 },
  { lang: "ja", ...ja3 },
  { lang: "zh", ...zh3 },
  { lang: "ru", ...ru3 },
  { lang: "pt", ...pt3 },
  { lang: "fr", ...fr3 },
  { lang: "en", ...en3 },
];

/** Languages that have the 10-story everyday pack. */
export const EVERYDAY_LANGS = ["en", "es", "fr", "de", "tr", "pt", "ru", "zh", "ja", "ko"];

export const MORE_STORIES: RawStory[] = PACKS.flatMap((p) => p.stories);
export const MORE_DICT: Record<string, Record<string, RawEntry>> = {};
for (const p of PACKS) MORE_DICT[p.lang] = { ...p.dict, ...MORE_DICT[p.lang] };
