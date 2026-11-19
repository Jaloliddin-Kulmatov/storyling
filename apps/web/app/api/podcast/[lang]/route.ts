import { audio, language, languages, storiesFor } from "@storyling/content";
import type { LangCode } from "@storyling/core";
import { db, dbEnabled } from "@/server/db";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storyling.vercel.app";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A podcast feed of every recorded story in a language, newest first, for any podcast app. */
export async function GET(_req: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!languages.some((l) => l.code === lang)) return new Response("Not found", { status: 404 });
  const meta = language(lang as LangCode);
  const items: { id: string; title: string; sub: string; level: string; at: number }[] = [];
  if (dbEnabled()) {
    const sql = await db();
    const rows = (await sql`SELECT story, published_at FROM daily_stories WHERE lang = ${lang} AND status = 'published' ORDER BY published_at DESC LIMIT 100`.catch(() => [])) as { story: { id: string; title: string; titleEnglish: string; level: string }; published_at: string }[];
    for (const r of rows) items.push({ id: r.story.id, title: r.story.title, sub: r.story.titleEnglish, level: r.story.level, at: new Date(r.published_at).getTime() });
  }
  const base = Date.parse("2026-10-01");
  storiesFor(lang as LangCode).forEach((s, i) => items.push({ id: s.id, title: s.title, sub: s.titleEnglish, level: s.level, at: base - i * 36e5 }));
  const recorded = items.filter((x) => audio.stories[x.id]);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
<channel>
<title>Storyling: ${esc(meta.name)} stories</title>
<link>${SITE}/${lang}/listen</link>
<language>${lang}</language>
<description>Short ${esc(meta.name)} stories for learners, read aloud slowly. Read along with translations at ${SITE}.</description>
<itunes:author>Storyling</itunes:author>
<itunes:category text="Education"><itunes:category text="Language Learning"/></itunes:category>
<itunes:explicit>false</itunes:explicit>
${recorded
  .map((x) => {
    const a = audio.stories[x.id]!;
    const secs = Math.round(a.s.at(-1)?.[1] ?? 60);
    return `<item><title>${esc(`${x.title} (${x.sub}) · ${x.level}`)}</title><link>${SITE}/${lang}/read/${x.id}</link><guid isPermaLink="false">${x.id}</guid><pubDate>${new Date(x.at).toUTCString()}</pubDate><enclosure url="${SITE}${a.f}" type="audio/mp4" length="0"/><itunes:duration>${secs}</itunes:duration><description>${esc(`Read along: ${SITE}/${lang}/read/${x.id}`)}</description></item>`;
  })
  .join("\n")}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600" } });
}
