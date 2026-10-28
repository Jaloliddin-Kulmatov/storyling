"use client";

import { useEffect, useState } from "react";

let cache: Promise<Record<string, number>> | null = null;

/** Reading counts per story from the server, or an empty object when the site has no database. */
export function useViews(): Record<string, number> {
  const [views, setViews] = useState<Record<string, number>>({});
  useEffect(() => {
    cache ??= fetch("/api/views")
      .then((r) => (r.ok ? r.json() : { views: {} }))
      .then((d: { views?: Record<string, number> }) => d.views ?? {})
      .catch(() => ({}));
    let alive = true;
    cache.then((v) => alive && setViews(v));
    return () => { alive = false; };
  }, []);
  return views;
}

/** Count one open of a story, at most once per browser tab session. */
export function countView(id: string) {
  try {
    if (sessionStorage.getItem(`v:${id}`)) return;
    sessionStorage.setItem(`v:${id}`, "1");
  } catch { /* storage blocked: count anyway */ }
  void fetch("/api/views", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
}

export const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n));
