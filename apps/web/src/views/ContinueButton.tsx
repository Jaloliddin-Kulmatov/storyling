"use client";

import { language } from "@storyling/content";
import Link from "next/link";
import { useCurrentLanguage, useHydrated } from "@/lib/learner";

/** "Continue in Korean" for returning learners, "Start reading" for new ones. */
export function ContinueButton() {
  const hydrated = useHydrated();
  const lang = useCurrentLanguage();
  if (hydrated && lang) {
    return <Link className="btn primary" href={`/${lang}`}>Continue in {language(lang).name}</Link>;
  }
  return <Link className="btn" href="/start">Start reading</Link>;
}
