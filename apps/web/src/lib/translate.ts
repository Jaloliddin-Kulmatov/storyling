"use client";

import { configureTranslation, useTranslated } from "@storyling/learner";

if (typeof window !== "undefined") configureTranslation({ storage: window.localStorage, endpoint: "/api/translate" });

export { useTranslated };

/** Drop-in for a piece of English text: shows it in the learner's chosen language. */
export function Tr({ children }: { children?: string }) {
  const t = useTranslated([children]);
  return t.texts[0] ?? null;
}
