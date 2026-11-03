import type { LangCode } from "@storyling/core";
import { Suspense } from "react";
import { Home } from "@/views/Home";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return (
    <Suspense>
      <Home lang={lang as LangCode} />
    </Suspense>
  );
}
