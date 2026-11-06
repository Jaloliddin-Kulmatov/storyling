import type { CatalogStory } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { useEffect, useSyncExternalStore } from "react";

/** A free-to-use photo and who to credit. */
export interface StoryPhoto {
  url: string;
  author: string;
  license: string;
  /** The photo's page at its source. */
  page: string;
}

/** A story an admin approved. Reads like a catalog story and carries its own glossary. */
export interface PublishedStory extends CatalogStory {
  /** lemma → [part of speech, English meaning, reading?] */
  dict: Record<string, [string, string] | [string, string, string]>;
  publishedAt: number;
  cover?: StoryPhoto;
}

const NONE: PublishedStory[] = [];
const byLang = new Map<LangCode, PublishedStory[]>();
const checkedAt = new Map<LangCode, number>();
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
  if (!res.ok) throw new Error(`Stories ${res.status}`);
  return ((await res.json()) as { stories?: PublishedStory[] }).stories ?? NONE;
}

/** Replace the list with what's published now, at most every 30 seconds, so unpublished stories go too. */
function refresh(lang: LangCode) {
  if (base === null || Date.now() - (checkedAt.get(lang) ?? 0) < 30_000) return;
  checkedAt.set(lang, Date.now());
  fetchStories(`lang=${lang}`)
    .then((s) => {
      byLang.set(lang, s);
      listeners.forEach((l) => l());
    })
    .catch(() => checkedAt.delete(lang));
}

/** The newest approved stories: checked on opening a page and on coming back to the tab. */
export function usePublished(lang: LangCode): PublishedStory[] {
  useEffect(() => {
    refresh(lang);
    if (typeof document === "undefined") return;
    const again = () => {
      if (document.visibilityState === "visible") refresh(lang);
    };
    document.addEventListener("visibilitychange", again);
    window.addEventListener("focus", again);
    return () => {
      document.removeEventListener("visibilitychange", again);
      window.removeEventListener("focus", again);
    };
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
