import { language, languages } from "@storyling/content";
import { describe, expect, it } from "vitest";
import { placementResult, placementWords } from "../src/placement";

describe("word test", () => {
  it("samples words from every level for every language", () => {
    for (const l of languages) {
      const sample = placementWords(l.code);
      const levels = new Set(sample.map((w) => w.level));
      expect(levels.size, l.code).toBe(language(l.code).levels.length);
    }
  });

  it("knowing nothing passes no level", () => {
    const sample = placementWords("de");
    const r = placementResult("de", sample, new Set());
    expect(r.passed).toBe(-1);
    expect(r.level).toBe(0);
  });

  it("knowing the easiest words passes level 1 and marks all of its words known", () => {
    const sample = placementWords("de");
    const r = placementResult("de", sample, new Set(sample.filter((w) => w.level === 0).map((w) => w.lemma)));
    expect(r.passed).toBe(0);
    expect(r.level).toBe(1);
    expect(r.known.length).toBeGreaterThan(sample.filter((w) => w.level === 0).length);
  });

  it("a level cannot be passed after failing an easier one", () => {
    const sample = placementWords("de");
    const r = placementResult("de", sample, new Set(sample.filter((w) => w.level === 2).map((w) => w.lemma)));
    expect(r.passed).toBe(-1);
  });

  it("knowing everything passes every level", () => {
    const sample = placementWords("de");
    const r = placementResult("de", sample, new Set(sample.map((w) => w.lemma)));
    expect(r.passed).toBe(language("de").levels.length - 1);
    expect(r.level).toBe(2);
  });
});
