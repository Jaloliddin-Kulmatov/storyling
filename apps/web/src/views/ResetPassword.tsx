"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { resetPassword } from "@/lib/account";

export function ResetPassword() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await resetPassword(token, pw);
      router.replace("/de/progress");
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="pub">
      <header className="pub-head"><Link href="/" className="pub-brand">📖 Storyling</Link></header>
      <main className="pub-main" style={{ maxWidth: 440 }}>
        <form className="card stack" onSubmit={submit}>
          <h1 style={{ fontSize: 26 }}>Set a new password</h1>
          <label className="field">New password<input className="input" type="password" autoComplete="new-password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" /></label>
          {err && <p role="alert" className="small auth-err">{err} <Link href="/de/progress">Ask for a new link</Link></p>}
          <button className="btn primary block" disabled={busy || !token}>{busy ? "…" : "Save and sign in"}</button>
        </form>
      </main>
    </div>
  );
}
