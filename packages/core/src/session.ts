import type { ReviewGrade } from "./scheduler";
import type { Story, WordEvent } from "./types";

/** Distinct countable lemmas in a story, in reading order. */
export function storyLemmas(story: Story): string[] {
  const seen = new Set<string>();
  for (const s of story.sentences) {
    for (const t of s.tokens) {
      if (t.lemma && !t.isName) seen.add(t.lemma);
    }
  }
  return [...seen];
}

/**
 * Events produced by finishing a story: one per distinct lemma.
 * A tapped word counts as a lookup; every other word was read past.
 */
export function readingEvents(story: Story, tapped: ReadonlySet<string>, at: number): WordEvent[] {
  return storyLemmas(story).map((lemma) => ({ lemma, at, type: tapped.has(lemma) ? "tap" : "read_past" }));
}

/**
 * "Reading counts as review": a due flashcard word that appears in the story is graded
 * by what happened while reading. Read past without tapping = good; tapped = again.
 * Words that didn't appear are left for normal review.
 */
export function narrativeReviews(
  story: Story,
  dueLemmas: ReadonlySet<string>,
  tapped: ReadonlySet<string>,
): Map<string, ReviewGrade> {
  const grades = new Map<string, ReviewGrade>();
  for (const lemma of storyLemmas(story)) {
    if (dueLemmas.has(lemma)) grades.set(lemma, tapped.has(lemma) ? "again" : "good");
  }
  return grades;
}
