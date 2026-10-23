"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useSettings } from "@/lib/learner";

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
let loaded = false;
let timer: ReturnType<typeof setTimeout> | undefined;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    for (const [k, v] of Object.entries(JSON.parse(localStorage.getItem(STORE) ?? "{}") as Record<string, string>)) mem.set(k, v);
  } catch { /* storage may be blocked */ }
}
function save() {
  try {
    const entries = [...mem.entries()].slice(-4000);
    localStorage.setItem(STORE, JSON.stringify(Object.fromEntries(entries)));
  } catch { /* full or blocked: keep in memory */ }
}

const k = (target: string, text: string) => `${target}\u0001${text}`;

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
        const res = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target, texts: chunk }) });
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

/**
 * Show English texts in the learner's chosen language. Returns the English text until the translation arrives
 * (or when translation is unavailable), so the screen never goes blank.
 */
export function useTranslated(texts: (string | undefined)[]): { texts: (string | undefined)[]; lang: string } {
  const [{ translateTo }] = useSettings();
  load();
  useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), () => version, () => 0);
  const key = texts.join("\u0002");
  useEffect(() => {
    if (translateTo !== "en") want(translateTo, texts.filter((t): t is string => !!t && t.length <= 300));
  }, [translateTo, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const out = translateTo === "en" ? texts : texts.map((t) => (t ? mem.get(k(translateTo, t)) ?? t : t));
  return { texts: out, lang: translateTo === "en" ? "en" : mem.has(k(translateTo, texts.find(Boolean) ?? "")) ? translateTo : "en" };
}
