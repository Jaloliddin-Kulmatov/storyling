import { describe, expect, it } from "vitest";
import { applyEvent, displayState, KNOWN_THRESHOLD, newUserWord, priorPKnown, replay } from "../src";

describe("priorPKnown", () => {
  it("is high for frequent words inside the vocabulary and low far outside", () => {
    expect(priorPKnown(100, 2000)).toBeGreaterThan(0.9);
    expect(priorPKnown(2000, 2000)).toBeCloseTo(0.5, 1);
    expect(priorPKnown(8000, 2000)).toBeLessThan(0.05);
  });

  it("handles an empty vocabulary", () => {
    expect(priorPKnown(1, 0)).toBeLessThan(0.05);
  });
});

describe("applyEvent", () => {
  const at = 0;

  it("raises pKnown when a word is read past and lowers it on a tap", () => {
    const w = newUserWord("우산", 0.5);
    expect(applyEvent(w, { type: "read_past", lemma: "우산", at }).pKnown).toBeGreaterThan(0.5);
    expect(applyEvent(w, { type: "tap", lemma: "우산", at }).pKnown).toBeLessThan(0.5);
  });

  it("counts encounters and taps", () => {
    let w = newUserWord("우산", 0.3);
    w = applyEvent(w, { type: "tap", lemma: "우산", at });
    w = applyEvent(w, { type: "read_past", lemma: "우산", at });
    w = applyEvent(w, { type: "review_good", lemma: "우산", at });
    expect(w.encounters).toBe(2);
    expect(w.taps).toBe(1);
  });

  it("does not mutate its input", () => {
    const w = newUserWord("우산", 0.5);
    applyEvent(w, { type: "review_easy", lemma: "우산", at });
    expect(w.pKnown).toBe(0.5);
  });

  it("keeps pKnown inside (0, 1) under many events", () => {
    let w = newUserWord("x", 0.5);
    for (let i = 0; i < 100; i++) w = applyEvent(w, { type: "review_easy", lemma: "x", at });
    expect(w.pKnown).toBeLessThan(1);
    for (let i = 0; i < 200; i++) w = applyEvent(w, { type: "review_again", lemma: "x", at });
    expect(w.pKnown).toBeGreaterThan(0);
  });
});

describe("replay", () => {
  it("applies events in time order regardless of arrival order", () => {
    const start = newUserWord("w", 0.5);
    const events = [
      { type: "tap" as const, lemma: "w", at: 3 },
      { type: "read_past" as const, lemma: "w", at: 1 },
      { type: "review_good" as const, lemma: "w", at: 2 },
    ];
    const reversed = [...events].reverse();
    expect(replay(start, events)).toEqual(replay(start, reversed));
  });
});

describe("displayState", () => {
  it("maps scores and learner choices to reader states", () => {
    expect(displayState(undefined)).toBe("new");
    expect(displayState({ ...newUserWord("a", 0.2) })).toBe("new");
    expect(displayState({ ...newUserWord("a", 0.2), encounters: 1 })).toBe("learning");
    expect(displayState(newUserWord("a", KNOWN_THRESHOLD))).toBe("known");
    expect(displayState({ ...newUserWord("a", 0.99), saved: "learning" })).toBe("learning");
    expect(displayState({ ...newUserWord("a", 0.1), saved: "ignored" })).toBe("ignored");
  });
});
