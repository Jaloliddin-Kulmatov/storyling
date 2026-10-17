import { describe, expect, it } from "vitest";
import { coverage, fitFor, type Story } from "../src";

const story: Story = {
  id: "ko-rain",
  lang: "ko",
  sentences: [
    {
      tokens: [
        { surface: "준호는", lemma: "준호", isName: true },
        { surface: "우산이", lemma: "우산" },
        { surface: "없었어요", lemma: "없다" },
        { surface: "." },
      ],
    },
    {
      tokens: [
        { surface: "버스", lemma: "버스" },
        { surface: "정류장까지", lemma: "정류장" },
        { surface: "뛰어갔어요", lemma: "뛰어가다" },
        { surface: "." },
      ],
    },
  ],
};

describe("coverage", () => {
  it("ignores punctuation and names", () => {
    expect(coverage(story, () => 1).total).toBe(5);
  });

  it("averages pKnown over countable tokens and lists likely-new words", () => {
    const known: Record<string, number> = { 우산: 1, 없다: 1, 버스: 1, 정류장: 0, 뛰어가다: 0.4 };
    const c = coverage(story, (l) => known[l] ?? 0);
    expect(c.ratio).toBeCloseTo(3.4 / 5);
    expect(c.percent).toBe(68);
    expect(c.newWords.sort()).toEqual(["뛰어가다", "정류장"].sort());
    expect(c.fit).toBe("too_hard");
  });

  it("treats an empty story as fully covered", () => {
    expect(coverage({ id: "e", lang: "ko", sentences: [] }, () => 0).ratio).toBe(1);
  });
});

describe("fitFor", () => {
  it("uses the Blueprint bands", () => {
    expect(fitFor(0.99)).toBe("easy");
    expect(fitFor(0.98)).toBe("easy");
    expect(fitFor(0.96)).toBe("just_right");
    expect(fitFor(0.92)).toBe("stretch");
    expect(fitFor(0.85)).toBe("too_hard");
  });
});
