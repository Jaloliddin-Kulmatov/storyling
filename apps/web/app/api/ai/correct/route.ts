import { correctWriting } from "@/server/ai";
import { aiRoute, lang, str } from "@/server/route";

export const POST = aiRoute(async (body) =>
  correctWriting(lang(body.lang), str(body.story, 4000, "story"), str(body.text, 1500, "text"), typeof body.explainIn === "string" ? body.explainIn : "en"),
);
