import { explainSentence } from "@/server/ai";
import { aiRoute, lang, str } from "@/server/route";

export const POST = aiRoute(async (body) => {
  const text = await explainSentence(
    lang(body.lang),
    str(body.sentence, 600, "sentence"),
    typeof body.translation === "string" ? body.translation.slice(0, 600) : undefined,
    typeof body.question === "string" && body.question.trim() ? body.question.slice(0, 300) : undefined,
  );
  return { text };
});
