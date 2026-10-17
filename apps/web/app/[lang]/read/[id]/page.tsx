import { stories } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { Reader } from "@/views/Reader";

type Params = Promise<{ lang: string; id: string }>;

// Catalog stories are prerendered; the learner's own texts (saved in the browser) render on demand.
export function generateStaticParams() {
  return stories.map((s) => ({ lang: s.lang, id: s.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const story = stories.find((s) => s.id === id);
  return { title: story ? `${story.title}${story.titleEnglish ? ` (${story.titleEnglish})` : ""}` : "Reading" };
}

export default async function ReadPage({ params }: { params: Params }) {
  const { lang, id } = await params;
  return <Reader lang={lang as LangCode} id={decodeURIComponent(id)} />;
}
