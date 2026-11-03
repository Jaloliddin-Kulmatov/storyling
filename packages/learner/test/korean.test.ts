import { describe, expect, it } from "vitest";
import { koreanLabels, romanize, splitKorean } from "../src/korean";

describe("korean aids", () => {
  it("romanizes", () => {
    expect(romanize("안녕하세요")).toBe("annyeonghaseyo");
    expect(romanize("감사합니다")).toBe("gamsahamnida");
    expect(romanize("먹어요")).toBe("meogeoyo");
    expect(romanize("한국어")).toBe("hangugeo");
  });
  it("labels honorifics and speech levels", () => {
    expect(koreanLabels("좋아하세요")).toEqual({ honorific: true, speech: "polite (해요)" });
    expect(koreanLabels("감사합니다")).toEqual({ honorific: false, speech: "formal polite (합니다)" });
    expect(koreanLabels("할머니께")).toEqual({ honorific: true });
    expect(koreanLabels("먹었어요").honorific).toBe(false);
  });
  it("splits particles and endings", () => {
    expect(splitKorean("준호는", "준호")).toEqual({ stem: "준호", ending: "는", gloss: "topic particle" });
    expect(splitKorean("회사에", "회사")).toEqual({ stem: "회사", ending: "에", gloss: "at / to / in (place or time)" });
    expect(splitKorean("출근했어요", "출근하다")?.gloss).toBe("did (past tense, polite)");
    expect(splitKorean("오늘", "오늘")).toBeUndefined();
  });
});
