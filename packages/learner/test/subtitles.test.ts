import { describe, expect, it } from "vitest";
import { cueAt, parseCues } from "../src/subtitles";

describe("subtitles", () => {
  it("parses SRT and VTT", () => {
    const srt = "1\n00:00:01,000 --> 00:00:03,500\nHallo, ich bin <i>Nico</i>.\n\n2\n00:00:04,000 --> 00:00:06,000\nWie geht's?\n";
    const vtt = "WEBVTT\n\n00:01.000 --> 00:03.500\nHallo!\n\n01:00:00.250 --> 01:00:02.000 align:start\nTschüss.";
    expect(parseCues(srt)).toEqual([
      { start: 1, end: 3.5, text: "Hallo, ich bin Nico." },
      { start: 4, end: 6, text: "Wie geht's?" },
    ]);
    const v = parseCues(vtt);
    expect(v.map((c) => c.text)).toEqual(["Hallo!", "Tschüss."]);
    expect(v[1]!.start).toBe(3600.25);
  });
  it("parses a transcript copied from YouTube", () => {
    expect(parseCues("0:01\nHallo!\n0:04\nWie geht es dir?\n1:02:03\nTschüss")).toEqual([
      { start: 1, end: 4, text: "Hallo!" },
      { start: 4, end: 3723, text: "Wie geht es dir?" },
      { start: 3723, end: 3728, text: "Tschüss" },
    ]);
  });
  it("finds the current cue", () => {
    const c = parseCues("00:00:01,000 --> 00:00:02,000\na\n\n00:00:05,000 --> 00:00:06,000\nb");
    expect([cueAt(c, 0), cueAt(c, 1.5), cueAt(c, 3), cueAt(c, 9)]).toEqual([-1, 0, 0, 1]);
  });
});
