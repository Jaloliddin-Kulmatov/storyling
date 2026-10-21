import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Notebook } from "@/views/Notebook";

export const metadata: Metadata = { title: "Notebook" };

export default async function NotebookPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Suspense><Notebook lang={lang as LangCode} /></Suspense>;
}
