import { redirect } from "next/navigation";

// The library is now the Home feed.
export default async function LibraryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  redirect(`/${lang}`);
}
