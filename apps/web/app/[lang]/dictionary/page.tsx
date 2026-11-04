import { redirect } from "next/navigation";

/** The Dictionary is a tab of the Notebook now; keep old links working. */
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  redirect(`/${lang}/words?tab=dictionary`);
}
