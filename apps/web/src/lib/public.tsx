import { language, languages, lookup, stories, type CatalogStory } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import Link from "next/link";
import type { ReactNode } from "react";

/** Languages with public, indexable pages (the ones open to visitors). */
export const PUBLIC_LANGS: LangCode[] = languages.map((l) => l.code);
export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storyling.vercel.app";

export const publicStories = (lang: LangCode): CatalogStory[] => stories.filter((s) => s.lang === lang);
export const sentenceText = (s: CatalogStory["sentences"][number]) =>
  s.tokens.map((t, i) => (i > 0 && !/^[\p{P}]+$/u.test(t.surface) ? " " : "") + t.surface).join("").replace(/ ([„(])/g, " $1");

/** Content words of a story with meanings, for the glossary on the public page. */
export function glossary(story: CatalogStory) {
  const seen = new Map<string, { display: string; meaning: string; pos: string }>();
  for (const s of story.sentences)
    for (const t of s.tokens) {
      if (!t.lemma || t.isName || seen.has(t.lemma)) continue;
      const e = lookup(story.lang, t.lemma);
      if (e && ["noun", "verb", "adjective", "adverb"].includes(e.pos)) seen.set(t.lemma, { display: e.display, meaning: e.meaning, pos: e.pos });
    }
  return [...seen.values()];
}

/** A plain, server-rendered page frame for search engines and first-time visitors. */
export function PublicFrame({ lang, children }: { lang: LangCode; children: ReactNode }) {
  const meta = language(lang);
  return (
    <div className="pub">
      <header className="pub-head">
        <Link href="/" className="pub-brand">📖 Storyling</Link>
        <nav className="row">
          <Link href={`/learn/${lang}`}>{meta.name} stories</Link>
          <Link className="btn primary sm" href={`/start?lang=${lang}`}>Start free</Link>
        </nav>
      </header>
      <main className="pub-main">{children}</main>
      <footer className="pub-foot small muted">Storyling: learn {meta.name} by reading short stories with audio, translations and games.</footer>
    </div>
  );
}
