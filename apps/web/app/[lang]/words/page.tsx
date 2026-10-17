import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { Words } from "@/views/Words";

export const metadata: Metadata = { title: "Words" };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Words lang={lang as LangCode} />;
}
