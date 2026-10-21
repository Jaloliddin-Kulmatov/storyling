import type { LangCode } from "@storyling/core";
import { Home } from "@/views/Home";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <Home lang={lang as LangCode} />;
}
