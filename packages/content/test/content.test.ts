import { describe, expect, it } from "vitest";
import { EVERYDAY_LANGS, languages, lookup, sentenceText, stories, storiesFor } from "../src";

describe("seed content", () => {
  it("covers 10 languages, each with at least 2 stories", () => {
    expect(languages).toHaveLength(10);
    for (const l of languages) expect(storiesFor(l.code).length).toBeGreaterThanOrEqual(2);
  });

  it("has a dictionary entry for every lemma in every story", () => {
    const missing: string[] = [];
    for (const s of stories)
      for (const sent of s.sentences)
        for (const t of sent.tokens) if (t.lemma && !lookup(s.lang, t.lemma)) missing.push(`${s.id}: ${t.lemma}`);
    expect(missing).toEqual([]);
  });

  it("marks names so they don't count toward coverage", () => {
    const ko = stories.find((s) => s.id === "ko-store")!;
    const minji = ko.sentences[0]!.tokens[0]!;
    expect(minji).toMatchObject({ surface: "민지는", lemma: "민지", isName: true });
  });

  it("rebuilds sentence text with the right spacing", () => {
    const ko = stories.find((s) => s.id === "ko-store")!;
    expect(sentenceText("ko", ko.sentences[0]!)).toBe("민지는 매일 아침 편의점에 가요.");
    const zh = stories.find((s) => s.id === "zh-tea")!;
    expect(sentenceText("zh", zh.sentences[0]!)).toBe("我喜欢喝茶。");
  });

  it("returns pinyin for Chinese and strips sense suffixes", () => {
    expect(lookup("zh", "茶")).toMatchObject({ meaning: "tea", reading: "chá" });
    expect(lookup("de", "sein#v")).toMatchObject({ display: "sein", pos: "verb" });
  });
});

describe("story packs", () => {
  const PACK = ["snow", "morning", "sunday", "zoo", "cake", "hotel", "doctor", "seatrain", "bookshop", "neighbor"];

  it("has every pack story in every language, with translations outside English", () => {
    const missing: string[] = [];
    for (const l of languages.filter((x) => EVERYDAY_LANGS.includes(x.code)))
      for (const slug of PACK) {
        const s = stories.find((x) => x.id === `${l.code}-${slug}`);
        if (!s) missing.push(`${l.code}-${slug}`);
        else if (l.code !== "en" && s.sentences.some((x) => !x.translation)) missing.push(`${s.id} (translation)`);
      }
    expect(missing).toEqual([]);
  });

  it("uses only each language's own levels and unique ids", () => {
    const ids = new Set<string>();
    for (const s of stories) {
      expect(ids.has(s.id)).toBe(false);
      ids.add(s.id);
      expect(languages.find((l) => l.code === s.lang)!.levels).toContain(s.level);
    }
  });
});

describe("covers", () => {
  it("has a cover photo for every catalog story", async () => {
    const { coverOf } = await import("../src");
    expect(stories.filter((s) => !coverOf(s.id)).map((s) => s.id)).toEqual([]);
  });
});
