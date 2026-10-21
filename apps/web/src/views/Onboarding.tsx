"use client";

import { language, languages, storiesFor } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useHydrated, useLearner, type Level } from "@/lib/learner";
import { Logo } from "@/components/ui";

const LEVELS: { level: Level; title: string; detail: (first: string) => string }[] = [
  { level: 0, title: "Just starting", detail: () => "I know a few words and can read the script." },
  { level: 1, title: "Some basics", detail: (first) => `Simple sentences are OK. Around ${first}.` },
  { level: 2, title: "Intermediate", detail: (first) => `${first} stories feel easy.` },
];

/** Step 1: pick a language. Step 2: pick a level (skipped for languages already started). */
export function Onboarding() {
  const params = useSearchParams();
  const preset = params.get("lang") as LangCode | null;
  const valid = preset && languages.some((l) => l.code === preset) ? preset : null;
  const [lang, setLang] = useState<LangCode | null>(valid);
  const [level, setLevel] = useState<Level>(1);
  const [step, setStep] = useState(valid ? 1 : 0);

  return (
    <div className="center">
      <div className="onb">
        <div className="spread" style={{ marginBottom: 28 }}>
          <Link href="/" className="logo"><Logo />Storyling</Link>
          <span className="muted small">Step {step + 1} of 2</span>
        </div>
        {step === 0 || !lang ? (
          <LanguageStep value={lang} onPick={(l) => setLang(l)} onNext={() => setStep(1)} />
        ) : (
          <LevelStep lang={lang} level={level} setLevel={setLevel} onBack={() => setStep(0)} />
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
        {languages.map((l) => (
          <button key={l.code} role="radio" aria-checked={value === l.code} aria-pressed={value === l.code} className="lang-opt" onClick={() => onPick(l.code)}>
            <span className="nat" lang={l.code}>{l.native}</span>
            <b>{l.name}</b>
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

function LevelStep({ lang, level, setLevel, onBack }: { lang: LangCode; level: Level; setLevel: (l: Level) => void; onBack: () => void }) {
  const meta = language(lang);
  const learner = useLearner(lang);
  const hydrated = useHydrated();
  const router = useRouter();

  function go() {
    learner.start(level);
    router.push(`/${lang}`);
  }

  if (hydrated && learner.started) {
    return (
      <div className="stack">
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>Welcome back to {meta.name}</h1>
        <p className="muted">You already know {learner.knownCount} {meta.name} words here.</p>
        <div className="row">
          <button className="btn ghost" onClick={onBack}>Pick another language</button>
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
      <div className="spread">
        <button className="btn ghost" onClick={onBack}>Back</button>
        <button className="btn primary" onClick={go}>Start reading</button>
      </div>
    </div>
  );
}
