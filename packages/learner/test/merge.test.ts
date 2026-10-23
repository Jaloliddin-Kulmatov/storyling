import { beforeEach, describe, expect, it } from "vitest";
import { configureStorage, dayPoints, exportStore, mergeIntoStore } from "../src/index";

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};
const profile = (over: object) => ({ level: 1, words: {}, finished: [], stories: [], log: {}, quiz: { right: 0, total: 0 }, favorites: [], games: {}, history: [], ...over });
const word = (lemma: string, over: object = {}) => ({ lemma, pKnown: 0.5, encounters: 1, taps: 0, ...over });

describe("sync merge", () => {
  beforeEach(() => configureStorage(mem()));

  it("keeps work from both devices", () => {
    configureStorage({ getItem: () => JSON.stringify({ profiles: { de: profile({ words: { a: word("a", { saved: "learning" }) }, finished: ["s1"], log: { "2026-10-01": { seconds: 600, words: 50, stories: 1 } }, games: { match: { played: 2, best: 70 } } }) }, settings: {} }), setItem: () => {} });
    const remote = { profiles: { de: profile({ words: { a: word("a", { encounters: 5 }), b: word("b") }, finished: ["s2"], log: { "2026-10-01": { seconds: 300, words: 80, stories: 0 } }, games: { match: { played: 1, best: 90 } } }) }, settings: {} };
    mergeIntoStore(JSON.stringify(remote));
    const m = JSON.parse(exportStore()).profiles.de;
    expect(Object.keys(m.words).sort()).toEqual(["a", "b"]);
    expect(m.words.a.saved).toBe("learning");
    expect(m.words.a.encounters).toBe(5);
    expect(m.finished.sort()).toEqual(["s1", "s2"]);
    expect(m.log["2026-10-01"]).toEqual({ seconds: 600, words: 80, stories: 1 });
    expect(m.games.match).toEqual({ played: 2, best: 90 });
  });

  it("scores a day: 2 per minute, 1 per word, 10 per story", () => {
    configureStorage({ getItem: () => JSON.stringify({ profiles: { de: profile({ log: { "2026-10-02": { seconds: 300, words: 40, stories: 1 } } }), es: profile({ log: { "2026-10-02": { seconds: 60, words: 10, stories: 0 } } }) }, settings: {} }), setItem: () => {} });
    expect(dayPoints()["2026-10-02"]).toBe(10 + 40 + 10 + 2 + 10);
  });
});
