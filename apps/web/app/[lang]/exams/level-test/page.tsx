import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { LevelTestPage } from "@/views/Practice";

export const metadata: Metadata = { title: "Level test" };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <LevelTestPage lang={lang as LangCode} />;
}
