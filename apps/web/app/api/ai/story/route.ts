import { writeStory } from "@/server/ai";
import { aiRoute, lang, str } from "@/server/route";

export const maxDuration = 120;

export const POST = aiRoute((body) => {
  const words = Array.isArray(body.words) ? body.words.filter((w): w is string => typeof w === "string").slice(0, 12).map((w) => w.slice(0, 40)) : [];
  const topic = typeof body.topic === "string" ? body.topic.slice(0, 120) : "";
  return writeStory(lang(body.lang), str(body.level, 30, "level"), topic, words);
});
