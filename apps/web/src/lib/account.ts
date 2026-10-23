"use client";

import { dayPoints, exportStore, mergeIntoStore } from "@storyling/learner";
import { useEffect, useSyncExternalStore } from "react";

export interface AccountUser {
  id: string;
  email: string;
  name: string;
}
interface State {
  loaded: boolean;
  enabled: boolean;
  user: AccountUser | null;
  syncing: boolean;
  lastSync: number | null;
  error: string | null;
}

let state: State = { loaded: false, enabled: false, user: null, syncing: false, lastSync: null, error: null };
const listeners = new Set<() => void>();
const set = (p: Partial<State>) => {
  state = { ...state, ...p };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));
const SERVER: State = { loaded: false, enabled: false, user: null, syncing: false, lastSync: null, error: null };

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

let loading: Promise<void> | null = null;
export function loadAccount(): Promise<void> {
  return (loading ??= call<{ enabled: boolean; user: AccountUser | null }>("/api/auth/me")
    .then((d) => set({ loaded: true, enabled: d.enabled, user: d.user }))
    .catch(() => set({ loaded: true, enabled: false })));
}

let lastPushed = "";

/** Pull the server copy, merge it into this device, then push the merged result back. */
export async function syncNow() {
  if (!state.user || state.syncing) return;
  set({ syncing: true, error: null });
  try {
    const remote = await call<{ data: string | null }>("/api/sync");
    if (remote.data) mergeIntoStore(remote.data);
    const data = exportStore();
    await call("/api/sync", { method: "PUT", body: JSON.stringify({ data, points: dayPoints() }) });
    lastPushed = data;
    set({ syncing: false, lastSync: Date.now() });
  } catch (e) {
    set({ syncing: false, error: e instanceof Error ? e.message : "Sync failed." });
  }
}

async function pushIfChanged() {
  if (!state.user || state.syncing) return;
  const data = exportStore();
  if (data === lastPushed) return;
  try {
    await call("/api/sync", { method: "PUT", body: JSON.stringify({ data, points: dayPoints() }) });
    lastPushed = data;
    set({ lastSync: Date.now(), error: null });
  } catch (e) {
    set({ error: e instanceof Error ? e.message : "Sync failed." });
  }
}

export async function signIn(mode: "login" | "signup", body: { email: string; password: string; name?: string }) {
  const d = await call<{ user: AccountUser }>(`/api/auth/${mode}`, { method: "POST", body: JSON.stringify(body) });
  set({ user: d.user });
  await syncNow();
}

export async function signOut() {
  await call("/api/auth/logout", { method: "POST" }).catch(() => {});
  lastPushed = "";
  set({ user: null, lastSync: null });
}

export function useAccount() {
  useEffect(() => void loadAccount(), []);
  return useSyncExternalStore(subscribe, () => state, () => SERVER);
}

/** Mount once: syncs when signed in, then every 30 seconds and when the tab is hidden. */
export function useSyncAgent() {
  const { user } = useAccount();
  useEffect(() => {
    if (!user) return;
    void syncNow();
    const t = setInterval(() => void pushIfChanged(), 30000);
    const hide = () => document.visibilityState === "hidden" && void pushIfChanged();
    document.addEventListener("visibilitychange", hide);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}
