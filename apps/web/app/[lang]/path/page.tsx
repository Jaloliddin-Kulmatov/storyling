import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { PathPage } from "@/views/Path";

export const metadata: Metadata = { title: "Your path" };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <PathPage lang={lang as LangCode} />;
}
