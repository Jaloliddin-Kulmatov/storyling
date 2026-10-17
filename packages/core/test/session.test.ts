import { describe, expect, it } from "vitest";
import { narrativeReviews, readingEvents, storyLemmas, type Story } from "../src";

const story: Story = {
  id: "s",
  lang: "ko",
  sentences: [
    { tokens: [{ surface: "준호는", lemma: "준호", isName: true }, { surface: "우산이", lemma: "우산" }, { surface: "." }] },
    { tokens: [{ surface: "우산을", lemma: "우산" }, { surface: "정류장", lemma: "정류장" }, { surface: "기분", lemma: "기분" }] },
  ],
};

describe("storyLemmas", () => {
  it("lists each countable lemma once, in reading order", () => {
    expect(storyLemmas(story)).toEqual(["우산", "정류장", "기분"]);
  });
});

describe("readingEvents", () => {
  it("emits a tap for tapped words and read_past for the rest", () => {
    const events = readingEvents(story, new Set(["정류장"]), 42);
    expect(events).toEqual([
      { lemma: "우산", at: 42, type: "read_past" },
      { lemma: "정류장", at: 42, type: "tap" },
      { lemma: "기분", at: 42, type: "read_past" },
    ]);
  });
});

describe("narrativeReviews", () => {
  it("grades due words found in the story and skips the rest", () => {
    const grades = narrativeReviews(story, new Set(["우산", "정류장", "놓치다"]), new Set(["정류장"]));
    expect(Object.fromEntries(grades)).toEqual({ 우산: "good", 정류장: "again" });
  });
});
