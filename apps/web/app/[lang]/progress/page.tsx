import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { Progress } from "@/views/Progress";

export const metadata: Metadata = { title: "Progress" };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Progress lang={lang as LangCode} />;
}
