import type { LangCode } from "@storyling/core";
import type { Metadata } from "next";
import { Exams } from "@/views/Exams";

export const metadata: Metadata = { title: "Mock exams" };

export default async function ExamsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Exams lang={lang as LangCode} />;
}
