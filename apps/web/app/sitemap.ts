import { language } from "@storyling/content";
import type { MetadataRoute } from "next";
import { PUBLIC_LANGS, SITE, publicStories } from "@/lib/public";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, changeFrequency: "weekly", priority: 1 },
    ...PUBLIC_LANGS.flatMap((lang) => [
      { url: `${SITE}/learn/${lang}`, changeFrequency: "weekly" as const, priority: 0.9 },
      ...language(lang).levels.map((l) => ({ url: `${SITE}/learn/${lang}/level/${l.toLowerCase()}`, changeFrequency: "weekly" as const, priority: 0.8 })),
      ...publicStories(lang).map((s) => ({ url: `${SITE}/learn/${lang}/story/${s.id}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ]),
  ];
}
