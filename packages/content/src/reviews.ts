/**
 * Native-speaker review status per story. Add an entry when a fluent speaker has checked a story's text,
 * translation and audio: { "de-park": { by: "Name", date: "2026-11-10" } }.
 * The reader shows "Checked by a native speaker" for these, and a short note for the rest.
 */
export interface Review {
  by: string;
  date: string;
  notes?: string;
}

export const REVIEWS: Record<string, Review> = {};

export const reviewOf = (storyId: string): Review | undefined => REVIEWS[storyId];
