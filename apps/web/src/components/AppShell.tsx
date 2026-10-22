"use client";

import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useHydrated, useLearner, useSettings } from "@/lib/learner";
import { Icon, Logo } from "./ui";

const NAV = [
  { href: "", label: "Home", icon: Icon.home },
  { href: "/words", label: "Notebook", icon: Icon.notebook },
  { href: "/watch", label: "Watch", icon: Icon.video },
  { href: "/practice", label: "Practice", icon: Icon.practice },
  { href: "/dictionary", label: "Dictionary", icon: Icon.dict },
  { href: "/progress", label: "Me", icon: Icon.me },
] as const;

// Phones get five tabs; Dictionary is reached from the Notebook there.
const TABS = NAV.filter((n) => n.href !== "/dictionary");

export function AppShell({ lang, children }: { lang: LangCode; children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const learner = useLearner(lang);
  const meta = language(lang);
  const reading = path.includes("/read/");
  const due = hydrated ? learner.dueWords().length : 0;
  const settingsRef = useRef<HTMLDialogElement>(null);

  // First visit to a language without a level: send the learner to onboarding.
  useEffect(() => {
    if (hydrated && !learner.started) router.replace(`/start?lang=${lang}`);
    else if (hydrated) learner.select();
  }, [hydrated, learner.started, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = (href: string) =>
    href === "" ? path === `/${lang}` || path.startsWith(`/${lang}/library`) || path.startsWith(`/${lang}/add`) : path.startsWith(`/${lang}${href}`);
  const link = (n: (typeof NAV)[number]) => (
    <Link key={n.label} href={`/${lang}${n.href}`} aria-current={isActive(n.href) ? "page" : undefined}>
      {n.icon}
      <span>{n.label}</span>
      {n.href === "/practice" && due > 0 && <span className="badge">{due}</span>}
    </Link>
  );
  const langPill = (
    <Link href="/start" className="lang-pill" aria-label={`Learning ${meta.name}. Change language`}>
      <span>
        <span className="nat" lang={lang}>{meta.native}</span>
        <span className="sub">Learning {meta.name}</span>
      </span>
    </Link>
  );

  return (
    <div className={`shell${reading ? " reading" : ""}`}>
      <aside className="side">
        <Link href={`/${lang}`} className="logo"><Logo />Storyling</Link>
        {langPill}
        <nav className="nav" aria-label="Main">{NAV.map(link)}</nav>
        <div className="side-foot">
          <button className="btn ghost sm" onClick={() => settingsRef.current?.showModal()} style={{ justifyContent: "flex-start" }}>
            <span style={{ width: 18, height: 18, display: "inline-grid" }}>{Icon.settings}</span> Settings
          </button>
        </div>
      </aside>
      <header className="topbar">
        <Link href={`/${lang}`} className="logo"><Logo />Storyling</Link>
        <div className="row">
          {langPill}
          <button className="icon-btn" aria-label="Settings" onClick={() => settingsRef.current?.showModal()}>
            <span style={{ width: 18, height: 18, display: "inline-grid" }}>{Icon.settings}</span>
          </button>
        </div>
      </header>
      <main className="main"><div className="main-in">{hydrated && learner.started ? children : null}</div></main>
      <nav className="tabbar" aria-label="Main">{TABS.map(link)}</nav>
      <SettingsDialog ref={settingsRef} lang={lang} />
    </div>
  );
}

function SettingsDialog({ lang, ref }: { lang: LangCode; ref: React.RefObject<HTMLDialogElement | null> }) {
  const [settings, set] = useSettings();
  const learner = useLearner(lang);
  const router = useRouter();
  const meta = language(lang);

  function exportCsv() {
    const rows = [["word", "status", "met in stories", "times looked up"]];
    for (const w of learner.allWords) rows.push([w.lemma, w.saved ?? (w.pKnown >= 0.9 ? "known" : "seen"), String(w.encounters), String(w.taps)]);
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `storyling-${lang}-words.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="settings-h">
      <div className="in">
        <div className="spread">
          <h2 id="settings-h" style={{ fontSize: 22 }}>Settings</h2>
          <button className="icon-btn" aria-label="Close" onClick={() => ref.current?.close()}>{Icon.close}</button>
        </div>
        <label className="field">
          Text size
          <input type="range" min={0.85} max={1.4} step={0.05} value={settings.fontScale} onChange={(e) => set({ fontScale: Number(e.target.value) })} />
        </label>
        <label className="field">
          Daily goal
          <select className="select" value={settings.dailyGoalMinutes} onChange={(e) => set({ dailyGoalMinutes: Number(e.target.value) })}>
            {[5, 10, 15, 20, 30].map((m) => <option key={m} value={m}>{m} minutes a day</option>)}
          </select>
        </label>
        <label className="row" style={{ fontWeight: 600 }}>
          <input type="checkbox" checked={settings.highlightNew} onChange={(e) => set({ highlightNew: e.target.checked })} /> Highlight new and review words
        </label>
        <label className="row" style={{ fontWeight: 600 }}>
          <input type="checkbox" checked={settings.showTranslations} onChange={(e) => set({ showTranslations: e.target.checked })} /> Show translations under sentences
        </label>
        <div className="row">
          <button className="btn sm" onClick={exportCsv}>Export my {meta.name} words (CSV)</button>
          <Link className="btn sm" href="/start" onClick={() => ref.current?.close()}>Change language</Link>
        </div>
        <ResetButton
          label={`Reset ${meta.name} progress`}
          onConfirm={() => {
            learner.reset();
            ref.current?.close();
            router.replace("/start");
          }}
        />
        <p className="muted small" style={{ margin: 0 }}>Your progress is saved in this browser only. <Link href="/credits">Photo credits</Link></p>
      </div>
    </dialog>
  );
}

function ResetButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      className="btn sm danger"
      onClick={(e) => {
        const b = e.currentTarget;
        if (b.dataset.armed) return onConfirm();
        b.dataset.armed = "1";
        b.textContent = "Tap again to erase everything";
      }}
    >
      {label}
    </button>
  );
}
