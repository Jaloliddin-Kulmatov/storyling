import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { Packs } from "@/views/Packs";

export const metadata: Metadata = { title: "Word packs" };

export default async function PacksPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Packs lang={lang as LangCode} />;
}
