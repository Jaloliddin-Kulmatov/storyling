import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { AiError, aiEnabled, checkLimit } from "./ai";

/** Shared wrapper for AI routes: feature flag, per-IP limit, JSON body, error mapping. */
export function aiRoute<T>(handler: (body: Record<string, unknown>) => Promise<T>) {
  return async (req: NextRequest) => {
    if (!aiEnabled()) return NextResponse.json({ error: "AI features are turned off on this server." }, { status: 503 });
    try {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
      checkLimit(ip);
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      return NextResponse.json(await handler(body));
    } catch (err) {
      const e = err instanceof AiError ? err : new AiError("Something went wrong.");
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
  };
}

const LANGS = new Set(["en", "es", "fr", "de", "zh", "ja", "ko", "it", "pt", "ru"]);

export function str(v: unknown, max: number, name: string): string {
  if (typeof v !== "string" || !v.trim()) throw new AiError(`Missing ${name}.`, 400);
  if (v.length > max) throw new AiError(`${name[0]!.toUpperCase() + name.slice(1)} is too long (max ${max} characters).`, 413);
  return v.trim();
}

export function lang(v: unknown): string {
  if (typeof v !== "string" || !LANGS.has(v)) throw new AiError("Unknown language.", 400);
  return v;
}
