"use client";

import { useEffect, useRef, useState } from "react";
import { googleSignIn, requestReset, signIn } from "@/lib/account";

type Mode = "signup" | "login" | "forgot";
interface Providers { google: string | null; reset: boolean }

declare global {
  interface Window {
    google?: { accounts: { id: { initialize(o: { client_id: string; callback: (r: { credential: string }) => void }): void; renderButton(el: HTMLElement, o: Record<string, unknown>): void } } };
  }
}

let providers: Promise<Providers> | null = null;
const loadProviders = () => (providers ??= fetch("/api/auth/providers").then((r) => r.json() as Promise<Providers>).catch(() => ({ google: null, reset: false })));

let gis: Promise<void> | null = null;
const loadGis = () =>
  (gis ??= new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => fail(new Error("Google sign-in could not load."));
    document.head.appendChild(s);
  }));

/** Sign in / Register with Google or email, show-password, and "Forgot password?". Used on the Me page and in onboarding. */
export function AuthForm({ start = "signup", onSkip }: { start?: "signup" | "login"; onSkip?: () => void }) {
  const [mode, setMode] = useState<Mode>(start);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ text: string; switchTo?: Mode } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [prov, setProv] = useState<Providers>({ google: null, reset: false });
  const gBtn = useRef<HTMLDivElement>(null);

  useEffect(() => { void loadProviders().then(setProv); }, []);
  useEffect(() => {
    if (!prov.google || mode === "forgot" || !gBtn.current) return;
    let alive = true;
    loadGis().then(() => {
      if (!alive || !gBtn.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: prov.google!,
        callback: ({ credential }) => {
          setBusy(true);
          googleSignIn(credential).catch((e: Error) => setErr({ text: e.message })).finally(() => setBusy(false));
        },
      });
      window.google.accounts.id.renderButton(gBtn.current, { theme: "outline", size: "large", shape: "pill", width: Math.min(400, gBtn.current.clientWidth || 320), text: mode === "signup" ? "signup_with" : "continue_with" });
    }).catch(() => {});
    return () => { alive = false; };
  }, [prov.google, mode]);

  const go = (m: Mode) => { setMode(m); setErr(null); setNote(null); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setNote(null);
    try {
      if (mode === "forgot") {
        await requestReset(form.email);
        setNote(`If ${form.email} has an account, a reset link is on its way. Check your inbox (and spam).`);
      } else await signIn(mode, form);
    } catch (x) {
      const text = x instanceof Error ? x.message : "Something went wrong.";
      setErr({ text, switchTo: /No account/.test(text) ? "signup" : /already exists/.test(text) ? "login" : /Wrong password/.test(text) && prov.reset ? "forgot" : undefined });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="auth stack" onSubmit={submit}>
      {mode !== "forgot" ? (
        <div className="seg auth-tabs" role="tablist" aria-label="Account">
          <button type="button" role="tab" aria-selected={mode === "login"} aria-pressed={mode === "login"} onClick={() => go("login")}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === "signup"} aria-pressed={mode === "signup"} onClick={() => go("signup")}>Register</button>
        </div>
      ) : (
        <div>
          <b style={{ fontSize: 18 }}>Reset your password</b>
          <p className="muted small" style={{ margin: "4px 0 0" }}>Enter your email and we'll send you a link to set a new password.</p>
        </div>
      )}

      {prov.google && mode !== "forgot" && (
        <>
          <div ref={gBtn} className="g-btn" />
          <div className="or"><span>or with email</span></div>
        </>
      )}

      {mode === "signup" && (
        <label className="field">Name<input className="input" autoComplete="nickname" maxLength={40} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Shown on the leaderboard" /></label>
      )}
      <label className="field">Email<input className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      {mode !== "forgot" && (
        <label className="field">
          <span className="spread">Password{mode === "login" && prov.reset && <button type="button" className="link-btn" onClick={() => go("forgot")}>Forgot password?</button>}</span>
          <span className="pw">
            <input className="input" type={show ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
            <button type="button" className="pw-eye" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
          </span>
        </label>
      )}

      {err && (
        <p role="alert" className="small auth-err">
          {err.text}{" "}
          {err.switchTo && <button type="button" className="link-btn" onClick={() => go(err.switchTo!)}>{err.switchTo === "signup" ? "Register instead" : err.switchTo === "login" ? "Sign in instead" : "Reset password"}</button>}
        </p>
      )}
      {note && <p role="status" className="small auth-note">{note}</p>}

      <button className="btn primary block" disabled={busy} style={{ minHeight: 50 }}>
        {busy ? "…" : mode === "signup" ? "Create account" : mode === "login" ? "Sign in" : "Send reset link"}
      </button>
      {mode === "forgot" && <button type="button" className="btn ghost sm" style={{ justifySelf: "center" }} onClick={() => go("login")}>Back to sign in</button>}
      {onSkip && mode !== "forgot" && <button type="button" className="btn ghost sm" onClick={onSkip} style={{ justifySelf: "center" }}>Continue without an account</button>}
    </form>
  );
}
