"use client";

import Link from "next/link";
import { useState } from "react";
import type { LangCode } from "@storyling/core";
import { signIn, signOut, syncNow, useAccount } from "@/lib/account";

/** Sign in / create an account so progress follows the learner across devices and counts on the leaderboard. */
export function AccountCard({ lang }: { lang: LangCode }) {
  const a = useAccount();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!a.loaded || !a.enabled) return null;

  if (a.user)
    return (
      <div className="card" style={{ marginTop: 16 }}>
        <div className="spread">
          <span><b>{a.user.name}</b> <span className="muted small">{a.user.email}</span></span>
          <button className="btn ghost sm" onClick={() => void signOut()}>Sign out</button>
        </div>
        <p className="muted small" style={{ margin: "8px 0 12px" }}>
          {a.syncing ? "Syncing…" : a.error ? `Sync problem: ${a.error}` : a.lastSync ? `Synced ${new Date(a.lastSync).toLocaleTimeString()}. Your words, stories and scores follow you to any device.` : "Your progress is saved to your account."}
        </p>
        <div className="row">
          <button className="btn sm" disabled={a.syncing} onClick={() => void syncNow()}>Sync now</button>
          <Link className="btn sm" href={`/${lang}/leaderboard`}>Leaderboard</Link>
        </div>
      </div>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await signIn(mode, form);
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card stack" style={{ marginTop: 16 }} onSubmit={submit}>
      <div className="spread">
        <b>{mode === "signup" ? "Create an account" : "Sign in"}</b>
        <button type="button" className="btn ghost sm" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setErr(null); }}>
          {mode === "signup" ? "I have an account" : "Create an account"}
        </button>
      </div>
      <p className="muted small" style={{ margin: 0 }}>Keep your progress on every device and join the leaderboard. Free.</p>
      {mode === "signup" && <input className="input" placeholder="Display name (shown on the leaderboard)" aria-label="Display name" maxLength={40} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
      <input className="input" type="email" autoComplete="email" placeholder="Email" aria-label="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input className="input" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="Password (8+ characters)" aria-label="Password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {err && <span role="alert" className="small" style={{ color: "var(--danger, #c0392b)" }}>{err}</span>}
      <button className="btn primary block" disabled={busy}>{busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}</button>
    </form>
  );
}
