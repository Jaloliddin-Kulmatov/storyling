import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { Listen } from "@/views/Listen";

export const metadata: Metadata = { title: "Listen" };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Listen lang={lang as LangCode} />;
}
