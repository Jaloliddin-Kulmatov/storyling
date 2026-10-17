import type { LangCode } from "@storyling/core";
import { Today } from "@/views/Today";

export default async function TodayPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Today lang={lang as LangCode} />;
}
