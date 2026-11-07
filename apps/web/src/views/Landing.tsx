"use client";

import { language, languages, storiesFor } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import Link from "next/link";
import { useSettings } from "@/lib/learner";
import { UI_LANGS, useT } from "@/lib/i18n";
import { useSite } from "@/lib/site";
import { ContinueButton } from "@/views/ContinueButton";
import { Logo } from "@/components/ui";
import { Fragment, useEffect } from "react";

/** Cards fade up as they scroll into view. */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (!("IntersectionObserver" in window)) return els.forEach((el) => el.classList.add("in"));
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))), { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** Every language is open to visitors. */
export const FEATURED: LangCode[] = languages.map((l) => l.code);

const DEMOS: Record<"de" | "ko", { label: string; fit: string; before: string; learning: string; mid: string; fresh: string; after: string; word: string; pos: string; meaning: string }> = {
  de: { label: "Deutsch · Die große Prüfung · A2", fit: "Just right · 96%", before: "Morgen hat Ben eine wichtige ", learning: "Prüfung", mid: ". Er lernt den ganzen Nachmittag in der ", fresh: "Bibliothek", after: ".", word: "die Bibliothek", pos: "noun", meaning: "library · met 2 of about 10 times" },
  ko: { label: "한국어 · 비 오는 날 · Level 2", fit: "Just right · 96%", before: "준호는 ", learning: "우산", mid: "이 없었어요. 그래서 버스 ", fresh: "정류장", after: "까지 뛰어갔어요.", word: "정류장 (jeongnyujang)", pos: "noun", meaning: "stop (bus) · met 2 of about 10 times" },
};

export function Landing() {
  const t = useT();
  const [settings, set] = useSettings();
  const site = useSite();
  const shown = FEATURED.filter((c) => !site.hiddenLangs.includes(c));
  const demo = "de" as const;
  const pickLang: LangCode = "de";
  const d = DEMOS[demo];
  useReveal();

  return (
    <div className="landing">
      <header>
        <Link href="/" className="logo"><Logo />Storyling</Link>
        <div className="row">
          <label className="ui-lang">
            <span className="sr-only">{t("land.ui")}</span>
            <select className="select" aria-label={t("land.ui")} value={settings.uiLang} onChange={(e) => set({ uiLang: e.target.value })}>
              {UI_LANGS.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </label>
          <ContinueButton />
        </div>
      </header>

      <section className="hero">
        <div>
          <div className="hero-badge enter" style={{ ["--d" as string]: "0s" }}><span className="ping" aria-hidden="true"><i /><i /></span>{t("land.eyebrow")}</div>
          <h1 className="enter" style={{ marginTop: 12, ["--d" as string]: ".08s" }}>
            {t("land.title1")} <em>{t("land.title2")}</em> {t("land.title3")}
          </h1>
          <p className="enter" style={{ ["--d" as string]: ".18s" }}>{t("land.lead")}</p>
          <div className="row enter" style={{ ["--d" as string]: ".28s" }}>
            <Link className="btn primary glow" href="/start" style={{ minHeight: 50, padding: "0 22px", fontSize: 16.5 }}>{t("land.start")}</Link>
            <a className="btn" href="#how" style={{ minHeight: 50 }}>{t("land.how")}</a>
          </div>
          <p className="muted small enter" style={{ margin: "16px 0 0", ["--d" as string]: ".38s" }}>{t("land.note")}</p>
        </div>
        <div className="demo enter-side" aria-label="Example of the reader">
          <div className="spread small muted" style={{ marginTop: 10 }}><span>{d.label}</span></div>
          <p lang={demo} className="hl" style={{ fontFamily: "var(--f-read)", fontSize: 24, lineHeight: 2.05, margin: "14px 0 0" }}>
            {d.before}<span className="w learning">{d.learning}</span>{d.mid}<span className="w new">{d.fresh}</span>{d.after}
          </p>
          <div className="box" style={{ marginTop: 12 }}>
            <b style={{ fontFamily: "var(--f-read)", fontSize: 20 }}>{d.word}</b> <span className="muted small">{d.pos}</span>
            <div>{d.meaning}</div>
          </div>
        </div>
      </section>

      <section className="card level-pick reveal" aria-labelledby="pick-h">
        <h2 id="pick-h" style={{ fontSize: 22, margin: 0 }}>{t("land.pick")}</h2>
        <div className="row" style={{ flexWrap: "wrap", gap: 10 }}>
          <span className="muted small">{t("land.level")}</span>
          {language(pickLang).levels.map((lv) => (
            <Link key={lv} className="chip level-chip" href={`/start?lang=${pickLang}&level=${encodeURIComponent(lv)}`}>{lv}</Link>
          ))}
        </div>
      </section>

      <div className="lang-strip">
        {shown.map((c) => <span key={c} lang={c}>{language(c).native}</span>)}
      </div>

      <section id="how" className="features">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div className="card reveal" key={i} style={{ ["--d" as string]: `${(i - 1) * 0.07}s` }}><h3>{t(`land.f${i}t`)}</h3><p className="muted">{t(`land.f${i}`)}</p></div>
        ))}
      </section>

      <section className="card reveal" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>{t("land.anyLang")}</h2>
        <div className="langs">
          {shown.map((c) => {
            const l = language(c);
            return (
              <Link key={c} href={`/start?lang=${c}`} className="lang-opt featured">
                                <span className="nat" lang={c}>{l.native}</span>
                <b>{l.name}</b>
                <span className="muted small">{storiesFor(c).length} {t("land.stories")} · {l.levels[0]}–{l.levels[l.levels.length - 1]}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="foot">Storyling · {shown.map((c) => <Fragment key={c}><Link href={`/learn/${c}`}>{language(c).name} stories</Link> · </Fragment>)}<Link href="/credits">Credits</Link></footer>
    </div>
  );
}
