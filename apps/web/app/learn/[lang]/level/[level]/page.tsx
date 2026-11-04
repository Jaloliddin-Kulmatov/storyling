import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PUBLIC_LANGS, PublicFrame, publicStories, sentenceText } from "@/lib/public";

type Params = Promise<{ lang: string; level: string }>;
export const generateStaticParams = () => PUBLIC_LANGS.flatMap((lang) => language(lang).levels.map((level) => ({ lang, level: level.toLowerCase() })));

const ABOUT: Record<string, string> = {
  A1: "for complete beginners: short sentences, present tense and everyday words",
  A2: "for elementary learners: daily life, the past tense and simple connectors",
  B1: "for intermediate learners: opinions, experiences and longer texts",
  B2: "for upper-intermediate learners: news-style topics, history and science",
  C1: "for advanced learners: complex texts on culture, science and society",
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, level } = await params;
  const name = language(lang as LangCode).name;
  const L = level.toUpperCase();
  return {
    title: `${L} ${name} stories with audio and translation`,
    description: `Free ${L} ${name} reading practice: short stories ${ABOUT[L] ?? ""}, with audio, English translation and vocabulary.`,
    alternates: { canonical: `/learn/${lang}/level/${level}` },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { lang: l, level } = await params;
  const lang = l as LangCode;
  const L = level.toUpperCase();
  const list = PUBLIC_LANGS.includes(lang) ? publicStories(lang).filter((s) => s.level === L) : [];
  if (!list.length) notFound();
  const meta = language(lang);
  return (
    <PublicFrame lang={lang}>
      <p className="small"><Link href={`/learn/${lang}`}>{meta.name} stories</Link> › {L}</p>
      <h1>{L} {meta.name} stories</h1>
      <p className="muted">{list.length} stories {ABOUT[L] ?? ""}. Tap any story to read it with a translation, or open it in Storyling to listen, tap words and play games with them.</p>
      <div className="pub-cards">
        {list.map((s) => (
          <Link key={s.id} className="pub-card" href={`/learn/${lang}/story/${s.id}`}>
            <b lang={lang}>{s.title}</b>
            {s.titleEnglish && <span className="muted small">{s.titleEnglish}</span>}
            <span className="small" lang={lang}>{sentenceText(s.sentences[0]!)}</span>
          </Link>
        ))}
      </div>
    </PublicFrame>
  );
}
