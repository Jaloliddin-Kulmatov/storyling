import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { Library } from "@/views/Library";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Library lang={lang as LangCode} />;
}
