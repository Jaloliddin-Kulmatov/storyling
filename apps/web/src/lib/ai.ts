"use client";

import { useEffect, useState } from "react";

let status: Promise<boolean> | null = null;

/** Whether the server has AI features turned on (GROQ_API_KEY or ANTHROPIC_API_KEY set). Cached per page load. */
export function useAiEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    status ??= fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d: { enabled?: boolean }) => !!d.enabled)
      .catch(() => false);
    let alive = true;
    status.then((v) => alive && setEnabled(v));
    return () => {
      alive = false;
    };
  }, []);
  return enabled;
}

export async function callAi<T>(path: "explain" | "prepare" | "story" | "translate", body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`/api/ai/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "The AI request failed.");
  return data;
}
