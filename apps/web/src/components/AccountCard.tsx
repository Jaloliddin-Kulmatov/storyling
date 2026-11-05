"use client";

import Link from "next/link";
import type { LangCode } from "@storyling/core";
import { signOut, syncNow, useAccount } from "@/lib/account";
import { AuthForm } from "@/components/AuthForm";

/** Sign in / create an account so progress follows the learner across devices and counts on the leaderboard. */
export function AccountCard({ lang }: { lang: LangCode }) {
  const a = useAccount();

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
          {a.user.admin && <Link className="btn sm" href={`/${lang}/admin`}>Review stories</Link>}
        </div>
      </div>
    );

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <p className="muted small" style={{ margin: "0 0 12px" }}>Keep your progress on every device and join the leaderboard. Free.</p>
      <AuthForm start="login" />
    </div>
  );
}
