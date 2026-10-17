import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AddText } from "@/views/AddText";

export const metadata: Metadata = { title: "Add a text" };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Suspense><AddText lang={lang as LangCode} /></Suspense>;
}
