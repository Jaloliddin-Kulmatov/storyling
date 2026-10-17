import { describe, expect, it } from "vitest";
import { languages, lookup, sentenceText, stories, storiesFor } from "../src";

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
