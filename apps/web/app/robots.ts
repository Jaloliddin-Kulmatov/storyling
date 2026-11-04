import type { MetadataRoute } from "next";
import { SITE } from "@/lib/public";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }], sitemap: `${SITE}/sitemap.xml` };
}
