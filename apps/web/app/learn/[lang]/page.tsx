import { language } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PUBLIC_LANGS, PublicFrame, publicStories } from "@/lib/public";

type Params = Promise<{ lang: string }>;
export const generateStaticParams = () => PUBLIC_LANGS.map((lang) => ({ lang }));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  const name = language(lang as LangCode).name;
  return {
    title: `${name} stories for beginners to advanced (A1–C1) with audio and translation`,
    description: `Free short ${name} stories by level, A1 to C1, each with audio, an English translation and a word list. Read, listen and practise.`,
    alternates: { canonical: `/learn/${lang}` },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { lang: l } = await params;
  const lang = l as LangCode;
  if (!PUBLIC_LANGS.includes(lang)) notFound();
  const meta = language(lang);
  const all = publicStories(lang);
  return (
    <PublicFrame lang={lang}>
      <h1>{meta.name} stories with audio and English translation</h1>
      <p className="muted">{all.length} short stories written for learners, from complete beginner (A1) to advanced (C1). Every story has native-speed audio, a line-by-line translation and the key words.</p>
      {meta.levels.map((level) => {
        const list = all.filter((s) => s.level === level);
        if (!list.length) return null;
        return (
          <section key={level} className="pub-level">
            <h2><Link href={`/learn/${lang}/level/${level.toLowerCase()}`}>{level} {meta.name} stories</Link> <span className="muted small">{list.length}</span></h2>
            <ul className="pub-list">
              {list.map((s) => (
                <li key={s.id}><Link href={`/learn/${lang}/story/${s.id}`}><b lang={lang}>{s.title}</b>{s.titleEnglish && <span className="muted"> · {s.titleEnglish}</span>}</Link></li>
              ))}
            </ul>
          </section>
        );
      })}
    </PublicFrame>
  );
}
