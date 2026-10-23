import { describe, expect, it } from "vitest";
import { GRAMMAR } from "../src/grammar";

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
