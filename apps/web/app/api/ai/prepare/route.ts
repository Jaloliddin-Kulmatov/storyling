import { prepareText } from "@/server/ai";
import { aiRoute, lang, str } from "@/server/route";

export const maxDuration = 120;

export const POST = aiRoute((body) => prepareText(lang(body.lang), str(body.text, 3000, "text")));
