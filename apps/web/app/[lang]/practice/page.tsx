import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Practice } from "@/views/Practice";

export const metadata: Metadata = { title: "Practice" };

export default async function PracticePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Suspense><Practice lang={lang as LangCode} /></Suspense>;
}
