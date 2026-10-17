import { describe, expect, it } from "vitest";
import { fitFor, recommend, score, type Candidate } from "../src";

const cand = (id: string, ratio: number, extra: Partial<Candidate> = {}): Candidate => ({
  id,
  coverage: { ratio, percent: Math.round(ratio * 100), total: 100, newWords: [], fit: fitFor(ratio) },
  continuesSeries: false,
  interestMatch: 0,
  dueWordsInside: 0,
  ageDays: 30,
  recentlyAbandoned: false,
  finished: false,
  ...extra,
});

describe("recommend", () => {
  it("prefers stories near 96.5% coverage", () => {
    const order = recommend([cand("hard", 0.8), cand("right", 0.965), cand("easy", 1)]).map((c) => c.id);
    expect(order[0]).toBe("right");
  });

  it("boosts the next episode of a series the learner is reading", () => {
    expect(score(cand("next", 0.93, { continuesSeries: true }))).toBeGreaterThan(score(cand("other", 0.96)));
  });

  it("drops finished stories and demotes abandoned ones", () => {
    const order = recommend([
      cand("done", 0.965, { finished: true }),
      cand("abandoned", 0.965, { recentlyAbandoned: true }),
      cand("fine", 0.95),
    ]).map((c) => c.id);
    expect(order).toEqual(["fine", "abandoned"]);
  });
});
