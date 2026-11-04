"use client";

import { language, languages, storiesFor } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { placementResult, placementWords, type PlacementWord } from "@storyling/learner";
import { useHydrated, useLearner, type Level } from "@/lib/learner";
import { Logo } from "@/components/ui";
import { FEATURED } from "@/views/Landing";
import { signIn, useAccount } from "@/lib/account";

const LEVELS: { level: Level; title: string; detail: (first: string) => string }[] = [
  { level: 0, title: "Just starting", detail: () => "I know a few words and can read the script." },
  { level: 1, title: "Some basics", detail: (first) => `Simple sentences are OK. Around ${first}.` },
  { level: 2, title: "Intermediate", detail: (first) => `${first} stories feel easy.` },
];

/** Step 1: pick a language. Step 2: pick a level (skipped for languages already started). */
export function Onboarding() {
  const params = useSearchParams();
  const router = useRouter();
  const preset = params.get("lang") as LangCode | null;
  // With a single language on offer, skip the language step and go straight to the level.
  const only = FEATURED.length === 1 ? FEATURED[0]! : null;
  const valid = preset && FEATURED.includes(preset) ? preset : only;
  const [lang, setLang] = useState<LangCode | null>(valid);
  const [level, setLevel] = useState<Level>(1);
  const [step, setStep] = useState(valid ? 1 : 0);
  const levelName = params.get("level");
  const account = useAccount();
  const [skipAuth, setSkipAuth] = useState(false);
  // Accounts come first when the site has them: sign in (progress follows you) or create an account.
  const needAuth = account.loaded && account.enabled && !account.user && !skipAuth;

  return (
    <div className="center">
      <div className="onb">
        <div className="spread" style={{ marginBottom: 28 }}>
          <Link href="/" className="logo"><Logo />Storyling</Link>
          {!only && <span className="muted small">Step {step + 1} of 2</span>}
        </div>
        {!account.loaded ? null : needAuth ? (
          <AuthStep onSkip={() => setSkipAuth(true)} />
        ) : step === 0 || !lang ? (
          <LanguageStep value={lang} onPick={(l) => setLang(l)} onNext={() => setStep(1)} />
        ) : (
          <LevelStep lang={lang} level={level} setLevel={setLevel} onBack={() => (only ? router.push("/") : setStep(0))} levelName={levelName} />
        )}
      </div>
    </div>
  );
}

function LanguageStep({ value, onPick, onNext }: { value: LangCode | null; onPick: (l: LangCode) => void; onNext: () => void }) {
  return (
    <div className="stack">
      <div>
        <h1 style={{ fontSize: "clamp(28px, 4.5vw, 40px)", fontWeight: 800 }}>Which language do you want to read?</h1>
        <p className="muted" style={{ fontSize: 17, marginTop: 8 }}>Explanations are in English. You can switch languages anytime.</p>
      </div>
      <div className="langs" role="radiogroup" aria-label="Languages">
        {languages.filter((l) => FEATURED.includes(l.code)).map((l) => (
          <button key={l.code} role="radio" aria-checked={value === l.code} aria-pressed={value === l.code} className="lang-opt" onClick={() => onPick(l.code)}>
            <span className="nat" lang={l.code}>{l.native}</span>
            <b>{l.name} {!FEATURED.includes(l.code) && <span className="pill">Beta</span>}</b>
            <span className="muted small">{storiesFor(l.code).length} stories · {l.levels[0]}–{l.levels[l.levels.length - 1]}</span>
          </button>
        ))}
      </div>
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn primary" disabled={!value} onClick={onNext}>
          {value ? `Continue with ${language(value).name}` : "Pick a language"}
        </button>
      </div>
    </div>
  );
}

function LevelStep({ lang, level, setLevel, onBack, levelName }: { lang: LangCode; level: Level; setLevel: (l: Level) => void; onBack: () => void; levelName?: string | null }) {
  const meta = language(lang);
  const learner = useLearner(lang);
  const hydrated = useHydrated();
  const router = useRouter();

  const [testing, setTesting] = useState(false);

  // From the landing page's level picker: start at that level and open its stories right away.
  useEffect(() => {
    if (!hydrated || !levelName) return;
    const i = meta.levels.indexOf(levelName);
    if (i < 0) return;
    if (!learner.started) learner.start((Math.min(i, 2)) as Level);
    else learner.select();
    router.replace(`/${lang}?level=${encodeURIComponent(levelName)}`);
  }, [hydrated, levelName]); // eslint-disable-line react-hooks/exhaustive-deps

  function go() {
    learner.start(level);
    router.push(`/${lang}`);
  }

  if (testing) {
    return (
      <WordTest
        lang={lang}
        onBack={() => setTesting(false)}
        onDone={(r) => {
          learner.start(r.level, r.known);
          router.push(`/${lang}`);
        }}
      />
    );
  }

  if (hydrated && learner.started) {
    return (
      <div className="stack">
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>Welcome back to {meta.name}</h1>
        <p className="muted">You already know {learner.knownCount} {meta.name} words here.</p>
        <div className="row">
          {FEATURED.length > 1 && <button className="btn ghost" onClick={onBack}>Pick another language</button>}
          <button className="btn primary" onClick={() => { learner.select(); router.push(`/${lang}`); }}>Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div>
        <h1 style={{ fontSize: "clamp(28px, 4.5vw, 40px)", fontWeight: 800 }}>How much {meta.name} do you know?</h1>
        <p className="muted" style={{ fontSize: 17, marginTop: 8 }}>This sets which words count as known at the start. Reading updates it from there.</p>
      </div>
      <div className="stack" role="radiogroup" aria-label="Level">
        {LEVELS.map((l) => (
          <button key={l.level} role="radio" aria-checked={level === l.level} aria-pressed={level === l.level} className="option" onClick={() => setLevel(l.level)}>
            <b style={{ fontSize: 17 }}>{l.title}</b>
            <span className="muted">{l.detail(meta.levels[0] ?? "")}</span>
          </button>
        ))}
      </div>
      <button className="box word-test" onClick={() => setTesting(true)}>
        <b>✨ Not sure? Take the 1-minute word test</b>
        <span className="muted small" style={{ display: "block" }}>Tick the words you know. We use your answers to pick stories that fit you.</span>
      </button>
      <div className="spread">
        <button className="btn ghost" onClick={onBack}>Back</button>
        <button className="btn primary" onClick={go}>Start reading</button>
      </div>
    </div>
  );
}

/** A yes/no word test: the learner ticks the words they know. */
function WordTest({ lang, onBack, onDone }: { lang: LangCode; onBack: () => void; onDone: (r: ReturnType<typeof placementResult>) => void }) {
  const meta = language(lang);
  const sample = useMemo<PlacementWord[]>(() => placementWords(lang), [lang]);
  const [ticked, setTicked] = useState<Set<string>>(() => new Set());
  const toggle = (l: string) => setTicked((t) => { const n = new Set(t); if (n.has(l)) n.delete(l); else n.add(l); return n; });

  return (
    <div className="stack">
      <div>
        <h1 style={{ fontSize: "clamp(26px, 4.5vw, 36px)", fontWeight: 800 }}>Which {meta.name} words do you know?</h1>
        <p className="muted" style={{ fontSize: 16, marginTop: 8 }}>Tap every word whose meaning you know. Skip the ones you are not sure about.</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {sample.map((w) => (
          <button key={w.lemma} className="chip" lang={lang} aria-pressed={ticked.has(w.lemma)} onClick={() => toggle(w.lemma)} style={{ fontSize: 19, padding: "8px 14px", fontFamily: "var(--f-read)" }}>
            {w.display}
          </button>
        ))}
      </div>
      <div className="spread">
        <button className="btn ghost" onClick={onBack}>Back</button>
        <button className="btn primary" onClick={() => onDone(placementResult(lang, sample, ticked))}>
          {ticked.size ? `Done, I know ${ticked.size}` : "I know none of these"}
        </button>
      </div>
    </div>
  );
}


/** First step: create an account or sign in, so progress is saved and follows the learner to any device. */
function AuthStep({ onSkip }: { onSkip: () => void }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
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
    <form className="stack" onSubmit={submit}>
      <div>
        <h1 style={{ fontSize: "clamp(28px, 4.5vw, 40px)", fontWeight: 800 }}>{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
        <p className="muted" style={{ fontSize: 17, marginTop: 8 }}>
          {mode === "signup" ? "Free. Your words, stories and streak are saved and follow you to any device." : "Sign in to continue where you left off."}
        </p>
      </div>
      <div className="seg auth-tabs" role="tablist" aria-label="Account">
        <button type="button" role="tab" aria-selected={mode === "signup"} aria-pressed={mode === "signup"} onClick={() => { setMode("signup"); setErr(null); }}>Register</button>
        <button type="button" role="tab" aria-selected={mode === "login"} aria-pressed={mode === "login"} onClick={() => { setMode("login"); setErr(null); }}>Sign in</button>
      </div>
      {mode === "signup" && (
        <label className="field">Name<input className="input" autoComplete="nickname" maxLength={40} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Shown on the leaderboard" /></label>
      )}
      <label className="field">Email<input className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label className="field">Password<input className="input" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /></label>
      {err && <p role="alert" className="small" style={{ margin: 0, color: "var(--danger, #c0392b)" }}>{err}</p>}
      <button className="btn primary block" disabled={busy} style={{ minHeight: 50 }}>{busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}</button>
      <button type="button" className="btn ghost sm" onClick={onSkip} style={{ justifySelf: "center" }}>Continue without an account</button>
    </form>
  );
}
