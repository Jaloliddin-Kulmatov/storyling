import type { RawEntry, RawStory } from "../raw";
import * as de from "./de";
import * as deReading from "./de-reading";
import * as en from "./en";
import * as es from "./es";
import * as fr from "./fr";
import * as it from "./it";
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
  { lang: "it", ...it },
  { lang: "pt", ...pt },
  { lang: "ru", ...ru },
  { lang: "zh", ...zh },
  { lang: "ja", ...ja },
  { lang: "ko", ...ko },
  { lang: "de", ...deReading },
];

/** Languages that have the 10-story everyday pack. */
export const EVERYDAY_LANGS = ["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko"];

export const MORE_STORIES: RawStory[] = PACKS.flatMap((p) => p.stories);
export const MORE_DICT: Record<string, Record<string, RawEntry>> = {};
for (const p of PACKS) MORE_DICT[p.lang] = { ...p.dict, ...MORE_DICT[p.lang] };
