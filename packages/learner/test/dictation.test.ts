import { describe, expect, it } from "vitest";
import { checkDictation } from "../src/dictation";

describe("dictation", () => {
  it("accepts a perfect answer, ignoring case and punctuation", () => {
    const r = checkDictation("Lena geht jeden Morgen in die Bäckerei.", "lena geht jeden morgen in die bäckerei");
    expect(r.score).toBe(100);
    expect(r.words.every((w) => w.ok)).toBe(true);
  });

  it("marks only the missing word, not everything after it", () => {
    const r = checkDictation("Sie kauft zwei Brötchen und einen Kaffee.", "Sie kauft Brötchen und einen Kaffee");
    expect(r.words.filter((w) => !w.ok).map((w) => w.word)).toEqual(["zwei"]);
    expect(r.score).toBe(86);
  });

  it("marks a wrong word", () => {
    const r = checkDictation("Der Bäcker kennt sie schon.", "Der Bäcker kannte sie schon");
    expect(r.words.filter((w) => !w.ok).map((w) => w.word)).toEqual(["kennt"]);
  });

  it("scores zero for an empty answer", () => {
    expect(checkDictation("Guten Morgen", "").score).toBe(0);
  });

  it("compares characters for languages without spaces", () => {
    const r = checkDictation("我喜欢喝茶。", "我喜欢喝茶", true);
    expect(r.score).toBe(100);
    expect(checkDictation("我喜欢喝茶。", "我喜欢喝咖", true).score).toBe(80);
  });
});
