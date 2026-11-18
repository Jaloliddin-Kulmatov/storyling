import "server-only";

/**
 * AI pictures for the parts of a story. Providers are tried in order and the first that answers wins:
 *   1. Cloudflare Workers AI (FLUX schnell): CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN. Free each day up to a limit.
 *   2. Pollinations with a key (FLUX): POLLINATIONS_KEY.
 *   3. Pollinations without a key: free, one picture every 45 seconds per server, weaker model and a small watermark.
 * The same story and part always get the same seed, so a picture made again looks the same.
 */
// Each story gets one of these looks, so stories don't all look alike; every part of a story shares it.
const STYLES = [
  "soft watercolour storybook illustration, warm gentle light",
  "cut-paper collage illustration, layered textured paper, bright cheerful colours",
  "gouache painting, rich colours, visible brush strokes, cosy mood",
  "flat vector illustration, bold simple shapes, modern pastel palette",
  "coloured pencil and crayon drawing, hand-drawn texture, playful",
  "cinematic digital painting, golden hour light, detailed background",
  "Japanese woodblock print style, clean outlines, calm colours",
  "3D clay animation style, soft rounded characters, studio lighting",
];
const NO_TEXT = "No text, no letters, no words, no captions, no signs with writing. Well composed, high detail, beautiful.";

export function styleOf(id: string) {
  return STYLES[seedOf(id) % STYLES.length]!;
}

/** The prompt for one picture: the story's look, then the scene. `scene` is a short description, or the part's sentences. */
export function picturePrompt(id: string, scene: string) {
  return `${styleOf(id)}. ${scene.replace(/\s+/g, " ").slice(0, 500)} ${NO_TEXT}`;
}

export function seedOf(id: string) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) % 1_000_000;
}

export interface Picture { bytes: ArrayBuffer; type: string; by: string }

async function cloudflare(prompt: string, seed: number): Promise<Picture | null> {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID, token = process.env.CLOUDFLARE_API_TOKEN;
  if (!account || !token) return null;
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, steps: 6, seed }),
    signal: AbortSignal.timeout(40_000),
  });
  if (!res.ok) throw new Error(`Cloudflare ${res.status}`);
  const image = ((await res.json()) as { result?: { image?: string } }).result?.image;
  if (!image) throw new Error("Cloudflare: no image");
  const buf = Buffer.from(image, "base64");
  return { bytes: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, type: "image/jpeg", by: "cloudflare" };
}

async function pollinations(prompt: string, seed: number, key?: string): Promise<Picture> {
  const q = `width=1024&height=640&seed=${seed}&nologo=true&safe=true${key ? "&model=flux" : ""}`;
  const url = key ? `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${q}` : `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${q}`;
  const res = await fetch(url, { headers: key ? { Authorization: `Bearer ${key}` } : {}, signal: AbortSignal.timeout(50_000) });
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.startsWith("image/")) throw new Error(`Pollinations${key ? " (key)" : ""} ${res.status}`);
  return { bytes: await res.arrayBuffer(), type, by: key ? "pollinations-key" : "pollinations-free" };
}

export async function makePicture(prompt: string, seed: number): Promise<Picture> {
  const tries: (() => Promise<Picture | null>)[] = [
    () => cloudflare(prompt, seed),
    () => (process.env.POLLINATIONS_KEY ? pollinations(prompt, seed, process.env.POLLINATIONS_KEY) : Promise.resolve(null)),
    () => pollinations(prompt, seed),
  ];
  const errors: string[] = [];
  for (const t of tries) {
    try {
      const p = await t();
      if (p) return p;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error(errors.join("; ") || "No picture service");
}
