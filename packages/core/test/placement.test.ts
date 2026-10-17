import { describe, expect, it } from "vitest";
import { estimateVocabulary, type PlacementItem } from "../src";

const band = (min: number, max: number, yes: number, n: number): PlacementItem[] =>
  Array.from({ length: n }, (_, i) => ({ bandMin: min, bandMax: max, saidKnown: i < yes }));
const fakes = (yes: number, n: number): PlacementItem[] =>
  Array.from({ length: n }, (_, i) => ({ bandMax: null, saidKnown: i < yes }));

describe("estimateVocabulary", () => {
  it("sums band coverage when the learner never claims fake words", () => {
    const items = [...band(0, 1000, 8, 8), ...band(1000, 2000, 4, 8), ...band(2000, 3000, 0, 8), ...fakes(0, 6)];
    const r = estimateVocabulary(items);
    expect(r.vocabEstimate).toBe(1500);
    expect(r.falseAlarmRate).toBe(0);
    expect(r.unreliable).toBe(false);
  });

  it("lowers the estimate when the learner claims fake words", () => {
    const honest = estimateVocabulary([...band(0, 1000, 6, 8), ...fakes(0, 6)]);
    const guessing = estimateVocabulary([...band(0, 1000, 6, 8), ...fakes(2, 6)]);
    expect(guessing.vocabEstimate).toBeLessThan(honest.vocabEstimate);
  });

  it("flags heavy guessing as unreliable", () => {
    const r = estimateVocabulary([...band(0, 1000, 8, 8), ...fakes(4, 6)]);
    expect(r.unreliable).toBe(true);
  });

  it("never goes negative", () => {
    const r = estimateVocabulary([...band(0, 1000, 1, 8), ...fakes(5, 6)]);
    expect(r.vocabEstimate).toBeGreaterThanOrEqual(0);
  });
});
