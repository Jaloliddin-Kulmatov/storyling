import { useEffect, useSyncExternalStore } from "react";
import { useSettings, type KeyValueStorage } from "./index";

/**
 * Show English texts (sentence translations, word meanings) in the learner's chosen language.
 * Shared by web and phone: each platform says where the cache lives and which endpoint translates.
 */
const STORE = "storyling.tr.v1";
const mem = new Map<string, string>();
const pending = new Set<string>();
const failed = new Set<string>();
let version = 0;
const listeners = new Set<() => void>();
const bump = () => {
  version++;
  listeners.forEach((l) => l());
};
let storage: KeyValueStorage | null = null;
let endpoint: string | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

/** Call once at startup. Without an endpoint, texts stay in English. */
export function configureTranslation(opts: { storage?: KeyValueStorage; endpoint?: string }) {
  storage = opts.storage ?? null;
  endpoint = opts.endpoint ?? null;
  try {
    for (const [k, v] of Object.entries(JSON.parse(storage?.getItem(STORE) ?? "{}") as Record<string, string>)) mem.set(k, v);
  } catch {
    /* unreadable cache: start empty */
  }
}

const k = (target: string, text: string) => `${target}\u0001${text}`;

function save() {
  try {
    storage?.setItem(STORE, JSON.stringify(Object.fromEntries([...mem.entries()].slice(-4000))));
  } catch {
    /* full or blocked: keep in memory */
  }
}

async function flush() {
  const byTarget = new Map<string, string[]>();
  for (const key of pending) {
    const [target, text] = key.split("\u0001") as [string, string];
    byTarget.set(target, [...(byTarget.get(target) ?? []), text]);
  }
  pending.clear();
  for (const [target, texts] of byTarget)
    for (let i = 0; i < texts.length; i += 40) {
      const chunk = texts.slice(i, i + 40);
      try {
        const res = await fetch(endpoint!, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target, texts: chunk }) });
        const d = (await res.json()) as { texts?: string[] };
        if (!res.ok || !d.texts) throw new Error("failed");
        chunk.forEach((t, j) => d.texts![j] && mem.set(k(target, t), d.texts![j]!));
      } catch {
        chunk.forEach((t) => failed.add(k(target, t)));
      }
    }
  save();
  bump();
}

function want(target: string, texts: string[]) {
  if (!endpoint) return;
  let added = false;
  for (const t of texts) {
    const key = k(target, t);
    if (!mem.has(key) && !failed.has(key) && !pending.has(key)) {
      pending.add(key);
      added = true;
    }
  }
  if (added) {
    clearTimeout(timer);
    timer = setTimeout(() => void flush(), 120);
  }
}

/** The texts in the learner's language; the English text stays until a translation arrives or if none can be had. */
export function useTranslated(texts: (string | undefined)[]): { texts: (string | undefined)[]; lang: string } {
  const [{ translateTo }] = useSettings();
  useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), () => version, () => 0);
  const key = texts.join("\u0002");
  useEffect(() => {
    if (translateTo !== "en") want(translateTo, texts.filter((t): t is string => !!t && t.length <= 300));
  }, [translateTo, key]); // eslint-disable-line react-hooks/exhaustive-deps
  return { texts: translateTo === "en" ? texts : texts.map((t) => (t ? mem.get(k(translateTo, t)) ?? t : t)), lang: translateTo };
}
