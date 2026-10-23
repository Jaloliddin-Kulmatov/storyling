import { describe, expect, it } from "vitest";
import { grammarFor } from "../src/grammar";

const GRAMMAR = [...grammarFor("de"), ...grammarFor("tr")];

describe("grammar exercises", () => {
  it("has unique topic ids and every answer among its options", () => {
    expect(new Set(GRAMMAR.map((g) => g.id)).size).toBe(GRAMMAR.length);
    for (const g of GRAMMAR)
      for (const i of g.items) {
        expect(i.o, `${g.id}: ${i.q}`).toContain(i.a);
        expect(new Set(i.o).size, `${g.id}: ${i.q}`).toBe(i.o.length);
      }
  });
});
