import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { Dictionary } from "@/views/Dictionary";

export const metadata: Metadata = { title: "Dictionary" };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Dictionary lang={lang as LangCode} />;
}
