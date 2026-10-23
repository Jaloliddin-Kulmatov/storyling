import { translateLines } from "@/server/ai";
import { aiRoute, lang } from "@/server/route";
import { AiError } from "@/server/ai";

export const POST = aiRoute(async (body) => {
  const lines = body.lines;
  if (!Array.isArray(lines) || !lines.length || lines.length > 40 || lines.some((l) => typeof l !== "string" || l.length > 300))
    throw new AiError("Send 1 to 40 lines of at most 300 characters.", 400);
  const target = typeof body.target === "string" ? body.target : "en";
  return { lines: await translateLines(lang(body.lang), target, lines as string[]) };
});
