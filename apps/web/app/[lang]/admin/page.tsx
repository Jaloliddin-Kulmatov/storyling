import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { AdminPanel } from "@/views/AdminPanel";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <AdminPanel lang={lang as LangCode} />;
}
