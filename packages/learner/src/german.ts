import { lookup } from "@storyling/content";
import type { Sentence } from "@storyling/core";

export type Case = "Nom" | "Akk" | "Dat" | "Gen";
export interface GrammarNote {
  /** Token indexes the note is about (highlighted together). */
  at: number[];
  kind: "case" | "verb2" | "verbEnd" | "separable" | "perfect";
  case?: Case;
  label: string;
  why: string;
}

const DAT = new Set(["mit", "bei", "nach", "von", "zu", "aus", "seit", "gegenüber", "ab", "außer"]);
const AKK = new Set(["für", "durch", "gegen", "ohne", "um", "bis", "entlang"]);
const TWO_WAY = new Set(["in", "an", "auf", "über", "unter", "vor", "hinter", "neben", "zwischen"]);
const GEN = new Set(["wegen", "trotz", "während", "statt", "innerhalb", "außerhalb"]);
const CONTRACT: Record<string, [string, Case]> = {
  im: ["in dem", "Dat"], am: ["an dem", "Dat"], beim: ["bei dem", "Dat"], vom: ["von dem", "Dat"], zum: ["zu dem", "Dat"], zur: ["zu der", "Dat"],
  ins: ["in das", "Akk"], ans: ["an das", "Akk"], aufs: ["auf das", "Akk"],
};
const SUB = new Set(["weil", "dass", "wenn", "ob", "obwohl", "damit", "bevor", "nachdem", "als", "bis", "seit", "seitdem", "während", "sodass", "falls", "da", "wo", "wie"]);
const DAT_ART = /^(dem|einem|keinem|meinem|deinem|seinem|ihrem|unserem|eurem|diesem|jedem)$/i;
const AKK_ART = /^(den|einen|keinen|meinen|deinen|seinen|ihren|unseren|euren|diesen|jeden)$/i;
const GEN_ART = /^(des|eines|keines|meines|deines|seines|ihres|unseres|eures|dieses|jedes)$/i;
const FEM_DAT = /^(der|einer|keiner|meiner|deiner|seiner|ihrer|unserer|eurer|dieser|jeder)$/i;
const TIME = new Set(["Morgen", "Abend", "Tag", "Nacht", "Woche", "Monat", "Jahr", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag", "Wochenende", "Mal", "Stunde", "Minute", "Sommer", "Winter", "Frühling", "Herbst"]);
const AUX = new Set(["haben", "sein", "werden", "können", "müssen", "wollen", "sollen", "dürfen", "mögen", "möchten"]);

const posOf = (lemma?: string) => (lemma ? lookup("de", lemma)?.pos : undefined);
const word = (s: string) => /\p{L}/u.test(s);

/** Rule-based notes for one German sentence: cases after prepositions and articles, and where the verb goes. Instant, no AI. */
export function germanNotes(sentence: Sentence): GrammarNote[] {
  const t = sentence.tokens;
  const notes: GrammarNote[] = [];
  const used = new Set<number>();
  const next = (i: number) => { for (let j = i + 1; j < t.length; j++) if (word(t[j]!.surface)) return j; return -1; };
  const nounAfter = (i: number) => { for (let j = i + 1; j < Math.min(t.length, i + 4); j++) if (posOf(t[j]!.lemma) === "noun") return j; return -1; };

  t.forEach((tok, i) => {
    const s = tok.surface.toLowerCase();
    // Prepositions and the case they take.
    if (CONTRACT[s]) {
      const [full, c] = CONTRACT[s];
      const n = nounAfter(i);
      const when = n >= 0 && TIME.has(t[n]!.lemma ?? "");
      notes.push({ at: n >= 0 ? [i, n] : [i], kind: "case", case: c, label: `${tok.surface} = ${full} → ${c === "Dat" ? "Dativ" : "Akkusativ"}`, why: when ? `Time: “${tok.surface} ${t[n]!.surface}” uses the dative.` : c === "Dat" ? (TWO_WAY.has(full.split(" ")[0]!) ? "Where? (location) → dative." : `“${full.split(" ")[0]}” always takes the dative.`) : "Where to? (direction) → accusative." });
      used.add(i);
      return;
    }
    const pos = posOf(tok.lemma);
    // "zu" before an infinitive (zu sprechen) is not a preposition.
    if (s === "zu" && posOf(t[next(i)]?.lemma) === "verb") return;
    if (pos === "preposition" || DAT.has(s) || AKK.has(s) || TWO_WAY.has(s) || GEN.has(s)) {
      const a = next(i);
      const art = a >= 0 ? t[a]!.surface : "";
      const n = nounAfter(i);
      const at = [i, ...(a >= 0 && a !== n ? [a] : []), ...(n >= 0 ? [n] : [])];
      if (DAT.has(s)) notes.push({ at, kind: "case", case: "Dat", label: `${tok.surface} + Dativ`, why: `“${s}” always takes the dative (mit, bei, nach, von, zu, aus, seit).` });
      else if (AKK.has(s)) notes.push({ at, kind: "case", case: "Akk", label: `${tok.surface} + Akkusativ`, why: `“${s}” always takes the accusative (für, durch, gegen, ohne, um).` });
      else if (GEN.has(s) && GEN_ART.test(art)) notes.push({ at, kind: "case", case: "Gen", label: `${tok.surface} + Genitiv`, why: `“${s}” takes the genitive in written German.` });
      else if (TWO_WAY.has(s)) {
        if (DAT_ART.test(art) || FEM_DAT.test(art)) notes.push({ at, kind: "case", case: "Dat", label: `${tok.surface} + Dativ (wo?)`, why: `“${s}” is a two-way preposition: location (where?) → dative.` });
        else if (AKK_ART.test(art) || /^(das|die|eine|ein)$/i.test(art)) notes.push({ at, kind: "case", case: "Akk", label: `${tok.surface} + Akkusativ (wohin?)`, why: `“${s}” is a two-way preposition: direction (where to?) → accusative. With location it would be dative.` });
      }
      at.forEach((x) => used.add(x));
    }
  });

  // Articles that show their case on their own (outside prepositional phrases).
  t.forEach((tok, i) => {
    if (used.has(i)) return;
    const s = tok.surface;
    const n = nounAfter(i);
    const time = n >= 0 && TIME.has(t[n]!.lemma ?? "");
    if (GEN_ART.test(s) && time) notes.push({ at: [i, n], kind: "case", case: "Gen", label: `${s} ${t[n]!.surface}`, why: `A fixed time phrase in the genitive (“${s.toLowerCase()} ${t[n]!.surface}” = one ${t[n]!.surface === "Tages" ? "day" : "time"}).` });
    else if (/^(jeden|jede|jedes|nächsten|letzten|diesen|den ganzen)$/i.test(s) && time) notes.push({ at: [i, n], kind: "case", case: "Akk", label: `${s} ${t[n]!.surface} → Akkusativ`, why: "Time expressions without a preposition (jeden Tag, nächsten Montag) are in the accusative." });
    else if (AKK_ART.test(s) && !/^den$/i.test(s) || /^den$/i.test(s) && n >= 0 && !/n$/.test(t[n]!.surface))
      notes.push({ at: n >= 0 ? [i, n] : [i], kind: "case", case: "Akk", label: `${s}${n >= 0 ? ` ${t[n]!.surface}` : ""} → Akkusativ`, why: "The direct object (who/what is acted on) is accusative: der → den, ein → einen." });
    else if (DAT_ART.test(s)) notes.push({ at: n >= 0 ? [i, n] : [i], kind: "case", case: "Dat", label: `${s}${n >= 0 ? ` ${t[n]!.surface}` : ""} → Dativ`, why: "The indirect object (to/for whom) is dative: der/das → dem." });
    else if (GEN_ART.test(s)) notes.push({ at: n >= 0 ? [i, n] : [i], kind: "case", case: "Gen", label: `${s}${n >= 0 ? ` ${t[n]!.surface}` : ""} → Genitiv`, why: "Genitiv shows belonging (“of”): der/das → des, and the noun often adds -s." });
  });

  // Verb position: V2 in main clauses, verb at the end after a subordinating conjunction.
  const verbs = t.map((x, i) => ({ i, pos: posOf(x.lemma), lemma: x.lemma ?? "" })).filter((v) => v.pos === "verb");
  const subAt = t.findIndex((x, i) => i > 0 && SUB.has(x.surface.toLowerCase()) && posOf(x.lemma) === "conjunction" && t[i - 1]!.surface === ",") ;
  const startSub = SUB.has(t[0]?.surface.toLowerCase() ?? "") && posOf(t[0]?.lemma) === "conjunction";
  const first = verbs[0];
  if (first && !startSub && (subAt < 0 || first.i < subAt)) {
    const before = t.slice(0, first.i).filter((x) => word(x.surface));
    if (before.length >= 1) {
      // Inverted when the first part is not the subject: a time/place phrase, an adverb, an object.
      const p0 = posOf(t[0]!.lemma);
      const inverted = p0 === "preposition" || p0 === "adverb" || p0 === "contraction" || p0 === "adjective" || p0 === "number" || AKK_ART.test(t[0]!.surface) || DAT_ART.test(t[0]!.surface) || GEN_ART.test(t[0]!.surface);
      notes.push({ at: [first.i], kind: "verb2", label: `${t[first.i]!.surface} → position 2`, why: inverted
        ? `The sentence starts with “${before.map((x) => x.surface).join(" ")}”, so the verb still comes second and the subject moves after it.`
        : "In a main clause the conjugated verb is always the second part." });
    }
    // Helper verb + participle/infinitive at the end.
    const last = verbs[verbs.length - 1]!;
    if (AUX.has(first.lemma) && last.i > first.i + 1 && (subAt < 0 || last.i < subAt))
      notes.push({ at: [first.i, last.i], kind: first.lemma === "haben" || first.lemma === "sein" ? "perfect" : "verbEnd", label: `${t[first.i]!.surface} … ${t[last.i]!.surface}`, why: first.lemma === "haben" || first.lemma === "sein" ? "Perfekt: haben/sein in position 2, the participle (ge-…-t / ge-…-en) at the end." : "Modal or helper verb in position 2, the main verb goes to the end." });
  }
  if (subAt >= 0 || startSub) {
    const from = startSub ? 0 : subAt;
    const inSub = verbs.filter((v) => v.i > from);
    const end = startSub ? inSub.find((v) => t[v.i + 1]?.surface === ",") ?? inSub[0] : inSub[inSub.length - 1];
    if (end) notes.push({ at: [from, end.i], kind: "verbEnd", label: `${t[from]!.surface} … ${t[end.i]!.surface}`, why: `After “${t[from]!.surface.toLowerCase()}” the conjugated verb goes to the end of the clause.` });
  }
  return notes;
}
