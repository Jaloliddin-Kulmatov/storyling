import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PUBLIC_LANGS, PublicFrame, SITE, glossary, publicStories, sentenceText } from "@/lib/public";

type Params = Promise<{ lang: string; id: string }>;
export const generateStaticParams = () => PUBLIC_LANGS.flatMap((lang) => publicStories(lang).map((s) => ({ lang, id: s.id })));

const find = (lang: string, id: string) => (PUBLIC_LANGS.includes(lang as LangCode) ? publicStories(lang as LangCode).find((s) => s.id === id) : undefined);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, id } = await params;
  const s = find(lang, id);
  if (!s) return {};
  const name = language(s.lang).name;
  return {
    title: `${s.title}${s.titleEnglish ? ` (${s.titleEnglish})` : ""} – ${s.level} ${name} story with translation`,
    description: `${sentenceText(s.sentences[0]!)} A short ${s.level} ${name} story with audio, English translation and vocabulary list.`,
    alternates: { canonical: `/learn/${lang}/story/${id}` },
    openGraph: { title: `${s.title} – ${s.level} ${name} story`, url: `${SITE}/learn/${lang}/story/${id}`, type: "article" },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { lang, id } = await params;
  const s = find(lang, id);
  if (!s) notFound();
  const meta = language(s.lang);
  const words = glossary(s);
  const others = publicStories(s.lang).filter((x) => x.level === s.level && x.id !== s.id).slice(0, 6);
  const ld = {
    "@context": "https://schema.org", "@type": "LearningResource", name: s.title, inLanguage: s.lang,
    educationalLevel: s.level, learningResourceType: "Reading", isAccessibleForFree: true, url: `${SITE}/learn/${lang}/story/${id}`,
  };
  return (
    <PublicFrame lang={s.lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p className="small"><Link href={`/learn/${lang}`}>{meta.name} stories</Link> › <Link href={`/learn/${lang}/level/${s.level.toLowerCase()}`}>{s.level}</Link></p>
      <h1 lang={s.lang}>{s.title}</h1>
      {s.titleEnglish && <p className="muted" style={{ marginTop: -8 }}>{s.titleEnglish} · {s.level} {meta.name} story</p>}
      <div className="pub-cta">
        <span>Listen to this story, tap any word for its meaning and practise the words with games.</span>
        <Link className="btn primary" href={`/${lang}/read/${s.id}`}>Read with audio in Storyling</Link>
      </div>
      <article className="pub-story">
        {s.sentences.map((x, i) => (
          <p key={i}><span lang={s.lang}>{sentenceText(x)}</span>{x.translation && <small>{x.translation}</small>}</p>
        ))}
      </article>
      {words.length > 0 && (
        <section>
          <h2>Words in this story</h2>
          <dl className="pub-words">
            {words.map((w) => (
              <div key={w.display}><dt lang={s.lang}>{w.display}</dt><dd>{w.meaning}</dd></div>
            ))}
          </dl>
        </section>
      )}
      {others.length > 0 && (
        <section>
          <h2>More {s.level} stories</h2>
          <ul className="pub-list">{others.map((o) => <li key={o.id}><Link href={`/learn/${lang}/story/${o.id}`}><b lang={lang}>{o.title}</b>{o.titleEnglish && <span className="muted"> · {o.titleEnglish}</span>}</Link></li>)}</ul>
        </section>
      )}
    </PublicFrame>
  );
}
