"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { loadAccount, useAccount } from "@/lib/account";
import { usePlan, type Period } from "@/lib/plan";

/** Shown prices; they must match the Stripe prices set in STRIPE_PRICE_MONTHLY / _HALFYEAR / _YEARLY. */
const PRICES: Record<Period, { label: string; perMonth: string; billed: string }> = {
  monthly: { label: "Monthly", perMonth: "€4.99", billed: "Billed monthly, cancel any time" },
  halfyear: { label: "6 months · save 17%", perMonth: "€4.17", billed: "€24.99 billed every 6 months" },
  yearly: { label: "Yearly · save 33%", perMonth: "€3.33", billed: "€39.99 billed once a year" },
};

const FREE_ROWS = ["3 new stories a day", "All games and flashcards", "Videos with subtitles", "Dictionary and notebook", "1 AI-graded exam answer a day"];
const PRO_ROWS = ["Unlimited stories", "Unlimited AI grading for Schreiben and Sprechen", "AI tutor: explain any sentence", "Translations into your language", "Everything in Free"];

/** Free vs Pro. Checkout runs on Stripe; until Stripe keys are set, Pro is shown as coming soon and everything stays free. */
export function Pricing() {
  const a = useAccount();
  const plan = usePlan();
  const done = useSearchParams().get("done");
  const [period, setPeriod] = useState<Period>("yearly");
  const periods = plan.periods.length ? plan.periods : (["monthly"] as Period[]);
  const chosen = periods.includes(period) ? period : periods[periods.length - 1]!;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void loadAccount(); }, []);

  const go = async (path: "checkout" | "portal") => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/billing/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: chosen }) });
      const d = (await r.json()) as { url?: string; error?: string };
      if (d.url) location.href = d.url;
      else setError(d.error ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pub">
      <header className="pub-head"><Link href="/" className="pub-brand">📖 Storyling</Link><Link className="btn sm" href="/de">Back to reading</Link></header>
      <main className="pub-main">
        <h1 style={{ textAlign: "center" }}>Learn German your way</h1>
        <p className="muted" style={{ textAlign: "center" }}>Start free. Go Pro when you want unlimited reading and exam training.</p>
        {done && <p className="paid-ok">🎉 Welcome to Pro! It can take a minute to switch on.</p>}
        <div className="seg" role="group" aria-label="Billing period" style={{ margin: "16px auto", width: "fit-content" }}>
          {periods.map((p) => <button key={p} aria-pressed={chosen === p} onClick={() => setPeriod(p)}>{PRICES[p].label}</button>)}
        </div>
        <div className="plans">
          <div className="plan">
            <b className="plan-name">Free</b>
            <span className="plan-price">€0</span>
            <ul>{FREE_ROWS.map((r) => <li key={r}>✓ {r}</li>)}</ul>
            <Link className="btn block" href="/start?lang=de">Start free</Link>
          </div>
          <div className="plan pro">
            <b className="plan-name">Pro <span className="pill">Most popular</span></b>
            <span className="plan-price">{PRICES[chosen].perMonth}<small> / month</small></span>
            <span className="small muted">{PRICES[chosen].billed}</span>
            <ul>{PRO_ROWS.map((r) => <li key={r}>✓ {r}</li>)}</ul>
            {!plan.enabled ? (
              <button className="btn primary block" disabled>Coming soon: everything is free during the beta</button>
            ) : !a.user ? (
              <Link className="btn primary block" href="/de/progress">Sign in to go Pro</Link>
            ) : plan.pro ? (
              <button className="btn block" disabled={busy} onClick={() => go("portal")}>✓ You're Pro · Manage subscription</button>
            ) : (
              <button className="btn primary block" disabled={busy} onClick={() => go("checkout")}>{busy ? "Opening checkout…" : "Go Pro"}</button>
            )}
          </div>
        </div>
        {error && <p role="alert" style={{ color: "var(--danger)", textAlign: "center" }}>{error}</p>}
        <p className="small muted" style={{ textAlign: "center" }}>Secure payment by Stripe. Prices include VAT where it applies.</p>
      </main>
    </div>
  );
}
