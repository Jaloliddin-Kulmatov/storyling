import type { CatalogStory } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { useEffect, useSyncExternalStore } from "react";

/** A story an admin approved. Reads like a catalog story and carries its own glossary. */
export interface PublishedStory extends CatalogStory {
  /** lemma → [part of speech, English meaning, reading?] */
  dict: Record<string, [string, string] | [string, string, string]>;
  publishedAt: number;
}

const NONE: PublishedStory[] = [];
const byLang = new Map<LangCode, PublishedStory[]>();
const started = new Set<LangCode>();
const listeners = new Set<() => void>();
// The website calls its own API; the phone app sets its server address with configurePublished.
let base: string | null = typeof document === "undefined" ? null : "";

export function configurePublished(url: string | undefined) {
  base = url ?? null;
}

const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l));

function add(lang: LangCode, stories: PublishedStory[]) {
  const ids = new Set(stories.map((s) => s.id));
  byLang.set(lang, [...stories, ...(byLang.get(lang) ?? []).filter((s) => !ids.has(s.id))].sort((a, b) => b.publishedAt - a.publishedAt));
  listeners.forEach((l) => l());
}

async function fetchStories(query: string): Promise<PublishedStory[]> {
  if (base === null) return NONE;
  const res = await fetch(`${base}/api/stories?${query}`);
  if (!res.ok) return NONE;
  return ((await res.json()) as { stories?: PublishedStory[] }).stories ?? NONE;
}

/** The newest approved stories, fetched once per visit. */
export function usePublished(lang: LangCode): PublishedStory[] {
  useEffect(() => {
    if (started.has(lang) || base === null) return;
    started.add(lang);
    fetchStories(`lang=${lang}`).then((s) => add(lang, s)).catch(() => started.delete(lang));
  }, [lang]);
  return useSyncExternalStore(subscribe, () => byLang.get(lang) ?? NONE, () => NONE);
}

/** Fetch one approved story by id, for a link to a story older than the newest list. */
export async function loadPublishedStory(lang: LangCode, id: string): Promise<boolean> {
  if (!id.includes("-daily-")) return false;
  const found = await fetchStories(`lang=${lang}&id=${encodeURIComponent(id)}`).catch(() => NONE);
  if (found.length) add(lang, found);
  return found.length > 0;
}
