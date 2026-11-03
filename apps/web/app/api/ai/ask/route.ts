import { askStory } from "@/server/ai";
import { aiRoute, lang, str } from "@/server/route";

export const POST = aiRoute(async (body) => {
  const history = Array.isArray(body.history)
    ? (body.history as { q?: unknown; a?: unknown }[]).slice(-4).map((h) => ({ q: String(h.q ?? "").slice(0, 300), a: String(h.a ?? "").slice(0, 800) }))
    : [];
  const text = await askStory(lang(body.lang), str(body.story, 4000, "story"), str(body.question, 400, "question"), typeof body.answerIn === "string" ? body.answerIn : "en", history);
  return { text };
});
