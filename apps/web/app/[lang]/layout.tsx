import { languages } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

export function generateStaticParams() {
  return languages.map((l) => ({ lang: l.code }));
}

export default async function LangLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!languages.some((l) => l.code === lang)) notFound();
  return <AppShell lang={lang as LangCode}>{children}</AppShell>;
}
