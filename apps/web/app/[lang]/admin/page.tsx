import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { AdminStories } from "@/views/AdminStories";

export const metadata: Metadata = { title: "Review stories", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <AdminStories lang={lang as LangCode} />;
}
