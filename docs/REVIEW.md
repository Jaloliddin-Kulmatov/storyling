# Native-speaker review

Every story should be checked by a fluent speaker before Storyling is promoted for that language.

## What to check

1. **Text:** natural, correct, right level (A1–C1, TOPIK Level 1–3). Mark awkward sentences.
2. **Translation:** English line says the same thing.
3. **Dictionary:** each tapped word shows the right base form and meaning (German: also der/die/das).
4. **Audio:** the recording says the sentence correctly.

## Recording a review

Add the story to `packages/content/src/reviews.ts`:

```ts
export const REVIEWS: Record<string, Review> = {
  "de-park": { by: "Anna M.", date: "2026-11-10" },
};
```

The reader then shows "Checked by a native speaker" on that story. Fix any problems in the story file first
(`packages/content/src/more/*.ts`), then regenerate its audio.

## Priority

1. Korean Level 1–2 (`ko-*` in `more/ko3.ts`, `more/ko.ts`, `more/ko2.ts`)
2. German A1–A2 (`more/de.ts`, `more/de2.ts`, `more/de3.ts`)
3. Turkish (all), then the other beta languages
