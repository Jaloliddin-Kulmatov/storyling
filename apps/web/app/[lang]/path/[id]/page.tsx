import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { PathLesson } from "@/views/Path";

export const metadata: Metadata = { title: "Lesson" };

export default async function Page({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  return <PathLesson lang={lang as LangCode} id={decodeURIComponent(id)} />;
}
