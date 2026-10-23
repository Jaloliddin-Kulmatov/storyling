import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { Subtitles } from "@/views/Subtitles";

export const metadata: Metadata = { title: "Subtitle study" };

export default async function SubtitlesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Subtitles lang={lang as LangCode} />;
}
