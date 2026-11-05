import "server-only";
import type { StoryPhoto } from "@storyling/learner";

/**
 * Free-to-use photos. With PEXELS_API_KEY (free at pexels.com/api) the search uses Pexels, which has the best pictures;
 * without it, Openverse, then Wikimedia Commons when Openverse is down. Those two need no key and only return
 * photos that are public domain or free with credit.
 */
export async function searchPhotos(query: string): Promise<StoryPhoto[]> {
  if (process.env.PEXELS_API_KEY) return pexels(query);
  const found = await openverse(query).catch(() => []);
  return found.length ? found : commons(query);
}

interface PexelsPhoto { url: string; photographer: string; src: { large: string } }

async function pexels(query: string): Promise<StoryPhoto[]> {
  const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=12`, { headers: { Authorization: process.env.PEXELS_API_KEY! } });
  if (!res.ok) throw new Error(`Pexels ${res.status}`);
  const { photos } = (await res.json()) as { photos: PexelsPhoto[] };
  return photos.map((p) => ({ url: p.src.large, author: p.photographer, license: "Pexels", page: p.url }));
}

interface OpenversePhoto { url: string; creator: string | null; license: string; license_version: string | null; foreign_landing_url: string; width: number; height: number }

async function openverseSearch(query: string): Promise<OpenversePhoto[]> {
  const res = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license=cc0,pdm,by,by-sa&category=photograph&mature=false&page_size=20`, { headers: { "User-Agent": "Storyling/1.0" }, signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`Openverse ${res.status}`);
  return ((await res.json()) as { results: OpenversePhoto[] }).results;
}

async function openverse(query: string): Promise<StoryPhoto[]> {
  const words = query.split(" ");
  // All the words together can find nothing; then try the main word alone.
  let found = await openverseSearch(query);
  if (found.length < 4 && words.length > 1) found = await openverseSearch(words[0]!);
  return found
    .filter((p) => p.url.startsWith("https://") && p.width >= 900 && p.width > p.height)
    .slice(0, 12)
    .map((p) => ({ url: p.url, author: p.creator ?? "Unknown", license: `${p.license.toUpperCase()} ${p.license_version ?? ""}`.trim(), page: p.foreign_landing_url }));
}

interface CommonsPage {
  imageinfo?: { thumburl: string; descriptionurl: string; width: number; height: number; extmetadata: { LicenseShortName?: { value: string }; Artist?: { value: string } } }[];
}

const FREE_LICENSE = /^(CC0|CC BY|Public domain)/i;

async function commons(query: string): Promise<StoryPhoto[]> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=30&gsrsearch=${encodeURIComponent(`${query} filemime:image/jpeg`)}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1000`;
  const res = await fetch(url, { headers: { "User-Agent": "Storyling/1.0 (https://storyling.vercel.app)" }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Commons ${res.status}`);
  const pages = ((await res.json()) as { query?: { pages: Record<string, CommonsPage> } }).query?.pages ?? {};
  return Object.values(pages).flatMap((p) => {
    const i = p.imageinfo?.[0];
    const license = i?.extmetadata.LicenseShortName?.value ?? "";
    if (!i || !FREE_LICENSE.test(license) || i.width < 900 || i.width < i.height || i.width > i.height * 2.2) return [];
    const author = (i.extmetadata.Artist?.value ?? "").replace(/<[^>]*>/g, "").trim().slice(0, 100) || "Wikimedia Commons";
    return [{ url: i.thumburl, author, license, page: i.descriptionurl }];
  }).slice(0, 12);
}
