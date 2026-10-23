import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { Grammar } from "@/views/Grammar";

export const metadata: Metadata = { title: "Grammar" };

export default async function GrammarPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Grammar lang={lang as LangCode} />;
}
