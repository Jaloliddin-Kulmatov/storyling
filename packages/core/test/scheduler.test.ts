import { describe, expect, it } from "vitest";
import { isDue, newCard, previewIntervals, review } from "../src";

const now = new Date("2026-10-06T09:00:00Z");
const DAY = 86_400_000;

describe("scheduler", () => {
  it("makes a new card due immediately", () => {
    expect(isDue(newCard(now), now)).toBe(true);
  });

  it("pushes the next review further out for better grades", () => {
    const p = previewIntervals(newCard(now), now);
    expect(p.again).toBeLessThan(p.good);
    expect(p.good).toBeLessThanOrEqual(p.easy);
  });

  it("grows intervals after repeated good reviews", () => {
    let card = review(newCard(now), "good", now);
    let t = card.due;
    card = review(card, "good", t);
    const first = card.due.getTime() - t.getTime();
    t = card.due;
    card = review(card, "good", t);
    const second = card.due.getTime() - t.getTime();
    expect(second).toBeGreaterThan(first);
    expect(second).toBeGreaterThanOrEqual(DAY);
  });
});
